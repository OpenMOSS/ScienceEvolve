---
name: sci-quantum-mechanism-discovery-validation-workflow-3-7d951fb3
description: A reusable end-to-end workflow for discovering and validating microscopic mechanisms behind anomalous or regime-dependent responses in physical systems under controlled or extreme conditions.
scienceevolve-title: "Quantum materials and condensed matter · mechanism discovery validation workflow 3"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Guide agents to turn an observed anomaly, scaling law, or regime transition into a testable, iterated research program that discriminates among competing microscopic mechanisms and validates the leading candidate before making causal claims.

# When to use

Use this skill when a user asks to:

- Propose new research questions about non-smooth, anomalous, or regime-dependent behavior in physical systems.
- Design studies that separate intrinsic mechanisms from extrinsic artifacts, background effects, or measurement-dependent trends.
- Compare competing explanations for a threshold, scaling relation, or state transformation using controlled observations or computations.
- Iterate from partial explanations to refined hypotheses based on multi-observable evidence.

Do not use this skill for clinical, biological, or operational wet-lab protocol design. Keep outputs at the non-operational research-planning level.

# Inputs required

Before producing a study plan, request or infer:

- Target system class and relevant state variables (e.g., pressure, temperature, field, scale, coupling).
- Observed or predicted anomaly: the response variable that deviates from baseline behavior and the condition range where it occurs.
- Candidate mechanisms and their expected causal chains from microscopic change to macroscopic signature.
- Available evidence types: raw measurements, computational outputs, literature benchmarks, or conceptual hypotheses.
- Feasibility constraints, safety context, and desired claim level at a high level.
- Required output granularity: hypothesis list, validation plan, analysis plan, or full research program.

If key inputs are missing, state assumptions explicitly and label conclusions as conditional.

# Core Workflow

Follow this ordered end-to-end route, applying the decision gates and stop conditions at each stage.

1. **Define the gap and behavioral regimes**
   - State the observed anomaly, scaling, or regime transition and identify the baseline (smooth/expected) behavior.
   - Map the low-response, intermediate, and high-response or history-dependent regimes.
   - *Decision gate:* If the anomaly cannot be distinguished from noise, calibration drift, or artifact, stop and redesign the observation baseline.

2. **Map competing mechanisms**
   - For each candidate mechanism, build a causal chain: control variable → microscopic change → observable response.
   - Generate at least two falsifiable hypotheses with distinct predicted signatures across primary and secondary observables.
   - Label evidence strength (e.g., directly supported, model-supported, analogical, speculative) and state key assumptions.
   - *Decision gate:* If hypotheses predict identical observable patterns, redesign the probe or add secondary observables before proceeding.

3. **Design minimal validation**
   - Select independent variables (state variable, perturbation level, path) and dependent variables (primary response, secondary response, baseline response).
   - Define controls: baseline/unperturbed, positive, negative, extrinsic/artifact, and robustness.
   - Pre-register analysis choices, stopping rules, and failure criteria.
   - *Decision gate:* If the planned dynamic range or control set cannot resolve the mechanism, escalate to stronger controls or an alternative probe.

4. **Execute and maintain data lineage**
   - Acquire or load data; separate raw signals, derived quantities, and interpreted mechanisms.
   - Verify calibration stability, baseline behavior, and control integrity.
   - *Decision gate:* If baseline or control behavior is anomalous, halt to diagnose confounders before testing the target hypothesis.

5. **Analyze and discriminate mechanisms**
   - Sanity-check against benchmarks or limiting behavior.
   - Decompose the observable into physically meaningful channels or components.
   - Compare predicted signatures against observations for each hypothesis.
   - Perform sensitivity and uncertainty analysis; test whether the anomaly exceeds combined uncertainty.
   - *Decision gate:*
     - If one hypothesis is strongly supported by multiple independent observables, proceed to claim formulation.
     - If multiple hypotheses fit equally well, return to Step 3 to identify a better discriminating test.
     - If the leading hypothesis is only partially supported, proceed to Step 6.

