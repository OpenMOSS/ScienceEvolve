import { afterEach, describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { SearchTreeStore, searchTreeConfigSchema, type SearchTreeNode, type SearchTreeSnapshot } from "../../src/core/search-tree.js";
import { ExecFileGitCommandRunner } from "../../src/core/collaboration-git/command-runner.js";
import { toolsFor, type CapabilityContext } from "../../src/core/orchestration-control-mcp.js";
import { searchTreeTools } from "../../src/core/search-tree-mcp.js";

const temporary: string[] = [];
afterEach(async () => { await Promise.all(temporary.splice(0).map(root => fs.rm(root, { recursive: true, force: true }))); });
const user = { kind: "user" as const };
const agent = { kind: "agent" as const, agentId: "worker", executionId: "task-1", invocationId: "inv-1" };
const direction = { id: "speed", kind: "direction" as const, name: "速度", parentId: "root" };
const candidate: SearchTreeNode = { id: "cache", kind: "candidate", name: "缓存", parentId: "speed", goal: "Reduce repeated work",
  source: "Agent proposal", version: { status: "uncommitted" }, execution: { status: "not_started" } };
async function fixture(git = false) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "search-tree-test-")); temporary.push(root);
  const project = path.join(root, "project");
  const inputs = path.join(project, "workspaces", "user_inputs");
  await fs.mkdir(inputs, { recursive: true });
  return { project, inputs, store: new SearchTreeStore("project", project, git) };
}
const put = (node: SearchTreeNode, revision: string, requestId: string) => ({ operation: "put", node, expectedRevision: revision, requestId });

