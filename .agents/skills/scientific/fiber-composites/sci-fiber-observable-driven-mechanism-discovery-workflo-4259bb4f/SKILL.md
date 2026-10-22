---
name: sci-fiber-observable-driven-mechanism-discovery-workflo-4259bb4f
description: A reusable end-to-end workflow for designing, testing, and validating mechanism hypotheses in materials and interfacial systems through controlled comparison, orthogonal evidence, and iterative claim bounding.
scienceevolve-title: "Fiber composites and battery materials · observable driven mechanism discovery workflow 14"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Transform an observed performance gap or structure-function uncertainty into a disciplined research program that discriminates among competing mechanism hypotheses using minimal viable validation, strong controls, and converging evidence.

# When to use

Use when the user needs to plan or evaluate research where a material, interface, or multi-phase assembly shows an unexplained or under-exploited performance limit, and the goal is to discover which structural, chemical, transport, or interfacial mechanism drives the outcome. Typical triggers include tuning functionality, optimizing multi-objective properties, screening architectural or compositional variables, or validating that a proposed structural change causally improves performance.

# Inputs required

- Target system class and form (e.g., bulk, film, particulate, porous solid, multiphase assembly).
- Performance bottleneck or unexplained trend to address.
- Candidate mechanism categories (e.g., transport, retention, cohesion, reactivity, morphology, defect state).
- Available characterization and evaluation methods.
- Baseline or reference conditions for comparison.
- Constraints on safety, reproducibility, resources, and regulatory scope.
- Whether the task is hypothesis generation, experiment design, analysis planning, or claim review.

# Core Workflow

An ordered, end-to-end route with decision gates and iteration/stop conditions.

1. **Bottleneck Definition & Mechanism Mapping**
   - Translate the performance gap into one or more measurable endpoints.
   - List candidate mechanisms that could plausibly control the endpoint.
   - Map each candidate to an observable proxy or structural mediator.

2. **Hypothesis Generation & Ranking**
   - Generate at least three competing, falsifiable hypotheses.
   - For each, specify: predicted direction of change, mechanism proxy, key assumption, likely failure mode, evidence strength (strong / moderate / weak / speculative), and boundary condition.
   - Rank by decisiveness; prefer hypotheses separable with minimal controls.

3. **Minimal Viable Validation Design**
   - Select one dominant design variable or architectural lever.
   - Define a comparison matrix: proposed condition, baseline, negative control (mechanism blocked or absent), positive/reference control (known behavior), and component-ablation or process controls where applicable.
   - Specify primary performance metrics, secondary trade-off metrics, and mechanism-specific intermediate metrics.
   - Define success criteria and stop conditions before data collection.

4. **Screening or Controlled Comparison**
   - Execute an efficient screening or direct comparison to rank variables or isolate the lever.
   - **Decision gate — Effect gate:** If no variable shows a meaningful effect relative to variability, stop and revisit assumptions, measurement sensitivity, or confounders.

5. **Orthogonal Evidence Collection**
   - Gather complementary data that link the design variable to the mechanism proxy and to the performance endpoint.
   - Require consistency across at least two independent evidence classes (e.g., structural and transport, or chemical and mechanical) before mechanism inference.

6. **Mechanism Discrimination**
   - Use control logic to assign causality:
     - If ablation of a component removes the effect, that component is likely causal.
     - If a single-function control matches the full design, narrow the claim to that function.
     - If only the combined architecture works, treat synergy as a hypothesis requiring further isolation.
   - **Decision gate — Mechanism gate:** If structural or intermediate evidence contradicts the proposed mechanism, stop and redesign.

7. **Robustness & Boundary Testing**
   - Test reproducibility across independent samples, batches, or repeated measurements.
   - Check whether gains persist under varied loading, rate, environment, or assembly context.
   - **Decision gate — Robustness gate:** If results are narrow, irreproducible, or vanish under stronger controls, downgrade evidence strength and iterate.

8. **Claim Bounding & Reporting**
   - Separate observed results from inferred mechanisms.
   - State evidence strength, transfer boundaries, and untested assumptions.
   - Stop when independent verification and boundary checks are complete.

