---
name: sci-quantum-observable-driven-mechanism-discovery-workf-d92ed3db
description: A reusable end-to-end workflow for framing observable anomalies, generating mechanism-linked hypotheses, designing minimal validation studies with strong controls, and iterating claims while enforcing strict boundaries between verified, inferred, and speculative conclusions.
scienceevolve-title: "Quantum materials and condensed matter · observable driven mechanism discovery workflow 24"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Use this skill to turn an observable anomaly, scaling discrepancy, or regime change in a complex system into a structured research program for mechanism discovery and validation. The workflow guides an agent to generate falsifiable hypotheses, design minimum viable validation studies with strong controls, discriminate among competing explanations, and iterate claims without treating single-study evidence as field-wide consensus.

# When to use

Use this skill when the task involves:

- Proposing new research questions about anomalous transport, dynamics, structure formation, or phase-like transitions.
- Designing studies where many variables may be reducible to a mechanism-relevant descriptor.
- Separating kinetic or local mechanisms from endpoint or averaged observables.
- Planning non-operational conceptual experiments, simulations, or modeling studies for mechanism discrimination.
- Evaluating whether a reduced descriptor or local mechanism explains regime changes better than raw condition variables.

Do not use this skill as an operational manual, hardware recipe, or source of universal conclusions from a single study.

# Inputs required

Before producing a proposal, identify:

- **Target system class** and the larger-scale context or baseline model.
- **Central observable(s)** and how they are defined from raw data or simulation outputs.
- **Candidate mechanism(s)** or reduced descriptor(s) and their physical or logical rationale.
- **Baseline or null model** against which to compare.
- **Independent validation axis** (e.g., geometry, depth, variant, perturbation history, alternate diagnostic).
- **Resource and safety constraints**, including whether the context permits physical implementation or remains conceptual/computational.
- **Intended claim strength**: exploratory hypothesis, minimum validation, or mechanistic test.

# Core Workflow

1. **Anchor Baseline and Frame the Gap**
   - Define the expected behavior under the reference model or null mechanism.
   - Identify the observable anomaly, discrepancy, or regime change requiring explanation.
   - Distinguish the anomaly from artifacts, baseline variability, or known confounders.
   - *Decision gate:* If the anomaly cannot be distinguished from measurement or simulation artifact, stop and refine observables or data quality.

2. **Generate Mechanism-Linked Hypotheses**
   - Propose a reduced descriptor or local mechanism tied to the anomaly.
   - Formulate at least two competing hypotheses: a primary mechanism, a passive or alternative mechanism, and an artifact or boundary explanation.
   - For each hypothesis, label evidence strength (high / medium / low / speculative), state key assumptions, predict observable signatures, and list failure modes.
   - *Stop condition:* If no hypothesis is independently estimable or falsifiable, return to gap framing.

3. **Design Minimal Viable Validation**
   - Define independent variables: descriptor level, regime axis, and validation axis.
   - Define dependent variables that track dynamic or local mechanism indicators rather than only endpoint summaries.
   - Establish controls: positive, negative, specificity/stress, and ambiguity controls.
   - Predefine stopping/revision criteria: control failure, descriptor instability, unresolved confounding, or resource overrun.
   - *Decision gate:* If the design lacks a strong comparator or independent validation axis, redesign before execution.

4. **Execute Observation, Simulation, or Analysis**
   - Preserve data provenance, calibration status, and known uncertainty.
   - Reproduce baseline analysis using original definitions before testing alternatives.
   - Estimate candidate descriptors independently of the outcome being predicted.
   - *Stop condition:* If baseline reproduction fails or convergence/quality is insufficient, halt and address instrumentation or simulation parameters.

5. **Discriminate Mechanisms**
   - Compare observed signatures against predictions for each hypothesis using the same diagnostic set.
   - Test plausible mimics: alternative mechanisms, coordinate artifacts, boundary effects, and measurement bias.
   - Assess robustness by varying definitions, coordinate frames, thresholds, averaging windows, or boundary choices.
   - Use ensemble statistics, multi-realization sampling, or multi-probe agreement where available.
   - *Decision gate:* If the conclusion depends on a single diagnostic, coordinate choice, or uncontrolled boundary, downgrade the claim and redesign.

