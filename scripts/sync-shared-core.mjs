#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { createHash, randomUUID } from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const MANIFEST = "shared-core/manifest.json";
const BASELINE = "shared-core/baseline.json.gz";
const SCRIPT = "scripts/sync-shared-core.mjs";
const SHARED_TOOLS = [SCRIPT, "scripts/tests/shared-core-sync.test.mjs"];
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const portable = value => value.split(path.sep).join("/");
const same = (a, b) => a === null ? b === null : b !== null && a.equals(b);
const exists = file => fs.existsSync(file);
const safeRelative = value => typeof value === "string" && value.length > 0 &&
  !value.includes("\\") && !value.includes("\0") && !path.posix.isAbsolute(value) &&
  path.posix.normalize(value) === value && !value.split("/").includes("..");

function assertEntry(entry) {
  const { id, kind, mainPath, sdkPath } = entry;
  if (![id, mainPath, sdkPath].every(safeRelative)) throw new Error("Unsafe shared-core path");
  const expected = kind === "source" ? ["server/src/", "sdk/src/core/"]
    : kind === "schema" ? ["server/schemas/", "sdk/resources/main-runtime/schemas/"]
      : kind === "test" ? ["server/tests/", "sdk/tests/main-core/"] : undefined;
  if (kind === "tool" && SHARED_TOOLS.includes(id) && mainPath === id && sdkPath === id) return;
  if (!expected || id !== mainPath || !mainPath.startsWith(expected[0]) || !sdkPath.startsWith(expected[1]) ||
    mainPath.slice(expected[0].length) !== sdkPath.slice(expected[1].length) ||
    ["server/src/app.ts", "server/src/index.ts", "server/src/project-explainer.ts", "server/src/explainer-assistant.ts",
      "server/src/explainer-assistant-mcp.ts", "server/src/saved-research-tasks.ts", "server/src/saved-task-launcher.ts"].includes(mainPath))
    throw new Error("Invalid shared-core mapping: " + id);
}

/** Reject links in every parent before any read, directory creation or replacement. */
function fileAt(root, relative, createParents = false) {
  if (!safeRelative(relative)) throw new Error("Unsafe shared-core path");
  let current = root;
  for (const [index, part] of relative.split("/").entries()) {
    current = path.join(current, part);
    const last = index === relative.split("/").length - 1;
    let stat;
    try { stat = fs.lstatSync(current); }
    catch (error) {
      if (error.code !== "ENOENT") throw error;
      if (!last && createParents) { fs.mkdirSync(current); stat = fs.lstatSync(current); }
      else if (!last) return path.join(root, relative);
    }
    if (stat && (stat.isSymbolicLink() || (last ? !stat.isFile() : !stat.isDirectory())))
      throw new Error("Shared-core path traverses a link or wrong file type: " + relative);
  }
  return current;
}

function read(root, relative) {
  const file = fileAt(root, relative);
  try {
    const stat = fs.lstatSync(file);
    if (stat.size > 32 * 1024 * 1024 || stat.nlink !== 1) throw new Error("Invalid shared-core file: " + relative);
    return fs.readFileSync(file);
  } catch (error) { if (error.code === "ENOENT") return null; throw error; }
}

function write(root, relative, bytes) {
  const file = fileAt(root, relative, bytes !== null);
  if (bytes === null) { if (exists(file)) fs.unlinkSync(file); return; }
  const mode = exists(file) ? fs.statSync(file).mode & 0o777 : 0o644;
  const temporary = file + ".sync-" + randomUUID();
  try { fs.writeFileSync(temporary, bytes, { flag: "wx", mode }); fs.renameSync(temporary, file); }
  finally { if (exists(temporary)) fs.unlinkSync(temporary); }
}

function roots(input) {
  const mainRoot = fs.realpathSync(input.mainRoot), sdkRoot = fs.realpathSync(input.sdkRoot);
  if (mainRoot === sdkRoot) throw new Error("main and SDK must be separate directories");
  return { mainRoot, sdkRoot };
}

