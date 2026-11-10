import { promises as fs } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { CollaborationStateDatabase } from "../../src/core/collaboration-state/store.js";
import type { SettleScopedWorktreeClosingInput } from "../../src/core/collaboration-state/contracts.js";
import { P, openedClosingFixture, cleanupClosingFixtures } from "./helpers/scoped-worktree-closing-fixture.js";
import { deliveredClosingFixture } from "./helpers/scoped-worktree-closing-delivery-fixture.js";

afterEach(cleanupClosingFixtures);

async function settlementInput(f: Awaited<ReturnType<typeof deliveredClosingFixture>>, database = f.db) {
  const mergeB = database.scopedWorktreeClosingOperations(P, f.closing.invocationId).find(operation => operation.kind === "pull.merge")!;
  const { git } = f.makeGit(undefined, database.operationsForProject(P, true));
  const target = await git.observeRestrictedWorktreeClosingTarget(f.repository, { ...f.execution, purpose: "delivery" }, 1, "groups/run-G",
    [f.A, f.businessDelivery!.pullRequest.mergeCommitSha!, f.observation.head, String(mergeB.remoteFact!.mergeCommitSha)]);
  const observation = await git.observeRestrictedWorktreeClosing({ ...f.execution, purpose: "delivery" }, 1,
    { kind: f.closing.kind, reportHeadSha: f.A, paths: f.files });
  return { projectId: P, executionId: f.execution.id, ownershipEpoch: 1, agentId: "worker", invocationId: f.closing.invocationId,
    observation, target, nativeStop: { invocationId: f.closing.invocationId, runtimePath: f.closing.runtimePath,
      residentStopConfirmed: true, evidence: { trustedCurrentSupervisorCleared: f.closing.runtimePath } } } satisfies SettleScopedWorktreeClosingInput;
}
function counts(databasePath: string) {
  const raw = new DatabaseSync(databasePath);
  try { return ["scoped_executions", "scoped_arrivals", "scoped_agent_merge_facts", "scoped_finish_tokens"].map(table =>
    Number(raw.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get()!.n)); }
  finally { raw.close(); }
}

