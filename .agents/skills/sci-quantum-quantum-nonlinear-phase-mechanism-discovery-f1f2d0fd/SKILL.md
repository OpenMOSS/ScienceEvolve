---
name: sci-quantum-quantum-nonlinear-phase-mechanism-discovery-f1f2d0fd
description: A reusable end-to-end workflow for discovering and validating symmetry- and phase-governed mechanisms in quantum, nonlinear, and ultrafast wave systems through structured hypothesis generation, controlled validation, and iterative mechanism discrimination.
scienceevolve-title: "Quantum materials and condensed matter · quantum nonlinear phase mechanism discovery workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Guide agents in designing reusable research plans to discover, discriminate, and validate hidden mechanisms in quantum, nonlinear, ultrafast, or structured wave systems where symmetry, phase topology, modal interference, or microscopic structure governs anomalous observables. The workflow converts counterintuitive patterns or regime-boundary deviations into testable hypotheses, minimal models, and rigorous validation plans without relying on source-specific device parameters or operational recipes.

# When to use

Use this skill when the user asks to:

- Propose new research questions about anomalous spectral, spatial, temporal, or phase-resolved patterns in photonic, plasmonic, excitonic, phononic, magnonic, or ultrafast quantum systems.
- Design studies to distinguish true mechanism-driven behavior—such as strong coupling, nonlocal modal interference, phase-singularity-mediated dynamics, or symmetry-broken transport—from weak-coupling, artifact, or baseline-theory explanations.
- Evaluate whether engineered features (gain/loss, non-Hermiticity, spatial dispersion, disorder, external phase references) produce observable consequences beyond heuristic expectations.
- Move from a theoretical concept or single-platform result to a new system while preserving scientific reasoning rather than copying geometry or material specifics.

Do not use this skill as a substitute for operational fabrication protocols, laser-safety procedures, device-optimization recipes, or field-specific consensus reviews.

# Inputs required

Before producing a research plan, collect or infer:

1. **Target system class**: platform family, dimensionality, symmetry, and relevant degrees of freedom (e.g., modes, emitters, lattice sites, scattering channels).
2. **Baseline expectation**: the dominant theory, local model, or weak-interaction limit that defines expected behavior.
3. **Anomaly or objective**: the counterintuitive observable, rare event, phase pattern, or directional response that deviates from baseline.
4. **Tuning variables**: non-operational control dimensions such as detuning, symmetry class, coupling topology, orientation, or representation.
5. **Observables**: structured readouts (spectral phase, angular distribution, temporal fingerprint, transport metric, emission pattern) and their uncertainty characteristics.
6. **Modeling resources**: minimal-model formalisms, numerical solvers, and assumption hierarchies available for the platform.
7. **Controls and baselines**: reference configurations expected to suppress, preserve, or independently produce the target behavior.
8. **Constraints and stopping criteria**: safety boundaries, bandwidth limits, sample variability, and predefined success/failure thresholds.

# Core Workflow

Execute the following ordered stages. At each decision gate, pause, document the verdict, and only proceed if the criterion is met; otherwise, iterate or stop.

## Stage 1: Mechanism gap definition and baseline anchoring
- State the research question as a specific deviation from the baseline model.
- Identify the regime boundary where the dominant theory is expected to weaken (e.g., near degeneracies, symmetry transitions, or strong-coupling thresholds).
- **Decision gate (Reproducibility)**: Is the anomaly systematic across repeated observations or independent samples?
  - *No*: Classify as likely artifact or insufficient statistics; stop or refine measurement design.
  - *Yes*: Proceed.

## Stage 2: Symmetry-aware hypothesis generation
- Generate mechanism candidates by asking what symmetry, phase, modal, or microscopic contribution could transform the baseline output into the observed pattern.
- Build causal chains (e.g., engineered feature → modified coupling → interference → fingerprint) rather than transplanting specific material systems.
- For each candidate, define: evidence strength (high/medium/low), key assumptions, predicted discriminating signatures, and likely failure modes.
- Include an explicit artifact hypothesis and a baseline-theory hypothesis as competitors.
- **Decision gate (Falsifiability)**: Does every surviving hypothesis predict at least one unique signature or control contrast?
  - *No*: Refine hypotheses until falsifiable.
  - *Yes*: Proceed.

