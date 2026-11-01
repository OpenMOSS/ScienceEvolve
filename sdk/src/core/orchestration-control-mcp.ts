import { promises as fs } from "node:fs";
import { createHash } from "node:crypto";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline";
import type { ControlAction, ControlActionEnvelope, AgentName, DisplayItem, CollaborationControlScope, WorkflowNodeId, TerminalPushObservationScope, TerminalPushCoordinationScope } from "./types.js";
import { assertTerminalPushObservationControl, terminalPushObservationActionAllowed } from "./internal/terminal-push-observation.js";
import { assertTerminalPushCoordinationControl, terminalPushCoordinationActionAllowed } from "./internal/terminal-push-coordination.js";
import { assertWorktreeClosingControl, worktreeClosingActionAllowed } from "./internal/worktree-closing.js";
import type { MainCapabilitySnapshot } from "./internal/shared/contracts.js";
import { AUTHORITATIVE_WORKFLOW_REFERENCES, CONTROL_BRIDGE_PROGRESS_PROTOCOL, type ControlActionRejection } from "./orchestration-control-bridge.js";
import type { RuntimeMcpToolDefinition } from "./harness-runtime/contracts.js";
import { containsCredentialMaterial, safeGitArtifactRelativePath, safeProjectRelativePath } from "./utils.js";
import { controlDecisionsConflict, isControlDecision } from "./orchestration-control-decisions.js";
import { sameControlActionRequest } from "./control-action-identity.js";
import { controlResultDisplayText } from "./control-result-receipts.js";
import { agentGitResultSummary } from "./agent-git-result.js";
import { PROJECT_STATE_TOOL_NAMES, projectStateTools, projectStateToolRequest } from "./project-state-mcp.js";
import { parseGitInspectionRequest } from "./collaboration-git/inspection.js";
import { parseGitRevertRequest } from "./collaboration-git/revert.js";
import { CollaborationStateError } from "./collaboration-state/errors.js";

type JsonRpcRequest = { id?: string | number | null; method?: string; params?: Record<string, unknown> };
export type CapabilityContext = {
  projectState?: boolean;
  projectStateReconciliation?: boolean;
  workflowAuthoringPath?: string;
  scopedAgentRouting?: boolean;
  secret: string;
  projectId: string;
  agent: AgentName;
  invocationId: string;
  stateVersion: number;
  capabilityHash?: string;
  expiresAt?: string;
  kind: "main" | "worker";
  candidates: Array<WorkflowNodeId | "finish">;
  tasklessRouteTargets?: WorkflowNodeId[];
  decisionBy: "main" | "agent";
  allowUserIntervention: boolean;
  allowAgentOrchestrationReconfiguration?: boolean;
  allowWorkflowReconfiguration?: boolean;
  allowAgentGitActions?: boolean;
  terminalPushObservation?: TerminalPushObservationScope;
  terminalPushCoordination?: TerminalPushCoordinationScope;
  worktreeClosing?: import("./types.js").WorktreeClosingScope;
  canonicalFinalIntegration?: boolean;
  canComplete: boolean;
  allowFinishRoute?: boolean;
  collaboration?: CollaborationControlScope;
  mainCapabilities?: MainCapabilitySnapshot;
  stagingPath: string;
  workspacePath: string;
  /** Server-owned local bridge. Absent only for isolated MCP harnesses. */
  bridgePath?: string;
  bridgeHost?: string;
  bridgePort?: number;
  requireBridge?: boolean;
};

const MAX_TEXT = 100_000;
const MAX_PATH = 2_000;
const TOOL_NAMES = [
  "finish_task",
  "git_push",
  "git_get_operation",
  "git_reconcile_push",
  "github_create_pr",
  "github_get_pr",
  "github_merge_pr",
  "github_close_pr",
  "git_prepare_conflict",
  "git_log",
  "git_show",
  "git_diff",
  "git_revert",
  "coordinate_group_task",
  "coordinate_agent_receipt",
  "route_to_agent",
  "publish_artifact",
  "select_display",
  "request_user",
  "apply_workflow",
  "complete_project",
  "assign_group_tasks",
  "claim_group_task",
  "request_group_integration",
  "complete_group"
] as const;
const GIT_TOOL_NAMES = new Set<typeof TOOL_NAMES[number]>([
  "git_push",
  "git_get_operation",
  "git_reconcile_push",
  "github_create_pr",
  "github_get_pr",
  "github_merge_pr",
  "github_close_pr",
  "git_prepare_conflict",
  "git_log", "git_show", "git_diff", "git_revert"
]);

class BridgeActionRejectedError extends Error {
  constructor(readonly rejection: ControlActionRejection) {
    super(rejection.message);
    this.name = "BridgeActionRejectedError";
  }
}

const CALL_ID_SCHEMA = {
  type: "string",
  maxLength: 256,
  description: "Unique idempotency key for this action. Reuse it only when retrying the exact same action; every different control-tool action in this invocation must use a new callId."
} as const;

function isMainCapabilitySnapshot(value: unknown): value is MainCapabilitySnapshot {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<MainCapabilitySnapshot>;
  return item.schemaVersion === 1 &&
    (item.controlMode === "autonomous" || item.controlMode === "weak-branch") &&
    Array.isArray(item.routeCandidates) &&
    item.routeCandidates.every((candidate) => typeof candidate === "string") &&
    typeof item.canReconfigure === "boolean" &&
    typeof item.canComplete === "boolean" &&
    typeof item.canRequestUser === "boolean";
}

const DISPLAY_ITEM_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["agent", "path", "title"],
  properties: {
    agent: {
      type: "string",
      maxLength: 128,
      description: "Configured Agent that owns the published artifact."
    },
    path: {
      type: "string",
      maxLength: MAX_PATH,
      description: "Artifact path relative to the project workspace."
    },
    title: {
      type: "string",
      maxLength: 200,
      description: "Readable title shown for this artifact."
    }
  }
} as const;

/** The digest is safe to put in the staging envelope; the bearer secret is not. */
export function hashCapability(secret: string): string {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}

function rpcResult(id: JsonRpcRequest["id"], result: unknown): void {
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, result })}\n`);
}

function rpcError(id: JsonRpcRequest["id"], code: number, message: string): void {
  process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } })}\n`);
}

function text(value: unknown, field: string, max = MAX_TEXT): string {
  if (typeof value !== "string" || !value.trim() || value.length > max) {
    throw new Error(`${field} must be a non-empty string of at most ${max} characters`);
  }
  return value.trim();
}

function callId(value: unknown): string {
  return text(value, "callId", 256);
}

function positiveInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) {
    throw new Error(`${field} must be a positive safe integer`);
  }
  return value;
}

function stringList(value: unknown, field: string, max?: number): string[] {
  if (!Array.isArray(value) || (max !== undefined && value.length > max)) {
    throw new Error(`${field} must be an array${max === undefined ? "" : ` with at most ${max} entries`}`);
  }
  return value.map((entry) => text(entry, field, 256));
}

function assertCollaborationScope(value: unknown): asserts value is CollaborationControlScope {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("collaboration control scope is invalid");
  }
  const scope = value as Record<string, unknown>;
  text(scope.nodeRunId, "collaboration.nodeRunId", 256);
  text(scope.groupRunId, "collaboration.groupRunId", 256);
  positiveInteger(scope.coordinatorEpoch, "collaboration.coordinatorEpoch");
  if (scope.role === "scoped-leader" || scope.role === "scoped-main") {
    for (const field of ["memberNodeIds", "routeCandidates", "failedArrivalRequestIds"] as const) {
      const values = stringList(scope[field], `collaboration.${field}`);
      if (new Set(values).size !== values.length) throw new Error("scoped control candidates must be unique");
    }
    if (scope.closingArrivalRequestIds !== undefined) {
      const closing = stringList(scope.closingArrivalRequestIds, "collaboration.closingArrivalRequestIds");
      if (new Set(closing).size !== closing.length || scope.role !== "scoped-leader" ||
        closing.some(id => !(scope.failedArrivalRequestIds as string[]).includes(id))) {
        throw new Error("Closing coordination requires identified original direct-group arrivals");
      }
    }
    if (scope.recoveryOptions !== undefined) {
      if (!Array.isArray(scope.recoveryOptions) || scope.recoveryOptions.length !== (scope.failedArrivalRequestIds as string[]).length ||
        new Set(scope.recoveryOptions.map(option => option?.arrivalRequestId)).size !== scope.recoveryOptions.length)
        throw new Error("Recovery options must identify every current failed arrival exactly once");
      for (const option of scope.recoveryOptions) {
        if (!option || !(scope.failedArrivalRequestIds as string[]).includes(option.arrivalRequestId) ||
          !Array.isArray(option.allowedOperations) || new Set(option.allowedOperations).size !== option.allowedOperations.length ||
          option.allowedOperations.some((operation: unknown) => typeof operation !== "string" || !(scope.role === "scoped-main" ? ["retry", "skip"] : ["retry", "escalate", "close_worktree"]).includes(operation) ||
            operation === "close_worktree" && !(scope.closingArrivalRequestIds as string[] | undefined)?.includes(option.arrivalRequestId) ||
            scope.worktreeClosingOnly && !["close_worktree", "escalate"].includes(operation)) ||
          !Array.isArray(option.repairNodeIds) || option.repairNodeIds.some((id: unknown) => typeof id !== "string" || !id || id.length > 256) ||
          !option.blockedOperations || typeof option.blockedOperations !== "object" || Array.isArray(option.blockedOperations) ||
          Object.values(option.blockedOperations).some(reason => typeof reason !== "string"))
          throw new Error("Recovery options exceed the current collaboration role or exact failure scope");
      }
    }
    if (scope.worktreeClosingOnly !== undefined && (scope.worktreeClosingOnly !== true || scope.role !== "scoped-leader" ||
      scope.allowReconfiguration !== false || (scope.memberNodeIds as string[]).length || (scope.routeCandidates as string[]).length ||
      scope.sourceArrivalRequestId !== undefined || scope.sourceOuterNodeRunId !== undefined)) {
      throw new Error("Completed group closing cannot carry business planning, routing or reconfiguration authority");
    }
    if (typeof scope.allowReconfiguration !== "boolean" || scope.executionId !== undefined || scope.taskId !== undefined ||
      scope.ownershipEpoch !== undefined) throw new Error("scoped Leader cannot carry business ownership");
    if (scope.sourceArrivalRequestId !== undefined) text(scope.sourceArrivalRequestId, "sourceArrivalRequestId", 256);
    if (scope.sourceOuterNodeRunId !== undefined) text(scope.sourceOuterNodeRunId, "sourceOuterNodeRunId", 256);
    return;
  }
  if (scope.role === "leader") {
    if (
      scope.taskId !== undefined ||
      scope.executionId !== undefined ||
      scope.ownershipEpoch !== undefined
    ) {
      throw new Error("leader collaboration scope cannot carry delivery ownership");
    }
    return;
  }
  if (scope.role !== "delivery" && scope.role !== "final-integration") {
    throw new Error("collaboration role is invalid");
  }
  text(scope.taskId, "collaboration.taskId", 256);
  text(scope.executionId, "collaboration.executionId", 256);
  positiveInteger(scope.ownershipEpoch, "collaboration.ownershipEpoch");
}

