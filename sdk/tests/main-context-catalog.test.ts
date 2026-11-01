import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, it } from "vitest";
import { buildAgentToolCatalog } from "../src/core/agent-tool-catalog.js";
import { prepareWorkflowContext } from "../src/core/workflow-context.js";
import type { AgentRunRequest } from "../src/core/types.js";

it("publishes every tool catalog entry as a readable on-demand detail", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "sdk-catalog-context-"));
  try {
    const catalog = buildAgentToolCatalog([]);
    const request = { agent: "main", kind: "main", toolCatalog: catalog,
      project: { agents: {}, orchestration: { allowMainReconfiguration: true } } } as unknown as AgentRunRequest;
    const prepared = await prepareWorkflowContext(request, { projectPath: root, workspacePath: root, runtimePath: root,
      inboxPath: path.join(root, "Inbox.md"), memoryPath: path.join(root, "Memory.md"), inboxSha256: "fixture" });
    const indexPath = prepared.contextIndex!.indexPath, directory = path.dirname(prepared.inboxPath);
    const json = async (file: string) => JSON.parse(await fs.readFile(file, "utf8"));
    const index = await json(indexPath);
    for (const [key, entries] of Object.entries(catalog).filter(([, value]) => value && typeof value === "object")) {
      const source = index.entries.find(entry => entry.key === `agent-tool-catalog.${key}`);
      expect(source, key).toBeDefined();
      const list = await json(path.join(directory, source.list.path));
      const actual = await Promise.all(list.entries.map(entry => json(path.join(directory, entry.detail.path))));
      expect(actual).toEqual(Array.isArray(entries) ? entries : [entries]);
    }
    expect(prepared.contextIndex!.preview).toContain("agent-tool-catalog");
    expect(prepared.contextIndex!.preview).not.toContain(JSON.stringify(catalog));
  } finally {
    await fs.rm(root, { recursive: true, force: true, maxRetries: 5 });
  }
});
