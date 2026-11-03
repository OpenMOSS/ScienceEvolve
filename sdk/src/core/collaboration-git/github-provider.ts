import type {
  ExecutionId,
  OperationRecord,
  PullRequestId
} from "../types.js";
import { sha256 } from "../utils.js";
import { redactGitDiagnostic } from "./command-runner.js";
import { resolveGitHubCredential } from "./credential.js";
import type {
  CollaborationGitOperationStore,
  GitHubCheckFact,
  GitHubCredential,
  GitHubCredentialResolver,
  GitHubIdentityFact,
  GitHubPullRequestFact,
  GitHubRefFact,
  GitHubRepositoryFact,
  GitOperationContext
} from "./contracts.js";
import {
  GitHubAuthorizationError,
  GitHubProviderError,
  GitHubUncertainResultError,
  GitInputError,
  OperationStoreViolationError
} from "./errors.js";
import {
  finalizeOperation,
  prepareOperation,
  transitionOperation
} from "./operation.js";

export const GITHUB_REQUIRED_OAUTH_SCOPES = ["repo"] as const;
const API_VERSION = "2022-11-28";
const SAFE_NAME = /^[A-Za-z0-9](?:[A-Za-z0-9._-]{0,98}[A-Za-z0-9])?$/;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,159}$/;
const SAFE_SHA = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const DEFAULT_PULL_HEAD_CONSISTENCY_ATTEMPTS = 5;
const DEFAULT_PULL_HEAD_CONSISTENCY_DELAY_MS = 250;
const MAX_PULL_HEAD_CONSISTENCY_ATTEMPTS = 10;
const MAX_PULL_HEAD_CONSISTENCY_DELAY_MS = 5_000;

interface ProviderResponse {
  status: number;
  headers: Headers;
  data: unknown;
}

class MutationRequestUncertainError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "MutationRequestUncertainError";
  }
}

export interface GitHubUserProviderOptions {
  credentialResolver: GitHubCredentialResolver;
  expectedIdentity?: { id: number; login: string };
  operationStore: CollaborationGitOperationStore;
  fetch?: typeof globalThis.fetch;
  baseUrl?: string;
  timeoutMs?: number;
  now?: () => string;
  /** Total pre-mutation PR observations, including the initial read. */
  pullHeadConsistencyAttempts?: number;
  /** Base delay for bounded exponential backoff between PR head observations. */
  pullHeadConsistencyDelayMs?: number;
  /** Only deterministic tests may use an HTTP loopback endpoint. */
  allowInsecureTestBaseUrl?: boolean;
}

export interface EnsureRepositoryRequest {
  name: string;
  visibility: "private" | "public";
  description?: string;
  operation: GitOperationContext;
  signal?: AbortSignal;
}

export interface PullMutationRequest {
  owner: string;
  repository: string;
  providerNumber: number;
  ownerExecutionId: ExecutionId;
  operation: GitOperationContext;
  commitTitle?: string;
  commitMessage?: string;
  signal?: AbortSignal;
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new GitHubProviderError(`GitHub returned malformed ${label}`, false);
  }
  return value as Record<string, unknown>;
}

function string(value: unknown, label: string): string {
  if (typeof value !== "string" || !value) {
    throw new GitHubProviderError(`GitHub omitted ${label}`, false);
  }
  return value;
}

function integer(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || Number(value) < 0) {
    throw new GitHubProviderError(`GitHub returned invalid ${label}`, false);
  }
  return Number(value);
}

function safeName(value: string, label: string): string {
  if (!SAFE_NAME.test(value)) throw new GitInputError(`${label} is unsafe`, { label });
  return value;
}

function safeId(value: string, label: string): string {
  if (!SAFE_ID.test(value)) throw new GitInputError(`${label} is unsafe`, { label });
  return value;
}

function safeRefComponent(value: string, label: string): string {
  const safe = safeId(value, label);
  if (safe.includes("..") || safe.endsWith(".") || safe.toLowerCase().endsWith(".lock")) {
    throw new GitInputError(`${label} is unsafe for a Git ref`, { label });
  }
  return safe;
}

function safeSha(value: string, label: string): string {
  const normalized = value.toLowerCase();
  if (!SAFE_SHA.test(normalized)) throw new GitInputError(`${label} is not a complete SHA`);
  return normalized;
}

function safeBranch(value: string): string {
  if (value === "main" || value === "management/memory") return value;
  const match = value.match(/^(groups|executions)\/([A-Za-z0-9][A-Za-z0-9._-]{0,159})$/);
  if (match?.[1] && match[2]) {
    safeRefComponent(match[2], "GitHub branch component");
    return value;
  }
  throw new GitInputError("GitHub branch is outside the fixed collaboration namespace");
}

function encodePath(value: string): string {
  return encodeURIComponent(value).replaceAll("%2F", "/");
}

function forbiddenGitHubEndpoint(url: URL, baseUrl: URL): boolean {
  const basePath = new URL(".", baseUrl).pathname;
  const route = url.pathname.startsWith(basePath)
    ? url.pathname.slice(basePath.length)
    : url.pathname;
  let segments: string[];
  try {
    segments = decodeURIComponent(route).toLowerCase().split("/").filter(Boolean);
  } catch {
    throw new GitInputError("GitHub request path contains malformed encoding");
  }
  const forbidden = (segment: string | undefined) => segment === "actions" || segment === "workflows";
  // Owner/repository/ref names and query values are data, not API endpoints.
  // Keep Actions and workflow-file routes blocked at their actual positions.
  if (segments[0] === "repos") {
    return forbidden(segments[3]) ||
      (segments[3] === "contents" && segments[4] === ".github" && segments[5] === "workflows");
  }
  if (["orgs", "enterprises", "users"].includes(segments[0] ?? "")) return forbidden(segments[2]);
  if (segments[0] === "user") return forbidden(segments[1]);
  return forbidden(segments[0]);
}

