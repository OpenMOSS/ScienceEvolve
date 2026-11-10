import { afterEach, describe, expect, it, vi } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { createMainResearchSdk, type MainResearchSdk } from "../src/main-client.js";

const roots: string[] = [];
const sdks: MainResearchSdk[] = [];
afterEach(async () => {
  await Promise.all(sdks.splice(0).map((sdk) => sdk.close()));
  vi.restoreAllMocks();
  await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 })));
});
async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-main-profile-")); roots.push(root);
  const sdk = await createMainResearchSdk({ dataDir: path.join(root, "data") }); sdks.push(sdk);
  // These imports must not perform any provider/model call.
  const fetch = vi.spyOn(globalThis, "fetch").mockImplementation(async () => { throw new Error("Import must not fetch"); });
  return { root, sdk, fetch };
}
const cases = [
  { harness: "codex", prefix: "SDK_CODEX", protocol: "responses" },
  { harness: "pi", prefix: "SDK_PI", protocol: "chat-completions" },
  { harness: "dsh", prefix: "SDK_DSH", protocol: "chat-completions" }
] as const;

describe("explicit main API-key env/profile import, without network or native writes", () => {
  it("rejects an unsupported harness before importing credentials", async () => {
    const { sdk, fetch } = await fixture();
    await expect(sdk.gateways.importHarness({ harness: "hermes", model: "fixture", source: "env",
      environment: {} } as never)).rejects.toThrow(/harness/);
    expect(await sdk.gateways.list()).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each(cases)("imports $harness env keys and context without probing", async ({ harness, prefix, protocol }) => {
    const { sdk, fetch } = await fixture();
    const key = "opaque+/=imported-key";
    const gateway = await sdk.gateways.importHarness({ harness, model: "fixture", source: "env", environment: {
      [`${prefix}_BASE_URL`]: "https://93.184.216.34/v1", [`${prefix}_API_KEY`]: key,
      [`${prefix}_CONTEXT_WINDOW`]: "262144", [`${prefix}_PROTOCOL`]: protocol,
      [`${prefix}_PROFILE`]: "nonexistent-profile-must-not-be-read"
    } });
    expect(gateway).toMatchObject({ protocol, models: ["fixture"], modelContextWindows: { fixture: 262144 }, apiKeyConfigured: true });
    expect(JSON.stringify(gateway)).not.toContain(key);
    expect(gateway).not.toHaveProperty("apiKey");
    expect(gateway.tests ?? []).toEqual([]);
    expect(gateway.test.status).toBe("untested");
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(cases)("reads $harness native configuration without rewriting files", async ({ harness, prefix, protocol }) => {
    const { root, sdk, fetch } = await fixture();
    const profile = path.join(root, "profile"); await fs.mkdir(profile);
    const key = "opaque-profile-fixture";
    const files: Record<string, string> = harness === "codex" ? {
      "config.toml": 'model_provider = "fixture"\nmodel_context_window = 262144\n[model_providers.fixture]\nbase_url = "https://93.184.216.34/v1"\nwire_api = "responses"\nenv_key = "PROVIDER_TEST_KEY"\n',
      "auth.json": '{"tokens":{"access_token":"must-not-be-used"}}'
    } : harness === "pi" ? {
      "models.json": JSON.stringify({ providers: { fixture: { baseUrl: "https://93.184.216.34/v1", api: "openai-completions", apiKey: "PROVIDER_TEST_KEY", models: [{ id: "fixture", contextWindow: 262144 }] } } }),
      "settings.json": '{"defaultProvider":"fixture"}'
    } : harness === "dsh" ? {
      "settings.yaml": 'llm-pi-ai:\n  providers:\n    fixture:\n      baseURL: https://93.184.216.34/v1\n      api: openai-completions\n      apiKeyEnv: PROVIDER_TEST_KEY\nagent-default-model:\n  provider: fixture\n'
    } : {
      "settings.json": JSON.stringify({ env: { ANTHROPIC_BASE_URL: "https://93.184.216.34/v1", ANTHROPIC_AUTH_TOKEN: key } })
    };
    for (const [file, bytes] of Object.entries(files)) await fs.writeFile(path.join(profile, file), bytes);
    const before = await Promise.all(Object.keys(files).map(async (file) => ({ file, bytes: await fs.readFile(path.join(profile, file)), stat: await fs.stat(path.join(profile, file)) })));
    const gateway = await sdk.gateways.importHarness({ harness, model: "fixture", source: "profile", profilePath: profile,
      name: "Readonly native import", environment: { PROVIDER_TEST_KEY: key, [`${prefix}_BASE_URL`]: "invalid-fallback", [`${prefix}_API_KEY`]: "must-not-fallback" } });
    expect(gateway).toMatchObject({ name: "Readonly native import", protocol, apiKeyConfigured: true });
    expect(JSON.stringify(await sdk.gateways.list())).not.toContain(key);
    for (const { file, bytes, stat } of before) {
      expect(await fs.readFile(path.join(profile, file))).toEqual(bytes);
      expect((await fs.stat(path.join(profile, file))).mtimeMs).toBe(stat.mtimeMs);
    }
    expect((await fs.readdir(profile)).sort()).toEqual(Object.keys(files).sort());
    expect(fetch).not.toHaveBeenCalled();
  });

  it("refuses OAuth-only profiles instead of extracting tokens or falling back to env", async () => {
    const { root, sdk } = await fixture();
    const profile = path.join(root, "oauth"); await fs.mkdir(profile);
    const auth = '{"tokens":{"access_token":"opaque-oauth-secret","refresh_token":"opaque-refresh-secret"}}';
    await fs.writeFile(path.join(profile, "config.toml"), 'model_provider = "openai"');
    await fs.writeFile(path.join(profile, "auth.json"), auth);
    await expect(sdk.gateways.importHarness({ harness: "codex", model: "fixture", source: "profile", profilePath: profile,
      environment: { SDK_CODEX_API_KEY: "fallback-key", SDK_CODEX_BASE_URL: "https://93.184.216.34/v1" } })).rejects.toThrow(/OAuth-only/);
    expect(await sdk.gateways.list()).toEqual([]);
    expect(await fs.readFile(path.join(profile, "auth.json"), "utf8")).toBe(auth);
  });
  it("refuses shell credential helpers rather than executing them", async () => {
    const { root, sdk } = await fixture();
    const profile = path.join(root, "pi"); await fs.mkdir(profile);
    await fs.writeFile(path.join(profile, "models.json"), JSON.stringify({ providers: { fixture: {
      baseUrl: "https://93.184.216.34/v1", apiKey: "!echo forbidden-helper", api: "openai-completions"
    } } }));
    await expect(sdk.gateways.importHarness({ harness: "pi", model: "fixture", source: "profile", profilePath: profile, environment: {} })).rejects.toThrow(/shell helpers/);
    expect(await sdk.gateways.list()).toEqual([]);
  });
  it("rejects unknown fields, mixed sources and invalid profiles before saving a gateway", async () => {
    const { sdk, root } = await fixture();
    const input = { harness: "codex", model: "fixture", source: "env", environment: {} } as const;
    await expect(sdk.gateways.importHarness({ ...input, profilePath: root })).rejects.toThrow(/only valid/);
    await expect(sdk.gateways.importHarness({ ...input, profilePath: "relative" })).rejects.toThrow(/absolute/);
    await expect(sdk.gateways.importHarness({ ...input, executeHelper: true } as never)).rejects.toThrow();
    await expect(sdk.gateways.importHarness({ ...input, source: "profile", profilePath: root })).rejects.toThrow(/usable API-key/);
    expect(await sdk.gateways.list()).toEqual([]);
  });
  it("redacts imported opaque keys even when embedded in a public gateway name", async () => {
    const { sdk } = await fixture();
    const key = "opaque+/=embedded";
    const gateway = await sdk.gateways.importHarness({ harness: "codex", model: "fixture", source: "env", name: key,
      environment: { SDK_CODEX_BASE_URL: "https://93.184.216.34/v1", SDK_CODEX_API_KEY: key } });
    expect(gateway.name).toBe("[REDACTED]");
    expect(JSON.stringify(await sdk.gateways.list())).not.toContain(key);
    await sdk.close();
    await expect(sdk.gateways.importHarness({ harness: "codex", model: "fixture", source: "env" })).rejects.toThrow(/closed/);
  });
});
