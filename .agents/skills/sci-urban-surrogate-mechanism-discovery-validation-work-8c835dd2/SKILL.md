---
name: sci-urban-surrogate-mechanism-discovery-validation-work-8c835dd2
description: Use this skill when designing reusable end-to-end research plans that combine physics-informed simulation, machine learning surrogates, and structured validation to discover, test, and bound mechanistic hypotheses in complex physical systems.
scienceevolve-title: "Urban hazard resilience · surrogate mechanism discovery validation workflow"
scienceevolve-area: urban-hazard-resilience
---

# Purpose

Help an agent transform a complex physical-system prediction or explanation problem into a reproducible research workflow. The goal is to generate new research questions, hypotheses, and validation plans for surrogate models that estimate expensive or uncertain physical responses, while explicitly discovering and bounding the underlying mechanisms rather than treating the model as a black-box oracle.

# When to use

Use this skill when the task is to propose or design a new study in domains such as seismic and structural response, urban flood or waterlogging risk, built-environment wind, infrastructure degradation, or similar areas where:

- Direct simulation, testing, or measurement of a target response is costly or slow.
- The agent must choose input descriptors, model families, controls, and evaluation metrics.
- The user wants a research plan rather than a final operational or engineering decision.
- The problem involves prediction from physics, geometry, hazard, material, morphology, or environmental descriptors.

Do not use this skill to produce final design calculations, safety certification, construction recommendations, operational emergency advice, or as a substitute for domain-specific engineering review and governance.

# Inputs required

Ask for or infer the following before designing the study:

- **Target response:** the physical quantity to predict and its intended use boundary.
- **System class:** structure type, urban district, terrain context, material class, or component category.
- **Loading or hazard context:** excitation, climate, environmental loading, or operating conditions.
- **Available data source:** validated simulation, controlled tests, field observations, public datasets, or mixed sources.
- **Candidate descriptors:** physics, geometry, site, material, morphology, and context variables.
- **Baseline method:** current practice, simple physics-based estimator, default model, or previous surrogate.
- **Validation constraints:** available splits, external datasets, computational budget, safety-critical use boundaries, and reproducibility needs.

# Core Workflow

Follow this ordered end-to-end route. Do not skip decision gates.

## 1. Frame the gap and define mechanism hypotheses
Start from an expensive or uncertain physical response. Identify physics-grounded descriptors that plausibly control it. Define the mismatch between current evidence and explanatory need. Generate at least three mechanism hypotheses, each with:
- Evidence strength (strong, moderate, weak, speculative).
- Key assumptions.
- Predicted observable pattern.
- Possible failure modes.
- Boundary conditions.

**Decision gate:** Proceed only if the target response is measurable and the mechanism gap is well-defined. If the gap is ambiguous, stop and refine the research question.

## 2. Curate structured data with explicit provenance
Build or curate a dataset from simulations, tests, or observations. Document assumptions, preprocessing, and grouping. Separate forcing, geometry, response, and context variables. Inspect missingness, duplicates, and distribution coverage across regimes.

**Decision gate:** Stop if data cannot be made comparable across units or time, labels are unreliable, or critical response regimes are unrepresented. Redesign data collection or scope before modeling.

## 3. Establish baseline and partition responsibly
Define a physics-based or simple statistical baseline. Split data reproducibly into training, development, and test sets before any model selection. Use spatial or temporal blocking where proximity could cause leakage. Fix random seeds and document splits.

**Decision gate:** If the baseline is undefined, or if leakage is detected between partitions, redesign the split strategy before training.

## 4. Train and compare candidate surrogate models
Fit multiple model families reflecting different assumptions about nonlinearity, interactions, interpretability, and structure (e.g., interpretable vs. flexible, spatial vs. global, temporal vs. static). Tune hyperparameters only on development data. Evaluate candidates once on held-out or external data using multiple complementary metrics.

**Decision gate:** If no candidate beats the baseline on held-out data, stop and revisit descriptors, data coverage, target definition, or regime balance before iterating.

## 5. Diagnose residuals and interrogate mechanisms
Inspect errors by subgroup, regime, location, magnitude, and descriptor range. Run feature ablation, sensitivity analysis, and interaction checks. Treat spatially or temporally structured residuals as evidence of a missing mechanism, not mere noise. Determine whether predictor effects are stable or context-dependent.

**Decision gate:** If residuals are systematic in safety-relevant regimes, contradict known physics, or reveal unmodeled interactions, halt broad claims and reformulate hypotheses.

## 6. Simplify or hybridize parsimoniously
Reduce dimensionality or model complexity only after verifying that accuracy and interpretability are preserved across all target outputs and regimes. Retrain and revalidate after any simplification or component removal.

**Decision gate:** If simplification harms a target output, creates hidden tail errors, or makes the model unstable across splits, retain the more complex form or split models by output/regime.

## 7. Validate with controls and uncertainty audit
Evaluate against positive controls (known influential mechanisms), negative controls (irrelevant or permuted descriptors), and ablation studies. Report uncertainty, calibration, and robustness across resampling or scenarios. Test transfer to independent conditions or external data when available.

**Decision gate:** If controls fail, uncertainty dominates ranking decisions, or external validation collapses, narrow claims to the validated domain and stop generalization.

