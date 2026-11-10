import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { expect, it } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import { prepareProjectStateDocumentView, prepareProjectStateDocumentViewSync, type ProjectStateDocument } from "../../src/core/project-state-documents.js";
import { projectStateDigest } from "../../src/core/project-state.js";
import { CollaborationStateDatabase } from "../../src/core/collaboration-state/store.js";
import { cloneAgentOrchestrationTemplate } from "../../src/core/agent-orchestration.js";
import { ProjectStorage } from "../../src/core/storage.js";
import { EventHub } from "../../src/core/event-hub.js";
import { ProductionCollaborationInvocationDispatcher } from "../../src/core/collaboration-runtime.js";
import type { AgentRunRequest, ProjectState } from "../../src/core/types.js";

it.each(["async", "sync"])("prepares %s views before the transaction's exact-version publish", async mode => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "project-view-stage-")), file = path.join(root, "state.json");
  const prior: ProjectStateDocument = { projectId: "project", name: "project.checkpoint", revision: 1, version: "a".repeat(64), updatedAt: "2026-11-03", value: { id: "project", turn: 1 } };
  await fs.writeFile(file, "original-view");
  const value = { id: "project", turn: 2 }, version = projectStateDigest({ projectId: prior.projectId, name: prior.name, revision: 2, value });
  const stage = mode === "async" ? await prepareProjectStateDocumentView(file, value, prior) : prepareProjectStateDocumentViewSync(file, value, prior);
  try {
    expect(await fs.readFile(file, "utf8")).toBe("original-view");
    expect(() => stage.publish({ ...prior, revision: 2, version: "b".repeat(64) })).toThrow("document version");
    expect(await fs.readFile(file, "utf8")).toBe("original-view");
    stage.publish({ ...prior, revision: 2, version, value });
    expect(JSON.parse(await fs.readFile(file, "utf8"))).toMatchObject({ formalState: { version, revision: 2 }, view: value });
  } finally { stage.discard(); await fs.rm(root, { recursive: true, force: true }); }
});
it("publishes an unchanged document without inventing a new revision", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "project-view-unchanged-")), file = path.join(root, "state.json");
  const prior: ProjectStateDocument = { projectId: "project", name: "project.checkpoint", revision: 7, version: "c".repeat(64), updatedAt: "2026-11-03", value: { id: "project" } };
  const stage = await prepareProjectStateDocumentView(file, { id: "project", omitted: undefined }, prior);
  try { stage.publish(prior); expect(JSON.parse(await fs.readFile(file, "utf8")).formalState.revision).toBe(7); }
  finally { stage.discard(); await fs.rm(root, { recursive: true, force: true }); }
});

