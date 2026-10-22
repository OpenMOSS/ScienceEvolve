---
name: sci-quantum-quantum-ultrafast-correlated-electron-evide-9bead821
description: End-to-end evidence analysis and claim audit workflow for quantum, ultrafast, and correlated electron systems, emphasizing model-driven hypothesis generation, differential observable design, and robust mechanism validation.
scienceevolve-title: "Quantum materials and condensed matter · quantum ultrafast correlated electron evidence analysis workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

This skill guides an agent through a reusable, end-to-end workflow for auditing scientific claims in quantum, ultrafast, and correlated electron research. It migrates the shared pattern of "model-gap discovery → mechanism hypothesis → minimal validation with strong controls → differential analysis → robustness audit → iterative redesign" across platforms such as solid-state spin systems, strong-field and QED dynamics, plasmonic and hyperbolic media, functional materials with hidden order, and ultrafast electronic phase control. The goal is to produce falsifiable research plans and evidence-based claim grading, not to reproduce specific paper conclusions.

# When to use

Trigger this skill when the user needs to:

- Propose a new research question or falsifiable hypothesis about correlated, coherent, or ultrafast electron dynamics.
- Design a validation study involving spectroscopy, transport, pump-probe, or first-principles/numerical evidence.
- Audit an existing claim about symmetry breaking, mode coupling, phase competition, nonlocal response, or wavepacket control.
- Migrate a methodological pattern from one platform to another while preserving control logic and evidence boundaries.
- Analyze data where model assumptions may fail due to nonlinearity, nonlocality, strong coupling, or hidden degrees of freedom.

# Inputs required

Before starting, collect or confirm:

- **Target system**: Relevant degrees of freedom, symmetry constraints, and known baselines (e.g., unperturbed phase, default dispersion, or reference state).
- **Baseline model**: The simplified theory, effective model, or phenomenology currently used to interpret the system.
- **Candidate control variables**: External fields, structural parameters, pulse properties, or coupling knobs that can be varied independently.
- **Observable signals**: Spectral, momentum, transport, coherence, or real-space observables accessible by experiment or simulation.
- **Constraints**: Safety and ethics boundaries, computational or instrumental limits, resolution windows, and non-negotiable approximations.
- **Prior evidence**: Verified facts, model derivations, analogous systems, and known failure modes of the baseline model.

# Core Workflow

Execute the following steps in order. At each decision gate, stop and redesign if the criterion is not met.

## 1. Baseline and gap definition
- State the baseline model and its predicted observables under reference conditions.
- Identify the regime, parameter window, or anomaly where the baseline is expected to fail or remains untested.
- Define a single, falsifiable research question that addresses the gap.
- **Decision gate 1**: If the baseline cannot reproduce known reference behavior, halt and fix the model or input data before proceeding.

## 2. Mechanism hypothesis generation
- Propose 2–5 candidate mechanisms that could explain the gap. Each mechanism must map to a computable or measurable physical structure (e.g., nonlocal response, mode coupling, symmetry reduction, hidden order, phase interference, or effective coupling renormalization).
- For each hypothesis, specify:
  - **Evidence strength**: High / Medium / Low / Speculative, with justification.
  - **Key assumptions**: Required conditions for the mechanism to dominate.
  - **Falsifiable prediction**: A differential observable that should appear if the mechanism operates.
  - **Failure mode**: A specific result that would invalidate or weaken the hypothesis.
- **Decision gate 2**: If no hypothesis can be tested with available observables and controls, return to step 1 and refine the gap or the target system.

## 3. Study design and control hierarchy
- Define a **minimal viable validation** (MVV): the smallest set of conditions that can discriminate the leading hypothesis from the baseline.
- Construct a control hierarchy:
  - **Baseline**: Reference condition with no targeted perturbation.
  - **Positive control**: A known regime where the analysis pipeline can detect the expected signal class.
  - **Negative control**: A regime where the target mechanism is symmetry-forbidden, geometrically suppressed, or logically excluded.
  - **Strong control**: Same system with an alternative model or decoupled variable to test specificity.
  - **Boundary control**: Variation of resolution, truncation, geometry, or material dataset to check for artifacts.
