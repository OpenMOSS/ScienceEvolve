---
name: sci-cosmology-galaxy-clustering-halo-lensing-mechanism-4b63402e
description: A reusable end-to-end workflow for discovering and validating galaxy-halo mechanisms through controlled hypothesis generation, multi-tracer experiments, and uncertainty-aware iteration.
scienceevolve-title: "Galaxy, cosmology, and simulations · galaxy clustering halo lensing mechanism discovery workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

## Purpose

Help an agent design and execute reusable end-to-end research workflows for discovering and validating physical mechanisms that connect galaxy populations to their dark matter halos and large-scale environments. The skill abstracts a controlled mechanism-discovery pipeline: define the latent host mechanism, generate falsifiable hypotheses, design controlled observational or simulation experiments, discriminate mechanisms through multi-tracer validation, and iterate based on uncertainty-aware audits.

## When to use

Use this skill when the user asks to:

- Propose or test hypotheses about galaxy-halo connections, clustering bias, lensing signals, environmental dependence, or secondary assembly bias.
- Design controlled intercomparisons across simulations, subgrid models, or observational surveys.
- Validate simulation predictions against observational constraints using mock observations and multi-metric tests.
- Investigate orientation or alignment correlations between galaxies, halos, groups, or cosmic-web structure.
- Audit an existing study for confounding, selection effects, resolution sensitivity, or boundary-condition risks.

Do not use this skill for pure observational survey operations without a mechanism question, for treating a single halo or galaxy as representative of the full population, or for operational telescope or instrument commands.

## Inputs required

- **Target mechanism and scientific question**: the latent host property or physical process under investigation (e.g., feedback regulation, assembly bias, lensing systematics, alignment coupling).
- **Data sources**: observational catalogues, simulation suites, mock catalogues, or reference ensembles with known latent histories.
- **Primary and secondary variables**: galaxy observables, halo proxies, environmental tracers, lensing observables, or fossil-tracer distributions.
- **Baseline models**: mass-only relations, randomized assignments, fiducial simulations, or no-delay baselines.
- **Selection functions and known systematics**: completeness, redshift errors, mass proxies, grouping uncertainties, extraction limits, and shape-measurement systematics.
- **Claim scope**: intended regime (mass, redshift, environment, galaxy type) and whether the goal is feasibility, mechanism discrimination, or robust forecast.

## Core Workflow

1. **Frame the mechanism gap**
   - Define the latent host property or physical process and the observable galaxy signature it should produce.
   - Identify the simplest baseline model (e.g., mass-only mapping) and the residual gap it leaves.
   - **Decision gate**: If the gap cannot be expressed as a falsifiable deviation from the baseline, stop and reformulate the question.

2. **Generate candidate hypotheses**
   - Produce at least three competing hypotheses: a primary-control (null) hypothesis, a transmission (proposed mechanism) hypothesis, and at least one alternative-mechanism hypothesis.
   - For each, state the causal claim, expected observable signature, evidence strength, key assumptions, and failure modes.
   - **Decision gate**: If the hypotheses are not mutually distinguishable with available data or simulations, stop and refine variables or diagnostics before proceeding.

3. **Design controlled experiment**
   - Fix shared cosmological or observational scaffolding (initial conditions, selection function, analysis pipeline) across all variants.
   - Define independent variables (model axis, secondary property, extraction rule), dependent variables (clustering, lensing, abundance, morphology, orientation), and nuisance factors.
   - Specify controls: baseline, negative, positive, selection, and model/code controls.
   - Define stop conditions before running (e.g., if confounding exceeds threshold, if sample overlap is insufficient).
   - **Decision gate**: If the design cannot isolate the intended mechanism from at least one major confounder, redesign or downgrade the study to exploratory.

4. **Harmonize and mock-observe**
   - Align data spaces: match redshift, flux limits, mass limits, aperture definitions, and selection functions across observations and simulations.
   - Apply comparable extraction, grouping, and measurement pipelines to all variants.
   - Propagate scatter and uncertainty from tracers, proxies, and calibration into downstream predictions.
   - **Decision gate**: If model-observation overlap is too narrow after matching, stop and request broader data or narrow the claim scope.

5. **Execute multi-tracer analysis**
   - Compute primary diagnostics (abundance, clustering amplitude, lensing signal, alignment angles).
   - Compute secondary or history diagnostics (star-formation history, angular momentum, fossil-tracer distributions, gas content).
   - Compare variants using paired differences or stratified samples; inspect full distributions, not only central tendencies.
   - Run ablations: remove one mechanism or dataset at a time to test sensitivity.
   - **Decision gate**: If the signal disappears under randomized, shuffled, or selection-matched controls, classify the result as systematic or null and return to Step 2.

6. **Discriminate mechanisms**
   - Classify outcomes: mechanism supported, mechanism weakened, mechanism entangled, mechanism insufficient, or compensating failure.
   - Check whether independent observables (e.g., clustering plus lensing plus group kinematics) converge or conflict.
   - Quantify mechanism overlap: does the secondary variable reliably trace the proposed hidden state?
   - **Decision gate**: If positive and negative controls both show comparable signals, treat the result as suspicious and prioritize diagnostics over claims.

