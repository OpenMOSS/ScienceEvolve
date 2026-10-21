---
name: sci-cosmology-cosmological-simulation-validation-workfl-10c117ca
description: Reusable end-to-end workflow for hypothesis-driven cosmological simulation design, multi-scale validation, and iterative evidence grading.
scienceevolve-title: "Galaxy, cosmology, and simulations · cosmological simulation validation workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

# Purpose

Help agents translate complex, multi-scale cosmological and astrophysical problems into structured, falsifiable research programs. This workflow guides hypothesis generation, controlled numerical experiment design, layered validation, and iterative refinement while maintaining strict boundaries between verified evidence, model inference, and speculation.

# When to use

Trigger this skill when:
- A user needs to propose new research questions in cosmological structure formation, galaxy formation, dark matter dynamics, or large-scale structure modeling.
- A user needs to design numerical experiments, simulation campaigns, or semi-analytic studies to test physical mechanisms.
- A user needs to validate multi-physics couplings, effective models, or subgrid approximations against benchmarks or observations.
- A user needs to iterate on model–observation mismatches or baseline model failures.

Do not use for:
- Simple paper summaries, literature reviews, or terminology explanations.
- Direct operational execution recipes, code-specific run commands, or hardware configuration.
- Tasks that treat a single paper’s numerical results as domain consensus.

# Inputs required

Before starting, obtain or clarify:
- **Target phenomenon**: The scientific gap, observational anomaly, or theoretical tension to be addressed.
- **Baseline model**: The existing model, simulation framework, or theoretical prediction that exhibits the gap.
- **Physical scope**: Conceptual list of relevant processes (e.g., gravitational evolution, fluid dynamics, radiative processes, feedback) and their expected coupling.
- **Diagnostic targets**: Quantities, statistics, or morphological features used to judge success or failure.
- **Validation resources**: Available benchmarks, analytic limits, independent datasets, or alternative implementations for cross-checking.
- **Feasibility boundaries**: Conceptual computational limits, scale ranges, and resolution regimes relevant to the question.

# Core Workflow

Execute the following steps in order. At each decision gate, stop or loop back as indicated.

## 1. Problem definition and baseline gap identification
State the target phenomenon, the baseline model’s regime of applicability, and the specific gap (e.g., systematic deviation, unresolved scale, missing coupling). Define the physical and numerical boundaries of the study.

> **Decision Gate 1**: If the gap cannot be expressed as a falsifiable difference between a baseline prediction and an observable/diagnostic target, stop and reformulate the problem.

## 2. Mechanism decomposition and hypothesis generation
Decompose the gap into candidate mechanism categories (e.g., source properties, transport effects, feedback coupling, numerical resolution, approximation limits). For each candidate, generate a falsifiable hypothesis that specifies:
- The mechanism,
- A directional prediction for at least one primary diagnostic and one secondary diagnostic,
- Evidence strength (Strong / Medium / Weak / Speculative),
- Key assumptions,
- Explicit failure modes (e.g., closure breakdown, resolution sensitivity, confounding by boundary effects).

> **Decision Gate 2**: If a hypothesis cannot be linked to a negative control or lacks a diagnostic that would falsify it, return to decomposition.

## 3. Minimal viable validation design
Design the simplest experiment (component test, idealized geometry, or constrained realization) capable of falsifying the leading hypothesis. Specify:
- **Independent variables**: Mechanism switches, approximation levels, or physical parameters.
- **Dependent variables**: Target diagnostics and intermediate mechanism variables.
- **Controls**: Baseline, positive control (known signal), negative control (signal absent), strong control (benchmark comparison), and stress control (approximation pushed to expected failure).
- **Metrics**: Physical accuracy, numerical convergence, statistical stability, and computational feasibility.
- **Stop conditions**: Conservation failure, benchmark disagreement beyond declared uncertainty, signal smaller than numerical noise, or confounding by boundary/initialization effects.

> **Decision Gate 3**: If the minimal test is infeasible under current constraints, scope down the hypothesis or pivot to a better-constrained mechanism.

## 4. Layered execution and quality screening
Execute tests in layers:
1. Component/module tests,
2. Coupled tests with reduced complexity,
3. Realistic or production-scale tests.

Before interpreting any scientific result, perform quality screening:
- Conservation and symmetry checks,
- Resolution and timestep convergence trends,
- Boundary and initialization artifact scans,
- Numerical stability and output integrity checks.

> **Stop condition**: If quality screening fails and the failure cannot be attributed to a declared approximation limit, halt scientific interpretation and return to Step 3.

## 5. Signal-versus-artifact analysis
Separate physical signals from numerical artifacts by:
- Comparing multiple resolutions or discretizations,
- Varying boundary conditions or domain geometry,
- Testing alternative coupling strategies or approximation levels,
- Decomposing contributions by mechanism channel.

> **Decision Gate 4**: If the target signal disappears or reverses under convergence or alternative numerical treatment, classify it as a numerical artifact and return to Step 2.

## 6. Independent verification and cross-diagnostic check
Validate findings against:
- Analytic limits or standard benchmarks,
- Independent codes, datasets, or realizations,
- Multiple diagnostics (field quantities, statistical distributions, temporal evolution, performance profiles).

