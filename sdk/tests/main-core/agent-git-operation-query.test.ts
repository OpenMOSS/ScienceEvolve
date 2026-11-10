import { describe, expect, it, vi } from "vitest";
import { executeAgentGitTool, type AgentGitFacts } from "../../src/core/agent-git-tools.js";
import type { ControlActionEnvelope, OperationRecord } from "../../src/core/types.js";
import type { RemoteMergeSyncFact } from "../../src/core/collaboration-git/contracts.js";

function fixture(kind: OperationRecord["kind"] = "pull.merge", status: OperationRecord["status"] = "finalized") {
  const execution = { id: "original-task", ownershipEpoch: 2, agentId: "worker", purpose: "delivery" as const,
    executionBranch: "executions/original-task", worktreePath: "/tmp/original-task" };
  const repository = { owner: "team", name: "project", private: true, defaultBranch: "main",
    htmlUrl: "https://github.com/team/project", observedAt: "2026-10-09T00:00:00.000Z" };
  const base = "groups/direct-parent";
  const remote = kind === "git.push" ? { owner: repository.owner, repository: repository.name,
    ref: execution.executionBranch, sha: "a".repeat(40), status: "present", observedAt: repository.observedAt }
    : { owner: repository.owner, repository: repository.name, ownerExecutionId: execution.id,
      providerNumber: 17, htmlUrl: "https://github.com/team/project/pull/17", head: execution.executionBranch,
      headSha: "a".repeat(40), base, status: kind === "pull.merge" ? "merged" : kind === "pull.close" ? "closed" : "open",
      ...(kind === "pull.merge" ? { mergeCommitSha: "b".repeat(40) } : {}), observedAt: repository.observedAt };
  const operation: OperationRecord = { id: "original-operation", kind, status, payloadHash: "c".repeat(64),
    ownerExecutionId: execution.id, ownershipEpoch: execution.ownershipEpoch,
    expectedHead: "a".repeat(40), expectedBase: kind === "git.push" ? execution.executionBranch : base,
    ...(["observed", "finalized", "failed"].includes(status) ? { remoteFact: remote } : {}) };
  const git = { checkpointAndPush: vi.fn(), createPullRequest: vi.fn(), mergePullRequest: vi.fn(),
    reconcileMergedPullRequest: vi.fn(), observePullRequest: vi.fn(), closePullRequest: vi.fn() };
  const facts: AgentGitFacts = { pushedHeadSha: "d".repeat(40) };
  const envelope: ControlActionEnvelope = { projectId: "project", agent: execution.agentId,
    invocationId: "current-receipt-turn", callId: "query-only", stateVersion: 2, receivedAt: repository.observedAt,
    action: { tool: "git_get_operation", operationId: operation.id } };
  const synchronization: RemoteMergeSyncFact = { projectId: envelope.projectId, operationId: "exact-local-sync",
    targetBranch: base, expectedSourceHead: operation.expectedHead!, mergeCommitSha: "b".repeat(40),
    remoteHead: "b".repeat(40), localHeadBefore: "e".repeat(40), localHeadAfter: "b".repeat(40),
    temporaryRef: "refs/openfars/exact-local-sync", status: "synchronized", observedAt: repository.observedAt };
  const recordedOperation = vi.fn((): OperationRecord | undefined => operation);
  const recordedSynchronization = vi.fn((): RemoteMergeSyncFact | undefined => undefined);
  const call = () => executeAgentGitTool({ git, execution, repository, base, facts, envelope,
    recordedOperation, recordedSynchronization });
  const assertReadOnly = () => {
    expect(facts).toEqual({ pushedHeadSha: "d".repeat(40) });
    for (const method of Object.values(git)) expect(method).not.toHaveBeenCalled();
  };
  return { operation, remote, facts, call, assertReadOnly, recordedOperation, recordedSynchronization, synchronization };
}

