---
name: sci-urban-seismic-wind-urban-flood-research-design-work-7653d59b
description: Reusable end-to-end research design workflow for generating falsifiable hypotheses, mechanism-driven studies, and iterative validation across seismic, wind, urban, and flood infrastructure domains.
scienceevolve-title: "Urban hazard resilience · seismic wind urban flood research design workflow"
scienceevolve-area: urban-hazard-resilience
---

## Purpose

Guide an agent to design end-to-end research studies across seismic, wind, urban, and flood domains by defining gaps, mapping mechanisms, generating falsifiable hypotheses, structuring controlled experiments or simulations, and iterating based on validation gates. The goal is transferable methodological design, not reproduction of specific paper conclusions.

## When to use

- When a user needs to formulate a new research question around infrastructure response to natural hazards or urban environmental drivers.
- When designing numerical, experimental, or observational studies where mechanism isolation, causal chains, and uncertainty quantification are required.
- When comparing model fidelity, input representativeness, or predictive frameworks across different hazard types or urban systems.
- When migrating a validated method from one context to a new system, site, or hazard regime and need to re-establish evidence boundaries.
- Not for generating operational engineering prescriptions, safety-critical design decisions, or executable emergency actions.

## Inputs required

- Target system definition (infrastructure type, urban domain, spatial extent, service function).
- Hazard or environmental driver characterization and available data.
- Candidate mechanism variables, mediators, or state parameters linking drivers to system response.
- Available data sources and their resolution, quality, coverage, and licensing constraints.
- Reference baselines or validated models for calibration and comparison.
- Performance or outcome variables of interest and acceptable bounds.
- Constraints: computational resources, ethical and regulatory boundaries, safety limits, and reproducibility requirements.

## Core Workflow

1. **Gap Definition & System Scoping**
   - Define the research gap by comparing existing capabilities against the target system's needs.
   - Identify whether the gap lies in driver characterization, physical mediation, system response, recovery dynamics, or validation evidence.
   - *Decision Gate DG1*: If the gap cannot be expressed as a falsifiable mechanism question, stop and refine the problem scope.

2. **Mechanism Mapping**
   - Construct a causal chain: Driver / Input → Physical Mediator / State Variable → System Response → Performance Outcome.
   - Identify candidate mediators that are closer to the mechanism than raw drivers.
   - Distinguish known mechanisms from inferred ones.
   - *Decision Gate DG2*: If the mechanism chain cannot be operationalized into observable or simulable variables, return to Step 1.

3. **Hypothesis Generation & Evidence Grading**
   - Generate 2–5 competing, falsifiable hypotheses tied to the mechanism chain.
   - For each hypothesis, assign evidence strength (High / Medium / Low / Speculative).
   - Explicitly list key assumptions, confounders, and pre-registered failure modes.
   - *Decision Gate DG3*: If no hypothesis can be invalidated by the available data or simulation capacity, redesign the study scope or variables.

4. **Study Design with Controlled Comparisons**
   - Define research units, spatial and temporal scales, and variable hierarchies (drivers, mediators, controls, outcomes).
   - Establish a minimal viable verification (MVV) set: one baseline, one independent validation path, and one negative control.
   - Design explicit controls:
     - Negative control: remove or weaken the target mechanism.
     - Positive control: scenario known to produce the target response.
     - Baseline control: simplest accepted model or historical benchmark.
     - Sensitivity control: perturb key parameters to test robustness.
   - Preset evaluation metrics spanning central tendency, uncertainty, and decision-relevant thresholds.
   - *Decision Gate DG4*: If the MVV cannot be executed within resource or safety constraints, simplify the mechanism or increase abstraction; if still infeasible, stop.

5. **Execution & Preliminary Analysis**
   - Perform data quality audits (missingness, outliers, synchronization, spatial and temporal resolution mismatches).
   - Run baseline analysis without the mediator to establish the incremental value of the mechanism chain.
   - Execute the mechanism-driven analysis and compare against controls.
   - *Decision Gate DG5*: If baseline or positive controls fail, halt execution and debug data, model setup, or metric definitions before proceeding.

6. **Uncertainty Quantification & Validation**
   - Decompose errors into input uncertainty, model structural uncertainty, parameter sensitivity, and observation error.
   - Check for confounding by alternative drivers, scale mismatches, temporal misalignment, or spatial autocorrelation.
   - Verify that results are reproducible under documented preprocessing and model versions.
   - *Decision Gate DG6*: If results are dominated by uncertainty rather than mechanism signal, or if negative controls show equivalent effects, reject the hypothesis and return to Step 3.

7. **Interpretation & Claim Bounding**
   - Classify each conclusion as: Validated, Partially Supported, Inferred, Weakened, or Rejected.
   - Explicitly separate paper-verified methods from new inferences made for the target system.
   - State extrapolation boundaries (system type, hazard intensity, scale, climate or terrain, data quality).
   - *Decision Gate DG7*: If conclusions are intended for safety-critical or operational decisions, flag for independent expert review and stop; do not proceed to generalization.