function relativeWorkspacePath(value: unknown): string {
  text(value, "path", MAX_PATH);
  return safeGitArtifactRelativePath(value as string);
}

function pathIsWithin(candidate: string, root: string): boolean {
  const relative = path.relative(root, candidate);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
}

async function verifyArtifact(context: CapabilityContext, value: unknown): Promise<string> {
  const relative = relativeWorkspacePath(value);
  const root = await fs.realpath(context.workspacePath);
  const candidate = path.resolve(root, relative);
  if (!pathIsWithin(candidate, root)) throw new Error("artifact path escapes the project workspace");
  const real = await fs.realpath(candidate);
  if (!pathIsWithin(real, root)) throw new Error("artifact path resolves outside the project workspace");
  const stat = await fs.stat(real);
  if (!stat.isFile()) throw new Error("artifact must be a regular file");
  if (stat.size > 50 * 1024 * 1024) throw new Error("artifact exceeds the 50 MiB limit");
  return relative;
}

function capabilityFromEnvironment(): CapabilityContext {
  const raw = process.env.SCIENCEEVOLVE_CONTROL_CONTEXT;
  const secret = process.env.SCIENCEEVOLVE_CONTROL_CAPABILITY;
  if (!raw || !secret) throw new Error("control capability is missing");
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(parsed, "secret")) throw new Error("capability context must not contain a self-reported secret");
  const context = parsed as Omit<CapabilityContext, "secret">;
  if (
    typeof context.projectId !== "string" ||
    typeof context.agent !== "string" ||
    typeof context.invocationId !== "string" ||
    typeof context.stagingPath !== "string" ||
    typeof context.workspacePath !== "string" ||
    !path.isAbsolute(context.stagingPath) ||
    !path.isAbsolute(context.workspacePath) ||
    !Number.isSafeInteger(context.stateVersion) ||
    !Array.isArray(context.candidates) ||
    (context.tasklessRouteTargets !== undefined &&
      (!Array.isArray(context.tasklessRouteTargets) ||
        new Set(context.tasklessRouteTargets).size !== context.tasklessRouteTargets.length ||
        context.tasklessRouteTargets.some((target) =>
          typeof target !== "string" || !target.trim() ||
          !context.candidates.includes(target)))) ||
    (context.kind !== "main" && context.kind !== "worker") ||
    (context.decisionBy !== "main" && context.decisionBy !== "agent") ||
    typeof context.allowUserIntervention !== "boolean" ||
    (context.projectState !== undefined && typeof context.projectState !== "boolean") ||
    (context.allowAgentOrchestrationReconfiguration !== undefined &&
      typeof context.allowAgentOrchestrationReconfiguration !== "boolean") ||
    (context.allowWorkflowReconfiguration !== undefined &&
      typeof context.allowWorkflowReconfiguration !== "boolean") ||
    (context.allowAgentGitActions !== undefined &&
      typeof context.allowAgentGitActions !== "boolean") ||
    (context.canonicalFinalIntegration !== undefined &&
      typeof context.canonicalFinalIntegration !== "boolean") ||
    (context.allowAgentOrchestrationReconfiguration === true &&
      context.allowWorkflowReconfiguration === true) ||
    typeof context.canComplete !== "boolean" ||
    (context.mainCapabilities !== undefined && !isMainCapabilitySnapshot(context.mainCapabilities)) ||
    (context.requireBridge !== undefined && typeof context.requireBridge !== "boolean")
  ) throw new Error("control capability is incomplete");
  if (
    context.bridgePath !== undefined &&
    (typeof context.bridgePath !== "string" || !path.isAbsolute(context.bridgePath))
  ) throw new Error("control bridge path is invalid");
  if (
    context.bridgePort !== undefined &&
    (!Number.isSafeInteger(context.bridgePort) || context.bridgePort <= 0 || context.bridgePort > 65_535)
  ) throw new Error("control bridge port is invalid");
  if (
    context.bridgePort !== undefined && context.bridgeHost !== undefined && context.bridgeHost !== "127.0.0.1"
  ) throw new Error("control bridge host is invalid");
  if (context.expiresAt !== undefined) {
    if (typeof context.expiresAt !== "string" || !Number.isFinite(Date.parse(context.expiresAt))) {
      throw new Error("control capability expiry is invalid");
    }
    if (Date.parse(context.expiresAt) <= Date.now()) throw new Error("control capability has expired");
  }
  if (context.capabilityHash !== undefined && context.capabilityHash !== hashCapability(secret)) {
    throw new Error("control capability hash does not match the invocation secret");
  }
  if (context.collaboration !== undefined) {
    assertCollaborationScope(context.collaboration);
    if (context.collaboration.role === "scoped-main" && (context.agent !== "main" || context.kind !== "main")) throw new Error("Global Main scope requires the actual Main identity and kind");
  }
  assertTerminalPushObservationControl(context);
  assertTerminalPushCoordinationControl(context);
  assertWorktreeClosingControl(context);
  return { ...context, secret };
}

export function toolsFor(context: CapabilityContext): RuntimeMcpToolDefinition[] {
  const currentMain = context.terminalPushCoordination ? context.terminalPushCoordination.role === "main"
    : context.collaboration ? context.collaboration.role === "scoped-main"
      : context.kind === "main" && !context.worktreeClosing && !context.terminalPushObservation;
  return [...controlToolsFor(context), ...(context.projectState ? projectStateTools(currentMain && context.projectStateReconciliation !== false,
    context.collaboration?.role === "scoped-leader") : [])];
}