- Define variables:
  - **Independent**: Control knobs intended to modulate the mechanism.
  - **Dependent**: Differential observables chosen to amplify signal and suppress common-mode noise.
  - **Covariates**: Factors that could confound the interpretation (e.g., temperature drift, disorder, numerical convergence, pulse calibration).
- State explicit **stop conditions** for the study (e.g., baseline irreproducibility, negative-control false positive, positive-control failure, or signal below noise floor).
- **Decision gate 3**: If the design lacks at least one negative and one positive control, or if stop conditions are undefined, redesign before execution.

## 4. Data acquisition and preprocessing
- Record calibration states, geometry, and boundary conditions transparently.
- Normalize backgrounds, align baselines, and flag outliers or instrument anomalies.
- Convert raw signals into differential or symmetry-resolved indicators suitable for mechanism discrimination.
- **Decision gate 4**: If data quality falls below the predefined threshold, halt interpretation and output diagnostic recommendations only.

## 5. Mechanism decomposition and analysis
- Decompose the total response into interpretable contributions (e.g., pole vs. branch-cut, local vs. nonlocal, direct vs. recollision, ordered vs. disordered).
- Fit trends with the simplest effective model that preserves the hypothesized mechanism; retain parameter uncertainties and report residuals.
- Compare target conditions against the full control hierarchy on the same footing.
- Check for consistency across multiple observables (spectral, temporal, spatial, momentum, or symmetry channels).
- **Decision gate 5**: If the negative control shows the target signal, or if the positive control fails, pause mechanism interpretation and investigate confounders or pipeline errors.

## 6. Robustness validation
- Perform sensitivity analyses: vary parameters, models, boundary conditions, material datasets, or numerical settings within physically reasonable ranges.
- Test convergence and repeatability across independent samples, batches, runs, or analysis paths.
- Attempt to reproduce the result with an alternative model or reduced representation; if the conclusion disappears, downgrade the claim.
- **Decision gate 6**: If the effect is sensitive to a single untested assumption, numerical setting, or dataset, narrow the claim to that specific regime and label it model-dependent.

## 7. Claim grading and audit
- Grade each claim according to evidence class:
  - **Verified phenomenon**: Reproduced across independent conditions with controls.
  - **Model-supported inference**: Consistent with mechanism decomposition and robust to alternatives.
  - **Analogical transfer**: Plausible based on similarity to another system, but lacking direct validation here.
  - **Speculative**: Requires future testing; do not present as established.
- State the **claim boundary**: the exact regime (parameter window, symmetry, scale, or model class) within which the claim holds.
- Explicitly distinguish what the source literature verified from what is being inferred for the new system.
- **Decision gate 7**: If the evidence does not support the intended claim level, downgrade or reject the claim before communicating results.

## 8. Iteration or redesign
- **If fully supported**: Extend to adjacent parameters, symmetries, or platforms, preserving the control hierarchy and baseline checks.
- **If partially supported**: Refine the mechanism (e.g., add a competing channel, revise the effective model, or redefine the differential observable) and return to step 3.
- **If unsupported**: Check whether the gap was misidentified, the control variable couples to the wrong degree of freedom, or an omitted confounder dominates. Return to step 1 or 2.
- **If artifact suspected**: Halt mechanism claims; perform dedicated diagnostic experiments or convergence tests, then return to step 4.

# Output Format

Each invocation must produce:

