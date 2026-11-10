import { promises as fs } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import os from "node:os";
import path from "node:path";
import { vi } from "vitest";
import { CollaborationStateDatabase } from "../../../src/core/collaboration-state/store.js";
import { CollaborationGitFacade, LocalCollaborationGitService, type CollaborationGitOperationStore } from "../../../src/core/collaboration-git/index.js";
import type { RestrictedWorktreeClosingAuthority } from "../../../src/core/collaboration-git/contracts.js";
import { mergedPullSynchronizationOperationId } from "../../../src/core/collaboration-git/operation.js";
import { scopedWorktreeClosingControlAuthorityFactory } from "../../../src/core/scoped-worktree-closing-control.js";
import { ProjectStorage } from "../../../src/core/storage.js";
import { cloneAgentOrchestrationTemplate } from "../../../src/core/agent-orchestration.js";
import { defaultAgentConfigs } from "../../../src/core/validation.js";
import { emptyProjectComputeUsage } from "../../../src/core/inspire-compute-usage.js";
import { EventHub } from "../../../src/core/event-hub.js";
import type { AgentOrchestrationTemplate, AgentRunRequest, ControlAction, ControlActionEnvelope, ProjectState } from "../../../src/core/types.js";

export const P = "prj_0123456789abcdef0123456789abcdef";
const roots: string[] = [], stores: CollaborationStateDatabase[] = [];
export async function cleanupClosingFixtures() {
  stores.splice(0).forEach(db => db.close());
  await Promise.all(roots.splice(0).map(root => fs.rm(root, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 })));
}

