import { createHash } from "node:crypto";
import type { CredentialFreeProjectStateProjection } from "./collaboration-state/contracts.js";
import { CollaborationStateError } from "./collaboration-state/errors.js";
import { unsettledAgentGitOperations } from "./agent-git-delivery.js";

/** Identity is supplied by the server's live invocation, never MCP arguments. */
export type ProjectStatePrincipal =
  | { kind: "agent"; projectId: string; agentId: string; invocationId: string }
  | { kind: "system"; projectId: string; source: string };
export type ProjectStateRole = "system" | "main" | "leader" | "worker";
export const PROJECT_STATE_KINDS = ["project", "agent", "group", "node", "task", "execution", "operation", "report", "receipt", "experiment"] as const;
export type ProjectStateKind = typeof PROJECT_STATE_KINDS[number];
export interface ProjectStateRef { kind: ProjectStateKind; id: string }
export interface ProjectStateAuthority {
  role: ProjectStateRole;
  agentId?: string;
  invocationId?: string;
  groupRunId?: string;
  executionId?: string;
  ownershipEpoch?: number;
  taskId?: string;
}
export interface ProjectStateCore {
  object: ProjectStateRef;
  groupRunIds: string[];
  agentId?: string;
  executionId?: string;
  taskId?: string;
  ownershipEpoch?: number;
  core: unknown;
}
export interface ProjectStateEntry extends ProjectStateCore {
  projectId: string;
  projectRevision: number;
  version: string;
  extensions: Record<string, unknown>;
  extensionSeq: number;
  access: { role: ProjectStateRole; canWrite: boolean; reason?: string };
}
export type ProjectStateListItem = Omit<ProjectStateEntry, "core" | "extensions"> & { extensionFields: string[] };
export interface ProjectStateChange {
  object: ProjectStateRef;
  expectedVersion: string;
  set?: Record<string, unknown>;
  remove?: string[];
  reason: string;
  callId: string;
}
export interface ProjectStatePullReconciliation {
  operation: "reconcile_pull";
  object: ProjectStateRef;
  expectedVersion: string;
  sourceOperationId: string;
  reason: string;
  callId: string;
}
export interface ProjectStateMainCoordination {
  operation: "request_main";
  object: ProjectStateRef;
  expectedVersion: string;
  sourceIssueId: string;
  reason: string;
  callId: string;
}
export interface ProjectStatePullPreparation {
  projectId: string;
  executionId: string;
  ownershipEpoch: number;
  sourceOperationId: string;
  sourceHash: string;
  providerNumber: number;
  providerId: string;
  expectedHead: string;
  expectedBase: string;
  expectedBranch: string;
  scoped: boolean;
  repository: Pick<import("./collaboration-git/contracts.js").GitHubRepositoryFact, "owner" | "name">;
}
export type ProjectStateRequest =
  | { operation: "list"; kind?: ProjectStateKind; offset?: number; limit?: number; expectedRevision?: number; snapshotId?: string }
  | { operation: "get"; object: ProjectStateRef; historyOffset?: number; historyLimit?: number; historyThroughSequence?: number }
  | ({ operation: "patch" } & ProjectStateChange)
  | ProjectStatePullReconciliation
  | ProjectStateMainCoordination
  | { operation: "stop_agent"; agentId: string; invocationId: string; reason: string; callId: string }
  | { operation: "request_leader"; message: string; callId: string };

export function projectStateError(code: "INVALID_STATE_TRANSITION" | "STATE_SCOPE_DENIED" | "STALE_STATE_VERSION", message: string,
  details: Record<string, unknown> = {}): never {
  throw new CollaborationStateError(code, message, details);
}

/** Stable object versions fence both system transitions and Agent extensions. */
export function projectStateDigest(value: unknown): string {
  const canonical = (item: unknown): unknown => Array.isArray(item) ? item.map(canonical)
    : item && typeof item === "object" ? Object.fromEntries(Object.entries(item).filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k, v]) => [k, canonical(v)])) : item;
  return createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");
}

