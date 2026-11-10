import type { AgentMcpServer } from "./types.js";

/**
 * System MCP servers exposed through the shared directory. The directory is a
 * data-only module: credentials are resolved from the server process
 * environment and are never part of this response or a browser bundle.
 */
export interface FixedMcpDefinition {
  name: string;
  description: string;
  url: string;
}

export const FIXED_MCP_BASE_URL = "https://118.196.152.186/mcp" as const;
export const FIXED_MCP_TOKEN_ENV_VAR = "SCIENCEEVOLVE_FIXED_MCP_TOKEN" as const;

export const FIXED_MCP_DIRECTORY: readonly FixedMcpDefinition[] = Object.freeze([
  { name: "abaqus_tools", description: "Abaqus 2022 Standard: typed axial-bar analysis, queued jobs, cancellation and real ODB results; two concurrent solvers.", url: `${FIXED_MCP_BASE_URL}/abaqus_tools` },
  { name: "ai4fusion-mcp", description: "核聚变物理的数据库 MCP", url: `${FIXED_MCP_BASE_URL}/ai4fusion-mcp` },
  { name: "ai4polymat-epoxy", description: "环氧树脂预测 MCP", url: `${FIXED_MCP_BASE_URL}/ai4polymat-epoxy` },
  { name: "aistudio-auth", description: "星河启智用户登录与科研工具", url: `${FIXED_MCP_BASE_URL}/aistudio-auth` },
  { name: "bio-tools", description: "Bio-tools: 23 biological data domains in one MCP, with 233 enabled retrieval tools.", url: `${FIXED_MCP_BASE_URL}/bio-tools` },
  { name: "biorxiv", description: "Search and retrieve bioRxiv and medRxiv preprints.", url: `${FIXED_MCP_BASE_URL}/biorxiv` },
  { name: "bohrium-auth", description: "Bohrium 用户登录与科研工具", url: `${FIXED_MCP_BASE_URL}/bohrium-auth` },
  { name: "chembl", description: "Search ChEMBL compounds, targets, bioactivity, mechanisms, and drug data.", url: `${FIXED_MCP_BASE_URL}/chembl` },
  { name: "citation-check", description: "Verify citations, literature sources, and consistency between claims and references.", url: `${FIXED_MCP_BASE_URL}/citation-check` },
  { name: "clinical-trials", description: "Search ClinicalTrials.gov clinical trial data.", url: `${FIXED_MCP_BASE_URL}/clinical-trials` },
  { name: "idea-agent", description: "Evaluate the novelty, feasibility, and research value of scientific ideas.", url: `${FIXED_MCP_BASE_URL}/idea-agent` },
  { name: "inkstone-auth", description: "书生端砚用户登录与科研工具", url: `${FIXED_MCP_BASE_URL}/inkstone-auth` },
  { name: "ketcher-chemistry", description: "Ketcher Chemistry: interactive molecule sketcher with MCP Apps HTML resources.", url: `${FIXED_MCP_BASE_URL}/ketcher-chemistry` },
  { name: "particle_tools", description: "Particle Tools — DarkSHINE, Higgs/CEPC simulation, ROOT analysis and scientific evidence retrieval", url: `${FIXED_MCP_BASE_URL}/particle_tools` },
  { name: "pubmed", description: "Search PubMed and PubMed Central biomedical literature.", url: `${FIXED_MCP_BASE_URL}/pubmed` },
  { name: "pymol", description: "PyMOL 分子结构分析与可视化 MCP，提供结构分析、相互作用检测、结构对齐、突变及渲染，支持多会话文件上传，共 17 个工具。", url: `${FIXED_MCP_BASE_URL}/pymol` },
  { name: "reading_agent", description: "Run long-form literature reading and asynchronous research analysis tasks.", url: `${FIXED_MCP_BASE_URL}/reading_agent` },
  { name: "reading_agent_v2", description: "Reading MCP v2", url: `${FIXED_MCP_BASE_URL}/reading_agent_v2` },
  { name: "sciencepro-auth", description: "磐石 SciencePro：深度研究、创新评价、ScienceHub 数据集/模型/工具/Skill/MCP、知识库、Projects 和科研资讯。", url: `${FIXED_MCP_BASE_URL}/sciencepro-auth` }
]);

const byName = new Map(FIXED_MCP_DIRECTORY.map((entry) => [entry.name.toLowerCase(), entry]));

export function fixedMcpDefinition(name: string): FixedMcpDefinition | undefined {
  return byName.get(name.trim().toLowerCase());
}

/** Exact name and URL matching is required before the server token is used. */
export function isFixedMcpServer(server: Pick<AgentMcpServer, "name"> & Partial<Pick<AgentMcpServer, "url">>): boolean {
  if (!server.url) return false;
  const definition = fixedMcpDefinition(server.name);
  return Boolean(definition && definition.name === server.name.trim() && definition.url === server.url?.trim());
}

/**
 * Reject a user supplied URL that attempts to impersonate a fixed entry.  A
 * custom server with an unrelated name remains fully supported.
 */
export function assertMcpServerIdentity(server: Pick<AgentMcpServer, "name"> & Partial<Pick<AgentMcpServer, "url">>): void {
  if (server.name.trim().toLowerCase() === "scienceevolve-sii") {
    throw new Error("内置 scienceevolve-sii 使用 experimentMcp 独立选择，不接受自定义连接或项目 MCP 引用");
  }
  if (server.name.trim().toLowerCase() === "scienceevolve-sleep") {
    throw new Error("scienceevolve-sleep 是自动注入的内置 MCP，不能作为自定义 MCP 配置");
  }
  const definition = fixedMcpDefinition(server.name);
  if (definition && !isFixedMcpServer(server)) {
    throw new Error(`系统 MCP ${definition.name} 的名称和 URL 必须与固定目录完全匹配`);
  }
}

export function normalizeMcpServerSelection(
  servers: readonly AgentMcpServer[]
): AgentMcpServer[] {
  const result: AgentMcpServer[] = [];
  const names = new Set<string>();
  for (const raw of servers) {
    const name = String(raw?.name ?? "").trim();
    const url = String(raw?.url ?? "").trim();
    const server: AgentMcpServer = raw.project === undefined
      ? { name, url }
      : { name, project: raw.project };
    if (!name || (raw.project === undefined && !url)) throw new Error("MCP 名称和 URL 不能为空");
    assertMcpServerIdentity(server);
    const key = name.toLowerCase();
    if (names.has(key)) throw new Error("MCP 名称不能重复");
    names.add(key);
    result.push(server);
  }
  if (result.length > 32) throw new Error("每个 Agent 最多可配置 32 个 MCP");
  return result;
}

/** Project references must be resolved to invocation-local HTTP endpoints before a Harness starts. */
export function resolvedMcpServers(
  servers: readonly AgentMcpServer[]
): Array<{ name: string; url: string }> {
  return servers.map((server) => {
    if (!server.url) throw new Error(`Unresolved project MCP: ${server.name}`);
    return { name: server.name, url: server.url };
  });
}

export function sameMcpServerSelection(
  left: AgentMcpServer,
  right: AgentMcpServer
): boolean {
  return left.name === right.name &&
    left.url === right.url &&
    left.project === right.project;
}

/** Public directory records are safe to serialize to the browser. */
export function publicFixedMcpDirectory(): FixedMcpDefinition[] {
  return FIXED_MCP_DIRECTORY.map((entry) => ({ ...entry }));
}

export function fixedMcpToken(): string | undefined {
  const value = process.env[FIXED_MCP_TOKEN_ENV_VAR];
  return value?.trim() || undefined;
}
