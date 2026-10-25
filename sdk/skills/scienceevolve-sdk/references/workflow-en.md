# workflow.json contract and design rules

[← Back to SDK README](../../../README.md) · **English** | [简体中文](workflow.md)

## Top level and Agents

Startup configurations use agents, orchestration, and git, optionally skillDefinitions, mcpDefinitions, inputs, and inputDescription. Relative materials resolve from the workflow file's directory. Explicit CLI/API inputs override corresponding defaults. Outer schemaVersion: 2 may wrap a preset; do not invent a version field. Unknown fields are rejected. Titles, natural-language requirements, workspace, dataDir, and executable paths are not workflow fields.

agents is keyed by Agent name. orchestration.agents is an array of `{ "name", "template", "description"? }`. Keep exactly one main with the main template. New roles usually use general, or built-in idea/execution/writing/review templates. Adding/removing roles requires consistent updates to both lists and all routes, decisionPlans, input, termination, and Loop references.

| Agent field | Usage |
| --- | --- |
| model | Actual available ID; profile defaults do not override it. |
| harness | codex / pi / dsh / claude-code / hermes; install Hermes ACP/MCP dependencies separately. |
| proxy | Deprecated compatibility field removed by main normalization; omit in new files. Configure networking in the host. |
| gatewayReasoningOption | Model-specific option ID such as high/xhigh, requiring a mapped and tested gateway combination; unused for native OAuth. |
| instructions | Role responsibilities and executable handoff rules. |
| skills / autoSkills | Fixed / on-demand candidate lists; explicitly [] when unused. |
| mcpServers | MCP list, or [] when unused. |
| permission | workspace / compute / yolo; choose supported file access, without implicitly granting experiment tools. |
| experimentMcp | Explicit SII tools; also requires host sii configuration, exposed only on business Worker turns. |
| webSearch | Adapter-dependent search enablement. |
| sessionPersistence | Session reuse; fixed on for Main. |
| decisionBy | main or agent; fixed to main for Main. |

Prompts do not grant unsupported capabilities. Codex Git-off workspace still has shell. Claude Code workspace has no Bash; use compute or task-necessary yolo for scripts. Non-yolo Git-on resident policy is stricter than Git-off shell access.

## Engine and workspace

Shared-directory research uses `git: {"enabled":false}` and optionally orchestration.schemaVersion: 2, directly supported by main. v3 requires Git-on; Git-off rejects collaboration groups.

Git-on uses `git:{"enabled":true,"repositoryName":"ACTUAL_NAME","repositoryVisibility":"private"}` plus v3 scopedWorkflow, or supported v2 normalization. It creates real GitHub repositories/PRs and isolated worktrees, requiring credentials and task authorization. Shared-directory state machines cannot migrate by flipping Git alone; redefine group dependencies, joins, and file integration only when needed. See packaged examples/main-runtime/workflow.json.

Set workspace through CLI/API, not workflow. Git-off edits the selected original directory. Git-on snapshots original files, executes in isolation, and writes back only integrated completed work, preserving original Git history/index. Conflicts are not overwritten; inspect workspaceDelivery and follow recovery instructions. sourceWorkspace is read-only import, mutually exclusive with workspace.

## Git-off v2 routing and completion

- `input: { "source": "input", "target": "ROLE" }` selects the first role, which need not be Main.
- routes.<role> is an array of `{ "target": "ROLE_OR_finish", "kind": "strong_OR_weak" }`, not strings. Workers require outgoing edges, without self-loops or duplicate targets.
- strong deterministically selects the sole outgoing edge; it cannot mix with other strong/weak edges.
- weak offers alternatives, usually selected by Main. decisionBy: agent permits only eligible ordinary weak branches, not arbitrary dispatch or completion.
- Write decisionPlans for each Agent describing evidence-based choices. Do not invent edge condition fields.
- termination is `{ "agent", "condition", "decisionBy": "main", "automatic": false_or_true }`. decisionBy remains main even when automatic is true.
- automatic: false delegates final completion to Main. With automatic: true, a non-Main terminal Agent gains limited complete_project only with a finish edge. Only the terminal Agent may have a finish edge, and a non-Main terminal Agent requires it.
- An acceptance Agent with finish and one ordinary weak target, plus automatic: true, completes on success and returns to the Worker on failure: useful for coding/testing repair.
- resultFormat, e.g. `{ "presets": ["code", "report"], "custom": "files and evidence" }`, describes outputs; it does not create files.
- allowUserIntervention controls human input; allowMainReconfiguration controls process changes. Start with false when unnecessary.

