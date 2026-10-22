---
name: sci-cosmology-observable-driven-mechanism-discovery-wor-708fc155
description: A reusable end-to-end workflow for discovering and validating physical mechanisms from faint or complex astrophysical observables through controlled hypothesis generation, multi-layered analysis, and iterative discrimination.
scienceevolve-title: "Galaxy, cosmology, and simulations · observable driven mechanism discovery workflow 11"
scienceevolve-area: galaxy-cosmology-and-simulations
---

# Purpose

This skill guides agents in designing reusable research plans that move from an observed or simulated population-level pattern to a discriminated physical mechanism. It abstracts a common pattern across astrophysical domains: define an observable gap, generate competing mechanism and nuisance hypotheses, construct layered controls, extract faint or residual signals through stacking, forward modeling, or summary statistics, and validate claims via robustness audits and multi-probe cross-checks. The workflow emphasizes bounding claims to tested regimes and separating detection from physical interpretation.

# When to use

Use this skill when the user asks to:

- Design a study to explain a weak, diffuse, or residual signal in galaxy, halo, cluster, lensing, or large-scale structure data.
- Generate hypotheses for how an observed scaling relation, count feature, clustering trend, or time-domain pattern arises from physical mechanisms.
- Plan an analysis that discriminates between competing mechanisms using simulations, forward models, or multi-probe observations.
- Validate whether a detected pattern is robust to nuisance modeling, selection effects, covariance assumptions, and alternative physical explanations.
- Iterate on a research design after null-test failures, systematic dominance, or mechanism degeneracies.

Do not use this skill as a general-purpose astrophysics assistant, as a recipe for reproducing a specific paper's numerical setup, or for instrument calibration, laboratory protocols, or hazardous operational procedures.

# Inputs required

- **Target observable or pattern**: the population-level feature to explain (e.g., scaling relation, residual map, statistic distribution, count break).
- **Theoretical motivation**: why the pattern is scientifically interesting and what physical components or mechanisms could produce it.
- **Data assets**: surveys, simulations, mock catalogs, or synthetic datasets with known selection functions, masks, and completeness.
- **Baseline or nuisance models**: dominant non-target components that must be subtracted, modeled, or marginalized.
- **Candidate mechanisms**: at least two competing explanations (physical or systematic) with predicted distinct signatures.
- **Candidate discriminants**: observables, scales, or sample splits that separate mechanisms.
- **Validation assets**: null samples, independent probes, withheld data, injection tests, or alternative map products.
- **Evaluation criteria**: metrics for detection significance, robustness, mechanism discrimination, and claim boundedness.

# Core Workflow

Follow this ordered route. At each gate, stop and redesign if the condition is not met.

1. **Gap Definition & Mechanism Scoping**
   - Operationally define the target pattern and the theoretical gap it addresses.
   - Frame the gap as an ambiguity: multiple mechanisms could produce a similar first-order signature.
   - **Gate**: Is the pattern measurable and distinguishable from known nuisances at the outset? If no, refine the operational definition before proceeding.

2. **Hypothesis Generation & Discriminant Design**
   - Generate at least two competing hypotheses: a target mechanism and at least one nuisance or alternative mechanism.
   - For each hypothesis, specify expected signatures in at least two independent diagnostics (e.g., scale dependence, morphology, environment, redshift evolution).
   - Assign evidence strength (high / medium / low / speculative) and state key assumptions and failure modes.
   - **Gate**: Do the hypotheses predict distinct, testable signatures? If no, redesign the discriminants.

3. **Sample & Control Construction**
   - Define a parent sample with explicit selection criteria applied before candidate search.
   - Construct a matched null or negative control sample with similar selection but no expected target signal.
   - Define positive controls (known signal injections or well-studied regimes) and synthetic controls when possible.
   - **Gate**: Are target and null samples matched in all relevant properties except the proposed mechanism? If no, redesign selection.

4. **Observable Modeling & Forward Propagation**
   - Choose an analysis strategy appropriate to the signal (stacking, forward modeling, residual decomposition, summary-statistic comparison, or clustering measurement).
   - Apply identical detection, masking, binning, and selection rules to all hypotheses and controls.
   - Propagate uncertainties, scatter, and selection effects through the pipeline.
   - **Gate**: Does the pipeline recover positive controls at the expected fidelity? If no, debug the pipeline before scientific interpretation.

5. **Primary Extraction & Nuisance Suppression**
   - Extract the target signal, subtract or model dominant nuisance components, and preserve the residual structure.
   - Use regions least likely to contain the target signal to constrain nuisance models.
   - Estimate covariance with a method appropriate to the sample dependence structure.
   - **Gate**: Does the residual exceed the null expectation with stable significance? If no, stop and treat as non-detection or redesign.

6. **Robustness & Covariance Audit**
   - Vary preprocessing, nuisance models, binning, normalization scales, and covariance estimators.
   - Test stability across subsamples, alternative survey products, and assumption boundaries.
   - **Gate**: Does the signal survive conservative null models and plausible assumption variations? If no, downgrade evidence strength.

7. **Mechanism Discrimination**
   - Compare competing hypotheses using decomposed diagnostics (e.g., by redshift, mass, environment, or structure class).
   - Use multi-probe constraints or independent observables to break degeneracies.
   - Exclude mechanisms that fail to predict the observed decomposed behavior.
   - **Gate**: Does one mechanism survive exclusion tests while others fail? If mechanisms remain degenerate, add a discriminant or narrow the claim.

