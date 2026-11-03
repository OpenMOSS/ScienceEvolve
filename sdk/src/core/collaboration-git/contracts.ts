import type {
  AgentId,
  ExecutionId,
  GroupRunId,
  MemberExecution,
  OperationId,
  OperationRecord,
  ProjectGitState,
  PullRequestId
} from "../types.js";

/** The execution fields the trusted Git service is allowed to rely on. */
export type GitExecutionAuthority = Pick<
  MemberExecution,
  | "id"
  | "agentId"
  | "groupRunId"
  | "purpose"
  | "ownershipEpoch"
  | "executionBranch"
  | "worktreePath"
> & {
  /** Service-only binding for an opened original-task closing invocation.
   * Never reconstructed from an Agent's Git arguments. */
  restrictedClosing?: RestrictedWorktreeClosingAuthority;
};

export interface RestrictedWorktreeClosingAuthority {
  invocationId: string;
  capabilityHash: string;
  scope: RestrictedWorktreeClosingScope;
}

/** Authority for the canonical group PR requested by the Leader-assigned
 * native Agent. It reuses the published group head; the surrounding native
 * turn owns the Agent identity/session and does not create a business task. */
export interface GitGroupFinalAuthority {
  id: ExecutionId;
  groupRunId: GroupRunId;
  ownershipEpoch: number;
  executionBranch: string;
  purpose: "group-final-integration";
}

export interface ExecutionOwnershipAssertion {
  projectId: string;
  executionId: ExecutionId;
  ownershipEpoch: number;
  expectedBranch: string;
  /** Exact retained provider fact required by stopped-owner merge reconciliation. */
  providerNumber?: number;
  expectedHeadSha?: string;
  expectedBase?: string;
  expectedMergeCommitSha?: string;
  restrictedClosing?: RestrictedWorktreeClosingAuthority;
  operation:
    | "worktree.create"
    | "checkpoint"
    | "merge.prepare"
    | "merge.integrate"
    | "memory.write"
    | "retained.observe"
    | "provider.close_terminal"
    | "provider.reconcile_merged"
    | "provider.mutate";
}

export interface OperationTransition {
  id: OperationId;
  payloadHash: string;
  status: Exclude<OperationRecord["status"], "prepared">;
  remoteFact?: Record<string, unknown>;
}

/** The live calling Agent may observe its own older push. This identity is
 * a historical receipt owner, never a restored Git write capability. */
export interface RetainedPushObservation {
  projectId: string;
  executionId: ExecutionId;
  ownershipEpoch: number;
  expectedBranch: string;
  operationId: OperationId;
  payloadHash: string;
  /** Exact physical receipt-only turn when the original task is terminal. */
  invocationId?: string;
}

export interface RetainedPushOwner {
  executionId: ExecutionId;
  ownershipEpoch: number;
  agentId: AgentId;
  executionBranch: string;
  /** Present only for an opened, finite terminal-task observation turn. */
  observationInvocationId?: string;
}

/** A live original owner explicitly reconciles one unknown push. This is
 * evidence transport, not a new publication or renewed historical authority. */
export interface PushSupersessionInput {
  projectId: string;
  executionId: ExecutionId;
  ownershipEpoch: number;
  expectedBranch: string;
  operationId: OperationId;
  payloadHash: string;
  invocationId: string;
  remote: GitHubRefFact;
}

export interface PushSupersessionProof {
  kind: "included_in_later_publication";
  publicationOperationId: OperationId;
  publicationPayloadHash: string;
  originalHead: string;
  remote: GitHubRefFact;
  verifyingInvocationId: string;
  /** Keep the old unknown result; this never claims the original push succeeded. */
  originalStatus: OperationRecord["status"];
  originalRemoteFact?: Record<string, unknown>;
}

export interface InitializationCheckpoint {
  projectId: string;
  operationId: OperationId;
  attempt: number;
  state: ProjectGitState;
}

/**
 * Implemented by S. G never persists an operation journal of its own: every
 * externally visible mutation is prepared and transitioned through this
 * interface, and every execution write is fenced by the authoritative epoch.
 */
