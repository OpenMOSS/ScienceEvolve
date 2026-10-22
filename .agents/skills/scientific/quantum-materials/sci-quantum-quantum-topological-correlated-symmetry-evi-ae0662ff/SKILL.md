---
name: sci-quantum-quantum-topological-correlated-symmetry-evi-ae0662ff
description: End-to-end evidence analysis and claim audit workflow for quantum, topological, and correlated materials research, covering hypothesis generation, multi-probe validation, and iterative mechanism assessment.
scienceevolve-title: "Quantum materials and condensed matter · quantum topological correlated symmetry evidence analysis"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

This skill provides an end-to-end workflow to transform anomalous observations or standard-model failures into mechanism-driven, testable hypotheses, and to validate them through structured multi-scale evidence triangulation and control experiments. It is designed for research contexts where hidden order—topological, correlated, symmetry-breaking, or emergent—may explain deviations from expected behavior.

## When to use

Trigger this skill when:

- A system exhibits transport, spectroscopic, elastic, magnetic, or structural anomalies that defy conventional explanations.
- The research involves quantum materials, topological systems, correlated electron systems, artificial lattices, or symmetry-sensitive phase transitions.
- Standard approximations (linear response, weak coupling, ideal geometry, local equilibrium) predict behavior inconsistent with observation.
- The goal is to propose new hidden mechanisms, design discriminating validations, or audit existing claims—not to reproduce a specific paper’s results or execute laboratory procedures.

## Inputs required

Before starting, obtain or assume:

- **Target system**: Material class, dimensionality, symmetry, known phases, and relevant degrees of freedom.
- **Anomaly or gap**: The specific deviation from standard models, including the expected versus observed behavior.
- **Available probes**: Experimental or computational modalities accessible for structural, electronic, magnetic, elastic, or transport characterization.
- **Model hierarchy**: From minimal low-energy models to system-level simulations, including known approximations.
- **Control resources**: Reference systems that can serve as positive, negative, and alternative-mechanism controls.
- **Safety and compliance boundaries**: Non-operational constraints on extreme conditions, hazardous materials, or facility limits.

## Core Workflow

1. **Gap Identification & Mechanism Hypothesis Generation**
   - State the anomaly as a failure of a specific standard approximation or model.
   - Map candidate hidden mechanisms (e.g., emergent gauge fields, correlation-driven localization, symmetry-broken order, topological protection, non-linear coupling).
   - For each candidate, construct a mechanism chain: `controllable perturbation → microscopic asymmetry/order → emergent field or electronic reconstruction → observable proxy signature`.
   - Rate evidence strength: **High** (multiple independent probes agree), **Medium** (consistent but single-probe or model-dependent), **Low** (analogy-based or unconverged).
   - List key assumptions and explicit failure modes for each hypothesis.
   - **Decision Gate**: Proceed only if at least one hypothesis yields a falsifiable prediction and a viable control design exists. If not, redefine the anomaly or acquire more baseline data.

2. **Minimal Viable Validation Design**
   - Define a baseline/reference system and a minimal model that preserves the candidate mechanism.
   - Select at least two physically independent probe categories (e.g., spectroscopic + transport, elastic + magnetic, structural + electronic) to avoid single-modality artifacts.
   - Design controls:
     - **Positive control**: A system known to exhibit the target mechanism, validating the probe chain.
     - **Negative control**: A system where the mechanism is suppressed but background conditions are similar.
     - **Alternative-mechanism control**: A perturbation that distinguishes the target mechanism from competing explanations (disorder, conventional order, thermal effects, instrumental artifacts).
     - **Method control**: Cross-check via independent computational or experimental techniques.
   - Define independent variables (perturbation axis), dependent variables (proxy signatures), and confounding variables (disorder, defects, finite-size, boundary conditions, calibration drift).
   - Establish **Stop Conditions**: Anomaly is unrepeatable; only one probe detects a signal; confounding variables dominate; safety/compliance boundaries are breached; or further measurement yields only marginal discriminatory power.

3. **Execution & Multi-Scale Evidence Collection**
   - **Structural/symmetry layer**: Confirm that the intended perturbation is realized and that structural validity holds (no unintended reconstruction, phase separation, or severe disorder).
   - **Proximal mechanism layer**: Measure the microscopic variable predicted by the mechanism chain (e.g., orbital occupancy, exchange pathway, Berry curvature distribution, emergent field gradient).
   - **Macroscopic function layer**: Record the target observable (e.g., transport gap, elastic anomaly, topological boundary response, magnetic ordering temperature).
   - **Decision Gate**: If structural validity fails, halt mechanism interpretation and treat results as phenomenological. Do not proceed to causal claims.

4. **Triangulation Analysis & Model Competition**
   - Align all datasets on a common parameter axis (phase diagram, field axis, or model space).
   - Extract anomalies using trend derivatives, residuals, or phase-boundary markers; avoid visual-only judgments.
   - Evaluate each hypothesis against the full evidence table:
     - Does the positive control show the predicted signature?
     - Does the negative control lack it?
     - Does the alternative-mechanism control decouple the target effect from competing explanations?
   - Assess confounding: Check whether disorder, finite-size effects, boundary reflections, numerical convergence, or instrumental artifacts can reproduce the anomaly.
   - **Decision Gate**:
     - **Upgrade**: Multiple independent probes agree, controls are satisfied, and confounders are excluded.
     - **Downgrade**: Only one probe agrees or controls are incomplete; flag as tentative and design discriminating follow-up.
     - **Reject**: Negative control is positive, positive control fails, or a competing mechanism explains all data.

