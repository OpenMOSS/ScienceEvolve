---
name: sci-catalysis-asymmetric-catalysis-chiral-mechanism-dis-17c5a31f
description: A reusable end-to-end workflow for designing, validating, and iterating mechanism-driven hypotheses in asymmetric catalysis and chiral method development, from gap identification to bounded scope claims.
scienceevolve-title: "Asymmetric catalysis · asymmetric catalysis chiral mechanism discovery workflow"
scienceevolve-area: asymmetric-catalysis
---

## Purpose

Use this skill to transform a catalytic method-development idea into a structured, evidence-ranked research program. It guides an agent through identifying a transformation gap, formulating mechanism-linked hypotheses, designing interpretable validation experiments with disciplined controls, analyzing results to discriminate among competing pathways, and iterating until claims are explicitly bounded by evidence.

## When to use

Use this skill when the user needs to:

- Propose new research questions in asymmetric catalysis, chiral synthesis, or enantioselective method development.
- Design non-operational validation plans for catalyst, ligand, reagent, or substrate hypotheses.
- Convert literature-inspired reasoning into a transferable, mechanism-aware workflow.
- Evaluate whether a proposed catalytic platform extension is scientifically plausible before experimental commitment.

Do not use this skill for laboratory execution protocols, safety reviews, or clinical, therapeutic, or biological claims.

## Inputs required

Ask for or identify:

- Target transformation class and desired selectivity challenge (enantio-, diastereo-, regio-, or chemoselectivity).
- Prior-art landscape: established catalyst families, known limitations, and closest precedents.
- Proposed mechanism or design principle (e.g., ligand-controlled stereodifferentiation, substrate-directed activation, chiral environment organization).
- Candidate variable classes (catalyst/ligand architecture, substrate electronic/steric features, reagent/electrophile class, medium).
- Available analytical readouts for product identity, selectivity, and mechanistic probes.
- Constraints: evidence-strength requirements, material availability, safety context, and feasibility bounds.

## Core Workflow

### Stage 1: Frame the Gap and Mechanism Hypothesis
1. Define the selectivity bottleneck as a mechanistic conflict (e.g., competing insertion, background reactivity, isomerization).
2. Map prior art in layers: general reaction class, specific substrate class, and catalyst family. Distinguish established field consensus from single-study observations.
3. Formulate a mechanism-first hypothesis that links catalyst/ligand/substrate features to the desired pathway and identifies the main competing pathway.
4. **Decision Gate 1 (Hypothesis Falsifiability):** Can the hypothesis be rejected with available analytical readouts? If no, refine the hypothesis or stop.

### Stage 2: Design Minimal Viable Validation
1. Select a representative model substrate that exposes the central stereochemical challenge without unnecessary complexity.
2. Build a variable matrix that changes one conceptual class at a time (catalyst/ligand architecture, substrate electronic/steric class, reagent/electrophile class, medium).
3. Define mandatory controls:
   - **Negative:** omit the proposed chiral or activating element.
   - **Positive:** a known benchmark or validated comparator.
   - **Background:** absence of catalyst or metal.
   - **Orthogonality:** vary only one major variable to isolate its effect.
4. Predeclare primary metrics (selectivity, conversion/yield) and secondary metrics (reproducibility, robustness, mechanistic readouts).
5. **Decision Gate 2 (Control Adequacy):** Do controls isolate the claimed variable and detect background reactivity? If no, redesign controls before proceeding.

### Stage 3: Execute and Discriminate Observations
1. Run the minimal validation set and record product identity, selectivity, conversion, byproducts, and control outcomes.
2. Classify each result as supported, partially supported, contradicted, or inconclusive.
3. **Decision Gate 3 (Signal Integrity):** Does the positive control produce the expected outcome, and does the negative control differ meaningfully? If no, stop and resolve analytical or experimental ambiguity.

### Stage 4: Mechanistic Interpretation and Probe Design
1. Separate reactivity (conversion/yield) from selectivity (stereochemical outcome).
2. Map trends across the variable matrix to identify whether changes affect activity, selectivity, or both.
3. If selectivity is catalyst-dependent, design orthogonal mechanistic probes (e.g., isotope labeling, kinetic analysis, nonlinear effects, ligand-enantiopurity correlation, byproduct mapping).
4. **Decision Gate 4 (Mechanistic Convergence):** Do multiple independent probes converge on a consistent model? If no, weaken the mechanistic claim and design additional probes before scope expansion.

### Stage 5: Scope Expansion with Boundary Testing
1. Expand to substrate subclasses in tiers: electronic variation, steric variation, functional-group variation, and geometric/architectural variation.
2. Treat distinct substrate classes as separate branches if they may stress different mechanistic steps.
3. Record all failures and low-performing cases as boundary evidence.
4. **Decision Gate 5 (Generality Check):** Is the outcome reproducible across representative substrates with consistent analytical confidence? If no, narrow the claim to the validated subclass.

