---
name: sci-polymer-composite-thermoset-bio-vitrimer-mechanism-62a7289c
description: A reusable end-to-end workflow for generating research questions, designing controlled experiments, and iterating hypotheses to discover and validate mechanisms in composite, thermoset, bio-based, or vitrimer material systems.
scienceevolve-title: "Polymer composites and vitrimers · composite thermoset bio vitrimer mechanism discovery workflow"
scienceevolve-area: polymer-composites-and-vitrimers
---

# Purpose

Help an agent generate research questions, design experiments, and interpret evidence to discover and validate material mechanisms in crosslinked networks, reinforced composites, and adaptive material systems—without relying on specific recipes or paper conclusions.

# When to use

Use this skill when the user asks to:

- Explore new research directions for thermosets, vitrimers, bio-based networks, or reinforced composites.
- Resolve a performance trade-off such as stiffness versus toughness, stability versus reprocessability, or conductivity versus integrity.
- Design hypothesis-driven experiments with discriminating controls.
- Interpret structure-property-function evidence and decide the next research step.

Do not use this skill for operational laboratory protocols, safety-critical qualification, or as a substitute for domain-specific safety or regulatory review.

# Inputs required

Before generating a plan, request or identify:

- Target material class and application boundary.
- Performance gap or trade-off to be resolved.
- Candidate building blocks, fillers, or modification strategies, if known.
- Available characterization categories and measurement constraints.
- Safety, regulatory, or environmental boundaries.
- Whether the task is hypothesis generation, experimental design, data interpretation, or proposal critique.

# Core Workflow

## 1. Frame the gap and mechanism stack

- Define the material contradiction or trade-off explicitly.
- Build a mechanism stack that assigns distinct roles to each layer:
  - Matrix or network mechanism: structural integrity and baseline properties.
  - Functional-phase mechanism: active or secondary property contribution.
  - Interface or interphase mechanism: load transfer, dispersion, or transport continuity.
  - Dynamic or adaptive mechanism: rearrangement, repair, reprocessing, or stimulus response.
- **Decision gate:** If the gap cannot be tied to a specific mechanism layer, stop and refine the research question.

## 2. Generate coupled hypotheses

- For each mechanism layer, state a hypothesis linking composition or structure to an observable property or function.
- Label evidence strength as strong, moderate, weak, or speculative.
- List key assumptions, likely failure modes, and a minimal falsification test for each hypothesis.
- **Decision gate:** If no hypothesis is falsifiable with available methods, redesign the mechanism stack or stop.

## 3. Design discriminating validation

- Define experimental arms:
  - Baseline matrix or network without the proposed modification.
  - Candidate variant with the proposed modification.
  - Mechanism-negative control lacking the proposed active feature.
  - Benchmark comparator from an established system, when available.
- Specify independent variables (composition, architecture, density, environment) and dependent variables (structural, network, mechanical, thermal, functional, durability).
- Define stop conditions before execution: safety or regulatory barriers, irreproducible preparation, or unfalsifiable design.
- **Decision gate:** If controls cannot isolate the proposed mechanism, redesign before proceeding.

## 4. Collect staged evidence

- **Structure first:** confirm identity, conversion, morphology, dispersion, and interface quality before interpreting bulk properties.
- **Network next:** verify crosslink density, homogeneity, and phase continuity.
- **Properties then:** measure mechanical, thermal, or transport responses.
- **Function and durability last:** evaluate cycling, environmental exposure, or adaptive behavior only after material-level validation.
- **Decision gate:** If structural or network evidence contradicts the hypothesis, stop and redesign; do not interpret downstream properties.

## 5. Attribute mechanisms and classify claims

- Map observations to mechanism layers using the control comparisons.
- Compare measured trends against simple models or benchmarks to reveal hidden factors such as defects, voids, or artifacts.
- Classify each claim as demonstrated, inferred, or speculative.
- **Decision gate:** If controls show the same effect as the proposed mechanism, classify the result as inconclusive and redesign.

## 6. Iterate, pivot, or terminate

- **Advance:** evidence supports the causal chain and trade-offs are acceptable; proceed to boundary testing or conditional application translation.
- **Modify:** evidence is partial; add discriminating measurements or adjust one mechanism layer.
- **Pivot:** evidence contradicts the main hypothesis; revise the mechanism stack or failure-mode assumptions.
- **Stop:** safety, reproducibility, or application-boundary criteria are violated.
- **Decision gate:** After each cycle, re-label evidence strength and decide whether to continue, redesign, pivot, or stop.

# Output Format

When using this skill, return:

1. **Research question** — one concise question tied to a material trade-off.
2. **Mechanism stack** — distinct, testable layers.
3. **Hypotheses** — for each: statement, evidence strength, key assumptions, likely failure modes, and minimal falsification test.
4. **Experimental design** — arms, variables, controls, metrics, and stop conditions.
5. **Analysis plan** — staged checks, mechanism attribution, model comparison, and claim classification.
6. **Iteration plan** — decision rules for continue, redesign, pivot, or stop.
7. **Validity and safety notes** — confounders, boundary conditions, and non-operational safety constraints.

# Validation Gates

- **Gap validity:** Is the problem a real materials gap or a restatement of a specific system?
- **Mechanism validity:** Does each layer have a distinct, testable role?
- **Control validity:** Are negative, positive, baseline, benchmark, and process controls included?
- **Confounding validity:** Could preparation artifacts, measurement geometry, moisture, or batch variability explain the result?
- **Reproducibility validity:** Are independent replicates and batch checks planned?
- **Extrapolation validity:** Are claims limited to the tested material family and conditions?

# Claim Boundaries

- Distinguish literature-supported mechanisms from new inferences for the user's system.
- Mark application-scale claims as conditional until durability, safety, and field-scale validation are addressed.
- Do not treat renewable origin or single-system success as proof of sustainability, safety, or field consensus.
- Separate interface-level or coupon-level evidence from product-level or assembly-level performance.

# Failure Modes

- **Structural failure:** Intended chemistry or morphology is not confirmed.
- **Network failure:** Incoherent network, incomplete conversion, or phase separation.
- **Control failure:** Negative or baseline controls show the same effect as the proposed mechanism.
- **Trade-off failure:** Improvement in one property destroys another essential property with no mitigation path.
- **Artifact failure:** Signal is dominated by contact resistance, thermal history, geometry, or environmental drift.
- **Reproducibility failure:** High batch-to-batch variability or inconsistent preparation.
- **Boundary failure:** Candidate cannot meet non-operational safety, regulatory, or environmental constraints.

# Validity Checks

Before finalizing any plan or interpretation:

- Does each claim have a mechanism-specific measurement?
- Are uncertainty, sample variability, and possible artifacts addressed?
- Are boundary conditions and stop conditions explicit?
- Are application claims limited by available evidence?
- Are safety and environmental issues handled non-operationally?
- Is evidence labeled as observed, inferred, extrapolated, or speculative?

# Provenance

Synthesized from cluster 29.0 (composite-thermoset-bio-vitrimer mechanism discovery and validation) and source skills: conductive-vitrimer-composite-research, bio-composite-insulation-research-design, bio-based-epoxy-amine-research-pattern, biomass-thermoset-network-design, composite-interface-transport-exploration, bio-based-thermoset-resin-exploration, reinforced-thermoset-interphase-exploration, thermoset-cure-process-window-research.