function controlToolsFor(context: CapabilityContext): RuntimeMcpToolDefinition[] {
  if (context.worktreeClosing !== undefined) {
    assertWorktreeClosingControl(context);
    return [
      { ...finishTaskTool(), description: "Record your own separate worktree closing supplement and optional memory. The original report, business completion and Memory remain immutable. This receipt does not close the issue, release the next task, or replace actual delivery and native Stop." },
      ...agentGitTools().filter(tool => !["git_prepare_conflict", "git_log", "git_show", "git_diff", "git_revert"].includes(tool.name)).map(tool => {
        if (tool.name === "git_push") return { ...tool,
          description: "Explicitly checkpoint only the original Leader-authorized pending files with your own reason, then publish the exact clean closing SHA on the original branch. Original report A is immutable; any distinct B requires its own matching delivery. An unchanged A needs no empty commit.",
          inputSchema: { ...tool.inputSchema, required: ["callId", "reason"], properties: {
            callId: CALL_ID_SCHEMA, reason: { type: "string", minLength: 1, maxLength: 8192 }
          } } };
        if (tool.name === "git_reconcile_push") return { ...tool,
          description: "Observe only your selected push from this closing invocation's separate journal. Retry=true explicitly resends that original exact SHA after fresh authority and worktree checks; no new checkpoint is made. Inspect the real result yourself.",
          inputSchema: { ...tool.inputSchema, properties: { callId: CALL_ID_SCHEMA,
            operationId: { type: "string", minLength: 1, maxLength: 1024 }, retry: { type: "boolean" },
            historical: { type: "boolean", const: false }
          } } };
        if (tool.name === "git_get_operation") return { ...tool,
          description: "Read one exact operation from this closing invocation's separate journal. Original business operations and reports are retained separately. This read does not retry, finalize, or settle the closing issue." };
        if (tool.name === "github_get_pr") return { ...tool,
          description: "Observe only the current original owner's exact closing PR; historical repair sources do not grant closing business authority.",
          inputSchema: { type: "object", additionalProperties: false, required: ["callId"], properties: {
            callId: CALL_ID_SCHEMA, providerNumber: { type: "integer", minimum: 1 }
          } } };
        return tool;
      })
    ];
  }
  if (context.terminalPushCoordination !== undefined) {
    assertTerminalPushCoordinationControl(context);
    const scope = context.terminalPushCoordination;
    const tools: RuntimeMcpToolDefinition[] = [finishTaskTool(), {
      name: "coordinate_agent_receipt",
      description: "Decide only the assigned Agent receipt issue after reading its actual evidence and handoff. Retry authorizes that Agent to inspect its receipt again; escalate passes your own rationale to your direct parent coordinator. The system transports your decision after your own finish_task, actual handoff and native Stop. You coordinate; you do not perform that Agent's work, push, create a PR, choose a business route or wake arbitrary Agents.",
      inputSchema: { type: "object", additionalProperties: false, required: ["callId", "incidentId", "operation", "rationale"], properties: {
        callId: CALL_ID_SCHEMA, incidentId: { type: "string", const: scope.incidentId },
        operation: { type: "string", enum: scope.role === "main" ? ["retry"] : ["retry", "escalate"] },
        rationale: { type: "string", minLength: 1, maxLength: MAX_TEXT }
      } }
    }];
    if (context.allowUserIntervention && scope.canRequestUser) tools.push({ name: "request_user",
      description: "As the assigned Main coordinator, request the user's decision about this exact unresolved issue. Explain the actual evidence and blocker yourself; finish_task and your handoff are still required. This does not complete or reconfigure the project.",
      inputSchema: { type: "object", additionalProperties: false, required: ["callId", "message", "rationale"], properties: {
        callId: CALL_ID_SCHEMA, message: { type: "string", minLength: 1, maxLength: MAX_TEXT },
        rationale: { type: "string", minLength: 1, maxLength: MAX_TEXT }, context: { type: "string", maxLength: MAX_TEXT }
      } }
    });
    return tools.map(tool => ({ ...tool, annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false } }));
  }
  if (context.terminalPushObservation !== undefined) {
    assertTerminalPushObservationControl(context);
    return [finishTaskTool(), {
      name: "git_reconcile_push",
      description: "Read the actual remote result of your completed task's exact retained push. Set historical=true and inspect the returned provider evidence yourself. This turn cannot push, retry, create or merge a PR, or reopen business work. Submit your own finish_task receipt and concise handoff after inspecting the result, including an unresolved blocker when necessary.",
      inputSchema: { type: "object", additionalProperties: false, required: ["callId", "operationId", "historical"], properties: {
        callId: CALL_ID_SCHEMA,
        operationId: { type: "string", enum: [context.terminalPushObservation.operationId] },
        historical: { type: "boolean", const: true },
        retry: { type: "boolean", const: false }
      } },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false }
    }];
  }
  if (context.collaboration) return [finishTaskTool(), ...collaborationToolsFor(context.collaboration, context.allowUserIntervention)].map((tool) => ({
    ...tool,
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false }
  }));
  const candidates = context.kind === "main"
    ? context.mainCapabilities?.routeCandidates ?? context.candidates
    : context.candidates;
  const routeCandidates = context.allowFinishRoute === true || context.mainCapabilities !== undefined
    ? candidates
    : candidates.filter((candidate) => candidate !== "finish");
  const canComplete = context.kind === "main"
    ? context.mainCapabilities?.canComplete ?? context.canComplete
    : context.canComplete;
  const canRequestUser = context.kind === "main"
    ? context.allowUserIntervention && (context.mainCapabilities?.canRequestUser ?? true)
    : false;
  const canReconfigure = context.kind === "main"
    ? context.mainCapabilities?.canReconfigure ?? (context.allowAgentOrchestrationReconfiguration === true || context.allowWorkflowReconfiguration === true)
    : false;
  const canRoute = context.kind === "main" ? routeCandidates.length > 0 : (context.decisionBy === "agent" &&
    (context.scopedAgentRouting === true ? routeCandidates.length > 0 : routeCandidates.length >= 2 &&
      routeCandidates.every((candidate) => candidate !== "finish" && candidate !== "main")));
  const tools: RuntimeMcpToolDefinition[] = [finishTaskTool()];
  if (context.allowAgentGitActions === true && context.kind === "worker") {
    tools.push(...agentGitTools());
  }
  if (canRoute) tools.push({
    name: "route_to_agent",
    description: "Commit this invocation's sole routing decision after the work and handoff are complete.",
    inputSchema: { type: "object", additionalProperties: false, required: ["callId", "target", ...(context.kind === "main" && !(context.tasklessRouteTargets?.length) ? ["assignment"] : context.kind === "worker" ? ["rationale"] : [])], properties: { callId: CALL_ID_SCHEMA, target: { type: "string", enum: routeCandidates }, assignment: { type: "string", maxLength: 20_000, description: "Bounded role-specific scope only. Reference the canonical User requirement for datasets, dependencies, numeric facts, filenames, sizes, and output constraints; never restate or alter them here." }, rationale: { type: "string" }, context: { type: "string" }, successCriteria: { type: "array", items: { type: "string" } } } }
  });
  tools.push({
    name: "publish_artifact",
    description: "Register a formal deliverable file, never internal Agent memory. Git artifacts must exist in the accepted PR commit. When correcting your own pending standalone Git publication, use replacesPath to explicitly replace that old path; the system does not choose a replacement for you.",
    inputSchema: { type: "object", additionalProperties: false, required: ["callId", "path", "title", "kind", "description"], properties: { callId: CALL_ID_SCHEMA, path: { type: "string" }, title: { type: "string" }, kind: { type: "string" }, description: { type: "string" },
      ...(context.kind === "worker" && context.allowAgentGitActions && !context.collaboration && !context.scopedAgentRouting
        ? { replacesPath: { type: "string", description: "Exact pending path from this execution to replace. Does not remove a published artifact or another Agent's intent." } } : {}) } }
  });
  if (context.kind === "main" || canComplete) tools.push({
    name: "select_display",
    description: context.kind === "main"
      ? "Select one or more already readable project artifacts for display before the terminal action."
      : "Select published project artifacts for the automatic termination result before completing the project.",
    inputSchema: { type: "object", additionalProperties: false, required: ["callId", "primary"], properties: { callId: CALL_ID_SCHEMA, primary: DISPLAY_ITEM_SCHEMA, items: { type: "array", items: DISPLAY_ITEM_SCHEMA } } }
  });
  if (context.kind === "main" && canRequestUser) tools.push({
    name: "request_user",
    description: "Record a decision to pause orchestration for a user response.",
    inputSchema: { type: "object", additionalProperties: false, required: ["callId", "message", "rationale"], properties: { callId: CALL_ID_SCHEMA, message: { type: "string" }, rationale: { type: "string" }, context: { type: "string" } } }
  });
  const workflowFile = "workflow.json";
  if (context.kind === "main" && canReconfigure) tools.push({
    name: "apply_workflow",
    description: "Commit the edited workflow.json snapshot as this Main invocation's sole terminal action. Preserve the original draft and its baseHash/baseVersion; read .scienceevolve/workflow-current.json and explicitly reconcile a stale or unversioned draft before resubmitting. The current reference is read-only and is not the submission path. The server validates the orchestration and explicitly editable Agent fields; locked runtime values remain server-owned. A fresh Main turn then starts under the committed configuration.",
    inputSchema: {
      type: "object",
      additionalProperties: false,
      required: ["callId", "path", "rationale"],
      properties: {
        callId: CALL_ID_SCHEMA,
        path: {
          type: "string",
          enum: [workflowFile],
          description: "The server-generated Workflow snapshot in the common project workspace."
        },
        rationale: { type: "string", maxLength: 20_000 }
      }
    }
  });
  if (canComplete) tools.push({
    name: "complete_project",
    description: context.kind === "main"
      ? "Commit the Main completion decision after checking the user requirements and artifacts."
      : "Commit automatic completion only after this termination Agent has verified the configured natural-language condition.",
    inputSchema: { type: "object", additionalProperties: false, required: ["callId", "rationale"], properties: { callId: CALL_ID_SCHEMA, rationale: { type: "string" } } }
  });
  // These controls are confined to the invocation's validated capability and
  // project workspace; explicit hints avoid an impossible headless prompt.
  return tools.filter((tool) => !context.canonicalFinalIntegration ||
    ["finish_task", "git_get_operation", "github_create_pr", "github_get_pr", "github_merge_pr", "github_close_pr"].includes(tool.name)).map((tool) => ({
    ...tool,
    ...(context.canonicalFinalIntegration && tool.name === "github_get_pr" ? {
      description: "Observe only this canonical delivery's exact owned PR; historical repair sources belong to a new business task.",
      inputSchema: { type: "object", additionalProperties: false, required: ["callId"], properties: {
        callId: CALL_ID_SCHEMA, providerNumber: { type: "integer", minimum: 1 }
      } }
    } : {}),
    annotations: { readOnlyHint: ["git_get_operation", "git_log", "git_show", "git_diff", "github_get_pr"].includes(tool.name), destructiveHint: false, openWorldHint: false }
  }));
}

