---
name: sci-cosmology-galaxy-halo-mechanism-discovery-workflow-74084791
description: A reusable end-to-end workflow for discovering and validating astrophysical mechanisms across galactic and halo scales using controlled comparisons, multi-scale diagnostics, and iterative hypothesis refinement.
scienceevolve-title: "Galaxy, cosmology, and simulations · galaxy halo mechanism discovery workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

## Purpose

This skill guides an agent in designing and executing reusable research plans for discovering and validating physical mechanisms in complex, multi-scale astrophysical systems. It structures the process of moving from a population-level trend or anomaly to a discriminating, controlled test that links global observables to local mechanisms, using simulation, observation, or theory.

## When to use

Use this skill when the task is to investigate a complex astrophysical system in which several coupled processes compete across scales, such as galaxy formation, halo structure evolution, feedback-regulated growth, angular momentum redistribution, large-scale structure, or cosmological model testing. It is designed for structured research-question generation, experimental-design planning, and mechanism discrimination.

Do not use it as a general-purpose literature review tool, a full paper-writing service, an operational instrument manual, or a substitute for running simulations or domain-expert review.

## Inputs required

Before using the skill, obtain or define:

- **Target scientific question**: the population-level trend, anomaly, or structural phenomenon to explain.
- **Framework and variants**: the simulation suite, observational survey, or theoretical model available, including comparable counterfactual variants or control runs.
- **Observables and diagnostics**: primary and secondary quantities to explain (e.g., scaling relations, occurrence rates, kinematic maps, density profiles).
- **Stratification variables**: object properties that determine mechanism eligibility or efficiency (e.g., mass, environment, accretion state, epoch).
- **External benchmarks**: independent observations, analytic predictions, or alternative simulation suites for comparison.
- **Known limitations**: resolution, volume, selection effects, sub-grid prescriptions, tracer bias, coordinate conventions, and masking.

## Core Workflow

Execute the following stages in order. Treat each **Decision Gate** as a hard stop or redesign trigger.

### 1. Phenomenon Framing and Gap Diagnosis
- Define the population-level trend or anomaly precisely, including its domain (mass range, redshift, environment).
- Map the domain gap: state what prior work explains, what remains untested, and why the question matters.
- Identify plausible confounders (selection, projection, resolution, definition sensitivity) that could mimic the trend.
- **Decision Gate 1**: Is the phenomenon measurable and separable from known systematics? If no, refine the question or stop.

### 2. Mechanism Hypothesis Generation
- Propose at least two competing physical mechanisms, plus a conservative null or alternative explanation.
- Map each mechanism to the regimes (object classes, epochs, environments) where it should operate most efficiently.
- Formulate mechanism-isolation hypotheses using counterfactual patterns: “If mechanism A dominates regime R, then altering A should change observable O mainly for objects with property P.”
- Assign evidence strength to each hypothesis: **strong** (controlled comparison + plausible mechanism + multiple diagnostics), **moderate** (two of three), **weak** (plausible but undiscriminated), or **speculative** (theory-motivated but untested).
- Record explicit failure modes for each (e.g., numerical sensitivity, degeneracy, selection bias, insufficient counts).
- **Decision Gate 2**: Do the hypotheses yield discriminating predictions? If no, broaden the diagnostic set or stop.

### 3. Controlled Experimental Design
- Define comparison arms:
  - **Baseline**: full-physics or standard model.
  - **Perturbation**: variants that alter one mechanism or assumption at a time.
  - **Robustness**: alternative definitions, resolutions, or proxies.
- Specify stratification of objects by variables linked to mechanism eligibility.
- Design controls:
  - **Strong control**: isolates the mechanism while holding baseline growth fixed.
  - **Negative control**: regime where the mechanism should be weak or absent.
  - **Positive control**: regime where the mechanism should produce a clear effect.
  - **Method control**: alternative detection or definition pipeline.
- Define evaluation metrics (difference in observables, scaling-relation shifts, contribution fractions, scatter changes).
- Define stopping rules before execution.
- **Decision Gate 3**: Are variants comparable (shared initial conditions, matched numerics) and are controls feasible? If no, redesign or stop.

