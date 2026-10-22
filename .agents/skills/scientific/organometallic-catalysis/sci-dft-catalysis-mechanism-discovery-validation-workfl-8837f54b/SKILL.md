---
name: sci-dft-catalysis-mechanism-discovery-validation-workfl-8837f54b
description: A reusable end-to-end workflow for generating, discriminating, and validating competing mechanistic hypotheses in catalytic systems through controlled comparison and iterative refinement.
scienceevolve-title: "Organometallic catalysis and DFT · catalysis mechanism discovery validation workflow 4"
scienceevolve-area: organometallic-catalysis-and-dft
---

## Purpose

Guide an agent to transform an unresolved catalytic selectivity or reactivity problem into a structured, mechanism-first research plan. The workflow emphasizes competing-pathway enumeration, minimal validation design, orthogonal evidence integration, and iterative hypothesis refinement without operational chemical procedures.

## When to use

Use this skill when:

- Exploring catalytic bond activation, selectivity, or competing pathways in molecular, organometallic, or enzyme-like systems.
- Computational and/or experimental evidence must be combined to discriminate mechanisms.
- The user needs research questions, non-operational validation plans, or mechanistic hypotheses for related catalyst families.
- Active species, resting states, side reactions, or environmental variables create ambiguity.

Do not use this skill to generate executable laboratory protocols, hazardous procedure designs, clinical recommendations, or broad domain surveys unrelated to mechanism discrimination.

## Inputs required

Before generating a plan, collect or state assumptions for:

- Target transformation class and competing outcomes (products, sites, stereoisomers).
- Candidate catalyst, ligand, and substrate classes with conceptual tunable variables.
- Known experimental observations, literature precedents, and unresolved mechanistic choices.
- Available theoretical or analytical methods and acceptable modeling assumptions.
- Safety, regulatory, and ethical constraints at a non-operational level.
- Scope intent: hypothesis generation, validation design, mechanism critique, or iteration after results.

## Core Workflow

1. **Frame the mechanistic boundary.** Define the target transformation, the selectivity or rate bottleneck, and the competing outcomes. Express the unresolved problem as a competition between at least two chemically plausible pathways, active species, or substrate binding modes.
   - *Decision Gate:* Proceed only if the bottleneck can be cast as a discriminable mechanistic competition. If not, refine the question or request additional boundary evidence.

2. **Generate competing hypotheses.** For each mechanistic element (active species, binding mode, elementary pathway, selectivity determinant, cycle balance), produce at least two mutually distinguishable hypotheses. Label every hypothesis with:
   - Evidence strength (e.g., high, medium, low, speculative).
   - Key assumptions required for validity.
   - Predicted discriminator (observable or computable signature).
   - Likely failure mode (result that would reject or weaken it).
   - *Decision Gate:* Require a minimum of two credible, non-trivial alternatives before advancing to validation design. If only one hypothesis is viable, search for hidden alternatives or pause for more evidence.

3. **Design minimal validation.** Specify:
   - Independent variables that isolate one mechanistic variable at a time (catalyst architecture, ligand, substrate class, environment).
   - Dependent variables (selectivity, activity, speciation, descriptor trends).
   - Control set: positive control (benchmark behavior), negative control (suppressed pathway), strong/discrimination control (paired variant targeting the causal feature), and orthogonal control (independent observable testing the same claim).
   - Metrics tied to the proposed mechanism rather than endpoint activity alone.
   - Pre-registered decision rules and stop conditions.
   - *Decision Gate:* Halt if the plan cannot isolate variables, lacks adequate controls, or requires operational hazardous details. Redesign until the validation is conceptually discriminating.

4. **Evaluate pathways and descriptors.** Compare competing pathways under consistent reference states and modeling assumptions. Assess:
   - Pathway connectivity and elementary-step coherence.
   - Relative feasibility using appropriate descriptors (electronic, steric, geometric, orbital, thermodynamic).
   - Sensitivity to model choices, conformational sampling, omitted species, and environment representation.
   - *Decision Gate:* Flag conclusions if pathway differences are smaller than expected uncertainty, if omitted pathways could reverse rankings, or if static/ground-state data cannot explain functional differences. Do not advance unsupported rankings.

5. **Integrate evidence and update hypotheses.** Map observed or computed outcomes to the hypothesis set. Update evidence strengths based on control outcomes and orthogonal checks. Classify each hypothesis as:
   - Supported,
   - Revised (requires modification),
   - Rejected, or
   - Unresolved.
   - *Decision Gate:* Promote a hypothesis only if it survives at least one discriminating control and one orthogonal check. If multiple hypotheses remain competitive, report them as unresolved alternatives.