### Stage 6: Claim Bounding and Iteration
1. Synthesize evidence into ranked hypotheses with updated evidence strength (strong, moderate, weak, speculative).
2. Define explicit claim boundaries: substrate classes, catalyst families, and conditions where extrapolation is unsupported.
3. Choose the next action:
   - **Advance:** Expand to a harder substrate class or new reaction manifold.
   - **Redesign:** Modify the chiral environment, activation strategy, or substrate class based on mechanistic insight.
   - **Narrow:** Limit the claim to the validated scope and publish boundary conditions.
   - **Stop:** Abandon if the mechanism remains unresolved, controls are unreliable, or safety/ethics constraints are violated.
4. **Iteration Rule:** Return to Stage 2 with revised hypotheses whenever data suggest a competing pathway, the initial design unit fails, or subclass behavior diverges.

## Output Format

When using this skill, return:

1. **Research question and prior-art gap:** What is known, what is missing, and what must not be overgeneralized.
2. **Core hypothesis set:** Each hypothesis with evidence strength, key assumptions, competing pathways, and failure modes.
3. **Minimal validation plan:** Model substrate, variable matrix, control structure, primary/secondary metrics, and stop conditions.
4. **Mechanistic probe plan:** Orthogonal experiments to discriminate among competing pathways.
5. **Scope expansion strategy:** Tiered substrate subclasses and boundary-testing logic.
6. **Analysis plan:** Data normalization, trend mapping, evidence-level classification, and visualization strategy.
7. **Iteration rules:** Explicit criteria for advance, redesign, narrow, or stop decisions.
8. **Validity and safety notes:** Confounders, reproducibility requirements, boundary conditions, and non-operational safety constraints.

## Validation Gates

- **Control adequacy:** Positive, negative, background, and orthogonality controls must behave plausibly before interpreting results.
- **Analytical validity:** Product identity and selectivity must be confirmed before yield or scope claims are made.
- **Reproducibility:** Key observations require consistent repetition or must be explicitly flagged as unreplicated.
- **Mechanistic convergence:** Strong mechanistic claims require support from multiple independent probes; scope tables alone are insufficient.
- **Variable isolation:** Each comparison must change as few design features as possible to preserve interpretability.

## Claim Boundaries

- Distinguish paper-verified observations, plausible extensions supported by analogy, and speculative agent-generated hypotheses.
- Limit generality claims to tested substrate classes and catalyst families; do not infer field-wide consensus from a single system.
- Separate catalytic activity from stereochemical control—high yield does not prove a specific mechanism.
- Avoid sustainability, scalability, or practical utility claims without catalyst loading, robustness, waste, and reuse evidence.
- Treat failed substrates and boundary conditions as scientifically valid evidence that constrains the method's scope.

## Failure Modes

- Background reaction dominates over catalytic selectivity.
- Product forms but stereochemical control is absent or ambiguous.
- Controls fail (positive control inactive, negative control matches proposed system).
- Substrate instability, analytical ambiguity, or product racemization prevents interpretation.
- Competing pathways (isomerization, overreaction, decomposition) obscure the desired outcome.
- Catalyst inhibition, aggregation, or ligand displacement invalidates the proposed mechanism.
- Scope expansion reveals subclass-dependent behavior that contradicts the initial hypothesis.

## Validity Checks

- Are confounders documented (substrate purity, catalyst degradation, reagent quality, analytical calibration)?
- Is evidence clearly labeled by strength (strong, moderate, weak, speculative)?
- Are failed substrates and boundary conditions reported as part of the evidence base?
- Does the plan avoid overclaiming based on a single successful substrate class?
- Are mechanistic hypotheses labeled as models rather than proven mechanisms unless independently supported?
- Is the research plan non-operational and free of hazardous procedural details?

## Provenance

- Synthesized from cluster 22.1 (observable-driven mechanism discovery and validation).
- Source skills: asymmetric-catalysis-research-design (10.1002/anie.202117413), spo-palladium-c-h-functionalization-research (10.1021/ol200986x), chiral-phosphine-ligand-research-design (10.1038/s41467-023-40138-8), asymmetric-oxidation-research-design (10.1021/acs.orglett.3c01852), p-stereogenic-catalysis-research-design (10.1021/acs.orglett.5b00609), asymmetric-carbonylation-research-design (10.1002/anie.202105977), strained-ring-stereocontrolled-cascade-design (10.1021/jacs.5c17131), peg-supported-chiral-ptc-research-exploration (10.5012/bkcs.2004.25.3.347).
