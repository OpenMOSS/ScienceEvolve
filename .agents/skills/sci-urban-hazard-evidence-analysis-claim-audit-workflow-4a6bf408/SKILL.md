---
name: sci-urban-hazard-evidence-analysis-claim-audit-workflow-4a6bf408
description: Reusable end-to-end workflow for designing, validating, and auditing evidence-based research claims in physical hazard and vulnerability studies across domains such as flood, seismic, and urban forecasting.
scienceevolve-title: "Urban hazard resilience · hazard evidence analysis claim audit workflow"
scienceevolve-area: urban-hazard-resilience
---

# Purpose

Design transferable research plans that move from evidence gaps to bounded scientific claims through systematic hypothesis generation, controlled comparison, multi-layer validation, and iterative claim auditing. The goal is to keep mechanism distinct from implementation, treat uncertainty as a core output, and prevent any single study from being presented as domain consensus.

# When to use

Use this skill when:

- Proposing new research questions where interacting physical drivers, socio-environmental factors, or model mechanisms must be separated.
- Designing validation studies for empirical, physical, statistical, AI-based, or hybrid assessment methods in hazard and vulnerability research.
- Auditing existing claims for confounding, leakage, spatial or temporal mismatch, and generalizability limits.
- Iterating a study after model-data mismatch, weak controls, or limited transferability.
- Comparing candidate models, interventions, or scenarios under matched evaluation conditions.

# Inputs required

Collect or request before starting:

1. **Decision context**: the scientific or risk-analysis question the output should support.
2. **Target system boundaries**: spatial scale, temporal horizon, hazard type, and domain (e.g., flood, seismic, urban, atmospheric).
3. **Evidence corpus**: literature, observations, model outputs, or benchmark datasets with provenance, coverage, and known gaps.
4. **Candidate mechanisms**: proposed process, model component, intervention, or feature set to be tested.
5. **Baseline comparator**: current practice, simplest defensible model, or established benchmark appropriate to the task.
6. **Validation resources**: independent observations, held-out regions or events, positive/negative control cases, and reproducibility constraints.
7. **Constraints**: data licensing, computational budget, safety/governance limits, and equity considerations.

# Core Workflow

Follow this ordered route. Do not skip a gate; if a gate fails, stop and redesign.

1. **Gap & Mechanism Mapping**
   - Frame the research question as a mechanism question: how does a proposed process or intervention change an observable outcome?
   - Map the causal chain from forcing inputs to target outputs.
   - Identify the weakest link or largest mismatch between existing evidence and the proposed mechanism.
   - **Gate**: If the gap cannot be expressed as a falsifiable comparison between a baseline and an intervention, stop and reformulate.

2. **Evidence Audit & Thematic Synthesis**
   - Inventory all sources with metadata quality, coverage, duplication handling, missingness, and potential selection bias.
   - Cluster evidence by mechanism, method class, or process domain rather than by keyword frequency.
   - **Gate**: If the evidence is insufficient to define a minimal viable test, stop and design a data-collection or monitoring study before modeling.

3. **Hypothesis Generation & Ranking**
   - Generate candidate hypotheses as controlled contrasts (baseline vs. intervention).
   - For each hypothesis record: evidence strength, key assumptions, counter-hypothesis, likely failure modes, and a minimal falsification test.
   - Rank hypotheses by decision relevance, identifiability, and confounding risk.
   - **Gate**: If no hypothesis is distinguishable from its counter-hypothesis with available data, stop and narrow the scope.

4. **Experimental Design with Controls**
   - Define the **baseline**: the simplest defensible configuration that excludes the proposed mechanism.
   - Define the **intervention**: the configuration that adds exactly one mechanism, process, or feature set.
   - Specify independent and dependent variables, strong controls, negative controls, positive controls, and ablation variants.
   - Predefine evaluation metrics and stop conditions before any analysis.
   - **Gate**: If controls cannot separate the mechanism from confounders (e.g., correlated predictors, unmatched domains, or circular indicators), redesign before execution.

5. **Execution & Layered Analysis**
   - Perform pre-analysis checks: data harmonization, leakage screening, quality checks, and temporal/spatial alignment.
   - Run baseline and intervention comparisons under matched conditions.
   - Conduct component checks, residual diagnostics, uncertainty propagation, and sensitivity analysis.
   - **Gate**: If preliminary results depend on a single event, metric, overfit subset, or show signs of leakage, stop and redesign.