function advertisedScopes(headers: Headers): string[] {
  return (headers.get("x-oauth-scopes") ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .sort();
}

function pullRequestId(owner: string, repository: string, number: number): PullRequestId {
  return `github:${owner}/${repository}#${number}`;
}

function operationMarker(operationId: string): string {
  return `<!-- openfars-operation:${safeId(operationId, "operationId")} -->`;
}

function repositoryOperationMarker(operationId: string): string {
  return `OpenFARS-Operation: ${safeId(operationId, "operationId")}`;
}

function repositoryOperationFromDescription(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return value.match(
    /(?:^| \| )OpenFARS-Operation: ([A-Za-z0-9][A-Za-z0-9._-]{0,159})$/
  )?.[1];
}

function executionMarker(executionId: string): string {
  return `<!-- openfars-execution:${safeId(executionId, "executionId")} -->`;
}

function withoutReservedMarkers(value: string): string {
  return value.replace(
    /<!--\s*openfars-(?:operation|execution):.*?-->/gis,
    ""
  );
}

function safeCommitMetadata(value: string | undefined, maximum: number): string | undefined {
  if (!value) return undefined;
  const sanitized = value
    .replace(/\0/g, "")
    .replace(/\b(?:gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+)\b/g, "[REDACTED]")
    .replace(/\bBearer\s+[^\s]+/gi, "Bearer [REDACTED]")
    .trim();
  return sanitized ? Array.from(sanitized).slice(0, maximum).join("") : undefined;
}

function markerFromBody(body: unknown): string | undefined {
  if (typeof body !== "string") return undefined;
  return body.match(/<!-- openfars-operation:([A-Za-z0-9][A-Za-z0-9._-]{0,159}) -->/)?.[1];
}

function executionFromBody(body: unknown): string | undefined {
  if (typeof body !== "string") return undefined;
  return body.match(/<!-- openfars-execution:([A-Za-z0-9][A-Za-z0-9._-]{0,159}) -->/)?.[1];
}

/** The merged PRs from this exact head into this exact base, for a canonical
 * group delivery whose execution marker is absent because the merge happened
 * outside OpenFARS. More than one stays ambiguous and errors upstream. */
function unmarkedMergedCanonicalFinal(data: unknown[], head: string, base: string): unknown[] {
  return data.filter((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return false;
    const row = item as Record<string, unknown>;
    const headRef = row.head as Record<string, unknown> | undefined;
    const baseRef = row.base as Record<string, unknown> | undefined;
    const merged = row.merged === true || typeof row.merged_at === "string";
    return merged && headRef?.ref === head && baseRef?.ref === base;
  });
}

function cloneWithoutCredentials(value: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new GitHubProviderError("GitHub returned an invalid clone URL", false);
  }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
    throw new GitHubProviderError("GitHub clone URL is not credential-free HTTPS", false);
  }
  return parsed.toString();
}

function publicUrl(value: string, label: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new GitHubProviderError(`GitHub returned an invalid ${label}`, false);
  }
  if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
    throw new GitHubProviderError(`GitHub returned an unsafe ${label}`, false);
  }
  return parsed.toString();
}

function operationFact(operation: OperationRecord): Record<string, unknown> | undefined {
  return operation.remoteFact && typeof operation.remoteFact === "object"
    ? operation.remoteFact
    : undefined;
}

function safeErrorCause(value: unknown): Error {
  const message = value instanceof Error ? value.message : "GitHub provider I/O failed";
  return new Error(redactGitDiagnostic(message) || "GitHub provider I/O failed");
}

export class GitHubUserProvider {
  private readonly credentialResolver: GitHubCredentialResolver;
  private readonly expectedIdentity?: { id: number; login: string };
  private readonly operationStore: CollaborationGitOperationStore;
  private readonly fetchImpl: typeof globalThis.fetch;
  private readonly baseUrl: URL;
  private readonly timeoutMs: number;
  private readonly now: () => string;
  private readonly pullHeadConsistencyAttempts: number;
  private readonly pullHeadConsistencyDelayMs: number;

  constructor(options: GitHubUserProviderOptions) {
    this.credentialResolver = options.credentialResolver;
    this.expectedIdentity = options.expectedIdentity;
    this.operationStore = options.operationStore;
    this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
    this.baseUrl = new URL(options.baseUrl ?? "https://api.github.com/");
    if (
      this.baseUrl.username ||
      this.baseUrl.password ||
      (this.baseUrl.protocol !== "https:" && !(
        options.allowInsecureTestBaseUrl === true &&
        this.baseUrl.protocol === "http:" &&
        ["127.0.0.1", "localhost", "::1"].includes(this.baseUrl.hostname)
      ))
    ) {
      throw new GitInputError("GitHub API base URL must be credential-free HTTPS");
    }
    this.timeoutMs = Math.max(500, Math.min(options.timeoutMs ?? 30_000, 120_000));
    this.now = options.now ?? (() => new Date().toISOString());
    this.pullHeadConsistencyAttempts = this.boundedConsistencyOption(
      options.pullHeadConsistencyAttempts,
      DEFAULT_PULL_HEAD_CONSISTENCY_ATTEMPTS,
      1,
      MAX_PULL_HEAD_CONSISTENCY_ATTEMPTS,
      "pullHeadConsistencyAttempts"
    );
    this.pullHeadConsistencyDelayMs = this.boundedConsistencyOption(
      options.pullHeadConsistencyDelayMs,
      DEFAULT_PULL_HEAD_CONSISTENCY_DELAY_MS,
      0,
      MAX_PULL_HEAD_CONSISTENCY_DELAY_MS,
      "pullHeadConsistencyDelayMs"
    );
  }

  async verifyIdentity(signal?: AbortSignal): Promise<GitHubIdentityFact> {
    const credential = await this.resolveCredential(signal);
    const response = await this.request(
      credential,
      "GET",
      "/user",
      { signal, expectedStatuses: [200] }
    );
    const data = object(response.data, "user identity");
    const scopes = advertisedScopes(response.headers);
    if (scopes.length > 0 && !scopes.includes("repo")) {
      throw new GitHubAuthorizationError(403, "GitHub credential does not advertise the required repo scope");
    }
    const login = safeName(string(data.login, "user login"), "GitHub login");
    const id = integer(data.id, "user id");
    // A login is mutable display metadata. The provider's numeric user id is
    // the stable authority boundary pinned to the project.
    if (this.expectedIdentity && id !== this.expectedIdentity.id) {
      throw new GitHubAuthorizationError(
        403,
        "GitHub credential identity does not match the account pinned to this project"
      );
    }
    return {
      login,
      id,
      requestedScopes: [...credential.requestedScopes],
      advertisedScopes: scopes,
      observedAt: this.now()
    };
  }

  async observeRepository(
    owner: string,
    repository: string,
    signal?: AbortSignal
  ): Promise<GitHubRepositoryFact | undefined> {
    const safeOwner = safeName(owner, "owner");
    const safeRepository = safeName(repository, "repository");
    const credential = await this.resolveCredential(signal);
    const response = await this.request(
      credential,
      "GET",
      `/repos/${encodeURIComponent(safeOwner)}/${encodeURIComponent(safeRepository)}`,
      { signal, expectedStatuses: [200, 404] }
    );
    if (response.status === 404) return undefined;
    return this.repositoryFact(response.data, safeOwner, safeRepository);
  }

