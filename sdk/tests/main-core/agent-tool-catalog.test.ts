import { afterEach, describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildAgentToolCatalog } from "../../src/core/agent-tool-catalog.js";
import { compileInvocationPolicy, compileWorkflowPrompt } from "../../src/core/harness-runtime/invocation-policy.js";
import type { AgentRunRequest } from "../../src/core/types.js";
import { prepareWorkflowContext } from "../../src/core/workflow-context.js";

const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map(root => fs.rm(root, { recursive: true, force: true }))); });

describe("Agent resource discovery", () => {
  it("provides legal global/project references without host paths, source, arguments or environment", () => {
    const catalog = buildAgentToolCatalog([
      { id: "builtin:measure", name: "Measurement", description: "Measure fixed inputs", source: "builtin", path: "/private/service/skills/measure/SKILL.md" }
    ], { check: { files: { "SKILL.md": "---\nname: check\ndescription: Verify fixed results\n---\nprivate-skill-body" } } }, {
      verify: { entrypoint: "server.js", files: { "server.js": "private-server-body", "README.md": "# Verify mathematical results\nprivate-mcp-body" },
        args: ["private-argument"], envFrom: { TOKEN: "PRIVATE_HOST_TOKEN" } }
    });
    expect(catalog.skills).toEqual(expect.arrayContaining([
      expect.objectContaining({ reference: "builtin:measure", description: "Measure fixed inputs" }),
      expect.objectContaining({ reference: "project:check", description: "Verify fixed results" })
    ]));
    expect(catalog.mcps).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: "fixed", selection: { name: "citation-check", url: "https://118.196.152.186/mcp/citation-check" } }),
      expect.objectContaining({ source: "project", description: "Verify mathematical results", selection: { name: "verify", project: "verify" } })
    ]));
    const serialized = JSON.stringify(catalog);
    for (const privateValue of ["/private/service", "private-skill-body", "private-server-body", "private-mcp-body", "private-argument", "PRIVATE_HOST_TOKEN"]) {
      expect(serialized).not.toContain(privateValue);
    }
    expect(catalog.experiments.selection).toEqual({ experimentMcp: true });
    expect(catalog.experiments.conditions.join(" ")).toContain("workspace Workers");
    expect(catalog.harnesses.find(item => item.id === "codex")).toMatchObject({ skills: true, mcp: true });
  });

  it("does not invent a purpose for project services without metadata", () => {
    const catalog = buildAgentToolCatalog([], {}, { undocumented: { entrypoint: "server.js", files: { "server.js": "secret source" } } });
    expect(catalog.mcps.find(item => item.name === "undocumented")?.description).toContain("purpose is not declared");
    expect(JSON.stringify(catalog)).not.toContain("secret source");
  });

  it("gives an authorized Main complete readable metadata while leaving its actual tool policy unchanged", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-tool-catalog-"));
    roots.push(root);
    const catalog = buildAgentToolCatalog([]);
    const config = { instructions: "Configure the next Agent", skills: [], autoSkills: [], mcpServers: [], webSearch: false };
    const request = { agent: "main", kind: "main", permission: "workspace", skillPaths: [], autoSkillPaths: [],
      toolCatalog: catalog, project: { agents: { main: config }, orchestration: { allowMainReconfiguration: true } },
      control: { stagingPath: "/runtime/actions.json", capability: "server-only", stateVersion: 1,
        candidates: [], decisionBy: "main", allowUserIntervention: false, canComplete: false,
        allowWorkflowReconfiguration: true, requireBridge: true } } as unknown as AgentRunRequest;
    const inboxPath = path.join(root, "Inbox.md");
    await fs.writeFile(inboxPath, "Current Main assignment\n");
    const inputs = { projectPath: root, workspacePath: root, inboxPath, memoryPath: path.join(root, "Memory.md"), runtimePath: root, inboxSha256: "fixture" };
    const policy = compileInvocationPolicy(config as AgentRunRequest["project"]["agents"][string], request);
    const prepared = await prepareWorkflowContext(request, inputs);
    const prompt = compileWorkflowPrompt(request, prepared, policy);
    const directoryHint = "Available Agent Skill/MCP directory: use the agent-tool-catalog sources in the on-demand context index.";
    expect(prompt).not.toContain(directoryHint);
    expect(prompt).toContain(`项目入口：${root}`);
    expect(prompt).not.toContain(`Context index: ${prepared.contextIndex!.indexPath}`);
    expect(prompt).not.toContain(JSON.stringify(catalog));
    const directory = JSON.parse(await fs.readFile(prepared.contextIndex!.indexPath, "utf8"));
    const records = async (key: string) => {
      const source = directory.entries.find((entry: { key: string }) => entry.key === `agent-tool-catalog.${key}`);
      expect(source, key).toBeDefined();
      const list = JSON.parse(await fs.readFile(path.join(directory.baseDirectory, source.list.path), "utf8"));
      return Promise.all(list.entries.map(async (entry: { detail: { path: string } }) =>
        JSON.parse(await fs.readFile(path.join(list.baseDirectory, entry.detail.path), "utf8"))));
    };
    for (const key of ["skills", "mcps", "harnesses"] as const) expect(await records(key)).toEqual(catalog[key]);
    expect(await records("experiments")).toEqual([catalog.experiments]);
    expect(policy.mcpServers).toEqual([]);
    expect(policy.skillPaths).toEqual([]);
    for (const patch of [{ agent: "worker", kind: "worker" }, { purpose: "explainer" },
      { control: { ...request.control, allowWorkflowReconfiguration: false } }, { terminalPushObservation: { operationId: "original" } },
      { project: { ...request.project, orchestration: { allowMainReconfiguration: false } } }]) {
      const other = { ...request, ...patch } as AgentRunRequest;
      other.project = { ...other.project, agents: { main: config, worker: config } } as AgentRunRequest["project"];
      expect(compileWorkflowPrompt(other, inputs, policy)).not.toContain(directoryHint);
    }
  });
});
