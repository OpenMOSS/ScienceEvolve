import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { afterEach, describe, expect, it } from "vitest";
import { compileFilesystemAuthority, prepareFilesystemAuthorityMcp, validatePreparedFilesystemMcp } from "../../src/core/harness-runtime/filesystem-authority.js";
import { windowsExecutable } from "../../src/core/harness-runtime/windows-resident.js";

const roots: string[] = [];
const execFileAsync = promisify(execFile);
afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => fs.rm(root, { recursive: true, force: true })));
});

describe.runIf(process.platform === "linux" || process.platform === "win32")("filesystem read MCP optional version compatibility", () => {
  it.runIf(process.platform === "linux")("runs real ls/cat/rg at the project entry without allowing command execution or writes", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-project-shell-")); roots.push(root);
    const home = path.join(root, "home"), project = path.join(root, "project"), worktree = path.join(project, "workspaces"), runtime = path.join(root, "runtime");
    await Promise.all([fs.mkdir(home), fs.mkdir(worktree, { recursive: true }), fs.mkdir(runtime)]);
    await fs.writeFile(path.join(project, "request.md"), "Exact samples: A=27 B=31\n");
    await fs.writeFile(path.join(worktree, "Memory.md"), "retained memory");
    const authority = await compileFilesystemAuthority({ permission: "workspace", role: "delivery", gitEnabled: false,
      serviceUserRoot: home, executionWorktree: worktree, ownedMemoryPath: path.join(worktree, "Memory.md"),
      protectedRoots: [runtime], inputReadRoots: [project] });
    const prepared = await prepareFilesystemAuthorityMcp({ authority, executionRuntimePath: runtime });
    const client = rpc(prepared.row.command, prepared.row.args);
    const call = async (command: string, target: string, pattern?: string) => {
      const response = await client.request({ method: "tools/call", params: { name: "shell", arguments: { command, path: target, ...(pattern ? { pattern } : {}) } } });
      return response.result;
    };
    try {
      const list = await client.request({ method: "tools/list" });
      expect(list.result.tools.some((tool: any) => tool.name === "shell")).toBe(true);
      const ls = await call("ls", project); expect(ls.isError).not.toBe(true);
      expect(ls.structuredContent).toMatchObject({ command: "ls", exitCode: 0 });
      expect(ls.structuredContent.stdout).toContain("request.md");
      const cat = await call("cat", path.join(project, "request.md"));
      expect(cat.structuredContent.stdout).toBe("Exact samples: A=27 B=31\n");
      const rg = await call("rg", project, "A=27");
      expect(rg.structuredContent).toMatchObject({ command: "rg", exitCode: 0 });
      expect(rg.structuredContent.stdout).toContain("Exact samples: A=27 B=31");
      const noMatches = await call("rg", project, "no-such-sample");
      expect(noMatches.structuredContent.exitCode).toBe(1);
      expect(noMatches.isError).not.toBe(true);
      const invalidRegex = await call("rg", project, "[");
      expect(invalidRegex.structuredContent.exitCode).toBe(2);
      expect(invalidRegex.isError).toBe(true);
      const directoryRead = await call("cat", project);
      expect(directoryRead.structuredContent.exitCode).not.toBe(0);
      expect(directoryRead.isError).toBe(true);
      expect((await call("sh", project)).isError).toBe(true);
      expect((await call("cat", "/etc/passwd")).isError).toBe(true);
      expect((await call("cat", path.join(project, "request.md; touch stolen"))).isError).toBe(true);
      expect(await fs.readFile(path.join(project, "request.md"), "utf8")).toBe("Exact samples: A=27 B=31\n");
      expect(authority.writeRoots).toEqual([worktree]);
    } finally { await client.close(); }
  });
  it("versions every workspace file through the real Git MCP, including ignored and hidden files", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-git-every-file-")); roots.push(root);
    const home = path.join(root, "home"), worktree = path.join(home, "worktree"), runtime = path.join(root, "runtime");
    await fs.mkdir(worktree, { recursive: true }); await fs.mkdir(runtime);
    const files = { "Memory.md": "Shared memory\n", "agent-memory/writer/Memory.md": "Own record\n",
      "agent-memory/reviewer/Memory.md": "Shared peer record\n", ".hidden/config.json": "{}\n",
      ".agents/project/SKILL.md": "Project skill\n", ".scienceevolve/project-notes.md": "Project notes\n",
      "runtime/project-data.txt": "Project data\n", "ignored.txt": "Ignored by a legacy pattern\n", ".gitignore": "ignored.txt\n" };
    for (const [file, content] of Object.entries(files)) {
      await fs.mkdir(path.dirname(path.join(worktree, file)), { recursive: true });
      await fs.writeFile(path.join(worktree, file), content);
    }
    const run = (args: string[]) => execFileAsync("git", args, { cwd: worktree });
    await run(["init", "--quiet", "--initial-branch=main"]);
    await run(["config", "user.name", "Test Agent"]); await run(["config", "user.email", "test@example.test"]);
    const authority = await compileFilesystemAuthority({ permission: "workspace", role: "delivery", gitEnabled: true,
      directBase: "main", serviceUserRoot: home, executionWorktree: worktree,
      ownedMemoryPath: path.join(worktree, "agent-memory/writer/Memory.md"), protectedRoots: [runtime] });
    const prepared = await prepareFilesystemAuthorityMcp({ authority, executionRuntimePath: runtime,
      pythonExecutable: process.platform === "win32" ? windowsExecutable("python.exe") : "/usr/bin/python3" });
    const client = rpc(prepared.row.command, prepared.row.args);
    const call = (name: string, args: Record<string, unknown> = {}) => client.request({ method: "tools/call", params: { name, arguments: args } });
    try {
      const status = await call("git_status"); expect(status.result.isError).not.toBe(true);
      expect(JSON.parse(status.result.content[0].text).entries).toContainEqual(expect.objectContaining({ path: "ignored.txt", ignored: true }));
      const staged = await call("git_stage", { paths: ["."] }); expect(staged.result.isError).not.toBe(true);
      expect(JSON.parse(staged.result.content[0].text).staged.sort()).toEqual(Object.keys(files).sort());
      const committed = await call("git_commit", { message: "Version the complete project workspace" });
      expect(committed.result.isError).not.toBe(true);
      expect((await run(["ls-tree", "-r", "--name-only", "HEAD"])).stdout.trim().split("\n").sort()).toEqual(Object.keys(files).sort());
      for (const file of ["../outside.txt", ".git/config", "nested/.git/config"]) {
        expect((await call("git_stage", { paths: [file] })).result.isError).toBe(true);
      }
    } finally { await client.close(); }
  }, 20_000);
  it.each(["source", "compiled"] as const)("reads with absent or empty versions while preserving snapshot, size and path checks through the actual %s tool", async mode => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-read-version-")); roots.push(root);
    const home = path.join(root, "home"), worktree = path.join(home, "worktree"), runtime = path.join(root, "runtime");
    await Promise.all([fs.mkdir(worktree, { recursive: true }), fs.mkdir(runtime)]);
    const original = "实验 α current workflow state\n".repeat(100);
    const file = path.join(worktree, "state.json");
    await fs.writeFile(file, original);
    await fs.writeFile(path.join(worktree, "Memory.md"), "original Agent memory");
    await fs.writeFile(path.join(home, "private.txt"), "outside authorized root");
    const authority = await compileFilesystemAuthority({ permission: "workspace", role: "delivery", gitEnabled: false,
      serviceUserRoot: home, executionWorktree: worktree, ownedMemoryPath: path.join(worktree, "Memory.md"), protectedRoots: [runtime] });
    let bridgePath: string | undefined;
    if (mode === "compiled") {
      const ts = await import("typescript");
      const source = await fs.readFile(new URL("../../src/core/harness-runtime/descriptor-broker-mcp.ts", import.meta.url), "utf8");
      const compiled = ts.transpileModule(source, { fileName: "descriptor-broker-mcp.ts", compilerOptions: {
        target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, sourceMap: true
      } });
      bridgePath = path.join(runtime, "descriptor-broker-mcp.js");
      await fs.writeFile(bridgePath, compiled.outputText, { mode: 0o600 });
    }
    const prepared = await prepareFilesystemAuthorityMcp({ authority, executionRuntimePath: runtime, bridgePath,
      pythonExecutable: process.platform === "win32" ? windowsExecutable("python.exe") : "/usr/bin/python3" });
    await validatePreparedFilesystemMcp(prepared, authority, runtime);
    const rootId = authority.rootBindings.find(binding => binding.path === worktree)!.id;
    const client = rpc(prepared.row.command, prepared.row.args);
    const read = (extra: Record<string, unknown> = {}) => client.request({ method: "tools/call",
      params: { name: "read_file", arguments: { rootId, path: "state.json", ...extra } } });
    const content = (reply: any) => {
      expect(reply.result.isError).not.toBe(true);
      return JSON.parse(reply.result.content[0].text);
    };
    try {
      for (const placeholder of [{}, ...["", null, "None", "none", "null", "undefined"].map(expectedVersion => ({ expectedVersion }))]) {
        expect(content(await read(placeholder)).content).toBe(original);
        const page = content(await read({ ...placeholder, offset: 0, maxBytes: 47 }));
        expect(Buffer.from(page.content)).toEqual(Buffer.from(original).subarray(0, page.nextOffset));
        expect(page).toMatchObject({ offset: 0, totalBytes: Buffer.byteLength(original), eof: false });
        expect(page.version).toMatch(/^[a-f0-9]{64}$/);
        expect(page.bytes).toBeLessThanOrEqual(47);
      }
      const first = content(await read({ offset: 0, maxBytes: 47, expectedVersion: "" }));
      const next = content(await read({ offset: first.nextOffset, maxBytes: 47, expectedVersion: first.version }));
      expect(next.version).toBe(first.version);
      expect(Buffer.from(next.content)).toEqual(Buffer.from(original).subarray(first.nextOffset, next.nextOffset));
      for (const invalid of [0, false, {}, [], " ", "not-a-version", "a".repeat(63)]) {
        const reply = await read({ offset: 0, expectedVersion: invalid });
        expect(reply.result.isError).toBe(true);
        expect(reply.result.content[0].text).toContain("expectedVersion");
        expect(reply.result.structuredContent.error).toMatchObject({ code: "FILESYSTEM_ARGUMENT_INVALID", invalidField: "expectedVersion",
          nextCall: { tool: "read_file", arguments: { rootId, path: "state.json", offset: 0 } } });
      }
      expect((await read({ expectedVersion: first.version })).result.isError).toBe(true);
      expect((await read({ maxBytes: 1, expectedVersion: "" })).result.isError).toBe(true);
      expect((await read({ offset: -1, expectedVersion: null })).result.isError).toBe(true);
      for (const path of ["../private.txt", ".git/config"]) {
        expect((await read({ path, expectedVersion: "" })).result.isError).toBe(true);
      }
      const unknownRoot = await read({ rootId: "unknown-root", expectedVersion: null });
      expect(unknownRoot.result.isError).toBe(true);
      expect(unknownRoot.result.structuredContent.error).toMatchObject({ code: "FILESYSTEM_ROOT_UNKNOWN",
        nextCall: { tool: "authority_matrix", arguments: {} } });
      const missing = await read({ path: "missing.txt" });
      expect(missing.result.isError).toBe(true);
      expect(missing.result.structuredContent.error).toMatchObject({ code: "FILESYSTEM_PATH_NOT_FOUND",
        nextCall: { tool: "list_directory", arguments: { rootId, path: ".", offset: 0, limit: 100 } } });
      const nestedMissing = await read({ path: "missing/skill/SKILL.md" });
      expect(nestedMissing.result.structuredContent.error).toMatchObject({ requestedParent: "missing/skill",
        nextCall: { tool: "list_directory", arguments: { rootId, path: "." } } });
      const pinnedWithoutOffset = await read({ expectedVersion: first.version });
      expect(pinnedWithoutOffset.result.structuredContent.error).toMatchObject({ invalidField: "expectedVersion",
        nextCall: { tool: "read_file", arguments: { expectedVersion: first.version, offset: 0 } } });
      if (process.platform === "linux") {
        await fs.symlink(path.join(home, "private.txt"), path.join(worktree, "alias.txt"));
        expect((await read({ path: "alias.txt", expectedVersion: "" })).result.isError).toBe(true);
      }
      await fs.writeFile(file, `${original}updated`);
      const stale = await read({ offset: first.nextOffset, expectedVersion: first.version });
      expect(stale.result.isError).toBe(true);
      expect(stale.result.content[0].text).toContain("version changed");
      for (const expectedVersion of ["", null]) {
        const fresh = content(await read({ offset: 0, maxBytes: 47, expectedVersion }));
        expect(fresh.version).not.toBe(first.version);
        expect(fresh.totalBytes).toBe(Buffer.byteLength(`${original}updated`));
      }
    } finally { await client.close(); }
  }, 20_000);
});

