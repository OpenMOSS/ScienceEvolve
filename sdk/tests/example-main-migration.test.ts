import { expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadWorkflowConfig } from "../src/index.js";
import { brandingDigest, unbrandBytes } from "../scripts/scienceevolve-branding.mjs";

const repository = fileURLToPath(new URL("../../", import.meta.url));
const baseline = JSON.parse(await readFile(new URL("./fixtures/example-migration.json", import.meta.url), "utf8"));
const naming = JSON.parse(await readFile(new URL("./fixtures/example-migration-branding.json", import.meta.url), "utf8"));
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;
  return JSON.stringify(value);
}

// Hashes were captured from eaeaad1 BEFORE migration. Guard against accidental
// removal of method stages/prompts/models/skills/budgets while changing deployment.
// This does not prove a paper was reproduced by real models.
it.each(Object.keys(baseline.workflows))("preserves research semantics and main deployment policy: %s", async file => {
  const source = JSON.parse(await readFile(path.join(repository, file), "utf8"));
  const config = await loadWorkflowConfig(path.join(repository, file));
  expect(config.git.enabled).toBe(false);
  expect(config.orchestration.schemaVersion).toBe(2);
  const semanticAgents: Record<string, unknown> = {};
  for (const [name, agent] of Object.entries(source.agents) as [string, Record<string, unknown>][]) {
    expect(agent).not.toHaveProperty("gatewaySource");
    expect(agent).not.toHaveProperty("reasoningEffort");
    expect(agent.proxy).toEqual({ mode: "direct" });
    const expected = baseline.workflows[file].agents[name];
    expect(config.agents[name].gatewayReasoningOption).toBe(expected.reasoning);
    expect(config.agents[name].permission).toBe(expected.permission);
    semanticAgents[name] = Object.fromEntries(Object.entries(agent).filter(([key]) => !["proxy", "permission", "gatewayReasoningOption"].includes(key)));
    // Only the host-selected cwd sentence changed when --workspace was added.
    // Restore that exact deployment sentence for the original semantic hash;
    // keep every other prompt byte, model, method stage and graph protected.
    const semanticAgent = semanticAgents[name] as Record<string, unknown>;
    // Pin the ARIS author deployment while checking the fixed method digest.
    if (file === "example/aris/workflow.json" && !["reviewer", "paper_reviewer"].includes(name)) {
      expect(agent.harness).toBe("pi");
      semanticAgent.harness = "claude-code";
    }
    if (typeof semanticAgent.instructions === "string") semanticAgent.instructions = semanticAgent.instructions.replace(
      "All Agents in this Git-off project use the same persistent workspace selected by the SDK host. Use the actual workspace path supplied in this invocation rather than assuming a dataDir subdirectory.",
      "All Agents in this project use the same persistent workspace: <dataDir>/projects/<projectId>/workspaces/."
    );
  }
  const semanticBytes = Buffer.from(canonical({ agents: semanticAgents, orchestration: source.orchestration }));
  const namingProof = naming.workflows[file];
  expect(naming.brandingDigest).toBe(brandingDigest);
  expect(namingProof.originalSemanticSha256).toBe(baseline.workflows[file].sha256);
  expect(createHash("sha256").update(semanticBytes).digest("hex")).toBe(namingProof.brandedSemanticSha256);
  // Reverse only the exact recorded naming edits; every original semantic hash
  // remains unchanged, and unrelated prompt/configuration edits still fail.
  const originalBytes = unbrandBytes(semanticBytes, namingProof.edits);
  const sha256 = createHash("sha256").update(originalBytes).digest("hex");
  expect(sha256).toBe(baseline.workflows[file].sha256);
});
