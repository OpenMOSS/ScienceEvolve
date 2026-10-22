---
name: sci-cosmology-cosmology-systematics-evidence-audit-work-69de2bf8
description: End-to-end evidence analysis and claim audit workflow for observational cosmology, designed to bound scientific claims by unifying heterogeneous data, calibrating systematics through forward modeling, and validating via cross-probe and simulation-based controls.
scienceevolve-title: "Galaxy, cosmology, and simulations · cosmology systematics evidence audit workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

# Purpose

Guide the agent in designing reproducible, end-to-end research workflows for observational cosmology and large-scale structure studies. The workflow transforms data tensions or measurement gaps into bounded scientific claims by explicitly modeling selection effects, systematic biases, and incompleteness, then validating inference through simulation calibration and independent cross-checks. It is not a domain encyclopedia; it is a route for auditing evidence before claiming discovery.

# When to use

- When constraining cosmological or astrophysical parameters from heterogeneous surveys, catalogs, or multi-probe datasets.
- When a potential signal could originate from unmodeled selection functions, calibration differences, resolution limits, or algorithmic biases rather than new physics.
- When combining probes that share underlying physics but suffer from different systematics (e.g., clustering, lensing, dynamics, distance indicators).
- When designing experiments that require mock catalogs, emulator-based forward models, synthetic data injections, or stacking of weak tracers.
- When the goal is to distinguish "verified statistical recovery" from "exploratory inference" and to prevent over-interpretation of residual trends.

# Inputs required

- **Research question**: Target physical parameters, observable proxies, redshift/scale range, and the specific gap or tension to address.
- **Data sources**: Heterogeneous observations or catalogs with documented selection functions, masks, measurement errors, and completeness estimates.
- **Forward-model resources**: Simulation suites, mock catalogs, emulators, or synthetic-data pipelines capable of reproducing the observation–physics mapping under known conditions.
- **Baseline models**: At least one runnable theoretical or empirical model for null comparison.
- **Validation resources**: Independent probes, higher-resolution subsets, alternative algorithms, cross-matched subsamples, or held-out test data.
- **Success criteria**: Acceptable uncertainty levels, tolerance for systematic bias, pre-defined stopping conditions, and reproducibility requirements.

# Core Workflow

Execute the following steps in order. At each decision gate, pause and iterate or stop if the criterion is not met.

1. **Gap and Tension Diagnosis**  
   Frame the scientific question by identifying the measurement gap, observational tension, or unmodeled regime. Explicitly distinguish a physical anomaly from a potential systematic artifact.  
   *Decision gate*: Is the tension reproducible across independent data slices? If no, stop and audit data processing.

2. **Systematics Decomposition**  
   Decompose plausible biases into testable hypotheses: selection functions, calibration drift, resolution limits, contamination, projection effects, classification errors, and environmental covariance. Assign each an evidence strength (high / medium / low / inferred).  
   *Decision gate*: Can the leading systematics be quantified or bounded? If no, stop and redesign the data strategy.

3. **Sensitive Statistic / Proxy Design**  
   Construct observables or summary statistics that are monotonically sensitive to the target hidden variable or physical mechanism, while suppressing common-mode noise. Design at least one complementary statistic drawn from an independent physical origin to break degeneracies.  
   *Decision gate*: Do mock tests show the statistic responds predictably to the target parameter and weakly to dominant confounders? If no, return to step 2.

4. **Forward-Model Calibration**  
   Use simulations, emulators, or synthetic catalogs to build a calibration curve mapping data statistics to physical quantities. Perform injection–recovery tests: inject known signals into mocks and verify unbiased recovery of means, variances, and tail probabilities. Run negative controls (randomized labels, null templates) and positive controls (known-signal settings).  
   *Decision gate*: Does the estimator recover injected parameters within pre-specified tolerance, and do negative controls remain null? If no, revise the statistic or forward model and return to step 3.

5. **Heterogeneous Data Unification**  
   Map all data sources to a common measurement scale. Explicitly model cross-survey calibration differences, selection functions, noise properties, and mask effects. Propagate systematic uncertainties into a structured error budget (independent and correlated components).  
   *Decision gate*: Is the error budget closed and dominated by quantifiable terms? If unquantified errors dominate, stop and bound the claim accordingly.

6. **Blinded Inference and Residual Audit**  
   Execute parameter estimation or hypothesis testing using a pre-registered analysis plan or blinding protocol where feasible. Audit residuals for correlations with sample source, redshift, environment, proxy variables, or observational conditions.  
   *Decision gate*: Are residuals statistically structureless? If structured residuals persist, treat them as evidence of unmodeled systematics and return to step 2.

7. **Cross-Probe and External Validation**  
   Validate the result against an independent probe, alternative algorithm, higher-resolution sample, or external catalog that shares the target physics but not the dominant systematics.  
   *Decision gate*: Do independent validations agree within the combined error budget? If no, bound the claim to the subset of consistent probes or return to step 4.

