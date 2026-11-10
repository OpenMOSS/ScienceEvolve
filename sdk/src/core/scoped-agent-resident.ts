import type { AgentRunResult } from "./types.js";
import { redactTrace } from "./utils.js";
import { superviseTask, supervisionError, supervisionHandoff, type TaskSupervisionInput } from "./task-supervision.js";
import type { CollaborationResidentLauncher, CollaborationResidentOpenInput } from "./collaboration-runtime.js";
import { ScopedAgentTurnFailure, type ScopedAgentTurnInput, type ScopedAgentTurnInvoker,
  type ScopedAgentTurnResult } from "./scoped-agent-execution.js";

export interface ScopedAgentResidentComposition {
  onHandle?(input: ScopedAgentTurnInput, handle: Awaited<ReturnType<CollaborationResidentLauncher["open"]>>): void | Promise<void>;
  onClosed?(input: ScopedAgentTurnInput): void | Promise<void>;
  onRetired?(input: ScopedAgentTurnInput, nativeStopConfirmed: boolean, reason?: string): void | Promise<void>;
  submit?(input: ScopedAgentTurnInput, handle: Awaited<ReturnType<CollaborationResidentLauncher["open"]>>,
    turn: { inputId: string; invocationId: string; prompt: string }): Promise<AgentRunResult>;
  missingActions?(input: ScopedAgentTurnInput): string[] | Promise<string[]>;
  /** Production reserves a durable budget before submitting any supplement.
   * A missing reservation means the original task has exhausted its budget. */
  reserveRepair?(input: ScopedAgentTurnInput, missing: string[]): number | undefined | Promise<number | undefined>;
  recordSupervision?(input: ScopedAgentTurnInput, outcome: Parameters<TaskSupervisionInput<AgentRunResult>["record"]>[0],
    missing: string[], reason?: string): void | Promise<void>;
  /** Retain only exact, live-broker-accepted receipts from a completed model
   * turn before rotating its capability for a same-task supplement. */
  retainTurnResult?(input: ScopedAgentTurnInput, result: AgentRunResult, inputId: string): void | Promise<void>;
  /** Reuse the production request builder, callbacks, filesystem compiler and
   * control capability factory. None are fabricated by the business Agent. */
  prepare(input: ScopedAgentTurnInput): Promise<CollaborationResidentOpenInput>;
  /** Formal server acceptance of the current native control receipts. */
  acceptResult(input: ScopedAgentTurnInput, result: AgentRunResult): Promise<{
    output: string; selectedWeakTarget?: string; reportHeadSha?: string
  }>;
}

/** Production native front door reused without a second model/session stack.
 * The management-only Leader is not involved in a worker's business turn. */
export class ResidentScopedAgentTurnInvoker implements ScopedAgentTurnInvoker {
  constructor(private readonly launcher: Pick<CollaborationResidentLauncher, "open">,
    private readonly composition: ScopedAgentResidentComposition) {}

