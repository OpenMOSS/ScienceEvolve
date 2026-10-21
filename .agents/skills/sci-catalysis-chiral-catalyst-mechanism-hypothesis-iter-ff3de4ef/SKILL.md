---
name: sci-catalysis-chiral-catalyst-mechanism-hypothesis-iter-ff3de4ef
description: A reusable end-to-end workflow for designing, validating, and iterating mechanism-driven hypotheses in asymmetric catalysis and chiral catalyst research.
scienceevolve-title: "Asymmetric catalysis · chiral catalyst mechanism hypothesis iteration"
scienceevolve-area: asymmetric-catalysis
---

# Purpose

Use this skill to transform an asymmetric catalysis or chiral catalyst problem into a rigorous, mechanism-centered research plan. It guides the generation of falsifiable hypotheses, design of minimal validation studies, control-first analysis, and iterative redesign without prescribing operational laboratory protocols or treating any single successful system as universal.

# When to use

Use when exploring new asymmetric transformations, chiral ligand or catalyst effects, stereocontrolled bond formations, site-selective functionalization, or mechanism-guided optimization. It applies to problems where the core challenge is distinguishing catalytic stereocontrol from background reactivity, mapping substrate scope boundaries, or linking catalyst structure to selectivity. Do not use for clinical recommendations, executable high-risk synthesis procedures, biological efficacy claims, or commercial valuation.

# Inputs required

- **Target transformation**: the desired bond formation and stereochemical outcome.
- **Candidate systems**: catalyst or ligand class, substrate families, and activation concept at a non-operational level.
- **Prior-art boundaries**: known methods, missing transformations, and identified limitations.
- **Available evidence**: literature context, preliminary observations, computational hypotheses, or analytical capabilities.
- **Evaluation priorities**: reactivity, enantioselectivity, diastereoselectivity, regioselectivity, chemoselectivity, catalyst turnover, functional-group tolerance, scalability, or stereochemical stability.
- **Constraints**: safety boundaries, reproducibility expectations, analytical access, and acceptable stop conditions.

# Core Workflow

Follow this ordered route from problem definition to bounded claim. At each gate, decide whether to proceed, iterate, or stop.

## 1. Define bottleneck and locate gap
- Identify whether the limiting factor is reactivity, stereocontrol, catalyst turnover, substrate scope, intermediate stability, or product isolation.
- Compare substrate classes, reagent categories, catalyst roles, and activation modes against prior art to expose the specific gap.
- **Gate**: If the bottleneck is not clearly mechanistic or cannot be addressed by catalyst or substrate redesign, stop and reformulate the research question.

## 2. Build mechanism-centered hypotheses
- For each candidate explanation, specify the activation partner, recognition partner, stereocontrol element, competing pathway, and boundary assumption.
- State expected benefit, key assumptions, minimal observable evidence, likely failure mode, and claim boundary.
- Assign evidence strength: **Strong** (multiple independent measurements), **Moderate** (one direct measurement plus coherent mechanism), **Weak** (analogy or indirect trends), or **Speculative** (undiscriminated model).
- **Gate**: If no hypothesis is falsifiable with the available design space, refine assumptions or stop.

## 3. Design minimal viable validation
- Select a representative test case that can report both feasibility and stereochemical outcome.
- Build a design matrix varying one dominant mechanistic factor at a time (e.g., catalyst geometry, ligand stereochemistry, substrate electronics or sterics, recognition motif).
- Define controls:
  - Baseline / no-catalyst control.
  - Benchmark or achiral catalyst control.
  - Altered-catalyst control (modifying the proposed stereocontrol element while keeping comparable chemistry).
  - Negative substrate control (weakening or removing the enabling feature).
  - Positive benchmark comparator when available.
  - Structural confirmation control (independent stereochemical assignment).
- Define metrics: conversion, selectivity (enantio, diastereo, regio), chemoselectivity, byproduct profile, reproducibility, and consistency with the mechanistic model.
- Predefine failure criteria (e.g., background-dominated reactivity, activity without selectivity, ambiguous assignment) and stop conditions.
- **Gate**: If controls cannot distinguish catalytic stereocontrol from background pathways, redesign before proceeding.

## 4. Execute and record observations
- Keep all plans at the research-design level; do not provide executable quantities, temperatures, equipment settings, or stepwise hazardous procedures.
- Record outcomes, deviations, confounders, and batch variability.

## 5. Analyze control-first
- Compare controls before interpreting substrate-scope trends.
- Separate reactivity from selectivity; separate observations from interpretations.
- Diagnose activity-selectivity tradeoffs:
  - High conversion with low selectivity → inspect background reaction and chiral-pocket design.
  - High selectivity with low conversion → inspect activation and substrate positioning.
  - Both weak → revisit whether the substrate possesses the enabling feature.
- Map substrate boundaries by grouping outcomes according to electronic, steric, and structural features; treat failures as mechanistic evidence.
- Use computational or structural models only to rationalize trends supported by controls.
- **Gate**: Is catalytic stereocontrol established? If no, return to hypothesis generation or validation redesign.

## 6. Discriminate mechanisms and update model
- Assign stereocontrol to a specific stage (activation, bond formation, catalyst turnover, product release) using orthogonal evidence.
- Update the hypothesis table: mark each as supported, weakened, or refuted.
- **Gate**: If site selectivity and stereoselectivity diverge, treat them as separable variables. If evidence remains ambiguous, flag uncertainty and design discriminating tests rather than forcing a single explanation.

