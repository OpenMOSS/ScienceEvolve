---
name: sci-catalysis-asymmetric-catalysis-chiral-method-mechan-dc2da814
description: A reusable end-to-end workflow for generating, validating, and iterating mechanism-centered hypotheses in asymmetric catalysis and stereoselective synthesis without paper-specific operational details.
scienceevolve-title: "Asymmetric catalysis · asymmetric catalysis chiral method mechanism discovery workflow"
scienceevolve-area: asymmetric-catalysis
---

## Purpose

Enable an agent to transform literature observations in asymmetric catalysis into a reusable, non-operational research workflow for observable-driven mechanism discovery and validation. The skill guides hypothesis generation, minimal validation design, layered analysis, and iterative refinement while keeping paper-specific conditions, materials, and numerical results out of the reusable body.

## When to use

- When a user asks to propose new stereoselective reactions or catalyst-design questions.
- When evaluating whether a chiral element controls selectivity versus merely activating reactivity.
- When designing non-operational validation plans for cooperative, ion-pair, or architecture-driven stereocontrol.
- When interpreting scope, robustness, or failure-mode data to update a mechanistic model.
- When converting a single literature report into a generalizable research logic for related substrate classes.

Do not use for executable laboratory protocols, safety-critical scale-up, or as a substitute for expert chemical safety review.

## Inputs required

- Target transformation class and desired selectivity dimension(s).
- Candidate catalyst architecture or chiral organizing principle.
- Substrate and reagent classes described at a non-operational level.
- Known competing pathways and likely side reactions.
- Available analytical readouts for conversion, selectivity, and stereochemical assignment.
- Safety, regulatory, and facility constraints.
- Whether the task is hypothesis generation, experimental design, mechanism interrogation, or scope prediction.

## Core Workflow

1. **Define the Selectivity Bottleneck**
   - Identify whether the unresolved obstacle is regio-, enantio-, diastereo-, or chemoselectivity, or product configurational stability.
   - Map the literature gap: what prior methods lack and why the new approach is plausible.
   - *Gate*: Stop if the gap is not grounded in literature limitations or if the target motif has no tractable disconnection.

2. **Generate Ranked, Falsifiable Hypotheses**
   - Propose an activation hypothesis (how the catalyst generates the reactive species).
   - Propose a stereocontrol hypothesis (how the chiral environment biases the stereodetermining step).
   - If relevant, propose a cooperation hypothesis (dual chiral elements, counter-component, or architecture effect).
   - Label each with evidence strength (strong/moderate/weak/exploratory), key assumptions, predicted observations, disconfirming observations, and likely failure modes.
   - *Gate*: Reformulate if hypotheses are not mechanistically anchored or cannot be tested with a small control matrix.

3. **Map Competing Pathways**
   - Enumerate desired and undesired routes: background, homocoupling, overreaction, rearrangement, racemization, oligomerization.
   - Define the stereocontrolling event and any rapidly equilibrating intermediates.
   - *Gate*: Do not proceed until at least two plausible mechanisms are distinguished.

4. **Design Minimal Viable Validation**
   - Define variables at the category level only: catalyst/ligand class, substrate electronics/sterics, medium class, additive/modifier class.
   - Specify controls:
     - Background/achiral catalyst control.
     - Component-removal or inactive analogue (negative).
     - Matched/mismatched or opposite-configuration stereochemical control.
     - Boundary substrate expected to weaken the model.
     - Analytical identity/assignment control.
   - Predefine metrics that separate activity (conversion/yield) from selectivity.
   - State stopping conditions: background dominates, selectivity is absent, stereochemical assignment is ambiguous, or reproducibility fails.
   - *Gate*: Redesign if the plan cannot separate activation effects from stereocontrol effects.

5. **Execute and Analyze in Layers**
   - **Outcome layer**: Confirm product identity by independent evidence; report conversion/yield separately from selectivity.
   - **Selectivity layer**: Evaluate stereochemical outcome against all controls; check for purification/enrichment artifacts.
   - **Mechanism layer**: Compare observations with the competing-pathway map; use kinetics, competition, labeling, or structural probes to support or reject each model.
   - **Scope/boundary layer**: Identify substrate features that predict success or failure; report failed cases as evidence.
   - **Reliability layer**: Assess reproducibility, batch variability, and analytical timing.
   - *Gate*: If product identity is ambiguous or controls are inconsistent, pause and improve analytical validation before iterating.

6. **Discriminate Mechanisms**
   - Require multiple orthogonal observations (rate, selectivity, structural, substrate trend) to converge before favoring one model.
   - If diagnostics conflict, preserve ambiguity and design a targeted probe rather than forcing a single mechanism.
   - Update evidence strength for each hypothesis.
   - *Gate*: If no model is at least moderately supported, return to Stage 2 and revise the stereocontrol or activation hypothesis.

