---
name: sci-quantum-observable-driven-mechanism-discovery-workf-f6d23a58
description: A reusable end-to-end workflow for turning observable discrepancies into mechanism-resolved hypotheses, designing minimal validation studies with strong controls, and iterating until claims are bounded by evidence.
scienceevolve-title: "Quantum materials and condensed matter · observable driven mechanism discovery workflow 6"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Guide agents in designing and executing reusable research plans for complex physical systems where an observable trend, scaling law, or baseline expectation fails or is incomplete. The workflow produces mechanism-resolved hypotheses, minimal validation designs, and bounded claims without prescribing domain-specific operational procedures.

## When to use

Use when:

- A baseline model, scaling law, or theoretical expectation is contradicted by observations, simulations, or data.
- The goal is to discover or validate the hidden mechanism behind a discrepancy in multiscale physical systems.
- The task requires non-operational research design: hypothesis generation, control design, analysis planning, and iteration rules.

Do not use to prescribe experimental operating parameters, fabrication recipes, hazardous procedures, or to present single-study conclusions as universal laws.

## Inputs required

Before executing the workflow, identify or request:

- Target system class and relevant constraints.
- Baseline expectation and its governing assumptions.
- Observable discrepancy or gap, including regime and uncertainty.
- Candidate mechanisms that could alter the baseline.
- Available observables, diagnostics, or proxies.
- Validation constraints (computational, experimental, ethical, safety).

## Core Workflow

1. **Frame the discrepancy.** State the baseline expectation, its assumptions, and the specific observable deviation. Document the evidence strength of the discrepancy itself.
   - *Decision gate:* If the discrepancy is unconfirmed or artifact-likely, stop and perform artifact screening before proceeding.

2. **Inventory candidate mechanisms.** List all processes that could explain the deviation. Distinguish true mechanism dependence from apparent dependence caused by units, normalization, geometry, boundary conditions, or observation-time limits.
   - *Decision gate:* If only one mechanism is plausible and already validated, skip to Step 7 (Boundary declaration). If none are plausible, stop and reformulate the baseline.

3. **Generate ranked hypotheses.** For each candidate, produce a falsifiable hypothesis card: mechanism statement, predicted signature, key assumption, likely failure mode, and evidence strength (established / moderate / weak / speculative). Include a null hypothesis that the baseline holds when the candidate mechanism is suppressed.
   - *Decision gate:* If hypotheses are not discriminable with available observables, redesign the diagnostic set before validation.

4. **Design minimal validation.** Define independent variables, mechanism-control variables, and regime contrasts. Specify positive controls (mechanism active), negative controls (mechanism suppressed), reference controls (baseline regime), and normalization or geometry controls. Define primary and secondary metrics, a mechanism-specific diagnostic, and pre-registered failure criteria.
   - *Decision gate:* If controls cannot isolate the mechanism from confounders, stop and revise the design.

5. **Execute and analyze.** Collect data or simulation outputs. Analyze in order:
   a. Check baseline recovery under null conditions.
   b. Track the mechanism diagnostic independently of the primary outcome.
   c. Classify the trend relative to baseline (preserved, weakened, saturated, reversed, ambiguous).
   d. Decompose contributions or compare qualitative signatures and residuals.
   e. Run normalization and rescaling checks.
   f. Compare weak-mechanism versus strong-mechanism regimes.
   g. Seek independent support from orthogonal diagnostics or theoretical constraints.
   - *Iteration gate:* If results are ambiguous, return to Step 3 to refine hypotheses or Step 4 to add controls. If results reject all hypotheses, return to Step 2.

6. **Assess collapse and scaling.** Where appropriate, test whether rescaled observables collapse across conditions. Treat collapse as evidence for a shared mechanism only if sensitivity checks support it.
   - *Decision gate:* If collapse fails, broaden the model to include competing mechanisms or regime-specific corrections before claiming universality.

7. **Declare boundaries and iterate.** State the domain where the revised understanding is plausible and where extrapolation is unjustified. Update the regime map. Decide whether to:
   - **Continue:** sharpen contrasts or test generalization.
   - **Pivot:** redirect to a new mechanism or tuning axis.
   - **Stop:** when additional measurements cannot discriminate hypotheses, safety limits are reached, or claims are sufficiently bounded.

## Output Format

1. **Research question:** Concise question grounded in the target system and discrepancy.
2. **Baseline and gap:** Null trend, assumptions, observed discrepancy, and evidence strength.
3. **Ranked hypotheses:** Three to five hypotheses, each with mechanism, predicted signature, key assumption, likely failure mode, and evidence strength.
4. **Validation design:** Independent variables, mechanism-control variables, regime contrasts, controls, primary and secondary metrics, mechanism diagnostic, and stopping conditions.
5. **Analysis plan:** Ordered checks for baseline recovery, mechanism tracking, trend classification, normalization, regime comparison, and independent support.
6. **Iteration decision:** Rules for strengthening, weakening, rejecting, or redirecting hypotheses based on outcomes.
7. **Validity and limitations:** Confounders, reproducibility checks, external validity boundaries, and speculative elements.

## Validation Gates

- Baseline assumptions must be verified before interpreting deviations.
- Mechanism diagnostics must be shown to track the proposed process rather than generic fluctuations.
- Controls must bracket the expected behavior; if they fail, mechanism claims are halted.
- Normalization and geometry artifacts must be ruled out before accepting mechanism claims.
- Statistical and numerical reliability must be reported, including uncertainties, convergence, and sensitivity to model choices.

## Claim Boundaries

- Distinguish observed proxy changes from direct measurements of hidden variables.
- Separate established methods from agent-inferred extensions.
- Limit claims to the studied system class, tuning range, and regime.
- Do not present single-study or single-model results as field-wide consensus.
- Mark extrapolations, analogy-based inferences, and speculative hypotheses clearly.

## Failure Modes

- **Artifact dominance:** The signal is explained by calibration drift, contact effects, preprocessing choices, or finite-size bias.
- **Non-identifiability:** Multiple mechanisms produce identical observable trends.
- **Control failure:** Positive or negative controls fail to bracket behavior.
- **Overfitting:** Scaling collapse or model fit is sensitive to arbitrary analysis choices.
- **Regime entanglement:** Mechanism regimes are confounded with other variable changes.
- **Observation-time bias:** Apparent history dependence or metastability is an artifact of window length.
- **Extrapolation error:** Claims extend beyond validated geometry, material, or parameter boundaries.

## Validity Checks

Before finalizing outputs, verify:

- Confounding by normalization, geometry, boundary conditions, initialization, or sampling.
- Reproducibility across replicates, seeds, analysis pipelines, and feature variants.
- Statistical validity: uncertainty propagation, null models, effect sizes, and censoring treatment.
- Model validity: scaling regime, continuum assumptions, and parameter identifiability.
- Mechanism specificity: whether the diagnostic uniquely indicates the mechanism.
- Evidence hierarchy: rank claims as theorem-based, simulation-supported, experimentally validated, analogy-based, or speculative.

## Provenance

Synthesized from cluster 211, subcluster 211.0. Source skills: mechanism-resolved-scaling-plasma-exploration (8a24745f), driven-metastability-hysteresis-exploration (6e6cfae3), driven-disorder-pca-phase-exploration (65f73f7b), elastic-wrinkling-research-pattern (56eaee9e), nanofluidic-polymer-mechanism-validation (32ac4d55), granular-bottleneck-transition-research-planning (274ec40e), low-dimensional-bose-correlation-explorer (55ed94c0), pressure-tuned-magnetic-topological-superconductivity-exploration (030bd2ad).
