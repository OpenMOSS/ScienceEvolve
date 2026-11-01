import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { HarnessPromptCatalog } from "../../src/core/harness-runtime/prompt-catalog.js";

describe("read-only Harness prompt provenance", () => {
  it("requires an exact installed model and never substitutes a default or a historical Session", async () => {
    const execute = vi.fn(async (_bin: string, args: string[]) => args[0] === "--version"
      ? "codex-cli 0.153.4\n" : JSON.stringify({ models: [{ slug: "exact-model", base_instructions: "verbatim native base\n" }] }));
    const catalog = new HarnessPromptCatalog({ resolveExecutable: async () => process.execPath, execute });
    const exact = await catalog.query({ harness: "codex", model: "exact-model" });
    expect(exact).toMatchObject({ status: "available", installedVersion: "0.153.4", resolvedModel: "exact-model",
      scope: "base-default", sourceType: "bundled-default", text: "verbatim native base\n" });
    expect(exact.collectedAt).toMatch(/^\d{4}-/);
    expect(exact.sha256).toMatch(/^[a-f0-9]{64}$/);
    const missing = await catalog.query({ harness: "codex", model: "custom-model" });
    expect(missing).toMatchObject({ status: "model-unmatched", model: "custom-model" });
    expect(missing.text).toBeUndefined();
    expect(execute.mock.calls.every(([, args]) => args.join(" ") === "--version" || args.join(" ") === "debug models --bundled")).toBe(true);
  });

  it("reuses the same source/configuration and invalidates model, version and relevant configuration changes", async () => {
    let version = "0.153.4";
    const execute = vi.fn(async (_bin: string, args: string[]) => args[0] === "--version"
      ? `codex-cli ${version}` : JSON.stringify({ models: ["a", "b"].map(slug => ({ slug, base_instructions: `${version}:${slug}` })) }));
    const catalog = new HarnessPromptCatalog({ resolveExecutable: async () => process.execPath, execute });
    const query = { harness: "codex", model: "a", webSearch: false };
    const first = await catalog.query(query);
    expect(await catalog.query(query)).toBe(first);
    expect(execute.mock.calls.filter(([, args]) => args[0] === "debug")).toHaveLength(1);
    expect((await catalog.query({ ...query, forceRefresh: true })).text).toBe(first.text);
    expect(execute.mock.calls.filter(([, args]) => args[0] === "debug")).toHaveLength(2);
    const changed = await catalog.query({ ...query, webSearch: true });
    expect(changed.configurationDigest).not.toBe(first.configurationDigest);
    expect((await catalog.query({ ...query, model: "b" })).text).toBe("0.153.4:b");
    version = "0.154.0";
    expect((await catalog.query(query)).text).toBe("0.154.0:a");
    expect(execute.mock.calls.filter(([, args]) => args[0] === "debug")).toHaveLength(5);
  });

  it.each(["pi", "dsh", "claude-code"])("reports an absent %s installation without inventing text", async harness => {
    const execute = vi.fn();
    const result = await new HarnessPromptCatalog({ resolveExecutable: async () => undefined, execute }).query({ harness, model: "selected" });
    expect(result.status).toBe("not-installed");
    expect(result.text).toBeUndefined();
    expect(execute).not.toHaveBeenCalled();
  });

  it("distinguishes an unknown version from a failed native source collection", async () => {
    const resolver = async () => process.execPath;
    const unknown = await new HarnessPromptCatalog({ resolveExecutable: resolver, execute: async () => "unrecognised" })
      .query({ harness: "codex", model: "a" });
    expect(unknown.status).toBe("version-unavailable");
    const failed = await new HarnessPromptCatalog({ resolveExecutable: resolver, execute: async (_bin, args) => {
      if (args[0] === "--version") return "codex-cli 0.153.4";
      throw new Error("SECRET_EXCEPTION_MUST_NOT_ESCAPE");
    } }).query({ harness: "codex", model: "a" });
    expect(failed.status).toBe("source-unavailable");
    expect(JSON.stringify(failed)).not.toContain("SECRET_EXCEPTION");
  });
});

for (const harness of ["dsh", "pi"] as const) {
  const executable = path.resolve(`../harness/${harness}/node_modules/.bin/${harness}`);
  it.runIf(existsSync(executable))(`reads the installed ${harness} base prompt without opening a model or project Session`, async () => {
    const catalog = new HarnessPromptCatalog({ resolveExecutable: async () => executable });
    const result = await catalog.query({ harness, model: "custom-selected-model" });
    expect(result).toMatchObject({ status: "available", resolvedModel: "custom-selected-model", sourceType: "installed-default", scope: "base-default" });
    expect(result.installedVersion).toMatch(/^\d+\.\d+\.\d+/);
    expect(result.text).toContain(harness === "dsh" ? "DeepSeek Harness" : "coding agent harness");
    expect(result.text).toContain("{{cwd}}");
    expect(result.scopeNote).toContain("运行时");
    expect(result.sha256).toMatch(/^[a-f0-9]{64}$/);
    if (harness === "dsh") expect(result.text).toContain("custom-selected-model");
  });
}
