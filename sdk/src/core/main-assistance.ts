import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { z } from "zod";
import { sameDurableSession } from "./control-result-receipts.js";
import { validateSessionRef } from "./harness-runtime/session-ref.js";
import { contentText } from "./harness-runtime/official-event-bridge.js";
import type { SessionRef } from "./harness-runtime/contracts.js";
import type { CollaborationExecutionContext } from "./types.js";

export interface MainAssistanceOrigin {
  projectId: string; agentId: string; taskId: string; invocationId: string; session: SessionRef;
  executionContext?: CollaborationExecutionContext;
}
export interface MainAssistanceRecord {
  id: string; version: number; origin: MainAssistanceOrigin; callId: string; question: string;
  status: "queued" | "processing" | "replied" | "failed" | "unknown";
  main?: { invocationId: string; epoch: number; writerEpoch: number; inputId: string; text: string; session?: SessionRef;
    receivedAt?: string; eventId?: string; stoppedAt?: string };
  reply?: { text: string; callId: string; invocationId: string; savedAt: string };
  delivery?: { status: "queued" | "offered" | "received" | "late" | "unknown"; inputId?: string;
    invocationId?: string; session?: SessionRef; text?: string; eventId?: string; receivedAt?: string; reason?: string };
  error?: string; createdAt: string; updatedAt: string;
}
export interface MainAssistanceJournal {
  list(projectId: string): Promise<MainAssistanceRecord[]>;
  prepareDelivery(current: MainAssistanceOrigin, inputId: string): Promise<string>;
  failDelivery(current: MainAssistanceOrigin, inputId: string, reason: string): Promise<void>;
  observeInput(projectId: string, agentId: string, invocationId: string, session: SessionRef, event: Record<string, unknown>): Promise<void>;
  save(record: MainAssistanceRecord, expectedVersion: number): Promise<MainAssistanceRecord>;
}
const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
export const mainAssistanceRequestSchema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("request"), question: z.string().trim().min(1).max(16_000), requestId: z.string().min(1).max(128) }).strict(),
  z.object({ operation: z.literal("list") }).strict(),
  z.object({ operation: z.literal("read"), requestId: z.string().min(1).max(128) }).strict(),
  z.object({ operation: z.literal("reply"), requestId: z.string().min(1).max(128), text: z.string().trim().min(1).max(24_000) }).strict()
]);
export function assistancePrompt(record: MainAssistanceRecord): string {
  return `Main assistance request ${record.id}\nFrom Agent ${record.origin.agentId}, original task ${record.origin.taskId}.\n${record.question}\n\nReply with main_assistance operation=reply, requestId=${record.id}. Use your authorized native tools when useful. This request does not authorize routing, reassignment, Workflow edits, Gate changes or project completion. The requester continues its original task independently. State any inability to resolve the question in your reply.`;
}
export function assistanceUpdate(record: MainAssistanceRecord, change: Partial<MainAssistanceRecord>): MainAssistanceRecord {
  return { ...record, ...change, version: record.version + 1, updatedAt: new Date().toISOString() };
}
export async function enqueueMainAssistance(journal: MainAssistanceJournal, origin: MainAssistanceOrigin, value: unknown, callId: string): Promise<MainAssistanceRecord> {
  const request = mainAssistanceRequestSchema.parse(value);
  if (request.operation !== "request") throw new Error("Expected an explicit Main assistance request");
  if (origin.agentId === "main") throw new Error("Main cannot request assistance from itself");
  if (!callId || !origin.taskId || !origin.invocationId || !validateSessionRef(origin.session).valid || !origin.session.durable)
    throw new Error("Main assistance requires the original logical task and actual durable native Session");
  const id = `assist_${hash([origin.projectId, origin.agentId, origin.taskId, request.requestId])}`;
  const existing = (await journal.list(origin.projectId)).find(item => item.id === id);
  if (existing) {
    if (existing.question !== request.question || existing.origin.agentId !== origin.agentId ||
      existing.origin.taskId !== origin.taskId || !sameDurableSession(existing.origin.session, origin.session))
      throw new Error("Main assistance requestId already belongs to another immutable request");
    return existing;
  }
  const timestamp = new Date().toISOString();
  return journal.save({ id, version: 1, origin: structuredClone(origin), callId, question: request.question,
    status: "queued", createdAt: timestamp, updatedAt: timestamp }, 0);
}
export function sameAssistanceTask(origin: MainAssistanceOrigin, current: MainAssistanceOrigin): boolean {
  return origin.projectId === current.projectId && origin.agentId === current.agentId && origin.taskId === current.taskId &&
    sameDurableSession(origin.session, current.session);
}
export function assistanceDeliveryText(record: MainAssistanceRecord): string {
  if (!record.reply) throw new Error("Main assistance has no reply to deliver");
  return `Main assistance reply ${record.id}\nOriginal request: ${record.question}\nMain reply: ${record.reply.text}\nThis answer belongs to original task ${record.origin.taskId}. It supplements your existing work; it does not replace your input, undo work, change your route or complete your task.`;
}
export async function prepareAssistanceDelivery(journal: MainAssistanceJournal, current: MainAssistanceOrigin, inputId: string): Promise<string> {
  return journal.prepareDelivery(current, inputId);
}
export async function observeAssistanceInput(journal: MainAssistanceJournal, projectId: string, agentId: string, invocationId: string,
  session: SessionRef, event: Record<string, unknown>): Promise<void> {
  return journal.observeInput(projectId, agentId, invocationId, session, event);
}
export function assistanceReceiptChange(record: MainAssistanceRecord, agentId: string, invocationId: string,
  session: SessionRef, event: Record<string, unknown>): Partial<MainAssistanceRecord> | undefined {
  if (event.invocationId !== invocationId || event.harnessId !== session.harnessId || typeof event.eventId !== "string") return;
  const tool = event.tool as { outputPreview?: unknown; truncated?: boolean; isError?: boolean } | undefined;
  let message = event.kind === "user.message" && typeof event.message === "string" ? event.message
    : event.kind === "tool.completed" && tool && !tool.truncated && !tool.isError && typeof tool.outputPreview === "string" ? tool.outputPreview : undefined;
  if (!message) return;
  if (event.kind === "tool.completed" && message.trimStart().startsWith("{")) {
    // Codex preserves the MCP result envelope; Pi exposes its text content.
    try {
      const result = JSON.parse(message) as { content?: unknown };
      message = contentText(result.content) || message;
    } catch (error) { if (!(error instanceof SyntaxError)) throw error; }
  }
  if (event.kind === "user.message" && agentId === "main" && record.main?.invocationId === invocationId && !record.main.receivedAt && message.includes(record.main.text)) {
    return { main: { ...record.main, session: structuredClone(session), receivedAt: new Date().toISOString(), eventId: event.eventId } };
  }
  if (agentId === record.origin.agentId && record.delivery && ["offered", "unknown", "late"].includes(record.delivery.status) && record.delivery.invocationId === invocationId &&
    record.delivery.session && sameDurableSession(record.delivery.session, session) && record.delivery.text && message.includes(record.delivery.text)) {
    return { delivery: { ...record.delivery, status: "received", receivedAt: new Date().toISOString(), eventId: event.eventId } };
  }
}
export function assertAssistanceImmutable(previous: MainAssistanceRecord, next: MainAssistanceRecord): void {
  for (const key of ["id", "origin", "callId", "question", "createdAt"] as const)
    if (!isDeepStrictEqual(previous[key], next[key])) throw new Error(`Main assistance ${key} is immutable`);
  if (previous.reply && !isDeepStrictEqual(previous.reply, next.reply)) throw new Error("Main assistance reply is immutable");
}
