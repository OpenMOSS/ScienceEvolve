---
name: sci-fiber-composite-fiber-interface-mechanism-discovery-6bfbf1cb
description: A reusable end-to-end workflow for generating mechanism-driven research questions, designing minimal validation studies, and iterating on multi-evidence composite and material interface hypotheses.
scienceevolve-title: "Fiber composites and battery materials · composite fiber interface mechanism discovery workflow 4"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Guide agents to translate observable performance gaps in composites, fibers, interfaces, and multifunctional materials into testable mechanism hypotheses, minimal validation plans, and bounded research conclusions through an iterative, evidence-linked workflow.

# When to use

Use this skill when proposing new research questions, designing non-operational experiments, or validating claims for material systems where structure, interface, processing, and property are coupled. It applies to composite durability, hybrid laminates, functional coatings, energy and sensing materials, and bio-based or recycled material development. Do not use this skill for operational manufacturing recipes, safety-critical certification, field deployment qualification, or hazardous procedural instructions.

# Inputs required

Before executing the workflow, collect or explicitly assume:

- **Target system scope:** material families, reinforcement or filler class, matrix or substrate, architecture, and intended service environment.
- **Performance gap:** the unresolved limitation, anomaly, or trade-off to explain in mechanism terms.
- **Boundary conditions:** environmental, mechanical, thermal, chemical, geometric, or temporal constraints that bound plausible mechanisms.
- **Available evidence:** prior data, literature benchmarks, computational models, and accessible characterization methods.
- **Constraints:** non-operational boundary, safety or compliance limits, resource scope, and acceptable validation level.

# Core Workflow

Execute the following stages in order. Do not advance past a decision gate until the condition is satisfied; otherwise, iterate or stop.

## Stage 1 — Gap Framing & Boundary Definition
1. State the performance gap as a mechanism failure or unresolved coupling, not merely a missing metric.
2. List boundary conditions (redox, temperature, humidity, stress state, geometry, scale) that exclude physically incompatible mechanisms.
3. **Decision gate:** Is the gap observable and the boundary closed enough to generate falsifiable hypotheses?
   - *No:* Refine scope or stop.

## Stage 2 — Competing Hypothesis Generation
1. Generate at least two competing mechanism hypotheses. Map each as:
   `design lever → microstructural/interfacial change → observable signature → condition where the effect should appear`.
2. For each hypothesis assign: evidence strength (low / medium / high), key assumptions, likely failure modes, and the minimal observation that would weaken or reject it.
3. **Decision gate:** Does each hypothesis have a discriminating prediction and a defined failure mode?
   - *No:* Return to framing.

## Stage 3 — Minimal Validation Design
1. Select the smallest set of comparisons that can test the mechanism chain.
2. Define independent variables, controlled variables, and measured variables.
3. Include: baseline, negative control, positive or benchmark control, and artifact controls.
4. Predefine primary and secondary metrics aligned to each mechanism link.
5. Predefine stop conditions (e.g., control failure, defect dominance, variability overwhelming effect, safety violation).
6. **Decision gate:** Can the design falsify at least one hypothesis without operational hazards?
   - *No:* Redesign controls or metrics.

## Stage 4 — Multi-Evidence Collection
1. Gather orthogonal evidence across relevant modalities (e.g., mechanical, chemical, morphological, thermal, electrochemical, transport).
2. Record process metadata, environmental state, specimen quality, and any deviations.
3. **Decision gate:** Is data quality sufficient and confounding minimized?
   - *No:* Pause, address validity, or stop.

## Stage 5 — Mechanism-First Analysis
1. Confirm data integrity and specimen quality.
2. Verify intermediate mechanism links before interpreting final performance (structure → property → function).
3. Compare observations against discriminating predictions for each hypothesis.
4. Test for trade-offs, regime changes, and confounding.
5. **Decision gate:** Does evidence consistently support one mechanism over alternatives?
   - *Ambiguous:* Flag for additional discrimination and return to Stage 3.

