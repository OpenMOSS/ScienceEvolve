---
name: sci-quantum-symmetry-guided-mechanism-discovery-workflo-c3052a00
description: A reusable end-to-end workflow for generating hypotheses, designing validation studies, and iterating on mechanism discovery in systems where symmetry, topology, or phase constraints govern observable structure and dynamics.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided mechanism discovery workflow 85"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

This skill helps an agent propose research questions and design rigorous validation plans for systems where symmetry, topology, order parameters, or phase constraints shape observable structures, defects, or dynamics. It abstracts a transferable pattern: identify a structural or dynamical gap, encode it via hidden variables or underused information channels constrained by symmetry or topology, convert the mechanism into a measurable contrast, and validate through targeted controls and iterative model updates.

## When to use

Use this skill when the user asks for:

- New research questions in phase-sensitive, symmetry-sensitive, or topology-linked detection and characterization.
- Experimental or computational designs for holographic, interferometric, diffraction, spectroscopic, imaging, or scattering probes where hidden variables may encode target properties.
- Ways to infer hidden structural, dynamical, or defect-mediated information from interference, phase, angular momentum, correlation, displacement statistics, or boundary-mode observables.
- Plans to distinguish true mechanism-encoded signals from amplitude-only effects, artifacts, or model assumptions.
- Validation strategies for whether observed features are real structural or dynamical signatures rather than reconstruction bias, background, or measurement artifacts.

Do not use this skill for clinical advice, operational laboratory protocols, hazardous procedure optimization, or claims that require broad field consensus beyond the available evidence.

## Inputs required

Before generating a plan, ask for or identify:

- **Target system class** and the property to infer (e.g., local structure, phase coexistence, defect coordination, dynamical scaling).
- **Candidate hidden variable or information channel**, such as phase, timing, coherence, angular momentum, path history, displacement distribution, or boundary-mode occupation.
- **Available measurement or simulation modality** and known resolution, sensitivity, and calibration limits.
- **Relevant symmetry constraints, selection rules, conserved quantities, or topological invariants** that govern allowed configurations.
- **Candidate controls**, including mirror-image, achiral, inactive, mechanism-disabled, null-model, boundary-variation, or history-variation variants.
- **Strategy preference**: simulation-first, experiment-first, or combined validation.
- **Known noise sources, averaging effects, competing pathways, disorder, or calibration constraints** that could obscure the target contrast.

## Core Workflow

Follow this ordered end-to-end route. Treat each decision gate as a hard pause; stop or loop back if the gate fails.

### 1. Gap framing and state-manifold definition
- Identify the property-stability tension, structural unknown, or dynamical gap.
- Define the state manifold, symmetry class, order parameter, or topological constraint that governs allowed configurations and transitions.
- **Decision gate**: Is the gap addressable by symmetry-guided or topology-guided mechanism discovery? If no, stop and redirect.

### 2. Hidden-variable identification and mechanism bridge
- Propose underused information channels that may encode the target property more directly than dominant observables.
- Build a concise causal chain: target property → internal state change → response transformation → measurable contrast.
- Justify why the effect is symmetry-allowed, symmetry-required, or topology-linked.
- **Decision gate**: Does the mechanism predict a contrast distinguishable from simpler baselines? If no, return to Step 1.

### 3. Hypothesis generation and evidence ranking
- List target properties and candidate hidden variables.
- For each candidate, state the encoding mechanism, predicted observable signature (sign, phase behavior, modulation, asymmetry, correlation change), and required conditions.
- Assign evidence strength: speculative, weak, moderate, strong, or field-level.
- Name key assumptions and failure modes (state preparation, averaging, competing pathways, model realism).
- **Decision gate**: Are there hypotheses with falsifiable signatures and minimal viable tests? If no, stop.

### 4. Minimal viable validation design
- Define the smallest simulation or experiment that can show whether the hidden variable is encoded and read out.
- Specify independent variables (system, probe, geometry, control condition), dependent variables (primary and secondary observables), and evaluation metrics.
- Design controls:
  - **Negative control**: condition where the predicted contrast should vanish.
  - **Positive control**: known system or injected signal with expected signature.
  - **Strong control**: same target under different symmetry projections, or analysis with/without the proposed mechanism term.
  - **Boundary/history controls**: vary constraints or preparation paths to test selection mechanisms.
  - **Instrument/model controls**: check for artifacts, drift, reconstruction bias, or analysis dependence.
- Define stop conditions: weak contrast, failed controls, contradictory sign or phase behavior, dependence on arbitrary analysis windows, or reliance on unrealistic simplifications.
- **Decision gate**: Can the validation be performed safely and non-operationally with clear pass/fail criteria? If no, redesign.

### 5. Execution and layered analysis
- Preprocess consistently across conditions; document calibration, normalization, and exclusions.
- Predefine the null model before comparison.
- Inspect both global response structures and targeted projections where the mechanism should be strongest.
- Use normalized or differential contrasts rather than raw intensities alone.
- Decompose contributions from propagation, scattering, background, geometry, and initial-state effects.
- Stress-test analysis choices under alternative normalization, projection, averaging, or reconstruction assumptions.
- **Decision gate**: Does the signature survive null-model comparison and robustness checks? If no, proceed to Step 7.

