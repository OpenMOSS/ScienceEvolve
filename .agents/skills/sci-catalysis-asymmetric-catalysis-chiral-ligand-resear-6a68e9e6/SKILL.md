---
name: sci-catalysis-asymmetric-catalysis-chiral-ligand-resear-6a68e9e6
description: End-to-end research design workflow for asymmetric catalysis and chiral ligand/methodology exploration, from gap definition through hypothesis generation, minimal viable validation, mechanistic analysis, and iterative route refinement.
scienceevolve-title: "Asymmetric catalysis · asymmetric catalysis chiral ligand research design workflow"
scienceevolve-area: asymmetric-catalysis
---

## Purpose

Help an agent translate advances in asymmetric catalysis and chiral methodology into reusable, non-operational research design frameworks. The skill guides the generation of new research questions, falsifiable mechanistic hypotheses, structured validation plans, and iterative analysis while enforcing evidence boundaries, safety constraints, and clear separation of literature-derived patterns from new inferences.

## When to use

- When a user needs to design a new study in asymmetric catalysis, chiral synthesis, stereoselective control, ligand/platform development, or stereodivergent construction.
- When the task involves proposing research questions, generating hypotheses, planning variable matrices and controls, interpreting selectivity data, or iterating on mechanistic models—not when executing laboratory operations.
- When inputs include literature patterns, candidate scaffolds, or methodological gaps that must be turned into an analyzable, evidence-graded plan.

## Inputs required

- **Target reaction class or scaffold**: The stereochemical challenge, desired chiral product class, or transformation type (e.g., asymmetric hydrogenation, cycloaddition, cross-coupling, atropisomer synthesis).
- **Methodological gap**: Specific bottleneck such as enantioselectivity, diastereoselectivity, regioselectivity, substrate scope, functional-group tolerance, step economy, or downstream derivatizability.
- **Candidate strategies or motifs**: Candidate catalyst/ligand classes, chiral sources, activation modes, or mechanistic hypotheses drawn from literature or prior data.
- **Analytical and resource boundaries**: Available characterization capabilities, safety/compliance limits, and evidence-quality expectations.
- **Output granularity**: Whether the user needs a full research package, a focused hypothesis matrix, or an iteration plan.

## Core Workflow

1. **Gap Definition & Problem Scoping**
   - Identify the synthetic value of the target scaffold and translate the general "method is insufficient" observation into a precise bottleneck (activity, selectivity type, scope limitation, or practicality).
   - Define the stereochemical element(s) to be controlled and the minimum acceptable evidence standard.
   - **Decision Gate**: Is the gap attributable to an identifiable stereochemical or mechanistic bottleneck? If no, stop and refine the research question.

2. **Hypothesis Generation & Prioritization**
   - Map the bottleneck to abstract strategy classes (e.g., chiral-environment tuning, sequential stereocontrol, substrate-directed activation, modular ligand design, dynamic kinetic resolution).
   - Generate 2–5 candidate hypotheses. Each entry must include:
     - Evidence strength (strong / medium / weak).
     - Key assumptions about catalyst–substrate recognition, transition-state organization, or intermediate stability.
     - Falsifiable predictions observable in minimal experiments.
     - Primary failure modes (e.g., racemization, mismatched control, competing background reaction, analytical ambiguity).
     - Extrapolation boundary relative to literature-verified patterns.
   - **Decision Gate**: Are the hypotheses distinguishable by a minimal viable experiment set? If no, decompose or merge hypotheses before proceeding.

