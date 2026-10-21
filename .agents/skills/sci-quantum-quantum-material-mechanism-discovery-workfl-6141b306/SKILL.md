---
name: sci-quantum-quantum-material-mechanism-discovery-workfl-6141b306
description: A reusable end-to-end workflow for symmetry-guided mechanism discovery and validation in topological, correlated, and phonon-coupled quantum materials.
scienceevolve-title: "Quantum materials and condensed matter · quantum material mechanism discovery workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Guide agents to formulate, test, and iterate mechanism-driven research questions in quantum materials where structural motifs, electronic correlations, lattice dynamics, and transport anomalies may be coupled. The workflow translates a symmetry-guided anomaly into competing hypotheses, validates them through converging multi-modal evidence and strong controls, and bounds claims by separating observation from inference.

## When to use

Use this skill when the task involves one or more of the following:

- Proposing new research questions in topological, correlated, superconducting, layered, or geometrically frustrated quantum materials.
- Designing non-operational studies that link external tuning variables—such as pressure, strain, composition, gating, temperature, or magnetic field—to electronic reconstruction, phonon anomalies, or transport regime changes.
- Planning combined experimental-computational strategies to test whether an observed anomaly reflects a band-structure, carrier-type, structural, or correlation-driven transition.
- Interpreting resistivity, magnetoresistance, Hall response, spectroscopic features, or vibrational mode evolution as evidence for candidate mechanisms.
- Building iterative research plans that update hypotheses after partial, conflicting, or ambiguous results.

Do not use this skill to generate clinical advice, operational laboratory procedures, hazardous experimental recipes, or directly executable high-risk parameters.

## Inputs required

Before using the workflow, collect or infer:

- **Target material class** and dominant structural motif, dimensionality, and known phases.
- **Baseline anomalies or unresolved observations** from transport, spectroscopy, diffraction, thermodynamics, or prior computational work.
- **Candidate tuning variables** expected to modify lattice spacing, symmetry, hybridization, carrier density, or Fermi-surface topology without changing chemistry.
- **Available probes and methods**: structural, vibrational, optical, transport, magnetic, calorimetric, and first-principles or many-body computational tools.
- **Known confounders**: sample variability, growth-route sensitivity, disorder, stoichiometry, strain gradients, and calibration limitations.
- **Data standards and metadata**: temperature, field, tuning variable, crystallographic orientation, sample batch, calibration method, and uncertainty estimates.

## Core Workflow

Execute the following ordered route. Advance through a gate only when the condition is satisfied; otherwise iterate, redesign, or stop.

### 1. Anomaly and gap identification
- Inventory reproducible baseline features that indicate nontrivial electronic structure or lattice behavior: resistivity extrema, Hall sign reversals, nonlinear magnetoresistance, quantum oscillations, spectroscopic band crossings, mode softening/hardening, or linewidth anomalies.
- Locate the domain gap: identify whether the mechanism behind the anomaly is unresolved across the full tuning range or incompletely tested.
- **Gate:** If anomalies are not reproducible across repeated measurements or lack adequate baseline metadata, stop and improve characterization before hypothesizing.

### 2. Symmetry-to-mechanism hypothesis generation
- Map the structural motif, symmetry operations, orbital character, and dimensionality to candidate mechanisms: band-gap evolution, Lifshitz transition, carrier compensation, electron-phonon coupling, correlation-driven reconstruction, symmetry change, or topological transition.
- Formulate at least three competing, falsifiable hypotheses. For each, specify:
  - Evidence strength (high, moderate, low, speculative).
  - Key assumptions (sample quality, structural stability, model adequacy).
  - Predicted signatures across multiple independent observables.
  - Most likely failure modes (artifacts, disorder, competing scattering, model oversimplification).
- **Gate:** If hypotheses lack discriminating observables or cannot be falsified with accessible probes, reformulate before proceeding.

