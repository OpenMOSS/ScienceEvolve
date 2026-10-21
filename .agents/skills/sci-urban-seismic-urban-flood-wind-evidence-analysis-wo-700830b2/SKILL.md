---
name: sci-urban-seismic-urban-flood-wind-evidence-analysis-wo-700830b2
description: A reusable end-to-end workflow for generating mechanism-based hypotheses, designing minimal viable validation, and auditing evidence claims in multi-hazard urban and infrastructure research.
scienceevolve-title: "Urban hazard resilience · seismic urban flood wind evidence analysis workflow"
scienceevolve-area: urban-hazard-resilience
---

## Purpose

Turn an observable-driven research question about urban or infrastructure systems into a mechanism-based, auditable evidence workflow. The goal is to generate testable hypotheses, design controlled validation, analyze multi-source evidence, and iterate until claims are explicitly bounded by observable support.

## When to use

Use this skill when the user asks to explore new research questions, validate mechanisms, or audit claims in domains involving spatial hazards, structural resilience, environmental fluid dynamics, or urban risk—such as flood susceptibility, seismic performance, wind loading, or infrastructure vulnerability. Do not use for operational design approval, emergency response, field-deployment instructions, or as a substitute for licensed engineering review.

## Inputs required

- **Target system and decision boundary:** spatial scale, temporal scope, hazard context, and intended use of the results.
- **Observable bottleneck or claim to be tested:** the specific mechanism, ranking, or response that the study must support or reject.
- **Available evidence tiers:** model outputs, field measurements, remote-sensing products, administrative records, or literature benchmarks, with known provenance and quality.
- **Candidate intervention or design variable:** the structural, planning, or operational concept whose effect is under investigation.
- **Evaluation priorities and constraints:** decision-relevant metrics, data gaps, computational limits, equity concerns, and safety/ethics boundaries.

## Core Workflow

Follow this ordered route. Do not skip decision gates.

1. **Frame the question and bound the claim.**
   - Convert the user’s topic into a falsifiable, mechanism-oriented research question.
   - State the system boundary, scale, and what decision the evidence should inform.
   - **Gate:** If the question is not falsifiable or the claim is operational rather than research-oriented, refactor or stop.

2. **Build a mechanism map.**
   - Link drivers, pathways, states, impacts, and responses in a causal chain.
   - Label every link as measured, modelled, inferred, or assumed.
   - Identify the weakest or most influential link for the decision at hand.
   - **Gate:** If causal links are hidden or conflated, disaggregate them before generating hypotheses.

3. **Generate mechanism-linked hypotheses.**
   - For each candidate claim, produce:
     - Concise hypothesis statement.
     - Evidence strength (strong / moderate / weak / speculative).
     - Key assumptions.
     - Minimal observable signal required for support or rejection.
     - Likely failure mode.
     - Boundary conditions.
   - **Gate:** If a hypothesis cannot be rejected with available or obtainable evidence, redesign or drop it.

4. **Design minimal viable validation.**
   - Define a scenario matrix:
     - **Baseline:** current or no-intervention condition.
     - **Strong control:** conventional comparator matched to the same objective.
     - **Negative control:** condition expected to weaken the target mechanism.
     - **Positive benchmark:** established strategy from independent evidence.
     - **Sensitivity control:** degraded data or alternative assumptions to test fragility.
   - Specify independent, mediating, and dependent variables; spatial/temporal units; and evaluation metrics.
   - Predefine failure criteria and stop conditions.
   - **Gate:** If controls do not isolate the target mechanism, redesign the matrix.

5. **Execute analysis and normalize evidence.**
   - Harmonize data sources, align spatial/temporal units, document preprocessing, and preserve provenance.
   - Compute normalized, dimensionless, or standardized metrics suitable for cross-scenario comparison.
   - Quantify uncertainty through sensitivity analysis, scenario ranges, or variance reporting.
   - **Gate:** Validate the reference case against independent evidence before interpreting design cases. If validation fails, stop and fix inputs.

6. **Compare scenarios and triangulate.**
   - Use orthogonal evidence lines (e.g., local vs. global, static vs. dynamic, model vs. observation).
   - Check for risk redistribution, trade-offs, and spatial/temporal leakage.
   - **Gate:** If conclusions rest on a single metric or a single scenario, flag them as provisional only.

