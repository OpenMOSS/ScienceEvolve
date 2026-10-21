---
name: sci-urban-seismic-wind-response-discontinuity-mechanism-7abba18e
description: Design reusable, mechanism-driven research workflows for dynamic systems where hidden asymmetries, discontinuities, or coupled interactions govern response, guiding hypothesis generation, controlled validation, multi-domain analysis, and iterative claim bounding.
scienceevolve-title: "Urban hazard resilience · seismic wind response discontinuity mechanism discovery workflow"
scienceevolve-area: urban-hazard-resilience
---

## Purpose

Use this skill to turn observations of unexpected or anomalous dynamic response into structured, reusable research workflows. The goal is to discover, discriminate, and validate mechanisms—such as hidden asymmetries, stiffness or mass discontinuities, coupled subsystem interactions, or uncontrolled input properties—that may alter load paths, energy distribution, or local demand in systems subjected to seismic, wind, wave, or other dynamic excitation.

## When to use

Use this skill when the user asks to:
- Generate research questions about dynamic response anomalies, irregularities, or scale mismatches in structural, geotechnical, fluid-structure, or atmospheric systems.
- Design controlled numerical or experimental studies to isolate a candidate mechanism.
- Compare baseline and perturbed configurations across multiple realistic scenarios, domains, or metrics.
- Diagnose whether observed response patterns stem from discontinuities, coupling paths, hidden input properties, or model artifacts.
- Iterate on hypotheses after model-data mismatch, unexpected sensitivity, or non-convergent evidence.

Do not use this skill for operational engineering design, construction prescriptions, retrofit implementation, code compliance checking, or site-specific safety decisions.

## Inputs required

- **Target system class**: structural, geotechnical, marine, atmospheric, or coupled dynamic system, including relevant subsystem boundaries.
- **Candidate overlooked feature**: asymmetry, discontinuity, coupling path, hidden input property, secondary component, or modeling simplification suspected to influence response.
- **Research objective**: mechanism discovery, model validation, sensitivity ranking, hypothesis testing, or scenario comparison.
- **Available evidence**: literature context, prior simulations, benchmark data, observations, or monitoring records.
- **Modeling context**: appropriate abstraction level, domain conventions, and whether linear, nonlinear, static, spectral, or time-domain methods are suitable.
- **Evaluation priorities**: global versus local metrics, kinematic versus load quantities, multi-domain diagnostics, and functional performance thresholds.
- **Constraints**: computational or experimental budget, data availability, safety boundaries, reproducibility expectations, and generalization targets.

## Core Workflow

Follow this ordered end-to-end route. Do not skip decision gates.

### 1. Frame the system and identify the gap
- Define the system boundary and separate subsystems (e.g., structure, substrate, fluid, restraint, input).
- Identify the modeling simplification, symmetry assumption, or hidden property that existing analyses may overlook.
- State why the gap matters for the observed or hypothesized response.

### 2. Generate mechanism-linked hypotheses
- Map candidate mechanisms to physical variables: stiffness redistribution, mass participation, damping, energy localization, load-path change, phase effects, or coupling exchange.
- For each hypothesis, specify:
  - Expected response signature.
  - Evidence strength (strong / moderate / weak / speculative).
  - Key assumptions.
  - Likely failure modes.
  - Minimal validation required.
- Rank hypotheses by decisiveness: prefer those falsifiable with a small set of orthogonal metrics.

### 3. Design controlled comparisons
- Build a configuration matrix:
  - **Baseline**: common simplification or nominal case.
  - **Perturbation**: mechanism activated, included, or varied.
  - **Strong controls**: cases expected to amplify or suppress the mechanism.
  - **Negative controls**: mechanism absent or minimized.
  - **Positive / benchmark controls**: recognized reference when available.
- Select independent variables, dependent variables, and confounding variables.
- Define primary and secondary metrics: include at least one global, one local/concentration, and one model-validation metric.
- **Decision Gate 1 — Comparability & Control Adequacy**: Confirm that compared cases differ only in the intended mechanism factor, that controls are sufficient to isolate it, and that metrics are defined before running cases. If not, redesign the matrix.

### 4. Execute minimal viable validation
- Verify baseline stability, physical plausibility, and reproducibility.
- Run the smallest set of cases that can falsify the leading hypothesis.
- Document model assumptions, input definitions, comparison windows, and post-processing rules.
- **Decision Gate 2 — Baseline & Control Sanity**: Baseline behavior must match independent estimates or benchmarks; controls must show expected sensitivity or insensitivity. If controls fail, stop and fix the validation chain before interpreting new configurations.

### 5. Collect multi-domain evidence
- Gather response evidence across relevant domains:
  - Time-domain: amplitude, phase, cumulative trends.
  - Frequency-domain: spectral peaks, modal participation, predominant frequencies.
  - Spatial domain: global patterns versus local concentrations, asymmetry maps.
  - Load/motion domain: kinematic quantities and corresponding force, stress, or energy metrics.
- Ensure monitoring or extraction locations capture both system-wide behavior and candidate hotspots.

### 6. Discriminate mechanisms through cross-domain synthesis
- Triangulate: require consistent support from multiple independent metrics before accepting a mechanism.
- Compare perturbation cases against controls; attribute differences only when controls behave as expected.
- Separate longitudinal, transverse, and depth-wise effects; distinguish geometry-driven from forcing-driven patterns.
- **Decision Gate 3 — Mechanism Convergence**: Accept a mechanism only when time-domain, frequency-domain, spatial, and load/motion indicators converge, or when contradictions are explained. If evidence is single-metric or single-location, weaken or reject the hypothesis.

