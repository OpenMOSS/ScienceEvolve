import { z } from "zod";
import { createHash } from "node:crypto";
import {
  type AgentConfig,
  type AgentConfigMap,
  type AgentMcpServer,
  type AgentOrchestrationTemplate,
  type NormalizedAgentOrchestrationTemplate,
  type AgentTemplate,
  type ProjectGitInput,
  type ProjectGitState,
  type ResultFormat,
  type WorkflowEdge,
  MAIN_AGENT_NAME,
  type AgentPermission
} from "./types.js";
import {
  AGENT_PROTOCOLS,
  DEFAULT_HARNESS_ID,
  MAX_MODEL_CONTEXT_WINDOW,
  nativeProtocolForHarness,
  type AgentProtocol,
  validateGatewayUrl
} from "./agent-runtime.js";
import { HARNESS_ID_PATTERN } from "./harness-runtime/registry.js";
import { BUILTIN_AGENT_PROMPTS } from "./prompt.js";
import {
  canonicalizeMainRoutes,
  cloneAgentOrchestrationTemplate,
  defaultDecisionPlan,
  workflowOuterNodeIds
} from "./agent-orchestration.js";
import { assertMcpServerIdentity, normalizeMcpServerSelection } from "./mcp-directory.js";
import { HANDOFF_CHARACTER_LIMIT } from "./content-limits.js";
import { GATEWAY_REASONING_PARAMETER_PATHS } from "./gateway-reasoning.js";
import { migrateLegacyGatewayReasoning, type LegacyReasoningEffort } from "./gateway-reasoning.js";
import { validateWorkflowLoops } from "./internal/shared/workflow-loop-validation.js";
import { mcpDefinitionsSchema } from "./project-mcp.js";
import { projectNameSchema } from "./project-files.js";
import { skillDefinitionsSchema } from "./project-skills.js";
import { scopedWorkflowContractSchema, validateScopedWorkflowContract } from "./scoped-workflow-contract.js";

const projectIdSchema = z.string().regex(/^prj_[a-f0-9]{32}$/);

export const batchProjectIdsSchema = z.object({
  projectIds: z.array(projectIdSchema).min(1).max(500).transform((ids) => [...new Set(ids)])
});

export const deleteArchivedProjectSchema = z.object({
  confirmation: z.string().min(1).max(500)
});

export const batchDeleteArchivedProjectsSchema = batchProjectIdsSchema.extend({
  confirmation: z.literal("永久删除")
});

/** New projects use the verified Nex model unless the gateway rejects it. */
export const DEFAULT_AGENT_MODEL = "nex-agi/Nex-N2-Pro";

const GATEWAY_ROUTE_DIRECTIONS = [
  "responses->responses",
  "responses->chat-completions",
  "responses->anthropic-messages",
  "chat-completions->responses",
  "chat-completions->chat-completions",
  "chat-completions->anthropic-messages",
  "anthropic-messages->responses",
  "anthropic-messages->chat-completions",
  "anthropic-messages->anthropic-messages"
] as const;

const remoteMcpServerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  url: z.string().trim().url().refine((url) => {
    try {
      const protocol = new URL(url).protocol;
      return protocol === "http:" || protocol === "https:";
    } catch {
      return false;
    }
  }, "MCP URL 仅支持 http:// 或 https://")
}).strict();
const agentMcpServerSchema = z.union([
  remoteMcpServerSchema,
  z.object({
    name: z.string().trim().min(1).max(120),
    project: projectNameSchema
  }).strict()
]);
const agentMcpServersSchema = z.array(agentMcpServerSchema).max(32).superRefine((servers, context) => {
  const names = new Set<string>();
  servers.forEach((server, index) => {
    try {
      assertMcpServerIdentity(server);
    } catch (error) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: [index, "url"], message: error instanceof Error ? error.message : "MCP 固定目录身份无效" });
    }
    const normalized = server.name.toLowerCase();
    if (names.has(normalized)) context.addIssue({ code: z.ZodIssueCode.custom, path: [index, "name"], message: "MCP 名称不能重复" });
    names.add(normalized);
  });
});

export function normalizedAgentMcpServers(servers: readonly AgentMcpServer[]): AgentMcpServer[] {
  const parsed = agentMcpServersSchema.parse(servers).map((server) => ({ ...server }));
  // Keep this explicit normalization at the service boundary so callers that
  // bypass a Zod object (for example orchestrator updates) get the same
  // fixed-directory identity checks and duplicate handling.
  return normalizeMcpServerSelection(parsed);
}

export function normalizedAgentSkills(
  _agent: string,
  skills: readonly string[],
  autoSkills: readonly string[] = []
): Pick<AgentConfig, "skills" | "autoSkills"> {
  const fixed = [...new Set(skills.map((skill) => skill.trim()).filter(Boolean))];
  const fixedSet = new Set(fixed);
  const automatic = [...new Set(autoSkills.map((skill) => skill.trim()).filter(Boolean))].filter((skill) => !fixedSet.has(skill));
  if (fixed.length + automatic.length > 32) throw new Error("每个 Agent 最多可配置 32 个 Skill");
  return { skills: fixed, autoSkills: automatic };
}

export function normalizeAgentSkillSelections(agents: AgentConfigMap, orchestration: AgentOrchestrationTemplate = cloneAgentOrchestrationTemplate()): boolean {
  let changed = false;
  for (const definition of orchestration.agents) {
    const current = agents[definition.name];
    if (!current) continue;
    const normalized = normalizedAgentSkills(definition.name, current.skills, current.autoSkills);
    if (JSON.stringify(current.skills) !== JSON.stringify(normalized.skills)) { current.skills = normalized.skills; changed = true; }
    if (JSON.stringify(current.autoSkills) !== JSON.stringify(normalized.autoSkills)) { current.autoSkills = normalized.autoSkills; changed = true; }
    if (!current.instructions.trim()) {
      // A template is only a starting configuration, but an empty custom
      // prompt should still receive that template's default mandate. Runtime
      // Permissions continue to come exclusively from the explicit permission.
      current.instructions = defaultInstructionsForAgent(
        definition.name,
        definition.template
      );
      changed = true;
    }
    else { current.instructions = current.instructions.trim(); }
    if (!current.permission) {
      current.permission = definition.name === MAIN_AGENT_NAME ? "yolo" : "workspace";
      changed = true;
    }
    if (!current.harness) { current.harness = DEFAULT_HARNESS_ID; changed = true; }
  }
  return changed;
}

