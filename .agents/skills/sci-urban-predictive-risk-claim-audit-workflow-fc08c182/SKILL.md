---
name: sci-urban-predictive-risk-claim-audit-workflow-fc08c182
description: A reusable end-to-end workflow for designing, validating, and iterating predictive risk or resilience studies while auditing evidence strength, bounding claims, and controlling for failure modes across environmental, structural, or spatial domains.
scienceevolve-title: "Urban hazard resilience · predictive risk claim audit workflow"
scienceevolve-area: urban-hazard-resilience
---

# Purpose

Help an agent turn a predictive risk or resilience assessment gap into a rigorous, reusable research plan. The workflow generates hypotheses, designs controlled validation, evaluates predictive models against strong baselines, and iterates from error patterns—without reproducing source-specific conclusions or prescribing operational safety determinations.

# When to use

Use when the user asks to:

- Propose new research questions in flood forecasting, seismic screening, structural health monitoring, hazard early warning, or spatial resilience planning.
- Design experiments that compare physical, data-driven, or hybrid predictive models.
- Validate predictive claims under incomplete data, distribution shift, or sparse monitoring.
- Audit whether plans, policies, or taxonomies align with independent risk evidence.
- Iterate on model errors, uncertainty, or failure modes to refine hypotheses.

Do not use for operational emergency response, final engineering clearance, public warning issuance, or jurisdiction-specific safety determinations.

# Inputs required

- **Target system or decision context:** basin, structure, region, asset class, or planning unit.
- **Operational decision and scope:** forecast horizon, spatial unit, or policy target.
- **Available data sources, descriptors, or observations:** coverage, resolution, refresh frequency, and known quality issues.
- **Reference labels or independent evidence:** source, method, and temporal/spatial alignment.
- **Candidate baselines and comparators:** current practice, simple rules, physical models, or established classifiers.
- **Known confounders and boundary conditions:** missingness patterns, sensor drift, regulation, nonstationarity, or spatial autocorrelation.
- **Intended claim type:** predictive, explanatory, comparative, or policy-alignment.

# Core Workflow

1. **Frame the decision gap and research question**
   - State the operational decision that should improve and the current information failure.
   - Define the target variable, outcome classes, or risk state and the forecast horizon or spatial scope.
   - *Decision gate:* Stop if the question cannot be linked to a falsifiable prediction or observable mismatch.

2. **Generate mechanism-grounded hypotheses**
   - For each candidate mechanism, state the expected driver-response relationship.
   - Label evidence strength (exploratory, plausible, prior-supported, locally supported).
   - List key assumptions, minimal falsification test, and likely failure modes (e.g., distribution shift, label noise, confounding, missing descriptors).
   - *Decision gate:* Reject hypotheses that lack a plausible observable consequence or defensible validation path.

3. **Design controlled validation**
   - Define study arms: complete-information, incomplete-information, scenario-analysis, domain-shift, and comparator arms.
   - Select controls: strong baseline, positive control, negative control, and ablation controls.
   - Choose metrics matched to the decision context: event-critical, class-level, calibration, and robustness metrics—not only aggregate accuracy.
   - Define stop conditions before running experiments (e.g., temporal leakage detected, baseline not beaten, event-critical performance degrades).

4. **Audit data and construct features**
   - Inspect coverage, missingness, alignment, sensor consistency, and temporal/spatial leakage risks.
   - Build mechanism-informed features with interpretable pathways; avoid duplicative or circular descriptors.
   - Document all transformations, splits, and preprocessing decisions.

5. **Train, compare, and evaluate models**
   - Fit candidate models under the same protocol.
   - Compare against the strongest relevant baseline first.
   - Decompose errors by event type, lead time, subgroup, missingness regime, and spatial or temporal cluster.
   - Assess uncertainty, calibration, and stability across runs or scenarios.
   - *Decision gate:* If the candidate does not outperform the strong baseline on event-critical or chronological validation, halt and redesign.

6. **Iterate from failure modes**
   - Classify dominant errors: bias, delay, underpredicted peaks, domain shift, overfitting, sensor artifact, or policy confounding.
   - Map each failure to a design element: feature, lag, model family, data quality, or split strategy.
   - Apply the smallest intervention that addresses the mechanism.
   - Re-run the same evaluation matrix and update evidence strength labels.
   - *Iteration stop:* Stop adding complexity when out-of-distribution or chronological performance no longer improves.

