import { describe, it, expect } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { validateMainWorkflowConfig, bindMainWorkflowConfig, loadMainWorkflowConfig } from "../src/main-config.js";
import { cloneAgentOrchestrationTemplate } from "../src/core/agent-orchestration.js";

function grouped() {
  const orchestration = cloneAgentOrchestrationTemplate();
  orchestration.schemaVersion = 2;
  orchestration.collaborations = [{ id: "G", displayName: "G", memberAgentIds: ["idea", "execution"], renamePolicy: "editable" }];
  orchestration.input.target = "G";
  orchestration.routes = { main: [], G: [{ kind: "strong", target: "writing" }],
    writing: [{ kind: "strong", target: "review" }], review: [{ kind: "weak", target: "finish" }] };
  orchestration.decisionPlans = {};
  return { agents: {}, orchestration, git: { enabled: true } };
}

describe("main workflow config uses main's actual contracts", () => {
  it("round-trips Gate configuration and rejects a code Gate without an actual predecessor", () => {
    const orchestration = cloneAgentOrchestrationTemplate();
    orchestration.gates = [{ id: "quality", name: "Quality", verifier: { kind: "agent", agentId: "review", instructions: "Inspect actual evidence" } }];
    orchestration.input.target = "quality";
    orchestration.routes.quality = [{ kind: "strong", target: "idea" }];
    const config = validateMainWorkflowConfig({ orchestration });
    expect(bindMainWorkflowConfig(config, { harness: "pi", model: "fixture" }).orchestration.gates).toEqual(orchestration.gates);
    expect(validateMainWorkflowConfig(JSON.parse(JSON.stringify(config))).orchestration.gates).toEqual(orchestration.gates);
    orchestration.gates[0].verifier = { kind: "code", interpreter: "node", code: "console.log(1)", output: "json" };
    expect(() => validateMainWorkflowConfig({ orchestration })).toThrow("actual predecessor");
  });
  it("round-trips the optional search tree through shared validation and binding", () => {
    const searchTree = { root: { name: "Root" }, directions: [{ id: "quality", kind: "direction", name: "Quality", parentId: "root" }] };
    const config = validateMainWorkflowConfig({ searchTree });
    expect(bindMainWorkflowConfig(config, { harness: "pi", model: "fixture" }).searchTree).toEqual(searchTree);
    expect(validateMainWorkflowConfig(JSON.parse(JSON.stringify(config))).searchTree).toEqual(searchTree);
    expect(() => validateMainWorkflowConfig({ searchTree: { ...searchTree, directions: [{ ...searchTree.directions[0], parentId: "quality" }] } })).toThrow("cycle");
    expect(validateMainWorkflowConfig({})).not.toHaveProperty("searchTree");
  });
  it("preserves explicit SII selection without inferring tools from Skills or compute permission", () => {
    const config = validateMainWorkflowConfig({ agents: {
      main: { experimentMcp: true },
      idea: { experimentMcp: false, skills: ["builtin:inspire"], permission: "compute" },
      execution: { skills: ["builtin:inspire"], permission: "compute" }
    } });
    expect(config.agents.main.experimentMcp).toBe(true);
    expect(config.agents.idea.experimentMcp).toBe(false);
    expect(config.agents.execution.experimentMcp).toBeUndefined();
    const bound = bindMainWorkflowConfig(config, { harness: "pi", model: "fixture" });
    expect(bound.agents.main.experimentMcp).toBe(true);
    expect(bound.agents.idea.experimentMcp).toBe(false);
    expect(bound.agents.execution.experimentMcp).toBeUndefined();
    expect(() => validateMainWorkflowConfig({ agents: { main: { experimentMcp: "true" } } })).toThrow();
  });
  it("loads historical proxy fields without restoring a removed runtime policy", async () => {
    const file = fileURLToPath(new URL("../examples/workflow-reconfiguration/workflow.json", import.meta.url));
    const original = JSON.parse(await fs.readFile(file, "utf8"));
    expect(original.agents.main.proxy).toEqual({ mode: "inherit" });
    const config = await loadMainWorkflowConfig(file);
    expect(config.agents.main).not.toHaveProperty("proxy");
    expect(bindMainWorkflowConfig(config, { harness: "pi", model: "fixture" }).agents.main).not.toHaveProperty("proxy");
    expect(JSON.parse(await fs.readFile(file, "utf8"))).toEqual(original);
  });
  it("loads every existing main example unchanged without requiring optional input fields", async () => {
    const repository = fileURLToPath(new URL("../../", import.meta.url));
    // Discover published workflow examples only, not JSON research datasets or
    // vendored upstream Skill fixtures. Legacy exports have a separate parser.
    async function workflows(directory: string): Promise<string[]> {
      const files: string[] = [];
      for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
        const location = path.join(directory, entry.name);
        if (entry.isFile() && /^(?:default-)?workflow\.json$/.test(entry.name)) files.push(location);
        if (entry.isDirectory()) {
          const candidate = path.join(location, "workflow.json");
          try { if ((await fs.stat(candidate)).isFile()) files.push(candidate); }
          catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
        }
      }
      return files.sort();
    }
    const rootExamples = await workflows(path.join(repository, "example"));
    const sdkExamples = await workflows(path.join(repository, "sdk", "examples"));
    const skillTemplate = path.join(repository, "sdk", "skills", "scienceevolve-sdk", "assets", "workflow.json");
    expect(rootExamples.length).toBeGreaterThanOrEqual(16);
    expect(sdkExamples.length).toBeGreaterThanOrEqual(5);
    for (const file of [...rootExamples, ...sdkExamples, skillTemplate]) {
      const bytes = await fs.readFile(file);
      const original = JSON.parse(bytes.toString("utf8"));
      expect(original, file).not.toHaveProperty("inputs");
      expect(original, file).not.toHaveProperty("inputDescription");
      const loaded = await loadMainWorkflowConfig(file);
      expect(loaded, file).toEqual(validateMainWorkflowConfig(original, { baseDir: path.dirname(file) }));
      expect(validateMainWorkflowConfig(loaded), file).toEqual(loaded);
      expect(loaded, file).not.toHaveProperty("inputs");
      expect(loaded, file).not.toHaveProperty("inputDescription");
      expect(await fs.readFile(file), file).toEqual(bytes);
    }
  });
  it("validates local input metadata without reading sources and preserves it when binding models", () => {
    const baseDir = path.resolve(os.tmpdir(), "nonexistent-input-validation-fixture");
    const input = { inputs: ["./missing", { path: "images/image.png", name: "figures/reference.png" }], inputDescription: "  Reference material  " };
    expect(() => validateMainWorkflowConfig(input)).toThrow(/absolute baseDir/);
    const config = validateMainWorkflowConfig(input, { baseDir });
    expect(config.inputs).toEqual([path.join(baseDir, "missing"), { path: path.join(baseDir, "images", "image.png"), name: "figures/reference.png" }]);
    expect(config.inputDescription).toBe("Reference material");
    const bound = bindMainWorkflowConfig(config, { harness: "pi", model: "fixture" });
    expect(bound.inputs).toEqual(config.inputs); expect(bound.inputDescription).toBe(config.inputDescription);
    expect(validateMainWorkflowConfig({ inputs: [], inputDescription: " " })).toMatchObject({ inputs: [], inputDescription: "" });
    expect(validateMainWorkflowConfig({})).not.toHaveProperty("inputs");
  });
  it("rejects invalid input structure, names and descriptions offline", () => {
    const baseDir = path.resolve(os.tmpdir());
    for (const inputs of [null, "file", [" "], ["a\0b"], [{ path: "a", unexpected: true }], [{ path: 1 }],
      ...["../escape", "/absolute", "back\\slash", "CON.txt", "a/", "x".repeat(256)].map((name) => [{ path: "a", name }])]) {
      expect(() => validateMainWorkflowConfig({ inputs }, { baseDir })).toThrow();
    }
    expect(() => validateMainWorkflowConfig({ inputDescription: "x".repeat(2001) })).toThrow();
    expect(() => validateMainWorkflowConfig({ inputDescription: 1 })).toThrow();
    expect(() => validateMainWorkflowConfig({ inputs: ["file"] }, { baseDir: "relative" })).toThrow(/absolute/);
  });
  it("loads workflow input sources relative to the workflow file, including presets", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-main-input-config-"));
    try {
      const file = path.join(root, "workflow.json");
      const input = { inputs: ["./materials", { path: "../diagram.png", name: "reference.png" }], inputDescription: "  Local inputs  " };
      for (const source of [input, { schemaVersion: 2, presets: [{ id: "inputs", ...input }] }]) {
        await fs.writeFile(file, JSON.stringify(source));
        expect(await loadMainWorkflowConfig(file)).toMatchObject({
          inputs: [path.join(root, "materials"), { path: path.resolve(root, "../diagram.png"), name: "reference.png" }], inputDescription: "Local inputs"
        });
      }
    } finally { await fs.rm(root, { recursive: true, force: true }); }
  });
  it("normalizes Git v2 to v3 identically and round-trips portable configuration", () => {
    const config = validateMainWorkflowConfig(grouped());
    expect(config.orchestration.schemaVersion).toBe(3);
    expect(config.orchestration.scopedWorkflow?.groups[0].workflow.input.edges).toHaveLength(2);
    expect(config.orchestration.collaborations[0].memberAgentIds).toEqual([]);
    expect(validateMainWorkflowConfig(JSON.parse(JSON.stringify(config)))).toEqual(config);
    const bound = bindMainWorkflowConfig(config, { harness: "pi", model: "fixture-model" });
    expect(Object.values(bound.agents).every((agent) => agent.harness === "pi")).toBe(true);
    expect(bound.orchestration).toEqual(config.orchestration);
  });
  it("refuses Git-off groups and v3 even if there are no groups", () => {
    expect(() => validateMainWorkflowConfig({ ...grouped(), git: { enabled: false } })).toThrow(/协作组要求启用 Git 机制/);
    const config = validateMainWorkflowConfig({ git: { enabled: true } });
    expect(() => validateMainWorkflowConfig({ ...config, git: { enabled: false } })).toThrow(/v3 workflow/);
  });
  it.each(["gatewayId", "gatewaySnapshot", "gatewaySource", "apiKey", "baseUrl"])("rejects embedded deployment field %s", (key) => {
    expect(() => validateMainWorkflowConfig({ agents: { main: { [key]: "must-not-use" } } })).toThrow(/do not belong/);
  });
  it("rejects Web account binding, runtime state and SDK-only fields without silently dropping them", () => {
    expect(() => validateMainWorkflowConfig({ git: { enabled: true, accountId: "gha_" + "1".repeat(32) } })).toThrow(/accountId/);
    expect(() => validateMainWorkflowConfig({ runtime: {} })).toThrow();
    expect(() => validateMainWorkflowConfig({ agents: { main: { sdkOnlyOption: true } } })).toThrow();
    expect(() => validateMainWorkflowConfig({ agents: { not_configured: {} } })).toThrow(/unknown Agent/);
  });
  it("preserves prompts, Skills/MCP definitions, and requires an explicit base for relative Skill references", () => {
    const input = { agents: { idea: { instructions: "Custom exact prompt", skills: ["./local-skill"], autoSkills: [] } } };
    expect(() => validateMainWorkflowConfig(input)).toThrow(/absolute baseDir/);
    const baseDir = path.resolve(os.tmpdir());
    const config = validateMainWorkflowConfig(input, { baseDir });
    expect(config.agents.idea.instructions).toBe("Custom exact prompt");
    expect(config.agents.idea.skills).toEqual([path.join(baseDir, "local-skill")]);
    expect(() => validateMainWorkflowConfig(input, { baseDir: "relative" })).toThrow(/absolute/);
  });
  it("loads preset libraries explicitly and resolves relative paths against the file", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-main-config-"));
    try {
      const file = path.join(root, "workflow.json");
      await fs.writeFile(file, JSON.stringify({ schemaVersion: 2, presets: [
        { id: "one", ...grouped() }, { id: "two", agents: { main: { skills: ["./skill"] } } }
      ] }));
      await expect(loadMainWorkflowConfig(file)).rejects.toThrow(/presetId/);
      expect((await loadMainWorkflowConfig(file, { presetId: "one" })).orchestration.schemaVersion).toBe(3);
      expect((await loadMainWorkflowConfig(file, { presetId: "two" })).agents.main.skills).toEqual([path.join(root, "skill")]);
      await expect(loadMainWorkflowConfig(file, { presetId: "missing" })).rejects.toThrow(/presetId/);
    } finally { await fs.rm(root, { recursive: true, force: true }); }
  });
});
