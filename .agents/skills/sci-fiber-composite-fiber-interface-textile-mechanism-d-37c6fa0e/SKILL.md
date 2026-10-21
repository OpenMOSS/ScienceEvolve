---
name: sci-fiber-composite-fiber-interface-textile-mechanism-d-37c6fa0e
description: A reusable end-to-end workflow for generating mechanism-based hypotheses, designing controlled validation studies, and iteratively bounding claims in composite, fiber, interface, and textile material systems.
scienceevolve-title: "Fiber composites and battery materials · composite fiber interface textile mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Help an agent transform a composite or fiber-reinforced material problem into a rigorous, reusable mechanism-discovery and validation program. The skill abstracts a cross-domain pattern: isolate the roles of reinforcement, matrix, and interface; generate causal hypotheses; validate through controlled multi-modal experiments; discriminate mechanisms using structure-property evidence; and iteratively bound claims without treating any single study as universal truth.

# When to use

Use when the user asks to propose new research questions, design experiments, analyze data, or iterate on hypotheses for composite material systems where reinforcement architecture, matrix behavior, and interfacial phenomena may couple to govern performance. Applicable to polymer-matrix composites, fiber-reinforced systems, textile-reinforced structures, active or responsive interfaces, and multi-phase engineered materials. Do not use for operational fabrication recipes, safety-critical design certification, or field implementation instructions.

# Inputs required

- Target material class and application context.
- Performance gap or failure mode to address.
- Candidate reinforcement, matrix, or interface design levers.
- Available characterization resources (mechanical, imaging, spectroscopic, thermal, rheological, etc.).
- Baseline or comparator systems accessible for controls.
- Constraints: safety, regulatory, reproducibility, and boundary conditions for extrapolation.

# Core Workflow

## Phase 1: Gap framing and hypothesis generation
1. Frame the problem as a multi-objective trade-off rather than a single-metric improvement.
2. Define the distinct roles of reinforcement (load transfer, bridging, crack obstruction), matrix (cohesion, stress distribution, environmental protection), and interface (bonding, wetting, stress transfer efficiency).
3. Generate at least three mechanism-based hypotheses. Each must state a causal chain: design lever → expected structural or interfacial change → expected performance outcome → condition under which the effect should appear.
4. Assign evidence strength (strong, moderate, weak, speculative) and list key assumptions, predicted failure morphologies, and what observations would falsify the hypothesis.

**Decision Gate 1 — Candidate Gate:** If the hypotheses cannot be falsified with the available resources, or if the mechanism cannot be separated from confounding variables, stop and redefine the scope or levers before proceeding.

## Phase 2: Control-centric study design
1. Define independent variables (design levers), dependent variables (performance metrics), and covariates (process history, geometry, environment).
2. Establish a control hierarchy:
   - Neat/untreated baseline.
   - Single-component baselines (reinforcement-only, matrix-modified-only) to isolate additive versus interaction effects.
   - Negative control expected to exhibit weak or absent target mechanism.
   - Positive or benchmark control when a validated comparator exists.
3. Specify structural descriptors (dispersion, void indicators, thickness, orientation) as measured covariates, not assumptions.
4. Define the minimal viable validation: the smallest comparison matrix that can falsify the primary hypothesis.
5. State stop conditions upfront (e.g., defect-dominated response, unacceptable variability, baseline failure).

**Decision Gate 2 — Design Gate:** If controls cannot isolate the target mechanism from geometry, processing, or measurement confounders, redesign the experiment before execution.

## Phase 3: Multi-modal evidence collection
1. Collect performance data across all relevant loading modes and functional conditions aligned with the research question.
2. Collect microstructural and interfacial evidence (imaging, spectroscopy, fracture surface inspection, etc.) to test whether the proposed structural changes exist.
3. Record process history, structural descriptors, and environmental state for every specimen group.

**Decision Gate 3 — Data Quality Gate:** If baseline variability exceeds the expected effect size, if artifacts dominate the response, or if structural evidence is missing for the claimed mechanism, pause execution and improve reproducibility or add measurements.

## Phase 4: Mechanism discrimination analysis
1. Compare the full treatment against component-only baselines to determine whether the effect is additive or a true interaction.
2. Triangulate evidence: require consistency across macroscopic performance, failure morphology, and microstructural/interface observations. Do not infer mechanism from a single endpoint.
3. Separate main effects from interactions (e.g., whether reinforcement efficacy changes with matrix state or processing condition).
4. Inspect for non-monotonic trends as evidence of competing mechanisms (e.g., over-constraint, agglomeration, or saturation).
5. Classify each result by mechanism label: matrix-dominated, reinforcement-dominated, interface-dominated, architecture-dominated, or mixed.

**Decision Gate 4 — Mechanism Gate:** If mechanical or functional response improves without plausible structural or interfacial evidence, reject the proposed mechanism label and flag the result as unresolved or artifact-driven.

