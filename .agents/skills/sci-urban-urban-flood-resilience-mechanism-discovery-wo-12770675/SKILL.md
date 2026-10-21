---
name: sci-urban-urban-flood-resilience-mechanism-discovery-wo-12770675
description: A reusable end-to-end workflow for discovering, discriminating, and validating mechanisms that shape urban flood resilience through structured evidence synthesis, multi-model comparison, and iterative hypothesis refinement.
scienceevolve-title: "Urban hazard resilience · urban flood resilience mechanism discovery workflow"
scienceevolve-area: urban-hazard-resilience
---

# Purpose

Help an agent design and execute transferable research plans that discover and validate mechanisms linking urban subsystems, spatial processes, and interventions to flood resilience outcomes. The skill abstracts an end-to-end pattern from urban flood, nature-based solution, and spatial risk studies: frame the coupled system, generate mechanism-grounded hypotheses, compare multiple models or structural representations, validate with strong controls, and iterate based on evidence.

# When to use

Use this skill when the task involves:
- Generating new research questions on urban flood resilience, spatial risk, susceptibility, or blue-green/hybrid infrastructure performance.
- Designing studies that compare baseline, conventional, nature-based, or hybrid scenarios across spatial and temporal scales.
- Investigating subsystem coupling (social, economic, environmental, infrastructural, governance) and how it mediates or moderates resilience.
- Interpreting spatial heterogeneity, temporal change, network/co-occurrence patterns, or higher-order spatial structure as hypothesis signals.
- Iterating hypotheses after model disagreement, validation failure, or sensitivity instability.

Do not use this skill for operational emergency response, construction-ready engineering instructions, direct public-safety directives, or clinical/epidemiological operational decisions.

# Inputs required

Ask for or infer:
1. **Target system**: city, district, watershed, or comparable spatial unit; urban form and governance context.
2. **Hazard scope**: flood mechanism, severity class, recurrence context, or climate stressor.
3. **Outcome definition**: resilience level, recovery capacity, loss reduction, service continuity, risk state, or adaptive capacity.
4. **Candidate mechanisms/subsystems**: plausible drivers, process channels, intervention families, or coupling hypotheses.
5. **Data sources**: event records, geospatial layers, infrastructure logs, surveys, administrative data, or literature corpus; include spatial resolution, temporal coverage, and known biases.
6. **Comparison context**: baseline conditions, alternative interventions, comparator units, or policy periods.
7. **Constraints**: ethical approvals, data privacy, equity considerations, computational limits, and reproducibility requirements.

If inputs are missing, state assumptions explicitly and label them provisional.

# Core Workflow

Follow this ordered route. At each gate, decide whether to proceed, refine, narrow, or stop.

**Stage 1 — Frame the coupled system and evidence gap**
- Define the urban system as interacting subsystems. Specify the hazard, outcome, spatial boundary, and time window.
- Identify the evidence gap: which mechanism, coupling, or intervention pathway is underrepresented.
- *Gate*: Stop and redefine if the outcome is unmeasurable, the boundary is ambiguous, or the gap is purely descriptive without a mechanism focus.

**Stage 2 — Build the mechanism model and evidence base**
- Map candidate process channels from drivers to outcomes. Prefer variables that represent distinct mechanisms over redundant proxies.
- Construct a transparent evidence base: case-factor incidence, structured literature extraction, or comparable geospatial units. Document coding rules, inclusion/exclusion criteria, and transformation steps.
- Represent relationships (network, spatial, temporal, or higher-order) only with explicit mechanism justification; keep raw evidence traceable.
- *Gate*: Recode or stop if factors are circular, proxies are invalid, or source quality is too weak to support coding.

**Stage 3 — Generate ranked hypotheses**
- Produce hypotheses at three levels: global driver, interaction/moderation, and spatial/temporal heterogeneity.
- For each hypothesis record: statement, mechanism, expected signal, evidence strength (low/medium/high), key assumptions, likely failure modes, and minimal viable test.
- *Gate*: Narrow scope or stop if hypotheses are not falsifiable with available or obtainable data.

**Stage 4 — Design minimum viable validation with strong controls**
- Define the unit of analysis and variables by role (outcome, predictors, mediators/moderators, controls).
- Include baselines (simple model, temporal-only, pairwise, business-as-usual), negative controls (placebo outcomes, shuffled labels, irrelevant predictors), and positive controls (known drivers or established benchmarks).
- Prevent spatial and temporal leakage in splits; account for rare events, class imbalance, and small-area instability.
- *Gate*: Redesign if controls are inadequate, leakage is unresolvable, or the design requires unsafe/non-compliant data collection.

**Stage 5 — Execute multi-method analysis and progressive model comparison**
- Fit models from simple to complex: baseline main effects → spatial/temporal/network structure → interaction/moderation terms → complex alternatives only if justified.
- Compare across model families or evidence types; use model disagreement as a signal for nonlinearity, local effects, or representation sensitivity.
- Inspect diagnostics: convergence, identifiability, residual structure, multicollinearity, and factor importance stability.
- *Gate*: Simplify or stop if models are unidentified, diagnostics fail, or complexity does not improve explanatory value.

**Stage 6 — Validate mechanisms and attribute gains**
- Compare against independent evidence (hold-out regions, periods, sources, or expert review).
- Run ablations and shuffled controls to attribute whether gains come from structural relationships, temporal dynamics, or covariate confounding.
- Test spatial heterogeneity: examine residual clustering, zone-specific performance, and whether local deviations generate new hypotheses.
- *Gate*: Exclude the mechanism and return to Stage 3 if validation fails or negative controls perform near the main model.

