import { afterEach, describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  GatewayProbeCancelledError,
  GatewayStore,
  nativeProtocolForHarness,
  gatewayCombinationPassed,
  type GatewayInput,
  type GatewayMatrixProgressEvent
} from "../src/core/agent-runtime.js";

import { PROTOCOL_ROUTER_COMPATIBILITY_VERSION } from "../src/core/protocol-router.js";

const roots: string[] = [];
const gatewayInput: GatewayInput = {
  name: "matrix-test",
  url: "https://gateway.example.com/v1",
  apiKey: "matrix-secret-one",
  models: ["model-a", "model-b"],
  defaultModel: "model-a",
  protocol: "responses"
};
const stageIds = ["text_ordinary", "text_stream", "tool_ordinary", "tool_stream", "adapter_smoke"];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

const smokeIdentity = { cacheKey: "matrix-fixture", adapterVersion: "fixture", executableFingerprint: "fixture", routerCompatibilityVersion: PROTOCOL_ROUTER_COMPATIBILITY_VERSION };

async function store(fetchImpl: typeof fetch): Promise<GatewayStore> {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-gateway-matrix-"));
  roots.push(root);
  return new GatewayStore(root, {
    fetch: fetchImpl,
    resolveHostname: async () => ["8.8.8.8"],
    // Simulated native adapter; actual CLI processes are covered by native-adapter suites.
    adapterSmokeProbe: {
      harnessIds: () => ["codex", "pi", "dsh"], nativeProtocol: nativeProtocolForHarness,
      cacheKey: async () => smokeIdentity, runSmoke: async () => smokeIdentity
    }
  });
}

function probeResponse(body: { stream?: boolean; tool_choice?: unknown }): Response {
  const output = body.tool_choice
    ? [{ type: "function_call", call_id: "probe-call", name: "openfars_probe", arguments: '{"value":"ok"}' }]
    : [{ type: "message", content: [{ type: "output_text", text: "ok" }] }];
  if (body.stream) {
    return new Response(`data: ${JSON.stringify({ type: "response.completed", response: { status: "completed", output } })}\n\n`, {
      status: 200,
      headers: { "content-type": "text/event-stream" }
    });
  }
  return Response.json({ error: null, output });
}

