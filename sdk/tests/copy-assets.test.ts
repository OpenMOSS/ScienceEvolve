import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { afterEach, expect, it } from "vitest";

const execute = promisify(execFile);
const roots: string[] = [];
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "sdk-assets-"));
  roots.push(root);
  const script = path.join(root, "sdk/scripts/copy-assets.mjs");
  await fs.mkdir(path.dirname(script), { recursive: true });
  await fs.copyFile(new URL("../scripts/copy-assets.mjs", import.meta.url), script);
  const source = path.join(root, ".agents/skills");
  const output = path.join(root, "sdk/assets/skills");
  const write = async (relative: string, content: string | Buffer) => {
    const file = path.join(root, relative);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, content);
  };
  const run = () => execute(process.execPath, [script], {
    cwd: root, env: { ...process.env, PATH: "" }, timeout: 10_000
  });
  await write("sdk/resources/main-runtime/manifest.json", JSON.stringify({ files: [] }));
  return { root, source, output, write, run };
}

it.each([false, true])("copies source archive resources without Git (empty .git directory: %s)", async (gitDirectory) => {
  const { root, output, write, run } = await fixture();
  if (gitDirectory) await fs.mkdir(path.join(root, ".git"));
  const resources = {
    "SKILL.md": "---\nname: sample\n---\nSkill instructions\n",
    "scripts/检查.py": "print('check')\n",
    "references/guide with spaces.md": "Reference content\n",
    ".gitignore": "__pycache__/\n"
  };
  for (const [file, content] of Object.entries(resources)) await write(`.agents/skills/sample/${file}`, content);
  const image = Buffer.from([0, 255, 10, 128]);
  await write(".agents/skills/sample/assets/image.png", image);
  for (const file of [".env", ".env.local", "debug.log", ".DS_Store", "scripts/check.pyc",
    "__pycache__/check.pyc", "node_modules/dependency/index.js", ".git/config", ".cache/result.json"]) {
    await write(`.agents/skills/sample/${file}`, "local content");
  }
  await write("data/local.txt", "outside the Skills source tree");
  await write("sdk/assets/skills/stale.txt", "old output");
  await run();
  for (const [file, content] of Object.entries(resources)) {
    expect(await fs.readFile(path.join(output, "sample", file), "utf8")).toBe(content);
  }
  expect(await fs.readFile(path.join(output, "sample/assets/image.png"))).toEqual(image);
  expect(await fs.readdir(output)).toEqual(["sample"]);
  expect((await fs.readdir(path.join(output, "sample"))).sort()).toEqual([".gitignore", "SKILL.md", "assets", "references", "scripts"]);
  expect(await fs.readdir(path.join(output, "sample/scripts"))).toEqual(["检查.py"]);
});

it.each(["missing", "empty", "file"])("rejects %s Skills sources before replacing existing output", async (kind) => {
  const { source, output, write, run } = await fixture();
  if (kind === "empty") await fs.mkdir(source, { recursive: true });
  if (kind === "file") await write(".agents/skills", "not a directory");
  await write("sdk/assets/skills/existing.txt", "keep this output");
  await expect(run()).rejects.toThrow(kind === "file" ? "regular directory" : "builtin skills are missing");
  expect(await fs.readFile(path.join(output, "existing.txt"), "utf8")).toBe("keep this output");
});

it.skipIf(process.platform === "win32")("does not follow resource symlinks outside the Skills source tree", async () => {
  const { root, source, output, write, run } = await fixture();
  await write(".agents/skills/sample/SKILL.md", "Skill instructions");
  await write("outside/local.txt", "local content");
  await fs.symlink(path.join(root, "outside/local.txt"), path.join(source, "sample/local.txt"));
  await fs.symlink(path.join(root, "outside"), path.join(source, "sample/outside"));
  await run();
  expect(await fs.readdir(path.join(output, "sample"))).toEqual(["SKILL.md"]);
});

it("copies manifest-declared native helpers and schemas without Git", async () => {
  const { root, write, run } = await fixture();
  await write(".agents/skills/sample/SKILL.md", "Skill instructions");
  await write("sdk/resources/main-runtime/manifest.json", JSON.stringify({ files: [
    { target: "src/core/harness-runtime/helper.py" },
    { target: "resources/main-runtime/schemas/worker-result.json" },
    { target: "src/core/runtime.ts" }
  ] }));
  await write("sdk/src/core/harness-runtime/helper.py", "print('native helper')\n");
  await write("sdk/resources/main-runtime/schemas/worker-result.json", '{"type":"object"}\n');
  await write("sdk/src/core/runtime.ts", "export {};\n");
  await run();
  expect(await fs.readFile(path.join(root, "sdk/dist/core/harness-runtime/helper.py"), "utf8"))
    .toBe("print('native helper')\n");
  for (const directory of ["dist/schemas", "schemas"]) {
    expect(await fs.readFile(path.join(root, "sdk", directory, "worker-result.json"), "utf8"))
      .toBe('{"type":"object"}\n');
  }
  await expect(fs.access(path.join(root, "sdk/dist/core/runtime.ts"))).rejects.toThrow();
});

it("preserves categorized general/scientific Skills in source-archive packaging", async () => {
  const { output, write, run } = await fixture();
  await write(".agents/skills/general/role/SKILL.md", "role instructions");
  await write(".agents/skills/scientific/physics/method/SKILL.md", "method instructions");
  await write(".agents/skills/scientific/physics/README.md", "method catalog");
  await run();
  expect(await fs.readFile(path.join(output, "general/role/SKILL.md"), "utf8")).toBe("role instructions");
  expect(await fs.readFile(path.join(output, "scientific/physics/method/SKILL.md"), "utf8")).toBe("method instructions");
  expect(await fs.readFile(path.join(output, "scientific/physics/README.md"), "utf8")).toBe("method catalog");
});
