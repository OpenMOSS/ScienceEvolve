import { isDeepStrictEqual } from "node:util";
import type { CollaborationStateStore as CollaborationStateDatabase } from "./collaboration-state/database-worker.js";
import { CollaborationStateError } from "./collaboration-state/errors.js";
import { mainAgentOrchestrationDocument, type AgentOrchestrationProposal } from "./agent-orchestration-reconfiguration.js";
import type { ProjectStorage } from "./storage.js";
import type { ProjectState } from "./types.js";
import { assertWorkflowGatewaySnapshots, credentialFreeAgentConfiguration, restoreAgentConfiguration, workflowGatewaySnapshotsNeedValidation } from "./scoped-agent-configuration.js";
import { archiveRemovedWorkflowAgentSessions, removedWorkflowAgentTaskReason } from "./workflow-session-archive.js";
import { sameWorkflowConfigurationVersion } from "./workflow-adjustments.js";

// A surviving owner can add an original private snapshot while a failed file
// publication is in flight. Retain it and require persistence on that same
// state object before a later recovery may report a configuration noop.
const unpersistedSerialConfigurations = new WeakSet<ProjectState>();

/** Runs before the SDK scheduler starts, or inside its exclusive project-write
 * boundary. Only configuration comes from this metadata journal. SDK tasks,
 * Sessions, queue ownership, Loop progress and budgets remain SDK-owned. */
