---
name: agent4sci-research
description: "Literature-grounded research ideation and experiment planning. Use this to begin any hill-climb task."
---

# ScienceEvolve integration

This is a modified Agent4Sci skill. See [UPSTREAM.md](UPSTREAM.md) for the pinned source, changes and Apache-2.0 license.

- Resolve task outputs relative to the current assigned project workspace. Resolve linked resources relative to this SKILL.md, whose actual staged path is supplied by the runtime. Do not assume `/workspace`, a particular home directory, or a writable installed skill directory.
- For the complete workflow, select all three fixed skills on the Agent(s) that use them: `builtin:agent4sci-research`, `builtin:agent4sci-experiment`, `builtin:agent4sci-checklist`. Selection does not run a skill. Follow research → experiment → checklist; a standalone selection requires the preceding phase's actual artifacts. If a subsequent skill is not exposed, hand off to a configured Agent that has it; do not invent a slash command or load unselected skills.
- Use only tools actually exposed in this invocation. Native subagents are optional: do not assume a `literature-review` agent type, a specific model, `spawn_agent` parameter names, or unlimited concurrency. Give available delegates the full task and report contract. ScienceEvolve workflow roles are configured separately; use `route_to_agent` only when exposed and only with a configured target. Routing commits a handoff, not a concurrent spawn: return control rather than polling for a role that cannot run until this turn ends. In scoped workflows follow the injected graph and its tools. When no delegation is exposed, perform the bounded review tasks sequentially and record that fallback.
- Respect the user's actual compute budget, data splits and available tools. This skill supplies no credentials, GPUs, datasets, network access or new permissions. The user's deadline takes precedence over the upstream convention of starting the experiment clock after research.
- Checklist execution is on demand or at experiment milestones in this integration. No hourly hooks, idle reminders or scheduler are installed.

Your goal is to apply deep knowledge of both the task-specific scientific domain and broader AI/ML techniques to identify opportunities for performance improvements. This skill guides you through literature review and experiment planning.

**You are a crazy research scientist, not just an engineer tuning knobs.** You live for ambition, innovation and pioneering breakthroughs. You identify and analyze the best available methods (latest pretrained models, SOTA methods, modern frameworks), not just the provided baseline: incremental improvements bore you to death.

**Add each of the following phases as individual, separate tasks before you continue.**

# Phase 1: Literature Review

Read the supplied paper and task specification (for example `task.md`, if present). Create a new review batch under `runs/literature-review/<batch-id>/` so old completion markers cannot satisfy a new review. Use four subdirectories:

- `1A`: scientific-domain data and model architecture.
- `1B`: scientific-domain training and evaluation paradigms.
- `2A`: broader AI/ML data and model architecture.
- `2B`: broader AI/ML training and evaluation paradigms.

Read [the literature-review assignment](references/literature-review.md). Give each available delegate that contract, its subcategory, current task inputs, and its assigned directory. Use the coordination rules above; no special native agent registration is required. With a sequential fallback, complete the same four reviews yourself. Literature review requires actual web/source access; if it is unavailable, report the limitation and hand off instead of inventing references.

# Phase 2: Collect and Validate Reviews

Use the available delegation completion mechanism, or yield to the workflow coordinator for configured roles. Do not wait in a shell for a future workflow role. After the four reports are delivered into the current workspace, run the bundled non-polling validator using the real staged skill path:

```text
python <skill-directory>/scripts/check_reviews.py runs/literature-review/<batch-id>/1A runs/literature-review/<batch-id>/1B runs/literature-review/<batch-id>/2A runs/literature-review/<batch-id>/2B
```

Replace placeholders with actual paths and quote paths containing spaces. The validator exits successfully only when every directory has a nonempty REVIEW.md and REFERENCES.md and a valid completion marker. It does not establish scientific correctness: read and assess all four reports before planning experiments. Fix or hand off missing reviews before proceeding. In Git-isolated workflows, use the platform's normal artifact delivery/integration before checking local paths.

# Phase 3: Synthesize and Plan Experiments

Read the full content of all four literature reviews, then identify experiments according to the following taxonomy.

**Important things to know before you start**:
- You can install any packages you need via `uv pip install` and `pip install`.
- Delegate implementation through available tools or configured roles when possible; budget for the actual concurrency and resources available.
- You do not need to anchor on the contents of `reproduction/`: you can clone and iterate from different repos as long as you train and evaluate on the provided data.
- All final submissions must use the same seeds and data folds used in the reproduction.
    - Example: If the seeds provided in the reproduction are (0, 11, 42), you must use only (0, 11, 42): an ensemble with additional seeds is not valid.

## Tier 1: High-Risk, High-Reward Experiments
Experiments that are highly exploratory. These must draw directly from the literature reviews. **Plan experiments that efficiently use the GPUs allocated to this task within its budget**: for example, with N available GPUs you can plan N single-GPU Tier 1 experiments, or a smaller number of multi-GPU experiments.
- Domain-grounded feature or architecture reformulation
- Implementing an altogether different model or foundation
- Replacing major components of the existing model
- Technique transfer from tasks with similar properties
- **Significant effort to implement**

A scientist with deep knowledge of both the task domain and ML research might ideate and endorse these experiments.

## Tier 2: Well-Supported Experiments
Several experiments that are well-supported by the literature review.
- Successful approaches for similar tasks (e.g. learning rate schedules)
- Known improvements for this problem type
- **Modest effort to implement**

A scientist with task domain knowledge and some knowledge of ML research might ideate and endorse these experiments.

# Phase 4: Register Experiments

Answer each question **out loud** for each of your Tier 1 experiments. Reasoning out loud is a critical step to ensure that all experiments are well-reasoned and registered in the session log.

```
[  ] Category: What element of the model or task paradigm is being changed?
[  ] Hypothesis: What is your hypothesis for this experiment? ("if X, then Y, because Z")
[  ] Rationale: Which literature review(s) inform this approach? Cite the relevant sources.
[  ] Metrics: What are the relevant target metrics or readouts? Can these be monitored during training or only during evaluation?
[  ] Runtime: Estimate the runtime of each job required for this experiment.
[  ] (Tier 1 only) What makes this Tier 1 and not Tier 2?
```

## Calibration

After registering all Tier 1 experiments, answer these final questions **out loud** as a final check:

```
[  ] Would a domain expert be genuinely surprised by any of these ideas, or are they standard practice dressed up with ambitious language?
[  ] Am I inspired by the SOTA models and methods, or only proposing safe iterations on the provided baseline?
[  ] Is any Tier 1 experiment actually just a hyperparameter change, a training trick, or an ensemble strategy? If so, demote it to Tier 2 and replace it with something bolder.
[  ] Have I considered approaches from completely different fields that might transfer to this problem?
```

If you demoted any experiments, generate replacements from the literature reviews before proceeding.

Write the registered experiments and a timestamped lab notebook under `runs/` using the available file tools. Record the actual deadline and remaining allocated compute budget; research does not reset the user's time limit. Hand off these artifacts if a different configured Agent will run experiments.

# Phase 5: Run Experiments With agent4sci-experiment

Read the exposed `agent4sci-experiment` SKILL.md for implementation and execution, or hand off the registered plan to the configured experiment role.
