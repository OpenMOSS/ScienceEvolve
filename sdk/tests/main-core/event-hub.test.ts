import { afterEach, describe, expect, it, vi } from "vitest";
import { ASSISTANT_DISPLAY_CHARACTER_LIMIT } from "../../src/core/content-limits.js";
import { EventHub } from "../../src/core/event-hub.js";
import type { HarnessEvent } from "../../src/core/harness-runtime/contracts.js";
import type { TimelineEvent } from "../../src/core/types.js";

const stream = {
  projectId: "prj_live",
  invocationId: "inv_live",
  agent: "execution",
  harnessId: "fixture",
  attempt: 0,
  itemId: "assistant-0-0"
};

afterEach(() => {
  vi.useRealTimers();
});

describe("EventHub live Assistant snapshots", () => {
  it("streams visible summaries separately, coalesces activity, and retires exact durable content", () => {
    const hub = new EventHub();
    const summary = (seq: number, message: string): HarnessEvent => ({ schemaVersion: 1, eventId: `summary-${seq}`, seq,
      timestamp: "2026-11-09T00:00:00Z", invocationId: stream.invocationId, harnessId: stream.harnessId,
      kind: "reasoning.summary", phase: "delta", attempt: 0, itemId: "summary-1", message });
    const first = summary(1, "Read ");
    const second = summary(2, "the evidence.");
    hub.publishHarnessEvent(stream.projectId, stream.agent, first);
    hub.publishHarnessEvent(stream.projectId, stream.agent, first);
    hub.publish(persisted(first));
    hub.publishHarnessEvent(stream.projectId, stream.agent, second);
    expect(hub.liveSnapshot(stream.projectId).events).toMatchObject([{ message: "Read the evidence." }]);
    hub.publish(persisted(first));
    expect(hub.liveSnapshot(stream.projectId).events).toHaveLength(1);
    hub.publish(persisted(second));
    hub.publishHarnessEvent(stream.projectId, stream.agent, second);
    expect(hub.liveSnapshot(stream.projectId).events).toEqual([]);
    hub.publishHarnessEvent(stream.projectId, stream.agent, { ...summary(3, " "), itemId: "empty-summary" });
    expect(hub.liveSnapshot(stream.projectId).events).toEqual([]);
    for (let seq = 4; seq < 24; seq++) hub.publishHarnessEvent(stream.projectId, stream.agent,
      { ...summary(seq, ""), kind: "activity", itemId: undefined });
    expect(hub.liveSnapshot(stream.projectId).events).toHaveLength(1);
    expect(hub.liveSnapshot(stream.projectId).events[0]?.message).toBe("");
    hub.clearInvocation(stream.projectId, stream.invocationId);
    expect(hub.liveSnapshot(stream.projectId).events).toEqual([]);
    hub.publishHarnessEvent(stream.projectId, stream.agent, summary(24, "Fresh summary"));
    expect(hub.liveSnapshot(stream.projectId).events).toMatchObject([{ message: "Fresh summary" }]);
  });

  it("redacts secrets split across visible-summary chunks", () => {
    const hub = new EventHub();
    for (const [index, message] of ["credential sk-fixture", "-secret-value and answer"].entries()) {
      hub.publishHarnessEvent(stream.projectId, stream.agent, { ...tool(index), kind: "reasoning.summary", phase: "delta",
        itemId: "summary", message });
      expect(JSON.stringify(hub.liveSnapshot(stream.projectId))).not.toContain("sk-fixture");
    }
    expect(hub.liveSnapshot(stream.projectId).events[0]?.message).toContain("[REDACTED]");
  });

  it("keeps summary, tool, activity and assistant identities distinct", () => {
    const hub = new EventHub();
    hub.publishHarnessEvent(stream.projectId, stream.agent, { ...tool(0), kind: "reasoning.summary", phase: "delta",
      itemId: "summary", message: "Visible summary" });
    hub.publishHarnessEvent(stream.projectId, stream.agent, { ...tool(1), eventId: "summary:summary" });
    const activity: HarnessEvent = { ...tool(2), kind: "activity", phase: "delta", eventId: "activity" };
    hub.appendAssistantDelta({ ...stream, itemId: "activity" }, "Assistant text");
    hub.publishHarnessEvent(stream.projectId, stream.agent, activity);
    expect(hub.liveSnapshot(stream.projectId).events).toHaveLength(3);
    hub.publish(persisted(activity));
    hub.appendAssistantDelta({ ...stream, itemId: "activity" }, " continues");
    expect(hub.liveSnapshot(stream.projectId).streams[0]?.content).toBe("Assistant text continues");
  });
  function tool(index: number): HarnessEvent {
    return {
      schemaVersion: 1, eventId: `tool-${index}`, seq: index,
      timestamp: "2026-10-17T00:00:00Z", invocationId: stream.invocationId,
      harnessId: "fixture", kind: "tool.completed", phase: "completed", attempt: 0,
      tool: { callId: `call-${index}`, name: "read", toolType: "file", status: "completed", outputPreview: "x".repeat(16_000) }
    };
  }

  function persisted(canonical: HarnessEvent, shape = "canonicalEvent"): TimelineEvent {
    return {
      id: `durable-${canonical.eventId}`, seq: canonical.seq, projectId: stream.projectId,
      ts: canonical.timestamp, type: "agent.trace", level: "info", agent: stream.agent,
      message: "Persisted Harness event", data: { [shape]: canonical }
    };
  }

  it.each(["canonicalEvent", "event"])("retires persisted %s tools and ignores their late live callbacks", (shape) => {
    const hub = new EventHub();
    const first = tool(1);
    const second = tool(2);
    const history: TimelineEvent[] = [];
    hub.subscribe(stream.projectId, event => history.push(event));
    hub.publishHarnessEvent(stream.projectId, stream.agent, first);
    hub.publishHarnessEvent(stream.projectId, stream.agent, second);
    hub.publish(persisted(first, shape));
    hub.publishHarnessEvent(stream.projectId, stream.agent, first);

    expect(hub.liveSnapshot(stream.projectId).events).toHaveLength(1);
    expect(hub.liveSnapshot(stream.projectId).events[0]?.data?.canonicalEvent).toEqual(second);
    expect(history[0]?.data?.[shape]).toEqual(first);
  });

  it("moves completed Assistant text to history and does not restore it through a duplicate live callback", () => {
    const hub = new EventHub();
    const event: HarnessEvent = {
      ...tool(1), kind: "assistant.message", itemId: stream.itemId, message: "Persisted response"
    };
    hub.appendAssistantDelta(stream, "Persisted response");
    hub.completeAssistantMessage(stream, event.message!);
    hub.publish(persisted(event, "event"));
    hub.completeAssistantMessage(stream, event.message!);
    expect(hub.liveSnapshot(stream.projectId).streams).toEqual([]);
    hub.appendAssistantDelta({ ...stream, itemId: "next-message" }, "New response");
    expect(hub.liveSnapshot(stream.projectId).streams).toHaveLength(1);
  });

  it("keeps live snapshots small after thousands of durable tool results", async () => {
    vi.useFakeTimers();
    const hub = new EventHub();
    let historicalEvents = 0;
    hub.subscribe(stream.projectId, () => historicalEvents++);
    for (let index = 0; index < 2_000; index++) {
      const event = tool(index);
      hub.publishHarnessEvent(stream.projectId, stream.agent, event);
      hub.publish(persisted(event, index % 2 ? "event" : "canonicalEvent"));
      hub.publishHarnessEvent(stream.projectId, stream.agent, event);
    }
    expect(historicalEvents).toBe(2_000);
    expect(JSON.stringify(hub.liveSnapshot(stream.projectId)).length).toBeLessThan(1_000);
    await vi.advanceTimersByTimeAsync(100);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not build live snapshots while there are no viewers", async () => {
    vi.useFakeTimers();
    const hub = new EventHub();
    const build = vi.spyOn(hub, "liveSnapshot");
    hub.appendAssistantDelta(stream, "Headless work");
    await vi.advanceTimersByTimeAsync(100);
    expect(build).not.toHaveBeenCalled();
    const receive = vi.fn();
    hub.subscribeLive(stream.projectId, receive);
    hub.appendAssistantDelta(stream, " continues");
    await vi.advanceTimersByTimeAsync(100);
    expect(receive.mock.calls[0]?.[0].streams[0].content).toBe("Headless work continues");
  });

  it("publishes the same durable runtime projection to live viewers and reconnects", async () => {
    vi.useFakeTimers();
    const hub = new EventHub();
    const snapshots: ReturnType<EventHub["liveSnapshot"]>[] = [];
    hub.subscribeLive(stream.projectId, (snapshot) => snapshots.push(snapshot));
    const runtime = {
      stateRevision: 12,
      status: "running" as const,
      phase: "model:running",
      currentAgent: "execution",
      activeInvocationId: stream.invocationId,
      executionCount: 1,
      activities: []
    };

    hub.publishRuntime(stream.projectId, runtime);
    expect(hub.liveSnapshot(stream.projectId).runtime).toEqual(runtime);
    await vi.advanceTimersByTimeAsync(100);
    expect(snapshots.at(-1)?.runtime).toEqual(runtime);

    snapshots.at(-1)!.runtime!.phase = "mutated-view";
    expect(hub.liveSnapshot(stream.projectId).runtime?.phase).toBe("model:running");
    hub.clearProject(stream.projectId);
    expect(hub.liveSnapshot(stream.projectId).runtime).toBeUndefined();
  });

  it("coalesces deltas at 100ms and redacts credentials split across chunks", async () => {
    vi.useFakeTimers();
    const hub = new EventHub();
    const snapshots: ReturnType<EventHub["liveSnapshot"]>[] = [];
    hub.subscribeLive(stream.projectId, (snapshot) => snapshots.push(snapshot));

    hub.appendAssistantDelta(stream, "credential sk-fixture");
    expect(snapshots).toEqual([]);
    await vi.advanceTimersByTimeAsync(100);
    expect(snapshots[0]?.streams[0]?.content).toBe("credential [REDACTED]");

    hub.appendAssistantDelta(stream, "-secret-value");
    hub.appendAssistantDelta(stream, " and answer");
    await vi.advanceTimersByTimeAsync(99);
    expect(snapshots).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);

    expect(snapshots).toHaveLength(2);
    expect(snapshots[1]?.streams).toEqual([
      expect.objectContaining({
        ...stream,
        phase: "streaming",
        role: "active",
        content: "credential [REDACTED] and answer"
      })
    ]);
    expect(JSON.stringify(snapshots)).not.toContain("fixture-secret");
  });

  it("keeps item and attempt boundaries stable and clears the old attempt atomically", async () => {
    vi.useFakeTimers();
    const hub = new EventHub();
    const second = { ...stream, itemId: "assistant-0-1" };
    hub.appendAssistantDelta(stream, "before tool");
    hub.completeAssistantMessage(stream, "before tool");
    hub.markAssistantProcess(
      stream.projectId,
      stream.invocationId,
      stream.attempt,
      stream.itemId
    );
    hub.appendAssistantDelta(second, "after tool");
    hub.publishHarnessEvent(stream.projectId, stream.agent, {
      schemaVersion: 1,
      eventId: "tool-attempt-0",
      seq: 3,
      timestamp: "2026-09-19T00:00:00.000Z",
      invocationId: stream.invocationId,
      harnessId: stream.harnessId,
      kind: "tool.started",
      phase: "started",
      attempt: 0,
      parentItemId: stream.itemId,
      tool: { callId: "call-0", name: "read", toolType: "file", status: "started" }
    });

    expect(hub.liveSnapshot(stream.projectId).streams).toEqual([
      expect.objectContaining({ itemId: stream.itemId, role: "process", content: "before tool" }),
      expect.objectContaining({ itemId: second.itemId, role: "active", content: "after tool" })
    ]);
    expect(hub.liveSnapshot(stream.projectId).events).toEqual([
      expect.objectContaining({
        type: "agent.trace",
        data: expect.objectContaining({ invocationId: stream.invocationId, liveEphemeral: true })
      })
    ]);

    hub.resetInvocationAttempt(stream.projectId, stream.invocationId);
    expect(hub.liveSnapshot(stream.projectId).streams).toEqual([]);
    expect(hub.liveSnapshot(stream.projectId).events).toEqual([]);

    const replacement = { ...stream, attempt: 1, itemId: "assistant-1-0" };
    hub.appendAssistantDelta(replacement, "replacement answer");
    expect(hub.liveSnapshot(stream.projectId).streams).toEqual([
      expect.objectContaining({ attempt: 1, itemId: "assistant-1-0" })
    ]);
    await vi.advanceTimersByTimeAsync(100);
  });

  it("marks only the last successful segment final and preserves failed output as incomplete", () => {
    const hub = new EventHub();
    const first = { ...stream, itemId: "assistant-0-0" };
    const second = { ...stream, itemId: "assistant-0-1" };
    hub.completeAssistantMessage(first, "process text");
    hub.markAssistantProcess(first.projectId, first.invocationId, first.attempt, first.itemId);
    hub.completeAssistantMessage(second, "final text");

    expect(hub.finishInvocation(stream.projectId, stream.invocationId, "completed")).toEqual([
      expect.objectContaining({ itemId: first.itemId, role: "process", phase: "complete" }),
      expect.objectContaining({ itemId: second.itemId, role: "final", phase: "complete" })
    ]);

    const failedHub = new EventHub();
    failedHub.appendAssistantDelta(first, "partial text");
    expect(failedHub.finishInvocation(stream.projectId, stream.invocationId, "incomplete"))
      .toEqual([expect.objectContaining({ phase: "incomplete", content: "partial text" })]);
  });

  it("serves the same reconnect snapshot to multiple viewers and safely bounds long multibyte text", async () => {
    vi.useFakeTimers();
    const hub = new EventHub();
    const firstViewer: ReturnType<EventHub["liveSnapshot"]>[] = [];
    const secondViewer: ReturnType<EventHub["liveSnapshot"]>[] = [];
    hub.subscribeLive(stream.projectId, (snapshot) => firstViewer.push(snapshot));
    hub.subscribeLive(stream.projectId, (snapshot) => secondViewer.push(snapshot));

    hub.appendAssistantDelta(stream, "多字节🙂输出");
    await vi.advanceTimersByTimeAsync(100);
    expect(firstViewer.at(-1)).toEqual(secondViewer.at(-1));
    expect(hub.liveSnapshot(stream.projectId).streams[0]?.content).toBe("多字节🙂输出");

    hub.appendAssistantDelta(
      stream,
      "🙂".repeat(ASSISTANT_DISPLAY_CHARACTER_LIMIT)
    );
    const reconnectSnapshot = hub.liveSnapshot(stream.projectId);
    expect(reconnectSnapshot.streams[0]).toMatchObject({
      truncated: true,
      phase: "streaming"
    });
    expect(reconnectSnapshot.streams[0]?.content.length)
      .toBeLessThanOrEqual(ASSISTANT_DISPLAY_CHARACTER_LIMIT);
    const finalCodeUnit = reconnectSnapshot.streams[0]?.content.charCodeAt(
      (reconnectSnapshot.streams[0]?.content.length ?? 0) - 1
    ) ?? 0;
    expect(finalCodeUnit < 0xd800 || finalCodeUnit > 0xdbff).toBe(true);
    await vi.advanceTimersByTimeAsync(100);
  });
});
