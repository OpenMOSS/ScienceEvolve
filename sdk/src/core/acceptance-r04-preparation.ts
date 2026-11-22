import { gitDeliveryRef } from "./collaboration-git/contracts.js";
import assert from "node:assert/strict";
import { consumeAcceptanceFault, readAcceptanceArmFile } from "./acceptance-controller.js";
import type { ScopedInitialPreparation } from "./scoped-agent-execution.js";

/** A queued arrival is selected before it has an execution/native identity.
 * Bind its actual reservation here, after the saved base and before checkout.
 * The normal failure/Leader retry path remains the sole recovery mechanism. */
export async function failR04InitialPreparation(input: ScopedInitialPreparation & {
  projectTitle: string; projectRoot: string; directory?: string;
}): Promise<void> {
  const { execution, arrival, groupRun, turn } = input;
  if (execution.ownershipEpoch !== 1 || turn.status !== "reserved" || turn.openedAt || turn.stoppedAt) return;
  const bound = await readAcceptanceArmFile({ projectTitle: input.projectTitle, projectRoot: input.projectRoot,
    execution: { ...execution, purpose: "delivery" }, arrivalRequestId: arrival.requestId, groupRunId: groupRun.id,
    base: gitDeliveryRef(groupRun.groupBranch), repository: input.repository, case: "R04", variant: "registered-unopened-preparation",
    directory: input.directory ?? process.env.OPENFARS_R04_PREPARATION_FAULT_DIRECTORY });
  if (!bound) return;
  const { arm } = bound, target = arm.target;
  if (target.selection !== "queued-arrival" || target.executionId !== undefined || target.invocationId !== undefined ||
    target.branch !== undefined || target.ownershipEpoch !== 1 || target.agentId !== execution.agentId ||
    target.arrivalRequestId !== arrival.requestId || target.arrivalSequence !== arrival.sequence ||
    target.targetNodeId !== arrival.targetNodeId || target.groupRunId !== groupRun.id ||
    target.base !== groupRun.groupBranch || target.repository.owner !== input.repository.owner ||
    target.repository.name !== input.repository.name || target.repository.providerId !== input.repository.providerId) return;
  assert.ok(execution.projectId === arm.projectId && execution.arrivalRequestId === arrival.requestId &&
    execution.groupRunId === groupRun.id && arrival.groupRunId === groupRun.id && arrival.agentId === execution.agentId &&
    turn.projectId === arm.projectId && turn.executionId === execution.id && turn.ownershipEpoch === 1 &&
    turn.invocationId && /^[a-f0-9]{40}$/.test(gitDeliveryRef(turn.baseCommit)), "R04 preparation lost its original reservation/base");
  if (await consumeAcceptanceFault(bound, { status: "registered-preparation-failed", stage: "reserved-before-session-begin",
    binding: { executionId: execution.id, invocationId: turn.invocationId, ownershipEpoch: 1, branch: execution.executionBranch,
      worktreePath: execution.worktreePath }, arrival, nativeTurn: turn, savedBase: turn.baseCommit,
    observationLimit: "Runtime events must prove stopped without opened, the original task's authorized retry and preparation from this saved base." })) {
    throw new Error("R04 controlled first preparation failure after registration and saved base, before worktree preparation/native open. Preserve the original arrival and reservation for ordinary Leader recovery.");
  }
}
