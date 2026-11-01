import { describe, expect, it } from "vitest";
import path from "node:path";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
  dshMcpPatch,
  dshMcpServerName,
  dshSessionArtifactPath
} from "../../src/core/harness-runtime/adapters/dsh-adapter.js";
import { gatewayModelContextWindow } from "../../src/core/harness-runtime/adapters/adapter-utils.js";

const rows = [{
  name: "fixture",
  namespace: "fixture",
  transport: "streamable-http" as const,
  url: "https://mcp.example.test/rpc"
}];

describe("DSH Adapter configuration", () => {
  it("preserves valid MCP namespaces and bounds long or Unicode names without normalization collisions", () => {
    expect(dshMcpServerName("fixture")).toBe("fixture");
    const names = ["scienceevolve-orchestration-control", "分析工具", "a.b", "a?b", "a_b"].map(dshMcpServerName);
    expect(new Set(names).size).toBe(names.length);
    for (const name of names) expect(name).toMatch(/^[A-Za-z0-9_-]{1,32}$/);
    expect(dshMcpServerName("scienceevolve-orchestration-control")).toBe(names[0]);
  });

  const plugin = path.resolve("../harness/dsh/node_modules/@deepseek-ai/dsh-mcp-client/lib/index.js");
  it.runIf(existsSync(plugin))("validates the generated control MCP namespace with the installed DSH plugin schema", async () => {
    const { Config } = await import(/* @vite-ignore */ pathToFileURL(plugin).href);
    const original = { transport: "stdio", serverName: "scienceevolve-orchestration-control", command: process.execPath,
      args: ["orchestration-control-mcp.js"], env: { SCIENCEEVOLVE_CONTROL_CONTEXT: "{}" }, failOnStartupError: true };
    expect(() => Config(original)).toThrow();
    const patch = dshMcpPatch([{ name: original.serverName, namespace: original.serverName, transport: "stdio", command: original.command,
      args: original.args, env: original.env }], false);
    const serverName = JSON.parse(patch.match(/serverName: (.+)/)![1]);
    expect(() => Config({ ...original, serverName })).not.toThrow();
    expect(() => Config({ transport: "streamable-http", serverName, url: "http://127.0.0.1/rpc", failOnStartupError: true })).not.toThrow();
  });

  it("uses the selected gateway model context window and defaults legacy snapshots to 256K", () => {
    const request = {
      agent: "Writer",
      project: {
        agents: {
          Writer: {
            gatewaySnapshot: {
              modelContextWindows: { "model-a": 1_000_000 }
            }
          }
        }
      }
    } as never;
    expect(gatewayModelContextWindow(request, "model-a")).toBe(1_000_000);
    expect(gatewayModelContextWindow(request, "legacy-model")).toBe(256 * 1024);
  });

  it("matches the SDK JSONL persistence layout and escapes session IDs injectively", () => {
    expect(dshSessionArtifactPath(
      path.join(path.sep, "runtime", "dsh-home"),
      path.join(path.sep, "project space", "shared"),
      "../session~id"
    )).toBe(path.join(
      path.sep,
      "runtime",
      "dsh-home",
      "sessions",
      "--project~0020space-shared--",
      "..~002Fsession~007Eid",
      "session.jsonl.zstd"
    ));
  });

  it("uses the invocation-scoped MCP row instead of DSH's separately credentialed web provider", () => {
    const enabled = dshMcpPatch(rows, true);
    expect(enabled).toContain("- id: tool-web");
    expect(enabled).toContain("    search: false");
    expect(enabled).toContain("    fetch: false");
    expect(enabled).toContain("serverName: \"fixture\"");
  });

  it("does not expose an invocation Web MCP row when Web Search is disabled", () => {
    const disabled = dshMcpPatch([], false);
    expect(disabled).toContain("    search: false");
    expect(disabled).toContain("    fetch: false");
    expect(disabled).not.toContain("openfars-mcp-");
  });

  it("leaves turn admission to OpenFARS even without project MCP rows", () => {
    for (const patch of [dshMcpPatch(rows, true), dshMcpPatch([], false)]) {
      expect(patch).toContain("- id: tool-goal\n  disabled: true");
      expect(patch).toContain("- id: goal-round-driver\n  disabled: true");
    }
  });
});
