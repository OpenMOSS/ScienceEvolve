---
name: sci-fiber-structure-property-prediction-evidence-workfl-20f926b5
description: End-to-end evidence analysis and claim audit workflow for structure-property prediction in materials and soft-matter systems.
scienceevolve-title: "Fiber composites and battery materials · structure property prediction evidence workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

## Purpose

This skill transforms structure-property prediction problems into a reusable, mechanism-driven research workflow. It guides the agent to formulate hypotheses, design minimal validation with strong controls, collect evidence through independent estimation routes, and audit claims before iterating or stopping. The focus is on the logic of evidence and the boundaries of inference—not on reproducing specific paper conclusions, executing laboratory protocols, or certifying engineering performance.

## When to use

Use this skill when:

- A user needs to predict or explain how material structure, topology, or composition maps to a target property or response.
- Multiple predictive routes exist (e.g., physics-based models, simulations, data-driven estimators, or literature benchmarks) and their agreement must be audited.
- The user wants to compare mechanisms across loading modes, environmental conditions, length scales, or material variants.
- A model shows systematic deviations that require structured hypothesis generation, control experiments, or iterative redesign.
- The goal is to rank hypotheses by evidence strength and bound the validity of any claim.

Do not use this skill when:

- The user only wants a literature summary, term definition, or paper abstract.
- The task requires executable laboratory recipes, fabrication parameters, hazardous procedures, or safety-critical certification.
- The research question lacks defined states, control variables, observable metrics, or falsifiable hypotheses.

## Inputs required

Before starting, collect or explicitly flag as missing:

- **Target system**: Material class, structural descriptors (e.g., topology, phase, connectivity, porosity), and relevant length scales.
- **Target property/response**: The observable to be predicted or explained, and the conditions under which it is measured.
- **Candidate mechanisms**: Known or hypothesized structure-property links, constraints, and competing explanations.
- **Available data and models**: Existing datasets, simulation capabilities, theoretical frameworks, and accessible benchmarks.
- **Validation resources**: Independent estimation routes, control samples or reference cases, and computational or experimental access constraints.
- **Scope boundaries**: Applicable ranges, known failure modes of prior models, and regulatory or safety constraints that prohibit certain operational details.

If inputs are incomplete, output a "missing information and impact" statement, then proceed with a provisional hypothesis draft and the smallest feasible validation.

## Core Workflow

### 1. Scope and Boundary Definition
Define the prediction target, the structural degrees of freedom, the environmental/operational condition window, and the fidelity level of available models. Explicitly separate what is already validated in the literature from what is an inferred extension to the current system.

**Decision gate**: If the target property cannot be linked to any structural descriptor or observable mechanism, stop and reformulate the question.

### 2. Mechanism-Driven Hypothesis Generation
Generate hypotheses using a `structure → mechanism → observable` chain. For each hypothesis record:
- Core claim and mechanism channel.
- Evidence strength (strong / moderate / weak / speculative).
- Key assumptions about the model, material state, or measurement conditions.
- Plausible failure modes (e.g., ignored confounder, scale mismatch, distribution shift).
- Minimum viable validation needed to test it.

**Decision gate**: If no hypothesis can be framed with a falsifiable minimum viable validation, stop and gather more domain input.

### 3. Validation Protocol Design
Design a validation plan that includes:
- **Variables**: Independent (structural or environmental), dependent (target response), and covariates (batch, history, geometry, measurement protocol).
- **Controls**:
  - Baseline (reference state).
  - Positive control (known outcome to confirm sensitivity).
  - Negative control (absence of proposed mechanism to confirm specificity).
  - Strong control (single-variable perturbation to isolate the mechanism).
  - Method control (comparison across independent estimation routes).
- **Evaluation metrics**: Prediction error, mechanism consistency, parameter stability, distribution fit quality, and uncertainty bounds.
- **Stop conditions**: Data quality insufficient, controls fail, model sensitivity exceeds observational constraints, or unmodeled mechanisms dominate.

### 4. Multi-Route Evidence Collection
Execute at least two independent estimation routes (e.g., first-principles calculation, mesoscale simulation, statistical estimator, or literature benchmark). Ensure routes do not share the same core assumptions so their convergence is meaningful.

**Decision gate**: If routes rely on overlapping assumptions, redesign to achieve true independence before proceeding.

### 5. Cross-Route Consistency and Distribution Audit
Compare estimates across routes:
- Check for systematic bias, directional disagreement, or assumption-dependent divergence.
- Perform distribution diagnostics on the target response (e.g., quantile checks, tail-risk assessment, mixture detection) rather than relying solely on mean-value comparison.
- Map non-uniform fields to equivalent sampled volumes or representative domains when comparing across scales or loading modes.
- Quantify uncertainty from parameter sensitivity, sampling breadth, and model form.

**Decision gate**: If independent routes diverge beyond the combined uncertainty envelope, return to Step 2 (hypothesis revision) or Step 3 (control redesign). Do not average conflicting routes without mechanistic explanation.

### 6. Validation Gate Assessment
Assess two gates before accepting any claim:

- **Functional validation gate**: Does the prediction reproduce observed behavior within uncertainty? Do controls behave as expected? Is the error random or systematic?
- **Stability gate**: Does the mechanism remain dominant across perturbations (material variants, scales, conditions)? Are distribution parameters and model coefficients stable? If the mechanism is scale-dependent or condition-dependent, is the boundary explicitly mapped?

**Decision gate**: If either gate fails, do not proceed to claim grading. Enter iteration.

