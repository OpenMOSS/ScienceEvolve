---
name: sci-fusion-stellarator-fusion-plasma-transport-mechanis-469d8c83
description: A reusable end-to-end workflow for generating, validating, and bounding mechanism-based hypotheses in stellarator and magnetic-confinement fusion plasma transport research.
scienceevolve-title: "Magnetic confinement fusion · stellarator fusion plasma transport mechanism discovery workflow"
scienceevolve-area: magnetic-confinement-fusion
---

# Purpose

Use this skill to drive observable-driven mechanism discovery and validation in stellarator and magnetic-confinement fusion research. It guides an agent from an unresolved decision gap through hypothesis generation, minimal validation design, multi-fidelity analysis, mechanism discrimination, and bounded claim formulation without relying on any single paper, device, or numerical result as consensus.

# When to use

Trigger this skill when the user needs to:

- Formulate new research questions around plasma confinement, transport, stability, exhaust, or integrated performance in toroidal magnetic-confinement systems.
- Design staged validation plans that combine simulation, diagnostic analysis, and controlled comparison.
- Compare candidate mechanisms linking magnetic geometry, profile shaping, or boundary conditions to observable transport or stability outcomes.
- Iterate a research plan based on evidence from independent checks, robustness tests, or control failures.

Do not use for operational device control, clinical or biological tasks, or unrelated energy policy.

# Inputs required

- **Decision gap:** what existing evidence cannot decide.
- **Target subsystem:** confinement, transport, stability, heating and current drive, exhaust, boundary or divertor, or integrated performance.
- **Candidate mechanism:** the proposed physical pathway from design choice to observable signature.
- **Available evidence:** prior experiments, simulations, scaling laws, or literature benchmarks.
- **Validation level:** analytic study, simulation, reduced-scale experiment, or integrated study.
- **Constraints:** safety boundaries, non-operational scope, computational limits, diagnostic access, and institutional oversight requirements.

If inputs are missing, state assumptions explicitly, mark them as uncertain, and design a validation step that can test them.

# Core Workflow

1. **Frame the decision gap.** Define the coupled performance bottleneck and state exactly what evidence is missing.
2. **Map candidate mechanisms.** Build causal chains (design choice → physical mechanism → observable signature). Generate at least three competing hypotheses.
   - *Gate:* If a hypothesis lacks a falsifiable causal chain, reject it before proceeding.
3. **Rank hypotheses.** Score each for mechanism plausibility, prior evidence, controllability, diagnostic accessibility, and decision relevance. Label evidence strength as strong, moderate, weak, or speculative.
4. **Design minimal viable validation.** Specify baseline, intervention, positive control, negative control, strong control, independent variables, dependent variables, metrics, and stop conditions.
   - *Gate:* If controls cannot isolate the mechanism from confounders, redesign before execution.
5. **Execute validation.** Run the simulation or non-operational study.
   - *Stop condition:* Halt if safety limits are approached, diagnostics fail, instability emerges, or the intervention cannot answer the question.
6. **Analyze results.** Perform data-integrity checks, mechanism-specific tests, scaling checks, model comparisons, uncertainty propagation, and control validation.
7. **Discriminate mechanisms.** Classify each hypothesis as supported, weakened, refuted, or inconclusive by comparing predicted and observed signatures.
   - *Iteration:* If inconclusive, add targeted diagnostics or simplify variables and return to step 4.
   - *Iteration:* If refuted, reject or revise the mechanism without adding unfalsifiable assumptions and return to step 2 or 3.
8. **Robustness check.** Perturb profiles, boundary conditions, geometry assumptions, and model choices. Verify the mechanism survives plausible variations.
   - *Gate:* If results depend on a single untested assumption, narrow the claim boundary before escalation.
9. **Bound claims and decide.** Label evidence type (measured, simulated, extrapolated, inferred). Define the valid operating window. Decide whether to escalate, refine, deprioritize, or stop.

