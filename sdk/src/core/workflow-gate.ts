import { isDeepStrictEqual } from "node:util";
import type { AgentOrchestrationTemplate } from "./types.js";
import { createHash } from "node:crypto";
import { z } from "zod";
import { gateMatchingTargets, workflowGateSchema, type WorkflowGate, type GateOrigin, type GateRun } from "./internal/shared/workflow-gate.js";
import type { HarnessEvent } from "./harness-runtime/contracts.js";

export { workflowGateSchema, gateMatchingTargets } from "./internal/shared/workflow-gate.js";
export type { WorkflowGate, GateOrigin, GateRun } from "./internal/shared/workflow-gate.js";
const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(value, (_key, item) => item && typeof item === "object" && !Array.isArray(item)
  ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item)).digest("hex");
const quote = (text: string) => `'${text.replace(/'/g, `'"'"'`)}'`;
export interface GateJournal {
  read(id: string): Promise<GateRun | undefined>;
  save(run: GateRun, expectedVersion: number): Promise<GateRun>;
}
export function gateRunId(origin: Pick<GateOrigin, "projectId" | "sourceRunId" | "scopeId">, gateId: string): string {
  return `gate_${digest([origin.projectId, origin.scopeId ?? null, origin.sourceRunId, gateId])}`;
}
export function gateCodeCommand(gate: WorkflowGate, origin: GateOrigin): string {
  if (gate.verifier.kind !== "code") throw new Error("Only a code Gate has a native command");
  if (!origin.agentId || !origin.executionId || !origin.invocationId || !origin.workspacePath)
    throw new Error("Code Gate requires the actual predecessor's task, invocation and workspace");
  const input = Buffer.from(JSON.stringify(origin.input)).toString("base64");
  const flag = gate.verifier.interpreter === "node" ? "-e" : "-c";
  return `cd -- ${quote(origin.workspacePath)} && SCIENCEEVOLVE_GATE_INPUT_BASE64=${quote(input)} ${gate.verifier.interpreter} ${flag} ${quote(gate.verifier.code)}`;
}
export function prepareGateRun(gate: WorkflowGate, targets: string[], origin: GateOrigin): GateRun {
  const executorAgentId = gate.verifier.kind === "code" ? origin.agentId : gate.verifier.agentId;
  if (!executorAgentId) throw new Error("Gate requires an actual configured executor");
  const timestamp = new Date().toISOString();
  return { id: gateRunId(origin, gate.id), version: 1, gate: workflowGateSchema.parse(gate), targets: [...targets],
    configurationHash: digest({ gate, targets }), inputHash: digest(origin.input), origin: structuredClone(origin), status: "prepared",
    executorAgentId, decisionAgentId: gate.decisionAgentId ?? executorAgentId,
    ...(gate.verifier.kind === "code" ? { command: gateCodeCommand(gate, origin) } : {}), createdAt: timestamp, updatedAt: timestamp };
}
function nativeCommand(input: unknown): unknown {
  if (Array.isArray(input) && input.length === 3 && ["bash", "/bin/bash", "sh", "/bin/sh"].includes(String(input[0])) && ["-c", "-lc"].includes(String(input[1]))) return input[2];
  if (input && typeof input === "object" && !Array.isArray(input)) {
    const value = input as Record<string, unknown>;
    return nativeCommand(value.command ?? value.cmd);
  }
  return input;
}
function actualCommand(input: unknown, expected: string): boolean {
  const command = nativeCommand(input);
  return command === expected || ["bash", "/bin/bash", "sh", "/bin/sh"].some(shell =>
    ["-c", "-lc"].some(flag => command === `${shell} ${flag} ${quote(expected)}`));
}
const name = z.string().min(1).max(128);
export const gateRequestSchema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("list") }).strict(),
  z.object({ operation: z.literal("prepare"), gateId: name }).strict(),
  z.object({ operation: z.literal("read"), gateId: name }).strict(),
  z.object({ operation: z.literal("report"), gateId: name, result: z.unknown().refine(value => value !== undefined, "Gate result is required") }).strict(),
  z.object({ operation: z.literal("choose"), gateId: name, target: name }).strict()
]);

/** Native tools execute code under the original Harness permission. This
 * observer only captures actual tool output; it never launches the verifier. */