7. **Audit claims and bound inference.**
   - Label each conclusion as direct observation, model-based inference, or speculative extension.
   - State boundary conditions: applicable hazard regimes, system types, data-quality tiers, and spatial/temporal limits.
   - **Gate:** If claims are generalized beyond tested conditions, tighten boundaries before release.

8. **Iterate or stop.**
   - **Support:** If evidence converges, strengthen the evidence label and define the next validation step.
   - **Contradiction:** If evidence undermines the mechanism, revise the mechanism map and generate new hypotheses.
   - **Uncertainty dominance:** If results are driven by untested assumptions or missing data, stop and specify required acquisitions or model improvements.
   - **Hard stop conditions:**
     - Controls fail or are confounded.
     - The model is unvalidated for the mechanism of interest.
     - Conclusions depend on unsupported assumptions.
     - The output would enable harmful, inequitable, or high-stakes implementation without independent review.

## Output Format

Produce the following structured artifacts:

1. **Research question and claim boundary** — falsifiable question and intended decision use.
2. **Mechanism map** — causal chain with link labels and weakest-link identification.
3. **Hypothesis table** — claim, evidence strength, key assumptions, minimal observable signal, likely failure mode, and boundary.
4. **Minimal validation plan** — scenario matrix, controls, metrics, failure criteria, and stop conditions.
5. **Analysis audit** — normalization rules, uncertainty treatment, sensitivity checks, and confounder review.
6. **Evidence-labeled conclusions** — direct observation, model inference, or speculative extension, each with stated boundaries.
7. **Iteration plan** — rules for updating hypotheses, weak links to refine next, and escalation triggers.
8. **Validity and ethics statement** — remaining confounders, reproducibility needs, equity considerations, and safety limits.

## Validation Gates

- **Reference validation:** The baseline or reference case must agree with independent evidence before design-case interpretation.
- **Control adequacy:** Baseline, negative, positive, and sensitivity controls must be present and orthogonal to the target mechanism.
- **Metric validity:** Avoid single-score success claims; report local and global, mean and extreme, and static and dynamic outcomes as relevant.
- **Uncertainty quantification:** Document scenario, parameter, model, and data uncertainty; report sensitivity of rankings or conclusions to assumptions.
- **Reproducibility:** Record data versions, preprocessing steps, spatial/temporal units, model configurations, weighting rules, and random seeds.

## Claim Boundaries

- Distinguish source-paper evidence, literature benchmarks, agent-inferred hypotheses, and user-specific assumptions.
- Limit claims to the tested system boundary, hazard regime, spatial/temporal scope, and data-quality tier.
- Do not present research findings as operational directives, design approvals, code compliance, or field-wide consensus.

## Failure Modes

- Hypothesis is unfalsifiable given available data, methods, or access.
- Reference case fails independent validation.
- Controls are confounded or fail to isolate the target mechanism.
- Single-metric success hides trade-offs, risk redistribution, or spatial leakage.
- Results depend on arbitrary thresholds, weights, or preprocessing choices.
- Spatial or temporal leakage between training and validation sets.
- Overgeneralization from a single case study to universal rules without revalidation.

## Validity Checks

- **Confounding:** Separate hazard, exposure, vulnerability, and intervention effects; control for land-use change, reporting bias, and prior investments.
- **Mechanism check:** Every indicator must connect to a causal step in the mechanism map.
- **Data-quality check:** Label model-derived, field-derived, remote-sensing, and administrative sources separately; flag missingness and uncertainty.
- **Statistical and numerical check:** Ensure adequate sampling, report dispersion and regression uncertainty, and avoid overclaiming from narrow datasets.
- **Spatial and temporal validity:** Confirm alignment of units, resolution, projection, and scenario scope.
- **Equity and ethics:** Assess distributional effects across populations or zones; avoid stigmatization; require independent review before high-stakes use.

## Provenance

- Synthesized from cluster 17, subcluster 17.0, workflow archetype "observable-driven evidence analysis and claim audit".
- Source skills: `arid-urban-flood-rtc-exploration` (10.1080/15732479.2026.2691755), `seismic-resilient-bridge-pier-exploration` (10.1002/eqe.4257), `shaded-building-wind-pressure-research-design` (10.3390/app10031128), `urban-underground-flood-risk-exploration` (10.3390/w17142081), `urban-flood-susceptibility-research-workflow` (10.3390/rs17030524), `urban-flood-resilience-research-framework` (10.1080/1573062x.2018.1508598), `wind-interference-exploration` (10.47176/jafm.16.11.1897), `gable-roof-wind-pressure-research` (10.1155/2013/396936).