function list(root, relative) {
  const directory = fileAt(root, relative + "/.directory-check");
  const base = path.dirname(directory);
  if (!exists(base)) return [];
  const result = [];
  for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
    const child = relative + "/" + entry.name;
    if (entry.isSymbolicLink()) throw new Error("Shared-core tree contains a link: " + child);
    if (entry.isDirectory()) result.push(...list(root, child));
    else if (entry.isFile()) result.push(child);
    else throw new Error("Unexpected shared-core file type: " + child);
  }
  return result;
}

function entriesFromSdk(sdkRoot) {
  const runtime = JSON.parse(read(sdkRoot, "sdk/resources/main-runtime/manifest.json"));
  if (runtime.coreIdentity !== "exact-source-v1") throw new Error("Initialize only after the exact shared-core migration");
  const entries = runtime.files.filter(entry => entry.source.startsWith("server/")).map(entry => {
    const kind = entry.source.startsWith("server/src/") ? "source"
      : entry.source.startsWith("server/schemas/") ? "schema" : "test";
    return { id: entry.source, kind, mainPath: entry.source, sdkPath: "sdk/" + entry.target };
  });
  for (const file of SHARED_TOOLS) if (read(sdkRoot, file))
    entries.push({ id: file, kind: "tool", mainPath: file, sdkPath: file });
  return entries;
}

function encodeBaseline(pair, entries) {
  const files = entries.map(entry => {
    assertEntry(entry);
    const main = read(pair.mainRoot, entry.mainPath), sdk = read(pair.sdkRoot, entry.sdkPath);
    if (main === null || sdk === null) throw new Error("Cannot checkpoint a missing shared file: " + entry.id);
    if (entry.kind !== "test" && !same(main, sdk)) throw new Error("Actual core differs: " + entry.id);
    return { ...entry, mainSha256: hash(main), sdkSha256: hash(sdk),
      mainBase64: main.toString("base64"), sdkBase64: sdk.toString("base64") };
  }).sort((a, b) => a.id.localeCompare(b.id));
  if (new Set(files.map(file => file.id)).size !== files.length) throw new Error("Duplicate shared-core mapping");
  const compressed = gzipSync(JSON.stringify({ schemaVersion: 1, files }), { level: 9 });
  const manifest = { schemaVersion: 1, coreIdentity: "exact-source-v1", baselineSha256: hash(compressed),
    files: files.map(({ mainBase64, sdkBase64, ...entry }) => entry) };
  return { manifest, manifestBytes: Buffer.from(JSON.stringify(manifest, null, 2) + "\n"), compressed };
}

export function initializePair(input, suppliedEntries) {
  const pair = roots(input), encoded = encodeBaseline(pair, suppliedEntries ?? entriesFromSdk(pair.sdkRoot));
  for (const root of [pair.mainRoot, pair.sdkRoot]) {
    write(root, BASELINE, encoded.compressed); write(root, MANIFEST, encoded.manifestBytes);
  }
  return encoded.manifest;
}

