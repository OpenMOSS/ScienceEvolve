---
name: sci-immune-biomarker-discordance-stratification-workflo-5329a211
description: A reusable workflow to resolve prognostic or predictive marker disagreement by identifying candidate modifiers, comparing baseline and combined models across orthogonal evidence streams, and validating stratification through independent cohorts and transportability checks.
scienceevolve-title: "Antibody and immune recognition · biomarker discordance stratification workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

This skill guides an agent in designing end-to-end research plans that resolve unexplained heterogeneity or discordance within an existing predictive framework, risk model, or target-state classification. It abstracts the shared methodology across biomarker and recognition studies: start from a baseline system that incompletely explains outcomes, propose biologically plausible modifiers or surrogates, test their incremental value through prespecified model comparisons and orthogonal validation, and iterate until claims are bounded by evidence.

# When to use

Use this skill when the user asks to:
- Investigate why units with the same baseline risk classification differ in outcomes or recognition patterns.
- Evaluate whether a candidate biomarker, cellular surrogate, sequence motif, or molecular feature adds independent explanatory power beyond an existing framework.
- Design validation studies that compare baseline, modifier-only, and combined models using clinical, functional, or recognition endpoints.
- Iterate on a hypothesis after finding confounding, non-incremental effects, instability, or failed external validation.
- Translate discordance between a convenient readout and a target state into a mechanistic or stratification hypothesis.

Do not use this skill for clinical decision-making, individual patient risk interpretation, operational laboratory protocols, or direct assay execution.

# Inputs required

- **Baseline framework**: the existing risk model, clinical stage, target-state definition, or recognition system that serves as the comparator.
- **Candidate modifier class**: the biomarker, surrogate, motif, feature, or readout proposed to explain residual heterogeneity, including biological rationale and measurement modality.
- **Outcome or target state**: the event, classification, or functional endpoint the combined system should predict or explain.
- **Data context**: available cohorts, specimen types, longitudinal follow-up, assay platforms, reference populations, and known sources of variation (batch, era, platform, matrix).
- **Use-case boundary**: whether the goal is discovery, incremental validation, mechanistic understanding, or clinical translation.
- **Constraints**: ethics, privacy, sample availability, follow-up duration, and whether the design is retrospective, prospective, or simulation-based.

# Core Workflow

1. **Frame the discordance gap**
   - Identify the unresolved prediction problem: what outcome or target state remains poorly explained by the baseline framework?
   - Quantify residual heterogeneity within baseline strata and decide whether it is large enough to be scientifically or decision-relevant.
   - **Decision gate**: If the baseline framework lacks sufficient validation or residual variance is trivial, stop or redefine the problem.

2. **Generate candidate modifier hypotheses**
   - Map candidate modifiers to biological mechanisms (e.g., intrinsic state, pathway activity, recognition interface, or presentation context).
   - Formulate falsifiable hypotheses: the modifier adds information within baseline strata; the modifier interacts with baseline risk; the modifier acts as a surrogate for a harder-to-measure state.
   - Score each hypothesis by evidence strength, key assumptions, and likely failure modes (e.g., confounding by treatment, assay noise, lack of natural threshold).
   - **Decision gate**: Retain only hypotheses that are measurable and falsifiable with available or obtainable data.

3. **Design multi-arm comparison and controls**
   - Prespecify comparison groups: baseline framework alone; candidate modifier alone; combined framework plus modifier; negative controls (unrelated marker or scrambled feature); positive controls (established factor when available).
   - Define primary outcomes, evaluation metrics (discrimination, calibration, incremental value, concordance), and analysis arms.
   - Set stopping conditions before analysis: event count thresholds, measurement reliability criteria, censoring limits, and failure criteria for controls.
   - **Decision gate**: If controls are inadequate or failure criteria are undefined, redesign before proceeding.

4. **Execute orthogonal evidence collection**
   - Gather data through at least two independent streams with different biases (e.g., longitudinal cohort plus cross-sectional biomarker; in vitro readout plus structural evidence; computational feature plus orthogonal assay).
   - Harmonize definitions, document missingness and exclusions, and separate training, validation, and test sets when feasible.
   - Verify measurement quality: inspect distributions, reference-population stability, and batch effects.
   - **Decision gate**: If measurement reliability is poor or reference populations are shifted, stop and repair assay standardization.

5. **Compare models and quantify discordance**
   - Fit baseline, modifier-only, and combined models; test independence, interaction, and incremental prediction using prespecified metrics.
   - Quantify concordance and discordance between the candidate modifier and the target state or outcome; identify dominant error types.
   - Assess threshold behavior: evaluate whether conclusions depend on an unstable cutoff or whether continuous reporting is preferable.
   - Conduct robustness checks: sensitivity to covariates, preprocessing, subgroup definitions, and adjustment for confounders.
   - **Decision gate**: If the combined model fails to improve prespecified metrics beyond baseline, proceed to iteration. If controls fail, stop mechanistic interpretation.

6. **Validate externally and test transportability**
   - Replicate findings in an independent cohort, assay platform, or institutional context.
   - Evaluate whether the modifier-target association persists across contexts; audit for cohort drift, assay differences, and population structure.
   - **Decision gate**: If external validation fails, narrow the claim to the tested context or reject the hypothesis. If successful, escalate confidence cautiously.

