---
name: sci-neuro-quantum-neural-neuromorphic-learning-mechanis-4c1f5a81
description: Guide an agent through an end-to-end mechanism-discovery workflow for quantum, neural, neuromorphic, and energy-based learning systems using cross-layer hypothesis generation, controlled validation, and iterative claim bounding.
scienceevolve-title: "Neuromorphic computing and Ising optimization · quantum neural neuromorphic learning mechanism discovery"
scienceevolve-area: neuromorphic-computing-and-ising-optimization
---

# Purpose

Guide an agent in designing reproducible research plans that discover and validate computational mechanisms across quantum-inspired, neural, neuromorphic, and energy-based learning systems. The workflow emphasizes cross-layer hypothesis generation, minimal abstraction, matched controls, intermediate diagnostics, and iterative claim bounding rather than single-benchmark superiority claims.

# When to use

Use this skill when:

- The user asks to propose a new research direction, hypothesis, or validation plan for stochastic, energy-based, neuromorphic, or physics-inspired learning and optimization systems.
- The problem involves discovering whether a proposed dynamical, circuit-level, or latent mechanism improves learning, sampling, optimization, or memory behavior.
- The agent must design controlled experiments comparing a candidate mechanism against strong baselines with fair resource accounting.
- The context requires separating mechanism-level evidence from task-level performance, especially when cross-layer codesign or hidden-state dynamics are involved.

Do not use this skill as a general machine-learning tutorial, hardware deployment recipe, or source for operational fabrication protocols.

# Inputs required

Before executing the workflow, collect or infer:

- **Target problem class:** The computational task, distribution, or optimization problem (e.g., sampling, learning, search, memory consolidation).
- **Candidate mechanism:** The proposed dynamical, architectural, or latent mechanism and its expected causal effect.
- **Baseline methods:** Strong conventional or physics-inspired baselines matched for capacity and budget.
- **Abstraction layer:** Available simulation, modeling, or hardware-in-the-loop validation environment.
- **Evaluation priorities:** Trade-offs among accuracy, convergence, robustness, scalability, resource cost, and reproducibility.
- **Constraints:** Compute budget, acceptable problem scale, noise models, safety boundaries, and reproducibility requirements.

If inputs are missing, state assumptions explicitly and flag them as untested.

# Core Workflow

Execute the following phases in order. Do not skip decision gates.

## 1. Gap Diagnosis & Task Framing
Define the computational bottleneck (e.g., poor convergence, forgetting, local minima, sampling bias). Frame the research gap as a stability-plasticity, exploration-exploitation, or accuracy-cost trade-off.
- **Decision gate:** Is the gap mechanistic (addressable via dynamics, circuit structure, or latent state) rather than purely data-limited?
  - *If no:* Stop; recommend data or benchmark acquisition.

## 2. Mechanism Hypothesis Generation
Generate 2–4 falsifiable, mechanism-level hypotheses. For each, specify:
- Proposed causal chain from mechanism to observable behavior.
- Evidence strength: `source-supported`, `model-supported`, or `agent-inferred`.
- Key assumptions and likely failure modes.
- Boundary conditions where the effect should weaken or reverse.
- **Decision gate:** Are hypotheses mutually distinguishable and falsifiable with available resources?
  - *If no:* Refine abstractions or narrow scope before proceeding.

## 3. Minimal Abstraction & Mapping
Construct the simplest model (e.g., energy landscape, probabilistic circuit, dynamical system, or latent-state network) that isolates the hypothesized mechanism. Remove non-essential complexity.
- **Decision gate:** Can the mechanism be varied independently of confounds (capacity, encoding, optimizer state)?
  - *If no:* Redesign the abstraction or add component-removal variants.

## 4. Experimental Design & Control Specification
Define:
- **Independent variables:** Mechanism presence, topology, timescale, noise regime, or coupling strength.
- **Dependent variables:** Task performance, intermediate diagnostics (energy trajectories, state distributions, convergence times, hidden-state magnitudes), and resource proxies.
- **Controls:** Positive control (known favorable setting), negative control (mechanism absent or broken), ablation control (component removed), and strong baseline (tuned conventional method).
- **Stop/failure criteria:** Predefine when to reject the hypothesis (e.g., no improvement under matched budget, instability, or missing intermediate signature).
- **Decision gate:** Are controls matched for capacity, training budget, data encoding, and stopping rules?
  - *If no:* Revise design to prevent unfair comparisons.

## 5. Simulation & Empirical Validation
Execute minimal viable validation:
- Collect intermediate diagnostics before interpreting final metrics.
- Check whether the predicted mechanism signature appears (e.g., changed energy trajectory, improved state distribution, reduced forgetting).
- **Iteration gate A:** Does the mechanism produce the predicted intermediate signature?
  - *If no:* Proceed to Phase 8 (Iteration or Redesign); do not interpret final metrics as mechanism support.
- **Iteration gate B (Robustness):** Does the signature persist under perturbation (noise, initialization, scale, or problem variation)?
  - *If no:* Narrow claim boundaries and return to Phase 2 or 3.

