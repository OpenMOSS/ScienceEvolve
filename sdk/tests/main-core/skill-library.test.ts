import { afterEach, describe, expect, it, vi } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SkillCatalog } from "../../src/core/skill-catalog.js";
import { stageInvocationSkills } from "../../src/core/harness-runtime/skill-staging.js";

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => fs.rm(root, { recursive: true, force: true })));
});
async function fixture() {
  const root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-skill-library-")));
  roots.push(root);
  const builtin = path.join(root, "builtin");
  const external = path.join(root, "external");
  const write = async (relative: string, name: string) => {
    const file = path.join(root, relative, "SKILL.md");
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, `---\nname: ${name}\ndescription: Method ${name}\n---\n${name}\n`);
    return file;
  };
  return { root, builtin, external, write };
}

describe("categorized builtin Skills", () => {
  it("skips scans for empty/project-only selections and shares cached or concurrent refreshes", async () => {
    const f = await fixture(); await f.write("builtin/method", "method");
    const catalog = new SkillCatalog([f.builtin]);
    const list = vi.spyOn(catalog, "list");
    expect(await catalog.forSelections([])).toEqual([]);
    expect(await catalog.forSelections(["project:local"])).toEqual([]);
    expect(list).not.toHaveBeenCalled();
    const readdir = vi.spyOn(fs, "readdir");
    try {
      const [first, second, third] = await Promise.all([catalog.list(), catalog.list(), catalog.list(true)]);
      expect(first).toBe(second); expect(first).toBe(third);
      const scans = readdir.mock.calls.filter(([directory]) => directory === f.builtin).length;
      expect(scans).toBe(1);
      expect(await catalog.forSelections(["builtin:method"])).toBe(first);
      await f.write("builtin/new-method", "new-method");
      expect(await catalog.list()).toHaveLength(1);
      expect(await catalog.list(true)).toHaveLength(2);
      expect(readdir.mock.calls.filter(([directory]) => directory === f.builtin)).toHaveLength(2);
    } finally { readdir.mockRestore(); }
  });

  it("discovers categories with stable IDs, stops at Skill leaves, and preserves external-root behavior", async () => {
    const f = await fixture();
    await f.write("builtin/general/role", "role");
    await f.write("builtin/scientific/physics/method", "method");
    await f.write("builtin/scientific/physics/method/references/nested", "not-a-skill");
    await f.write("builtin/.scienceevolve-stage-hidden", "hidden");
    await f.write("external/standalone", "external");
    await f.write("external/category/nested", "not-an-external-skill");
    const catalog = new SkillCatalog([f.builtin, f.external]);
    const skills = await catalog.list();
    expect(skills.map(skill => skill.name).sort()).toEqual(["external", "method", "role"]);
    expect(skills.filter(skill => skill.source === "builtin").map(skill => skill.id)).toEqual(["builtin:method", "builtin:role"]);
    expect(skills.find(skill => skill.name === "external")!.id).toMatch(/^external:/);
    expect(await catalog.list()).toBe(skills);
  });

  it("ignores file and broken symlinks while discovering linked Skill directories", async () => {
    const f = await fixture();
    await f.write("builtin/general/role", "role");
    const linkedSkill = await f.write("linked-skill", "linked");
    await f.write("linked-category/nested", "not-a-linked-category-skill");
    const outside = path.join(f.root, "outside.md");
    await fs.writeFile(outside, "A support document, not a Skill directory.");
    await fs.symlink(outside, path.join(f.builtin, "general", "outside-link.md"), "file");
    await fs.symlink(path.join(f.root, "missing"), path.join(f.builtin, "general", "broken-link"), "dir");
    await fs.symlink(path.dirname(linkedSkill), path.join(f.builtin, "general", "linked"), "dir");
    await fs.symlink(path.join(f.root, "linked-category"), path.join(f.builtin, "general", "linked-category"), "dir");
    const skills = await new SkillCatalog([f.builtin]).list();
    expect(skills.map(skill => skill.id)).toEqual(["builtin:linked", "builtin:role"]);
    expect(skills.find(skill => skill.name === "linked")!.path).toBe(linkedSkill);
  });

  it("excludes dependencies left in builtin categories from the Skill catalog", async () => {
    const f = await fixture();
    await f.write("builtin/general/role", "role");
    await f.write("builtin/node_modules/package", "not-a-root-dependency-skill");
    await f.write("builtin/general/node_modules/package", "not-a-nested-dependency-skill");
    const leftover = path.join(f.builtin, "inspire", "node_modules", "openfars-acceptance");
    await fs.mkdir(leftover, { recursive: true });
    const outside = path.join(f.root, "outside.md");
    await fs.writeFile(outside, "Old acceptance fixture.");
    await fs.symlink(outside, path.join(leftover, "outside-link.md"), "file");
    const skills = await new SkillCatalog([f.builtin]).list();
    expect(skills.map(skill => skill.id)).toEqual(["builtin:role"]);
  });

  it("continues discovering Skills when another configured root is missing or a file", async () => {
    const f = await fixture();
    await f.write("builtin/general/role", "role");
    const fileRoot = path.join(f.root, "not-a-directory");
    await fs.writeFile(fileRoot, "A configured path that is not a directory.");
    const skills = await new SkillCatalog([f.builtin, fileRoot, path.join(f.root, "missing")]).list();
    expect(skills.map(skill => skill.id)).toEqual(["builtin:role"]);
  });

  it("resolves previously saved flat builtin file/directory paths without renaming IDs", async () => {
    const f = await fixture();
    const actual = await f.write("builtin/scientific/physics/method", "stable-method");
    const catalog = new SkillCatalog([f.builtin]);
    for (const selection of ["builtin:stable-method", path.join(f.builtin, "method"), path.join(f.builtin, "method", "SKILL.md")]) {
      expect(await catalog.resolve([selection])).toEqual([actual]);
      expect((await catalog.resolveInput(selection)).id).toBe("builtin:stable-method");
    }
    expect(catalog.resolveFrom(await catalog.list(), [path.join(f.builtin, "method")])).toEqual([actual]);
  });

  it("keeps sibling support resources and stages selected nested Skills in flat execution directories", async () => {
    const f = await fixture();
    const writer = await f.write("builtin/general/ccf-paper-writer", "ccf-paper-writer");
    const common = await f.write("builtin/general/ccf-common", "ccf-common");
    const method = await f.write("builtin/scientific/physics/method", "method");
    const workspace = path.join(f.root, "workspace");
    await fs.mkdir(workspace);
    const staged = await stageInvocationSkills([writer], [method], workspace, [writer, common, method], "main");
    expect(staged.skillPaths.map(p => path.basename(path.dirname(p)))).toEqual(["ccf-paper-writer"]);
    expect(staged.autoSkillPaths.map(p => path.basename(path.dirname(p)))).toEqual(["method"]);
    for (const p of [...staged.skillPaths, ...staged.autoSkillPaths]) {
      expect(path.dirname(path.dirname(p))).toBe(path.join(workspace, ".scienceevolve", "agent-skills", "main", "skills"));
      await expect(fs.readFile(p, "utf8")).resolves.toContain("name:");
    }
  });

  it("discovers all 899 shipped Skills, including 875 methods and their unchanged builtin IDs", async () => {
    const builtin = fileURLToPath(new URL("../../../.agents/skills", import.meta.url));
    const catalog = new SkillCatalog([builtin]);
    const skills = await catalog.list();
    expect(skills).toHaveLength(899);
    expect(new Set(skills.map(s => s.id)).size).toBe(899);
    expect(skills.filter(s => s.id.startsWith("builtin:sci-"))).toHaveLength(875);
    expect(skills.filter(s => s.path.includes(`${path.sep}general${path.sep}`))).toHaveLength(24);
    const staged = await catalog.resolve(["builtin:inspire", "builtin:ccf-paper-writer", "builtin:sci-catalysis-asymmetric-catalysis-chiral-catalyst-rese-1571cd89"]);
    for (const p of staged) await expect(fs.readFile(p, "utf8")).resolves.toContain("name:");
  });
});
