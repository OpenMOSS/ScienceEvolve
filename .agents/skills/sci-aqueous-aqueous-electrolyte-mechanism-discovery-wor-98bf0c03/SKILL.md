---
name: sci-aqueous-aqueous-electrolyte-mechanism-discovery-wor-98bf0c03
description: A reusable end-to-end workflow for discovering and validating electrolyte and interfacial mechanisms in aqueous electrochemical energy storage through coupled hypothesis generation, staged experimentation, and convergent evidence analysis.
scienceevolve-title: "Aqueous battery interfaces · aqueous electrolyte mechanism discovery workflow"
scienceevolve-area: aqueous-battery-interfaces
---

## Purpose

Use this skill to generate research questions and non-operational validation plans for aqueous electrochemical energy storage systems where electrolyte bulk properties, electrode interfaces, and degradation pathways are coupled. The workflow guides observable-driven mechanism discovery: define a bottleneck, propose a causal intervention, discriminate mechanisms through staged controls, and bound claims by evidence strength. Do not treat any single source study as field-wide consensus.

## When to use

Trigger this skill when the user asks to:

- Propose research questions or hypotheses for aqueous metal batteries, hybrid supercapacitors, or related flexible energy-storage systems.
- Design electrolyte, interface, or electrode-architecture strategies that address coupled stability-transport trade-offs.
- Plan validation workflows that move from mechanism screening to half-cell and full-device testing.
- Translate material-level insights into cell-level or device-level performance claims.
- Compare candidate stabilization strategies using matched controls and falsifiable criteria.
- Diagnose coupled failure modes such as dendritic deposition, interfacial resistance growth, mechanical degradation, or active-material dissolution.

Do not use this skill for operational laboratory recipes, hazardous synthesis instructions, clinical or medical device validation, or direct replication of a specific material system.

## Inputs required

Ask the user or environment for:

- **Target system:** battery or device family, electrode classes, electrolyte type, and intended application context.
- **Primary bottleneck:** the performance or durability limitation to address (e.g., cycle life, rate capability, mechanical robustness, environmental tolerance).
- **Known degradation modes:** failure pathways such as nonuniform deposition, corrosion, dissolution, interfacial passivation, electrolyte decomposition, or mechanical delamination.
- **Available evidence:** literature background, preliminary data, computational predictions, or constraints on characterization methods.
- **Evaluation priorities:** lifetime, safety, mechanical durability, energy or power metrics, integration compatibility, or manufacturability.
- **Constraints:** safety boundaries, cost, sustainability, scalability, and institutional oversight requirements.

If inputs are incomplete, state assumptions explicitly and produce a minimal viable validation plan rather than a full protocol.

## Core Workflow

Follow this ordered route. Apply the decision gates before advancing to the next stage.

### 1. Define the coupled bottleneck and system boundary
- Map application stressors to electrochemical and mechanical failure modes.
- Decompose the system into bulk electrolyte, anode interface, cathode interface, separator or device architecture, and environmental constraints.
- Identify the dominant failure pathway and secondary pathways coupled to it.
- **Gate:** If the bottleneck cannot be linked to a specific observable failure mode, stop and refine the problem statement before generating hypotheses.

### 2. Generate mechanism-first hypotheses
- For each failure mode, propose interventions tied to a mechanistic lever (e.g., solvation restructuring, interfacial film formation, nucleation control, transport-pathway design, local chemical environment management).
- Format each hypothesis as: *If [intervention] changes [mechanism] in [target component], then [observable outcome] should improve because [causal pathway], while [trade-off or failure mode] must be monitored.*
- Assign evidence strength (speculative, weak, moderate, strong) based on prior literature, analogous systems, or theory.
- Define key assumptions, predicted observations, falsifiers, and boundary conditions for each hypothesis.
- **Gate:** If a hypothesis cannot be falsified by a feasible minimal test, reformulate or discard it.

