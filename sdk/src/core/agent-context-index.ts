import { createHash, randomUUID } from "node:crypto";
import { constants, promises as fs } from "node:fs";
import path from "node:path";
import { redactTrace } from "./utils.js";
import type { ContextSummaryChild, ContextSummaryLookup } from "./context-index-organizer.js";
import { injectionTokenEstimate } from "./context-injection-budget.js";

/** Server-owned context, kept out of model messages until explicitly read. */
export interface AgentContextSource {
  key: string;
  label: string;
  records: unknown[];
  kind?: "current" | "history";
}
export interface AgentContextIndex {
  indexPath: string;
  preview: string;
  compactPreview: string;
  minimalPreview: string;
  header: string;
  footer: string;
  sourcePreviews: Array<{ key: string; version: string; preview: string }>;
}
export type AgentContextPublisher = (sources: readonly AgentContextSource[]) => Promise<string>;

export class AgentContextSources {
  readonly sources: AgentContextSource[] = [];
  record(key: string, label: string, value: unknown, kind?: AgentContextSource["kind"]): string {
    return this.list(key, label, [value], kind);
  }
  list(key: string, label: string, records: readonly unknown[], kind?: AgentContextSource["kind"]): string {
    this.sources.push({ key, label, records: [...records], ...(kind ? { kind } : {}) });
    return `${label}: ${records.length} record(s), source=${JSON.stringify(key)} in the on-demand context index. Open its list and only the relevant detail records.`;
  }
  fields(prefix: string, label: string, value: Record<string, unknown>, kind?: AgentContextSource["kind"]): string {
    const notices: string[] = [];
    const metadata: Record<string, unknown> = {};
    for (const [key, data] of Object.entries(value)) {
      if (Array.isArray(data)) notices.push(this.list(`${prefix}.${key}`, `${label} / ${key}`, data, kind));
      else if (data && typeof data === "object") {
        if (["agents", "skillDefinitions", "mcpDefinitions", "routes", "decisionPlans"].includes(key)) {
          const records = Object.entries(data).map(([name, value]) => key === "agents"
            ? { agentId: name, ...(value && typeof value === "object" && !Array.isArray(value) ? value : { value }) }
            : { name, definition: value });
          notices.push(this.list(`${prefix}.${key}`, `${label} / ${key}`, records, kind));
        } else if (["scopedRuntime", "draft", "catalog", "project", "workflow", "evidence", "orchestration", "scopedWorkflow"].includes(key)) {
          notices.push(this.fields(`${prefix}.${key}`, `${label} / ${key}`, data as Record<string, unknown>, kind));
        }
        else notices.push(this.record(`${prefix}.${key}`, `${label} / ${key}`, data, kind));
      } else if (typeof data === "string" && data.length > 1000) {
        notices.push(this.record(`${prefix}.${key}`, `${label} / ${key}`, data, kind));
      } else metadata[key] = data;
    }
    if (Object.keys(metadata).length) notices.unshift(this.record(`${prefix}.metadata`, `${label} / metadata`, metadata, kind));
    return notices.join("\n");
  }
}

const digest = (text: string) => createHash("sha256").update(text).digest("hex");
const json = (value: unknown) => `${redactTrace(JSON.stringify(value, null, 2) ?? "null")}\n`;
const brief = (value: string, maximum: number) => value.replace(/[\r\n]+/g, " ").slice(0, maximum);

/** Metadata only: never copy outputs, instructions, requests, memories, or
 * arbitrary extension fields into a default list response. */
export function agentContextRecordMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  return Object.fromEntries(["id", "requestId", "invocationId", "operationId", "executionId", "taskId", "agentId",
    "groupRunId", "groupId", "nodeId", "nodeRunId", "arrivalRequestId", "sourceRunId", "ownerExecutionId", "path", "name", "kind", "type", "status", "role", "model", "harness", "gatewayId", "nativeProtocol", "gatewayProtocol", "ownershipEpoch", "coordinatorEpoch", "createdAt", "recordedAt", "updatedAt", "completedAt", "finishedAt", "ts", "bytes", "size"]
    .flatMap(key => typeof record[key] === "string" && (record[key] as string).length <= 1024 ||
      typeof record[key] === "number" || typeof record[key] === "boolean" ? [[key, record[key]]] : []));
}