function agentGitTools(): RuntimeMcpToolDefinition[] {
  const sha = { type: "string", pattern: "^(?:[a-fA-F0-9]{40}|[a-fA-F0-9]{64})$" };
  const page = { offset: { type: "integer", minimum: 0 }, maxBytes: { type: "integer", minimum: 4, maximum: 262144 },
    expectedVersion: { type: "string", pattern: "^[a-f0-9]{64}$", description: "For subsequent pages, copy the returned version exactly; omit on the first read." } };
  return [
    {
      name: "git_revert", description: "Explicitly preview or create a new revert commit on your current authorized task branch; history/reports/experiments and completion budgets remain unchanged. For preview/apply choose target (full SHA), expectedHead, and an actual mainline parent for merges. To repair a previous merged PR use its sourceOperationId from the historical read-only github_get_pr source lookup, in a new task. For status/continue/abort choose the exact returned operationId; continue/abort also require actual expectedHead. A repeated request only observes its original operation. Resolve and stage conflicts yourself before explicitly continuing; abort restores only that operation's paths and preserves unrelated files. No automatic push/PR/merge/finish follows. Inspect the actual result and use the normal delivery tools for the new head.",
      inputSchema: { type: "object", additionalProperties: false, required: ["callId", "mode"], properties: {
        callId: CALL_ID_SCHEMA, mode: { enum: ["preview", "apply", "status", "continue", "abort"] }, target: sha, expectedHead: sha,
        mainline: { type: "integer", minimum: 1 }, sourceOperationId: { type: "string", minLength: 1, maxLength: 1024 },
        operationId: { type: "string", pattern: "^git-revert-[a-f0-9]{64}$" }, ...page
      }, oneOf: [
        { properties: { mode: { enum: ["preview", "apply"] } }, required: ["target", "expectedHead"] },
        { properties: { mode: { const: "status" } }, required: ["operationId"] },
        { properties: { mode: { enum: ["continue", "abort"] } }, required: ["operationId", "expectedHead"] }
      ] }
    },
    {
      name: "git_log", description: "Read a stable page of the current authorized branch's real commit history, including exact parents and source. For later pages reuse the returned revision and nextOffset. No checkout, commit, or publication is performed.",
      inputSchema: { type: "object", additionalProperties: false, required: ["callId"], properties: {
        callId: CALL_ID_SCHEMA, revision: sha, offset: { type: "integer", minimum: 0 }, limit: { type: "integer", minimum: 1, maximum: 100 }
      } }
    },
    {
      name: "git_show", description: "Read one complete commit SHA from authorized history, its exact parents, changed business files and a bounded patch page. Merge patches explicitly identify their first-parent comparison. Check eof/nextOffset/version; a partial page is not the complete patch.",
      inputSchema: { type: "object", additionalProperties: false, required: ["callId", "commit"], properties: { callId: CALL_ID_SCHEMA, commit: sha, ...page } }
    },
    {
      name: "git_diff", description: "Read the actual workspace versus index, staged index versus HEAD, or two explicit authorized commit SHAs. Reports comparison, files, HEAD, version and byte pagination, including binary patches. Read all pages yourself when needed; no Git state changes.",
      inputSchema: { type: "object", additionalProperties: false, required: ["callId", "mode"], properties: {
        callId: CALL_ID_SCHEMA, mode: { enum: ["workspace", "staged", "revisions"] }, from: sha, to: sha, expectedHead: sha, ...page
      } }
    },
    {
      name: "git_get_operation",
      description: "Read the durable journal of one exact Git/GitHub operation from your original task, including its older ownership epochs. Select its operationId from your retained session/Inbox. Returns outcome_unknown when remote success is unconfirmed, remote_success_local_pending when remote success is recorded but its journal or local merge synchronization is incomplete, and completed only with the recorded required stages. Captured request arguments/caller/session are included when available; operationAlreadyExisted=true means this first captured request reconciles an older journal whose original request was not captured. Recorded provider facts carry their observation time; use github_get_pr or git_reconcile_push to refresh provider state. This query performs no Git/provider mutation, does not change the current task head, and does not complete your task. Inspect its actual result and decide whether to wait, recover the original request/local stage, or report a blocker. For a merge response lost after remote success, reuse the original github_merge_pr callId and arguments for its existing reconciliation path.",
      inputSchema: { type: "object", additionalProperties: false, required: ["callId", "operationId"], properties: {
        callId: CALL_ID_SCHEMA, operationId: { type: "string", minLength: 1, maxLength: 1024 }
      } }
    },
    {
      name: "git_reconcile_push",
      description: "Observe one retained git.push operation you select by its exact operationId, including legacy IDs. An exact remote SHA finalizes that original journal with its unchanged payload hash. For your current task/epoch, a later confirmed publication of the same repository/ref plus fresh remote and trusted ancestry proof can instead record superseded: the old commit is included and needs no further push, but its original push success remains unknown. Superseded does not provide a current PR head or replace the report. Otherwise you receive the actual unconfirmed result. Default observation never pushes. For your own older task or ownership epoch, explicitly set historical=true: this only observes that original ref and receipt, cannot retry or supply the current task's PR head, and requires your current live Agent authority. Only for the current task and epoch may retry=true re-send the original immutable commit, using a non-force exact-SHA push after verifying its owned local head. It never checkpoints dirty work, creates a PR, finishes your task, or chooses a retry. Inspect your original session/inbox and actual results; you decide retry or escalation.",
      inputSchema: { type: "object", additionalProperties: false, required: ["callId", "operationId"], properties: {
        callId: CALL_ID_SCHEMA, operationId: { type: "string", minLength: 1, maxLength: 1024 }, retry: { type: "boolean" }, historical: { type: "boolean" }
      } }
    },
    {
      name: "git_push",
      description: "Push the current Agent execution branch. Ordinary business pushes do not stage files or create a commit; without a business commit the result is not_committed. When changes need committing, git_stage and git_commit are provided by the filesystem-authority MCP; if not visible, use the Harness's existing tool discovery within current permissions. For a canonical group publication with no new commit, observe its already-published remote head and return already_published only when it exactly matches the local head; no extra commit or push is created. Repository, branch and ownership are bound to this invocation; inspect the actual returned result.",
      inputSchema: { type: "object", additionalProperties: false, required: ["callId"], properties: {
        callId: CALL_ID_SCHEMA, reason: { type: "string", maxLength: MAX_TEXT }
      } }
    },
    {
      name: "github_create_pr",
      description: "Create a pull request for the already pushed execution branch. The direct group target is validated by the server and the provider result is returned directly.",
      inputSchema: { type: "object", additionalProperties: false, required: ["callId", "base", "title", "body"], properties: {
        callId: CALL_ID_SCHEMA, base: { type: "string", minLength: 1, maxLength: 256 },
        title: { type: "string", minLength: 1, maxLength: 250 }, body: { type: "string", maxLength: 60000 }
      } }
    },
    {
      name: "github_get_pr",
      description: "Observe the current execution's own pull request without changing GitHub. Omit providerNumber to discover it using this task's bound head branch and direct target. A supplied number must belong to this same execution. For a previous merged PR's read-only repair source, explicitly supply sourceOperationId from this project's original merge journal: returns its actual head/base/merge SHA and Git parents after provider/history verification. That historical source never becomes this task's current PR, head or write authority. Inspect the real missing/ownership/provider result and choose your own next action.",
      inputSchema: { type: "object", additionalProperties: false, required: ["callId"], properties: {
        callId: CALL_ID_SCHEMA, providerNumber: { type: "integer", minimum: 1 }, sourceOperationId: { type: "string", minLength: 1, maxLength: 1024 }
      } }
    },
    {
      name: "github_merge_pr",
      description: "Merge your exact pull request after checking its head and direct base, and synchronize its confirmed merged target. Merging a PR does not finish your active task: you may continue editing, then commit and push each new head and deliver it through its own matching PR. To recover an unfinished merge whose response was lost, reuse that original callId and the same arguments, including reason. This reconciles your original operation even if GitHub already merged, without another remote merge. Inspect actual results and decide the next action yourself.",
      inputSchema: { type: "object", additionalProperties: false, required: ["callId", "providerNumber"], properties: {
        callId: CALL_ID_SCHEMA, providerNumber: { type: "integer", minimum: 1 }, reason: { type: "string", maxLength: MAX_TEXT }
      } }
    },
    {
      name: "github_close_pr",
      description: "Close your exact owned pull request only when you decide to abandon it. The tool verifies the current ownership, repository, branch, head and direct target, returns the actual provider result, and does not finish your task or choose a successor. Report a blocker to your coordinator when needed.",
      inputSchema: { type: "object", additionalProperties: false, required: ["callId", "providerNumber"], properties: {
        callId: CALL_ID_SCHEMA, providerNumber: { type: "integer", minimum: 1 }, reason: { type: "string", maxLength: MAX_TEXT }
      } }
    },
    {
      name: "git_prepare_conflict",
      description: "Prepare the retained execution worktree against its current direct base for conflict resolution and return the observed conflict paths.",
      inputSchema: { type: "object", additionalProperties: false, required: ["callId"], properties: { callId: CALL_ID_SCHEMA } }
    }
  ];
}

function finishTaskTool(): RuntimeMcpToolDefinition {
  return { name: "finish_task", description: "Request completion of your current logical task, preserving its existing handoff and Agent-authored memory. For a new Git business task supply memory or summary: it is appended once to your actual Git worktree's agent-memory/<agent>/Memory.md. Inspect git_status and commit/push/integrate this work record and every other workspace change before returning. Other tasks may omit summary when a handoff already exists or will be returned by this turn. If the current inbox already supplies an accepted receipt for this same task, preserve its immutable summary/memory and supplement only the missing actions; a new physical invocation does not require a replacement receipt. This does not complete a group/project, release successors, or close your tools; continue any authorized completion or workflow actions. Saving failures are returned to you.",
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    inputSchema: { type: "object", additionalProperties: false, required: ["callId"], properties: {
      callId: CALL_ID_SCHEMA, summary: { type: "string", minLength: 1, maxLength: MAX_TEXT },
      memory: { type: "string", minLength: 1, maxLength: MAX_TEXT }
    } } };
}

/**
 * Prompt-facing projection of the same capability calculation used by
 * tools/list. Keeping this projection beside toolsFor prevents a role prompt
 * from naming a control tool that the invocation cannot actually call.
 */
export function visibleToolNamesForPrompt(
  control: object,
  kind: CapabilityContext["kind"]
): string[] {
  const fields = control as Record<string, unknown>;
  return toolsFor({
    ...fields,
    agent: typeof fields.agent === "string" ? fields.agent : kind === "main" ? "main" : "prompt-catalog",
    invocationId: typeof fields.invocationId === "string" ? fields.invocationId : "prompt-catalog",
    stateVersion: typeof fields.stateVersion === "number" ? fields.stateVersion : 0,
    kind,
    secret: "prompt-catalog-only"
  } as CapabilityContext).map((tool) => tool.name);
}

function recoveryOperations(scope: Extract<CollaborationControlScope, { role: "scoped-leader" | "scoped-main" }>, arrivalRequestId: string, useHints = true): string[] {
  if (useHints && scope.recoveryOptions) return scope.recoveryOptions.find(option => option.arrivalRequestId === arrivalRequestId)?.allowedOperations ?? [];
  return scope.role === "scoped-main" ? ["retry", "skip"] : [...(scope.worktreeClosingOnly ? [] : ["retry"]), "escalate",
    ...(scope.closingArrivalRequestIds?.includes(arrivalRequestId) ? ["close_worktree"] : [])];
}

