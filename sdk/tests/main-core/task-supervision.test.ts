import { describe, expect, it, vi } from "vitest";
import { HarnessRuntimeError, SessionResumeError } from "../../src/core/harness-runtime/errors.js";
import { MAX_TASK_REPAIR_WAKEUPS, superviseTask, supervisionHandoff, type TaskSupervisionInput } from "../../src/core/task-supervision.js";

function fixture(key: string, count = 0) {
  let remaining = ["Uncommitted task file", "Owned process still running", "New mechanical fact without a dedicated tool branch"];
  const record = vi.fn(), invoke = vi.fn(async (_attempt: number, _missing: string[], _previous: string) => "Available work and actual limitations");
  const hooks: TaskSupervisionInput<string> = { key, value: "Original result",
    inspect: () => remaining,
    reserve: () => count < MAX_TASK_REPAIR_WAKEUPS ? ++count : undefined,
    invoke, record };
  return { hooks, record, invoke, count: () => count, facts: (value: string[]) => { remaining = value; } };
}

describe("shared task supervision", () => {
  it("keeps ended supervision out of a successor's requirements even before a long Agent result is bounded", () => {
    const output = "PR remains open; I am merging it.\n" + "Existing business evidence. ".repeat(500);
    const handoff = supervisionHandoff(output, { outcome: "exhausted", remaining: ["github_merge_pr"] });
    const recipientPrefix = handoff.slice(0, 500);
    expect(recipientPrefix).toContain("System supervision ended (exhausted)");
    expect(recipientPrefix).toContain("do not create requirements for the next task");
    expect(recipientPrefix).toContain("Do not reopen the task or delegate its mechanical cleanup");
    expect(handoff).toContain("github_merge_pr");
    expect(handoff.endsWith(output)).toBe(true);
    expect(supervisionHandoff(output, { outcome: "resolved", remaining: [] })).toBe(output);
  });

  it("merges arbitrary facts and returns existing work after three unsuccessful wakeups", async () => {
    const f = fixture("three");
    const result = await superviseTask(f.hooks);
    expect(f.invoke).toHaveBeenCalledTimes(3);
    expect(f.invoke.mock.calls.map(call => call[0])).toEqual([1, 2, 3]);
    expect(result).toMatchObject({ outcome: "exhausted", remaining: expect.arrayContaining(["Uncommitted task file"]) });
    expect(supervisionHandoff(result.value, result)).toContain("Uncommitted task file");
    await superviseTask(f.hooks);
    expect(f.invoke).toHaveBeenCalledTimes(3);
  });

  it.each([1, 2, 3])("continues the persisted cumulative allowance after %s prior dispatches", async count => {
    const f = fixture(`restart-${count}`, count);
    await superviseTask(f.hooks);
    expect(f.invoke).toHaveBeenCalledTimes(3 - count);
    expect(f.count()).toBe(3);
  });

  it("joins duplicate triggers while the current round runs and inspects newly arriving facts after its return", async () => {
    const f = fixture("coalesced");
    let release!: () => void;
    f.hooks.invoke = vi.fn(async () => { await new Promise<void>(resolve => { release = resolve; }); return "Same task result"; });
    const first = superviseTask(f.hooks);
    await vi.waitFor(() => expect(f.hooks.invoke).toHaveBeenCalledTimes(1));
    const second = superviseTask(f.hooks);
    expect(second).toBe(first);
    f.facts([]); release();
    await expect(first).resolves.toMatchObject({ outcome: "resolved" });
    expect(f.count()).toBe(1);
  });

  it("does not create Agent work when inspection or durable reservation is unavailable", async () => {
    for (const field of ["inspect", "reserve"] as const) {
      const f = fixture(`failure-${field}`);
      f.hooks[field] = () => { throw new Error(`Backend ${field} is unavailable`); };
      await expect(superviseTask(f.hooks)).resolves.toMatchObject({ value: "Original result", outcome: "unconfirmed" });
      expect(f.invoke).not.toHaveBeenCalled();
      expect(f.record).toHaveBeenCalledWith(field === "inspect" ? "inspection_failed" : "reservation_failed",
        expect.any(Array), `Backend ${field} is unavailable`);
    }
  });

  it.each([new SessionResumeError("codex", "original"),
    new HarnessRuntimeError("HARNESS_CONTRACT_VIOLATION", "No resident Harness lease owns this execution")])(
    "stops after the original Session is unavailable without spending the remaining allowance (%s)", async error => {
    const f = fixture(`unavailable-${error.message}`);
    f.hooks.invoke = async () => { throw error; };
    await expect(superviseTask(f.hooks)).resolves.toMatchObject({ outcome: "unavailable", value: "Original result" });
    expect(f.count()).toBe(1);
  });

  it("respects cancellation between rounds without issuing another request", async () => {
    const f = fixture("cancelled"), controller = new AbortController();
    f.hooks.signal = controller.signal;
    f.hooks.invoke = async () => { controller.abort(new Error("User cancelled")); return "Available result"; };
    await expect(superviseTask(f.hooks)).rejects.toThrow("User cancelled");
    expect(f.count()).toBe(1);
  });
});
