import { DatabaseSync } from "node:sqlite";
import { controlResultReceipts, controlResultMarker } from "../../../src/core/control-result-receipts.js";
import type { ControlAction } from "../../../src/core/types.js";
import { P, openedClosingFixture } from "./scoped-worktree-closing-fixture.js";

export async function deliveredClosingFixture(originalStatus: "completed" | "failed" = "failed", receive = true, options: { nextArrival?: boolean; retainedMergedRoute?: boolean } = {}) {
  const f = await openedClosingFixture({ originalStatus, businessDelivery: true, ...options });
  const receipts = controlResultReceipts(f.db, { projectId: P, agentId: "worker", invocationId: f.closing.invocationId,
    session: f.session, executionContext: f.executionContext });
  for (const [callId, action] of [ ["push", { tool: "git_push", reason: "Deliver my own necessary Memory" }],
    ["create", { tool: "github_create_pr", title: "Independent necessary Memory B", body: "Original report A remains immutable", base: "groups/run-G" }],
    ["merge", { tool: "github_merge_pr", providerNumber: 11 }] ] as Array<[string, ControlAction]>) {
    const result = await f.run(action, callId);
    const id = receipts.record({ envelope: f.envelope(action, callId), requestedCallId: callId, result });
    if (receive) {
      const native = { invocationId: f.closing.invocationId, harnessId: f.session.harnessId, eventId: `actual-${callId}`,
        tool: { callId: `native-${callId}`, name: action.tool, server: "openfars-resident-control", toolType: "mcp", input: { callId } } };
      receipts.observeNative({ ...native, kind: "tool.started" });
      receipts.observeNative({ ...native, eventId: `actual-${callId}-completed`, kind: "tool.completed",
        tool: { ...native.tool, outputPreview: controlResultMarker(id) } });
    }
  }
  f.db.completeScopedWorktreeClosing({ ...f.closing, controlCapabilityHash: f.authority.control.capabilityHash!, envelope: f.envelope({ tool: "finish_task", summary: "Own Memory delivered through its independent PR" }, "finish") });
  f.db.recordScopedWorktreeClosingResult({ ...f.closing, inputId: f.turn.inputId,
    output: "I delivered my necessary Memory in PR 11, observed the merge and synchronized group target. Original A is retained.", residentTurnCompleted: true });
  f.db.stopScopedWorktreeClosingTurn({ ...f.closing, residentStopConfirmed: true, evidence: { exactNativeClosed: true } });
  const observation = await f.ordinaryGit.observeRestrictedWorktreeClosing({ ...f.execution, purpose: "delivery" }, 1,
    { kind: f.closing.kind, reportHeadSha: f.A, paths: f.files });
  const inspect = () => f.db.scopedWorktreeClosingDelivery(P, f.closing.invocationId, observation);
  const edit = (sql: string, ...args: (string | number)[]) => {
    // Fault injection into this isolated /tmp fixture only. Production event
    // history stays append-only; no application path can perform these edits.
    const raw = new DatabaseSync(f.databasePath); try {
      raw.exec("DROP TRIGGER IF EXISTS project_events_no_update; DROP TRIGGER IF EXISTS project_events_no_delete");
      raw.prepare(sql).run(...args);
    } finally { raw.close(); }
  };
  return { ...f, observation, inspect, edit };
}
