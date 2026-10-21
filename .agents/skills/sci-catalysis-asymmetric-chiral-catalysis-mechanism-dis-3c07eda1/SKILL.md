---
name: sci-catalysis-asymmetric-chiral-catalysis-mechanism-dis-3c07eda1
description: A reusable end-to-end workflow for designing, validating, and iterating mechanism-centered research plans in asymmetric and chiral catalysis without system-specific recipes.
scienceevolve-title: "Asymmetric catalysis · asymmetric chiral catalysis mechanism discovery workflow 3"
scienceevolve-area: asymmetric-catalysis
---

## Purpose

Use this skill to turn a difficult stereoselectivity or reactivity challenge into a mechanism-driven research plan. The workflow guides an agent to generate falsifiable hypotheses, design discriminating experiments with strong controls, analyze mechanistic and stereochemical evidence, and iterate based on observable outcomes—without copying any single paper’s system-specific details.

## When to use

Use this skill when the user asks for new research directions, hypothesis generation, or experimental design in asymmetric catalysis, chiral organocatalysis, transition-metal catalysis, stereodivergent synthesis, or catalyst-controlled stereocontrol. It is designed for planning and validation logic, not for executing known laboratory procedures.

## Inputs required

- Target transformation class and the stereochemical element to be controlled.
- Candidate substrate class and rationale for accessibility or strategic value.
- Proposed activation mode or reactive intermediate class.
- Candidate catalyst or ligand features that could organize the intermediate.
- Known literature baselines and competing pathways.
- Available analytical capabilities for structure, selectivity, and reproducibility.
- Safety, regulatory, and waste-management constraints at a high level.
- Desired deliverable: research question, hypothesis portfolio, validation plan, or iteration roadmap.

## Core Workflow

1. **Abstract the Selectivity Challenge**
   - State the bond-forming objective and the stereochemical objective separately from yield or conversion.
   - Identify why existing routes are limited (e.g., reactivity, selectivity, scope, mechanistic ambiguity).
   - *Decision Gate:* Proceed only if the challenge can be framed as a catalyst-controlled stereochemical event with a testable mechanistic bottleneck.

2. **Generate Mechanism-Centered Hypotheses**
   - Formulate ranked hypotheses about catalyst control, intermediate stabilization, stereochemical environment, cascade sequence, or cooperative activation.
   - For each hypothesis, specify: concise claim, evidence strength (strong/moderate/weak/speculative), key assumptions, predicted observable signatures, likely failure modes, and boundary conditions.
   - *Decision Gate:* Discard any hypothesis that cannot be falsified by a minimal experiment or that depends on untested paper-specific parameters.

3. **Design Minimal Viable Validation**
   - Select one diagnostic substrate or reaction pair expected to form the proposed intermediate.
   - Define independent variables (catalyst/ligand class, substrate class, medium/additive class) and dependent variables (conversion, chemo-/regio-/stereoselectivity, product stability).
   - Construct a control hierarchy:
     - Background/achiral catalyst control.
     - Component-omission control.
     - Mechanistic probe or isotopic control.
     - Boundary substrate control.
     - Positive benchmark control.
   - *Decision Gate:* Stop and redesign if the plan lacks a falsifying control, if too many variables change at once, or if it requires operational hazardous detail.

4. **Execute Diagnostic Screen & Collect Evidence**
   - Collect conversion, selectivity, reproducibility across independent runs, and orthogonal structural evidence.
   - Confirm product identity and stereochemical assignment before interpreting selectivity.
   - *Decision Gate:* If analytical ambiguity or irreproducibility persists, halt and resolve measurement integrity before mechanism assignment.

5. **Discriminate Mechanisms**
   - Compare the full system against all controls using a control table that maps each control to a competing pathway.
   - Classify outcomes: supports hypothesis, weakens hypothesis, boundary result, ambiguous, or artifact risk.
   - Separate true catalyst control from substrate bias, background reaction, direct chirality transfer, dynamic resolution, or product equilibration.
   - *Decision Gate:* If no mechanism is distinguishable from alternatives, return to Step 2 to reformulate hypotheses or Step 3 to add discriminating controls.