### 3. Minimal validation design
- Define the primary research question linking the tuning variable to electronic-structure, vibrational, or transport evolution.
- Select independent variables (tuning axis) and dependent variables (transport, spectroscopic, structural, thermodynamic, or computational indicators).
- Specify a control set:
  - **Negative control:** a comparable material, orientation, or condition expected not to show the targeted reconstruction.
  - **Positive control:** a known system with established signatures analogous to the predicted anomaly.
  - **Sample control:** multiple batches or growth routes when variability is known.
  - **Instrumental control:** calibration standards, repeated sweeps, and checks for hysteresis or contact artifacts.
  - **Model control:** calculations with and without key interactions (e.g., spin-orbit coupling, correlation corrections).
- Define evaluation metrics and pre-specified stop conditions (e.g., calibration unreliable, controls fail, signal dominated by artifacts, model fits unstable).
- **Gate:** If validation is not minimal, lacks controls, or requires operational hazardous detail, redesign at a non-operational level.

### 4. Evidence collection and preprocessing
- Acquire multi-modal data and computational results across the tuning axis.
- Preprocess consistently: document calibration, background treatment, normalization, and convergence choices; retain raw data for audit.
- Separate symmetric and antisymmetric components where appropriate; average repeated sweeps; propagate uncertainty.
- **Gate:** If signal quality is insufficient, calibration is unreliable, or preprocessing introduces unquantified bias, stop and redesign the measurement matrix.

### 5. Cross-probe analysis and triangulation
- Extract trend observables from each data stream independently (peak positions, linewidths, carrier parameters, band crossings, spectral weight).
- Cross-correlate anomalies across probes to test whether they occur in the same tuning regime.
- Compare experimental trends with first-principles or phenomenological models.
- **Convergence rule:** Require at least two independent signatures before claiming electronic or structural reconstruction; require three or more before inferring a specific transition mechanism.
- **Gate:** If independent probes give mutually incompatible transition assignments or theory-experiment disagreement cannot be explained by artifacts or model limitations, pause mechanism claims and diagnose the mismatch.

### 6. Mechanism discrimination and claim bounding
- Rank mechanisms by the breadth of converging evidence and the specificity of controls.
- Label every claim by evidence type:
  - **Directly observed:** from measurement.
  - **Inferred:** from a model with stated assumptions.
  - **Computational:** from theory with stated approximations.
  - **Speculative:** beyond current evidence.
- Bound claims to the tested material, tuning range, and measurement conditions.
- **Gate:** If the leading mechanism relies on a single ambiguous observable or unexplained discrepancy, downgrade the claim to an anomaly or crossover.

### 7. Iteration or termination
- **If evidence converges:** strengthen the hypothesis, test boundary conditions, and expand to family-level questions one variable at a time.
- **If evidence conflicts:** split the hypothesis into subclaims, identify the contradicted link, add orthogonal probes, or replace the mechanism.
- **If results are ambiguous:** improve controls, increase sample diversity, or narrow claims; do not escalate to broader studies until reproducible baseline evidence exists.
- **Stop conditions:** terminate or redesign if reproducibility remains unresolved, phase identity is unclear, multiple models fit equally well without independent constraints, or safety/compliance boundaries prevent non-operational validation.

## Output Format

When using this skill, return the following structure:

1. **Research question.** A concise question linking the tuning variable to electronic-structure, vibrational, or transport evolution.
2. **Background gap.** What is known, what is uncertain, and why the question matters.
3. **Hypothesis set.** At least three hypotheses, each with evidence strength, key assumptions, predicted signatures across multiple probes, and likely failure modes.
4. **Minimal validation plan.** Non-operational experimental and computational design with independent variables, dependent variables, controls, evaluation metrics, and stop conditions.
5. **Analysis plan.** Data preprocessing, model choices, cross-probe correlation criteria, uncertainty handling, and rules for strengthening or falsifying each hypothesis.
6. **Iteration rules.** How results should update the hypothesis set, including conditions for strengthening, weakening, splitting, replacing, or stopping.
7. **Validity and safety notes.** Confounders, reproducibility checks, boundary conditions, and non-operational safety constraints.
8. **Evidence classification.** Mark each claim as directly observed, inferred, computational, or speculative.

