import { createHash } from "node:crypto";
import type { CollaborationResidentLauncher, CollaborationResidentOpenInput, CollaborationRuntimeCoordinator } from "../../../src/core/collaboration-runtime.js";
import type { AgentRunResult, ControlAction, ControlActionEnvelope } from "../../../src/core/types.js";
import { redactTrace } from "../../../src/core/utils.js";
import { ControlActionService } from "../../../src/core/orchestration-control-bridge.js";

type MainFixtureInput = Parameters<NonNullable<CollaborationResidentLauncher["decideRoute"]>>[0];
type MainFixtureDecision = Extract<Awaited<ReturnType<NonNullable<CollaborationResidentLauncher["decideRoute"]>>>,
  { targetNodeId: string }>;

/** Explicit requests by a simulated Main Agent, through the real tool bridge.
 * This fixture supplies the Agent's choice and memory; production must never
 * translate a natural return into a finish or orchestration tool call. */
export async function agentFixtureMainDecision(
  input: MainFixtureInput,
  decision: MainFixtureDecision,
  preparations: Array<{ action: ControlAction; callId: string }> = []
): Promise<MainFixtureDecision> {
  const authority = await input.open.controlAuthorityFactory!({ request: input.open.request, turn: input.turn });
  const service = new ControlActionService({ projectId: input.state.id, agent: "main", invocationId: input.turn.invocationId,
    stateVersion: authority.control.stateVersion, capability: authority.control.capability,
    capabilityHash: authority.control.capabilityHash, stagingPath: authority.control.stagingPath,
    revalidate: authority.revalidate });
  const action = decision.decisionAction ?? decision.intervention ??
    (decision.targetNodeId === "finish" && authority.control.canComplete
      ? { tool: "complete_project" as const, rationale: decision.output ?? "Main verified the terminal condition" }
      : { tool: "route_to_agent" as const, target: decision.targetNodeId,
        ...(decision.output ? { assignment: decision.output } : {}) });
  const actions: ControlActionEnvelope[] = [];
  actions.push(await service.stage(authority.control.capability, `fixture-main-finish-${input.turn.invocationId}`,
    { tool: "finish_task", summary: decision.output ?? "Main finished this coordination round" }));
  for (const preparation of preparations) {
    actions.push(await service.stage(authority.control.capability, preparation.callId, preparation.action));
  }
  actions.push(await service.stage(authority.control.capability, decision.decisionRequestId, action));
  return { ...decision, decisionAction: action, controlActions: actions };
}

/** Explicit choices by a simulated native Leader, never an exit hook. The
 * actual finish tool writes the Agent's memory before its group action. */
export async function agentFixtureLeaderResult(
  input: CollaborationResidentOpenInput,
  turn: { inputId: string; invocationId: string; prompt: string },
  result: AgentRunResult
): Promise<AgentRunResult> {
  if (input.request.executionContext?.role !== "leader" || !input.request.executionContext.groupRunId) {
    throw new Error("Leader fixture requires a real group management scope");
  }
  const authority = await input.controlAuthorityFactory!({ request: input.request, turn });
  const envelopes: ControlActionEnvelope[] = [];
  const actions: Array<{ action: ControlAction; callId: string }> = [
    { action: { tool: "finish_task", summary: redactTrace(result.handoff ?? "Finished this coordination round") },
      callId: `fixture-leader-finish-${turn.invocationId}` },
    ...(result.controlActions ?? []).filter((item) => item.action.tool !== "finish_task")
      .map((item) => ({ action: item.action, callId: item.callId }))
  ];
  for (const { action, callId } of actions) {
    const envelope: ControlActionEnvelope = { projectId: input.request.project.id, agent: input.request.agent,
      invocationId: turn.invocationId, callId, stateVersion: authority.control.stateVersion,
      capabilityHash: authority.control.capabilityHash, receivedAt: new Date().toISOString(), action };
    await authority.revalidate(envelope, envelopes);
    envelopes.push(envelope);
  }
  return { ...result, controlActions: envelopes };
}

