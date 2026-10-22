---
name: sci-catalysis-asymmetric-chiral-catalysis-mechanism-dis-735f36a0
description: A reusable end-to-end workflow for proposing, validating, and iterating mechanism-grounded hypotheses in asymmetric and chiral catalysis research without reproducing paper-specific conditions.
scienceevolve-title: "Asymmetric catalysis · asymmetric chiral catalysis mechanism discovery workflow 4"
scienceevolve-area: asymmetric-catalysis
---

# Purpose

Help an agent transform literature-inspired mechanistic insights into a transferable research-design workflow for asymmetric and chiral catalysis. The skill guides hypothesis generation, minimal validation planning, controlled experimentation design, mechanistic interpretation, and iterative refinement while treating any single source as precedent rather than consensus.

# When to use

Use this skill when the user asks to:
- Propose new research questions in asymmetric catalysis, stereoselective synthesis, or chiral scaffold construction.
- Design non-operational validation plans for stereocontrolled bond-forming methods.
- Generate mechanism-grounded hypotheses and discriminating experiments.
- Interpret selectivity, scope, or failure data to update mechanistic models.
- Map boundaries and claim limits for catalytic transformations involving stereogenic centers.

Do not use this skill for clinical recommendations, executable laboratory protocols, hazardous operational details, or scale-up instructions.

# Inputs required

Ask the user or environment to provide:
- Target stereochemical problem or synthetic gap (e.g., enantio-, diastereo-, regioselectivity challenge).
- Candidate catalytic activation modes and chiral control elements described conceptually.
- Substrate and coupling-partner classes with relevant steric, electronic, or conformational features.
- Prior results, failed cases, or literature precedents if available.
- Available analytical capabilities for identity, conversion, and stereochemical assignment.
- Safety, regulatory, and facility constraints.
- Intended claim level (exploratory hypothesis, method proposal, or mechanistic validation).

If key information is missing, state assumptions explicitly and mark conclusions as provisional.

# Core Workflow

Execute the following ordered stages. At each decision gate, stop or loop back if the criterion is not met.

1. **Gap Definition & Mechanistic Framing**
   - Define the stereochemical bottleneck and the specific bond-forming or stereogenic event to be controlled.
   - Identify the stereodetermining step and map catalyst, substrate, and medium variables to it.
   - **Decision Gate 1 — Scope Relevance:** Stop if no plausible catalytic stereocontrol mechanism can be articulated for the target class.

2. **Hypothesis Generation & Ranking**
   - Produce mechanism-level hypotheses (e.g., selectivity-control, intermediate, compatibility, boundary).
   - For each, state evidence strength, key assumptions, predicted observations, failure modes, and applicability boundaries.
   - Rank by falsifiability and information value; retain at least one alternative that does not depend on the preferred mechanism.
   - **Decision Gate 2 — Hypothesis Rigor:** Stop if every hypothesis relies on the same unsupported assumption or if none is empirically discriminable.

3. **Minimal Validation Design**
   - Select a single representative model system that isolates the central stereochemical challenge.
   - Define independent variables by mechanistic role (catalyst class, chiral source, substrate electronics/sterics, medium).
   - Define dependent variables (conversion, stereoselectivity, regioselectivity, identity, side-product profile).
   - Design layered controls: background/blank, omission, achiral/racemic, enantiomeric or mismatched, substrate-blocked, mechanistic probe, and positive benchmark if available.
   - Preset success, continuation, and stop criteria before any conceptual execution.
   - **Decision Gate 3 — Control Adequacy:** Stop if negative or mechanistic controls are missing or if the plan depends on source-specific operational parameters.

4. **Data Collection & Integrity Check**
   - Record conversion, crude and purified selectivity, mass balance, and analytical methods.
   - **Decision Gate 4 — Data Integrity:** Halt mechanistic interpretation if product identity is ambiguous, mass balance is unexplained, or stereochemical assignment lacks independent support.

5. **Mechanism-Driven Analysis**
   - Attribute activity and selectivity to the proposed chiral environment by comparing against controls.
   - Map structure-selectivity relationships across electronic, steric, and conformational axes.
   - Distinguish systematic trends from isolated examples.
   - Use language proportional to evidence ("consistent with" unless orthogonal probes converge).
   - **Decision Gate 5 — Mechanistic Convergence:** If controls contradict the hypothesis or multiple mechanisms fit equally, return to Stage 2.

6. **Iteration or Redesign**
   - Classify the outcome: (a) feasible and selective, (b) feasible but non-selective, (c) selective but narrow, (d) mechanistically ambiguous, (e) non-feasible.
   - Map to a bottleneck: intermediate access, chiral discrimination, competing pathway, catalyst incompatibility, intermediate instability, or analytical artifact.
   - Choose one intervention at a time: redesign chiral environment, probe intermediate stability, refine substrate class, or narrow the claim boundary.
   - Update the hypothesis table with revised evidence strengths and boundaries.
   - **Iteration Gate:** Return to Stage 2 or 3 unless the core hypothesis survives discriminating tests; otherwise proceed to Stage 7.

7. **Scope & Boundary Mapping**
   - Expand to representative substrate and partner classes only after core validation.
   - Explicitly include difficult cases to define failure boundaries.
   - Classify failures by steric, electronic, stability, or compatibility causes.
   - **Decision Gate 6 — Generality Check:** Stop scope expansion if the model system lacks credible identity, selectivity, and control data.

