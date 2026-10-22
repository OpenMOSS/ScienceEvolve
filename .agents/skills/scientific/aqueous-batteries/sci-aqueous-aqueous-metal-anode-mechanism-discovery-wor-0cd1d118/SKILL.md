---
name: sci-aqueous-aqueous-metal-anode-mechanism-discovery-wor-0cd1d118
description: Reusable end-to-end workflow for generating hypotheses, designing controlled validations, and iterating on interfacial mechanism claims in aqueous metal-anode batteries.
scienceevolve-title: "Aqueous battery interfaces · aqueous metal anode mechanism discovery workflow"
scienceevolve-area: aqueous-battery-interfaces
---

## Purpose

Guide agents in designing reusable, mechanism-first research plans for aqueous metal-anode battery systems where instability originates from coupled chemical, interfacial, transport, and morphological failures. The workflow converts observable degradation into falsifiable hypotheses, minimum viable validation designs, and layered evidence analysis without reproducing any single paper’s specific materials or conclusions.

## When to use

Use this skill when the user asks to:

- Propose new electrolyte, additive, separator, or interphase strategies for aqueous metal anodes.
- Explore coupled failure modes such as dendritic growth, corrosion, hydrogen evolution, passivation, or irreversible deposition.
- Convert a performance bottleneck into a multi-scale hypothesis chain with orthogonal controls.
- Plan iterative validation that links interfacial mechanism evidence to electrochemical performance.
- Critique whether an observed improvement is mechanistically supported or merely empirical.

Do not use this skill for operational experimental protocols, hazardous material handling instructions, or as a substitute for institutional safety review.

## Inputs required

Before producing a plan, request or infer:

- Target metal-anode chemistry and cell configuration (e.g., symmetric, half-cell, full-cell).
- Dominant failure mode or bottleneck (e.g., nonuniform deposition, side reactions, poor reversibility).
- Candidate design lever class (e.g., electrolyte additive, solvation modifier, interfacial layer, separator architecture).
- Available diagnostic layers (e.g., electrochemistry, spectroscopy, microscopy, transport measurements, modeling).
- Baseline system for comparison and known confounders.
- Success criteria and constraints (safety, reproducibility, compatibility, sustainability).

## Core Workflow

1. **Interfacial Failure Mapping** — Reframe the bottleneck as a coupled interfacial instability across chemical, interfacial, transport, morphological, and cell-level links. Avoid starting from a material recipe or a single metric.  
   *Gate:* If the failure mode cannot be expressed as an interfacial coupling, stop and reframe.

2. **Competing Hypothesis Generation** — Produce at least three falsifiable hypotheses that connect a design variable to failure-mode reduction through a causal mechanism chain. For each, specify: concise mechanism statement, evidence strength (strong / moderate / weak / speculative), key assumptions, predicted measurable signatures, and likely failure modes.  
   *Gate:* If hypotheses lack a falsifiable discriminator or all rely on untested analogy, return to step 1.

3. **Minimum Viable Validation (MVV) Design** — Define independent variables, dependent variables, and a control matrix: baseline, negative control, mechanism-weakened control (structural or functional ablation), and benchmark control when justified. Ensure the control matrix can separate mechanism from bulk-property artifacts (conductivity, viscosity, pH, mass, thickness, wetting).  
   *Gate:* If the design cannot isolate the proposed mechanism from confounders, redesign controls before proceeding.

4. **Layered Evidence Collection & Analysis** — Analyze in ordered layers: (a) chemical / solution environment, (b) interface / interphase composition and stability, (c) transport / kinetics, (d) deposition morphology, (e) electrochemical reversibility, (f) full-cell / system relevance. After each layer, update a mechanism-to-metric map marking each causal link as directly measured, indirectly inferred, or unsupported.  
   *Gate:* If two consecutive layers contradict the hypothesis, trigger iteration.

5. **Mechanism–Performance Convergence Check** — Compare performance gains against mechanism evidence.  
   *Decision:* If performance improves without mechanism evidence, label the result as empirical, prioritize additional orthogonal diagnostics, and loop to step 4. If mechanism evidence is strong but performance is unchanged, revise the design lever or boundary conditions and loop to step 3.

6. **Iteration or Termination** — Select one of four actions: (a) continue to scaled validation, (b) revise the mechanism hypothesis, (c) add stronger controls, or (d) stop because the mechanism is unsupported, unsafe, or irreproducible.  
   *Stop conditions:* mechanism signature absent under matched controls; improvement disappears in negative controls; safety or ethics boundary exceeded; results are irreproducible across replicates; full-cell relevance is claimed without cathode-compatibility evidence.