## Validation Gates

Before advancing from design to interpretation, confirm:

- **Reproducibility:** anomalies are observed across repeated sweeps, multiple samples, or independent batches.
- **Calibration status:** instruments are calibrated and instrumental controls are documented.
- **Probe convergence:** at least two independent probes support the same regime boundary or anomaly.
- **Control performance:** negative and positive controls behave as expected.
- **Model validity:** computational assumptions are appropriate for the material and convergence is verified.
- **Causal plausibility:** the tuning variable plausibly causes the observed change rather than merely correlating with it.
- **Statistical stability:** fit parameters, extracted trends, and decompositions are stable under reasonable alternative choices.

## Claim Boundaries

- Separate directly measured quantities from model-derived inferences and computational predictions.
- Limit claims to the validated material class, structural motif, tuning range, temperature/field window, and measurement conditions.
- Do not generalize from a single sample, single compound, or single study to an entire material family without independent replication.
- Label speculative extensions, analogies, and extrapolations explicitly.
- Avoid presenting single-method or single-sample evidence as field-wide consensus.

## Failure Modes

- **Single-probe overinterpretation:** treating one anomalous signature as sufficient proof of a phase transition or mechanism.
- **Sample heterogeneity:** allowing phase impurity, disorder, or batch variation to dominate the interpreted signal.
- **Artifact confusion:** misattributing background subtraction errors, contact geometry effects, strain gradients, or nonuniform tuning to an intrinsic mechanism.
- **Model overfitting:** extracting carrier parameters or spectral features beyond the valid regime of the simplified model.
- **Approximation artifacts:** treating a feature that appears under only one computational approximation as robust physical evidence.
- **Correlation versus causation:** inferring that a tuning variable drives a transition without ruling out confounding variables.
- **Extrapolation beyond range:** extending conclusions beyond the measured tuning, temperature, or compositional window.
- **Unresolved reproducibility:** building mechanism claims on irreproducible or single-sample observations.

## Validity Checks

Before finalizing a research plan or interpretation, check:

- **Confounding factors:** sample quality, growth route, stoichiometry, defects, strain gradients, calibration offsets, contact geometry, thermal history, and environmental exposure.
- **Reproducibility:** consistency across samples, batches, measurement geometries, and analysis pipelines.
- **Statistical and model validity:** fit residuals, parameter uncertainty, sensitivity to fitting windows, overfitting risk, and stability under alternative decompositions.
- **Boundary conditions:** limits of hydrostatic or quasi-static tuning, finite-temperature effects, low-field versus high-field regimes, momentum resolution, and extrapolation limits.
- **Computational validity:** convergence, basis set, exchange-correlation choice, spin-orbit coupling treatment, van der Waals corrections, and adequacy of disorder or correlation approximations.
- **Probe consistency:** structural, vibrational, optical/electronic, transport, and thermodynamic results must converge on the same mechanism or the discrepancy must be explained.
- **Claim discipline:** ensure observations are separated from inferred mechanisms, and speculative extensions are clearly labeled.

## Provenance

Derived from cluster 93.0 (symmetry-guided mechanism discovery and validation) via semantic merge of source skills: pressure-tuned-topological-transport-exploration, layered-chalcogenide-pressure-exploration, kagome-electronic-structure-exploration, metastable-alloy-superconductivity-exploration, quantum-transport-topological-material-discovery, layered-nanoribbon-thermoelectric-workflow, layered-nickelate-correlation-exploration, and correlated-oxide-spectral-exploration. Source-specific materials, numerical parameters, and paper conclusions have been abstracted to produce a reusable, domain-transferable workflow.
