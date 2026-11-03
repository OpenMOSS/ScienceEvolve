/** Approval rules do not select Claude's tool collection (`--tools default`).
 * dontAsk works for service accounts including root; bypassPermissions is
 * rejected by the native CLI for root. Explicit native rules are needed:
 * Claude does not interpret a bare '*' as permission to run Bash. */
export function claudeNativeToolApprovals(namespaces: readonly string[]): string[] {
  return ["Read", "Glob", "Grep", "Bash", "Write", "Edit", "NotebookEdit", "Agent", "Task", "TodoWrite",
    "TaskCreate", "TaskGet", "TaskUpdate", "TaskList", "TaskOutput", "TaskStop", "EnterPlanMode", "ExitPlanMode",
    "WebSearch", "WebFetch", "ToolSearch", "AskUserQuestion", "Skill", "CronCreate", "CronList", "CronDelete",
    ...[...new Set(namespaces)].map(namespace => `mcp__${namespace}__*`)];
}
