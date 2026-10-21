---
name: sci-urban-urban-flood-seismic-resilience-evidence-analy-2744de67
description: Generate reusable, mechanism-aware research plans for urban flood and seismic resilience by framing decision gaps, building competing hypotheses, designing minimum-viable validation with strong controls, propagating uncertainty, and iterating through robustness checks and claim bounding.
scienceevolve-title: "Urban hazard resilience · urban flood seismic resilience evidence analysis workflow"
scienceevolve-area: urban-hazard-resilience
---

# Purpose

Turn a new urban or infrastructure resilience question into a transparent, end-to-end evidence analysis and claim audit. The workflow transfers a reusable pattern across spatial, numerical, and multi-criteria domains: define a decision-relevant gap, generate competing mechanism-based hypotheses, design minimum-viable validation with explicit controls, propagate uncertainty, validate against independent evidence, and iterate until claims are bounded by their assumptions and failure modes.

This skill is for research planning and methodological transfer, not for producing operational emergency directives, engineering safety certifications, or site-specific risk clearances.

# When to use

Trigger this skill when a user asks to:

- Generate research questions for urban flood or seismic resilience assessment, spatial vulnerability screening, or planning-oriented hazard mapping.
- Design a multi-criteria, probabilistic, or spatial study that combines geospatial, monitoring, simulation, or indicator-based evidence.
- Compare alternative drivers, methods, weighting schemes, intensity measures, demand parameters, or validation strategies.
- Validate mapped or modeled outputs against independent observations, benchmarks, or cross-method estimates.
- Convert a local resilience or fragility study into a reusable workflow for a different city, district, structure class, or planning unit.

Do not use it as a substitute for qualified hydrologic or structural engineering, emergency management, insurance, land-use regulation, licensed site review, or operational field-safety procedures.

# Inputs required

Ask for or identify:

- Target system boundary and decision context (geography, scale, assets, time horizon).
- Research question type: driver comparison, hotspot screening, method comparison, weight sensitivity, threshold stability, fragility estimation, or validation improvement.
- Available evidence: geospatial layers, monitoring records, numerical models, historical event data, literature benchmarks, or expert judgments.
- Validation evidence: independent observations, holdout data, reference maps, field labels, or cross-method estimates.
- Candidate methods, models, indicators, or weighting assumptions, if known.
- Constraints on data quality, spatial resolution, temporal coverage, computational resources, and intended use.
- Boundary conditions: hazard regime, system typology, land-use patterns, maintenance state, soil or site context, and known local mechanisms.

# Core Workflow

Follow this ordered route. Do not skip a gate; if a gate fails, iterate or stop.

1. **Frame the decision gap**
   - Define the research question as a spatial or system-level gap requiring prioritization, comparison, or estimation.
   - Separate the hazard or pressure process from exposure, vulnerability, and response capacity where appropriate.
   - *Decision gate*: Is the question scoped to one clear mechanism and decision scale? If not, narrow or decompose before proceeding.

2. **Map mechanisms and generate competing hypotheses**
   - Link candidate drivers, indicators, or methods to plausible physical or systemic mechanisms.
   - Formulate at least two contrastive hypotheses per question.
   - Assign evidence strength (high / moderate / low / speculative) and list key assumptions, competing explanations, and likely failure modes.
   - *Decision gate*: Are hypotheses mechanism-based and falsifiable? If not, reformulate.

3. **Design minimum viable validation**
   - Define the smallest study that can test the mechanism: independent, dependent, and confounding variables; evaluation metrics; and stop conditions.
   - Include strong controls (same information across compared methods), negative controls (where the proposed mechanism should not dominate), positive controls (known or expected patterns), and robustness controls (alternative assumptions).
   - *Decision gate*: Does the design include independent validation targets and clear stop conditions? If not, redesign.

4. **Audit data and model readiness**
   - Confirm data provenance, projection, resolution, temporal alignment, missingness, and preprocessing documentation.
   - For numerical models, check observability, boundary conditions, calibration independence, and measurement equation validity.
   - *Stop condition*: If critical data gaps or unresolved model assumptions remain, halt until documented or replaced.

5. **Execute analysis with uncertainty propagation**
   - Run candidate models, estimators, or spatial overlays.
   - Propagate uncertainty through the full workflow; separate intrinsic variability from lack-of-knowledge uncertainty.
   - Compare candidates against baselines using identical inputs and paired metrics.
   - *Decision gate*: Are baselines receiving the same information as proposed methods? If not, standardize before interpreting.

6. **Validate against independent evidence**
   - Compare outputs with holdout observations, independent measurements, literature benchmarks, or cross-method estimates.
   - Examine where errors occur and their spatial or conditional structure, not only aggregate agreement.
   - *Iteration trigger*: If validation fails or independent evidence contradicts the inference, revisit assumptions, data quality, or model structure.

7. **Stress-test robustness**
   - Test whether conclusions survive alternative weights, thresholds, resolutions, indicator sets, record subsets, model variants, or analyst choices.
   - Identify whether a single factor, assumption, or processing path dominates the result.
   - *Stop condition*: If priority rankings reverse under plausible alternatives, fragility curves shift materially, or uncertainty is dominated by undocumented assumptions, stop and bound claims.