describe("gateway matrix probe", () => {
  it("starts all three Harness rows before waiting for a row to finish", async () => {
    let requests = 0;
    const registry = await store(async (_url, init) => {
      requests += 1;
      return probeResponse(JSON.parse(String(init?.body)) as { stream?: boolean; tool_choice?: unknown });
    });
    const gateway = await registry.create(gatewayInput);
    const controller = new AbortController();
    const started: string[] = [];
    await expect(registry.testMatrix(gateway.id, {
      harnesses: ["dsh", "pi", "codex"], models: ["model-a"]
    }, controller.signal, (event) => {
      if (event.type !== "combination-start") return;
      started.push(event.harness);
      if (started.length === 3) controller.abort();
    })).rejects.toBeInstanceOf(GatewayProbeCancelledError);
    expect(started).toEqual(["dsh", "pi", "codex"]);
    expect(requests).toBe(0);
    expect((await registry.get(gateway.id))?.tests).toEqual([]);
  });

  it("reports protocol and adapter stages separately for each selected model", async () => {
    const requests: Array<{ model: string; stream: boolean; tool: boolean }> = [];
    const registry = await store(async (_url, init) => {
      const body = JSON.parse(String(init?.body)) as { model: string; stream: boolean; tool_choice?: unknown };
      requests.push({ model: body.model, stream: body.stream, tool: Boolean(body.tool_choice) });
      return probeResponse(body);
    });
    const gateway = await registry.create(gatewayInput);
    const progress: GatewayMatrixProgressEvent[] = [];
    const matrix = await registry.testMatrix(gateway.id, {
      harnesses: ["codex"], models: ["model-a", "model-b"]
    }, undefined, (event) => progress.push(event));

    expect(matrix.results.map((result) => [result.harness, result.model, result.status]))
      .toEqual([["codex", "model-a", "passed"], ["codex", "model-b", "passed"]]);
    expect(requests).toEqual(["model-a", "model-b"].flatMap((model) => [
      { model, stream: false, tool: false },
      { model, stream: true, tool: false },
      { model, stream: false, tool: true },
      { model, stream: true, tool: true }
    ]));
    for (const result of matrix.results) {
      expect(result.stageResults?.map((stage) => [stage.stage, stage.status]))
        .toEqual(stageIds.map((id) => [id, "passed"]));
    }
    expect(progress.filter((event) => event.type === "combination-start").map((event) => event.model))
      .toEqual(["model-a", "model-b"]);
    expect(progress.filter((event) => event.type === "stage").map((event) => event.stage.status))
      .toEqual(Array.from({ length: 10 }, () => ["running", "passed"]).flat());
    expect(progress.filter((event) => event.type === "result").map((event) => event.model))
      .toEqual(["model-a", "model-b"]);
    const stored = await registry.get(gateway.id);
    expect(stored?.tests).toHaveLength(4);
    expect(gatewayCombinationPassed(stored!, "responses", "model-a", "codex")).toBe(true);
    expect(gatewayCombinationPassed(stored!, "responses", "model-b", "codex")).toBe(true);
  });

  it("fails a missing tool call and skips the remaining protocol and adapter stages", async () => {
    let requestCount = 0;
    const registry = await store(async (_url, init) => {
      requestCount += 1;
      const body = JSON.parse(String(init?.body)) as { stream: boolean; tool_choice?: unknown };
      if (body.tool_choice) return Response.json({ error: null, output: [{
        type: "message", content: [{ type: "output_text", text: "I cannot use tools" }]
      }] });
      return probeResponse(body);
    });
    const gateway = await registry.create(gatewayInput);
    const progress: GatewayMatrixProgressEvent[] = [];
    const matrix = await registry.testMatrix(gateway.id, {
      harnesses: ["codex"], models: ["model-a"]
    }, undefined, (event) => progress.push(event));

    expect(requestCount).toBe(3);
    expect(matrix.results).toHaveLength(1);
    expect(matrix.results[0]).toMatchObject({ status: "failed", model: "model-a", httpStatus: 200 });
    expect(matrix.results[0]?.stageResults?.map((stage) => [stage.stage, stage.status]))
      .toEqual([["text_ordinary", "passed"], ["text_stream", "passed"], ["tool_ordinary", "failed"], ["tool_stream", "skipped"], ["adapter_smoke", "skipped"]]);
    expect(matrix.results[0]?.error).toContain("openfars_probe");
    expect(progress.filter((event) => event.type === "stage").map((event) => event.stage.status))
      .toEqual(["running", "passed", "running", "passed", "running", "failed", "skipped", "skipped"]);
    const stored = await registry.get(gateway.id);
    expect(stored?.tests?.[0]?.status).toBe("failed");
    expect(gatewayCombinationPassed(stored!, "responses", "model-a", "codex")).toBe(false);
  });

  it("stops on cancellation without recording a partial verification", async () => {
    let requestCount = 0;
    const registry = await store(async (_url, init) => {
      requestCount += 1;
      return probeResponse(JSON.parse(String(init?.body)) as { stream?: boolean; tool_choice?: unknown });
    });
    const gateway = await registry.create(gatewayInput);
    const controller = new AbortController();
    await expect(registry.testMatrix(gateway.id, {
      harnesses: ["codex"], models: ["model-a"]
    }, controller.signal, (event) => {
      if (event.type === "stage" && event.stage.stage === "text_stream" && event.stage.status === "running") {
        controller.abort();
      }
    })).rejects.toBeInstanceOf(GatewayProbeCancelledError);
    expect(requestCount).toBe(1);
    const stored = await registry.get(gateway.id);
    expect(stored?.test.status).toBe("untested");
    expect(stored?.tests).toEqual([]);
  });

  it("invalidates old verification after a gateway edit, then records a new probe", async () => {
    const authorizations: string[] = [];
    const registry = await store(async (_url, init) => {
      authorizations.push(new Headers(init?.headers).get("Authorization") ?? "");
      return probeResponse(JSON.parse(String(init?.body)) as { stream?: boolean; tool_choice?: unknown });
    });
    const gateway = await registry.create(gatewayInput);
    expect((await registry.testHarness(gateway.id, "codex", "model-a")).status).toBe("passed");
    expect(gatewayCombinationPassed((await registry.get(gateway.id))!, "responses", "model-a", "codex")).toBe(true);

    const updated = await registry.update(gateway.id, { ...gatewayInput, apiKey: "matrix-secret-two" });
    expect(updated?.test.status).toBe("untested");
    expect(updated?.tests).toEqual([]);
    expect(gatewayCombinationPassed((await registry.get(gateway.id))!, "responses", "model-a", "codex")).toBe(false);
    expect((await registry.testHarness(gateway.id, "codex", "model-a")).status).toBe("passed");
    expect(gatewayCombinationPassed((await registry.get(gateway.id))!, "responses", "model-a", "codex")).toBe(true);
    expect(authorizations).toEqual([
      ...Array(4).fill("Bearer matrix-secret-one"),
      ...Array(4).fill("Bearer matrix-secret-two")
    ]);
  });

  it("keys probes by the resolved reasoning fingerprint and injects only the configured field", async () => {
    const bodies: Array<Record<string, unknown>> = [];
    const registry = await store(async (_url, init) => {
      const body = JSON.parse(String(init?.body)) as Record<string, unknown> & { stream?: boolean; tool_choice?: unknown };
      bodies.push(body);
      return probeResponse(body);
    });
    const gateway = await registry.create({
      ...gatewayInput,
      models: ["model-a"],
      defaultModel: "model-a",
      modelReasoning: {
        "model-a": {
          parameter: "reasoning.effort",
          options: [{ id: "deep", label: "Deep", value: "xhigh" }]
        }
      }
    });

    const result = await registry.testHarness(
      gateway.id,
      "codex",
      "model-a",
      undefined,
      undefined,
      "deep"
    );
    expect(result).toMatchObject({
      status: "passed",
      reasoningOptionId: "deep",
      reasoningFingerprint: expect.stringMatching(/^[a-f0-9]{64}$/)
    });
    expect(bodies).toHaveLength(4);
    expect(bodies.every((body) => JSON.stringify(body.reasoning) === JSON.stringify({ effort: "xhigh" }))).toBe(true);

    const stored = (await registry.get(gateway.id))!;
    expect(gatewayCombinationPassed(stored, "responses", "model-a", "codex", "deep")).toBe(true);
    expect(gatewayCombinationPassed(stored, "responses", "model-a", "codex")).toBe(false);
    const updated = await registry.update(gateway.id, {
      ...gatewayInput,
      modelReasoning: {
        "model-a": {
          parameter: "reasoning.effort",
          options: [{ id: "deep", label: "Deep", value: "max" }]
        }
      }
    });
    expect(updated?.tests).toEqual([]);
    expect(gatewayCombinationPassed((await registry.get(gateway.id))!, "responses", "model-a", "codex", "deep")).toBe(false);
  });
});
