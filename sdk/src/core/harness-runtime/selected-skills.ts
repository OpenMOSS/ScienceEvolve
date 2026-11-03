/** On-demand catalog for Harnesses without a native explicit Skill allowlist. */
export function selectedSkillInstructions(paths: readonly string[]): string {
  const selected = [...new Set(paths)];
  return selected.length
    ? `Only these Workflow-selected Skills are available. Read the needed SKILL.md with native file tools, then resolve its resources relative to that file:\n${selected.map(file => `- ${file}`).join("\n")}`
    : "No Skills are selected for this Agent; do not discover or load host, parent, bundled or other Agents' Skills.";
}
