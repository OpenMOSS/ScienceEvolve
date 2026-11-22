import { afterEach, describe, expect, it, vi } from "vitest";
import { convertProtocolResponse, normalizeProtocolStreamEvents, startProtocolProxy, type ProtocolProxy } from "../src/core/protocol-router.js";

let proxy: ProtocolProxy | undefined;
afterEach(async () => { await proxy?.close(); proxy = undefined; });

describe("gateway error handling", () => {
  it("preserves legitimate literal budget tags and code across mixed Chat content chunks", () => {
    const literal = "budget:token_budget20</budget:token_budget>";
    const chunks = [
      [{ type: "thinking", text: "private part 1" }, { type: "text", text: "示例\n" }],
      [{ type: "thinking", thinking: "private part 2" }, { type: "text", text: "code: " + literal }],
      "\nDone."
    ];
    const events = chunks.flatMap(content => normalizeProtocolStreamEvents("chat-completions", { choices: [{ delta: { content } }] }));
    expect(events.filter(e => e.type === "text_delta").map(e => e.text).join("")).toBe("示例\ncode: " + literal + "\nDone.");
    expect(events.filter(e => e.type === "reasoning_delta").map(e => e.text).join("")).toBe("private part 1private part 2");
  });

  it.each(["stream", "complete"])("keeps a typed thinking block out of a public Chat reply (%s)", delivery => {
    const publicText = "已核对 budget 字段。";
    const content = [{ type: "thinking", text: "budget:token_budget20</budget:token_budget>" },
      { type: "text", text: publicText }];
    if (delivery === "stream") {
      const events = normalizeProtocolStreamEvents("chat-completions", { choices: [{ delta: { content } }] });
      expect(events.filter(event => event.type === "text_delta").map(event => event.text).join("")).toBe(publicText);
    } else {
      const result = convertProtocolResponse({ choices: [{ message: { role: "assistant", content }, finish_reason: "stop" }] },
        "chat-completions", "responses", "fixture-model");
      expect(result.output_text).toBe(publicText);
    }
  });

  it.each(["nested", "top-level", "configured-key", "unspecified"] as const)(
    "reports a safe upstream Responses error to the client, trace and runtime (%s)", async position => {
      const gatewayApiKey = "fixture-opaque-gateway-key";
      const detail = "Provider queue unavailable";
      const error = { code: "queue_capacity", message: position === "configured-key" ? detail + " " + gatewayApiKey : detail };
      const frame = position === "nested" ? { type: "response.failed", response: { status: "failed", error } }
        : position === "unspecified" ? { type: "response.failed", response: { status: "failed" } }
        : { type: "error", error };
      const modelFetch = vi.fn(async () => new Response("data: " + JSON.stringify(frame) + "\n\n", {
        headers: { "content-type": "text/event-stream" }
      }));
      const traces: string[] = [];
      proxy = await startProtocolProxy({
        sourceProtocol: "chat-completions", targetProtocol: "responses", gatewayApiKey,
        gatewayUrl: "https://gateway.invalid/v1", validateGatewayTarget: async () => undefined, modelFetch,
        onTrace: (_kind, message, data) => {
          if (message === "Protocol proxy received a provider stream error") traces.push(String(data?.error));
        }
      });
      const response = await fetch(proxy.baseUrl + "/chat/completions", {
        method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + proxy.token },
        body: JSON.stringify({ model: "fixture-model", stream: true, messages: [{ role: "user", content: "hello" }] })
      });
      const client = await response.text();
      const failure = proxy.getFailure?.();
      expect(failure).toMatchObject({ code: "MODEL_PROVIDER_FAILED", httpStatus: 200 });
      expect(traces).toHaveLength(1);
      for (const message of [client, traces[0], failure?.message]) {
        expect.soft(message).toContain(position === "unspecified" ? "provider request failed" : detail);
        if (position !== "unspecified") expect.soft(message).toContain("queue_capacity");
        expect.soft(message).not.toContain(gatewayApiKey);
      }
      expect(modelFetch).toHaveBeenCalledTimes(1);
    }
  );

  it.each([false, true])("preserves an orphaned tool result and its valid neighbor (stream=%s)", async stream => {
    const forwarded: Array<{ type?: string; role?: string; content?: string; call_id?: string; output?: string }> = [];
    proxy = await startProtocolProxy({
      sourceProtocol: "chat-completions", targetProtocol: "responses", gatewayUrl: "https://gateway.invalid/v1",
      gatewayApiKey: "fixture-key", validateGatewayTarget: async () => undefined,
      modelFetch: async (_url, init) => {
        forwarded.push(...JSON.parse(String(init.body)).input);
        return Response.json({ id: "r_test", output_text: "acknowledged", output: [
          { type: "message", content: [{ type: "output_text", text: "acknowledged" }] }
        ] });
      }
    });
    const response = await fetch(proxy.baseUrl + "/chat/completions", {
      method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + proxy.token },
      body: JSON.stringify({ model: "fixture-model", stream, messages: [
        { role: "assistant", content: null, tool_calls: [
          { id: "known", type: "function", function: { name: "read", arguments: "{}" } }
        ] },
        { role: "tool", tool_call_id: "known", content: "known result" },
        { role: "tool", tool_call_id: "missing-call", content: "write failed" }
      ] })
    });
    expect(await response.text()).toContain("acknowledged");
    expect(forwarded.filter(item => item.type === "function_call").map(item => item.call_id)).toEqual(["known"]);
    expect(forwarded.filter(item => item.type === "function_call_output")).toEqual([
      { type: "function_call_output", call_id: "known", output: "known result" }
    ]);
    const feedback = forwarded.find(item => item.role === "user" && item.content?.includes("missing-call"));
    expect(feedback?.content).toContain("write failed");
    expect(feedback?.content).toContain("Do not infer that the operation did not run");
    expect(forwarded.some(item => item.type === "item_reference")).toBe(false);
  });

  it("rejects historical tool output without identity before a provider request", async () => {
    const modelFetch = vi.fn(async () => Response.json({ error: { message: "Gateway received an unpaired result" } }, { status: 400 }));
    proxy = await startProtocolProxy({
      sourceProtocol: "chat-completions", targetProtocol: "responses", gatewayUrl: "https://gateway.invalid/v1",
      gatewayApiKey: "fixture-key", validateGatewayTarget: async () => undefined, modelFetch
    });
    const response = await fetch(proxy.baseUrl + "/chat/completions", {
      method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + proxy.token },
      body: JSON.stringify({ model: "fixture-model", messages: [{ role: "tool", content: "unidentified result" }] })
    });
    const body = await response.text();
    expect(modelFetch).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    expect(body).toContain("missing its required tool call identity");
  });
});