### 7. Probe robustness and scenario dependence
- Vary the most influential assumptions one at a time: loading scenario class, directionality, boundary conditions, or model abstraction.
- Identify performance plateaus, cliffs, and non-monotonic behavior.
- Check whether conclusions hold across scenario classes or are limited to a narrow regime.
- **Decision Gate 4 — Stability & Generalization**: Results must be stable under reasonable sensitivity checks to support broad claims. If unstable, narrow the claim boundary or redesign the test.

### 8. Bound claims and plan next iteration
- Classify each conclusion as:
  - Directly supported by current evidence.
  - Conditionally supported with stated boundaries.
  - Unsupported or contradicted.
- Update the mechanism model and evidence strength.
- Define stop conditions:
  - Controls fail or are missing.
  - Results depend on undocumented assumptions.
  - Numerical or experimental artifacts dominate.
  - The mechanism is supported only by a single metric or single scenario.
  - Further study would require unsafe or non-reproducible operations.
- If stopping, deliver the current claim boundary and residual uncertainty. If continuing, return to Step 2 with refined hypotheses.

## Output Format

When using this skill, produce:

1. **Research question and gap statement**: the overlooked feature and why it matters.
2. **Mechanism model**: causal chain linking the hidden feature to response variables.
3. **Ranked hypothesis table**: hypothesis, expected signature, evidence strength, key assumptions, likely failure modes, and minimal validation.
4. **Controlled study plan**: configuration matrix, variables, controls, metrics, and stop conditions.
5. **Multi-domain analysis plan**: time-domain, frequency-domain, spatial, and load/motion diagnostics; normalization and visualization rules.
6. **Iteration roadmap**: decision rules for supported, partial, unsupported, and inconclusive outcomes.
7. **Validity and boundary notes**: confounders, reproducibility requirements, generalization limits, and non-operational safety boundaries.

## Validation Gates

| Gate | Criterion | Action if failed |
|------|-----------|------------------|
| **Gate 1: Comparability & Control Adequacy** | Cases differ only by the intended mechanism factor; controls can isolate it; metrics are pre-defined. | Redesign configuration matrix. |
| **Gate 2: Baseline & Control Sanity** | Baseline matches independent estimates; controls show expected sensitivity/insensitivity. | Stop; fix model, inputs, or post-processing. |
| **Gate 3: Mechanism Convergence** | Multiple independent metrics and domains support the same mechanism. | Weaken claim; add ablation or refine hypothesis. |
| **Gate 4: Stability & Generalization** | Conclusions hold across sensitivity checks and multiple scenario classes. | Narrow claim boundary; collect more evidence. |

## Claim Boundaries

- **Paper-supported**: Methodological logic or principles derived from reviewed source evidence.
- **Method-supported**: Claims justified by the analytical or numerical method itself, independent of a specific application.
- **Model-inferred**: Findings derived from the current model or dataset under stated assumptions.
- **Speculative**: Extensions to new system classes, loading regimes, or scales without direct supporting evidence.

Always label the provenance tier of each claim. Do not generalize results from one structural class, geometry, scenario set, or model abstraction to another without targeted validation.

## Failure Modes

- **Control failure**: Negative controls show the target signature, or positive controls fail, indicating confounding or artifact.
- **Confounding by hidden variables**: Geometry, boundary conditions, loading direction, mass distribution, or model abstraction explains the response instead of the proposed mechanism.
- **Single-metric dependence**: A mechanism is accepted based on one response quantity or one location without cross-domain triangulation.
- **Artifact dominance**: Numerical instability, mesh distortion, boundary effects, or signal-processing artifacts masquerade as physical mechanisms.
- **Overgeneralization**: Findings from a narrow model class or scenario are applied broadly without robustness checks.
- **Premature stopping**: Validation halts before controls are verified because early results appear promising.

## Validity Checks

- **Confounding factors**: Audit geometry, symmetry, mass/stiffness distribution, damping, boundary conditions, loading direction, scenario selection, and model abstraction.
- **Reproducibility**: Record model version, input assumptions, scenario definitions, metric definitions, sensitivity cases, and post-processing scripts.
- **Numerical validity**: Check convergence, conservation, equilibrium reasonableness, mesh or discretization sensitivity, and stability indicators.
- **Statistical validity**: Use repeated or scenario-based comparisons; report dispersion, uncertainty ranges, and confidence indicators when appropriate.
- **Boundary conditions**: State whether conclusions apply only to the tested system class, model abstraction, loading regime, or scenario set.
- **Consensus discipline**: Treat individual studies as single evidence sources, not field-wide consensus.
- **Research-design boundary**: Keep outputs at the level of hypothesis generation, experiment planning, and evidence interpretation.

## Provenance

Synthesized from cluster 15.1 (symmetry-guided mechanism discovery and validation). Source skills: `structural-dynamics-stiffness-discontinuity-exploration`, `seismic-tunnel-research-design`, `urban-canopy-les-research-workflow`, `discontinuity-dynamic-response-research`, `directional-seismic-assessment-research`, `coupled-floating-marine-systems-exploration`, `seismic-sequence-input-bias-workflow`, `seismic-response-mitigation-research-workflow`.
