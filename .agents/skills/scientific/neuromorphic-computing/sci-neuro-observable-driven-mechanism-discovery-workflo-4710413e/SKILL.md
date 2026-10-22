---
name: sci-neuro-observable-driven-mechanism-discovery-workflo-4710413e
description: A reusable end-to-end workflow for generating hypotheses, designing controlled experiments, and validating mechanism claims in stochastic hardware, dynamical optimization systems, and probabilistic computing platforms.
scienceevolve-title: "Neuromorphic computing and Ising optimization · observable driven mechanism discovery workflow 4"
scienceevolve-area: neuromorphic-computing-and-ising-optimization
---

## Purpose

Transform a candidate physical or algorithmic mechanism into a rigorous, testable research plan. This skill guides layered hypothesis generation, controlled validation, and iterative refinement while keeping mechanism claims separate from implementation artifacts, mapping choices, and benchmark-specific tuning.

## When to use

Use this workflow when the user asks to:

- Propose new research questions for stochastic or probabilistic hardware, energy-mapped optimizers, nonlinear dynamical systems, or hardware-aware algorithms.
- Design experiments that connect a mechanism claim to observable evidence across multiple system layers.
- Validate whether a proposed effect survives strong controls, ablations, and stress tests.
- Iterate from device-level or primitive-level observations to system-level conclusions without overclaiming.

Do not use this skill as a general-purpose research planner for unrelated domains unless the problem can be framed as mechanism discovery with layered evidence.

## Inputs required

Ask for or infer before drafting a plan:

- **Target bottleneck:** the missing primitive or computational cost the mechanism aims to address.
- **Candidate mechanism:** the physical effect, dynamical property, or algorithmic structure proposed as a cause.
- **Substrate:** hardware, simulation, or hybrid platform and its known nonidealities.
- **State or problem encoding:** how candidate solutions or configurations are represented.
- **Baselines:** deterministic, random, prior-art, or reduced-mechanism controls available for comparison.
- **Primary metrics:** solution quality, distributional behavior, convergence, robustness, or resource proxies.
- **Variation and constraints:** noise, precision limits, calibration drift, latency, device variation, or environmental sensitivity.
- **Safety boundaries:** non-operational constraints for physical, clinical, security, or safety-critical contexts.
- **Desired output:** research questions, hypothesis set, experimental plan, analysis protocol, or iteration roadmap.

## Core Workflow

Execute the following ordered route. Advance past each gate only if the stop condition is not triggered.

### 1. Frame the bottleneck and mechanism claim
- Define the computational primitive or performance gap.
- Abstract the candidate mechanism into a causal claim independent of any single device recipe or benchmark instance.
- State the success criterion that would support the claim.

### 2. Generate layered hypotheses
- Produce at least three hypotheses covering:
  - **Mechanism hypothesis:** the core causal claim about how the effect arises.
  - **Abstraction/mapping hypothesis:** how raw observables translate into computational variables or energy landscapes.
  - **Robustness hypothesis:** whether the effect persists under variation, initialization changes, or nonideal conditions.
  - **Boundary/transfer hypothesis:** where the effect degrades and whether it generalizes across problem families.
- For each hypothesis, specify: concise claim, rationale, evidence strength (strong / moderate / weak / speculative), key assumptions, possible failure modes, and a minimal test.
- Distinguish paper-supported observations from agent-inferred extensions.

### 3. Design the experimental architecture
- **Independent variables:** mechanism presence, encoding, coupling, exploration policy, noise regime, or implementation fidelity.
- **Dependent variables:** metrics tied to the claim (e.g., state distribution, convergence, valid-solution probability).
- **Controls:**
  - Negative / no-mechanism control.
  - Reduced-mechanism or simplified control.
  - Ideal simulation without nonidealities.
  - Nonideal simulation with measured or plausible variation.
  - Strong baseline matched for resources and problem instances.
- Define **Minimum Viable Validation (MVV):** the smallest experiment that can falsify the core claim.
- Define **Strong Validation:** ablations, multiple instances, boundary tests, and robustness quantification.

### Gate 1: MVV execution
- Run the minimum viable validation.
- **Pass:** Core mechanism produces a detectable, repeatable signal distinguishable from controls.
- **Stop/Redesign:** If the signal is absent, confounded by artifacts, or fails against the negative control, halt and revise the mechanism or encoding before proceeding.

### Gate 2: Mechanism isolation
- Run ablations to separate the mechanism contribution from:
  - State encoding or mapping artifacts.
  - Readout, initialization, or post-processing effects.
  - Numerical or simulation artifacts.
- **Pass:** The effect persists when the mechanism is present and weakens when it is removed or reduced.
- **Stop/Refine:** If the effect is explained by hidden tuning, benchmark selection, or implementation artifacts, narrow or reject the claim.

