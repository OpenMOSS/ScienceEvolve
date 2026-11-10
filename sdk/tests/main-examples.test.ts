import { afterEach, describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createMainSdkClient, type MainResearchSdk } from "../src/main-client.js";
import { createMainApplicationRuntime } from "../src/main-runtime.js";
import { bindMainWorkflowConfig, loadMainWorkflowConfig, validateMainWorkflowConfig } from "../src/main-config.js";
import type { AgentRunner, AgentRunRequest, ControlActionEnvelope } from "../src/core/types.js";
import { harnessCatalogRegistry, toPublicHarnessDescriptor } from "../src/core/harness-runtime/registry.js";

const examples = fileURLToPath(new URL("../../example/", import.meta.url));
const names = ["01-ahe-evolve", "02-software-development", "dynamic-research-workflow", "aris", "metaharness", "autoresearch", "funsearch", "agent-laboratory", "sciagents", "robin", "co-scientist", "biomni", "agentrxiv", "scientist-two", "rrsi", "drugevolve"];
const files = [...names.map(name => path.join(examples, name, "workflow.json")), ...["default-workflow.json", "existing-project/workflow.json", "workflow-reconfiguration/workflow.json"]
  .map(name => fileURLToPath(new URL(`../examples/${name}`, import.meta.url)))];
const roots: string[] = [], sdks: MainResearchSdk[] = [];
afterEach(async () => {
  await Promise.all(sdks.splice(0).map(sdk => sdk.close()));
  await Promise.all(roots.splice(0).map(root => fs.rm(root, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 })));
});