## Batch Loops

Add inside orchestration:

```json
{
  "loops": [{ "id": "refine", "from": "assess", "to": "revise", "maxIterations": 3, "exitTo": "main" }]
}
```

Also define unique strong routes revise → measure → assess → revise. to/from are ordinary entry/tail Agents. The tail cannot be terminal and exitTo must be outside. Members cannot overlap or nest; internal weak branches are unsupported.

After three rounds, control passes to Main; unfinished work can route directly back to revise for another batch. Batch and total counters persist across retries/recovery. Define total budgets and completion separately; exhausting a batch is not completing the project.

## Skills and MCP

Selections may use valid builtin:<name>, a local Skill directory, or project:<name>. External ./ and ../ paths resolve from the launching workflow directory; relative paths in runtime snapshots resolve from workspace. Check actual installed builtin names rather than inventing IDs.

For Agent4Sci, select `builtin:agent4sci-research`, `builtin:agent4sci-experiment`, and `builtin:agent4sci-checklist` in `skills` on roles that need the complete flow. Text references between Skills do not install dependencies; role instructions determine the current phase. Standalone later phases require previous-stage artifacts. Checklist runs on demand and does not schedule a timer. See the [usage guide](../../../docs/agent4sci.md) and [example configuration](../../../examples/agent4sci/workflow.json).

Embed a project Skill with:

```json
{
  "skillDefinitions": {
    "verify": {
      "files": {
        "SKILL.md": "---\nname: verify\ndescription: Check task deliverables and test evidence\n---\nCheck actual execution logs and acceptance criteria; report missing evidence.\n"
      }
    }
  }
}
```

Then assign `"skills": ["project:verify"]` to an existing Agent. files may contain text scripts and references but requires nonempty SKILL.md, with safe relative filenames and no `..`.

Remote MCP uses `{ "name": "tools", "url": "https://.../mcp" }` without inline authentication fields. Project MCP uses mcpDefinitions.<name> with command, entrypoint, files, args, and envFrom; Agents reference `{ "name": "tools", "project": "DEFINITION_NAME" }`. envFrom maps child variable names to host variable names, not key values. These stdio processes run with host authority and do not auto-install dependencies. See [project MCP](../../../docs/project-mcp.md).

## Main reconfiguration

Enable orchestration.allowMainReconfiguration only when process evolution is required. For an external Git-off workspace, proposals use `.scienceevolve/management/<projectId>/proposal/workflow.json`, preserving drafts and the original root file across calls. The Inbox supplies the real path; apply_workflow(path:"workflow.json") is a logical alias. Edit only the injected proposal, not runtime caches. Internal default Git-off and Git-on management proposals retain kernel behavior.

Read editableFields, lockedRuntime, and this turn's editable scope. Do not restore old deployment fields. Authorized proposals may change prompts/roles/orchestration, model, harness, configured gatewayId, Skills/MCP, experimentMcp, and decisionBy. Permissions, Web Search, persistence, Harness/Gateway reasoning, and credentials remain locked. gatewaySource cannot select native profiles or bypass deployment. After editing, apply_workflow is the turn's only terminal control action. Validation precedes application; later calls use session-continuity rules.

Omitted existing-Agent fields are preserved; [] clears capability lists. Accepted skillDefinitions/mcpDefinitions are immutable: omission preserves, identical resubmission is allowed, and new names are allowed; same-name rewriting, replacement, and deletion are rejected. Add a new definition and update references for content changes. Editing execution copies in .scienceevolve/agent-skills does not submit changes.
