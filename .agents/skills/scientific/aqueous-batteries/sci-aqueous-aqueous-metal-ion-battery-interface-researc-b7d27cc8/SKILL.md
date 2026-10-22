---
name: sci-aqueous-aqueous-metal-ion-battery-interface-researc-b7d27cc8
description: End-to-end research design workflow for aqueous metal-ion battery interfaces and materials, covering hypothesis generation, controlled experiment design, multi-scale mechanism validation, and iterative redesign.
scienceevolve-title: "Aqueous battery interfaces · aqueous metal ion battery interface research workflow"
scienceevolve-area: aqueous-battery-interfaces
---

## Purpose

Migrate methodological patterns from literature to new research questions in aqueous metal-ion battery interfaces and materials. The workflow focuses on generating falsifiable hypotheses, designing controlled validation experiments, closing multi-scale mechanism evidence chains, and iterating based on structured decision gates. It is not for summarizing papers, providing operational recipes, or executing hazardous procedures.

## When to use

Use this skill when the task involves:
- Proposing new research questions for aqueous battery interfaces, electrodes, or electrolyte systems.
- Generating mechanism-driven hypotheses about ion transport, interfacial stability, structural degradation, or deposition behavior.
- Designing experiments with explicit controls, stop conditions, and evaluation metrics.
- Analyzing mechanism evidence across scales (bulk, interface, morphology, device) and iterating on research design.
- Distinguishing literature-derived methodological heuristics from new-system inferences.

Do not use this skill for:
- Paper summaries, terminology explanations, or result recitation.
- Direct experimental execution, synthesis recipes, device assembly instructions, or safety-critical operational parameters.
- Research questions unrelated to electrochemical energy storage interfaces or materials.

## Inputs required

Before starting, gather or clarify:
- **Target system**: Battery chemistry class, electrode configuration, electrolyte type, and device format.
- **Dominant failure modes**: Capacity fade, rate limitation, cycling instability, interface degradation, or side-reaction accumulation.
- **Candidate interventions**: Structural modifications, interfacial layers, electrolyte additives, or host-engineering strategies.
- **Available capabilities**: Characterization and testing methods accessible for structure, interface, kinetics, morphology, and device performance.
- **Baseline/comparator systems**: Unmodified references, known effective strategies, and functional-null analogues.
- **Constraints**: Safety, compliance, reproducibility, resource limits, and extrapolation boundaries.

If inputs are incomplete, output a "missing information and impact" assessment before generating hypotheses.

## Core Workflow

### 1. Decompose Failure Modes and Map Mechanisms
Identify the dominant performance bottleneck and decompose it into candidate mechanisms: bulk ion transport, interfacial side reactions, host structural degradation, deposition morphology evolution, or electrolyte environment effects. Map each mechanism to at least one measurable intermediate variable.

**Decision Gate 1 — Mechanism Clarity**: If failure modes cannot be linked to measurable intermediate variables, stop and request additional system information.

### 2. Generate and Rank Falsifiable Hypotheses
Formulate hypothesis chains: intervention → structural/interfacial change → intermediate variable change → performance outcome. Assign evidence strength (Strong, Moderate, Weak, Speculative) based on proximity to direct verification. State key assumptions, falsification criteria, and minimal validation requirements for each hypothesis.

**Decision Gate 2 — Falsifiability**: If no hypothesis can be tested with available resources and controls, return to Step 1 or stop.

### 3. Design Controlled Validation Experiments
Define independent variables (intervention type, functional module, placement), dependent variables (mechanism proxies, performance metrics, stability indicators), and potential confounders. Construct a control hierarchy:
- **Baseline**: unmodified system.
- **Negative control**: inert or functional-null analogue.
- **Single-factor control**: isolates individual mechanism modules.
- **Positive control**: known effective strategy to confirm assay sensitivity.
- **Mechanism control**: alternative mechanism to test attribution specificity.
- **Full-device control**: tests translation from subsystem to complete device.

Preset stop/failure criteria before data collection: safety breach, irreproducibility, negative control matching experimental group, performance gain without mechanism evidence, or full-device translation failure.

**Decision Gate 3 — Control Sufficiency**: If the design cannot isolate the target mechanism from confounders (morphology, loading, conductive network, test conditions), redesign before proceeding.

### 4. Close the Mechanism Evidence Chain
Collect multi-scale evidence: bulk/environment state → interface/interphase state → local morphology/deposition state → device performance state. Verify that upstream changes propagate to downstream outcomes through independently measured intermediates. Conduct ablation analysis by removing functional modules to test necessity and synergy.

**Decision Gate 4 — Mechanism Consistency**: If evidence across scales is contradictory or the chain is broken, flag the weakest link and proceed to Step 5. Do not advance claims beyond the best-supported link.

