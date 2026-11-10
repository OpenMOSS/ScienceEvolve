// @ts-nocheck
// This Adapter-owned file is loaded by pi as an invocation-scoped extension. It deliberately
// has no dependency on pi internals: JSON Schema objects returned by MCP are
// accepted directly by pi's registerTool surface.
import { spawn } from "node:child_process";
import readline from "node:readline";
import { enablePiProtocolBackpressure } from "./pi-protocol-stdio.js";
import { NATIVE_PROCESS_SCOPE_ENV, NATIVE_PROCESS_SUPPORT_ENV } from "../native-processes.js";
import {
  compileRuntimeMcpToolCatalog,
  modelFacingMcpToolName,
  structuredMcpToolError
} from "../tool-catalog.js";

enablePiProtocolBackpressure();

const MCP_HOST_ENV_ALLOWLIST = [
  "PATH", "LANG", "LC_ALL", "LC_CTYPE", "TERM", "TMPDIR", "TMP", "TEMP",
  "SSL_CERT_FILE", "SSL_CERT_DIR", "NODE_EXTRA_CA_CERTS"
];
const MCP_INVOCATION_ENV_ALLOWLIST = new Set([
  "SCIENCEEVOLVE_PROJECT_ID",
  "SCIENCEEVOLVE_INVOCATION_ID",
  "SCIENCEEVOLVE_AGENT_NAME",
  "SCIENCEEVOLVE_APPEND_ROOT",
  "SCIENCEEVOLVE_CONTROL_CONTEXT",
  "SCIENCEEVOLVE_CONTROL_CAPABILITY",
  "SCIENCEEVOLVE_PUBLISHED_ARTIFACT_MANIFEST"
]);

function configFromEnvironment() {
  const raw = process.env.SCIENCEEVOLVE_PI_MCP_CONFIG;
  if (!raw) return [];
  const value = JSON.parse(raw);
  if (!Array.isArray(value)) throw new Error("SCIENCEEVOLVE_PI_MCP_CONFIG must be an array");
  for (const definition of value) {
    if (!definition || typeof definition !== "object" || Array.isArray(definition)) {
      throw new Error("SCIENCEEVOLVE_PI_MCP_CONFIG contains an invalid definition");
    }
    if (definition.headers !== undefined || definition.env !== undefined) {
      throw new Error("SCIENCEEVOLVE_PI_MCP_CONFIG must not contain inline credentials or environment values");
    }
    if (!Array.isArray(definition.environmentKeys ?? [])) {
      throw new Error("SCIENCEEVOLVE_PI_MCP_CONFIG environmentKeys must be an array");
    }
    for (const key of definition.environmentKeys ?? []) {
      if (typeof key !== "string" || !MCP_INVOCATION_ENV_ALLOWLIST.has(key)) {
        throw new Error("SCIENCEEVOLVE_PI_MCP_CONFIG requested an unsupported environment key");
      }
    }
  }
  return value;
}