const agentModelSchema = z.string().trim().min(1).max(200);
const reasoningEffortSchema = z.enum(["low", "medium", "high", "xhigh"]);
const gatewayReasoningOptionIdSchema = z.string().trim()
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/);
const gatewayReasoningOptionSchema = z.object({
  id: gatewayReasoningOptionIdSchema,
  label: z.string().trim().min(1).max(120),
  value: z.string().trim().min(1).max(120)
}).strict();
const gatewayModelReasoningSchema = z.record(z.object({
  parameter: z.enum(GATEWAY_REASONING_PARAMETER_PATHS),
  options: z.array(gatewayReasoningOptionSchema).max(32),
  defaultOptionId: gatewayReasoningOptionIdSchema.optional()
}).strict());
const resolvedGatewayReasoningSchema = z.object({
  mode: z.literal("option"),
  optionId: gatewayReasoningOptionIdSchema,
  label: z.string().trim().min(1).max(120),
  value: z.string().trim().min(1).max(120),
  parameter: z.enum(GATEWAY_REASONING_PARAMETER_PATHS),
  fingerprint: z.string().regex(/^[a-f0-9]{64}$/)
}).strict();
const reasoningMigrationWarningSchema = z.string().trim().min(1).max(1_000);
const harnessIdSchema = z.string().trim().regex(HARNESS_ID_PATTERN);
export const agentConfigSchema = z.object({
  model: agentModelSchema.default(DEFAULT_AGENT_MODEL),
  harness: harnessIdSchema.default(DEFAULT_HARNESS_ID),
  gatewayId: z.string().trim().regex(/^gwy_[a-f0-9]{32}$/).optional(),
  nativeCodexProfileId: z.string().regex(/^[A-Za-z0-9_-]{1,80}$/).optional(),
  gatewayReasoningOption: gatewayReasoningOptionIdSchema.optional(),
  skills: z.array(z.string().trim().min(1).max(4_096)).max(32).default([]),
  autoSkills: z.array(z.string().trim().min(1).max(4_096)).max(32).default([]),
  mcpServers: agentMcpServersSchema.default([]),
  experimentMcp: z.boolean().optional(),
  instructions: z.string().trim().max(20_000).default(""),
  reasoningEffort: reasoningEffortSchema.optional(),
  permission: z.enum(["workspace", "compute", "yolo"]).default("workspace"),
  webSearch: z.boolean().default(false),
  sessionPersistence: z.boolean().default(false),
  decisionBy: z.enum(["main", "agent"]).default("main")
}).strict();

const gatewaySnapshotSchema = z.object({
  id: z.string().trim().regex(/^gwy_[a-f0-9]{32}$/),
  name: z.string().trim().min(1).max(160),
  // Runtime snapshots are persisted input too. Apply the same HTTPS syntax
  // policy during recovery; live network-target checks still run before use.
  url: z.string().trim().transform((value, context) => {
    try {
      return validateGatewayUrl(value);
    } catch (error) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: error instanceof Error ? error.message : "网关运行快照必须使用有效的 HTTPS 地址"
      });
      return z.NEVER;
    }
  }),
  apiKey: z.string().max(8_000),
  models: z.array(agentModelSchema).min(1).max(200),
  modelContextWindows: z.record(z.number().int().min(1).max(MAX_MODEL_CONTEXT_WINDOW)).default({}),
  modelReasoning: gatewayModelReasoningSchema.default({}),
  reasoning: resolvedGatewayReasoningSchema.optional(),
  reasoningMigrationWarning: reasoningMigrationWarningSchema.optional(),
  defaultModel: agentModelSchema,
  protocol: z.enum(AGENT_PROTOCOLS as [typeof AGENT_PROTOCOLS[number], ...Array<typeof AGENT_PROTOCOLS[number]>]),
  nativeProtocol: z.enum(AGENT_PROTOCOLS as [typeof AGENT_PROTOCOLS[number], ...Array<typeof AGENT_PROTOCOLS[number]>]).optional(),
  routeMode: z.enum(["direct", "proxy"]).optional(),
  routeDirection: z.enum(GATEWAY_ROUTE_DIRECTIONS).optional(),
  // Persisted runtime snapshots record the capability decision made for this
  // exact gateway/model/protocol route. Keep it in the strict recovery schema
  // so projects written by the streaming-capability layer remain restartable.
  deliveryMode: z.enum(["native-stream", "buffered-json"]).optional(),
  testedAt: z.string().optional()
}).strict();

type BuiltinTemplate = Exclude<AgentTemplate, "general">;
const BUILTIN_CONFIGS: Record<BuiltinTemplate, AgentConfig> = {
  main: { model: DEFAULT_AGENT_MODEL, skills: ["builtin:awesome-ai-research-writing-director"], autoSkills: [], mcpServers: [], instructions: BUILTIN_AGENT_PROMPTS.main, permission: "yolo", webSearch: false, sessionPersistence: true, decisionBy: "main" },
  idea: { model: DEFAULT_AGENT_MODEL, skills: ["builtin:ccf-idea-optimizer", "builtin:ccf-idea-reviewer", "builtin:ccf-literature-monitor", "builtin:ccf-literature-searcher", "builtin:ccf-experiment-designer"], autoSkills: [], mcpServers: [], instructions: BUILTIN_AGENT_PROMPTS.idea, permission: "workspace", webSearch: true, sessionPersistence: false, decisionBy: "main" },
  execution: { model: DEFAULT_AGENT_MODEL, skills: ["builtin:nature-figure"], autoSkills: [], mcpServers: [], instructions: BUILTIN_AGENT_PROMPTS.execution, permission: "compute", webSearch: true, sessionPersistence: false, decisionBy: "main" },
  writing: { model: DEFAULT_AGENT_MODEL, skills: ["builtin:ccf-paper-writer", "builtin:ccf-visual-composer", "builtin:ccf-paper-to-exemplar", "builtin:nature-writing", "builtin:nature-polishing"], autoSkills: [], mcpServers: [], instructions: BUILTIN_AGENT_PROMPTS.writing, permission: "workspace", webSearch: true, sessionPersistence: false, decisionBy: "main" },
  review: { model: DEFAULT_AGENT_MODEL, skills: ["builtin:ccf-paper-reviewer"], autoSkills: [], mcpServers: [], instructions: BUILTIN_AGENT_PROMPTS.review, permission: "workspace", webSearch: true, sessionPersistence: false, decisionBy: "main" }
};
const MAIN_AGENT_CONFIG: AgentConfig = {
  model: DEFAULT_AGENT_MODEL,
  skills: ["builtin:awesome-ai-research-writing-director"],
  autoSkills: [],
  mcpServers: [],
  instructions: BUILTIN_AGENT_PROMPTS.main,
  permission: "yolo",
  webSearch: false,
  sessionPersistence: true,
  decisionBy: "main"
};
// Main is a public first-class Agent and is included in every default map.
export const defaultAgentConfigs: AgentConfigMap = structuredClone({
  ...BUILTIN_CONFIGS,
  main: MAIN_AGENT_CONFIG
});