6. **Iterate Based on Evidence**
   - **If** supported across independent diagnostics and controls: narrow the claim to the validated regime and propose a stronger test.
   - **If** confined to a narrow regime or sensitive to assumptions: bound the claim and generate a regime-specific sub-hypothesis.
   - **If** a competing mechanism explains the data: reject or deprioritize the original hypothesis and promote the alternative.
   - **If** residuals reveal a missing variable: promote that variable to the next candidate descriptor and return to Step 2.
   - **If** controls fail or uncertainty dominates: pause interpretation and return to Step 3.
   - *Stop condition:* Terminate when the mechanism is robustly validated, falsified, or indistinguishable from alternatives under current constraints.

7. **Bound Claims and Document**
   - Classify conclusions as verified, inferred, or speculative.
   - State extrapolation boundaries: regime, system class, observable type, and model assumptions.
   - Separate source-paper method patterns from new agent inferences.

# Output Format

Each use should produce:

1. **Research question:** concise, falsifiable statement of the gap.
2. **Baseline expectation:** expected behavior under the null or reference model.
3. **Hypotheses table:** for each hypothesis—mechanism, evidence strength, key assumptions, predicted signatures, failure modes, and discriminating test.
4. **Validation design:** independent variables, dependent variables, control hierarchy, minimum viable validation, and stopping criteria.
5. **Analysis plan:** data preparation, descriptor estimation, regime separation, alternative-explanation tests, robustness checks, and uncertainty quantification.
6. **Iteration plan:** rules for upgrading, downgrading, splitting, or pausing hypotheses based on possible outcomes.
7. **Boundary statement:** what is verified, inferred, or speculative, plus extrapolation limits and safety constraints.

# Validation Gates

Stage-specific criteria that must be satisfied to proceed:

- **Gap gate:** The anomaly is reproducible and distinguishable from artifacts.
- **Hypothesis gate:** At least two competing hypotheses are stated with falsifiable predictions.
- **Design gate:** A strong comparator and independent validation axis are included.
- **Execution gate:** Baseline reproduction succeeds and data quality is documented.
- **Discrimination gate:** Conclusions rely on multiple diagnostics or realizations, not a single observable.
- **Iteration gate:** Controls are checked before any claim is upgraded.

# Claim Boundaries

- **Verified:** Directly supported by independent validation within the same system class and observable set.
- **Inferred:** Conditionally supported by partial validation, consistent modeling, or robust comparative analysis.
- **Speculative:** Plausible but not yet tested beyond structural analogy or narrow regime.
- Never present single-study or single-realization evidence as field-wide consensus.
- Do not extrapolate beyond the tested regime, geometry, noise model, or system class without labeling as speculative.

# Failure Modes

Common ways the workflow or underlying study can fail:

- **Missing descriptor:** A hidden variable confounds the mechanism attribution.
- **Regime mixing:** Analysis forces one mechanism across incompatible conditions.
- **Boundary or geometry artifact:** Apparent anomaly arises from confinement, finite size, or coordinate choice.
- **Diagnostic degeneracy:** Multiple mechanisms produce identical signatures with the chosen observables.
- **Circular definition:** The descriptor is estimated using the outcome it is meant to predict.
- **Single-diagnostic dependence:** Classification relies on one derived quantity or threshold.
- **Overfitting to narrow regime:** The mechanism appears valid only under a specific, unrepresentative parameter set.
- **False positive from controls:** Negative or stress controls produce the target signal.

# Validity Checks

Before finalizing a proposal or claim, confirm:

- **Gap validity:** The question addresses a real unresolved or confounded problem.
- **Mechanism validity:** The hypothesis specifies how the proposed mechanism produces the observable.
- **Regime validity:** Analysis does not assume a single mechanism across all conditions.
- **Control validity:** Positive, negative, specificity, and stress controls can distinguish mechanisms from artifacts.
- **Observable validity:** Dynamic or local indicators are separated from endpoint-only summaries.
- **Statistical validity:** Uncertainty, ensemble variability, and censoring are reported.
- **Reproducibility validity:** Definitions, frames, thresholds, and analysis pipelines are specified enough to repeat conceptually.
- **Boundary validity:** Extrapolation limits are stated explicitly.
- **Claim discipline:** Source-paper patterns, agent inference, and speculation are clearly separated.
- **Safety validity:** The proposal remains non-operational unless an approved institutional context is explicitly provided.

# Provenance

- Method pattern synthesized from cluster 200 / subcluster 200.0.
- Source skill references: `radiation-defect-dynamics-exploration`, `space-plasma-electron-only-reconnection-workflow`, `laser-plasma-diagnostic-workflow`, `wave-mediated-disorder-exploration`, `stochastic-growth-scaling-exploration`, `quantum-adaptive-entanglement-certification`, `active-filament-transition-exploration`, `confined-diffusion-narrow-escape-workflow`.
