---
name: sci-aqueous-zinc-aqueous-interface-mechanism-discovery-15552dd2
description: A reusable end-to-end workflow for discovering and validating mechanisms at zinc-aqueous electrode-electrolyte interfaces through hypothesis generation, convergent evidence design, and iterative mechanism discrimination.
scienceevolve-title: "Aqueous battery interfaces · zinc aqueous interface mechanism discovery workflow"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Help an agent translate observed failures at reactive metal-aqueous electrolyte interfaces into a structured, iterative program of mechanism discovery and validation. The workflow generates falsifiable hypotheses, designs multi-control validation studies, and bounds claims by convergent evidence—without reproducing any single paper’s materials, parameters, or conclusions as field consensus.

# When to use

Use this skill when the task involves:

- Proposing new research questions for aqueous metal-battery interfaces, interphases, or electrolyte systems.
- Designing conceptual validation plans to discriminate among coupled transport, chemical, mechanical, or thermal failure mechanisms.
- Iterating on a mechanism map after contradictory or incomplete evidence.
- Reviewing whether a proposed interphase or electrolyte strategy has sufficient mechanistic and system-level support.

Do not use this skill as a general battery review, a source of operational laboratory recipes, or a substitute for hands-on safety and compliance review.

# Inputs required

Before executing the workflow, collect or infer:

- **Target system**: metal anode chemistry, electrolyte class, cell architecture, and intended operating regime at a conceptual level.
- **Observed failure mode**: specific limitation such as uneven deposition, interphase instability, side reactions, impedance growth, or poor reversibility.
- **Candidate strategy**: interphase design, electrolyte modification, additive, scaffold, or architectural concept under consideration.
- **Available evidence**: literature baseline, preliminary data, characterization access, simulation tools, or prior datasets.
- **Constraints**: safety boundaries, non-operational scope, reproducibility requirements, and acceptable validation depth.
- **Baseline and comparators**: unmodified system, inert analogue, non-functional analogue, and relevant benchmark if available.

If inputs are incomplete, state assumptions explicitly and prioritize a minimal validation plan.

# Core Workflow

1. **Scope and Failure Mode Decomposition**
   - Define the target system and the specific interface or electrolyte failure mode.
   - Decompose the failure into candidate mechanisms: transport limitation, interfacial instability, side reactions, mechanical degradation, or coupled bottlenecks.
   - *Decision gate / Stop condition:* If the failure mode cannot be linked to at least one observable mechanism, stop and refine the research question.

2. **Mechanism Map Construction**
   - Propose a causal chain linking a design feature to local interfacial behavior and then to system-level performance.
   - Mark each causal link as supported, inferred, or speculative.
   - *Iteration trigger:* If the map contains only speculative links with no testable intermediate, return to Step 1 with a narrower scope.

3. **Hypothesis Generation and Ranking**
   - Formulate falsifiable hypotheses in the form: “If [intervention] changes [mechanism], then [observable metric] should change relative to [baseline], provided [assumption] holds.”
   - Rank by evidence strength (high / medium / low / speculative) and assign key assumptions and predicted failure modes.
   - *Decision gate:* Proceed only if at least one hypothesis can be discriminated by two independent evidence streams.

4. **Study Design and Control Architecture**
   - Define independent variables, dependent variables, and context variables.
   - Establish controls: baseline, negative (mechanism-absent), positive (benchmark), and orthogonal (isolates one causal factor).
   - Specify minimum viable validation: the smallest set of comparisons needed to falsify the primary hypothesis.
   - Define stop conditions before data collection (e.g., baseline instability, safety boundary, contradictory pilot evidence).
   - *Decision gate:* If the design cannot separate the intended mechanism from confounding artifacts, redesign controls or metrics.

5. **Multi-Modal Evidence Collection**
   - Gather convergent evidence across relevant modalities (e.g., electrochemical, morphological, spectroscopic, imaging, transport, computational).
   - Require at least two independent evidence families per key mechanism.
   - *Decision gate:* If evidence streams contradict, flag the mechanism as unresolved and proceed to Step 7.

6. **Mechanism Discrimination and Analysis**
   - Compare candidate against all controls under matched conditions.
   - Check causal consistency: multiple indicators must point to the same mechanism; single-metric improvements are insufficient.
   - Rule out artifacts from testing conditions, mass loading, contact differences, or protocol mismatches.
   - *Decision gate:*
     - If controls invalidate the mechanism, exclude it and return to Step 3.
     - If the mechanism is supported but performance does not improve, search for coupled bottlenecks and return to Step 2.