### 4. Minimal Viable Validation and Baseline Reproduction
- Reproduce the baseline expectation with the chosen pipeline.
- Validate on positive and negative controls.
- Check definition sensitivity: repeat with alternative boundaries, metrics, or coordinate conventions.
- Audit data inputs (provenance, selection, masks, units).
- **Decision Gate 4**: Do controls behave as expected and is the pipeline reproducible? If no, debug definitions, calibration, or numerics before proceeding.

### 5. Multi-Scale Analysis
- **5a. Global trend check**: Compare the primary observable across controlled variants. Identify timing, regime, and magnitude of divergence.
- **5b. Regime attribution**: Stratify by mechanism-eligibility variables. Determine which regimes drive the global change and whether the signal is population-wide or rare-system-driven.
- **5c. Local mechanism inspection**: Select representative systems from affected regimes. Check whether mechanism activation precedes local observable changes and whether secondary diagnostics (reservoir state, kinematics, accretion indicators) co-vary.
- **5d. Correlation and scatter analysis**: Examine whether the mechanism alters the slope, normalization, or scatter of key scaling relations. Treat correlation breakdown as diagnostic only when paired with a controlled comparison.
- **Decision Gate 5**: Is the signal present, regime-dependent, and preceded by mechanism activation? If no, proceed to Failure Modes.

### 6. Mechanism Discrimination and Benchmarking
- Compare global and local diagnostics against independent benchmarks (observations, analytic prescriptions, other simulations).
- Separate physical mechanism effects from analysis artifacts (definition mismatch, projection, proxy sensitivity).
- Test for degeneracy: if multiple mechanisms produce similar signatures, design a follow-up discriminative test.
- **Decision Gate 6**: Does the mechanism survive alternative explanations and benchmark comparisons? If no, iterate the hypothesis or stop.

### 7. Uncertainty Audit and Robustness
- Quantify statistical scatter, sample-size limits, and cosmic variance.
- Assess numerical convergence, resolution sensitivity, and volume effects.
- Test stability under sample cuts, resampling, and alternative definitions.
- Evaluate rare-object influence: repeat analysis with and without extreme subsets.
- **Decision Gate 7**: Does the effect exceed combined uncertainty and remain stable under robustness checks? If no, downgrade evidence strength or stop.

### 8. Iteration or Redesign
- **If supported**: Strengthen the hypothesis, narrow the regime of applicability, and propose a follow-up test that targets the next weakest assumption.
- **If ambiguous**: Design a new controlled variant or diagnostic that separates degenerate mechanisms.
- **If refuted**: Abandon or reformulate the mechanism. Check whether the result reclassifies the mechanism as locally important but globally subdominant.
- **Stop conditions**:
  - Controlled variants are not comparable.
  - Object counts in key regimes are insufficient for stable interpretation.
  - The primary observable is insensitive to all proposed mechanisms.
  - Multiple mechanisms remain indistinguishable after discriminative tests.
  - Numerical artifacts or convergence effects dominate the signal.
  - The result depends on a single extreme subset without a plausible mechanism.
  - Observational proxy mismatch prevents meaningful comparison.

## Output Format

Produce the following structured deliverables:

1. **Research question and scope boundary**
   - One concise question, the global phenomenon, and the local mechanism suspected to drive it.

2. **Gap and motivation**
   - What is unknown, why it matters, and what would be learned.

3. **Hypothesis cards**
   - For each hypothesis: evidence strength, mechanism, operating regime, key assumptions, discriminating predictions, and failure modes.

4. **Experimental design**
   - Comparison arms (baseline, perturbation, robustness).
   - Object classes and stratification.
   - Controls (strong, negative, positive, method).
   - Evaluation metrics and stopping rules.

5. **Analysis plan**
   - Global trend analysis.
   - Regime attribution.
   - Local mechanism inspection.
   - Benchmark comparison.
   - Sensitivity and uncertainty checks.

