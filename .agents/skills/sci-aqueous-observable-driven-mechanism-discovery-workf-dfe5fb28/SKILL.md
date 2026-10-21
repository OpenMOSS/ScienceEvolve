---
name: sci-aqueous-observable-driven-mechanism-discovery-workf-dfe5fb28
description: A reusable end-to-end workflow for generating mechanism-linked hypotheses, designing discriminating validation experiments, and iterating on convergent evidence from electrochemical energy-storage material and interface studies.
scienceevolve-title: "Aqueous battery interfaces · observable driven mechanism discovery workflow"
scienceevolve-area: aqueous-battery-interfaces
---

## Purpose

Use this skill to transform an observed performance gap, degradation pattern, or structural ambiguity in electrochemical energy-storage materials into a validated mechanistic understanding. It guides the agent through bottleneck abstraction, hypothesis generation, control-rich experiment design, convergent evidence analysis, and iterative claim bounding without relying on system-specific recipes or single-study conclusions.

## When to use

Trigger this workflow when the user needs to:

- Design a new study to explain an unexpected electrode, interface, or electrolyte behavior.
- Move beyond performance metrics to mechanism-level understanding in battery or supercapacitor material research.
- Evaluate whether a proposed material or interface concept has a credible causal pathway from structure to function.
- Iterate a research direction after ambiguous, contradictory, or negative experimental results.

## Inputs required

- **Observed bottleneck or anomaly:** Capacity fade, rate limitation, activation behavior, interfacial instability, or other performance/decay pattern.
- **Candidate concept:** The proposed active material, interface modifier, scaffold, hybrid component, or electrolyte design and its intended role.
- **Characterization context:** Available structural, chemical, kinetic, and electrochemical measurement capabilities.
- **Comparison baseline:** Unmodified reference, known benchmark, or literature control for matched comparison.
- **Target evidence level:** Conceptual hypothesis generation, minimal viable validation, or strong mechanistic validation.

## Core Workflow

Follow this ordered route. Do not skip decision gates.

### 1. Bottleneck abstraction & failure-mode decomposition
Translate the observed gap into a candidate failure mode expressed as a causal chain: material structure or interface state → chemical/physical process → performance decay.

**Decision gate:** Is the bottleneck defined as a falsifiable failure mode rather than a desired metric? If not, refine the input.

### 2. Mechanism-linked hypothesis generation
Generate 2–5 hypotheses that connect a design lever to an intermediate observable and a device-level outcome. For each hypothesis record:
- Causal claim and mechanism class (e.g., transport, charge-transfer, structural stabilization, interfacial regulation).
- Evidence strength: `strong`, `moderate`, `weak`, or `speculative`.
- Key assumptions and boundary conditions.
- Discriminating observation that would support or refute it.
- Likely failure mode (e.g., blocked pathways, detachment, side reactions, non-specific effects).

**Decision gate:** Does every hypothesis predict at least one mechanism-specific intermediate? Reject purely correlative claims.

### 3. Causal chain pre-registration
Build a mechanism map: design lever → structural/chemical descriptor → intermediate change → kinetic or stability effect → device metric. Label each link as `observed`, `inferred`, `assumed`, or `untested`. Pre-register stop conditions and success criteria before data collection.

### 4. Control-rich validation design
Specify variables and controls:
- **Independent variables:** Design lever, architecture, or interface concept.
- **Dependent variables:** Structural confirmation, transport/kinetic metrics, chemical state, and functional performance.
- **Controlled variables:** Normalization basis, electrode geometry, cell configuration, measurement protocol.
- **Controls:** Baseline, negative, structural/interface, inert-coverage, and positive controls where feasible.

Define **minimal viable validation** (smallest experiment that can falsify the hypothesis) and **strong validation** (stress tests, post-operation analysis, reproducibility checks).

**Decision gate:** Can the proposed controls isolate the intended mechanism from confounds such as loading, conductivity, or surface-area artifacts? If not, redesign.

### 5. Convergent evidence collection
Gather orthogonal evidence across four layers:
- **Structure/identity:** Phase, morphology, domain distribution, interface integrity, hierarchy.
- **Transport/kinetics:** Rate response, impedance, polarization, diffusion indicators.
- **Chemical state:** Surface speciation, bonding evolution, side-product formation, dissolution indicators.
- **Function:** Reversible capacity, retention, efficiency, durability under stress.

**Iteration rule:** Require agreement between at least two independent evidence streams before advancing a mechanism claim.

