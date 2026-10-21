---
name: sci-quantum-observable-driven-mechanism-discovery-workf-51e2d014
description: A reusable end-to-end workflow for proposing, discriminating, and validating competing mechanistic hypotheses using multi-modal observables and hierarchical controls in complex physical systems.
scienceevolve-title: "Quantum materials and condensed matter · observable driven mechanism discovery workflow 21"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

This skill guides an agent through a structured, end-to-end research workflow that turns anomalous or under-mapped observables into testable mechanistic hypotheses, validates them through hierarchical controls and multi-modal evidence, and iterates based on explicit decision gates. It abstracts patterns from condensed-matter and materials-physics studies into a domain-agnostic methodology for mechanism discovery without reproducing paper-specific conclusions.

# When to use

Use when a user asks to design or critique a research program where competing mechanisms may explain observed anomalies, phase boundaries, transport signatures, or morphological scaling in physical systems. Applicable when the task involves hypothesis generation, experimental or computational validation planning, multi-observable cross-checking, and iterative claim refinement. Do not use for operational laboratory protocols, hazardous procedure generation, or as a substitute for domain-specific safety and ethics review.

# Inputs required

Before executing the workflow, collect or infer:

- Target system class and known baseline behavior.
- Observable anomaly or gap to be explained.
- Available tuning axes and their accessible ranges.
- Candidate observable families and their resolution limits.
- Competing mechanistic hypotheses or analogy classes from literature.
- Available controls: positive, negative, instrumental, and reference-system.
- Constraints: safety, reproducibility, computational budget, or facility limits.

# Core Workflow

1. **Gap Definition & Baseline Establishment**
   - Define the observable anomaly relative to a reference condition where the target mechanism is absent or reduced.
   - Separate directly measured features from inferred or extrapolated features.
   - **Decision Gate**: If the anomaly is not reproducible above background in repeated measurements or independent batches, stop and revisit sensitivity or baseline definition.

2. **Competing Hypothesis Generation**
   - Generate at least three hypotheses: a target mechanism, an alternative physical mechanism, and an artifact or confounder.
   - For each, specify predicted signatures across independent observable families, key assumptions, evidence strength (high / medium / low / speculative), and a falsifying observation.
   - **Decision Gate**: If no hypothesis can be falsified with the available observable set, redesign the measurement plan before proceeding.

3. **Hierarchical Study Design**
   - Define a minimal viable validation: one primary observable, one independent secondary observable, and one perturbation test.
   - Layer strong controls: positive (known behavior), negative (suppressed mechanism), instrumental (calibration/background), and reference-system.
   - Pre-register anomaly-detection rules, transition criteria, analysis pipelines, and stopping conditions.
   - **Decision Gate**: If controls cannot bracket the expected behavior or if safety/ethics constraints block the minimal validation package, stop and reformulate the study scope.

4. **Multi-Modal Evidence Collection**
   - Acquire data across independent probes, platforms, or computational methods.
   - Preserve raw and processed data separately; record metadata, analysis versions, and exclusion criteria.
   - **Decision Gate**: If independent probes disagree beyond pre-defined consistency bounds, halt mechanism interpretation and investigate confounders such as inhomogeneity, probe blindness, or analysis artifacts.

5. **Mechanism Discrimination & Robustness Testing**
   - Apply pre-registered criteria to locate anomalies and construct boundaries.
   - Compare hypotheses using ablation logic: vary or disable one mechanism at a time in models or control conditions.
   - Test sensitivity to alternative assumptions, fitting ranges, background treatments, and representation choices.
   - **Decision Gate**: If the favored mechanism explains only one observable while worsening agreement with another, downgrade its evidence strength and return to Step 2.

6. **Evidence Synthesis & Claim Bounding**
   - Classify conclusions as observed, reproducible, mechanism-supported, or speculative extrapolation.
   - Bound claims to the tested parameter range; mark extrapolations into unmeasured regimes as model-dependent.
   - **Decision Gate**: If the claim relies on a single observable, single sample, or probe-specific boundary, restrict it to a tentative observation only.