/** Current information is classified by validity, never merely its age. A
 * failed/stopped receipt without proof of resolution is still current. */
export function contextRecordKind(source: AgentContextSource, value: unknown): "current" | "history" {
  if (source.kind) return source.kind;
  const record = value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
  const status = String(record.status ?? record.state ?? "").toLowerCase();
  if (record.resolved === false || record.requiresAction === true || record.pending === true ||
    /^(running|queued|pending|retrying|waiting|blocked|active|ready|assigned|working|continuation_pending|pausing|paused|in_progress|unresolved|awaiting.*)$/.test(status)) return "current";
  if (record.resolved === true || /^(completed|succeeded|success|merged|resolved|recovered|cancelled|canceled|superseded|historical|archived)$/.test(status)) return "history";
  if (/^(failed|failure|error|stopped|aborted|interrupted|rejected|timed_out|timeout|exhausted|stalled|needs_repair)$/.test(status)) return "current";
  return /(?:history|conversation|previous|earlier|completed|attempts|journal)/i.test(source.key) ? "history" : "current";
}

interface IndexNode extends ContextSummaryChild {
  kind: "current" | "history";
  detail?: { path: string; bytes: number; sha256: string };
}

const DIRECTORY_FIELD_LIMITS: Record<string, number> = { id: 256, name: 160, status: 64, agentId: 128, path: 512, kind: 64, type: 64,
  operationId: 192, executionId: 192, taskId: 192, invocationId: 192, requestId: 192, nodeId: 192, groupId: 192,
  model: 256, harness: 64, role: 64, createdAt: 64, recordedAt: 64, completedAt: 64, finishedAt: 64, ts: 64, updatedAt: 64,
  from: 256, through: 256 };

/** Display labels only. Exact IDs/fields remain in the flat index and original
 * detail, so an oversized ID is omitted rather than deceptively truncated. */
function directoryMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(metadata).flatMap<[string, unknown]>(([key, value]) => {
    if (key === "index" && typeof value === "number") return [[key, value]];
    if (!DIRECTORY_FIELD_LIMITS[key] || typeof value !== "string") return [];
    if (Buffer.byteLength(value) <= DIRECTORY_FIELD_LIMITS[key]) return [[key, value]];
    if (key !== "name") return [];
    let text = "";
    for (const character of value) { if (Buffer.byteLength(text + character) > DIRECTORY_FIELD_LIMITS[key] - 3) break; text += character; }
    return [[key, `${text}…`]];
  }));
}

/** Every original remains in the complete source list. A bounded tree covers
 * all history, while current facts retain a separate, non-historical index.
 * Semantic organization is supplied asynchronously by Project Explainer. */
