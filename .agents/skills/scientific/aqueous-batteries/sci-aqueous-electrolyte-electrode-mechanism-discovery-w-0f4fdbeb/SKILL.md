---
name: sci-aqueous-electrolyte-electrode-mechanism-discovery-w-0f4fdbeb
description: An end-to-end, observable-driven workflow for generating mechanistic hypotheses, designing controlled validation experiments, and iterating on converging evidence in electrochemical energy-storage research.
scienceevolve-title: "Aqueous battery interfaces · electrolyte electrode mechanism discovery workflow"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Guide agents to convert performance gaps in electrochemical energy-storage systems into reusable, mechanism-centered research plans. The workflow produces falsifiable hypotheses, minimum viable experimental designs, layered analysis protocols, and explicit iteration rules—without prescribing specific materials, operational recipes, or device parameters.

# When to use

Use this skill when the user asks to:

- Design or critique research questions involving electrolyte–electrode coupling, interfacial stability, ion transport, or degradation mechanisms.
- Generate hypotheses and experiments for aqueous or solid-state electrochemical cells where observable bottlenecks limit performance.
- Translate single-study observations into transferable mechanism-discovery plans.
- Build decision trees for validating or excluding candidate mechanisms.

Do not use this skill for executable laboratory protocols, hazardous operational instructions, clinical diagnosis, or non-electrochemical domains.

# Inputs required

Before executing the workflow, collect or infer:

1. **Target system class**: electrode and electrolyte families, device format, and known failure mode.
2. **Performance gap**: the specific limitation expressed as a tradeoff (e.g., high initial response versus poor retention).
3. **Suspected bottleneck category**: transport, interfacial, mechanical, phase-evolution, or coupled degradation.
4. **Candidate perturbations**: compositional, architectural, or processing variables that might alter the bottleneck.
5. **Available diagnostics**: structural, chemical, kinetic, transport, and device-level characterization methods.
6. **Constraints**: safety boundaries, non-operational scope, reproducibility requirements, and scale-relevance targets.

If inputs are missing, state assumptions explicitly and design the first iteration to test them.

# Core Workflow

Execute the following stages in order. Do not skip a gate; if a gate fails, return to the indicated stage or stop.

## Stage 1: Frame the gap and bottleneck

- Define the performance limitation as a **tradeoff**, not merely a missing metric.
- Identify the dominant bottleneck category (intrinsic, transport-limited, interfacial, mechanically coupled, or phase-evolution-driven).
- Document the baseline state and target duty cycle.
- **Gate 1 (Problem viability)**: Stop if the gap cannot be linked to an observable structural, interfacial, or transport mechanism.

## Stage 2: Generate ranked mechanistic hypotheses

- For each candidate perturbation, write a **mechanism chain**:  
  design change → structural/interfacial change → transport/kinetic change → performance change → diagnostic signature.
- Assign **evidence strength** (strong / moderate / weak / speculative) based on prior converging observations.
- State **key assumptions**, **predicted observations**, and **likely failure modes** for each hypothesis.
- Rank hypotheses by testability and falsifiability.
- **Gate 2 (Hypothesis quality)**: Reject hypotheses that lack a diagnostic signature or cannot be falsified by at least one control and one direct mechanism metric. If fewer than two viable hypotheses remain, return to Stage 1.

## Stage 3: Design minimum viable validation

- Select **one primary variable** per iteration; keep architecture, measurement family, and normalization basis comparable across conditions.
- Define **controls**: baseline, positive (if available), negative, process-matched, and active-function knockout or architecture-matched control.
- Predefine three metric classes:
  - **Primary performance metrics**: endpoint outcomes under target duty.
  - **Mechanistic metrics**: direct diagnostics of the proposed mechanism.
  - **Failure metrics**: signals of degradation, artifact, or non-representative behavior.
- Specify **stop conditions** before execution (e.g., controls match candidates, irreproducibility, safety concern).
- **Gate 3 (Design rigor)**: Redesign if controls cannot isolate the proposed mechanism from processing artifacts, bulk-property changes, or confounding variables.

## Stage 4: Execute and analyze in converging layers

- **Layer 1 (Pre-check)**: Confirm sample identity, processing history, dispersion, uniformity, and control matching. Flag confounders before interpreting data.
- **Layer 2 (Mechanism analysis)**: Compare mechanistic metrics across baseline, active design, inert control, and knockout. Determine whether the active function—not merely the added material—explains the change.
- **Layer 3 (Performance analysis)**: Relate endpoint metrics to mechanism evidence. Separate early-cycle artifacts from durable behavior.
- **Layer 4 (System/boundary analysis)**: Test whether gains persist under realistic loading, geometry, duty cycle, or extended operation. Mark extrapolations as inference.
- **Gate 4 (Evidence convergence)**:
  - Pass if mechanistic and performance metrics move together and controls are coherent.
  - Fail if mechanism metrics are absent while performance improves, or if post-test evidence contradicts the hypothesis. On failure, proceed to Stage 5.

