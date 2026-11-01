import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gzipSync, gunzipSync } from "node:zlib";

const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const key = (commit, source) => `${commit}:${source}`;
const sourceEntries = manifest => manifest.files.filter(entry => entry.source.startsWith("server/"));
const safeSource = source => typeof source === "string" && /^server\/(src|schemas|tests)\//.test(source) &&
  !source.includes("\\") && !source.includes("\0") && path.posix.normalize(source) === source;

// Original source bytes, never reconstructed generated outputs. Working-tree
// captures explicitly identify their Git base and pin every current file hash.
// They must not be represented as immutable blobs from that base commit.
export function decodeSnapshot(compressed, manifest) {
  const snapshot = JSON.parse(gunzipSync(compressed, { maxOutputLength: 64 * 1024 * 1024 }));
  if (snapshot.schemaVersion !== 1 || snapshot.sourceCommit !== manifest.sourceCommit ||
    !/^[a-f0-9]{40}$/.test(snapshot.sourceCommit) || !Array.isArray(snapshot.files) || !Array.isArray(snapshot.tree))
    throw new Error("Invalid runtime source snapshot identity");
  if (!["git", "working-tree"].includes(snapshot.sourceSnapshotKind ?? "git") ||
    (snapshot.sourceSnapshotKind ?? "git") !== (manifest.sourceSnapshotKind ?? "git"))
    throw new Error("Runtime source snapshot kind drift");
  const expected = new Map(sourceEntries(manifest).map(entry =>
    [key(entry.upstreamCommit ?? manifest.sourceCommit, entry.source), entry.sourceSha256]));
  const blobs = new Map();
  for (const entry of snapshot.files) {
    if (!safeSource(entry.source) || !/^[a-f0-9]{40}$/.test(entry.commit) || typeof entry.base64 !== "string")
      throw new Error("Invalid runtime source snapshot entry");
    const id = key(entry.commit, entry.source), bytes = Buffer.from(entry.base64, "base64");
    if (blobs.has(id) || !expected.has(id) || bytes.toString("base64") !== entry.base64 ||
      hash(bytes) !== expected.get(id)) throw new Error("Runtime source snapshot drift: " + id);
    blobs.set(id, bytes);
  }
  if (blobs.size !== expected.size) throw new Error("Runtime source snapshot is incomplete");
  const tree = new Set(snapshot.tree);
  if (tree.size !== snapshot.tree.length || snapshot.tree.some(source => !safeSource(source) || source.startsWith("server/tests/")))
    throw new Error("Invalid runtime source snapshot tree");
  for (const entry of sourceEntries(manifest)) {
    if (!entry.upstreamCommit && !entry.source.startsWith("server/tests/") && !tree.has(entry.source))
      throw new Error("Runtime source snapshot tree is incomplete: " + entry.source);
  }
  const commits = new Set(snapshot.files.map(entry => entry.commit));
  return {
    tree,
    resolve(commit) {
      if (!commits.has(commit)) throw new Error("Commit missing from runtime source snapshot: " + commit);
      return commit;
    },
    read(commit, source) {
      const bytes = blobs.get(key(commit, source));
      if (!bytes) throw new Error("Blob missing from runtime source snapshot: " + key(commit, source));
      return Buffer.from(bytes);
    }
  };
}

export function recordSnapshot(checkout, manifest) {
  const git = (...args) => execFileSync("git", ["-c", `safe.directory=${checkout.split(path.sep).join("/")}`, "-C", checkout, ...args],
    { maxBuffer: 32 * 1024 * 1024, windowsHide: true });
  if (manifest.sourceSnapshotKind === "working-tree" && git("rev-parse", "HEAD").toString().trim() !== manifest.sourceCommit)
    throw new Error("Working-tree base commit drift");
  const snapshot = {
    schemaVersion: 1, sourceCommit: manifest.sourceCommit,
    sourceSnapshotKind: manifest.sourceSnapshotKind ?? "git",
    tree: [...new Set((manifest.sourceSnapshotKind === "working-tree"
      ? git("ls-files", "--cached", "--others", "--exclude-standard", "server/src", "server/schemas")
      : git("ls-tree", "-r", "--name-only", manifest.sourceCommit, "server/src", "server/schemas"))
      .toString().trim().split("\n"))],
    files: sourceEntries(manifest).map(entry => {
      const commit = entry.upstreamCommit ?? manifest.sourceCommit;
      const bytes = manifest.sourceSnapshotKind === "working-tree"
        ? readFileSync(path.join(checkout, entry.source)) : git("show", key(commit, entry.source));
      return { commit, source: entry.source, base64: bytes.toString("base64") };
    })
  };
  const compressed = gzipSync(JSON.stringify(snapshot), { level: 9 });
  decodeSnapshot(compressed, manifest);
  return compressed;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const source = process.argv.indexOf("--source");
  if (source < 0 || !process.argv[source + 1] || process.argv[source + 1].startsWith("--"))
    throw new Error("Use --source <historical main checkout> to record the pinned Git blobs");
  const sdk = fileURLToPath(new URL("../", import.meta.url));
  const manifest = JSON.parse(await readFile(path.join(sdk, "resources/main-runtime/manifest.json"), "utf8"));
  const bytes = recordSnapshot(path.resolve(process.argv[source + 1]), manifest);
  await writeFile(path.join(sdk, "tests/fixtures/main-runtime-upstream.json.gz"), bytes);
  console.log(`Recorded ${sourceEntries(manifest).length} original runtime sources (${bytes.length} compressed bytes); every source hash verified.`);
}
