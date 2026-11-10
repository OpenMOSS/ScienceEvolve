import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/** Gateway launches and prompt inspection select the same installed metadata. */
export function selectCodexGatewayModelTemplate(
  models: readonly unknown[],
  model: string
): Record<string, unknown> & { slug: string } {
  const known = models.find((entry) => entry && typeof entry === "object" && "slug" in entry && entry.slug === model);
  const template = known ?? models.find((entry) => entry && typeof entry === "object" &&
    "use_responses_lite" in entry && entry.use_responses_lite === false &&
    (!("tool_mode" in entry) || entry.tool_mode == null));
  if (!template || typeof template !== "object") throw new Error("Installed Codex has no ordinary Responses tool-loop template");
  if (!("slug" in template) || typeof template.slug !== "string" || !template.slug.trim()) {
    throw new Error("Installed Codex model template is missing its slug");
  }
  return template as Record<string, unknown> & { slug: string };
}

/**
 * Prepare ordinary Responses tools for ScienceEvolve gateway invocations
 * while preserving the requested model and its installed metadata.
 */
export async function prepareCodexGatewayModelCatalog(
  executable: string,
  model: string,
  runtimePath: string
): Promise<string | undefined> {
  const script = /\.(?:[cm]?js)$/i.test(executable);
  const command = script ? process.execPath : executable;
  const args = [...(script ? [executable] : []), "debug", "models", "--bundled"];
  let stdout: string;
  try {
    ({ stdout } = await execFileAsync(command, args, {
      timeout: 15_000,
      maxBuffer: 4_000_000,
      windowsHide: true
    }));
  } catch {
    throw new Error("Unable to inspect the installed Codex model catalog");
  }
  let catalog: unknown;
  try { catalog = JSON.parse(stdout); }
  catch { throw new Error("Installed Codex returned an invalid model catalog"); }
  const models = catalog && typeof catalog === "object" && "models" in catalog
    ? (catalog as { models: unknown }).models : undefined;
  if (!Array.isArray(models)) throw new Error("Installed Codex returned an invalid model catalog");
  const template = selectCodexGatewayModelTemplate(models, model);
  const known = template.slug === model ? template : undefined;
  if (known && known.use_responses_lite !== true && known.tool_mode !== "code_mode_only") return undefined;
  const selected = known ?? { ...template, slug: model, display_name: model,
    supported_reasoning_levels: [], default_reasoning_level: null,
    supports_reasoning_summary_parameter: false, input_modalities: ["text"] };
  const outputPath = path.join(runtimePath, "codex-gateway-model-catalog.json");
  await fs.writeFile(outputPath, JSON.stringify({ models: [{
    ...selected,
    use_responses_lite: false,
    tool_mode: null
  }] }), { encoding: "utf8", mode: 0o600 });
  return outputPath;
}
