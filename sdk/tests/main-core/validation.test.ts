import { describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import { BUILTIN_AGENT_PROMPTS } from "../../src/core/prompt.js";
import {
  DEFAULT_AGENT_ORCHESTRATION_TEMPLATE,
  defaultDecisionPlan
} from "../../src/core/agent-orchestration.js";
import { canonicalizeMainRoutes } from "../../src/core/agent-orchestration.js";
import {
  agentOrchestrationTemplateSchema,
  createProjectSchema,
  savedResearchTaskInputSchema,
  DEFAULT_AGENT_MODEL,
  ensureAgentConfigInvariants,
  mergeAgentConfigs,
  normalizeAgentOrchestrationTemplate,
  normalizeNewGitOrchestration,
  normalizeDraftAgentOrchestrationTemplate,
  naturalLanguageHandoffSchema,
  projectExplainerQuestionSchema,
  updateAgentConfigsSchema,
  updateAgentModelsSchema,
} from "../../src/core/validation.js";
const AGENT_NAMES = ["main", "idea", "execution", "writing", "review"] as const;

describe("project creation assistant references", () => {
  const input = { title: "Launch a reviewed draft", requirement: "Retain the project assistant conversation." };

  it.each([
    { sourceSavedTaskId: `task_${"a".repeat(32)}` },
    { explainerConversationId: `exp_${"b".repeat(32)}` },
    { explainerConversationId: `prj_${"c".repeat(32)}` },
    { sourceSavedTaskId: `task_${"a".repeat(32)}`, explainerConversationId: `exp_${"b".repeat(32)}` }
  ])("accepts supported launch references %j", references => {
    expect(createProjectSchema.parse({ ...input, ...references })).toMatchObject(references);
  });

  it.each([
    { sourceSavedTaskId: "" },
    { sourceSavedTaskId: `exp_${"a".repeat(32)}` },
    { sourceSavedTaskId: "../../saved-task" },
    { explainerConversationId: "" },
    { explainerConversationId: `task_${"a".repeat(32)}` },
    { explainerConversationId: "../../conversation" },
    { unexpectedLaunchParameter: true }
  ])("rejects malformed references and unknown launch fields %j", references => {
    expect(() => createProjectSchema.parse({ ...input, ...references })).toThrow();
  });
});

describe("agent configuration defaults", () => {
  it.each([2, 3] as const)("accepts a v%s project and draft with more than fifty Agents, templates and Main dispatch edges", schemaVersion => {
    const ordinary = structuredClone(DEFAULT_AGENT_ORCHESTRATION_TEMPLATE);
    for (let index = 0; index < 60; index += 1) {
      const name = `researcher_${index}`;
      ordinary.agents.push({ name, template: "general" });
      ordinary.routes[name] = [{ target: "main", kind: "strong" }];
      ordinary.decisionPlans[name] = "Return verified evidence to Main.";
    }
    ordinary.agentTemplates = Array.from({ length: 60 }, (_, index) => ({ name: `template_${index}`, template: "general" as const }));
    const orchestration = schemaVersion === 3 ? normalizeNewGitOrchestration(ordinary) : ordinary;
    const input = { title: "Large research team", requirement: "Configure the complete team without an Agent count cap.",
      agents: Object.fromEntries(orchestration.agents.map(agent => [agent.name, { model: "test-model" }])),
      orchestration, git: { enabled: schemaVersion === 3 } };
    for (const schema of [createProjectSchema, savedResearchTaskInputSchema]) {
      const parsed = schema.parse(input);
      expect(parsed.orchestration.agents).toHaveLength(65);
      expect(Object.keys(parsed.agents!)).toHaveLength(65);
      expect(parsed.orchestration.agentTemplates).toHaveLength(60);
      expect(parsed.orchestration.routes.main).toHaveLength(64);
    }
  });

  it("accepts more than fifty members and formation edges in a legacy collaboration", () => {
    const orchestration = structuredClone(DEFAULT_AGENT_ORCHESTRATION_TEMPLATE);
    const members = Array.from({ length: 60 }, (_, index) => `researcher_${index}`);
    orchestration.agents.push(...members.map(name => ({ name, template: "general" as const })));
    const edges = members.map(target => ({ target, kind: "weak" as const }));
    orchestration.collaborations = [{ id: "research_group", displayName: "Research group", memberAgentIds: members, renamePolicy: "editable",
      formationSnapshot: { schemaVersion: 1, workflowRevision: 1, memberRoutes: {}, memberDecisionPlans: {},
        inboundRoutes: { main: edges }, formedRoutes: { main: edges } } }];
    orchestration.routes.research_group = [{ target: "review", kind: "strong" }];
    orchestration.decisionPlans.research_group = "Coordinate all research members.";
    const parsed = createProjectSchema.parse({ title: "Large collaboration", requirement: "Keep every member in the collaboration.", orchestration, git: { enabled: true } });
    expect(parsed.orchestration.collaborations[0]!.memberAgentIds).toHaveLength(60);
    expect(normalizeNewGitOrchestration(parsed.orchestration).scopedWorkflow!.groups[0]!.workflow.nodes).toHaveLength(60);
  });

  it("promotes a fresh Git graph before any session without changing its root routes, Loops or Agent identities", () => {
    const previous = structuredClone(DEFAULT_AGENT_ORCHESTRATION_TEMPLATE);
    const next = normalizeNewGitOrchestration(previous);
    expect(next.schemaVersion).toBe(3); expect(next.scopedWorkflow).toEqual({ schemaVersion: 1, rootAgentIds: AGENT_NAMES, groups: [] });
    expect(next.agents).toEqual(previous.agents); expect(next.input).toEqual(previous.input);
    expect(next.routes).toEqual(normalizeAgentOrchestrationTemplate(previous).routes);
    expect(normalizeNewGitOrchestration(next)).toEqual(next);
    expect(previous.schemaVersion).toBe(2);
  });

  it("promotes a legacy flat definition to scoped Input parallel paths while retaining the old root membership and direct target", () => {
    const previous = structuredClone(DEFAULT_AGENT_ORCHESTRATION_TEMPLATE);
    previous.collaborations = [{ id: "research", displayName: "Research", memberAgentIds: ["idea", "execution"], renamePolicy: "editable" }];
    previous.input.target = "research";
    delete previous.routes.idea; delete previous.routes.execution;
    delete previous.decisionPlans.idea; delete previous.decisionPlans.execution;
    previous.decisionPlans.research = defaultDecisionPlan("research");
    previous.routes.research = [{ kind: "strong", target: "writing" }];
    previous.routes.main = [{ kind: "weak", target: "research" }, { kind: "weak", target: "writing" }, { kind: "weak", target: "review" }];
    const next = normalizeNewGitOrchestration(previous); const group = next.scopedWorkflow!.groups[0];
    expect(next.scopedWorkflow!.rootAgentIds).toEqual(["main", "writing", "review"]);
    expect(next.collaborations[0].memberAgentIds).toEqual([]); expect(next.input.target).toBe("research");
    expect(group.leaderAgentId).toBe("main"); expect(group.workflow.nodes.map((node) => node.kind === "agent" && node.agentId)).toEqual(["idea", "execution"]);
    expect(group.workflow.input.edges.map((edge) => edge.kind)).toEqual(["parallel", "parallel"]);
    expect(next.routes.research).toEqual(previous.routes.research);
  });
  it("keeps library templates separate from canvas Agents and rejects another Main template", () => {
    const orchestration = structuredClone(DEFAULT_AGENT_ORCHESTRATION_TEMPLATE);
    orchestration.agentTemplates = [{ name: "verifier_agent", template: "review", description: "核验交付质量" }];

    const parsed = normalizeDraftAgentOrchestrationTemplate(orchestration);
    expect(parsed.agentTemplates).toEqual(orchestration.agentTemplates);
    expect(parsed.agents.some((agent) => agent.name === "verifier_agent")).toBe(false);
    expect(() => agentOrchestrationTemplateSchema.parse({
      ...orchestration,
      agentTemplates: [{ name: "main", template: "main" }]
    })).toThrow("内置 Agent 模板不能重复创建");
  });

  it("allows disconnected canvas anchors in drafts but rejects them for strict workflows", () => {
    const draft = structuredClone(DEFAULT_AGENT_ORCHESTRATION_TEMPLATE);
    draft.canvas = {
      schemaVersion: 1,
      nodes: {},
      edges: {},
      viewport: { x: 0, y: 0, zoom: 0.82 },
      layoutMode: "free",
      connections: { input: false, termination: false }
    };

    expect(normalizeDraftAgentOrchestrationTemplate(draft).canvas?.connections).toEqual({
      input: false,
      termination: false
    });
    expect(() => agentOrchestrationTemplateSchema.parse(draft)).toThrow("用户输入尚未连接到 Agent");
  });

  it.each([
    { explainerConversationId: "../outside" },
    { sourceSavedTaskId: `prj_${"a".repeat(32)}` },
    { unrelatedMetadata: "not accepted" }
  ])("rejects invalid creation metadata without weakening the strict project input: %j", metadata => {
    expect(() => createProjectSchema.parse({ title: "Project", requirement: "Use the accepted inputs.", ...metadata })).toThrow();
  });

  it("defaults and validates the four-part Agent orchestration template", () => {
    const parsed = createProjectSchema.parse({
      title: "Default orchestration",
      requirement: "Verify the default four-part orchestration template."
    });
    expect(parsed.orchestration).toEqual(DEFAULT_AGENT_ORCHESTRATION_TEMPLATE);
    expect(parsed.orchestration.resultFormat).toEqual({ presets: ["论文"], custom: "" });
    expect(parsed.orchestration.termination).toEqual({
      agent: "review",
      condition:
        "评审结果表明论文达到可接受的投稿标准，且没有未解决的关键问题",
      decisionBy: "main",
      automatic: false
    });
    expect(parsed.orchestration.routes?.review).toEqual([
      { target: "main", kind: "weak" },
      { target: "finish", kind: "weak" }
    ]);

    const custom = structuredClone(DEFAULT_AGENT_ORCHESTRATION_TEMPLATE);
    custom.input.target = "execution";
    custom.routes.execution = [{ target: "writing", kind: "strong" }];
    custom.termination = {
      agent: "writing",
      condition: "论文已经达到可投稿标准，并且主要实验结论均有证据支持。",
      decisionBy: "main",
      automatic: false
    };
    custom.routes.review = [{ target: "main", kind: "strong" }];
    custom.routes.writing = [{ target: "finish", kind: "weak" }];
    expect(agentOrchestrationTemplateSchema.parse(custom)).toEqual(custom);

    const duplicateMain = structuredClone(custom);
    duplicateMain.agents.push({ name: "main", template: "main" });
    expect(() => agentOrchestrationTemplateSchema.parse(duplicateMain)).toThrow(
      "Agent name 不能重复"
    );

    const legacyKind = structuredClone(custom) as unknown as {
      agents: Array<Record<string, unknown>>;
    };
    legacyKind.agents[1].kind = "worker";
    expect(() => agentOrchestrationTemplateSchema.parse(legacyKind)).toThrow(
      "Unrecognized key(s) in object: 'kind'"
    );
  });

  it("accepts an explicit GitHub repository name and visibility", () => {
    const parsed = createProjectSchema.parse({
      title: "Public evidence repository",
      requirement: "Verify repository settings at the server boundary.",
      git: {
        enabled: true,
        provider: "github",
        accountId: "gha_11111111111111111111111111111111",
        repositoryName: "evidence-repository_2026",
        repositoryVisibility: "public"
      }
    });
    expect(parsed.git).toMatchObject({
      repositoryName: "evidence-repository_2026",
      repositoryVisibility: "public"
    });
    expect(() => createProjectSchema.parse({
      title: "Unsafe repository",
      requirement: "Reject repository names that cannot reach the provider.",
      git: {
        enabled: true,
        provider: "github",
        repositoryName: "unsafe/name",
        repositoryVisibility: "private"
      }
    })).toThrow("GitHub 仓库名称无效");
  });

  it("injects one public Main and rebuilds its fixed weak routes", () => {
    const orchestration = structuredClone(DEFAULT_AGENT_ORCHESTRATION_TEMPLATE);
    orchestration.agents = orchestration.agents.filter(
      (definition) => definition.name !== "main"
    );
    delete orchestration.routes.main;
    delete orchestration.decisionPlans.main;

    const parsed = normalizeAgentOrchestrationTemplate({
      ...orchestration,
      routes: {
        ...orchestration.routes,
        main: [
          { target: "finish", kind: "strong" },
          { target: "idea", kind: "strong" }
        ]
      }
    });

    expect(parsed.agents[0]).toEqual({ name: "main", template: "main" });
    expect(parsed.agents.filter((definition) => definition.name === "main")).toHaveLength(1);
    expect(parsed.routes.main).toEqual([
      { target: "idea", kind: "weak" },
      { target: "execution", kind: "weak" },
      { target: "writing", kind: "weak" },
      { target: "review", kind: "weak" }
    ]);
    expect(parsed.routes.main).not.toContainEqual(
      expect.objectContaining({ target: "finish" })
    );
    expect(parsed.decisionPlans.main).toBeTruthy();

    const agents = mergeAgentConfigs(undefined, parsed);
    expect(agents.main.permission).toBe("yolo");
  });

  it("supports unique Agent names with reusable and user-defined roles", () => {
    const orchestration = structuredClone(DEFAULT_AGENT_ORCHESTRATION_TEMPLATE);
    orchestration.agents.push(
      {
        name: "execution_backup",
        template: "execution"
      },
      { name: "verifier", template: "general" }
    );
    orchestration.routes.review = [{ target: "main", kind: "strong" }];
    orchestration.routes.execution_backup = [{ target: "finish", kind: "weak" }];
    orchestration.routes.verifier = [{ target: "main", kind: "strong" }];
    orchestration.decisionPlans.execution_backup = defaultDecisionPlan("execution_backup");
    orchestration.decisionPlans.verifier = defaultDecisionPlan("verifier");
    orchestration.input.target = "verifier";
    orchestration.termination.agent = "execution_backup";
    orchestration.termination.condition = "the execution evidence is complete";

    const parsed = agentOrchestrationTemplateSchema.parse(orchestration);
    expect(parsed.routes.main.map((edge) => edge.target)).toEqual([
      "idea",
      "execution",
      "writing",
      "review",
      "execution_backup",
      "verifier"
    ]);
    const agents = mergeAgentConfigs(undefined, parsed);
    expect(agents.execution_backup.model).toBe(agents.execution.model);
    expect(agents.execution_backup.instructions).toBe(
      agents.execution.instructions
    );
    expect(agents.verifier.instructions).toContain("ordinary Worker");

    const duplicateName = structuredClone(parsed);
    duplicateName.agents.push({
      name: "verifier",
      template: "general"
    });
    expect(() => agentOrchestrationTemplateSchema.parse(duplicateName)).toThrow(
      "Agent name 不能重复"
    );

    const mainVariant = structuredClone(parsed);
    mainVariant.agents.push({ name: "Main", template: "general" });
    mainVariant.routes.Main = [{ target: "main", kind: "strong" }];
    mainVariant.decisionPlans.Main = defaultDecisionPlan("Main");
    expect(agentOrchestrationTemplateSchema.parse(mainVariant).agents.at(-1)).toEqual({
      name: "Main",
      template: "general"
    });
  });

  it("trims and bounds Agent role descriptions at the server boundary", () => {
    const orchestration = structuredClone(DEFAULT_AGENT_ORCHESTRATION_TEMPLATE);
    orchestration.agents[1] = {
      ...orchestration.agents[1]!,
      description: "  研究问题与假设  "
    };
    const parsed = agentOrchestrationTemplateSchema.parse(orchestration);
    expect(parsed.agents[1]?.description).toBe("研究问题与假设");

    const tooLong = structuredClone(orchestration);
    tooLong.agents[1] = { ...tooLong.agents[1]!, description: "x".repeat(181) };
    expect(() => agentOrchestrationTemplateSchema.parse(tooLong)).toThrow();

    const canonical = canonicalizeMainRoutes({
      ...tooLong,
      agents: tooLong.agents.map((entry) =>
        entry.name === "idea" ? { ...entry, description: `  ${"x".repeat(240)}  ` } : entry
      )
    });
    expect(canonical.agents.find((entry) => entry.name === "idea")?.description).toBe("x".repeat(180));
  });

  it("requires explicit routes and rejects self-loops", () => {
    const orchestration = structuredClone(DEFAULT_AGENT_ORCHESTRATION_TEMPLATE);
    orchestration.routes.execution = [
      { target: "writing", kind: "weak" },
      { target: "review", kind: "weak" }
    ];
    expect(agentOrchestrationTemplateSchema.parse(orchestration)).toEqual(
      orchestration
    );
    const selfLoop = structuredClone(orchestration);
    selfLoop.routes.execution = [{ target: "execution", kind: "strong" }];
    expect(() => agentOrchestrationTemplateSchema.parse(selfLoop)).toThrow(
      "出边不能指向自身"
    );
  });

  it("validates bounded loop groups and rejects ambiguous or overlapping cycles", () => {
    const loopWorkflow = {
      agents: ["main", "measure", "assess", "revise"].map((name) => ({ name })),
      input: { source: "input" as const, target: "measure" },
      routes: {
        main: [],
        measure: [{ target: "assess", kind: "strong" as const }],
        assess: [{ target: "revise", kind: "strong" as const }],
        revise: [{ target: "measure", kind: "strong" as const }]
      },
      loops: [{ id: "refinement", from: "assess", to: "revise", maxIterations: 2, exitTo: "main" }],
      decisionPlans: Object.fromEntries(
        ["main", "measure", "assess", "revise"].map((name) => [name, "Follow the verified route."])
      ),
      allowUserIntervention: true,
      allowMainReconfiguration: true,
      termination: {
        agent: "main",
        condition: "Main accepts the measured result.",
        decisionBy: "main" as const,
        automatic: false
      }
    };
    expect(agentOrchestrationTemplateSchema.parse(loopWorkflow).loops)
      .toEqual(loopWorkflow.loops);

    for (const patch of [
      { maxIterations: 0 },
      { maxIterations: 1.5 },
      { from: "main" },
      { to: "missing" },
      { exitTo: "revise" },
      { id: "" }
    ]) {
      const invalid = structuredClone(loopWorkflow);
      Object.assign(invalid.loops[0], patch);
      expect(() => agentOrchestrationTemplateSchema.parse(invalid)).toThrow();
    }

    const duplicate = structuredClone(loopWorkflow);
    duplicate.loops.push({ ...duplicate.loops[0], id: "duplicate" });
    expect(() => agentOrchestrationTemplateSchema.parse(duplicate)).toThrow(/one loop|share Agents/);

    const broken = structuredClone(loopWorkflow);
    broken.routes.revise = [{ target: "main", kind: "strong" }];
    expect(() => agentOrchestrationTemplateSchema.parse(broken)).toThrow(/route back/);
  });

  it("normalizes optional result format intent without imposing a file schema", () => {
    const orchestration = structuredClone(DEFAULT_AGENT_ORCHESTRATION_TEMPLATE);
    delete orchestration.resultFormat;
    const legacy = agentOrchestrationTemplateSchema.parse(orchestration);
    expect(legacy.resultFormat).toEqual({ presets: [], custom: "" });
    expect(agentOrchestrationTemplateSchema.parse({ ...orchestration, resultFormat: null }).resultFormat).toEqual({ presets: [], custom: "" });

    const parsed = agentOrchestrationTemplateSchema.parse({
      ...orchestration,
      resultFormat: {
        presets: ["论文", "表格", "论文", "  Markdown 文件  ", "HTML 文件"],
        custom: "  以便审阅和继续编辑的结构交付。  "
      }
    });
    expect(parsed.resultFormat).toEqual({
      presets: ["论文", "表格", "Markdown 文件", "HTML 文件"],
      custom: "以便审阅和继续编辑的结构交付。"
    });

    const noDeliverable = agentOrchestrationTemplateSchema.parse({
      ...orchestration,
      resultFormat: { presets: [], custom: "", none: true }
    });
    expect(noDeliverable.resultFormat).toEqual({ presets: [], custom: "", none: true });
  });

  it("validates and trims project explainer questions", () => {
    expect(
      projectExplainerQuestionSchema.parse({
        question: "  解释当前实验进度。  "
      })
    ).toEqual({ question: "解释当前实验进度。" });
    expect(() =>
      projectExplainerQuestionSchema.parse({ question: "   " })
    ).toThrow();
  });

  it("accepts one natural-language handoff and rejects legacy result objects", () => {
    const handoff = "## Result\nThe workspace was inspected and the evidence path is recorded.";
    expect(naturalLanguageHandoffSchema.parse(handoff)).toBe(handoff);
    expect(() => naturalLanguageHandoffSchema.parse({ summary: "legacy" })).toThrow();
    expect(() => naturalLanguageHandoffSchema.parse("   ")).toThrow();
  });

  it("uses gpt-5.6-sol with Provider-default reasoning for every agent", () => {
    const agents = mergeAgentConfigs(undefined);

    for (const role of AGENT_NAMES) {
      expect(agents[role].model).toBe(DEFAULT_AGENT_MODEL);
      expect(agents[role]).not.toHaveProperty("reasoningEffort");
      expect(agents[role]).not.toHaveProperty("gatewayReasoningOption");
      expect(agents[role].instructions).toBe(BUILTIN_AGENT_PROMPTS[role].trim());
      expect(agents[role].autoSkills).toEqual([]);
      expect(agents[role].mcpServers).toEqual([]);
    }
    expect(agents.main.skills).toEqual([
      "builtin:awesome-ai-research-writing-director"
    ]);
    expect(agents.main.permission).toBe("yolo");
    expect(agents.execution.permission).toBe("compute");
    expect(agents.idea.permission).toBe("workspace");
    expect(agents.writing.permission).toBe("workspace");
    expect(agents.review.permission).toBe("workspace");
    expect(agents.execution.skills).toEqual([
      "builtin:nature-figure"
    ]);
    expect(agents.idea.skills).toEqual([
      "builtin:ccf-idea-optimizer",
      "builtin:ccf-idea-reviewer",
      "builtin:ccf-literature-monitor",
      "builtin:ccf-literature-searcher",
      "builtin:ccf-experiment-designer"
    ]);
    expect(agents.writing.skills).toEqual([
      "builtin:ccf-paper-writer",
      "builtin:ccf-visual-composer",
      "builtin:ccf-paper-to-exemplar",
      "builtin:nature-writing",
      "builtin:nature-polishing"
    ]);
    expect(agents.review.skills).toEqual(["builtin:ccf-paper-reviewer"]);
  });

  it("reads but does not retain a legacy per-agent Harness reasoning override", () => {
    const agents = mergeAgentConfigs({
      execution: {
        model: "gpt-5.6-terra",
        reasoningEffort: "xhigh"
      }
    });

    expect(agents.execution.model).toBe("gpt-5.6-terra");
    expect(agents.execution).not.toHaveProperty("reasoningEffort");
    expect(agents.execution).not.toHaveProperty("gatewayReasoningOption");
    expect(agents.idea.model).toBe(DEFAULT_AGENT_MODEL);
    expect(agents.idea).not.toHaveProperty("reasoningEffort");
  });

  it("removes known legacy gateway fields while restoring persisted runtime state", () => {
    const gatewayId = "gwy_aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const legacy = structuredClone(mergeAgentConfigs(undefined)) as unknown as Record<string, Record<string, unknown>>;
    legacy.main.protocol = "responses";
    legacy.main.gatewayId = gatewayId;
    legacy.main.gatewaySnapshot = {
      id: gatewayId,
      name: "Legacy gateway snapshot",
      url: "https://gateway.example.com/v1",
      apiKey: "server-only",
      models: [DEFAULT_AGENT_MODEL],
      defaultModel: DEFAULT_AGENT_MODEL,
      protocols: ["responses"],
      deliveryMode: "buffered-json",
      allowPrivateNetwork: true,
      testedAt: "2026-09-10T00:00:00.000Z"
    };

    const restored = mergeAgentConfigs(
      legacy as never,
      DEFAULT_AGENT_ORCHESTRATION_TEMPLATE,
      { restoreRuntimeState: true }
    );
    expect(restored.main).not.toHaveProperty("protocol");
    expect(restored.main.gatewaySnapshot).toMatchObject({
      id: gatewayId,
      protocol: "responses",
      apiKey: "server-only",
      deliveryMode: "buffered-json"
    });
    expect(restored.main.gatewaySnapshot).not.toHaveProperty("protocols");
    expect(restored.main.gatewaySnapshot).not.toHaveProperty("allowPrivateNetwork");

    const exactLegacyReasoning = structuredClone(legacy);
    exactLegacyReasoning.main.reasoningEffort = "high";
    (exactLegacyReasoning.main.gatewaySnapshot as Record<string, unknown>).modelReasoning = {
      [DEFAULT_AGENT_MODEL]: {
        parameter: "reasoning.effort",
        options: [{ id: "provider-high", label: "Provider High", value: "high" }]
      }
    };
    const migrated = mergeAgentConfigs(
      exactLegacyReasoning as never,
      DEFAULT_AGENT_ORCHESTRATION_TEMPLATE,
      { restoreRuntimeState: true }
    );
    expect(migrated.main.gatewayReasoningOption).toBe("provider-high");
    expect(migrated.main.gatewaySnapshot?.reasoning).toMatchObject({
      parameter: "reasoning.effort",
      optionId: "provider-high",
      value: "high",
      fingerprint: expect.stringMatching(/^[a-f0-9]{64}$/)
    });
    expect(migrated.main).not.toHaveProperty("reasoningEffort");

    const ambiguousLegacyReasoning = structuredClone(exactLegacyReasoning);
    (ambiguousLegacyReasoning.main.gatewaySnapshot as Record<string, any>)
      .modelReasoning[DEFAULT_AGENT_MODEL].options.push({
        id: "also-high",
        label: "Also High",
        value: "high"
      });
    const providerDefault = mergeAgentConfigs(
      ambiguousLegacyReasoning as never,
      DEFAULT_AGENT_ORCHESTRATION_TEMPLATE,
      { restoreRuntimeState: true }
    );
    expect(providerDefault.main).not.toHaveProperty("gatewayReasoningOption");
    expect(providerDefault.main.gatewaySnapshot).not.toHaveProperty("reasoning");
    expect(providerDefault.main.reasoningMigrationWarning).toContain("匹配到多个");

    const restartedProviderDefault = mergeAgentConfigs(
      providerDefault as never,
      DEFAULT_AGENT_ORCHESTRATION_TEMPLATE,
      { restoreRuntimeState: true }
    );
    expect(restartedProviderDefault.main.reasoningMigrationWarning).toBe(
      providerDefault.main.reasoningMigrationWarning
    );
    expect(restartedProviderDefault.main.gatewaySnapshot?.reasoningMigrationWarning).toBe(
      providerDefault.main.reasoningMigrationWarning
    );
    expect(restartedProviderDefault.main).not.toHaveProperty("legacyReasoningEffort");

    const privateSnapshot = structuredClone(legacy);
    (privateSnapshot.main.gatewaySnapshot as Record<string, unknown>).url = "http://127.0.0.1:4310/v1";
    expect(() => mergeAgentConfigs(
      privateSnapshot as never,
      DEFAULT_AGENT_ORCHESTRATION_TEMPLATE,
      { restoreRuntimeState: true }
    )).toThrow(/HTTPS/);

    expect(() => createProjectSchema.parse({
      title: "Reject Agent protocol",
      requirement: "Agent protocol is derived from the selected gateway.",
      agents: { main: { protocol: "responses" } }
    })).toThrow("Unrecognized key(s) in object: 'protocol'");
    expect(() => createProjectSchema.parse({
      title: "Reject derived reasoning warning",
      requirement: "Reasoning migration warnings are server-derived.",
      agents: { main: { reasoningMigrationWarning: "not writable" } }
    })).toThrow("Unrecognized key(s) in object: 'reasoningMigrationWarning'");
  });

  it("replaces latex-writer without overriding the user's skill modes", () => {
    const agents = mergeAgentConfigs({
      writing: {
        skills: [],
        autoSkills: ["builtin:nature-writing", "builtin:latex-writer"]
      }
    });

    expect(agents.writing.skills).toEqual([]);
    expect(agents.writing.autoSkills).toEqual([
      "builtin:nature-writing",
      "builtin:latex-writer"
    ]);
  });

  it("does not add role-specific skills that the user did not select", () => {
    const agents = mergeAgentConfigs({
      main: {
        skills: ["builtin:research-director"],
        autoSkills: [
          "builtin:awesome-ai-research-writing-director",
          "builtin:nature-figure"
        ]
      }
    });

    expect(agents.main.skills).toEqual([
      "builtin:research-director"
    ]);
    expect(agents.main.autoSkills).toEqual([
      "builtin:awesome-ai-research-writing-director",
      "builtin:nature-figure"
    ]);
    expect(agents.writing.skills).not.toContain(
      "builtin:awesome-ai-research-writing-director"
    );
  });

  it("allows default skills to be removed entirely", () => {
    const agents = mergeAgentConfigs({
      idea: { skills: [], autoSkills: [] },
      main: { skills: [], autoSkills: [] },
      writing: { skills: [], autoSkills: [] },
      review: { skills: [], autoSkills: [] }
    });

    expect(agents.idea.skills).toEqual([]);
    expect(agents.main.skills).toEqual([]);
    expect(agents.writing.skills).toEqual([]);
    expect(agents.review.skills).toEqual([]);
  });

  it("validates non-empty project-level model updates for dynamic Agent names", () => {
    expect(
      updateAgentModelsSchema.parse({
        models: {
          main: "  gpt-5.6-terra  ",
          execution: "gpt-5.6-sol"
        }
      })
    ).toEqual({
      models: {
        main: "gpt-5.6-terra",
        execution: "gpt-5.6-sol"
      }
    });
    expect(() => updateAgentModelsSchema.parse({ models: {} })).toThrow();
    expect(() =>
      updateAgentModelsSchema.parse({ models: { execution: "" } })
    ).toThrow();
    expect(
      updateAgentModelsSchema.parse({ models: { verifier: "model" } })
    ).toEqual({ models: { verifier: "model" } });
    expect(() =>
      updateAgentModelsSchema.parse({ models: { finish: "model" } })
    ).toThrow();
  });

  it("accepts partial runtime configuration updates", () => {
    expect(updateAgentConfigsSchema.parse({
      agents: { execution: { gatewayReasoningOption: "provider-high" } }
    })).toEqual({
      agents: { execution: { gatewayReasoningOption: "provider-high" } }
    });
    expect(updateAgentConfigsSchema.parse({
      agents: { execution: { gatewayReasoningOption: null } }
    })).toEqual({
      agents: { execution: { gatewayReasoningOption: null } }
    });
    expect(() => updateAgentConfigsSchema.parse({
      agents: { execution: { gatewayReasoningOption: "invalid option" } }
    })).toThrow();
    expect(() => updateAgentConfigsSchema.parse({
      agents: {
        execution: {
          model: "  gpt-5.6-terra  ",
          reasoningEffort: "xhigh"
        }
      }
    })).toThrow(/reasoningEffort/);
    expect(
      updateAgentConfigsSchema.parse({
        agents: { execution: { model: "gpt-5.6-terra" } }
      })
    ).toEqual({ agents: { execution: { model: "gpt-5.6-terra" } } });
    expect(() => updateAgentConfigsSchema.parse({
      agents: { execution: { reasoningEffort: "high" } }
    })).toThrow(/reasoningEffort/);
    expect(
      updateAgentConfigsSchema.parse({
        agents: {
          execution: {
            instructions: "  Custom execution prompt  ",
            skills: ["builtin:experiment-runner"],
            autoSkills: ["builtin:nature-figure"]
          }
        }
      })
    ).toEqual({
      agents: {
        execution: {
          instructions: "Custom execution prompt",
          skills: ["builtin:experiment-runner"],
          autoSkills: ["builtin:nature-figure"]
        }
      }
    });
    expect(
      updateAgentConfigsSchema.parse({
        agents: {
          main: {
            permission: "compute",
            webSearch: true
          },
          execution: { permission: "yolo" }
        }
      })
    ).toEqual({
      agents: {
        main: {
          permission: "compute",
          webSearch: true
        },
        execution: { permission: "yolo" }
      }
    });
    expect(() =>
      updateAgentConfigsSchema.parse({
        agents: { main: { permission: "standard" } }
      })
    ).toThrow();
    expect(() =>
      updateAgentConfigsSchema.parse({
        agents: { main: { sandbox: "workspace-write" } }
      })
    ).toThrow("Unrecognized key(s) in object: 'sandbox'");
  });

  it("accepts only unique streamable HTTP MCP servers per agent", () => {
    expect(
      updateAgentConfigsSchema.parse({
        agents: {
          main: {
            mcpServers: [
              {
                name: "  research-docs  ",
                url: "  https://docs.example.test/mcp  "
              }
            ]
          }
        }
      })
    ).toEqual({
      agents: {
        main: {
          mcpServers: [
            { name: "research-docs", url: "https://docs.example.test/mcp" }
          ]
        }
      }
    });

    expect(() =>
      updateAgentConfigsSchema.parse({
        agents: {
          main: {
            mcpServers: [{ name: "local", url: "file:///tmp/mcp" }]
          }
        }
      })
    ).toThrow();
    expect(() =>
      updateAgentConfigsSchema.parse({
        agents: {
          main: {
            mcpServers: [
              { name: "Docs", url: "https://one.example/mcp" },
              { name: "docs", url: "https://two.example/mcp" }
            ]
          }
        }
      })
    ).toThrow();
  });

  it("backfills an empty MCP list for persisted projects created before MCP support", () => {
    const agents = mergeAgentConfigs(undefined);
    delete (agents.idea as Partial<typeof agents.idea>).mcpServers;

    expect(ensureAgentConfigInvariants(agents)).toBe(true);
    expect(agents.idea.mcpServers).toEqual([]);
  });

});

describe("Codex output schemas", () => {
  it("requires every property at every strict-schema object level", async () => {
    const schemaFiles = [
      "main-decision.json",
      "worker-result.json"
    ];
    for (const fileName of schemaFiles) {
      const schema = JSON.parse(
        await fs.readFile(
          new URL(`../../resources/main-runtime/schemas/${fileName}`, import.meta.url),
          "utf8"
        )
      ) as Record<string, unknown>;
      assertStrictSchemaRequiredProperties(schema, fileName, "#");
    }
  });

  it("keeps output schemas within the provider structured-output subset", async () => {
    for (const fileName of ["main-decision.json", "worker-result.json"]) {
      const schema = JSON.parse(
        await fs.readFile(
          new URL(`../../resources/main-runtime/schemas/${fileName}`, import.meta.url),
          "utf8"
        )
      ) as Record<string, unknown>;
      expect(findSchemaKeyword(schema, "allOf"), fileName).toBe(false);
    }
  });
});

function assertStrictSchemaRequiredProperties(
  schema: Record<string, unknown>,
  fileName: string,
  location: string
): void {
  const properties = schema.properties;
  if (properties && typeof properties === "object") {
    const propertyNames = Object.keys(properties);
    const required = Array.isArray(schema.required)
      ? schema.required.filter((value): value is string => typeof value === "string")
      : [];
    expect(new Set(required), `${fileName}${location} every property must be required`).toEqual(
      new Set(propertyNames)
    );
    for (const [name, child] of Object.entries(
      properties as Record<string, unknown>
    )) {
      if (child && typeof child === "object") {
        assertStrictSchemaRequiredProperties(
          child as Record<string, unknown>,
          fileName,
          `${location}.properties.${name}`
        );
      }
    }
  }
  for (const key of ["items", "additionalProperties", "contains"]) {
    const child = schema[key];
    if (child && typeof child === "object") {
      assertStrictSchemaRequiredProperties(
        child as Record<string, unknown>,
        fileName,
        `${location}.${key}`
      );
    }
  }
  for (const key of ["anyOf", "oneOf", "allOf"]) {
    const children = schema[key];
    if (Array.isArray(children)) {
      children.forEach((child, index) => {
        if (child && typeof child === "object") {
          assertStrictSchemaRequiredProperties(
            child as Record<string, unknown>,
            fileName,
            `${location}.${key}[${index}]`
          );
        }
      });
    }
  }
}

function findSchemaKeyword(value: unknown, keyword: string): boolean {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((item) => findSchemaKeyword(item, keyword));
  const record = value as Record<string, unknown>;
  if (keyword in record) return true;
  return Object.values(record).some((child) => findSchemaKeyword(child, keyword));
}
