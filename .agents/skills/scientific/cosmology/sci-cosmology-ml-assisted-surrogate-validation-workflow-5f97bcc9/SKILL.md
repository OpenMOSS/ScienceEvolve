---
name: sci-cosmology-ml-assisted-surrogate-validation-workflow-5f97bcc9
description: Trigger this skill when designing reusable research plans for validating, comparing, and iterating machine-learning surrogates or emulators against expensive reference models across scientific domains.
scienceevolve-title: "Galaxy, cosmology, and simulations · ml assisted surrogate validation workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

# Purpose

Convert a computationally expensive modeling problem into a structured, reusable research workflow. This skill guides the design of validation plans, active sampling strategies, and model-comparison experiments for machine-learning surrogates, emulators, and reduced-order models, ensuring claims are bounded by evidence and downstream utility.

# When to use

Use this skill when:

- A scientific or engineering question requires fast predictions but relies on expensive high-fidelity simulations, numerical experiments, or complex mechanistic models.
- You need to validate, compare, or improve a surrogate, emulator, or approximate simulator against a stronger reference.
- You must decide whether an efficient model is accurate enough for downstream inference, covariance estimation, parameter estimation, or design optimization.
- You want to design active sampling or sequential experiments to reduce surrogate uncertainty efficiently.
- You need to identify failure modes, extrapolation limits, or missing physics in a computational modeling pipeline.

Do not use this skill as a general-purpose scientific tutor, literature-review generator, or operational recipe for running production simulations or hardware.

# Inputs required

Before producing a plan, collect or infer:

- Target research question and downstream scientific or engineering decision.
- Reference model or high-fidelity evaluation method (simulation, analytic limit, or trusted benchmark).
- Candidate surrogate or approximate model family and its intended domain.
- Parameter space, field domain, or input manifold to be covered.
- Primary observable, summary statistic, or fidelity metric aligned with downstream use.
- Available training data, anchor evaluations, or legacy simulation coverage.
- Known nuisance effects, systematic errors, or missing physics that could dominate the target.
- Baseline methods for comparison and acceptable error thresholds.
- Compute, data, reproducibility, and interpretability constraints.

If any input is missing, state the assumption and mark resulting hypotheses as inferred or speculative.

# Core Workflow

Follow this ordered route. Treat each decision gate as a hard stop until the criterion is satisfied.

1. **Define the downstream decision and prediction gap.**
   - Identify the inference, survey, or design decision that benefits from faster predictions.
   - Locate where direct high-fidelity evaluation is prohibitively expensive or where existing surrogates are too narrow.
   - *Decision gate:* If no clear downstream decision exists, stop and reformulate the question.

2. **Establish a falsifiable baseline.**
   - Select the simplest reference or accepted model that captures the dominant physics or mechanism.
   - Define the primary observable and the accuracy threshold required by the downstream task.
   - *Decision gate:* If the baseline cannot be validated independently, redesign the reference before proceeding.

3. **Design representation and transfer layers.**
   - Choose a compact, physically or mechanistically interpretable intermediate representation rather than fitting raw high-dimensional outputs directly.
   - Map how this representation transfers information from cheap conditioning inputs to expensive targets.
   - *Decision gate:* If the representation discards information needed for the downstream statistic, revisit the decomposition.

4. **Construct training and validation splits.**
   - Use independent realizations, held-out parameter regions, held-out populations, or temporal splits.
   - Ensure splits respect correlations (e.g., spatial, temporal, or initial-condition dependencies) and avoid leakage through shared preprocessing.
   - *Decision gate:* If splits leak information, redesign before training.

5. **Train surrogates with uncertainty quantification.**
   - Fit at least one uncertainty-aware surrogate and one transparent baseline comparator.
   - Compare alternatives rather than relying on a single architecture.
   - Record hyperparameter sensitivity and training instability.
   - *Iteration trigger:* If training is unstable or uncertainty estimates are uncalibrated, stop and revisit representation, regularization, or data scaling.

6. **Validate by layers.**
   - Check numerical convergence, representation adequacy, interpolation accuracy, and downstream impact separately.
   - Evaluate local residuals, global summary statistics, and boundary behavior distinctly.
   - *Decision gate:* If errors are localized at boundaries or sharp features, flag for targeted sampling or domain decomposition before claiming success.

7. **Audit residuals and uncertainty calibration.**
   - Inspect whether predicted uncertainties match empirical errors (coverage, calibration).
   - Distinguish noise-like residuals from structured discrepancies indicating missing physics or model-form mismatch.
   - *Iteration trigger:*
     - **High error + high uncertainty:** add targeted evaluations in high-uncertainty regions, refit, and recheck.
     - **High error + low uncertainty:** treat as calibration failure; revisit kernel, basis, regularization, or independence assumptions.
     - **Noise-like residuals + stable held-out error:** stop adding complexity.