it("commits coherent checkpoint snapshots when live state changes and writes overlap", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "project-view-concurrent-"));
  const projectId = "prj_" + "a".repeat(32);
  const database = CollaborationStateDatabase.open({ databasePath: path.join(root, "state.sqlite"),
    serviceId: "snapshot-test", hostId: "test-host", topology: "single-host", now: () => 1_000_000 });
  const storage = new ProjectStorage(root, new EventHub());
  try {
    database.createProject({ projectId, workflowRevision: 1, workflowSnapshot: cloneAgentOrchestrationTemplate(),
      git: { enabled: true, status: "ready" }, workerCapacity: 1 });
    const initial = { id: projectId, status: "queued", phase: "collaboration:ready", turn: 1,
      tokenUsage: { totalTokens: 0 } };
    database.initializeProjectStateDomain({ projectId, scheduler: "git", checkpoint: initial as ProjectState });
    await storage.configureProjectStateStore({
      domain: id => database.projectStateDomain(id),
      read: (id, name) => database.projectStateDocument(id, name),
      write: (id, name, value, version, publish) => database.writeProjectStateDocument(id, name, value, version, publish)
    });
    const live = structuredClone(initial) as ProjectState;
    storage.trackCheckpoint(live);
    live.turn = 2;
    live.tokenUsage.totalTokens = 10;
    const pending = storage.saveState(live);
    live.turn = 3;
    live.tokenUsage.totalTokens = 20;
    await pending;
    const committed = database.projectStateDocument(projectId, "project.checkpoint")!;
    expect(committed).toMatchObject({ revision: 2, value: { turn: 2, tokenUsage: { totalTokens: 10 } } });
    expect(live).toMatchObject({ turn: 3, tokenUsage: { totalTokens: 20 } });
    const file = path.join(storage.projectDir(projectId), "state.json");
    expect(JSON.parse(await fs.readFile(file, "utf8"))).toMatchObject({
      formalState: { version: committed.version, revision: committed.revision }, view: committed.value
    });
    await storage.saveState(live);
    const next = database.projectStateDocument(projectId, "project.checkpoint")!;
    expect(next).toMatchObject({ revision: 3, value: { turn: 3, tokenUsage: { totalTokens: 20 } } });
    expect(JSON.parse(await fs.readFile(file, "utf8"))).toMatchObject({
      formalState: { version: next.version, revision: next.revision }, view: next.value
    });
    // A separate writer accepts a new phase while this live object is stale.
    database.writeProjectStateDocument(projectId, "project.checkpoint",
      { ...next.value as ProjectState, phase: "research:accepted" }, next.version);
    const checkpoints = Array.from({ length: 8 }, (_, index) => {
      live.turn = index + 4;
      live.tokenUsage.totalTokens = live.turn * 10;
      return storage.saveState(live);
    });
    await Promise.all(checkpoints);
    const final = database.projectStateDocument(projectId, "project.checkpoint")!;
    expect(final).toMatchObject({ revision: 12, value: {
      turn: 11, tokenUsage: { totalTokens: 110 }, phase: "research:accepted"
    } });
    expect(JSON.parse(await fs.readFile(file, "utf8"))).toMatchObject({
      formalState: { version: final.version, revision: final.revision }, view: final.value
    });
    let authorized = true;
    live.turn = 99;
    const revoked = storage.saveState(live, () => {
      if (!authorized) throw new Error("Original invocation authority revoked");
    });
    authorized = false;
    live.turn = 12;
    const outcomes = await Promise.allSettled([revoked, storage.saveState(live)]);
    expect(outcomes[0]).toMatchObject({ status: "rejected", reason: { message: "Original invocation authority revoked" } });
    expect(outcomes[1]).toMatchObject({ status: "fulfilled" });
    expect(database.projectStateDocument(projectId, "project.checkpoint")).toMatchObject({
      revision: 13, value: { turn: 12, phase: "research:accepted" }
    });
    expect(await fs.readdir(path.dirname(file))).toEqual(["state.json"]);
  } finally { database.close(); await fs.rm(root, { recursive: true, force: true }); }
});

it.each(["commit", "competing-document", "replacement-writer"] as const)("prepares checkpoint bytes without a write lock and rechecks authority (%s)", async scenario => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "checkpoint-prepare-"));
  const projectId = "prj_" + "b".repeat(32);
  const database = CollaborationStateDatabase.open({ databasePath: path.join(root, "state.sqlite"),
    serviceId: "prepare-test", hostId: "fixture", topology: "single-host", now: () => 1_000_000 });
  const raw = Reflect.get(database, "database") as DatabaseSync;
  try {
    database.createProject({ projectId, workflowRevision: 1, workflowSnapshot: cloneAgentOrchestrationTemplate(),
      git: { enabled: true, status: "ready" }, workerCapacity: 1 });
    const initial = { id: projectId, status: "queued", phase: "collaboration:ready", turn: 1 } as ProjectState;
    database.initializeProjectStateDomain({ projectId, scheduler: "git", checkpoint: initial });
    const before = database.projectStateDocument(projectId, "project.checkpoint")!;
    let prepared = false, published = false;
    const value = { toJSON() {
      expect(raw.isTransaction).toBe(false);
      prepared = true;
      if (scenario === "competing-document") database.writeProjectStateDocument(projectId, "project.checkpoint", { ...initial, turn: 3 }, before.version);
      if (scenario === "replacement-writer") raw.exec("UPDATE writer_service_lease SET epoch=epoch+1,instance_id='successor'");
      return { ...initial, turn: 2 };
    } };
    const commit = () => database.writeProjectStateDocument(projectId, "project.checkpoint", value, before.version, () => { published = true; });
    if (scenario === "commit") {
      expect(commit()).toMatchObject({ revision: 2, value: { turn: 2 } });
      expect(published).toBe(true);
    } else {
      expect(commit).toThrow(scenario === "competing-document" ? "Authoritative project document changed" : "writer epoch/expiry fence");
      expect(published).toBe(false);
      expect(database.projectStateDocument(projectId, "project.checkpoint")!.value).toMatchObject({ turn: scenario === "competing-document" ? 3 : 1 });
    }
    expect(prepared).toBe(true);
    expect(raw.isTransaction).toBe(false);
  } finally { database.close(); await fs.rm(root, { recursive: true, force: true }); }
});

