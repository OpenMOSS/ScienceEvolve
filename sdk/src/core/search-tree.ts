import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { ExecFileGitCommandRunner } from "./collaboration-git/command-runner.js";
import type { GitCommandRunner } from "./collaboration-git/contracts.js";

import { searchTreeConfigSchema, searchTreeNodeSchema, searchTreeId as id, validateNodes } from "./internal/shared/search-tree.js";
import type { SearchTreeConfig, SearchTreeNode } from "./internal/shared/search-tree.js";
export { searchTreeConfigSchema, searchTreeNodeSchema } from "./internal/shared/search-tree.js";
export type { SearchTreeConfig, SearchTreeNode } from "./internal/shared/search-tree.js";
const text = z.string().trim().min(1).max(16_000);
const sha = z.string().regex(/^[a-f0-9]{40}$/);
const file = z.string().min(1).max(1024).refine(value => !value.includes("\\") && !value.includes("\0") &&
  !value.startsWith("/") && value.split("/").every(part => part && part !== "." && part !== ".."), "Expected a relative input file path");
export type SearchTreeActor = { kind: "user" } | {
  kind: "agent"; agentId: string; executionId?: string; invocationId: string; scopeId?: string;
};
interface InputSnapshot { path: string; sha256: string; blob: string; bytes: number }
export interface SearchTreeDocument {
  schemaVersion: 1;
  projectId: string;
  root: { id: "root"; kind: "root"; name: string; description?: string; inputs: InputSnapshot[] };
  nodes: SearchTreeNode[];
  update: { requestId: string; payloadHash: string; actor: SearchTreeActor; at: string };
}
export interface SearchTreeSnapshot { revision: string; tree: SearchTreeDocument }
const query = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("overview") }).strict(),
  z.object({ operation: z.literal("node"), nodeId: id, revision: sha.optional() }).strict(),
  z.object({ operation: z.literal("subtree"), nodeId: id }).strict(),
  z.object({ operation: z.literal("history"), before: sha.optional(), limit: z.number().int().min(1).max(100).default(20) }).strict(),
  z.object({ operation: z.literal("input"), path: file }).strict()
]);
const mutation = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("put"), requestId: text, expectedRevision: sha, node: searchTreeNodeSchema }).strict(),
  z.object({ operation: z.literal("delete"), requestId: text, expectedRevision: sha, nodeId: id }).strict()
]);
export const searchTreeRequestSchema = z.union([query, mutation]);
export type SearchTreeRequest = z.input<typeof searchTreeRequestSchema>;
const REF = "refs/heads/metadata/search-tree";
const ZERO = "0".repeat(40);
const digest = (value: string | Buffer) => createHash("sha256").update(value).digest("hex");
const identity = { GIT_AUTHOR_NAME: "ScienceEvolve Search Tree", GIT_AUTHOR_EMAIL: "search-tree@localhost",
  GIT_COMMITTER_NAME: "ScienceEvolve Search Tree", GIT_COMMITTER_EMAIL: "search-tree@localhost" };

/** Git owns the tree and its request receipts. No business checkout or index is used. */
export class SearchTreeStore {
  readonly repositoryPath: string;
  constructor(readonly projectId: string, readonly projectPath: string, gitEnabled: boolean,
    private readonly runner: GitCommandRunner = new ExecFileGitCommandRunner()) {
    if (!path.isAbsolute(projectPath)) throw new Error("Search tree requires an absolute project directory");
    this.repositoryPath = path.join(projectPath, gitEnabled ? "repository" : "search-tree.git");
  }

