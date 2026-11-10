import { afterEach, describe, expect, it, vi } from "vitest";
import { createServer, type Server } from "node:http";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { resolveSleepMcpCommand } from "../../src/core/harness-runtime/runtime-support.js";
import registerOpenFarsMcp from "../../src/core/harness-runtime/adapters/pi-mcp-extension.js";
import { NATIVE_PROCESS_SUPPORT_ENV } from "../../src/core/harness-runtime/native-processes.js";

const originalConfig = process.env.SCIENCEEVOLVE_PI_MCP_CONFIG;
const originalRouteToken = process.env.SCIENCEEVOLVE_GATEWAY_API_KEY;
const artifactAuthorityKeys = [
  "SCIENCEEVOLVE_PROJECT_ID",
  "SCIENCEEVOLVE_INVOCATION_ID",
  "SCIENCEEVOLVE_AGENT_NAME",
  "SCIENCEEVOLVE_APPEND_ROOT",
  "SCIENCEEVOLVE_PUBLISHED_ARTIFACT_MANIFEST"
] as const;
const originalArtifactAuthority = Object.fromEntries(
  artifactAuthorityKeys.map((key) => [key, process.env[key]])
) as Record<typeof artifactAuthorityKeys[number], string | undefined>;
const temporaryRoots: string[] = [];
let server: Server | undefined;

