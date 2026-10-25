# Agent4Sci source and modifications

Upstream: [https://github.com/maszhongming/agent4sci](https://github.com/maszhongming/agent4sci)
Pinned revision: `74b0e8c4dc55610072bed4326b6bfac24dc77377`
License: Apache-2.0, reproduced in [LICENSE](LICENSE).
Research attribution: Ming Zhong, Stacy Li, Nicholas Carlini and Matthew Jagielski, *Automating ML for Science: Can Frontier Agents Climb Scientific Hills in the Wild?* (2026).

Source files:
- [agent4sci/skills/agents/skills/research/SKILL.md](https://github.com/maszhongming/agent4sci/blob/74b0e8c4dc55610072bed4326b6bfac24dc77377/agent4sci/skills/agents/skills/research/SKILL.md)
- [agent4sci/skills/codex/agents/literature-review.toml](https://github.com/maszhongming/agent4sci/blob/74b0e8c4dc55610072bed4326b6bfac24dc77377/agent4sci/skills/codex/agents/literature-review.toml)
- [agent4sci/skills/agents/scripts/wait_for_reviews.py](https://github.com/maszhongming/agent4sci/blob/74b0e8c4dc55610072bed4326b6bfac24dc77377/agent4sci/skills/agents/scripts/wait_for_reviews.py)

Modified for ScienceEvolve on 2026-10-25. The SKILL.md and supporting instructions are adaptations, not verbatim upstream releases. Stable names use the agent4sci- prefix; native dollar/slash references are replaced with selected runtime skill names. Fixed container paths become task-workspace paths and skill-local resource links. Delegation uses exposed native tools or configured workflow roles, with a documented sequential fallback. No upstream model pin, agent registration, permission settings, hooks or scheduler is installed. User-provided deadlines, resource allocations and baseline requirements take precedence over benchmark-specific assumptions.

For research, the specialized literature-review agent prompt is supplied as a portable assignment. The unbounded sentinel poller is replaced with a one-shot Python standard-library validator that verifies both reports and a UTC completion marker. Experiment resources retain relative output paths. Checklist instructions explicitly describe on-demand use. Select all three skills for the complete flow; no implicit cross-skill dependency is added to the runtime.
