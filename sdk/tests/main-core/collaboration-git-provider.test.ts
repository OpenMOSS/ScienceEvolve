import { promises as fs } from "node:fs";
import { execFileSync as sdkFixtureGit } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OperationRecord } from "../../src/core/types.js";
import type { ControlAction } from "../../src/core/types.js";
import { executeAgentGitTool, type AgentGitFacts } from "../../src/core/agent-git-tools.js";
import { mergedPullSynchronizationOperationId } from "../../src/core/collaboration-git/operation.js";
import { mergedTreeFromBareRepo } from "./helpers/merged-tree.js";
import {
  CollaborationGitFacade,
  CollaborationGitInitializer,
  ExecFileGitCommandRunner,
  GitCommandError,
  GitHubAuthorizationError,
  GitHubProviderError,
  GitHubUncertainResultError,
  GitHubUserProvider,
  LocalCollaborationGitService,
  OperationPayloadMismatchError,
  readonlyGitProjection,
  type CollaborationGitOperationStore,
  type ExecutionOwnershipAssertion,
  type GitCommandRequest,
  type GitCommandResult,
  type GitCommandRunner,
  type GitHubRefFact,
  type InitializationCheckpoint,
  type OperationTransition
} from "../../src/core/collaboration-git/index.js";

const NOW = "2026-09-22T00:00:00.000Z";
const HEAD = "1".repeat(40);
const MERGE = "2".repeat(40);
const UPDATED_HEAD = "3".repeat(40);
const TOKEN = "ghp_PROVIDER_TEST_TOKEN_123456789";
const roots: string[] = [];

class MemoryOperationStore implements CollaborationGitOperationStore {
  completionReport?: { branch: string; content: string };
  async scopedGroupCompletionReport(): Promise<{ branch: string; content: string }> {
    if (!this.completionReport) throw new Error("No live scoped Finish receipt authority");
    return this.completionReport;
  }
  readonly records = new Map<string, OperationRecord>();
  readonly authorities = new Map<string, { epoch: number; branch: string }>();
  readonly initialization: InitializationCheckpoint[] = [];
  readonly synchronizations = new Map<string, Parameters<CollaborationGitOperationStore["recordMergedSynchronization"]>[0]>();
  private readonly crashAfterTransitions = new Set<string>();
  private readonly crashBeforeTransitions = new Set<string>();

  async recordedOperation(operationId: string): Promise<OperationRecord | undefined> {
    const record = this.records.get(operationId);
    return record ? structuredClone(record) : undefined;
  }

  async activeRevertOperation(executionId: string): Promise<OperationRecord | undefined> {
    return [...this.records.values()].find(record => record.kind === "git.revert" && record.ownerExecutionId === executionId &&
      ["prepared", "observed", "uncertain"].includes(record.status));
  }

  crashBeforeTransitionOnce(operationId: string, status: OperationTransition["status"]): void {
    this.crashBeforeTransitions.add(`${operationId}:${status}`);
  }

  async recordMergedSynchronization(input: Parameters<CollaborationGitOperationStore["recordMergedSynchronization"]>[0]): Promise<void> {
    await this.assertExecutionOwnership({ projectId: input.projectId, executionId: input.executionId,
      ownershipEpoch: input.ownershipEpoch, expectedBranch: this.authorities.get(input.executionId)!.branch,
      operation: "provider.reconcile_merged", providerNumber: input.providerNumber,
      expectedHeadSha: input.expectedHead, expectedBase: input.expectedBase, expectedMergeCommitSha: input.expectedMergeCommitSha });
    const operationId = mergedPullSynchronizationOperationId(input.executionId, input.ownershipEpoch,
      input.expectedHead, input.expectedBase, input.expectedMergeCommitSha);
    expect(input.synchronization).toMatchObject({ projectId: input.projectId, operationId,
      targetBranch: input.expectedBase, expectedSourceHead: input.expectedHead, mergeCommitSha: input.expectedMergeCommitSha });
    const prior = this.synchronizations.get(operationId);
    if (prior) expect(input).toEqual(prior);
    else this.synchronizations.set(operationId, structuredClone(input));
  }

  crashAfterTransitionOnce(
    operationId: string,
    status: OperationTransition["status"]
  ): void {
    this.crashAfterTransitions.add(`${operationId}:${status}`);
  }

  async prepare(record: OperationRecord): Promise<OperationRecord> {
    const existing = this.records.get(record.id);
    if (existing) {
      if (
        existing.payloadHash !== record.payloadHash ||
        existing.kind !== record.kind ||
        existing.ownerExecutionId !== record.ownerExecutionId ||
        existing.ownershipEpoch !== record.ownershipEpoch ||
        existing.expectedHead !== record.expectedHead ||
        existing.expectedBase !== record.expectedBase
      ) {
        throw new OperationPayloadMismatchError(record.id);
      }
      return structuredClone(existing);
    }
    this.records.set(record.id, structuredClone(record));
    return structuredClone(record);
  }

  async transition(input: OperationTransition): Promise<OperationRecord> {
    if (this.crashBeforeTransitions.delete(`${input.id}:${input.status}`)) {
      throw new Error(`simulated crash before durable ${input.status} transition`);
    }
    const existing = this.records.get(input.id);
    if (!existing || existing.payloadHash !== input.payloadHash) {
      throw new OperationPayloadMismatchError(input.id);
    }
    if (
      existing.status === input.status &&
      JSON.stringify(existing.remoteFact) === JSON.stringify(input.remoteFact)
    ) {
      return structuredClone(existing);
    }
    const allowed: Record<OperationRecord["status"], readonly OperationRecord["status"][]> = {
      prepared: ["observed", "uncertain", "failed"],
      uncertain: ["observed", "uncertain", "failed"],
      observed: ["finalized", "uncertain", "failed"],
      finalized: [],
      failed: [],
      superseded: []
    };
    if (!allowed[existing.status].includes(input.status)) {
      throw new Error(`illegal operation transition ${existing.status} -> ${input.status}`);
    }
    const next: OperationRecord = {
      ...existing,
      status: input.status,
      ...(input.remoteFact ? { remoteFact: structuredClone(input.remoteFact) } : {})
    };
    this.records.set(input.id, next);
    const crashKey = `${input.id}:${input.status}`;
    if (this.crashAfterTransitions.delete(crashKey)) {
      throw new Error(`simulated crash after durable ${input.status} transition`);
    }
    return structuredClone(next);
  }

  async assertExecutionOwnership(input: ExecutionOwnershipAssertion): Promise<void> {
    const authority = this.authorities.get(input.executionId);
    if (
      !authority ||
      authority.epoch !== input.ownershipEpoch ||
      authority.branch !== input.expectedBranch
    ) {
      throw new Error("stale execution authority");
    }
  }

  async checkpointInitialization(input: InitializationCheckpoint): Promise<void> {
    this.initialization.push(structuredClone(input));
  }
}

type Fault = "lost" | "server" | "timeout";

interface FakePull {
  number: number;
  title: string;
  body: string;
  head: { ref: string; sha: string };
  base: { ref: string };
  state: "open" | "closed";
  merged: boolean;
  merged_at: string | null;
  mergeable: boolean | null;
  mergeable_state: string;
  merge_commit_sha: string | null;
  html_url: string;
}

class FakeGitHub {
  constructor(readonly owner = "alice") {}
  readonly calls = new Map<string, number>();
  readonly authorizations: string[] = [];
  readonly refs = new Map<string, string>();
  readonly pulls = new Map<number, FakePull>();
  readonly pullHeadObservations = new Map<number, string[]>();
  readonly pullMergeabilityObservations = new Map<number, Array<boolean | null>>();
  readonly mergeRequests = new Map<number, Record<string, unknown>>();
  readonly faults = new Map<string, Fault>();
  repositoryName?: string;
  repositoryDescription?: string;
  repositoryPrivate = true;
  nextPull = 1;
  authorizationStatus?: 401 | 403;
  advertisedScopes = "repo";
  missingRefStatus: 404 | 409 = 404;
  mergeCommitFactory?: (pull: FakePull) => Promise<string>;
  initialMergeable: boolean | null = true;

  count(method: string, pathname: string): number {
    return this.calls.get(`${method} ${pathname}`) ?? 0;
  }

  failOnce(method: string, pathname: string, fault: Fault): void {
    this.faults.set(`${method} ${pathname}`, fault);
  }

  seedRepository(name = "demo", isPrivate = true): void {
    this.repositoryName = name;
    this.repositoryPrivate = isPrivate;
  }

  repository(name: string) {
    return {
      id: 17,
      owner: { login: this.owner },
      name,
      private: this.repositoryPrivate,
      default_branch: "main",
      html_url: `https://github.com/${this.owner}/${name}`,
      clone_url: `https://github.com/${this.owner}/${name}.git`,
      description: this.repositoryDescription ?? null
    };
  }

  pull(number: number): FakePull {
    const pull = this.pulls.get(number);
    if (!pull) throw new Error(`missing fake pull ${number}`);
    return pull;
  }

  queuePullHeadObservations(number: number, ...headShas: string[]): void {
    this.pullHeadObservations.set(number, [...headShas]);
  }

  readonly fetch: typeof globalThis.fetch = async (input, init = {}) => {
    const url = new URL(typeof input === "string" || input instanceof URL
      ? input.toString()
      : input.url);
    const method = (init.method ?? "GET").toUpperCase();
    const pathname = url.pathname;
    const callKey = `${method} ${pathname}`;
    this.calls.set(callKey, (this.calls.get(callKey) ?? 0) + 1);
    const headers = new Headers(init.headers);
    this.authorizations.push(headers.get("authorization") ?? "");

    if (this.authorizationStatus) {
      return this.response({ message: `authorization ${TOKEN}` }, this.authorizationStatus);
    }
    if (pathname === "/user" && method === "GET") {
      return this.response(
        { login: this.owner, id: 7 },
        200,
        { "x-oauth-scopes": this.advertisedScopes }
      );
    }

    const fault = this.faults.get(callKey);
    if (fault) this.faults.delete(callKey);
    if (fault === "server") {
      return this.response({ message: `server failed ${TOKEN}` }, 503);
    }
    if (fault === "timeout") {
      return new Promise<Response>(() => undefined);
    }

    if (pathname === "/user/repos" && method === "POST") {
      const body = this.body(init);
      this.repositoryName = String(body.name);
      this.repositoryDescription = String(body.description ?? "");
      this.repositoryPrivate = body.private !== false;
      if (fault === "lost") throw new TypeError(`socket lost ${TOKEN}`);
      return this.response(this.repository(this.repositoryName), 201);
    }

    const repoMatch = pathname.match(/^\/repos\/([^/]+)\/([^/]+)$/);
    if (repoMatch && method === "GET") {
      const name = decodeURIComponent(repoMatch[2]!);
      return this.repositoryName === name
        ? this.response(this.repository(name), 200)
        : this.response({ message: "not found" }, 404);
    }

    const refMatch = pathname.match(/^\/repos\/([^/]+)\/([^/]+)\/git\/ref\/heads\/(.+)$/);
    if (refMatch && method === "GET") {
      const branch = decodeURIComponent(refMatch[3]!);
      const sha = this.refs.get(branch);
      return sha
        ? this.response({ ref: `refs/heads/${branch}`, object: { sha } }, 200)
        : this.response({ message: this.missingRefStatus === 409
          ? "Git Repository is empty."
          : "not found" }, this.missingRefStatus);
    }

    const checksMatch = pathname.match(/^\/repos\/([^/]+)\/([^/]+)\/commits\/([0-9a-f]+)\/check-runs$/);
    if (checksMatch && method === "GET") {
      return this.response({
        check_runs: [{
          id: 99,
          name: "tests",
          status: "completed",
          conclusion: "success",
          html_url: `https://github.com/${this.owner}/${this.repositoryName}/actions/checks/99`
        }]
      }, 200);
    }

    const pullsPath = pathname.match(/^\/repos\/([^/]+)\/([^/]+)\/pulls$/);
    if (pullsPath && method === "GET") {
      const head = (url.searchParams.get("head") ?? "").replace(`${this.owner}:`, "");
      const base = url.searchParams.get("base");
      return this.response(
        [...this.pulls.values()].filter((pull) => pull.head.ref === head && pull.base.ref === base),
        200
      );
    }
    if (pullsPath && method === "POST") {
      const body = this.body(init);
      const branch = String(body.head);
      const sha = this.refs.get(branch);
      if (!sha) return this.response({ message: "missing head" }, 422);
      const number = this.nextPull++;
      const pull: FakePull = {
        number,
        title: String(body.title),
        body: String(body.body),
        head: { ref: branch, sha },
        base: { ref: String(body.base) },
        state: "open",
        merged: false,
        merged_at: null,
        mergeable: this.initialMergeable,
        mergeable_state: "clean",
        merge_commit_sha: null,
        html_url: `https://github.com/${this.owner}/${this.repositoryName}/pull/${number}`
      };
      this.pulls.set(number, pull);
      if (fault === "lost") throw new TypeError(`response lost ${TOKEN}`);
      return this.response(pull, 201);
    }

    const pullMatch = pathname.match(/^\/repos\/([^/]+)\/([^/]+)\/pulls\/(\d+)$/);
    if (pullMatch && method === "GET") {
      const number = Number(pullMatch[3]);
      const pull = this.pulls.get(number);
      if (!pull) return this.response({ message: "not found" }, 404);
      const observed = structuredClone(pull);
      const queuedHead = this.pullHeadObservations.get(number)?.shift();
      if (queuedHead) observed.head.sha = queuedHead;
      const queuedMergeable = this.pullMergeabilityObservations.get(number)?.shift();
      if (queuedMergeable !== undefined) observed.mergeable = queuedMergeable;
      return this.response(observed, 200);
    }
    if (pullMatch && method === "PATCH") {
      const pull = this.pull(Number(pullMatch[3]));
      pull.state = "closed";
      if (fault === "lost") throw new TypeError(`response lost ${TOKEN}`);
      return this.response(pull, 200);
    }

    const mergeMatch = pathname.match(/^\/repos\/([^/]+)\/([^/]+)\/pulls\/(\d+)\/merge$/);
    if (mergeMatch && method === "PUT") {
      const pullNumber = Number(mergeMatch[3]);
      const pull = this.pull(pullNumber);
      const body = this.body(init);
      this.mergeRequests.set(pullNumber, structuredClone(body));
      if (body.sha !== pull.head.sha) return this.response({ merged: false }, 409);
      const mergeCommit = this.mergeCommitFactory
        ? await this.mergeCommitFactory(pull)
        : MERGE;
      pull.state = "closed";
      pull.merged = true;
      pull.merged_at = NOW;
      pull.merge_commit_sha = mergeCommit;
      this.refs.set(pull.base.ref, mergeCommit);
      if (fault === "lost") throw new TypeError(`response lost ${TOKEN}`);
      return this.response({ merged: true, sha: mergeCommit }, 200);
    }

    return this.response({ message: `unexpected ${method} ${pathname}` }, 404);
  };

  private body(init: RequestInit): Record<string, unknown> {
    return JSON.parse(String(init.body ?? "{}")) as Record<string, unknown>;
  }

  private response(
    body: unknown,
    status: number,
    headers: Record<string, string> = {}
  ): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json", ...headers }
    });
  }
}

function providerFixture(options: {
  fake?: FakeGitHub;
  store?: MemoryOperationStore;
  requestedScopes?: string[];
  expectedIdentity?: { id: number; login: string };
  timeoutMs?: number;
  now?: () => string;
  pullHeadConsistencyAttempts?: number;
  pullHeadConsistencyDelayMs?: number;
} = {}) {
  const fake = options.fake ?? new FakeGitHub();
  const store = options.store ?? new MemoryOperationStore();
  const provider = new GitHubUserProvider({
    credentialResolver: async () => ({
      token: TOKEN,
      requestedScopes: options.requestedScopes ?? ["repo"]
    }),
    ...(options.expectedIdentity ? { expectedIdentity: options.expectedIdentity } : {}),
    operationStore: store,
    fetch: fake.fetch,
    timeoutMs: options.timeoutMs ?? 1_000,
    now: options.now ?? (() => NOW),
    pullHeadConsistencyAttempts: options.pullHeadConsistencyAttempts,
    pullHeadConsistencyDelayMs: options.pullHeadConsistencyDelayMs
  });
  return { fake, store, provider };
}