/** Requests selected explicitly by a simulated native Agent. */
export async function agentFixtureRequests(
  input: CollaborationResidentOpenInput,
  turn: { inputId: string; invocationId: string; prompt: string },
  actions: ControlAction[]
): Promise<{ envelopes: ControlActionEnvelope[]; results: unknown[] }> {
  const authority = await input.controlAuthorityFactory!({ request: input.request, turn });
  const envelopes: ControlActionEnvelope[] = [];
  const results: unknown[] = [];
  for (const action of actions) {
    const envelope: ControlActionEnvelope = { projectId: input.request.project.id,
      agent: input.request.agent, invocationId: turn.invocationId,
      callId: `fixture-request-${createHash("sha256").update(turn.inputId).digest("hex").slice(0, 16)}-${envelopes.length}`,
      stateVersion: authority.control.stateVersion, capabilityHash: authority.control.capabilityHash,
      receivedAt: new Date().toISOString(), action };
    await authority.revalidate(envelope, envelopes);
    envelopes.push(envelope);
    results.push(action.tool === "finish_task" ? undefined : await authority.execute!(envelope));
  }
  return { envelopes, results };
}

/** A simulated native Agent, used only by runtime integration fixtures.
 * It explicitly requests tools through fresh Agent authority and inspects
 * their actual results. Production runtime must never perform this script. */
export async function agentFixtureDelivery(
  input: CollaborationResidentOpenInput,
  turn: { inputId: string; invocationId: string; prompt: string },
  result: AgentRunResult,
  coordinator: CollaborationRuntimeCoordinator,
  repairConflict?: (fact: unknown) => Promise<void>,
  completionMemory?: string,
  choice: { retainedPull?: boolean; closeConflictedPull?: boolean } = {}
): Promise<AgentRunResult> {
  const executionId = input.request.executionContext?.executionId;
  if (!executionId || input.request.executionContext?.role === "leader") {
    throw new Error("Native delivery fixture requires a business execution");
  }
  const authority = await input.controlAuthorityFactory!({ request: input.request, turn });
  const actions: ControlActionEnvelope[] = [];
  const call = async (action: ControlAction): Promise<any> => {
    const envelope: ControlActionEnvelope = { projectId: input.request.project.id,
      agent: input.request.agent, invocationId: turn.invocationId,
      callId: `fixture-git-${createHash("sha256").update(turn.inputId).digest("hex").slice(0, 16)}-${actions.length}`,
      stateVersion: authority.control.stateVersion, capabilityHash: authority.control.capabilityHash,
      receivedAt: new Date().toISOString(), action };
    await authority.revalidate(envelope, actions);
    actions.push(envelope);
    return action.tool === "finish_task" ? undefined : authority.execute!(envelope);
  };
  const base = await coordinator.database().executionPullBase(input.request.project.id, executionId);
  let pull;
  if (choice.retainedPull) {
    // The simulated Agent requests its original provider fact. Production
    // recovery never translates this choice into an automatic tool action.
    pull = await call({ tool: "github_get_pr" });
    if (!pull.providerNumber) throw new Error("Agent's retained PR is missing");
  } else {
    await call({ tool: "git_push", reason: "Publish the native Agent's committed result" });
    pull = await call({ tool: "github_create_pr", base,
      title: `Delivery by ${input.request.agent}`, body: result.handoff ?? "Native Agent delivery" });
  }
  let merged = await call({ tool: "github_merge_pr", providerNumber: pull.providerNumber, reason: "Integrate this Agent delivery" });
  if (merged.status === "conflicted" && repairConflict) {
    const preparation = await call({ tool: "git_prepare_conflict", reason: "Inspect the actual conflict before repairing it" });
    await repairConflict(preparation);
    await call({ tool: "git_push", reason: "Publish the Agent's repaired commit" });
    pull = await call({ tool: "github_create_pr", base, title: `Repaired delivery by ${input.request.agent}`,
      body: "Update the retained PR with the Agent's conflict repair" });
    merged = await call({ tool: "github_merge_pr", providerNumber: pull.providerNumber, reason: "Integrate the Agent's verified repair" });
  }
  if (merged.status === "conflicted" && choice.closeConflictedPull) {
    const closed = await call({ tool: "github_close_pr", providerNumber: pull.providerNumber,
      reason: "I abandon this conflicting canonical PR and report the blocker to the Leader" });
    if (closed.status !== "closed") throw new Error(`Agent PR close returned ${closed.status}`);
  }
  await call({ tool: "finish_task", summary: result.handoff ?? `Finished ${input.request.agent}`,
    ...(completionMemory ? { memory: completionMemory } : {}) });
  return { ...result, controlActions: [...(result.controlActions ?? []), ...actions] };
}
