---
name: sci-dft-catalytic-mechanism-discovery-validation-workfl-8000eb42
description: A reusable end-to-end workflow for generating mechanism-grounded hypotheses, designing minimal validation studies with strong controls, and iterating catalytic research plans based on structured evidence evaluation.
scienceevolve-title: "Organometallic catalysis and DFT · catalytic mechanism discovery validation workflow"
scienceevolve-area: organometallic-catalysis-and-dft
---

# Purpose

Guide an agent to transform a catalytic methodology gap into a testable mechanistic hypothesis, design a minimal validation plan with discriminating controls, analyze results as evidence for or against the proposed mechanism, and iterate until the hypothesis is supported, refined, or rejected. This workflow is non-operational: it produces research logic and decision frameworks, not executable laboratory recipes.

# When to use

- When proposing new research questions in catalytic functionalization, cross-coupling, cycloaddition, C–H activation, or late-stage modification.
- When the task is to generate hypotheses, experimental design logic, and iteration rules rather than operational protocols.
- When a literature precedent suggests a catalytic intermediate or activation mode that could be extended, redirected, or validated in a new context.
- When the user needs to distinguish evidence-supported observations from inferred extrapolations and speculative extensions.

# Inputs required

- Target transformation class and the synthetic or mechanistic bottleneck it addresses.
- Candidate substrate and partner classes with relevant electronic, steric, and coordination descriptors.
- Known or hypothesized catalytic cycle: activation, key intermediate(s), product release, and likely side pathways.
- Available analytical readouts for product identity, selectivity, conversion, and side-product profile.
- Prior literature context, including demonstrated precedents, known failure modes, and boundary conditions.
- Safety and feasibility constraints for the chemistry domain.

# Core Workflow

1. **Frame the mechanistic gap.**  
   Define the application-relevant bottleneck and locate the methodological gap. Identify the smallest mechanistic uncertainty that, if resolved, would change the design direction.  
   *Gate: If the gap cannot be linked to a specific catalytic step (activation, intermediate interception, selectivity, or turnover), stop and refine the question.*

2. **Map the catalytic landscape.**  
   Sketch the minimal plausible catalytic cycle including substrate activation, key intermediate(s), product release, and catalyst regeneration. Enumerate competing pathways such as background reaction, decomposition, alternative coordination, and off-cycle resting states.  
   *Gate: If no plausible mechanism can be formulated from literature analogies, label the idea speculative and require a broader literature survey before proceeding.*

3. **Generate ranked hypotheses.**  
   Produce a hypothesis set covering activation mode, intermediate identity, selectivity control, cycle completion, and boundary conditions. For each, annotate evidence strength (high / medium / low), key assumptions, predicted observations, likely failure modes, and a discriminating test. Rank by mechanistic plausibility and testability.  
   *Gate: If no hypothesis has a feasible discriminating test, stop and redefine the variable space.*

4. **Design minimal viable validation.**  
   Select a representative model system that directly probes the highest-ranked hypothesis. Define a variable matrix (catalyst/ligand class, substrate descriptors, partner/reagent class, environment class) and a control suite: positive control (validates assay), negative control (disables the proposed mechanism), strong mechanistic control (distinguishes the closest alternative), and analytical control (confirms identity). Predefine success metrics, failure metrics, and stop conditions before any conceptual execution.  
   *Gate: If the proposed validation cannot distinguish the lead hypothesis from its strongest alternative, redesign the control set.*

5. **Evaluate evidence and analyze results.**  
   Verify product identity and analytical integrity first. Compare outcomes against all controls. Cluster results by substrate and partner descriptors. Model side products as indicators of competing pathways. Quantify uncertainty and reproducibility. Separate observations from mechanistic interpretations.  
   *Decision: If controls fail or identity is ambiguous, halt scope expansion and resolve analytical or confounding issues before iterating.*

