import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { createProjectSchema, mergeAgentConfigs, normalizeNewGitOrchestration, withoutLegacyAgentProxy } from "./core/validation.js";
import type { AgentConfig, NormalizedAgentOrchestrationTemplate, ProjectGitInput } from "./core/types.js";
import { validateProjectSkillReferences, type ProjectSkillDefinitions } from "./core/project-skills.js";
import { validateProjectMcpReferences, type ProjectMcpDefinitions } from "./core/project-mcp.js";
import type { MainProjectInput } from "./main-project-inputs.js";

export type MainWorkflowAgentConfig = Omit<AgentConfig,
  "gatewayId" | "gatewaySnapshot" | "nativeCodexProfileId" | "legacyReasoningEffort" | "reasoningMigrationWarning"> & {
  /** @deprecated Accepted for old workflow compatibility only; main no longer applies per-Agent proxy policies. */
  proxy?: { mode: "inherit" | "direct" };
};
export type MainProjectGitInput = Omit<ProjectGitInput, "accountId">;
/** Credential-free definition validated by the pinned main kernel, not the legacy SDK schema. */
export interface MainWorkflowConfig {
  agents: Record<string, MainWorkflowAgentConfig>;
  orchestration: NormalizedAgentOrchestrationTemplate;
  git: MainProjectGitInput;
  skillDefinitions?: ProjectSkillDefinitions;
  mcpDefinitions?: ProjectMcpDefinitions;
  /** Local reference materials; loading from a file resolves paths against that file. */
  inputs?: readonly MainProjectInput[];
  inputDescription?: string;
}
export interface MainWorkflowValidationOptions { baseDir?: string }
export function defaultMainWorkflowConfig(): MainWorkflowConfig {
  return validateMainWorkflowConfig({ git: { enabled: false } });
}

const envelope = z.object({
  agents: z.unknown().optional(), orchestration: z.unknown().optional(), git: z.unknown().optional(),
  skillDefinitions: z.unknown().optional(), mcpDefinitions: z.unknown().optional(),
  inputs: z.array(z.union([
    z.string().refine((value) => !!value.trim() && !value.includes("\0"), "Input path must be nonempty and contain no NUL"),
    z.object({
      path: z.string().refine((value) => !!value.trim() && !value.includes("\0"), "Input path must be nonempty and contain no NUL"),
      name: z.string().refine((value) => !!value && value.length <= 1024 && !value.includes("\\") &&
        value.split("/").every((part) => !!part && part !== "." && part !== ".." && part.length <= 255 &&
          !/[<>:"|?*\x00-\x1f\x7f]/.test(part) && !/[. ]$/.test(part) &&
          !/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\..*)?$/i.test(part)), "Input name must be a portable relative path").optional()
    }).strict()
  ])).max(1000).optional(),
  inputDescription: z.string().trim().max(2000).optional(),
  schemaVersion: z.literal(2).optional(), kind: z.literal("scienceevolve-agent-config-preset").optional(),
  id: z.string().optional(), name: z.string().optional(), builtin: z.boolean().optional(),
  sourceProjectId: z.string().optional(), sourceProjectTitle: z.string().optional(),
  createdAt: z.string().optional(), updatedAt: z.string().optional()
}).strict();

