import { afterEach, describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { createMainSdkClient, type MainResearchSdk } from "../src/main-client.js";
import { createMainApplicationRuntime, type MainApplicationRuntime, type MainApplicationRuntimeOptions } from "../src/main-runtime.js";
import { loadMainWorkflowConfig, validateMainWorkflowConfig } from "../src/main-config.js";
import type { AgentRunner, AgentRunRequest, AgentRunResult, ControlActionEnvelope } from "../src/core/types.js";
import { harnessCatalogRegistry, toPublicHarnessDescriptor } from "../src/core/harness-runtime/registry.js";
import { nativeProtocolForHarness, type AdapterSmokeProbeRunner } from "../src/core/agent-runtime.js";
import { PROTOCOL_ROUTER_COMPATIBILITY_VERSION } from "../src/core/protocol-router.js";
import { ControlActionService, startControlActionBridge } from "../src/core/orchestration-control-bridge.js";

const roots: string[] = [], sdks: MainResearchSdk[] = [], runtimes: MainApplicationRuntime[] = [];
afterEach(async () => {
  await Promise.all(sdks.splice(0).map((sdk) => sdk.close()));
  await Promise.all(runtimes.splice(0).map((runtime) => runtime.close()));
  await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 })));
});
function workflow(maxIterations = 2) {
  const names = ["main", "measure", "assess", "revise"];
  return validateMainWorkflowConfig({ git: { enabled: false },
    agents: Object.fromEntries(names.map((name) => [name, { harness: "codex", model: "fixture", skills: [], autoSkills: [] }])),
    orchestration: { schemaVersion: 2, collaborations: [], agents: names.map((name) => ({ name })),
      input: { source: "input", target: "measure" },
      routes: { main: [], measure: [{ target: "assess", kind: "strong" }], assess: [{ target: "revise", kind: "strong" }], revise: [{ target: "measure", kind: "strong" }] },
      loops: [{ id: "refinement", from: "assess", to: "revise", maxIterations, exitTo: "main" }],
      decisionPlans: Object.fromEntries(names.map((name) => [name, "Use measured evidence"])), allowMainReconfiguration: true,
      termination: { agent: "main", condition: "Measured evidence and final deliverable accepted", decisionBy: "main", automatic: false } } });
}
function action(request: AgentRunRequest, value: ControlActionEnvelope["action"]): AgentRunResult {
  return { handoff: "Recorded evidence", controlActions: [{ projectId: request.project.id, agent: request.agent,
    invocationId: request.invocationId, callId: `${request.invocationId}-action`, stateVersion: request.control!.stateVersion,
    capabilityHash: request.control!.capabilityHash, receivedAt: new Date().toISOString(), action: value }] };
}
const complete = (request: AgentRunRequest) => action(request, { tool: "complete_project", rationale: "Evidence and output accepted" });
const probeFetch: typeof fetch = async (_url, init) => {
  const body = JSON.parse(String(init?.body));
  const output = body.tool_choice ? [{ type: "function_call", call_id: "probe", name: "openfars_probe", arguments: '{"value":"ok"}' }]
    : [{ type: "message", content: [{ type: "output_text", text: "ok" }] }];
  return body.stream
    ? new Response(`data: ${JSON.stringify({ type: "response.completed", response: { status: "completed", output } })}\n\n`, { headers: { "content-type": "text/event-stream" } })
    : Response.json({ status: "completed", error: null, output });
};
// Explicit deterministic smoke seam: this is not a real Harness verification.
const identity = { cacheKey: "loop-fixture", adapterVersion: "fixture-1", executableFingerprint: "fixture-executable",
  routerCompatibilityVersion: PROTOCOL_ROUTER_COMPATIBILITY_VERSION };
const smoke: AdapterSmokeProbeRunner = { harnessIds: () => ["codex"], nativeProtocol: nativeProtocolForHarness,
  cacheKey: async () => identity, runSmoke: async () => identity };
