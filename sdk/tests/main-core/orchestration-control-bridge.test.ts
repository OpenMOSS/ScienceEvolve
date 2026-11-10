import { afterEach, describe, expect, it, vi } from "vitest";
import { promises as fs } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import {
  AUTHORITATIVE_WORKFLOW_REFERENCES,
  authoritativeWorkflowPaths,
  ControlActionService,
  ControlActionRejectedError,
  publishAuthoritativeWorkflowFiles,
  startControlActionBridge,
  type ControlActionBridge
} from "../../src/core/orchestration-control-bridge.js";
import { cloneAgentOrchestrationTemplate } from "../../src/core/agent-orchestration.js";
import type { AuthoritativeWorkflowFiles, ControlAction } from "../../src/core/types.js";

const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

function callBridge(
  endpoint: { path?: string; host?: string; port?: number },
  request: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const socket = endpoint.path
      ? net.createConnection(endpoint.path)
      : net.createConnection({ host: endpoint.host, port: endpoint.port });
    let output = "";
    socket.setEncoding("utf8");
    socket.once("error", reject);
    socket.on("data", (chunk: string) => {
      output += chunk;
      const newline = output.indexOf("\n");
      if (newline < 0) return;
      socket.end();
      resolve(JSON.parse(output.slice(0, newline)) as Record<string, unknown>);
    });
    socket.once("connect", () => socket.write(`${JSON.stringify(request)}\n`));
  });
}

