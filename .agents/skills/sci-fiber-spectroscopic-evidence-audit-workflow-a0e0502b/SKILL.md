---
name: sci-fiber-spectroscopic-evidence-audit-workflow-a0e0502b
description: End-to-end evidence analysis and claim audit workflow for spectroscopic measurements across physical sciences, emphasizing multi-diagnostic cross-validation and iterative hypothesis refinement.
scienceevolve-title: "Fiber composites and battery materials · spectroscopic evidence audit workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Help an agent transform spectral or spectroscopic observations into auditable research questions, design minimal viable validation schemes with explicit controls, and iterate on claims while guarding against selection biases, hidden structure variables, and over-interpretation. The workflow abstracts methodological patterns from astrophysical surveys, condensed-matter spectroscopy, materials characterization, and planetary remote sensing into a domain-agnostic evidence-audit route.

# When to use

- When the user holds spectral, spectroscopic, or energy-resolved data and needs to audit an anomaly, non-detection, or cross-band inconsistency.
- When multiple diagnostics, bands, or theoretical estimators must be reconciled before a physical claim can be made.
- When selection functions, instrumental response, calibration drift, or hidden structure variables may distort inference.
- When migrating an explanatory mechanism from one target system, material, or band to another.
- When non-detections need to be converted into model-conditional constraints rather than treated as exclusions.

Do not use for purely imaging analyses without spectral resolution, for operational instrument control, or for tasks requiring hazardous procedural details.

# Inputs required

- **Target system**: Category, known physical state, and relevant spatial/temporal scales.
- **Data assets**: Spectral/spectroscopic data, calibration files, response functions, and archival cross-matches with provenance.
- **Baseline model**: The default assumption or standard simplification being challenged.
- **Selection function**: Coverage, completeness, purity, detection limits, and known instrumental artifacts.
- **Candidate mechanisms**: Physical variables or hypotheses that could explain the observed spectral features or gaps.
- **Control references**: Positive, negative, and strong control samples, mock data, or calibration sources.
- **Constraints**: Acceptable uncertainty level, computational resources, and ethical/data-usage boundaries.

If inputs are missing, the agent must list gaps and propose alternative inference paths rather than forcing a conclusion.

# Core Workflow

## 1. Gap Definition & Baseline Audit
- State the target quantity and the baseline model or default assumption.
- Identify the observational gap, anomaly, or expected-versus-observed discrepancy that motivates the audit.
- **Decision gate**: If the gap cannot be expressed as an observable difference or testable deviation, stop and reformulate the question.

## 2. Hypothesis Generation with Competing Mechanisms
- Propose at least two competing hypotheses: one artifact or bias hypothesis, one known-mechanism variant, and one new-structure or new-physics hypothesis.
- Map each hypothesis to a mechanism chain: physical variable → spectral signature → observable prediction.
- Label evidence strength (Strong / Moderate / Weak / Speculative) and state key assumptions and failure modes for each.
- **Decision gate**: If no hypothesis generates a falsifiable spectral prediction, stop and request additional data or theoretical guidance.

## 3. Diagnostic Portfolio Design
- Select at least two independent diagnostic paths (e.g., different spectral lines, bands, resolutions, or theoretical estimators).
- Designate a strong diagnostic (sensitive to hidden structure or bias) and a weak diagnostic (robust reference).
- Define positive, negative, and strong controls using reference samples, mock injections, or calibration data.
- **Decision gate**: If diagnostics are not independent or controls are unavailable, flag residual confounding risk before proceeding.

## 4. Minimal Viable Validation (MVV)
- Execute the smallest analysis that can distinguish the leading hypotheses (e.g., a subsample, mock injection, cross-band consistency check, or injection-recovery test).
- Propagate uncertainties from calibration, selection function, background, and model assumptions.
- Record data versions, preprocessing steps, quality cuts, and parameter settings.
- **Stop condition**: If the MVV fails to recover the positive control, or if the negative control shows a spurious signal, halt and debug the pipeline before scaling.

## 5. Multi-Diagnostic Cross-Validation
- Compare results across diagnostics on the same target set.
- Check for consistent bias direction if hidden structure variables are present.
- Convert non-detections into conditional upper limits with explicit model dependencies (spectrum shape, absorption, geometry, calibration).
- **Decision gate**: If diagnostics conflict beyond propagated errors, stop and investigate systematics (calibration, alignment, selection function, cross-matching) before offering a physical interpretation.

## 6. Claim Grading & Mechanism Arbitration
- Grade each hypothesis as: Supported, Weakened, Indistinguishable, or Conflicted.
- Update evidence strengths and prune hypotheses that fail key predictions.
- **Iteration trigger**: If multiple hypotheses remain viable, design a follow-up observation or analysis targeting the maximum information gain to separate them.