function loadBaseline(pair) {
  const bytes = read(pair.mainRoot, MANIFEST), sdk = read(pair.sdkRoot, MANIFEST);
  if (bytes === null || !same(bytes, sdk)) throw new Error("Missing or different synchronization baselines; initialize only from equal actual cores");
  const manifest = JSON.parse(bytes), compressed = read(pair.mainRoot, BASELINE);
  if (manifest.schemaVersion !== 1 || manifest.coreIdentity !== "exact-source-v1" || !Array.isArray(manifest.files) ||
    compressed === null || hash(compressed) !== manifest.baselineSha256 || !same(compressed, read(pair.sdkRoot, BASELINE)))
    throw new Error("Shared-core baseline identity drift");
  const baseline = JSON.parse(gunzipSync(compressed, { maxOutputLength: 128 * 1024 * 1024 }));
  if (baseline.schemaVersion !== 1 || !Array.isArray(baseline.files) || baseline.files.length !== manifest.files.length)
    throw new Error("Invalid shared-core baseline");
  const seen = new Set();
  for (const [index, file] of baseline.files.entries()) {
    assertEntry(file);
    if (seen.has(file.id)) throw new Error("Duplicate shared-core mapping"); seen.add(file.id);
    const { mainBase64, sdkBase64, ...metadata } = file;
    if (JSON.stringify(metadata) !== JSON.stringify(manifest.files[index])) throw new Error("Shared-core manifest mapping drift");
    for (const side of ["main", "sdk"]) {
      const content = Buffer.from(file[side + "Base64"], "base64");
      if (content.toString("base64") !== file[side + "Base64"] || hash(content) !== file[side + "Sha256"])
        throw new Error("Shared-core baseline bytes drift: " + file.id);
    }
    if (file.kind !== "test" && file.mainSha256 !== file.sdkSha256) throw new Error("Baseline contains divergent actual core: " + file.id);
  }
  return { bytes, compressed, files: baseline.files };
}

function sourceEntry(relative) {
  const entry = { id: "server/src/" + relative, kind: "source", mainPath: "server/src/" + relative, sdkPath: "sdk/src/core/" + relative };
  assertEntry(entry); return entry;
}

function translateTest(bytes, entry, from, to) {
  if (bytes === null || entry.kind !== "test" || from === to) return bytes;
  const fromFile = entry[from + "Path"], toFile = entry[to + "Path"];
  const mappings = from === "sdk"
    ? [["sdk/src/core/", "server/src/"], ["sdk/tests/main-core/", "server/tests/"], ["sdk/resources/main-runtime/schemas/", "server/schemas/"], [".agents/", ".agents/"]]
    : [["server/src/", "sdk/src/core/"], ["server/tests/", "sdk/tests/main-core/"], ["server/schemas/", "sdk/resources/main-runtime/schemas/"], [".agents/", ".agents/"]];
  return Buffer.from(bytes.toString("utf8").replace(/((?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*|\bnew\s+URL\s*\(\s*)["'])(\.[^"']+)(["'])/g,
    (match, prefix, specifier, suffix) => {
      const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), specifier));
      const mapping = mappings.find(([source]) => resolved.startsWith(source));
      if (!mapping) return match;
      let relative = path.posix.relative(path.posix.dirname(toFile), mapping[1] + resolved.slice(mapping[0].length));
      if (!relative.startsWith(".")) relative = "./" + relative;
      return prefix + relative + suffix;
    }));
}

function merge(current, base, incoming, id) {
  if (same(current, incoming) || same(base, incoming)) return current;
  if (same(base, current)) return incoming;
  if (current === null || base === null || incoming === null) throw new Error("delete/modify or add/add conflict: " + id);
  if ([current, base, incoming].some(bytes => bytes.includes(0) || !Buffer.from(bytes.toString("utf8")).equals(bytes)))
    throw new Error("binary conflict: " + id);
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "shared-core-merge-"));
  try {
    for (const [name, bytes] of [["current", current], ["base", base], ["incoming", incoming]]) fs.writeFileSync(path.join(directory, name), bytes);
    const result = spawnSync("git", ["merge-file", "-p", "--diff3", "-L", "current", "-L", "last-sync", "-L", "incoming",
      path.join(directory, "current"), path.join(directory, "base"), path.join(directory, "incoming")], { maxBuffer: 64 * 1024 * 1024 });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error("text conflict: " + id);
    return result.stdout;
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
}