describe("orchestration control bridge", () => {
  it("rejects an incomplete completion result rather than returning a successful save acknowledgement", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "finish-incomplete-")); roots.push(root);
    const onResult = vi.fn();
    const service = new ControlActionService({ projectId: "project", agent: "worker", invocationId: "turn", stateVersion: 1,
      capability: "secret", stagingPath: path.join(root, "actions.json"),
      revalidate: async () => ({ taskId: "task" }), onResult });
    await expect(service.stageWithResult("secret", "finish", { tool: "finish_task" })).rejects.toThrow("missing agent");
    expect(onResult).not.toHaveBeenCalled();
    await expect(fs.readFile(path.join(root, "actions.json"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("retains finish facts but refuses a successful tool return after its capability is revoked", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "finish-revoked-")); roots.push(root);
    const onResult = vi.fn(() => { service.revoke(); return "a".repeat(64); });
    const service = new ControlActionService({ projectId: "project", agent: "worker", invocationId: "turn", stateVersion: 1,
      capability: "secret", stagingPath: path.join(root, "actions.json"), revalidate: async () => ({ receiptPath: "/runtime/finish.json" }), onResult });
    await expect(service.stageWithResult("secret", "finish", { tool: "finish_task" })).rejects.toThrow("revoked");
    expect(onResult).toHaveBeenCalledWith(expect.objectContaining({ result: { receiptPath: "/runtime/finish.json" } }));
    expect(JSON.parse(await fs.readFile(path.join(root, "actions.json"), "utf8"))).toHaveLength(1);
  });

  it("returns the persisted finish receipt without repeating its summary or memory", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "finish-result-")); roots.push(root);
    const receipt = { taskId: "same-task", agent: "worker", invocationId: "original-invocation", callId: "original-finish",
      requestedAt: "2026-11-04T05:40:51.164Z", status: "accepted", acceptedAt: "2026-11-04T05:41:00.000Z",
      memoryPath: "/workspace/agent-memory/worker/Memory.md", summary: "Original summary", memory: "Original memory" };
    const onResult = vi.fn(() => "a".repeat(64)), execute = vi.fn();
    const service = new ControlActionService({ projectId: "project", agent: "worker", invocationId: "recovered-invocation",
      stateVersion: 2, capability: "secret", stagingPath: path.join(root, "actions.json"),
      revalidate: async () => receipt, onResult, execute });
    const action = { tool: "finish_task" as const, memory: "Replacement memory that is not appended" };
    const result = await service.stageWithResult("secret", "finish", action);
    expect(result.result).toEqual({ taskId: receipt.taskId, agent: receipt.agent, invocationId: receipt.invocationId,
      callId: receipt.callId, requestedAt: receipt.requestedAt, status: receipt.status, acceptedAt: receipt.acceptedAt,
      memoryPath: receipt.memoryPath });
    expect(onResult).toHaveBeenCalledWith(expect.objectContaining({ result: result.result }));
    expect(await service.stageWithResult("secret", "finish", action)).toEqual(result);
    expect(execute).not.toHaveBeenCalled();
  });

  it("replays the original Git request when only its explanation changes, retaining exact targets and authority", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "git-retry-identity-")); roots.push(root);
    let authorized = true;
    const execute = vi.fn(async envelope => {
      if (execute.mock.calls.length === 1) throw new Error("Original remote merge succeeded; local synchronization pending");
      return { status: "merged", originalReason: envelope.action.reason };
    });
    const service = new ControlActionService({ projectId: "prj_test", agent: "worker", invocationId: "inv_retry",
      stateVersion: 1, capability: "secret", stagingPath: path.join(root, "actions.json"), execute,
      revalidate: async () => { if (!authorized) throw new Error("Original authority ended"); } });
    await expect(service.stageWithResult("secret", "merge-original", { tool: "github_merge_pr", providerNumber: 10, reason: "Original explanation" })).rejects.toThrow("synchronization pending");
    const result = await service.stageWithResult("secret", "merge-original", { tool: "github_merge_pr", providerNumber: 10, reason: "Retry remaining synchronization" });
    expect(result.result).toEqual({ status: "merged", originalReason: "Original explanation" });
    expect(result.envelope.action).toEqual({ tool: "github_merge_pr", providerNumber: 10, reason: "Original explanation" });
    await expect(service.stageWithResult("secret", "merge-original", { tool: "github_merge_pr", providerNumber: 11 })).rejects.toThrow("different action");
    expect(execute).toHaveBeenCalledTimes(2);
    authorized = false;
    await expect(service.stageWithResult("secret", "merge-original", { tool: "github_merge_pr", providerNumber: 10 })).rejects.toThrow("authority ended");
  });
  it("stages independent failed-arrival decisions in one turn without unlocking conflicting or global decisions", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scoped-independent-decisions-")); roots.push(root);
    const stagingPath = path.join(root, "actions.json");
    let active = true;
    const accepted: string[] = [];
    const service = new ControlActionService({ projectId: "prj_group", agent: "main", invocationId: "inv_recovery",
      stateVersion: 7, capability: "secret", stagingPath, revalidate: async (envelope) => {
        if (!active) throw new Error("original management authority ended");
        accepted.push(envelope.callId);
      } });
    const choice = (arrivalRequestId: string): ControlAction => ({ tool: "coordinate_group_task", groupRunId: "run-G",
      coordinatorEpoch: 7, arrivalRequestId, operation: "retry", rationale: `Original Agent repairs ${arrivalRequestId}` });
    const [first, second] = await Promise.all([service.stage("secret", "a", choice("failed-a")), service.stage("secret", "b", choice("failed-b"))]);
    expect(await service.stage("secret", "repeat-a", choice("failed-a"))).toEqual(first);
    expect(await service.stage("secret", "repeat-b", choice("failed-b"))).toEqual(second);
    await expect(service.stage("secret", "conflict-a", { ...choice("failed-a"), operation: "escalate" } as ControlAction)).rejects.toThrow("decision is already locked");
    await expect(service.stage("secret", "replace-b", { ...choice("failed-b"), rationale: "Replace the retained choice" } as ControlAction)).rejects.toThrow("decision is already locked");
    await expect(service.stage("secret", "new-global", { tool: "request_user", message: "Alternative global transition", rationale: "Conflicts with staged recovery" })).rejects.toThrow("decision is already locked");
    await expect(service.stage("secret", "reused-call", choice("failed-c"))).resolves.toMatchObject({ callId: "reused-call" });
    await expect(service.stage("secret", "a", choice("failed-d"))).rejects.toThrow("callId was already used");
    expect(accepted).toEqual(["a", "b", "repeat-a", "repeat-b", "reused-call"]);
    active = false;
    await expect(service.stage("secret", "repeat-after-stop", choice("failed-a"))).rejects.toThrow("authority ended");
    active = true; service.revoke();
    await expect(service.stage("secret", "new-after-revoke", choice("failed-d"))).rejects.toThrow("revoked");
    expect(JSON.parse(await fs.readFile(stagingPath, "utf8")).map((entry: { callId: string }) => entry.callId)).toEqual(["a", "b", "reused-call"]);

    const alternative = new ControlActionService({ projectId: "prj_group", agent: "main", invocationId: "inv_alternative",
      stateVersion: 8, capability: "other", stagingPath: path.join(root, "alternative.json"), revalidate: async () => {} });
    await alternative.stage("other", "global-first", { tool: "request_user", message: "Please advise", rationale: "Agent cannot resolve this round" });
    await expect(alternative.stage("other", "late-recovery", choice("failed-a"))).rejects.toThrow("decision is already locked");
  });

  it("keeps an unleased capability active until the invocation revokes it", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-control-lifecycle-"));
    roots.push(root);
    const service = new ControlActionService({
      projectId: "prj_test",
      agent: "main",
      invocationId: "inv_long_running",
      stateVersion: 3,
      capability: "secret",
      stagingPath: path.join(root, "actions.json"),
      revalidate: async () => {}
    });

    await expect(service.stage("secret", "publish-1", {
      tool: "publish_artifact",
      path: "report.md",
      title: "Report",
      kind: "document",
      description: "Long-running invocation output"
    })).resolves.toMatchObject({
      invocationId: "inv_long_running",
      callId: "publish-1"
    });

    service.revoke();
    await expect(service.stage("secret", "publish-2", {
      tool: "publish_artifact",
      path: "appendix.md",
      title: "Appendix",
      kind: "document",
      description: "Must not be accepted after invocation shutdown"
    })).rejects.toThrow("revoked");
  });

  it("revalidates each action against the actions already staged in the invocation", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-control-cumulative-"));
    roots.push(root);
    const stagedTools: string[][] = [];
    const service = new ControlActionService({
      projectId: "prj_test",
      agent: "main",
      invocationId: "inv_test",
      stateVersion: 3,
      capability: "secret",
      stagingPath: path.join(root, "actions.json"),
      revalidate: async (_envelope, stagedActions) => {
        stagedTools.push(stagedActions.map((item) => item.action.tool));
      }
    });

    await service.stage("secret", "publish-1", {
      tool: "publish_artifact",
      path: "report.md",
      title: "Report",
      kind: "document",
      description: "Verified report"
    });
    await service.stage("secret", "display-1", {
      tool: "select_display",
      primary: { agent: "main", path: "report.md", title: "Report" },
      items: []
    });

    expect(stagedTools).toEqual([[], ["publish_artifact"]]);
  });

  it("keeps equivalent preparatory actions idempotent across fresh process call ids", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-control-preparation-idempotent-"));
    roots.push(root);
    const stagingPath = path.join(root, "actions.json");
    const onRejected = vi.fn(async () => {});
    const service = new ControlActionService({
      projectId: "prj_test",
      agent: "main",
      invocationId: "inv_test",
      stateVersion: 3,
      capability: "secret",
      stagingPath,
      revalidate: async () => {},
      onRejected
    });
    const first = await service.stage("secret", "display-1", {
      tool: "select_display",
      primary: { agent: "optimizer", path: "report.md", title: "First title" },
      items: [{ agent: "auditor", path: "audit.md", title: "Audit" }]
    });
    const sameCall = await service.stage("secret", "display-1", {
      tool: "select_display",
      primary: { agent: "optimizer", path: "report.md", title: "Regenerated title" },
      items: [{ agent: "auditor", path: "audit.md", title: "Regenerated audit title" }]
    });
    const freshCall = await service.stage("secret", "display-2", {
      tool: "select_display",
      primary: { agent: "optimizer", path: "report.md", title: "Another title" },
      items: [{ agent: "auditor", path: "audit.md", title: "Another audit title" }]
    });

    expect(sameCall).toEqual(first);
    expect(freshCall).toEqual(first);
    expect(onRejected).not.toHaveBeenCalled();
    expect(JSON.parse(await fs.readFile(stagingPath, "utf8"))).toEqual([first]);

    const replacement = await service.stage("secret", "display-3", {
      tool: "select_display",
      primary: { agent: "optimizer", path: "revised.md", title: "Revised" },
      items: []
    });
    expect(JSON.parse(await fs.readFile(stagingPath, "utf8"))).toEqual([replacement]);
  });

  it("treats repeated finish_task requests as one preparatory completion receipt", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-control-finish-task-"));
    roots.push(root);
    const stagingPath = path.join(root, "actions.json");
    const service = new ControlActionService({
      projectId: "prj_test",
      agent: "worker",
      invocationId: "inv_test",
      stateVersion: 3,
      capability: "secret",
      stagingPath,
      revalidate: async () => {}
    });
    const first = await service.stage("secret", "finish-1", {
      tool: "finish_task",
      summary: "Verified",
      memory: "Remember the verification."
    });
    const repeated = await service.stage("secret", "finish-2", {
      tool: "finish_task",
      summary: "Verified",
      memory: "Remember the verification."
    });
    expect(repeated).toEqual(first);
    expect(JSON.parse(await fs.readFile(stagingPath, "utf8"))).toEqual([first]);
    await expect(service.stage("secret", "finish-3", {
      tool: "finish_task",
      summary: "A different completion claim"
    })).rejects.toThrow("task completion is already staged");
  });

  it("keeps one idempotent decision slot while allowing later preparatory actions", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-control-idempotent-"));
    roots.push(root);
    const stagingPath = path.join(root, "actions.json");
    const onRejected = vi.fn(async () => {});
    const service = new ControlActionService({
      projectId: "prj_test",
      agent: "main",
      invocationId: "inv_test",
      stateVersion: 3,
      capability: "secret",
      stagingPath,
      revalidate: async () => {},
      onRejected
    });

    const first = await service.stage("secret", "route-1", {
      tool: "route_to_agent",
      target: "writer",
      assignment: "Draft the report."
    });
    const repeated = await service.stage("secret", "route-2", {
      tool: "route_to_agent",
      target: "writer",
      assignment: "Draft and verify the report.",
      rationale: "The same worker remains next."
    });

    expect(repeated).toEqual(first);
    expect(onRejected).not.toHaveBeenCalled();
    expect(JSON.parse(await fs.readFile(stagingPath, "utf8"))).toHaveLength(1);
    await expect(service.stage("secret", "route-3", {
      tool: "route_to_agent",
      target: "reviewer",
      assignment: "Review instead."
    })).rejects.toThrow("decision is already locked");
    expect(onRejected).toHaveBeenCalledOnce();
    await expect(service.stage("secret", "publish-1", {
      tool: "publish_artifact",
      path: "report.md",
      title: "Report",
      kind: "document",
      description: "Verified output"
    })).resolves.toMatchObject({ action: { tool: "publish_artifact" } });
    expect(JSON.parse(await fs.readFile(stagingPath, "utf8"))).toHaveLength(2);
  });

  it("stages only through the server-owned service and revokes the bearer", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-control-bridge-"));
    roots.push(root);
    const stagingPath = path.join(root, "runtime", "actions.json");
    let revalidated = 0;
    const service = new ControlActionService({
      projectId: "prj_test",
      agent: "worker",
      invocationId: "inv_test",
      stateVersion: 3,
      capability: "secret",
      capabilityHash: "hash",
      stagingPath,
      revalidate: async () => { revalidated += 1; }
    });
    let bridge: ControlActionBridge;
    try {
      bridge = await startControlActionBridge(service, root);
    } catch (error) {
      // The restricted test sandbox denies local listeners; the application
      // suite runs this same check with loopback permission enabled.
      if ((error as NodeJS.ErrnoException).code === "EPERM") return;
      throw error;
    }
    const activeBridge = bridge;
    const response = await callBridge(activeBridge.endpoint, {
      capability: "secret",
      callId: "call-1",
      action: { tool: "route_to_agent", target: "writer", rationale: "Evidence is ready." }
    });
    expect(response.ok).toBe(true);
    expect(revalidated).toBe(1);
    expect(JSON.parse(await fs.readFile(stagingPath, "utf8"))).toMatchObject([
      { projectId: "prj_test", agent: "worker", invocationId: "inv_test", callId: "call-1" }
    ]);
    await activeBridge.close();
    await expect(callBridge(activeBridge.endpoint, {
      capability: "secret",
      callId: "call-2",
      action: { tool: "route_to_agent", target: "writer", rationale: "late" }
    })).rejects.toBeDefined();
  });

  it.each(["git_push", "github_close_pr"] as const)("returns an explicit Agent %s result and does not repeat the provider action", async (tool) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-agent-git-result-"));
    roots.push(root);
    const execute = vi.fn(async (envelope: { action: { tool: string } }) => ({
      operation: envelope.action.tool,
      sha: "a".repeat(40)
    }));
    const service = new ControlActionService({
      projectId: "prj_git",
      agent: "worker",
      invocationId: "inv_git",
      stateVersion: 4,
      capability: "secret",
      stagingPath: path.join(root, "actions.json"),
      revalidate: async () => {},
      execute
    });
    const bridge = await startControlActionBridge(service, root);
    try {
      const action = tool === "git_push" ? { tool } : { tool, providerNumber: 71, reason: "Agent chose closure" };
      const first = await callBridge(bridge.endpoint, { capability: "secret", callId: "git-1", action });
      const replay = await callBridge(bridge.endpoint, { capability: "secret", callId: "git-1", action });
      expect(first).toMatchObject({ ok: true, envelope: { action }, result: { operation: tool, sha: "a".repeat(40) } });
      expect(replay).toEqual(first);
      expect(execute).toHaveBeenCalledOnce();
    } finally {
      await bridge.close();
    }
  });

  it("accepts one idempotent group-management decision and locks conflicting decisions", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-group-control-"));
    roots.push(root);
    const stagingPath = path.join(root, "actions.json");
    const service = new ControlActionService({
      projectId: "prj_group",
      agent: "caller",
      invocationId: "inv_leader",
      stateVersion: 9,
      capability: "secret",
      stagingPath,
      revalidate: async () => {}
    });
    const action = {
      tool: "assign_group_tasks" as const,
      groupRunId: "grun_1",
      coordinatorEpoch: 3,
      tasks: [{ taskId: "task_scoped", assignment: "Implement the scoped change.", assigneeAgentId: "worker_a" }]
    };

    const first = await service.stage("secret", "assign-1", action);
    const repeated = await service.stage("secret", "assign-2", action);
    expect(repeated).toEqual(first);
    expect(JSON.parse(await fs.readFile(stagingPath, "utf8"))).toHaveLength(1);

    await expect(service.stage("secret", "complete-1", {
      tool: "complete_group",
      groupRunId: "grun_1",
      coordinatorEpoch: 3,
      output: "Final PR merged."
    })).rejects.toThrow("decision is already locked");
  });

  it("returns a structured semantic rejection without staging or locking the retry", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-group-preflight-"));
    roots.push(root);
    const stagingPath = path.join(root, "actions.json");
    const rejected = vi.fn(async () => {});
    const service = new ControlActionService({
      projectId: "prj_group",
      agent: "coordinator",
      invocationId: "inv_leader",
      stateVersion: 12,
      capability: "secret",
      stagingPath,
      revalidate: async (envelope) => {
        if (envelope.action.tool === "assign_group_tasks" &&
          envelope.action.tasks[0]?.assigneeAgentId === "removed-member") {
          throw new ControlActionRejectedError({
            code: "INVALID_STATE_TRANSITION",
            message: "Task assignee is not an eligible member snapshot",
            invalidField: "tasks[0].assigneeAgentId",
            currentRevision: 14,
            workflowRevision: 3,
            authoritativeFiles: AUTHORITATIVE_WORKFLOW_REFERENCES
          });
        }
      },
      onRejected: rejected
    });
    let bridge: ControlActionBridge;
    try {
      bridge = await startControlActionBridge(service, root);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EPERM") return;
      throw error;
    }
    try {
      const invalid = await callBridge(bridge.endpoint, {
        capability: "secret",
        callId: "assign-invalid",
        action: {
          tool: "assign_group_tasks",
          groupRunId: "grun_1",
          coordinatorEpoch: 2,
          tasks: [{
            taskId: "task_1",
            assignment: "Implement the scoped change.",
            assigneeAgentId: "removed-member"
          }]
        }
      });
      expect(invalid).toMatchObject({
        ok: false,
        error: {
          code: "INVALID_STATE_TRANSITION",
          invalidField: "tasks[0].assigneeAgentId",
          currentRevision: 14,
          workflowRevision: 3,
          authoritativeFiles: AUTHORITATIVE_WORKFLOW_REFERENCES
        }
      });
      await expect(fs.access(stagingPath)).rejects.toMatchObject({ code: "ENOENT" });

      const valid = await callBridge(bridge.endpoint, {
        capability: "secret",
        callId: "assign-valid",
        action: {
          tool: "assign_group_tasks",
          groupRunId: "grun_1",
          coordinatorEpoch: 2,
          tasks: [{
            taskId: "task_1",
            assignment: "Implement the scoped change.",
            assigneeAgentId: "worker-a"
          }]
        }
      });
      expect(valid).toMatchObject({ ok: true, envelope: { callId: "assign-valid" } });
      expect(JSON.parse(await fs.readFile(stagingPath, "utf8"))).toMatchObject([
        { callId: "assign-valid", action: { tasks: [{ assigneeAgentId: "worker-a" }] } }
      ]);
      expect(rejected).toHaveBeenCalledOnce();
    } finally {
      await bridge.close();
    }
  });

  it.each(["queued", "Windows retry"])("rejects a retired publisher after a %s wait without replacing the current files", async (boundary) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-publication-fence-")); roots.push(root);
    const publication = (revision: number): AuthoritativeWorkflowFiles => ({
      definition: { schemaVersion: 1, projectId: "prj_writer", workflowRevision: 1, workflow: cloneAgentOrchestrationTemplate() },
      currentState: { schemaVersion: 1, projectId: "prj_writer", workflowRevision: 1, stateRevision: revision, runState: "idle", frozen: false, members: [] }
    });
    const paths = authoritativeWorkflowPaths(root);
    let current = true;
    const fence = () => { if (!current) throw new Error("writer lease retired"); };
    if (boundary === "queued") {
      let release!: () => void, entered!: () => void;
      const blocked = new Promise<void>(resolve => { release = resolve; });
      const ready = new Promise<void>(resolve => { entered = resolve; });
      const write = fs.writeFile.bind(fs); let paused = false;
      const hook = vi.spyOn(fs, "writeFile").mockImplementation(async (...args) => {
        await write(...args);
        if (!paused && String(args[0]).startsWith(paths.definition + ".")) { paused = true; entered(); await blocked; }
      });
      try {
        const first = publishAuthoritativeWorkflowFiles(root, publication(1)); await ready;
        const retired = publishAuthoritativeWorkflowFiles(root, publication(2), fence);
        const rejected = expect(retired).rejects.toThrow("writer lease retired");
        current = false; release(); await first; await rejected;
        expect(JSON.parse(await fs.readFile(paths.currentState, "utf8")).stateRevision).toBe(1);
        current = true; await publishAuthoritativeWorkflowFiles(root, publication(2), fence);
        expect(JSON.parse(await fs.readFile(paths.currentState, "utf8")).stateRevision).toBe(2);
      } finally { release(); hook.mockRestore(); }
    } else {
      await publishAuthoritativeWorkflowFiles(root, publication(1));
      const successor = publication(2);
      const successorFiles = [paths.definition + ".successor", paths.currentState + ".successor"];
      await fs.writeFile(successorFiles[0], JSON.stringify(successor.definition), { mode: 0o400, flag: "wx" });
      await fs.writeFile(successorFiles[1], JSON.stringify(successor.currentState), { mode: 0o400, flag: "wx" });
      const rename = fs.rename.bind(fs); let attempts = 0;
      const platform = Object.getOwnPropertyDescriptor(process, "platform")!;
      Object.defineProperty(process, "platform", { ...platform, value: "win32" });
      const hook = vi.spyOn(fs, "rename").mockImplementation(async (source, destination) => {
        if (String(destination) === paths.definition) {
          attempts++; current = false;
          await rename(successorFiles[0], paths.definition); await rename(successorFiles[1], paths.currentState);
          throw Object.assign(new Error("sharing violation during writer handoff"), { code: "EBUSY" });
        }
        return rename(source, destination);
      });
      try {
        await expect(publishAuthoritativeWorkflowFiles(root, publication(2), fence)).rejects.toThrow("writer lease retired");
        expect(attempts).toBe(1);
        expect(JSON.parse(await fs.readFile(paths.definition, "utf8"))).toEqual(successor.definition);
        expect(JSON.parse(await fs.readFile(paths.currentState, "utf8"))).toEqual(successor.currentState);
        expect((await fs.stat(paths.definition)).mode & 0o222).toBe(0);
      } finally { hook.mockRestore(); Object.defineProperty(process, "platform", platform); }
    }
    expect((await fs.readdir(paths.directory)).filter(name => name.endsWith(".tmp"))).toEqual([]);
  });

  it("atomically publishes one credential-free workflow revision for every Harness", async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), "scienceevolve-authoritative-workflow-"));
    roots.push(root);
    const workflow = cloneAgentOrchestrationTemplate();
    const publication = (
      stateRevision: number,
      workflowRevision: number
    ): AuthoritativeWorkflowFiles => ({
      definition: {
        schemaVersion: 1,
        projectId: "prj_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        workflowRevision,
        workflow: {
          ...workflow,
          decisionPlans: {
            ...workflow.decisionPlans,
            main: `Authoritative revision ${workflowRevision}`
          }
        }
      },
      currentState: {
        schemaVersion: 1,
        projectId: "prj_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        workflowRevision,
        stateRevision,
        runState: "idle",
        frozen: false,
        members: []
      }
    });
    const paths = authoritativeWorkflowPaths(root);
    const parseAttempts: Promise<void>[] = ["codex", "pi", "dsh"]
      .map(async () => {
        for (let attempt = 0; attempt < 80; attempt += 1) {
          try {
            JSON.parse(await fs.readFile(paths.definition, "utf8"));
            JSON.parse(await fs.readFile(paths.currentState, "utf8"));
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
          }
          await new Promise<void>((resolve) => setImmediate(resolve));
        }
      });
    const publications = Array.from({ length: 40 }, (_, index) => {
      const stateRevision = index + 1;
      return publishAuthoritativeWorkflowFiles(
        root,
        publication(stateRevision, Math.floor(index / 10) + 1)
      );
    });
    await Promise.all([...publications, ...parseAttempts]);

    for (const harness of ["codex", "pi", "dsh"]) {
      const definition = JSON.parse(await fs.readFile(paths.definition, "utf8")) as {
        workflowRevision: number;
        workflow: { decisionPlans: { main: string } };
      };
      const currentState = JSON.parse(await fs.readFile(paths.currentState, "utf8")) as {
        workflowRevision: number;
        stateRevision: number;
      };
      expect({ harness, definition, currentState }).toMatchObject({
        harness,
        definition: {
          workflowRevision: 4,
          workflow: { decisionPlans: { main: "Authoritative revision 4" } }
        },
        currentState: { workflowRevision: 4, stateRevision: 40 }
      });
    }
    for (const filePath of [paths.definition, paths.currentState]) {
      const mode = (await fs.stat(filePath)).mode & 0o777;
      if (process.platform === "win32") expect(mode & 0o222).toBe(0);
      else expect(mode).toBe(0o400);
    }
    await expect(publishAuthoritativeWorkflowFiles(root, {
      ...publication(41, 5),
      definition: {
        ...publication(41, 5).definition,
        workflow: {
          ...workflow,
          apiKey: "sk-1234567890abcdefghijklmnop"
        } as AuthoritativeWorkflowFiles["definition"]["workflow"]
      }
    })).rejects.toThrow(/Credential/);
    expect(JSON.parse(await fs.readFile(paths.currentState, "utf8")))
      .toMatchObject({ workflowRevision: 4, stateRevision: 40 });
    if (process.platform === "win32") {
      const retainedDefinition = await fs.readFile(paths.definition, "utf8");
      const rename = vi.spyOn(fs, "rename").mockRejectedValue(
        Object.assign(new Error("injected publication failure"), { code: "EIO" })
      );
      try {
        await expect(publishAuthoritativeWorkflowFiles(root, publication(41, 5)))
          .rejects.toThrow("injected publication failure");
      } finally { rename.mockRestore(); }
      expect(await fs.readFile(paths.definition, "utf8")).toBe(retainedDefinition);
      expect((await fs.stat(paths.definition)).mode & 0o222).toBe(0);
      await publishAuthoritativeWorkflowFiles(root, publication(41, 5));
      expect(JSON.parse(await fs.readFile(paths.currentState, "utf8")))
        .toMatchObject({ workflowRevision: 5, stateRevision: 41 });
    }
  });
});