## 7. Iteration or Exit
- **Continue**: If a hypothesis is supported but needs broader sample validation, additional diagnostics, or cross-facility confirmation.
- **Pivot**: If results are mixed, redefine sub-samples, refine the selection function, introduce new controls, or replace the spectral proxy.
- **Stop**: If the signal is fully explained by systematics; if the correction factor dominates the measurement; if the result is insensitive to the mechanism of interest; or if further data can only reduce random error while systematic error remains dominant.
- **Final gate**: Before output, verify that no source-specific numerical results, operational protocols, fabrication parameters, or unsafe procedural details have been introduced.

# Output Format

Structure the final report as follows:

1. **Research Question & Baseline Audit**
   - Target quantity, baseline assumption, and observable gap.

2. **Hypothesis Matrix**
   - For each hypothesis: mechanism chain, spectral prediction, evidence strength, key assumptions, and failure modes.

3. **Diagnostic Portfolio & Control Design**
   - Strong and weak diagnostics, positive/negative/strong controls, and independence justification.

4. **MVV Execution Summary**
   - Subsample or mock description, uncertainty propagation, and pipeline recovery results.

5. **Cross-Validation Results & Constraints**
   - Diagnostic comparison, bias direction check, and model-conditional upper limits for non-detections.

6. **Claim Grading & Updated Evidence Map**
   - Supported / Weakened / Indistinguishable / Conflicted classification with rationale.

7. **Iteration Plan or Stop Rationale**
   - Next-step observation, analysis, or explicit reason for termination.

8. **Transferability Boundary**
   - What is domain-generic versus what is system-specific and requires re-validation.

# Validation Gates

- Distinguish "verified in source literature" from "agent inference on a new target."
- Ensure single-paper conclusions are not treated as field consensus.
- Confirm that selection functions, calibration states, and backgrounds are modeled or explicitly flagged.
- Verify that non-detection claims include conditional upper limits and their model dependencies.
- Ensure positive, negative, and strong controls are defined and evaluated before mechanism claims.
- Confirm the output contains no operational recipes, fabrication parameters, instrument commands, or unsafe procedures.

# Claim Boundaries

- Do not extrapolate beyond the joint boundary defined by sample selection, spectral range, resolution, energy/wavelength coverage, and model assumptions.
- Do not present model-dependent inferences as data-direct conclusions.
- Do not transfer specific numerical parameters, material recipes, or instrument settings from one system to another.
- Mark all analogical inferences and cross-system migrations as such, with explicit re-validation requirements.

# Failure Modes

- **Systematic mimicry**: A hidden calibration bias or selection effect reproduces the target spectral signal.
- **Diagnostic conflict**: Independent diagnostics yield incompatible results because of unmodeled systematics.
- **Over-interpretation of non-detection**: Treating upper limits as absolute exclusions without propagating spectral model dependencies.
- **Domain overreach**: Applying a mechanism validated in one material or astrophysical system to another without checking boundary conditions.
- **Pipeline false positive**: Negative controls or mock data produce spurious significant results.
- **Conflation of discovery and mechanism**: Confusing "the spectrum is anomalous" with "the anomaly is caused by X."

# Validity Checks

- **Confounding**: Sample selection, instrumental response, background, blending, aperture or fiber effects, extinction/absorption, redshift or energy-scale errors, contamination, and cosmic variance.
- **Reproducibility**: Fixed data versions, code versions, random seeds, filtering rules, quality thresholds, and mock settings.
- **Statistical rigor**: Prior sensitivity, posterior predictive checks, power and detectability estimates, multiple-comparison control, model degeneracy, and residual diagnostics.
- **Boundary conditions**: Explicitly state where the workflow applies (e.g., resolved vs. unresolved, optically thin vs. thick, coherent vs. disordered, saturated vs. linear).
- **Provenance trace**: Every claim must link back to the diagnostic path and control that supports it.

# Provenance

- Synthesized from cluster 13.1 (spectroscopy-binary-astronomical-spectroscopic-electronic-structure-evidence-analysis-workflow).
- Source skills: compact-binary-xray-inference-workflow, astronomical-spectroscopic-survey-discovery, phonon-spin-dmr-exploration, stellar-anomaly-binary-evolution-research, hii-region-abundance-bias-exploration, small-x-saturation-neutrino-workflow, oxide-electronic-structure-exploration, planetary-volatile-resource-exploration.
- Methodological patterns were extracted and abstracted; no paper-specific conclusions, numerical results, or operational protocols are included.
