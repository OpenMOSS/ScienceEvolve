---
name: sci-polymer-composite-multiscale-moisture-hybrid-eviden-44f24f1c
description: A reusable end-to-end workflow for generating, validating, and auditing mechanism-based claims in composite and multiphase material systems across scales and environments.
scienceevolve-title: "Polymer composites and vitrimers · composite multiscale moisture hybrid evidence analysis workflow"
scienceevolve-area: polymer-composites-and-vitrimers
---

## Purpose

Guide agents through a systematic, evidence-based workflow to propose research questions, design validation studies, discriminate mechanisms, and bound claims for composite, multiphase, hybrid, or environmentally coupled material systems. The skill emphasizes cross-scale reasoning, control-based inference, and iterative claim auditing without prescribing operational procedures.

## When to use

Use this skill when the user asks to:

- Explore new research questions in composite, multiphase, coated, or hybrid material systems.
- Link microstructural mechanisms to macroscopic performance across multiple loading or environmental conditions.
- Design validation plans that separate architecture effects from material effects, or reversible effects from irreversible damage.
- Audit whether a model, simulation, or experimental result supports a mechanistic claim or merely fits observations.
- Iterate on hypotheses after discrepancies arise between prediction and independent evidence.

Do not use for operational safety certification, clinical applications, or as a substitute for qualified engineering review.

## Inputs required

Before executing the workflow, request or infer:

1. **System scope**: Constituent phases, interfaces, architecture, and relevant length scales.
2. **Anomaly or gap**: The observed mismatch, unexplained trend, or performance contradiction motivating the study.
3. **Candidate mechanisms**: Proposed structure-property links (e.g., load transfer, interface degradation, transport, damage evolution).
4. **Available evidence**: Experimental, simulation, imaging, thermal, or literature data; note what is independent versus calibrated.
5. **Validation constraints**: Independent/validation data splits, acceptable uncertainty, computational or experimental boundaries, and safety/compliance limits.
6. **Decision context**: Whether the goal is hypothesis screening, model selection, mechanism discrimination, or claim bounding.

## Core Workflow

Execute the following stages in order. Do not skip gates.

### 1. Frame the gap and bound the question
Express the anomaly as a measurable deviation from a baseline model or expectation under defined loading or environmental conditions. State the target effective behavior and the regime of interest.
- **Gate**: If the anomaly cannot be expressed as a falsifiable deviation, stop and reformulate.

### 2. Generate mechanism hypotheses
Map observations to candidate mechanisms. For each hypothesis, define:
- Causal pathway from microstructure or architecture to macroscopic response.
- Evidence strength (high / medium / low).
- Key assumptions and most likely failure modes.
- Predicted discriminating signatures across at least two distinct conditions.
- **Gate**: If hypotheses are not mutually discriminable by available or obtainable evidence, redesign the comparison matrix before proceeding.

### 3. Design minimal validation with symmetry and controls
Select independent variables that target one mechanism family at a time. Include:
- A condition where the mechanism is expected to dominate.
- A contrasting condition where the mechanism should be suppressed.
- **Controls**: baseline (simplest accepted model/practice), negative (mechanism removed or minimized), positive (known reference behavior), and cross-controls (architecture-matched or material-matched) to separate structure from composition.
- Define a calibration/validation split: reserve independent data for validation; label any partial validation explicitly.
- **Gate**: If confounders (geometry, boundary conditions, environmental history, manufacturing variability) cannot be held constant or stratified, stop and redesign.

### 4. Execute multi-route evidence collection
Collect at least two independent evidence streams (e.g., macroscopic response plus local fields; dissipation plus thermophysical properties; simulation plus experiment). Document preprocessing, definitions, and uncertainty propagation consistently.
- **Gate**: If evidence streams contradict, or if measurement uncertainty exceeds the expected effect size, diagnose artifacts before interpreting trends.

### 5. Discriminate mechanisms and localize errors
Compare full response curves, fields, or distributions rather than single summary metrics. Localize errors to specific scales or regions (interface, matrix-rich zone, defect, boundary). Test mechanism necessity by comparing predictions with and without the proposed feature under identical calibration rules.
- **Gate**: If negative controls perform as well as the proposed model, or if removing the mechanism does not worsen prediction in discriminating conditions, reject or narrow the hypothesis and return to Stage 2.

### 6. Bound claims and audit evidence
Separate observations from inferences and extrapolations. Label each claim as:
- **Observed**: directly measured.
- **Inferred**: derived from a model or indirect indicator.
- **Mechanistic interpretation**: explanation connecting observations and inferences.
- **Research extrapolation**: proposed next step beyond current evidence.
Bound claims by material class, architecture, loading regime, environmental range, and validation depth.
- **Gate**: If claims require generalization beyond tested boundaries without independent hold-out validation, flag as speculative and do not present as consensus.

