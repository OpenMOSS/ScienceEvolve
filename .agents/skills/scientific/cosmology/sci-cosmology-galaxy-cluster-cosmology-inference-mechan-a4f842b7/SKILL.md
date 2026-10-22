---
name: sci-cosmology-galaxy-cluster-cosmology-inference-mechan-a4f842b7
description: A reusable end-to-end workflow for designing studies that discover and validate physical mechanisms in galaxy, cluster, and cosmological systems using symmetry-guided observables, matched controls, and iterative mechanism discrimination.
scienceevolve-title: "Galaxy, cosmology, and simulations · galaxy cluster cosmology inference mechanism discovery workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

# Purpose

Guide agents to design new research questions and experiments that infer physical mechanisms from ambiguous or higher-order observables in galaxy, cluster, and large-scale-structure contexts. The workflow reframes hard-to-estimate signals into symmetry-protected or environment-dependent responses, validates them against simulations and controls, and bounds claims by evidence strength.

# When to use

Use this skill when:

- A proposed observable depends on higher-order correlations, small-scale responses to large-scale environments, or ambiguous morphological features.
- The goal is to distinguish a target physical mechanism from intrinsic dynamics, environmental confounders, or observational artifacts.
- The user needs a study design spanning hypothesis generation, control architecture, analysis planning, and iterative validation.
- Simulations, mock catalogs, or multi-wavelength data are available for testing.

Do not use for operational observing recipes, hazardous procedures, or as a substitute for full parameter-inference pipelines when those are explicitly required.

# Inputs required

Before starting, collect or request:

- Target system class and scientific objective.
- Available data types: simulations, mocks, survey catalogs, or reconstructions.
- Candidate observable and environment or symmetry variable.
- Competing mechanisms: intrinsic, environmental, and observational alternatives.
- Known limitations: selection function, mask, resolution, redshift uncertainty, or finite-volume effects.
- Validation resources: independent realizations, split samples, null tests, or alternative models.

# Core Workflow

1. **Reframe the signal via symmetry or local response.**
   Replace a hard higher-order observable with an environment-modulated lower-order statistic, or identify a symmetry-guided diagnostic that isolates the target coupling.
   *Gate:* Proceed only if the reframing has a theoretical justification (symmetry, perturbation theory, or conservation argument) and the environment variable can be defined independently of the local statistic.

2. **Map mechanisms and generate competing hypotheses.**
   List the target mechanism, intrinsic confounders, environmental perturbers, and observational biases. For each hypothesis specify the expected signature, evidence strength, key assumptions, and failure modes.
   *Gate:* Continue only if hypotheses are mutually distinguishable with available data and produce falsifiable predictions.

3. **Design the control architecture.**
   Define a uniform sample boundary. Establish a baseline estimator, positive controls (known signal present), negative controls (signal absent or randomized), null tests (coupling removed), and systematics controls (alternative definitions, masks, or processing choices). Pre-register selection cuts and primary metrics.
   *Gate:* Stop if controls are mismatched in data quality, redshift, mass, or environment; redesign matching before analysis.

4. **Prepare data with preprocessing parity.**
   Construct fields, apply masks, and define coordinates consistently across all arms. Ensure the environment variable and local statistic are derived from independent data partitions or orthogonal measurements. Document all filtering choices.
   *Gate:* Halt if preprocessing cannot be matched across simulation, mock, and observational arms; record asymmetries as assumptions.

5. **Extract features and estimate responses.**
   Measure local statistics, morphology diagnostics, or coupling proxies in subvolumes or patches. Estimate the response (covariance, ratio, or residual) between the local statistic and the environment. Normalize appropriately and record uncertainties via resampling or ensemble variance.
   *Gate:* If the feature distribution is sensitive to centering, projection, binning, or smoothing philosophy, freeze the definition and treat variations as robustness tests, not free parameters.

6. **Compare measurement to prediction.**
   Compute the expected response from theory, higher-order statistics, or an equivalent local-background model. Compare shape, sign, amplitude, and scale dependence. Separate broad-band agreement from feature-level agreement. Quantify residuals.
   *Gate:* If the prediction requires extrapolation beyond its calibrated regime, downgrade the comparison to qualitative and flag the regime as unvalidated.

7. **Audit robustness and systematics.**
   Repeat the comparison under alternative index definitions, center choices, projection views, background models, and selection cuts. Test observational realism by passing synthetic populations through the measurement pipeline.
   *Gate:* If the conclusion reverses under reasonable alternatives, stop and reclassify the result as definition-dependent or artifact-prone.

8. **Discriminate mechanisms.**
   Require multi-diagnostic convergence before favoring the target mechanism over confounders. Use morphology, phase evolution, spatial distribution, or spectral behavior together. If target and alternative mechanisms remain degenerate, reframe the study as degeneracy-mapping rather than direct constraint.
   *Gate:* Do not advance to strong claims unless the target mechanism explains multiple independent diagnostics and no single confounder reproduces all of them.

