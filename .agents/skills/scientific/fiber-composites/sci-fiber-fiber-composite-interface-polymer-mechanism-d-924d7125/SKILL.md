---
name: sci-fiber-fiber-composite-interface-polymer-mechanism-d-924d7125
description: An end-to-end, observable-driven workflow for discovering and validating structure-function mechanisms in fiber-reinforced polymer composites and related interfacial material systems.
scienceevolve-title: "Fiber composites and battery materials · fiber composite interface polymer mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

## Purpose

Use this skill to guide an agent through a reusable, end-to-end research workflow for fiber-reinforced polymer composites, natural-fiber composites, polymer aging, and structured interfacial systems. The workflow converts an observable performance gap into competing mechanism-driven hypotheses, designs minimal controlled validation, triangulates multiscale evidence, and iterates only when evidence supports an update. It is designed to prevent overclaiming from single-metric improvements or unsupported extrapolation.

## When to use

Use this skill when the user asks to:

- Explore new research questions around fiber-matrix interfaces, polymer stability, surface modification, or hierarchical structure in composites.
- Generate hypotheses about how a structural, chemical, or architectural change alters transport, mechanical, degradation, or wetting behavior.
- Design controlled experiments that separate geometry effects from chemistry effects, or bulk effects from interfacial effects.
- Plan analysis pipelines that combine orthogonal characterization (mechanical, morphological, chemical, thermal, transport) to discriminate mechanisms.
- Iterate a material design after ambiguous, mixed, or negative results.

Do not use this skill to generate executable hazardous protocols, fabrication recipes, clinical or structural deployment claims, or to treat a single source study as field-wide consensus.

## Inputs required

Before starting the workflow, identify or request:

- **Target system**: fiber or filler type, matrix class, interface architecture, and processing history.
- **Observable gap**: the specific measurable mismatch between structure and function (e.g., weak stress transfer, premature degradation, anomalous diffusion, poor wetting).
- **Candidate mechanisms**: proposed structural, chemical, transport, or interfacial explanations for the gap.
- **Evidence inventory**: available characterization methods across scales (mechanical, imaging, spectroscopy, thermal, transport, electrochemical).
- **Constraints**: safety boundaries, environmental limits, sample availability, and acceptable trade-off thresholds.
- **Baseline**: unmodified or reference state for comparison.

## Core Workflow

Follow this ordered route. Do not skip decision gates.

### 1. Frame the observable gap and decision criterion
- State the performance bottleneck as a measurable, materials-specific mismatch.
- Define the decision criterion that would accept or reject a mechanism (e.g., a target improvement in stress transfer coupled with a morphological indicator).
- **Stop condition**: If the gap cannot be operationalized into at least one measurable response variable and one structural/chemical predictor, pause and refine the question.

### 2. Generate competing, mechanism-driven hypotheses
- For each candidate mechanism, write a testable hypothesis linking a specific structural or chemical feature to the observable gap.
- Include a null hypothesis (non-specific damage, processing artifact, measurement bias).
- Label **evidence strength**: `high` (prior direct evidence), `moderate` (analogy or theory), `low` (speculative).
- Annotate **key assumptions** and **predicted observations** for each.
- **Gate**: Reject hypotheses that are not falsifiable by the available evidence inventory.

### 3. Design minimal discriminating validation
- Build the smallest matrix that can discriminate among the top hypotheses:
  - **Baseline**: untreated or unmodified reference.
  - **Negative control**: condition expected to lack the target mechanism.
  - **Positive/benchmark control**: known reference when available.
  - **Mechanism-isolating variants**: change one design axis (geometry, chemistry, loading, environment) while holding others constant.
- Define abstract variable classes (e.g., treatment severity, structural motif, fiber loading, exposure atmosphere) without prescribing operational parameters.
- Pre-register **stop conditions**: stop if baseline variability prevents discrimination, controls fail, safety constraints are unmet, or the effect depends on an unreported processing step.

### 4. Acquire orthogonal, multiscale evidence
- Collect at least two independent evidence categories per hypothesis (e.g., mechanical + morphological, chemical + transport, thermal + spectroscopic).
- Apply the same measurement pipeline to baseline, controls, and variants.
- **Gate**: If only one evidence category is available, downgrade all conclusions to `speculative` and flag the need for triangulation.

### 5. Discriminate mechanisms through evidence triangulation
- Compare results across evidence categories.
  - **Convergent**: independent data support the same mechanism → proceed to robustness testing.
  - **Conflicting**: data disagree → classify as inconclusive, generate alternative hypotheses, and redesign the contrast.
  - **Absent**: predicted signature missing → refute the hypothesis and preserve only the validated observations.
- Use stage-aware interpretation (early vs. late regimes, surface vs. bulk, local vs. nonlocal) rather than assigning one mechanism to the entire dataset.

### 6. Model-supported inference (optional)
- Fit explanatory or kinetic models only after stage boundaries and control validity are established.
- Report fit quality, residuals, parameter sensitivity, and comparison to simpler alternatives.
- Treat model agreement as empirical support, not proof of mechanism.

### 7. Robustness and boundary probing
- Introduce a relevant perturbation (loading, thickness, severity, environment, cycling history) to test whether the mechanism is invariant or fragile.
- **Gate**: If the effect reverses, disappears, or produces new failure modes under perturbation, narrow the claim boundary rather than broadening it.