async function fixture(run: AgentRunner["run"], existing?: string, execution?: MainApplicationRuntimeOptions["execution"]) {
  const root = existing ?? await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-main-loops-")); if (!existing) roots.push(root);
  const runtime = await createMainApplicationRuntime({ dataDir: root, skillRoots: [], execution,
    gatewayOptions: { fetch: probeFetch, adapterSmokeProbe: smoke }, internal: {
    runner: { run, harnessCatalog: async () => harnessCatalogRegistry.list().map((descriptor) => toPublicHarnessDescriptor(descriptor, { available: true })) },
    residentLauncher: { open: async () => { throw new Error("Git-off must not use residents"); } }
  } }); runtimes.push(runtime);
  const sdk = await createMainSdkClient(runtime); sdks.push(sdk);
  const gateway = (await sdk.gateways.list())[0] ?? await sdk.gateways.add({ name: "Loop fixture", url: "https://93.184.216.34/v1", apiKey: "opaque-loop-fixture",
    protocol: "responses", models: ["fixture"], defaultModel: "fixture",
    modelReasoning: { fixture: { parameter: "reasoning.effort", options: [{ id: "high", label: "High", value: "high" }] } } });
  expect((await sdk.gateways.test(gateway.id, "codex", "fixture")).status).toBe("passed");
  return { sdk, runtime, root, gatewayBindings: { defaultGatewayId: gateway.id } };
}
describe("main-kernel Git-off Loop/Evolver parity (actual kernel/SQLite; simulated Agents)", () => {
  it("matches the legacy two-batch golden trace without a second loop engine", async () => {
    const golden = JSON.parse(await fs.readFile(new URL("./fixtures/runtime-parity.json", import.meta.url), "utf8")).loopTwoBatches;
    const calls: string[] = []; let decisions = 0;
    const { sdk, runtime, gatewayBindings } = await fixture(async (request) => {
      calls.push(request.agent);
      if (request.agent !== "main") return { handoff: "Measured evidence" };
      expect(request.project.pendingMainDecision?.reason).toBe("loop-limit");
      return ++decisions === 1 ? action(request, { tool: "route_to_agent", target: "revise", assignment: "Start next batch" }) : complete(request);
    });
    const run = await sdk.start({ title: "Loop parity", requirement: "Two bounded batches", workflow: workflow(), gatewayBindings });
    const result = await run.wait({ signal: AbortSignal.timeout(10_000) });
    expect(calls).toEqual(golden.agentCalls); expect(result).toMatchObject(golden.state);
    const events = await runtime.storage.readEvents(run.id);
    expect(events.filter(({ type }) => type === "workflow.loop.batch.started").map(({ data }) => data?.batch)).toEqual(golden.events.batchStarted);
    expect(events.filter(({ type }) => type === "workflow.loop.iteration")).toHaveLength(golden.events.iterationCount);
    expect(events.filter(({ type }) => type === "workflow.loop.exhausted")).toHaveLength(golden.events.exhaustedCount);
  });
  it("commits Main/Worker prompt evolution and a new batch budget, and preserves completed history on reopen", async () => {
    let decisions = 0, revisedCalls = 0;
    let authority!: ControlActionService;
    const session = { schemaVersion: 1 as const, harnessId: "codex", adapterVersion: "fixture",
      nativeId: "original-evolution-main", generation: 0, durable: true, createdAt: new Date().toISOString() };
    const { sdk, runtime, root, gatewayBindings } = await fixture(async (request) => {
      if (request.agent !== "main") {
        if (request.agent === "revise" && decisions >= 2) {
          revisedCalls++; expect(request.project.agents.revise.instructions).toContain("EVOLVED_WORKER");
        }
        return { handoff: "Measured evidence" };
      }
      await request.onDurableSessionStarted?.(session, session.nativeId);
      const acceptedAction = async (value: ControlActionEnvelope["action"]): Promise<AgentRunResult> => {
        const accepted = await authority.stageWithResult(request.control!.capability, `${request.invocationId}-action`, value);
        return { threadId: session.nativeId, handoff: "Recorded evidence", controlActions: [accepted.envelope] };
      };
      if (++decisions === 1) {
        const file = path.join(request.workspacePath, "workflow.json");
        const proposal = JSON.parse(await fs.readFile(file, "utf8"));
        expect(proposal.editableFields).toContain("agents");
        expect(JSON.stringify(proposal)).not.toContain("opaque-loop-fixture");
        proposal.agents.main.instructions = "EVOLVED_MAIN";
        proposal.agents.revise.instructions = "EVOLVED_WORKER";
        proposal.orchestration.loops[0].maxIterations = 1;
        await fs.writeFile(file, JSON.stringify(proposal));
        return acceptedAction({ tool: "apply_workflow", path: "workflow.json", rationale: "Improve method based on evidence" });
      }
      expect(request.project.agents.main.instructions).toContain("EVOLVED_MAIN");
      if (decisions === 2) {
        expect(request.resumeThreadId).toBe(session.nativeId);
        expect(request.project.pendingMainDecision?.reason).toBe("workflow-reconfigured");
        return acceptedAction({ tool: "route_to_agent", target: "revise", assignment: "Evaluate revised method" });
      }
      return acceptedAction({ tool: "complete_project", rationale: "Evidence and output accepted" });
    }, undefined, { controlBridgeFactory: async (service, bridgePath) => {
      authority = service; return startControlActionBridge(service, bridgePath);
    } });
    const run = await sdk.start({ title: "Evolver", requirement: "Evolve and evaluate", workflow: workflow(), gatewayBindings });
    const result = await run.wait({ signal: AbortSignal.timeout(10_000) });
    expect(result, JSON.stringify((await runtime.storage.readEvents(run.id)).filter(({ type }) => /failed|rejected|error/.test(type)))).toMatchObject({ status: "completed", loopBatches: { refinement: 2 }, loopTotalIterations: { refinement: 3 } });
    expect(revisedCalls).toBe(1);
    expect((await runtime.storage.readEvents(run.id)).filter(({ type }) => type === "workflow.reconfigured")).toHaveLength(1);
    await sdk.close();
    const reopened = await fixture(async () => { throw new Error("Completed work must not restart"); }, root);
    const saved = await reopened.runtime.storage.loadState(run.id);
    expect(saved.agents.main.instructions).toBe("EVOLVED_MAIN");
    expect(saved.agents.revise.instructions).toBe("EVOLVED_WORKER");
    expect(saved.agentSessions?.main).toEqual(session);
    expect(saved.orchestration.loops?.[0].maxIterations).toBe(1);
    expect((await (await reopened.sdk.getRun(run.id)).snapshot()).status).toBe("completed");
  });
  it("does not reset a batch or replay a committed iteration when paused and reopened", async () => {
    let release!: () => void, entered!: () => void;
    const entry = new Promise<void>((resolve) => { entered = resolve; });
    const gate = new Promise<void>((resolve) => { release = resolve; });
    let held = false;
    const { sdk, root, gatewayBindings } = await fixture(async (request) => {
      if (request.agent === "revise" && !held) { held = true; entered(); await gate; }
      return request.agent === "main" ? complete(request) : { handoff: "Measured evidence" };
    });
    const run = await sdk.start({ title: "Pause loop", requirement: "Do not repeat committed work", workflow: workflow(), gatewayBindings });
    await entry;
    try { await run.pause(); } finally { release(); }
    expect((await run.wait({ signal: AbortSignal.timeout(10_000) })).status).toBe("paused");
    const before = await run.snapshot(); await sdk.close();
    const calls: string[] = [];
    const reopened = await fixture(async (request) => { calls.push(request.agent); return request.agent === "main" ? complete(request) : { handoff: "Measured evidence" }; }, root);
    const recovered = await reopened.sdk.getRun(run.id);
    expect((await recovered.snapshot()).loopTotalIterations).toEqual(before.loopTotalIterations);
    await recovered.resume();
    expect(await recovered.wait({ signal: AbortSignal.timeout(10_000) })).toMatchObject({ status: "completed", loopBatches: { refinement: 1 }, loopTotalIterations: { refinement: 2 } });
    expect(calls[0]).toBe("measure");
    expect(calls.filter((name) => name === "revise")).toHaveLength(1);
  });
  it("rejects invalid Loop topology and budgets using main validation", () => {
    const input = workflow(); input.orchestration.loops![0].maxIterations = 0;
    expect(() => validateMainWorkflowConfig(input)).toThrow();
    input.orchestration.loops![0].maxIterations = 2; input.orchestration.routes.revise = [];
    expect(() => validateMainWorkflowConfig(input)).toThrow(/Loop|loop/);
  });
  it("rejects edits to locked runtime policy without partially committing the evolved prompt", async () => {
    let decisions = 0;
    const { sdk, runtime, gatewayBindings } = await fixture(async (request) => {
      if (request.agent !== "main") return { handoff: "Measured evidence" };
      if (++decisions === 1) {
        const file = path.join(request.workspacePath, "workflow.json");
        const proposal = JSON.parse(await fs.readFile(file, "utf8"));
        proposal.agents.main.instructions = "MUST_NOT_COMMIT";
        proposal.lockedRuntime.main.permission = proposal.lockedRuntime.main.permission === "yolo" ? "workspace" : "yolo";
        await fs.writeFile(file, JSON.stringify(proposal));
        return action(request, { tool: "apply_workflow", path: "workflow.json", rationale: "Invalid permission edit" });
      }
      expect(request.project.pendingMainDecision?.reason).toBe("workflow-reconfiguration-rejected");
      expect(request.project.agents.main.instructions).not.toContain("MUST_NOT_COMMIT");
      return complete(request);
    });
    const run = await sdk.start({ title: "Rejected evolution", requirement: "Do not weaken policy", workflow: workflow(1), gatewayBindings });
    const result = await run.wait({ signal: AbortSignal.timeout(10_000) });
    expect(result.status, JSON.stringify((await runtime.storage.readEvents(run.id)).filter(({ type }) => /failed|rejected/.test(type)).map(({ data }) => data))).toBe("completed");
    const events = await runtime.storage.readEvents(run.id);
    expect(events.filter(({ type }) => type === "workflow.reconfiguration.rejected")).toHaveLength(1);
    expect(events.some(({ type }) => type === "workflow.reconfigured")).toBe(false);
  });
  it("preserves batches when Evolver is disabled and does not expose its control capability", async () => {
    const input = workflow(1); input.orchestration.allowMainReconfiguration = false;
    const { sdk, runtime, gatewayBindings } = await fixture(async (request) => {
      if (request.agent !== "main") return { handoff: "Measured evidence" };
      expect(request.project.mainInvocationContext?.canReconfigure).toBe(false);
      expect(await fs.readFile(request.inboxPath, "utf8")).not.toContain("## Dynamic Workflow reconfiguration");
      return complete(request);
    });
    const run = await sdk.start({ title: "No Evolver", requirement: "Complete one batch", workflow: input, gatewayBindings });
    const result = await run.wait({ signal: AbortSignal.timeout(10_000) });
    expect(result, JSON.stringify((await runtime.storage.readEvents(run.id)).filter(({ type }) => /failed|rejected/.test(type)).map(({ data }) => data))).toMatchObject({ status: "completed", loopBatches: { refinement: 1 }, loopTotalIterations: { refinement: 1 } });
    expect((await runtime.storage.readEvents(run.id)).some(({ type }) => type === "workflow.reconfigured")).toBe(false);
  });
});