export async function restoreSerialWorkflowConfiguration(database: CollaborationStateDatabase, storage: ProjectStorage,
  state: ProjectState, validate: ((state: ProjectState, proposal: AgentOrchestrationProposal) => Promise<void>) | undefined
): Promise<{ changed: boolean } | undefined> {
  const current = await database.serialWorkflowAdjustmentCurrent(state.id);
  if (!current) return undefined;
  await database.assertWriterLeaseHeld();
  if (state.git?.enabled || state.orchestration.schemaVersion === 3)
    throw new CollaborationStateError("INVALID_STATE_TRANSITION", "Serial configuration recovery cannot replace the project's scheduler");
  if ((state.workflowRevision ?? 1) > current.version.revision)
    throw new CollaborationStateError("WORKFLOW_ADJUSTMENT_CONFLICT", "SDK workflow revision is ahead of its serial journal; recovery cannot roll it back");
  const snapshot = () => ({ orchestration: state.orchestration, ...credentialFreeAgentConfiguration({ agents: state.agents,
    skillDefinitions: state.skillDefinitions ?? {}, mcpDefinitions: state.mcpDefinitions ?? {} }) });
  const before = structuredClone(snapshot()), previousRevision = state.workflowRevision, previousAgents = structuredClone(state.agents);
  const assertBindings = async () => {
    if (state.git?.enabled || state.orchestration.schemaVersion === 3)
      throw new CollaborationStateError("INVALID_STATE_TRANSITION", "Serial configuration recovery cannot replace the project's scheduler");
    const reason = removedWorkflowAgentTaskReason(state, current.snapshot.agents);
    if (reason) throw new CollaborationStateError("UNSAFE_CONFIGURATION", reason);
    await database.assertRetainedWorkflowSessionHarnesses(state.id, current.snapshot.agents, state);
  };
  await assertBindings();
  if ((state.workflowRevision ?? 1) === current.version.revision && isDeepStrictEqual(before, current.snapshot) &&
    !workflowGatewaySnapshotsNeedValidation(state.agents) && !unpersistedSerialConfigurations.has(state)) return { changed: false };
  if (!validate) throw new CollaborationStateError("UNSAFE_CONFIGURATION", "Serial configuration recovery requires the existing resource validator");
  const disposable = structuredClone(current.snapshot);
  disposable.agents = restoreAgentConfiguration(disposable, state.agents);
  await validate(state, disposable);
  await database.assertWriterLeaseHeld();
  await assertBindings();
  if (state.workflowRevision !== previousRevision || !isDeepStrictEqual(snapshot(), before) || !isDeepStrictEqual(state.agents, previousAgents))
    throw new CollaborationStateError("WORKFLOW_ADJUSTMENT_CONFLICT", "SDK configuration changed during serial recovery validation");
  const rechecked = await database.serialWorkflowAdjustmentCurrent(state.id);
  if (!rechecked || !sameWorkflowConfigurationVersion(current.version, rechecked.version))
    throw new CollaborationStateError("WORKFLOW_ADJUSTMENT_CONFLICT", "Serial workflow authority changed during recovery validation");
  const restoredAgents = restoreAgentConfiguration(current.snapshot, disposable.agents);
  assertWorkflowGatewaySnapshots(restoredAgents);
  const previous = { orchestration: state.orchestration, agents: state.agents, skillDefinitions: state.skillDefinitions,
    mcpDefinitions: state.mcpDefinitions, workflowRevision: state.workflowRevision, updatedAt: state.updatedAt, archivedAgentSessions: state.archivedAgentSessions };
  // Restore only Gateway secrets from the validated route. A validator's
  // disposable edits cannot rewrite the immutable formal proposal.
  archiveRemovedWorkflowAgentSessions(state, current.snapshot.agents, current.version.revision);
  state.orchestration = structuredClone(current.snapshot.orchestration);
  state.agents = restoredAgents;
  state.skillDefinitions = structuredClone(current.snapshot.skillDefinitions);
  state.mcpDefinitions = structuredClone(current.snapshot.mcpDefinitions);
  state.workflowRevision = current.version.revision;
  const installedConfiguration = () => ({ orchestration: state.orchestration, agents: state.agents,
    skillDefinitions: state.skillDefinitions, mcpDefinitions: state.mcpDefinitions, workflowRevision: state.workflowRevision,
    archivedAgentSessions: state.archivedAgentSessions, git: state.git });
  const installed = structuredClone(installedConfiguration());
  const originalBindings = () => ({ sessions: state.agentSessions, legacyIds: state.agentSessionIds, meta: state.agentSessionMeta });
  const bindings = structuredClone(originalBindings());
  const assertCurrent = async () => {
    await database.assertWriterLeaseHeld();
    const authority = await database.serialWorkflowAdjustmentCurrent(state.id);
    if (!authority || !sameWorkflowConfigurationVersion(current.version, authority.version))
      throw new CollaborationStateError("WORKFLOW_ADJUSTMENT_CONFLICT", "Workflow authority changed during serial persistence; retry the current formal version");
    await assertBindings();
    if (!isDeepStrictEqual(originalBindings(), bindings))
      throw new CollaborationStateError("WORKFLOW_ADJUSTMENT_CONFLICT", "Original Session changed during serial persistence; retain it and retry");
    if (!isDeepStrictEqual(installedConfiguration(), installed))
      throw new CollaborationStateError("WORKFLOW_ADJUSTMENT_CONFLICT", "Original configuration changed during serial persistence; retain it and retry");
    assertWorkflowGatewaySnapshots(state.agents);
  };
  try {
    // Request first, then state: either failure leaves the authoritative
    // journal available for another exact roll-forward before dispatch.
    await storage.refreshRequestSnapshot(state, assertCurrent);
    await assertCurrent();
    await storage.writeMainAgentOrchestrationCurrentSnapshot(state.id, mainAgentOrchestrationDocument(state.id,
      state.orchestration, state.agents, state.skillDefinitions, state.mcpDefinitions, current.version),
      async () => { await assertCurrent(); return true; });
    await assertCurrent();
    await storage.saveState(state, assertCurrent);
    await assertCurrent();
  } catch (error) {
    // Roll back only our own installed configuration. A later original owner
    // or private snapshot must survive this failed publisher unchanged.
    if (isDeepStrictEqual(installedConfiguration(), installed)) Object.assign(state, previous);
    unpersistedSerialConfigurations.add(state);
    throw error;
  }
  unpersistedSerialConfigurations.delete(state);
  return { changed: true };
}