export function defaultInstructionsForAgent(
  name: string,
  template?: AgentTemplate
): string {
  if (name === MAIN_AGENT_NAME) return BUILTIN_AGENT_PROMPTS.main;
  const preset = BUILTIN_CONFIGS[template as keyof typeof BUILTIN_CONFIGS];
  return preset?.instructions ?? BUILTIN_AGENT_PROMPTS.general;
}
export function defaultAgentConfigFor(name: string, presetName?: AgentTemplate): AgentConfig {
  if (name === MAIN_AGENT_NAME) return structuredClone(MAIN_AGENT_CONFIG);
  const preset = BUILTIN_CONFIGS[presetName as keyof typeof BUILTIN_CONFIGS];
  return structuredClone(preset ?? { model: DEFAULT_AGENT_MODEL, skills: [], autoSkills: [], mcpServers: [], instructions: defaultInstructionsForAgent(name, presetName), permission: "workspace", webSearch: false, sessionPersistence: false, decisionBy: "main" });
}

export const AGENT_IDENTIFIER_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N}_-]{0,63}$/u;
// `main` is a system-owned identity, but it must still be accepted by the
// orchestration/config schemas so the automatically injected Main can parse.
// User-facing creation validation rejects a duplicate Main separately.
const RESERVED_AGENT_NAMES = new Set(["input", "finish", "user"]);
// `main` is the one fixed identity. Variants such as `Main` remain valid
// user-defined names and are intentionally not folded into that identity.
export const agentNameSchema = z.string().trim().min(1).max(64).regex(AGENT_IDENTIFIER_PATTERN).refine((name) => !RESERVED_AGENT_NAMES.has(name), "Agent name 不能使用 input、finish 或 user");
const partialAgentMap = z.record(agentNameSchema, agentConfigSchema.partial());

const orchestrationAgentSchema = z.object({
  name: agentNameSchema,
  template: z.enum(["general", "main", "idea", "execution", "writing", "review"]).optional(),
  description: z.string().trim().max(180).optional()
}).strict();
const formationEdgeSchema = z.object({
  target: z.union([agentNameSchema, z.literal(MAIN_AGENT_NAME), z.literal("finish")]),
  kind: z.enum(["strong", "weak"])
}).strict();
const formationRouteMapSchema = z.record(
  agentNameSchema,
  z.array(formationEdgeSchema)
);
const collaborationFormationSnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  workflowRevision: z.number().int().positive(),
  memberRoutes: formationRouteMapSchema,
  memberDecisionPlans: z.record(agentNameSchema, z.string().trim().max(4_000)),
  inboundRoutes: formationRouteMapSchema,
  formedRoutes: formationRouteMapSchema,
  inputTarget: agentNameSchema.optional(),
  terminationAgent: agentNameSchema.optional(),
  memberCanvasNodes: z.record(agentNameSchema, z.object({
    x: z.number().finite().min(-20_000).max(20_000),
    y: z.number().finite().min(-20_000).max(20_000)
  }).strict()).optional()
}).strict();
const collaborationNodeSchema = z.object({
  id: agentNameSchema,
  displayName: z.string().trim().min(1).max(160),
  memberAgentIds: z.array(agentNameSchema),
  renamePolicy: z.enum(["editable", "locked"]),
  formationSnapshot: collaborationFormationSnapshotSchema.optional()
}).strict();
const libraryAgentTemplateSchema = orchestrationAgentSchema.refine(
  (definition) => ![MAIN_AGENT_NAME, "general", "idea", "execution", "writing", "review"].includes(definition.name)
    && definition.template !== "main",
  "内置 Agent 模板不能重复创建"
);
const decisionPlansSchema = z.record(agentNameSchema, z.string().trim().max(4_000));
const routeTargetSchema = z.union([agentNameSchema, z.literal(MAIN_AGENT_NAME), z.literal("finish")]);
const edgeSchema = z.object({ target: routeTargetSchema, kind: z.enum(["strong", "weak"]) }).strict();
const routesSchema = z.record(z.string(), z.array(edgeSchema));
const resultFormatSchema = z.preprocess(
  (value) => value == null ? undefined : value,
  z.object({
    presets: z.array(z.string().trim().min(1).max(80)).max(12).default([]),
    custom: z.string().trim().max(20_000).default(""),
    none: z.boolean().optional()
  }).strict().default({ presets: [], custom: "" }).transform((value) => ({
    presets: [...new Set(value.presets.map((preset) => preset.trim()).filter(Boolean))],
    custom: value.custom.trim(),
    ...(value.none === true ? { none: true } : {})
  }))
);
const canvasPortSchema = z.enum(["top", "right", "bottom", "left"]);
const canvasLayoutSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  nodes: z.record(z.string().min(1).max(128), z.object({
    x: z.number().finite().min(-20_000).max(20_000),
    y: z.number().finite().min(-20_000).max(20_000)
  }).strict()).default({}),
  edges: z.record(z.string().min(1).max(256), z.object({
    sourcePort: canvasPortSchema,
    targetPort: canvasPortSchema,
    sourcePortPinned: z.boolean().default(false),
    targetPortPinned: z.boolean().default(false)
  }).strict()).default({}),
  viewport: z.object({
    x: z.number().finite().min(-20_000).max(20_000).default(0),
    y: z.number().finite().min(-20_000).max(20_000).default(0),
    zoom: z.number().finite().min(0.08).max(2.4).default(0.82)
  }).strict().default({ x: 0, y: 0, zoom: 0.82 }),
  layoutMode: z.enum(["free", "layered"]).default("free"),
  connections: z.object({
    input: z.boolean().default(true),
    termination: z.boolean().default(true)
  }).strict().default({ input: true, termination: true })
}).strict();
export const orchestrationShapeSchema = z.object({
  schemaVersion: z.union([z.literal(2), z.literal(3)]),
  agents: z.array(orchestrationAgentSchema).min(1),
  collaborations: z.array(collaborationNodeSchema).max(25),
  scopedWorkflow: scopedWorkflowContractSchema.optional(),
  agentTemplates: z.array(libraryAgentTemplateSchema).optional(),
  input: z.object({ source: z.literal("input"), target: agentNameSchema }).strict(),
  routes: routesSchema,
  loops: z.array(z.object({
    id: z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/),
    from: agentNameSchema,
    to: agentNameSchema,
    maxIterations: z.number().int().min(1).max(1_000_000),
    exitTo: agentNameSchema
  }).strict()).max(50).optional(),
  decisionPlans: decisionPlansSchema,
  allowUserIntervention: z.boolean().default(true),
  allowMainReconfiguration: z.boolean().default(false),
  termination: z.object({ agent: z.union([agentNameSchema, z.literal(MAIN_AGENT_NAME)]), condition: z.string().trim().min(1).max(4_000), decisionBy: z.literal("main"), automatic: z.boolean() }).strict(),
  resultFormat: resultFormatSchema,
  canvas: canvasLayoutSchema.optional()
}).strict();