6. **Iterate or Pivot**
   - **If supported:** Test necessity and sufficiency of the proposed feature, then cautiously expand to a small substrate panel.
   - **If contradicted:** Formulate an alternative mechanistic pathway and design the next experiment to discriminate between models.
   - **If ambiguous:** Reduce the variable matrix and add orthogonal controls.
   - *Stop Conditions:* No product formation under diagnostic conditions; product formation without stereochemical differentiation; selectivity independent of the chiral catalyst; product/intermediate instability prevents interpretation; dominant side reactions obscure the pathway; analytical methods cannot assign the outcome; safety or compliance barriers.

7. **Map Boundaries & Archive Constraints**
   - Document substrate classes, catalyst features, and conditions where the mechanism weakens or fails.
   - Distinguish demonstrated behavior from extrapolated inference.
   - *Decision Gate:* Promote a claim only when multiple orthogonal controls converge; otherwise archive as a boundary case.

## Output Format

When using this skill, return:

1. `Research question`: The precise mechanism-centered question being explored.
2. `Gap analysis`: Prior-work axes, missing combination, and scientific rationale.
3. `Hypotheses`: Each with evidence strength, key assumptions, mechanism, predicted signatures, failure modes, and boundary.
4. `Minimal validation plan`: Diagnostic substrate/catalyst/reaction-partner logic, control hierarchy, metrics, and stop conditions.
5. `Scope and analysis plan`: Variable matrix, structural/stereochemical assignment strategy, and visualization needs.
6. `Iteration plan`: How results update the mechanism and what evidence triggers stopping or pivoting.
7. `Validity and safety check`: Confounders, reproducibility requirements, extrapolation limits, and non-operational safety boundaries.

## Validation Gates

- **Falsifiability Gate:** Every hypothesis must include a minimum falsification test before experimentation.
- **Control Adequacy Gate:** The plan must include background, component-omission, mechanistic, boundary, and positive controls.
- **Analytical Rigor Gate:** Product identity and stereochemical assignment must be supported by orthogonal or validated methods.
- **Mechanistic Discrimination Gate:** At least one experiment must distinguish the proposed pathway from each major competing pathway.
- **Reproducibility Gate:** Key claims require independent replication with reported variability and uncertainty.
- **Safety/Compliance Gate:** Outputs must remain at the research-design level; no executable hazardous protocols or operational parameters are provided.

## Claim Boundaries

- Do not treat a single successful catalytic system as field-wide consensus.
- Clearly separate paper-derived methodological inspiration from new-system inference.
- Do not extrapolate beyond tested substrate classes, catalyst architectures, or reaction conditions.
- Label all claims as observed, inferred, or speculative.
- Do not make clinical, toxicological, industrial scalability, or biological efficacy claims from synthetic accessibility or selectivity alone.

## Failure Modes

- **Scientific:** No intermediate formation; competing background or additive-only pathway; catalyst sequestration or deactivation; rapid product racemization or rearrangement; dominant side reaction; selectivity independent of chiral catalyst; substrate-specific artifact.
- **Workflow:** Hypothesis is not falsifiable; controls are ambiguous or confounded; mechanism remains underdetermined despite diagnostic tests; scope is expanded before mechanism credibility is established; over-interpretation of a single unreplicated observation.

## Validity Checks

- Separate catalyst effects from substrate, solvent, additive, impurity, and analytical artifacts.
- Label evidence as directly observed, supported by prior literature, or agent-inferred.
- Require appropriate replicate counts, uncertainty estimates, and pre-defined primary metrics.
- State explicit boundary conditions for substrate classes, catalyst features, activation modes, and analytical methods.
- Avoid claiming universal catalyst-design rules from a limited validation set.
- Ensure mechanistic explanations account for negative results and control failures, not only successful cases.

## Provenance

- Synthesized from cluster `17`, subcluster `17.1` (asymmetric-chiral-catalysis-catalyst-mechanism-discovery).
- Source skills: `chiral-organocatalysis-research-design` (10.1038_s41467-017-00251-x), `transient-organometallic-cascade-research-design` (10.1002_anie.202315438), `stereodivergent-phosphoryl-transfer-research` (10.1126_science.abf2213), `organophosphorus-dehydrocoupling-research-design` (10.1039_c4cc09567g), `chiral-ligand-catalyst-design` (10.1016_j.tetasy.2004.05.046), `asymmetric-catalysis-catalyst-transfer-workflow` (10.1016_j.tet.2018.11.052), `multifunctional-chiral-organocatalyst-exploration` (10.1021_ar900271g), `pyridine-azacycle-research-workflow` (10.1021_jacs.5b09209).
