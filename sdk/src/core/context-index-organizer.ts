import { createHash, randomUUID } from "node:crypto";
import { constants, promises as fs } from "node:fs";
import path from "node:path";
import type { AgentContextIndex } from "./agent-context-index.js";
import type { SessionRef } from "./harness-runtime/contracts.js";
import { injectionTokenEstimate } from "./context-injection-budget.js";
import { redactTrace } from "./utils.js";

export interface ContextSummaryChild {
  id: string;
  metadata: Record<string, unknown>;
  summary?: string;
  path: string;
  total: number;
}
export interface ContextOrganizationJob {
  key: string;
  projectId: string;
  projectPath: string;
  baseDirectory: string;
  source: string;
  level: number;
  children: ContextSummaryChild[];
}
export interface ContextOrganizationResult {
  summary: string;
  items: Array<{ id: string; summary: string }>;
  groups: Array<{ summary: string; members: string[] }>;
}
export type ContextOrganizer = (job: ContextOrganizationJob, signal: AbortSignal) => Promise<ContextOrganizationResult>;
export type ContextSummaryLookup = (job: Omit<ContextOrganizationJob, "projectId" | "projectPath">) => Promise<ContextOrganizationResult | undefined>;

const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const directory = (projectPath: string) => path.join(projectPath, "runtime", "context-index");

/** Validate exact membership, not merely a model's claim of complete coverage.
 * A summary can neither invent a record nor discard a conflicting result. */
export function validateContextOrganization(value: unknown, children: readonly ContextSummaryChild[]): ContextOrganizationResult {
  if (!value || typeof value !== "object") throw new Error("Context organizer returned no structured result");
  const record = value as ContextOrganizationResult;
  const validText = (text: unknown, maximum: number): text is string => typeof text === "string" && text.trim().length > 0 && Buffer.byteLength(text) <= maximum;
  if (!validText(record.summary, 1600) || !Array.isArray(record.items) || !Array.isArray(record.groups) || !record.groups.length)
    throw new Error("Context organizer returned an invalid summary/group index");
  const expected = new Set(children.map(child => child.id));
  const items = new Set<string>();
  for (const item of record.items) {
    if (!item || !expected.has(item.id) || items.has(item.id) || !validText(item.summary, 700)) throw new Error("Context organizer changed or duplicated a source record");
    items.add(item.id);
  }
  if (items.size !== expected.size) throw new Error("Context organizer omitted source summaries");
  const grouped = new Set<string>();
  for (const group of record.groups) {
    if (!group || !validText(group.summary, 1600) || !Array.isArray(group.members) || !group.members.length)
      throw new Error("Context organizer returned an invalid group");
    for (const id of group.members) {
      if (!expected.has(id) || grouped.has(id)) throw new Error("Context organizer group coverage is not exact");
      grouped.add(id);
    }
  }
  if (grouped.size !== expected.size) throw new Error("Context organizer groups omitted source records");
  return { summary: record.summary.trim(), items: record.items.map(item => ({ id: item.id, summary: item.summary.trim() })),
    groups: record.groups.map(group => ({ summary: group.summary.trim(), members: [...group.members] })) };
}

/** Shared, bounded background queue. Cache keys depend on immutable source
 * identities, not invocation directories. Never hold up a business turn for
 * an LLM summary, and never recursively ask Explainer to summarize itself. */
export class ContextIndexOrganizer {
  private organizer?: ContextOrganizer;
  private readonly controller = new AbortController();
  private readonly pending = new Map<string, ContextOrganizationJob>();
  private readonly failures = new Map<string, number>();
  private readonly cached = new Map<string, ContextOrganizationResult>();
  private active?: Promise<void>;

  configure(organizer: ContextOrganizer): void { this.organizer = organizer; }

  lookup(projectId: string, projectPath: string): ContextSummaryLookup {
    return async input => {
      const job = { ...input, projectId, projectPath };
      if (!/^[a-f0-9]{64}$/.test(job.key)) return undefined;
      const id = `${projectPath}:${job.key}`;
      const known = this.cached.get(id);
      if (known) return known;
      if (this.pending.has(id) || (this.failures.get(id) ?? 0) >= Date.now()) return undefined;
      try {
        const saved = JSON.parse(await fs.readFile(path.join(directory(projectPath), "summaries", `${job.key}.json`), "utf8"));
        const result = validateContextOrganization(saved, job.children);
        this.remember(id, result); return result;
      } catch { /* A missing/invalid cache never supplies invented semantics. */ }
      if (this.organizer) {
        try {
          const status = JSON.parse(await fs.readFile(path.join(directory(projectPath), "status", `${job.key}.json`), "utf8"));
          if (typeof status.retryAfter === "number" && status.retryAfter > Date.now()) { this.failures.set(id, status.retryAfter); return undefined; }
        } catch { /* No cooldown. */ }
      }
      if (this.organizer && !this.controller.signal.aborted && (this.failures.get(id) ?? 0) < Date.now() && this.pending.size < 128) {
        try {
          // Interactive Explainer snapshots may be removed after its answer.
          // Retain referenced immutable records before queueing background work.
          const base = path.join(directory(projectPath), "sources");
          await fs.mkdir(path.join(base, "context-records"), { recursive: true, mode: 0o700 });
          const seen = new Set<string>();
          const retain = async (relative: string, isIndex: boolean): Promise<void> => {
            if (!/^context-records\/[a-f0-9]{64}\.json$/.test(relative)) throw new Error("Invalid context record reference");
            if (seen.has(relative)) return; seen.add(relative);
            const target = path.join(base, relative);
            const existing = await fs.lstat(target).catch(() => undefined);
            if (existing) {
              if (!existing.isFile() || existing.isSymbolicLink() || existing.nlink !== 1) throw new Error("Invalid retained context file");
              return;
            }
            const input = path.join(job.baseDirectory, relative);
            if (isIndex) {
              const index = JSON.parse(await fs.readFile(input, "utf8"));
              if (!/^context-index-(group|directory|tree)$/.test(index.kind) || !Array.isArray(index.entries)) throw new Error("Invalid context group index");
              for (const entry of index.entries) await retain(entry.path, !entry.detail);
            }
            // Publish the parent only after every referenced child is durable.
            await fs.copyFile(input, target, constants.COPYFILE_EXCL)
              .catch(error => { if (error.code !== "EEXIST") throw error; });
            await fs.chmod(target, 0o400);
          };
          for (const child of job.children) await retain(child.path, typeof child.metadata.index !== "number");
          this.pending.set(id, { ...job, baseDirectory: base });
          this.pump();
        } catch { this.failures.set(id, Date.now() + 5 * 60_000); }
      }
      return undefined;
    };
  }