// Real migrated JSON + actual main scheduler/storage, with simulated model
// decisions and real Node execution. No scientific-result claim is made.
describe("migrated examples on the default main kernel", () => {
  async function example(name: string) {
    const config = await loadMainWorkflowConfig(fileURLToPath(new URL(`../../example/${name}/workflow.json`, import.meta.url)));
    // Only substitute the model provider; retain permissions, reasoning, routes,
    // loop budgets, decision/termination rules and the shared-workspace mode.
    for (const agent of Object.values(config.agents)) agent.model = "fixture";
    return config;
  }
  it("runs the AHE template's baseline and two complete batches", async () => {
    const calls: string[] = []; let batches = 0;
    const { sdk, gatewayBindings } = await fixture(async request => {
      calls.push(request.agent);
      if (request.agent !== "main") return { handoff: "Deterministic migration fixture evidence" };
      expect(request.project.pendingMainDecision?.reason).toBe("loop-limit");
      return ++batches === 1 ? action(request, { tool: "route_to_agent", target: "optimizer", assignment: "Next batch" }) : complete(request);
    });
    expect((await sdk.gateways.test(gatewayBindings.defaultGatewayId, "codex", "fixture", { reasoningOptionId: "high" })).status).toBe("passed");
    const run = await sdk.start({ title: "Migrated AHE fixture", requirement: "Two batches", workflow: await example("01-ahe-evolve"), gatewayBindings });
    expect(await run.wait({ signal: AbortSignal.timeout(15_000) })).toMatchObject({ status: "completed", loopBatches: { code_evolution: 2 }, loopTotalIterations: { code_evolution: 6 } });
    expect(calls).toEqual(["execute", "judge", ...Array.from({ length: 2 }, () => [...Array.from({ length: 3 }, () => ["optimizer", "execute", "judge"]).flat(), "main"]).flat()]);
  });
  it("preserves a shared Task and failed-test evidence through pause/reopen/repair", async () => {
    const calls: string[] = [], workspaces = new Set<string>();
    let entered!: () => void, release!: () => void;
    const entry = new Promise<void>(resolve => { entered = resolve; });
    const gate = new Promise<void>(resolve => { release = resolve; });
    let codingTurns = 0, testingTurns = 0;
    const runner: AgentRunner["run"] = async request => {
      calls.push(request.agent); workspaces.add(request.workspacePath);
      expect(request.project.agents[request.agent].gatewayReasoningOption).toBe("high");
      if (request.agent === "coding") {
        const file = path.join(request.workspacePath, "add.cjs");
        if (++codingTurns > 1) {
          expect(JSON.parse(await fs.readFile(path.join(request.workspacePath, "test-1.json"), "utf8")).passed).toBe(false);
          expect(await fs.readFile(file, "utf8")).toContain("a - b");
        }
        await fs.writeFile(file, `exports.add = (a, b) => ${codingTurns === 1 ? "a - b" : "a + b"};\n`);
        return { handoff: "Candidate saved for independent test" };
      }
      expect(request.agent).toBe("testing");
      testingTurns++;
      const { stdout } = await promisify(execFile)(process.execPath, ["-e", "const {add}=require('./add.cjs');console.log(JSON.stringify([add(2,3),add(-2,-3)]));"], { cwd: request.workspacePath });
      const values = JSON.parse(stdout), passed = values[0] === 5 && values[1] === -5;
      await fs.writeFile(path.join(request.workspacePath, `test-${testingTurns}.json`), JSON.stringify({ values, passed }));
      if (!passed) { entered(); await gate; return { handoff: "Actual Node tests failed; repair candidate" }; }
      return complete(request);
    };
    const first = await fixture(runner);
    expect((await first.sdk.gateways.test(first.gatewayBindings.defaultGatewayId, "codex", "fixture", { reasoningOptionId: "high" })).status).toBe("passed");
    const run = await first.sdk.start({ title: "Migrated software fixture", requirement: "Implement addition and independently verify it", workflow: await example("02-software-development"), gatewayBindings: first.gatewayBindings });
    await Promise.race([entry, run.wait({ signal: AbortSignal.timeout(10_000) }).then(state => { throw new Error(`Did not reach test: ${state.status}: ${state.lastError}`); })]);
    try { await run.pause(); } finally { release(); }
    expect((await run.wait({ signal: AbortSignal.timeout(10_000) })).status).toBe("paused");
    await first.sdk.close();
    const reopened = await fixture(runner, first.root);
    const recovered = await reopened.sdk.getRun(run.id);
    await recovered.resume();
    expect((await recovered.wait({ signal: AbortSignal.timeout(10_000) })).status).toBe("completed");
    expect(calls).toEqual(["coding", "testing", "coding", "testing"]);
    expect(workspaces.size).toBe(1);
    expect([...workspaces][0]).toBe(path.join(first.root, "projects", run.id, "workspaces"));
    expect(JSON.parse(await fs.readFile(path.join([...workspaces][0], "test-2.json"), "utf8"))).toMatchObject({ passed: true, values: [5, -5] });
  }, 30_000);
});
