---
name: sci-catalysis-asymmetric-catalysis-mechanism-discovery-e0f358c2
description: A reusable end-to-end workflow for proposing, validating, and iterating mechanism-driven hypotheses in asymmetric catalysis and chiral catalyst design.
scienceevolve-title: "Asymmetric catalysis · asymmetric catalysis mechanism discovery workflow 9"
scienceevolve-area: asymmetric-catalysis
---

## Purpose

Use this skill to transform an asymmetric catalysis or stereocontrolled transformation problem into a structured, evidence-based research workflow. It guides the generation of falsifiable mechanism hypotheses, design of minimal validation experiments, orthogonal analysis, and iterative model refinement without embedding any single paper’s specific chemistry, numerical results, or operational protocols.

## When to use

- When exploring a new asymmetric transformation, chiral ligand or catalyst concept, or stereocontrolled functionalization.
- When selectivity may arise from coupled chiral elements such as ligand chirality, metal-centered chirality, substrate prochirality, conformational ensembles, or diastereomeric active species.
- When the user needs to distinguish activation from stereocontrol, or to map substrate-scope boundaries mechanistically.
- When designing a computational–experimental workflow to test competing stereoisomeric pathways.
- When turning a synthetic bottleneck into a ranked set of testable hypotheses with clear stop conditions.

Do not use this skill to provide executable synthesis recipes, hazardous reagent handling, process-scale instructions, clinical recommendations, or directly operational laboratory procedures.

## Inputs required

- Target transformation class and the specific selectivity, reactivity, or stability bottleneck.
- Candidate catalyst or ligand scaffolds described at a conceptual level (e.g., coordination mode, chiral element placement, cooperative motif).
- Substrate families that define intended scope and mechanistic edge cases.
- Prior benchmark systems or literature baselines for comparison.
- Available analytical and characterization capabilities (e.g., stereochemical assignment, spectroscopic probes, kinetic resolution, computational modeling).
- Safety, compliance, and resource constraints for the intended research setting.

## Core Workflow

1. **Frame the bottleneck and research question**  
   Convert a broad synthetic gap into a precise, mechanistic question (e.g., which structural feature controls stereoselectivity across substrate classes).  
   **Decision gate:** Is the bottleneck tractable with the available conceptual and analytical tools? If no, refine the question or stop.

2. **Enumerate hidden stereochemical degrees of freedom**  
   Map all plausible chiral elements: ligand chirality, metal-centered chirality, substrate prochirality, coordination orientation, conformational ensembles, and diastereomeric active species.  
   **Decision gate:** Have all plausible stereoisomers and active-species variants been considered? If no, expand the model before generating hypotheses.

3. **Generate ranked, mechanism-linked hypotheses**  
   For each candidate design or mechanism, produce: claim, evidence strength (strong / moderate / weak / speculative), key assumption, minimal validation, likely failure mode, and boundary condition.  
   **Decision gate:** Are hypotheses falsifiable with a small set of orthogonal checks? If no, reformulate until a clear falsification condition exists.

4. **Design minimal viable validation**  
   Select one representative model case that exposes the bottleneck. Define a design matrix varying one dominant mechanism variable at a time. Specify controls: baseline or background, achiral or component-only, negative (mechanism-weakening), positive benchmark, and analytical validation.  
   **Decision gate:** Do controls isolate the proposed mechanism from background reactivity, speciation, and decomposition? If no, redesign the control set.

5. **Collect orthogonal evidence**  
   Gather complementary data types: conversion and selectivity trends, stereochemical assignment, spectroscopic or kinetic probes, and/or computational descriptors such as adsorption, transition-state ensembles, or pathway energetics.  
   **Decision gate:** Is the analytical basis matched across all comparisons? If no, normalize conditions before interpreting trends.

6. **Analyze and discriminate mechanisms**  
   Normalize comparisons; separate kinetic from thermodynamic effects; decompose selectivity into steric, electronic, and conformational contributions; flag outliers; test mechanistic consistency against controls.  
   **Decision gate:** Do observations clearly support, weaken, or refute each hypothesis? If ambiguous, identify missing probes and return to Step 5.

7. **Update the model and iterate or stop**  
   Revise the active-species and stereocontrol model based on evidence.  
   **Iteration rule:** If the core claim is supported by at least two independent evidence types, proceed to bounded scope expansion.  
   **Stop conditions:** Background reaction dominates; reproducible selectivity cannot be achieved; controls contradict the mechanism; active-species model remains unsupported; safety constraints are exceeded. If stopping, archive negative results as boundary conditions.

