---
name: sci-cosmology-cosmology-evidence-audit-workflow-5b6e5740
description: A reusable end-to-end workflow for designing, validating, and auditing evidence claims in cosmological and astrophysical analyses where observables, systematics, and model assumptions must be jointly tested before scientific conclusions are drawn.
scienceevolve-title: "Galaxy, cosmology, and simulations · cosmology evidence audit workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

# Purpose

Use this skill to design and audit research plans in cosmology and astrophysics where scientific claims depend on separating primary signals from nuisance processes, validating inference tools, and bounding model dependence. It provides a structured, iterative route from research question to conditional conclusion without reproducing any single study's numerical setup.

# When to use

Use this skill when:

- You need to propose a new, testable research question in cosmology or large-scale structure that relies on observable-driven inference.
- A proposed measurement depends on high-precision parameter inference or model comparison.
- Physical, observational, or modeling systematics may mimic, obscure, or bias the primary signal.
- You are building, validating, or applying a simulation-based emulator, forward model, or summary statistic.
- You need to decide whether additional data dimensions, external priors, independent observables, or alternative statistics improve robustness.
- You must audit whether a claim is a forecast, a model-conditioned inference, or a validated detection.

Do not use this skill as a substitute for full survey operations, observational data reduction pipelines, instrument control, or as a claim that any single study's result is field consensus.

# Inputs required

Ask the user or environment for:

- The primary scientific target (parameter, model comparison, or physical mechanism).
- The observable or data product to be used, and the baseline statistic or estimator.
- The systematic or nuisance family that could affect the inference.
- Available validation resources (simulations, mock catalogs, emulators, independent data sets).
- The intended output type (research design, validation plan, mitigation strategy, or claim audit).
- Scope constraints (redshift, scale, survey geometry, tracer type, or model family).
- Any external information sources that could break degeneracies.

If inputs are missing, state assumptions explicitly and label conclusions as conditional.

# Core Workflow

Follow this ordered route. Do not skip decision gates.

## 1. Frame the question and gap
- Define the primary inference target before modeling systematics.
- Identify the observable and the baseline summary statistic.
- Articulate the information gap: what the baseline may miss or what systematic could degrade it.
- **Decision gate:** Is the question scoped to a single, falsifiable claim? If not, decompose into sub-questions.

## 2. Generate mechanistic hypotheses
Produce a ranked hypothesis set:
- **Primary-target hypothesis:** what the study aims to constrain and the key assumption required.
- **Nuisance-degradation hypothesis:** how a systematic could bias or inflate uncertainty.
- **Degeneracy hypothesis:** which nuisance directions overlap with the target in observable space.
- **Mitigation hypothesis:** how external data, alternative observables, or model redesign could break degeneracies.
- **Boundary hypothesis:** regimes where extrapolation is unsafe.
- For each, assign evidence strength (strong, moderate, weak, exploratory), key assumptions, likely failure modes, and a minimal validation test.
- **Decision gate:** Are all hypotheses falsifiable and linked to specific diagnostics? If not, refine.

## 3. Design controlled experiment or forecast
- Define independent variables (cosmological, astrophysical, design), nuisance variables, and dependent variables.
- Establish controls:
  - Baseline case (standard estimator or fixed nuisance).
  - Marginalized case (nuisance uncertainty propagated).
  - Positive control (known signal expected to be recovered).
  - Negative control (signal-absent or scrambled variant).
  - Systematics controls (perturbed foreground, selection, calibration, or model assumptions).
  - Ablation controls (remove one component at a time).
- Choose evaluation metrics that distinguish precision from robustness (e.g., parameter bias, covariance calibration, identifiability, information gain, stability across priors).
- Pre-register stopping conditions.
- **Decision gate:** Is the design minimal yet sufficient to test the core hypothesis? If too complex, strip non-essential components.

## 4. Build and validate inference machinery
- Construct or select a forward model, emulator, or estimator mapping parameters to the observable.
- Document the validated domain and interpolation assumptions.
- Run held-out diagnostics to quantify interpolation bias and uncertainty.
- Run mock-data recovery tests for primary and nuisance parameters.
- **Decision gate:** Do diagnostics meet predefined tolerance? If not, revise the model, expand training coverage, or shrink the inference domain before proceeding.

## 5. Execute transparent analysis
- Preprocess all data/mocks consistently across baseline, candidate, and control cases.
- Estimate covariance and cross-covariance with justified methods.
- Run baseline, candidate, and joint analyses.
- Quantify parameter response, degeneracy structure, and change in information content.
- Propagate nuisance uncertainty; do not treat fixed-nuisance forecasts as final detections.
- **Decision gate:** Are results stable under reasonable data cuts, binning choices, and preprocessing variations? If unstable, trigger iteration.