3. **Minimal Viable Validation Design**
   - Select a model substrate set: (i) one representative substrate, (ii) one electronic or steric variant, and (iii) one geometric or conformational variant.
   - Establish a variable hierarchy:
     - Primary: catalyst/ligand scaffold, metal center, chiral source, substrate core.
     - Secondary: solvent class, additive type, concentration/temperature regime.
     - Readout: conversion, product profile, unreacted substrate recovery, stereoselectivity metrics, mass balance, byproduct spectrum.
   - Design a control matrix:
     - **Positive control**: known competent system to confirm detectability.
     - **Negative control**: absence of the chiral/inducing element to quantify background.
     - **Strong control**: structural variant expected to selectively abolish or alter the outcome to test specificity.
     - **Mechanistic control**: competition, intermediate probe, stereochemical inversion, or time-course experiment to distinguish pathways.
   - Pre-register primary/secondary evaluation metrics and stop conditions.
   - **Decision Gate**: Does the design avoid operational recipes, hazardous parameters, and unsafe procedural detail while including non-operational safety boundaries? If no, revise.

4. **Evidence Generation & Structured Analysis**
   - Execute or coordinate experiments; record a structured data matrix (substrate × catalyst × environment × outcome).
   - Verify data completeness: conversion, identified products, unreacted substrate, byproducts, stereochemical assignment, and mass balance.
   - Infer selectivity source by correlating catalyst/ligand variation, substrate electronic/steric trends, and control outcomes. Distinguish catalyst control, substrate control, matching/mismatching, and environmental effects.
   - Map results onto a mechanistic model (e.g., stereodetermining step, chiral recognition site, intermediate lifetime, product locking).
   - Flag anomalies and retain alternative explanations; do not force-fit data to a single narrative.
   - **Decision Gate**: Are the analytical results internally consistent and repeatable? If no, halt and diagnose methodology before interpreting mechanism.

5. **Result Classification & Branching**
   - Classify the outcome:
     - **Support**: Metrics meet targets; controls corroborate the assumed mechanism; results are repeatable.
     - **Partial support**: Activity or selectivity is observed but mechanism is unclear or scope is narrow.
     - **Contradiction**: Results falsify the core prediction or controls invalidate the assumed mechanism.
     - **Inconclusive**: Data are insufficient due to analytical limits, irreproducibility, or safety interruption.
   - Choose the path:
     - Support → proceed to scope expansion or downstream utility validation.
     - Partial support → enter targeted iteration (Step 6).
     - Contradiction → return to Step 2 to pivot the hypothesis or redesign the core strategy.
     - Inconclusive → stop and address data-quality gaps.

6. **Iteration or Redesign**
   - Update the hypothesis matrix: retain elements supported by multiple independent observations; weaken conclusions resting on single substrates or conditions; discard explanations contradicted by controls or time-course data.
   - Design the next round to test the highest-uncertainty assumption using orthogonal experiments (e.g., competition experiments, alternative substrate classes, modified chiral environments, computational probes).
   - **Stop conditions** (trigger exit to Step 7):
     - Target product is undetectable despite validated analytics.
     - Selectivity remains at background without trend across key variables.
     - Substrate decomposition or uncontrolled side reactions dominate.
     - Mechanistic evidence conflicts with no testable correction hypothesis.
     - Safety, compliance, or reproducibility boundaries are reached.
   - **Decision Gate**: Has a stop condition been met? If yes, document failure mode and boundary; if no, return to Step 4 with updated plan.

7. **Boundary Definition & Knowledge Packaging**
   - Consolidate the validated substrate/ligand scope, applicable selectivity types, and mechanism consistency.
   - Explicitly separate literature-derived patterns from project-specific inferences, labeling evidence strength for each claim.
   - Package outputs into the structured format defined below.

## Output Format

Each invocation must produce:

1. **Research Question**: One-sentence definition of the new problem and its methodological value.
2. **Gap Analysis**: Existing route limitations and the specific bottleneck addressed.
3. **Hypothesis Matrix**: Table of candidate hypotheses with evidence strength, key assumptions, falsifiable predictions, failure modes, and extrapolation boundaries.
4. **Experimental Design**: Model substrate rationale, variable hierarchy, control matrix (positive, negative, strong, mechanistic), evaluation metrics, and stop conditions.
5. **Analysis Plan**: Data matrix structure, selectivity-source inference rules, anomaly handling, mechanism mapping, and statistical/reproducibility requirements.
6. **Iteration Plan**: Decision rules for continue, modify, pivot, or stop based on result classification.
7. **Validity and Safety Notes**: Confounders, reproducibility standards, extrapolation boundaries, and non-operational safety/compliance reminders.