### 3. Design a staged validation funnel
- Define the comparison frame: baseline architecture, proposed intervention, and the exact claim being tested.
- Build controls:
  - **Baseline:** matched system without the intervention.
  - **Single-function controls:** isolate individual design levers when testing multifunctional candidates.
  - **Negative controls:** lack the proposed functional group or interaction.
  - **Positive controls:** known stable reference used only as a benchmark, not proof of superiority.
- Select independent variables from at least two layers (bulk electrolyte, interface, electrode, architecture).
- Define metrics:
  - **Primary:** cycle stability, efficiency, retention, rate capability, impedance trend.
  - **Mechanism:** transport indicators, interfacial resistance, morphology, deposition uniformity, dissolved species, phase or chemical-state evolution.
  - **Practicality:** cost, safety profile, scalability, mechanical integrity, environmental tolerance.
- Predefine stopping conditions: stop if the candidate worsens a coupled metric, shows poor reproducibility, creates unsafe degradation products, or improves performance only under unmatched normalization.
- **Gate:** If controls are insufficient to isolate the proposed mechanism, redesign before proceeding.

### 4. Execute minimal viable verification and mechanism discrimination
- Compare baseline and intervention under matched cell formats, electrode states, and testing conditions.
- Collect orthogonal evidence across at least two categories (e.g., electrochemical signatures, interfacial diagnostics, structural or spectroscopic characterization).
- Distinguish direct mechanism evidence from indirect correlation.
- **Gate:** If performance improves but mechanism diagnostics contradict the hypothesis, stop and redesign; do not advance to full-device validation.

### 5. Validate across scales
- Progress from half-cell or model-interface tests to full-cell or device-level tests only after mechanism evidence converges.
- If claims involve flexibility, temperature tolerance, or integration, test under application-relevant stressors and compare undeformed versus stressed states.
- Separate component-level gains from packaging, contact, or mechanical limits.
- **Gate:** If cell-level gains do not survive integration or stress testing, bound claims to the validated scale and iterate on architecture or packaging.

### 6. Analyze trade-offs and degradation pathways
- Evaluate whether the intervention suppresses the target failure mode or merely shifts it elsewhere.
- Check explicit trade-offs: transport versus stability, protection versus impedance, energy density versus cycle life, mechanical confinement versus ion mobility.
- Compare pre- and post-test structure, morphology, and chemical state to localize failure.
- **Gate:** If unacceptable trade-offs appear or degradation is unaccounted for, flag the design for modification.

### 7. Iterate or terminate
- **Keep:** Mechanism evidence, performance metrics, and full-device behavior align; results are reproducible across independent samples.
- **Modify:** One metric improves while another worsens; mechanism explains initial but not long-term behavior; boundary conditions are narrower than expected.
- **Stop:** Improvements are non-reproducible; mechanism is contradicted by diagnostics; full-device failure is unexplained; claims require extrapolation beyond tested chemistry, architecture, or environment.
- For each iteration, output a revised hypothesis, the evidence that changed the assessment, the next minimal test, and the failure mode to watch.
- **Gate:** If after two iterations the hypothesis remains speculative or contradicted, pivot to a new mechanism or bottleneck.

## Output Format

When using this skill, return:

1. **Research question:** One concise question tying the target system to a specific coupled bottleneck.
2. **Gap and mechanism map:** Known limitations, candidate mechanisms, and which elements are literature-supported versus inferred.
3. **Ranked hypotheses:** A table with columns for hypothesis statement, mechanistic lever, evidence strength, key assumptions, likely failure mode, and minimal test.
4. **Experimental design framework:** Variables, control groups, primary and mechanism metrics, practicality metrics, success criteria, and stop conditions.
5. **Analysis plan:** Comparison logic, degradation diagnostics, trade-off evaluation, and structure for linking mechanism evidence to performance outcomes.
6. **Iteration plan:** Keep/modify/stop criteria, next minimal validation, and boundary conditions for generalization.
7. **Validation and safety check:** Confounders, reproducibility concerns, statistical validity, boundary conditions, and non-operational safety/ethics constraints.

