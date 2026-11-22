import type { AgentMcpServer } from "./types.js";
import type { SkillDescriptor } from "./skill-catalog.js";
import { skillContentSummary } from "./skill-catalog.js";
import type { ProjectSkillDefinitions } from "./project-skills.js";
import type { ProjectMcpDefinitions } from "./project-mcp.js";
import { publicFixedMcpDirectory } from "./mcp-directory.js";
import { harnessCatalogRegistry } from "./harness-runtime/registry.js";

export interface AgentToolCatalog {
  schemaVersion: 1;
  conditions: string[];
  harnesses: Array<{ id: string; skills: boolean; autoSkills: boolean; mcp: boolean }>;
  skills: Array<{
    reference: string;
    name: string;
    description: string;
    source: "builtin" | "external" | "project";
    selectionFields: readonly ["skills", "autoSkills"];
  }>;
  mcps: Array<{
    name: string;
    description: string;
    source: "fixed" | "project";
    selection: AgentMcpServer;
    conditions: string[];
  }>;
  experiments: {
    name: "scienceevolve-sii";
    description: string;
    selection: { experimentMcp: true };
    conditions: string[];
  };
}

/** Discovery supplies metadata for the Agent's own choice, never tool grants.
 * Do not serialize Skill host paths, MCP source/args/env, or runtime endpoints. */
export function buildAgentToolCatalog(
  skills: readonly SkillDescriptor[],
  skillDefinitions: ProjectSkillDefinitions = {},
  mcpDefinitions: ProjectMcpDefinitions = {}
): AgentToolCatalog {
  return {
    schemaVersion: 1,
    conditions: [
      "This directory is read-only planning metadata, not tools/list or an execution grant. Select only tools relevant to each Agent's instructions and all its Workflow roles.",
      "Use the existing authoring proposal and apply_workflow to configure Agents. Accepted project definitions are immutable; new names may be added.",
      "Harness capability metadata does not prove executable, model, Gateway, credentials or remote resource availability. Existing proposal/runtime validation remains authoritative."
    ],
    harnesses: harnessCatalogRegistry.list().filter(item => item.purposes.includes("workflow"))
      .map(({ id, capabilities }) => ({ id, skills: capabilities.skills, autoSkills: capabilities.autoSkills, mcp: capabilities.mcp })),
    skills: [
      ...skills.map(({ id, name, description, source }) => ({
        reference: id, name, description: description.slice(0, 480), source,
        selectionFields: ["skills", "autoSkills"] as const
      })),
      ...Object.entries(skillDefinitions).map(([name, definition]) => {
        const summary = skillContentSummary(definition.files["SKILL.md"] ?? "");
        return { reference: `project:${name}`, name: summary.name ?? name,
          description: summary.description.slice(0, 480), source: "project" as const,
          selectionFields: ["skills", "autoSkills"] as const };
      })
    ],
    mcps: [
      ...publicFixedMcpDirectory().map(({ name, description, url }) => ({
        name, description, source: "fixed" as const, selection: { name, url },
        conditions: ["Requires Harness MCP support and the existing fixed-service credential/remote availability checks. Use this exact public name and URL."]
      })),
      ...Object.entries(mcpDefinitions).map(([name, definition]) => ({
        name, source: "project" as const, selection: { name, project: name },
        description: definition.files["README.md"]
          ? skillContentSummary(definition.files["README.md"]).description.slice(0, 480)
          : "Project-owned stdio MCP. Its purpose is not declared in a README; inspect its accepted mcpDefinitions entry before choosing it.",
        conditions: ["Requires Harness MCP support. The existing invocation host resolves the accepted bundle and envFrom privately; discovering it does not start it."]
      }))
    ],
    experiments: {
      name: "scienceevolve-sii",
      description: "Submit and monitor asynchronous SII experiments, explicitly defer while results are pending, then receive results in the original task/session.",
      selection: { experimentMcp: true },
      conditions: [
        "Select experimentMcp, not a custom scienceevolve-sii MCP URL or project reference. Missing/false means no experiment tools.",
        "Available to every explicitly configured Agent with Harness MCP support and configured experiment service/CLI/account access, including Main and Leader.",
        "Local files follow the actual task/worktree authority. workspace Workers may use experiments without raising permissions to compute. Agents choose resources and handle actual results themselves."
      ]
    }
  };
}
