import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GatewayStore, gatewayCombinationPassed, type GatewayInput } from "../../src/core/agent-runtime.js";
import { discoverGatewayReasoning } from "../../src/core/gateway-reasoning-discovery.js";
import { PROTOCOL_ROUTER_COMPATIBILITY_VERSION } from "../../src/core/protocol-router.js";

const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))); });
const input: GatewayInput = { name: "Automatic", url: "https://gateway.example/v1", apiKey: "private-discovery-key",
  protocol: "responses", models: ["model"], defaultModel: "model" };
const valid = () => Response.json({ output: [{ type: "message", content: [{ type: "output_text", text: "ok" }] }] });
function provider() {
  const requests: Record<string, any>[] = [];
  const fetchImpl = vi.fn(async (_url: unknown, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)); requests.push(body);
    if (body.reasoning?.effort && !["low", "medium", "high"].includes(body.reasoning.effort))
      return Response.json({ error: { message: "Invalid reasoning.effort: expected 'low', 'medium', 'high'" } }, { status: 400 });
    if (body.stream) {
      const tool = Boolean(body.tools?.length);
      return new Response((tool
        ? 'data: {"type":"response.output_item.added","output_index":0,"item":{"type":"function_call","id":"item","call_id":"call","name":"openfars_probe","arguments":"{\\"value\\":\\"ok\\"}"}}\n\n'
        : 'data: {"type":"response.output_text.delta","delta":"ok"}\n\n') +
        'data: {"type":"response.completed","response":{"status":"completed"}}\n\n', { headers: { "content-type": "text/event-stream" } });
    }
    if (body.tools?.length) return Response.json({ output: [{ type: "function_call", call_id: "call", name: "openfars_probe", arguments: '{"value":"ok"}' }] });
    return valid();
  }) as unknown as typeof fetch;
  return { fetchImpl, requests };
}

