---
name: sci-quantum-quantum-nonlinear-phase-topological-evidenc-6c6a9228
description: End-to-end evidence analysis and claim audit workflow for quantum, nonlinear, topological, and phase-related systems, mapping hypotheses to multi-channel validations and iterative claim refinement.
scienceevolve-title: "Quantum materials and condensed matter · quantum nonlinear phase topological evidence analysis workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Provide a reusable, domain-agnostic workflow for auditing scientific claims in quantum, nonlinear, topological, and phase-related systems. It guides an agent from abstract mechanism hypotheses through minimal viable validation, multi-channel analysis, and iterative refinement, ensuring that only robust, well-controlled evidence supports published or proposed conclusions.

## When to use

- When migrating a theoretical mechanism (e.g., non-Hermitian singularities, topological transitions, nonlinear mode coupling) to a new experimental or numerical platform.
- When multiple observable channels (transport, spectroscopy, imaging, symmetry analysis) must be reconciled with an effective model or phase diagram.
- When the risk of artifact, disorder, or conventional alternative explanations is high and strong controls are required.
- When the goal is claim audit or evidence ranking rather than replication of a specific device recipe.

## Inputs required

- **Target platform**: Abstract system class, available modes/fields, and tunable control manifold.
- **Baseline behavior**: Expected response in the absence of the candidate mechanism.
- **Candidate mechanism**: Effective model, symmetry class, or topological invariant hypothesized to govern behavior.
- **Observable channels**: Available measurements, their resolution, and known cross-talk.
- **Constraint boundaries**: Feasibility limits, safety/compliance thresholds, and computational or experimental resources.

## Core Workflow

1. **Frame the problem and abstract the mechanism**
   - Map the target platform onto a minimal effective model or symmetry classification.
   - Identify the control manifold and distinguish trivial parameter drifts from structurally meaningful variations.
   - Define the specific gap between established baseline and proposed new physics.

2. **Generate competing, falsifiable hypotheses**
   - Produce at least two competing hypotheses: the candidate mechanism and the most plausible conventional alternative.
   - For each hypothesis, specify predicted observable signatures, critical assumptions, and explicit failure modes.
   - Grade evidence strength (high / medium / low) based on cross-platform replication, theoretical consistency, or analogical inference.
   - *Stop condition*: If no hypothesis can be falsified by available observables, redesign the measurement protocol before proceeding.

3. **Design minimal viable validation (MVV)**
   - Select the smallest parameter slice and simplest system configuration that can discriminate the leading hypothesis from its nearest rival.
   - Define independent variables, control variables, and nuisance variables.
   - Prescribe positive, negative, strong, and artifact controls.
   - Pre-register stop conditions and success criteria.

4. **Execute multi-channel observation and preprocessing**
   - Acquire data across all relevant channels (e.g., spectral, transport, spatial, symmetry-resolved).
   - Record calibration, exclusions, uncertainty propagation, and provenance.
   - *Decision gate — Data quality*: If signal-to-noise or calibration stability is insufficient, halt and repair the measurement chain.

5. **Perform model-constrained analysis**
   - Fit the minimal effective model; report parameter uncertainties and correlations.
   - Map abstract model features (eigenvalue trajectories, phase boundaries, mode exchanges) onto observables.
   - Compare active conditions against all control conditions simultaneously.
   - *Decision gate — Control consistency*: If negative or artifact controls reproduce the target signature, stop and redefine the mechanism criterion.

6. **Pass robustness and identifiability gates**
   - **Reproducibility gate**: Signature replicates across independent runs, samples, or random seeds.
   - **Cross-observable gate**: Multiple independent channels yield mutually consistent mechanism attributions.
   - **Model identifiability gate**: Effective model parameters are unique and stable under reasonable perturbations; equivalent fits from distinct physical models are ruled out.
   - **Robustness gate**: Conclusion holds when nuisance variables vary within their estimated ranges.
   - *Iteration trigger*: If a gate fails, return to Step 3 (redesign controls), Step 4 (add channels), or Step 2 (revise hypotheses).