  async ensureRepository(
    request: EnsureRepositoryRequest
  ): Promise<GitHubRepositoryFact> {
    const name = safeName(request.name, "repository name");
    const isPrivate = request.visibility === "private";
    const operationId = safeId(request.operation.operationId, "operationId");
    const description = [
      request.description?.replace(/[\r\n\0]+/g, " ").trim().slice(0, 150),
      repositoryOperationMarker(operationId)
    ].filter(Boolean).join(" | ");
    const identity = await this.verifyIdentity(request.signal);
    const prepared = await prepareOperation(
      this.operationStore,
      {
        id: request.operation.operationId,
        kind: "repository.create"
      },
      {
        provider: "github",
        owner: identity.login,
        name,
        private: isPrivate,
        defaultBranch: "main",
        description,
        requestedScopes: GITHUB_REQUIRED_OAUTH_SCOPES
      }
    );
    const replay = this.repositoryFactFromOperation(prepared);
    if (replay) {
      this.assertRepositoryMarker(replay, operationId);
      this.assertRepositoryVisibility(replay, isPrivate);
      return replay;
    }
    this.throwIfFailedOperation(prepared);

    const existing = await this.observeRepository(identity.login, name, request.signal);
    if (existing) {
      this.assertRepositoryMarker(existing, operationId);
      this.assertRepositoryVisibility(existing, isPrivate);
      return this.finalizeRepository(prepared, existing);
    }

    const credential = await this.resolveCredential(request.signal);
    try {
      const response = await this.request(
        credential,
        "POST",
        "/user/repos",
        {
          signal: request.signal,
          mutation: true,
          expectedStatuses: [201, 422],
          body: {
            name,
            description,
            private: isPrivate,
            has_issues: false,
            has_projects: false,
            has_wiki: false,
            auto_init: false
          }
        }
      );
      if (response.status === 201) {
        const created = this.repositoryFact(response.data, identity.login, name);
        this.assertRepositoryMarker(created, operationId);
        this.assertRepositoryVisibility(created, isPrivate);
        return this.finalizeRepository(
          prepared,
          created
        );
      }
      const reconciled = await this.observeRepository(identity.login, name, request.signal);
      if (reconciled) {
        this.assertRepositoryMarker(reconciled, operationId);
        this.assertRepositoryVisibility(reconciled, isPrivate);
        return this.finalizeRepository(prepared, reconciled);
      }
      await transitionOperation(this.operationStore, prepared, {
        status: "failed",
        remoteFact: { provider: "github", status: 422, repository: name }
      });
      throw new GitHubProviderError("GitHub rejected repository creation", false, {
        status: 422,
        repository: name
      });
    } catch (error) {
      if (!(error instanceof MutationRequestUncertainError)) throw error;
      await this.markUncertain(prepared, "repository.create");
      const reconciled = await this.tryObserveRepository(identity.login, name, request.signal);
      if (reconciled) {
        this.assertRepositoryMarker(reconciled, operationId);
        this.assertRepositoryVisibility(reconciled, isPrivate);
        return this.finalizeRepository(prepared, reconciled);
      }
      throw new GitHubUncertainResultError(request.operation.operationId, undefined, {
        cause: safeErrorCause(error)
      });
    }
  }

  async observeRef(
    owner: string,
    repository: string,
    ref: string,
    signal?: AbortSignal
  ): Promise<GitHubRefFact> {
    const safeOwner = safeName(owner, "owner");
    const safeRepository = safeName(repository, "repository");
    const branch = safeBranch(ref);
    const credential = await this.resolveCredential(signal);
    const response = await this.request(
      credential,
      "GET",
      `/repos/${encodeURIComponent(safeOwner)}/${encodeURIComponent(safeRepository)}/git/ref/heads/${encodePath(branch)}`,
      // GitHub reports an otherwise valid, newly-created empty repository as
      // 409 rather than 404 for the ref endpoint. Both mean this branch is
      // absent and are safe to reconcile before the initial push.
      { signal, expectedStatuses: [200, 404, 409] }
    );
    const observedAt = this.now();
    if (response.status === 404 || response.status === 409) {
      return {
        owner: safeOwner,
        repository: safeRepository,
        ref: branch,
        status: "missing",
        observedAt
      };
    }
    const data = object(response.data, "Git ref");
    const target = object(data.object, "Git ref target");
    return {
      owner: safeOwner,
      repository: safeRepository,
      ref: branch,
      sha: safeSha(string(target.sha, "ref SHA"), "ref SHA"),
      status: "present",
      observedAt
    };
  }

  async observeChecks(
    owner: string,
    repository: string,
    commitSha: string,
    signal?: AbortSignal
  ): Promise<GitHubCheckFact[]> {
    const safeOwner = safeName(owner, "owner");
    const safeRepository = safeName(repository, "repository");
    const sha = safeSha(commitSha, "commitSha");
    const credential = await this.resolveCredential(signal);
    const response = await this.request(
      credential,
      "GET",
      `/repos/${encodeURIComponent(safeOwner)}/${encodeURIComponent(safeRepository)}/commits/${sha}/check-runs?per_page=100`,
      { signal, expectedStatuses: [200] }
    );
    const data = object(response.data, "check runs");
    if (!Array.isArray(data.check_runs)) {
      throw new GitHubProviderError("GitHub returned malformed check runs", false);
    }
    return data.check_runs.map((item) => {
      const check = object(item, "check run");
      const conclusion = check.conclusion;
      const htmlUrl = check.html_url;
      return {
        id: integer(check.id, "check id"),
        name: string(check.name, "check name").slice(0, 300),
        status: string(check.status, "check status"),
        ...(typeof conclusion === "string" && conclusion ? { conclusion } : {}),
        ...(typeof htmlUrl === "string" && htmlUrl
          ? { htmlUrl: publicUrl(htmlUrl, "check URL") }
          : {}),
        observedAt: this.now()
      };
    });
  }

  async observePullRequest(
    owner: string,
    repository: string,
    providerNumber: number,
    expectedOwnerExecutionId?: ExecutionId,
    signal?: AbortSignal
  ): Promise<GitHubPullRequestFact | undefined> {
    const safeOwner = safeName(owner, "owner");
    const safeRepository = safeName(repository, "repository");
    if (!Number.isSafeInteger(providerNumber) || providerNumber < 1) {
      throw new GitInputError("Pull request number is invalid");
    }
    const credential = await this.resolveCredential(signal);
    const response = await this.request(
      credential,
      "GET",
      `/repos/${encodeURIComponent(safeOwner)}/${encodeURIComponent(safeRepository)}/pulls/${providerNumber}`,
      { signal, expectedStatuses: [200, 404] }
    );
    if (response.status === 404) return undefined;
    return this.pullFact(
      safeOwner,
      safeRepository,
      response.data,
      expectedOwnerExecutionId,
      signal
    );
  }

