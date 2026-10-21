---
name: sci-quantum-quantum-metrology-resource-sensing-evidence-b49d53d5
description: A reusable end-to-end workflow for designing, validating, and auditing evidence claims in quantum metrology, resource characterization, and sensing by constructing hierarchical constraints, symmetry-guided observables, and controlled benchmarks to enforce claim boundaries and manage uncertainty.
scienceevolve-title: "Quantum materials and condensed matter · quantum metrology resource sensing evidence analysis workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Guide agents to transform an initial benchmark claim, theoretical bound, or resource diagnostic into an auditable research program. The workflow uses symmetry, invariance, or structural constraints to select observables, build hierarchical evidence levels, and enforce strict claim boundaries. It is designed for quantum regimes where standard approximations may fail, resources are finite, and conclusions must be separated from the assumptions that produce them.

# When to use

Use this skill when:

- A standard precision benchmark, resource measure, security certificate, or model validity claim may be too optimistic, undefined, or valid only in an asymptotic or idealized regime.
- Competing hypotheses about hidden structure, resource content, estimator bias, or protocol advantage need to be distinguished via observable-based descriptors.
- A proposed diagnostic, estimator, or protocol must be validated against strong baselines with explicit uncertainty and robustness checks.
- The task requires bounding claims, identifying failure modes, and iterating under decision gates rather than summarizing literature or copying paper-specific parameters.

Do not use this skill for operational hardware instructions, hazardous laboratory procedures, fabrication parameters, or as a source of field-wide consensus from single studies.

# Inputs required

Before producing a plan, request or identify:

- **Target claim or benchmark**: the standard bound, diagnostic, certificate statistic, or protocol being challenged or extended.
- **Structural assumptions**: symmetries, conservation laws, locality, sparsity, low-rank behavior, or invariants assumed to hold.
- **Observable inventory**: candidate measurements, simulations, or derived statistics that can test the claim.
- **Baseline alternatives**: existing methods, naive estimators, or null models for comparison.
- **Resource regime**: finite-data, finite-energy, mixed-state, low-signal, non-regular, or other limiting context.
- **Trust or validity boundary**: assumptions about noise, loss, adversary power, model validity, or device behavior.
- **Validation tools**: analytic derivation, symbolic computation, numerical simulation, or non-operational experimental comparison.

If inputs are missing, state assumptions explicitly and mark resulting claims as speculative.

# Core Workflow

Follow this ordered route. Execute decision gates sequentially; do not bypass a gate.

## 1. Frame the Claim as a Consistency Problem
State the benchmark claim and its formal assumptions. Identify the regime where the claim is expected to hold versus where it may fail.
- **Gate G1 (Scope Gate)**: If the claim has no falsifiable boundary, stop and reformulate the research question.

## 2. Map the Constraint Landscape
Inventory existing constraints, bounds, or diagnostics from related channels, models, or subfields. Determine whether the new question adds independent information or merely confirms known limits.
- **Gate G2 (Novelty Gate)**: If the proposed channel or diagnostic is fully covered by simpler constraints, stop or redirect to a different regime or observable family.

## 3. Build a Hierarchy of Generalized Constraints
Start from the simplest constraint that recovers the baseline. Add one structured constraint family at a time (e.g., symmetry, regularity, resource bound, trust boundary, finite-data correction). Predict how each level changes the expected outcome (bound gap, diagnostic shift, or security margin).
- **Gate G3 (Hierarchy Gate)**: If an added constraint is redundant, uninterpretable, or collapses immediately to the previous level, remove it and try a distinct family.

## 4. Generate Ranked Hypotheses
For each hierarchy level, produce falsifiable hypotheses with:
- Evidence strength (strong, moderate, weak, speculative).
- Key assumptions and structural dependencies.
- Predicted signature (gap, threshold, collapse, or divergence).
- Likely failure modes (model breakdown, noise dominance, convention dependence, background dominance).
- **Gate G4 (Candidate Gate)**: If no hypothesis can be falsified by available observables or simulations, redesign the observable set or narrow the claim.

## 5. Design Minimal Viable Validation
Define:
- Independent variables (regime, structure strength, resource allowance).
- Dependent variables (estimator variance, diagnostic value, certificate score, resource cost).
- Nuisance variables (background, calibration, finite-sample effects, implementation side channels).
Specify controls:
- **Baseline/naive control**: standard method without exploiting the new structure.
- **Positive control**: regime where the new structure should produce a detectable gap.
- **Negative control**: regime where the result should collapse to the baseline.
- **Robustness control**: perturbed assumptions, noise, finite data, or model mismatch.
Define success criteria and stop conditions before any data collection or simulation.
- **Gate G5 (Design Gate)**: If controls cannot distinguish target from failure states above a justified threshold, stop and revise.

## 6. Execute Analysis with Uncertainty Audit
- Reproduce the baseline under its ideal assumptions.
- Add constraints incrementally; record normalized gaps and hierarchy shifts.
- Separate statistical, systematic, model-validity, and resource uncertainties.
- Check limiting cases where the hierarchy must collapse to the baseline.
- **Gate G6 (Robustness Gate)**: If results depend mainly on arbitrary range choice, undocumented conventions, or unisolatable nuisance variables, stop and audit assumptions.

