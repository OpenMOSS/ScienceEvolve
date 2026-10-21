---
name: sci-fusion-stellarator-transport-mechanism-discovery-wo-e4a05603
description: A reusable end-to-end workflow for turning plasma confinement or transport anomalies into testable mechanism hypotheses, validation studies, and bounded claims through structured hypothesis generation, controlled design, multi-channel analysis, and iterative discrimination in magnetic-confinement systems.
scienceevolve-title: "Magnetic confinement fusion · stellarator transport mechanism discovery workflow"
scienceevolve-area: magnetic-confinement-fusion
---

# Purpose

Turn an observed plasma confinement or transport anomaly into a structured, testable mechanism-discovery program. This workflow guides hypothesis generation, controlled validation design, multi-channel analysis, and iterative claim bounding without prescribing device-specific operations or reproducing single-study conclusions.

# When to use

Use this skill when a user asks to:
- Design research questions or validation studies for plasma transport, confinement, or profile anomalies in magnetic-confinement systems.
- Discriminate among candidate mechanisms for benchmark deviations, localized improvements, or regime transitions.
- Separate target transport channels from coupled particle, momentum, radiation, edge, or boundary effects.
- Plan staged simulation or experimental comparisons with controls, metrics, and stop conditions.
- Iterate hypotheses after partial, negative, or ambiguous results.

Do not use this skill for operational plasma control, executable experimental procedures, facility operations, or general literature review.

# Inputs required

Before producing a plan, identify or request:
- Target system class and magnetic configuration family.
- Observable anomaly and baseline expectation (empirical scaling, reference model, or prior benchmark).
- Available diagnostics, simulations, or synthetic-data sources and their uncertainty limits.
- Candidate control variables, regime indicators, and coupled channels that may confound the target signal.
- Safety, authorization, and compliance boundaries relevant to the plasma environment.
- Intended claim boundary: profile characterization, mechanism hypothesis, scaling refinement, or regime map.

If essential inputs are missing, state assumptions explicitly and produce a minimal plan with the most important gaps flagged.

# Core Workflow

1. **Anomaly Framing & Observable Definition**
   - Reframe the mismatch as a structural question: does the anomaly reflect shape change, amplitude change, channel shift, regime transition, or measurement artifact?
   - Define the target observable, baseline expectation, and regime boundary explicitly.
   - Separate raw observations from inferred quantities before proceeding.

2. **Mechanism Hypothesis Generation**
   - Generate at least three competing hypotheses linking control variables to mediators and to the target observable.
   - For each hypothesis document: evidence strength, key assumptions, observable signature, discriminating secondary signatures, likely failure modes, and extrapolation boundary.
   - **Decision Gate 1 (Hypothesis Viability):** If no hypothesis is falsifiable with available observables, stop and request additional diagnostics or reformulate the question.

3. **Study Design & Control Architecture**
   - Define one primary question per study. Choose one dominant control dimension per scan; combine variables only after single-factor interpretation.
   - Specify controls: baseline, strong control, negative control, positive/benchmark control, channel control, and diagnostic cross-check.
   - Define primary and secondary metrics, robustness metrics, and pre-registered stop conditions.
   - Keep the design at the research-logic level; do not specify executable operational parameters.

4. **Data Acquisition or Simulation Execution**
   - Execute the planned observations or simulations within authorized boundaries.
   - Record calibration status, time alignment, case metadata, and any deviations from the design.

5. **Quality Control & Normalization**
   - Screen for calibration drift, missing coverage, synchronization errors, and transient contamination.
   - Normalize observables in a scientifically justified manner; report sensitivity to normalization choices.
   - Define quasi-stationary analysis windows before comparing cases.

6. **Multi-Layer Analysis & Residual Diagnostics**
   - Construct reference structures (e.g., normalized profiles, scaling collapses) under nominal conditions.
   - Fit amplitude or scaling factors sequentially; add dependencies only when residuals show structured relationships.
   - Stratify residuals by region, regime indicator, driver variable, geometry, and measurement condition.
   - Distinguish shape failure, amplitude failure, boundary failure, regime failure, measurement failure, and confounding failure.

7. **Mechanism Discrimination & Evidence Grading**
   - Compare each hypothesis prediction against independent observables, not only the fitted target.
   - Grade evidence incrementally: observed association → reproducible control response → channel-separated signature → mechanism-model prediction → independent mediator confirmation → robustness across geometry/species/boundary variations.
   - **Decision Gate 2 (Evidence Sufficiency):** 
     - If one hypothesis survives independent checks and cross-controls, proceed to Claim Bounding.
     - If evidence is insufficient for all hypotheses, proceed to Iteration/Redesign.
     - If all hypotheses are contradicted by controls, stop and reformulate the anomaly framing.

8. **Iteration or Redesign**
   - Based on the dominant failure mode (measurement artifact, confounding, missing channel, regime mismatch, model inadequacy), update hypotheses, add controls, or narrow the claim boundary.
   - Return to Step 2 or Step 3 with revised assumptions.
   - **Stop Condition:** Halt if diagnostic uncertainty dominates the effect, if controls cannot separate correlated variables, or if the claim would require extrapolation beyond validated assumptions.

