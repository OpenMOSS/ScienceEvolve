import { MAIN_SYSTEM_PROMPT } from "../prompt.js";
import type { AgentConfig, AgentRunRequest } from "../types.js";
import type {
  HarnessDescriptor,
  InvocationInputs,
  InvocationPolicy
} from "./contracts.js";
import { HarnessRuntimeError } from "./errors.js";
import { resolvedMcpServers } from "../mcp-directory.js";
import { PERMISSION_PROMPTS } from "../internal/shared/agent-permission-prompts.js";
export { sessionRecoveryNote } from "../internal/shared/session-recovery.js";

export function compileInvocationPolicy(
  config: AgentConfig,
  request: Pick<AgentRunRequest,
    "permission" | "skillPaths" | "autoSkillPaths" | "control" | "executionContext" | "terminalPushObservation" | "terminalPushCoordination" | "worktreeClosing" | "siiMcp">
): InvocationPolicy {
  if (request.worktreeClosing) {
    return {
      permission: "workspace",
      constraintPrompt: "OpenFARS permission mode: workspace. This finite turn closes only the exact files in your original Leader's grant. Read evidence through the injected tools; write or remove only authorized regular files through the descriptor broker. Use the invocation-bound Git tools for necessary checkpoint/publication. Shell, native writes, independent Git, external MCP, experiments, Skills and Web Search are unavailable.",
      skillPaths: [], autoSkillPaths: [], mcpServers: [], webSearch: false,
      reasoningEffort: config.reasoningEffort
    };
  }
  if (request.terminalPushCoordination) {
    return {
      permission: "workspace",
      constraintPrompt: "OpenFARS permission mode: workspace. This invocation coordinates one assigned Agent receipt issue in the running workflow. Read its actual evidence, Inbox and persistent memory through the injected read tools. Submit only your own coordination decision, finish_task and memory through the assigned control tools. The system transports your decision; it must not perform another Agent's work or choose retry/escalation/user help for you.",
      skillPaths: [], autoSkillPaths: [], mcpServers: [], webSearch: false,
      reasoningEffort: config.reasoningEffort
    };
  }
  if (request.terminalPushObservation) {
    return {
      permission: "workspace",
      constraintPrompt: "OpenFARS permission mode: workspace. This is a completed-task historical push receipt turn. Read the original Inbox, persistent memory and workspace evidence through the injected read tools. Business files are read-only. Only the injected invocation-bound control tools may record this supplement's receipt and Agent-authored memory.",
      skillPaths: [], autoSkillPaths: [], mcpServers: [], webSearch: false,
      reasoningEffort: config.reasoningEffort
    };
  }
  return {
    permission: request.permission,
    constraintPrompt: PERMISSION_PROMPTS[request.permission],
    skillPaths: uniqueNonEmpty(request.skillPaths),
    autoSkillPaths: uniqueNonEmpty(request.autoSkillPaths ?? []),
    // Only the invocation-bound runtime may supply this built-in endpoint.
    mcpServers: resolvedMcpServers([...config.mcpServers.filter(server => server.name.trim().toLowerCase() !== "scienceevolve-sii"), ...(request.siiMcp ? [{ name: "scienceevolve-sii", url: request.siiMcp.url }] : [])]),
    webSearch: config.webSearch,
    reasoningEffort: config.reasoningEffort
  };
}

/** Reject configured features that the selected Adapter cannot actually expose. */
export function assertInvocationPolicySupported(
  descriptor: HarnessDescriptor,
  policy: InvocationPolicy
): void {
  const unsupported = [
    policy.webSearch && !descriptor.capabilities.webSearch ? "Web Search" : undefined,
    policy.skillPaths.length > 0 && !descriptor.capabilities.skills ? "Skills" : undefined,
    policy.autoSkillPaths.length > 0 && !descriptor.capabilities.autoSkills ? "Auto Skills" : undefined,
    policy.mcpServers.length > 0 && !descriptor.capabilities.mcp ? "MCP" : undefined,
    !descriptor.capabilities.permissionPrompts.includes(policy.permission)
      ? `${policy.permission} permission prompt`
      : undefined
  ].filter((item): item is string => Boolean(item));
  if (!unsupported.length) return;
  throw new HarnessRuntimeError(
    "HARNESS_CAPABILITY_UNSUPPORTED",
    `${descriptor.label} does not support the configured ${unsupported.join(", ")}`,
    { harnessId: descriptor.id, unsupported },
    { source: "policy" }
  );
}

export function compileWorkflowPrompt(
  request: AgentRunRequest,
  inputs: InvocationInputs,
  policy: InvocationPolicy,
  options: { inlineInbox?: string; recoveryNote?: string } = {}
): string {
  const mechanismTurn = Boolean(request.terminalPushObservation || request.terminalPushCoordination || request.worktreeClosing);
  const mandate = mechanismTurn ? "" : request.project.agents[request.agent].instructions;
  const task = options.inlineInbox ?? "";
  const recovery = [
    options.recoveryNote,
    request.terminalControlRepair
      ? `Supply the missing formal completion/control action after validating this original handoff:\n${request.terminalControlRepair.originalHandoff}`
      : undefined,
    !mechanismTurn ? request.siiResumePrompt : undefined
  ].filter(Boolean).join("\n\n");
  return [
    request.agent === "main" && request.kind === "main" ? MAIN_SYSTEM_PROMPT : undefined,
    policy.constraintPrompt,
    mandate ? `用户 Prompt：\n${mandate}` : undefined,
    `项目入口：${inputs.projectPath}\n\n本轮直接消息：\n${task}`,
    recovery ? `来源：OpenFARS\n内容：${recovery}` : undefined,
    mechanismTurn ? `来源：OpenFARS\n内容：${invocationRoleContext(request)}` : undefined,
    request.worktreeClosing ? "Submit your separate finish_task and actual closing handoff." : undefined,
    request.terminalPushObservation ? "Call finish_task for this supplement and return your actual observation handoff." : undefined
  ].filter(Boolean).join("\n\n");
}

