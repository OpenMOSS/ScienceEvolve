---
name: sci-fiber-observable-driven-mechanism-discovery-workflo-6808b6f6
description: A reusable end-to-end workflow for generating, validating, and iterating on competing microscopic mechanism hypotheses that explain anomalous observables in transport, interfacial, or soft-matter systems.
scienceevolve-title: "Fiber composites and battery materials · observable driven mechanism discovery workflow 20"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

This skill helps an agent design research plans to explain anomalous or unexplained observables in materials and soft-matter systems—such as nonmonotonic transport, unexpected interfacial behavior, or morphology transitions—through controlled mechanism discovery. It abstracts a reusable pattern: decompose a nontrivial response into competing microscopic contributions, connect each contribution to measurable or model-computable correlations, and validate the mechanism through comparative controls and multi-observable analysis.

# When to use

Use this skill when a user asks to:
- Explain an anomalous observable (e.g., nonmonotonic field or temperature dependence, sign reversal, unexpected transport magnitude, or morphology switch) that is not accounted for by a simple baseline or single-mechanism model.
- Design studies that discriminate between competing microscopic mechanisms in systems involving transport, interfaces, polymers, or confined soft matter.
- Iterate from an initial observation to a validated mechanism claim, or to bound the limits of a proposed explanation.

Do not use this skill for routine passive characterization, standard device benchmarking, or operational laboratory protocols without a mechanism question.

# Inputs required

Before using this skill, collect or define:

- **Target system class**: material family, dimensionality, and relevant degrees of freedom (electronic, vibrational, structural, chemical).
- **Anomalous observable**: the specific response, signal, or feature that defies the baseline expectation.
- **Baseline model**: the simplest passive, single-mechanism, or fixed-property explanation against which the anomaly is judged.
- **Candidate mechanism families**: at least two competing microscopic explanations (e.g., local vs. extended correlations, interfacial vs. bulk effects, intrinsic vs. extrinsic contributions, passive vs. feedback-coupled transport).
- **Available modalities**: experimental, computational, or analytical tools accessible for validation.
- **Reference systems**: negative, positive, and mechanistic controls that can isolate variables.
- **Constraints**: safety, computational, reproducibility, and boundary-condition limits.

# Core Workflow

Follow this ordered route from anomaly to bounded mechanism claim. Execute decision gates at each stage; if a gate fails, iterate or stop.

## Stage 1: Anomaly framing and baseline definition
1. State the anomalous observable and the operating regime where it appears.
2. Define the baseline model that would apply if no novel mechanism were active.
3. Quantify the deviation: is it reproducible, statistically significant, and beyond baseline uncertainty?
   - **Decision gate 1**: If the anomaly vanishes under replication or is within baseline uncertainty, stop. Audit measurement stability, calibration, or initialization before proceeding.

## Stage 2: Mechanism decomposition and hypothesis generation
1. List at least two competing mechanism families that could produce the anomaly.
2. For each hypothesis, specify:
   - the microscopic contribution or correlation it invokes,
   - key assumptions,
   - predicted change under a strong control,
   - likely failure modes,
   - evidence strength (High / Medium / Low / Speculative).
3. Formulate a decomposition hypothesis: the anomaly arises from competition or coupling among contributions with distinct length-scale, field, temperature, or carrier-scale dependence.
   - **Decision gate 2**: If hypotheses are not mutually exclusive or cannot be independently tested, refine them until at least one falsifiable prediction distinguishes each mechanism.

## Stage 3: Validation design with controls
1. Define independent variables (e.g., correlation regime, field, temperature, composition, geometry, perturbation) and dependent variables (primary observable, secondary diagnostics).
2. Construct a control hierarchy:
   - **Negative control**: system or condition where the proposed mechanism is absent or symmetry-forbidden.
   - **Mechanistic/ablation control**: a variant lacking the key feature (e.g., altered interaction, removed functional group, decoupled feedback loop).
   - **Positive control**: a reference known to exhibit the proposed behavior, when available.
   - **Robustness control**: repeat under alternative models, geometries, or sampling conditions.
3. Define primary metrics (mechanism-specific) and secondary metrics (cross-observable consistency).
4. Define stop conditions upfront.
   - **Decision gate 3**: If controls cannot isolate the mechanism from confounders (e.g., processing artifacts, boundary effects, disorder), redesign the validation matrix before execution.

## Stage 4: Multi-observable execution and analysis
1. Acquire data or simulation outputs under baseline, test, and control conditions using consistent protocols.
2. Decompose the response into proposed contributions where the model supports separation.
3. Analyze limiting or asymptotic behavior to distinguish genuine mechanism competition from artifacts.
4. Require at least two orthogonal observables (e.g., transport + structural, thermodynamic + dynamic, spectrum + kinetics) to co-vary with the mechanism prediction.
5. Compare results against all controls using the same analysis pipeline.
   - **Decision gate 4**: If orthogonal observables contradict the primary mechanism prediction, or if negative controls reproduce the anomaly, proceed to Stage 6 (Iteration). Do not advance to claim formation.