export interface CollaborationGitOperationStore {
  /** Trusted local Git publishes a complete, clean A→B observation before
   * the separate closing journal may prepare any provider mutation. */
  recordRestrictedClosingCheckpoint?(input: RestrictedClosingCheckpointInput): Promise<void>;
  /** Read exactly one S-owned journal record; never create or select a retry. */
  recordedOperation?(operationId: OperationId): Promise<OperationRecord | undefined>;
  activeRevertOperation?(executionId: ExecutionId): Promise<OperationRecord | undefined>;
  assertRetainedPushObservation?(input: RetainedPushObservation): Promise<RetainedPushOwner>;
  recordRetainedPushObservation?(input: RetainedPushObservation & { remote: GitHubRefFact }): Promise<OperationRecord>;
  confirmedPushPublication?(input: PushSupersessionInput): Promise<OperationRecord | undefined>;
  recordPushSupersession?(input: PushSupersessionInput & {
    publicationOperationId: OperationId; publicationPayloadHash: string;
  }): Promise<OperationRecord>;
  /** Service-only group Finish receipt, never an Agent-supplied report. */
  scopedGroupCompletionReport?(projectId: string, groupRunId: string): Promise<{ branch: string; content: string }>;
  prepare(record: OperationRecord): Promise<OperationRecord>;
  transition(input: OperationTransition): Promise<OperationRecord>;
  assertExecutionOwnership(input: ExecutionOwnershipAssertion): Promise<void>;
  recordMergedSynchronization(input: {
    projectId: string;
    executionId: ExecutionId;
    ownershipEpoch: number;
    providerNumber: number;
    expectedHead: string;
    expectedBase: string;
    expectedMergeCommitSha: string;
    synchronization: RemoteMergeSyncFact;
  }): Promise<void>;
  checkpointInitialization(input: InitializationCheckpoint): Promise<void>;
}

export interface RestrictedClosingCheckpointInput {
  projectId: string;
  executionId: string;
  ownershipEpoch: number;
  restrictedClosing: RestrictedWorktreeClosingAuthority;
  observation: RestrictedWorktreeClosingFact;
}

export interface GitProjectBinding {
  projectId: string;
  projectRoot: string;
}

export interface GitCommandRequest {
  cwd: string;
  args: readonly string[];
  signal?: AbortSignal;
  stdin?: string;
  /** Trusted service-only environment additions; never supplied by an Agent. */
  environment?: Readonly<Record<string, string>>;
  acceptedExitCodes?: readonly number[];
  /** Only the Git service's generated merge-preview checkout may use forced removal. */
  previewCleanup?: boolean;
  /** Service-only bounded read output. Never silently truncate history/patches. */
  completeOutput?: boolean;
  /** Internal lifecycle guard, rechecked after async credential resolution. */
  beforeSpawn?(): Promise<void>;
}

export interface GitCommandResult {
  code: number;
  stdout: string;
  stderr: string;
}

export interface GitCommandRunner {
  run(request: GitCommandRequest): Promise<GitCommandResult>;
}

export interface LocalRepositoryFact {
  projectId: string;
  repositoryPath: string;
  branch: "main";
  head: string;
  observedAt: string;
}

export interface LocalWorktreeFact {
  projectId: string;
  executionId: ExecutionId;
  ownershipEpoch: number;
  branch: string;
  worktreePath: string;
  head: string;
  retained: true;
  observedAt: string;
}

/** Read-only distinction between a native reservation and an actually
 * prepared delivery branch. Missing refs never authorize a reset. */
export interface LocalDeliveryPreparationFact {
  projectId: string;
  executionId: ExecutionId;
  ownershipEpoch: number;
  branch: string;
  worktreePath: string;
  head?: string;
  activationBase?: string;
  observedAt: string;
}

export interface LocalCheckpointFact extends LocalWorktreeFact {
  commitSha: string;
  changed: boolean;
  operationMarker?: string;
}

export interface LocalWorktreeStatusFact extends LocalWorktreeFact {
  /** Tracked/index changes and untracked files, using Git's actual ignores. */
  pendingPaths: string[];
}

/** A manager must explicitly authorize these exact files for an original
 * task's separate closing turn. This manifest is not a Git write grant. */
export interface RestrictedWorktreeClosingScope {
  kind: "completed-leftovers" | "bound-report-memory";
  reportHeadSha: string;
  paths: readonly string[];
}

export interface RestrictedWorktreeClosingFact extends LocalWorktreeStatusFact {
  kind: RestrictedWorktreeClosingScope["kind"];
  reportHeadSha: string;
  authorizedPaths: string[];
  /** Real tree difference from the immutable business report to this head. */
  committedPaths: string[];
  /** A distinct head needs its own closing delivery, even with a clean tree. */
  deliveryRequired: boolean;
}

/** Read-only proof of the actual future task base; not a merge, sync action
 * or permission to release the original owner. */