## Output Format

When using this skill, produce:

1. **Research question** — One sentence framing the bottleneck as a coupled interfacial mechanism.
2. **Failure map** — Chemical, interfacial, transport, morphology, and cell-level links.
3. **Hypothesis set** — At least three hypotheses with evidence strength, assumptions, predicted signatures, and failure modes.
4. **Validation design** — MVV with variables, control matrix, metrics per layer, and stop conditions.
5. **Analysis plan** — Mechanism-to-metric map, layer-by-layer interpretation rules, and convergence criteria.
6. **Iteration rules** — Decision tree for supportive, ambiguous, or contradictory results.
7. **Validity and safety summary** — Confounders, reproducibility requirements, boundary conditions, and non-operational safety constraints.
8. **Confidence statement** — Separation of directly supported findings, inferred mechanisms, and speculative extensions.

## Validation Gates

- **Failure-mode gate:** The problem must be framed as an interfacial coupling, not a material name or a performance target.
- **Hypothesis gate:** Every hypothesis must include a falsifiable prediction and a mechanism-weakened control.
- **Isolation gate:** The experimental design must be able to distinguish the proposed mechanism from bulk-property changes and assembly artifacts.
- **Convergence gate:** Claims require agreement between at least two independent evidence classes (e.g., spectroscopic + electrochemical, or morphological + transport).
- **Hierarchy gate:** Half-cell claims must not be presented as full-cell conclusions without paired-electrode compatibility evidence.
- **Termination gate:** Predefined stop conditions for absent mechanism signatures, control failures, safety concerns, or irreproducibility.

## Claim Boundaries

- Distinguish observations made in the tested system from extrapolations to other metals, electrolytes, cell formats, or operating regimes.
- Separate half-cell plating/stripping evidence from full-cell stability claims.
- Label performance improvements as empirical until supported by orthogonal mechanism diagnostics.
- Do not present single-paper patterns as field-wide consensus.
- Avoid claiming commercial readiness, environmental safety, or deployment viability from laboratory-scale mechanism studies.

## Failure Modes

- **Confounded improvement:** Performance gains arise from conductivity, viscosity, pH, mass loading, thickness, wetting, or assembly differences rather than the proposed interfacial mechanism.
- **Missing mechanism signature:** Electrochemical metrics improve while interfacial, morphological, or transport evidence remains unchanged or contradictory.
- **Control collapse:** The mechanism-weakened control performs similarly to the candidate, undermining specificity claims.
- **Scale mismatch:** Anode-side improvements fail to translate because cathode compatibility, separator effects, or electrolyte depletion were not tested.
- **Irreproducibility:** Results vary across replicates due to uncontrolled surface state, impurity levels, or batch variation.
- **Premature termination:** Stopping after a single positive metric without checking for side reactions, impedance growth, or long-term morphology collapse.

## Validity Checks

Before finalizing a plan or presenting conclusions, verify:

- Baseline and test conditions are matched for electrode pretreatment, surface area, electrolyte volume, separator, and assembly sequence.
- Positive, negative, reduced, and mechanism-specific controls are included where relevant.
- Evidence spans more than a single electrochemical trace or image.
- Morphology assessments are quantitative or replicated, not based on selected images.
- Uncertainty and variability are reported for key comparisons.
- Literature comparisons are normalized by metric, cell architecture, and operating severity.
- Alternative explanations (conductivity, viscosity, impurities, pH drift, assembly variability) are considered.
- Boundary conditions are stated for electrolyte, metal, cathode, separator, and operating regime.
- Failed cells, negative results, and safety-relevant observations are reported transparently.

## Provenance

- Synthesized from cluster 62 / subcluster 62.0: observable-driven mechanism discovery and validation.
- Source skills: aqueous-zinc-battery-interface-regulation-research (e2357f2317f203e8), separator-water-regulation-research (e539a05b35237d4f), interface-engineered-hydrogel-electrolyte-discovery (9b133feb06b01f5a), bioinspired-interface-electrolyte-design (b8a9ed32f18f3371), electrolyte-interface-metal-anode-research (fb4902f9d75c2a4c), azib-interface-self-assembly-exploration (c21cf1fa2e6c49d0), aqueous-zinc-manganese-electrolyte-exploration (4ec7bc8102e542c5).
