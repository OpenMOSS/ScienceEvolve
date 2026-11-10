import { afterEach, describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { readHarnessGateway } from "../src/host/harness-gateway.js";

const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true }))); });
async function temporary() { const root = await fs.mkdtemp(path.join(os.tmpdir(), "native-gateway-")); roots.push(root); return root; }
async function write(root: string, file: string, content: unknown) {
  const target = path.join(root, file); await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, typeof content === "string" ? content : JSON.stringify(content)); return target;
}
const cases = [
  { harness: "codex", prefix: "SDK_CODEX", folder: ".codex", file: "config.toml", directoryEnv: "CODEX_HOME",
    content: 'model_provider = "company"\n[model_providers.company]\nbase_url = "https://gateway.example/v1"\nenv_key = "NATIVE_KEY"\n', protocol: "responses" },
  { harness: "pi", prefix: "SDK_PI", folder: ".pi/agent", file: "models.json", directoryEnv: "PI_CODING_AGENT_DIR",
    content: { providers: { company: { baseUrl: "https://gateway.example/v1", api: "openai-completions", apiKey: "NATIVE_KEY", models: [{ id: "test-model", contextWindow: 123456 }] } } }, protocol: "chat-completions" },
  { harness: "dsh", prefix: "SDK_DSH", folder: ".dsh", file: "settings.yaml", directoryEnv: "DSH_HOME",
    content: 'llm-pi-ai:\n  providers:\n    company:\n      baseURL: https://gateway.example/v1\n      api: openai-completions\n      apiKeyEnv: NATIVE_KEY\nagent-default-model:\n  provider: company\n', protocol: "chat-completions" }
] as const;

describe("Harness native profile paths", () => {
  it("rejects Claude Code before reading profiles or accepting environment credentials", async () => {
    await expect(readHarnessGateway("claude-code", "model", {
      SDK_CLAUDE_CODE_API_KEY: "test-key", SDK_CLAUDE_CODE_BASE_URL: "https://gateway.example/v1"
    }, "/unused", "env")).rejects.toThrow("Unsupported native Harness: claude-code");
  });
  it.each(cases)("$harness env selection ignores profile and environment model settings", async (c) => {
    const env = {
      [`${c.prefix}_PROFILE`]: "/invalid-but-ignored",
      [`${c.prefix}_API_KEY`]: "env-secret", [`${c.prefix}_BASE_URL`]: "https://env.example/v1",
      [`${c.prefix}_MODEL`]: "ignored-model"
    };
    expect(await readHarnessGateway(c.harness, "workflow-model", env, "/unused", "env")).toMatchObject({
      models: ["workflow-model"], defaultModel: "workflow-model", apiKey: "env-secret", url: "https://env.example/v1"
    });
    for (const field of ["API_KEY", "BASE_URL"]) {
      const incomplete = { ...env };
      delete incomplete[`${c.prefix}_${field}`];
      await expect(readHarnessGateway(c.harness, "workflow-model", incomplete, "/unused", "env")).rejects.toThrow("Configure");
    }
  });
  it.each(cases)("$harness profile selection defaults to its native location and keeps the workflow model", async (c) => {
    const home = await temporary();
    const content = c.harness === "codex" ? `model = "ignored-native-model"\n${c.content}`
      : c.content;
    await write(home, `${c.folder}/${c.file}`, content);
    for (const location of [undefined, "", " ", "default"]) {
      expect(await readHarnessGateway(c.harness, "workflow-model", {
        [`${c.prefix}_PROFILE`]: location, NATIVE_KEY: "native-secret",
        [`${c.prefix}_API_KEY`]: "ignored-secret", [`${c.prefix}_BASE_URL`]: "invalid-ignored-url"
      }, home, "profile")).toMatchObject({ defaultModel: "workflow-model", apiKey: "native-secret", url: "https://gateway.example/v1" });
    }
    await expect(readHarnessGateway(c.harness, "workflow-model", {
      [`${c.prefix}_PROFILE`]: path.join(home, "missing"),
      [`${c.prefix}_API_KEY`]: "fallback-secret", [`${c.prefix}_BASE_URL`]: "https://fallback.example/v1"
    }, home, "profile")).rejects.toThrow("does not exist");
  });
  it.each(cases)("$harness default reads its native directory and outranks direct env", async (c) => {
    const home = await temporary(); await write(home, `${c.folder}/${c.file}`, c.content);
    const gateway = await readHarnessGateway(c.harness, "test-model", {
      [`${c.prefix}_PROFILE`]: "default", [`${c.prefix}_API_KEY`]: "wrong-secret", [`${c.prefix}_BASE_URL`]: "not-a-url", NATIVE_KEY: "native-secret"
    }, home);
    expect(gateway).toMatchObject({ url: "https://gateway.example/v1", apiKey: "native-secret", protocol: c.protocol });
  });
  it.each(cases)("$harness accepts both a directory and native file, and default directory override", async (c) => {
    const root = await temporary(); const file = await write(root, c.file, c.content);
    for (const location of [root, file, "default"]) {
      const gateway = await readHarnessGateway(c.harness, "test-model", {
        [`${c.prefix}_PROFILE`]: location, [c.directoryEnv]: root, NATIVE_KEY: "native-secret"
      }, "/unused-home");
      expect(gateway.apiKey).toBe("native-secret");
    }
  });
  it.each(cases)("$harness direct env is isolated per Harness", async (c) => {
    const gateway = await readHarnessGateway(c.harness, "test-model", {
      [`${c.prefix}_API_KEY`]: "direct-secret", [`${c.prefix}_BASE_URL`]: "https://direct.example/v1",
      [`${c.prefix}_PROTOCOL`]: "responses", [`${c.prefix}_CONTEXT_WINDOW`]: "100000",
      OPENAI_API_KEY: "ambient-secret", OPENAI_BASE_URL: "https://ambient.example/v1"
    });
    expect(gateway).toMatchObject({ apiKey: "direct-secret", url: "https://direct.example/v1", protocol: "responses", modelContextWindows: { "test-model": 100000 } });
  });
  it("loads an SDK-owned reasoning mapping independently of the native Harness profile", async () => {
    const root = await temporary();
    const reasoningFile = await write(root, "reasoning.json", {
      "test-model": {
        parameter: "chat_template_kwargs.reasoning_effort",
        options: [{ id: "deep", label: "Deep", value: "high" }]
      }
    });
    const gateway = await readHarnessGateway("pi", "test-model", {
      SDK_PI_API_KEY: "direct-secret",
      SDK_PI_BASE_URL: "https://direct.example/v1",
      SDK_PI_REASONING_FILE: reasoningFile
    });
    expect(gateway.modelReasoning).toEqual({
      "test-model": {
        parameter: "chat_template_kwargs.reasoning_effort",
        options: [{ id: "deep", label: "Deep", value: "high" }]
      }
    });
  });
  it("does not fall back from missing, malformed or keyless profiles and does not quote secrets", async () => {
    const root = await temporary();
    const env = { SDK_CODEX_PROFILE: root, SDK_CODEX_API_KEY: "fallback-secret", SDK_CODEX_BASE_URL: "https://fallback.example/v1" };
    await expect(readHarnessGateway("codex", "m", { ...env, SDK_CODEX_PROFILE: path.join(root, "missing") })).rejects.toThrow("does not exist");
    await write(root, "config.toml", 'secret = "UNTERMINATED-SECRET');
    await expect(readHarnessGateway("codex", "m", env)).rejects.toThrow(/^Invalid native profile file: config.toml$/);
    await write(root, "config.toml", 'model_provider = "openai"');
    await expect(readHarnessGateway("codex", "m", env)).rejects.toThrow("fallback is disabled");
  });
  it("reads Codex selected TOML profile and sibling auth.json", async () => {
    const root = await temporary();
    await write(root, "config.toml", 'profile = "work"\n[profiles.work]\nmodel_provider = "company"\nmodel_context_window = 123456\n[model_providers.company]\nbase_url = "https://work.example/v1"\n');
    await write(root, "auth.json", { OPENAI_API_KEY: "auth-secret" });
    expect(await readHarnessGateway("codex", "m", { SDK_CODEX_PROFILE: root })).toMatchObject({ apiKey: "auth-secret", url: "https://work.example/v1", modelContextWindows: { m: 123456 } });
  });
  it("Pi selects settings.defaultProvider and resolves sibling auth.json", async () => {
    const root = await temporary();
    await write(root, "models.json", { providers: { one: { baseUrl: "https://one.example/v1" }, two: { baseUrl: "https://two.example/v1", api: "openai-responses" } } });
    await expect(readHarnessGateway("pi", "m", { SDK_PI_PROFILE: root })).rejects.toThrow("default provider");
    await write(root, "settings.json", { defaultProvider: "two" });
    await write(root, "auth.json", { two: { type: "api_key", key: "pi-auth-secret" } });
    expect(await readHarnessGateway("pi", "m", { SDK_PI_PROFILE: root })).toMatchObject({ apiKey: "pi-auth-secret", url: "https://two.example/v1", protocol: "responses" });
  });
  it("reads DSH native credential references before ambient env", async () => {
    const root = await temporary(); await write(root, "settings.yaml", cases[2].content);
    await write(root, ".credentials.yaml", 'version: 1\nrefs:\n  NATIVE_KEY: stored-secret\n');
    expect(await readHarnessGateway("dsh", "m", { SDK_DSH_PROFILE: root, NATIVE_KEY: "ambient-secret" })).toMatchObject({ apiKey: "stored-secret" });
  });
});