export async function publishAgentContextIndex(inboxPath: string,
  supplied: readonly AgentContextSource[], options: { lookup?: ContextSummaryLookup; previewBudgetTokens?: number;
    groupSize?: number; recentRecords?: number; maxHistoryGroups?: number } = {}): Promise<AgentContextIndex | undefined> {
  if (!supplied.length) return undefined;
  const sources = [...new Map(supplied.map(source => [source.key, source])).values()];
  const parent = path.resolve(path.dirname(inboxPath));
  await pinnedDirectory(parent);
  const base = path.join(parent, "context-records");
  await pinnedDirectory(base);
  // The filesystem MCP resolves paths from its selected root, not from the
  // file last opened. The Inbox directory already has an authorized root.
  const referencePath = (file: string) => path.relative(parent, file).split(path.sep).join("/");
  const sourceEntries: Array<Record<string, unknown>> = [];
  const sourcePreviews: AgentContextIndex["sourcePreviews"] = [];
  const setting = (value: number | undefined, fallback: number, minimum: number, maximum: number) =>
    Number.isSafeInteger(value) && value! >= minimum && value! <= maximum ? value! : fallback;
  const batchSize = setting(options.groupSize, 10, 2, 64), recentRecords = setting(options.recentRecords, 10, 1, 100);
  const maxGroups = setting(options.maxHistoryGroups, 10, 2, 32), keepGroups = Math.max(1, Math.floor(maxGroups / 2));
  for (const source of sources) {
    const entries: Array<Record<string, unknown>> = [];
    const current: IndexNode[] = [], history: IndexNode[] = [];
    const occurrences = new Map<string, number>();
    for (const [index, value] of source.records.entries()) {
      const text = json(value);
      const hash = digest(text);
      const file = path.join(base, `${hash}.json`);
      await immutableFile(file, text);
      const metadata = agentContextRecordMetadata(value);
      const kind = contextRecordKind(source, value);
      const detail = { path: referencePath(file), bytes: Buffer.byteLength(text), sha256: hash };
      entries.push({ index, ...metadata, contextKind: kind, detail });
      const occurrence = occurrences.get(hash) ?? 0; occurrences.set(hash, occurrence + 1);
      const node: IndexNode = { id: `${hash}:${occurrence}`, metadata: { index, ...metadata }, kind, path: referencePath(file), total: 1, detail };
      (kind === "current" ? current : history).push(node);
    }
    const stamp = (node: IndexNode) => ["createdAt", "recordedAt", "completedAt", "finishedAt", "ts", "updatedAt"]
      .map(key => node.metadata[key]).find(value => typeof value === "string" && Number.isFinite(Date.parse(value))) as string | undefined;
    history.sort((left, right) => (stamp(left) ? Date.parse(stamp(left)!) : Number.MIN_SAFE_INTEGER + Number(left.metadata.index)) -
      (stamp(right) ? Date.parse(stamp(right)!) : Number.MIN_SAFE_INTEGER + Number(right.metadata.index)));
    const range = (children: IndexNode[]): Record<string, unknown> => ({
      from: children[0]?.metadata.from ?? stamp(children[0]) ?? children[0]?.metadata.id ?? children[0]?.metadata.index,
      through: children.at(-1)?.metadata.through ?? stamp(children.at(-1)!) ?? children.at(-1)?.metadata.id ?? children.at(-1)?.metadata.index
    });
    const boundedEntries = async (nodes: IndexNode[]): Promise<IndexNode[]> => {
      let rows = nodes.map(node => ({ ...node, metadata: directoryMetadata(node.metadata) }));
      while (Buffer.byteLength(JSON.stringify(rows)) > 12_000 && rows.length > 1) {
        const batches: IndexNode[][] = []; let batch: IndexNode[] = [], bytes = 0;
        for (const row of rows) {
          const cost = Buffer.byteLength(JSON.stringify(row));
          if (batch.length && (batch.length >= 10 || bytes + cost > 10_000)) { batches.push(batch); batch = []; bytes = 0; }
          batch.push(row); bytes += cost;
        }
        if (batch.length) batches.push(batch);
        rows = await Promise.all(batches.map(async members => {
          const total = members.reduce((sum, node) => sum + node.total, 0), kind = members[0].kind;
          const file = await indexFile(base, { kind: "context-index-directory", source: source.key,
            baseDirectory: parent, totalRecords: total }, members);
          return { id: digest(JSON.stringify(members.map(node => node.id))), metadata: directoryMetadata(range(members)),
            kind, total, path: referencePath(file), summary: `${total} ${kind} records; expand the complete member directory.` };
        }));
      }
      return rows;
    };
    const section = async (nodes: IndexNode[], kind: IndexNode["kind"], label: string): Promise<IndexNode[]> => {
      if (!nodes.length) return [];
      const total = nodes.reduce((sum, node) => sum + node.total, 0);
      const file = await indexFile(base, { kind: "context-index-directory", source: source.key, label, baseDirectory: parent,
        totalRecords: total }, await boundedEntries(nodes));
      return [{ id: digest(file), metadata: { name: label }, kind, total, path: referencePath(file), summary: label }];
    };
    const group = async (children: IndexNode[], level: number): Promise<IndexNode> => {
      const key = digest(JSON.stringify([source.key, level, children.map(child => [child.id, child.summary])]));
      const organized = await options.lookup?.({ key, baseDirectory: parent, source: source.key, level,
        children: children.map(({ id, metadata, summary, path, total }) => ({ id, metadata, summary, path, total })) });
      const total = children.reduce((sum, child) => sum + child.total, 0);
      const withSummaries = children.map(child => ({ ...child,
        ...(organized ? { summary: organized.items.find(item => item.id === child.id)!.summary } : {}) }));
      let grouped = withSummaries;
      if (organized && organized.groups.length > 1) {
        grouped = await Promise.all(organized.groups.map(async selected => {
          const members = withSummaries.filter(child => selected.members.includes(child.id));
          const total = members.reduce((sum, child) => sum + child.total, 0);
          const file = await indexFile(base, { kind: "context-index-group", source: source.key, baseDirectory: parent, totalRecords: total, summary: selected.summary }, await boundedEntries(members));
          return { id: digest(JSON.stringify(selected.members)), metadata: range(members), kind: "history" as const, summary: selected.summary,
            path: referencePath(file), total };
        }));
      }
      const summary = organized?.summary ?? `${total} historical records; expand this complete group for individual entries.`;
      const file = await indexFile(base, { kind: "context-index-group", source: source.key, baseDirectory: parent, totalRecords: total, summary }, await boundedEntries(grouped));
      return { id: key, metadata: range(children), kind: "history", summary, total, path: referencePath(file) };
    };
    // Stable oldest-first batches: appending a result does not re-summarize
    // every previous batch. Recent batches remain individually visible.
    const older: IndexNode[] = [];
    const recent: IndexNode[] = [];
    for (let start = 0; start < history.length; start += batchSize) {
      const batch = history.slice(start, start + batchSize);
      const node = await group(batch, 0);
      if (start + batchSize <= history.length - recentRecords) older.push(node);
      else {
        const saved = await fs.readFile(path.join(parent, node.path), "utf8");
        const root = JSON.parse(saved) as { entries: IndexNode[] };
        // Agent-defined groups retain the exact member list; recent leaves
        // still get their per-record summaries without flattening all history.
        const collect = async (nodes: IndexNode[]): Promise<IndexNode[]> => {
          const leaves: IndexNode[] = [];
          for (const child of nodes) {
            if (child.detail) leaves.push(child);
            else leaves.push(...await collect((JSON.parse(await fs.readFile(path.join(parent, child.path), "utf8")) as { entries: IndexNode[] }).entries));
          }
          return leaves;
        };
        recent.push(...await collect(root.entries));
      }
    }
    let roots = older, level = 1;
    while (roots.length > maxGroups) {
      const keep = roots.slice(-keepGroups), preceding = roots.slice(0, -keepGroups), next: IndexNode[] = [];
      for (let start = 0; start < preceding.length; start += batchSize) next.push(await group(preceding.slice(start, start + batchSize), level));
      roots = [...next, ...keep]; level++;
    }
    const sections = [...await section(current, "current", "Current records (not aged history)"),
      ...await section(roots, "history", "Older grouped history"), ...await section(recent, "history", "Recent individual records")];
    const treePath = await indexFile(base, { kind: "context-index-tree", source: source.key, baseDirectory: parent,
      totalRecords: entries.length, currentRecords: current.length, historicalRecords: history.length }, sections);
    const indexPath = await indexFile(base, { source: source.key, label: source.label, baseDirectory: parent,
      tree: { path: referencePath(treePath) }, currentRecords: current.length, historicalRecords: history.length }, entries);
    sourceEntries.push({ key: source.key, label: source.label, total: entries.length,
      list: { path: referencePath(indexPath) }, tree: { path: referencePath(treePath) } });
    const heading = `- ${brief(source.label, 120)}: ${entries.length} record(s); source=${JSON.stringify(source.key)}; current=${current.length}; history=${history.length}; tree=${referencePath(treePath)}.`;
    const visibleCurrent = current.length > 20 ? sections.filter(node => node.kind === "current") : current;
    const rows = [...visibleCurrent, ...roots, ...recent].map(node => `  ${redactTrace(JSON.stringify({ ...directoryMetadata(node.metadata),
      ...(node.summary ? { summary: node.summary } : {}), contextKind: node.kind, total: node.total,
      ...(node.detail ? { detail: { path: node.path, bytes: node.detail.bytes } } : { group: { path: node.path } }) }))}`);
    const body = `${heading}\n${rows.join("\n")}`;
    sourcePreviews.push({ key: source.key,
      version: digest(JSON.stringify([source.key, entries.map(entry => [(entry.detail as { sha256: string }).sha256, entry.contextKind]),
        [...roots, ...recent].map(node => [node.id, node.summary])])),
      preview: body });
  }
  const indexPath = await indexFile(base, { kind: "agent-context-index", baseDirectory: parent }, sourceEntries);
  const header = "On-demand context sources (current indexes and hierarchical history; detail bodies are not in this message):";
  const footer = [
    `Context index: ${indexPath}`,
    `Context path base (Invocation Inbox directory): ${parent}`,
    "All records remain discoverable without pagination. Expand a tree/group to its complete member index, then select detail.path. The complete flat list is retained for explicit audits; do not read all details by default. Current unresolved facts are not aged into history. All list.path, group.path and detail.path values are relative to the Invocation Inbox directory (baseDirectory), including context-records/. Use that directory's authorized rootId and the complete path, not a bare hash filename or the last-opened file's directory. Read long individual details in bounded sections. Summaries and immutable history never override formal current state, permissions or actual tool results."
  ].join("\n");
  const compactPreview = [header, ...sourceEntries.map(entry => `- source=${JSON.stringify(entry.key)}; total=${entry.total}; tree=${(entry.tree as { path: string }).path}`), footer].join("\n");
  const minimalPreview = [header, `Complete source directory (${sources.length} sources); open its selected tree, then any member/detail.`, footer].join("\n");
  const expanded = [header, ...sourcePreviews.map(source => source.preview), footer].join("\n");
  const limit = options.previewBudgetTokens ?? 16_384;
  const preview = injectionTokenEstimate(expanded) <= limit ? expanded : injectionTokenEstimate(compactPreview) <= limit ? compactPreview : minimalPreview;
  return { indexPath, preview, compactPreview, minimalPreview, header, footer, sourcePreviews };
}

