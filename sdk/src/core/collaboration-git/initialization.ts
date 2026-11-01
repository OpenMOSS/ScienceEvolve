import type {
  GitRepositoryVisibility,
  OperationId,
  OperationRecord,
  ProjectGitState
} from "../types.js";
import type {
  CollaborationGitOperationStore,
  GitHubIdentityFact,
  GitHubRefFact,
  GitHubRepositoryFact,
  LocalRepositoryFact
} from "./contracts.js";
import {
  CollaborationGitError,
  GitCommandError,
  GitHubAuthorizationError,
  GitHubProviderError,
  GitHubUncertainResultError,
  GitInputError,
  OperationStoreViolationError
} from "./errors.js";
import { GitHubUserProvider } from "./github-provider.js";
import { LocalCollaborationGitService } from "./local-git.js";
import { redactTrace } from "../utils.js";
import {
  childOperationId,
  finalizeOperation,
  prepareOperation,
  transitionOperation
} from "./operation.js";

export interface GitInitializationRequest {
  projectId: string;
  repositoryName: string;
  repositoryVisibility: GitRepositoryVisibility;
  title: string;
  operationId: OperationId;
  attempt: number;
  priorState?: ProjectGitState;
  signal?: AbortSignal;
}

export interface GitInitializationResult {
  state: ProjectGitState;
  /** In-process cause for the runtime's redacted durable failure record.
   * Never copy the Error object into the public Git checkpoint. */
  failure?: unknown;
  identity?: GitHubIdentityFact;
  repository?: GitHubRepositoryFact;
  localRepository?: LocalRepositoryFact;
}

const STEPS = {
  authorized: "github.authorized",
  repository: "repository.reconciled",
  local: "local.main.initialized",
  origin: "local.origin.configured",
  pushed: "remote.main.observed"
} as const;

const INITIAL_PUSH_POLL_MS = 3_000;
const INITIAL_PUSH_TIMEOUT_MS = 30_000;
const INITIAL_REF_QUERY_TIMEOUT_MS = 5_000;
const INITIAL_PUSH_ATTEMPTS = 2;

type InitialPushOutcome =
  | { kind: "pushed"; head: string }
  | { kind: "observed"; fact: GitHubRefFact }
  | { kind: "failed"; error: unknown }
  | { kind: "timed-out" };

function safeError(error: unknown): string {
  // Keep the trusted error code separate from assignment-shaped text. In
  // particular, "...FOR_AUTHORIZATION: ..." is correctly detected as a
  // credential assignment by the durable-record guard. Do not weaken that
  // guard to accommodate a diagnostic; redact the message before saving it.
  if (error instanceof CollaborationGitError) return `[${error.code}] ${redactTrace(error.message)}`.slice(0, 1_000);
  return "GIT_INITIALIZATION_FAILED: Git initialization failed";
}

function publicRepository(
  repository: GitHubRepositoryFact,
  localPath: string
): NonNullable<ProjectGitState["repository"]> {
  return {
    owner: repository.owner,
    name: repository.name,
    htmlUrl: repository.htmlUrl,
    private: repository.private,
    defaultBranch: "main",
    localPath
  };
}

function refFactFromOperation(operation: OperationRecord): GitHubRefFact | undefined {
  if (operation.status !== "finalized") return undefined;
  const fact = operation.remoteFact;
  if (
    !fact ||
    typeof fact.owner !== "string" ||
    typeof fact.repository !== "string" ||
    typeof fact.ref !== "string" ||
    fact.status !== "present" ||
    typeof fact.sha !== "string" ||
    typeof fact.observedAt !== "string"
  ) {
    throw new OperationStoreViolationError("Finalized main-push fact is malformed");
  }
  return {
    owner: fact.owner,
    repository: fact.repository,
    ref: fact.ref,
    status: "present",
    sha: fact.sha,
    observedAt: fact.observedAt
  };
}

export class CollaborationGitInitializer {
  constructor(
    private readonly provider: GitHubUserProvider,
    private readonly localGit: LocalCollaborationGitService,
    private readonly operationStore: CollaborationGitOperationStore
  ) {}

