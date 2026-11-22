import { afterEach, describe, expect, it } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { CollaborationStateDatabase } from "../../src/core/collaboration-state/index.js";
import { initializeCollaborationStateSchema } from "../../src/core/collaboration-state/schema.js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { WorkflowGateSession, requireGateChoice, gateRunId, gateFeedback, type GateRun, type GateJournal, type GateOrigin } from "../../src/core/workflow-gate.js";
import { gateMatchingTargets, workflowGateConfigurationErrors, type WorkflowGate } from "../../src/core/internal/shared/workflow-gate.js";
import type { HarnessEvent } from "../../src/core/harness-runtime/contracts.js";
const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map(root => fs.rm(root, { recursive: true, force: true }))); });
const gate: WorkflowGate = { id: "quality", name: "Quality", verifier: { kind: "code", interpreter: "node", output: "json",
  code: 'console.log(JSON.stringify({score: JSON.parse(Buffer.from(process.env.SCIENCEEVOLVE_GATE_INPUT_BASE64,"base64").toString()).score, cwd:process.cwd()}))' },
  rules: [ { target: "high", all: [{ path: ["score"], operator: "gte", value: 80 }] },
    { target: "middle", all: [{ path: ["score"], operator: "gte", value: 60 }, { path: ["score"], operator: "lt", value: 80 }] },
    { target: "low", all: [{ path: ["score"], operator: "lt", value: 60 }] } ] };
