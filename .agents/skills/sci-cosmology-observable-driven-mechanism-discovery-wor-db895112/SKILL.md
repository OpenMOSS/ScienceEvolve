---
name: sci-cosmology-observable-driven-mechanism-discovery-wor-db895112
description: A reusable end-to-end workflow for designing, validating, and bounding claims about astrophysical mechanisms across galaxies, halos, and cosmological observables through controlled model comparison and multi-scale diagnostics.
scienceevolve-title: "Galaxy, cosmology, and simulations · observable driven mechanism discovery workflow 10"
scienceevolve-area: galaxy-cosmology-and-simulations
---

# Purpose

This skill guides an agent in transforming an observational anomaly or theoretical tension into a testable research program. It provides a structured route to generate competing mechanism hypotheses, design controlled validation studies using simulations or mock data, discriminate among explanations through multi-scale diagnostics, and bound claims conservatively.

# When to use

Use this skill when the user asks to:

- Investigate a discrepancy between observations and a baseline model in galaxy formation, halo structure, cosmological clustering, lensing, or feedback physics.
- Design a simulation, emulator, or mock-data study to test whether a proposed mechanism resolves an anomaly.
- Compare alternative models or subgrid prescriptions while separating physical effects from numerical artifacts, selection biases, or nuisance parameter degeneracies.
- Plan an iterative analysis that moves from viability checks to stronger validation without overclaiming.

Do not use this skill as a general-purpose astronomy tutorial, observational data reduction pipeline, or source of field consensus.

# Inputs required

Before generating a research plan, obtain or infer:

- **Target system class and observable anomaly:** the population, scale range, and measurable discrepancy under study.
- **Baseline model:** the reference theory or simulation framework being challenged.
- **Alternative mechanism(s):** candidate physical, numerical, or observational explanations.
- **Available data and simulation resources:** mock catalogs, simulation suites, emulator coverage, observational datasets, and known limitations.
- **Evaluation observables:** summary statistics, profiles, scaling relations, or phase diagnostics sensitive to the mechanism.
- **Resource and fidelity constraints:** resolution limits, sample size, computational budget, and selection effects.

# Core Workflow

1. **Anomaly Definition & Baseline Calibration**
   - Quantify the discrepancy in observable terms (e.g., profile shape, clustering residual, mass distribution offset).
   - Establish the baseline model's predictions for the target regime.
   - *Decision gate:* If the anomaly cannot be expressed as a measurable deviation, stop and refine the question.

2. **Hypothesis Generation & Mechanism Mapping**
   - Generate at least three competing hypotheses: the target mechanism, a confounding astrophysical or numerical alternative, and a null or artifact explanation.
   - For each hypothesis, define predicted signatures across global, mesoscale, and local diagnostics; assign evidence strength; list key assumptions; and state falsification criteria.
   - *Decision gate:* If hypotheses are not mutually distinguishable with available observables, redesign the diagnostic set before proceeding.

3. **Controlled Study Design**
   - Define a comparison matrix: baseline model, alternative model(s), and isolation variants that change one assumption at a time.
   - Specify controls: strong control (matched initial conditions and analysis pipeline), negative control (mechanism absent or ineffective), positive control (mechanism known to operate), environmental or geometry controls, and fidelity or resolution controls.
   - Identify independent variables (model choice, interaction regime, environment, resolution), dependent variables (profile metrics, clustering amplitudes, mass components, residuals), and nuisance variables (selection, geometry, calibration, covariance).
   - Pre-register evaluation metrics and stopping criteria.
   - *Stop condition:* Stop if no control can isolate the proposed mechanism, if emulator or simulation coverage is insufficient, or if the target signal is smaller than combined statistical and systematic uncertainty.

4. **Mock Validation & Recovery Testing**
   - Generate or select mock systems with known truth and process them through the intended observation and analysis pipeline.
   - Fit baseline and mechanism-aware models; compare recovered parameters to known truth.
   - Verify residual structure, credible-interval coverage, and pipeline integrity.
   - *Decision gate:* If mock recovery fails under stated assumptions, or if the effect disappears under resolution checks, halt physical interpretation and diagnose numerical or pipeline issues.

5. **Multi-Scale Diagnostic Analysis**
   - Inspect global budgets, scaling relations, and morphology.
   - Examine mesoscale profiles, environmental trends, and conditional statistics.
   - Probe local phase structure, object-level catalogs, and direct-versus-proxy quantities.
   - Compare simulated outputs against independent observational anchors.
   - *Iteration trigger:* If global agreement is good but local structure is wrong, add fidelity controls and local diagnostics. If local structure is good but global behavior is wrong, check environmental coupling, boundary conditions, or missing large-scale flows.

