import type { AgentConfigMap } from "./types.js";
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
