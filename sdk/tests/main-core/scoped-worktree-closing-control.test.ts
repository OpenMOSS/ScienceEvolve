import { promises as fs } from "node:fs";
import { spawn } from "node:child_process";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { scopedWorktreeClosingControlAuthorityFactory } from "../../src/core/scoped-worktree-closing-control.js";
import { agentGitOperationJournal } from "../../src/core/agent-git-operation-journal.js";
import { controlResultReceipts } from "../../src/core/control-result-receipts.js";
import { ControlActionService, startControlActionBridge } from "../../src/core/orchestration-control-bridge.js";
import { resolveOrchestrationControlMcpCommand, serializeInvocationControlContext } from "../../src/core/harness-runtime/runtime-support.js";
import type { ControlAction } from "../../src/core/types.js";

import { P, openedClosingFixture as fixture, cleanupClosingFixtures } from "./helpers/scoped-worktree-closing-fixture.js";

afterEach(cleanupClosingFixtures);

describe("original-Agent closing control factory", () => {
  it("retains the closing grant and immutable finish across fresh supplemental inputs", async () => {
    const f = await fixture();
    const envelope = f.envelope({ tool: "finish_task", summary: "My accepted closing finish" }, "finish");
    await f.authority.revalidate(envelope, []);
    const completion = f.db.scopedWorktreeClosingCompletion(P, f.closing.invocationId);
    const next = await f.factory({ request: f.request, turn: { ...f.turn, inputId: "closing-input:process-cleanup:1" } });
    expect(next.control.capability).not.toBe(f.authority.control.capability);
    expect(next.control.capabilityHash).not.toBe(f.authority.control.capabilityHash);
    expect(next.control.stagingPath).not.toBe(f.authority.control.stagingPath);
    await expect(f.authority.revalidate(envelope, [])).rejects.toThrow("live native invocation authority");
    await expect(next.revalidate(envelope, [])).rejects.toThrow("live native invocation authority");
    await next.revalidate({ ...envelope, capabilityHash: next.control.capabilityHash }, []);
    expect(f.db.scopedWorktreeClosingCompletion(P, f.closing.invocationId)).toEqual(completion);
    expect(completion?.capabilityHash).toBe(envelope.capabilityHash);
    expect(f.db.scopedWorktreeClosingTurns(P)[0].capabilityHash).toBe(f.closing.capabilityHash);
    expect(() => f.db.completeScopedWorktreeClosing({ ...f.closing, capabilityHash: "f".repeat(64),
      controlCapabilityHash: next.control.capabilityHash!, envelope: { ...envelope, capabilityHash: next.control.capabilityHash } })).toThrow();
  });

  it("connects real MCP, exact B publication, original request journal and separate finish without claiming native reception", async () => {
    const f = await fixture(), before = f.snapshot(), memory = await fs.readFile(f.memory, "utf8");
    const receipts = controlResultReceipts(f.db, { projectId: P, agentId: "worker", invocationId: f.closing.invocationId, session: f.session, executionContext: f.executionContext });
    const service = new ControlActionService({ projectId: P, agent: "worker", invocationId: f.closing.invocationId, stateVersion: 1,
      capability: f.capability, capabilityHash: f.authority.control.capabilityHash, stagingPath: f.authority.control.stagingPath,
      revalidate: f.authority.revalidate, execute: f.authority.execute, onResult: receipts.record });
    const bridge = await startControlActionBridge(service, f.root);
    try {
      const command = await resolveOrchestrationControlMcpCommand(), settings = { ...f.authority.control, bridgePath: bridge.endpoint.path, bridgeHost: bridge.endpoint.host, bridgePort: bridge.endpoint.port };
      const child = spawn(command.command, command.args, { cwd: f.worktree, stdio: ["pipe", "pipe", "pipe"], env: { ...process.env,
        SCIENCEEVOLVE_CONTROL_CAPABILITY: f.capability, SCIENCEEVOLVE_CONTROL_CONTEXT: serializeInvocationControlContext(settings, { projectId: P, agent: "worker", invocationId: f.closing.invocationId, kind: "worker", workspacePath: f.worktree }) } });
      let buffer = "", stderr = "";
      const awaiting = new Map<number, (message: any) => void>();
      child.stdout.on("data", chunk => {
        buffer += chunk;
        let newline: number;
        while ((newline = buffer.indexOf("\n")) >= 0) {
          const message = JSON.parse(buffer.slice(0, newline)); buffer = buffer.slice(newline + 1);
          if (typeof message.id === "number") { awaiting.get(message.id)?.(message); awaiting.delete(message.id); }
        }
      });
      child.stderr.on("data", chunk => { stderr += chunk; });
      const closed = new Promise<number | null>((resolve, reject) => { child.once("error", reject); child.once("close", resolve); });
      const operationId = `agent-closing-git-inv_closing-original-epoch-1-publish-push`;
      const actions = [{ name: "git_push", arguments: { callId: "publish", reason: "Deliver only my necessary original Memory" } },
        { name: "git_get_operation", arguments: { callId: "inspect", operationId } },
        { name: "github_create_pr", arguments: { callId: "pull", title: "My necessary original Memory", body: "Independent B after business report A", base: "groups/run-G" } },
        { name: "finish_task", arguments: { callId: "closing-finish", summary: "My independent closing output", memory: "My optional closing supplement" } }];
      const responses: any[] = [];
      for (const request of [{ jsonrpc: "2.0", id: 1, method: "tools/list" }, ...actions.map((params, index) => ({ jsonrpc: "2.0", id: index + 2, method: "tools/call", params }))]) {
        const response = new Promise<any>(resolve => awaiting.set(request.id, resolve));
        child.stdin.write(JSON.stringify(request) + "\n"); responses.push(await response);
      }
      child.stdin.end();
      expect(await closed, stderr).toBe(0);
      for (const response of responses) { expect(response.error).toBeUndefined(); expect(response.result?.isError, JSON.stringify(response)).not.toBe(true); }
      expect(responses[0].result.tools.map((tool: any) => tool.name)).not.toContain("route_next");
      const B = f.rawGit(["rev-parse", "HEAD"]); expect(B).not.toBe(f.A);
      expect(f.rawGit(["rev-parse", "refs/heads/executions/original"], f.remote)).toBe(B);
      expect(f.rawGit(["diff", "--name-only", f.A, B])).toBe("agent-memory/worker/Memory.md");
      expect(f.snapshot()).toEqual(before); expect(await fs.readFile(f.memory, "utf8")).toBe(memory);
      expect(f.db.scopedWorktreeClosingOperations(P, f.closing.invocationId)).toMatchObject([{ kind: "git.push", expectedHead: B, status: "finalized" }, { kind: "pull.create", expectedHead: B, status: "finalized" }]);
      expect(agentGitOperationJournal(f.db, P).recordedRequest(operationId)).toMatchObject({ invocationId: f.closing.invocationId,
        action: { tool: "git_push", reason: actions[0].arguments.reason }, nativeBinding: { invocationId: f.closing.invocationId, session: f.session } });
      expect(f.db.scopedWorktreeClosingTurns(P)[0]?.completion).toMatchObject({ summary: "My independent closing output", memory: "My optional closing supplement" });
      expect(f.db.pendingControlResultEvents(P, "worker")).toHaveLength(4);
      expect(f.db.eventsAfter(P).filter(event => event.type === "control.result.received")).toEqual([]);
      const output = responses[1].result.content[0].text;
      const native = { invocationId: f.closing.invocationId, harnessId: "pi", sourceType: "fixture-visible-event", eventId: "native-start",
        kind: "tool.started", tool: { callId: "native-call", name: "git_push", server: "openfars-resident-control", toolType: "mcp", input: actions[0].arguments } };
      receipts.observeNative(native);
      receipts.observeNative({ ...native, invocationId: "another-turn", kind: "tool.completed", eventId: "wrong", tool: { ...native.tool, outputPreview: output } });
      expect(f.db.pendingControlResultEvents(P, "worker")).toHaveLength(4);
      receipts.observeNative({ ...native, kind: "tool.completed", eventId: "native-complete", tool: { ...native.tool, outputPreview: output } });
      expect(f.db.pendingControlResultEvents(P, "worker")).toHaveLength(3);
      expect(f.db.scopedWorktreeClosingCandidates(P)).toHaveLength(1);
    } finally { service.revoke(); await bridge.close(); }
  });

  it.each(["capability", "invocation", "agent", "epoch", "manifest", "group", "worktree", "runtime", "session", "missing-scope"])("rejects changed %s before any provider operation", async fault => {
    const f = await fixture(), request = structuredClone(f.request);
    if (fault === "capability") expect(() => scopedWorktreeClosingControlAuthorityFactory({ ...f.options, capability: "replacement" })).toThrow("reserved capability");
    else {
      if (fault === "invocation") request.invocationId = "another";
      if (fault === "agent") request.agent = "another";
      if (fault === "epoch") request.executionContext = { ...request.executionContext, ownershipEpoch: 2 } as any;
      if (fault === "manifest") request.worktreeClosing!.paths = ["workspace/other.txt"];
      if (fault === "group") request.executionContext = { ...request.executionContext, groupRunId: "another" } as any;
      if (fault === "worktree") request.workspacePath = f.projectPath;
      if (fault === "runtime") request.runtimePath = path.join(f.projectPath, "runtime", "another");
      if (fault === "session") request.project.agentSessions!.worker!.nativeId = path.join(f.root, "another-session.jsonl");
      if (fault === "missing-scope") delete request.worktreeClosing;
      await expect(f.factory({ request, turn: f.turn })).rejects.toThrow();
    }
    expect(f.provider.observeRef).not.toHaveBeenCalled(); expect(f.provider.openPullRequest).not.toHaveBeenCalled();
  });

  it.each(["git_get_operation", "git_reconcile_push"] as const)("refuses another operation through %s without provider access", async tool => {
    const f = await fixture(); await expect(f.run({ tool, operationId: "original-business-operation" })).rejects.toThrow("only this invocation");
    expect(f.provider.observeRef).not.toHaveBeenCalled();
  });

  it("requires its own explicit confirmed B, freshens the clean checkpoint after Agent reading time and keeps the exact request on replay", async () => {
    const f = await fixture(), pull: ControlAction = { tool: "github_create_pr", title: "Own B", body: "Actual necessary Memory", base: "groups/run-G" };
    await expect(f.run(pull, "pull")).rejects.toThrow("confirmed, exact clean B");
    await f.run({ tool: "git_push", reason: "Deliver my necessary Memory" }, "publish");
    f.advance(65_000); await f.run(pull, "pull"); await f.run(pull, "pull");
    expect(f.db.scopedWorktreeClosingCheckpoint(P, f.closing.invocationId)?.observedAt).toBe(f.time());
    expect(f.db.eventsAfter(P).filter(event => event.type === "agent.git.operation.requested")).toHaveLength(2);
    expect(f.db.scopedAgentReport(P, "original", 1)?.headSha).toBe(f.A);
  });

  it("binds bounded long-call closing IDs to the original request and separate push/create/merge journal", async () => {
    const f = await fixture({ originalStatus: "completed", businessDelivery: true, nextArrival: true }), before = f.snapshot();
    const suffix = "x".repeat(135), push = `publish-${suffix}`, create = `create-${suffix}`, merge = `merge-${suffix}`;
    await f.run({ tool: "git_push", reason: "Deliver only original necessary Memory" }, push);
    const pull: ControlAction = { tool: "github_create_pr", title: "Own Memory B", body: "Preserve immutable A", base: "groups/run-G" };
    await f.run(pull, create); await f.run(pull, create);
    await f.run({ tool: "github_merge_pr", providerNumber: 11, reason: "Deliver my independently published B" }, merge);
    const operations = f.db.scopedWorktreeClosingOperations(P, f.closing.invocationId);
    expect(operations.map(operation => operation.kind)).toEqual(["git.push", "pull.create", "pull.merge"]);
    expect(operations.every(operation => /^[A-Za-z0-9][A-Za-z0-9._-]{0,159}$/.test(operation.id))).toBe(true);
    for (const operation of operations) {
      expect(agentGitOperationJournal(f.db, P).recordedRequest(operation.id)).toMatchObject({
        invocationId: f.closing.invocationId, executionId: "original", ownershipEpoch: 1,
        nativeBinding: { session: f.session, invocationId: f.closing.invocationId } });
    }
    const B = f.rawGit(["rev-parse", "HEAD"]);
    expect(f.rawGit(["diff", "--name-only", f.A, B])).toBe("agent-memory/worker/Memory.md");
    expect(operations.every(operation => operation.expectedHead === B && operation.status === "finalized")).toBe(true);
    expect(f.rawGit(["rev-parse", "groups/run-G"])).toBe(f.rawGit(["rev-parse", "refs/heads/groups/run-G"], f.remote));
    expect(f.db.eventsAfter(P).filter(event => event.type === "agent.git.operation.requested")).toHaveLength(3);
    expect(f.snapshot()).toEqual(before);
  }, process.platform === "win32" ? 80_000 : 20_000);

  it.each(["pause", "cancel", "native-revoked", "stop", "wrong-capability", "empty-reason", "hidden-route", "historical"])("revokes or rejects %s before Git or completion", async fault => {
    const f = await fixture(), before = f.snapshot(); let action: ControlAction = { tool: "git_push", reason: "My necessary Memory" };
    if (fault === "pause") { const raw = new DatabaseSync(f.databasePath); try { raw.prepare("UPDATE project_heads SET frozen = 1 WHERE project_id = ?").run(P); } finally { raw.close(); } }
    if (fault === "cancel") f.db.appendEvent({ projectId: P, requestId: "cancel", type: "project.cancellation.requested", payload: { source: "user" } });
    if (fault === "native-revoked") f.revoke();
    if (fault === "stop") f.db.stopScopedWorktreeClosingTurn({ ...f.closing, residentStopConfirmed: true, evidence: { nativeProcessScanCleared: true } });
    if (fault === "empty-reason") action = { tool: "git_push", reason: " " };
    if (fault === "hidden-route") action = { tool: "route_next", next: "worker", reason: "hidden" } as any;
    if (fault === "historical") action = { tool: "git_reconcile_push", operationId: "old", historical: true };
    const envelope = f.envelope(action); if (fault === "wrong-capability") envelope.capabilityHash = "a".repeat(64);
    await expect(f.authority.execute!(envelope, new AbortController().signal)).rejects.toThrow();
    expect(f.provider.observeRef).not.toHaveBeenCalled(); expect(f.rawGit(["rev-parse", "HEAD"])).toBe(f.A); expect(f.snapshot()).toEqual(before);
  });

  it.each(["wrong-base", "extra-file", "late-memory"])("rejects %s after publishing B without recording another delivery", async fault => {
    const f = await fixture(); await f.run({ tool: "git_push", reason: "My necessary Memory" }, "publish");
    if (fault === "extra-file") await fs.writeFile(path.join(f.worktree, "unrelated.txt"), "Outside grant\n");
    if (fault === "late-memory") await fs.appendFile(f.memory, "Agent's later unpublished change\n");
    await expect(f.run({ tool: "github_create_pr", title: "Own B", body: "Own Memory", base: fault === "wrong-base" ? "main" : "groups/run-G" }, "pull")).rejects.toThrow();
    expect(f.provider.openPullRequest).not.toHaveBeenCalled();
    expect(f.db.scopedWorktreeClosingOperations(P, f.closing.invocationId)).toHaveLength(1);
  });

  it.each(["github_merge_pr", "github_close_pr"] as const)("cannot borrow A's historical merged PR through %s", async tool => {
    const f = await fixture(); await f.run({ tool: "git_push", reason: "Deliver my independent B" }, "publish");
    vi.spyOn(f.options.git, "observePullRequest").mockResolvedValue({ id: "old-A", providerNumber: 3, owner: "example", repository: "project",
      ownerExecutionId: "original", head: "executions/original", headSha: f.A, base: "groups/run-G", status: "merged", mergeCommitSha: "d".repeat(40),
      htmlUrl: "https://github.com/example/project/pull/3", checks: [], observedAt: f.time() });
    const merge = vi.spyOn(f.options.git, "mergePullRequest"), close = vi.spyOn(f.options.git, "closePullRequest");
    await expect(f.run({ tool, providerNumber: 3, reason: "Original Agent's explicit inspection" })).rejects.toThrow("confirmed current head");
    expect(merge).not.toHaveBeenCalled(); expect(close).not.toHaveBeenCalled();
    expect(f.db.scopedWorktreeClosingOperations(P, f.closing.invocationId)).toHaveLength(1);
  });

  it("carries original invocation cancellation into an in-flight Git request", async () => {
    const f = await fixture(), parent = new AbortController(), tool = new AbortController();
    const factory = scopedWorktreeClosingControlAuthorityFactory({ ...f.options, signal: parent.signal });
    const authority = await factory({ request: f.request, turn: f.turn });
    const git = vi.spyOn(f.options.git, "checkpointAndPush").mockImplementation(async request => {
      parent.abort(Error("Original invocation stopped during Git IO")); request.signal!.throwIfAborted(); throw Error("unreachable");
    });
    await expect(authority.execute!({ ...f.envelope({ tool: "git_push", reason: "My necessary Memory" }),
      capabilityHash: authority.control.capabilityHash }, tool.signal)).rejects.toThrow("Original invocation stopped");
    expect(git).toHaveBeenCalledOnce(); expect(tool.signal.aborted).toBe(false); expect(f.rawGit(["rev-parse", "HEAD"])).toBe(f.A);
  });

  it("restores only accepted separate finish files after materialization failure and refuses replacement", async () => {
    const f = await fixture(), before = f.snapshot();
    const envelope = f.envelope({ tool: "finish_task", summary: "My actual independent output", memory: "My supplement" }, "finish");
    const save = vi.spyOn(f.storage, "saveScopedWorktreeClosingCompletion").mockRejectedValueOnce(Error("fixture materialization failed"));
    await expect(f.authority.revalidate(envelope, [])).rejects.toThrow("materialization failed");
    expect(f.db.scopedWorktreeClosingTurns(P)[0]?.completion?.memory).toBe("My supplement");
    save.mockRestore(); await f.authority.revalidate(envelope, []);
    const completion = JSON.parse(await fs.readFile(path.join(f.closing.runtimePath, "worktree-closing", "finish.json"), "utf8"));
    expect(completion.memory).toBe("My supplement"); expect(f.snapshot()).toEqual(before);
    await expect(f.authority.revalidate({ ...envelope, action: { tool: "finish_task", memory: "Replacement" } }, [])).rejects.toThrow();
  });
});
