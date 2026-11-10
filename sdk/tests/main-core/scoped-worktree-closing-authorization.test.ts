import { promises as fs } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CollaborationStateDatabase } from "../../src/core/collaboration-state/store.js";
import type { AgentNativeSessionBinding, BeginScopedWorktreeClosingTurnInput, RecordScopedWorktreeClosingInput, ScopedLeaderActionInput } from "../../src/core/collaboration-state/contracts.js";
import type { ControlAction, ControlActionEnvelope, OperationRecord } from "../../src/core/types.js";
import { mergedPullSynchronizationOperationId } from "../../src/core/collaboration-git/operation.js";
import type { RestrictedWorktreeClosingAuthority } from "../../src/core/collaboration-git/contracts.js";
import { CollaborationGitFacade, LocalCollaborationGitService, type CollaborationGitOperationStore } from "../../src/core/collaboration-git/index.js";
import { captureKnownAgentGitResults } from "../../src/core/agent-git-result-observations.js";
import { agentGitOperationJournal } from "../../src/core/agent-git-operation-journal.js";
import { controlResultReceipts } from "../../src/core/control-result-receipts.js";

const roots: string[] = [], stores: CollaborationStateDatabase[] = [];
afterEach(async () => { stores.splice(0).forEach(store => store.close()); await Promise.all(roots.splice(0).map(root => fs.rm(root, { recursive: true, force: true }))); });
const HEAD = "a".repeat(40);
type FixtureSeed = { root: string; reportHeadSha: string; cleanupRoot?: string };

async function fixture(status: "completed" | "failed" = "completed", seed?: FixtureSeed) {
  const root = seed?.root ?? await fs.mkdtemp(path.join(os.tmpdir(), "openfars-closing-authority-")); roots.push(seed?.cleanupRoot ?? root);
  const reportHeadSha = seed?.reportHeadSha ?? HEAD;
  const databasePath = path.join(root, "state.sqlite");
  let now = Date.parse("2026-10-10T09:00:00.000Z"), writer = 0;
  const open = () => {
    const db = CollaborationStateDatabase.open({ databasePath, serviceId: "test", hostId: "test", topology: "single-host",
      instanceId: `writer-${++writer}`, now: () => now, leaseDurationMs: 60_000 }); stores.push(db); return db;
  };
  const db = open();
  db.createProject({ projectId: "p", workflowRevision: 1, workerCapacity: 1,
    git: { enabled: true, status: "ready", repository: { owner: "example", name: "project", private: true,
      defaultBranch: "main", htmlUrl: "https://github.com/example/project", localPath: path.join(root, "repository") } },
    workflowSnapshot: { schemaVersion: 3, agents: [{ name: "main" }, { name: "worker" }], collaborations: [{ id: "G" }],
      scopedWorkflow: { schemaVersion: 1, rootAgentIds: ["main"], groups: [{ id: "G", leaderAgentId: "main", allowLeaderReconfiguration: false,
        workflow: { nodes: [{ kind: "agent", nodeId: "G_worker", agentId: "worker" }],
          input: { source: "input", edges: [{ kind: "parallel", target: "G_worker" }] }, routes: { G_worker: [{ kind: "strong", target: "finish" }] } } }] } } });
  const group = db.activateScopedGroup({ projectId: "p", groupRunId: "run-G", groupId: "G", activationRequestId: "activate",
    workflowRevision: 1, baseCommit: reportHeadSha, outer: { nodeRunId: "node-G", inputSnapshotRef: "input", activatedByAgentId: "main" } });
  const execution = db.claimScopedAgentArrival({ projectId: "p", arrivalRequestId: group.arrivals[0]!.requestId,
    agentId: "worker", executionId: "original", worktreePath: path.join(root, "git-worktrees", "agents", "worker") })!.execution;
  const identity = { projectId: "p", executionId: execution.id, ownershipEpoch: 1, invocationId: "inv_original" };
  const runtimePath = path.join(root, "runtime", identity.invocationId);
  db.beginScopedAgentTurn({ ...identity, runtimePath, baseCommit: reportHeadSha });
  db.markScopedAgentTurnOpened({ ...identity, nativeProcessOpened: true });
  const binding: AgentNativeSessionBinding = { projectId: "p", agentId: "worker", invocationId: identity.invocationId, runtimePath,
    worktreePath: execution.worktreePath, session: { schemaVersion: 1, harnessId: "pi", adapterVersion: "1", generation: 0,
      durable: true, nativeId: path.join(root, "original-session.jsonl"), createdAt: new Date(now).toISOString() },
    executionContext: { role: "delivery", nodeRunId: "node-G", groupRunId: group.groupRun.id,
      executionId: execution.id, ownershipEpoch: 1, executionWorktree: execution.worktreePath } };
  db.recordAgentNativeSessionBinding(binding);
  db.recordScopedAgentTaskCompletion({ ...identity, agentId: "worker", callId: "original-finish", requestedAt: new Date(now).toISOString(), summary: "Original business finished", memory: "Retain original memory" });
  db.recordScopedAgentReport({ ...identity, output: "Immutable business report", reportHeadSha,
    residentTurnCompleted: true, residentStopConfirmed: true });
  // Synthetic terminal sample, like the retained historical rows. Production
  // identification/authorization must not perform any of these fixture writes.
  const edit = (sql: string, ...args: (string | number)[]) => { const raw = new DatabaseSync(databasePath); try { raw.prepare(sql).run(...args); } finally { raw.close(); } };
  if (status === "failed") db.failScopedAgentArrival({ projectId: "p", executionId: execution.id, ownershipEpoch: 1,
    arrivalRequestId: execution.arrivalRequestId, reason: "Immutable report blocks the outstanding necessary Memory delivery", residentStopConfirmed: true });
  else {
    edit("UPDATE scoped_executions SET status = ? WHERE execution_id = 'original'", status);
    edit("UPDATE scoped_arrivals SET status = ? WHERE request_id = ?", status, execution.arrivalRequestId);
    edit("DELETE FROM lane_leases WHERE project_id = 'p' AND lane = 'worker'");
  }
  const files = status === "completed" ? ["compute/probe.js", "workspace/old.txt"] : ["agent-memory/worker/Memory.md"];
  const input: RecordScopedWorktreeClosingInput = { projectId: "p", executionId: execution.id, ownershipEpoch: 1, agentId: "worker",
    observation: { projectId: "p", executionId: execution.id, ownershipEpoch: 1, branch: execution.executionBranch,
      worktreePath: execution.worktreePath, head: reportHeadSha, retained: true, observedAt: new Date(now).toISOString(), pendingPaths: [...files],
      committedPaths: [], reportHeadSha, authorizedPaths: [...files], kind: status === "completed" ? "completed-leftovers" : "bound-report-memory", deliveryRequired: false },
    originalStop: { invocationId: identity.invocationId, runtimePath, residentStopConfirmed: true, evidence: { nativeProcessScanCleared: true } } };
  const manager = (database = db, invocationId = "inv_manager") => {
    const claim = database.claimScopedLeaderTurn({ projectId: "p", groupRunId: group.groupRun.id, agentId: "main", invocationId,
      runtimePath: path.join(root, "runtime", invocationId), allowStoppedRepairFaults: true })!;
    const scope = { projectId: "p", groupRunId: group.groupRun.id, agentId: "main", invocationId, coordinatorEpoch: claim.coordinatorEpoch };
    database.markScopedLeaderOpened(scope);
    const envelope = (action: ControlAction, callId = "close") => ({ projectId: "p", agent: "main", invocationId, callId,
      stateVersion: claim.coordinatorEpoch, capabilityHash: "c".repeat(64), receivedAt: new Date(now).toISOString(), action } satisfies ControlActionEnvelope);
    database.recordScopedLeaderTaskCompletion({ ...scope, envelope: envelope({ tool: "finish_task", summary: "Management finished" }, "finish") });
    const action: Extract<ControlAction, { tool: "coordinate_group_task" }> = { tool: "coordinate_group_task", groupRunId: scope.groupRunId,
      coordinatorEpoch: scope.coordinatorEpoch, arrivalRequestId: execution.arrivalRequestId, operation: "close_worktree", rationale: "Inspect and close only the original identified files",
      closing: { executionId: execution.id, ownershipEpoch: 1, paths: [...files] } };
    return { scope, action, envelope, input: { ...scope, envelope: envelope(action) } satisfies ScopedLeaderActionInput };
  };
  const snapshot = () => { const raw = new DatabaseSync(databasePath); try { return Object.fromEntries(["scoped_executions", "scoped_agent_turns", "scoped_arrivals", "scoped_agent_reports", "scoped_agent_task_completions", "scoped_operations"].map(table => [table, raw.prepare(`SELECT * FROM ${table}`).all()])); } finally { raw.close(); } };
  return { db, databasePath, root, execution, identity, binding, input, manager, edit, snapshot, files,
    advance: (milliseconds: number) => { now += milliseconds; }, open };
}

