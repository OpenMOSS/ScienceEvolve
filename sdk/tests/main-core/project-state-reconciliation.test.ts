import { pathToFileURL as sdkFixtureFileURL } from "node:url";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CollaborationStateDatabase } from "../../src/core/collaboration-state/store.js";
import { cloneAgentOrchestrationTemplate } from "../../src/core/agent-orchestration.js";
import { normalizeAgentOrchestrationTemplate } from "../../src/core/validation.js";
import { prepareOperation, transitionOperation } from "../../src/core/collaboration-git/operation.js";
import { executeProjectStateRequest } from "../../src/core/project-state-service.js";
import { toolsFor } from "../../src/core/orchestration-control-mcp.js";
import { scopedGroupOutput } from "../../src/core/scoped-group-output.js";
import { ControlActionService, startControlActionBridge, readStagedControlActions } from "../../src/core/orchestration-control-bridge.js";
import type { GitHubPullRequestFact } from "../../src/core/collaboration-git/contracts.js";
import type { ProjectStateEntry, ProjectStatePrincipal, ProjectStatePullReconciliation } from "../../src/core/project-state.js";
import type { ControlAction, ControlActionEnvelope } from "../../src/core/types.js";

const roots: string[] = [], stores: CollaborationStateDatabase[] = [];
afterEach(async () => { stores.splice(0).forEach(s => s.close()); await Promise.all(roots.splice(0).map(p => rm(p, { recursive: true, force: true }))); });

async function fixture(interrupted = false, retainIntegratingReport = false) {
  const root = await mkdtemp(join(tmpdir(), "openfars-state-reconcile-")); roots.push(root);
  const options = { databasePath: join(root, "state.sqlite"), serviceId: "test", hostId: "test", topology: "single-host" as const,
    instanceId: "one", now: () => 1_000_000 };
  const db = CollaborationStateDatabase.open(options); stores.push(db);
  const draft = cloneAgentOrchestrationTemplate(); draft.schemaVersion = 3;
  draft.collaborations = [{ id: "G", displayName: "G", memberAgentIds: [], renamePolicy: "editable" }];
  draft.routes.G = [{ kind: "strong", target: "main" }];
  draft.scopedWorkflow = { schemaVersion: 1, rootAgentIds: draft.agents.map(a => a.name), groups: [{ id: "G", leaderAgentId: "review",
    allowLeaderReconfiguration: false, workflow: { nodes: [{ kind: "agent", nodeId: "G_idea", agentId: "idea" }],
      input: { source: "input", edges: [{ kind: "parallel", target: "G_idea" }] }, routes: { G_idea: [{ kind: "strong", target: "finish" }] } } }] };
  db.createProject({ projectId: "p", workflowRevision: 1, workflowSnapshot: normalizeAgentOrchestrationTemplate(draft), workerCapacity: 2,
    git: { enabled: true, status: "ready", repository: { owner: "example", name: "openfars", private: true, defaultBranch: "main",
      htmlUrl: "https://github.com/example/openfars", localPath: join(root, "repository") } } });
  const group = db.activateScopedGroup({ projectId: "p", groupRunId: "run-G", groupId: "G", activationRequestId: "activate-G",
    workflowRevision: 1, baseCommit: "a".repeat(40), outer: { nodeRunId: "node-G", inputSnapshotRef: "input:p", activatedByAgentId: "main" } });
  const arrival = group.arrivals[0];
  const execution = db.claimScopedAgentArrival({ projectId: "p", arrivalRequestId: arrival.requestId, agentId: "idea", executionId: "original-owner",
    worktreePath: join(root, "git-worktrees", "agents", "idea") }).execution;
  const worker = { projectId: "p", executionId: execution.id, ownershipEpoch: 1, invocationId: "original-worker" };
  db.beginScopedAgentTurn({ ...worker, runtimePath: join(root, "runtime", worker.invocationId), baseCommit: "a".repeat(40) });
  db.markScopedAgentTurnOpened({ ...worker, nativeProcessOpened: true });
  const pull: GitHubPullRequestFact = { id: "provider-pull-1", providerNumber: 1, owner: "example", repository: "openfars",
    htmlUrl: "https://github.com/example/openfars/pull/1", head: execution.executionBranch, headSha: "b".repeat(40),
    base: db.scopedGroupRun("p", "run-G")!.groupBranch, ownerExecutionId: execution.id, status: "open", checks: [], observedAt: "2026-10-13T00:00:00Z" };
  const operations = db.operationsForProject("p", true);
  const prepared = await prepareOperation(operations, { id: "original-create", kind: "pull.create", ownerExecutionId: execution.id,
    ownershipEpoch: 1, expectedHead: pull.headSha, expectedBase: pull.base }, { providerNumber: 1, head: pull.head });
  let source = prepared;
  if (interrupted) {
    db.stopScopedAgentTurn({ ...worker, residentStopConfirmed: true });
    db.recordScopedAgentInterruptedOperation(worker);
  } else {
    const observed = await transitionOperation(operations, prepared, { status: "observed", remoteFact: { ...pull } });
    source = await transitionOperation(operations, observed, { status: "finalized", remoteFact: { ...pull } });
    db.recordScopedAgentReport({ ...worker, output: "Original immutable report: provider state needs verification", reportHeadSha: pull.headSha,
      residentTurnCompleted: true, residentStopConfirmed: true });
    if (retainIntegratingReport) {
      for (let attempt = 1; attempt <= 2; attempt++) db.appendEvent({ projectId: "p", agentId: "idea", invocationId: worker.invocationId,
        requestId: `fixture-pre-report-repair-${attempt}`, type: "scoped.agent.mechanism_repair.requested",
        payload: { executionId: execution.id, ownershipEpoch: 1, attempt, missing: ["finish_task", "github_merge_pr"] } });
      db.recordScopedAgentRepairExhaustion(worker);
    } else db.failScopedAgentArrival({ ...worker, arrivalRequestId: arrival.requestId, reason: "Exact provider association needs verification", residentStopConfirmed: true });
  }
  const openManager = (agentId: string, invocationId: string, globalMain = false) => {
    const claim = db.claimScopedLeaderTurn({ projectId: "p", groupRunId: "run-G", agentId, invocationId, globalMain, allowStoppedRepairFaults: true,
      runtimePath: join(root, "runtime", invocationId) })!;
    const identity = { projectId: "p", groupRunId: "run-G", agentId, invocationId, globalMain, coordinatorEpoch: claim.coordinatorEpoch };
    db.markScopedLeaderOpened(identity);
    const envelope = (action: ControlAction, callId: string): ControlActionEnvelope => ({ projectId: "p", agent: agentId, invocationId,
      callId, stateVersion: claim.coordinatorEpoch, capabilityHash: "c".repeat(64), receivedAt: "2026-10-13T00:00:00Z", action });
    return { identity, envelope, principal: { kind: "agent" as const, projectId: "p", agentId, invocationId } };
  };
  const leader = openManager("review", "root-leader");
  const object = { kind: "execution" as const, id: execution.id };
  const get = (principal: ProjectStatePrincipal, database = db) => database.projectStateRequest(principal, { operation: "get", object }) as ProjectStateEntry;
  const request = (principal: ProjectStatePrincipal): ProjectStatePullReconciliation => ({ operation: "reconcile_pull", object,
    expectedVersion: get(principal).version, sourceOperationId: source.id, reason: "Verify the exact original provider PR", callId: "main-query" });
  const main = () => {
    db.recordScopedLeaderTaskCompletion({ ...leader.identity, envelope: leader.envelope({ tool: "finish_task", summary: "Explicit manager decision" }, "finish") });
    db.acceptScopedLeaderAction({ ...leader.identity, residentStopConfirmed: true, envelope: leader.envelope({ tool: "coordinate_group_task",
      groupRunId: "run-G", coordinatorEpoch: leader.identity.coordinatorEpoch, arrivalRequestId: arrival.requestId, operation: "escalate",
      rationale: "Request exact Main verification" }, "escalate") });
    db.releaseScopedLeaderTurn({ ...leader.identity, residentStopConfirmed: true });
    return openManager("main", "original-main", true);
  };
  const merged: GitHubPullRequestFact = { ...pull, status: "merged", mergeCommitSha: "d".repeat(40), observedAt: "2026-10-13T00:01:00Z" };
  return { db, root, options, source, worker, leader, main, openManager, request, get, pull, merged, object, execution, arrival, group };
}

