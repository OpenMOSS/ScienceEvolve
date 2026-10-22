---
name: sci-fiber-observable-driven-mechanism-discovery-workflo-1dd3a072
description: A reusable end-to-end workflow for generating, discriminating, and validating mechanistic hypotheses in interfacial and material systems using observable-driven evidence triangulation and controlled iteration.
scienceevolve-title: "Fiber composites and battery materials · observable driven mechanism discovery workflow 24"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Synthesize an end-to-end research workflow that moves from an observable performance gap to a validated mechanistic claim. It guides agents to frame questions around mismatches between structure and function, generate ranked hypotheses with explicit evidence strength, design minimal validation studies with strong controls, triangulate orthogonal evidence, bound claims, and iterate until mechanisms are supported, falsified, or reframed.

# When to use

Use this skill when a user asks to:

- Propose or evaluate research questions involving interfacial stability, material transport, adsorption selectivity, composite architecture, or functional performance gaps.
- Convert an observed anomaly or performance limit into a testable mechanistic hypothesis.
- Design controlled experiments or analyses that discriminate between competing mechanisms rather than optimizing a single metric.
- Iterate a study plan based on partial support, contradiction, or confounding evidence.
- Validate claims in domains such as energy storage interfaces, environmental remediation materials, self-healing structures, bio-derived composites, or data-driven predictive systems.

Do not use this skill for operational laboratory protocols, clinical decision-making, consumer product guidance, or as a substitute for domain-specific safety review and regulatory compliance.

# Inputs required

Before producing a plan, request or infer:

1. **Observable gap**: the performance mismatch, failure mode, or unexplained behavior that motivates the study.
2. **System scope**: the material, interface, or device family under study, described conceptually without paper-specific recipes.
3. **Candidate mechanisms**: plausible physical, chemical, transport, or structural pathways that could explain the gap.
4. **Evidence baseline**: prior literature support, preliminary data, or simulation results available for the system.
5. **Evaluation context**: whether the claim must hold at the intrinsic, component, or system level.
6. **Constraints**: safety boundaries, non-operational hazard categories, environmental limits, and ethical guardrails.
7. **Decision criteria**: thresholds for success, failure, and iteration, including unacceptable confounders.

# Core Workflow

## Stage 1 — Gap framing and hypothesis generation
1. Define the observable gap as a mismatch between intended function and measured behavior.
2. Decompose the system into interacting modules (e.g., bulk, interface, transport path, matrix, active phase).
3. Generate at least three competing or complementary mechanistic hypotheses using a structured template:
   - Hypothesis statement (causal claim)
   - Proposed mechanism (pathway linking structure to function)
   - Evidence strength (`paper-supported`, `literature-supported`, `mechanism-inferred`, `speculative`)
   - Key assumptions (conditions required for the hypothesis to hold)
   - Likely failure modes (how the mechanism could fail)
   - Discriminating observation (the smallest evidence that would support or refute it)
4. Label each hypothesis by whether it addresses intrinsic properties, interfacial processes, architectural effects, or external confounders.

## Stage 2 — Validation design
5. Design a **minimal viable validation** (MVV) ladder:
   - Define independent variables that isolate one mechanism.
   - Define dependent variables that span performance, structure, and process.
   - Select controls: negative (absence of proposed feature), reduced (feature present but mechanism disabled), positive (known benchmark), and ablation (remove one variable at a time).
   - Predefine stopping conditions: no improvement over negative control, artifact detected, confounder dominates, or safety boundary reached.
6. Choose orthogonal evidence streams that triangulate the mechanism (e.g., composition, morphology, transport metrics, electrochemical response, simulation).
7. Normalize comparisons by relevant geometry, loading, density, orientation, or temporal alignment to avoid metric conflation.

## Stage 3 — Execution and mechanism discrimination
8. Collect evidence in a staged order: confirm material identity or data quality first, then interpret performance.
9. At **Candidate Gate 1**: If the proposed mechanism cannot be chemically or structurally distinguished from a baseline artifact, stop and redesign the discriminating measurement.
10. At **Candidate Gate 2**: If performance improves but the reduced control matches the active design, reject the mechanism-specific claim and revisit the hypothesis.
11. At **Mechanism Exclusion Gate**: If orthogonal evidence streams conflict, do not average the conflict; redesign the decisive test or split the hypothesis.

## Stage 4 — Claim bounding and robustness
12. Bound claims to the tested conditions:
   - Separate intrinsic from system-level contributions.
   - Separate observed results from inferred mechanisms and speculative extensions.
   - State boundary conditions where the claim is expected to fail.
13. Apply **Stability Gate**: Check whether the result holds across batches, replicates, temporal splits, or spatial subsets.
14. Apply **Robustness Check**: Test whether the conclusion survives changes in normalization, baseline comparison, or confounder adjustment.

