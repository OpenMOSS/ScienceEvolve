import { afterEach, expect, it, vi } from "vitest";
import {
  convertProtocolResponse, normalizeProtocolStreamEvent, startProtocolProxy,
  type GatewayModelFetch, type ProtocolProxy, type ProtocolProxyOptions
} from "../../src/core/protocol-router.js";

let proxy: ProtocolProxy | undefined;
afterEach(async () => {
  await proxy?.close();
  proxy = undefined;
});

function stream(frames: object[]): Response {
  return new Response(frames.map(frame => "data: " + JSON.stringify(frame)).join("\n\n"),
    { headers: { "content-type": "text/event-stream" } });
}

async function openChatRoute(modelFetch: GatewayModelFetch, onTrace: ProtocolProxyOptions["onTrace"]) {
  const gatewayUrl = "https://gateway.invalid/v1";
  proxy = await startProtocolProxy({ sourceProtocol: "chat-completions", targetProtocol: "responses",
    gatewayUrl, gatewayApiKey: "upstream-secret", validateGatewayTarget: async url => expect(url).toBe(gatewayUrl), modelFetch, onTrace });
  const { baseUrl, token } = proxy;
  return async () => {
    const response = await fetch(baseUrl + "/chat/completions", { method: "POST",
      headers: { authorization: "Bearer " + token, "content-type": "application/json" },
      body: JSON.stringify({ model: "fixture-model", messages: [{ role: "user", content: "hello" }], stream: true }) });
    expect(response.status).toBe(200);
    return response.text();
  };
}

it("reads public Responses message blocks once and retains intentional repetitions", () => {
  const literal = "<budget:token_budget>20</budget:token_budget>";
  const privateBlock = { type: "reasoning_text", text: "private " + literal };
  const message = (content: unknown[]) => ({ type: "message", role: "assistant", content });
  const output = [message([privateBlock, { type: "output_text", text: literal }]),
    message([{ type: "output_text", text: "end" }]), message([{ type: "output_text", text: "end" }])];
  const reply = (body: object) => convertProtocolResponse(body, "responses", "responses", "model").output_text;
  expect(reply({ output, output_text: literal + "endend" })).toBe([literal, "end", "end"].join("\n"));
  expect(reply({ output: [message([privateBlock])] })).toBe("");
  expect(reply({ output: [message([{ content: [privateBlock, { type: "text", text: "public" }] }])] })).toBe("public");
  expect(reply({ output_text: literal })).toBe(literal);
});

it("keeps unrecognized Responses text events out of assistant output", () => {
  const frame = { type: "response.metadata_text.delta", delta: "internal </budget:token_budget>" };
  expect(normalizeProtocolStreamEvent("responses", frame).type).toBe("unknown");
  for (const type of ["response.output_text.delta", "response.text.delta", "output_text.delta", "text.delta"]) {
    expect(normalizeProtocolStreamEvent("responses", { type, text: "example" }))
      .toMatchObject({ type: "text_delta", text: "example" });
  }
});

it("identifies budget tags by upstream Responses field on the same Pi request without logging text", async () => {
  const marker = "</budget:token_budget>";
  const publicType = "response.output_text.delta", reasoningType = "response.reasoning_text.delta";
  const prelude = Array.from({ length: 80 }, () => ({ type: "response.in_progress" }));
  const publicStart = "public example <budget:token_budget>20</budget:";
  const otherItem = "token_budget>";
  const publicEnd = "token_budget>" + ("\n<budget:token_budget>20" + marker).repeat(33);
  const fallback = "fallback field " + marker;
  const frames = [
    { type: publicType, item_id: "a", delta: publicStart },
    { type: reasoningType, item_id: "r", delta: "private example </budget:tok" },
    { type: publicType, item_id: "b", delta: otherItem },
    { type: reasoningType, item_id: "r", delta: "en_budget>" },
    { type: publicType, item_id: "a", delta: publicEnd },
    { type: publicType, item_id: "a", text: fallback },
    { type: "response.metadata_text.delta", delta: "internal metadata " + marker },
    { type: "response.completed", response: { status: "completed" } }
  ];
  const trace = vi.fn();
  let calls = 0;
  const request = await openChatRoute(async () => stream(++calls === 1 ? [...prelude, ...frames] : [frames[frames.length - 1]!]), trace);
  const output = await request();
  expect(output).toContain("public example");
  expect(output).not.toContain("private example");
  expect(output).not.toContain("internal metadata");
  const empty = await request();

  const records = (message: string) => trace.mock.calls.filter(call => call[1] === message).map(call => call[2]);
  const requests = records("Protocol proxy forwarded request");
  const finished = records("Protocol proxy stream finished");
  expect(requests).toHaveLength(2);
  expect(requests[0].requestId).not.toBe(requests[1].requestId);
  expect(finished).toHaveLength(2);
  for (const [index, body] of [output, empty].entries()) {
    const chunks = body.split("\n").filter(line => line.startsWith("data: {")).map(line => JSON.parse(line.slice(5)));
    expect(chunks[0].id).toMatch(/^chatcmpl_/);
    expect(new Set(chunks.map(chunk => chunk.id))).toEqual(new Set([chunks[0].id]));
    expect(finished[index].responseId).toBe(chunks[0].id);
    const visible = chunks.map(chunk => chunk.choices[0].delta.content).join("");
    expect(visible).toBe(index === 0 ? publicStart + otherItem + publicEnd + fallback : "");
  }
  expect(finished[0].responseId).not.toBe(finished[1].responseId);
  expect(records("Protocol proxy received upstream response").map(record => record.requestId))
    .toEqual(requests.map(record => record.requestId));
  expect(finished[0]).toMatchObject({ requestId: requests[0].requestId, providerFrameCount: prelude.length + frames.length,
    responseTextFields: [
      { eventType: publicType, field: "delta", frames: 3, characters: publicStart.length + otherItem.length + publicEnd.length,
        budgetTagClosings: 34, firstBudgetTagFrame: prelude.length + 5 },
      { eventType: reasoningType, field: "delta", frames: 2, budgetTagClosings: 1, firstBudgetTagFrame: prelude.length + 4 },
      { eventType: publicType, field: "text", frames: 1, budgetTagClosings: 1, firstBudgetTagFrame: prelude.length + 6 }
    ] });
  expect(finished[1]).toMatchObject({ requestId: requests[1].requestId, providerCompleted: true,
    eventKinds: ["completed"], responseTextFields: [] });
  const diagnostics = JSON.stringify(finished);
  for (const value of ["private example", "public example", marker, "upstream-secret"]) expect(diagnostics).not.toContain(value);
});

it.each([false, true])("requires the Responses reply to end after a provider tool completes (terminal=%s)", async terminal => {
  const frames: object[] = [
    { type: "response.reasoning_text.delta", delta: "private progress" },
    { type: "response.web_search_call.completed", item_id: "search" }
  ];
  if (terminal) frames.push({ type: "response.output_text.delta", delta: "Final answer" },
    { type: "response.completed", response: { status: "completed" } });
  const trace = vi.fn();
  const request = await openChatRoute(async () => stream(frames), trace);
  const text = await request();
  expect(text).not.toContain("private progress");
  if (terminal) {
    expect(text).toContain("Final answer");
    expect(text).toContain('"finish_reason":"stop"');
  } else {
    expect(text).toContain("上游流在终止事件前结束");
    expect(text).not.toContain('"finish_reason":"stop"');
  }
  expect(trace).toHaveBeenCalledWith("status", "Protocol proxy stream finished",
    expect.objectContaining({ providerCompleted: terminal, streamFailed: !terminal }));
});