## 7. Iterate or redesign
Apply decision rules based on outcomes:
- **Background dominates**: redesign to suppress or distinguish the uncatalyzed pathway before claiming catalytic control.
- **Active but racemic**: redesign the chiral environment; do not merely increase activation.
- **Selective but low turnover**: inspect activation, intermediate capture, or product release.
- **Narrow scope**: define the minimal enabling feature and narrow the claim; do not assert generality.
- **Product instability**: separate formation selectivity from post-formation stereochemical erosion.
- **Reproducibility poor**: tighten controls and analytical consistency before broadening claims.
- **Stop or pivot** when controls fail to establish stereocontrol, the stereocontrol element cannot be isolated from other variables, failures contradict the enabling mechanism, or safety and compliance constraints prevent meaningful validation.

## 8. Bound claims and define applicability
- State explicit limits: applicable substrate class, catalyst class, transformation type, and analytical context.
- Distinguish verified observations from inferred extensions.
- **Final gate**: Confirm that no claim exceeds the tested or justified boundary.

# Output Format

Produce the following deliverables:

1. **Research question** — the missing transformation, target stereochemical motif, and main bottleneck.
2. **Gap analysis** — prior-art comparison by substrate, reagent, activation mode, and stereocontrol mechanism.
3. **Mechanism model** — activation partner, recognition partner, stereocontrol element, competing pathway, and boundary assumption.
4. **Hypothesis table** — each hypothesis with evidence strength, key assumptions, minimal validation, likely failure mode, and claim boundary.
5. **Minimal validation plan** — design matrix, controls, metrics, failure criteria, and stop conditions.
6. **Analysis plan** — control-first interpretation rules, substrate boundary mapping, activity-selectivity tradeoff diagnosis, and uncertainty labeling.
7. **Iteration plan** — decision rules linking each major outcome to a redesign action.
8. **Validity and safety notes** — confounders, reproducibility checks, claim boundaries, and non-operational safety constraints.

# Validation Gates

- **Gap validity**: Is the missing transformation clearly defined relative to prior art?
- **Mechanistic validity**: Does the hypothesis explain both reactivity and stereocontrol?
- **Control validity**: Are baseline, benchmark, altered-catalyst, negative-substrate, and structural-confirmation controls included and interpreted together?
- **Metric validity**: Are reactivity, selectivity, reproducibility, and product identity evaluated separately?
- **Reproducibility**: Are repeated trials or uncertainty reporting included for selectivity, scope, or mechanism claims?
- **Boundary validity**: Are claims limited to the tested or justified substrate, catalyst, and transformation class?

# Claim Boundaries

- Do not extrapolate beyond the tested substrate class, catalyst scaffold, or reaction manifold.
- Do not infer biological, pharmaceutical, environmental, or commercial value from synthetic accessibility or stereochemical success alone.
- Distinguish paper-supported evidence from agent-inferred hypotheses for new systems.
- Treat single-source success as bounded precedent, not field-wide consensus.
- Avoid presenting one successful scaffold or substrate as a domain-wide rule.

# Failure Modes

- Background reaction dominates over catalytic stereocontrol.
- High conversion with low enantioselectivity or diastereoselectivity.
- High selectivity in a narrow case but low conversion or poor turnover.
- Catalyst decomposition, product racemization, or post-formation stereochemical erosion.
- Ambiguous product identity or stereochemical assignment.
- Narrow substrate scope without a mechanistic explanation.
- Irreproducible selectivity or conversion across replicate trials.
- Confounding by additives, solvent effects, impurities, or substrate self-reaction.

# Validity Checks

- **Confounders**: Consider background reaction, catalyst decomposition, substrate impurities, solvent effects, catalyst poisoning, product instability, and analytical bias.
- **Mechanistic evidence**: Require at least two independent evidence streams before assigning a stereocontrol mechanism or stereodetermining step.
- **Stereochemical confirmation**: Support stereochemical claims with orthogonal structural and analytical evidence.
- **Uncertainty labeling**: Mark conclusions as directly observed, paper-supported, mechanistically inferred, or speculative.
- **Consensus discipline**: Treat any single source paper as one evidence source, not as field-wide consensus.

# Provenance

- Synthesized from cluster **24.1** (asymmetric-catalysis-chiral-catalyst-mechanism-discovery-workflow), workflow archetype: observable-driven mechanism discovery and validation.
- Derived from representative source skills:
  - `10.1002_anie.202415623` — strained-imine-asymmetric-addition-design
  - `10.1021_jacs.9b04803` — asymmetric-catalyst-method-design
  - `10.1007_bf00961233` — asymmetric-amino-acid-synthesis-exploration
  - `10.1002_anie.202210456` — atroposelective-stepwise-synthesis-design
  - `10.1002_chem.201900762` — chiral-tdg-rhodium-catalysis-exploration
  - `10.1002_ange.202415787` — asymmetric-catalysis-reaction-discovery
  - `10.1002_anie.201913733` — asymmetric-ch-activation-tdg-exploration
  - `10.1002_cjoc.70060` — metallaphotoredox-radical-relay-catalysis-exploration
