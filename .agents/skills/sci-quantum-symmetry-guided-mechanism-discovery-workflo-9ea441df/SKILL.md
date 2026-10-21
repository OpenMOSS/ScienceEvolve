---
name: sci-quantum-symmetry-guided-mechanism-discovery-workflo-9ea441df
description: A reusable end-to-end workflow for generating falsifiable hypotheses, designing multi-modal validation experiments, and iterating toward a discriminated mechanism in quantum, topological, magnetic, and correlated matter systems.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided mechanism discovery workflow 40"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

This skill helps an agent transform an unresolved physical mechanism in quantum materials into a structured, transferable research program. It abstracts a symmetry-guided discovery pattern: define a mechanistic gap, use perturbations or tuning axes to break degeneracies between candidate explanations, and validate through coupled observables, rigorous controls, and iterative falsification. The goal is not to reproduce any single study but to provide a reusable reasoning scaffold for mechanism discrimination.

# When to use

Use this skill when the user asks to:

- Explore new research questions in quantum, topological, magnetic, superconducting, correlated-electron, or nanoscale material systems where the underlying mechanism is ambiguous.
- Generate falsifiable hypotheses about how a tuning parameter, symmetry change, or local configuration alters electronic, magnetic, structural, or transport behavior.
- Design conceptual validation plans that link multiple observables to discriminate competing mechanisms.
- Iterate a research plan after preliminary data show ambiguous scaling, competing phases, or sample-dependent artifacts.

Do not use this skill for operational laboratory protocols, device fabrication recipes, hardware alignment procedures, or as a general-purpose physics reference.

# Inputs required

Before generating a plan, collect or infer:

- **Target system class**: material family, known phases, relevant degrees of freedom, and symmetry context.
- **Unresolved mechanism**: the anomaly, gap, or conflicting evidence to be explained.
- **Candidate mechanisms**: competing explanations ranked by prior plausibility.
- **Available tuning axes**: non-chemical perturbations preferred when mechanism disentanglement is central (e.g., field, strain, pressure, gate, symmetry direction).
- **Observable channels**: transport, spectroscopy, diffraction, imaging, thermodynamic, or computational probes available for cross-checking.
- **Known confounders**: disorder, inhomogeneity, contact effects, probe-state uncertainty, background contributions, or calibration drift.
- **Constraints**: safety, ethics, reproducibility requirements, and boundaries for extrapolation.

# Core Workflow

Follow this ordered route. At each gate, decide whether to proceed, iterate, or stop.

1. **Frame the mechanistic gap**
   - State the unresolved question and why existing evidence is insufficient.
   - Identify the specific symmetry, tuning, or configuration variable that could break the degeneracy between candidate explanations.
   - **Gate**: Is the gap well-defined and non-trivial? If no, stop and refine the question.

2. **Generate ranked, falsifiable hypotheses**
   - For each candidate mechanism, produce: claim, evidence strength (strong/moderate/weak/speculative), key assumptions, predicted observables, likely failure modes, and minimal viable test.
   - Ensure at least one hypothesis predicts a different outcome across multiple observables or symmetry directions.
   - **Gate**: Are the hypotheses mutually distinguishable by at least one planned observable? If no, redesign the perturbation or readout basis before proceeding.

3. **Design multi-modal validation**
   - Define independent variables (tuning parameter, symmetry orientation, configuration contrast).
   - Define dependent variables across at least two observable channels (e.g., transport and structure, or spectroscopy and response function).
   - Specify controls: negative (mechanism absent), positive (known signature), instrumental (artifact check), and cross-observable (independent probe of same mechanism).
   - Pre-register stop conditions for irreproducibility, uncontrolled backgrounds, or safety/ethics limits.
   - **Gate**: Does the design include a decisive test capable of falsifying the leading hypothesis? If no, add a discriminator.

4. **Execute minimal viable validation**
   - Establish baseline reproducibility across independent samples, configurations, or computational settings.
   - Collect paired or perturbed data with concurrent stability indicators.
   - Screen for artifacts, drift, contact effects, background asymmetry, or probe reconfiguration.
   - **Gate**: Do stability and reproducibility meet pre-defined thresholds? If no, stop and troubleshoot data quality or controls.

5. **Analyze through linked evidence layers**
   - Perform quality screening and flag anomalous runs.
   - Extract features using consistent criteria; preserve uncertainty and calibration context.
   - Compare a model that includes the proposed mechanism against a null or competing model.
   - Use differential, paired, or symmetry-based analysis to suppress shared backgrounds when applicable.
   - Assess whether multiple independent observables converge on the same interpretation.
   - **Gate**: Do at least two independent evidence streams agree? If no, classify the result as weak or inconclusive and do not proceed to mechanism confirmation.

6. **Discriminate mechanisms**
   - Prefer mechanisms that explain multiple independent observables with fewer ad hoc assumptions.
   - Reject mechanisms that require unverified probe states, narrow fitting windows, or unmodeled background terms.
   - If a structural, electronic, or magnetic reconstruction appears, treat pre- and post-crossover regimes as separate mechanistic hypotheses.
   - **Gate**: Is the leading mechanism robust to alternative models, reasonable background-subtraction choices, and sample variation? If no, return to step 2 to split regimes or add missing degrees of freedom (disorder, strain, dimensionality, phonons, etc.).

