import { createHash, randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import path from "node:path";
import type { CollaborationControlAuthorityFactory } from "./collaboration-runtime.js";
import type { CollaborationStateStore as CollaborationStateDatabase } from "./collaboration-state/database-worker.js";
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
  const closing = structuredClone(options.closing), grantCapability = options.capability;
  if (!grantCapability || grantCapability.length > 8192 || grantCapability.includes("\0") ||
    createHash("sha256").update(grantCapability).digest("hex") !== closing.capabilityHash) {
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
    await options.database.assertScopedWorktreeClosingControl(closing);
    const git = (await options.database.projectState(closing.projectId)).git;
    if (git?.status !== "ready" || git.repository?.owner !== options.repository.owner || git.repository.name !== options.repository.name) {
      throw new Error("Closing repository differs from its original project authority");
    }
  };
  const ownOperation = async (id: string) => (await options.database.scopedWorktreeClosingOperations(closing.projectId, closing.invocationId))
    .find(operation => operation.id === id);
  const journal = agentGitOperationJournal(options.database, closing.projectId);
  const recordedRequest = async (id: string) => {
    const request = await journal.recordedRequest(id);
    if (request && (request.invocationId !== closing.invocationId || request.agentId !== closing.agentId ||
      request.executionId !== closing.executionId || request.ownershipEpoch !== closing.ownershipEpoch ||
      request.executionBranch !== closing.executionBranch || !request.nativeBinding ||
      request.nativeBinding.invocationId !== closing.invocationId || request.nativeBinding.runtimePath !== closing.runtimePath ||
      request.nativeBinding.worktreePath !== closing.worktreePath || !sameDurableSession(request.nativeBinding.session, closing.originalSession))) {
      throw new Error("Closing journal cannot adopt another invocation's original request");
    }
    return request;
  };
  let activeCapabilityHash: string | undefined;
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
    const base = (await options.database.scopedGroupRun(closing.projectId, closing.groupRunId))!.groupBranch;
    const capability = randomUUID();
    const capabilityHash = createHash("sha256").update(capability).digest("hex");
    const inputKey = createHash("sha256").update(`${turn.invocationId}\0${turn.inputId}`).digest("hex");
    activeCapabilityHash = capabilityHash;
    const assertInputCurrent = async () => {
      await assertCurrent();
      if (activeCapabilityHash !== capabilityHash) throw new Error("Closing action lost its exact live native invocation authority");
    };
    const control: ControlMcpRequest = { stagingPath: path.join(request.runtimePath, "worktree-closing", "control-turns", inputKey, "control-actions.json"),
      capability, capabilityHash, stateVersion: closing.ownershipEpoch, candidates: [], decisionBy: "agent",
      allowUserIntervention: false, canComplete: false, requireBridge: true, allowAgentGitActions: true,
      worktreeClosing: structuredClone(scope), workspacePath: closing.worktreePath };
    const assertEnvelope = (envelope: ControlActionEnvelope) => {
      if (envelope.projectId !== closing.projectId || envelope.agent !== closing.agentId || envelope.invocationId !== closing.invocationId ||
        activeCapabilityHash !== capabilityHash || envelope.stateVersion !== closing.ownershipEpoch || envelope.capabilityHash !== capabilityHash ||
        envelope.expiresAt !== control.expiresAt || !worktreeClosingActionAllowed(envelope.action)) {
        throw new Error("Closing action lost its exact live native invocation authority");
      }
    };
    return { control, revalidate: async envelope => {
      assertEnvelope(envelope); await assertInputCurrent();
      if (envelope.action.tool === "finish_task") {
        const completion = await options.database.completeScopedWorktreeClosing({ ...closing, controlCapabilityHash: capabilityHash, envelope });
        const saved = await options.storage.saveScopedWorktreeClosingCompletion(completion);
        await assertInputCurrent();
        return { ...completion, ...saved };
      }
    }, execute: async (envelope, toolSignal) => {
      const signal = options.signal && toolSignal ? AbortSignal.any([options.signal, toolSignal]) : toolSignal ?? options.signal;
      assertEnvelope(envelope); await assertInputCurrent(); signal?.throwIfAborted();
      const action = envelope.action;
      if (action.tool === "finish_task") throw new Error("Closing finish belongs to its separate completion callback");
      if ((action.tool === "git_get_operation" || action.tool === "git_reconcile_push") && !(await ownOperation(action.operationId))) {
        throw new Error("Closing can inspect or reconcile only this invocation's separate Git operations");
      }
      if (["github_create_pr", "github_merge_pr", "github_close_pr", "github_update_pr"].includes(action.tool)) {
        const observed = await options.git.observeRestrictedWorktreeClosing(execution, closing.ownershipEpoch, scope, signal);
        await assertInputCurrent();
        if (!facts.pushedHeadSha || observed.head !== facts.pushedHeadSha || observed.pendingPaths.length || !observed.deliveryRequired) {
          throw new Error("Closing PR requires this Agent's confirmed, exact clean B rather than original report A");
        }
        await options.database.recordScopedWorktreeClosingCheckpoint({ projectId: closing.projectId, executionId: closing.executionId,
          ownershipEpoch: closing.ownershipEpoch, restrictedClosing, observation: observed });
      }
      const result = await executeAgentGitTool({ git: options.git, repository: options.repository, execution, base, facts, envelope, signal,
        controlCapabilityHash: capabilityHash,
        recordedOperation: ownOperation, recordedRequest,
        recordRequest: async input => {
          await options.database.assertScopedWorktreeClosingControl(closing);
          if (input.action.tool === "git_revert") throw new Error("Closing cannot revert business history");
          const suffix = ({ git_push: "push", github_create_pr: "create", github_merge_pr: "merge", github_close_pr: "close", github_update_pr: "update" } as const)[input.action.tool];
          if (input.invocationId !== closing.invocationId || input.executionId !== closing.executionId || input.agentId !== closing.agentId ||
            input.ownershipEpoch !== closing.ownershipEpoch || input.integrationTarget !== base || input.executionBranch !== closing.executionBranch ||
            input.operationId !== (await agentGitOperationId({ execution, envelope: {
              projectId: closing.projectId, invocationId: closing.invocationId, callId: input.callId },
              recordedOperation: ownOperation, recordedRequest }, suffix)) ||
            (await options.database.recordedGitOperation(closing.projectId, input.operationId)) && !(await ownOperation(input.operationId))) {
            throw new Error("Closing request cannot replace an original business operation or another closing invocation");
          }
          await recordedRequest(input.operationId);
          const accepted = await journal.recordRequest(input); await recordedRequest(input.operationId); return accepted;
        }, recordedSynchronization: async query => await options.database.scopedMergedSynchronization(query, closing.invocationId) });
      await assertInputCurrent(); return result;
    } };
  };
}
