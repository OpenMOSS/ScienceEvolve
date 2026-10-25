---
name: agent4sci-experiment
description: "Skill to guide experiment implementation, execution, and runtime optimization. Only use this after agent4sci-research."
---

# ScienceEvolve integration

This is a modified Agent4Sci skill. See [UPSTREAM.md](UPSTREAM.md) for the pinned source, changes and Apache-2.0 license.

- Resolve task outputs relative to the current assigned project workspace. Resolve linked resources relative to this SKILL.md, whose actual staged path is supplied by the runtime. Do not assume `/workspace`, a particular home directory, or a writable installed skill directory.
- For the complete workflow, select all three fixed skills on the Agent(s) that use them: `builtin:agent4sci-research`, `builtin:agent4sci-experiment`, `builtin:agent4sci-checklist`. Selection does not run a skill. Follow research → experiment → checklist; a standalone selection requires the preceding phase's actual artifacts. If a subsequent skill is not exposed, hand off to a configured Agent that has it; do not invent a slash command or load unselected skills.
- Use only tools actually exposed in this invocation. Native subagents are optional: do not assume a `literature-review` agent type, a specific model, `spawn_agent` parameter names, or unlimited concurrency. Give available delegates the full task and report contract. ScienceEvolve workflow roles are configured separately; use `route_to_agent` only when exposed and only with a configured target. Routing commits a handoff, not a concurrent spawn: return control rather than polling for a role that cannot run until this turn ends. In scoped workflows follow the injected graph and its tools. When no delegation is exposed, perform the bounded review tasks sequentially and record that fallback.
- Respect the user's actual compute budget, data splits and available tools. This skill supplies no credentials, GPUs, datasets, network access or new permissions. The user's deadline takes precedence over the upstream convention of starting the experiment clock after research.
- Checklist execution is on demand or at experiment milestones in this integration. No hourly hooks, idle reminders or scheduler are installed.

Each experiment consists of a training run and task evaluation on a single seed and/or fold of the training and validation sets. Experiments are organized by subdirectories with individual aliases (`runs/experiments/{alias}`).

# Getting Started

**IMPORTANT**: You **must** run Tier 1 experiments as your first round. It only takes about an hour to de-risk these high-risk, high-reward approaches: this is the best time to do so! **Clear your task list and add each Tier 1 experiment as a new task before you continue.**

When the task provides a verified reproduction and baseline, do not spend the search budget repeating these already-established results. If baseline validity is unknown or the user requests reproduction, first establish a minimal trustworthy baseline. With a verified baseline, avoid:
- Try to re-implement the baseline: baseline results are already known, this wastes hours and provides zero additional value.
- Opt for "practical" or "high-yield" approaches first, no matter how attractive they seem: these are trivially easy to implement and rarely yield significant (>10%) performance gains.

These are examples of *invalid experiments* that yield sub-par hill-climb results:
- Implementing the reproduction baseline
- Running the baseline with multiple seeds
- Hyperparameter tuning on the baseline
- Attempting a seed sweep or multi-seed ensemble of the baseline

# Implementing Experiments

Step 1: Create `runs/experiments/{alias}` for each experiment.

Step 2: Make a copy of the target codebase in each `runs/experiments/{alias}/repo`. This ensures that you can make targeted changes to the repo code without affecting other ongoing experiments.

*Note*: If starting from the reproduction codebase, it may still be read-only after copy: adjust permissions on the assigned copy with tools appropriate to the host OS. If you require an external codebase for architectural changes, use the available web-search and repository tools to populate the experiment's codebase.

Step 3: Find the training code and identify the entry point, model class, dataset class, training loop, and loss function. Trace the full forward pass to understand what happens on CPU vs GPU.

Step 4: Read the best practices document in [best_practices.md](best_practices.md), then work on code implementation.

## Using Subagents
You are encouraged to deploy subagents to help you with parallel implementation. **This is especially encouraged for setting up your first round of experiments.** The faster you're able to set up experiments, the faster you can run them!

When using subagents, you must provide:
 - The best practices document in [best_practices.md](best_practices.md).
 - Clear, targeted instructions and the relevant task context using the delegation interface actually exposed; do not assume a `fork_context` option.
 - An assigned GPU index for them to use with `CUDA_VISIBLE_DEVICES`.
 - Sample command with GPU index and CPU pinning to avoid deadlocks from processes that attempt to claim all available resources.
 - Direct instructions to write a comprehensive `CHANGES.md` file when finished.