describe("explicit original-Agent closing authorization", () => {
  it.each(["completed", "failed"] as const)("identifies a %s owner without changing any task, report, completion or Git fact", async status => {
    const f = await fixture(status), original = f.snapshot();
    const candidate = f.db.recordScopedWorktreeClosingIssue(f.input);
    expect(candidate).toMatchObject({ executionId: "original", ownershipEpoch: 1, originalStatus: status, reportInvocationId: "inv_original" });
    expect(f.db.scopedRecoveryCandidates("p", "run-G")).toMatchObject([{ executionId: "original", kind: "worktree-closing", closing: candidate }]);
    if (status === "failed") expect(f.db.scopedRecoveryCandidates("p", "run-G")[0]?.failureHistory).toMatchObject([
      { ownershipEpoch: 1, reason: "Immutable report blocks the outstanding necessary Memory delivery" }]);
    expect(f.db.recordScopedWorktreeClosingIssue(f.input)).toEqual(candidate);
    expect(f.db.scopedGroupIssues("p")).toHaveLength(1);
    expect(f.snapshot()).toEqual(original);
    expect(f.db.scopedWorktreeClosingAuthorizations("p")).toEqual([]);
  });

  it.each(["completed", "failed"] as const)("pins one direct-Leader grant for %s without reopening business or supplying delivery", async status => {
    const f = await fixture(status), original = f.snapshot(); f.db.recordScopedWorktreeClosingIssue(f.input);
    const m = f.manager();
    expect(f.db.acceptScopedLeaderAction({ ...m.input, residentStopConfirmed: true }).replay).toBe(false);
    expect(f.db.acceptScopedLeaderAction({ ...m.input, residentStopConfirmed: true }).replay).toBe(true);
    expect(f.db.scopedWorktreeClosingAuthorizations("p")).toMatchObject([{ candidate: { originalStatus: status, originalSession: f.binding.session }, paths: f.files, envelope: m.input.envelope }]);
    expect(f.db.scopedRecoveryCandidates("p", "run-G")[0]?.pendingOperation).toBe("close_worktree");
    expect(f.snapshot()).toEqual(original);
    expect(() => f.db.revalidateScopedLeaderAction({ ...m.input, envelope: m.envelope(m.action, "second-grant") })).toThrow(expect.objectContaining({
      code: "INVALID_STATE_TRANSITION", details: expect.objectContaining({ invalidField: "operation", recoveryOptions: [expect.objectContaining({
        arrivalRequestId: f.execution.arrivalRequestId, allowedOperations: ["escalate"],
        blockedOperations: { close_worktree: expect.stringContaining("trusted original-owner file manifest") }
      })] })
    }));
    expect(f.db.scopedWorktreeClosingAuthorizations("p")).toHaveLength(1);
    expect(() => f.db.assertScopedGitExecutionOwnership({ projectId: "p", executionId: "original", ownershipEpoch: 1,
      expectedBranch: f.execution.executionBranch, operation: "checkpoint" })).toThrow();
  });

  it("does not reinterpret ordinary retry as completed/bound-report file authority", async () => {
    const f = await fixture("failed"); f.db.recordScopedWorktreeClosingIssue(f.input); const m = f.manager();
    const { closing: _closing, ...action } = m.action;
    expect(() => f.db.revalidateScopedLeaderAction({ ...m.input, envelope: m.envelope({ ...action, operation: "retry" }) })).toThrow(expect.objectContaining({
      code: "INVALID_STATE_TRANSITION", details: expect.objectContaining({ invalidField: "operation", recoveryOptions: [expect.objectContaining({
        arrivalRequestId: f.execution.arrivalRequestId, allowedOperations: ["escalate", "close_worktree"], blockedOperations: {}
      })] })
    }));
    expect(f.db.scopedWorktreeClosingAuthorizations("p")).toEqual([]);
    expect(() => f.db.revalidateScopedLeaderAction({ ...m.input, envelope: m.envelope({ ...action, operation: "escalate" }) })).not.toThrow();
  });

  it.each(["wrong-owner", "wrong-epoch", "extra-path", "missing-manifest", "conflict-repair", "wrong-invocation", "changed-session"])("rejects %s at formal acceptance", async fault => {
    const f = await fixture("failed"); f.db.recordScopedWorktreeClosingIssue(f.input); const m = f.manager();
    const action = structuredClone(m.action), input = structuredClone(m.input);
    if (fault === "wrong-owner") action.closing!.executionId = "other";
    if (fault === "wrong-epoch") action.closing!.ownershipEpoch = 2;
    if (fault === "extra-path") action.closing!.paths.push("business.txt");
    if (fault === "missing-manifest") delete action.closing;
    if (fault === "conflict-repair") action.repairNodeId = "G_worker";
    if (fault === "wrong-invocation") input.invocationId = "other-manager";
    if (fault === "changed-session") f.db.recordAgentNativeSessionBinding({ ...f.binding, invocationId: "inv_changed", session: { ...f.binding.session, nativeId: path.join(f.root, "foreign-session.jsonl") } });
    expect(() => f.db.acceptScopedLeaderAction({ ...input, envelope: m.envelope(action), residentStopConfirmed: true })).toThrow();
    expect(f.db.scopedWorktreeClosingAuthorizations("p")).toEqual([]);
  });

  it.each(["no-stop", "wrong-stop", "old-observation", "wrong-branch", "wrong-report", "extra-path", "wrong-kind", "live-call", "completed-project"])("does not identify %s", async fault => {
    const f = await fixture(), input = structuredClone(f.input);
    if (fault === "no-stop") input.originalStop.evidence = {};
    if (fault === "wrong-stop") input.originalStop.invocationId = "another-invocation";
    if (fault === "old-observation") f.advance(60_001);
    if (fault === "wrong-branch") input.observation.branch = "executions/other";
    if (fault === "wrong-report") input.observation.reportHeadSha = "b".repeat(40);
    if (fault === "extra-path") input.observation.pendingPaths.push("extra.txt");
    if (fault === "wrong-kind") input.observation.kind = "bound-report-memory";
    if (fault === "live-call") f.edit("UPDATE scoped_agent_turns SET status = 'opened', stopped_at = NULL WHERE execution_id = 'original'");
    if (fault === "completed-project") f.edit("UPDATE scoped_group_runs SET status = 'completed' WHERE group_run_id = 'run-G'");
    expect(() => f.db.recordScopedWorktreeClosingIssue(input)).toThrow();
    expect(f.db.scopedWorktreeClosingCandidates("p")).toEqual([]);
  });

  it("rejects generic issue creation without the exact local/native proof", async () => {
    const f = await fixture(); expect(() => f.db.recordScopedGroupIssue({ projectId: "p", groupRunId: "run-G", kind: "worktree-closing", reason: "No original proof" })).toThrow();
  });

  it.each(["pause", "cancel"])("revokes pending acceptance on %s while retaining the original facts", async intent => {
    const f = await fixture(); f.db.recordScopedWorktreeClosingIssue(f.input); const m = f.manager(), original = f.snapshot();
    if (intent === "pause") f.edit("UPDATE project_heads SET frozen = 1 WHERE project_id = 'p'");
    else f.db.appendEvent({ projectId: "p", requestId: "user-cancel", type: "project.cancellation.requested", payload: { source: "user" } });
    expect(() => f.db.acceptScopedLeaderAction({ ...m.input, residentStopConfirmed: true })).toThrow();
    expect(f.snapshot()).toEqual(original); expect(f.db.scopedWorktreeClosingAuthorizations("p")).toEqual([]);
  });

  it("retains authorization and exact original completion across a writer restart without regranting", async () => {
    const f = await fixture(); f.db.recordScopedWorktreeClosingIssue(f.input); const m = f.manager();
    f.db.acceptScopedLeaderAction({ ...m.input, residentStopConfirmed: true });
    const grants = f.db.scopedWorktreeClosingAuthorizations("p"), original = f.snapshot();
    f.db.releaseScopedLeaderTurn({ ...m.scope, residentStopConfirmed: true });
    f.db.close(); f.advance(60_001); const next = f.open();
    expect(next.scopedWorktreeClosingAuthorizations("p")).toEqual(grants);
    expect(next.scopedRecoveryCandidates("p", "run-G")[0]?.pendingOperation).toBe("close_worktree");
    expect(f.snapshot()).toEqual(original);
    const newManager = f.manager(next, "inv_new_manager");
    expect(() => next.acceptScopedLeaderAction({ ...newManager.input, residentStopConfirmed: true })).toThrow(expect.objectContaining({
      code: "INVALID_STATE_TRANSITION", details: expect.objectContaining({ invalidField: "operation", recoveryOptions: [expect.objectContaining({
        arrivalRequestId: f.execution.arrivalRequestId, allowedOperations: ["escalate"],
        blockedOperations: { close_worktree: expect.stringContaining("trusted original-owner file manifest") }
      })] })
    }));
    expect(next.scopedWorktreeClosingAuthorizations("p")).toEqual(grants);
  });

  it("keeps an accepted manifest immutable on a later changed observation or replay payload", async () => {
    const f = await fixture(); f.db.recordScopedWorktreeClosingIssue(f.input); const m = f.manager();
    f.db.acceptScopedLeaderAction({ ...m.input, residentStopConfirmed: true });
    const changed = structuredClone(f.input); changed.observation.pendingPaths.pop(); changed.observation.authorizedPaths.pop();
    expect(() => f.db.recordScopedWorktreeClosingIssue(changed)).toThrow("immutable observation");
    const action = structuredClone(m.action); action.closing!.paths.pop();
    expect(() => f.db.acceptScopedLeaderAction({ ...m.input, envelope: m.envelope(action), residentStopConfirmed: true })).toThrow("changed on replay");
  });

  it("fences a former writer before it can accept a staged closing request", async () => {
    const f = await fixture(); f.db.recordScopedWorktreeClosingIssue(f.input); const m = f.manager();
    f.advance(60_001); const next = f.open();
    expect(() => f.db.acceptScopedLeaderAction({ ...m.input, residentStopConfirmed: true })).toThrow();
    expect(next.scopedWorktreeClosingAuthorizations("p")).toEqual([]);
    expect(next.scopedExecution("p", "original")?.status).toBe("completed");
  });

  it("rejects an unproved concurrent reserved task and preserves both original and new reservation facts", async () => {
    const f = await fixture(); f.db.recordScopedWorktreeClosingIssue(f.input); const m = f.manager();
    // Model a retained unopened registration arriving between identification
    // and acceptance. Neither an Agent assertion nor an old report proves it stopped.
    const raw = new DatabaseSync(f.databasePath);
    try {
      const copy = (table: string, overrides: Record<string, string | number | null>, omit?: string) => {
        const row = { ...raw.prepare(`SELECT * FROM ${table} LIMIT 1`).get(), ...overrides } as Record<string, string | number | null>;
        if (omit) delete row[omit];
        const fields = Object.keys(row); raw.prepare(`INSERT INTO ${table} (${fields.join(",")}) VALUES (${fields.map(() => "?").join(",")})`).run(...Object.values(row));
      };
      copy("scoped_arrivals", { request_id: "next-arrival", source_run_id: "after-original", node_run_id: null, status: "running" }, "arrival_seq");
      copy("scoped_executions", { execution_id: "next", arrival_request_id: "next-arrival", execution_branch: "executions/next", status: "running", completed_at: null });
      copy("scoped_agent_turns", { execution_id: "next", invocation_id: "inv_reserved_next", runtime_path: path.join(f.root, "runtime", "inv_reserved_next"), status: "reserved", opened_at: null, stopped_at: null });
    } finally { raw.close(); }
    const original = f.snapshot();
    expect(() => f.db.acceptScopedLeaderAction({ ...m.input, residentStopConfirmed: true })).toThrow("stopped-owner");
    expect(() => f.db.recordScopedWorktreeClosingIssue(f.input)).toThrow("stopped original owner");
    expect(f.snapshot()).toEqual(original);
    expect(f.db.scopedAgentTurn("p", "next", 1)?.status).toBe("reserved");
    expect(f.db.scopedWorktreeClosingAuthorizations("p")).toEqual([]);
  });

});

