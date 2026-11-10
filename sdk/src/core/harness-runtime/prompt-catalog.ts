import { collectInstalledHarnessPrompt } from "./adapters/native-prompt-source.js";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { stat } from "node:fs/promises";
import { promisify } from "node:util";
import { BUILTIN_HARNESS_DESCRIPTORS, resolveHarnessExecutable } from "./registry.js";

const execute = promisify(execFile);

import type { HarnessPromptQuery, HarnessPromptResult } from "../internal/shared/harness-prompt-contract.js";
export type { HarnessPromptQuery, HarnessPromptResult } from "../internal/shared/harness-prompt-contract.js";

/** Inspection never starts a model, opens a business Session, or reads secrets. */
export class HarnessPromptCatalog {
  private readonly cache = new Map<string, { at: number; result: Promise<HarnessPromptResult> }>();

  constructor(private readonly options: {
    resolveExecutable?: (harness: string) => Promise<string | undefined>;
    execute?: (executable: string, args: string[]) => Promise<string>;
  } = {}) {}

  async query(query: HarnessPromptQuery): Promise<HarnessPromptResult> {
    const descriptor = BUILTIN_HARNESS_DESCRIPTORS.find(item => item.id === query.harness);
    if (!descriptor) throw new Error("Unknown Harness");
    // Explicit allowlist: raw Agent/Gateway objects and API keys never enter this query or its cache.
    const configuration = { permission: query.permission, reasoningEffort: query.reasoningEffort,
      webSearch: query.webSearch, skills: query.skills ?? [], autoSkills: query.autoSkills ?? [],
      mcpServers: query.mcpServers ?? [] };
    const configurationDigest = createHash("sha256").update(JSON.stringify(configuration)).digest("hex");
    const base: HarnessPromptResult = { harness: query.harness, model: query.model,
      status: "source-unavailable", sourceType: "unavailable", source: "Installed Harness",
      scope: "base-default", collectedAt: new Date().toISOString(), configurationDigest };
    const executable = await (this.options.resolveExecutable?.(query.harness) ?? resolveHarnessExecutable(descriptor));
    if (!executable) return { ...base, status: "not-installed", reason: `${descriptor.label} 未安装，无法取得对应版本的原生提示词。` };
    let installedVersion: string;
    try {
      const match = (await this.run(executable, ["--version"])).match(/(?:^|\s)(\d+\.\d+\.\d+(?:-[\w.-]+)?)(?:\s|$)/);
      if (!match) throw new Error("Unknown version output");
      installedVersion = match[1];
    } catch {
      return { ...base, status: "version-unavailable", reason: "无法确定当前安装版本；未使用其他安装或历史会话的提示词。" };
    }
    const info = await stat(executable);
    const identity = JSON.stringify([executable, info.mtimeMs, info.size, installedVersion, query.harness, query.model, configuration]);
    const cached = this.cache.get(identity);
    if (!query.forceRefresh && cached && Date.now() - cached.at < 300_000) return cached.result;
    const result = this.collect(executable, query, { ...base, installedVersion });
    const entry = { at: Date.now(), result };
    this.cache.set(identity, entry);
    if (this.cache.size > 128) this.cache.delete(this.cache.keys().next().value!);
    try {
      const collected = await result;
      if (collected.status === "source-unavailable" && this.cache.get(identity) === entry) this.cache.delete(identity);
      return collected;
    } catch (error) {
      if (this.cache.get(identity) === entry) this.cache.delete(identity);
      throw error;
    }
  }

  private async run(executable: string, args: string[]): Promise<string> {
    if (this.options.execute) return this.options.execute(executable, args);
    const script = /\.[cm]?js$/i.test(executable);
    const { stdout, stderr } = await execute(script ? process.execPath : executable,
      [...(script ? [executable] : []), ...args], { timeout: 15_000, maxBuffer: 8_000_000, windowsHide: true });
    // Pi writes --version to stderr even on a successful exit.
    return args.length === 1 && args[0] === "--version" ? `${stdout}\n${stderr}` : stdout;
  }

  private async collect(executable: string, query: HarnessPromptQuery, base: HarnessPromptResult): Promise<HarnessPromptResult> {
    return collectInstalledHarnessPrompt(query, base, args => this.run(executable, args), executable);
  }
}