### 6. Mechanism discrimination and claim bounding
- Classify the claim type: phase-sensitive, topology-linked, amplitude-only, geometry-only, or mixed.
- Check predicted sign, symmetry dependence, and mirror-image/handedness behavior where required.
- Separate allowed configurations from energetically or kinetically favored ones; do not conflate topology with energy selection.
- Compare measured modulations with forward simulations or candidate models before interpreting images or spectra.
- **Decision gate**: Is the mechanism specific, reproducible, and stable across controls? If no, demote the hypothesis.

### 7. Iteration and redesign
- **If contrast appears only when all proposed ingredients are present**: increase evidence strength; add realism gradually; move toward robustness tests.
- **If contrast appears in negative controls**: identify the artifact or confounder; redesign controls before interpreting.
- **If contrast has wrong sign, phase, or symmetry dependence**: revise the mechanism rather than only adjusting the metric.
- **If signal is weak under one projection**: search for an alternative symmetry projection or observable before rejecting the mechanism.
- **If simplified model succeeds**: treat it as design rationale support; require robustness checks before transfer to complex systems.
- **If only amplitude or yield differences are supported**: reframe the claim accordingly and downgrade phase-sensitive or topology-linked language.
- **Decision gate**: Has the hypothesis been revised, split, or rejected? Loop to Step 3 or 4 as needed.

### 8. Final validation and output compilation
- Aggregate validation gates, claim boundaries, failure modes, and residual risks.
- Ensure provenance and evidence limits are documented.
- Stop when the claim passes all validity checks or when stop conditions are met.

## Output Format

When using this skill, respond with:

1. **Research question and gap statement** — concise question linking target property, system class, and structural/dynamical mechanism.
2. **Hypothesis matrix** — for each hypothesis: mechanism, predicted signature, evidence strength, key assumptions, and likely failure modes.
3. **Validation plan** — independent variables, dependent variables, negative/positive/strong/boundary controls, evaluation metrics, and stop conditions.
4. **Analysis plan** — null model, projections or metrics, mechanism decomposition, robustness checks, and uncertainty handling.
5. **Iteration roadmap** — how to update the hypothesis for supporting, ambiguous, or negative results; criteria for escalating to more complex systems.
6. **Validity and ethics statement** — confounding risks, reproducibility checks, boundary conditions, evidence limits, and non-clinical/non-operational scope.

## Validation Gates

Before advancing a claim, verify:

- **Confounding check**: Could calibration, normalization, coordinate choice, background channels, competing pathways, or detector response create the apparent contrast?
- **Reproducibility check**: Does the signature survive independent projections, alternative analysis choices, and repeated simulations or measurements?
- **Control adequacy**: Do negative, positive, strong, boundary, history, and instrument/model controls isolate the proposed mechanism from artifacts?
- **Mechanism specificity**: Does the result support the proposed symmetry-linked or phase-sensitive pathway, or only a more general amplitude or geometry effect?
- **Statistical validity**: Is the effect size distinguishable from noise or numerical uncertainty, and was the null model defined before comparison?
- **Boundary condition check**: Which conclusions depend on simplified models, ideal alignment, particular geometries, or finite-size effects?

## Claim Boundaries

- Distinguish phase-sensitive or topology-linked evidence from amplitude-only, yield-only, or geometry-only evidence.
- Label conclusions as **demonstrated**, **plausible**, or **speculative** based on control passage and independent validation.
- Limit claims to the tested system, platform, or regime unless broader support is available from independent studies.
- Separate model-supported predictions from experimentally validated conclusions and from field-wide consensus.
- Avoid claiming a feature is a real structural or dynamical signature unless it passes reproducibility, control, simulation, and uncertainty checks.

## Failure Modes

- The hidden variable is not encoded in the observable or the readout lacks sensitivity.
- The signature is dominated by background, reconstruction bias, or competing pathways.
- Controls fail to isolate the mechanism (e.g., contrast persists in negative controls).
- The predicted sign, phase, or symmetry dependence is contradicted by observations.
- The result depends on arbitrary analysis windows, post-hoc fitting, or unverified assumptions.
- Overfitting to a simplified model; reconstructed or inferred features are unstable across conditions.
- Non-identifiability: multiple mechanisms or structures explain the data equally well.
- Extrapolation beyond the validated symmetry class, dimensionality, or measurement regime.

## Validity Checks

- **State-manifold validity**: Are the variables, symmetries, and constraints defensible for the target system and scale?
- **Prediction specificity**: Does the hypothesis predict something different from a simpler baseline?
- **Allowed-versus-favored separation**: Are topology/symmetry and energy/kinetics/disorder treated as distinct layers?
- **Observability**: Can the predicted signature be measured without relying on a single ambiguous observable?
- **Control strength**: Are baseline, negative, positive, history, boundary, and measurement controls appropriate?
- **Boundary awareness**: Are finite-size effects, surface stabilization, disorder, preparation history, and strain considered?
- **Statistical validity**: Are repeated preparations, simulations, sensitivity analyses, and uncertainty estimates included?
- **Extrapolation boundary**: Are claims limited to systems with comparable symmetry, dimensionality, and observability?
- **Evidence labeling**: Are source-supported workflow elements distinguished from new agent inferences?

## Provenance

- Synthesized from cluster **33.1** (symmetry-guided mechanism discovery and validation).
- Derived from source skills: `phase-sensitive-chirality-exploration`, `internal-detector-holography-workflow`, `perovskite-phase-boundary-exploration`, `topology-guided-defect-exploration`, `adsorbate-defect-surface-reconstruction-research`, `topological-dynamics-kibble-zurek-exploration`, `micro-doppler-research-design`, `xrd-disorder-statistical-workflow`.
