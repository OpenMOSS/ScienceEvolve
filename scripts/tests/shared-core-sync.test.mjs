import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { initializePair, planSync, applySync } from "../sync-shared-core.mjs";

const temporary = [];
afterEach(() => { for (const root of temporary.splice(0)) fs.rmSync(root, { recursive: true, force: true }); });
const source = name => ({ id: "server/src/" + name, kind: "source", mainPath: "server/src/" + name, sdkPath: "sdk/src/core/" + name });
const testEntry = { id: "server/tests/counter.test.ts", kind: "test", mainPath: "server/tests/counter.test.ts", sdkPath: "sdk/tests/main-core/counter.test.ts" };
const text = Array.from({ length: 24 }, (_, i) => `export const value${i} = ${i};`).join("\n") + "\n";
function fixture(names = ["main", "sdk"]) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "core-sync-test-")); temporary.push(root);
  const pair = { mainRoot: path.join(root, names[0]), sdkRoot: path.join(root, names[1]) };
  fs.mkdirSync(pair.mainRoot); fs.mkdirSync(pair.sdkRoot);
  const put = (side, relative, bytes) => { const target = path.join(pair[side + "Root"], relative); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, bytes); };
  const get = (side, relative) => fs.readFileSync(path.join(pair[side + "Root"], relative), "utf8");
  const remove = (side, relative) => fs.unlinkSync(path.join(pair[side + "Root"], relative));
  const entries = [source("counter.ts"), source("unused.ts"), testEntry];
  for (const side of ["main", "sdk"]) {
    put(side, source("counter.ts")[side + "Path"], text); put(side, source("unused.ts")[side + "Path"], "export const unused = true;\n");
    put(side, testEntry[side + "Path"], `import { value0 } from "${side === "main" ? "../src" : "../../src/core"}/counter.js";\n// ${side} fixture binding\n\n\n\n\nexpect(value0).toBe(0);\n`);
  }
  initializePair(pair, entries);
  return { pair, put, get, remove, root, entries };
}
const baseline = f => f.get("main", "shared-core/manifest.json");
function synchronized(f) {
  const plan = planSync(f.pair);
  assert.equal(plan.conflicts.length, 0); assert.equal(plan.files.filter(file => file.changed).length, 0);
  assert.equal(f.get("main", "shared-core/manifest.json"), f.get("sdk", "shared-core/manifest.json"));
  for (const file of plan.files.filter(file => file.entry.kind !== "test")) assert.deepEqual(file.main, file.sdk);
}