  private async command(args: string[], stdin?: string, environment?: Record<string, string>, acceptedExitCodes?: number[]) {
    return this.runner.run({ cwd: this.repositoryPath, args, stdin, environment, acceptedExitCodes });
  }
  private async assertRepository() {
    const entry = await fs.lstat(this.repositoryPath);
    if (!entry.isDirectory() || entry.isSymbolicLink() || await fs.realpath(this.repositoryPath) !== this.repositoryPath ||
      (await this.command(["rev-parse", "--is-bare-repository"])).stdout.trim() !== "true")
      throw new Error("Search tree repository is not the bound bare repository");
  }
  private async head(ref = REF): Promise<string | undefined> {
    const result = await this.command(["rev-parse", "--verify", "--quiet", ref], undefined, undefined, [0, 1]);
    return result.code === 0 ? sha.parse(result.stdout.trim()) : undefined;
  }
  private async document(revision: string): Promise<SearchTreeDocument> {
    sha.parse(revision);
    const doc = JSON.parse((await this.command(["show", `${revision}:tree.json`])).stdout) as SearchTreeDocument;
    if (doc.schemaVersion !== 1 || doc.projectId !== this.projectId || doc.root?.id !== "root" || doc.root.kind !== "root" || !Array.isArray(doc.root.inputs))
      throw new Error("Invalid search tree document identity");
    doc.nodes = z.array(searchTreeNodeSchema).max(10000).parse(doc.nodes);
    validateNodes(doc.nodes);
    return doc;
  }
  async snapshot(revision?: string): Promise<SearchTreeSnapshot> {
    await this.assertRepository();
    const current = await this.head();
    if (!current) throw new Error("Search tree has not been initialized");
    if (revision && revision !== current) {
      sha.parse(revision);
      if ((await this.command(["merge-base", "--is-ancestor", revision, current], undefined, undefined, [0, 1])).code !== 0)
        throw new Error("Revision does not belong to this search tree history");
    }
    return { revision: revision ?? current, tree: await this.document(revision ?? current) };
  }
  async initialize(value: SearchTreeConfig, inputsRoot: string): Promise<SearchTreeSnapshot> {
    const config = searchTreeConfigSchema.parse(value);
    await fs.mkdir(this.projectPath, { recursive: true });
    try { await fs.lstat(this.repositoryPath); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      await this.runner.run({ cwd: this.projectPath, args: ["init", "--bare", "--initial-branch=main", "--", path.basename(this.repositoryPath)] });
    }
    await this.assertRepository();
    const payloadHash = digest(JSON.stringify(config));
    const actor: SearchTreeActor = { kind: "user" };
    const existing = await this.receipt(actor, "initialize", payloadHash);
    if (existing) return existing;
    const inputs: InputSnapshot[] = [];
    let total = 0;
    for (const relative of config.root.inputFiles ?? []) {
      const target = path.join(inputsRoot, relative);
      const root = await fs.realpath(inputsRoot);
      const real = await fs.realpath(target);
      const stat = await fs.lstat(target);
      if (real !== target || !real.startsWith(root + path.sep) || !stat.isFile() || stat.nlink !== 1 || stat.size > 10 * 1024 * 1024)
        throw new Error(`Initial input is not a bounded original file: ${relative}`);
      const bytes = await fs.readFile(target);
      total += bytes.length;
      if (total > 200 * 1024 * 1024) throw new Error("Search tree initial inputs exceed 200 MiB");
      const content = JSON.stringify({ encoding: "base64", content: bytes.toString("base64") });
      const blob = sha.parse((await this.command(["hash-object", "-w", "--stdin"], content)).stdout.trim());
      inputs.push({ path: relative, sha256: digest(bytes), blob, bytes: bytes.length });
    }
    if (new Set(inputs.map(input => input.path)).size !== inputs.length) throw new Error("Duplicate search tree initial input");
    const tree: SearchTreeDocument = { schemaVersion: 1, projectId: this.projectId,
      root: { id: "root", kind: "root", name: config.root.name, ...(config.root.description ? { description: config.root.description } : {}), inputs },
      nodes: config.directions, update: { actor, requestId: "initialize", payloadHash, at: new Date().toISOString() } };
    return this.save(tree, undefined);
  }
  private requestRef(actor: SearchTreeActor, requestId: string) {
    return `refs/scienceevolve/search-tree/requests/${digest(JSON.stringify([actor, requestId]))}`;
  }
  private async receipt(actor: SearchTreeActor, requestId: string, payloadHash: string): Promise<SearchTreeSnapshot | undefined> {
    const revision = await this.head(this.requestRef(actor, requestId));
    if (!revision) return;
    const tree = await this.document(revision);
    if (tree.update.payloadHash !== payloadHash) throw new Error("Search tree request ID was reused with different content");
    return { revision, tree };
  }
  async request(actor: SearchTreeActor, value: unknown): Promise<unknown> {
    const request = searchTreeRequestSchema.parse(value);
    if (actor.kind === "agent" && (!actor.agentId || !actor.invocationId)) throw new Error("Search tree write requires the actual Agent and invocation");
    const current = await this.snapshot("revision" in request ? request.revision : undefined);
    const { tree, revision } = current;
    if (request.operation === "overview") return { revision, root: tree.root,
      nodes: tree.nodes.map(node => ({ id: node.id, kind: node.kind, name: node.name, parentId: node.parentId })) };
    if (request.operation === "node") {
      const node = request.nodeId === "root" ? tree.root : tree.nodes.find(node => node.id === request.nodeId);
      if (!node) throw new Error(`Search tree node not found: ${request.nodeId}`);
      return { revision, node };
    }
    if (request.operation === "subtree") {
      if (request.nodeId !== "root" && !tree.nodes.some(node => node.id === request.nodeId)) throw new Error("Search tree subtree does not exist");
      const included = new Set([request.nodeId]);
      for (let size = -1; size !== included.size;) {
        size = included.size;
        for (const node of tree.nodes) if (included.has(node.parentId)) included.add(node.id);
      }
      return { revision, ...(request.nodeId === "root" ? { root: tree.root } : {}), nodes: tree.nodes.filter(node => included.has(node.id)) };
    }
    if (request.operation === "history") {
      if (request.before) await this.snapshot(request.before);
      const commits = (await this.command(["log", `--max-count=${request.limit + 1}`, "--format=%H", request.before ?? revision, "--", "tree.json"]))
        .stdout.trim().split("\n").filter(Boolean);
      const entries = await Promise.all(commits.slice(0, request.limit).map(async commit => ({ revision: commit, ...(await this.document(commit)).update })));
      return { revision, entries, ...(commits[request.limit] ? { nextBefore: commits[request.limit] } : {}) };
    }
    if (request.operation === "input") {
      const input = tree.root.inputs.find(input => input.path === request.path);
      if (!input) throw new Error("Initial input is not part of this tree");
      const content = JSON.parse((await this.command(["cat-file", "blob", input.blob])).stdout);
      if (content.encoding !== "base64" || digest(Buffer.from(content.content, "base64")) !== input.sha256) throw new Error("Initial input snapshot integrity failure");
      return { ...input, ...content };
    }
    const payloadHash = digest(JSON.stringify(request));
    const receipt = await this.receipt(actor, request.requestId, payloadHash);
    if (receipt) return receipt;
    if (request.expectedRevision !== revision) throw new Error(`Search tree version conflict; current revision: ${revision}`);
    const nodeId = request.operation === "put" ? request.node.id : request.nodeId;
    const prior = tree.nodes.find(node => node.id === nodeId);
    if (nodeId === "root") throw new Error("The search tree root cannot be replaced or deleted");
    if (actor.kind === "agent" && (prior?.kind === "direction" || request.operation === "put" && request.node.kind === "direction"))
      throw new Error("Only the user may edit search directions");
    if (request.operation === "delete") {
      if (!prior) throw new Error("Search tree node does not exist");
      if (tree.nodes.some(node => node.parentId === nodeId)) throw new Error("Move child nodes before deleting their parent");
      tree.nodes = tree.nodes.filter(node => node.id !== nodeId);
    } else {
      if (prior && prior.kind !== request.node.kind) throw new Error("Search tree node kind is immutable");
      tree.nodes = [...tree.nodes.filter(node => node.id !== nodeId), request.node];
    }
    validateNodes(tree.nodes);
    tree.update = { requestId: request.requestId, payloadHash, actor, at: new Date().toISOString() };
    return this.save(tree, revision);
  }
  private async save(tree: SearchTreeDocument, expectedRevision: string | undefined): Promise<SearchTreeSnapshot> {
    const content = JSON.stringify(tree);
    if (Buffer.byteLength(content) > 4 * 1024 * 1024) throw new Error("Search tree metadata exceeds 4 MiB");
    const versions = [...new Set(tree.nodes.flatMap(node => node.kind === "candidate" && node.version.status === "committed" ? [node.version.commit] : []))];
    for (const commit of versions) {
      if ((await this.command(["cat-file", "-t", commit])).stdout.trim() !== "commit") throw new Error("Candidate version must be an actual business commit");
      const message = (await this.command(["show", "-s", "--format=%B", commit])).stdout;
      if (message.includes("ScienceEvolve-Search-Tree:")) throw new Error("Search tree metadata cannot be used as a business version");
    }
    const indexPath = path.join(this.repositoryPath, `openfars-management-search-tree-${randomUUID()}.index`);
    const environment = { ...identity, GIT_INDEX_FILE: indexPath };
    try {
      await this.command(expectedRevision ? ["read-tree", expectedRevision] : ["read-tree", "--empty"], undefined, environment);
      const blob = sha.parse((await this.command(["hash-object", "-w", "--stdin"], content)).stdout.trim());
      const entries = [`100644 ${blob}\ttree.json`, ...tree.root.inputs.map(input => `100644 ${input.blob}\tinput-${input.sha256}.json`)];
      await this.command(["update-index", "--index-info"], entries.join("\n") + "\n", environment);
      const treeSha = sha.parse((await this.command(["write-tree"], undefined, environment)).stdout.trim());
      const revision = sha.parse((await this.command(["commit-tree", treeSha, ...(expectedRevision ? ["-p", expectedRevision] : [])],
        `Record search tree update\n\nScienceEvolve-Search-Tree: ${this.projectId}\n`, identity)).stdout.trim());
      const refs = [`update ${REF} ${revision} ${expectedRevision ?? ZERO}`,
        `create ${this.requestRef(tree.update.actor, tree.update.requestId)} ${revision}`,
        ...versions.map(commit => `update refs/scienceevolve/search-tree/versions/${commit} ${commit}`)];
      try { await this.command(["update-ref", "--stdin"], ["start", ...refs, "prepare", "commit", ""].join("\n")); }
      catch (error) {
        // Resolve only this exact request. Never retry a mutation or select a new base.
        const retained = await this.receipt(tree.update.actor, tree.update.requestId, tree.update.payloadHash);
        if (retained) return retained;
        throw new Error(`Search tree update was not confirmed; inspect the current revision before retrying: ${(error as Error).message}`);
      }
      return { revision, tree };
    } finally { await fs.rm(indexPath, { force: true }); }
  }
}
