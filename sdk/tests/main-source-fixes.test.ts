import { afterEach, describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { applySharedFixes, sharedFixIds, sharedFixes, sharedFixesDigest, runtimeRevision } from "../scripts/main-runtime-fixes.mjs";
import { startProjectMcps } from "../src/core/project-mcp.js";
import { connectMcp } from "./fixtures/mcp-client.mjs";
import { projectMcpSource } from "./fixtures/project-mcp-source.mjs";
import { ProjectStorage as MainStorage } from "../src/core/storage.js";
import { EventHub as MainEventHub } from "../src/core/event-hub.js";

const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 }))); });
async function directory() { const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-main-shared-fixes-")); roots.push(root); return root; }
const digest = (value: Buffer) => createHash("sha256").update(value).digest("hex");

describe("exact common source and host/runtime compatibility", () => {
  it("keeps the source manifest limited to common runtime sources", async () => {
    const manifest = JSON.parse(await fs.readFile(new URL("../resources/main-runtime/manifest.json", import.meta.url), "utf8"));
    expect(sharedFixes.hostSources).toEqual([]);
    expect(manifest.files.some(item => item.source.startsWith("sdk/"))).toBe(false);
    await expect(fs.access(new URL("../src/host/hermes", import.meta.url))).rejects.toMatchObject({ code: "ENOENT" });
  });
  it("verifies every actual common file directly against its recorded source hash", async () => {
    const manifest = JSON.parse(await fs.readFile(new URL("../resources/main-runtime/manifest.json", import.meta.url), "utf8"));
    expect(manifest.schemaVersion).toBe(2); expect(manifest.coreIdentity).toBe("exact-source-v1");
    expect(manifest.sharedFixesSha256).toBe(sharedFixesDigest);
    expect(manifest.runtimeRevision).toBe(runtimeRevision(manifest.sourceCommit, manifest.files));
    expect(sharedFixes.fixes).toEqual([]);
    const common = manifest.files.filter(item => item.source.startsWith("server/src/") || item.source.startsWith("server/schemas/"));
    expect(common.length).toBeGreaterThan(200);
    for (const entry of common) {
      expect(entry.sharedFixes ?? []).toEqual([]);
      expect(entry.brandingEdits ?? []).toEqual([]);
      expect(entry.derivedPinEdits ?? []).toEqual([]);
      const output = await fs.readFile(new URL(`../${entry.target}`, import.meta.url));
      expect(digest(output)).toBe(entry.sourceSha256);
      expect(entry.sha256).toBe(entry.sourceSha256);
    }
  });
  it("has no core patch mechanism enabled and refuses unregistered patch IDs", () => {
    const bytes = Buffer.from("unmodified common implementation");
    expect(sharedFixIds("server/src/original.ts")).toEqual([]);
    expect(applySharedFixes("server/src/original.ts", bytes)).toBe(bytes);
    expect(() => applySharedFixes("server/src/original.ts", bytes, false, ["unknown-patch"]))
      .toThrow(/Unknown\/duplicate recorded shared fixes/);
  });
  it("loads main's actual fork supervisor in source mode and performs a real MCP round trip", async () => {
    const root = await directory(), workspace = path.join(root, "workspace"); await fs.mkdir(workspace);
    const lease = await startProjectMcps({ projectPath: path.join(root, "project"), workspacePath: workspace, runtimePath: path.join(root, "runtime"),
      definitions: { evidence: { entrypoint: "server.cjs", files: { "server.cjs": projectMcpSource("main-core") } } },
      servers: [{ name: "evidence", project: "evidence" }], signal: new AbortController().signal });
    try {
      const client = await connectMcp(lease.servers[0]);
      try {
        const result = await client.callTool({ name: "evidence" });
        expect(JSON.parse((result.content as Array<{ text: string }>)[0].text).version).toBe("main-core");
      } finally { await client.close(); }
    } finally { await lease.close(); }
  });
  it.each(["main"])("resolves absolute and platform paths to canonical relative artifacts (%s)", async (engine) => {
    const root = await directory();
    const storage = new MainStorage(root, new MainEventHub());
    const id = "prj_0123456789abcdef0123456789abcdef";
    const workspace = await storage.roleWorkspace(id, "main", "inv_fixture");
    await fs.writeFile(path.join(workspace, "evidence.md"), "retained evidence");
    for (const value of ["evidence.md", "workspaces/evidence.md", path.join(workspace, "evidence.md")]) {
      expect((await storage.resolveWorkspaceArtifact(id, "review", value)).relativePath).toBe("evidence.md");
    }
    if (process.platform === "win32") {
      expect((await storage.resolveWorkspaceArtifact(id, "review", path.join(workspace, "evidence.md").replaceAll("\\", "/"))).relativePath).toBe("evidence.md");
    } else {
      await expect(storage.resolveWorkspaceArtifact(id, "review", "C:/outside/evidence.md")).rejects.toThrow(/Windows absolute/);
    }
    await expect(storage.resolveWorkspaceArtifact(id, "review", path.join(root, "outside.md"))).rejects.toThrow();
    await expect(storage.resolveWorkspaceArtifact(id, "review", "../outside.md")).rejects.toThrow();
    expect(await fs.readFile(path.join(workspace, "evidence.md"), "utf8")).toBe("retained evidence");
  });
});