9. **Bound claims and audit uncertainty.**
   Classify conclusions as absolute prediction, relative response, or qualitative guidance. State whether they apply to matter, biased tracers, projected fields, or simulations only. Quantify statistical, systematic, and model-validity uncertainties separately.
   *Gate:* If uncertainties are comparable to or larger than the claimed effect, bound the claim to consistency-check or diagnostic status.

10. **Iterate or stop.**
    - *Strengthen:* If independent diagnostics converge and controls hold, narrow the hypothesis and propose tighter constraints.
    - *Revise:* If the signal is absent in positive controls or present in negative controls, fix measurement setup or selection bias before interpreting science.
    - *Reposition:* If the model predicts relative responses better than absolute values, reframe it as a correction or response layer.
    - *Stop:* If assumptions dominate, effective sample size is too small, extrapolation is required, or the signal is degenerate with a confounder. Document the boundary and residual risks.

# Output Format

Return results in this structure:

1. **Research question** — Target field/tracer, scientific objective, and why the reframed observable is useful.
2. **Mechanism map and hypothesis set** — Target mechanism, intrinsic alternatives, environmental alternatives, observational artifacts; each with evidence strength, assumptions, and failure modes.
3. **Experimental design** — Uniform sample, variables, control arms, minimal viable validation, evaluation metrics, and stop conditions.
4. **Analysis plan** — Preprocessing, feature/response extraction, prediction route, comparison criteria, and uncertainty propagation.
5. **Iteration plan** — Rules for strengthening, weakening, or rejecting hypotheses after initial results.
6. **Validity and boundary statement** — Confounders, reproducibility requirements, domain limits, and claim classification.

# Validation Gates

- **Scale and regime validity:** The environment scale or symmetry limit is appropriate, or finite-window corrections are included.
- **Independence:** The environment variable and local statistic are not derived from the same data partition in a way that creates spurious correlation.
- **Control validity:** Positive controls recover the expected signal; negative controls show no spurious signal under matched conditions.
- **Statistical validity:** Uncertainties use independent realizations or appropriate resampling; covariance is not underestimated by reusing modes.
- **Model validity:** Theoretical predictions, emulators, or fitting formulae are not extrapolated beyond calibrated regimes.
- **Observational transfer:** Simulation-to-observation comparisons account for selection, resolution, noise, and deprojection where applicable.

# Claim Boundaries

- Distinguish **paper-supported patterns**, **cross-method plausible inferences**, and **agent-generated extensions**.
- Separate claims about **absolute predictions** from **relative responses** or **qualitative guidance**.
- Limit conclusions to the validated domain (e.g., specific redshift, mass, scale, or tracer regime).
- Never describe a single-study or single-dataset inference as field-wide consensus.

# Failure Modes

- **Common-mode artifact:** Both driver and target respond to the same external forcing or global trend.
- **Index or feature contamination:** The diagnostic captures an unintended global signal, centering bias, or projection effect.
- **Degeneracy:** Multiple physical mechanisms produce indistinguishable observable distributions.
- **Insufficient samples:** Smoothing, subvolume splitting, or rare events reduce effective independence below the level needed for inference.
- **Model breakdown:** The approximate model fails in transition regimes, nonlinear scales, or near boundaries.
- **Extrapolation risk:** Conclusions are applied outside the benchmarked or calibrated domain.

# Validity Checks

Before finalizing, confirm:

- Preprocessing parity across all comparison arms.
- Feature definitions were frozen before inspecting outcome distributions.
- Residuals are inspected for regime-dependent structure, not only aggregate accuracy.
- Alternative definitions, normalizations, and center choices were tested.
- The analysis distinguishes grid-level exploratory signals from confirmatory area-average or population-level signals.
- Reproducibility documentation covers data versions, masks, random seeds, and classification thresholds.

# Provenance

Synthesized from cluster `0.0` (symmetry-guided mechanism discovery and validation). Derived from source skills: `cosmology-local-response-research-design` (10.1088_1475-7516_2014_05_048), `agn-feedback-exploration-workflow` (10.3390_galaxies12020017), `paleoclimate-teleconnection-exploration` (10.5194_cp-15-1825-2019), `tidal-stream-gap-inference` (10.1088_0004-637x_788_2_181), `cluster-mass-bias-research-design` (10.1051_0004-6361_201936742), `astronomy-bias-aware-population-inference` (10.1088_0004-637x_743_2_156), `gamma-ray-unidentified-source-dm-exploration` (10.3390_galaxies8010005), and `large-scale-structure-model-audit` (10.1093_mnras_stab2834).
