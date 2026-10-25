---
name: agent4sci-checklist
description: "On-demand experiment monitoring and strategic planning; no automatic timer. **Only use this after agent4sci-research and agent4sci-experiment skills have been used in sequence.**"
---

# ScienceEvolve integration

This is a modified Agent4Sci skill. See [UPSTREAM.md](UPSTREAM.md) for the pinned source, changes and Apache-2.0 license.

- Resolve task outputs relative to the current assigned project workspace. Resolve linked resources relative to this SKILL.md, whose actual staged path is supplied by the runtime. Do not assume `/workspace`, a particular home directory, or a writable installed skill directory.
- For the complete workflow, select all three fixed skills on the Agent(s) that use them: `builtin:agent4sci-research`, `builtin:agent4sci-experiment`, `builtin:agent4sci-checklist`. Selection does not run a skill. Follow research → experiment → checklist; a standalone selection requires the preceding phase's actual artifacts. If a subsequent skill is not exposed, hand off to a configured Agent that has it; do not invent a slash command or load unselected skills.
- Use only tools actually exposed in this invocation. Native subagents are optional: do not assume a `literature-review` agent type, a specific model, `spawn_agent` parameter names, or unlimited concurrency. Give available delegates the full task and report contract. ScienceEvolve workflow roles are configured separately; use `route_to_agent` only when exposed and only with a configured target. Routing commits a handoff, not a concurrent spawn: return control rather than polling for a role that cannot run until this turn ends. In scoped workflows follow the injected graph and its tools. When no delegation is exposed, perform the bounded review tasks sequentially and record that fallback.
- Respect the user's actual compute budget, data splits and available tools. This skill supplies no credentials, GPUs, datasets, network access or new permissions. The user's deadline takes precedence over the upstream convention of starting the experiment clock after research.
- Checklist execution is on demand or at experiment milestones in this integration. No hourly hooks, idle reminders or scheduler are installed.

You must fill out this checklist AND work on the identified action items: **do not simply fill out the checklist with no further action.**

# Part 1: Self-Assessment

You tend to drift toward comfortable, incremental thinking and taking "practical" approaches over time. Work through this checklist to understand what your current strategy is. Answer each question **out loud**.

```
[  ] Did I attempt ALL of my Tier 1 experiments, or did I anchor on the best performers and give up on the others without a proper root cause analysis and retry?
[  ] Am I currently designing experiments that require creative scientific reasoning, or am I just tweaking hyperparameters, swapping schedulers, or ensembling and calling it novel work?
[  ] Would a domain expert look at my current experiments and be interested or surprised by what I'm trying?
[  ] When experiments failed or ran slowly, did I diagnose root causes and execute pivots, or did I immediately give up and move on to "practical approaches" and "quick wins"?
[  ] Am I using all of my GPUs on incremental variants and ensembles, or am I hedging my bets with bold approaches that could leapfrog everything else I've tried so far?
[  ] Given how many hours I have left: **is my frontrunner truly my best possible candidate, or am I just tunnel-visioning on the safe, familiar options I have?**
```

If ANY answer reveals drift toward incrementalism, **stop and re-orient yourself by working meticulously through the next three sections.** Remember that **you are a ambitious, creative "mad scientist", not an auto-tuner**: adopt this mindset to keep up your momentum!

# Part 2: Operations
For each running job, answer the following checklist **out loud, one by one**. **Add action items as tasks while working through the checklist.**

```
[  ] Which GPU is this job running on?
[  ] Where is the logfile, and has it been updated recently?
[  ] Is this job consuming appropriate GPU and CPU resources?
[  ] Is this job on track to finish in a reasonable amount of time?
[  ] Is this job still competitive compared to other running jobs?
[  ] Are there bottlenecks in this job that I should diagnose and unblock right now — data loading, CPU/GPU contention, I/O?
[  ] If a subagent prepared the code, have I reviewed it to make sure that it's correct and performant?
```

# Part 3: Strategy
Finally, answer each question below **out loud, one by one** to guide your strategy going forward. **Add action items as tasks while working through the checklist.**

```
[  ] How much time remains? How much time do I need to prepare a final submission?
[  ] Do I have time and resources to launch new experiments?
[  ] Are there promising experiment combinations I haven't pursued yet?
[  ] Did any failed experiment or bottleneck reveal an insight I haven't acted on?
[  ] Would fixing known bottlenecks or optimizing experiment code allow me to work significantly faster?
[  ] Have I followed up on all previously launched subagents and tasks?
```

If you have time and resources but no new ideas, **revisit the literature reviews to find approaches that may not have been salient on your first pass.**

Delegate implementation or diagnosis only through available tools/configured roles and within the allocated budget. Consult the exposed agent4sci-experiment skill when needed; delegation consumes resources.

# Part 4: Action Plan

Work through this final section to prepare your action plan.

Step 1: Remove any stale, already-completed tasks from your task list.
Step 2: Review all the action items from Parts 1-3: double check that they're all in your task list.

Finally, answer each question for this final pre-flight checklist **out loud, one by one** before you start working on these tasks.
```
[  ] Have I cleared out all of my stale and/or completed tasks?
[  ] Does my current task list contain **all** of the corrective actions I said I'd take?
[  ] Which of these tasks can I delegate to subagents to maximize the amount of work that gets done in the next hour?
```

Execute or hand off the corrective actions within the remaining budget. Record the next review milestone in the handoff; this skill does not schedule a future invocation or send automatic reminders.