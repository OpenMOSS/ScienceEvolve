import readline from "node:readline";
import { SLEEP_MAX_DURATION_MS } from "./sleep-tool-contract.js";
import { setTimeout as delay } from "node:timers/promises";

// A standalone stdio server with no filesystem, credentials or turn authority.
// Keep requests concurrent so cancellation and ping work during a sleep.
type Request = {
  id?: string | number;
  method?: string;
  params?: Record<string, unknown>;
};
const MAX_DURATION_MS = SLEEP_MAX_DURATION_MS;
const pending = new Map<string | number, AbortController>();
const input = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
const keepAlive = setInterval(() => {}, 60_000);

function result(id: string | number, value: unknown): void {
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, result: value })}\n`);
}

function error(id: string | number | null, code: number, message: string): void {
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } })}\n`);
}

async function handle(request: Request): Promise<void> {
  if (request.method === "notifications/cancelled") {
    const id = request.params?.requestId;
    if (typeof id === "string" || typeof id === "number") pending.get(id)?.abort();
    return;
  }
  const id = request.id;
  if (typeof id !== "string" && typeof id !== "number") return;
  if (pending.has(id)) {
    error(id, -32600, "Request ID is already pending");
    return;
  }
  if (request.method === "initialize") {
    result(id, {
      protocolVersion: "2024-11-05",
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "scienceevolve-sleep", version: "1.0.0" }
    });
    return;
  }
  if (request.method === "ping") {
    result(id, {});
    return;
  }
  if (request.method === "tools/list") {
    result(id, { tools: [{
      name: "sleep",
      description: "Pause this tool call for the specified duration in milliseconds (1–43200000, up to 12 hours). Returns the elapsed wall-clock time on completion; interruption or cancellation returns an error. This timed pause does not observe a state change, update Memory, finish the Agent turn or release its execution slot. For monitored SII experiments, use sii_defer_task from the selected scienceevolve-sii server and end the turn to receive a later notification.",
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      inputSchema: {
        type: "object", additionalProperties: false, required: ["duration_ms"],
        properties: { duration_ms: { type: "integer", minimum: 1, maximum: MAX_DURATION_MS } }
      }
    }] });
    return;
  }
  if (request.method !== "tools/call") {
    error(id, -32601, `Unsupported method: ${request.method}`);
    return;
  }
  if (request.params?.name !== "sleep") {
    error(id, -32602, "Unknown tool. This scienceevolve-sleep server provides only sleep(duration_ms).");
    return;
  }
  const args = request.params.arguments;
  if (!args || typeof args !== "object" || Array.isArray(args) ||
    Object.keys(args).length !== 1 || !("duration_ms" in args) ||
    !Number.isSafeInteger(args.duration_ms) ||
    (args.duration_ms as number) < 1 || (args.duration_ms as number) > MAX_DURATION_MS) {
    error(id, -32602, "duration_ms must be an integer from 1 to 43200000, with no extra arguments");
    return;
  }
  const controller = new AbortController();
  pending.set(id, controller);
  const started = performance.now();
  try {
    await delay(args.duration_ms as number, undefined, { signal: controller.signal });
    const elapsed_ms = Math.round(performance.now() - started);
    result(id, { content: [{ type: "text", text: JSON.stringify({ duration_ms: args.duration_ms, elapsed_ms }) }] });
  } catch (caught) {
    if (controller.signal.aborted) error(id, -32800, "Sleep cancelled");
    else error(id, -32603, caught instanceof Error ? caught.message : String(caught));
  } finally {
    pending.delete(id);
  }
}

input.on("line", (line) => {
  let request: unknown;
  try { request = JSON.parse(line); }
  catch { error(null, -32700, "Invalid JSON"); return; }
  if (!request || typeof request !== "object" || Array.isArray(request)) {
    error(null, -32600, "Invalid request");
    return;
  }
  void handle(request as Request).catch((caught) => {
    process.stderr.write(`${caught instanceof Error ? caught.message : String(caught)}\n`);
  });
});
input.once("close", () => {
  for (const controller of pending.values()) controller.abort();
  clearInterval(keepAlive);
});
