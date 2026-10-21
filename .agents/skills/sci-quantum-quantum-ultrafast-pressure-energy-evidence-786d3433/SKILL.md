---
name: sci-quantum-quantum-ultrafast-pressure-energy-evidence-786d3433
description: End-to-end evidence analysis and claim audit workflow for quantum, ultrafast, high-pressure, and energy-phase research, enabling hypothesis generation, multi-modal validation, and iterative claim bounding without operational protocols.
scienceevolve-title: "Quantum materials and condensed matter · quantum ultrafast pressure energy evidence analysis workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

This skill helps an agent transform observation gaps and ambiguous claims into falsifiable research questions, design minimal viable validation with strong controls, discriminate competing mechanisms through multi-modal evidence, and bound conclusions within verifiable limits. It is intended for studies involving quantum states, ultrafast dynamics, high-pressure conditions, energy transfer, and phase transitions or phase separation, where hidden variables, diagnostic degeneracy, and path-dependent effects are common.

## When to use

Trigger this skill when the task involves:

- Proposing new research questions or auditing existing claims in quantum, ultrafast, high-pressure, energy, or phase-related systems.
- Distinguishing hidden mechanisms (e.g., field effects, boundary coupling, kinetic trapping, dynamic networks) from artifacts or conventional single-mechanism explanations.
- Designing non-operational validation frameworks that include controls, stopping conditions, and iteration paths.
- Integrating multi-modal observations (scattering, spectroscopy, imaging, transport, simulation) to close an evidence chain.

Do not use this skill to generate executable experimental procedures, hazardous operational protocols, material synthesis recipes, or to bypass safety and ethics review.

## Inputs required

Before invoking the workflow, gather or clarify:

- **Target system**: Material class, state variables (pressure, temperature, field, energy density), relevant length/time scales, and known heterogeneity or history dependence.
- **Observation context**: Available diagnostics, simulations, or data streams; their resolution, calibration status, and synchronization limits.
- **Existing evidence**: Literature claims, preliminary data, benchmark models, known controversies, and identified gaps.
- **Candidate mechanisms**: At least two mutually distinguishable mechanisms with explicit predictions for independent observables.
- **Constraints**: Safety and compliance boundaries, data quality limits, reproducibility requirements, and variables that cannot be directly manipulated.

## Core Workflow

Execute the following ordered route. At each decision gate, pause, evaluate, and only proceed if the pass condition is met; otherwise, stop or return to the indicated step.

1. **Define the evidence gap and audit scope**
   - Map existing claims against current observations. Identify which claims are directly supported, which rely on single-diagnostic inference, and which contain unstated assumptions.
   - Formulate a falsifiable research question focused on mechanism discrimination, state identity, or hidden-variable detection.
   - **Decision gate**: If the question cannot be framed as a comparison between at least two distinguishable mechanisms or states, stop and reformulate.

2. **Generate competing mechanism hypotheses**
   - Produce ≥2 candidate mechanisms (e.g., uniform vs. spatially heterogeneous dynamics, short-range vs. long-range propagation, intrinsic vs. artifact origin).
   - For each candidate, write a prediction chain: mechanism → expected observable signatures → auxiliary signals → conditions under which the hypothesis fails.
   - Assign evidence strength (high / medium / low) based on whether the prediction is supported by multi-modal consistency, single-diagnostic agreement, or analogy only.
   - **Decision gate**: If candidates lack mutually exclusive predictions for at least one accessible observable, return to step 1 and sharpen the discrimination strategy.

3. **Design minimal viable validation (MVV)**
   - Select the smallest set of observations and controls that can increase or decrease confidence in at least two competing candidates.
   - Define:
     - **Positive control**: a configuration expected to produce the target signature, confirming diagnostic sensitivity.
     - **Negative control**: a configuration expected to suppress the target signature, exposing systematic artifacts.
     - **Strong control**: a perturbation that changes one mechanism’s prediction without changing another’s (e.g., viewpoint, path history, boundary condition, or regime variable).
     - **Instrument/process control**: checks for calibration drift, background, resolution limits, and selection bias.
   - Specify evaluation metrics (discriminative power, robustness, cross-diagnostic consistency) and stopping conditions.
   - **Decision gate**: If the MVV cannot be specified without violating safety constraints or requiring operational execution details, abstract the design to a non-operational protocol and flag for institutional review; if discrimination remains impossible, stop.