## Stage 5: Mechanism discrimination and claim bounding
1. Rank hypotheses by consistency with the full evidence set.
2. Exclude mechanisms falsified by controls or by missing predicted co-variation.
3. Bound the claim:
   - Label directly computed or measured quantities as evidence.
   - Label inferred microscopic mechanisms as interpretation tied to assumptions.
   - State the tested regime and untested extrapolations explicitly.
   - **Decision gate 5**: If no hypothesis is strongly favored and all controls are satisfied, stop and report ambiguity. If one mechanism is strongly favored, proceed to boundary testing.

## Stage 6: Iteration or redesign
1. **If the anomaly persists without the proposed mechanism**: revisit the baseline model or search for an alternative mechanism family.
2. **If controls fail or are inconclusive**: fix design validity (e.g., sampling, equilibration, calibration, confounder isolation) before expanding parameter space.
3. **If results are ambiguous**: add an orthogonal observable or tighten the control set rather than increasing parameter sweep resolution.
4. **If the mechanism is supported**: test boundary conditions (e.g., loading, scale, temperature, geometry, disorder) to define the regime of validity.
5. **Global stop conditions**:
   - The anomaly appears without the proposed mechanism.
   - The mechanism cannot be isolated from conventional contributions.
   - The result depends on a narrow, unexplained parameter choice.
   - The inference contradicts independent structural, thermodynamic, or magnetic evidence.
   - Safety, compliance, or resource boundaries are reached.

# Output Format

When using this skill, produce a structured research plan containing:

1. **Research question** — One concise question framed around the anomaly and its possible microscopic origin.
2. **Gap and baseline failure** — Why the baseline model is insufficient.
3. **Ranked hypotheses table** — Columns: hypothesis, evidence strength, key assumptions, falsifiable prediction, likely failure modes, minimal validation observation.
4. **Validation design** — Independent and dependent variables; negative, mechanistic, positive, and robustness controls; primary and secondary metrics; stop conditions.
5. **Analysis plan** — Response decomposition, multi-observable integration, limiting-behavior tests, control-first interpretation, and uncertainty quantification.
6. **Iteration plan** — Decision rules for updating or rejecting each hypothesis based on structure, kinetics, transport, or morphology outcomes.
7. **Validity and claim boundary statement** — Confounders, reproducibility requirements, boundary conditions, and explicit labels separating evidence from inference.

# Validation Gates

- **Reproducibility gate**: The anomaly is confirmed across independent runs, samples, or initializations, exceeding baseline variability.
- **Control gate**: Negative and mechanistic controls are executed and interpreted; the anomaly weakens or disappears when the proposed mechanism is suppressed.
- **Orthogonality gate**: At least two independent observables co-vary in the direction predicted by the mechanism.
- **Robustness gate**: The conclusion survives reasonable changes in model assumptions, sampling, geometry, or data processing.
- **Consistency gate**: The mechanism claim does not contradict independent structural, thermodynamic, or spectroscopic evidence.

# Claim Boundaries

- **Direct evidence**: Trends, differences, or decompositions observed in controlled comparisons.
- **Inferred mechanism**: Microscopic interpretation linking observables to causal contributions; must be tagged with the assumptions required.
- **Extrapolation**: Any extension to untested materials, geometries, scales, operating regimes, or applications is speculative until validated.
- **Explicit labeling**: Every claim must be marked as either "supported by current validation," "inferred from analogy," or "not yet established."

# Failure Modes

- The apparent anomaly arises from an artifact, background, miscalibration, or processing variation rather than a physical mechanism.
- Competing mechanisms produce similar observables and cannot be isolated with available controls.
- The primary observable is dominated by a conventional or passive contribution, masking the proposed mechanism.
- The proposed mechanism operates only under a narrow, unphysical, or unreproducible parameter choice.
- Multi-observable evidence contradicts the single-observable inference, indicating a missing confounder.
- Scaling from model or diagnostic conditions to realistic operating conditions invalidates the mechanism.

# Validity Checks

- **Baseline separation**: Confirm that the fixed-property or single-mechanism baseline fails in the regime where the new mechanism is claimed.
- **Control adequacy**: Verify that controls isolate the mechanism from confounders such as geometry, disorder, initialization, boundary effects, and processing history.
- **Statistical and numerical validity**: Report uncertainty, convergence, sampling adequacy, and replicate consistency; avoid interpreting features smaller than the resolution.
- **Model validity**: State the assumptions and approximations of the theoretical, simulation, or analysis framework; check functional or force-field sensitivity where relevant.
- **Boundary conditions**: Explicitly list tested regimes and untested extrapolations (temperature, loading, scale, chemistry, environment).
- **Evidence labeling**: Distinguish paper-supported methodology from newly inferred mechanisms and from speculative extensions.

# Provenance

Synthesized from cluster 23.0 (observable-driven mechanism discovery and validation). Source skill references: `chirality-hall-transport-research-pattern`, `lignin-binder-lis-battery-research`, `crystalline-polymer-thermal-transport-exploration`, `perturbation-tuned-interface-energy-research`, `solvent-mediated-confined-polymer-research`, `feedback-responsive-transport-research`, `polymer-interface-thermodynamics-research`, `dark-matter-rare-event-research`.
