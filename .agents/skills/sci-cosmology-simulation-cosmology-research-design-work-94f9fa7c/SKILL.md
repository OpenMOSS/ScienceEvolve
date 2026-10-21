---
name: sci-cosmology-simulation-cosmology-research-design-work-94f9fa7c
description: End-to-end research design workflow for simulation-driven cosmological and astrophysical inquiry, from falsifiable hypothesis generation through controlled numerical experimentation, multi-scale validation, and iterative refinement.
scienceevolve-title: "Galaxy, cosmology, and simulations · simulation cosmology research design workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

# Purpose

Help agents translate observational tensions, theoretical gaps, or model uncertainties into structured, reproducible simulation research programs. This skill covers the full lifecycle from question formulation to iterative validation, without prescribing specific simulation codes, physical parameters, numerical recipes, or paper conclusions.

# When to use

Use this skill when:
- A user needs to design simulation experiments to test astrophysical or cosmological mechanisms, sub-grid models, numerical methods, or analysis pipelines.
- A user needs to isolate causal physical signals from numerical artefacts, implementation details, or post-processing biases via controlled comparisons.
- A user needs an iterative research plan with explicit stop conditions, failure modes, and redesign rules.
- A user needs to compare multiple models, codes, or resolutions while keeping initial conditions, physics modules, or analysis workflows aligned.

Do not use this skill when:
- The task is pure observational analysis with no simulation or mechanistic modeling component.
- The task is limited to software usage instructions, performance tuning, or code implementation without a research question.
- The task requires treating a single paper’s results as field consensus or mechanically transplanting one system’s parameters to another.

# Inputs required

Gather the following before starting:

- **Research target**: The phenomenon, observable proxy, or theoretical tension to be explained or tested.
- **Available benchmarks**: Observational constraints, analytic limits, prior simulations, emulators, or public data products.
- **Candidate mechanisms/models**: Physical models, numerical methods, sub-grid prescriptions, coupling strategies, or analysis choices under consideration.
- **Evaluation goals**: Scientific discriminators, numerical error tolerances, convergence criteria, reproducibility standards, and computational cost limits.
- **Constraints**: Available compute budget, time window, data licenses, code modifiability, reproducibility requirements, and ethical or access boundaries.
- **Known risks**: Suspected numerical instabilities, resolution sensitivities, initial-condition degeneracies, selection-function biases, or post-processing artefacts.

# Core Workflow

Follow this ordered route. At each decision gate, stop and redesign if the condition is not met.

1. **Gap Definition & Question Formulation**
   - Map the observational or theoretical tension to a specific, computable question.
   - Frame the question as: “If we change X (physical mechanism, numerical treatment, or model assumption), does Y (observable proxy or numerical behavior) change in a detectable way?”
   - **Gate**: Is the question falsifiable via simulation? If no, reformulate until a negatable prediction exists.

2. **Hypothesis Generation**
   - Derive candidate hypotheses from the gap. Each hypothesis must include:
     - A mechanism statement linking X to Y.
     - A falsifiable prediction that can be negated by simulation or analysis.
     - Evidence strength (high / medium / low) with justification.
     - Key assumptions and known failure modes.
   - Prioritize hypotheses that improve scientific discrimination, numerical interpretability, and reproducibility.
   - Avoid changing multiple mechanisms or implementation layers simultaneously; if combination is necessary, plan ablation experiments.
   - **Gate**: Does every hypothesis have at least one negatable prediction and a defined failure mode? If no, refine before proceeding.

3. **Experimental Design**
   - Define the experimental unit: simulation object, physics set, numerical configuration, run environment, and post-processing pipeline.
   - Specify variables:
     - **Independent**: Mechanism, model, coupling strategy, resolution, or algorithm under test.
     - **Dependent**: Scientific metrics, numerical error estimates, conservation diagnostics, statistical distributions, and computational cost.
     - **Confounders**: Initial conditions, boundary conditions, resolution, time-stepping, grid/particle sampling, hardware backend, floating-point behavior, and post-processing thresholds.
   - Establish controls:
     - **Baseline**: Current standard or project-internal reference.
     - **Negative**: Remove or disable the target effect to confirm the observed change is causal.
     - **Positive**: Use a known recoverable scenario to confirm the pipeline can detect the expected signal.
     - **Numerical/implementation**: Vary resolution, discretization, or coupling order to check for artefact-driven signals.
     - **Observational/analysis**: Vary selection functions, noise models, or post-processing pipelines to check for analysis-driven conclusions.
   - **Gate**: Can a minimum viable experiment isolate the target mechanism before committing to full-scale cost? If no, redesign using reduced physics, smaller volume, coarser resolution, or proxy metrics.