9. **Claim Bounding & Documentation**
   - State what the data directly support, what is mechanistically inferred, and what remains untested.
   - Document negative evidence, failed regimes, and model limitations as diagnostic information.
   - Define the validity domain: device class, geometry family, density/collisionality regime, heating channel, and diagnostic coverage.
   - **Decision Gate 3 (Exit):** Finalize outputs if claims are bounded and stop conditions are met; otherwise return to Step 8.

# Output Format

Produce results in the following structure:

1. **Research question** — Target observable, system, baseline expectation, and intended claim boundary.
2. **Evidence map** — Distinguish directly observed, inferred from partial support, speculative, and unsupported items.
3. **Hypothesis table** — For each hypothesis: mechanism chain, evidence strength, key assumptions, discriminating observable, likely failure mode, and stop condition.
4. **Study design** — Variables, controls, minimal viable validation, metrics, and stop conditions.
5. **Analysis plan** — Quality control, normalization, reference-structure construction, residual stratification, baseline comparison, and uncertainty handling.
6. **Iteration plan** — How supportive, partial, negative, or ambiguous outcomes update or abandon each hypothesis.
7. **Validity and safety statement** — Confounders, reproducibility checks, extrapolation limits, and non-operational safety boundaries.

# Validation Gates

Advance through the workflow only after passing these gates:
- **Input completeness:** Essential system class, observables, and benchmarks are defined.
- **Hypothesis falsifiability:** Each candidate mechanism can be weakened or strengthened by at least one accessible observable.
- **Control adequacy:** The design includes negative, positive, and channel controls sufficient to isolate the target mechanism from confounders.
- **Data quality:** Calibration, alignment, and coverage are sufficient for the intended profile or transport reconstruction.
- **Confounding isolation:** Correlated variables are either controlled or explicitly bounded in the interpretation.
- **Cross-diagnostic agreement:** Independent measurements of related quantities are compared before mechanism claims.
- **Model sensitivity:** Conclusions survive reasonable changes in assumptions, normalization, and reconstruction choices.
- **Extrapolation safety:** Claims are explicitly bounded by regime, geometry, and device class.

# Claim Boundaries

- **Observed:** Directly measured trends or controlled associations.
- **Inferred:** Mechanism claims supported by multiple independent observables within the tested regime.
- **Speculative:** Extrapolations beyond the validated domain or unsupported by independent checks.
- Clearly separate direct observations, derived quantities, model comparisons, mechanism inferences, and extrapolations.
- State the regime boundary where the claim should be treated as untested.

# Failure Modes

- **Measurement or reconstruction artifact:** Apparent anomaly caused by calibration, coverage, or inversion uncertainty.
- **Confounded variables:** A correlated driver (geometry, heating mix, impurity, boundary condition) explains the signature.
- **Missing transport channel:** The target channel improvement is actually driven by radiation, particle, momentum, edge, or boundary effects.
- **Regime mismatch:** The system operates in a transport regime different from the benchmark or model assumptions.
- **Model sensitivity:** The conclusion depends on a specific normalization, coordinate choice, or untested assumption.
- **Non-reproducible signature:** The anomaly appears in only one case or diagnostic realization.
- **Control failure:** Negative or channel controls produce the same response as the test case.
- **Extrapolation beyond validity:** Claims are extended to device classes, geometries, or regimes not covered by the study.

# Validity Checks

Before finalizing any plan or claim, verify:
- **Confounding:** Are proposed drivers correlated with geometry, losses, background, fueling, deposition, calibration, or reconstruction assumptions?
- **Normalization sensitivity:** Does the conclusion depend strongly on a particular normalization or coordinate choice?
- **Reproducibility:** Is the signature observed across multiple independent cases, repeated scans, or synthetic-data checks?
- **Statistical validity:** Are uncertainty estimates, held-out tests, and sensitivity analyses sufficient for the claim strength?
- **Boundary conditions:** Is the model or claim presented only within the regime where it was tested?
- **Mechanism discipline:** Are mechanism claims supported by independent observables rather than by fitted residuals alone?
- **Negative evidence:** Are failed regimes, contradictory diagnostics, and null results reported as information rather than hidden?
- **Baseline comparison:** Does the new interpretation add value beyond the existing benchmark or scaling law?
- **Claim separation:** Are observations, derivations, model outputs, inferences, and extrapolations clearly labeled?

# Provenance

Synthesized from cluster 13.0 (observable-driven mechanism discovery and validation). Source-skill references: `plasma-profile-reference-model-workflow`, `stellarator-fast-ion-validation`, `fusion-edge-shear-flow-threshold-research`, `stellarator-confinement-research-workflow`, `finite-beta-helias-confinement-research`, `magnetic-configuration-transport-skill`, `sustainable-energy-architecture-feasibility`, `stellarator-transport-channel-exploration`. No paper-specific conclusions, numerical results, or operational protocols are included.
