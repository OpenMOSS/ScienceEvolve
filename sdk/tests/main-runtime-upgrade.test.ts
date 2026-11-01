import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { recordSnapshot } from "../scripts/runtime-source-snapshot.mjs";

const sdk = fileURLToPath(new URL("../", import.meta.url));
const temporary: string[] = [];
const hash = (text: string) => createHash("sha256").update(text).digest("hex");
afterEach(async () => {
  await Promise.all(temporary.splice(0).map(root => fs.rm(root, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 })));
});
function revision(commit: string, files: { source: string; sha256: string }[]) {
  return commit + "+" + hash(JSON.stringify(files.map(({ source, sha256 }) => ({ source, sha256 }))
    .sort((a, b) => a.source.localeCompare(b.source)))).slice(0, 16);
}
async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "sdk-baseline-upgrade-")); temporary.push(root);
  const checkout = path.join(root, "upstream"), installed = path.join(root, "sdk");
  for (const dir of ["upstream/server/src", "upstream/server/schemas", "sdk/scripts", "sdk/src/core", "sdk/resources/main-runtime"])
    await fs.mkdir(path.join(root, dir), { recursive: true });
  const git = (...args: string[]) => execFileSync("git", ["-C", checkout, ...args], { encoding: "utf8", windowsHide: true });
  git("init", "-q"); git("config", "user.name", "Upgrade fixture"); git("config", "user.email", "fixture@example.invalid");
  git("config", "core.autocrlf", "false");
  const original = "export const version = 1;\n", obsolete = "export const obsolete = true;\n";
  await fs.writeFile(path.join(checkout, "server/src/entry.ts"), original);
  await fs.writeFile(path.join(checkout, "server/src/obsolete.ts"), obsolete);
  for (const name of ["main-decision.json", "worker-result.json"])
    await fs.writeFile(path.join(checkout, "server/schemas", name), "{}\n");
  git("add", "."); git("commit", "-qm", "Old pinned runtime"); const oldCommit = git("rev-parse", "HEAD").trim();
  const next = "import './new.js';\nexport const version = 2;\n";
  await fs.writeFile(path.join(checkout, "server/src/entry.ts"), next);
  await fs.writeFile(path.join(checkout, "server/src/new.ts"), "export const added = true;\n");
  await fs.unlink(path.join(checkout, "server/src/obsolete.ts"));
  git("add", "-A"); git("commit", "-qm", "New pinned runtime"); const newCommit = git("rev-parse", "HEAD").trim();
  // Exercise the production upgrade code against two real Git commits. Only
  // source pins and closure declarations are fixture-sized; no control flow is replaced.
  const production = await fs.readFile(path.join(sdk, "scripts/sync-main-runtime.mjs"), "utf8");
  const script = production.replace(/const sourceCommit = "[a-f0-9]{40}";/, `const sourceCommit = "${newCommit}";`)
    .replace(/const roots = \[[\s\S]*?\n\];/, 'const roots = ["entry.ts"];')
    .replace(/const helperResources = \[[\s\S]*?\n\];/, "const helperResources = [];")
    .replace(/const regressionTests = \[[\s\S]*?\n\];/, "const regressionTests = [];");
  await fs.writeFile(path.join(installed, "scripts/sync-main-runtime.mjs"), script);
  await fs.copyFile(path.join(sdk, "scripts/main-runtime-fixes.mjs"), path.join(installed, "scripts/main-runtime-fixes.mjs"));
  for (const name of ["scienceevolve-branding.mjs", "scienceevolve-runtime-pins.mjs", "runtime-source-snapshot.mjs"]) {
    await fs.copyFile(path.join(sdk, "scripts", name), path.join(installed, "scripts", name));
  }
  const index = JSON.stringify({ schemaVersion: 1, sourceCommit: newCommit, fixes: [] });
  await fs.writeFile(path.join(installed, "resources/main-runtime/shared-fixes.json"), index);
  const files = [{ name: "entry.ts", content: original }, { name: "obsolete.ts", content: obsolete }].map(({ name, content }) => ({
    source: `server/src/${name}`, target: `src/core/${name}`, sourceSha256: hash(content), sharedFixes: [], sha256: hash(content)
  }));
  for (const [i, content] of [original, obsolete].entries()) await fs.writeFile(path.join(installed, files[i].target), content);
  const manifest = { schemaVersion: 2, sourceCommit: oldCommit, roots: ["entry.ts"], sharedFixesSha256: hash(index),
    runtimeRevision: revision(oldCommit, files), files };
  const manifestFile = path.join(installed, "resources/main-runtime/manifest.json");
  const save = () => fs.writeFile(manifestFile, JSON.stringify(manifest)); await save();
  const run = (...args: string[]) => {
    const result = spawnSync(process.execPath, [path.join(installed, "scripts/sync-main-runtime.mjs"), ...args], { encoding: "utf8", windowsHide: true });
    return { status: result.status, output: result.stdout + result.stderr };
  };
  const upgrade = () => run("--source", checkout, "--upgrade");
  const read = (file: string) => fs.readFile(path.join(installed, file), "utf8");
  return { installed, checkout, manifest, manifestFile, oldCommit, newCommit, original, obsolete, next, save, run, upgrade, read };
}

