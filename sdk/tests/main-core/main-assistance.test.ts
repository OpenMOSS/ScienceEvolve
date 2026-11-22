import { afterEach, describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { CollaborationStateDatabase } from "../../src/core/collaboration-state/index.js";
import { enqueueMainAssistance, assistanceUpdate, type MainAssistanceJournal, type MainAssistanceOrigin } from "../../src/core/main-assistance.js";
import type { ProjectState } from "../../src/core/types.js";
const roots: string[] = [], databases: CollaborationStateDatabase[] = [];
afterEach(async () => { databases.splice(0).forEach(db => db.close()); await Promise.all(roots.splice(0).map(root => fs.rm(root, { recursive: true, force: true }))); });
async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-assistance-")); roots.push(root);
  const options = { databasePath: path.join(root, "state.sqlite"), serviceId: "test", instanceId: "test", hostId: "test", topology: "single-host" as const };
  let db = CollaborationStateDatabase.open(options); databases.push(db);
  db.createProject({ projectId: "p", workflowRevision: 1, workflowSnapshot: { agents: [] }, git: { enabled: false, status: "disabled" }, workerCapacity: 1, managementCapacity: 1 });
  db.initializeProjectStateDomain({ projectId: "p", scheduler: "serial", checkpoint: { id: "p", status: "queued" } as ProjectState });
  const checkpoint = (taskId?: string, status = "running") => {
    const prior = db.projectStateDocument("p", "project.checkpoint")!;
    db.writeProjectStateDocument("p", "project.checkpoint", { id: "p", status, currentAgent: "worker",
      ...(taskId ? { activeAgentExecution: { id: taskId, agent: "worker", startedAt: "2026-11-16T00:00:00Z" } } : {}) }, prior.version);
  };
  const session = { schemaVersion: 1 as const, harnessId: "codex", adapterVersion: "1", nativeId: "native-original", generation: 0, durable: true, createdAt: "2026-11-16T00:00:00Z" };
  const origin: MainAssistanceOrigin = { projectId: "p", agentId: "worker", taskId: "loop1-task", invocationId: "inv1", session };
  checkpoint(origin.taskId);
  const journal: MainAssistanceJournal = { list: async project => db.mainAssistance(project), save: async (record, version) => db.saveMainAssistance(record, version),
    failDelivery: async (...args) => db.failMainAssistanceDelivery(...args),
    prepareDelivery: async (current, input) => db.prepareMainAssistanceDelivery(current, input),
    observeInput: async (...args) => db.observeMainAssistanceInput(...args) };
  const enqueue = (requestId = "question", current = origin, question = "Which evidence is missing?") => enqueueMainAssistance(journal, current, { operation: "request", requestId, question }, "actual-mcp-call");
  const reply = async () => {
    const queued = await enqueue(), record = db.claimMainAssistance("p", queued.id)!;
    db.observeMainAssistanceInput("p", "main", record.main!.invocationId, { ...session, nativeId: "main-native" },
      { kind: "user.message", eventId: "main-received", invocationId: record.main!.invocationId, harnessId: "codex", message: record.main!.text });
    const received = db.mainAssistance("p")[0];
    return db.saveMainAssistance(assistanceUpdate(received, { status: "replied", reply: { text: "The baseline comparison is missing.", callId: "reply", invocationId: record.main!.invocationId, savedAt: new Date().toISOString() }, delivery: { status: "queued" } }), received.version);
  };
  return { get db() { return db; }, journal, origin, session, checkpoint, enqueue, reply,
    reopen() { db.close(); databases.splice(databases.indexOf(db), 1);
      db = CollaborationStateDatabase.open(options); databases.push(db); } };
}
describe("Main assistance durable task binding", () => {
  it("MA-03/04 deduplicates requests only within the same task and refuses changed questions or Sessions", async () => {
    const f = await fixture(), first = await f.enqueue();
    expect(first.callId).toBe("actual-mcp-call");
    expect(await f.enqueue()).toEqual(first);
    await expect(f.enqueue("question", f.origin, "Different question")).rejects.toThrow("immutable");
    await expect(f.enqueue("question", { ...f.origin, session: { ...f.session, nativeId: "replacement" } })).rejects.toThrow("immutable");
    expect((await f.enqueue("question", { ...f.origin, taskId: "loop2-task" })).id).not.toBe(first.id);
    expect(f.db.mainAssistance("p")).toHaveLength(2);
    await expect(f.enqueue("self", { ...f.origin, agentId: "main" })).rejects.toThrow("itself");
    await expect(f.enqueue("bad", { ...f.origin, session: { ...f.session, durable: false } })).rejects.toThrow("durable");
  });
  it("MA-04 serializes Main independently of the live worker and retains the claim across restart", async () => {
    const f = await fixture(), first = await f.enqueue(), second = await f.enqueue("second");
    const claimed = f.db.claimMainAssistance("p", first.id)!;
    expect(claimed.status).toBe("processing"); expect(claimed.main?.receivedAt).toBeUndefined();
    expect(f.db.claimMainAssistance("p", second.id)).toBeUndefined();
    f.reopen(); expect(f.db.claimMainAssistance("p", first.id)).toBeUndefined();
    expect(f.db.claimMainAssistance("p", second.id)).toBeUndefined();
    f.db.releaseMainAssistance("p", first.id, claimed.main!.invocationId, "Original process stopped; outcome unknown", true);
    expect(f.db.mainAssistance("p")[0].status).toBe("unknown");
    expect(f.db.claimMainAssistance("p", second.id)?.main?.epoch).toBe(claimed.main!.epoch + 1);
  });
  it.each(["text", "mcp-envelope"])("MA-02/03/06 records native receipts separately and never repeats an unconfirmed offer after restart (%s)", async format => {
    const f = await fixture(), reply = await f.reply();
    expect(reply).toMatchObject({ main: { receivedAt: expect.any(String) }, delivery: { status: "queued" } });
    expect(f.db.prepareMainAssistanceDelivery({ ...f.origin, taskId: "loop2-task" }, "wrong-task")).toBe("");
    const message = f.db.prepareMainAssistanceDelivery(f.origin, "native-input"); expect(message).toContain(reply.reply!.text);
    f.reopen(); expect(f.db.prepareMainAssistanceDelivery(f.origin, "duplicate")).toBe("");
    const base = { kind: "tool.completed", eventId: "tool-receipt", invocationId: "inv1", harnessId: "codex" };
    for (const tool of [{ outputPreview: reply.reply!.text }, { outputPreview: message, truncated: true }, { outputPreview: message, isError: true }])
      f.db.observeMainAssistanceInput("p", "worker", "inv1", f.session, { ...base, tool });
    f.db.observeMainAssistanceInput("p", "worker", "other-invocation", f.session, { ...base, tool: { outputPreview: message } });
    expect(f.db.mainAssistance("p")[0].delivery?.status).toBe("offered");
    f.db.observeMainAssistanceInput("p", "worker", "inv1", f.session, { ...base, tool: { outputPreview: format === "mcp-envelope" ? JSON.stringify({ content: [{ type: "text", text: message }] }) : message } });
    const received = f.db.mainAssistance("p")[0]; expect(received.delivery).toMatchObject({ status: "received", eventId: "tool-receipt" });
    f.db.observeMainAssistanceInput("p", "worker", "inv1", f.session, { ...base, tool: { outputPreview: message } });
    f.db.failMainAssistanceDelivery(f.origin, "native-input", "Late transport error cannot erase actual receipt");
    expect(f.db.mainAssistance("p")[0]).toEqual(received);
  });
  it("MA-06 reports replacement Session as a continuity obstacle without forwarding the answer", async () => {
    const f = await fixture(); await f.reply();
    expect(f.db.prepareMainAssistanceDelivery({ ...f.origin, session: { ...f.session, nativeId: "replacement" } }, "new-session")).toBe("");
    expect(f.db.mainAssistance("p")[0].delivery).toMatchObject({ status: "unknown", reason: expect.stringContaining("Original native Session no longer matches") });
    expect(f.db.prepareMainAssistanceDelivery(f.origin, "implicit-retry")).toBe("");
  });
  it.each(["completed", "cancelled", "replaced"])("MA-07 retains late answers after the original task is %s", async status => {
    const f = await fixture(), record = await f.reply();
    f.checkpoint(status === "replaced" ? "next-task" : undefined, status === "replaced" ? "running" : status);
    f.db.releaseMainAssistance("p", record.id, record.main!.invocationId);
    expect(f.db.prepareMainAssistanceDelivery(f.origin, "late")).toBe("");
    expect(f.db.prepareMainAssistanceDelivery({ ...f.origin, taskId: "next-task" }, "next")).toBe("");
    f.reopen(); expect(f.db.refreshMainAssistanceDeliveries("p")[0]).toMatchObject({ status: "replied", reply: record.reply, delivery: { status: "late" } });
    expect(f.db.projectState("p").executions).toHaveLength(0);
  });
  it("MA-06 retains failure and undelivered replies during pause without reopening Main", async () => {
    const f = await fixture(), record = await f.reply(); f.checkpoint(f.origin.taskId, "paused");
    f.db.releaseMainAssistance("p", record.id, record.main!.invocationId);
    f.reopen(); expect(f.db.claimMainAssistance("p", record.id)).toBeUndefined();
    expect(f.db.mainAssistance("p")[0].delivery?.status).toBe("queued");
    f.checkpoint(f.origin.taskId); const message = f.db.prepareMainAssistanceDelivery(f.origin, "resumed"); expect(message).toContain(record.reply!.text);
    f.db.failMainAssistanceDelivery(f.origin, "resumed", "Native input rejected");
    f.reopen(); expect(f.db.prepareMainAssistanceDelivery(f.origin, "retry")).toBe("");
    expect(f.db.mainAssistance("p")[0].delivery).toMatchObject({ status: "unknown", reason: "Native input rejected" });
  });
});