### 7. Iterate or terminate
Classify the outcome:
- **Supported**: Predictions improve on held-out data without tuning to validation data. Expand cautiously to broader boundaries.
- **Partially supported**: Effect appears only in specific regimes. Narrow the claim boundary and design targeted follow-up.
- **Unsupported**: Mechanism does not improve prediction beyond controls. Discard and return to Stage 2.
- **Ambiguous**: Confounding dominates. Add controls or redesign discriminating conditions.

**Stop conditions** — Terminate and redesign if any of the following occur:
- The model only works after tuning to validation data.
- Errors concentrate in a regime where the underlying model is known to be invalid.
- Uncertainty from microstructure, interface, or boundary assumptions exceeds the expected mechanism effect.
- Safety, compliance, or reproducibility constraints are violated.

## Output Format

When using this skill, produce:

1. **Research question**: Concise statement of the anomaly, target system, and intended behavior.
2. **Mechanism gap**: Limitation of current assumptions and why the proposed mechanism may matter.
3. **Hypothesis table**: For each hypothesis: causal pathway, evidence strength, key assumptions, predicted signatures, and likely failure modes.
4. **Validation plan**: Comparator set, independent variables, controls, calibration/validation split, metrics, and stop conditions.
5. **Analysis plan**: Multi-route comparison, error localization, uncertainty treatment, and mechanism-necessity checks.
6. **Iteration log**: Decision rules for supported, partially supported, unsupported, and ambiguous outcomes.
7. **Validity and boundary statement**: Confounders, extrapolation limits, reproducibility needs, and safety constraints.
8. **Evidence distinction**: Explicit separation of what is directly supported by data, what is inferred by analogy or modeling, and what remains speculative.

## Validation Gates

- **Falsifiability gate**: The anomaly and each hypothesis must yield testable predictions under at least two distinct conditions.
- **Control gate**: Every validation plan must include baseline, negative, and architecture/material cross-controls where feasible.
- **Independence gate**: Validation datasets must be independent of calibration; partial validations must be labeled.
- **Mechanism-necessity gate**: The proposed mechanism must be shown to matter beyond simpler alternatives under the same rules.
- **Uncertainty gate**: Expected signal must exceed combined measurement and modeling uncertainty.
- **Safety/ethics gate**: Research plans must respect institutional review, hazardous material policies, and non-operational boundaries.

## Claim Boundaries

- Limit claims to the tested material class, phase architecture, manufacturing route, and environmental/loading regime.
- Do not generalize from single-system evidence to field-wide consensus.
- Distinguish laboratory simulation from real-service or field validation.
- Treat simulation-only results as hypothesis-generating, not as proof of real-world performance.
- Do not present research evidence as certification for safety-critical deployment.

## Failure Modes

- **Confounded attribution**: Performance changes misattributed to the target mechanism when manufacturing variability, boundary conditions, or environmental history explain the trend.
- **Calibration leakage**: Validation data used for model tuning, creating apparent predictive success.
- **Single-metric overfitting**: A model matches one summary property while failing the full response or local fields.
- **Non-identifiable parameters**: Multiple mechanism combinations fit the same output, preventing discrimination.
- **Scale-bridge collapse**: Microscale assumptions fail to transfer to specimen or component scale due to unrepresented heterogeneity or boundary effects.
- **Artifact dominance**: Thermal history, moisture, surface preparation, or measurement drift masquerades as mechanism signal.
- **Compensating errors**: Apparent model improvement arises from error cancellation rather than true mechanism capture.

## Validity Checks

Before finalizing any plan or claim, verify:

1. **Confounding**: Are interface properties, microstructural randomness, specimen preparation, measurement compliance, or environmental gradients controlled?
2. **Calibration leakage**: Are validation datasets fully independent? Are literature comparisons using comparable calibration rules?
3. **Representativeness**: Is the microstructure or specimen representative for the target material and response?
4. **Boundary and scale validity**: Does the model extrapolate beyond the strain, rate, temperature, environment, or architecture range supported by data?
5. **Statistical validity**: Are specimen-to-specimen variations, uncertainty intervals, and predefined metrics reported?
6. **Numerical validity**: Are mesh, boundary condition, and solver choices checked for sensitivity where they affect conclusions?
7. **Mechanistic plausibility**: Does the fitted behavior remain physically interpretable, or are improvements due to compensating errors?
8. **Reproducibility**: Are assumptions, data splits, metrics, and model variants documented clearly enough for independent reproduction?

## Provenance

- Derived from cluster 31.1 (composite-multiscale-moisture-hybrid-evidence-analysis) via semantic merge of representative source skills.
- Source skill references: `10.3390_jcs4020046`, `10.1002_pc.27290`, `10.1016_j.matpr.2021.02.334`, `10.1007_s10443-021-09979-8`, `10.1080_09243046.2023.2230687`, `10.3390_polym17212891`, `10.1016_j.compstruct.2020.113098`, `10.1177_26349833241275133`.
- Paper-specific conclusions, material systems, and numerical results have been excluded per merge policy.
