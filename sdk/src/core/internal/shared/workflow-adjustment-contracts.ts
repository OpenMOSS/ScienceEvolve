/** Credential-free adjustment journal and API shapes shared by server and UI.
 * Snapshot remains a generic so browser contracts do not import server runtime code. */
export interface WorkflowAdjustmentSession {
  schemaVersion: 1; harnessId: string; adapterVersion: string; generation: number;
  nativeId: string; durable: boolean; createdAt: string; resumedAt?: string;
}

/** A configuration version excludes heartbeats, queue events and task progress. */
export interface WorkflowConfigurationVersion { revision: number; hash: string }
type WorkflowMainSource = {
  kind: "main"; acceptedRequestId: string; acceptedEventId: string;
  invocationId: string; callId: string; session?: WorkflowAdjustmentSession;
};
export type WorkflowAdjustmentSource = { kind: "user" } | (WorkflowMainSource & {
  nodeRunId: string; routeEpoch: number;
  scope?: { kind: "scoped"; groupRunId: string; coordinatorEpoch: number };
}) | (WorkflowMainSource & {
  scope: { kind: "serial"; agentExecutionId: string; mainInvocationSeq: number } | { kind: "conversation"; messageId: string };
  nodeRunId?: never; routeEpoch?: never;
}) | {
  kind: "scoped_leader"; agentId: string; acceptedRequestId: string; acceptedEventId: string;
  invocationId: string; callId: string; nodeRunId: string; groupRunId: string; coordinatorEpoch: number; session?: WorkflowAdjustmentSession;
};
export type WorkflowAdjustmentStatus = "pending" | "needs_resubmission" | "applied" | "withdrawn" | "replaced" | "failed";
export interface WorkflowAdjustmentChange {
  path: string[]; kind: "added" | "removed" | "changed"; before?: unknown; after?: unknown;
}
export interface WorkflowAdjustmentSubmission<Snapshot> {
  projectId: string; requestId: string; source: WorkflowAdjustmentSource;
  submittedAt: string; base: WorkflowConfigurationVersion;
  baseSnapshot: Snapshot; proposal: Snapshot;
  explanation: string; changes: WorkflowAdjustmentChange[]; replacesRequestId?: string;
}
export interface WorkflowAdjustmentTransition {
  requestId: string; status: WorkflowAdjustmentStatus; at: string;
  reason?: string; currentVersion?: WorkflowConfigurationVersion;
  appliedVersion?: WorkflowConfigurationVersion; replacedByRequestId?: string;
  operationId?: string; note?: string;
}
export interface WorkflowAdjustmentRecord<Snapshot> extends WorkflowAdjustmentSubmission<Snapshot> {
  status: WorkflowAdjustmentStatus; history: WorkflowAdjustmentTransition[];
  waitingReason?: string; currentVersion: WorkflowConfigurationVersion;
}
export interface WorkflowAdjustmentPublication {
  requestId: string; status: WorkflowAdjustmentStatus; workflowRevision: number;
  currentVersion: WorkflowConfigurationVersion; appliedVersion?: WorkflowConfigurationVersion;
  reason?: string; replay: boolean;
}
export interface SubmitUserWorkflowAdjustmentInput<Snapshot> {
  projectId: string; requestId: string; base: WorkflowConfigurationVersion;
  proposal: Snapshot; explanation?: string; replacesRequestId?: string;
}
export interface WorkflowAdjustmentContext<Snapshot> {
  current: { version: WorkflowConfigurationVersion; snapshot: Snapshot };
  records: WorkflowAdjustmentRecord<Snapshot>[];
  /** Public editor constraints; native identities and credentials remain private. */
  constraints?: { agentHarnesses: Record<string, { harnessId: string; reason: string }> };
}
export interface WorkflowAdjustmentSubmissionResult<Snapshot> {
  record: WorkflowAdjustmentRecord<Snapshot>; revision: number; replay: boolean;
}
export interface WorkflowAdjustmentWithdrawalResult<Snapshot> extends WorkflowAdjustmentSubmissionResult<Snapshot> { withdrawn: boolean }

/** Metadata for browsing; selecting a record retrieves its immutable full facts. */
export interface WorkflowAdjustmentSummary {
  projectId: string; requestId: string; submissionSequence: number;
  source: WorkflowAdjustmentSource; submittedAt: string; base: WorkflowConfigurationVersion;
  status: WorkflowAdjustmentStatus; currentVersion: WorkflowConfigurationVersion;
  changeCount: number; waitingReason?: string; appliedVersion?: WorkflowConfigurationVersion;
  replacesRequestId?: string; replacedByRequestId?: string;
}
export interface WorkflowAdjustmentPageInput {
  limit?: number; before?: number; expectedVersion?: string; watchRequestId?: string;
}
export interface WorkflowAdjustmentPage<Snapshot> {
  journalVersion: string; currentVersion: WorkflowConfigurationVersion;
  records: WorkflowAdjustmentSummary[]; total: number; nextBefore?: number;
  /** Only the first page includes the full current editor configuration. */
  current?: WorkflowAdjustmentContext<Snapshot>["current"];
  constraints?: WorkflowAdjustmentContext<Snapshot>["constraints"];
  userRequest?: WorkflowAdjustmentSummary | null;
  operationRecord?: WorkflowAdjustmentSummary | null;
}
export interface WorkflowAdjustmentDetail<Snapshot> {
  journalVersion: string; record: WorkflowAdjustmentRecord<Snapshot>;
}