export class WorkflowGateSession {
  private tail: Promise<unknown> = Promise.resolve();
  constructor(readonly origin: GateOrigin, readonly gates: Array<{ gate: WorkflowGate; targets: string[] }>,
    private readonly journal: GateJournal,
    private readonly current: { agentId: string; invocationId: string },
    private readonly assertActive: () => Promise<void>) {}
  private serialized<T>(run: () => Promise<T>): Promise<T> {
    const next = this.tail.then(run, run); this.tail = next.then(() => {}, () => {}); return next;
  }
  private definition(gateId: string) {
    const entry = this.gates.find(entry => entry.gate.id === gateId);
    if (!entry) throw new Error(`Gate ${gateId} is not in this invocation's configured path`);
    return entry;
  }
  private async update(run: GateRun, change: Partial<GateRun>) {
    return this.journal.save({ ...run, ...change, version: run.version + 1, updatedAt: new Date().toISOString() }, run.version);
  }
  async bindChecker(gateId: string): Promise<GateRun> {
    return this.serialized(async () => {
      await this.assertActive();
      const run = await this.journal.read(gateRunId(this.origin, gateId));
      if (!run || run.gate.verifier.kind !== "agent" || run.executorAgentId !== this.current.agentId)
        throw new Error("Gate checker requires its configured Agent and original input");
      if (run.status !== "prepared") {
        if (run.checkerInvocationId === this.current.invocationId || ["result", "selected", "delivered", "error"].includes(run.status)) return run;
        throw new Error("Gate checker outcome is unknown; reconcile the original invocation before continuing");
      }
      return this.update(run, { status: "running", checkerInvocationId: this.current.invocationId });
    });
  }
  async request(value: unknown, callId: string): Promise<unknown> {
    const request = gateRequestSchema.parse(value);
    return this.serialized(async () => {
      await this.assertActive();
      if (request.operation === "list") return this.gates.map(({ gate, targets }) => ({ id: gate.id, name: gate.name,
        verifier: gate.verifier.kind, targets, hardRules: Boolean(gate.rules), decisionAgentId: gate.decisionAgentId }));
      const { gate, targets } = this.definition(request.gateId);
      const id = gateRunId(this.origin, gate.id);
      let run = await this.journal.read(id);
      if (request.operation === "prepare") {
        if (run) {
          if (run.status === "running") throw new Error(`Gate ${gate.id} execution outcome is unknown; inspect its retained call, do not rerun it`);
          return run;
        }
        if (gate.verifier.kind === "code" && this.current.agentId !== this.origin.agentId) throw new Error("Code Gate must run in its actual predecessor's task");
        run = prepareGateRun(gate, targets, this.origin);
        return this.journal.save(run, 0);
      }
      if (!run) throw new Error(`Gate ${gate.id} has no bound execution; prepare it first`);
      if (request.operation === "read") return run;
      if (request.operation === "report") {
        if (run.gate.verifier.kind !== "agent") throw new Error("Self-reported output cannot replace an actual code Gate tool result");
        if (this.current.agentId !== run.executorAgentId || run.checkerInvocationId !== this.current.invocationId)
          throw new Error("Gate result belongs to a different checker invocation");
        if (run.evidence?.callId === callId && digest(run.result) === digest(request.result)) return run;
        if (run.status !== "running") throw new Error(`Gate ${gate.id} is not awaiting this checker's result`);
        return this.acceptResult(run, request.result, { invocationId: this.current.invocationId, callId, eventId: `gate-report:${callId}` });
      }
      if (this.current.agentId !== run.decisionAgentId) throw new Error("Only the configured Gate decision Agent may choose its outgoing path");
      if (run.status === "selected" || run.status === "delivered") {
        if (run.selectedTarget !== request.target) throw new Error("Gate path was already selected; its executed decision cannot be replaced");
        return run;
      }
      if (run.status !== "result" || !run.evidence) throw new Error(`Gate ${gate.id} has no confirmed execution result`);
      const matches = gateMatchingTargets(run.gate, run.targets, run.result);
      if (!matches.includes(request.target)) throw new Error(`Gate ${gate.id} rejects path ${request.target}; eligible paths: ${matches.join(", ")}`);
      return this.update(run, { status: "selected", selectedTarget: request.target, selectedByInvocationId: this.current.invocationId });
    });
  }
  private async acceptResult(run: GateRun, result: unknown, evidence: NonNullable<GateRun["evidence"]>) {
    if (Buffer.byteLength(JSON.stringify(result)) > 64_000) return this.update(run, { status: "error", error: "Gate result exceeds 64 KB", evidence });
    try { gateMatchingTargets(run.gate, run.targets, result); }
    catch (error) { return this.update(run, { status: "error", result, evidence, error: (error as Error).message }); }
    const automatic = !run.gate.rules && run.targets.length === 1;
    return this.update(run, { status: automatic ? "selected" : "result", result, evidence,
      ...(automatic ? { selectedTarget: run.targets[0] } : {}) });
  }
  async observe(event: HarnessEvent): Promise<void> {
    if (!event.tool || !["tool.started", "tool.completed", "tool.failed"].includes(event.kind) ||
      event.invocationId !== this.current.invocationId ||
      !(event.tool.toolType === "shell" || ["bash", "shell", "exec_command", "shell_command"].includes(event.tool.name))) return;
    await this.serialized(async () => {
      for (const { gate } of this.gates) {
        const run = await this.journal.read(gateRunId(this.origin, gate.id));
        if (!run?.command || run.executorAgentId !== this.current.agentId) continue;
        const matches = actualCommand(event.tool!.input, run.command);
        const retained = run.evidence?.callId === event.tool!.callId && run.evidence.invocationId === event.invocationId;
        if (!matches && !retained) continue;
        if (event.kind === "tool.started") {
          if (run.status !== "prepared") continue;
          await this.update(run, { status: "running", evidence: { invocationId: event.invocationId,
            callId: event.tool!.callId, eventId: event.eventId, harnessId: event.harnessId } });
          continue;
        }
        if (run.status !== "running" || !retained) continue;
        const evidence = { invocationId: event.invocationId, callId: event.tool!.callId, eventId: event.eventId,
          harnessId: event.harnessId, ...(event.tool!.outputPreview === undefined ? {} : { outputHash: digest(event.tool!.outputPreview) }) };
        if (event.kind === "tool.failed" || event.tool!.isError || event.tool!.truncated || event.tool!.outputPreview === undefined) {
          await this.update(run, { status: "error", evidence, error: event.tool!.truncated ? "Gate tool output is truncated" :
            event.tool!.isError || event.kind === "tool.failed" ? `Gate tool failed: ${event.tool!.outputPreview ?? "no output"}` : "Gate tool returned no output" });
          continue;
        }
        let result: unknown;
        try { result = run.gate.verifier.kind === "code" && run.gate.verifier.output === "json"
          ? JSON.parse(event.tool!.outputPreview) : event.tool!.outputPreview; }
        catch { await this.update(run, { status: "error", evidence, error: "Gate tool did not return valid JSON" }); continue; }
        await this.acceptResult(run, result, evidence);
      }
    });
  }
}

