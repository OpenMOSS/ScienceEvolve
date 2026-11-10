import { afterEach, describe, expect, it, vi } from "vitest";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SiiExperimentService, assertSiiControlAction, type SiiMcpBinding } from "../../src/core/sii-experiments.js";
import { ControlActionService } from "../../src/core/orchestration-control-bridge.js";
import { ProjectInspireWorkloadRegistry } from "../../src/core/inspire-workload-registry.js";
import type { AgentRunRequest } from "../../src/core/types.js";
import type { SessionRef } from "../../src/core/harness-runtime/contracts.js";

// Windows cannot execute shebang .cjs fixtures directly. Keep real child I/O
// and CLI argument construction, selecting Node only for these test programs.
vi.mock("node:child_process", async (original) => {
  const actual = await original<typeof import("node:child_process")>();
  return { ...actual, execFile: (...args: Parameters<typeof actual.execFile>) => {
    if (process.platform === "win32" && typeof args[0] === "string" && /inspire-(?:fixture|progress|transport-failure)\.cjs$/.test(args[0])) {
      return actual.execFile(process.execPath, [args[0], ...(args[1] as string[])], args[2] as never, args[3] as never);
    }
    return actual.execFile(...args);
  } };
});

const PROJECT = "prj_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const services: SiiExperimentService[] = [];
const roots: string[] = [];
const session: SessionRef = { schemaVersion: 1, harnessId: "codex", adapterVersion: "1", generation: 0, nativeId: "original-thread", durable: true, createdAt: "2026-10-07T00:00:00.000Z" };
async function receiveNotification(binding: SiiMcpBinding, text: string) {
  await binding.beginResume(); binding.activate();
  await binding.observeNativeNotification({ kind: "user.message", phase: "completed", eventId: "native-user-result",
    invocationId: binding.request.invocationId, harnessId: session.harnessId, message: text }, session);
}
function nativeResult(binding: SiiMcpBinding, result: unknown) {
  return { kind: "tool.completed", phase: "completed", eventId: "native-sii-result",
    invocationId: binding.request.invocationId, harnessId: session.harnessId,
    tool: { name: "mcp__scienceevolve-sii__sii_get_experiment", callId: "native-query-call",
      status: "completed", outputPreview: JSON.stringify(result) } };
}
async function receiveResult(binding: SiiMcpBinding, result: unknown) {
  await binding.observeNativeResult(nativeResult(binding, result), session);
}
afterEach(async () => {
  vi.restoreAllMocks();
  vi.useRealTimers();
  vi.unstubAllEnvs();
  await Promise.all(services.splice(0).map(s => s.stop()));
  await Promise.all(roots.splice(0).map(root => fs.rm(root, { recursive: true, force: true })));
});

async function fixture(nativeSession: SessionRef = session) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-sii-")); roots.push(root);
  const projectPath = path.join(root, "projects", PROJECT);
  const workspacePath = path.join(projectPath, "workspaces");
  const knowledgeRoot = path.join(root, "knowledge");
  await fs.mkdir(workspacePath, { recursive: true }); await fs.mkdir(path.join(knowledgeRoot, "references"), { recursive: true });
  await fs.writeFile(path.join(knowledgeRoot, "SKILL.md"), "Original resource and path knowledge");
  await fs.writeFile(path.join(workspacePath, "Memory.md"), "Original task memory");
  await fs.writeFile(path.join(knowledgeRoot, "references", "notebook.md"), "Original notebook capabilities");
  let platformState = "job_running";
  let queryFailure = false;
  let createFailure = false;
  const runJson = vi.fn(async (args: string[]) => {
    if (args.includes("create")) { if (createFailure) throw new Error("response lost"); return { success: true, data: { name: "training-a", sub_code: 0 } }; }
    if (args.includes("status")) { if (queryFailure) throw new Error("network unavailable"); return { success: true, data: { job: { status: platformState, exit_code: platformState.includes("failed") ? 2 : 0 } } }; }
    return { success: true, data: { args } };
  });
  const options = { projectsRoot: path.join(root, "projects"), inspireBin: "unused", workspaceRoot: root, knowledgeRoot, refreshMs: 3_600_000, runJson, accountReader: async () => "account-a" };
  const service = new SiiExperimentService(options); services.push(service);
  await service.start(); await service.refreshNow();
  const onExperimentWait = vi.fn(async (_waiting: boolean) => undefined);
  const request = { project: { id: PROJECT, orchestration: { schemaVersion: 1 }, agents: { execution: { harness: nativeSession.harnessId, experimentMcp: true } } },
    agent: "execution", kind: "worker", permission: "compute", invocationId: "inv_first", taskSessionId: "original-task",
    projectPath, workspacePath, runtimePath: path.join(projectPath, "runtime", "inv_first"), onExperimentWait } as unknown as AgentRunRequest;
  const binding = await service.bind(request, new AbortController().signal); binding.session = nativeSession; binding.activate();
  const submit = (kind = "job", extra: Record<string, unknown> = {}) => binding.call("sii_submit_experiment", { args: [kind, "create", "--name", "training-a", "--workspace", "compute-space", "--project", "具有能动性的科学大模型", "--command", "python train.py"], request_id: "run-a", ...extra }) as Promise<{ experiment: { id: string; runId: string; status: string } }>;
  const due = () => service.mutate(projectPath, doc => { for (const e of doc.experiments) e.nextCheckAt = 0; });
  return { root, options, service, binding, request, runJson, onExperimentWait, submit, due,
    state: (value: string) => { platformState = value; }, failQueries: () => { queryFailure = true; }, failCreate: () => { createFailure = true; } };
}

