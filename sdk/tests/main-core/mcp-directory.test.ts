import { afterEach, describe, expect, it } from "vitest";
import {
  FIXED_MCP_BASE_URL,
  FIXED_MCP_DIRECTORY,
  FIXED_MCP_TOKEN_ENV_VAR,
  assertMcpServerIdentity,
  fixedMcpToken,
  isFixedMcpServer,
  normalizeMcpServerSelection,
  publicFixedMcpDirectory
} from "../../src/core/mcp-directory.js";
import { createProjectSchema } from "../../src/core/validation.js";

const originalToken = process.env[FIXED_MCP_TOKEN_ENV_VAR];

afterEach(() => {
  if (originalToken === undefined) delete process.env[FIXED_MCP_TOKEN_ENV_VAR];
  else process.env[FIXED_MCP_TOKEN_ENV_VAR] = originalToken;
});

describe("fixed MCP directory", () => {
  it("preserves explicit experiment choices and rejects forged built-in connections", () => {
    for (const experimentMcp of [true, false]) {
      const project = createProjectSchema.parse({ title: "Selected experiment", requirement: "Choose tools independently",
        agents: { execution: { experimentMcp, permission: "workspace" } } });
      expect(project.agents.execution).toMatchObject({ experimentMcp, permission: "workspace" });
    }
    const old = createProjectSchema.parse({ title: "Old config", requirement: "No implicit authorization",
      agents: { execution: { permission: "compute" } } });
    expect(old.agents.execution).not.toHaveProperty("experimentMcp");
    for (const server of [{ name: "scienceevolve-sii", url: "http://127.0.0.1:12345/sii/old" },
      { name: "ScienceEvolve-SII", project: "spoof" }]) {
      expect(() => createProjectSchema.parse({ title: "Forged binding", requirement: "Reject fake bindings",
        agents: { execution: { mcpServers: [server] } } })).toThrow("experimentMcp");
    }
  });
  it("reserves the automatically injected sleep MCP name", () => {
    for (const name of ["scienceevolve-sleep", "ScienceEvolve-SLEEP"]) {
      expect(() => normalizeMcpServerSelection([{ name, url: "https://example.test/mcp" }])).toThrow("内置 MCP");
      expect(() => normalizeMcpServerSelection([{ name, project: "sleep" }])).toThrow("内置 MCP");
    }
  });
  it("publishes exactly the nineteen fixed name and URL identities without credentials", () => {
    const directory = publicFixedMcpDirectory();
    expect(directory).toHaveLength(19);
    expect(directory.map((entry) => entry.name)).toEqual([
      "abaqus_tools",
      "ai4fusion-mcp",
      "ai4polymat-epoxy",
      "aistudio-auth",
      "bio-tools",
      "biorxiv",
      "bohrium-auth",
      "chembl",
      "citation-check",
      "clinical-trials",
      "idea-agent",
      "inkstone-auth",
      "ketcher-chemistry",
      "particle_tools",
      "pubmed",
      "pymol",
      "reading_agent",
      "reading_agent_v2",
      "sciencepro-auth"
    ]);
    for (const entry of directory) {
      expect(entry.url).toBe(`${FIXED_MCP_BASE_URL}/${entry.name}`);
      expect(Object.keys(entry).sort()).toEqual(["description", "name", "url"]);
    }
    expect(JSON.stringify(directory)).not.toContain(FIXED_MCP_TOKEN_ENV_VAR);
    expect(directory).not.toBe(FIXED_MCP_DIRECTORY);
  });

  it("accepts exact fixed identities and rejects spoofed same-name URLs", () => {
    const fixed = FIXED_MCP_DIRECTORY[0]!;
    const selectedFixed = { name: fixed.name, url: fixed.url };
    expect(isFixedMcpServer(fixed)).toBe(true);
    expect(() => assertMcpServerIdentity(fixed)).not.toThrow();
    expect(() => assertMcpServerIdentity({
      name: fixed.name,
      url: "https://attacker.example/mcp"
    })).toThrow("名称和 URL 必须与固定目录完全匹配");
    expect(() => assertMcpServerIdentity({
      name: fixed.name.toUpperCase(),
      url: fixed.url
    })).toThrow("名称和 URL 必须与固定目录完全匹配");
    expect(normalizeMcpServerSelection([
      selectedFixed,
      { name: "custom", url: "https://custom.example/mcp" }
    ])).toEqual([selectedFixed, { name: "custom", url: "https://custom.example/mcp" }]);
  });

  it("enforces fixed identities through project validation and keeps the token server-only", () => {
    const fixed = FIXED_MCP_DIRECTORY[1]!;
    const selectedFixed = { name: fixed.name, url: fixed.url };
    const project = createProjectSchema.parse({
      title: "Fixed MCP",
      requirement: "Use a fixed MCP through one Agent.",
      agents: { idea: { mcpServers: [selectedFixed] } }
    });
    expect(project.agents.idea.mcpServers).toContainEqual(selectedFixed);
    expect(() => createProjectSchema.parse({
      title: "Spoofed MCP",
      requirement: "Reject a forged fixed MCP URL.",
      agents: {
        idea: {
          mcpServers: [{ name: fixed.name, url: "https://attacker.example/mcp" }]
        }
      }
    })).toThrow("名称和 URL 必须与固定目录完全匹配");

    process.env[FIXED_MCP_TOKEN_ENV_VAR] = "test-token-never-serialized";
    expect(fixedMcpToken()).toBe("test-token-never-serialized");
    expect(JSON.stringify(project)).not.toContain("test-token-never-serialized");
    expect(JSON.stringify(publicFixedMcpDirectory())).not.toContain("test-token-never-serialized");
  });
});