function collaborationToolsFor(scope: CollaborationControlScope, allowUserIntervention: boolean): RuntimeMcpToolDefinition[] {
  if (scope.role === "scoped-leader" || scope.role === "scoped-main") {
    const identity = { groupRunId: { type: "string", const: scope.groupRunId },
      coordinatorEpoch: { type: "integer", const: scope.coordinatorEpoch } };
    const actionableIds = scope.failedArrivalRequestIds.filter(id => recoveryOperations(scope, id).length > 0);
    const operations = [...new Set(actionableIds.flatMap(id => recoveryOperations(scope, id)))];
    const tools: RuntimeMcpToolDefinition[] = scope.role === "scoped-main" || scope.worktreeClosingOnly ? [] : [{ name: "assign_group_tasks",
      description: "Plan bounded instructions for this group's direct graph nodes. taskId is a node reference, not a new task or parallel edge. The existing graph and FIFO own execution.",
      inputSchema: { type: "object", additionalProperties: false, required: ["callId", "groupRunId", "coordinatorEpoch", "tasks"],
        properties: { callId: CALL_ID_SCHEMA, ...identity, tasks: { type: "array", minItems: 1,
          items: { type: "object", additionalProperties: false, required: ["taskId", "assignment"],
            properties: { taskId: { type: "string", enum: scope.memberNodeIds }, assignment: { type: "string", minLength: 1, maxLength: MAX_TEXT } } } } } } }];
    if (scope.routeCandidates.length) tools.push({ name: "route_to_agent", description: "Select only the current arrival's local weak successor, including this group's Finish. This does not complete the project.",
      inputSchema: { type: "object", additionalProperties: false, required: ["callId", "target", "rationale"],
        properties: { callId: CALL_ID_SCHEMA, target: { type: "string", enum: scope.routeCandidates }, rationale: { type: "string", maxLength: MAX_TEXT },
          assignment: { type: "string", maxLength: MAX_TEXT } } } });
    if (scope.allowReconfiguration) tools.push({ name: "apply_workflow", description: (scope.role === "scoped-main"
      ? "Apply the formal global workflow.json proposal using Main's existing configuration authority. Runtime and active execution fields remain locked."
      : "Apply the formal workflow.json proposal only to this group. Runtime fields, outside graphs and existing child internals are locked.") + " Preserve the original draft and baseHash/baseVersion; read the read-only .scienceevolve/workflow-current.json reference and explicitly reconcile a stale or unversioned draft before resubmitting. Submit only the bound workflow.json proposal.",
      inputSchema: { type: "object", additionalProperties: false, required: ["callId", "path", "rationale"],
        properties: { callId: CALL_ID_SCHEMA, path: { type: "string", const: "workflow.json" }, rationale: { type: "string", maxLength: MAX_TEXT } } } });
    if (actionableIds.length) tools.push({ name: "coordinate_group_task", description: (scope.role === "scoped-main"
      ? "Resolve an exact retained failure assigned to Main through scoped escalation or the formal direct key-state entry: retry its retained branch/session or approve skipping a failed Worker, including its mechanism issue, after native Stop and settlement of its original Git operations. Skip excludes its report from successful evidence; it preserves PR/Git history and requires an explicit local continuation. It cannot skip a group/final-integration incident or discard unknown Git outcomes. This global Main authority is distinct from a local Leader role."
      : (scope.worktreeClosingOnly ? "Coordinate only retained original-owner closing in this completed group, or escalate to the parent manager. Completed tasks and routes stay closed."
        : "Retry a stopped failed direct-group task using its retained branch/session, or escalate to the parent manager. Leaders cannot skip tasks.") +
        (scope.closingArrivalRequestIds?.length ? " For an explicitly identified closing arrival, close_worktree separately authorizes only its original owner/epoch and selected identified files; ordinary retry grants no closing writes." : "")) +
        (scope.recoveryOptions ? ` Current per-arrival choices: ${JSON.stringify(scope.recoveryOptions)}. Choose only that arrival's allowedOperations. Resolve blockedOperations prerequisites through the responsible original Agent. After recording decisions, finish_task and end this management turn so they can take effect.` : ""),
      inputSchema: { type: "object", additionalProperties: false,
        required: ["callId", "groupRunId", "coordinatorEpoch", "arrivalRequestId", "operation", "rationale"],
        properties: { callId: CALL_ID_SCHEMA, ...identity, arrivalRequestId: { type: "string", enum: actionableIds },
          operation: { type: "string", enum: operations },
          ...(scope.role === "scoped-leader" && scope.closingArrivalRequestIds?.length ? { closing: {
            type: "object", additionalProperties: false, required: ["executionId", "ownershipEpoch", "paths"],
            properties: { executionId: { type: "string", minLength: 1, maxLength: 256 }, ownershipEpoch: { type: "integer", minimum: 1 },
              paths: { type: "array", minItems: 1, maxItems: 1000, uniqueItems: true, items: { type: "string", minLength: 1, maxLength: 4096 } } }
          } } : {}),
          ...(scope.worktreeClosingOnly || scope.recoveryOptions && !scope.recoveryOptions.some(option => option.repairNodeIds.length) ? {} : { repairNodeId: { type: "string", minLength: 1, maxLength: 256, description: "Supply only for a final-PR conflict retry: copy an eligible repairNodeIds graph node for this arrival. Otherwise omit this optional field. This does not grant the Leader business-write authority." } }),
          rationale: { type: "string", maxLength: MAX_TEXT } } } });
    if (scope.role === "scoped-leader" && !scope.worktreeClosingOnly) {
      tools.push({
        name: "request_group_integration",
        description: "After every required path reaches Finish, nominate one eligible non-leader Agent for the group's explicit final Git delivery. This records a request; it does not make the Leader perform business Git work.",
        inputSchema: { type: "object", additionalProperties: false, required: ["callId", "groupRunId", "coordinatorEpoch", "integrationOwnerAgentId"], properties: {
          callId: CALL_ID_SCHEMA, groupRunId: identity.groupRunId, coordinatorEpoch: identity.coordinatorEpoch,
          integrationOwnerAgentId: { type: "string", minLength: 1, maxLength: 128 }
        } }
      });
      tools.push({
        name: "complete_group",
        description: "After your own finish_task receipt and the explicit final integration proof, record the group's completion summary and release its planned parent route.",
        inputSchema: { type: "object", additionalProperties: false, required: ["callId", "groupRunId", "coordinatorEpoch", "output"], properties: {
          callId: CALL_ID_SCHEMA, groupRunId: identity.groupRunId, coordinatorEpoch: identity.coordinatorEpoch,
          output: { type: "string", minLength: 1, maxLength: MAX_TEXT }
        } }
      });
    }
    if (scope.role === "scoped-main" && allowUserIntervention) tools.push({ name: "request_user", description: "After every group level has escalated, ask the user for help without discarding failed tasks, branches or queues.",
      inputSchema: { type: "object", additionalProperties: false, required: ["callId", "message", "rationale"], properties: {
        callId: CALL_ID_SCHEMA, message: { type: "string", minLength: 1, maxLength: MAX_TEXT }, rationale: { type: "string", maxLength: MAX_TEXT }, context: { type: "string", maxLength: MAX_TEXT } } } });
    return tools;
  }
  if (scope.role === "leader") {
    return [
      {
        name: "assign_group_tasks",
        description: "Record one FIFO batch of delivery work for the current group run. The server atomically commits the accepted assignment after the native Harness turn finishes.",
        inputSchema: {
          type: "object",
          additionalProperties: false,
          required: ["callId", "groupRunId", "coordinatorEpoch", "tasks"],
          properties: {
            callId: CALL_ID_SCHEMA,
            groupRunId: { type: "string", const: scope.groupRunId },
            coordinatorEpoch: { type: "integer", const: scope.coordinatorEpoch },
            tasks: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["taskId", "assignment"],
                properties: {
                  taskId: { type: "string", minLength: 1, maxLength: 256 },
                  assignment: { type: "string", minLength: 1, maxLength: MAX_TEXT },
                  assigneeAgentId: { type: "string", minLength: 1, maxLength: 128 },
                  dependencyTaskIds: {
                    type: "array",
                    maxItems: 100,
                    items: { type: "string", minLength: 1, maxLength: 256 }
                  }
                }
              }
            }
          }
        }
      },
      {
        name: "request_group_integration",
        description: "Freeze ordinary work and assign final integration to one delivery member after all required tasks are terminal.",
        inputSchema: {
          type: "object",
          additionalProperties: false,
          required: ["callId", "groupRunId", "coordinatorEpoch", "integrationOwnerAgentId"],
          properties: {
            callId: CALL_ID_SCHEMA,
            groupRunId: { type: "string", const: scope.groupRunId },
            coordinatorEpoch: { type: "integer", const: scope.coordinatorEpoch },
            integrationOwnerAgentId: { type: "string", minLength: 1, maxLength: 128 }
          }
        }
      },
      {
        name: "complete_group",
        description: "Record the leader's group completion decision after the final PR is merged. This is not project completion and does not require Main approval.",
        inputSchema: {
          type: "object",
          additionalProperties: false,
          required: ["callId", "groupRunId", "coordinatorEpoch", "output"],
          properties: {
            callId: CALL_ID_SCHEMA,
            groupRunId: { type: "string", const: scope.groupRunId },
            coordinatorEpoch: { type: "integer", const: scope.coordinatorEpoch },
            output: { type: "string", minLength: 1, maxLength: MAX_TEXT }
          }
        }
      }
    ];
  }
  if (scope.role === "delivery") {
    return [{
      name: "claim_group_task",
      description: "Atomically claim the execution's pre-authorized FIFO task in the current group run.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        required: ["callId", "taskId", "coordinatorEpoch"],
        properties: {
          callId: CALL_ID_SCHEMA,
          taskId: { type: "string", const: scope.taskId },
          coordinatorEpoch: { type: "integer", const: scope.coordinatorEpoch }
        }
      }
    }];
  }
  return [];
}

let writeQueue: Promise<void> = Promise.resolve();