function invocationRoleContext(request: AgentRunRequest): string {
  const context = request.executionContext;
  const role = context?.role ?? (request.kind === "main" ? "main" : "worker");
  const scope = context
    ? context.role === "leader"
      ? ("groupRunId" in context ? `group:${context.groupRunId}` : `route:${context.routeScopeId}`)
      : `${context.role}:${context.executionId}`
    : "project";
  const wakeReason = request.worktreeClosing ? "worktree-closing" : request.terminalPushCoordination ? "terminal-push-coordination" : request.terminalPushObservation ? "terminal-push-observation" : request.project.pendingMainDecision?.reason ??
    (request.terminalControlRepair ? "terminal-control-repair" : "workflow-dispatch");
  const stage = request.project.phase || "unknown";
  return [
    "## Current role and execution stage",
    `- role: ${role}`,
    `- scope: ${scope}`,
    `- stage: ${stage}`,
    `- wake reason: ${wakeReason}`,
    `- task session: ${request.taskSessionId ?? "none"}`,
    "Role and scope apply only to this invocation. On a later Worker/Leader return, re-read this section and the Inbox instead of retaining a temporary management mandate.",
    "Use finish_task for your own task completion; a natural model return is not a completion receipt. Main/Leader routing, complete_group and complete_project remain separate authorized actions.",
    ...(request.worktreeClosing ? [
      "The original task, report, completion status, branch and persistent session remain retained. This is a separate finite closing invocation in that same session, authorized by your original direct Leader.",
      `Immutable original report A: ${request.worktreeClosing.reportHeadSha}. Authorized exact files: ${JSON.stringify(request.worktreeClosing.paths)}.`,
      "Inspect the retained Inbox, original session and actual file evidence yourself. Decide the necessary correction or removal within that manifest. Do not perform new business work or change another file. Write your business Memory only if its exact path is explicitly authorized; finish_task memory is saved separately.",
      "After any necessary correction, explicitly call git_push with your own nonempty reason. It checkpoints only authorized pending files. If the current head differs from A, use your own PR tools to deliver that exact B to the direct target supplied in the Inbox. The original report and A delivery are immutable; a prior A PR cannot deliver B. If nothing changed from A, do not create an empty commit or a substitute PR.",
      "Read each actual Git result and decide any retry yourself. git_get_operation and git_reconcile_push refer only to this closing invocation's separate operations; historical reconciliation, conflict preparation, routing, artifact publication and group/project completion are unavailable. Report a real blocker through your own finish_task and handoff."
    ] : []),
    ...(request.terminalPushCoordination ? [
      `Your current receipt role is ${request.terminalPushCoordination.role}, level ${request.terminalPushCoordination.level}, issue ${JSON.stringify(request.terminalPushCoordination.incidentId)}.`,
      "Coordinate this exact assigned issue yourself using coordinate_agent_receipt. Retry asks the original Agent to inspect its receipt; a Leader escalation goes only to the direct parent coordinator. This tool never wakes an arbitrary Agent.",
      request.terminalPushCoordination.canRequestUser
        ? "As the assigned GLOBAL Main, you may request_user if you cannot resolve this issue; explain the actual blocker and needed user input."
        : "User requests are not assigned in this turn; follow the direct parent coordination path if needed. Main acting as a group Leader retains that Leader role.",
      "Finish and write memory for your own coordination turn, then return your actual handoff. Do not replace the other Agent's handoff, business output, Git result or decision."
    ] : []),
    ...(request.terminalPushObservation ? [
      "The original business task is already complete. Its completion, handoff, report, branch and session remain retained; this is a separate finite receipt turn in that same persistent session.",
      `Read your original memory, inbox and any saved original tool results supplied before this input. If the inbox identifies an unfinished push, call git_reconcile_push with operationId=${JSON.stringify(request.terminalPushObservation.operationId)}, historical=true, and retry omitted or false. If that push is already finalized or superseded, receive the saved results without repeating its query or publication. Superseded preserves the unknown original push outcome and proves only inclusion in a later publication.`,
      "The provider returns its actual result directly to you. Inspect it and explain what it proves or what remains unresolved in your own handoff. The system does not retry Git operations or decide that remote work succeeded.",
      "Do not modify business files or create new commits, push, create/merge PRs, route work, or end a group/project in this receipt turn. Missing evidence is a blocker to report, not renewed business authority."
    ] : []),

  ].join("\n");
}

function uniqueNonEmpty(values: readonly string[]): string[] {
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}