### Gate 3: Strong validation and stress testing
- Test across multiple instances, seeds, device samples, or problem families.
- Introduce realistic nonidealities (variation, noise, precision limits, calibration drift).
- Perform boundary tests that push state size, interaction density, latency, or mismatch.
- **Pass:** Gains are robust and not driven by a single easy instance or favorable condition.
- **Narrow boundary:** If gains collapse under stress, bound the claim to tested regimes and do not extrapolate.

### 4. Layered analysis and evidence grading
- Analyze results by evidence layer:
  1. Source / physics-level behavior.
  2. Abstraction / interface fidelity.
  3. Primitive / circuit-level function.
  4. System / task-level performance.
- Grade each claim as: directly demonstrated, model-supported, inferred, or speculative.
- Report central tendency and variability; do not report best-case only.
- Separate measured results from simulation projections.

### 5. Iterate or terminate
- **If supported:** Strengthen the hypothesis, tighten assumptions, and propose harder boundary tests.
- **If partially supported:** Refine the mechanism, mapping, or control strategy and rerun MVV.
- **If contradicted:** Reject the hypothesis and generate alternatives.
- **If inconclusive:** Identify the missing control or insufficient statistical power, then redesign.
- Finalize a bounded claim statement and a next-step roadmap.

## Output Format

Return the following structure:

1. **Research question** — Bottleneck, candidate mechanism, and main claim.
2. **Candidate hypotheses** — At least three hypotheses with evidence strength, assumptions, failure modes, and minimal tests.
3. **Proposed method pattern** — Encoding, mechanism abstraction, control strategy, and exploration or coupling policy.
4. **Experimental plan** — Variables, controls, MVV, strong validation, metrics, and stop conditions.
5. **Analysis plan** — Layered checks, ablation strategy, model-experiment comparison, and evidence classification.
6. **Iteration plan** — Decision rules for support, partial support, contradiction, or inconclusive results.
7. **Validity and safety notes** — Confounders, reproducibility requirements, boundary conditions, and non-operational safety constraints.

## Validation Gates

Before advancing stages or finalizing claims, confirm:

- **Mechanistic plausibility:** The mechanism has a coherent causal chain from physical effect to observable output.
- **Control adequacy:** Negative, reduced, ideal, and nonideal controls are defined and matched.
- **Isolation:** The claimed effect is not attributable to encoding, readout, initialization, or numerical artifacts.
- **Statistical power:** Repeated trials, random seeds, or independent samples are specified; variability is reported.
- **Reproducibility:** Analysis protocols, metric definitions, and baseline assumptions are documented.
- **Boundary clarity:** Claims are bounded by tested regimes; extrapolations are explicitly labeled.

## Claim Boundaries

- **Device-level claims** do not imply circuit-level or system-level correctness without layered validation.
- **Simulation results** do not imply physical hardware behavior unless nonidealities are explicitly tested.
- **Single-instance or single-family success** does not imply generalization; label transfer claims as inferred until tested.
- **Mechanism-supported claims** are distinct from performance-only claims; correlation does not establish causation.
- Do not present source-paper findings as field-wide consensus or universal defaults.

## Failure Modes

- **Mechanism misattribution:** An observed effect is caused by measurement artifacts, drift, or uncontrolled noise rather than the intended mechanism.
- **Weak baseline:** Gains disappear when compared against a fairly matched, strong baseline.
- **Hidden tuning:** Performance depends on a narrow parameter set or a single favorable instance.
- **Overfitting to one benchmark family:** Claims fail when tested on shifted, larger, or structurally different instances.
- **Readout or encoding dominance:** The task is solved by the input encoding or output readout rather than by the dynamical mechanism.
- **Extrapolation beyond evidence:** Scaling, efficiency, or robustness claims extend beyond measured or simulated assumptions.
- **Confounding by variation:** Device-to-device or sample-to-sample variation explains the result rather than the mechanism.

## Validity Checks

Before finalizing a research plan, verify:

- Is the target problem, state encoding, objective, and success criterion clearly stated?
- Are all hypotheses labeled with evidence strength, key assumptions, failure modes, and minimal tests?
- Does the design include MVV, strong controls, and explicit stop conditions?
- Are negative, reduced, ideal, and nonideal controls included?
- Are calibration, variation, timing, and precision treated as variables rather than ignored?
- Are statistical validity, repeated trials, and reproducibility requirements explicit?
- Are scalability and resource claims bounded by measured or simulated evidence?
- Are paper-specific numerical values, device recipes, and benchmark settings excluded from the new plan as universal defaults?
- Are high-risk physical, biological, clinical, security, or safety-critical applications kept at a non-operational research-design level?

## Provenance

- **Cluster:** 13 / **Subcluster:** 13.0
- **Source skills:** stochastic-hardware-optimization-exploration, photonic-ising-research-design, voltage-controlled-probabilistic-computing-research, controllable-nonlinear-reservoir-research, voltage-controlled-stochastic-computing-research, stochastic-device-probabilistic-computing-workflow, constraint-geometry-dynamical-search, hardware-mismatch-qaoa-research.
- Synthesized from reviewed paper-derived skill clusters; no operational protocols or unsupported conclusions are invented.