4. **Execute multi-modal evidence collection and quality audit**
   - Acquire or inspect data from independent channels (structure, dynamics, spectroscopy, imaging, transport, simulation).
   - Audit data quality: coverage, calibration, synchronization, background, missing values, and sampling bias.
   - **Decision gate**: If quality audits reveal unresolvable calibration failures, insufficient resolution, or missing critical channels, halt analysis and return to step 3 to redesign the observation plan.

5. **Mechanism discrimination and model comparison**
   - Extract features predicted by each candidate (e.g., peak evolution, asymmetry, scaling behavior, phase coherence, path dependence).
   - Compare candidate mechanisms against observations using simplified models and, where appropriate, forward diagnostic models that include geometry, resolution, and noise.
   - Test cross-diagnostic consistency: independent channels should constrain the same mechanism direction.
   - **Decision gate**: If multiple mechanisms fit the data equally well within uncertainty, mark the comparison as degenerate, return to step 2, and design additional discriminators before claiming mechanism identification.

6. **Quantify uncertainty and test sensitivity**
   - Propagate statistical, systematic, and model-form uncertainties into all inferred parameters and claim grades.
   - Vary analysis choices (binning, fitting windows, background subtraction, selection rules, boundary conditions) to test robustness.
   - **Decision gate**: If the effect of interest is swallowed by uncertainty envelopes or is highly sensitive to arbitrary analysis choices, downgrade the claim to exploratory or stop.

7. **Synthesize evidence and grade claims**
   - Integrate multi-modal results into a single evidence chain.
   - Assign a claim grade:
     - **Confirmed**: multiple independent diagnostics agree, controls pass, and major artifact explanations are excluded.
     - **Candidate**: evidence points toward one mechanism, but at least one critical diagnostic or control is missing.
     - **Unsupported / Artifact**: observations are better explained by known artifacts, alternative mechanisms, or uncontrolled variables.
     - **Unresolved**: contradictory evidence or insufficient data to adjudicate.
   - **Decision gate**: If evidence is contradictory and cannot be reconciled by reasonable confounding factors, flag as unresolved and require new data rather than forcing a conclusion.

8. **Iterate or terminate**
   - **If supported**: tighten the claim boundaries (pressure/temperature/scale/regime range) and propose a precision test or external validation.
   - **If partially supported**: split the mechanism into sub-hypotheses (e.g., change propagation direction, rate, or spatial scale) and design a targeted follow-up.
   - **If contradicted**: check baseline, instrument, and processing assumptions; if these are sound, generate alternative mechanisms and return to step 2.
   - **If degenerate**: introduce a new strong control or independent observable and return to step 3.
   - **Stop conditions**:
     - Safety or compliance boundaries are violated.
     - Key signals cannot be resolved from background or calibration uncertainty.
     - Candidate mechanisms remain indistinguishable after reasonable experimental redesign.
     - Repeated measurements reveal uncontrolled systematic error.
     - The narrative collapses into an unfalsifiable explanation.

## Output Format

Each invocation should produce:

1. **Research question**: One sentence defining the falsifiable gap or claim audit target.
2. **Evidence map**: Known observations, literature expectations, data limits, and uncertainty sources, with paper-verified claims separated from inferred gaps.
3. **Candidate hypotheses**: A table or list of ≥2 mechanisms, each with predicted signatures, evidence strength, key assumptions, and failure modes.
4. **Experimental / observational design**: MVV description, variable definitions (independent, dependent, covariate), control hierarchy, evaluation metrics, and stopping conditions.
5. **Analysis plan**: Steps for feature extraction, model comparison, cross-diagnostic consistency checks, uncertainty propagation, and robustness testing.
6. **Iteration plan**: Branches for supported, partial, contradictory, and degenerate outcomes, with explicit next actions.
7. **Confidence statement**: Clear separation of what is directly observed, what is model-supported, and what remains agent inference or analogy.