export function requireGateChoice(run: GateRun | undefined, origin: Pick<GateOrigin, "projectId" | "sourceRunId" | "scopeId">, gateId: string): GateRun & { selectedTarget: string } {
  if (!run || run.id !== gateRunId(origin, gateId) || !["selected", "delivered"].includes(run.status) || !run.selectedTarget || !run.evidence)
    throw new Error(`Gate ${gateId} has no confirmed result and selected path for this execution${run?.error ? `: ${run.error}` : ""}`);
  if (run.inputHash !== digest(run.origin.input) || run.configurationHash !== digest({ gate: run.gate, targets: run.targets }) ||
    !gateMatchingTargets(run.gate, run.targets, run.result).includes(run.selectedTarget)) throw new Error("Gate execution binding is inconsistent");
  return run as GateRun & { selectedTarget: string };
}
export function gateFeedback(run: GateRun): string {
  return `Gate ${run.gate.name} (${run.id})\nOriginal input: ${JSON.stringify(run.origin.input)}\nVerifier result: ${JSON.stringify(run.result)}\nEvidence: ${JSON.stringify(run.evidence)}\nSelected path: ${run.selectedTarget}`;
}

/** Gate standards and outgoing paths are user-owned, including during an
 * otherwise authorized Main workflow edit. */
export function assertAgentGateConfigurationUnchanged(before: AgentOrchestrationTemplate, after: AgentOrchestrationTemplate): void {
  const bindings = (graph: AgentOrchestrationTemplate) => (graph.gates ?? []).map(gate => ({ gate,
    routes: (gate.groupId ? graph.scopedWorkflow?.groups.find(group => group.id === gate.groupId)?.workflow.routes : graph.routes)?.[gate.id] }));
  if (!isDeepStrictEqual(bindings(before), bindings(after))) throw new Error("Only the user may change Gate checks, rules, decision Agents or outgoing paths");
}
