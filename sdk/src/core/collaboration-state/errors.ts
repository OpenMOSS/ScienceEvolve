export type CollaborationStateErrorCode =
  | "UNSAFE_CONFIGURATION"
  | "DATABASE_INTEGRITY_FAILED"
  | "WRITER_LEASE_HELD"
  | "WRITER_LEASE_STALE"
  | "WRITER_UPGRADE_REQUIRED"
  | "WRITER_COMMIT_UNCONFIRMED"
  | "PROJECT_NOT_FOUND"
  | "RECORD_NOT_FOUND"
  | "STALE_PROJECT_REVISION"
  | "STALE_STATE_VERSION"
  | "STATE_READ_SNAPSHOT_EXPIRED"
  | "STATE_SCOPE_DENIED"
  | "STALE_WORKFLOW_CONFIGURATION"
  | "WORKFLOW_ADJUSTMENT_CONFLICT"
  | "WORKFLOW_ADJUSTMENT_PENDING"
  | "STALE_COORDINATOR_EPOCH"
  | "STALE_OWNERSHIP_EPOCH"
  | "ACTIVE_NODE_CONFLICT"
  | "IDEMPOTENCY_CONFLICT"
  | "INVALID_STATE_TRANSITION"
  | "PROJECT_FROZEN"
  | "WORKFLOW_EDIT_LOCKED"
  | "CREDENTIAL_DATA_REJECTED"
  | "CAPACITY_UNAVAILABLE";

export class CollaborationStateError extends Error {
  constructor(
    readonly code: CollaborationStateErrorCode,
    message: string,
    readonly details: Readonly<Record<string, unknown>> = {},
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "CollaborationStateError";
  }
}

export class StaleProjectRevisionError extends CollaborationStateError {
  constructor(projectId: string, expectedRevision: number, actualRevision: number) {
    super(
      "STALE_PROJECT_REVISION",
      `Project ${projectId} is at revision ${actualRevision}, not ${expectedRevision}`,
      { projectId, expectedRevision, actualRevision }
    );
    this.name = "StaleProjectRevisionError";
  }
}

export class StaleCoordinatorEpochError extends CollaborationStateError {
  constructor(groupRunId: string, expectedEpoch: number, actualEpoch: number) {
    super(
      "STALE_COORDINATOR_EPOCH",
      `Group ${groupRunId} coordinator epoch is ${actualEpoch}, not ${expectedEpoch}`,
      { groupRunId, expectedEpoch, actualEpoch }
    );
    this.name = "StaleCoordinatorEpochError";
  }
}

export class StaleOwnershipEpochError extends CollaborationStateError {
  constructor(executionId: string, expectedEpoch: number, actualEpoch?: number) {
    super(
      "STALE_OWNERSHIP_EPOCH",
      `Execution ${executionId} no longer owns writes at epoch ${expectedEpoch}`,
      { executionId, expectedEpoch, actualEpoch }
    );
    this.name = "StaleOwnershipEpochError";
  }
}
