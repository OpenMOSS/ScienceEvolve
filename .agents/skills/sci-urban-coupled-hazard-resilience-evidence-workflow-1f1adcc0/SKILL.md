---
name: sci-urban-coupled-hazard-resilience-evidence-workflow-1f1adcc0
description: Reusable end-to-end workflow for mechanism-grounded research design, controlled validation, and evidence-audited claim bounding in coupled hazard, urban, and structural resilience domains.
scienceevolve-title: "Urban hazard resilience · coupled hazard resilience evidence workflow"
scienceevolve-area: urban-hazard-resilience
---

## Purpose

Guide agents to convert a complex-system resilience or coupled-hazard research idea into a transferable, evidence-audited research plan. The workflow covers hypothesis generation, controlled experimental design, platform validation, multi-metric analysis, iteration, and explicit claim bounding—without reproducing source-specific models, parameters, or conclusions.

## When to use

Use when a user asks for new research questions, hypotheses, experimental designs, simulation plans, analysis workflows, or iteration strategies for:

- Coupled natural hazards (wind, seismic, wave, multi-physics) interacting with structures or urban systems.
- Urban morphology, building aerodynamics, or flow-interference effects on load and response.
- Structural retrofit, fragility, or state-dependent vulnerability under multi-hazard conditions.
- Numerical forecast or CFD configuration testing with downstream propagation concerns.
- Any domain where mechanism isolation, multi-case robustness, and evidence labeling are required.

Do not use for operational forecasting, emergency directives, construction-ready design, or safety-critical decisions without qualified domain review.

## Inputs required

- Target system class and boundary (what is included/excluded).
- Primary hazard or driver and secondary conditions or operating states.
- Decision context (screening, comparison, mechanism discovery, or proposal).
- Candidate configurations or interventions to compare.
- Baseline and conventional comparator (if evaluating alternatives).
- Available evidence platform (simulation, experiment, field data, hybrid) and validation resources.
- Independent observation anchors or benchmarks for credibility checks.
- Constraints: compute budget, data access, safety/ethics boundaries, and reproducibility requirements.

## Core Workflow

1. **Frame the research gap and decision.**
   - Define the vulnerable configuration, coupled process chain, or interference question.
   - Identify the evaluation gap: missing recovery consequences, hidden trade-offs, unvalidated downstream propagation, or confounded morphology effects.
   - State the decision the study must support.

2. **Formulate mechanism-grounded hypotheses.**
   - Generate a primary hypothesis and at least two alternatives.
   - For each, specify: evidence strength (low/moderate/high or paper-supported/agent-inferred), key assumptions, predicted observation, likely failure mode, and boundary conditions.
   - **Decision gate:** If hypotheses cannot be falsified by baseline/comparator/sensitivity analysis, reformulate.

3. **Design controlled comparison.**
   - Define baseline (unmodified/unretrofitted/isolated), conventional comparator, and proposed intervention or configuration.
   - Establish strong controls (isolate one variable), negative controls (minimize suspected mechanism), positive controls (reproduce known effect), and ablation controls where feasible.
   - Fix shared settings (hazard records, preprocessing, boundary conditions, validation rules) across candidates unless they are the variable under study.
   - Define damage states, response metrics, or performance thresholds before analysis.

4. **Validate the evidence platform.**
   - Confirm model, simulation, or measurement credibility against benchmarks, prior experiments, or accepted checks relevant to the target regime.
   - Check convergence, repeatability, calibration, and uncertainty sensitivity.
   - **Stop condition:** If platform validation fails or is weaker than the intended inference, halt comparative claims and revisit fidelity.

5. **Execute multi-case, multi-metric analysis.**
   - Run analyses across multiple events, instances, or scenarios spanning the target regime.
   - Collect primary response metrics and secondary diagnostics (bias, variability, residuals, spatial/temporal patterns).
   - Map local demand to global response or downstream output; test whether upstream improvements propagate.
   - Quantify scatter and condition-dependent effects separately.

6. **Audit evidence and bound claims.**
   - Rank candidates transparently by individual metric, subgroup, and regime; do not collapse conflicting evidence into a single winner without explanation.
   - Label every conclusion as `paper-supported`, `cross-study-supported`, `agent-inferred`, or `not-established`.
   - State boundary conditions: system class, intensity range, operating state, environmental regime, and model fidelity.
   - **Decision gate:** If rankings are unstable under plausible assumptions or if confounding dominates, return to step 3 or 5.