## Stage 5: Iterate or terminate

Apply decision rules based on the evidence profile:

- **Strengthen**: Mechanism and performance align with strong controls → increase confidence, test boundary conditions, and probe one adjacent design axis.
- **Pivot**: Performance improves without mechanism change → treat as exploratory; search for confounders (contact, loading, impurity, measurement artifact) or alternative mechanisms.
- **Revise**: Mechanism evidence is strong but performance is poor → identify downstream bottlenecks (counter-electrode, separator, interface, bulk transport) and redesign the target.
- **Abandon**: Controls match candidates, results are irreproducible, or degradation dominates before the mechanism is resolved → return to Stage 2 or stop.
- **Gate 5 (Iteration sanity)**: Stop optimizing peak performance if reversibility, transport validity, or safety boundaries remain unresolved.

# Output Format

When using this skill, produce a structured research plan containing:

1. **Research question** — one concise, mechanism-centered question tied to a tradeoff.
2. **Ranked hypotheses table** — for each: mechanism chain, evidence strength, key assumptions, predicted observation, likely failure mode, and minimal falsification test.
3. **Experimental design** — independent variables, controlled variables, dependent variables (primary, mechanistic, failure), control matrix, and stop conditions.
4. **Analysis plan** — layered integration of pre-check, mechanism, performance, and boundary evidence.
5. **Iteration rules** — decision tree mapping each evidence profile to continue, pivot, revise, or abandon.
6. **Validity and safety notes** — confounders, reproducibility requirements, boundary conditions, and non-operational safety constraints.

# Validation Gates

Summarize the five gates from Core Workflow as explicit criteria:

- **Gate 1**: The gap must be expressible as an observable mechanism tradeoff.
- **Gate 2**: Every retained hypothesis must have a falsifiable mechanism chain, a diagnostic signature, and a defined failure mode.
- **Gate 3**: The experimental design must include sufficient controls to isolate the mechanism from processing artifacts and bulk-property confounders.
- **Gate 4**: Mechanistic and performance evidence must converge before claims are strengthened; contradictory evidence triggers iteration.
- **Gate 5**: Iteration must not proceed if safety, reversibility, or reproducibility is unresolved.

# Claim Boundaries

- Distinguish **paper-supported observations** from **agent-inferred hypotheses** and **unvalidated extrapolations**.
- Limit causal claims to the tested system configuration (chemistry, geometry, loading, duty cycle).
- Do not treat single-study or single-system results as field consensus.
- Separate **material-level** mechanisms from **device-level** outcomes; a device improvement does not automatically validate the proposed material mechanism.
- Mark boundary-crossing claims (new chemistries, operating regimes, or formats) as hypotheses requiring independent validation.

# Failure Modes

Common ways the workflow or underlying research can fail:

- **Hypothesis failure**: The proposed mechanism lacks a diagnostic signature or is not falsifiable.
- **Control failure**: Baseline, inert, or knockout controls match the active condition, indicating processing artifacts or non-specific effects.
- **Confounding dominance**: Bulk properties (e.g., viscosity, conductivity) or assembly variation explain the result rather than the intended mechanism.
- **Transient gain**: Performance improves initially but degrades rapidly, indicating non-representative activation or damage.
- **Scale collapse**: Benefits disappear under realistic loading, geometry, or duty cycle.
- **Reproducibility failure**: Independent samples or batches show inconsistent results.
- **Safety block**: Unresolved hazards prevent meaningful validation.

# Validity Checks

Before finalizing any research plan or interpretation, verify:

- **Confounding**: Are composition, processing history, microstructure, loading, and environment matched across compared conditions?
- **Control adequacy**: Is there a baseline, a process-matched control, and an active-function knockout or architecture-matched control?
- **Mechanistic specificity**: Does the diagnostic specifically test the proposed mechanism, or only show generic improvement?
- **Reproducibility**: Are independent preparations, repeated measurements, or justified replicates included?
- **Statistical validity**: Are primary and mechanistic metrics predefined? Are stop conditions set before execution? Are outliers handled transparently?
- **Boundary conditions**: Does the claim stay within the tested chemistry, format, and operating regime?
- **Evidence separation**: Are source-paper observations clearly separated from new-system inferences?

# Provenance

- Synthesized from cluster **32.0** (observable-driven mechanism discovery and validation).
- Derived from representative source skills: `aqueous-zn-ion-activation-workflow`, `mof-solid-electrolyte-research-design`, `plant-salt-stress-ion-homeostasis-research`, `solid-state-oxygen-shuttle-research`, `self-powered-electrochemical-sensing-research`, `porous-carbon-host-electrochemical-research`, `all-solid-state-battery-anode-research`, `zinc-electrolyte-solvation-research`.
