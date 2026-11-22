import { expect, it, vi } from "vitest";
import { startProtocolProxy } from "../src/core/protocol-router.js";

const clients = [
  { sourceProtocol: "responses", path: "/responses", completion: '"type":"response.completed"' },
  { sourceProtocol: "chat-completions", path: "/chat/completions", completion: "data: [DONE]" },
  { sourceProtocol: "anthropic-messages", path: "/messages", completion: '"type":"message_stop"' }
] as const;

it.each(clients)("delivers the model response after the first heartbeat ($sourceProtocol)", async ({ sourceProtocol, path, completion }) => {
  const upstream = new TransformStream<Uint8Array, Uint8Array>();
  const modelFetch = vi.fn(async () => new Response(upstream.readable, {
    headers: { "content-type": "text/event-stream" }
  }));
  const gatewayUrl = "https://gateway.invalid/v1";
  const proxy = await startProtocolProxy({
    sourceProtocol, targetProtocol: "chat-completions", force: true, timeoutMs: 3_000,
    gatewayUrl, validateGatewayTarget: async url => expect(url).toBe(gatewayUrl), modelFetch
  });
  try {
    const messages = [{ role: "user", content: "hello" }];
    const input = sourceProtocol === "responses" ? { input: messages } : { messages, max_tokens: 128 };
    const response = await fetch(proxy.baseUrl + path, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${proxy.token}`, "x-api-key": proxy.token },
      body: JSON.stringify({ model: "fixture-model", stream: true, ...input }),
      signal: AbortSignal.timeout(5_000)
    });

    // The heartbeat opens the client response while the provider's body is still pending.
    const writer = upstream.writable.getWriter();
    const delta = { choices: [{ delta: { content: "model reply" }, finish_reason: null }] };
    const stop = { choices: [{ delta: {}, finish_reason: "stop" }] };
    await writer.write(new TextEncoder().encode(`data: ${JSON.stringify(delta)}\n\ndata: ${JSON.stringify(stop)}\n\ndata: [DONE]\n\n`));
    await writer.close();

    const body = await response.text();
    expect(body).toContain(": waiting for provider output");
    expect(proxy.getFailure?.()).toBeUndefined();
    expect(body).toContain("model reply");
    expect(body).toContain(completion);
    expect(modelFetch).toHaveBeenCalledTimes(1);
  } finally {
    await proxy.close();
  }
});
