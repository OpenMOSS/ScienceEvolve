---
name: sci-urban-domain-aware-hybrid-model-validation-workflow-5961e0ee
description: Reusable end-to-end workflow for designing, validating, and comparing domain-aware hybrid machine-learning models against strong baselines with mechanism-driven iteration.
scienceevolve-title: "Urban hazard resilience · domain aware hybrid model validation workflow"
scienceevolve-area: urban-hazard-resilience
---

# Purpose

This skill guides an agent to convert a predictive modeling research question into a rigorous, reusable experimental workflow. It centers on comparing hybrid or domain-guided machine-learning pipelines against fair baselines, validating whether observed gains arise from the proposed mechanism, and iterating based on evidence rather than model tuning alone. Use it for forecasting, spatial susceptibility, risk mapping, or other regime-dependent prediction tasks where domain structure, physical consistency, or multi-source evidence matters.

# When to use

Trigger this skill when the user asks to:

- Design experiments comparing a proposed hybrid, constrained, or multi-source model against simpler or unconstrained baselines.
- Generate falsifiable hypotheses about temporal, spatial, physical, or contextual mechanisms in a prediction task.
- Evaluate robustness, calibration, or transferability of domain-aware predictions across regimes, sites, or time periods.
- Plan ablations, controls, and error analyses for machine-learning-assisted validation studies.
- Diagnose why a predictive model fails to generalize or why average performance masks critical failures.

Do not use this skill for operational deployment decisions, safety-critical certification, or as a substitute for domain-specific engineering review.

# Inputs required

Request or infer before proceeding:

- Target outcome, forecast horizon or spatial unit, and decision context.
- Candidate predictor families and whether they are available at prediction time.
- Data provenance, missingness patterns, known regime shifts, and source heterogeneity.
- Domain constraints, bounds, or mechanistic regularities that should influence predictions.
- Candidate model families, including simple baselines, strong unconstrained baselines, and the proposed hybrid or domain-guided approach.
- Evaluation priorities: accuracy, calibration, robustness, interpretability, extreme-event sensitivity, or cost.
- Constraints on compute, data access, reproducibility, and stakeholder review.

If inputs are missing, state assumptions explicitly and flag them as weak points.

# Core Workflow

Follow this ordered route. Do not skip a gate; if a gate fails, stop and redesign.

## 1. Frame the research question
Define the prediction target, the decision the output supports, and the operational boundary. State the minimal viable claim you intend to test.
- **Gate G1**: Reject if the question is only "which model is best?" without a mechanism or decision context.

## 2. Generate mechanism-informed hypotheses
For each candidate mechanism, produce:
- Claim: a concise, falsifiable statement.
- Evidence strength: strong, moderate, weak, or speculative.
- Key assumptions: what must hold for the claim to be true.
- Likely failure mode: how the claim could fail.
- Minimal validation: the smallest experiment that could falsify or support it.
- **Gate G2**: Reject hypotheses that merely assert complexity improves performance without a mechanism.

## 3. Audit data and build evidence families
Inspect timing, leakage risks, missingness, spatial or temporal autocorrelation, and source heterogeneity. Group predictors into abstract families tied to plausible mechanisms (e.g., temporal structure, spatial context, physical forcing, neighborhood relations). Remove or flag future-dependent, identifier, or leakage-prone variables.
- **Gate G3**: Stop if chronological or spatial ordering is violated, or if critical predictors are unavailable at prediction time.

## 4. Design the experiment
Specify before any model training:
- **Baseline ladder**: simple empirical baseline, strong standard baseline, unconstrained model with comparable capacity, and the proposed hybrid or domain-guided variant.
- **Controls**: negative control (remove proposed mechanism), positive control (established strong method), strong control (unconstrained comparator), ablation control (remove one component or feature family).
- **Splits**: chronological, spatial blocking, source-separated, or regime-separated splits matched to data dependence.
- **Metrics**: primary error metric, calibration or uncertainty metric, robustness metric, and operational relevance metric.
- **Stop conditions**: define failure thresholds (e.g., hybrid does not beat simple baseline, gains disappear under cross-regime validation, constraint violations increase).
- **Gate G4**: Do not proceed if baselines are unfair, splits allow leakage, or stop conditions are undefined.

## 5. Run minimal viable validation (MVV)
Train all model families on identical training data with identical preprocessing. Evaluate once on a held-out test split. Report point performance, uncertainty/calibration, and constraint adherence. Run stochastic models with multiple seeds.
- **Gate G5**: If the proposed method fails to beat the simple baseline or shows high variance without mechanism evidence, stop and redesign. Do not scale up.

## 6. Diagnose mechanisms and errors
Decompose errors by regime, subgroup, time period, spatial region, or evidence family. Run ablations to isolate whether gains come from the proposed mechanism, a single feature family, or increased capacity. Check that domain constraints or physical bounds are satisfied. Inspect local predictions and residuals.
- **Gate G6**: If ablation shows the mechanism is unnecessary, downgrade the claim to a performance observation only.

