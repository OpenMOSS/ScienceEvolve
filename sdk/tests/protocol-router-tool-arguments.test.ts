import { createServer, type Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import * as legacyRouter from "../src/core/protocol-router.js";
import * as mainRouter from "../src/core/protocol-router.js";
import type { AgentProtocol } from "../src/core/protocol-router.js";

const servers: Server[] = [];
const proxies: Array<{ close(): Promise<void> }> = [];
afterEach(async () => {
  await Promise.all(proxies.splice(0).map((proxy) => proxy.close()));
  await Promise.all(servers.splice(0).map((server) => {
    server.closeAllConnections();
    return new Promise<void>((resolve) => server.close(() => resolve()));
  }));
});

const toolName = "mcp__scienceevolve_orchestration_control__route_to_agent";
const argumentsObject = {
  callId: "route-001",
  target: "next",
  rationale: "检查通过，交给下一阶段",
  context: "保留引号 \"passed\"、换行\n和路径 C:\\workspace",
  successCriteria: ["执行下一阶段", "保留检查证据"]
};
const inputSchema = {
  type: "object",
  properties: {
    callId: { type: "string" }, target: { type: "string", enum: ["next", "repair"] },
    rationale: { type: "string" }, context: { type: "string" },
    successCriteria: { type: "array", items: { type: "string" } }
  },
  required: ["callId", "target", "rationale"],
  additionalProperties: false
};

type WireFormat = "object" | "object-after-name" | "object-after-null" | "object-with-text"
  | "object-with-finish" | "string-fragments" | "string-character-fragments";
const protocols: AgentProtocol[] = ["chat-completions", "responses", "anthropic-messages"];
const formats: WireFormat[] = ["object", "object-after-name", "object-after-null", "object-with-text",
  "object-with-finish", "string-fragments", "string-character-fragments"];

function sourceRequest(protocol: AgentProtocol) {
  const message = { role: "user", content: "Route after the gate checks pass." };
  if (protocol === "responses") return {
    model: "fixture-model", stream: true, input: [message],
    tools: [{ type: "function", name: toolName, parameters: inputSchema }]
  };
  if (protocol === "anthropic-messages") return {
    model: "fixture-model", stream: true, max_tokens: 128, messages: [message],
    tools: [{ name: toolName, input_schema: inputSchema }]
  };
  return {
    model: "fixture-model", stream: true, messages: [message],
    tools: [{ type: "function", function: { name: toolName, parameters: inputSchema } }]
  };
}

function upstreamFrames(format: WireFormat) {
  const tool = { index: 0, id: "call-route", type: "function" };
  const withObject = ["object", "object-with-text", "object-with-finish"].includes(format);
  const deltas: Array<Record<string, unknown>> = [{
    ...(format === "object-with-text" ? { content: "检查通过。", reasoning_content: "选择下一阶段。" } : {}),
    tool_calls: [{ ...tool, function: {
      name: toolName,
      ...(withObject ? { arguments: argumentsObject } : format === "object-after-null" ? { arguments: null } : {})
    } }]
  }];
  if (format === "object-after-name" || format === "object-after-null") {
    deltas.push({ tool_calls: [{ index: 0, function: { arguments: argumentsObject } }] });
  } else if (format === "string-fragments" || format === "string-character-fragments") {
    const raw = JSON.stringify(argumentsObject);
    const fragments = format === "string-character-fragments" ? Array.from(raw) : [raw.slice(0, 37), raw.slice(37)];
    for (const part of fragments) {
      deltas.push({ tool_calls: [{ index: 0, function: { arguments: part } }] });
    }
  }
  return [
    ...deltas.map((delta) => ({ choices: [{ index: 0, delta, finish_reason: format === "object-with-finish" ? "tool_calls" : null }] })),
    { choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }] }
  ].map((frame) => `data: ${JSON.stringify(frame)}\n\n`).join("") + "data: [DONE]\n\n";
}