afterEach(async () => {
  if (originalConfig === undefined) delete process.env.SCIENCEEVOLVE_PI_MCP_CONFIG;
  else process.env.SCIENCEEVOLVE_PI_MCP_CONFIG = originalConfig;
  if (originalRouteToken === undefined) delete process.env.SCIENCEEVOLVE_GATEWAY_API_KEY;
  else process.env.SCIENCEEVOLVE_GATEWAY_API_KEY = originalRouteToken;
  for (const key of artifactAuthorityKeys) {
    const value = originalArtifactAuthority[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  await Promise.all(temporaryRoots.splice(0).map((root) =>
    fs.rm(root, { recursive: true, force: true })
  ));
  if (server) {
    const active = server;
    server = undefined;
    await new Promise<void>((resolve, reject) => active.close((error) => error ? reject(error) : resolve()));
  }
});

describe("Pi OpenFARS MCP extension", () => {
  it("registers and calls invocation Web tools with the route token kept out of serialized config", async () => {
    const token = "pi-route-token";
    const calls: Array<Record<string, any>> = [];
    const structuredFailure = {
      isError: true,
      structuredContent: {
        error: { code: "INVALID_QUERY", invalidField: "query", currentRevision: 3 }
      },
      content: [{ type: "text", text: "query is invalid" }]
    };
    server = createServer((request, response) => {
      expect(request.headers.authorization).toBe(`Bearer ${token}`);
      let raw = "";
      request.setEncoding("utf8");
      request.on("data", (chunk) => { raw += chunk; });
      request.on("end", () => {
        const message = JSON.parse(raw) as Record<string, any>;
        calls.push(message);
        if (message.id === undefined) {
          response.writeHead(202);
          response.end();
          return;
        }
        const result = message.method === "initialize"
          ? { protocolVersion: "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: "fixture", version: "1" } }
          : message.method === "tools/list"
            ? message.params?.cursor === "page-2"
              ? {
                  tools: [{
                    name: "web_fetch",
                    description: "Fetch",
                    inputSchema: {
                      type: "object",
                      additionalProperties: false,
                      required: ["url"],
                      properties: { url: { type: "string" } }
                    }
                  }]
                }
              : {
                  tools: [{
                    name: "web_search",
                    description: "Search",
                    inputSchema: {
                      type: "object",
                      additionalProperties: false,
                      required: ["query"],
                      properties: { query: { type: "string" } }
                    }
                  }],
                  nextCursor: "page-2"
                }
            : message.params?.name === "web_fetch"
              ? structuredFailure
              : { content: [{ type: "text", text: 'fixture search result\nProvider result: {"output":"PROVIDER_OUTPUT_ONCE"}' }],
                  structuredContent: { status: "outcome_unknown", operationId: "original-operation", result: { output: "PROVIDER_OUTPUT_ONCE" } }, isError: false };
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify({ jsonrpc: "2.0", id: message.id, result }));
      });
    });
    await new Promise<void>((resolve) => server!.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("fixture MCP did not listen");
    process.env.SCIENCEEVOLVE_GATEWAY_API_KEY = token;
    process.env.SCIENCEEVOLVE_PI_MCP_CONFIG = JSON.stringify([{
      name: "openfars-web",
      namespace: "openfars-web",
      transport: "streamable-http",
      url: `http://127.0.0.1:${address.port}/mcp`,
      routeAuthorization: true
    }]);

    const tools: Array<Record<string, any>> = [];
    let shutdown: (() => Promise<void>) | undefined;
    await registerOpenFarsMcp({
      registerTool: vi.fn((tool) => tools.push(tool)),
      on: vi.fn((event, callback) => {
        if (event === "session_shutdown") shutdown = callback;
      })
    });

    expect(tools.map((tool) => tool.name)).toEqual([
      "mcp__openfars-web__web_search",
      "mcp__openfars-web__web_fetch"
    ]);
    expect(tools.map((tool) => tool.parameters)).toEqual([
      {
        type: "object",
        additionalProperties: false,
        required: ["query"],
        properties: { query: { type: "string" } }
      },
      {
        type: "object",
        additionalProperties: false,
        required: ["url"],
        properties: { url: { type: "string" } }
      }
    ]);
    const success = await tools[0]!.execute("call-1", { query: "fixture" }, new AbortController().signal);
    expect(success.content[0].text).toContain("fixture search result");
    expect(success.content.some((item: { text?: string }) => item.text?.includes('"status":"outcome_unknown"'))).toBe(true);
    expect(success.details.mcpResult.structuredContent).toEqual({ status: "outcome_unknown", operationId: "original-operation", result: { output: "PROVIDER_OUTPUT_ONCE" } });
    expect(success.content.map((item: { text?: string }) => item.text ?? "").join("\n").match(/PROVIDER_OUTPUT_ONCE/g)).toHaveLength(1);
    const failure = await tools[1]!.execute(
      "call-2",
      { url: "invalid" },
      new AbortController().signal
    ).then(() => undefined, (error: Error) => error);
    expect(failure).toBeInstanceOf(Error);
    expect(JSON.parse(failure!.message)).toEqual(structuredFailure);
    expect(calls.filter((message) => message.method === "tools/list").map((message) =>
      message.params
    )).toEqual([{}, { cursor: "page-2" }]);
    expect(calls.filter((message) => message.method === "tools/call").map((message) =>
      message.params
    )).toEqual([
      { name: "web_search", arguments: { query: "fixture" } },
      { name: "web_fetch", arguments: { url: "invalid" } }
    ]);
    await shutdown?.();
  });

  it("cancels a real sleep using the MCP request ID when the Pi turn is interrupted", async () => {
    const command = await resolveSleepMcpCommand();
    process.env.SCIENCEEVOLVE_PI_MCP_CONFIG = JSON.stringify([{
      name: "scienceevolve-sleep", namespace: "scienceevolve-sleep", transport: "stdio", ...command
    }]);
    const tools: Array<Record<string, any>> = [];
    let shutdown: (() => Promise<void>) | undefined;
    await registerOpenFarsMcp({
      registerTool: vi.fn((tool) => tools.push(tool)),
      on: vi.fn((event, callback) => {
        if (event === "session_shutdown") shutdown = callback;
      })
    });
    try {
      const controller = new AbortController();
      // Deliberately different from the connection's numeric JSON-RPC request ID.
      const call = tools[0]!.execute("pi-call-sleep", { duration_ms: 43_200_000 }, controller.signal);
      const failure = call.then(() => undefined, (error: Error) => error);
      controller.abort(new Error("User interrupted the turn"));
      expect(await failure).toBeInstanceOf(Error);
      expect(JSON.parse((await failure)!.message)).toMatchObject({ error: { code: -32800 } });
      await expect(tools[0]!.execute("pi-call-next", { duration_ms: 1 }, new AbortController().signal))
        .resolves.toHaveProperty("content");
      await expect(tools[0]!.execute("pi-call-aborted", { duration_ms: 43_200_000 }, controller.signal))
        .rejects.toThrow("User interrupted the turn");
    } finally { await shutdown?.(); }
  });

  it("forwards only the declared artifact authority into a stdio MCP child", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-pi-artifact-mcp-"));
    temporaryRoots.push(root);
    const executable = path.join(root, "authority-mcp.mjs");
    await fs.writeFile(executable, `
import readline from "node:readline";
const keys = ${JSON.stringify([...artifactAuthorityKeys, NATIVE_PROCESS_SUPPORT_ENV])};
const lines = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
lines.on("line", (line) => {
  const request = JSON.parse(line);
  if (request.id === undefined || request.id === null) return;
  const result = request.method === "initialize"
    ? { protocolVersion: "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: "authority-fixture", version: "1" } }
    : request.method === "tools/list"
      ? { tools: [{ name: "read_authority", description: "Read authority", inputSchema: { type: "object", properties: {} } }] }
      : { content: [{ type: "text", text: JSON.stringify(Object.fromEntries(keys.map((key) => [key, process.env[key] ?? null]))) }], isError: false };
  process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: request.id, result }) + "\\n");
});
`, { encoding: "utf8", mode: 0o700 });

    const expected = {
      SCIENCEEVOLVE_PROJECT_ID: "prj_pi_authority",
      SCIENCEEVOLVE_INVOCATION_ID: "inv_pi_authority",
      SCIENCEEVOLVE_AGENT_NAME: "review",
      SCIENCEEVOLVE_APPEND_ROOT: path.join(root, "workspace"),
      SCIENCEEVOLVE_PUBLISHED_ARTIFACT_MANIFEST: path.join(root, "published-artifacts.json")
    };
    Object.assign(process.env, expected);
    process.env.SCIENCEEVOLVE_PI_MCP_CONFIG = JSON.stringify([{
      name: "artifact-authority",
      namespace: "artifact-authority",
      transport: "stdio",
      command: process.execPath,
      args: [executable],
      environmentKeys: artifactAuthorityKeys
    }]);

    const tools: Array<Record<string, any>> = [];
    let shutdown: (() => Promise<void>) | undefined;
    await registerOpenFarsMcp({
      registerTool: vi.fn((tool) => tools.push(tool)),
      on: vi.fn((event, callback) => {
        if (event === "session_shutdown") shutdown = callback;
      })
    });

    expect(tools.map((tool) => tool.name)).toEqual([
      "mcp__artifact-authority__read_authority"
    ]);
    const result = await tools[0]!.execute(
      "call-authority",
      {},
      new AbortController().signal
    ) as { content: Array<{ text: string }> };
    expect(JSON.parse(result.content[0]!.text)).toEqual({ ...expected, [NATIVE_PROCESS_SUPPORT_ENV]: "1" });
    await shutdown?.();
  });
});
