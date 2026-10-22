---
name: sci-fiber-multifunctional-fiber-composite-mechanism-dis-218a5ed8
description: Use this skill when designing end-to-end research plans for multifunctional fiber, composite, or electrochemical material systems that require observable-driven mechanism discovery, trade-off validation, and iterative claim bounding.
scienceevolve-title: "Fiber composites and battery materials · multifunctional fiber composite mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

This skill helps an agent convert a coupled-function materials problem into a structured, testable research workflow. It abstracts the shared pattern across fiber-reinforced composites, multifunctional electrodes, fibrous scaffolds, transport-selective membranes, and nanofiller-modified systems. The core paradigm is to decompose interacting failure modes into mechanism-linked hypotheses, validate them with hierarchical controls, and iterate from observable evidence rather than assuming synergy.

# When to use

Use this skill when a user asks to design, critique, or iterate research questions for material architectures where performance depends on the interaction of multiple functions—such as conductivity and confinement, sensing and repair, barrier and transport, or mechanical durability and active-material utilization. It applies to fiber-based, composite, electrode, membrane, and scaffold systems. Do not use it for operational fabrication recipes, clinical therapeutic claims, product certification, or as a general-purpose assistant outside materials research design.

# Inputs required

- Target system class and the coupled functions it must perform.
- Known or suspected interacting failure modes and trade-offs.
- Candidate architectural or processing levers intended to shift the trade-off.
- Available non-operational characterization and evaluation capabilities.
- Baseline or reference systems for comparison.
- Constraints on safety, scalability, ethics, environmental impact, and regulatory context.

# Core Workflow

Follow this ordered route. Do not skip decision gates.

1. **Scope the coupled problem**
   - Identify at least two interacting limitations (e.g., transport versus confinement, sensing versus repair, barrier versus mechanics).
   - Define the functional contradiction and the architectural or processing lever intended to resolve it.
   - *Decision gate*: If trade-offs are not clearly defined or the target application is unspecified, pause and request scoping inputs before proceeding.

2. **Generate mechanism-linked hypotheses**
   - For each limitation, formulate:
     - **Mechanism hypothesis**: why the lever should affect the target property.
     - **Structure hypothesis**: the expected microstructural or morphological signature.
     - **Function hypothesis**: the expected measurable change relative to matched controls.
     - **Boundary hypothesis**: where the effect should weaken or reverse.
   - Label evidence strength (strong / moderate / weak / speculative), state key assumptions, and identify likely failure modes.
   - *Stop condition*: If a hypothesis lacks a measurable signature or an isolatable control, deprioritize or reformulate before moving to validation.

3. **Design minimal viable validation**
   - Select one primary design axis (e.g., architecture type, filler loading, processing variable, composition ratio).
   - Define study arms:
     - **Baseline**: unmodified active material or matrix.
     - **Integrated candidate**: full proposed architecture.
     - **Mixed-component control**: same constituents without intentional architecture.
     - **Component-level controls**: individual functional modules where feasible.
     - **Weakened-function or process controls**: isolate the proposed mechanism from fabrication artifacts.
   - Predefine primary and secondary metrics, success/failure thresholds, and stop conditions.
   - *Decision gate*: If controls cannot isolate the proposed mechanism from processing or exposure artifacts, redesign the study arms before execution.

4. **Execute hierarchical analysis**
   - Verify structure, composition, and morphology before interpreting functional performance.
   - Compare results in strict order:
     1. Integrated candidate versus baseline active material.
     2. Integrated candidate versus mixed-component control.
     3. Integrated candidate versus weakened-function control.
   - Map trade-offs: record whether improving one metric degrades another and identify qualitative thresholds.
   - Separate measured results from mechanistic inferences and extrapolations.
   - *Stop condition*: If structure verification fails, or if the integrated system does not outperform the mixed control on the target metric, halt and diagnose.

5. **Discriminate mechanisms and bound claims**
   - Classify the outcome:
     - **Mechanism-supported**: converging evidence from structure, transport, mechanics, and performance.
     - **Dispersion-limited**, **damage-limited**, **exposure-limited**, or **model-inconclusive**.
   - Bound claims to the tested material class, geometry, processing route, and environment.
   - Label each claim as source-supported, experiment-supported, or agent-inferred.
   - *Decision gate*: If variability exceeds effect size, if controls explain the apparent improvement, or if mechanism-specific characterization contradicts the proposed explanation, reject the hypothesis or refine.

