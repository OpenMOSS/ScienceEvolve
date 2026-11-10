import { promises as fs } from "node:fs";
import type { FileHandle } from "node:fs/promises";
import type { TimelineEvent } from "./types.js";

interface Position { start: number; end: number; seq: number }
interface Block { start: number; end: number; count: number; minSeq: number; maxSeq: number }
interface IndexedLog {
  identity: string;
  modified: number;
  size: number;
  blocks: Block[];
  timeline: Position[];
}
export interface EventLogSnapshot {
  file: string;
  size: number;
  blocks: readonly Block[];
  timeline: readonly Position[];
  totalEvents: number;
  lastSeq: number;
}

/** Read a fixed byte prefix. Incomplete terminal lines belong to the next
 * append, and decoding after finding LF preserves split UTF-8 characters. */
async function readLines(file: string, start: number, end: number,
  visit: (event: TimelineEvent, position: Position) => Promise<boolean | void> | boolean | void,
  signal?: AbortSignal, reader?: FileHandle): Promise<number> {
  if (start >= end || signal?.aborted) return start;
  const handle = reader ?? await fs.open(file, "r");
  let offset = start, lineStart = start, carry = Buffer.alloc(0);
  try {
    while (offset < end && !signal?.aborted) {
      const buffer = Buffer.allocUnsafe(Math.min(256 * 1024, end - offset));
      const { bytesRead } = await handle.read(buffer, 0, buffer.length, offset);
      if (!bytesRead) throw new Error("Event log changed while reading its committed prefix");
      offset += bytesRead;
      const data = carry.length ? Buffer.concat([carry, buffer.subarray(0, bytesRead)]) : buffer.subarray(0, bytesRead);
      let cursor = 0, newline: number;
      while ((newline = data.indexOf(10, cursor)) !== -1) {
        const next = lineStart + newline - cursor + 1;
        let event: TimelineEvent | undefined;
        try { event = JSON.parse(data.subarray(cursor, newline).toString("utf8")) as TimelineEvent; }
        catch { /* A malformed historical diagnostic is not an event. */ }
        if (event && Number.isSafeInteger(event.seq) && event.seq > 0) {
          const result = visit(event, { start: lineStart, end: next, seq: event.seq });
          if ((result instanceof Promise ? await result : result) === false) return next;
        }
        lineStart = next; cursor = newline + 1;
        if (signal?.aborted) return lineStart;
      }
      carry = Buffer.from(data.subarray(cursor));
    }
    return lineStart;
  } finally { if (!reader) await handle.close(); }
}

/** Rebuildable byte offsets into the original audit log, never another source
 * of event bodies. Startup reconciliation warms this index; later reads index
 * only appended bytes and seek directly to the requested history page. */
export class EventLogIndex {
  private readonly logs = new Map<string, IndexedLog>();
  private readonly reads = new Map<string, Promise<void>>();
  constructor(private readonly isTimeline: (event: TimelineEvent) => boolean) {}

  forget(file: string): void { this.logs.delete(file); }

  async snapshot(file: string, size: number): Promise<EventLogSnapshot> {
    const previous = this.reads.get(file);
    let release!: () => void;
    const settled = new Promise<void>(resolve => { release = resolve; });
    this.reads.set(file, settled);
    try {
      if (previous) await previous;
      const stat = await fs.stat(file), identity = `${stat.dev}:${stat.ino}`;
      if (stat.size < size) throw new Error("Event log was truncated before its snapshot could be read");
      let log = this.logs.get(file);
      if (!log || log.identity !== identity || stat.size < log.size ||
        stat.size === log.size && stat.mtimeMs !== log.modified) {
        log = { identity, modified: stat.mtimeMs, size: 0, blocks: [], timeline: [] };
        this.logs.set(file, log);
      }
      if (log.size < size) {
        const index = log;
        index.size = await readLines(file, index.size, size, (event, position) => {
          let block = index.blocks.at(-1);
          if (!block || block.count === 128) {
            block = { start: position.start, end: position.end, count: 0, minSeq: event.seq, maxSeq: event.seq };
            index.blocks.push(block);
          }
          block.count++; block.end = position.end;
          block.minSeq = Math.min(block.minSeq, event.seq); block.maxSeq = Math.max(block.maxSeq, event.seq);
          if (this.isTimeline(event)) index.timeline.push(position);
        });
        index.modified = stat.mtimeMs;
      }
      const blocks = log.blocks.filter(block => block.start < size).map(block => ({ ...block }));
      const last = blocks.at(-1);
      if (last && last.end > size) {
        last.count = 0; last.minSeq = Infinity; last.maxSeq = 0; last.end = size;
        await readLines(file, last.start, size, event => {
          last.count++; last.minSeq = Math.min(last.minSeq, event.seq); last.maxSeq = Math.max(last.maxSeq, event.seq);
        });
      }
      return { file, size, blocks, timeline: log.timeline.filter(position => position.end <= size),
        totalEvents: blocks.reduce((total, block) => total + block.count, 0),
        lastSeq: blocks.reduce((last, block) => Math.max(last, block.maxSeq), 0) };
    } finally {
      release(); if (this.reads.get(file) === settled) this.reads.delete(file);
    }
  }

  async page(snapshot: EventLogSnapshot, before: number, limit: number): Promise<{ events: TimelineEvent[]; hasMore: boolean }> {
    let events: TimelineEvent[] = [];
    for (let index = snapshot.blocks.length - 1; index >= 0 && events.length <= limit; index--) {
      const block = snapshot.blocks[index]!;
      if (block.minSeq >= before) continue;
      const page: TimelineEvent[] = [];
      await readLines(snapshot.file, block.start, Math.min(block.end, snapshot.size), event => {
        if (event.seq < before) page.push(event);
      });
      events = [...page, ...events];
    }
    return { events: events.slice(-limit), hasMore: events.length > limit };
  }

  async timeline(snapshot: EventLogSnapshot, limit: number): Promise<TimelineEvent[]> {
    return (await this.timelinePage(snapshot, Infinity, limit)).events;
  }

  async timelinePage(snapshot: EventLogSnapshot, before: number, limit: number): Promise<{ events: TimelineEvent[]; hasMore: boolean }> {
    const positions = snapshot.timeline.filter(position => position.seq < before);
    const events: TimelineEvent[] = [];
    const handle = await fs.open(snapshot.file, "r");
    try {
      for (const position of positions.slice(-limit)) {
        await readLines(snapshot.file, position.start, position.end, event => { events.push(event); }, undefined, handle);
      }
    } finally { await handle.close(); }
    return { events, hasMore: positions.length > limit };
  }

  async replay(snapshot: EventLogSnapshot, after: number,
    visit: (event: TimelineEvent) => Promise<boolean | void> | boolean | void, signal?: AbortSignal): Promise<void> {
    const first = snapshot.blocks.find(block => block.maxSeq > after);
    if (!first) return;
    await readLines(snapshot.file, first.start, snapshot.size, event => event.seq > after ? visit(event) : undefined, signal);
  }
}