6. **Iteration rules**
   - What result would strengthen, weaken, or refute the hypothesis.
   - What follow-up experiment would separate competing mechanisms.
   - Explicit stop or revise conditions.

7. **Validity and ethics statement**
   - Main confounders.
   - Boundary conditions and extrapolation limits.
   - Reproducibility requirements.
   - Model-specific and proxy-specific limitations.

## Validation Gates

Summarized criteria that must be satisfied to advance past each stage:

- **Gate 1 – Measurability**: The phenomenon is operationally defined and separable from known systematics.
- **Gate 2 – Discriminability**: Hypotheses predict distinct, observable signatures.
- **Gate 3 – Comparability**: Counterfactual variants share baselines and controls are technically feasible.
- **Gate 4 – Pipeline validity**: Baseline reproduces expected behavior and controls show correct contrast.
- **Gate 5 – Signal coherence**: The effect is present, regime-dependent, and locally consistent with mechanism activation.
- **Gate 6 – Mechanism survival**: The effect persists against alternative explanations and independent benchmarks.
- **Gate 7 – Robustness**: The effect exceeds combined statistical, numerical, and systematic uncertainty.

## Claim Boundaries

- Treat all simulation-based causal claims as **model-conditioned interpretations**, not universal observational proof.
- Limit claims to the tested framework, observable proxy, selection regime, and redshift or time range.
- Explicitly distinguish **established findings**, **new analysis results**, and **speculative extensions**.
- Do not generalize from one survey, simulation suite, or object class to the entire field without additional evidence.
- Correlations and scaling relations are **diagnostics**, not automatic proof of causality, unless supported by controlled comparisons.

## Failure Modes

| Failure | Response |
|---|---|
| Baseline does not reproduce expected behavior | Debug definitions, coordinate conventions, numerics, or calibration before interpreting new effects. |
| Positive or negative controls fail | Halt interpretation; redesign the sample, pipeline, or control regime. |
| Mechanisms are degenerate | Add a discriminative diagnostic or mechanism-isolated variant; do not claim dominance. |
| Effect disappears under alternative definitions | Report the result as definition-dependent and redesign the measurement proxy. |
| Numerical artifacts dominate | Stop; refine resolution, convergence checks, or domain size. |
| Rare or extreme objects drive the global trend | Test stability with and without the subset; state the implication explicitly. |
| Observational proxy mismatch | Pause comparison; design a proxy-matched or mock-observation test. |
| Insufficient sample in a key regime | Flag the regime as unconstrained; do not extrapolate. |

## Validity Checks

Before presenting conclusions, verify:

- **Causal isolation**: Each mechanism has a controlled variant or credible counterfactual.
- **Shared baselines**: Initial conditions and non-target physics are comparable across variants.
- **Population sufficiency**: Enough objects exist in each regime for stable interpretation.
- **Definition consistency**: Object boundaries, centers, metrics, and coordinate conventions are matched across comparisons.
- **Resolution adequacy**: Fitted or derived quantities exclude under-resolved or unstable regions.
- **Sample selection bias**: Cuts, masks, and selection effects are documented and tested as potential confounders.
- **Observational comparability**: Simulation and observational proxies measure the same physical quantity under compatible assumptions.
- **Statistical validity**: Uncertainties are estimated with resampling or equivalent methods; small bins are flagged.
- **Reproducibility**: Catalogues, selection criteria, binning choices, metric definitions, and code versions are documented.
- **Boundary conditions**: Regimes where the claim should not be extrapolated are explicitly stated.

## Provenance

- **Cluster**: 17 / **Subcluster**: 17.1
- **Synthesized from source skills**: `galaxy-feedback-research-design`, `dark-matter-halo-concentration-exploration`, `halo-angular-momentum-research-design`, `simulated-galaxy-kinematic-structure-exploration`, `astronomy-evidence-chain-research-planning`, `galaxy-structure-simulation-observation-research`, `void-supercluster-catalogue-research-workflow`, `scalar-tensor-cosmology-simulation-workflow`.
- This workflow encodes transferable methodological patterns only. No paper-specific numerical results, model parameters, or operational protocols are included.
