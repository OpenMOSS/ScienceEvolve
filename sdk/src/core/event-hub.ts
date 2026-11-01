import type {
  AgentName,
  InvocationPerformance,
  LiveAssistantStream,
  ProjectLiveSnapshot,
  ProjectRuntimeProjection,
  TimelineEvent
} from "./types.js";
import type { HarnessEvent } from "./harness-runtime/contracts.js";
import { redactTrace } from "./utils.js";
import {
  ASSISTANT_DISPLAY_CHARACTER_LIMIT,
  truncateUnicodePrefix
} from "./content-limits.js";

type EventListener = (event: TimelineEvent) => void;
type LiveListener = (snapshot: ProjectLiveSnapshot) => void;

const LIVE_FLUSH_MS = 100;
const ASSISTANT_LIVE_LIMIT = ASSISTANT_DISPLAY_CHARACTER_LIMIT;
const PERSISTED_LIVE_KEY_LIMIT = 4_096;

/**
 * `redactTrace` always receives the complete text accumulated so far, which
 * lets it recognise credentials split across provider chunks.  Mask the two
 * credential forms whose minimum-length rule could otherwise expose a short
 * prefix for one snapshot before the following chunk arrives.
 */
function redactLiveTrace(value: string): string {
  return redactTrace(value)
    .replace(/\bsk-[A-Za-z0-9_-]*$/gi, "[REDACTED]")
    .replace(/\b(?:Bearer|Basic)\s+[A-Za-z0-9._~+/=-]*$/gi, "[REDACTED]");
}

export class EventHub {
  private readonly allListeners = new Set<EventListener>();

  subscribeAll(listener: EventListener): () => void {
    this.allListeners.add(listener);
    return () => { this.allListeners.delete(listener); };
  }
  private readonly listeners = new Map<string, Set<EventListener>>();
  private readonly liveListeners = new Map<string, Set<LiveListener>>();
  private readonly liveStreams = new Map<string, Map<string, LiveAssistantStream>>();
  private readonly liveHarnessEvents = new Map<string, Map<string, TimelineEvent>>();
  private readonly rawLiveContent = new Map<string, string>();
  private readonly livePerformance = new Map<string, InvocationPerformance>();
  private readonly runtimeProjections = new Map<string, ProjectRuntimeProjection>();
  private readonly liveFlushTimers = new Map<string, NodeJS.Timeout>();
  private readonly persistedLiveKeys = new Map<string, Set<string>>();

  subscribe(projectId: string, listener: EventListener): () => void {
    const projectListeners = this.listeners.get(projectId) ?? new Set<EventListener>();
    projectListeners.add(listener);
    this.listeners.set(projectId, projectListeners);

    return () => {
      projectListeners.delete(listener);
      if (projectListeners.size === 0) {
        this.listeners.delete(projectId);
      }
    };
  }

  publish(event: TimelineEvent): void {
    this.retirePersistedHarnessEvent(event);
    for (const listener of this.allListeners) listener(event);
    for (const listener of this.listeners.get(event.projectId) ?? []) {
      listener(event);
    }
  }

