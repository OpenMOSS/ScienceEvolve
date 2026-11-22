import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, expect, it } from "vitest";
import { openCollaborationStateWorker, type AsyncCollaborationStateStore } from "../../src/core/collaboration-state/database-worker.js";
import { CollaborationStateError, StaleProjectRevisionError } from "../../src/core/collaboration-state/errors.js";
import { cloneAgentOrchestrationTemplate } from "../../src/core/agent-orchestration.js";
import { mergeAgentConfigs } from "../../src/core/validation.js";
import type { ProjectState } from "../../src/core/types.js";

const resources: Array<{ root: string; database: AsyncCollaborationStateStore }> = [];
afterEach(async () => {
  for (const item of resources.splice(0)) {
    await item.database.close();
    await fs.rm(item.root, { recursive: true, force: true });
  }
});
async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "collaboration-worker-"));
  const databasePath = path.join(root, "state.sqlite");
  const database = await openCollaborationStateWorker({ databasePath, topology: "single-host", serviceId: "test",
    hostId: "test-host" });
  const resource = { root, database }; resources.push(resource);
  const orchestration = cloneAgentOrchestrationTemplate();
  const checkpoint: ProjectState = { id: "project-1", title: "Database publication", requirement: "Retain actual committed state",
    status: "queued", phase: "queued", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    turn: 0, cycle: 0, eventSeq: 0, completionGeneration: 0, consecutiveFailures: 0, mainInvocationSeq: 0,
    runCounts: {}, orchestration, agents: mergeAgentConfigs(undefined, orchestration) };
  await database.createProject({ projectId: "project-1", workflowRevision: 1, workflowSnapshot: orchestration,
    git: { enabled: false, status: "disabled" }, workerCapacity: 2, managementCapacity: 1, recoveryLimit: 3 });
  return { database, databasePath, checkpoint, resource };
}

it("keeps timers responsive during a real SQLite COMMIT wait and commits the request once", async () => {
  const { database, databasePath } = await fixture();
  const reader = new DatabaseSync(databasePath, { readOnly: true });
  reader.exec("BEGIN"); reader.prepare("SELECT project_id FROM project_heads").all();
  let ticks = 0;
  const timer = setInterval(() => ticks++, 20);
  const release = setTimeout(() => reader.exec("ROLLBACK"), 500);
  try {
    await database.appendEvent({ projectId: "project-1", requestId: "one-event", type: "test.commit", payload: {} });
    expect(ticks).toBeGreaterThan(5);
    expect((await database.eventsAfter("project-1", 0, 100)).filter(event => event.type === "test.commit")).toHaveLength(1);
  } finally {
    clearInterval(timer); clearTimeout(release);
    if (reader.isTransaction) reader.exec("ROLLBACK");
    reader.close();
  }
});

it("preserves typed errors and rejects a replaced writer epoch without changing project facts", async () => {
  const { database, databasePath } = await fixture();
  const before = await database.eventsAfter("project-1", 0, 100);
  const observer = new DatabaseSync(databasePath);
  try { observer.exec("UPDATE writer_service_owner SET epoch=epoch+1"); }
  finally { observer.close(); }
  const error = await database.appendEvent({ projectId: "project-1", type: "test.expired", payload: {} }).catch(error => error);
  expect(error).toBeInstanceOf(CollaborationStateError);
  expect(error).toMatchObject({ code: "WRITER_LEASE_STALE" });
  expect(() => database.assertWriterAvailable()).toThrow(expect.objectContaining({ code: "WRITER_LEASE_STALE" }));
  const reader = new DatabaseSync(databasePath, { readOnly: true });
  try { expect(reader.prepare("SELECT count(*) AS n FROM project_events WHERE project_id='project-1'").get()).toMatchObject({ n: before.length }); }
  finally { reader.close(); }
});

it("retains the original stale revision error details across the thread boundary", async () => {
  const { database } = await fixture();
  const current = await database.projectState("project-1");
  const error = await database.appendEvent({ projectId: "project-1", expectedRevision: current.stateRevision - 1,
    type: "test.stale", payload: {} }).catch(error => error);
  expect(error).toBeInstanceOf(StaleProjectRevisionError);
  expect(error.details).toMatchObject({ projectId: "project-1", actualRevision: current.stateRevision });
  expect((await database.eventsAfter("project-1", 0, 100)).some(event => event.type === "test.stale")).toBe(false);
});

it("rolls back a failed publication callback and remains available for exact state queries", async () => {
  const { database, checkpoint } = await fixture();
  await expect(database.initializeProjectStateDomain({ projectId: checkpoint.id, scheduler: "serial", checkpoint,
    publishView: () => { throw new Error("Actual view publication failure"); } })).rejects.toThrow("Actual view publication failure");
  expect(await database.projectStateDomain(checkpoint.id)).toBeUndefined();
  expect(await database.projectStateDocument(checkpoint.id, "project.checkpoint")).toBeUndefined();
  await database.initializeProjectStateDomain({ projectId: checkpoint.id, scheduler: "serial", checkpoint });
  expect((await database.projectStateDocument(checkpoint.id, "project.checkpoint"))?.value).toMatchObject({ title: checkpoint.title });
});