9. **Iteration & Redesign**
   - If the hypothesis is supported: refine the mechanism model and test the next boundary.
   - If partially supported: add discriminating controls or intermediate measurements.
   - If contradicted: revise the dominant variable or mechanism assumption.
   - If ambiguous: improve blocking, replication, or measurement resolution.
   - Return to Step 2 or 3 with updated assumptions.

# Output Format

When using this skill, produce:

1. **Research question** — One concise, mechanism-testable question.
2. **Gap and rationale** — What is unknown and why it matters; distinguish prior evidence from new inference.
3. **Ranked hypotheses** — At least three hypotheses with evidence strength, key assumptions, failure modes, and boundary conditions.
4. **Study design** — Variables, controls, metrics, minimal viable validation, and stop conditions.
5. **Analysis plan** — Screening logic, orthogonal evidence mapping, mechanism discrimination rules, and uncertainty handling.
6. **Validation plan** — Robustness checks, reproducibility criteria, and boundary tests.
7. **Iteration rules** — Decision paths for support, partial support, contradiction, and ambiguity.
8. **Claim boundary statement** — Explicit limits on transferability, evidence strength, and unresolved assumptions.

# Validation Gates

- **Effect gate**: Does the dominant variable produce a measurable effect beyond noise and confounders?
- **Mechanism gate**: Do orthogonal evidence streams align with the proposed mechanism?
- **Control gate**: Do ablation, single-function, and process controls behave as expected?
- **Robustness gate**: Do results replicate across independent samples and relevant conditions?
- **Safety gate**: Are proposed studies within institutional safety, environmental, and regulatory boundaries?

# Claim Boundaries

- Distinguish measured observations from inferred mechanisms.
- Label paper-informed patterns, system-inferred hypotheses, and speculative transfers separately.
- Limit claims to the tested design region, material class, and measurement context.
- Do not present single-study or laboratory-scale results as field consensus or deployment-ready.
- Avoid clinical, therapeutic, commercial-readiness, or environmental-benignity claims without independent validation.

# Failure Modes

- **Null effect**: The design variable has no detectable influence, likely due to an incorrect lever, insufficient range, or high variability.
- **Confounded effect**: Improvement is explained by loading, thickness, processing history, or measurement artifact rather than the proposed mechanism.
- **Single-metric illusion**: Gains in one endpoint mask losses in durability, transport, or safety.
- **Synergy mirage**: Apparent multifunctional benefit collapses when component-only controls are compared.
- **Irreproducibility**: Trends disappear across batches, positions, or repeated runs due to uncontrolled precursor or environmental variation.
- **Boundary violation**: Extrapolation beyond the tested region leads to unsupported predictions.

# Validity Checks

Before finalizing any plan or claim, verify:

- **Confounding**: Are composition, processing, geometry, environment, and measurement history controlled or recorded?
- **Causality**: Are variables linked to mechanisms and endpoints through explicit controls?
- **Replicability**: Are repeats, uncertainty estimates, and outlier handling predefined?
- **Metric alignment**: Do measured endpoints match the target application or scientific question?
- **Mechanism-evidence separation**: Are mechanism claims labeled as hypotheses unless directly tested?
- **Normalization fairness**: Are comparisons made on equivalent bases (mass, area, volume, active fraction)?
- **Statistical rigor**: Are variability, model uncertainty, and design-region limits considered?
- **Safety and ethics**: Are hazards, waste, exposure, and regulatory constraints addressed at the design level without operational recipes?

# Provenance

- Derived from cluster 20 / subcluster 20.0: observable-driven mechanism discovery and validation.
- Synthesized from source skills: fiber-surface-activation-research, process-structure-property-fiber-exploration, dual-function-host-design-for-battery-cathodes, multichannel-carbon-electrode-exploration, natural-fiber-biocomposite-exploration, multifunctional-network-electrode-research, oxide-doping-research-exploration, thermoresponsive-polymer-thin-film-exploration.
- Preserves the shared workflow route: bottleneck definition → hypothesis generation → minimal validation → orthogonal evidence → mechanism discrimination → robustness testing → claim bounding → iteration.
