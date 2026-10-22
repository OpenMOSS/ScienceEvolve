import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { sha256 } from "./utils.js";

export interface SkillDescriptor {
  id: string;
  name: string;
  description: string;
  path: string;
  source: "builtin" | "external";
}

export interface CreateUserSkillInput {
  title: string;
  content: string;
}

export class SkillCatalog {
  private cache: SkillDescriptor[] | undefined;
  private readonly roots: string[];

  constructor(
    roots: string[],
    private readonly userSkillRoot?: string
  ) {
    this.roots = [
      ...new Set([
        ...roots.map((root) => path.resolve(root)),
        ...(userSkillRoot ? [path.resolve(userSkillRoot)] : [])
      ])
    ];
  }

  async list(forceRefresh = false): Promise<SkillDescriptor[]> {
    if (this.cache && !forceRefresh) {
      return this.cache;
    }

    const descriptors: SkillDescriptor[] = [];
    const seenPaths = new Set<string>();
    for (let rootIndex = 0; rootIndex < this.roots.length; rootIndex += 1) {
      const root = this.roots[rootIndex]!;
      for await (const skillPath of discoverSkillFiles(root, rootIndex === 0)) {
        const directoryName = path.basename(path.dirname(skillPath));
        try {
          const realPath = await fs.realpath(skillPath);
          if (seenPaths.has(realPath)) continue;
          const raw = await fs.readFile(realPath, "utf8");
          const metadata = parseFrontmatter(raw);
          const source = rootIndex === 0 ? "builtin" : "external";
          const identityName = metadata.name || directoryName;
          const name = metadata["scienceevolve-title"] || identityName;
          descriptors.push({
            id:
              source === "builtin"
                ? `builtin:${identityName}`
                : `external:${sha256(root).slice(0, 10)}:${identityName}`,
            name,
            description: metadata.description || firstMeaningfulLine(raw),
            path: realPath,
            source
          });
          seenPaths.add(realPath);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
            throw error;
          }
        }
      }
    }
    this.cache = descriptors.sort((a, b) => a.id.localeCompare(b.id));
    return this.cache;
  }

  async createUserSkill(input: CreateUserSkillInput): Promise<SkillDescriptor> {
    if (!this.userSkillRoot) {
      throw new Error("用户 Skill 存储目录未配置");
    }
    const title = input.title.trim();
    const content = input.content.trim();
    if (!title) throw new Error("Skill 标题不能为空");
    if (!content) throw new Error("Skill 内容不能为空");
    if (title.toLowerCase().startsWith("lark")) {
      throw new Error("Lark Skills 不在科研 Agent 的候选范围内");
    }

    const root = path.resolve(this.userSkillRoot);
    const directoryName = userSkillDirectoryName(title);
    const destination = path.join(root, directoryName);
    const staging = path.join(root, `.scienceevolve-stage-${randomUUID()}`);
    await fs.mkdir(root, { recursive: true, mode: 0o700 });
    try {
      await fs.mkdir(staging, { mode: 0o700 });
      await fs.writeFile(
        path.join(staging, "SKILL.md"),
        serializeUserSkill(directoryName, title, content),
        { encoding: "utf8", mode: 0o600, flag: "wx" }
      );
      await fs.rename(staging, destination);
    } catch (error) {
      await fs.rm(staging, { recursive: true, force: true });
      throw error;
    }

    this.cache = undefined;
    const realPath = await fs.realpath(path.join(destination, "SKILL.md"));
    const created = (await this.list(true)).find(
      (skill) => skill.path === realPath
    );
    if (!created) throw new Error("Skill 已保存，但无法加入目录索引");
    return created;
  }

  async resolve(selected: string[]): Promise<string[]> {
    const catalog = await this.list();
    return this.resolveConfigured(catalog, selected);
  }

  async resolveInput(input: string): Promise<SkillDescriptor> {
    const selection = input.trim();
    if (!selection) throw new Error("Skill 输入不能为空");
    const catalog = await this.list(true);
    const catalogSkill = findCatalogSkill(catalog, selection, this.roots[0]);
    if (catalogSkill) return catalogSkill;
    return resolveSkillPath(selection);
  }

  async resolveConfigured(
    catalog: SkillDescriptor[],
    selected: string[],
    projectSkills: Record<string, string> = {}
  ): Promise<string[]> {
    const paths: string[] = [];
    for (const selection of selected) {
      if (selection.startsWith("project:")) {
        if (!Object.hasOwn(projectSkills, selection)) throw new Error(`Undefined project Skill: ${selection}`);
        paths.push(projectSkills[selection]);
        continue;
      }
      const catalogSkill = findCatalogSkill(catalog, selection, this.roots[0]);
      const skill = catalogSkill ?? (await resolveSkillPath(selection));
      paths.push(skill.path);
    }
    return [...new Set(paths)];
  }

  resolveFrom(
    catalog: SkillDescriptor[],
    selected: string[]
  ): string[] {
    const paths: string[] = [];
    for (const selection of selected) {
      const exact = findCatalogSkill(catalog, selection, this.roots[0]);
      if (!exact) {
        throw new Error(`Unknown or ambiguous skill: ${selection}`);
      }
      paths.push(exact.path);
    }
    return [...new Set(paths)];
  }
}