## Stage 6 — Claim Classification & Bounding
1. Classify each claim as supported, partially supported, rejected, or unresolved.
2. Explicitly separate: verified prior evidence, transferable mechanism logic, and new-agent inference.
3. State boundary conditions where claims must not be extrapolated.
4. **Decision gate:** Are claims bounded and free of overgeneralization?
   - *No:* Tighten boundaries.

## Stage 7 — Iteration or Redesign
1. **If supported:** Escalate stress (more demanding environment, longer exposure, higher loading) or extend to adjacent architectures.
2. **If partially supported:** Isolate the weak mechanism link and redesign only that variable.
3. **If rejected:** Retain the negative result as a boundary condition and generate alternative hypotheses.
4. **If inconclusive:** Add the smallest control or measurement to distinguish mechanism from artifact.
5. **Stop conditions:** End iteration when a coupled failure mode worsens despite single-metric improvement; mechanism signatures remain absent despite performance gains; controls fail; variability dominates; or safety/compliance constraints are violated.

# Output Format

When using this skill, produce:

1. **Research question** — one sentence tied to a mechanism or application gap.
2. **Mechanism map** — design lever → intermediate change → observable signature → performance outcome.
3. **Hypotheses table** — competing hypotheses with evidence strength, key assumptions, likely failure modes, and minimal validation.
4. **Validation plan** — variables, controls, metrics, and stop conditions.
5. **Analysis plan** — mechanism-first hierarchy, normalization strategy, trade-off checks, and decision rules.
6. **Iteration decision log** — current evidence classification and next action with rationale.
7. **Validity and boundary statement** — confounders, reproducibility needs, claim boundaries, and non-operational safety notes.

# Validation Gates

Before advancing between stages or finalizing outputs, verify:

- **Boundary adequacy:** System constraints are explicit and exclude implausible mechanisms.
- **Discriminating power:** Hypotheses predict different observable signatures under the same test.
- **Control sufficiency:** Baseline, negative, positive/benchmark, and artifact controls are present or justified.
- **Confounding audit:** Unintended variation in processing, geometry, environment, or measurement is identified and minimized.
- **Mechanistic specificity:** Metrics map to proposed mechanism links, not only to final performance.
- **Reproducibility readiness:** Replication plan, metadata recording, and outlier rules are predefined.

# Claim Boundaries

- Distinguish direct observation from mechanistic inference.
- Separate verified prior evidence from new hypotheses and untested extrapolations.
- Limit generalization to the tested material family, architecture, environment, loading mode, and mechanism regime.
- Do not treat any single source study as field-wide consensus.

# Failure Modes

Common workflow and system failure modes to monitor:

- **Single-metric illusion:** Improvement in one endpoint masks degradation in another critical property.
- **Confounded attribution:** Formulation, processing, geometry, or environmental changes coincide and obscure cause.
- **Missing mechanism signature:** Performance gains occur without supporting intermediate evidence.
- **Control implausibility:** Baseline or negative controls behave unexpectedly, invalidating comparisons.
- **Regime crossing:** The dominant mechanism changes with temperature, rate, loading, or exposure, breaking model validity.
- **Extrapolation risk:** Claims extend beyond tested boundary conditions without qualification.

# Validity Checks

Before presenting conclusions, confirm:

- Confounding variables are controlled or documented.
- All control groups behave plausibly.
- Variability, replication, and uncertainty are reported.
- Selected endpoints match the hypothesized mechanism.
- Defect-dominated or artifact-laden data are flagged and handled transparently.
- Environmental and material boundaries are stated.
- Evidence provenance is labeled (known vs. inferred).

# Provenance

Synthesized from cluster 70.0 (observable-driven mechanism discovery and validation). Derived from source skills: `fiber__10.3390_jcs7120509`, `2410.18599`, `fiber__10.1016_j.compscitech.2019.107703`, `fiber__10.1016_j.compstruct.2020.113099`, `fiber__10.1177_1528083720935570`, `fiber__10.1002_adfm.202104256`, `10.1002_advs.202301006`, `fiber__10.1016_j.compscitech.2021.108842`.
