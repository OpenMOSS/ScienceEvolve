import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { constants, promises as fs, type Stats } from "node:fs";
import path from "node:path";
import { TextDecoder } from "node:util";
import { MAIN_WORKSPACE_LIMITS as limits, mainGitEnvironment, mainWorkspaceGitObjects, parseMainWorkspaceTree } from "./main-workspace.js";

export interface MainSourceWorkspaceOptions {
  /** Absolute source directory, read only. Agents work in owned Git worktrees, never here. */
  path: string;
  /** Portable relative regular files. Required for non-Git sources; Git defaults to tracked working-tree files. */
  files?: string[];
}
export interface MainSourceEntry { path: string; sha256: string; size: number; mode: "100644" | "100755" }
type Entry = MainSourceEntry;
interface Manifest { schemaVersion: 1; files: Entry[] }
export interface Snapshot { id: string; fingerprint: string }
const hash = (bytes: Buffer | string) => createHash("sha256").update(bytes).digest("hex");
const idPattern = /^[0-9a-f-]{36}$/;
const shaPattern = /^[0-9a-f]{64}$/;
function inside(root: string, target: string) {
  const rel = path.relative(root, target);
  return rel === "" || (!path.isAbsolute(rel) && rel !== ".." && !rel.startsWith(`..${path.sep}`));
}
async function realDirectory(value: string) {
  const stat = await fs.lstat(value);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error("Source workspace requires real directories, not symlinks/junctions");
  return fs.realpath(value);
}
// Imported code is data, not an authority/configuration overlay. These names
// must never become management mounts or publish obvious credentials/dependencies.
export function assertMainSourceFile(name: string) {
  const parts = name.split("/");
  if (parts.some((part) => /^(?:\.git|\.scienceevolve|\.agents|user_inputs|agent-memory|messages|runtime|workflow|Memory\.md|node_modules|\.venv|venv|__pycache__|\.ssh|\.aws|\.codex|\.claude)$/i.test(part)) ||
    parts.some((part) => /^\.env(?:\.|$)/i.test(part)) || /\.(?:pem|key|p12|pfx)$/i.test(name) ||
    /(?:^|\/)(?:auth\.json|gateways\.json|credentials(?:\.json)?|id_(?:rsa|ed25519)|\.npmrc|\.netrc)$/i.test(name)) {
    throw new Error(`Source file is reserved, credential-related or a dependency: ${name}`);
  }
}
const permitted = assertMainSourceFile;
function validateEntries(files: Entry[]) {
  if (!files.length || files.length > limits.files) throw new Error("Source workspace requires 1–5000 files");
  for (const entry of files) {
    if (typeof entry.path !== "string" || !shaPattern.test(entry.sha256) || !Number.isSafeInteger(entry.size) || entry.size < 0 ||
      !["100644", "100755"].includes(entry.mode) || Object.keys(entry).some((key) => !["path", "sha256", "size", "mode"].includes(key))) throw new Error("Invalid source snapshot entry");
    permitted(entry.path);
  }
  // Use the same portable path, collision and size checks as final export.
  parseMainWorkspaceTree(Buffer.from(files.map((entry) => `${entry.mode} blob ${"0".repeat(40)} ${entry.size}\t${entry.path}\0`).join("")));
}
function readonlyGit(source: string, args: string[], signal?: AbortSignal): Promise<Buffer> {
  signal?.throwIfAborted();
  return new Promise((resolve, reject) => {
    execFile("git", ["--no-replace-objects", "-c", `safe.directory=${source}`, "-c", "core.hooksPath=/dev/null", "-C", source, ...args],
      { encoding: "buffer", env: mainGitEnvironment(), windowsHide: true, timeout: 30_000, maxBuffer: limits.treeBytes, signal },
      (error, stdout) => error ? reject(new Error("Source Git index cannot be read safely; use a valid repository root or a non-Git source with an explicit file list")) : resolve(stdout));
  });
}
function changed(before: Stats, after: Stats) {
  return before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size || before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs;
}
export async function readMainWorkspaceFile(root: string, name: string, signal?: AbortSignal) {
  signal?.throwIfAborted();
  const segments = name.split("/"); let directory = root;
  for (const segment of segments.slice(0, -1)) {
    directory = path.join(directory, segment);
    if (await realDirectory(directory) !== directory) throw new Error("Source directory changed or escaped while reading");
  }
  const filename = path.join(directory, segments.at(-1)!);
  const before = await fs.lstat(filename);
  if (!before.isFile() || before.isSymbolicLink() || before.nlink !== 1) throw new Error(`Source requires unlinked regular files: ${name}`);
  if (before.size > limits.fileBytes) throw new Error("Source file exceeds 32 MiB");
  const file = await fs.open(filename, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const opened = await file.stat();
    if (changed(before, opened)) throw new Error("Source file changed before reading");
    // Bounded read even if a concurrently modified source grows after lstat.
    const bytes = Buffer.alloc(opened.size);
    let offset = 0;
    while (offset < bytes.length) {
      signal?.throwIfAborted();
      const read = await file.read(bytes, offset, bytes.length - offset, offset);
      if (!read.bytesRead) throw new Error("Source file changed while reading");
      offset += read.bytesRead;
    }
    if (changed(opened, await file.stat()) || changed(before, await fs.lstat(filename)) || await fs.realpath(filename) !== filename) throw new Error("Source file changed or escaped while reading");
    signal?.throwIfAborted();
    return { bytes, executable: process.platform !== "win32" && (opened.mode & 0o111) !== 0 };
  } finally { await file.close(); }
}
const readRegular = readMainWorkspaceFile;

