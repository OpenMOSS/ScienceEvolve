import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { MainSourceWorkspaceStore } from "../src/main-source-workspace.js";
import { LocalCollaborationGitService } from "../src/core/collaboration-git/local-git.js";
import { exportMainWorkspace } from "../src/main-workspace.js";

const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 }))); });
async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-main-source-")); roots.push(root);
  const data = path.join(root, "data"), source = path.join(root, "source");
  await fs.mkdir(data); await fs.mkdir(source);
  const store = new MainSourceWorkspaceStore(data); await store.initialize(true);
  return { root, data, source, store };
}
const id = "prj_0123456789abcdef0123456789abcdef";
const git = (directory: string, args: string[]) => execFileSync("git", ["-c", "safe.directory=" + directory, "-c", "core.autocrlf=false", "-C", directory, ...args], { encoding: "buffer" });
async function service(data: string, store: MainSourceWorkspaceStore) {
  const projectRoot = path.join(data, "projects", id); await fs.mkdir(projectRoot, { recursive: true });
  return new LocalCollaborationGitService({ projectId: id, projectRoot,
    operationStore: {} as never, initialTree: (input) => store.initialTree(id, input) });
}

describe("read-only main source snapshots with actual local Git (no provider/model requests)", () => {
  it("imports selected dirty tracked contents and binary/Unicode files, never source Git history, index, config, ignored or untracked files", async () => {
    const { root, data, source, store } = await fixture();
    await fs.mkdir(path.join(source, "nested"));
    await fs.writeFile(path.join(source, "README.md"), "committed\n");
    const binary = Buffer.from([0, 255, 13, 10, 128]); await fs.writeFile(path.join(source, "nested", "图.bin"), binary);
    git(source, ["init", "--initial-branch=main"]); git(source, ["add", "."]);
    git(source, ["-c", "user.name=Fixture", "-c", "user.email=fixture@localhost", "commit", "-m", "original"]);
    await fs.writeFile(path.join(source, "README.md"), "dirty seed\r\n");
    await fs.writeFile(path.join(source, ".env"), "not imported");
    const head = git(source, ["rev-parse", "HEAD"]), index = await fs.readFile(path.join(source, ".git", "index")), config = await fs.readFile(path.join(source, ".git", "config"));
    const snapshot = await store.prepare({ path: source }); await store.bind(id, snapshot);
    const local = await service(data, store);
    const initial = await local.initializeMain({ title: "Source fixture", operationId: "initial-source-fixture" });
    expect(await fs.readFile(path.join(source, "README.md"), "utf8")).toBe("dirty seed\r\n");
    expect(git(source, ["rev-parse", "HEAD"]).equals(head)).toBe(true);
    expect((await fs.readFile(path.join(source, ".git", "index"))).equals(index)).toBe(true);
    expect((await fs.readFile(path.join(source, ".git", "config"))).equals(config)).toBe(true);
    expect(git(local.repositoryPath, ["rev-list", "--count", "main"]).toString().trim()).toBe("1");
    expect(git(local.repositoryPath, ["log", "-1", "--format=%B"]).toString()).toContain(`OpenFARS-Source: ${snapshot.fingerprint}`);
    const exported = await exportMainWorkspace({ dataDir: data, projectDir: path.dirname(local.repositoryPath), repository: local.repositoryPath,
      options: { destination: path.join(root, "delivery") } });
    expect(exported.commit).toBe(initial.head);
    expect(await fs.readFile(path.join(exported.destination, "README.md"), "utf8")).toBe("dirty seed\r\n");
    expect((await fs.readFile(path.join(exported.destination, "nested", "图.bin"))).equals(binary)).toBe(true);
    await expect(fs.access(path.join(exported.destination, ".env"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(fs.access(path.join(exported.destination, ".git"))).rejects.toMatchObject({ code: "ENOENT" });
  }, 30_000);
  it("imports actual conflicted working files while preserving the original unresolved index", async () => {
    const { data, source, store } = await fixture();
    git(source, ["init", "--initial-branch=main"]);
    await fs.writeFile(path.join(source, "conflict.txt"), "<<<<<<< ours\nours\n=======\ntheirs\n>>>>>>> theirs\n");
    const oid = execFileSync("git", ["-C", source, "hash-object", "-w", "--stdin"], { input: "base", encoding: "utf8" }).trim();
    execFileSync("git", ["-C", source, "update-index", "--index-info"], { input: `100644 ${oid} 1\tconflict.txt\n100644 ${oid} 2\tconflict.txt\n100644 ${oid} 3\tconflict.txt\n` });
    const before = await fs.readFile(path.join(source, ".git/index"));
    const snapshot = await store.prepare({ path: source }); await store.bind(id, snapshot);
    const local = await service(data, store);
    await local.initializeMain({ title: "Unresolved source", operationId: "unresolved-source" });
    expect(git(local.repositoryPath, ["show", "main:conflict.txt"]).toString()).toBe(await fs.readFile(path.join(source, "conflict.txt"), "utf8"));
    expect(await fs.readFile(path.join(source, ".git/index"))).toEqual(before);
    expect(git(source, ["ls-files", "--unmerged"]).toString().split("\n").filter(Boolean)).toHaveLength(3);
  });
  it("reopens an immutable binding after source removal and repeats initialization without another commit", async () => {
    const { root, data, source, store } = await fixture();
    await fs.writeFile(path.join(source, "source.txt"), "original snapshot");
    const snapshot = await store.prepare({ path: source, files: ["source.txt"] }); await store.bind(id, snapshot);
    const local = await service(data, store);
    const first = await local.initializeMain({ title: "seed", operationId: "same-operation" });
    await fs.writeFile(path.join(source, "source.txt"), "changed after snapshot");
    await fs.rename(source, path.join(root, "source-retained"));
    const reopened = new MainSourceWorkspaceStore(data); await reopened.initialize(false);
    const again = await service(data, reopened);
    const second = await again.initializeMain({ title: "different title", operationId: "same-operation" });
    expect(second.head).toBe(first.head);
    expect(git(again.repositoryPath, ["show", "main:source.txt"]).toString()).toBe("original snapshot");
    expect(git(again.repositoryPath, ["rev-list", "--count", "main"]).toString().trim()).toBe("1");
    await expect(again.initializeMain({ title: "seed", operationId: "different-operation" })).rejects.toThrow(/initialization operation/);
    const noSeed = new LocalCollaborationGitService({ projectId: id, projectRoot: path.dirname(again.repositoryPath), operationStore: {} as never });
    await expect(noSeed.initializeMain({ title: "seed", operationId: "same-operation" })).rejects.toThrow(/initialization operation/);
  }, 30_000);
  it("fails closed on missing registry, unbound project or mutated/missing snapshots (no default README fallback)", async () => {
    const { data, source, store } = await fixture();
    await fs.writeFile(path.join(source, "source.txt"), "original");
    const snapshot = await store.prepare({ path: source, files: ["source.txt"] });
    const local = await service(data, store);
    await expect(local.initializeMain({ title: "seed", operationId: "seed-operation" })).rejects.toThrow(/durable.*binding/);
    await store.bind(id, snapshot);
    const directory = path.join(data, "source-workspaces", "snapshots", snapshot.id);
    const manifest = JSON.parse(await fs.readFile(path.join(directory, "manifest.json"), "utf8"));
    await fs.writeFile(path.join(directory, "blobs", manifest.files[0].sha256), "tampered");
    await expect(local.initializeMain({ title: "seed", operationId: "seed-operation" })).rejects.toThrow(/blob changed/);
    await fs.rename(path.join(directory, "manifest.json"), path.join(directory, "manifest-retained.json"));
    await expect(local.initializeMain({ title: "seed", operationId: "seed-operation" })).rejects.toMatchObject({ code: "ENOENT" });
    await fs.rename(path.join(data, "source-workspaces", "bindings.json"), path.join(data, "source-workspaces", "bindings-retained.json"));
    await expect(new MainSourceWorkspaceStore(data).initialize(false)).rejects.toMatchObject({ code: "ENOENT" });
  }, 30_000);
  it.each(["../outside", ".git/config", ".env", "secrets.pem", "gateways.json", "workflow/child.ts", "Memory.md", "node_modules/a.js", "a\\b", "a:b", "Foo/x", "nul.txt"])("rejects unsafe, reserved or colliding name %s before staging", async (name) => {
    const { source, store } = await fixture();
    const files = name === "Foo/x" ? ["Foo/x", "foo/y"] : [name];
    await expect(store.prepare({ path: source, files })).rejects.toThrow();
  });
  it("requires explicit non-Git files and refuses duplicates, empty lists, unknown options and overlapping runtime", async () => {
    const { data, source, store } = await fixture();
    await expect(store.prepare({ path: source })).rejects.toThrow(/explicit files/);
    await expect(store.prepare({ path: source, files: [] })).rejects.toThrow(/1–5000/);
    await expect(store.prepare({ path: source, files: ["a", "a"] })).rejects.toThrow(/collision/);
    await expect(store.prepare({ path: source, files: ["a"], tree: "ignored" } as never)).rejects.toThrow(/Invalid sourceWorkspace/);
    await expect(store.prepare({ path: data, files: ["a"] })).rejects.toThrow(/overlap/);
    await expect(store.prepare({ path: path.dirname(data), files: ["a"] })).rejects.toThrow(/overlap/);
  });
  it("records a default no-source binding without replacing a selected source snapshot", async () => {
    const { source, data, store } = await fixture();
    await fs.writeFile(path.join(source, "source.txt"), "source remains selected");
    const snapshot = await store.prepare({ path: source, files: ["source.txt"] });
    await store.bind(id, snapshot); await store.bindDefault(id);
    const other = "prj_22222222222222222222222222222222";
    await store.bindDefault(other); await store.bindDefault(other);
    const registry = JSON.parse(await fs.readFile(path.join(data, "source-workspaces", "bindings.json"), "utf8"));
    expect(registry.projects[id]).toEqual(snapshot); expect(registry.projects[other]).toBe(null);
  });
  it("rejects hardlinks and directory junctions without modifying their targets", async () => {
    const { root, source, store } = await fixture();
    const outside = path.join(root, "outside.txt"); await fs.writeFile(outside, "untouched");
    await fs.link(outside, path.join(source, "hard.txt"));
    await expect(store.prepare({ path: source, files: ["hard.txt"] })).rejects.toThrow(/regular files/);
    const directory = path.join(root, "outside-dir"); await fs.mkdir(directory); await fs.writeFile(path.join(directory, "file"), "untouched directory");
    await fs.symlink(directory, path.join(source, "junction"), process.platform === "win32" ? "junction" : "dir");
    await expect(store.prepare({ path: source, files: ["junction/file"] })).rejects.toThrow(/symlinks\/junctions/);
    expect(await fs.readFile(outside, "utf8")).toBe("untouched");
    expect(await fs.readFile(path.join(directory, "file"), "utf8")).toBe("untouched directory");
  });
  it("rejects symlink/submodule Git index modes without requiring OS file symlink permission", async () => {
    const { source, store } = await fixture(); git(source, ["init"]);
    const oid = execFileSync("git", ["-C", source, "hash-object", "-w", "--stdin"], { input: "somewhere", encoding: "utf8" }).trim();
    git(source, ["update-index", "--add", "--cacheinfo", `120000,${oid},link`]);
    await expect(store.prepare({ path: source })).rejects.toThrow(/symlinks\/submodules/);
  });
  it("rejects oversized and cancelled source copies, and never binds partial preparation", async () => {
    const { source, store } = await fixture();
    const large = await fs.open(path.join(source, "large.bin"), "w"); try { await large.truncate(32 * 1024 * 1024 + 1); } finally { await large.close(); }
    await expect(store.prepare({ path: source, files: ["large.bin"] })).rejects.toThrow(/32 MiB/);
    await expect(store.prepare({ path: source, files: ["large.bin"] }, AbortSignal.abort(new Error("cancelled")))).rejects.toThrow(/cancelled/);
  });
});