7. **Iterate or stop.**
   - If results match the hypothesis, propose a stronger test (expand context, add second variable).
   - If results partially match, split the hypothesis by damage state, region, intensity range, or operating condition.
   - If results contradict, diagnose whether the cause is modeling assumptions, insufficient sampling, inappropriate metrics, or a real mechanism mismatch; revise hypothesis before adding cases.
   - If trade-offs appear (e.g., safety gain vs. recovery loss, performance vs. load penalty), convert to multi-objective framing.
   - **Stop conditions:** failed validation, unacceptable prediction error, damage states unmeasurable, hazard combinations physically inconsistent, inability to isolate mechanism, or results outside the validated domain.

## Output Format

When using this skill, produce:

1. **Research question** — Vulnerable configuration, coupled process, or interference question and the decision it supports.
2. **Gap and motivation** — What existing practice is insufficient and why the new comparison is needed.
3. **Hypotheses** — Primary and alternatives with evidence strength, assumptions, predicted observations, failure modes, and boundaries.
4. **Experimental design** — Baseline, comparators, controls, variables, shared assumptions, metrics, and stop conditions.
5. **Analysis plan** — Platform validation, primary errors, secondary diagnostics, downstream propagation checks, uncertainty treatment, and confounder checks.
6. **Iteration plan** — Rules for updating, narrowing, rejecting, or expanding hypotheses based on outcomes.
7. **Validity and ethics check** — Confounders, reproducibility risks, statistical limits, spatial/temporal boundaries, safety constraints, and evidence classification.

## Validation Gates

- Confirm all candidates share hazard records, model assumptions, damage mappings, and consequence assumptions.
- Verify model credibility before comparative claims.
- Check whether the intervention changes multiple mechanisms at once; if yes, split the study or add ablation variants.
- Ensure damage states or performance thresholds are defined before analysis.
- Test downstream propagation if an upstream configuration is selected.
- Report uncertainty, dispersion, and sensitivity to hazard selection, boundary conditions, and parameter choices.

## Claim Boundaries

- Distinguish paper-supported evidence from agent-inferred hypotheses and assumption-dependent claims.
- Limit conclusions to the tested system class, regime, and validation domain.
- Do not treat a single study’s result as field consensus or operational guidance.
- Avoid extrapolation to unvalidated scales, environments, design families, or safety-critical decisions.

## Failure Modes

- Platform validation fails or is weaker than the intended inference.
- Confounding variables (geometry, terrain, wind direction, operating state, hazard intensity) are not isolated.
- Rankings depend on a single case, metric, or modeling assumption.
- Upstream improvement does not propagate to downstream response.
- Mechanism cannot be isolated from competing explanations.
- Results are unstable under sensitivity or alternative reasonable metrics.
- Sensor or data sparsity makes rankings uninterpretable.

## Validity Checks

- **Confounding:** Are multiple variables changing simultaneously?
- **Reproducibility:** Are configurations, preprocessing, observations, and metric logic documented?
- **Statistical validity:** Are enough cases included to separate robustness from case-specific luck?
- **Model validity:** Does the platform reproduce benchmark behavior before new cases are interpreted?
- **Boundary clarity:** Are claims limited to tested morphology, climate, hazard regime, and system class?
- **Evidence separation:** Are validated findings, plausible mechanisms, and speculative extrapolations clearly labeled?
- **Operational boundary:** Does the output avoid presenting research results as operational forecasts, emergency directives, or construction-ready guidance?

## Provenance

- Synthesized from cluster 1.1 (wind-seismic-urban-cfd-evidence-analysis-workflow).
- Derived from source skills: `seismic-resilience-retrofit-research`, `typhoon-wind-wave-forecast-optimization-workflow`, `offshore-fragility-research-design`, `coupled-wind-aerodynamics-research-design`, `multiscale-urban-wind-load-research`, `urban-wind-cfd-research-pattern`, `curved-building-reynolds-exploration`, `seismic-response-research-workflow`.
- Retains shared patterns—mechanism-to-resilience, interaction-regime design, morphology-to-load, and geometry-mediated scale-effect validation—without source-specific parameters, numerical settings, or paper conclusions.
