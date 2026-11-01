import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import type { CollaborationExecutionInputBuilder, CollaborationResidentHandle, CollaborationResidentLauncher } from "./collaboration-runtime.js";
import type { CollaborationStateDatabase } from "./collaboration-state/store.js";
import type { AgentNativeSessionBinding, TerminalPushCoordinationIncident, TerminalPushCoordinatorTurn } from "./collaboration-state/contracts.js";
import type { ProjectStorage } from "./storage.js";
import type { AgentRunRequest, AgentRunResult, ControlActionEnvelope, ProjectState, TraceSink } from "./types.js";
import type { InvocationInputs } from "./harness-runtime/contracts.js";
import { residentScopeId } from "./harness-runtime/resident-lease.js";
import { terminalPushCoordinationControlAuthorityFactory } from "./terminal-push-coordination-control.js";
import { redactTrace } from "./utils.js";
import { AgentContextSources } from "./agent-context-index.js";

interface Options {
  state: ProjectState; database: CollaborationStateDatabase; storage: ProjectStorage;
  launcher: CollaborationResidentLauncher; builder?: CollaborationExecutionInputBuilder; signal: AbortSignal;
  assertCurrent(): void;
  wait(): Promise<void>;
  publish(): Promise<void>;
  inputs(agentId: string, invocationId: string, inboxPath: string, runtimePath: string): Promise<InvocationInputs>;
  filesystem(): Promise<Parameters<CollaborationResidentLauncher["open"]>[0]["filesystemAuthorityInput"]>;
  decorate(request: AgentRunRequest): void;
  trace(agentId: string, invocationId: string): TraceSink;
  turnRequestFactory(request: AgentRunRequest): Parameters<CollaborationResidentLauncher["open"]>[0]["turnRequestFactory"];
  hasResident(key: string): boolean;
  register(key: string, turn: TerminalPushCoordinatorTurn, handle: CollaborationResidentHandle): void;
  unregister(key: string): void;
  submit(handle: CollaborationResidentHandle, turn: { inputId: string; invocationId: string; prompt: string }): Promise<AgentRunResult>;
  requestUser(incident: TerminalPushCoordinationIncident, decision: ControlActionEnvelope): Promise<void>;
}

/** The scheduler supplies identities, facts and finite mechanism recovery.
 * Agents author their memory/handoff and choose retry, parent escalation or
 * a user question themselves. No business task is reopened here. */
export class TerminalPushCoordinatorRuntime {
  constructor(private readonly options: Options) {}

  private context(turn: TerminalPushCoordinatorTurn): NonNullable<AgentRunRequest["executionContext"]> {
    const { database, state } = this.options;
    const incident = database.terminalPushCoordinationIncidents(state.id).find(entry => entry.id === turn.incidentId)!;
    // A genuine mechanism management scope, with no business route candidates.
    return { role: "leader", nodeRunId: database.terminalPushOwnerNodeRunId(state.id, incident.executionId), routeScopeId: `receipt-${incident.id}`, coordinatorEpoch: turn.coordinatorEpoch };
  }

  private async stopped(binding: Pick<AgentNativeSessionBinding, "agentId" | "runtimePath" | "executionContext">) {
    const { launcher, state } = this.options;
    const context = binding.executionContext;
    if (!launcher.stopScopedForRecovery || context.role === "final-integration") {
      throw new Error("Receipt manager requires its original trusted native Stop boundary");
    }
    const result = await launcher.stopScopedForRecovery({ state: structuredClone(state), agentId: binding.agentId,
      nodeRunId: context.nodeRunId, scopeId: residentScopeId(context), role: context.role,
      ownershipEpoch: context.role === "leader" ? context.coordinatorEpoch : context.ownershipEpoch,
      executionRuntimePath: binding.runtimePath });
    if (!result.stopped || !Object.keys(result.evidence).length) throw new Error("Original manager native Stop is unproven");
    return result.evidence;
  }

  private recordStopped(turn: TerminalPushCoordinatorTurn, evidence: Readonly<Record<string, unknown>>): void {
    const { database } = this.options;
    if (database.terminalPushCoordinatorTurns(turn.projectId).find(entry => entry.invocationId === turn.invocationId)?.status === "stopped") return;
    database.stopTerminalPushCoordinator({ ...turn, residentStopConfirmed: true, evidence,
      ...(turn.writerLeaseEpoch !== database.writerLease().epoch ? { priorWriterLeaseEpoch: turn.writerLeaseEpoch } : {}) });
  }

