---
name: sci-cosmology-observable-driven-mechanism-discovery-wor-653fe00f
description: Reusable end-to-end workflow for designing, testing, and iterating astrophysical mechanism hypotheses using controlled observables, multi-diagnostic convergence, and systematic-aware validation.
scienceevolve-title: "Galaxy, cosmology, and simulations · observable driven mechanism discovery workflow 4"
scienceevolve-area: galaxy-cosmology-and-simulations
---

## Purpose

Guide an agent to generate and validate research questions about astrophysical or cosmological mechanisms through observable-driven inference. This skill synthesizes cross-domain patterns for distinguishing genuine physical signals from artifacts, confounders, and selection effects, and for bounding claims when evidence is incomplete.

## When to use

Use this skill when proposing or evaluating studies where an observable gap, anomaly, or population trend must be explained by competing physical mechanisms. It applies to cosmological probes, galaxy and structure formation, circumgalactic and intergalactic medium, dark matter indirect detection, and high-redshift source populations.

Do not use this skill for operational data reduction pipelines, instrument operation manuals, broad literature reviews without a concrete validation design, or tasks that lack a target observable and a set of competing mechanisms.

## Inputs required

Collect or request the following before producing a research plan:

- **Target observable or proxy**: the anomaly, trend, or diffuse signal to explain.
- **Hidden state or mechanism**: the physical process inferred from the proxy.
- **Competing hypotheses**: at least one primary mechanism, one confounder/artifact mechanism, and one null or selection-effect alternative.
- **Data and simulation products**: available catalogues, images, spectra, merger trees, mock observations, or forecast frameworks.
- **Known systematics and backgrounds**: nuisance parameters, selection functions, instrumental response, resolution limits, masking, and foregrounds.
- **Reference populations**: comparison samples, baseline models, or matched controls.
- **Claim boundary**: the intended regime of applicability (e.g., redshift, mass, scale, environment, sensitivity).

## Core Workflow

Follow this ordered route. At each decision gate, stop or redesign if the condition is not met.

### 1. Frame the inference gap
- Define the observable feature and the hidden state it is intended to diagnose.
- Map proxy validity limits: identify saturation, degeneracy, or alternative mechanisms that could mimic the target signal.
- Document the selection function and known confounders that might produce or suppress the apparent trend.

**Decision gate**: If the proxy cannot be operationalized without circular dependence on the expected conclusion, stop and redefine the measurement target.

### 2. Generate mechanism hypotheses
- Produce at least three competing hypotheses (e.g., target physics, confounder/artifact, selection/null).
- For each hypothesis specify: expected observable signature, evidence strength (strong / moderate / weak / speculative), key assumptions, likely failure modes, and boundary conditions where the hypothesis should not be extrapolated.
- Map each hypothesis to independent diagnostics that would support or falsify it.

**Decision gate**: If the hypotheses predict identical observational signatures under the available data, stop and identify a discriminatory diagnostic before proceeding.

### 3. Design minimal viable validation
- Define reproducible sample inclusion and exclusion criteria independent of the expected conclusion.
- Specify controls:
  - **Positive control**: a regime or injection where the target mechanism should produce a clear signal.
  - **Negative control**: a regime or null sample where the signal should be absent or strongly suppressed.
  - **Ablation/definition control**: alternative object definitions, thresholds, or processing choices.
  - **Instrumental/background control**: characterization of response, PSF-like effects, background stability, and random-position tests.
- Choose evaluation metrics: detection significance, robustness across alternatives, mechanism-discrimination power, and sensitivity to nuisance assumptions.
- Define stop conditions upfront.

**Decision gate**: If no control can separate the primary mechanism from artifacts or selection effects, stop and redesign the observable or sample.

### 4. Build controlled analysis pipeline
- Homogenize data products and propagate systematics (e.g., response functions, calibration, redshift, luminosity, masking).
- Construct matched comparisons: hold endpoint properties fixed while varying history or environment, or vice versa.
- Decompose the signal into physically distinct components where relevant (e.g., compact vs. extended, inherited vs. processed, stable vs. transient).
- Preserve alternative definitions and nuisance parameterizations for sensitivity tests.

### 5. Execute decomposition and comparison
- Compute primary statistics and compare target against all controls.
- Quantify the contribution of backgrounds, systematics, and nuisance marginalization.
- Test stability across definitions, thresholds, redshift bins, scale cuts, and method choices.
- Track evolutionary or environmental state where relevant to separate transient from persistent signals.

**Decision gate**: If the result changes qualitatively under reasonable alternative definitions or methods, classify the finding as definition-dependent or artifact-contaminated and iterate on controls.