describe("atomic original A plus independent B and final directory settlement", () => {
  it.each(["completed", "failed"] as const)("settles the %s original owner exactly once and preserves every original business receipt", async status => {
    const f = await deliveredClosingFixture(status), input = await settlementInput(f), before = f.snapshot(), events = f.db.eventsAfter(P);
    const result = f.db.settleScopedWorktreeClosing(input)!;
    expect(result.replay).toBe(false); expect(result.record).toMatchObject({ originalStatus: status, reportHeadSha: f.A,
      supplementalFinishCallId: "finish", delivery: { business: { pullRequest: { providerNumber: 1, headSha: f.A } },
        supplement: { pullRequest: { providerNumber: 11, headSha: f.observation.head } } }, target: input.target });
    const after = f.snapshot();
    if (status === "completed") expect(after).toEqual(before);
    else { expect(after.slice(1)).toEqual(before.slice(1)); expect(f.db.scopedExecution(P, f.execution.id)?.status).toBe("completed"); }
    expect(f.db.eventsAfter(P).slice(0, events.length)).toEqual(events);
    expect(f.db.scopedWorktreeClosingCandidates(P)).toEqual([]); expect(f.db.scopedAgentHasUnreleasedActivity(P, "worker")).toBe(false);
    expect(counts(f.databasePath)).toEqual([1, 1, 1, 1]);
    expect(f.db.projectState(P).scopedWorktreeClosingSettlements).toEqual([result.record]);
    const settledEvents = f.db.eventsAfter(P), settledCounts = counts(f.databasePath);
    expect(f.db.settleScopedWorktreeClosing(input)).toMatchObject({ replay: true, record: result.record, revision: result.revision });
    expect(f.db.eventsAfter(P)).toEqual(settledEvents); expect(counts(f.databasePath)).toEqual(settledCounts);
    expect(() => f.db.settleScopedWorktreeClosing({ ...input, target: { ...input.target, remoteHead: f.A } })).toThrow("changed on replay");
  }, process.platform === "win32" ? 120_000 : 30_000);

  it.each(["completed", "failed"] as const)("releases the %s owner's original FIFO successor once, using the actual updated group base", async status => {
    const f = await deliveredClosingFixture(status, true, { nextArrival: true });
    const queued = () => f.db.projectState(P).scopedArrivals!.filter(arrival => arrival.targetNodeId === "G_worker_next");
    const before = queued(); expect(before).toHaveLength(status === "completed" ? 1 : 0);
    if (before[0]) expect(f.db.claimScopedAgentArrival({ projectId: P, arrivalRequestId: before[0].requestId, agentId: "worker", executionId: "next", worktreePath: f.worktree })).toBeUndefined();
    const input = await settlementInput(f); f.db.settleScopedWorktreeClosing(input); f.db.settleScopedWorktreeClosing(input);
    const next = queued(); expect(next).toHaveLength(1);
    if (before[0]) expect(next[0]).toEqual(before[0]);
    const claimed = f.db.claimScopedAgentArrival({ projectId: P, arrivalRequestId: next[0]!.requestId, agentId: "worker", executionId: "next", worktreePath: f.worktree });
    expect(claimed?.execution).toMatchObject({ id: "next", agentId: "worker", worktreePath: f.worktree, ownershipEpoch: 1, status: "running" });
    expect(f.rawGit(["rev-parse", "refs/heads/groups/run-G"])).toBe(input.target.localHead);
    expect(f.rawGit(["merge-base", "--is-ancestor", input.observation.head, input.target.localHead])).toBe("");
    const opened = await f.ordinaryGit.sessionBegin({ ...claimed!.execution, purpose: "delivery" }, 1,
      { kind: "delivery", base: { kind: "group", groupRunId: "run-G" } });
    expect(opened).toMatchObject({ worktreePath: f.worktree, branch: "executions/next", head: input.target.localHead });
    expect(f.rawGit(["rev-parse", "refs/heads/executions/original"])).toBe(input.observation.head);
    expect(f.db.scopedExecution(P, f.execution.id)?.status).toBe("completed");
    expect(f.db.scopedAgentReport(P, f.execution.id, 1)?.headSha).toBe(f.A);
  }, process.platform === "win32" ? 120_000 : 30_000);

  it("retains an already accepted merge route when the failed owner is finally discharged", async () => {
    const f = await deliveredClosingFixture("failed", true, { retainedMergedRoute: true }), input = await settlementInput(f), before = f.snapshot();
    expect(counts(f.databasePath)).toEqual([1, 1, 1, 1]);
    const routes = f.db.eventsAfter(P).filter(event => event.type === "scoped.agent.merged_route");
    expect(routes).toHaveLength(1);
    expect(f.db.completeScopedAgentArrivalAfterMerge({ projectId: P, executionId: f.execution.id, arrivalRequestId: f.execution.arrivalRequestId,
      ownershipEpoch: 1, ...f.businessDelivery! }).replay).toBe(true);
    expect(f.db.scopedExecution(P, f.execution.id)?.status).toBe("failed"); expect(f.db.scopedWorktreeClosingCandidates(P)).toHaveLength(1);
    expect(f.db.settleScopedWorktreeClosing(input)?.replay).toBe(false); expect(f.db.settleScopedWorktreeClosing(input)?.replay).toBe(true);
    expect(f.db.scopedExecution(P, f.execution.id)?.status).toBe("completed"); expect(f.snapshot().slice(1)).toEqual(before.slice(1));
    expect(counts(f.databasePath)).toEqual([1, 1, 1, 1]); expect(f.db.eventsAfter(P).filter(event => event.type === "scoped.agent.merged_route")).toEqual(routes);
    expect(f.db.eventsAfter(P).filter(event => event.type === "scoped.agent.closing_completion.recorded")).toHaveLength(1);
  }, process.platform === "win32" ? 120_000 : 30_000);

  it("requires every exact owner, Stop and target identity before any S write", async () => {
    const f = await deliveredClosingFixture(), input = await settlementInput(f), before = f.snapshot(), events = f.db.eventsAfter(P), revision = f.db.projectState(P).revision;
    const wrong: SettleScopedWorktreeClosingInput[] = [ { ...input, agentId: "foreign" }, { ...input, executionId: "foreign" },
      { ...input, ownershipEpoch: 2 }, { ...input, invocationId: "inv_foreign" },
      { ...input, nativeStop: { ...input.nativeStop, invocationId: "inv_foreign" } }, { ...input, nativeStop: { ...input.nativeStop, evidence: {} } },
      ...[ { projectId: "foreign" }, { executionId: "foreign" }, { ownershipEpoch: 2 }, { repository: "foreign" },
        { targetBranch: "groups/foreign" }, { localHead: f.A }, { remoteHead: f.A }, { includedHeads: [f.A] },
        { observedAt: "invalid" }, { observedAt: new Date(Date.parse(f.time()) - 60_001).toISOString() } ].map(target => ({ ...input, target: { ...input.target, ...target } })) ];
    for (const value of wrong) {
      expect(() => f.db.settleScopedWorktreeClosing(value)).toThrow(); expect(f.snapshot()).toEqual(before);
      expect(f.db.eventsAfter(P)).toEqual(events); expect(f.db.projectState(P).revision).toBe(revision);
    }
    expect(() => f.db.resolveScopedGroupIssueIfPresent(P, "run-G", "worktree-closing", "Mere claimed success")).toThrow("exact A/B/directory");
    expect(f.db.scopedWorktreeClosingCandidates(P)).toHaveLength(1);
  }, process.platform === "win32" ? 120_000 : 30_000);

  it("does not settle a clean B whose results were only saved, or a freshly dirty directory", async () => {
    const f = await deliveredClosingFixture("failed", false), input = await settlementInput(f), events = f.db.eventsAfter(P), before = f.snapshot();
    expect(f.db.settleScopedWorktreeClosing(input)).toBeUndefined();
    expect(f.db.settleScopedWorktreeClosing({ ...input, observation: { ...input.observation, pendingPaths: f.files } })).toBeUndefined();
    expect(f.db.eventsAfter(P)).toEqual(events); expect(f.snapshot()).toEqual(before);
    expect(f.db.scopedWorktreeClosingCandidates(P)).toHaveLength(1);
  }, process.platform === "win32" ? 120_000 : 30_000);

  it.each(["pause", "cancel", "new-binding", "new-reservation", "management"])("refuses %s without releasing the original issue or changing business history", async fault => {
    const f = await deliveredClosingFixture(fault === "new-reservation" ? "completed" : "failed"), input = await settlementInput(f);
    if (fault === "pause") f.edit("UPDATE project_heads SET frozen=1 WHERE project_id=?", P);
    if (fault === "cancel") f.db.appendEvent({ projectId: P, requestId: "cancel", type: "project.cancellation.requested", payload: { source: "user" } });
    if (fault === "new-binding") f.db.recordAgentNativeSessionBinding({ ...f.binding, invocationId: "inv_later", runtimePath: path.join(f.projectPath, "runtime/inv_later") });
    if (fault === "management") f.db.claimScopedLeaderTurn({ projectId: P, groupRunId: "run-G", agentId: "main", invocationId: "inv_active_manager",
      runtimePath: path.join(f.projectPath, "runtime/inv_active_manager"), allowStoppedRepairFaults: true });
    if (fault === "new-reservation") {
      const raw = new DatabaseSync(f.databasePath);
      try {
        const copy = (table: string, overrides: Record<string, string | number | null>, omit?: string) => {
          const row = { ...raw.prepare(`SELECT * FROM ${table} LIMIT 1`).get(), ...overrides } as Record<string, string | number | null>;
          if (omit) delete row[omit]; const fields = Object.keys(row);
          raw.prepare(`INSERT INTO ${table} (${fields.join(",")}) VALUES (${fields.map(() => "?").join(",")})`).run(...Object.values(row));
        };
        copy("scoped_arrivals", { request_id: "next-arrival", source_run_id: "after-original", node_run_id: null, status: "running" }, "arrival_seq");
        copy("scoped_executions", { execution_id: "next", arrival_request_id: "next-arrival", execution_branch: "executions/next", status: "running", completed_at: null });
        copy("scoped_agent_turns", { execution_id: "next", invocation_id: "inv_reserved_next", runtime_path: path.join(f.projectPath, "runtime/inv_reserved_next"), status: "reserved", opened_at: null, stopped_at: null });
      } finally { raw.close(); }
    }
    const before = f.snapshot(), events = f.db.eventsAfter(P);
    expect(() => f.db.settleScopedWorktreeClosing(input)).toThrow(); expect(f.snapshot()).toEqual(before); expect(f.db.eventsAfter(P)).toEqual(events);
    expect(f.db.scopedWorktreeClosingCandidates(P)).toHaveLength(1);
  }, process.platform === "win32" ? 120_000 : 30_000);

  it("rolls back the settlement and resolution when original completion fails, then completes through the same route", async () => {
    const f = await deliveredClosingFixture(), input = await settlementInput(f), before = f.snapshot(), events = f.db.eventsAfter(P), revision = f.db.projectState(P).revision;
    const raw = new DatabaseSync(f.databasePath);
    try { raw.exec("CREATE TRIGGER reject_settlement_completion BEFORE INSERT ON scoped_agent_merge_facts BEGIN SELECT RAISE(FAIL,'injected original completion failure'); END"); }
    finally { raw.close(); }
    expect(() => f.db.settleScopedWorktreeClosing(input)).toThrow("injected original completion failure");
    expect(f.snapshot()).toEqual(before); expect(f.db.eventsAfter(P)).toEqual(events); expect(f.db.projectState(P).revision).toBe(revision);
    expect(f.db.scopedWorktreeClosingSettlements(P)).toEqual([]); expect(f.db.scopedWorktreeClosingCandidates(P)).toHaveLength(1);
    const repaired = new DatabaseSync(f.databasePath); try { repaired.exec("DROP TRIGGER reject_settlement_completion"); } finally { repaired.close(); }
    expect(f.db.settleScopedWorktreeClosing(input)?.record.reportHeadSha).toBe(f.A); expect(counts(f.databasePath)).toEqual([1, 1, 1, 1]);
  }, process.platform === "win32" ? 120_000 : 30_000);

  it("settles after a writer restart using original receipts without inventing report recovery or rewriting the old writer", async () => {
    const f = await deliveredClosingFixture(), oldRows = f.snapshot(); f.db.close(); f.advance(600_001);
    const next = CollaborationStateDatabase.open({ databasePath: f.databasePath, serviceId: "test", instanceId: "new-writer", hostId: "test", topology: "single-host",
      now: () => Date.parse(f.time()), leaseDurationMs: 600_000 });
    try {
      const input = await settlementInput(f, next); expect(next.settleScopedWorktreeClosing(input)?.record.writerLeaseEpoch).toBe(next.writerLease().epoch);
      expect(f.snapshot().slice(1)).toEqual(oldRows.slice(1)); expect(next.scopedExecution(P, f.execution.id)?.status).toBe("completed");
      expect(next.eventsAfter(P).filter(event => event.type === "scoped.agent.reconciled")).toEqual([]);
      expect(next.settleScopedWorktreeClosing(input)?.replay).toBe(true); expect(counts(f.databasePath)).toEqual([1, 1, 1, 1]);
    } finally { next.close(); }
  }, process.platform === "win32" ? 120_000 : 30_000);

  it("accepts the original Agent's clean restoration to A without inventing a B delivery", async () => {
    const f = await openedClosingFixture({ originalStatus: "completed", businessDelivery: true });
    await fs.writeFile(f.memory, "Immutable original Memory at A\n");
    f.db.completeScopedWorktreeClosing({ ...f.closing, controlCapabilityHash: f.authority.control.capabilityHash!, envelope: f.envelope({ tool: "finish_task", summary: "I inspected and restored my original file" }, "finish") });
    f.db.recordScopedWorktreeClosingResult({ ...f.closing, inputId: f.turn.inputId, output: "I inspected the authorized file and restored A; no new result requires delivery.", residentTurnCompleted: true });
    f.db.stopScopedWorktreeClosingTurn({ ...f.closing, residentStopConfirmed: true, evidence: { exactNativeClosed: true } });
    const observation = await f.ordinaryGit.observeRestrictedWorktreeClosing({ ...f.execution, purpose: "delivery" }, 1, { kind: f.closing.kind, reportHeadSha: f.A, paths: f.files });
    const target = await f.ordinaryGit.observeRestrictedWorktreeClosingTarget(f.repository, { ...f.execution, purpose: "delivery" }, 1, "groups/run-G", [f.A, f.businessDelivery!.pullRequest.mergeCommitSha!]);
    const before = f.snapshot();
    const settled = f.db.settleScopedWorktreeClosing({ projectId: P, executionId: f.execution.id, ownershipEpoch: 1, agentId: "worker", invocationId: f.closing.invocationId,
      observation, target, nativeStop: { invocationId: f.closing.invocationId, runtimePath: f.closing.runtimePath, residentStopConfirmed: true, evidence: { exactNativeClosed: true } } })!;
    expect(settled.record.delivery.supplement).toBeUndefined(); expect(f.snapshot()).toEqual(before); expect(counts(f.databasePath)).toEqual([1, 1, 1, 1]);
  }, process.platform === "win32" ? 120_000 : 30_000);
});