7. **Bound claims and report**
   - Separate verified workflow patterns, domain-plausible mechanisms, and agent-inferred hypotheses.
   - State boundary conditions where the claim should not be extrapolated.
   - Flag required escalation to detailed assessment or qualified review.

# Output Format

Produce:

1. **Research question** — concise, decision-linked question.
2. **Hypotheses table** — claim, evidence strength, key assumptions, minimal test, likely failure mode, and boundary.
3. **Experimental design** — arms, controls, variables, splits, metrics, and stop conditions.
4. **Analysis plan** — data audit, feature construction, model comparison, error decomposition, and calibration checks.
5. **Iteration plan** — failure-mode-to-intervention mapping and revalidation rules.
6. **Validity and safety statement** — leakage checks, confounders, reproducibility needs, operational limits, and escalation triggers.

# Validation Gates

- **Temporal and spatial leakage:** No future or proximal information enters training, feature construction, or preprocessing.
- **Baseline adequacy:** The candidate improves on the strongest relevant baseline for the same task.
- **Event-critical performance:** Rare or high-consequence events are evaluated separately from aggregate metrics.
- **Label independence:** Reference labels are generated independently of deployment descriptors.
- **Reproducibility:** Splits, descriptors, label process, model versions, and metrics are documented.
- **Operational clarity:** Users can distinguish screening-level outputs from detailed-assessment requirements.

# Claim Boundaries

- Distinguish verified workflow patterns from new-setting inferences.
- Do not treat single-case or single-model results as field-wide consensus.
- Do not infer definitive causality from learned associations or graph edges without additional assumptions, temporal evidence, or expert validation.
- Limit predictive claims to the validated domain, typology, climate regime, and data quality observed.
- Mark extrapolation explicitly when applying findings to new regions, hazards, or asset classes.

# Failure Modes

- **Distribution shift:** Training and deployment regimes differ in climate, seasonality, regulation, or sensor configuration.
- **Temporal leakage:** Features, scaling, or splits use future information.
- **Class imbalance and rare-event blindness:** High-impact events are underrepresented and poorly detected.
- **Missing-data collapse:** Performance degrades when key descriptors are unavailable; uncertainty is unreported.
- **Overfitting to historical events:** Gains disappear under chronological or out-of-sample validation.
- **Confounding by context:** Terrain, land use, sensor density, or response capacity drives apparent associations.
- **Circular labels:** Labels reuse the same descriptors deployed at inference time.
- **Signal loss in preprocessing:** Cleaning or normalization removes mechanistically relevant variation.

# Validity Checks

- **Confounding:** Check omitted drivers, local geography, seasonality, measurement error, and autocorrelation.
- **Statistical validity:** Use appropriate resampling, repeated runs, and uncertainty reporting for unstable metrics.
- **Calibration:** Probabilistic outputs should reflect observed frequencies, especially for ambiguous or high-impact categories.
- **External validity:** State whether claims apply only to the studied system or are transferable.
- **Equity and access:** Assess whether error rates or warning coverage differ across subgroups or regions.
- **Mechanism specificity:** Use ablations to isolate whether preprocessing, feature engineering, or model family caused improvement.

# Provenance

- Derived from cluster 11 / subcluster 11.0: flood-forecasting-seismic-resilience-evidence-analysis-workflow.
- Synthesized from source skills: seismic-risk-rapid-screening-research (10.3390_app13085100), bayesian-event-prediction-remote-sensing (10.34123_icdsos.v2021i1.37), bridge-shm-thermal-response-research (10.1177_13694332251407269), data-driven-flood-forecasting-research (10.3390_geohazards5010004), hydrology-hybrid-flood-forecasting-research (10.1002_rvr2.72), street-view-taxonomy-research-workflow (10.1177_87552930251327435), flood-ai-risk-forecasting-workflow (10.21275_sr25417213030), flood-resilience-spatial-plan-workflow (10.1088_1755-1315_986_1_012052).