### 5. Iterate or Redesign Based on Outcomes
- **Mechanism supported and robust**: Proceed to boundary declaration. Add robustness checks (cross-batch, cross-condition, full-device) and define applicability limits.
- **Mechanism unsupported**: Diagnose whether failure stems from incorrect mechanism, ineffective intervention, or flawed model. Return to Step 2 or Step 3.
- **Structural control matches functional intervention**: Re-attribute the effect from specialized mechanisms to general structural effects. Redesign with more sensitive intermediate variables.
- **Full-device translation fails**: Diagnose cross-component effects. Restrict claims to the validated subsystem and treat full-device performance as a new research question.
- **Safety or reproducibility barrier**: Stop and output a risk/boundary assessment without operational recommendations.

**Stop Conditions**: Hypothesis is falsified, validated under declared boundaries, or blocked by safety/compliance/resource limits.

### 6. Package Output with Boundary Declaration
Assemble the research question, ranked hypothesis table, experimental design, analysis plan, iteration log, and validity checklist. Explicitly separate literature-derived methodological patterns from agent-generated inferences for the new target system. State applicability boundaries (material class, ion type, electrolyte environment, device format, test window).

## Output Format

The workflow produces a structured research package:

1. **Research Question & Mechanism Decomposition** — Target system, dominant failure mode, candidate mechanisms, and measurable intermediate variables.
2. **Candidate Hypothesis Table** — For each hypothesis: statement, mechanism chain position, evidence strength, key assumptions, possible failure modes, and minimal validation requirements.
3. **Experimental Design** — Independent and dependent variables, control hierarchy, evaluation metrics, and pre-defined stop/failure criteria.
4. **Analysis Plan** — Multi-scale evidence chain, ablation logic, data interpretation rules, and conclusion grading (Verified / Partially Supported / Speculative / Unsupported).
5. **Iteration Strategy** — Conditional next steps for each outcome class (mechanism supported, unsupported, structurally confounded, translation failed, safety barrier).
6. **Validity & Boundary Statement** — Confounding controls, reproducibility plan, statistical validity, extrapolation limits, and safety/compliance boundaries.

## Validation Gates

- **Mechanism Clarity**: Failure modes must be mapped to measurable intermediate variables before hypothesis generation.
- **Control Sufficiency**: Experiments must include baseline, negative, single-factor, positive, mechanism, and full-device controls sufficient to isolate the target mechanism.
- **Reproducibility**: Key results require independent repeats, cross-batch checks, and explicit reporting of failed or negative cases.
- **Mechanism Consistency**: Evidence from bulk, interface, morphology, and performance scales must converge on the same causal chain; contradictions trigger redesign.
- **Statistical Validity**: Report variability, sample size, and uncertainty; avoid strong conclusions from single samples or single curves.
- **Boundary Declaration**: Applicable material classes, ion types, electrolyte environments, device formats, and test windows must be explicitly stated before finalizing claims.

## Claim Boundaries

- Distinguish **literature-verified methodological patterns** from **agent-generated inferences** applied to the new target system.
- Treat single-study or single-system results as method heuristics, not field consensus.
- Performance improvements require supporting mechanism evidence; correlation alone does not establish causation.
- Interface- or half-cell-level results do not automatically extend to full-device performance without dedicated translation validation.
- Claims must be graded: *Verified*, *Partially Supported*, *Speculative*, or *Unsupported*.

## Failure Modes

- **Confounding Dominance**: Performance differences arise from uncontrolled variables rather than the target mechanism.
- **Missing Mechanism Evidence**: Performance improves, but intermediate proxies do not support the causal chain.
- **Translation Failure**: Benefits observed at the interface or half-cell level disappear in full-device configurations.
- **Over-Interpretation**: A single-scale or single-metric improvement is generalized as full mechanism validation.
- **Safety or Compliance Barrier**: Required validation would demand hazardous operational parameters or non-compliant procedures.
- **Irreproducibility**: Results depend on single samples, batches, or test conditions without declared uncertainty.

## Validity Checks

- **Confounding Control**: Ensure comparison groups are matched in preparation, area, coverage, contact, assembly, and testing framework.
- **Reproducibility**: Require independent repeats, cross-batch consistency, and documentation of negative or failed cases.
- **Statistical Validity**: Pre-define sample size, replication, error representation, and stopping rules; reject cherry-picked metrics.
- **Mechanism Consistency**: Verify that structure, interface, kinetics, and morphology evidence converge on the same mechanism; flag contradictions for redesign.
- **Boundary Conditions**: Explicitly state limits for ion type, electrode configuration, electrolyte environment, device format, and operating window.
- **Extrapolation Limits**: Label literature-derived patterns as heuristics; label new-system claims as inferences requiring independent verification.

## Provenance

- Synthesized from cluster **21**, subcluster **21.0**.
- Source skills: `07453f5540eff862` (zinc-ion-cathode-research-workflow), `bc7bb57fa2f35db3` (aqueous-multivalent-ion-battery-cathode-design), `c8c33e52e9ed0174` (aqueous-metal-anode-interface-research-workflow), `63a1441cd4458a22` (field-guided-zinc-interface-research-workflow), `31696805043d3006` (zinc-anode-solvent-sheath-research-workflow), `38ca2852e3cb4202` (intercalation-host-stabilization-workflow), `6850429114834f8e` (interface-engineered-aqueous-battery-research-workflow), `d636374707c2fd1d` (aqueous-zinc-anode-interface-research-workflow).
