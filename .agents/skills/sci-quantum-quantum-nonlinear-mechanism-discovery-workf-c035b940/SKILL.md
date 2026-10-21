---
name: sci-quantum-quantum-nonlinear-mechanism-discovery-workf-c035b940
description: A reusable end-to-end workflow for symmetry-guided mechanism discovery and validation in quantum, nonlinear, and coherent-state systems.
scienceevolve-title: "Quantum materials and condensed matter · quantum nonlinear mechanism discovery workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Guide an agent to design research questions, generate falsifiable hypotheses, and validate microscopic or emergent mechanisms in quantum, nonlinear, and coherent-state systems. The workflow teaches a general pattern: frame an anomaly, decompose observables against a calibrated baseline, generate competing hypotheses using symmetry and coupling constraints, discriminate mechanisms through controlled experiments and cross-probe analysis, and iterate until claims are bounded by evidence.

## When to use

Use this skill when the user asks to:

- Propose new research directions or experiments in systems with hidden order, coupled resonant modes, hybrid light-matter states, phase transitions under tuning, or backaction-limited control.
- Design studies that distinguish competing mechanisms rather than confirm a pre-selected model.
- Analyze anomalies across multiple probes, spectral channels, or measurement modalities.
- Iterate from partial results toward refined hypotheses and new research questions.

Do not use this skill for clinical research, biological wet-lab protocols, high-risk operational instructions, pure literature summarization, or tasks that require only domain tutoring without research design.

## Inputs required

Before producing a plan, request or identify:

- **Target system class** and relevant length, time, or energy scales.
- **Known or suspected ordered phase, hidden variable, coupled mode, or interaction pathway.**
- **Candidate observables** (local probes, spectral channels, transport, scattering, or imaging readouts).
- **Independent validation proxies** that can cross-check the proposed mechanism.
- **Control variables** (temperature, field, pressure, strain, detuning, composition, or orientation).
- **Background models** and known confounders (disorder, calibration drift, boundary effects, measurement back-action).
- **Safety, ethics, and compliance boundaries** for the intended study.

If inputs are incomplete, state assumptions explicitly and design the minimal plan needed to resolve the highest-uncertainty input.

## Core Workflow

1. **Frame the anomaly and define the mechanistic gap**
   - Identify a reproducible mismatch between baseline expectation and observation.
   - Define the hidden variable, coupled mode, or missing interaction to be tested.
   - *Decision gate*: Is the anomaly reproducible across repeated measurements or samples? If no, stop and refine metrology.

2. **Decompose observables and calibrate the baseline**
   - Separate known background contributions from candidate signal terms.
   - Establish baseline behavior in a reference regime where the proposed mechanism is absent or theoretically constrained.
   - *Decision gate*: Does an improved background model explain the anomaly? If yes, stop the hidden-mechanism interpretation.

3. **Generate competing, falsifiable hypotheses**
   - Formulate at least two mechanisms (including null/artifact hypotheses) using symmetry, coupling, or response-asymmetry reasoning.
   - Predict distinct signatures across control variables for each hypothesis.
   - Assign evidence strength (weak / moderate / strong) and explicit falsifiers.
   - *Decision gate*: Are hypotheses mutually exclusive and testable with available proxies? If no, refine or request additional inputs.

4. **Design a minimal viable experiment with a control hierarchy**
   - Select independent variables that discriminate mechanisms.
   - Define positive, negative, symmetry, orthogonality, and instrumental controls.
   - Pre-register stop conditions (e.g., residual disappears after correction, controls converge, instability dominates).
   - *Decision gate*: Can the design falsify at least one competing mechanism? If no, redesign before execution.

5. **Execute cross-probe model-discrimination analysis**
   - Extract features with documented uncertainty and pre-registered analysis choices.
   - Compare baseline and modified models; test scaling relations and regime changes.
   - Require consistency across independent measurement channels or proxies.
   - *Decision gate*: Do multiple observables converge on the same mechanism within uncertainty? If no, flag discrepancy and return to Step 2 or 3.

6. **Iterate based on evidence strength**
   - **If supported**: refine regime boundaries, improve nuisance bounds, and require an independent prediction before expanding claims.
   - **If ambiguous**: design the smallest targeted test to isolate the dominant confounder.
   - **If contradicted**: preserve the failed pathway as a boundary condition and reformulate the causal model.
   - *Decision gate*: Has the leading hypothesis survived strong controls and independent validation? If yes, proceed to claim bounding. If no, return to Step 3 or 4.

