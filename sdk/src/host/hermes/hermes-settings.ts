import { promises as fs } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { SessionResumeError } from "../../core/harness-runtime/errors.js";
import type { SessionRef } from "../../core/harness-runtime/contracts.js";
import { validHermesSessionId } from "./hermes-acp.js";

/** Only SDK-owned homes are passed here; never a user's ~/.hermes. */
export async function prepareHermesSettings(options: {
  home: string; cwd: string; baseUrl: string; model: string; contextWindow: number;
  allowNativeTools: boolean; session: SessionRef;
}): Promise<{ requireHistory: boolean }> {
  const { home, session } = options;
  await fs.mkdir(home, { recursive: true, mode: 0o700 });
  const canonical = await fs.realpath(home);
  if (path.resolve(home) !== canonical || (await fs.lstat(home)).isSymbolicLink()) throw new Error("Hermes home must be a pinned SDK directory");
  const config = {
    model: { default: options.model, provider: "custom", base_url: options.baseUrl,
      api_mode: "chat_completions", context_length: options.contextWindow },
    // Empty is authoritative in Hermes; do not use its broad 'hermes-acp' default.
    platform_toolsets: { acp: options.allowNativeTools ? ["terminal", "file"] : [] },
    agent: { disabled_toolsets: ["delegation", "cron", "memory", "skills", "code_execution"] },
    memory: { memory_enabled: false, user_profile_enabled: false },
    plugins: { enabled: [], auto_apply: false },
    mcp_servers: {},
    // The SDK validates advertised control tools before allowing a turn. Do not
    // hide those tools behind Hermes' lazy discovery/tool_search bridge.
    tools: { tool_search: { enabled: "off" } },
    fallback_providers: [],
    // A background title request can outlive ACP prompt completion and collide
    // with the SDK's per-turn gateway authority drain. The SDK names its tasks.
    auxiliary: { title_generation: { enabled: false, model_upgrade_enabled: false } },
    terminal: { backend: "local", cwd: options.cwd }
  };
  const configFile = path.join(home, "config.yaml");
  const existing = await fs.lstat(configFile).catch(error => { if (error.code === "ENOENT") return undefined; throw error; });
  if (existing && (!existing.isFile() || existing.isSymbolicLink() || existing.nlink !== 1)) throw new Error("Unsafe Hermes configuration file");
  // JSON is a YAML subset. The short-lived route token stays in the process environment.
  await fs.writeFile(configFile, JSON.stringify(config, null, 2) + "\n", { mode: 0o600 });
  if (!session.resumedAt) return { requireHistory: false };
  try {
    if (!validHermesSessionId(session.nativeId)) throw new Error("Invalid Hermes session identity");
    const file = path.join(home, "state.db");
    for (const suffix of ["", "-wal", "-shm"]) {
      const stat = await fs.lstat(file + suffix).catch(error => { if (suffix && error.code === "ENOENT") return undefined; throw error; });
      if (stat && (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1)) throw new Error("Unsafe Hermes session database");
    }
    const db = new DatabaseSync(file, { open: true });
    try {
      db.exec("PRAGMA busy_timeout=5000; BEGIN IMMEDIATE");
      const row = db.prepare("SELECT source, model_config FROM sessions WHERE id = ?").get(session.nativeId);
      if (!row || row.source !== "acp") throw new Error("Native ACP session missing");
      const meta = typeof row.model_config === "string" ? JSON.parse(row.model_config) : undefined;
      if (!meta || typeof meta.cwd !== "string" || path.resolve(meta.cwd) !== path.resolve(options.cwd)) throw new Error("Native session workspace mismatch");
      const count = db.prepare("SELECT COUNT(*) AS n FROM messages WHERE session_id = ?").get(session.nativeId);
      // Hermes persists the old proxy endpoint in model_config. Rebind only route
      // metadata before its process starts; never rewrite messages or tool history.
      db.prepare("UPDATE sessions SET model = ?, model_config = ? WHERE id = ?").run(options.model,
        JSON.stringify({ ...meta, provider: "custom", base_url: options.baseUrl, api_mode: "chat_completions" }), session.nativeId);
      db.exec("COMMIT");
      return { requireHistory: Number(count?.n ?? 0) > 0 };
    } finally { db.close(); }
  } catch (cause) {
    throw new SessionResumeError("hermes", session.nativeId, { cause: cause instanceof Error ? cause : undefined });
  }
}

/** Explicit SDK skills are prompt inputs, not permission to install/mutate Hermes skills. */
export async function hermesSkillPrompt(paths: readonly string[]): Promise<string> {
  const texts: string[] = [];
  for (const selected of [...new Set(paths)]) {
    const file = (await fs.stat(selected)).isDirectory() ? path.join(selected, "SKILL.md") : selected;
    const text = await fs.readFile(file, "utf8");
    texts.push(`Selected SDK skill (${file}):\n${text}`);
  }
  return texts.join("\n\n");
}
