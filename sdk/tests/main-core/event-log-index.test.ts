import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import { EventLogIndex } from "../../src/core/event-log-index.js";
import type { TimelineEvent } from "../../src/core/types.js";

const roots: string[] = [];
afterEach(async () => { vi.restoreAllMocks(); await Promise.all(roots.splice(0).map(root => fs.rm(root, { recursive: true, force: true }))); });
async function fixture(events: Array<{ seq: number; type?: string; message?: string }>) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "event-page-index-")); roots.push(root);
  const file = path.join(root, "events.jsonl");
  await fs.writeFile(file, events.map(event => JSON.stringify({ type: "agent.trace", ...event })).join("\n") + "\n");
  const index = new EventLogIndex(event => event.type === "handoff.saved");
  const snapshot = await index.snapshot(file, (await fs.stat(file)).size);
  return { file, index, snapshot };
}

it("seeks to a history page and SSE cursor without rereading old trace bodies", async () => {
  const f = await fixture(Array.from({ length: 3000 }, (_, i) => ({ seq: (i + 1) * 2,
    type: i % 100 === 0 ? "handoff.saved" : "agent.trace", message: "科学🧪".repeat(128) })));
  const open = fs.open.bind(fs); let bytes = 0;
  vi.spyOn(fs, "open").mockImplementation(async (...args) => {
    const handle = await open(...args), read = handle.read.bind(handle);
    vi.spyOn(handle, "read").mockImplementation(async (...input: any[]) => {
      const result = await (read as any)(...input); bytes += result.bytesRead; return result;
    });
    return handle;
  });
  const page = await f.index.page(f.snapshot, 3000, 10);
  expect(page.events.map(event => event.seq)).toEqual(Array.from({ length: 10 }, (_, i) => 2980 + i * 2));
  expect(page.hasMore).toBe(true);
  const seen: number[] = [];
  await f.index.replay(f.snapshot, 5990, event => { seen.push(event.seq); });
  expect(seen).toEqual([5992, 5994, 5996, 5998, 6000]);
  expect((await f.index.timeline(f.snapshot, 3)).map(event => event.seq)).toEqual([5402, 5602, 5802]);
  const timelinePage = await f.index.timelinePage(f.snapshot, 5402, 3);
  expect(timelinePage.events.map(event => event.seq)).toEqual([4802, 5002, 5202]);
  expect(timelinePage.hasMore).toBe(true);
  const firstTimeline = await f.index.timelinePage(f.snapshot, 202, 3);
  expect(firstTimeline.events.map(event => event.seq)).toEqual([2]);
  expect(firstTimeline.hasMore).toBe(false);
  expect(f.snapshot.totalEvents).toBe(3000); expect(f.snapshot.lastSeq).toBe(6000);
  expect(bytes).toBeLessThan(f.snapshot.size / 4);
});

it("keeps an older byte snapshot stable while indexing later appends", async () => {
  const f = await fixture([{ seq: 1 }, { seq: 3, type: "handoff.saved", message: "原始输出" }]);
  await fs.appendFile(f.file, JSON.stringify({ seq: 4, type: "handoff.saved", message: "later" }) + "\n");
  const newer = await f.index.snapshot(f.file, (await fs.stat(f.file)).size);
  const older = await f.index.snapshot(f.file, f.snapshot.size);
  expect((await f.index.page(older, Infinity, 10)).events.map(event => event.seq)).toEqual([1, 3]);
  expect(older.totalEvents).toBe(2); expect(older.lastSeq).toBe(3);
  expect((await f.index.timeline(older, 10)).map(event => event.seq)).toEqual([3]);
  expect(newer.totalEvents).toBe(3);
});

it("rebuilds after truncation and retains nonmonotonic historical events", async () => {
  const f = await fixture([{ seq: 1 }, { seq: 4 }, { seq: 2 }, { seq: 3 }]);
  expect((await f.index.page(f.snapshot, 3, 10)).events.map(event => event.seq)).toEqual([1, 2]);
  await fs.writeFile(f.file, JSON.stringify({ seq: 7, type: "agent.trace" }) + "\n");
  const snapshot = await f.index.snapshot(f.file, (await fs.stat(f.file)).size);
  expect(snapshot.totalEvents).toBe(1);
  expect((await f.index.page(snapshot, Infinity, 10)).events.map(event => event.seq)).toEqual([7]);
});

it("decodes long UTF-8 frames and excludes malformed or incomplete tail records", async () => {
  const message = "完整科学记录🧪".repeat(40_000);
  const f = await fixture([{ seq: 1, message }]);
  await fs.appendFile(f.file, "invalid\n{\"seq\":2");
  const snapshot = await f.index.snapshot(f.file, (await fs.stat(f.file)).size);
  const page = await f.index.page(snapshot, Infinity, 1);
  expect(page.events[0]?.message).toBe(message); expect(snapshot.totalEvents).toBe(1);
  await fs.appendFile(f.file, ",\"type\":\"agent.trace\"}\n");
  const completed = await f.index.snapshot(f.file, (await fs.stat(f.file)).size);
  expect(completed.totalEvents).toBe(2);
  expect((await f.index.page(completed, Infinity, 1)).events[0]?.seq).toBe(2);
});
