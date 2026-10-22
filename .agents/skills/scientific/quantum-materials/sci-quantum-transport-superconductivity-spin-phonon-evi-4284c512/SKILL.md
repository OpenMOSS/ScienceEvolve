---
name: sci-quantum-transport-superconductivity-spin-phonon-evi-4284c512
description: Observable-driven evidence analysis and claim audit workflow for transport, superconductivity, spin, phonon, and related quantum materials research.
scienceevolve-title: "Quantum materials and condensed matter · transport superconductivity spin phonon evidence analysis"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Transform anomalous observables in transport, superconductivity, spin, phonon, or related quantum systems into structured, auditable research questions, ranked candidate mechanisms, and iterative validation plans. This skill provides a domain-agnostic route for claim bounding and mechanism discrimination without prescribing operational laboratory protocols or material-specific parameters.

# When to use

- An observed response deviates from the baseline model in transport, magnetic, thermal, spectroscopic, or structural data.
- A symmetry-dependent, scale-dependent, or cross-modal anomaly requires distinguishing conventional background mechanisms from candidate novel mechanisms.
- You need to design a non-operational validation logic that integrates multiple evidence streams (e.g., transport, spectroscopy, simulation) into a falsifiable study plan.
- You must audit the strength of a mechanistic claim before treating it as a basis for further extrapolation.

# Inputs required

- **Target system class**: dimensionality, known symmetries, conserved quantities, and applicable regime boundaries.
- **Anomaly definition**: the observed response, the baseline prediction, and the deviation scale (temporal, spatial, parametric).
- **Evidence streams**: available transport, spectroscopic, structural, or computational datasets and their uncertainties.
- **Baseline model**: the standard theoretical framework, its key assumptions, and known failure modes.
- **Constraints**: ethical, safety, and operational boundaries; available control variables and forbidden procedures.

# Core Workflow

An ordered end-to-end route with decision gates and iteration/stop conditions.

1. **Anomaly Definition & Baseline Audit**
   - State the observed fact, the baseline expectation, and the quantitative deviation.
   - Identify the control parameter space where the anomaly appears and disappears.
   - **Decision Gate G1**: Is the anomaly reproducible across samples, runs, or preprocessing pipelines, and does it exceed combined baseline uncertainty?
     - *If No*: Halt mechanism work; diagnose systematics, calibration, or contact/boundary artifacts.

2. **Hypothesis Generation & Mechanism Pooling**
   - Generate at least three candidate explanations:
     - (a) a conventional background mechanism;
     - (b) a competing alternative mechanism;
     - (c) the candidate mechanism of interest.
   - For each candidate, specify: core prediction, required symmetry/boundary conditions, key assumptions, and explicit failure modes.
   - Assign an initial evidence strength (strong / medium / weak / speculative) based on prior support from analogous systems.
   - **Decision Gate G2**: Are the candidates mutually distinguishable with available or attainable observables?
     - *If No*: Refine the observable definitions or seek additional discriminating diagnostics before proceeding.

3. **Minimal Viable Validation Design**
   - Select one primary discriminating observable per candidate mechanism.
   - Define a non-operational experimental or computational protocol with:
     - **Baseline control**: unperturbed reference matching the anomaly-free regime.
     - **Positive control**: a known case that validates the measurement chain.
     - **Negative control**: a regime where the candidate signal should vanish or invert.
     - **Alternative-mechanism control**: a condition that isolates competing explanations.
   - Specify stop conditions: signal irreproducibility, threshold failure, or conventional explanation sufficiency.
   - **Decision Gate G3**: Does the validation design falsify at least one candidate without confounding variables?
     - *If No*: Redesign controls or reduce mechanism scope.

4. **Cross-Modal Evidence Collection & Preprocessing**
   - Normalize data across modalities using consistent units, symmetries, and uncertainty propagation.
   - Register spatial, temporal, and parametric coordinates across datasets.
   - Separate constraint data (used for model setup) from validation data (used for testing).

5. **Mechanism Decomposition & Scale Analysis**
   - Decompose the total response into candidate mechanism components (e.g., intrinsic vs. extrinsic, local vs. non-local, symmetry-allowed vs. forbidden).
   - Evaluate scale relations, critical exponents, or spectral signatures that differentiate candidates.
   - Check cross-modal consistency: do transport, spectroscopic, and structural evidence converge or conflict?
   - **Decision Gate G4**: Does the evidence favor one candidate over all alternatives, or do multiple candidates remain compatible?
     - *If ambiguous*: Flag for stronger orthogonal controls and pause claim strengthening.

6. **Claim Bounding & Evidence Grading**
   - Grade each candidate:
     - **Strong**: multiple independent observations agree; boundary behavior is predicted correctly; causal chain is self-consistent; no conflicting calibration.
     - **Medium**: primary direction and scale match; boundary behavior is qualitatively correct; minor quantitative deviations remain.
     - **Weak**: supported by a single diagnostic or limited parameter range.
     - **Negative**: key control fails; boundary behavior contradicts prediction; causal chain violates conservation or known benchmarks.
   - **Decision Gate G5**: Does any candidate achieve at least Medium grade without control failures?
     - *If No*: Return to Step 2 to revise the mechanism pool or stop the line of inquiry.