6. **Outcome Classification & Iteration**
   - Classify the result:
     - **Supported**: improvement holds across independent diagnostics and controls rule out trivial explanations.
     - **Partially supported**: improvement appears only for some subgroups, regions, events, or metrics.
     - **Unsupported**: no improvement over baseline, or negative controls perform similarly.
     - **Inconclusive**: validation data or study design prevents interpretation.
   - Update the hypothesis:
     - If supported, narrow the claim and plan a harder test (new region, event, or independent dataset).
     - If partially supported, identify enabling/blocking conditions.
     - If unsupported, revise the causal chain or baseline rather than expanding claims.
     - If inconclusive, improve data comparability and controls before changing the scientific claim.
   - **Gate**: After each iteration, require a new minimal viable validation before escalating scope or complexity.

7. **Claim Bounding & Communication**
   - State generalization boundaries: tested geographies, data regimes, event types, model resolutions, and decision contexts.
   - Separate observed evidence from inference, and model output from operational directive.
   - Document reproducibility artifacts and provenance.
   - **Gate**: If claims exceed the validation envelope, retract to a bounded statement.

# Output Format

Return:

1. **Research question**: concise mechanism question with decision context and gap rationale.
2. **Evidence map**: sources, coverage, limitations, and unresolved gaps.
3. **Hypothesis table**: for each hypothesis—evidence strength, key assumptions, counter-hypothesis, likely failure modes, and minimal falsification test.
4. **Experimental design**: baseline, intervention, variables, controls, metrics, and stop conditions.
5. **Analysis plan**: audit steps, comparison logic, uncertainty treatment, and interpretation rules.
6. **Iteration log**: outcome classification, design changes, and updated assumptions.
7. **Validity and ethics notes**: confounders, reproducibility requirements, generalization limits, and safe-use boundaries.

# Validation Gates

- **Mechanism falsifiability**: The hypothesis must be rejectable by available evidence.
- **Control adequacy**: Strong, negative, and positive controls must isolate the proposed mechanism from confounders.
- **Data independence**: Validation data must be independent of training, tuning, or hypothesis-generation data.
- **Metric alignment**: Predefined metrics must expose failures in extremes, timing, spatial patterns, or safety-relevant edge cases.
- **Stability**: Conclusions must survive resampling, spatial blocking, ablation, and reasonable data-filter variations.

# Claim Boundaries

- Limit claims to tested physiographic settings, data regimes, event classes, model resolutions, and stakeholder contexts.
- Distinguish paper-supported workflow patterns from agent-inferred hypotheses and unvalidated extrapolations.
- Do not present single-study or single-model results as domain consensus.
- Mark operational-readiness claims as out-of-scope unless independently validated by appropriate domain authorities.

# Failure Modes

- **Confounding**: Event selection, metadata bias, regional imbalance, or unmodeled drivers produce spurious associations.
- **Leakage**: Future information, overlapping records, spatial autocorrelation, or circular indicators inflate apparent performance.
- **Overfitting**: Calibration to a narrow event set, single metric, or idiosyncratic data artifacts.
- **Scale mismatch**: Misalignment between data resolution, model domain, and decision target.
- **Nonstationarity**: Domain shift between historical validation and future or counterfactual application.
- **Underidentification**: Correlated predictors or sparse data destabilizing model terms or feature importance.
- **Observational artifacts**: Instrument errors, background subtraction, coordinate or timing mismatches, or missing-data patterns mistaken for signal.

# Validity Checks

- **Confounding separation**: Regional, source-type, site, sensor, or preprocessing effects are separable from the proposed mechanism.
- **Temporal consistency**: No future information leaks into model fitting, feature engineering, or hypothesis generation.
- **Spatial consistency**: Compatible terrain, boundaries, coordinate systems, and support across all components.
- **Statistical validity**: Metrics are predefined, uncertainty is reported, multiple comparisons are acknowledged, and extrapolation is separated from validation.
- **Reproducibility**: Sources, preprocessing, model versions, randomization policy, exclusion rules, and output versions are documented.
- **Physical plausibility**: Predictions do not systematically violate domain-relevant first principles.
- **Equity and governance**: Potential impacts on vulnerable communities are flagged, and communication risks are reviewed before public use.

# Provenance

- Derived from cluster 8.2 (end-to-end evidence analysis and claim audit).
- Synthesized from source skills: compound-flood-research-design, climate-flood-coupled-modeling-workflow, seismic-ai-research-design, outer-heliosphere-ena-modeling, subduction-ground-motion-empirical-modeling, urban-flood-resilience-review-to-research-design, regional-seismic-damage-ml-research, urban-flood-susceptibility-research-design.
- Preserves only transferable workflow structure; excludes paper-specific parameters, numerical results, and site-specific conclusions.
