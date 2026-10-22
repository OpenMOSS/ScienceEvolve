---
name: sci-urban-hazard-evidence-claim-audit-workflow-aa7cbb4b
description: A reusable end-to-end workflow for generating testable research questions, designing controlled experiments, and auditing evidence claims across natural hazard and infrastructure modeling domains.
scienceevolve-title: "Urban hazard resilience · hazard evidence claim audit workflow"
scienceevolve-area: urban-hazard-resilience
---

# Purpose

Help an agent design transferable research schemes that convert observational gaps into verifiable hypotheses, controlled experiments, and iterative validation loops. This workflow abstracts the shared evidence-analysis pattern across domains such as flood, seismic, wind, and environmental simulation, focusing on research design rather than replication of any single study or operational deployment.

# When to use

Trigger this skill when:
- A user needs new research questions in hazard, risk, built infrastructure, or environmental modeling domains.
- Observational or proxy data must be mapped to model states, forcing conditions, or performance predictions under extreme scenarios.
- The goal is to compare baseline and perturbed/system-updated states, or to reconstruct unobserved fields from sparse measurements.
- The task requires integrating data quality checks, simulation, statistical validation, uncertainty quantification, and spatial analysis into one coherent framework.

Do not use this skill to generate operational emergency response plans, engineering certification reports, direct safety decisions, or executable field protocols.

# Inputs required

Before starting, gather or explicitly flag as missing:
- **Target system**: Type, scale, key components, boundary conditions, and known degradation or forcing types.
- **Observations**: Sources, coverage, quality, spatial/temporal resolution, synchronization, missing regions, and detection confidence.
- **Baseline or reference state**: Geometry, parameters, initial conditions, and any prior validation record.
- **Mapping rules**: How observations translate to model inputs or state updates, including uncertainties and alternative mappings.
- **Scenarios**: Hazard or forcing types, intensity gradients, durations, spatial distributions, and uncertainty sources.
- **Evaluation criteria**: Metrics, decision thresholds, visualization needs, and acceptable uncertainty levels.
- **Constraints**: Regulatory limits, data privacy, computational bounds, and requirements for expert review.

# Core Workflow

1. **Gap Diagnosis & Question Framing**
   - Map observational or operational gaps to bounded, mechanism-oriented research questions.
   - Separate verified domain knowledge from new inferential extensions.
   - **Gate**: Is the question falsifiable within available data and model constraints? If not, narrow the scope or archive.

2. **Hypothesis Generation & Evidence Tagging**
   - Formulate mechanism-based hypotheses with explicit cause-effect chains.
   - Tag each hypothesis with evidence strength (High / Medium / Low), key assumptions, observable predictions, and failure modes.
   - **Gate**: Are hypotheses testable with obtainable data and existing methods? If not, downgrade to exploratory or reject.

3. **Minimal Viable Validation (MVV)**
   - Select a representative subset (event, region, or subsystem) with trusted observations.
   - Close the loop: input data → model state / simulation → diagnostic output → consistency check against observations.
   - **Stop conditions**: Critical data missing and unrecoverable; baseline cannot distinguish known positive and negative cases; mapping lacks physical basis; or results would trigger high-stakes operational decisions without expert review.
   - **Gate**: Does MVV demonstrate basic chain closure? If no, revise inputs or assumptions before expansion.

4. **Controlled Experiment Design**
   - Define independent variables (forcing, system features, model structure), dependent variables (performance, risk, or reconstruction metrics), and confounders.
   - Implement controls:
     - **Strong control**: cross-model, cross-event, or cross-source comparison under shared inputs.
     - **Negative control**: null or perturbed input, removed mechanism, or randomized feature to detect spurious signals.
     - **Positive control**: known benchmark or oracle setup to confirm pipeline fidelity.
     - **Ablation control**: remove modules or features to isolate attribution.
   - **Gate**: Do controls isolate the claimed mechanism from data leakage and confounding? If not, redesign.

5. **Execution & Diagnostic Analysis**
   - Audit data quality (provenance, resolution, synchronization, missingness, version).
   - Run simulations or models; monitor conservation, stability, boundary behavior, and resolution sensitivity.
   - Perform spatial/temporal analysis, layered overlay, and hotspot identification.
   - Conduct uncertainty and sensitivity analysis (parameter ensembles, input perturbation).
   - **Gate**: Are errors traceable to data, model structure, or boundary conditions? Document dominant sources before interpreting results.

6. **Claim Auditing & Boundary Setting**
   - Label each conclusion as **Data-validated**, **Model-inferred**, or **Hypothesis-extrapolated**.
   - Set explicit applicability boundaries (system type, hazard class, spatial/temporal scale, data quality threshold).
   - **Gate**: Do any claims exceed their evidence strength or applicable domain? If yes, downgrade or flag for independent review.