7. **Iteration, Boundary Testing, or Redesign**
   - **If a candidate passes G5**: Design boundary-system tests (regimes where the mechanism should weaken, vanish, or invert) and orthogonal probes to challenge the claim.
   - **If a candidate fails G5**: Update the hypothesis table with new failure modes; consider unexplored confounders; decide whether to pivot or stop.
   - **Stop conditions** (triggered at any step):
     - The anomaly is explained by a conventional mechanism with fewer assumptions.
     - The signal is irreproducible across independent samples or analysis pipelines.
     - The required model parameters become untestable or unbounded.
     - Continuation would violate safety, ethical, or compliance boundaries.
     - The candidate mechanism cannot be distinguished from a measurement artifact.

# Output Format

Each invocation produces:

1. **Research question**: one-sentence, falsifiable statement.
2. **Anomaly definition**: observed fact, baseline expectation, deviation, and parameter regime.
3. **Candidate hypothesis table**: mechanisms, core predictions, key assumptions, initial evidence strength, and failure modes.
4. **Validation plan**: minimal viable validation, control design, discriminating observables, and stop conditions.
5. **Analysis plan**: preprocessing, mechanism decomposition, scale/symmetry analysis, and cross-modal consistency checks.
6. **Evidence grade**: current strength and boundary conditions for each candidate.
7. **Iteration roadmap**: next-step boundary tests, pivot conditions, or termination rationale.
8. **Claim boundary statement**: separation of direct evidence, model inference, analogy, and unverified extrapolation.

# Validation Gates

- **Reproducibility Gate**: Anomaly must persist across independent samples, runs, or preprocessing choices.
- **Discrimination Gate**: Validation design must be capable of falsifying at least one candidate mechanism.
- **Confounding Gate**: All known conventional explanations and measurement artifacts must be explicitly tested before advancing novel claims.
- **Consistency Gate**: Cross-modal evidence must not conflict beyond stated uncertainties.
- **Boundary Gate**: Mechanism predictions must correctly describe regimes where the anomaly weakens or disappears.
- **Causal Coherence Gate**: Gradient, flux, source/sink, and conservation budgets must form a self-consistent chain.

# Claim Boundaries

- **Direct evidence**: statements supported by raw observables and statistical tests.
- **Model inference**: conclusions that depend on a specific theoretical framework or parameter set; must be tagged with model assumptions.
- **Analogical extrapolation**: claims transferred from other material systems or regimes; must be tagged as unverified in the target system.
- **Unverified projection**: any statement about untested parameter ranges, sample types, or device scales; must be explicitly quarantined from core conclusions.

# Failure Modes

- **Systematic artifact dominance**: contact effects, calibration drift, geometry mixing, or thermal offsets mimic the target anomaly.
- **Conventional sufficiency**: a background mechanism explains the data with fewer or better-constrained assumptions.
- **Parameter degeneracy**: multiple candidate mechanisms produce indistinguishable observables within uncertainty.
- **Overfitting**: model complexity increases without improved out-of-sample prediction or physical justification.
- **Scope violation**: applying the workflow to regimes where required symmetries, dimensionality, or interaction strengths do not hold.
- **Ethical/safety boundary breach**: proposed validation requires operational protocols or hazardous conditions beyond permitted scope.

# Validity Checks

- **Confounding review**: Have thickness, disorder, strain, contact geometry, thermal effects, multi-band contributions, and selection bias been addressed?
- **Reproducibility review**: Are samples, runs, analysis scripts, and model versions traceable and independently repeatable?
- **Statistical review**: Are uncertainties propagated to final claims? Are model comparison metrics (e.g., cross-validation, information criteria) reported?
- **Symmetry and boundary review**: Do candidate mechanisms respect the system's actual symmetries and boundary conditions? Are hidden symmetries or orientation effects considered?
- **Causal chain review**: Does the proposed mechanism link perturbation, intermediate state, and observable response with correct temporal, spatial, and energetic ordering?
- **Extrapolation review**: Are conclusions restricted to tested parameter ranges? Is migration to new systems accompanied by explicit re-validation of assumptions?

# Provenance

- Synthesized from cluster 13.0 (transport-superconductivity-spin-phonon-evidence-analysis-workflow).
- Source skills: plasma-reconnection-signal-transport (4427ed79dc1df039), anisotropic-superconductivity-phase-diagram-exploration (2204.07975), frustrated-magnetotransport-exploration (f0393d3bf94fb3c7), nonlinear-angular-momentum-transport-exploration (66adfce2db4f365f), tokamak-cold-pulse-transport-exploration (d0b110a1c227f939), strongly-correlated-1d-transport-research (380d3a81d64cf040), nodal-line-transport-research-design (1c14641f64531be2), strain-phonon-superconductivity-exploration (18c9cb2836f2563c).