4. **Minimum Viable Validation (MVV)**
   - Execute the cheapest experiment that can test core detectability: reduced scale, simplified physics, or proxy observable.
   - Verify conservation, stability, basic physical consistency, and reproducibility.
   - Compare against negative and positive controls.
   - **Gate**: Does the MVV detect the expected signal above noise and artefact levels? If no, stop. Revisit the hypothesis, check for confounders, or redesign the control structure before scaling up.

5. **Execution & Data Governance**
   - Run the experiment matrix while recording:
     - Input files, code versions, build environments, dependencies.
     - Random seeds, initial conditions, boundary conditions, parameter files.
     - Run logs, output timestamps, and post-processing script versions.
   - Preserve the full chain from raw outputs to derived quantities to figures.

6. **Multi-Scale Analysis**
   - **Quality checks**: Inspect conservation laws, boundary behavior, monotonicity, outliers, missing fields, and statistical plausibility.
   - **Convergence & error decomposition**: Separate errors due to initial conditions, physical approximations, numerical discretization, sampling, grid hierarchy, and post-processing choices. Use resolution or model ablation to judge signal robustness.
   - **Statistical validation**: Report distributions, confidence ranges, effect sizes, and rankings. Guard against multiple-comparison bias. If statistical power is insufficient, downgrade conclusions to “trend” or “preliminary.”
   - **Performance analysis**: Interpret run time, memory, communication, and I/O costs alongside scientific gain. If performance optimizations affect results, verify via numerical controls that conclusions remain unchanged.
   - **Gate**: Are results robust across multiple metrics and control conditions? If a result depends on a single metric, resolution, or post-processing threshold, halt interpretation and flag as sensitive.

7. **Evidence Interpretation & Classification**
   - Classify each hypothesis:
     - **Supported**: Signal stable, controls behave as expected, errors are bounded.
     - **Partially supported**: Direction correct but effect weak, setting-dependent, or evidence insufficient.
     - **Not supported**: Core prediction fails; diagnose whether the cause is physical, numerical, or implementation-related.
     - **Undetermined**: Experiment failed to isolate variables, statistical power is inadequate, or post-processing bias is too large.
   - Explicitly distinguish:
     - Outcomes verified by the current experiment.
     - Inferences drawn from external literature or benchmarks.
     - Extrapolations beyond the tested regime.

8. **Iteration or Redesign**
   - **Supported**: Expand to larger scales, stronger observational comparisons, cross-code validation, or independent replication.
   - **Partially supported**: Add ablation studies, refine measurement, tighten controls, or test alternative proxies.
   - **Not supported**: Design a follow-up experiment that can distinguish physical hypothesis failure from numerical or implementation failure.
   - **Undetermined**: Reduce confounders, increase statistical power, or switch to a cheaper proxy experiment.
   - **Stop conditions** — halt and do not scale further when:
     - Unphysical results or gross conservation violations appear.
     - Results are irreproducible under fixed inputs and versions.
     - Numerical instability dominates the signal.
     - The MVV cannot distinguish candidate mechanisms.
     - Computational cost exceeds available budget without high-value intermediate results.
     - Conclusions are driven entirely by post-processing thresholds or analysis choices.

# Output Format

Each invocation should produce:

1. **Research question** — One-sentence definition tied to an observational or theoretical tension.
2. **Scope and assumptions** — Applicable systems, key assumptions, and explicit boundaries.
3. **Evidence gap** — Existing evidence, identified gaps, and parts that cannot be mechanically reused from prior studies.
4. **Hypotheses** — Table with: hypothesis statement, mechanism path, evidence strength, key assumptions, falsifiable predictions, and failure modes.
5. **Experimental design** — Independent/dependent variables, confounders, baseline/negative/positive/numerical/observational controls, MVV plan, and stop conditions.
6. **Evaluation metrics** — Scientific, numerical, computational, and decision criteria.
7. **Analysis plan** — Data governance, quality checks, convergence analysis, statistical comparison, visualization, and performance analysis.
8. **Iteration plan** — Update rules for supported, partially supported, unsupported, and undetermined outcomes.
9. **Validity and safety notes** — Confounders, reproducibility requirements, ethical/compliance boundaries, and extrapolation limits.

# Validation Gates

Before treating any result as evidence, confirm:

- **Confounder isolation**: Initial conditions, resolution, boundaries, time-stepping, sampling, coupling order, hardware backend, and post-processing choices are controlled or their influence is bounded.
- **Reproducibility**: Fixed inputs and documented versions must reproduce key conclusions; if floating-point non-determinism exists, report the variance range.
- **Statistical validity**: Sample size, parameter scans, repeated runs, or error estimates must support the claimed effect; guard against selective significance from multiple comparisons.
- **Numerical validity**: Conservation, stability, convergence trends, discretization error, and grid/particle sampling dependence must be checked for key metrics.
- **Scientific boundary**: State the applicable scale range, physics regime, observational selection function, missing processes, calibration limits, and extrapolation risk.

# Claim Boundaries

- Never present single-simulation, single-code, or single-paper results as field consensus.
- Clearly separate outcomes verified by the current experiment from literature-based inferences and from extrapolations to new regimes.
- State all model assumptions, missing physics, and calibration data limitations.
- Report uncertainty transparently; do not package simulation outputs as deterministic facts about the physical universe.

# Failure Modes

Watch for these common failure patterns:

- **Confounding**: The apparent signal is driven by resolution, initial conditions, boundaries, or analysis choices rather than the target mechanism.
- **Artefact misattribution**: Numerical noise, grid effects, particle sampling bias, or post-processing thresholds are interpreted as physical effects.
- **Overfitting via tuning**: Parameters are adjusted to match a single benchmark without independent validation or cross-check.
- **Irreproducibility**: Results cannot be replicated because seeds, versions, environments, or post-processing steps are undocumented.
- **Premature scaling**: Costly large-scale runs are launched before MVV confirms signal detectability and control integrity.
- **Selective reporting**: Only metrics or subsamples supporting the hypothesis are reported, while contradictory indicators are omitted.

# Validity Checks

Use this checklist before finalizing conclusions:

- Have all confounders been listed, and either controlled or bounded with sensitivity analysis?
- Can the key result be reproduced from the recorded inputs, code version, and environment?
- Is the statistical power (sample size, repeats, parameter coverage) sufficient for the claimed effect?
- Do key metrics show convergence or stability with respect to resolution, sampling, or discretization changes?
- Are conclusions explicitly limited to the tested parameter range, scale, and physics regime?
- Did negative controls and numerical controls behave as expected?
- Is every claim’s provenance traced to either the current experiment or an independently validated external source?

# Provenance

- Methodology synthesized from cluster `26.0` (`simulation-cosmological-cosmology-galaxy-research-design-workflow`).
- Source-skill references: `10.21105_joss.03068` (computational-cosmology-amr-research), `10.21105_joss.01370` (amr-framework-research-design), `10.3390_biomimetics9030137` (human-inspired-metaheuristic-optimization), `10.5167_uzh-129935` (galaxy-simulation-comparison-workflow), `10.1088_1475-7516_2023_06_003` (cosmological-neutrino-simulation-research-workflow), `10.1093_mnras_stab2556` (galaxy-halo-assembly-bias-exploration), `10.1093_mnras_staa623` (halo-assembly-bias-research-workflow), `10.3389_fspas.2026.1760522` (computational-astrophysics-fair-reproducible-workflow).
- No specific paper conclusions, numerical parameters, operational recipes, or fabrication details are inherited.
