import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { brandingDigest, brandingVersion } from "../scripts/scienceevolve-branding.mjs";
import { runtimePinsDigest, runtimePinsVersion } from "../scripts/scienceevolve-runtime-pins.mjs";

const sdk = fileURLToPath(new URL("../", import.meta.url));
const production = JSON.parse(await fs.readFile(path.join(sdk, "resources/main-runtime/manifest.json"), "utf8"));
const temporary: string[] = [];
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const revision = files => production.sourceCommit + "+" + hash(JSON.stringify(files.map(({ source, sha256 }) => ({ source, sha256 }))
  .sort((a, b) => a.source.localeCompare(b.source)))).slice(0, 16);
afterEach(async () => {
  await Promise.all(temporary.splice(0).map(root => fs.rm(root, { recursive: true, force: true, maxRetries: 5 })));
});
async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "sdk-exact-source-policy-")); temporary.push(root);
  for (const dir of ["scripts", "resources/main-runtime", "src/core"]) await fs.mkdir(path.join(root, dir), { recursive: true });
  for (const name of ["sync-main-runtime.mjs", "main-runtime-fixes.mjs", "scienceevolve-branding.mjs", "scienceevolve-runtime-pins.mjs"])
    await fs.copyFile(path.join(sdk, "scripts", name), path.join(root, "scripts", name));
  const content = "export const original = true;\n";
  const entry = { source: "server/src/original.ts", target: "src/core/original.ts", sourceSha256: hash(content),
    sha256: hash(content), sharedFixes: [], brandingEdits: [], derivedPinEdits: [] };
  const index = { schemaVersion: 1, sourceCommit: production.sourceCommit, fixes: [], hostSources: [], supplementalSources: [] };
  const manifest = { schemaVersion: 2, coreIdentity: "exact-source-v1", sourceCommit: production.sourceCommit,
    roots: production.roots, brandingVersion, brandingSha256: brandingDigest,
    runtimePins: { version: runtimePinsVersion, moduleSha256: runtimePinsDigest, inputs: [], pins: [] },
    sharedFixesSha256: hash(JSON.stringify(index)), runtimeRevision: revision([entry]), files: [entry] };
  const indexFile = path.join(root, "resources/main-runtime/shared-fixes.json");
  const manifestFile = path.join(root, "resources/main-runtime/manifest.json");
  await fs.writeFile(indexFile, JSON.stringify(index)); await fs.writeFile(manifestFile, JSON.stringify(manifest));
  await fs.writeFile(path.join(root, entry.target), content);
  const run = (...args: string[]) => {
    const result = spawnSync(process.execPath, [path.join(root, "scripts/sync-main-runtime.mjs"), ...args], { encoding: "utf8" });
    return { status: result.status, output: result.stdout + result.stderr };
  };
  const save = () => { manifest.runtimeRevision = revision(manifest.files); return fs.writeFile(manifestFile, JSON.stringify(manifest)); };
  return { root, content, entry, index, manifest, indexFile, manifestFile, run, save };
}

describe("one main source policy replaces supplemental and patched core imports", () => {
  it("checks an exact source independently without requiring the main checkout", async () => {
    const f = await fixture(); expect(f.run("--check")).toMatchObject({ status: 0 });
  });
  it.each(["--refresh-host-extensions", "--refresh-branding", "--refresh-runtime-pins"])("rejects the retired %s operation without writing", async flag => {
    const f = await fixture(), before = await fs.readFile(f.manifestFile, "utf8");
    expect(f.run(flag).output).toContain("Shared core transformations are retired");
    expect(await fs.readFile(f.manifestFile, "utf8")).toBe(before);
    expect(await fs.readFile(path.join(f.root, f.entry.target), "utf8")).toBe(f.content);
  });
  it.each(["fixes", "hostSources", "supplementalSources"])("rejects nonempty %s even before an extraction or check", async field => {
    const f = await fixture(), before = await fs.readFile(f.manifestFile, "utf8");
    Object.assign(f.index, { [field]: field === "fixes" ? [{ id: "fixture-patch", source: f.entry.source, hostOnly: true,
      replacements: [{ before: "true", after: "false" }] }] : field === "hostSources" ? ["harness-runtime/adapters/hermes-fixture.ts"]
      : [{ source: "server/src/foreign.ts", upstreamCommit: "a".repeat(40), sourceSha256: hash("foreign") }] });
    await fs.writeFile(f.indexFile, JSON.stringify(f.index));
    for (const args of [["--check"], ["--source", path.join(f.root, "missing-checkout")]]) {
      const result = f.run(...args); expect(result.status).not.toBe(0);
      expect(result.output).toContain("Shared core must use one exact main source");
    }
    expect(await fs.readFile(f.manifestFile, "utf8")).toBe(before);
    expect(await fs.readFile(path.join(f.root, f.entry.target), "utf8")).toBe(f.content);
  });
  it("rejects unregistered core files without silently adopting them", async () => {
    const f = await fixture(), before = await fs.readFile(f.manifestFile, "utf8");
    await fs.writeFile(path.join(f.root, "src/core/foreign.ts"), "foreign core");
    expect(f.run("--check").output).toContain("Unmanifested runtime file");
    expect(await fs.readFile(f.manifestFile, "utf8")).toBe(before);
  });
  it("rejects source drift without rewriting the source or manifest", async () => {
    const f = await fixture(), before = await fs.readFile(f.manifestFile, "utf8");
    await fs.writeFile(path.join(f.root, f.entry.target), "local edits");
    expect(f.run("--check").output).toContain("Main source drift");
    expect(await fs.readFile(path.join(f.root, f.entry.target), "utf8")).toBe("local edits");
    expect(await fs.readFile(f.manifestFile, "utf8")).toBe(before);
  });
  it("rejects a foreign upstream commit attached to an otherwise valid common file", async () => {
    const f = await fixture(); Object.assign(f.entry, { upstreamCommit: "a".repeat(40) }); await f.save();
    expect(f.run("--check").output).toContain("Unexpected supplemental source identity");
  });
  it.each(["import 'express';\n", "import router from 'express/lib/router.js';\n"])("rejects a product HTTP dependency even with self-consistent hashes: %s", async content => {
    const f = await fixture(); await fs.writeFile(path.join(f.root, f.entry.target), content);
    f.entry.sourceSha256 = f.entry.sha256 = hash(content); await f.save();
    const result = f.run("--check"); expect(result.status).not.toBe(0); expect(result.output).toMatch(/Express/i);
  });
  it("rejects a Web entrypoint in the core even with self-consistent hashes", async () => {
    const f = await fixture(); f.entry.source = "server/src/app.ts"; f.entry.target = "src/core/app.ts";
    await fs.writeFile(path.join(f.root, f.entry.target), f.content); await f.save();
    expect(f.run("--check").output).toContain("Web/process entrypoint in runtime closure");
  });
});
