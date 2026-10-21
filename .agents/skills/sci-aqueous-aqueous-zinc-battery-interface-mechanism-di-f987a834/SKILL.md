---
name: sci-aqueous-aqueous-zinc-battery-interface-mechanism-di-f987a834
description: A reusable end-to-end workflow for generating mechanism-driven hypotheses, designing discriminating validation experiments, and iterating interfacial mechanisms in aqueous metal-battery research.
scienceevolve-title: "Aqueous battery interfaces · aqueous zinc battery interface mechanism discovery workflow"
scienceevolve-area: aqueous-battery-interfaces
---

## Purpose

Help an agent generate new research questions, design mechanism-guided experiments, analyze converging multi-stream evidence, and iterate hypotheses for interfacial instability in aqueous metal-battery systems. The workflow abstracts a transferable route: define a failure mode, map candidate mechanisms, generate selective hypotheses, build minimal discriminating validations, evaluate evidence against controls, and decide whether to escalate, refine, or stop.

## When to use

Use this skill when the user asks to:
- Explore new research questions around aqueous metal-battery anodes, cathodes, electrolytes, or interphases where deposition uniformity, corrosion, side reactions, or transport limitations are suspected.
- Design studies that connect solvation structure, ion transport, interface regulation, and morphology or electrochemical response.
- Evaluate additive, buffer, coating, separator, or electrolyte-modification concepts via mechanism-first hypotheses rather than empirical screening.
- Plan analysis workflows that combine electrochemical data with visual, morphological, structural, chemical, or spectroscopic evidence.
- Iterate after mixed, contradictory, or inconclusive results, or when a single metric improvement is insufficient to claim mechanism.

## Inputs required

Before generating a plan, ask for or infer:
- **Target system**: metal anode or cathode family, electrolyte class, electrode geometry, and intended device context (half-cell, symmetric, or full-cell).
- **Suspected failure mode**: nonuniform deposition, dendrite growth, corrosion, gas evolution, passivation, interphase instability, contact loss, or rapid performance decay.
- **Available evidence**: literature scope, preliminary data, known constraints, and characterization access.
- **Proposed intervention class**: solvation regulator, interface adsorbate, surface film, separator strategy, electrolyte additive, or architecture change.
- **Readout capabilities**: electrochemical testing, visual observation, microscopy, spectroscopy, diffraction, impedance, or chemical analysis.
- **Safety and compliance boundaries** relevant to the institution and materials.

If any input is missing, state assumptions explicitly and label the resulting plan as provisional.

## Core Workflow

1. **Frame the failure mode and mechanism space**
   - Define the dominant failure mode in one sentence.
   - Map candidate mechanisms: ion transport, solvation structure, interfacial adsorption, nucleation, crystal growth, side reactions, local field distribution, mechanical stress, or coupled degradation.
   - **Gate**: Is the failure mode observable and separable from bulk or device-level limitations? If no, refine the problem scope before proceeding.

2. **Generate ranked, selective hypotheses**
   - Produce 3–5 testable hypotheses. Each must include:
     - mechanistic rationale (transport, solvation, interface, growth, or reaction pathway);
     - evidence strength (weak / moderate / strong / insufficient);
     - key assumption;
     - predicted observation;
     - likely failure mode;
     - falsification criterion.
   - Prefer hypotheses that are mechanistically selective over those that only promise better performance.
   - **Gate**: Do hypotheses predict specific observables rather than generic improvement? If no, reformulate.

3. **Design minimal viable validation (MVV)**
   - Define study arms:
     - **Baseline control**: same system without the proposed regulating factor.
     - **Single-factor controls**: test each proposed mechanism or component separately.
     - **Negative control**: inert or nonfunctional analogue.
     - **Positive control**: known stabilizing condition, used only to verify that the platform can detect stabilization.
     - **Artifact control**: check whether observation setup, geometry, or measurement mode creates misleading trends.
   - Define independent variables (intervention, system context) and dependent variables (electrochemical, morphological, chemical, structural, transport).
   - State success and failure criteria, plus stop conditions, before evaluation.
   - **Gate**: Does the MVV isolate the primary mechanism from confounding variables? If no, simplify the design.

4. **Collect multi-stream evidence**
   - Acquire data across at least two independent evidence streams (e.g., electrochemical + morphological, or chemical + structural).
   - Record metadata, batch identity, and environmental context.
   - **Gate**: Is data quality sufficient (controls matched, variance acceptable, no obvious artifacts)? If no, pause and resolve before analysis.

5. **Evaluate via evidence matrix**
   - For each evidence stream, record:
     - what it should show if the hypothesis is correct;
     - confounding explanation;
     - decision (support / weaken / contradict / inconclusive).
   - Aggregate outcomes:
     - **Supported**: predictions and controls align across ≥2 streams.
     - **Weakened**: some evidence supports the claim but key predictions fail.
     - **Contradicted**: controls or orthogonal data falsify the claim.
     - **Inconclusive**: evidence streams conflict, variance is high, or controls are insufficient.
   - **Gate**: Is the outcome conclusive? If inconclusive, flag missing controls or measurements and return to Step 3 or 4.

6. **Mechanism attribution and ablation**
   - Compare the full intervention against simplified variants that remove one functional motif at a time.
   - Use morphology-matched or chemistry-ablation controls to distinguish interphase chemistry from processing artifacts.
   - **Gate**: Does the effect disappear when the proposed mechanism is disabled? If no, revise the mechanism map and return to Step 2.

