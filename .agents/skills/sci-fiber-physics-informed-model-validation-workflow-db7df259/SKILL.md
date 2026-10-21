---
name: sci-fiber-physics-informed-model-validation-workflow-db7df259
description: Reusable end-to-end workflow for designing, comparing, and iteratively validating physics-informed or surrogate models against baselines using symmetry-resolved diagnostics and controlled experimentation.
scienceevolve-title: "Fiber composites and battery materials · physics informed model validation workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

## Purpose

Help an agent turn a scientific modeling problem into a structured, reusable research workflow for validating and comparing predictive models. The skill emphasizes mechanism-aware hypothesis generation, controlled baseline comparisons, symmetry- or regime-resolved error decomposition, and iterative refinement. It is designed to transfer across domains—materials, composites, energy systems, and beyond—without reproducing any single paper’s specific parameters or conclusions.

## When to use

Use this skill when the user asks to:

- Propose new research questions involving surrogate, physics-informed, or machine-learning models for physical systems.
- Compare a candidate model against a baseline to test whether an omitted mechanism, symmetry treatment, or regime decomposition improves prediction or insight.
- Design validation studies with explicit controls, ablations, and robustness checks.
- Evaluate model transferability, uncertainty calibration, or generalization across domains.
- Plan iterative discovery workflows where validation gaps update hypotheses.

Do not use this skill to produce operational experimental protocols, fabrication recipes, hazardous procedures, compliance determinations, or deployment-ready engineering decisions.

## Inputs required

Before generating a plan, collect or request:

- **Target system and property**: the physical system, field, or performance metric under study.
- **Baseline model or assumption**: the current best model, design rule, or reference approximation.
- **Candidate mechanism or structural feature**: the omitted physics, symmetry, transition region, or regime hypothesized to matter.
- **Available data and descriptors**: measurements, computed features, provenance, and known quality issues.
- **Domain constraints**: safety, regulatory, computational, temporal, or resource limits.
- **Intended use**: screening, mechanism discovery, design exploration, uncertainty quantification, or simulation acceleration.

## Core Workflow

1. **Frame the modeling gap**
   - Define the target property or field, the trusted baseline, and the candidate mechanism the baseline omits.
   - Clarify whether the goal is interpolation, extrapolation, or mechanism discrimination.
   - *Decision gate*: Stop and reformulate if the baseline is undefined, the target is unmeasurable, or the mechanism lacks physical plausibility.

2. **Generate falsifiable hypotheses**
   - Produce a primary hypothesis and at least one alternative linking the candidate model feature to improved prediction or mechanistic insight.
   - Label each with evidence strength (strong / moderate / weak / speculative), key assumptions, expected observable signature, and likely failure modes.
   - *Decision gate*: Reject hypotheses that cannot be tested with the available data or simulation budget; require falsifiability.

3. **Design controlled comparison**
   - Define independent variables (model family, descriptor set, symmetry or regime decomposition, perturbation type).
   - Define dependent variables (prediction error, physical consistency residual, uncertainty metric, ranking stability).
   - Establish controls: baseline model, negative control (mechanism suppressed or weak), positive control (known strong effect), and ablation controls.
   - Pre-register metrics and stopping thresholds before training or evaluation.
   - *Stop condition*: Halt if descriptors are unmeasurable, controls are infeasible, or the study requires unsafe or unsupported operational procedures.

4. **Construct models with equivalent footing**
   - Implement the simplest strong baseline first.
   - Add the candidate model (e.g., physics-informed, symmetry-resolved, regime-decomposed, or transfer-enhanced).
   - Enforce identical data splits, preprocessing, random seeds, and tuning protocols across models.
   - *Decision gate*: Do not proceed if sanity checks fail (data leakage, non-convergence, mismatched units, or test-set statistics used in training).

5. **Execute symmetry-resolved or regime-aware evaluation**
   - Evaluate on held-out data and, where possible, an independent reference or benchmark.
   - Decompose errors by symmetry channel, regime, spatial region, or perturbation type before aggregating.
   - Compute physical consistency checks (conservation, equilibrium, monotonicity, boundary conditions).
   - *Decision gate*: If the candidate does not exceed the baseline by the predeclared criterion, flag for iteration or stop.

6. **Stress-test robustness and boundaries**
   - Test domain shifts, edge cases, worst-case configurations, and perturbation magnitudes.
   - Inspect uncertainty calibration and check for error cancellation across channels or regimes.
   - *Decision gate*: If rankings reverse across splits or uncertainty is miscalibrated, treat results as unstable and bound claims accordingly.

