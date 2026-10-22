---
name: sci-cosmology-cosmological-mechanism-discovery-validati-a40051ef
description: Reusable end-to-end workflow for discovering and validating mechanisms in cosmological and astrophysical inference through controlled comparison, systematic uncertainty decomposition, and iterative claim bounding.
scienceevolve-title: "Galaxy, cosmology, and simulations · cosmological mechanism discovery validation workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

## Purpose

Guide an agent to design reusable research plans that turn an inference gap or anomaly into a controlled mechanism-discovery and validation program. The workflow treats systematic uncertainties, numerical choices, and selection effects as structured hypotheses to be isolated, tested, and bounded before any scientific claim is made.

## When to use

Use this skill when the user asks to:
- Propose a new research question involving simulation, observation, or precision measurement in cosmology or astrophysics.
- Validate an inference pipeline, mock catalogue, or numerical method.
- Discriminate between competing physical or numerical mechanisms.
- Evaluate how upstream algorithmic choices, correlated uncertainties, or selection effects alter downstream conclusions.

Applicable to simulation-based studies, precision-observable analyses, survey-mock validation, adaptive numerical methods, and reduced-model transport problems.

## Inputs required

Ask for or infer:
- **Target quantity or observable:** the physical summary or mechanism to be explained or validated.
- **Candidate mechanisms or pipeline stages:** the competing explanations, algorithms, or systematic effects under consideration.
- **Baseline method:** the current standard or reference against which alternatives are compared.
- **Available resources:** data products, simulation suites, mock ensembles, computational budget, and independent calibration channels.
- **Known confounders:** selection functions, masks, resolution limits, finite-volume effects, tracer biases, or environmental dependencies.
- **Evaluation metrics:** precision, accuracy, coverage, robustness, conservation residuals, or posterior geometry.
- **Constraints:** reproducibility requirements, data-access limits, and acceptable approximations.

If any input is missing, state the assumption and mark the resulting plan as provisional.

## Core Workflow

Follow this ordered route. Do not skip a gate before its entry condition is satisfied.

### 1. Frame the inference gap
Define the target relation, observable, or mechanism. Identify why existing estimates may be biased, incomplete, or selection-limited. Locate the domain gap between what the intended application needs and what current methods reliably estimate.

**Decision gate:** Is the bottleneck well-defined and isolable?
- **No:** Stop. Refine the research question until the gap is specific.
- **Yes:** Proceed to hypothesis generation.

### 2. Generate mechanism-grounded hypotheses
Produce at least three competing hypotheses. For each, specify:
- **Claim:** concise causal statement.
- **Mechanism:** the physical, numerical, or systematic pathway.
- **Modifier:** physical state, environment, scale, or regime that may alter the outcome.
- **Alternative explanation:** a measurement, selection, numerical, or projection effect that could mimic the claim.
- **Predicted signature:** the residual, subgroup, or cross-check pattern that would support or weaken the claim.
- **Evidence strength:** paper-supported, cross-study-supported, plausible inference, or speculative.
- **Key assumptions and failure modes.**

Prioritize falsifiable hypotheses that can be tested with available or realistically obtainable data.

**Decision gate:** Are the hypotheses distinguishable through controlled comparison?
- **No:** Redesign hypotheses or add diagnostic variables.
- **Yes:** Proceed to experimental design.

### 3. Design controlled validation
Fix the upstream physical input (simulation, survey realization, or source data) so differences attribute to the tested factor. Vary one conceptual stage or mechanism factor at a time. Use cross-combinations to separate upstream from downstream effects.

Include:
- **Controls:** negative, positive, stress, mechanism, and family-level controls.
- **Regime stratification:** main objects, substructures, dense environments, low-signal regions, scale ranges, or redshift bins.
- **Covariance/uncertainty plan:** how correlated errors, realization noise, or finite-sample variance will be estimated.
- **Stop conditions:** predefined criteria for redesign.

**Decision gate:** Does the design isolate the intended variable from known confounders?
- **No:** Redesign the comparison matrix or selection rules.
- **Yes:** Proceed to baseline execution.

### 4. Run consistency and conservation diagnostics
Before interpreting scientific outputs, verify:
- Invariant preservation (conservation laws, accounting consistency, balance residuals).
- Selection-function coverage and representation.
- Covariance validity (symmetry, positive semidefiniteness, conditioning).
- Baseline recovery on simple or truth-known cases.

**Decision gate:** Do diagnostics pass?
- **No:** Stop. Repair implementation, selection model, or consistency correction before proceeding.
- **Yes:** Proceed to primary analysis.

### 5. Execute comparative analysis
Separate the **mean signal** from the **uncertainty structure**. Compare results under matched conditions using multiple representations (raw, normalized, scale-sliced, posterior geometry). Inspect residuals for correlations with physical state, environment, numerical settings, or quality metrics.

Quantify:
- Systematic bias versus intrinsic scatter.
- Sensitivity to each correction or assumption.
- Agreement between independent analysis paths.
- Stability across method families.

**Decision gate:** Are observed differences larger than systematic-test shifts and stochastic variation?
- **No:** Treat as inconclusive; downgrade evidence strength.
- **Yes:** Proceed to robustness gating.

