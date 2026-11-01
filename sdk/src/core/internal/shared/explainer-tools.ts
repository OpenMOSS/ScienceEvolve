export const EXPLAINER_MCP_NAME = "openfars-project-explainer";
export const EXPLAINER_CONTEXT_SECTIONS = ["overview", "draft", "drafts", "agent", "catalog", "project", "workflow", "evidence", "schema"] as const;
export const EXPLAINER_ACTION_KINDS = ["draft.created", "draft.updated", "draft.saved", "draft.undone", "drafts.deleted", "workflow.submitted", "projects.started"] as const;
export function explainerToolNames(capabilities: { startProjects: boolean; submitWorkflow: boolean }) {
  return ["get_context", "create_draft", "update_draft", "update_saved_draft", "save_draft", "undo_draft", "delete_drafts",
    ...(capabilities.startProjects ? ["start_projects"] : []), ...(capabilities.submitWorkflow ? ["submit_workflow_adjustment"] : [])];
}
export const EXPLAINER_DRAFT_FIELD_GUIDANCE = {
  requirement: "Research brief passed to the workflow's research Agents after launch: the scientific question, inputs, research constraints, deliverables and acceptance criteria. It is not an instruction for this assistant to build or edit a workflow. Preserve it on configuration-only edits. Change it only when the user changes the research task itself.",
  orchestration: "Workflow design: Agent identities/count, collaboration groups, parallelism, nesting, routing, loops and termination. Implement requests about these here instead of appending them to requirement.",
  agents: "Agent configuration: responsibilities/instructions, Harness, model, gateway, tools and permissions. Write instructions for research execution after launch, not for this assistant's draft-editing role. Configuration requests belong here, not in the research brief.",
  git: "Git mechanism and repository preferences; these configure execution and are not research objectives."
} as const;
/** Only the invocation-bound loopback capability may accompany an Explainer. */
export function isExplainerMcp(server: { name: string; url?: string }): boolean {
  if (server.name !== EXPLAINER_MCP_NAME || !server.url) return false;
  try {
    const url = new URL(server.url);
    return url.protocol === "http:" && url.hostname === "127.0.0.1" && !!url.port &&
      /^\/mcp\/[a-f0-9]{48}$/.test(url.pathname) && !url.username && !url.password && !url.search && !url.hash;
  } catch { return false; }
}