export const projectGitInputSchema = z.object({
  enabled: z.boolean().default(false),
  provider: z.literal("github").optional(),
  accountId: z.string().trim().regex(/^gha_[a-f0-9]{32}$/i, "GitHub 账号 ID 无效").optional(),
  repositoryName: z.preprocess(value => typeof value === "string" && !value.trim() ? undefined : value,
    z.string().trim().min(1).max(100)
      .regex(/^[A-Za-z0-9](?:[A-Za-z0-9._-]{0,98}[A-Za-z0-9])?$/, "GitHub 仓库名称无效")
      .optional()),
  repositoryVisibility: z.enum(["private", "public"]).optional()
}).strict().default({ enabled: false });

export const projectGitStateSchema = z.object({
  enabled: z.boolean(),
  status: z.enum([
    "disabled",
    "authorizing",
    "creating_repository",
    "initializing_local",
    "pushing_main",
    "ready",
    "waiting_for_github",
    "failed"
  ]),
  provider: z.literal("github").optional(),
  account: z.object({
    id: z.string().trim().regex(/^gha_[a-f0-9]{32}$/i),
    login: z.string().trim().min(1).max(100),
    providerUserId: z.number().int().nonnegative(),
    avatarUrl: z.string().url().optional()
  }).strict().optional(),
  requestedRepositoryName: z.string().trim().min(1).max(100).optional(),
  requestedRepositoryVisibility: z.enum(["private", "public"]).optional(),
  repository: z.object({
    owner: z.string().trim().min(1).max(100),
    name: z.string().trim().min(1).max(100),
    htmlUrl: z.string().url(),
    private: z.boolean(),
    defaultBranch: z.literal("main"),
    localPath: z.string().trim().min(1).max(4_096)
  }).strict().optional(),
  initialization: z.object({
    operationId: z.string().trim().min(1).max(200),
    attempt: z.number().int().min(1),
    completedSteps: z.array(z.string().trim().min(1).max(160)).max(100),
    error: z.string().max(20_000).optional()
  }).strict().optional(),
  branches: z.array(z.object({
    name: z.string().trim().min(1).max(512),
    head: z.string().trim().min(1).max(160).optional(),
    base: z.string().trim().min(1).max(512).optional(),
    ownerExecutionId: z.string().trim().min(1).max(256).optional(),
    worktreePath: z.string().trim().min(1).max(4_096).optional(),
    status: z.string().trim().min(1).max(160),
    retained: z.literal(true).optional(),
    observedAt: z.string().datetime().optional()
  }).strict()).max(5_000).optional(),
  commits: z.array(z.object({
    sha: z.string().trim().min(1).max(160),
    htmlUrl: z.string().url().optional(),
    message: z.string().max(20_000).optional(),
    observedAt: z.string().datetime().optional()
  }).strict()).max(5_000).optional(),
  blockers: z.array(z.string().trim().min(1).max(4_000)).max(500).optional(),
  observedAt: z.string().datetime().optional(),
  capacity: z.object({
    retainedWorktreeCount: z.number().int().min(0),
    warningThreshold: z.number().int().min(1).optional(),
    warning: z.string().trim().min(1).max(4_000).optional()
  }).strict().optional()
}).strict().superRefine((git, context) => {
  if (!git.enabled && git.status !== "disabled") context.addIssue({ code: z.ZodIssueCode.custom, path: ["status"], message: "Git 关闭时状态必须为 disabled" });
  if (git.enabled && git.status === "disabled") context.addIssue({ code: z.ZodIssueCode.custom, path: ["status"], message: "Git 已启用时状态不能为 disabled" });
  const publicUrls = [git.repository?.htmlUrl, ...(git.commits ?? []).map((commit) => commit.htmlUrl)]
    .filter((value): value is string => Boolean(value));
  publicUrls.forEach((value, index) => {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" || parsed.username || parsed.password) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["publicUrls", index],
        message: "Git 只读链接必须是无凭证 HTTPS URL"
      });
    }
  });
});

export function normalizeProjectGitInput(value: unknown): ProjectGitInput {
  return projectGitInputSchema.parse(value ?? { enabled: false });
}

export function normalizeProjectGitState(value: unknown): ProjectGitState {
  return projectGitStateSchema.parse(value ?? disabledProjectGitState());
}

export function disabledProjectGitState(): ProjectGitState {
  return { enabled: false, status: "disabled" };
}

function canonicalizeRawMain(value: unknown): unknown {
  const fallback = cloneAgentOrchestrationTemplate();
  const source = value && typeof value === "object"
    ? structuredClone(value as Record<string, unknown>)
    : fallback;
  source.schemaVersion ??= 2;
  source.collaborations ??= [];
  const agents = Array.isArray(source.agents)
    ? source.agents.filter((entry) => entry && typeof entry === "object")
    : [];
  const hasMain = agents.some(
    (entry) => (entry as Record<string, unknown>).name === MAIN_AGENT_NAME
  );
  if (!hasMain) agents.unshift({ name: MAIN_AGENT_NAME, template: "main" });
  const normalizedAgents = agents.map((entry) => {
    const definition = entry as Record<string, unknown>;
    if (definition.name !== MAIN_AGENT_NAME) return definition;
    return { ...definition, template: "main" };
  });
  source.agents = normalizedAgents;
  const routes = source.routes && typeof source.routes === "object" && !Array.isArray(source.routes)
    ? source.routes as Record<string, unknown>
    : {};
  source.routes = routes;
  const plans = source.decisionPlans && typeof source.decisionPlans === "object" && !Array.isArray(source.decisionPlans)
    ? source.decisionPlans as Record<string, unknown>
    : {};
  if (!hasMain) plans[MAIN_AGENT_NAME] ??= defaultDecisionPlan(MAIN_AGENT_NAME);
  source.decisionPlans = plans;
  return source;
}