8. **Claim Bounding & Documentation**
   - Bound all claims to the tested sample, scale range, redshift regime, and model assumptions.
   - Separate detection, contamination assessment, and physical interpretation into distinct claim layers.
   - Label each conclusion by evidence strength and mark extrapolations as speculative.
   - **Gate**: Are claims explicitly bounded and free of universal generalizations? If no, revise.

9. **Iteration or Redesign**
   - If the signal is weak or null-dominated, revisit alignment, sample definition, or nuisance modeling before changing the hypothesis.
   - If the signal appears in null samples, treat it as a systematic artifact and redesign controls.
   - If systematics dominate, shift the question toward robustness or calibration.
   - If mechanisms remain degenerate, add complementary observables or redefine the discriminant.
   - **Stop conditions**:
     - The residual is comparable to null or randomized controls.
     - Significance disappears under conservative covariance or assumption variations.
     - The result depends on an unverified assumption that cannot be bounded by controls.
     - The observable is statistically measurable but physically non-discriminating.
     - Extrapolation beyond the tested regime is required to support the claim.

# Output Format

When using this skill, produce:

1. **Research question** — One focused question linking an observable pattern to a physical ambiguity.
2. **Gap statement** — What existing explanations leave unresolved and why the proposed approach helps.
3. **Hypothesis matrix** — Competing hypotheses with evidence strength, key assumptions, predicted diagnostics, and failure modes.
4. **Experimental design** — Sample definitions, controls, variables, minimal viable validation, and stop conditions.
5. **Analysis plan** — Pipeline steps for extraction, nuisance suppression, decomposition, and uncertainty estimation.
6. **Validation plan** — Robustness checks, null tests, covariance strategy, and multi-probe cross-validation.
7. **Iteration plan** — How results will update hypotheses and what redesign paths follow from each failure mode.
8. **Claim boundary statement** — Explicit regime of validity, evidence labels, and separation of detection from interpretation.

# Validation Gates

- **Operational clarity**: The target pattern is defined before inspection, not selected post hoc from noise.
- **Discriminant independence**: Each hypothesis predicts distinct signatures in at least two diagnostics.
- **Control matching**: Target and null samples share selection functions, redshift distributions, and noise properties.
- **Pipeline fidelity**: Positive controls and synthetic injections are recovered correctly.
- **Null resilience**: The residual exceeds conservative null expectations.
- **Assumption sensitivity**: The conclusion survives plausible variations in nuisance models, preprocessing, and covariance.
- **Mechanism exclusion**: At least one alternative hypothesis is falsified or weakened by the data.
- **Claim boundedness**: Conclusions are labeled by evidence strength and restricted to tested regimes.

# Claim Boundaries

- Treat any residual after nuisance subtraction as provisional until it passes null tests and cross-probe checks.
- Separate three claim layers: (a) detection of a structured residual or trend, (b) assessment of contamination and systematics, and (c) physical interpretation.
- Label claims as directly observed, model-dependent, or speculative extrapolation.
- Do not generalize a single-survey or single-simulation result to a universal law.
- Do not present forward-model forecasts or simulation-only results as confirmed observational measurements.

# Failure Modes

- **Nuisance mimicry**: The apparent signal is produced by foregrounds, calibration artifacts, selection geometry, or correlated noise.
- **Null dominance**: The residual is consistent with conservative null simulations across the full search space.
- **Covariance misspecification**: Uncertainty estimates ignore sample overlap, field correlation, or small-number variance.
- **Selection bias**: The sample definition preferentially includes objects with the desired pattern.
- **Mechanism degeneracy**: Multiple physical explanations remain consistent with the observable after all controls.
- **Extrapolation risk**: The claim is extended beyond the tested redshift, mass, scale, or survey regime without validation.
- **Overfitting**: The pattern depends on one binning choice, one realization, or one noise setting.

# Validity Checks

- **Confounding**: Check for normalization-induced correlations, selection effects, calibration systematics, blending, masking, and projection effects.
- **Reproducibility**: Document sample cuts, masks, random catalogs, coordinate transformations, model versions, random seeds, and analysis code.
- **Statistical validity**: Propagate uncertainties, use covariance estimates appropriate to the dependence structure, account for multiple testing across periods/objects/bins, and avoid interpreting low-number bins deterministically.
- **Boundary conditions**: State the valid sample class, observable range, scale range, redshift regime, and survey depth.
- **External validity**: Do not generalize beyond tested cosmologies, survey configurations, or field types without additional validation.
- **Model validity**: Distinguish empirical trend fitting from mechanistic interpretation; treat simulation comparisons as consistency checks unless simulations are designed to exclude alternatives.

# Provenance

This skill was synthesized from cluster 31.0 (observable-driven mechanism discovery and validation) in the scientific skills codex. It merges patterns drawn from the following source skills: ultralight-dark-matter-merger-history-exploration; cosmic-web-weak-signal-research; weak-lensing-peak-statistics-exploration; quasar-time-domain-candidate-discovery; scale-normalized-residual-density-research; dust-continuum-count-modeling-workflow; dwarf-halo-lensing-research-design; galaxy-clustering-hod-exploration.