function discover(pair, original, include = []) {
  const entries = new Map(original.map(entry => [entry.id, entry]));
  for (const selected of include) {
    const relative = selected.replace(/^server\//, "");
    const entry = relative.startsWith("tests/")
      ? { id: "server/" + relative, kind: "test", mainPath: "server/" + relative, sdkPath: "sdk/tests/main-core/" + relative.slice(6) }
      : relative.startsWith("schemas/")
        ? { id: "server/" + relative, kind: "schema", mainPath: "server/" + relative, sdkPath: "sdk/resources/main-runtime/schemas/" + relative.slice(8) }
        : sourceEntry(relative.replace(/^src\//, ""));
    assertEntry(entry); if (!entries.has(entry.id)) entries.set(entry.id, entry);
  }
  for (const file of list(pair.sdkRoot, "sdk/src/core")) {
    const entry = sourceEntry(file.slice("sdk/src/core/".length));
    if (!entries.has(entry.id)) entries.set(entry.id, entry);
  }
  for (const file of list(pair.sdkRoot, "sdk/tests/main-core")) {
    const relative = file.slice("sdk/tests/main-core/".length), id = "server/tests/" + relative;
    if (!entries.has(id)) entries.set(id, { id, kind: "test", mainPath: id, sdkPath: file });
  }
  for (const file of list(pair.sdkRoot, "sdk/resources/main-runtime/schemas")) {
    const relative = file.slice("sdk/resources/main-runtime/schemas/".length), id = "server/schemas/" + relative;
    if (!entries.has(id)) entries.set(id, { id, kind: "schema", mainPath: id, sdkPath: file });
  }
  const queue = [...entries.values()];
  for (const entry of queue) {
    if (entry.kind !== "source" || !/\.(?:ts|mjs)$/.test(entry.mainPath)) continue;
    for (const side of ["main", "sdk"]) {
      const bytes = read(pair[side + "Root"], entry[side + "Path"]);
      if (bytes === null) continue;
      if (/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)["']express(?:["'/])/.test(bytes.toString()))
        throw new Error("Product HTTP dependency in shared core: " + entry.id);
      const prefix = side === "main" ? "server/src/" : "sdk/src/core/";
      for (const match of bytes.toString().matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)["'](\.[^"']+)["']/g)) {
        const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(entry[side + "Path"]), match[1]));
        if (!resolved.startsWith(prefix)) throw new Error("Shared core imports its host: " + entry.id);
        const relative = resolved.slice(prefix.length), candidate = [relative.replace(/\.js$/, ".ts"), relative]
          .find(value => read(pair[side + "Root"], prefix + value) !== null);
        if (!candidate) throw new Error("Missing shared-core dependency: " + entry.id + " -> " + match[1]);
        const dependency = sourceEntry(candidate);
        if (!entries.has(dependency.id)) { entries.set(dependency.id, dependency); queue.push(dependency); }
      }
    }
  }
  return [...entries.values()].sort((a, b) => a.id.localeCompare(b.id));
}

export function planSync(input, { from = "both", include = [] } = {}) {
  if (!["main", "sdk", "both"].includes(from)) throw new Error("Use --from main, sdk or both");
  const pair = roots(input), baseline = loadBaseline(pair), bases = new Map(baseline.files.map(file => [file.id, file]));
  const entries = discover(pair, baseline.files.map(({ mainBase64, sdkBase64, mainSha256, sdkSha256, ...entry }) => entry), include);
  const files = [], conflicts = [];
  for (const entry of entries) {
    assertEntry(entry);
    const base = bases.get(entry.id), main = read(pair.mainRoot, entry.mainPath), sdk = read(pair.sdkRoot, entry.sdkPath);
    const mainBase = base ? Buffer.from(base.mainBase64, "base64") : null;
    const sdkBase = base ? Buffer.from(base.sdkBase64, "base64") : null;
    const mainChanged = !same(main, mainBase), sdkChanged = !same(sdk, sdkBase);
    let nextMain = main, nextSdk = sdk;
    try {
      if ((from === "main" && !mainChanged && sdkChanged) || (from === "sdk" && !sdkChanged && mainChanged))
        throw new Error("peer-only change; use its direction or --from both: " + entry.id);
      if (main === null && sdk === null) { nextMain = null; nextSdk = null; }
      else if (main === null && base && !sdkChanged) { nextMain = null; nextSdk = null; }
      else if (sdk === null && base && !mainChanged) { nextMain = null; nextSdk = null; }
      else if (entry.kind !== "test") {
        const merged = merge(main, mainBase, sdk, entry.id); nextMain = merged; nextSdk = merged;
      } else {
        if (sdkChanged) nextMain = merge(main, translateTest(sdkBase, entry, "sdk", "main"), translateTest(sdk, entry, "sdk", "main"), entry.id);
        if (mainChanged) nextSdk = merge(sdk, translateTest(mainBase, entry, "main", "sdk"), translateTest(main, entry, "main", "sdk"), entry.id);
      }
    } catch (error) { conflicts.push({ id: entry.id, reason: error.message }); }
    files.push({ entry, main, sdk, nextMain, nextSdk, changed: mainChanged || sdkChanged });
  }
  return { ...pair, baseline, files, conflicts };
}

