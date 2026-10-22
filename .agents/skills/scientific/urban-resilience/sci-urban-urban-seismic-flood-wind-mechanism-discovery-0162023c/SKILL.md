---
name: sci-urban-urban-seismic-flood-wind-mechanism-discovery-0162023c
description: A reusable end-to-end workflow for designing research questions and controlled experiments to discover, discriminate, and validate physical mechanisms in complex urban and natural systems driven by observables across seismic, flood, wind, and coupled-process domains.
scienceevolve-title: "Urban hazard resilience · urban seismic flood wind mechanism discovery workflow"
scienceevolve-area: urban-hazard-resilience
---

# Purpose

This skill helps an agent convert an observable-driven problem in complex physical systems—such as urban infrastructure under seismic, flood, or wind loads, or coupled environmental transport processes—into a structured research plan for mechanism discovery and validation. It abstracts a shared pattern: frame a decision-relevant gap, generate competing mechanistic hypotheses, design controlled comparisons with explicit baselines and ablations, propagate and audit uncertainty, and bound claims by evidence strength and regime of validity.

# When to use

Use when the user asks for research-question generation, hypothesis design, experiment planning, or validation strategy in domains where observables (measurements, simulations, spatial indicators, or time-series) must be linked to underlying mechanisms. Applicable to coupled driver-state systems, structural or infrastructure resilience, stochastic spatial variability, reduced-order model correction, resource forecasting, and multi-source spatial assessment. Do not use for operational emergency response, certified engineering design, or as a substitute for domain-expert safety review.

# Inputs required

- Target system, spatial or temporal domain, and decision context.
- Observable data and their provenance (measurements, images, time-series, survey data, simulation outputs).
- Baseline model, index, or prevailing assumption to compare against.
- Candidate mechanisms and the physical or empirical links that could explain observed patterns.
- Available benchmarks, independent validation data, or literature reference points.
- Constraints on data quality, scale, computational resources, and ethical/safety boundaries.

# Core Workflow

1. **Frame the decision gap**
   - Define the prediction, ranking, or planning decision that current methods cannot support.
   - State why a single model, uncoupled approach, or aggregate index is insufficient.
   - *Decision gate*: If the gap cannot be expressed as a falsifiable mechanism question, reformulate before proceeding.

2. **Inventory observables and baseline assets**
   - Catalog data sources, spatial/temporal coverage, resolution, and known biases.
   - Identify the baseline model, workflow, or indicator system to serve as the control.
   - Document preprocessing, harmonization needs, and missing-data risks.
   - *Decision gate*: If baseline behavior cannot be independently checked against known patterns, stop and collect validation data.

3. **Generate competing mechanism hypotheses**
   - Propose at least two hypotheses that explain the observable pattern through distinct physical, statistical, or coupling mechanisms.
   - For each hypothesis, state: expected mechanism, evidence strength (high/medium/low/speculative), key assumptions, and likely failure modes.
   - *Decision gate*: If hypotheses are not mutually exclusive or not mechanism-linked, redesign.

4. **Design controlled comparison**
   - Define independent variables (mechanism variants, model corrections, parameter families, scenarios).
   - Define dependent variables (response metrics, downstream planning metrics, spatial patterns, uncertainty indices).
   - Establish controls:
     - **Negative control**: baseline without the proposed mechanism.
     - **Ablation control**: enhanced model with the candidate mechanism disabled.
     - **Positive control**: a case with expected directional behavior.
     - **External-reference control**: independent data not used for tuning.
   - Set stop conditions: driver/baseline misfit, artifact dominance, qualitative conclusion reversal under small assumption changes, or insufficient data.
   - *Decision gate*: If controls cannot isolate the intended mechanism from numerical, boundary, or confounding effects, redesign.

5. **Execute validation pipeline**
   - Run deterministic baseline and check consistency against independent evidence.
   - Execute local sensitivity analysis to identify dominant parameters or indicators.
   - Execute sampling-based or scenario-based uncertainty propagation.
   - Check convergence of stochastic statistics, spatial patterns, or temporal stability before interpreting trends.
   - *Decision gate*: If baseline fails independent checks or convergence is not demonstrated, stop and debug.

6. **Discriminate mechanisms**
   - Compare model variants or indicator systems against matched controls.
   - Attribute differences to mechanisms only when ablation and single-factor tests support the link.
   - Evaluate regime-specific performance (near-field/far-field, high/low loading, seasonal, spatial strata) rather than relying solely on aggregate scores.
   - Exclude mechanisms that fail ablation or that improve only one metric while degrading physically important quantities.
   - *Decision gate*: If the effect disappears under ablation or is indistinguishable from numerical artifacts, reject the mechanism.

7. **Uncertainty audit and robustness check**
   - Stress-test conclusions against alternative assumptions: boundary conditions, weighting schemes, spatial aggregation, parameter dependence, and input ensembles.
   - Test scale effects (individual asset vs. regional portfolio, local vs. system response).
   - Report stable conclusions separately from assumption-dependent conclusions.
   - *Decision gate*: If conclusions reverse under plausible, defensible assumption changes, bound claims or stop.