### 6. Converge or discriminate mechanisms
- Count independent diagnostics supporting each hypothesis; penalize diagnostics that share assumptions or selection channels.
- Require multi-diagnostic convergence to upgrade evidence strength.
- If nuisance marginalization dominates the error budget, replace broad priors with justified calibration channels or reduce the claim scope.
- If negative controls show unexpected sensitivity, inspect shared systematics or covariance leakage.

**Decision gate**: If independent diagnostics contradict the favored mechanism, or if the signal is driven mainly by priors rather than data, downgrade or reject the hypothesis.

### 7. Bound claims and plan next iteration
- Separate verified results from model-inferred or agent-generated hypotheses.
- State boundary conditions and extrapolation limits explicitly.
- If evidence is ambiguous, specify the single next diagnostic or control that would most reduce uncertainty.
- **Stop conditions**:
  - The claim is stable across method, definition, and nuisance controls.
  - No robust claim is justified after reasonable controls.
  - Additional data or diagnostics cannot change the current hypothesis ranking.

## Output Format

Produce the following deliverables each time this skill is used:

1. **Research question and gap statement** — concise question, target population, and why simpler analyses leave it unresolved.
2. **Hypothesis matrix** — table with claim, mechanism, expected signature, evidence strength, key assumptions, likely failure modes, and boundary conditions.
3. **Experimental design** — sample definition, inclusion/exclusion rules, control set, variables, metrics, and stop conditions.
4. **Analysis plan** — homogenization strategy, decomposition approach, comparison logic, robustness checks, and uncertainty treatment.
5. **Evidence map** — classification of each element as verified, inferred, or speculative.
6. **Validity and boundary statement** — main confounders, reproducibility requirements, transfer limits, and safety/ethics constraints.
7. **Iteration recommendation** — next decisive validation step, or explicit reason to stop.

## Validation Gates

- **Proxy independence**: The target signal is defined independently of the expected conclusion.
- **Control adequacy**: At least one positive control, one negative control, and one ablation/definition control are included.
- **Systematic boundedness**: Background or nuisance estimates do not consume the majority of the candidate signal.
- **Reproducibility**: Selection rules, definitions, cuts, priors, and random seeds are documented.
- **Stability**: Conclusions hold across plausible alternative definitions, thresholds, and method choices.
- **Circularity avoidance**: The target systematic or hidden state is not calibrated using a measurement that already assumes its value.
- **Cross-scale consistency**: Object-level and population-level inferences do not conflict.

## Claim Boundaries

- Distinguish **observed**, **derived**, **model-inferred**, and **hypothesized** quantities.
- Label every claim with its evidence strength and do not present single-study or forecast results as field-wide consensus.
- Specify the regime of applicability (redshift, mass, scale, environment, sensitivity, observable set).
- Do not generalize beyond the tested sample, theoretical assumptions, or modeled survey configuration.
- Treat forecast and design-study outputs as evidence for what could be learnable under stated assumptions, not as empirical confirmation.

## Failure Modes

- Proxy signal is dominated by confounders, selection effects, or nuisance marginalization.
- Apparent trend appears only under one arbitrary definition, threshold, or bin.
- Result reverses under resolution, projection, method, or background changes.
- Background estimate removes most of the candidate signal.
- Independent diagnostics contradict the favored mechanism.
- Target and reference populations differ in hidden variables.
- Marginal or ambiguous objects dominate the statistic.
- Low-signal or poorly resolved regimes drive the main conclusion.
- Forecasted gains vanish after realistic nuisance marginalization.

## Validity Checks

- **Confounding**: Could redshift, luminosity, selection, environment, calibration, or local contamination drive the trend?
- **Independence**: Do supporting diagnostics rely on distinct physical assumptions and data channels?
- **Selection audit**: Does the selection function enrich, suppress, or create the apparent signal?
- **Definition sensitivity**: Does the conclusion change under alternative operational definitions or counting rules?
- **Reproducibility**: Are criteria, ancestry links, and processing choices explicit enough to repeat?
- **Boundary**: Is the claim within the calibration domain of the data, simulations, and proxy definitions?
- **Mechanism specificity**: Does the design distinguish the proposed mechanism from plausible alternatives?
- **Negative evidence**: Are non-detections, weak signals, and ambiguous objects included in the interpretation?

## Provenance

- Synthesized from cluster 15.1 (observable-driven mechanism discovery and validation).
- Source skill references: `multi-probe-tomographic-forecast-skill`; `wdm-suppressed-structure-discovery`; `lifecycle-accounting-cosmological-substructure`; `dark-matter-extended-region-constraints`; `quasar-proximity-zone-reionization-exploration`; `high-redshift-radio-galaxy-research-pattern`; `weak-signal-cgm-exploration`; `galaxy-evolution-ancestry-workflow`.
- No paper-specific numerical results, parameters, materials, or operational protocols are included in this reusable workflow.