### 6. Mechanism discrimination & claim bounding
Compare the candidate against controls to:
- Separate synergy from simple additivity.
- Distinguish activation or precursor transformation from steady-state reversible behavior.
- Isolate interface effects from bulk or device-format artifacts.

Assign an evidence strength to each conclusion. Explicitly state boundary conditions where the claim should not be extrapolated.

**Decision gate:** Do structural, kinetic, chemical, and functional data converge? If conflicting, downgrade the claim or trigger iteration.

### 7. Iteration, redesign, or termination
- **Advance:** If convergence is high and controls are satisfied, proceed to robustness testing and boundary mapping.
- **Revise:** If evidence is partial, change one design dimension at a time, add targeted diagnostics, and re-run minimal validation.
- **Stop:** If controls explain the effect, the mechanism is indistinguishable from side processes, structural confirmation fails, reproducibility is poor, or the design creates unacceptable trade-offs. Log negative results and return to step 2.
- **Boundary mapping:** Define operating, compositional, or architectural limits beyond which the mechanism is untested.

## Output Format

Return a single structured report containing:

1. **Research question** — bottleneck-driven question and mechanistic rationale.
2. **Mechanism map** — causal chain with link labels.
3. **Ranked hypotheses** — 2–5 hypotheses with evidence strength, assumptions, discriminating observations, failure modes, and boundaries.
4. **Validation plan** — variables, control groups, minimal and strong validation stages, metrics, and stop conditions.
5. **Analysis plan** — layered evidence strategy and convergence criteria.
6. **Iteration log** — decision rules for advance, revise, or stop.
7. **Claim boundary statement** — extrapolation limits and separation of observed vs. inferred content.
8. **Validity and safety notes** — confounders, reproducibility checks, and non-operational safety boundaries.

## Validation Gates

- **Bottleneck clarity:** The research question addresses a specific failure mode, not a generic metric wish.
- **Hypothesis testability:** Every hypothesis predicts at least one intermediate observable independent of final performance.
- **Control adequacy:** The plan includes baseline, negative, and relevant structural or interface controls to isolate the design lever.
- **Convergence requirement:** Mechanism claims require alignment of at least two independent evidence types.
- **Pre-registration:** Stop conditions and success criteria are defined before data collection.
- **Normalization parity:** All comparisons use consistent mass, area, loading, or device-format basis.
- **Reproducibility:** Independent repeats or batch variability are acknowledged before strong claims.

## Claim Boundaries

- Do not treat single-system results as field-wide consensus.
- Do not assign steady-state reversible behavior to an as-prepared precursor without direct evidence.
- Do not attribute improvement to interface chemistry when physical coverage or loading artifacts are uncontrolled.
- Do not extrapolate beyond the tested electrolyte, electrode architecture, material class, or operating regime.
- Distinguish observed results, inferred mechanisms, and speculative extensions in every output.

## Failure Modes

- **Hypothesis fails:** The proposed mechanism is contradicted by controls or post-operation evidence.
- **Confound dominates:** Improvement is explained by surface area, conductivity, mass loading, or normalization artifacts.
- **Activation artifact:** High initial performance arises from irreversible transformation rather than stable mechanism.
- **Side-process mimic:** A side reaction or electrolyte-derived deposit mimics the intended mechanism.
- **Transport penalty:** The intervention stabilizes structure but blocks ion or electron pathways, net-neutralizing gains.
- **Irreproducibility:** Batch-to-batch variability exceeds effect size; preparation protocol is the real bottleneck.
- **Overgeneralization:** A valid observation in one system is incorrectly extended to untested chemistries or device formats.

## Validity Checks

Before finalizing any plan or conclusion:

- Verify that the bottleneck was defined before the hypothesis was chosen.
- Check that every major claim has a matched control or direct observation.
- Confirm that as-made and post-operation states are both considered for phase-evolution claims.
- Ensure that performance metrics are normalized and comparable across samples.
- Require mechanism-specific measurements tied to the degradation pathway, not only endpoint metrics.
- Label new hypotheses as inferred rather than established when moving beyond the source evidence.
- Confirm that safety and environmental boundaries are stated at a non-operational design level.
- Ensure negative results and ambiguous cases are reported, not omitted.

## Provenance

- Synthesized from cluster `31`, subcluster `31.0`.
- Derived from source skills: `991435a88658e893`, `c1c0da5ead3ee1c7`, `b4c456ae101f1ace`, `c6997739d4a3c4ef`, `f89b702bc9070e54`, `e55079344c585797`, `e636ff2a2b1edb27`, `edc6226278207151`.
- Workflow archetype: observable-driven mechanism discovery and validation.
