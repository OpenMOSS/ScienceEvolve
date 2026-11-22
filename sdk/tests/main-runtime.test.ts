import { afterEach, describe, expect, it, vi } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createMainApplicationRuntime, MAIN_RUNTIME_MARKER, MAIN_RUNTIME_SOURCE_COMMIT, MAIN_RUNTIME_REVISION, type MainApplicationRuntime } from "../src/main-runtime.js";
import { trackResidentOpens } from "../src/core/resident-lifetime.js";
import { CollaborationStateDatabase } from "../src/core/collaboration-state/store.js";
import type { CollaborationResidentLauncher, CollaborationResidentOpenInput } from "../src/core/collaboration-runtime.js";
import { ProductionCollaborationExecutionInputBuilder } from "../src/core/collaboration-runtime.js";
import type { AgentRunner, AgentRunRequest, AgentRunResult } from "../src/core/types.js";
import { harnessCatalogRegistry, toPublicHarnessDescriptor } from "../src/core/harness-runtime/registry.js";

const roots: string[] = [];
const runtimes: MainApplicationRuntime[] = [];
afterEach(async () => {
  await Promise.all(runtimes.splice(0).map((runtime) => runtime.close()));
  vi.restoreAllMocks();
  // Every deletion target was allocated by this test using mkdtemp.
  await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});
async function directory() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-main-sdk-host-"));
  roots.push(root);
  return root;
}
async function host(root: string) {
  const runtime = await createMainApplicationRuntime({ dataDir: root });
  runtimes.push(runtime);
  return runtime;
}