describe("main runtime baseline upgrade preserves verified installed sources", () => {
  it.each(["sharedFixes", "brandingEdits", "derivedPinEdits"])("rejects %s in an exact shared core even when content hashes are unchanged", async field => {
    const f = await fixture();
    const upgraded = f.upgrade(); expect(upgraded, upgraded.output).toMatchObject({ status: 0 });
    const manifest = JSON.parse(await fs.readFile(f.manifestFile, "utf8"));
    const entry = manifest.files.find((entry: { source: string }) => entry.source === "server/src/entry.ts");
    entry[field] = [{ before: "fixture-before", after: "fixture-after" }];
    await fs.writeFile(f.manifestFile, JSON.stringify(manifest));
    const result = f.run("--check");
    expect(result.status).not.toBe(0);
    expect(result.output).toContain("Shared core contains a source transformation");
    expect(await f.read("src/core/entry.ts")).toBe(f.next);
  });
  it("rejects removal of the exact shared-core identity policy", async () => {
    const f = await fixture(); expect(f.upgrade().status).toBe(0);
    const manifest = JSON.parse(await fs.readFile(f.manifestFile, "utf8"));
    delete manifest.coreIdentity;
    await fs.writeFile(f.manifestFile, JSON.stringify(manifest));
    expect(f.run("--check").output).toContain("Missing exact shared-core identity policy");
  });

  it("captures uncommitted source and new dependencies explicitly, verifies live parity and replays without the checkout", async () => {
    const f = await fixture();
    const indexFile = path.join(f.installed, "resources/main-runtime/shared-fixes.json");
    const index = JSON.parse(await fs.readFile(indexFile, "utf8"));
    index.sourceSnapshotKind = "working-tree";
    await fs.writeFile(indexFile, JSON.stringify(index));
    const current = "import './new.js';\nimport './uncommitted.js';\nexport const version = 3;\n";
    await fs.writeFile(path.join(f.checkout, "server/src/entry.ts"), current);
    await fs.writeFile(path.join(f.checkout, "server/src/uncommitted.ts"), "export const local = true;\n");
    const upgrade = f.run("--source", f.checkout, "--worktree", "--upgrade");
    expect(upgrade, upgrade.output).toMatchObject({ status: 0 });
    expect(await f.read("src/core/entry.ts")).toBe(current);
    expect(await f.read("src/core/uncommitted.ts")).toContain("local = true");
    const manifest = JSON.parse(await fs.readFile(f.manifestFile, "utf8"));
    expect(manifest).toMatchObject({ sourceSnapshotKind: "working-tree", sourceCommit: f.newCommit });
    const snapshot = recordSnapshot(f.checkout, manifest);
    await fs.mkdir(path.join(f.installed, "tests/fixtures"), { recursive: true });
    await fs.writeFile(path.join(f.installed, "tests/fixtures/main-runtime-upstream.json.gz"), snapshot);
    expect(f.run("--check-source", "--source", f.checkout).status).toBe(0);
    await fs.writeFile(path.join(f.checkout, "server/src/entry.ts"), "changed after capture\n");
    expect(f.run("--check-source", "--source", f.checkout).output).toContain("Current main source drift");
    expect(() => recordSnapshot(f.checkout, manifest)).toThrow("snapshot drift");
    await fs.rm(f.checkout, { recursive: true, force: true });
    const replay = f.run("--verify-generation");
    expect(replay, replay.output).toMatchObject({ status: 0 });
  });

  it("regenerates from pinned original blobs after the historical checkout is removed", async () => {
    const f = await fixture();
    const upgrade = f.upgrade(); expect(upgrade, upgrade.output).toMatchObject({ status: 0 });
    const manifestBytes = await fs.readFile(f.manifestFile, "utf8");
    const snapshot = recordSnapshot(f.checkout, JSON.parse(manifestBytes));
    await fs.mkdir(path.join(f.installed, "tests/fixtures"), { recursive: true });
    await fs.writeFile(path.join(f.installed, "tests/fixtures/main-runtime-upstream.json.gz"), snapshot);
    await fs.rm(f.checkout, { recursive: true, force: true, maxRetries: 5 });
    const verify = f.run("--verify-generation");
    expect(verify, verify.output).toMatchObject({ status: 0 });
    expect(verify.output).toContain("Pinned upstream regeneration verified without writing");
    expect(f.run("--verify-generation", "--upgrade").status).not.toBe(0);
    await fs.writeFile(path.join(f.installed, "src/core/entry.ts"), "changed output\n");
    expect(f.run("--verify-generation").status).not.toBe(0);
    expect(await fs.readFile(f.manifestFile, "utf8")).toBe(manifestBytes);
    expect(await f.read("src/core/entry.ts")).toBe("changed output\n");
  });

  it("requires explicit upgrade, then replaces verified sources and deletes only verified obsolete files", async () => {
    const f = await fixture();
    expect(f.run("--source", f.checkout).status).not.toBe(0);
    expect(await f.read("src/core/entry.ts")).toBe(f.original);
    await fs.writeFile(path.join(f.installed, "notes.txt"), "user notes");
    const result = f.upgrade(); expect(result, result.output).toMatchObject({ status: 0 });
    expect(await f.read("src/core/entry.ts")).toBe(f.next);
    await expect(f.read("src/core/obsolete.ts")).rejects.toMatchObject({ code: "ENOENT" });
    expect(await f.read("notes.txt")).toBe("user notes");
    expect(JSON.parse(await fs.readFile(f.manifestFile, "utf8")).sourceCommit).toBe(f.newCommit);
    expect(f.run("--check").status).toBe(0);
  }, 30_000);

  it.each(["entry.ts", "obsolete.ts"])("refuses dirty %s before overwriting or deleting any old file", async file => {
    const f = await fixture(), before = await fs.readFile(f.manifestFile, "utf8");
    await fs.writeFile(path.join(f.installed, "src/core", file), "local edits");
    const result = f.upgrade(); expect(result.status).not.toBe(0); expect(result.output).toContain("Previous runtime source drift");
    expect(await f.read(`src/core/${file}`)).toBe("local edits");
    expect(await f.read(`src/core/${file === "entry.ts" ? "obsolete.ts" : "entry.ts"}`)).toBe(file === "entry.ts" ? f.obsolete : f.original);
    expect(await fs.readFile(f.manifestFile, "utf8")).toBe(before);
  });

  it.each(["revision", "schema", "upstream hash"])("rejects invalid old manifest %s before writing", async fault => {
    const f = await fixture();
    if (fault === "revision") f.manifest.runtimeRevision = "invalid";
    if (fault === "schema") f.manifest.schemaVersion = 1;
    if (fault === "upstream hash") f.manifest.files[1].sourceSha256 = "0".repeat(64);
    await f.save(); const before = await fs.readFile(f.manifestFile, "utf8");
    const result = f.upgrade(); expect(result.status, result.output).not.toBe(0);
    expect(await f.read("src/core/entry.ts")).toBe(f.original);
    expect(await f.read("src/core/obsolete.ts")).toBe(f.obsolete);
    expect(await fs.readFile(f.manifestFile, "utf8")).toBe(before);
  });

  it.each(["new.ts", "unrelated.ts"])("rejects unmanifested core %s before mutation", async file => {
    const f = await fixture(), before = await fs.readFile(f.manifestFile, "utf8");
    await fs.writeFile(path.join(f.installed, "src/core", file), "unregistered user code");
    expect(f.upgrade().status).not.toBe(0);
    expect(await f.read(`src/core/${file}`)).toBe("unregistered user code");
    expect(await f.read("src/core/entry.ts")).toBe(f.original);
    expect(await f.read("src/core/obsolete.ts")).toBe(f.obsolete);
    expect(await fs.readFile(f.manifestFile, "utf8")).toBe(before);
  });

  it.each(["mapping", "traversal", "duplicate"])("rejects invalid old source/target %s before mutation", async fault => {
    const f = await fixture();
    if (fault === "mapping") f.manifest.files[0].target = "src/core/obsolete.ts";
    if (fault === "traversal") f.manifest.files[0].target = "src/core/../core/entry.ts";
    if (fault === "duplicate") {
      f.manifest.files.push({ ...f.manifest.files[0] });
      f.manifest.runtimeRevision = revision(f.oldCommit, f.manifest.files);
    }
    await f.save(); const before = await fs.readFile(f.manifestFile, "utf8");
    expect(f.upgrade().status).not.toBe(0);
    expect(await f.read("src/core/entry.ts")).toBe(f.original);
    expect(await f.read("src/core/obsolete.ts")).toBe(f.obsolete);
    expect(await fs.readFile(f.manifestFile, "utf8")).toBe(before);
  });

  it("audits new schema collisions before writing any upgraded source", async () => {
    const f = await fixture(), before = await fs.readFile(f.manifestFile, "utf8");
    const collision = "resources/main-runtime/schemas/main-decision.json";
    await fs.mkdir(path.dirname(path.join(f.installed, collision)), { recursive: true });
    await fs.writeFile(path.join(f.installed, collision), "user schema");
    const result = f.upgrade();
    expect(result.status).not.toBe(0); expect(result.output).toContain("unmanifested file");
    expect(await f.read(collision)).toBe("user schema");
    expect(await f.read("src/core/entry.ts")).toBe(f.original);
    expect(await f.read("src/core/obsolete.ts")).toBe(f.obsolete);
    expect(await fs.readFile(f.manifestFile, "utf8")).toBe(before);
  });
});
