import { AGENT_PERMISSION_METADATA } from "./agent-permission-metadata.js";

/** Exact fixed rules used by the workflow runtime and its read-only preview. */
export const PERMISSION_PROMPTS: Record<keyof typeof AGENT_PERMISSION_METADATA, string> = {
  workspace: [
    "OpenFARS permission mode: workspace.",
    `File modification scope: ${AGENT_PERMISSION_METADATA.workspace.label}.`,
    "Writes are limited to the worktree assigned to this task; reads follow the injected authorized roots.",
    "Use the available Shell for project reads (ls, cat, rg); write only inside your assigned worktree.",
    "Perform state-changing workspace operations only through the injected OpenFARS MCP tools."
  ].join(" "),
  compute: [
    "OpenFARS permission mode: compute.",
    `File modification scope: ${AGENT_PERMISSION_METADATA.compute.label}.`,
    "Host-authorized reads may use the service-user tree subject to operating-system access.",
    "Writes are limited to explicitly registered worktrees for this project; other projects and OpenFARS state are forbidden.",
    "Route filesystem writes through the descriptor-relative OpenFARS broker. Business tools are selected separately; this scope grants no experimental capability."
  ].join(" "),
  yolo: [
    "OpenFARS permission mode: yolo.",
    `File modification scope: ${AGENT_PERMISSION_METADATA.yolo.label}.`,
    "The CLI's native permission mode remains authoritative.",
    "Keep all actions scoped to this project and never expose credentials or hidden reasoning."
  ].join(" ")
};
