---
name: sci-quantum-evidence-analysis-claim-audit-workflow-0795f125
description: An end-to-end workflow for generating competing hypotheses from anomalous observations, designing minimal multi-control validation, analyzing multi-modal evidence, and auditing claims with explicit boundaries and iteration gates.
scienceevolve-title: "Quantum materials and condensed matter · evidence analysis claim audit workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Help an agent transform anomalous or unexplained observations into falsifiable research questions, design minimal validation plans with strong controls, analyze multi-modal evidence through competing models, and iterate or stop based on pre-defined decision gates. The goal is to migrate the method pattern—anomaly triangulation, hypothesis ranking, controlled validation, and evidence grading—across new systems without transferring specific material parameters, instrument settings, or paper conclusions as facts.

# When to use

Trigger this skill when:

- Observations deviate from conventional single-mechanism explanations (e.g., unexpected trends, weak order parameters, spectral anomalies, transport signatures, or symmetry-breaking signals).
- Multiple candidate mechanisms could explain the same data and need formal discrimination.
- Designing experiments or modeling campaigns that require positive, negative, background, internal, and repeat controls.
- Auditing existing claims for confounders, reproducibility, and boundary conditions before further investment.

Do not use this skill to replicate specific experimental recipes, fabrication steps, or hazardous operational protocols from source literature.

# Inputs required

- **Target system description**: composition, structure, known phases, relevant degrees of freedom, and sample morphology (at category level, not proprietary parameters).
- **Anomaly summary**: the cluster of observations that resist conventional explanation, including data quality notes and uncertainty sources.
- **Candidate theoretical frameworks**: minimal effective models, symmetry arguments, or computational approaches applicable to the domain.
- **Control resources**: reference systems where the candidate mechanism is expected to be present, absent, or suppressed; background/blank conditions; independent measurement modalities.
- **Constraints**: available probes, computational resources, reproducibility standards, safety/compliance boundaries, and minimum acceptable evidence level.

# Core Workflow

1. **Anomaly Clustering & Question Formulation**
   - Assemble related observations that cannot be jointly explained by a conventional baseline model. Identify the gap between expected and observed behavior.
   - **Decision Gate DG1**: Is the anomaly cluster coherent and reproducible across independent samples or data subsets? If no → Stop and diagnose data quality or confounders before proceeding.

2. **Candidate Mechanism Enumeration**
   - Generate at least three competing hypotheses: a baseline mechanism, a primary alternative, and a secondary alternative (e.g., intrinsic bulk, interfacial/local, extrinsic/measurement artifact).
   - For each hypothesis, define evidence strength (high/medium/low), key assumptions, necessary conditions, and falsifiable predictions (at least one positive, one negative, and one orthogonal probe prediction).
   - **Decision Gate DG2**: Can the hypotheses produce distinguishable signatures under the available observables and control variables? If no → Expand the observable set or reformulate the question.

3. **Minimal Validation Plan Design**
   - Select the smallest set of measurements or calculations that can discriminate between the top two competing hypotheses.
   - Define controls: positive (known reference), negative (mechanism absent/suppressed), background/blank (instrument/media), internal (same material, different phase/region), and repeat (independent samples/batches).
   - Specify independent variables (control knobs), dependent variables (responses tied to mechanism), and recorded metadata (sample provenance, processing path, analysis version).
   - **Decision Gate DG3**: Are the proposed controls ethically and logistically feasible without requiring unsafe or proprietary operational steps? If no → Redesign with lower-risk proxies or stop.

4. **Evidence Collection & Quality Audit**
   - Execute the minimal validation plan, documenting raw data lineage, preprocessing steps, background subtraction, resolution models, and outlier handling.
   - Perform benchmark analysis using the simplest conventional model; record failure modes and residual structure.
   - **Decision Gate DG4**: Is the data quality sufficient to resolve the predicted signatures above background and systematic error? If no → Halt and address instrumentation or sample issues.

5. **Multi-Model Analysis & Mechanism Discrimination**
   - Fit candidate minimal effective models to the anomaly cluster. Compare residuals, parameter identifiability, cross-dataset consistency, and predictive power.
   - Require at least two independent evidence classes (e.g., static order plus dynamic response, or spectroscopy plus transport) for any mechanism to advance.
   - Map microscopic model outputs to macroscopic observables via explicit bridging assumptions.
   - **Decision Gate DG5**: Does one hypothesis explain multiple independent evidence classes with consistent parameters while alternatives fail? If no → Retain competing hypotheses and proceed to iteration.

6. **Robustness & Sensitivity Checks**
   - Vary analysis choices (background windows, fitting ranges, initial parameters, approximation schemes) to test conclusion stability.
   - Check for confounders: sample heterogeneity, strain, defects, environmental drift, instrument calibration, and processing artifacts.
   - **Decision Gate DG6**: Do conclusions survive across reasonable perturbations of method and model? If no → Downgrade evidence strength and return to Step 2 or 5.

