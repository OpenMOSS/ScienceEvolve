---
name: sci-catalysis-asymmetric-catalysis-chiral-synthesis-hyp-ff4f40d8
description: A reusable end-to-end workflow for generating mechanism-driven hypotheses, designing minimal viable validation experiments with strong controls, and iteratively refining asymmetric catalysis and chiral synthesis research questions.
scienceevolve-title: "Asymmetric catalysis · asymmetric catalysis chiral synthesis hypothesis workflow"
scienceevolve-area: asymmetric-catalysis
---

## Purpose

This workflow skill enables an agent to translate literature insights and preliminary observations in asymmetric catalysis and chiral synthesis into structured, testable research programs. It guides hypothesis generation, minimal viable experimental validation, mechanistic analysis, and iterative model refinement without providing operational laboratory protocols.

## When to use

- When a user seeks to propose new catalytic reactions, substrate classes, ligand platforms, or stereocontrol strategies within asymmetric catalysis.
- When the task is to design a non-operational research plan—hypotheses, controls, metrics, and iteration logic—rather than to reproduce specific paper conditions.
- When available inputs include literature precedents, preliminary data, failed experiments, or mechanistic clues that need to be organized into a falsifiable exploration framework.

## Inputs required

- Target reaction class or synthetic objective (e.g., C–H functionalization, cross-coupling, cascade cyclization).
- Known catalyst/ligand architectures, substrate categories, and reported limitations.
- Available analytical and computational resources for characterization and modeling.
- Constraints: safety boundaries, regulatory scope, material availability, and institutional compliance limits.
- User priority: mechanistic understanding, selectivity control, scope expansion, or platform applicability.

## Core Workflow

1. **Problem Framing & Gap Identification**
   - Define the structural or synthetic value of the target transformation.
   - Map existing methods by activation mode, stereocontrol element, and substrate boundary.
   - Identify whether the gap is a mechanistic bottleneck (e.g., selectivity origin, intermediate stability) or merely an unexplored substrate.
   - *Decision Gate 1*: If the gap cannot be framed as a mechanism-addressable question, stop and reframe the research target.

2. **Mechanism-Driven Hypothesis Generation**
   - Decompose the overall transformation into falsifiable sub-hypotheses: stereocontrol origin, key intermediate connectivity, and efficiency/selectivity trade-offs.
   - Annotate each hypothesis with evidence strength (high / medium / low) and list critical assumptions.
   - Predict failure modes: background reaction, competitive pathway, catalyst deactivation, stereochemical erosion, or analytical artifact.
   - *Decision Gate 2*: If a hypothesis lacks falsifiable predictions or cannot be tested with available resources, refine or discard it before proceeding.

3. **Minimal Viable Validation Design**
   - Select a representative model substrate and a conservative boundary substrate to test feasibility and detectability.
   - Define conceptual variable axes: catalyst/ligand class, substrate electronic/steric properties, and process conditions (stated as categories, not specific operational parameters).
   - Institute a control hierarchy:
     - **Positive control**: a known system that validates detection of the target outcome.
     - **Negative control**: omission of the chiral source, catalyst, or key directing element to test dependence.
     - **Mechanistic probe**: structural or isotopic variants that distinguish competing pathways.
     - **Blank/background control**: assessment of non-catalytic degradation or analytical artifacts.
   - Predefine evaluation metrics: conversion, product formation, regio-/chemo-/enantioselectivity, mass balance, and reproducibility.
   - Predefine stop conditions: undetectable product, lack of selectivity dependence on chiral environment, indistinguishable positive/negative controls, or irreproducible signals.
   - *Decision Gate 3*: If the experimental design cannot distinguish the hypothesized mechanism from background or alternative pathways, redesign controls before execution.

4. **Evidence Generation & Structured Analysis**
   - Confirm product identity and stereochemistry by independent, cross-validated methods.
   - Construct a variable–outcome matrix linking catalyst/substrate features to results.
   - Layer mechanistic interpretation:
     - Direct evidence (intermediate observation, isotope incorporation).
     - Indirect evidence (selectivity trends, competition experiments).
     - Exclusionary evidence (ruling out background or alternative routes).
   - Visualize structure–performance relationships and failure boundaries.
   - *Decision Gate 4*: If results meet pre-defined success criteria, proceed to Phase 6 (Scope Boundary Testing). If not, proceed to Phase 5 (Iteration/Redesign).

5. **Iteration or Redesign**
   - Classify outcomes as: supports hypothesis, partially supports, refutes, or inconclusive.
   - Update the mechanistic model based on controls, byproduct profiles, and selectivity trends.
   - Adjust variable priority:
     - Activity failure → revisit activation mode or intermediate generation.
     - Selectivity failure → revisit chiral environment or substrate recognition model.
     - Scope failure → define applicability domain rather than expanding claims.
   - Decide: continue (loop to Phase 3 with updated model), pivot (loop to Phase 2 with new hypothesis), or terminate (core assumption falsified by orthogonal controls).
   - *Stop condition*: If multiple independent controls refute the central mechanistic premise, terminate the line and document boundary limits.