7. **Iteration or Redesign**
   - **If supported**: Expand to independent holdouts (different events, regions, or data sources); test robustness before generalizing.
   - **If partially supported**: Disaggregate the evidence chain (e.g., separate hazard, exposure, vulnerability, or model component) to identify the weakest link.
   - **If refuted**: Check for data leakage, distribution shift, misaligned scales, or confounding; formulate a competing hypothesis and return to Step 2.
   - **Stop conditions**: Negative controls approach test performance; independent test performance collapses; key inputs remain irretrievable; model outputs would be used for operational safety decisions without professional review.

# Output Format

Each invocation should produce:

1. **Research question**: One sentence stating the object, process, risk metric, and boundary.
2. **Evidence map**: Existing evidence, missing evidence, and assumptions that cannot be directly transferred.
3. **Hypotheses table**: Mechanism, evidence strength, key assumptions, observable predictions, failure modes, and extrapolation boundaries.
4. **Experimental design**: MVV description, strong/negative/positive/ablation controls, variables, metrics, and stop conditions.
5. **Analysis plan**: Data audit, model diagnostics, spatial/temporal analysis, uncertainty/sensitivity treatment, and visualization approach.
6. **Iteration plan**: Rules for updating hypotheses, models, or data strategies under support, partial support, or refutation.
7. **Validity and safety notes**: Confounders, reproducibility requirements, statistical validity, applicable boundaries, and explicit non-operational disclaimer.

# Validation Gates

- **Falsifiability Gate**: Every hypothesis must have defined observable predictions and explicit refutation conditions.
- **Data Sufficiency Gate**: MVV must cover known positive and negative cases; if the baseline cannot distinguish them, halt expansion.
- **Control Integrity Gate**: Negative controls must not approach test performance; if they do, suspect leakage or spurious correlation.
- **Independence Gate**: Validation data must be independent of calibration or training data (temporal, spatial, or source separation).
- **Attribution Gate**: Performance changes must be traceable to specific mechanisms via ablation or sensitivity, not inferred from overall metrics alone.
- **Extrapolation Gate**: Claims must remain within bounded applicability; cross-domain, cross-scale, or cross-hazard claims require re-validation.

# Claim Boundaries

- Do not present model outputs as deterministic predictions of real-world events.
- Do not transfer calibrated parameters, vulnerability curves, or thresholds from source studies to new systems without re-validation.
- Do not use single-case or single-paper results as domain consensus.
- Distinguish research exploration from operational forecasting, engineering design, or safety certification.
- Probabilistic results must carry uncertainty intervals and explicit applicability conditions.

# Failure Modes

- **Data Coverage Failure**: Sparse or biased observations lead to unrepresentative model states.
- **Misattribution**: Performance gains attributed to novel methods actually stem from increased input dimensionality, data leakage, or baseline tuning.
- **Overfitting to Baseline**: Model calibrated to one event fails independent validation because parameters lack physical interpretability.
- **Spurious Correlation**: Negative controls reveal that apparent relationships are driven by confounding (e.g., seasonal cycles, spatial autocorrelation).
- **Extrapolation Collapse**: Claims applied outside validated boundaries (new hazard type, structure type, or climate regime) produce unreliable results.
- **Communication Hazard**: Uncertain research outputs are misinterpreted as operational directives or safety guarantees.

# Validity Checks

- **Confounder Audit**: Document forcing heterogeneity, sensor drift, maintenance history, temporal misalignment, and spatial autocorrelation.
- **Reproducibility**: Fix data versions, preprocessing scripts, model configurations, random seeds, and evaluation code; report variance across repeats.
- **Statistical Rigor**: Use independent test sets, appropriate pairing, confidence intervals, and robust metrics; avoid single-point inference.
- **Mechanistic Plausibility**: Ensure parameter changes and model responses align with domain physics; flag black-box predictions without diagnostic support.
- **Scale Consistency**: Verify that spatial/temporal resolution of inputs matches process representation; avoid mixing mismatched layers without uncertainty propagation.
- **Ethics and Privacy**: Aggregate sensitive exposure data; avoid stigmatizing communities; respect data licenses and infrastructure security.

# Provenance

- Synthesized from cluster 13.0 (subcluster 13.0, n=41) of the scientific skills codex.
- Source skill references: `inspection-digital-twin-seismic-fragility`, `urban-flood-risk-scenario-workflow`, `aviation-wind-field-reconstruction-workflow`, `shm-virtual-strain-research`, `solar-wind-cme-forecasting-research-workflow`, `urban-flood-process-modeling`, `urban-flood-community-model-exploration`, `coupled-hydrologic-flood-exploration`.
- Represents a semantic merge of end-to-end evidence analysis and claim audit patterns across natural hazards, built infrastructure, and environmental simulation domains.
