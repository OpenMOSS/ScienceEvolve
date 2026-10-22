---
name: sci-quantum-symmetry-guided-mechanism-discovery-workflo-1251b5d2
description: A reusable end-to-end workflow for generating, testing, and iterating competing mechanism hypotheses in quantum, transport, spin, and topological materials research through symmetry-aware controls and orthogonal validation.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided mechanism discovery workflow 37"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Help an agent turn an ambiguous observation in quantum materials into a structured, reusable research workflow. The goal is to discover and validate microscopic mechanisms by linking symmetry, electronic structure, and measured response through falsifiable hypotheses and control-rich experiments or computations.

## When to use

- When the user asks to propose new research questions around anomalous transport, optical, magnetic, or spectroscopic signatures.
- When competing mechanisms—such as topological, symmetry-breaking, disorder-driven, interaction-driven, or artifact—need discrimination.
- When designing experiments or simulations to connect a control knob to a response via band structure, spin, or symmetry changes.
- When iterating hypotheses based on multi-probe evidence.

Do not use this skill for operational laboratory protocols, clinical or biological research, or when the user only requests a literature summary.

## Inputs required

Before using the skill, collect or request:

- Target system class and known symmetry, band, or order-parameter characteristics.
- The observed anomaly or response of interest and its measurement context.
- Available probes or modeling modalities and their physical sensitivity.
- Candidate mechanisms and prior evidence, including supporting and contradicting reports.
- Practical constraints: sample variability, computational limits, measurement feasibility, and safety boundaries.
- Desired output type: research question, hypothesis set, experiment/computation design, analysis plan, or iteration strategy.

## Core Workflow

Follow this ordered route. Apply decision gates at each numbered step and stop or loop when a stop condition is met.

1. **Frame the observable-to-process gap.**  
   State what is directly measured, what microscopic mechanism is inferred, and why the inference is uncertain.  
   **Gate:** If the gap cannot be expressed as a falsifiable question, stop and refine the research target.

2. **Generate competing mechanisms.**  
   Produce at least three alternatives (e.g., intrinsic symmetry/topo mechanism, disorder/localization, interaction/collective order, artifact/confounding). Map each to a distinct stage, scale, or regime.  
   **Gate:** If mechanisms do not predict distinguishable signatures, flag low discriminability and seek additional probes or tuning axes.

3. **Conduct a symmetry and scale audit.**  
   Identify intrinsic scales (level spacing, gap, symmetry class, exchange, relaxation) and extrinsic/drive scales (field, density, strain, photon energy, pressure). Determine how symmetry breaking or tuning knobs alter each candidate mechanism.  
   **Gate:** If the proposed mechanism lacks a symmetry-allowed or scale-linked observable, demote to speculative.

4. **Translate mechanisms into falsifiable predictions.**  
   For each hypothesis specify: the expected regime or kinetic stage that should change; the observable signature; the control variable that discriminates it; and the result that would falsify it.

5. **Design minimal viable validation.**  
   Define one baseline, one target condition, one primary metric, and one orthogonal or boundary check. Include a negative or trivial control.  
   **Gate:** If the minimal design lacks any control or stop condition, pause and redesign.

6. **Execute and analyze with regime separation.**  
   Separate measured facts from interpretation. Extract stage-specific or regime-specific signatures. Compare results across positive, negative, boundary, and artifact controls.  
   **Gate:** If controls fail, artifacts dominate, or the signal is smaller than propagated uncertainty, stop and diagnose before claiming a mechanism.

7. **Score evidence and update hypotheses.**  
   Rank each hypothesis:
   - **Strong:** multiple independent observables agree and alternatives are constrained.
   - **Moderate:** main observable supports the prediction, but at least one alternative remains plausible.
   - **Weak:** explains an amplitude trend but lacks kinetic, regime, or orthogonal support.
   - **Speculative:** based mainly on analogy or theory without direct support in the target system.  
   **Decision:**  
   - If evidence is strong within a bounded domain, document claim boundaries and proceed to broader validation if needed.  
   - If moderate, propose the next smallest discriminating test.  
   - If weak or contradictory, revise or reject the hypothesis.