  /**
   * Reconcile a pull request from provider facts when the create response was
   * lost before S learned its provider number. The execution marker is the
   * durable owner identity; the operation marker is deliberately not used
   * here because a recovered ownership epoch must not reuse the old epoch's
   * mutation identity.
   */
  async observePullRequestForExecution(
    owner: string,
    repository: string,
    head: string,
    base: string,
    expectedExecutionId: ExecutionId,
    signal?: AbortSignal,
    expectedHead?: string
  ): Promise<GitHubPullRequestFact | undefined> {
    const safeOwner = safeName(owner, "owner");
    const safeRepository = safeName(repository, "repository");
    const safeHead = safeBranch(head);
    const safeBase = safeBranch(base);
    const executionId = safeId(expectedExecutionId, "expectedExecutionId");
    const credential = await this.resolveCredential(signal);
    const query = new URLSearchParams({
      state: "all",
      head: `${safeOwner}:${safeHead}`,
      base: safeBase,
      per_page: "100"
    });
    const response = await this.request(
      credential,
      "GET",
      `/repos/${encodeURIComponent(safeOwner)}/${encodeURIComponent(safeRepository)}/pulls?${query.toString()}`,
      { signal, expectedStatuses: [200] }
    );
    if (!Array.isArray(response.data)) {
      throw new GitHubProviderError("GitHub returned malformed pull request listing", false);
    }
    const marked = response.data.filter((item) => {
      const row = object(item, "pull request listing item");
      return executionFromBody(row.body) === executionId;
    });
    // A canonical group delivery can be published outside OpenFARS: a Leader or
    // a human merges the group final PR on the provider, so its body carries no
    // execution marker and no operation was ever journaled here. That group
    // branch has exactly one direct target, so a single merged PR from this head
    // into this base is unambiguous - adopt it and read its real provider facts.
    // Member deliveries keep the strict marker requirement.
    const owned = marked.length || !executionId.startsWith("group-final-")
      ? marked
      : unmarkedMergedCanonicalFinal(response.data, safeHead, safeBase);
    const current = expectedHead ? owned.filter(item =>
      object(object(item, "pull request").head, "pull head").sha === safeSha(expectedHead, "expectedHead"))
      : owned.filter(item => object(item, "pull request").state === "open");
    const matches = expectedHead || current.length ? current : owned;
    if (matches.length > 1) {
      throw new GitHubProviderError(
        "Multiple pull requests claim the same execution branch; recovery is ambiguous",
        false,
        { executionId, head: safeHead, base: safeBase }
      );
    }
    if (matches.length === 0) return undefined;
    const number = integer(
      object(matches[0], "pull request listing item").number,
      "pull request number"
    );
    return this.observePullRequest(
      safeOwner,
      safeRepository,
      number,
      executionId,
      signal
    );
  }

