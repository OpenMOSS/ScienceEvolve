import { expect, it, vi } from "vitest";
import { startProtocolProxy, type AgentProtocol } from "../../src/core/protocol-router.js";

const cases = [
  { source: "chat-completions", path: "/chat/completions", afterHeartbeat: true },
  { source: "responses", path: "/responses", afterHeartbeat: true },
  { source: "anthropic-messages", path: "/messages", afterHeartbeat: true },
  { source: "chat-completions", path: "/chat/completions", afterHeartbeat: false },
  { source: "responses", path: "/responses", afterHeartbeat: false },
  { source: "anthropic-messages", path: "/messages", afterHeartbeat: false }
] satisfies { source: AgentProtocol; path: string; afterHeartbeat: boolean }[];

it.each(cases)("delivers the upstream 503 to $source (afterHeartbeat=$afterHeartbeat)", async ({ source, path, afterHeartbeat }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const providerMessage = "Fixture provider temporarily unavailable";
  const modelFetch = vi.fn(async () => {
    if (afterHeartbeat) await gate;
    return Response.json({ error: { message: providerMessage } }, { status: 503 });
  });
  const gatewayUrl = "https://gateway.invalid/v1";
  const proxy = await startProtocolProxy({
    sourceProtocol: source, targetProtocol: "responses", force: true, timeoutMs: 3_000,
    gatewayUrl, validateGatewayTarget: async url => expect(url).toBe(gatewayUrl), modelFetch
  });
  try {
    const messages = [{ role: "user", content: "hello" }];
    const input = source === "responses" ? { input: messages } : { messages, max_tokens: 128 };
    const response = await fetch(proxy.baseUrl + path, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${proxy.token}`, "x-api-key": proxy.token },
      body: JSON.stringify({ model: "fixture-model", stream: true, ...input }),
      signal: AbortSignal.timeout(5_000)
    });
    release();
    if (afterHeartbeat) {
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("text/event-stream");
      const text = await response.text();
      expect(text).toContain(": waiting for provider output");
      const frames = text.split(/\r?\n/).filter(line => line.startsWith("data: ") && line !== "data: [DONE]")
        .map(line => JSON.parse(line.slice(6)) as { type?: string; error?: { message: string } });
      const errors = frames.flatMap(frame => frame.error ? [frame.error.message] : []);
      expect(errors).toEqual([expect.stringContaining(providerMessage)]);
      if (source === "chat-completions") {
        expect(frames).toHaveLength(1);
        expect(text.trimEnd()).toMatch(/data: \[DONE\]$/);
      } else {
        expect(frames.map(frame => frame.type)).toEqual(source === "responses" ? ["error"] : ["error", "message_stop"]);
      }
    } else {
      expect(response.status).toBe(503);
      expect(response.headers.get("content-type")).toContain("application/json");
      expect(await response.json()).toMatchObject({ error: { message: expect.stringContaining(providerMessage) } });
    }
    expect(proxy.getFailure?.()).toMatchObject({ httpStatus: 503, message: expect.stringContaining(providerMessage) });
    expect(modelFetch).toHaveBeenCalledTimes(2);
  } finally {
    release();
    await proxy.close();
  }
});
