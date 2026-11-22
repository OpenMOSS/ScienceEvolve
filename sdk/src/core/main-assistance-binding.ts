import { enqueueMainAssistance, mainAssistanceRequestSchema, observeAssistanceInput, prepareAssistanceDelivery,
  type MainAssistanceJournal, type MainAssistanceOrigin } from "./main-assistance.js";
import type { AgentRunRequest } from "./types.js";
import type { SessionRef } from "./harness-runtime/contracts.js";

/** The caller cannot choose its project, task, scope, Agent or native Session. */
export function bindMainAssistance(request: AgentRunRequest, taskId: string, journal: MainAssistanceJournal,
  assertActive: () => Promise<void>, wake: () => void): void {
  if (request.agent === "main") return;
  let actualSession: SessionRef | undefined;
  const origin = (session = actualSession): MainAssistanceOrigin => {
    if (!session) throw new Error("Main assistance requires the actually opened original Session");
    return { projectId: request.project.id, agentId: request.agent, taskId, invocationId: request.invocationId,
      session: structuredClone(session), ...(request.executionContext ? { executionContext: structuredClone(request.executionContext) } : {}) };
  };
  const priorSession = request.onDurableSessionStarted;
  request.onDurableSessionStarted = async (session, legacyId) => { await priorSession?.(session, legacyId); actualSession = session; };
  const priorOpen = request.onResidentNativeOpened;
  request.onResidentNativeOpened = async binding => { await priorOpen?.(binding); actualSession = binding.session; };
  const observe = async (event: Record<string, unknown>, session?: SessionRef) => {
    if (session) actualSession = session;
    if (actualSession) await observeAssistanceInput(journal, request.project.id, request.agent, request.invocationId, actualSession, event);
  };
  const priorInput = request.onNativeUserInput;
  request.onNativeUserInput = async (event, session) => { await priorInput?.(event, session); await observe(event, session); };
  const priorLive = request.onLiveHarnessEvent;
  request.onLiveHarnessEvent = async event => { await priorLive?.(event); await observe(event as unknown as Record<string, unknown>); };
  const priorReceived = request.onWorkflowAdjustmentInputReceived;
  request.onWorkflowAdjustmentInputReceived = async (event, session, inputId) => { await priorReceived?.(event, session, inputId); await observe(event, session); };
  request.onMainAssistanceRequest = async (value, callId) => {
    await assertActive();
    const input = mainAssistanceRequestSchema.parse(value), current = origin();
    if (input.operation === "request") {
      const saved = await enqueueMainAssistance(journal, current, input, callId); wake();
      return { requestId: saved.id, status: saved.status, mainReceived: Boolean(saved.main?.receivedAt),
        replied: Boolean(saved.reply), delivery: saved.delivery?.status, message: "Request saved; continue the original task. Pending assistance does not block handoff." };
    }
    if (input.operation === "reply") throw new Error("Only the bound Main assistance invocation may reply");
    const records = (await journal.list(current.projectId)).filter(item => item.origin.agentId === current.agentId && item.origin.taskId === current.taskId);
    if (input.operation === "list") return records;
    const record = records.find(item => item.id === input.requestId);
    if (!record) throw new Error("Main assistance request belongs to another task or does not exist");
    return record;
  };
  request.onPendingMainAssistance = async (inputId, session) => {
    if (session) actualSession = session;
    if (!(await journal.list(request.project.id)).some(item => item.origin.taskId === taskId && item.reply && item.delivery?.status === "queued")) return "";
    // The journal checks the exact live logical task atomically with the offer.
    // A closed task simply has no input boundary; it must not fail an unrelated tool.
    return prepareAssistanceDelivery(journal, origin(session ?? actualSession), inputId);
  };
  request.onMainAssistanceDeliveryFailed = async (inputId, reason) => {
    await journal.failDelivery(origin(), inputId, reason);
  };
  if (request.control) request.control.mainAssistance = "request";
  request.contextSources = [...(request.contextSources ?? []), { key: "main-assistance", label: "Asynchronous Main assistance", records: [
    { tool: "main_assistance", instructions: "Use operation=request with a stable requestId and your question to ask Main directly. Continue your original task. A saved request is not a reply or a routing decision. Replies are delivered at supported native input boundaries; list/read retain their actual status. Do not wait unless your own work depends on the answer." }
  ] }];
}
