---
name: sci-cosmology-galaxy-halo-mechanism-discovery-workflow-65753e42
description: Design end-to-end research plans for observable-driven mechanism discovery and validation in galaxy formation, halo structure, and cosmology.
scienceevolve-title: "Galaxy, cosmology, and simulations · galaxy halo mechanism discovery workflow 3"
scienceevolve-area: galaxy-cosmology-and-simulations
---

# Purpose

Design reusable end-to-end research workflows that turn empirical regularities in galaxy, halo, and cosmological data into testable mechanism hypotheses, controlled validation studies, and bounded scientific claims. The workflow separates physical explanations from measurement artifacts, selection effects, and model-dependent inferences through systematic comparison, mock validation, and residual-driven iteration.

# When to use

Use this skill when a user asks to:

- Generate research questions from scaling relations, conditional distributions, or structural trends in galaxy or halo populations.
- Design simulation or observational studies to test why a relation is stable, regime-dependent, or selection-limited.
- Validate inference pipelines using mocks, cross-observable checks, and controlled degradation.
- Discriminate among competing mechanisms using population-level statistics.
- Bound claims before extrapolation to untested regimes.

Do not use this skill for general literature summarization, instrument operations, individual object histories, or operational simulation execution.

# Inputs required

Before producing a research plan, collect or state assumptions for:

- **Target population and regime:** galaxy or halo class, mass range, redshift, environment, or model family.
- **Empirical observable or relation:** dependent and independent variables, expected functional form, and known scatter.
- **Candidate mechanisms:** e.g., feedback, accretion, environment, formation history, or measurement effects.
- **Data sources:** surveys, simulations, catalogs, or synthetic mocks, plus their selection functions.
- **Measurement conventions:** boundary definitions, coordinate systems, normalization, uncertainty treatment, and quality filters.
- **Known confounders:** resolution limits, completeness, calibration dependencies, selection cuts, and environmental variance.

If any input is missing, state assumptions explicitly and mark conclusions as conditional.

# Core Workflow

1. **Empirical Anchor & Scope Lock**
   - Define the observable, population, and regime using reproducible selection rules.
   - Document the baseline relation: functional form, scatter, and known empirical limits.
   - *Gate:* Stop if the empirical pattern is not reproducible across independent subsets or catalogs.

2. **Hypothesis Generation**
   - Generate at least three competing hypotheses: mechanism, robustness/universality, boundary-condition, and measurement-artifact.
   - For each, state evidence strength, key assumptions, predicted signature, and failure modes.
   - *Gate:* Stop if no hypothesis is falsifiable with available data or mocks.

3. **Measurement Pipeline Harmonization**
   - Lock boundary definitions, coordinate systems, normalization, and quality filters across all study arms.
   - Propagate uncertainties consistently; separate primary measurements from derived quantities.
   - *Gate:* Stop if definitions cannot be aligned; document incompatibilities and redesign.

4. **Controlled Comparison Design**
   - Define baseline, mechanism-ablation, strong-control, positive-control, and negative-control arms.
   - Match non-target variables across arms; isolate one variable at a time.
   - *Gate:* Redesign if confounding variables cannot be held fixed or randomized.

5. **Primary Analysis & Relation Quantification**
   - Fit the relation or compute conditional distributions per arm.
   - Quantify slope, offset, scatter, residuals, and subpopulation structure.
   - *Decision:* If the relation is unstable across matched arms, trigger iteration at step 8; else proceed.

6. **Systematic Robustness Audit**
   - Vary measurement definitions, selection cuts, calibration, and boundaries within defensible limits.
   - Test sensitivity to grouping, classification, and data-quality degradation.
   - *Gate:* If the result disappears under alternative defensible definitions, classify as measurement artifact and return to step 3 or stop.

7. **Mock or Simulation Validation**
   - Apply the identical pipeline to mocks with known ground truth.
   - Run positive controls (should recover truth), negative controls (should remove signal), and degraded-anchor tests.
   - *Gate:* If positive control fails or negative control retains signal, repair the pipeline before interpreting science.

8. **Mechanism Discrimination & Residual Diagnosis**
   - Compare ablation variants and cross-observable agreement.
   - Inspect residuals by mass, environment, epoch, or dynamical state to identify compensating effects.
   - *Decision:* If one mechanism is isolated, proceed to bounding. If degeneracy persists, generate a sharper diagnostic and iterate from step 2.

