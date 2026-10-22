---
name: sci-catalysis-asymmetric-catalysis-mechanism-discovery-b29c1429
description: A reusable end-to-end workflow for designing, validating, and iterating mechanism-driven hypotheses in asymmetric catalysis and stereoselective synthesis without operational protocols.
scienceevolve-title: "Asymmetric catalysis · asymmetric catalysis mechanism discovery workflow 8"
scienceevolve-area: asymmetric-catalysis
---

# Purpose

Use this workflow to transform a known stereoselective transformation limitation into a testable research program. It guides the generation of mechanistic hypotheses, non-operational experimental designs, evidence-driven analysis, and iterative refinement of catalyst-controlled selectivity claims. The workflow teaches transferable methodology for mechanism substitution, chiral information transfer, and pathway discrimination; it does not encode specific chemical systems, reagents, or paper conclusions as universal truth.

# When to use

Use this workflow when the user asks to:

- Propose new research questions in asymmetric catalysis, stereoselective synthesis, or chiral mechanism design.
- Replace a problematic catalyst, reagent, or step with a conceptually different mechanistic approach.
- Design non-operational validation plans with controls, metrics, and stop conditions.
- Interpret conversion, yield, enantioselectivity, diastereoselectivity, or product-stability data.
- Distinguish catalyst-controlled selectivity from background, substrate-controlled, or product-evolution effects.
- Iterate after incomplete proof-of-concept selectivity or conflicting mechanistic evidence.

Do not use this workflow for executable laboratory procedures, hazardous operational parameters, clinical recommendations, or claims that a single study establishes field-wide consensus.

# Inputs required

Before generating a plan, collect or infer:

- Target transformation class and desired selectivity type (enantio-, diastereo-, regio-, or pathway-selective).
- Limitation of the current approach (e.g., selectivity ceiling, instability, scope, mechanistic uncertainty).
- Known mechanistic role of the component to be replaced or optimized.
- Candidate catalyst or chiral discriminator concept and proposed association/activation mode.
- Substrate classes relevant to the new question.
- Available analytical readouts for product identity, conversion, yield, and stereochemical outcome.
- Safety, regulatory, and environmental constraints for the research setting.

If any required input is missing, state the assumption and mark downstream conclusions as conditional.

# Core Workflow

Execute the following stages in order. Treat each stage as a gate: do not advance until the preceding gate is satisfied or a stop condition is triggered.

## Stage 1: Reframe the gap as a mechanistic control problem

1. Identify the stereochemical bottleneck or competing pathways.
2. Separate the mechanistic role (activation, binding, shielding, organization) from the original chemical identity.
3. Define the desired outcome distribution and the alternative(s) to be suppressed.
4. State the minimum improvement needed to justify further development.

**Decision gate:** Proceed only if the gap can be expressed as "what controls which pathway or outcome forms?" rather than only "can the reaction work?"

## Stage 2: Generate ordered, falsifiable hypotheses

Produce hypotheses in this sequence:

1. **Gap hypothesis:** why the current approach is insufficient.
2. **Activation hypothesis:** how the proposed system generates a reactive intermediate or organizes reactants.
3. **Stereocontrol hypothesis:** how the chiral component biases the selectivity-determining step.
4. **Dynamic-stability / boundary hypothesis:** whether products evolve after formation and which substrate features preserve or disrupt the mechanism.
5. **Alternative-mechanism hypothesis:** the leading competing explanation and the observation that would distinguish it.

For each hypothesis, record:

- Evidence strength (strong, moderate, weak, speculative).
- Key assumption.
- Predicted observable.
- Likely failure mode.

## Stage 3: Design minimal non-operational validation

Define a representative model system and a small, interpretable matrix:

- **Representative substrate:** tests the intended mechanism without being an edge case.
- **Control plan:** include no-catalyst/background, achiral or mismatched catalyst, missing key component, and analytical controls.
- **Variable plan:** vary one catalyst-feature family or substrate axis at a time (e.g., scaffold geometry, steric environment, electronic class).
- **Metrics:** primary (selectivity ratio, pathway distribution, stereochemical purity) and secondary (conversion, yield, reproducibility).
- **Stop conditions:** predefined criteria to halt if background dominates, selectivity is indistinguishable from non-catalytic controls, or analytical confidence is insufficient.

**Decision gate:** Proceed to broader screening only if the minimal system shows catalyst-dependent selectivity above background and controls are informative.

## Stage 4: Execute conceptually and collect evidence

- Run the planned comparisons.
- Track both major and minor outcomes.
- Monitor time-course behavior where possible to separate formation from evolution.
- Record side-product profiles as mechanistic evidence.

## Stage 5: Analyze by separating evidence types

1. **Product formation:** confirm identity and distinguish from decomposition or side products.
2. **Selectivity attribution:** compare chiral vs. achiral/mismatched vs. no-catalyst conditions. Attribute selectivity changes only to the variable that changed.
3. **Mechanistic interpretation:** classify each result as diagnostic, supportive, or merely consistent. Map side products to off-cycle pathways.
4. **Boundary analysis:** group successes and failures by mechanistic features (electronics, sterics, geometry). Treat outliers as boundary data, not noise.
5. **Evidence classification:** label claims as demonstrated, inferred by analogy, or speculative.

**Iteration gate:**