## Stage 5 — Iteration or redesign
15. Classify the result as `supports`, `partially supports`, `refutes`, or `inconclusive`.
16. Map the result to the process-structure-property or predictor-outcome chain.
17. If partially supported: narrow the hypothesis scope and add a stronger discriminating measurement.
18. If refuted: generate a mechanism-divergent hypothesis (e.g., self-healing vs. passive barrier, interfacial vs. bulk transport).
19. If inconclusive: resolve measurement or sample-preparation confounders before expanding scope.
20. **Iteration stop condition**: Stop when the hypothesis is falsified, when further tests would repeat the same evidence, or when the claim leaves the validated system family.

# Output Format

When using this skill, produce:

1. **Research question**: one concise question tied to the observable gap and system context.
2. **Gap statement**: what is missing from current evidence or design logic.
3. **Ranked hypotheses**: table with mechanism, evidence strength, key assumptions, likely failure modes, and discriminating observation.
4. **Validation plan**: non-operational experimental or analytical blocks, controls, orthogonal evidence streams, metrics, and stop criteria.
5. **Control table**: explicit listing of negative, reduced, positive, and ablation controls with their purpose.
6. **Analysis plan**: how to separate intrinsic, interfacial, architectural, or confounding contributions; mechanism triangulation rules; uncertainty handling.
7. **Claim boundary**: explicit limits on generalization, chemistry, scale, and operating conditions.
8. **Failure modes**: anticipated experimental, analytical, and inferential failure patterns.
9. **Iteration path**: next hypothesis update for support, partial support, refutation, or inconclusive results.
10. **Validity and safety notes**: confounders, reproducibility checks, boundary conditions, and non-operational safety framing.

# Validation Gates

- **Gate 1 — Identity/Quality**: Confirm the material or data source is what it is claimed to be before interpreting performance.
- **Gate 2 — Control Discrimination**: The active design must outperform the reduced or negative control by a pre-defined margin.
- **Gate 3 — Mechanism Triangulation**: At least two independent evidence streams must agree before a mechanism is assigned.
- **Gate 4 — Normalization Consistency**: Comparisons must use like-for-like metrics and relevant baselines.
- **Gate 5 — Reproducibility**: Independent replicates or batches must show the same directional effect.
- **Gate 6 — Safety/Ethics Boundary**: Research design must remain within non-operational guidance and approved hazard categories.

# Claim Boundaries

- Treat any single source paper or dataset as one evidence source, not field-wide consensus.
- Distinguish observed results, model-supported interpretations, and speculative extensions.
- Limit claims to the tested material family, chemistry, geometry, matrix, or environmental context.
- Do not conflate component-level behavior with system-level performance without interfacial or architectural justification.
- Avoid implying device certification, clinical readiness, or environmental remediation readiness without independent validation.

# Failure Modes

- **Hypothesis failure**: The proposed mechanism is indistinguishable from a simpler explanation (e.g., loading effect, density difference, sampling artifact).
- **Control failure**: Negative or reduced controls perform equivalently to the active design, indicating no mechanism-specific effect.
- **Measurement failure**: Confounding by contact resistance, radiation/convection, moisture history, method changes, or temporal leakage.
- **Interpretation failure**: Inferring mechanism from a single metric, model fit, or imaging snapshot without orthogonal support.
- **Generalization failure**: Extrapolating beyond the tested boundary conditions, chemistry, or scale.
- **Iteration failure**: Continuing to optimize one variable after the mechanism has been falsified or after trade-offs become unacceptable.

# Validity Checks

Before presenting conclusions, verify:

- Confounders are addressed: native variability, sample transfer, residual species, separator effects, electrolyte depletion, pressure/contact variation, imaging artifacts, seasonality, spatial leakage, and class imbalance.
- Statistical validity: appropriate replication, variance reporting, model comparison criteria, parameter identifiability, and avoidance of overfitting.
- Reproducibility: clear documentation of material roles, normalization basis, controls, diagnostics, split definitions, and failure criteria.
- Boundary conditions: idealized versus real matrices, single versus mixed components, short-term versus aging behavior, lab-scale versus field-scale claims.
- Mechanism specificity: the proposed interaction or pathway is directly tested, not inferred from a single property improvement.
- Safety and ethics: outputs remain at research-design level; hazard categories are identified but not executed; no clinical or operational public-health decisions are implied.

# Provenance

- Derived from cluster 8.0 (observable-driven mechanism discovery and validation).
- Synthesized from representative source skills: `thermally-conductive-fiber-research-design`, `environmental-adsorbent-research-exploration`, `flexible-alkali-chalcogen-battery-workflow`, `reactive-artificial-sei-research-design`, `self-healing-composite-research-workflow`, `explainable-hab-toxicity-research`, `bio-interface-adhesion-research`, `clustered-embedding-feature-research`.
- Preserves shared patterns: gap framing, evidence-strength labeling, minimal viable validation, orthogonal evidence triangulation, claim bounding, and iterative hypothesis revision.
