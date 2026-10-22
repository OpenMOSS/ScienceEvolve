---
name: sci-cosmology-anomaly-mechanism-discovery-workflow-0af39517
description: A reusable end-to-end workflow for discovering and validating physical mechanisms behind anomalies in multiprobe astrophysical and cosmological datasets.
scienceevolve-title: "Galaxy, cosmology, and simulations · anomaly mechanism discovery workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

# Purpose

Guide agents through a reproducible, end-to-end route for turning observed anomalies into testable mechanism hypotheses, designing discriminating multiprobe experiments or analyses, and bounding claims through iterative validation and uncertainty auditing.

# When to use

Use this skill when:

- An observed anomaly, non-random spatial or temporal pattern, or systematic residual appears in astrophysical or cosmological data.
- Multiple competing mechanisms could explain the pattern.
- The data can be stratified by theoretically meaningful properties, cross-checked with complementary probes, or tested against simulations and null models.
- The goal is research design, hypothesis generation, experimental planning, or robustness evaluation rather than literature summarization or raw data processing.

Do not use this skill for operational detector engineering, real-time observation scheduling, hazardous procedural instructions, or as a substitute for domain-specific ethics review where human subjects are involved.

# Inputs required

Before starting, collect or request:

- **Anomaly definition:** the observed pattern, its statistic, and the dataset or survey context.
- **Mechanism candidates:** classes of physical processes that could produce the pattern, with predicted directional signatures.
- **Probes and data:** available observational channels, simulations, or catalogs, plus their known selection functions, calibration limits, and covariance properties.
- **Baseline/null model:** the reference model against which deviations are measured.
- **Nuisance and degeneracy inventory:** known confounders, systematic uncertainties, population-mixing risks, and parameter covariances.
- **Constraints:** resource limits, validity boundaries, and acceptable evidence thresholds.

# Core Workflow

Execute the following ordered stages. Treat each gate as a hard stop or redesign trigger unless the criterion is explicitly relaxed through documented iteration.

## 1. Anomaly quantification and null testing
Define a reproducible statistic that captures the pattern. Build a null model preserving essential low-level constraints (e.g., counts, distances, host properties, redshift distribution) while removing the directional or mechanistic information under test. Compare the observed statistic to the null distribution.
- **Decision gate:** If the anomaly is not significant against the null, or if small-number systems dominate the result, stop and refine the statistic or sample before proceeding.

## 2. Mechanism hypothesis generation
For each candidate mechanism, state the expected observable signature, including direction, scale dependence, population dependence, and redshift or environmental behavior. Separate distinct physical effects (e.g., total strength vs. coherence, propagation vs. emission, external generation vs. internal erasure). Label each hypothesis with:
- Evidence strength (strong, moderate, weak, speculative).
- Key assumptions and required physical conditions.
- Predicted positive and negative subpopulations.
- Likely failure modes.
- **Decision gate:** If no hypothesis produces a testable distinction among mechanisms, return to anomaly definition or seek additional probes.

## 3. Stratification and multiprobe design
Identify stratifiers (e.g., environmental context, evolutionary stage, population property, temporal label) that should modulate competing mechanisms differently. Design at least four study arms:
- Full-sample baseline.
- Stratified subpopulations.
- Multiprobe joint inference.
- Stress-test under altered assumptions.
Define controls:
- **Positive control:** a regime where the mechanism should be present based on prior validated evidence.
- **Negative control:** a regime where the mechanism should be negligible.
- **Method control:** an unsplit or standard-analysis baseline.
- **Calibration control:** external data or simulation used to check measurement and selection effects.
- **Decision gate:** If the stratifier is confounded with measurement quality, selection probability, or sample definition, redesign before analysis.

## 4. Forward modeling and simulation
Construct minimal forward models or mock catalogs for each mechanism. Use low-dimensional parameterizations that preserve required asymptotic behavior; avoid imposing unjustified parameter relations. Propagate uncertainties from selection, measurement, and nuisance parameters into prediction bands rather than single values.
- **Stop condition:** Stop if added mechanism parameters are unidentifiable, if priors dominate the inference, or if the parameterization violates known theory limits in the target regime.

## 5. Joint inference and degeneracy audit
Fit the null baseline first. Add mechanism parameters incrementally, diagnosing which parameter drives improved fit or identifiability. Analyze single-probe and multiprobe constraints separately, then jointly. Inspect residuals, parameter correlations, flat directions, and redshift-dependent structure.
- **Decision gate:** If the new parameter is fully degenerate with cosmology, source population, calibration, or nuisance terms, stop and reformulate the observable or add independent probes.

## 6. Robustness and stress testing
Vary sample definitions, object definitions, reference frames, nuisance models, covariance treatments, and excluded domains. Repeat with alternative statistics and projection choices. Test sensitivity to prior mismatch, missing data, and atypical event morphology.
- **Decision gate:** If the result depends on a single fragile definition, projection, or frame choice, downgrade the claim to exploratory and expand robustness checks.