7. **Iterate or terminate**
   - **If confounded**: Redesign with adjusted analyses, prospective observation, or embedded designs; avoid causal claims from observational prognostic data.
   - **If non-incremental**: Simplify the model or search for mechanistically justified subgroups, treating subgroup findings as exploratory.
   - **If unstable**: Recalibrate thresholds or reposition the modifier for dynamic monitoring rather than baseline stratification.
   - **If non-transportable**: Revise the target population or standardize measurement protocols before broader application.
   - **Stop conditions**: Terminate if event counts are insufficient, censoring is excessive, measurement reliability is poor, the effect reverses in validation, or ethical constraints prevent further study.

# Output Format

When using this skill, return:

1. **Research question**: one sentence stating the unresolved discordance or prediction problem.
2. **Candidate modifier and rationale**: modifier class, biological plausibility, and expected relationship to residual heterogeneity.
3. **Evidence status**: separation of source-supported methods, prior literature, and new inferences.
4. **Hypothesis set**: for each hypothesis, evidence strength, key assumptions, predicted effect, and likely failure modes.
5. **Study design**: population or sample context, cohort type, comparison groups, variables, outcomes, follow-up or exposure definition, and confounder plan.
6. **Analysis plan**: descriptive checks, model comparisons, incremental prediction metrics, robustness analyses, and visualization strategy.
7. **Minimal validation plan**: positive controls, negative controls, specificity controls, success criteria, and stopping conditions.
8. **Iteration plan**: how to revise the hypothesis if results are confounded, non-incremental, unstable, or non-transportable.
9. **Validity and ethics statement**: confounding risks, censoring, privacy, consent, equity, clinical-use boundaries, and non-clinical scope.

# Validation Gates

- **Baseline reproduction**: Can the baseline framework reproduce its known performance in the current dataset?
- **Measurement quality**: Is the candidate modifier measured with acceptable reliability, and are reference populations stable?
- **Control integrity**: Do positive, negative, and specificity controls perform as expected?
- **Incremental value**: Does the combined model improve prespecified discrimination, calibration, or reclassification metrics beyond the baseline?
- **Robustness**: Does the association persist under alternative preprocessing, covariate adjustment, and subgroup exclusions?
- **External concordance**: Are findings consistent across independent cohorts, platforms, or assay systems?
- **Ethical and data governance**: Are privacy, consent, and regulatory requirements satisfied for the proposed data use?

# Claim Boundaries

- Distinguish **association** from **prediction**, **prediction** from **clinical utility**, and **recognition** from **functional mechanism**.
- Label claims as: baseline-framework observation; modifier association; combined-model incremental prediction; externally validated stratification; or mechanistic inference.
- Do not equate prognostic separation with treatment benefit unless tested by randomized design or treatment interaction.
- Do not treat surrogate binding as proof of chemical equivalence, diagnostic readiness, or regulatory acceptability.
- Bound all claims by the tested population, sample type, platform, assay format, and intended use case.

# Failure Modes

- **Confounding**: Treatment selection, disease burden, era effects, or population structure mimic modifier effects.
- **Non-incrementality**: The modifier duplicates baseline information or fails to improve prespecified metrics.
- **Measurement instability**: Assay variability, batch effects, platform changes, or threshold optimization drive apparent signal.
- **Overfitting**: Apparent improvement is driven by small sample size, excessive covariates, or post hoc thresholding.
- **Non-transportability**: Results reverse or degrade in independent cohorts due to population drift or assay differences.
- **Discordance misinterpretation**: Marker-target disagreement reflects true biological independence rather than technical noise, leading to false surrogate assumptions.
- **Control failure**: Positive or negative controls fail, indicating assay artifacts or nonspecific effects that invalidate interpretation.

# Validity Checks

- **Confounding check**: Are treatment, era, comorbidity, and sampling biases addressed by design or analysis?
- **Endpoint validity**: Are outcomes defined consistently, adjudicated blinded to modifier status when possible, and free from competing-risk ambiguity?
- **Censoring and follow-up**: Is follow-up adequate for the outcome latency, and is censoring non-informative?
- **Statistical power**: Are event counts and stratum sizes sufficient for the planned comparisons?
- **Multiple testing**: Are corrections applied for marker screening, subgroup analysis, and threshold selection?
- **Model assumptions**: Are hazards, linearity, interaction, and calibration assessed before presenting combined models?
- **Reproducibility**: Are analysis rules, code, and decision criteria documented and versioned for independent audit?
- **Boundary check**: Are the closest negative cases, weakest positives, and context failures explicitly identified?

# Provenance

This skill was synthesized from cluster `64`, subcluster `64.0.split0`, workflow archetype *machine-learning-assisted mechanism discovery and validation*. Source skills contributing to the merged route include:

- `cll-prognostic-stratification-research` (skill_id: 8c5b8c8d3fa258b8)
- `flow-cytometry-surrogate-marker-validation` (skill_id: 6e3b4688d4070c8a)
- `paratope-anchored-surrogate-discovery` (skill_id: fc6675076460eaef)
- `prolamin-epitope-research-pattern` (skill_id: 3e633814b3f69fbf)
- `indolent-mcl-research-exploration` (skill_id: c2bd3f3bb1b3050a)
- `hla-triplet-alloreactivity-exploration` (skill_id: 212448bbaa16de9b)
- `surrogate-anti-idiotypic-receptor-discovery` (skill_id: 8d0c7a8f944cfecb)
- `antibody-binder-mechanism-exploration` (skill_id: 1e1f2a0b3ffe4b6f)

Paper-specific findings, systems, and numerical results from these sources were abstracted into the reusable workflow structure above and are not restated as domain conclusions.