### 7. Iterative Redesign or Stop
Based on gate results:
- **If supported**: Elevate evidence strength, expand to an independent validation set or adjacent condition window, and update applicability boundaries.
- **If partially supported**: Narrow the hypothesis to a conditional claim, identify unresolved mediators, and design targeted sensitivity checks.
- **If unsupported**: Record failure mode, check for confounders or boundary-condition errors, and pivot to competing mechanisms.
- **If indistinguishable**: Increase control strength, add independent diagnostics, or reduce model complexity.

**Stop conditions**:
- Controls consistently fail to discriminate mechanisms.
- Additional data no longer changes uncertainty or error metrics.
- The required validation exceeds available resources or safety boundaries.
- The conclusion would rely solely on extrapolation beyond tested structural or environmental bounds.

### 8. Claim Grading and Boundary Setting
Produce a ranked conclusion set:
- **Data-supported**: Directly validated by current evidence and controls.
- **Model-inferred**: Consistent with data but dependent on untested model assumptions.
- **Analogy-extrapolated**: Suggested by cross-system comparison or literature trend, requiring independent verification.
- **Unverified**: Exploratory hypothesis with no current evidence.

Attach explicit validity boundaries: structural ranges, environmental windows, scale limits, and known confounders. State that any operational deployment or safety-relevant use requires dedicated compliance review beyond this workflow.

## Output Format

Each invocation should produce:

1. **Research question**: Target system, property, condition window, and the specific gap being addressed.
2. **Hypothesis table**: Claims, mechanism channels, evidence strength, key assumptions, failure modes, and minimum viable validations.
3. **Validation protocol**: Variables, controls (baseline, positive, negative, strong, method), metrics, and stop conditions.
4. **Evidence audit**: Cross-route comparison, distribution diagnostics, sensitivity analysis, and uncertainty quantification.
5. **Validation gate report**: Functional and stability gate status with pass/fail rationale.
6. **Iteration log**: Decisions taken, redesigns triggered, and stopping rationale.
7. **Ranked conclusions**: Graded claims with applicability boundaries and provenance tags.

## Validation Gates

- **Functional validation**: The predicted response must align with observations or independent benchmarks within the stated uncertainty. Controls must show expected directional behavior. Systematic residuals must be explainable by known secondary mechanisms or measurement limitations, not dismissed as noise.
- **Stability gate**: The dominant mechanism and its predictive parameters must remain stable across the tested perturbation set (e.g., material variants, scales, loading modes, or environmental states). If instability is detected, the claim must be downgraded to a conditional statement with explicit boundary lines.

## Claim Boundaries

- Do not present model correlation as causal mechanism without independent manipulation or isolation evidence.
- Do not extrapolate predictions to structural regimes, material classes, or environmental conditions outside the validated window without labeling them as unverified.
- Do not use single-method or single-system agreement as universal validation; cross-route and cross-system checks are required for strong claims.
- Do not issue operational, fabrication, or safety-critical deployment recommendations; this workflow stops at research design and evidence grading.
- Distinguish "data-supported" from "model-inferred" and "literature-analogy" conclusions in every output.

## Failure Modes

- **Mechanism misattribution**: A secondary variable or confounder reproduces the observed trend, leading to a false mechanism claim.
- **Overfitting to route-specific error**: A model fits one estimation route or dataset well but fails on independent validation because shared assumptions were not audited.
- **False convergence**: Two routes agree because they share hidden assumptions, not because the mechanism is robust.
- **Distribution masking**: Averaging or mean-comparison hides multimodal behavior, tail risk, or scale-dependent variance that invalidates the hypothesis.
- **Coverage gap**: The validation samples do not span the defect population, structural heterogeneity, or environmental state space relevant to the claim.
- **Scale or condition extrapolation**: Applying a mechanism validated at one scale or condition to another without explicit boundary testing.
- **Control failure**: Negative or strong controls fail to discriminate the hypothesized mechanism from baseline behavior, indicating insufficient experimental or model sensitivity.

## Validity Checks

- **Confounders**: Check for batch variation, history effects, geometric artifacts, boundary conditions, environmental drift, and measurement calibration.
- **Reproducibility**: Document data provenance, model versions, parameter initialization, sampling strategy, data exclusion rules, and random seeds where applicable.
- **Statistical validity**: Report confidence intervals, residual structure, parameter sensitivity, outlier treatment, and multiple-comparison risks. Avoid reporting best-fit visuals alone.
- **Model assumption checks**: Verify that homogeneity, linearity, equilibrium, periodicity, or other simplifying assumptions remain valid for the tested system.
- **Mechanism consistency**: Ensure that macroscopic trends are compatible with microscopic or mesoscopic indicators (e.g., damage location, local fields, structural evolution).
- **Independent verification**: Confirm that at least one estimation route or diagnostic does not depend on the primary model’s assumptions.
- **Boundary condition audit**: Confirm that conclusions are not generalized to structural designs, lifetimes, or safety margins without dedicated validation.

## Provenance

- Derived from cluster `12.0` (end-to-end evidence analysis and claim audit).
- Synthesized from source skills: `fiber-composite-strength-workflow`, `polymer-dynamic-heterogeneity-rheology`, `ml-battery-cathode-exploration`, `textile-uv-structure-prediction`, `fiber-yarn-color-prediction-research`, `constrained-polymer-transition-workflow`, `tokamak-edge-recycling-research-flow`, `composite-mesostructure-strength-exploration`.
- Method patterns were abstracted; no specific material parameters, numerical results, or paper conclusions are embedded in this workflow body.