  async invoke(input: ScopedAgentTurnInput): Promise<ScopedAgentTurnResult> {
    let open: CollaborationResidentOpenInput;
    try {
      open = await this.composition.prepare(input);
      this.assertOpenAuthority(input, open);
      if (typeof open.initialTask !== "string")
        throw new Error("Scoped task is missing its exact source-authored messages");
    } catch (error) {
      const diagnostic = nativeFailureDiagnostic(error);
      throw new ScopedAgentTurnFailure(`Scoped resident preparation failed before launch: ${diagnostic.reason}`, true, { cause: error }, {
        phase: "prepare", executionId: input.execution.id, agentId: input.execution.agentId,
        ownershipEpoch: input.execution.ownershipEpoch, invocationId: input.invocationId, ...diagnostic
      });
    }
    let opened = false;
    const priorOpened = open.onOpened;
    let handle: Awaited<ReturnType<CollaborationResidentLauncher["open"]>>;
    try {
      handle = await this.launcher.open({ ...open, onOpened: async () => {
        await priorOpened?.();
        input.onOpened();
        opened = true;
      } });
    } catch (error) {
      // An open rejection alone is not a process-stop proof. The supervisor
      // may have started native children before a later setup step failed.
      const diagnostic = nativeFailureDiagnostic(error);
      throw new ScopedAgentTurnFailure(`Scoped resident launch requires process reconciliation: ${diagnostic.reason}`, false, { cause: error }, {
        phase: "launch", executionId: input.execution.id, agentId: input.execution.agentId,
        ownershipEpoch: input.execution.ownershipEpoch, invocationId: input.invocationId,
        stopProof: "required", ...diagnostic
      });
    }
    let result: AgentRunResult | undefined;
    let failure: unknown;
    try {
      await this.composition.onHandle?.(input, handle);
      if (!opened) throw new Error("Native launcher omitted its process-open acknowledgement");
      input.signal?.throwIfAborted();
      const inputIdBase = `scoped:${input.execution.arrivalRequestId}:epoch:${input.execution.ownershipEpoch}`;
      // A coordinated report continuation does not spend an automatic repair
      // allowance. Its initial input and the next reserved supplement may
      // therefore share an attempt number, but must remain distinct inputs.
      const turn = { inputId: input.missingReportRepair ? `${inputIdBase}:missing-report-repair:${input.missingReportRepair.attempt}`
        : input.reportRepair ? `${inputIdBase}:report-repair:${input.reportRepair.attempt}` : inputIdBase,
        invocationId: input.invocationId, prompt: open.initialTask! };
      result = this.composition.submit ? await this.composition.submit(input, handle, turn) : await handle.submit(turn);
      await this.composition.retainTurnResult?.(input, result, turn.inputId);
      const supervised = await superviseTask({ key: `${input.execution.projectId}:${input.execution.id}`, value: result,
        signal: input.signal, inspect: async () => [...await this.composition.missingActions?.(input) ?? [],
          ...await handle.supervisionActions?.() ?? []],
        reserve: missing => this.composition.reserveRepair?.(input, missing),
        invoke: async (attempt, missing) => {
          const repair = { ...turn, inputId: `scoped:${input.execution.id}:supervision:${attempt}`,
            prompt: `Continue your original task in this session and directory. Remaining facts: ${missing.join("; ")}. Use the available tools and inspect their real results. Preserve confirmed operations and existing PRs. Do what you can and return the existing result and actual limitations if any remain.` };
          return this.composition.submit ? this.composition.submit(input, handle, repair) : handle.submit(repair);
        },
        accept: (value, attempt) => this.composition.retainTurnResult?.(input, value, `scoped:${input.execution.id}:supervision:${attempt}`),
        record: (outcome, missing, reason) => this.composition.recordSupervision?.(input, outcome, missing, reason)
      });
      result = { ...supervised.value, handoff: supervisionHandoff(supervised.value.handoff ?? "", supervised) };
    } catch (error) { failure = error; }
    let nativeStopConfirmed = false;
    let cleanupReason: string | undefined;
    try { await handle.close(); nativeStopConfirmed = true; await this.composition.onClosed?.(input); }
    catch (error) {
      cleanupReason = supervisionError(error);
      console.warn(`Scoped resident cleanup unconfirmed (${input.execution.id}): ${cleanupReason}`);
    }
    try { await this.composition.onRetired?.(input, nativeStopConfirmed, cleanupReason); }
    catch (error) { console.warn(`Scoped session retirement diagnostics unavailable: ${supervisionError(error)}`); }
    if (!result || failure !== undefined) {
      const reason = failure instanceof Error ? redactTrace(failure.message).trim().slice(0, 600) : "native turn returned no result";
      throw new ScopedAgentTurnFailure(`Scoped native turn failed: ${reason}`, nativeStopConfirmed, { cause: failure }, {
        phase: "turn", executionId: input.execution.id, agentId: input.execution.agentId,
        ownershipEpoch: input.execution.ownershipEpoch, invocationId: input.invocationId,
        stopProof: nativeStopConfirmed ? "confirmed" : "unconfirmed"
      });
    }
    try {
      const accepted = await this.composition.acceptResult(input, result);
      return { ...accepted, residentStopConfirmed: nativeStopConfirmed };
    } catch (error) {
      const reason = error instanceof Error ? error.message.trim().slice(0, 1_000) : "unknown control acceptance error";
      throw new ScopedAgentTurnFailure(`Scoped native result failed formal control acceptance: ${reason}`, nativeStopConfirmed, { cause: error }, {
        phase: "accept", executionId: input.execution.id, agentId: input.execution.agentId,
        ownershipEpoch: input.execution.ownershipEpoch, invocationId: input.invocationId,
        stopProof: nativeStopConfirmed ? "confirmed" : "unconfirmed"
      });
    }
  }