/** Private host store. Bindings and immutable blobs live outside all Agent worktrees. */
export class MainSourceWorkspaceStore {
  private readonly root: string;
  private readonly registry: string;
  private bindings: Record<string, Snapshot | null> = Object.create(null);
  private tail: Promise<void> = Promise.resolve();
  constructor(private readonly dataDir: string) {
    this.root = path.join(dataDir, "source-workspaces"); this.registry = path.join(this.root, "bindings.json");
  }
  async initialize(fresh: boolean) {
    if (fresh) {
      await fs.mkdir(this.root, { mode: 0o700 });
      await fs.mkdir(path.join(this.root, "snapshots"), { mode: 0o700 });
      await fs.writeFile(this.registry, JSON.stringify({ schemaVersion: 1, projects: {} }) + "\n", { flag: "wx", mode: 0o600 });
    }
    await realDirectory(this.root); await realDirectory(path.join(this.root, "snapshots"));
    const contents = await readRegular(this.root, "bindings.json");
    const parsed = JSON.parse(contents.bytes.toString("utf8"));
    if (parsed.schemaVersion !== 1 || !parsed.projects || typeof parsed.projects !== "object" || Array.isArray(parsed.projects) ||
      Object.keys(parsed).some((key) => !["schemaVersion", "projects"].includes(key))) throw new Error("Invalid source workspace registry");
    for (const [projectId, value] of Object.entries(parsed.projects)) {
      this.validateId(projectId);
      if (value !== null) this.validateSnapshot(value);
    }
    this.bindings = Object.assign(Object.create(null), parsed.projects);
  }
  private validateId(id: string) { if (!/^prj_[a-f0-9]{32}$/.test(id)) throw new Error("Invalid source project identity"); }
  private validateSnapshot(value: unknown): asserts value is Snapshot {
    if (!value || typeof value !== "object" || !idPattern.test((value as Snapshot).id) || !shaPattern.test((value as Snapshot).fingerprint) ||
      Object.keys(value).some((key) => !["id", "fingerprint"].includes(key))) throw new Error("Invalid source snapshot binding");
  }
  async prepare(options: MainSourceWorkspaceOptions, signal?: AbortSignal): Promise<Snapshot> {
    if (!options || typeof options.path !== "string" || !path.isAbsolute(options.path) ||
      Object.keys(options).some((key) => !["path", "files"].includes(key)) || (options.files !== undefined &&
        (!Array.isArray(options.files) || options.files.some((name) => typeof name !== "string")))) throw new Error("Invalid sourceWorkspace; use an absolute path and optional relative files array");
    const source = await realDirectory(path.resolve(options.path)), runtime = await realDirectory(this.dataDir);
    if (inside(runtime, source) || inside(source, runtime)) throw new Error("Source workspace and runtime data must not overlap");
    signal?.throwIfAborted();
    let gitMetadata = false;
    try { await fs.lstat(path.join(source, ".git")); gitMetadata = true; }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    const tracked = new Map<string, "100644" | "100755">();
    const conflicted = new Set<string>();
    if (gitMetadata) {
      const top = (await readonlyGit(source, ["rev-parse", "--show-toplevel"], signal)).toString("utf8").trim();
      if (await fs.realpath(top) !== source) throw new Error("Source Git directory must be the exact working-tree root");
      const text = new TextDecoder("utf-8", { fatal: true }).decode(await readonlyGit(source, ["ls-files", "--stage", "-z"], signal));
      for (const line of text.split("\0").filter(Boolean)) {
        const match = /^(\d+) [0-9a-f]+ (\d)\t(.+)$/.exec(line);
        if (!match) throw new Error("Source Git index contains a malformed entry");
        if (match[2] !== "0") conflicted.add(match[3]!);
        if (!["100644", "100755"].includes(match[1]!)) {
          if (!options.files || options.files.includes(match[3]!)) throw new Error("Source symlinks/submodules require an explicit import strategy");
          continue;
        }
        tracked.set(match[3]!, match[1] as "100644" | "100755");
      }
    } else if (options.files === undefined) throw new Error("Non-Git sourceWorkspace requires an explicit files array");
    const names = [...(options.files ?? tracked.keys())].sort();
    // Validate all names before even creating a staging snapshot.
    validateEntries(names.map((name) => ({ path: name, sha256: "0".repeat(64), size: 0, mode: "100644" })));
    const id = randomUUID(), directory = path.join(this.root, "snapshots", id);
    await fs.mkdir(directory, { mode: 0o700 }); await fs.mkdir(path.join(directory, "blobs"), { mode: 0o700 });
    const entries: Entry[] = []; let total = 0;
    for (const name of names) {
      const { bytes, executable } = await readRegular(source, name, signal);
      total += bytes.length;
      if (total > limits.totalBytes) throw new Error("Source workspace exceeds 256 MiB total");
      const sha256 = hash(bytes), blob = path.join(directory, "blobs", sha256);
      try { await fs.writeFile(blob, bytes, { flag: "wx", mode: 0o600 }); }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; }
      entries.push({ path: name, sha256, size: bytes.length, mode: conflicted.has(name) ? (executable ? "100755" : "100644") : tracked.get(name) ?? (executable ? "100755" : "100644") });
    }
    validateEntries(entries);
    const manifest: Manifest = { schemaVersion: 1, files: entries };
    const bytes = JSON.stringify(manifest) + "\n", fingerprint = hash(bytes);
    signal?.throwIfAborted();
    // Manifest is the completion marker; partial staging is never bound/adopted.
    await fs.writeFile(path.join(directory, "manifest.json"), bytes, { flag: "wx", mode: 0o600 });
    return { id, fingerprint };
  }
  bind(projectId: string, snapshot: Snapshot | null): Promise<void> {
    const task = this.tail.then(async () => {
      this.validateId(projectId); if (snapshot) this.validateSnapshot(snapshot);
      if (Object.hasOwn(this.bindings, projectId)) throw new Error("Source workspace is already bound to this project");
      const next = { ...this.bindings, [projectId]: snapshot };
      await realDirectory(this.root);
      const temp = path.join(this.root, `bindings-${randomUUID()}.tmp`);
      const file = await fs.open(temp, "wx", 0o600);
      try { await file.writeFile(JSON.stringify({ schemaVersion: 1, projects: next }) + "\n"); await file.sync(); }
      finally { await file.close(); }
      await fs.rename(temp, this.registry); this.bindings = next;
    });
    this.tail = task.catch(() => {}); return task;
  }
  /** Host-only metadata for safe workspace delivery, from the exact immutable import. */
  async snapshotEntries(snapshot: Snapshot): Promise<MainSourceEntry[]> {
    this.validateSnapshot(snapshot);
    const directory = path.join(this.root, "snapshots", snapshot.id);
    const raw = (await readRegular(directory, "manifest.json")).bytes;
    if (hash(raw) !== snapshot.fingerprint) throw new Error("Source snapshot manifest changed");
    const manifest = JSON.parse(raw.toString("utf8")) as Manifest;
    validateEntries(manifest.files);
    return structuredClone(manifest.files);
  }
  /** Raw application hosts creating a project without source still get a durable explicit none binding. */
  async bindDefault(projectId: string) {
    this.validateId(projectId);
    if (!Object.hasOwn(this.bindings, projectId)) await this.bind(projectId, null);
  }
  async initialTree(projectId: string, input: { repositoryPath: string; signal?: AbortSignal }) {
    this.validateId(projectId);
    if (!Object.hasOwn(this.bindings, projectId)) throw new Error("Project has no durable source workspace binding");
    const snapshot = this.bindings[projectId]; if (!snapshot) return undefined;
    const expected = path.join(this.dataDir, "projects", projectId, "repository");
    if (path.resolve(input.repositoryPath) !== expected || await realDirectory(expected) !== expected) throw new Error("Source tree destination is not the owned repository");
    const directory = path.join(this.root, "snapshots", snapshot.id);
    await realDirectory(directory); await realDirectory(path.join(directory, "blobs"));
    const raw = (await readRegular(directory, "manifest.json", input.signal)).bytes;
    if (hash(raw) !== snapshot.fingerprint) throw new Error("Source snapshot manifest changed or is incomplete");
    const manifest: Manifest = JSON.parse(raw.toString("utf8"));
    if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.files) || Object.keys(manifest).some((key) => !["schemaVersion", "files"].includes(key))) throw new Error("Invalid source snapshot manifest");
    validateEntries(manifest.files);
    const oids = new Map<string, string>();
    const format = (await mainWorkspaceGitObjects(expected, ["rev-parse", "--show-object-format"], 1024, input.signal)).toString("utf8").trim();
    if (!["sha1", "sha256"].includes(format)) throw new Error("Unsupported source repository object format");
    const blobs = new Map<string, string>();
    for (const entry of manifest.files) {
      const bytes = (await readRegular(directory, `blobs/${entry.sha256}`, input.signal)).bytes;
      if (bytes.length !== entry.size || hash(bytes) !== entry.sha256) throw new Error("Source snapshot blob changed or is incomplete");
      const oid = createHash(format).update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest("hex");
      oids.set(entry.path, oid); blobs.set(entry.sha256, oid);
    }
    // One bounded Git process for all blobs, not one spawn per source file.
    // No filters: read owned immutable blobs, then check every returned object
    // against the verified bytes (including a possible filesystem read race).
    const blobPaths = [...blobs.keys()].map((sha) => JSON.stringify(path.join(directory, "blobs", sha).split(path.sep).join("/")) + "\n").join("");
    const written = (await mainWorkspaceGitObjects(expected, ["hash-object", "-w", "--no-filters", "--stdin-paths"],
      limits.files * 65 + 1024, input.signal, Buffer.from(blobPaths))).toString("utf8").trim().split(/\r?\n/);
    const expectedBlobs = [...blobs.values()];
    if (written.length !== blobs.size || written.some((oid, index) => oid !== expectedBlobs[index])) throw new Error("Source blob changed during Git object import");
    const build = async (prefix: string): Promise<string> => {
      const records: string[] = [], children = new Set<string>();
      for (const entry of manifest.files.filter((entry) => entry.path.startsWith(prefix))) {
        const relative = entry.path.slice(prefix.length), slash = relative.indexOf("/");
        if (slash < 0) records.push(`${entry.mode} blob ${oids.get(entry.path)}\t${relative}\0`);
        else children.add(relative.slice(0, slash));
      }
      for (const child of [...children].sort()) records.push(`040000 tree ${await build(prefix + child + "/")}\t${child}\0`);
      const tree = (await mainWorkspaceGitObjects(expected, ["mktree", "-z"], 1024, input.signal, Buffer.from(records.join("")))).toString("utf8").trim();
      if (!/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(tree)) throw new Error("Invalid source tree object");
      return tree;
    };
    return { tree: await build(""), fingerprint: snapshot.fingerprint };
  }
}