/** Categories are recursive only in the trusted builtin root. A Skill is a
 * leaf: never scan its references/assets as additional installed Skills.
 * Directory symlinks may expose a Skill, as before, but are never traversed. */
async function* discoverSkillFiles(root: string, recursive: boolean): AsyncGenerator<string> {
  let entries: import("node:fs").Dirent[];
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
    throw error;
  }
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith(".")) continue;
    if (!entry.isDirectory() && !entry.isSymbolicLink()) continue;
    const directory = path.join(root, entry.name);
    const skillPath = path.join(directory, "SKILL.md");
    try {
      if ((await fs.stat(skillPath)).isFile()) {
        yield skillPath;
        continue;
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    if (recursive && entry.isDirectory()) yield* discoverSkillFiles(directory, true);
  }
}

function findCatalogSkill(
  catalog: SkillDescriptor[],
  selection: string,
  builtinRoot?: string
): SkillDescriptor | undefined {
  const exact = catalog.find(
    (skill) => skill.id === selection || skill.path === selection
  );
  if (exact) return exact;
  // Preserve explicit paths saved before builtin Skills were categorized.
  // IDs and names stay authoritative; only the old builtin leaf path is aliased.
  if (builtinRoot && (path.isAbsolute(selection) || selection.startsWith("."))) {
    const selectedPath = path.resolve(selection);
    const legacy = catalog.find((skill) => {
      if (skill.source !== "builtin") return false;
      const directory = path.join(builtinRoot, path.basename(path.dirname(skill.path)));
      return selectedPath === directory || selectedPath === path.join(directory, "SKILL.md");
    });
    if (legacy) return legacy;
  }
  const named = catalog.filter((skill) => skill.name === selection);
  if (named.length === 1) return named[0];
  if (named.length > 1) {
    throw new Error(`Skill 名称不唯一，请输入完整 ID：${selection}`);
  }
  return undefined;
}

async function resolveSkillPath(selection: string): Promise<SkillDescriptor> {
  const candidate = path.resolve(selection);
  const skillPath =
    path.basename(candidate).toLowerCase() === "skill.md"
      ? candidate
      : path.join(candidate, "SKILL.md");
  let realPath: string;
  try {
    realPath = await fs.realpath(skillPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(
        `未找到 Skill：${selection}。请输入已安装 Skill 的名称、ID，或真实的 SKILL.md/目录路径。`
      );
    }
    throw error;
  }
  const [stat, raw] = await Promise.all([
    fs.stat(realPath),
    fs.readFile(realPath, "utf8")
  ]);
  if (!stat.isFile()) {
    throw new Error(`Skill 路径不是文件：${realPath}`);
  }
  const metadata = parseFrontmatter(raw);
  return {
    // The canonical path is the durable selection token for a user-added Skill.
    id: realPath,
    name:
      metadata["scienceevolve-title"] ||
      metadata.name ||
      path.basename(path.dirname(realPath)),
    description: metadata.description || firstMeaningfulLine(raw),
    path: realPath,
    source: "external"
  };
}

function userSkillDirectoryName(title: string): string {
  const slug = title
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
    .replace(/-+$/g, "");
  return `${slug || "user-skill"}-${randomUUID().replaceAll("-", "").slice(0, 12)}`;
}

function serializeUserSkill(
  identityName: string,
  title: string,
  content: string
): string {
  const description =
    content
      .split(/\r?\n/)
      .map((line) => line.replace(/^#+\s*/, "").trim())
      .find(Boolean)
      ?.replace(/\s+/g, " ")
      .slice(0, 240) || title;
  return [
    "---",
    `name: ${JSON.stringify(identityName)}`,
    `description: ${JSON.stringify(description)}`,
    `scienceevolve-title: ${JSON.stringify(title)}`,
    "---",
    `# ${title}`,
    "",
    content,
    ""
  ].join("\n");
}

/** Public content metadata, shared with project-resource discovery. */
export function skillContentSummary(raw: string): { name?: string; description: string } {
  const metadata = parseFrontmatter(raw);
  const name = metadata["scienceevolve-title"] || metadata.name;
  return { ...(name ? { name } : {}), description: metadata.description || firstMeaningfulLine(raw) };
}

function parseFrontmatter(raw: string): Record<string, string> {
  if (!raw.startsWith("---")) return {};
  const end = raw.indexOf("\n---", 3);
  if (end < 0) return {};
  const result: Record<string, string> = {};
  for (const line of raw.slice(3, end).split(/\r?\n/)) {
    const colon = line.indexOf(":");
    if (colon < 1) continue;
    const key = line.slice(0, colon).trim();
    const rawValue = line.slice(colon + 1).trim();
    let value = rawValue;
    if (rawValue.startsWith('"') && rawValue.endsWith('"')) {
      try {
        const parsed = JSON.parse(rawValue) as unknown;
        if (typeof parsed === "string") value = parsed;
      } catch {
        value = rawValue.slice(1, -1);
      }
    } else if (rawValue.startsWith("'") && rawValue.endsWith("'")) {
      value = rawValue.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

function firstMeaningfulLine(raw: string): string {
  const withoutFrontmatter = raw.replace(/^---[\s\S]*?\n---\s*/, "");
  return (
    withoutFrontmatter
      .split(/\r?\n/)
      .map((line) => line.replace(/^#+\s*/, "").trim())
      .find(Boolean) ?? "Custom Codex skill"
  );
}