function refineOrchestration(
  template: z.infer<typeof orchestrationShapeSchema>,
  context: z.RefinementCtx,
  strictWorkflow: boolean
): void {
  const agentIds = new Set<string>();
  for (const [index, entry] of template.agents.entries()) {
    if (agentIds.has(entry.name)) context.addIssue({ code: z.ZodIssueCode.custom, path: ["agents", index, "name"], message: "Agent name 不能重复" });
    agentIds.add(entry.name);
  }
  const templateNames = new Set<string>();
  for (const [index, entry] of (template.agentTemplates ?? []).entries()) {
    if (templateNames.has(entry.name)) context.addIssue({ code: z.ZodIssueCode.custom, path: ["agentTemplates", index, "name"], message: "模板名称不能重复" });
    templateNames.add(entry.name);
  }
  if (!template.agents.some((entry) => entry.name === MAIN_AGENT_NAME)) context.addIssue({ code: z.ZodIssueCode.custom, path: ["agents"], message: "项目必须包含唯一的 main Agent" });
  const groupIds = new Set<string>();
  for (const [index, group] of template.collaborations.entries()) {
    if (groupIds.has(group.id)) context.addIssue({ code: z.ZodIssueCode.custom, path: ["collaborations", index, "id"], message: "协作组 id 不能重复" });
    if (agentIds.has(group.id)) context.addIssue({ code: z.ZodIssueCode.custom, path: ["collaborations", index, "id"], message: "Agent name 与协作组 id 必须处于同一唯一节点命名空间" });
    groupIds.add(group.id);
  }
  const scoped = template.schemaVersion === 3;
  if (scoped) {
    if (!template.scopedWorkflow) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["scopedWorkflow"], message: "v3 配置必须包含 scopedWorkflow" });
    } else {
      try {
        validateScopedWorkflowContract(template.scopedWorkflow, agentIds, { strict: strictWorkflow });
      } catch (error) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["scopedWorkflow"],
          message: error instanceof Error ? error.message : "组内 Workflow 无效"
        });
      }
      const scopedGroupIds = new Set(template.scopedWorkflow.groups.map((group) => group.id));
      if (groupIds.size !== scopedGroupIds.size || [...groupIds].some((id) => !scopedGroupIds.has(id))) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["collaborations"], message: "v3 协作组登记必须与 scopedWorkflow.groups 一致" });
      }
    }
  } else if (template.scopedWorkflow) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["scopedWorkflow"], message: "v2 配置不能包含组内 Workflow" });
  }
  const memberOwners = new Map<string, string>();
  const memberIds = new Set<string>();
  for (const [groupIndex, group] of template.collaborations.entries()) {
    if (scoped) continue;
    const localMembers = new Set<string>();
    for (const [memberIndex, memberId] of group.memberAgentIds.entries()) {
      if (localMembers.has(memberId)) context.addIssue({ code: z.ZodIssueCode.custom, path: ["collaborations", groupIndex, "memberAgentIds", memberIndex], message: "同一协作组不能重复包含同一 Agent" });
      localMembers.add(memberId);
      if (memberId === MAIN_AGENT_NAME) context.addIssue({ code: z.ZodIssueCode.custom, path: ["collaborations", groupIndex, "memberAgentIds", memberIndex], message: "Main 不能成为协作组成员" });
      if (groupIds.has(memberId)) context.addIssue({ code: z.ZodIssueCode.custom, path: ["collaborations", groupIndex, "memberAgentIds", memberIndex], message: "协作组不能包含另一个协作组" });
      if (!agentIds.has(memberId)) context.addIssue({ code: z.ZodIssueCode.custom, path: ["collaborations", groupIndex, "memberAgentIds", memberIndex], message: "协作组成员必须是已配置的 Agent" });
      const owner = memberOwners.get(memberId);
      if (owner && owner !== group.id) context.addIssue({ code: z.ZodIssueCode.custom, path: ["collaborations", groupIndex, "memberAgentIds", memberIndex], message: `Agent ${memberId} 不能同时属于多个协作组` });
      else memberOwners.set(memberId, group.id);
      memberIds.add(memberId);
    }
    const validKnownMembers = new Set(group.memberAgentIds.filter((memberId) => agentIds.has(memberId) && memberId !== MAIN_AGENT_NAME && !groupIds.has(memberId)));
    if (validKnownMembers.size < 2) context.addIssue({ code: z.ZodIssueCode.custom, path: ["collaborations", groupIndex, "memberAgentIds"], message: "协作组必须包含至少两个不同的已配置 Agent" });
  }
  const outerIds = new Set(workflowOuterNodeIds(template));
  const validateOuterReference = (value: string, path: Array<string | number>, label: string): void => {
    if (memberIds.has(value)) context.addIssue({ code: z.ZodIssueCode.custom, path, message: `${label}不能指向协作组成员；请使用协作组外层节点` });
    else if (!outerIds.has(value)) context.addIssue({ code: z.ZodIssueCode.custom, path, message: `${label}必须是已配置的外层节点` });
  };
  for (const issue of validateWorkflowLoops(template)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["loops", issue.index],
      message: issue.message
    });
  }
  if (scoped) {
    for (const [index, loop] of (template.loops ?? []).entries()) {
      if (![loop.from, loop.to, loop.exitTo].every((nodeId) => outerIds.has(nodeId))) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ["loops", index], message: "根图 Loop 不能跨越协作组范围" });
      }
    }
  }
  validateOuterReference(template.input.target, ["input", "target"], "输入目标");
  validateOuterReference(template.termination.agent, ["termination", "agent"], "终止节点");
  for (const nodeId of outerIds) {
    const edges = template.routes[nodeId] ?? [];
    if (nodeId === MAIN_AGENT_NAME) {
      edges.forEach((edge, edgeIndex) => {
        if (edge.target !== "finish" && memberIds.has(edge.target)) context.addIssue({ code: z.ZodIssueCode.custom, path: ["routes", nodeId, edgeIndex, "target"], message: "Main 候选不能包含协作组成员" });
      });
      continue;
    }
    if (!edges.length) {
      if (strictWorkflow) context.addIssue({ code: z.ZodIssueCode.custom, path: ["routes", nodeId], message: `缺少 ${nodeId} 的出边` });
      continue;
    }
    const strong = edges.filter((edge) => edge.kind === "strong");
    if (strong.length > 1 || (strong.length === 1 && edges.length > 1)) context.addIssue({ code: z.ZodIssueCode.custom, path: ["routes", nodeId], message: "强边必须是唯一出边" });
    const targets = new Set<string>();
    edges.forEach((edge, edgeIndex) => {
      if (edge.target === nodeId) context.addIssue({ code: z.ZodIssueCode.custom, path: ["routes", nodeId, edgeIndex, "target"], message: "出边不能指向自身" });
      if (edge.target !== "finish" && memberIds.has(edge.target)) context.addIssue({ code: z.ZodIssueCode.custom, path: ["routes", nodeId, edgeIndex, "target"], message: "外层出边不能指向协作组成员" });
      else if (strictWorkflow && edge.target !== "finish" && !outerIds.has(edge.target)) context.addIssue({ code: z.ZodIssueCode.custom, path: ["routes", nodeId, edgeIndex, "target"], message: "出边目标必须是已配置的外层节点" });
      if (edge.target === "finish" && nodeId !== template.termination.agent) context.addIssue({ code: z.ZodIssueCode.custom, path: ["routes", nodeId, edgeIndex, "target"], message: "只有终止节点可以拥有 finish 出边" });
      if (targets.has(edge.target)) context.addIssue({ code: z.ZodIssueCode.custom, path: ["routes", nodeId, edgeIndex, "target"], message: "同一节点不能配置重复出边" });
      targets.add(edge.target);
    });
  }
  if (strictWorkflow && template.termination.agent !== MAIN_AGENT_NAME && !template.routes[template.termination.agent]?.some((edge) => edge.target === "finish")) context.addIssue({ code: z.ZodIssueCode.custom, path: ["routes", template.termination.agent], message: "终止 Agent 必须包含 finish 出边" });
  for (const name of Object.keys(template.routes)) {
    if (memberIds.has(name)) context.addIssue({ code: z.ZodIssueCode.custom, path: ["routes", name], message: "协作组成员不能作为外层路由源" });
    else if (strictWorkflow && !outerIds.has(name)) context.addIssue({ code: z.ZodIssueCode.custom, path: ["routes", name], message: "Routes 包含未配置的外层节点" });
  }
  for (const name of Object.keys(template.decisionPlans)) {
    if (memberIds.has(name)) context.addIssue({ code: z.ZodIssueCode.custom, path: ["decisionPlans", name], message: "协作组成员不能拥有外层节点判定方案" });
    else if (strictWorkflow && !outerIds.has(name)) context.addIssue({ code: z.ZodIssueCode.custom, path: ["decisionPlans", name], message: "判定方案包含未配置的外层节点" });
  }
  if (strictWorkflow && template.canvas?.connections?.input === false) context.addIssue({ code: z.ZodIssueCode.custom, path: ["canvas", "connections", "input"], message: "用户输入尚未连接到 Agent" });
  if (strictWorkflow && template.canvas?.connections?.termination === false) context.addIssue({ code: z.ZodIssueCode.custom, path: ["canvas", "connections", "termination"], message: "结束节点尚未连接到 Agent" });
}