9. **Claim Bounding**
   - State the domain where the conclusion is valid (mass, redshift, environment, data quality).
   - Define extrapolation boundaries and model-dependence caveats.
   - *Gate:* Stop if the validity domain cannot be specified.

10. **Iteration or Archive**
    - Archive residual structure as input for the next hypothesis cycle.
    - Update or reject hypotheses based on audit outcomes.
    - *Stop condition:* Claim is bounded, validated, and reproducible; or the working hypothesis is falsified and no viable alternative remains.

# Output Format

When using this skill, produce:

1. **Research Question:** concise, tied to an observable and population.
2. **Gap & Motivation:** what is known, uncertain, and why it matters.
3. **Ranked Hypotheses:** with evidence strength, assumptions, predicted signatures, and failure modes.
4. **Experimental Design:** arms, variables, controls, metrics, and stop conditions.
5. **Analysis Plan:** fitting strategy, structural diagnostics, residual checks, and mock validation.
6. **Iteration Plan:** how results update, narrow, or reject each hypothesis.
7. **Validity & Boundary Statement:** confounders, reproducibility requirements, and extrapolation limits.

# Validation Gates

- **Reproducibility Gate:** Baseline relation must replicate in independent data subsets before mechanism testing.
- **Falsifiability Gate:** Every hypothesis must have a defined disconfirming outcome.
- **Harmonization Gate:** Measurement pipelines must be identical across arms; misalignment triggers redesign.
- **Robustness Gate:** Conclusions must survive alternative defensible definitions and selection cuts.
- **Mock-Recovery Gate:** Pipeline must recover known truth in positive controls and remove signal in negative controls.
- **Discrimination Gate:** Mechanism claim is allowed only if ablation or cross-observable tests break the signal when the mechanism is removed.
- **Bounding Gate:** Claims must include explicit validity domain and extrapolation limits before acceptance.

# Claim Boundaries

- Valid only within tested regimes of mass, redshift, environment, and data quality.
- Mechanism claims are model-conditioned inferences, not deterministic histories of individual objects.
- Scaling-relation claims apply to populations, not universal laws.
- Do not extrapolate beyond the dynamic range, resolution, or selection function of the source data.
- Clearly distinguish simulation-supported, observation-supported, and inferred claims.

# Failure Modes

- **Artifact Dominance:** Signal is driven by boundary choice, definition, or calibration rather than physics.
- **Compensating Errors:** Multiple mechanisms cancel in the global relation but differ locally.
- **Selection Bias:** Exclusions or completeness variations mimic or mask physical trends.
- **Mechanism Degeneracy:** Competing models produce indistinguishable population statistics.
- **Covariance Overwhelm:** Sample variance, cosmic variance, or correlated bins hide predicted differences.
- **Proxy Failure:** A structural proxy does not trace the intended physical variable in the tested regime.
- **Circular Inference:** The conditioning variable is derived from the same observable used to test the relation.

# Validity Checks

- **Confounding:** Are regime labels correlated with selection, calibration, or measurement method?
- **Measurement Consistency:** Are observables defined consistently across all arms and subsets?
- **Sample Adequacy:** Does each regime have sufficient dynamic range and uncertainty coverage?
- **Statistical Independence:** Are repeated measurements treated as correlated where appropriate?
- **Mock Realism:** Does the mock reproduce selection, masking, completeness, and error structure?
- **Reproducibility:** Are definitions, cuts, code, and catalogs documented for independent reanalysis?
- **Non-Consensus Framing:** Is a single model or paper presented as field-wide consensus?
- **Boundary Transparency:** Are exclusions, edge regimes, and sparse bins reported rather than hidden?

# Provenance

- Synthesized from cluster 23 / subcluster 23.1: observable-driven mechanism discovery and validation.
- Source skill references: 10.1093_mnras_stag762; 10.1111_j.1365-2966.2008.13195.x; 10.3847_1538-4357_ad5294; 10.1093_mnras_staf198; 10.1111_j.1365-2966.2009.15187.x; 10.1111_j.1365-2966.2009.14701.x; 10.1111_j.1365-2966.2012.21037.x; 10.1111_j.1365-2966.2012.21007.x.