## Validation Gates

- **Scoping Gate**: The gap must be expressible as a stereochemical or mechanistic bottleneck before hypothesis generation proceeds.
- **Distinguishability Gate**: Hypotheses must be resolvable by the proposed minimal viable experiments; overlapping predictions require redesign.
- **Safety Gate**: Experimental designs must remain non-operational; no hazardous parameters, reagent handling instructions, or fabrication recipes are included.
- **Quality Gate**: Analytical results must show internal consistency, mass balance accountability, and repeatability before mechanistic interpretation proceeds.
- **Evidence Gate**: Claims must be tagged with evidence strength; single-substrate or single-condition observations cannot support broad scope claims.

## Claim Boundaries

- **Allowed**: Claims about research design logic, variable prioritization, control necessity, selectivity-source inference, mechanism consistency, and evidence grading.
- **Prohibited**: Claims that a specific catalyst, ligand, substrate, or condition will universally succeed; claims of clinical, biological, or materials application value without dedicated validation; claims that literature patterns from one paper constitute field consensus.
- **Required distinction**: Explicitly label "literature-derived pattern" versus "new inference for this project."

## Failure Modes

- **Overfitting to a single substrate/condition**: Treating an isolated high-selectivity result as a general mechanism without cross-validation.
- **Mechanism-first bias**: Interpreting yields or selectivity through an unverified mechanistic lens before controls exclude alternative pathways.
- **Analytical artifact**: Attributing apparent selectivity to impurities, calibration errors, incomplete mass balance, or post-reaction racemization/epimerization.
- **Undistinguishable hypotheses**: Designing experiments where multiple mechanisms predict the same outcome, preventing falsification.
- **Scope overreach**: Extrapolating from a narrow ligand/substrate set to dissimilar scaffolds or reaction classes without boundary testing.
- **Safety bypass**: Drifting from non-operational research design into prescriptive hazardous protocols.

## Validity Checks

- **Confounders**: Verify that selectivity changes are not artifacts of substrate purity, catalyst batch variation, solvent differences, analytical calibration, or post-reaction degradation.
- **Reproducibility**: Key selectivity outcomes require independent repetition; screening results must not be presented as optimized results.
- **Mass balance**: Unaccounted material signals uncharacterized byproducts or decomposition that can invalidate selectivity interpretations.
- **Statistical rigor**: Scope conclusions require grouped comparisons across electronic, steric, and functional-group categories; avoid generalizing from single exemplars.
- **Mechanistic consistency**: Experimental trends, control outcomes, time-course data, and any computational evidence must mutually support the proposed model; conflicting evidence demands alternative explanations.
- **Extrapolation discipline**: New substrates, ligand scaffolds, metals, or reaction environments require re-validation; do not assume transferability from literature analogies alone.

## Provenance

- Synthesized from cluster 6 / subcluster 6.0 ("asymmetric-catalysis-chiral-ligand-research-design-workflow").
- Derived from source skills: `p-stereogenic-catalysis-exploration`, `asymmetric-hydrogenation-sequential-catalysis`, `asymmetric-catalysis-workflow-design`, `organoboron-cross-coupling-research-workflow`, `atropisomer-research-design`, `stereodivergent-asymmetric-cycloaddition-research`, `asymmetric-ir-hydrogenation-ligand-discovery`, `rhodium-vinylcarbenoid-cyclopropanation-research`.
- Paper-specific conclusions, operational protocols, and numerical results from the source literature have been excluded per the merge definition.
