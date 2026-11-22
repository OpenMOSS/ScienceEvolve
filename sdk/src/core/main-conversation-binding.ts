import type { AsyncCollaborationStateStore } from "./collaboration-state/database-worker.js";
import { sameDurableSession } from "./control-result-receipts.js";
import type { SessionRef } from "./harness-runtime/contracts.js";
import { nativeMainMessageText, userReplySchema } from "./main-assistance.js";
import { collaborationSessionBelongsToAgent, collaborationSessionKey } from "./internal/shared/collaboration-session-key.js";
import { usesCollaborationScheduler } from "./internal/shared/project-runtime-status.js";
import type { AgentRunRequest, ProjectState } from "./types.js";

/** A side turn resumes the same Main memory as the currently configured workflow. */
export async function prepareConversationSession(state: ProjectState, request: AgentRunRequest, database: Pick<AsyncCollaborationStateStore, "latestAgentNativeSessionBinding">): Promise<string> {
  const scoped = state.orchestration.schemaVersion === 3;
  const requestKey = collaborationSessionKey("main", request.executionContext, scoped);
  let key = "main";
  let lastOpened: SessionRef | undefined;
  if (!scoped && usesCollaborationScheduler(state)) {
    const binding = await database.latestAgentNativeSessionBinding(state.id, "main");
    if (binding) {
      key = collaborationSessionKey("main", binding.executionContext);
      lastOpened = binding.session;
    } else if (!state.agentSessions?.main && !state.agentSessionIds?.main) {
      const candidates = [...new Set([...Object.keys(state.agentSessions ?? {}), ...Object.keys(state.agentSessionIds ?? {})])]
        .filter(id => collaborationSessionBelongsToAgent(id, "main") && id !== requestKey);
      if (candidates.length > 1) throw new Error("Cannot establish which retained Main session owns this conversation");
      if (candidates.length === 1) key = candidates[0];
    }
  }
  const saved = state.agentSessions?.[key];
  if (saved && lastOpened && !sameDurableSession(saved, lastOpened))
    throw new Error("The saved Main session disagrees with its last native open");
  const session = saved ?? lastOpened, legacyId = state.agentSessionIds?.[key], meta = state.agentSessionMeta?.[key];
  const project = request.project;
  project.agentSessions = { ...project.agentSessions };
  project.agentSessionIds = { ...project.agentSessionIds };
  project.agentSessionMeta = { ...project.agentSessionMeta };
  for (const target of new Set([requestKey, "main"])) {
    if (session) project.agentSessions[target] = session; else delete project.agentSessions[target];
    if (legacyId) project.agentSessionIds[target] = legacyId; else delete project.agentSessionIds[target];
    if (meta) project.agentSessionMeta[target] = meta; else delete project.agentSessionMeta[target];
  }
  request.resumeThreadId = legacyId;
  return key;
}

export function bindMainConversation(request: AgentRunRequest, database: AsyncCollaborationStateStore,
  isRunning: () => boolean, messageId?: string, onOffered?: () => void): void {
  if (request.agent !== "main" || request.kind !== "main") throw new Error("User messages require the project's Main");
  const projectId = request.project.id, invocationId = request.invocationId;
  let actual: SessionRef | undefined;
  const retained = messageId && request.project.agentSessions?.main;
  const verifySession = (session: SessionRef) => {
    if (retained && !sameDurableSession(retained, session)) throw new Error("Main conversation did not resume its original native session");
  };
  const started = request.onDurableSessionStarted, opened = request.onResidentNativeOpened;
  request.onDurableSessionStarted = async (session, legacyId) => {
    verifySession(session); await started?.(session, legacyId); actual = session;
  };
  request.onResidentNativeOpened = async binding => {
    verifySession(binding.session); await opened?.(binding); actual = binding.session;
  };
  const observe = async (event: Record<string, unknown>, session = actual) => {
    if (!session?.durable || (messageId && !actual) || (actual && !sameDurableSession(actual, session)) ||
      !nativeMainMessageText(invocationId, session, event)?.includes("User message chat_")) return;
    await database.observeMainConversationInput(projectId, invocationId, session, event);
  };
  const native = request.onNativeUserInput, official = request.onOfficialHarnessEvent, live = request.onLiveHarnessEvent;
  request.onNativeUserInput = async (event, session) => { await native?.(event, session); await observe(event, session); };
  request.onOfficialHarnessEvent = async (event, session) => { await official?.(event, session); await observe(event, session); };
  request.onLiveHarnessEvent = async event => { await live?.(event); await observe(event as unknown as Record<string, unknown>); };
  const received = request.onWorkflowAdjustmentInputReceived;
  request.onWorkflowAdjustmentInputReceived = async (event, session, inputId) => {
    await received?.(event, session, inputId);
    await observe(event, session);
  };
  if (!messageId) {
    request.onPendingMainAssistance = async (inputId, session = actual) => {
      if (!isRunning() || !session?.durable || actual && !sameDurableSession(actual, session)) return "";
      const text = await database.offerMainConversation(projectId, invocationId, inputId, session);
      if (text) onOffered?.();
      return text;
    };
    request.onMainAssistanceDeliveryFailed = async (inputId, reason) => {
      await database.closeMainConversations(projectId, reason, { invocationId, inputId });
    };
  }
  request.onReplyToUser = async (id, answer, callId) => {
    const input = userReplySchema.parse({ messageId: id, text: answer });
    if (!isRunning() || (messageId && id !== messageId)) throw new Error("This Main invocation cannot reply to that user message");
    const reply = await database.replyToProjectUser(projectId, id, invocationId, input.text, callId);
    return { messageId: reply.id, status: reply.status };
  };
  if (request.control) request.control.mainConversation = messageId ? "turn" : "inbox";
}