describe("standalone main runtime host (local, no model/GitHub acceptance)", () => {
  it("verifies the pinned main closure without a main checkout", () => {
    const script = fileURLToPath(new URL("../scripts/sync-main-runtime.mjs", import.meta.url));
    const output = execFileSync(process.execPath, [script, "--check"], { cwd: os.tmpdir(), encoding: "utf8" });
    expect(output).toContain(MAIN_RUNTIME_SOURCE_COMMIT);
  });

  it("uses actual SQLite, excludes a competing core writer and reopens the same binding at the next epoch", async () => {
    const root = await directory();
    const first = await host(root);
    expect(first.sourceCommit).toBe(MAIN_RUNTIME_SOURCE_COMMIT);
    expect(first.runtimeRevision).toBe(MAIN_RUNTIME_REVISION);
    expect(JSON.parse(await fs.readFile(path.join(root, MAIN_RUNTIME_MARKER), "utf8"))).toMatchObject({ engine: "main-runtime", schemaVersion: 1 });
    const dbPath = path.join(root, "collaboration-state.sqlite");
    const original = await first.collaborationRuntime.database().writerLease();
    expect(first.collaborationRuntime.writerLeaseHealth()).toMatchObject({ status: "ready", ownership: "lifecycle-lock", epoch: 1 });
    const db = new DatabaseSync(dbPath, { readOnly: true });
    try {
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      expect(tables.length).toBeGreaterThan(10);
      expect(db.prepare("PRAGMA journal_mode").get()?.journal_mode).toBe("delete");
    } finally { db.close(); }
    // This opens the physical database directly; rejection is not the SDK directory guard.
    expect(() => CollaborationStateDatabase.open({ databasePath: dbPath, topology: "single-host", hostId: original.hostId, serviceId: "competing-core" }))
      .toThrow(expect.objectContaining({ code: "WRITER_LEASE_HELD" }));
    expect(await first.collaborationRuntime.database().writerLease()).toEqual(original);
    await Promise.all([first.close(), first.close()]);
    await expect(fs.access(path.join(root, ".scienceevolve-runtime.lock"))).rejects.toMatchObject({ code: "ENOENT" });
    // Windows forbids reading this locked byte range through another handle.
    const sidecar = await fs.readFile(dbPath + ".writer.lock");
    const second = await host(root);
    expect((await second.collaborationRuntime.database().writerLease()).epoch).toBe(original.epoch + 1);
    expect(await second.orchestrator.listProjects()).toEqual([]);
    await second.close();
    expect(await fs.readFile(dbPath + ".writer.lock")).toEqual(sidecar);
  });

  it("does not open the same directory twice and releases its lock on close", async () => {
    const root = await directory();
    const runtime = await host(root);
    await expect(createMainApplicationRuntime({ dataDir: root })).rejects.toThrow(/in use/);
    await runtime.close();
    await expect(fs.access(path.join(root, ".scienceevolve-runtime.lock"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects legacy/source directories without touching their contents", async () => {
    const root = await directory();
    await fs.mkdir(path.join(root, "projects"));
    const evidence = path.join(root, "projects", "existing.json");
    await fs.writeFile(evidence, "user data must stay unchanged");
    await expect(createMainApplicationRuntime({ dataDir: root })).rejects.toThrow(/empty dedicated/);
    expect(await fs.readFile(evidence, "utf8")).toBe("user data must stay unchanged");
    await expect(fs.access(path.join(root, MAIN_RUNTIME_MARKER))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(fs.access(path.join(root, ".scienceevolve-runtime.lock"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("fails closed on another pinned data revision and releases a failed initialization lock", async () => {
    const root = await directory();
    await fs.writeFile(path.join(root, MAIN_RUNTIME_MARKER), JSON.stringify({ engine: "main-runtime", schemaVersion: 1, sourceCommit: "another-revision" }));
    await expect(createMainApplicationRuntime({ dataDir: root })).rejects.toThrow(/explicit migration/);
    await expect(fs.access(path.join(root, ".scienceevolve-runtime.lock"))).rejects.toMatchObject({ code: "ENOENT" });
  });
  it("does not silently reopen pre-fix data with only an upstream commit marker", async () => {
    const root = await directory();
    const marker = JSON.stringify({ engine: "main-runtime", schemaVersion: 1, sourceCommit: MAIN_RUNTIME_SOURCE_COMMIT });
    await fs.writeFile(path.join(root, MAIN_RUNTIME_MARKER), marker);
    await expect(createMainApplicationRuntime({ dataDir: root })).rejects.toThrow(/explicit migration/);
    expect(await fs.readFile(path.join(root, MAIN_RUNTIME_MARKER), "utf8")).toBe(marker);
    await expect(fs.access(path.join(root, ".scienceevolve-runtime.lock"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("starts a Git-off project through the unmodified main Orchestrator (simulated model result)", async () => {
    const root = await directory();
    const run = vi.fn(async (request: AgentRunRequest): Promise<AgentRunResult> => ({
      handoff: "fixture evidence", controlActions: [{
        projectId: request.project.id, agent: request.agent, invocationId: request.invocationId,
        callId: `${request.invocationId}-complete`, stateVersion: request.control!.stateVersion,
        capabilityHash: request.control!.capabilityHash, receivedAt: new Date().toISOString(),
        action: { tool: "complete_project", rationale: "fixture acceptance satisfied" }
      }]
    }));
    const runner: AgentRunner = {
      harnessCatalog: async () => harnessCatalogRegistry.list().map((descriptor) => toPublicHarnessDescriptor(descriptor, { available: true })),
      run
    };
    const runtime = await createMainApplicationRuntime({ dataDir: root, skillRoots: [], internal: {
      runner, residentLauncher: { open: async () => { throw new Error("Git-off project must not launch a resident"); } }
    } });
    runtimes.push(runtime);
    // A declared fixture gateway, not a forged passing probe; the runner is
    // simulated and no HTTP inference request is performed in this test.
    const gateway = await runtime.gatewayStore.create({ name: "fixture", url: "https://93.184.216.34/v1",
      apiKey: "fixture-not-a-live-secret", models: ["fixture-model"], defaultModel: "fixture-model", protocol: "responses" });
    const project = await runtime.orchestrator.createProject({
      title: "SDK main core fixture", requirement: "Complete local deterministic acceptance, not a real model test.",
      git: { enabled: false }, agents: { main: { model: "fixture-model", gatewayId: gateway.id, skills: [], autoSkills: [] } },
      orchestration: {
        agents: [{ name: "main", template: "main" }], input: { source: "input", target: "main" },
        routes: { main: [] }, decisionPlans: { main: "Complete the bounded task" },
        termination: { agent: "main", condition: "Fixture done", decisionBy: "main", automatic: false },
        resultFormat: { presets: [], custom: "" }
      }
    });
    const deadline = Date.now() + 5_000;
    let state = await runtime.orchestrator.getProject(project.id);
    while (!["completed", "paused", "cancelled"].includes(state.status) && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      state = await runtime.orchestrator.getProject(project.id);
    }
    expect(state.status, state.lastError).toBe("completed");
    expect(run).toHaveBeenCalledTimes(1);
    const storedState = await runtime.storage.loadState(project.id);
    const documents = runtime.collaborationRuntime.projectStateDocuments();
    expect(documents.domain(project.id)).toMatchObject({ protocol: "project-state-v1", scheduler: "serial" });
    expect(documents.read(project.id, "project.checkpoint")!.value).toMatchObject({ id: project.id, status: "completed" });
    expect(documents.read(project.id, "sii.ledger")!.value).toEqual({ version: 1, experiments: [], waits: [] });
    const exportedState = path.join(runtime.storage.projectDir(project.id), "state.json");
    expect(JSON.parse(await fs.readFile(exportedState, "utf8"))).toMatchObject({
      formalState: { protocol: "project-state-v1", source: "sqlite" }, view: { status: "completed" }
    });
    // The exported file is a view, not a second scheduler authority. A stale
    // or edited view must not manufacture a paused/completed runtime fact.
    await fs.writeFile(exportedState, JSON.stringify({ id: project.id, status: "paused" }));
    expect((await runtime.storage.loadState(project.id)).status).toBe("completed");
    await runtime.storage.saveState(storedState!);
    const sourceBindings = JSON.parse(await fs.readFile(path.join(root, "source-workspaces", "bindings.json"), "utf8"));
    expect(sourceBindings.projects[project.id]).toBe(null); // raw host API retains explicit no-source semantics
    const builder = new ProductionCollaborationExecutionInputBuilder(runtime.storage, runtime.skills);
    const request = await builder.build({
      state: storedState!, agentId: "main", assignment: "fixture schema lookup",
      executionContext: { role: "leader", nodeRunId: "node-fixture", routeScopeId: "route-fixture", coordinatorEpoch: 1 },
      invocationId: "invocation-fixture", inboxPath: path.join(root, "fixture-inbox"),
      projectPath: runtime.storage.projectDir(project.id), worktreePath: path.join(root, "fixture-worktree"),
      runtimePath: path.join(root, "fixture-runtime")
    });
    expect(path.basename(request.schemaPath)).toBe("main-decision.json");
    await expect(fs.access(request.schemaPath)).resolves.toBeUndefined();
  });

  it("does not request Git credentials or modify profile configuration on initialization", async () => {
    const root = await directory();
    const credentialResolver = vi.fn(async () => ({ token: "fixture-not-a-live-secret", requestedScopes: ["repo"] }));
    const runtime = await createMainApplicationRuntime({ dataDir: root, git: { credentialResolver } });
    runtimes.push(runtime);
    expect(credentialResolver).not.toHaveBeenCalled();
    expect((await fs.readdir(root)).sort()).not.toContain("auth.json");
    expect((await fs.readdir(root)).sort()).not.toContain("config.toml");
  });

  it("requires absolute paths", async () => {
    await expect(createMainApplicationRuntime({ dataDir: "relative-dir" })).rejects.toThrow(/absolute/);
  });
});

describe("shared resident Stop guard", () => {
  it("tracks a route's admitted opener and preserves native handle extensions", async () => {
    let permitStop = false;
    const adapter = { async open() { return {
      initialLease: { session: { nativeId: "route-only" } },
      async probe() { return this.initialLease; },
      async close() { if (!permitStop) throw new Error("route native still alive"); }
    }; } };
    const native = trackResidentOpens(adapter);
    const launcher = { open: async () => { throw new Error("ordinary open was not called"); },
      async decideRoute(openResident: typeof native.launcher.open) {
        const route = await openResident();
        expect((await route.probe()).session.nativeId).toBe("route-only");
        await route.close();
      }
    };
    await expect(launcher.decideRoute(native.launcher.open)).rejects.toThrow(/route native still alive/);
    await expect(native.stopRemaining()).rejects.toThrow(/Stop was not confirmed/);
    permitStop = true;
    await native.stopRemaining();
  });
  it("retains failed stops, preserves method receivers and allows a later proven stop", async () => {
    let permitStop = false;
    const close = vi.fn(async () => { if (!permitStop) throw new Error("native still alive"); });
    const target = {
      proof: "bound receiver",
      async open() { return { close, submit: async () => ({ handoff: "fixture" }), pause: async () => {}, resume: async () => {} }; },
      stopForRecovery() { expect(this.proof).toBe("bound receiver"); return Promise.resolve({ stopped: true, evidence: {} }); }
    };
    const tracking = trackResidentOpens(target as CollaborationResidentLauncher);
    const handle = await tracking.launcher.open({} as CollaborationResidentOpenInput);
    await expect(handle.close()).rejects.toThrow(/native still alive/);
    await expect(tracking.stopRemaining()).rejects.toThrow(/Stop was not confirmed/);
    await tracking.launcher.stopForRecovery!({} as never);
    permitStop = true;
    await tracking.stopRemaining();
    const count = close.mock.calls.length;
    await tracking.stopRemaining();
    expect(close).toHaveBeenCalledTimes(count);
  });
});
