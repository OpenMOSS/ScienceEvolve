---
name: sci-catalysis-asymmetric-catalysis-mechanism-discovery-3c22aa82
description: A reusable end-to-end workflow for designing, validating, and iterating hypothesis-driven research in asymmetric catalysis and chiral method development, emphasizing observable-driven mechanism discrimination and claim bounding.
scienceevolve-title: "Asymmetric catalysis · asymmetric catalysis mechanism discovery workflow 3"
scienceevolve-area: asymmetric-catalysis
---

# Purpose

Help an agent transform a synthetic bottleneck into a structured, hypothesis-driven research program for asymmetric catalysis and chiral method development. The workflow generates transferable mechanistic hypotheses, designs minimal validation experiments with strong controls, analyzes selectivity and mechanistic evidence, iterates through explicit decision gates, and bounds claims—without reproducing paper-specific systems, operational protocols, or unsupported conclusions.

# When to use

Use this skill when the user asks to:

- Propose new research questions in asymmetric catalysis, stereoselective synthesis, chiral organocatalysis, or transition-metal-catalyzed enantioselective functionalization.
- Design validation plans, control strategies, or mechanistic discrimination experiments for a proposed catalytic transformation.
- Iterate hypotheses after initial results, diagnose substrate-catalyst mismatches, or map scope boundaries.
- Convert a narrow catalytic observation into a broader, evidence-limited method hypothesis.

Do not use this skill for:

- Clinical, pharmacological, or therapeutic recommendations.
- Executable laboratory recipes, hazardous operational protocols, or manufacturing scale-up instructions.
- Claims of field-wide consensus based on single-paper or single-system evidence.
- General-purpose chemistry assistance outside methodology development and mechanism validation.

# Inputs required

Ask the user or environment to provide:

- **Target stereochemical problem**: the bond, stereocenter, or stereogenic element to be created, and why current access is inefficient or nonselective.
- **Substrate classes**: candidate substrates, competing reactive sites, known side reactions, and decomposition risks.
- **Catalyst design logic**: proposed chiral catalyst, ligand, organocatalyst, or cooperative system, and the hypothesized activation/selectivity mechanism.
- **Baseline and benchmarks**: existing methods, literature precedents, and performance ceilings for comparison.
- **Analytical readouts**: available methods for confirming product identity and quantifying conversion, regioselectivity, diastereoselectivity, and enantioselectivity.
- **Constraints**: safety, regulatory, waste-handling, or resource boundaries relevant to the chemical system.

If inputs are missing, state assumptions explicitly and label downstream conclusions as lower-confidence.

# Core Workflow

An ordered, end-to-end route from gap definition to claim bounding. Each stage includes a decision gate; iteration loops are explicit.

## 1. Gap definition and bottleneck framing

Define the synthetic gap as a mechanistic selectivity challenge. Identify whether the bottleneck is regiocontrol, stereocontrol, chemoselectivity, substrate scope, or downstream trapping. Clarify whether the target advance is selectivity, efficiency, mechanistic understanding, or synthetic utility.

**Gate 1 — Tractability:** Is the gap defined in terms of observable catalytic outcomes? If the gap is vague or already resolved by established consensus, stop and reformulate.

## 2. Mechanistic hypothesis generation

Generate 2–4 competing or complementary hypotheses for how the chiral catalyst controls selectivity. For each hypothesis specify:

- Proposed mechanism (e.g., coordination-controlled orientation, activation-map bias, reversible/irreversible pathway partitioning, dynamic speciation).
- Evidence strength: strong, moderate, weak, or speculative.
- Key assumptions required for the hypothesis to hold.
- Likely failure modes and boundary conditions.
- A minimal falsification test (the smallest diagnostic observation that would refute it).

**Gate 2 — Falsifiability:** Are all hypotheses linked to observable outcomes and discriminating tests? If a hypothesis cannot be falsified, refine or replace it before proceeding.

## 3. Minimal viable validation design

Select one model substrate that isolates the key stereochemical question. Define:

- Independent variables: catalyst components, substrate features, medium classes.
- Dependent variables: conversion, yield, regio/diastereo/enantioselectivity, byproduct distribution.
- Control set: no-catalyst background; achiral/racemic catalyst; component omission; mismatched ligand/additive; substrate lacking the proposed privileged motif; benchmark comparison.
- Stop conditions: criteria for pausing or redesigning before scope expansion.

