import { assertAgentGateConfigurationUnchanged } from "./workflow-gate.js";
import { createHash } from "node:crypto";
import path from "node:path";
import type { WorkflowConfigurationVersion } from "./workflow-adjustments.js";
import { MAIN_AGENT_ORCHESTRATION_FILE } from "./main-workflow-files.js";
export { MAIN_AGENT_ORCHESTRATION_FILE, MAIN_AGENT_ORCHESTRATION_CURRENT_FILE } from "./main-workflow-files.js";
import type {
  AgentConfig,
  AgentConfigMap,
  AgentMcpServer,
  AgentOrchestrationTemplate
} from "./types.js";
import {
  defaultAgentConfigFor,
  mergeAgentConfigs,
  normalizeAgentOrchestrationTemplate,
  normalizedAgentMcpServers,
  normalizedAgentSkills
} from "./validation.js";
import { DEFAULT_HARNESS_ID } from "./agent-runtime.js";
import {
  mcpDefinitionsSchema,
  mcpRevision,
  validateProjectMcpReferences,
  type ProjectMcpDefinitions
} from "./project-mcp.js";
import {
  skillDefinitionsSchema,
  skillRevision,
  validateProjectSkillReferences,
  type ProjectSkillDefinitions
} from "./project-skills.js";

export const MAX_AGENT_ORCHESTRATION_FILE_BYTES = 2 * 1024 * 1024;

export const EDITABLE_AGENT_FIELDS = [
  "model",
  "harness",
  "gatewayId",
  "instructions",
  "skills",
  "autoSkills",
  "mcpServers",
  "experimentMcp",
  "decisionBy"
] as const;

type EditableAgentField = (typeof EDITABLE_AGENT_FIELDS)[number];

export type EditableAgentConfig = Pick<
  AgentConfig,
  EditableAgentField
>;

export interface LockedAgentRuntime {
  currentModel: string;
  reasoningEffort: AgentConfig["reasoningEffort"];
  currentGatewayId?: string;
  gatewayName?: string;
  gatewayReasoningOption?: string;
  currentHarness: string;
  permission: AgentConfig["permission"];
  webSearch: boolean;
  sessionPersistence: boolean;
}

export interface MainAgentOrchestrationDocument {
  schemaVersion: 2;
  projectId: string;
  baseHash: string;
  baseVersion?: WorkflowConfigurationVersion;
  editableFields: readonly ["orchestration", "agents", "skillDefinitions", "mcpDefinitions"];
  editingInstructions: {
    routes: string;
    invariants: string[];
  };
  orchestration: AgentOrchestrationTemplate;
  agents: Record<string, EditableAgentConfig>;
  skillDefinitions: ProjectSkillDefinitions;
  mcpDefinitions: ProjectMcpDefinitions;
  /** Server-generated values that Main may inspect but never edit. */
  lockedRuntime: Record<string, LockedAgentRuntime>;
}

export interface AgentOrchestrationProposal {
  orchestration: AgentOrchestrationTemplate;
  agents: AgentConfigMap;
  skillDefinitions: ProjectSkillDefinitions;
  mcpDefinitions: ProjectMcpDefinitions;
}

function editableAgentConfig(config: AgentConfig): EditableAgentConfig {
  return {
    model: config.model,
    harness: config.harness ?? DEFAULT_HARNESS_ID,
    ...(config.gatewayId ? { gatewayId: config.gatewayId } : {}),
    instructions: config.instructions,
    skills: [...config.skills],
    autoSkills: [...config.autoSkills],
    mcpServers: config.mcpServers.map((server) => ({ ...server })),
    ...(config.experimentMcp === undefined ? {} : { experimentMcp: config.experimentMcp }),
    decisionBy: config.decisionBy
  };
}