7. **Boundary translation and full-cell relevance**
   - Test whether half-cell or interface-level insights survive under realistic coupling: matched loading, electrolyte amount, counter-electrode state, and device format.
   - Use post-cycling diagnostics to separate anode-driven, cathode-driven, electrolyte-driven, and assembly-driven degradation.
   - **Gate**: Does the mechanism remain dominant in the coupled system? If no, investigate cross-talk or secondary degradation before claiming practical relevance.

8. **Iterate or terminate**
   - **If supported**: escalate to broader validation (longer-term stability, wider boundary conditions) or propose the next ablation study.
   - **If weakened**: refine the hypothesis (e.g., shift from transport limitation to nucleation/growth or local field effects) and return to Step 3.
   - **If contradicted**: reject the hypothesis and return to Step 2 to generate alternatives.
   - **If inconclusive**: add orthogonal characterization or redesign the observation platform, then return to Step 4.
   - **Stop conditions** (terminate and redesign):
     - irreversible side reactions dominate;
     - impedance rises without structural explanation;
     - controls explain the observed effect;
     - simplified controls perform similarly to the full concept;
     - full-cell improvement disappears under matched conditions;
     - reproducibility fails across independent preparations;
     - safety or ethical boundaries are breached.

## Output Format

When using this skill, produce:

1. **Research question** — one concise question tied to a failure mode.
2. **Mechanism map** — proposed interphase or interface functions and the evidence needed to support each link.
3. **Hypothesis table** — columns: hypothesis, mechanistic rationale, evidence strength, key assumption, predicted observation, likely failure mode, falsification criterion.
4. **Validation plan** — MVV, strong controls, negative/positive/artifact controls, evaluation metrics, and stop conditions.
5. **Evidence matrix template** — streams, expected signatures, confounders, and decision rules.
6. **Iteration plan** — explicit decision rules for supported, weakened, contradicted, and inconclusive outcomes.
7. **Validity and boundary statement** — confounders, reproducibility needs, normalization assumptions, extrapolation limits, and non-operational safety constraints.
8. **Evidence classification** — label each claim as directly supported, transferable inference, or speculative for the target system.

## Validation Gates

- **Mechanism selectivity**: Hypotheses must predict specific observables and falsifiable signatures, not just generic performance improvement.
- **Control adequacy**: Baseline, negative, positive, artifact, and ablation controls must be defined before data collection.
- **Multi-stream convergence**: Mechanism claims require alignment across at least two independent evidence streams.
- **Reproducibility**: Independent repeats and batch checks are required before escalating claims.
- **Full-cell causality**: Half-cell or interface-level mechanism claims must be checked against coupled-cell behavior with matched components.

## Claim Boundaries

- Do not present a single source’s result as field-wide consensus.
- Do not transfer exact numerical values, recipes, or processing parameters from literature to a new system.
- Distinguish lab-scale visualized-cell or half-cell evidence from practical full-cell or device-level evidence.
- Label extrapolations to other metal systems, electrolyte classes, or cell formats as hypotheses, not established facts.
- Separate directly observed results from inferred mechanisms and from speculative extensions.

## Failure Modes

- Hypothesis is falsified by ablation controls or orthogonal data.
- Performance gains originate from confounding variables (geometry, normalization, contact resistance, additive depletion, instrument drift).
- Apparent mechanism signal is an artifact of measurement setup, imaging bias, or cell-assembly differences.
- Full-cell improvement is driven by cathode, counter-electrode, or assembly mismatch rather than the target interface mechanism.
- Intervention delays failure without changing the underlying mechanism.
- Reproducibility failure across independent preparations or batches.
- Mechanism claim relies on a single metric or a single evidence stream.

## Validity Checks

Before presenting a plan or conclusion, check:
- **Confounders**: electrode roughness, temperature, cell geometry, electrolyte amount, assembly sequence, additive depletion, instrument drift, and batch variance.
- **Reproducibility**: independent repeats, variance reporting, outlier handling, and metadata completeness.
- **Statistical validity**: predefined primary metrics, sufficient repeats for the claim level, and separation of exploratory from confirmatory results.
- **Boundary conditions**: different electrolyte backgrounds, electrode states, longer-term stability, and full-cell relevance.
- **Mechanism discipline**: no claim based on one metric alone; no unsupported transfer of literature-specific values to a new system.
- **Normalization fairness**: compare metrics using consistent mass, area, volume, or device basis.
- **Safety and ethics**: maintain non-operational boundaries; do not provide executable hazardous procedures, high-risk parameters, or unsafe handling instructions.

## Provenance

- Synthesized from cluster 15.1 (observable-driven mechanism discovery and validation).
- Source skills: aqueous-zinc-battery-research-design (6f73a58334eaa272), aqueous-metal-interphase-research (d3e861676bb05357), azib-ph-buffer-additive-discovery (31f62ca0b0ad0d10), zinc-ion-cathode-exploration (693a51bf499f8321), accessible-carbon-cathode-zinc-supercapacitor-research (b3f65d0ba0383a45), flexible-microbattery-research-design (b291b9ae8d3496f5), mxene-microsupercapacitor-research-exploration (aeeb9320939aba8d), molten-salt-battery-research-workflow (ca8ed9f0e2ea2cb4).
- Paper-specific systems, materials, parameters, numerical results, and operational protocols were excluded per the merge definition.