## 7. Iterate Under Decision Gates
Branch based on evidence:
- **If the generalized model collapses to the baseline**: The baseline is adequate for that regime. Return to Step 2 to search for a different failure mode or boundary.
- **If the generalized model diverges with an interpretable mechanism**: Isolate the responsible constraint. Proceed to boundary-sensitivity testing.
- **If divergence is uninterpretable**: Replace the constraint family. Return to Step 3.
- **If the validity boundary is stronger than the analysis region**: The interpretation is invalid. Return to Step 1 to restrict the regime or reformulate the model.
- **If controls fail**: Diagnose confounders before interpreting sensitivity. Return to Step 5.
- **If achievability is unproven**: Convert the next step into an achievability study; do not claim experimental reachability from bound validity alone.
- **Gate G7 (Stability Gate)**: If the proposed advantage disappears under realistic perturbations or a strong baseline comparison, stop and document failure modes.

## 8. Bound and Package Claims
Classify each conclusion by evidence strength and regime validity. State extrapolation boundaries explicitly. Document what is validated, inferred, or speculative.
- **Gate G8 (Claim Gate)**: If a claim generalizes beyond the tested model class, resource regime, or platform abstraction, reject or downgrade it.

# Output Format

Return a structured evidence package containing:

1. **Research question** — the specific gap and why it matters.
2. **Hypothesis table** — columns: hypothesis, mechanism, evidence strength, key assumptions, predicted signature, likely failure mode, minimal validation.
3. **Study design** — variables, controls, metrics, success criteria, and stop conditions.
4. **Hierarchy map** — ordered constraints, predicted gaps, and collapse regimes.
5. **Analysis plan** — baseline reproduction, incremental constraint testing, uncertainty decomposition, and limiting-case checks.
6. **Iteration log** — decisions at each gate and resulting redesigns.
7. **Validity and safety statement** — assumption audit, confounder checks, non-operational boundaries, and ethics constraints.
8. **Claim boundary summary** — validated claims, inferred claims, and speculative claims with explicit regime limits.

# Validation Gates

- **G1 Scope Gate**: The claim must possess a falsifiable boundary; otherwise reformulate.
- **G2 Novelty Gate**: The study must add independent information beyond existing simpler constraints.
- **G3 Hierarchy Gate**: Each added constraint must be non-redundant and interpretable.
- **G4 Candidate Gate**: Every hypothesis must be falsifiable by the available observable or simulation set.
- **G5 Design Gate**: Controls must distinguish target states from failure states above a justified threshold.
- **G6 Robustness Gate**: Results must not depend on arbitrary parameter ranges, undocumented conventions, or unisolatable nuisances.
- **G7 Stability Gate**: The proposed advantage must survive realistic perturbations and strong baseline comparison.
- **G8 Claim Gate**: Claims must not generalize beyond the tested model class, resource regime, or parameter range.

# Claim Boundaries

- Distinguish mathematically established bounds from model-dependent inference or speculative extension.
- Separate bound validity from experimental achievability; a valid lower bound does not imply reachable performance.
- Do not extend local or finite-regime results globally without additional justification.
- Do not treat certificate statistics, model consistency, or simulation agreement as evidence that a physical realization exists.
- Limit conclusions to the tested model class, resource regime, and parameter range.
- Clearly label paper-validated, method-derived, agent-proposed, and speculative claims.

# Failure Modes

- **Benchmark insufficiency**: The standard bound underestimates uncertainty or overestimates performance in the target regime.
- **Constraint redundancy**: An added hierarchy level provides no interpretable new information.
- **Model breakdown**: An approximate model (effective theory, perturbative expansion, idealized device) fails in the sensitive region.
- **Noise or nuisance dominance**: Statistical, systematic, background, or finite-data uncertainty overwhelms the predicted signal.
- **Convention dependence**: The result relies on undocumented normalization, basis choice, gauge, or operator ordering.
- **False advantage**: The proposed method underperforms a strong baseline after accounting for auxiliary resources and overhead.
- **Extrapolation overreach**: Conclusions are applied beyond validated system size, regime, platform class, or trust boundary.
- **Trust-boundary violation**: A security or certification claim assumes isolation that is not physically or logically guaranteed.

# Validity Checks

- **Assumption audit**: Every benchmark and generalized bound has explicit, stated assumptions.
- **Constraint audit**: Each added constraint is non-redundant and physically or mathematically interpretable.
- **Regularity audit**: Differentiability, support, invertibility, and symmetry requirements are stated.
- **Boundary audit**: Conclusions are tested against parameter-range and edge-effect sensitivity.
- **Resource audit**: Finite-resource and asymptotic regimes are not mixed without justification.
- **Noise audit**: Noise, mixedness, loss, decoherence, and estimator-bias effects are separated.
- **Baseline fairness**: Comparisons use the same access model, error metric, and success definition.
- **Reproducibility audit**: Model choices, comparison groups, metrics, random seeds, and stop conditions are documented for independent repetition.
- **Extrapolation audit**: Claims are limited to the validated model class, resource regime, and parameter range.

# Provenance

- Synthesized from cluster `47.0` (symmetry-guided evidence analysis and claim audit).
- Source skill references: `eft-validity-bound-research-design`, `device-independent-quantum-security-workflow`, `encrypted-quantum-redundancy-research`, `quantum-metrology-bound-hierarchy-research-design`, `nuclear-structure-invariant-research-workflow`, `quantum-observable-estimation-workflow`, `quantum-resource-sampling-workflow`, `measurement-assisted-quantum-research`.
- Method patterns abstracted from reviewed quantum metrology, resource characterization, and sensing literature. No paper-specific systems, materials, parameters, numerical results, or operational protocols are embedded.
