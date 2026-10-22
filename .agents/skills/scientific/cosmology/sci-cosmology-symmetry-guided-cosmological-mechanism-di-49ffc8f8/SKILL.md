---
name: sci-cosmology-symmetry-guided-cosmological-mechanism-di-49ffc8f8
description: Use this skill when designing end-to-end research workflows to discover, discriminate, and validate astrophysical mechanisms in cosmological simulations and galaxy-cluster observations via controlled ablation, multi-scale benchmarking, and iterative hypothesis refinement.
scienceevolve-title: "Galaxy, cosmology, and simulations · symmetry guided cosmological mechanism discovery workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

## Purpose

Use this skill to design reusable, end-to-end research workflows for discovering and validating astrophysical mechanisms in cosmological structure formation, galaxy evolution, and cluster-scale processes. It abstracts controlled ablation, multi-scale benchmarking, and iterative hypothesis refinement into a transferable pattern that separates robust physical signals from model-dependent artifacts.

## When to use

Trigger this skill when the user asks to:

- Propose or evaluate research questions about galaxy formation, cluster physics, cosmological simulations, or high-redshift populations.
- Design controlled experiments to test a candidate mechanism against a baseline or benchmark.
- Validate an estimator, mock observable, or empirical model using independent truth-known data or cross-observable checks.
- Diagnose systematic biases, subgrid sensitivities, or selection effects in astrophysical inference.
- Iterate on a hypothesis after an initial simulation or observation campaign.

Do not use for operational instrument control, raw data reduction pipelines, or as a substitute for domain-specific parameter inference tools.

## Inputs required

Before starting the workflow, obtain or define:

- **Target phenomenon and research gap**: the unresolved process or observable tension to be explained.
- **Candidate mechanism(s)**: causal hypotheses with distinct predicted signatures and boundary conditions.
- **Backbone asset**: simulation suite, halo catalog, merger tree, observational survey, or benchmark dataset.
- **Baseline and reference definitions**: a baseline where the mechanism is suppressed or absent, and a reference where it operates.
- **Observable proxies and metrics**: primary diagnostics, secondary proxies, and comparison statistics.
- **Constraints**: resolution limits, runtime budget, sample size, redshift range, and mass regime.
- **Validation resources**: truth-known samples, independent observables, mock-observation pipelines, or cross-checks.

## Core Workflow

1. **Frame the gap and decompose the system**
   - Define the target phenomenon, the observable tension, and the unresolved process that prevents explanation.
   - Decompose the system along physically meaningful axes such as scale, epoch, environment, or population class.
   - **Decision gate:** Is the gap mechanism-discriminable with available diagnostics? If no, reformulate the research question.

2. **Generate falsifiable mechanism hypotheses**
   - Propose at least two competing causal mechanisms with distinct predicted signatures.
   - Label evidence strength (strong, moderate, weak, speculative), map key assumptions, and forecast failure modes.
   - **Decision gate:** Can the hypotheses be tested with the available backbone and budget? If no, narrow scope or acquire inputs.

3. **Design controlled validation**
   - Establish a baseline where the candidate mechanism is suppressed or absent, and a reference where it operates.
   - Define ablation variants, strong controls, negative controls, positive controls, and stress tests.
   - Pre-register the comparison matrix, metrics, and stopping conditions before execution.
   - **Decision gate:** Is minimal viable validation feasible? If no, stop and redesign.

4. **Execute multi-scale experiment**
   - Run simulation variants or process observational samples with fixed selection functions.
   - Emulate observational limitations such as projection, weighting, masking, and noise when comparing to data.
   - Monitor numerical convergence, conservation behavior, and completeness.
   - **Stop condition:** Halt if convergence checks fail, conservation artifacts appear, or the sample is dominated by selection bias.

5. **Analyze via stratification and decomposition**
   - Quantify residuals or deviations by subsystem, scale, epoch, or environment.
   - Test whether category contributions are additive, interactive, or canceling.
   - Separate median trends from scatter; inspect outliers and asymmetry.
   - Map internal diagnostics to mock observables or proxies using matched definitions.
   - **Decision gate:** Does the mechanism produce a unique, resolved signature? If ambiguous, proceed to the uncertainty audit.

6. **Audit uncertainty and systematics**
   - Vary subgrid prescriptions, weighting schemes, model parameters, and sample definitions within plausible ranges.
   - Check for compensating errors, observational degeneracy, and confounding variables.
   - **Decision gate:** Is the signal robust across controls and independent of implementation artifacts? If no, downgrade evidence strength or redesign.

