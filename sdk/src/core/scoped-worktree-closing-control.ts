import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import path from "node:path";
import type { CollaborationControlAuthorityFactory } from "./collaboration-runtime.js";
import type { CollaborationStateDatabase } from "./collaboration-state/store.js";
import type { ScopedWorktreeClosingTurn } from "./collaboration-state/contracts.js";
import type { ProjectStorage } from "./storage.js";
import type { ControlActionEnvelope, ControlMcpRequest, ProjectState, WorktreeClosingScope } from "./types.js";
import type { CollaborationGitFacade } from "./collaboration-git/facade.js";
import { agentGitOperationId, executeAgentGitTool, type AgentGitFacts } from "./agent-git-tools.js";
import { agentGitOperationJournal } from "./agent-git-operation-journal.js";
import { assertWorktreeClosingRequest, worktreeClosingActionAllowed } from "./internal/worktree-closing.js";
import { sameDurableSession } from "./control-result-receipts.js";

/** Invocation-bound execution of the original Agent's explicit closing tools.
 * Scheduling, output/Stop and final issue settlement are separate gates. */
export function scopedWorktreeClosingControlAuthorityFactory(options: {
  state: ProjectState;
  database: CollaborationStateDatabase;
  storage: ProjectStorage;
  closing: ScopedWorktreeClosingTurn;
  /** Allocated before S reservation; never replace the reserved capability. */
  capability: string;
  git: Parameters<typeof executeAgentGitTool>[0]["git"] & Pick<CollaborationGitFacade, "observeRestrictedWorktreeClosing">;
  repository: Parameters<typeof executeAgentGitTool>[0]["repository"];
  signal?: AbortSignal;
  assertCurrent(): Promise<void> | void;
}): CollaborationControlAuthorityFactory {
  const closing = structuredClone(options.closing), capability = options.capability;
  if (!capability || capability.length > 8192 || capability.includes("\0") ||
    createHash("sha256").update(capability).digest("hex") !== closing.capabilityHash) {
    throw new Error("Closing control must retain its exact reserved capability");
  }
  const scope: WorktreeClosingScope = { kind: closing.kind, reportHeadSha: closing.reportHeadSha, paths: [...closing.paths],
    executionId: closing.executionId, ownershipEpoch: closing.ownershipEpoch, grantInvocationId: closing.grantInvocationId, grantCallId: closing.grantCallId };
  const restrictedClosing = { invocationId: closing.invocationId, capabilityHash: closing.capabilityHash,
    scope: { kind: scope.kind, reportHeadSha: scope.reportHeadSha, paths: [...scope.paths] } };
  const execution = { id: closing.executionId, agentId: closing.agentId, purpose: "delivery" as const,
    ownershipEpoch: closing.ownershipEpoch, executionBranch: closing.executionBranch, worktreePath: closing.worktreePath, restrictedClosing };
  const facts: AgentGitFacts = {};
  const assertCurrent = async () => {
    options.signal?.throwIfAborted(); await options.assertCurrent();
    options.database.assertScopedWorktreeClosingControl(closing);
    const git = options.database.projectState(closing.projectId).git;
    if (git?.status !== "ready" || git.repository?.owner !== options.repository.owner || git.repository.name !== options.repository.name) {
      throw new Error("Closing repository differs from its original project authority");
    }
  };
  const ownOperation = (id: string) => options.database.scopedWorktreeClosingOperations(closing.projectId, closing.invocationId)
    .find(operation => operation.id === id);
  const journal = agentGitOperationJournal(options.database, closing.projectId);
  const recordedRequest = (id: string) => {
    const request = journal.recordedRequest(id);
    if (request && (request.invocationId !== closing.invocationId || request.agentId !== closing.agentId ||
      request.executionId !== closing.executionId || request.ownershipEpoch !== closing.ownershipEpoch ||
      request.executionBranch !== closing.executionBranch || !request.nativeBinding ||
      request.nativeBinding.invocationId !== closing.invocationId || request.nativeBinding.runtimePath !== closing.runtimePath ||
      request.nativeBinding.worktreePath !== closing.worktreePath || !sameDurableSession(request.nativeBinding.session, closing.originalSession))) {
      throw new Error("Closing journal cannot adopt another invocation's original request");
    }
    return request;
  };
  return async ({ request, turn }) => {
    assertWorktreeClosingRequest(request, true);
    if (options.state.id !== closing.projectId || request.project.id !== closing.projectId || request.agent !== closing.agentId ||
      request.invocationId !== closing.invocationId || turn.invocationId !== closing.invocationId ||
      !isDeepStrictEqual(request.worktreeClosing, scope) || request.executionContext?.role !== "delivery" || request.executionContext.nodeRunId !== closing.nodeRunId ||
      request.executionContext?.groupRunId !== closing.groupRunId || request.executionContext.executionWorktree !== closing.worktreePath ||
      request.workspacePath !== closing.worktreePath || request.runtimePath !== closing.runtimePath ||
      path.resolve(request.projectPath) !== path.resolve(options.storage.projectDir(closing.projectId)) ||
      !sameDurableSession(request.project.agentSessions![closing.agentId]!, closing.originalSession)) {
      throw new Error("Closing control request differs from its exact original retained native turn");
    }
    await assertCurrent();
    const base = options.database.scopedGroupRun(closing.projectId, closing.groupRunId)!.groupBranch;
    const control: ControlMcpRequest = { stagingPath: path.join(request.runtimePath, "worktree-closing", "control-actions.json"),
      capability, capabilityHash: closing.capabilityHash, stateVersion: closing.ownershipEpoch, candidates: [], decisionBy: "agent",
      allowUserIntervention: false, canComplete: false, requireBridge: true, allowAgentGitActions: true,
      worktreeClosing: structuredClone(scope), workspacePath: closing.worktreePath };
    const assertEnvelope = (envelope: ControlActionEnvelope) => {
      if (envelope.projectId !== closing.projectId || envelope.agent !== closing.agentId || envelope.invocationId !== closing.invocationId ||
        envelope.stateVersion !== closing.ownershipEpoch || envelope.capabilityHash !== closing.capabilityHash ||
        envelope.expiresAt !== control.expiresAt || !worktreeClosingActionAllowed(envelope.action)) {
        throw new Error("Closing action lost its exact live native invocation authority");
      }
    };
    return { control, revalidate: async envelope => {
      assertEnvelope(envelope); await assertCurrent();
      if (envelope.action.tool === "finish_task") {
        const completion = options.database.completeScopedWorktreeClosing({ ...closing, envelope });
        await options.storage.saveScopedWorktreeClosingCompletion(completion);
        await assertCurrent();
      }
    }, execute: async (envelope, toolSignal) => {
      const signal = options.signal && toolSignal ? AbortSignal.any([options.signal, toolSignal]) : toolSignal ?? options.signal;
      assertEnvelope(envelope); await assertCurrent(); signal?.throwIfAborted();
      const action = envelope.action;
      if (action.tool === "finish_task") throw new Error("Closing finish belongs to its separate completion callback");
      if ((action.tool === "git_get_operation" || action.tool === "git_reconcile_push") && !ownOperation(action.operationId)) {
        throw new Error("Closing can inspect or reconcile only this invocation's separate Git operations");
      }
      if (["github_create_pr", "github_merge_pr", "github_close_pr", "github_update_pr"].includes(action.tool)) {
        const observed = await options.git.observeRestrictedWorktreeClosing(execution, closing.ownershipEpoch, scope, signal);
        await assertCurrent();
        if (!facts.pushedHeadSha || observed.head !== facts.pushedHeadSha || observed.pendingPaths.length || !observed.deliveryRequired) {
          throw new Error("Closing PR requires this Agent's confirmed, exact clean B rather than original report A");
        }
        options.database.recordScopedWorktreeClosingCheckpoint({ projectId: closing.projectId, executionId: closing.executionId,
          ownershipEpoch: closing.ownershipEpoch, restrictedClosing, observation: observed });
      }
      const result = await executeAgentGitTool({ git: options.git, repository: options.repository, execution, base, facts, envelope, signal,
        recordedOperation: ownOperation, recordedRequest,
        recordRequest: input => {
          options.database.assertScopedWorktreeClosingControl(closing);
          if (input.action.tool === "git_revert") throw new Error("Closing cannot revert business history");
          const suffix = ({ git_push: "push", github_create_pr: "create", github_merge_pr: "merge", github_close_pr: "close", github_update_pr: "update" } as const)[input.action.tool];
          if (input.invocationId !== closing.invocationId || input.executionId !== closing.executionId || input.agentId !== closing.agentId ||
            input.ownershipEpoch !== closing.ownershipEpoch || input.integrationTarget !== base || input.executionBranch !== closing.executionBranch ||
            input.operationId !== agentGitOperationId({ execution, envelope: {
              projectId: closing.projectId, invocationId: closing.invocationId, callId: input.callId },
              recordedOperation: ownOperation, recordedRequest }, suffix) ||
            options.database.recordedGitOperation(closing.projectId, input.operationId) && !ownOperation(input.operationId)) {
            throw new Error("Closing request cannot replace an original business operation or another closing invocation");
          }
          recordedRequest(input.operationId);
          const accepted = journal.recordRequest(input); recordedRequest(input.operationId); return accepted;
        }, recordedSynchronization: query => options.database.scopedMergedSynchronization(query, closing.invocationId) });
      await assertCurrent(); return result;
    } };
  };
}
