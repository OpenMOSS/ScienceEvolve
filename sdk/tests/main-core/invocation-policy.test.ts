import { describe, expect, it } from "vitest";
import {
  assertInvocationPolicySupported,
  compileInvocationPolicy,
  compileWorkflowPrompt,
  sessionRecoveryNote
} from "../../src/core/harness-runtime/invocation-policy.js";
import { BUILTIN_HARNESS_DESCRIPTORS } from "../../src/core/harness-runtime/registry.js";
import type { AgentRunRequest } from "../../src/core/types.js";

describe("invocation policy", () => {
  it.each(["main", "worker", "leader"] as const)("sends %s only the project entry, current communication and configured instructions", role => {
    const config = { instructions: "Exact configured Agent instructions", mcpServers: [], webSearch: false } as AgentRunRequest["project"]["agents"][string];
    const request = { agent: role, kind: role === "main" ? "main" : "worker", permission: "workspace", skillPaths: [],
      project: { requirement: "UNREQUESTED_GLOBAL_REQUIREMENT", inputDescription: "UNREQUESTED_INPUT_NOTE", agents: { [role]: config },
        orchestration: { allowUserIntervention: false, termination: { condition: "UNREQUESTED_TERMINATION" } } } } as unknown as AgentRunRequest;
    const inputs = { projectPath: "/project", workspacePath: "/workspace", inboxPath: "/inputs/inbox", memoryPath: "/workspace/Memory.md", runtimePath: "/runtime", inboxSha256: "fixture",
      workflowContext: { preview: "UNREQUESTED_WORKFLOW_PREVIEW" }, contextIndex: { preview: "UNREQUESTED_HISTORY_PREVIEW" } } as any;
    const task = "来源：analysis\n内容：Preserve samples A=27 and B=31.\n\n来源：charts\n内容：Use seconds and clean-data.png.";
    const policy = compileInvocationPolicy(config, request);
    const prompt = compileWorkflowPrompt(request, inputs, policy, { inlineInbox: task });
    expect(prompt).toContain(`项目入口：/project\n\n本轮直接消息：\n${task}`);
    expect(prompt).toContain(config.instructions);
    expect(prompt.split(task)).toHaveLength(2);
    expect(prompt).not.toContain("UNREQUESTED_");
    expect(prompt).not.toContain("Current role and execution stage");
    expect(policy.constraintPrompt).toContain("Shell");
  });
  it.each(["workspace", "compute", "yolo"] as const)("worktree closing removes %s business capabilities and names only the exact closing scope", permission => {
    const config = { instructions: "Implement my whole business mandate", experimentMcp: true,
      mcpServers: [{ name: "business", url: "https://example.invalid/mcp" }], webSearch: true, reasoningEffort: "high" } as AgentRunRequest["project"]["agents"][string];
    const original = structuredClone(config);
    const worktreeClosing = { kind: "bound-report-memory" as const, reportHeadSha: "a".repeat(40), paths: ["agent-memory/worker/Memory.md"],
      executionId: "old", ownershipEpoch: 2, grantInvocationId: "leader", grantCallId: "explicit-close" };
    const request = { permission, worktreeClosing, agent: "worker", kind: "worker", skillPaths: ["/missing/SKILL.md"],
      autoSkillPaths: ["/missing/auto/SKILL.md"], siiMcp: { url: "http://127.0.0.1:12345/sii/forbidden" }, siiResumePrompt: "forbidden resume instruction",
      project: { agents: { worker: config }, git: { enabled: true } }, executionContext: { role: "delivery", executionId: "old" },
      control: { stagingPath: "/runtime/actions.json", capability: "server", stateVersion: 2, candidates: [], decisionBy: "agent",
        allowUserIntervention: false, canComplete: false, allowAgentGitActions: true, requireBridge: true, worktreeClosing } } as unknown as AgentRunRequest;
    const policy = compileInvocationPolicy(config, request);
    expect(policy).toMatchObject({ permission: "workspace", skillPaths: [], autoSkillPaths: [], mcpServers: [], webSearch: false });
    const prompt = compileWorkflowPrompt(request, { projectPath: "/project", workspacePath: "/worktree", inboxPath: "/runtime/inbox",
      memoryPath: "/worktree/agent-memory/worker/Memory.md", runtimePath: "/runtime", inboxSha256: "fixture" }, policy);
    expect(prompt).toContain("- wake reason: worktree-closing");
    expect(prompt).toContain(`Immutable original report A: ${worktreeClosing.reportHeadSha}`);
    expect(prompt).toContain(JSON.stringify(worktreeClosing.paths));
    expect(prompt).toContain("git_push with your own nonempty reason");
    expect(prompt).toContain("separate finish_task");
    expect(prompt).not.toContain("Implement my whole business mandate");
    expect(prompt).not.toContain("has business/delivery authority");
    expect(prompt).not.toContain("forbidden resume instruction");
    expect(prompt).not.toContain("run_experiment");
    expect(config).toEqual(original);
  });
  it("drops user-supplied SII endpoints and accepts only the trusted invocation binding", () => {
    const config = { mcpServers: [{ name: "ScienceEvolve-SII", url: "https://example.invalid/sii" },
      { name: "business", url: "https://example.invalid/mcp" }], webSearch: false } as AgentRunRequest["project"]["agents"][string];
    const request = { permission: "compute", skillPaths: [] } as AgentRunRequest;
    expect(compileInvocationPolicy(config, request).mcpServers).toEqual([{ name: "business", url: "https://example.invalid/mcp" }]);
    expect(compileInvocationPolicy(config, { ...request, siiMcp: { url: "http://127.0.0.1:12345/sii/task" } }).mcpServers)
      .toEqual([{ name: "business", url: "https://example.invalid/mcp" }, { name: "scienceevolve-sii", url: "http://127.0.0.1:12345/sii/task" }]);
  });
  it.each(["workspace", "compute", "yolo"] as const)("terminal push receipt overrides %s business capabilities without changing the Agent configuration", (permission) => {
    const config = { instructions: "Implement the whole business product and publish it", sessionPersistence: false,
      mcpServers: [{ name: "business", url: "https://example.invalid/mcp" }], webSearch: true, reasoningEffort: "high" } as AgentRunRequest["project"]["agents"][string];
    const original = structuredClone(config);
    const observation = { operationId: "original-push" };
    const request = { permission, terminalPushObservation: observation, skillPaths: ["/missing/SKILL.md"],
      autoSkillPaths: ["/missing/auto/SKILL.md"], agent: "worker", kind: "worker", taskSessionId: "completed-original",
      project: { agents: { worker: config }, git: { enabled: true }, pendingMainDecision: { reason: "old-business-error" } },
      executionContext: { role: "delivery", executionId: "completed-original" },
      control: { stagingPath: "/runtime/actions.json", capability: "server-only", stateVersion: 2, candidates: [],
        decisionBy: "agent", allowUserIntervention: false, canComplete: false, allowAgentGitActions: true,
        terminalPushObservation: observation, requireBridge: true } } as unknown as AgentRunRequest;
    const policy = compileInvocationPolicy(config, request);
    expect(policy).toMatchObject({ permission: "workspace", skillPaths: [], autoSkillPaths: [], mcpServers: [],
      webSearch: false, reasoningEffort: "high" });
    const prompt = compileWorkflowPrompt(request, { projectPath: "/fixture/project", workspacePath: "/fixture/workspace",
      inboxPath: "/runtime/inbox.md", memoryPath: "/fixture/workspace/agent-memory/worker/Memory.md", runtimePath: "/runtime", inboxSha256: "fixture" }, policy);
    expect(prompt).toContain("- wake reason: terminal-push-observation");
    expect(prompt).toContain("same persistent session");
    expect(prompt).toContain('operationId="original-push", historical=true');
    expect(prompt).toContain("provider returns its actual result directly to you");
    expect(prompt).toContain("finish_task for this supplement");
    expect(prompt).toContain("项目入口：/fixture/project");
    expect(policy.mcpServers).toEqual([]);
    expect(prompt).not.toContain("Implement the whole business product");
    expect(prompt).not.toContain("call git_push");
    expect(prompt).not.toContain("github_create_pr");
    expect(prompt).not.toContain("has business/delivery authority");
    expect(config).toEqual(original);
  });

  it("adds side-effect verification only to an actual Session continuation", () => {
    const note = sessionRecoveryNote("the native Session was replaced");
    expect(note).toContain("A missing tool response does not mean the operation did not run");
    expect(note).toContain("files, logs, published artifacts, handoff, checkpoint, and Memory.md");
    expect(note).toContain("repeat only the unfinished part");
    expect(note).toContain("Recovery reason: the native Session was replaced");
  });

  it.each(["workspace", "compute", "yolo"] as const)(
    "injects the common %s constraint and readable inputs",
    (permission) => {
      const config = {
        instructions: "fixture mandate",
        mcpServers: [],
        webSearch: false
      } as AgentRunRequest["project"]["agents"][string];
      const request = {
        permission,
        skillPaths: ["/fixture/SKILL.md"],
        autoSkillPaths: [],
        kind: "worker",
        agent: "worker",
        project: { agents: { worker: config } }
      } as AgentRunRequest;
      const policy = compileInvocationPolicy(config, request);
      const prompt = compileWorkflowPrompt(request, {
        projectPath: "/fixture/project",
        workspacePath: "/fixture/workspace",
        inboxPath: "/fixture/workspace/.scienceevolve/inbox/inv.md",
        memoryPath: "/fixture/workspace/Memory.md",
        userInputsPath: "/fixture/project/workspaces/user_inputs",
        runtimePath: "/fixture/runtime",
        inboxSha256: "fixture"
      }, policy);
      expect(policy.constraintPrompt).toContain(`permission mode: ${permission}`);
      expect(prompt).toContain("项目入口：/fixture/project");
      expect(prompt).not.toContain("Persistent project memory:");
      expect(prompt).not.toContain("/fixture/project/workspaces/user_inputs");
      expect(prompt).not.toContain("Session continuation safety");
    }
  );

  it.each(["codex", "dsh", "pi"])("allows configured Web Search for %s", (id) => {
    const harness = BUILTIN_HARNESS_DESCRIPTORS.find((item) => item.id === id)!;
    expect(() => assertInvocationPolicySupported(harness, {
      permission: "workspace",
      constraintPrompt: "fixture",
      skillPaths: [],
      autoSkillPaths: [],
      mcpServers: [],
      webSearch: true
    })).not.toThrow();
  });

  it.each(["main", "worker"] as const)("keeps normal %s capabilities while repairing a missing terminal action", (kind) => {
    const config = {
      instructions: "Inspect the whole repository and write a report.",
      mcpServers: [{ name: "external", url: "https://example.invalid/mcp" }],
      webSearch: true
    } as AgentRunRequest["project"]["agents"][string];
    const request = {
      permission: "compute",
      skillPaths: ["/fixture/selected/SKILL.md"],
      autoSkillPaths: ["/fixture/auto/SKILL.md"],
      availableSkillPaths: ["/fixture/available/SKILL.md"],
      kind,
      agent: "main",
      terminalControlRepair: { originalHandoff: "The analysis is complete" },
      project: { agents: { main: config } },
      control: {
        stagingPath: "/fixture/runtime/control-actions.json",
        capability: "fixture",
        stateVersion: 1,
        candidates: ["worker"],
        decisionBy: "main",
        allowUserIntervention: true,
        canComplete: true
      }
    } as AgentRunRequest;
    const policy = compileInvocationPolicy(config, request);
    const prompt = compileWorkflowPrompt(request, {
      projectPath: "/fixture/project",
      workspacePath: "/fixture/workspace",
      inboxPath: "/fixture/workspace/.scienceevolve/inbox/inv.md",
      memoryPath: "/fixture/workspace/Memory.md",
      runtimePath: "/fixture/runtime",
      inboxSha256: "fixture"
    }, policy, { inlineInbox: "large normal invocation context" });

    expect(policy).toMatchObject({
      skillPaths: ["/fixture/selected/SKILL.md"],
      autoSkillPaths: ["/fixture/auto/SKILL.md"],
      mcpServers: [{ name: "external", url: "https://example.invalid/mcp" }],
      webSearch: true
    });
    expect(prompt).toContain("Supply the missing formal completion/control action");
    expect(prompt).toContain("The analysis is complete");
    expect(prompt).toContain("large normal invocation context");
    expect(prompt).toContain(config.instructions);
    expect(prompt).not.toContain("context index");
    expect(policy.skillPaths).toEqual(["/fixture/selected/SKILL.md"]);
    expect(policy.webSearch).toBe(true);
  });
});