export function projectStateKey(ref: ProjectStateRef): string { return JSON.stringify([ref.kind, ref.id]); }

/** Business CAS includes key core facts and extension changes. A read's own
 * native trace/usage accounting must not invalidate the version it returned.
 * The complete checkpoint still has its independent, exact document CAS. */
export function projectStateVersionMaterial(object: ProjectStateCore): ProjectStateCore {
  if (object.object.kind !== "project" || !object.core || typeof object.core !== "object") return object;
  const { usage: _usage, ...core } = object.core as Record<string, unknown>;
  if (core.runtime && typeof core.runtime === "object") {
    const { stateRevision: _stateRevision, ...runtime } = core.runtime as Record<string, unknown>;
    core.runtime = runtime;
  }
  const formal = core.formalState as CredentialFreeProjectStateProjection["formalState"];
  if (!formal?.checkpoint) return { ...object, core };
  const { version: _version, revision: _revision, lifecycle, ...checkpoint } = formal.checkpoint;
  const { updatedAt: _updatedAt, eventSeq: _eventSeq, tokenUsage: _tokenUsage, computeUsage: _computeUsage, ...keyLifecycle } = lifecycle;
  return { ...object, core: { ...core, formalState: { ...formal,
    checkpoint: { ...checkpoint, lifecycle: keyLifecycle } } } };
}

