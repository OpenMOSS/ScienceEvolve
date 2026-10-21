---
name: sci-quantum-symmetry-guided-mechanism-discovery-workflo-7759ae00
description: A reusable end-to-end workflow for generating, validating, and iterating falsifiable hypotheses about hidden microscopic mechanisms in quantum, topological, and correlated systems using symmetry-selected observables and controlled comparisons.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided mechanism discovery workflow 21"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Guide agents to design research plans that connect hidden microscopic mechanisms to measurable symmetry-selected observables in quantum, topological, correlated, or wave-based systems. The workflow emphasizes mechanism-first reasoning, controlled comparison, and boundary-aware generalization rather than system-specific parameter replication.

# When to use

Use this skill when a user asks for:

- New research questions or hypotheses about symmetry-protected modes, topological transport, collective excitations, or emergent geometric effects.
- Experimental, numerical, or theoretical validation plans that require isolating a target mechanism from competing alternatives.
- Analysis workflows for decomposing mixed signals, attributing spectral or spatial features, or testing regime-dependent behavior.
- Iteration strategies for updating confidence after controlled tests.

Do not use this skill as a general-purpose domain assistant, operational protocol generator, or substitute for institutional safety and compliance review.

# Inputs required

Before producing a research plan, collect or request:

1. **Target system class**: relevant symmetry, topology, correlation, or wave regime.
2. **Mechanism candidate**: the microscopic process to test.
3. **Observable concept**: a symmetry-, component-, or time-sensitive signal that can separate the mechanism from background contributions.
4. **Comparison systems**: analogous configurations with and without the proposed mechanism, or where it should be suppressed.
5. **Available evidence**: prior measurements, simulations, symmetry analysis, and known systematic uncertainties.
6. **Validation constraints**: available modalities, resolution, sample or computational variability, calibration needs, and reproducibility requirements.
7. **Safety and ethics context**: non-operational boundaries, material hazards, and regulatory limits.

# Core Workflow

Follow this ordered route. Do not skip decision gates.

1. **Define the explanatory gap.** Identify a mismatch between an established simplified model and observations in a target regime. State the hidden mechanism that could resolve the gap and why existing observables fail to isolate it.
   - **Decision Gate DG1**: Is the gap well-defined and falsifiable? If not, refine the question before proceeding.

2. **Map to a minimal model and symmetry filter.** Derive or state the smallest effective description that preserves the mechanism. Identify symmetry constraints, selection rules, or component structures that allow the target mechanism while suppressing dominant alternatives.
   - **Decision Gate DG2**: Does the proposed observable provide a clean symmetry or component filter? If the observable is contaminated by competing channels, return to Step 1.

3. **Generate ranked hypotheses.** Produce falsifiable hypothesis cards including: research question, falsifiable statement, mechanistic rationale, predicted signature, key assumptions, evidence strength (established / plausible / speculative), and likely failure modes.
   - **Decision Gate DG3**: Can each hypothesis be invalidated by at least one defined control? If not, add contrast cases before proceeding.

4. **Design minimal viable validation.** Specify:
   - **Target case**: configuration expected to activate the mechanism.
   - **Baseline case**: conventional or simplified-model reference.
   - **Negative control**: configuration where the mechanism is absent or symmetry-forbidden.
   - **Positive control**: known configuration to verify the analysis pipeline.
   - **Mechanism-isolation controls**: projections that separate competing mechanisms.
   - **Artifact controls**: checks for geometry, calibration, orientation, and analysis-projection effects.
   - **Metrics**: primary mechanism-sensitive metric, secondary robustness metrics, and failure metrics (e.g., signature appears only under one analysis choice).
   - **Stop conditions**: predefined criteria for halting if controls fail or uncertainty dominates.
   - **Decision Gate DG4**: Are positive, negative, and artifact controls defined with matched coarse variables? If not, revise the design.

5. **Execute and check data integrity.** Confirm calibration, normalization, background subtraction, timing references, and matching of comparison cases before analysis.
   - **Decision Gate DG5**: If integrity checks fail or cases are mismatched, pause and correct.

6. **Analyze with mechanism-aware decomposition.**
   - Decompose signals into mechanism-specific and background components using a transparent model stated before fitting.
   - Normalize against shared artifacts or reference channels.
   - Compare target, baseline, and control cases with identical metrics and normalization.
   - Inspect residuals, side features, and sensitivity to analysis choices.
   - Propagate uncertainty from noise, calibration, model assumptions, and sample variability.
   - **Decision Gate DG6**: Does the predicted signature appear in the target case and vanish in negative controls? If not, proceed to Step 8 (Failure Mode handling).

7. **Attribute mechanism and grade evidence.**
   - **Strong**: matched cases, prederived predictions, multiple independent diagnostics, controls rule out major artifacts.
   - **Moderate**: main trend matches prediction, but one diagnostic remains model-dependent.
   - **Weak**: only aggregate improvement observed; contrast case does not cleanly isolate the mechanism.
   - **Unsupported**: result is explainable by confounders, artifacts, or post hoc metric selection.
   - **Decision Gate DG7**: Is the evidence grade at least Moderate and free of post hoc dependence? If unsupported, stop the claim.