7. **Bound claims and archive boundary conditions**
   - Label each claim as observed, inferred, or extrapolated.
   - Document boundary conditions, failure modes, and unresolved uncertainties.
   - Propose the next research cycle only after identifying the highest-priority uncertainty.
   - *Stop condition*: End the current cycle when claims are bounded and the iteration plan is documented.

## Output Format

Return a structured research plan containing:

1. **Research question** — One concise question framed around a hidden mechanism or coupling pathway.
2. **Gap and mechanism map** — The domain gap, causal chain, and competing explanations.
3. **Ranked hypotheses table** — For each hypothesis: evidence strength, key assumptions, predicted signatures, falsifiers, and likely failure modes.
4. **Experimental design** — Independent variables, observables, minimal viable validation, control hierarchy, and stop conditions.
5. **Analysis plan** — Feature extraction, model comparison, cross-channel consistency checks, and uncertainty treatment.
6. **Iteration plan** — How supported, ambiguous, or contradicted results update the hypotheses.
7. **Validity and ethics check** — Confounders, reproducibility requirements, safety boundaries, and non-operational constraints.
8. **Evidence boundary statement** — Clear separation of observed, inferred, and speculative claims.

## Validation Gates

- **Reproducibility gate**: The anomaly persists across independent samples, repeated measurements, or alternative preparations.
- **Control gate**: Positive and negative controls behave as predicted; the negative control does not reproduce the target signature.
- **Symmetry gate**: Anisotropy, orientation dependence, or spectral parity matches the proposed mechanism rather than geometric artifacts.
- **Cross-probe gate**: Independent proxies or measurement channels agree on the mechanism within stated uncertainty.
- **Statistical gate**: Fits are stable, uncertainties are propagated, and model comparisons penalize overfitting.
- **Stability gate**: Claims derive from stable, interpretable regimes, not from points near instability or uncalibrated boundaries.

## Claim Boundaries

- **Observed**: Directly supported by current data and controls.
- **Inferred**: Consistent with model comparison but not directly isolated.
- **Extrapolated**: Proposed for related systems or untested regimes; requires new validation.
- Limit claims to tested symmetry classes, probe stabilities, and proxy availability.
- Do not present analogy from related systems as direct evidence.
- Avoid treating single-study findings as field-wide consensus.

## Failure Modes

- Baseline model explains the anomaly after improved background correction.
- Effect vanishes under small input perturbations or alternative analysis choices.
- Positive and negative controls behave similarly.
- Anisotropy follows sample geometry or instrument response rather than proposed symmetry.
- Independent probes give incompatible behavior without resolution.
- Artifact or null models explain the data equally well.
- Measurement-induced disturbance or back-action dominates the signal.
- Calibration drift, nuisance variables, or unmodeled disorder mimic the proposed mechanism.
- Apparent mechanism only appears in an unstable or uninterpretable regime.

## Validity Checks

Before finalizing recommendations, verify:

- **Confounding**: Could structural distortion, disorder, defects, calibration drift, unmodeled terms, or environmental coupling explain the signal?
- **Reproducibility**: Would the conclusion survive independent samples, alternative analysis choices, or different facilities?
- **Statistical validity**: Are fit ranges, parameter correlations, uncertainty estimates, and model comparisons reported?
- **Boundary conditions**: Does the recommendation avoid extrapolating beyond comparable symmetry, probe stability, and proxy availability?
- **Evidence separation**: Are established methodological patterns separated from new agent-inferred hypotheses?
- **Falsifiability**: Does each hypothesis specify observations that would refute it?
- **Control adequacy**: Are positive, negative, symmetry, orthogonality, and instrumental controls explicit?
- **Scope control**: Does the plan address one research-class task rather than claiming a complete solution to the field?

## Provenance

- Synthesized from cluster **196.0** (symmetry-guided mechanism discovery and validation).
- Derived from source skills: `condensed-matter-hidden-order-local-probe-design`, `pressure-tuned-honeycomb-oxide-exploration`, `coupled-resonator-subwavelength-wave-control`, `nickelate-phase-diagram-exploration`, `plasmon-exciton-spectral-workflow`, `landscape-controlled-nonlinear-wave-exploration`, `esr-stm-research-pattern`, `asymmetric-backaction-cooling-research`.
- Preserves the shared workflow route: anomaly framing → baseline decomposition → symmetry-guided hypothesis generation → controlled experiment design → cross-probe model discrimination → iterative evidence updating → claim bounding.
