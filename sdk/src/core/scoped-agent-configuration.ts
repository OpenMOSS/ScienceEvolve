import { isDeepStrictEqual } from "node:util";
import type { AgentConfigMap, AgentOrchestrationTemplate } from "./types.js";
import type { AgentOrchestrationProposal } from "./agent-orchestration-reconfiguration.js";
import { DEFAULT_HARNESS_ID } from "./agent-runtime.js";

export type ScopedAgentConfiguration = Omit<AgentOrchestrationProposal, "orchestration">;

function invalidGatewaySnapshotAgent(agents: AgentConfigMap): string | undefined {
  return Object.entries(agents).find(([, config]) => config.gatewayId &&
    (!config.gatewaySnapshot || config.gatewaySnapshot.id !== config.gatewayId ||
      !Array.isArray(config.gatewaySnapshot.models) || !config.gatewaySnapshot.models.includes(config.model)))?.[0];
}

/** Public equality does not prove that the selected route has its private runtime snapshot. */
export function workflowGatewaySnapshotsNeedValidation(agents: AgentConfigMap): boolean {
  return invalidGatewaySnapshotAgent(agents) !== undefined;
}

export function assertWorkflowGatewaySnapshots(agents: AgentConfigMap): void {
  const agentId = invalidGatewaySnapshotAgent(agents);
  if (agentId) throw new Error(`Agent ${agentId} 的所选网关运行快照缺失或与正式模型/网关不一致，请恢复所选网关并重试。`);
}

/** S stores identity/configuration, never server Gateway credentials. */
export function credentialFreeAgentConfiguration(configuration: ScopedAgentConfiguration): ScopedAgentConfiguration {
  return { skillDefinitions: structuredClone(configuration.skillDefinitions), mcpDefinitions: structuredClone(configuration.mcpDefinitions),
    agents: Object.fromEntries(Object.entries(configuration.agents).map(([id, config]) => {
    const { proxy: _legacyProxy, gatewaySnapshot: _secret, reasoningMigrationWarning: _reasoningMigrationWarning, ...safe } = config as typeof config & {
      proxy?: unknown;
      reasoningMigrationWarning?: unknown;
    };
    return [id, safe];
  })) };
}

export function restoreAgentConfiguration(configuration: ScopedAgentConfiguration, current: AgentConfigMap): AgentConfigMap {
  return Object.fromEntries(Object.entries(configuration.agents).map(([id, config]) => {
    const { proxy: _legacyProxy, ...activeConfig } = config as typeof config & { proxy?: unknown };
    const before = current[id];
    const sameRoute = before && before.model === config.model && before.gatewayId === config.gatewayId && before.nativeCodexProfileId === config.nativeCodexProfileId &&
      (before.harness ?? DEFAULT_HARNESS_ID) === (config.harness ?? DEFAULT_HARNESS_ID) && before.gatewayReasoningOption === config.gatewayReasoningOption;
    const snapshot = before?.gatewaySnapshot;
    const matchingSnapshot = sameRoute && snapshot && (!config.gatewayId ||
      snapshot.id === config.gatewayId && snapshot.models.includes(config.model));
    return [id, { ...structuredClone(activeConfig), ...(matchingSnapshot ? { gatewaySnapshot: structuredClone(snapshot) } : {}) }];
  }));
}

/** Shared Agent edits propagate by identity, but a Leader cannot edit other
 * identities or global resources selected by unrelated Agents. */
export function assertScopedAgentConfigurationRange(workflow: AgentOrchestrationTemplate, groupId: string,
  current: ScopedAgentConfiguration, proposed: ScopedAgentConfiguration): void {
  const group = workflow.scopedWorkflow?.groups.find((entry) => entry.id === groupId);
  if (!group) throw new Error("Leader configuration scope does not exist");
  const allowed = new Set([group.leaderAgentId, ...group.workflow.nodes.flatMap((node) => node.kind === "agent" ? [node.agentId] : [])]);
  const before = credentialFreeAgentConfiguration(current); const after = credentialFreeAgentConfiguration(proposed);
  if (!isDeepStrictEqual(Object.keys(before.agents).sort(), Object.keys(after.agents).sort())) throw new Error("Leader cannot add or delete shared Agent identities");
  for (const [id, config] of Object.entries(after.agents)) {
    if (!allowed.has(id) && !isDeepStrictEqual(config, before.agents[id])) throw new Error("Leader cannot edit an Agent outside its group");
  }
  for (const field of ["skillDefinitions", "mcpDefinitions"] as const) {
    for (const name of new Set([...Object.keys(before[field]), ...Object.keys(after[field])])) {
      if (isDeepStrictEqual(before[field][name], after[field][name])) continue;
      const selects = (agent: AgentConfigMap[string]) => field === "skillDefinitions"
        ? [...agent.skills, ...agent.autoSkills].includes(`project:${name}`)
        : agent.mcpServers.some((server) => server.project === name);
      const localUse = Object.entries(after.agents).some(([id, agent]) => allowed.has(id) && selects(agent));
      const outsideUse = Object.entries(before.agents).some(([id, agent]) => !allowed.has(id) && selects(agent));
      if ((!localUse && after[field][name] !== undefined) || outsideUse) throw new Error("Leader resource changes must stay within its group's Agent configuration");
    }
  }
}