function rpc(command: string, args: readonly string[]) {
  const child = spawn(command, [...args], { stdio: ["pipe", "pipe", "pipe"], windowsHide: true });
  const lines = readline.createInterface({ input: child.stdout });
  const pending = new Map<number, { resolve: (value: any) => void; reject: (error: Error) => void }>();
  let id = 0, stderr = "";
  child.stderr.on("data", chunk => { stderr = `${stderr}${chunk}`.slice(-8192); });
  lines.on("line", line => { const value = JSON.parse(line); pending.get(value.id)?.resolve(value); pending.delete(value.id); });
  child.on("error", error => { for (const waiter of pending.values()) waiter.reject(error); pending.clear(); });
  child.on("close", () => { for (const waiter of pending.values()) waiter.reject(new Error(stderr || "fixture subprocess closed")); pending.clear(); lines.close(); });
  return {
    async request(value: Record<string, unknown>): Promise<any> {
      const nextId = ++id;
      const response = new Promise((resolve, reject) => pending.set(nextId, { resolve, reject }));
      child.stdin.write(`${JSON.stringify({ ...value, id: nextId })}\n`);
      return response;
    },
    async close() {
      if (child.exitCode !== null || child.signalCode !== null) return;
      const closed = new Promise<void>(resolve => child.once("close", () => resolve()));
      child.stdin.end();
      const timeout = setTimeout(() => child.kill(), 2000);
      try { await closed; } finally { clearTimeout(timeout); }
    }
  };
}
