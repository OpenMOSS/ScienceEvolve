---
name: sci-urban-ml-surrogate-mechanism-discovery-workflow-5b0757d4
description: Design end-to-end research plans that use machine-learning surrogates to discover, discriminate, and validate physical mechanisms in uncertain engineered systems, with iterative validation gates and explicit claim boundaries.
scienceevolve-title: "Urban hazard resilience · ml surrogate mechanism discovery workflow"
scienceevolve-area: urban-hazard-resilience
---

# Purpose

Help an agent transform a complex-system prediction gap into a mechanism-informed research plan. The workflow combines structured sampling, interpretable surrogate modeling, controlled validation, and iterative hypothesis updating to discover which variables and physical mechanisms drive threshold crossing, response severity, or system-level behavior—without overgeneralizing from a single study.

# When to use

Use this skill when the user asks to:

- Propose new research questions for multi-parameter risk, response prediction, threshold-exceedance analysis, or performance forecasting in engineered systems.
- Design a workflow that combines structured sampling, reference data generation, and interpretable machine learning to test mechanism hypotheses.
- Compare multi-parameter or surrogate-based analysis against classical single-parameter or simplified baselines.
- Identify influential system attributes and generate follow-up hypotheses under hazard loading, environmental variability, or operational uncertainty.
- Convert a paper-level method into a reusable research workflow without copying object-specific setups.

Do not use this skill for operational safety certification, emergency response, construction guidance, field intervention, or direct structural-design decisions.

# Inputs required

Before producing a plan, collect or infer:

- **Target system family:** type, material class, geometry scale, and dominant behavioral regime.
- **Hazard or stressor:** loading scenario, environmental condition, or operational excitation family.
- **Vulnerable components and thresholds:** performance states, exceedance events, or failure-relevant transitions.
- **Candidate variables:** intensity measures, system attributes, boundary conditions, component properties, and environmental covariates.
- **Reference data source:** simulation, experiment, field measurement, inspection record, or curated dataset used to generate labels.
- **Baseline methods:** classical curves, single-factor analysis, simplified probabilistic models, or existing empirical approaches.
- **Claim boundary:** interpolation within a defined domain, extrapolation to new configurations, or domain transfer to another system class.
- **Constraints:** computational budget, data scarcity, measurement uncertainty, safety review requirements, and reproducibility expectations.

# Core Workflow

Follow this ordered end-to-end route. Treat each gate as a hard stop or redesign trigger.

1. **Frame the mechanism gap**
   - Define the prediction mismatch or modeling gap: what existing models fail to represent.
   - Separate known mechanisms from uncertain ones (e.g., multi-factor interaction, boundary-condition sensitivity, configuration effect, threshold uncertainty).
   - State why single-parameter or simplified analysis may be insufficient.
   - **Gate:** If the gap cannot be linked to a plausible physical mechanism, stop and reformulate the research question.

2. **Map variables and hypothesize mechanisms**
   - Separate intensity variables, system attributes, component properties, boundary conditions, and covariates.
   - Propose mechanism-first hypotheses that tie each variable to demand, capacity, or their interaction.
   - Assign evidence strength (strong, moderate, weak, speculative) and list key assumptions.
   - Define predicted observations, failure modes, and minimal validation tests for each hypothesis.
   - **Gate:** If hypotheses lack mechanistic plausibility or cannot be tested with available data, return to Step 1.

3. **Design structured evidence generation**
   - Construct a representative sample database using structured or stratified sampling.
   - Cover plausible variable combinations while preserving realistic physical correlations.
   - Generate labels from defensible thresholds via the reference workflow; use progressive states when behavior evolves.
   - Define positive, negative, baseline, and ablation controls upfront.
   - **Gate:** If critical variable combinations are missing or labels are indefensible, expand sampling or stop.

4. **Build and compare surrogate models**
   - Train at least one interpretable or inspectable surrogate and one baseline model.
   - Compare multiple model families using held-out validation or repeated validation.
   - Select candidates based on accuracy, calibration, stability, and interpretability.
   - Validate on held-out scenarios, system configurations, or loading families distinct from training.
   - **Gate:** If held-out predictive performance is inadequate or calibration is poor, revisit descriptors, sampling, or model family before mechanism interpretation.

5. **Interpret and discriminate mechanisms**
   - Use feature importance, partial dependence, latent-space diagnostics, or comparable methods to identify influential variables.
   - Condition analyses on relevant subdomains (e.g., intensity regimes, configuration classes) where mechanisms may differ.
   - Compare simple and complex mechanism explanations using the same discrepancy metric and validation logic.
   - Do not claim causality from model explanation alone.
   - **Gate:** If explanation trends conflict with domain mechanics or are unstable across splits, inspect for confounding, correlated variables, or extrapolation.

6. **Validate relevance and generalization**
   - Test whether local surrogate fidelity transfers to system-level or decision-relevant predictions.
   - Assess generalization across loading histories, structural families, environmental conditions, or noise regimes.
   - Quantify the association between surrogate error and target-system error.
   - Run subgroup and tail-case evaluations for high-consequence scenarios.
   - **Gate:** If controls fail, generalization is poor, or tail errors are unacceptable, narrow the claim boundary or reject the hypothesis.

