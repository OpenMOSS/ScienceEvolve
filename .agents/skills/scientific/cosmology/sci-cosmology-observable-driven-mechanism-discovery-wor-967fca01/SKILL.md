---
name: sci-cosmology-observable-driven-mechanism-discovery-wor-967fca01
description: A reusable end-to-end workflow for designing research questions that use observables, simulations, and controlled comparisons to discover and validate physical mechanisms while bounding degeneracies and nuisance effects.
scienceevolve-title: "Galaxy, cosmology, and simulations · observable driven mechanism discovery workflow 2"
scienceevolve-area: galaxy-cosmology-and-simulations
---

## Purpose

Guide agents in designing rigorous, reusable research plans for observable-driven mechanism discovery and validation. The workflow synthesizes a cross-cutting pattern from cosmology and astrophysics: start from a baseline limitation or degeneracy, generate falsifiable hypotheses, construct controlled model or observational comparisons, validate with simulations or mock data, discriminate mechanisms through multi-representation tests, audit uncertainties, and iterate until claims are bounded by evidence.

## When to use

Trigger this skill when a user asks to:
- Propose or evaluate a new research question where standard observables are degenerate, incomplete, or confounded.
- Design a study combining multiple statistics, probes, or model representations to break degeneracies.
- Validate a physical mechanism against backgrounds, nuisance effects, or standard-parameter shifts.
- Plan robustness checks, sensitivity forecasts, or model-comparison experiments in cosmology, large-scale structure, galaxy evolution, or related astrophysical inference problems.

Do not use for operational laboratory protocols, hazardous procedures, instrument fabrication, or as a substitute for domain-specific safety reviews.

## Inputs required

Before generating a plan, collect or infer:

- **Target system and regime:** survey, simulation, tracer population, redshift range, or synthetic data context.
- **Baseline observable and limitation:** the standard statistic, diagnostic, or model currently used and why it is insufficient.
- **Candidate mechanism or signal:** the physical effect, model modification, or higher-order process to be tested.
- **Complementary observables or representations:** alternative statistics, scales, probes, or model variants that could break degeneracies.
- **Validation resources:** simulations, mock catalogs, control samples, covariance estimates, or independent realizations.
- **Nuisance and systematics:** known backgrounds, selection effects, calibration uncertainties, model errors, or parameter degeneracies.
- **Decision goal:** research question portfolio, minimal validation plan, full experimental design, or mechanism discrimination study.

## Core Workflow

Execute the following ordered route with decision gates and iteration/stop conditions.

1. **Gap Definition & Baseline Audit**
   - Define the target observable and identify the baseline limitation (degeneracy, suppression, insensitivity, or confounding).
   - Document which standard parameters or nuisance effects could mimic the proposed mechanism.
   - *Gate:* If the baseline limitation cannot be stated as a measurable ambiguity, stop and refine the question.

2. **Hypothesis Generation**
   - For each candidate mechanism, formulate a concise causal or inferential claim.
   - Assign evidence strength (strong, moderate, weak, speculative) and label transferability.
   - List key assumptions, predicted observable signatures, and explicit failure modes.
   - Include at least one null or alternative hypothesis (e.g., standard-parameter shift, nuisance absorption, selection effect).
   - *Gate:* If no hypothesis is falsifiable with available or obtainable data, stop and redefine scope.

3. **Controlled Comparison Design**
   - Define baseline, primary-effect, nuisance-effect, and combined-effect cases.
   - Specify independent, dependent, and nuisance variables abstractly.
   - Design controls: negative (signal-absent or mechanism-off), positive (known effect), parameter-shift (degeneracy absorption), and method (alternative definitions or estimators).
   - Set evaluation metrics: residual structure, parameter bias, degeneracy rotation, information gain, stability, and recovery fidelity.
   - *Gate:* If controls cannot isolate the mechanism from degeneracies, redesign before proceeding.

4. **Forward Model & Simulation Validation**
   - Build a modular prediction pipeline: map physical parameters to observables through the most reliable methods in each regime (theory, emulator, simulation).
   - Validate against high-fidelity mocks or synthetic data with known inputs.
   - Test estimator bias, covariance convergence, and model recovery under controlled conditions.
   - *Gate:* If mock recovery fails or scale cuts dominate, stop to fix the forward model or estimator.

5. **Mechanism Discrimination & Multi-Representation Test**
   - Compare the candidate mechanism against the baseline after allowing standard parameters to absorb part of the effect.
   - Evaluate the signal in more than one observable representation or summary statistic.
   - Test whether combined effects factorize or interact; quantify residual coupling.
   - Inspect high-leverage regions (e.g., tails, redshift evolution, scale dependence) where degeneracies break.
   - *Gate:* If the signature disappears under standard-parameter rescaling or alternative representations, downgrade or reject the hypothesis.

