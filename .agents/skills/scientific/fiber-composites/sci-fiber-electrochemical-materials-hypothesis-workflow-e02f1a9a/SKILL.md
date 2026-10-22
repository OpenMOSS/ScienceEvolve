---
name: sci-fiber-electrochemical-materials-hypothesis-workflow-e02f1a9a
description: A reusable end-to-end workflow for generating, testing, and iterating mechanism-driven hypotheses in electrochemical energy storage systems with coupled interfacial and transport failure modes.
scienceevolve-title: "Fiber composites and battery materials · electrochemical materials hypothesis workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

## Purpose

Help an agent translate performance bottlenecks into falsifiable mechanistic hypotheses, design minimum viable validations with strong controls, analyze multi-modal evidence chains, and iterate under explicit stop conditions—without reproducing paper-specific conclusions or operational protocols.

## When to use

- The user is exploring new materials, interfaces, binders, electrolytes, or host structures in electrochemical energy conversion/storage systems.
- The task requires moving beyond literature summaries to generate testable hypotheses and experimental matrices.
- The user needs mechanism attribution, not just performance benchmarking, and wants explicit iteration rules for supported, partially supported, or unsupported hypotheses.

## Inputs required

1. **Target system and research stage**: Concept screening, material substitution, structural optimization, mechanism validation, or pre-scale assessment.
2. **Performance bottleneck**: Capacity fade, active species loss, interfacial degradation, transport limitation, mechanical failure, or coupled failure modes.
3. **Candidate interventions**: Material classes, structural motifs, or interface designs with hypothesized functions.
4. **Available capabilities**: Characterization and testing techniques accessible for mechanism probing.
5. **Constraints**: Safety boundaries, cost, repeatability targets, equipment limits, and data-quality standards.

## Core Workflow

1. **Bottleneck-to-Mechanism Decomposition**  
   Translate the performance gap into observable mechanistic failure nodes (e.g., active species isolation, interfacial side reactions, ion/electron transport blockage, mechanical fracture).  
   *Decision gate*: If the bottleneck cannot be expressed as at least two distinct mechanistic nodes, stop and refine the problem statement.

2. **Functional Requirement Mapping**  
   Map each failure node to a functional requirement (e.g., confinement, conductivity, interfacial stability, mechanical compliance). Identify trade-offs between requirements.  
   *Decision gate*: If requirements are mutually exclusive and no trade-off hypothesis is proposed, flag the scope as infeasible and narrow.

3. **Hypothesis Formulation & Prioritization**  
   For each candidate intervention, build a causal chain: intervention attribute → mechanistic action → observable intermediate → performance prediction.  
   Annotate every hypothesis with evidence strength (high / medium / low), key assumptions, and predicted failure modes.  
   *Decision gate*: Reject hypotheses that lack a falsifiable prediction or a discriminatory experimental test.

4. **Minimum Viable Validation Design**  
   Select the smallest sample set and measurement suite that can test the core mechanism.  
   Establish a control hierarchy: baseline, negative (missing target function), positive (known effective reference), decoupled (single-function variants), and structural (morphology-matched but functionally inert).  
   *Decision gate*: If the control hierarchy cannot isolate the proposed mechanism from confounding effects, redesign before execution.

5. **Data Quality Screening**  
   Before analysis, audit repeatability, batch consistency, normalization basis, outlier handling rules, and missing data.  
   *Decision gate*: If data quality checks fail predefined thresholds, stop analysis and require remeasurement or additional replicates.

6. **Mechanism Attribution & Evidence Closure**  
   Populate a mechanism evidence matrix linking structure, interface chemistry, transport, and performance. Attribute effects to specific variables using the control hierarchy.  
   *Decision gate*: If performance improvement is not supported by at least one orthogonal mechanism indicator, label it as a phenomenological association, not a validated mechanism.

7. **Iteration or Termination**  
   - **Supported**: Proceed to boundary testing (scalability, full-system integration, long-term stability).  
   - **Partially supported**: Refine the hypothesis, identify the dominant contribution, and design a sharper decoupling experiment.  
   - **Not supported**: Halt the line; audit for confounders, then pivot to a new hypothesis or intervention class.  
   - **Hard stop conditions**: (a) safety or compliance risk; (b) repeatability failure across independent batches; (c) performance inferior to baseline with unacceptable cost or side effects; (d) inability to decouple variables after two experimental rounds.

8. **Boundary Documentation**  
   Record evidence strength, applicable system boundaries, and any unverified extrapolations.

## Output Format

The agent shall produce:

1. **Reframed research question**: Bottleneck expressed in mechanistic terms.
2. **Candidate hypothesis table**: Hypothesis, causal chain, evidence strength, key assumptions, predicted failure modes.
3. **Minimum viable validation plan**: Core variables, control hierarchy, primary metrics, and stop conditions.
4. **Analysis plan**: Data quality checks, mechanism evidence matrix, control attribution logic, and causal visualization.
5. **Iteration decision tree**: Actions for supported, partially supported, unsupported, and inconclusive outcomes.
6. **Validity and boundary statement**: Confounders, repeatability requirements, extrapolation limits, and compliance reminders.

## Validation Gates

- **Pre-analysis data quality**: Repeatability, normalization, and outlier handling must pass before mechanism interpretation.
- **Control sufficiency**: At least one negative and one decoupled control must be present to claim mechanism specificity.
- **Mechanism consistency**: Orthogonal characterization signals must converge; contradictory signals trigger a pause.
- **Statistical validity**: Predefined primary metrics and sample sizes must be reported with dispersion; post-hoc cherry-picking invalidates the gate.
- **Extrapolation boundary**: Claims about scalability, full-system behavior, or cross-system transfer require independent verification.

## Claim Boundaries

- Distinguish observed correlation from mechanistic causation.
- Distinguish single-study or single-system evidence from domain consensus.
- Distinguish lab-scale observations from system-level performance or safety promises.
- Do not present unverified extrapolations as validated conclusions.

## Failure Modes

- **Confounding**: Uncontrolled variables (loading, porosity, conductivity, assembly differences) mimic or mask the target mechanism.
- **Misattribution**: Missing decoupled controls lead to assigning composite effects to a single variable.
- **Metric overfitting**: Optimizing one performance indicator while ignoring mechanism indicators or cost metrics.
- **False positives**: Batch variability, selective reporting, or insufficient replication produces spurious improvements.
- **Premature scale-up**: Extending lab-scale conclusions to integrated systems without boundary testing.

## Validity Checks

- **Confounding factors**: Record and control or covary loading, thickness, porosity, interface area, electrolyte amount, and test conditions.
- **Repeatability**: Require independent batches or replicates; report variance and failure samples transparently.
- **Statistical handling**: Define primary metrics and exclusion rules before data collection.
- **Mechanism consistency**: Demand convergence across at least two orthogonal techniques before accepting a mechanistic claim.
- **Fair comparison**: Normalize for comparable test windows, loading, and protocols when benchmarking against literature or baseline.
- **Extrapolation limits**: State explicitly whether conclusions apply only to the tested cell format, load range, and cycle window.

## Provenance

- Synthesized from cluster `24.1` (`sulfur-battery-binder-lithium-hypothesis-workflow`).
- Derived from source skills: `lithium-sulfur-battery-binder-exploration`, `li-s-coupled-electrode-research`, `li-metal-interphase-exploration`, `lean-electrolyte-battery-additive-research`, `li-s-battery-binder-exploration`, `lis-s-cathode-functional-layer-exploration`, `quasi-solid-li-span-electrolyte-design`, `li-s-battery-bifunctional-host-exploration`.
