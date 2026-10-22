---
name: sci-aqueous-aqueous-electrolyte-interface-mechanism-dis-04802a03
description: A reusable end-to-end workflow for generating, discriminating, and validating mechanistic hypotheses about aqueous electrochemical interfaces through staged controls, multi-scale evidence, and iterative failure diagnosis.
scienceevolve-title: "Aqueous battery interfaces · aqueous electrolyte interface mechanism discovery workflow"
scienceevolve-area: aqueous-battery-interfaces
---

## Purpose

This skill guides an agent through an observable-driven, end-to-end mechanism discovery and validation workflow for aqueous electrochemical interfaces. It translates system-level failure modes into falsifiable, multi-scale hypotheses; designs staged validation with matched controls; and iterates by diagnosing which causal link fails. The workflow preserves transferable scientific reasoning while excluding material-specific recipes, operational protocols, and paper-specific conclusions.

## When to use

Use this skill when the user needs to:

- Propose new research questions around aqueous electrolyte or electrode interface stability, transport, deposition uniformity, or side-reaction mechanisms.
- Design non-operational experiments that link molecular or interfacial structure to device-level behavior.
- Discriminate among competing mechanisms using control comparisons and orthogonal evidence.
- Iterate a study plan based on multi-scale evidence and explicit failure diagnosis.

Do not use this skill for operational laboratory protocols, hazardous synthesis or cell-assembly instructions, clinical applications, or treating a single paper result as field-wide consensus.

## Inputs required

Before generating a plan, request or infer:

- **Target system class** and primary failure mode (e.g., unstable deposition, parasitic reaction, transport loss, interfacial degradation).
- **Observable bottleneck** and its device-level consequence.
- **Candidate mechanism categories or design levers** (described functionally, not by proprietary material names).
- **Available evidence classes** (e.g., spectroscopy, imaging, transport diagnostics, electrochemical testing, simulation).
- **Constraints**: safety boundaries, equipment access, environmental limits, scalability, or compatibility requirements.
- **Desired validation scale**: model interface, half-cell, full-cell, or integrated device.

If critical inputs are missing, state assumptions explicitly and downgrade the evidence strength of resulting hypotheses.

## Core Workflow

Follow this ordered route. Do not skip stages or escalate to more complex configurations before the mechanism is supported at the current scale.

### 1. Frame the bottleneck and map coupled failure modes

State the practical limitation as an observable failure mode. Identify which functions are coupled and may trade off (e.g., transport versus stability, rate capability versus durability). Map the failure mode to a plausible scale of origin: molecular environment, interfacial structure, transport pathway, or device integration.

**Decision gate:** If the bottleneck cannot be expressed as a mechanism-addressable, observable failure mode, stop and redefine the research question.

### 2. Generate ranked mechanistic hypotheses

Produce at least two competing or alternative hypotheses per candidate intervention using the structure:

> If [design variable] changes [local interaction], then [interfacial/molecular proxy] should shift, producing [device-relevant consequence] under [boundary conditions].

For each hypothesis record:

- **Evidence strength**: weak, moderate, or strong.
- **Key assumptions**: what must be true for the mechanism to operate.
- **Predicted coupled benefits**: which functions should improve together.
- **Likely failure modes**: how the hypothesis could fail without disproving the broader direction.
- **Disconfirming observations**: what result would weaken or reject the hypothesis.

**Decision gate:** If hypotheses are not falsifiable or lack observable mechanism proxies, return to Stage 1.

### 3. Design staged validation with matched controls

Define independent, dependent, and controlled variables at a non-operational level. Specify a minimum viable validation sequence with:

- **Baseline**: unmodified comparator matched on all non-target properties.
- **Negative control**: condition that disrupts the proposed mechanism.
- **Positive/orthogonal control**: known benchmark or descriptor-mismatched variant when available.
- **Process/interface control**: to separate handling, formation, or geometry effects from material effects.

Define multi-scale metrics:

- **Molecular/interfacial**: structure, speciation, adsorption, or coordination change.
- **Transport**: mobility, desolvation, or conductivity trend.
- **Electrochemical**: reversibility, polarization, side-reaction indicators.
- **Device integration**: performance retention, compatibility, or durability under realistic assembly.

**Stop condition:** Redesign if the experiment cannot falsify the central mechanism, or if safety or compliance risks are unacceptable.

### 4. Collect multi-scale evidence

Gather orthogonal evidence streams (e.g., structural, spectroscopic, transport, electrochemical) at the smallest scale that can test the mechanism. Do not escalate to more realistic cell configurations until the mechanism is supported.

**Decision gate:**
- If evidence is weak or relies on a single stream, add an orthogonal measurement before proceeding.
- If evidence contradicts the hypothesis, stop and proceed to Stage 7.

### 5. Discriminate mechanisms via control-normalized analysis

Attribute effects to the proposed mechanism only when:

- the modified condition outperforms the matched baseline (not literature benchmarks alone);
- mechanism proxies co-vary with performance changes;
- negative or orthogonal controls show attenuated or absent effects;
- confounders (loading, surface area, protocol, impurities, geometry) are ruled out.

