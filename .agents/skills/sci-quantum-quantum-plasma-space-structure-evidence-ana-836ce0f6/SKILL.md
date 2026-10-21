---
name: sci-quantum-quantum-plasma-space-structure-evidence-ana-836ce0f6
description: End-to-end evidence analysis and claim audit workflow for quantum, plasma, and space structure research, synthesizing hypothesis generation, multi-scale validation, and iterative claim bounding.
scienceevolve-title: "Quantum materials and condensed matter · quantum plasma space structure evidence analysis workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Guide agents through a reusable, end-to-end workflow to audit scientific evidence and bound claims in quantum, plasma, space, and condensed matter research. The workflow transforms anomalous observations or theoretical gaps into falsifiable mechanism hypotheses, designs minimal viable validations with rigorous controls, and iteratively updates confidence based on multi-source evidence. It enforces separation between observation, model consistency, and field-level confirmation.

# When to use

- The user needs to propose new research questions from anomalies, gaps, or unexpected patterns.
- The user needs to generate candidate mechanisms and rank them by evidence strength.
- The user needs to design experimental, observational, or computational validation schemes.
- The user needs to analyze multi-scale or multi-modal data (local and global, real-space and reciprocal-space, classical and quantum regimes).
- The user needs to iterate hypotheses and bound claims without overstepping the available evidence.

Do not use for operational execution protocols, safety-critical procedures, literature summarization, definitive proof-of-existence without audit, or domain-general tutoring outside evidence analysis.

# Inputs required

- **Target system class** and known baseline behavior.
- **Anomaly or gap definition**: the observed deviation and why it challenges current expectations.
- **Available evidence types**: e.g., spectroscopic, imaging, transport, simulation, or theoretical.
- **Candidate mechanisms** and their predicted signatures.
- **Observable proxies**: indirect measurements that can test predictions.
- **Constraints**: non-operational boundaries such as resolution limits, scale separations, or data availability.
- **Baseline models**: established explanations against which new mechanisms compete.

# Core Workflow

1. **Frame Anomaly and Baseline**
   - State the observed deviation and the accepted theoretical or empirical baseline.
   - Define the minimal conditions under which the anomaly appears.
   - *Gate 1 — Anomaly Clarity*: If the deviation cannot be distinguished from noise, artifacts, or baseline variability, stop and refine the observation definition.

2. **Generate Mechanism Hypotheses**
   - Produce 2–5 candidate hypotheses that explain the anomaly.
   - For each hypothesis specify: mechanism statement, falsifiable prediction, evidence strength (low/medium/high), key assumptions, and failure modes.
   - Prioritize hypotheses that are mutually distinguishable via planned observations.
   - *Gate 2 — Discriminability*: If no hypothesis predicts a unique observable difference under feasible conditions, reformulate or expand the observable set.

3. **Design Minimal Viable Validation**
   - Identify the smallest experiment, observation, or simulation that can discriminate the leading hypotheses.
   - Define controls:
     - **Positive control**: known scenario expected to produce the target signature.
     - **Negative control**: scenario where the signature should be absent or suppressed.
     - **Strong control**: scenario that isolates one mechanism variable while holding others fixed.
     - **Instrument/analysis control**: checks for artifacts, background, and processing bias.
   - Define independent, dependent, mediating, and confounding variables.
   - Preset stop conditions and success/failure criteria before data collection.
   - *Gate 3 — Control Rigor*: If the design cannot separate mechanism from correlation or artifact, redesign before proceeding.

4. **Collect Multi-Scale / Multi-Modal Evidence**
   - Gather data across relevant scales or modalities.
   - Document sampling strategy, resolution limits, and any enhancement methods for rare events.
   - Maintain traceability of raw data, processing steps, and parameter choices.
   - *Gate 4 — Data Quality*: If resolution, coverage, or calibration is insufficient to test the falsifiable predictions, pause and improve data quality or revise hypotheses.

5. **Analyze via Model Comparison**
   - Fit baseline models first; use as reference.
   - Fit mechanism models to multiple independent metrics, not just a single peak or intensity.
   - Assess parameter identifiability and report which parameters are constrained by data versus freely adjustable.
   - Compare models using residuals, cross-validation, or information criteria.
   - *Gate 5 — Model Discrimination*: If the mechanism model does not outperform the baseline across independent metrics and control groups, downgrade the hypothesis.

6. **Audit Robustness and Confounders**
   - Vary boundary conditions, processing choices, initialization, or sub-samples to test stability.
   - Systematically check confounders: background signals, selection bias, finite-size effects, alternative mechanisms, instrument response, and environmental covariates.
   - Quantify uncertainty and sensitivity of conclusions to each assumption.
   - *Gate 6 — Robustness*: If the signal disappears or reverses under plausible variations, treat it as a preliminary clue rather than a supported mechanism.