async function indexFile(directory: string, metadata: Record<string, unknown>, entries: unknown[]): Promise<string> {
  const text = json({ ...metadata, total: entries.length, entries });
  const file = path.join(directory, `${digest(text)}.json`);
  await immutableFile(file, text);
  return file;
}

async function pinnedDirectory(directory: string): Promise<void> {
  try { await fs.mkdir(directory, { mode: 0o700 }); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; }
  const stat = await fs.lstat(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink() || await fs.realpath(directory) !== directory)
    throw new Error("Agent context directory must be a pinned regular directory");
}

const pendingFiles = new Map<string, Promise<void>>();
async function immutableFile(file: string, text: string): Promise<void> {
  const existing = pendingFiles.get(file);
  if (existing) return existing;
  const pending = writeImmutableFile(file, text);
  pendingFiles.set(file, pending);
  try { await pending; }
  finally { if (pendingFiles.get(file) === pending) pendingFiles.delete(file); }
}

async function writeImmutableFile(file: string, text: string): Promise<void> {
  const verify = async (): Promise<boolean> => {
    let handle;
    try { handle = await fs.open(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0)); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return false; throw error; }
    try {
      const stat = await handle.stat();
      if (!stat.isFile() || stat.nlink !== 1 || await handle.readFile("utf8") !== text)
        throw new Error("Agent context record differs from its immutable source");
      return true;
    } finally { await handle.close(); }
  };
  if (await verify()) return;
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    const handle = await fs.open(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | (constants.O_NOFOLLOW ?? 0), 0o400);
    try { await handle.writeFile(text, "utf8"); } finally { await handle.close(); }
    // Publish a complete file atomically. Concurrent identical publishers
    // never expose a partially written record or change its content identity.
    if (!await verify()) await fs.rename(temporary, file);
  } finally { await fs.rm(temporary, { force: true }); }
}