8. **Iteration or Termination**
   - **If hypothesis is supported**: Strengthen evidence by adding independent events, sites, or model fidelities; refine the mechanism chain and return to Step 4 for confirmatory study.
   - **If hypothesis is weakened**: Diagnose whether failure stems from confounding, model mis-specification, scale mismatch, or mechanism absence; return to Step 2 or 3.
   - **If hypothesis is rejected**: Narrow the research question, redefine mediators, or switch to exploratory mode; return to Step 1.
   - **Stop conditions** (terminate workflow):
     - The research question is no longer falsifiable given constraints.
     - Controls consistently fail to discriminate mechanisms.
     - Uncertainty exceeds the signal across all feasible designs.
     - Required data or validation resources are unattainable.
     - Outputs risk being misused as operational or safety-critical directives.

## Output Format

1. **Research Question**: Falsifiable question with system, mechanism, and outcome scope.
2. **Mechanism Map**: Causal chain (Driver → Mediator → Response → Outcome).
3. **Hypotheses Table**: Statements, evidence strength, key assumptions, failure modes, and minimal viable verification.
4. **Study Design**: Units, variables, controls, metrics, and stop conditions.
5. **Analysis Plan**: Data audit, baseline analysis, mechanism analysis, uncertainty decomposition, and visualization strategy.
6. **Iteration Plan**: Conditional branches for support, weakening, or rejection.
7. **Validity and Ethics Statement**: Confounders, reproducibility, extrapolation boundaries, and non-operational use restriction.

## Validation Gates

- **Falsifiability Gate**: Every hypothesis must have a defined observable or simulable condition that would invalidate it.
- **Control Discrimination Gate**: Negative and positive controls must produce distinguishable outcomes if the mechanism is active.
- **Independence Gate**: Validation data or events must be independent of calibration or training data.
- **Uncertainty Gate**: The mechanism signal must exceed combined input, model, and observation uncertainty.
- **Reproducibility Gate**: All data versions, preprocessing, model configurations, and random seeds must be documented.
- **Safety Gate**: Research outputs must not be presented as operational directives without independent expert review.

## Claim Boundaries

- Distinguish "methodologically validated in this study design" from "generalizable domain knowledge."
- Do not present single-event, single-site, or single-model results as universal laws.
- Do not use research-stage fragility, forecast, or state-parameter estimates to justify public safety, evacuation, or engineering certification decisions.
- Quantitative trends from source literature are heuristic, not transferable parameters, for new systems.

## Failure Modes

- **Mechanism Mis-identification**: The mediator is a proxy for an unmodeled confounder; addressed by negative controls and confounder stratification.
- **Scale Mismatch**: Driver, mediator, and outcome operate at incompatible resolutions; addressed by explicit scale-sensitivity testing.
- **Overfitting to Calibration**: Model fits training events but fails independent validation; addressed by temporal or spatial holdout and cross-event verification.
- **Control Failure**: Negative controls show target effects or positive controls fail; addressed by halting and debugging experimental logic.
- **Leakage**: Future information, spatial dependence, or shared data sources contaminate validation; addressed by strict data partitioning audits.
- **Misuse Risk**: Outputs are interpreted as operational prescriptions; addressed by explicit non-operational labeling and safety guardrails.

## Validity Checks

- **Confounders**: Have alternative drivers (terrain, land use, material, boundary conditions, initial damage, sensor issues) been stratified or adjusted for?
- **Scale Consistency**: Are analysis units, spatial aggregation, and temporal windows compatible across drivers, mediators, and outcomes?
- **Statistical Rigor**: Are spatial autocorrelation, multiple comparisons, sample size, and uncertainty intervals addressed?
- **Temporal Integrity**: Does data partitioning preserve causality (no future data in training or calibration)?
- **Model Scope**: Is the chosen abstraction compatible with the target system's geometry, material, and hazard regime?
- **Observation Quality**: Are instrument errors, missing channels, and spatial sampling limitations documented and bounded?
- **Extrapolation Boundary**: Are conclusions restricted to the validated hazard intensity, system type, climate or terrain, and data quality regime?

## Provenance

- Synthesized from cluster 5 / subcluster 5.0: seismic-wind-urban-flood-research-design-workflow.
- Source skills: terrain-seismic-resilience-exploration; damaged-structure-digital-twin-shm-research; urban-flood-traffic-impact-workflow; complex-terrain-wind-research-design; seismic-component-fragility-workflow; urban-wind-thermal-scale-research; residential-seismic-isolation-research-workflow; hybrid-hydrologic-forecasting-research.
- Methodological patterns were abstracted from 33 candidate papers; no specific numerical results, material parameters, or operational protocols are retained.