export function validateMainWorkflowConfig(input: unknown, options: MainWorkflowValidationOptions = {}): MainWorkflowConfig {
  const source = envelope.parse(input);
  if (source.git && typeof source.git === "object" && "accountId" in source.git) {
    throw new Error("Web accountId is not a headless SDK credential binding; inject git.credentialResolver when creating the SDK");
  }
  for (const [name, agent] of Object.entries((source.agents ?? {}) as Record<string, unknown>)) {
    if (agent && typeof agent === "object" && "harness" in agent && agent.harness === "hermes")
      throw new Error(`${name}: unsupported harness hermes; use codex, pi or dsh`);
    if (agent && typeof agent === "object" && Object.keys(agent).some((key) =>
      key !== "gatewayReasoningOption" && /gateway|apiKey|baseUrl|profile/i.test(key))) {
      throw new Error(`${name}: gateway/profile values do not belong in a main workflow; use start.gatewayBindings and SDK gateway configuration`);
    }
  }
  const parsed = createProjectSchema.parse({ title: "SDK validation", requirement: "SDK validation", ...{
    agents: source.agents && typeof source.agents === "object" && !Array.isArray(source.agents)
      ? Object.fromEntries(Object.entries(source.agents).map(([name, agent]) => [name,
        agent && typeof agent === "object" && !Array.isArray(agent) ? withoutLegacyAgentProxy(agent) : agent]))
      : source.agents,
    orchestration: source.orchestration, git: source.git,
    skillDefinitions: source.skillDefinitions, mcpDefinitions: source.mcpDefinitions
  } });
  if (parsed.orchestration.schemaVersion === 3 && !parsed.git.enabled) {
    throw new Error("v3 workflow requires git.enabled: true; it must not fall back to the legacy scheduler");
  }
  const orchestration = parsed.git.enabled
    ? normalizeNewGitOrchestration(parsed.orchestration) : parsed.orchestration;
  const agents = mergeAgentConfigs(parsed.agents, orchestration);
  validateProjectSkillReferences(agents, parsed.skillDefinitions ?? {});
  validateProjectMcpReferences(agents, parsed.mcpDefinitions ?? {});
  if (options.baseDir !== undefined && !path.isAbsolute(options.baseDir)) throw new Error("baseDir must be absolute");
  const inputs = source.inputs?.map((input) => {
    const location = typeof input === "string" ? input : input.path;
    if (!path.isAbsolute(location) && !options.baseDir) throw new Error("Relative input paths require an absolute baseDir");
    const absolute = path.resolve(options.baseDir ?? path.parse(location).root, location);
    return typeof input === "string" ? absolute : { ...input, path: absolute };
  });
  for (const [name, agent] of Object.entries(agents)) {
    for (const field of ["skills", "autoSkills"] as const) {
      agent[field] = agent[field].map((selection) => {
        if (!/^(?:\.\.?)[\\/]/.test(selection)) return selection;
        if (!options.baseDir) throw new Error(`${name}.${field}: relative Skill paths require an absolute baseDir`);
        return path.resolve(options.baseDir, selection);
      });
    }
  }
  return { agents, orchestration, git: parsed.git,
    ...(inputs === undefined ? {} : { inputs }),
    ...(source.inputDescription === undefined ? {} : { inputDescription: source.inputDescription }),
    ...(parsed.skillDefinitions === undefined ? {} : { skillDefinitions: parsed.skillDefinitions }),
    ...(parsed.mcpDefinitions === undefined ? {} : { mcpDefinitions: parsed.mcpDefinitions }) };
}

export async function loadMainWorkflowConfig(file: string, options: { presetId?: string } = {}): Promise<MainWorkflowConfig> {
  const absolute = path.resolve(file);
  const source: unknown = JSON.parse(await readFile(absolute, "utf8"));
  const validation = { baseDir: path.dirname(absolute) };
  if (source && typeof source === "object" && "presets" in source) {
    const library = z.object({ schemaVersion: z.literal(2), presets: z.array(envelope) }).strict().parse(source);
    const selected = options.presetId ? library.presets.find((preset) => preset.id === options.presetId)
      : library.presets.length === 1 ? library.presets[0] : undefined;
    if (!selected) throw new Error("Select an existing presetId; without it the library must contain exactly one preset");
    return validateMainWorkflowConfig(selected, validation);
  }
  if (options.presetId) throw new Error("presetId is only valid for a preset library");
  return validateMainWorkflowConfig(source, validation);
}

export function bindMainWorkflowConfig(config: MainWorkflowConfig, binding: Pick<MainWorkflowAgentConfig, "harness" | "model">): MainWorkflowConfig {
  return validateMainWorkflowConfig({ ...config, agents: Object.fromEntries(
    Object.entries(config.agents).map(([name, agent]) => [name, { ...agent, ...binding }])
  ) });
}