  async reconcile(): Promise<void> {
    const { state, database, storage } = this.options;
    if (state.status === "completed") return;
    for (const turn of database.terminalPushCoordinatorTurns(state.id)) {
      if (turn.completion) await storage.saveTerminalPushCoordinatorCompletion(turn);
      if (turn.status === "stopped" || this.options.hasResident(`receipt-coordinator:${turn.invocationId}`)) continue;
      const evidence = await this.stopped({ ...turn, executionContext: this.context(turn) });
      this.recordStopped(turn, evidence);
    }
    await this.options.publish();
  }

  async advance(): Promise<void> {
    const o = this.options;
    if (o.state.status === "completed") return;
    await this.reconcile();
    for (const original of o.database.terminalPushCoordinationIncidents(o.state.id)) {
      while (true) {
        await o.wait(); o.assertCurrent(); o.signal.throwIfAborted();
        const incident = o.database.terminalPushCoordinationIncidents(o.state.id).find(entry => entry.id === original.id)!;
        if (incident.status === "waiting-user") {
          if (o.state.orchestration.allowUserIntervention === false) {
            throw new Error("当前 Workflow 已关闭用户介入；原 Git 回执问题尚未解决，保留现场等待故障恢复。");
          }
          await o.requestUser(incident, incident.decision!); return;
        }
        if (incident.status === "manager-failed") {
          const failure = o.database.terminalPushCoordinatorTurns(o.state.id).filter(turn => turn.incidentId === incident.id).at(-1)?.failure;
          throw new Error(`Receipt coordination needs a later recovery round: the original Main's fast retries are exhausted${failure ? `: ${failure}` : ""}`);
        }
        if (incident.status !== "open") break;
        const prior = o.database.terminalPushCoordinatorTurns(o.state.id).filter(turn => turn.incidentId === incident.id &&
          turn.level === incident.level && turn.userResponseRequestId === incident.userResponse?.requestId).at(-1);
        if (prior && !prior.failure) {
          if (prior.status !== "stopped") throw new Error("Receipt coordinator still owns a native process");
          if (prior.completion && prior.result && prior.stagedDecision) {
            o.database.acceptTerminalPushCoordinatorDecision(prior); await o.publish(); continue;
          }
          const nativeFailure = o.database.eventByRequestId(o.state.id, `receipt-coordinator-error:${prior.invocationId}`);
          o.database.recordTerminalPushCoordinatorFailure({ ...prior, reason: typeof nativeFailure?.payload.reason === "string"
            ? nativeFailure.payload.reason : "The stopped original coordinator omitted its own finish, actual output or coordination decision" });
          await o.publish(); continue;
        }
        const manager = incident.coordinators[incident.level];
        const binding = o.database.latestAgentNativeSessionBinding(o.state.id, manager.agentId);
        const session = o.state.agentSessions?.[manager.agentId];
        if (!binding || !session || binding.session.nativeId !== session.nativeId || binding.session.harnessId !== session.harnessId ||
          binding.session.generation !== session.generation || binding.session.createdAt !== session.createdAt || session.durable !== true) {
          throw new Error(`Original receipt manager ${manager.agentId} has no matching trusted retained native binding; its session is preserved`);
        }
        const precedingTurn = o.database.terminalPushCoordinatorTurns(o.state.id).filter(entry => entry.agentId === manager.agentId).at(-1);
        const previousInvocationId = precedingTurn?.invocationId ?? binding.invocationId;
        const previousRuntimePath = precedingTurn?.runtimePath ?? binding.runtimePath;
        const evidence = await this.stopped(precedingTurn ? { ...precedingTurn, executionContext: this.context(precedingTurn) } : binding);
        await o.wait(); o.assertCurrent(); o.signal.throwIfAborted();
        const invocationId = `inv_${randomUUID().replaceAll("-", "")}`;
        const runtimePath = await o.storage.invocationRuntimePath(o.state.id, invocationId);
        const capability = randomUUID();
        const turn = o.database.beginTerminalPushCoordinator({ projectId: o.state.id, incidentId: incident.id,
          level: incident.level, agentId: manager.agentId, invocationId, runtimePath, worktreePath: binding.worktreePath,
          previousInvocationId, previousRuntimePath,
          ...(binding.invocationId === previousInvocationId ? { previousNativeBindingRequestId: `agent-native-binding:${binding.invocationId}` } : {}),
          ...(incident.userResponse ? { userResponseRequestId: incident.userResponse.requestId } : {}),
          capabilityHash: createHash("sha256").update(capability).digest("hex"),
          allowUserIntervention: manager.role === "main" && o.state.orchestration.allowUserIntervention !== false,
          residentStopConfirmed: true, evidence });
        if (!turn) throw new Error("Receipt coordination waits for the existing native owner; no business work was dispatched");
        await o.publish();
        await this.run(incident, turn, capability);
      }
    }
  }

