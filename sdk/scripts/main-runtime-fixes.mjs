import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

export const sharedFixBytes = await readFile(new URL("../resources/main-runtime/shared-fixes.json", import.meta.url));
export const sharedFixesDigest = createHash("sha256").update(sharedFixBytes).digest("hex");
export const sharedFixes = JSON.parse(sharedFixBytes);
if (sharedFixes.schemaVersion !== 1 || !Array.isArray(sharedFixes.fixes)) throw new Error("Invalid shared-fix index");
if (!["git", "working-tree"].includes(sharedFixes.sourceSnapshotKind ?? "git")) throw new Error("Invalid source snapshot kind");
const ids = new Set();
// SDK-owned adapters have no upstream blob. Track them explicitly instead of
// inventing a main commit or weakening the byte checks for imported main code.
export const hostSources = sharedFixes.hostSources ?? [];
if (!Array.isArray(hostSources) || new Set(hostSources).size !== hostSources.length ||
  hostSources.some(source => typeof source !== "string" ||
    !/^harness-runtime\/adapters\/hermes-[a-z-]+\.ts$/.test(source))) throw new Error("Invalid SDK adapter sources");
export const supplementalSources = sharedFixes.supplementalSources ?? [];
if (!Array.isArray(supplementalSources)) throw new Error("Invalid supplemental sources");
const supplementalNames = new Set();
for (const source of supplementalSources) {
  if (!source || typeof source.source !== "string" || !/^server\/src\/[\w/-]+\.ts$/.test(source.source) ||
    ["server/src/index.ts", "server/src/app.ts"].includes(source.source) ||
    typeof source.upstreamCommit !== "string" || !/^[a-f0-9]{40}$/.test(source.upstreamCommit) ||
    typeof source.sourceSha256 !== "string" || !/^[a-f0-9]{64}$/.test(source.sourceSha256) ||
    supplementalNames.has(source.source)) throw new Error("Invalid/duplicate supplemental source");
  supplementalNames.add(source.source);
}
export function supplementalSource(source) { return supplementalSources.find((entry) => entry.source === source); }
export function assertSupplementalIdentity(entry) {
  const declared = supplementalSource(entry.source);
  if (declared ? entry.upstreamCommit !== declared.upstreamCommit || entry.sourceSha256 !== declared.sourceSha256
    : entry.upstreamCommit !== undefined) throw new Error("Unexpected supplemental source identity: " + entry.source);
}
for (const fix of sharedFixes.fixes) {
  if (typeof fix.id !== "string" || ids.has(fix.id) || !/^server\/src\/[\w/-]+\.ts$/.test(fix.source) ||
    !Array.isArray(fix.replacements) || !fix.replacements.length ||
    (fix.hostOnly !== undefined && typeof fix.hostOnly !== "boolean")) throw new Error("Invalid/duplicate shared fix");
  ids.add(fix.id);
  for (const { before, after } of fix.replacements) {
    if (typeof before !== "string" || typeof after !== "string" || !before || !after || before === after) throw new Error("Invalid shared-fix replacement");
  }
}
export function sharedFixIds(source) {
  return sharedFixes.fixes.filter((fix) => fix.source === source).map((fix) => fix.id);
}
/** Exact, reversible mechanical source changes. Refuse upstream/context drift, never fuzzy patch. */
export function applySharedFixes(source, bytes, reverse = false, recordedIds) {
  let fixes = sharedFixes.fixes.filter((fix) => fix.source === source && (!recordedIds || recordedIds.includes(fix.id)));
  if (recordedIds && (new Set(recordedIds).size !== recordedIds.length || fixes.length !== recordedIds.length)) throw new Error("Unknown/duplicate recorded shared fixes");
  if (!fixes.length) return bytes;
  if (reverse) fixes = fixes.toReversed();
  let text = bytes.toString("utf8");
  for (const fix of fixes) {
    for (const replacement of reverse ? fix.replacements.toReversed() : fix.replacements) {
      const before = reverse ? replacement.after : replacement.before;
      const after = reverse ? replacement.before : replacement.after;
      if (text.split(before).length !== 2) throw new Error(`Shared-fix context drift: ${fix.id}`);
      text = text.replace(before, () => after);
    }
  }
  return Buffer.from(text);
}
export function runtimeRevision(sourceCommit, entries) {
  const sources = entries.filter((entry) => entry.source.startsWith("server/src/") || entry.source.startsWith("server/schemas/") || entry.source.startsWith("sdk/src/core/"))
    .map(({ source, sha256 }) => ({ source, sha256 })).sort((a, b) => a.source.localeCompare(b.source));
  return sourceCommit + "+" + createHash("sha256").update(JSON.stringify(sources)).digest("hex").slice(0, 16);
}