6. **Iterate or terminate.** Apply iteration rules:
   - **If supported:** test robustness on a related variant or expand scope cautiously, then return to Step 1 with the new boundary.
   - **If contradicted:** revise the mechanistic map (active species, branch point, or omitted pathway) and return to Step 2.
   - **If ambiguous:** design the next minimal discriminating test and return to Step 3.
   - **Stop conditions:** Terminate if the active species is implausible, the desired pathway is inaccessible, a side pathway dominates, catalyst regeneration fails, results are irreproducible, or validation crosses safety or ethics boundaries.

## Output Format

When using this skill, return results in the following structure:

1. **Research question.** Concise statement of the selectivity or mechanism bottleneck.
2. **Mechanism map.** Plausible elementary steps, off-cycle states, and assigned control roles (rate, selectivity, regeneration, deactivation).
3. **Hypothesis table.** For each hypothesis: claim, evidence strength, key assumptions, predicted discriminator, and likely failure mode.
4. **Minimal validation design.** Variables, positive control, negative control, strong/discrimination control, orthogonal control, metrics, decision rules, and stop conditions.
5. **Analysis plan.** Pathway comparison logic, descriptor evaluation, robustness checks, uncertainty assessment, and evidence-integration rules.
6. **Iteration rules.** Conditions for promoting, revising, rejecting, or retaining hypotheses, plus the next discriminating test.
7. **Validity and safety note.** Boundary conditions, main confounders, reproducibility requirements, and non-operational safety constraints.

## Validation Gates

- **Boundary clarity gate (Step 1):** The problem must be expressible as a competition between at least two chemically plausible pathways or states.
- **Hypothesis diversity gate (Step 2):** At least two mutually distinguishable hypotheses must be present, each with explicit assumptions and failure modes.
- **Control adequacy gate (Step 3):** The validation plan must include positive, negative, strong/discrimination, and orthogonal controls without relying on operational hazardous details.
- **Uncertainty and sensitivity gate (Step 4):** Pathway rankings must exceed expected method uncertainty and survive reasonable alternative assumptions.
- **Orthogonal support gate (Step 5):** A hypothesis may be promoted only after surviving a discriminating control and an orthogonal check.
- **Termination or continuation gate (Step 6):** Continue only if the mechanistic map is still viable, reproducible, and within safe ethical boundaries; otherwise stop or pivot.

## Claim Boundaries

- Do not present single-system or single-paper findings as field-wide consensus.
- Limit mechanistic claims to the tested catalyst, substrate, and environment classes.
- Distinguish paper-supported evidence, literature precedent, agent-inferred hypotheses, and speculation.
- Do not extrapolate computational predictions to clinical, environmental, or industrial safety claims.
- Treat computational rankings and descriptor trends as provisional until validated by independent experimental controls or trend-level agreement.

## Failure Modes

- The hypothesis explains selectivity but not activity, or vice versa.
- A simpler alternative mechanism explains all observations with fewer assumptions.
- Results depend on uncontrolled variables such as speciation, decomposition, or medium effects.
- The apparent mechanistic advantage is smaller than the expected method uncertainty.
- Controls fail to discriminate mechanisms or indicate decomposition and background dominance.
- The model omits a known feature that reverses the pathway ranking.
- Validation becomes unsafe, underdetermined, or dependent on non-transferable system-specific details.

## Validity Checks

Before finalizing a research plan, verify:

- **Mechanistic completeness:** Active-species formation, substrate binding, bond activation, product release, and catalyst regeneration are all considered.
- **Pathway competition:** At least one desired and one credible side pathway are explicitly compared.
- **Control completeness:** Positive, negative, strong/discrimination, and orthogonal controls are included.
- **Confounding isolation:** Each perturbation changes only one intended mechanistic variable.
- **Evidence labeling:** Paper-supported findings are separated from new inferences and speculation.
- **Reproducibility:** Variables, reference states, descriptors, scoring choices, and decision rules are documented.
- **Boundary conditions:** Extrapolations are limited to chemically similar systems.
- **Non-operational safety:** The plan avoids executable hazardous procedures and respects institutional safety and regulatory boundaries.

## Provenance

Synthesized from cluster 1.1 (end-to-end mechanism discovery and validation). Source skills: mechanism-first-catalyst-exploration, catalyst-counterion-exploration, metalloenzyme-mechanism-exploration, computational-catalysis-mechanistic-exploration, computational-catalysis-mechanism-exploration, green-solvent-hydroformylation-discovery, mechanism-first-selectivity-dft, ligand-controlled-catalytic-selectivity-exploration.