export function validateProjectStateRequest(value: unknown): ProjectStateRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) projectStateError("INVALID_STATE_TRANSITION", "State request must be an object");
  const r = { ...value } as Record<string, unknown>;
  const allowed = r.operation === "stop_agent" ? ["operation", "agentId", "invocationId", "reason", "callId"] : r.operation === "request_leader" ? ["operation", "message", "callId"] : r.operation === "list" ? ["operation", "kind", "offset", "limit", "expectedRevision", "snapshotId"]
    : r.operation === "get" ? ["operation", "object", "historyOffset", "historyLimit", "historyThroughSequence"]
      : r.operation === "patch" ? ["operation", "object", "expectedVersion", "set", "remove", "reason", "callId"]
        : r.operation === "reconcile_pull" ? ["operation", "object", "expectedVersion", "sourceOperationId", "reason", "callId"]
          : r.operation === "request_main" ? ["operation", "object", "expectedVersion", "sourceIssueId", "reason", "callId"] : [];
  if (!allowed.length || Object.keys(r).some(k => !allowed.includes(k)))
    projectStateError("INVALID_STATE_TRANSITION", "Unknown state operation or field; identity and core fields are server-owned");
  // Empty optional read placeholders do not select another object or weaken a write fence.
  if (r.operation === "list" || r.operation === "get") {
    for (const key of allowed) if (key !== "object" && r[key] === null) delete r[key];
    if (r.operation === "list" && r.expectedRevision === 0) delete r.expectedRevision;
    if (r.operation === "list" && r.snapshotId === "") delete r.snapshotId;
  }
  if (r.operation === "stop_agent") {
    for (const [key, max] of [["agentId", 256], ["invocationId", 256], ["reason", 8192], ["callId", 256]] as const)
      if (typeof r[key] !== "string" || !(r[key] as string).trim() || (r[key] as string).length > max)
        projectStateError("INVALID_STATE_TRANSITION", `${key} must be nonempty and at most ${max} characters`);
    return r as Extract<ProjectStateRequest, { operation: "stop_agent" }>;
  }
  if (r.operation === "request_leader") {
    for (const [key, max] of [["message", 8192], ["callId", 256]] as const)
      if (typeof r[key] !== "string" || !(r[key] as string).trim() || (r[key] as string).length > max)
        projectStateError("INVALID_STATE_TRANSITION", `${key} must be nonempty and at most ${max} characters`);
    return r as Extract<ProjectStateRequest, { operation: "request_leader" }>;
  }
  if (r.operation !== "list") {
    const ref = r.object as ProjectStateRef;
    if (!ref || typeof ref !== "object" || Array.isArray(ref) || Object.keys(ref).some(k => !["kind", "id"].includes(k)) ||
      !PROJECT_STATE_KINDS.includes(ref.kind) || typeof ref.id !== "string" || !ref.id.trim() || ref.id.length > 1024)
      projectStateError("INVALID_STATE_TRANSITION", "State object requires a supported kind and exact id");
  } else if (r.kind !== undefined && !PROJECT_STATE_KINDS.includes(r.kind as ProjectStateKind))
    projectStateError("INVALID_STATE_TRANSITION", "Unknown state object kind");
  for (const [key, max, min] of [["offset", Number.MAX_SAFE_INTEGER, 0], ["limit", Number.MAX_SAFE_INTEGER, 1],
    ["historyOffset", Number.MAX_SAFE_INTEGER, 0], ["historyLimit", 100, 0], ["historyThroughSequence", Number.MAX_SAFE_INTEGER, 0],
    ["expectedRevision", Number.MAX_SAFE_INTEGER, 1]] as const) {
    if (r[key] !== undefined && (!Number.isSafeInteger(r[key]) || (r[key] as number) < min || (r[key] as number) > max))
      projectStateError("INVALID_STATE_TRANSITION", `${key} must be a safe integer between ${min} and ${max}. ${
        key === "limit" || key === "offset" ? "state_list returns the complete index; omit legacy offset/limit arguments."
          : key === "historyLimit" ? "Omit or use 0 for facts without history; explicitly request a historyLimit or copy nextHistoryPage."
            : key === "expectedRevision" ? "Omit it or use 0 to read the latest complete index."
              : "Copy the returned nextHistoryPage arguments rather than guessing a history offset or sequence."}`, {
        invalidField: key, minimum: min, maximum: max
      });
  }
  if (r.snapshotId !== undefined && (typeof r.snapshotId !== "string" || !r.snapshotId.trim() || r.snapshotId.length > 256))
    projectStateError("INVALID_STATE_TRANSITION", "snapshotId must be copied from state_list.nextPage; omit it to start a fresh read", { invalidField: "snapshotId" });
  if (r.operation === "patch" || r.operation === "reconcile_pull" || r.operation === "request_main") {
    for (const [key, max] of [["callId", 256], ["reason", 8192]] as const) {
      if (typeof r[key] !== "string" || !(r[key] as string).trim() || (r[key] as string).length > max)
        projectStateError("INVALID_STATE_TRANSITION", `${key} must be nonempty and at most ${max} characters`);
    }
    if (typeof r.expectedVersion !== "string" || !/^[a-f0-9]{64}$/.test(r.expectedVersion))
      projectStateError("INVALID_STATE_TRANSITION", "expectedVersion must be the exact version returned by state_get");
  }
  if (r.operation === "reconcile_pull") {
    if ((r.object as ProjectStateRef).kind !== "execution" || typeof r.sourceOperationId !== "string" ||
      !r.sourceOperationId.trim() || r.sourceOperationId.length > 1024)
      projectStateError("INVALID_STATE_TRANSITION", "PR reconciliation requires an exact execution and original operation id");
  }
  if (r.operation === "request_main" && ((r.object as ProjectStateRef).kind !== "execution" || typeof r.sourceIssueId !== "string" ||
    !r.sourceIssueId.trim() || r.sourceIssueId.length > 1024))
    projectStateError("INVALID_STATE_TRANSITION", "Main state coordination requires an exact execution and recorded mechanism issue");
  if (r.operation === "patch") {
    if (r.set !== undefined && (!r.set || typeof r.set !== "object" || Array.isArray(r.set)))
      projectStateError("INVALID_STATE_TRANSITION", "set must be an object of business extension fields");
    if (r.remove !== undefined && (!Array.isArray(r.remove) || r.remove.some(k => typeof k !== "string")))
      projectStateError("INVALID_STATE_TRANSITION", "remove must be an array of extension field names");
    if (!Object.keys((r.set as object) ?? {}).length && !(r.remove as unknown[] | undefined)?.length)
      projectStateError("INVALID_STATE_TRANSITION", "State patch requires at least one extension change");
    validateBusinessState(r.set ?? {});
    for (const key of (r.remove as string[] | undefined) ?? []) validateBusinessKey(key);
    if (((r.remove as string[] | undefined) ?? []).some(k => Object.hasOwn(r.set ?? {}, k)))
      projectStateError("INVALID_STATE_TRANSITION", "An extension cannot be both set and removed");
  }
  return structuredClone(r) as ProjectStateRequest;
}

