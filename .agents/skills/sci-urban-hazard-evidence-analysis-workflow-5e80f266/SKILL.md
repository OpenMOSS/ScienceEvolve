---
name: sci-urban-hazard-evidence-analysis-workflow-5e80f266
description: End-to-end mechanism-driven research workflow for urban and structural hazard domains, integrating gap identification, hypothesis generation, controlled scenario design, multi-source validation, and iterative claim auditing.
scienceevolve-title: "Urban hazard resilience · hazard evidence analysis workflow"
scienceevolve-area: urban-hazard-resilience
---

## Purpose

Help an agent conduct reproducible, mechanism-driven research across urban and structural hazard domains. The workflow moves from gap identification and hypothesis generation through controlled experiment design, multi-source validation, and iterative claim auditing. It is designed for research planning and evidence assessment, not for operational engineering decisions or emergency response.

## When to use

- The user needs to propose new research questions in urban hazard, infrastructure resilience, or environmental risk assessment.
- The task requires integrating geospatial, monitoring, simulation, or statistical data to test mechanism-based hypotheses.
- The user needs to design controlled experiments or scenario comparisons with explicit positive, negative, and strong controls.
- The user needs to validate surrogate models, infer hidden states from sparse observations, or audit evidence strength before making planning or policy recommendations.
- Do not use for real-time emergency response, construction execution, safety certification, or unqualified risk declarations.

## Inputs required

- **System boundary**: Research domain, hazard type(s), spatial and temporal scale, and decision context.
- **Data inventory**: Available data sources, resolutions, coordinate systems, temporal coverage, known gaps, and lineage.
- **Mechanism hypotheses**: Observable phenomena, candidate causal chains, or target states to explain or predict.
- **Models and pipelines**: Candidate simulation, statistical, or machine-learning frameworks; known calibration status.
- **Validation resources**: Independent observations, benchmark cases, historical events, or calibrated physical models.
- **Constraints**: Computational budget, ethical and data-governance limits, safety boundaries, and applicable regulatory context.

## Core Workflow

1. **Scope and Gap Definition**  
   Define the system, hazard process, analysis scale, and decision context. Identify whether the problem is forward-simulable, inverse-ill-posed, or data-scarce. Document the specific gap between existing methods and the new research need.  
   *Decision gate*: If the request requires real-time operational action or emergency authority, **STOP** and redirect to operational protocols.

2. **Mechanism Mapping and Hypothesis Generation**  
   Decompose the hazard into causal chains (e.g., input → propagation → exposure → consequence). Formulate falsifiable hypotheses linking observable proxies to target states. Annotate each hypothesis with evidence strength (High / Medium / Low), key assumptions, and failure modes.  
   *Decision gate*: If no falsifiable hypothesis can be formed or no observable proxy exists, **STOP** and reformulate the research question.

3. **Data Audit and Integration**  
   Inventory all data sources; unify coordinate systems, resolutions, and temporal windows. Document provenance, missingness, and quality flags. Explicitly separate data permitted for exploration from data reserved for independent validation.  
   *Decision gate*: If critical variables are missing and no defensible proxy exists without reversing the expected conclusion direction, **STOP** or narrow the scope.

4. **Experimental and Scenario Design**  
   Define input variables, observed variables, output variables, and confounders. Establish a control hierarchy:  
   - **Baseline**: reference state or existing conditions.  
   - **Positive control**: a scenario known to exhibit the target mechanism.  
   - **Negative control**: a scenario where the mechanism is absent or inert.  
   - **Strong control**: identical system with only one primary factor altered.  
   Define evaluation metrics, uncertainty quantification approach, and stop conditions (e.g., data misalignment, label leakage, model-observation conflict, sensitivity beyond threshold).

5. **Calibration and Minimum Viable Verification**  
   Before using any model to generate labels or training data, validate it against independent benchmarks or historical observations. Confirm that positive controls are reproduced and that the model behaves plausibly in baseline conditions.  
   *Decision gate*: If the model fails positive or baseline controls, **STOP** inference; revisit model credibility, calibration, or input quality.

6. **Execution and Multi-source Analysis**  
   Run scenarios, compute spatial or statistical metrics, and perform error and uncertainty analysis. Compare model tiers or data domains. Apply cross-validation, sensitivity analysis, and residual diagnostics. Check for domain shift between synthetic and real data, spatial autocorrelation, and temporal leakage.  
   *Decision gate*: If unresolved domain shift, data leakage, or extreme parametric sensitivity is detected, halt generalization claims and return to Step 4.