describe("native default layouts", () => {
  it("Codex supports an auth-only default home and expands tilde", async () => {
    const home = await temporary();
    await write(home, ".codex/auth.json", { OPENAI_API_KEY: "auth-only-secret" });
    expect(await readHarnessGateway("codex", "m", { SDK_CODEX_PROFILE: "~/.codex" }, home)).toMatchObject({ url: "https://api.openai.com/v1", apiKey: "auth-only-secret" });
  });
  it("Pi reads a builtin provider without requiring custom models.json", async () => {
    const home = await temporary();
    await write(home, ".pi/agent/settings.json", { defaultProvider: "openai" });
    await write(home, ".pi/agent/auth.json", { openai: { type: "api_key", key: "pi-builtin-secret" } });
    expect(await readHarnessGateway("pi", "gpt-5", { SDK_PI_PROFILE: "default" }, home)).toMatchObject({ url: "https://api.openai.com/v1", apiKey: "pi-builtin-secret" });
  });
  it("DSH resolves a Cordis patch and native credentials from the home", async () => {
    const home = await temporary();
    const file = await write(home, ".dsh/profiles/headless/cordis.patch.yml", '- id: llm-pi-ai\n  config:\n    providers:\n      company:\n        baseURL: https://cordis.example/v1\n        api: openai-responses\n        apiKeyEnv: DSH_KEY\n');
    await write(home, ".dsh/.credentials.yaml", 'version: 1\nrefs:\n  DSH_KEY: dsh-stored-secret\n');
    for (const profile of ["default", file, path.dirname(file)]) {
      expect(await readHarnessGateway("dsh", "m", { SDK_DSH_PROFILE: profile }, home)).toMatchObject({ url: "https://cordis.example/v1", apiKey: "dsh-stored-secret", protocol: "responses" });
    }
  });
});