Require at least two independent evidence streams to claim mechanism support.

**Decision gate:** If controls are insufficient or confounders remain unaddressed, classify the claim as provisional and return to Stage 3.

### 6. Functional validation and stress testing

Escalate to increasingly realistic configurations and boundary conditions only after mechanism support. Test robustness under cycling, temperature variation, current demand, or mechanical stress.

**Decision gate:**
- If the mechanism survives integration and stress, proceed to Stage 8.
- If integration fails despite mechanism support, pivot to architecture or interface redesign and return to Stage 2.
- If stress reveals a new bottleneck, treat it as the revised failure mode and return to Stage 1.

### 7. Iterate by failure diagnosis

Identify the broken causal link: molecular environment, interfacial structure, transport, electrochemical stability, device integration, or reliability. Revise only the failed link, preserve matched baselines, and update evidence strength.

**Iteration rules:**
- Mechanism absent but performance improved → revise hypothesis to an alternative mechanism.
- Mechanism present but device fails → investigate integration, compatibility, or mass balance.
- Mechanism and performance both fail → abandon the descriptor and return to Stage 2.

Return to Stage 3 with the revised hypothesis and updated stop conditions.

### 8. Finalize claim boundaries and documentation

State explicit extrapolation limits: chemistry, operating regime, cell architecture, and scale. Separate source-supported observations, transferable abstractions, and new inferences.

**Stop condition:** Finalize when the mechanism is validated across scales with strong controls, or when the hypothesis is falsified and no viable alternative remains.

## Output Format

When using this skill, return:

1. **Research question framing**: bottleneck, coupled functions, and shared molecular or interfacial origin.
2. **Ranked hypotheses table**: mechanism, evidence strength, key assumptions, predicted benefits, failure modes, and disconfirming observations.
3. **Minimum viable validation plan**: variables, controls, multi-scale metrics, and stop conditions.
4. **Multi-scale analysis plan**: how molecular, interfacial, electrochemical, device, and boundary-layer evidence will be interpreted and triangulated.
5. **Iteration roadmap**: decision rules for keep, refine, pivot, or abandon after each result pattern.
6. **Claim boundary statement**: explicit extrapolation limits and unresolved assumptions.
7. **Validity and safety notes**: confounders, reproducibility checks, and non-operational safety boundaries.

## Validation Gates

- **Baseline comparability**: modified and baseline systems differ only in the intended variable.
- **Mechanism consistency**: structural, transport, and electrochemical data tell a coherent story.
- **Control adequacy**: negative, positive, and perturbation controls are sufficient to test causality.
- **Orthogonal triangulation**: at least two independent evidence streams support the mechanism.
- **Reproducibility**: trends are consistent across independently prepared samples; variability is reported.
- **Statistical validity**: metrics are pre-defined, exclusions are transparent, and uncertainty is documented.
- **Integration survival**: component-level improvements persist in the target system architecture under realistic conditions.

## Claim Boundaries

- Claims are limited to the tested system class and operating regime.
- Mechanism claims require control-normalized evidence, not performance improvement alone.
- Evidence from model interfaces or half-cells is not automatically transferable to full-device behavior.
- Single-system observations are not presented as field-wide consensus.
- Analogies to prior systems are labeled as inferences requiring independent validation.

## Failure Modes

- Mechanism is not observed despite performance improvement, indicating an alternative explanation.
- Performance improves on one metric but degrades a critical coupled metric.
- Component-level success fails upon device integration due to architecture or interface mismatch.
- Results depend on uncontrolled variability, batch effects, or undocumented process details.
- Mechanism appears in early diagnostics but collapses under extended stress or realistic boundaries.
- Confounding by surface area, loading, morphology, impurities, or protocol differences.
- Safety or compatibility risks emerge that preclude practical advancement.

## Validity Checks

- Are hypotheses causal, measurable, and falsifiable?
- Are comparisons matched and normalized consistently?
- Are negative controls successful in isolating the proposed mechanism?
- Are alternative mechanisms actively considered and tested against?
- Are boundary conditions (temperature, current, concentration, geometry) stated explicitly?
- Are reproducibility, sample grouping, and uncertainty documented?
- Are safety, environmental, and ethical constraints addressed at the design level?
- Is the provenance of each claim (source-derived vs. new inference) clearly marked?

## Provenance

- Derived from cluster 33, subcluster 33.0: observable-driven mechanism discovery and validation.
- Synthesized from source skills: wearable-electrochemical-material-design (f78eb991732cbd96), azib-3dp-research-design (6c2afa28a88e3a7b), molecular-crowding-electrolyte-research (a1e3dd1a22b3aaab), mxene-zib-research-workflow (9cce29d0485e9028), aqueous-zinc-sei-research-workflow (ff576ece8c420f03), interface-field-electrochemical-research (dabaffbd0eb1a9a1), weakly-solvating-electrolyte-research-pattern (5d74b5b103927088), photopolymerized-solid-electrolyte-research (17ee5e428d066e29).
- Source-specific materials, numerical results, and operational protocols have been removed to produce a transferable workflow abstraction.