const rawOrchestrationSchema = z.unknown().superRefine((value, context) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  const raw = value as Record<string, unknown>;
  if (raw.schemaVersion === undefined && Array.isArray(raw.collaborations) && raw.collaborations.length > 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["schemaVersion"], message: "包含协作组的配置必须显式声明 schemaVersion: 2" });
  }
  if (raw.schemaVersion === 2 && !Array.isArray(raw.collaborations)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["collaborations"], message: "v2 配置必须包含 collaborations 数组" });
  }
  if (raw.schemaVersion === 3 && !Array.isArray(raw.collaborations)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["collaborations"], message: "v3 配置必须包含 collaborations 数组" });
  }
}).transform(canonicalizeRawMain);

function orchestrationSchema(strictWorkflow: boolean) {
  return rawOrchestrationSchema.pipe(
    orchestrationShapeSchema
      .superRefine((template, context) => refineOrchestration(template, context, strictWorkflow))
      .transform((template) => canonicalizeMainRoutes(template))
  );
}

export const agentOrchestrationTemplateSchema = orchestrationSchema(true);

const draftAgentOrchestrationTemplateSchema = orchestrationSchema(false);

export function normalizeResultFormat(value: unknown): ResultFormat {
  const parsed = resultFormatSchema.parse(value);
  return {
    presets: [...new Set(parsed.presets.map((preset) => preset.trim()).filter(Boolean))],
    custom: parsed.custom.trim()
  };
}

export function normalizeAgentOrchestrationTemplate(value: unknown): NormalizedAgentOrchestrationTemplate {
  const parsed = agentOrchestrationTemplateSchema.parse(value ?? cloneAgentOrchestrationTemplate());
  return canonicalizeMainRoutes(parsed);
}

export function normalizeDraftAgentOrchestrationTemplate(value: unknown): NormalizedAgentOrchestrationTemplate {
  return canonicalizeMainRoutes(
    draftAgentOrchestrationTemplateSchema.parse(value ?? cloneAgentOrchestrationTemplate())
  );
}

/** Before the first native call, all new Git projects adopt Agent-stable
 * sessions/checkouts, even if Main has not created any collaboration yet.
 * Legacy flat definitions retain their published serial/root semantics. */
export function normalizeNewGitOrchestration(value: unknown): NormalizedAgentOrchestrationTemplate {
  const template = normalizeAgentOrchestrationTemplate(value);
  if (template.schemaVersion === 3) return template;
  const members = new Set(template.collaborations.flatMap((group) => group.memberAgentIds));
  return normalizeAgentOrchestrationTemplate({ ...template, schemaVersion: 3,
    collaborations: template.collaborations.map((group) => ({ ...group, memberAgentIds: [] })),
    scopedWorkflow: { schemaVersion: 1,
      rootAgentIds: template.agents.map((agent) => agent.name).filter((agentId) => !members.has(agentId)),
      groups: template.collaborations.map((group) => {
        const nodes = group.memberAgentIds.map((agentId) => ({ kind: "agent" as const, agentId,
          nodeId: `scope_${createHash("sha256").update(`${group.id}\0${agentId}`).digest("hex").slice(0, 32)}` }));
        return { id: group.id, leaderAgentId: "main", decisionBy: "main" as const, allowLeaderReconfiguration: false,
          workflow: { nodes, input: { source: "input", edges: nodes.map((node) => ({ kind: "parallel", target: node.nodeId })) },
            routes: Object.fromEntries(nodes.map((node) => [node.nodeId, [{ kind: "strong", target: "finish" }]])) } };
      }) } });
}

export const createProjectSchema = z.object({
  title: z.string().trim().min(1).max(160),
  requirement: z.string().trim().min(1).max(100_000),
  sourceSavedTaskId: z.string().regex(/^task_[a-f0-9]{32}$/).optional(),
  explainerConversationId: z.string().regex(/^(?:exp|prj)_[a-f0-9]{32}$/).optional(),
  inputUploadId: z.string().regex(/^[a-f0-9]{48}$/).optional(),
  inputDescription: z.string().trim().max(2000).optional(),
  agents: partialAgentMap.optional(),
  skillDefinitions: skillDefinitionsSchema.optional(),
  mcpDefinitions: mcpDefinitionsSchema.optional(),
  orchestration: z.unknown().optional().transform((value) => normalizeAgentOrchestrationTemplate(value ?? cloneAgentOrchestrationTemplate())),
  git: projectGitInputSchema
}).strict().superRefine((project, context) => {
  if (project.orchestration.collaborations.length > 0 && !project.git.enabled) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["git", "enabled"], message: "协作组要求启用 Git 机制" });
  }
});
export const modelSelectionSchema = z.object({
  models: z.record(agentNameSchema, agentModelSchema).refine(
    (models) => Object.keys(models).length > 0,
    "至少需要更新一个 Agent 模型"
  )
}).strict();
export const updateAgentModelsSchema = modelSelectionSchema;
export const savedResearchTaskInputSchema = z.object({
  title: z.string().trim().min(1).max(160),
  requirement: z.string().trim().min(1).max(100_000),
  agents: partialAgentMap.optional(),
  skillDefinitions: skillDefinitionsSchema.optional(),
  mcpDefinitions: mcpDefinitionsSchema.optional(),
  orchestration: z.unknown().optional().transform((value) =>
    normalizeDraftAgentOrchestrationTemplate(value ?? cloneAgentOrchestrationTemplate())
  ),
  git: projectGitInputSchema
}).strict().superRefine((task, context) => {
  if (task.orchestration.collaborations.length > 0 && !task.git.enabled) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["git", "enabled"], message: "协作组要求启用 Git 机制" });
  }
});
export const skillInputSchema = z.object({ skill: z.string().trim().min(1).max(4_096) }).strict();
export const createUserSkillSchema = z.object({ title: z.string().trim().min(1).max(160), content: z.string().trim().min(1).max(100_000) }).strict();
export const saveAgentConfigPresetSchema = z.object({ name: z.string().trim().min(1).max(160).optional() }).strict();
export const agentConfigPresetInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  agents: partialAgentMap.optional(),
  skillDefinitions: skillDefinitionsSchema.optional(),
  mcpDefinitions: mcpDefinitionsSchema.optional(),
  orchestration: z.unknown().optional().transform((value) =>
    normalizeAgentOrchestrationTemplate(value ?? cloneAgentOrchestrationTemplate())
  )
}).strict();

