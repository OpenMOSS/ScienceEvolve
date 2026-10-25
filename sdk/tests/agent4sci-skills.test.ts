import { afterEach, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SkillCatalog } from "../src/core/skill-catalog.js";
import { stageInvocationSkills } from "../src/core/harness-runtime/skill-staging.js";

const roots: string[] = [];
const ids = ["research", "experiment", "checklist"].map(name => `builtin:agent4sci-${name}`);
afterEach(async () => { for (const root of roots.splice(0)) await fs.rm(root, { recursive: true, force: true }); });

it("resolves all three builtins and stages their licensed resources into an Agent-scoped workspace", async () => {
  const catalog = new SkillCatalog([fileURLToPath(new URL("../../.agents/skills/", import.meta.url))]);
  const selected = await catalog.resolve(ids);
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "agent4sci-stage-")));
  roots.push(root);
  const staged = await stageInvocationSkills(selected, [], root, selected, "research");
  expect(staged.skillPaths).toHaveLength(3);
  expect(staged.autoSkillPaths).toEqual([]);
  for (let i = 0; i < selected.length; i++) {
    const source = path.dirname(selected[i]);
    const destination = path.dirname(staged.skillPaths[i]);
    expect(destination.startsWith(path.join(root, ".scienceevolve", "agent-skills", "research", "skills") + path.sep)).toBe(true);
    for (const file of ["SKILL.md", "LICENSE", "UPSTREAM.md"]) {
      expect(await fs.readFile(path.join(destination, file))).toEqual(await fs.readFile(path.join(source, file)));
    }
  }
  const research = path.dirname(staged.skillPaths[0]);
  const experiment = path.dirname(staged.skillPaths[1]);
  await expect(fs.readFile(path.join(research, "references/literature-review.md"), "utf8")).resolves.toContain("REFERENCES.md");
  await expect(fs.readFile(path.join(experiment, "best_practices.md"), "utf8")).resolves.toContain("--checkpoint-dir");

  // Execute the staged helper, including a path with spaces, not the source copy.
  const dirs = ["1A", "1B", "2A", "2B"].map(name => path.join(root, "review batch", name));
  const check = () => {
    const result = spawnSync(process.env.PYTHON || (process.platform === "win32" ? "python" : "python3"),
      [path.join(research, "scripts/check_reviews.py"), ...dirs], { encoding: "utf8", timeout: 10_000, windowsHide: true });
    if (result.error) throw result.error;
    return { status: result.status, body: JSON.parse(result.stdout) };
  };
  expect(check()).toMatchObject({ status: 1, body: { ready: false, reviews: 4 } });
  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "REVIEW.md"), "A reviewed finding with citation [1].");
    await fs.writeFile(path.join(dir, "REFERENCES.md"), "[1] Primary source read in this test fixture.");
    await fs.writeFile(path.join(dir, "done.json"), JSON.stringify({ completed_at: "2026-10-25T00:00:00Z" }));
  }
  expect(check()).toMatchObject({ status: 0, body: { ready: true, errors: [] } });
  await fs.writeFile(path.join(dirs[0], "REVIEW.md"), "  ");
  expect(check().status).toBe(1);
  await fs.writeFile(path.join(dirs[0], "REVIEW.md"), "Restored report.");
  for (const marker of ["not json", "null", "[]", '{"completed_at":"yesterday"}', '{"completed_at":"2026-10-25T00:00:00"}']) {
    await fs.writeFile(path.join(dirs[1], "done.json"), marker);
    expect(check()).toMatchObject({ status: 1, body: { ready: false } });
  }
});

it("validates the packaged example with all three selected Skills", async () => {
  const { validateMainWorkflowConfig } = await import("../src/main-config.js");
  const workflow = validateMainWorkflowConfig(JSON.parse(await fs.readFile(new URL("../examples/agent4sci/workflow.json", import.meta.url), "utf8")));
  for (const agent of Object.values(workflow.agents)) expect(agent.skills).toEqual(ids);
});