async function readActions(file: string): Promise<ControlActionEnvelope[]> {
  try {
    const raw = JSON.parse(await fs.readFile(file, "utf8")) as unknown;
    return Array.isArray(raw) ? raw as ControlActionEnvelope[] : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function stageAction(context: CapabilityContext, action: ControlAction, id: string): Promise<{ envelope: ControlActionEnvelope; result?: unknown; receiptId?: string }> {
  if (context.bridgePath || context.bridgePort !== undefined) {
    return stageActionOverBridge(context, action, id);
  }
  if (context.requireBridge) throw new Error("control bridge is unavailable");
  // Standalone MCP tests intentionally exercise the tool schema without an
  // orchestrator process. Production invocations always provide a bridge, so
  // this fallback never grants a child direct authority over project state.
  const envelope: ControlActionEnvelope = {
    projectId: context.projectId,
    agent: context.agent,
    invocationId: context.invocationId,
    callId: id,
    stateVersion: context.stateVersion,
    capabilityHash: hashCapability(context.secret),
    ...(context.expiresAt ? { expiresAt: context.expiresAt } : {}),
    receivedAt: new Date().toISOString(),
    action
  };
  const operation = writeQueue.then(async () => {
    const current = await readActions(context.stagingPath);
    const existing = current.find((item) => item.callId === id);
    if (existing) {
      if (!sameControlActionRequest(existing.action, action)) throw new Error("callId was already used for a different action");
      return { envelope: existing };
    }
    const lockedDecision = current.find((item) => controlDecisionsConflict(item.action, action));
    if (lockedDecision) {
      if (sameDecision(lockedDecision.action, action)) return { envelope: lockedDecision };
      throw new Error("the invocation decision is already locked");
    }
    const next = [...current, envelope].sort((left, right) =>
      Number(isControlDecision(left.action)) - Number(isControlDecision(right.action))
    );
    await fs.mkdir(path.dirname(context.stagingPath), { recursive: true });
    const temporary = `${context.stagingPath}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, { encoding: "utf8", mode: 0o600, flag: "wx" });
    await fs.rename(temporary, context.stagingPath);
    return { envelope };
  });
  writeQueue = operation.then(() => undefined, () => undefined);
  return operation;
}

function agentGitAction(name: typeof TOOL_NAMES[number], args: Record<string, unknown>): ControlAction {
  if (name === "git_revert") return parseGitRevertRequest(args, true);
  if (name === "git_log" || name === "git_show" || name === "git_diff") return parseGitInspectionRequest(name, args, true);
  if (name === "git_get_operation") return { tool: name, operationId: text(args.operationId, "operationId", 1024) };
  if (name === "git_reconcile_push") {
    if (args.retry !== undefined && typeof args.retry !== "boolean") throw new Error("retry must be a boolean explicitly selected by the Agent");
    if (args.historical !== undefined && typeof args.historical !== "boolean") throw new Error("historical must be a boolean explicitly selected by the Agent");
    if (args.historical === true && args.retry === true) throw new Error("Historical push observation cannot retry an expired task or ownership epoch");
    return { tool: name, operationId: text(args.operationId, "operationId", 1024), ...(args.retry === undefined ? {} : { retry: args.retry }), ...(args.historical === undefined ? {} : { historical: args.historical }) };
  }
  if (name === "git_push") return { tool: name, ...(args.reason === undefined ? {} : { reason: text(args.reason, "reason") }) };
  if (name === "github_create_pr") return {
    tool: name,
    base: text(args.base, "base", 256),
    title: text(args.title, "title", 250),
    body: text(args.body, "body", 60_000)
  };
  if (name === "github_get_pr") {
    if (Object.keys(args).some(key => !["callId", "providerNumber", "sourceOperationId"].includes(key))) throw new Error("Unexpected PR observation field");
    return { tool: name,
      ...(args.sourceOperationId === undefined ? {} : { sourceOperationId: text(args.sourceOperationId, "sourceOperationId", 1024) }),
      ...(args.providerNumber === undefined ? {} : { providerNumber: positiveInteger(args.providerNumber, "providerNumber") }) };
  }
  if (name === "github_merge_pr" || name === "github_close_pr") return {
    tool: name,
    providerNumber: positiveInteger(args.providerNumber, "providerNumber"),
    ...(args.reason === undefined ? {} : { reason: text(args.reason, "reason") })
  };
  if (name === "git_prepare_conflict") return { tool: name };
  throw new Error("Agent Git tool is not available");
}

function sameDecision(existing: ControlAction, candidate: ControlAction): boolean {
  if (existing.tool === "coordinate_agent_receipt" && candidate.tool === "coordinate_agent_receipt") return JSON.stringify(existing) === JSON.stringify(candidate);
  if (existing.tool === "coordinate_group_task" && candidate.tool === "coordinate_group_task") return JSON.stringify(existing) === JSON.stringify(candidate);
  if (existing.tool === "route_to_agent" && candidate.tool === "route_to_agent") {
    return existing.target === candidate.target;
  }
  if (existing.tool === "complete_project" && candidate.tool === "complete_project") {
    return true;
  }
  if (existing.tool === "request_user" && candidate.tool === "request_user") {
    return JSON.stringify(existing) === JSON.stringify(candidate);
  }
  if (existing.tool === "apply_workflow" && candidate.tool === "apply_workflow") {
    return existing.path === candidate.path;
  }
  if (existing.tool === "assign_group_tasks" && candidate.tool === "assign_group_tasks") {
    return existing.groupRunId === candidate.groupRunId &&
      existing.coordinatorEpoch === candidate.coordinatorEpoch &&
      JSON.stringify(existing.tasks) === JSON.stringify(candidate.tasks);
  }
  if (existing.tool === "claim_group_task" && candidate.tool === "claim_group_task") {
    return existing.taskId === candidate.taskId &&
      existing.coordinatorEpoch === candidate.coordinatorEpoch;
  }
  if (
    existing.tool === "request_group_integration" &&
    candidate.tool === "request_group_integration"
  ) {
    return existing.groupRunId === candidate.groupRunId &&
      existing.coordinatorEpoch === candidate.coordinatorEpoch &&
      existing.integrationOwnerAgentId === candidate.integrationOwnerAgentId;
  }
  if (existing.tool === "complete_group" && candidate.tool === "complete_group") {
    return existing.groupRunId === candidate.groupRunId &&
      existing.coordinatorEpoch === candidate.coordinatorEpoch &&
      existing.output === candidate.output;
  }
  return false;
}

function matchingGroupIdentity(
  args: Record<string, unknown>,
  scope: CollaborationControlScope
): { groupRunId: string; coordinatorEpoch: number } {
  const groupRunId = text(args.groupRunId, "groupRunId", 256);
  const coordinatorEpoch = positiveInteger(args.coordinatorEpoch, "coordinatorEpoch");
  if (groupRunId !== scope.groupRunId || coordinatorEpoch !== scope.coordinatorEpoch) {
    throw new Error("group identity or coordinator epoch is stale");
  }
  return { groupRunId, coordinatorEpoch };
}

function collaborationAction(
  context: CapabilityContext,
  name: typeof TOOL_NAMES[number],
  args: Record<string, unknown>
): ControlAction {
  const scope = context.collaboration;
  if (!scope) throw new Error("collaboration control scope is missing");
  if (scope.role === "scoped-leader" || scope.role === "scoped-main") {
    if (scope.worktreeClosingOnly && (name !== "coordinate_group_task" ||
      !["close_worktree", "escalate"].includes(String(args.operation)) || args.repairNodeId !== undefined)) {
      throw new Error("Completed group permits only original-owner closing coordination");
    }
    if (name === "route_to_agent") {
      const target = text(args.target, "target", 256);
      if ((!scope.sourceArrivalRequestId && !scope.sourceOuterNodeRunId) || !scope.routeCandidates.includes(target)) throw new Error("route is outside the current scoped graph node");
      return { tool: name, target, rationale: text(args.rationale, "rationale"),
        ...(args.assignment === undefined ? {} : { assignment: text(args.assignment, "assignment") }) };
    }
    if (name === "apply_workflow") {
      if (!scope.allowReconfiguration || args.path !== "workflow.json") throw new Error("scoped apply_workflow is not allowed");
      return { tool: name, path: "workflow.json", rationale: text(args.rationale, "rationale") };
    }
    if (name === "coordinate_group_task") {
      if (args.repairNodeId === "" || args.repairNodeId === null) {
        args = { ...args }; delete args.repairNodeId;
      }
      const identity = matchingGroupIdentity(args, scope);
      const arrivalRequestId = text(args.arrivalRequestId, "arrivalRequestId", 256);
      if (!scope.failedArrivalRequestIds.includes(arrivalRequestId))
        throw new CollaborationStateError("INVALID_STATE_TRANSITION", "arrivalRequestId must be copied from this invocation's current retained failures; do not substitute an execution, incident or task ID.",
          { invalidField: "arrivalRequestId", availableArrivalRequestIds: scope.failedArrivalRequestIds });
      const option = scope.recoveryOptions?.find(item => item.arrivalRequestId === arrivalRequestId);
      // Eligibility hints describe the turn's start. A live bridge must judge
      // fresh S facts if an authorized reconciliation settled a prerequisite
      // in this same turn. Fixed role/identity bounds still apply locally.
      const hasLiveBridge = !!(context.bridgePath || context.bridgePort !== undefined);
      if (!recoveryOperations(scope, arrivalRequestId, !hasLiveBridge).includes(String(args.operation)))
        throw new CollaborationStateError("INVALID_STATE_TRANSITION", option?.blockedOperations[String(args.operation) as keyof typeof option.blockedOperations] ??
          "This operation is unavailable for the exact current failure and role. Choose one of allowedOperations; skip is Main-only.",
          { invalidField: "operation", arrivalRequestId, allowedOperations: recoveryOperations(scope, arrivalRequestId), ...(option ? { recoveryOptions: [option] } : {}) });
      if (args.repairNodeId !== undefined && (args.operation !== "retry" || !hasLiveBridge && option && !option.repairNodeIds.includes(String(args.repairNodeId))))
        throw new CollaborationStateError("INVALID_STATE_TRANSITION", "repairNodeId is only for a final-conflict retry. Copy an eligible repairNodeIds node for this arrival, or omit the optional field for an ordinary retry or escalation.",
          { invalidField: "repairNodeId", repairNodeIds: option?.repairNodeIds ?? [] });
      let closing: Extract<ControlAction, { tool: "coordinate_group_task" }>["closing"];
      if (args.operation === "close_worktree") {
        if (!args.closing || typeof args.closing !== "object" || Array.isArray(args.closing) || args.repairNodeId !== undefined) throw new Error("Explicit closing requires its identified owner/epoch/files and omits repairNodeId");
        const value = args.closing as Record<string, unknown>;
        if (Object.keys(value).some(key => !["executionId", "ownershipEpoch", "paths"].includes(key)) || !Array.isArray(value.paths) ||
          !value.paths.length || value.paths.length > 1000 || value.paths.some(file => typeof file !== "string" || !file || file.length > 4096) ||
          new Set(value.paths).size !== value.paths.length) throw new Error("Explicit closing requires an exact nonempty file manifest");
        closing = { executionId: text(value.executionId, "closing.executionId", 256), ownershipEpoch: positiveInteger(value.ownershipEpoch, "closing.ownershipEpoch"), paths: value.paths as string[] };
      } else if (args.closing !== undefined) throw new Error("Ordinary coordination cannot carry closing permissions");
      return { tool: name, ...identity, arrivalRequestId, operation: args.operation as "retry" | "escalate" | "skip" | "close_worktree", rationale: text(args.rationale, "rationale"),
        ...(closing ? { closing } : {}),
        ...(args.repairNodeId === undefined ? {} : { repairNodeId: text(args.repairNodeId, "repairNodeId", 256) }) };
    }
    if (name === "request_group_integration") {
      return { tool: name, ...matchingGroupIdentity(args, scope), integrationOwnerAgentId: text(args.integrationOwnerAgentId, "integrationOwnerAgentId", 128) };
    }
    if (name === "complete_group") {
      return { tool: name, ...matchingGroupIdentity(args, scope), output: text(args.output, "output") };
    }
    if (scope.role === "scoped-main" && name === "request_user") {
      if (!context.allowUserIntervention) throw new Error("request_user is disabled by this Workflow");
      return { tool: name, message: text(args.message, "message"), rationale: text(args.rationale, "rationale"),
        ...(args.context === undefined ? {} : { context: text(args.context, "context") }) };
    }
    if (name === "assign_group_tasks") {
      const action = collaborationAction({ ...context, collaboration: { ...scope, role: "leader" } }, name, args);
      if (action.tool !== name || action.tasks.some((task) => !scope.memberNodeIds.includes(task.taskId) || task.dependencyTaskIds?.length || task.assigneeAgentId)) {
        throw new Error("Scoped planning cannot invent dependencies, outside Agents or new graph nodes");
      }
      return action;
    }
    throw new Error("scoped Leader tool is not allowed");
  }
  if (scope.role === "leader") {
    if (name === "assign_group_tasks") {
      const identity = matchingGroupIdentity(args, scope);
      if (!Array.isArray(args.tasks) || args.tasks.length < 1) {
        throw new Error("tasks must contain at least one entry");
      }
      const tasks = args.tasks.map((value, index) => {
        if (!value || typeof value !== "object" || Array.isArray(value)) {
          throw new Error(`tasks[${index}] is invalid`);
        }
        const task = value as Record<string, unknown>;
        return {
          taskId: text(task.taskId, `tasks[${index}].taskId`, 256),
          assignment: text(task.assignment, `tasks[${index}].assignment`),
          ...(task.assigneeAgentId === undefined
            ? {}
            : { assigneeAgentId: text(task.assigneeAgentId, `tasks[${index}].assigneeAgentId`, 128) }),
          ...(task.dependencyTaskIds === undefined
            ? {}
            : { dependencyTaskIds: stringList(task.dependencyTaskIds, `tasks[${index}].dependencyTaskIds`, 100) })
        };
      });
      return { tool: name, ...identity, tasks };
    }
    if (name === "request_group_integration") {
      return {
        tool: name,
        ...matchingGroupIdentity(args, scope),
        integrationOwnerAgentId: text(
          args.integrationOwnerAgentId,
          "integrationOwnerAgentId",
          128
        )
      };
    }
    if (name === "complete_group") {
      return {
        tool: name,
        ...matchingGroupIdentity(args, scope),
        output: text(args.output, "output")
      };
    }
    throw new Error("leader collaboration tool is not allowed");
  }
  if (scope.role === "delivery" && name === "claim_group_task") {
    const coordinatorEpoch = positiveInteger(args.coordinatorEpoch, "coordinatorEpoch");
    const taskId = text(args.taskId, "taskId", 256);
    if (coordinatorEpoch !== scope.coordinatorEpoch || taskId !== scope.taskId) {
      throw new Error("task identity or coordinator epoch is stale");
    }
    return { tool: name, taskId, coordinatorEpoch };
  }
  throw new Error("delivery collaboration tool is not allowed");
}

async function requestBridge(
  context: CapabilityContext,
  payload: Record<string, unknown>,
  id: string
): Promise<{ ok?: unknown; envelope?: unknown; result?: unknown; stateResult?: unknown; receiptId?: unknown; error?: unknown }> {
  return new Promise((resolve, reject) => {
    const socket = context.bridgePath
      ? net.createConnection(context.bridgePath)
      : net.createConnection({
          host: context.bridgeHost ?? "127.0.0.1",
          port: context.bridgePort!
        });
    let buffered = "";
    let settled = false;
    let timeout: ReturnType<typeof setTimeout>;
    const fail = (message: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      socket.destroy();
      reject(new Error(message));
    };
    const touch = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fail("control bridge did not respond"), 5_000);
    };
    // This is transport silence, not an overall operation deadline. Exact
    // pending frames keep one request alive; the native tool budget and its
    // current capability/cancellation still bound the Agent's operation.
    touch();
    socket.setEncoding("utf8");
    socket.once("error", (error) => {
      fail(`control bridge unavailable: ${error.message}`);
    });
    socket.once("close", () => fail("control bridge closed before returning the current result"));
    socket.once("end", () => fail("control bridge ended before returning the current result"));
    socket.on("data", (chunk: string) => {
      if (settled) return;
      buffered += chunk;
      for (;;) {
        const newline = buffered.indexOf("\n");
        if (newline < 0) return;
        const line = buffered.slice(0, newline);
        buffered = buffered.slice(newline + 1);
        let frame: { protocol?: unknown; callId?: unknown; pending?: unknown; ok?: unknown; envelope?: unknown; result?: unknown; stateResult?: unknown; receiptId?: unknown; error?: unknown };
        try { frame = JSON.parse(line); }
        catch { fail("control bridge returned invalid JSON"); return; }
        if (!frame || typeof frame !== "object") { fail("control bridge returned invalid JSON"); return; }
        if (frame.protocol !== undefined) {
          if (frame.protocol !== CONTROL_BRIDGE_PROGRESS_PROTOCOL || frame.callId !== id || frame.pending !== true ||
            frame.ok !== undefined || frame.envelope !== undefined || frame.result !== undefined || frame.receiptId !== undefined || frame.error !== undefined) {
            fail("control bridge pending frame does not match the current request"); return;
          }
          touch(); continue;
        }
        settled = true;
        clearTimeout(timeout);
        socket.end();
        resolve(frame);
        return;
      }
    });
    socket.once("connect", () => {
      socket.write(`${JSON.stringify({ capability: context.secret, callId: id, ...payload,
        progressProtocol: CONTROL_BRIDGE_PROGRESS_PROTOCOL })}\n`);
    });
  });
}

async function stageActionOverBridge(
  context: CapabilityContext,
  action: ControlAction,
  id: string
): Promise<{ envelope: ControlActionEnvelope; result?: unknown; receiptId?: string }> {
  const response = await requestBridge(context, { action }, id);
  if (response.ok !== true || !response.envelope || typeof response.envelope !== "object") {
    throw new BridgeActionRejectedError(
      bridgeActionRejection(response.error, context.stateVersion)
    );
  }
  const envelope = response.envelope as ControlActionEnvelope;
  if (envelope.projectId !== context.projectId || envelope.agent !== context.agent ||
    envelope.invocationId !== context.invocationId || envelope.stateVersion !== context.stateVersion ||
    GIT_TOOL_NAMES.has(action.tool as typeof TOOL_NAMES[number]) && envelope.callId !== id) {
    throw new Error("control bridge result does not match the current request authority");
  }
  if (response.receiptId !== undefined && (typeof response.receiptId !== "string" || !/^[a-f0-9]{64}$/.test(response.receiptId))) {
    throw new Error("control bridge result has an invalid receipt identity");
  }
  return { envelope: response.envelope as ControlActionEnvelope,
    ...(typeof response.receiptId === "string" ? { receiptId: response.receiptId } : {}),
    ...(response.result === undefined ? {} : { result: response.result }) };
}

function bridgeActionRejection(value: unknown, stateVersion: number, stateRequest = false): ControlActionRejection {
  const record = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
  const files = record?.authoritativeFiles &&
    typeof record.authoritativeFiles === "object" &&
    !Array.isArray(record.authoritativeFiles)
    ? record.authoritativeFiles as Record<string, unknown>
    : undefined;
  return {
    code: typeof record?.code === "string" && record.code
      ? record.code
      : "CONTROL_ACTION_REJECTED",
    message: typeof record?.message === "string" && record.message
      ? record.message
      : typeof value === "string" && value
        ? value
        : "control bridge rejected the action",
    ...(typeof record?.invalidField === "string" && record.invalidField
      ? { invalidField: record.invalidField } : stateRequest ? {} : { invalidField: "action" }),
    ...(typeof record?.currentRevision === "number" &&
      Number.isSafeInteger(record.currentRevision) && record.currentRevision >= 1
      ? { currentRevision: record.currentRevision } : stateRequest ? {} : { currentRevision: stateVersion }),
    ...(typeof record?.workflowRevision === "number" &&
      Number.isSafeInteger(record.workflowRevision) && record.workflowRevision >= 1
      ? { workflowRevision: record.workflowRevision }
      : {}),
    ...(record?.stateDetails && typeof record.stateDetails === "object" && !Array.isArray(record.stateDetails) &&
      !containsCredentialMaterial(JSON.stringify(record.stateDetails)) ? { stateDetails: record.stateDetails as Record<string, unknown> } : {}),
    ...(typeof record?.operationId === "string" && record.operationId.trim() && record.operationId.length <= 1_024 &&
      !containsCredentialMaterial(record.operationId)
      ? { operationId: record.operationId } : {}),
    ...(["completed", "remote_success_local_pending"].includes(String(record?.status))
      ? { status: record!.status as ControlActionRejection["status"] } : {}),
    ...(["synchronization_pending", "journal_finalization_pending", "synchronized", "not_required"].includes(String(record?.localStage))
      ? { localStage: record!.localStage as ControlActionRejection["localStage"] } : {}),
    ...(typeof record?.reconcileRequired === "boolean" ? { reconcileRequired: record.reconcileRequired } : {}),
    ...(typeof record?.retryable === "boolean" ? { retryable: record.retryable } : {}),
    ...(!stateRequest || typeof files?.definition === "string" && !!files.definition &&
      typeof files?.currentState === "string" && !!files.currentState ? { authoritativeFiles: {
      definition: typeof files?.definition === "string" && files.definition
        ? files.definition
        : AUTHORITATIVE_WORKFLOW_REFERENCES.definition,
      currentState: typeof files?.currentState === "string" && files.currentState
        ? files.currentState
        : AUTHORITATIVE_WORKFLOW_REFERENCES.currentState
    } } : {})
  };
}

function rejectionForError(error: unknown, stateVersion: number, stateRequest = false): ControlActionRejection {
  if (error instanceof BridgeActionRejectedError) return error.rejection;
  return bridgeActionRejection({ message: error instanceof Error ? error.message : String(error),
    ...(error instanceof CollaborationStateError ? { code: error.code, stateDetails: error.details,
      ...(typeof error.details.invalidField === "string" ? { invalidField: error.details.invalidField } : {}) } : {}) }, stateVersion, stateRequest);
}

function rpcToolError(
  id: JsonRpcRequest["id"],
  rejection: ControlActionRejection
): void {
  const structuredContent = { error: rejection };
  rpcResult(id, {
    isError: true,
    structuredContent,
    // Some native MCP bridges expose only text content to the model. Keep the
    // exact structured contract there as JSON as well, instead of flattening
    // it to a Harness-specific message or dropping fields.
    content: [{ type: "text", text: JSON.stringify(structuredContent) }]
  });
}

async function handle(request: JsonRpcRequest, context: CapabilityContext): Promise<void> {
  if (request.id === undefined || !request.method) return;
  if (request.method === "initialize") {
    rpcResult(request.id, { protocolVersion: "2024-11-05", capabilities: { tools: { listChanged: false } }, serverInfo: { name: "scienceevolve-orchestration-control", version: "1.0.0" } });
    return;
  }
  if (request.method === "tools/list") {
    rpcResult(request.id, { tools: toolsFor(context) });
    return;
  }
  if (request.method !== "tools/call") {
    rpcError(request.id, -32601, `Unsupported method: ${request.method}`);
    return;
  }
  const params = request.params ?? {};
  const name = typeof params.name === "string" ? params.name : "";
  if (PROJECT_STATE_TOOL_NAMES.includes(name as typeof PROJECT_STATE_TOOL_NAMES[number])) {
    try {
      if (!context.projectState || !toolsFor(context).some(tool => tool.name === name) || !(context.bridgePath || context.bridgePort !== undefined))
        throw new Error("Project state tools are unavailable for this invocation");
      const args = params.arguments && typeof params.arguments === "object" && !Array.isArray(params.arguments)
        ? params.arguments as Record<string, unknown> : {};
      const stateRequest = projectStateToolRequest(name, args);
      const response = await requestBridge(context, { stateRequest }, `state:${request.id}`);
      if (response.ok !== true || response.stateResult === undefined)
        throw new BridgeActionRejectedError(bridgeActionRejection(response.error, context.stateVersion, true));
      rpcResult(request.id, { content: [{ type: "text", text: JSON.stringify(response.stateResult) }], structuredContent: response.stateResult });
    } catch (error) {
      rpcToolError(request.id, rejectionForError(error, context.stateVersion, true));
    }
    return;
  }
  if (!TOOL_NAMES.includes(name as typeof TOOL_NAMES[number])) {
    rpcToolError(request.id, bridgeActionRejection({
      code: "CONTROL_TOOL_NOT_AVAILABLE",
      message: `Unknown tool: ${name}`,
      invalidField: "name"
    }, context.stateVersion));
    return;
  }
  const args = params.arguments && typeof params.arguments === "object" ? params.arguments as Record<string, unknown> : {};
  try {
    if (context.worktreeClosing !== undefined && !worktreeClosingActionAllowed({ ...args, tool: name })) {
      throw new Error("This closing turn permits only its own finish receipt and necessary closing Git operations; git_push requires your own reason");
    }
    if (context.terminalPushCoordination !== undefined) {
      assertTerminalPushCoordinationControl(context);
      if (!terminalPushCoordinationActionAllowed(context.terminalPushCoordination, { ...args, tool: name }))
        throw new Error("This coordinator can only finish its own turn or decide its exact assigned receipt issue");
      const fields = name === "finish_task" ? ["callId", "summary", "memory"] : name === "request_user"
        ? ["callId", "message", "rationale", "context"] : ["callId", "incidentId", "operation", "rationale"];
      if (Object.keys(args).some(field => !fields.includes(field))) throw new Error("Unexpected coordinator action field");
    }
    if (context.terminalPushObservation && !terminalPushObservationActionAllowed(
      context.terminalPushObservation, { ...args, tool: name }
    )) {
      throw new Error("This receipt turn permits only finish_task and historical observation of its exact retained push without retry");
    }
    if (name === "request_user" && !context.allowUserIntervention) {
      throw new Error("User requests are not authorized in this invocation. Honor the project policy: when user intervention is disabled, choose reasonable assumptions, continue research without waiting for clarification, and document missing information and limitations in Memory and the final deliverable.");
    }
    const candidates = context.kind === "main"
      ? context.mainCapabilities?.routeCandidates ?? context.candidates
      : context.candidates;
    const canComplete = context.kind === "main"
      ? context.mainCapabilities?.canComplete ?? context.canComplete
      : context.canComplete;
    const canRequestUser = context.kind === "main"
      ? context.allowUserIntervention && (context.mainCapabilities?.canRequestUser ?? true)
      : false;
    const canReconfigure = context.kind === "main"
      ? context.mainCapabilities?.canReconfigure ?? (context.allowAgentOrchestrationReconfiguration === true || context.allowWorkflowReconfiguration === true)
      : false;
    const id = callId(args.callId);
    let action: ControlAction;
    if (name === "finish_task") {
      action = { tool: "finish_task", ...(args.summary === undefined ? {} : { summary: text(args.summary, "summary") }),
        ...(args.memory === undefined ? {} : { memory: text(args.memory, "memory") }) };
    } else if (name === "coordinate_agent_receipt") {
      if (!context.terminalPushCoordination || !terminalPushCoordinationActionAllowed(context.terminalPushCoordination, { ...args, tool: name }))
        throw new Error("Receipt coordination is not allocated to this invocation");
      action = { tool: "coordinate_agent_receipt", incidentId: text(args.incidentId, "incidentId", 1024),
        operation: args.operation as "retry" | "escalate", rationale: text(args.rationale, "rationale") };
    } else if (GIT_TOOL_NAMES.has(name as typeof TOOL_NAMES[number])) {
      if (context.kind !== "worker" || context.allowAgentGitActions !== true ||
        context.canonicalFinalIntegration && (["git_push", "git_reconcile_push", "git_prepare_conflict", "git_log", "git_show", "git_diff", "git_revert"].includes(name) || args.sourceOperationId !== undefined) ||
        context.worktreeClosing && args.sourceOperationId !== undefined)
        throw new Error("Agent Git tools are not allowed in this invocation");
      action = agentGitAction(name as typeof TOOL_NAMES[number], args);
    } else if (context.collaboration) {
      action = collaborationAction(context, name as typeof TOOL_NAMES[number], args);
    } else if (name === "route_to_agent") {
      const target = text(args.target, "target", 128);
      if (!candidates.includes(target) || (target === "finish" && context.allowFinishRoute !== true && context.mainCapabilities === undefined)) throw new Error("target is not a current route candidate");
      if (context.kind !== "main" && (context.decisionBy !== "agent" ||
        (context.scopedAgentRouting !== true && (candidates.length < 2 || target === "main" || target === "finish")))) {
        throw new Error("Worker route_to_agent is not allowed in this context");
      }
      const assignment = args.assignment === undefined
        ? undefined
        : text(args.assignment, "assignment", 20_000);
      const rationale = args.rationale === undefined ? undefined : text(args.rationale, "rationale");
      if (context.kind === "main" && !assignment &&
        !context.tasklessRouteTargets?.includes(target)) {
        throw new Error("Main route_to_agent requires a non-empty assignment for this target");
      }
      if (context.kind === "worker" && !rationale) throw new Error("Worker route_to_agent requires a non-empty rationale");
      action = { tool: "route_to_agent", target, ...(assignment === undefined ? {} : { assignment }), ...(rationale === undefined ? {} : { rationale }), ...(args.context === undefined ? {} : { context: text(args.context, "context") }), ...(Array.isArray(args.successCriteria) ? { successCriteria: args.successCriteria.map((value) => text(value, "successCriteria")) } : {}) };
    } else if (name === "publish_artifact") {
      if (args.replacesPath !== undefined && (context.kind !== "worker" || !context.allowAgentGitActions || context.collaboration || context.scopedAgentRouting)) {
        throw new Error("replacesPath is only available for your pending standalone Git publications");
      }
      action = { tool: "publish_artifact", path: await verifyArtifact(context, args.path), title: text(args.title, "title", 200), kind: text(args.kind, "kind", 120), description: text(args.description, "description", 4_000),
        ...(args.replacesPath === undefined ? {} : { replacesPath: safeProjectRelativePath(text(args.replacesPath, "replacesPath", MAX_PATH)) }) };
    } else if (name === "select_display") {
      if (context.kind !== "main" && !canComplete) throw new Error("select_display is not allowed in this context");
      const parseItem = (value: unknown): DisplayItem => {
        if (!value || typeof value !== "object") throw new Error("display item is invalid");
        const item = value as Record<string, unknown>;
        return { agent: text(item.agent, "display.agent", 128), path: relativeWorkspacePath(item.path), title: text(item.title, "display.title", 200) };
      };
      const items = Array.isArray(args.items) ? args.items.map(parseItem) : [];
      action = { tool: "select_display", primary: parseItem(args.primary), items };
    } else if (name === "request_user") {
      if (context.kind !== "main" || !canRequestUser) throw new Error("request_user is not allowed");
      action = { tool: "request_user", message: text(args.message, "message"), rationale: text(args.rationale, "rationale"), ...(args.context === undefined ? {} : { context: text(args.context, "context") }) };
    } else if (name === "apply_workflow") {
      if (context.kind !== "main" || !canReconfigure) {
        throw new Error("apply_workflow is not allowed");
      }
      const workflowPath = relativeWorkspacePath(args.path);
      const workflowFile = "workflow.json";
      if (workflowPath !== workflowFile) {
        throw new Error(`apply_workflow path must be ${workflowFile}`);
      }
      if (context.workflowAuthoringPath) {
        // A retained-session repair rotates invocation/capability identity,
        // while the logical management task keeps its original authoring area.
        // Trust the server-pinned path, never an Agent-selected proposal path.
        const workspace = await fs.realpath(context.workspacePath);
        const expected = path.resolve(context.workflowAuthoringPath);
        const relative = path.relative(workspace, expected).split(path.sep).join("/");
        const info = await fs.lstat(context.workflowAuthoringPath);
        if (!info.isFile() || info.isSymbolicLink() || info.nlink !== 1 ||
          !/^\.scienceevolve\/management\/[A-Za-z0-9][A-Za-z0-9._-]{0,159}\/proposal\/workflow\.json$/.test(relative) ||
          await fs.realpath(context.workflowAuthoringPath) !== expected) {
          throw new Error("workflow proposal does not match its invocation authoring authority");
        }
      } else await verifyArtifact(context, workflowPath);
      action = {
        tool: "apply_workflow",
        path: workflowPath,
        rationale: text(args.rationale, "rationale", 20_000)
      };
    } else {
      if (!canComplete) throw new Error("complete_project is not allowed in this context");
      action = { tool: "complete_project", rationale: text(args.rationale, "rationale", 20_000) };
    }
    const staged = await stageAction(context, action, id);
    const gitResult = agentGitResultSummary(action.tool, staged.result);
    rpcResult(request.id, { content: [{
      type: "text",
      text: controlResultDisplayText(staged.envelope, staged.result, staged.receiptId)
    }], ...(gitResult ? { structuredContent: { actionAccepted: true, git: gitResult, result: staged.result ?? null } } : {}) });
  } catch (error) {
    const rejection = rejectionForError(error, context.stateVersion);
    rpcToolError(request.id, rejection);
  }
}

async function main(): Promise<void> {
  const context = capabilityFromEnvironment();
  const input = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  let queue: Promise<void> = Promise.resolve();
  input.on("line", (line) => {
    queue = queue.then(async () => {
      try { await handle(JSON.parse(line) as JsonRpcRequest, context); }
      catch (error) { process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); }
    });
  });
  await new Promise<void>((resolve) => input.once("close", resolve));
  await queue;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  void main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}

/** Read the durable action staging file after the Codex process exits. */
export async function readStagedControlActions(file: string): Promise<ControlActionEnvelope[]> {
  return readActions(file);
}