const runtimeConfigSchema = z.object({ model: agentModelSchema.optional(), harness: harnessIdSchema.optional(), gatewayId: z.string().trim().regex(/^gwy_[a-f0-9]{32}$/).optional(), gatewayReasoningOption: gatewayReasoningOptionIdSchema.nullable().optional(), instructions: z.string().trim().max(20_000).optional(), skills: z.array(z.string().trim().min(1).max(4_096)).max(32).optional(), autoSkills: z.array(z.string().trim().min(1).max(4_096)).max(32).optional(), mcpServers: agentMcpServersSchema.optional(), experimentMcp: z.boolean().optional(), permission: z.enum(["workspace", "compute", "yolo"]).optional(), webSearch: z.boolean().optional(), sessionPersistence: z.boolean().optional(), decisionBy: z.enum(["main", "agent"]).optional() }).strict();
export const updateAgentConfigsSchema = z.object({ agents: z.record(agentNameSchema, runtimeConfigSchema) }).strict();

const collaborationGroupIdSchema = agentNameSchema.refine(
  (name) => name !== MAIN_AGENT_NAME,
  "协作组 ID 不能使用 main"
);
const workflowEditRequestIdSchema = z.string().trim().min(1).max(200).optional();
const collaborationDissolutionPlanSchema = z.object({
  mode: z.literal("guided"),
  incomingTargetBySource: z.record(agentNameSchema, agentNameSchema),
  memberRoutes: formationRouteMapSchema,
  inputTarget: agentNameSchema.optional(),
  terminationAgent: agentNameSchema.optional(),
  memberCanvasNodes: z.record(agentNameSchema, z.object({
    x: z.number().finite().min(-20_000).max(20_000),
    y: z.number().finite().min(-20_000).max(20_000)
  }).strict()).optional()
}).strict();
export const updateCollaborationGroupSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("rename"),
    groupId: collaborationGroupIdSchema,
    displayName: z.string().trim().min(1).max(64),
    requestId: workflowEditRequestIdSchema
  }).strict(),
  z.object({
    action: z.literal("dissolve"),
    groupId: collaborationGroupIdSchema,
    expectedWorkflowRevision: z.number().int().positive(),
    restoration: collaborationDissolutionPlanSchema.optional(),
    requestId: z.string().trim().min(1).max(200)
  }).strict()
]);
export const gitGraphQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(200),
  cursor: z.string().trim().regex(/^\d+$/).optional(),
  includeTechnical: z.preprocess(
    (value) => value === true || value === "true" || value === "1",
    z.boolean()
  ).default(false)
}).strict();

export function ensureAgentConfigInvariants(agents: AgentConfigMap): boolean { return ensureAgentConfigInvariantsForTemplate(agents, cloneAgentOrchestrationTemplate()); }
export function ensureAgentConfigInvariantsForTemplate(agents: AgentConfigMap, orchestration: AgentOrchestrationTemplate): boolean {
  let changed = normalizeAgentSkillSelections(agents, orchestration);
  for (const definition of orchestration.agents) {
    const current = agents[definition.name];
    if (!current) continue;
    const parsed = agentMcpServersSchema.safeParse(current.mcpServers);
    if (!parsed.success || JSON.stringify(parsed.data) !== JSON.stringify(current.mcpServers)) { current.mcpServers = parsed.success ? parsed.data : []; changed = true; }
  }
  return changed;
}

/** Old files may retain this removed field. Reading them does not restore a
 * configurable network policy or mutate their historical payload. */
export function withoutLegacyAgentProxy<T extends object>(config: T): Omit<T, "proxy"> {
  const { proxy: _legacyProxy, ...current } = config as T & { proxy?: unknown };
  return current;
}