1. **Research question**: One falsifiable sentence defining the gap and target system.
2. **Mechanism map**: Causal chain linking control variable → microscopic coupling → intermediate mode/order → differential observable.
3. **Hypothesis table**: For each candidate hypothesis: evidence strength, key assumptions, falsifiable prediction, and failure mode.
4. **Validation plan**: MVV description, control hierarchy (baseline, positive, negative, strong, boundary), independent/dependent/covariate variables, and stop conditions.
5. **Analysis plan**: Preprocessing steps, decomposition strategy, model fitting approach, residual handling, and cross-observable consistency checks.
6. **Robustness checklist**: Sensitivity tests, convergence criteria, repeatability requirements, and alternative-model comparisons.
7. **Iteration roadmap**: Rules for retaining, modifying, or abandoning hypotheses based on possible outcomes.
8. **Validity and boundary summary**: Confounders, extrapolation limits, evidence-class labels, and non-operational safety/ethics boundaries.

# Validation Gates

- **Baseline fidelity**: The reference model or unperturbed system must reproduce known behavior before perturbation claims are made.
- **Control specificity**: Negative and positive controls must behave as predicted; otherwise the pipeline is not validated.
- **Statistical discrimination**: Effect size must exceed the combined noise, calibration drift, and sample variance under predefined criteria.
- **Model convergence**: Numerical or theoretical approximations must pass independence checks (grid, basis, time step, truncation, or ensemble size).
- **Cross-observable coherence**: Mechanism claims must not rely on a single curve or single observable; at least two independent channels must agree.
- **Extrapolation audit**: Any generalization beyond the tested parameter window must be labeled as analogical or speculative.

# Claim Boundaries

- Do not treat single-source results as domain consensus.
- Distinguish verified facts, model inferences, analogical transfers, and untested hypotheses in every output.
- Claims about mechanism dominance are valid only within the tested control-variable range, symmetry class, and model approximation.
- Functional claims (e.g., controllability, switchability, or sensing performance) require layered evidence: first phenomenology, then mechanism specificity, then reproducibility under perturbation.

# Failure Modes

- **Baseline drift**: The reference state changes across runs, rendering comparisons invalid.
- **Control failure**: Positive control fails (pipeline broken) or negative control matches target signal (lack of specificity).
- **Confounding dominance**: Temperature, disorder, calibration error, or numerical artifact explains the observed trend.
- **Model overfitting**: A complex model fits noise rather than mechanism; simplified models fail to capture the same trend.
- **False extrapolation**: Conclusions from one platform, material class, or parameter regime are applied to an incompatible system without independent validation.
- **Irreproducibility**: Effect disappears under independent samples, alternative analysis paths, or reasonable parameter perturbations.

# Validity Checks

- **Confounders**: List environmental, instrumental, numerical, and material factors that could mimic the target mechanism.
- **Repeatability**: Require independent replication (multiple samples, batches, runs, or codes) before elevating evidence strength.
- **Boundary conditions**: State the limits of validity for dimensionality, time scale, coupling strength, loss level, and linear/weak-perturbation approximations.
- **Statistical validity**: Predefine peak-identification rules, classification thresholds, and significance criteria; avoid post-hoc subset selection.
- **Provenance transparency**: Cite the methodological origin of each transferred pattern without presenting source-specific conclusions as universal truths.

# Provenance

- Synthesized from cluster **174.0** (end-to-end evidence analysis and claim audit).
- Source skills referenced for methodological patterns:
  - `tunable-hyperbolic-superconductor-research` (anisotropic mode-control logic)
  - `plasmonics-nonlocal-spp-research-workflow` (model-failure decomposition and region mapping)
  - `functional-materials-local-order-exploration` (hidden-order variable design and cross-scale compatibility)
  - `quantum-spin-pair-research-design` (noise-to-resource framing and protected-subspace validation)
  - `ultrafast-laser-control-research-workflow` (differential-observable and phase-control design)
  - `qed-vacuum-control-exploration` (nonlocal spectral shaping and pre/post-interaction controls)
  - `revival-mediated-wavepacket-control` (periodicity exploitation and coarse-grained effective models)
  - `ultrafast-electronic-order-control` (field-renormalized coupling and competing-phase hierarchy)