## Validation Gates

- **Data quality gate**: Calibration, coverage, synchronization, and background are documented and sufficient for the claimed resolution.
- **Control success gate**: Positive and negative controls behave as expected before mechanism claims are advanced.
- **Discrimination gate**: At least one observable must show divergent predictions between the leading candidate and its nearest competitor.
- **Consistency gate**: Independent diagnostics or data subsets must point in the same mechanistic direction; contradictions trigger unresolved status.
- **Uncertainty gate**: The effect size exceeds combined uncertainty under alternative analysis choices; otherwise, the claim is downgraded.
- **Boundary gate**: Conclusions are explicitly confined to the verified parameter regime; extrapolation is labeled and justified separately.

## Claim Boundaries

- Distinguish **direct observation** (raw signal), **model-supported inference** (fit or simulation), and **agent-generated hypothesis** (new system, new combination, or extrapolation).
- Do not present single-paper or single-system conclusions as domain consensus.
- Confine mechanism claims to the pressure, temperature, energy density, scale, and diagnostic regimes where they have been explicitly tested.
- When extrapolating to new materials, scales, or excitation conditions, restate the original conclusion as a *hypothesis to be revalidated* and list the specific boundary conditions that may invalidate it.
- Avoid causal language when only association or consistency has been established.

## Failure Modes

- **Diagnostic degeneracy**: Multiple mechanisms produce identical signatures within current resolution. *Response*: add independent observables or strong controls.
- **Hidden variable / path dependence**: State identity or dynamics depend on unmeasured history, kinetics, or boundary conditions. *Response*: introduce path controls and reversible scans.
- **Instrument artifact or processing bias**: Apparent signal arises from calibration drift, background, phase wrapping, projection effects, or selection rules. *Response*: run instrument controls and alternative processing pipelines.
- **Finite-size or finite-time effects**: Scaling behavior or state labels are distorted by limited system size, observation window, or transient dynamics. *Response*: vary scale or duration and test convergence.
- **Uncontrolled heterogeneity**: Spatial or sample-to-sample variation mimics mechanism signatures. *Response*: increase spatial/sample coverage and use statistical controls.
- **Safety or compliance barrier**: The validation design requires operational details or risk levels outside authorized scope. *Response*: abstract to non-operational design and flag for institutional review.

## Validity Checks

Before finalizing any output, verify:

- **Mechanism specificity**: Can the observation reject at least one plausible alternative?
- **Evidence separation**: Are paper-verified methods, target-system data, and agent inferences clearly labeled?
- **Reproducibility**: Can the analysis be repeated with the documented data version, processing parameters, and selection rules?
- **Statistical validity**: Are multiple comparisons, non-stationarity, autocorrelation, and error propagation addressed?
- **Boundary conditions**: Are conclusions limited to tested regimes of state variables, sample history, and diagnostic capability?
- **Extrapolation caution**: Is any generalization to new systems explicitly framed as a hypothesis with stated failure modes?

## Provenance

Synthesized from cluster `144.0` (quantum-ultrafast-pressure-energy-evidence-analysis-workflow). Derived from source skills: `ultrafast-nanoplasma-structural-dynamics-workflow`, `plasma-shock-field-exploration`, `cosmic-ray-heliospheric-time-series-research`, `acoustic-dirac-dispersion-exploration`, `fe-se-phase-exploration`, `dynamic-network-absorbing-state-exploration`, `oxide-interface-polar-discontinuity-research`, `high-pressure-phase-map-exploration`. Source-specific systems, materials, parameters, and numerical results have been removed to produce a reusable cross-domain workflow.
