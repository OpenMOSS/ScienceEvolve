---
name: sci-catalysis-chiral-ligand-mechanism-hypothesis-genera-457da744
description: A reusable end-to-end workflow for generating mechanism-driven hypotheses, designing minimal validation plans, and iterating toward bounded claims in asymmetric catalysis and chiral ligand discovery.
scienceevolve-title: "Asymmetric catalysis · chiral ligand mechanism hypothesis generation"
scienceevolve-area: asymmetric-catalysis
---

# Purpose

Help an agent transform a synthetic bottleneck in asymmetric catalysis into a structured, mechanism-first research program. The workflow generates ranked hypotheses, designs non-operational validation plans with rigorous controls, and iterates based on converging evidence until claims are bounded, revised, or abandoned.

# When to use

Use this skill when the user asks to:

- Propose new research questions in asymmetric catalysis, chiral ligand design, stereoconvergent transformations, or related mechanistic problems.
- Translate a methodological gap into a reusable hypothesis-generation and experimental-design workflow.
- Evaluate whether a substrate or catalyst concept could enable dynamic kinetic resolution, enantioselective control, or selective bond formation.
- Design non-operational validation plans involving model systems, mechanistic controls, substrate-scope logic, and computational support.
- Interpret activity, selectivity, and scope trade-offs without reproducing a specific paper's system.

Do not use this skill to provide operational laboratory protocols, scale-up instructions, hazardous handling details, or to treat a single literature report as field-wide consensus.

# Inputs required

Ask the user or inspect the environment for:

- Target transformation family and the synthetic or methodological gap it addresses.
- Candidate substrate classes, including configurational stability or interconversion behavior under proposed conditions.
- Candidate catalyst or ligand concepts, activation modes, and stereochemical rationale.
- Mechanistic alternatives that could explain the same observations.
- Available analytical readouts for conversion, product identity, enantioselectivity, diastereoselectivity, regioselectivity, and structural assignment.
- Prior art or benchmark reactions that can serve as conceptual positive or negative controls.
- Facility-level safety, regulatory, waste, and equipment constraints.

# Core Workflow

1. **Define bottleneck and map mechanism space**
   - State the target product class and the specific limitation (selectivity, activity, scope, robustness, or mechanistic ambiguity).
   - Map prior approaches by activation mode and stereocontrol strategy without treating any single report as consensus.
   - Identify whether the gap is best addressed by a new catalyst class, ligand modification, substrate design, or activation concept.
   - **Decision Gate:** Proceed only if the bottleneck is mechanism-addressable and a testable control point exists.

2. **Generate ranked, mechanism-linked hypotheses**
   - Formulate 3–6 hypotheses that link structural or electronic variables to observable outcomes.
   - For each hypothesis specify: claim, evidence strength (strong/moderate/weak/speculative), key assumptions, predicted observable, likely failure mode, and boundary conditions.
   - Include at minimum: a value/gap hypothesis, a stereocontrol/activation hypothesis, and a mechanistic alternative hypothesis.
   - **Decision Gate:** Advance only if every hypothesis is falsifiable and the strongest hypothesis can be tested with available readouts.

3. **Design minimal viable validation**
   - Select one benchmark substrate pair that isolates the proposed stereochemical or mechanistic logic.
   - Define a focused comparison set (e.g., catalyst family, ligand variant, or activation mode) that varies along one interpretable axis.
   - Specify primary and secondary variables, keeping conditions as conceptual placeholders.
   - **Stop Condition:** Halt if no benchmark can distinguish the proposed mechanism from background reactivity.

4. **Plan controls and metrics**
   - Include baseline, positive benchmark, negative/mechanistic, and alternative-pathway controls.
   - Predefine metrics: conversion, selectivity, mass balance, structural confidence, reproducibility, and mechanistic agreement.
   - Predefine failure criteria (e.g., indistinguishable from background, irreproducible selectivity, ambiguous product identity).
   - **Decision Gate:** Proceed only if controls isolate the proposed cause and metrics are separable.

5. **Collect and validate evidence**
   - Confirm analytical validity (product identity before selectivity interpretation).
   - Execute the planned comparison and controls conceptually.
   - Record uncertainty, replicate status, and deviations.
   - **Stop Condition:** Stop if the model reaction is not reproducible, if safety constraints are exceeded, or if product identity is ambiguous.

6. **Analyze in layers**
   - Separate activity, selectivity, mass balance, and structural confidence.
   - Compare full-system results against controls; treat controls as hypothesis tests.
   - Use partial-conversion or stereochemical distribution data to distinguish dynamic kinetic behavior from simple kinetic resolution where relevant.
   - Integrate experimental trends with transition-state or computational reasoning only when models are consistent across multiple observations.
   - Group successful, failed, and untested substrates by steric, electronic, and coordination features to define scope boundaries.
   - **Decision Gate:** Continue only if converging evidence supports one hypothesis more strongly than alternatives.

