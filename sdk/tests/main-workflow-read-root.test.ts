import { afterEach, describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { compileFilesystemAuthority, filesystemAuthorityPrompt } from "../src/core/harness-runtime/filesystem-authority.js";
import { AUTHORITATIVE_WORKFLOW_REFERENCES } from "../src/core/orchestration-control-bridge.js";

const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true }))); });
describe("canonical workflow evidence roots", () => {
  it("supplies a separate read-only evidence root without granting management business writes", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-workflow-read-")); roots.push(root);
    const home = path.join(root, "home"), project = path.join(root, "project"), workspace = path.join(project, "agent");
    const workflow = path.join(project, "workflow"), proposal = path.join(workspace, ".scienceevolve", "management", "inv-fixture", "proposal");
    await Promise.all([fs.mkdir(home), fs.mkdir(workflow, { recursive: true }), fs.mkdir(proposal, { recursive: true })]);
    const authority = await compileFilesystemAuthority({ permission: "workspace", role: "leader", gitEnabled: true,
      serviceUserRoot: home, executionWorktree: workspace, managementWriteRoot: proposal, inputReadRoots: [workflow], protectedRoots: [] });
    const reference = authority.rootBindings.find((binding) => binding.path === workflow)!;
    expect(reference.write).toBe(false); expect(authority.writeRoots).toEqual([proposal]); expect(authority.gitCapability).toBe("none");
    const prompt = filesystemAuthorityPrompt(authority, { workspacePath: workspace, workflowReadDirectory: workflow,
      inboxPath: path.join(workspace, "Inbox.md"), memoryPath: path.join(workspace, "Memory.md"), workflowAuthoringPath: path.join(proposal, "workflow.json") });
    expect(prompt).toContain(path.join(workflow, "definition.json"));
    expect(prompt).toContain(path.join(workflow, "current-state.json"));
    expect(prompt).not.toContain("rootId");
  });
});