6. **Scope Boundary & Transferability Assessment**
   - Systematically vary substrate electronics, sterics, heteroatom content, and ligand architecture to map the applicability domain.
   - Conceptually assess downstream derivatization or platform value without claiming scalability or safety profiles.
   - Explicitly state extrapolation boundaries; prohibit generalizing from a single model system to the entire reaction class.
   - *Decision Gate 6*: If structure–performance trends do not support a coherent scope claim, narrow the claim to the validated domain.

7. **Synthesis & Documentation**
   - Compile the research question, hypothesis cards, evidence matrix, iteration log, and boundary statement.
   - Clearly tag each claim as literature-verified, inference-supported, or unverified hypothesis.

## Output Format

Deliverables must be organized as:

1. **Research Question**: One-sentence statement of the new transformation or selectivity challenge.
2. **Hypothesis Table**: 2–4 candidate hypotheses with evidence strength, critical assumptions, falsifiable predictions, and primary failure modes.
3. **Validation Plan**: Model system rationale, conceptual variable axes, control hierarchy, evaluation metrics, and stop conditions.
4. **Analysis Plan**: Data matrix structure, mechanistic layering strategy, visualization approach, and statistical/reproducibility requirements.
5. **Iteration Roadmap**: Decision rules for success, partial success, failure, and inconclusive results.
6. **Validity Checklist**: Confounding factors, control sufficiency, and extrapolation limits.
7. **Boundary Statement**: Distinction between verified evidence, agent inference, and unverified extrapolation.

## Validation Gates

- **Gate 1 (Framing)**: The gap must be expressible as a mechanism-addressable question.
- **Gate 2 (Hypothesis)**: Every active hypothesis must have falsifiable predictions and a defined evidence strength.
- **Gate 3 (Design)**: Controls must be able to distinguish the hypothesized mechanism from background and alternative pathways.
- **Gate 4 (Evidence)**: Results must be cross-validated and reproducible before scope expansion.
- **Gate 5 (Iteration)**: Model updates must be driven by controls, not by post-hoc optimization of successful cases only.
- **Gate 6 (Scope)**: Claims of generality require a structure–performance trend across multiple independent substrates or conditions.

## Claim Boundaries

- Do not present single-paper results as field consensus.
- Do not extrapolate operational conditions (temperature, pressure, stoichiometry, solvent identity) from literature to new substrates.
- Distinguish strictly between:
  - Observations reported in source literature.
  - Mechanistic inferences drawn by analogy.
  - Novel hypotheses proposed for the new research question.
- Avoid claims of clinical utility, manufacturing readiness, or environmental safety unless supported by dedicated validation outside this workflow.

## Failure Modes

- **Activity Failure**: Target transformation does not occur under the conceptual conditions tested.
- **Selectivity Failure**: Product forms but stereochemical or regiochemical control is absent or uncorrelated with the chiral environment.
- **Scope Misattribution**: A narrow successful case is incorrectly generalized without structure–performance support.
- **Mechanistic Misinterpretation**: Final product presence is mistaken as proof of the proposed catalytic cycle; intermediate or control evidence is ignored.
- **Reproducibility Failure**: Signals cannot be replicated across independent batches or analysts.
- **Analytical Artifact**: Apparent selectivity or conversion arises from detection bias, isomeric impurities, or sample degradation.

## Validity Checks

- **Confounding Factors**: Verify substrate purity, geometric isomer ratios, moisture/oxygen sensitivity, catalyst batch variability, and analytical calibration.
- **Control Sufficiency**: Confirm that positive, negative, mechanistic, and blank controls collectively isolate the variable of interest.
- **Reproducibility**: Require independent replication for key conclusions; report variance rather than best-case values.
- **Statistical Validity**: Predefine success criteria and outlier handling; avoid inferring universal rules from exploratory screens.
- **Mechanistic Consistency**: Ensure the proposed model explains both successful and failed experiments, including byproduct distributions.
- **Extrapolation Limits**: State explicit boundaries for substrate class, ligand type, and activation mode; flag any inference beyond the tested domain.

## Provenance

- Derived from cluster 2, subcluster 2.0 ("asymmetric-catalysis-chiral-synthesis-hypothesis-workflow").
- Synthesized from representative source skills:
  - `10.1002_anie.202210106` (asymmetric-catalysis-research-exploration)
  - `10.1055_s-0035-1560538` (asymmetric-catalysis-research-pattern)
  - `10.1021_jacs.4c05480` (asymmetric-alkene-cross-coupling-research)
  - `10.1002_anie.202215820` (asymmetric-catalysis-atroposelective-reaction-design)
  - `10.1002_anie.202408603` (asymmetric-catalysis-cascade-discovery)
  - `10.21203_rs.3.rs-155228_v1` (asymmetric-cascade-c-h-functionalization-research)
  - `10.1002_anie.201807749` (asymmetric-catalysis-chiral-scaffold-exploration)
  - `10.1021_ol0619157` (asymmetric-conjugate-reduction-research-skill)
