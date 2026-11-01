import { readFile } from "node:fs/promises";
import { gzipSync, gunzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { decodeSnapshot } from "../scripts/runtime-source-snapshot.mjs";

const manifest = JSON.parse(await readFile(new URL("../resources/main-runtime/manifest.json", import.meta.url), "utf8"));
const compressed = await readFile(new URL("./fixtures/main-runtime-upstream.json.gz", import.meta.url));

describe("original runtime source snapshot", () => {
  it("verifies every original blob against the independently pinned manifest", () => {
    const snapshot = decodeSnapshot(compressed, manifest);
    expect(snapshot.resolve(manifest.sourceCommit)).toBe(manifest.sourceCommit);
    for (const entry of manifest.files.filter(entry => entry.source.startsWith("server/"))) {
      expect(snapshot.read(entry.upstreamCommit ?? manifest.sourceCommit, entry.source).length).toBeGreaterThan(0);
    }
    expect(() => snapshot.read(manifest.sourceCommit, "server/src/not-in-closure.ts")).toThrow("Blob missing");
    expect(() => snapshot.resolve("0".repeat(40))).toThrow("Commit missing");
  });

  it.each(["bytes", "missing", "duplicate", "unexpected", "commit", "path", "tree", "kind"])("rejects %s drift", fault => {
    const snapshot = JSON.parse(gunzipSync(compressed).toString());
    if (fault === "bytes") snapshot.files[0].base64 = Buffer.from("changed upstream source").toString("base64");
    if (fault === "missing") snapshot.files.pop();
    if (fault === "duplicate") snapshot.files.push(snapshot.files[0]);
    if (fault === "unexpected") snapshot.files[0].source = "server/src/not-in-closure.ts";
    if (fault === "commit") snapshot.sourceCommit = "0".repeat(40);
    if (fault === "path") snapshot.files[0].source = "server/src/../../outside.ts";
    if (fault === "tree") snapshot.tree = [];
    if (fault === "kind") snapshot.sourceSnapshotKind = "git";
    expect(() => decodeSnapshot(gzipSync(JSON.stringify(snapshot)), manifest)).toThrow();
  });
});