7. **Uncertainty audit and claim bounding**
   - Quantify resolution sensitivity, code-to-code scatter, sample variance, catalogue stochasticity, and calibration uncertainty.
   - State boundary conditions: mass, redshift, environment, model family, and tracer completeness.
   - Label each claim as validated, inferred, or speculative.
   - **Decision gate**: If uncertainty intervals are too broad to distinguish competing histories, or if conclusions reverse under plausible calibration changes, stop and downgrade the evidence strength.

8. **Iterate or redesign**
   - If the mechanism is supported: propose an orthogonal test or broader regime to validate generalizability.
   - If weakened or entangled: split confounded axes, refine the proxy, or add an independent tracer.
   - If null: update toward primary-variable confounding or an alternative mechanism; improve matching or residualization.
   - If ambiguous: specify the missing diagnostic rather than overfitting the model.
   - **Stop condition**: Halt when the hypothesis survives multiple independent controls, or when further iteration exceeds available compute or data bounds without additional discriminative power.

## Output Format

When using this skill, return:

1. **Research question** — Target mechanism, baseline gap, and scientific relevance.
2. **Hypothesis table** — Ranked candidates with evidence strength, key assumptions, expected signatures, and failure modes.
3. **Experimental design** — Variables, controls, harmonization strategy, and pre-defined stop conditions.
4. **Analysis plan** — Harmonized diagnostics, paired comparisons, ablation tests, and distributional checks.
5. **Mechanism discrimination summary** — Classification of each hypothesis (supported, weakened, entangled, insufficient, compensating failure) with cross-observable consistency.
6. **Uncertainty audit** — Resolution, scatter, boundary conditions, and claim labels (validated / inferred / speculative).
7. **Iteration roadmap** — Next test, redesign path, or termination rationale.

## Validation Gates

- **Baseline equivalence**: The baseline model reproduces the primary abundance or scale relation before secondary mechanisms are added.
- **Control integrity**: Negative controls remain null; positive controls recover expected signals.
- **Selection-function alignment**: Flux limits, completeness, and quality cuts are comparable across all variants.
- **Cross-observable consistency**: The mechanism improves held-out observables, not only the statistic used to tune it.
- **Stability**: Conclusions are robust to at least two resolutions, solvers, extraction rules, or shape estimators.
- **Mechanism overlap**: The secondary variable selects the proposed hidden state better than random or environmental proxies.

## Claim Boundaries

- Limit claims to the tested halo mass, redshift, environment, galaxy type, and model family.
- Distinguish simulation predictions from observational inferences.
- Separate validated constraints (calibrated descriptors plus controls) from inferred (workflow-dependent) and speculative (plausible but untested) statements.
- Do not generalize a single-catalogue, single-survey, or single-simulation result to the full galaxy population without independent support.
- Avoid presenting model agreement as proof of a physical mechanism, or model tension as definitive falsification without sensitivity analysis.

## Failure Modes

- **Confounded mechanism**: The intended axis is bundled with feedback, cooling, star formation, numerical method, or environment changes.
- **Selection-driven artifact**: The apparent signal arises from survey geometry, completeness, grouping errors, or extraction boundaries.
- **Compensating error**: One diagnostic improves while another worsens, masking a fundamental mismatch.
- **Proxy misassignment**: A secondary variable traces selection or environment rather than the proposed hidden state.
- **Resolution or code artifact**: The signal is numerically fragile or implementation-specific.
- **Overfitting to a single metric**: The mechanism improves the tuned statistic but fails held-out observables.
- **Covariate shift**: Training or calibration and target samples occupy different regions of parameter space.
- **Stochastic or small-sample fluctuation**: Halo-to-halo variance or rare-object bias drives the result.

## Validity Checks

- **Confounding**: Are primary variables balanced across secondary groups? Are central and satellite populations handled separately when mechanisms differ?
- **Reproducibility**: Are split rules, random seeds, catalogue versions, and analysis pipelines documented before outcomes are inspected?
- **Statistical validity**: Are covariance, multiple comparisons, angular correlations, uncertainty intervals, and resampling stability treated appropriately?
- **Boundary validity**: Is the target within the reference ensemble domain? Are extrapolation boundaries explicitly stated?
- **Calibration leakage**: Was the proposed observable already used to tune the model being validated?
- **Tracer indirectness**: Do conversion factors or proxies dominate the signal?
- **Model degeneracy**: Can multiple physical mechanisms produce the same observable trend?
- **External validity**: Do independent data support or contradict the proposed mechanism?

## Provenance

- Derived from cluster 13 / subcluster 13.1 (galaxy-clustering-halo-lensing-mechanism-discovery).
- Synthesized from source skills: galaxy-formation-feedback-intercomparison (10.1111_j.1365-2966.2012.20993.x), galaxy-halo-connection-research-design (10.1146_annurev-astro-081817-051756), emission-line-galaxy-proxy-validation (10.1093_mnras_staa2292), galaxy-formation-secondary-bias-workflow (10.1093_mnras_staa1624), lisa-mbh-binary-population-forecasting (10.1093_mnras_stz3102), galaxy-halo-alignment-workflow (10.1093_mnras_staa2356), fossil-tracer-age-chemistry-reconstruction (10.1093_mnras_sty1609), galaxy-simulation-observational-validation (10.1093_mnras_stz1323).
- Paper-specific conclusions, numerical parameters, and operational protocols have been excluded; only reusable workflow structure is retained.