function validateBusinessKey(key: string): void {
  if (!key || key.length > 256 || key.includes("\0") || ["__proto__", "prototype", "constructor"].includes(key))
    projectStateError("INVALID_STATE_TRANSITION", "Invalid business extension key");
}

/** Generic JSON/storage limits only; no per-business-field schema or semantics. */
export function validateBusinessState(value: unknown): void {
  let nodes = 0;
  const visit = (item: unknown, depth: number): void => {
    if (++nodes > 10_000 || depth > 32) projectStateError("INVALID_STATE_TRANSITION", "Business state exceeds structural limits");
    if (item === null || typeof item === "string" || typeof item === "boolean") return;
    if (typeof item === "number" && Number.isFinite(item)) return;
    if (Array.isArray(item)) { item.forEach(v => visit(v, depth + 1)); return; }
    if (item && typeof item === "object" && [Object.prototype, null].includes(Object.getPrototypeOf(item))) {
      for (const [key, v] of Object.entries(item)) { validateBusinessKey(key); visit(v, depth + 1); }
      return;
    }
    projectStateError("INVALID_STATE_TRANSITION", "Business extensions must contain only finite JSON values");
  };
  visit(value, 0);
  if (Buffer.byteLength(JSON.stringify(value), "utf8") > 65_536)
    projectStateError("INVALID_STATE_TRANSITION", "Business state exceeds 65536 bytes");
}