  private assertOpenAuthority(input: ScopedAgentTurnInput, open: CollaborationResidentOpenInput): void {
    const request = open.request;
    const context = request.executionContext;
    const scope = open.controlScope;
    const decisionBy = request.project.agents?.[input.execution.agentId]?.decisionBy === "main" ? "main" : "agent";
    const candidates = decisionBy === "agent" ? (input.workflow.routes[input.arrival.targetNodeId] ?? [])
      .filter((edge) => edge.kind === "weak").map((edge) => edge.target)
      : [];
    const savedSession = request.project.agentSessionIds?.[input.execution.agentId];
    if (request.project.id !== input.execution.projectId || request.project.orchestration.schemaVersion !== 3 ||
      request.agent !== input.execution.agentId || request.invocationId !== input.invocationId ||
      request.workspacePath !== input.execution.worktreePath || request.runtimePath !== input.runtimePath ||
      request.sessionContinuity !== "strict" || (savedSession && request.resumeThreadId !== savedSession) ||
      !request.onDurableSessionStarted || !context || context.role !== "delivery" ||
      context.executionId !== input.execution.id || context.ownershipEpoch !== input.execution.ownershipEpoch ||
      context.groupRunId !== input.groupRun.id || context.executionWorktree !== input.execution.worktreePath ||
      open.executionRuntimePath !== input.runtimePath || scope?.role !== "scoped-agent" ||
      scope.projectId !== input.execution.projectId || scope.nodeRunId !== context.nodeRunId ||
      scope.groupRunId !== input.groupRun.id || scope.executionId !== input.execution.id ||
      scope.agentId !== input.execution.agentId || scope.ownershipEpoch !== input.execution.ownershipEpoch ||
      scope.decisionBy !== decisionBy || JSON.stringify(scope.candidates) !== JSON.stringify(candidates) ||
      !open.controlAuthorityFactory || request.control !== undefined) {
      throw new Error("Scoped native request changed its fixed Agent/session, invocation or local control authority");
    }
  }
}

/** The original Agent/Leader needs the actual technical cause, not only the
 * outer lifecycle message. Preserve bounded facts without choosing a retry,
 * altering the session, or claiming that an unsuccessful launch has stopped. */
function nativeFailureDiagnostic(error: unknown): {
  reason: string;
  causeChain: Array<{ causeClass: string; errorCode?: string; redactedMessage: string }>;
} {
  const seen = new Set<unknown>();
  const causeChain: Array<{ causeClass: string; errorCode?: string; redactedMessage: string }> = [];
  let current = error;
  while (current !== undefined && current !== null && causeChain.length < 5 && !seen.has(current)) {
    seen.add(current);
    const code = current instanceof Error && "code" in current && typeof current.code === "string"
      ? current.code : undefined;
    causeChain.push({ causeClass: current instanceof Error ? redactTrace(current.name).slice(0, 200) : "NonErrorFailure",
      ...(code ? { errorCode: redactTrace(code).slice(0, 200) } : {}),
      redactedMessage: redactTrace(current instanceof Error ? current.message
        : typeof current === "string" ? current : "Unknown native failure").trim().slice(0, 600) });
    current = current instanceof Error ? current.cause : undefined;
  }
  return { reason: causeChain.map((cause) => cause.redactedMessage).filter(Boolean).join(" -> ").slice(0, 1_000)
    || "Unknown native failure", causeChain };
}