7. **Claim Bounding & Iteration/Stop**
   - Grade outputs as: observed fact, model-supported inference, indirect inference, or untested prediction.
   - State explicit boundary conditions: applicable parameter ranges, sample states, measurement geometries, and dimensional/thermal/compositional limits.
   - If evidence is strong and robust: expand to new variables, samples, or predictive design.
   - If evidence is weak, controls fail, or multiple mechanisms remain statistically indistinguishable: stop mechanism claims and return to hypothesis generation or redefine the observable space.
   - **Absolute Stop Conditions**: Safety/compliance limits reached; positive control fails; negative control produces equivalent signal; signal irreproducible across independent replicates; model non-identifiability persists after orthogonal probe addition.

# Output Format

A structured report containing:

1. **Research Question**: One-sentence definition of the anomaly and competing hidden degrees of freedom.
2. **Gap Analysis**: Why conventional explanations are insufficient and what method pattern (not paper conclusion) motivates the inquiry.
3. **Ranked Hypotheses**: Table with hypothesis name, mechanism class, evidence strength, key assumptions, falsifiable predictions, and failure modes.
4. **Validation Plan**: Minimal feasible measurements/calculations; control matrix (positive, negative, background, internal, repeat); variables and metrics table; stop conditions.
5. **Analysis Plan**: Data quality audit steps; benchmark model; candidate model comparison criteria; evidence grading rubric; visualization strategy.
6. **Iteration Plan**: Rules for updating hypotheses based on possible outcomes; conditions for expansion, pivot, or termination.
7. **Validity & Boundary Statement**: Confounders checked, reproducibility requirements, statistical validity, extrapolation limits, and compliance boundaries.

# Validation Gates

- **Candidate Gate (DG2)**: Hypotheses must yield mutually distinguishable signatures under available probes.
- **Stability Gate (DG6)**: Conclusions must be stable across reasonable analysis and model perturbations.
- **Robustness Gate (DG4/DG5)**: Signals must exceed background/systematic error and be supported by at least two independent evidence classes.
- **Claim Bounding Gate (DG7)**: Every conclusion must be tagged with an evidence grade and explicit boundary conditions before dissemination.

# Claim Boundaries

- Distinguish "observed fact" (raw data trend), "model-supported inference" (consistent fit across multiple datasets), "indirect inference" (requires untested bridging assumptions), and "untested prediction" (derived from model but not yet checked).
- Never transfer specific materials, numerical parameters, phase transition sequences, or instrument settings from source literature as universal truths.
- Avoid causal language ("proves," "demonstrates," "necessarily") when only correlational or model-dependent support exists; use "supports," "is consistent with," "weakens," or "does not distinguish."
- State dimensional, temperature, compositional, and structural boundaries beyond which the mechanism claim has not been validated.

# Failure Modes

- **False Positive**: Anomaly is an artifact of background, processing, instrument drift, or sample heterogeneity; mitigated by negative and background controls.
- **False Mechanism Attribution**: A candidate fits one dataset but fails on independent evidence or cross-dataset consistency; mitigated by multi-probe closure.
- **Overfitting**: Model with excess freedom captures noise; mitigated by minimal effective model requirement and parameter identifiability checks.
- **Irreproducibility**: Signal absent in repeats or across batches; mitigated by repeat controls and pre-registered analysis plans.
- **Boundary Violation**: Claim applied outside validated parameter range; mitigated by explicit boundary statements in every output.
- **Stalled Discrimination**: Competing hypotheses remain equivalent given current observables; mitigated by stopping and redesigning the observable space.

# Validity Checks

- **Confounders**: Audit sample uniformity, defects, strain, twinning, environmental drift, background subtraction, instrument resolution, calibration drift, and analysis choices.
- **Reproducibility**: Require independent samples, independent processing paths, blinded analysis streams, and locked analysis scripts with version control.
- **Statistical Validity**: Pre-define primary metrics, report parameter uncertainties, model selection criteria, overfitting diagnostics, and error propagation; avoid post-hoc significance selection.
- **Model Identifiability**: Confirm that candidate mechanisms produce different predictions under the given observation geometry; if degenerate, demand orthogonal evidence.
- **Extrapolation Boundaries**: Flag any extension to new compositions, structures, temperatures, or length scales as requiring re-validation; do not generalize from single-study observations.
- **Evidence Language**: Enforce graded terminology; prohibit "proof," "inevitable," or "consensus" unless supported by systematic review or independent replication.

# Provenance

- Method pattern synthesized from cluster 171, subcluster 171.0.
- Source skills referenced for workflow structure: spin-orbital-anomaly-triangulation; soft-matter-solvent-correlation-exploration; twisted-tmd-correlated-phase-workflow; high-pressure-ferroelectric-phase-exploration; quantum-emission-orbital-pattern-research; ferroelectric-surface-flexoelectric-exploration; reactive-surface-kinetics-research-agent; vdw-heterostructure-exciton-exploration.
- No specific paper conclusions, operational protocols, or material parameters are carried forward as validated facts.