## 8. Bound claims and plan iteration
Label conclusions as validated, inferred, or speculative. State domain boundaries where the surrogate should not be applied. Generate the next research question by changing one scientific dimension at a time.

**Stop condition:** Stop when the method no longer improves decision-relevant performance, uncertainty is too high for the intended claim, or the scope reaches safety-critical deployment boundaries.

# Output Format

Return the research plan in this structure:

1. **Research question:** one concise question and its intended non-final-use boundary.
2. **Gap and mechanism map:** the domain gap, why it matters, and what is inferred rather than established.
3. **Hypotheses:** at least three hypotheses, each with mechanism, evidence strength, key assumptions, failure modes, and minimal test.
4. **Experimental design:** target response, descriptors, controls, candidate models, data split strategy, and minimum viable validation.
5. **Analysis plan:** metrics, subgroup checks, interpretability checks, residual diagnostics, and stopping conditions.
6. **Iteration plan:** how results will update hypotheses and what triggers redesign.
7. **Validity and safety notes:** confounders, distribution-shift risks, reproducibility requirements, and use boundaries.

# Validation Gates

- **Baseline superiority gate:** Candidate surrogates must outperform a meaningful baseline on held-out data for the target task.
- **Leakage prevention gate:** Spatial, temporal, or structural leakage between training and testing must be ruled out via blocking or independent validation.
- **Regime coverage gate:** Rare but high-consequence response regimes must be explicitly represented and evaluated.
- **Physics-consistency gate:** Predictions and sensitivity patterns must vary plausibly with known physical drivers; residual structure must be interpreted mechanistically.
- **Control separation gate:** Positive and negative controls must behave as expected before mechanism claims are accepted.
- **Stability gate:** Model rankings, feature importance, and sensitivity indices must be stable under reasonable resampling and alternative sampling designs.
- **Uncertainty gate:** Uncertainty must be quantified and must not dominate ranking or prioritization decisions without explicit acknowledgment.
- **Simplification gate:** Reduced-input or simplified models must be revalidated against full-input baselines for every output and regime of interest.

# Claim Boundaries

- Treat the best-performing model as conditional evidence for the studied regime, not as a universal conclusion or field consensus.
- Distinguish paper-validated, study-validated, inferred, and speculative claims in all outputs.
- Do not present one study’s result, ranking, or model choice as consensus across systems, regions, or hazard environments.
- Limit claims to tested variable ranges, structural or urban typologies, hazard regimes, data qualities, and model assumptions.
- Avoid causal claims unless the study design explicitly supports causal identification.
- Mark surrogate outputs as decision-support evidence for research planning, not as operational directives, safety certifications, or deployment authorizations.

# Failure Modes

- **Data leakage:** through spatial/temporal proximity, shared preprocessing, repeated sequences, or proxy variables.
- **Distribution shift:** between training and test or deployment conditions across loading, system, site, or context variables.
- **Metric masking:** good aggregate scores hiding unacceptable tail, subgroup, or regime-specific errors.
- **Overfitting:** to development data due to unstable optimization, excessive complexity, or insufficient regularization.
- **Confounding:** between loading intensity, structural or morphological properties, and environmental variables.
- **Missing mechanisms:** omitted variables or interactions causing systematic residual patterns.
- **Model-selection leakage:** validation cases influencing hyperparameter tuning or feature selection.
- **Extrapolation:** applying the surrogate beyond validated variable ranges, typologies, or hazard regimes.
- **Simplification harm:** reduced-input models failing for safety-relevant outputs or hiding tail risks.

# Validity Checks

Before presenting results, verify:

- **Confounding:** Apparent predictive power is not caused by data leakage, source artifacts, or proxy variables.
- **Distribution shift:** Training and test coverage are compared for all relevant descriptor classes.
- **Statistical validity:** Uncertainty is reported in metric comparisons, especially when model differences are small.
- **Reproducibility:** Splits, seeds, preprocessing, tuning protocol, and metric definitions are documented.
- **Physics consistency:** Predictions vary plausibly with known physical drivers and boundary conditions.
- **Boundary conditions:** Explicit statements of where the model should not be applied are included.
- **Spatial/temporal validity:** Blocking strategies prevent leakage; spatial weights or temporal windows are justified if used.
- **Interpretability validity:** Feature importance and local effects are supported by ablation, multicollinearity checks, and subgroup diagnostics.
- **Single-study limitation:** One study’s best model or ranking is not treated as field consensus.

# Provenance

- Synthesized from cluster 6.0: machine-learning-assisted mechanism discovery and validation.
- Source skills: seismic-response-surrogate-workflow; wind-fatigue-surrogate-research; urban-wind-surrogate-research-workflow; urban-flood-resilience-research-design; seismic-aging-surrogate-research; surrogate-sensitivity-seismic-design; spatial-interpretable-waterlogging-risk-workflow; structural-seismic-spatiotemporal-surrogate.
- Representative paper-derived source-skill IDs: 10.1007_s40996-025-02006-x; 10.1002_solr.202500576; 10.3390_atmos13020214; 10.1080_1573062x.2026.2651433; 10.9712_kass.2024.24.3.43; 10.1002_suco.70670; 10.7717_peerj.20977; 10.1177_13694332241281856.