describe("search tree Git authority", () => {
  it("ST-01 exposes the tool only for an enabled project", () => {
    const context = { kind: "worker", candidates: [], decisionBy: "agent", canComplete: false } as unknown as CapabilityContext;
    expect(toolsFor(context).map(tool => tool.name)).not.toContain("search_tree");
    expect(toolsFor({ ...context, searchTree: true }).map(tool => tool.name)).toContain("search_tree");
  });
  it("ST-06 reconciles a lost save response without a second commit and exposes failed saves", async () => {
    const { store, inputs, project } = await fixture();
    const initial = await store.initialize({ root: { name: "Root" }, directions: [direction] }, inputs);
    const real = new ExecFileGitCommandRunner();
    const lost = new SearchTreeStore("project", project, false, { async run(input) {
      const result = await real.run(input);
      if (input.args[0] === "update-ref" && input.args[1] === "--stdin") throw new Error("response lost");
      return result;
    } });
    const request = put(candidate, initial.revision, "lost-response");
    const saved = await lost.request(agent, request) as SearchTreeSnapshot;
    expect((await lost.request(agent, request) as SearchTreeSnapshot).revision).toBe(saved.revision);
    const failed = new SearchTreeStore("project", project, false, { async run(input) {
      if (input.args[0] === "update-ref" && input.args[1] === "--stdin") throw new Error("storage unavailable");
      return real.run(input);
    } });
    await expect(failed.request(agent, put({ ...candidate, name: "changed" }, saved.revision, "failed"))).rejects.toThrow("not confirmed");
    expect((await store.snapshot()).revision).toBe(saved.revision);
  });
  it("ST-02/03 validates empty roots and nested directions without score or business commit", async () => {
    const { store, inputs } = await fixture();
    const initial = await store.initialize({ root: { name: "起点" }, directions: [] }, inputs);
    expect(initial.tree.nodes).toEqual([]);
    expect(execFileSync("git", ["--git-dir", store.repositoryPath, "show-ref", "--heads"], { encoding: "utf8" })).not.toContain("refs/heads/main");
    const next = await store.request(user, put(direction, initial.revision, "direction")) as SearchTreeSnapshot;
    const nested = { ...direction, id: "latency", name: "推理延迟", parentId: "speed" };
    const latest = await store.request(user, put(nested, next.revision, "nested")) as SearchTreeSnapshot;
    await expect(store.request(user, put({ ...direction, parentId: "latency" }, latest.revision, "cycle"))).rejects.toThrow("cycle");
    await expect(store.request(user, put({ ...direction, parentId: "missing" }, latest.revision, "missing"))).rejects.toThrow("does not exist");
    expect((await store.snapshot()).revision).toBe(latest.revision);
  });
  it("ST-04 attributes candidates, rejects fake results, restricts directions, and preserves deletion history", async () => {
    const { store, inputs } = await fixture();
    const initial = await store.initialize({ root: { name: "Root" }, directions: [direction] }, inputs);
    await expect(store.request(agent, put({ ...direction, name: "changed" }, initial.revision, "direction"))).rejects.toThrow("Only the user");
    await expect(store.request(agent, put({ ...candidate, execution: { status: "succeeded" } }, initial.revision, "fake"))).rejects.toThrow("evidence");
    const saved = await store.request(agent, put(candidate, initial.revision, "proposal")) as SearchTreeSnapshot;
    expect(saved.tree.update.actor).toEqual(agent);
    await expect(store.request(user, { operation: "delete", requestId: "bad-delete", expectedRevision: saved.revision, nodeId: "speed" })).rejects.toThrow("child nodes");
    const deleted = await store.request(agent, { operation: "delete", requestId: "delete", expectedRevision: saved.revision, nodeId: "cache" }) as SearchTreeSnapshot;
    expect(deleted.tree.nodes).toEqual([direction]);
    expect(await store.request(user, { operation: "node", revision: saved.revision, nodeId: "cache" })).toMatchObject({ node: candidate });
    expect(await store.request(user, { operation: "history" })).toMatchObject({ entries: expect.arrayContaining([expect.objectContaining({ requestId: "proposal" })]) });
  });
  it("ST-05 keeps business worktrees clean and retains actual version objects atomically", async () => {
    const { store, inputs, project } = await fixture(true);
    const initial = await store.initialize({ root: { name: "Root" }, directions: [direction] }, inputs);
    const runner = new ExecFileGitCommandRunner();
    const tree = execFileSync("git", ["--git-dir", store.repositoryPath, "mktree"], { input: "", encoding: "utf8" }).trim();
    const commit = (await runner.run({ cwd: store.repositoryPath, args: ["commit-tree", tree], stdin: "Business baseline\n",
      environment: { GIT_AUTHOR_NAME: "Fixture", GIT_AUTHOR_EMAIL: "fixture@localhost", GIT_COMMITTER_NAME: "Fixture", GIT_COMMITTER_EMAIL: "fixture@localhost" } })).stdout.trim();
    await runner.run({ cwd: store.repositoryPath, args: ["update-ref", "refs/heads/main", commit] });
    const workspace = path.join(project, "business");
    execFileSync("git", ["--git-dir", store.repositoryPath, "worktree", "add", workspace, "main"]);
    await fs.writeFile(path.join(workspace, "uncommitted.txt"), "owned by the Agent");
    const before = execFileSync("git", ["-C", workspace, "status", "--porcelain"], { encoding: "utf8" });
    const saved = await store.request(agent, put({ ...candidate, version: { status: "committed", commit } }, initial.revision, "version")) as SearchTreeSnapshot;
    expect(execFileSync("git", ["-C", workspace, "status", "--porcelain"], { encoding: "utf8" })).toBe(before);
    expect(execFileSync("git", ["--git-dir", store.repositoryPath, "rev-parse", "main"], { encoding: "utf8" }).trim()).toBe(commit);
    expect(execFileSync("git", ["--git-dir", store.repositoryPath, "rev-parse", `refs/scienceevolve/search-tree/versions/${commit}`], { encoding: "utf8" }).trim()).toBe(commit);
    await expect(store.request(agent, put({ ...candidate, version: { status: "committed", commit: initial.revision } }, saved.revision, "metadata"))).rejects.toThrow("metadata");
  });
  it("ST-06 fences concurrent writers, replays the original request and recovers after restart", async () => {
    const { store, inputs, project } = await fixture();
    const initial = await store.initialize({ root: { name: "Root" }, directions: [direction] }, inputs);
    const request = put(candidate, initial.revision, "write");
    const results = await Promise.allSettled([store.request(agent, request), store.request(agent, put({ ...candidate, id: "other" }, initial.revision, "other"))]);
    expect(results.filter(result => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter(result => result.status === "rejected")).toHaveLength(1);
    const winner = results[0].status === "fulfilled" ? request : put({ ...candidate, id: "other" }, initial.revision, "other");
    const restarted = new SearchTreeStore("project", project, false);
    const latest = await restarted.snapshot();
    expect((await restarted.request(agent, winner) as SearchTreeSnapshot).revision).toBe(latest.revision);
    await expect(restarted.request(agent, { ...winner, node: { ...winner.node, name: "changed" } })).rejects.toThrow("reused");
  });
  it("ST-07 keeps immutable original inputs and query operations never commit", async () => {
    const { store, inputs } = await fixture();
    await fs.writeFile(path.join(inputs, "seed.bin"), Buffer.from([0, 255, 12]));
    const saved = await store.initialize({ root: { name: "Input", inputFiles: ["seed.bin"] }, directions: [direction] }, inputs);
    await fs.writeFile(path.join(inputs, "seed.bin"), "changed by task");
    expect(await store.request(user, { operation: "input", path: "seed.bin" })).toMatchObject({ content: Buffer.from([0, 255, 12]).toString("base64") });
    await store.request(user, { operation: "overview" });
    await store.request(user, { operation: "subtree", nodeId: "root" });
    expect((await store.snapshot()).revision).toBe(saved.revision);
  });
  it("ST-03/08 rejects malformed initial plans and exposes an on-demand query contract", () => {
    expect(() => searchTreeConfigSchema.parse({ root: { name: "Root" }, directions: [{ ...direction, parentId: "speed" }] })).toThrow("cycle");
    expect(searchTreeTools()[0]).toMatchObject({ name: "search_tree", inputSchema: expect.any(Object) });
  });
});