  subscribeLive(projectId: string, listener: LiveListener): () => void {
    const listeners = this.liveListeners.get(projectId) ?? new Set<LiveListener>();
    listeners.add(listener);
    this.liveListeners.set(projectId, listeners);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) this.liveListeners.delete(projectId);
    };
  }

  liveSnapshot(projectId: string): ProjectLiveSnapshot {
    return {
      projectId,
      streams: [...(this.liveStreams.get(projectId)?.values() ?? [])]
        .sort((left, right) => left.updatedAt.localeCompare(right.updatedAt))
        .map((stream) => ({ ...stream })),
      events: [...(this.liveHarnessEvents.get(projectId)?.values() ?? [])]
        .sort((left, right) => left.ts.localeCompare(right.ts) || left.seq - right.seq)
        .map((event) => structuredClone(event)),
      ...(this.livePerformance.get(projectId)
        ? { performance: { ...this.livePerformance.get(projectId)! } }
        : {}),
      ...(this.runtimeProjections.get(projectId)
        ? { runtime: structuredClone(this.runtimeProjections.get(projectId)!) }
        : {})
    };
  }

  publishRuntime(projectId: string, runtime: ProjectRuntimeProjection): void {
    this.runtimeProjections.set(projectId, structuredClone(runtime));
    this.scheduleLiveFlush(projectId);
  }

  appendAssistantDelta(
    stream: Omit<LiveAssistantStream, "content" | "phase" | "role" | "updatedAt">,
    fragment: string
  ): void {
    if (!fragment) return;
    const key = this.liveStreamKey(stream.projectId, stream.invocationId, stream.attempt, stream.itemId);
    this.persistedLiveKeys.get(stream.projectId)?.delete(key);
    const previousRaw = this.rawLiveContent.get(key) ?? "";
    const combined = `${previousRaw}${fragment}`;
    const truncated = combined.length > ASSISTANT_LIVE_LIMIT;
    const raw = truncateUnicodePrefix(combined, ASSISTANT_LIVE_LIMIT);
    this.rawLiveContent.set(key, raw);
    const content = truncateUnicodePrefix(
      redactLiveTrace(raw),
      ASSISTANT_LIVE_LIMIT
    );
    const projectStreams = this.liveStreams.get(stream.projectId) ?? new Map();
    projectStreams.set(key, {
      ...stream,
      content,
      ...(truncated ? { truncated: true } : {}),
      phase: "streaming",
      role: "active",
      updatedAt: new Date().toISOString()
    });
    this.liveStreams.set(stream.projectId, projectStreams);
    this.scheduleLiveFlush(stream.projectId);
  }

  completeAssistantMessage(
    stream: Omit<LiveAssistantStream, "content" | "phase" | "role" | "updatedAt">,
    content: string
  ): void {
    const key = this.liveStreamKey(stream.projectId, stream.invocationId, stream.attempt, stream.itemId);
    if (this.persistedLiveKeys.get(stream.projectId)?.has(key)) return;
    const truncated = content.length > ASSISTANT_LIVE_LIMIT;
    this.rawLiveContent.set(
      key,
      truncateUnicodePrefix(content, ASSISTANT_LIVE_LIMIT)
    );
    const projectStreams = this.liveStreams.get(stream.projectId) ?? new Map();
    const previous = projectStreams.get(key);
    projectStreams.set(key, {
      ...stream,
      content: truncateUnicodePrefix(
        redactLiveTrace(content),
        ASSISTANT_LIVE_LIMIT
      ),
      ...(truncated ? { truncated: true } : {}),
      phase: "complete",
      role: previous?.role === "process" ? "process" : "active",
      updatedAt: new Date().toISOString()
    });
    this.liveStreams.set(stream.projectId, projectStreams);
    this.scheduleLiveFlush(stream.projectId);
  }

  markAssistantProcess(
    projectId: string,
    invocationId: string,
    attempt: number,
    itemId: string
  ): void {
    const key = this.liveStreamKey(projectId, invocationId, attempt, itemId);
    const stream = this.liveStreams.get(projectId)?.get(key);
    if (!stream) return;
    stream.role = "process";
    stream.updatedAt = new Date().toISOString();
    this.scheduleLiveFlush(projectId);
  }

  publishPerformance(projectId: string, performance: InvocationPerformance): void {
    this.livePerformance.set(projectId, { ...performance });
    this.scheduleLiveFlush(projectId);
  }

  publishHarnessEvent(projectId: string, agent: AgentName, event: HarnessEvent): void {
    if (!event.kind.startsWith("tool.")) return;
    const attempt = Number.isSafeInteger(event.attempt) ? event.attempt! : 0;
    const key = this.liveHarnessEventKey(projectId, event.invocationId, attempt, event.eventId);
    // Official callbacks can commit before the matching live callback arrives.
    if (this.persistedLiveKeys.get(projectId)?.has(key)) return;
    const projectEvents = this.liveHarnessEvents.get(projectId) ?? new Map();
    projectEvents.set(key, {
      id: `live:${event.eventId}`,
      seq: 8_000_000_000 + attempt * 1_000_000 + event.seq,
      projectId,
      ts: event.timestamp,
      type: "agent.trace",
      level: event.kind === "tool.failed" ? "error" : "info",
      agent,
      message: event.message ?? event.tool?.name ?? "Tool",
      data: {
        kind: "tool",
        invocationId: event.invocationId,
        liveEphemeral: true,
        canonicalEvent: structuredClone(event)
      }
    });
    this.liveHarnessEvents.set(projectId, projectEvents);
    this.scheduleLiveFlush(projectId);
  }

  resetInvocationAttempt(projectId: string, invocationId: string): void {
    const projectStreams = this.liveStreams.get(projectId);
    if (projectStreams) {
      for (const [key, stream] of projectStreams) {
        if (stream.invocationId !== invocationId) continue;
        projectStreams.delete(key);
        this.rawLiveContent.delete(key);
      }
      if (projectStreams.size === 0) this.liveStreams.delete(projectId);
    }
    const performance = this.livePerformance.get(projectId);
    if (performance?.invocationId === invocationId) {
      this.livePerformance.delete(projectId);
    }
    this.clearHarnessEvents(projectId, invocationId);
    this.scheduleLiveFlush(projectId);
  }

  finishInvocation(
    projectId: string,
    invocationId: string,
    outcome: "completed" | "incomplete"
  ): LiveAssistantStream[] {
    const projectStreams = this.liveStreams.get(projectId);
    const matching = [...(projectStreams?.values() ?? [])]
      .filter((stream) => stream.invocationId === invocationId)
      .sort((left, right) => left.updatedAt.localeCompare(right.updatedAt));
    const last = matching.at(-1);
    for (const stream of matching) {
      stream.phase = outcome === "completed" ? "complete" : "incomplete";
      if (outcome === "completed" && stream === last && stream.role !== "process") {
        stream.role = "final";
      }
      stream.updatedAt = new Date().toISOString();
    }
    this.scheduleLiveFlush(projectId);
    return matching.map((stream) => ({ ...stream }));
  }

  clearInvocation(projectId: string, invocationId: string): void {
    const projectStreams = this.liveStreams.get(projectId);
    if (projectStreams) {
      for (const [key, stream] of projectStreams) {
        if (stream.invocationId !== invocationId) continue;
        projectStreams.delete(key);
        this.rawLiveContent.delete(key);
      }
      if (projectStreams.size === 0) this.liveStreams.delete(projectId);
    }
    const performance = this.livePerformance.get(projectId);
    if (performance?.invocationId === invocationId) this.livePerformance.delete(projectId);
    this.clearHarnessEvents(projectId, invocationId);
    this.scheduleLiveFlush(projectId);
  }

  clearProject(projectId: string): void {
    const timer = this.liveFlushTimers.get(projectId);
    if (timer) clearTimeout(timer);
    this.liveFlushTimers.delete(projectId);
    for (const key of this.rawLiveContent.keys()) {
      if (key.startsWith(`${projectId}\0`)) this.rawLiveContent.delete(key);
    }
    this.liveStreams.delete(projectId);
    this.liveHarnessEvents.delete(projectId);
    this.livePerformance.delete(projectId);
    this.runtimeProjections.delete(projectId);
    this.persistedLiveKeys.delete(projectId);
    const snapshot: ProjectLiveSnapshot = { projectId, streams: [], events: [] };
    for (const listener of this.liveListeners.get(projectId) ?? []) listener(snapshot);
  }

  private liveStreamKey(
    projectId: string,
    invocationId: string,
    attempt: number,
    itemId: string
  ): string {
    return `${projectId}\0${invocationId}\0${attempt}\0${itemId}`;
  }

  private liveHarnessEventKey(
    projectId: string,
    invocationId: string,
    attempt: number,
    eventId: string
  ): string {
    return `${projectId}\0${invocationId}\0${attempt}\0${eventId}`;
  }

  private clearHarnessEvents(projectId: string, invocationId: string): void {
    const projectEvents = this.liveHarnessEvents.get(projectId);
    if (!projectEvents) return;
    for (const [key, event] of projectEvents) {
      if (event.data?.invocationId === invocationId) projectEvents.delete(key);
    }
    if (projectEvents.size === 0) this.liveHarnessEvents.delete(projectId);
  }

  private retirePersistedHarnessEvent(event: TimelineEvent): void {
    if (event.data?.liveEphemeral === true) return;
    const value = event.data?.canonicalEvent ?? event.data?.event;
    if (!value || typeof value !== "object" || Array.isArray(value)) return;
    const canonical = value as Partial<HarnessEvent>;
    if (canonical.schemaVersion !== 1 || typeof canonical.invocationId !== "string" ||
      typeof canonical.eventId !== "string" || typeof canonical.kind !== "string") return;
    const attempt = Number.isSafeInteger(canonical.attempt) ? canonical.attempt! : 0;
    let key: string;
    if (canonical.kind.startsWith("tool.")) {
      key = this.liveHarnessEventKey(event.projectId, canonical.invocationId, attempt, canonical.eventId);
      const projectEvents = this.liveHarnessEvents.get(event.projectId);
      projectEvents?.delete(key);
      if (projectEvents?.size === 0) this.liveHarnessEvents.delete(event.projectId);
    } else if (canonical.kind === "assistant.message" && canonical.itemId) {
      key = this.liveStreamKey(event.projectId, canonical.invocationId, attempt, canonical.itemId);
      const projectStreams = this.liveStreams.get(event.projectId);
      projectStreams?.delete(key);
      this.rawLiveContent.delete(key);
      if (projectStreams?.size === 0) this.liveStreams.delete(event.projectId);
    } else return;
    const keys = this.persistedLiveKeys.get(event.projectId) ?? new Set<string>();
    keys.add(key);
    while (keys.size > PERSISTED_LIVE_KEY_LIMIT) keys.delete(keys.values().next().value!);
    this.persistedLiveKeys.set(event.projectId, keys);
    this.scheduleLiveFlush(event.projectId);
  }

  private scheduleLiveFlush(projectId: string): void {
    if (this.liveFlushTimers.has(projectId)) return;
    const timer = setTimeout(() => {
      this.liveFlushTimers.delete(projectId);
      const listeners = this.liveListeners.get(projectId);
      if (!listeners?.size) return;
      const snapshot = this.liveSnapshot(projectId);
      for (const listener of listeners) {
        listener(snapshot);
      }
    }, LIVE_FLUSH_MS);
    timer.unref();
    this.liveFlushTimers.set(projectId, timer);
  }
}