function mcpClient(definition) {
  if (definition.transport === "streamable-http") {
    return httpMcpClient(definition);
  }
  const child = spawn(definition.command, definition.args ?? [], {
    cwd: definition.cwd || process.cwd(),
    env: {
      [NATIVE_PROCESS_SUPPORT_ENV]: "1",
      ...(process.env[NATIVE_PROCESS_SCOPE_ENV] ? { [NATIVE_PROCESS_SCOPE_ENV]: process.env[NATIVE_PROCESS_SCOPE_ENV] } : {}),
      ...Object.fromEntries(MCP_HOST_ENV_ALLOWLIST.flatMap((key) =>
        process.env[key] === undefined ? [] : [[key, process.env[key]]]
      )),
      ...Object.fromEntries((definition.environmentKeys ?? []).map((key) => {
        const value = process.env[key];
        if (value === undefined) throw new Error(`Missing invocation environment key ${key}`);
        return [key, value];
      }))
    },
    shell: false,
    stdio: ["pipe", "pipe", "pipe"]
  });
  const pending = new Map();
  let nextId = 1;
  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => {
    stderr = `${stderr}${chunk}`.slice(-8_000);
  });
  const lines = readline.createInterface({ input: child.stdout, crlfDelay: Infinity });
  lines.on("line", (line) => {
    let message;
    try { message = JSON.parse(line); } catch { return; }
    if (message.id === undefined || message.id === null) return;
    const waiter = pending.get(message.id);
    if (!waiter) return;
    pending.delete(message.id);
    if (message.error) waiter.reject(structuredMcpToolError(message));
    else waiter.resolve(message.result);
  });
  const exited = new Promise((resolve) => child.once("exit", resolve));
  child.once("error", (error) => {
    for (const waiter of pending.values()) waiter.reject(error);
    pending.clear();
  });
  child.once("exit", (code, signal) => {
    const error = new Error(`MCP server exited (${code ?? "null"}${signal ? `, ${signal}` : ""})${stderr.trim() ? `: ${stderr.trim()}` : ""}`);
    for (const waiter of pending.values()) waiter.reject(error);
    pending.clear();
  });
  const request = (method, params = {}, onStarted) => {
    const id = nextId++;
    onStarted?.(id);
    const result = new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
    return result;
  };
  const notify = (method, params = {}) => {
    child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method, params })}\n`);
  };
  return {
    request,
    notify,
    async close() {
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
      await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 1_000))]);
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    }
  };
}

function httpMcpClient(definition) {
  const authorizationHeaders = definition.fixedAuthorization
    ? fixedAuthorizationHeaders()
    : definition.routeAuthorization
      ? routeAuthorizationHeaders()
    : {};
  let nextId = 1;
  let sessionId;
  const parseResponse = async (response) => {
    const responseSession = response.headers.get("mcp-session-id");
    if (responseSession) sessionId = responseSession;
    const text = await response.text();
    if (!text.trim()) return {};
    if ((response.headers.get("content-type") || "").includes("text/event-stream")) {
      const frames = text.split(/\r?\n/)
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .filter((line) => line && line !== "[DONE]")
        .map((line) => JSON.parse(line));
      return frames.findLast((frame) => frame.id !== undefined) ?? {};
    }
    return JSON.parse(text);
  };
  const send = async (message) => {
    const response = await fetch(definition.url, {
      method: "POST",
      headers: {
        Accept: "application/json, text/event-stream",
        "Content-Type": "application/json",
        ...authorizationHeaders,
        ...(sessionId ? { "mcp-session-id": sessionId } : {})
      },
      body: JSON.stringify(message)
    });
    if (!response.ok) throw new Error(`MCP HTTP ${response.status}`);
    return parseResponse(response);
  };
  return {
    async request(method, params = {}, onStarted) {
      const id = nextId++;
      onStarted?.(id);
      const message = await send({ jsonrpc: "2.0", id, method, params });
      if (message.error) throw structuredMcpToolError(message);
      return message.result;
    },
    async notify(method, params = {}) {
      await send({ jsonrpc: "2.0", method, params });
    },
    async close() {
      if (!sessionId) return;
      await fetch(definition.url, {
        method: "DELETE",
        headers: { ...authorizationHeaders, "mcp-session-id": sessionId }
      }).catch(() => undefined);
    }
  };
}

function fixedAuthorizationHeaders() {
  const token = process.env.SCIENCEEVOLVE_FIXED_MCP_TOKEN;
  if (!token) throw new Error("Fixed MCP authorization is unavailable");
  return { Authorization: `Bearer ${token}` };
}

function routeAuthorizationHeaders() {
  const token = process.env.SCIENCEEVOLVE_GATEWAY_API_KEY;
  if (!token) throw new Error("Invocation Gateway authorization is unavailable");
  return { Authorization: `Bearer ${token}` };
}

export default async function registerOpenFarsMcp(pi) {
  const clients = [];
  const registeredNames = new Set();
  try {
    for (const definition of configFromEnvironment()) {
      const client = mcpClient(definition);
      clients.push(client);
      await client.request("initialize", {
        protocolVersion: "2025-06-18",
        capabilities: {},
        clientInfo: { name: "openfars-pi-adapter", version: "1" }
      });
      await client.notify("notifications/initialized");
      const catalog = compileRuntimeMcpToolCatalog({
        harnessId: "pi",
        namespace: definition.namespace,
        tools: await listRuntimeTools(client)
      });
      for (const tool of catalog.tools) {
        const publicName = modelFacingMcpToolName(tool.namespace, tool.name);
        if (registeredNames.has(publicName)) {
          throw new Error(`Pi runtime tool catalog contains duplicate registration ${publicName}`);
        }
        registeredNames.add(publicName);
        pi.registerTool({
          name: publicName,
          label: publicName,
          // Pi requires a string, while MCP descriptions are optional. Empty is
          // the faithful absence of a description; never invent one.
          description: tool.description ?? "",
          parameters: tool.inputSchema,
          async execute(toolCallId, params, signal) {
            if (signal?.aborted) throw signal.reason ?? new Error("Agent turn cancelled");
            let requestId;
            const abort = () => {
              void Promise.resolve(client.notify("notifications/cancelled", {
                requestId,
                reason: "Agent turn cancelled"
              })).catch(() => undefined);
            };
            try {
              // MCP request IDs belong to this connection, not Pi's tool call IDs.
              const response = client.request("tools/call", {
                name: tool.name,
                arguments: params
              }, (id) => { requestId = id; });
              signal?.addEventListener("abort", abort, { once: true });
              if (signal?.aborted) abort();
              const result = await response;
              if (result?.isError) {
                // Pi marks a tool result as failed only when execute throws. Put
                // the complete MCP result in that native error so content and
                // structuredContent reach the same model turn unchanged.
                throw structuredMcpToolError(result);
              }
              if (!Array.isArray(result?.content)) {
                throw structuredMcpToolError({
                  isError: true,
                  code: "INVALID_MCP_TOOL_RESULT",
                  result
                });
              }
              const content = [...result.content];
              if (result.structuredContent !== undefined) {
                const structured = JSON.stringify(result.structuredContent);
                const rendered = content.filter(item => item.type === "text" && typeof item.text === "string").map(item => item.text).join("\n");
                if (!rendered.includes(structured)) {
                  const remaining = { ...result.structuredContent };
                  // Provider payloads may already be printed verbatim while the
                  // structured wrapper adds the status needed by the model.
                  if (remaining.result && typeof remaining.result === "object" && rendered.includes(JSON.stringify(remaining.result))) delete remaining.result;
                  if (Object.keys(remaining).length) content.push({ type: "text", text: JSON.stringify(remaining) });
                }
              }
              return {
                content,
                details: {
                  server: definition.name,
                  tool: tool.name,
                  mcpResult: result
                }
              };
            } finally {
              signal?.removeEventListener("abort", abort);
            }
          }
        });
      }
    }
  } catch (error) {
    await Promise.allSettled(clients.map((client) => client.close()));
    throw error;
  }
  pi.on("session_shutdown", async () => {
    await Promise.allSettled(clients.map((client) => client.close()));
  });
}

async function listRuntimeTools(client) {
  const tools = [];
  const seenCursors = new Set();
  let cursor;
  do {
    const listing = await client.request(
      "tools/list",
      cursor === undefined ? {} : { cursor }
    );
    if (!listing || typeof listing !== "object" || !Array.isArray(listing.tools)) {
      throw new Error("MCP tools/list returned an invalid runtime catalog");
    }
    tools.push(...listing.tools);
    if (listing.nextCursor !== undefined &&
      (typeof listing.nextCursor !== "string" || !listing.nextCursor)) {
      throw new Error("MCP tools/list returned an invalid nextCursor");
    }
    cursor = listing.nextCursor;
    if (cursor !== undefined) {
      if (seenCursors.has(cursor)) {
        throw new Error("MCP tools/list repeated a pagination cursor");
      }
      seenCursors.add(cursor);
    }
  } while (cursor !== undefined);
  return tools;
}
