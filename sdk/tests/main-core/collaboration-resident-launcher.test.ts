import { describe, expect, it, vi } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { projectMcpSource } from "./fixtures/project-mcp-source.js";
import { compileInvocationPolicy } from "../../src/core/harness-runtime/invocation-policy.js";
import { createProductionCollaborationResidentLauncher } from "../../src/core/collaboration-resident-launcher.js";
import type { CollaborationResidentOpenInput } from "../../src/core/collaboration-runtime.js";
import { ResidentTurnPreparationError, type HarnessRuntimeResidentAdapter } from "../../src/core/harness-runtime/resident-runtime-adapter.js";
import type { HarnessRuntimeFacade } from "../../src/core/harness-runtime/runtime.js";
import type { GroupRun, MemberExecution, ProjectState } from "../../src/core/types.js";

describe("production collaboration resident launcher", () => {
  it.each(["pause", "resume"] as const)("retries an incomplete normal close before %s without reusing the closing handle", async action => {
    const state = { id: "prj_normal_close", orchestration: { schemaVersion: 3 },
      agents: { main: { harness: "pi", mcpServers: [] } } } as unknown as ProjectState;
    const failure = new Error("Original process stop is not yet confirmed");
    const lease = { session: fixtureSession("pi", "original-close-session"), acknowledgedControlSeq: 2 };
    let stopConfirmed = false;
    const nativeClose = vi.fn(async () => { if (!stopConfirmed) throw failure; });
    const nativePause = vi.fn(async () => { throw new Error("Closing handle cannot pause"); });
    const nativeResume = vi.fn(async () => { throw new Error("Closing handle cannot resume"); });
    const launcher = createProductionCollaborationResidentLauncher({} as HarnessRuntimeFacade, {
      open: async () => ({ initialLease: lease, probe: async () => lease, close: nativeClose,
        pause: nativePause, resume: nativeResume })
    } as unknown as HarnessRuntimeResidentAdapter);
    const handle = await launcher.open(routeOpen(state));
    try {
      await expect(handle.close()).rejects.toBe(failure);
      expect(handle.closed).toBe(false);
      await expect(handle[action]()).rejects.toBe(failure);
      expect(handle.closed).toBe(false);
      stopConfirmed = true;
      await handle[action]();
      expect(handle.closed).toBe(true);
      expect(nativeClose).toHaveBeenCalledTimes(3);
      expect(nativePause).not.toHaveBeenCalled();
      expect(nativeResume).not.toHaveBeenCalled();
    } finally { stopConfirmed = true; await handle.close(); }
  });

  it.each(["leader", "delivery"] as const)("retains the failed %s submit fence until its shared native close finishes", async (role) => {
    const state = { id: "prj_failed_pause", orchestration: { schemaVersion: 3 },
      agents: { main: { harness: "pi", mcpServers: [] } } } as unknown as ProjectState;
    const input = routeOpen(state);
    if (role === "delivery") {
      input.request.executionContext = { role, nodeRunId: "node-one", groupRunId: "group-one",
        executionId: "same-task", ownershipEpoch: 1, executionWorktree: input.request.workspacePath };
      input.inputs = undefined; input.controlScope = undefined;
    }
    const failure = new Error("Original native turn failed");
    let releaseClose!: () => void;
    const closeGate = new Promise<void>(resolve => { releaseClose = resolve; });
    const lease = { session: fixtureSession("pi", "same-failed-session"), acknowledgedControlSeq: 2 };
    const nativeClose = vi.fn(async () => { await closeGate; });
    const nativePause = vi.fn(async () => undefined);
    const launcher = createProductionCollaborationResidentLauncher({} as HarnessRuntimeFacade, {
      open: async () => ({ initialLease: lease, probe: async () => lease, close: nativeClose, pause: nativePause,
        submit: async () => { throw failure; } })
    } as unknown as HarnessRuntimeResidentAdapter);
    const handle = await launcher.open(input);
    let returned = false;
    const submitted = handle.submit({ inputId: "same-input", invocationId: "same-invocation", prompt: "same assignment" })
      .catch(error => { returned = true; return error; });
    const paused = handle.pause();
    try {
      await vi.waitFor(() => expect(nativeClose).toHaveBeenCalledOnce());
      const concurrentClose = handle.close();
      expect(returned).toBe(false);
      releaseClose();
      expect(await submitted).toBe(failure);
      await paused;
      await concurrentClose;
      await handle.close();
      expect(nativeClose).toHaveBeenCalledOnce();
      expect(nativePause).not.toHaveBeenCalled();
    } finally { releaseClose(); await submitted; await paused; await handle.close(); }
  });

  it.each(["leader", "delivery"] as const)("reconciles a failed %s close before a later Pause", async role => {
    const state = { id: "prj_failed_close_pause", orchestration: { schemaVersion: 3 },
      agents: { main: { harness: "pi", mcpServers: [] } } } as unknown as ProjectState;
    const input = routeOpen(state);
    if (role === "delivery") {
      input.request.executionContext = { role, nodeRunId: "node-one", groupRunId: "group-one",
        executionId: "same-task", ownershipEpoch: 1, executionWorktree: input.request.workspacePath };
      input.inputs = undefined; input.controlScope = undefined;
    }
    const closeFailure = new Error("Original native close remains unconfirmed");
    let rejectClose = true;
    const lease = { session: fixtureSession("pi", "same-failed-close-session"), acknowledgedControlSeq: 2 };
    const nativeClose = vi.fn(async () => { if (rejectClose) throw closeFailure; });
    const nativePause = vi.fn(async () => { throw new Error("Crashed lease cannot accept Pause"); });
    const launcher = createProductionCollaborationResidentLauncher({} as HarnessRuntimeFacade, {
      open: async () => ({ initialLease: lease, probe: async () => lease, close: nativeClose, pause: nativePause,
        submit: async () => { throw new Error("Original native turn failed"); } })
    } as unknown as HarnessRuntimeResidentAdapter);
    const handle = await launcher.open(input);
    try {
      await expect(handle.submit({ inputId: "same-input", invocationId: "same-invocation", prompt: "same assignment" }))
        .rejects.toBe(closeFailure);
      await expect(handle.pause()).rejects.toBe(closeFailure);
      expect(nativePause).not.toHaveBeenCalled(); expect(nativeClose).toHaveBeenCalledTimes(2);
      rejectClose = false;
      await handle.pause(); await handle.pause();
      expect(nativeClose).toHaveBeenCalledTimes(3); expect(nativePause).not.toHaveBeenCalled();
    } finally { rejectClose = false; await handle.close(); }
  });

  it("retains the resident after a preparation refusal while Pause waits for that submit", async () => {
    const state = { id: "prj_rejected_turn", orchestration: { schemaVersion: 3 },
      agents: { main: { harness: "pi", mcpServers: [] } } } as unknown as ProjectState;
    const refusal = new Error("Unreserved invocation changed stable process authority");
    let rejectPreparation!: () => void;
    const preparation = new Promise<void>(resolve => { rejectPreparation = resolve; });
    const lease = { session: fixtureSession("pi", "original-session"), acknowledgedControlSeq: 2 };
    const nativeClose = vi.fn(async () => undefined);
    const nativePause = vi.fn(async () => undefined);
    const nativeResume = vi.fn(async () => undefined);
    const launcher = createProductionCollaborationResidentLauncher({} as HarnessRuntimeFacade, {
      open: async () => ({ initialLease: lease, probe: async () => lease, close: nativeClose,
        pause: nativePause, resume: nativeResume, submit: async (turn: { invocationId: string }) => {
          if (turn.invocationId === "unreserved") {
            await preparation;
            throw new ResidentTurnPreparationError(refusal);
          }
          return { threadId: lease.session.nativeId, handoff: "original task" };
        } })
    } as unknown as HarnessRuntimeResidentAdapter);
    const handle = await launcher.open(routeOpen(state));
    const submitted = handle.submit({ inputId: "invalid", invocationId: "unreserved", prompt: "refuse this turn" })
      .catch(error => error);
    const paused = handle.pause();
    try {
      expect(nativePause).not.toHaveBeenCalled();
      rejectPreparation();
      expect(await submitted).toBe(refusal);
      await paused;
      expect(nativePause).toHaveBeenCalledOnce();
      expect(nativeClose).not.toHaveBeenCalled();
      await handle.resume();
      expect(nativeResume).toHaveBeenCalledOnce();
      await expect(handle.submit({ inputId: "valid", invocationId: "reserved", prompt: "continue the same task" }))
        .resolves.toMatchObject({ threadId: "original-session", handoff: "original task" });
      expect(nativeClose).not.toHaveBeenCalled();
    } finally { rejectPreparation(); await submitted; await paused; await handle.close(); }
  });

  it.each(["adapter", "publish"] as const)("supplement invalidates the old close proof even if %s fails", async (stage) => {
    const state = { id: "prj_failed_supplement", orchestration: { schemaVersion: 3 },
      agents: { main: { harness: "pi", mcpServers: [] } } } as unknown as ProjectState;
    const input = routeOpen(state);
    input.request.executionContext = { role: "delivery", nodeRunId: "node-one", groupRunId: "group-one",
      executionId: "same-task", ownershipEpoch: 1, executionWorktree: input.request.workspacePath };
    input.inputs = undefined; input.controlScope = undefined;
    let opens = 0;
    const cleanup = vi.fn(async (_identity, runtimePath: string) => {
      if (runtimePath === "/tmp/new-native-runtime") throw new Error("New process stop is unknown");
    });
    const reconcile = vi.fn(async () => ({ outcome: "none" }));
    const open = vi.fn(async () => {
      opens += 1;
      if (opens === 2 && stage === "adapter") throw new Error("New native launch failed");
      const lease = { session: fixtureSession("pi", "same-session"), acknowledgedControlSeq: 0 };
      return { initialLease: lease, probe: async () => lease, close: async () => {
        if (opens === 2) throw new Error("New native close failed");
      } };
    });
    const launcher = createProductionCollaborationResidentLauncher({ cleanupResidentInterrupted: cleanup,
      reconcileResidentStartup: reconcile } as unknown as HarnessRuntimeFacade, { open } as unknown as HarnessRuntimeResidentAdapter);
    const old = await launcher.open(input); await old.close();
    const supplement = { ...input, executionRuntimePath: "/tmp/new-native-runtime",
      request: { ...input.request, runtimePath: "/tmp/new-native-runtime" },
      sameEpochReopen: { previousRuntimePath: input.executionRuntimePath, revalidate: () => undefined },
      onOpened: async () => { throw new Error("New publication failed"); } };
    await expect(launcher.open(supplement)).rejects.toThrow();
    await expect(launcher.stopScopedForRecovery!({ state, scopeId: "same-task", agentId: "main", role: "delivery",
      ownershipEpoch: 1, executionRuntimePath: supplement.executionRuntimePath })).rejects.toThrow("New process stop is unknown");
    expect(reconcile).toHaveBeenCalled();
    expect(cleanup).toHaveBeenLastCalledWith(expect.objectContaining({ scopeId: "same-task", ownershipEpoch: 1 }),
      supplement.executionRuntimePath, { allowMissingClaim: true });
  });

  it.each(["valid", "S-before", "physical-stop", "S-after"] as const)("supplement checks exact S and native stop before opening (%s)", async (mode) => {
    const state = { id: "prj_scoped_supplement", orchestration: { schemaVersion: 3 },
      agents: { main: { harness: "pi", mcpServers: [] } } } as unknown as ProjectState;
    const input = routeOpen(state);
    input.request.executionContext = { role: "delivery", nodeRunId: "node-one", groupRunId: "group-one",
      executionId: "original-exec", ownershipEpoch: 1, executionWorktree: input.request.workspacePath };
    input.inputs = undefined; input.controlScope = undefined;
    let checks = 0;
    input.sameEpochReopen = { previousRuntimePath: "/tmp/previous-native-runtime", revalidate: () => {
      checks += 1;
      if (mode === "S-before" || mode === "S-after" && checks === 2) throw new Error("S grant revoked");
    } };
    const cleanup = vi.fn(async () => { if (mode === "physical-stop") throw new Error("Native process stop is unproved"); });
    const nativeClose = vi.fn(async () => undefined);
    const open = vi.fn(async (native: CollaborationResidentOpenInput) => {
      await native.sameEpochReopen!.revalidate();
      expect(native.request.executionContext).toEqual(input.request.executionContext);
      expect(native.sameEpochReopen!.previousRuntimePath).toBe(input.sameEpochReopen!.previousRuntimePath);
      const lease = { session: fixtureSession("pi", "original-session"), acknowledgedControlSeq: 0 };
      return { initialLease: lease, probe: async () => lease, close: nativeClose };
    });
    const launcher = createProductionCollaborationResidentLauncher({ cleanupResidentInterrupted: cleanup } as unknown as HarnessRuntimeFacade,
      { open } as unknown as HarnessRuntimeResidentAdapter);
    if (mode !== "valid") {
      await expect(launcher.open(input)).rejects.toThrow();
      expect(open).not.toHaveBeenCalled();
    } else {
      const handle = await launcher.open(input);
      expect(checks).toBe(4);
      expect(cleanup).toHaveBeenCalledExactlyOnceWith({ projectId: state.id, harnessId: "pi", scopeId: "original-exec",
        role: "delivery", executionId: "original-exec", ownershipEpoch: 1 }, "/tmp/previous-native-runtime", { allowMissingClaim: true });
      await handle.close();
      expect(nativeClose).toHaveBeenCalledOnce();
    }
  });

  it("resolves real project MCPs for stable turns without changing durable references and closes their processes", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-resident-mcp-"));
    const state = {
      id: "prj_resident_mcp",
      agents: { main: { harness: "codex", mcpServers: [{ name: "evidence", project: "evidence" }] } },
      mcpDefinitions: { evidence: { entrypoint: "server.cjs", files: { "server.cjs": projectMcpSource("one") } } }
    } as unknown as ProjectState;
    const input = routeOpen(state);
    input.request.projectPath = path.join(root, state.id);
    input.request.workspacePath = path.join(root, "workspace");
    input.request.runtimePath = path.join(root, "runtime");
    await fs.mkdir(input.request.workspacePath);
    let changed = false;
    input.turnRequestFactory = async ({ turn }) => {
      const request = { ...input.request, project: structuredClone(state), invocationId: turn.invocationId };
      if (changed) request.project.mcpDefinitions!.evidence.files["server.cjs"] = projectMcpSource("two");
      return { request, onTrace: input.onTrace };
    };
    const client = new Client({ name: "resident-mcp-test", version: "1" }, { capabilities: {} });
    let endpoint = "";
    const nativeClose = vi.fn(async () => undefined);
    const adapter = {
      async open(open: CollaborationResidentOpenInput) {
        const selected = open.request.project.agents.main.mcpServers[0];
        endpoint = selected.url!;
        expect(selected).toEqual({ name: "evidence", url: expect.stringMatching(/^http:\/\/127\.0\.0\.1:/) });
        expect(compileInvocationPolicy(open.request.project.agents.main, open.request).mcpServers[0].url).toBe(endpoint);
        await client.connect(new StreamableHTTPClientTransport(new URL(endpoint)));
        const lease = { session: fixtureSession("codex", "session-mcp"), acknowledgedControlSeq: 1 };
        return {
          initialLease: lease,
          async submit(turn: { invocationId: string; inputId: string; prompt: string }) {
            const runtime = await open.turnRequestFactory!({ baseRequest: open.request, turn });
            expect(runtime.request.project.agents.main.mcpServers[0].url).toBe(endpoint);
            const receipt = await client.callTool({ name: "evidence", arguments: {} });
            return { handoff: JSON.stringify(receipt) };
          },
          async pause() {}, async resume() {}, async probe() { return lease; }, close: nativeClose
        };
      }
    } as unknown as HarnessRuntimeResidentAdapter;
    const launcher = createProductionCollaborationResidentLauncher({} as HarnessRuntimeFacade, adapter);
    let handle: Awaited<ReturnType<typeof launcher.open>> | undefined;
    try {
      handle = await launcher.open(input);
      const first = await handle.submit({ invocationId: "mcp-turn-1", inputId: "mcp-input-1", prompt: "inspect" });
      const second = await handle.submit({ invocationId: "mcp-turn-2", inputId: "mcp-input-2", prompt: "inspect again" });
      const receipt = (handoff: string) => JSON.parse(JSON.parse(handoff).content[0].text);
      expect(receipt(first.handoff!)).toMatchObject({ version: "one", cwd: input.request.workspacePath });
      expect(receipt(second.handoff!).pid).toBe(receipt(first.handoff!).pid);
      expect(state.agents.main.mcpServers).toEqual([{ name: "evidence", project: "evidence" }]);
      changed = true;
      await expect(handle.submit({ invocationId: "mcp-turn-3", inputId: "mcp-input-3", prompt: "changed service" }))
        .rejects.toThrow("configuration changed during a live scope");
      await client.close();
      await handle.close();
      expect(nativeClose).toHaveBeenCalledTimes(1);
      await expect(fetch(endpoint, { signal: AbortSignal.timeout(1000) })).rejects.toThrow();
      await handle.close();
      expect(nativeClose).toHaveBeenCalledTimes(1);
    } finally {
      await client.close().catch(() => undefined);
      await handle?.close().catch(() => undefined);
      await fs.rm(root, { recursive: true, force: true });
    }
  });

  it.each(["open", "onOpened"])("cleans up the project MCP when resident %s fails", async (stage) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-resident-mcp-failure-"));
    const state = {
      id: "prj_resident_mcp_failure",
      agents: { main: { harness: "codex", mcpServers: [{ name: "evidence", project: "evidence" }] } },
      mcpDefinitions: { evidence: { entrypoint: "server.cjs", files: { "server.cjs": projectMcpSource("one") } } }
    } as unknown as ProjectState;
    const input = routeOpen(state);
    input.request.projectPath = path.join(root, state.id);
    input.request.workspacePath = path.join(root, "workspace");
    input.request.runtimePath = path.join(root, "runtime");
    await fs.mkdir(input.request.workspacePath);
    const nativeClose = vi.fn(async () => undefined);
    let endpoint = "";
    const adapter = {
      async open(open: CollaborationResidentOpenInput) {
        endpoint = open.request.project.agents.main.mcpServers[0].url!;
        if (stage === "open") throw new Error("native startup rejected");
        return { close: nativeClose };
      }
    } as unknown as HarnessRuntimeResidentAdapter;
    if (stage === "onOpened") input.onOpened = async () => { throw new Error("ownership rejected"); };
    const launcher = createProductionCollaborationResidentLauncher({} as HarnessRuntimeFacade, adapter);
    try {
      await expect(launcher.open(input)).rejects.toThrow(stage === "open" ? "native startup rejected" : "ownership rejected");
      await expect(fetch(endpoint, { signal: AbortSignal.timeout(1000) })).rejects.toThrow();
      expect(nativeClose).toHaveBeenCalledTimes(stage === "open" ? 0 : 1);
    } finally { await fs.rm(root, { recursive: true, force: true }); }
  });

  it("recovers the first DSH Main launch after an exact absence scan without inventing a session", async () => {
    const cleanup = vi.fn(async () => undefined);
    const runtime = {
      residentRecoveryStrategy: () => "durable-rehydrate",
      reconcileResidentStartup: async () => ({ outcome: "none" }),
      cleanupResidentInterrupted: cleanup
    } as unknown as HarnessRuntimeFacade;
    const launcher = createProductionCollaborationResidentLauncher(runtime, {} as HarnessRuntimeResidentAdapter);
    const result = await launcher.observeMainRouteRecovery!({
      state: { id: "project-first-launch", agents: { main: { harness: "dsh" } }, agentSessions: {} } as unknown as ProjectState,
      sourceNodeRunId: "node-first", routeScopeId: "main-route-node-first", routeEpoch: 1,
      executionRuntimePath: "/tmp/first-launch-runtime"
    });
    expect(result).toMatchObject({ stopped: true, evidence: { residentProcessScanCleared: true, sessionNotPreviouslyCommitted: true } });
    expect(result.recovery).toBeUndefined();
    expect(cleanup).toHaveBeenCalledWith(expect.objectContaining({ harnessId: "dsh", coordinatorEpoch: 1 }),
      "/tmp/first-launch-runtime", { allowMissingClaim: true });
  });

  it("uses the stable v3 Agent session in DSH recovery", async () => {
    const runtime = {
      residentRecoveryStrategy: () => "durable-rehydrate",
      reconcileResidentStartup: async () => ({ outcome: "none" }),
      cleanupResidentInterrupted: async () => undefined
    } as unknown as HarnessRuntimeFacade;
    const launcher = createProductionCollaborationResidentLauncher(runtime, {} as HarnessRuntimeResidentAdapter);
    const result = await launcher.observeMainRouteRecovery!({
      state: { id: "project-v3", orchestration: { schemaVersion: 3 }, agents: { main: { harness: "dsh" } },
        agentSessions: { main: fixtureSession("dsh", "stable-main") } } as unknown as ProjectState,
      sourceNodeRunId: "node-v3", routeScopeId: "main-route-node-v3", routeEpoch: 1,
      executionRuntimePath: "/tmp/v3-runtime"
    });
    expect(result).toMatchObject({ stopped: true, recovery: { oldSession: { nativeId: "stable-main" } } });
  });

  it("fails closed for a legacy no-claim launch and permits only exact trusted provenance", async () => {
    const cleanupOptions: Array<{ allowMissingClaim?: boolean }> = [];
    const runtime = {
      residentRecoveryStrategy() {
        return "native-session-resume";
      },
      async reconcileResidentStartup() {
        return { outcome: "none" as const };
      },
      async cleanupResidentInterrupted(
        _identity: Readonly<Record<string, unknown>>,
        _runtimePath: string,
        options: { allowMissingClaim?: boolean } = {}
      ) {
        cleanupOptions.push(options);
        if (!options.allowMissingClaim) {
          throw new Error("no trusted launch claim or durable launch protocol proof");
        }
      }
    } as unknown as HarnessRuntimeFacade;
    const adapter = {} as HarnessRuntimeResidentAdapter;
    const launcher = createProductionCollaborationResidentLauncher(runtime, adapter);
    const state = {
      id: "project-provenance",
      agents: { worker: { harness: "dsh" } },
      agentSessions: {
        "worker::collaboration:delivery:execution-provenance": fixtureSession(
          "dsh",
          "session-provenance"
        )
      }
    } as unknown as ProjectState;
    const execution = {
      id: "execution-provenance",
      nodeRunId: "node-provenance",
      taskId: "task-provenance",
      agentId: "worker",
      purpose: "delivery",
      ownershipEpoch: 3,
      status: "working",
      executionBranch: "executions/execution-provenance",
      worktreePath: "/tmp/provenance-worktree",
      invocationId: "invocation-provenance"
    } as MemberExecution;

    await expect(launcher.stopForRecovery!({
      state,
      execution,
      executionRuntimePath: "/tmp/provenance-runtime"
    })).rejects.toThrow("no trusted launch claim or durable launch protocol proof");
    await expect(launcher.stopForRecovery!({
      state,
      execution,
      executionRuntimePath: "/tmp/provenance-runtime",
      residentLaunchProtocol: "trusted-supervisor-v1"
    })).resolves.toMatchObject({
      stopped: true,
      evidence: { runtimeOutcome: "none", residentProcessScanCleared: true }
    });
    expect(cleanupOptions).toEqual([
      { allowMissingClaim: false },
      { allowMissingClaim: true }
    ]);
  });

  it("composes real stop reconciliation, Main routing, close proof, and DSH provenance", async () => {
    const reconciliations: Array<{ executionId: string; nextOwnershipEpoch: number }> = [];
    const recoveryOutcomes = new Map<string, "none" | "dead" | "terminated" | "identity-mismatch">([
      ["execution-1", "terminated"],
      ["execution-dead", "dead"],
      ["execution-mismatch", "identity-mismatch"]
    ]);
    const cleanupCalls: Array<{
      identity: Readonly<Record<string, unknown>>;
      runtimePath: string;
    }> = [];
    const runtime = {
      residentRecoveryStrategy(harnessId: string) {
        return harnessId === "dsh" ? "durable-rehydrate" : "native-session-resume";
      },
      async reconcileResidentStartup(input: { executionId: string; nextOwnershipEpoch: number }) {
        reconciliations.push(input);
        return { outcome: recoveryOutcomes.get(input.executionId) ?? "none" };
      },
      async cleanupResidentInterrupted(
        identity: Readonly<Record<string, unknown>>,
        runtimePath: string
      ) {
        cleanupCalls.push({ identity, runtimePath });
        if (identity.scopeId === "execution-cleanup-throws" ||
          identity.coordinatorEpoch === 2) {
          throw new Error("process scan could not prove absence");
        }
      }
    } as unknown as HarnessRuntimeFacade;
    let closes = 0;
    const adapter = {
      async open(input: CollaborationResidentOpenInput) {
        const context = input.request.executionContext!;
        const lease = {
          session: fixtureSession("codex", "session-main-route"),
          acknowledgedControlSeq: 1,
          ownershipEpoch: context.coordinatorEpoch ?? context.ownershipEpoch
        };
        return {
          initialLease: lease,
          async submit(turn: { invocationId: string }) {
            return {
              handoff: "route only",
              controlActions: [{
                projectId: "project-1",
                agent: "main",
                invocationId: turn.invocationId,
                callId: "route-call-1",
                stateVersion: 1,
                capabilityHash: "fixture",
                receivedAt: new Date().toISOString(),
                action: { tool: "route_to_agent" as const, target: "next" }
              }]
            };
          },
          async pause() {},
          async resume() {},
          async probe() { return lease; },
          async close() { closes += 1; }
        };
      }
    } as unknown as HarnessRuntimeResidentAdapter;
    const launcher = createProductionCollaborationResidentLauncher(runtime, adapter);
    const state = {
      id: "project-1",
      agents: {
        main: { harness: "codex" },
        worker: { harness: "dsh" }
      },
      agentSessions: {
        "worker::collaboration:delivery:execution-1": fixtureSession("dsh", "session-execution-1"),
        "worker::collaboration:delivery:execution-missing-marker": fixtureSession(
          "dsh",
          "session-execution-missing-marker"
        ),
        "worker::collaboration:delivery:execution-dead": fixtureSession("dsh", "session-execution-dead"),
        "worker::collaboration:delivery:execution-mismatch": fixtureSession(
          "dsh",
          "session-execution-mismatch"
        ),
        "main::collaboration:leader:group-leader-cleanup": fixtureSession(
          "codex",
          "session-group-leader"
        )
      }
    } as unknown as ProjectState;
    const open = routeOpen(state);
    const decision = await launcher.decideRoute!({
      state,
      sourceNodeRunId: "node-1",
      sourceAgentId: "worker",
      output: "done",
      candidates: ["next", "finish"],
      signal: new AbortController().signal,
      open,
      turn: { inputId: "route-input", invocationId: "route-invocation", prompt: "choose" }
    });
    expect(decision).toEqual({
      decisionRecorded: true,
      targetNodeId: "next",
      decisionRequestId: "route-call-1",
      output: "route only",
      decisionAction: { tool: "route_to_agent", target: "next" },
      controlActions: [expect.objectContaining({ callId: "route-call-1", action: { tool: "route_to_agent", target: "next" } })]
    });
    expect(reconciliations).toEqual([{
      executionId: "management:node-1:main-route-node-1",
      nextOwnershipEpoch: 1,
      harnessId: "codex",
      runtimePath: "/tmp/runtime"
    }]);
    expect(closes).toBe(1);
    await expect(launcher.observeMainRouteRecovery!({
      state,
      sourceNodeRunId: "node-1",
      routeScopeId: "main-route-node-1",
      routeEpoch: 1,
      executionRuntimePath: "/tmp/runtime"
    })).resolves.toMatchObject({
      stopped: true,
      evidence: { runtimeOutcome: "closed-in-process", markerObserved: true },
      recovery: {
        scope: "main-route",
        sourceNodeRunId: "node-1",
        scopeId: "main-route-node-1",
        stoppedEpoch: 1,
        oldSession: { nativeId: "session-main-route" }
      }
    });
    const execution = {
      id: "execution-1",
      nodeRunId: "node-1",
      taskId: "task-1",
      agentId: "worker",
      purpose: "delivery",
      ownershipEpoch: 4,
      status: "working",
      executionBranch: "executions/execution-1",
      worktreePath: "/tmp/worktree",
      invocationId: "invocation-execution-1"
    } as MemberExecution;
    const stopped = await launcher.stopForRecovery!({
      state,
      execution,
      executionRuntimePath: "/tmp/execution-runtime"
    });
    expect(stopped.stopped).toBe(true);
    expect(stopped.recovery?.durableRehydrate).toMatchObject({
      sourceDigest: expect.stringMatching(/^[a-f0-9]{64}$/),
      lastBusinessTurn: 0,
      lastInputId: "execution:execution-1:epoch:4"
    });
    expect(stopped.recovery).toMatchObject({
      scope: "member",
      sourceNodeRunId: "node-1",
      scopeId: "execution-1",
      agentId: "worker",
      stoppedEpoch: 4,
      oldSession: { nativeId: "session-execution-1" },
      oldSessionDigest: expect.stringMatching(/^[a-f0-9]{64}$/)
    });
    for (const [id, outcome] of [
      ["execution-missing-marker", "none"],
      ["execution-dead", "dead"],
      ["execution-mismatch", "identity-mismatch"]
    ] as const) {
      const cleaned = await launcher.stopForRecovery!({
        state,
        execution: { ...execution, id, invocationId: `invocation-${id}` },
        executionRuntimePath: `/tmp/${id}`
      });
      expect(cleaned).toMatchObject({
        stopped: true,
        evidence: { runtimeOutcome: outcome, residentProcessScanCleared: true }
      });
    }
    expect(cleanupCalls).toEqual([
      {
        identity: {
          projectId: "project-1",
          harnessId: "dsh",
          scopeId: "execution-missing-marker",
          role: "delivery",
          executionId: "execution-missing-marker",
          ownershipEpoch: 4
        },
        runtimePath: "/tmp/execution-missing-marker"
      },
      {
        identity: expect.objectContaining({ scopeId: "execution-dead", ownershipEpoch: 4 }),
        runtimePath: "/tmp/execution-dead"
      },
      {
        identity: expect.objectContaining({ scopeId: "execution-mismatch", ownershipEpoch: 4 }),
        runtimePath: "/tmp/execution-mismatch"
      }
    ]);
    await expect(launcher.observeMainRouteRecovery!({
      state,
      sourceNodeRunId: "node-pre-launch-failure",
      routeScopeId: "main-route-node-pre-launch-failure",
      routeEpoch: 1,
      executionRuntimePath: "/tmp/main-route-pre-launch"
    })).resolves.toMatchObject({
      stopped: true,
      evidence: {
        runtimeOutcome: "none",
        markerObserved: false,
        residentProcessScanCleared: true
      }
    });
    expect(cleanupCalls).toContainEqual({
      identity: {
        projectId: "project-1",
        harnessId: "codex",
        scopeId: "management:node-pre-launch-failure:main-route-node-pre-launch-failure",
        role: "leader",
        coordinatorEpoch: 1
      },
      runtimePath: "/tmp/main-route-pre-launch"
    });
    const reconciliationCountAfterProof = reconciliations.length;
    await launcher.decideRoute!({
      state,
      sourceNodeRunId: "node-pre-launch-failure",
      sourceAgentId: "main",
      output: "retry after exact stop proof",
      candidates: ["next"],
      signal: new AbortController().signal,
      open: {
        ...routeOpen(state),
        executionRuntimePath: "/tmp/main-route-pre-launch",
        request: {
          ...routeOpen(state).request,
          executionContext: {
            nodeRunId: "node-pre-launch-failure",
            groupRunId: "main-route-node-pre-launch-failure",
            role: "leader",
            coordinatorEpoch: 2
          }
        }
      },
      turn: { inputId: "retry-route-input", invocationId: "retry-route-invocation", prompt: "choose" }
    });
    expect(reconciliations).toHaveLength(reconciliationCountAfterProof);
    await expect(launcher.stopForRecovery!({
      state,
      execution: {
        ...execution,
        id: "execution-cleanup-throws",
        invocationId: "invocation-execution-cleanup-throws"
      },
      executionRuntimePath: "/tmp/execution-cleanup-throws"
    })).rejects.toThrow("process scan could not prove absence");

    const group = {
      id: "main-route-node-1",
      nodeRunId: "node-1",
      leaderAgentId: "main",
      coordinatorEpoch: 1,
      status: "running",
      taskIds: []
    } as unknown as GroupRun;
    const cleanupGroup = {
      ...group,
      id: "group-leader-cleanup",
      nodeRunId: "node-leader-cleanup"
    } as GroupRun;
    const stoppedLeader = await launcher.stopLeaderForRecovery!({
      state,
      groupRun: cleanupGroup,
      nodeRunId: cleanupGroup.nodeRunId,
      leaderInvocationId: "invocation-group-leader-epoch-1",
      executionRuntimePath: "/tmp/group-leader-runtime"
    });
    expect(stoppedLeader).toMatchObject({
      stopped: true,
      evidence: { runtimeOutcome: "none", residentProcessScanCleared: true },
      recovery: {
        scope: "group-leader",
        sourceNodeRunId: "node-leader-cleanup",
        scopeId: "group-leader-cleanup",
        agentId: "main",
        stoppedEpoch: 1,
        oldSession: { nativeId: "session-group-leader" }
      }
    });
    expect(cleanupCalls).toContainEqual({
      identity: expect.objectContaining({
        scopeId: "management:node-leader-cleanup:group-leader-cleanup",
        role: "leader",
        coordinatorEpoch: 1
      }),
      runtimePath: "/tmp/group-leader-runtime"
    });
    await expect(launcher.stopLeaderForRecovery!({
      state,
      groupRun: { ...cleanupGroup, coordinatorEpoch: 2 },
      nodeRunId: cleanupGroup.nodeRunId,
      leaderInvocationId: "invocation-execution-cleanup-throws",
      executionRuntimePath: "/tmp/group-leader-runtime-epoch-2"
    })).rejects.toThrow("process scan could not prove absence");
    // The route handle above closed this exact scope. Reopening it creates a
    // new live process and must revoke that cached stop proof; recovery then
    // has to consult the independent runtime again.
    await launcher.open(open);
    const observed = await launcher.observeMainRecovery!({
      state,
      groupRun: group,
      executionRuntimePath: "/tmp/runtime"
    });
    expect(observed).toEqual({
      stopped: false,
      evidence: { runtimeOutcome: "none", markerObserved: false }
    });
    expect("observedFacts" in observed).toBe(false);
    expect(reconciliations).toContainEqual({
      executionId: "management:node-1:main-route-node-1",
      nextOwnershipEpoch: 2,
      harnessId: "codex",
      runtimePath: "/tmp/runtime"
    });
  });

  it("returns a normal decision-free turn instead of manufacturing a route failure", async () => {
    let closes = 0;
    const runtime = {
      residentRecoveryStrategy() { return "native-session-resume"; },
      async reconcileResidentStartup() { return { outcome: "none" as const }; }
    } as unknown as HarnessRuntimeFacade;
    const adapter = {
      async open() {
        return {
          initialLease: {},
          async submit() { return { handoff: "Still inspecting route evidence." }; },
          async pause() {},
          async resume() {},
          async probe() { return {}; },
          async close() { closes += 1; }
        };
      }
    } as unknown as HarnessRuntimeResidentAdapter;
    const launcher = createProductionCollaborationResidentLauncher(runtime, adapter);
    const state = {
      id: "project-no-decision",
      agents: { main: { harness: "codex" } }
    } as unknown as ProjectState;

    await expect(launcher.decideRoute!({
      state,
      sourceNodeRunId: "node-no-decision",
      sourceAgentId: "worker",
      output: "work complete",
      candidates: ["next"],
      signal: new AbortController().signal,
      open: routeOpen(state),
      turn: {
        inputId: "route-input-no-decision",
        invocationId: "route-invocation-no-decision",
        prompt: "continue normally"
      }
    })).resolves.toEqual({
      decisionRecorded: false,
      output: "Still inspecting route evidence."
    });
    expect(closes).toBe(1);
  });
});

