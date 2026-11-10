import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProductionCollaborationInvocationDispatcher } from "../../src/core/collaboration-runtime.js";
import { ProjectStorage, type ProjectEventDraft } from "../../src/core/storage.js";
import { EventHub } from "../../src/core/event-hub.js";
import { defaultAgentConfigs } from "../../src/core/validation.js";
import { cloneAgentOrchestrationTemplate } from "../../src/core/agent-orchestration.js";
import { emptyProjectComputeUsage } from "../../src/core/inspire-compute-usage.js";
import type { AgentRunRequest, ProjectState } from "../../src/core/types.js";

const roots: string[] = [];
afterEach(async () => { vi.useRealTimers(); await Promise.all(roots.splice(0).map(root => fs.rm(root, { recursive: true, force: true }))); });

function state(): ProjectState {
  const zero = { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, totalTokens: 0, invocations: 0 };
  return { id: `prj_${"b".repeat(32)}`, title: "Batched audit", requirement: "Retain every native event", status: "running", phase: "model:running",
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), turn: 0, cycle: 1, eventSeq: 0,
    consecutiveFailures: 0, completionGeneration: 0, controlProtocol: "natural-language-tools-v1", runCounts: {}, mainInvocationSeq: 0,
    agents: structuredClone(defaultAgentConfigs), orchestration: cloneAgentOrchestrationTemplate(), userInputs: [],
    tokenUsage: { ...zero, byAgent: {} }, computeUsage: emptyProjectComputeUsage() };
}

function event(index: number, kind = "assistant.delta") {
  return { schemaVersion: 1, eventId: `native-${index}`, timestamp: "2026-11-03T09:13:00.000Z", kind,
    invocationId: "inv_batch", harnessId: "dsh", attempt: 0, itemId: "message", message: String(index) };
}

function dispatcherFixture() {
  const saved: ProjectEventDraft[] = [];
  const storage = { hub: new EventHub(), appendTrace: vi.fn(async () => {}),
    appendTraces: vi.fn(async () => {}), saveState: vi.fn(async () => {}),
    appendEvent: vi.fn(async (_state: ProjectState, draft: ProjectEventDraft) => { saved.push(draft); }),
    appendEvents: vi.fn(async (_state: ProjectState, drafts: ProjectEventDraft[], _beforeCommit?: () => void, _options?: { checkpoint?: boolean }) => { saved.push(...drafts); }) };
  const dispatcher = new ProductionCollaborationInvocationDispatcher(storage as unknown as ProjectStorage);
  const project = state();
  const request = { agent: "main", invocationId: "inv_batch" } as AgentRunRequest;
  dispatcher.decorate({ state: project, request });
  return { saved, storage, dispatcher, project, request };
}