## 7. Mechanism exclusion or iteration
Compare the model hierarchy (minimal vs. rich). Evaluate whether the evidence supports the pattern, the mechanism, both, or neither.
- **If supported:** tighten the parameterization, propose targeted follow-up, and add further robustness tests.
- **If degenerate:** add probes, change stratification, or reformulate the observable.
- **If excluded:** document the failure mode and revisit hypothesis generation.
- **Stop conditions:** Claim is bounded, resource is exhausted, or the hypothesis is falsified by a decisive control.

## 8. Claim bounding and uncertainty audit
State what is directly supported by the design, what remains plausible but unverified, and what is speculative. Define validity boundaries (regime, scale, population, redshift range). List residual failure modes and risks of extrapolation.

# Output Format

Return a structured research plan containing:

1. **Research question** — Gap being addressed and why it is tractable with the proposed observable.
2. **Hypothesis table** — For each mechanism: expected signature, evidence strength, key assumptions, predicted positive/negative subpopulations, and failure modes.
3. **Experimental design** — Baseline model, alternative parameterizations, stratification strategy, study arms, controls, evaluation metrics, and stop conditions.
4. **Analysis plan** — Sequential fitting strategy, degeneracy checks, joint inference approach, diagnostics, and robustness tests.
5. **Iteration criteria** — Rules for accepting, revising, or rejecting each hypothesis based on outcomes.
6. **Validity and boundary statement** — Supported claims, speculative extensions, and regimes where the method should not be extrapolated.

# Validation Gates

Apply these stage-specific checks before advancing:

- **Anomaly gate:** Statistic is significant against a reasonable null and not driven by small-number noise.
- **Discriminability gate:** At least one mechanism predicts a distinct signature in an accessible observable.
- **Stratifier gate:** Stratification variable is theoretically linked to the mechanism and not confounded with measurement quality.
- **Identifiability gate:** New parameters are constrained by data and not fully absorbed into nuisance or baseline parameters.
- **Robustness gate:** Conclusion persists across alternative definitions, frames, and subsamples.
- **Convergence gate:** Fitting chains converge, priors are reported, and model comparisons use comparable complexity.

# Claim Boundaries

- Distinguish the **observed pattern** from the **inferred mechanism**; the former requires only null-model rejection, the latter requires discriminative evidence.
- Separate **theory-derived** predictions from **phenomenological** parameterizations and from **agent-inferred** extrapolations.
- Mark conclusions as **observed**, **inferred**, or **hypothesized** based on the level of evidence.
- Do not present single-catalog, single-object, or single-simulation results as field-wide consensus.
- State where the method applies and where it should not be extrapolated (e.g., regimes with strong screening, non-equilibrium dynamics, or unmodeled source populations).

# Failure Modes

- The anomaly is a statistical fluctuation, systematic artifact, or selection effect.
- A candidate mechanism is mimicked by an unmodeled nuisance (calibration error, covariance misspecification, population mixing, or projection effect).
- The stratifier is confounded with selection, measurement quality, or redshift.
- Insufficient leverage (redshift, resolution, sample size, or signal-to-noise) to distinguish competing models.
- The parameterization is invalid in the target regime (e.g., violates asymptotic limits or assumes monotonicity where oscillations exist).
- Results depend entirely on one unverified catalog assumption, object definition, or prior choice.

# Validity Checks

Before treating a result as meaningful, verify:

- **Measurement validity:** The statistic captures the intended construct and is not a proxy artifact.
- **Selection bias:** The sample is not dominated by successful, funded, bright, or otherwise selected cases; failed or null cases are considered where possible.
- **Confounding:** Environmental, instrumental, and population variables are separated from the mechanism effect through design or analysis.
- **Temporal ordering:** Where causality is implied, the proposed mechanism precedes or coherently relates to the observed outcome.
- **Statistical validity:** Chains converge, priors are documented, posterior widths are stable, and model-selection metrics account for comparable parameter counts.
- **Reproducibility:** Sample definitions, model specifications, random seeds, and transformations are recorded; failed tests are preserved.
- **Boundary validity:** The model is not extrapolated into regimes where theory, calibration, or covariance is unreliable.

# Provenance

- Synthesized from cluster **17.2** (end-to-end mechanism discovery and validation).
- Source-skill references: `gw-standard-siren-cosmology-workflow`, `satellite-anisotropy-exploration`, `weak-lensing-ia-research-design`, `low-latency-multimessenger-followup-design`, `magnetized-galaxy-evolution-research-design`, `mond-udg-environment-workflow`, `team-science-collaboration-research-design`, `ecological-knowledge-heuristic-research-design`.
