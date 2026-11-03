import { isDeepStrictEqual } from "node:util";
import type { CollaborationStateDatabase } from "./collaboration-state/store.js";
import type { AgentNativeSessionBinding } from "./collaboration-state/contracts.js";
import type { ControlAction } from "./types.js";
import { OperationPayloadMismatchError, OperationStoreViolationError } from "./collaboration-git/errors.js";

export interface AgentGitOperationRequest {
  operationId: string;
  projectId: string;
  executionId: string;
  ownershipEpoch: number;
  executionBranch: string;
  integrationTarget: string;
  repository: { owner: string; name: string };
  agentId: string;
  invocationId: string;
  callId: string;
  requestedAt: string;
  expectedHead?: string;
  action: Extract<ControlAction, { tool: "git_push" | "github_create_pr" | "github_merge_pr" | "github_close_pr" | "github_update_pr" | "git_revert" }>;
}

export interface RecordedAgentGitOperationRequest extends AgentGitOperationRequest {
  schemaVersion: 1;
  /** Older journals cannot acquire invented original request provenance. */
  operationAlreadyExisted: boolean;
  nativeBinding?: AgentNativeSessionBinding;
}

type Journal = Pick<CollaborationStateDatabase, "eventByRequestId" | "appendEvent" | "recordedGitOperation">;

/** Called only inside an already revalidated original Agent control callback.
 * Retains the request before any checkpoint/provider mutation, using existing
 * append-only events. This record is neither a result nor a delivery receipt. */
export function agentGitOperationJournal(database: Journal, projectId: string) {
  const recordedRequest = (operationId: string): RecordedAgentGitOperationRequest | undefined => {
    const event = database.eventByRequestId(projectId, `agent-git-request:${operationId}`);
    if (!event) return undefined;
    const request = event.payload.request as unknown as RecordedAgentGitOperationRequest;
    if (event.type !== "agent.git.operation.requested" || request?.schemaVersion !== 1 ||
      request.projectId !== projectId || request.operationId !== operationId ||
      event.invocationId !== request.invocationId || event.agentId !== request.agentId) {
      throw new OperationStoreViolationError("Recorded Agent Git request has inconsistent original provenance");
    }
    return request;
  };
  const recordRequest = (input: AgentGitOperationRequest): RecordedAgentGitOperationRequest => {
    if (input.projectId !== projectId || !input.operationId || !input.executionId || !input.agentId ||
      !input.invocationId || !input.callId || !Number.isSafeInteger(input.ownershipEpoch) || input.ownershipEpoch < 1 ||
      !input.executionBranch || !input.integrationTarget || !Number.isFinite(Date.parse(input.requestedAt)) ||
      !["git_push", "github_create_pr", "github_merge_pr", "github_close_pr", "github_update_pr", "git_revert"].includes(input.action.tool)) {
      throw new OperationStoreViolationError("Agent Git request requires its exact task, caller and direct target");
    }
    const prior = recordedRequest(input.operationId);
    if (prior) {
      const { schemaVersion: _schema, operationAlreadyExisted: _existed, nativeBinding: _binding,
        invocationId: _invocation, requestedAt: _time, ...original } = prior;
      const { invocationId: _currentInvocation, requestedAt: _currentTime, ...replayed } = input;
      if (!isDeepStrictEqual(original, replayed)) throw new OperationPayloadMismatchError(input.operationId);
      // A later physical turn may replay the same request. Keep its first
      // source session/invocation and exact arguments; never replace them.
      return prior;
    }
    const bindingEvent = database.eventByRequestId(projectId, `agent-native-binding:${input.invocationId}`);
    const binding = bindingEvent?.payload.binding as unknown as AgentNativeSessionBinding | undefined;
    if (binding && (bindingEvent?.type !== "agent.native_binding.opened" || binding.projectId !== projectId ||
      binding.agentId !== input.agentId || binding.invocationId !== input.invocationId ||
      binding.executionContext.role === "leader" || binding.executionContext.executionId !== input.executionId ||
      binding.executionContext.ownershipEpoch !== input.ownershipEpoch)) {
      throw new OperationStoreViolationError("Agent Git request differs from its exact native session binding");
    }
    const request: RecordedAgentGitOperationRequest = { ...structuredClone(input), schemaVersion: 1,
      operationAlreadyExisted: database.recordedGitOperation(projectId, input.operationId) !== undefined,
      ...(binding ? { nativeBinding: structuredClone(binding) } : {}) };
    database.appendEvent({ projectId, agentId: input.agentId, invocationId: input.invocationId,
      requestId: `agent-git-request:${input.operationId}`, type: "agent.git.operation.requested", payload: { request } });
    return request;
  };
  return { recordRequest, recordedRequest };
}