8. **Bound claims and document failure modes**
   - State claim boundaries explicitly: tested regimes, spatial/temporal limits, evidence strength, and transfer restrictions.
   - Distinguish demonstrated results from extrapolated inference.
   - List residual failure modes: proxy invalidity, boundary artifacts, scale mismatch, unmeasured confounders, and feedback loops not represented.
   - *Decision gate*: If claims cannot be bounded by tested conditions, downgrade to hypothesis or speculative.

9. **Iterate or redesign**
   - If a hypothesis is supported, narrow the claim to the tested regime and propose broader validation.
   - If partially supported, identify subgroups, regimes, or spatial contexts that drive the effect.
   - If unsupported, remove the mechanism and return to step 3.
   - If inconclusive due to data or validation gaps, prioritize data harmonization and independent validation before adding complexity.

# Output Format

When using this skill, produce:

1. **Research question** — concise, decision-relevant, framed as a mechanism gap.
2. **Gap and motivation** — why prevailing approaches are insufficient.
3. **Hypotheses** — table with mechanism, evidence strength, assumptions, and failure modes.
4. **Experimental plan** — variables, controls (negative, ablation, positive, external-reference), metrics, and stop conditions.
5. **Analysis plan** — baseline checks, sensitivity, uncertainty propagation, regime stratification, and convergence criteria.
6. **Mechanism discrimination summary** — which mechanisms are supported, excluded, or undetermined, with attribution reasoning.
7. **Claim boundaries** — explicit limits on generalization, scale, and evidence strength.
8. **Failure modes** — residual risks and likely sources of invalid inference.
9. **Iteration plan** — next steps for supported, partial, unsupported, or inconclusive outcomes.
10. **Validity and ethics notes** — confounders, reproducibility requirements, safety boundaries, and non-operational use constraints.

# Validation Gates

- **Baseline fidelity gate**: Baseline must reproduce independent observations or known qualitative behavior before mechanism variants are tested.
- **Convergence gate**: Stochastic, spatial, or temporal statistics must stabilize before trend interpretation.
- **Attribution gate**: Mechanism-specific effects must survive ablation and single-factor controls.
- **Robustness gate**: Primary conclusions must remain stable under alternative boundary conditions, weighting schemes, or plausible parameter changes.
- **Scale-consistency gate**: Claims at one scale must not be assumed to hold at another without explicit cross-scale testing.
- **Decision-relevance gate**: Forecast or model improvement must demonstrably affect the downstream planning metric, not only a pointwise accuracy score.

# Claim Boundaries

- Do not generalize beyond tested system types, disturbance regimes, spatial domains, data-quality conditions, or model families.
- Distinguish established empirical evidence, mechanism-supported analogies, and new agent inferences.
- Do not present research findings as operational safety directives, emergency guidance, or certified design recommendations.
- Mark any transfer to new sites, asset classes, or hazard regimes as a hypothesis requiring independent validation.

# Failure Modes

- **Driver/baseline error**: The baseline model or prevailing index is already misfit, making relative improvements meaningless.
- **Boundary and truncation artifacts**: Artificial reflections, domain-edge effects, or aggregation smoothing dominate the signal.
- **Proxy invalidity**: Indicators do not measure the intended mechanism.
- **Scale mismatch**: Individual-asset behavior is incorrectly extrapolated to regional aggregates, or local effects are lost in averaging.
- **Confounding by unmeasured sources**: Unobserved variables generate spurious patterns.
- **Numerical instability**: Mesh sensitivity, solver settings, or data-transfer errors prevent clean attribution.
- **Feedback neglect**: One-way coupling or static assumptions miss important state-to-driver or structure-to-soil interactions.
- **Overfitting to single events or regimes**: Mechanisms validated on one scenario fail under shifted conditions.

# Validity Checks

- **Confounding**: Check for inventory bias, sensor artifacts, missing data patterns, boundary effects, interpolation errors, and unmeasured source contributions.
- **Reproducibility**: Record data versions, model versions, preprocessing steps, random seeds, parameter mappings, spatial/temporal aggregation rules, and scenario definitions.
- **Statistical validity**: Use temporal or spatial validation splits, report uncertainty intervals, demonstrate convergence, and account for multiple comparisons.
- **Boundary conditions**: Test alternative disturbance magnitudes, domain extents, boundary formulations, and initial-state assumptions.
- **External validity**: Restrict generalization to tested regimes; treat new systems, scales, or hazard types as requiring additional evidence.
- **Proxy and representativeness**: Verify that each indicator or parameter plausibly represents its target mechanism and does not overrepresent specific groups, locations, or time periods.
- **Decision validity**: Confirm that model or index improvements actually change actionable conclusions, not just numerical precision.

# Provenance

- Synthesized from cluster 11.2 (observable-driven mechanism discovery and validation).
- Source skills: 10.1111_jfr3.12747, 10.1007_s10518-017-0168-9, 10.1002_eqe.3587, 10.3390_en15238901, 10.1002_tal.70011, 10.1002_eqe.2799, 10.1049_iet-rpg.2020.0416, 10.3390_land13010053.