## Phase 5: Claim bounding and evidence grading
1. Grade each hypothesis as supported, partially supported, rejected, or ambiguous based on the triangulated evidence.
2. Define explicit claim boundaries: limit conclusions to the tested material class, reinforcement architecture, processing route, loading modes, and environmental conditions.
3. Assess trade-offs (e.g., strength versus ductility, stiffness versus toughness) and whether gains remain meaningful after considering variability.
4. Distinguish source-paper-verified mechanisms, abstracted method patterns, and new-system inferences.

**Decision Gate 5 — Claim Gate:** If results depend on a single loading mode, lack replication, or require extrapolation beyond tested boundaries, downgrade claim strength and require further validation before broader inference.

## Phase 6: Iteration or termination
- **If supported:** Expand to robustness checks, boundary-condition testing, secondary loading modes, or longer-term durability screening.
- **If partially supported:** Refine the mechanism hypothesis, add discriminating contrasts, or test specific confounders, then return to Phase 2.
- **If rejected:** Replace the mechanism label and return to Phase 1 to generate new hypotheses.
- **If ambiguous:** Check confounders and measurement sensitivity; return to Phase 2 or 3.
- **Stop conditions:** Terminate if the combined system fails to outperform component-only baselines on the target trade-off; if defect-dominated behavior masks the mechanism; if safety or ethical boundaries are reached; or if variability remains too large to distinguish effects from noise.

# Output Format

When using this skill, produce:

1. **Research question and gap statement** — framed as a performance trade-off.
2. **Mechanism map** — causal chain from design lever to structural/interfacial change to performance outcome.
3. **Ranked hypotheses table** — claim, mechanism label, evidence strength, key assumptions, predicted signatures, possible failure modes, and minimal validation for each.
4. **Study design schema** — independent variables, control hierarchy, primary and secondary metrics, structural descriptors, and stop conditions.
5. **Analysis plan** — mechanism triangulation logic, confounder checks, interaction and trade-off interpretation, and uncertainty reporting.
6. **Validation summary** — evidence grading, claim boundaries, reproducibility notes, and boundary conditions.
7. **Iteration roadmap** — next actions based on supported, partial, rejected, or ambiguous outcomes.

# Validation Gates

- **Candidate Gate:** Hypotheses must be falsifiable, mechanism-based, and separable from confounders.
- **Design Gate:** Controls must isolate the target mechanism; geometry, processing, and measurement conditions must be matched across groups.
- **Data Quality Gate:** Baseline variability must be smaller than expected effects; artifacts must not dominate the response.
- **Mechanism Gate:** Macroscopic or functional gains must be accompanied by converging structural and interfacial evidence.
- **Claim Gate:** Claims must be commensurate with replication level, loading modes tested, and boundary conditions; extrapolation must be labeled as speculative.

# Claim Boundaries

- Do not generalize beyond the tested material class, reinforcement architecture, processing route, geometry, loading mode, and environmental conditions.
- Distinguish prior verified mechanisms from abstracted workflow patterns and from new-system agent-generated hypotheses.
- Do not present laboratory or bench-scale evidence as proof of field performance, service durability, or safety-critical readiness.
- Mark transfer claims to other material families, scales, or manufacturing routes as speculative unless independently validated.

# Failure Modes

- Confounding by uncontrolled process history, geometry, moisture state, or measurement artifacts.
- Poor dispersion, agglomeration, void formation, or defect populations masking reinforcement effects.
- Weak or incompatible interfacial bonding leading to premature debonding or load-transfer failure.
- Competing mechanisms producing non-monotonic behavior or trade-offs that invalidate single-endpoint optimization.
- Insufficient replication or high variability generating false support for a mechanism.
- Over-interpretation of improvement in one loading mode while ignoring degradation in another.

# Validity Checks

- **Confounding control:** Are material source, geometry, processing history, and measurement protocols matched across groups?
- **Mechanism specificity:** Does each experimental condition test one primary mechanism rather than multiple simultaneous changes?
- **Control adequacy:** Are neat, single-component, negative, and benchmark controls included and behaving plausibly?
- **Statistical validity:** Are effect sizes meaningful relative to reported variability, and are repeated measurements sufficient?
- **Mechanism validity:** Do microstructural, interfacial, and failure-mode observations support the proposed process-structure-property chain?
- **Reproducibility:** Are design logic, group definitions, data-cleaning rules, and analysis steps documented without hidden assumptions?
- **Boundary validity:** Are conclusions explicitly constrained to tested conditions?
- **Generalization discipline:** Are new research questions and transfer claims framed as hypotheses to test, not as field-wide conclusions?

# Provenance

- Synthesized from cluster 64.0 (composite-fiber-interface-textile-mechanism-discovery-workflow).
- Derived from source skills: polymer-fiber-soil-reinforcement-research-design, sma-polymer-interface-research-workflow, dual-function-scaffold-exploration, fiber-composite-reinforcement-exploration, composite-pressure-defect-interface-research, fiber-reinforced-cementitious-pavement-exploration, flexible-textile-composite-research-design, polymer-fiber-composite-exploration.
- Retains cross-domain patterns for mechanism discovery and validation without preserving source-specific material systems, numerical results, or paper conclusions.