  private async run(incident: TerminalPushCoordinationIncident, turn: TerminalPushCoordinatorTurn, capability: string): Promise<void> {
    const o = this.options;
    const manager = incident.coordinators[turn.level];
    const previous = o.database.terminalPushCoordinatorTurns(o.state.id).filter(entry => entry.agentId === turn.agentId && entry.invocationId !== turn.invocationId).at(-1);
    const facts = o.database.authoritativeWorkflowFiles(o.state.id).currentState;
    const sources = new AgentContextSources();
    const assignment = [
      "You are awake in your retained session only to coordinate this original Agent's unresolved receipt. Read the actual facts and its existing handoff; do not redo its successful business work.",
      `Your current role is ${manager.role}. Incident=${incident.id}; original Agent=${incident.agentId}; execution=${incident.executionId}; operation=${incident.operationId}; level=${incident.level}.`,
      sources.record("receipt-incident", "Current receipt incident and original hierarchy", incident),
      sources.fields("receipt-current-state", "Facts related to this exact unresolved execution/operation",
        receiptContextFacts(facts as unknown as Record<string, unknown>, incident), "current"),
      sources.record("receipt-state", "Complete project snapshot (only if related facts and formal state queries are insufficient)", facts, "current"),
      `Use coordinate_agent_receipt for this exact incident to request one read-only retry or, as Leader, escalate to your direct parent. ${turn.allowUserIntervention
        ? "Only global Main with this grant can use request_user."
        : "User intervention is disabled for this turn. Do not call request_user or ask the user for a decision; report the actual technical blocker if no authorized recovery remains."} You decide; the system only transports your accepted action after your own finish, actual output and native Stop.`,
      "Call finish_task with your own summary/memory, then return your actual handoff. Missing mechanisms cause a finite original-session wake, never a system-authored decision.",
      ...(incident.userResponse ? [`The user answered your exact previous request:\n${incident.userResponse.response}\n${sources.record("receipt-user-response", "User response receipt", incident.userResponse, "current")} Your original receipt/automatic budget is unchanged.`] : []),
      ...(previous ? [`${sources.record("receipt-previous-turn", "Preceding coordination facts and accepted memory", previous)}; memory is under runtime/${previous.invocationId}/terminal-push-coordination/Memory.md.`] : [])
    ].join("\n\n");
    const key = `receipt-coordinator:${turn.invocationId}`;
    let handle: CollaborationResidentHandle | undefined;
    try {
      const inbox = await o.storage.writeInbox(o.state, turn.agentId, turn.invocationId, assignment);
      const inputs = await o.inputs(turn.agentId, turn.invocationId, inbox, turn.runtimePath);
      if (inputs.workspacePath !== turn.worktreePath) throw new Error("Receipt manager preparation changed its retained native workspace");
      const context = this.context(turn);
      const scope = { incidentId: incident.id, level: turn.level, coordinatorEpoch: turn.coordinatorEpoch,
        role: manager.role, canRequestUser: turn.allowUserIntervention };
      const fallback: AgentRunRequest = { project: structuredClone(o.state), purpose: "workflow", agent: turn.agentId,
        kind: turn.agentId === "main" ? "main" : "worker", permission: "workspace", invocationId: turn.invocationId,
        projectPath: inputs.projectPath, workspacePath: inputs.workspacePath, inboxPath: inputs.inboxPath,
        runtimePath: turn.runtimePath, schemaPath: "", skillPaths: [], autoSkillPaths: [], availableSkillPaths: [],
        executionContext: context, sessionContinuity: "strict", terminalPushCoordination: scope,
        resumeThreadId: o.state.agentSessionIds?.[turn.agentId] };
      const request = o.builder ? await o.builder.build({ state: o.state, agentId: turn.agentId, invocationId: turn.invocationId,
        executionContext: context, projectPath: inputs.projectPath, worktreePath: turn.worktreePath, inboxPath: inputs.inboxPath,
        runtimePath: turn.runtimePath, assignment, terminalPushCoordination: scope }) : fallback;
      o.decorate(request);
      request.contextSources = sources.sources;
      await o.wait(); o.assertCurrent(); o.signal.throwIfAborted();
      o.database.assertTerminalPushCoordinatorLaunch(turn);
      handle = await o.launcher.open({ request, inputs, executionRuntimePath: turn.runtimePath,
        filesystemAuthorityInput: await o.filesystem(), signal: o.signal, onTrace: o.trace(turn.agentId, turn.invocationId),
        onOpened: async () => { o.database.markTerminalPushCoordinatorOpened({ ...turn, nativeProcessOpened: true }); await o.publish(); },
        turnRequestFactory: o.turnRequestFactory(request),
        controlScope: { role: "receipt-coordinator", projectId: o.state.id, nodeRunId: context.nodeRunId,
          routeScopeId: "routeScopeId" in context ? context.routeScopeId! : "", leaderAgentId: turn.agentId,
          coordinatorEpoch: turn.coordinatorEpoch, terminalPushCoordination: scope },
        controlAuthorityFactory: terminalPushCoordinationControlAuthorityFactory({ state: o.state, database: o.database,
          storage: o.storage, coordination: turn, capability, signal: o.signal, assertCurrent: o.assertCurrent }) });
      o.register(key, turn, handle);
      const result = await o.submit(handle, { inputId: `receipt-coordination:${turn.invocationId}`, invocationId: turn.invocationId, prompt: assignment });
      if (result.handoff?.trim()) {
        const output = redactTrace(result.handoff).slice(0, 100_000);
        const handoffPath = await o.storage.writeHandoff(o.state, turn.agentId, turn.invocationId, output);
        o.database.recordTerminalPushCoordinatorResult({ ...turn, output, handoffPath }); await o.publish();
      }
      await o.wait();
    } catch (error) {
      if (!o.signal.aborted) o.database.appendEvent({ projectId: o.state.id, agentId: turn.agentId, invocationId: turn.invocationId,
        requestId: `receipt-coordinator-error:${turn.invocationId}`, type: "agent.terminal_push_coordinator.native.failed",
        payload: { incidentId: incident.id, reason: redactTrace(error instanceof Error ? error.message : String(error)).slice(0, 100_000) } });
      if (o.signal.aborted) throw error;
    } finally {
      // Keep the reservation and in-memory handle if native Stop fails.
      // A result or model end is never a physical process Stop proof.
      if (handle) { await handle.close(); this.recordStopped(turn, { residentClosed: true }); }
      else this.recordStopped(turn, await this.stopped({ ...turn, executionContext: this.context(turn) }));
      o.unregister(key); await o.publish();
    }
  }
}

