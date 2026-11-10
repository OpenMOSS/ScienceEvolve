import { describe, expect, it } from "vitest";
import {
  buildAgentDispatchSummary,
  buildInboxMarkdown,
  buildMainInvocationContext,
  BUILTIN_AGENT_PROMPTS,
  MAIN_SYSTEM_PROMPT,
  workerHandoffMarkdown
} from "../../src/core/prompt.js";
import { cloneAgentOrchestrationTemplate } from "../../src/core/agent-orchestration.js";
import { mergeAgentConfigs } from "../../src/core/validation.js";
import {
  MAIN_AGENT_NAME,
  type AgentName,
  type ProjectState,
  type TokenUsageTotals
} from "../../src/core/types.js";
import { MAIN_ORCHESTRATION_POLICY } from "../../src/core/internal/shared/main-orchestration-policy.js";

function emptyTokenTotals(): TokenUsageTotals {
  return {
    inputTokens: 0,
    cachedInputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    invocations: 0
  };
}

function projectState(): ProjectState {
  const orchestration = cloneAgentOrchestrationTemplate();
  const agents = mergeAgentConfigs(undefined, orchestration);
  const byAgent = Object.fromEntries(
    orchestration.agents.map((entry) => entry.name).map(
      (agent) => [agent, emptyTokenTotals()]
    )
  ) as Record<AgentName, TokenUsageTotals>;
  return {
    id: "prj_00000000000000000000000000000000",
    title: "Prompt contract",
    requirement: "Run a bounded evidence audit.",
    status: "paused",
    phase: "user-intervention-required",
    createdAt: "2026-08-04T00:00:00.000Z",
    updatedAt: "2026-08-04T00:00:00.000Z",
    turn: 1,
    cycle: 1,
    eventSeq: 1,
    consecutiveFailures: 0,
    completionGeneration: 0,
    runCounts: Object.fromEntries(
      orchestration.agents.map((entry) => entry.name).map(
        (agent) => [agent, 0]
      )
    ),
    mainInvocationSeq: 1,
    agents,
    orchestration,
    userInputs: [],
    tokenUsage: { ...emptyTokenTotals(), byAgent },
    computeUsage: {
      source: "inspire",
      totalCardHours: 0,
      byAccelerator: [],
      workloadCount: 0,
      activeWorkloadCount: 0,
      workloads: []
    }
  };
}