export function mergeAgentConfigs(
  input: z.infer<typeof createProjectSchema>["agents"],
  orchestration: AgentOrchestrationTemplate = cloneAgentOrchestrationTemplate(),
  options: { restoreRuntimeState?: boolean; acceptLegacyReasoning?: boolean } = {}
): AgentConfigMap {
  const configured = new Set(orchestration.agents.map((definition) => definition.name));
  for (const name of Object.keys(input ?? {})) {
    if (!configured.has(name)) {
      throw new Error(`Agent configuration provided for unknown Agent: ${name}`);
    }
  }
  const agents = Object.fromEntries(orchestration.agents.map((definition) => {
    const rawSource = input?.[definition.name] ?? {};
    const rawRecord = rawSource as unknown as Record<string, unknown>;
    const legacyReasoningEffort = isLegacyReasoningEffort(
      rawRecord.reasoningEffort
    )
      ? rawRecord.reasoningEffort
      : isLegacyReasoningEffort(rawRecord.legacyReasoningEffort)
        ? rawRecord.legacyReasoningEffort
        : undefined;
    let source = withoutLegacyAgentProxy(rawSource);
    let restoredGatewaySnapshot: AgentConfig["gatewaySnapshot"];
    let restoredReasoningMigrationWarning: string | undefined;
    if (options.restoreRuntimeState) {
      const {
        proxy: _legacyAgentProxy,
        protocol: legacyAgentProtocol,
        gatewaySnapshot,
        legacyReasoningEffort: _legacyReasoningEffort,
        reasoningMigrationWarning,
        ...restoredSource
      } = rawRecord;
      source = restoredSource;
      restoredReasoningMigrationWarning = reasoningMigrationWarning === undefined
        ? undefined
        : reasoningMigrationWarningSchema.parse(reasoningMigrationWarning);
      if (gatewaySnapshot && typeof gatewaySnapshot === "object") {
        const {
          protocols: legacyGatewayProtocols,
          nativeProtocol: legacyNativeProtocol,
          routeMode: legacyRouteMode,
          routeDirection: legacyRouteDirection,
          allowPrivateNetwork: legacyAllowPrivateNetwork,
          ...snapshotSource
        } = gatewaySnapshot as Record<string, unknown>;
        // Older releases persisted the now-removed per-gateway private-network
        // opt-in. Network policy is global now, so discard this known legacy
        // field before the strict runtime snapshot schema validates the rest.
        void legacyAllowPrivateNetwork;
        const candidateProtocol = AGENT_PROTOCOLS.includes(snapshotSource.protocol as typeof AGENT_PROTOCOLS[number])
          ? snapshotSource.protocol
          : Array.isArray(legacyGatewayProtocols) && AGENT_PROTOCOLS.includes(legacyGatewayProtocols[0] as typeof AGENT_PROTOCOLS[number])
            ? legacyGatewayProtocols[0]
            : AGENT_PROTOCOLS.includes(legacyAgentProtocol as typeof AGENT_PROTOCOLS[number])
              ? legacyAgentProtocol
              : undefined;
        const restoredHarness = restoredSource.harness ?? source.harness;
        const candidateHarness = typeof restoredHarness === "string" && HARNESS_ID_PATTERN.test(restoredHarness)
          ? restoredHarness
          : DEFAULT_HARNESS_ID;
        const nativeProtocol: AgentProtocol = nativeProtocolForHarness(candidateHarness) ??
          (AGENT_PROTOCOLS.includes(legacyNativeProtocol as AgentProtocol)
            ? legacyNativeProtocol as AgentProtocol
            : candidateProtocol ?? "responses");
        const routeMode: "direct" | "proxy" = candidateProtocol && candidateProtocol !== nativeProtocol ? "proxy" : "direct";
        restoredGatewaySnapshot = gatewaySnapshotSchema.parse({
          ...snapshotSource,
          protocol: candidateProtocol,
          nativeProtocol,
          routeMode,
          ...(routeMode === "proxy" && candidateProtocol
            ? { routeDirection: `${nativeProtocol}->${candidateProtocol}` }
            : {})
        });
      }
    }
    const candidate = agentConfigSchema.parse({
      ...defaultAgentConfigFor(definition.name, definition.template),
      ...source
    });
    const { reasoningEffort: _legacyReasoningEffort, ...currentConfig } = candidate;
    const parsed = currentConfig as AgentConfig;
    if (restoredGatewaySnapshot) parsed.gatewaySnapshot = restoredGatewaySnapshot;
    if (legacyReasoningEffort && !parsed.gatewayReasoningOption) {
      if (parsed.gatewaySnapshot) {
        const migration = migrateLegacyGatewayReasoning(
          parsed.gatewaySnapshot.modelReasoning,
          parsed.model,
          legacyReasoningEffort
        );
        if (migration.optionId && migration.reasoning) {
          parsed.gatewayReasoningOption = migration.optionId;
          parsed.gatewaySnapshot.reasoning = migration.reasoning;
          delete parsed.gatewaySnapshot.reasoningMigrationWarning;
        } else if (migration.warning) {
          delete parsed.gatewaySnapshot.reasoning;
          parsed.gatewaySnapshot.reasoningMigrationWarning = migration.warning;
          parsed.reasoningMigrationWarning = migration.warning;
        }
      } else if (options.acceptLegacyReasoning) {
        parsed.legacyReasoningEffort = legacyReasoningEffort;
        parsed.reasoningMigrationWarning =
          `旧 Harness 思考深度“${legacyReasoningEffort}”尚未迁移；未能唯一匹配 Gateway/model 选项前将使用 Provider 默认值`;
      }
    }
    if (!parsed.gatewayReasoningOption && !parsed.reasoningMigrationWarning) {
      const warning = restoredGatewaySnapshot
        ? restoredGatewaySnapshot.reasoningMigrationWarning
        : restoredReasoningMigrationWarning;
      if (warning) parsed.reasoningMigrationWarning = warning;
    }
    if (definition.name === MAIN_AGENT_NAME) {
      parsed.sessionPersistence = true;
      parsed.decisionBy = "main";
    }
    return [definition.name, parsed];
  })) as AgentConfigMap;
  // Main is a first-class public Agent and is already included above.
  ensureAgentConfigInvariantsForTemplate(agents, orchestration);
  return agents;
}

/** Return only user-configured Worker entries for API and saved-config boundaries. */
export function publicAgentConfigs(agents: AgentConfigMap): AgentConfigMap {
  return Object.fromEntries(
    Object.entries(agents)
      .map(([name, config]) => {
        const clone = structuredClone(withoutLegacyAgentProxy(config));
        delete clone.reasoningEffort;
        // Gateway credentials are server-only and never cross the API
        // boundary.  Omit the field entirely instead of serializing an empty
        // placeholder, so consumers cannot mistake a public snapshot for a
        // credential-bearing runtime record.
        if (clone.gatewaySnapshot) {
          const { apiKey: _apiKey, ...publicSnapshot } = clone.gatewaySnapshot;
          clone.gatewaySnapshot = publicSnapshot as AgentConfig["gatewaySnapshot"];
        }
        return [name, clone];
      })
  ) as AgentConfigMap;
}

function isLegacyReasoningEffort(value: unknown): value is LegacyReasoningEffort {
  return value === "low" || value === "medium" || value === "high" || value === "xhigh";
}

export const userInterventionResponseSchema = z.object({ message: z.string().trim().min(1).max(100_000) }).strict();
export const projectUserInputSchema = z.object({
  message: z.string().trim().min(1).max(100_000),
  /** `wait` preserves the active invocation; `interrupt` requests a durable checkpoint. */
  mode: z.enum(["wait", "interrupt"]).optional().default("wait"),
  /** Idempotency key lets a retried browser request return the same input. */
  requestId: z.string().trim().min(1).max(200).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/).optional()
}).strict();
export const projectExplainerQuestionSchema = z.object({ question: z.string().trim().min(1).max(50_000) }).strict();
export const projectExplainerConfigSchema = z.object({
  harness: harnessIdSchema,
  gatewayId: z.string().regex(/^gwy_[a-f0-9]{32}$/).optional(),
  model: z.string().trim().min(1).max(500),
  reasoningEffort: z.enum(["low", "medium", "high", "xhigh"]).optional(),
  confirmHarnessSwitch: z.boolean().optional()
}).strict();

/** Agent turns return one opaque handoff; state-changing intent uses control MCP. */
export const naturalLanguageHandoffSchema = z.string().trim().min(1).max(HANDOFF_CHARACTER_LIMIT);
export const resumeProjectSchema = z.object({ preserveRecoveryBudget: z.boolean().optional() }).strict();
export const cancelProjectSchema = z.object({
  actor: z.enum(["user", "deadline-monitor", "system", "admin"]).optional(),
  reason: z.enum(["user_cancelled", "arm_timeout", "budget_exhausted", "dependency_failure", "shutdown"]).optional(),
  waitForSettlement: z.boolean().optional()
}).strict();