export function summarizePlan(plan) {
  return { mainRoot: plan.mainRoot, sdkRoot: plan.sdkRoot, files: plan.files.length,
    changes: plan.files.filter(file => file.changed).map(({ entry, main, sdk, nextMain, nextSdk }) => ({ id: entry.id, kind: entry.kind,
      main: same(main, nextMain) ? "unchanged" : nextMain === null ? "delete" : main === null ? "add" : "update",
      sdk: same(sdk, nextSdk) ? "unchanged" : nextSdk === null ? "delete" : sdk === null ? "add" : "update" })), conflicts: plan.conflicts };
}

export function applySync(plan, { refreshSdk = true } = {}) {
  if (plan.conflicts.length) throw new Error("Unresolved synchronization conflicts; no files changed: " + JSON.stringify(plan.conflicts));
  const locks = [], journal = new Map();
  const remember = (root, relative) => { const key = root + "\0" + relative; if (!journal.has(key)) journal.set(key, { root, relative, bytes: read(root, relative), written: false }); return journal.get(key); };
  const replace = (root, relative, bytes) => {
    const item = remember(root, relative); write(root, relative, bytes); item.written = true; item.expected = bytes;
  };
  try {
    for (const root of [plan.mainRoot, plan.sdkRoot].sort()) {
      const lock = fileAt(root, "shared-core/.sync.lock", true), fd = fs.openSync(lock, "wx", 0o600);
      fs.writeFileSync(fd, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() })); fs.closeSync(fd); locks.push(lock);
      if (!same(read(root, MANIFEST), plan.baseline.bytes) || !same(read(root, BASELINE), plan.baseline.compressed))
        throw new Error("Synchronization baseline changed after planning");
      remember(root, MANIFEST); remember(root, BASELINE);
    }
    for (const file of plan.files) for (const side of ["main", "sdk"]) {
      if (!same(read(plan[side + "Root"], file.entry[side + "Path"]), file[side]))
        throw new Error("Concurrent edit after planning: " + file.entry.id);
      remember(plan[side + "Root"], file.entry[side + "Path"]);
    }
    const refresh = refreshSdk && plan.files.some(file => file.changed && file.entry.kind !== "tool") &&
      read(plan.sdkRoot, "sdk/scripts/refresh-shared-core.mjs") !== null;
    if (refresh) for (const relative of ["sdk/resources/main-runtime/manifest.json", "sdk/resources/main-runtime/shared-fixes.json", "sdk/tests/fixtures/main-runtime-upstream.json.gz"])
      remember(plan.sdkRoot, relative);
    for (const file of plan.files) for (const side of ["main", "sdk"]) {
      const next = file[side === "main" ? "nextMain" : "nextSdk"];
      if (!same(file[side], next)) replace(plan[side + "Root"], file.entry[side + "Path"], next);
    }
    const entries = plan.files.filter(file => file.nextMain !== null || file.nextSdk !== null).map(file => file.entry);
    if (refresh) {
      const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "shared-core-capture-")), spec = path.join(temporary, "files.json");
      try {
        fs.writeFileSync(spec, JSON.stringify(entries));
        const result = spawnSync(process.execPath, [path.join(plan.sdkRoot, "sdk/scripts/refresh-shared-core.mjs"), "--source", plan.mainRoot, "--spec", spec],
          { cwd: plan.sdkRoot, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
        for (const relative of ["sdk/resources/main-runtime/manifest.json", "sdk/resources/main-runtime/shared-fixes.json", "sdk/tests/fixtures/main-runtime-upstream.json.gz"]) {
          const item = remember(plan.sdkRoot, relative), after = read(plan.sdkRoot, relative);
          if (!same(after, item.bytes)) { item.written = true; item.expected = after; }
        }
        if (result.error) throw result.error;
        if (result.status !== 0) throw new Error("SDK metadata refresh failed: " + result.stdout + result.stderr);
      } finally { fs.rmSync(temporary, { recursive: true, force: true }); }
    }
    const encoded = encodeBaseline(plan, entries);
    for (const root of [plan.mainRoot, plan.sdkRoot]) {
      replace(root, BASELINE, encoded.compressed); replace(root, MANIFEST, encoded.manifestBytes);
    }
    return summarizePlan(plan);
  } catch (error) {
    const preserved = [];
    for (const file of [...journal.values()].reverse()) {
      if (!file.written) continue;
      const current = read(file.root, file.relative);
      if (same(current, file.expected)) write(file.root, file.relative, file.bytes);
      else if (!same(current, file.bytes)) preserved.push(file.relative);
    }
    if (preserved.length) error.message += "; concurrent edits preserved: " + preserved.join(", ");
    throw error;
  } finally { for (const lock of locks) fs.unlinkSync(lock); }
}