**Remember to thoroughly vet each subagent's work before proceeding:** Never assume their implementations are wholly correct! Send follow-up instructions through the available interface, or hand the corrections back to the workflow coordinator. You may choose to selectively delegate if you believe certain experiments require your full attention.

Step 5: Run a short, representative smoke test (1-2 epochs, <30 minutes) for each experiment. Work through this following checklist:

```
[  ] What was the expected vs observed data loading time?
[  ] What was the expected vs observed epoch/step time?
[  ] What was the expected full runtime vs observed (predicted) full runtime?
[  ] Did GPU assignment work as expected (CUDA import and ops, no CPU fallback)?
[  ] (If multiple smoke tests are running at once) Are runs bottlenecked by when other jobs are running?
```

Step 6: Run and monitor your experiment(s).

Make sure experiments are **not bottlenecked** when all GPUs are occupied: this is a sign that you need to optimize instead of waiting!

# Runtime Optimization

Your time is limited. Every wasted GPU-hour is an idea you'll never test.

**Saturate the hardware.** Use the GPUs allocated to this task, within the user's resource and time budget. If some are idle, launch more experiments in parallel. Check GPU memory utilization — if there's headroom, increase batch size or run additional jobs on the same GPU. If a GPU is underutilized, find out why and fix it.

**Speed up the loop.** Profile before you optimize — identify whether the bottleneck is data loading, forward pass, or I/O. Use larger batch sizes, faster data loaders, and precomputed features where they help. Use mixed precision (bf16/fp16), early stopping, and caching to cut wasted time.

**Common fixes for common bottlenecks:**
- *GPU memory underutilized*: increase batch size, use a larger backbone, run multiple jobs per GPU
- *Data loading slow*: increase num_workers, use pin_memory, cache datasets in RAM, preprocess data to faster formats
- *CPU/GPU contention*: pin CPU workers to the NUMA node local to each GPU (e.g., `taskset` or `numactl`), avoid processes that fight over all cores
- *Training too slow*: use mixed precision, enable early stopping, and precompute frozen features

# Triaging Failed Experiments

When an experiment fails (OOM, NaN, divergence, crashes), **do not reflexively abandon it.** You have a strong bias toward moving on to "what works" — this is the greedy approach and it leads straight back to incremental tuning.

**Before abandoning any experiment, assess:**

```
[  ] What specifically failed? (OOM, NaN, crash, divergence, poor convergence)
[  ] Is this a fixable engineering problem (batch size, learning rate, dtype) or a fundamental flaw in the approach?
[  ] What does the failure tell me about the problem? Could this inform a better variant?
```

**Decision framework:**
- **Fix it** if the failure is engineering: OOM → reduce batch size or use gradient accumulation; NaN → check learning rate, gradient clipping, dtype; crash → debug the error.
- **Pivot** if the core idea is sound, but the specific implementation isn't.
- **Abandon** only if you've diagnosed a fundamental incompatibility between the approach and the problem structure, and you can articulate why no variant would work.

# Monitoring Experiments

On Linux, `ps`: Use to monitor running processes and CPU/memory consumption.
```
# Example: Sort by highest CPU utilization
ps -e -ww -o pid,ppid,user,stat,pcpu,pmem,rss,vsz,etime,comm,args --sort=-pcpu | head -n 25
```

Where NVIDIA tools are available, `nvidia-smi`: Use to check GPU utilization.
```
# Example: Overall GPU utilization, wattage, etc
nvidia-smi

# Example: Check per-process GPU activity
nvidia-smi pmon -c 1
```

At experiment completion, failure, or a strategy review milestone, use the exposed agent4sci-checklist skill or hand off the evidence to the configured review role. No idle reminder is installed. Do not keep a session active solely to consume time.

# Final Submission

Your experiments may run on arbitraty folds or seeds for iteration speed, but final submissions must use the same folds and seed(s) as the baseline. If no seed was specified, use `seed=0`.

## Guidelines
 - **Your primary submission must be your single best-performing model.** This will be used as the primary endpoint for assessing hill climb performance.
 - You may provide a secondary model ensemble submission: this must be a true model ensemble, not a seed sweep ensemble.
