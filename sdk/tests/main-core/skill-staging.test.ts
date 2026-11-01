import { afterEach, describe, expect, it, vi } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { stageInvocationSkills } from "../../src/core/harness-runtime/skill-staging.js";

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) =>
    fs.rm(root, { recursive: true, force: true })
  ));
});

async function createSkill(library: string, name: string, body = name): Promise<string> {
  const directory = path.join(library, name);
  await fs.mkdir(directory, { recursive: true });
  const skillPath = path.join(directory, "SKILL.md");
  await fs.writeFile(skillPath, `${body}\n`, "utf8");
  return skillPath;
}

describe("stageInvocationSkills", () => {
  it("does not resolve or delete 899 library entries when the managed cache is empty", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-empty-skill-cache-")); roots.push(root);
    const library = path.join(root, "unselected-library");
    const workspace = path.join(root, "workspace"); await fs.mkdir(workspace);
    const paths = Array.from({ length: 899 }, (_, index) => path.join(library, `skill-${index}`, "SKILL.md"));
    const realpath = vi.spyOn(fs, "realpath"), remove = vi.spyOn(fs, "rm");
    try {
      expect(await stageInvocationSkills([], [], workspace, paths, "idea")).toEqual({ skillPaths: [], autoSkillPaths: [] });
      expect(realpath.mock.calls.some(([value]) => String(value).startsWith(library))).toBe(false);
      expect(remove).not.toHaveBeenCalled();
    } finally { realpath.mockRestore(); remove.mockRestore(); }
  });

  it("copies fixed/automatic Skills and support dependencies into the workspace", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-skills-"));
    roots.push(root);
    const library = path.join(root, "library");
    const workspace = path.join(root, "project", "workspaces");
    await fs.mkdir(workspace, { recursive: true });

    const writer = await createSkill(library, "ccf-paper-writer", "writer source");
    const common = await createSkill(library, "ccf-common", "common source");
    const automatic = await createSkill(library, "automatic-skill", "automatic source");
    const stale = await createSkill(library, "stale-skill", "stale source");
    await fs.writeFile(path.join(path.dirname(writer), "template.txt"), "writer asset\n", "utf8");

    const staleDestination = path.join(workspace, ".agents", "skills", "stale-skill");
    await fs.mkdir(staleDestination, { recursive: true });
    await fs.writeFile(path.join(staleDestination, "SKILL.md"), "old staged value\n", "utf8");
    await fs.writeFile(
      path.join(workspace, ".agents", ".scienceevolve-managed-skills.json"),
      `${JSON.stringify({ directories: ["stale-skill"] })}\n`,
      "utf8"
    );

    const staged = await stageInvocationSkills(
      [writer],
      [automatic],
      workspace,
      [writer, common, automatic, stale]
    );

    expect(staged.skillPaths.map((item) => path.basename(path.dirname(item)))).toEqual([
      "ccf-paper-writer",
      "ccf-common"
    ]);
    expect(staged.autoSkillPaths.map((item) => path.basename(path.dirname(item)))).toEqual([
      "automatic-skill"
    ]);
    for (const skillPath of [...staged.skillPaths, ...staged.autoSkillPaths]) {
      expect(path.relative(workspace, skillPath)).not.toMatch(/^\.\./);
    }
    await expect(fs.readFile(staged.skillPaths[0]!, "utf8")).resolves.toBe("writer source\n");
    await expect(
      fs.readFile(path.join(path.dirname(staged.skillPaths[0]!), "template.txt"), "utf8")
    ).resolves.toBe("writer asset\n");
    await expect(fs.stat(staleDestination)).rejects.toMatchObject({ code: "ENOENT" });

    await fs.writeFile(staged.skillPaths[0]!, "tampered workspace copy\n", "utf8");
    const rebuilt = await stageInvocationSkills(
      [writer],
      [automatic],
      workspace,
      [writer, common, automatic, stale]
    );
    await expect(fs.readFile(rebuilt.skillPaths[0]!, "utf8")).resolves.toBe("writer source\n");
  });

  it("isolates managed Skill caches while Agents share one cwd", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-agent-skill-caches-"));
    roots.push(root);
    const workspace = path.join(root, "project", "workspaces");
    const first = await createSkill(path.join(root, "one"), "same-name", "main source");
    const second = await createSkill(path.join(root, "two"), "same-name", "worker source");
    await fs.mkdir(workspace, { recursive: true });

    const [main, worker] = await Promise.all([
      stageInvocationSkills([first], [], workspace, [first], "main"),
      stageInvocationSkills([second], [], workspace, [second], "分析员")
    ]);
    expect(main.skillPaths[0]).toContain(
      path.join(".scienceevolve", "agent-skills", "main", "skills")
    );
    expect(worker.skillPaths[0]).toContain(
      path.join(".scienceevolve", "agent-skills", "分析员", "skills")
    );
    await expect(fs.readFile(main.skillPaths[0]!, "utf8")).resolves.toBe("main source\n");
    await expect(fs.readFile(worker.skillPaths[0]!, "utf8")).resolves.toBe("worker source\n");

    await stageInvocationSkills([], [], workspace, [first], "main");
    await expect(fs.access(main.skillPaths[0]!)).rejects.toMatchObject({ code: "ENOENT" });
    await expect(fs.readFile(worker.skillPaths[0]!, "utf8")).resolves.toBe("worker source\n");
    await expect(
      stageInvocationSkills([], [], workspace, [], "../main")
    ).rejects.toThrow("Invalid Agent skill scope");
  });

  it("rejects two selected sources with the same directory name", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-skills-collision-"));
    roots.push(root);
    const workspace = path.join(root, "workspace");
    const first = await createSkill(path.join(root, "one"), "duplicate");
    const second = await createSkill(path.join(root, "two"), "duplicate");
    await fs.mkdir(workspace, { recursive: true });

    await expect(stageInvocationSkills([first, second], [], workspace)).rejects.toThrow(
      "Selected skills have a directory-name collision: duplicate"
    );
  });

  it("rejects a staging directory symlink that escapes the workspace", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-skills-symlink-"));
    roots.push(root);
    const workspace = path.join(root, "workspace");
    const outside = path.join(root, "outside");
    const selected = await createSkill(path.join(root, "library"), "safe-skill");
    await Promise.all([
      fs.mkdir(workspace, { recursive: true }),
      fs.mkdir(outside, { recursive: true })
    ]);
    await fs.symlink(outside, path.join(workspace, ".scienceevolve"));

    await expect(stageInvocationSkills([selected], [], workspace, [selected], "main")).rejects.toThrow(
      /real directory|outside the project workspace/
    );
    await expect(fs.stat(path.join(outside, "agent-skills"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects symbolic links inside a selected Skill source tree", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-skill-source-symlink-"));
    roots.push(root);
    const workspace = path.join(root, "workspace");
    const library = path.join(root, "library");
    const outside = path.join(root, "outside-secret.txt");
    const selected = await createSkill(library, "linked-skill");
    await Promise.all([
      fs.mkdir(workspace, { recursive: true }),
      fs.writeFile(outside, "must not be staged\n", "utf8")
    ]);
    await fs.symlink(outside, path.join(path.dirname(selected), "linked-secret.txt"));

    await expect(stageInvocationSkills([selected], [], workspace)).rejects.toThrow(
      "Selected Skill tree must not contain symbolic links"
    );
    await expect(
      fs.stat(path.join(workspace, ".agents", "skills", "linked-skill"))
    ).rejects.toMatchObject({ code: "ENOENT" });
  });
});