function routeOpen(state: ProjectState): CollaborationResidentOpenInput {
  return {
    request: {
      project: state,
      purpose: "workflow",
      agent: "main",
      kind: "main",
      permission: "workspace",
      invocationId: "route-invocation",
      inboxPath: "/tmp/inbox",
      projectPath: "/tmp/project",
      workspacePath: "/tmp/management",
      schemaPath: "/tmp/schema",
      skillPaths: [],
      autoSkillPaths: [],
      availableSkillPaths: [],
      runtimePath: "/tmp/runtime",
      executionContext: {
        nodeRunId: "node-1",
        groupRunId: "main-route-node-1",
        role: "leader",
        coordinatorEpoch: 1
      }
    },
    executionRuntimePath: "/tmp/runtime",
    filesystemAuthorityInput: {
      serviceUserRoot: "/tmp",
      projectWorktreeRoot: "/tmp/worktrees",
      protectedRoots: []
    },
    signal: new AbortController().signal,
    onTrace: async () => undefined,
    turnRequestFactory: async ({ baseRequest, turn }) => ({
      request: { ...baseRequest, invocationId: turn.invocationId },
      onTrace: async () => undefined
    }),
    inputs: {
      projectPath: "/tmp/project",
      workspacePath: "/tmp/management",
      inboxPath: "/tmp/inbox",
      memoryPath: "/tmp/memory",
      runtimePath: "/tmp/runtime",
      inboxSha256: "a".repeat(64)
    },
    controlScope: {
      projectId: state.id,
      nodeRunId: "node-1",
      groupRunId: "main-route-node-1",
      leaderAgentId: "main",
      coordinatorEpoch: 1
    }
  };
}

function fixtureSession(harnessId: string, nativeId: string) {
  return {
    schemaVersion: 1 as const,
    harnessId,
    adapterVersion: "fixture-v1",
    generation: 1,
    nativeId,
    durable: true,
    createdAt: "2026-09-26T00:00:00.000Z"
  };
}