6. **Iterate or terminate**
   - **Continue**: The effect is reproducible, trade-offs are acceptable, and mechanism attribution is clear. Escalate to stronger factorial designs, durability testing, or downstream fate studies.
   - **Refine**: The effect exists but mechanism attribution is uncertain; add structural, transport, or interface diagnostics before changing formulation.
   - **Redesign**: The effect fails due to agglomeration, blocked transport, poor contact, weak confinement, or incompatibility; revise architecture or processing strategy.
   - **Stop**: The integrated architecture underperforms the mixed control, safety or biocompatibility thresholds are violated, improvement disappears after matching loading/thickness/contact, or performance depends on a fragile uncontrolled assay condition.
   - *Iteration loop*: Return to step 2 with an updated failure-mode map.

7. **Document provenance and residual uncertainty**
   - Record the evidence chain, failed runs, boundary conditions, and extrapolation limits.
   - Retain source-skill references in the provenance section only.

# Output Format

When using this skill, produce:

1. **Research question** — One concise question framed around coupled failure modes and architectural trade-offs.
2. **Mechanism map** — Proposed links between process/structure and function, with diagnostic evidence for each claim.
3. **Ranked hypotheses table** — Mechanism, structure, function, and boundary hypotheses; each with evidence strength, key assumptions, and likely failure modes.
4. **Study plan** — Primary design axis, study arms, hierarchical controls, predefined metrics, success/failure thresholds, and stop conditions.
5. **Analysis plan** — Structure-first verification, hierarchical control comparison, trade-off matrix, and rules for separating evidence from inference.
6. **Iteration decision rules** — Continue, refine, redesign, or stop criteria tied to specific failure signatures.
7. **Validity, safety, and ethics notes** — Confounders, reproducibility requirements, boundary conditions, and compliance cautions.

# Validation Gates

- **Confounding control**: Check loading, thickness, geometry, contact quality, wetting, porosity, processing history, exposure state, and handling differences.
- **Control adequacy**: Verify that baseline, mixed-component, component-level, weakened-function, negative, and positive controls are present and matched.
- **Reproducibility**: Require replicate batches, predefined sampling rules, documentation of failed runs, and blinded or semi-automated analysis where subjective.
- **Statistical validity**: Predefine effect sizes and decision thresholds; ensure variability is quantified before claiming improvement.
- **Mechanistic completeness**: Demand converging evidence from structure, transport, mechanics, and chemistry before claiming a mechanism.
- **Boundary condition check**: Limit conclusions to the tested matrix, architecture, filler class, processing route, and exposure environment.

# Claim Boundaries

- Separate fabrication success, structural change, functional relevance, and clinical or deployable applicability.
- Do not generalize from a single material chemistry, cell type, geometry, or batch to field-wide consensus.
- Label every claim as source-supported, experiment-supported, or agent-inferred.
- Do not conflate in vitro or preclinical performance with clinical efficacy, commercial readiness, or environmental safety.

# Failure Modes

- Integrated architecture underperforms the mixed-component control on the target metric.
- Improvement disappears after normalizing for loading, thickness, contact area, or geometry.
- Mechanism-specific characterization contradicts the proposed explanation.
- One function improves while another degrades beyond an acceptable threshold.
- Signal is indistinguishable from noise, drift, or batch variability.
- Apparent improvement is explained by a process artifact or uncontrolled covariate.
- Safety, cytotoxicity, or environmental containment thresholds are violated.
- Performance depends on a narrow, fragile assay condition that lacks transferability.

# Validity Checks

- Each variable is tied to a process, structure, or function mechanism.
- Negative controls remove the proposed function while preserving comparison context; positive controls are appropriate references for the material class.
- Metrics are predefined before testing; expected variation is comparable to anticipated effect sizes.
- Image-based or threshold-based measurements are pre-specified and reproducible.
- External validity is limited to the tested system; extrapolation to new chemistries, geometries, or environments is labeled as a hypothesis.
- Ethics and safety oversight is confirmed for hazardous, biological, electrical, or environmentally relevant work.

# Provenance

- Synthesized from cluster 20 / subcluster 20.1 (observable-driven mechanism discovery and validation).
- Derived from source skills: multifunctional-soft-scaffold-research, nanofiller-composite-research-workflow, silk-fibrous-scaffold-process-discovery, natural-fiber-surface-treatment-research, multifunctional-electrode-research-design, electrospun-biopolymer-wound-dressing-research, flexible-waterproof-membrane-research, textile-particle-research-design.
- Preserves the shared workflow route: coupled failure-mode mapping → mechanism-linked hypothesis generation → minimal viable validation with hierarchical controls → structure-first analysis → trade-off mapping → mechanism discrimination → iterative redesign → claim bounding.
