---
name: sci-quantum-quantum-transport-wave-phase-mechanism-disc-9edd6470
description: A reusable end-to-end workflow for discovering and validating mechanisms in quantum, transport, wave, and phase systems through observable-driven hypothesis generation, controlled validation, and iterative mechanism discrimination.
scienceevolve-title: "Quantum materials and condensed matter · quantum transport wave phase mechanism discovery workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

This skill guides an agent in converting an observable limitation, anomaly, or unexplained behavior in a wave, transport, quantum, or phase-related system into a testable mechanistic research plan. It provides a reusable route for hypothesis generation, multi-method validation, causal mechanism discrimination, and strict claim bounding.

## When to use

Use this skill when the user asks to:
- Design research around wave propagation, quantum transport, phase evolution, nonlinear response, or photonic, phononic, or plasmonic behavior.
- Explain an unexpected observable such as a spectral feature, transport anomaly, localization, or symmetry breaking.
- Compare driven versus undriven, structured versus unstructured, or transformed versus baseline configurations.
- Plan simulation, spectroscopy, imaging, or transport studies to discriminate between competing mechanisms.

Do not use this skill for operational laboratory protocols, fabrication recipes, clinical or biological applications, or as a substitute for domain-specific safety review.

## Inputs required

Before generating a plan, request or infer:
- **Target system class** and governing equations or approximations.
- **Observable gap** or desired function that current understanding cannot explain.
- **Available validation routes** such as numerical simulation, spectroscopy, imaging, transport measurement, or literature benchmark.
- **Baseline or reference state** for controlled comparison.
- **Realizability constraints** including safety, computational limits, physical plausibility, and ethical boundaries.
- **Prior evidence** and known confounders relevant to the target platform.

## Core Workflow

### Stage 1: Observable Gap Definition
Frame a concise, falsifiable research question around a specific observable limitation or anomaly. Identify why existing models or baseline configurations fail to explain or achieve the target behavior.

### Stage 2: Mechanism Hypothesis Generation
Generate at least three competing hypotheses that propose a causal chain from an internal state, interaction, or structural feature to the observable. For each hypothesis record:
- **Evidence strength** (strong / moderate / weak / speculative)
- **Key assumptions** required for the mechanism to hold
- **Predicted discriminating signatures** across different observables
- **Likely failure modes** and how they would manifest
- **Boundary conditions** where the hypothesis should not be extrapolated

**Decision Gate — Candidate Gate:**  
If the hypotheses are not separable by distinct predictions or independent controls, return to Stage 1 and refine the observable gap or decompose the system further.

### Stage 3: Study Design & Control Architecture
Design a minimal viable validation plan:
- **Independent variables:** conceptual control knobs such as coupling regime, state transition, geometric configuration, or modulation concept.
- **Dependent variables:** primary metric, trade-off metrics, and robustness indicators.
- **Controls:** baseline, positive, negative, ablation / mechanism-isolation, and robustness controls.
- **Stopping conditions:** criteria for abandoning or redesigning the plan.

**Decision Gate — Functional Validation:**  
If the minimal conceptual or computational model cannot produce a physically distinguishable signal, stop and redesign the mechanism chain before proceeding.

### Stage 4: Multi-Method Validation Execution
Execute independent validation routes (e.g., simulation, spectroscopic analysis, imaging, transport calculation). Correlate observations across scales and methods. Verify numerical convergence, uncertainty bounds, and model consistency.

### Stage 5: Mechanism Discrimination & Causal Attribution
Compare results against all controls. Determine whether the observable arises from the proposed mechanism, from an artifact, or from a confounding variable. Apply causal perturbation tests (feature present / suppressed / relocated / detuned).

**Decision Gate — Mechanism Exclusion:**  
If negative or ablation controls reproduce the effect, or if the effect tracks an unintended variable rather than the proposed feature, reject the hypothesis and return to Stage 2.

### Stage 6: Robustness & Stability Check
Systematically perturb parameters, boundary conditions, and noise sources. Verify that the effect survives within stated uncertainty and that the intended operating regime is stable and controllable, not dominated by drift, instability, or narrow resonance.

**Decision Gate — Robustness Check:**  
If the effect vanishes under plausible perturbations or is narrower than the measurement or simulation uncertainty, bound claims to the exact tested regime or reject generalizability.