7. **Iterate or terminate**
   - If evidence supports the hypothesis, formulate the next broader question and add boundary tests before scope expansion.
   - If activity and selectivity conflict, treat them as separate optimization axes and redesign the chiral environment or activation strategy.
   - If controls contradict the proposed pathway, revise the mechanism model or abandon the hypothesis.
   - If substrate failures cluster, convert them into boundary conditions rather than discarding them.
   - If results remain ambiguous after redesign, terminate the line and report boundary-limited conclusions.
   - **Iteration Rule:** Expand substrate scope only after the model system has reliable identity, selectivity, control, and reproducibility data.

8. **Bound claims and document provenance**
   - Distinguish direct observations from inferred mechanisms and speculative extensions.
   - State explicitly which substrate classes, catalyst families, and reaction contexts are supported, failed, or untested.
   - Label evidence by source: literature-supported, agent-inferred, or model-dependent.

# Output Format

When using this skill, produce:

1. **Research question** — One concise question, its scientific utility, and the gap it addresses.
2. **Hypothesis table** — For each hypothesis: claim, evidence strength, key assumptions, predicted observable, likely failure mode, minimal validation, and falsification criterion.
3. **Minimal validation plan** — Benchmark choice, primary variables, control set, evaluation metrics, and stop conditions.
4. **Analysis plan** — How to separate activity, selectivity, mass balance, and structural confidence; how to interpret controls and scope trends.
5. **Iteration plan** — Rules for updating, redesigning, expanding, or abandoning hypotheses based on possible outcomes.
6. **Validity and safety statement** — Confounders, reproducibility risks, boundary conditions, external validity limits, and non-operational safety constraints.

# Validation Gates

Before advancing to the next stage of the workflow, confirm:

- **Mechanistic discrimination:** The proposed controls can distinguish the primary hypothesis from background and alternative pathways.
- **Metric separation:** Conversion, yield, selectivity, and structural assignment are evaluated with independent evidence.
- **Analytical validity:** Product identity and stereochemical assignment are confirmed before interpreting selectivity.
- **Reproducibility:** Key observations are supported by repeated or independent readouts.
- **Scope boundary:** Substrate and catalyst claims are limited to tested or explicitly extrapolated classes.

# Claim Boundaries

- Treat a single successful benchmark or substrate class as evidence for a pattern, not proof of general utility.
- Separate demonstrated observations from inferred mechanisms and from speculative extensions to new substrate or catalyst families.
- Do not present agent-generated hypotheses as literature consensus.
- Downstream synthetic utility supports product value but does not validate broad catalytic scope.

# Failure Modes

Stop or redesign when:

- Product formation is indistinguishable from background controls.
- Partial-conversion or stereochemical data support a simpler mechanism (e.g., kinetic resolution) rather than the proposed dynamic or catalyst-controlled pathway.
- Product identity or stereochemical assignment is ambiguous.
- Key controls contradict the proposed catalyst-controlled or ligand-controlled pathway.
- Selectivity depends on uncharacterized impurities, reagent variability, or unstable intermediates.
- Results are irreproducible under the same qualitative setup.
- Safety, regulatory, or institutional constraints cannot be managed.
- Computational and experimental evidence diverge without a resolvable model error.

# Validity Checks

Before presenting a final proposal, verify:

- **Confounding:** Could background reaction, impurities, ligand displacement, or non-catalytic pathways explain the outcome?
- **Reproducibility:** Are key observations replicated and reported with uncertainty?
- **Boundary conditions:** Which substrate classes, activation handles, ligand types, and product families are tested, failed, or untested?
- **Statistical validity:** Are scope and selectivity claims supported by representative data rather than isolated examples?
- **Mechanistic validity:** Do control data, structural assignment, and converging models support the proposed pathway over alternatives?
- **Equilibration validity:** Where dynamic kinetic behavior is claimed, is fast intermediate interconversion plausible relative to the product-forming step?
- **External validity:** Is the source literature treated as one evidence point rather than field-wide consensus?
- **Safety validity:** Are all recommendations non-operational, facility-appropriate, and compliant with chemical safety requirements?

# Provenance

- Derived from cluster 3 / subcluster 3.0 (asymmetric catalysis, chiral ligand, and mechanism discovery).
- Synthesized from source skills: dykat-cp-coupling-research-design, chiral-ligand-exploration-workflow, nickel-asymmetric-catalysis-mechanism-design, asymmetric-catalysis-method-discovery, heterogeneous-catalyst-research-planner, atroposelective-annulation-research-planner, chiral-radical-cyclization-exploration, asymmetric-bronsted-acid-catalysis-exploration.
