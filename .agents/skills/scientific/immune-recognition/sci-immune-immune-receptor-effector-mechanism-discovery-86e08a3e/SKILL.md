---
name: sci-immune-immune-receptor-effector-mechanism-discovery-86e08a3e
description: A reusable end-to-end workflow for generating, validating, and iterating mechanistic hypotheses about immune receptor and effector function, from initial observation through modular experimental design to claim bounding.
scienceevolve-title: "Antibody and immune recognition · immune receptor effector mechanism discovery workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Use this skill to transform an observed immune-receptor or effector-cell phenomenon into a structured, testable mechanistic research program. The workflow guides hypothesis generation, modular validation design, mechanistic analysis, and iterative refinement while strictly separating source-paper evidence from new-system inference. It is intended for preclinical research design, not for clinical decision-making or operational protocol execution.

# When to use

Use this skill when the user asks to:

- Explore how a receptor, ligand, antibody, immune complex, or effector module alters immune-cell behavior, antigen presentation, or functional output.
- Propose new research questions in immunology, immune-oncology, host-pathogen interactions, or antibody/receptor engineering.
- Design a minimal viable validation plan with conceptual variables, strong specificity controls, and mechanistic readouts.
- Evaluate whether a modular intervention (e.g., presentation format, binding domain, effector arm) plausibly changes receptor-mediated outcomes.
- Interpret discordant results across contexts (e.g., in vitro versus in vivo, different cell types, or disease models) as mechanistic information.

Do not use this skill for clinical treatment recommendations, patient-specific advice, diagnostic claims, or operational wet-lab execution.

# Inputs required

Request or identify before starting:

- **Biological system:** receptor/ligand pair, antibody/target, immune complex, or effector module; presenting and responder cell types; tissue or disease context.
- **Observed phenomenon:** the immune-response pattern, functional deficit, or receptor-mediated event to be explained.
- **Known mechanism:** how the receptor or ligand is naturally engaged, trafficked, signaled, or regulated.
- **Prior evidence:** available in vitro, ex vivo, animal, or clinical observations, labeled by evidence type and system.
- **Candidate modules:** separable functional units such as binding domains, scaffolds, constant regions, dimerization modules, or presentation contexts.
- **Readouts:** binding, cellular activation, proliferation, cytotoxicity, cytokine profiles, antigen presentation, trafficking, or disease-relevant surrogate endpoints.
- **Constraints:** biosafety boundaries, ethics approvals, sample availability, species/model limitations, and non-clinical scope.

# Core Workflow

Follow this ordered route. Do not skip decision gates.

## Stage 1: Frame the mechanistic question
1. Define the observed phenomenon as a causal chain: receptor engagement → cellular state change → functional output.
2. Identify the weakest link in the chain (e.g., unknown presentation step, unverified target dependence, missing effector coupling).
3. State the research question as a falsifiable mechanism claim, not as an efficacy claim.
4. **Decision Gate 1:** If the phenomenon cannot be framed as a receptor-mediated causal chain, stop and reformulate the observation.

## Stage 2: Generate ranked hypotheses
1. Derive at least three alternative hypotheses:
   - **Mechanism hypothesis:** a specific receptor/ligand or presentation step drives the outcome.
   - **Module hypothesis:** changing one separable unit alters potency, specificity, localization, or duration.
   - **Context hypothesis:** the effect depends on a specific cell type, tissue state, accessory cell, or receptor density.
   - **Failure hypothesis:** the most likely reason the proposed mechanism could fail (e.g., poor complex formation, compensatory signaling, off-target activation).
2. Assign evidence strength to each:
   - **Strong:** multiple independent observations in the same system.
   - **Moderate:** one direct observation plus mechanistic plausibility.
   - **Weak:** plausible extrapolation to a new ligand, receptor, scaffold, or disease model.
   - **Speculative:** useful for exploration but lacking direct support.
3. For each hypothesis, list key assumptions, predicted patterns, and discriminating tests.
4. **Decision Gate 2:** If no hypothesis can be falsified by a feasible minimal experiment, redesign the question or request additional prior evidence.

## Stage 3: Design minimal viable validation
1. Define the minimal experiment that could support or refute the leading hypothesis:
   - **Complex/target integrity:** confirm that the receptor, ligand, or module engages as intended.
   - **Target dependence:** show the response requires the expected receptor pathway or cell type.
   - **Module necessity/sufficiency:** test whether removing or restoring one module abolishes or rescues the effect.
   - **Specificity control:** compare target-specific conditions against irrelevant targets, format controls, or non-binding variants.
2. Specify conceptual variables (module identity, presentation context, cell type, timing) without operational parameters.
3. Define primary and secondary endpoints before data collection.
4. **Decision Gate 3:** If the design lacks a specificity control or an orthogonal readout, pause and strengthen controls before proceeding.

## Stage 4: Mechanistic analysis and integration
1. Analyze results by mechanism, not only by endpoint magnitude.
2. Keep biochemical, cellular, and functional evidence in separate layers before integrating.
3. Use module-removal, restoration, and inactive controls to infer necessity and sufficiency.
4. Compare contexts explicitly; treat in vitro–in vivo discordance as mechanistic information.
5. Classify the result:
   - **Supportive:** effect is specific, reproducible, and aligned with the proposed mechanism.
   - **Mixed:** direction is supportive but controls or replication are incomplete.
   - **Null:** no specific effect after valid controls.
   - **Invalid:** controls fail or nonspecific effects prevent interpretation.