7. **Iterate or terminate**
   - **Continue**: All gates passed; expand parameter space to test boundary predictions.
   - **Refine**: Gates partially passed; reduce model complexity or add diagnostic observables.
   - **Pivot**: Core hypothesis contradicted by controls or cross-observable inconsistency; generate new competing hypotheses.
   - **Terminate**: Effect is indistinguishable from artifacts, safety/compliance boundary reached, or model parameters remain non-identifiable after redesign.

8. **Package ranked claims with boundary annotations**
   - Rank surviving hypotheses by updated evidence strength.
   - Attach explicit regime boundaries (symmetry constraints, scale limits, parameter ranges).
   - Separate verified mechanisms, model-consistent inferences, and untested extrapolations.

## Output Format

Deliver a structured evidence package containing:

1. **Research question** — Target platform, candidate mechanism, and core unknown.
2. **Mechanism mapping** — Abstract model, symmetry class, and correspondence to target system.
3. **Ranked hypotheses** — Each with predicted signatures, evidence strength, critical assumptions, and failure modes.
4. **Validation plan** — MVV design, variable definitions, control matrix, metrics, and stop conditions.
5. **Analysis protocol** — Model fitting, multi-channel mapping, uncertainty quantification, and visualization plan.
6. **Iteration log** — Gate outcomes, redesign decisions, and pivot points.
7. **Claim boundary statement** — Explicit limits on extrapolation, untested regimes, and residual risks.

## Validation Gates

- **Reproducibility Gate**: Independent repetitions (across samples, runs, or analysis pipelines) reproduce the target signature within stated uncertainty.
- **Control Discrimination Gate**: Negative and artifact controls lack the signature; positive controls confirm measurement sensitivity.
- **Cross-Observable Consistency Gate**: At least two independent observable channels support the same mechanism attribution.
- **Model Identifiability Gate**: Effective model parameters are uniquely constrained, and equivalent alternative models are excluded.
- **Robustness Gate**: Conclusion persists under variation of nuisance parameters, numerical resolution, and reasonable systematic perturbations.

## Claim Boundaries

- **Verified mechanism**: Directly supported by independent replication and multi-channel consistency in the target platform.
- **Model-consistent inference**: Supported by effective model and controls, but limited to tested parameter ranges.
- **Analogical extension**: Mechanism plausible by symmetry or model analogy; requires re-validation on new platforms.
- **Speculation**: Beyond current evidence; must be labeled as such and not presented as consensus.

## Failure Modes

- **Single-channel artifact**: A signature appears in only one observable channel and cannot be corroborated.
- **Control failure**: Negative or artifact controls reproduce the target signature, indicating background, miscalibration, or misidentification.
- **Overfitting**: Effective model uses more degrees of freedom than justified by data structure; parameters trade off without physical meaning.
- **Coordinate confusion**: A plotting convention, gauge choice, or labeling artifact is mistaken for a physical phase boundary or topological transition.
- **False extrapolation**: Single-system or single-paper results are treated as domain consensus without cross-platform validation.
- **Premature termination**: Stopping iteration after a single positive result while ignoring failed robustness gates.

## Validity Checks

Before accepting any claim, confirm:

- [ ] All control conditions (positive, negative, strong, artifact) are defined and executed.
- [ ] Uncertainties are propagated and reported for parameters, fits, and derived metrics.
- [ ] Alternative conventional explanations are explicitly ruled out by data, not by assumption.
- [ ] Reproducibility is demonstrated across independent samples, runs, or analysis pipelines.
- [ ] Extrapolation boundaries are stated; untested regimes are clearly flagged.
- [ ] No operational lab recipes, hazardous protocols, or fabrication parameters are embedded in the claim.

## Provenance

- Synthesized from cluster 85.0 (quantum-nonlinear-phase-topological-evidence-analysis-workflow).
- Informed by source skills: `anisotropic-microcavity-ep-research`, `moire-optical-twist-exploration`, `pseudo-hermitian-hybrid-system-research`, `nonequilibrium-josephson-exploration`, `non-hermitian-anisotropic-photonic-exploration`, `quantum-dot-topological-autotuning-workflow`, `nonequilibrium-photon-statistics-workflow`, `phononic-crystal-wgm-rotation-exploration`.
- Source-specific conclusions, numerical results, and material parameters were excluded per synthesis rules.
