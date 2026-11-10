import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import type { CollaborationStateStore as CollaborationStateDatabase } from "./collaboration-state/database-worker.js";
import type { CollaborationEvent } from "./collaboration-state/contracts.js";
import { sameDurableSession, type ControlResultContext } from "./control-result-receipts.js";
import { validateSessionRef } from "./harness-runtime/session-ref.js";
import { OperationStoreViolationError } from "./collaboration-git/errors.js";
import { workflowAdjustmentRuntimeImpact } from "./workflow-adjustment-impact.js";
import type { WorkflowAdjustmentRecord, WorkflowAdjustmentTransition } from "./workflow-adjustments.js";
import { redactTrace } from "./utils.js";
import type { AgentContextSource } from "./agent-context-index.js";

export interface WorkflowAdjustmentNotificationFact {
  eventId: string;
  eventRequestId: string;
  record: WorkflowAdjustmentRecord;
  transition: WorkflowAdjustmentTransition;
}
export interface WorkflowAdjustmentNotification {
  schemaVersion: 1;
  context: ControlResultContext;
  inputId: string;
  facts: WorkflowAdjustmentNotificationFact[];
  text: string;
}
const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
export const workflowNotificationRequest = (context: ControlResultContext, inputId: string) =>
  `workflow-adjustment-notification:${digest([context.projectId, context.invocationId, inputId])}`;
export function workflowNotificationReceipt(context: ControlResultContext, eventId: string): string {
  const s = context.session;
  return `workflow-adjustment-notification-received:${digest([context.projectId, context.agentId, eventId,
    s.schemaVersion, s.harnessId, s.adapterVersion, s.generation, s.nativeId, s.durable, s.createdAt])}`;
}
export function assertWorkflowNotificationContext(context: ControlResultContext, inputId?: string): void {
  if (!context.projectId || !context.agentId || !context.invocationId ||
    !validateSessionRef(context.session).valid || !context.session.durable || inputId !== undefined && !inputId)
    throw new OperationStoreViolationError("Workflow notification requires its actual durable native Session and input identity");
}
export function sameWorkflowNotificationContext(left: ControlResultContext, right: ControlResultContext): boolean {
  return left.projectId === right.projectId && left.agentId === right.agentId && left.invocationId === right.invocationId &&
    sameDurableSession(left.session, right.session) && isDeepStrictEqual(left.executionContext, right.executionContext);
}
export function relevantWorkflowAdjustmentNotification(fact: WorkflowAdjustmentNotificationFact, agentId: string): boolean {
  const { record } = fact;
  if (agentId === "main" || record.source.kind === "scoped_leader" && record.source.agentId === agentId) return true;
  if (fact.transition.status !== "applied") return false;
  const impact = workflowAdjustmentRuntimeImpact(record);
  if (impact.agentIds.has(agentId) || impact.rootNodeChanged({ kind: "agent", nodeId: agentId, agentId })) return true;
  return [record.baseSnapshot.orchestration, record.proposal.orchestration].some(graph =>
    graph.collaborations?.some(group => group.memberAgentIds.includes(agentId) && impact.groupChanged(group.id)) ||
    graph.scopedWorkflow?.groups.some(group => group.workflow.nodes.some(node => node.kind === "agent" && node.agentId === agentId &&
      impact.scopedNodeChanged(group.id, node.nodeId))));
}
export function buildWorkflowAdjustmentNotification(context: ControlResultContext, inputId: string,
  facts: WorkflowAdjustmentNotificationFact[], received: (eventId: string) => boolean): WorkflowAdjustmentNotification | undefined {
  assertWorkflowNotificationContext(context, inputId);
  const pending = facts.filter(fact => relevantWorkflowAdjustmentNotification(fact, context.agentId) && !received(fact.eventId));
  if (!pending.length) return undefined;
  return { schemaVersion: 1, context: structuredClone(context), inputId, facts: structuredClone(pending),
    text: workflowAdjustmentNotificationText(context.invocationId, inputId, pending) };
}

export function workflowAdjustmentNotificationText(invocationId: string, inputId: string, pending: WorkflowAdjustmentNotificationFact[]): string {
  const records = pending.map(({ eventId, record, transition }) => ({ eventId, requestId: record.requestId, source: record.source.kind,
    submittedAt: record.submittedAt, status: transition.status, changeCount: record.changes.length,
    currentVersion: record.currentVersion }));
  return redactTrace("ScienceEvolve configuration and Workflow update facts. This is a list of durable proposal results; open relevant details in source=workflow-updates before a consequential decision. " +
    "They do not grant additional tools or permissions, repeat a completed task, or resubmit a withdrawn/stale proposal. " +
    "Your existing unsubmitted draft is preserved. Full proposal bodies and diffs are not automatically included.\n" + JSON.stringify({ delivery: { invocationId, inputId }, total: pending.length, records }));
}

export function workflowAdjustmentContextSources(facts: WorkflowAdjustmentNotificationFact[]): AgentContextSource[] {
  return [{ key: "workflow-updates", label: "Workflow configuration update results", records: facts.map(fact => ({
    id: fact.record.requestId, status: fact.transition.status, ...fact })) }];
}

/** Preparation and receipt are separate append-only facts. Only the trusted
 * actual native user-message observer can confirm this exact bound text. */
export function workflowAdjustmentNotifications(database: Pick<CollaborationStateDatabase,
  "prepareWorkflowAdjustmentNotification" | "confirmWorkflowAdjustmentNotification">, context: ControlResultContext) {
  assertWorkflowNotificationContext(context);
  return {
    prepare: async (inputId: string) => (await database.prepareWorkflowAdjustmentNotification(context, inputId))?.text ?? "",
    details: async (inputId: string) => workflowAdjustmentContextSources((await database.prepareWorkflowAdjustmentNotification(context, inputId))?.facts ?? []),
    observe: async (event: Record<string, unknown>) => await database.confirmWorkflowAdjustmentNotification(context, event)
  };
}

export function workflowNotificationReceivedEvent(context: ControlResultContext, notification: WorkflowAdjustmentNotification,
  event: Record<string, unknown>, fact: WorkflowAdjustmentNotificationFact): Omit<CollaborationEvent, "eventId" | "seq" | "ts"> {
  return { projectId: context.projectId, agentId: context.agentId, invocationId: context.invocationId,
    requestId: workflowNotificationReceipt(context, fact.eventId), type: "workflow.adjustment.notification.received",
    payload: { sourceEventId: fact.eventId, requestId: fact.record.requestId, status: fact.transition.status,
      inputId: notification.inputId, context: structuredClone(context), nativeEventId: event.eventId,
      ...(typeof event.sourceType === "string" ? { sourceType: event.sourceType } : {}),
      ...(typeof event.itemId === "string" ? { nativeMessageId: event.itemId } : {}),
      ...(fact.record.source.kind === "user" ? {} : { origin: structuredClone(fact.record.source) }) } };
}