async function closingJournalFixture(status: "completed" | "failed" = "completed", seed?: FixtureSeed) {
  const f = await closingFixture(status, true, seed); f.db.beginScopedWorktreeClosingTurn(f.closingInput);
  f.db.markScopedWorktreeClosingOpened({ ...f.closingInput, nativeProcessOpened: true });
  f.db.recordAgentNativeSessionBinding({ ...f.binding, invocationId: f.closingInput.invocationId, runtimePath: f.closingInput.runtimePath });
  const authority: RestrictedWorktreeClosingAuthority = { invocationId: f.closingInput.invocationId, capabilityHash: f.closingInput.capabilityHash,
    scope: { kind: f.input.observation.kind, reportHeadSha: f.input.observation.reportHeadSha, paths: [...f.files] } };
  const journal = f.db.operationsForProject("p", true, authority), ordinary = f.db.operationsForProject("p", true);
  const checkpoint = { projectId: "p", executionId: "original", ownershipEpoch: 1, restrictedClosing: authority,
    observation: { ...structuredClone(f.input.observation), head: "b".repeat(40), pendingPaths: [], committedPaths: [...f.files], deliveryRequired: true } };
  const record = (kind: OperationRecord["kind"] = "git.push", id = `closing-${kind}`): OperationRecord => ({ id, kind, payloadHash: "c".repeat(64), status: "prepared",
    ownerExecutionId: "original", ownershipEpoch: 1, expectedHead: checkpoint.observation.head,
    expectedBase: kind === "git.push" ? f.execution.executionBranch : "groups/run-G" });
  const assertion = { projectId: "p", executionId: "original", ownershipEpoch: 1, expectedBranch: f.execution.executionBranch,
    operation: "checkpoint" as const, restrictedClosing: authority };
  const finalize = async (operation: OperationRecord, remoteFact: Record<string, unknown>) => {
    await journal.prepare(operation);
    await journal.transition({ id: operation.id, payloadHash: operation.payloadHash, status: "observed", remoteFact });
    return journal.transition({ id: operation.id, payloadHash: operation.payloadHash, status: "finalized", remoteFact });
  };
  return { ...f, authority, journal, ordinary, checkpoint, record, assertion, finalize };
}

describe("actual original-Agent closing return", () => {
  const output = (f: Awaited<ReturnType<typeof closingJournalFixture>>) => ({ ...f.closingInput, inputId: "original-closing-input",
    output: "My actual returned observations\nThe necessary Memory was independently delivered.\n", residentTurnCompleted: true as const,
    handoffPath: path.join(f.root, "messages", "0000_worker_inv_closing_handoff.md") });

  it.each(["completed", "failed"] as const)("retains the %s owner's separate output without finishing business, claiming reception or settling FIFO", async status => {
    const f = await closingJournalFixture(status), before = f.snapshot(), input = output(f);
    const recorded = f.db.recordScopedWorktreeClosingResult(input);
    expect(f.db.recordScopedWorktreeClosingResult(input)).toEqual(recorded);
    expect(recorded).toMatchObject({ projectId: "p", executionId: "original", ownershipEpoch: 1, invocationId: "inv_closing",
      grantInvocationId: f.closingInput.grantInvocationId, grantCallId: f.closingInput.grantCallId, reportHeadSha: HEAD,
      originalSession: f.binding.session, writerLeaseEpoch: 1, inputId: input.inputId, output: input.output,
      outputSha256: createHash("sha256").update(input.output).digest("hex"), handoffPath: input.handoffPath });
    expect(f.db.scopedWorktreeClosingTurns("p")[0]).toMatchObject({ status: "opened", result: recorded });
    expect(f.db.scopedWorktreeClosingTurns("p")[0]?.completion).toBeUndefined();
    expect(f.db.eventsAfter("p").filter(event => event.type === "control.result.received")).toEqual([]);
    expect(f.db.scopedGroupIssues("p")).toHaveLength(1); expect(f.snapshot()).toEqual(before);
    f.db.stopScopedWorktreeClosingTurn({ ...f.closingInput, residentStopConfirmed: true, evidence: { nativeProcessScanCleared: true } });
    expect(() => f.db.recordScopedWorktreeClosingResult(input)).toThrow();
    f.db.close(); f.advance(60_001); const next = f.open();
    expect(next.scopedWorktreeClosingTurns("p")[0]).toMatchObject({ status: "stopped", result: recorded });
    expect(next.scopedWorktreeClosingResult("p", input.invocationId)).toEqual(recorded);
    expect(next.scopedGroupIssues("p")).toHaveLength(1); expect(f.snapshot()).toEqual(before);
  });

  it("does not invent a returned output from the separately accepted finish_task", async () => {
    const f = await closingJournalFixture();
    f.db.completeScopedWorktreeClosing({ ...f.closingInput, controlCapabilityHash: f.closingInput.capabilityHash, envelope: { projectId: "p", agent: "worker", invocationId: "inv_closing", callId: "finish",
      stateVersion: 1, capabilityHash: f.closingInput.capabilityHash, receivedAt: f.input.observation.observedAt, action: { tool: "finish_task", summary: "My finish only" } } });
    expect(f.db.scopedWorktreeClosingResult("p", "inv_closing")).toBeUndefined();
    expect(f.db.scopedWorktreeClosingTurns("p")[0]?.result).toBeUndefined();
  });

  it.each(["output", "input", "path"])("keeps accepted actual output immutable on changed %s", async fault => {
    const f = await closingJournalFixture(), input = output(f), recorded = f.db.recordScopedWorktreeClosingResult(input), changed = { ...input };
    if (fault === "output") changed.output += "Replaced later\n";
    if (fault === "input") changed.inputId = "another-input";
    if (fault === "path") changed.handoffPath = path.join(f.root, "another-output.md");
    expect(() => f.db.recordScopedWorktreeClosingResult(changed)).toThrow("changed on replay");
    expect(f.db.scopedWorktreeClosingResult("p", "inv_closing")).toEqual(recorded);
  });

  it.each(["pause", "cancel"])("retains a real native return during %s while tools stay revoked", async intent => {
    const f = await closingJournalFixture(), before = f.snapshot();
    if (intent === "pause") f.edit("UPDATE project_heads SET frozen = 1 WHERE project_id = 'p'");
    else f.db.appendEvent({ projectId: "p", requestId: "cancel-return", type: "project.cancellation.requested", payload: { source: "user" } });
    expect(() => f.db.assertScopedWorktreeClosingControl(f.closingInput)).toThrow();
    expect(f.db.recordScopedWorktreeClosingResult(output(f)).output).toBe(output(f).output);
    expect(() => f.db.assertScopedWorktreeClosingControl(f.closingInput)).toThrow();
    expect(f.snapshot()).toEqual(before); expect(f.db.scopedGroupIssues("p")).toHaveLength(1);
  });

  it.each(["unopened", "missing-binding", "wrong-agent", "wrong-owner", "wrong-epoch", "wrong-invocation", "no-native-return", "empty-output", "oversized-output", "nul-output", "bad-input", "relative-path", "alias-path"])("rejects %s without an invented actual return", async fault => {
    const f = fault === "unopened" ? await closingFixture() : await closingJournalFixture(), input = output(f as any);
    if (fault === "unopened") f.db.beginScopedWorktreeClosingTurn(f.closingInput);
    if (fault === "missing-binding") f.db.recordAgentNativeSessionBinding({ ...f.binding, invocationId: "another-native-turn", runtimePath: path.join(f.root, "runtime", "another-native-turn") });
    if (fault === "wrong-agent") input.agentId = "another";
    if (fault === "wrong-owner") input.executionId = "another";
    if (fault === "wrong-epoch") input.ownershipEpoch = 2;
    if (fault === "wrong-invocation") input.invocationId = "another";
    if (fault === "no-native-return") input.residentTurnCompleted = false as any;
    if (fault === "empty-output") input.output = "  ";
    if (fault === "oversized-output") input.output = "a".repeat(100_001);
    if (fault === "nul-output") input.output += "\0";
    if (fault === "bad-input") input.inputId = "native\ninput";
    if (fault === "relative-path") input.handoffPath = "messages/closing.md";
    if (fault === "alias-path") input.handoffPath = `${f.root}/messages/../closing.md`;
    expect(() => f.db.recordScopedWorktreeClosingResult(input)).toThrow();
    expect(f.db.scopedWorktreeClosingResult("p", f.closingInput.invocationId)).toBeUndefined();
  });

  it("fences an old writer's callback and keeps its previously accepted actual output through handoff", async () => {
    const f = await closingJournalFixture(), input = output(f), recorded = f.db.recordScopedWorktreeClosingResult(input);
    f.advance(60_001); const next = f.open();
    expect(() => f.db.recordScopedWorktreeClosingResult(input)).toThrow();
    expect(() => next.recordScopedWorktreeClosingResult(input)).toThrow();
    expect(next.scopedWorktreeClosingResult("p", input.invocationId)).toEqual(recorded);
  });
});