- If selectivity is supported by controls → preserve core concept; proceed to Stage 6.
- If activity exists without selectivity → revise stereocontrol hypothesis; return to Stage 2 or 3.
- If background dominates → redesign activation or association strategy; return to Stage 2.
- If product evolution invalidates endpoint selectivity → add stability controls; revise dynamic hypothesis; return to Stage 3.
- If results contradict the model → generate alternative mechanism; design discriminating controls; return to Stage 3.

## Stage 6: Refine and expand scope with boundary tests

- Vary one design axis at a time (catalyst scaffold, ligand environment, substrate electronic/steric class).
- Include substrates expected to challenge the mechanism.
- Define the applicability domain based on consistent successes and clustered failures.
- Update hypothesis evidence strength after each round.

**Stop condition:** Halt scope expansion if failures cluster around a specific mechanistic feature; treat that feature as a boundary condition rather than an optimization target.

## Stage 7: Formulate bounded claims and document provenance

- State the mechanism model, its supporting evidence, and its limits.
- Distinguish paper-supported precedent from system-specific inference.
- List confounders, reproducibility checks, and safety constraints.
- Archive the reasoning chain for auditability.

# Output Format

Return results in this structure:

1. **Research question and gap** — target transformation, limitation, mechanistic role to control.
2. **Hypothesis set** — ordered hypotheses with evidence strength, assumptions, predicted observables, and failure modes.
3. **Minimal validation plan** — model system, controls, variables, metrics, and stop conditions.
4. **Analysis and interpretation plan** — how to attribute selectivity to the chiral component, use substrate trends, and handle product evolution.
5. **Iteration rules** — actions for success (preserve/modify), partial success (redesign scaffold/partner), and failure (abandon/reframe).
6. **Validity and boundary statement** — confounders, extrapolation limits, evidence classification, and safety/compliance boundaries.

# Validation Gates

Before advancing past Stage 3 or presenting conclusions, verify:

- **Mechanistic clarity:** The replaced or optimized component's role is separated from its chemical identity.
- **Control adequacy:** Controls distinguish catalytic selectivity from background, substrate bias, or additive effects.
- **Selectivity attribution:** Stereochemical enrichment is tied to the chiral component rather than substrate control.
- **Analytical validity:** Product identity and stereochemical measurements are supported by appropriate methods.
- **Dynamic stability:** Endpoint selectivity is consistent with early-time selectivity, or product evolution is explicitly modeled.
- **Reproducibility:** Representative cases are repeated or planned for repetition with variability reported.
- **Statistical validity:** Meaningful differences exceed measurement uncertainty; screening bias is acknowledged.
- **Boundary honesty:** Substrate classes, solvent classes, and mechanistic assumptions are explicitly bounded.

# Claim Boundaries

- Do not treat a single paper result or substrate set as field-wide consensus.
- Do not generalize from a model substrate to broad scope without testing representative failures.
- Do not equate high conversion with catalyst-controlled selectivity.
- Do not infer clinical, therapeutic, or device-level utility from synthetic stereoselectivity alone.
- Mark mechanistic claims based on indirect evidence as provisional.
- Distinguish demonstrated results, mechanism-supported inferences, and agent-inferred speculation.

# Failure Modes

- **Background dominance:** Product formation is indistinguishable between catalytic and non-catalytic conditions.
- **Nonselective activation:** The catalyst improves conversion but not stereochemical outcome.
- **Substrate override:** Electronics or sterics dominate over catalyst geometry, making selectivity substrate-controlled.
- **Product evolution:** Endpoint ratios reflect post-formation equilibration, decomposition, or epimerization rather than catalytic selectivity.
- **Analytical ambiguity:** Inability to resolve stereoisomers or confirm identity leads to false selectivity claims.
- **Confounded variables:** Changing multiple design axes simultaneously prevents mechanistic attribution.
- **Narrow scope:** Success is limited to a single substrate class and fails to reveal a general principle.
- **Safety/compliance barrier:** The concept cannot meet non-operational risk boundaries or institutional review requirements.

# Validity Checks

- Are yield and selectivity interpreted separately?
- Are failed substrates and ambiguous results included in the conclusion?
- Are ligand/additive/medium effects separable from scaffold effects?
- Is at least one representative stereochemical assignment securely anchored by orthogonal evidence?
- Are outliers preserved as boundary data rather than discarded?
- Does the plan avoid presenting operational recipes, hazardous parameters, or executable procedures?
- Are paper-supported findings distinguished from new inferences?

# Provenance

This workflow was synthesized from cluster 12 (subcluster 12.0), an asymmetric catalysis skill cluster focused on observable-driven mechanism discovery and validation. Source skills that informed this merge include:

- `chiral-relay-catalysis-research` (10.1039_cc9960000191)
- `asymmetric-sulfone-catalysis-research-design` (10.3762_bjoc.15.127)
- `chiral-ion-pair-catalyst-exploration` (10.1021_jacs.1c05206)
- `palladium-pincer-stereogenic-phosphine-exploration` (10.1039_c4qo00052d)
- `li-s-multifunctional-binder-research` (10.1021_acsami.1c16650)
- `asymmetric-oxidation-method-discovery` (10.1016_j.tet.2013.12.086)
- `regiodivergent-catalyst-substrate-design` (10.1021_jacs.5b10524)
- `chiral-phosphorus-kinetic-resolution-research` (10.1016_s0040-4039_01_01694-x)

Specific chemical systems, reagents, and numerical results from these sources were abstracted away to produce a domain-agnostic workflow.
