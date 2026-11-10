import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CollaborationStateDatabase } from "../../src/core/collaboration-state/store.js";
import { cloneAgentOrchestrationTemplate } from "../../src/core/agent-orchestration.js";
import { mergeAgentConfigs } from "../../src/core/validation.js";
import { workflowAdjustmentNotifications } from "../../src/core/workflow-adjustment-notifications.js";
import type { ControlResultContext } from "../../src/core/control-result-receipts.js";
import { CollaborationRuntimeCoordinator } from "../../src/core/collaboration-runtime.js";
import { ProjectStorage } from "../../src/core/storage.js";
import { EventHub } from "../../src/core/event-hub.js";
import type { AgentRunRequest, ProjectState } from "../../src/core/types.js";

const roots: string[] = [], stores: CollaborationStateDatabase[] = [];
afterEach(async () => { stores.splice(0).forEach(store => store.close()); await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))); });
const canonical = (value: any): any => Array.isArray(value) ? value.map(canonical) : value && typeof value === "object"
  ? Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)])) : value;
const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(canonical(value))).digest("hex");

async function fixture(harnessId = "codex", allowMain = true) {
  const root = await mkdtemp(join(tmpdir(), "openfars-workflow-notifications-")); roots.push(root);
  const clock = { now: 1_000_000 }, options = { databasePath: join(root, "state.sqlite"), serviceId: "notice", instanceId: "writer-one",
    hostId: "fixture", topology: "single-host" as const, leaseDurationMs: 1_000, now: () => clock.now };
  const database = CollaborationStateDatabase.open(options); stores.push(database);
  const graph = cloneAgentOrchestrationTemplate(); graph.allowMainReconfiguration = allowMain;
  database.createProject({ projectId: "p", workflowRevision: 1, workflowSnapshot: graph, git: { enabled: true, status: "ready" }, workerCapacity: 3 });
  database.initializeScopedConfiguration("p", { agents: mergeAgentConfigs(undefined, graph), skillDefinitions: {}, mcpDefinitions: {} });
  const context: ControlResultContext = { projectId: "p", agentId: "main", invocationId: "next-legal-main",
    session: { schemaVersion: 1, harnessId, adapterVersion: "1", generation: 0, nativeId: "retained-main-session", durable: true,
      createdAt: new Date(clock.now).toISOString() }, executionContext: { role: "leader", nodeRunId: "original-node", routeScopeId: "weak-route", coordinatorEpoch: 2 } };
  const submit = (requestId = "user-one", instructions = "Exact user's accepted future instructions") => {
    const current = database.workflowAdjustmentCurrent("p"), proposal = structuredClone(current.snapshot);
    proposal.agents.idea.instructions = instructions;
    return database.submitUserWorkflowAdjustment({ projectId: "p", requestId, base: current.version, proposal, explanation: "The user's public explanation" }).record;
  };
  const apply = (requestId = "user-one") => {
    const prepared = database.prepareUserWorkflowAdjustmentPublication("p", requestId);
    if (!prepared.ready) throw new Error("Fixture proposal should be ready");
    return database.publishUserWorkflowAdjustment("p", requestId, prepared.validationToken);
  };
  const acceptMain = () => {
    const current = database.workflowAdjustmentCurrent("p"), proposal = structuredClone(current.snapshot);
    proposal.agents.idea.instructions = "Original Main-authored instructions";
    database.activateNode({ projectId: "p", nodeRunId: "original-node", node: { kind: "agent", nodeId: "main", agentId: "main" },
      activationRequestId: "original-main-activation", inputSnapshotRef: "original-input", activatedByAgentId: "main", workflowRevision: 1 });
    database.appendEvent({ projectId: "p", nodeRunId: "original-node", agentId: "main", invocationId: "original-main", coordinatorEpoch: 1,
      type: "main.route.attempt", payload: { attempt: 1, inputId: "original-input" } });
    database.recordAgentNativeSessionBinding({ projectId: "p", agentId: "main", invocationId: "original-main", session: context.session,
      runtimePath: join(root, "original-main"), worktreePath: join(root, "management"),
      executionContext: { role: "leader", nodeRunId: "original-node", routeScopeId: "original-route", coordinatorEpoch: 1 } });
    const semanticInputHash = hash("original-management-input"), requestId = `accepted-main-control-${semanticInputHash}-0`;
    const { orchestration, ...configuration } = proposal;
    database.revalidateMainRouteControl({ projectId: "p", nodeRunId: "original-node", invocationId: "original-main", routeEpoch: 1,
      stateVersion: 1, candidateNodeIds: ["finish"], canComplete: true, allowFinishRoute: false,
      action: { tool: "apply_workflow", path: "workflow.json", rationale: "Main's exact public rationale" },
      accepted: { requestId, inputId: "original-input", invocationId: "original-main", callId: "original-apply", semanticInputHash,
        workflowProposal: { orchestration, configuration, baseConfigurationHash: database.scopedConfigurationHash("p"), affectedGroupIds: [],
          prestateWorkflowRevision: 1, prestateWorkflowHash: hash(current.snapshot.orchestration), targetWorkflowRevision: 2, proposalHash: hash(orchestration) } } });
    return requestId;
  };
  const notices = workflowAdjustmentNotifications(database, context);
  const observe = (text: string, extra: Record<string, unknown> = {}) => notices.observe({ kind: "user.message", eventId: "actual-native-user-message",
    invocationId: context.invocationId, harnessId: context.session.harnessId, sourceType: "item.completed", itemId: "original-native-message", message: text, ...extra });
  const received = () => database.eventsAfter("p", 0, 1000).filter(event => event.type === "workflow.adjustment.notification.received");
  return { root, clock, options, database, context, submit, apply, acceptMain, notices, observe, received };
}

