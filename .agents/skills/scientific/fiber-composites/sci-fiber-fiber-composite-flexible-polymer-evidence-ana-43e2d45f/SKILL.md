---
name: sci-fiber-fiber-composite-flexible-polymer-evidence-ana-43e2d45f
description: An end-to-end evidence analysis and claim audit workflow for fiber, composite, flexible polymer, porous, and interface materials research, guiding hypothesis generation, controlled validation, multi-modal analysis, and iterative claim bounding.
scienceevolve-title: "Fiber composites and battery materials · fiber composite flexible polymer evidence analysis workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

## Purpose

This skill guides an agent through an end-to-end evidence analysis and claim audit workflow for materials research involving fibers, composites, flexible polymers, porous media, and interfaces. It translates performance gaps into mechanistic hypotheses, designs controlled validation with explicit stop conditions, and audits claims against multi-modal evidence to prevent over-interpretation.

## When to use

- When proposing new research questions in fiber-reinforced, flexible, porous, or interfacial material systems.
- When migrating mechanistic insights from literature to a new material combination, structure, or application context.
- When designing experiments or simulations that require strong controls, multi-indicator validation, and iterative hypothesis updating.
- When auditing whether observed performance changes are attributable to claimed mechanisms rather than confounders.

Not for: operational lab recipes, hazardous procedural details, or treating single-study results as field consensus.

## Inputs required

- **Target system boundary**: material classes, architecture, and intended function.
- **Performance bottleneck or gap**: the specific limitation or failure mode to address.
- **Controllable variables**: composition, structure, interface, processing, or environmental factors.
- **Available characterization/testing modalities**: structural, chemical, transport, mechanical, or electrochemical.
- **Constraints**: safety, compliance, reproducibility, sample budget, and statistical power requirements.
- **Prior evidence**: literature, preliminary data, or analogous systems with explicit confidence levels.

## Core Workflow

1. **Gap Definition & Mechanistic Framing**
   - Translate the application or device bottleneck into a material-level mechanism question.
   - Map candidate variables to intermediate structural or transport states and to final performance.
   - Define the boundary of applicability upfront.

2. **Hypothesis Generation & Ranking**
   - Generate 2–5 candidate hypotheses using a mechanistic chain: Intervention A → Intermediate B → Performance C.
   - Tag each with evidence strength (High / Medium / Low), key assumptions, and explicit failure modes.
   - **Decision Gate A**: Are hypotheses falsifiable, measurable with available tools, and within safety/compliance bounds? If no, reformulate.

3. **Minimum Viable Validation Design**
   - Select the smallest set of comparisons that can distinguish between top-ranked hypotheses.
   - Define independent, intermediate (mechanistic), and dependent variables.
   - Establish strong controls: baseline, negative, positive, single-factor, and process blanks.
   - Preset stop conditions: control failure, mechanism–performance mismatch, safety breach, or non-reproducible variance.
   - **Decision Gate B**: Do controls isolate the claimed mechanism and are stop conditions explicit? If no, redesign.

4. **Evidence Collection & Data Audit**
   - Record sample metadata, batch info, measurement conditions, and anomalies.
   - Separate raw observations from processed data and interpretive conclusions.
   - Enforce consistent normalization and unit standards across all groups.

5. **Multi-Modal Analysis & Mechanistic Triangulation**
   - Analyze trends by controlling for single variables before interpreting interactions.
   - Cross-compare performance indicators with mechanistic indicators (structure, interface, transport).
   - Build or compare models only after confirming data quality; prefer interpretable or physics-constrained models for small samples.
   - **Decision Gate C**: Do mechanistic indicators and performance indicators change in a consistent direction? If no, halt performance interpretation and audit confounders.

6. **Claim Audit & Confidence Grading**
   - Grade each claim as: **Verified** (data-supported), **Inferred** (mechanistically plausible but not directly tested), or **Extrapolated** (outside tested boundaries).
   - Bound claims by material system, structure, measurement protocol, and environmental window.
   - **Decision Gate D**: Is the evidence sufficient for the claim level assigned? If no, downgrade the claim or flag for iteration.

7. **Iteration or Redesign**
   - If hypothesis is supported: extend to boundary conditions or test durability/robustness.
   - If hypothesis is weakened: revise mechanistic chain, test alternative explanations, or increase control rigor.
   - If hypothesis is falsified: return to Step 2 with updated knowledge; do not incrementally tweak failed assumptions.
   - **Stop Condition**: Terminate if two consecutive loops fail to resolve mechanism–performance contradictions, if safety/compliance limits are reached, or if results are trapped in an ungeneralizable narrow window.