describe("separate original-Agent closing completion", () => {
  const finish = (f: Awaited<ReturnType<typeof closingFixture>>): ControlActionEnvelope => ({ projectId: "p", agent: "worker",
    invocationId: f.closingInput.invocationId, callId: "my-closing-finish", stateVersion: 1, capabilityHash: f.closingInput.capabilityHash,
    receivedAt: "2026-10-10T09:00:00.000Z", action: { tool: "finish_task", summary: "My actual closing supplement", memory: "My supplemental observations" } });

  it.each(["completed", "failed"] as const)("retains the %s owner's immutable business facts and separate finish through restart and Stop", async status => {
    const f = await closingJournalFixture(status), original = f.snapshot(), envelope = finish(f);
    const receipt = f.db.completeScopedWorktreeClosing({ ...f.closingInput, controlCapabilityHash: f.closingInput.capabilityHash, envelope });
    expect(receipt).toMatchObject({ projectId: "p", executionId: "original", ownershipEpoch: 1, invocationId: "inv_closing",
      grantInvocationId: f.closingInput.grantInvocationId, grantCallId: f.closingInput.grantCallId, reportHeadSha: HEAD,
      originalSession: f.binding.session, writerLeaseEpoch: 1, callId: envelope.callId, summary: envelope.action.tool === "finish_task" ? envelope.action.summary : undefined,
      memorySha256: expect.any(String) });
    const seq = f.db.projectState("p").eventSeq;
    expect(f.db.completeScopedWorktreeClosing({ ...f.closingInput, controlCapabilityHash: f.closingInput.capabilityHash, envelope: { ...envelope, receivedAt: "2026-10-10T09:00:01.000Z" } })).toEqual(receipt);
    expect(f.db.projectState("p").eventSeq).toBe(seq);
    expect(f.db.scopedWorktreeClosingTurns("p")[0]).toMatchObject({ status: "opened", completion: receipt });
    expect(f.leases()).toHaveLength(1); expect(f.db.scopedGroupIssues("p")).toHaveLength(1);
    expect(f.db.scopedWorktreeClosingCheckpoint("p", "inv_closing")).toBeUndefined();
    f.db.stopScopedWorktreeClosingTurn({ ...f.closingInput, residentStopConfirmed: true, evidence: { nativeGone: true } });
    expect(() => f.db.completeScopedWorktreeClosing({ ...f.closingInput, controlCapabilityHash: f.closingInput.capabilityHash, envelope })).toThrow();
    f.db.close(); f.advance(60_001); const next = f.open();
    expect(next.scopedWorktreeClosingCompletion("p", "inv_closing")).toEqual(receipt);
    expect(next.scopedWorktreeClosingTurns("p")[0]).toMatchObject({ status: "stopped", completion: receipt });
    expect(next.scopedGroupIssues("p")).toHaveLength(1); expect(f.snapshot()).toEqual(original);
  });

  it.each(["callId", "summary", "memory"] as const)("does not replace accepted closing %s", async field => {
    const f = await closingJournalFixture(), envelope = finish(f);
    const receipt = f.db.completeScopedWorktreeClosing({ ...f.closingInput, controlCapabilityHash: f.closingInput.capabilityHash, envelope });
    const changed = structuredClone(envelope);
    if (field === "callId") changed.callId = "a-new-receipt";
    else changed.action = { ...changed.action, [field]: "Replacement" } as never;
    expect(() => f.db.completeScopedWorktreeClosing({ ...f.closingInput, controlCapabilityHash: f.closingInput.capabilityHash, envelope: changed })).toThrow("immutable");
    expect(f.db.scopedWorktreeClosingCompletion("p", "inv_closing")).toEqual(receipt);
  });

  it("keeps an Agent's omitted memory absent and retains its receipt after a writer handoff without renewing tools", async () => {
    const f = await closingJournalFixture(), envelope = { ...finish(f), action: { tool: "finish_task" as const } };
    const original = f.snapshot(), receipt = f.db.completeScopedWorktreeClosing({ ...f.closingInput, controlCapabilityHash: f.closingInput.capabilityHash, envelope });
    expect(receipt).not.toHaveProperty("memory"); expect(receipt).not.toHaveProperty("memorySha256"); expect(receipt).not.toHaveProperty("summary");
    f.advance(60_001); const next = f.open();
    expect(next.scopedWorktreeClosingCompletion("p", "inv_closing")).toEqual(receipt);
    expect(() => next.completeScopedWorktreeClosing({ ...f.closingInput, controlCapabilityHash: f.closingInput.capabilityHash, envelope })).toThrow();
    expect(next.openRuntimeActivities("p", false)).toMatchObject([{ leaseState: "recovering", invocationId: "inv_closing" }]);
    next.stopScopedWorktreeClosingTurn({ ...f.closingInput, residentStopConfirmed: true, evidence: { nativeGone: true }, priorWriterLeaseEpoch: 1 });
    expect(next.scopedGroupIssues("p")).toHaveLength(1); expect(f.snapshot()).toEqual(original);
  });

  it.each(["wrong-agent", "wrong-execution", "wrong-epoch", "wrong-invocation", "wrong-capability", "wrong-project", "not-opened", "wrong-session",
    "pause", "cancel", "stopped", "expired-writer", "expired-capability", "not-finish", "empty-memory", "extra-action-field"])("rejects %s closing finish without an accepted receipt", async fault => {
    const f = fault === "not-opened" ? await closingFixture() : await closingJournalFixture();
    if (fault === "not-opened") f.db.beginScopedWorktreeClosingTurn(f.closingInput);
    const envelope = finish(f), input = { ...f.closingInput, controlCapabilityHash: f.closingInput.capabilityHash, envelope }, original = f.snapshot();
    if (fault === "wrong-agent") envelope.agent = "reviewer";
    if (fault === "wrong-execution") input.executionId = "different";
    if (fault === "wrong-epoch") input.ownershipEpoch = 2;
    if (fault === "wrong-invocation") envelope.invocationId = "inv_original";
    if (fault === "wrong-capability") envelope.capabilityHash = "e".repeat(64);
    if (fault === "wrong-project") envelope.projectId = "other";
    if (fault === "wrong-session") f.db.recordAgentNativeSessionBinding({ ...f.binding, invocationId: "inv_different", runtimePath: path.join(f.root, "runtime", "inv_different") });
    if (fault === "pause") f.edit("UPDATE project_heads SET frozen = 1 WHERE project_id = 'p'");
    if (fault === "cancel") f.db.appendEvent({ projectId: "p", requestId: "cancel-finish", type: "project.cancellation.requested", payload: { source: "user" } });
    if (fault === "stopped") f.db.stopScopedWorktreeClosingTurn({ ...f.closingInput, residentStopConfirmed: true, evidence: { nativeGone: true } });
    if (fault === "expired-writer") f.advance(60_001);
    if (fault === "expired-capability") envelope.expiresAt = envelope.receivedAt;
    if (fault === "not-finish") envelope.action = { tool: "git_push", reason: "Not a finish" };
    if (fault === "empty-memory") envelope.action = { tool: "finish_task", memory: " " };
    if (fault === "extra-action-field") envelope.action = { tool: "finish_task", path: "business.txt" } as never;
    expect(() => f.db.completeScopedWorktreeClosing(input)).toThrow();
    expect(f.db.scopedWorktreeClosingCompletion("p", "inv_closing")).toBeUndefined();
    expect(f.snapshot()).toEqual(original);
  });
});

