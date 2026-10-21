---
name: sci-cosmology-observable-driven-mechanism-discovery-wor-f33b082b
description: A reusable workflow for converting observable tensions into testable causal research programs through hypothesis generation, controlled experimentation, and iterative validation in astrophysics and galaxy formation.
scienceevolve-title: "Galaxy, cosmology, and simulations · observable driven mechanism discovery workflow 12"
scienceevolve-area: galaxy-cosmology-and-simulations
---

## Purpose

This skill provides an end-to-end workflow for transforming an observable tension or benchmark discrepancy into a causal research program. It guides the agent through framing falsifiable questions, generating competing hypotheses, designing minimal controlled experiments using simulations or observational data, analyzing results with causal rigor, and iterating based on validation gates. The workflow abstracts the shared reasoning pattern across galaxy formation, large-scale structure, and chemical evolution studies without embedding source-specific numerical thresholds or model conclusions.

## When to use

Use this skill when:
- A mismatch exists between a target observable and baseline model predictions or empirical benchmarks.
- Multiple physical mechanisms could explain a population transition, structural feature, abundance pattern, or low-density structure.
- Designing simulation experiments, observational analyses, or catalog-based studies that require mechanism discrimination.
- The goal is to propose a research plan, analysis protocol, or experimental design rather than execute a fixed pipeline or summarize literature.

Do not use this skill for operational telescope scheduling, instrument configuration, hazardous procedures, numerical parameter tuning recipes, or as a substitute for domain-specific physical modeling when that is the sole need.

## Inputs required

Before proposing a research plan, gather or state assumptions for:
- **Target observable:** the population statistic, scaling relation, distribution feature, or event rate defining the scientific tension.
- **Baseline model or empirical benchmark:** the reference prediction, simulation, or dataset that currently underpredicts, overpredicts, or mischaracterizes the observable.
- **Candidate mechanisms:** physical processes suspected to alter the outcome, such as feedback timing, accretion geometry, transport pathway, or environmental modulation.
- **Available data or simulation products:** catalogs, particle or cell histories, density fields, merger trees, star-formation histories, or survey outputs.
- **Selection criteria and uncertainties:** mass/epoch/environment cuts, classification thresholds, measurement scatter, completeness, and cosmic variance estimates.
- **Constraints:** computational budget, resolution limits, redshift range, data access policies, and reproducibility requirements.

## Core Workflow

Follow this ordered route. At each gate, decide whether to proceed, reformulate, or stop.

### 1. Frame the Observable Tension
- Define the target observable, the baseline prediction, and the specific mismatch or gap.
- Document selection criteria, measurement uncertainties, and the domain of validity.
- **Gate:** If the tension is not falsifiable or measurable with available resources, reformulate the question or stop.

### 2. Generate Competing Hypotheses
- **Mechanism hypothesis:** a physical process that could resolve the tension.
- **Selection or systematic hypothesis:** observational bias, classification threshold, survey geometry, or mock-observation limitation as the cause.
- **Alternative-mechanism hypothesis:** at least one competing physical explanation.
- **Degeneracy hypothesis:** different formation histories that could produce similar observables.
- For each hypothesis, record: predicted signature, evidence strength (strong/moderate/weak/speculative), key assumptions, and failure modes.
- **Gate:** If the hypotheses are not mutually distinguishable with the planned diagnostics, refine the definitions or stop.

### 3. Design a Minimal Controlled Experiment
- **Baseline arm:** reference model or sample with default physics and selection.
- **Mechanism-ablation arm:** suppress or cap the candidate mechanism while holding other assumptions fixed.
- **Alternative arm:** a physically motivated competing mechanism or a threshold-shifted variant.
- **Controls:**
  - *Positive control:* a regime where the expected signal should appear.
  - *Negative control:* a regime where the signal should be absent or irrelevant.
  - *Strong control:* identical observable construction, resolution, volume, and selection across all arms.
  - *Robustness control:* alternative definitions, classifiers, shape estimators, or sample cuts.
- Pre-register independent variables, mediators, outcome metrics, and stopping conditions before analysis.
- **Gate:** If the design cannot discriminate hypotheses or violates feasibility constraints, scope down or stop.

### 4. Execute Analysis with Causal Rigor
- Apply observational selection consistently across all arms; forward-model synthetic observables where needed.
- Track causal ordering: verify that intermediate mediators shift before or alongside the final outcome.
- Quantify full distributions (peaks, widths, tails, scatter) and rare-event statistics, not only central tendencies.
- Propagate measurement uncertainty through resampling or mock perturbations.
- **Gate:** If the signal is smaller than numerical or observational uncertainty, or depends on a single object or rare regime, flag as conditional and pause interpretation.