async function cli() {
  const args = process.argv.slice(2), value = flag => { const index = args.indexOf(flag); return index < 0 ? undefined : args[index + 1]; };
  const own = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const ownIsMain = exists(path.join(own, "server/src"));
  const peerNames = ownIsMain ? ["ScienceEvolve", "ScienceEvolve-SDK"] : ["ScienceEvolve-server", "ScienceEvolve"];
  const peerMarker = ownIsMain ? "sdk/src/core" : "server/src";
  const defaultPeer = peerNames.map(name => path.join(own, "..", name))
    .find(candidate => candidate !== own && exists(path.join(candidate, peerMarker)));
  const peer = path.resolve(value("--peer") ?? defaultPeer ?? path.join(own, "..", peerNames[0]));
  const pair = { mainRoot: ownIsMain ? own : peer, sdkRoot: ownIsMain ? peer : own };
  if (args.includes("--init")) {
    if (!args.includes("--apply")) throw new Error("Use --init --apply to checkpoint already equal actual cores");
    const manifest = initializePair(pair); console.log(JSON.stringify({ initialized: true, files: manifest.files.length })); return;
  }
  const include = args.flatMap((arg, index) => arg === "--include" ? [args[index + 1]] : []);
  const plan = planSync(pair, { from: value("--from") ?? "both", include });
  console.log(JSON.stringify(summarizePlan(plan), null, 2));
  if (args.includes("--check")) {
    const drift = plan.files.filter(file => file.changed || (file.entry.kind !== "test" && !same(file.main, file.sdk)));
    if (plan.conflicts.length || drift.length) throw new Error("Shared-core drift: synchronize before delivery");
    console.log("Actual shared core and its synchronization baseline match"); return;
  }
  if (args.includes("--apply")) { applySync(plan); console.log("Shared core synchronized; both baselines and SDK source capture updated"); }
  else if (plan.conflicts.length) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  cli().catch(error => { console.error(error.message); process.exitCode = 1; });
}