### 8. Claim bounding and iteration
- Classify each conclusion:
  - **Supported**: convergent orthogonal evidence + passing controls.
  - **Partially supported**: one evidence category supports, others are ambiguous.
  - **Refuted**: key predicted evidence is absent or contradicted by controls.
  - **Inconclusive**: data cannot discriminate among competing mechanisms.
- Update the research plan:
  - Supported → narrow the mechanism and propose a more specific contrast.
  - Partially supported → identify missing evidence category and redesign.
  - Refuted → replace the mechanism family; document negative results.
  - Inconclusive → improve controls, increase orthogonality, or simplify the variable matrix.
- **Iteration stop**: Stop if two consecutive cycles remain inconclusive, or if the claim requires unsupported assumptions about untested systems.

### 9. Final validation and output assembly
- Assemble the claim boundary, residual risks, and applicability limits.
- Ensure demonstrated findings are separated from speculative extensions.
- Confirm that no source-specific material, parameter, or paper conclusion has been treated as universal.

## Output Format

When using this skill, return:

1. **Research question framing**: concise problem statement, observable gap, and decision criterion.
2. **Ranked hypotheses**: each with mechanism, evidence strength, key assumptions, predicted observations, and failure modes.
3. **Study plan**: minimal matrix, variable classes, controls, metrics, and pre-registered stop conditions.
4. **Analysis plan**: orthogonal evidence categories, triangulation logic, stage segmentation, and model-fitting rules.
5. **Evidence map**: table linking each hypothesis to its supporting, conflicting, or missing evidence.
6. **Iteration log**: current classification (supported/partially supported/refuted/inconclusive), updated hypothesis, and next discriminating experiment.
7. **Claim boundaries and residual risks**: explicit limits on extrapolation, material scope, and operational conditions.
8. **Validity and safety notes**: confounders, reproducibility checks, and non-operational safety constraints.

## Validation Gates

- **Gate 1 — Fabrication/Preparation Fidelity**: The intended structure or chemistry must be verified before functional interpretation. If the architecture did not survive processing, fix the preparation logic.
- **Gate 2 — Control Interpretability**: Geometry, chemistry, and processing effects must be separable. If controls are confounded, redesign the comparison matrix.
- **Gate 3 — Mechanism Plausibility**: Wetting, transport, mechanical, or degradation metrics must align with the proposed mechanism. If metrics conflict, test alternatives before claiming success.
- **Gate 4 — Reproducibility**: Results must be consistent across replicates, locations, or batches. If variability is unexplained, characterize heterogeneity before advancing.
- **Gate 5 — Functional Relevance**: The observed structural or chemical state must enable the target application behavior. If the state exists but function is absent, refine the pairing or operating condition.

## Claim Boundaries

- Do not present single-study or single-system evidence as field-wide consensus.
- Do not extrapolate beyond the tested fiber class, matrix chemistry, loading range, environmental condition, or characterization method.
- Do not infer mechanism from a single metric (e.g., capacity, strength, or contact angle alone).
- Do not claim clinical, structural, or commercial readiness without independent validation and standards compliance.
- Distinguish paper-supported patterns from agent-inferred hypotheses for new systems.

## Failure Modes

- **Over-treatment / over-modification**: structural damage or nonspecific degradation masquerading as improvement.
- **Poor dispersion or interface contact**: processing artifacts confounded with material effects.
- **Measurement artifact**: drift, contamination, geometry effects, or calibration error creating apparent mechanism signatures.
- **Model overfitting**: kinetic or statistical models fitting noise rather than discriminating regimes.
- **Competing mechanism dominance**: an unintended pathway (e.g., pore blockage, additive migration, matrix plasticization) overwhelms the target effect.
- **Non-monotonic behavior**: benefit at low severity reverses at high severity, producing a false optimum if untested.
- **Insufficient projection contrast**: treatment families are too similar to distinguish mechanisms.
- **Residual confounding**: washing, drying, handling, or solvent differences explain the result rather than the intended variable.

## Validity Checks

Before finalizing any conclusion, verify:

- **Confounding**: Are processing, loading, moisture, dispersion, and measurement conditions matched or explicitly controlled?
- **Reproducibility**: Are independent replicates, batch variation, and transparent exclusion criteria reported?
- **Statistical validity**: Are tests matched to the design, uncertainties propagated, and single-point overclaiming avoided?
- **Mechanistic validity**: Does each proposed mechanism have at least one direct or orthogonal indicator?
- **Boundary validity**: Are claims limited to the tested chemistry, architecture, and operating regime?
- **Morphology/chemical validity**: Are imaging and spectroscopy representative, calibrated, and free from contamination artifacts?
- **Safety and compliance**: Does the plan remain at a non-operational research-design level, deferring hazardous execution to qualified institutional review?

## Provenance

- Synthesized from cluster `22.0` (observable-driven mechanism discovery and validation).
- Source skills: `reconfigurable-quantum-topological-photonics-research-design` (10.1103_xm7z-bnpl); `natural-fiber-biocomposite-interface-exploration` (fiber__10.1177_00405175211041878); `lithium-sulfur-battery-binder-research-design` (10.1016_j.jechem.2020.10.002); `hierarchical-electrode-research-design` (10.1007_s12274-022-4741-4); `polymer-thermal-aging-research-agent` (fiber__10.1002_app.49031); `bioinspired-wettability-research-design` (10.1021_jp513001k); `cellulose-fiber-modification-exploration` (fiber__10.1007_s12221-014-0226-8); `li-s-interface-mechanism-exploration` (10.1021_acsami.3c09948).