describe("automatic gateway reasoning discovery", () => {
  it("requires negative validation evidence, verifies the advertised values and prefers high", async () => {
    const f = provider();
    const result = await discoverGatewayReasoning(input, "model", { fetch: f.fetchImpl, timeoutMs: 1000 });
    expect(result).toMatchObject({ status: "verified", config: { parameter: "reasoning.effort", defaultOptionId: "high",
      options: [{ id: "low" }, { id: "medium" }, { id: "high" }] } });
    expect(f.requests).toHaveLength(5);
    expect(result.message).toContain("不单独证明");
    expect(JSON.stringify(result)).not.toContain(input.apiKey);
  });

  it("does not treat HTTP 200 for an invalid value as parameter support", async () => {
    const fetchImpl = vi.fn(async () => valid());
    const result = await discoverGatewayReasoning(input, "model", { fetch: fetchImpl, timeoutMs: 1000 });
    expect(result).toMatchObject({ status: "unconfirmed" }); expect(result.config).toBeUndefined();
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("does not confuse unknown fields with a supported enum", async () => {
    let calls = 0;
    const result = await discoverGatewayReasoning(input, "model", { timeoutMs: 1000, fetch: async () => ++calls === 1
      ? valid() : Response.json({ error: { message: "Unknown parameter reasoning.effort: extra inputs are not permitted" } }, { status: 400 }) });
    expect(result.status).toBe("unconfirmed"); expect(result.config).toBeUndefined();
  });

  it("stops on authentication failure and redacts an echoed credential", async () => {
    const f = vi.fn(async () => Response.json({ error: { message: `Invalid key ${input.apiKey}` } }, { status: 401 }));
    const result = await discoverGatewayReasoning(input, "model", { fetch: f, timeoutMs: 1000 });
    expect(result.status).toBe("failed"); expect(result.message).toContain("HTTP 401");
    expect(JSON.stringify(result)).not.toContain(input.apiKey); expect(f).toHaveBeenCalledOnce();
  });

  it("caches discovery across connection tests and service reopen, then invalidates changed credentials", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "reasoning-discovery-")); roots.push(root);
    const f = provider(), options = { fetch: f.fetchImpl, resolveHostname: async () => ["93.184.216.34"], testTimeoutMs: 1000 };
    const store = new GatewayStore(root, options), gateway = await store.create(input);
    expect((await store.test(gateway.id)).reasoningOptionId).toBe("high");
    const discovered = (await store.get(gateway.id))!;
    expect(gatewayCombinationPassed(discovered, "responses", "model")).toBe(true);
    const invalidCalls = () => f.requests.filter(body => body.reasoning?.effort?.startsWith("__scienceevolve"));
    expect(invalidCalls()).toHaveLength(1);
    const reopened = new GatewayStore(root, options);
    await reopened.test(gateway.id); expect(invalidCalls()).toHaveLength(1);
    await reopened.update(gateway.id, { ...input, apiKey: "replacement-key", modelReasoning: discovered.modelReasoning });
    expect((await reopened.get(gateway.id))?.modelReasoning?.model).toBeUndefined();
    expect((await reopened.get(gateway.id))?.reasoningDetection?.model).toBeUndefined();
    await reopened.discoverReasoning(gateway.id); expect(invalidCalls()).toHaveLength(2);
  });

  it.each([
    { protocol: "chat-completions", parameter: "chat_template_kwargs.reasoning_effort", container: "chat_template_kwargs", field: "reasoning_effort" },
    { protocol: "anthropic-messages", parameter: "output_config.effort", container: "output_config", field: "effort" }
  ] as const)("discovers nested $parameter and falls back to medium if high is unavailable", async ({ protocol, parameter, container, field }) => {
    const result = await discoverGatewayReasoning({ ...input, protocol }, "model", { timeoutMs: 1000, fetch: async (_url, init) => {
      const body = JSON.parse(String(init?.body));
      const value = body[container]?.[field];
      if (value && !["low", "medium"].includes(value))
        return Response.json({ error: { message: `Invalid ${parameter}, expected 'low' or 'medium'` } }, { status: 400 });
      if (!value && (body.reasoning_effort || body.reasoning))
        return Response.json({ error: { message: "Unknown parameter" } }, { status: 400 });
      return valid();
    } });
    expect(result).toMatchObject({ status: "verified", config: { parameter, defaultOptionId: "medium" } });
  });

  it("does not overwrite edits made while a discovery request was in flight", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "reasoning-edited-")); roots.push(root);
    const f = provider();
    let release!: () => void, started!: () => void;
    const paused = new Promise<void>(resolve => { release = resolve; });
    const ready = new Promise<void>(resolve => { started = resolve; });
    const store = new GatewayStore(root, { resolveHostname: async () => ["93.184.216.34"], fetch: async (...args) => {
      started(); await paused; return f.fetchImpl(...args);
    } });
    const gateway = await store.create(input), discovery = store.discoverReasoning(gateway.id);
    await ready;
    await store.update(gateway.id, { ...input, apiKey: "changed-key" });
    const rejected = expect(discovery).rejects.toThrow(/配置.*变化/);
    release(); await rejected;
    expect((await store.get(gateway.id))?.reasoningDetection).toBeUndefined();
  });

  it("skips discovery for explicit options, disabled automation and invalid route selections", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "reasoning-optout-")); roots.push(root);
    const f = provider(), store = new GatewayStore(root, { fetch: f.fetchImpl, resolveHostname: async () => ["93.184.216.34"] });
    const gateway = await store.create({ ...input, autoReasoning: false });
    await store.test(gateway.id);
    expect(f.requests).toHaveLength(4);
    expect((await store.get(gateway.id))?.reasoningDetection).toBeUndefined();
    f.requests.splice(0);
    await store.update(gateway.id, { ...input, modelReasoning: { model: { parameter: "reasoning.effort",
      options: [{ id: "high", label: "High", value: "high" }] } } });
    await store.test(gateway.id, undefined, undefined, undefined, undefined, "high");
    expect(f.requests).toHaveLength(4);
    expect(f.requests.every(body => body.reasoning?.effort === "high")).toBe(true);
    f.requests.splice(0);
    await expect(store.test(gateway.id, "chat-completions")).rejects.toThrow(/协议/);
    await expect(store.testHarness(gateway.id, "missing-harness")).rejects.toThrow(/harness/);
    expect(f.requests).toHaveLength(0);
  });

  it("shares a model's concurrent discovery and retains manual settings", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "reasoning-single-flight-")); roots.push(root);
    const f = provider(), store = new GatewayStore(root, { fetch: f.fetchImpl, resolveHostname: async () => ["93.184.216.34"] });
    const gateway = await store.create(input);
    const results = await Promise.all([store.discoverReasoning(gateway.id), store.discoverReasoning(gateway.id)]);
    expect(results.every(result => result.status === "verified")).toBe(true); expect(f.requests).toHaveLength(5);
    await store.update(gateway.id, { ...input, modelReasoning: { model: { parameter: "reasoning_effort", options: [{ id: "deep", label: "Deep", value: "high" }] } } });
    const before = f.requests.length; await store.discoverReasoning(gateway.id);
    expect(f.requests).toHaveLength(before);
    expect((await store.get(gateway.id))?.modelReasoning?.model?.parameter).toBe("reasoning_effort");
  });

  it("keeps every model's matrix result at the final discovered gateway revision", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "reasoning-matrix-")); roots.push(root);
    const f = provider();
    const identity = { cacheKey: "fixture", adapterVersion: "fixture", executableFingerprint: "fixture",
      routerCompatibilityVersion: PROTOCOL_ROUTER_COMPATIBILITY_VERSION };
    const store = new GatewayStore(root, { fetch: f.fetchImpl, resolveHostname: async () => ["93.184.216.34"], adapterSmokeProbe: {
      harnessIds: () => ["codex"], nativeProtocol: () => "responses", cacheKey: async () => identity, runSmoke: async () => identity
    } });
    const gateway = await store.create({ ...input, models: ["model", "model-b"] });
    const result = await store.testMatrix(gateway.id);
    expect(result.results).toHaveLength(2);
    for (const model of ["model", "model-b"]) {
      expect(result.results.find(item => item.model === model)).toMatchObject({ status: "passed", reasoningOptionId: "high",
        gatewayRevision: result.gateway.revision });
      expect(await store.harnessCombinationPassed(gateway.id, "codex", model)).toBe(true);
    }
    expect(f.requests.filter(body => body.reasoning?.effort?.startsWith("__scienceevolve"))).toHaveLength(2);
  });

  it("keeps an already verified model valid when another model finishes discovery", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "reasoning-model-isolation-")); roots.push(root);
    const f = provider(), store = new GatewayStore(root, { fetch: f.fetchImpl, resolveHostname: async () => ["93.184.216.34"] });
    const gateway = await store.create({ ...input, models: ["model", "model-b"] });
    await store.test(gateway.id, "responses", "model");
    await store.discoverReasoning(gateway.id, "model-b");
    const current = (await store.get(gateway.id))!;
    expect(current.revision).toBe(gateway.revision);
    expect(gatewayCombinationPassed(current, "responses", "model")).toBe(true);
    await store.close();
  });

  it("keeps discovery cancellation from creating a cached failure", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "reasoning-cancelled-")); roots.push(root);
    const controller = new AbortController();
    const store = new GatewayStore(root, { resolveHostname: async () => ["93.184.216.34"], fetch: async () => {
      controller.abort(); throw new DOMException("aborted", "AbortError");
    } });
    const gateway = await store.create(input);
    await expect(store.discoverReasoning(gateway.id, "model", controller.signal)).rejects.toMatchObject({ name: "GatewayProbeCancelledError" });
    expect((await store.get(gateway.id))?.reasoningDetection).toBeUndefined();
  });

  it("queues saved models in the background with bounded concurrency and exposes progress without persisting it", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "reasoning-background-")); roots.push(root);
    const f = provider();
    let release!: () => void;
    const paused = new Promise<void>(resolve => { release = resolve; });
    let calls = 0;
    const store = new GatewayStore(root, { resolveHostname: async () => ["93.184.216.34"], fetch: async (...args) => {
      calls += 1; await paused; return f.fetchImpl(...args);
    } });
    const gateway = await store.create({ ...input, models: ["model", "model-b", "model-c"] });
    try {
      expect((await store.scheduleReasoningDiscovery(gateway.id)).reasoningDiscovery).toEqual({ model: "checking", "model-b": "checking", "model-c": "queued" });
      await vi.waitFor(() => expect(calls).toBe(2));
      expect((await store.list())[0]?.reasoningDiscovery?.["model-c"]).toBe("queued");
      const { readFile } = await import("node:fs/promises");
      expect(JSON.parse(await readFile(path.join(root, "gateways.json"), "utf8")).gateways[0].reasoningDiscovery).toBeUndefined();
      release();
      await vi.waitFor(async () => expect((await store.get(gateway.id))?.reasoningDiscovery).toBeUndefined());
      expect(Object.values((await store.get(gateway.id))!.reasoningDetection!).map(item => item.status)).toEqual(["verified", "verified", "verified"]);
      const before = calls;
      await store.scheduleReasoningDiscovery(gateway.id);
      expect(calls).toBe(before);
    } finally { release(); await store.close(); }
  });

  it("cancels background discovery on host close without recording a false failure", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "reasoning-close-")); roots.push(root);
    let started!: () => void;
    const ready = new Promise<void>(resolve => { started = resolve; });
    const store = new GatewayStore(root, { resolveHostname: async () => ["93.184.216.34"], fetch: async (_url, init) => {
      started();
      return new Promise<Response>((_resolve, reject) => {
        const abort = () => reject(new DOMException("aborted", "AbortError"));
        init!.signal!.addEventListener("abort", abort, { once: true });
        if (init!.signal!.aborted) abort();
      });
    } });
    const gateway = await store.create(input);
    await store.scheduleReasoningDiscovery(gateway.id);
    await ready; await store.close();
    expect((await store.get(gateway.id))?.reasoningDiscovery).toBeUndefined();
    expect((await store.get(gateway.id))?.reasoningDetection).toBeUndefined();
  });

  it("removes old automatic verification when the user edits the parameter mapping", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "reasoning-manual-edit-")); roots.push(root);
    const f = provider(), store = new GatewayStore(root, { fetch: f.fetchImpl, resolveHostname: async () => ["93.184.216.34"] });
    const gateway = await store.create(input);
    await store.discoverReasoning(gateway.id);
    await store.update(gateway.id, { ...input, modelReasoning: { model: { parameter: "reasoning_effort", options: [{ id: "custom", label: "Custom", value: "deep" }] } } });
    const before = f.requests.length;
    const saved = await store.scheduleReasoningDiscovery(gateway.id);
    expect(saved.reasoningDetection?.model).toBeUndefined();
    expect(saved.reasoningDiscovery).toBeUndefined();
    expect(saved.modelReasoning?.model?.options[0]?.value).toBe("deep");
    expect(f.requests).toHaveLength(before);
    await store.close();
  });

  it("cancels obsolete background requests when credentials are saved again", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "reasoning-background-edit-")); roots.push(root);
    const f = provider();
    let started!: () => void;
    const ready = new Promise<void>(resolve => { started = resolve; });
    const store = new GatewayStore(root, { resolveHostname: async () => ["93.184.216.34"], fetch: async (url, init) => {
      if (new Headers(init?.headers).get("authorization") !== `Bearer ${input.apiKey}`) return f.fetchImpl(url, init);
      started();
      return new Promise<Response>((_resolve, reject) => {
        const abort = () => reject(new DOMException("obsolete request", "AbortError"));
        init!.signal!.addEventListener("abort", abort, { once: true });
        if (init!.signal!.aborted) abort();
      });
    } });
    const gateway = await store.create(input);
    try {
      await store.scheduleReasoningDiscovery(gateway.id); await ready;
      await store.update(gateway.id, { ...input, apiKey: "new-key" });
      await store.scheduleReasoningDiscovery(gateway.id);
      await vi.waitFor(async () => expect((await store.get(gateway.id))?.reasoningDetection?.model?.status).toBe("verified"));
      expect((await store.get(gateway.id))?.modelReasoning?.model?.defaultOptionId).toBe("high");
    } finally { await store.close(); }
  });
});