describe("Main-authorized failed Worker skips", () => {
  it.each(["open", "merged"] as const)("skips a stopped mechanism owner with an observed %s PR and excludes its report", async status => {
    const f = await fixture(false, true), main = f.main();
    const before = f.db.projectState("p"), originalReport = f.db.scopedAgentReport("p", f.execution.id, 1);
    const skip = main.envelope({ tool: "coordinate_group_task", groupRunId: "run-G",
      coordinatorEpoch: main.identity.coordinatorEpoch, arrivalRequestId: f.arrival.requestId, operation: "skip",
      rationale: "User authorized continuing with verified evidence and excluding this failed Worker" }, "approved-skip");
    f.db.recordScopedLeaderTaskCompletion({ ...main.identity, envelope: main.envelope({ tool: "finish_task" }, "finish-main") });
    f.db.acceptScopedLeaderAction({ ...main.identity, residentStopConfirmed: true, envelope: skip });
    expect(() => f.db.applyScopedMainSkip("p", f.execution.id, 1, f.pull)).toThrow("confirmed manager stop");
    f.db.releaseScopedLeaderTurn({ ...main.identity, residentStopConfirmed: true });
    f.db.applyScopedMainSkip("p", f.execution.id, 1, status === "merged" ? f.merged : f.pull);
    const after = f.db.projectState("p");
    expect(after.scopedArrivals?.find(a => a.requestId === f.arrival.requestId)?.status).toBe("skipped");
    expect(f.db.scopedExecution("p", f.execution.id)?.status).toBe("stopped");
    expect(after.operations).toEqual(before.operations);
    expect(f.db.scopedAgentReport("p", f.execution.id, 1)).toEqual(originalReport);
    expect(f.db.scopedGroupIssues("p")).toEqual([]);
    expect(scopedGroupOutput(after, "run-G")).toContain("Explicitly skipped (not successful work)");
    expect(scopedGroupOutput(after, "run-G")).not.toContain("Original immutable report");
    expect(f.db.eventByRequestId("p", `scoped-skip:${f.arrival.requestId}`)?.payload)
      .toMatchObject({ businessSuccess: false, evidenceDisposition: "excluded", gitFactsPreserved: true });
    f.db.applyScopedMainSkip("p", f.execution.id, 1);
  });

  it("returns the exact unresolved Git operation instead of treating a Worker mechanism as a final-group incident", async () => {
    const f = await fixture(true), main = f.main();
    f.db.recordScopedLeaderTaskCompletion({ ...main.identity, envelope: main.envelope({ tool: "finish_task" }, "finish-main") });
    const before = f.db.projectState("p");
    expect(() => f.db.acceptScopedLeaderAction({ ...main.identity, residentStopConfirmed: true,
      envelope: main.envelope({ tool: "coordinate_group_task", groupRunId: "run-G", coordinatorEpoch: main.identity.coordinatorEpoch,
        arrivalRequestId: f.arrival.requestId, operation: "skip", rationale: "Exclude failed work" }, "skip") }))
      .toThrow("git_get_operation operationId=original-create");
    expect(f.db.projectState("p").operations).toEqual(before.operations);
    expect(f.db.scopedExecution("p", f.execution.id)?.status).toBe("running");
  });

  it("rejects a foreign PR observation atomically even with accepted Main approval", async () => {
    const f = await fixture(false, true), main = f.main();
    f.db.recordScopedLeaderTaskCompletion({ ...main.identity, envelope: main.envelope({ tool: "finish_task" }, "finish-main") });
    f.db.acceptScopedLeaderAction({ ...main.identity, residentStopConfirmed: true,
      envelope: main.envelope({ tool: "coordinate_group_task", groupRunId: "run-G", coordinatorEpoch: main.identity.coordinatorEpoch,
        arrivalRequestId: f.arrival.requestId, operation: "skip", rationale: "Exclude failed work" }, "skip") });
    f.db.releaseScopedLeaderTurn({ ...main.identity, residentStopConfirmed: true });
    const before = f.db.projectState("p");
    expect(() => f.db.applyScopedMainSkip("p", f.execution.id, 1, { ...f.pull, ownerExecutionId: "another-worker" })).toThrow("Skip PR observation differs");
    expect(f.db.projectState("p").stateRevision).toBe(before.stateRevision);
    expect(f.db.scopedGroupIssues("p")).toHaveLength(1);
  });
});