export interface RestrictedWorktreeClosingTargetFact {
  projectId: string;
  executionId: ExecutionId;
  ownershipEpoch: number;
  owner: string;
  repository: string;
  targetBranch: "main" | `groups/${string}`;
  localHead: string;
  remoteHead: string;
  includedHeads: string[];
  observedAt: string;
}

export interface LocalMergeFact {
  projectId: string;
  sourceBranch: string;
  targetBranch: string;
  sourceHead: string;
  targetHeadBefore: string;
  targetHeadAfter: string;
  status: "mergeable" | "already_integrated" | "conflicted";
  conflictPaths: string[];
  observedAt: string;
}

export interface RemoteMergeSyncFact {
  projectId: string;
  operationId: OperationId;
  targetBranch: "main" | `groups/${string}`;
  temporaryRef: string;
  expectedSourceHead: string;
  mergeCommitSha: string;
  remoteHead: string;
  localHeadBefore: string;
  localHeadAfter: string;
  status: "synchronized" | "already_synchronized";
  observedAt: string;
}

export interface OwnerResolutionFact {
  projectId: string;
  executionId: ExecutionId;
  executionBranch: string;
  sourceBranch: string;
  sourceHead: string;
  status: "ready_to_commit" | "conflicted" | "already_contained";
  conflictPaths: string[];
  observedAt: string;
}

export interface GitHubCredential {
  token: string;
  /** Scopes requested by OpenFARS when obtaining this credential. */
  requestedScopes: readonly string[];
}

export type GitHubCredentialResolver = (
  signal?: AbortSignal
) => Promise<GitHubCredential>;

export interface GitHubIdentityFact {
  login: string;
  id: number;
  requestedScopes: readonly string[];
  advertisedScopes: readonly string[];
  observedAt: string;
}

export interface GitHubRepositoryFact {
  provider: "github";
  providerId: number;
  owner: string;
  name: string;
  htmlUrl: string;
  cloneUrl: string;
  private: boolean;
  defaultBranch: "main";
  /** Provider-visible idempotency marker parsed from the repository description. */
  operationMarker?: OperationId;
  observedAt: string;
}

export interface GitHubRefFact {
  owner: string;
  repository: string;
  ref: string;
  sha?: string;
  status: "present" | "missing";
  observedAt: string;
}

export interface GitHubCheckFact {
  id: number;
  name: string;
  status: string;
  conclusion?: string;
  htmlUrl?: string;
  observedAt: string;
}

export interface GitHubPullRequestFact {
  title?: string;
  body?: string;
  id: PullRequestId;
  providerNumber: number;
  owner: string;
  repository: string;
  htmlUrl: string;
  head: string;
  headSha: string;
  base: string;
  ownerExecutionId: ExecutionId;
  status: "open" | "conflicted" | "closed" | "merged" | "unknown";
  mergeable?: boolean;
  mergeCommitSha?: string;
  operationMarker?: string;
  checks: GitHubCheckFact[];
  observedAt: string;
}

export interface GitOperationContext {
  operationId: OperationId;
  ownerExecutionId?: ExecutionId;
  ownershipEpoch?: number;
  expectedHead?: string;
  expectedBase?: string;
}

export interface ManagementMemoryEntry {
  agentId: AgentId;
  path: string;
  content: string;
}

export interface ManagementMemorySnapshot {
  branch: "management/memory";
  commitSha: string;
  provenance: string;
  entries: ManagementMemoryEntry[];
  observedAt: string;
}

export interface GroupBranchBinding {
  groupRunId: GroupRunId;
  branch: string;
  baseCommit: string;
}

export interface ReadonlyGitProjection {
  repository?: {
    owner: string;
    name: string;
    htmlUrl: string;
    private: boolean;
    defaultBranch: "main";
    status: "ready" | "waiting_for_github" | "failed";
  };
  branches: Array<{
    name: string;
    head?: string;
    base?: string;
    ownerExecutionId?: ExecutionId;
    status: string;
    observedAt: string;
  }>;
  pullRequests: Array<{
    id: PullRequestId;
    providerNumber: number;
    htmlUrl: string;
    diffUrl: string;
    head: string;
    base: string;
    ownerExecutionId: ExecutionId;
    status: GitHubPullRequestFact["status"];
    mergeable?: boolean;
    mergeCommitSha?: string;
    checks: GitHubCheckFact[];
    observedAt: string;
  }>;
  commits: Array<{ sha: string; htmlUrl?: string }>;
  blockers: string[];
  observedAt: string;
}