## 7. Audit robustness and uncertainty
Test stability across alternative splits, seeds, sources, or spatial blocks. Evaluate worst-group or extreme-event performance. Assess whether probability-like outputs are calibrated. Test transfer to unseen regimes or locations if generalization is claimed.
- **Gate G7**: If performance collapses under robustness checks, narrow claims to the tested setting and stop broader generalization.

## 8. Iterate or finalize
Update the hypothesis table:
- Strengthen evidence if mechanism and performance hold.
- Weaken or split hypotheses if results are regime-specific.
- Abandon if negative controls match the proposed method or if failure modes dominate.
Plan next steps: stronger validation, expert audit, or operational pilot. Document boundary conditions and reproducibility artifacts.
- **Gate G8**: Finalize only when claims are bounded, reproducible, and operationally meaningful.

# Output Format

Produce these artifacts in order:

1. **Research question** — target, decision context, and operational boundary.
2. **Hypothesis table** — claims, evidence strength, assumptions, failure modes, minimal tests.
3. **Experimental design** — evidence families, baseline ladder, controls, splits, metrics, stop conditions.
4. **Analysis plan** — diagnostics, ablations, error decomposition, mechanism checks, calibration audit.
5. **Iteration log** — how results update hypotheses and what triggers redesign.
6. **Validity and ethics statement** — leakage checks, reproducibility requirements, boundary conditions, safety constraints.
7. **Evidence labels** — clearly separate "paper-supported pattern", "domain-consistent rationale", and "new-agent inference".

# Validation Gates

Summarized pass/fail criteria:

- **G1 — Question clarity**: Must include a decision context and a mechanism to test.
- **G2 — Hypothesis quality**: Must be falsifiable and not merely complexity-driven.
- **G3 — Data integrity**: No leakage; predictors available at prediction time; split logic matches dependence structure.
- **G4 — Experimental rigor**: Fair baselines, defined controls, pre-registered metrics, and explicit stop conditions.
- **G5 — MVV success**: Proposed method beats simple baseline under identical conditions with stable variance.
- **G6 — Mechanism support**: Ablations or diagnostics link gains to the claimed mechanism.
- **G7 — Robustness**: Results survive across splits, seeds, regimes, or transfer settings.
- **G8 — Claim boundedness**: Conclusions state limits and do not overgeneralize.

# Claim Boundaries

- This workflow supports research design and evidence generation, not operational deployment or safety certification.
- Attribution and feature importance indicate model behavior, not causal mechanisms.
- Single-study results are bounded to the tested data regime, split strategy, and model family.
- Hybrid or domain-guided models are not universally superior; gains are conditional on the hypothesized mechanism being valid in the target setting.
- Predictive performance does not imply physical correctness unless constraint adherence is separately verified.

# Failure Modes

- **Leakage**: Future information, identifiers, or spatially/temporally proximate labels enter training.
- **Baseline inadequacy**: Proposed method is compared only to weak or untuned alternatives.
- **Mechanism misattribution**: Aggregate improvement comes from a single feature or extra capacity, not the proposed hybrid mechanism.
- **Average-error masking**: Gains in mean error hide worsened extreme-event, worst-group, or high-impact errors.
- **Constraint violation**: Domain-guided models improve error but violate physical bounds or consistency rules.
- **Overfitting to validation**: Repeated tuning on the same validation split inflates apparent performance.
- **Spatial or temporal autocorrelation inflation**: Random splitting ignores dependence, producing optimistic held-out estimates.
- **Uncertainty overconfidence**: Probabilistic outputs are poorly calibrated, especially in extrapolated regimes.

# Validity Checks

- **Confounding and leakage**: Verify chronological respect, spatial blocking, and predictor availability at prediction time.
- **Reproducibility**: Document data version, split dates, feature definitions, model families, metric formulas, and random seeds.
- **Statistical validity**: Use held-out test data for final claims; report variance across seeds or splits; avoid overclaiming from visual agreement.
- **Boundary conditions**: State applicable regimes, seasons, locations, or data sources; flag extrapolation as unsupported.
- **Fairness and bias**: Inspect subgroup and worst-group performance; ensure improvements do not come at the cost of marginalized cases.
- **Causal caution**: Do not infer causality from predictive performance, ablation rankings, or feature attributions alone.

# Provenance

Synthesized from cluster 8.0 (machine-learning-assisted model validation and comparison). Source skill references: hybrid-time-series-forecasting-skill; structure-aware-contrastive-nlp-robustness; constraint-aware-interpretable-weather-forecasting; optimized-spatial-susceptibility-research; probabilistic-physics-guided-ml-skill; temporal-energy-forecasting-research; multi-source-geospatial-risk-llm-workflow; complex-terrain-windfarm-research-workflow.
