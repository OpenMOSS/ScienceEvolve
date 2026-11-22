/** Main-kernel API; also the default root API. */
export { createMainResearchSdk } from "./main-client.js";
export type { MainResearchSdk, MainResearchSdkOptions, MainResearchRun, MainRunSnapshot, MainEventOptions } from "./main-client.js";
export { loadMainWorkflowConfig, validateMainWorkflowConfig, bindMainWorkflowConfig, defaultMainWorkflowConfig } from "./main-config.js";
export type { MainWorkflowConfig, MainWorkflowAgentConfig, MainProjectGitInput, MainWorkflowValidationOptions } from "./main-config.js";
export { loadMainRuntimeConfig, validateMainResearchSdkOptions, validateMainGatewayBindings } from "./main-options.js";
export type { MainGatewayBindings } from "./main-options.js";
export { MAIN_RUNTIME_SOURCE_COMMIT, MAIN_RUNTIME_REVISION } from "./main-runtime.js";
export type { AgentHarness, GatewayInput, PublicGatewayRecord, GatewayTestResult, GatewayProbeStageResult } from "./core/agent-runtime.js";
export type { AgentOrchestrationTemplateV3, ProjectGitState, ProjectRuntimeProjection, TimelineEvent } from "./core/types.js";
export type { GitHubCredentialResolver, GitHubCredential } from "./core/collaboration-git/index.js";
export type { ScopedWorkflowContract } from "./core/scoped-workflow-contract.js";
export type { MainWorkspaceExportOptions, MainWorkspaceExportResult } from "./main-workspace.js";
export type { MainWorkspaceDelivery } from "./main-git-workspace.js";
export type { MainSourceWorkspaceOptions } from "./main-source-workspace.js";
export type { MainProjectInput } from "./main-project-inputs.js";
export type { MainHarnessGatewayImportOptions } from "./main-harness-gateway.js";

export type { SearchTreeConfig, SearchTreeNode, SearchTreeRequest, SearchTreeSnapshot } from "./core/search-tree.js";