  async initialize(request: GitInitializationRequest): Promise<GitInitializationResult> {
    if (request.projectId !== this.localGit.projectId) {
      throw new GitInputError("Initializer project does not match the local Git binding");
    }
    if (!Number.isSafeInteger(request.attempt) || request.attempt < 1) {
      throw new GitInputError("Initialization attempt must be a positive safe integer");
    }
    const completed = new Set(request.priorState?.initialization?.completedSteps ?? []);
    let state: ProjectGitState = {
      enabled: true,
      status: "authorizing",
      provider: "github",
      ...(request.priorState?.account
        ? { account: { ...request.priorState.account } }
        : {}),
      ...(request.priorState?.requestedRepositoryName
        ? { requestedRepositoryName: request.priorState.requestedRepositoryName }
        : {}),
      requestedRepositoryVisibility:
        request.priorState?.requestedRepositoryVisibility ?? request.repositoryVisibility,
      ...(request.priorState?.repository
        ? { repository: { ...request.priorState.repository } }
        : {}),
      initialization: {
        operationId: request.operationId,
        attempt: request.attempt,
        completedSteps: [...completed].sort()
      }
    };
    let identity: GitHubIdentityFact | undefined;
    let repository: GitHubRepositoryFact | undefined;
    let localRepository: LocalRepositoryFact | undefined;

    const checkpoint = async (
      status: ProjectGitState["status"],
      error?: string
    ): Promise<void> => {
      state = {
        ...state,
        status,
        initialization: {
          operationId: request.operationId,
          attempt: request.attempt,
          completedSteps: [...completed].sort(),
          ...(error ? { error } : {})
        }
      };
      await this.operationStore.checkpointInitialization({
        projectId: request.projectId,
        operationId: request.operationId,
        attempt: request.attempt,
        state: structuredClone(state)
      });
    };

    try {
      await checkpoint("authorizing");
      identity = await this.provider.verifyIdentity(request.signal);
      completed.add(STEPS.authorized);

      await checkpoint("creating_repository");
      repository = await this.provider.ensureRepository({
        name: request.repositoryName,
        visibility: request.repositoryVisibility,
        description: `OpenFARS project: ${request.title}`,
        operation: { operationId: request.operationId },
        signal: request.signal
      });
      completed.add(STEPS.repository);
      state.repository = publicRepository(repository, this.localGit.repositoryPath);

      await checkpoint("initializing_local");
      localRepository = await this.localGit.initializeMain({
        title: request.title,
        operationId: request.operationId,
        signal: request.signal
      });
      completed.add(STEPS.local);
      await this.localGit.configureOrigin(repository.cloneUrl, request.signal);
      completed.add(STEPS.origin);

      await checkpoint("pushing_main");
      await this.pushMain(
        repository,
        localRepository.head,
        childOperationId(request.operationId, "push-main"),
        request.signal
      );
      completed.add(STEPS.pushed);

      request.signal?.throwIfAborted();
      await checkpoint("ready");
      return { state, identity, repository, localRepository };
    } catch (error) {
      const status: ProjectGitState["status"] = error instanceof GitHubAuthorizationError
        ? "waiting_for_github"
        : "failed";
      await checkpoint(status, safeError(error));
      return { state, identity, repository, localRepository, failure: error };
    }
  }

  private async pushMain(
    repository: GitHubRepositoryFact,
    expectedHead: string,
    operationId: OperationId,
    signal?: AbortSignal
  ): Promise<GitHubRefFact> {
    const prepared = await prepareOperation(
      this.operationStore,
      {
        id: operationId,
        kind: "git.push",
        expectedHead,
        expectedBase: "main"
      },
      {
        provider: "github",
        owner: repository.owner,
        repository: repository.name,
        ref: "main",
        expectedHead
      }
    );
    const replay = refFactFromOperation(prepared);
    if (replay) return replay;

    const before = await this.provider.observeRef(
      repository.owner,
      repository.name,
      "main",
      signal
    );
    if (before.status === "present") {
      if (before.sha !== expectedHead) {
        throw new GitInputError("Remote main exists at another commit; non-fast force is forbidden");
      }
      return this.finalizePush(prepared, before);
    }

    for (let attempt = 1; attempt <= INITIAL_PUSH_ATTEMPTS; attempt += 1) {
      const outcome = await this.pushMainWithObservation(repository, expectedHead, signal);
      if (outcome.kind === "observed") {
        signal?.throwIfAborted();
        return this.finalizePush(prepared, outcome.fact);
      }

      if (outcome.kind !== "pushed" || outcome.head !== expectedHead) {
        const error = outcome.kind === "failed" ? outcome.error
          : outcome.kind === "timed-out"
            ? new GitCommandError(null, "Initial main push exceeded its 30-second transport deadline", {
                command: "push", timedOut: true, timeoutMs: INITIAL_PUSH_TIMEOUT_MS
              })
            : new OperationStoreViolationError("Local push returned another main head");
        await transitionOperation(this.operationStore, prepared, {
          status: "uncertain",
          remoteFact: {
            provider: "github",
            ref: "main",
            expectedHead,
            reconcileRequired: true
          }
        });
        const reconciled = await this.observeInitialMain(repository, signal);
        signal?.throwIfAborted();
        if (reconciled.status === "present" && reconciled.sha === expectedHead) {
          return this.finalizePush(prepared, reconciled);
        }
        // Only service-owned startup transport is retried here. An unknown or
        // different remote head must never authorize another push or startup.
        if (outcome.kind === "timed-out" && reconciled.status === "missing" && attempt < INITIAL_PUSH_ATTEMPTS) {
          continue;
        }
        throw new GitHubUncertainResultError(
          operationId,
          "Git push result is uncertain and remote main did not confirm the expected head",
          { cause: error }
        );
      }

      const observed = await this.observeInitialMain(repository, signal);
      signal?.throwIfAborted();
      if (observed.status !== "present" || observed.sha !== expectedHead) {
        await transitionOperation(this.operationStore, prepared, {
          status: "uncertain",
          remoteFact: {
            provider: "github",
            ref: "main",
            expectedHead,
            reconcileRequired: true
          }
        });
        throw new GitHubUncertainResultError(operationId);
      }
      return this.finalizePush(prepared, observed);
    }
    throw new OperationStoreViolationError("Initial push attempts ended without a remote result");
  }

