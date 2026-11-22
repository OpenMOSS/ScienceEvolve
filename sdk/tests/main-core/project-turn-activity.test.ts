import { getEventListeners } from "node:events";
import { describe, expect, it } from "vitest";
import { ProjectTurnActivity } from "../../src/core/project-turn-activity.js";

describe("project turn pause and resume", () => {
  it("detaches abort listeners after every resume and when a waiting turn is cancelled", async () => {
    const turns = new ProjectTurnActivity();
    const worker = new AbortController();
    for (let cycle = 0; cycle < 3; cycle++) {
      turns.pause("project");
      const waiting = turns.waitWhilePaused("project", worker.signal);
      expect(getEventListeners(worker.signal, "abort")).toHaveLength(1);
      turns.resume("project");
      await waiting;
      expect(getEventListeners(worker.signal, "abort")).toHaveLength(0);
    }

    turns.pause("project");
    const cancelled = turns.waitWhilePaused("project", worker.signal);
    const peer = new AbortController();
    const stillWaiting = turns.waitWhilePaused("project", peer.signal);
    worker.abort();
    await expect(cancelled).rejects.toThrow("cancelled while paused");
    expect(getEventListeners(worker.signal, "abort")).toHaveLength(0);
    expect(getEventListeners(peer.signal, "abort")).toHaveLength(1);
    turns.resume("project");
    await stillWaiting;
    expect(getEventListeners(peer.signal, "abort")).toHaveLength(0);
  });

  it("keeps a turn waiting when a second Pause arrives before the resumed turn runs", async () => {
    const turns = new ProjectTurnActivity();
    const signal = new AbortController().signal;
    turns.pause("project");
    const waiting = turns.beginWhenRunning("project", signal);
    turns.resume("project");
    turns.pause("project");
    await Promise.resolve();
    expect(getEventListeners(signal, "abort")).toHaveLength(1);
    expect(turns.hasActiveTurns("project")).toBe(false);
    turns.resume("project");
    await waiting;
    expect(getEventListeners(signal, "abort")).toHaveLength(0);
    expect(turns.hasActiveTurns("project")).toBe(true);
    turns.endTurn("project");
  });

  it("waits for the last turn in the project and lets Stop interrupt that wait without settling native work", async () => {
    const turns = new ProjectTurnActivity();
    turns.beginTurn("project");
    turns.beginTurn("project");
    turns.beginTurn("other");
    const interrupted = turns.waitForIdle("project");
    turns.wakeIdleWaiters("project");
    await interrupted;
    expect(turns.hasActiveTurns("project")).toBe(true);
    let idle = false;
    const drained = turns.waitForIdle("project").then(() => { idle = true; });
    turns.endTurn("project");
    await Promise.resolve();
    expect(idle).toBe(false);
    turns.endTurn("project");
    await drained;
    expect(turns.hasActiveTurns("project")).toBe(false);
    expect(turns.hasActiveTurns("other")).toBe(true);
    turns.endTurn("other");
  });
});