## Output Format

Each invocation should produce:

1. **Research Question**: Bottleneck, target performance, and applicability boundary.
2. **Mechanistic Rationale**: Variable → Intermediate → Performance chain.
3. **Ranked Hypotheses**: Table with mechanism, evidence strength, key assumptions, failure modes, and minimum validation.
4. **Validation Plan**: Variable definitions, control table, stop conditions, and safety/compliance boundaries.
5. **Analysis Plan**: Data audit rules, triangulation logic, modeling approach, and visualization scheme.
6. **Claim Audit**: Confidence grades, boundary conditions, and explicit distinction between verified and inferred results.
7. **Iteration Plan**: Next-step logic for support, weakening, or falsification scenarios.
8. **Validity & Safety Summary**: Confounder checklist, reproducibility requirements, and non-operational risk notes.

## Validation Gates

- **Gate A (Hypothesis)**: Falsifiable predictions exist; evidence strength is explicit; safety/compliance bounds are respected.
- **Gate B (Design)**: Controls can isolate mechanism from confounders; sample size supports planned comparisons; stop conditions are predefined.
- **Gate C (Analysis)**: Mechanistic and performance indicators are directionally consistent; normalization is uniform; outliers are flagged.
- **Gate D (Claim)**: Claim grade does not exceed evidence; boundary conditions are stated; single-study results are not presented as consensus.

## Claim Boundaries

- Distinguish paper-derived patterns from new-problem inferences.
- Distinguish material-level observations from device-level or system-level conclusions.
- State that cross-material, cross-architecture, or cross-environment conclusions require independent validation.
- Do not assert causality from correlation without mechanistic mediation evidence.
- Do not generalize beyond the tested variable window or sample population.

## Failure Modes

- **Mechanism Mismatch**: Performance improves but mechanistic indicators do not support the proposed pathway.
- **Confounding Dominance**: Uncontrolled variables (batch, environment, geometry, normalization) explain observed trends.
- **Control Failure**: Negative and positive controls do not separate, indicating measurement or sample issues.
- **Overfitting / Model Leakage**: Complex models fit noise or training/validation boundaries are violated.
- **Irreproducibility**: High variance across batches, samples, or operators without documented root cause.
- **Narrow Window Trap**: Effects only appear under an ungeneralizable combination of conditions.
- **Safety / Compliance Breach**: Proposed validation crosses institutional risk thresholds.

## Validity Checks

- **Confounders**: Audit batch, geometry, environmental exposure, measurement sequence, contact resistance, and normalization basis.
- **Control Validity**: Verify that negative controls show baseline behavior and positive controls show expected effective behavior.
- **Statistical Validity**: Report repeats, dispersion, effect size, and uncertainty; avoid single-sample peaks as trends.
- **Mechanistic Sufficiency**: Require at least one independent structural, chemical, or transport indicator to support any performance mechanism claim.
- **Reproducibility**: Retain sample IDs, metadata, processing records, analysis scripts, and random seeds.
- **Normalization Integrity**: Keep material-level and device-level metrics separate; report the normalization basis explicitly.
- **Boundary Adherence**: Confirm conclusions are tagged with applicable material, structure, protocol, and environment limits.

## Provenance

- Synthesized from cluster 46 / subcluster 46.0 (fiber-composite-flexible-polymer-evidence-analysis-workflow).
- Derived from source skills: photovoltaic-interface-passivation-research (1812.06424), textile-electromagnetic-materials-exploration (fiber__10.1177_00405175221095738), lignocellulosic-fiber-capillarity-design (fiber__10.1177_15589250241246071), natural-fiber-hybrid-composite-exploration (fiber__10.1155_2022_5696758), flexible-fiber-supercapacitor-exploration (fiber__10.1021_acsnano.7b05029), li-s-battery-selective-separator-exploration (10.1038_nenergy.2016.94), porous-affinity-fiber-membrane-research (fiber__10.1002_app.55725), hybrid-biocomposite-thermal-exploration (fiber__10.1016_j.ijbiomac.2019.08.231).
- Paper-derived patterns are preserved only as methodological abstractions; no specific material recipes, numerical results, or operational protocols are included.
