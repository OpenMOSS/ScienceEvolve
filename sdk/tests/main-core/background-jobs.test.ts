import { createConnection } from "node:net";
import { ControlActionService, startControlActionBridge } from "../../src/core/orchestration-control-bridge.js";
import { promises as fs } from "node:fs";
import { spawn, type ChildProcess } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { nativeBackgroundJobLifecycle, requestNativeBackgroundJob, type NativeJobScope } from "../../src/core/harness-runtime/background-jobs.js";
const roots: string[] = [], children: ChildProcess[] = [];
afterEach(async () => {
  for (const child of children.splice(0)) { try { process.kill(-child.pid!, "SIGKILL"); } catch {} }
  await Promise.all(roots.splice(0).map(root => fs.rm(root, { recursive: true, force: true })));
});
async function fixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-native-job-")); roots.push(root);
  const workspacePath = path.join(root, "workspaces"); await fs.mkdir(workspacePath);
  const scope: NativeJobScope = { projectId: "prj_fixture", projectPath: root, workspacePath, agentId: "coder", invocationId: "original", executionId: "retained-task" };
  const child = spawn(process.execPath, ["-e", "setInterval(()=>{},1000)"], { cwd: workspacePath, detached: true, stdio: "ignore",
    env: { PATH: process.env.PATH, SCIENCEEVOLVE_PROJECT_ID: scope.projectId, SCIENCEEVOLVE_AGENT_NAME: scope.agentId } });
  children.push(child); await new Promise<void>((resolve, reject) => { child.once("spawn", resolve); child.once("error", reject); });
  const current = vi.fn(async () => {});
  const call = (operation: "register" | "status" | "pause" | "resume" | "stop") => requestNativeBackgroundJob(scope, { operation, jobId: "experiment", ...(operation === "register" ? { pid: child.pid } : {}) }, current);
  return { root, scope, child, call, current };
}
describe.runIf(process.platform === "linux")("native background handoff", () => {
  it("retains the actual isolated job across turns and applies real project pause/resume/stop", async () => {
    const { scope, child, call, current } = await fixture();
    expect(await call("register")).toMatchObject({ state: "running", pid: child.pid, invocationId: "original", executionId: "retained-task" });
    expect(await requestNativeBackgroundJob({ ...scope, invocationId: "next-turn" }, { operation: "status", jobId: "experiment" }, current))
      .toMatchObject({ state: "running", invocationId: "original" });
    await nativeBackgroundJobLifecycle(scope.projectPath, "pause", () => {});
    expect(await call("status")).toMatchObject({ state: "paused", pausedByProject: true });
    await nativeBackgroundJobLifecycle(scope.projectPath, "resume", () => {});
    expect(await call("status")).toMatchObject({ state: "running", pausedByProject: false });
    await nativeBackgroundJobLifecycle(scope.projectPath, "stop", () => {});
    expect(await call("status")).toMatchObject({ state: "exited" });
    const history = await fs.readFile(path.join(scope.projectPath, "runtime", "native-background-jobs", "events.jsonl"), "utf8");
    expect(history).toContain('"operation":"project.pause"'); expect(history).toContain('"operation":"project.stop"');
  });
  it("does not resume an Agent-paused experiment, or signal a reused/different process identity", async () => {
    const { root, scope, child, call } = await fixture(); await call("register"); await call("pause");
    await nativeBackgroundJobLifecycle(root, "resume", () => {});
    expect(await call("status")).toMatchObject({ state: "paused" });
    const file = path.join(root, "runtime", "native-background-jobs", "experiment.json");
    const record = JSON.parse(await fs.readFile(file, "utf8")); record.startTicks = "0";
    await fs.writeFile(file, JSON.stringify(record));
    expect(await call("stop")).toMatchObject({ state: "exited" });
    process.kill(child.pid!, 0); // It was not the recorded process; no signal was sent.
  });
  it("rejects another Agent and a revoked writer before controlling the process", async () => {
    const { scope, child, call } = await fixture(); await call("register");
    await expect(requestNativeBackgroundJob({ ...scope, agentId: "other" }, { operation: "stop", jobId: "experiment" }, async () => {})).rejects.toThrow("another Agent");
    await expect(requestNativeBackgroundJob(scope, { operation: "stop", jobId: "experiment" }, async () => { throw new Error("writer lease stale"); })).rejects.toThrow("writer lease stale");
    process.kill(child.pid!, 0);
  });
  it("routes real process monitoring through the authenticated bridge and rejects a revoked turn", async () => {
    const { scope, child, current } = await fixture();
    const service = new ControlActionService({ projectId: scope.projectId, agent: scope.agentId, invocationId: scope.invocationId,
      capability: "fixture-only", stateVersion: 1, stagingPath: path.join(scope.projectPath, "actions.json"), nativeJobScope: scope,
      revalidate: async () => { throw new Error("Job control must not stage a Workflow decision"); }, projectState: current });
    const bridge = await startControlActionBridge(service, scope.projectPath);
    const request = (body: unknown) => new Promise<any>((resolve, reject) => {
      const socket = bridge.endpoint.path ? createConnection(bridge.endpoint.path) : createConnection({ host: bridge.endpoint.host, port: bridge.endpoint.port! });
      let text = ""; socket.on("error", reject); socket.setEncoding("utf8");
      socket.on("connect", () => socket.write(JSON.stringify({ capability: "fixture-only", backgroundJob: body }) + "\n"));
      socket.on("data", chunk => { text += chunk; if (text.includes("\n")) { socket.end(); resolve(JSON.parse(text.split("\n")[0]!)); } });
    });
    try {
      expect(await request({ operation: "register", jobId: "experiment", pid: child.pid })).toMatchObject({ ok: true, stateResult: { state: "running" } });
      expect(current).toHaveBeenCalled(); service.revoke();
      expect(await request({ operation: "stop", jobId: "experiment" })).toMatchObject({ ok: false });
      process.kill(child.pid!, 0);
    } finally { await bridge.close(); }
  });

});