describe("separate closing Git journal authority", () => {
  const lateMerge = async (synchronized = true) => {
    const f = await closingJournalFixture("failed"), operation = f.record("pull.merge", "closing-merge");
    await f.journal.recordRestrictedClosingCheckpoint!(f.checkpoint);
    const request = agentGitOperationJournal(f.db, "p").recordRequest({ operationId: operation.id, projectId: "p", executionId: "original", ownershipEpoch: 1,
      executionBranch: f.execution.executionBranch, integrationTarget: "groups/run-G", repository: { owner: "example", name: "project" }, agentId: "worker",
      invocationId: f.authority.invocationId, callId: "my-original-closing-merge", requestedAt: f.input.observation.observedAt,
      expectedHead: operation.expectedHead, action: { tool: "github_merge_pr", providerNumber: 4, reason: "Deliver my necessary Memory B" } });
    const pull = { id: "pr-closing", providerNumber: 4, owner: "example", repository: "project", htmlUrl: "https://github.com/example/project/pull/4",
      head: f.execution.executionBranch, headSha: operation.expectedHead!, base: "groups/run-G", ownerExecutionId: "original", status: "merged",
      mergeCommitSha: "f".repeat(40), checks: [], observedAt: f.input.observation.observedAt };
    await f.finalize(operation, pull);
    const identity = { projectId: "p", executionId: "original", ownershipEpoch: 1, providerNumber: 4,
      expectedHead: pull.headSha, expectedBase: pull.base, expectedMergeCommitSha: pull.mergeCommitSha };
    const sync = { projectId: "p", operationId: mergedPullSynchronizationOperationId("original", 1, pull.headSha, pull.base, pull.mergeCommitSha),
      targetBranch: pull.base, expectedSourceHead: pull.headSha, mergeCommitSha: pull.mergeCommitSha, remoteHead: pull.mergeCommitSha,
      localHeadBefore: HEAD, localHeadAfter: pull.mergeCommitSha, status: "synchronized" as const, observedAt: f.input.observation.observedAt };
    if (synchronized) await f.journal.recordMergedSynchronization({ ...identity, synchronization: sync });
    return { ...f, request, identity, sync };
  };

  it.each([false, true])("transports the exact late B result after Stop, keeps native receipt pending and preserves A (local sync=%s)", async synchronized => {
    const f = await lateMerge(synchronized), before = f.snapshot();
    f.db.stopScopedWorktreeClosingTurn({ ...f.closingInput, residentStopConfirmed: true, evidence: { nativeProcessScanCleared: true } });
    await captureKnownAgentGitResults(f.db, "p"); await captureKnownAgentGitResults(f.db, "p");
    const pending = f.db.pendingControlResultEvents("p", "worker"); expect(pending).toHaveLength(1);
    expect(pending[0]?.payload.receipt).toMatchObject({ invocationId: f.authority.invocationId, session: f.binding.session,
      result: { request: f.request, operation: { id: "closing-merge", expectedHead: f.checkpoint.observation.head },
        status: synchronized ? "completed" : "remote_success_local_pending", localStage: synchronized ? "synchronized" : "synchronization_pending",
        ...(synchronized ? { localSynchronization: f.sync } : {}) } });
    expect(f.db.scopedMergedSynchronization(f.identity)).toBeUndefined(); expect(f.snapshot()).toEqual(before);
    const context = { projectId: "p", agentId: "worker", invocationId: "next-legitimate-input", session: f.binding.session, executionContext: f.binding.executionContext };
    const receipts = controlResultReceipts(f.db, context), text = receipts.prepareNotification("native-input");
    expect(text).toContain("my-original-closing-merge"); expect(f.db.pendingControlResultEvents("p", "worker")).toHaveLength(1);
    receipts.observeNative({ invocationId: context.invocationId, harnessId: "pi", eventId: "queued-input", kind: "input.queued", message: text });
    expect(f.db.pendingControlResultEvents("p", "worker")).toHaveLength(1);
    receipts.observeNative({ invocationId: context.invocationId, harnessId: "pi", eventId: "actual-input", kind: "user.message", sourceType: "fixture-native-event", message: text });
    expect(f.db.pendingControlResultEvents("p", "worker")).toEqual([]); expect(f.snapshot()).toEqual(before);
  });

  it("supplements a pending B merge with its later independent synchronization without rewriting the earlier return", async () => {
    const f = await lateMerge(false); await captureKnownAgentGitResults(f.db, "p");
    const original = f.db.pendingControlResultEvents("p", "worker")[0]!;
    await f.journal.recordMergedSynchronization({ ...f.identity, synchronization: f.sync });
    await captureKnownAgentGitResults(f.db, "p"); await captureKnownAgentGitResults(f.db, "p");
    expect(f.db.eventByRequestId("p", original.requestId!)?.payload).toEqual(original.payload);
    expect(f.db.pendingControlResultEvents("p", "worker").map(event => (event.payload.receipt as any).origin.status)).toEqual(["remote_success_local_pending", "completed"]);
  });

  it.each(["missing-binding", "wrong-invocation", "wrong-head", "wrong-report", "wrong-payload"])("rejects %s before transporting an independently bound B", async fault => {
    const f = await lateMerge(), requestId = "scoped-worktree-closing-operation:closing-merge";
    const lookup = f.db.eventByRequestId.bind(f.db), original = lookup("p", requestId)!;
    // Corrupt the read boundary only; SQLite's append-only history remains
    // protected even in negative fixtures.
    const spy = vi.spyOn(f.db, "eventByRequestId").mockImplementation((project, id) => {
      if (id !== requestId) return lookup(project, id);
      if (fault === "missing-binding") return undefined;
      const binding = structuredClone(original);
      if (fault === "wrong-invocation") binding.invocationId = "another-invocation";
      if (fault === "wrong-head") binding.payload.headSha = HEAD;
      if (fault === "wrong-report") binding.payload.reportHeadSha = "e".repeat(40);
      if (fault === "wrong-payload") binding.payload.operationPayloadHash = "d".repeat(64);
      return binding;
    });
    try {
      await expect(captureKnownAgentGitResults(f.db, "p")).rejects.toThrow("separate original invocation binding");
      expect(f.db.pendingControlResultEvents("p", "worker")).toEqual([]);
    } finally { spy.mockRestore(); }
    expect(lookup("p", requestId)).toEqual(original);
  });

  it("connects real exact-file Git checkpoint/publication to SQLite's opened closing invocation", async () => {
    const cleanupRoot = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-closing-journal-git-"));
    const root = path.join(cleanupRoot, "p"); await fs.mkdir(root);
    const bootstrap: CollaborationGitOperationStore = { prepare: async () => { throw new Error("No business owner yet"); },
      transition: async () => { throw new Error("No business journal yet"); }, assertExecutionOwnership: async () => { throw new Error("No business owner yet"); },
      checkpointInitialization: async () => {}, recordMergedSynchronization: async () => {} };
    const initial = new LocalCollaborationGitService({ projectId: "p", projectRoot: root, worktreeMode: "agent", operationStore: bootstrap });
    await initial.initializeMain({ title: "Actual closing fixture", operationId: "init" });
    const worktree = await initial.prepareAgentManagementWorkspace("worker");
    const rawGit = (args: string[], cwd = worktree) => execFileSync("git", ["-c", "core.hooksPath=/dev/null", ...args], {
      cwd, encoding: "utf8", stdio: "pipe", env: { ...process.env, GIT_AUTHOR_NAME: "Original Agent", GIT_AUTHOR_EMAIL: "worker@example.test",
        GIT_COMMITTER_NAME: "Original Agent", GIT_COMMITTER_EMAIL: "worker@example.test" } }).trim();
    rawGit(["switch", "-c", "executions/original"]);
    await fs.mkdir(path.join(worktree, "agent-memory/worker"), { recursive: true });
    await fs.writeFile(path.join(worktree, "agent-memory/worker/Memory.md"), "Immutable business A\n");
    rawGit(["add", "--all"]); rawGit(["commit", "-m", "Original business A"]);
    const reportHeadSha = rawGit(["rev-parse", "HEAD"]);
    await fs.appendFile(path.join(worktree, "agent-memory/worker/Memory.md"), "My necessary Memory after A\n");
    const f = await closingJournalFixture("failed", { root, reportHeadSha, cleanupRoot });
    const local = new LocalCollaborationGitService({ projectId: "p", projectRoot: root, worktreeMode: "agent", operationStore: f.journal,
      allowLocalRemotes: true, now: () => f.input.observation.observedAt });
    const remote = path.join(root, "remote.git"); rawGit(["init", "--bare", remote]); await local.configureOrigin(remote);
    const provider = { observeRef: async (owner: string, repository: string, ref: string) => {
      const sha = rawGit(["for-each-ref", "--format=%(objectname)", `refs/heads/${ref}`], remote);
      return { owner, repository, ref, status: sha ? "present" : "missing", ...(sha ? { sha } : {}), observedAt: f.input.observation.observedAt };
    } };
    const git = new CollaborationGitFacade({ localGit: local, operationStore: f.journal,
      provider: provider as unknown as ConstructorParameters<typeof CollaborationGitFacade>[0]["provider"] });
    const result = await git.checkpointAndPush({ execution: { ...f.execution, purpose: "delivery", restrictedClosing: f.authority },
      ownershipEpoch: 1, operationId: "actual-closing-push", checkpointKind: "checkpoint", reason: "Save my necessary Memory",
      repository: { provider: "github", providerId: 1, owner: "example", name: "project", htmlUrl: "https://github.com/example/project",
        cloneUrl: "https://github.com/example/project.git", private: true, defaultBranch: "main", observedAt: f.input.observation.observedAt } });
    expect(result.remote?.sha).toBe(result.checkpoint.commitSha);
    expect(f.db.scopedWorktreeClosingCheckpoint("p", f.authority.invocationId)?.head).toBe(result.checkpoint.commitSha);
    expect(f.db.scopedWorktreeClosingOperations("p", f.authority.invocationId)).toMatchObject([
      { id: "actual-closing-push", expectedHead: result.checkpoint.commitSha, status: "finalized" }]);
    expect(f.db.scopedAgentReport("p", "original", 1)?.headSha).toBe(reportHeadSha);
    expect(rawGit(["show", `${reportHeadSha}:agent-memory/worker/Memory.md`])).toBe("Immutable business A");
    expect(rawGit(["diff", "--name-only", reportHeadSha, result.checkpoint.commitSha])).toBe("agent-memory/worker/Memory.md");
    expect(rawGit(["status", "--porcelain=v1"])).toBe("");
  }, process.platform === "win32" ? 120_000 : 30_000);
  it.each(["completed", "failed"] as const)("retains a %s owner's A while recording B push/PR/merge and separate local synchronization", async status => {
    const f = await closingJournalFixture(status), before = f.snapshot();
    await f.journal.recordRestrictedClosingCheckpoint!(f.checkpoint);
    await f.journal.assertExecutionOwnership(f.assertion);
    const oldPull = { id: "pr-original", providerNumber: 3, owner: "example", repository: "project", htmlUrl: "https://github.com/example/project/pull/3",
      head: f.execution.executionBranch, headSha: HEAD, base: "groups/run-G", ownerExecutionId: "original", status: "merged", mergeCommitSha: "d".repeat(40), checks: [], observedAt: f.input.observation.observedAt };
    f.edit(`INSERT INTO scoped_operations(operation_id,project_id,kind,payload_hash,status,owner_execution_id,ownership_epoch,expected_head,expected_base,remote_fact_json,created_at,updated_at)
      VALUES ('old-merge','p','pull.merge',?,'finalized','original',1,?,'groups/run-G',?,?,?)`, "e".repeat(64), HEAD, JSON.stringify(oldPull), oldPull.observedAt, oldPull.observedAt);
    const originalPull = f.db.projectState("p").scopedPullRequests!;
    expect(originalPull).toHaveLength(1); expect(originalPull[0]?.providerNumber).toBe(3);
    await f.finalize(f.record(), { owner: "example", repository: "project", ref: f.execution.executionBranch,
      sha: f.checkpoint.observation.head, status: "present", observedAt: f.input.observation.observedAt });
    const pull = { ...oldPull, id: "pr-closing", providerNumber: 4, htmlUrl: "https://github.com/example/project/pull/4",
      headSha: f.checkpoint.observation.head, mergeCommitSha: "f".repeat(40) };
    await f.finalize(f.record("pull.create"), { ...pull, status: "open" });
    await f.finalize(f.record("pull.merge"), pull);
    const identity = { projectId: "p", executionId: "original", ownershipEpoch: 1, providerNumber: 4,
      expectedHead: pull.headSha, expectedBase: pull.base, expectedMergeCommitSha: pull.mergeCommitSha };
    const sync = { projectId: "p", operationId: mergedPullSynchronizationOperationId("original", 1, pull.headSha, pull.base, pull.mergeCommitSha),
      targetBranch: pull.base, expectedSourceHead: pull.headSha, mergeCommitSha: pull.mergeCommitSha, remoteHead: pull.mergeCommitSha,
      localHeadBefore: HEAD, localHeadAfter: pull.mergeCommitSha, status: "synchronized" as const, observedAt: f.input.observation.observedAt };
    await f.journal.recordMergedSynchronization({ ...identity, synchronization: sync });
    await f.journal.recordMergedSynchronization({ ...identity, synchronization: sync });
    expect(f.db.scopedMergedSynchronization(identity)).toBeUndefined();
    expect(f.db.scopedMergedSynchronization(identity, f.authority.invocationId)).toEqual(sync);
    expect(f.db.scopedMergedSynchronization(identity, "other-invocation")).toBeUndefined();
    await expect(f.journal.assertExecutionOwnership({ ...f.assertion, ...identity, expectedHeadSha: pull.headSha, operation: "provider.reconcile_merged" })).resolves.toBeUndefined();
    expect(f.db.projectState("p").scopedPullRequests).toEqual(originalPull);
    expect(f.db.scopedWorktreeClosingOperations("p", f.authority.invocationId)).toHaveLength(3);
    const after = f.snapshot(); delete before.scoped_operations; delete after.scoped_operations; expect(after).toEqual(before);
    expect(f.db.scopedAgentReport("p", "original", 1)?.headSha).toBe(HEAD);
    expect(f.db.scopedGroupIssues("p")).toHaveLength(1);
  });

  it.each(["ordinary-store", "missing-binding", "wrong-capability", "wrong-scope", "wrong-owner", "business-checkout"])("rejects %s at the live Git boundary", async fault => {
    const f = await closingJournalFixture(), assertion = structuredClone(f.assertion);
    if (fault === "missing-binding") delete (assertion as { restrictedClosing?: unknown }).restrictedClosing;
    if (fault === "wrong-capability") assertion.restrictedClosing.capabilityHash = "f".repeat(64);
    if (fault === "wrong-scope") assertion.restrictedClosing.scope.paths = ["another.txt"];
    if (fault === "wrong-owner") assertion.executionId = "another";
    if (fault === "business-checkout") assertion.operation = "worktree.create" as typeof assertion.operation;
    await expect((fault === "ordinary-store" ? f.ordinary : f.journal).assertExecutionOwnership(assertion)).rejects.toThrow();
    expect(f.db.scopedWorktreeClosingOperations("p", f.authority.invocationId)).toEqual([]);
  });

  it.each(["dirty", "extra-path", "changed-report", "stale"])("does not record a %s checkpoint as B", async fault => {
    const f = await closingJournalFixture(), checkpoint = structuredClone(f.checkpoint);
    if (fault === "dirty") checkpoint.observation.pendingPaths = [...f.files];
    if (fault === "extra-path") checkpoint.observation.committedPaths.push("another-task.txt");
    if (fault === "changed-report") checkpoint.observation.reportHeadSha = "c".repeat(40);
    if (fault === "stale") checkpoint.observation.observedAt = "2026-10-10T08:58:00.000Z";
    await expect(f.journal.recordRestrictedClosingCheckpoint!(checkpoint)).rejects.toThrow();
    expect(f.db.scopedWorktreeClosingCheckpoint("p", f.authority.invocationId)).toBeUndefined();
  });

  it.each(["no-checkpoint", "report-A", "other-head", "other-base", "other-kind", "other-epoch", "stale-checkpoint"])("refuses %s in a new provider operation", async fault => {
    const f = await closingJournalFixture(), operation = f.record();
    if (fault !== "no-checkpoint") await f.journal.recordRestrictedClosingCheckpoint!(f.checkpoint);
    if (fault === "report-A") operation.expectedHead = HEAD;
    if (fault === "other-head") operation.expectedHead = "c".repeat(40);
    if (fault === "other-base") operation.expectedBase = "groups/another-group";
    if (fault === "other-kind") operation.kind = "memory.commit";
    if (fault === "other-epoch") operation.ownershipEpoch = 2;
    if (fault === "stale-checkpoint") { f.advance(30_000); f.db.renewWriterLease(); f.advance(30_001); }
    await expect(f.journal.prepare(operation)).rejects.toThrow();
    expect(f.db.recordedGitOperation("p", operation.id)).toBeUndefined();
  });

  it("cannot adopt an old business operation or mutate closing operations through ordinary authority", async () => {
    const f = await closingJournalFixture(); await f.journal.recordRestrictedClosingCheckpoint!(f.checkpoint);
    const original = f.record("git.push", "old-business");
    f.edit(`INSERT INTO scoped_operations(operation_id,project_id,kind,payload_hash,status,owner_execution_id,ownership_epoch,expected_head,expected_base,created_at,updated_at)
      VALUES (?,'p','git.push',?,'prepared','original',1,?,?,?,?)`, original.id, original.payloadHash, original.expectedHead!, original.expectedBase!, f.input.observation.observedAt, f.input.observation.observedAt);
    await expect(f.journal.prepare(original)).rejects.toThrow("different business or closing invocation");
    await expect(f.journal.transition({ id: original.id, payloadHash: original.payloadHash, status: "uncertain" })).rejects.toThrow();
    const closing = await f.journal.prepare(f.record());
    await expect(f.ordinary.prepare(f.record())).rejects.toThrow("different business or closing invocation");
    await expect(f.ordinary.transition({ id: closing.id, payloadHash: closing.payloadHash, status: "uncertain" })).rejects.toThrow();
    expect(await f.ordinary.recordedOperation!(closing.id)).toEqual(closing);
    expect(f.db.scopedWorktreeClosingOperations("p", f.authority.invocationId)).toHaveLength(1);
  });

  it.each(["stop", "pause", "cancel", "writer"])("revokes closing journal mutations after %s", async reason => {
    const f = await closingJournalFixture(); await f.journal.recordRestrictedClosingCheckpoint!(f.checkpoint);
    const operation = await f.journal.prepare(f.record());
    if (reason === "stop") f.db.stopScopedWorktreeClosingTurn({ ...f.closingInput, residentStopConfirmed: true, evidence: { cleared: true } });
    if (reason === "pause") f.edit("UPDATE project_heads SET frozen = 1 WHERE project_id = 'p'");
    if (reason === "cancel") f.db.appendEvent({ projectId: "p", requestId: "cancel-closing", type: "project.cancellation.requested", payload: { source: "user" } });
    if (reason === "writer") { f.advance(60_001); f.open(); }
    await expect(f.journal.assertExecutionOwnership(f.assertion)).rejects.toThrow();
    await expect(f.journal.prepare(f.record("pull.create"))).rejects.toThrow();
    await expect(f.journal.transition({ id: operation.id, payloadHash: operation.payloadHash, status: "uncertain" })).rejects.toThrow();
    await expect(f.journal.recordRestrictedClosingCheckpoint!(f.checkpoint)).rejects.toThrow();
    expect(f.db.recordedGitOperation("p", operation.id)?.status).toBe("prepared");
  });

  it("requires this closing invocation's finalized merge for local synchronization", async () => {
    const f = await closingJournalFixture(); await f.journal.recordRestrictedClosingCheckpoint!(f.checkpoint);
    await expect(f.journal.assertExecutionOwnership({ ...f.assertion, operation: "provider.reconcile_merged", expectedHeadSha: f.checkpoint.observation.head,
      expectedBase: "groups/run-G", expectedMergeCommitSha: "f".repeat(40), providerNumber: 3 })).rejects.toThrow();
  });
});