7. **Map boundaries and bound claims**
   - Define the validated regime in terms of tuning range, temperature, symmetry, material family, and model approximations.
   - Distinguish observed results, supported inferences, model predictions, and speculative extensions.
   - State where the hypothesis should no longer be trusted.
   - **Gate**: Are all conclusions explicitly bounded by the evidence? If no, tighten boundaries before reporting.

8. **Iterate or pivot**
   - If the leading hypothesis is falsified, revise or replace it.
   - If only one observable supports the hypothesis, design a second independent discriminator rather than confirming.
   - If results are ambiguous, test whether overlooked variables (disorder, strain gradients, surface states, kinetic trapping, or probe configuration) explain the mismatch.
   - **Stop conditions**: Controls fail; the tuning axis is not clean; data are irreproducible; the mechanism requires extrapolation beyond validated symmetry or dimensionality; or safety/ethics boundaries are reached.

# Output Format

When using this skill, respond with:

1. **Research question framing** — Target system class, mechanistic gap, and why the question is non-trivial.
2. **Hypothesis table** — For each candidate: hypothesis statement, evidence strength, key assumptions, predicted observables, likely failure modes, and minimal viable test.
3. **Experimental design** — Independent variables, dependent variables, negative controls, positive controls, instrumental controls, cross-observable checks, and stop conditions.
4. **Analysis plan** — Data quality checks, feature extraction strategy, model comparison approach, differential or paired analysis if applicable, and uncertainty reporting.
5. **Iteration plan** — What result supports the leading hypothesis, what falsifies it, what requires regime splitting, and when to stop or pivot.
6. **Validity and safety statement** — Confounding factors, reproducibility requirements, boundary conditions, and confirmation that the plan remains at the non-operational research-design level.

# Validation Gates

Before treating any hypothesis as supported, confirm:

- **Data quality**: Measurements are stable, reproducible across independent runs, and free from dominant artifacts.
- **Mechanistic specificity**: The evidence distinguishes the proposed mechanism from generic backgrounds, alternative mechanisms, and calibration artifacts.
- **Control completeness**: Negative, positive, instrumental, and cross-observable controls are included and pass.
- **Model robustness**: Fit parameters are identifiable, stable across regimes, and insensitive to arbitrary fitting-window choices; competing models are explicitly compared.
- **Statistical validity**: Uncertainties are propagated, residuals are inspected, and exploratory analysis is separated from confirmatory claims.
- **Boundary conditions**: Conclusions are limited to the tested material family, tuning range, symmetry, temperature/field range, and structural phase.

# Claim Boundaries

- Separate **observed results** from **supported inferences**, **model predictions**, and **speculative extensions**.
- Label claims by provenance: paper-verified, model-predicted, agent-inferred, or experimentally unconfirmed.
- Do not generalize a single-system result to field-wide consensus.
- Distinguish bulk from surface, local from average, equilibrium from kinetic, and subsystem success from end-to-end system success.
- Keep all recommendations at the research-design level; do not present conceptual plans as operational guarantees.

# Failure Modes

- **False positives from uncontrolled variables**: Disorder, inhomogeneity, strain gradients, heating, contact artifacts, or probe reconfiguration mimic the target mechanism.
- **Incomplete background cancellation**: Differential or paired analysis leaves residual asymmetry comparable to the signal.
- **Overfitting and post-hoc selection**: Fitting windows, model complexity, or peak assignment are chosen after seeing the data.
- **Single-observable confirmation**: A mechanism is accepted based on one channel without independent cross-check.
- **Regime conflation**: Pre- and post-reconstruction behavior are treated as a single mechanism.
- **Extrapolation beyond validity**: Claims extend beyond the tested dimensionality, symmetry, disorder level, or tuning range.

# Validity Checks

Before finalizing conclusions, verify:

- **Confounding screened**: Disorder, sample inhomogeneity, surface degradation, strain, contact effects, calibration drift, and heating are plausibly ruled out.
- **Reproducibility confirmed**: Independent samples, repeated sweeps, symmetry-equivalent checks, and multiple measurement channels agree within uncertainty.
- **Causality independently evidenced**: Structural, electronic, or magnetic causes are supported by direct probes, not inferred from a single indirect observable.
- **Theory limits stated**: Approximations in models (exchange-correlation, spin-orbit treatment, missing interactions, finite size) are acknowledged.
- **Evidence labeling consistent**: Observations, inferences, and speculations are clearly distinguished.
- **Non-operational scope maintained**: No executable hazardous protocols, fabrication parameters, or unsafe procedural details are included.

# Provenance

- Synthesized from cluster **49.0** (symmetry-guided mechanism discovery and validation).
- Derived from source skills: `pressure-tuned-superconductivity-exploration`, `frequency-shaped-quantum-noise-research`, `magnetic-exchange-spectroscopy-research`, `single-molecule-spin-vibration-exploration`, `field-tuned-quantum-criticality-exploration`, `strained-fractal-nanomaterial-exploration`, `superconducting-nanowire-research-exploration`, `perovskite-ferroelectric-local-structure-exploration`.
- This workflow preserves the shared scientific logic of the source cluster without importing system-specific materials, numerical results, or paper conclusions.
