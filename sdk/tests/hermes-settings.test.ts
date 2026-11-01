import { afterEach, describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import os from "node:os";
import path from "node:path";
import { prepareHermesSettings } from "../src/host/hermes/hermes-settings.js";
import { readMainHarnessGateway } from "../src/main-harness-gateway.js";

const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map(root => fs.rm(root, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 }))); });
async function input() {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), "sdk-hermes-")); roots.push(home);
  return { home, cwd: home, baseUrl: "http://127.0.0.1:43210/v1", model: "fixture-model", contextWindow: 256000, allowNativeTools: false,
    session: { schemaVersion: 1 as const, harnessId: "hermes", adapterVersion: "1", generation: 0, nativeId: "native-session", durable: true, createdAt: "now", resumedAt: "now" } };
}
function database(home: string, meta: unknown) {
  const db = new DatabaseSync(path.join(home, "state.db"));
  db.exec("CREATE TABLE sessions(id TEXT PRIMARY KEY, source TEXT, model TEXT, model_config TEXT); CREATE TABLE messages(session_id TEXT, content TEXT)");
  db.prepare("INSERT INTO sessions VALUES (?, 'acp', 'old-model', ?)").run("native-session", JSON.stringify(meta));
  db.prepare("INSERT INTO messages VALUES (?, ?)").run("native-session", "original transcript");
  db.close();
}
describe("Hermes isolated native home and resume route binding", () => {
  it("supports explicit env gateway import without reading personal Hermes profiles", async () => {
    const input = { harness: "hermes" as const, model: "fixture", source: "env" as const,
      environment: { OPENAI_BASE_URL: "https://provider.example/v1", OPENAI_API_KEY: "fixture-only" } };
    expect(await readMainHarnessGateway(input)).toMatchObject({ protocol: "chat-completions", defaultModel: "fixture" });
    await expect(readMainHarnessGateway({ ...input, environment: {} })).rejects.toThrow(/requires/);
    await expect(readMainHarnessGateway({ ...input, source: "profile" })).rejects.toThrow(/not supported/);
  });
  it("disables native write/shell/delegation defaults in restricted mode without storing credentials", async () => {
    const args = await input(); delete (args.session as { resumedAt?: string }).resumedAt;
    await prepareHermesSettings(args);
    const config = JSON.parse(await fs.readFile(path.join(args.home, "config.yaml"), "utf8"));
    expect(config.platform_toolsets.acp).toEqual([]);
    expect(config.model).toMatchObject({ provider: "custom", default: "fixture-model", context_length: 256000 });
    expect(config.model.api_key).toBeUndefined();
    expect(config.agent.disabled_toolsets).toContain("delegation");
    expect(config.auxiliary.title_generation).toEqual({ enabled: false, model_upgrade_enabled: false });
    expect(await fs.readdir(args.home)).toEqual(["config.yaml"]);
  });
  it("rebinds the expired proxy route but preserves native transcript exactly", async () => {
    const args = await input(); database(args.home, { cwd: args.cwd, base_url: "http://127.0.0.1:9999/v1", unrelated: "keep" });
    expect(await prepareHermesSettings(args)).toEqual({ requireHistory: true });
    const db = new DatabaseSync(path.join(args.home, "state.db"));
    try {
      const row = db.prepare("SELECT * FROM sessions").get()!;
      expect(row.model).toBe(args.model);
      expect(JSON.parse(String(row.model_config))).toMatchObject({ base_url: args.baseUrl, provider: "custom", unrelated: "keep" });
      expect(db.prepare("SELECT content FROM messages").get()?.content).toBe("original transcript");
    } finally { db.close(); }
  });
  it("fails closed on missing or wrong-workspace sessions", async () => {
    const args = await input();
    await expect(prepareHermesSettings(args)).rejects.toMatchObject({ code: "SESSION_RESUME_FAILED" });
    database(args.home, { cwd: path.join(args.home, "other") });
    await expect(prepareHermesSettings(args)).rejects.toMatchObject({ code: "SESSION_RESUME_FAILED" });
  });
  it("only yolo enables native terminal and file tools", async () => {
    const args = await input(); delete (args.session as { resumedAt?: string }).resumedAt;
    await prepareHermesSettings({ ...args, allowNativeTools: true });
    expect(JSON.parse(await fs.readFile(path.join(args.home, "config.yaml"), "utf8")).platform_toolsets.acp).toEqual(["terminal", "file"]);
  });
});
