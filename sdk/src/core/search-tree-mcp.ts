import { zodToJsonSchema } from "zod-to-json-schema";
import { searchTreeRequestSchema, SearchTreeStore } from "./search-tree.js";
import type { AgentRunRequest } from "./types.js";
import type { RuntimeMcpToolDefinition } from "./harness-runtime/contracts.js";

export function searchTreeTools(): RuntimeMcpToolDefinition[] {
  return [{ name: "search_tree", description: "Read the optional project search tree, or explicitly register/update/delete a candidate. Start with overview, then read only relevant nodes/subtrees/history. Directions are user-owned. A write needs the current revision and a stable requestId; reuse it only for the exact same request. This records attributed research claims, never runs experiments, routes tasks, pushes Git or proves success. Query operations do not commit.",
    inputSchema: zodToJsonSchema(searchTreeRequestSchema, { $refStrategy: "none" }) as Record<string, unknown> }];
}

export async function requestInvocationSearchTree(request: AgentRunRequest, value: unknown): Promise<unknown> {
  if (!request.project.searchTree) throw new Error("Search tree is not enabled for this project");
  if (!request.onProjectStateRequest) throw new Error("Search tree invocation authority is unavailable");
  await request.onProjectStateRequest({ operation: "list" });
  const executionId = request.executionContext && "executionId" in request.executionContext
    ? request.executionContext.executionId : request.taskSessionId ?? request.project.activeAgentExecution?.id;
  return new SearchTreeStore(request.project.id, request.projectPath, request.project.git?.enabled === true).request({
    kind: "agent", agentId: request.agent, invocationId: request.invocationId,
    ...(executionId ? { executionId } : {})
  }, value);
}
