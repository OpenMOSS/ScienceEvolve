---
name: sci-fiber-observable-driven-mechanism-discovery-workflo-8592d55a
description: A reusable end-to-end workflow for discovering and validating mechanisms in complex material and interface systems through falsifiable hypotheses, minimal controlled experiments, convergent evidence analysis, and iterative claim bounding.
scienceevolve-title: "Fiber composites and battery materials · observable driven mechanism discovery workflow 5"
scienceevolve-area: fiber-composites-and-battery-materials
---

## Purpose

Guide agents through an observable-driven workflow that translates a performance gap into falsifiable hypotheses, designs minimal controlled experiments, and updates claims based on convergent structural and functional evidence. The workflow preserves scientific logic without embedding source-specific recipes, operational protocols, or material parameters.

## When to use

Use when the user asks to propose new research questions, design experiments, or validate mechanisms in material architectures, composite electrodes, functional interfaces, or related systems where multiple coupled failure modes may obscure causality. Trigger when the task requires moving from an observed bottleneck to structured hypotheses, controlled comparisons, and evidence-based iteration. Do not use as a general engineering manual, manufacturing recipe, safety procedure, or source of field consensus.

## Inputs required

Before starting, collect or infer:

- **Target system and bottleneck:** the practical performance gap and operating context.
- **Candidate mechanisms:** suspected coupled failure modes (e.g., transport, confinement, interfacial stability, mechanical integrity).
- **Design levers:** proposed architectures, interface modifications, or component functions intended to address the bottleneck.
- **Baselines:** available conventional or minimally modified comparators.
- **Capabilities:** characterization and diagnostic tools that can probe structure, function, and mechanism-specific signatures.
- **Constraints:** safety, reproducibility, sample availability, environmental, and regulatory limits.
- **Success criteria and stopping rules:** predefined thresholds for continuing, revising, or terminating the investigation.

If key inputs are missing, state assumptions explicitly and keep outputs at a non-operational design level.

## Core Workflow

1. **Define the operational bottleneck**
   - State the system-level performance gap in measurable terms.
   - Decompose the gap into candidate mechanisms and coupled failure modes.
   - *Decision gate:* If the bottleneck cannot be operationalized or no candidate mechanism can be probed with available tools, stop and refine the question.

2. **Generate ranked, falsifiable hypotheses**
   - Produce hypothesis cards for each candidate mechanism and a null/artifact hypothesis.
   - Each card must include: core claim, mechanistic model, predicted observations, key assumptions, evidence strength (strong / moderate / weak / speculative), likely failure modes, and boundary conditions.
   - *Decision gate:* If no hypothesis is falsifiable with a minimal variant set, narrow scope or request additional inputs.

3. **Design a minimal controlled experiment**
   - Select one primary design axis (e.g., interface architecture, component function, structural feature).
   - Define variants: proposed design, partial design, simple mixture or baseline, and relevant controls (negative, positive, artifact).
   - Hold confounders constant across variants (e.g., geometry, measurement protocol, environmental conditions).
   - Predefine primary and secondary metrics, success criteria, and stop conditions before data collection.
   - *Stop condition:* Redesign if controls cannot isolate the proposed mechanism from generic effects such as loading, conductivity, or porosity differences.

4. **Collect convergent evidence**
   - Acquire structural or interface verification before interpreting functional data.
   - Acquire functional performance under reference and stress conditions.
   - Acquire mechanism-specific diagnostics (e.g., transport proxies, impedance, post-operation morphology, compositional mapping).
   - *Decision gate:* If structural evidence contradicts the intended design, halt functional interpretation and return to redesign.

5. **Discriminate mechanisms through cross-validation**
   - Normalize comparisons fairly (e.g., active-component basis, total-system basis, background subtraction).
   - Require at least two independent measurement types to support the same mechanism.
   - Quantify uncertainty, batch variation, and measurement artifacts.
   - Classify each hypothesis as: verified, supported but incomplete, plausible but confounded, or rejected.
   - *Decision gate:* If the primary metric improves but controls fail or diagnostics contradict the claim, do not advance the mechanism.

6. **Bound claims and specify the operating envelope**
   - State explicitly where the effect should weaken, disappear, or reverse.
   - Identify residual risks (e.g., batch variability, uncontrolled interfaces, measurement drift).
   - Label every claim as paper-supported, user-provided, or agent-inferred.
   - *Decision gate:* If replicates are inconsistent or boundary tests fail, halt generalization and increase replication.