# Output Format

Return:

1. **Research question** — decision gap, motivation, and evidence status.
2. **Candidate hypotheses** — mechanism chain, evidence strength, key assumptions, and failure modes.
3. **Minimal validation plan** — baseline, intervention, controls, variables, metrics, and stop conditions.
4. **Analysis plan** — data checks, mechanism tests, scaling checks, model comparisons, and uncertainty treatment.
5. **Mechanism discrimination** — classification of each hypothesis and rationale.
6. **Iteration plan** — update rules, escalation path, and conditions for pausing or rejecting.
7. **Validity and boundary statement** — confounders, reproducibility checks, extrapolation limits, and safety review requirements.

# Validation Gates

- **Causal clarity gate:** Every hypothesis must link design choice to mechanism to observable.
- **Control isolation gate:** The minimal validation must include at least one negative and one strong control that can falsify the central assumption.
- **Safety gate:** All proposed actions remain non-operational; hazardous or device-specific procedures are excluded.
- **Mechanism specificity gate:** Observed changes must be attributed to the proposed causal chain, not to correlated artifacts or confounders.
- **Robustness gate:** Claims require sensitivity to profile, boundary, and model variations; single-point successes are not sufficient.
- **Evidence-labeling gate:** All claims must be tagged as measured, simulated, extrapolated, or inferred before finalization.

# Claim Boundaries

- Do not generalize from a single device, simulation family, or campaign to field-wide consensus.
- Do not extrapolate across regime boundaries without independent validation.
- Distinguish equilibrium existence, stability, transport, and operational feasibility as separate claims.
- Treat computational feasibility as distinct from engineering readiness or operational safety.
- Label any claim that depends on an unmeasured source, unverified profile assumption, or single-machine observation as conditional.

# Failure Modes

- **Confounded mechanism:** The intervention improves the metric through an unrelated pathway because controls are inadequate.
- **Overfitted design:** A configuration appears optimal only at a single point in parameter space and fails robustness checks.
- **False extrapolation:** Scaling laws or models are applied outside their validated domain.
- **Diagnostic ambiguity:** Sparse or uncalibrated data produce apparent support for multiple incompatible mechanisms.
- **Unfalsifiable rescue:** A refuted hypothesis is preserved by adding post-hoc assumptions rather than revising the mechanism.
- **Safety bypass:** The workflow is used to justify operational procedures without institutional review.

# Validity Checks

Before finalizing any output, verify:

- **Confounding:** Are geometry, heating, boundary conditions, impurities, diagnostics, or model choices offering an alternative explanation?
- **Reproducibility:** Can the validation be repeated across independent shots, simulations, datasets, or facilities?
- **Statistical validity:** Are uncertainty estimates, sample counts, and regression assumptions appropriate?
- **Scaling validity:** Is extrapolation bounded by data, or does it cross a regime boundary?
- **Mechanism specificity:** Does the intervention affect the intended physical pathway?
- **Evidence labeling:** Are claims clearly marked by evidence type and strength?
- **Boundary conditions:** Are conclusions limited to tested configurations, profiles, and diagnostics?

# Provenance

Synthesized from cluster 3, subcluster 3.1 (observable-driven mechanism discovery and validation). Derived from source skills: `magnetic-confinement-fusion-research-design` (10.1051_refdp_2024s104), `fusion-plasma-materials-research-workflow` (10.3390_app13106240), `stellarator-pellet-fueling-research-pattern` (10.1088_1361-6587_ab3567), `compact-stellarator-research-workflow` (10.1103_physrevlett.89.125003), `tokamak-asymmetric-equilibrium-workflow` (10.1063_5.0237688), `stellarator-research-design` (10.1017_s0022377825000364), `stellarator-divertor-research-design` (10.1088_0741-3335_44_6_325), and `stellarator-wave-coupling-research-design` (10.1088_0741-3335_40_4_006).
