import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CollaborationStateDatabase } from "../../src/core/collaboration-state/store.js";
import { COLLABORATION_STATE_SCHEMA_VERSION } from "../../src/core/collaboration-state/contracts.js";
import { initializeCollaborationStateSchema } from "../../src/core/collaboration-state/schema.js";
import { ProjectStorage } from "../../src/core/storage.js";
import { EventHub } from "../../src/core/event-hub.js";
import { cloneAgentOrchestrationTemplate } from "../../src/core/agent-orchestration.js";
import { mergeAgentConfigs } from "../../src/core/validation.js";
import { emptyProjectComputeUsage } from "../../src/core/inspire-compute-usage.js";
import { SiiExperimentService } from "../../src/core/sii-experiments.js";
import type { ProjectStateDocumentStore } from "../../src/core/project-state-documents.js";
import type { ProjectStateEntry, ProjectStatePrincipal } from "../../src/core/project-state.js";
import type { AgentRunRequest, ProjectState } from "../../src/core/types.js";

const P = `prj_${"d".repeat(32)}`, OTHER = `prj_${"e".repeat(32)}`;
const roots: string[] = [], stores: CollaborationStateDatabase[] = [], services: SiiExperimentService[] = [];
afterEach(async () => { await Promise.all(services.splice(0).map(s => s.stop())); stores.splice(0).forEach(s => s.close());
  await Promise.all(roots.splice(0).map(p => rm(p, { recursive: true, force: true }))); });
const session = { schemaVersion: 1 as const, harnessId: "codex", adapterVersion: "controlled", nativeId: "original-worker-session",
  generation: 0, durable: true, createdAt: "2026-10-13T00:00:00Z" };

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "openfars-state-documents-")); roots.push(root);
  const storage = new ProjectStorage(root, new EventHub()); await storage.initialize();
  const options = { databasePath: join(root, "state.sqlite"), serviceId: "test", hostId: "test", topology: "single-host" as const,
    instanceId: "one", now: () => 1_000_000 };
  const db = CollaborationStateDatabase.open(options); stores.push(db);
  const adapter = (database = db): ProjectStateDocumentStore => ({
    source: { protocol: "project-state-v1", kind: "sqlite", databasePath: options.databasePath },
    domain: id => database.projectStateDomain(id),
    read: (id, name) => database.projectStateDocument(id, name),
    write: (id, name, value, version, publish) => database.writeProjectStateDocument(id, name, value, version, publish) });
  await storage.configureProjectStateStore(adapter());
  const orchestration = cloneAgentOrchestrationTemplate(), agents = mergeAgentConfigs(undefined, orchestration);
  agents.execution.experimentMcp = true;
  agents.execution.gatewayId = `gwy_${"a".repeat(32)}`;
  agents.execution.gatewaySnapshot = { id: agents.execution.gatewayId, name: "Original private gateway", url: "https://controlled.invalid/v1",
    apiKey: "private-checkpoint-secret", models: [agents.execution.model], defaultModel: agents.execution.model, protocol: "responses" };
  const state: ProjectState = { id: P, title: "Formal document integration", requirement: "Retain true ownership, results and original Sessions",
    status: "queued", phase: "queued", createdAt: session.createdAt, updatedAt: session.createdAt, turn: 0, cycle: 1, eventSeq: 0,
    consecutiveFailures: 0, completionGeneration: 0, runCounts: {}, mainInvocationSeq: 0, mainContextSeq: 0,
    agents, orchestration, userInputs: [], controlProtocol: "natural-language-tools-v1", git: { enabled: false, status: "disabled" },
    tokenUsage: { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0, totalTokens: 0, invocations: 0, byAgent: {} }, computeUsage: emptyProjectComputeUsage() };
  await storage.createProject(state);
  db.createProject({ projectId: P, workflowRevision: 1, workflowSnapshot: orchestration, git: state.git!, workerCapacity: 1 });
  const register = () => db.initializeProjectStateDomain({ projectId: P, scheduler: "serial", checkpoint: state,
    publishView: doc => storage.publishProjectStateView(doc) });
  const system: ProjectStatePrincipal = { kind: "system", projectId: P, source: "controlled-document-reader" };
  const start = async (kind: "main" | "worker" = "worker", invocationId = "original-invocation", executionId = "original-task") => {
    const agentId = kind === "main" ? "main" : "execution";
    state.status = "running"; state.phase = "agent:running"; state.currentAgent = agentId; state.activeInvocationId = invocationId;
    state.activeAgentExecution = { id: executionId, agent: agentId, source: "project-input", createdAt: session.createdAt,
      startedAt: session.createdAt, firstInvocationId: invocationId, latestInvocationId: invocationId };
    await storage.saveState(state);
    db.bindSerialProjectStateInvocation({ projectId: P, agentId, invocationId, executionId, kind });
    return { kind: "agent" as const, projectId: P, agentId, invocationId };
  };
  const read = (principal: ProjectStatePrincipal, kind: string, id: string) => db.projectStateRequest(principal, { operation: "get", object: { kind, id } }) as ProjectStateEntry;
  return { root, options, db, storage, state, adapter, register, system, start, read };
}

