---
name: sci-cosmology-observable-driven-mechanism-discovery-wor-4bbaadbd
description: Use this skill when designing end-to-end research workflows that infer hidden astrophysical or cosmological mechanisms from observational signatures via simulation-based counterfactuals, controlled model comparison, and multi-scale validation.
scienceevolve-title: "Galaxy, cosmology, and simulations · observable driven mechanism discovery workflow 3"
scienceevolve-area: galaxy-cosmology-and-simulations
---

## Purpose

Guide agents through a reusable, end-to-end workflow to discover and validate physical mechanisms behind observational anomalies or statistical trends in cosmology and large-scale structure. The workflow emphasizes falsifiable hypothesis generation, controlled simulation or model adjudication, systematic ablation, multi-probe consistency, and evidence-aware iteration.

## When to use

Use this skill when the user wants to:

- Turn an observational anomaly, gradient, or modeling gap into falsifiable mechanism hypotheses.
- Compare a candidate mechanism against a baseline explanation using simulations, mock catalogues, or theoretical counterfactuals.
- Design multi-probe or multi-scale studies that separate mechanism-specific signatures from astrophysical, instrumental, or numerical systematics.
- Iterate on hypotheses based on controlled evidence, external constraints, and robustness checks.

Do not use this skill as a source of settled field consensus, as an instrument operations manual, or for domains unrelated to astrophysical/cosmological mechanism inference.

## Inputs required

Before generating a research plan, identify or request:

- **Target observable or anomaly**: the measured trend, residual, or population statistic that motivates the study.
- **Baseline model**: the simplest or most accepted explanation that must be outperformed.
- **Candidate mechanism(s)**: the hidden process, physical law, or component whose effect is being tested.
- **Organizing scale or regime**: the length, time, mass, or coherence scale at which the mechanism should become visible.
- **Data and simulation assets**: surveys, catalogues, simulation pipelines, likelihoods, or analytic approximations available for the study.
- **Known systematics and confounders**: selection effects, calibration limits, foregrounds, baryonic physics, resolution boundaries, and nuisance parameters.
- **Desired scope**: hypothesis generation, minimal viable validation, full observational or simulation campaign, or forecast design.

If any input is missing, state the gap and propose a minimal study that can still test the core mechanism-specific prediction.

## Core Workflow

Follow this ordered route. Each step includes a decision gate; stop or redesign if the gate fails.

### 1. Frame the gap and baseline
Define the unresolved question and the strongest baseline model. State why the baseline is insufficient and what observable would discriminate explanations.
- **Gate**: Is the anomaly well-defined and the baseline explicit? If not, stop and clarify inputs.

### 2. Generate mechanism hypotheses
Produce falsifiable hypothesis cards containing:
- Candidate mechanism and physical pathway to the observable.
- Organizing scale or regime where the effect should appear.
- Predicted signature in spatial, temporal, spectral, or correlation structure.
- Evidence strength (high / moderate / low / speculative).
- Key assumptions and boundary conditions.
- Likely failure modes and competing explanations.
- **Gate**: Are hypotheses falsifiable and do they compare at least two mechanisms? If not, reformulate.

### 3. Design controlled adjudication
Build a minimal viable validation study before scaling up.
- Define independent variables (mechanism parameters, environment, scale), dependent variables (target observable), and nuisance covariates.
- Establish controls:
  - **Positive control**: condition where the mechanism should produce a clear signal.
  - **Negative control**: condition where the mechanism should be absent or suppressed.
  - **Strong / specificity control**: comparison targeting the most likely confound or predicted scale/channel.
  - **Robustness control**: ablation of model components, nuisance variations, or independent likelihood/data split.
- Pre-specify evaluation metrics and stopping/failure criteria.
- **Gate**: Can the study distinguish the candidate from the baseline and known confounders? If not, redesign or stop.

### 4. Execute simulation or observable synthesis
Translate mechanisms into predicted observables through simulations, mocks, or analytic bridges. Apply observational selection, noise, and window functions transparently. Reproduce the baseline first to verify pipeline integrity.
- **Gate**: Does the baseline recover expected behavior? If not, fix definitions or numerics before interpreting anomalies.

### 5. Compare and discriminate
Run the candidate against the baseline and alternatives. Quantify differences using pre-specified metrics. Decompose signals by component, scale, environment, or population. Check for compensation, saturation, or degeneracy.
- **Gate**: Does the candidate improve explanation beyond the baseline in a mechanism-specific way? If ambiguous, proceed to ablation.

### 6. Ablate and robustness-check
Systematically vary nuisance assumptions, model components, priors, and systematics. Test alternative explanations (e.g., selection effects, baryonic physics, calibration drift). Verify regime validity (linear vs. nonlinear, resolution limits, scale ranges).
- **Gate**: Does the signal survive ablation and alternative explanations? If not, demote the hypothesis.

### 7. Validate against external constraints
Check multi-scale consistency, physical budgets (mass, energy, enrichment), and independent probes. Ensure the mechanism does not create worse inconsistencies elsewhere.
- **Gate**: Does the mechanism satisfy external constraints? If not, revise boundary conditions or reject.

