import type { RuntimeMcpToolDefinition } from "./harness-runtime/contracts.js";
import { PROJECT_STATE_KINDS, validateProjectStateRequest, type ProjectStateRequest } from "./project-state.js";

export const PROJECT_STATE_TOOL_NAMES = ["state_list", "state_get", "state_patch", "state_reconcile_pull", "state_request_main", "state_request_leader", "state_stop_agent"] as const;
const object = { type: "object", additionalProperties: false, required: ["kind", "id"], properties: {
  kind: { type: "string", enum: PROJECT_STATE_KINDS }, id: { type: "string", minLength: 1, maxLength: 1024 }
} };

export function projectStateTools(allowReconciliation = false, allowMainCoordination = false, allowAgentStop = false): RuntimeMcpToolDefinition[] {
  return [{ name: "state_stop_agent", description: "As Main, explicitly stop one Agent's exact current invocation and its registered local background jobs. Copy agentId and invocationId from current state. This tool waits for actual native stop confirmation or returns the real error. It preserves files, commits, task history and existing remote experiments; it does not mark work successful, reroute, retry or start another Agent. Choose any follow-up yourself. Reuse callId only for this exact stop request.",
    inputSchema: { type: "object", additionalProperties: false, required: ["agentId", "invocationId", "reason", "callId"], properties: {
      agentId: { type: "string", minLength: 1, maxLength: 256 }, invocationId: { type: "string", minLength: 1, maxLength: 256 },
      reason: { type: "string", minLength: 1, maxLength: 8192 }, callId: { type: "string", minLength: 1, maxLength: 256 }
    } } }, { name: "state_request_leader", description: "Explicitly send your message, exact tool error or assistance request to your current direct group Leader. The server selects the actual Leader from your live task, durably queues the message and reports its requestId. Queued does not mean received: the Leader's native input records reception separately. This sends only your request; state_patch never sends messages or requests help. Keep the returned requestId to inspect subsequent received/failed facts through state_get.",
    inputSchema: { type: "object", additionalProperties: false, required: ["message", "callId"], properties: {
      message: { type: "string", minLength: 1, maxLength: 8192 }, callId: { type: "string", minLength: 1, maxLength: 256 }
    } } }, { name: "state_list", description: "Return the complete metadata index of the current project's authoritative objects and your current write scope, without pagination or an entry-count cutoff. Start with {} or {kind}; this reads the latest index without a revision precondition. Detail bodies and history are not included. An optional snapshotId re-reads the same complete index; omit it if the snapshot expires. Read an exact objects[].object with state_get before a consequential decision or write. Identity and project are server-bound; file access settings do not expand state permissions.",
    inputSchema: { type: "object", additionalProperties: false, properties: {
      kind: { type: "string", enum: PROJECT_STATE_KINDS },
      snapshotId: { type: "string", description: "Omit for a fresh complete index. Reuse the returned snapshotId only to re-read that same index; it belongs to this project and live invocation." }
    } } },
  { name: "state_get", description: "Read one current authoritative object, core facts, business extensions, version and permissions. History is read only when explicitly requested. Copy object exactly from state_list.objects[].object; do not substitute a callId or invocationId, truncate an ID, or change its kind. historyLimit=0 and omission return no history; request historyLimit explicitly to read a history page, and the maximum per page is 100. Copy nextHistoryPage for stable history pagination while the object's core and version stay current. On Git projects core.runtime matches HTTP/SSE. Refresh before consequential decisions. Memory and exported files cannot override formal records or tool returns.",
    inputSchema: { type: "object", additionalProperties: false, required: ["object"], properties: {
      object, historyOffset: { type: "integer", minimum: 0, default: 0 },
      historyLimit: { type: "integer", minimum: 0, maximum: 100, default: 0, description: "Omit or use 0 for current object facts without history. Copy nextHistoryPage for more than 100 entries." },
      historyThroughSequence: { type: "integer", minimum: 0, description: "Copy from nextHistoryPage to keep history stable; omit on the first read." }
    } } },
  { name: "state_patch", description: "Explicitly update free-form business extensions on an object in your current role's write scope. Supply the exact state_get version and your reason. set replaces named extension values; remove deletes named extensions. Conflicts return the actual version for you to inspect and decide; nothing silently overwrites. This tool cannot modify core ownership, raw results, scheduler/lifecycle or PR/Memory/finish gates. Extension claims such as completed do not perform any action. Use existing formal tools for actual actions, and request the responsible Leader/Main for out-of-scope changes.",
    inputSchema: { type: "object", additionalProperties: false, required: ["object", "expectedVersion", "reason", "callId"], properties: {
      object, expectedVersion: { type: "string", pattern: "^[a-f0-9]{64}$" },
      set: { type: "object", additionalProperties: true }, remove: { type: "array", items: { type: "string", minLength: 1, maxLength: 256 } },
      reason: { type: "string", minLength: 1, maxLength: 8192 }, callId: { type: "string", minLength: 1, maxLength: 256 }
    } } },
  { name: "state_request_main", description: "As current scoped Leader, explicitly request project Main to judge a recorded complex key-state mechanism issue on a proven stopped execution in your group or nested descendants. Supply its exact state_get version and sourceIssueId from the group issues. This narrow entry uses the existing bounded management queue, FIFO, original Main Session and recovery budgets. It preserves unknown operations, original results, ownership and task gates; it neither repeats business work nor marks the issue resolved. Ordinary business failures still follow the existing Leader chain. Duplicate requests do not wake Main again.",
    inputSchema: { type: "object", additionalProperties: false, required: ["object", "expectedVersion", "sourceIssueId", "reason", "callId"], properties: {
      object: { ...object, properties: { ...object.properties, kind: { type: "string", const: "execution" } } },
      expectedVersion: { type: "string", pattern: "^[a-f0-9]{64}$" }, sourceIssueId: { type: "string", minLength: 1, maxLength: 1024 },
      reason: { type: "string", minLength: 1, maxLength: 8192 }, callId: { type: "string", minLength: 1, maxLength: 256 }
    } } },
  { name: "state_reconcile_pull", description: "As current Main, verify or reconcile a stopped retained execution's exact PR record, including an unfinished integrating report, using the original observed/finalized PR operation you select. The server queries only that provider PR, rechecks current object version, ownership, exact head/base and retained identities, and records the actual observation and your reason in the same state history. It never pushes, creates/merges a PR, changes reports, fabricates local synchronization, retries business work or completes a task. Unknown/missing/mismatched facts remain errors or unconfirmed for you to coordinate. Non-Main roles cannot use this formal correction action.",
    inputSchema: { type: "object", additionalProperties: false, required: ["object", "expectedVersion", "sourceOperationId", "reason", "callId"], properties: {
      object: { ...object, properties: { ...object.properties, kind: { type: "string", const: "execution" } } },
      expectedVersion: { type: "string", pattern: "^[a-f0-9]{64}$" }, sourceOperationId: { type: "string", minLength: 1, maxLength: 1024 },
      reason: { type: "string", minLength: 1, maxLength: 8192 }, callId: { type: "string", minLength: 1, maxLength: 256 }
    } } }].filter(tool => (allowReconciliation || tool.name !== "state_reconcile_pull") && (allowMainCoordination || tool.name !== "state_request_main") && (allowAgentStop || tool.name !== "state_stop_agent"))
    .map(tool => ({ ...tool, annotations: { readOnlyHint: ["state_list", "state_get"].includes(tool.name), destructiveHint: tool.name === "state_stop_agent", openWorldHint: false } }));
}

export function projectStateToolRequest(name: string, args: Record<string, unknown>): ProjectStateRequest {
  if (!PROJECT_STATE_TOOL_NAMES.includes(name as typeof PROJECT_STATE_TOOL_NAMES[number]) || Object.hasOwn(args, "operation"))
    throw new Error("Invalid state tool or unexpected operation argument");
  return validateProjectStateRequest({ operation: name === "state_stop_agent" ? "stop_agent" : name === "state_request_leader" ? "request_leader" : name === "state_list" ? "list" : name === "state_get" ? "get"
    : name === "state_reconcile_pull" ? "reconcile_pull" : name === "state_request_main" ? "request_main" : "patch", ...args });
}