/** These are views of existing records, never a second copy of core authority. */
export function projectStateObjects(p: CredentialFreeProjectStateProjection): ProjectStateCore[] {
  const objects: ProjectStateCore[] = [];
  const add = (kind: ProjectStateKind, id: string, core: unknown, scope: Partial<Omit<ProjectStateCore, "object" | "core">> = {}) =>
    objects.push({ object: { kind, id }, groupRunIds: [], ...scope, core });
  add("project", p.id, { workflowRevision: p.workflowRevision, workflowSnapshot: p.workflowSnapshot,
    ...(p.runtime ? { runtime: p.runtime } : {}),
    activeNodeRunId: p.activeNodeRunId, frozen: p.frozen, freezeReason: p.freezeReason,
    recoveryAttempts: p.recoveryAttempts, recoveryLimit: p.recoveryLimit, git: p.git,
    routeOutbox: p.routeOutbox, failureSummary: p.failureSummary, failureAttempts: p.failureAttempts,
    runtimeActivities: p.runtimeActivities, usage: p.usage, scopedConfiguration: p.scopedConfiguration,
    resumableCancellation: p.resumableCancellation, ...(p.formalState ? { formalState: p.formalState } : {}) });
  const scoped = p.scopedGroupRuns ?? [];
  for (const g of p.groupRuns) add("group", g.id, g, { groupRunIds: [g.id] });
  for (const g of scoped) add("group", g.id, { ...g,
    managementTurns: p.scopedManagementTurns?.filter(t => t.groupRunId === g.id),
    issues: p.scopedGroupIssues?.filter(i => i.groupRunId === g.id),
    finalIntegration: p.scopedFinalIntegrations?.find(f => f.groupRunId === g.id),
    finalMerge: p.scopedGroupFinalMerges?.find(f => f.groupRunId === g.id) }, { groupRunIds: [g.id] });
  for (const node of p.nodeRuns) {
    const groups = [...p.groupRuns.filter(g => g.nodeRunId === node.id).map(g => g.id),
      ...scoped.filter(g => g.activationRequestId === node.activationRequestId).map(g => g.id)];
    add("node", node.id, node, { groupRunIds: groups, ...(node.node.kind === "agent" ? { agentId: node.node.agentId } : {}) });
  }
  for (const task of p.tasks) add("task", task.id, task, { groupRunIds: task.groupRunId ? [task.groupRunId] : [], taskId: task.id,
    ...(task.assigneeAgentId ? { agentId: task.assigneeAgentId } : {}) });
  for (const a of p.scopedArrivals ?? []) add("task", a.requestId, a, { groupRunIds: [a.groupRunId], taskId: a.requestId, agentId: a.agentId });
  for (const e of [...p.executions, ...(p.scopedExecutions ?? [])]) {
    const groupRunId = "groupRunId" in e ? e.groupRunId : undefined;
    add("execution", e.id, { ...e,
      gitOperations: p.operations.filter(operation => operation.ownerExecutionId === e.id),
      ...(p.agentGitDelivery?.[e.id] ? { gitDelivery: p.agentGitDelivery[e.id] } : {}),
      unresolvedGitOperations: p.agentGitDelivery?.[e.id]?.unresolvedOperations ?? unsettledAgentGitOperations(p.operations, e.id, e.ownershipEpoch),
      reports: p.scopedAgentReports?.filter(r => r.executionId === e.id),
      taskCompletions: p.scopedAgentTaskCompletions?.filter(c => c.executionId === e.id),
      pullRequests: [...p.pullRequests, ...(p.additionalPullRequests ?? []), ...(p.scopedPullRequests ?? [])].filter(pr => pr.ownerExecutionId === e.id),
      merges: p.scopedAgentMerges?.filter(m => m.executionId === e.id),
      worktreeClosing: p.scopedWorktreeClosingSettlements?.filter(c => c.executionId === e.id) },
      { groupRunIds: groupRunId ? [groupRunId] : [], agentId: e.agentId,
      executionId: e.id, ownershipEpoch: e.ownershipEpoch, taskId: "taskId" in e ? e.taskId : e.arrivalRequestId });
  }
  for (const final of p.scopedFinalIntegrations ?? []) {
    const activity = p.runtimeActivities.find(a => a.executionId === final.id);
    add("execution", final.id, final, { groupRunIds: [final.groupRunId], executionId: final.id,
      ownershipEpoch: final.ownershipEpoch, agentId: activity?.agentId });
  }
  if (p.formalState?.domain.scheduler === "serial") for (const e of p.formalState.serialExecutions) {
    const current = p.formalState.checkpoint.activeAgentExecution?.id === e.id;
    const completion = p.formalState.checkpoint.lifecycle.taskCompletions?.[e.id];
    const core = { ...e, current, ...(completion ? { taskCompletion: completion } : {}),
      deferredWaits: p.formalState.experiments.ledger.waits.filter(w => w.owner === `${e.agent}\0${e.id}`) };
    add("execution", e.id, core, { agentId: e.agent, executionId: e.id, taskId: e.id });
    add("task", e.id, core, { agentId: e.agent, executionId: e.id, taskId: e.id });
  }
  for (const e of p.formalState?.experiments.ledger.experiments ?? []) {
    const owner = objects.find(o => o.object.kind === "execution" && o.object.id === (e.scope?.executionId ?? e.taskId) && o.agentId === e.agent);
    add("experiment", e.id, e, { agentId: e.agent, taskId: e.taskId, ...(owner ? {
      executionId: owner.executionId, ownershipEpoch: e.scope?.ownershipEpoch,
      groupRunIds: !e.scope?.groupRunId || owner.groupRunIds.includes(e.scope.groupRunId) ? owner.groupRunIds : [] } : {}) });
  }
  for (const operation of p.operations) {
    const execution = objects.find(o => o.object.kind === "execution" && o.object.id === operation.ownerExecutionId);
    add("operation", operation.id, operation, { groupRunIds: execution?.groupRunIds ?? [], agentId: execution?.agentId,
      executionId: operation.ownerExecutionId, ownershipEpoch: operation.ownershipEpoch });
  }
  for (const report of p.scopedAgentReports ?? []) {
    const execution = objects.find(o => o.object.kind === "execution" && o.object.id === report.executionId);
    add("report", `${report.executionId}:${report.ownershipEpoch}`, report, { groupRunIds: execution?.groupRunIds ?? [],
      agentId: execution?.agentId, executionId: report.executionId, ownershipEpoch: report.ownershipEpoch });
  }
  const workflow = p.workflowSnapshot as { agents?: Array<{ name: string }> };
  const agents = Array.isArray(workflow?.agents) ? workflow.agents : [];
  const ids = new Set([...agents.map(a => a.name), ...p.executions.map(e => e.agentId),
    ...(p.scopedExecutions ?? []).map(e => e.agentId), ...p.runtimeActivities.map(a => a.agentId),
    ...(p.formalState?.serialExecutions.map(e => e.agent) ?? []), ...(p.formalState?.experiments.ledger.experiments.map(e => e.agent) ?? [])]);
  for (const agentId of ids) {
    const groups = [...p.groupRuns.filter(g => g.memberSnapshot.includes(agentId)).map(g => g.id),
      ...scoped.filter(g => g.leaderAgentId === agentId || (p.scopedArrivals ?? []).some(a => a.groupRunId === g.id && a.agentId === agentId)).map(g => g.id)];
    add("agent", agentId, { definition: agents.find(a => a.name === agentId),
      activities: p.runtimeActivities.filter(a => a.agentId === agentId),
      ...(p.formalState?.domain.scheduler === "serial" ? { serialExecutions: p.formalState.serialExecutions.filter(e => e.agent === agentId),
        session: p.formalState.checkpoint.lifecycle.agentSessions?.[agentId] } : {}) }, { agentId, groupRunIds: groups });
  }
  const keys = objects.map(o => projectStateKey(o.object));
  if (new Set(keys).size !== keys.length) projectStateError("INVALID_STATE_TRANSITION", "Ambiguous state object identity");
  return objects.sort((a, b) => projectStateKey(a.object).localeCompare(projectStateKey(b.object)));
}

export function projectStateCanWrite(authority: ProjectStateAuthority, object: ProjectStateCore,
  p: CredentialFreeProjectStateProjection): boolean {
  if (authority.role === "system" || authority.role === "main") return true;
  if (authority.role === "worker") return object.object.kind === "agent" ? object.agentId === authority.agentId
    : (object.executionId !== undefined && object.executionId === authority.executionId &&
      object.ownershipEpoch === authority.ownershipEpoch) ||
      (object.object.kind === "task" && object.taskId === authority.taskId && object.agentId === authority.agentId) ||
      (object.object.kind === "experiment" && object.taskId === authority.taskId && object.agentId === authority.agentId &&
        object.ownershipEpoch === authority.ownershipEpoch);
  if (!authority.groupRunId) return false;
  const allowed = new Set([authority.groupRunId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const g of p.scopedGroupRuns ?? []) if (g.parentGroupRunId && allowed.has(g.parentGroupRunId) && !allowed.has(g.id)) {
      allowed.add(g.id); changed = true;
    }
  }
  return object.groupRunIds.some(id => allowed.has(id));
}