describe("Main's explicit, sourced PR record reconciliation", () => {
  it.each(["open", "merged"] as const)("reconciles the stopped integrating report owner without completing its delivery (%s)", async status => {
    const f = await fixture(false, true), main = f.main(), input = f.request(main.principal);
    const original = f.db.projectState("p"), report = f.db.scopedAgentReport("p", f.execution.id, 1);
    expect(original.scopedExecutions![0]!.status).toBe("integrating");
    expect(f.db.scopedAgentTurn("p", f.execution.id, 1)).toMatchObject({ status: "stopped" });
    const fact = status === "open" ? f.pull : f.merged, query = vi.fn(async () => fact);
    expect(() => f.db.recordScopedRecoveryPull({ projectId: "p", executionId: f.execution.id, ownershipEpoch: 1, pull: fact }))
      .toThrow(/stopped failed owner/);
    const result = await executeProjectStateRequest(f.db, main.principal, input, { observePullRequest: query });
    expect(result).toMatchObject({ status: "observation_recorded", pull: fact });
    expect(query).toHaveBeenCalledTimes(1);
    expect(f.db.scopedRecoveryPull("p", f.execution.id, 1)).toEqual(fact);
    const after = f.db.projectState("p");
    expect(after.scopedExecutions).toEqual(original.scopedExecutions);
    expect(after.scopedArrivals).toEqual(original.scopedArrivals);
    expect(f.db.scopedAgentReport("p", f.execution.id, 1)).toEqual(report);
    expect(f.db.scopedAgentMechanismRepairCount("p", f.execution.id)).toBe(2);
    expect(f.db.scopedAgentTaskCompleted("p", f.execution.id, 1, f.worker.invocationId)).toBe(false);
    expect(f.db.recordedGitOperation("p", f.source.id)).toEqual(f.source);
    expect(f.db.scopedGroupReadyForFinalIntegration("p", "run-G")).toBe(false);
  });

  it.each(["completed-owner", "live-native", "missing-report"] as const)("refuses an unsafe integrating reconciliation before querying (%s)", async fault => {
    const f = await fixture(false, true), main = f.main();
    // Isolated unsafe persisted-state fixtures; no production transition is claimed.
    const raw = new DatabaseSync(f.options.databasePath);
    try {
      if (fault === "completed-owner") raw.prepare("UPDATE scoped_executions SET status='completed' WHERE execution_id=?").run(f.execution.id);
      if (fault === "live-native") raw.prepare("UPDATE scoped_agent_turns SET status='opened',stopped_at=NULL WHERE execution_id=?").run(f.execution.id);
      if (fault === "missing-report") raw.prepare("DELETE FROM scoped_agent_reports WHERE execution_id=?").run(f.execution.id);
    } finally { raw.close(); }
    const query = vi.fn(async () => f.merged);
    await expect(executeProjectStateRequest(f.db, main.principal, f.request(main.principal), { observePullRequest: query })).rejects.toThrow(/native Stop/);
    expect(query).not.toHaveBeenCalled();
    expect(f.db.scopedRecoveryPull("p", f.execution.id, 1)).toBeUndefined();
  });

  it.each([false, true])("reconciles a stop-confirmed legacy owner while retaining its exact PR identity and unfinished task (retained=%s)", async retained => {
    const f = await fixture(), projectId = "legacy";
    f.db.createProject({ projectId, workflowRevision: 1, workflowSnapshot: cloneAgentOrchestrationTemplate(), workerCapacity: 1,
      git: f.db.projectState("p").git });
    f.db.activateNode({ projectId, nodeRunId: "legacy-node", node: { kind: "agent", nodeId: "idea", agentId: "idea" },
      activationRequestId: "legacy-activation", inputSnapshotRef: "legacy-input", activatedByAgentId: "main", workflowRevision: 1 });
    const execution = f.db.startStandaloneExecution({ projectId, nodeRunId: "legacy-node", taskId: "legacy-task", executionId: "legacy-owner",
      agentId: "idea", assignment: "Retain the unfinished original PR delivery", executionBranch: "executions/legacy-owner",
      worktreePath: join(f.root, "legacy-worktree"), invocationId: "legacy-worker" }).execution;
    const pull = { ...f.pull, id: "legacy-provider-id", ownerExecutionId: execution.id, head: execution.executionBranch, base: "main" };
    const operations = f.db.operationsForProject(projectId);
    const prepared = await prepareOperation(operations, { id: "legacy-original-pr", kind: "pull.create", ownerExecutionId: execution.id,
      ownershipEpoch: 1, expectedHead: pull.headSha, expectedBase: pull.base }, { head: pull.head });
    const observed = await transitionOperation(operations, prepared, { status: "observed", remoteFact: pull });
    const source = await transitionOperation(operations, observed, { status: "finalized", remoteFact: pull });
    if (retained) f.db.observePullRequest({ projectId, executionId: execution.id, ownershipEpoch: 1,
      pullRequest: { ...pull, id: "historical-retained-pr-id" } });
    f.db.requestExecutionStop({ projectId, executionId: execution.id, ownershipEpoch: 1, reason: "Verify original PR association" });
    f.db.confirmExecutionStopped({ projectId, executionId: execution.id, ownershipEpoch: 1, stopped: true, evidence: { nativeStop: "controlled" } });
    const mainScope = { projectId, nodeRunId: "legacy-node", agentId: "main", invocationId: "legacy-main", coordinatorEpoch: 1 };
    f.db.appendEvent({ ...mainScope, type: "main.route.attempt", payload: { attempt: 1 } });
    f.db.startRuntimeActivity({ ...mainScope, kind: "turn", phase: "model:running" });
    const principal: ProjectStatePrincipal = { kind: "agent", projectId, agentId: "main", invocationId: "legacy-main" };
    const object = { kind: "execution", id: execution.id }, entry = f.db.projectStateRequest(principal, { operation: "get", object }) as ProjectStateEntry;
    const before = f.db.projectState(projectId), merged = { ...pull, status: "merged" as const, mergeCommitSha: "c".repeat(40) };
    await executeProjectStateRequest(f.db, principal, { operation: "reconcile_pull", object, expectedVersion: entry.version,
      sourceOperationId: source.id, reason: "Verify exact stopped legacy delivery", callId: "legacy-query" }, { observePullRequest: async () => merged });
    const after = f.db.projectState(projectId), expectedId = retained ? "historical-retained-pr-id" : pull.id;
    expect(after.pullRequests).toEqual([expect.objectContaining({ id: expectedId, status: "merged", ownerExecutionId: execution.id })]);
    expect(after.executions[0]).toMatchObject({ status: "stopped", ownershipEpoch: 1, pullRequestId: expectedId });
    expect(after.tasks).toEqual(before.tasks); expect(after.routeOutbox).toEqual(before.routeOutbox);
    expect(f.db.recordedGitOperation(projectId, source.id)).toEqual(source);
  });

  it("executes the sourced correction through the actual authenticated stdio MCP bridge", async () => {
    const f = await fixture(), main = f.main(), input = f.request(main.principal);
    const query = vi.fn(async () => f.merged);
    const service = new ControlActionService({ projectId: "p", agent: "main", invocationId: main.identity.invocationId,
      stateVersion: main.identity.coordinatorEpoch, capability: "test-state-secret", stagingPath: join(f.root, "actions.json"),
      revalidate: async () => {}, projectState: request => executeProjectStateRequest(f.db, main.principal, request, { observePullRequest: query }) });
    const bridge = await startControlActionBridge(service, f.root);
    try {
      const context = { projectId: "p", agent: "main", invocationId: main.identity.invocationId, kind: "main", stateVersion: main.identity.coordinatorEpoch,
        projectState: true, candidates: [], decisionBy: "main", canComplete: false, allowUserIntervention: false,
        stagingPath: join(f.root, "actions.json"), workspacePath: f.root, bridgePath: bridge.endpoint.path,
        bridgeHost: bridge.endpoint.host, bridgePort: bridge.endpoint.port, requireBridge: true };
      const child = spawn(process.execPath, ["--import", sdkFixtureFileURL(createRequire(import.meta.url).resolve("tsx")).href,
        fileURLToPath(new URL("../../src/core/orchestration-control-mcp.ts", import.meta.url))], { cwd: f.root,
        env: { ...process.env, SCIENCEEVOLVE_CONTROL_CONTEXT: JSON.stringify(context), SCIENCEEVOLVE_CONTROL_CAPABILITY: "test-state-secret" }, stdio: ["pipe", "pipe", "pipe"] });
      let stdout = "", stderr = "";
      child.stdout.setEncoding("utf8"); child.stderr.setEncoding("utf8");
      child.stdout.on("data", data => { stdout += data; }); child.stderr.on("data", data => { stderr += data; });
      const finished = new Promise<void>((resolve, reject) => {
        child.once("error", reject); child.once("close", code => code === 0 ? resolve() : reject(new Error(stderr)));
      });
      const { operation: _, ...args } = input;
      child.stdin.end([{ id: 1, method: "tools/call", params: { name: "state_reconcile_pull", arguments: args } },
        { id: 2, method: "tools/call", params: { name: "state_get", arguments: { object: f.object } } }].map(r => JSON.stringify(r)).join("\n") + "\n");
      await finished;
      const responses = stdout.trim().split("\n").map(line => JSON.parse(line));
      expect(responses[0].result.structuredContent).toMatchObject({ status: "observation_recorded", pull: f.merged });
      expect(responses[1].result.structuredContent.core).toMatchObject({ status: "failed", stateReconciliations: [expect.any(Object)] });
      expect(query).toHaveBeenCalledTimes(1);
      expect(await readStagedControlActions(join(f.root, "actions.json"))).toEqual([]);
    } finally { await bridge.close(); }
  });

  it("queries only the selected original PR, appends its observation and preserves report, Stop, finish and FIFO gates", async () => {
    const f = await fixture(), main = f.main(), input = f.request(main.principal);
    const before = f.db.projectState("p"), report = f.db.scopedAgentReport("p", f.execution.id, 1), lanes = f.db.laneAvailability("p");
    const query = vi.fn(async () => f.merged);
    const result = await executeProjectStateRequest(f.db, main.principal, input, { observePullRequest: query });
    expect(query).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ projectId: "p", executionId: f.execution.id,
      ownershipEpoch: 1, providerNumber: 1, providerId: f.pull.id, expectedHead: f.pull.headSha, expectedBase: f.pull.base,
      repository: { owner: "example", name: "openfars" } }));
    expect(result).toMatchObject({ status: "observation_recorded", pull: f.merged });
    const after = f.db.projectState("p");
    expect(f.db.recordedGitOperation("p", f.source.id)).toEqual(f.source);
    expect(f.db.scopedAgentReport("p", f.execution.id, 1)).toEqual(report);
    expect(after.scopedExecutions).toEqual(before.scopedExecutions);
    expect(after.scopedArrivals).toEqual(before.scopedArrivals);
    expect(after.scopedAgentTaskCompletions).toEqual(before.scopedAgentTaskCompletions);
    expect(after.scopedAgentMerges).toEqual(before.scopedAgentMerges);
    expect(f.db.laneAvailability("p")).toEqual(lanes);
    expect(f.db.scopedRecoveryPull("p", f.execution.id, 1)).toEqual(f.merged);
    expect(f.get(main.principal).version).not.toBe(input.expectedVersion);
    expect(f.get(main.principal).core).toMatchObject({ status: "failed", stateReconciliations: [expect.objectContaining({ reason: input.reason })] });
    const replay = await executeProjectStateRequest(f.db, main.principal, input, { observePullRequest: query });
    expect(replay).toEqual(result); expect(query).toHaveBeenCalledTimes(1);
    expect(f.db.eventsAfter("p", 0, 1000).filter(e => e.type === "project.state.pull.reconciled")).toHaveLength(1);
    expect(f.db.scopedGroupReadyForFinalIntegration("p", "run-G")).toBe(false);
    f.db.close();
    const reopened = CollaborationStateDatabase.open(f.options); stores.push(reopened);
    expect(f.get(main.principal, reopened).core).toEqual(f.get({ kind: "system", projectId: "p", source: "restart-check" }, reopened).core);
    expect(await executeProjectStateRequest(reopened, main.principal, input, { observePullRequest: query })).toEqual(result);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it("rejects a local Leader, expired Worker, forged project and non-observed source before querying", async () => {
    const f = await fixture(), query = vi.fn(async () => f.merged);
    await expect(executeProjectStateRequest(f.db, f.leader.principal, f.request(f.leader.principal), { observePullRequest: query })).rejects.toThrow(/Only.*Main/);
    const main = f.main(), input = f.request(main.principal);
    for (const principal of [{ ...main.principal, invocationId: f.worker.invocationId, agentId: "idea" }, { ...main.principal, projectId: "other" }])
      await expect(executeProjectStateRequest(f.db, principal, input, { observePullRequest: query })).rejects.toThrow();
    await expect(executeProjectStateRequest(f.db, main.principal, { ...input, sourceOperationId: "absent-operation" }, { observePullRequest: query })).rejects.toThrow(/exact original/);
    expect(query).not.toHaveBeenCalled();
  });

  it.each(["source-status", "source-epoch", "report-head", "ambiguous-pr"])("rejects retained %s drift without guessing or rewriting the original evidence", async kind => {
    const f = await fixture(), main = f.main();
    // Isolated persisted-state drift fixtures; no external Git or Agent fact is claimed.
    const sql = new DatabaseSync(f.options.databasePath);
    try {
      if (kind === "source-status") sql.prepare("UPDATE scoped_operations SET status='prepared' WHERE operation_id=?").run(f.source.id);
      if (kind === "source-epoch") sql.prepare("UPDATE scoped_operations SET ownership_epoch=2 WHERE operation_id=?").run(f.source.id);
      if (kind === "report-head") sql.prepare("UPDATE scoped_agent_reports SET head_sha=? WHERE execution_id=?").run("e".repeat(40), f.execution.id);
      if (kind === "ambiguous-pr") {
        sql.exec("CREATE TEMP TABLE duplicate_operation AS SELECT * FROM scoped_operations");
        sql.prepare("UPDATE duplicate_operation SET operation_id='different-provider', remote_fact_json=?")
          .run(JSON.stringify({ ...f.pull, providerNumber: 2, id: "provider-pull-2", htmlUrl: "https://github.com/example/openfars/pull/2" }));
        sql.exec("INSERT INTO scoped_operations SELECT * FROM duplicate_operation");
      }
    } finally { sql.close(); }
    const query = vi.fn(async () => f.merged);
    await expect(executeProjectStateRequest(f.db, main.principal, f.request(main.principal), { observePullRequest: query })).rejects.toThrow();
    expect(query).not.toHaveBeenCalled();
    expect(f.db.scopedRecoveryPull("p", f.execution.id, 1)).toBeUndefined();
  });

  it.each(["head", "base", "provider", "owner", "unknown", "missing", "url", "merge-sha", "time"])("retains the actual %s observation without accepting a foreign or unconfirmed core association", async kind => {
    const f = await fixture(), main = f.main(), input = f.request(main.principal);
    const fact = { ...f.merged };
    if (kind === "head") fact.headSha = "e".repeat(40);
    if (kind === "base") fact.base = "main";
    if (kind === "provider") fact.providerNumber = 2;
    if (kind === "owner") fact.ownerExecutionId = "foreign-owner";
    if (kind === "unknown") fact.status = "unknown";
    if (kind === "url") fact.htmlUrl = "https://github.com/other/repo/pull/1";
    if (kind === "merge-sha") fact.mergeCommitSha = "invalid";
    if (kind === "time") fact.observedAt = "invalid";
    const query = vi.fn(async () => kind === "missing" ? undefined : fact);
    await expect(executeProjectStateRequest(f.db, main.principal, input, { observePullRequest: query })).rejects.toThrow(/Actual provider observation/);
    expect(f.db.scopedRecoveryPull("p", f.execution.id, 1)).toBeUndefined();
    expect(f.db.eventsAfter("p", 0, 1000).filter(e => e.type === "project.state.pull.queried")).toHaveLength(1);
    await expect(executeProjectStateRequest(f.db, main.principal, input, { observePullRequest: query })).rejects.toThrow();
    expect(query).toHaveBeenCalledTimes(1);
    expect(f.get(main.principal).version).toBe(input.expectedVersion);
  });

  it("returns the original provider error directly and never retries that same call", async () => {
    const f = await fixture(), main = f.main(), input = f.request(main.principal);
    const error = Object.assign(new Error("Exact provider query unavailable"), { code: "PROVIDER_UNAVAILABLE" });
    const query = vi.fn(async () => { throw error; });
    await expect(executeProjectStateRequest(f.db, main.principal, input, { observePullRequest: query })).rejects.toBe(error);
    await expect(executeProjectStateRequest(f.db, main.principal, input, { observePullRequest: query })).rejects.toMatchObject({ code: error.code, message: error.message });
    expect(query).toHaveBeenCalledTimes(1); expect(f.db.scopedRecoveryPull("p", f.execution.id, 1)).toBeUndefined();
    await expect(executeProjectStateRequest(f.db, main.principal, { ...input, reason: "Different action with reused call" }, { observePullRequest: query })).rejects.toMatchObject({ code: "IDEMPOTENCY_CONFLICT" });
  });

  it("joins concurrent transport replays of the same exact call and rejects changed reuse before a second provider query", async () => {
    const f = await fixture(), main = f.main(), input = f.request(main.principal);
    let release!: (pull: GitHubPullRequestFact) => void;
    const gate = new Promise<GitHubPullRequestFact>(resolve => { release = resolve; });
    const query = vi.fn(() => gate);
    const first = executeProjectStateRequest(f.db, main.principal, input, { observePullRequest: query });
    const second = executeProjectStateRequest(f.db, main.principal, input, { observePullRequest: query });
    await expect(executeProjectStateRequest(f.db, main.principal, { ...input, reason: "Changed in-flight action" }, { observePullRequest: query }))
      .rejects.toMatchObject({ code: "IDEMPOTENCY_CONFLICT" });
    expect(query).toHaveBeenCalledTimes(1); release(f.merged);
    const results = await Promise.all([first, second]); expect(results[0]).toEqual(results[1]);
    expect(f.db.eventsAfter("p", 0, 1000).filter(e => e.type === "project.state.pull.queried")).toHaveLength(1);
    expect(f.db.eventsAfter("p", 0, 1000).filter(e => e.type === "project.state.pull.reconciled")).toHaveLength(1);
  });

  it.each(["version", "role", "writer"].flatMap(kind => [false, true].map(integrating => [kind, integrating] as const)))("rechecks current %s after the provider await, preserving the late fact without committing a correction (integrating=%s)", async (kind, integrating) => {
    const f = await fixture(false, integrating), main = f.main(), input = f.request(main.principal);
    const query = vi.fn(async () => {
      if (kind === "version") f.db.projectStateRequest(main.principal, { operation: "patch", object: f.object, expectedVersion: input.expectedVersion,
        set: { investigation: "New evidence arrived during query" }, reason: "Concurrent Main update", callId: "concurrent" });
      if (kind === "role") f.db.releaseScopedLeaderTurn({ ...main.identity, residentStopConfirmed: true });
      if (kind === "writer") f.db.relinquishWriterLease();
      return f.merged;
    });
    await expect(executeProjectStateRequest(f.db, main.principal, input, { observePullRequest: query })).rejects.toThrow();
    if (kind !== "writer") expect(f.db.eventsAfter("p", 0, 1000).filter(e => e.type === "project.state.pull.queried")).toHaveLength(1);
    expect(f.db.scopedRecoveryPull("p", f.execution.id, 1)).toBeUndefined();
    expect(f.db.eventsAfter("p", 0, 1000).filter(e => e.type === "project.state.pull.reconciled")).toHaveLength(0);
  });

  it("lists the formal correction only for the current Main role", () => {
    const context = { projectId: "p", agent: "main", invocationId: "i", kind: "main", stateVersion: 1, secret: "s", projectState: true,
      candidates: [], decisionBy: "main", canComplete: false, allowUserIntervention: false, stagingPath: "/tmp/actions", workspacePath: "/tmp" };
    const has = (value: unknown) => toolsFor(value as never).some(t => t.name === "state_reconcile_pull");
    const scoped = { groupRunId: "run-G", coordinatorEpoch: 1, routeCandidates: [], failedArrivalRequestIds: [], memberNodeIds: [] };
    expect(has(context)).toBe(true);
    expect(has({ ...context, collaboration: { ...scoped, role: "scoped-leader" } })).toBe(false);
    expect(has({ ...context, collaboration: { ...scoped, role: "scoped-main" } })).toBe(true);
    expect(has({ ...context, kind: "worker" })).toBe(false);
  });
});