export async function authorizedClosingFixture(options: {
  identify?: boolean;
  originalStatus?: "completed" | "failed";
  businessDelivery?: boolean;
  nextArrival?: boolean;
  retainedMergedRoute?: boolean;
  completedAncestors?: number;
  openDatabase?: (input: { storage: ProjectStorage; databasePath: string; now: () => number }) => Promise<CollaborationStateDatabase>;
} = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-closing-control-")); roots.push(root);
  const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
  const projectPath = storage.projectDir(P); await fs.mkdir(projectPath, { recursive: true });
  const bootstrap: CollaborationGitOperationStore = { prepare: async () => { throw Error("No original owner yet"); },
    transition: async () => { throw Error("No original owner yet"); }, assertExecutionOwnership: async () => { throw Error("No original owner yet"); },
    checkpointInitialization: async () => {}, recordMergedSynchronization: async () => {} };
  const initial = new LocalCollaborationGitService({ projectId: P, projectRoot: projectPath, worktreeMode: "agent", operationStore: bootstrap, allowLocalRemotes: true });
  await initial.initializeMain({ title: "Original retained business", operationId: "init" });
  const worktree = await initial.prepareAgentManagementWorkspace("worker");
  const rawGit = (args: string[], cwd = worktree) => execFileSync("git", ["-c", "core.hooksPath=/dev/null", ...args], {
    cwd, encoding: "utf8", stdio: "pipe", env: { ...process.env, GIT_AUTHOR_NAME: "Original Agent", GIT_AUTHOR_EMAIL: "worker@example.test",
      GIT_COMMITTER_NAME: "Original Agent", GIT_COMMITTER_EMAIL: "worker@example.test" } }).trim();
  rawGit(["switch", "-c", "executions/original"]);
  const memory = path.join(worktree, "agent-memory/worker/Memory.md"); await fs.mkdir(path.dirname(memory), { recursive: true });
  await fs.writeFile(memory, "Immutable original Memory at A\n"); rawGit(["add", "--all"]); rawGit(["commit", "-m", "Original business A"]);
  const A = rawGit(["rev-parse", "HEAD"]); await fs.appendFile(memory, "Original Agent's necessary Memory after A\n");
  const remote = path.join(root, "remote.git"); rawGit(["init", "--bare", remote]); await initial.configureOrigin(remote);
  let now = Date.parse("2026-10-10T11:00:00Z"), current = true;
  const time = () => new Date(now).toISOString(), databasePath = path.join(root, "state.sqlite");
  const db = options.openDatabase ? await options.openDatabase({ storage, databasePath, now: () => now }) : CollaborationStateDatabase.open({ databasePath, serviceId: "test", instanceId: "writer", hostId: "test", topology: "single-host",
    now: () => now, leaseDurationMs: 600_000 }); if (!options.openDatabase) stores.push(db);
  const repository = { owner: "example", name: "project", private: true, defaultBranch: "main", htmlUrl: "https://github.com/example/project", observedAt: time() };
  const base = cloneAgentOrchestrationTemplate();
  const workflow: AgentOrchestrationTemplate = { ...base, schemaVersion: 3 as const,
    agents: [base.agents.find(agent => agent.name === "main")!, { ...base.agents.find(agent => agent.name === "execution")!, name: "worker" }],
    collaborations: [{ id: "G", displayName: "G", memberAgentIds: [], renamePolicy: "editable" as const }],
    routes: { main: [{ kind: "strong" as const, target: "G" }], G: [{ kind: "strong" as const, target: "finish" }] },
    scopedWorkflow: { schemaVersion: 1 as const, rootAgentIds: ["main"], groups: [{ id: "G", leaderAgentId: "main", allowLeaderReconfiguration: false,
      workflow: { nodes: [{ kind: "agent" as const, nodeId: "G_worker", agentId: "worker" },
        ...(options.nextArrival ? [{ kind: "agent" as const, nodeId: "G_worker_next", agentId: "worker" }] : [])],
        input: { source: "input" as const, edges: [{ kind: "parallel" as const, target: "G_worker" }] },
        routes: { G_worker: [{ kind: "strong" as const, target: options.nextArrival ? "G_worker_next" : "finish" }],
          ...(options.nextArrival ? { G_worker_next: [{ kind: "strong" as const, target: "finish" }] } : {}) } } }] } };
  const ancestors = Array.from({ length: options.completedAncestors ?? 0 }, (_, index) => `G_parent_${index}`);
  if (ancestors.length) {
    workflow.scopedWorkflow!.groups[0]!.parentGroupId = ancestors[0];
    workflow.routes = { main: [{ kind: "strong", target: ancestors.at(-1)! }], [ancestors.at(-1)!]: [{ kind: "strong", target: "finish" }] };
    ancestors.forEach((id, index) => {
      workflow.collaborations.push({ id, displayName: id, memberAgentIds: [], renamePolicy: "editable" });
      workflow.scopedWorkflow!.groups.push({ id, parentGroupId: ancestors[index + 1], leaderAgentId: "main", allowLeaderReconfiguration: false,
        workflow: { nodes: [{ kind: "collaboration", nodeId: `${id}_child`, groupId: index ? ancestors[index - 1]! : "G" }],
          input: { source: "input", edges: [{ kind: "parallel", target: `${id}_child` }] }, routes: { [`${id}_child`]: [{ kind: "strong", target: "finish" }] } } });
    });
  }
  db.createProject({ projectId: P, workflowRevision: 1, workerCapacity: 1, git: { enabled: true, status: "ready", repository: { ...repository, localPath: path.join(projectPath, "repository") } },
    workflowSnapshot: workflow });
  let parentGroupRunId: string | undefined, parentArrivalRequestId: string | undefined;
  for (const id of [...ancestors].reverse()) {
    const parent = db.activateScopedGroup({ projectId: P, groupRunId: `run-${id}`, groupId: id,
      activationRequestId: parentArrivalRequestId ?? "activate", workflowRevision: 1, baseCommit: A,
      ...(parentGroupRunId ? { parentGroupRunId, parentArrivalRequestId } : { outer: { nodeRunId: "node-G", inputSnapshotRef: "input", activatedByAgentId: "main" } }) });
    parentGroupRunId = parent.groupRun.id; parentArrivalRequestId = parent.arrivals[0]!.requestId;
  }
  const activated = db.activateScopedGroup({ projectId: P, groupRunId: "run-G", groupId: "G", activationRequestId: parentArrivalRequestId ?? "activate", workflowRevision: 1,
    baseCommit: A, ...(parentGroupRunId ? { parentGroupRunId, parentArrivalRequestId } : { outer: { nodeRunId: "node-G", inputSnapshotRef: "input", activatedByAgentId: "main" } }) });
  const group = activated.groupRun;
  const execution = db.claimScopedAgentArrival({ projectId: P, arrivalRequestId: activated.arrivals[0]!.requestId,
    agentId: "worker", executionId: "original", worktreePath: worktree })!.execution;
  const identity = { projectId: P, executionId: execution.id, ownershipEpoch: 1, invocationId: "inv_original" };
  const originalRuntime = path.join(projectPath, "runtime", identity.invocationId);
  db.beginScopedAgentTurn({ ...identity, runtimePath: originalRuntime, baseCommit: A }); db.markScopedAgentTurnOpened({ ...identity, nativeProcessOpened: true });
  const session = { schemaVersion: 1 as const, harnessId: "pi" as const, adapterVersion: "1", generation: 0, durable: true,
    nativeId: path.join(projectPath, "original-session.jsonl"), createdAt: time() };
  const executionContext = { role: "delivery" as const, nodeRunId: "node-G", groupRunId: group.id, executionId: execution.id, ownershipEpoch: 1, executionWorktree: worktree };
  const binding = { projectId: P, agentId: "worker", invocationId: identity.invocationId, runtimePath: originalRuntime, worktreePath: worktree, session, executionContext };
  db.recordAgentNativeSessionBinding(binding);
  db.recordScopedAgentTaskCompletion({ ...identity, agentId: "worker", callId: "original-finish", requestedAt: time(), summary: "Original finish", memory: "Original submitted Memory" });
  db.recordScopedAgentReport({ ...identity, output: "Immutable original business report", reportHeadSha: A, residentTurnCompleted: true, residentStopConfirmed: true });
  let businessDelivery;
  if (options.businessDelivery) {
    const journal = db.operationsForProject(P, true), baseHead = rawGit(["rev-parse", `${A}^`]);
    rawGit(["update-ref", `refs/heads/${group.groupBranch}`, baseHead]);
    rawGit(["push", "origin", `${group.groupBranch}:${group.groupBranch}`, `${execution.executionBranch}:${execution.executionBranch}`]);
    const record = async (kind: "git.push" | "pull.create" | "pull.merge", fact: Record<string, unknown>) => {
      const operation = { id: `original-business-${kind}`, payloadHash: createHash("sha256").update(kind).digest("hex"), kind,
        status: "prepared" as const, ownerExecutionId: execution.id, ownershipEpoch: 1, expectedHead: A,
        expectedBase: kind === "git.push" ? execution.executionBranch : group.groupBranch };
      await journal.prepare(operation); await journal.transition({ ...operation, status: "observed", remoteFact: fact });
      await journal.transition({ ...operation, status: "finalized", remoteFact: fact });
    };
    await record("git.push", { owner: repository.owner, repository: repository.name, ref: execution.executionBranch, sha: A, status: "present", observedAt: time() });
    const pull = { id: "original-business-pull", providerNumber: 1, owner: repository.owner, repository: repository.name,
      htmlUrl: `${repository.htmlUrl}/pull/1`, ownerExecutionId: execution.id, head: execution.executionBranch, headSha: A,
      base: group.groupBranch, status: "open" as const, observedAt: time(), checks: [] };
    await record("pull.create", pull);
    // The test provider merges a linear A over its parent. Construct the real
    // two-parent commit with A's actual tree; this also supports older Git.
    const tree = rawGit(["rev-parse", `${A}^{tree}`], remote);
    const mergeCommitSha = rawGit(["commit-tree", tree, "-p", baseHead, "-p", A, "-m", "Actual original business merge"], remote);
    rawGit(["update-ref", `refs/heads/${group.groupBranch}`, mergeCommitSha, baseHead], remote);
    const merged = { ...pull, status: "merged" as const, mergeCommitSha }; await record("pull.merge", merged);
    const operationId = mergedPullSynchronizationOperationId(execution.id, 1, A, group.groupBranch, mergeCommitSha);
    const local = new LocalCollaborationGitService({ projectId: P, projectRoot: projectPath, worktreeMode: "agent", operationStore: journal, allowLocalRemotes: true, now: time });
    const synchronization = await local.synchronizeMergedPullRequest({ operationId, targetBranch: group.groupBranch,
      expectedSourceHead: A, expectedMergeCommit: mergeCommitSha, expectedRemoteHead: mergeCommitSha });
    db.recordScopedMergedSynchronization({ projectId: P, executionId: execution.id, ownershipEpoch: 1, providerNumber: 1,
      expectedHead: A, expectedBase: group.groupBranch, expectedMergeCommitSha: mergeCommitSha, synchronization });
    businessDelivery = { pullRequest: merged, synchronization };
  }
  if (businessDelivery && (options.originalStatus === "completed" || options.retainedMergedRoute)) db.completeScopedAgentArrivalAfterMerge({ projectId: P,
    executionId: execution.id, ownershipEpoch: 1, arrivalRequestId: execution.arrivalRequestId, ...businessDelivery });
  else db.failScopedAgentArrival({ projectId: P, executionId: execution.id, ownershipEpoch: 1, arrivalRequestId: execution.arrivalRequestId,
    reason: "Original bound report requires necessary Memory delivery", residentStopConfirmed: true });
  if (options.retainedMergedRoute) {
    // Isolated historical-drift sample: retain the real accepted route while
    // simulating a later failed owner. No production transition does this.
    const raw = new DatabaseSync(databasePath);
    try {
      raw.prepare("UPDATE scoped_executions SET status='failed' WHERE execution_id=?").run(execution.id);
      raw.prepare("UPDATE scoped_arrivals SET status='failed' WHERE request_id=?").run(execution.arrivalRequestId);
    } finally { raw.close(); }
  }
  if (options.originalStatus === "completed" && !businessDelivery) {
    // Isolated terminal-owner fixture; no production business transition is performed.
    const raw = new DatabaseSync(databasePath);
    try {
      raw.prepare("UPDATE scoped_executions SET status = 'completed' WHERE execution_id = ?").run(execution.id);
      raw.prepare("UPDATE scoped_arrivals SET status = 'completed' WHERE request_id = ?").run(execution.arrivalRequestId);
    } finally { raw.close(); }
  }
  const files = ["agent-memory/worker/Memory.md"], originalStop = { invocationId: identity.invocationId, runtimePath: originalRuntime,
    residentStopConfirmed: true as const, evidence: { nativeProcessScanCleared: true } };
  const observation = { projectId: P, executionId: execution.id, ownershipEpoch: 1, branch: execution.executionBranch, worktreePath: worktree,
    head: A, reportHeadSha: A, retained: true, observedAt: time(), pendingPaths: files, committedPaths: [], authorizedPaths: files,
    kind: (options.originalStatus === "completed" ? "completed-leftovers" : "bound-report-memory") as "completed-leftovers" | "bound-report-memory", deliveryRequired: false };
  if (options.identify !== false) db.recordScopedWorktreeClosingIssue({ projectId: P, executionId: execution.id, ownershipEpoch: 1, agentId: "worker", observation, originalStop });
  const leader = db.claimScopedLeaderTurn({ projectId: P, groupRunId: group.id, agentId: "main", invocationId: "inv_manager",
    runtimePath: path.join(projectPath, "runtime", "inv_manager"), allowStoppedRepairFaults: true })!;
  const manager = { projectId: P, groupRunId: group.id, agentId: "main", invocationId: "inv_manager", coordinatorEpoch: leader.coordinatorEpoch };
  db.markScopedLeaderOpened(manager);
  const managementEnvelope = (action: ControlAction, callId: string): ControlActionEnvelope => ({ projectId: P, agent: "main", invocationId: manager.invocationId,
    callId, stateVersion: manager.coordinatorEpoch, capabilityHash: "c".repeat(64), receivedAt: time(), action });
  db.recordScopedLeaderTaskCompletion({ ...manager, envelope: managementEnvelope({ tool: "finish_task", summary: "Explicit closing grant" }, "finish") });
  if (options.identify !== false) db.acceptScopedLeaderAction({ ...manager, residentStopConfirmed: true, envelope: managementEnvelope({ tool: "coordinate_group_task", groupRunId: group.id,
    coordinatorEpoch: leader.coordinatorEpoch, arrivalRequestId: execution.arrivalRequestId, operation: "close_worktree", rationale: "Inspect and deliver only my original Memory",
    closing: { executionId: execution.id, ownershipEpoch: 1, paths: files } }, "close") });
  db.releaseScopedLeaderTurn({ ...manager, residentStopConfirmed: true });
  if (ancestors.length) {
    // Isolated historical completed subtree: keep every business receipt and
    // route unchanged while retaining one live ancestor's original outer slot.
    const raw = new DatabaseSync(databasePath);
    try {
      for (const id of ["G", ...ancestors.slice(0, -1)]) {
        raw.prepare("UPDATE scoped_group_runs SET status='completed', completed_at=? WHERE group_run_id=?").run(time(), `run-${id}`);
        const saved = db.scopedGroupRun(P, `run-${id}`)!;
        raw.prepare("UPDATE scoped_arrivals SET status='completed' WHERE request_id=?").run(saved.parentArrivalRequestId!);
      }
    } finally { raw.close(); }
  }
  let closingPull: Record<string, any> | undefined;
  const makeGit = (restrictedClosing?: RestrictedWorktreeClosingAuthority, operationStore?: CollaborationGitOperationStore) => {
    const journal = operationStore ?? db.operationsForProject(P, true, restrictedClosing);
    const local = new LocalCollaborationGitService({ projectId: P, projectRoot: projectPath, worktreeMode: "agent", operationStore: journal, allowLocalRemotes: true, now: time });
    const provider = { observeRef: vi.fn(async (owner: string, repository: string, ref: string) => {
      const sha = rawGit(["for-each-ref", "--format=%(objectname)", `refs/heads/${ref}`], remote);
      return { owner, repository, ref, status: sha ? "present" : "missing", ...(sha ? { sha } : {}), observedAt: time() };
    }), openPullRequest: vi.fn(async (request: any) => {
      const operation = { id: request.operation.operationId, payloadHash: createHash("sha256").update(JSON.stringify(request.operation)).digest("hex"), kind: "pull.create" as const,
        status: "prepared" as const, ownerExecutionId: execution.id, ownershipEpoch: 1, expectedHead: request.operation.expectedHead, expectedBase: request.base };
      const prepared = await journal.prepare(operation);
      if (prepared.status === "finalized") return prepared.remoteFact;
      const fact = { id: "closing-pull", providerNumber: 11, owner: request.owner, repository: request.repository, head: request.head,
        base: request.base, headSha: request.operation.expectedHead, ownerExecutionId: execution.id, status: "open", checks: [], htmlUrl: `${repository.htmlUrl}/pull/11`, observedAt: time() };
      await journal.transition({ ...operation, status: "observed", remoteFact: fact }); await journal.transition({ ...operation, status: "finalized", remoteFact: fact });
      closingPull = fact; return fact;
    }), observePullRequest: vi.fn(async () => closingPull), observePullRequestForExecution: vi.fn(async () => closingPull),
    mergePullRequest: vi.fn(async (request: any) => {
      if (!closingPull || closingPull.providerNumber !== request.providerNumber) throw Error("Exact supplemental PR is absent");
      const operation = { id: request.operation.operationId, payloadHash: createHash("sha256").update(JSON.stringify(request.operation)).digest("hex"),
        kind: "pull.merge" as const, status: "prepared" as const, ownerExecutionId: execution.id, ownershipEpoch: 1,
        expectedHead: request.operation.expectedHead, expectedBase: request.operation.expectedBase };
      await journal.prepare(operation);
      const baseRef = `refs/heads/${closingPull.base}`, baseHead = rawGit(["rev-parse", baseRef], remote);
      if (rawGit(["rev-parse", `${baseHead}^{tree}`], remote) !== rawGit(["rev-parse", `${A}^{tree}`], remote)) {
        throw Error("Test provider target gained unexpected content; no fixture merge is permitted");
      }
      rawGit(["merge-base", "--is-ancestor", A, operation.expectedHead], remote);
      const tree = rawGit(["rev-parse", `${operation.expectedHead}^{tree}`], remote);
      const mergeCommitSha = rawGit(["commit-tree", tree, "-p", baseHead, "-p", operation.expectedHead, "-m", "Actual independent supplemental merge"], remote);
      rawGit(["update-ref", baseRef, mergeCommitSha, baseHead], remote);
      closingPull = { ...closingPull, status: "merged", mergeCommitSha, observedAt: time() };
      await journal.transition({ ...operation, status: "observed", remoteFact: closingPull });
      await journal.transition({ ...operation, status: "finalized", remoteFact: closingPull }); return closingPull;
    }) };
    const git = new CollaborationGitFacade({ localGit: local, operationStore: journal, provider: provider as any });
    return { git, provider, journal };
  };
  const zero = { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, totalTokens: 0, invocations: 0 };
  const state = { id: P, title: "Original retained closing", requirement: "Deliver the original task without replacing its Session", status: "running", phase: "collaboration:scoped",
    createdAt: time(), updatedAt: time(), turn: 0, cycle: 1, eventSeq: 0, consecutiveFailures: 0, completionGeneration: 0,
    controlProtocol: "natural-language-tools-v1", mainInvocationSeq: 0, userInputs: [], workflowRevision: 1,
    git: { enabled: true, status: "ready", repository: { ...repository, localPath: path.join(projectPath, "repository") } },
    agents: { main: structuredClone(defaultAgentConfigs.main), worker: { ...structuredClone(defaultAgentConfigs.execution), harness: "pi", skills: [], autoSkills: [], mcpServers: [] } },
    orchestration: workflow, agentSessions: { worker: session }, agentSessionIds: { worker: session.nativeId }, agentSessionMeta: { worker: { generation: 0, contextSeq: 0, resumeFailureCount: 0 } },
    runCounts: { main: 0, worker: 1 }, tokenUsage: { ...zero, byAgent: { main: { ...zero }, worker: { ...zero } } }, computeUsage: emptyProjectComputeUsage() } as unknown as ProjectState;
  await storage.createProject(state);
  const snapshot = () => { const raw = new DatabaseSync(databasePath); try { return ["scoped_executions", "scoped_agent_turns", "scoped_agent_reports", "scoped_agent_task_completions"].map(table => raw.prepare(`SELECT * FROM ${table}`).all()); } finally { raw.close(); } };
  const assertCurrent = vi.fn(() => { if (!current) throw Error("Revoked original native control"); });
  const ordinary = makeGit();
  return { root, storage, projectPath, worktree, rawGit, remote, A, memory, time, databasePath, db, execution, session, executionContext,
    originalStop, observation, binding, manager, files, state, snapshot, assertCurrent, makeGit, ordinaryGit: ordinary.git,
    repository, businessDelivery, advance: (ms: number) => { now += ms; }, revoke: () => { current = false; } };
}

