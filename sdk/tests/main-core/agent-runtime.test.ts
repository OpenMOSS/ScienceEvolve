import { afterEach, describe, expect, it, vi } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  GatewayStore,
  DEFAULT_MODEL_CONTEXT_WINDOW,
  gatewayCombinationPassed,
  nativeProtocolForHarness,
  systemGatewayInputFromEnvironment,
  validateGatewayUrl,
  type AdapterSmokeProbeRunner,
  type GatewayTestState
} from "../../src/core/agent-runtime.js";
import { PROTOCOL_ROUTER_COMPATIBILITY_VERSION } from "../../src/core/protocol-router.js";

const roots: string[] = [];

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

async function store(
  fetchImpl: typeof fetch = fetch,
  resolveHostname: (hostname: string) => Promise<readonly string[]> = async () => ["93.184.216.34"],
  adapterSmokeProbe: AdapterSmokeProbeRunner | undefined = successfulSmokeProbe()
): Promise<GatewayStore> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-gateways-"));
  roots.push(root);
  return new GatewayStore(root, {
    fetch: fetchImpl,
    resolveHostname,
    testTimeoutMs: 1_000,
    autoReasoning: false,
    ...(adapterSmokeProbe ? { adapterSmokeProbe } : {})
  });
}

function successfulSmokeProbe(): AdapterSmokeProbeRunner {
  const identity = (harness: string) => ({
    cacheKey: `cache-${harness}`,
    adapterVersion: "fixture-adapter-1",
    executableFingerprint: `fixture-executable-${harness}`,
    routerCompatibilityVersion: PROTOCOL_ROUTER_COMPATIBILITY_VERSION
  });
  return {
    harnessIds: () => ["dsh", "pi", "codex", "claude-code"],
    nativeProtocol: nativeProtocolForHarness,
    cacheKey: async ({ harness }) => identity(harness),
    runSmoke: async ({ harness }) => identity(harness)
  };
}

const gatewayInput = {
  name: "AIGW",
  url: "https://gateway.example.com/v1/",
  apiKey: "server-secret",
  models: ["nex-agi/Nex-N2-Pro", "model-b"],
  defaultModel: "nex-agi/Nex-N2-Pro",
  protocol: "responses" as const
};

async function successfulResponsesProbeForTest(
  _input: string | URL | Request,
  init?: RequestInit
): Promise<Response> {
  const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
  const toolProbe = body.tool_choice !== undefined;
  if (body.stream === true) {
    const frames = toolProbe ? [
      'data: {"type":"response.output_item.added","output_index":0,"item":{"id":"probe-item","type":"function_call","call_id":"probe-call","name":"openfars_probe","arguments":""}}',
      'data: {"type":"response.completed","response":{"status":"completed"}}',
      ""
    ] : [
      'data: {"type":"response.output_text.delta","delta":"ok"}',
      'data: {"type":"response.completed","response":{"status":"completed"}}',
      ""
    ];
    return new Response(frames.join("\n\n"), {
      status: 200,
      headers: { "content-type": "text/event-stream" }
    });
  }
  return Response.json(toolProbe
    ? { status: "completed", error: null, output: [{ type: "function_call", call_id: "probe-call", name: "openfars_probe", arguments: '{"value":"ok"}' }] }
    : { status: "completed", error: null, output_text: "ok", output: [{ type: "message", content: [{ type: "output_text", text: "ok" }] }] });
}