8. **Define claim boundaries and preserve negative evidence**  
   Explicitly state which substrate classes, catalyst families, mechanism models, and environmental conditions are supported versus extrapolated. Record failed substrates, ligand classes, or mechanistic variants to prevent selective curation.

## Output Format

When using this skill, produce:

1. **Research question:** concise bottleneck, gap, and target reaction class.
2. **Mechanism model:** candidate active species, competing pathways, and selectivity-determining variables.
3. **Hypotheses table:** claim, evidence strength, key assumption, minimal validation, likely failure mode, and boundary.
4. **Minimal validation plan:** model case, design matrix, controls, metrics, and stop conditions.
5. **Analysis plan:** normalization rules, orthogonal evidence to combine, mechanism-update logic, and uncertainty handling.
6. **Iteration plan:** decision rules for redesign, expansion, or stopping.
7. **Validity and boundary statement:** confounders, reproducibility requirements, scope boundaries, and non-operational safety constraints.

## Validation Gates

- The bottleneck is defined as a mechanistic question, not a novelty claim.
- All plausible stereoisomeric and conformational degrees of freedom have been enumerated.
- Each hypothesis includes a falsification condition and a boundary condition.
- Controls isolate the target mechanism from background, speciation, and decomposition.
- Evidence is orthogonal: at least two independent measurement types support each core claim.
- Comparisons are normalized across substrate class, catalyst descriptor, and analytical method.
- Reproducibility is demonstrated for benchmark, negative-control, and representative new results.
- Boundary conditions are stated before scope expansion.

## Claim Boundaries

- Distinguish "paper-validated," "literature-supported," "agent-inferred," and "speculative" claims explicitly.
- A single study’s outcome does not establish a field-wide rule; treat source papers as one evidence source among many.
- Do not transfer exact catalysts, solvents, loadings, or substrate classes from literature to new problems without revalidation.
- Do not claim clinical, pharmaceutical, environmental, or commercial readiness from catalytic performance alone.
- Do not reuse numerical results, yields, or selectivity values from source papers as expected targets for new systems.

## Failure Modes

- **Background dominance:** The reaction proceeds without chiral induction, making selectivity uninterpretable.
- **Near-racemic selectivity:** High conversion is mistaken for high stereocontrol.
- **Active-species misassignment:** The observed outcome is attributed to the wrong catalyst form, aggregate, or in situ transformation.
- **Insufficient conformational coverage:** A single transition-state geometry is used when an ensemble model is required.
- **Unmatched controls:** Comparisons lack baseline, achiral, or negative comparators, confounding mechanism attribution.
- **Premature scope expansion:** Substrate scope is broadened before the core mechanism claim is validated.
- **Overgeneralization:** A trend observed for one substrate or catalyst family is extrapolated to untested classes.
- **Reproducibility failure:** Key trends do not hold across independent batches or repeated measurements.

## Validity Checks

- **Confounding factors:** Account for reagent purity, catalyst speciation, moisture or oxygen sensitivity, batch effects, aggregation, analytical misassignment, and impurity-driven reactivity.
- **Metric validity:** Report conversion, yield, selectivity, and stereochemical assignment separately; do not infer utility from a single metric.
- **Mechanistic validity:** Require at least two independent evidence types before assigning a stereocontrol or activation mechanism.
- **Reproducibility:** Demand independent repeats for benchmark, negative-control, and representative new results.
- **Boundary conditions:** Define where conclusions apply (substrate class, catalyst family, medium, mechanism model) and where they are extrapolated.
- **Consensus discipline:** Treat any single paper as one evidence source, not as field-wide consensus.
- **Evidence labeling:** Tag every claim as direct observation, inferred mechanism, or speculative extension.

## Provenance

Derived from cluster 11, subcluster 11.1 (observable-driven mechanism discovery and validation). Synthesized from source skills: `asymmetric-catalysis-research-exploration` (10.1021/jo1000516), `chiral-cycloaddition-amino-acid-exploration` (10.1002/anie.200602801), `asymmetric-catalysis-method-development` (10.1002/anie.201006595), `chiral-phosphine-ligand-discovery` (10.1016/s0040-4039(97)10098-x), `organocatalytic-atropisomer-platform-exploration` (10.1002/anie.202004671), `carbon-single-atom-co2-reduction-exploration` (10.1021/acsami.4c08499), `flp-asymmetric-hydrogenation-research-design` (10.1002/cctc.201402838), and `diastereomeric-chiral-catalyst-exploration` (10.1021/jacs.5c10820).