**Gate 3 — Discrimination:** Does the control set distinguish catalyst-controlled selectivity from substrate-intrinsic bias, background reactivity, and analytical artifacts? If not, redesign controls.

## 4. Evidence collection and product accounting

Record conversion, product identity, stereoisomer ratios, regioisomer ratios, byproducts, and reproducibility across independent runs. Separate reactivity effects from selectivity effects. Quantify competing pathways.

**Gate 4 — Analytical readiness:** Are the analytical methods validated to resolve the relevant isomers and quantify product distribution? If uncertainty is comparable to the observed selectivity, pause for method validation.

## 5. Mechanism discrimination and analysis

Compare results against the hypothesis set using control tables. Evaluate:

- Whether proposed intermediates explain both high- and low-performing cases.
- Whether component-omission experiments support assigned mechanistic roles.
- Whether selectivity is catalyst-dependent or substrate-intrinsic.
- Whether medium, additive, or trapping-partner changes alter selectivity (indicating reversible or post-activation stereochemical erosion).

**Gate 5 — Mechanistic convergence:** Does one hypothesis survive falsification with clear support? If multiple mechanisms fit the data equally, return to Stage 3 and design discriminating experiments before expanding scope.

## 6. Scope and robustness probing

Expand to diverse substrates only after the core mechanism is supported. Vary one structural axis at a time (electronics, sterics, functional groups, heterocycle class). Include substrates predicted to fail in order to define mechanistic boundaries. Record failures with the same rigor as successes.

**Gate 6 — Structural correlation:** Do successes and failures correlate with the proposed privileged motif or binding model? If not, narrow the claim or return to Stage 2 to revise the hypothesis.

## 7. Claim bounding and documentation

State explicitly what is demonstrated, inferred, and speculative. Define applicability boundaries:

- Substrate classes and functional-group tolerances supported by evidence.
- Catalyst/ligand classes and medium constraints.
- Limits on extrapolation to untested metals, directing groups, or reaction classes.

**Gate 7 — Evidence alignment:** Are all claims limited to the tested substrate/catalyst classes and mechanistic assumptions? Trim any overgeneralized statements.

## 8. Iteration or termination

Apply decision rules based on evidence:

- **Low activity, high selectivity:** revisit activation, speciation, or catalyst availability (return to Stage 3).
- **High activity, low selectivity:** revisit stereocontrol model, ligand environment, or binding geometry (return to Stage 2).
- **Selectivity reverses with medium/additive:** treat as mechanistic clue; test binding-mode or aggregation hypotheses (return to Stage 2/3).
- **Narrow scope without structural rationale:** define boundary condition and stop generality claims.
- **Controls ambiguous or irreproducible:** redesign comparison (return to Stage 3).
- **Mechanistic data contradict leading model:** abandon or substantially revise hypothesis (return to Stage 2).

**Terminate** when:

- Selectivity cannot be tied to catalyst structure.
- Background reactivity dominates over catalyst control.
- Analytical uncertainty swamps the observed effect.
- Safety or compliance constraints prevent a clean test.
- The apparent improvement disappears under strong controls.

# Output Format

Return a structured research design document containing:

1. **Research question and gap statement** — Target transformation, current bottleneck, and why it matters.
2. **Ranked hypotheses** — For each: mechanism, evidence strength, key assumptions, discriminating test, likely failure mode, and boundary.
3. **Validation plan** — Model system, variables, control table, primary/secondary metrics, and stop conditions.
4. **Analysis plan** — Evidence streams to separate (conversion, selectivity, mechanistic consistency, robustness), product-accounting strategy, and visualization approach.
5. **Iteration rules** — Decision triggers for optimization, redesign, scope limitation, or termination.
6. **Claim boundary statement** — Demonstrated vs. inferred limits, substrate/catalyst scope boundaries, and documented failure modes.
7. **Validity and safety notes** — Confounders, reproducibility requirements, analytical validation needs, and non-operational safety boundaries.

# Validation Gates

Stage-specific go/no-go criteria that must be satisfied before advancing:

