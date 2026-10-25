import { afterEach, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadMainWorkflowConfig as loadWorkflowConfig } from "../src/main-config.js";
import { stageInvocationSkills } from "../src/core/harness-runtime/skill-staging.js";

const examples = fileURLToPath(new URL("../../example/", import.meta.url));
const methods = ["aris", "metaharness", "autoresearch", "funsearch", "agent-laboratory", "sciagents", "robin", "co-scientist", "biomni", "agentrxiv", "scientist-two", "rrsi", "drugevolve"];
const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map(root => fs.rm(root, {recursive:true, force:true}))); });

// This checks real loading/staging. It does not substitute a scripted routing
// fixture for evidence that the research method was executed by a real model.
it.each(methods)("loads with main and stages the complete portable %s Skill", async method => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-method-")); roots.push(root);
  const copied = path.join(root, "template");
  await fs.cp(path.join(examples, method), copied, { recursive:true });
  const workflow = await loadWorkflowConfig(path.join(copied, "workflow.json"));
  expect(workflow.git.enabled).toBe(false);
  expect(workflow.orchestration.allowMainReconfiguration).toBe(false);
  expect(workflow.agents).not.toHaveProperty("evolver");
  const skills = workflow.agents.main.skills.map(skill => path.join(skill, "SKILL.md"));
  for (const agent of Object.values(workflow.agents)) {
    expect(agent.skills).toEqual(workflow.agents.main.skills);
  }
  const { skillPaths: staged } = await stageInvocationSkills(skills, [], path.join(root, "workspace"), [], "main");
  expect(staged).toHaveLength(1);
  const directory = path.dirname(staged[0]!);
  expect(await fs.readFile(staged[0]!, "utf8")).toContain(`name: scienceevolve-${method}`);
  if (!["autoresearch", "co-scientist"].includes(method)) {
    const manifest = JSON.parse(await fs.readFile(path.join(directory, "UPSTREAM.json"), "utf8"));
    for (const entry of manifest.files) await expect(fs.access(path.join(directory, entry.path))).resolves.toBeUndefined();
  }
  if (method === "aris") {
    expect(workflow.agents.reviewer.model).not.toBe(workflow.agents.research_loop.model);
    expect(workflow.agents.paper_reviewer.sessionPersistence).toBe(false);
    expect(workflow.agents.reviewer.sessionPersistence).toBe(false);
    const integrity = JSON.parse(await fs.readFile(path.join(directory, "INTEGRITY_UPSTREAM.json"), "utf8"));
    for (const entry of integrity.files) await expect(fs.access(path.join(directory, entry.path))).resolves.toBeUndefined();
    await expect(fs.access(path.join(directory, "upstream/tools/review_gate.py"))).resolves.toBeUndefined();
    await expect(fs.access(path.join(directory, "upstream/skills/paper-writing/SKILL.md"))).resolves.toBeUndefined();
  }
}, 20_000);

it('loads all seven consolidated Git-on method workflows and their embedded resources', async () => {
  for(const method of ["ai-scientist-v2","kosmos","internagent-1-5","biomni-r0","chemical-coscientist","alphaevolve","raven"]) {
    const file=path.join(examples,method,'workflow.json');
    const workflow=await loadWorkflowConfig(file);
    expect(workflow.git.enabled,method).toBe(true);
    expect(workflow.orchestration.schemaVersion,method).toBe(3);
    expect(workflow.orchestration.allowMainReconfiguration,method).toBe(false);
    expect(Object.keys(workflow.mcpDefinitions??{}).length,method).toBeGreaterThan(0);
    expect((await fs.readFile(path.join(examples,method,'research_proposal.txt'),'utf8')).trim().length).toBeGreaterThan(0);
  }
});