## Validation Gates

Apply these checks at each stage of the workflow:

- **Problem clarity:** Is the bottleneck explicit and tied to an observable failure mode rather than a generic material trend?
- **Mechanism specificity:** Does each hypothesis name a causal lever (e.g., transport, nucleation, passivation) rather than only a material or additive?
- **Control adequacy:** Are baseline, negative, positive, and single-variable controls included to isolate the proposed mechanism?
- **Confounding control:** Are comparisons performed in matched cell formats, electrode states, and testing conditions?
- **Reproducibility:** Are independent samples, repeated measurements, and variability reported rather than only best-case results?
- **Scale alignment:** Are partial-cell or half-cell results explicitly bounded and not overgeneralized to full-device claims?
- **Statistical validity:** Are uncertainty estimates, predefined exclusion criteria, and appropriate comparisons used?
- **Boundary discipline:** Are claims limited to the tested chemistry, architecture, environment, and stress regime?

## Claim Boundaries

- Distinguish directly observed results from inferred mechanisms and from speculative extrapolations to new materials or operating conditions.
- Do not generalize from a single study or device architecture to an entire technology class or field-wide consensus.
- Separate laboratory demonstration from application-ready, wearable, or human-adjacent deployment claims.
- Mark literature-supported patterns separately from agent-inferred extensions; label analogical reasoning as moderate or weak evidence.

## Failure Modes

Monitor for these common failure modes during design and interpretation:

- **Mechanism shift:** The intervention suppresses the target side reaction but triggers an alternative degradation pathway.
- **Impedance penalty:** A protective interface or additive blocks ion transport or increases charge-transfer resistance.
- **Mechanical failure:** Deformation, swelling, or fatigue causes contact loss, delamination, or electrolyte fracture.
- **Uncontrolled reconstruction:** The active phase or interfacial film changes irreversibly during operation, invalidating the initial hypothesis.
- **Normalization artifact:** Apparent performance gains disappear when metrics are recalculated using consistent mass, volume, or area accounting.
- **Single-metric optimization:** Capacity or rate improves while cycle life, safety margin, or mechanical integrity degrades.
- **Reproducibility collapse:** Results depend on uncontrolled impurities, assembly order, batch variation, or environmental fluctuations.

## Validity Checks

Before finalizing a research plan or interpreting results:

- **Confounding:** Are baseline and intervention compared in matched formats with equivalent electrode loading, thickness, and testing protocols?
- **Mechanism consistency:** Do orthogonal diagnostics support the proposed causal pathway rather than a single indirect correlation?
- **Full-device relevance:** Does the evidence extend beyond isolated electrolyte or half-cell tests to full-cell or device-level behavior?
- **Degradation accounting:** Are failure modes identified after aging or stress testing, not only from initial performance?
- **Trade-off transparency:** Are conductivity, stability, cost, sustainability, and manufacturability evaluated together?
- **Literature interpretation:** Are review-level summaries distinguished from direct experimental evidence?
- **Non-mechanical transfer:** Are specific compositions, numerical parameters, and one-study conclusions avoided when designing generalized rules for new systems?

## Provenance

Derived from cluster 25.0 (observable-driven mechanism discovery and validation) and synthesized from source skills: `flexible-zn-iodine-interface-exploration`, `zinc-ion-hybrid-supercapacitor-research-design`, `aqueous-electrolyte-interface-codesign`, `mof-derived-oer-catalyst-design`, `azib-cathode-research-pattern`, `flexible-zinc-organic-battery-research`, `flexible-aqueous-battery-exploration`, `compartmentalized-ion-solvent-exploration`. Paper-specific materials, parameters, and conclusions have been abstracted into a reusable, domain-agnostic workflow body.