7. **Iterate or Pivot**
   - **Supported**: Systematically vary one structural class at a time to map boundaries.
   - **Partially supported**: Add the specific control or measurement that addresses the missing mechanistic link.
   - **Ambiguous**: Simplify the system or improve stereochemical assignment before expanding scope.
   - **Contradicted**: Revise the stereodetermining step, propose an alternative intermediate, or abandon the hypothesis.
   - *Stop conditions*: End iteration if the desired pathway is not the major product, selectivity is independent of the chiral element, side reactions dominate without a control lever, safety/compliance concerns arise, or results depend on unexplained trace impurities.

8. **Define Claim Boundaries and Package Outputs**
   - Distinguish demonstrated results from agent-generated inferences.
   - State explicit extrapolation boundaries: metal class, ligand class, substrate class, and analytical limits.
   - Ensure no paper-specific numerical values, reagent identities, or operational parameters are embedded in the generalized claims.
   - *Gate*: Do not deliver the final plan until all claims are labeled with evidence strength and boundary conditions.

## Output Format

1. **Research question** — concise, testable problem statement and rationale.
2. **Literature gap and evidence boundary** — what is supported, what remains unproven, and what must not be generalized.
3. **Ranked hypotheses table** — hypothesis, evidence strength, key assumptions, predicted observation, disconfirming observation, likely failure mode, minimal validation.
4. **Mechanistic model** — activation topology, stereocontrolling event, competing pathways, and key assumptions.
5. **Non-operational design plan** — variables, controls, metrics, replication strategy, and stopping conditions.
6. **Layered analysis plan** — how to separate reactivity, selectivity, mechanism, scope, and reliability.
7. **Iteration plan** — decision rules for supported, partial, ambiguous, and contradicted outcomes.
8. **Validity and boundary statement** — confounders, reproducibility checks, extrapolation limits, and non-operational safety constraints.

## Validation Gates

- The research question is limited to one mechanism-centered task.
- The gap is based on literature reasoning, not a single-paper conclusion.
- Hypotheses distinguish activation from stereocontrol.
- Positive, negative, background, stereochemical, and boundary controls are included.
- Yield/conversion and selectivity are treated as separate metrics.
- Purification-based enrichment and catalytic selectivity are separated.
- Stopping conditions are defined before results are known.
- The plan contains no executable operational parameters.

## Claim Boundaries

- Label conclusions as demonstrated only for the tested system; extrapolate to new substrates, catalysts, or reagents as hypotheses with explicit failure modes.
- Do not treat a single literature report as field-wide consensus.
- Distinguish catalyst control from substrate control using appropriate stereochemical probes.
- Computational rationalizations must be tied to experimental observables; do not present post-hoc modeling as proof.
- Mechanism claims should be phrased as supported, consistent, or plausible rather than proven.

## Failure Modes

- Background or non-catalytic reactivity dominates the chiral pathway.
- Selectivity depends primarily on purification or enrichment rather than catalytic bias.
- Stereochemical assignment is ambiguous or not independently verified.
- The chiral organizing element has no observable effect on selectivity.
- Competing pathways (homocoupling, overreaction, racemization, decomposition) overwhelm the desired transformation.
- Rapid intermediate equilibration is too slow or irrelevant to the observed stereochemical outcome.
- Results are irreproducible across batches or analytical methods.
- Confounding by impurities, catalyst decomposition, or uncontrolled speciation.

## Validity Checks

Before finalizing the research plan, verify:
- Confounders are addressed: analytical overlap, racemization, substrate impurities, catalyst decomposition, selective recovery, solvent effects, and batch variability.
- Reproducibility needs are stated at a design level.
- Statistical or measurement uncertainty is acknowledged before claiming trends.
- Mechanistic consistency: rate, selectivity, structural, and substrate-scope evidence point to the same working model.
- External validity: substrate scope supports any generality claim only within stated boundaries.
- Safety, ethics, and compliance boundaries are explicit and appropriate for the chemistry domain.
- All paper-specific values, reagent identities, and operational parameters have been removed from the generalized workflow.

## Provenance

Derived from Cluster 1 / Subcluster 1.0. Synthesized from source skills: asymmetric-phospha-michael-method-development (10.1039_b713151h), asymmetric-catalysis-cooperative-chirality (10.1002_anie.201709420), asymmetric-diene-hydrofunctionalization-methodology (10.1021_jacs.8b11150), atroposelective-redox-coupling-research (10.1021_acs.accounts.2c00545), chiral-allene-reaction-discovery (10.1038_s42004-018-0065-4), chiral-ion-pair-catalysis-exploration (10.1021_ja806311e), heterocyclic-phosphine-oxide-research-design (10.1055_s-0040-1706419), p-stereogenic-catalysis-exploration (10.1021_acs.organomet.2c00218).