export async function openedClosingFixture(fixtureOptions: { originalStatus?: "completed" | "failed"; businessDelivery?: boolean; nextArrival?: boolean; retainedMergedRoute?: boolean } = {}) {
  const f = await authorizedClosingFixture(fixtureOptions);
  const { db, execution, projectPath, manager, originalStop, observation, binding, A, files, state, executionContext, worktree,
    storage, repository, assertCurrent } = f;
  const capability = "exact-reserved-closing-secret", capabilityHash = createHash("sha256").update(capability).digest("hex"), invocationId = "inv_closing";
  const closingInput = { projectId: P, executionId: execution.id, ownershipEpoch: 1, agentId: "worker", invocationId,
    runtimePath: path.join(projectPath, "runtime", invocationId), capabilityHash, grantInvocationId: manager.invocationId, grantCallId: "close", originalStop, observation };
  db.beginScopedWorktreeClosingTurn(closingInput); db.markScopedWorktreeClosingOpened({ ...closingInput, nativeProcessOpened: true });
  db.recordAgentNativeSessionBinding({ ...binding, invocationId, runtimePath: closingInput.runtimePath });
  const closing = db.scopedWorktreeClosingTurns(P)[0]!;
  const restrictedClosing = { invocationId, capabilityHash, scope: { kind: closing.kind, reportHeadSha: A, paths: files } };
  const { git, provider } = f.makeGit(restrictedClosing);
  const scope = { ...restrictedClosing.scope, executionId: execution.id, ownershipEpoch: 1, grantInvocationId: manager.invocationId, grantCallId: "close" };
  const request = { project: state, agent: "worker", invocationId, kind: "worker", executionContext, worktreeClosing: scope,
    runtimePath: closing.runtimePath, workspacePath: worktree, projectPath, sessionContinuity: "strict" } as AgentRunRequest;
  const options = { state, database: db, storage, closing, capability, git, repository, assertCurrent };
  const factory = scopedWorktreeClosingControlAuthorityFactory(options), turn = { invocationId, inputId: "closing-input", prompt: "Original Agent closing" };
  const authority = await factory({ request, turn });
  const envelope = (action: ControlAction, callId = "call"): ControlActionEnvelope => ({ projectId: P, agent: "worker", invocationId, callId,
    capabilityHash: authority.control.capabilityHash, stateVersion: 1, receivedAt: f.time(), action });
  const run = (action: ControlAction, callId = "call") => authority.execute!(envelope(action, callId), new AbortController().signal);
  return { ...f, capability: authority.control.capability, closing, scope, request, turn, options, factory, authority, envelope, run, provider };
}