7. **Evidence Audit and Claim Grading**  
   Grade each claim:  
   - **Verified**: supported by current evidence and independent checks.  
   - **Supported**: consistent with theory but requiring further validation.  
   - **Hypothetical**: inference only, with clear assumptions.  
   - **Not transferable**: tied to specific source conditions.  
   Map results to risk, serviceability, or loss metrics only with explicit uncertainty bounds.  
   *Decision gate*: If results contradict independent validation or show high error at safety-critical boundaries, **STOP** direct application and flag for expert review.

8. **Iteration or Termination**  
   - If evidence supports the hypothesis: introduce a perturbation (new variable, scale, or domain) and return to Step 2.  
   - If evidence is partial: disaggregate by sub-region, sub-mechanism, or scenario and return to Step 4.  
   - If evidence refutes the hypothesis: reformulate mechanism candidates and return to Step 2, or terminate if data cannot resolve ambiguity.  
   - **Final stop**: When claims are audited, boundaries are documented, and the next-step verification or termination rationale is recorded.

## Output Format

Produce a structured research package containing:

1. **Research question and system boundary** — One-sentence problem statement with scale and context.
2. **Gap statement and mechanism map** — Documented deficiency in current knowledge and causal chain.
3. **Hypothesis portfolio** — Table of candidate hypotheses with mechanism, evidence strength, key assumptions, and failure modes.
4. **Experimental design** — Variables, control hierarchy, metrics, and stop conditions.
5. **Analysis plan and data lineage** — Preprocessing, modeling, statistical tests, visualization, and uncertainty handling.
6. **Evidence audit** — Claim grades, uncertainty quantification, domain-shift assessment, and cross-validation summary.
7. **Iteration roadmap** — Next verification step, pivot rationale, or termination justification.
8. **Validity and ethics checklist** — Confounders, reproducibility steps, boundary conditions, and fairness checks.

## Validation Gates

- **Domain appropriateness**: The problem is mechanism-driven and research-oriented, not an operational emergency request.
- **Data sufficiency**: Critical inputs are available or proxiable without biasing the conclusion direction.
- **Model credibility**: Forward or surrogate models pass positive controls and independent benchmarks before generating labels.
- **Statistical rigor**: Spatial autocorrelation, data leakage, class imbalance, and sample independence are explicitly addressed.
- **Generalization check**: Synthetic-to-real or cross-site transfer is tested; surrogate models are not extrapolated beyond calibrated envelopes.

## Claim Boundaries

- Distinguish "observed association," "model-inferred estimate," and "independently validated prediction."
- Do not present single-case, single-model, or single-site results as domain consensus.
- Do not extrapolate beyond stated structural types, urban morphologies, climate zones, event magnitudes, or data-quality thresholds.
- Research outputs are advisory only; they do not constitute engineering approval, emergency directive, insurance valuation, or policy mandate.

## Failure Modes

- Confounding by unobserved infrastructure, topography, socioeconomic heterogeneity, or boundary conditions.
- Domain shift between synthetic or training data and the target deployment context.
- Overfitting to spatial autocorrelation, temporal leakage, or rendering artifacts.
- Misattribution of statistical correlation to causation via feature importance without mechanistic controls.
- Masking critical-location or critical-scenario failures with average performance metrics.
- Extending surrogate model predictions beyond the calibrated parameter envelope.

## Validity Checks

- **Confounders**: Identify and control for drainage capacity, soil variability, input spectra, geometric anomalies, sensor noise, maintenance state, and reporting bias.
- **Reproducibility**: Document data versions, coordinate systems, resolutions, parameter tables, model settings, random seeds, and processing scripts.
- **Boundary conditions**: State applicable hazard types, spatial and temporal scales, performance levels, and data-quality thresholds.
- **Statistical validity**: Report central tendency and dispersion; use independent test sets, cross-validation, and uncertainty intervals; avoid single-sample global conclusions.
- **External validity**: Require recalibration for new cities, structures, or climate regimes; prohibit mechanical reuse of source-study numerical parameters or sample sizes.
- **Ethics and fairness**: Check for disproportionate data gaps in vulnerable communities; avoid labeling populations as risk sources; disclose uncertainty when results could affect resource allocation.

## Provenance

- Synthesized from cluster `10.0` (`seismic-urban-flood-wind-evidence-analysis-workflow`), count 64.
- Source skills: `urban-flood-risk-exploration` (10.1007_s12517-023-11412-2), `seismic-residual-demand-inference-workflow` (10.1177_87552930211021872), `seismic-digital-twin-research-flow` (10.1177_14759217241231299), `urban-river-flood-resilience-geospatial-workflow` (10.3390_w17071047), `footbridge-crowd-seismic-research-workflow` (10.3390_buildings12122138), `urban-flood-green-space-susceptibility-workflow` (10.1007_s10661-023-12061-4), `urban-canopy-dispersion-research-design` (10.1007_s10546-010-9467-2), `seismic-shm-sparse-sensing-reconstruction` (10.1007_s10518-021-01266-y).