8. **Platform/Utility Validation (Optional)**
   - If claiming downstream value, demonstrate stereospecific transformation with chirality-retention controls.
   - Treat success as evidence of potential, not proof of universal applicability.
   - **Decision Gate 7 — Utility Gate:** Do not claim platform value from a single product or without stereochemical fidelity checks.

9. **Claim Bounding & Documentation**
   - State explicit boundaries: tested classes, failed cases, untested space, and mechanistic limits.
   - Separate source-derived observations from agent-inferred extensions.
   - Finalize ranked hypotheses, control table, analysis plan, and validation summary.

# Output Format

When using this skill, produce:

1. **Research question and gap** — concise statement of the stereochemical bottleneck and its significance.
2. **Mechanistic framing** — proposed activation model, stereodetermining event, and competing pathways.
3. **Ranked hypotheses** — table with evidence strength, key assumptions, predicted observations, failure modes, and boundaries.
4. **Minimal validation plan** — model system, variables, controls, metrics, and stop/continue criteria.
5. **Analysis plan** — data integrity checks, control comparisons, structure-selectivity mapping, and mechanistic diagnostics.
6. **Iteration path** — decision rules for success, partial success, and failure with explicit return loops.
7. **Claim boundaries** — explicit limits on scope, mechanism, and extrapolation.
8. **Validity and safety summary** — confounders, reproducibility needs, and non-operational safety constraints.

# Validation Gates

- **Scope Relevance Gate:** A plausible catalytic stereocontrol mechanism must be articulable for the target transformation.
- **Hypothesis Rigor Gate:** At least one hypothesis must be falsifiable, and not all hypotheses may share the same unsupported assumption.
- **Control Adequacy Gate:** The plan must include background, omission, and mechanistic controls without relying on source-specific operational recipes.
- **Data Integrity Gate:** Product identity, mass balance, and stereochemical assignment must be independently supportable before mechanistic interpretation proceeds.
- **Mechanistic Convergence Gate:** Controls and probes must converge on a single preferred mechanism; if multiple mechanisms fit equally, return to hypothesis generation.
- **Generality Check Gate:** Scope expansion is permitted only after the model system shows credible identity, selectivity, and control logic.
- **Utility Gate:** Platform or downstream utility claims require evidence from more than one transformation and chirality-retention validation.

# Claim Boundaries

- Do not treat a single paper, review, or precedent as field-wide consensus.
- Distinguish demonstrated scope from extrapolated scope; label untested substrate classes explicitly.
- Label agent-proposed scaffolds, mechanisms, ligand families, and downstream applications as hypotheses until independently validated.
- Use "consistent with" rather than "proves" for mechanistic claims unless multiple orthogonal probes converge.
- Restrict synthetic utility claims to the tested catalytic manifold and substrate class.

# Failure Modes

- No product formation due to incompatible activation or unstable intermediates.
- Background or uncatalyzed reaction dominates, obscuring catalyst-controlled selectivity.
- Stereochemical assignment is ambiguous or relies on analogy rather than direct evidence.
- Selectivity collapses outside a narrow substrate class, indicating a hidden boundary.
- Competing mechanisms fit the same data equally, preventing clear attribution.
- Intermediate erosion or downstream compatibility loss in sequential or cascade designs.
- Analytical artifacts such as purification enrichment, decomposition, or signal overlap mimic success.
- Irreproducible results due to uncontrolled impurities, scale effects, or measurement variance.

# Validity Checks

Before finalizing any plan or conclusion, verify:
- **Confounding:** Are yield and selectivity separable? Could impurities, background reactivity, or workup artifacts explain the result?
- **Reproducibility:** Are key outcomes replicated or supported by orthogonal analysis?
- **Statistical validity:** Are comparisons representative and replicated rather than anecdotal?
- **Boundary validity:** Are required directing features, ligand motifs, substrate classes, and medium effects explicitly stated?
- **Mechanistic validity:** Are alternative mechanisms considered and falsified where possible?
- **Analytical validity:** Are identity and stereochemical excess measured by validated, independent methods?
- **External validity:** Is the source literature treated as one methodological example rather than universal consensus?
- **Safety validity:** Are plans non-operational, facility-appropriate, and compliant with chemical safety and regulatory requirements?

# Provenance

- Synthesized from cluster 16.0 (asymmetric-chiral-catalysis-catalytic-mechanism-discovery-workflow).
- Source skills: organocatalytic-glycosylation-research-design (10.1080_01614940.2022.2041303), biocatalytic-cascade-stereochemical-exploration (10.1021_acscatal.2c03052), enantioselective-carbonylative-cyclization-research (10.1021_jacs.9b12493), p-stereogenic-synthesis-design-workflow (10.1002_chin.201526252), chiral-phosphonate-butenolide-method-discovery (10.1002_chem.201304331), chiral-allene-catalytic-research (10.1039_c9cc04165f), asymmetric-cascade-catalysis-exploration (10.1021_acs.joc.9b02693), p-stereogenic-catalytic-platform-design (10.1021_jacs.4c10211).
- Workflow archetype: observable-driven mechanism discovery and validation.
