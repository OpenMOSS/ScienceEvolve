---
name: sci-neuro-stochastic-optimization-research-design-workf-133b85ff
description: A reusable end-to-end research design workflow for stochastic, combinatorial, and probabilistic systems that structures hypothesis generation, controlled validation, mechanism isolation, and bounded claim formation.
scienceevolve-title: "Neuromorphic computing and Ising optimization · stochastic optimization research design workflow"
scienceevolve-area: neuromorphic-computing-and-ising-optimization
---

# Purpose

Design reusable end-to-end research workflows for stochastic, combinatorial, and probabilistic computing systems. This skill guides an agent to translate methodological ideas into transferable scientific studies with falsifiable hypotheses, strong controls, and bounded claims—without treating any single source as domain consensus.

# When to use

Use this skill when the user needs to formulate new research questions, design experiments, or evaluate hypotheses in domains involving stochastic optimization, probabilistic algorithms, combinatorial search, scientific machine learning, inverse optimization, or hardware–software co-design where controlled randomness, energy-based models, multi-scale closures, or physical stochastic units play a central role.

# Inputs required

Before designing the study, collect or infer:

- Target problem domain, decision variables, and system boundaries.
- Known baselines and available validation resources (simulation or experimental).
- Sources of stochasticity, control knobs, coupling structures, or constraints.
- Acceptable tradeoffs among performance, robustness, cost, and interpretability.
- Scope of the claimed mechanism and what evidence already exists versus what is extrapolated.

If key inputs are missing, state assumptions explicitly and design the smallest study that can falsify the main hypothesis.

# Core Workflow

Follow this ordered route. At each numbered step, apply the named decision gate before proceeding.

1. **Gap Framing & Scope Bounding**
   - Define the research gap as a measurable mismatch between existing methods and a target behavior (e.g., exploration–exploitation imbalance, unresolved subgrid scales, partial prescription feasibility).
   - Bound the system: decision variables, stochastic sources, control inputs, coupling structure, and task objective.
   - State what is paper-supported versus newly inferred.
   - **Decision Gate — Candidate Gate:** If the gap cannot be expressed as a falsifiable claim with available resources, narrow the scope or stop.

2. **Mechanism Hypothesis Generation**
   - Produce 3–5 mechanism-level hypotheses, each with: concise causal claim, rationale, evidence strength (high / medium / low), key assumptions, likely failure modes, minimal falsification test, and boundary conditions.
   - Prefer hypotheses that vary one abstraction at a time (state representation, randomness source, learning objective, coupling rule, or control knob).
   - Label each as paper-supported mechanism, reasonable extrapolation, or new hypothesis.
   - **Decision Gate — Plausibility Gate:** If a hypothesis cannot be invalidated by the proposed minimal test, refactor it before proceeding.

3. **Minimum Viable Study Design**
   - Identify independent variables (mechanism variants, randomness levels, problem regimes), dependent variables (task performance, system-state fidelity, convergence), and controlled variables (budget, stopping rules, initialization).
   - Design controls: negative (mechanism disabled or frozen), positive (known valid solution), baseline (standard algorithm or solver), and ablation (remove single components).
   - Define multi-level metrics: component/unit behavior, system dynamics, and task outcome.
   - Preset stopping conditions: negative control matches proposed method, positive control fails, variance exceeds signal, or physical/system constraints are violated.
   - **Decision Gate — Design Gate:** If the experiment cannot distinguish the proposed mechanism from implementation artifacts or baseline weakness, redesign controls or metrics.

4. **Execution & Diagnostic Validation**
   - Run the minimal experiment under fixed seeds, documented environments, and versioned code.
   - Validate stochastic sources or simulators independently (distribution fidelity, bias, drift) before attributing solver or system behavior to them.
   - Record failed runs, anomalies, and boundary violations.
   - **Decision Gate — Stability Gate:** If results are not reproducible across repeated runs or initializations, diagnose variance sources (numerical noise, initialization sensitivity, hidden leakage) before analysis.

5. **Analysis & Mechanism Isolation**
   - Decompose errors: separate mechanism effects from discrete errors, training leakage, benchmark bias, or solver artifacts.
   - Compare all conditions under matched computational budgets and problem instances.
   - Jointly inspect task-level outcomes and hypothesized intermediate states (e.g., dynamic regimes, distribution shapes, closure gaps); if they decouple, do not claim mechanism validation.
   - **Decision Gate — Mechanism Exclusion Gate:** If negative controls or ablations produce equivalent outcomes, reject the causal claim and return to hypothesis generation.