8. **Claim Bounding and Evidence Grading**  
   Grade the final claim:
   - **Strong**: Multiple independent statistics and probes agree; mocks recover the signal; systematics are subdominant.
   - **Moderate**: Consistent main result, but sensitive to a quantified systematic or limited to a subset of the data.
   - **Exploratory**: Single-statistic or single-probe support, or non-negligible model dependence.
   Explicitly state the applicable range in mass, redshift, scale, or object type, and forbid extrapolation beyond the calibrated regime.

9. **Iteration or Controlled Exit**  
   If any gate fails irreducibly, document the failure mode, downgrade the evidence, and either:
   - Return to step 2 with revised hypotheses,
   - Return to step 3 with alternative statistics, or
   - Stop and report a bounded null / inconclusive result.

# Output Format

Each invocation must produce:

1. `Research question` — One-sentence definition with domain boundaries.
2. `Gap diagnosis` — Measurement blind spots, tensions, and why existing constraints are insufficient.
3. `Hypotheses` — 3–5 testable hypotheses, each with: target mechanism, evidence strength, key assumptions, falsifiable predictions, and failure modes.
4. `Experimental design` — Minimal viable validation, strong controls, negative controls, positive controls, variable definitions (independent / dependent / control), evaluation metrics, and stop conditions.
5. `Analysis plan` — Data preparation, statistic definitions, error estimation, forward-model calibration, model comparison, and diagnostic visualization.
6. `Iteration plan` — Update rules for retaining, revising, or discarding hypotheses based on mock recovery, residual structure, and cross-probe agreement.
7. `Validity and ethics statement` — Confounding factors, reproducibility checklist, boundary conditions, data compliance, and evidence-strength rationale.
8. `Evidence boundary note` — Clear separation of verified results, model-supported conclusions, and agent-inferred claims.

# Validation Gates

- **Injection–Recovery Gate**: Known parameters must be recovered in mocks with bias smaller than the pre-defined tolerance.
- **Negative-Control Gate**: Null configurations must not produce spurious signals at the significance level used for discovery.
- **Residual-Structure Gate**: Residuals must show no significant correlation with sample source, redshift, environment, or observational metadata.
- **Covariance-Realism Gate**: Error estimates must be validated against mock or resampling variance; bootstrap/jackknife estimates must not underestimate tails.
- **Cross-Probe Consistency Gate**: Independent probes must agree within the quadrature sum of their error budgets.
- **Coverage Gate**: Credible intervals must exhibit correct frequentist coverage when tested on held-out simulations.

# Claim Boundaries

- Distinguish "verified forward-model response" from "inference on new data." Only the former is calibrated; the latter carries additional model-dependence risk.
- Label conclusions that rely on a single statistic, single probe, or single simulation as **exploratory**.
- Do not extrapolate proxy relationships (e.g., mass, concentration, luminosity) across definitions or regimes without explicit re-calibration.
- Never present a single-study or single-catalog result as domain consensus.
- If a result is explainable by selection bias, calibration drift, or an unmodeled confounder, downgrade the claim to a systematic hypothesis rather than a physical discovery.

# Failure Modes

- **Systematic Dominance**: Unquantified or irreducible systematics exceed the target signal.
- **Estimator Insensitivity**: The chosen statistic lacks monotonic response to the target parameter in calibration tests.
- **Control Failure**: Negative controls produce signals comparable to the primary analysis.
- **Cross-Probe Disagreement**: Independent probes yield mutually inconsistent results that cannot be reconciled by known error terms.
- **Covariance Misspecification**: Assumed error structure underestimates variance or ignores correlations, leading to overconfident inference.
- **Extrapolation Collapse**: Conclusions depend on regions where the forward model was not validated.
- **Sample Variance Limit**: Cosmic variance or small-sample noise dominates over the physical effect.

# Validity Checks

- **Definition Consistency**: Ensure proxy variables, object definitions, and selection criteria are identical (or consistently mapped) across data sets, simulations, and theoretical models.
- **Selection-Bias Audit**: Verify that the sample is representative of the target population; report the impact of every cut, mask, and quality filter on sample composition.
- **Contamination Quantification**: Estimate and model background contamination, projection effects, misclassification, and interloper fractions.
- **Statistical Validity**: Confirm error estimates are unbiased via mock tests; report covariance, not just diagonal errors; check for over-dispersion or non-Gaussian tails.
- **Reproducibility**: Fix random seeds, record software versions, document pipeline steps, and archive selection rules so the analysis can be re-run exactly.
- **Boundary Conditions**: State the valid ranges of mass, redshift, scale, object type, and environmental density. Flag any extrapolation.
- **Sensitivity Audit**: Test stability against binning choices, prior ranges, alternative forward models, and subsetting of the data.

# Provenance

Synthesized from cluster 2.0 (cosmology-galaxy-lensing-systematics-evidence-analysis-workflow) and representative source skills: galaxy-halo-scatter-exploration, supernova-cosmology-sample-synthesis, galaxy-cluster-systematics-exploration, cosmological-substructure-completeness-workflow, cosmology-emulator-cross-probe-research, galaxy-satellite-dynamics-research, cosmology-halo-representative-sampling, astrophysical-mock-map-research-workflow.