7. **Claim Bounding and Robustness Check**
   - State the supported claim, its boundary conditions (chemistry, operating window, cell architecture), and its generalization limit.
   - Verify that the claim distinguishes associative evidence from mechanistic validation.
   - *Decision gate:* If the claim requires extrapolation beyond tested boundaries, downgrade to inference and require additional validation.

8. **Iteration or Redesign**
   - Update the mechanism map, evidence strengths, and hypothesis table based on outcomes.
   - Design the next minimum viable experiment to test the next bottleneck or an alternative hypothesis.
   - *Stop conditions:*
     - The mechanism is confirmed by convergent evidence and robust controls.
     - The mechanism is falsified and no viable alternative remains within scope.
     - A safety, resource, or compliance boundary is reached.

# Output Format

Produce the following structured items:

1. **Research question** – One concise question tied to an observable interface or electrolyte failure mode.
2. **Mechanism map** – Design feature → interfacial mechanism → measurable behavior → system-level outcome, with each link labeled supported, inferred, or speculative.
3. **Hypothesis table** – For each hypothesis: statement, evidence strength, key assumptions, predicted observations, and likely failure modes.
4. **Study design** – Variables, control groups (baseline, negative, positive, orthogonal), minimum viable validation, evaluation metrics, and stop conditions.
5. **Analysis plan** – Evidence grouping, causal consistency checks, control interpretation rules, and artifact exclusion criteria.
6. **Iteration plan** – Decision rules for updating the mechanism map and selecting the next experiment.
7. **Validity and safety statement** – Confounders, reproducibility checks, boundary conditions, and non-operational safety constraints.

# Validation Gates

- **Scope gate**: The failure mode is specific and linked to at least one observable mechanism.
- **Hypothesis gate**: Hypotheses are falsifiable and discriminable by independent evidence streams.
- **Design gate**: Controls can separate the intended mechanism from confounding artifacts.
- **Convergence gate**: Each key mechanism is supported by at least two independent evidence families.
- **Robustness gate**: Claims are bounded by tested operating windows and distinguished from extrapolation.
- **Safety gate**: The plan remains at a non-operational design level and avoids hazardous procedural detail.

# Claim Boundaries

- Distinguish **associational** claims (observed correlation under specific conditions) from **mechanistic** claims (validated causal chain via controls and diagnostics).
- Limit **system-level** claims to the tested cell architecture, chemistry, and operating window; do not generalize to all aqueous metal batteries.
- Treat **half-cell** improvements as interface-level evidence only; full-cell relevance requires separate validation.
- Label **computational** predictions as hypotheses requiring experimental or independent computational validation before mechanistic claims.
- Do not present any single source study as field-wide consensus.

# Failure Modes

- **Unstable baseline**: The unmodified system or control is too variable to support attribution; redesign baseline characterization before testing candidates.
- **Confounded controls**: A partial or inert analogue performs similarly to the full candidate, indicating the proposed mechanism is not the active cause.
- **Single-metric inference**: One improved performance number is used to infer mechanism without supporting structural, interfacial, or chemical evidence.
- **Half-to-full translation failure**: Gains observed in simplified cells disappear under practical balancing, loading, or paired-electrode conditions.
- **Mechanism shift**: The intervention suppresses one failure mode but introduces a new bottleneck elsewhere in the system.
- **Over-extrapolation**: Claims extend beyond tested temperature, rate, chemistry, or cycle-life boundaries without labeled uncertainty.

# Validity Checks

Before finalizing any plan or claim, verify:

- **Confounding factors**: testing conditions, mass loading, contact quality, electrolyte amount, impurities, and electrode pretreatment are matched or accounted for.
- **Reproducibility**: repeated measurements, independent batches, transparent uncertainty, and consistent reporting are included.
- **Statistical validity**: sample sizes, outlier handling, and comparison criteria are appropriate for the claim strength.
- **Mechanistic specificity**: the evidence distinguishes the proposed mechanism from alternative explanations such as conductivity changes, surface area effects, or passive barriers.
- **Boundary conditions**: conclusions are explicitly scoped to the tested chemistry, architecture, and operating window.
- **System validity**: material-level or half-cell improvements are traced through to relevant device-level constraints where applicable.
- **Evidence labeling**: literature-supported observations, model outputs, and new agent inferences are clearly separated.
- **Safety and ethics**: the plan avoids operational hazardous details and flags risks requiring qualified institutional review.

# Provenance

Derived from cluster 7.0 (observable-driven mechanism discovery and validation) and synthesized from the following source skills: solid-state-zinc-polymer-electrolyte-research, aqueous-zn-interphase-exploration, zinc-ion-battery-research-exploration, organic-zinc-battery-research-workflow, azib-anode-protective-layer-exploration, zinc-ion-battery-dopant-ml-research, multivalent-ion-cathode-discovery-workflow, descriptor-guided-interphase-research.
