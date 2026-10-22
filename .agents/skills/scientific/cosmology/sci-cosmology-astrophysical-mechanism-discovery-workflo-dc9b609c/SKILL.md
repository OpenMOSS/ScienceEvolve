---
name: sci-cosmology-astrophysical-mechanism-discovery-workflo-dc9b609c
description: Design reusable research plans to discover, discriminate, and validate astrophysical mechanisms using multi-scale observations, controlled simulations, and iterative hypothesis testing with strict claim bounding.
scienceevolve-title: "Galaxy, cosmology, and simulations · astrophysical mechanism discovery workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

## Purpose

This skill helps an agent turn an astrophysical or cosmological tension into a falsifiable mechanism-discovery workflow. It abstracts a reusable route: frame a population-level or multi-probe gap, generate competing mechanism hypotheses, design controlled validations with nested baselines, harmonize observables across data and simulation, discriminate mechanisms through ablation and model-family comparison, and iterate based on residuals and robustness audits. The goal is to separate physical mechanisms from numerical, observational, or model artifacts without treating any single study as field-wide consensus.

## When to use

Use this skill when:
- Proposing new research questions about galaxy formation, large-scale structure, cluster dynamics, magnetized plasmas, or dark-sector phenomenology where the central challenge is identifying the physical mechanism behind a population-level pattern, spatial diagnostic, or multi-probe signature.
- Comparing theoretical mechanisms using simulation families, semi-analytic models, emulators, or mock catalogs against observations.
- Testing whether a proposed mechanism explains distributions, scaling relations, gradients, or topological features rather than individual objects or noise.
- Validating approximations, calibrations, or numerical methods before interpreting physical signals.

Do not use this skill for operational telescope or detector scheduling, executable high-risk computational recipes, hazardous protocols, or claims that a single model result proves a cosmological mechanism.

## Inputs required

Before generating a research plan, identify:
- **Target system and regime:** object class, redshift or spatial range, environment, and dynamical state.
- **Observable gap or anomaly:** the population-level pattern, distribution shape, scaling residual, or multi-probe tension that existing models fail to explain.
- **Candidate mechanism families:** e.g., halo assembly, gas cooling, feedback, mergers, turbulent amplification, projection effects, screening, or dark-sector topology.
- **Data and simulation assets:** available surveys, simulations, resolution levels, mock-observable pipelines, and known selection functions.
- **Baselines and systematics:** standard models, known numerical limits, calibration uncertainties, and survey selection effects.
- **Evaluation scope:** intended generalization, success criteria, and stopping conditions.

## Core Workflow

Execute the following ordered route. Treat each gate as a hard stop until satisfied; if a gate fails, return to the previous step or redesign.

1. **Frame the population-level gap.**
   - Define the question in terms of distributions, correlations, or evolutionary trends rather than single objects.
   - Identify which observable property should change if the candidate mechanism operates.
   - *Gate:* The question must be falsifiable at the population or ensemble level.

2. **Generate competing mechanism hypotheses.**
   - Propose at least three explanations: the target mechanism, a null or baseline process, and at least one confounding alternative (numerical, observational, or competing physical).
   - For each hypothesis, state: evidence strength (high/moderate/low/speculative), key assumptions, predicted observable pattern, and likely failure modes.
   - *Gate:* Every hypothesis must have a discriminant observable and a defined failure condition.

3. **Design minimal viable validation with nested controls.**
   - Select one target mechanism, one population, and one primary observable.
   - Define controls:
     - **Baseline:** standard model or reference implementation.
     - **Negative control:** mechanism disabled, randomized, or replaced by a null process.
     - **Positive control:** regime where the mechanism should produce a clear signal.
     - **Numerical/observational control:** isolates resolution, smoothing, projection, or selection effects.
   - *Gate:* The experimental design must vary one major mechanism or assumption at a time.

4. **Harmonize observables and build mock-observable pipelines.**
   - Match simulated and observed quantities through comparable proxies, selection cuts, and measurement definitions.
   - Process model outputs through the same masking, smoothing, binning, and selection pipeline as observations when possible.
   - *Gate:* Confirm that differences cannot be explained by incompatible definitions or preprocessing.

5. **Execute multi-scale analysis.**
   - Compute population-level distributions, scaling relations, and residuals.
   - Inspect local diagnostics (profiles, phase-space structure, scale dependence) to locate where mechanisms act.
   - Evaluate distribution shape: tails, variance, multimodality, and anisotropy, not only means.
   - *Gate:* Check that trends are stable across resolution, sampling, or viewing-angle variations before interpreting.

6. **Discriminate mechanisms via ablation and model-family comparison.**
   - Remove or alter one process at a time; check whether the target observable changes in the predicted direction.
   - Compare results across model families (e.g., gravity-only, hydrodynamic, semi-analytic, analytic) to identify assumption-dependent conclusions.
   - Separate physical approximation errors from numerical artifacts using discriminant metrics.
   - *Gate:* Mechanism claims are allowed only if the effect is absent from negative controls and robust across model families.