- **Gap tractability (Stage 1):** The gap is framed as an observable selectivity or mechanism problem, not as a vague performance deficit.
- **Hypothesis falsifiability (Stage 2):** Every hypothesis has at least one observable discriminating test and a defined failure mode.
- **Control discrimination (Stage 3):** The experimental design can separate catalyst-controlled outcomes from background, substrate-intrinsic, and analytical artifacts.
- **Analytical readiness (Stage 4):** Methods are capable of resolving and quantifying the relevant stereoisomers, regioisomers, and byproducts.
- **Mechanistic convergence (Stage 5):** One hypothesis is clearly favored over alternatives; if not, scope expansion is blocked.
- **Structural correlation (Stage 6):** Scope results correlate with a proposed structural motif or mechanistic boundary.
- **Claim alignment (Stage 7):** No claim exceeds the evidence-supported substrate, catalyst, or medium boundary.
- **Iteration clarity (Stage 8):** Every outcome maps to a specific loopback stage or termination decision.

# Claim Boundaries

Explicit limits on what may be claimed:

- Do not present a single paper, single catalyst system, or single substrate class as field-wide consensus.
- Do not extrapolate to untested substrate classes, catalyst metals, ligand families, directing groups, or trapping partners without additional validation.
- Do not present mechanistic cartoons (binding modes, transition-state sketches, speciation models) as confirmed facts without discriminating experimental support.
- Do not conflate synthetic accessibility or methodological novelty with biological efficacy, clinical utility, or safety.
- Do not claim scalability, sustainability, or operational robustness without direct, replicated evidence.
- Distinguish literature-supported observations, mechanistically plausible inferences, and speculative extrapolations at every step.

# Failure Modes

Common failure patterns and their diagnostic signatures:

- **Background dominance:** Product forms with comparable selectivity in the absence of the chiral catalyst or with an achiral analogue.
- **Substrate-intrinsic selectivity:** Selectivity persists across unrelated catalysts, indicating substrate or reagent control rather than catalyst control.
- **Scope collapse:** Selectivity disappears for an entire substrate class, signaling a mechanistic boundary or incorrect privileged motif.
- **Analytical artifact:** Apparent selectivity arises from coelution, decomposition during workup, product enrichment during purification, or unvalidated chiral analysis.
- **Irreproducible speciation:** Batch-to-batch variation in catalyst aggregation, oxidation state, or ligand dissociation obscures true selectivity trends.
- **Nonproductive coordination:** Substrate binds the catalyst in a way that disables chiral induction or favors an off-cycle pathway.
- **Reversible stereochemical erosion:** A fast, reversible activation step is followed by slow trapping, allowing racemization or selectivity decay before product formation.
- **Narrow scope without rationale:** Success is limited to one substrate class and failures do not correlate with a testable structural feature.

# Validity Checks

Final checklist before delivering a research plan or conclusion:

- **Scope validity:** The plan avoids treating source literature as universal consensus.
- **Mechanistic validity:** Proposed activation or selectivity events are linked to observable outcomes.
- **Control validity:** The design can distinguish catalyst control from background reactivity and substrate bias.
- **Statistical validity:** Claims are supported by replicates, uncertainty estimates, and appropriate analysis rather than single observations.
- **Analytical validity:** Stereochemical and regiochemical claims are tied to validated analytical methods.
- **Reproducibility validity:** Key variables are documented enough for independent verification without becoming executable high-risk protocols.
- **Boundary validity:** Product, substrate, and catalyst classes are limited to what the evidence can support.
- **Confounding validity:** Substrate electronics, sterics, impurities, catalyst purity, medium effects, and analytical bias are considered.
- **Safety validity:** The output contains no executable hazardous operational details and frames high-risk chemistry as non-operational design constraints.

# Provenance

- Synthesized from cluster 8.0 (asymmetric catalysis / chiral method mechanism discovery and validation).
- Derived from source skills: `thiourea-amcr-research-design`, `asymmetric-allylic-alkylation-methodology`, `weak-ether-directed-asymmetric-borylation-design`, `organic-method-development-workflow`, `asymmetric-catalysis-vinylogous-aldol-research`, `coordination-managed-asymmetric-catalysis-research`, `hydrogen-bond-organocatalyst-exploration`, `chiral-sulfur-c-h-functionalization-research-pattern`.
- Paper-specific systems, materials, parameters, numerical results, and operational protocols have been abstracted to produce a domain-agnostic reusable workflow.