**Stage 7 — Uncertainty audit and claim bounding**
- Quantify uncertainty: intervals, sensitivity to boundary choices, weighting schemes, factor granularity, and lag structures.
- Run robustness checks: alternative indicators, subgroup splits, missing-data handling, and perturbation of topology or neighbor definitions.
- Bound claims by labeling them as workflow-validated, locally observed, model-supported, or agent-inferred.
- *Gate*: Weaken claims or stop if results depend on a single fragile construction choice or reverse under sensitivity tests.

**Stage 8 — Iterate or redesign**
- **If robust**: strengthen the mechanism hypothesis and design transferability tests to new contexts, scales, or hazard regimes.
- **If mixed**: refine the mechanism model, recode factors, add covariates, or split hypotheses by context rather than forcing a pooled conclusion.
- **If failed**: abandon the hypothesis, document the failure mode, and return to Stage 2 or 3.
- **Stop conditions**: persistent confounding, unresolvable leakage, data quality too poor, ethical barriers, no reproducible gain over strong baselines, or results that depend entirely on one unverified covariate.

# Output Format

Return:
1. **Research question and scope**: target system, hazard, outcome, and why it matters.
2. **Mechanism model and evidence map**: candidate channels, factor taxonomy, evidence source, and coding rules.
3. **Ranked hypotheses table**: hypothesis, mechanism, expected signal, evidence strength, assumptions, failure modes, minimal test.
4. **Study design**: unit of analysis, variables, baselines, negative/positive controls, evaluation metrics, and stop conditions.
5. **Analysis plan**: progressive model sequence, diagnostics, attribution strategy, and uncertainty reporting.
6. **Validation and robustness results**: independent checks, ablation outcomes, spatial diagnostics, and sensitivity summary.
7. **Iteration plan**: proceed/refine/narrow/stop rules for each hypothesis.
8. **Claim boundary statement**: what is validated, what is inferred, what remains untested, and transferability limits.

# Validation Gates

- **System framing gate**: boundary clarity, outcome measurability, and unit consistency.
- **Mechanism gate**: factor distinctness, proxy validity, absence of circularity, and traceable evidence.
- **Hypothesis gate**: falsifiability, testability, and explicit evidence-strength labeling.
- **Design gate**: control adequacy, leakage prevention, temporal validity, and ethical compliance.
- **Model gate**: convergence, identifiability, diagnostic pass, and complexity justification.
- **Attribution gate**: independent validation support, ablation consistency, and confounder removal.
- **Robustness gate**: stability under sensitivity tests, alternative specifications, and subgroup checks.
- **Ethics gate**: privacy protection, equity representation, non-stigmatization, and data governance.

# Claim Boundaries

- Distinguish workflow-validated methods from agent-inferred hypotheses.
- Label evidence as: source-paper-supported, cross-study-supported, locally observed, model-supported, or speculative.
- Do not present single-study, single-model, or single-context results as field-wide consensus.
- Limit causal language to what the study design supports; treat network priority, co-occurrence, and spatial pattern as hypothesis generators, not proof of intervention effectiveness.
- Mark transferability boundaries explicitly: scale, hazard intensity, urban form, governance context, and data regime.

# Failure Modes

- Confounding by exposure intensity, baseline development, reporting bias, policy endogeneity, or temporal leakage.
- Indicator redundancy or multicollinearity masking true pathways.
- Spatial autocorrelation or clustering artifacts mistaken for causal mechanism.
- Overfitting from complex models with weak controls or small samples.
- Shortcut learning where models rely on background context rather than mechanism proxies.
- Reverse causality or endogeneity in subsystem relationships.
- Boundary mismatch from mixing incompatible spatial, temporal, or administrative units.
- Equity blindness: underrepresentation of vulnerable groups, informal settlements, or non-digital sources.
- Operational overreach: generating unsafe or construction-ready recommendations from research outputs.

# Validity Checks

- **Confounding**: assess unmeasured drivers, selection bias in intervention placement, and omitted variables.
- **Reproducibility**: document codebook, inclusion rules, preprocessing, random seeds, splits, and software versions.
- **Statistical validity**: report uncertainty quantification, model diagnostics, sensitivity to construction choices, and variability across repeated runs.
- **Temporal validity**: enforce causal ordering, check stationarity, align lags, and distinguish co-occurrence from precedence.
- **Spatial validity**: ensure unit comparability, justify neighbor definitions, align resolutions, and avoid ecological fallacy.
- **External validity**: state scope of generalization and where findings should weaken or fail.
- **Ethics and equity**: evaluate whether indicators stigmatize neighborhoods, whether vulnerable populations are visible, and whether data use respects privacy and governance constraints.

# Provenance

- Synthesized from cluster 12.0 (flood-urban-identification-resilience-mechanism-discovery).
- Source skills: flood-community-function-loss-exploration; urban-flood-resilience-research-design; urban-flood-spatial-risk-exploration; urban-flood-nbs-research-workflow; spatiotemporal-disease-mapping-workflow; simplicial-spatiotemporal-research; constrained-innovation-industrial-transition-exploration; visual-flow-structure-anemometry.
- Represents an end-to-end mechanism discovery and validation archetype, not a domain×action matrix or paper summary.