## 6. Stress-test and audit claims
- Vary priors, nuisance freedom, model families, and scale cuts.
- Test sensitivity to covariance approximations and simulation fidelity.
- Compare with independent methods or separate simulation suites where possible.
- Label every conclusion by evidence strength:
  - **Strong:** stable across multiple model families and data splits.
  - **Moderate:** supported under one coherent model family but sensitive to assumptions.
  - **Weak:** dependent on broad phenomenological modeling.
  - **Exploratory:** useful for prioritizing future work but insufficient for a claim.
- **Decision gate:** Does the claim survive boundary and sensitivity checks? If not, downgrade or reject.

## 7. Iterate or finalize
- If nuisance marginalization strongly degrades inference, return to Phase 2 to revise the nuisance model or mitigation strategy.
- If mock recovery fails or negative controls show spurious signal, return to Phase 4 to fix the estimator or forward model.
- If results are stable but conditional, state boundary conditions and propose the next validation step.
- If results are robust, document the audit trail and communicate conditional conclusions.
- **Stop conditions:** Halt and redesign if:
  - A nuisance parameter is non-identifiable.
  - Model recovery is biased without diagnosable cause.
  - The conclusion depends on a parameter at a prior boundary.
  - Constraints improve only before nuisance marginalization.
  - The inference domain lies outside validated emulator or simulation coverage.
  - A claimed tension disappears under a reasonable, independently motivated prior or nuisance model.

# Output Format

Produce the following structured deliverables:

1. **Research question** — Target, observable, and scientific motivation.
2. **Gap and baseline** — What the standard approach misses and why it matters.
3. **Hypotheses table** — For each hypothesis: claim, evidence strength, key assumptions, likely failure mode, minimal validation.
4. **Experimental or forecast design** — Variables, controls, metrics, and pre-registered stop conditions.
5. **Analysis plan** — Forward model / emulator setup, covariance estimation, parameter response, control evaluations, and robustness checks.
6. **Iteration plan** — Rules for updating, redesigning, or abandoning hypotheses based on diagnostic outcomes.
7. **Validity and ethics statement** — Confounders, reproducibility requirements, boundary conditions, evidence-strength labels, and communication risks.

# Validation Gates

Before advancing past each phase, confirm:
- **Scoping:** The question is testable and not an entire survey program.
- **Mechanistic clarity:** Each hypothesis links a physical or observational mechanism to a diagnostic.
- **Control coverage:** At least one positive, one negative, and one systematics control are defined.
- **Diagnostic pass:** Emulator, estimator, or model recovery meets predefined tolerance.
- **Stability:** Results do not flip under plausible perturbations of priors, nuisance models, or data cuts.
- **Traceability:** All assumptions, priors, model families, and data splits are documented.

# Claim Boundaries

- Treat forecasts, Fisher matrices, and emulator sensitivities as model-conditioned evidence, not as physical detections or field consensus.
- Distinguish validated pipeline behavior from agent-inferred extensions to new observables, redshifts, or tracers.
- Report coupled or degenerate parameter products explicitly; avoid decomposing them without independent justification.
- Do not extrapolate conclusions beyond the validated domain of simulations, emulators, or control tests.

# Failure Modes

Common ways this workflow breaks:
- **Unidentifiable nuisance:** A systematic parameter cannot be separated from the primary target, leading to biased or overconfident inference.
- **Domain violation:** The inference lies outside the validated emulator or simulation domain, producing unreliable interpolation.
- **Covariance instability:** The estimated covariance is noisy, non-positive-definite, or dominated by finite simulation volume.
- **Prior dominance:** A conclusion depends on a parameter resting at a prior boundary or on an informative prior that has not been sensitivity-tested.
- **Conflating fidelity with truth:** Confusing a successful mock recovery in idealized settings with guaranteed performance on real data.
- **Redundancy:** A proposed new statistic adds no non-redundant information beyond the baseline.

# Validity Checks

Before presenting any conclusion, check:
- **Confounding:** Are nuisance mechanisms separated enough to identify their effects? Are unmodeled systematics likely to produce similar observable responses?
- **Repeatability:** Can baseline, control, and marginalized comparisons be reproduced? Are priors, model family, observable definitions, and data splits recorded?
- **Statistical validity:** Are uncertainties derived from an appropriate likelihood or forecast approximation? Are parameter correlations reported, not only one-dimensional errors? Are figures of merit compared under consistent assumptions?
- **Boundary conditions:** Which regimes are outside the model’s validated domain? Which conclusions depend on a specific survey concept, simulation, calibration source, or nuisance parametrization?
- **Evidence labeling:** Is every claim labeled with its evidence strength, and are exploratory results clearly separated from robust findings?

# Provenance

This skill was synthesized from cluster 34 (subcluster 34.0) of the scientific skills codex. Source skills that informed the workflow structure include:
- `cosmology-systematics-forecasting-workflow`
- `weak-lensing-non-gaussian-summary-workflow`
- `hi-galaxy-cross-correlation-forecasting`
- `cluster-cosmology-aperture-mass-workflow`
- `nonlinear-cosmological-information-extraction`
- `tracer-pdf-cosmology-research-design`
- `galaxy-colour-som-research-design`
- `lyman-alpha-emulator-inference-design`