7. **Iterate or redirect**
   - **If supported**: Expand validation to new regimes or broader candidate spaces; refine the mechanism representation.
   - **If partially supported**: Narrow the claim boundary to the successful regime; design targeted follow-up to isolate the mechanism.
   - **If refuted**: Revert to the baseline or reformulate the omitted mechanism.
   - **If inconclusive**: Improve data quality, descriptor resolution, or convergence before drawing conclusions.
   - *Stop conditions*: Budget exhausted; performance plateau; calibration failure; repeated feasibility violations; safety or ethics boundary reached.

8. **Bound and document claims**
   - Classify each conclusion as directly demonstrated, consistent with prior literature, or speculative.
   - State the domain of validity and explicit extrapolation limits.

## Output Format

When using this skill, produce:

1. **Research question** — concise statement with scope boundaries.
2. **Gap analysis** — retained baseline, omitted mechanism, and consequence of omission.
3. **Hypotheses table** — hypothesis, evidence strength, key assumptions, expected signature, failure mode, and minimal validation test.
4. **Validation plan** — variables, controls, metrics, and stopping conditions.
5. **Model comparison summary** — baseline vs. candidate performance, symmetry/regime decomposition, and physical consistency.
6. **Robustness assessment** — domain-shift results, worst-case behavior, and uncertainty calibration.
7. **Iteration log** — decision triggers, model changes, and evidence that caused them.
8. **Claim boundary statement** — directly supported vs. inferred vs. speculative, with validity limits.

## Validation Gates

- **Gap framing**: Baseline and mechanism are well-defined and physically plausible.
- **Hypothesis quality**: Claims are falsifiable and bounded by evidence strength.
- **Study design**: Controls, metrics, and stopping thresholds are pre-registered.
- **Model construction**: No data leakage, equivalent protocols, and passed sanity checks.
- **Performance evaluation**: Candidate meets predeclared improvement criterion over baseline.
- **Robustness**: Results are stable across splits, regimes, and perturbations.
- **Iteration**: Decision log records triggers and scope changes.

## Claim Boundaries

- Distinguish paper-supported methodological patterns from dataset-specific findings and agent-generated inferences.
- Do not present single-study results as field consensus.
- Limit generalization to the tested approximation family, descriptor set, and domain of validity.
- Mark extrapolations, transfer claims, and deployment recommendations as speculative pending independent validation.

## Failure Modes

- Error cancellation across symmetry channels or regimes masks underlying model deficiency.
- Overfitting to a single regime, data source, or reference configuration.
- Miscalibrated uncertainty leads to overconfident candidate ranking.
- Domain shift or covariate shift invalidates transfer assumptions.
- Confounding by unmodeled processing, measurement, or environmental variables.
- Missing symmetry-breaking or anisotropic perturbations in the validation suite.
- Premature extrapolation beyond the tested descriptor or configuration space.

## Validity Checks

- **Confounding**: Ensure differences reflect model structure, not tuning, data preprocessing, or split artifacts.
- **Data leakage**: Verify no future information, test-set statistics, or duplicated candidates contaminate training.
- **Symmetry/regime coverage**: Validation includes isotropic and anisotropic, linear and nonlinear, or pre- and post-transition conditions as relevant.
- **Baseline fairness**: Baselines receive comparable tuning, capacity, and feature access.
- **Statistical validity**: Use held-out validation, repeated splits, and uncertainty estimates; avoid single-run claims.
- **Physical consistency**: Predictions respect known constraints; low data error does not override implausible physics.
- **Reproducibility**: Document splits, seeds, descriptor versions, and analysis scripts.
- **Calibration**: Predicted uncertainty aligns with observed errors.
- **Boundary awareness**: Explicitly state where the surrogate relationship, transfer assumption, or regime decomposition may break down.

## Provenance

- Derived from cluster 65 / subcluster 65.1: symmetry-guided model validation and comparison.
- Synthesized from source skills: `biodiesel-engine-surrogate-research`, `sparse-data-transfer-materials-discovery`, `robot-effect-prediction-active-learning`, `materials-informatics-residual-regression-workflow`, `interphase-composite-research-workflow`, `electricity-market-dro-research-design`, `linear-response-transferability-research`, `composite-field-surrogate-exploration`.