6. **Update or reject hypotheses.**  
   Strengthen hypotheses if predictions match discriminating observations across multiple cases. Narrow hypotheses if success depends on a specific substrate or catalyst feature. Replace hypotheses if controls show the proposed mechanism is not required. Convert repeated failures into explicit boundary conditions.  
   *Iteration trigger: Return to Step 3 or 4 with revised hypotheses and a new minimal test.*

7. **Assess boundary and transferability.**  
   Define the outer limits of the mechanistic claim: which substrate classes, catalyst families, and transformation types are supported versus extrapolated. Distinguish validated findings from inferred extensions.  
   *Stop condition: Stop iterating when the mechanism explains both successes and failures within the tested domain, or when further iteration would require unjustified scale-up or uncontrolled hazardous conditions.*

# Output Format

1. **Research question and gap statement** — concise framing of the bottleneck and why it matters.
2. **Mechanistic rationale** — hypothesized catalytic cycle, activation logic, and expected selectivity source.
3. **Ranked hypothesis table** — hypothesis, evidence strength, key assumptions, predicted observations, likely failure modes, and discriminating test.
4. **Minimal validation design** — model system logic, variable matrix, control suite, evaluation metrics, and stop conditions.
5. **Analysis plan** — identity verification, control comparison, descriptor clustering, side-product interpretation, and uncertainty reporting.
6. **Iteration plan** — decision rules for updating, narrowing, or rejecting hypotheses based on positive, mixed, or negative outcomes.
7. **Validity and safety notes** — confounders, reproducibility checks, boundary conditions, and non-operational safety constraints.

# Validation Gates

- **Mechanistic consistency:** Every design variable must map to a plausible step in the catalytic cycle or a known deactivation pathway.
- **Control adequacy:** The control suite must isolate the proposed activation, intermediate, or selectivity effect from background, analytical artifacts, and substrate bias.
- **Analytical validity:** Product identity, selectivity, and mass balance must be confirmed before mechanistic interpretation.
- **Reproducibility:** Key claims require independent repetition or uncertainty estimates; single observations are insufficient for generality.
- **Scope validity:** Substrate and catalyst scope claims must be limited to tested descriptor classes.

# Claim Boundaries

- Distinguish directly observed results from mechanistic inferences and speculative extrapolations.
- Treat the source literature as one evidence point, not domain-wide consensus.
- Limit generality claims to the substrate descriptors, catalyst classes, and reaction conditions explicitly tested.
- Do not equate a successful model reaction with readiness for scale-up, manufacturing, or clinical application.

# Failure Modes

- **Mechanism misattribution:** Product formation occurs through a background or alternative pathway that the controls fail to catch.
- **Overfitting to narrow scope:** A hypothesis is retained because it explains one substrate class but fails for all others.
- **Analytical artifact:** Apparent selectivity or conversion arises from misassignment, coelution, or decomposition.
- **Irreproducible signal:** Results depend on uncontrolled impurities, batch variation, or uncharacterized catalyst speciation.
- **Premature scope expansion:** Mechanistic claims are broadened before negative results, boundary substrates, or alternative mechanisms are adequately tested.

# Validity Checks

- **Confounding factors:** Substrate purity, reagent stability, catalyst decomposition, moisture or air sensitivity, competing coordination, and impurity-driven reactivity.
- **Statistical validity:** Predefined endpoints, adequate descriptor coverage, transparent exclusion criteria, and avoidance of cherry-picked examples.
- **Boundary conditions:** Explicit statement of substrate classes, functional groups, and catalyst families not yet tested.
- **Evidence hierarchy:** Label each claim as directly observed, inferred from close analogues, or speculative.
- **Safety review:** All proposed chemistry requires institutional hazard assessment and appropriate oversight before execution; outputs remain non-operational.

# Provenance

- Synthesized from cluster 15.1 ("end-to-end mechanism discovery and validation").
- Source skills: test1206, test1482, test1468, test1801, test1874, test0274, test1084, test1719.
- Preserves the shared workflow route: gap framing → mechanistic mapping → hypothesis generation → minimal validation → evidence analysis → iterative refinement → boundary setting.
