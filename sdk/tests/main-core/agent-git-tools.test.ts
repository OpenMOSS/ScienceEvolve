import { describe, expect, it, vi } from "vitest";
import { agentGitOperationId, executeAgentGitTool, type AgentGitFacts } from "../../src/core/agent-git-tools.js";
import type { ControlAction, ControlActionEnvelope, OperationRecord } from "../../src/core/types.js";
import type { GitExecutionAuthority, GitGroupFinalAuthority, GitHubPullRequestFact, GitHubRepositoryFact } from "../../src/core/collaboration-git/contracts.js";

const execution: GitExecutionAuthority = { id: "original-execution", agentId: "worker",
  groupRunId: "original-group", purpose: "delivery", ownershipEpoch: 2,
  executionBranch: "executions/original-execution", worktreePath: "/tmp/original-agent" };
const repository: GitHubRepositoryFact = { owner: "fixture-owner", name: "retained-project",
  private: true, defaultBranch: "main", htmlUrl: "https://github.example/retained-project", observedAt: "2026-10-02T00:00:00Z" };
const targetBase = "groups/original-group" as const;
function fixture(status: GitHubPullRequestFact["status"], owner: GitExecutionAuthority | GitGroupFinalAuthority = execution, base = targetBase as string) {
  const pull: GitHubPullRequestFact = { id: "retained-pull", providerNumber: 71,
    owner: repository.owner, repository: repository.name, head: owner.executionBranch,
    base, ownerExecutionId: owner.id, headSha: "b".repeat(40),
    htmlUrl: "https://github.example/pulls/71", status, observedAt: "2026-10-02T00:00:00Z",
    ...(status === "merged" ? { mergeCommitSha: "c".repeat(40) } : {}) };
  const git = { checkpointAndPush: vi.fn(), reconcilePushOperation: vi.fn(), createPullRequest: vi.fn(), mergePullRequest: vi.fn(),
    prepareConflictResolution: vi.fn(), closePullRequest: vi.fn(), observePullRequest: vi.fn(async () => pull),
    observePullRequestForExecution: vi.fn(async () => pull),
    reconcileMergedPullRequest: vi.fn(async (request: { operationId: string }) => ({ ...pull,
      localSynchronization: { projectId: "project", operationId: request.operationId,
        targetBranch: targetBase, temporaryRef: "refs/openfars/retained", expectedSourceHead: pull.headSha,
        mergeCommitSha: pull.mergeCommitSha, remoteHead: pull.mergeCommitSha,
        localHeadBefore: "a".repeat(40), localHeadAfter: pull.mergeCommitSha,
        status: "synchronized" as const, observedAt: "2026-10-02T00:00:00Z" } })) };
  const facts: AgentGitFacts = {};
  const call = (action: ControlAction) => executeAgentGitTool({ git, repository, execution: owner,
    base, facts, envelope: { projectId: "project", agent: "worker", invocationId: "native-turn",
      callId: `native-${action.tool}`, stateVersion: 1, receivedAt: "2026-10-02T00:00:00Z", action } as ControlActionEnvelope });
  return { pull, git, facts, call };
}

