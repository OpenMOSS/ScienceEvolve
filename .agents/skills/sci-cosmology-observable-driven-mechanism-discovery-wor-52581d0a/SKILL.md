---
name: sci-cosmology-observable-driven-mechanism-discovery-wor-52581d0a
description: Reusable end-to-end workflow for discovering and validating astrophysical mechanisms by mapping latent processes to observables, designing controlled comparisons, and iterating with explicit boundary conditions.
scienceevolve-title: "Galaxy, cosmology, and simulations · observable driven mechanism discovery workflow 9"
scienceevolve-area: galaxy-cosmology-and-simulations
---

# Purpose

This skill helps an agent turn an astrophysical discrepancy, population-level tension, or model–observation mismatch into a structured research program. It provides a reusable method for isolating candidate physical mechanisms through multi-observable signatures, controlled comparisons, residual diagnostics, and iterative validation, without treating any single study or simulation as field-wide consensus.

# When to use

Use this skill when the task involves:

- Evaluating a theoretical or numerical model against population-level observations in galaxy formation, cosmology, halo dynamics, or diffuse-gas environments.
- Discriminating among competing mechanisms that could produce similar observable signatures.
- Designing simulation, mock-observation, or observational analysis plans where hidden variables must be inferred from present-day proxies.
- Converting discrepancies between simulation and observation into structured, falsifiable hypotheses.
- Testing whether an apparent environmental or historical trend reflects latent physical processes, selection effects, or analysis artifacts.

Do not use this skill as a substitute for operating specific simulation codes, observatory facilities, or data pipelines, or for asserting that one paper’s results constitute universal consensus.

# Inputs required

Before using the workflow, collect or request:

- **Target system and population**: object class, mass/luminosity regime, redshift range, environment, and role (e.g., central, satellite, field).
- **Observable gap or tension**: the specific behavior, residual, or mismatch to be explained.
- **Candidate mechanisms**: physical processes or model components to test (e.g., feedback, transport, environmental processing, assembly bias).
- **Available data and models**: simulation outputs, catalogues, merger trees, survey data products, or analytic predictions.
- **Observable suite**: directly measurable quantities and derived proxies relevant to the mechanisms.
- **Known systematics**: selection functions, resolution limits, post-processing approximations, detection thresholds, and survey footprints.
- **Desired output**: research question, hypothesis set, experimental design, analysis plan, or iteration strategy.

# Core Workflow

1. **Frame the observable gap**
   - State the population-level behavior, discrepancy, or tension to be explained.
   - Define the target population, physical regime, and success criteria.
   - **Gate:** Is the gap specific enough to support a falsifiable mechanism claim? If not, refine the scope or stop.

2. **Map mechanisms to observables**
   - For each candidate mechanism, specify the expected observable signature, the regime where the effect should be strongest, and a regime where it should be weak or absent.
   - Identify a secondary observable that should remain stable if the mechanism is isolated.
   - Generate competing hypotheses (null, candidate mechanism, confounder-driven, hybrid) and annotate each with evidence strength, key assumptions, and failure modes.
   - **Gate:** Does at least one hypothesis imply a discriminative observable? If not, redesign proxies or stop.

3. **Design minimal viable validation**
   - Select one primary observable tied directly to the mechanism, one secondary stability observable, one negative-control regime, and one positive-control regime.
   - Define the control matrix: baseline, strong control (mechanism removed or disabled), approximation control (alternative post-processing or calibration), and observation-system control (alternative selection or data product).
   - Pre-define metrics, falsification criteria, and stop conditions before analysis.
   - **Gate:** Can the design separate the mechanism from selection effects, environmental confounders, and numerical artifacts? If not, add controls or stop.

4. **Prepare comparable data and synthetic observables**
   - Harmonize selection, binning, redshift, and measurement conventions across models and observations.
   - Record every post-processing approximation (e.g., synthetic photometry, dust treatment, aperture choice, calibration step).
   - For simulation-based tests, apply resolution or convergence checks and exclude numerically unstable objects.
   - **Gate:** Are the data comparable and numerically stable? If not, fix preprocessing or stop.

5. **Execute primary and control comparisons**
   - Compare the main model or target population against observations or baseline predictions across diagnostic observables and regimes.
   - Run control comparisons to isolate the candidate mechanism.
   - Quantify agreement using distribution-level metrics, residuals, scatter, and regime-dependent performance, accounting for observational and sampling uncertainties.
   - **Gate:** Does the primary signal exceed combined uncertainties and survive negative controls? If not, classify as null or ambiguous and proceed to iteration.

6. **Audit robustness and residual structure**
   - Test sensitivity to binning, definitions, selection cuts, aperture, calibration, and alternative data products.
   - Classify residuals by regime and observable; check whether the mechanism improves multiple observables without compensating errors elsewhere.
   - Evaluate discriminating power against alternative explanations.
   - **Gate:** Is the signal robust under defensible diagnostic changes and mechanism-specific? If not, flag degeneracy or confounding and proceed to iteration.