### Stage 7: Claim Bounding & Iteration
Bound all claims to the validated regime. Label conclusions as analytical, model-supported, or inferred. 
- **If supported:** consider realizability filtering or platform transfer as the next minimal validation step.
- **If ambiguous:** iterate from Stage 3 with refined diagnostics or additional controls.
- **If falsified:** preserve the diagnostic insight, record the excluded mechanism class, and return to Stage 2.

**Global Stop Conditions**
- The effect is indistinguishable from baseline, noise, or numerical artifacts.
- Required assumptions are unsupported for the target platform.
- Safety, compliance, or resource constraints prevent meaningful validation.
- The mechanism depends on idealized boundary conditions or nonphysical parameters.

## Output Format

When using this skill, return results in the following structure:

1. **Research question and observable gap**
   - Concise problem statement and why existing explanations are insufficient.
2. **Ranked hypotheses**
   - For each: evidence strength, mechanism chain, key assumptions, predicted signatures, failure modes, and boundary conditions.
3. **Study design**
   - Minimal viable validation, independent variables, dependent variables, control matrix, and stopping conditions.
4. **Validation plan**
   - Multi-method execution strategy, cross-scale correlation, causal perturbation tests, and convergence checks.
5. **Analysis plan**
   - Component-wise metrics, baseline comparisons, uncertainty treatment, and mechanism attribution logic.
6. **Iteration roadmap**
   - Update rules for positive, negative, ambiguous, or trade-off-dominated outcomes.
7. **Validity and safety notes**
   - Confounders, reproducibility requirements, extrapolation boundaries, and non-operational safety constraints.

## Validation Gates

Before advancing between stages, verify:
- **Candidate Gate:** Hypotheses are falsifiable and produce distinct, testable predictions.
- **Functional Validation Gate:** The minimal model shows a physically meaningful separation from baseline.
- **Mechanism Exclusion Gate:** Controls isolate the proposed mechanism from artifacts and confounders.
- **Robustness Gate:** The effect survives parameter perturbation and cross-method triangulation.
- **Stability Gate:** The regime is controllable and not dominated by instability or unbounded noise amplification.

## Claim Boundaries

- Limit claims to the tested field, geometry, parameter regime, and validation method.
- Distinguish source-paper-supported methodological precedent from agent-generated inference or extrapolation.
- Separate analytical derivations, model-supported results, and experimentally validated conclusions.
- Do not extrapolate across dimensionality, platform class, operating regime, or material system without independent validation.
- Avoid presenting simulation or theoretical results as guaranteed experimental feasibility.

## Failure Modes

- **Boundary or source artifacts** mistaken for the proposed mechanism.
- **Hidden coupling or anisotropy leakage** that creates apparent but uncontrolled effects.
- **Off-resonant excitation or model mismatch** producing misleading response shapes.
- **Calibration drift, technical noise, or detector saturation** masquerading as signal enhancement.
- **Cross-talk between channels** or unmodeled modes creating spurious correlations.
- **Simulation-experiment mismatch** due to omitted physics, truncation, or convergence issues.
- **Overinterpretation** of narrowband, steady-state, or idealized results as general behavior.

## Validity Checks

Before presenting conclusions, check:
- **Causality:** Can the proposed feature be suppressed, removed, relocated, or detuned while preserving other conditions?
- **Specificity:** Does the downstream response track the proposed feature rather than unrelated control changes?
- **Control completeness:** Are baseline, positive, negative, and mechanism-isolation controls all present and matched?
- **Reproducibility:** Are baseline variability, repeated-trial criteria, and convergence thresholds defined?
- **Diagnostic independence:** Do direct and functional diagnostics rely on independent observables?
- **Model boundaries:** Are governing-equation approximations, dimensionality assumptions, and validity limits stated?
- **Uncertainty propagation:** Are numerical, statistical, and systematic uncertainties accounted for in the final metrics?
- **Baseline fairness:** Are comparisons performed under identical resource, boundary, and readout conditions?

## Provenance

- Synthesized from cluster **134.0** (observable-driven mechanism discovery and validation).
- Derived from source skills: `transformation-metamaterial-research-workflow`, `plasmonic-floquet-research-workflow`, `active-wave-spectral-programming`, `nonlinear-quantum-sensing-workflow`, `accelerator-beam-shaping-research`, `pcm-thermal-switching-research-workflow`, `bohmian-wave-inverse-design`, `pt-symmetric-resonator-metrology-workflow`.
