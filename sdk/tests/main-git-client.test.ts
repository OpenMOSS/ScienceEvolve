import { afterEach, describe, expect, it, vi } from "vitest";
import { promises as fs } from "node:fs";
import { execFile, execFileSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { createMainApplicationRuntime, type MainApplicationRuntime } from "../src/main-runtime.js";
import { createMainSdkClient, type MainResearchSdk } from "../src/main-client.js";
import { validateMainWorkflowConfig } from "../src/main-config.js";
import { mainRedactor } from "../src/main-redaction.js";
import { createCollaborationGitFacade, CollaborationGitFacade, LocalCollaborationGitService, GitHubUserProvider,
  type GitCommandRunner } from "../src/core/collaboration-git/index.js";
import { harnessCatalogRegistry, toPublicHarnessDescriptor } from "../src/core/harness-runtime/registry.js";
import { ControlActionService } from "../src/core/orchestration-control-bridge.js";
import type { AgentRunner, ControlAction, ControlActionEnvelope } from "../src/core/types.js";
import type { CollaborationResidentLauncher } from "../src/core/collaboration-runtime.js";
import { createProductionCollaborationResidentLauncher } from "../src/core/collaboration-resident-launcher.js";
import type { HarnessRuntimeResidentAdapter } from "../src/core/harness-runtime/resident-runtime-adapter.js";
import type { HarnessRuntimeFacade } from "../src/core/harness-runtime/runtime.js";
import { trackResidentOpens } from "../src/main-resident-tracker.js";
import { containsCredentialMaterial } from "../src/core/utils.js";
import { compileInvocationPolicy, compileWorkflowPrompt } from "../src/core/harness-runtime/invocation-policy.js";

const roots: string[] = [];
const runtimes: MainApplicationRuntime[] = [];
const sdks: MainResearchSdk[] = [];
afterEach(async () => {
  await Promise.all(sdks.splice(0).map((sdk) => sdk.close()));
  await Promise.all(runtimes.splice(0).map((runtime) => runtime.close()));
  await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true, maxRetries: 8, retryDelay: 100 })));
});
async function directory() { const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-main-git-client-")); roots.push(root); return root; }
function workflow() {
  return validateMainWorkflowConfig({ git: { enabled: true, repositoryName: "sdk-fixture" },
    agents: { main: { model: "fixture", skills: [], autoSkills: [] } },
    orchestration: { schemaVersion: 2, collaborations: [], agents: [{ name: "main", template: "main" }],
      input: { source: "input", target: "main" }, routes: { main: [] }, decisionPlans: {},
      termination: { agent: "main", condition: "Explicit fixture management completion", decisionBy: "main", automatic: false },
      resultFormat: { presets: [], custom: "" } } });
}
function runner(): AgentRunner {
  return { run: vi.fn(async () => { throw new Error("Git-on must never fall back to the legacy runner"); }),
    harnessCatalog: async () => harnessCatalogRegistry.list().map((descriptor) => toPublicHarnessDescriptor(descriptor, { available: true })) };
}
async function client(runtime: MainApplicationRuntime) {
  runtimes.push(runtime);
  const redactor = mainRedactor(); redactor.remember("opaque-git-fixture");
  const sdk = await createMainSdkClient(runtime, redactor); sdks.push(sdk);
  const gateway = await sdk.gateways.add({ name: "fixture", url: "https://93.184.216.34/v1", apiKey: "opaque-gateway-fixture",
    models: ["fixture"], defaultModel: "fixture", protocol: "responses", autoReasoning: false });
  return { sdk, gateway, redactor };
}

describe("main Git-on SDK integration: actual kernel/SQLite/local Git, simulated GitHub and native resident", () => {
  it.each([401, 403])("checkpoints GitHub %s as waiting_for_github, retries and Stops durably without a legacy invocation", async (status) => {
    const root = await directory();
    const native = runner();
    const residentLauncher = { open: vi.fn(async () => { throw new Error("No resident before Git ready"); }) };
    const fetch = vi.fn(async () => new Response(JSON.stringify({ message: "Bad credentials opaque-git-fixture" }), { status })) as typeof globalThis.fetch;
    const factory = vi.fn((binding) => createCollaborationGitFacade({ ...binding,
      credentialResolver: async () => ({ token: "opaque-git-fixture", requestedScopes: ["repo"] }), fetch }));
    const runtime = await createMainApplicationRuntime({ dataDir: root, skillRoots: [], internal: { runner: native, residentLauncher, gitFactory: factory } });
    const { sdk, gateway } = await client(runtime);
    await expect(sdk.start({ title: "Reject source", requirement: "No provider side effects", workflow: workflow(),
      gatewayBindings: { defaultGatewayId: gateway.id }, sourceWorkspace: { path: root, files: ["../outside"] } })).rejects.toThrow(/overlap/);
    expect(fetch).not.toHaveBeenCalled(); expect(residentLauncher.open).not.toHaveBeenCalled();
    expect(await sdk.listRuns()).toEqual([]);
    const run = await sdk.start({ title: "Failed Git fixture", requirement: "Never launch work on failed authorization", workflow: workflow(),
      gatewayBindings: { defaultGatewayId: gateway.id } });
    // Authorization failures retain the running Workflow's recovery intent.
    // wait() therefore remains pending until an explicit lifecycle action.
    await vi.waitFor(async () => {
      const state = await run.snapshot();
      expect(state.status).toBe("retrying");
      expect(state.git?.status).toBe("waiting_for_github");
    }, { timeout: 10_000, interval: 20 });
    const first = await run.snapshot();
    expect(first.status).toBe("retrying");
    await expect(run.exportWorkspace({ destination: path.join(root, "not-a-delivery") })).rejects.toThrow(/completed Git-enabled/);
    expect(first.git?.status).toBe("waiting_for_github");
    expect(first.phase).toBe("git:waiting_for_github");
    expect(first.git?.initialization?.error).toContain("[GITHUB_WAITING_FOR_AUTHORIZATION]");
    expect(containsCredentialMaterial(first.git!.initialization!.error!)).toBe(false);
    // The fix changes trusted diagnostic formatting, not credential protection.
    expect(containsCredentialMaterial("FOR_AUTHORIZATION: opaque-fixture")).toBe(true);
    expect(first.lastError).not.toContain("Credential-like value is forbidden");
    expect(first.git?.initialization?.attempt).toBe(1);
    expect(first.failureAttempts?.length).toBeGreaterThan(0);
    expect(first.collaboration?.stateRevision).toBeGreaterThan(0);
    expect(factory.mock.calls[0][0].worktreeMode).toBe("agent");
    expect((await runtime.storage.loadState(run.id)).orchestration.schemaVersion).toBe(3);
    const retry = await run.retryGitInitialization();
    expect(retry.git?.status).toBe("waiting_for_github");
    expect(retry.git?.initialization?.operationId).toBe(first.git?.initialization?.operationId);
    expect(retry.git?.initialization?.attempt).toBe(2);
    expect(retry.failureAttempts?.some((attempt) => attempt.metadata?.attempt === 2)).toBe(true);
    expect(retry.gitRetryScheduling?.length).toBeGreaterThan(0);
    expect(JSON.stringify(retry)).not.toContain("opaque-git-fixture");
    expect(native.run).not.toHaveBeenCalled(); expect(residentLauncher.open).not.toHaveBeenCalled();
    const cancelled = await run.cancel();
    // main F13 Stop is resumable, unlike legacy Git-off terminal cancellation.
    expect(cancelled.status).toBe("paused");
    expect(cancelled.phase).toBe("collaboration:user-cancelled");
    const events = [];
    for await (const event of run.events({ follow: false })) events.push(event);
    expect(events.some((event) => event.data?.sourceType === "project.cancellation.stop_confirmed")).toBe(true);
    expect(events.every((event) => !JSON.stringify(event).includes("opaque-git-fixture"))).toBe(true);
    await sdk.close();
    const reopened = await createMainApplicationRuntime({ dataDir: root, skillRoots: [], internal: { runner: native, residentLauncher, gitFactory: factory } });
    runtimes.push(reopened);
    const reopenedSdk = await createMainSdkClient(reopened); sdks.push(reopenedSdk);
    expect((await (await reopenedSdk.getRun(run.id)).snapshot()).status).toBe("paused");
    expect(residentLauncher.open).not.toHaveBeenCalled();
  });

  it.each([false, true])("initializes real Git, completes via resident controls, delivers without polling and does not rerun (workspace %s)", async (inPlaceDelivery) => {
    const root = await directory();
    const remoteRoot = await directory();
    const remote = path.join(remoteRoot, "remote.git");
    execFileSync("git", ["init", "--bare", "--initial-branch=main", remote], { encoding: "utf8" });
    const url = "https://github.com/sdk-fixture/sdk-fixture.git";
    let repository: Record<string, unknown> | undefined;
    let authorized = false;
    const fetch = vi.fn(async (request: string | URL | Request, init?: RequestInit) => {
      const endpoint = new URL(String(request)).pathname;
      const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { "x-oauth-scopes": "repo" } });
      if (endpoint === "/user") return authorized ? json({ login: "sdk-fixture", id: 42 }) : json({ message: "Authorization pending" }, 401);
      if (endpoint === "/user/repos" && init?.method === "POST") {
        const body = JSON.parse(String(init.body));
        repository = { id: 100, name: body.name, owner: { login: "sdk-fixture" }, private: body.private,
          default_branch: "main", html_url: "https://github.com/sdk-fixture/sdk-fixture", clone_url: url, description: body.description };
        return json(repository, 201);
      }
      if (endpoint === "/repos/sdk-fixture/sdk-fixture") return repository ? json(repository) : json({}, 404);
      if (endpoint.startsWith("/repos/sdk-fixture/sdk-fixture/git/ref/heads/")) {
        const ref = decodeURIComponent(endpoint.split("/git/ref/heads/")[1]);
        try {
          const sha = execFileSync("git", ["--git-dir", remote, "rev-parse", "--verify", `refs/heads/${ref}`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
          return json({ ref: `refs/heads/${ref}`, object: { type: "commit", sha } });
        } catch { return json({}, 404); }
      }
      throw new Error(`Unimplemented deterministic provider endpoint: ${init?.method} ${endpoint}`);
    }) as typeof globalThis.fetch;
    // Test-only transport redirects HTTPS push/fetch to a temp bare repository.
    // Every Git operation is real; no provider request or Git transport can reach the network.
    const commandRunner: GitCommandRunner = { run: async (request) => {
      await request.beforeSpawn?.();
      const args = ["-c", "core.autocrlf=false", ...(request.args[0] === "push" || request.args[0] === "fetch"
        ? ["-c", `url.${remote.replaceAll("\\", "/")}.insteadOf=${url}`] : []), ...request.args];
      return await new Promise((resolve, reject) => {
        const child = execFile("git", args, { cwd: request.cwd, env: { ...process.env, ...request.environment },
          signal: request.signal, timeout: 20_000, maxBuffer: 16 * 1024 * 1024 }, (error, stdout, stderr) => {
          const code = error && typeof error.code === "number" ? error.code : error ? -1 : 0;
          if (!(request.acceptedExitCodes ?? [0]).includes(code)) reject(new Error(`Git ${request.args[0]}: ${stderr || error?.message}`));
          else resolve({ code, stdout, stderr });
        });
        child.stdin?.on("error", (error: NodeJS.ErrnoException) => {
          // Git may exit without consuming empty stdin. Its exit status still
          // decides success; an error sending actual input must reject.
          if (error.code !== "EPIPE" || request.stdin?.length) reject(error);
        });
        child.stdin?.end(request.stdin ?? "", "utf8");
      });
    } };
    const native = runner();
    const actions: string[] = [];
    const adapter = { open: vi.fn(async (input) => {
      // The shared original inputs must be installed before even the first
      // management resident opens, outside its isolated business/management cwd.
      const inputDirectory = path.join(input.request.projectPath, "workspaces", "user_inputs");
      expect(await fs.readFile(path.join(inputDirectory, "reference.png"))).toEqual(Buffer.from([137, 80, 78, 71, 0, 255]));
      expect(input.request.project.inputFiles).toEqual(["reference.png"]);
      expect(input.request.project.inputDescription).toBe("Original reference image");
      expect(await fs.readFile(path.join(input.request.projectPath, "request.md"), "utf8")).toContain("user_inputs/reference.png");
      expect(input.request.workspacePath).not.toBe(inputDirectory);
      const prompt = compileWorkflowPrompt(input.request, {
        projectPath: input.request.projectPath, workspacePath: input.request.workspacePath,
        inboxPath: input.request.inboxPath, memoryPath: path.join(input.request.workspacePath, "Memory.md"),
        runtimePath: input.request.runtimePath, userInputsPath: inputDirectory, inboxSha256: "fixture"
      }, compileInvocationPolicy(input.request.project.agents.main, input.request));
      expect(prompt).toContain(input.request.projectPath);
      // The complete input catalog remains in formal state and the shared
      // directory, rather than being repeated in every native prompt.
      const many = { ...input.request, project: { ...input.request.project,
        inputFiles: Array.from({ length: 1000 }, (_, i) => `reference-${i}.png`) } };
      const bounded = compileWorkflowPrompt(many, {
        projectPath: input.request.projectPath, workspacePath: input.request.workspacePath,
        inboxPath: input.request.inboxPath, memoryPath: path.join(input.request.workspacePath, "Memory.md"),
        runtimePath: input.request.runtimePath, userInputsPath: inputDirectory, inboxSha256: "fixture"
      }, compileInvocationPolicy(input.request.project.agents.main, input.request));
      expect(bounded).not.toContain(JSON.stringify(many.project.inputFiles));
      expect(bounded).toBe(prompt);
      const session = { schemaVersion: 1, harnessId: "codex", adapterVersion: "fixture",
        nativeId: "fixture-main-session", generation: 1, durable: true, createdAt: new Date().toISOString() };
      return { initialLease: { session, acknowledgedControlSeq: 0 }, probe: async () => ({ session, acknowledgedControlSeq: 0 }),
        pause: async () => {}, resume: async () => {}, close: vi.fn(async () => {}), submit: async (turn) => {
        const fresh = await input.turnRequestFactory({ baseRequest: input.request, turn });
        await fresh.request.onDurableSessionStarted?.({ schemaVersion: 1, harnessId: "codex", adapterVersion: "fixture",
          nativeId: "fixture-main-session", generation: 1, durable: true, createdAt: new Date().toISOString() }, "fixture-main-session");
        const authority = await input.controlAuthorityFactory!({ request: fresh.request, turn });
        const service = new ControlActionService({ projectId: input.request.project.id, agent: "main", invocationId: turn.invocationId,
          stateVersion: authority.control.stateVersion, capability: authority.control.capability, capabilityHash: authority.control.capabilityHash,
          stagingPath: authority.control.stagingPath, revalidate: authority.revalidate });
        const controlActions: ControlActionEnvelope[] = [];
        const call = async (action: ControlAction) => {
          const result = await service.stage(authority.control.capability, `fixture-${turn.invocationId}-${controlActions.length}`, action);
          actions.push(action.tool); controlActions.push(result);
        };
        await call({ tool: "finish_task", summary: "Fixture Main management finished", memory: "Fixture completion evidence" });
        await call({ tool: "complete_project", rationale: "Explicit bounded Main-only fixture has no missing deliverables" });
        return { handoff: "fixture Main finished formally", controlActions };
      } };
    }) };
    const trackedAdapter = trackResidentOpens(adapter);
    const launcher = createProductionCollaborationResidentLauncher({
      reconcileResidentStartup: async () => ({ outcome: "none" }), residentRecoveryStrategy: () => "resume-session"
    } as unknown as HarnessRuntimeFacade, trackedAdapter.launcher as unknown as HarnessRuntimeResidentAdapter);
    const factory = (binding) => new CollaborationGitFacade({ operationStore: binding.operationStore,
      localGit: new LocalCollaborationGitService({ ...binding, runner: commandRunner }),
      provider: new GitHubUserProvider({ operationStore: binding.operationStore, fetch,
        credentialResolver: async () => ({ token: "opaque-git-fixture", requestedScopes: ["repo"] }) }) });
    const runtime = await createMainApplicationRuntime({ dataDir: root, skillRoots: [], internal: { runner: native, residentLauncher: launcher, gitFactory: factory } });
    const { sdk, gateway, redactor } = await client(runtime);
    const source = await directory();
    await fs.writeFile(path.join(source, "README.md"), "Imported source evidence\r\n");
    const binary = Buffer.from([0, 255, 128, 13, 10]);
    await fs.writeFile(path.join(source, "data.bin"), binary);
    const materials = await directory();
    await fs.writeFile(path.join(materials, "reference.png"), Buffer.from([137, 80, 78, 71, 0, 255]));
    const run = await sdk.start({ title: "Real local Git fixture", requirement: "Formal completion through the main resident", workflow: workflow(),
      gatewayBindings: { defaultGatewayId: gateway.id }, inputs: [path.join(materials, "reference.png")], inputDescription: "Original reference image",
      ...(inPlaceDelivery ? { workspace: source } : { sourceWorkspace: { path: source, files: ["README.md", "data.bin"] } }) });
    const waiting = await run.snapshot();
    expect(waiting.git?.status).toBe("waiting_for_github");
    expect(adapter.open).not.toHaveBeenCalled();
    const importRoot = path.join(root, "source-workspaces");
    const bindings = JSON.parse(await fs.readFile(path.join(importRoot, "bindings.json"), "utf8"));
    expect(bindings.projects[run.id].fingerprint).toMatch(/^[0-9a-f]{64}$/);
    if (!inPlaceDelivery) {
      await fs.writeFile(path.join(source, "README.md"), "Changed after authorization failure");
      // A read-only source may move after its immutable snapshot was captured.
      await fs.rename(source, `${source}-retained`); roots.push(`${source}-retained`);
    }
    authorized = true;
    await run.retryGitInitialization();
    if (inPlaceDelivery) {
      // Observe only the host receipt: no SDK wait/snapshot/events call can
      // accidentally hide a missing Git-on completion event subscription.
      await vi.waitFor(() => expect(runtime.gitWorkspaces.receipt(run.id)?.status).toBe("synced"), { timeout: 20_000, interval: 100 });
      expect(await fs.readFile(path.join(source, "README.md"), "utf8")).toBe("Imported source evidence\r\n");
      expect(await fs.readFile(path.join(source, "data.bin"))).toEqual(binary);
      await expect(fs.access(path.join(source, ".git"))).rejects.toMatchObject({ code: "ENOENT" });
    }
    const result = await run.wait({ signal: AbortSignal.timeout(20_000) });
    expect(result.status, JSON.stringify({ phase: result.phase, error: result.lastError, failures: result.failureAttempts })).toBe("completed");
    expect(result.git?.status).toBe("ready");
    expect(result.inputFiles).toEqual(["reference.png"]);
    expect(result.userInputsPath).toBe(path.join(runtime.storage.projectDir(run.id), "workspaces", "user_inputs"));
    expect(execFileSync("git", ["--git-dir", remote, "ls-tree", "-r", "--name-only", "main"], { encoding: "utf8" })).not.toContain("reference.png");
    expect(actions).toEqual(["finish_task", "complete_project"]);
    expect(native.run).not.toHaveBeenCalled();
    expect(adapter.open).toHaveBeenCalledTimes(1);
    const repositoryPath = result.git!.repository!.localPath;
    expect(execFileSync("git", ["--git-dir", repositoryPath, "rev-parse", "--is-bare-repository"], { encoding: "utf8" }).trim()).toBe("true");
    expect(execFileSync("git", ["--git-dir", remote, "show", "main:README.md"], { encoding: "utf8" })).toBe("Imported source evidence\r\n");
    expect(result.git?.initialization?.operationId).toBe(waiting.git?.initialization?.operationId);
    expect(execFileSync("git", ["--git-dir", repositoryPath, "log", "--reverse", "--format=%B"], { encoding: "utf8" })).toContain(bindings.projects[run.id].fingerprint);
    // A known secret may overlap a directory name. Public redaction must not
    // corrupt the host's authoritative repository binding used for export.
    redactor.remember("repository");
    expect((await run.snapshot()).git!.repository!.localPath).toContain("[REDACTED]");
    const outputRoot = await directory();
    const delivery = await run.exportWorkspace({ destination: path.join(outputRoot, "delivery") });
    expect(delivery.commit).toBe(execFileSync("git", ["--git-dir", repositoryPath, "rev-parse", "refs/heads/main"], { encoding: "utf8" }).trim());
    expect(await fs.readFile(path.join(delivery.destination, "README.md"), "utf8")).toBe("Imported source evidence\r\n");
    expect((await fs.readFile(path.join(delivery.destination, "data.bin"))).equals(binary)).toBe(true);
    await expect(fs.access(path.join(delivery.destination, "user_inputs"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(fs.access(path.join(delivery.destination, ".git"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(run.exportWorkspace({ destination: delivery.destination })).rejects.toThrow(/EEXIST/);
    const database = new DatabaseSync(path.join(root, "collaboration-state.sqlite"));
    try { expect(database.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().length).toBeGreaterThan(10); } finally { database.close(); }
    const events = [];
    for await (const event of run.events()) events.push(event);
    // main Git-on completion is a node.completed fact plus terminal project projection,
    // not the legacy Git-off project.completed event.
    expect(events.some((event) => event.data?.sourceType === "node.completed")).toBe(true);
    await sdk.close();
    await trackedAdapter.stopRemaining();
    const reopened = await createMainApplicationRuntime({ dataDir: root, skillRoots: [], internal: { runner: native, residentLauncher: launcher, gitFactory: factory } });
    runtimes.push(reopened);
    const reopenedSdk = await createMainSdkClient(reopened); sdks.push(reopenedSdk);
    expect((await (await reopenedSdk.getRun(run.id)).snapshot()).status).toBe("completed");
    if (inPlaceDelivery) expect((await (await reopenedSdk.getRun(run.id)).snapshot()).workspaceDelivery?.status).toBe("synced");
    expect(adapter.open).toHaveBeenCalledTimes(1);
  }, 60_000);
});
