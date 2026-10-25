import assert from "node:assert/strict";
import { access, mkdir, readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  createMainApplicationRuntime, MAIN_RUNTIME_SOURCE_COMMIT, MAIN_RUNTIME_REVISION
} from "@scienceevolve/sdk/application/main-runtime";
import { connectMcp } from "./mcp-client.mjs";
import { projectMcpSource } from "./project-mcp-source.mjs";

// Runs in a repository-external consumer with the installed tarball only.
const root = path.resolve("standalone-main-runtime-data");
await mkdir(root, { recursive: true });
const runtime = await createMainApplicationRuntime({ dataDir: root });
try {
  assert.equal(runtime.sourceCommit, MAIN_RUNTIME_SOURCE_COMMIT);
  assert.equal(runtime.runtimeRevision, MAIN_RUNTIME_REVISION);
  assert.deepEqual(await runtime.orchestrator.listProjects(), []);
  const db = new DatabaseSync(path.join(root, "collaboration-state.sqlite"));
  try {
    assert.equal(db.prepare("PRAGMA journal_mode").get().journal_mode, "delete");
    assert.ok(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().length > 10);
  } finally { db.close(); }
  const packageRoot = path.resolve("node_modules/@scienceevolve/sdk");
  const agent4sciIds = ["research", "experiment", "checklist"].map(name => `builtin:agent4sci-${name}`);
  const agent4sciPaths = await runtime.skills.resolve(agent4sciIds);
  const { stageInvocationSkills } = await import(new URL("./core/harness-runtime/skill-staging.js", import.meta.resolve("@scienceevolve/sdk/application/main-runtime")));
  const skillWorkspace = path.join(root, "agent4sci-consumer-workspace"); await mkdir(skillWorkspace);
  const stagedSkills = await stageInvocationSkills(agent4sciPaths, [], skillWorkspace, agent4sciPaths, "research");
  for (const skillPath of stagedSkills.skillPaths) {
    assert.ok((await readFile(skillPath, "utf8")).includes("name: agent4sci-"));
    await access(path.join(path.dirname(skillPath), "LICENSE"));
    await access(path.join(path.dirname(skillPath), "UPSTREAM.md"));
  }
  await access(path.join(path.dirname(stagedSkills.skillPaths[0]), "scripts/check_reviews.py"));
  await access(path.join(path.dirname(stagedSkills.skillPaths[0]), "references/literature-review.md"));
  await access(path.join(path.dirname(stagedSkills.skillPaths[1]), "best_practices.md"));
  console.log("Installed Agent4Sci skills resolved and staged with support files");
  const manifest = JSON.parse(await readFile(path.join(packageRoot, "resources/main-runtime/manifest.json"), "utf8"));
  assert.equal(manifest.sourceCommit, MAIN_RUNTIME_SOURCE_COMMIT);
  assert.equal(manifest.runtimeRevision, MAIN_RUNTIME_REVISION);
  assert.equal(manifest.schemaVersion, 2);
  for (const entry of manifest.files.filter((entry) => entry.target.startsWith("src/core/") && !entry.target.endsWith(".ts"))) {
    await access(path.join(packageRoot, "dist", entry.target.slice("src/".length)));
  }
  for (const schema of ["main-decision.json", "worker-result.json"]) {
    const content = JSON.parse(await readFile(path.join(packageRoot, "dist/schemas", schema), "utf8"));
    assert.ok(content.type || content.$schema);
  }
  // Exercise main's actual schema lookup, not merely the archive file list.
  const { ProductionCollaborationExecutionInputBuilder } = await import(new URL(
    "./core/collaboration-runtime.js", import.meta.resolve("@scienceevolve/sdk/application/main-runtime")
  ));
  const id = "prj_00000000000000000000000000000000";
  const request = await new ProductionCollaborationExecutionInputBuilder(runtime.storage, runtime.skills).build({
    state: { id, agents: { main: { permission: "workspace", skills: [], autoSkills: [] } },
      orchestration: { schemaVersion: 2 }, agentSessionIds: {}, skillDefinitions: {} },
    agentId: "main", assignment: "fixture schema lookup", invocationId: "fixture-invocation",
    executionContext: { role: "leader", nodeRunId: "fixture-node", routeScopeId: "fixture-route", coordinatorEpoch: 1 },
    projectPath: runtime.storage.projectDir(id), worktreePath: path.join(root, "fixture-worktree"),
    inboxPath: path.join(root, "fixture-inbox"), runtimePath: path.join(root, "fixture-runtime")
  });
  assert.equal(request.schemaPath, path.join(packageRoot, "dist/schemas/main-decision.json"));
  // Exercise the fork-loaded compiled supervisor: file presence alone did not catch the missing dependency.
  const { startProjectMcps } = await import(new URL("./core/project-mcp.js", import.meta.resolve("@scienceevolve/sdk/application/main-runtime")));
  const workspace = path.join(root, "compiled-mcp-workspace"); await mkdir(workspace);
  const lease = await startProjectMcps({ projectPath: path.join(root, "compiled-mcp-project"), workspacePath: workspace,
    runtimePath: path.join(root, "compiled-mcp-runtime"), definitions: { evidence: { entrypoint: "server.cjs", files: { "server.cjs": projectMcpSource("compiled-main-core") } } },
    servers: [{ name: "evidence", project: "evidence" }], signal: new AbortController().signal });
  try {
    const client = await connectMcp(lease.servers[0]);
    try { assert.equal(JSON.parse((await client.callTool({ name: "evidence" })).content[0].text).version, "compiled-main-core"); }
    finally { await client.close(); }
  } finally { await lease.close(); }
} finally { await runtime.close(); }
// Real local Git and compiled export adapter; no model or GitHub request. A completed RunHandle is covered separately.
const exportData = path.resolve("compiled-export-data"), exportProject = path.join(exportData, "projects", "fixture");
const repository = path.join(exportProject, "repository"); await mkdir(exportProject, { recursive: true });
execFileSync("git", ["init", "--bare", "--initial-branch=main", repository], { encoding: "utf8", timeout: 30_000 });
const git = (args, input) => execFileSync("git", ["-c", "core.autocrlf=false", "--git-dir", repository, ...args], { encoding: "utf8", input, timeout: 30_000 });
const blob = git(["hash-object", "-w", "--stdin"], "compiled export evidence\n").trim();
const tree = git(["mktree"], `100644 blob ${blob}\tevidence.txt\n`).trim();
const commit = git(["-c", "user.name=Fixture", "-c", "user.email=fixture@localhost", "commit-tree", tree, "-m", "compiled export"]).trim();
git(["update-ref", "refs/heads/main", commit]);
const { exportMainWorkspace } = await import(new URL("./main-workspace.js", import.meta.resolve("@scienceevolve/sdk/application/main-runtime")));
const delivery = await exportMainWorkspace({ dataDir: exportData, projectDir: exportProject, repository,
  options: { destination: path.resolve("compiled-delivery") } });
