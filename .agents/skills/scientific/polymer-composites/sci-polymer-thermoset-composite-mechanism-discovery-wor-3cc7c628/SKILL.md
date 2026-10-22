---
name: sci-polymer-thermoset-composite-mechanism-discovery-wor-3cc7c628
description: Use this skill to design end-to-end research plans for discovering and validating mechanisms in thermoset, vitrimer, and composite systems through observable-driven hypothesis generation, control-rich experiments, and iterative evidence triangulation.
scienceevolve-title: "Polymer composites and vitrimers · thermoset composite mechanism discovery workflow"
scienceevolve-area: polymer-composites-and-vitrimers
---

# Purpose

Convert a materials performance gap, defect, or durability limitation into a testable mechanism-discovery research plan for networked polymer systems. This skill abstracts a reusable pattern: frame the problem around observables; generate mechanism-linked hypotheses with explicit assumptions and failure modes; design minimal validation with matched controls; triangulate multi-scale evidence; and iterate until the mechanism is supported, falsified, or bounded.

# When to use

Use this skill when the task is to:

- Propose new research questions for thermosets, vitrimers, dynamic covalent networks, or fiber-reinforced composites.
- Investigate interface-mediated, network-dynamic, chemical-transformation, or processing-chemistry mechanisms.
- Design experiments where a property, defect, or durability limitation suggests a hidden causal chain.
- Compare localized versus bulk enhancement, adaptive versus permanent networks, or sequential versus single-stage processes.
- Iterate after conflicting, non-monotonic, weak, or confounded evidence.

Do not use this skill as a substitute for domain-specific safety review, operational protocol design, equipment operation, or field consensus statements.

# Inputs required

Before generating a research plan, ask for or infer the following:

- **Target material class:** thermoset, vitrimer, dynamic covalent network, composite, adhesive, coating, or printed network.
- **Observable gap:** the measurable defect, property loss, durability limit, or recyclability bottleneck.
- **Candidate mechanism class:** interface load transfer, network dynamics, chemical exchange, environmental ingress, or processing-chemistry coupling.
- **Available characterization categories:** thermal, spectroscopic, microscopic, mechanical, rheological, interfacial, or morphological methods.
- **Constraints:** safety, environmental, regulatory, cost, scalability, or reuse-cycle requirements.
- **Claim level:** mechanism validation, material comparison, application feasibility, or lifecycle assessment.

If key inputs are missing, state assumptions explicitly and label resulting hypotheses as speculative until validated.

# Core Workflow

Follow this ordered route. Do not skip decision gates.

## 1. Frame the observable gap
State the performance limitation or defect in measurable terms. Identify whether the bottleneck lies in network dynamics, interfacial load transfer, chemical transformation, environmental ingress, or processing history. Map the gap to a falsifiable mechanism question rather than a desired outcome alone.

- **Decision gate:** Stop and refine if the gap cannot be expressed as a falsifiable mechanism question.

## 2. Generate ranked mechanism hypotheses
Build causal chains linking a controllable feature (e.g., network architecture, interface condition, modification placement, trigger selectivity, or stage separation) to the observed outcome. For each hypothesis specify:

- Evidence strength: strong / moderate / weak / speculative.
- Key assumptions: compatibility, localization, accessibility, or stability requirements.
- Predicted orthogonal signatures: expected changes across chemical, microstructural, and functional measurements.
- Likely failure modes: network disruption, poor localization, phase separation, excessive mobility, defect formation, or measurement artifact.

- **Decision gate:** Discard hypotheses that are not testable with available characterization or that rely on a single metric.

## 3. Design minimal viable validation (MVV)
Define sample families that isolate the mechanism:

- Baseline and unmodified controls.
- Modified or treated targets.
- Process-only and formulation-only variants.
- Orthogonal controls that isolate individual pathways.
- Negative and positive controls where scientifically justified.

Select:

- Independent variables: modification level, placement, chemistry class, or exposure condition.
- Mediating variables: conversion, uptake, interfacial state, or network heterogeneity.
- Dependent variables: retention ratio, defect density, recovery metric, or durability proxy.

Predefine primary endpoints, success criteria, and stop conditions before data collection.

- **Decision gate:** Redesign if controls cannot separate the mechanism from confounders such as batch variation, cure history, void content, or processing artifacts.

## 4. Collect orthogonal evidence
Gather data across at least three layers:

- Chemical / dynamic evidence: bond exchange, conversion, species presence, or reaction progress.
- Microstructural / interfacial evidence: morphology, voids, contact quality, or phase distribution.
- Macroscopic / functional evidence: mechanical, thermal, barrier, or application-relevant metrics.

Maintain consistent processing history and handling across all groups.

- **Stop condition:** Halt if safety, environmental, or compliance boundaries are breached; if baseline properties degrade beyond predefined tolerance; or if replicate variability overwhelms the experimental effect.

## 5. Triangulate and grade mechanism support
Compare evidence streams and assign a mechanism grade:

- **Strong:** convergent trends across chemical, microstructural, and functional metrics with adequate controls.
- **Moderate:** functional trend supported by partial mechanism evidence.
- **Weak:** only one metric changes or controls are incomplete.
- **Contradictory:** evidence streams conflict.

- **Decision gate:** If strong, proceed to boundary definition. If weak or contradictory, identify competing mechanisms and iterate.

## 6. Iterate or pivot
Update the mechanism map based on the graded evidence:

- **Primary mechanism supported:** Broaden conditions to test boundaries (e.g., repeated cycles, alternative environments, or composite transfer).
- **Evidence contradictory:** Add discriminating diagnostics or revise the hypothesis to address confounding.
- **No effect observed:** Verify localization or activation first, then test alternative chemistry or placement.
- **Non-monotonic response:** Treat as a competing-mechanism signal and design a targeted discriminator experiment.

- **Stop condition:** Stop after a predefined number of iterations, if the mechanism remains unresolved, or if the next experiment cannot falsify the leading hypothesis.

## 7. Bound claims and define transfer limits
Explicitly state what is demonstrated, what is inferred by analogy, and what remains speculative. Limit claims to the tested material class, processing window, and measurement set. Separate mechanism validation from application readiness, regulatory compliance, or field-wide consensus.

# Output Format

When using this skill, return the following structure:

1. **Research question and observable gap**
   - Mechanism-focused question.
   - Target material class and bottleneck.

2. **Mechanism map and ranked hypotheses**
   - Causal chain from controllable feature to outcome.
   - Evidence strength, assumptions, predicted signatures, and failure modes for each hypothesis.

3. **Experimental design**
   - Minimal viable validation.
   - Sample families and controls.
   - Independent, mediating, and dependent variables.
   - Primary and secondary metrics.
   - Stop conditions and failure criteria.

4. **Analysis plan**
   - Evidence layers and triangulation rules.
   - Mechanism grading criteria.
   - Statistical and reproducibility checks.

5. **Iteration plan**
   - Decision rules for success, partial success, failure, and contradiction.
   - Next discriminating experiment for each outcome.

6. **Validity and boundary statement**
   - Confounding checks.
   - Reproducibility requirements.
   - Generalization limits.
   - Safety and ethics constraints.

# Validation Gates

Before advancing past each stage, confirm:

- **Scope gate:** The question targets one clear mechanism in one material class.
- **Hypothesis gate:** Hypotheses are falsifiable and mechanism-linked, not outcome-only.
- **Control gate:** Baseline, negative, process, orthogonal, and positive controls are included where feasible.
- **Confounding gate:** Modification amount, localization, processing state, and environment are not collapsed into a single factor.
- **Mechanism gate:** At least one measurement supports the proposed mediator.
- **Reproducibility gate:** Independent replicates and variability estimates are included.
- **Statistical gate:** Primary metrics and analysis rules are predefined.
- **Safety gate:** Safety, environmental, and compliance constraints are satisfied before any execution.

# Claim Boundaries

- Distinguish source-supported patterns from new inferences and speculative extrapolations.
- Do not present single-system or single-paper evidence as field-wide consensus.
- Limit mechanistic claims to the tested chemistry, architecture, processing route, and environment.
- Separate mechanism demonstration from manufacturing readiness, biocompatibility, structural qualification, or sustainability certification.
- Avoid claiming long-term service life from short-term or single-condition exposure without validated models.

# Failure Modes

- Modifier cannot be verified at the intended location or interface.
- Required baseline properties degrade beyond predefined tolerance.
- Improvements appear only under a narrow condition without mechanism support.
- High modification levels cause defects, instability, or conflicting property trends.
- Dynamic or adaptive behavior improves but functional recovery does not.
- Evidence streams conflict, indicating competing or artifact-driven mechanisms.
- Process or batch variability dominates over the experimental effect.
- Safety, environmental, or compliance constraints prevent controlled execution.

# Validity Checks

Before finalizing a research plan or conclusion, verify:

- **Mechanistic specificity:** The proposed feature is directly responsible for the observed behavior.
- **Control adequacy:** Baselines and analogues rule out non-mechanistic explanations.
- **Reproducibility:** Trends are supported by independent replicates or repeated batches.
- **Boundary conditions:** Service, trigger, and test environments are clearly separated.
- **Confounding control:** Composition, cure history, void content, geometry, and handling are addressed.
- **Statistical validity:** Differences exceed measurement variability and uncertainties are reported.
- **External validity:** Stronger claims require independent systems, longer exposure, or coupled loading.
- **Evidence labeling:** Every hypothesis is marked as source-supported, transferable analogy, or speculative inference.

# Provenance

- Synthesized from Cluster 40 / Subcluster 40.0.
- Derived from source skills: recyclable-thermoset-network-exploration, adaptive-network-recyclable-thermosets, sequential-thermoset-exploration, bio-based-thermoset-cell-resin-research, interface-durability-composite-exploration, recyclable-diw-dynamic-network-exploration, recyclable-thermoset-composite-workflow, hidden-volatile-composite-exploration.
- Source-specific chemistries, parameters, and conclusions have been abstracted; only the reusable workflow pattern is retained.