7. **Grade Evidence and Bound Claims**
   - Assign evidence grade:
     - **Weak**: pattern similarity without independent controls.
     - **Medium**: consistent with predictions and basic controls.
     - **Strong**: supported by multiple independent checks and strong controls.
     - **Field-confirmed**: independently replicated by separate groups or methods.
   - Bound claims into tiers: observed signal, correlation with conditions, consistency with mechanism, and causal mechanism proven.
   - *Gate 7 — Claim Proportionality*: If the claim strength exceeds the evidence grade, weaken the claim before output.

8. **Iterate or Exit**
   - **If supported**: Define the next discriminating test, boundary condition scan, or cross-system migration check.
   - **If mixed**: Refine the hypothesis or increase model complexity only when justified by new constraints.
   - **If contradicted**: Pivot to the next best alternative hypothesis; document the falsified path.
   - **Stop conditions**: Halt when a preset stop condition is met (e.g., negative control fails, conservation laws are violated, model overfits, or required validation is infeasible).

# Output Format

Each invocation must produce a structured report with the following sections:

1. **Research Question**: One-sentence definition of the new problem and its relation to the anomaly.
2. **Gap and Baseline**: Description of the anomaly, existing baseline, and why it matters.
3. **Hypothesis Portfolio**: Candidate hypotheses with predictions, evidence strength, key assumptions, and failure modes.
4. **Validation Design**: Minimal viable validation, variables, controls (positive, negative, strong, instrument), evaluation metrics, and stop conditions.
5. **Analysis Plan**: Baseline model, mechanism model, metrics for comparison, parameter identifiability, and visualization strategy.
6. **Robustness Audit**: Confounder checks, sensitivity analyses, and reproducibility requirements.
7. **Evidence Grading**: Current grade for each hypothesis and bounded claim statements.
8. **Iteration Plan**: Next steps for support, partial support, contradiction, or boundary failure.
9. **Validity and Boundary Statement**: Extrapolation limits, non-operational safety boundaries, and ethical compliance notes.

# Validation Gates

- **Gate 1 — Anomaly Clarity**: The deviation must exceed noise, artifacts, and baseline variability.
- **Gate 2 — Hypothesis Discriminability**: Predictions must produce observably different outcomes under feasible conditions.
- **Gate 3 — Control Rigor**: The validation design must separate mechanism from correlation and artifact.
- **Gate 4 — Data Quality**: Evidence must be sufficient to test the falsifiable predictions.
- **Gate 5 — Model Discrimination**: The mechanism model must outperform the baseline across independent metrics and control groups.
- **Gate 6 — Robustness**: The signal must survive plausible variations in parameters, processing, and boundary conditions.
- **Gate 7 — Claim Proportionality**: The strength of any claim must not exceed the assigned evidence grade.

# Claim Boundaries

- Distinguish between "observed pattern," "consistent with model," and "mechanism causally established."
- Do not present model results as experimental facts or simulation outputs as observational truths.
- Do not extrapolate conclusions beyond the validated parameter range, system class, or measurement modality.
- Do not assert field consensus based on a single study, dataset, or model.
- Avoid operational claims; the workflow provides research design only.

# Failure Modes

- Hypotheses are formulated too vaguely to be falsified.
- Controls are missing or insufficient to rule out confounders.
- The anomaly is later traced to an artifact, background, or processing error.
- Results depend on a single dataset, simulation run, or unverified assumption.
- Model overfitting masks lack of genuine predictive power.
- Evidence is selectively reported, suppressing negative or null results.
- Conclusions are extrapolated across scales, systems, or domains without re-validation.

# Validity Checks

- **Symmetry and Consistency**: Does the mechanism respect known conservation laws and symmetry constraints? Are baseline and target states distinguishable?
- **Reproducibility**: Can the signal be recovered with independent samples, initialization, processing pipelines, or observers?
- **Statistical Validity**: Are sample sizes, error estimates, multiple-comparison corrections, and model-selection criteria adequate?
- **Confounder Exclusion**: Have background, instrument response, selection bias, finite-size effects, and environmental covariates been quantified?
- **Model Boundary**: Are approximations, truncated degrees of freedom, and ignored interactions explicitly stated?
- **Evidence Hierarchy**: Is it clear which conclusions come from direct observation, model inference, analogy, or speculation?
- **External Consistency**: Do the conclusions agree with independent observations, conservation relations, and established theory in the appropriate limit?

# Provenance

Synthesized from cluster 193.0 (quantum-plasma-space-structure-evidence-analysis). Source skills: quantum-material-qpi-research-design, strong-field-qed-coherent-emission-exploration, space-plasma-kinetic-structure-discovery, cuprate-real-space-pairing-workflow, space-plasma-reconnection-workflow, superfluid-collective-mode-research, spin-lattice-coupling-research-explorer, exciton-phonon-coherence-research-workflow.