assert.equal(delivery.commit, commit);
assert.equal(await readFile(path.join(delivery.destination, "evidence.txt"), "utf8"), "compiled export evidence\n");
await assert.rejects(access(path.join(delivery.destination, ".git")), { code: "ENOENT" });
// Compiled immutable source -> actual main local-Git initializer -> export.
// The source is moved before initialization, so no fallback/source reread can pass.
const { MainSourceWorkspaceStore } = await import(new URL("./main-source-workspace.js", import.meta.resolve("@scienceevolve/sdk/application/main-runtime")));
const { LocalCollaborationGitService } = await import(new URL("./core/collaboration-git/local-git.js", import.meta.resolve("@scienceevolve/sdk/application/main-runtime")));
const sourceData = path.resolve("compiled-source-data"), sourcePath = path.resolve("compiled-source");
await mkdir(sourceData); await mkdir(sourcePath);
const { writeFile, rename } = await import("node:fs/promises");
await writeFile(path.join(sourcePath, "source.txt"), "compiled source seed\r\n");
await writeFile(path.join(sourcePath, "binary.bin"), Buffer.from([0, 255, 128]));
const sourceStore = new MainSourceWorkspaceStore(sourceData); await sourceStore.initialize(true);
const sourceId = "prj_11111111111111111111111111111111";
const seed = await sourceStore.prepare({ path: sourcePath, files: ["source.txt", "binary.bin"] });
await sourceStore.bind(sourceId, seed);
await rename(sourcePath, `${sourcePath}-retained`);
const reopenedSource = new MainSourceWorkspaceStore(sourceData); await reopenedSource.initialize(false);
const sourceProject = path.join(sourceData, "projects", sourceId); await mkdir(sourceProject, { recursive: true });
const local = new LocalCollaborationGitService({ projectId: sourceId, projectRoot: sourceProject, operationStore: {},
  initialTree: (input) => reopenedSource.initialTree(sourceId, input) });
const initial = await local.initializeMain({ title: "compiled source", operationId: "compiled-source-init" });
assert.equal((await local.initializeMain({ title: "retry", operationId: "compiled-source-init" })).head, initial.head);
const importedDelivery = await exportMainWorkspace({ dataDir: sourceData, projectDir: sourceProject, repository: local.repositoryPath,
  options: { destination: path.resolve("compiled-source-delivery") } });
assert.equal(await readFile(path.join(importedDelivery.destination, "source.txt"), "utf8"), "compiled source seed\r\n");
assert.deepEqual(await readFile(path.join(importedDelivery.destination, "binary.bin")), Buffer.from([0, 255, 128]));
await assert.rejects(access(path.join(root, ".scienceevolve-runtime.lock")), { code: "ENOENT" });
const reopened = await createMainApplicationRuntime({ dataDir: root });
await reopened.close();
// Check the exported compiled module can initialize from another Node process.
const childEntry = import.meta.resolve("@scienceevolve/sdk/application/main-runtime");
execFileSync(process.execPath, ["--input-type=module", "--eval", `
  const { createMainApplicationRuntime } = await import(${JSON.stringify(childEntry)});
  const runtime = await createMainApplicationRuntime({ dataDir: ${JSON.stringify(root)} });
  await runtime.close();
`], { cwd: process.cwd(), encoding: "utf8", timeout: 30_000 });
console.log(JSON.stringify({ entry: "application/main-runtime", sourceCommit: MAIN_RUNTIME_SOURCE_COMMIT,
  runtimeRevision: MAIN_RUNTIME_REVISION, compiledMainMcpRoundTrip: true, compiledLocalGitExport: true, compiledSourceSnapshot: true,
  actualSqlite: true, standalonePackage: true, nativeResources: true, actualSchemaLookup: true,
  realModel: false, realGitHub: false }));