7. **Iteration or Redesign**
   - **Convergence path**: If controls and cross-observable checks pass, strengthen the hypothesis and propose boundary-mapping or generalization tests.
   - **Partial convergence path**: If evidence is mixed, add orthogonal measurements, refine tuning axes, or tighten controls.
   - **Falsification path**: If hypotheses are falsified or negative controls replicate the target signal, preserve the null result as a boundary condition and reformulate mechanisms.
   - **Stop conditions**:
     - Anomaly cannot be detected above background.
     - Inferred boundaries are representation-dependent or probe-dependent.
     - Negative controls reproduce the target signal.
     - Required validation violates safety, ethics, or compliance boundaries.

# Output Format

When using this skill, return:

1. **Research Question**: Concise question and domain context.
2. **Evidence Map**: What is known, inferred, and unknown.
3. **Hypothesis Set**: Table with mechanism, evidence strength, key assumptions, predicted signatures, and failure modes.
4. **Study Plan**: Minimal validation, strong controls, variables, metrics, and stop conditions.
5. **Analysis Plan**: Pre-registered criteria, robustness checks, and model comparison strategy.
6. **Validation Plan**: Control hierarchy, reproducibility checks, and cross-observable consistency rules.
7. **Iteration Plan**: Decision rules for strengthening, weakening, or redirecting hypotheses.
8. **Claim Boundary & Safety Notes**: Extrapolation limits, confounders, and non-operational safety constraints.

# Validation Gates

- **Reproducibility Gate**: Independent samples, batches, or runs must confirm central anomalies before mechanism claims.
- **Cross-Observable Gate**: Mechanism must be consistent across at least two independent observable families.
- **Control Gate**: Positive and negative controls must behave as expected; otherwise, halt interpretation.
- **Robustness Gate**: Conclusions must survive reasonable changes in analysis baseline, fitting range, or model variant.
- **Stability Gate**: Inferred boundaries or critical points must not be artifacts of a single representation or normalization.

# Claim Boundaries

- Distinguish **direct measurement** (raw anomaly), **extrapolated inference** (boundary at unmeasured limits), and **mechanistic interpretation** (causal model).
- Label claims as **observed**, **reproducible**, **mechanism-supported**, or **speculative extrapolation**.
- Do not generalize beyond the tested tuning range, sample class, or model assumptions.
- Never present single-study or single-system evidence as field-wide consensus.

# Failure Modes

- **False mechanism attribution**: An artifact, background, or alternative order is mistaken for the target mechanism.
- **Projection bias**: Apparent scaling or boundary arises from representation choice rather than intrinsic physics.
- **Overfitting**: Transition criteria or model parameters are tuned to a single realization without cross-validation.
- **Control failure**: Negative controls show the target signal, or positive controls fail, indicating systematic error.
- **Extrapolation overreach**: Claims extend into unmeasured regimes without marking model dependence.
- **Single-observable overreliance**: A mechanism is accepted based on one probe despite conflicting or absent secondary evidence.

# Validity Checks

Before finalizing, verify:

- **Confounding**: Could disorder, inhomogeneity, thermal history, calibration drift, or background subtraction explain the result?
- **Probe adequacy**: Does each probe resolve the relevant transition, or is it blind to competing orders?
- **Statistical validity**: Are uncertainty estimates, repeat measurements, and sensitivity analyses included?
- **Boundary conditions**: Are conclusions limited to the measured parameter range?
- **Model dependence**: Does the conclusion survive alternative scaling forms, transition criteria, or theoretical frameworks?
- **Alternative explanations**: Have structural transitions, phase separation, finite-size effects, or competing mechanisms been explicitly tested?

# Provenance

- Derived from cluster 60.0 (observable-driven mechanism discovery and validation).
- Synthesized from source skills: quantum-critical-phase-diagram-exploration, interfacial-crack-roughness-scaling-analysis, high-pressure-hydride-research-design, collective-electronic-thermoelectric-exploration, high-energy-heavy-ion-hard-probe-exploration, high-pressure-materials-structure-search, bulk-metallic-glass-ductility-research-design, high-pressure-alloy-superhydride-exploration.
- Paper-specific conclusions, numerical parameters, and operational protocols have been removed to produce a domain-agnostic workflow.