8. **Iterate, redirect, or terminate.**
   - **If target signature is confirmed and controls hold**: Strengthen the mechanism claim, define the valid regime boundary, and propose generalization only to the smallest justified system class.
   - **If negative controls reproduce the signature**: Treat as artifact or competing mechanism; redesign the observable or controls (return to Step 2 or 4).
   - **If signature is weak or orientation-specific**: Improve calibration or choose a cleaner projection; do not increase interpretive confidence.
   - **If model and data disagree**: Reassess effective-theory assumptions, symmetry assignment, dominant channels, or nuisance variables (return to Step 2).
   - **Stop conditions**:
     - Negative controls outperform or equal the target signature.
     - Positive controls fail.
     - Result depends on unreported analysis choices, single orientation, or undisclosed tuning.
     - Tradeoffs or uncertainties exceed the bounds relevant to the downstream claim.
     - Safety, ethics, or compliance boundaries are reached.

# Output Format

When using this skill, return:

1. **Research objective and gap statement**: target regime, mechanism candidate, and why existing observables are insufficient.
2. **Hypothesis table**: for each candidate, include the question, falsifiable hypothesis, mechanistic rationale, predicted signature, variables, controls, metrics, evidence strength, key assumptions, and likely failure modes.
3. **Validation plan**: minimal viable validation, target/baseline/contrast cases, controls, metrics, and stop conditions.
4. **Analysis plan**: decomposition strategy, normalization, consistency checks, uncertainty handling, and visualization strategy.
5. **Iteration plan**: update rules for supportive, mixed, contradictory, or ambiguous results.
6. **Validity and safety notes**: confounders, evidence boundaries, reproducibility requirements, and non-operational safety constraints.

# Validation Gates

Before advancing between stages, confirm:

- **Mechanism specificity**: The proposed observable isolates the target mechanism better than existing alternatives.
- **Symmetry logic**: Expected selection rules, sign changes, or forbidden responses are explicitly tied to symmetry or topology.
- **Control sufficiency**: Positive, negative, mechanism-isolation, and artifact controls are present or explicitly justified.
- **Matching quality**: Comparison cases share coarse variables (geometry, scale, environment) except the hidden mechanism.
- **Artifact exclusion**: Geometry, orientation, calibration drift, detector response, background subtraction, and analysis-projection artifacts have been considered.
- **Model boundaries**: Theory assumptions, minimal-model simplifications, and parameter uncertainties are stated explicitly.
- **Statistical validity**: Uncertainty estimates, repeated measurements or ensembles, and stopping rules are defined.

# Claim Boundaries

- Distinguish correlation from causation; a reproducible correlation supports coupling but does not prove causality.
- Separate established facts, source-validated methods, model-supported inferences, and speculative extensions.
- Limit claims to the tested symmetry class, topology, phase stability, correlation regime, and measurement validity window.
- Do not extrapolate from a single system or narrow parameter window without additional controls.
- Label conclusions as established, model-supported, newly inferred, or speculative.

# Failure Modes

- Geometry, orientation, or configuration artifacts mimic the target signature.
- Polarization leakage, mixed tensor channels, coordinate-choice effects, or solver assumptions create false asymmetries.
- Competing mechanisms (disorder, carrier dynamics, thermal effects, nonlinear saturation, alternative gauge structures) reproduce the observable.
- Truncation, discretization, or modal incompleteness generates spurious features.
- Overfitting or post hoc metric selection produces apparent agreement.
- Sample inhomogeneity, phase ambiguity, or uncontrolled confounders obscure mechanism attribution.
- Finite-size or boundary effects masquerade as bulk mechanisms.

# Validity Checks

Before presenting conclusions:

- **Assumption mapping**: Are simplifications (isotropy, mean-field, truncation, lossless, idealized geometry) explicitly stated?
- **Boundary conditions**: Are geometry, access channels, normalization, and symmetries compatible across model and benchmark?
- **Confounders**: Could finite size, disorder, background, resolution, numerical convergence, or sample variability explain the result?
- **Reproducibility**: Are analysis choices, random seeds, calibration logic, code versions, and processing stages documented for independent checking?
- **Mechanism specificity**: Does the predicted signature distinguish the target mechanism from plausible alternatives?
- **Evidence hierarchy**: Are conclusions labeled as symmetry-protected, analytically derived, numerically demonstrated, analogy-based, or speculative?
- **External validity**: Is the claim restricted to the tested regime, or justified by additional evidence beyond the immediate benchmark?

# Provenance

Derived from cluster 71.0 (symmetry-guided mechanism discovery and validation). Synthesized from source skills: `weyl-shg-helicity-topology-research` (51fd151b4155473f), `vectorial-focusing-research-planning` (4438fd4e55dbb3ae), `coherent-wave-disorder-transmission-planning` (afad719261f2fbd7), `photonic-weyl-synthetic-geometry-exploration` (de1d28de871810a7), `electromagnetic-scattering-multipole-exploration` (f5922e382a677ee2), `topology-laser-research-workflow` (arxiv-cmoat__2606.31067), `driven-correlated-lattice-workflow` (d479926296e7cfa5), `cuprate-spin-fluctuation-research-design` (1326e0b935c00797).