### 5. Evaluate Against Controls and Systematics
- Verify that positive controls show the expected pattern and negative controls do not.
- Test calibration independence: do not validate on observables used to tune the baseline.
- Assess numerical convergence, resolution sensitivity, volume effects, and definition stability.
- Check confounding by mass, environment, epoch, tracer bias, or selection effects through stratification or matching.
- **Gate:** If controls fail, the signal disappears under alternative definitions, or confounding explains the result, stop and redesign.

### 6. Iterate or Finalize Claims
- **Strengthen:** If the candidate mechanism resolves the tension and passes controls, retain it but test necessity by examining alternative mechanisms and broader domains.
- **Partial:** If the mechanism improves the target but breaks independent constraints, treat it as a partial explanation and search for coupled systematics.
- **Conditional:** If the signal appears only under one definition or in one subclass, restate as a conditional claim and design a broader test.
- **Pivot:** If selection or nuisance variables explain the tension, redirect to observational-systematic tests.
- **Stop conditions:** the hypothesis is rejected; the claim is bounded by validated domain limits; or the next discriminating test is defined.
- **Gate:** Before finalizing, confirm that claims are limited to tested regimes and labeled by evidence type (direct measurement, model-dependent inference, or extrapolation).

## Output Format

Produce a structured research package containing:
1. **Research question:** one sentence stating the observable tension and its significance.
2. **Hypothesis table:** columns for hypothesis, mechanism, predicted signature, evidence strength, key assumptions, and failure modes.
3. **Experimental plan:** model arms, controls, variables, metrics, and stopping conditions.
4. **Analysis plan:** selection matching, causal-chain checks, uncertainty propagation, robustness tests, and definition sensitivity checks.
5. **Iteration rules:** how each possible result strengthens, weakens, rejects, or redirects each hypothesis.
6. **Validity statement:** confounders, boundary conditions, reproducibility needs, and claims that are not yet supported.

## Validation Gates

- **Falsifiability:** The tension must be expressible as a measurable mismatch under stated assumptions.
- **Distinguishability:** Hypotheses must predict distinct observable signatures or distribution changes.
- **Feasibility:** The experiment must be executable within stated resource, data, and computational constraints.
- **Causal ordering:** Mediators must be shown to change before or concurrently with outcomes, not after.
- **Control fidelity:** Positive and negative controls must behave as expected under the analysis plan.
- **Robustness:** The signal must survive alternative physically motivated definitions, classifiers, and selection cuts.
- **Independence:** Validation observables must not overlap with calibration or tuning observables.

## Claim Boundaries

- Distinguish model-dependent inferences from direct measurements and observational facts.
- Label extrapolations beyond tested mass, redshift, environment, or tracer populations as speculative.
- Do not treat single-model, single-survey, or single-simulation-suite results as field-wide consensus.
- Present distributional associations as evidence for mechanisms, not as proof of causation, unless supported by controlled ablation and causal ordering.
- Mark agent-inferred extensions separately from paper-validated methodological patterns.

## Failure Modes

- **Confounding dominates:** mass, environment, epoch, or selection effects explain the apparent signal.
- **Definition dependence:** the result vanishes under alternative classification thresholds, shape estimators, or pathway definitions.
- **Numerical artefact:** the signal is driven by resolution limits, box size, subgrid physics, or reconstruction method.
- **Overfitting:** tuning multiple mechanisms simultaneously without isolating their individual effects.
- **Calibration contamination:** using the same observable to tune the baseline and validate the hypothesis.
- **Cosmic variance or small-number bias:** rare populations, single-object regimes, or limited volumes drive the conclusion.
- **Observational mimicry:** selection bias or measurement scatter reproduces the predicted signature without a physical cause.

## Validity Checks

- **Confounding:** Are changes in the target observable separable from simultaneous changes in resolution, volume, feedback calibration, or selection?
- **Repeatability:** Are model arms documented with fixed seeds, parameter changes, and output definitions sufficient for independent reproduction?
- **Statistical validity:** Are rare-event uncertainties, Poisson noise, cosmic variance, and measurement scatter reported?
- **Boundary conditions:** Does the hypothesis specify the mass, epoch, environment, or model regime where it should and should not apply?
- **Selection validity:** Are observational cuts and measurement scatter applied symmetrically to all arms?
- **Causal validity:** Are intermediate variables measured at epochs preceding the final outcome?
- **Model-systematics check:** Are alternative mechanisms tested before treating the candidate mechanism as necessary?
- **Extrapolation check:** Are claims limited to tested regimes, with clear labels for any extrapolation?
- **Reproducibility:** Are data versions, selection criteria, analysis decisions, random seeds, and software versions documented?

## Provenance

- Synthesized from cluster 25 (subcluster 25.0): observable-driven mechanism discovery and validation.
- Source skills: high-redshift-galaxy-quenching-exploration; galaxy-gas-accretion-exploration; galaxy-colour-transition-workflow; galaxy-halo-spin-morphology-exploration; astronomy-paper-exploration-workflow; cosmic-void-research-pattern; galactic-halo-chemical-accretion-research-skill; galaxy-cgm-metal-enrichment-explorer.