function lockedAgentRuntime(config: AgentConfig): LockedAgentRuntime {
  return {
    currentModel: config.model,
    reasoningEffort: config.reasoningEffort,
    ...(config.gatewayId || config.gatewaySnapshot?.id
      ? { currentGatewayId: config.gatewayId ?? config.gatewaySnapshot?.id }
      : {}),
    ...(config.gatewaySnapshot?.name
      ? { gatewayName: config.gatewaySnapshot.name }
      : {}),
    ...(config.gatewayReasoningOption
      ? { gatewayReasoningOption: config.gatewayReasoningOption }
      : {}),
    currentHarness: config.harness ?? DEFAULT_HARNESS_ID,
    permission: config.permission,
    webSearch: config.webSearch,
    sessionPersistence: config.sessionPersistence,
  };
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function agentOrchestrationHashInput(
  orchestration: AgentOrchestrationTemplate,
  agents: Record<string, EditableAgentConfig>,
  lockedRuntime: Record<string, LockedAgentRuntime>,
  skillDefinitions: ProjectSkillDefinitions,
  mcpDefinitions: ProjectMcpDefinitions
): {
  orchestration: AgentOrchestrationTemplate;
  agents: Record<string, EditableAgentConfig>;
  lockedRuntime: Record<string, LockedAgentRuntime>;
  skillDefinitions: ProjectSkillDefinitions;
  mcpDefinitions: ProjectMcpDefinitions;
} {
  return {
    orchestration: structuredClone(orchestration),
    agents: structuredClone(agents),
    lockedRuntime: structuredClone(lockedRuntime),
    skillDefinitions: structuredClone(skillDefinitions),
    mcpDefinitions: structuredClone(mcpDefinitions)
  };
}

export function agentOrchestrationBaseHash(
  orchestration: AgentOrchestrationTemplate,
  currentAgents: AgentConfigMap,
  lockedRuntime: Record<string, LockedAgentRuntime> = Object.fromEntries(
    Object.entries(currentAgents).map(([name, config]) => [
      name,
      lockedAgentRuntime(config)
    ])
  ),
  skillDefinitions: ProjectSkillDefinitions = {},
  mcpDefinitions: ProjectMcpDefinitions = {}
): string {
  const agents = Object.fromEntries(
    Object.entries(currentAgents).map(([name, config]) => [
      name,
      editableAgentConfig(config)
    ])
  );
  return createHash("sha256")
    .update(
      canonicalJson(agentOrchestrationHashInput(
        orchestration,
        agents,
        lockedRuntime,
        skillDefinitions,
        mcpDefinitionsSchema.parse(mcpDefinitions)
      )),
      "utf8"
    )
    .digest("hex");
}

export function mainAgentOrchestrationDocument(
  projectId: string,
  orchestration: AgentOrchestrationTemplate,
  currentAgents: AgentConfigMap,
  skillDefinitions: ProjectSkillDefinitions = {},
  mcpDefinitions: ProjectMcpDefinitions = {},
  baseVersion?: WorkflowConfigurationVersion
): MainAgentOrchestrationDocument {
  const agents = Object.fromEntries(
    Object.entries(currentAgents).map(([name, config]) => [
      name,
      editableAgentConfig(config)
    ])
  );
  const lockedRuntime = Object.fromEntries(
    Object.entries(currentAgents).map(([name, config]) => [
      name,
      lockedAgentRuntime(config)
    ])
  );
  return {
    schemaVersion: 2,
    projectId,
    ...(baseVersion ? { baseVersion: structuredClone(baseVersion) } : {}),
    baseHash: agentOrchestrationBaseHash(
      orchestration,
      currentAgents,
      lockedRuntime,
      skillDefinitions,
      mcpDefinitions
    ),
    editableFields: ["orchestration", "agents", "skillDefinitions", "mcpDefinitions"],
    editingInstructions: {
      routes:
        orchestration.schemaVersion === 3
          ? "Preserve the scoped graph in orchestration.scopedWorkflow. Root routes refer to outer Agent/group node IDs; group.workflow.routes refer only to that group's nodeId values or finish. Every route is { target, kind } with strong/weak kind. Group Input uses parallel edges, not ordinary routes."
          : "Every route is an object with exactly { target, kind }; kind must be \"strong\" or \"weak\". Example: [{ \"target\": \"main\", \"kind\": \"strong\" }].",
      invariants: [
        "Edit this original version-2 authoring proposal. workflow/definition.json is a separate read-only publication wrapper, not an authoring proposal: never replace this document with its schemaVersion/workflowRevision/workflow fields. Graph identity template/description fields belong in orchestration.agents, not in agents[name] runtime configuration.",
        "Keep the required main Agent and a decisionPlans entry for every Agent.",
        ...(orchestration.schemaVersion === 3 ? [
          "Keep group IDs, parentGroupId, leaderAgentId, nodeId/agentId/groupId references and scopedWorkflow.rootAgentIds consistent. Nested groups remain nodes in their direct parent's graph; do not expose their children as parent-scope targets.",
          "Scoped Loop definitions use the containing group's node IDs and { id, from, to, maxIterations, exitTo }. Reaching maxIterations exits the Loop; do not invent a new batch or reset counters on retry, resume or reconfiguration. Preserve completed tasks/groups and let the accepted revision govern subsequent execution."
        ] : [
          "Route targets, input.target, and termination.agent must reference configured Agents; only the termination Agent may route to finish.",
          "Main's outgoing routes are server-maintained fan-out edges to the configured ordinary Agents; edit ordinary Agent routes instead of trying to remove or retarget main's edges.",
          "Optional orchestration.loops define loop groups with { id, from, to, maxIterations, exitTo }: to is the entry, from the final Agent, and maxIterations is the size of each batch. Main can route back to to to start a fresh batch without changing this config. Batch completion routes to exitTo and preserves the original termination rules; only the existing completion decision ends the project. Retries, resume and reconfiguration alone do not reset counters. Keep loop IDs stable for cumulative audit history."
        ]),
        `Do not change schemaVersion, projectId, baseHash, ${baseVersion ? "baseVersion, " : ""}editableFields, editingInstructions, lockedRuntime, allowUserIntervention, or allowMainReconfiguration.`,
        "Add task-specific Skills in skillDefinitions as complete text-file bundles. Every definition requires a non-empty SKILL.md, paths must be safe relative POSIX paths, and Agents select them with project:name in skills or autoSkills. Existing definitions are immutable after acceptance: omission preserves them, an identical copy is allowed, and a new name may be added. Content changes, same-name replacement and deletion are rejected. New invocations use accepted content; existing Agent identities retain their session and fixed working directory.",
        "Add project-owned stdio MCP services in mcpDefinitions with files, entrypoint, optional command/args, and envFrom. Agents select them with { name, project }; remote { name, url } remains supported. envFrom maps child variable names to host variable names and never contains inline secrets. Each selected service gets a private process for one invocation, runs with the assigned Agent workspace as cwd, and closes on completion, failure, or cancellation. Existing definitions are immutable after acceptance: omission preserves them, an identical copy is allowed, and a new name may be added. Content changes, same-name replacement and deletion are rejected. New invocations use accepted configuration without replacing existing Agent sessions.",
        "Edit agents[name] to change instructions, model, harness, gatewayId, skills, autoSkills, mcpServers, experimentMcp, or decisionBy. experimentMcp=true explicitly selects the built-in SII tools for that Agent in every assigned role. It does not change file permissions. Gateway IDs must name a server-configured route; raw URLs, credentials, snapshots, reasoning options and host paths are forbidden.",
        "Permission, Web Search, session persistence, native reasoningEffort, Gateway reasoning options, and gatewaySnapshot remain server-owned. Decision ownership is editable per Agent and controls which authorized coordinator selects weak routes.",
        "Model, Harness, and Gateway changes must resolve to a server-validated Workflow-capable route before the proposal can commit.",
        "Changing an existing Agent's template changes only its macro role label; it does not replace that Agent's current runtime configuration.",
        "When adding, removing, or renaming an Agent, keep the agents object keys aligned with the new Agent names; omitted entries use server template defaults.",
        "New Agents inherit Main's proposed model, Harness, and Gateway route, then use their selected template defaults for locked runtime settings and omitted editable fields."
      ]
    },
    orchestration: structuredClone(orchestration),
    agents,
    skillDefinitions: structuredClone(skillDefinitions),
    mcpDefinitions: structuredClone(mcpDefinitions),
    lockedRuntime
  };
}

function record(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${field} must be an object`);
  }
  return value as Record<string, unknown>;
}

function same(left: unknown, right: unknown): boolean {
  return canonicalJson(left) === canonicalJson(right);
}

function appendOnlyProjectDefinitions<T>(
  label: "Skill" | "MCP",
  proposed: Record<string, T>,
  current: Record<string, T>,
  revision: (value: T) => string
): Record<string, T> {
  const merged: Record<string, T> = structuredClone(current);
  for (const [name, value] of Object.entries(proposed) as Array<[string, T]>) {
    const prior = current[name];
    if (prior !== undefined) {
      if (revision(value) !== revision(prior)) {
        throw new Error(`Existing project ${label} ${name} is immutable; create a new definition name instead`);
      }
      continue;
    }
    merged[name] = structuredClone(value);
  }
  return merged;
}

function validateEditableAgentPatch(
  value: unknown,
  agent: string
): Partial<EditableAgentConfig> {
  const source = record(value, `agents.${agent}`);
  const editable = new Set<string>(EDITABLE_AGENT_FIELDS);
  const locked = new Set([
    "reasoningEffort",
    "gatewayReasoningOption",
    "gatewaySnapshot",
    "permission",
    "webSearch",
    "sessionPersistence"
  ]);
  for (const field of Object.keys(source)) {
    if (locked.has(field)) {
      throw new Error(`agents.${agent}.${field} is locked and cannot be changed`);
    }
    if (!editable.has(field)) {
      throw new Error(`agents.${agent} contains unsupported field: ${field}`);
    }
  }
  return source as Partial<EditableAgentConfig>;
}

function configInput(
  base: AgentConfig,
  patch: Partial<EditableAgentConfig>
): AgentConfig {
  const skills = patch.skills ?? base.skills;
  const autoSkills = patch.autoSkills ?? base.autoSkills;
  const mcpServers = patch.mcpServers ?? base.mcpServers;
  const normalizedSkills = normalizedAgentSkills("workflow", skills, autoSkills);
  return {
    model: patch.model ?? base.model,
    harness: patch.harness ?? base.harness ?? DEFAULT_HARNESS_ID,
    ...(base.nativeCodexProfileId ? { nativeCodexProfileId: base.nativeCodexProfileId } : {}),
    ...((patch.gatewayId ?? base.gatewayId)
      ? { gatewayId: patch.gatewayId ?? base.gatewayId }
      : {}),
    ...(base.gatewayReasoningOption
      ? { gatewayReasoningOption: base.gatewayReasoningOption }
      : {}),
    instructions: patch.instructions ?? base.instructions,
    skills: normalizedSkills.skills,
    autoSkills: normalizedSkills.autoSkills,
    mcpServers: normalizedAgentMcpServers(mcpServers as AgentMcpServer[]),
    ...((patch.experimentMcp ?? base.experimentMcp) === undefined
      ? {} : { experimentMcp: patch.experimentMcp ?? base.experimentMcp }),
    permission: base.permission,
    ...(base.reasoningEffort ? { reasoningEffort: base.reasoningEffort } : {}),
    webSearch: base.webSearch,
    sessionPersistence: base.sessionPersistence,
    decisionBy: patch.decisionBy ?? base.decisionBy
  };
}

function sameExecutionRoute(left: AgentConfig, right: AgentConfig): boolean {
  return left.model === right.model &&
    (left.harness ?? DEFAULT_HARNESS_ID) ===
      (right.harness ?? DEFAULT_HARNESS_ID) &&
    left.gatewayId === right.gatewayId &&
    left.nativeCodexProfileId === right.nativeCodexProfileId &&
    left.gatewayReasoningOption === right.gatewayReasoningOption;
}

/**
 * Parse a Main-authored proposal against the server-generated snapshot. Only
 * the explicit editable Agent fields are applied to the current state; locked
 * runtime values and Gateway snapshots remain server-owned.
 */
export function parseAgentOrchestrationProposal(
  raw: string,
  projectId: string,
  currentOrchestration: AgentOrchestrationTemplate,
  currentAgents: AgentConfigMap,
  options: {
    baseDir?: string;
    skillDefinitions?: ProjectSkillDefinitions;
    mcpDefinitions?: ProjectMcpDefinitions;
    baseVersion?: WorkflowConfigurationVersion;
  } = {}
): AgentOrchestrationProposal {
  if (Buffer.byteLength(raw, "utf8") > MAX_AGENT_ORCHESTRATION_FILE_BYTES) {
    throw new Error(`${MAIN_AGENT_ORCHESTRATION_FILE} exceeds the 2 MiB limit`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new Error(`${MAIN_AGENT_ORCHESTRATION_FILE} is not valid JSON`);
  }
  const document = record(parsed, "agent orchestration document");
  const allowedDocumentFields = new Set([
    "schemaVersion",
    "projectId",
    "baseHash",
    "baseVersion",
    "editableFields",
    "editingInstructions",
    "orchestration",
    "agents",
    "skillDefinitions",
    "mcpDefinitions",
    "lockedRuntime"
  ]);
  const unsupportedField = Object.keys(document).find(
    (field) => !allowedDocumentFields.has(field)
  );
  if (unsupportedField) {
    throw new Error(`${MAIN_AGENT_ORCHESTRATION_FILE} contains unsupported field: ${unsupportedField}`);
  }
  if (document.schemaVersion !== 2) {
    throw new Error(`${MAIN_AGENT_ORCHESTRATION_FILE} schemaVersion must be 2`);
  }
  if (document.projectId !== projectId) {
    throw new Error(`${MAIN_AGENT_ORCHESTRATION_FILE} belongs to a different project`);
  }
  if (!same(document.baseVersion, options.baseVersion)) {
    throw new Error(`${MAIN_AGENT_ORCHESTRATION_FILE} is stale; its original configuration version does not match the current accepted version. Preserve the draft and explicitly reconcile it with the current authoritative document`);
  }
  const expectedDocument = mainAgentOrchestrationDocument(
    projectId,
    currentOrchestration,
    currentAgents,
    options.skillDefinitions,
    options.mcpDefinitions,
    options.baseVersion
  );
  if (!same(document.editableFields, expectedDocument.editableFields)) {
    throw new Error(`${MAIN_AGENT_ORCHESTRATION_FILE} editableFields is server-owned and immutable`);
  }
  const editingInstructions = record(
    document.editingInstructions,
    "editingInstructions"
  );
  const expectedEditingInstructions = expectedDocument.editingInstructions;
  const editingInstructionFields = Object.keys(editingInstructions).sort();
  if (
    editingInstructionFields.length !== 2 ||
    editingInstructionFields[0] !== "invariants" ||
    editingInstructionFields[1] !== "routes" ||
    editingInstructions.routes !== expectedEditingInstructions.routes ||
    !same(
      editingInstructions.invariants,
      expectedEditingInstructions.invariants
    )
  ) {
    throw new Error(
      `${MAIN_AGENT_ORCHESTRATION_FILE} editingInstructions is server-owned and immutable`
    );
  }
  if (
    document.baseHash !==
    agentOrchestrationBaseHash(
      currentOrchestration,
      currentAgents,
      expectedDocument.lockedRuntime,
      options.skillDefinitions,
      options.mcpDefinitions
    )
  ) {
    throw new Error(
      `${MAIN_AGENT_ORCHESTRATION_FILE} is stale; Main must explicitly reconcile the retained draft with the current authoritative configuration before resubmitting`
    );
  }
  if (!same(document.lockedRuntime, expectedDocument.lockedRuntime)) {
    throw new Error(
      `${MAIN_AGENT_ORCHESTRATION_FILE} lockedRuntime is server-owned and immutable`
    );
  }
  const orchestration = normalizeAgentOrchestrationTemplate(
    record(document.orchestration, "orchestration")
  );
  assertAgentGateConfigurationUnchanged(currentOrchestration, orchestration);
  if (
    (orchestration.allowMainReconfiguration === true) !==
    (currentOrchestration.allowMainReconfiguration === true)
  ) {
    throw new Error("Main cannot change its workflow-reconfiguration authority");
  }
  if ((orchestration.allowUserIntervention !== false) !== (currentOrchestration.allowUserIntervention !== false)) {
    throw new Error("Main cannot change the user's intervention setting");
  }

  const rawAgents = record(document.agents, "agents");
  const configuredNames = new Set(orchestration.agents.map(({ name }) => name));
  for (const name of Object.keys(rawAgents)) {
    if (!configuredNames.has(name)) {
      throw new Error(`agents contains a removed or unknown Agent: ${name}`);
    }
  }
  const patches = new Map<string, Partial<EditableAgentConfig>>();
  for (const [name, value] of Object.entries(rawAgents)) {
    const patch = validateEditableAgentPatch(value, name);
    for (const field of ["skills", "autoSkills"] as const) {
      if (!patch[field]) continue;
      patch[field] = patch[field]!.map((selection) => {
        if (!/^(?:\.\.?)[\\/]/.test(selection)) return selection;
        if (!options.baseDir || !path.isAbsolute(options.baseDir)) {
          throw new Error("Relative Skill paths require an absolute workflow baseDir");
        }
        return path.resolve(options.baseDir, selection);
      });
    }
    patches.set(name, patch);
  }
  const mainBase = structuredClone(
    currentAgents.main ?? Object.values(currentAgents)[0]
  );
  delete mainBase.gatewaySnapshot;
  const mainRoute = configInput(mainBase, patches.get("main") ?? {});
  const input = Object.fromEntries(
    orchestration.agents.map((definition) => {
      const current = currentAgents[definition.name];
      let base: AgentConfig;
      if (current) {
        base = structuredClone(current);
      } else {
        const defaults = defaultAgentConfigFor(
          definition.name,
          definition.template
        );
        base = {
          ...defaults,
          model: mainRoute.model,
          harness: mainRoute.harness,
          ...(mainRoute.nativeCodexProfileId ? { nativeCodexProfileId: mainRoute.nativeCodexProfileId } : {}),
          ...(mainRoute.gatewayId ? { gatewayId: mainRoute.gatewayId } : {})
        };
      }
      delete base.gatewaySnapshot;
      const patch = patches.get(definition.name) ?? {};
      return [definition.name, configInput(base, patch)];
    })
  ) as Parameters<typeof mergeAgentConfigs>[0];
  const agents = mergeAgentConfigs(input, orchestration);
  const currentSkillDefinitions = skillDefinitionsSchema.parse(options.skillDefinitions ?? {});
  const skillDefinitions = appendOnlyProjectDefinitions(
    "Skill",
    skillDefinitionsSchema.parse(document.skillDefinitions ?? {}) as ProjectSkillDefinitions,
    currentSkillDefinitions,
    skillRevision
  );
  validateProjectSkillReferences(agents, skillDefinitions);
  const currentMcpDefinitions = mcpDefinitionsSchema.parse(options.mcpDefinitions ?? {});
  const mcpDefinitions = appendOnlyProjectDefinitions(
    "MCP",
    mcpDefinitionsSchema.parse(document.mcpDefinitions ?? {}) as ProjectMcpDefinitions,
    currentMcpDefinitions,
    mcpRevision
  );
  validateProjectMcpReferences(agents, mcpDefinitions);
  for (const [name, config] of Object.entries(agents)) {
    const current = currentAgents[name];
    if (current?.gatewaySnapshot && sameExecutionRoute(current, config)) {
      config.gatewaySnapshot = structuredClone(current.gatewaySnapshot);
    }
  }

  const currentAgentsProjection = expectedDocument.agents;
  const proposedAgentsProjection = Object.fromEntries(
    Object.entries(agents).map(([name, config]) => [
      name,
      editableAgentConfig(config)
    ])
  );
  if (
    same(orchestration, normalizeAgentOrchestrationTemplate(currentOrchestration)) &&
    same(proposedAgentsProjection, currentAgentsProjection) &&
    same(skillDefinitions, currentSkillDefinitions) &&
    same(mcpDefinitions, currentMcpDefinitions)
  ) {
    throw new Error(`${MAIN_AGENT_ORCHESTRATION_FILE} does not contain a configuration change`);
  }
  return { orchestration, agents, skillDefinitions, mcpDefinitions };
}
