import assert from "node:assert/strict";
import { access, mkdir, readFile, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { createMainResearchSdk, validateMainWorkflowConfig, bindMainWorkflowConfig, loadMainWorkflowConfig,
  MAIN_RUNTIME_SOURCE_COMMIT } from "@scienceevolve/sdk/main";
import { createResearchSdk, defaultWorkflowConfig } from "@scienceevolve/sdk";
import { createMainApplicationRuntime } from "@scienceevolve/sdk/application/main-runtime";
assert.equal(createResearchSdk, createMainResearchSdk);
assert.equal(defaultWorkflowConfig().git.enabled, false);

// Repository-external tarball consumer. No model requests or real GitHub writes.
const root = path.resolve("standalone-main-sdk-data");
const sdk = await createMainResearchSdk({ dataDir: root });
try {
  assert.equal(sdk.sourceCommit, MAIN_RUNTIME_SOURCE_COMMIT);
  assert.deepEqual(await sdk.listRuns(), []);
  const catalog = await sdk.harnesses();
  assert.equal(catalog.find((entry) => entry.id === "pi")?.available, true);
  const config = validateMainWorkflowConfig({ git: { enabled: true } });
  assert.equal(config.orchestration.schemaVersion, 3);
  assert.ok(config.orchestration.scopedWorkflow);
  assert.equal(bindMainWorkflowConfig(config, { harness: "pi", model: "fixture" }).agents.main.harness, "pi");
  const example = path.resolve("node_modules/@scienceevolve/sdk/examples/main-runtime/workflow.json");
  const loaded = await loadMainWorkflowConfig(example);
  assert.equal(loaded.orchestration.schemaVersion, 3);
  assert.equal(loaded.orchestration.scopedWorkflow.groups.length, 1);
  const gateway = await sdk.gateways.add({ name: "package fixture", url: "https://93.184.216.34/v1",
    apiKey: "opaque-package-fixture-key", protocol: "responses", models: ["fixture"], defaultModel: "fixture" });
  assert.equal(gateway.apiKeyConfigured, true);
  assert.ok(!JSON.stringify(await sdk.gateways.list()).includes("opaque-package-fixture-key"));
  const imported = await sdk.gateways.importHarness({ harness: "codex", model: "fixture", source: "env",
    environment: { SDK_CODEX_BASE_URL: "https://93.184.216.34/v1", SDK_CODEX_API_KEY: "opaque-import-package-key" } });
  assert.equal(imported.apiKeyConfigured, true);
  assert.ok(!JSON.stringify(await sdk.gateways.list()).includes("opaque-import-package-key"));
  // These refusals must happen before Git initialization or any model launch.
  await assert.rejects(sdk.start({ title: "No mutations", requirement: "Explicit missing binding", workflow: config,
    gatewayBindings: {} }), /binding required/);
  await assert.rejects(sdk.start({ title: "No mutations", requirement: "Do not silently import", workflow: config,
    gatewayBindings: { defaultGatewayId: gateway.id }, workspace: process.cwd(), sourceWorkspace: { path: process.cwd() } }), /mutually exclusive/);
  assert.deepEqual(await sdk.listRuns(), []);
  const manifest = JSON.parse(await readFile(path.resolve("node_modules/@scienceevolve/sdk/package.json"), "utf8"));
  assert.ok(manifest.exports["./main"].types.endsWith("main.d.ts"));
} finally { await sdk.close(); }
await assert.rejects(access(path.join(root, ".scienceevolve-runtime.lock")), { code: "ENOENT" });
const reopened = await createMainResearchSdk({ dataDir: root });
assert.equal((await reopened.gateways.list()).length, 2);
await reopened.close();

// Installed compiled kernel/SQLite with an explicit simulated Agent: verify the
// public SDK start contract reaches the existing directory without source copying.
const compiledRuntimeUrl = import.meta.resolve("@scienceevolve/sdk/application/main-runtime");
const { createMainSdkClient } = await import(new URL("./main-client.js", compiledRuntimeUrl));
const { harnessCatalogRegistry, toPublicHarnessDescriptor } = await import(new URL("./core/harness-runtime/registry.js", compiledRuntimeUrl));
const workspace = path.resolve("main-sdk-existing-workspace"), workspaceData = path.resolve("main-sdk-workspace-data");
await mkdir(workspace);
await writeFile(path.join(workspace, "existing.txt"), "existing package source");
const inputsSource = path.resolve("main-sdk-input-materials");
await mkdir(inputsSource);
const referenceImage = Buffer.from([137, 80, 78, 71, 0, 255]);
await writeFile(path.join(inputsSource, "reference.png"), referenceImage);
const calls = [];
const runner = {
  harnessCatalog: async () => harnessCatalogRegistry.list().map((entry) => toPublicHarnessDescriptor(entry, { available: true })),
  run: async (request) => {
    calls.push(request.workspacePath);
    assert.equal(await readFile(path.join(request.workspacePath, "existing.txt"), "utf8"), "existing package source");
    assert.deepEqual(await readFile(path.join(request.workspacePath, "user_inputs", "reference.png")), referenceImage);
    assert.deepEqual(request.project.inputFiles, ["reference.png"]);
    assert.equal(request.project.inputDescription, "Original package image");
    const inbox = await readFile(request.inboxPath, "utf8");
    assert.match(inbox, /Fixture only/);
    assert.match(inbox, /Original package image/);
    await writeFile(path.join(request.workspacePath, "result.txt"), "compiled SDK workspace fixture");
    return { handoff: "Workspace fixture complete", controlActions: [{ projectId: request.project.id, agent: request.agent,
      invocationId: request.invocationId, callId: `${request.invocationId}-complete`, stateVersion: request.control.stateVersion,
      capabilityHash: request.control.capabilityHash, receivedAt: new Date().toISOString(),
      action: { tool: "complete_project", rationale: "Package workspace fixture satisfied" } }] };
  }
};
const workspaceRuntime = await createMainApplicationRuntime({ dataDir: workspaceData, skillRoots: [], internal: { runner,
  residentLauncher: { open: async () => { throw new Error("Git-off must not open resident"); } } } });
const workspaceSdk = await createMainSdkClient(workspaceRuntime);
let workspaceRunId;
try {
  const gateway = await workspaceSdk.gateways.add({ name: "workspace fixture", url: "https://93.184.216.34/v1",
    apiKey: "opaque-workspace-fixture", protocol: "responses", models: ["fixture"], defaultModel: "fixture" });
  const baseWorkflow = validateMainWorkflowConfig({ git: { enabled: false }, agents: { main: { model: "fixture", skills: [], autoSkills: [] } },
    orchestration: { schemaVersion: 2, collaborations: [], agents: [{ name: "main", template: "main" }],
      input: { source: "input", target: "main" }, routes: { main: [] }, decisionPlans: {},
      termination: { agent: "main", condition: "Package fixture complete", decisionBy: "main", automatic: false },
      resultFormat: { presets: [], custom: "" } } });
  const inputWorkflowFile = path.resolve("main-sdk-input-workflow.json");
  await writeFile(inputWorkflowFile, JSON.stringify({ ...baseWorkflow,
    inputs: ["./main-sdk-input-materials/reference.png"], inputDescription: "Original package image" }));
  const workflow = await loadMainWorkflowConfig(inputWorkflowFile);
  const run = await workspaceSdk.start({ title: "Existing workspace", requirement: "Fixture only", workflow,
    gatewayBindings: { defaultGatewayId: gateway.id }, workspace });
  workspaceRunId = run.id;
  const result = await run.wait({ signal: AbortSignal.timeout(20_000) }).catch(async error => {
    const state = await run.snapshot();
    throw new Error(`Package workspace did not complete: ${state.lastError ?? state.status}`, { cause: error });
  });
  assert.equal(result.status, "completed");
  assert.deepEqual(result.inputFiles, ["reference.png"]);
  assert.equal(result.userInputsPath, path.join(await realpath(workspace), "user_inputs"));
  assert.deepEqual(calls, [await realpath(workspace)]);
  assert.equal(await readFile(path.join(workspace, "result.txt"), "utf8"), "compiled SDK workspace fixture");
  assert.equal(await readFile(path.join(workspace, "existing.txt"), "utf8"), "existing package source");
} finally { await workspaceSdk.close(); }
const restoredWorkspaceSdk = await createMainResearchSdk({ dataDir: workspaceData });
try { assert.equal((await (await restoredWorkspaceSdk.getRun(workspaceRunId)).snapshot()).status, "completed"); }
finally { await restoredWorkspaceSdk.close(); }
await assert.rejects(access(path.join(workspace, ".scienceevolve-main-runtime.json")), { code: "ENOENT" });
await assert.rejects(access(path.join(workspaceData, ".scienceevolve-runtime.lock")), { code: "ENOENT" });
console.log(JSON.stringify({ entry: "main", sourceCommit: MAIN_RUNTIME_SOURCE_COMMIT, publicApi: true,
  v3Config: true, managedPi: true, gatewayRedaction: true, dedicatedDirectory: true,
  gitOffWorkspace: true, workspaceReopened: true, simulatedWorkspaceAgent: true,
  sharedOriginalInputs: true,
  realModel: false, realGitHub: false }));