it("rejects nested database requests in a publication callback without deadlocking or partially writing", async () => {
  const { database, checkpoint } = await fixture();
  await expect(database.initializeProjectStateDomain({ projectId: checkpoint.id, scheduler: "serial", checkpoint,
    publishView: async () => { await database.projectState(checkpoint.id); } })).rejects.toThrow("cannot issue a nested database request");
  expect(await database.projectStateDomain(checkpoint.id)).toBeUndefined();
});

it("closes admission immediately and shares one drain while an accepted publication completes", async () => {
  const { database, databasePath, checkpoint } = await fixture();
  let entered!: () => void, release!: () => void;
  const publishing = new Promise<void>(resolve => { entered = resolve; });
  const permitted = new Promise<void>(resolve => { release = resolve; });
  const write = database.initializeProjectStateDomain({ projectId: checkpoint.id, scheduler: "serial", checkpoint,
    publishView: async () => { entered(); await permitted; } });
  await publishing;
  const acceptedQuery = database.projectStateDomain(checkpoint.id);
  const first = database.close(), second = database.close();
  let closed = false;
  void first.then(() => { closed = true; });
  try {
    expect(first).toBe(second);
    await expect(database.appendEvent({ projectId: checkpoint.id, type: "test.after-close", payload: {} }))
      .rejects.toThrow("closing or closed");
    await expect(database.projectStateDomain(checkpoint.id)).rejects.toThrow("closing or closed");
    expect(closed).toBe(false);
  } finally { release(); }
  await write;
  expect(await acceptedQuery).toMatchObject({ projectId: checkpoint.id, scheduler: "serial" });
  await first;
  expect(database.close()).toBe(first);
  const reader = new DatabaseSync(databasePath, { readOnly: true });
  try {
    expect(reader.prepare("SELECT count(*) AS count FROM project_state_domains WHERE project_id=?").get(checkpoint.id)).toMatchObject({ count: 1 });
    expect(reader.prepare("SELECT count(*) AS count FROM project_events WHERE event_type='test.after-close'").get()).toMatchObject({ count: 0 });
  } finally { reader.close(); }
});

it("rejects close from its own publication callback without terminating or deadlocking the worker", async () => {
  const { database, checkpoint } = await fixture();
  await expect(database.initializeProjectStateDomain({ projectId: checkpoint.id, scheduler: "serial", checkpoint,
    publishView: async () => { await database.close(); } })).rejects.toThrow("cannot close its own database worker");
  expect(await database.projectStateDomain(checkpoint.id)).toBeUndefined();
  await database.initializeProjectStateDomain({ projectId: checkpoint.id, scheduler: "serial", checkpoint });
  expect(await database.projectStateDomain(checkpoint.id)).toMatchObject({ scheduler: "serial" });
});

it("preserves a publication error during close and drains without committing the failed write", async () => {
  const { database, databasePath, checkpoint } = await fixture();
  let entered!: () => void, release!: () => void;
  const publishing = new Promise<void>(resolve => { entered = resolve; });
  const permitted = new Promise<void>(resolve => { release = resolve; });
  const outcome = database.initializeProjectStateDomain({ projectId: checkpoint.id, scheduler: "serial", checkpoint,
    publishView: async () => { entered(); await permitted; throw new Error("Original closing publication failure"); } })
    .catch(error => error);
  await publishing;
  const closing = database.close();
  release();
  expect(await outcome).toMatchObject({ message: "Original closing publication failure" });
  await closing;
  const reader = new DatabaseSync(databasePath, { readOnly: true });
  try { expect(reader.prepare("SELECT count(*) AS count FROM project_state_domains").get()).toMatchObject({ count: 0 }); }
  finally { reader.close(); }
});

it("keeps transport timers live throughout a 30-second database stall and then returns the committed query", async () => {
  const { database, checkpoint } = await fixture();
  const original = await database.writerLease();
  await database.initializeProjectStateDomain({ projectId: checkpoint.id, scheduler: "serial", checkpoint });
  const prior = (await database.projectStateDocument(checkpoint.id, "project.checkpoint"))!;
  let started!: () => void;
  const entered = new Promise<void>(resolve => { started = resolve; });
  let ticks = 0, confirmed = false;
  const timer = setInterval(() => ticks++, 100);
  try {
    const write = database.writeProjectStateDocument(checkpoint.id, "project.checkpoint", { ...checkpoint, title: "Committed after waiting" }, prior.version,
      async () => { started(); await new Promise(resolve => setTimeout(resolve, 30_000)); }).then(result => { confirmed = true; return result; });
    await entered;
    const query = database.projectStateDocument(checkpoint.id, "project.checkpoint");
    await new Promise(resolve => setTimeout(resolve, 100));
    expect(confirmed).toBe(false);
    const saved = await write;
    expect(ticks).toBeGreaterThan(100);
    expect(await query).toMatchObject({ version: saved.version, value: { title: "Committed after waiting" } });
    expect(await database.writerLease()).toEqual(original);
    expect(() => database.assertWriterAvailable()).not.toThrow();
  } finally { clearInterval(timer); }
}, 45_000);