  private remember(key: string, value: ContextOrganizationResult): void {
    this.cached.delete(key); this.cached.set(key, value);
    if (this.cached.size > 2048) this.cached.delete(this.cached.keys().next().value!);
  }

  private pump(): void {
    if (this.active || !this.organizer || this.controller.signal.aborted) return;
    this.active = this.run().finally(() => { this.active = undefined; if (this.pending.size) this.pump(); });
  }

  private async run(): Promise<void> {
    while (this.pending.size && !this.controller.signal.aborted) {
      const [id, job] = this.pending.entries().next().value!;
      this.pending.delete(id);
      // Mark active work too, so another publication cannot enqueue it again.
      this.failures.set(id, Number.POSITIVE_INFINITY);
      try {
        const result = validateContextOrganization(await this.organizer!(job, this.controller.signal), job.children);
        await atomicJson(path.join(directory(job.projectPath), "summaries", `${job.key}.json`), result);
        await fs.rm(path.join(directory(job.projectPath), "status", `${job.key}.json`), { force: true }).catch(() => undefined);
        this.remember(id, result); this.failures.delete(id);
      } catch (error) {
        const retryAfter = Date.now() + 5 * 60_000;
        this.failures.set(id, retryAfter);
        await atomicJson(path.join(directory(job.projectPath), "status", `${job.key}.json`), { schemaVersion: 1, source: job.source,
          failedAt: new Date().toISOString(), retryAfter, state: "factual-index-available",
          reason: redactTrace(error instanceof Error ? error.message : String(error)).slice(0, 512) }).catch(() => undefined);
        if (this.failures.size > 4096) this.failures.delete(this.failures.keys().next().value!);
      }
    }
  }

  async drain(): Promise<void> { while (this.active) await this.active; }
  async close(): Promise<void> { this.controller.abort(); this.pending.clear(); await this.active; }

  /** Merely preparing/sending a turn never advances the delivered version. */
  async delivery(index: AgentContextIndex | undefined, projectPath: string, recipient: string, session?: SessionRef): Promise<AgentContextIndex | undefined> {
    if (!index || !session?.durable) return index;
    const file = this.deliveryPath(projectPath, recipient, session);
    let previous: Record<string, string> = {};
    try { previous = JSON.parse(await fs.readFile(file, "utf8")).sources ?? {}; } catch { /* Fresh native context. */ }
    const preview = [index.header, ...index.sourcePreviews.map(source => previous[source.key] === source.version
      ? `- ${source.key}: unchanged; complete current index remains at the context index below.` : source.preview), index.footer].join("\n");
    return { ...index, preview: injectionTokenEstimate(preview) <= 16_384 ? preview : index.compactPreview };
  }

  async acknowledge(index: AgentContextIndex | undefined, projectPath: string, recipient: string, session?: SessionRef): Promise<void> {
    if (!index || !session?.durable) return;
    const file = this.deliveryPath(projectPath, recipient, session);
    let previous: Record<string, string> = {};
    try { previous = JSON.parse(await fs.readFile(file, "utf8")).sources ?? {}; } catch { /* First delivery. */ }
    await atomicJson(file, {
      schemaVersion: 1, sources: { ...previous, ...Object.fromEntries(index.sourcePreviews.map(source => [source.key, source.version])) }
    });
  }

  private deliveryPath(projectPath: string, recipient: string, session: SessionRef): string {
    return path.join(directory(projectPath), "delivered", `${hash([recipient, session.harnessId, session.nativeId, session.generation])}.json`);
  }
}

async function atomicJson(file: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  const temporary = `${file}.${randomUUID()}.tmp`;
  try { await fs.writeFile(temporary, `${JSON.stringify(value)}\n`, { mode: 0o600 }); await fs.rename(temporary, file); }
  finally { await fs.rm(temporary, { force: true }); }
}