## Stage 3: Minimal model construction
- Construct the simplest model that retains the proposed mechanism, relevant symmetries, selection rules, and loss/open-channel structure.
- Distinguish eigenvalue conditions from observable response conditions; ensure the model connects to measurable quantities.
- **Decision gate (Model Discrimination)**: Does the minimal model predict a clear difference between the leading mechanism and its nearest competitor?
  - *No*: Add missing physics or simplify; if still unclear, return to Stage 2.
  - *Yes*: Proceed.

## Stage 4: Study design with strong controls
- Define independent variables (tuning dimensions), dependent variables (structured observables), and nuisance variables (disorder, bandwidth, environmental drift).
- Specify controls:
  - **Negative control**: configuration lacking the proposed symmetry, coupling, or feature.
  - **Positive/strong control**: known condition expected to produce the target behavior class.
  - **Representation/artifact control**: test that preserves coarse observables but changes microscopic structure or measurement geometry.
  - **Symmetry control**: transformation that should alter the output if the mechanism is symmetry-dependent.
- Define evaluation metrics (effect size relative to uncertainty, phase relation, robustness) and stopping conditions (effect disappears under controls, requires unphysical parameters, or is smaller than uncertainty).
- **Decision gate (Feasibility)**: Can the minimal validation be executed safely and within constraints?
  - *No*: Redesign or scope down.
  - *Yes*: Proceed.

## Stage 5: Execution and data quality assurance
- Perform measurements or simulations under predefined conditions.
- Conduct data quality checks: calibration, baseline subtraction, uncertainty estimation, and flagging of corrupted scans or numerical artifacts.
- **Decision gate (Quality)**: Is the dataset sufficient to test the predefined signatures with quantified uncertainty?
  - *No*: Pause, address calibration or convergence, then repeat.
  - *Yes*: Proceed.

## Stage 6: Mechanism discrimination and model comparison
- Extract identical observables from data and from each competing model (baseline, artifact, and mechanism hypotheses).
- Compare using the same analysis windows, normalization, and uncertainty treatment.
- Evaluate control contrasts: does the target behavior survive negative controls and match positive-control expectations?
- Update evidence strength for each hypothesis based on explanatory breadth and predictive success.
- **Decision gate (Discrimination)**: Does one mechanism survive all controls while alternatives fail?
  - *Refuted*: Return to Stage 2 to generate new candidates.
  - *Ambiguous*: Proceed to Stage 8 for targeted redesign.
  - *Supported*: Proceed to Stage 7.

## Stage 7: Robustness and stability validation
- Test sensitivity to realistic perturbations: fabrication variation, detuning, disorder, finite bandwidth, loss, or environmental drift.
- Quantify parameter-space boundaries where the effect persists, weakens, or changes sign.
- Verify reproducibility across independent methods (e.g., analytical vs. numerical) or sample variants.
- **Decision gate (Robustness)**: Does the effect persist within realistic tolerance and remain mechanism-specific?
  - *No*: Downgrade claim to provisional or regime-specific.
  - *Yes*: Proceed to Stage 8.

## Stage 8: Claim bounding and iteration decision
- Separate source-supported patterns from agent-inferred extensions.
- Bound claims to the tested symmetry class, spectral/material regime, representation, and tuning range.
- Document residual failure modes, boundary conditions, and non-uniqueness risks.
- Decide:
  - **Continue**: If supported and robust, propose orthogonal observable or new platform test.
  - **Redesign**: If ambiguous, design a discriminating experiment that changes one mechanism while preserving others.
  - **Stop**: If refuted or artifact-dominated, archive negative result and pivot.

# Output Format

Return results in the following structure:

1. **Research question and mechanism gap**: concise statement of the anomaly and why the baseline model is insufficient.
2. **Ranked hypothesis table**: for each candidate (including artifact and baseline), list evidence strength, key assumptions, predicted signatures, failure modes, and next decisive test.
3. **Study design**: independent/dependent/nuisance variables, control configurations, metrics, and stopping conditions.
4. **Analysis plan**: feature extraction, model comparison, uncertainty treatment, and reproducibility checks.
5. **Validation gates summary**: verdict and rationale for each decision gate.
6. **Iteration decision log**: current status (continue/redesign/stop) and rationale.
7. **Claim boundary statement**: explicit limits on transferability, evidence level, and regime validity.
8. **Provenance and safety notes**: source-skill references and non-operational safety constraints.

# Validation Gates

- **Reproducibility gate**: The anomaly is systematic across repeats or independent samples, not an isolated outlier.
- **Baseline gate**: The dominant theory fails or is weak in the tested regime; the anomaly is outside expected variance.
- **Control gate**: Negative, positive, and artifact controls are executed and distinguish the mechanism from competing explanations.
- **Model gate**: A minimal model predicts the discriminating signature and agrees with observations on identical observables.
- **Robustness gate**: The effect survives realistic perturbations and does not exist only in a non-physical parameter window.
- **Statistical gate**: Effect sizes exceed uncertainty, multiple comparisons are corrected when scanning large spaces, and uncertainties are propagated transparently.

# Claim Boundaries

- Distinguish **source-supported patterns** (validated in specific platforms or model classes) from **agent-inferred extensions** (hypothesized for new systems).
- Limit mechanism claims to the tested symmetry class, mode family, spectral regime, and structural representation.
- Do not extrapolate to universal behavior, device readiness, or consensus without cross-platform validation.
- Mark single-study or single-model results as provisional until independently replicated.
- Avoid presenting eigenvalue predictions as observable-response proofs; require response-level confirmation.

# Failure Modes

- **Artifact dominance**: The anomaly arises from detector response, calibration drift, numerical convergence, background scattering, or sample inhomogeneity.
- **Baseline sufficiency**: The dominant theory explains the observation once finite-size, disorder, or bandwidth effects are included.
- **Competing mechanism**: A simpler or phase-insensitive pathway produces the same observable without the proposed symmetry or phase feature.
- **Insufficient resource**: The proposed mechanism requires coupling, coherence, or phase gradients that are unavailable or unstable in the target platform.
- **Overfitting**: Post-hoc adjustment of model parameters or analysis windows creates apparent agreement without predictive power.
- **Non-uniqueness**: The observed pattern maps to multiple distinct structural or mechanistic origins.

# Validity Checks

Before finalizing any plan or claim, verify:

- **Confounding**: Could substrate, disorder, finite angular/spectral bandwidth, polarization leakage, detector artifacts, or environmental drift explain the result?
- **Specificity**: Does the proposed control or structural change alter the fingerprint more than generic intensity or yield changes?
- **Reproducibility**: Are independent samples, repeated sessions, versioned analysis code, and transparent uncertainty propagation available?
- **Statistical validity**: Are tail events sufficiently sampled? Are uncertainties reported for peak positions, phases, coupling parameters, and model comparisons? Is multiple-comparison correction applied?
- **Boundary conditions**: Is the coarse theory applied within its valid regime? Are conclusions limited to the tested representation, tuning range, and material class?
- **Non-uniqueness**: Has pattern-to-structure or pattern-to-mechanism inference been explicitly addressed with alternative models?
- **Evidence separation**: Are paper-supported methods clearly separated from new agent-generated inferences?

# Provenance

- Synthesized from cluster **177.0** (symmetry-guided mechanism discovery and validation).
- Derived from source skills: `metamaterial-nanophotonics-pulse-control-workflow`, `disordered-lattice-rare-event-research`, `pt-photonic-force-workflow`, `plasmon-exciton-strong-coupling-exploration`, `active-metasurface-open-resonator-exploration`, `lici-inspired-quantum-dynamics-workflow`, `phase-locked-hybrid-coherent-emission-design`, `nonlinear-photonics-anomaly-pattern-workflow`.
- No source-specific material systems, numerical parameters, fabrication protocols, or paper conclusions are embedded in this reusable workflow.