6. **Decision Gate 4:** If controls fail or the assay cannot distinguish specific from nonspecific signal, classify as invalid and return to Stage 3.

## Stage 5: Iterate, escalate, or terminate
1. **If supportive:** refine the next question (e.g., test durability, alternative contexts, or translation to a disease model).
2. **If mixed:** tighten boundary conditions, add orthogonal readouts, or stratify by donor/model variables.
3. **If null:** revisit whether the assay measured the relevant cell subset, activation state, or receptor pathway; test alternative hypotheses from Stage 2.
4. **If invalid:** redesign the assay, controls, or model before biological interpretation.
5. **Stop conditions (terminate if any are met):**
   - The intended receptor complex does not form or is unstable.
   - The response occurs without the expected receptor pathway.
   - Nonspecific activation dominates over specific effects.
   - Results are not reproducible across independent batches or contexts.
   - Context-level findings contradict the cellular mechanism without a plausible explanation.
   - Safety or ethics sentinel readouts indicate unacceptable risk.

## Stage 6: Bound claims and update the model
1. Update the mechanistic model with new evidence.
2. Explicitly label:
   - What is supported by source-paper evidence.
   - What is supported by current experimental evidence.
   - What is agent-generated inference.
3. State boundary conditions (species, tissue, receptor expression, module class, disease model) beyond which the claim should not be generalized.
4. Archive negative findings as decision inputs.

# Output Format

Return results in this structure:

1. **Research question:** one concise, falsifiable mechanism question.
2. **Mechanistic model:** receptor/ligand, modules, responder cells, accessory context, and expected causal path.
3. **Hypothesis table:** hypothesis, evidence strength, key assumption, likely failure mode, and discriminating test.
4. **Experimental design schema:** minimal viable validation, conceptual variables, control classes, endpoints, and stop conditions.
5. **Analysis plan:** evidence-layer separation, primary/secondary analyses, orthogonal readout strategy, and visualization logic.
6. **Iteration plan:** how each result class (supportive, mixed, null, invalid) updates the model and what to test next.
7. **Validity and safety checks:** confounders, reproducibility requirements, boundary conditions, ethics constraints, and non-clinical framing.
8. **Evidence boundary statement:** clear separation of source-paper evidence, current evidence, and agent inference.

# Validation Gates

Before advancing past each stage, confirm:

- **Stage 1:** The question is mechanism-first, not efficacy-first.
- **Stage 2:** Every leading hypothesis has an explicit falsification path.
- **Stage 3:** The design includes target dependence, module specificity, and an orthogonal readout.
- **Stage 4:** Controls establish assay competence; primary endpoints were predefined.
- **Stage 5:** Reproducibility is assessed across independent biological contexts, not technical repeats alone.
- **Stage 6:** Claims are bounded by the tested context and evidence type.

# Claim Boundaries

- Distinguish **source-paper evidence** (observations from originating studies), **current-system evidence** (new data generated in the target system), and **agent inference** (plausible but untested extrapolations).
- Do not present moderate or weak hypotheses as established facts.
- Do not generalize from one receptor system, one module class, one cell model, or one disease context to the entire field.
- Mechanism support does not imply clinical efficacy, therapeutic utility, or field-wide consensus.
- Preclinical findings remain non-clinical unless independently validated in appropriate translational or clinical frameworks.

# Failure Modes

- **Assay failure:** positive or negative controls behave unexpectedly; background dominates signal.
- **Nonspecific effects:** scaffold, format, or carrier drives broad activation unrelated to the receptor mechanism.
- **Confounding:** endogenous ligand, variable receptor expression, donor history, batch effects, or tissue context obscures the specific effect.
- **Model mismatch:** the chosen cell or animal context lacks the accessory cells, receptor density, or trafficking routes required for the mechanism.
- **Mechanistic inconsistency:** biochemical, cellular, and functional readouts point to different causal stories.
- **Reproducibility failure:** effects disappear across independent replicates, donors, or model systems.
- **Safety/ethics breach:** unacceptable risk, missing approvals, or clinical overreach.

# Validity Checks

Before presenting conclusions, verify:

- **Confounding:** Are endogenous factors, batch variability, and format effects distinguished from the receptor-mediated mechanism?
- **Specificity:** Does the effect require the intended receptor pathway and target cell type?
- **Reproducibility:** Are independent biological replicates, blinded analysis, and randomization addressed?
- **Boundary conditions:** Are species, tissue, inflammatory state, receptor expression, module class, and disease model explicitly stated?
- **Statistical validity:** Are endpoints predefined, effect sizes reported, multiple comparisons controlled, and models appropriate to the data structure?
- **Mechanistic consistency:** Do engagement, signaling, cellular response, and functional outcome align?
- **Evidence labeling:** Is source-paper evidence clearly separated from current experimental evidence and agent inference?

# Provenance

- Derived from cluster `4`, subcluster `4.0.split0`.
- Synthesized from source skills: `cytokine-transpresentation-research`, `immune-complex-antigen-presentation-discovery`, `tumor-vaccine-immune-response-discovery`, `antibody-neutralization-immunogenicity-design`, `prx1-phage-antibody-discovery-workflow`, `ige-immune-deviation-research`, `antibody-repertoire-phage-display-exploration`, `mucosal-pathogen-neutralizing-epitope-exploration`.
- Excluded skill IDs: `0b3648ffd0490ecb`, `0eef65b192372dae`, `286756a1649ddbd7`, `c0eb0b942c4befcb`, `cc56565e964aa184`.