7. **Iterate or redesign**
   - **Supported:** Expand to a larger ensemble, wider parameter range, or independent observable.
   - **Conditional:** Bound the claim to the specific assumptions under which it holds.
   - **Ambiguous:** Add discriminating diagnostics or refine the mock-observable pipeline.
   - **Rejected:** Abandon the hypothesis or reformulate the mechanism map.
   - **Stop condition:** Terminate when claims are bounded by validation, or when dominant uncertainty cannot be reduced without new data.

8. **Bound claims and archive provenance**
   - State which conclusions are transferable and which depend on the specific system, epoch, or unresolved physics.
   - Document all variants, initial conditions, definitions, random seeds, and software versions.
   - **Decision gate:** Are all claims labeled by evidence strength and regime validity? If yes, the workflow is complete.

## Output Format

When using this skill, produce:

1. **Research question and gap statement** — one-sentence question and why it matters.
2. **Ranked hypotheses table** — columns: mechanism, evidence strength, key assumptions, predicted signature, likely failure mode.
3. **Experimental design** — baseline, ablations, controls, metrics, and stopping conditions.
4. **Analysis plan** — stratification variables, decomposition strategy, convergence checks, mock-observable mapping, and sensitivity tests.
5. **Iteration roadmap** — next steps for supported, conditional, ambiguous, or rejected outcomes.
6. **Validity and boundary statement** — claim limits, model dependence, extrapolation warnings, and reproducibility metadata.

## Validation Gates

- **Mechanism discriminality:** The gap must be addressable by at least two competing, falsifiable hypotheses.
- **Convergence:** Numerical or measurement quantities must show qualitative stability under resolution or depth increase.
- **Control completeness:** Baseline, ablation, negative, positive, and stress-test controls must be interpreted together.
- **Robustness:** The signature must persist across plausible model variations, weighting schemes, or subgrid prescriptions.
- **Observational anchoring:** Mock or real observables must be compared with matched definitions; degeneracy with alternative mechanisms must be assessed.

## Claim Boundaries

- Distinguish simulated consistency from observational confirmation.
- Label conclusions by dependence on unresolved physics, subgrid models, or selection functions.
- Restrict population-level claims to ensemble-tested regimes; mark single-object or case-study results explicitly.
- Separate transferable patterns from system-specific artifacts.
- Do not extrapolate corrections or mechanisms beyond tested mass, redshift, environment, or resolution ranges.

## Failure Modes

- Hypothesis is unfalsifiable with current assets or selection function.
- Result changes qualitatively under resolution increase or model variation.
- Baseline and ablation differ by less than the uncertainty budget.
- Compensating errors between subgrid models mimic a physical signature.
- Observable definition mismatch invalidates simulation-observation comparison.
- Single high-leverage object or small sample drives the population trend.
- Scatter or skewness is interpreted as a mean trend due to binning by inferred quantity.
- Shared assumptions across implementations create false convergence.

## Validity Checks

- **Confounder separation:** Match or stratify by mass, redshift, environment, selection, and nuisance variables.
- **Benchmark independence:** Verify the comparison target is independent enough to diagnose the estimator or mechanism.
- **Sample mixing:** Compare binning by benchmark and inferred quantities; inspect upscatter and downscatter effects.
- **Pipeline verification:** Test analysis on synthetic data with known answers before applying to new systems.
- **Model adequacy:** Compare multiple profile, interpolation, or parameterization choices.
- **Reproducibility:** Record variants, initial conditions, definitions, random seeds, and software versions.
- **Temporal consistency:** Ensure the mechanism operates during the relevant evolutionary phase.
- **Statistical validity:** Report sample size, scatter, percentiles, and uncertainty; avoid over-interpreting small samples.

## Provenance

- Synthesized from cluster 31.1 (symmetry-guided mechanism discovery and validation).
- Source skills: high-redshift-quasar-simulation-design, icm-metal-enrichment-research-design, halo-constrained-empirical-galaxy-exploration, hse-mass-bias-exploration, early-galaxy-boundary-population-research, observation-constrained-galaxy-simulation-validation, baryonic-feedback-cosmology-explorer, xray-cluster-mass-bias-validation.
- Paper-specific conclusions, numerical results, and operational parameters have been excluded from the reusable workflow body.