async function fixture(definition = gate, score = 76) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-gate-")); roots.push(root);
  const records = new Map<string, GateRun>();
  const journal: GateJournal = { read: async id => records.has(id) ? structuredClone(records.get(id)!) : undefined,
    save: async (run, expected) => { if ((records.get(run.id)?.version ?? 0) !== expected) throw new Error("conflict");
      records.set(run.id, structuredClone(run)); return run; } };
  const origin: GateOrigin = { projectId: "p", executionId: "task1", sourceRunId: "arrival1", nodeId: "worker", agentId: "worker",
    invocationId: "inv1", workspacePath: root, workflowRevision: 1, scopeId: "loop1", input: { score, originalTask: "research" } };
  const targets = definition.rules ? ["high", "middle", "low"] : ["next"];
  const session = new WorkflowGateSession(origin, [{ gate: definition, targets }], journal, { agentId: "worker", invocationId: "inv1" }, async () => {});
  return { root, records, origin, journal, session, targets, read: () => journal.read(gateRunId(origin, definition.id)) };
}
function event(kind: "tool.started" | "tool.completed" | "tool.failed", command?: string, output?: string): HarnessEvent {
  return { schemaVersion: 1, eventId: kind, seq: 1, timestamp: new Date().toISOString(), invocationId: "inv1", harnessId: "fixture",
    kind, phase: kind === "tool.started" ? "started" : kind === "tool.failed" ? "failed" : "completed",
    tool: { name: "bash", toolType: "shell", callId: "actual-tool-call", status: kind.slice(5) as "started" | "completed" | "failed",
      ...(command ? { input: { command } } : {}), ...(output !== undefined ? { outputPreview: output } : {}), ...(kind === "tool.failed" ? { isError: true } : {}) } };
}
async function execute(session: WorkflowGateSession) {
  const prepared = await session.request({ operation: "prepare", gateId: "quality" }, "prepare") as GateRun;
  await session.observe(event("tool.started", prepared.command));
  const output = await promisify(execFile)("bash", ["-c", prepared.command!]);
  await session.observe(event("tool.completed", undefined, output.stdout));
}
describe("Workflow Gate actual execution contract", () => {
  it.each([[90,"high"],[76,"middle"],[25,"low"]])("GT-01/03 executes in the predecessor context and routes score %s", async (score,target) => {
    const f = await fixture(gate, score as number); await execute(f.session);
    expect((await f.read())?.result).toEqual({ score, cwd: f.root });
    await expect(f.session.request({ operation: "choose", gateId: "quality", target: target === "high" ? "low" : "high" }, "bad")).rejects.toThrow("rejects path");
    await f.session.request({ operation: "choose", gateId: "quality", target }, "choose");
    const choice = requireGateChoice(await f.read(), f.origin, "quality");
    expect(choice.selectedTarget).toBe(target);
    expect(gateFeedback(choice)).toContain('"originalTask":"research"');
    expect(choice.evidence?.callId).toBe("actual-tool-call");
  });
  it("GT-04 passes negative feedback on a sole unfiltered edge", async () => {
    const f = await fixture({ ...gate, rules: undefined, verifier: { kind: "code", interpreter: "node", output: "text", code: 'console.log("The experiment is unsuccessful")' } });
    await execute(f.session);
    expect(requireGateChoice(await f.read(), f.origin, "quality").selectedTarget).toBe("next");
  });
  it("GT-05 rejects self-report, unrelated calls, unstarted output and altered frozen evidence", async () => {
    const f = await fixture();
    await f.session.request({ operation: "prepare", gateId: "quality" }, "prepare");
    await expect(f.session.request({ operation: "report", gateId: "quality", result: { score: 100 } }, "invented")).rejects.toThrow("Self-reported");
    await f.session.observe(event("tool.started", "echo '{\"score\":100}'"));
    await f.session.observe(event("tool.completed", undefined, '{"score":100}'));
    expect((await f.read())?.status).toBe("prepared");
    await execute(f.session);
    await f.session.request({ operation: "choose", gateId: "quality", target: "middle" }, "choose");
    expect(() => requireGateChoice(awaited(f.records), { ...f.origin, sourceRunId: "other-arrival" }, "quality")).toThrow("this execution");
    const changed = { ...await f.read()!, inputHash: "invented" } as GateRun;
    expect(() => requireGateChoice(changed, f.origin, "quality")).toThrow("binding");
  });
  it("GT-06/07 preserves execution errors and unknown calls without automatic rerun", async () => {
    const f = await fixture(); const prepared = await f.session.request({ operation: "prepare", gateId: "quality" }, "prepare") as GateRun;
    await f.session.observe(event("tool.started", prepared.command));
    const resumed = new WorkflowGateSession(f.origin, [{ gate, targets: f.targets }], f.journal, { agentId: "worker", invocationId: "inv1" }, async () => {});
    await expect(resumed.request({ operation: "prepare", gateId: "quality" }, "resume")).rejects.toThrow("unknown");
    await resumed.observe(event("tool.failed", undefined, "missing dependency"));
    expect(await f.read()).toMatchObject({ status: "error", error: "Gate tool failed: missing dependency" });
    expect(() => requireGateChoice(awaited(f.records), f.origin, "quality")).toThrow("missing dependency");
  });
  it.each([
    ['{}', 'missing required field'],
    ['{"score":"76"}', 'finite number'],
    ['not-json', 'valid JSON']
  ])("GT-06 retains invalid output %s as a contract failure", async (output, error) => {
    const f = await fixture();
    const run = await f.session.request({ operation: "prepare", gateId: "quality" }, "prepare") as GateRun;
    await f.session.observe(event("tool.started", run.command));
    await f.session.observe(event("tool.completed", undefined, output));
    expect(await f.read()).toMatchObject({ status: "error", error: expect.stringContaining(error) });
    expect((await f.read())?.selectedTarget).toBeUndefined();
  });
  it("GT-04/06 preserves multi-match choice and rejects no-match and truncated results", async () => {
    const rules = [{ target: "a", all: [{ path: ["score"], operator: "gte" as const, value: 80 }] },
      { target: "b", all: [{ path: ["score"], operator: "gte" as const, value: 70 }] }];
    expect(gateMatchingTargets({ ...gate, rules }, ["a", "b"], { score: 90 })).toEqual(["a", "b"]);
    expect(() => gateMatchingTargets({ ...gate, rules }, ["a", "b"], { score: 60 })).toThrow("no outgoing path");
    const f = await fixture(); const run = await f.session.request({ operation: "prepare", gateId: "quality" }, "prepare") as GateRun;
    await f.session.observe(event("tool.started", run.command));
    const output = event("tool.completed", undefined, '{"score":90}'); output.tool!.truncated = true;
    await f.session.observe(output);
    expect(await f.read()).toMatchObject({ status: "error", error: "Gate tool output is truncated" });
  });
  it("rejects unsupported Gate combinations at the configuration boundary", () => {
    const definition = { ...gate, rules: undefined };
    const workflow = { agents: [{ name: "worker" }], gates: [definition], input: { target: "quality" },
      routes: { quality: [{ target: "worker" }] }, loops: [{ from: "quality" }] };
    expect(workflowGateConfigurationErrors(workflow)).toEqual(expect.arrayContaining([
      expect.stringContaining("Input cannot execute code"), expect.stringContaining("iteration-limit exit")
    ]));
    expect(workflowGateConfigurationErrors({ ...workflow, loops: [], input: { target: "worker" },
      gates: [definition, { ...definition, id: "second" }], routes: { quality: [{ target: "second" }], second: [{ target: "worker" }] } }))
      .toEqual([expect.stringContaining("between consecutive code Gates")]);
  });
  it("GT-02 binds the configured checker result to its actual invocation", async () => {
    const definition: WorkflowGate = { id: "quality", name: "Review", verifier: { kind: "agent", agentId: "reviewer", instructions: "Assess the submitted evidence" } };
    const f = await fixture(definition); await f.session.request({ operation: "prepare", gateId: "quality" }, "prepare");
    await expect(f.session.request({ operation: "report", gateId: "quality", result: "feedback" }, "wrong")).rejects.toThrow("different checker");
    const checker = new WorkflowGateSession(f.origin, [{ gate: definition, targets: f.targets }], f.journal, { agentId: "reviewer", invocationId: "review1" }, async () => {});
    await checker.bindChecker("quality");
    await checker.request({ operation: "report", gateId: "quality", result: { category: "needs changes", notes: ["missing comparison"] } }, "real-report");
    expect(requireGateChoice(await f.read(), f.origin, "quality")).toMatchObject({ selectedTarget: "next", evidence: { invocationId: "review1", callId: "real-report" } });
  });
});
function awaited(records: Map<string, GateRun>) { return [...records.values()][0]; }

