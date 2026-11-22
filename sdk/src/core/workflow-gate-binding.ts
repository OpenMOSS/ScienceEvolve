import { promises as fs } from "node:fs";
import { WorkflowGateSession, prepareGateRun, gateRunId, type GateJournal, type GateOrigin, type GateRun } from "./workflow-gate.js";
import type { AgentRunRequest, WorkflowEdgeMap } from "./types.js";

export async function bindWorkflowGates(request: AgentRunRequest, journal: GateJournal, origin: GateOrigin,
  routes: WorkflowEdgeMap, active?: { run: GateRun; stage: "check" | "decision" }): Promise<void> {
  const definitions = request.project.orchestration.gates ?? [];
  if (!definitions.length) return;
  const ids = new Set((routes[origin.nodeId] ?? []).map(edge => edge.target));
  const available = definitions.filter(gate => ids.has(gate.id));
  const sessions = new Map<string, WorkflowGateSession>();
  const authority = async () => {
    if (!request.onProjectStateRequest) throw new Error("Gate requires the original task's live invocation authority");
    await request.onProjectStateRequest({ operation: "list" });
  };
  for (const gate of available) {
    const session = new WorkflowGateSession(origin, [{ gate, targets: (routes[gate.id] ?? []).map(edge => edge.target) }], journal,
      { agentId: request.agent, invocationId: request.invocationId }, authority);
    // Bind inputs and configuration before the native turn; no code or model
    // is executed here and an unselected candidate Gate never activates.
    const existing = await journal.read(gateRunId(origin, gate.id));
    if (!existing) await journal.save(prepareGateRun(gate, (routes[gate.id] ?? []).map(edge => edge.target), origin), 0);
    sessions.set(gate.id, session);
  }
  if (active) {
    const session = new WorkflowGateSession(active.run.origin, [{ gate: active.run.gate, targets: active.run.targets }], journal,
      { agentId: request.agent, invocationId: request.invocationId }, authority);
    sessions.set(active.run.gate.id, session);
  }
  if (!sessions.size) return;
  request.onWorkflowGateRequest = async (value, callId) => {
    if (active?.stage === "check") await sessions.get(active.run.gate.id)!.bindChecker(active.run.gate.id);
    if (value && typeof value === "object" && (value as { operation?: unknown }).operation === "list") {
      return (await Promise.all([...sessions.values()].map(session => session.request(value, callId)))).flat();
    }
    const session = sessions.get(String((value as { gateId?: unknown })?.gateId));
    if (!session) throw new Error("Gate is outside this invocation's actual input and configured path");
    return session.request(value, callId);
  };
  const prior = request.onLiveHarnessEvent;
  request.onLiveHarnessEvent = async event => {
    for (const session of sessions.values()) await session.observe(event);
    await prior?.(event);
  };
  if (request.control) request.control.workflowGate = true;
  request.contextSources = [...(request.contextSources ?? []), { key: "workflow-gates", label: "Configured Workflow Gate checks", records: [
    { instructions: "When your chosen path enters a code Gate, call workflow_gate list/read and execute its exact prepared command through your native Shell before returning this task. Inspect the captured result and choose a configured path. Unselected Gate candidates do not require execution. A Gate is an explicit Workflow check; missing or unknown execution evidence cannot be replaced by a score in your handoff.",
      gates: [...sessions.keys()] },
    ...(active ? [{ gate: active.run.gate, input: active.run.origin.input, result: active.run.result, evidence: active.run.evidence,
      stage: active.stage, instructions: active.stage === "check" ? "You are the configured Gate checker. Use your normal tools, then report your actual result through workflow_gate. Choose a path when you are also its decision Agent." : "Choose one configured outgoing path from the retained actual result. Do not rerun or replace the check." }] : [])
  ] }];
}

export async function workflowGateInput(request: AgentRunRequest): Promise<unknown> {
  return { requirement: request.project.requirement, task: await fs.readFile(request.inboxPath, "utf8") };
}