describe("Original Agent Git operation journal query", () => {
  it.each(["missing", "foreign owner"])("classifies a %s journal lookup as non-retryable invalid input", async variant => {
    const f = fixture();
    if (variant === "missing") f.recordedOperation.mockReturnValue(undefined);
    else f.operation.ownerExecutionId = "another-task";
    await expect(f.call()).rejects.toMatchObject({ code: "GIT_INVALID_INPUT", retryable: false });
    f.assertReadOnly();
  });
  it.each(["observed", "finalized"] as const)("returns the exact created PR while its mergeability is unknown (%s)", async status => {
    const f = fixture("pull.create", status);
    f.operation.remoteFact!.status = "unknown";
    const before = structuredClone(f.operation);
    expect(await f.call()).toMatchObject({
      status: status === "finalized" ? "completed" : "remote_success_local_pending",
      localStage: status === "finalized" ? "not_required" : "journal_finalization_pending",
      remoteStage: "pull_mergeability_pending",
      operation: { remoteFact: { providerNumber: 17, status: "unknown", headSha: "a".repeat(40) } }
    });
    expect(f.operation).toEqual(before); f.assertReadOnly();
  });

  it.each(["pull.merge", "pull.close"] as const)("does not turn an unknown PR state into a successful %s", async kind => {
    const f = fixture(kind);
    f.operation.remoteFact!.status = "unknown";
    await expect(f.call()).rejects.toThrow("authoritative remote result");
    f.assertReadOnly();
  });

  it.each(["prepared", "uncertain"] as const)("returns outcome_unknown for %s without inventing failure or success", async status => {
    const f = fixture("pull.create", status);
    expect(await f.call()).toEqual({ operation: f.operation, status: "outcome_unknown", localStage: "not_required" });
    f.assertReadOnly();
  });

  it("observes a late confirmed PR from the same journal without creating another PR or binding its old head to current delivery", async () => {
    const f = fixture("pull.create", "uncertain");
    expect(await f.call()).toMatchObject({ status: "outcome_unknown" });
    Object.assign(f.operation, { status: "finalized", remoteFact: f.remote });
    const before = structuredClone(f.operation);
    for (let repeat = 0; repeat < 3; repeat += 1) expect(await f.call()).toMatchObject({
      status: "completed", operation: { remoteFact: { providerNumber: 17, headSha: "a".repeat(40), base: "groups/direct-parent" } }
    });
    expect(f.operation).toEqual(before); f.assertReadOnly();
  });

  it.each(["observed", "finalized"] as const)("retains confirmed remote merge and pending local synchronization after %s/restart", async status => {
    const f = fixture("pull.merge", status);
    expect(await f.call()).toMatchObject({ status: "remote_success_local_pending", localStage: "synchronization_pending",
      operation: { remoteFact: { status: "merged", mergeCommitSha: "b".repeat(40) } } });
    f.recordedSynchronization.mockReturnValue(f.synchronization);
    expect(await f.call()).toMatchObject({ status: status === "observed" ? "remote_success_local_pending" : "completed",
      localStage: status === "observed" ? "journal_finalization_pending" : "synchronized", localSynchronization: f.synchronization });
    f.assertReadOnly();
  });

  it.each(["git.push", "pull.create", "pull.close"] as const)("distinguishes %s journal finalization from the known remote result", async kind => {
    const f = fixture(kind, "observed");
    expect(await f.call()).toMatchObject({ status: "remote_success_local_pending", localStage: "journal_finalization_pending" });
    f.operation.status = "finalized";
    expect(await f.call()).toMatchObject({ status: "completed", localStage: "not_required" });
    f.operation.status = "failed";
    expect(await f.call()).toMatchObject({ status: "failed" }); f.assertReadOnly();
  });

  it("queries the retained task's older epoch without granting it current Git authority", async () => {
    const f = fixture(); f.operation.ownershipEpoch = 1;
    f.recordedSynchronization.mockReturnValue(f.synchronization);
    expect(await f.call()).toMatchObject({ status: "completed", operation: { ownershipEpoch: 1 } });
    expect(f.recordedSynchronization).toHaveBeenCalledWith(expect.objectContaining({ ownershipEpoch: 1 })); f.assertReadOnly();
  });

  it.each(["missing", "id", "owner", "future_epoch", "invalid_epoch", "head", "base", "kind", "remote_owner",
    "remote_repository", "remote_head", "remote_base", "remote_execution", "remote_branch", "remote_number", "merge_sha"] as const)(
    "rejects %s operation facts before any provider call", async variant => {
      const f = fixture();
      if (variant === "missing") f.recordedOperation.mockReturnValue(undefined);
      if (variant === "id") f.operation.id = "another-operation";
      if (variant === "owner") f.operation.ownerExecutionId = "another-task";
      if (variant === "future_epoch") f.operation.ownershipEpoch = 3;
      if (variant === "invalid_epoch") f.operation.ownershipEpoch = 0;
      if (variant === "head") f.operation.expectedHead = "unconfirmed";
      if (variant === "base") f.operation.expectedBase = "groups/another-parent";
      if (variant === "kind") f.operation.kind = "repository.create";
      const fields: Record<string, string> = { remote_owner: "owner", remote_repository: "repository",
        remote_head: "headSha", remote_base: "base", remote_execution: "ownerExecutionId", remote_branch: "head",
        remote_number: "providerNumber", merge_sha: "mergeCommitSha" };
      if (fields[variant]) f.operation.remoteFact![fields[variant]!] = "foreign";
      await expect(f.call()).rejects.toThrow(/original|differs|Recorded/); f.assertReadOnly();
    });

  it.each(["projectId", "targetBranch", "expectedSourceHead", "mergeCommitSha", "localHeadAfter", "remoteHead", "status"] as const)(
    "does not claim local completion from another %s proof", async field => {
      const f = fixture(); Object.assign(f.synchronization, { [field]: "foreign" });
      f.recordedSynchronization.mockReturnValue(f.synchronization);
      await expect(f.call()).rejects.toThrow("local synchronization differs"); f.assertReadOnly();
    });
});