7. **Audit robustness and convergence.**
   - Test stability under alternative definitions, binning, weighting, and region selection.
   - Verify numerical convergence or sampling completeness where applicable.
   - Quantify cosmic variance, sample variance, and model-parameter degeneracy.
   - *Gate:* If the result depends on a single calibration, orientation, or narrow parameter choice, downgrade the claim to a sensitivity analysis.

8. **Bound claims and audit uncertainty.**
   - Label conclusions as measurement-supported, inference-supported, assumption-sensitive, or speculative.
   - State boundary conditions: redshift, mass, environment, tracer class, and resolution regime where the claim is valid.
   - Explicitly separate validated results from extrapolated inferences.
   - *Gate:* Do not present one realization, seed, or paper as consensus.

9. **Iterate or redesign.**
   - If residuals cluster by redshift, mass, or environment, reformulate the hypothesis around that conditional regime.
   - If a negative control matches the target, redesign the observable or population.
   - If model families disagree, identify the driving assumption and propose a discriminating observable.
   - If the hypothesis cannot produce a falsifiable prediction, stop and redefine the research question.
   - *Stop condition:* Terminate when the mechanism is either supported by multiple independent observables and controls, or falsified by the minimal viable test.

## Output Format

Return a structured research plan containing:
1. **Research question** — one sentence, its scientific interest, and whether it is population-level, mechanism-level, or observational-design-focused.
2. **Candidate hypotheses** — table with mechanism, evidence strength, key assumptions, predicted observables, and failure modes.
3. **Experimental design** — minimal viable test, independent/dependent variables, controls, evaluation metrics, and stop conditions.
4. **Analysis plan** — observable construction, population comparison, mechanism ablation, model-family comparison, distribution-shape diagnostics, and mock-observable validation.
5. **Iteration plan** — how each likely result strengthens, weakens, or redirects the hypothesis.
6. **Validity and boundary statement** — confounders, reproducibility requirements, statistical limitations, and outer limits of generalization.

## Validation Gates

Before advancing past each major stage, confirm:
- **Population framing:** the claim targets a population or distribution, not a single exceptional object.
- **Mechanism isolation:** each test changes one major process or assumption at a time.
- **Control adequacy:** baseline, negative, positive, and numerical/observational controls are all defined.
- **Observable matching:** simulated and observed quantities use comparable definitions and selection cuts.
- **Convergence:** key statistics are stable under resolution, sampling, or methodological changes.
- **Artifact separation:** the signal exceeds compression, smoothing, projection, or interpolation baselines.

## Claim Boundaries

- **Allowed:** population-level mechanism hypotheses supported by multiple independent observables and robust across model families; sensitivity analyses; falsification statements.
- **Forbidden:** object-level causality inferred from population trends; exact numerical matching as proof; single-model or single-paper conclusions presented as consensus; claims that extend beyond the tested redshift, mass, tracer, or resolution regime without explicit labeling as speculative.

## Failure Modes

- The hypothesis improves one observable while worsening independent observables.
- The negative control is indistinguishable from the target mechanism.
- The result depends on one arbitrary calibration, smoothing scale, or viewing angle.
- Selection effects, resolution limits, or survey geometry can explain the apparent trend.
- The proposed mechanism and a systematic effect produce indistinguishable signatures.
- The model fits the data only after post-hoc tuning that was not pre-registered.

## Validity Checks

Before presenting conclusions, verify:
- **Confounding control:** mass, redshift, environment, morphology, and completeness are not confounded with the mechanism.
- **Model degeneracy:** alternative mechanisms and calibration choices are tested before causal claims.
- **Statistical validity:** uncertainty, sample variance, cosmic variance, and robustness across bins or cuts are reported.
- **Reproducibility:** model family, initial conditions, analysis definitions, random seeds, and data-selection logic are documented.
- **Boundary conditions:** regimes dominated by resolution limits, unknown physics, or inconsistent observables are explicitly excluded.
- **Evidence labeling:** paper-supported patterns, observationally motivated updates, and speculative hypotheses are clearly distinguished.

## Provenance

- Synthesized from cluster 24.1 (symmetry-guided mechanism discovery and validation).
- Source skills: cosmological-galaxy-formation-research (10.54254_2753-8818_11_20230381), icm-mhd-dynamo-research-workflow (10.1093_mnras_stx2830), cosmological-simulation-workflow (10.1051_0004-6361_201526439), galaxy-formation-gradient-exploration (10.1093_mnras_stab1803), weak-lensing-approximation-validation (10.1093_mnras_stae2019), galaxy-cluster-caustic-research-design (10.1088_0004-637x_767_1_15), early-galaxy-obscured-formation-exploration (10.1038_s41586-024-08094-5), topology-constrained-dark-sector-exploration (10.1007_jhep12_2015_120).