7. **Classify outcome and iterate**
   - Classify the result as **Supported**, **Ambiguous**, **Refuted**, or **Degenerate**.
   - **Supported:** Escalate to a broader observable suite, an independent data set, or a more challenging regime.
   - **Ambiguous:** Identify the dominant confounder and design a targeted robustness check or stronger control.
   - **Refuted:** Revise the mechanism, change the diagnostic observable, or narrow the claimed regime.
   - **Degenerate:** Add a discriminating statistic, stronger control, or alternative-model comparison.
   - Update boundary conditions and evidence strength after each iteration.
   - **Stop conditions:** Terminate if the mechanism fails minimal validation; if improvement depends on a single unverified assumption; if fitting one statistic worsens multiple independent statistics; or if additional iterations no longer increase falsifiability.

# Output Format

When using this skill, produce:

1. **Research question** — One sentence defining the model component, population, and observable target.
2. **Gap and mechanism map** — Table of candidate mechanisms, expected observable signatures, strongest-effect regimes, and competing explanations.
3. **Hypothesis set** — For each hypothesis: evidence strength, key assumptions, expected signal, likely failure mode, and minimal falsification test.
4. **Experimental design** — Minimal viable validation, control matrix (baseline, strong, approximation, observation-system), primary and secondary metrics, and stop conditions.
5. **Analysis plan** — Primary comparison, control comparisons, robustness checks, uncertainty estimates, and residual classification strategy.
6. **Iteration plan** — Decision rules for supported, ambiguous, refuted, and degenerate outcomes.
7. **Validity and boundary statement** — Confounders, reproducibility requirements, statistical checks, and explicit limits on extrapolation.

# Validation Gates

- **Gap specificity:** The research question must be precise enough to yield a falsifiable mechanism claim.
- **Discriminative observable:** At least one hypothesis must imply an observable that can distinguish it from alternatives.
- **Control adequacy:** The design must include baseline, strong, and negative controls capable of isolating the mechanism from confounders.
- **Comparability:** Data preparation must harmonize selection, binning, and synthetic-observable conventions across sources.
- **Numerical stability:** Simulation-based inference must pass resolution or convergence checks before physical interpretation.
- **Signal significance:** The primary signal must exceed combined observational, sampling, and systematic uncertainties.
- **Robustness and specificity:** The signal must survive defensible changes in diagnostics and must not be explainable by a simpler alternative.

# Claim Boundaries

- Distinguish **paper-verified methodological patterns** from **agent-inferred hypotheses** and **field-level claims** requiring independent support.
- State the mass, luminosity, redshift, environment, and data-quality regimes where the claim is valid.
- Do not extrapolate beyond tested regimes or present a single model’s agreement as proof that every physical component is correct.
- Label evidence as observed, simulation-supported, theory-supported, or speculative.

# Failure Modes

- The discriminating signal is smaller than scatter across bins, realizations, or observational uncertainties.
- The negative control reproduces the same signal as the candidate mechanism.
- The result reverses under a defensible change in diagnostic definition, binning, or aperture.
- The apparent effect depends on a single unverified post-processing assumption or numerical artifact.
- Improving agreement in one observable degrades agreement in multiple previously validated observables.
- The sample size is too small for the claimed trend, or selection/aperture bias dominates the signal.
- Confounding by mass, environment, history, or selection effects cannot be separated from the proposed mechanism.

# Validity Checks

Before finalizing any research design or result, verify:

- **Mechanism specificity:** The primary observable is more sensitive to the tested mechanism than to unrelated assumptions.
- **Control strength:** The strong control isolates the mechanism; the negative control shows no major spurious effect.
- **Observation-system robustness:** Conclusions survive alternative data products, survey selections, or detection limits where available.
- **Post-processing robustness:** Conclusions do not depend on one unverified approximation in synthetic-observable generation.
- **Statistical validity:** Uncertainty estimates include observational errors, model sampling noise, cosmic variance, and selection effects as appropriate.
- **Reproducibility:** Object selection, synthetic-observation steps, binning, calibration, and random seeds are recorded.
- **Boundary conditions:** Validity regimes are stated explicitly; extrapolation limits are respected.
- **Consensus discipline:** Single-study or single-realization results are not treated as field-wide consensus.

# Provenance

Synthesized from cluster **28.0** (observable-driven mechanism discovery and validation). Derived from source skills:

- `galaxy-evolution-model-validation-workflow`
- `halo-orbit-observable-research-design`
- `galaxy-cluster-mhd-transport-workflow`
- `galaxy-merger-kinematics-research`
- `high-redshift-halo-gas-workflow`
- `galaxy-group-feedback-exploration`
- `astronomy-synthetic-observable-research`
- `environmental-history-galaxy-exploration`