Check mechanism specificity by removing the candidate mechanism and confirming the effect vanishes or changes as predicted.

> **Decision Gate 5**: If independent verification fails or mechanism specificity is not demonstrated, downgrade the evidence strength and return to Step 3 or 2.

## 7. Evidence grading and boundary declaration
Classify each hypothesis as:
- **Supported**: Consistent across controls, resolutions, and independent checks.
- **Weakly supported**: Directionally consistent but with residual dependencies or limited cross-checks.
- **Not supported**: Contradicted by controls, convergence tests, or independent verification.
- **Unresolved**: Insufficient data or blocked by resource limits.

Explicitly declare applicability boundaries:
- Validated scale ranges, redshifts, and physical regimes,
- Resolution and approximation limits,
- Module coupling assumptions.

Distinguish:
- Verified patterns from source literature,
- Inferences drawn in the current task,
- Speculative extensions requiring future validation.

## 8. Iteration or termination
- **If Supported**: Expand to broader parameter ranges, larger samples, or additional observables; update the baseline model.
- **If Weakly supported**: Refine the hypothesis, tighten controls, and run targeted follow-up tests; return to Step 3.
- **If Not supported**: Reject or archive the hypothesis and return to Step 2 to explore alternatives.
- **If Unresolved**: Document blocking factors and stop; do not extrapolate.

# Output Format

Produce a structured report containing:

1. **Research Problem & Baseline Gap**: Phenomenon, baseline model, and falsifiable gap statement.
2. **Hypothesis Table**: For each hypothesis—statement, mechanism chain, directional prediction, evidence strength, key assumptions, and failure modes.
3. **Experiment Design**: Layered test plan with variables, controls, metrics, and stop conditions.
4. **Validation Summary**: Quality screening results, convergence behavior, independent verification outcomes, and mechanism specificity checks.
5. **Evidence Grading & Conclusion Boundaries**: Graded conclusions with explicit regime boundaries and uncertainty declarations.
6. **Iteration Plan**: Next steps based on evidence grade, including conditions for expansion, refinement, or termination.

# Validation Gates

The following gates must be satisfied before a hypothesis is promoted beyond Weakly supported:

- **Conservation and consistency**: Relevant conserved quantities and symmetry constraints hold within declared tolerances.
- **Convergence**: Primary conclusions are stable across at least two resolution or approximation levels, or deviation is quantified and bounded.
- **Control integrity**: Negative controls remain clean, positive controls recover the expected signal, and strong controls agree with benchmarks within uncertainty.
- **Mechanism specificity**: The effect diminishes or changes direction when the candidate mechanism is removed or altered.
- **Independent agreement**: At least one check against an independent benchmark, dataset, or alternative method supports the conclusion.

# Claim Boundaries

- Distinguish **verified method behavior** (demonstrated in benchmarks or literature) from **new-problem inference** (current task extrapolation) and **speculation** (untested extensions).
- Do not extrapolate conclusions beyond validated scale ranges, redshifts, physical modules, or approximation regimes.
- Treat effective or subgrid parameters as model-dependent constraints with explicit applicability windows, not as fundamental physical constants.
- Numerical convergence does not imply physical truth; convergence must be paired with control checks and theoretical consistency.

# Failure Modes

Watch for these common failure modes that invalidate or weaken conclusions:

- **Single-realization dependency**: The hypothesis survives only in one resolution, one seed, or one object realization.
- **Tuning masquerading as mechanism**: Improvement arises from parameter adjustment rather than a physically motivated mechanism.
- **Artifact correlation**: The signal co-occurs with a known numerical artifact (e.g., diffusion, boundary reflection, grid alignment).
- **Confounding**: Initial conditions, sample selection, boundary effects, or projection effects explain the result instead of the proposed mechanism.
- **Overfitting**: The model improves on training diagnostics but fails independent prediction or alternative statistics.
- **Proxy misidentification**: An observable diagnostic is sensitive to an unmodeled process rather than the target mechanism.

# Validity Checks

Apply these checks throughout the workflow:

- **Confounders**: Audit resolution, numerical diffusion, initialization, sample selection, boundary conditions, projection effects, and tracer biases.
- **Reproducibility**: Record input versions, random seeds, diagnostic definitions, analysis scripts, and key configurations; ensure the experiment can be rerun to reach the same conclusion.
- **Statistical validity**: Use sufficient independent realizations or sample variance estimates; report uncertainties and avoid over-interpreting single objects or single snapshots.
- **Theoretical consistency**: Verify that assumptions respect relevant symmetries, conservation laws, causality, and known asymptotic limits.
- **Extrapolation boundaries**: State explicitly where the model is untested (e.g., smaller scales, higher redshifts, additional physics); do not silently generalize.

# Provenance

- Synthesized from cluster **20** / subcluster **20.0**.
- Derived from source skills:
  - `cosmological-rt-amr-research-workflow`
  - `lss-eft-baryon-research-design`
  - `astrophysical-radiation-hydrodynamics-research`
  - `cosmological-rpt-research-workflow`
  - `cosmic-density-reconstruction-research-workflow`
  - `cluster-mhd-research-workflow`
  - `galaxy-cluster-subgrid-research-workflow`
  - `dark-matter-halo-shape-exploration-workflow`