  async openPullRequest(request: {
    owner: string;
    repository: string;
    head: string;
    base: string;
    title: string;
    body: string;
    ownerExecutionId: ExecutionId;
    operation: GitOperationContext;
    signal?: AbortSignal;
  }): Promise<GitHubPullRequestFact> {
    const owner = safeName(request.owner, "owner");
    const repository = safeName(request.repository, "repository");
    const head = safeBranch(request.head);
    const base = safeBranch(request.base);
    const executionId = safeId(request.ownerExecutionId, "ownerExecutionId");
    const expectedHead = safeSha(
      request.operation.expectedHead ?? "",
      "operation.expectedHead"
    );
    if (request.operation.ownerExecutionId !== executionId) {
      throw new GitInputError("Pull request operation owner does not match the execution");
    }
    if (request.operation.expectedBase !== base) {
      throw new GitInputError("Pull request operation base does not match the requested base");
    }
    const marker = operationMarker(request.operation.operationId);
    const body = `${withoutReservedMarkers(request.body).trim().slice(0, 60_000)}\n\n${marker}\n${executionMarker(executionId)}`;
    const prepared = await prepareOperation(
      this.operationStore,
      {
        id: request.operation.operationId,
        kind: "pull.create",
        ownerExecutionId: executionId,
        ...(request.operation.ownershipEpoch !== undefined
          ? { ownershipEpoch: request.operation.ownershipEpoch }
          : {}),
        expectedHead,
        expectedBase: base
      },
      {
        provider: "github",
        owner,
        repository,
        head,
        base,
        expectedHead,
        ownerExecutionId: executionId,
        title: request.title.trim().slice(0, 250),
        bodySha256: sha256(body)
      }
    );
    const replay = this.pullFactFromOperation(prepared);
    if (replay) {
      if (replay.operationMarker !== request.operation.operationId) {
        throw new OperationStoreViolationError("Finalized pull-create marker is mismatched");
      }
      if (replay.status === "unknown") {
        // PR creation is durable even while GitHub is computing mergeability.
        // Refresh that same PR instead of permanently replaying its pending state.
        const observed = await this.observePullRequestForMutation(
          owner, repository, replay.providerNumber, executionId, expectedHead, base, request.signal
        );
        if (!observed || observed.id !== replay.id || observed.head !== head ||
          observed.operationMarker !== request.operation.operationId) {
          throw new OperationStoreViolationError("Finalized pull-create observation is missing or mismatched");
        }
        this.assertPullHead(observed, expectedHead, base);
        return observed;
      }
      return replay;
    }
    this.throwIfFailedOperation(prepared);
    const finalizeCreated = async (fact: GitHubPullRequestFact): Promise<GitHubPullRequestFact> => {
      const finalized = await this.finalizePull(prepared, fact);
      // Persist creation before waiting. Reuse the bounded, exact-owner/head
      // observation path so a fresh asynchronous mergeability result does not
      // immediately pause the workflow or create another PR.
      return finalized.status === "unknown" ? this.openPullRequest(request) : finalized;
    };
    const existing = await this.findPullRequest(
      owner,
      repository,
      head,
      base,
      request.operation.operationId,
      executionId,
      request.signal
    );
    if (existing) {
      this.assertPullHead(existing, expectedHead, base);
      return finalizeCreated(existing);
    }
    const remoteHead = await this.observeRef(owner, repository, head, request.signal);
    if (remoteHead.status !== "present" || remoteHead.sha !== expectedHead) {
      throw new GitInputError("Pull request head does not match the expected remote SHA");
    }
    const credential = await this.resolveCredential(request.signal);
    try {
      const response = await this.request(
        credential,
        "POST",
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/pulls`,
        {
          signal: request.signal,
          mutation: true,
          expectedStatuses: [201, 422],
          body: {
            title: request.title.trim().slice(0, 250),
            body,
            head,
            base,
            maintainer_can_modify: false
          }
        }
      );
      if (response.status === 201) {
        const created = await this.pullFact(
          owner,
          repository,
          response.data,
          executionId,
          request.signal
        );
        this.assertPullHead(created, expectedHead, base);
        return finalizeCreated(created);
      }
      const reconciled = await this.findPullRequest(
        owner,
        repository,
        head,
        base,
        request.operation.operationId,
        executionId,
        request.signal
      );
      if (reconciled) {
        this.assertPullHead(reconciled, expectedHead, base);
        return finalizeCreated(reconciled);
      }
      await transitionOperation(this.operationStore, prepared, {
        status: "failed",
        remoteFact: { provider: "github", status: 422, head, base }
      });
      throw new GitHubProviderError("GitHub rejected pull request creation", false, {
        status: 422,
        head,
        base
      });
    } catch (error) {
      if (!(error instanceof MutationRequestUncertainError)) throw error;
      await this.markUncertain(prepared, "pull.create");
      const reconciled = await this.tryFindPullRequest(
        owner,
        repository,
        head,
        base,
        request.operation.operationId,
        executionId,
        request.signal
      );
      if (reconciled) {
        this.assertPullHead(reconciled, expectedHead, base);
        return finalizeCreated(reconciled);
      }
      throw new GitHubUncertainResultError(request.operation.operationId, undefined, {
        cause: safeErrorCause(error)
      });
    }
  }

  async mergePullRequest(request: PullMutationRequest): Promise<GitHubPullRequestFact> {
    return this.mutatePull(request, "pull.merge");
  }

  async updatePullRequest(request: PullMutationRequest & { title: string; body: string }): Promise<GitHubPullRequestFact> {
    const owner = safeName(request.owner, "owner"), repository = safeName(request.repository, "repository");
    const executionId = safeId(request.ownerExecutionId, "ownerExecutionId");
    if (request.operation.ownerExecutionId !== executionId) throw new GitInputError("PR update owner differs from its execution");
    const expectedHead = safeSha(request.operation.expectedHead ?? "", "expectedHead");
    const expectedBase = safeBranch(request.operation.expectedBase ?? "");
    if (!request.title.trim() || request.title.length > 250 || request.body.length > 60000 || /\0/.test(request.title + request.body)) throw new GitInputError("Invalid PR title or body");
    const prepared = await prepareOperation(this.operationStore, { id: request.operation.operationId, kind: "pull.update",
      ownerExecutionId: executionId, ownershipEpoch: request.operation.ownershipEpoch, expectedHead, expectedBase },
      { owner, repository, providerNumber: request.providerNumber, expectedHead, expectedBase, title: request.title, bodySha256: sha256(request.body) });
    const replay = this.pullFactFromOperation(prepared); if (replay) return replay;
    this.throwIfFailedOperation(prepared);
    const observe = () => this.observePullRequest(owner, repository, request.providerNumber, executionId, request.signal);
    const before = await observe();
    if (!before) throw new GitHubProviderError("PR no longer exists", false);
    this.assertPullHead(before, expectedHead, expectedBase);
    if (["merged", "closed"].includes(before.status)) throw new GitInputError("Only an open PR can be updated");
    const body = [withoutReservedMarkers(request.body).trimEnd(), executionMarker(executionId),
      ...(before.operationMarker ? [operationMarker(before.operationMarker)] : [])].filter(Boolean).join("\n\n");
    const matches = (fact: GitHubPullRequestFact) => fact.title === request.title && fact.body === body;
    if (matches(before)) return this.finalizePull(prepared, before);
    const credential = await this.resolveCredential(request.signal);
    try {
      await this.request(credential, "PATCH", `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/pulls/${request.providerNumber}`,
        { signal: request.signal, mutation: true, expectedStatuses: [200], body: { title: request.title, body } });
    } catch (error) {
      if (!(error instanceof MutationRequestUncertainError)) throw error;
      await this.markUncertain(prepared, "pull.update");
      const actual = await observe();
      if (actual) { this.assertPullHead(actual, expectedHead, expectedBase); if (matches(actual)) return this.finalizePull(prepared, actual); }
      throw new GitHubUncertainResultError(request.operation.operationId, undefined, { cause: error });
    }
    const after = await observe();
    if (after) { this.assertPullHead(after, expectedHead, expectedBase); if (matches(after)) return this.finalizePull(prepared, after); }
    await this.markUncertain(prepared, "pull.update");
    throw new GitHubUncertainResultError(request.operation.operationId);
  }

  async closePullRequest(request: PullMutationRequest): Promise<GitHubPullRequestFact> {
    return this.mutatePull(request, "pull.close");
  }

  private async mutatePull(
    request: PullMutationRequest,
    kind: "pull.merge" | "pull.close"
  ): Promise<GitHubPullRequestFact> {
    const owner = safeName(request.owner, "owner");
    const repository = safeName(request.repository, "repository");
    const executionId = safeId(request.ownerExecutionId, "ownerExecutionId");
    if (request.operation.ownerExecutionId !== executionId) {
      throw new GitInputError("Pull mutation owner does not match the execution");
    }
    const expectedHead = safeSha(request.operation.expectedHead ?? "", "expectedHead");
    const expectedBase = safeBranch(request.operation.expectedBase ?? "");
    const commitTitle = safeCommitMetadata(request.commitTitle, 250);
    const commitMessage = safeCommitMetadata(request.commitMessage, 4_000);
    const prepared = await prepareOperation(
      this.operationStore,
      {
        id: request.operation.operationId,
        kind,
        ownerExecutionId: executionId,
        ...(request.operation.ownershipEpoch !== undefined
          ? { ownershipEpoch: request.operation.ownershipEpoch }
          : {}),
        expectedHead,
        expectedBase
      },
      {
        provider: "github",
        owner,
        repository,
        providerNumber: request.providerNumber,
        ownerExecutionId: executionId,
        expectedHead,
        expectedBase,
        kind,
        ...(commitTitle ? { commitTitle } : {}),
        ...(commitMessage ? { commitMessageSha256: sha256(commitMessage) } : {})
      }
    );
    const replay = this.pullFactFromOperation(prepared);
    if (replay) return replay;
    if (prepared.status === "failed") {
      const failedFact = this.pullFactFromOperation(prepared, true);
      if (failedFact) return failedFact;
      this.throwIfFailedOperation(prepared);
    }
    const before = await this.observePullRequestForMutation(
      owner,
      repository,
      request.providerNumber,
      executionId,
      expectedHead,
      expectedBase,
      request.signal
    );
    if (!before) throw new GitHubProviderError("Pull request no longer exists", false);
    this.assertPullHead(before, expectedHead, expectedBase);
    if (before.status === "merged") return this.finalizePull(prepared, before);
    if (kind === "pull.close" && before.status === "closed") {
      return this.finalizePull(prepared, before);
    }
    if (kind === "pull.merge" && before.status === "closed") {
      await transitionOperation(this.operationStore, prepared, {
        status: "failed",
        remoteFact: this.pullOperationFact(before)
      });
      return before;
    }

    const credential = await this.resolveCredential(request.signal);
    try {
      const response = kind === "pull.merge"
        ? await this.request(
            credential,
            "PUT",
            `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/pulls/${request.providerNumber}/merge`,
            {
              signal: request.signal,
              mutation: true,
              expectedStatuses: [200, 405, 409],
              body: {
                sha: expectedHead,
                merge_method: "merge",
                commit_title: commitTitle ?? `Merge PR #${request.providerNumber} through OpenFARS`,
                commit_message: [
                  commitMessage,
                  repositoryOperationMarker(request.operation.operationId)
                ].filter(Boolean).join("\n\n")
              }
            }
          )
        : await this.request(
            credential,
            "PATCH",
            `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/pulls/${request.providerNumber}`,
            {
              signal: request.signal,
              mutation: true,
              expectedStatuses: [200],
              body: { state: "closed" }
            }
          );
      const after = await this.observePullRequest(
        owner,
        repository,
        request.providerNumber,
        executionId,
        request.signal
      );
      if (!after) {
        await this.markUncertain(prepared, kind);
        throw new GitHubUncertainResultError(request.operation.operationId);
      }
      this.assertPullHead(after, expectedHead, expectedBase);
      if (kind === "pull.merge" && response.status !== 200) {
        await transitionOperation(this.operationStore, prepared, {
          status: "failed",
          remoteFact: this.pullOperationFact(after)
        });
        return after;
      }
      const terminal = kind === "pull.merge"
        ? after.status === "merged"
        : after.status === "closed" || after.status === "merged";
      if (!terminal) {
        await this.markUncertain(prepared, kind);
        throw new GitHubUncertainResultError(request.operation.operationId);
      }
      return this.finalizePull(prepared, after);
    } catch (error) {
      if (!(error instanceof MutationRequestUncertainError)) throw error;
      await this.markUncertain(prepared, kind);
      const reconciled = await this.tryObservePull(
        owner,
        repository,
        request.providerNumber,
        executionId,
        request.signal
      );
      if (reconciled) {
        this.assertPullHead(reconciled, expectedHead, expectedBase);
        const terminal = kind === "pull.merge"
          ? reconciled.status === "merged"
          : reconciled.status === "closed" || reconciled.status === "merged";
        if (terminal) return this.finalizePull(prepared, reconciled);
      }
      throw new GitHubUncertainResultError(request.operation.operationId, undefined, {
        cause: safeErrorCause(error)
      });
    }
  }

  private async findPullRequest(
    owner: string,
    repository: string,
    head: string,
    base: string,
    expectedOperationId: string,
    expectedExecutionId: ExecutionId,
    signal?: AbortSignal
  ): Promise<GitHubPullRequestFact | undefined> {
    const credential = await this.resolveCredential(signal);
    const query = new URLSearchParams({
      state: "all",
      head: `${owner}:${head}`,
      base,
      per_page: "100"
    });
    const response = await this.request(
      credential,
      "GET",
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/pulls?${query.toString()}`,
      { signal, expectedStatuses: [200] }
    );
    if (!Array.isArray(response.data)) {
      throw new GitHubProviderError("GitHub returned malformed pull request listing", false);
    }
    for (const item of response.data) {
      const row = object(item, "pull request listing item");
      if (
        markerFromBody(row.body) !== expectedOperationId ||
        executionFromBody(row.body) !== expectedExecutionId
      ) {
        continue;
      }
      const number = integer(row.number, "pull request number");
      return this.observePullRequest(
        owner,
        repository,
        number,
        expectedExecutionId,
        signal
      );
    }
    return undefined;
  }

  private async observePullRequestForMutation(
    owner: string,
    repository: string,
    providerNumber: number,
    executionId: ExecutionId,
    expectedHead: string,
    expectedBase: string,
    signal?: AbortSignal
  ): Promise<GitHubPullRequestFact | undefined> {
    // A confirmed ref push can become visible before GitHub's PR read model
    // catches up or finishes computing mergeability. A missing PR or changed
    // base falls through immediately to the caller's strict precondition, and
    // the mutation is never sent until an exact head/base match is observed.
    let observed = await this.observePullRequest(
      owner,
      repository,
      providerNumber,
      executionId,
      signal
    );
    for (
      let attempt = 1;
      observed &&
        observed.base === expectedBase &&
        (observed.headSha !== expectedHead || observed.status === "unknown") &&
        attempt < this.pullHeadConsistencyAttempts;
      attempt += 1
    ) {
      await this.waitForPullHeadConsistency(attempt, signal);
      observed = await this.observePullRequest(
        owner,
        repository,
        providerNumber,
        executionId,
        signal
      );
    }
    return observed;
  }

  private async waitForPullHeadConsistency(
    attempt: number,
    signal?: AbortSignal
  ): Promise<void> {
    const delayMs = Math.min(
      this.pullHeadConsistencyDelayMs * 2 ** (attempt - 1),
      MAX_PULL_HEAD_CONSISTENCY_DELAY_MS
    );
    if (signal?.aborted) {
      throw new GitHubProviderError(
        "GitHub pull request consistency check was cancelled",
        true,
        { cancelled: true }
      );
    }
    if (delayMs === 0) return;
    await new Promise<void>((resolve, reject) => {
      let timer: NodeJS.Timeout | undefined;
      const onAbort = () => {
        if (timer) clearTimeout(timer);
        signal?.removeEventListener("abort", onAbort);
        reject(new GitHubProviderError(
          "GitHub pull request consistency check was cancelled",
          true,
          { cancelled: true }
        ));
      };
      signal?.addEventListener("abort", onAbort, { once: true });
      if (signal?.aborted) {
        onAbort();
        return;
      }
      timer = setTimeout(() => {
        signal?.removeEventListener("abort", onAbort);
        resolve();
      }, delayMs);
    });
  }

  private boundedConsistencyOption(
    value: number | undefined,
    fallback: number,
    minimum: number,
    maximum: number,
    label: string
  ): number {
    const candidate = value ?? fallback;
    if (!Number.isSafeInteger(candidate) || candidate < minimum || candidate > maximum) {
      throw new GitInputError(`${label} is outside the supported range`);
    }
    return candidate;
  }

  private async tryFindPullRequest(
    ...args: Parameters<GitHubUserProvider["findPullRequest"]>
  ): Promise<GitHubPullRequestFact | undefined> {
    try {
      return await this.findPullRequest(...args);
    } catch (error) {
      if (error instanceof GitHubAuthorizationError) throw error;
      return undefined;
    }
  }

  private async tryObserveRepository(
    owner: string,
    repository: string,
    signal?: AbortSignal
  ): Promise<GitHubRepositoryFact | undefined> {
    try {
      return await this.observeRepository(owner, repository, signal);
    } catch (error) {
      if (error instanceof GitHubAuthorizationError) throw error;
      return undefined;
    }
  }

  private async tryObservePull(
    owner: string,
    repository: string,
    providerNumber: number,
    executionId: ExecutionId,
    signal?: AbortSignal
  ): Promise<GitHubPullRequestFact | undefined> {
    try {
      return await this.observePullRequest(
        owner,
        repository,
        providerNumber,
        executionId,
        signal
      );
    } catch (error) {
      if (error instanceof GitHubAuthorizationError) throw error;
      return undefined;
    }
  }

  private async pullFact(
    owner: string,
    repository: string,
    value: unknown,
    expectedOwnerExecutionId?: ExecutionId,
    signal?: AbortSignal
  ): Promise<GitHubPullRequestFact> {
    const data = object(value, "pull request");
    const number = integer(data.number, "pull request number");
    const bodyExecution = executionFromBody(data.body);
    const ownerExecutionId = expectedOwnerExecutionId ?? bodyExecution;
    if (!ownerExecutionId || (bodyExecution && bodyExecution !== ownerExecutionId)) {
      // Return the public ownership facts to the requesting Agent. Preserve
      // the guard; the Agent decides how to inspect or repair its delivery.
      const expected = ownerExecutionId && SAFE_ID.test(ownerExecutionId) ? ownerExecutionId : undefined;
      throw new GitHubProviderError(`Pull request execution marker is missing or mismatched (PR #${number}; expected execution: ${expected ?? "unavailable"}; actual marker: ${bodyExecution ?? "missing"})`, false, {
        providerNumber: number,
        ...(expected ? { expectedOwnerExecutionId: expected } : {}),
        ...(bodyExecution ? { actualOwnerExecutionId: bodyExecution } : {})
      });
    }
    safeId(ownerExecutionId, "ownerExecutionId");
    const head = object(data.head, "pull request head");
    const base = object(data.base, "pull request base");
    const headBranch = safeBranch(string(head.ref, "pull request head ref"));
    const baseBranch = safeBranch(string(base.ref, "pull request base ref"));
    const headSha = safeSha(string(head.sha, "pull request head SHA"), "pull request head SHA");
    const merged = data.merged === true || typeof data.merged_at === "string";
    const state = string(data.state, "pull request state");
    const mergeable = typeof data.mergeable === "boolean" ? data.mergeable : undefined;
    const mergeableState = typeof data.mergeable_state === "string" ? data.mergeable_state : undefined;
    const status: GitHubPullRequestFact["status"] = merged
      ? "merged"
      : state === "closed"
        ? "closed"
        : mergeable === false || mergeableState === "dirty"
          ? "conflicted"
          : mergeable === undefined
            ? "unknown"
            : "open";
    const mergeCommitSha = typeof data.merge_commit_sha === "string" && data.merge_commit_sha
      ? safeSha(data.merge_commit_sha, "merge commit SHA")
      : undefined;
    return {
      id: pullRequestId(owner, repository, number),
      providerNumber: number,
      owner,
      repository,
      htmlUrl: publicUrl(string(data.html_url, "pull request URL"), "pull request URL"),
      head: headBranch,
      headSha,
      base: baseBranch,
      ownerExecutionId,
      ...(typeof data.title === "string" ? { title: data.title } : {}),
      ...(typeof data.body === "string" ? { body: data.body } : {}),
      status,
      ...(mergeable !== undefined ? { mergeable } : {}),
      ...(mergeCommitSha ? { mergeCommitSha } : {}),
      ...(markerFromBody(data.body) ? { operationMarker: markerFromBody(data.body) } : {}),
      checks: await this.observeChecks(owner, repository, headSha, signal),
      observedAt: this.now()
    };
  }

  private repositoryFact(
    value: unknown,
    expectedOwner: string,
    expectedName: string
  ): GitHubRepositoryFact {
    const data = object(value, "repository");
    const owner = object(data.owner, "repository owner");
    const login = string(owner.login, "repository owner login");
    const name = string(data.name, "repository name");
    if (
      login.toLowerCase() !== expectedOwner.toLowerCase() ||
      name !== expectedName ||
      typeof data.private !== "boolean"
    ) {
      throw new GitHubProviderError("Observed repository does not match the repository request", false);
    }
    const defaultBranch = data.default_branch;
    if (defaultBranch !== "main") {
      throw new GitHubProviderError("GitHub repository default branch is not main", false);
    }
    return {
      provider: "github",
      providerId: integer(data.id, "repository id"),
      owner: login,
      name,
      htmlUrl: publicUrl(string(data.html_url, "repository URL"), "repository URL"),
      cloneUrl: cloneWithoutCredentials(string(data.clone_url, "repository clone URL")),
      private: data.private,
      defaultBranch: "main",
      ...(repositoryOperationFromDescription(data.description)
        ? { operationMarker: repositoryOperationFromDescription(data.description) }
        : {}),
      observedAt: this.now()
    };
  }

  private assertRepositoryMarker(
    fact: GitHubRepositoryFact,
    expectedOperationId: string
  ): void {
    if (fact.operationMarker !== expectedOperationId) {
      throw new GitHubProviderError(
        "Existing repository is not owned by the prepared OpenFARS operation",
        false,
        { owner: fact.owner, repository: fact.name }
      );
    }
  }

  private assertRepositoryVisibility(
    fact: GitHubRepositoryFact,
    expectedPrivate: boolean
  ): void {
    if (fact.private !== expectedPrivate) {
      throw new GitHubProviderError("Observed repository visibility does not match the repository request", false);
    }
  }

  private assertPullHead(
    fact: GitHubPullRequestFact,
    expectedHead: string,
    expectedBase: string
  ): void {
    if (fact.headSha !== expectedHead || fact.base !== expectedBase) {
      throw new GitHubProviderError("Pull request facts do not match the prepared operation", false, {
        providerNumber: fact.providerNumber
      });
    }
  }

  private async finalizeRepository(
    prepared: OperationRecord,
    fact: GitHubRepositoryFact
  ): Promise<GitHubRepositoryFact> {
    const remoteFact = fact as unknown as Record<string, unknown>;
    await finalizeOperation(this.operationStore, prepared, remoteFact);
    return fact;
  }

  private async finalizePull(
    prepared: OperationRecord,
    fact: GitHubPullRequestFact
  ): Promise<GitHubPullRequestFact> {
    const remoteFact = this.pullOperationFact(fact);
    await finalizeOperation(this.operationStore, prepared, remoteFact);
    return fact;
  }

  private pullOperationFact(fact: GitHubPullRequestFact): Record<string, unknown> {
    return { ...fact, checks: fact.checks.map((check) => ({ ...check })) };
  }

  private repositoryFactFromOperation(
    operation: OperationRecord
  ): GitHubRepositoryFact | undefined {
    if (operation.status !== "finalized") return undefined;
    const fact = operationFact(operation);
    if (
      fact?.provider !== "github" ||
      typeof fact.providerId !== "number" ||
      typeof fact.owner !== "string" ||
      typeof fact.name !== "string" ||
      typeof fact.htmlUrl !== "string" ||
      typeof fact.cloneUrl !== "string" ||
      typeof fact.private !== "boolean" ||
      fact.defaultBranch !== "main" ||
      typeof fact.observedAt !== "string"
    ) {
      throw new OperationStoreViolationError("Finalized repository fact is malformed");
    }
    return {
      provider: "github",
      providerId: integer(fact.providerId, "repository id"),
      owner: safeName(fact.owner, "owner"),
      name: safeName(fact.name, "repository"),
      htmlUrl: publicUrl(fact.htmlUrl, "repository URL"),
      cloneUrl: cloneWithoutCredentials(fact.cloneUrl),
      private: fact.private,
      defaultBranch: "main",
      ...(typeof fact.operationMarker === "string"
        ? { operationMarker: safeId(fact.operationMarker, "operationMarker") }
        : {}),
      observedAt: fact.observedAt
    };
  }

  private pullFactFromOperation(
    operation: OperationRecord,
    includeFailed = false
  ): GitHubPullRequestFact | undefined {
    if (
      operation.status !== "finalized" &&
      !(includeFailed && operation.status === "failed")
    ) return undefined;
    const fact = operationFact(operation);
    if (
      typeof fact?.id !== "string" ||
      typeof fact.providerNumber !== "number" ||
      typeof fact.owner !== "string" ||
      typeof fact.repository !== "string" ||
      typeof fact.htmlUrl !== "string" ||
      typeof fact.head !== "string" ||
      typeof fact.headSha !== "string" ||
      typeof fact.base !== "string" ||
      typeof fact.ownerExecutionId !== "string" ||
      typeof fact.status !== "string" ||
      typeof fact.observedAt !== "string" ||
      !Array.isArray(fact.checks)
    ) {
      throw new OperationStoreViolationError("Finalized pull request fact is malformed");
    }
    const statuses = new Set(["open", "conflicted", "closed", "merged", "unknown"]);
    if (!statuses.has(fact.status)) {
      throw new OperationStoreViolationError("Finalized pull request status is invalid");
    }
    return {
      id: fact.id,
      providerNumber: integer(fact.providerNumber, "pull request number"),
      owner: safeName(fact.owner, "owner"),
      repository: safeName(fact.repository, "repository"),
      htmlUrl: publicUrl(fact.htmlUrl, "pull request URL"),
      head: safeBranch(fact.head),
      headSha: safeSha(fact.headSha, "head SHA"),
      base: safeBranch(fact.base),
      ownerExecutionId: safeId(fact.ownerExecutionId, "ownerExecutionId"),
      status: fact.status as GitHubPullRequestFact["status"],
      ...(typeof fact.title === "string" ? { title: fact.title } : {}),
      ...(typeof fact.body === "string" ? { body: fact.body } : {}),
      ...(typeof fact.mergeable === "boolean" ? { mergeable: fact.mergeable } : {}),
      ...(typeof fact.mergeCommitSha === "string"
        ? { mergeCommitSha: safeSha(fact.mergeCommitSha, "merge commit SHA") }
        : {}),
      ...(typeof fact.operationMarker === "string"
        ? { operationMarker: safeId(fact.operationMarker, "operationMarker") }
        : {}),
      checks: fact.checks.map((item) => {
        const check = object(item, "stored check");
        return {
          id: integer(check.id, "check id"),
          name: string(check.name, "check name"),
          status: string(check.status, "check status"),
          ...(typeof check.conclusion === "string" ? { conclusion: check.conclusion } : {}),
          ...(typeof check.htmlUrl === "string"
            ? { htmlUrl: publicUrl(check.htmlUrl, "check URL") }
            : {}),
          observedAt: string(check.observedAt, "check observedAt")
        };
      }),
      observedAt: fact.observedAt
    };
  }

  private async markUncertain(
    prepared: OperationRecord,
    stage: string
  ): Promise<void> {
    await transitionOperation(this.operationStore, prepared, {
      status: "uncertain",
      remoteFact: { provider: "github", stage, reconcileRequired: true }
    });
  }

  private throwIfFailedOperation(operation: OperationRecord): void {
    if (operation.status !== "failed") return;
    throw new GitHubProviderError(
      "Prepared GitHub operation previously reached a terminal failure",
      false,
      { operationId: operation.id, kind: operation.kind }
    );
  }

  private async resolveCredential(signal?: AbortSignal): Promise<GitHubCredential> {
    try {
      return await resolveGitHubCredential(this.credentialResolver, signal);
    } catch (error) {
      if (signal?.aborted) {
        throw new GitHubProviderError("GitHub credential resolution was cancelled", true, { cancelled: true });
      }
      throw error;
    }
  }

  private async request(
    credential: GitHubCredential,
    method: "GET" | "POST" | "PUT" | "PATCH",
    requestPath: string,
    options: {
      signal?: AbortSignal;
      expectedStatuses: readonly number[];
      mutation?: boolean;
      body?: Record<string, unknown>;
    }
  ): Promise<ProviderResponse> {
    const url = new URL(requestPath.replace(/^\//, ""), this.baseUrl);
    if (url.origin !== this.baseUrl.origin) {
      throw new GitInputError("GitHub request escaped the configured API origin");
    }
    if (forbiddenGitHubEndpoint(url, this.baseUrl)) {
      throw new GitInputError("GitHub Actions and workflow endpoints are forbidden");
    }
    const controller = new AbortController();
    const onAbort = () => controller.abort(options.signal?.reason);
    options.signal?.addEventListener("abort", onAbort, { once: true });
    if (options.signal?.aborted) controller.abort(options.signal.reason);
    let timer: NodeJS.Timeout;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        const error = new Error("GitHub request timed out");
        controller.abort(error);
        reject(error);
      }, this.timeoutMs);
    });
    const cleanup = () => {
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", onAbort);
    };
    let response: Response;
    try {
      response = await Promise.race([
        this.fetchImpl(url, {
          method,
          redirect: "error",
          signal: controller.signal,
          headers: {
            Accept: "application/vnd.github+json",
            Authorization: `Bearer ${credential.token}`,
            "Content-Type": "application/json",
            "User-Agent": "OpenFARS-collaboration-git",
            "X-GitHub-Api-Version": API_VERSION
          },
          ...(options.body ? { body: JSON.stringify(options.body) } : {})
        }),
        timeout
      ]);
    } catch (error) {
      cleanup();
      if (options.mutation) {
        throw new MutationRequestUncertainError("GitHub mutation transport failed", {
          cause: safeErrorCause(error)
        });
      }
      throw new GitHubProviderError(
        controller.signal.aborted ? "GitHub request timed out or was cancelled" : "GitHub request failed",
        true,
        { method, cancelled: options.signal?.aborted === true },
        { cause: safeErrorCause(error) }
      );
    }
    if (response.status === 401 || response.status === 403) {
      cleanup();
      throw new GitHubAuthorizationError(response.status, "GitHub authorization was rejected");
    }
    let text: string;
    try {
      text = await Promise.race([response.text(), timeout]);
    } catch (error) {
      cleanup();
      if (options.mutation) {
        throw new MutationRequestUncertainError("GitHub mutation response could not be read", {
          cause: safeErrorCause(error)
        });
      }
      throw new GitHubProviderError(
        "GitHub response could not be read",
        true,
        {},
        { cause: safeErrorCause(error) }
      );
    }
    cleanup();
    if (Buffer.byteLength(text, "utf8") > MAX_RESPONSE_BYTES) {
      throw new GitHubProviderError("GitHub response exceeded the safe size limit", false);
    }
    let data: unknown = {};
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (error) {
        if (options.mutation) {
          throw new MutationRequestUncertainError("GitHub mutation returned malformed JSON", {
            cause: safeErrorCause(error)
          });
        }
        throw new GitHubProviderError(
          "GitHub returned malformed JSON",
          false,
          {},
          { cause: safeErrorCause(error) }
        );
      }
    }
    if (!options.expectedStatuses.includes(response.status)) {
      if (options.mutation && response.status >= 500) {
        throw new MutationRequestUncertainError(`GitHub mutation returned ${response.status}`);
      }
      const apiMessage = data && typeof data === "object" && typeof (data as Record<string, unknown>).message === "string"
        ? redactGitDiagnostic((data as Record<string, unknown>).message as string)
        : "GitHub request failed";
      throw new GitHubProviderError(apiMessage, response.status >= 500 || response.status === 429, {
        status: response.status,
        method
      });
    }
    return { status: response.status, headers: response.headers, data };
  }
}
