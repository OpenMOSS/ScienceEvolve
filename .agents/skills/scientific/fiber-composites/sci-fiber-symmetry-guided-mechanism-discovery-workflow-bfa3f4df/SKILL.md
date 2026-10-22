---
name: sci-fiber-symmetry-guided-mechanism-discovery-workflow-bfa3f4df
description: A reusable end-to-end workflow for framing research gaps, generating symmetry-anchored hypotheses, and validating mechanisms through staged controls, robustness probing, and iterative claim bounding.
scienceevolve-title: "Fiber composites and battery materials · symmetry guided mechanism discovery workflow 2"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Help an agent turn an ambiguous scientific observation or target behavior into a rigorous, testable mechanism-discovery study. The workflow anchors hypotheses to structural invariants (symmetries, conservation laws, topology, or composition-structure relationships), designs staged validation ladders with strong controls, and bounds claims through iterative robustness checks and failure-mode analysis.

# When to use

Use this skill when the user asks to:

- Propose, critique, or refine a research plan for a system where behavior may be governed by hidden symmetries, conservation laws, topological constraints, or structural mechanisms.
- Design studies that discriminate between competing mechanisms rather than only optimizing performance.
- Validate whether an observed or predicted effect is robust to boundary changes, perturbations, or regime shifts.
- Convert a vague materials, quantum, composite, or multi-physics question into a ranked set of falsifiable hypotheses with a minimal validation plan.

Do not use this skill for operational laboratory protocols, fabrication recipes, clinical decision-making, or real-time infrastructure dispatch instructions.

# Inputs required

Before generating a plan, request or infer:

- **Target phenomenon**: the behavior, state, or response to be explained or reproduced.
- **Structural anchors**: candidate symmetries, conservation laws, topological invariants, geometric descriptors, or composition-structure rules that could constrain the mechanism.
- **Evidence base**: available literature, datasets, simulation tools, benchmark solutions, or prior experimental observations.
- **Baseline reference**: a known model, conventional approach, or null case against which to compare.
- **System boundaries**: physical, computational, or theoretical limits; relevant length scales, time scales, or energy regimes.
- **Perturbation classes**: expected noise, defects, boundary effects, or symmetry-breaking processes.
- **Claim scope**: whether the intended output is a predictive model, a mechanism hypothesis, a screening ranking, or a proof of principle.
- **Constraints**: computational cost, safety boundaries, reproducibility requirements, and ethical or regulatory limits.

# Core Workflow

Follow this ordered route. At each numbered step, apply the decision gate before proceeding.

1. **Frame the gap and anchor to structure**
   - State the observed or desired behavior and identify why existing explanations are insufficient.
   - Anchor the gap to one or more candidate structural invariants (symmetry, topology, conservation law, or geometric/compositional rule).
   - **Decision gate**: Is the gap falsifiable and is the anchor well-defined? If no, stop and refine the scope.

2. **Generate ranked mechanism hypotheses**
   - Formulate at least three hypotheses that link the structural anchor to the target behavior through distinct causal chains.
   - For each hypothesis, assign evidence strength (high / medium / low / speculative), list key assumptions, and identify the most likely failure mode.
   - **Decision gate**: Do the hypotheses make distinct, testable predictions? If no, return to step 1 and sharpen the mechanism abstraction.

3. **Design the validation ladder**
   - Define the **minimal viable validation**: the smallest test (analytic, computational, or conceptual) that can falsify the leading hypothesis.
   - Architect controls:
     - **Baseline**: conventional or null model.
     - **Positive control**: case where the mechanism should manifest clearly.
     - **Negative control**: case where the mechanism should be absent or suppressed.
     - **Ablation control**: remove one structural anchor or interaction at a time.
   - Select independent variables, dependent metrics, and explicit stop conditions.
   - **Decision gate**: Can the controls isolate the proposed mechanism from confounders? If no, redesign before executing.

4. **Execute staged validation**
   - Run the minimal test first; collect results across multiple observables or regimes.
   - Record numerical stability, convergence behavior, and any solver or discretization artifacts.
   - **Decision gate**: Are the results interpretable and free from fatal numerical or experimental artifacts? If no, audit data integrity and model assumptions before continuing.

5. **Analyze and discriminate mechanisms**
   - Compare outcomes against the ideal reference and all controls.
   - Use both global metrics and local mechanism-sensitive observables.
   - Discriminate between competing hypotheses by checking which predictions survive the control comparisons.
   - **Decision gate**: Does the evidence clearly favor one hypothesis? If ambiguous, proceed to step 6. If the leading hypothesis is contradicted, return to step 2.

6. **Probe robustness and boundaries**
   - Vary parameters, initial conditions, boundary conditions, or introduce controlled symmetry-breaking / defects / noise.
   - Test whether the mechanism survives regime shifts or whether it is fragile to a specific approximation.
   - **Decision gate**: Does the mechanism hold under robustness checks? If no, narrow the claim boundary or reject the hypothesis. If yes, proceed to step 7.

7. **Iterate or redesign**
   - **If supported**: plan stronger validation (additional regimes, independent derivation, or cross-platform test) or extend to a harder class.
   - **If failed**: return to step 1 or 2 with updated constraints from the failure analysis.
   - **If inconclusive**: refine metrics, increase resolution, or add intermediate controls.
   - **Stop condition**: The claim is bounded by evidence, or a fundamental flaw (e.g., ill-defined coordinate, gauge dependence, boundary dominance) makes the hypothesis untestable in current form.