7. **Iterate, revise, or terminate**
   - **Continue:** Convergent evidence supports the mechanism → test the next design lever or boundary condition (return to step 3).
   - **Revise:** Mixed evidence → isolate the weakest link, update evidence strength, and redesign the component matrix (return to step 2 or 3).
   - **Pivot:** A control matches the proposed design → narrow the claim, reject the primary hypothesis, or redefine the bottleneck (return to step 1).
   - **Terminate:** Safety constraints are unmet, variability overwhelms the expected effect, or the mechanism is no longer plausible → archive failure modes and stop.

## Output Format

When using this skill, return:

1. **Research question:** one sentence tying the bottleneck to a target metric.
2. **Evidence-strength table:** hypotheses, evidence strength, key assumptions, predicted observations, and failure modes.
3. **Experimental design:** variables, component matrix, controls, primary and secondary metrics, and stop conditions.
4. **Analysis plan:** normalization strategy, convergent evidence logic, mechanism-inference rules, and uncertainty quantification.
5. **Iteration roadmap:** decision rules for continue, revise, pivot, or stop based on evidence profiles.
6. **Validity and safety notes:** confounders, reproducibility requirements, boundary limits, and non-operational safety constraints.

## Validation Gates

- **Structure verification gate:** Confirm that the intended architecture or interface exists through independent characterization before interpreting performance.
- **Control isolation gate:** The proposed mechanism must be distinguishable from generic effects (e.g., mixing, loading, conductivity, porosity, wetting).
- **Cross-validation gate:** At least two independent measurement types must converge on the same mechanistic explanation.
- **Normalization gate:** Comparisons must account for active fraction, total mass, geometry, and background contributions consistently.
- **Reproducibility gate:** Independent samples and repeated measurements must show consistent trends before claim advancement.
- **Boundary gate:** Claims must specify the operating envelope and must not be generalized beyond tested conditions.

## Claim Boundaries

- Distinguish paper-supported logic, user-provided evidence, and agent-inferred extensions; never present inference as established consensus.
- Limit claims to the tested material class, architecture family, and operating regime.
- Do not present lab-scale findings as commercial readiness, deployment safety, or field-wide truth.
- Separate architecture-specific or interface-specific effects from generic material improvements.

## Failure Modes

- **Structural failure:** The intended architecture or interface is not formed, is discontinuous, or degrades before functional testing.
- **Mechanism misattribution:** Improvement arises from uncontrolled mass, conductivity, porosity, contact quality, or measurement artifacts rather than the proposed design feature.
- **Transport trade-off:** Retention, protection, or confinement blocks necessary ion, electron, or mass transport.
- **Durability gap:** Initial improvement disappears under stress, aging, reuse, or extended operation.
- **Measurement artifact:** Background signals, instrument drift, or normalization errors mimic true performance gains.
- **Overgeneralization:** Claims extend beyond tested boundary conditions, chemistries, or device formats.

## Validity Checks

- **Confounding:** Are mass, geometry, substrate, conductive phase, and measurement conditions matched across variants?
- **Control quality:** Are baseline, mixture, partial-architecture, negative, and positive controls appropriate and defined?
- **Mechanistic specificity:** Do the proposed measurements distinguish the target mechanism from generic conductivity, porosity, or wetting effects?
- **Statistical validity:** Are endpoints predefined, replicates sufficient, and variability reported with effect sizes?
- **Reproducibility:** Can the same conclusion be reached from independent samples or repeated measurements?
- **Evidence labeling:** Are statements clearly marked as paper-supported, user-provided, inferred, or speculative?

## Provenance

- Derived from cluster 18 / subcluster 18.0, archetype: *observable-driven mechanism discovery and validation*.
- Synthesized from representative source skills: `flexible-lis-cathode-research-design`, `li-s-active-binder-research-design`, `rechargeable-sulfur-system-interface-exploration`, `enzyme-filter-research-design`, `llm-data-prep-pipeline-research`, `lithium-sulfur-architecture-research`, `conductive-protective-electrode-architecture`, `lightweight-conductive-network-battery-exploration`.
- Preserves the shared workflow route: bottleneck framing → hypothesis generation → minimal controlled design → convergent evidence analysis → mechanism discrimination → iterative redesign.