6. **Model Comparison & Mechanism Discrimination**
   - Compare nested models using fit quality, complexity penalties, posterior shifts, and model-evidence criteria.
   - Test whether added parameters are identifiable and physically interpretable, rather than merely absorbing baseline-model uncertainty.
   - Inspect whether residuals correlate with proposed state variables or nuisance parameters.
   - *Decision gate:* If alternative models or nuisance parameters mimic the target signal, redesign to break the degeneracy before claiming mechanism detection.

7. **Claim Bounding & Iteration Planning**
   - Classify conclusions as directly demonstrated, consistent with prior work, inferred for new systems, or speculative.
   - Update the hypothesis table with revised evidence strength, failure modes, and boundary conditions.
   - Define the next minimal experiment, propose stronger controls, or declare the mechanism unsupported.
   - *Stop condition:* Stop if the model only fits after excluding plausible alternatives without justification, if parameters are prior-dominated, if real systems require ad hoc adjustments, or if the effect depends on unresolved numerical settings without a convergence trend.

# Output Format

When using this skill, produce:

1. **Research question** — Stated anomaly, target system, and baseline model.
2. **Ranked hypotheses** — Table with mechanism, predicted multi-scale signature, evidence strength, key assumptions, and failure modes.
3. **Study design** — Comparison matrix, controls, variables, metrics, and stopping conditions.
4. **Validation plan** — Mock recovery tests, resolution and fidelity checks, and observational comparison strategy.
5. **Analysis plan** — Multi-scale diagnostics, model comparison criteria, residual inspection, and degeneracy checks.
6. **Iteration roadmap** — Decision rules for expanding, revising, or terminating the research program.
7. **Validity and scope statement** — Confounds, reproducibility requirements, boundary conditions, and claim limits.

# Validation Gates

- **Anomaly measurability:** The discrepancy is expressed in terms of specific observables or simulated quantities.
- **Hypothesis discriminability:** Competing hypotheses predict distinguishable signatures in at least one diagnostic.
- **Control integrity:** Positive, negative, strong, and alternative controls are defined and behave as expected.
- **Mock recovery:** Known truths are recovered under valid assumptions before interpreting real data.
- **Convergence and fidelity stability:** Conclusions are stable across resolution tiers or within validated emulator interpolation regions.
- **Model identifiability:** Added parameters are constrained by data rather than driven by priors or covariance artifacts.
- **Observational anchoring:** Independent datasets or diagnostics corroborate the trend.

# Claim Boundaries

- Treat single-study or small-sample success as evidence for mechanism viability, not proof or field-wide consensus.
- Distinguish "the model recovers mock truth" from "the physical effect is detected."
- Distinguish "the proxy parameter deviates from its null expectation" from "a specific fundamental theory is favored."
- Limit claims to the tested mass range, redshift, environment, tracer population, and observable set.
- Mark agent-generated extrapolations as speculative.

# Failure Modes

- **Overfitting to one diagnostic:** The mechanism appears in only one statistic but fails in complementary checks.
- **Prior-dominated inference:** Weakly constrained parameters shift with prior choices, producing illusory agreement.
- **Calibration leakage:** The model is validated only against relations used to tune its parameters.
- **Proxy misinterpretation:** Direct simulated quantities and inferred observables are conflated.
- **Resolution artifact:** The effect emerges at one fidelity level without a convergence trend.
- **Degeneracy collapse:** Multiple mechanisms produce identical signatures given current data, preventing discrimination.
- **Selection bias:** Target systems are chosen to favor the alternative model, yielding non-representative conclusions.

# Validity Checks

- **Confounding separation:** Can baryonic physics, environment, selection, measurement bias, or model misspecification explain the result?
- **Numerical robustness:** Are results stable across resolution, halo finders, emulator boundaries, and mock realizations?
- **Sample representativeness:** Do selected systems span easy, ambiguous, and high-risk cases?
- **Baseline fairness:** Is the reference model well-calibrated and not arbitrarily disadvantaged?
- **External consistency:** Are larger-scale cosmological, abundance, lensing, or dynamical constraints respected?
- **Reproducibility:** Are data versions, model definitions, analysis choices, priors, and random seeds documented?

# Provenance

- Synthesized from cluster 7.0 (galaxy-cosmology-lensing-halo-mechanism-discovery) source skills: sidm-dwarf-halo-exploration, cosmology-clustering-emulator-research, dwarf-rotation-inference-workflow, dark-matter-halo-scaling-research, halo-occupation-research-workflow, kinetic-feedback-galaxy-exploration, disc-galaxy-mass-distribution-explorer, multiscale-emergent-phase-research.
- Derived from peer-reviewed astrophysical literature; no operational protocols, fabrication parameters, or hazardous procedures are included.