5. **Iteration & Claim Audit**
   - **If supported**: Elevate evidence strength; extend to broader parameter space; test second-order perturbations or material generalizations only after re-validating boundary conditions.
   - **If partially supported**: Design a minimal discriminating experiment that produces opposite predictions for the top two competing mechanisms.
   - **If unsupported**: Reject the hypothesis, document the failure mode, and redefine the anomaly (e.g., revisit confounding variables or standard-model assumptions).
   - **If anomalous**: Treat unexpected behavior (e.g., reversed sign, non-monotonic response) as a boundary condition or new hypothesis source; do not force-fit to the original mechanism.
   - **Stop Conditions**: Hypothesis is falsified; evidence has converged; cost/risk of further validation exceeds expected information gain; or extrapolation would violate the claim boundaries defined below.

## Output Format

Each invocation must produce:

1. **Research Question**: One sentence defining the anomaly, system boundary, and mechanism being tested.
2. **Evidence Map**: Distinguishing source-paper mechanisms, literature support, current-system data, and agent inferences, with evidence strength labels.
3. **Ranked Hypotheses**: At least three mechanism-driven hypotheses, each with mechanism chain, key assumptions, failure modes, and evidence strength.
4. **Validation Plan**: Minimal viable experiment or computation, including baseline, perturbation, probe selection, and expected discriminating signature.
5. **Control Table**: Positive, negative, alternative-mechanism, and method controls with pass/fail criteria.
6. **Analysis Plan**: Data alignment, anomaly extraction, cross-probe consistency checks, model competition, and uncertainty propagation.
7. **Iteration Rules**: Explicit next steps for supported, partially supported, unsupported, and anomalous outcomes.
8. **Validity Statement**: Summary of confounding checks, reproducibility requirements, statistical/numerical robustness, and safety/compliance boundaries.

## Validation Gates

Before accepting any mechanism claim, confirm:

- [ ] **Multi-probe consistency**: At least two independent physical probes detect correlated anomalies at compatible parameter values.
- [ ] **Control adequacy**: Positive, negative, and alternative-mechanism controls are defined and satisfy pre-registered pass/fail criteria.
- [ ] **Confounding exclusion**: Disorder, defects, instrumental artifacts, finite-size/boundary effects, and numerical convergence issues have been explicitly ruled out or quantified.
- [ ] **Reproducibility**: Results are consistent across independent samples, batches, computational settings, or data-processing pipelines.
- [ ] **Statistical/numerical robustness**: Uncertainty propagation, convergence tests, model-selection criteria, and sensitivity analyses are reported.
- [ ] **Model validity**: The minimal model explains multiple independent observables without overfitting or relying on unmeasured parameters.
- [ ] **Mechanism specificity**: The perturbation affects the target microscopic pathway, not merely correlates with the macroscopic indicator.

## Claim Boundaries

- Distinguish three tiers of knowledge: **(A)** mechanisms established by independent literature or multi-study consensus; **(B)** analogical inferences supported by similar systems but requiring re-validation; **(C)** agent-generated hypotheses for the current system that remain untested.
- Never present a single-source result as field consensus.
- Do not extrapolate mechanism claims across material families, dimensionalities, or interaction strengths without explicit boundary-condition checks.
- Computational predictions (e.g., mean-field topological invariants, rigid-band approximations) must be flagged as model-dependent and cross-validated against higher-fidelity methods or experiment where possible.

## Failure Modes

- **Null mechanism**: The hidden order is absent; the anomaly arises from artifacts, confounding, or mis-calibration.
- **Decoupled mechanism**: The microscopic mechanism exists but does not couple to the measured macroscopic observable under the studied conditions.
- **Alternative mechanism dominance**: A competing explanation (disorder, conventional order, thermal drift, non-target interaction) fully accounts for the data.
- **Irreproducibility**: The signal is sample-specific, batch-dependent, or numerically non-converged.
- **Overfitting**: The model explains the current dataset but fails on independent controls or new data.
- **Boundary violation**: The mechanism operates only in an unphysically narrow parameter window or relies on symmetry conditions not realized in the actual system.

## Validity Checks

- **Confounding factors**: Systematically list and evaluate sample inhomogeneity, chemical stoichiometry drift, defect density, boundary/edge effects, finite-size effects, pressure/strain non-uniformity, temperature drift, and instrumental resolution/background.
- **Reproducibility**: Require independent replication, documented baseline corrections, version-controlled analysis scripts, and raw data retention.
- **Statistical and numerical validity**: Pre-register analysis protocols; report effect sizes, confidence intervals, or convergence metrics; avoid selective reporting of supporting subsets.
- **Boundary conditions**: State the range of validity for symmetry assumptions, low-energy approximations, continuous-medium limits, and perturbative treatments.
- **Evidence grading**: Every claim must carry an evidence-strength label and a list of observations that would falsify it.

## Provenance

Derived from cluster `74.0` (`quantum-topological-correlated-symmetry-evidence-analysis-workflow`). Synthesizes shared workflow routes from source skills: `aref-electrokinetic-research-workflow`, `2d-magnetic-material-research-pattern`, `moderate-soc-lifshitz-mit-research`, `strain-driven-correlated-oxide-exploration`, `synthetic-gauge-acoustic-exploration`, `high-pressure-magnetoelastic-research-agent`, `non-abelian-topological-research-workflow`, and `2d-hydride-hybridization-exploration`. No specific paper conclusions, material parameters, or operational protocols are carried into the reusable workflow body.
