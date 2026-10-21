---
name: sci-cosmology-observable-driven-mechanism-discovery-wor-7096c8ae
description: A reusable end-to-end workflow for turning observable gaps into testable mechanism hypotheses, validating them through controlled multi-source analysis and simulation, and iterating until claims are bounded by evidence.
scienceevolve-title: "Galaxy, cosmology, and simulations · observable driven mechanism discovery workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

## Purpose

Use this skill to transform an observable gap or tension into a disciplined, reproducible research plan for discovering and validating latent mechanisms. It guides an agent through hypothesis generation, controlled validation design, multi-source analysis, simulation-based calibration, and iterative claim bounding—without reproducing any single study's specific parameters or conclusions.

## When to use

Trigger this skill when the user needs to:

- Propose new research questions where the signal is embedded in noisy, incomplete, or high-dimensional observational or simulation data.
- Design a discovery workflow for latent structures, populations, or physical mechanisms inferred from survey, imaging, spectral, or simulation outputs.
- Build a validation plan that separates true signals from artifacts, selection effects, projection, or background contamination.
- Compare candidate mechanisms using multiple independent diagnostics, tracers, or simulated ground truth.
- Iterate on evidence strength and bound claims when initial results are ambiguous or model-dependent.

Do not use this skill as a substitute for instrument operations, raw data reduction pipelines, or confirmed physical interpretation. It is intended for research design, evidence planning, and mechanism discrimination.

## Inputs required

Before generating a plan, collect or infer:

- **Target phenomenon**: the latent mechanism, population, or structure to be tested.
- **Observable gap**: what current data or methods cannot resolve and why it matters.
- **Data context**: available data types, coverage, calibration status, known masks, completeness, and quality limitations.
- **Inferred variables**: latent quantities used to organize the search (e.g., membership probabilities, distances, mass proxies, environmental labels).
- **Uncertainty model**: known error sources, catastrophic failures, template assumptions, and boundary regimes.
- **Existing evidence**: prior catalogs, simulations, literature benchmarks, or independent-method results.
- **Scientific use case**: whether the goal is discovery, population characterization, completeness estimation, method comparison, or simulation calibration.

If any input is missing, state the missing information and propose the minimum evidence needed to proceed.

## Core Workflow

Follow this ordered route. Do not skip decision gates.

1. **Gap Definition & Observable Audit**
   - Frame the scientific question as a measurable gap between expected and observed behavior.
   - Inventory all available data layers, inferred variables, and known systematic limitations.
   - **Decision gate**: If the gap cannot be expressed as a quantitative observable difference or excess, stop and reformulate the question.

2. **Hypothesis Generation**
   - Formulate a primary mechanism hypothesis, at least one confounding hypothesis, and at least one alternative mechanism.
   - For each, state the expected signature, key assumptions, likely failure modes, and evidence strength (strong / moderate / weak / speculative).
   - **Decision gate**: If no hypothesis is falsifiable with available or attainable data, stop and identify required new data or methods.

3. **Study Design & Control Architecture**
   - Define the target population or signal class by observable selection criteria, not by the desired conclusion.
   - Specify positive controls, negative controls, random or synthetic controls, and cross-method controls.
   - Define minimal viable validation and explicit stop conditions before analysis begins.
   - **Decision gate**: If no negative or synthetic control can be constructed, downgrade the study to hypothesis generation only and flag the limitation.

4. **Data Preparation & Latent-Space Construction**
   - Document data versions, calibration states, masks, and completeness.
   - Convert observations into the latent representation used for discovery, preserving uncertainty and avoiding overconfident labels.
   - **Decision gate**: If data quality in the target regime is insufficient to support the designed controls, narrow the scope or stop.

5. **Candidate Generation & Primary Analysis**
   - Apply pre-registered search criteria to identify candidate signals, structures, or excesses.
   - Keep raw observables separate from model-derived quantities.
   - **Iteration gate**: If candidates are unstable under reasonable threshold, slicing, or background changes, revisit the latent-space construction or background model before proceeding.

6. **Controlled Validation**
   - Run internal stability tests across parameters, thresholds, and sub-samples.
   - Execute controls: random or negative to estimate false positives; positive to verify recovery; independent method or simulation to test robustness.
   - Quantify completeness, contamination, and selection effects using simulated or synthetic ground truth when available.
   - **Decision gate**: If negative controls produce comparable signals, classify the result as artifact-prone and stop or redesign.
   - **Decision gate**: If positive controls fail, troubleshoot calibration or pipeline before interpreting candidate results.