### 8. Grade evidence and bound claims
Label evidence strength for each claim. Separate paper-supported method patterns, cross-study support, and agent-inferred extensions. State boundary conditions, extrapolation limits, and reproducibility metadata (data versions, pipeline configs, random seeds).
- **Gate**: Are claims bounded and is reproducibility documented? If not, halt for documentation.

### 9. Iterate or terminate
Update the research program based on outcome:
- **Mechanism-specific signal**: expand to stronger probes, independent datasets, or broader systems.
- **Ambiguous signal**: design the next minimal test to break degeneracy.
- **Baseline-like / no signal**: revise or abandon the candidate; check sensitivity and selection effects first.
- **Systematics-dominated**: characterize systematics as the next research product.
- **Wrong-scale signal**: revisit the organizing scale or regime boundary.

**Stop conditions** (pre-specified):
- Uncertainties dominate the expected effect size.
- Controls fail or the pipeline cannot recover baseline behavior.
- The hypothesis becomes non-falsifiable with available assets.
- Independent constraints rule out the mechanism.

## Output Format

Return the research plan in this structure:

1. **Research question** — target anomaly, baseline model, candidate mechanism.
2. **Hypothesis cards** — mechanism, evidence strength, key assumptions, predicted observations, failure modes, boundary tests.
3. **Experimental design** — variables, covariates, positive/negative/strong/robustness controls, metrics, stop conditions.
4. **Analysis plan** — baseline reproduction, candidate-model test, systematic ablations, alternative-model comparison, reproducibility checks.
5. **Evidence map and claim boundaries** — what is directly observed, inferred, or uncertain; explicit claim limits.
6. **Iteration plan** — how each possible outcome updates the hypothesis and the next minimal validation step.
7. **Validity and safety notes** — main confounders, extrapolation boundaries, and non-operational safety or ethics constraints.

## Validation Gates

Before finalizing the plan or presenting conclusions, confirm:

- The question is mechanism-centered, not merely candidate-centered.
- The baseline model is explicit, competitive, and reproduced successfully.
- The organizing scale or regime is used to choose observables and controls.
- The design includes positive, negative, strong/specificity, and robustness controls.
- The analysis includes systematic ablations and alternative-model comparisons.
- Evidence strength, key assumptions, and failure modes are labeled for every hypothesis.
- Reproducibility details are documented (data provenance, pipeline choices, code versions, random seeds, configuration files).
- External constraints and physical consistency are checked.
- No single paper, dataset, or simulation is treated as field-wide consensus.

## Claim Boundaries

- Distinguish paper-supported method patterns from agent-inferred hypotheses and speculative extensions.
- Limit claims to the tested model family, scale range, redshift range, mass range, and observational regime.
- Do not extrapolate beyond validated boundaries or present model-dependent inferences as established cosmic consensus.
- Mark forecasts, sensitivity estimates, and extrapolations explicitly.

## Failure Modes

- **Attribution error**: The signal is caused by systematics, selection effects, nuisance parameter variation, or implementation choices rather than the proposed mechanism.
- **Degeneracy**: Multiple mechanisms or parameter combinations produce identical observable signatures within current precision.
- **Compensation or saturation**: The model improves one diagnostic while worsening another, or nonlinear evolution erases predicted differences.
- **Overfitting**: Flexible templates or feature searches without appropriate look-elsewhere or complexity penalties.
- **Insufficient scale coverage**: The survey or simulation does not probe the regime where the mechanism should operate.
- **External inconsistency**: The mechanism explains the target anomaly but violates independent physical budgets or multi-scale constraints.
- **Implementation confounding**: Numerical resolution, halo definition, mass proxy, or subgrid model drives apparent agreement or disagreement.

## Validity Checks

- **Confounding**: Separate mechanism effects from selection, calibration, foregrounds, and baryonic physics.
- **Statistical validity**: Account for sample variance, covariance misspecification, multiple-comparison risk, prior sensitivity, and non-independent data splits.
- **Numerical validity**: Verify convergence, resolution, finite-volume effects, solver tolerance, and halo-finding consistency.
- **Model validity**: Check subgrid assumptions, boundary conditions, cosmic variance, and whether simulated populations match observed ones.
- **Scale and regime coverage**: Confirm that linear approximations, projection effects, and mask corrections are valid where the signature is measured.
- **Reproducibility**: Record model definitions, parameter files, random seeds, likelihood choices, and post-processing steps.
- **Boundary conditions**: State redshift, mass, scale, environment, and tracer-population limits explicitly.

## Provenance

Derived from cluster 22.0 (observable-driven mechanism discovery and validation) and representative source skills: wave-dark-matter-research-exploration, intergalactic-dust-simulation-research, assembly-bias-research-design, cmb-inflation-model-constraining-research, dark-energy-structure-growth-exploration, early-universe-feature-observational-constraints, dark-matter-multiscale-model-exploration, cosmology-structure-formation-simulation-design.
