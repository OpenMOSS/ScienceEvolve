import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import { CodexAdapter } from "../src/core/harness-runtime/adapters/codex-adapter.js";
import { openBuiltinResidentAdapter, type ResidentAdapterLaunchRequest } from "../src/core/harness-runtime/adapters/resident-adapter-factory.js";
import type { LaunchPlan } from "../src/core/harness-runtime/contracts.js";

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => fs.rm(root, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 })));
});

it.each([false, true])("builds Codex resident web search with the selected model route (native=%s)", async native => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-resident-route-")); roots.push(root);
  const workspace = path.join(root, "workspace"), profile = path.join(root, "profile"), runtime = path.join(root, "runtime");
  await Promise.all([fs.mkdir(workspace), fs.mkdir(profile), fs.mkdir(runtime)]);
  const executable = path.join(root, "catalog.mjs");
  await fs.writeFile(executable, 'console.log(JSON.stringify({models:[{slug:"fixture-model",use_responses_lite:false,tool_mode:null}]}));');
  const route = native ? { nativeCodexProfileHome: profile, authorityId: "profile-fixture" }
    : { baseUrl: "http://127.0.0.1:48888/v1", token: "invocation-fixture-token" };
  const signal = new AbortController().signal;
  const session = { nativeId: "pending:fixture", durable: true, harnessId: "codex", generation: 0 };
  let plan: LaunchPlan | undefined;
  const startResident = vi.fn(async (_binding: unknown, launch: LaunchPlan) => {
    plan = launch;
    throw new Error("Captured resident launch");
  });
  const adapter = new CodexAdapter();
  Object.defineProperty(adapter, "descriptor", { value: { ...adapter.descriptor,
    route: { ...adapter.descriptor.route, webSearchMcp: true } } });
  const input = {
    adapter, executable, executionRuntimePath: runtime, launchRoute: route, signal, session,
    request: { agent: "writer", permission: "yolo", project: { id: "prj_fixture", agents: { writer: {
      model: "fixture-model", harness: "codex",
      ...(native ? { nativeCodexProfileId: "login" } : { gatewaySnapshot: {
        id: "gwy_fixture", name: "fixture", url: "https://provider.example/v1", apiKey: "unused-provider-key",
        protocol: "responses", models: ["fixture-model"]
      } })
    } } }, executionContext: { role: "delivery", executionId: "exec-fixture", ownershipEpoch: 7, executionWorktree: workspace } },
    spec: { model: "fixture-model", inputs: { projectPath: root, workspacePath: workspace },
      policy: { permission: "yolo", skillPaths: [], autoSkillPaths: [], mcpServers: [], webSearch: true } },
    filesystemAuthority: { rawTools: "native", gitCapability: "none", serviceUserRoot: root }, mcpRows: [],
    processBinding: { scopeId: "exec-fixture", role: "delivery", route, workspacePath: workspace, signal,
      session: () => session, commonEnvironment: {}, authorityEnvironment: {
        SCIENCEEVOLVE_RESIDENT_SCOPE_ID: "exec-fixture", SCIENCEEVOLVE_RESIDENT_ROLE: "delivery",
        SCIENCEEVOLVE_EXECUTION_ID: "exec-fixture", SCIENCEEVOLVE_OWNERSHIP_EPOCH: "7"
      } },
    processHost: { startResident }, onTrace: () => {}
  } as unknown as ResidentAdapterLaunchRequest;
  await expect(openBuiltinResidentAdapter(input)).rejects.toThrow("Captured resident launch");
  expect(startResident).toHaveBeenCalledOnce();
  expect(plan!.args).toContain("--search");
  const config = plan!.args.find(argument => argument.startsWith("mcp_servers="))!;
  if ("nativeCodexProfileHome" in route) {
    expect(plan!.env.CODEX_HOME).toBe(profile);
    expect(plan!.env.SCIENCEEVOLVE_GATEWAY_API_KEY).toBeUndefined();
    expect(plan!.env.OPENAI_API_KEY).toBeUndefined();
    expect(config).not.toContain('"openfars-web"');
  } else {
    expect(plan!.env.SCIENCEEVOLVE_GATEWAY_API_KEY).toBe(route.token);
    expect(config).toContain('"openfars-web" = { url = "http://127.0.0.1:48888/v1/web-mcp"');
    expect(config).toContain('bearer_token_env_var = "SCIENCEEVOLVE_GATEWAY_API_KEY"');
    expect(config).not.toContain(route.token);
  }
});