7. **Mechanism Discrimination**
   - Compare competing hypotheses using secondary diagnostics, independent tracers, or orthogonal data layers.
   - Assess physical consistency and cross-band or cross-model agreement.
   - **Decision gate**: If multiple mechanisms remain indistinguishable, flag the degeneracy, weaken the interpretation, and propose a targeted follow-up test.

8. **Uncertainty Audit & Selection Correction**
   - Propagate uncertainties from raw measurements through inferred variables to derived quantities.
   - Apply selection or completeness corrections only after validating them on simulated data.
   - **Decision gate**: If corrections are unstable, untested, or dominate the signal, restrict claims to the uncorrected or validated regime only.

9. **Claim Bounding & Iteration Planning**
   - Grade confidence for each conclusion: confirmed, candidate, or speculative.
   - Document boundary conditions, assumptions, and residual failure modes.
   - Decide whether to strengthen, narrow, revise, or stop based on the validation outcome.
   - **Stop condition**: Stop if minimal validation repeatedly fails, if claims require unsupported extrapolation, or if the target regime lies outside the validated data range.

## Output Format

When using this skill, produce:

1. **Trigger summary** — Why this skill applies and what gap is being addressed.
2. **Research question** — A concise, testable question.
3. **Hypotheses** — Ranked list with evidence strength, key assumptions, predicted signatures, and failure modes.
4. **Study design** — Selection criteria, control architecture, minimal viable validation, metrics, and stop conditions.
5. **Analysis plan** — Data preparation, latent-space construction, candidate generation, validation steps, and uncertainty propagation.
6. **Iteration plan** — How hypotheses and design change under different validation outcomes.
7. **Validity and ethics notes** — Confounders, reproducibility requirements, boundary conditions, and claim limits.
8. **Next actions** — The smallest defensible next step for evidence gathering or follow-up planning.

## Validation Gates

Apply these criteria before advancing past each major stage:

- **Gap clarity**: The question is framed as a quantitative observable difference, not a vague conceptual gap.
- **Falsifiability**: At least one hypothesis can be weakened or rejected with the planned data.
- **Control feasibility**: Positive and negative controls are defined and achievable.
- **Stability**: Preliminary results are not dominated by threshold, binning, or background variations.
- **Calibration**: Simulated or synthetic validation supports the intended inference in the target regime.
- **Independence**: Key claims do not rest on a single inferred variable, uncalibrated proxy, or one data layer.

## Claim Boundaries

- Treat candidate detections or inferred structures as provisional until independent validation is achieved.
- Do not present single-catalog, single-method, or single-simulation results as field-wide consensus.
- Distinguish directly observed quantities from model-derived quantities and from speculative interpretations.
- Avoid extrapolating scaling relations, calibrations, or selection corrections beyond their validated domain.
- Do not equate cross-method overlap with absolute truth; treat agreement as increased reliability, not proof.

## Failure Modes

Watch for these common failure modes and respond by stopping or redesigning:

- **Artifact dominance**: The signal disappears or becomes comparable to negative controls.
- **Single-proxy dependency**: The conclusion relies on one uncalibrated inferred variable or tracer.
- **Calibration artifact**: Environmental drift, instrumental variation, or model mismatch explains the result.
- **Projection or contamination**: Line-of-sight confusion, background density, or unrelated populations mimic the target signal.
- **Overfitting**: A model matches one observable while failing independent constraints.
- **Instability**: Results change qualitatively under plausible alternative assumptions, masks, or parameter choices.
- **Extrapolation error**: Claims extend beyond the validated parameter range of the data or simulation.

## Validity Checks

Before finalizing the research plan, verify:

- **Confounding**: Have projection, completeness, selection, background, and catastrophic-error sources been explicitly modeled or flagged?
- **Reproducibility**: Are data versions, masks, thresholds, random seeds, analysis code, and exclusion rules documented?
- **Statistical validity**: Are random baselines defined before interpreting excesses? Is uncertainty propagated through all inferred stages? Are confidence grades aligned with evidence strength?
- **Boundary conditions**: Are coverage-edge regions, low-leverage ranges, and resolution limits flagged?
- **Alternative explanations**: Has at least one plausible competing mechanism been formally tested?
- **Scope discipline**: Are claims limited to the validated population, observable regime, and summary statistic?

## Provenance

This skill was synthesized from cluster 16.0 (observable-driven mechanism discovery and validation) of the scientific skills codex. It merges common workflow structure from the following source skills:

- `astronomy-cluster-candidate-workflow`
- `xray-group-research-workflow`
- `terahertz-research-workflow-design`
- `redshift-survey-group-discovery`
- `high-energy-astrophysics-capability-exploration`
- `calibrated-subgrid-galaxy-simulation`
- `high-redshift-dusty-galaxy-multi-tracer-exploration`
- `tracer-census-galaxy-research-design`