8. **Iterate or terminate.**  
   Return to step 4 with revised hypotheses.  
   **Stop conditions:**  
   - The diagnostic signature disappears under improved controls.  
   - The inferred boundary depends on arbitrary analysis choices.  
   - Independent probes locate the anomaly elsewhere or contradict the mechanism.  
   - Reproducibility fails without an identified cause.  
   - Safety or validity constraints prevent meaningful testing.

## Output Format

Produce a structured research plan containing:

1. **Research question** — Observable, target system class, and process-level gap.
2. **Mechanism map** — Candidate stages/regimes and what each would imply.
3. **Hypotheses** — For each: claim, evidence strength, key assumption, predicted signature, likely failure mode, and extrapolation boundary.
4. **Experiment or computation design** — Independent variables, dependent variables, minimal viable validation, controls (positive, negative, boundary, artifact), and stop conditions.
5. **Analysis plan** — Regime separation, feature assignment, kinetic or scaling extraction, cross-probe comparison, model comparison, and uncertainty handling.
6. **Iteration plan** — What result would strengthen, revise, reject, or demote each hypothesis.
7. **Validity and safety notes** — Confounders, reproducibility checks, extrapolation boundaries, and non-operational safety constraints.

## Validation Gates

Before finalizing any plan or claim, confirm:

- **Mechanism discrimination:** The chosen observable distinguishes at least two plausible mechanisms.
- **Control adequacy:** Positive, negative, boundary, and artifact controls are specified.
- **Confounding audit:** Disorder, heating, contact effects, geometry, calibration, background, and sample history are considered.
- **Reproducibility:** Results are expected to be consistent across samples, devices, preparations, or repeated measurements.
- **Statistical validity:** Uncertainties, fitting assumptions, model degeneracies, and sensitivity to analysis windows are reported.
- **Boundary validity:** Phase or regime boundaries are operational and explicitly bounded.
- **Symmetry consistency:** Claims respect allowed tensor components, selection rules, and conservation laws.

## Claim Boundaries

- Distinguish observed data from model-dependent inference and from analogy-based speculation.
- Limit conclusions to the tested material class, composition window, symmetry class, and measurement regime.
- Do not treat single-device, single-filling, or single-analysis results as universal phase diagrams.
- Mark extrapolation beyond tested scales, symmetries, or perturbation ranges as speculative.
- Require independent validation before translating computational predictions to experimental performance claims.

## Failure Modes

- Diagnostic signature persists in negative or trivial controls.
- Signature disappears despite robust presence of the proposed feature.
- Response depends on arbitrary normalization, background subtraction, or index assignment.
- Tuning variable confounds multiple mechanisms simultaneously (e.g., temperature changing disorder, structure, and carrier density).
- Model overfitting without independent stage or regime assignment.
- Single-probe evidence treated as sufficient for a microscopic mechanism claim.
- Baseline model applied outside its validated regime.

## Validity Checks

- Separate measured facts from interpretation before assigning mechanisms.
- Verify baseline or background model validity before residual extraction.
- Propagate uncertainty from raw data, baseline construction, and fitting into all conclusions.
- Test robustness to alternative analysis windows, background models, and fitting ranges.
- Extract phase boundaries with explicit onset criteria; treat them as operational until independently validated.
- Require agreement in process or regime across orthogonal probes, not merely agreement in sign or amplitude.
- Ensure conclusions account for both positive and negative results.

## Provenance

- Synthesized from cluster 21.0 (symmetry-guided mechanism discovery and validation).
- Source skills: vdw-magnetic-exciton-dynamics-workflow (c080ee8d), ultrafast-quantum-dot-response-design (545482b6), rare-earth-nickelate-superconductivity-exploration (8a3eb155), tunable-moire-quantum-oscillation-research (27a4ae42), magnetic-anisotropy-mechanism-research (ba0858ef), condensed-matter-mechanism-discriminating-probes (06177d8b), topology-guided-optical-exploration (eb2e1b7f), ion-conducting-glass-spectral-research (15da6721).
- No specific paper conclusions, numerical parameters, material recipes, or operational protocols are carried forward.