describe("Workflow Gate durable execution and migration", () => {
  it("retains exact results across reopen and publishes a code Gate route only once", async () => {
    const f = await fixture({ ...gate, rules: undefined });
    const file = path.join(f.root, "state.sqlite");
    const options = { databasePath: file, serviceId: "test", instanceId: "test", hostId: "test", topology: "single-host" as const };
    let db = CollaborationStateDatabase.open(options);
    try {
      db.createProject({ projectId: "p", workflowRevision: 1, workflowSnapshot: { agents: [{ name: "worker" }], gates: [gate] },
        git: { enabled: false, status: "disabled" }, workerCapacity: 1, managementCapacity: 1 });
      const origin = { ...f.origin, scopeId: undefined, sourceRunId: "predecessor" };
      const journal: GateJournal = { read: async id => db.workflowGate("p", id), save: async (run, version) => db.saveWorkflowGate(run, version) };
      const session = new WorkflowGateSession(origin, [{ gate: { ...gate, rules: undefined }, targets: ["next"] }], journal,
        { agentId: "worker", invocationId: "inv1" }, async () => {});
      await execute(session);
      const recorded = (await journal.read(gateRunId(origin, gate.id)))!;
      db.activateNode({ projectId: "p", nodeRunId: "predecessor", node: { kind: "agent", nodeId: "main", agentId: "main" },
        workflowRevision: 1, activationRequestId: "first", inputSnapshotRef: "input", activatedByAgentId: "main" });
      db.completeManagementNode({ projectId: "p", nodeRunId: "predecessor", output: "original input", routeEmissionId: "route-first", route: { kind: "fixed", targetNodeId: gate.id } });
      db.activateNode({ projectId: "p", nodeRunId: "check", node: { kind: "gate", gateId: gate.id, nodeId: gate.id, agentId: "worker" },
        gateRunId: recorded.id, workflowRevision: 1, activationRequestId: "gate-entry", inputSnapshotRef: "route-first", sourceNodeRunId: "predecessor", activatedByAgentId: "worker" });
      expect(db.completeCodeGateNode("p", "check")).toMatchObject({ replay: false, outbox: { targetNodeId: "next" } });
      expect(db.completeCodeGateNode("p", "check")).toMatchObject({ replay: true });
      expect(db.projectState("p").executions).toHaveLength(0);
      const lease = db.writerLease(); db.close(); db = CollaborationStateDatabase.open({ ...options, writerLease: lease });
      expect(db.workflowGate("p", recorded.id)).toEqual(recorded);
      expect(db.completeCodeGateNode("p", "check").outbox.payload.output).toContain('"originalTask":"research"');
      expect(() => db.saveWorkflowGate({ ...recorded, version: recorded.version + 1, inputHash: "changed" }, recorded.version)).toThrow("immutable");
    } finally { db.close(); }
  });
  it("migrates v28 node and arrival constraints while preserving records and references", async () => {
    const f = await fixture();
    const file = path.join(f.root, "migration.sqlite");
    const options = { databasePath: file, serviceId: "test", instanceId: "test", hostId: "test", topology: "single-host" as const };
    const owner = CollaborationStateDatabase.open(options);
    owner.createProject({ projectId: "preserved", workflowRevision: 1, workflowSnapshot: { agents: [] },
      git: { enabled: false, status: "disabled" }, workerCapacity: 1, managementCapacity: 1 });
    const lease = owner.writerLease(); owner.close();
    const db = new DatabaseSync(file);
    try {
      db.exec("PRAGMA foreign_keys=OFF; PRAGMA legacy_alter_table=ON; BEGIN IMMEDIATE");
      for (const table of ["node_runs", "scoped_arrivals"]) {
        db.exec(`ALTER TABLE ${table} DROP COLUMN gate_run_id`);
        const row = db.prepare("SELECT sql FROM sqlite_schema WHERE name=? AND type='table'").get(table) as { sql: string };
        const auxiliary = db.prepare("SELECT sql FROM sqlite_schema WHERE tbl_name=? AND sql IS NOT NULL AND type IN ('index','trigger')").all(table) as { sql: string }[];
        const sql = row.sql.replace(`CREATE TABLE ${table}`, `CREATE TABLE ${table}_v28`)
          .replace("IN ('agent','collaboration','gate')", "IN ('agent','collaboration')")
          .replace("IN ('agent','gate') AND", "= 'agent' AND");
        db.exec(sql); db.exec(`DROP TABLE ${table}; ALTER TABLE ${table}_v28 RENAME TO ${table}`);
        for (const item of auxiliary) db.exec(item.sql);
      }
      db.exec("UPDATE collaboration_state_meta SET schema_version=28; COMMIT; PRAGMA legacy_alter_table=OFF; PRAGMA foreign_keys=ON");
      initializeCollaborationStateSchema(db, { writerLease: lease, nowMs: Date.now() });
      expect(db.prepare("SELECT project_id FROM project_heads").all()).toEqual([{ project_id: "preserved" }]);
      expect(db.prepare("SELECT schema_version FROM collaboration_state_meta").get()).toMatchObject({ schema_version: 29 });
      expect(db.prepare("PRAGMA foreign_key_check").all()).toEqual([]);
      for (const table of ["node_runs", "scoped_arrivals"]) {
        expect(db.prepare(`PRAGMA table_info(${table})`).all()).toEqual(expect.arrayContaining([expect.objectContaining({ name: "gate_run_id" })]));
        expect(String(db.prepare("SELECT sql FROM sqlite_schema WHERE name=?").get(table)!.sql)).toContain("'gate'");
      }
    } finally { db.close(); }
  });
});
