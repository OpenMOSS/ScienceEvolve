import { createHash } from "node:crypto";
import { readFile, realpath } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { selectCodexGatewayModelTemplate } from "../../codex-gateway-model-catalog.js";
import type { HarnessPromptQuery, HarnessPromptResult } from "../prompt-catalog.js";

/** Source inspection is Adapter-owned and must never call a business model. */
export async function collectInstalledHarnessPrompt(query: HarnessPromptQuery, base: HarnessPromptResult,
  run: (args: string[]) => Promise<string>, executable?: string): Promise<HarnessPromptResult> {
  const installedVersion = base.installedVersion;
  if (executable && (query.harness === "dsh" || query.harness === "pi")) {
    try {
      const entry = await realpath(executable);
      const requireInstalled = createRequire(pathToFileURL(entry));
      let text: string;
      let source: string;
      let scopeNote: string;
      if (query.harness === "dsh") {
        // Load only the installed registry and SDK persona, without booting the
        // application, evaluating YAML JavaScript, or opening an Agent Session.
        const yaml = requireInstalled("js-yaml");
        const schema = yaml.JSON_SCHEMA.extend(new yaml.Type("tag:yaml.org,2002:js", {
          kind: "scalar", construct: (value: string) => value
        }));
        const rows = yaml.load(await readFile(requireInstalled.resolve("@deepseek-ai/dsh-sdk-app/cordis.patch.yml"), "utf8"), { schema });
        const config = rows.find((row: { id?: string }) => row.id === "system-prompt")?.config;
        if (typeof config?.persona !== "string") throw new Error("Missing SDK persona");
        const { Context } = await import(pathToFileURL(requireInstalled.resolve("@deepseek-ai/cordis")).href);
        const { SystemPrompt, renderPrompt } = await import(pathToFileURL(requireInstalled.resolve("@deepseek-ai/dsh-system-prompt")).href);
        const context = new Context();
        new SystemPrompt(context, config);
        context.systemPrompt.variable("model", () => query.model);
        context.systemPrompt.variable("cwd", () => "{{cwd}}");
        text = renderPrompt(await context.systemPrompt.assemble());
        source = "安装版 dsh-system-prompt · SDK profile persona";
        scopeNote = "SDK 固定身份与 persona；{{cwd}} 在运行时替换。工具指导、Skills 和会话上下文另行追加。";
      } else {
        // Pi ships a model-independent builder. Explicit empty context/skills
        // prevent local workspace files from entering this public preview.
        const modulePath = path.join(path.dirname(entry), "core", "system-prompt.js");
        const { buildSystemPrompt } = await import(pathToFileURL(modulePath).href);
        text = buildSystemPrompt({ cwd: "{{cwd}}", selectedTools: [], contextFiles: [], skills: [] });
        source = "安装版 pi · core/system-prompt.js · buildSystemPrompt";
        scopeNote = "模型通用基础模板；{{cwd}} 在运行时替换。当前预览未加载工具、Skills 或项目文件。";
      }
      if (!text?.trim()) throw new Error("Empty installed prompt");
      return { ...base, installedVersion, status: "available", sourceType: "installed-default",
        resolvedModel: query.model, source, scopeNote, text,
        sha256: createHash("sha256").update(text).digest("hex") };
    } catch {
      return { ...base, reason: "当前安装版原生提示词读取失败，请刷新重试或检查 Harness 安装完整性。" };
    }
  }
  if (query.harness !== "codex") return { ...base, installedVersion,
    reason: "已识别安装版本，但尚未成功采集此版本在所选模型和工具配置下的组装原文。" };
  try {
    const catalog: unknown = JSON.parse(await run(["debug", "models", "--bundled"]));
    const models = catalog && typeof catalog === "object" && "models" in catalog ? catalog.models : undefined;
    if (!Array.isArray(models)) throw new Error("Invalid bundled model catalog");
    const model = selectCodexGatewayModelTemplate(models, query.model);
    if (typeof model.base_instructions !== "string" || !model.base_instructions.trim()) {
      return { ...base, installedVersion, resolvedModel: model.slug,
        reason: `当前安装版模型目录缺少 ${model.slug} 模板的基础提示词文本，请检查 Harness 安装。` };
    }
    const scopeNote = model.slug === query.model
      ? "所选模型在当前安装版中的基础 Prompt；工具、Skills、平台规则和会话上下文在运行时另行组装。"
      : `ScienceEvolve 网关运行使用安装版 ${model.slug} 的基础 Prompt 模板，请求模型仍为 ${query.model}。工具、Skills、平台规则和会话上下文在运行时另行组装。`;
    return { ...base, installedVersion, resolvedModel: model.slug, status: "available", sourceType: "bundled-default",
      source: "codex debug models --bundled · base_instructions", scopeNote, text: model.base_instructions,
      sha256: createHash("sha256").update(model.base_instructions).digest("hex") };
  } catch {
    return { ...base, installedVersion, reason: "无法读取当前网关运行配置使用的安装版 Prompt 模板，请刷新重试或检查 Harness 安装。" };
  }
}