## 6. Mechanism Discrimination & Analysis
- Separate mechanism evidence from task evidence. A task improvement alone does not prove the mechanism.
- Use ablation interpretation: if removing the mechanism removes the gain, the mechanism is likely causal.
- Compare distributions (not only best-case) under matched conditions.
- **Decision gate:** Is the observed gain explained by the mechanism rather than by confounds (extra compute, encoding advantage, initialization, or benchmark artifact)?
  - *If no:* Return to Phase 4 to add controls or Phase 8 to pivot.

## 7. Claim Bounding & Documentation
Document:
- **Demonstrated:** Directly supported by this validation.
- **Inferred:** Plausible but requiring further evidence.
- **Speculative:** Outside current evidence.
State explicit boundary conditions (problem class, scale, noise regime, abstraction level).
- **Decision gate:** Are claims proportional to evidence and labeled by strength?
  - *If no:* Weaken claims and update documentation.

## 8. Iteration or Redesign
Based on preceding gates:
- **Stop:** If failure criteria are met (e.g., advantage disappears under matched budget, mechanism unsupported by intermediate diagnostics, or safety boundary reached).
- **Pivot:** If the mechanism fails but a confound or alternative mechanism is identified, return to Phase 2 with a revised hypothesis.
- **Refine:** If partial success, adjust abstraction, controls, or problem scale and return to Phase 3 or 4.
- **Extend:** If mechanism is validated and bounded, test transfer to new problem classes, hardware constraints, or deployment boundaries in a new cycle.

# Output Format

When this skill completes a cycle, return:

1. **Research question:** One concise, mechanism-focused question.
2. **Gap and motivation:** The bottleneck and why existing baselines are insufficient.
3. **Hypotheses:** 2–4 hypotheses with evidence strength, assumptions, causal chain, and failure modes.
4. **Minimal abstraction:** The simplified model, variables, and independence assumptions.
5. **Experiment plan:** Variables, controls, baselines, metrics, and predefined stop conditions.
6. **Analysis plan:** Intermediate diagnostics, ablation strategy, baseline comparison, and robustness checks.
7. **Iteration rules:** How each possible result updates, narrows, or rejects hypotheses.
8. **Claim boundaries:** What is demonstrated, inferred, or speculative, plus domain and scale limits.
9. **Validity and safety notes:** Confounders, reproducibility requirements, and ethical boundaries.

# Validation Gates

The workflow must pass these gates to advance:

- **Mechanism isolability (Phase 3):** The hypothesized mechanism can be varied independently of architecture size, encoding, and optimizer.
- **Control fairness (Phase 4):** Baselines are matched for capacity, budget, and stopping rules; positive and negative controls are specified.
- **Intermediate signature (Phase 5):** The mechanism produces a predicted diagnostic signature before final task metrics are interpreted.
- **Ablation coherence (Phase 6):** Removing the mechanism attenuates or eliminates the claimed gain.
- **Claim proportionality (Phase 7):** Conclusions are labeled by evidence strength and bounded by tested conditions.

# Claim Boundaries

- Claims are limited to the tested problem class, model abstraction, scale, and noise regime.
- Source-supported mechanisms may be used as starting assumptions; agent-inferred extensions require independent validation.
- Task-level performance gains do not, by themselves, validate cross-layer or hardware-level mechanism claims.
- Hardware feasibility, energy efficiency, or deployment readiness claims require additional hardware-aware validation beyond simulation.

# Failure Modes

- **Overwriting by confounds:** Gains arise from encoding, initialization, extra compute, or benchmark artifacts rather than the proposed mechanism.
- **Local-only equivalence:** A mechanism reproduces local behavior but fails to preserve global joint statistics or scalability.
- **Brittleness:** The effect disappears under realistic noise, finite precision, distribution shift, or matched resource budgets.
- **Over-consolidation / Under-exploration:** Mechanisms that improve stability suppress necessary plasticity, or vice versa.
- **False mechanism attribution:** Final accuracy is interpreted as mechanism validation without intermediate diagnostic support.
- **Boundary violation:** Claims are extrapolated beyond tested problem sizes, topologies, or operational regimes.

# Validity Checks

Before finalizing any plan or claim, verify:

- **Confounding:** Are improvements driven by the mechanism, the optimizer, the baseline mismatch, or data artifacts?
- **Reproducibility:** Are random seeds, model assumptions, initialization schemes, and metric definitions documented?
- **Statistical validity:** Are repeated trials, uncertainty estimates, and multiple-comparison issues addressed?
- **Model validity:** Are abstractions calibrated and updated when contradicted by new measurements?
- **Scalability:** Does the mechanism survive increases in problem size, constraint density, or system depth?
- **Robustness:** Does performance survive perturbations to noise, initialization, timescale, or objective weights?
- **External validity:** Are conclusions restricted to the tested distribution family, abstraction level, and simulation environment?
- **Mechanistic validity:** Do intermediate diagnostics support the proposed causal chain?

# Provenance

- Derived from cluster `25`, subcluster `25.1`: machine-learning-assisted mechanism discovery and validation.
- Synthesized from source skills: `probabilistic-neural-circuit-codesign`, `energy-based-latent-constraint-discovery`, `chaotic-sampling-dynamics-research`, `energy-dynamics-guided-neural-training`, `ising-machine-research-workflow`, `metaplastic-hidden-state-continual-learning`, `adaptive-spiking-neuron-research-workflow`, `coherent-search-dynamics-research`.