async function closingFixture(status: "completed" | "failed" = "completed", releaseManager = true, seed?: FixtureSeed) {
  const f = await fixture(status, seed);
  f.db.recordScopedWorktreeClosingIssue(f.input);
  const m = f.manager();
  f.db.acceptScopedLeaderAction({ ...m.input, residentStopConfirmed: true });
  if (releaseManager) f.db.releaseScopedLeaderTurn({ ...m.scope, residentStopConfirmed: true });
  const input: BeginScopedWorktreeClosingTurnInput = { projectId: "p", agentId: "worker", executionId: "original", ownershipEpoch: 1,
    invocationId: "inv_closing", runtimePath: path.join(f.root, "runtime", "inv_closing"), capabilityHash: "d".repeat(64),
    grantInvocationId: m.scope.invocationId, grantCallId: m.input.envelope.callId,
    originalStop: structuredClone(f.input.originalStop), observation: structuredClone(f.input.observation) };
  const leases = () => { const raw = new DatabaseSync(f.databasePath); try { return raw.prepare("SELECT * FROM lane_leases ORDER BY lane,slot").all(); } finally { raw.close(); } };
  const copy = (table: string, overrides: Record<string, string | number | null>, omit?: string) => {
    const raw = new DatabaseSync(f.databasePath);
    try {
      const row = { ...raw.prepare(`SELECT * FROM ${table} LIMIT 1`).get(), ...overrides } as Record<string, string | number | null>;
      if (omit) delete row[omit];
      const fields = Object.keys(row);
      raw.prepare(`INSERT INTO ${table} (${fields.join(",")}) VALUES (${fields.map(() => "?").join(",")})`).run(...Object.values(row));
    } finally { raw.close(); }
  };
  return { ...f, m, closingInput: input, leases, copy };
}