7. **Iterate and update hypotheses**
   - Treat strong prediction + stable explanation + domain alignment as supportive evidence for a mechanism.
   - If prediction is strong but explanation is unstable: repeat validation, check encodings and correlations, and narrow the claim to prediction only.
   - If explanation is plausible but prediction is weak: improve coverage, threshold logic, or model capacity before claiming a mechanism.
   - If partial-dependence trends conflict with mechanics: add conditional analyses, ablations, or targeted data near boundaries.
   - **Stop conditions:** Stop if labels are not defensible, validation overlaps training scenarios, explanations rely on extrapolation, or the result would affect safety decisions without independent expert review.

8. **Document boundaries and archive provenance**
   - State explicit claim boundaries: interpolation versus extrapolation, tested system classes, and loading families.
   - Label each conclusion by evidence strength (validated, inferred, speculative, unsupported).
   - Record data provenance, preprocessing, splits, seeds, model variants, and evaluation scripts.
   - Route any safety-critical application to independent domain expert review.

# Output Format

When using this skill, produce:

1. **Research question** — One concise mechanism-centered question, the modeling gap, and the claim boundary.
2. **Mechanism map** — Intensity variables, system variables, component variables, covariates, and expected mechanism roles.
3. **Hypotheses** — For each: mechanism, evidence strength, key assumptions, predicted observation, failure mode, and minimal validation.
4. **Experimental design** — Sampling strategy, variables, thresholds, controls, model variants, metrics, and stopping conditions.
5. **Analysis plan** — Predictive evaluation, baseline comparison, feature importance, partial dependence or equivalent interpretation, subgroup and tail-case review, and uncertainty checks.
6. **Iteration plan** — Rules for revising, narrowing, or rejecting hypotheses based on results.
7. **Validity and safety statement** — Confounding factors, reproducibility needs, extrapolation limits, and independent-review requirements.

# Validation Gates

Before advancing past each workflow stage, confirm:

- **Mechanism alignment:** Each variable has a plausible role in the target response.
- **Threshold validity:** Labels or exceedance states are defensible and uncertainty-aware.
- **Sampling coverage:** The database covers the intended domain without unrealistic gaps or clusters.
- **Data leakage:** Training and validation scenarios are genuinely separated; scenario groups remain intact.
- **Baseline strength:** Classical, single-factor, and ablated comparisons are included.
- **Statistical validity:** Repeated runs, uncertainty intervals, calibration, and sensitivity analyses are reported.
- **Interpretability limits:** Feature importance and partial dependence are treated as model explanations, not causal proof.
- **Control adequacy:** Positive, negative, baseline, and ablation controls support the intended interpretation.
- **Safety relevance:** Life-safety, infrastructure-operation, and regulatory uses are routed to independent expert review.

# Claim Boundaries

- Predictive accuracy is evidence of correlation, not proof of causation.
- Claims are bounded to the sampled domain unless explicitly validated elsewhere.
- Interpolation and extrapolation must be clearly separated; extrapolation claims require targeted data or must be rejected.
- Surrogate model behavior is a research object, not a substitute for high-fidelity reference workflows in safety-critical decisions.
- Single-study conclusions must not be presented as field-wide consensus.

# Failure Modes

- **Data leakage:** Duplicated scenarios, shared sources, or preprocessing contamination between training and validation.
- **Unstable explanation:** Feature rankings or partial-dependence trends that change across splits, seeds, or sampling choices.
- **Surrogate extrapolation:** Optimization or interpretation outside the sampled parameter region.
- **Poor calibration:** Overconfident predictions under high uncertainty or out-of-distribution inputs.
- **Confounded parameters:** Non-identifiable variables where multiple mechanism hypotheses produce identical fits.
- **Distribution shift:** Training and target domains differ in loading, system configuration, or environmental condition.
- **Tail-case neglect:** Good average performance masking unacceptable errors in rare, high-consequence scenarios.
- **Mechanism overreach:** Interpreting model fit as validation of a physical mechanism without independent evidence.

# Validity Checks

Before finalizing a research plan or interpreting results:

- Verify that the reference workflow is credible for the target system and documented.
- Check that data splits are independent and that scenario groups are not fractured.
- Ensure baseline models are fairly implemented and not used as strawmen.
- Confirm that surrogate errors are acceptable in regions influencing the research conclusions.
- Inspect whether high-error cases cluster by a physical factor that suggests a missing mechanism.
- Validate that derived response quantities or metrics remain physically plausible.
- Document all variable definitions, sampling protocols, model settings, and random seeds.
- Confirm that conclusions are labeled by evidence strength and that speculative claims are flagged.

# Provenance

Derived from cluster 3, subcluster 3.1 ("machine-learning-assisted mechanism discovery and validation"). Synthesized from source skills: `interpretable-seismic-fragility-workflow`, `seismic-shm-surrogate-research`, `seismic-damage-ml-research-workflow`, `seismic-calibration-relevance-research`, `npp-seismic-virtual-sensing-research-workflow`, `surrogate-updating-seismic-response-exploration`, `uncertainty-driven-rbdo-research`, `wind-wake-rans-research-workflow`. Source-specific systems, parameters, and numerical results have been abstracted out to produce a domain-agnostic reusable workflow.