it("ships a main v3 parallel Git example with two independent branches and no deployment secrets", async () => {
  const workflow = await loadMainWorkflowConfig(fileURLToPath(new URL("../examples/parallel-git-review/workflow.json", import.meta.url)));
  expect(workflow.git).toMatchObject({ enabled: true, repositoryVisibility: "private" });
  const group = workflow.orchestration.scopedWorkflow!.groups[0];
  expect(group.workflow.input.edges).toEqual([{ kind: "parallel", target: "code" }, { kind: "parallel", target: "contract" }]);
  expect(Object.keys(workflow.agents).sort()).toEqual(["code_audit", "contract_audit", "main"]);
  expect(JSON.stringify(workflow)).not.toMatch(/apiKey|gatewaySource|tokenEnv/);
});
async function directory() { const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-main-example-")); roots.push(root); return root; }
function action(request: AgentRunRequest, value: ControlActionEnvelope["action"]) {
  return { handoff: "Deterministic fixture evidence", controlActions: [{ projectId: request.project.id, agent: request.agent,
    invocationId: request.invocationId, callId: `${request.invocationId}-action`, stateVersion: request.control!.stateVersion,
    capabilityHash: request.control!.capabilityHash, receivedAt: new Date().toISOString(), action: value }] };
}
const complete = (request: AgentRunRequest) => action(request, { tool: "complete_project", rationale: "Fixture evidence accepted" });
async function fixture(run: AgentRunner["run"], existing?: string) {
  const root = existing ?? await directory();
  const runtime = await createMainApplicationRuntime({ dataDir: root, gatewayOptions: { fetch: async () => { throw new Error("No network in example fixtures"); } }, internal: {
    runner: { run, harnessCatalog: async () => harnessCatalogRegistry.list().map(descriptor => toPublicHarnessDescriptor(descriptor, { available: true })) },
    residentLauncher: { open: async () => { throw new Error("Git-off must not launch a resident"); } }
  } });
  const sdk = await createMainSdkClient(runtime); sdks.push(sdk);
  const gateway = (await sdk.gateways.list())[0] ?? await sdk.gateways.add({ name: "Example fixture", url: "https://93.184.216.34/v1", apiKey: "fixture-only",
    models: ["fixture"], defaultModel: "fixture", protocol: "responses",
    modelReasoning: { fixture: { parameter: "reasoning.effort", options: [{ id: "high", label: "High", value: "high" }] } } });
  return { root, runtime, sdk, gatewayBindings: { defaultGatewayId: gateway.id } };
}

describe("all shipped Git-off examples use the main loader", () => {
  it.each(files)("loads %s without credential/profile fields and preserves its business graph", async file => {
    const raw = JSON.parse(await fs.readFile(file, "utf8"));
    expect(JSON.stringify(raw)).not.toContain("gatewaySource");
    expect(JSON.stringify(raw)).not.toContain("<dataDir>/projects/<projectId>/workspaces/");
    expect(raw.git).toEqual({ enabled: false });
    const loaded = await loadMainWorkflowConfig(file);
    expect(loaded.orchestration).toMatchObject({ schemaVersion: 2, collaborations: [] });
    expect(validateMainWorkflowConfig(loaded)).toEqual(loaded);
    const bound = bindMainWorkflowConfig(loaded, { harness: "codex", model: "fixture" });
    for (const agent of Object.values(bound.agents)) {
      expect(agent).not.toHaveProperty("legacyReasoningEffort");
      expect(agent).not.toHaveProperty("reasoningMigrationWarning");
    }
    expect(loaded.git.enabled).toBe(false);
    expect(loaded.orchestration.input).toEqual(raw.orchestration.input);
    // Main normalization adds missing worker candidates; worker edges stay exact.
    for (const [agent, edges] of Object.entries(raw.orchestration.routes)) {
      if (agent === "main") expect(loaded.orchestration.routes.main).toEqual(expect.arrayContaining(edges as unknown[]));
      else expect(loaded.orchestration.routes[agent]).toEqual(edges);
    }
    expect(loaded.orchestration.loops ?? []).toEqual(raw.orchestration.loops ?? []);
    expect(loaded.orchestration.termination).toEqual(raw.orchestration.termination);
    expect(Object.keys(loaded.agents).sort()).toEqual(Object.keys(raw.agents).sort());
  });
});

// Actual main kernel, SQLite and caller-selected workspace; scripted Agents only.
// These traces are regression evidence, not real-model/research-method validation.
it.each(["01-ahe-evolve", "02-software-development", "dynamic-research-workflow"])("runs %s in place and does not replay after reopening", async name => {
  const workspace = await directory(), canonical = await fs.realpath(workspace), calls: string[] = [];
  await fs.writeFile(path.join(workspace, "original.txt"), "caller-owned source");
  let decisions = 0, tests = 0;
  const { sdk, runtime, root, gatewayBindings } = await fixture(async request => {
    expect(request.workspacePath).toBe(canonical);
    expect(await fs.readFile(path.join(request.workspacePath, "original.txt"), "utf8")).toBe("caller-owned source");
    calls.push(request.agent);
    await fs.appendFile(path.join(request.workspacePath, "trace.jsonl"), JSON.stringify({ agent: request.agent,
      total: request.project.loopTotalIterations, batches: request.project.loopBatches }) + "\n");
    if (name === "01-ahe-evolve") {
      if (request.agent !== "main") return { handoff: "Recorded round evidence" };
      expect(request.project.pendingMainDecision?.reason).toBe("loop-limit");
      return ++decisions === 1 ? action(request, { tool: "route_to_agent", target: "optimizer", assignment: "Second batch" }) : complete(request);
    }
    if (name === "02-software-development") {
      expect(request.agent).not.toBe("main");
      if (request.agent === "coding") {
        await fs.writeFile(path.join(request.workspacePath, "implementation.json"), JSON.stringify({ value: tests ? 2 : 1 }));
        return { handoff: "Implementation ready for independent fixture test" };
      }
      const value = JSON.parse(await fs.readFile(path.join(request.workspacePath, "implementation.json"), "utf8")).value;
      await fs.writeFile(path.join(request.workspacePath, `test-${++tests}.json`), JSON.stringify({ passed: value === 2 }));
      if (value !== 2) return { handoff: "Fixture test failed: repair the output to equal 2" };
      expect(request.control?.canComplete).toBe(true);
      return complete(request);
    }
    if (request.agent !== "main") return { handoff: "Recorded research-stage fixture evidence" };
    const target = ["execution", "writing", "review"][decisions++];
    if (!target) expect(request.project.pendingMainDecision).toMatchObject({ sourceAgent: "review", candidateAgents: expect.arrayContaining(["finish"]) });
    if (!target && request.control?.canComplete) return complete(request);
    return action(request, { tool: "route_to_agent", target: target ?? "finish", assignment: target ? "Next research stage" : "Review accepted" });
  });
  const workflow = bindMainWorkflowConfig(await loadMainWorkflowConfig(path.join(examples, name, "workflow.json")), { harness: "codex", model: "fixture" });
  if (name === "02-software-development") expect(workflow.orchestration.termination).toMatchObject({ agent: "testing", automatic: true });
  if (name === "01-ahe-evolve") expect(workflow.orchestration.loops).toEqual([{ id: "code_evolution", from: "judge", to: "optimizer", maxIterations: 3, exitTo: "main" }]);
  const run = await sdk.start({ title: name, requirement: "Run deterministic regression fixture in the supplied workspace", workflow, workspace, gatewayBindings });
  const result = await run.wait({ signal: AbortSignal.timeout(15_000) });
  expect(result.status, JSON.stringify({ error: result.lastError, calls, events: (await runtime.storage.readEvents(run.id)).filter(event => /failed|rejected|error/.test(event.type)) })).toBe("completed");
  if (name === "01-ahe-evolve") {
    expect(result).toMatchObject({ loopBatches: { code_evolution: 2 }, loopTotalIterations: { code_evolution: 6 } });
    expect(calls).toEqual(["execute", "judge", ...Array.from({ length: 3 }, () => ["optimizer", "execute", "judge"]).flat(), "main", ...Array.from({ length: 3 }, () => ["optimizer", "execute", "judge"]).flat(), "main"]);
  } else if (name === "02-software-development") {
    expect(calls).toEqual(["coding", "testing", "coding", "testing"]);
    expect(JSON.parse(await fs.readFile(path.join(workspace, "test-1.json"), "utf8"))).toEqual({ passed: false });
    expect(JSON.parse(await fs.readFile(path.join(workspace, "test-2.json"), "utf8"))).toEqual({ passed: true });
    expect((await runtime.storage.readEvents(run.id)).find(event => event.type === "project.completed")?.agent).toBe("testing");
  } else expect(calls).toEqual(["idea", "main", "execution", "main", "writing", "main", "review", "main", "main"]);
  const trace = await fs.readFile(path.join(workspace, "trace.jsonl"), "utf8");
  expect(trace.trim().split("\n")).toHaveLength(calls.length);
  await expect(fs.access(path.join(workspace, ".git"))).rejects.toMatchObject({ code: "ENOENT" });
  await sdk.close();
  let replayed = 0;
  const reopened = await fixture(async () => { replayed++; throw new Error("Completed example must not replay"); }, root);
  const recovered = await reopened.sdk.getRun(run.id);
  expect((await recovered.wait({ signal: AbortSignal.timeout(5_000) })).status).toBe("completed");
  expect(await reopened.runtime.storage.roleWorkspace(run.id, "main", "inv_reopen")).toBe(canonical);
  expect(await fs.readFile(path.join(workspace, "trace.jsonl"), "utf8")).toBe(trace);
  expect(replayed).toBe(0);
}, 25_000);