it("persists trace records at the tool boundary and checkpoints them on explicit flush", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "checkpoint-batch-"));
  const projectId = "prj_" + "c".repeat(32);
  const database = CollaborationStateDatabase.open({ databasePath: path.join(root, "state.sqlite"),
    serviceId: "batch-test", hostId: "fixture", topology: "single-host" });
  const storage = new ProjectStorage(root, new EventHub());
  try {
    database.createProject({ projectId, workflowRevision: 1, workflowSnapshot: cloneAgentOrchestrationTemplate(),
      git: { enabled: true, status: "ready" }, workerCapacity: 1 });
    const state = { id: projectId, status: "queued", phase: "collaboration:ready", turn: 0, cycle: 1, eventSeq: 0 } as ProjectState;
    database.initializeProjectStateDomain({ projectId, scheduler: "git", checkpoint: state });
    await storage.configureProjectStateStore({ domain: id => database.projectStateDomain(id),
      read: (id, name) => database.projectStateDocument(id, name),
      write: (id, name, value, version, publish) => database.writeProjectStateDocument(id, name, value, version, publish) });
    storage.trackCheckpoint(state);
    await fs.mkdir(path.join(storage.projectDir(projectId), "traces"), { recursive: true });
    await fs.writeFile(path.join(storage.projectDir(projectId), "events.jsonl"), "");
    const dispatcher = new ProductionCollaborationInvocationDispatcher(storage);
    const request = { invocationId: "inv_batch", agent: "main" } as AgentRunRequest;
    dispatcher.decorate({ state, request });
    const sink = dispatcher.trace({ state, agentId: "main", invocationId: request.invocationId });
    for (let index = 0; index < 80; index++) await sink("status", `progress ${index}`);
    expect(database.projectStateDocument(projectId, "project.checkpoint")!.revision).toBe(1);
    await request.onOfficialHarnessEvent!({ schemaVersion: 1, eventId: "tool-boundary", seq: 1, timestamp: new Date().toISOString(),
      invocationId: request.invocationId, harnessId: "fixture", attempt: 0, kind: "tool.started", phase: "started",
      tool: { callId: "call", name: "read_file", toolType: "file", status: "started" } });
    expect((await storage.readEvents(projectId)).map(event => event.seq)).toEqual(Array.from({ length: 81 }, (_, index) => index + 1));
    expect(database.projectStateDocument(projectId, "project.checkpoint")).toMatchObject({ revision: 1, value: { eventSeq: 0 } });
    await dispatcher.flush(projectId);
    expect(database.projectStateDocument(projectId, "project.checkpoint")).toMatchObject({ revision: 2, value: { eventSeq: 81 } });
    const raw = Reflect.get(database, "database") as DatabaseSync;
    expect(raw.prepare("SELECT count(*) AS n FROM project_events WHERE project_id=? AND event_type='project.state.document.changed'").get(projectId)?.n).toBe(1);
  } finally { database.close(); await fs.rm(root, { recursive: true, force: true }); }
});