6. **Uncertainty Audit & Robustness Scan**
   - Propagate nuisance uncertainties and vary dominant assumptions within justified ranges.
   - Perform stability checks: scale cuts, binning, resolution, selection thresholds, and covariance convergence.
   - Identify breakpoints where conclusions change qualitatively.
   - *Gate:* If conclusions depend strongly on arbitrary choices or unverified nuisance priors, stop and bound the claim.

7. **Claim Bounding & Inference Readiness**
   - Classify each conclusion as directly measured, model-inferred, or speculative.
   - Reparameterize degenerate quantities into better-constrained combinations when individual parameters are inseparable.
   - State the validated domain: scales, redshifts, tracers, regimes, and model families where the result holds.
   - *Gate:* If residual model error approaches observational uncertainty, require additional mock inference before claiming constraints.

8. **Iteration or Redesign**
   - Use results to update the research plan:
     - Strengthen if independent controls and multi-representation tests agree.
     - Refine if errors localize to a regime boundary or nuisance model.
     - Redirect if the mechanism is indistinguishable from standard physics or nuisance effects.
     - Stop if recovery fails, data splits disagree, or the method works only under untested extrapolations.
   - *Stop condition:* End when claims are bounded by evidence, or when validation uncertainty dominates and no further discrimination is possible without new data.

## Output Format

When using this skill, return:

1. **Research question** — Target system, baseline limitation, and scientific goal.
2. **Ranked hypotheses** — Mechanism claims with evidence strength, assumptions, failure modes, and minimal tests.
3. **Controlled comparison design** — Variables, controls, metrics, and stopping conditions.
4. **Validation plan** — Forward model, mock recovery checks, robustness scans, and stability criteria.
5. **Analysis plan** — Measurement steps, covariance/sensitivity estimation, multi-representation tests, and visualization strategy.
6. **Iteration roadmap** — Decision rules for strengthening, weakening, redirecting, or stopping each hypothesis.
7. **Claim boundary statement** — Validated domain, confounders, reproducibility requirements, and what remains unverified.

## Validation Gates

- **Gap clarity:** The baseline limitation is expressed as a measurable ambiguity.
- **Falsifiability:** Every hypothesis has a defined minimal test and failure mode.
- **Control isolation:** The mechanism can be toggled or discriminated independently of standard-parameter shifts and dominant nuisances.
- **Mock recovery:** The pipeline recovers known inputs within expected uncertainty.
- **Representation robustness:** The signature persists across multiple observables or analysis definitions.
- **Stability:** Covariance, sensitivity derivatives, and nuisance variations do not overturn the conclusion.
- **Coverage:** Statistical intervals or discovery metrics have appropriate coverage for the intended claim.

## Claim Boundaries

- Distinguish paper-supported methods from newly inferred or speculative claims.
- Do not treat one paper's constrained combination, simulation suite, or forecast as field-wide consensus.
- Report constrained parameter combinations rather than overclaiming individual parameter measurements when degeneracies persist.
- Label model-inferred quantities as such; avoid presenting them as direct measurements without stating assumptions.
- State explicitly where the method should not be extrapolated (e.g., beyond calibrated scales, redshifts, feedback regimes, or tracer populations).

## Failure Modes

- **Degeneracy absorption:** The apparent signal is explained by standard parameter shifts or nuisance effects.
- **Representation dependence:** The signature appears only under one arbitrary analysis choice.
- **Mock recovery failure:** The pipeline cannot recover known synthetic inputs.
- **Covariance instability:** Uncertainty estimates depend on finite realizations or numerical choices.
- **Nuisance dominance:** The result is controlled by unconstrained nuisance parameters or background assumptions.
- **Extrapolation beyond domain:** The model is applied outside its validated regime.
- **Overfitting:** Complex transformations or selections optimize noise rather than physical signal.

## Validity Checks

- **Confounding:** Ensure changes are not caused by altered weights, cuts, masks, binning, or simulation assumptions.
- **Reproducibility:** Record data versions, selection definitions, model inputs, random seeds, and analysis parameters.
- **Boundary conditions:** State the scale, redshift, tracer, survey-geometry, or model-family regime where validation holds.
- **Statistical adequacy:** Verify that realizations, mocks, or samples are sufficient for claimed precision.
- **Model consistency:** Confirm normalization, physical support, and frame transformations across all model variants.
- **External validity:** Avoid generalizing from a single catalog, simulation, or survey configuration without cross-checks.

## Provenance

- Derived from cluster 5.1 (observable-driven mechanism discovery and validation).
- Synthesized from source skills: `joint-clustering-inference-large-scale-structure`; `rare-event-sensitivity-forecasting`; `cmb-lensing-model-validation`; `interacting-dark-energy-structure-growth-workflow`; `dark-matter-velocity-nuisance-explorer`; `cosmology-marked-statistics-research-workflow`; `xray-group-environment-research-design`; `galaxy-uv-sfh-merger-mechanism-exploration`.
- Preserves reusable workflow logic without paper-specific parameters, numerical results, or operational protocols.