6. **Iterate and refine**
   - Update evidence strength for each hypothesis based on the latest results.
   - If partially supported: refine the mechanism model, test combined mechanisms, or add latent variables.
   - If failed: demote the hypothesis and return to Step 2 to generate alternatives.
   - If strong support: design robustness tests or extend to adjacent systems.
   - *Stop conditions:*
     - The mechanism explains the anomaly with coherent multi-observable support and surviving controls.
     - No discriminating observable is available after reasonable redesign.
     - Core assumptions (e.g., state-variable alignment, sample integrity, background model) are violated.

7. **Formulate bounded claims**
   - Classify each hypothesis as supported, partially supported, unsupported, or unresolved.
   - State boundaries: valid system class, state-variable range, and model assumptions.
   - Clearly label directly observed, model-supported, and speculative inferences.

# Output Format

When using this skill, produce the following structure unless the user requests a different format:

1. **Research question** — anomaly, system class, and why the question is unresolved.
2. **Mechanism map** — competing hypotheses with causal chains from control variable to microscopic change to observable response.
3. **Hypothesis table** — columns: hypothesis, evidence strength, key assumptions, expected signatures, likely failure modes, discriminating test.
4. **Validation plan** — variables, controls, minimal viable validation, strong controls, primary and secondary metrics, and stop conditions.
5. **Analysis plan** — data lineage, trend decomposition, sensitivity checks, benchmark comparison, uncertainty handling, and decision rules.
6. **Iteration path** — how results support, weaken, falsify, or redirect each hypothesis; next steps for partial or ambiguous outcomes.
7. **Validity and boundary statement** — confounders, reproducibility requirements, statistical checks, claim limits, and non-operational safety constraints.

# Validation Gates

Before advancing past each stage, confirm:

- **Trigger fit:** the task is mechanism-discovery research planning, not general science advice or operational execution.
- **Mechanism clarity:** the proposed mechanism has a causal pathway from microscopic perturbation to macroscopic observable.
- **Baseline validity:** the unperturbed or reference case is validated before perturbation claims are made.
- **Control completeness:** negative, positive, extrinsic, and robustness controls are considered.
- **Convergence:** numerical grids, sampling, averaging, model truncation, or background choices do not change qualitative conclusions.
- **Extrinsic awareness:** artifacts, background, drift, interfaces, and sample-history effects are addressed before interpreting disagreement.
- **Reproducibility:** inputs, transformations, sampling strategy, and analysis choices are documented.

# Claim Boundaries

- Do not generalize a single-system mechanism to all related systems without independent justification.
- Do not present model-supported inferences or analogical transfers as directly observed facts.
- Do not extrapolate beyond the validated state-variable range, model domain, or thermodynamic path.
- Distinguish clearly between directly observed evidence, model-supported predictions, and speculative extensions.

# Failure Modes

- The anomaly appears only in derived quantities and not in raw or baseline data.
- Competing mechanisms fit equally well and no discriminating observable is available.
- Baseline recovery fails in the regime claimed to be intrinsic or reversible.
- Controls are indistinguishable from the target signal or from one another.
- Dominant noise or background shares the same structure as the expected signal.
- Results depend strongly on unsupported calibration, numerical, path, or preprocessing assumptions.
- Uncertainty dominates the predicted regime difference or mechanism attribution.

# Validity Checks

Before finalizing a research plan or conclusion, verify:

- **Confounding:** Are state variables, sample history, environmental factors, and path dependence controlled or recorded?
- **Reversibility:** Does the system return to baseline after perturbation in the regime claimed to be intrinsic?
- **Dynamic range:** Is the perturbation range broad enough to distinguish linear, nonlinear, and competing regimes?
- **Statistical validity:** Is uncertainty propagated to derived quantities, and does the anomaly exceed combined measurement and model uncertainty?
- **Mechanism specificity:** Does the design distinguish the proposed mechanism from simpler alternatives?
- **Boundary conditions:** Are conclusions limited to the tested system class, state range, and model assumptions?
- **Evidence labeling:** Are paper-validated findings, transferred inferences, and agent-generated hypotheses clearly separated?

# Provenance

- Synthesized from cluster 169, subcluster 169.0.
- Derived from source skills: finite-temperature-magnetic-damping-exploration; storage-ring-resonance-exploration; extreme-conditions-anomaly-mechanism-design; geomaterial-nonlinear-dynamics-exploration; cryogenic-magnetocaloric-exploration; nuclear-pairing-regime-exploration; dislocation-source-scaling-research; coherent-null-search-precision-metrology.