describe.each([
  { engine: "legacy", router: legacyRouter },
  { engine: "main", router: mainRouter }
])("$engine Chat streaming tool argument compatibility", ({ router }) => {
  const { normalizeProtocolStreamEvents, startProtocolProxy } = router;
  it.each(protocols.flatMap((sourceProtocol) => formats.map((format) => ({ sourceProtocol, format }))))(
    "preserves executable route arguments for $sourceProtocol from $format",
    async ({ sourceProtocol, format }) => {
      const server = createServer(async (request, response) => {
        for await (const _chunk of request) { /* drain the routed request */ }
        response.writeHead(200, { "content-type": "text/event-stream" });
        response.end(upstreamFrames(format));
      });
      servers.push(server);
      await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("missing upstream port");
      const proxy = await startProtocolProxy({
        sourceProtocol, targetProtocol: "chat-completions", force: true,
        gatewayUrl: `http://127.0.0.1:${address.port}/v1`, gatewayApiKey: "test-secret",
        validateGatewayTarget: async () => undefined
      });
      proxies.push(proxy);
      const endpoint = sourceProtocol === "chat-completions" ? "chat/completions"
        : sourceProtocol === "responses" ? "responses" : "messages";
      const response = await fetch(`${proxy.baseUrl}/${endpoint}`, {
        method: "POST",
        headers: { authorization: `Bearer ${proxy.token}`, "content-type": "application/json" },
        body: JSON.stringify(sourceRequest(sourceProtocol))
      });
      const raw = await response.text();
      expect(response.status, raw).toBe(200);
      const frames = raw.split(/\r?\n/).filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim()).filter((data) => data !== "[DONE]")
        .map((data) => JSON.parse(data));
      const calls = frames.flatMap((frame) => normalizeProtocolStreamEvents(sourceProtocol, frame))
        .filter((event) => event.type === "tool_call_delta");
      expect(calls.some((call) => call.toolName === toolName)).toBe(true);
      const final = [...calls].reverse().find((call) => call.toolCallFinal && call.argumentsDelta);
      const argumentsText = final?.argumentsDelta ?? calls.map((call) => call.argumentsDelta ?? "").join("");
      expect(JSON.parse(argumentsText || "{}"), raw).toEqual(argumentsObject);
    }
  );

  it("keeps mixed object and string calls separate when one frame also contains text and completion", () => {
    const events = normalizeProtocolStreamEvents("chat-completions", {
      choices: [{ delta: {
        content: "检查完成。",
        tool_calls: [
          { index: 0, id: "call-route", function: { name: toolName, arguments: argumentsObject } },
          { index: 1, id: "call-other", function: { name: "inspect_result", arguments: '{"path":"result.json"}' } }
        ]
      }, finish_reason: "tool_calls" }]
    });
    expect(events.map((event) => event.type)).toEqual(["text_delta", "tool_call_delta", "tool_call_delta", "completed"]);
    expect(events[1]).toMatchObject({ toolCallId: "call-route", toolIndex: 0 });
    expect(JSON.parse(events[1].argumentsDelta!)).toEqual(argumentsObject);
    expect(events[2]).toMatchObject({ toolCallId: "call-other", toolIndex: 1, argumentsDelta: '{"path":"result.json"}' });
  });

  it("preserves empty objects and nested JSON values without dropping false, zero or null", () => {
    const values = [{}, { limit: 0, enabled: false, optional: null, rows: [{ name: "材料", values: [0, false, null] }] }];
    const events = normalizeProtocolStreamEvents("chat-completions", {
      choices: [{ delta: { tool_calls: values.map((value, index) => ({
        index, id: `call-${index}`, function: { name: "inspect_result", arguments: value }
      })) } }]
    });
    expect(events).toHaveLength(2);
    expect(events.map((event) => JSON.parse(event.argumentsDelta!))).toEqual(values);
  });
});

describe("native function argument correction", () => {
  it.each(["responses", "chat-completions"] as const)("keeps %s parsing feedback on the original route", async sourceProtocol => {
    const malformed = '{"target":"next"} trailing text';
    const requests: Array<Record<string, unknown>> = [];
    const server = createServer(async (request, response) => {
      let raw = "";
      for await (const chunk of request) raw += chunk.toString();
      requests.push(JSON.parse(raw));
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ id: "correction", model: "fixture-model", choices: [{ index: 0,
        message: requests.length === 1
          ? { role: "assistant", content: null, tool_calls: [{ id: "bad-call", type: "function",
            function: { name: toolName, arguments: malformed } }] }
          : { role: "assistant", content: "The Agent received the parser feedback." },
        finish_reason: requests.length === 1 ? "tool_calls" : "stop" }] }));
    });
    servers.push(server);
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Missing provider port");
    const proxy = await mainRouter.startProtocolProxy({ sourceProtocol, targetProtocol: "chat-completions", force: true,
      gatewayUrl: `http://127.0.0.1:${address.port}/v1`, gatewayApiKey: "test-secret", validateGatewayTarget: async () => undefined });
    proxies.push(proxy);
    const send = (input: Record<string, unknown>) => fetch(`${proxy.baseUrl}/${sourceProtocol === "responses" ? "responses" : "chat/completions"}`, {
      method: "POST", headers: { authorization: `Bearer ${proxy.token}`, "content-type": "application/json" },
      body: JSON.stringify({ ...sourceRequest(sourceProtocol), stream: false, ...input })
    });
    const first = await send({});
    expect(first.status).toBe(200);
    const firstBody = await first.json();
    const call = sourceProtocol === "responses" ? firstBody.output.find(item => item.type === "function_call")
      : firstBody.choices[0].message.tool_calls[0];
    expect(sourceProtocol === "responses" ? call.arguments : call.function.arguments).toBe(malformed);
    expect(proxy.getFailure?.()).toBeUndefined();
    const feedback = "Tool argument parsing failed; correct the original call.";
    const next = await send(sourceProtocol === "responses" ? { input: [call,
      { type: "function_call_output", call_id: "bad-call", output: feedback }] }
      : { messages: [{ role: "assistant", content: null, tool_calls: [call] },
        { role: "tool", tool_call_id: "bad-call", content: feedback }] });
    expect(next.status).toBe(200);
    await next.text();
    expect(JSON.stringify(requests[1])).toContain(feedback);
    expect(requests).toHaveLength(2);
    expect(proxy.getFailure?.()).toBeUndefined();
  });
});