8. **Bound claims and package outputs**
   - Label every conclusion as exact, conditional, approximate, or speculative.
   - State the validity boundary (regimes, scales, or systems where the claim should not be extrapolated).
   - Document residual failure modes and risks.
   - **Final gate**: All outputs pass the validity checks listed below. If not, return to step 7.

# Output Format

When using this skill, produce:

1. **Ranked hypotheses table**: hypothesis statement, structural anchor, predicted signature, evidence strength, key assumptions, likely failure modes.
2. **Study plan**: system boundary, scenario ladder, variables, controls, metrics, and stop conditions.
3. **Control table**: baseline, positive, negative, and ablation controls with their purpose.
4. **Analysis plan**: global and local observables, comparison protocol, and visualization checks.
5. **Validation plan**: minimal viable validation, staged extensions, and robustness tests.
6. **Claim boundary statement**: exact, conditional, approximate, and speculative claims with explicit extrapolation limits.
7. **Failure modes and residual risks**: how the study could fail and what remains unverified.
8. **Iteration log**: decision-gate outcomes and redirection rationale.

# Validation Gates

Apply these gates at the corresponding workflow steps:

- **Falsifiability gate (Step 1)**: The research question must admit a result that contradicts the proposed mechanism.
- **Distinctiveness gate (Step 2)**: Competing hypotheses must predict measurably different outcomes under at least one control.
- **Control adequacy gate (Step 3)**: The experimental or computational design must include sufficient controls to separate the mechanism from artifacts, discretization effects, and confounding variables.
- **Interpretability gate (Step 4)**: Raw results must be diagnosable; stop if instability, non-convergence, or hidden defaults dominate the signal.
- **Mechanism discrimination gate (Step 5)**: A hypothesis is supported only when global metrics and mechanism-sensitive observables move together consistently across controls.
- **Robustness gate (Step 6)**: Claims are provisional until tested against parameter variation, boundary changes, and perturbations.
- **Claim bounding gate (Step 8)**: No claim may exceed the evidence class assigned during hypothesis generation.

# Claim Boundaries

- **Exact**: Derived directly from stated assumptions with no known exceptions within the tested scope.
- **Conditional**: Holds only when specific boundary conditions, symmetries, or approximations are maintained.
- **Approximate**: Valid within a characterized regime; may break down outside tested parameter ranges.
- **Speculative**: Proposed for a new domain, scale, or system; requires independent validation before elevation.
- **Consensus rule**: Never present evidence from a single study or source as field-wide consensus.

# Failure Modes

Common ways this workflow can fail or mislead:

- **State-mechanism entanglement**: The baseline system state and the intervention or perturbation effect are not separated, producing spurious correlations.
- **Gauge or representation dependence**: A derived coordinate, order parameter, or design variable is ill-defined or non-unique, making conservation claims fragile.
- **Boundary or defect dominance**: The mechanism appears valid only because boundary flux, surface effects, or uncontrolled defects are ignored.
- **Approximation artifact**: Numerical discretization, truncation, solver bias, or mesh/grid dependence creates a false signature.
- **Scale mismatch**: Single-element or single-scale behavior is assumed to translate to the full system without array-level, multi-physics, or interaction checks.
- **Benchmark overfitting**: The mechanism is tuned to one benchmark, dataset, or positive control and fails on negative controls.
- **Cost or emission leakage**: Benefits measured inside the study boundary are shifted to unmeasured externalities.
- **Overstated extrapolation**: Results from minimal models, linear regimes, or ideal conditions are applied to nonlinear, coupled, or safety-critical systems without validation.

# Validity Checks

Before finalizing any output, verify:

- **Question validity**: The research question is specific, measurable, and tied to a mechanism-discrimination decision.
- **Evidence validity**: Each hypothesis distinguishes prior evidence from new inference; evidence strength is justified.
- **Control validity**: Baseline, positive, negative, and ablation controls are present and capable of detecting artifacts.
- **Statistical / numerical validity**: Repeated runs, resolution sweeps, convergence checks, or uncertainty quantification support the claim; significance is not inferred from a single realization.
- **Mechanistic validity**: Correlations are supported by plausible reasoning through the structural anchor; global improvement alone is insufficient.
- **Reproducibility**: Data sources, preprocessing, model settings, random seeds, and decision criteria are documented.
- **Boundary validity**: Extrapolation limits, system boundaries, and regime-transfer risks are explicitly stated.
- **Safety / ethics validity**: The plan avoids unsafe operational details, respects compliance boundaries, and flags safety-critical applications for expert review.

# Provenance

- **Cluster**: 55 / Subcluster 55.0
- **Archetype**: symmetry-guided mechanism discovery and validation
- **Synthesized from**:
  - `10.1016_j.cma.2017.09.005` (cutfem-shape-optimization-research)
  - `10.1038_s41928-022-00878-9` (memristive-neuromorphic-research-design)
  - `2412.19228` (single-cell-perturbation-transfer-research)
  - `fiber__10.3390_jcs9060283` (woven-composite-rve-research-explorer)
  - `1804.08293` (ai-materials-research-workflow)
  - `10.12204_j.issn.1000-7229.2024.02.009` (ies-low-carbon-dispatch-research)
  - `2502.19156` (quantum-simulation-hybrid-dynamics)
  - `10.1103_sxgs-38c3` (topology-symmetry-conservation-skyrmion-research)