describe("Agent-owned retained PR tools", () => {
  it.each(["push", "create", "merge", "close"] as const)("bounds a new ordinary scoped %s marker without losing its request identity", async suffix => {
    const owner: GitExecutionAuthority = { ...execution, id: `scoped-exec-${"f".repeat(64)}` };
    const envelope = { projectId: "project", invocationId: "native-turn", callId: `create-pr-${"f".repeat(64)}-epoch3-2` };
    const input = { execution: owner, envelope };
    const marker = await agentGitOperationId(input, suffix);
    expect(marker).toMatch(/^[A-Za-z0-9][A-Za-z0-9._-]{0,159}$/);
    expect((await agentGitOperationId({ ...input, envelope: { ...envelope, invocationId: "same-task-next-native-turn" } }, suffix))).toBe(marker);
    const other = await Promise.all([
      { ...input, envelope: { ...envelope, projectId: "another-project" } },
      { ...input, envelope: { ...envelope, callId: envelope.callId + "-new-call" } },
      { ...input, execution: { ...owner, ownershipEpoch: 3 } },
      { ...input, execution: { ...owner, id: owner.id + "-another-owner" } }
    ].map(value => agentGitOperationId(value, suffix)));
    expect(new Set([marker, ...other]).size).toBe(5);
  });

  it.each(["request", "operation"] as const)("preserves a recorded oversized ordinary %s marker instead of manufacturing a fresh request", async retained => {
    const owner: GitExecutionAuthority = { ...execution, id: `scoped-exec-${"f".repeat(64)}` };
    const envelope = { projectId: "project", invocationId: "native-turn", callId: `create-pr-${"f".repeat(64)}-epoch3-2` };
    const legacy = `agent-git-${owner.id}-epoch-2-${envelope.callId}-create`;
    const journal = retained === "request"
      ? { recordedRequest: vi.fn(id => id === legacy ? { operationId: legacy } as any : undefined) }
      : { recordedOperation: vi.fn(id => id === legacy ? { id: legacy, status: "uncertain" } as any : undefined) };
    expect((await agentGitOperationId({ execution: owner, envelope, ...journal }, "create"))).toBe(legacy);
  });

  it("preserves a matching completed merge when reconciling an earlier push of the same head", async () => {
    const f = fixture("merged");
    await f.call({ tool: "github_merge_pr", providerNumber: f.pull.providerNumber });
    const merged = f.facts.merged;
    f.git.reconcilePushOperation.mockResolvedValue({ status: "confirmed", operation: { id: "first-push", kind: "git.push",
      status: "finalized", ownerExecutionId: execution.id, ownershipEpoch: execution.ownershipEpoch,
      expectedHead: f.pull.headSha, expectedBase: execution.executionBranch, payloadHash: "a".repeat(64) },
      remote: { owner: repository.owner, repository: repository.name, ref: execution.executionBranch,
        status: "present", sha: f.pull.headSha, observedAt: repository.observedAt } });
    await expect(f.call({ tool: "git_reconcile_push", operationId: "first-push", retry: false })).resolves.toMatchObject({ status: "confirmed" });
    expect(f.facts.merged).toBe(merged);
    expect(f.git.reconcileMergedPullRequest).toHaveBeenCalledOnce();
    expect(f.git.checkpointAndPush).not.toHaveBeenCalled();
  });
  it("keeps oversized closing IDs stable and distinct for every original request identity", async () => {
    const invocationId = `inv_${"6".repeat(32)}`;
    const owner: GitExecutionAuthority = { ...execution, id: `scoped-exec-${"3".repeat(64)}`,
      restrictedClosing: { invocationId, capabilityHash: "c".repeat(64),
        scope: { kind: "completed-leftovers", reportHeadSha: "a".repeat(40), paths: ["agent-memory/worker/Memory.md"] } } };
    const envelope = { projectId: "project", invocationId, callId: "checker-close-mem-create-pr-642e9065-1" };
    const input = { execution: owner, envelope }, first = await agentGitOperationId(input, "create");
    expect(first).toMatch(/^[A-Za-z0-9][A-Za-z0-9._-]{0,159}$/);
    expect((await agentGitOperationId(structuredClone(input), "create"))).toBe(first);
    const variants = [
      { ...input, envelope: { ...envelope, projectId: "other-project" } },
      { ...input, envelope: { ...envelope, callId: `${envelope.callId}-retry` } },
      { ...input, execution: { ...owner, id: `${owner.id}-other` } },
      { ...input, execution: { ...owner, ownershipEpoch: 3 } },
      { ...input, execution: { ...owner, restrictedClosing: { ...owner.restrictedClosing!, invocationId: `inv_${"7".repeat(32)}` } } }
    ];
    const ids = [first, ...await Promise.all(variants.map(value => agentGitOperationId(value, "create"))), await agentGitOperationId(input, "merge")];
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every(id => /^[A-Za-z0-9][A-Za-z0-9._-]{0,159}$/.test(id))).toBe(true);
  });

  it.each(["request", "operation"] as const)("keeps an already recorded oversized closing %s under its exact original ID", async retained => {
    const invocationId = `inv_${"6".repeat(32)}`, callId = "checker-close-mem-create-pr-642e9065-1";
    const owner: GitExecutionAuthority = { ...execution, id: `scoped-exec-${"3".repeat(64)}`,
      restrictedClosing: { invocationId, capabilityHash: "c".repeat(64),
        scope: { kind: "completed-leftovers", reportHeadSha: "a".repeat(40), paths: ["agent-memory/worker/Memory.md"] } } };
    const legacy = `agent-closing-git-${invocationId}-${owner.id}-epoch-2-${callId}-create`;
    const f = fixture("open", owner), create = f.git.createPullRequest.mockImplementation(async () => {
      throw Error("Original oversized provider request remains rejected");
    });
    const journal = retained === "request"
      ? { recordedRequest: vi.fn(id => id === legacy ? { operationId: legacy } as any : undefined) }
      : { recordedOperation: vi.fn(id => id === legacy ? { id: legacy, status: "uncertain" } as any : undefined) };
    await expect(executeAgentGitTool({ git: f.git, repository, execution: owner, base: targetBase,
      facts: { pushedHeadSha: f.pull.headSha }, controlCapabilityHash: "c".repeat(64), ...journal,
      envelope: { projectId: "project", agent: "worker", invocationId, callId, capabilityHash: "c".repeat(64), stateVersion: 2,
        receivedAt: repository.observedAt, action: { tool: "github_create_pr", base: targetBase, title: "My B", body: "Keep original A" } } })).rejects.toThrow("Original oversized provider request");
    expect(create).toHaveBeenCalledOnce();
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ operationId: legacy }));
  });

  it.each(["invocation", "capability", "unsafe-invocation"])("rejects a closing %s mismatch before any Git or request callback", async mismatch => {
    const f = fixture("open"), recordRequest = vi.fn(), invocationId = mismatch === "unsafe-invocation" ? "../closing" : "native-turn";
    const authority: GitExecutionAuthority = { ...execution, restrictedClosing: { invocationId, capabilityHash: "c".repeat(64),
      scope: { kind: "bound-report-memory", reportHeadSha: "a".repeat(40), paths: ["agent-memory/worker/Memory.md"] } } };
    await expect(executeAgentGitTool({ git: f.git, repository, execution: authority, base: targetBase, facts: {}, recordRequest,
      controlCapabilityHash: "c".repeat(64),
      envelope: { projectId: "project", agent: "worker", invocationId: mismatch === "invocation" ? "other-turn" : invocationId,
        capabilityHash: mismatch === "capability" ? "d".repeat(64) : "c".repeat(64), callId: "push", stateVersion: 2,
        receivedAt: repository.observedAt, action: { tool: "git_push", reason: "Save my necessary Memory" } } })).rejects.toThrow("exact native invocation capability");
    expect(recordRequest).not.toHaveBeenCalled();
    for (const callback of Object.values(f.git)) expect(callback).not.toHaveBeenCalled();
  });
  it.each(["confirmed", "unconfirmed", "failed", "operationId", "kind", "owner", "epoch", "branch", "invalid_head",
    "pending_receipt", "remote_owner", "remote_repository", "remote_ref", "remote_head"] as const)(
    "validates retained push tool facts before allowing PR publication (%s)", async (mode) => {
      const { git, facts, call, pull } = fixture("open");
      const operation: OperationRecord = { id: "scoped-checkpoint-original-execution-epoch-2", kind: "git.push",
        ownerExecutionId: execution.id, ownershipEpoch: execution.ownershipEpoch, expectedBase: execution.executionBranch,
        expectedHead: pull.headSha, payloadHash: "a".repeat(64), status: "finalized" };
      const remote = { owner: repository.owner, repository: repository.name, ref: execution.executionBranch,
        status: "present" as const, sha: pull.headSha, observedAt: repository.observedAt };
      const result = { status: "confirmed", operation, remote };
      if (mode === "unconfirmed" || mode === "failed") {
        result.status = mode;
        operation.status = mode === "failed" ? "failed" : "uncertain";
      }
      if (mode === "operationId") operation.id = "foreign-operation";
      if (mode === "kind") operation.kind = "pull.merge";
      if (mode === "owner") operation.ownerExecutionId = "foreign";
      if (mode === "epoch") operation.ownershipEpoch = 3;
      if (mode === "branch") operation.expectedBase = "executions/foreign";
      if (mode === "invalid_head") operation.expectedHead = "invalid";
      if (mode === "pending_receipt") operation.status = "uncertain";
      if (mode === "remote_owner") remote.owner = "foreign";
      if (mode === "remote_repository") remote.repository = "foreign";
      if (mode === "remote_ref") remote.ref = "executions/foreign";
      if (mode === "remote_head") remote.sha = "c".repeat(40);
      git.reconcilePushOperation.mockResolvedValue(result);
      const action: ControlAction = { tool: "git_reconcile_push", operationId: "scoped-checkpoint-original-execution-epoch-2", retry: false };
      if (["confirmed", "unconfirmed", "failed"].includes(mode)) {
        expect(await call(action)).toBe(result);
        expect(facts.pushedHeadSha).toBe(mode === "confirmed" ? pull.headSha : undefined);
        expect(facts.pushResult).toBeUndefined();
      } else await expect(call(action)).rejects.toThrow(/Retained push tool/);
      expect(git.reconcilePushOperation).toHaveBeenCalledWith(expect.objectContaining({ operationId: action.operationId,
        execution, ownershipEpoch: 2, repository, retry: false }));
      if (mode === "confirmed") {
        git.createPullRequest.mockResolvedValue(pull);
        expect(await call({ tool: "github_create_pr", base: targetBase, title: "Retained result", body: "Original Agent result" })).toBe(pull);
      } else {
        await expect(call({ tool: "github_create_pr", base: targetBase, title: "Unverified", body: "No proof" })).rejects.toThrow("confirmed pushed head");
        expect(git.createPullRequest).not.toHaveBeenCalled();
      }
      expect(git.checkpointAndPush).not.toHaveBeenCalled();
      expect(git.mergePullRequest).not.toHaveBeenCalled();
    });

  it.each(["confirmed", "missing", "unknown", "sha", "owner", "repository", "branch", "epoch"] as const)(
    "verifies an unchanged canonical publication from actual remote facts (%s)", async (variant) => {
      const owner: GitExecutionAuthority = { ...execution, purpose: "final-integration",
        executionBranch: `groups/${execution.groupRunId}` };
      const { git, facts, pull, call } = fixture("open", owner, "main");
      const checkpoint = { projectId: "project", executionId: owner.id, ownershipEpoch: owner.ownershipEpoch,
        branch: owner.executionBranch, worktreePath: owner.worktreePath, head: pull.headSha!,
        commitSha: pull.headSha!, changed: false, retained: true as const, observedAt: repository.observedAt };
      const remote = { owner: repository.owner, repository: repository.name, ref: owner.executionBranch,
        sha: checkpoint.commitSha, status: "present" as "present" | "unknown", observedAt: repository.observedAt };
      if (variant === "unknown") remote.status = "unknown";
      if (variant === "sha") remote.sha = "c".repeat(40);
      if (variant === "owner") remote.owner = "foreign";
      if (variant === "repository") remote.repository = "foreign";
      if (variant === "branch") remote.ref = "groups/foreign";
      if (variant === "epoch") checkpoint.ownershipEpoch += 1;
      git.checkpointAndPush.mockResolvedValue({ checkpoint, ...(variant === "missing" ? {} : { remote }) });
      const result = await call({ tool: "git_push", reason: "Verify my already-published group head" });
      expect(result).toMatchObject({ status: variant === "confirmed" ? "already_published" : "push_unconfirmed", checkpoint });
      expect(git.createPullRequest).not.toHaveBeenCalled();
      expect(git.mergePullRequest).not.toHaveBeenCalled();
      if (variant === "confirmed") {
        expect(facts.pushedHeadSha).toBe(checkpoint.commitSha);
        git.createPullRequest.mockResolvedValue(pull);
        expect(await call({ tool: "github_create_pr", base: "main", title: "Existing group delivery", body: "No extra business commit" })).toBe(pull);
      } else {
        expect(facts.pushedHeadSha).toBeUndefined();
        await expect(call({ tool: "github_create_pr", base: "main", title: "Unverified", body: "Unverified" })).rejects.toThrow("confirmed pushed head");
        expect(git.createPullRequest).not.toHaveBeenCalled();
      }
    });

  it("does not use canonical publication semantics for an unchanged member branch", async () => {
    const { git, facts, call } = fixture("open");
    const checkpoint = { projectId: "project", executionId: execution.id, ownershipEpoch: execution.ownershipEpoch,
      branch: execution.executionBranch, worktreePath: execution.worktreePath, head: "b".repeat(40), commitSha: "b".repeat(40),
      changed: false, retained: true as const, observedAt: repository.observedAt };
    git.checkpointAndPush.mockResolvedValue({ checkpoint, remote: { owner: repository.owner, repository: repository.name,
      ref: execution.executionBranch, sha: checkpoint.commitSha, status: "present", observedAt: repository.observedAt } });
    expect(await call({ tool: "git_push" })).toMatchObject({ status: "not_committed" });
    expect(facts.pushedHeadSha).toBeUndefined();
  });

  it.each(["closed", "unknown", "open"] as const)(
    "returns an explicitly requested close result of %s without completing or publishing", async (status) => {
      const { pull, git, facts, call } = fixture("conflicted");
      const result = { ...pull, status };
      git.closePullRequest.mockResolvedValue(result);
      await call({ tool: "github_get_pr", providerNumber: 71 });
      expect(git.closePullRequest).not.toHaveBeenCalled();
      expect(await call({ tool: "github_close_pr", providerNumber: 71, reason: "I choose a separate group repair" })).toBe(result);
      expect(git.closePullRequest).toHaveBeenCalledWith(expect.objectContaining({
        execution, ownershipEpoch: 2, providerNumber: 71, expectedHead: pull.headSha,
        expectedBase: targetBase, operationId: expect.stringContaining("-close") }));
      expect(facts.pullRequest).toBe(result);
      expect(facts.merged).toBeUndefined();
      expect(git.checkpointAndPush).not.toHaveBeenCalled();
      expect(git.createPullRequest).not.toHaveBeenCalled();
      expect(git.mergePullRequest).not.toHaveBeenCalled();
      expect(git.reconcileMergedPullRequest).not.toHaveBeenCalled();
    });

  it.each(["merged", "closed"] as const)("observes an already %s PR without another mutation or synchronization", async (status) => {
    const { pull, git, facts, call } = fixture(status);
    expect(await call({ tool: "github_close_pr", providerNumber: 71 })).toBe(pull);
    expect(facts.pullRequest).toBe(pull);
    expect(facts.merged).toBeUndefined();
    expect(git.closePullRequest).not.toHaveBeenCalled();
    expect(git.reconcileMergedPullRequest).not.toHaveBeenCalled();
  });

  it("returns the provider close failure without fabricating a closed PR", async () => {
    const { pull, git, facts, call } = fixture("conflicted");
    const error = new Error("GitHub rejected the owning Agent's close request");
    git.closePullRequest.mockRejectedValue(error);
    await expect(call({ tool: "github_close_pr", providerNumber: 71 })).rejects.toBe(error);
    expect(facts.pullRequest).toBe(pull);
    expect(pull.status).toBe("conflicted");
    expect(facts.merged).toBeUndefined();
  });

  it.each(["ownerExecutionId", "head", "base", "owner", "repository", "headSha", "providerNumber"] as const)(
    "refuses to close an observed PR with a different %s", async (field) => {
      const { pull, git, facts, call } = fixture("open");
      if (field === "providerNumber") pull[field] = 72;
      else pull[field] = field === "headSha" ? "invalid" : "foreign";
      await expect(call({ tool: "github_close_pr", providerNumber: 71 })).rejects.toThrow();
      expect(git.closePullRequest).not.toHaveBeenCalled();
      expect(facts).toEqual({});
    });

  it("lets a canonical final Agent close only its assigned group-to-main PR", async () => {
    const owner: GitGroupFinalAuthority = { id: "final-owner", groupRunId: "original-group", ownershipEpoch: 3,
      purpose: "group-final-integration", executionBranch: "groups/original-group" };
    const { pull, git, call } = fixture("conflicted", owner, "main");
    git.closePullRequest.mockResolvedValue({ ...pull, status: "closed" });
    await expect(call({ tool: "github_close_pr", providerNumber: 71 })).resolves.toMatchObject({ status: "closed" });
    expect(git.closePullRequest).toHaveBeenCalledWith(expect.objectContaining({ execution: owner,
      ownershipEpoch: 3, expectedBase: "main", expectedHead: pull.headSha }));
    expect(git.checkpointAndPush).not.toHaveBeenCalled();
  });

  it.each(["not_committed", "push_unconfirmed", "pushed"] as const)(
    "returns %s checkpoint/provider facts directly to the requesting Agent", async (status) => {
      const { git, facts, call } = fixture("open");
      const checkpoint = { projectId: "project", executionId: execution.id, ownershipEpoch: 2,
        branch: execution.executionBranch, worktreePath: execution.worktreePath,
        head: "b".repeat(40), commitSha: "b".repeat(40), changed: status !== "not_committed",
        retained: true as const, observedAt: "2026-10-02T00:00:00Z" };
      const remote = status === "not_committed" ? undefined : { owner: repository.owner,
        repository: repository.name, ref: execution.executionBranch, sha: checkpoint.commitSha,
        status: status === "pushed" ? "present" as const : "unknown" as const,
        observedAt: "2026-10-02T00:00:00Z" };
      git.checkpointAndPush.mockResolvedValue({ checkpoint, ...(remote ? { remote } : {}) });
      expect(git.checkpointAndPush).not.toHaveBeenCalled();
      const result = await call({ tool: "git_push", reason: "Inspect my actual publication result" });
      expect(result).toMatchObject({ status, checkpoint });
      if (remote) expect(result).toHaveProperty("remote", remote);
      expect(facts.pushResult).toEqual(result);
      expect(facts.pushedHeadSha).toBe(status === "pushed" ? checkpoint.commitSha : undefined);
      expect(git.checkpointAndPush).toHaveBeenCalledOnce();
      expect(git.createPullRequest).not.toHaveBeenCalled();
      expect(git.mergePullRequest).not.toHaveBeenCalled();
      if (status !== "pushed") {
        await expect(call({ tool: "github_create_pr", base: targetBase, title: "Unverified", body: "Unverified" }))
          .rejects.toThrow("confirmed pushed head");
        expect(git.createPullRequest).not.toHaveBeenCalled();
      }
    });

  it.each(["open", "unknown", "conflicted", "merged"] as const)(
    "returns the actual %s PR to its original Agent without publishing again", async (status) => {
      const { pull, git, facts, call } = fixture(status);
      expect(git.observePullRequest).not.toHaveBeenCalled();
      expect(await call({ tool: "github_get_pr", providerNumber: 71 })).toBe(pull);
      expect(facts).toMatchObject({ pullRequest: pull });
      expect(facts.pushedHeadSha).toBeUndefined();
      expect(facts.merged).toBeUndefined();
      expect(git.checkpointAndPush).not.toHaveBeenCalled();
      expect(git.createPullRequest).not.toHaveBeenCalled();
      expect(git.mergePullRequest).not.toHaveBeenCalled();
    expect(git.reconcileMergedPullRequest).not.toHaveBeenCalled();
  });

  it("does not authorize a queried historical PR head when no current push is confirmed", async () => {
    const { pull, facts, call } = fixture("merged");
    expect(await call({ tool: "github_get_pr", providerNumber: pull.providerNumber })).toBe(pull);
    expect(facts.pushedHeadSha).toBeUndefined();
    await expect(call({ tool: "github_create_pr", base: targetBase, title: "Must push first", body: "No inferred head" }))
      .rejects.toThrow("confirmed pushed head");
  });

  it("lets an Agent inspect its older PR after the branch head advances without replacing current facts", async () => {
    const { pull, git, facts, call } = fixture("merged");
    facts.pushedHeadSha = "d".repeat(40);
    const older = { ...pull, headSha: "b".repeat(40) };
    git.observePullRequest.mockResolvedValue(older);
    expect(await call({ tool: "github_get_pr", providerNumber: older.providerNumber })).toBe(older);
    expect(facts).toMatchObject({ pushedHeadSha: "d".repeat(40), pullRequest: older });
    await expect(call({ tool: "github_merge_pr", providerNumber: older.providerNumber }))
      .rejects.toThrow("confirmed current head");
    expect(git.mergePullRequest).not.toHaveBeenCalled();
    expect(git.reconcileMergedPullRequest).not.toHaveBeenCalled();
  });

  it("keeps the current merged delivery when the Agent reads a different historical PR", async () => {
    const { pull, git, facts, call } = fixture("merged");
    const current = { ...pull, id: "current-pull", providerNumber: 72, headSha: "d".repeat(40) };
    facts.pushedHeadSha = current.headSha;
    facts.pullRequest = current;
    facts.merged = current;
    git.observePullRequest.mockResolvedValue(pull);
    expect(await call({ tool: "github_get_pr", providerNumber: pull.providerNumber })).toBe(pull);
    expect(facts.pullRequest).toBe(current);
    expect(facts.merged).toBe(current);
    expect(facts.pushedHeadSha).toBe(current.headSha);
    expect(git.mergePullRequest).not.toHaveBeenCalled();
  });

  it("synchronizes an already-merged PR only on the Agent's explicit request", async () => {
    const { pull, git, facts, call } = fixture("merged");
    await call({ tool: "github_get_pr", providerNumber: 71 });
    const result = await call({ tool: "github_merge_pr", providerNumber: 71, reason: "Inspect the lost merge response and synchronize its target" });
    expect(git.mergePullRequest).not.toHaveBeenCalled();
    expect(git.checkpointAndPush).not.toHaveBeenCalled();
    expect(git.createPullRequest).not.toHaveBeenCalled();
    expect(git.reconcileMergedPullRequest).toHaveBeenCalledOnce();
    expect(git.reconcileMergedPullRequest).toHaveBeenCalledWith(expect.objectContaining({
      execution, ownershipEpoch: 2, providerNumber: 71, expectedHead: pull.headSha,
      expectedBase: pull.base, expectedMergeCommitSha: pull.mergeCommitSha }));
    expect(result).toMatchObject({ status: "merged", localSynchronization: { status: "synchronized" } });
    expect(facts.merged).toEqual(result);
    expect(await call({ tool: "github_merge_pr", providerNumber: 71 })).toEqual(result);
    expect(git.reconcileMergedPullRequest).toHaveBeenCalledOnce();
  });

  it.each(["id", "kind", "ownerExecutionId", "ownershipEpoch", "expectedHead", "expectedBase"] as const)(
    "refuses a retained merge operation with a different %s before replay or synchronization", async (field) => {
      const { pull, git, facts } = fixture("merged");
      const operation: OperationRecord = { id: `agent-git-${execution.id}-epoch-2-original-merge-merge`, kind: "pull.merge",
        ownerExecutionId: execution.id, ownershipEpoch: 2, expectedHead: pull.headSha, expectedBase: targetBase,
        payloadHash: "a".repeat(64), status: "uncertain" };
      Object.assign(operation, { [field]: field === "ownershipEpoch" ? 3 : "foreign" });
      await expect(executeAgentGitTool({ git, repository, execution, base: targetBase, facts,
        recordedOperation: () => operation,
        envelope: { projectId: "project", agent: "worker", invocationId: "original-session-repair",
          callId: "original-merge", stateVersion: 2, receivedAt: repository.observedAt,
          action: { tool: "github_merge_pr", providerNumber: pull.providerNumber } } }))
        .rejects.toThrow("Recorded Agent merge operation differs");
      expect(facts.merged).toBeUndefined();
      expect(git.mergePullRequest).not.toHaveBeenCalled();
      expect(git.reconcileMergedPullRequest).not.toHaveBeenCalled();
    });

  it("does not select another unfinished merge when the Agent supplies a different call ID", async () => {
    const { pull, git, facts } = fixture("merged");
    const original: OperationRecord = { id: `agent-git-${execution.id}-epoch-2-original-merge-merge`, kind: "pull.merge",
      ownerExecutionId: execution.id, ownershipEpoch: 2, expectedHead: pull.headSha, expectedBase: targetBase,
      payloadHash: "a".repeat(64), status: "uncertain" };
    const recordedOperation = vi.fn((id: string) => id === original.id ? original : undefined);
    await executeAgentGitTool({ git, repository, execution, base: targetBase, facts, recordedOperation,
      envelope: { projectId: "project", agent: "worker", invocationId: "original-session-repair",
        callId: "new-merge", stateVersion: 2, receivedAt: repository.observedAt,
        action: { tool: "github_merge_pr", providerNumber: pull.providerNumber } } });
    expect(recordedOperation).toHaveBeenCalledExactlyOnceWith(`agent-git-${execution.id}-epoch-2-new-merge-merge`);
    expect(original.status).toBe("uncertain");
    expect(git.mergePullRequest).not.toHaveBeenCalled();
    expect(git.reconcileMergedPullRequest).toHaveBeenCalledOnce();
  });

  it.each(["exact", "projectId", "operationId", "targetBranch", "expectedSourceHead", "mergeCommitSha", "localHeadAfter", "status"] as const)(
    "reuses only an exact durable synchronization in a fresh Agent tool context (%s)", async (variant) => {
      const { pull, git, call } = fixture("merged");
      const first = await call({ tool: "github_merge_pr", providerNumber: pull.providerNumber }) as NonNullable<AgentGitFacts["merged"]>;
      const synchronization = { ...first.localSynchronization! };
      if (variant !== "exact") Object.assign(synchronization, { [variant]: variant === "status" ? "unconfirmed" : "foreign" });
      git.reconcileMergedPullRequest.mockClear();
      const recordedSynchronization = vi.fn(() => synchronization);
      const freshFacts: AgentGitFacts = {};
      const request = executeAgentGitTool({ git, repository, execution, base: targetBase, facts: freshFacts,
        recordedSynchronization, envelope: { projectId: "project", agent: "worker", invocationId: "resumed-native-turn",
          callId: "verify-original-merge", stateVersion: 1, receivedAt: repository.observedAt,
          action: { tool: "github_merge_pr", providerNumber: pull.providerNumber } } });
      if (variant === "exact") {
        expect(await request).toEqual(first);
        expect(freshFacts.merged?.localSynchronization).toEqual(first.localSynchronization);
      } else {
        await expect(request).rejects.toThrow("Recorded Agent merge synchronization differs");
        expect(freshFacts.merged).toBeUndefined();
      }
      expect(recordedSynchronization).toHaveBeenCalledWith({ projectId: "project", executionId: execution.id,
        ownershipEpoch: execution.ownershipEpoch, providerNumber: pull.providerNumber, expectedHead: pull.headSha,
        expectedBase: targetBase, expectedMergeCommitSha: pull.mergeCommitSha });
      expect(git.reconcileMergedPullRequest).not.toHaveBeenCalled();
      expect(git.mergePullRequest).not.toHaveBeenCalled();
      expect(git.checkpointAndPush).not.toHaveBeenCalled();
      expect(git.createPullRequest).not.toHaveBeenCalled();
    }
  );

  it("records the stable delivery synchronization even when provider merge already returned a call-specific local fact", async () => {
    const merged = fixture("merged");
    const { git, facts } = fixture("open");
    const stable = await merged.call({ tool: "github_merge_pr", providerNumber: 71 }) as NonNullable<AgentGitFacts["merged"]>;
    git.mergePullRequest.mockResolvedValue({ ...stable, localSynchronization: { ...stable.localSynchronization,
      operationId: "agent-call-specific-merge" } });
    git.reconcileMergedPullRequest.mockResolvedValue(stable as any);
    expect(await executeAgentGitTool({ git, repository, execution, base: targetBase, facts,
      recordedSynchronization: () => undefined, envelope: { projectId: "project", agent: "worker", invocationId: "scoped-native-turn",
        callId: "scoped-agent-merge", stateVersion: 1, receivedAt: repository.observedAt,
        action: { tool: "github_merge_pr", providerNumber: 71 } } })).toEqual(stable);
    expect(git.mergePullRequest).toHaveBeenCalledOnce();
    expect(git.reconcileMergedPullRequest).toHaveBeenCalledWith(expect.objectContaining({
      operationId: stable.localSynchronization?.operationId, expectedMergeCommitSha: stable.mergeCommitSha }));
  });

  it.each(["ownerExecutionId", "head", "base", "repository"] as const)(
    "does not adopt a PR with a different %s", async (field) => {
      const { pull, facts, call } = fixture("open");
      pull[field] = "another-owner-or-scope";
      await expect(call({ tool: "github_get_pr", providerNumber: 71 })).rejects.toThrow("Agent PR does not match");
      expect(facts).toEqual({});
    });
});