describe("direct Main key-state coordination through existing scoped management", () => {
  function input(f: Awaited<ReturnType<typeof fixture>>, callId = "pass-to-main") {
    return { operation: "request_main", object: f.object, expectedVersion: f.get(f.leader.principal).version,
      sourceIssueId: f.db.scopedGroupIssues("p")[0]?.id ?? "absent", reason: "Main should judge the retained unconfirmed PR operation", callId };
  }
  function finishManager(f: Awaited<ReturnType<typeof fixture>>) {
    f.db.recordScopedLeaderTaskCompletion({ ...f.leader.identity,
      envelope: f.leader.envelope({ tool: "finish_task", summary: "Original Leader's own coordination handoff" }, "finish") });
    // Controlled native lifecycle evidence; the production runtime writes
    // this event only after writeHandoff and confirmed resident close.
    f.db.appendEvent({ projectId: "p", invocationId: f.leader.identity.invocationId, agentId: f.leader.identity.agentId,
      requestId: `scoped-management-round-completed:${f.leader.identity.invocationId}`, type: "scoped.management.round.completed",
      payload: { groupRunId: "run-G", purpose: "recover", mainStateRequestIds: f.db.projectStateMainCoordinationRequests("p", f.leader.identity.invocationId).map(e => e.requestId) } });
    f.db.releaseScopedLeaderTurn({ ...f.leader.identity, residentStopConfirmed: true });
  }

  it("queues an exact Leader request, admits it only after its own finish/handoff/Stop, and gives Main the original facts", async () => {
    const f = await fixture(true), request = input(f), before = f.db.projectState("p");
    const result = f.db.projectStateRequest(f.leader.principal, request);
    expect(result).toMatchObject({ status: "queued", targetAgentId: "main", delivery: "pending_existing_management_admission" });
    expect(f.db.projectStateRequest(f.leader.principal, request)).toEqual(result);
    expect(f.db.scopedRecoveryCandidates("p", "run-G", true)).toEqual([]);
    expect(f.db.scopedRecoveryCandidates("p", "run-G")).toHaveLength(1);
    expect(f.db.recordedGitOperation("p", f.source.id)).toEqual(f.source);
    expect(f.db.projectState("p").scopedExecutions).toEqual(before.scopedExecutions);
    expect(f.db.projectState("p").scopedArrivals).toEqual(before.scopedArrivals);
    expect(f.db.scopedAgentMechanismRepairCount("p", f.execution.id)).toBe(0);
    expect(() => f.db.projectStateRequest(f.leader.principal, input(f, "another-wake"))).toThrow(/already has a Main request/);
    finishManager(f);
    const candidate = f.db.scopedRecoveryCandidates("p", "run-G", true)[0];
    expect(candidate).toMatchObject({ incidentId: request.sourceIssueId, executionId: f.execution.id,
      mainStateRequest: { reason: request.reason, requestedBy: "review", invocationId: f.leader.identity.invocationId } });
    expect(f.db.scopedRecoveryCandidates("p", "run-G")).toEqual([]);
    const main = f.openManager("main", "real-global-main", true);
    expect(f.get(main.principal).access.role).toBe("main");
    expect(f.db.recordedGitOperation("p", f.source.id)).toEqual(f.source);
    expect(f.db.scopedAgentReport("p", f.execution.id, 1)).toBeUndefined();
    expect(f.db.scopedGroupReadyForFinalIntegration("p", "run-G")).toBe(false);
  });

  it("does not admit a request from a released manager without its own complete handoff", async () => {
    const f = await fixture(true); f.db.projectStateRequest(f.leader.principal, input(f));
    f.db.releaseScopedLeaderTurn({ ...f.leader.identity, residentStopConfirmed: true });
    expect(f.db.scopedRecoveryCandidates("p", "run-G", true)).toEqual([]);
    expect(f.db.scopedRecoveryCandidates("p", "run-G")).toHaveLength(1);
    expect(() => f.db.projectStateRequest(f.leader.principal, input(f))).toThrow(/live invocation/);
  });

  it("rejects ordinary business failures, wrong issue bindings, stale versions and old Worker connections", async () => {
    const ordinary = await fixture();
    expect(() => ordinary.db.projectStateRequest(ordinary.leader.principal, input(ordinary))).toThrow(/recorded key-state/);
    const f = await fixture(true), original = input(f);
    expect(() => f.db.projectStateRequest(f.leader.principal, { ...original, sourceIssueId: "another-project-issue" })).toThrow(/recorded key-state/);
    expect(() => f.db.projectStateRequest({ kind: "agent", projectId: "p", agentId: "idea", invocationId: f.worker.invocationId }, original)).toThrow(/live invocation/);
    f.db.projectStateRequest(f.leader.principal, { operation: "patch", object: f.object, expectedVersion: original.expectedVersion,
      set: { assessment: "Updated facts" }, reason: "Concurrent investigation", callId: "concurrent" });
    expect(() => f.db.projectStateRequest(f.leader.principal, original)).toThrow(/changed before Main coordination/);
    expect(f.db.projectStateMainCoordinationRequests("p", f.leader.identity.invocationId)).toEqual([]);
  });

  it("preserves the existing finite Main failure budget and rejects a fresh wake for the same issue", async () => {
    const f = await fixture(true), request = input(f); f.db.projectStateRequest(f.leader.principal, request); finishManager(f);
    for (let i = 1; i <= 2; i++) {
      const main = f.openManager("main", `failed-main-${i}`, true);
      f.db.releaseScopedLeaderTurn({ ...main.identity, residentStopConfirmed: true });
      f.db.recordScopedManagementFailure({ ...main.identity, purpose: "recover", reason: `Controlled native Main failure ${i}` });
    }
    const candidate = f.db.scopedRecoveryCandidates("p", "run-G", true)[0];
    expect(f.db.scopedManagementRecoveryBlocked("p", "run-G", candidate, true)).toBe(true);
    const failures = f.db.scopedManagementFailures("p", true);
    const system: ProjectStatePrincipal = { kind: "system", projectId: "p", source: "fixed-key-state-entry" };
    expect(() => f.db.projectStateRequest(system, { ...request, expectedVersion: f.get(system).version, callId: "new-wake" })).toThrow(/already has a Main request/);
    expect(f.db.scopedManagementFailures("p", true)).toEqual(failures);
    expect(f.db.scopedManagementRecoveryBlocked("p", "run-G", candidate, true)).toBe(true);
  });
});