/** Relationships, not recency, select this supplement's current evidence. */
export function receiptContextFacts(facts: Record<string, unknown>, incident: TerminalPushCoordinationIncident): Record<string, unknown> {
  const ids = new Set([incident.id, incident.executionId, incident.operationId, incident.originalInvocationId, incident.unresolvedRequestId]);
  const select = (value: unknown, depth = 0): unknown => {
    if (!value || typeof value !== "object" || depth > 6) return undefined;
    if (Array.isArray(value)) {
      const selected = value.map(entry => select(entry, depth + 1)).filter(entry => entry !== undefined);
      return selected.length ? selected : undefined;
    }
    if (Object.entries(value).some(([key, entry]) => (key === "id" || /(?:Id|ID)$/.test(key)) && typeof entry === "string" && ids.has(entry))) return value;
    const selected = Object.entries(value).flatMap(([key, entry]) => { const result = select(entry, depth + 1); return result === undefined ? [] : [[key, result]]; });
    return selected.length ? Object.fromEntries(selected) : undefined;
  };
  return Object.fromEntries(Object.entries(facts).flatMap(([key, value]) => {
    if (key === "stateRevision" || key === "workflowRevision" || key === "projectId") return [[key, value]];
    const selected = select(value);
    return selected === undefined ? [] : [[key, selected]];
  }));
}