  private async observeInitialMain(
    repository: GitHubRepositoryFact,
    signal?: AbortSignal
  ): Promise<GitHubRefFact> {
    const controller = new AbortController();
    let deadline: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_resolve, reject) => {
      deadline = setTimeout(() => {
        const error = new GitHubProviderError("Initial main query timed out", true, {
          method: "GET", timeoutMs: INITIAL_REF_QUERY_TIMEOUT_MS
        });
        controller.abort(error);
        reject(error);
      }, INITIAL_REF_QUERY_TIMEOUT_MS);
    });
    try {
      return await Promise.race([
        this.provider.observeRef(repository.owner, repository.name, "main",
          signal ? AbortSignal.any([signal, controller.signal]) : controller.signal),
        timeout
      ]);
    } finally {
      clearTimeout(deadline);
    }
  }

  private async pushMainWithObservation(
    repository: GitHubRepositoryFact,
    expectedHead: string,
    signal?: AbortSignal
  ): Promise<InitialPushOutcome> {
    signal?.throwIfAborted();
    const controller = new AbortController();
    const pushSignal = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;
    return new Promise((resolve) => {
      let settled = false;
      let querying = false;
      const settle = (outcome: InitialPushOutcome) => {
        if (settled) return;
        settled = true;
        clearInterval(poll);
        clearTimeout(deadline);
        signal?.removeEventListener("abort", onAbort);
        // Cancel the original transport and any in-flight query; their late
        // callbacks cannot change the journal or finish initialization again.
        controller.abort();
        resolve(outcome);
      };
      const onAbort = () => settle({ kind: "failed", error: signal?.reason });
      const poll = setInterval(() => {
        if (settled || querying) return;
        querying = true;
        void this.observeInitialMain(repository, pushSignal).then((fact) => {
          if (settled || fact.status !== "present") return;
          if (fact.sha === expectedHead) settle({ kind: "observed", fact });
          else settle({ kind: "failed", error: new GitInputError("Remote main exists at another commit; non-fast force is forbidden") });
        }, () => {
          // A temporarily unavailable read does not cancel a working push.
          // The next poll or the final reconciliation still needs real proof.
        }).finally(() => { querying = false; });
      }, INITIAL_PUSH_POLL_MS);
      const deadline = setTimeout(() => settle({ kind: "timed-out" }), INITIAL_PUSH_TIMEOUT_MS);
      signal?.addEventListener("abort", onAbort, { once: true });
      void Promise.resolve().then(() => {
        pushSignal.throwIfAborted();
        return this.localGit.pushMain(pushSignal);
      }).then((head) => settle({ kind: "pushed", head }), (error) => settle({ kind: "failed", error }));
    });
  }

  private async finalizePush(
    prepared: OperationRecord,
    fact: GitHubRefFact
  ): Promise<GitHubRefFact> {
    const remoteFact = fact as unknown as Record<string, unknown>;
    await finalizeOperation(this.operationStore, prepared, remoteFact);
    return fact;
  }
}