describe("Agent prompt contracts", () => {
  it("gives every user-facing template the ordinary Worker handoff contract", () => {
    for (const template of ["general", "main", "idea", "execution", "writing", "review"] as const) {
      if (template === "main") {
        expect(BUILTIN_AGENT_PROMPTS[template]).toContain("structured routing decision");
      } else {
        expect(BUILTIN_AGENT_PROMPTS[template]).toContain("Use native file tools");
        expect(BUILTIN_AGENT_PROMPTS[template]).toContain("ordinary Worker");
      }
      expect(BUILTIN_AGENT_PROMPTS[template]).not.toContain("score >= 6");
      if (template !== "main") expect(BUILTIN_AGENT_PROMPTS[template]).toContain("Memory.md");
    }
    expect(BUILTIN_AGENT_PROMPTS.review).toContain("natural language");
  });

  it("keeps the fixed Main prompt policy-focused and separate from project requirements", () => {
    expect(MAIN_SYSTEM_PROMPT).toContain("public main agent");
    expect(MAIN_SYSTEM_PROMPT).toContain("Use message as the only natural-language");
    expect(MAIN_SYSTEM_PROMPT.split(MAIN_ORCHESTRATION_POLICY)).toHaveLength(2);
    expect(MAIN_SYSTEM_PROMPT).toContain("Never invent a route target or bypass product state");
    expect(MAIN_SYSTEM_PROMPT).toContain("Change future Agents or topology only through apply_workflow");
    expect(MAIN_SYSTEM_PROMPT).toContain("handoff as an index to evidence, not proof");
    expect(MAIN_SYSTEM_PROMPT).toContain("never repeat the same failed assignment unchanged");
    expect(MAIN_SYSTEM_PROMPT).toContain("never creates User authorization");
    expect(MAIN_SYSTEM_PROMPT).toContain("absolute path inside the project workspace");
    expect(MAIN_SYSTEM_PROMPT).toContain("re-read the target file's current contents");
    expect(MAIN_SYSTEM_PROMPT).toContain("generate a new patch");
    expect(MAIN_SYSTEM_PROMPT).toContain("route assignment is model-authored task scope");
    expect(MAIN_SYSTEM_PROMPT).toContain("Never negate or alter a source fact");
    expect(MAIN_SYSTEM_PROMPT).toContain("artifactCatalog and MainInvocationContext.currentDisplay");
    expect(MAIN_SYSTEM_PROMPT).toContain("Never claim that publication or display selection succeeded");
    expect(MAIN_SYSTEM_PROMPT).toContain("reconcile every material contradiction within and across them");
    expect(MAIN_SYSTEM_PROMPT).toContain("Never ask an Agent to append a replacement full document");
    expect(MAIN_SYSTEM_PROMPT).not.toContain("hidden system Controller");
    expect(MAIN_SYSTEM_PROMPT).not.toContain("score >= 6");
  });

  it("delivers the initial user requirement without the old Inbox background or duplicated Agent configuration", () => {
    const state = projectState();
    const inbox = buildInboxMarkdown(state, "idea", "inv_first", "HISTORY_INDEX_SENTINEL", ["SKILL_PATH_SENTINEL"], []);
    expect(inbox).toBe(`来源：user\n内容：${state.requirement}`);
    expect(inbox).not.toContain("HISTORY_INDEX_SENTINEL");
    expect(inbox).not.toContain("SKILL_PATH_SENTINEL");
    expect(inbox).not.toContain(state.agents.idea.instructions);
  });

  it("passes HTML delivery intent through the existing Main invocation context", () => {
    const state = projectState();
    state.orchestration.resultFormat = { presets: ["HTML 文件", "Markdown 文件"], custom: "保留交互图表" };
    const context = buildMainInvocationContext(state);
    expect(context.resultFormat).toContain("期望结果形式：HTML 文件、Markdown 文件。");
    expect(context.resultFormat).toContain("补充交付要求：保留交互图表");
    state.orchestration.resultFormat = { presets: [], custom: "", none: true };
    expect(buildMainInvocationContext(state).resultFormat).not.toContain("HTML 文件");
  });

  it("preserves the complete Main assignment and acceptance, without forwarding global user updates to a Worker", () => {
    const state = projectState();
    const assignment = "Keep the exact dataset, output file result.md, and every exclusion rule. ".repeat(150);
    state.latestAssignment = { target: "idea", message: assignment, successCriteria: ["A=27", "B=31", "Units are seconds"], rationale: "HISTORICAL_REASON", invocationId: "main-source", updatedAt: state.updatedAt };
    const update = { id: "update", message: "MAIN_ONLY_USER_UPDATE", status: "pending", targetMainInvocation: 2, createdAt: state.updatedAt } as const;
    const inbox = buildInboxMarkdown(state, "idea", "inv_worker", "OLD_CONTEXT", [], [], [update]);
    expect(inbox).toContain(`来源：main\n内容：${assignment}`);
    for (const criterion of state.latestAssignment.successCriteria) expect(inbox).toContain(criterion);
    for (const background of [state.requirement, "MAIN_ONLY_USER_UPDATE", "HISTORICAL_REASON", "OLD_CONTEXT"]) expect(inbox).not.toContain(background);
  });

  it("delivers the Worker result body directly to Main with new user requirements", () => {
    const state = projectState();
    const body = "Verified result and evidence path results/final.md. ".repeat(200);
    state.latestHandoff = { agent: "idea", invocationId: "source", body, markdown: "ENVELOPE_SENTINEL", excerpt: "SUMMARY_SENTINEL", updatedAt: state.updatedAt };
    state.pendingMainDecision = { sourceAgent: "idea", sourceInvocationId: "source", requestedAt: state.updatedAt, decisionPlan: "HISTORICAL_DECISION_PLAN" };
    const input = { id: "update", message: "Preserve the original sample count and add confidence intervals.", status: "pending", targetMainInvocation: 2, createdAt: state.updatedAt } as const;
    const inbox = buildInboxMarkdown(state, "main", "inv_main", "OLD_HISTORY", [], [], [input]);
    expect(inbox).toBe(`来源：idea\n内容：${body}\n\n来源：user\n内容：${input.message}`);
    expect(inbox).not.toContain("SENTINEL");
  });

  it("passes a strong predecessor's complete result to its successor without repeating the initial user request", () => {
    const state = projectState();
    state.orchestration.routes.idea = [{ target: "writing", kind: "strong" }];
    const body = "Use analysis/result.md with A=27, B=31 and seconds. ".repeat(200);
    state.latestHandoff = { agent: "idea", invocationId: "source", body, markdown: "ARCHIVE_ENVELOPE", excerpt: "SUMMARY", updatedAt: state.updatedAt };
    expect(buildInboxMarkdown(state, "writing", "next", "HISTORY", [], []))
      .toBe(`来源：idea\n内容：${body}`);
  });

  it("resumes Main with the complete current user message instead of replaying the initial project request", () => {
    const state = projectState();
    state.runCounts.main = 2;
    state.inputDescription = "OLD_INPUT_DESCRIPTION";
    const input = { id: "reopen", message: "Verify the existing final result; do not repeat completed writes. ".repeat(200),
      status: "pending", targetMainInvocation: 3, createdAt: state.updatedAt } as const;
    expect(buildInboxMarkdown(state, "main", "reopened", "OLD_HISTORY", [], [], [input]))
      .toBe(`来源：user\n内容：${input.message}`);
  });

  it("renders Worker handoffs as durable evidence for Main", () => {
    const state = projectState();
    const markdown = workerHandoffMarkdown(
      state,
      "review",
      "inv_review",
      "## Result\nThe bounded audit completed.\n\n## Evidence\nThe project record was inspected.\n\n## Risks and Unresolved Issues\nNo unresolved blocker is known.\n\nRecommendation: Main should select the next route."
    );
    expect(markdown).toContain("# review handoff");
    expect(markdown).toContain("## Result");
    expect(markdown).toContain("## Evidence");
    expect(markdown).toContain("## Risks and Unresolved Issues");
    expect(markdown).toContain("Recommendation: Main should select the next route.");
    expect(markdown).toContain("Risks and Unresolved Issues");
  });
});
