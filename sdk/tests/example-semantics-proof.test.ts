import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const repository = fileURLToPath(new URL("../../", import.meta.url));
const baselinePath = "sdk/tests/fixtures/example-migration.json";
const proofPath = "sdk/tests/fixtures/example-migration-branding.json";
const baseline = JSON.parse(await fs.readFile(path.join(repository, baselinePath), "utf8"));
const temporary: string[] = [];
afterEach(async () => {
  await Promise.all(temporary.splice(0).map(root => fs.rm(root, { recursive: true, force: true, maxRetries: 5 })));
});
async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "sdk-semantic-proof-")); temporary.push(root);
  for (const file of [baselinePath, proofPath, "docs/renaming/baseline-inventory.json",
    "sdk/scripts/scienceevolve-branding.mjs", "sdk/scripts/check-example-semantics.mjs", ...Object.keys(baseline.workflows)]) {
    await fs.mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await fs.copyFile(path.join(repository, file), path.join(root, file));
  }
  const run = (...args: string[]) => {
    const result = spawnSync(process.execPath, [path.join(root, "sdk/scripts/check-example-semantics.mjs"), ...args],
      { encoding: "utf8", windowsHide: true });
    return { status: result.status, output: result.stdout + result.stderr };
  };
  return { root, run };
}

describe("example semantic proof without historical Git objects", () => {
  it("verifies an extracted source tree and refuses proof regeneration without original sources", async () => {
    const f = await fixture(), before = await fs.readFile(path.join(f.root, proofPath));
    const result = f.run(); expect(result, result.output).toMatchObject({ status: 0 });
    expect(result.output).toContain(`${Object.keys(baseline.workflows).length} workflows`);
    expect(f.run("--write").output).toContain("requires --source");
    expect(await fs.readFile(path.join(f.root, proofPath))).toEqual(before);
  });

  it("rejects changed workflow behavior against the original semantic digest", async () => {
    const f = await fixture(), file = Object.keys(baseline.workflows)[0];
    const workflow = JSON.parse(await fs.readFile(path.join(f.root, file), "utf8"));
    const agent: any = Object.values(workflow.agents)[0];
    agent.instructions += "\nChanged scientific task.";
    await fs.writeFile(path.join(f.root, file), JSON.stringify(workflow));
    expect(f.run().status).not.toBe(0);
  });

  it("requires Pi for the ARIS author deployment", async () => {
    const f = await fixture(), file = path.join(f.root, "example/aris/workflow.json");
    const workflow = JSON.parse(await fs.readFile(file, "utf8"));
    workflow.agents.main.harness = "codex";
    await fs.writeFile(file, JSON.stringify(workflow));
    expect(f.run()).toMatchObject({ status: 1, output: expect.stringContaining("Invalid ARIS author Harness: main") });
  });

  it.each(["missing", "extra", "edits", "identity"])("rejects %s proof drift", async fault => {
    const f = await fixture(), file = path.join(f.root, proofPath);
    const proof = JSON.parse(await fs.readFile(file, "utf8"));
    const first = Object.keys(proof.workflows)[0];
    if (fault === "missing") delete proof.workflows[first];
    if (fault === "extra") proof.workflows["example/unexpected/workflow.json"] = proof.workflows[first];
    if (fault === "edits") proof.workflows[first].edits = [];
    if (fault === "identity") proof.sourceCommit = "0".repeat(40);
    await fs.writeFile(file, JSON.stringify(proof));
    expect(f.run().status).not.toBe(0);
  });
});