8. **Iterate via active selection or redesign.**
   - Use uncertainty maps, residual structure, or downstream impact to select the next expensive evaluation target.
   - When extending the baseline, add one mechanism or feature at a time and re-validate.
   - *Stop conditions:*
     - Validation error and uncertainty calibration meet downstream requirements.
     - New evaluations no longer reduce worst-case or population-weighted error.
     - Failure is caused by model-form mismatch rather than insufficient sampling; redirect to a new representation.
     - A proposed extension improves one metric while degrading another without mechanistic explanation.

9. **Bound claims and finalize.**
   - Distinguish validated interpolation from extrapolation, model-supported inference from direct validation, and in-distribution from out-of-distribution performance.
   - Document the validated domain, limitations, and next validation steps.

# Output Format

When using this skill, produce:

1. **Research question** — concise statement of the proposed question and downstream use.
2. **Gap and rationale** — why current methods are insufficient for this question.
3. **Hypotheses** — 3 to 5 testable claims, each with evidence strength, key assumptions, expected failure mode, minimal test, controls, and stop condition.
4. **Experimental design** — target observable, domain, anchor evaluations, controls, validation splits, baselines, and failure criteria.
5. **Analysis plan** — convergence checks, representation diagnostics, surrogate comparison, residual and uncertainty audits, and downstream impact assessment.
6. **Iteration plan** — how results update hypotheses, where new evaluations should be added, and decision rules for continuing or stopping.
7. **Validity and boundary statement** — confounders, reproducibility checks, extrapolation limits, and claims that are validated versus inferred.

# Validation Gates

Stage-specific criteria that must pass before advancing:

- **Gap clarity gate:** The downstream decision and prediction gap are explicitly stated.
- **Baseline independence gate:** The reference model or benchmark is validated independently of the surrogate.
- **Leakage gate:** Training and validation sets are independent with respect to correlations, preprocessing, and initial conditions.
- **Representation gate:** The intermediate representation preserves information required by the primary downstream statistic.
- **Calibration gate:** Uncertainty estimates are checked against held-out errors; overconfident regions are flagged.
- **Boundary gate:** Claims are restricted to the validated domain; boundary and sparse regions are reported separately.
- **Mechanism gate:** Each added feature or mechanism is justified by a structured residual, not by post-hoc optimization.

# Claim Boundaries

- **Validated interpolation:** Claims within the convex hull of training data and verified by held-out points.
- **Model-supported inference:** Claims that rely on smoothness, basis completeness, or kernel assumptions; label as supported, not proven.
- **Extrapolation:** Any claim beyond the validated parameter, scale, or physical regime is labeled as speculative and requires explicit revalidation.
- **Cross-context transfer:** Performance on new physics, new observables, or new simulation families must be treated as out-of-distribution until tested.
- **Consensus boundary:** Evidence from a single framework, paper, or simulation suite is labeled as framework-specific, not field-wide consensus.

# Failure Modes

Common ways this workflow fails or misleads:

- **Overfitting to narrow benchmarks:** The surrogate excels on the training metric but fails on held-out conditions or downstream tasks.
- **Uncertainty miscalibration:** The model is overconfident in regions of high actual error, especially near boundaries.
- **Leakage and confounding:** Training-validation leakage, correlated nuisance variables, or shared preprocessing inflate apparent accuracy.
- **Compensating parameters:** Correlated inputs or mechanisms preserve outputs while changing internal structure, hiding non-identifiability.
- **Boundary artifacts:** Errors spike near domain edges or underrepresented regions but are masked by aggregate metrics.
- **Model-form mismatch:** The representation or architecture cannot capture the target physics regardless of additional data.
- **Metric mismatch:** The optimization metric does not align with the downstream scientific decision, leading to false confidence.
- **Extrapolation overclaim:** Interpolation performance is incorrectly assumed to generalize to untested regimes.

# Validity Checks

Before finalizing a plan or accepting a conclusion, verify:

- **Confounding:** Could numerical settings, sampling noise, selection effects, or nuisance physics explain the result?
- **Reproducibility:** Are parameter definitions, preprocessing, sampling scheme, validation splits, and software versions recorded?
- **Statistical validity:** Are training, validation, and independent test sets separated appropriately?
- **Calibration:** Do uncertainty estimates match held-out errors and empirical coverage?
- **Boundary behavior:** Are claims limited to validated domains, with boundary regions reported separately?
- **Transfer validity:** Is the approximation layer appropriate for the new observable and parameter space?
- **Scientific relevance:** Would the proposed experiment change an inference, decision, or model comparison?
- **Identifiability:** Can available data distinguish the parameters or mechanisms being estimated?
- **Consensus boundary:** Is any claim from one framework or paper labeled as framework-specific rather than field-wide consensus?

# Provenance

This skill was synthesized from cluster 33, subcluster 33.1 (machine-learning-assisted model validation and comparison). Source skills referenced in the merge include: cosmology-simulation-emulator-workflow, cosmology-mock-catalogue-exploration, gravitational-wave-simulation-surrogate-planning, galaxy-halo-ml-modeling-workflow, cosmology-hi-surrogate-workflow, sequential-history-matching-for-mechanistic-models, pemfc-parameter-identification-workflow, and multitracer-galaxy-halo-workflow. Paper-specific conclusions, numerical settings, and operational protocols were excluded.
