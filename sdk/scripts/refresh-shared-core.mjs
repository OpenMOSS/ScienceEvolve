import fs from "node:fs";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { recordSnapshot } from "./runtime-source-snapshot.mjs";

const sdk = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const argument = name => { const index = args.indexOf(name); return index < 0 ? undefined : args[index + 1]; };
const source = argument("--source"), specFile = argument("--spec");
if (!source || !specFile) throw new Error("Use --source <main checkout> --spec <planned shared mappings>");
const checkout = fs.realpathSync(source), entries = JSON.parse(fs.readFileSync(specFile, "utf8"));
const files = new Map();
const managed = ["resources/main-runtime/shared-fixes.json", "resources/main-runtime/manifest.json", "tests/fixtures/main-runtime-upstream.json.gz"];
const remember = relative => {
  if (!files.has(relative)) files.set(relative, fs.existsSync(path.join(sdk, relative)) ? fs.readFileSync(path.join(sdk, relative)) : null);
};
const oldManifest = JSON.parse(fs.readFileSync(path.join(sdk, "resources/main-runtime/manifest.json"), "utf8"));
for (const relative of [...managed, ...oldManifest.files.map(entry => entry.target)]) remember(relative);
for (const entry of entries) {
  if (!entry || !["source", "schema", "test", "tool"].includes(entry.kind)) throw new Error("Invalid shared-core capture entry");
  if (entry.kind === "tool") continue;
  const prefix = entry.kind === "source" ? ["server/src/", "sdk/src/core/"]
    : entry.kind === "schema" ? ["server/schemas/", "sdk/resources/main-runtime/schemas/"] : ["server/tests/", "sdk/tests/main-core/"];
  if (!entry.mainPath.startsWith(prefix[0]) || !entry.sdkPath.startsWith(prefix[1]) ||
    entry.mainPath.slice(prefix[0].length) !== entry.sdkPath.slice(prefix[1].length) ||
    [entry.mainPath, entry.sdkPath].some(value => value.includes("\\") || value.includes("\0") || path.posix.normalize(value) !== value))
    throw new Error("Unsafe shared-core capture mapping");
  remember(entry.sdkPath.slice("sdk/".length));
  if (entry.kind !== "test" && !fs.readFileSync(path.join(checkout, entry.mainPath)).equals(fs.readFileSync(path.join(sdk, "..", entry.sdkPath))))
    throw new Error("Actual core differs before SDK capture: " + entry.mainPath);
}

try {
  const sourceCommit = execFileSync("git", ["-C", checkout, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  if (!/^[a-f0-9]{40}$/.test(sourceCommit)) throw new Error("Invalid main source identity");
  const index = {
    schemaVersion: 1, coreIdentity: "exact-source-v1", sourceCommit, sourceSnapshotKind: "working-tree",
    supplementalSources: [], hostSources: [], fixes: [],
    additionalSources: entries.filter(entry => entry.kind === "source").map(entry => entry.mainPath).sort(),
    schemas: entries.filter(entry => entry.kind === "schema").map(entry => entry.mainPath.slice("server/schemas/".length)).sort(),
    regressionTests: entries.filter(entry => entry.kind === "test").map(entry => entry.mainPath.slice("server/tests/".length)).sort()
  };
  fs.writeFileSync(path.join(sdk, managed[0]), JSON.stringify(index, null, 2) + "\n");
  const generated = spawnSync(process.execPath, [path.join(sdk, "scripts/sync-main-runtime.mjs"),
    "--source", checkout, "--worktree", "--accept-synced-core", "--accept-synced-tests"],
    { encoding: "utf8", cwd: sdk, maxBuffer: 16 * 1024 * 1024 });
  if (generated.error) throw generated.error;
  if (generated.status !== 0) throw new Error(generated.stdout + generated.stderr);
  const manifest = JSON.parse(fs.readFileSync(path.join(sdk, managed[1]), "utf8"));
  fs.writeFileSync(path.join(sdk, managed[2]), recordSnapshot(checkout, manifest));
  console.log(`SDK captured the actual common source: ${manifest.runtimeRevision}`);
} catch (error) {
  // Exact-source capture verifies and retains all current source/test bytes.
  // Only its three metadata documents may change; do not overwrite user edits.
  for (const relative of managed) {
    const bytes = files.get(relative);
    const file = path.join(sdk, relative);
    if (bytes === null) { if (fs.existsSync(file)) fs.unlinkSync(file); }
    else { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, bytes); }
  }
  console.error(error.message); process.exitCode = 1;
}
