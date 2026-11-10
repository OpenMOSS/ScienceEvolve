import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import type { CollaborationControlAuthorityFactory } from "./collaboration-runtime.js";
import type { CollaborationStateStore as CollaborationStateDatabase } from "./collaboration-state/database-worker.js";
import type { TerminalPushObservationTurn } from "./collaboration-state/contracts.js";
import type { ProjectStorage } from "./storage.js";
import type { ControlActionEnvelope, ControlMcpRequest, ProjectState } from "./types.js";
import { executeAgentGitTool } from "./agent-git-tools.js";
import { terminalPushObservationActionAllowed } from "./internal/terminal-push-observation.js";

/** Internal production control mechanism. It does not schedule a business
 * task, choose a Git retry or manufacture the Agent's output/finish/memory. */
export function terminalPushObservationControlAuthorityFactory(options: {
  state: ProjectState;
  database: CollaborationStateDatabase;
  storage: ProjectStorage;
  observation: TerminalPushObservationTurn;
  git: Parameters<typeof executeAgentGitTool>[0]["git"];
  repository: Parameters<typeof executeAgentGitTool>[0]["repository"];
  signal?: AbortSignal;
  /** Coordinator-owned lifetime/pause/writer fence, rechecked around IO. */
  assertCurrent(): Promise<void> | void;
}): CollaborationControlAuthorityFactory {
  const observation = options.observation;
  const assertCurrent = async () => {
    options.signal?.throwIfAborted();
    await options.assertCurrent();
    await options.database.assertTerminalPushObservationControl({ ...observation, operationId: observation.operation.id });
  };
  return async ({ request, turn }) => {
    const context = request.executionContext;
    if (options.state.id !== observation.projectId || request.project.id !== observation.projectId ||
      request.agent !== observation.agentId || request.kind !== "worker" ||
      request.invocationId !== observation.invocationId || turn.invocationId !== observation.invocationId ||
      request.terminalPushObservation?.operationId !== observation.operation.id ||
      context?.role !== "delivery" || context.executionId !== observation.executionId ||
      context.ownershipEpoch !== observation.ownershipEpoch || context.nodeRunId !== observation.nodeRunId ||
      request.workspacePath !== observation.worktreePath || context.executionWorktree !== observation.worktreePath ||
      request.sessionContinuity !== "strict") {
      throw new Error("Terminal observation control request does not match its exact original retained turn");
    }
    await assertCurrent();
    const capability = randomUUID();
    const capabilityHash = createHash("sha256").update(capability).digest("hex");
    const control: ControlMcpRequest = {
      stagingPath: path.join(request.runtimePath, "terminal-push-observation", "control-actions.json"),
      capability, capabilityHash, stateVersion: observation.ownershipEpoch,
      candidates: [], decisionBy: "agent", allowUserIntervention: false, canComplete: false,
      allowAgentGitActions: true, terminalPushObservation: { operationId: observation.operation.id },
      workspacePath: observation.worktreePath, requireBridge: true
    };
    const assertEnvelope = (envelope: ControlActionEnvelope) => {
      if (envelope.projectId !== observation.projectId || envelope.agent !== observation.agentId ||
        envelope.invocationId !== observation.invocationId || envelope.stateVersion !== observation.ownershipEpoch ||
        envelope.capabilityHash !== capabilityHash || envelope.expiresAt !== control.expiresAt ||
        !terminalPushObservationActionAllowed(control.terminalPushObservation!, envelope.action)) {
        throw new Error("Terminal observation action lost its exact live receipt authority");
      }
    };
    return {
      control,
      revalidate: async envelope => {
        assertEnvelope(envelope);
        await assertCurrent();
        if (envelope.action.tool === "finish_task") {
          const completion = await options.database.completeTerminalPushObservation({ ...observation, envelope });
          const saved = await options.storage.saveTerminalPushObservationCompletion(completion);
          await assertCurrent();
          return { ...completion, ...saved };
        }
      },
      execute: async (envelope, signal) => {
        assertEnvelope(envelope);
        await assertCurrent();
        if (envelope.action.tool !== "git_reconcile_push") throw new Error("Terminal observation executes only its original Agent's historical query");
        const result = await executeAgentGitTool({ git: options.git, repository: options.repository,
          execution: { id: observation.executionId, agentId: observation.agentId, purpose: "delivery",
            ownershipEpoch: observation.ownershipEpoch, executionBranch: observation.executionBranch,
            worktreePath: observation.worktreePath }, base: "main", facts: {}, envelope,
          recordedOperation: async id => await options.database.recordedGitOperation(observation.projectId, id), signal });
        await assertCurrent();
        return result;
      }
    };
  };
}
