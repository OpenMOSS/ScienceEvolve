import { afterEach, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const roots: string[] = [];
afterEach(async () => { for (const root of roots.splice(0)) await fs.rm(root, { recursive: true, force: true }); });
async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-input-read-")); roots.push(root);
  const workspace = path.join(root, "workspace");
  await fs.mkdir(path.join(workspace, ".scienceevolve", "inbox"), { recursive: true });
  await fs.writeFile(path.join(workspace, ".scienceevolve", "inbox", "inv_test.md"), "A中B");
  await fs.writeFile(path.join(workspace, "Memory.md"), "persistent memory");
  return { root, workspace };
}
const call = (id: number, args: object) => ({ jsonrpc: "2.0", id, method: "tools/call", params: { name: "scienceevolve_read_invocation_input", arguments: args } });
async function rpc(workspace: string, requests: object[], agent = "main") {
  const child = spawn(process.execPath, ["--experimental-strip-types", fileURLToPath(new URL("../src/core/control-mcp.ts", import.meta.url))], {
    env: { PATH: process.env.PATH, SYSTEMROOT: process.env.SYSTEMROOT,
      SCIENCEEVOLVE_LEGACY_FILE_TOOLS: "1", SCIENCEEVOLVE_APPEND_ROOT: workspace, SCIENCEEVOLVE_AGENT_NAME: agent, SCIENCEEVOLVE_INVOCATION_ID: "inv_test" },
    stdio: ["pipe", "pipe", "pipe"], windowsHide: true
  });
  let stdout = "", stderr = "";
  child.stdout.setEncoding("utf8").on("data", (chunk) => { stdout += chunk; });
  child.stderr.setEncoding("utf8").on("data", (chunk) => { stderr += chunk; });
  const closed = new Promise<void>((resolve, reject) => {
    child.on("error", reject); child.on("close", (code) => code === 0 ? resolve() : reject(new Error(stderr)));
  });
  child.stdin.end(requests.map((request) => JSON.stringify(request)).join("\n") + "\n");
  await closed;
  return new Map(stdout.trim().split("\n").map((line) => JSON.parse(line)).map((message) => [message.id, message]));
}
const content = (message: any) => JSON.parse(message.result.content[0].text);

it("retains opt-in legacy reads of the two staged inputs in UTF-8 boundary-safe chunks without a shell", async () => {
  const { workspace } = await fixture();
  const replies = await rpc(workspace, [
    { jsonrpc: "2.0", id: 1, method: "tools/list" }, call(2, { input: "inbox", limit: 2 }),
    call(3, { input: "inbox", offset: 1, limit: 3 }), call(4, { input: "inbox", offset: 4 }), call(5, { input: "memory" })
  ]);
  expect(replies.get(1).result.tools.some((tool: any) => tool.name === "scienceevolve_read_invocation_input")).toBe(true);
  expect(content(replies.get(2))).toMatchObject({ content: "A", nextOffset: 1, hasMore: true });
  expect(content(replies.get(3))).toMatchObject({ content: "中", nextOffset: 4, hasMore: true });
  expect(content(replies.get(4))).toMatchObject({ content: "B", nextOffset: 5, hasMore: false });
  expect(content(replies.get(5)).content).toBe("persistent memory");
});

it("rejects paths, other input names, invalid byte offsets and probe use", async () => {
  const { workspace } = await fixture();
  const replies = await rpc(workspace, [call(1, { input: "inbox", path: "../../config.toml" }),
    call(2, { input: "../Memory.md" }), call(3, { input: "inbox", offset: 2 }), call(4, { input: "inbox", limit: 65537 })]);
  for (const id of [1, 2, 3, 4]) expect(replies.get(id).error).toBeTruthy();
  expect((await rpc(workspace, [call(1, { input: "memory" })], "probe")).get(1).error.code).toBe(-32601);
});

it("refuses an Inbox parent junction/symlink pointing outside the workspace", async () => {
  const { root, workspace } = await fixture();
  const outside = path.join(root, "outside"); await fs.mkdir(outside);
  await fs.writeFile(path.join(outside, "inv_test.md"), "external secret");
  await fs.rename(path.join(workspace, ".scienceevolve", "inbox"), path.join(workspace, ".scienceevolve", "saved-inbox"));
  await fs.symlink(outside, path.join(workspace, ".scienceevolve", "inbox"), process.platform === "win32" ? "junction" : "dir");
  const reply = (await rpc(workspace, [call(1, { input: "inbox" })])).get(1);
  expect(reply.error).toBeTruthy(); expect(JSON.stringify(reply)).not.toContain("external secret");
});

it("refuses a hard-linked Memory file without exposing outside content", async () => {
  const { root, workspace } = await fixture();
  await fs.rename(path.join(workspace, "Memory.md"), path.join(workspace, "saved-memory.md"));
  const outside = path.join(root, "private.md"); await fs.writeFile(outside, "external secret");
  await fs.link(outside, path.join(workspace, "Memory.md"));
  const reply = (await rpc(workspace, [call(1, { input: "memory" })])).get(1);
  expect(reply.error).toBeTruthy(); expect(JSON.stringify(reply)).not.toContain("external secret");
});