describe("one formal store for project checkpoints and experiment ledgers", () => {
  it.each([false, true])("preserves accepted results when an older callback saves only its telemetry (formal=%s)", async formal => {
    const f = await fixture(); if (formal) f.register();
    const telemetry = await f.storage.loadState(P), publication = await f.storage.loadState(P);
    publication.artifacts = [{ id: "actual-report", agent: "execution", invocationId: "report-invocation",
      path: "reports/final.md", title: "Final report", kind: "report", description: "Existing research",
      size: 16, updatedAt: session.createdAt }];
    publication.phase = "research:completed";
    await f.storage.saveState(publication);
    telemetry.computeUsage.totalCardHours = 42;
    await f.storage.saveState(telemetry);
    expect(await f.storage.loadState(P)).toMatchObject({ artifacts: publication.artifacts, phase: "research:completed",
      computeUsage: { totalCardHours: 42 } });
    telemetry.tokenUsage.inputTokens += 7;
    await f.storage.appendEvent(telemetry, { type: "agent.trace", message: "Late diagnostic" });
    expect((await f.storage.loadState(P)).artifacts).toEqual(publication.artifacts);
    expect(telemetry.artifacts).toEqual(publication.artifacts);
  });

  it.each([false, true])("compares queued inputs by their persisted JSON when optional reception fields are unset (formal=%s)", async formal => {
    const f = await fixture(); if (formal) f.register();
    f.state.userInputs.push({ id: "queued-input", message: "Retain original task", mode: "wait", status: "pending",
      createdAt: session.createdAt, targetMainInvocation: 1, deliveredAt: undefined, deliveredInvocationId: undefined });
    await f.storage.saveState(f.state);
    f.state.userInputs[0] = { ...f.state.userInputs[0], status: "delivered",
      deliveredAt: session.createdAt, deliveredInvocationId: "actual-native-invocation" };
    await f.storage.saveState(f.state);
    expect((await f.storage.loadState(P)).userInputs).toEqual(f.state.userInputs);
    const stale = await f.storage.loadState(P), accepted = await f.storage.loadState(P);
    accepted.userInputs[0].message = "Accepted new User message"; await f.storage.saveState(accepted);
    stale.userInputs[0].message = "Competing stale message";
    await expect(f.storage.saveState(stale)).rejects.toThrow("Concurrent project checkpoint change at project.userInputs");
    expect((await f.storage.loadState(P)).userInputs).toEqual(accepted.userInputs);
  });

  it.each([false, true])("rejects an untracked stale snapshot without replacing another writer's accepted catalog (formal=%s)", async formal => {
    const f = await fixture(); if (formal) f.register();
    const stale = structuredClone(await f.storage.loadState(P));
    const publication = await f.storage.loadState(P);
    publication.artifacts = [{ id: "available-result", agent: "execution", invocationId: "original-report",
      path: "reports/accepted.md", title: "Accepted result", kind: "report", description: "Actual result",
      size: 42, updatedAt: session.createdAt }];
    await f.storage.saveState(publication);
    stale.computeUsage.totalCardHours = 42;
    await expect(f.storage.saveState(stale)).rejects.toThrow("save has no loaded baseline");
    const refreshed = await f.storage.loadState(P);
    expect(refreshed.artifacts).toEqual(publication.artifacts);
    refreshed.computeUsage.totalCardHours = 42;
    await f.storage.saveState(refreshed);
    expect((await f.storage.loadState(P)).artifacts).toEqual(publication.artifacts);
  });

  it("rejects a competing write to the same lifecycle fact without losing the accepted result", async () => {
    const f = await fixture(); f.register();
    const stale = await f.storage.loadState(P), current = await f.storage.loadState(P);
    current.phase = "research:accepted"; await f.storage.saveState(current);
    stale.phase = "research:obsolete";
    await expect(f.storage.saveState(stale)).rejects.toThrow(/Concurrent project checkpoint change at project.phase/);
    expect((await f.storage.loadState(P)).phase).toBe("research:accepted");
  });
  it("retains trace audit and restart cursors without updating SQLite until its checkpoint flush", async () => {
    const f = await fixture(); f.register();
    const original = f.db.projectStateDocument(P, "project.checkpoint")!;
    await f.storage.appendEvents(f.state, [{ type: "agent.trace", message: "Original retained tool event" }], undefined, { checkpoint: false });
    expect(f.db.projectStateDocument(P, "project.checkpoint")).toEqual(original);
    const reader = new ProjectStorage(f.root, new EventHub()); await reader.initialize();
    expect((await reader.loadState(P)).eventSeq).toBe(1);
    expect((await reader.readEvents(P)).map(event => event.message)).toEqual(["Original retained tool event"]);
    await f.storage.saveState(f.state);
    expect(f.db.projectStateDocument(P, "project.checkpoint")!.value).toMatchObject({ eventSeq: 1 });
    expect((await reader.loadState(P)).eventSeq).toBe(1);
  });

  it("registers the new project head and all source documents in one transaction, rolling publication failures back", async () => {
    const f = await fixture();
    const input = { projectId: OTHER, workflowRevision: 1, workflowSnapshot: f.state.orchestration,
      git: { enabled: false as const, status: "disabled" as const }, workerCapacity: 1, managementCapacity: 1 };
    const checkpoint = { ...f.state, id: OTHER };
    expect(() => f.db.createProject({ ...input, formalState: { checkpoint, publishView: () => { throw new Error("Actual registration publication failure"); } } }))
      .toThrow("Actual registration publication failure");
    expect(f.db.getProjectState(OTHER)).toBeUndefined(); expect(f.db.projectStateDomain(OTHER)).toBeUndefined();
    expect(f.db.projectStateDocument(OTHER, "project.checkpoint")).toBeUndefined();
    f.db.createProject({ ...input, formalState: { checkpoint, publishView: document => f.storage.publishProjectStateView(document) } });
    expect(f.db.projectStateDomain(OTHER)?.scheduler).toBe("serial");
    expect((await f.storage.loadState(OTHER)).id).toBe(OTHER);
    expect(f.db.projectStateDocument(OTHER, "sii.ledger")?.value).toEqual({ version: 1, experiments: [], waits: [] });
    expect(f.db.projectStateDocument(OTHER, "invocation.commit")?.value).toBeNull();
  });

  it("uses SQLite as the checkpoint authority, preserves private credentials there and exports an explicit non-authoritative file view", async () => {
    const f = await fixture(); f.register();
    const view = JSON.parse(await readFile(join(f.storage.projectDir(P), "state.json"), "utf8"));
    expect(view).toMatchObject({ id: P, formalState: { protocol: "project-state-v1", source: "sqlite" }, view: { status: "queued" } });
    expect((await f.storage.loadState(P)).agents.execution.gatewaySnapshot?.apiKey).toBe("private-checkpoint-secret");
    await writeFile(join(f.storage.projectDir(P), "state.json"), JSON.stringify({ ...view.view, status: "completed" }));
    expect((await f.storage.loadState(P)).status).toBe("queued");
    await rm(join(f.storage.projectDir(P), "state.json"));
    expect((await f.storage.loadState(P)).status).toBe("queued");
    expect(JSON.stringify(f.db.projectState(P))).not.toContain("private-checkpoint-secret");
    expect(JSON.stringify(f.db.eventsAfter(P, 0, 1000))).not.toContain("private-checkpoint-secret");
    await f.storage.saveState(f.state);
    const unconfigured = new ProjectStorage(f.root, new EventHub()); await unconfigured.initialize();
    const lease = f.db.writerLease();
    const unconfiguredState = await unconfigured.loadState(P);
    expect(unconfiguredState.status).toBe("queued"); unconfiguredState.status = "completed";
    await expect(unconfigured.saveState(unconfiguredState)).rejects.toThrow(/current lease-fenced runtime/);
    expect((await unconfigured.loadState(P)).status).toBe("queued");
    expect(f.db.writerLease()).toEqual(lease);
    await rm(join(f.storage.projectDir(P), "state.json"));
    f.db.close();
    expect((await unconfigured.loadState(P)).agents.execution.gatewaySnapshot?.apiKey).toBe("private-checkpoint-secret");
  });

  it("keeps legacy files and completed projects on their original authority without automatic registration", async () => {
    const f = await fixture(), before = await readFile(join(f.storage.projectDir(P), "state.json"));
    expect(f.db.projectStateDomain(P)).toBeUndefined(); expect((await f.storage.loadState(P)).status).toBe("queued");
    f.state.status = "completed"; await f.storage.saveState(f.state);
    expect(f.db.projectStateDomain(P)).toBeUndefined(); expect(f.register).toThrow(/new accepted project/);
    expect((await f.storage.loadState(P)).status).toBe("completed");
    expect(before.equals(await readFile(join(f.storage.projectDir(P), "state.json")))).toBe(false);
  });

  it("rejects source redirection and never resumes a registered project from a view when its configured database is unavailable", async () => {
    const f = await fixture(); f.register();
    await expect(f.storage.configureProjectStateStore({ ...f.adapter(), source: {
      protocol: "project-state-v1", kind: "sqlite", databasePath: join(f.root, "another.sqlite")
    } })).rejects.toThrow(/cannot be silently redirected/);
    f.db.close(); await rm(f.options.databasePath);
    await writeFile(join(f.storage.projectDir(P), "state.json"), JSON.stringify({ ...f.state, status: "completed" }));
    const reader = new ProjectStorage(f.root, new EventHub()); await reader.initialize();
    await expect(reader.loadState(P)).rejects.toThrow();
  });

  it("fences document CAS, rolls a failed publication back and retains extension writes through later system checkpoint commits", async () => {
    const f = await fixture(); f.register(); const main = await f.start("main");
    const original = f.db.projectStateDocument(P, "project.checkpoint")!, current = f.read(main, "project", P);
    f.db.projectStateRequest(main, { operation: "patch", object: current.object, expectedVersion: current.version,
      set: { progress: { step: "investigate", count: 3 } }, reason: "Actual Main assessment", callId: "progress" });
    f.state.phase = "agent:processing"; await f.storage.saveState(f.state);
    expect(f.read(main, "project", P).extensions).toEqual({ progress: { step: "investigate", count: 3 } });
    expect(() => f.db.writeProjectStateDocument(P, "project.checkpoint", f.state, original.version)).toThrow(/document changed/);
    const before = f.db.projectStateDocument(P, "project.checkpoint")!, revision = f.db.projectState(P).stateRevision;
    expect(() => f.db.writeProjectStateDocument(P, "project.checkpoint", { ...f.state, phase: "uncommitted" }, before.version,
      () => { throw new Error("Actual view publication failed"); })).toThrow("Actual view publication failed");
    expect(f.db.projectStateDocument(P, "project.checkpoint")).toEqual(before);
    expect(f.db.projectState(P).stateRevision).toBe(revision);
    expect(f.read(main, "project", P).historyTotal).toBeGreaterThan(1);
  });

  it("keeps an Agent's business CAS usable after the read itself records native trace and token telemetry, while rejecting real competing writes and key lifecycle changes", async () => {
    const f = await fixture(); f.register(); const main = await f.start("main");
    const before = f.read(main, "project", P), checkpoint = f.db.projectStateDocument(P, "project.checkpoint")!;
    f.state.tokenUsage.inputTokens += 10; f.state.tokenUsage.outputTokens += 10;
    f.state.tokenUsage.totalTokens += 20; f.state.tokenUsage.invocations += 1;
    f.state.tokenUsage.byAgent.main = { inputTokens: 10, cachedInputTokens: 0, outputTokens: 10, totalTokens: 20, invocations: 1 };
    await f.storage.appendEvent(f.state, { type: "agent.trace", agent: "main", message: "Actual public state_get result received" });
    const after = f.read(main, "project", P);
    expect(f.db.projectStateDocument(P, "project.checkpoint")!.version).not.toBe(checkpoint.version);
    expect(after.projectRevision).toBeGreaterThan(before.projectRevision);
    expect(after.version).toBe(before.version);
    f.db.projectStateRequest(main, { operation: "patch", object: before.object, expectedVersion: before.version,
      set: { acceptance_input: { values: [2, 3], expected: 5 } }, reason: "Main's explicit input after native reception", callId: "actual-seed" });
    expect(() => f.db.projectStateRequest(f.system, { operation: "patch", object: before.object, expectedVersion: before.version,
      set: { competing: true }, reason: "Another real writer must conflict", callId: "competing-seed" })).toThrow(/State object changed/);
    const seeded = f.read(main, "project", P);
    f.state.phase = "main:next-management-stage"; await f.storage.saveState(f.state);
    expect(f.read(main, "project", P).version).not.toBe(seeded.version);
    expect(() => f.db.projectStateRequest(main, { operation: "patch", object: seeded.object, expectedVersion: seeded.version,
      set: { stale_stage: true }, reason: "A changed key lifecycle still conflicts", callId: "stale-stage" })).toThrow(/State object changed/);
    expect(f.read(main, "project", P).extensions).toEqual({ acceptance_input: { values: [2, 3], expected: 5 } });
  });

  it("derives serial Main/Worker scope from the current real invocation, preserves sessions and rejects stale or forged bindings", async () => {
    const f = await fixture(); f.register(); const worker = await f.start();
    f.state.agentSessions = { execution: session }; f.state.agentSessionIds = { execution: session.nativeId }; await f.storage.saveState(f.state);
    const own = f.read(worker, "execution", "original-task"), project = f.read(worker, "project", P);
    expect(own.access).toMatchObject({ role: "worker", canWrite: true }); expect(project.access.canWrite).toBe(false);
    f.db.projectStateRequest(worker, { operation: "patch", object: own.object, expectedVersion: own.version,
      set: { analysis_stage: "ready" }, reason: "Agent's own business progress", callId: "own" });
    expect(() => f.db.projectStateRequest(worker, { operation: "patch", object: project.object, expectedVersion: project.version,
      set: { outside: true }, reason: "Must fail", callId: "outside" })).toThrow(/responsible Leader/);
    const main = await f.start("main", "next-main", "main-task");
    expect(f.read(main, "execution", "original-task").access.canWrite).toBe(true);
    expect(() => f.read(worker, "execution", "original-task")).toThrow(/current serial invocation/);
    expect(() => f.db.bindSerialProjectStateInvocation({ projectId: P, agentId: "main", executionId: "foreign-task", invocationId: "next-main", kind: "main" })).toThrow(/current serial/);
    const meta = f.db.projectStateDocument(P, "serial.invocation")!;
    expect(() => f.db.writeProjectStateDocument(P, "serial.invocation", { ...meta.value as object, projectId: OTHER }, meta.version)).toThrow(/another project/);
    expect((await f.storage.loadState(P)).agentSessions?.execution).toEqual(session);
    const lease = f.db.writerLease(); f.db.close();
    const reopened = CollaborationStateDatabase.open({ ...f.options, writerLease: lease }); stores.push(reopened);
    await f.storage.configureProjectStateStore(f.adapter(reopened));
    expect((await f.storage.loadState(P)).agentSessionIds?.execution).toBe(session.nativeId);
    expect(reopened.projectStateRequest(main, { operation: "get", object: { kind: "execution", id: "original-task" } })).toMatchObject({ extensions: { analysis_stage: "ready" } });
  });

  it.each([false, true])("recovers the SDK transaction from its database marker despite a missing or misleading journal file (committed=%s)", async committed => {
    const f = await fixture(); f.register(); await f.start("worker", "inv_transaction");
    f.state.agentSessions = { execution: session }; await f.storage.saveState(f.state);
    const before = await f.storage.loadState(P);
    await f.storage.beginInvocationCommit(f.state, "inv_transaction");
    const journal = f.db.projectStateDocument(P, "invocation.commit")!.value;
    f.state.phase = "actual-result-awaiting-commit"; await f.storage.saveState(f.state);
    expect(f.db.projectState(P).formalState?.invocationCommit.status).toBe("in_progress");
    const directory = join(f.storage.projectDir(P), ".transactions", "inv_transaction");
    if (committed) {
      await f.storage.commitInvocationCommit(f.state, "inv_transaction");
      await mkdir(directory, { recursive: true }); await writeFile(join(directory, "journal.json"), JSON.stringify(journal));
    } else await rm(join(directory, "journal.json"));
    const restartedStorage = new ProjectStorage(f.root, new EventHub()); await restartedStorage.configureProjectStateStore(f.adapter());
    await restartedStorage.recoverIncompleteCommits();
    const actual = await restartedStorage.loadState(P);
    expect(actual.phase).toBe(committed ? "actual-result-awaiting-commit" : before.phase);
    expect(actual.agentSessions?.execution).toEqual(session);
    expect(f.db.projectState(P).formalState?.invocationCommit.status).toBe(committed ? "committed" : "idle");
    expect(JSON.stringify(f.db.projectState(P))).not.toContain("private-checkpoint-secret");
    expect(JSON.stringify(f.db.eventsAfter(P, 0, 1000))).not.toContain("private-checkpoint-secret");
  });

  it("preserves the same actual ledger through submission response loss, file tampering, monitoring and native result reception", async () => {
    const f = await fixture(); f.register(); const worker = await f.start();
    const workspacePath = await f.storage.projectWorkspace(P), projectPath = f.storage.projectDir(P);
    const knowledgeRoot = join(f.root, "knowledge"); await mkdir(knowledgeRoot); await writeFile(join(knowledgeRoot, "SKILL.md"), "Controlled original knowledge");
    let lost = true, succeeded = false;
    const runJson = vi.fn(async (args: string[]) => {
      if (args.includes("create")) {
        const intent = f.db.projectStateDocument(P, "sii.ledger")!.value as { experiments: Array<{ status: string }> };
        expect(intent.experiments[0].status).toBe("submission_unknown");
        if (lost) throw new Error("Actual submission response lost");
        return { success: true };
      }
      return { success: true, data: { job: { status: succeeded ? "job_succeeded" : "job_running", accessToken: "sensitive-original-value" } } };
    });
    const service = new SiiExperimentService({ projectsRoot: f.storage.projectsDir(), inspireBin: "unused", workspaceRoot: f.root,
      knowledgeRoot, documentStore: f.adapter(), refreshMs: 3_600_000, runJson, accountReader: async () => "account-a" }); services.push(service);
    await service.start(); await service.refreshNow();
    const request = { project: f.state, projectPath, workspacePath, runtimePath: join(projectPath, "runtime", worker.invocationId),
      agent: "execution", kind: "worker", permission: "compute", invocationId: worker.invocationId, taskSessionId: "original-task" } as AgentRunRequest;
    const binding = await service.bind(request, new AbortController().signal); binding.session = session; binding.activate();
    const args = { args: ["job", "create", "--name", "science", "--workspace", "compute", "--project", "具有能动性的科学大模型", "--command", "python science.py"], request_id: "run-science", check_interval_minutes: 15 };
    const first = await binding.call("sii_submit_experiment", args) as { experiment: { id: string; status: string } };
    expect(first.experiment.status).toBe("submission_unknown"); lost = false;
    await binding.call("sii_submit_experiment", args);
    expect(runJson.mock.calls.filter(([a]) => a.includes("create"))).toHaveLength(1);
    await writeFile(join(projectPath, "runtime", "sii-experiments.json"), JSON.stringify({ version: 1, experiments: [], waits: [] }));
    expect((await service.document(projectPath)).experiments).toHaveLength(1);
    expect(f.read(worker, "experiment", first.experiment.id).core).toMatchObject({ status: "submission_unknown", session, checkIntervalMinutes: 15, nextAgentCheckAt: expect.any(Number),
      scope: { projectId: P, executionId: "original-task", invocationId: worker.invocationId } });
    succeeded = true; await service.refreshNow();
    const observed = f.read(worker, "experiment", first.experiment.id);
    expect(observed.core).toMatchObject({ status: "succeeded", resultReceived: false }); expect(observed.historyTotal).toBeGreaterThan(1);
    expect(JSON.stringify(observed)).not.toContain("accessToken"); expect(JSON.stringify(observed)).not.toContain("sensitive-original-value");
    expect(JSON.stringify(f.db.projectStateDocument(P, "sii.ledger")!.value)).toContain('"accessToken":"[REDACTED]"');
    await expect(binding.assertTaskComplete()).rejects.toThrow(/still needs experiment results/);
    const result = await binding.call("sii_get_experiment", { experiment_id: first.experiment.id });
    await binding.observeNativeResult({ kind: "tool.completed", phase: "completed", eventId: "actual-native-result", invocationId: worker.invocationId,
      harnessId: session.harnessId, tool: { name: "mcp__scienceevolve-sii__sii_get_experiment", callId: "native-get", status: "completed", outputPreview: JSON.stringify(result) } }, session);
    await expect(binding.assertTaskComplete()).resolves.toBeUndefined();
    expect(f.read(worker, "experiment", first.experiment.id).core).toMatchObject({ resultReceived: true });
    expect((f.read(worker, "experiment", first.experiment.id).core as { notificationReceipt: { session: unknown } }).notificationReceipt.session).toEqual(session);
    expect((await f.storage.loadState(P)).status).toBe("running"); expect(f.state.taskCompletions).toBeUndefined();
    binding.close();
  });

  it("rejects cross-project experiment bindings, raw credentials and a stale writer without changing the actual ledger", async () => {
    const f = await fixture(); f.register();
    const original = f.db.projectStateDocument(P, "sii.ledger")!;
    expect(() => f.db.writeProjectStateDocument(P, "sii.ledger", { version: 1, waits: [], experiments: [{ id: "foreign", scope: { projectId: OTHER } }] }, original.version))
      .toThrow(/another project/);
    expect(() => f.db.writeProjectStateDocument(P, "sii.ledger", { version: 1, waits: [], experiments: [{ id: "unsafe", evidence: { apiKey: "raw-private-value" } }] }, original.version))
      .toThrow(/unredacted credential/);
    expect(f.db.projectStateDocument(P, "sii.ledger")).toEqual(original);
    f.db.relinquishWriterLease();
    expect(() => f.db.writeProjectStateDocument(P, "sii.ledger", { version: 1, waits: [], experiments: [] }, original.version)).toThrow(/writer/i);
    expect(f.db.projectStateDocument(P, "sii.ledger")).toEqual(original);
  });

  it("migrates only schema metadata with the original writer and does not register historical project domains", async () => {
    const f = await fixture(), lease = f.db.writerLease(); f.db.close();
    const sql = new DatabaseSync(f.options.databasePath);
    sql.exec("DROP TABLE project_state_documents; DROP TABLE project_state_domains; UPDATE collaboration_state_meta SET schema_version=23");
    expect(() => initializeCollaborationStateSchema(sql)).toThrow(/lease/); sql.close();
    const reopened = CollaborationStateDatabase.open({ ...f.options, writerLease: lease }); stores.push(reopened);
    await f.storage.configureProjectStateStore(f.adapter(reopened));
    expect(reopened.verifyHealth().schemaVersion).toBe(COLLABORATION_STATE_SCHEMA_VERSION);
    expect(reopened.projectStateDomain(P)).toBeUndefined();
    expect((await f.storage.loadState(P)).status).toBe("queued");
  });
});