function pullRequest(operationId: string, head = HEAD) {
  return {
    owner: "alice",
    repository: "demo",
    head: "executions/exec-1",
    base: "main",
    title: "Deliver result",
    body: "Reviewed result",
    ownerExecutionId: "exec-1",
    operation: {
      operationId,
      ownerExecutionId: "exec-1",
      ownershipEpoch: 3,
      expectedHead: head,
      expectedBase: "main"
    }
  };
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

async function harnessCommit(
  worktreePath: string,
  message: string,
  paths: readonly string[]
): Promise<string> {
  const runner = new ExecFileGitCommandRunner();
  await runner.run({
    cwd: worktreePath,
    args: ["add", "--", ...paths]
  });
  await runner.run({
    cwd: worktreePath,
    args: ["commit", "-m", message],
    environment: {
      GIT_AUTHOR_NAME: "Harness Fixture",
      GIT_AUTHOR_EMAIL: "harness@localhost",
      GIT_COMMITTER_NAME: "Harness Fixture",
      GIT_COMMITTER_EMAIL: "harness@localhost"
    }
  });
  const head = await runner.run({ cwd: worktreePath, args: ["rev-parse", "HEAD"] });
  return head.stdout.trim();
}

describe("GitHubUserProvider", () => {
  it.each([
    ["alice", "workflow-9505293cd6"], ["alice", "workflow"], ["alice", "workflows"],
    ["alice", "actions-analysis"], ["alice", "actions"], ["workflow-user", "demo"], ["actions", "demo"]
  ])("allows repository operations when account or repository names contain automation words (%s/%s)", async (owner, name) => {
    const { fake, store, provider } = providerFixture({ fake: new FakeGitHub(owner) });
    const repository = await provider.ensureRepository({ name, visibility: "private", operation: { operationId: "repository-name-check" } });
    expect(repository).toMatchObject({ owner, name, private: true });
    expect(fake.count("GET", `/repos/${owner}/${name}`)).toBe(1);
    expect(fake.count("POST", "/user/repos")).toBe(1);
    expect(store.records.get("repository-name-check")?.status).toBe("finalized");
  });

  it.each(["groups/workflow", "executions/actions"])("allows collaboration branch names containing automation words (%s)", async branch => {
    const { fake, provider } = providerFixture();
    fake.seedRepository(); fake.refs.set(branch, HEAD);
    await expect(provider.observeRef("alice", "demo", branch)).resolves.toMatchObject({ ref: branch, status: "present", sha: HEAD });
    expect(fake.count("GET", `/repos/alice/demo/git/ref/heads/${branch}`)).toBe(1);
  });

  it.each([
    "/repos/alice/demo/actions/runs", "/repos/workflow/actions/actions/workflows",
    "/repos/alice/demo/workflows", "/orgs/workflow-team/actions/secrets",
    "/users/actions/actions/caches", "/enterprises/workflow-company/actions/runners",
    "/actions/runners", "/workflows"
  ])("rejects actual automation endpoints before sending any HTTP request (%s)", async requestPath => {
    const { fake, provider } = providerFixture();
    const transport = provider as unknown as { request(credential: { token: string; requestedScopes: string[] }, method: "GET" | "POST",
      path: string, options: { expectedStatuses: number[] }): Promise<unknown> };
    await expect(transport.request({ token: TOKEN, requestedScopes: ["repo"] }, "POST", requestPath, { expectedStatuses: [200] }))
      .rejects.toThrow("GitHub Actions and workflow endpoints are forbidden");
    expect(fake.calls.size).toBe(0);
  });

  it("returns exact public ownership facts for an Agent's old PR query without changing delivery", async () => {
    const { fake, store, provider } = providerFixture();
    fake.seedRepository();
    fake.refs.set("executions/exec-1", HEAD);
    await provider.openPullRequest(pullRequest("old-task-pr"));
    const records = structuredClone([...store.records.values()]);
    const result = provider.observePullRequest("alice", "demo", 1, "exec-current");
    await expect(result).rejects.toMatchObject({
      code: "GITHUB_PROVIDER_FAILED", retryable: false,
      publicData: { providerNumber: 1, expectedOwnerExecutionId: "exec-current", actualOwnerExecutionId: "exec-1" },
      message: expect.stringContaining("expected execution: exec-current; actual marker: exec-1")
    });
    expect(fake.count("POST", "/repos/alice/demo/pulls")).toBe(1);
    expect(fake.count("PUT", "/repos/alice/demo/pulls/1/merge")).toBe(0);
    expect([...store.records.values()]).toEqual(records);
    expect(await provider.observePullRequest("alice", "demo", 1, "exec-1")).toMatchObject({ ownerExecutionId: "exec-1", status: "open" });
  });

  it("treats GitHub's empty-repository 409 as an absent initial branch", async () => {
    const { fake, provider } = providerFixture();
    fake.missingRefStatus = 409;
    await expect(provider.observeRef("alice", "demo", "main")).resolves.toMatchObject({
      owner: "alice",
      repository: "demo",
      ref: "main",
      status: "missing"
    });
  });

  it("reconciles a lost repository-create response and makes the operation idempotent", async () => {
    const { fake, store, provider } = providerFixture();
    fake.failOnce("POST", "/user/repos", "lost");

    const first = await provider.ensureRepository({
      name: "demo",
      visibility: "private",
      description: "private test repository",
      operation: { operationId: "repo-create-1" }
    });
    expect(first).toMatchObject({ owner: "alice", name: "demo", private: true });
    expect(fake.count("POST", "/user/repos")).toBe(1);
    expect(fake.repositoryDescription).toBe(
      "private test repository | OpenFARS-Operation: repo-create-1"
    );
    expect(fake.repositoryDescription).not.toMatch(/[\u0000-\u001f\u007f]/u);
    expect(store.records.get("repo-create-1")?.status).toBe("finalized");

    const replay = await provider.ensureRepository({
      name: "demo",
      visibility: "private",
      description: "private test repository",
      operation: { operationId: "repo-create-1" }
    });
    expect(replay).toEqual(first);
    expect(fake.count("POST", "/user/repos")).toBe(1);
    await expect(provider.ensureRepository({
      name: "different",
      visibility: "private",
      operation: { operationId: "repo-create-1" }
    })).rejects.toBeInstanceOf(OperationPayloadMismatchError);
    expect(JSON.stringify([...store.records.values()])).not.toContain(TOKEN);
    expect(fake.authorizations.every((header) => header === `Bearer ${TOKEN}`)).toBe(true);
  });

  it("creates a public repository when public visibility is requested", async () => {
    const { fake, provider } = providerFixture();

    const repository = await provider.ensureRepository({
      name: "public-demo",
      visibility: "public",
      operation: { operationId: "repo-create-public" }
    });

    expect(repository).toMatchObject({ owner: "alice", name: "public-demo", private: false });
    expect(fake.repositoryPrivate).toBe(false);
    expect(fake.count("POST", "/user/repos")).toBe(1);
    await expect(provider.ensureRepository({
      name: "public-demo",
      visibility: "private",
      operation: { operationId: "repo-create-public" }
    })).rejects.toBeInstanceOf(OperationPayloadMismatchError);
  });

  it("refuses to adopt a same-name repository without the prepared operation marker", async () => {
    const { fake, provider } = providerFixture();
    fake.seedRepository("demo");
    await expect(provider.ensureRepository({
      name: "demo",
      visibility: "private",
      operation: { operationId: "repo-collision" }
    })).rejects.toThrow("not owned by the prepared");
    expect(fake.count("POST", "/user/repos")).toBe(0);
  });

  it("maps 401/403 and scope failures to waiting_for_github without leaking credentials", async () => {
    for (const status of [401, 403] as const) {
      const fake = new FakeGitHub();
      fake.authorizationStatus = status;
      const { provider } = providerFixture({ fake });
      const error = await provider.verifyIdentity().catch((caught: unknown) => caught);
      expect(error).toBeInstanceOf(GitHubAuthorizationError);
      expect((error as GitHubAuthorizationError).projectStatus).toBe("waiting_for_github");
      expect(JSON.stringify(error)).not.toContain(TOKEN);
      expect(String(error)).not.toContain(TOKEN);
    }

    const invalidScope = providerFixture({ requestedScopes: ["repo", "workflow"] }).provider;
    await expect(invalidScope.verifyIdentity()).rejects.toBeInstanceOf(GitHubAuthorizationError);
    const missingScope = providerFixture({ requestedScopes: ["read:user"] }).provider;
    await expect(missingScope.verifyIdentity()).rejects.toBeInstanceOf(GitHubAuthorizationError);
  });

  it("refuses credentials whose provider identity differs from the project account binding", async () => {
    const { provider } = providerFixture({
      expectedIdentity: { id: 9, login: "bob" }
    });

    await expect(provider.verifyIdentity()).rejects.toMatchObject({
      code: "GITHUB_WAITING_FOR_AUTHORIZATION",
      publicData: { provider: "github", status: 403 }
    });
  });

  it("marks 5xx and timeout mutations uncertain, reconciles facts, and never blindly retries", async () => {
    const server = providerFixture();
    server.fake.failOnce("POST", "/user/repos", "server");
    const serverError = await server.provider.ensureRepository({
      name: "demo",
      visibility: "private",
      operation: { operationId: "repo-server" }
    }).catch((caught: unknown) => caught);
    expect(serverError).toBeInstanceOf(GitHubUncertainResultError);
    expect(server.fake.count("POST", "/user/repos")).toBe(1);
    expect(server.store.records.get("repo-server")?.status).toBe("uncertain");
    expect(JSON.stringify(serverError)).not.toContain(TOKEN);

    const timed = providerFixture({ timeoutMs: 500 });
    timed.fake.failOnce("POST", "/user/repos", "timeout");
    await expect(timed.provider.ensureRepository({
      name: "demo",
      visibility: "private",
      operation: { operationId: "repo-timeout" }
    })).rejects.toBeInstanceOf(GitHubUncertainResultError);
    expect(timed.fake.count("POST", "/user/repos")).toBe(1);
    expect(timed.store.records.get("repo-timeout")?.status).toBe("uncertain");
  });

  it("publishes and replays an original closing PR with realistic execution, invocation and call identities", async () => {
    const { fake, store, provider } = providerFixture();
    fake.seedRepository();
    const invocationId = `inv_${"6".repeat(32)}`, executionId = `scoped-exec-${"3".repeat(64)}`;
    const execution = { id: executionId, agentId: "checker", purpose: "delivery" as const, ownershipEpoch: 1,
      executionBranch: `executions/${executionId}`, worktreePath: "/tmp/original-closing-worktree",
      restrictedClosing: { invocationId, capabilityHash: "c".repeat(64),
        scope: { kind: "completed-leftovers" as const, reportHeadSha: "a".repeat(40), paths: ["agent-memory/checker/Memory.md"] } } };
    fake.refs.set(execution.executionBranch, HEAD);
    store.authorities.set(execution.id, { epoch: 1, branch: execution.executionBranch });
    const repository = { owner: "alice", name: "demo", private: true, defaultBranch: "main",
      htmlUrl: "https://github.com/alice/demo", observedAt: NOW };
    const git = { checkpointAndPush: vi.fn(), mergePullRequest: vi.fn(),
      createPullRequest: vi.fn((request: Parameters<CollaborationGitFacade["createPullRequest"]>[0]) => provider.openPullRequest({
        owner: repository.owner, repository: repository.name, head: execution.executionBranch, base: request.base,
        title: request.title, body: request.body, ownerExecutionId: execution.id,
        operation: { operationId: request.operationId, ownerExecutionId: execution.id, ownershipEpoch: 1,
          expectedHead: request.expectedHead, expectedBase: request.base } })) };
    const envelope = { projectId: "original-project", agent: "checker", invocationId,
      callId: "checker-close-mem-create-pr-642e9065-1", capabilityHash: execution.restrictedClosing.capabilityHash,
      stateVersion: 1, receivedAt: NOW,
      action: { tool: "github_create_pr" as const, base: "main", title: "Independent Memory B", body: "Keep report A immutable" } };
    const facts: AgentGitFacts = { pushedHeadSha: HEAD };
    const call = () => executeAgentGitTool({ git, repository, execution, base: "main", facts, envelope });
    const opened = await call();
    expect(opened).toMatchObject({ headSha: HEAD, ownerExecutionId: execution.id, providerNumber: 1, status: "open" });
    const [operationId] = store.records.keys();
    expect(operationId).toMatch(/^[A-Za-z0-9][A-Za-z0-9._-]{0,159}$/);
    expect(fake.pull(1).body).toContain(`<!-- openfars-operation:${operationId} -->`);
    expect(fake.pull(1).body).toContain(`<!-- openfars-execution:${execution.id} -->`);
    expect(await call()).toEqual(opened);
    expect([...store.records.keys()]).toEqual([operationId]);
    expect(fake.count("POST", "/repos/alice/demo/pulls")).toBe(1);
    expect(git.createPullRequest.mock.calls.map(([request]) => request.operationId)).toEqual([operationId, operationId]);
  });

  it("reconciles lost PR create/merge responses and replays without duplicate mutations", async () => {
    const { fake, store, provider } = providerFixture();
    fake.seedRepository();
    fake.refs.set("executions/exec-1", HEAD);
    fake.failOnce("POST", "/repos/alice/demo/pulls", "lost");

    const opened = await provider.openPullRequest(pullRequest("pull-create-1"));
    expect(opened).toMatchObject({ providerNumber: 1, status: "open", headSha: HEAD });
    expect(fake.count("POST", "/repos/alice/demo/pulls")).toBe(1);
    expect(await provider.openPullRequest(pullRequest("pull-create-1"))).toEqual(opened);
    expect(fake.count("POST", "/repos/alice/demo/pulls")).toBe(1);

    fake.failOnce("PUT", "/repos/alice/demo/pulls/1/merge", "lost");
    const mergeRequest = {
      owner: "alice",
      repository: "demo",
      providerNumber: 1,
      ownerExecutionId: "exec-1",
      operation: {
        operationId: "pull-merge-1",
        ownerExecutionId: "exec-1",
        ownershipEpoch: 3,
        expectedHead: HEAD,
        expectedBase: "main"
      }
    };
    const merged = await provider.mergePullRequest(mergeRequest);
    expect(merged).toMatchObject({ status: "merged", mergeCommitSha: MERGE });
    expect(fake.count("PUT", "/repos/alice/demo/pulls/1/merge")).toBe(1);
    expect(await provider.mergePullRequest(mergeRequest)).toEqual(merged);
    expect(fake.count("PUT", "/repos/alice/demo/pulls/1/merge")).toBe(1);
    expect([...store.records.values()].every((record) => record.status === "finalized")).toBe(true);
    expect(JSON.stringify([...store.records.values()])).not.toContain(TOKEN);
  });

  it("refreshes a finalized pending PR without creating a second PR or rewriting its receipt", async () => {
    const { fake, store, provider } = providerFixture({
      pullHeadConsistencyAttempts: 4, pullHeadConsistencyDelayMs: 0
    });
    fake.seedRepository();
    fake.refs.set("executions/exec-1", HEAD);
    fake.initialMergeable = null;
    const request = pullRequest("pull-create-pending");
    expect((await provider.openPullRequest(request)).status).toBe("unknown");
    const initialReads = fake.count("GET", "/repos/alice/demo/pulls/1");
    const receipt = structuredClone(store.records.get(request.operation.operationId));
    fake.pullMergeabilityObservations.set(1, [null, null, true]);

    expect(await provider.openPullRequest(request)).toMatchObject({
      providerNumber: 1, status: "open", headSha: HEAD, mergeable: true
    });
    expect(fake.count("GET", "/repos/alice/demo/pulls/1") - initialReads).toBe(3);
    expect(fake.count("POST", "/repos/alice/demo/pulls")).toBe(1);
    expect(store.records.get(request.operation.operationId)).toEqual(receipt);
  });

  it("bounds pending PR observations and keeps an unresolved PR pending", async () => {
    const { fake, provider } = providerFixture({
      pullHeadConsistencyAttempts: 3, pullHeadConsistencyDelayMs: 0
    });
    fake.seedRepository();
    fake.refs.set("executions/exec-1", HEAD);
    fake.initialMergeable = null;
    const request = pullRequest("pull-create-unresolved");
    await provider.openPullRequest(request);
    const initialReads = fake.count("GET", "/repos/alice/demo/pulls/1");

    expect((await provider.openPullRequest(request)).status).toBe("unknown");
    expect(fake.count("GET", "/repos/alice/demo/pulls/1") - initialReads).toBe(3);
    expect(fake.count("POST", "/repos/alice/demo/pulls")).toBe(1);
    expect(fake.count("PUT", "/repos/alice/demo/pulls/1/merge")).toBe(0);
  });

  it("waits for fresh PR mergeability after retaining creation, without a second mutation", async () => {
    const { fake, store, provider } = providerFixture({ pullHeadConsistencyAttempts: 4, pullHeadConsistencyDelayMs: 0 });
    fake.seedRepository(); fake.refs.set("executions/exec-1", HEAD);
    fake.initialMergeable = null;
    fake.pullMergeabilityObservations.set(1, [null, true]);
    const request = pullRequest("pull-create-fresh-pending");
    expect(await provider.openPullRequest(request)).toMatchObject({ providerNumber: 1, status: "open", headSha: HEAD });
    expect(fake.count("GET", "/repos/alice/demo/pulls/1")).toBe(2);
    expect(fake.count("POST", "/repos/alice/demo/pulls")).toBe(1);
    expect(fake.count("PUT", "/repos/alice/demo/pulls/1/merge")).toBe(0);
    expect(store.records.get(request.operation.operationId)).toMatchObject({ status: "finalized", remoteFact: { status: "unknown" } });
  });

  it.each(["missing", "head", "base", "marker"] as const)("rejects a %s pending PR observation without another mutation", async (changed) => {
    const { fake, provider } = providerFixture({
      pullHeadConsistencyAttempts: 2, pullHeadConsistencyDelayMs: 0
    });
    fake.seedRepository();
    fake.refs.set("executions/exec-1", HEAD);
    fake.initialMergeable = null;
    const request = pullRequest(`pull-create-pending-${changed}`);
    await provider.openPullRequest(request);
    if (changed === "missing") fake.pulls.delete(1);
    else if (changed === "head") fake.pull(1).head.sha = UPDATED_HEAD;
    else if (changed === "base") fake.pull(1).base.ref = "groups/other";
    else fake.pull(1).body = fake.pull(1).body.replace(request.operation.operationId, "another-operation");

    await expect(provider.openPullRequest(request)).rejects.toThrow(/missing or mismatched|do not match/);
    expect(fake.count("POST", "/repos/alice/demo/pulls")).toBe(1);
    expect(fake.count("PUT", "/repos/alice/demo/pulls/1/merge")).toBe(0);
  });

  it("discovers an old-epoch PR by execution identity before restart creates another mutation", async () => {
    const { fake, provider } = providerFixture();
    fake.seedRepository();
    fake.refs.set("executions/exec-1", HEAD);
    fake.failOnce("POST", "/repos/alice/demo/pulls", "lost");

    const opened = await provider.openPullRequest(pullRequest("pull-create-old-epoch"));
    const postCount = fake.count("POST", "/repos/alice/demo/pulls");
    const recovered = await provider.observePullRequestForExecution(
      "alice",
      "demo",
      "executions/exec-1",
      "main",
      "exec-1"
    );

    expect(recovered).toMatchObject({
      providerNumber: opened.providerNumber,
      ownerExecutionId: "exec-1",
      head: "executions/exec-1",
      base: "main",
      status: "open"
    });
    expect(fake.count("POST", "/repos/alice/demo/pulls")).toBe(postCount);

    fake.pulls.set(99, {
      ...structuredClone(fake.pull(opened.providerNumber)),
      number: 99,
      html_url: "https://github.com/alice/demo/pull/99"
    });
    await expect(provider.observePullRequestForExecution(
      "alice",
      "demo",
      "executions/exec-1",
      "main",
      "exec-1"
    )).rejects.toThrow("Multiple pull requests claim the same execution branch");
  });

  it("waits for a repaired PR head to become consistent before merging exactly once", async () => {
    const { fake, provider } = providerFixture({
      pullHeadConsistencyAttempts: 4,
      pullHeadConsistencyDelayMs: 0
    });
    fake.seedRepository();
    fake.refs.set("executions/exec-1", HEAD);
    const opened = await provider.openPullRequest(pullRequest("pull-create-stale-head"));
    fake.refs.set("executions/exec-1", UPDATED_HEAD);
    fake.pull(opened.providerNumber).head.sha = UPDATED_HEAD;
    fake.queuePullHeadObservations(opened.providerNumber, HEAD, HEAD);

    const merged = await provider.mergePullRequest({
      owner: "alice",
      repository: "demo",
      providerNumber: opened.providerNumber,
      ownerExecutionId: "exec-1",
      operation: {
        operationId: "pull-merge-stale-head",
        ownerExecutionId: "exec-1",
        ownershipEpoch: 3,
        expectedHead: UPDATED_HEAD,
        expectedBase: "main"
      }
    });

    expect(merged).toMatchObject({
      status: "merged",
      headSha: UPDATED_HEAD,
      mergeCommitSha: MERGE
    });
    expect(fake.count("GET", "/repos/alice/demo/pulls/1")).toBe(4);
    expect(fake.count("PUT", "/repos/alice/demo/pulls/1/merge")).toBe(1);
  });

  it("fails closed without mutating when a repaired PR head stays stale", async () => {
    const { fake, store, provider } = providerFixture({
      pullHeadConsistencyAttempts: 4,
      pullHeadConsistencyDelayMs: 0
    });
    fake.seedRepository();
    fake.refs.set("executions/exec-1", HEAD);
    const opened = await provider.openPullRequest(pullRequest("pull-create-persistently-stale"));
    fake.refs.set("executions/exec-1", UPDATED_HEAD);
    fake.pull(opened.providerNumber).head.sha = UPDATED_HEAD;
    fake.queuePullHeadObservations(opened.providerNumber, HEAD, HEAD, HEAD, HEAD);

    await expect(provider.mergePullRequest({
      owner: "alice",
      repository: "demo",
      providerNumber: opened.providerNumber,
      ownerExecutionId: "exec-1",
      operation: {
        operationId: "pull-merge-persistently-stale",
        ownerExecutionId: "exec-1",
        ownershipEpoch: 3,
        expectedHead: UPDATED_HEAD,
        expectedBase: "main"
      }
    })).rejects.toThrow("Pull request facts do not match the prepared operation");

    expect(fake.count("GET", "/repos/alice/demo/pulls/1")).toBe(4);
    expect(fake.count("PUT", "/repos/alice/demo/pulls/1/merge")).toBe(0);
    expect(store.records.get("pull-merge-persistently-stale")?.status).toBe("prepared");
  });

  it("cancels a stale-head consistency wait before mutation", async () => {
    const { fake, provider } = providerFixture({
      pullHeadConsistencyAttempts: 4,
      pullHeadConsistencyDelayMs: 5_000
    });
    fake.seedRepository();
    fake.refs.set("executions/exec-1", HEAD);
    const opened = await provider.openPullRequest(pullRequest("pull-create-cancel-stale"));
    fake.refs.set("executions/exec-1", UPDATED_HEAD);
    fake.pull(opened.providerNumber).head.sha = UPDATED_HEAD;
    fake.queuePullHeadObservations(opened.providerNumber, HEAD, HEAD, HEAD, HEAD);
    const controller = new AbortController();

    const pending = provider.mergePullRequest({
      owner: "alice",
      repository: "demo",
      providerNumber: opened.providerNumber,
      ownerExecutionId: "exec-1",
      operation: {
        operationId: "pull-merge-cancel-stale",
        ownerExecutionId: "exec-1",
        ownershipEpoch: 3,
        expectedHead: UPDATED_HEAD,
        expectedBase: "main"
      },
      signal: controller.signal
    });
    controller.abort();

    await expect(pending).rejects.toMatchObject({
      code: "GITHUB_PROVIDER_FAILED",
      retryable: true,
      publicData: { cancelled: true }
    });
    expect(fake.count("PUT", "/repos/alice/demo/pulls/1/merge")).toBe(0);
  });

  it("closes a PR through the fixed endpoint and publishes credential-free read-only facts", async () => {
    const { fake, provider } = providerFixture();
    fake.seedRepository();
    fake.refs.set("executions/exec-1", HEAD);
    const repository = await provider.observeRepository("alice", "demo");
    const opened = await provider.openPullRequest(pullRequest("pull-create-close"));
    const closed = await provider.closePullRequest({
      owner: "alice",
      repository: "demo",
      providerNumber: opened.providerNumber,
      ownerExecutionId: "exec-1",
      operation: {
        operationId: "pull-close-1",
        ownerExecutionId: "exec-1",
        ownershipEpoch: 3,
        expectedHead: HEAD,
        expectedBase: "main"
      }
    });
    expect(closed.status).toBe("closed");
    expect(fake.count("PATCH", "/repos/alice/demo/pulls/1")).toBe(1);

    const projection = readonlyGitProjection({
      repository: repository!,
      refs: [{
        owner: "alice",
        repository: "demo",
        ref: "executions/exec-1",
        sha: HEAD,
        status: "present",
        ownerExecutionId: "exec-1",
        base: "main",
        lifecycleStatus: "retained",
        observedAt: NOW
      }],
      pullRequests: [closed],
      blockers: ["review pending", "review pending"]
    });
    expect(projection.pullRequests[0]?.diffUrl).toBe(
      "https://github.com/alice/demo/pull/1/files"
    );
    expect(projection.branches[0]).toMatchObject({
      ownerExecutionId: "exec-1",
      base: "main",
      status: "retained"
    });
    expect(projection.blockers).toEqual(["review pending"]);
    const serialized = JSON.stringify(projection);
    expect(serialized).not.toContain("cloneUrl");
    expect(serialized).not.toContain("localPath");
    expect(serialized).not.toContain(TOKEN);
  });
});

class RemoteObservingRunner implements GitCommandRunner {
  readonly delegate = new ExecFileGitCommandRunner();
  readonly lostPushes = new Set<string>();
  pushAttempts = 0;
  pushes = 0;
  readonly pushRefspecs: string[] = [];
  private pushFailure?: GitCommandError;
  private reconciliationFaultAfterPushFailure?: Fault;
  private repositoryPath?: string;

  constructor(private readonly fake: FakeGitHub) {
    this.fake.mergeCommitFactory = (pull) => this.createProviderMerge(pull);
  }

  losePushResponseOnce(branch: string): void {
    this.lostPushes.add(branch);
  }

  failPushOnce(error: GitCommandError, reconciliationFault?: Fault): void {
    this.pushFailure = error;
    this.reconciliationFaultAfterPushFailure = reconciliationFault;
  }

  async run(request: GitCommandRequest): Promise<GitCommandResult> {
    if (request.args[0] === "push") {
      this.pushAttempts += 1;
      const refspec = request.args.at(-1) ?? "";
      const match = refspec.match(/^(refs\/heads\/.+|[a-f0-9]{40}):refs\/heads\/(.+)$/);
      if (!match) throw new Error("unexpected push refspec");
      const source = match[1]!;
      const branch = match[2]!;
      if (source.startsWith("refs/") && source !== `refs/heads/${branch}`) throw new Error("unexpected branch push");
      this.pushRefspecs.push(refspec);
      if (this.pushFailure) {
        const failure = this.pushFailure;
        const reconciliationFault = this.reconciliationFaultAfterPushFailure;
        this.pushFailure = undefined;
        this.reconciliationFaultAfterPushFailure = undefined;
        if (reconciliationFault) {
          this.fake.failOnce(
            "GET",
            `/repos/${this.fake.owner}/${this.fake.repositoryName ?? "demo"}/git/ref/heads/${branch}`,
            reconciliationFault
          );
        }
        throw failure;
      }
      const head = await this.delegate.run({
        cwd: request.cwd,
        args: ["rev-parse", `${source}^{commit}`],
        signal: request.signal
      });
      this.repositoryPath = request.cwd;
      this.fake.refs.set(branch, head.stdout.trim());
      this.pushes += 1;
      if (this.lostPushes.delete(branch)) {
        throw new Error(`fixture lost push response for ${branch}`);
      }
      return { code: 0, stdout: `ok ${branch}\n`, stderr: "" };
    }
    if (request.args[0] === "fetch") {
      const refspec = request.args.at(-1) ?? "";
      const match = refspec.match(/^refs\/heads\/(.+):(refs\/openfars\/reconciled\/.+)$/);
      if (!match) throw new Error("unexpected fetch refspec");
      const remoteHead = this.fake.refs.get(match[1]!);
      if (!remoteHead) throw new Error("missing fake remote ref");
      await this.delegate.run({
        cwd: request.cwd,
        args: ["update-ref", match[2]!, remoteHead],
        signal: request.signal
      });
      return { code: 0, stdout: "", stderr: "" };
    }
    return this.delegate.run(request);
  }

  private async createProviderMerge(pull: FakePull): Promise<string> {
    if (!this.repositoryPath) throw new Error("provider merge has no local repository");
    const base = this.fake.refs.get(pull.base.ref);
    if (!base) throw new Error("provider merge has no base ref");
    const tree = await mergedTreeFromBareRepo(this.repositoryPath, base, pull.head.sha);
    const commit = await this.delegate.run({
      cwd: this.repositoryPath,
      args: ["commit-tree", tree, "-p", base, "-p", pull.head.sha, "-F", "-"],
      stdin: "Fake provider merge\n",
      environment: {
        GIT_AUTHOR_NAME: "Fake Provider",
        GIT_AUTHOR_EMAIL: "provider@localhost",
        GIT_COMMITTER_NAME: "Fake Provider",
        GIT_COMMITTER_EMAIL: "provider@localhost"
      }
    });
    return commit.stdout.trim();
  }
}

async function initialPushFixture(name: string) {
  const scratch = await fs.mkdtemp(path.join(os.tmpdir(), `openfars-initial-push-${name}-`));
  roots.push(scratch);
  const projectId = `initial-push-${name}`;
  const projectRoot = path.join(scratch, projectId);
  await fs.mkdir(projectRoot, { recursive: true });
  const fake = new FakeGitHub();
  const store = new MemoryOperationStore();
  const provider = providerFixture({ fake, store }).provider;
  const runner = new RemoteObservingRunner(fake);
  const local = new LocalCollaborationGitService({
    projectId,
    projectRoot,
    operationStore: store,
    runner,
    now: () => NOW
  });
  const facade = new CollaborationGitFacade({
    localGit: local,
    provider,
    operationStore: store
  });
  return {
    facade,
    fake,
    runner,
    store,
    request: {
      projectId,
      repositoryName: `initial-push-${name}`,
      repositoryVisibility: "private" as const,
      title: `Initial push ${name}`,
      operationId: `initial-push-${name}`,
      attempt: 1
    }
  };
}

function observedInitialPushFixture() {
  const projectId = "observed-initial-push";
  const repositoryPath = path.join(os.tmpdir(), projectId, "repository");
  const remote: GitHubRefFact = {
    owner: "alice", repository: "demo", ref: "main", status: "missing", observedAt: NOW
  };
  const store = new MemoryOperationStore();
  const observeRef = vi.fn(async (_owner: string, _repository: string, _ref: string, signal?: AbortSignal) => {
    signal?.throwIfAborted();
    return { ...remote };
  });
  const ensureRepository = vi.fn(async () => ({
    provider: "github" as const, providerId: 1, owner: "alice", name: "demo",
    htmlUrl: "https://github.com/alice/demo", cloneUrl: "https://github.com/alice/demo.git",
    private: true, defaultBranch: "main" as const, observedAt: NOW
  }));
  const pending: { signal: AbortSignal; resolve: (head: string) => void }[] = [];
  const pushMain = vi.fn((signal?: AbortSignal): Promise<string> => new Promise((resolve, reject) => {
    signal!.throwIfAborted();
    const onAbort = () => reject(signal!.reason);
    signal!.addEventListener("abort", onAbort, { once: true });
    pending.push({ signal: signal!, resolve: (head) => {
      signal!.removeEventListener("abort", onAbort);
      resolve(head);
    } });
  }));
  const provider = {
    verifyIdentity: vi.fn(async () => ({ login: "alice", id: 7, requestedScopes: ["repo"], advertisedScopes: ["repo"], observedAt: NOW })),
    ensureRepository,
    observeRef
  } as unknown as GitHubUserProvider;
  const local = {
    projectId, repositoryPath,
    initializeMain: vi.fn(async () => ({ projectId, repositoryPath, branch: "main", head: HEAD, observedAt: NOW })),
    configureOrigin: vi.fn(async () => undefined),
    pushMain
  } as unknown as LocalCollaborationGitService;
  return {
    initializer: new CollaborationGitInitializer(provider, local, store),
    remote, store, observeRef, ensureRepository, pushMain, pending,
    request: {
      projectId, repositoryName: "demo", repositoryVisibility: "private" as const,
      title: "Observed startup", operationId: "observed-startup", attempt: 1
    }
  };
}

describe("initial main push progress observation", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("starts from the exact remote commit while the original push response is still pending", async () => {
    const f = observedInitialPushFixture();
    const result = f.initializer.initialize(f.request);
    await vi.advanceTimersByTimeAsync(0);
    expect(f.pushMain).toHaveBeenCalledTimes(1);
    expect(f.store.initialization.at(-1)?.state.status).toBe("pushing_main");

    Object.assign(f.remote, { status: "present", sha: HEAD });
    await vi.advanceTimersByTimeAsync(3_000);

    expect((await result).state.status).toBe("ready");
    expect(f.pending[0]!.signal.aborted).toBe(true);
    expect(f.store.records.get("observed-startup.push-main"))
      .toMatchObject({ status: "finalized", expectedHead: HEAD, remoteFact: { sha: HEAD } });
    const reads = f.observeRef.mock.calls.length;
    await vi.advanceTimersByTimeAsync(120_000);
    expect(f.observeRef).toHaveBeenCalledTimes(reads);
    expect(f.pushMain).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("keeps a working push alive when one progress query fails", async () => {
    const f = observedInitialPushFixture();
    const result = f.initializer.initialize(f.request);
    await vi.advanceTimersByTimeAsync(0);
    f.observeRef.mockRejectedValueOnce(new GitHubProviderError("Temporary read outage", true));
    Object.assign(f.remote, { status: "present", sha: HEAD });

    await vi.advanceTimersByTimeAsync(3_000);
    expect(f.pending[0]!.signal.aborted).toBe(false);
    expect(f.store.initialization.at(-1)?.state.status).toBe("pushing_main");
    await vi.advanceTimersByTimeAsync(3_000);

    expect((await result).state.status).toBe("ready");
    expect(f.pushMain).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("bounds slow progress queries and never runs overlapping queries", async () => {
    const f = observedInitialPushFixture();
    const result = f.initializer.initialize(f.request);
    await vi.advanceTimersByTimeAsync(0);
    let querySignal: AbortSignal | undefined;
    f.observeRef.mockImplementationOnce(async (_owner, _repository, _ref, signal) => new Promise(() => {
      querySignal = signal;
    }));

    await vi.advanceTimersByTimeAsync(6_000);
    expect(f.observeRef).toHaveBeenCalledTimes(2);
    expect(f.pending[0]!.signal.aborted).toBe(false);
    Object.assign(f.remote, { status: "present", sha: HEAD });
    await vi.advanceTimersByTimeAsync(3_000);

    expect(querySignal?.aborted).toBe(true);
    expect((await result).state.status).toBe("ready");
    expect(f.observeRef).toHaveBeenCalledTimes(3);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("rechecks remote absence after 30 seconds before retrying the same initial push", async () => {
    const f = observedInitialPushFixture();
    const result = f.initializer.initialize(f.request);
    await vi.advanceTimersByTimeAsync(30_000);

    expect(f.pushMain).toHaveBeenCalledTimes(2);
    expect(f.pending[0]!.signal.aborted).toBe(true);
    expect(f.pending[1]!.signal.aborted).toBe(false);
    expect(f.ensureRepository).toHaveBeenCalledTimes(1);
    expect(f.store.records.get("observed-startup.push-main")?.status).toBe("uncertain");
    Object.assign(f.remote, { status: "present", sha: HEAD });
    f.pending[1]!.resolve(HEAD);

    expect((await result).state.status).toBe("ready");
    expect(f.store.records.get("observed-startup.push-main"))
      .toMatchObject({ status: "finalized", expectedHead: HEAD, remoteFact: { sha: HEAD } });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("retains uncertainty without another push when the deadline query cannot establish remote truth", async () => {
    const f = observedInitialPushFixture();
    const began = Date.now();
    f.observeRef.mockImplementation(async () => {
      if (Date.now() - began >= 30_000) throw new GitHubProviderError("Remote truth unavailable", true);
      return { ...f.remote };
    });
    const result = f.initializer.initialize(f.request);
    await vi.advanceTimersByTimeAsync(30_000);

    expect((await result).state.status).toBe("failed");
    expect(f.pushMain).toHaveBeenCalledTimes(1);
    expect(f.store.records.get("observed-startup.push-main")?.status).toBe("uncertain");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("never treats an existing main at another commit as successful startup", async () => {
    const f = observedInitialPushFixture();
    const result = f.initializer.initialize(f.request);
    await vi.advanceTimersByTimeAsync(0);
    Object.assign(f.remote, { status: "present", sha: UPDATED_HEAD });
    await vi.advanceTimersByTimeAsync(3_000);

    expect((await result).state.status).toBe("failed");
    expect(f.pending[0]!.signal.aborted).toBe(true);
    expect(f.pushMain).toHaveBeenCalledTimes(1);
    expect(f.store.records.get("observed-startup.push-main")?.status).toBe("uncertain");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("honors cancellation even when the expected remote commit has arrived", async () => {
    const f = observedInitialPushFixture();
    const controller = new AbortController();
    const result = f.initializer.initialize({ ...f.request, signal: controller.signal });
    await vi.advanceTimersByTimeAsync(0);
    Object.assign(f.remote, { status: "present", sha: HEAD });
    controller.abort();
    await vi.advanceTimersByTimeAsync(0);

    expect((await result).state.status).toBe("failed");
    expect(f.pending[0]!.signal.aborted).toBe(true);
    expect(f.store.initialization.some((checkpoint) => checkpoint.state.status === "ready")).toBe(false);
    expect(f.pushMain).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("bounds repeated unconfirmed startup pushes without waiting for the 120-second Git timeout", async () => {
    const f = observedInitialPushFixture();
    const result = f.initializer.initialize(f.request);
    await vi.advanceTimersByTimeAsync(60_000);

    expect(await result).toMatchObject({
      state: { status: "failed" },
      failure: { code: "GITHUB_RESULT_UNCERTAIN", cause: { publicData: { timedOut: true, timeoutMs: 30_000 } } }
    });
    expect(f.pushMain).toHaveBeenCalledTimes(2);
    expect(f.pending.every((push) => push.signal.aborted)).toBe(true);
    expect(f.store.records.get("observed-startup.push-main")?.status).toBe("uncertain");
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("CollaborationGitFacade initialization", () => {
  it("initializes a Workflow-named repository from the same prepared operation after a pre-creation failure", async () => {
    const f = await initialPushFixture("workflow-startup");
    const repositoryName = "workflow-9505293cd6";
    f.fake.failOnce("GET", `/repos/alice/${repositoryName}`, "server");
    const first = await f.facade.initialize({ ...f.request, repositoryName });
    expect(first.state.status).toBe("failed");
    expect(first.state.initialization?.completedSteps).toEqual(["github.authorized"]);
    expect(f.store.records.get(f.request.operationId)?.status).toBe("prepared");
    expect(f.fake.count("POST", "/user/repos")).toBe(0);
    const retried = await f.facade.initialize({ ...f.request, repositoryName, attempt: 2, priorState: first.state });
    expect(retried.state.status).toBe("ready");
    expect(retried.state.repository?.name).toBe(repositoryName);
    expect(retried.localRepository?.head).toBe(f.fake.refs.get("main"));
    expect(f.fake.count("POST", "/user/repos")).toBe(1);
    expect(f.runner.pushes).toBe(1);
  });

  it("persists every stage and retries the same repo/local commit/push in place", async () => {
    const scratch = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-git-provider-"));
    roots.push(scratch);
    const projectId = "provider-init-project";
    const projectRoot = path.join(scratch, projectId);
    await fs.mkdir(projectRoot, { recursive: true });
    const fake = new FakeGitHub();
    const store = new MemoryOperationStore();
    const provider = providerFixture({ fake, store }).provider;
    const runner = new RemoteObservingRunner(fake);
    const local = new LocalCollaborationGitService({
      projectId,
      projectRoot,
      operationStore: store,
      runner,
      now: () => NOW
    });
    const facade = new CollaborationGitFacade({ localGit: local, provider, operationStore: store });
    fake.failOnce("POST", "/user/repos", "lost");

    const first = await facade.initialize({
      projectId,
      repositoryName: "demo",
      repositoryVisibility: "private",
      title: "Initialized project",
      operationId: "initialize-1",
      attempt: 1,
      priorState: {
        enabled: true,
        status: "authorizing",
        provider: "github",
        account: {
          id: "gha_11111111111111111111111111111111",
          login: "fixture-user",
          providerUserId: 7
        },
        requestedRepositoryName: "demo",
        initialization: {
          operationId: "initialize-1",
          attempt: 1,
          completedSteps: []
        }
      }
    });
    expect(first.state.status).toBe("ready");
    expect(first.state.account).toEqual({
      id: "gha_11111111111111111111111111111111",
      login: "fixture-user",
      providerUserId: 7
    });
    expect(first.state.requestedRepositoryName).toBe("demo");
    expect(first.localRepository?.head).toBe(fake.refs.get("main"));
    expect(fake.count("POST", "/user/repos")).toBe(1);
    expect(runner.pushes).toBe(1);
    expect(store.initialization.map((entry) => entry.state.status)).toEqual([
      "authorizing",
      "creating_repository",
      "initializing_local",
      "pushing_main",
      "ready"
    ]);
    expect(store.initialization.every((entry) =>
      entry.state.account?.id === "gha_11111111111111111111111111111111" &&
      entry.state.requestedRepositoryName === "demo"
    )).toBe(true);

    const second = await facade.initialize({
      projectId,
      repositoryName: "demo",
      repositoryVisibility: "private",
      title: "Initialized project",
      operationId: "initialize-1",
      attempt: 2,
      priorState: first.state
    });
    expect(second.state.status).toBe("ready");
    expect(second.localRepository?.head).toBe(first.localRepository?.head);
    expect(fake.count("POST", "/user/repos")).toBe(1);
    expect(runner.pushes).toBe(1);
  });

  it("distinguishes absent, received-but-lost, and temporarily unknowable initial pushes", async () => {
    const absent = await initialPushFixture("absent");
    absent.runner.failPushOnce(new GitCommandError(
      128,
      "fixture disconnected before the remote accepted initial main",
      { command: "push", stderr: "fatal: connection closed before send" }
    ));
    const absentFirst = await absent.facade.initialize(absent.request);
    expect(absentFirst).toMatchObject({
      failure: expect.objectContaining({
        code: "GITHUB_RESULT_UNCERTAIN",
        cause: expect.objectContaining({
          code: "GIT_COMMAND_FAILED",
          publicData: expect.objectContaining({ stderr: "fatal: connection closed before send" })
        })
      })
    });
    expect(absentFirst.state).toMatchObject({
      status: "failed",
      initialization: {
        operationId: absent.request.operationId,
        attempt: 1,
        error: expect.stringContaining("GITHUB_RESULT_UNCERTAIN")
      }
    });
    expect(absent.fake.refs.has("main")).toBe(false);
    expect(absent.store.records.get(`${absent.request.operationId}.push-main`)).toMatchObject({
      status: "uncertain",
      expectedHead: absentFirst.localRepository?.head,
      expectedBase: "main"
    });
    const absentRetry = await absent.facade.initialize({
      ...absent.request,
      attempt: 2,
      priorState: absentFirst.state
    });
    expect(absentRetry.state.status).toBe("ready");
    expect(absentRetry.localRepository?.head).toBe(absentFirst.localRepository?.head);
    expect(absent.fake.refs.get("main")).toBe(absentFirst.localRepository?.head);
    expect(absent.fake.count("POST", "/user/repos")).toBe(1);
    expect(absent.runner).toMatchObject({ pushAttempts: 2, pushes: 1 });

    const lostResponse = await initialPushFixture("lost-response");
    lostResponse.runner.losePushResponseOnce("main");
    const lostResult = await lostResponse.facade.initialize(lostResponse.request);
    expect(lostResult.state.status).toBe("ready");
    expect(lostResponse.fake.refs.get("main")).toBe(lostResult.localRepository?.head);
    expect(lostResponse.fake.count("POST", "/user/repos")).toBe(1);
    expect(lostResponse.runner).toMatchObject({ pushAttempts: 1, pushes: 1 });
    expect(lostResponse.store.records.get(`${lostResponse.request.operationId}.push-main`))
      .toMatchObject({ status: "finalized", expectedHead: lostResult.localRepository?.head });

    const unknowable = await initialPushFixture("unknowable");
    unknowable.runner.failPushOnce(new GitCommandError(
      128,
      "fixture connection broke while sending initial main",
      { command: "push", stderr: "fatal: connection reset mid-stream" }
    ), "server");
    const unknowableFirst = await unknowable.facade.initialize(unknowable.request);
    expect(unknowableFirst.state.status).toBe("failed");
    expect(unknowable.store.records.get(`${unknowable.request.operationId}.push-main`)?.status)
      .toBe("uncertain");
    expect(unknowable.runner).toMatchObject({ pushAttempts: 1, pushes: 0 });

    // The first reconciliation request could not determine the remote truth.
    // Before retry, the provider becomes observable and confirms that the
    // original push did arrive. The retry must finalize without replaying it.
    unknowable.fake.refs.set("main", unknowableFirst.localRepository!.head);
    const unknowableRetry = await unknowable.facade.initialize({
      ...unknowable.request,
      attempt: 2,
      priorState: unknowableFirst.state
    });
    expect(unknowableRetry.state.status).toBe("ready");
    expect(unknowableRetry.localRepository?.head).toBe(unknowableFirst.localRepository?.head);
    expect(unknowable.fake.count("POST", "/user/repos")).toBe(1);
    expect(unknowable.runner).toMatchObject({ pushAttempts: 1, pushes: 0 });
    expect(unknowable.store.records.get(`${unknowable.request.operationId}.push-main`))
      .toMatchObject({ status: "finalized", expectedHead: unknowableFirst.localRepository?.head });
  });

  it("verifies an old merged PR read-only, then delivers its revert and Memory through a new task's distinct PR", async () => {
    const f = await initialPushFixture("historical-repair");
    const initialized = await f.facade.initialize(f.request);
    const repository = initialized.repository!;
    // The service owns this exact repository; use its trusted session paths.
    const projectRoot = path.dirname(initialized.localRepository!.repositoryPath);
    const owner = (id: string) => ({ id, agentId: "author", purpose: "delivery" as const, ownershipEpoch: 1,
      executionBranch: `executions/${id}`, worktreePath: path.join(projectRoot, "git-worktrees", id) });
    const original = owner("original-result");
    f.store.authorities.set(original.id, { epoch: 1, branch: original.executionBranch });
    await f.facade.sessionBegin(original, 1, { kind: "delivery", base: { kind: "main" } });
    await fs.writeFile(path.join(original.worktreePath, "result.txt"), "Original accepted result\n");
    await harnessCommit(original.worktreePath, "Original result", ["result.txt"]);
    const pushed = await f.facade.checkpointAndPush({ repository, execution: original, ownershipEpoch: 1,
      operationId: "source-push", checkpointKind: "report" });
    const pull = await f.facade.createPullRequest({ repository, execution: original, ownershipEpoch: 1,
      operationId: "source-create", expectedHead: pushed.checkpoint.commitSha, base: "main", title: "Original result", body: "Original task" });
    const merged = await f.facade.mergePullRequest({ repository, execution: original, ownershipEpoch: 1,
      operationId: "source-merge", providerNumber: pull.providerNumber, expectedHead: pushed.checkpoint.commitSha, expectedBase: "main" });
    const immutableOperation = structuredClone(f.store.records.get("source-merge"));
    f.store.authorities.delete(original.id);
    const repair = owner("repair-result");
    f.store.authorities.set(repair.id, { epoch: 1, branch: repair.executionBranch });
    await f.facade.sessionBegin(repair, 1, { kind: "delivery", base: { kind: "main" } });
    const facts: AgentGitFacts = {};
    const requests: unknown[] = [];
    let seq = 0;
    const call = (action: ControlAction) => executeAgentGitTool({ git: f.facade, repository, execution: repair, base: "main", facts,
      recordedOperation: id => f.store.records.get(id),
      recordRequest: request => { requests.push(request); return { ...request, schemaVersion: 1, operationAlreadyExisted: false }; },
      envelope: { projectId: f.request.projectId, agent: repair.agentId, invocationId: "original-repair-session",
        callId: `repair-${seq++}`, stateVersion: 1, receivedAt: NOW, action } });
    const source = await call({ tool: "github_get_pr", sourceOperationId: "source-merge" }) as {
      parents: string[]; source: { mergeCommitSha: string }; readOnly: boolean
    };
    expect(source).toMatchObject({ readOnly: true, source: { mergeCommitSha: merged.mergeCommitSha, headSha: pushed.checkpoint.commitSha } });
    expect(source.parents).toHaveLength(2);
    expect(facts).toEqual({});
    expect(f.runner.pushes).toBe(2);
    await expect(call({ tool: "github_get_pr", providerNumber: pull.providerNumber })).rejects.toThrow();
    await expect(call({ tool: "github_get_pr", sourceOperationId: "missing-other-project" })).rejects.toThrow("not bound");
    const reverted = await call({ tool: "git_revert", mode: "apply", target: merged.mergeCommitSha!,
      expectedHead: merged.mergeCommitSha!, sourceOperationId: "source-merge", mainline: 1 }) as { status: string; afterHead: string };
    expect(reverted.status).toBe("committed");
    expect(facts.pushedHeadSha).toBeUndefined();
    expect(f.store.records.get("source-merge")).toEqual(immutableOperation);
    await fs.mkdir(path.join(repair.worktreePath, "agent-memory", repair.agentId), { recursive: true });
    await fs.writeFile(path.join(repair.worktreePath, "agent-memory", repair.agentId, "Memory.md"), "Verified original PR and delivered its repair.\n");
    const deliveryHead = await harnessCommit(repair.worktreePath, "Repair task Memory", [`agent-memory/${repair.agentId}/Memory.md`]);
    expect(deliveryHead).not.toBe(reverted.afterHead);
    expect(await call({ tool: "git_push" })).toMatchObject({ status: "pushed", checkpoint: { commitSha: deliveryHead } });
    const repairPull = await call({ tool: "github_create_pr", base: "main", title: "Repair result", body: "New repair task and exact Memory head" }) as { providerNumber: number };
    expect(repairPull.providerNumber).not.toBe(pull.providerNumber);
    expect(await call({ tool: "github_merge_pr", providerNumber: repairPull.providerNumber })).toMatchObject({ status: "merged", headSha: deliveryHead,
      localSynchronization: { targetBranch: "main" } });
    expect(f.store.records.get("source-merge")).toEqual(immutableOperation);
    expect(requests).toEqual(expect.arrayContaining([expect.objectContaining({ action: expect.objectContaining({ tool: "git_revert", mode: "apply" }) })]));
  });

  it("drives retained session, sequential checkpoint pushes, PR merge and projection", async () => {
    const scratch = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-git-facade-"));
    roots.push(scratch);
    const projectId = "facade-project";
    const projectRoot = path.join(scratch, projectId);
    await fs.mkdir(projectRoot, { recursive: true });
    const fake = new FakeGitHub();
    const store = new MemoryOperationStore();
    const provider = providerFixture({ fake, store }).provider;
    const runner = new RemoteObservingRunner(fake);
    const local = new LocalCollaborationGitService({
      projectId,
      projectRoot,
      operationStore: store,
      runner,
      now: () => NOW
    });
    const facade = new CollaborationGitFacade({ localGit: local, provider, operationStore: store });
    const initialized = await facade.initialize({
      projectId,
      repositoryName: "demo",
      repositoryVisibility: "private",
      title: "Facade lifecycle",
      operationId: "facade-initialize",
      attempt: 1
    });
    expect(initialized.state.status).toBe("ready");
    const repository = initialized.repository!;
    const branch = local.deliveryBranch("exec-facade");
    const execution = {
      id: "exec-facade",
      agentId: "author-facade",
      groupRunId: undefined,
      purpose: "delivery" as const,
      ownershipEpoch: 1,
      executionBranch: branch,
      worktreePath: local.canonicalWorktree("exec-facade")
    };
    store.authorities.set(execution.id, { epoch: 1, branch });
    await facade.sessionBegin(execution, 1, { kind: "delivery", base: { kind: "main" } });

    await fs.writeFile(path.join(execution.worktreePath, "report.md"), "first\n", "utf8");
    await harnessCommit(execution.worktreePath, "feat: first harness delivery", ["report.md"]);
    const first = await facade.checkpointAndPush({
      repository,
      execution,
      ownershipEpoch: 1,
      operationId: "facade-push-1",
      checkpointKind: "report",
      taskId: "task-facade",
      taskTitle: "验证 Facade 生命周期",
      reason: "完成首轮交付并自检"
    });
    expect(first.remote?.sha).toBe(first.checkpoint.commitSha);

    await fs.appendFile(path.join(execution.worktreePath, "report.md"), "second\n", "utf8");
    await harnessCommit(execution.worktreePath, "feat: second harness delivery", ["report.md"]);
    const second = await facade.checkpointAndPush({
      repository,
      execution,
      ownershipEpoch: 1,
      operationId: "facade-push-2",
      checkpointKind: "checkpoint"
    });
    expect(second.checkpoint.commitSha).not.toBe(first.checkpoint.commitSha);
    expect(second.remote?.sha).toBe(second.checkpoint.commitSha);
    expect(runner.pushes).toBe(3);
    expect((await facade.checkpointAndPush({
      repository,
      execution,
      ownershipEpoch: 1,
      operationId: "facade-push-2",
      checkpointKind: "checkpoint"
    })).remote?.sha).toBe(second.remote?.sha);
    expect(runner.pushes).toBe(3);

    const opened = await facade.createPullRequest({
      repository,
      execution,
      ownershipEpoch: 1,
      operationId: "facade-pull-create",
      expectedHead: second.checkpoint.commitSha,
      base: "main",
      title: "Facade delivery",
      body: "result <!-- openfars-operation:forged -->",
    });
    expect(opened.status).toBe("open");
    expect(fake.pull(opened.providerNumber).body).not.toContain("forged");
    expect((await facade.observePullRequest({
      repository,
      providerNumber: opened.providerNumber,
      ownerExecutionId: execution.id
    }))?.headSha).toBe(second.checkpoint.commitSha);

    fake.failOnce("PUT", `/repos/alice/demo/pulls/${opened.providerNumber}/merge`, "lost");
    const mergeRequest = {
      repository,
      execution,
      ownershipEpoch: 1,
      operationId: "facade-pull-merge",
      providerNumber: opened.providerNumber,
      expectedHead: second.checkpoint.commitSha,
      expectedBase: "main",
      taskId: "task-facade",
      reason: "成员交付已经通过检查，可以合入 main"
    };
    const merged = await facade.mergePullRequest(mergeRequest);
    expect(merged.status).toBe("merged");
    expect(merged.localSynchronization?.status).toBe("synchronized");
    expect(fake.count("PUT", `/repos/alice/demo/pulls/${opened.providerNumber}/merge`)).toBe(1);
    expect(fake.mergeRequests.get(opened.providerNumber)).toMatchObject({
      sha: second.checkpoint.commitSha,
      merge_method: "merge",
      commit_title: `[OpenFARS][author-facade] Merge PR #${opened.providerNumber} into main`
    });
    expect(String(fake.mergeRequests.get(opened.providerNumber)?.commit_message)).toContain("OpenFARS-Agent: author-facade");
    expect(String(fake.mergeRequests.get(opened.providerNumber)?.commit_message)).toContain("OpenFARS-Task: task-facade");
    expect(String(fake.mergeRequests.get(opened.providerNumber)?.commit_message)).toContain("OpenFARS-Reason: 成员交付已经通过检查，可以合入 main");
    const replayedMerge = await facade.mergePullRequest(mergeRequest);
    expect(replayedMerge.status).toBe("merged");
    expect(replayedMerge.localSynchronization?.status).toBe("already_synchronized");
    expect(fake.count("PUT", `/repos/alice/demo/pulls/${opened.providerNumber}/merge`)).toBe(1);
    const projection = facade.readonlyProjection({
      repository,
      refs: [second.remote],
      pullRequests: [merged]
    });
    expect(projection).toMatchObject({
      repository: { owner: "alice", name: "demo", status: "ready" },
      pullRequests: [{ ownerExecutionId: "exec-facade", status: "merged" }]
    });

    store.authorities.set(execution.id, { epoch: 2, branch });
    await expect(facade.closePullRequest({
      repository,
      execution,
      ownershipEpoch: 1,
      operationId: "facade-stale-close",
      providerNumber: opened.providerNumber,
      expectedHead: second.checkpoint.commitSha,
      expectedBase: "main"
    })).rejects.toThrow("stale execution authority");
  });

  it.each(["prepared", "observed", "uncertain"] as const)(
    "lets the original Agent reconcile its legacy %s push journal without another commit or push", async (status) => {
      const scratch = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-agent-legacy-push-")); roots.push(scratch);
      const projectId = "agent-legacy-push"; const projectRoot = path.join(scratch, projectId);
      await fs.mkdir(projectRoot, { recursive: true });
      const fake = new FakeGitHub(); const store = new MemoryOperationStore();
      const runner = new RemoteObservingRunner(fake); const provider = providerFixture({ fake, store }).provider;
      const local = new LocalCollaborationGitService({ projectId, projectRoot, operationStore: store, runner, now: () => NOW });
      const facade = new CollaborationGitFacade({ localGit: local, provider, operationStore: store });
      const initialized = await facade.initialize({ projectId, repositoryName: "demo", repositoryVisibility: "private",
        title: "Original push journal", operationId: "legacy-push-initialize", attempt: 1 });
      const repository = initialized.repository!;
      const execution = { id: "legacy-worker", agentId: "worker", purpose: "delivery" as const, ownershipEpoch: 1,
        executionBranch: local.deliveryBranch("legacy-worker"), worktreePath: local.canonicalWorktree("legacy-worker") };
      store.authorities.set(execution.id, { epoch: 1, branch: execution.executionBranch });
      await facade.sessionBegin(execution, 1, { kind: "delivery", base: { kind: "main" } });
      await fs.writeFile(path.join(execution.worktreePath, "business.txt"), "Original result, implemented once\n");
      const head = await harnessCommit(execution.worktreePath, "feat: original business", ["business.txt"]);
      const operationId = `scoped-checkpoint-${execution.id}-epoch-1`;
      if (status === "prepared") store.crashBeforeTransitionOnce(operationId, "observed");
      else store.crashAfterTransitionOnce(operationId, status);
      if (status === "uncertain") runner.failPushOnce(new GitCommandError(128, "transport interrupted", { command: "push", stderr: "transport interrupted" }));
      await expect(facade.checkpointAndPush({ repository, execution, ownershipEpoch: 1,
        operationId, checkpointKind: "checkpoint" })).rejects.toThrow(/simulated crash/);
      const original = structuredClone(store.records.get(operationId)!);
      expect(original).toMatchObject({ id: operationId, kind: "git.push", status, expectedHead: head });
      const facts: AgentGitFacts = {};
      let calls = 0;
      const call = (retry?: boolean) => executeAgentGitTool({ git: facade, repository, execution, base: "main", facts,
        envelope: { projectId, agent: execution.agentId, invocationId: "original-agent-repair", callId: `reconcile-${++calls}`,
          stateVersion: 1, receivedAt: NOW, action: { tool: "git_reconcile_push", operationId, ...(retry === undefined ? {} : { retry }) } } });
      await fs.writeFile(path.join(execution.worktreePath, "unfinished-note.txt"), "Keep my unfinished work\n");
      if (status === "uncertain") {
        const attempts = runner.pushAttempts;
        expect(await call()).toMatchObject({ status: "unconfirmed", operation: original, remote: { status: "missing" } });
        expect(await call(false)).toMatchObject({ status: "unconfirmed", remote: { status: "missing" } });
        expect(runner.pushAttempts).toBe(attempts);
        expect(store.records.get(operationId)).toEqual(original);
        expect(facts.pushedHeadSha).toBeUndefined();
        // After seeing missing, the original Agent explicitly chooses retry.
        // No checkpoint of the unfinished note and no new journal are made.
        expect(await call(true)).toMatchObject({ status: "confirmed", pushOutcome: "sent",
          operation: { id: operationId, status: "finalized" }, remote: { sha: head } });
        expect(runner.pushRefspecs.at(-1)).toBe(`${head}:refs/heads/${execution.executionBranch}`);
        expect(runner.pushAttempts).toBe(attempts + 1);
      }
      const pushes = runner.pushes;
      const { remoteFact: _pendingFact, ...originalRequest } = original;
      const confirmedFact = { owner: repository.owner, repository: repository.name,
        ref: execution.executionBranch, sha: head, status: "present", observedAt: NOW };
      expect(await call()).toMatchObject({ status: "confirmed", operation: { ...originalRequest, status: "finalized", remoteFact: confirmedFact },
        remote: { ref: execution.executionBranch, sha: head, status: "present" } });
      expect(store.records.get(operationId)).toMatchObject({ ...originalRequest, status: "finalized", remoteFact: confirmedFact });
      expect(facts.pushedHeadSha).toBe(head);
      const finalized = structuredClone(store.records.get(operationId)!);
      expect(await call(true)).toMatchObject({ status: "confirmed", operation: finalized });
      expect(store.records.get(operationId)).toEqual(finalized);
      expect(runner.pushes).toBe(pushes);
      expect(fake.count("POST", "/repos/alice/demo/pulls")).toBe(0);
      expect(await fs.readFile(path.join(execution.worktreePath, "unfinished-note.txt"), "utf8")).toBe("Keep my unfinished work\n");
      const current = await runner.run({ cwd: execution.worktreePath, args: ["rev-parse", "HEAD"] });
      expect(current.stdout.trim()).toBe(head);
      expect([...store.records.keys()].filter((key) => key.startsWith("agent-git-"))).toEqual([]);

      // Actual provider failures and an unconfirmed changed ref remain Agent
      // outcomes. They cannot reinterpret the old immutable journal as new work.
      store.records.set(operationId, structuredClone(original)); facts.pushedHeadSha = head;
      fake.refs.set(execution.executionBranch, UPDATED_HEAD);
      expect(await call()).toMatchObject({ status: "unconfirmed", operation: original,
        remote: { status: "present", sha: UPDATED_HEAD } });
      expect(store.records.get(operationId)).toEqual(original); expect(facts.pushedHeadSha).toBeUndefined();
      fake.refs.set(execution.executionBranch, head); fake.authorizationStatus = 401;
      await expect(call()).rejects.toBeInstanceOf(GitHubAuthorizationError);
      expect(store.records.get(operationId)).toEqual(original); fake.authorizationStatus = undefined;
      const observe = provider.observeRef.bind(provider);
      const lateRevocation = vi.spyOn(provider, "observeRef").mockImplementation(async (...args) => {
        const remote = await observe(...args);
        store.authorities.set(execution.id, { epoch: 2, branch: execution.executionBranch });
        return remote;
      });
      await expect(call()).rejects.toThrow("stale execution authority");
      expect(store.records.get(operationId)).toEqual(original); lateRevocation.mockRestore();
      expect(runner.pushes).toBe(pushes);
    });

  it.each(["empty_id", "missing", "ownerless", "foreign_owner", "epoch", "branch", "head", "kind", "failed"] as const)(
    "refuses to observe or retry an unavailable or incompatible retained push (%s)", async (mode) => {
      const store = new MemoryOperationStore();
      const execution = { id: "journal-owner", agentId: "worker", purpose: "delivery" as const, ownershipEpoch: 1,
        executionBranch: "executions/journal-owner", worktreePath: "/tmp/journal-owner" };
      const operation: OperationRecord = { id: "legacy-push", kind: "git.push", ownerExecutionId: execution.id,
        ownershipEpoch: 1, expectedBase: execution.executionBranch, expectedHead: HEAD, payloadHash: "a".repeat(64), status: "uncertain" };
      if (mode === "ownerless") operation.ownerExecutionId = undefined;
      if (mode === "foreign_owner") operation.ownerExecutionId = "foreign";
      if (mode === "epoch") operation.ownershipEpoch = 2;
      if (mode === "branch") operation.expectedBase = "executions/foreign";
      if (mode === "head") operation.expectedHead = "invalid";
      if (mode === "kind") operation.kind = "pull.merge";
      if (mode === "failed") operation.status = "failed";
      if (mode !== "missing") store.records.set(operation.id, structuredClone(operation));
      store.authorities.set(execution.id, { epoch: 1, branch: execution.executionBranch });
      const observeRef = vi.fn(), pushRetainedExecution = vi.fn();
      const facade = new CollaborationGitFacade({ operationStore: store,
        localGit: { projectId: "journal-project", pushRetainedExecution } as never,
        provider: { observeRef } as never });
      const request = { repository: { owner: "alice", name: "demo", observedAt: NOW }, execution, ownershipEpoch: 1,
        operationId: mode === "empty_id" ? "" : operation.id, retry: true };
      if (mode === "failed") expect(await facade.reconcilePushOperation(request)).toEqual({ status: "failed", operation });
      else await expect(facade.reconcilePushOperation(request)).rejects.toThrow(/Retained push/);
      expect(observeRef).not.toHaveBeenCalled(); expect(pushRetainedExecution).not.toHaveBeenCalled();
      if (mode !== "missing") expect(store.records.get(operation.id)).toEqual(operation);
    });

  it.each(["lost_response", "unknown_remote", "unauthorized", "moved_local", "advanced_remote", "revoked", "changed_record"] as const)(
    "returns the original Agent's explicit retained-push retry outcome for %s without new work", async (mode) => {
      const scratch = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-retained-push-retry-")); roots.push(scratch);
      const projectId = "retained-push-retry", projectRoot = path.join(scratch, projectId);
      await fs.mkdir(projectRoot, { recursive: true });
      const fake = new FakeGitHub(), store = new MemoryOperationStore(), runner = new RemoteObservingRunner(fake);
      const provider = providerFixture({ fake, store }).provider;
      const local = new LocalCollaborationGitService({ projectId, projectRoot, operationStore: store, runner, now: () => NOW });
      const facade = new CollaborationGitFacade({ localGit: local, provider, operationStore: store });
      const initialized = await facade.initialize({ projectId, repositoryName: "demo", repositoryVisibility: "private",
        title: "Retained Agent push", operationId: "retained-initialize", attempt: 1 });
      const repository = initialized.repository!;
      const execution = { id: "retained-worker", agentId: "worker", purpose: "delivery" as const, ownershipEpoch: 1,
        executionBranch: local.deliveryBranch("retained-worker"), worktreePath: local.canonicalWorktree("retained-worker") };
      store.authorities.set(execution.id, { epoch: 1, branch: execution.executionBranch });
      await facade.sessionBegin(execution, 1, { kind: "delivery", base: { kind: "main" } });
      await fs.writeFile(path.join(execution.worktreePath, "business.txt"), "Original work\n");
      const head = await harnessCommit(execution.worktreePath, "feat: original work", ["business.txt"]);
      const operationId = `push-${execution.id}`;
      runner.failPushOnce(new GitCommandError(128, "transport interrupted", { command: "push", stderr: "transport interrupted" }));
      store.crashAfterTransitionOnce(operationId, "uncertain");
      await expect(facade.checkpointAndPush({ repository, execution, ownershipEpoch: 1, operationId,
        checkpointKind: "checkpoint" })).rejects.toThrow("simulated crash");
      const original = structuredClone(store.records.get(operationId)!);
      await fs.writeFile(path.join(execution.worktreePath, "unfinished.txt"), "Do not checkpoint this note\n");
      const initialKeys = [...store.records.keys()];
      const attempts = runner.pushAttempts;
      let expectedHead = head;
      if (mode === "moved_local" || mode === "advanced_remote") {
        await fs.writeFile(path.join(execution.worktreePath, "later.txt"), "Later Agent commit\n");
        expectedHead = await harnessCommit(execution.worktreePath, "feat: later work", ["later.txt"]);
        if (mode === "advanced_remote") fake.refs.set(execution.executionBranch, expectedHead);
      }
      if (mode === "unauthorized") runner.failPushOnce(new GitCommandError(128, "Push was rejected", { command: "push", stderr: "The requested URL returned error: 403" }));
      if (mode === "unknown_remote") runner.failPushOnce(new GitCommandError(128, "transport interrupted", { command: "push", stderr: "transport interrupted" }), "server");
      const run = runner.run.bind(runner);
      const lost = mode === "lost_response" ? vi.spyOn(runner, "run").mockImplementation(async (request) => {
        const result = await run(request);
        if (request.args[0] === "push") throw new GitCommandError(128, "connection lost after send", { command: "push", stderr: "connection lost after send" });
        return result;
      }) : undefined;
      const observe = provider.observeRef.bind(provider);
      const revoke = mode === "revoked" || mode === "changed_record" ? vi.spyOn(provider, "observeRef").mockImplementation(async (...args) => {
        const result = await observe(...args);
        if (mode === "revoked") store.authorities.set(execution.id, { epoch: 2, branch: execution.executionBranch });
        else store.records.set(operationId, { ...original, payloadHash: "changed" });
        return result;
      }) : undefined;
      const call = () => facade.reconcilePushOperation({ repository, execution, ownershipEpoch: 1, operationId, retry: true });
      if (mode === "lost_response") {
        expect(await call()).toMatchObject({ status: "confirmed", pushOutcome: "uncertain",
          operation: { id: operationId, status: "finalized", payloadHash: original.payloadHash }, remote: { sha: head } });
        expect(runner.pushAttempts).toBe(attempts + 1);
      } else if (mode === "unknown_remote") {
        await expect(call()).rejects.toThrow("server failed [REDACTED]");
        expect(store.records.get(operationId)).toMatchObject({ id: operationId, status: "uncertain", payloadHash: original.payloadHash });
        expect(runner.pushAttempts).toBe(attempts + 1);
        expect(store.records.get(operationId)?.remoteFact).not.toHaveProperty("stderr");
      } else {
        if (mode === "unauthorized") await expect(call()).rejects.toBeInstanceOf(GitHubAuthorizationError);
        else await expect(call()).rejects.toThrow(mode === "moved_local" ? /worktree moved/
          : mode === "advanced_remote" ? /overwrite a moved remote/ : mode === "revoked" ? /stale execution/ : /immutable request/);
        expect(runner.pushAttempts).toBe(attempts + (mode === "unauthorized" ? 1 : 0));
        if (mode !== "changed_record") expect(store.records.get(operationId)).toEqual(original);
      }
      lost?.mockRestore(); revoke?.mockRestore();
      expect([...store.records.keys()]).toEqual(initialKeys);
      expect(fake.count("POST", "/repos/alice/demo/pulls")).toBe(0);
      expect(await fs.readFile(path.join(execution.worktreePath, "unfinished.txt"), "utf8")).toBe("Do not checkpoint this note\n");
      expect((await runner.run({ cwd: execution.worktreePath, args: ["rev-parse", "HEAD"] })).stdout.trim()).toBe(expectedHead);
    });

  it.each(["observed", "uncertain"] as const)(
    "settles the original %s merge journal through an explicit Agent replay after GitHub already merged", async (pendingStatus) => {
      const scratch = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-agent-merged-journal-")); roots.push(scratch);
      const projectId = "agent-merged-journal"; const projectRoot = path.join(scratch, projectId);
      await fs.mkdir(projectRoot, { recursive: true });
      const fake = new FakeGitHub(); const store = new MemoryOperationStore();
      const runner = new RemoteObservingRunner(fake);
      const local = new LocalCollaborationGitService({ projectId, projectRoot, operationStore: store, runner, now: () => NOW });
      const facade = new CollaborationGitFacade({ localGit: local, provider: providerFixture({ fake, store }).provider, operationStore: store });
      const initialized = await facade.initialize({ projectId, repositoryName: "demo", repositoryVisibility: "private",
        title: "Lost original Agent merge result", operationId: "agent-merged-initialize", attempt: 1 });
      const repository = initialized.repository!;
      const execution = { id: "retained-agent", agentId: "worker", purpose: "delivery" as const, ownershipEpoch: 1,
        executionBranch: local.deliveryBranch("retained-agent"), worktreePath: local.canonicalWorktree("retained-agent") };
      store.authorities.set(execution.id, { epoch: 1, branch: execution.executionBranch });
      await facade.sessionBegin(execution, 1, { kind: "delivery", base: { kind: "main" } });
      await fs.writeFile(path.join(execution.worktreePath, "result.txt"), "Actual original business result\n");
      await harnessCommit(execution.worktreePath, "feat: original Agent result", ["result.txt"]);
      const operationId = `agent-git-${execution.id}-epoch-1-original-merge-merge`;
      const call = (git: CollaborationGitFacade, facts: AgentGitFacts, action: ControlAction, callId: string) =>
        executeAgentGitTool({ git, repository, execution, base: "main", facts,
          recordedOperation: id => store.records.get(id),
          envelope: { projectId, agent: execution.agentId, invocationId: "actual-agent-turn", callId,
            stateVersion: 1, receivedAt: NOW, action } });
      const originalFacts: AgentGitFacts = {};
      await call(facade, originalFacts, { tool: "git_push", reason: "Publish my result" }, "original-push");
      const pull = await call(facade, originalFacts, { tool: "github_create_pr", base: "main", title: "Original result",
        body: "Original Agent result" }, "original-create") as NonNullable<AgentGitFacts["pullRequest"]>;
      const mergePath = `/repos/alice/demo/pulls/${pull.providerNumber}/merge`;
      fake.failOnce("PUT", mergePath, "lost");
      store.crashAfterTransitionOnce(operationId, pendingStatus);
      const merge: ControlAction = { tool: "github_merge_pr", providerNumber: pull.providerNumber, reason: "Publish my retained result" };
      if (pendingStatus === "observed") await expect(call(facade, originalFacts, merge, "original-merge"))
        .rejects.toMatchObject({ code: "GIT_OPERATION_RESULT_AVAILABLE", publicData: {
          operationId, status: "remote_success_local_pending", localStage: "synchronization_pending" },
          cause: expect.objectContaining({ message: `simulated crash after durable ${pendingStatus} transition` }) });
      else await expect(call(facade, originalFacts, merge, "original-merge"))
        .rejects.toThrow(`simulated crash after durable ${pendingStatus} transition`);
      const originalOperation = structuredClone(store.records.get(operationId)!);
      expect(originalOperation.status).toBe(pendingStatus);
      expect(fake.pull(pull.providerNumber).merged).toBe(true);
      expect(fake.count("PUT", mergePath)).toBe(1);
      expect(originalFacts.merged).toBeUndefined();
      await fs.writeFile(path.join(execution.worktreePath, "retained-note.txt"), "Keep my unfinished note");
      const pushCount = runner.pushes;
      const resumed = new CollaborationGitFacade({ localGit: local, provider: providerFixture({ fake, store }).provider, operationStore: store });
      const facts: AgentGitFacts = {};
      expect(await call(resumed, facts, { tool: "github_get_pr", providerNumber: pull.providerNumber }, "inspect-original"))
        .toMatchObject({ id: pull.id, status: "merged", headSha: pull.headSha });
      expect(store.records.get(operationId)).toEqual(originalOperation);
      await expect(call(resumed, facts, { ...merge, reason: "A different replay payload" }, "original-merge"))
        .rejects.toBeInstanceOf(OperationPayloadMismatchError);
      expect(store.records.get(operationId)).toEqual(originalOperation);
      expect(fake.count("PUT", mergePath)).toBe(1);
      expect(facts.merged).toBeUndefined();
      const result = await call(resumed, facts, merge, "original-merge") as NonNullable<AgentGitFacts["merged"]>;
      expect(result).toMatchObject({ status: "merged", headSha: pull.headSha,
        localSynchronization: { targetBranch: "main", localHeadAfter: fake.refs.get("main") } });
      expect(store.records.get(operationId)).toMatchObject({ ...originalOperation, status: "finalized", remoteFact: {
        ownerExecutionId: execution.id, providerNumber: pull.providerNumber, headSha: pull.headSha,
        base: "main", mergeCommitSha: result.mergeCommitSha, status: "merged" } });
      expect(fake.count("PUT", mergePath)).toBe(1);
      expect(fake.count("POST", "/repos/alice/demo/pulls")).toBe(1);
      expect(runner.pushes).toBe(pushCount);
      expect(await fs.readFile(path.join(execution.worktreePath, "retained-note.txt"), "utf8")).toBe("Keep my unfinished note");
    });

  it("returns an unchanged legacy canonical head to its Agent without a new commit or push", async () => {
    const scratch = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-existing-group-publication-")); roots.push(scratch);
    const projectId = "existing-group-publication";
    const projectRoot = path.join(scratch, projectId); await fs.mkdir(projectRoot, { recursive: true });
    const fake = new FakeGitHub(); const store = new MemoryOperationStore();
    const provider = providerFixture({ fake, store }).provider; const runner = new RemoteObservingRunner(fake);
    const local = new LocalCollaborationGitService({ projectId, projectRoot, operationStore: store, runner, now: () => NOW });
    const facade = new CollaborationGitFacade({ localGit: local, provider, operationStore: store });
    const initialized = await facade.initialize({ projectId, repositoryName: "demo", repositoryVisibility: "private",
      title: "Existing group publication", operationId: "existing-publication-initialize", attempt: 1 });
    sdkFixtureGit("git", ["config", "--local", "core.autocrlf", "false"], { cwd: local.repositoryPath, stdio: "pipe" });
    const repository = initialized.repository!;
    const group = await facade.beginGroup({ repository, groupRunId: "existing-group", baseCommit: initialized.localRepository!.head,
      operationId: "existing-group-birth" });
    const member = { id: "existing-member", agentId: "worker", groupRunId: "existing-group", purpose: "delivery" as const,
      ownershipEpoch: 1, executionBranch: "executions/existing-member", worktreePath: local.canonicalWorktree("existing-member") };
    store.authorities.set(member.id, { epoch: 1, branch: member.executionBranch });
    await facade.sessionBegin(member, 1, { kind: "delivery", base: { kind: "group", groupRunId: "existing-group" } });
    await fs.writeFile(path.join(member.worktreePath, "member.txt"), "Original member business result\n");
    await harnessCommit(member.worktreePath, "feat: member's intended result", ["member.txt"]);
    const pushed = await facade.checkpointAndPush({ repository, execution: member, ownershipEpoch: 1,
      operationId: "existing-member-push", checkpointKind: "report" });
    const memberPull = await facade.createPullRequest({ repository, execution: member, ownershipEpoch: 1,
      operationId: "existing-member-create", expectedHead: pushed.checkpoint.commitSha, base: group.group.branch,
      title: "Member result", body: "Member explicitly publishes its result" });
    await facade.mergePullRequest({ repository, execution: member, ownershipEpoch: 1, operationId: "existing-member-merge",
      providerNumber: memberPull.providerNumber, expectedHead: pushed.checkpoint.commitSha, expectedBase: group.group.branch });
    const canonical = { id: "existing-canonical", agentId: "publisher", groupRunId: "existing-group", purpose: "final-integration" as const,
      ownershipEpoch: 1, executionBranch: group.group.branch, worktreePath: local.canonicalWorktree("existing-canonical") };
    store.authorities.set(canonical.id, { epoch: 1, branch: canonical.executionBranch });
    await facade.sessionBegin(canonical, 1, { kind: "final-integration", groupRunId: "existing-group" });
    const originalHead = fake.refs.get(group.group.branch)!;
    expect(originalHead).not.toBe(initialized.localRepository!.head);
    const pushCount = runner.pushes; const facts: AgentGitFacts = {}; let callId = 0;
    const call = (action: ControlAction) => executeAgentGitTool({ git: facade, repository, execution: canonical,
      base: "main", facts, recordedSynchronization: query => store.synchronizations.get(mergedPullSynchronizationOperationId(
        query.executionId, query.ownershipEpoch, query.expectedHead, query.expectedBase, query.expectedMergeCommitSha))?.synchronization,
      envelope: { projectId, agent: canonical.agentId, invocationId: "canonical-native",
        callId: `canonical-native-${callId++}`, stateVersion: 1, receivedAt: NOW, action } });
    expect(await call({ tool: "git_push", reason: "Inspect the group head I am assigned to publish" }))
      .toMatchObject({ status: "already_published", checkpoint: { changed: false, head: originalHead }, remote: { sha: originalHead } });
    expect(facts.pushedHeadSha).toBe(originalHead);
    expect(runner.pushes).toBe(pushCount);
    expect([...store.records.values()].filter((operation) => operation.ownerExecutionId === canonical.id)).toHaveLength(0);
    expect(fake.count("POST", "/repos/alice/demo/pulls")).toBe(1);
    expect(await fs.readFile(path.join(canonical.worktreePath, "member.txt"), "utf8")).toBe("Original member business result\n");
    const finalPull = await call({ tool: "github_create_pr", base: "main", title: "Existing group result", body: "Publisher's explicit PR" }) as { providerNumber: number };
    expect(fake.count("POST", "/repos/alice/demo/pulls")).toBe(2);
    const finalMerge = await call({ tool: "github_merge_pr", providerNumber: finalPull.providerNumber }) as NonNullable<AgentGitFacts["merged"]>;
    expect(finalMerge).toMatchObject({
      status: "merged", headSha: originalHead, localSynchronization: { targetBranch: "main" } });
    expect(store.synchronizations.size).toBe(1);
    facts.merged = undefined; facts.pushedHeadSha = undefined;
    expect(await call({ tool: "github_get_pr", providerNumber: finalPull.providerNumber })).toMatchObject({
      status: "merged", headSha: originalHead });
    expect(await call({ tool: "github_merge_pr", providerNumber: finalPull.providerNumber })).toEqual(finalMerge);
    expect(fake.count("PUT", `/repos/alice/demo/pulls/${finalPull.providerNumber}/merge`)).toBe(1);
    expect(store.synchronizations.size).toBe(1);
    expect(runner.pushes).toBe(pushCount);
  });

  it("publishes a canonical child final PR through runtime authority without an Agent or worktree", async () => {
    const scratch = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-git-runtime-final-"));
    roots.push(scratch);
    const projectId = "runtime-final-project";
    const projectRoot = path.join(scratch, projectId);
    await fs.mkdir(projectRoot, { recursive: true });
    const fake = new FakeGitHub();
    const store = new MemoryOperationStore();
    const provider = providerFixture({ fake, store }).provider;
    const runner = new RemoteObservingRunner(fake);
    const local = new LocalCollaborationGitService({ projectId, projectRoot, operationStore: store, runner, now: () => NOW });
    const facade = new CollaborationGitFacade({ localGit: local, provider, operationStore: store });
    const initialized = await facade.initialize({
      projectId, repositoryName: "demo", repositoryVisibility: "private", title: "Runtime final integration",
      operationId: "runtime-final-initialize", attempt: 1
    });
    const repository = initialized.repository!;
    const mainHead = initialized.localRepository!.head;
    const parent = await facade.beginGroup({
      repository, groupRunId: "parent", baseCommit: mainHead, operationId: "runtime-parent-push"
    });
    const child = await facade.beginGroup({
      repository, groupRunId: "child", baseCommit: mainHead,
      integrationTarget: parent.group.branch, operationId: "runtime-child-push"
    });
    const worker = {
      id: "runtime-child-worker", agentId: "worker", groupRunId: "child", purpose: "delivery" as const,
      ownershipEpoch: 1, executionBranch: "executions/runtime-child-worker",
      worktreePath: local.canonicalWorktree("runtime-child-worker")
    };
    store.authorities.set(worker.id, { epoch: 1, branch: worker.executionBranch });
    await facade.sessionBegin(worker, 1, { kind: "delivery", base: { kind: "group", groupRunId: "child" } });
    await fs.writeFile(path.join(worker.worktreePath, "child.md"), "child result\n", "utf8");
    await harnessCommit(worker.worktreePath, "feat: child result", ["child.md"]);
    const push = await facade.checkpointAndPush({
      repository, execution: worker, ownershipEpoch: 1, operationId: "runtime-worker-push", checkpointKind: "report"
    });
    const delivery = await facade.createPullRequest({
      repository, execution: worker, ownershipEpoch: 1, operationId: "runtime-worker-create",
      expectedHead: push.checkpoint.commitSha, base: child.group.branch, title: "Child delivery", body: "Worker result"
    });
    await facade.mergePullRequest({
      repository, execution: worker, ownershipEpoch: 1, operationId: "runtime-worker-merge",
      providerNumber: delivery.providerNumber, expectedHead: push.checkpoint.commitSha, expectedBase: child.group.branch
    });
    const execution = {
      id: "group-final-child", groupRunId: "child", ownershipEpoch: 1,
      executionBranch: child.group.branch, purpose: "group-final-integration" as const
    };
    store.authorities.set(execution.id, { epoch: 1, branch: execution.executionBranch });
    const head = fake.refs.get(child.group.branch)!;
    const create = {
      repository, execution, ownershipEpoch: 1, operationId: "runtime-final-create",
      expectedHead: head, base: parent.group.branch, title: "Canonical child final PR", body: "Runtime-owned integration"
    };
    await expect(facade.createGroupFinalPullRequest({
      ...create, execution: { ...execution, executionBranch: parent.group.branch }
    })).rejects.toThrow(/canonical group branch/);
    const finalPull = await facade.createGroupFinalPullRequest(create);
    const merge = {
      repository, execution, ownershipEpoch: 1, operationId: "runtime-final-merge",
      providerNumber: finalPull.providerNumber, expectedHead: head, expectedBase: parent.group.branch
    };
    const merged = await facade.mergeGroupFinalPullRequest(merge);
    expect(merged).toMatchObject({ status: "merged", head: child.group.branch, base: parent.group.branch,
      localSynchronization: { targetBranch: parent.group.branch, status: "synchronized" } });
    expect(fake.mergeRequests.get(finalPull.providerNumber)?.commit_title)
      .toBe(`[OpenFARS][runtime] Merge PR #${finalPull.providerNumber} into ${parent.group.branch}`);
    const metadata = String(fake.mergeRequests.get(finalPull.providerNumber)?.commit_message);
    expect(metadata).toContain("OpenFARS-Runtime: scoped-group-final");
    expect(metadata).not.toContain("OpenFARS-Agent:");
    expect(fake.refs.get("main")).toBe(mainHead);
    await expect(fs.access(local.canonicalWorktree(execution.id))).rejects.toThrow();
    expect((await facade.mergeGroupFinalPullRequest(merge)).localSynchronization?.status).toBe("already_synchronized");
    expect(fake.count("PUT", `/repos/alice/demo/pulls/${finalPull.providerNumber}/merge`)).toBe(1);
  });

  it("publishes an all-skipped group's truthful Finish receipt idempotently without changing Main or creating an Agent checkout", async () => {
    const scratch = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-empty-group-")); roots.push(scratch);
    const projectRoot = path.join(scratch, "p"); await fs.mkdir(projectRoot);
    const fake = new FakeGitHub(); const store = new MemoryOperationStore();
    const provider = providerFixture({ fake, store }).provider;
    const local = new LocalCollaborationGitService({ projectId: "p", projectRoot, operationStore: store, runner: new RemoteObservingRunner(fake), now: () => NOW });
    const facade = new CollaborationGitFacade({ localGit: local, provider, operationStore: store });
    const initialized = await facade.initialize({ projectId: "p", repositoryName: "demo", repositoryVisibility: "private", title: "Empty group", operationId: "empty-init", attempt: 1 });
    const repository = initialized.repository!; const main = initialized.localRepository!.head;
    const birth = await facade.beginGroup({ repository, groupRunId: "empty", baseCommit: main, operationId: "empty-birth", integrationTarget: "main" });
    const request = { repository, groupRunId: "empty", expectedHead: main, operationId: "empty-result" };
    await expect(facade.checkpointGroupCompletion(request)).rejects.toThrow(/No live/);
    store.completionReport = { branch: birth.group.branch, content: '{"kind":"runtime-group-completion","arrivals":[{"status":"skipped"}]}\n' };
    const result = await facade.checkpointGroupCompletion(request);
    expect(result.sha).not.toBe(main); expect(fake.refs.get("main")).toBe(main);
    expect(await facade.checkpointGroupCompletion({ ...request, expectedHead: result.sha! })).toEqual(result);
    const run = new ExecFileGitCommandRunner();
    const record = await run.run({ cwd: local.repositoryPath, args: ["show", `${result.sha}:workflow-results/empty.json`] });
    expect(record.stdout.trim()).toBe(store.completionReport.content.trim());
    const delta = await run.run({ cwd: local.repositoryPath, args: ["diff", "--name-only", main, result.sha!] });
    expect(delta.stdout.trim()).toBe("workflow-results/empty.json");
    await expect(fs.access(local.canonicalAgentWorktree("main"))).rejects.toThrow();
    await expect(fs.access(local.canonicalAgentWorktree("worker"))).rejects.toThrow();
    store.completionReport = { ...store.completionReport, content: "changed facts\n" };
    await expect(facade.checkpointGroupCompletion(request)).rejects.toThrow(/retained facts/);
    expect(fake.refs.get("main")).toBe(main);
  });

  it("classifies local push credential failures without losing the prepared checkpoint", async () => {
    const scratch = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-git-auth-push-"));
    roots.push(scratch);
    const projectId = "auth-push-project";
    const projectRoot = path.join(scratch, projectId);
    await fs.mkdir(projectRoot, { recursive: true });
    const fake = new FakeGitHub();
    const store = new MemoryOperationStore();
    const provider = providerFixture({ fake, store }).provider;
    const runner = new RemoteObservingRunner(fake);
    const local = new LocalCollaborationGitService({
      projectId,
      projectRoot,
      operationStore: store,
      runner,
      now: () => NOW
    });
    const facade = new CollaborationGitFacade({ localGit: local, provider, operationStore: store });
    const initialized = await facade.initialize({
      projectId,
      repositoryName: "demo",
      repositoryVisibility: "private",
      title: "Push authorization",
      operationId: "auth-push-initialize",
      attempt: 1
    });
    const repository = initialized.repository!;
    const branch = local.deliveryBranch("exec-auth-push");
    const execution = {
      id: "exec-auth-push",
      agentId: "author-auth-push",
      groupRunId: undefined,
      purpose: "delivery" as const,
      ownershipEpoch: 1,
      executionBranch: branch,
      worktreePath: local.canonicalWorktree("exec-auth-push")
    };
    store.authorities.set(execution.id, { epoch: 1, branch });
    await facade.sessionBegin(execution, 1, { kind: "delivery", base: { kind: "main" } });
    await fs.writeFile(path.join(execution.worktreePath, "auth.md"), "durable output\n", "utf8");
    await harnessCommit(execution.worktreePath, "feat: harness authorization output", ["auth.md"]);

    runner.failPushOnce(new GitCommandError(
      128,
      "fixture local Git push failed",
      {
        command: "push",
        stderr: `remote: Authentication failed for 'https://oauth2:${TOKEN}@github.com/alice/demo.git/'`
      }
    ));
    const authorization = await facade.checkpointAndPush({
      repository,
      execution,
      ownershipEpoch: 1,
      operationId: "auth-push-401",
      checkpointKind: "checkpoint"
    }).catch((error: unknown) => error);
    expect(authorization).toBeInstanceOf(GitHubAuthorizationError);
    expect(authorization).toMatchObject({ publicData: { status: 401 } });
    expect(JSON.stringify(authorization)).not.toContain(TOKEN);
    expect(store.records.get("auth-push-401")?.status).toBe("prepared");

    const recovered = await facade.checkpointAndPush({
      repository,
      execution,
      ownershipEpoch: 1,
      operationId: "auth-push-401",
      checkpointKind: "checkpoint"
    });
    expect(recovered.remote?.sha).toBe(recovered.checkpoint.commitSha);
    expect(store.records.get("auth-push-401")?.status).toBe("finalized");

    await fs.appendFile(path.join(execution.worktreePath, "auth.md"), "forbidden\n", "utf8");
    await harnessCommit(execution.worktreePath, "feat: harness forbidden output", ["auth.md"]);
    runner.failPushOnce(new GitCommandError(
      128,
      "fixture local Git push failed",
      { command: "push", stderr: "remote: Write access to repository not granted" }
    ));
    await expect(facade.checkpointAndPush({
      repository,
      execution,
      ownershipEpoch: 1,
      operationId: "auth-push-403",
      checkpointKind: "checkpoint"
    })).rejects.toMatchObject({
      name: "GitHubAuthorizationError",
      publicData: { status: 403 }
    });
    expect(store.records.get("auth-push-403")?.status).toBe("prepared");

    runner.failPushOnce(new GitCommandError(
      128,
      "fixture local Git push failed",
      { command: "push", stderr: "fatal: unable to access remote: Could not resolve host" }
    ));
    await expect(facade.checkpointAndPush({
      repository,
      execution,
      ownershipEpoch: 1,
      operationId: "auth-push-network",
      checkpointKind: "checkpoint"
    })).rejects.toBeInstanceOf(GitHubUncertainResultError);
    expect(store.records.get("auth-push-network")?.status).toBe("uncertain");
  });

  it("reconciles push and merged-PR facts across durable finalization crashes without replaying remote mutations", async () => {
    const scratch = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-git-restart-reconcile-"));
    roots.push(scratch);
    const projectId = "restart-reconcile-project";
    const projectRoot = path.join(scratch, projectId);
    const repositoryPath = path.join(projectRoot, "repository");
    await fs.mkdir(projectRoot, { recursive: true });
    const fake = new FakeGitHub();
    const store = new MemoryOperationStore();
    const runner = new RemoteObservingRunner(fake);
    const providerBeforeRestart = providerFixture({
      fake,
      store,
      now: () => "2026-09-22T00:00:01.000Z"
    }).provider;
    const local = new LocalCollaborationGitService({
      projectId,
      projectRoot,
      operationStore: store,
      runner,
      now: () => NOW
    });
    const facadeBeforeRestart = new CollaborationGitFacade({
      localGit: local,
      provider: providerBeforeRestart,
      operationStore: store
    });
    const initialized = await facadeBeforeRestart.initialize({
      projectId,
      repositoryName: "demo",
      repositoryVisibility: "private",
      title: "Restart reconciliation",
      operationId: "restart-initialize",
      attempt: 1
    });
    expect(initialized.state.status).toBe("ready");
    const repository = initialized.repository!;
    const initialMain = initialized.localRepository!.head;
    const branch = local.deliveryBranch("exec-restart");
    const execution = {
      id: "exec-restart",
      agentId: "author-restart",
      groupRunId: undefined,
      purpose: "delivery" as const,
      ownershipEpoch: 1,
      executionBranch: branch,
      worktreePath: local.canonicalWorktree("exec-restart")
    };
    store.authorities.set(execution.id, { epoch: 1, branch });
    await facadeBeforeRestart.sessionBegin(
      execution,
      1,
      { kind: "delivery", base: { kind: "main" } }
    );
    await fs.writeFile(path.join(execution.worktreePath, "restart.md"), "durable result\n", "utf8");
    await harnessCommit(execution.worktreePath, "feat: harness restart-safe output", ["restart.md"]);

    // The remote push and observed row commit, then the process disappears
    // before it can durably finalize or return the result.
    store.crashAfterTransitionOnce("restart-push", "observed");
    await expect(facadeBeforeRestart.checkpointAndPush({
      repository,
      execution,
      ownershipEpoch: 1,
      operationId: "restart-push",
      checkpointKind: "checkpoint"
    })).rejects.toThrow("simulated crash after durable observed transition");
    expect(store.records.get("restart-push")?.status).toBe("observed");
    expect(runner.pushes).toBe(2);

    const providerAfterPushRestart = providerFixture({
      fake,
      store,
      now: () => "2026-09-22T00:00:02.000Z"
    }).provider;
    const facadeAfterPushRestart = new CollaborationGitFacade({
      localGit: local,
      provider: providerAfterPushRestart,
      operationStore: store
    });
    const pushed = await facadeAfterPushRestart.checkpointAndPush({
      repository,
      execution,
      ownershipEpoch: 1,
      operationId: "restart-push",
      checkpointKind: "checkpoint"
    });
    expect(pushed.remote?.sha).toBe(pushed.checkpoint.commitSha);
    expect(store.records.get("restart-push")?.status).toBe("finalized");
    expect(store.records.get("restart-push")?.remoteFact?.observedAt).toBe(
      "2026-09-22T00:00:02.000Z"
    );
    expect(runner.pushes).toBe(2);

    // A finalized transition whose response is lost must replay its stored PR
    // fact, not issue a second create request.
    store.crashAfterTransitionOnce("restart-pr-create", "finalized");
    const createRequest = {
      repository,
      execution,
      ownershipEpoch: 1,
      operationId: "restart-pr-create",
      expectedHead: pushed.checkpoint.commitSha,
      base: "main",
      title: "Restart-safe delivery",
      body: "durable result"
    };
    await expect(
      facadeAfterPushRestart.createPullRequest(createRequest)
    ).rejects.toThrow("simulated crash after durable finalized transition");
    expect(store.records.get("restart-pr-create")?.status).toBe("finalized");
    expect(fake.count("POST", "/repos/alice/demo/pulls")).toBe(1);

    const providerAfterCreateRestart = providerFixture({
      fake,
      store,
      now: () => "2026-09-22T00:00:03.000Z"
    }).provider;
    const facadeAfterCreateRestart = new CollaborationGitFacade({
      localGit: local,
      provider: providerAfterCreateRestart,
      operationStore: store
    });
    const opened = await facadeAfterCreateRestart.createPullRequest(createRequest);
    expect(opened.status).toBe("open");
    expect(fake.count("POST", "/repos/alice/demo/pulls")).toBe(1);

    // GitHub merges and loses the response. Reconciliation observes that fact,
    // but the process then stops after persisting `observed`, before the facade
    // can synchronize the retained local target.
    const mergePath = `/repos/alice/demo/pulls/${opened.providerNumber}/merge`;
    fake.failOnce("PUT", mergePath, "lost");
    store.crashAfterTransitionOnce("restart-pr-merge", "observed");
    const mergeRequest = {
      repository,
      execution,
      ownershipEpoch: 1,
      operationId: "restart-pr-merge",
      providerNumber: opened.providerNumber,
      expectedHead: pushed.checkpoint.commitSha,
      expectedBase: "main"
    };
    await expect(
      facadeAfterCreateRestart.mergePullRequest(mergeRequest)
    ).rejects.toThrow("simulated crash after durable observed transition");
    expect(store.records.get("restart-pr-merge")?.status).toBe("observed");
    expect(fake.pull(opened.providerNumber).merged).toBe(true);
    expect(fake.count("PUT", mergePath)).toBe(1);
    expect((await runner.delegate.run({
      cwd: repositoryPath,
      args: ["rev-parse", "refs/heads/main^{commit}"]
    })).stdout.trim()).toBe(initialMain);

    const providerAfterMergeRestart = providerFixture({
      fake,
      store,
      now: () => "2026-09-22T00:00:04.000Z"
    }).provider;
    const facadeAfterMergeRestart = new CollaborationGitFacade({
      localGit: local,
      provider: providerAfterMergeRestart,
      operationStore: store
    });
    const merged = await facadeAfterMergeRestart.mergePullRequest(mergeRequest);
    expect(merged.status).toBe("merged");
    expect(merged.localSynchronization?.status).toBe("synchronized");
    expect(store.records.get("restart-pr-merge")?.status).toBe("finalized");
    expect(store.records.get("restart-pr-merge")?.remoteFact?.observedAt).toBe(
      "2026-09-22T00:00:04.000Z"
    );
    expect(fake.count("PUT", mergePath)).toBe(1);
    expect((await runner.delegate.run({
      cwd: repositoryPath,
      args: ["rev-parse", "refs/heads/main^{commit}"]
    })).stdout.trim()).toBe(fake.refs.get("main"));

    const replayed = await facadeAfterMergeRestart.mergePullRequest(mergeRequest);
    expect(replayed.localSynchronization?.status).toBe("already_synchronized");
    expect(fake.count("PUT", mergePath)).toBe(1);
  });

  it("rejects an ordinary member-to-group merge before provider mutation while final integration owns the checkout", async () => {
    const scratch = await fs.mkdtemp(path.join(os.tmpdir(), "openfars-git-frozen-group-"));
    roots.push(scratch);
    const projectId = "frozen-group-project";
    const projectRoot = path.join(scratch, projectId);
    await fs.mkdir(projectRoot, { recursive: true });
    const fake = new FakeGitHub();
    const store = new MemoryOperationStore();
    const provider = providerFixture({ fake, store }).provider;
    const runner = new RemoteObservingRunner(fake);
    const local = new LocalCollaborationGitService({
      projectId,
      projectRoot,
      operationStore: store,
      runner,
      now: () => NOW
    });
    const facade = new CollaborationGitFacade({ localGit: local, provider, operationStore: store });
    const initialized = await facade.initialize({
      projectId,
      repositoryName: "demo",
      repositoryVisibility: "private",
      title: "Frozen group",
      operationId: "frozen-initialize",
      attempt: 1
    });
    const repository = initialized.repository!;
    const mainHead = initialized.localRepository!.head;
    runner.losePushResponseOnce("groups/group-frozen");
    const startedGroup = await facade.beginGroup({
      repository,
      groupRunId: "group-frozen",
      baseCommit: mainHead,
      operationId: "push-group-frozen"
    });
    const group = startedGroup.group;
    expect(startedGroup.remote).toMatchObject({
      ref: "groups/group-frozen",
      sha: mainHead,
      status: "present"
    });
    expect(store.records.get("push-group-frozen")).toMatchObject({
      kind: "git.push",
      status: "finalized",
      expectedHead: mainHead,
      expectedBase: "groups/group-frozen"
    });
    const pushCount = runner.pushes;
    expect(await facade.beginGroup({
      repository,
      groupRunId: "group-frozen",
      baseCommit: mainHead,
      operationId: "push-group-frozen"
    })).toEqual(startedGroup);
    expect(runner.pushes).toBe(pushCount);

    const childRequest = {
      repository,
      groupRunId: "group-child",
      baseCommit: mainHead,
      integrationTarget: group.branch,
      operationId: "push-group-child"
    };
    const child = await facade.beginGroup(childRequest);
    expect(child.remote).toMatchObject({ ref: "groups/group-child", sha: mainHead, status: "present" });
    fake.refs.set(group.branch, UPDATED_HEAD);
    await expect(facade.beginGroup({
      ...childRequest,
      groupRunId: "group-stale-child",
      operationId: "push-group-stale-child"
    })).rejects.toThrow(/remote integration target head/);
    expect(await facade.beginGroup(childRequest)).toEqual(child);

    const finalExecution = {
      id: "exec-final-owner",
      agentId: "member-final",
      groupRunId: "group-frozen",
      purpose: "final-integration" as const,
      ownershipEpoch: 1,
      executionBranch: group.branch,
      worktreePath: local.canonicalWorktree("exec-final-owner")
    };
    store.authorities.set(finalExecution.id, { epoch: 1, branch: group.branch });
    await facade.sessionBegin(
      finalExecution,
      1,
      { kind: "final-integration", groupRunId: "group-frozen" }
    );

    const memberBranch = local.deliveryBranch("exec-late-member");
    const member = {
      id: "exec-late-member",
      agentId: "member-late",
      groupRunId: "group-frozen",
      purpose: "delivery" as const,
      ownershipEpoch: 1,
      executionBranch: memberBranch,
      worktreePath: local.canonicalWorktree("exec-late-member")
    };
    store.authorities.set(member.id, { epoch: 1, branch: memberBranch });
    await facade.sessionBegin(
      member,
      1,
      { kind: "delivery", base: { kind: "group", groupRunId: "group-frozen" } }
    );
    await fs.writeFile(path.join(member.worktreePath, "late.md"), "late member\n", "utf8");
    await harnessCommit(member.worktreePath, "feat: late harness delivery", ["late.md"]);
    const pushed = await facade.checkpointAndPush({
      repository,
      execution: member,
      ownershipEpoch: 1,
      operationId: "late-member-push",
      checkpointKind: "report"
    });
    const pull = await facade.createPullRequest({
      repository,
      execution: member,
      ownershipEpoch: 1,
      operationId: "late-member-pr",
      expectedHead: pushed.checkpoint.commitSha,
      base: group.branch,
      title: "Late member",
      body: "Must wait until the group is unfrozen"
    });
    await expect(facade.mergePullRequest({
      repository,
      execution: member,
      ownershipEpoch: 1,
      operationId: "late-member-merge",
      providerNumber: pull.providerNumber,
      expectedHead: pushed.checkpoint.commitSha,
      expectedBase: group.branch
    })).rejects.toThrow("frozen");
    expect(fake.count("PUT", `/repos/alice/demo/pulls/${pull.providerNumber}/merge`)).toBe(0);
  });
});

describe("GitHub endpoint guard resource-name boundaries", () => {
  function request(provider: GitHubUserProvider, endpoint: string): Promise<{ status: number }> {
    // Exercise the actual transport guard without adding a public generic API.
    const transport = provider as unknown as {
      request(credential: { token: string; requestedScopes: string[] }, method: "GET", endpoint: string,
        options: { expectedStatuses: number[] }): Promise<{ status: number }>;
    };
    return transport.request({ token: TOKEN, requestedScopes: ["repo"] }, "GET", endpoint, { expectedStatuses: [200] });
  }

  it.each([
    ["alice", "workflow-helper"],
    ["workflow-lab", "demo"],
    ["actions-lab", "demo"],
    ["alice", "actions-helper"]
  ])("observes legal repository metadata for %s/%s", async (owner, repository) => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({
      id: 17, owner: { login: owner }, name: repository, private: true, default_branch: "main",
      html_url: `https://github.com/${owner}/${repository}`, clone_url: `https://github.com/${owner}/${repository}.git`
    }), { status: 200, headers: { "content-type": "application/json" } }));
    const provider = new GitHubUserProvider({
      credentialResolver: async () => ({ token: TOKEN, requestedScopes: ["repo"] }),
      operationStore: new MemoryOperationStore(), fetch, now: () => NOW
    });
    await expect(provider.observeRepository(owner, repository)).resolves.toMatchObject({ owner, name: repository });
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("prepares and creates the original workflow-named repository through one real provider operation", async () => {
    const { fake, store, provider } = providerFixture();
    const name = "openfars-workflow-invalid-replacement-u05-isolated-fixture";
    const repository = await provider.ensureRepository({ name, visibility: "private",
      operation: { operationId: "workflow-repository-create" } });
    expect(repository).toMatchObject({ owner: "alice", name, private: true });
    expect(fake.count("GET", `/repos/alice/${name}`)).toBe(1);
    expect(fake.count("POST", "/user/repos")).toBe(1);
    expect(store.records.get("workflow-repository-create")?.status).toBe("finalized");
  });

  it("observes an ordinary allowed collaboration ref containing workflow", async () => {
    const { fake, provider } = providerFixture();
    fake.seedRepository(); fake.refs.set("groups/workflow-validation", HEAD);
    await expect(provider.observeRef("alice", "demo", "groups/workflow-validation"))
      .resolves.toMatchObject({ status: "present", ref: "groups/workflow-validation", sha: HEAD });
  });

  it.each([
    "/repos/alice/demo/actions/runs",
    "/repos/alice/demo/actions/workflows/deploy.yml",
    "/orgs/example/actions/runners",
    "/enterprises/example/actions/runners",
    "/repos/alice/demo/%61ctions/runs",
    "/repos/alice/demo/actions%2Fruns"
  ])("blocks the actual Actions endpoint before transport: %s", async endpoint => {
    const fetch = vi.fn(async () => new Response("{}", { status: 200 }));
    const provider = new GitHubUserProvider({
      credentialResolver: async () => ({ token: TOKEN, requestedScopes: ["repo"] }),
      operationStore: new MemoryOperationStore(), fetch
    });
    await expect(request(provider, endpoint)).rejects.toThrow("GitHub Actions and workflow endpoints are forbidden");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("retains the workflow-file endpoint restriction", async () => {
    const fetch = vi.fn(async () => new Response("{}", { status: 200 }));
    const provider = new GitHubUserProvider({
      credentialResolver: async () => ({ token: TOKEN, requestedScopes: ["repo"] }),
      operationStore: new MemoryOperationStore(), fetch
    });
    await expect(request(provider, "/repos/alice/demo/contents/.github/workflows/build.yml"))
      .rejects.toThrow("GitHub Actions and workflow endpoints are forbidden");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("keeps the existing API-origin escape restriction", async () => {
    const fetch = vi.fn(async () => new Response("{}", { status: 200 }));
    const provider = new GitHubUserProvider({
      credentialResolver: async () => ({ token: TOKEN, requestedScopes: ["repo"] }),
      operationStore: new MemoryOperationStore(), fetch
    });
    await expect(request(provider, "https://other.invalid/repos/alice/demo"))
      .rejects.toThrow("GitHub request escaped the configured API origin");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("accepts an ordinary pull query containing a workflow-named branch", async () => {
    const fetch = vi.fn(async () => new Response("[]", { status: 200 }));
    const provider = new GitHubUserProvider({
      credentialResolver: async () => ({ token: TOKEN, requestedScopes: ["repo"] }),
      operationStore: new MemoryOperationStore(), fetch
    });
    await expect(request(provider, "/repos/alice/demo/pulls?head=alice%3Aexecutions%2Fworkflow-example"))
      .resolves.toMatchObject({ status: 200 });
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("keeps legal repository names when the configured API has a path prefix", async () => {
    const fetch = vi.fn(async (_input: string | URL | Request) => new Response(JSON.stringify({
      id: 17, owner: { login: "alice" }, name: "workflow-helper", private: true, default_branch: "main",
      html_url: "https://github.com/alice/workflow-helper", clone_url: "https://github.com/alice/workflow-helper.git"
    }), { status: 200 }));
    const provider = new GitHubUserProvider({
      credentialResolver: async () => ({ token: TOKEN, requestedScopes: ["repo"] }),
      operationStore: new MemoryOperationStore(), baseUrl: "https://github-api.example/api/v3/", fetch
    });
    await expect(provider.observeRepository("alice", "workflow-helper")).resolves.toMatchObject({ name: "workflow-helper" });
    expect(new URL(String(fetch.mock.calls[0]![0])).pathname).toBe("/api/v3/repos/alice/workflow-helper");
  });

  it("blocks encoded Actions routes under the configured API prefix", async () => {
    const fetch = vi.fn(async () => new Response("{}", { status: 200 }));
    const provider = new GitHubUserProvider({
      credentialResolver: async () => ({ token: TOKEN, requestedScopes: ["repo"] }),
      operationStore: new MemoryOperationStore(), baseUrl: "https://github-api.example/api/v3/", fetch
    });
    await expect(request(provider, "/repos/alice/demo/%61ctions/runs"))
      .rejects.toThrow("GitHub Actions and workflow endpoints are forbidden");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects malformed route encoding before transport", async () => {
    const fetch = vi.fn(async () => new Response("{}", { status: 200 }));
    const provider = new GitHubUserProvider({
      credentialResolver: async () => ({ token: TOKEN, requestedScopes: ["repo"] }),
      operationStore: new MemoryOperationStore(), fetch
    });
    await expect(request(provider, "/repos/alice/demo/%zzctions/runs"))
      .rejects.toThrow("GitHub request path contains malformed encoding");
    expect(fetch).not.toHaveBeenCalled();
  });
});