6. **Robustness & Regime Stratification**
   - If mechanism isolation succeeds, test across structurally different regimes (size, density, noise level, distribution shift, boundary condition).
   - Sweep randomness schedules, hyperparameters, or problem mappings to identify sensitivity.
   - **Decision Gate — Robustness Gate:** If the effect vanishes outside a narrow regime, bound claims to that regime and do not generalize.

7. **Uncertainty Audit & Claim Bounding**
   - Grade each conclusion: verified phenomenon, reasonable inference, or unverified extrapolation.
   - Explicitly state boundary conditions: applicable scales, data distributions, physical assumptions, and hardware abstractions.
   - Separate paper-supported workflow elements from agent-inferred extensions.
   - **Decision Gate — Claim Gate:** If conclusions exceed what controls and repetitions support, downgrade or retract them.

8. **Iteration or Redesign**
   - **If supported:** Scale to stronger baselines, larger instances, integrated system tests, or real-world-derived scenarios.
   - **If partially supported:** Refine the hypothesis (e.g., mechanism is necessary but not sufficient) and redesign the minimal experiment.
   - **If failed:** Preserve negative results as boundary information; pivot to alternative mechanisms or stop.
   - **Stop conditions:** Simpler baselines match performance; controls are irreproducible; physical or safety constraints are violated; the core hypothesis is falsified.

# Output Format

When using this skill, produce:

1. **Research question** — scoped gap, target system, and boundary.
2. **Hypothesis table** — for each: claim, mechanism, evidence strength, key assumptions, failure modes, minimal validation, falsification test.
3. **Study design** — variables, controls (negative, positive, baseline, ablation), metrics, stopping conditions.
4. **Analysis plan** — error decomposition, baseline comparison, joint inspection of task and state metrics, robustness checks.
5. **Iteration roadmap** — decision rules for continue, revise, pivot, or abandon.
6. **Validity and ethics statement** — confounders, reproducibility requirements, boundary conditions, safety constraints.

# Validation Gates

- **Candidate Gate:** The gap is falsifiable and resourced.
- **Plausibility Gate:** The hypothesis isolates a single mechanism and is falsifiable.
- **Design Gate:** Controls can distinguish the mechanism from artifacts.
- **Stability Gate:** Results are reproducible across repeated runs.
- **Mechanism Exclusion Gate:** Negative controls rule out alternative explanations.
- **Robustness Gate:** The effect persists across tested regimes.
- **Claim Gate:** Conclusions are limited to the evidence grade.

# Claim Boundaries

- Paper-supported workflow elements are distinguished from new-agent inferences.
- Single-study or single-instance-family results are not treated as domain consensus.
- Simulation and idealized-model results are not presented as deployment guarantees.
- Hardware-oriented claims are limited to validated statistical behavior, not fabrication readiness.
- Cross-domain transfer is framed as a hypothesis requiring independent validation.

# Failure Modes

- **Infeasibility:** No valid completion, unstable dynamics, or violated constraints under the proposed mechanism.
- **Misattribution:** Gains arise from baseline weakness, hidden tuning, benchmark bias, or unmatched budgets rather than the claimed mechanism.
- **Decoupling:** Task-level metrics improve while hypothesized intermediate states or physical behaviors do not, breaking the causal chain.
- **Variance collapse:** Signal is dominated by initialization, seed, or numerical noise.
- **Regime overfit:** Method works only under narrow structural or parametric conditions but is presented as general.
- **Leakage:** Generated data, future information, or training–test overlap contaminates validation.

# Validity Checks

- **Confounding:** Compare all methods under matched budgets, stopping rules, and problem instances; validate random sources independently before attributing solver gains.
- **Reproducibility:** Fix random seeds or document stochasticity, version all code and data, record failed runs, and report environment metadata.
- **Statistical:** Use repeated runs to estimate variability; report central tendency and spread; avoid best-case-only reporting; predefine success thresholds.
- **Boundary:** Stratify conclusions by problem regime; label cross-domain, cross-scale, or cross-hardware transfer as unverified.
- **Fair comparison:** Tune baselines with effort comparable to the proposed method; report precision–cost tradeoffs.

# Provenance

- Synthesized from cluster 3, subcluster 3.0.
- Source skills: `quantum-generative-imbalance-research`, `scientific-ml-closure-research-workflow`, `partial-inverse-combinatorial-optimization`, `stochastic-hardware-research-workflow`, `deep-rl-its-control-research`, `hardware-stochastic-constructive-search`, `oscillator-energy-learning-workflow`, `controllable-stochastic-computing-research`.
- Workflow archetype: end-to-end research design workflow.