describe("SII asynchronous experiments", () => {
  it("returns explicit platform rejections as MCP errors while preserving submission and observation facts", async () => {
    const f = await fixture();
    f.runJson.mockImplementation(async args => args.includes("--large") ? { success: false, message: "quota rejected".repeat(10000) }
      : args.includes("create") || args.includes("list")
      ? { success: false, message: "quota rejected", data: { sub_code: 1 } }
      : { success: true, data: { job: { status: "job_failed", exit_code: 2 } } });
    const client = new Client({ name: "rejected-result-client", version: "1" });
    await client.connect(new StreamableHTTPClientTransport(new URL(f.binding.url)));
    try {
      const command = await client.callTool({ name: "sii_command", arguments: { args: ["job", "list"] } });
      expect(command.isError).toBe(true);
      expect(command.structuredContent).toMatchObject({ result: { success: false, message: "quota rejected" } });
      const large = await client.callTool({ name: "sii_command", arguments: { args: ["job", "list", "--large"] } });
      expect(large.isError).toBe(true);
      expect(large.structuredContent).toMatchObject({ result: { success: false, truncated: true } });
      const args = ["job", "create", "--name", "rejected-job", "--workspace", "compute-space", "--project", "具有能动性的科学大模型"];
      const rejected = await client.callTool({ name: "sii_submit_experiment", arguments: { args, request_id: "rejected" } });
      expect(rejected.isError).toBe(true);
      const experiment = (rejected.structuredContent as any).experiment;
      expect(experiment.status).toBe("failed");
      const observation = await client.callTool({ name: "sii_get_experiment", arguments: { experiment_id: experiment.id } });
      expect(observation.isError).not.toBe(true);
      expect(observation.structuredContent).toMatchObject({ experiment: { status: "failed" } });
      const batch = await client.callTool({ name: "sii_submit_batch", arguments: { experiments: [
        { args: args.map(value => value === "rejected-job" ? "batch-rejected" : value), request_id: "batch-rejected" },
        { args: ["job", "create"], request_id: "invalid" }
      ] } });
      expect(batch.isError).toBe(true);
      expect(batch.structuredContent).toMatchObject({ results: [
        { experiment: { status: "failed" } }, { request_id: "invalid", error: expect.any(String) }
      ] });
    } finally { await client.close(); }
  });

  it("retains an unconfirmed submission when the CLI does not report success", async () => {
    const f = await fixture();
    f.runJson.mockResolvedValue({ data: { name: "training-a" } } as any);
    expect(await f.submit()).toMatchObject({ experiment: { status: "submission_unknown" } });
    expect(await f.submit()).toMatchObject({ experiment: { status: "submission_unknown" } });
    expect(f.runJson.mock.calls.filter(([args]) => args.includes("create"))).toHaveLength(1);
  });

  it("keeps old task notes out of notifications and reads selected notes in bounded pages", async () => {
    const f = await fixture(); const { experiment } = await f.submit();
    const context = "EXPERIMENT_CONTINUATION_CONTEXT".repeat(200);
    const handoff = "HISTORICAL_HANDOFF_DETAIL".repeat(1000);
    await f.binding.call("sii_defer_task", { experiment_ids: [experiment.id], context });
    f.state("job_succeeded"); await f.service.refreshNow();
    const text = (await f.binding.wait(handoff, vi.fn()))!;
    expect(text.length).toBeLessThan(4000); expect(text).not.toContain("HISTORICAL_HANDOFF_DETAIL");
    expect(text).not.toContain("EXPERIMENT_CONTINUATION_CONTEXT"); expect(text).toContain("sii_get_task_context");
    await f.binding.beginResume(); f.binding.activate();
    const list = await f.binding.call("sii_get_task_context", {}) as any;
    expect(list).toMatchObject({ experiment_ids: [experiment.id], fields: [
      { field: "context", characters: context.length }, { field: "handoff", characters: handoff.length }
    ] });
    const first = await f.binding.call("sii_get_task_context", { field: "handoff", maxChars: 16384 }) as any;
    const next = await f.binding.call("sii_get_task_context", first.nextPage) as any;
    expect(first.content + next.content).toBe(handoff); expect(next.nextPage).toBeNull();
    expect((await f.service.document(f.request.projectPath)).experiments[0].acknowledged).not.toBe(true);
    await expect(f.binding.call("sii_get_task_context", { field: "handoff", offset: -1 })).rejects.toThrow("offset");
  });

  it.each([4, 61, 0, -5, 5.5, "5", null, NaN, Infinity])("rejects review interval %s before submitting a workload", async interval => {
    const f = await fixture();
    await expect(f.submit("job", { check_interval_minutes: interval })).rejects.toThrow("integer from 5 to 60");
    expect(f.runJson.mock.calls.some(([args]) => args.includes("create"))).toBe(false);
    expect((await f.service.document(f.request.projectPath)).experiments).toEqual([]);
  });

  it.each([undefined, 5, 60])("persists review interval %s independently of the platform monitoring rate", async interval => {
    const f = await fixture();
    const before = Date.now();
    await f.submit("job", interval === undefined ? {} : { check_interval_minutes: interval });
    const experiment = (await f.service.document(f.request.projectPath)).experiments[0];
    expect(experiment.checkIntervalMinutes).toBe(interval ?? 5);
    expect(experiment.nextAgentCheckAt).toBeGreaterThanOrEqual(before + (interval ?? 5) * 60_000);
    expect(experiment.nextCheckAt).toBe(0);
    expect(f.service.interval).toBe(f.options.refreshMs);
  });

  it("updates a retained submission's review policy without creating another workload or changing its request hash", async () => {
    const f = await fixture(); const { experiment } = await f.submit("job", { check_interval_minutes: 5 });
    const original = (await f.service.document(f.request.projectPath)).experiments[0];
    await f.submit("job", { check_interval_minutes: 30 });
    const updated = (await f.service.document(f.request.projectPath)).experiments[0];
    expect(updated.id).toBe(experiment.id);
    expect(updated.submissionHash).toBe(original.submissionHash);
    expect(updated.checkIntervalMinutes).toBe(30);
    await f.submit();
    expect((await f.service.document(f.request.projectPath)).experiments[0].nextAgentCheckAt).toBe(updated.nextAgentCheckAt);
    expect(f.runJson.mock.calls.filter(([args]) => args.includes("create"))).toHaveLength(1);
  });

  it.each([5, 60])("wakes the original session after %s minutes without a status mutation, and allows another interval after review", async interval => {
    const f = await fixture();
    vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
    const { experiment } = await f.submit("job", { check_interval_minutes: interval });
    await f.service.refreshNow();
    await f.binding.call("sii_defer_task", { experiment_ids: [experiment.id], context: "Inspect validation loss and stop an unpromising run." });
    const timer = vi.spyOn(globalThis, "setTimeout");
    let resolved = false;
    const waiting = f.binding.wait("Training is still running.", vi.fn()).then(value => { resolved = true; return value; });
    await vi.waitFor(() => expect(timer.mock.calls.some(([, delay]) => typeof delay === "number" && delay > interval * 60_000 - 1000)).toBe(true), { interval: 1 });
    const deadline = (await f.service.document(f.request.projectPath)).experiments[0].nextAgentCheckAt!;
    const calls = f.runJson.mock.calls.length;
    await vi.advanceTimersByTimeAsync(deadline - Date.now() - 1);
    expect(resolved).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    const notice = (await waiting)!;
    expect(notice).toContain("Periodic experiment review");
    expect(notice).toContain('"status":"running"');
    expect(notice).toContain("current logs/metrics");
    expect(f.runJson.mock.calls).toHaveLength(calls);
    expect(f.binding.session?.nativeId).toBe(session.nativeId);
    await receiveNotification(f.binding, notice);
    const reviewed = await f.service.document(f.request.projectPath);
    expect(reviewed.waits[0].nativeReceipt?.eventId).toBe(reviewed.waits[0].eventId);
    expect(reviewed.experiments[0].acknowledged).not.toBe(true);
    await expect(assertSiiControlAction(PROJECT, "execution", "inv_first", { tool: "finish_task" })).rejects.toThrow("still needs experiment results");
    const oldEvent = reviewed.waits[0].eventId;
    await f.binding.call("sii_defer_task", { experiment_ids: [experiment.id], context: "Metrics justify another fifteen minutes.", check_interval_minutes: 15 });
    const next = await f.service.document(f.request.projectPath);
    expect(next.waits[0].eventId).not.toBe(oldEvent);
    expect(next.waits[0].reason).toBeUndefined();
    expect(next.experiments[0].nextAgentCheckAt).toBe(Date.now() + 15 * 60_000);
    const secondWait = f.binding.wait("Continue training.", vi.fn());
    await vi.advanceTimersByTimeAsync(15 * 60_000);
    expect(await secondWait).toContain("Periodic experiment review");
    expect(f.runJson.mock.calls.filter(([args]) => args.includes("create"))).toHaveLength(1);
  });

  it("keeps each experiment's deadline when a faster experiment wakes the same session", async () => {
    const f = await fixture();
    vi.useFakeTimers({ toFake: ["Date"] });
    const { experiment: fast } = await f.submit("job", { check_interval_minutes: 5 });
    const { experiment: slow } = await f.submit("job", {
      args: ["job", "create", "--name", "training-hour", "--workspace", "compute-space", "--project", "具有能动性的科学大模型"],
      request_id: "run-hour", check_interval_minutes: 60
    });
    const initial = await f.service.document(f.request.projectPath);
    const slowDeadline = initial.experiments.find(e => e.id === slow.id)!.nextAgentCheckAt!;
    const defer = () => f.binding.call("sii_defer_task", { experiment_ids: [fast.id, slow.id], context: "Inspect each run at its own interval." });
    await defer();
    for (let review = 0; review < 2; review++) {
      vi.setSystemTime(Date.now() + 5 * 60_000);
      const notice = (await f.binding.wait("Both experiments remain unfinished.", vi.fn()))!;
      expect(notice).toContain("Periodic experiment review");
      expect((await f.service.document(f.request.projectPath)).waits[0].checkExperimentIds).toEqual([fast.id]);
      await receiveNotification(f.binding, notice);
      await defer();
      const waiting = await f.service.document(f.request.projectPath);
      expect(waiting.experiments.find(e => e.id === fast.id)!.nextAgentCheckAt).toBe(Date.now() + 5 * 60_000);
      expect(waiting.experiments.find(e => e.id === slow.id)!.nextAgentCheckAt).toBe(slowDeadline);
    }
    vi.setSystemTime(slowDeadline);
    await f.binding.wait("The hour-long review is now due too.", vi.fn());
    expect((await f.service.document(f.request.projectPath)).waits[0].checkExperimentIds).toEqual([fast.id, slow.id]);
    expect(f.runJson.mock.calls.filter(([args]) => args.includes("create"))).toHaveLength(2);
  });

  it.each(["job_succeeded", "job_failed"])("delivers early %s without waiting for a one-hour review interval", async status => {
    const f = await fixture();
    vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
    const { experiment } = await f.submit("job", { check_interval_minutes: 60 });
    await f.binding.call("sii_defer_task", { experiment_ids: [experiment.id], context: "Inspect the finished result." });
    const waiting = f.binding.wait("Short experiment pending.", vi.fn());
    await vi.advanceTimersByTimeAsync(2 * 60_000);
    f.state(status); await f.due(); await f.service.refreshNow();
    const notice = (await waiting)!;
    expect(notice).not.toContain("Periodic experiment review");
    expect(notice).toContain(status === "job_succeeded" ? '"status":"succeeded"' : '"status":"failed"');
    await receiveNotification(f.binding, notice);
    await expect(assertSiiControlAction(PROJECT, "execution", "inv_first", { tool: "finish_task" })).resolves.toBeUndefined();
  });

  it("rejects an invalid deferred override without changing the saved experiment or wait", async () => {
    const f = await fixture(); const { experiment } = await f.submit();
    const before = await f.service.document(f.request.projectPath);
    await expect(f.binding.call("sii_defer_task", { experiment_ids: [experiment.id], context: "Continue", check_interval_minutes: 4 })).rejects.toThrow("integer from 5 to 60");
    expect(await f.service.document(f.request.projectPath)).toEqual(before);
  });

  it("keeps the original first-review deadline when deferring again without a completed review", async () => {
    const f = await fixture();
    vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
    const { experiment } = await f.submit();
    const deadline = (await f.service.document(f.request.projectPath)).experiments[0].nextAgentCheckAt;
    await vi.advanceTimersByTimeAsync(2 * 60_000);
    await f.binding.call("sii_defer_task", { experiment_ids: [experiment.id], context: "First handoff." });
    await vi.advanceTimersByTimeAsync(60_000);
    await f.binding.call("sii_defer_task", { experiment_ids: [experiment.id], context: "Retain deadline while updating context." });
    expect((await f.service.document(f.request.projectPath)).experiments[0].nextAgentCheckAt).toBe(deadline);
  });

  it("retains a periodic review deadline and original session across service restart", async () => {
    const f = await fixture();
    vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
    const { experiment } = await f.submit("job", { check_interval_minutes: 15 });
    await f.service.refreshNow();
    await f.binding.call("sii_defer_task", { experiment_ids: [experiment.id], context: "Compare ongoing metrics with the baseline." });
    const deadline = (await f.service.document(f.request.projectPath)).experiments[0].nextAgentCheckAt!;
    await vi.advanceTimersByTimeAsync(4 * 60_000);
    f.binding.close(); await f.service.stop();
    const next = new SiiExperimentService(f.options); services.push(next); await next.start(); await next.refreshNow();
    const recovered = await next.bind({ ...f.request, invocationId: "inv_periodic_restart" }, new AbortController().signal);
    recovered.session = session;
    expect((await next.document(f.request.projectPath)).experiments[0].nextAgentCheckAt).toBe(deadline);
    let resolved = false;
    const waiting = recovered.wait("Original handoff retained.", vi.fn()).then(value => { resolved = true; return value; });
    await vi.advanceTimersByTimeAsync(deadline - Date.now() - 1);
    expect(resolved).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await waiting).toContain("Periodic experiment review");
    expect(recovered.session.nativeId).toBe(session.nativeId);
    expect(f.runJson.mock.calls.filter(([args]) => args.includes("create"))).toHaveLength(1);
  });

  it("replays a legacy submission and gives its old ledger the default review interval without resubmission", async () => {
    const f = await fixture(); const { experiment } = await f.submit();
    await f.service.mutate(f.request.projectPath, doc => {
      delete doc.experiments[0].checkIntervalMinutes;
      delete doc.experiments[0].nextAgentCheckAt;
    });
    await f.submit();
    await f.binding.call("sii_defer_task", { experiment_ids: [experiment.id], context: "Inspect the retained experiment." });
    const saved = (await f.service.document(f.request.projectPath)).experiments[0];
    expect(saved.checkIntervalMinutes).toBe(5);
    expect(saved.nextAgentCheckAt).toBe(Date.parse(saved.createdAt) + 5 * 60_000);
    expect(f.runJson.mock.calls.filter(([args]) => args.includes("create"))).toHaveLength(1);
  });

  it("registers an existing experiment with a custom interval and handles per-item batch intervals independently", async () => {
    const f = await fixture();
    const registered = await f.binding.call("sii_register_experiment", { kind: "job", name: "existing-job", workspace: "compute-space",
      request_id: "existing-run", check_interval_minutes: 60 });
    expect(registered).toMatchObject({ experiment: { registration: "existing", checkIntervalMinutes: 60 } });
    expect(f.runJson.mock.calls.some(([args]) => args.includes("create"))).toBe(false);
    const item = (name: string, interval: number) => ({ args: ["job", "create", "--name", name, "--workspace", "compute-space",
      "--project", "具有能动性的科学大模型", "--command", "python train.py"], request_id: name, check_interval_minutes: interval });
    const result = await f.binding.call("sii_submit_batch", { experiments: [item("five", 5), item("invalid", 4), item("hour", 60)] });
    expect(result).toMatchObject({ results: [
      { experiment: { checkIntervalMinutes: 5 } },
      { request_id: "invalid", error: expect.stringContaining("integer from 5 to 60") },
      { experiment: { checkIntervalMinutes: 60 } }
    ] });
    expect(f.runJson.mock.calls.filter(([args]) => args.includes("create"))).toHaveLength(2);
  });

  it("exposes bounded review intervals and rejects an invalid submission through actual MCP", async () => {
    const f = await fixture();
    const client = new Client({ name: "periodic-review-client", version: "1" });
    await client.connect(new StreamableHTTPClientTransport(new URL(f.binding.url)));
    try {
      const tools = (await client.listTools()).tools;
      for (const name of ["sii_submit_experiment", "sii_register_experiment", "sii_defer_task"]) {
        expect(tools.find(tool => tool.name === name)?.inputSchema.properties?.check_interval_minutes)
          .toMatchObject({ type: "integer", minimum: 5, maximum: 60 });
      }
      const result = await client.callTool({ name: "sii_submit_experiment", arguments: {
        args: ["job", "create", "--name", "invalid", "--workspace", "compute-space", "--project", "具有能动性的科学大模型"],
        request_id: "invalid", check_interval_minutes: 61
      } });
      expect(result.isError).toBe(true);
      expect(f.runJson.mock.calls.some(([args]) => args.includes("create"))).toBe(false);
    } finally { await client.close(); }
  });

  it.each(["workspace", "compute", "yolo"] as const)("requires explicit selection under %s and exposes actual tools only to a selected Worker", async permission => {
    const f = await fixture();
    const request = { ...f.request, permission, invocationId: `inv_${permission}` };
    for (const selected of [undefined, false]) {
      request.project.agents.execution!.experimentMcp = selected;
      await expect(f.service.bind(request, new AbortController().signal)).rejects.toThrow("explicit experimentMcp");
      await expect(f.binding.call("sii_command", { args: ["job", "list"] })).rejects.toThrow("not selected");
      const oldClient = new Client({ name: "old-selection", version: "1" });
      await oldClient.connect(new StreamableHTTPClientTransport(new URL(f.binding.url)));
      try { expect((await oldClient.listTools()).tools).toEqual([]); } finally { await oldClient.close(); }
    }
    request.project.agents.execution!.experimentMcp = true;
    const binding = await f.service.bind(request, new AbortController().signal); binding.activate();
    const client = new Client({ name: "selected-worker", version: "1" });
    await client.connect(new StreamableHTTPClientTransport(new URL(binding.url)));
    try {
      expect((await client.listTools()).tools.map(tool => tool.name)).toContain("sii_submit_experiment");
      expect((await client.callTool({ name: "sii_command", arguments: { args: ["job", "list"] } })).isError).not.toBe(true);
    } finally { await client.close(); binding.close(); }
  });

  it("rejects management/receipt turns and revokes a retained binding on task or role changes", async () => {
    const f = await fixture();
    for (const patch of [{ kind: "main" }, { purpose: "explainer" }, { purpose: "probe" },
      { executionContext: { role: "leader" } }, { terminalPushObservation: {} }, { terminalPushCoordination: {} }, { worktreeClosing: {} }]) {
      await expect(f.service.bind({ ...f.request, ...patch } as AgentRunRequest, new AbortController().signal)).rejects.toThrow("business Worker");
    }
    expect(() => f.binding.activate({ ...f.request, taskSessionId: "another-task" })).toThrow("current Worker task");
    expect(f.binding.availableTools()).toEqual([]);
    expect((await fetch(f.binding.url, { method: "POST", body: "{}" })).status).toBe(404);
    const next = await f.service.bind({ ...f.request, invocationId: "inv_next" }, new AbortController().signal); next.activate();
    expect(() => next.activate({ ...f.request, executionContext: { role: "leader" } } as AgentRunRequest)).toThrow("current Worker task");
    expect(next.availableTools()).toEqual([]);
    const changedPermission = await f.service.bind({ ...f.request, invocationId: "inv_scope" }, new AbortController().signal);
    changedPermission.activate();
    expect(() => changedPermission.activate({ ...f.request, permission: "workspace" })).toThrow("current Worker task");
    expect(changedPermission.availableTools()).toEqual([]);
    expect(() => changedPermission.activate()).toThrow("current Worker task");
  });

  it("uses trusted file roots for transfers and refuses another task directory and aliased files before the CLI runs", async () => {
    const f = await fixture();
    f.request.permission = "workspace";
    const binding = await f.service.bind({ ...f.request, invocationId: "inv_workspace" }, new AbortController().signal); binding.activate();
    const own = path.join(f.request.workspacePath, "program.py");
    const outside = path.join(f.root, "outside.py");
    await fs.writeFile(own, "print(1)"); await fs.writeFile(outside, "outside");
    await binding.call("sii_command", { args: ["notebook", "scp", "box", own, "remote:program.py"] });
    await binding.call("sii_command", { args: ["notebook", "scp", "box", "--download", "remote:metrics.json", "metrics.json"] });
    for (const args of [
      ["notebook", "scp", "box", outside, "remote:program.py"],
      ["notebook", "scp", "box", "remote:metrics.json", outside, "-d"],
      ["notebook", "exec", "box", "--download", f.root, "python program.py"],
      ["notebook", "connection", "refresh", "box", `--pubkey=${outside}`]
    ]) await expect(binding.call("sii_command", { args })).rejects.toThrow("file scope");
    await fs.link(outside, path.join(f.request.workspacePath, "linked.py"));
    await expect(binding.call("sii_command", { args: ["notebook", "scp", "box", "linked.py", "remote:program.py"] })).rejects.toThrow("hardlink");
    await expect(f.service.bind({ ...f.request, workspacePath: f.root }, new AbortController().signal)).rejects.toThrow("assigned directory");
    expect(f.runJson).toHaveBeenCalledTimes(2);
  });

  it("refuses file symlinks before the CLI runs when the host permits creating them", async (context) => {
    const f = await fixture();
    const outside = path.join(f.root, "outside.py");
    await fs.writeFile(outside, "outside");
    try {
      await fs.symlink(outside, path.join(f.request.workspacePath, "alias.py"));
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (process.platform === "win32" && (code === "EPERM" || code === "EACCES")) {
        context.skip(`File symlinks unavailable on this host: ${code}`);
        return;
      }
      throw error;
    }
    await expect(f.binding.call("sii_command", { args: ["notebook", "scp", "box", "alias.py", "remote:program.py"] })).rejects.toThrow();
    expect(f.runJson).not.toHaveBeenCalled();
  });

  it("allows compute transfers only to registered worktrees of the same project", async () => {
    const f = await fixture();
    const projectWorktreeRoot = path.join(f.request.projectPath, "git-worktrees");
    const peer = path.join(projectWorktreeRoot, "peer");
    const unregistered = path.join(projectWorktreeRoot, "unregistered");
    await fs.mkdir(peer, { recursive: true }); await fs.mkdir(unregistered);
    const binding = await f.service.bind({ ...f.request, invocationId: "inv_project" }, new AbortController().signal,
      { serviceUserRoot: f.root, projectWorktreeRoot, projectWorktrees: [peer], protectedRoots: [] }); binding.activate();
    await binding.call("sii_command", { args: ["notebook", "scp", "box", "remote:metrics.json", path.join(peer, "metrics.json"), "-d"] });
    for (const directory of [unregistered, f.root]) {
      await expect(binding.call("sii_command", { args: ["notebook", "scp", "box", "remote:metrics.json", path.join(directory, "metrics.json"), "-d"] })).rejects.toThrow("file scope");
    }
    expect(f.runJson).toHaveBeenCalledOnce();
  });

  it("keeps yolo native access separate from actual SII transfer path authority", async (context) => {
    const f = await fixture();
    const home = path.join(f.root, "service-home");
    const otherTask = path.join(f.root, "other-task");
    // A protected root inside the otherwise authorized home also checks read
    // refusal; it must not pass just because its broad root is readable.
    const protectedRoot = path.join(home, "protected-state");
    await Promise.all([home, otherTask, protectedRoot].map(directory => fs.mkdir(directory, { recursive: true })));
    const program = path.join(f.request.workspacePath, "program.py");
    const personal = path.join(home, "personal.py");
    const outside = path.join(otherTask, "outside.py");
    const protectedFile = path.join(protectedRoot, "protected.py");
    await Promise.all([program, personal, outside, protectedFile].map(file => fs.writeFile(file, "fixture only")));
    const binding = await f.service.bind({ ...f.request, permission: "yolo", invocationId: "inv_yolo_paths" },
      new AbortController().signal, { serviceUserRoot: home, projectWorktreeRoot: f.request.workspacePath,
        projectWorktrees: [f.request.workspacePath], protectedRoots: [protectedRoot] });
    binding.activate();
    const client = new Client({ name: "actual-yolo-path-check", version: "1" });
    await client.connect(new StreamableHTTPClientTransport(new URL(binding.url)));
    const call = (args: string[]) => client.callTool({ name: "sii_command", arguments: { args } });
    try {
      expect((await client.listTools()).tools.map(tool => tool.name)).toContain("sii_command");
      // The assigned business workspace may be outside the service user's
      // home; the selected Worker must still be able to transfer its files.
      for (const args of [
        ["notebook", "scp", "fixture-box", program, "remote:program.py"],
        ["notebook", "scp", "fixture-box", "remote:result.json", "result.json", "-d"],
        ["notebook", "scp", "fixture-box", personal, "remote:personal.py"],
        ["notebook", "scp", "fixture-box", "remote:personal.json", path.join(home, "personal.json"), "-d"]
      ]) expect((await call(args)).isError).not.toBe(true);
      expect(f.runJson).toHaveBeenCalledTimes(4);
      try { await fs.symlink(program, path.join(f.request.workspacePath, "alias.py")); } catch (error) {
        if (process.platform === "win32" && ["EPERM", "EACCES"].includes((error as NodeJS.ErrnoException).code ?? "")) { context.skip(); return; }
        throw error;
      }
      await fs.link(program, path.join(f.request.workspacePath, "linked.py"));
      for (const args of [
        ["notebook", "scp", "fixture-box", outside, "remote:outside.py"],
        ["notebook", "scp", "fixture-box", "remote:outside.json", path.join(otherTask, "outside.json"), "-d"],
        ["notebook", "scp", "fixture-box", protectedFile, "remote:protected.py"],
        ["notebook", "scp", "fixture-box", "remote:protected.json", path.join(protectedRoot, "protected.json"), "-d"],
        ["notebook", "scp", "fixture-box", "alias.py", "remote:alias.py"],
        ["notebook", "scp", "fixture-box", "linked.py", "remote:linked.py"],
        ["notebook", "scp", "fixture-box", "./program.py", "remote:traversal.py"]
      ]) {
        expect((await call(args)).isError).toBe(true);
        expect(f.runJson).toHaveBeenCalledTimes(4);
      }
    } finally { await client.close(); binding.close(); }
  });

  it.each(["workspace", "compute"] as const)("rejects protected upload sources and traversal under %s", async permission => {
    const f = await fixture();
    const home = path.join(f.root, "home");
    const protectedRoot = path.join(home, "protected-state");
    await fs.mkdir(protectedRoot, { recursive: true });
    const protectedFile = path.join(protectedRoot, "private.py");
    const own = path.join(f.request.workspacePath, "own.py");
    await Promise.all([protectedFile, own].map(file => fs.writeFile(file, "fixture only")));
    const binding = await f.service.bind({ ...f.request, permission, invocationId: `inv_${permission}_protected_read` },
      new AbortController().signal, { serviceUserRoot: home, projectWorktreeRoot: f.request.workspacePath,
        projectWorktrees: [f.request.workspacePath], protectedRoots: [protectedRoot] });
    binding.activate();
    await binding.call("sii_command", { args: ["notebook", "scp", "fixture-box", own, "remote:own.py"] });
    expect(f.runJson).toHaveBeenCalledOnce();
    for (const args of [
      ["notebook", "scp", "fixture-box", protectedFile, "remote:private.py"],
      ["notebook", "connection", "refresh", "fixture-box", `--pubkey=${protectedFile}`],
      ["notebook", "scp", "fixture-box", "nested/../own.py", "remote:own.py"]
    ]) await expect(binding.call("sii_command", { args })).rejects.toThrow(/file scope|normalized/);
    expect(f.runJson).toHaveBeenCalledOnce();
  });

  it("exposes full CLI and original knowledge through real MCP without shell expansion", async () => {
    const f = await fixture();
    const client = new Client({ name: "agent", version: "1" });
    await client.connect(new StreamableHTTPClientTransport(new URL(f.binding.url)));
    try {
      expect((await client.listTools()).tools.map(tool => tool.name)).toContain("sii_defer_task");
      const command = ["notebook", "exec", "cpu-box", "python -c 'print(\"$HOME; $(never)\")'"];
      const result = await client.callTool({ name: "sii_command", arguments: { args: command } });
      expect(result.isError).not.toBe(true);
      expect(f.runJson.mock.calls.at(-1)?.[0]).toEqual(command);
      const knowledge = await client.callTool({ name: "sii_read_knowledge", arguments: { path: "references/notebook.md" } });
      expect(JSON.stringify(knowledge)).toContain("Original notebook capabilities");
      await expect(f.binding.call("sii_read_knowledge", { path: "../secret.md" })).rejects.toThrow();
    } finally { await client.close(); }
  });

  it("reads knowledge paths longer than 256 through the SDK while retaining directory and symlink boundaries", async () => {
    const f = await fixture();
    const relative = `${Array.from({ length: 6 }, (_, i) => `references-${i}-${"x".repeat(40)}`).join("/")}/long.md`;
    const document = path.join(f.options.knowledgeRoot, relative);
    await fs.mkdir(path.dirname(document), { recursive: true });
    await fs.writeFile(document, "Long authorized knowledge");
    const outside = path.join(f.root, "outside", relative);
    await fs.mkdir(path.dirname(outside), { recursive: true });
    await fs.writeFile(outside, "Private outside document");
    await fs.symlink(outside, path.join(f.options.knowledgeRoot, "linked.md"));
    const client = new Client({ name: "knowledge-boundaries", version: "1" });
    await client.connect(new StreamableHTTPClientTransport(new URL(f.binding.url)));
    try {
      const tool = (await client.listTools()).tools.find(item => item.name === "sii_read_knowledge")!;
      expect(tool.inputSchema.properties?.path).toEqual({ type: "string" });
      expect(relative.length).toBeGreaterThan(256);
      const result = await client.callTool({ name: "sii_read_knowledge", arguments: { path: relative } });
      expect(result.isError).not.toBe(true);
      expect(JSON.stringify(result)).toContain("Long authorized knowledge");
      for (const candidate of [outside, `../outside/${relative}`, "linked.md"]) {
        const refused = await client.callTool({ name: "sii_read_knowledge", arguments: { path: candidate } });
        expect(refused.isError).toBe(true);
        expect(JSON.stringify(refused)).toContain("Knowledge path escapes");
        expect(JSON.stringify(refused)).not.toContain("Private outside document");
      }
      const invalid = await client.callTool({ name: "sii_read_knowledge", arguments: { path: 42 } });
      expect(invalid.isError).toBe(true);
    } finally { await client.close(); }
  });

  it("executes the actual CLI bridge with literal arguments and recognizes explicit nonzero JSON rejection", async () => {
    vi.stubEnv("ALL_PROXY", "http://unrelated-proxy.invalid:3128");
    vi.stubEnv("all_proxy", "http://unrelated-proxy.invalid:3128");
    const f = await fixture();
    const executable = path.join(f.root, "inspire-fixture.cjs");
    await fs.writeFile(executable, "#!/usr/bin/env node\nconst args=process.argv.slice(2);if(args.includes('--help')){process.stdout.write('fixture CLI help');process.exit(0)};const failed=args.includes('create');process.stdout.write(JSON.stringify({success:!failed,message:failed?'quota rejected':undefined,data:{args,configPath:process.env.INSPIRE_GLOBAL_CONFIG_PATH,hasProxy:['HTTP_PROXY','HTTPS_PROXY','ALL_PROXY','http_proxy','https_proxy','all_proxy'].some(k=>!!process.env[k])}}));if(failed)process.exitCode=2;\n", { mode: 0o700 });
    const service = new SiiExperimentService({ ...f.options, inspireBin: executable, configPath: "/test/config", runJson: undefined });
    services.push(service); await service.start(); await service.refreshNow();
    const binding = await service.bind({ ...f.request, invocationId: "inv_cli" }, new AbortController().signal); binding.session = session; binding.activate();
    const args = ["notebook", "exec", "cpu-box", "echo $(never) $HOME ; no-shell"];
    const result = await binding.call("sii_command", { args }) as { result: { data: Record<string, unknown> } };
    expect(result.result.data).toMatchObject({ args: ["--no-env-file", "--json", ...args], configPath: "/test/config", hasProxy: false });
    expect(JSON.stringify(await binding.call("sii_command", { args: ["job", "--help"] }))).toContain("fixture CLI help");
    const submission = await binding.call("sii_submit_experiment", { request_id: "rejected-run", args: ["job", "create", "--name", "rejected-run", "--workspace", "space", "--project", "具有能动性的科学大模型"] }) as { experiment: { status: string }; message: string };
    expect(submission.experiment.status).toBe("failed");
    expect(submission.message).toContain("明确拒绝");
    expect((await service.document(f.request.projectPath)).experiments[0]!.evidence).toMatchObject({ message: "quota rejected" });
  });

  it("retains an actual CLI JSON transport failure as an unknown submission without exposing cookies or submitting twice", async () => {
    const f = await fixture();
    const executable = path.join(f.root, "inspire-transport-failure.cjs");
    const calls = path.join(f.root, "create-calls.jsonl");
    const message = "APIRequestContext.post: Client network socket disconnected before secure TLS connection was established\n  - cookie: inspire-session=FAKE-PLATFORM-SESSION; csrf=FAKE-CSRF";
    await fs.writeFile(executable, `#!/usr/bin/env node\nconst fs=require('node:fs');fs.appendFileSync(${JSON.stringify(calls)},JSON.stringify(process.argv.slice(2))+'\\n');console.log(JSON.stringify({success:false,error:{type:'APIError',code:13,message:${JSON.stringify(message)}}}));process.exitCode=13;\n`, { mode: 0o700 });
    const service = new SiiExperimentService({ ...f.options, inspireBin: executable, runJson: undefined });
    services.push(service); await service.start();
    const binding = await service.bind({ ...f.request, invocationId: "inv_transport_unknown" }, new AbortController().signal);
    binding.session = session; binding.activate();
    const input = { request_id: "stable-unknown-run", args: ["job", "create", "--name", "stable-unknown-run", "--workspace", "space", "--project", "具有能动性的科学大模型"] };
    const first = await binding.call("sii_submit_experiment", input) as { experiment: { id: string; status: string; queryError: string }; message: string };
    expect(first.experiment.status).toBe("submission_unknown");
    expect(first.experiment.queryError).toContain("TLS connection");
    expect(first.message).not.toContain("明确拒绝");
    const replay = await binding.call("sii_submit_experiment", input) as { experiment: { id: string; status: string } };
    expect(replay.experiment).toMatchObject({ id: first.experiment.id, status: "submission_unknown" });
    expect((await fs.readFile(calls, "utf8")).trim().split("\n")).toHaveLength(1);
    for (const result of [first, replay, await service.document(f.request.projectPath)]) expect(JSON.stringify(result)).not.toContain("FAKE-");
  });

  it("preserves textual CLI operations and parses progress-prefixed JSON without mistaking textual creation for success", async () => {
    const f = await fixture();
    const executable = path.join(f.root, "inspire-progress.cjs");
    await fs.writeFile(executable, `#!/usr/bin/env node\nconst args=process.argv.slice(2);console.log('Setting up connection...');if(args.includes('check'))console.log(JSON.stringify({success:true,data:{message:'quoted "} ]" values'}}));\n`, { mode: 0o700 });
    const service = new SiiExperimentService({ ...f.options, inspireBin: executable, runJson: undefined });
    services.push(service); await service.start(); await service.refreshNow();
    const binding = await service.bind({ ...f.request, invocationId: "inv_progress" }, new AbortController().signal); binding.session = session; binding.activate();
    expect(await binding.call("sii_command", { args: ["config", "check"] })).toMatchObject({ result: { success: true, data: { message: 'quoted "} ]" values' } } });
    expect(await binding.call("sii_command", { args: ["notebook", "connection", "refresh", "cpu-box"] })).toMatchObject({ result: { output: "Setting up connection...\n", exit_code: 0 } });
    const submission = await binding.call("sii_submit_experiment", { request_id: "unconfirmed", args: ["job", "create", "--name", "unconfirmed", "--workspace", "space", "--project", "具有能动性的科学大模型"] }) as { experiment: { status: string } };
    expect(submission.experiment.status).toBe("submission_unknown");
  });

  it("disables notebook CLI defaults that wait and refuses synchronous post-start actions before creating a resource", async () => {
    const f = await fixture();
    await f.submit("notebook", { required_for_task: false });
    expect(f.runJson.mock.calls.find(([args]) => args.includes("create"))?.[0].slice(-3)).toEqual(["--no-wait", "--post-start", "none"]);
    for (const flags of [["--post-start", "python train.py"], ["--post-start-script=/tmp/setup.sh"]]) {
      await expect(f.binding.call("sii_submit_experiment", { request_id: "post-start", required_for_task: false,
        args: ["notebook", "create", "--name", "post-start", "--workspace", "compute-space", "--project", "具有能动性的科学大模型", ...flags] })).rejects.toThrow("force CLI waiting");
    }
    expect(f.runJson.mock.calls.filter(([args]) => args.includes("create"))).toHaveLength(1);
    expect((await f.service.document(f.request.projectPath)).experiments).toHaveLength(1);
  });

  it.each([ ["job", "job_succeeded"], ["hpc", "hpc_failed"] ])("keeps %s task unfinished without repair/polling turns and notifies its original session on %s", async (kind, state) => {
    const f = await fixture();
    const { experiment } = await f.submit(kind);
    const revalidate = vi.fn(async () => undefined);
    const controls = new ControlActionService({ projectId: PROJECT, agent: "execution", invocationId: "inv_first", stateVersion: 1, capability: "test-capability", stagingPath: path.join(f.request.runtimePath, "actions.json"), revalidate });
    await expect(controls.stage("test-capability", "premature-finish", { tool: "finish_task" })).rejects.toThrow("still needs experiment results");
    expect(revalidate).not.toHaveBeenCalled();
    await expect(fs.access(path.join(f.request.runtimePath, "actions.json"))).rejects.toThrow();
    await f.binding.call("sii_defer_task", { experiment_ids: [experiment.id], context: "Inspect measured metrics and compare baseline." });
    let resolved = false;
    const waiting = f.binding.wait("Experiment pending, task unfinished.", vi.fn()).then(value => { resolved = true; return value; });
    await vi.waitFor(() => expect(f.onExperimentWait).toHaveBeenCalledWith(true));
    await expect(controls.stage("test-capability", "finish-while-system-waits", { tool: "finish_task" })).rejects.toThrow("still needs experiment results");
    expect(revalidate).not.toHaveBeenCalled();
    await expect(f.binding.call("sii_get_experiment", { experiment_id: experiment.id })).rejects.toThrow("active Agent turn");
    await f.service.refreshNow();
    expect(resolved).toBe(false);
    f.state(state); await f.due(); await f.service.refreshNow();
    const notification = await waiting;
    expect(notification).toContain(state.includes("failed") ? '"status":"failed"' : '"status":"succeeded"');
    expect(f.binding.session?.nativeId).toBe("original-thread");
    expect(f.onExperimentWait.mock.calls.map(args => args[0])).toEqual([true, false]);
    await receiveNotification(f.binding, notification!);
    await controls.stage("test-capability", "processed-finish", { tool: "finish_task" });
    expect(revalidate).toHaveBeenCalledOnce();
    expect(await f.binding.wait("Results processed.", vi.fn())).toBeUndefined();
    await f.binding.clearWait();
    const callCount = f.runJson.mock.calls.length;
    await f.service.refreshNow(); expect(f.runJson.mock.calls).toHaveLength(callCount);
  });

  it("recovers a deferred task after restart without re-submitting or replacing the session", async () => {
    const f = await fixture(); const { experiment } = await f.submit();
    await f.binding.call("sii_defer_task", { experiment_ids: [experiment.id], context: "Continue original analysis." });
    const oldWait = f.binding.wait("Retained handoff.", vi.fn()).catch(error => error);
    await vi.waitFor(() => expect(f.onExperimentWait).toHaveBeenCalledWith(true));
    f.binding.close(); expect(await oldWait).toBeInstanceOf(Error); await f.service.stop();
    f.state("job_succeeded");
    const next = new SiiExperimentService(f.options); services.push(next); await next.start(); await next.refreshNow();
    const recovered = await next.bind({ ...f.request, invocationId: "inv_after_restart" }, new AbortController().signal);
    recovered.session = session;
    const notice = await recovered.wait(undefined, vi.fn());
    expect(notice).not.toContain("Retained handoff."); expect(notice).not.toContain("Continue original analysis.");
    expect(notice).toContain("sii_get_task_context");
    await recovered.beginResume(); recovered.activate();
    expect(await recovered.call("sii_get_task_context", { field: "handoff" })).toMatchObject({ content: "Retained handoff." });
    expect(await recovered.call("sii_get_task_context", { field: "context" })).toMatchObject({ content: "Continue original analysis." });
    const previous = await recovered.call("sii_submit_experiment", { args: ["job", "create", "--name", "training-a", "--workspace", "compute-space", "--project", "具有能动性的科学大模型", "--command", "python train.py"], request_id: "run-a" });
    expect(JSON.stringify(previous)).toContain(experiment.id);
    expect(f.runJson.mock.calls.filter(([args]) => args.includes("create"))).toHaveLength(1);
    await recovered.clearWait();
  });

  it("preserves an ambiguous create and rejects changed input under the same id", async () => {
    const f = await fixture(); f.failCreate();
    const first = await f.submit(); expect(first.experiment.status).toBe("submission_unknown");
    await f.submit(); expect(f.runJson.mock.calls.filter(([args]) => args.includes("create"))).toHaveLength(1);
    await expect(f.submit("hpc")).rejects.toThrow("different submission");
  });

  it("does not classify query failure as experiment failure or repeatedly wake for it", async () => {
    const f = await fixture(); const { experiment } = await f.submit();
    await f.binding.call("sii_defer_task", { experiment_ids: [experiment.id], context: "Inspect when available." });
    f.failQueries();
    for (let i = 0; i < 3; i++) { await f.due(); await f.service.refreshNow(); }
    const notification = await f.binding.wait("Pending.", vi.fn());
    expect(notification).toContain("network unavailable"); expect(notification).toContain('"status":"queued"');
    expect((await f.service.document(f.request.projectPath)).experiments[0]!.monitorAcknowledged).not.toBe(true);
    await receiveNotification(f.binding, notification!);
    expect((await f.service.document(f.request.projectPath)).experiments[0]!.monitorAcknowledged).toBe(true);
    await expect(assertSiiControlAction(PROJECT, "execution", "inv_first", { tool: "finish_task" })).rejects.toThrow();
    await f.binding.call("sii_defer_task", { experiment_ids: [experiment.id], context: "Continue system monitoring." });
    let resolved = false;
    const wait = f.binding.wait("Pending.", vi.fn()).then(() => { resolved = true; }).catch(() => undefined);
    await f.due(); await f.service.refreshNow(); expect(resolved).toBe(false);
    f.binding.close(); await wait;
  });

  it("requires this run's atomic completion marker rather than notebook RUNNING or an old marker", async () => {
    const f = await fixture(); const marker = path.join(f.request.workspacePath, "done.json");
    const { experiment } = await f.submit("notebook", { completion_file: marker });
    expect(experiment.runId).toBe("run-a");
    await fs.writeFile(marker, JSON.stringify({ run_id: "old-run", exit_code: 0 }));
    await f.service.refreshNow(); expect((await f.service.document(f.request.projectPath)).experiments[0]?.status).toBe("running");
    await fs.writeFile(marker, JSON.stringify({ run_id: "run-a", exit_code: 3 }));
    await f.due(); await f.service.refreshNow(); expect((await f.service.document(f.request.projectPath)).experiments[0]?.status).toBe("failed");
  });

  it("retains the original session when a restart attempts a replacement", async () => {
    const f = await fixture(); const { experiment } = await f.submit();
    await f.binding.call("sii_defer_task", { experiment_ids: [experiment.id], context: "Keep my original session." });
    f.binding.session = { ...session, nativeId: "replacement-thread", generation: 1 };
    await expect(f.binding.wait(undefined, vi.fn())).rejects.toThrow("cannot be replaced");
    expect((await f.service.document(f.request.projectPath)).waits[0]?.session.nativeId).toBe("original-thread");
  });

  it("replays a ready notification if the server stops during the resumed model turn", async () => {
    const f = await fixture(); const { experiment } = await f.submit();
    await f.binding.call("sii_defer_task", { experiment_ids: [experiment.id], context: "Finish the original analysis." });
    f.state("job_succeeded"); await f.service.refreshNow();
    const notification = await f.binding.wait("Pending handoff.", vi.fn());
    expect(notification).not.toContain("Finish the original analysis.");
    expect(notification).toContain("sii_get_task_context");
    await receiveNotification(f.binding, notification!);
    expect((await f.service.document(f.request.projectPath)).experiments[0]!.acknowledged).toBe(true);
    f.binding.close(); await f.service.stop();
    const next = new SiiExperimentService(f.options); services.push(next); await next.start(); await next.refreshNow();
    const recovered = await next.bind({ ...f.request, invocationId: "inv_notification_recovery" }, new AbortController().signal); recovered.session = session;
    expect(await recovered.wait(undefined, vi.fn())).toContain("sii_get_task_context");
    await recovered.beginResume(); recovered.activate();
    expect(await recovered.call("sii_get_task_context", { field: "handoff" })).toMatchObject({ content: "Pending handoff." });
    expect(recovered.session.nativeId).toBe(session.nativeId);
    expect(f.runJson.mock.calls.filter(([args]) => args.includes("create"))).toHaveLength(1);
  });

  it("keeps prepared results pending until a complete native message arrives in the exact original session", async () => {
    const f = await fixture(); const { experiment } = await f.submit();
    await f.binding.call("sii_defer_task", { experiment_ids: [experiment.id], context: "Inspect my measured result." });
    f.state("job_succeeded"); await f.service.refreshNow();
    const notification = (await f.binding.wait("Task still pending.", vi.fn()))!;
    await expect(f.binding.assertTaskComplete()).rejects.toThrow("still needs experiment results");
    await f.binding.beginResume(); f.binding.activate();
    const event = { kind: "user.message", phase: "completed", eventId: "native-original-user", invocationId: f.request.invocationId,
      harnessId: session.harnessId, message: `Existing prompt\n${notification}\nAssignment tail` };
    for (const patch of [{ kind: "assistant.message" }, { phase: "started" }, { eventId: "" }, { invocationId: "another-invocation" },
      { harnessId: "pi" }, { message: notification.slice(0, -1) }, { message: "queued admission acknowledgement" }]) {
      await f.binding.observeNativeNotification({ ...event, ...patch }, session);
    }
    for (const other of [undefined, { ...session, generation: 1 }, { ...session, nativeId: "another-thread" },
      { ...session, adapterVersion: "2" }, { ...session, createdAt: "2026-10-08T00:00:00.000Z" }, { ...session, durable: false }]) {
      await f.binding.observeNativeNotification(event, other);
    }
    expect((await f.service.document(f.request.projectPath)).experiments[0]!.acknowledged).not.toBe(true);
    await expect(f.binding.assertTaskComplete()).rejects.toThrow("still needs experiment results");
    await f.binding.observeNativeNotification(event, { ...session, resumedAt: "2026-10-09T00:00:00.000Z" });
    const received = await f.service.document(f.request.projectPath);
    expect(received.experiments[0]!.acknowledged).toBe(true);
    expect(received.waits[0]!.nativeReceipt).toMatchObject({ eventId: received.waits[0]!.eventId,
      invocationId: f.request.invocationId, nativeEventId: event.eventId, session });
    expect(received.experiments[0]!.notificationReceipt).toEqual(received.waits[0]!.nativeReceipt);
    await f.binding.assertTaskComplete();
    await f.binding.observeNativeNotification({ ...event, eventId: "replayed-native-event" }, session);
    expect((await f.service.document(f.request.projectPath)).waits[0]!.nativeReceipt).toEqual(received.waits[0]!.nativeReceipt);
    expect(f.runJson.mock.calls.filter(([args]) => args.includes("create"))).toHaveLength(1);
  });

  it.each(["codex", "fixture-native-input"])("queries %s Adapter history only at the resumed completion boundary and retains its evidence after clearing the wait", async harnessId => {
    const original = { ...session, harnessId };
    const f = await fixture(original); const { experiment } = await f.submit();
    await f.binding.call("sii_defer_task", { experiment_ids: [experiment.id], context: "Read this original result" });
    f.state("job_succeeded"); await f.service.refreshNow();
    const text = (await f.binding.wait("Original pending handoff", vi.fn()))!;
    const history = { relativePath: "sessions/2026/10/09/original.jsonl", byteOffset: 1234,
      sha256: "a".repeat(64), nativeTimestamp: "2026-10-09T19:03:38.899Z" };
    const read = vi.fn(async (input: { text: string; session: SessionRef }) => {
      expect(input).toEqual({ text, session: original }); return { session: original, history };
    });
    f.binding.readNativeNotification = read;
    await expect(f.binding.assertTaskComplete()).rejects.toThrow("still needs experiment results");
    expect(read).not.toHaveBeenCalled();
    await f.binding.beginResume(); f.binding.activate();
    await f.binding.assertTaskComplete(); await f.binding.assertTaskComplete();
    expect(read).toHaveBeenCalledOnce();
    const receipt = (await f.service.document(f.request.projectPath)).experiments[0]!.notificationReceipt;
    expect(receipt).toMatchObject({ source: "native_session_history", session: original, history });
    await f.binding.clearWait();
    expect((await f.service.document(f.request.projectPath)).experiments[0]!.notificationReceipt).toEqual(receipt);
    expect(f.runJson.mock.calls.filter(([args]) => args.includes("create"))).toHaveLength(1);
  });

  it.each(["missing", "session", "deactivated", "closed"] as const)("keeps native history unacknowledged when its resumed scope is invalid (%s)", async mode => {
    const f = await fixture(); const { experiment } = await f.submit();
    await f.binding.call("sii_defer_task", { experiment_ids: [experiment.id], context: "Keep the same unfinished task" });
    f.state("job_succeeded"); await f.service.refreshNow(); await f.binding.wait("Pending", vi.fn());
    await f.binding.beginResume(); f.binding.activate();
    f.binding.readNativeNotification = async () => {
      if (mode === "missing") return undefined;
      if (mode === "deactivated") f.binding.deactivate();
      if (mode === "closed") f.binding.close();
      return { session: mode === "session" ? { ...session, generation: 99 } : session,
        history: { relativePath: "sessions/exact.jsonl", byteOffset: 12, sha256: "a".repeat(64), nativeTimestamp: "2026-10-09T19:03:38.899Z" } };
    };
    await expect(f.binding.assertTaskComplete()).rejects.toThrow("still needs experiment results");
    const doc = await f.service.document(f.request.projectPath);
    expect(doc.experiments[0]!.acknowledged).not.toBe(true);
    expect(doc.waits[0]!.nativeReceipt).toBeUndefined();
  });

  it("keeps a synchronous terminal query unfinished until its original native Session receives the result", async () => {
    const f = await fixture(); const { experiment } = await f.submit();
    f.state("job_succeeded"); await f.service.refreshNow();
    const result = await f.binding.call("sii_get_experiment", { experiment_id: experiment.id });
    expect(result).toMatchObject({ experiment: { id: experiment.id, status: "succeeded" } });
    // The MCP handler has only prepared its response. A disconnected caller
    // must not release the task before a real native result is observed.
    expect((await f.service.document(f.request.projectPath)).experiments[0]!.acknowledged).not.toBe(true);
    await expect(f.binding.assertTaskComplete()).rejects.toThrow("still needs experiment results");
    await receiveResult(f.binding, result);
    await f.binding.assertTaskComplete();
    const received = (await f.service.document(f.request.projectPath)).experiments[0]!;
    expect(received.notificationReceipt).toMatchObject({ source: "native_tool_result",
      invocationId: f.request.invocationId, nativeEventId: "native-sii-result", session });
    await receiveResult(f.binding, result);
    expect((await f.service.document(f.request.projectPath)).experiments[0]!.notificationReceipt).toEqual(received.notificationReceipt);
  });

  it("requires actual native evidence when an unfinished task retained only the old acknowledgement boolean", async () => {
    const f = await fixture(); const { experiment } = await f.submit();
    f.state("job_succeeded"); await f.service.refreshNow();
    await f.service.mutate(f.request.projectPath, doc => { doc.experiments[0]!.acknowledged = true; });
    await expect(f.binding.assertTaskComplete()).rejects.toThrow("still needs experiment results");
    const result = await f.binding.call("sii_get_experiment", { experiment_id: experiment.id });
    expect(result).toMatchObject({ result_receipt: expect.any(String), experiment: { acknowledged: false } });
    expect((await f.service.document(f.request.projectPath)).experiments[0]!.notificationReceipt).toBeUndefined();
    await receiveResult(f.binding, result);
    await f.binding.assertTaskComplete();
  });

  it("recovers a legacy unproved acknowledgement through the original Session without repeating submission", async () => {
    const f = await fixture(); const { experiment } = await f.submit();
    f.state("job_succeeded"); await f.service.refreshNow();
    await f.service.mutate(f.request.projectPath, doc => { doc.experiments[0]!.acknowledged = true; });
    f.binding.close(); await f.service.stop();
    const next = new SiiExperimentService(f.options); services.push(next); await next.start();
    const recovered = await next.bind({ ...f.request, invocationId: "inv_legacy_result_recovery" }, new AbortController().signal);
    recovered.session = session;
    const notification = await recovered.wait(undefined, vi.fn());
    expect(notification).toContain(experiment.id);
    await expect(recovered.assertTaskComplete()).rejects.toThrow("still needs experiment results");
    await receiveNotification(recovered, notification!);
    await recovered.assertTaskComplete();
    expect((await next.document(f.request.projectPath)).experiments[0]!.notificationReceipt)
      .toMatchObject({ source: "native_event", invocationId: "inv_legacy_result_recovery", session });
    expect(f.runJson.mock.calls.filter(([args]) => args.includes("create"))).toHaveLength(1);
  });

  it("leaves another task's legacy acknowledgement unchanged when a current task is invoked", async () => {
    const f = await fixture(); await f.submit();
    f.state("job_succeeded"); await f.service.refreshNow();
    await f.service.mutate(f.request.projectPath, doc => { doc.experiments[0]!.acknowledged = true; });
    const ledger = path.join(f.request.projectPath, "runtime", "sii-experiments.json");
    const historical = await fs.readFile(ledger, "utf8");
    const other = await f.service.bind({ ...f.request, taskSessionId: "another-unfinished-task" }, new AbortController().signal);
    other.session = session;
    expect(await other.wait(undefined, vi.fn())).toBeUndefined();
    await other.assertTaskComplete();
    expect(await fs.readFile(ledger, "utf8")).toBe(historical);
    other.close();
  });

  it.each(["exact", "stream_start", "other_call", "other_experiment"] as const)(
    "correlates an unnamed native result to its actual SII query (%s)", async mode => {
      const f = await fixture(); const { experiment } = await f.submit();
      f.state("job_succeeded"); await f.service.refreshNow();
      const result = await f.binding.call("sii_get_experiment", { experiment_id: experiment.id });
      const event = nativeResult(f.binding, result);
      await f.binding.observeNativeResult({ ...event, kind: "tool.started", phase: "started",
        tool: { ...event.tool, status: "started", outputPreview: undefined,
          input: mode === "stream_start" ? {} : { experiment_id: mode === "other_experiment" ? "other-experiment" : experiment.id } } }, session);
      event.tool.name = "tool";
      if (mode === "other_call") event.tool.callId = "other-native-call";
      await f.binding.observeNativeResult(event, session);
      expect((await f.service.document(f.request.projectPath)).experiments[0]!.acknowledged === true).toBe(["exact", "stream_start"].includes(mode));
    });

  it.each([false, true])("requires one distinct result identity in a native MCP response (conflicting=%s)", async conflicting => {
    const f = await fixture(); const { experiment } = await f.submit();
    f.state("job_succeeded"); await f.service.refreshNow();
    const result = await f.binding.call("sii_get_experiment", { experiment_id: experiment.id });
    const event = nativeResult(f.binding, result);
    event.tool.outputPreview = JSON.stringify({ content: [{ text: JSON.stringify(result) }], structuredContent: result,
      ...(conflicting ? { other: "[OpenFARS SII result " + "a".repeat(64) + "]" } : {}) });
    await f.binding.observeNativeResult(event, session);
    expect((await f.service.document(f.request.projectPath)).experiments[0]!.acknowledged === true).toBe(!conflicting);
  });

  it("does not carry an unnamed tool-call binding into a later invocation", async () => {
    const f = await fixture(); const { experiment } = await f.submit();
    f.state("job_succeeded"); await f.service.refreshNow();
    const first = await f.binding.call("sii_get_experiment", { experiment_id: experiment.id });
    const event = nativeResult(f.binding, first);
    await f.binding.observeNativeResult({ ...event, kind: "tool.started", phase: "started",
      tool: { ...event.tool, status: "started", input: {} } }, session);
    f.binding.activate({ ...f.request, invocationId: "inv_later_native_turn" }, session);
    const later = await f.binding.call("sii_get_experiment", { experiment_id: experiment.id });
    await f.binding.observeNativeResult({ ...nativeResult(f.binding, later), tool: { ...event.tool,
      name: "tool", outputPreview: JSON.stringify(later) } }, session);
    expect((await f.service.document(f.request.projectPath)).experiments[0]!.acknowledged).not.toBe(true);
  });

  it.each(["session", "current_session", "invocation", "harness", "tool", "failed", "assistant",
    "marker", "updated", "deactivated", "closed"] as const)(
    "keeps a prepared synchronous result unreceived with invalid native evidence (%s)", async mode => {
      const f = await fixture(); const { experiment } = await f.submit();
      f.state("job_succeeded"); await f.service.refreshNow();
      const result = await f.binding.call("sii_get_experiment", { experiment_id: experiment.id });
      const event = nativeResult(f.binding, result);
      let observedSession = session;
      if (mode === "session") observedSession = { ...session, nativeId: "another-native-session" };
      if (mode === "current_session") f.binding.session = { ...session, generation: 1 };
      if (mode === "invocation") event.invocationId = "another-invocation";
      if (mode === "harness") event.harnessId = "pi";
      if (mode === "tool") event.tool.name = "mcp__another-server__sii_get_experiment";
      if (mode === "failed") event.kind = "tool.failed";
      if (mode === "assistant") event.kind = "assistant.message";
      if (mode === "marker") event.tool.outputPreview = "Response queued";
      if (mode === "updated") await f.service.mutate(f.request.projectPath, doc => { doc.experiments[0]!.evidence = { newer: true }; });
      if (mode === "deactivated") f.binding.deactivate();
      if (mode === "closed") f.binding.close();
      await f.binding.observeNativeResult(event, observedSession);
      const saved = (await f.service.document(f.request.projectPath)).experiments[0]!;
      expect(saved.acknowledged).not.toBe(true);
      expect(saved.resultDelivery).toMatchObject({ invocationId: f.request.invocationId, session });
      expect(saved.notificationReceipt).toBeUndefined();
    });

  it("recovers an unreceived synchronous terminal result in the same Session after service restart", async () => {
    const f = await fixture(); const { experiment } = await f.submit();
    f.state("job_succeeded"); await f.service.refreshNow();
    await f.binding.call("sii_get_experiment", { experiment_id: experiment.id });
    const prepared = (await f.service.document(f.request.projectPath)).experiments[0]!.resultDelivery;
    expect(prepared).toBeDefined();
    f.binding.close(); await f.service.stop();
    const next = new SiiExperimentService(f.options); services.push(next); await next.start();
    const recovered = await next.bind({ ...f.request, invocationId: "inv_sync_result_recovery" }, new AbortController().signal);
    recovered.session = session;
    const notification = await recovered.wait(undefined, vi.fn());
    expect(notification).toContain("SII system notification (");
    expect(notification).toContain(experiment.id);
    await expect(recovered.assertTaskComplete()).rejects.toThrow("still needs experiment results");
    await receiveNotification(recovered, notification!);
    await recovered.assertTaskComplete();
    const saved = (await next.document(f.request.projectPath)).experiments[0]!;
    expect(saved.resultDelivery).toEqual(prepared);
    expect(saved.notificationReceipt).toMatchObject({ source: "native_event",
      invocationId: "inv_sync_result_recovery", session });
    expect(f.runJson.mock.calls.filter(([args]) => args.includes("create"))).toHaveLength(1);
  });

  it.each(["session", "cancelled", "updated"] as const)(
    "does not replace or acknowledge an unreceived synchronous snapshot during invalid recovery (%s)", async mode => {
      const f = await fixture(); const { experiment } = await f.submit();
      f.state("job_succeeded"); await f.service.refreshNow();
      await f.binding.call("sii_get_experiment", { experiment_id: experiment.id });
      const prepared = (await f.service.document(f.request.projectPath)).experiments[0]!.resultDelivery;
      if (mode === "session") {
        f.binding.session = { ...session, nativeId: "replacement-session" };
        await expect(f.binding.wait(undefined, vi.fn())).rejects.toThrow("cannot be replaced");
      } else if (mode === "cancelled") {
        f.binding.close();
        await expect(f.binding.wait(undefined, vi.fn())).rejects.toThrow();
      } else {
        await f.service.mutate(f.request.projectPath, doc => { doc.experiments[0]!.evidence = { newer: true }; });
        expect(await f.binding.wait(undefined, vi.fn())).toBeUndefined();
        await expect(f.binding.assertTaskComplete()).rejects.toThrow("still needs experiment results");
      }
      const saved = await f.service.document(f.request.projectPath);
      expect(saved.experiments[0]!.acknowledged).not.toBe(true);
      expect(saved.experiments[0]!.resultDelivery).toEqual(prepared);
      expect(saved.waits).toHaveLength(0);
    });

  it("does not acknowledge result evidence omitted from a bounded notification", async () => {
    const f = await fixture(); const { experiment } = await f.submit();
    await f.binding.call("sii_defer_task", { experiment_ids: [experiment.id], context: "Read the complete evidence." });
    f.state("job_succeeded"); await f.service.refreshNow();
    await f.service.mutate(f.request.projectPath, doc => { doc.experiments[0]!.evidence = { measured: "x".repeat(17000) }; });
    const notification = (await f.binding.wait("Pending.", vi.fn()))!;
    expect(notification).toContain("Results omitted"); expect(notification).toContain(experiment.id);
    await receiveNotification(f.binding, notification);
    expect((await f.service.document(f.request.projectPath)).experiments[0]!.acknowledged).not.toBe(true);
    await expect(f.binding.assertTaskComplete()).rejects.toThrow("still needs experiment results");
    await receiveResult(f.binding, await f.binding.call("sii_get_experiment", { experiment_id: experiment.id }));
    await f.binding.assertTaskComplete();
  });

  it("replays an unreceived prepared result after restart without another create or a replacement session", async () => {
    const f = await fixture(); const { experiment } = await f.submit();
    await f.binding.call("sii_defer_task", { experiment_ids: [experiment.id], context: "Continue original analysis." });
    f.state("job_succeeded"); await f.service.refreshNow();
    const prepared = (await f.binding.wait("Original pending handoff.", vi.fn()))!;
    await f.binding.beginResume(); f.binding.activate();
    await expect(f.binding.assertTaskComplete()).rejects.toThrow("still needs experiment results");
    f.binding.close(); await f.service.stop();
    const next = new SiiExperimentService(f.options); services.push(next); await next.start();
    const recovered = await next.bind({ ...f.request, invocationId: "inv_unreceived_recovery" }, new AbortController().signal);
    recovered.session = session;
    expect(await recovered.wait(undefined, vi.fn())).toBe(prepared);
    await expect(recovered.assertTaskComplete()).rejects.toThrow("still needs experiment results");
    expect((await next.document(f.request.projectPath)).waits[0]!.nativeReceipt).toBeUndefined();
    await receiveNotification(recovered, prepared);
    await recovered.assertTaskComplete();
    expect((await next.document(f.request.projectPath)).waits[0]!.nativeReceipt).toMatchObject({ invocationId: "inv_unreceived_recovery", session });
    expect(f.runJson.mock.calls.filter(([args]) => args.includes("create"))).toHaveLength(1);
  });

  it("retains an updated result that was not present in the actually received snapshot", async () => {
    const f = await fixture(); const { experiment } = await f.submit();
    await f.binding.call("sii_defer_task", { experiment_ids: [experiment.id], context: "Inspect exact observations." });
    f.state("job_succeeded"); await f.service.refreshNow();
    const notification = (await f.binding.wait("Pending.", vi.fn()))!;
    await f.service.mutate(f.request.projectPath, doc => { doc.experiments[0]!.evidence = { newer: true }; });
    await receiveNotification(f.binding, notification);
    expect((await f.service.document(f.request.projectPath)).experiments[0]!.acknowledged).not.toBe(true);
    await expect(f.binding.assertTaskComplete()).rejects.toThrow("still needs experiment results");
  });

  it("handles completion-before-deferral immediately and isolates task ownership", async () => {
    const f = await fixture(); const { experiment } = await f.submit();
    f.state("job_succeeded"); await f.service.refreshNow();
    await f.binding.call("sii_get_experiment", { experiment_id: experiment.id });
    await f.binding.call("sii_defer_task", { experiment_ids: [experiment.id], context: "Process results." });
    expect(await f.binding.wait("Pending.", vi.fn())).toContain('"status":"succeeded"');
    const other = await f.service.bind({ ...f.request, taskSessionId: "other-task" }, new AbortController().signal); other.session = session; other.activate();
    await expect(other.call("sii_get_experiment", { experiment_id: experiment.id })).rejects.toThrow("does not belong");
  });

  it("monitors each batch item independently and supports literal create options", async () => {
    const f = await fixture();
    const args = ["job", "create", "--workspace", "compute-space", "--project", "具有能动性的科学大模型", "--shm-size", "32", "--enable-notification"];
    const result = await f.binding.call("sii_submit_batch", { experiments: [
      { args: [...args, "--name", "batch-a"], request_id: "batch-a" },
      { args: [...args, "--name", "batch-b"], request_id: "batch-b" }
    ] });
    expect(JSON.stringify(result)).toContain("batch-b");
    expect((await f.service.document(f.request.projectPath)).experiments).toHaveLength(2);
    expect(f.runJson.mock.calls.every(([args]) => args.includes("--shm-size") && args.includes("--enable-notification"))).toBe(true);
  });

  it.each(["rejected", "unknown", "invalid"] as const)("retains each batch outcome and never repeats accepted creates when its middle item is %s", async middle => {
    const f = await fixture();
    f.runJson.mockImplementation(async args => {
      if (args.includes("create")) {
        const name = args[args.indexOf("--name") + 1];
        if (name === "partial-b" && middle === "unknown") throw new Error("create response lost");
        if (name === "partial-b" && middle === "rejected") return { success: false, data: { name, sub_code: 1 }, message: "quota rejected" };
        return { success: true, data: { name, sub_code: 0 } };
      }
      if (args.includes("partial-b")) throw new Error("original uncertain submission cannot yet be queried");
      return { success: true, data: { job: { status: args.includes("partial-a") ? "job_succeeded" : "job_running" } } };
    });
    const item = (name: string) => ({ request_id: name, args: ["job", "create", "--name", name,
      "--workspace", "compute-space", "--project", "具有能动性的科学大模型"] });
    const input = { experiments: [item("partial-a"), item("partial-b"), item("partial-c")] };
    if (middle === "invalid") input.experiments[1]!.args = ["job", "create", "--name", "partial-b", "--workspace", "compute-space"];
    const first = await f.binding.call("sii_submit_batch", input) as { results: Array<{ request_id?: string; error?: string; experiment?: { id: string; status: string } }> };
    expect(first.results).toHaveLength(3);
    expect(first.results[0]!.experiment?.status).toBe("queued");
    expect(first.results[2]!.experiment?.status).toBe("queued");
    if (middle === "invalid") expect(first.results[1]).toMatchObject({ request_id: "partial-b", error: expect.any(String) });
    else expect(first.results[1]!.experiment?.status).toBe(middle === "unknown" ? "submission_unknown" : "failed");
    const before = await f.service.document(f.request.projectPath);
    expect(before.experiments).toHaveLength(middle === "invalid" ? 2 : 3);
    expect(before.experiments.every(experiment => experiment.session.nativeId === session.nativeId && experiment.taskId === "original-task")).toBe(true);
    const replay = await f.binding.call("sii_submit_batch", input) as typeof first;
    expect(replay.results.map(result => result.experiment?.id)).toEqual(first.results.map(result => result.experiment?.id));
    expect(f.runJson.mock.calls.filter(([args]) => args.includes("create"))).toHaveLength(middle === "invalid" ? 2 : 3);
    await f.service.refreshNow();
    const observed = await f.service.document(f.request.projectPath);
    expect(observed.experiments.find(experiment => experiment.name === "partial-a")?.status).toBe("succeeded");
    expect(observed.experiments.find(experiment => experiment.name === "partial-c")?.status).toBe("running");
    if (middle === "unknown") {
      const uncertain = observed.experiments.find(experiment => experiment.name === "partial-b")!;
      expect(uncertain).toMatchObject({ status: "submission_unknown", queryErrors: 1 });
      expect(uncertain.acknowledged).not.toBe(true);
    }
    if (middle === "rejected") expect(observed.experiments.find(experiment => experiment.name === "partial-b")?.status).toBe("failed");
    expect(observed.experiments.map(experiment => experiment.id)).toEqual(before.experiments.map(experiment => experiment.id));
    await expect(f.binding.assertTaskComplete()).rejects.toThrow("still needs experiment results");
  });

  it("keeps completion and successor actions unrecorded until every required result reaches the original task Session", async () => {
    const f = await fixture();
    let secondDone = false;
    f.runJson.mockImplementation(async args => ({ success: true, data: args.includes("create")
      ? { name: args[args.indexOf("--name") + 1], sub_code: 0 }
      : { job: { status: args.includes("required-a") || secondDone ? "job_succeeded" : "job_running" } } }));
    const ids: string[] = [];
    for (const name of ["required-a", "required-b"]) {
      const result = await f.submit("job", { request_id: name, args: ["job", "create", "--name", name,
        "--workspace", "compute-space", "--project", "具有能动性的科学大模型"] });
      ids.push(result.experiment.id);
    }
    const stagingPath = path.join(f.request.runtimePath, "actions.json");
    const revalidate = vi.fn(async () => undefined);
    const controls = new ControlActionService({ projectId: PROJECT, agent: "execution", invocationId: "inv_first",
      stateVersion: 1, capability: "multi-result-capability", stagingPath, revalidate });
    const blocked = async (label: string) => {
      await expect(controls.stage("multi-result-capability", `${label}-finish`, { tool: "finish_task" })).rejects.toThrow("still needs experiment results");
      await expect(controls.stage("multi-result-capability", `${label}-successor`, { tool: "route_to_agent", target: "next", rationale: "Needs every result" })).rejects.toThrow("still needs experiment results");
      expect(revalidate).not.toHaveBeenCalled();
      await expect(fs.access(stagingPath)).rejects.toThrow();
    };
    await f.binding.call("sii_defer_task", { experiment_ids: ids, context: "Validate both required measurements" });
    const waiting = f.binding.wait("Both experiments are part of this unfinished task", vi.fn());
    await vi.waitFor(() => expect(f.onExperimentWait).toHaveBeenCalledWith(true));
    await blocked("waiting");
    await f.service.refreshNow();
    const first = (await waiting)!;
    expect(first).toContain('"name":"required-a","status":"succeeded"');
    // A terminal item can wake its owner before the serial monitor has
    // queried the second. Either pending snapshot must retain the gate.
    expect(first).toMatch(/"name":"required-b","status":"(?:queued|running)"/);
    expect((await f.service.document(f.request.projectPath)).experiments[1]!.status).toBe("running");
    await receiveNotification(f.binding, first);
    await blocked("first-result-received");
    await f.binding.clearWait();
    await f.binding.call("sii_defer_task", { experiment_ids: [ids[1]], context: "Keep waiting for my second measurement" });
    const second = f.binding.wait("First measurement received, same task still unfinished", vi.fn());
    await vi.waitFor(() => expect(f.onExperimentWait).toHaveBeenCalledTimes(3));
    secondDone = true; await f.due(); await f.service.refreshNow();
    const notice = (await second)!;
    await blocked("all-terminal-but-not-received");
    await receiveNotification(f.binding, notice);
    await controls.stage("multi-result-capability", "all-required-received-finish", { tool: "finish_task" });
    expect(revalidate).toHaveBeenCalledOnce();
    const doc = await f.service.document(f.request.projectPath);
    expect(doc.experiments.map(experiment => experiment.id)).toEqual(ids);
    expect(doc.experiments.every(experiment => experiment.acknowledged === true && experiment.notificationReceipt?.session.nativeId === session.nativeId)).toBe(true);
    expect(doc.experiments[0]!.notificationReceipt?.eventId).not.toBe(doc.experiments[1]!.notificationReceipt?.eventId);
    expect(f.runJson.mock.calls.filter(([args]) => args.includes("create"))).toHaveLength(2);
  });

  it("aborts an actual system wait without acknowledging, deleting, or resubmitting its remote experiment", async () => {
    const f = await fixture(); f.binding.close();
    const cancellation = new AbortController();
    const binding = await f.service.bind({ ...f.request, invocationId: "inv_cancel_wait" }, cancellation.signal);
    binding.session = session; binding.activate();
    const submitted = await binding.call("sii_submit_experiment", { request_id: "cancelled-wait", args: ["job", "create",
      "--name", "cancelled-wait", "--workspace", "compute-space", "--project", "具有能动性的科学大模型"] }) as { experiment: { id: string } };
    await binding.call("sii_defer_task", { experiment_ids: [submitted.experiment.id], context: "Retain the original result ownership" });
    const wait = binding.wait("Pending original experiment", vi.fn()).then(value => value, error => error as Error);
    await vi.waitFor(() => expect(f.onExperimentWait).toHaveBeenCalledWith(true));
    const held = await f.service.document(f.request.projectPath);
    cancellation.abort(new Error("Project cancelled while awaiting its experiment"));
    expect(await wait).toMatchObject({ message: "Project cancelled while awaiting its experiment" });
    expect(await f.service.document(f.request.projectPath)).toEqual(held);
    await expect(binding.call("sii_get_experiment", { experiment_id: submitted.experiment.id })).rejects.toThrow("Project cancelled");
    f.state("job_succeeded"); await f.due(); await f.service.refreshNow();
    const retained = await f.service.document(f.request.projectPath);
    expect(retained.experiments[0]).toMatchObject({ id: submitted.experiment.id, status: "succeeded", session });
    expect(retained.experiments[0]!.notificationReceipt).toBeUndefined();
    expect(retained.experiments[0]!.acknowledged).not.toBe(true);
    expect(retained.waits[0]).toEqual(held.waits[0]);
    expect(f.onExperimentWait.mock.calls.map(args => args[0])).toEqual([true]);
    expect(f.runJson.mock.calls.filter(([args]) => args.includes("create"))).toHaveLength(1);
    expect(f.runJson.mock.calls.some(([args]) => args.some(arg => ["delete", "cancel", "stop"].includes(arg)))).toBe(false);
  });

  it("monitors multiple programs on the same existing notebook without recreating it or accepting old run markers", async () => {
    const f = await fixture(); const marker = path.join(f.request.workspacePath, "notebook-run.json");
    await fs.writeFile(marker, JSON.stringify({ run_id: "previous-program", exit_code: 0 }));
    const input = { kind: "notebook", name: "reused-notebook", workspace: "compute-space", request_id: "program-one", completion_file: marker };
    const first = await f.binding.call("sii_register_experiment", input) as { experiment: { id: string } };
    await f.binding.call("sii_register_experiment", input);
    expect(f.runJson.mock.calls.filter(([args]) => args.includes("create"))).toHaveLength(0);
    await f.service.refreshNow();
    expect((await f.service.document(f.request.projectPath)).experiments[0]!.status).toBe("running");
    await f.binding.call("sii_command", { args: ["notebook", "exec", "reused-notebook", "start-background-program"] });
    await fs.writeFile(marker, JSON.stringify({ run_id: "program-one", exit_code: 0 }));
    await f.due(); await f.service.refreshNow();
    await receiveResult(f.binding, await f.binding.call("sii_get_experiment", { experiment_id: first.experiment.id }));
    const second = await f.binding.call("sii_register_experiment", { ...input, request_id: "program-two" }) as { experiment: { id: string } };
    await f.due(); await f.service.refreshNow();
    expect((await f.service.document(f.request.projectPath)).experiments[1]!.status).toBe("running");
    await fs.writeFile(marker, JSON.stringify({ run_id: "program-two", exit_code: 5 }));
    await f.due(); await f.service.refreshNow();
    await receiveResult(f.binding, await f.binding.call("sii_get_experiment", { experiment_id: second.experiment.id }));
    await f.binding.assertTaskComplete();
    expect(f.runJson.mock.calls.filter(([args]) => args.includes("create"))).toHaveLength(0);
    const other = await f.service.bind({ ...f.request, taskSessionId: "another-task" }, new AbortController().signal); other.session = session; other.activate();
    await expect(other.call("sii_register_experiment", { ...input, request_id: "program-two" })).rejects.toThrow("fresh request_id");
    await fs.writeFile(marker, JSON.stringify({ run_id: "untracked-old-run", exit_code: 0 }));
    await expect(other.call("sii_register_experiment", { ...input, request_id: "untracked-old-run" })).rejects.toThrow("already contains this run_id");
  });

  it("wakes a resource-only notebook startup on readiness without declaring its scientific program completed", async () => {
    const f = await fixture();
    const { experiment } = await f.submit("notebook", { required_for_task: false });
    await f.binding.call("sii_defer_task", { experiment_ids: [experiment.id], context: "When the notebook is ready, register and start my actual experiment." });
    const wait = f.binding.wait("Waiting for resource startup.", vi.fn());
    await vi.waitFor(() => expect(f.onExperimentWait).toHaveBeenCalledWith(true));
    f.state("notebook_running"); await f.service.refreshNow();
    const notification = await wait;
    expect(notification).toContain('"status":"resource_ready"');
    expect(notification).toContain('"completion_scope":"resource_startup"');
    await expect(f.binding.assertTaskComplete()).rejects.toThrow("still needs experiment results");
    await receiveNotification(f.binding, notification!);
    await f.binding.call("sii_register_experiment", { kind: "notebook", name: "training-a", workspace: "compute-space", request_id: "actual-program", completion_file: "actual-program.json" });
    await expect(f.binding.assertTaskComplete()).rejects.toThrow("still needs experiment results");
    expect(f.runJson.mock.calls.filter(([args]) => args.includes("create"))).toHaveLength(1);
  });

  it("keeps GPU accounting compatible and rejects completion without explicit deferral", async () => {
    const f = await fixture();
    const args = ["job", "create", "--name", "accounted-run", "--workspace", "compute-space", "--project", "具有能动性的科学大模型", "--quota", "2,16,128", "--nodes", "3", "--group", "H100-group", "--command", "echo inspire job create --name fake --quota 99,16,128"];
    await f.binding.call("sii_submit_experiment", { args, request_id: "accounted-run" });
    const registry = new ProjectInspireWorkloadRegistry(f.options.projectsRoot);
    expect(await registry.list(PROJECT)).toEqual([expect.objectContaining({ name: "accounted-run", requestedGpuCount: 6, requestedAcceleratorType: "H100", invocationId: "inv_first" })]);
    await f.binding.call("sii_submit_experiment", { args, request_id: "accounted-run" });
    expect(await registry.list(PROJECT)).toHaveLength(1);
    await expect(f.binding.assertTaskComplete()).rejects.toThrow("still needs experiment results");
    await expect(f.submit("job", { args: [...args, "--account", "wrong-account"] })).rejects.toThrow("must match");
    expect(f.runJson.mock.calls.filter(([args]) => args.includes("create"))).toHaveLength(1);
  });

  it("does not permit required submission or deferral after a completion receipt", async () => {
    const f = await fixture();
    const stagingPath = path.join(f.request.runtimePath, "actions.json");
    await fs.mkdir(path.dirname(stagingPath), { recursive: true });
    await fs.writeFile(stagingPath, JSON.stringify([{ action: { tool: "finish_task" } }]));
    f.binding.activate({ ...f.request, control: { stagingPath } as AgentRunRequest["control"] });
    await expect(f.submit()).rejects.toThrow("already recorded task completion");
    expect(f.runJson).not.toHaveBeenCalled();
  });
});