8. **Bound claims and audit extrapolation**
   - Label each conclusion by evidence strength.
   - Restrict claims to comparable systems, regimes, scales, and data-quality levels.
   - Separate observed findings, model-supported inferences, and speculative extensions.
   - *Decision gate*: Are all claims accompanied by explicit boundary conditions and failure modes? If not, downgrade or remove.

9. **Iterate or finalize**
   - If evidence supports the hypothesis and robustness is stable, refine boundary conditions and propose targeted follow-up.
   - If evidence is ambiguous, add an independent constraint or simplify the research question.
   - If the hypothesis is rejected, retire it with documented reasoning.
   - *Stop condition*: End the cycle when the plan reaches a defensible claim boundary or when a gate failure cannot be resolved.

# Output Format

When using this skill, produce:

1. **Research question and gap statement** — Bounded objective, scale, and decision context.
2. **Mechanism map and hypotheses table** — For each hypothesis: evidence strength, mechanism claim, key assumptions, competing explanation, likely failure mode, and minimal test.
3. **Experimental / study design** — Variables, controls (strong, negative, positive, robustness), evaluation metrics, and stop conditions.
4. **Analysis plan** — Data readiness checks, modeling steps, validation strategy, robustness checks, and uncertainty reporting.
5. **Validation gates summary** — Which gates passed, which failed, and why.
6. **Iteration plan** — How results will update, split, or retire hypotheses.
7. **Claim boundaries and validity notes** — Explicit limits on generalization, confounders, and decision use.
8. **Provenance and ethics notes** — Source-skill references and safe-use limits.

# Validation Gates

- **Scope gate** — The question is tied to one decision scale and mechanism; exposure, susceptibility, and capacity are not conflated.
- **Mechanism gate** — Hypotheses are linked to plausible physical or systemic pathways, not merely correlational patterns.
- **Design gate** — The study includes independent validation targets, strong baselines, and contrastive controls.
- **Data gate** — Data provenance, resolution, alignment, missingness, and preprocessing are documented.
- **Uncertainty gate** — Uncertainty is propagated; baselines receive identical information to candidate methods.
- **Independence gate** — Validation evidence is independent of model inputs, training data, or classification processes.
- **Robustness gate** — Conclusions survive reasonable alternative specifications (weights, thresholds, resolution, subsets).
- **Boundary gate** — Claims are limited to stated system classes, hazard regimes, scales, and data-quality levels.

# Claim Boundaries

- Do not generalize a single case study to all cities, structures, sites, or hazard types.
- Present screening indices, composite scores, or fragility estimates as research evidence; do not present them as certified engineering judgments, operational directives, or regulatory decisions.
- Do not infer causation from spatial overlays, composite rankings, or statistical associations without isolating controls.
- Do not treat model-based estimates as field-validated facts when validation is partial or based on proxy data.
- Do not extrapolate beyond comparable boundary conditions (e.g., rainfall regime, seismic source, structural typology, site class, data resolution).

# Failure Modes

- **Circular validation** — Validation data are derived from the same model output or training set being evaluated.
- **Prioritization failure** — High-priority detection is poor despite the goal being hotspot or intervention prioritization.
- **Assumption dominance** — Rankings, fragility curves, or inferred descriptors reverse under small, plausible changes to weights, thresholds, model form, or noise assumptions.
- **Missing mechanism** — A known dominant local mechanism is absent from the factor set, indicator system, or model assumptions.
- **Analyst/software lock-in** — Conclusions depend on a single analyst, software path, hidden prior, or undocumented processing choice.
- **Unresolved uncertainty** — Uncertainty is too large for the intended decision use, or dominated by lack-of-knowledge rather than intrinsic variability.

# Validity Checks

- **Confounding** — Are variables or layers correlated with the same underlying condition (e.g., urban density, data availability, site class)?
- **Independence** — Is validation evidence independent of inputs, model structure, and classification processes?
- **Representativeness** — Do records, scenarios, or samples match the target hazard regime, system typology, and intensity range?
- **Scale validity** — Does spatial or temporal resolution match the decision scale?
- **Construct validity** — Do indicators or demand parameters measure the intended dimension with a clear, consistent direction?
- **Sensitivity** — Are results stable under reasonable alternative specifications?
- **Reproducibility** — Are data sources, preprocessing, transformations, model settings, and workflows documented?
- **Single-study caution** — Is the finding presented as one case motivating a reusable workflow, not as field-wide consensus?

# Provenance

- Synthesized from Cluster 11 / Subcluster 11.1: urban-flood-seismic-resilience-evidence-analysis-workflow.
- Source skills: transparent-mcda-urban-flood-hazard; seismic-fragility-research-workflow; urban-flood-resilience-exploration; seismic-latent-input-estimation; seismic-fragility-research-pattern; seismic-site-characterization-workflow; urban-flood-resilience-research-workflow; spatial-seismic-resilience-research-design.