describe("collaboration event persistence", () => {
  it("publishes resident visible summaries and activity without waiting for a tool boundary", async () => {
    const f = dispatcherFixture();
    const summary = { ...event(1, "reasoning.summary"), seq: 1, phase: "delta", itemId: "summary", message: "Visible summary" };
    await f.request.onOfficialHarnessEvent!(summary);
    await f.request.onLiveHarnessEvent!(summary);
    await f.request.onOfficialHarnessEvent!({ ...event(2, "activity"), seq: 2, phase: "delta", message: "" });
    expect(f.storage.hub.liveSnapshot(f.project.id).events).toMatchObject([
      { message: "Visible summary" }, { message: "" }
    ]);
    await f.dispatcher.finish(f.project, "inv_batch", "completed");
    expect(f.saved.map(draft => draft.data?.canonicalEvent)).toEqual([summary,
      expect.objectContaining({ kind: "activity", message: "" })]);
    expect(f.storage.hub.liveSnapshot(f.project.id).events).toEqual([]);
  });
  it("retains 1024 individual events and their native times using bounded batches, before task completion", async () => {
    const f = dispatcherFixture();
    for (let n = 0; n < 1024; n++) await f.request.onOfficialHarnessEvent!(event(n, n % 2 ? "activity" : "assistant.delta"));
    await f.dispatcher.finish(f.project, "inv_batch", "completed");
    expect(f.storage.appendEvents).toHaveBeenCalledTimes(8);
    expect(f.storage.appendEvent).not.toHaveBeenCalled();
    expect(f.saved.map(draft => draft.data!.canonicalEvent)).toEqual(Array.from({ length: 1024 }, (_, n) => event(n, n % 2 ? "activity" : "assistant.delta")));
  });

  it("drains partial batches at tool boundaries and retains diagnostic traces until flush", async () => {
    const f = dispatcherFixture();
    const first = event(1); await f.request.onOfficialHarnessEvent!(first); first.message = "mutated after callback";
    await f.request.onOfficialHarnessEvent!(event(2, "tool.started"));
    await f.request.onOfficialHarnessEvent!(event(3));
    await f.dispatcher.trace({ state: f.project, agentId: "main", invocationId: "inv_batch" })("status", "Native turn released");
    await f.dispatcher.flush(f.project.id);
    expect(f.saved.map(draft => draft.message)).toEqual(["1", "2", "3", "Native turn released"]);
  });

  it("flushes low-volume output on its timer and surfaces a background write failure at the next native boundary", async () => {
    vi.useFakeTimers();
    const f = dispatcherFixture(); const failure = new Error("Original SQLite failure");
    f.storage.appendEvents.mockRejectedValueOnce(failure);
    await f.request.onOfficialHarnessEvent!(event(1));
    await vi.advanceTimersByTimeAsync(1000);
    expect(f.storage.appendEvents).toHaveBeenCalledOnce();
    await expect(f.request.onOfficialHarnessEvent!(event(2, "tool.completed"))).rejects.toBe(failure);
    expect(f.storage.appendEvent).not.toHaveBeenCalled();
    await f.request.onOfficialHarnessEvent!(event(3, "tool.completed"));
    expect(f.saved.map(draft => draft.message)).toEqual(["3"]);
  });

  it("persists every tool boundary while limiting full snapshots and flushes the last cursor at task completion", async () => {
    vi.useFakeTimers();
    const f = dispatcherFixture();
    for (let n = 0; n < 20; n++) await f.request.onOfficialHarnessEvent!(event(n, "tool.completed"));
    expect(f.saved).toHaveLength(20);
    expect(f.storage.appendEvents.mock.calls.filter(call => call[3]?.checkpoint)).toHaveLength(0);
    expect(f.storage.saveState).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(10_000);
    await f.request.onOfficialHarnessEvent!(event(20, "tool.completed"));
    expect(f.storage.appendEvents).toHaveBeenLastCalledWith(f.project, expect.any(Array), undefined, { checkpoint: true });
    await f.request.onOfficialHarnessEvent!(event(21, "tool.completed"));
    await f.dispatcher.finish(f.project, "inv_batch", "completed");
    expect(f.storage.saveState).toHaveBeenCalledOnce();
    expect(f.saved.map(draft => draft.data!.canonicalEvent)).toEqual(Array.from({ length: 22 }, (_, n) => event(n, "tool.completed")));
  });

  it("surfaces a deferred checkpoint failure without reporting a completed flush", async () => {
    const f = dispatcherFixture();
    await f.request.onOfficialHarnessEvent!(event(1, "tool.completed"));
    await f.request.onOfficialHarnessEvent!(event(2, "tool.completed"));
    const failure = new Error("Deferred checkpoint write failed");
    f.storage.saveState.mockRejectedValueOnce(failure);
    await expect(f.dispatcher.flush(f.project.id)).rejects.toBe(failure);
    await f.dispatcher.flush(f.project.id);
    expect(f.storage.saveState).toHaveBeenCalledTimes(2);
  });

  it("recovers a durable trace cursor before the next append even when its full checkpoint was deferred", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-deferred-checkpoint-")); roots.push(root);
    const storage = new ProjectStorage(root, new EventHub()), project = state();
    await storage.createProject(project);
    const checkpoint = await fs.readFile(path.join(storage.projectDir(project.id), "state.json"));
    const published: number[] = []; storage.hub.subscribe(project.id, event => published.push(event.seq));
    await storage.appendEvents(project, [{ type: "agent.trace", message: "Original durable trace" }], undefined, { checkpoint: false });
    expect(await fs.readFile(path.join(storage.projectDir(project.id), "state.json"))).toEqual(checkpoint);
    expect(published).toEqual([1]);
    const restarted = new ProjectStorage(root, new EventHub()), recovered = await restarted.loadState(project.id);
    expect(recovered.eventSeq).toBe(1);
    expect((await restarted.appendEvent(recovered, { type: "project.status", message: "Formal transition" })).seq).toBe(2);
    expect((await restarted.loadState(project.id)).eventSeq).toBe(2);
    await expect(storage.appendEvents(project, [{ type: "project.status", message: "Cannot defer lifecycle" }], undefined,
      { checkpoint: false })).rejects.toThrow("Only diagnostic Agent traces");
  });

  it("writes every audit line with consecutive sequences and publishes only after a shared checkpoint is durable", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-event-batching-")); roots.push(root);
    class CountingStorage extends ProjectStorage {
      snapshots = 0;
      protected override async atomicJson(file: string, value: unknown, beforeCommit?: () => void): Promise<void> {
        this.snapshots++; await super.atomicJson(file, value, beforeCommit);
      }
    }
    const storage = new CountingStorage(root, new EventHub()); const project = state();
    await storage.createProject(project); storage.snapshots = 0;
    const published: number[] = []; storage.hub.subscribe(project.id, e => { published.push(e.seq); });
    const drafts = Array.from({ length: 128 }, (_, n) => ({ type: "agent.trace", message: `original-fragment-${n}`, data: { canonicalEvent: event(n) } }));
    const events = await storage.appendEvents(project, drafts);
    expect(storage.snapshots).toBe(1);
    expect(published).toEqual(events.map(e => e.seq));
    const journal = (await fs.readFile(path.join(storage.projectDir(project.id), "events.jsonl"), "utf8")).trim().split("\n").map(line => JSON.parse(line));
    expect(journal).toEqual(events);
    expect(events.map(e => e.seq)).toEqual(Array.from({ length: 128 }, (_, i) => i + 1));
    const restarted = new ProjectStorage(root, new EventHub()); const retained = await restarted.loadState(project.id);
    expect(retained.eventSeq).toBe(128);
    expect((await restarted.appendEvent(retained, { type: "project.status", message: "Original invocation settled" })).seq).toBe(129);
    expect((await fs.readFile(path.join(storage.projectDir(project.id), "timeline.md"), "utf8")).match(/original-fragment-/g)).toHaveLength(128);
  });
});