describe("bidirectional actual shared-core synchronization", () => {
  for (const [label, names, explicitPeer] of [
    ["public repository names", ["ScienceEvolve-server", "ScienceEvolve"], false],
    ["existing local directory names", ["ScienceEvolve", "ScienceEvolve-SDK"], false],
    ["explicit peer paths", ["custom-main", "custom-sdk"], true]
  ]) it("resolves both CLI directions with " + label, () => {
    const f = fixture(names);
    const script = fs.readFileSync(new URL("../sync-shared-core.mjs", import.meta.url));
    for (const side of ["main", "sdk"]) f.put(side, "scripts/sync-shared-core.mjs", script);
    for (const side of ["main", "sdk"]) {
      const own = f.pair[side + "Root"], peer = f.pair[side === "main" ? "sdkRoot" : "mainRoot"];
      const output = execFileSync(process.execPath, [
        fs.realpathSync(path.join(own, "scripts/sync-shared-core.mjs")), "--check",
        ...(explicitPeer ? ["--peer", peer] : [])
      ], { encoding: "utf8", cwd: f.root });
      assert.match(output, /Actual shared core and its synchronization baseline match/);
    }
  });
  it("checkpoints equal core and explicitly different test layouts", () => { const f = fixture(); synchronized(f); });
  it("rejects an initial divergent core before writing a baseline", () => {
    const f = fixture(), before = baseline(f); f.put("sdk", "sdk/src/core/counter.ts", "divergent\n");
    assert.throws(() => initializePair(f.pair, f.entries), /Actual core differs/); assert.equal(baseline(f), before);
  });
  it("moves main fixes and shared test edits into SDK without copying its fixture binding", () => {
    const f = fixture(); f.put("main", "server/src/counter.ts", text.replace("value0 = 0", "value0 = 42"));
    f.put("main", testEntry.mainPath, f.get("main", testEntry.mainPath).replace("toBe(0)", "toBe(42)"));
    applySync(planSync(f.pair, { from: "main" })); synchronized(f);
    assert.match(f.get("sdk", "sdk/src/core/counter.ts"), /value0 = 42/);
    assert.match(f.get("sdk", testEntry.sdkPath), /sdk fixture binding/);
    assert.match(f.get("sdk", testEntry.sdkPath), /\.\.\/\.\.\/src\/core\/counter\.js/);
    assert.match(f.get("sdk", testEntry.sdkPath), /toBe\(42\)/);
  });
  it("returns SDK fixes and shared test edits to main while retaining main's layout", () => {
    const f = fixture(); f.put("sdk", "sdk/src/core/counter.ts", text.replace("value0 = 0", "value0 = 7"));
    f.put("sdk", testEntry.sdkPath, f.get("sdk", testEntry.sdkPath).replace("toBe(0)", "toBe(7)"));
    applySync(planSync(f.pair, { from: "sdk" })); synchronized(f);
    assert.match(f.get("main", "server/src/counter.ts"), /value0 = 7/);
    assert.match(f.get("main", testEntry.mainPath), /main fixture binding/);
    assert.match(f.get("main", testEntry.mainPath), /"\.\.\/src\/counter\.js"/);
    assert.match(f.get("main", testEntry.mainPath), /toBe\(7\)/);
  });
  it("rejects the wrong direction instead of discarding peer-only work", () => {
    const f = fixture(), before = baseline(f); f.put("sdk", "sdk/src/core/counter.ts", text + "// SDK fix\n");
    const plan = planSync(f.pair, { from: "main" }); assert.match(plan.conflicts[0].reason, /peer-only/);
    assert.throws(() => applySync(plan), /no files changed/); assert.equal(baseline(f), before);
    assert.equal(f.get("main", "server/src/counter.ts"), text);
  });
  it("merges nonoverlapping work from both copies and writes the same result to both", () => {
    const f = fixture(); f.put("main", "server/src/counter.ts", text.replace("value0 = 0", "value0 = 99"));
    f.put("sdk", "sdk/src/core/counter.ts", text.replace("value23 = 23", "value23 = 88"));
    applySync(planSync(f.pair)); synchronized(f);
    assert.match(f.get("main", "server/src/counter.ts"), /value0 = 99/); assert.match(f.get("main", "server/src/counter.ts"), /value23 = 88/);
  });
  it("reports an overlap before touching even unrelated mergeable files", () => {
    const f = fixture(), before = baseline(f);
    f.put("main", "server/src/counter.ts", text.replace("value0 = 0", "value0 = 1"));
    f.put("sdk", "sdk/src/core/counter.ts", text.replace("value0 = 0", "value0 = 2"));
    f.put("main", "server/src/unused.ts", "export const unused = false;\n");
    const plan = planSync(f.pair); assert.equal(plan.conflicts.length, 1); assert.match(plan.conflicts[0].reason, /text conflict/);
    assert.throws(() => applySync(plan), /no files changed/); assert.equal(baseline(f), before);
    assert.equal(f.get("sdk", "sdk/src/core/unused.ts"), "export const unused = true;\n");
    assert.match(f.get("main", "server/src/counter.ts"), /value0 = 1/); assert.match(f.get("sdk", "sdk/src/core/counter.ts"), /value0 = 2/);
  });
  it("propagates source and test deletion without mistaking fixture ports for user changes", () => {
    const f = fixture(); f.remove("sdk", "sdk/src/core/unused.ts"); f.remove("sdk", testEntry.sdkPath);
    applySync(planSync(f.pair, { from: "sdk" })); synchronized(f);
    assert.equal(fs.existsSync(path.join(f.pair.mainRoot, "server/src/unused.ts")), false);
    assert.equal(fs.existsSync(path.join(f.pair.mainRoot, testEntry.mainPath)), false);
  });
  it("keeps a delete/modify conflict and both baselines intact", () => {
    const f = fixture(), before = baseline(f); f.remove("main", "server/src/unused.ts");
    f.put("sdk", "sdk/src/core/unused.ts", "export const changed = true;\n");
    const plan = planSync(f.pair); assert.match(plan.conflicts[0].reason, /delete\/modify/);
    assert.throws(() => applySync(plan), /no files changed/); assert.equal(baseline(f), before);
    assert.match(f.get("sdk", "sdk/src/core/unused.ts"), /changed/);
  });
  it("discovers a new main dependency and transfers its actual file", () => {
    const f = fixture(); f.put("main", "server/src/counter.ts", 'import "./nested/new.js";\n' + text);
    f.put("main", "server/src/nested/new.ts", "export const added = true;\n");
    applySync(planSync(f.pair, { from: "main" })); synchronized(f);
    assert.equal(f.get("sdk", "sdk/src/core/nested/new.ts"), "export const added = true;\n");
  });
  it("discovers a new SDK core module and new shared test", () => {
    const f = fixture(); f.put("sdk", "sdk/src/core/extra.ts", "export const extra = true;\n");
    f.put("sdk", "sdk/tests/main-core/extra.test.ts", 'import { extra } from "../../src/core/extra.js";\nexpect(extra).toBe(true);\n');
    applySync(planSync(f.pair, { from: "sdk" })); synchronized(f);
    assert.match(f.get("main", "server/tests/extra.test.ts"), /"\.\.\/src\/extra\.js"/);
  });
  it("accepts an explicitly selected new main shared test", () => {
    const f = fixture(); f.put("main", "server/tests/extra.test.ts", 'import { value0 } from "../src/counter.js";\n');
    applySync(planSync(f.pair, { from: "main", include: ["tests/extra.test.ts"] })); synchronized(f);
    assert.match(f.get("sdk", "sdk/tests/main-core/extra.test.ts"), /\.\.\/\.\.\/src\/core/);
  });
  it("rejects missing dependencies and direct imports of product entrypoints", () => {
    const f = fixture(), before = baseline(f); f.put("main", "server/src/counter.ts", 'import "./missing.js";\n');
    assert.throws(() => planSync(f.pair), /Missing shared-core dependency/);
    f.put("main", "server/src/app.ts", "export const product = true;\n");
    f.put("main", "server/src/counter.ts", 'import "./app.js";\n');
    assert.throws(() => planSync(f.pair), /Invalid shared-core mapping/); assert.equal(baseline(f), before);
  });
  it("does not import SDK API or product files outside the shared directories", () => {
    const f = fixture(); f.put("sdk", "sdk/src/host/feature.ts", "SDK-only\n"); f.put("main", "web/product.ts", "Web-only\n");
    assert.equal(planSync(f.pair).files.some(file => file.entry.id.includes("feature")), false); synchronized(f);
    assert.equal(f.get("sdk", "sdk/src/host/feature.ts"), "SDK-only\n");
  });
  it("preserves concurrent edits made after the plan was computed", () => {
    const f = fixture(), before = baseline(f); f.put("main", "server/src/counter.ts", text + "// planned\n");
    const plan = planSync(f.pair); f.put("sdk", "sdk/src/core/counter.ts", text + "// subsequent user edit\n");
    assert.throws(() => applySync(plan), /Concurrent edit/); assert.equal(baseline(f), before);
    assert.match(f.get("sdk", "sdk/src/core/counter.ts"), /subsequent user edit/);
  });
  it("rejects a tampered mapping without reading or modifying an outside file", () => {
    const f = fixture(), outside = path.join(f.root, "outside.txt"); fs.writeFileSync(outside, "keep");
    const manifest = JSON.parse(baseline(f)); manifest.files[0].mainPath = "../outside.txt";
    for (const side of ["main", "sdk"]) f.put(side, "shared-core/manifest.json", JSON.stringify(manifest));
    assert.throws(() => planSync(f.pair), /mapping drift/); assert.equal(fs.readFileSync(outside, "utf8"), "keep");
  });
  it("rejects symlinked shared directories before writing through them", t => {
    const f = fixture(), outside = path.join(f.root, "outside"); fs.mkdirSync(outside); fs.writeFileSync(path.join(outside, "keep.ts"), "keep");
    try { fs.symlinkSync(outside, path.join(f.pair.sdkRoot, "sdk/src/core/escape"), "dir"); }
    catch (error) { if (process.platform === "win32" && ["EPERM", "EACCES"].includes(error.code)) return t.skip("symlink privilege unavailable"); throw error; }
    assert.throws(() => planSync(f.pair), /contains a link/); assert.equal(fs.readFileSync(path.join(outside, "keep.ts"), "utf8"), "keep");
  });
  it("rolls back an applied core copy if SDK capture fails, retaining the original SDK edit", () => {
    const f = fixture(), before = baseline(f);
    f.put("sdk", "sdk/scripts/refresh-shared-core.mjs", 'import fs from "node:fs";\nfs.mkdirSync("sdk/resources/main-runtime", { recursive: true });\nfs.writeFileSync("sdk/resources/main-runtime/shared-fixes.json", "partial metadata");\nprocess.exit(3);\n');
    f.put("sdk", "sdk/src/core/counter.ts", text + "// SDK fix to retain\n");
    assert.throws(() => applySync(planSync(f.pair)), /SDK metadata refresh failed/);
    assert.equal(f.get("main", "server/src/counter.ts"), text); assert.match(f.get("sdk", "sdk/src/core/counter.ts"), /SDK fix to retain/);
    assert.equal(fs.existsSync(path.join(f.pair.sdkRoot, "sdk/resources/main-runtime/shared-fixes.json")), false);
    assert.equal(baseline(f), before); assert.equal(fs.existsSync(path.join(f.pair.mainRoot, "shared-core/.sync.lock")), false);
  });
});