describe("global gateway library", () => {
  it("drops the removed private-network flag from legacy gateway records", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-gateways-legacy-network-"));
    roots.push(root);
    const gatewayId = `gwy_${"a".repeat(32)}`;
    await fs.writeFile(path.join(root, "gateways.json"), `${JSON.stringify({
      schemaVersion: 1,
      gateways: [{
        id: gatewayId,
        ...gatewayInput,
        allowPrivateNetwork: true,
        revision: 1,
        test: { status: "untested" },
        tests: [],
        createdAt: "2026-09-01T00:00:00.000Z",
        updatedAt: "2026-09-01T00:00:00.000Z"
      }],
      defaultGatewayId: gatewayId
    }, null, 2)}\n`, "utf8");

    const registry = new GatewayStore(root);
    const [gateway] = await registry.list();
    expect(gateway).toMatchObject({ id: gatewayId, apiKeyConfigured: true });
    expect(gateway).not.toHaveProperty("allowPrivateNetwork");
    expect(await registry.get(gatewayId)).not.toHaveProperty("allowPrivateNetwork");
  });

  it("seeds the environment-backed AIGW once and respects later edits or deletion", async () => {
    expect(systemGatewayInputFromEnvironment({}, ["model-a"])).toBeUndefined();
    const input = systemGatewayInputFromEnvironment({
      AIGW_API_KEY: "seed-secret",
      AIGW_BASE_URL: "https://seed.example.com/v1/"
    }, ["model-a", "nex-agi/Nex-N2-Pro", "model-a"]);
    expect(input).toMatchObject({
      name: "AIGW",
      url: "https://seed.example.com/v1",
      models: ["model-a", "nex-agi/Nex-N2-Pro"],
      defaultModel: "nex-agi/Nex-N2-Pro",
      protocol: "responses"
    });
    const registry = await store();
    const seeded = await registry.seedBuiltin(input!);
    expect(seeded).toMatchObject({ builtin: true, apiKeyConfigured: true });
    expect(seeded).not.toHaveProperty("apiKey");
    expect(await registry.defaultGatewayId()).toBe(seeded!.id);
    await expect(registry.seedBuiltin(input!)).resolves.toBeUndefined();

    const updated = await registry.update(seeded!.id, {
      ...input!,
      name: "Edited system gateway",
      apiKey: "edited-secret"
    });
    expect(updated).toMatchObject({ id: seeded!.id, name: "Edited system gateway", builtin: true });
    expect((await registry.get(seeded!.id))?.apiKey).toBe("edited-secret");
    await expect(registry.delete(seeded!.id)).resolves.toBe(true);
    expect(await registry.list()).toEqual([]);
    await expect(registry.seedBuiltin(input!)).resolves.toBeUndefined();
  });

  it("accepts canonical HTTPS gateway URLs without performing DNS resolution", () => {
    expect(validateGatewayUrl("https://gateway.example.com:443/v1/")).toBe("https://gateway.example.com/v1");
    expect(validateGatewayUrl("https://[2606:4700:4700::1111]/v1/")).toBe("https://[2606:4700:4700::1111]/v1");
    expect(validateGatewayUrl("https://10.2.3.4/v1/")).toBe("https://10.2.3.4/v1");
    for (const invalid of [
      "http://gateway.example.com/v1",
      "ftp://gateway.example.com/v1",
      "https://gateway.example.com:8443/v1",
      "https://user:pass@gateway.example.com/v1",
      "https://gateway.example.com/v1?token=secret",
      "https://gateway.example.com/v1#token"
    ]) expect(() => validateGatewayUrl(invalid)).toThrow();
  });

  it("saves unresolved VPN gateways without requiring a live DNS result", async () => {
    const resolver = vi.fn(async (): Promise<readonly string[]> => {
      throw Object.assign(new Error("not found"), { code: "ENOTFOUND" });
    });
    const registry = await store(vi.fn<typeof fetch>(), resolver);
    const created = await registry.create({
      ...gatewayInput,
      url: "https://model.internal.example/v1"
    });
    expect(created).toMatchObject({
      url: "https://model.internal.example/v1"
    });
    await expect(registry.update(created.id, {
      ...gatewayInput,
      name: "VPN model",
      url: "https://another.internal.example/v1"
    })).resolves.toMatchObject({
      url: "https://another.internal.example/v1"
    });
    expect(resolver).not.toHaveBeenCalled();
  });

  it("allows RFC1918 targets without per-gateway configuration", async () => {
    const publicRegistry = await store(vi.fn<typeof fetch>(), async () => ["93.184.216.34"]);
    await expect(publicRegistry.assertAllowedNetworkTarget(gatewayInput.url)).resolves.toBeUndefined();

    for (const address of ["10.252.252.27", "172.20.1.2", "192.168.68.20"]) {
      const registry = await store(vi.fn<typeof fetch>(), async () => [address]);
      await expect(registry.assertAllowedNetworkTarget(gatewayInput.url))
        .resolves.toBeUndefined();
    }

    const mixedRegistry = await store(vi.fn<typeof fetch>(), async () => ["10.252.252.27", "93.184.216.34"]);
    await expect(mixedRegistry.assertAllowedNetworkTarget(gatewayInput.url))
      .rejects.toThrow("不能同时解析到公网和内网地址");
  });

  it("blocks loopback, CGNAT, metadata, local IPv6 and reserved addresses", async () => {
    for (const address of [
      "0.0.0.0",
      "100.64.2.3",
      "127.0.0.1",
      "169.254.169.254",
      "192.0.2.1",
      "198.18.0.1",
      "224.0.0.1",
      "::1",
      "fc00::1234",
      "fec0::1234",
      "2001:db8::1",
      "fe80::1",
      "ff02::1"
    ]) {
      const registry = await store(vi.fn<typeof fetch>(), async () => [address]);
      await expect(registry.assertAllowedNetworkTarget("https://gateway.example.com/v1"))
        .rejects.toThrow("被禁止的本机、链路本地、元数据、CGNAT、组播或保留地址");
    }
  });

  it("allows a real probe to reach an RFC1918 gateway", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response("unauthorized", { status: 401 }));
    const registry = await store(fetchMock, async () => ["10.252.252.27"]);
    const created = await registry.create({ ...gatewayInput });

    await expect(registry.test(created.id)).resolves.toMatchObject({
      status: "failed",
      error: expect.stringContaining("HTTP 401")
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rechecks a stored gateway before fetch and rejects unsafe DNS changes", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    let answers: readonly string[] = ["93.184.216.34"];
    const reboundRegistry = await store(fetchMock, async () => answers);
    const created = await reboundRegistry.create({ ...gatewayInput });
    answers = ["169.254.169.254"];
    await expect(reboundRegistry.test(created.id)).resolves.toMatchObject({
      status: "failed",
      error: expect.stringContaining("被禁止的本机、链路本地、元数据、CGNAT、组播或保留地址")
    });
    expect((await reboundRegistry.get(created.id))?.test).toMatchObject({
      status: "failed",
      error: expect.stringContaining("被禁止的本机、链路本地、元数据、CGNAT、组播或保留地址")
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["ENOTFOUND", "网关域名不存在或没有 A/AAAA 记录（ENOTFOUND）"],
    ["NXDOMAIN", "网关域名不存在或没有 A/AAAA 记录（NXDOMAIN）"],
    ["ETIMEOUT", "网关域名 DNS 解析超时（ETIMEOUT）"],
    ["ETIMEDOUT", "网关域名 DNS 解析超时（ETIMEDOUT）"],
    ["EAI_AGAIN", "网关域名 DNS 服务暂时不可用（EAI_AGAIN）"],
    ["ESERVFAIL", "网关域名 DNS 服务暂时不可用（ESERVFAIL）"]
  ])("reports DNS resolver failures without misclassifying %s as a public-address error", async (code, message) => {
    const resolver = async (): Promise<readonly string[]> => {
      throw Object.assign(new Error("resolver failed"), { code });
    };
    const registry = await store(vi.fn<typeof fetch>(), resolver);

    const error = await registry.assertAllowedNetworkTarget(gatewayInput.url).catch((reason: unknown) => reason);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain(message);
    expect((error as Error).message).not.toContain("无法解析为公网地址");
  });

  it("distinguishes an empty DNS answer from an invalid resolver result", async () => {
    const emptyRegistry = await store(vi.fn<typeof fetch>(), async () => []);
    await expect(emptyRegistry.assertAllowedNetworkTarget(gatewayInput.url))
      .rejects.toThrow("网关域名没有返回 A/AAAA 记录");

    const invalidRegistry = await store(vi.fn<typeof fetch>(), async () => ["not-an-ip"]);
    await expect(invalidRegistry.assertAllowedNetworkTarget(gatewayInput.url))
      .rejects.toThrow("网关 DNS 返回了无效的 IP 地址");
  });

  it("persists credentials server-side while every public response omits the key", async () => {
    const registry = await store();
    const created = await registry.create({ ...gatewayInput });
    expect(created).toMatchObject({
      name: "AIGW",
      url: "https://gateway.example.com/v1",
      apiKeyConfigured: true,
      test: { status: "untested" }
    });
    expect(created).not.toHaveProperty("apiKey");
    expect(await registry.defaultGatewayId()).toBe(created.id);
    expect((await registry.get(created.id))?.apiKey).toBe("server-secret");
    expect((await registry.list())[0]).not.toHaveProperty("apiKey");
  });

  it("records protocol/model probes independently for the declared gateway protocol", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (_input, init) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
      const toolProbe = body.tool_choice !== undefined;
      const value = toolProbe
        ? {
            output: [{
              type: "function_call",
              call_id: "probe-call",
              name: "openfars_probe",
              arguments: '{"value":"ok"}'
            }]
          }
        : { output_text: "ok", output: [{ type: "message", content: [{ type: "output_text", text: "ok" }] }] };
      return body.stream === true
        ? new Response((toolProbe ? [
            'data: {"type":"response.output_item.added","output_index":0,"item":{"id":"probe-item","type":"function_call","call_id":"probe-call","name":"openfars_probe","arguments":""}}',
            'data: {"type":"response.completed","response":{"status":"completed"}}',
            ""
          ] : [
            'data: {"type":"response.output_text.delta","delta":"ok"}',
            'data: {"type":"response.completed","response":{"status":"completed"}}',
            ""
          ]).join("\n\n"), { status: 200, headers: { "content-type": "text/event-stream" } })
        : new Response(JSON.stringify(value), {
            status: 200,
            headers: { "content-type": "application/json" }
          });
    });
    const registry = await store(fetchMock);
    const created = await registry.create({ ...gatewayInput });

    const firstProbe = await registry.test(created.id, "responses", "nex-agi/Nex-N2-Pro");
    expect(firstProbe).toMatchObject({ status: "passed", durationMs: expect.any(Number) });
    expect(firstProbe.stageResults).toEqual([
      expect.objectContaining({ stage: "text_ordinary", status: "passed", durationMs: expect.any(Number), httpStatus: 200 }),
      expect.objectContaining({ stage: "text_stream", status: "passed", durationMs: expect.any(Number), httpStatus: 200 }),
      expect.objectContaining({ stage: "tool_ordinary", status: "passed", durationMs: expect.any(Number), httpStatus: 200 }),
      expect.objectContaining({ stage: "tool_stream", status: "passed", durationMs: expect.any(Number), httpStatus: 200 })
    ]);
    await expect(registry.test(created.id, "responses", "model-b")).resolves.toMatchObject({ status: "passed" });
    const privateRecord = (await registry.get(created.id))!;
    expect(privateRecord.tests?.find((test) => test.model === "nex-agi/Nex-N2-Pro")?.stageResults).toHaveLength(4);
    expect(gatewayCombinationPassed(privateRecord, "responses", "nex-agi/Nex-N2-Pro")).toBe(true);
    expect(gatewayCombinationPassed(privateRecord, "responses", "model-b")).toBe(true);
    expect(gatewayCombinationPassed(privateRecord, "chat-completions", "model-b")).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(8);
    expect(new Set(fetchMock.mock.calls.map(([url]) => String(url)))).toEqual(
      new Set(["https://gateway.example.com/v1/responses"])
    );
    expect(fetchMock.mock.calls.map(([, init]) => JSON.parse(String(init?.body)).stream)).toEqual([
      false, true, false, true,
      false, true, false, true
    ]);
    expect(fetchMock.mock.calls.filter(([, init]) =>
      JSON.parse(String(init?.body)).tool_choice !== undefined
    )).toHaveLength(4);
    expect(fetchMock.mock.calls.every(([, init]) => init?.redirect === "error")).toBe(true);
  });

  it("runs standalone direct probe stages serially and reports live stage progress", async () => {
    const successResponse = (body: Record<string, unknown>) => {
      const toolProbe = body.tool_choice !== undefined;
      if (body.stream === true) {
        return new Response((toolProbe ? [
          'data: {"type":"response.output_item.added","output_index":0,"item":{"id":"probe-item","type":"function_call","call_id":"probe-call","name":"openfars_probe","arguments":""}}',
          'data: {"type":"response.completed","response":{"status":"completed"}}',
          ""
        ] : [
          'data: {"type":"response.output_text.delta","delta":"ok"}',
          'data: {"type":"response.completed","response":{"status":"completed"}}',
          ""
        ]).join("\n\n"), { status: 200, headers: { "content-type": "text/event-stream" } });
      }
      return new Response(JSON.stringify(toolProbe
        ? { output: [{ type: "function_call", call_id: "probe-call", name: "openfars_probe", arguments: '{"value":"ok"}' }] }
        : { output_text: "ok", output: [{ type: "message", content: [{ type: "output_text", text: "ok" }] }] }
      ), { status: 200, headers: { "content-type": "application/json" } });
    };
    const pending: Array<{ body: Record<string, unknown>; resolve: (response: Response) => void }> = [];
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (_input, init) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
      return new Promise<Response>((resolve) => pending.push({ body, resolve }));
    });
    const registry = await store(fetchMock);
    const created = await registry.create({ ...gatewayInput });
    const progress: Array<{ stage: string; status: string }> = [];

    const probePromise = registry.test(created.id, "responses", "nex-agi/Nex-N2-Pro", undefined, (stage) => {
      progress.push({ stage: stage.stage, status: stage.status });
    });
    const deadline = Date.now() + 1_000;
    while (pending.length < 1 && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(pending[0]?.body.stream).toBe(false);
    expect(pending[0]?.body.tool_choice).toBeUndefined();
    expect(progress).toEqual([{ stage: "text_ordinary", status: "running" }]);

    for (let index = 0; index < 4; index += 1) {
      const request = pending[index]!;
      request.resolve(successResponse(request.body));
      if (index < 3) {
        const nextDeadline = Date.now() + 1_000;
        while (pending.length < index + 2 && Date.now() < nextDeadline) {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }
    }
    const result = await probePromise;

    expect(result.status).toBe("passed");
    expect(result.stageResults).toHaveLength(4);
    expect(progress.filter((event) => event.status === "passed")).toHaveLength(4);
    expect(fetchMock.mock.calls.map(([, init]) => JSON.parse(String(init?.body ?? "{}"))).map((body) => body.stream)).toEqual([
      false, true, false, true
    ]);
  });

  it("selects the neutral buffered-json capability when ordinary requests pass but streaming does not", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (_input, init) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
      if (body.stream === true) {
        return new Response(JSON.stringify({ error: { message: "stream unsupported" } }), {
          status: 400,
          headers: { "content-type": "application/json" }
        });
      }
      return Response.json(body.tool_choice === undefined
        ? {
            output_text: "ok",
            output: [{ type: "message", content: [{ type: "output_text", text: "ok" }] }]
          }
        : {
            output: [{
              type: "function_call",
              call_id: "probe-call",
              name: "openfars_probe",
              arguments: '{"value":"ok"}'
            }]
          });
    });
    const registry = await store(fetchMock);
    const created = await registry.create({
      ...gatewayInput,
      models: ["model-no-stream"],
      defaultModel: "model-no-stream"
    });

    const result = await registry.test(created.id, "responses", "model-no-stream");

    expect(result).toMatchObject({ status: "passed", deliveryMode: "buffered-json" });
    expect(result.stageResults).toEqual([
      expect.objectContaining({ stage: "text_ordinary", status: "passed" }),
      expect.objectContaining({
        stage: "text_stream",
        status: "passed",
        error: expect.stringContaining("buffered-json")
      }),
      expect.objectContaining({ stage: "tool_ordinary", status: "passed" }),
      expect.objectContaining({
        stage: "tool_stream",
        status: "passed",
        error: expect.stringContaining("buffered-json")
      })
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("keeps Chat Completions probes provider-neutral for arbitrary model names", async () => {
    const bodies: Record<string, unknown>[] = [];
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (_input, init) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
      bodies.push(body);
      const toolProbe = body.tool_choice !== undefined;
      if (body.stream === true) {
        return new Response((toolProbe ? [
          'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"probe-call","type":"function","function":{"name":"openfars_probe","arguments":"{\\"value\\":\\"ok\\"}"}}]},"finish_reason":null}]}',
          'data: {"choices":[{"delta":{},"finish_reason":"tool_calls"}]}',
          ""
        ] : [
          'data: {"choices":[{"delta":{"content":"ok"},"finish_reason":null}]}',
          'data: {"choices":[{"delta":{},"finish_reason":"stop"}]}',
          ""
        ]).join("\n\n"), { status: 200, headers: { "content-type": "text/event-stream" } });
      }
      return new Response(JSON.stringify(toolProbe
        ? { choices: [{ message: { role: "assistant", content: null, tool_calls: [{ id: "probe-call", type: "function", function: { name: "openfars_probe", arguments: '{"value":"ok"}' } }] }, finish_reason: "tool_calls" }] }
        : { choices: [{ message: { role: "assistant", content: "ok" }, finish_reason: "stop" }] }
      ), { status: 200, headers: { "content-type": "application/json" } });
    });
    const registry = await store(fetchMock);
    const created = await registry.create({
      ...gatewayInput,
      name: "Neutral gateway",
      models: ["model-alpha", "model-beta"],
      defaultModel: "model-alpha",
      protocol: "chat-completions"
    });

    for (const model of ["model-alpha", "model-beta"]) {
      await expect(registry.testHarness(created.id, "dsh", model)).resolves.toMatchObject({
        status: "passed",
        deliveryMode: "native-stream"
      });
    }
    expect(bodies).toHaveLength(8);
    expect(bodies.every((body) => !Object.hasOwn(body, "chat_template_kwargs"))).toBe(true);
    expect(bodies.every((body) => !Object.hasOwn(body, "enable_thinking"))).toBe(true);
    expect(bodies.every((body) => !Object.hasOwn(body, "thinking"))).toBe(true);
  });

  it("probes a thinking-enabled Chat Completions gateway with its sole tool required", async () => {
    const bodies: Record<string, unknown>[] = [];
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (_input, init) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
      bodies.push(body);
      if (body.tool_choice && body.tool_choice !== "required") {
        return Response.json({ error: { message: "tool_choice 'specified' is incompatible with thinking enabled" } }, { status: 400 });
      }
      const toolProbe = body.tool_choice === "required";
      if (body.stream === true) {
        const frames = toolProbe ? [
          { choices: [{ delta: { tool_calls: [{ index: 0, id: "probe-call", type: "function", function: { name: "openfars_probe", arguments: '{"value":"ok"}' } }] }, finish_reason: null }] },
          { choices: [{ delta: {}, finish_reason: "tool_calls" }] }
        ] : [
          { choices: [{ delta: { content: "ok" }, finish_reason: null }] },
          { choices: [{ delta: {}, finish_reason: "stop" }] }
        ];
        return new Response(frames.map((frame) => `data: ${JSON.stringify(frame)}\n\n`).join(""), {
          status: 200,
          headers: { "content-type": "text/event-stream" }
        });
      }
      return Response.json(toolProbe
        ? { choices: [{ message: { role: "assistant", content: null, tool_calls: [{ id: "probe-call", type: "function", function: { name: "openfars_probe", arguments: '{"value":"ok"}' } }] }, finish_reason: "tool_calls" }] }
        : { choices: [{ message: { role: "assistant", content: "ok" }, finish_reason: "stop" }] });
    });
    const registry = await store(fetchMock);
    const created = await registry.create({
      ...gatewayInput,
      name: "Kimi gateway",
      protocol: "chat-completions",
      models: ["kimi-k3"],
      defaultModel: "kimi-k3"
    });

    for (const harness of ["dsh", "codex"] as const) {
      await expect(registry.testHarness(created.id, harness, "kimi-k3")).resolves.toMatchObject({
        status: "passed",
        stageResults: expect.arrayContaining([
          expect.objectContaining({ stage: "tool_ordinary", status: "passed" }),
          expect.objectContaining({ stage: "tool_stream", status: "passed" })
        ])
      });
    }
    expect(bodies).toHaveLength(8);
    expect(bodies.filter((body) => body.tool_choice !== undefined)).toHaveLength(4);
    expect(bodies.filter((body) => body.tool_choice !== undefined).every((body) =>
      body.tool_choice === "required" && Array.isArray(body.tools) && body.tools.length === 1
    )).toBe(true);
    expect(bodies.every((body) => !Object.hasOwn(body, "thinking"))).toBe(true);
  });

  it("falls back to a named choice when a gateway rejects required for its sole tool", async () => {
    const choices: unknown[] = [];
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (_input, init) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
      if (body.tool_choice !== undefined) choices.push(body.tool_choice);
      if (body.tool_choice === "required") {
        return Response.json({ error: { message: "tool_choice required is not supported" } }, { status: 400 });
      }
      const toolProbe = body.tool_choice !== undefined;
      if (body.stream === true) {
        const frames = toolProbe ? [
          { choices: [{ delta: { tool_calls: [{ index: 0, id: "probe-call", type: "function", function: { name: "openfars_probe", arguments: '{"value":"ok"}' } }] }, finish_reason: null }] },
          { choices: [{ delta: {}, finish_reason: "tool_calls" }] }
        ] : [
          { choices: [{ delta: { content: "ok" }, finish_reason: null }] },
          { choices: [{ delta: {}, finish_reason: "stop" }] }
        ];
        return new Response(frames.map((frame) => `data: ${JSON.stringify(frame)}\n\n`).join(""), {
          status: 200,
          headers: { "content-type": "text/event-stream" }
        });
      }
      return Response.json(toolProbe
        ? { choices: [{ message: { role: "assistant", content: null, tool_calls: [{ id: "probe-call", type: "function", function: { name: "openfars_probe", arguments: '{"value":"ok"}' } }] }, finish_reason: "tool_calls" }] }
        : { choices: [{ message: { role: "assistant", content: "ok" }, finish_reason: "stop" }] });
    });
    const registry = await store(fetchMock);
    const created = await registry.create({
      ...gatewayInput,
      protocol: "chat-completions",
      models: ["named-only-model"],
      defaultModel: "named-only-model"
    });

    await expect(registry.testHarness(created.id, "dsh", "named-only-model")).resolves.toMatchObject({ status: "passed" });
    expect(choices).toEqual([
      "required", { type: "function", function: { name: "openfars_probe" } },
      "required", { type: "function", function: { name: "openfars_probe" } }
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(6);
  });

  it("does not treat responses error null as a gateway error", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (_input, init) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
      const toolProbe = body.tool_choice !== undefined;
      if (body.stream === true) {
        return new Response((toolProbe ? [
          'data: {"type":"response.output_item.added","output_index":0,"item":{"id":"probe-item","type":"function_call","call_id":"probe-call","name":"openfars_probe","arguments":""}}',
          'data: {"type":"response.completed","response":{"status":"completed","error":null}}',
          ""
        ] : [
          'data: {"type":"response.output_text.delta","delta":"ok"}',
          'data: {"type":"response.completed","response":{"status":"completed","error":null}}',
          ""
        ]).join("\n\n"), { status: 200, headers: { "content-type": "text/event-stream" } });
      }
      const value = toolProbe
        ? { error: null, output: [{ type: "function_call", call_id: "probe-call", name: "openfars_probe", arguments: '{"value":"ok"}' }] }
        : { error: null, output_text: "ok", output: [{ type: "message", content: [{ type: "output_text", text: "ok" }] }] };
      return new Response(JSON.stringify(value), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    });
    const registry = await store(fetchMock);
    const created = await registry.create({ ...gatewayInput });

    await expect(registry.testHarness(created.id, "codex", "nex-agi/Nex-N2-Pro")).resolves.toMatchObject({
      status: "passed"
    });
  });

  it("accepts responses stream probes with event names and terminal tool output", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (_input, init) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
      const toolProbe = body.tool_choice !== undefined;
      if (body.stream === true) {
        return new Response((toolProbe ? [
          'event: response.function_call_arguments.delta\ndata: {"item_id":"probe-item","delta":"{\\"value\\":\\"ok\\"}"}',
          'event: response.completed\ndata: {"response":{"status":"completed","output":[{"type":"function_call","call_id":"probe-call","name":"openfars_probe","arguments":"{\\"value\\":\\"ok\\"}"}]}}',
          ""
        ] : [
          'event: response.output_text.delta\ndata: {"delta":"ok"}',
          'event: response.completed\ndata: {"response":{"status":"completed"}}',
          ""
        ]).join("\n\n"), { status: 200, headers: { "content-type": "text/event-stream" } });
      }
      return new Response(JSON.stringify(toolProbe
        ? { output: [{ type: "function_call", call_id: "probe-call", name: "openfars_probe", arguments: '{"value":"ok"}' }] }
        : { output_text: "ok", output: [{ type: "message", content: [{ type: "output_text", text: "ok" }] }] }
      ), { status: 200, headers: { "content-type": "application/json" } });
    });
    const registry = await store(fetchMock);
    const created = await registry.create({ ...gatewayInput });

    await expect(registry.testHarness(created.id, "codex", "nex-agi/Nex-N2-Pro")).resolves.toMatchObject({
      status: "passed",
      stageResults: expect.arrayContaining([
        expect.objectContaining({ stage: "tool_stream", status: "passed" })
      ])
    });
  });

  it("verifies every harness route with ordinary and terminal streaming probes", async () => {
    const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (input, init) => {
      const url = String(input);
      const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
      calls.push({ url, body });
      const stream = body.stream === true;
      const toolProbe = body.tool_choice !== undefined;
      const target = url.endsWith("/responses")
        ? "responses"
        : url.endsWith("/chat/completions")
          ? "chat-completions"
          : "anthropic-messages";
      if (stream) {
        const frames = target === "responses"
          ? toolProbe ? [
              { type: "response.output_item.added", output_index: 0, item: { id: "probe-item", type: "function_call", call_id: "probe-call", name: "openfars_probe", arguments: "" } },
              { type: "response.completed", response: { status: "completed", usage: { input_tokens: 1 } } }
            ] : [
              { type: "response.output_text.delta", delta: "ok" },
              { type: "response.completed", response: { status: "completed", usage: { input_tokens: 1 } } }
            ]
          : target === "chat-completions"
            ? toolProbe ? [
                { choices: [{ delta: { tool_calls: [{ index: 0, id: "probe-call", type: "function", function: { name: "openfars_probe", arguments: '{"value":"ok"}' } }] }, finish_reason: null }] },
                { choices: [{ delta: {}, finish_reason: "tool_calls" }], usage: { prompt_tokens: 1 } }
              ] : [
                { choices: [{ delta: { content: "ok" }, finish_reason: null }] },
                { choices: [{ delta: {}, finish_reason: "stop" }], usage: { prompt_tokens: 1 } }
              ]
            : toolProbe ? [
                { type: "content_block_start", index: 0, content_block: { type: "tool_use", id: "probe-call", name: "openfars_probe", input: {} } },
                { type: "message_delta", delta: { stop_reason: "tool_use" }, usage: { input_tokens: 1 } },
                { type: "message_stop" }
              ] : [
                { type: "content_block_delta", index: 0, delta: { type: "text_delta", text: "ok" } },
                { type: "message_delta", delta: { stop_reason: "end_turn" }, usage: { input_tokens: 1 } },
                { type: "message_stop" }
              ];
        const encoded = target === "anthropic-messages"
          ? frames.map((frame) => `event: ${frame.type}\ndata: ${JSON.stringify(frame)}\n\n`).join("")
          : frames.map((frame) => `data: ${JSON.stringify(frame)}\n\n`).join("");
        return new Response(encoded, {
          status: 200,
          headers: { "content-type": "text/event-stream" }
        });
      }
      const value = target === "responses"
        ? toolProbe
          ? { id: "resp-probe", model: body.model, output: [{ type: "function_call", call_id: "probe-call", name: "openfars_probe", arguments: '{"value":"ok"}' }] }
          : { id: "resp-probe", model: body.model, output_text: "ok", output: [{ type: "message", content: [{ type: "output_text", text: "ok" }] }] }
        : target === "chat-completions"
          ? toolProbe
            ? { id: "chat-probe", model: body.model, choices: [{ message: { role: "assistant", content: null, tool_calls: [{ id: "probe-call", type: "function", function: { name: "openfars_probe", arguments: '{"value":"ok"}' } }] }, finish_reason: "tool_calls" }] }
            : { id: "chat-probe", model: body.model, choices: [{ message: { role: "assistant", content: "ok" }, finish_reason: "stop" }] }
          : toolProbe
            ? { id: "msg-probe", model: body.model, content: [{ type: "tool_use", id: "probe-call", name: "openfars_probe", input: { value: "ok" } }], stop_reason: "tool_use" }
            : { id: "msg-probe", model: body.model, content: [{ type: "text", text: "ok" }], stop_reason: "end_turn" };
      return new Response(JSON.stringify(value), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    });
    const registry = await store(fetchMock);
    const created = await registry.create({ ...gatewayInput });
    const progress: Array<{ type: string; harness?: string; model?: string; stage?: string; status?: string }> = [];
    const matrix = await registry.testMatrix(created.id, {
      harnesses: ["codex", "dsh", "pi", "claude-code"]
    }, undefined, (event) => {
      progress.push({
        type: event.type,
        harness: event.harness,
        model: event.model,
        ...(event.type === "stage" ? { stage: event.stage.stage, status: event.stage.status } : {}),
        ...(event.type === "result" ? { status: event.result.status } : {})
      });
    });

    expect(matrix.results).toHaveLength(8);
    const firstCombinationProgress = progress.filter((event) =>
      event.harness === "codex" && event.model === "nex-agi/Nex-N2-Pro"
    );
    expect(progress.filter((event) => event.type === "combination-start")).toHaveLength(8);
    expect(firstCombinationProgress.slice(0, 3)).toEqual([
      { type: "combination-start", harness: "codex", model: "nex-agi/Nex-N2-Pro" },
      { type: "stage", harness: "codex", model: "nex-agi/Nex-N2-Pro", stage: "text_ordinary", status: "running" },
      { type: "stage", harness: "codex", model: "nex-agi/Nex-N2-Pro", stage: "text_ordinary", status: "passed" }
    ]);
    expect(firstCombinationProgress.at(-1)).toEqual({
      type: "result",
      harness: "codex",
      model: "nex-agi/Nex-N2-Pro",
      status: "passed"
    });
    expect(firstCombinationProgress).toEqual(expect.arrayContaining([
      { type: "stage", harness: "codex", model: "nex-agi/Nex-N2-Pro", stage: "adapter_smoke", status: "running" },
      { type: "stage", harness: "codex", model: "nex-agi/Nex-N2-Pro", stage: "adapter_smoke", status: "passed" }
    ]));
    expect(progress.filter((event) => event.type === "result")).toHaveLength(8);
    expect(matrix.results).toEqual(expect.arrayContaining([
      expect.objectContaining({ harness: "codex", nativeProtocol: "responses", routeMode: "direct", status: "passed" }),
      expect.objectContaining({ harness: "dsh", nativeProtocol: "chat-completions", routeMode: "proxy", routeDirection: "chat-completions->responses", status: "passed" }),
      expect.objectContaining({ harness: "pi", nativeProtocol: "chat-completions", routeMode: "proxy", routeDirection: "chat-completions->responses", status: "passed" }),
      expect.objectContaining({ harness: "claude-code", nativeProtocol: "anthropic-messages", routeMode: "proxy", routeDirection: "anthropic-messages->responses", status: "passed" })
    ]));
    expect(calls).toHaveLength(32);
    expect(calls.filter((call) => call.body.stream === true)).toHaveLength(16);
    expect(calls.filter((call) => call.body.tool_choice !== undefined)).toHaveLength(16);
    expect(calls.every((call) => call.body.max_output_tokens === 512)).toBe(true);
    expect(new Set(calls.map((call) => call.body.model))).toEqual(new Set(gatewayInput.models));
    const privateRecord = (await registry.get(created.id))!;
    for (const model of gatewayInput.models) {
      for (const harness of ["codex", "dsh", "pi", "claude-code"] as const) {
        expect(gatewayCombinationPassed(privateRecord, "responses", model, harness)).toBe(true);
      }
    }
    expect(matrix.gateway).not.toHaveProperty("apiKey");
    expect(matrix.gateway.tests).toHaveLength(16);
  });

  it("requires a real Adapter smoke result in addition to a passed protocol route", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(successfulResponsesProbeForTest);
    const failingSmoke = successfulSmokeProbe();
    failingSmoke.runSmoke = async () => { throw new Error("sentinel tool result missing"); };
    const registry = await store(
      fetchMock,
      async () => ["93.184.216.34"],
      failingSmoke
    );
    const created = await registry.create({ ...gatewayInput });
    const result = await registry.testHarness(created.id, "codex", created.defaultModel);
    expect(result).toMatchObject({
      status: "failed",
      probeKind: "adapter-smoke",
      error: "sentinel tool result missing"
    });
    expect(result.stageResults?.at(-1)).toMatchObject({
      stage: "adapter_smoke",
      status: "failed",
      error: "sentinel tool result missing"
    });
    const stored = (await registry.get(created.id))!;
    expect(stored.tests).toEqual(expect.arrayContaining([
      expect.objectContaining({ status: "passed", probeKind: "route", harness: "codex" }),
      expect.objectContaining({ status: "failed", probeKind: "adapter-smoke", harness: "codex" })
    ]));
    expect(gatewayCombinationPassed(stored, "responses", created.defaultModel, "codex")).toBe(false);
  });

  it("invalidates a passing smoke result when the current Adapter identity changes", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(successfulResponsesProbeForTest);
    const smoke = successfulSmokeProbe();
    const registry = await store(fetchMock, async () => ["93.184.216.34"], smoke);
    const created = await registry.create({ ...gatewayInput });
    await registry.testHarness(created.id, "codex", created.defaultModel);

    const cached = await registry.testHarness(created.id, "codex", created.defaultModel);
    expect(cached).toMatchObject({ status: "passed", probeKind: "adapter-smoke" });
    expect(cached.stageResults?.at(-1)).toMatchObject({ stage: "adapter_smoke", status: "passed" });
    expect((await registry.get(created.id))?.test).toMatchObject({
      status: "passed",
      probeKind: "adapter-smoke",
      harness: "codex"
    });

    await expect(registry.harnessCombinationPassed(
      created.id,
      "codex",
      created.defaultModel
    )).resolves.toBe(true);

    smoke.cacheKey = async ({ harness }) => ({
      cacheKey: `changed-${harness}`,
      adapterVersion: "fixture-adapter-2",
      executableFingerprint: `replacement-executable-${harness}`,
      routerCompatibilityVersion: PROTOCOL_ROUTER_COMPATIBILITY_VERSION
    });

    await expect(registry.harnessCombinationPassed(
      created.id,
      "codex",
      created.defaultModel
    )).resolves.toBe(false);
  });

  it("lets an exact failed route override a legacy direct pass and removes its stale smoke", async () => {
    const model = gatewayInput.defaultModel;
    const legacyDirect: GatewayTestState = {
      status: "passed",
      protocol: "responses",
      model,
      routeMode: "direct",
      probeKind: "route"
    };
    const staleSmoke: GatewayTestState = {
      status: "passed",
      protocol: "responses",
      model,
      harness: "codex",
      nativeProtocol: "responses",
      routeMode: "direct",
      probeKind: "adapter-smoke",
      cacheKey: "stale-codex-smoke",
      adapterVersion: "fixture-adapter-1",
      executableFingerprint: "fixture-executable-codex",
      gatewayRevision: 1,
      routerCompatibilityVersion: PROTOCOL_ROUTER_COMPATIBILITY_VERSION
    };
    const exactFailure: GatewayTestState = {
      status: "failed",
      protocol: "responses",
      model,
      harness: "codex",
      nativeProtocol: "responses",
      routeMode: "direct",
      probeKind: "route"
    };
    expect(gatewayCombinationPassed({
      revision: 1,
      test: legacyDirect,
      tests: [legacyDirect, staleSmoke]
    }, "responses", model, "codex")).toBe(true);
    expect(gatewayCombinationPassed({
      revision: 1,
      test: exactFailure,
      tests: [legacyDirect, staleSmoke, exactFailure]
    }, "responses", model, "codex")).toBe(false);
    expect(gatewayCombinationPassed({
      revision: 1,
      test: exactFailure,
      tests: [legacyDirect, { ...exactFailure, status: "passed" }, staleSmoke, {
        ...staleSmoke,
        status: "failed",
        error: "newer smoke failed"
      }]
    }, "responses", model, "codex")).toBe(false);

    const fetchMock = vi.fn<typeof fetch>().mockImplementation(successfulResponsesProbeForTest);
    const registry = await store(fetchMock);
    const created = await registry.create({ ...gatewayInput });

    await expect(registry.test(created.id)).resolves.toMatchObject({
      status: "passed",
      probeKind: "route"
    });
    await expect(registry.testHarness(
      created.id,
      "codex",
      created.defaultModel
    )).resolves.toMatchObject({ status: "passed", probeKind: "adapter-smoke" });

    fetchMock.mockResolvedValue(new Response("route unavailable", { status: 401 }));
    await expect(registry.testHarnessRoute(
      created.id,
      "codex",
      created.defaultModel
    )).resolves.toMatchObject({ status: "failed", harness: "codex", probeKind: "route" });

    const stored = (await registry.get(created.id))!;
    expect(stored.tests?.some((test) =>
      test.status === "passed" && test.harness === undefined && test.probeKind === "route"
    )).toBe(true);
    expect(stored.tests).toEqual(expect.arrayContaining([
      expect.objectContaining({ status: "failed", harness: "codex", probeKind: "route" })
    ]));
    expect(stored.tests).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ harness: "codex", probeKind: "adapter-smoke" })
    ]));
    expect(gatewayCombinationPassed(
      stored,
      "responses",
      created.defaultModel,
      "codex"
    )).toBe(false);
  });

  it("runs harness probes concurrently while keeping each harness's probe stages serial", async () => {
    const successResponse = (body: Record<string, unknown>) => {
      const toolProbe = body.tool_choice !== undefined;
      if (body.stream === true) {
        return new Response((toolProbe ? [
          'data: {"type":"response.output_item.added","output_index":0,"item":{"id":"probe-item","type":"function_call","call_id":"probe-call","name":"openfars_probe","arguments":""}}',
          'data: {"type":"response.completed","response":{"status":"completed"}}',
          ""
        ] : [
          'data: {"type":"response.output_text.delta","delta":"ok"}',
          'data: {"type":"response.completed","response":{"status":"completed"}}',
          ""
        ]).join("\n\n"), { status: 200, headers: { "content-type": "text/event-stream" } });
      }
      return new Response(JSON.stringify(toolProbe
        ? { output: [{ type: "function_call", call_id: "probe-call", name: "openfars_probe", arguments: '{"value":"ok"}' }] }
        : { output_text: "ok", output: [{ type: "message", content: [{ type: "output_text", text: "ok" }] }] }
      ), { status: 200, headers: { "content-type": "application/json" } });
    };
    const firstRequests: Array<{ body: Record<string, unknown>; resolve: (response: Response) => void }> = [];
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (_input, init) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
      if (firstRequests.length < 2) {
        return new Promise<Response>((resolve) => firstRequests.push({ body, resolve }));
      }
      return successResponse(body);
    });
    const registry = await store(fetchMock);
    const created = await registry.create({ ...gatewayInput });
    const progress: Array<{ type: string; harness?: string; stage?: string; status?: string }> = [];

    const matrixPromise = registry.testMatrix(created.id, {
      harnesses: ["codex", "dsh"],
      models: ["nex-agi/Nex-N2-Pro"]
    }, undefined, (event) => {
      progress.push({
        type: event.type,
        harness: event.harness,
        ...(event.type === "stage" ? { stage: event.stage.stage, status: event.stage.status } : {}),
        ...(event.type === "result" ? { status: event.result.status } : {})
      });
    });
    const deadline = Date.now() + 1_000;
    while (firstRequests.length < 2 && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    expect(progress.filter((event) => event.type === "combination-start").map((event) => event.harness).sort()).toEqual(["codex", "dsh"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(firstRequests.map((request) => request.body.stream)).toEqual([false, false]);
    expect(firstRequests.every((request) => request.body.tool_choice === undefined)).toBe(true);

    for (const request of firstRequests) request.resolve(successResponse(request.body));
    const matrix = await matrixPromise;

    expect(matrix.results).toHaveLength(2);
    expect(fetchMock).toHaveBeenCalledTimes(8);
    expect(progress.filter((event) => event.type === "result")).toHaveLength(2);
  });

  it("does not unlock a buffered fallback when its ordinary tool probe also fails", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (_input, init) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
      if (body.stream) {
        return new Response('data: {"type":"response.output_text.delta","delta":"partial"}\n\n', {
          status: 200,
          headers: { "content-type": "text/event-stream" }
        });
      }
      return new Response(JSON.stringify({ output_text: "ok", output: [] }), { status: 200 });
    });
    const registry = await store(fetchMock);
    const created = await registry.create({ ...gatewayInput });
    const result = await registry.testHarness(created.id, "dsh", "nex-agi/Nex-N2-Pro");
    expect(result.status).toBe("failed");
    expect(result.error).toContain("openfars_probe");
    expect(result.stageResults).toEqual([
      expect.objectContaining({ stage: "text_ordinary", status: "passed" }),
      expect.objectContaining({
        stage: "text_stream",
        status: "passed",
        error: expect.stringContaining("buffered-json")
      }),
      expect.objectContaining({ stage: "tool_ordinary", status: "failed" }),
      expect.objectContaining({ stage: "tool_stream", status: "skipped" }),
      expect.objectContaining({ stage: "adapter_smoke", status: "skipped" })
    ]);
    expect(gatewayCombinationPassed((await registry.get(created.id))!, "responses", "nex-agi/Nex-N2-Pro", "dsh")).toBe(false);
  });

  it("cancels matrix probes without recording a failed combination", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
      })
    );
    const registry = await store(fetchMock);
    const created = await registry.create({ ...gatewayInput });
    const controller = new AbortController();
    const promise = registry.testMatrix(created.id, { harnesses: ["codex"], models: ["nex-agi/Nex-N2-Pro"] }, controller.signal);
    const deadline = Date.now() + 1_000;
    while (fetchMock.mock.calls.length === 0 && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);

    controller.abort();

    await expect(promise).rejects.toThrow("网关探测已取消");
    expect((await registry.get(created.id))?.tests).toEqual([]);
  });

  it("does not unlock a combination when the provider ignores a required probe tool", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (_input, init) => {
      const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
      if (body.stream) {
        return new Response([
          'data: {"type":"response.output_text.delta","delta":"ok"}',
          'data: {"type":"response.completed","response":{"status":"completed"}}',
          ""
        ].join("\n\n"), {
          status: 200,
          headers: { "content-type": "text/event-stream" }
        });
      }
      return new Response(JSON.stringify({
        output_text: "ok",
        output: [{ type: "message", content: [{ type: "output_text", text: "ok" }] }]
      }), { status: 200, headers: { "content-type": "application/json" } });
    });
    const registry = await store(fetchMock);
    const created = await registry.create({ ...gatewayInput });

    const result = await registry.testHarness(created.id, "codex", "nex-agi/Nex-N2-Pro");

    expect(result.status).toBe("failed");
    expect(result.error).toContain("openfars_probe");
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(gatewayCombinationPassed(
      (await registry.get(created.id))!,
      "responses",
      "nex-agi/Nex-N2-Pro",
      "codex"
    )).toBe(false);
  });

  it("still rejects a JSON fallback when its required ordinary tool probe fails", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () =>
      new Response(JSON.stringify({ output_text: "ok", output: [] }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );
    const registry = await store(fetchMock);
    const created = await registry.create({ ...gatewayInput });
    const result = await registry.testHarness(created.id, "codex", "nex-agi/Nex-N2-Pro");

    expect(result.status).toBe("failed");
    expect(result.error).toContain("openfars_probe");
    expect(result.stageResults).toEqual([
      expect.objectContaining({ stage: "text_ordinary", status: "passed" }),
      expect.objectContaining({
        stage: "text_stream",
        status: "passed",
        error: expect.stringContaining("buffered-json")
      }),
      expect.objectContaining({ stage: "tool_ordinary", status: "failed" }),
      expect.objectContaining({ stage: "tool_stream", status: "skipped" }),
      expect.objectContaining({ stage: "adapter_smoke", status: "skipped" })
    ]);
    expect(gatewayCombinationPassed(
      (await registry.get(created.id))!,
      "responses",
      "nex-agi/Nex-N2-Pro",
      "codex"
    )).toBe(false);
  });

  it("refreshes the declared model list without exposing credentials", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ data: [{ id: "nex-agi/Nex-N2-Pro" }, { id: "new-model" }] }), {
        status: 200,
        headers: { "content-type": "application/json" }
      })
    );
    const registry = await store(fetchMock);
    const created = await registry.create({
      ...gatewayInput,
      modelContextWindows: { "nex-agi/Nex-N2-Pro": 1_000_000, "model-b": 32_768 }
    });
    const refreshed = await registry.refreshModels(created.id);
    expect(refreshed.models).toEqual(["nex-agi/Nex-N2-Pro", "new-model"]);
    expect(refreshed.modelContextWindows).toEqual({
      "nex-agi/Nex-N2-Pro": 1_000_000,
      "new-model": DEFAULT_MODEL_CONTEXT_WINDOW
    });
    expect(refreshed).not.toHaveProperty("apiKey");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://gateway.example.com/v1/models",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("defaults legacy models to 256K, accepts a 1M model and rejects values above 2M", async () => {
    const registry = await store();
    const created = await registry.create({ ...gatewayInput });
    expect(created.modelContextWindows).toEqual({
      "nex-agi/Nex-N2-Pro": DEFAULT_MODEL_CONTEXT_WINDOW,
      "model-b": DEFAULT_MODEL_CONTEXT_WINDOW
    });
    const large = await registry.create({
      ...gatewayInput,
      name: "Large context",
      modelContextWindows: { "nex-agi/Nex-N2-Pro": 1_048_576, "model-b": DEFAULT_MODEL_CONTEXT_WINDOW }
    });
    expect(large.modelContextWindows["nex-agi/Nex-N2-Pro"]).toBe(1_048_576);
    await expect(registry.create({
      ...gatewayInput,
      name: "Too large",
      modelContextWindows: { "nex-agi/Nex-N2-Pro": 2_000_001, "model-b": DEFAULT_MODEL_CONTEXT_WINDOW }
    })).rejects.toThrow("上下文长度必须是 1 到 2000000 的整数");
  });

  it("uses one model-level reasoning option for route probes, smoke identity, and cache invalidation", async () => {
    const bodies: Array<Record<string, unknown>> = [];
    const fetchMock = vi.fn<typeof fetch>(async (input, init) => {
      if (init?.body) {
        bodies.push(JSON.parse(String(init.body)) as Record<string, unknown>);
      }
      return successfulResponsesProbeForTest(input, init);
    });
    const smokeInputs: Array<{ option?: string; fingerprint?: string }> = [];
    const smokeProbe: AdapterSmokeProbeRunner = {
      harnessIds: () => ["codex"],
      nativeProtocol: nativeProtocolForHarness,
      cacheKey: async ({ reasoningOptionId, reasoning }) => {
        smokeInputs.push({
          option: reasoningOptionId,
          fingerprint: reasoning?.fingerprint
        });
        return {
          cacheKey: `reasoning-${reasoning?.fingerprint ?? "default"}`,
          adapterVersion: "fixture-adapter-1",
          executableFingerprint: "fixture-executable-codex",
          routerCompatibilityVersion: PROTOCOL_ROUTER_COMPATIBILITY_VERSION
        };
      },
      runSmoke: async (input) => {
        smokeInputs.push({
          option: input.reasoningOptionId,
          fingerprint: input.reasoning?.fingerprint
        });
        return {
          cacheKey: `reasoning-${input.reasoning?.fingerprint ?? "default"}`,
          adapterVersion: "fixture-adapter-1",
          executableFingerprint: "fixture-executable-codex",
          routerCompatibilityVersion: PROTOCOL_ROUTER_COMPATIBILITY_VERSION
        };
      }
    };
    const registry = await store(fetchMock, async () => ["93.184.216.34"], smokeProbe);
    const configured = {
      ...gatewayInput,
      modelReasoning: {
        "nex-agi/Nex-N2-Pro": {
          parameter: "reasoning.effort" as const,
          options: [{ id: "high", label: "High", value: "xhigh" }]
        }
      }
    };
    const created = await registry.create(configured);
    const first = await registry.testHarness(
      created.id,
      "codex",
      "nex-agi/Nex-N2-Pro",
      undefined,
      undefined,
      "high"
    );
    expect(first).toMatchObject({
      status: "passed",
      reasoningOptionId: "high",
      reasoningFingerprint: expect.stringMatching(/^[a-f0-9]{64}$/)
    });
    expect(bodies.length).toBeGreaterThan(0);
    expect(bodies.every((body) =>
      (body.reasoning as { effort?: string } | undefined)?.effort === "xhigh"
    )).toBe(true);
    expect(smokeInputs.every((input) =>
      input.option === "high" && /^[a-f0-9]{64}$/.test(input.fingerprint ?? "")
    )).toBe(true);
    expect(await registry.harnessCombinationPassed(
      created.id,
      "codex",
      "nex-agi/Nex-N2-Pro",
      "high"
    )).toBe(true);

    const firstFingerprint = first.reasoningFingerprint;
    await registry.update(created.id, {
      ...configured,
      modelReasoning: {
        "nex-agi/Nex-N2-Pro": {
          parameter: "reasoning.effort",
          options: [{ id: "high", label: "High", value: "max" }]
        }
      }
    });
    expect(await registry.harnessCombinationPassed(
      created.id,
      "codex",
      "nex-agi/Nex-N2-Pro",
      "high"
    )).toBe(false);
    bodies.length = 0;
    const second = await registry.testHarness(
      created.id,
      "codex",
      "nex-agi/Nex-N2-Pro",
      undefined,
      undefined,
      "high"
    );
    expect(second.reasoningFingerprint).not.toBe(firstFingerprint);
    expect(bodies.every((body) =>
      (body.reasoning as { effort?: string } | undefined)?.effort === "max"
    )).toBe(true);
  });
});