describe("durable Workflow adjustment native notifications", () => {
  it("lists a large proposal backlog without injecting bodies, retaining every complete proposal on demand", async () => {
    const f = await fixture(), count = 80;
    for (let index = 0; index < count; index++) {
      const requestId = `large-backlog-${index}`;
      f.submit(requestId, "准确保留提案全部原始内容。".repeat(1_200) + index);
      f.database.withdrawWorkflowAdjustment({ projectId: "p", requestId, operationId: `withdraw-${index}`, note: `Original user constraint ${index}` });
    }
    const text = f.notices.prepare("one-lawful-backlog-input");
    const payload = JSON.parse(text.slice(text.indexOf("\n") + 1));
    expect(payload.total).toBe(count); expect(payload.records).toHaveLength(count);
    for (let i = 0; i < count; i++) expect(payload.records.some(record => record.requestId === `large-backlog-${i}`)).toBe(true);
    expect(text).not.toContain("准确保留提案全部原始内容");
    const originals = f.database.workflowAdjustments("p");
    const facts = f.notices.details("one-lawful-backlog-input")[0].records as any[];
    expect(facts).toHaveLength(count);
    for (const fact of facts) {
      const original = originals.find(item => item.requestId === fact.record.requestId)!;
      expect(fact.record.proposal).toEqual(original.proposal); expect(fact.record.changes).toEqual(original.changes);
      expect(fact.transition).toEqual(original.history.at(-1)); expect(fact.record.source).toEqual(original.source);
    }
    f.observe(text.slice(0, -1)); expect(f.received()).toEqual([]);
    f.observe(text); f.observe(text); expect(f.received()).toHaveLength(count);
    expect(f.database.workflowAdjustments("p")).toEqual(originals);
  }, 60_000);

  it.each([2, 3].flatMap(schema => ["main-node", "main-route", "scoped-leader"].map(role => ({ schema, role }))))(
    "wires Main notifications independently of current edit permission in the production coordinator ($schema/$role)", async ({ schema, role }) => {
      const f = await fixture("codex", false); f.submit();
      f.database.withdrawWorkflowAdjustment({ projectId: "p", requestId: "user-one", operationId: "original-withdraw" });
      const current = f.database.workflowAdjustmentCurrent("p"), state = { id: "p", orchestration: { ...current.snapshot.orchestration, schemaVersion: schema },
        agents: current.snapshot.agents, eventSeq: 0 } as unknown as ProjectState;
      const open = vi.fn(), coordinator = new CollaborationRuntimeCoordinator({ storage: new ProjectStorage(f.root, new EventHub()),
        residentLauncher: { open } });
      const db = vi.spyOn(coordinator, "database").mockReturnValue(f.database);
      const request = { project: state, agent: "main", invocationId: "decorated-main-input",
        executionContext: role === "scoped-leader" ? { role: "leader", nodeRunId: "original-node", groupRunId: "original-group", coordinatorEpoch: 2 }
          : { role: "leader", nodeRunId: "original-node", routeScopeId: role, coordinatorEpoch: 2 } } as unknown as AgentRunRequest;
      const internal = coordinator as unknown as { attachRuntimeCallbacks(state: ProjectState, request: AgentRunRequest): void };
      try {
        internal.attachRuntimeCallbacks(state, request);
        let published: unknown;
        const text = await request.onPendingWorkflowAdjustments!("actual-decorated-input", f.context.session, async sources => {
          published = sources; return "fixture-context-index";
        });
        expect(text).toContain('"status":"withdrawn"'); expect(text).not.toContain('"allowMainReconfiguration":false');
        expect(JSON.stringify(published)).toContain('"allowMainReconfiguration":false');
        expect(text).toContain("fixture-context-index");
        expect(f.received()).toEqual([]);
        await request.onNativeUserInput!({ kind: "user.message", eventId: "decorated-native-observation", harnessId: "codex",
          invocationId: request.invocationId, message: text }, f.context.session);
        expect(f.received()).toHaveLength(1); expect(open).not.toHaveBeenCalled(); expect(state.agentSessions).toBeUndefined();
        expect(state.agents).toEqual(current.snapshot.agents);
      } finally { db.mockRestore(); }
    });

  it.each(["codex", "pi", "dsh"])("binds Main's exact withdrawn proposal to actual %s input reception without rewriting its draft or tool receipt", async harness => {
    const f = await fixture(harness), id = f.acceptMain(), original = f.database.workflowAdjustments("p")[0];
    const accepted = f.database.eventsAfter("p", 0, 1000).find(event => event.type === "main.route_action.accepted");
    const draft = join(f.root, "workflow.json"); await writeFile(draft, "Main's unsubmitted draft remains exact");
    f.database.withdrawWorkflowAdjustment({ projectId: "p", requestId: id, operationId: "withdraw-original", note: "Keep my explicit future constraint" });
    const text = f.notices.prepare("next-input");
    expect(text).toContain(id); expect(text).toContain('"status":"withdrawn"');
    const details = JSON.stringify(f.notices.details("next-input"));
    expect(text).not.toContain("Keep my explicit future constraint"); expect(details).toContain("Keep my explicit future constraint");
    expect(details).toContain("Main's exact public rationale"); expect(details).toContain("Original Main-authored instructions");
    expect(details).toContain('"nativeId":"retained-main-session"'); expect(f.received()).toEqual([]);
    f.observe(text);
    expect(f.received()).toMatchObject([{ payload: { requestId: id, status: "withdrawn", inputId: "next-input", nativeEventId: "actual-native-user-message",
      context: f.context, origin: original.source } }]);
    expect(f.database.workflowAdjustments("p")[0].proposal).toEqual(original.proposal);
    expect(f.database.eventsAfter("p", 0, 1000).find(event => event.eventId === accepted?.eventId)).toEqual(accepted);
    expect(await readFile(draft, "utf8")).toBe("Main's unsubmitted draft remains exact");
  });

  it.each(["invocation", "harness", "event", "kind", "preview", "session"])("does not treat a wrong %s observation as delivery", async invalid => {
    const f = await fixture(); f.submit(); f.apply(); const text = f.notices.prepare("input");
    if (invalid === "session") workflowAdjustmentNotifications(f.database, { ...f.context, session: { ...f.context.session, nativeId: "foreign-session" } }).observe({
      kind: "user.message", eventId: "wrong-session", invocationId: f.context.invocationId, harnessId: "codex", message: text });
    else f.observe(text, invalid === "invocation" ? { invocationId: "foreign-turn" } : invalid === "harness" ? { harnessId: "pi" }
      : invalid === "event" ? { eventId: "" } : invalid === "kind" ? { kind: "tool.completed" } : { message: text.slice(0, -1) });
    expect(f.received()).toEqual([]);
  });

  it("includes a withdrawal accepted after early assignment construction on the next legal weak-route input even with Main editing disabled", async () => {
    const f = await fixture("codex", false); expect(f.notices.prepare("early-unused-input")).toBe("");
    f.submit(); f.database.withdrawWorkflowAdjustment({ projectId: "p", requestId: "user-one", operationId: "user-withdraw" });
    const text = f.notices.prepare("actual-weak-input");
    expect(text).toContain('"status":"withdrawn"'); expect(text).not.toContain('"note":');
    expect(JSON.stringify(f.notices.details("actual-weak-input"))).toContain('"allowMainReconfiguration":false');
    expect(f.database.projectState("p").nodeRuns).toEqual([]); expect(f.database.projectState("p").runtimeActivities).toEqual([]);
    f.observe(text); expect(f.received()).toHaveLength(1);
  });

  it("keeps facts accepted after this input binding for the next legal input and never changes the bound snapshot", async () => {
    const f = await fixture(); f.submit(); f.apply(); const first = f.notices.prepare("first-input");
    f.submit("later-user"); f.database.withdrawWorkflowAdjustment({ projectId: "p", requestId: "later-user", operationId: "later-withdraw", note: "Later fact" });
    expect(f.notices.prepare("first-input")).toBe(first); expect(first).not.toContain("later-user");
    f.observe(first); expect(f.received()).toHaveLength(1);
    const next = { ...f.context, invocationId: "next-legitimate-turn" }, notices = workflowAdjustmentNotifications(f.database, next);
    const second = notices.prepare("next-input"); expect(second).toContain("later-user"); expect(second).not.toContain('"requestId":"user-one"');
    notices.observe({ kind: "user.message", eventId: "next-native-input", harnessId: "codex", invocationId: next.invocationId, message: second });
    expect(f.received()).toHaveLength(2);
  });

  it.each([false, true])("preserves unconfirmed facts or deduplicates received facts across a new writer and the retained Session (received=%s)", async received => {
    const f = await fixture(); f.submit(); f.apply(); const text = f.notices.prepare("old-input"); if (received) f.observe(text);
    f.clock.now += 2_000;
    const recovered = CollaborationStateDatabase.open({ ...f.options, instanceId: "writer-two" }); stores.push(recovered);
    const context = { ...f.context, invocationId: "recovered-original-task", session: { ...f.context.session, resumedAt: new Date(f.clock.now).toISOString() } };
    const notices = workflowAdjustmentNotifications(recovered, context), next = notices.prepare("recovered-input");
    if (received) expect(next).toBe("");
    else {
      expect(next).toContain('"requestId":"user-one"');
      notices.observe({ kind: "user.message", eventId: "recovered-native-input", harnessId: "codex", invocationId: context.invocationId, message: next });
      expect(recovered.eventsAfter("p", 0, 1000).filter(event => event.type === "workflow.adjustment.notification.received")).toHaveLength(1);
    }
    expect(recovered.workflowAdjustments("p")[0].status).toBe("applied"); expect(recovered.projectState("p").nodeRuns).toEqual([]);
  });

  it("notifies the affected Agent of the actual version and exposes a complete large proposal on demand", async () => {
    const f = await fixture(); f.submit("large-proposal", "Exact content ".repeat(1_200)); f.apply("large-proposal");
    const context = { ...f.context, agentId: "idea" }, notices = workflowAdjustmentNotifications(f.database, context);
    const text = notices.prepare("affected-worker-input"); expect(text.length).toBeLessThan(4_000);
    const details = notices.details("affected-worker-input")[0].records as any[];
    expect(JSON.stringify(details).length).toBeGreaterThan(40_000);
    expect(text).toContain('"status":"applied"');
    expect(details[0].transition.appliedVersion.revision).toBe(2);
    notices.observe({ kind: "user.message", eventId: "bounded-preview", harnessId: "codex", invocationId: context.invocationId, message: text.slice(0, -1) });
    expect(f.received()).toEqual([]);
    notices.observe({ kind: "user.message", eventId: "full-native-input", harnessId: "codex", invocationId: context.invocationId, message: text });
    expect(f.received()).toHaveLength(1);
    const unrelated = workflowAdjustmentNotifications(f.database, { ...f.context, agentId: "review", invocationId: "unrelated-worker" });
    expect(unrelated.prepare("unrelated-input")).toBe("");
  });

  it("rolls every receipt back together if persistence fails, retaining the original prepared facts for retry", async () => {
    const f = await fixture(); f.submit(); f.apply(); f.submit("second");
    f.database.withdrawWorkflowAdjustment({ projectId: "p", requestId: "second", operationId: "withdraw-second" });
    const text = f.notices.prepare("both-facts"), before = f.database.eventsAfter("p", 0, 1000);
    const raw = new DatabaseSync(f.options.databasePath);
    try {
      raw.exec("CREATE TRIGGER reject_notification_receipt BEFORE INSERT ON project_events WHEN NEW.event_type = 'workflow.adjustment.notification.received' AND json_extract(NEW.payload_json, '$.requestId') = 'second' BEGIN SELECT RAISE(ABORT, 'receipt fixture rejected'); END");
      expect(() => f.observe(text)).toThrow(/receipt fixture rejected/); expect(f.received()).toEqual([]);
      expect(f.database.eventsAfter("p", 0, 1000)).toEqual(before);
      raw.exec("DROP TRIGGER reject_notification_receipt"); f.observe(text); f.observe(text); expect(f.received()).toHaveLength(2);
    } finally { raw.close(); }
  });
});