### 6. Apply robustness and convergence gates
Test stability under:
- Resolution, volume, realization-count, or estimator sweeps.
- Alternative binning, masking, normalization, or summary statistics.
- Subset selections and cross-validation.
- Mock-data recovery and coverage checks.

**Decision gate:** Do results remain stable and converged?
- **No:** If parameter shifts exceed statistical uncertainty or convergence is absent, stop and diagnose the dominant error source.
- **Yes:** Proceed to mechanism discrimination.

### 7. Discriminate mechanisms and bound claims
Rank hypotheses by diagnostic agreement. Exclude mechanisms that fail null tests, robustness checks, or mock-validation. For the surviving mechanism:
- State applicability boundaries (scale, redshift, regime, tracer, resolution, geometry).
- Distinguish paper-supported patterns from agent-inferred conclusions.
- Report uncertainty, intrinsic scatter, and sensitivity to assumptions.

**Decision gate:** Is the surviving mechanism distinguishable from all alternatives?
- **No:** Weaken the claim to consistency or non-exclusion; propose follow-up tests.
- **Yes:** Formulate a bounded claim and proceed to iteration planning.

### 8. Iterate or terminate
Convert residual patterns, unexpected posterior shifts, or convergence trends into new hypotheses. Decide whether the next cycle should:
- Improve data quality or ensemble size.
- Refine the model, closure, or covariance treatment.
- Add an independent calibration channel.
- Abandon the hypothesis.

**Stop conditions:**
- Claimed signal is comparable to mock-to-mock or systematic-test variance.
- Result depends primarily on boundary-affected, masked, or artifact regimes.
- Independent analysis paths disagree without an explainable mechanism.
- Extrapolation beyond the calibrated domain is required.
- Conservation residuals or covariance instabilities dominate the signal.

## Output Format

Each use of this skill should return:

1. **Research question and inference gap.**
2. **Ranked hypothesis table** with evidence strength, key assumptions, predicted signatures, and failure modes.
3. **Controlled validation design** including fixed inputs, varied factors, control matrix, regime stratification, and stop conditions.
4. **Consistency and robustness diagnostics** with gate outcomes.
5. **Mechanism discrimination summary** and explicit claim boundary statement.
6. **Iteration plan** with next-step decision rules and termination criteria.

## Validation Gates

- **Consistency Gate:** Invariants, conservation laws, balance residuals, and covariance mathematical validity are satisfied before physical interpretation.
- **Isolation Gate:** Each comparison varies one conceptual stage or mechanism factor; cross-combinations separate upstream from downstream effects.
- **Convergence Gate:** Mean statistics and uncertainty structures remain stable under resolution, volume, realization, or estimator changes.
- **Coverage Gate:** Mock-data recovery, credible-interval reliability, and selection-function representation are verified.
- **Robustness Gate:** Conclusions survive alternative binning, masking, normalization, subset selection, and method-family comparisons.
- **Mechanism-Exclusion Gate:** Null tests and alternative explanations are actively rejected or bounded, not ignored.

## Claim Boundaries

- Distinguish **paper-supported workflow patterns**, **cross-study evidence**, and **agent-inferred hypotheses** in every conclusion.
- Do not treat a single calibration, simulation run, or pipeline comparison as field-wide consensus.
- Limit claims to the tested domain (scales, redshifts, tracers, resolutions, geometries, selection functions).
- **Consistency with a model** is not proof of that model; report what was tested and what remains uncertain.
- Separate measurement uncertainty from theory-model uncertainty when comparing to external predictions.

## Failure Modes

- **Confounding:** The intended factor is entangled with selection effects, numerical settings, or pipeline stages.
- **Circular calibration:** Both measurement channels share underlying model assumptions.
- **Covariance neglect:** Correlated uncertainties or off-diagonal structure are ignored, inflating significance.
- **Artifact dominance:** The signal is driven by boundaries, masks, numerical instabilities, or edge cases irrelevant to the science target.
- **Overfitting:** A complex model or correction is tuned to residuals without independent validation.
- **Extrapolation:** Results are applied beyond the calibrated observable, regime, or domain.
- **Family bias:** Apparent differences cluster by implementation detail rather than by mechanistic design.

## Validity Checks

Before finalizing any proposal or claim, verify:

- **Selection representativeness:** Is the sample or mock ensemble representative for the intended regime?
- **Channel independence:** Do validation and calibration channels share assumptions?
- **Reproducibility:** Are versions, seeds, configurations, selection rules, and post-processing steps documented?
- **Statistical validity:** Are errors in both variables, intrinsic scatter, covariance conditioning, and uncertainty intervals reported?
- **Boundary documentation:** Are survey edges, masked regions, shallow depth, sparse tracers, and unsupported reconstruction regimes identified?
- **External validity:** Is generalization to new surveys, redshifts, tracers, or models supported by repeated mock validation?
- **Model-consistency discipline:** Does agreement with a tested model imply only non-inconsistency under the tested assumptions?

## Provenance

- Synthesized from cluster **35.0** (symmetry-guided mechanism discovery and validation).
- Derived from source skills: `cluster-scaling-relation-exploration`, `computational-cosmology-pipeline-sensitivity`, `precision-observable-systematics-research`, `cosmological-mock-covariance-design`, `covariance-aware-galaxy-model-inference`, `selection-aware-cosmology-mock-calibration`, `adaptive-resolution-consistency-cosmology`, `conservative-rt-research-planning`.