describe("original-owner closing native lifecycle", () => {
  it.each(["completed", "failed"] as const)("reserves and stops a %s owner's one supplement without touching business facts", async status => {
    const f = await closingFixture(status), original = f.snapshot();
    const reserved = f.db.beginScopedWorktreeClosingTurn(f.closingInput)!;
    expect(reserved).toMatchObject({ replay: false, turn: { status: "reserved", executionId: "original",
      originalSession: f.binding.session, previousInvocationId: "inv_original", paths: f.files, writerLeaseEpoch: 1 } });
    expect(f.leases()).toMatchObject([{ lane: "worker", owner_kind: "execution", owner_id: "closing:inv_closing" }]);
    expect(f.db.openRuntimeActivities("p", false)).toMatchObject([{ activityId: "scoped-closing:inv_closing", phase: "resident:starting" }]);
    expect(f.db.beginScopedWorktreeClosingTurn(f.closingInput)).toMatchObject({ replay: true, turn: reserved.turn });
    expect(f.db.assertScopedWorktreeClosingLaunch({ ...f.closingInput })).toEqual(reserved.turn);
    expect(() => f.db.assertScopedWorktreeClosingControl(f.closingInput)).toThrow("opened");
    f.db.markScopedWorktreeClosingOpened({ ...f.closingInput, nativeProcessOpened: true });
    f.db.markScopedWorktreeClosingOpened({ ...f.closingInput, nativeProcessOpened: true });
    expect(() => f.db.assertScopedWorktreeClosingControl(f.closingInput)).toThrow("native Session binding");
    f.db.recordAgentNativeSessionBinding({ ...f.binding, invocationId: f.closingInput.invocationId, runtimePath: f.closingInput.runtimePath });
    expect(f.db.assertScopedWorktreeClosingControl(f.closingInput).status).toBe("opened");
    expect(() => f.db.assertScopedWorktreeClosingLaunch(f.closingInput)).toThrow("unused");
    expect(f.db.openRuntimeActivities("p", false)).toMatchObject([{ activityId: "scoped-closing:inv_closing", phase: "resident:running" }]);
    expect(() => f.db.assertScopedGitExecutionOwnership({ projectId: "p", executionId: "original", ownershipEpoch: 1,
      expectedBranch: f.execution.executionBranch, operation: "checkpoint" })).toThrow();
    const stop = { ...f.closingInput, residentStopConfirmed: true as const, evidence: { physicalProcessScanCleared: true } };
    f.db.stopScopedWorktreeClosingTurn(stop); f.db.stopScopedWorktreeClosingTurn(stop);
    expect(f.db.scopedWorktreeClosingTurns("p")).toMatchObject([{ status: "stopped", openedAt: expect.any(String), stoppedAt: expect.any(String) }]);
    expect(f.db.openRuntimeActivities("p", false)).toEqual([]); expect(f.leases()).toEqual([]);
    expect(() => f.db.assertScopedWorktreeClosingControl(f.closingInput)).toThrow("stale");
    expect(f.db.beginScopedWorktreeClosingTurn(f.closingInput)).toMatchObject({ replay: true, turn: { status: "stopped" } });
    expect(f.db.scopedGroupIssues("p")).toHaveLength(1); // Stop is not successful delivery/closing.
    expect(f.snapshot()).toEqual(original);
  });

  it("waits for the direct Leader's release and preserves an unconsumed grant while worker capacity is occupied", async () => {
    const f = await closingFixture("completed", false);
    expect(f.db.beginScopedWorktreeClosingTurn(f.closingInput)).toBeUndefined();
    expect(f.db.scopedWorktreeClosingTurns("p")).toEqual([]);
    f.db.releaseScopedLeaderTurn({ ...f.m.scope, residentStopConfirmed: true });
    f.edit("INSERT INTO lane_leases(project_id,lane,slot,owner_kind,owner_id,acquired_at) VALUES ('p','worker',1,'execution','another-owner','2026-10-10T09:00:00.000Z')");
    expect(f.db.beginScopedWorktreeClosingTurn(f.closingInput)).toBeUndefined();
    expect(f.db.scopedWorktreeClosingTurns("p")).toEqual([]);
    f.edit("DELETE FROM lane_leases WHERE owner_id = 'another-owner'");
    expect(f.db.beginScopedWorktreeClosingTurn(f.closingInput)?.replay).toBe(false);
  });

  it("cannot reserve a second invocation or alter its accepted payload, even after physical stop", async () => {
    const f = await closingFixture(); f.db.beginScopedWorktreeClosingTurn(f.closingInput);
    const another = { ...f.closingInput, invocationId: "inv_second", runtimePath: path.join(f.root, "runtime", "inv_second") };
    expect(() => f.db.beginScopedWorktreeClosingTurn(another)).toThrow("one native invocation");
    expect(() => f.db.beginScopedWorktreeClosingTurn({ ...f.closingInput, capabilityHash: "e".repeat(64) })).toThrow("changed on replay");
    f.db.stopScopedWorktreeClosingTurn({ ...f.closingInput, residentStopConfirmed: true, evidence: { scan: "cleared" } });
    expect(() => f.db.beginScopedWorktreeClosingTurn(another)).toThrow("one native invocation");
    expect(f.db.scopedWorktreeClosingTurns("p")).toHaveLength(1);
  });

  it.each(["grant", "owner", "epoch", "runtime", "capability", "stop", "session", "report", "worktree", "group"])("refuses invalid %s before consuming a grant", async fault => {
    const f = await closingFixture(), input = structuredClone(f.closingInput);
    if (fault === "grant") input.grantCallId = "unknown";
    if (fault === "owner") input.agentId = "other";
    if (fault === "epoch") input.ownershipEpoch = 2;
    if (fault === "runtime") input.runtimePath = path.join(f.root, "other", "inv_closing");
    if (fault === "capability") input.capabilityHash = "not-a-capability";
    if (fault === "stop") input.originalStop.evidence = {};
    if (fault === "session") f.db.recordAgentNativeSessionBinding({ ...f.binding, invocationId: "inv_different", session: { ...f.binding.session, nativeId: "another-session" } });
    if (fault === "report") f.edit("UPDATE scoped_agent_reports SET head_sha = ? WHERE execution_id = 'original'", "b".repeat(40));
    if (fault === "worktree") f.edit("UPDATE scoped_executions SET worktree_path = ? WHERE execution_id = 'original'", path.join(f.root, "foreign", "git-worktrees", "agents", "worker"));
    if (fault === "group") f.edit("UPDATE scoped_group_runs SET status = 'completed' WHERE group_run_id = 'run-G'");
    const before = f.snapshot();
    expect(() => f.db.beginScopedWorktreeClosingTurn(input)).toThrow();
    expect(f.db.scopedWorktreeClosingTurns("p")).toEqual([]); expect(f.leases()).toEqual([]); expect(f.snapshot()).toEqual(before);
  });

  it.each(["old", "extra-pending", "extra-committed", "manifest", "head", "branch", "report", "kind"])("requires a fresh exact %s launch observation", async fault => {
    const f = await closingFixture(), input = structuredClone(f.closingInput);
    if (fault === "old") f.advance(60_001);
    if (fault === "extra-pending") input.observation.pendingPaths.push("unapproved.txt");
    if (fault === "extra-committed") input.observation.committedPaths.push("unapproved.txt");
    if (fault === "manifest") input.observation.authorizedPaths.pop();
    if (fault === "head") input.observation.head = "unknown";
    if (fault === "branch") input.observation.branch = "executions/other";
    if (fault === "report") input.observation.reportHeadSha = "b".repeat(40);
    if (fault === "kind") input.observation.kind = "bound-report-memory";
    expect(() => f.db.beginScopedWorktreeClosingTurn(input)).toThrow();
    expect(f.db.scopedWorktreeClosingTurns("p")).toEqual([]);
  });

  it("rechecks current session, capability and Git observation across launch/open/control boundaries", async () => {
    const f = await closingFixture(); f.db.beginScopedWorktreeClosingTurn(f.closingInput);
    const extra = structuredClone(f.closingInput.observation); extra.pendingPaths.push("extra.txt");
    expect(() => f.db.assertScopedWorktreeClosingLaunch({ ...f.closingInput, observation: extra })).toThrow();
    f.db.recordAgentNativeSessionBinding({ ...f.binding, invocationId: f.closingInput.invocationId, runtimePath: f.closingInput.runtimePath });
    expect(() => f.db.assertScopedWorktreeClosingLaunch(f.closingInput)).toThrow("already has a native Session binding");
    f.db.markScopedWorktreeClosingOpened({ ...f.closingInput, nativeProcessOpened: true });
    expect(f.db.assertScopedWorktreeClosingControl(f.closingInput).originalSession).toEqual(f.binding.session);
    for (const changed of [{ capabilityHash: "e".repeat(64) }, { executionId: "other" }, { agentId: "main" }, { ownershipEpoch: 2 }, { invocationId: "other" }]) {
      expect(() => f.db.assertScopedWorktreeClosingControl({ ...f.closingInput, ...changed })).toThrow();
    }
    f.db.recordAgentNativeSessionBinding({ ...f.binding, invocationId: "inv_changed", runtimePath: path.join(f.root, "runtime", "inv_changed") });
    expect(() => f.db.assertScopedWorktreeClosingControl(f.closingInput)).toThrow();
  });

  it.each(["reserved", "opened"])("retains a %s reservation across writer restart and requires exact old-writer stop", async phase => {
    const f = await closingFixture(); f.db.beginScopedWorktreeClosingTurn(f.closingInput);
    if (phase === "opened") f.db.markScopedWorktreeClosingOpened({ ...f.closingInput, nativeProcessOpened: true });
    const original = f.snapshot(); f.advance(60_001); const next = f.open();
    expect(() => f.db.assertScopedWorktreeClosingControl(f.closingInput)).toThrow();
    expect(() => next.assertScopedWorktreeClosingControl(f.closingInput)).toThrow();
    expect(next.beginScopedWorktreeClosingTurn(f.closingInput)).toMatchObject({ replay: true, turn: { writerLeaseEpoch: 1, status: phase } });
    expect(next.openRuntimeActivities("p", false)).toMatchObject([{ invocationId: "inv_closing", leaseState: "recovering" }]);
    expect(() => next.stopScopedWorktreeClosingTurn({ ...f.closingInput, residentStopConfirmed: true, evidence: { cleared: true } })).toThrow();
    const stop = { ...f.closingInput, residentStopConfirmed: true as const, evidence: { cleared: true }, priorWriterLeaseEpoch: 1 };
    next.stopScopedWorktreeClosingTurn(stop); next.stopScopedWorktreeClosingTurn(stop);
    expect(next.scopedWorktreeClosingTurns("p")).toMatchObject([{ status: "stopped" }]);
    expect(f.leases()).toEqual([]); expect(f.snapshot()).toEqual(original);
  });

  it.each(["pause", "cancel"])("revokes tools on %s while still accounting for physical stop", async intent => {
    const f = await closingFixture(); f.db.beginScopedWorktreeClosingTurn(f.closingInput);
    f.db.markScopedWorktreeClosingOpened({ ...f.closingInput, nativeProcessOpened: true }); const original = f.snapshot();
    if (intent === "pause") f.edit("UPDATE project_heads SET frozen = 1 WHERE project_id = 'p'");
    else f.db.appendEvent({ projectId: "p", requestId: "cancel", type: "project.cancellation.requested", payload: { source: "user" } });
    expect(() => f.db.assertScopedWorktreeClosingControl(f.closingInput)).toThrow();
    expect(() => f.db.markScopedWorktreeClosingOpened({ ...f.closingInput, nativeProcessOpened: true })).toThrow();
    if (intent === "cancel") expect(() => f.db.settleScopedProjectCancellation("p")).toThrow("stop proof");
    expect(() => f.db.stopScopedWorktreeClosingTurn({ ...f.closingInput, residentStopConfirmed: true, evidence: {} })).toThrow();
    f.db.stopScopedWorktreeClosingTurn({ ...f.closingInput, residentStopConfirmed: true, evidence: { nativeGone: true } });
    expect(f.snapshot()).toEqual(original); expect(f.leases()).toEqual([]);
  });

  it("blocks same-Agent FIFO after native stop until the original closing issue and delivery settle", async () => {
    const f = await closingFixture();
    f.copy("scoped_arrivals", { request_id: "next-arrival", source_run_id: "after-original", node_run_id: null, status: "queued" }, "arrival_seq");
    const claim = { projectId: "p", arrivalRequestId: "next-arrival", agentId: "worker", executionId: "next", worktreePath: f.execution.worktreePath };
    expect(f.db.claimScopedAgentArrival(claim)).toBeUndefined();
    f.db.beginScopedWorktreeClosingTurn(f.closingInput);
    expect(f.db.claimScopedLeaderTurn({ ...f.m.scope, invocationId: "inv_parallel_manager", runtimePath: path.join(f.root, "runtime", "inv_parallel_manager"), allowStoppedRepairFaults: true })).toBeUndefined();
    f.db.stopScopedWorktreeClosingTurn({ ...f.closingInput, residentStopConfirmed: true, evidence: { nativeGone: true } });
    expect(f.leases()).toEqual([]); expect(f.db.claimScopedAgentArrival(claim)).toBeUndefined();
    expect(f.db.scopedArrivals("run-G").find(arrival => arrival.requestId === "next-arrival")?.status).toBe("queued");
    expect(f.db.scopedExecution("p", "original")?.status).toBe("completed");
  });

  it("preserves a concurrent unopened task and refuses its Git/native admission during closing", async () => {
    const f = await closingFixture();
    f.copy("scoped_arrivals", { request_id: "next-arrival", source_run_id: "after-original", node_run_id: null, status: "running" }, "arrival_seq");
    f.copy("scoped_executions", { execution_id: "next", arrival_request_id: "next-arrival", execution_branch: "executions/next", status: "running", completed_at: null });
    f.copy("scoped_agent_turns", { execution_id: "next", invocation_id: "inv_reserved_next", runtime_path: path.join(f.root, "runtime", "inv_reserved_next"), status: "reserved", opened_at: null, stopped_at: null });
    const original = f.snapshot();
    expect(f.db.beginScopedWorktreeClosingTurn(f.closingInput)).toBeUndefined();
    expect(() => f.db.markScopedAgentTurnOpened({ projectId: "p", executionId: "next", ownershipEpoch: 1, invocationId: "inv_reserved_next", nativeProcessOpened: true })).toThrow();
    expect(() => f.db.assertScopedGitExecutionOwnership({ projectId: "p", executionId: "next", ownershipEpoch: 1, expectedBranch: "executions/next", operation: "worktree.create" })).toThrow();
    expect(f.snapshot()).toEqual(original); expect(f.db.scopedWorktreeClosingTurns("p")).toEqual([]);
  });
});
