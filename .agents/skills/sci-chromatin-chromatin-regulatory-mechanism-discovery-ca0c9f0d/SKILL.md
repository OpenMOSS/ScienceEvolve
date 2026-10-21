---
name: sci-chromatin-chromatin-regulatory-mechanism-discovery-ca0c9f0d
description: A reusable end-to-end workflow for designing research plans that discover and validate chromatin-level regulatory mechanisms from multi-source epigenomic and sequence evidence.
scienceevolve-title: "Chromatin and epigenomic regulation · chromatin regulatory mechanism discovery workflow 3"
scienceevolve-area: chromatin-and-epigenomic-regulation
---

# Purpose

Help an agent turn observable epigenomic and regulatory patterns into testable mechanistic hypotheses and validation plans. The workflow separates physical engagement from functional outcome, distinguishes correlation from mechanism, and iterates only when evidence changes the scientific decision.

# When to use

Use this skill when:
- the user asks for new research questions in regulatory genomics, chromatin mechanisms, enhancer function, transcription-factor binding specificity, or epigenomic state transitions;
- the user needs a study design that separates binding engagement from downstream functional effects;
- the user wants to integrate broad discovery data, sequence or chromatin features, and orthogonal validation;
- the task is research planning, not clinical advice, wet-lab execution, or operational protocol generation.

# Inputs required

Ask the user or environment for:
- the target regulatory system, biological context, and scope boundary;
- available observable evidence, such as chromatin accessibility, binding profiles, occupancy maps, chromatin states, or sequence data;
- known recognition features, motif references, regulatory annotations, or prior predictive models;
- candidate functional readouts that can distinguish engagement from downstream activity;
- available controls, biological contexts, variants, or orthogonal validation methods;
- constraints on cost, sample availability, data access, ethics, biosafety, and reproducibility.

If any input is missing, state assumptions explicitly and label downstream conclusions by evidence strength.

# Core Workflow

Follow this ordered route. Do not skip decision gates.

1. **Frame the regulatory gap**
   - Define the intended regulatory relationship and the observable anomaly or unexplained pattern.
   - List plausible alternative mechanisms and separate what is observed from what is inferred.
   - *Decision gate*: Stop and refine the question if the gap is not falsifiable or lacks measurable outcomes.

2. **Generate competing mechanistic hypotheses**
   - Formulate at least three non-mutually-exclusive hypotheses (e.g., sequence-driven, chromatin-context-driven, co-factor-dependent, context-specific, or artifact/confounder-driven).
   - For each hypothesis, record: evidence strength (strong/moderate/weak/speculative), key assumptions, predicted observations, strongest negative control, likely failure mode, and minimal validation.
   - *Decision gate (candidate gate)*: Proceed only if hypotheses are distinct and each has a defined minimal validation. Otherwise, narrow the scope.

3. **Design minimal viable validation**
   - Define prediction units and candidate sets: intended positives, empirical discovery candidates, feature-prediction candidates, shared-signal candidates, and matched background or negatives.
   - Construct labels using orthogonal evidence when possible; avoid circular predictor-label pairs.
   - Select predictor layers (sequence, chromatin state, accessibility, co-factor context) and hold-out axes (genomic leakage, biological-context leakage).
   - Establish controls: positive, negative, background, shared-signal, replicate, model baseline, and orthogonal validation.
   - Predefine evaluation metrics and stop conditions before analysis.
   - *Decision gate*: Stop if positive and negative controls are indistinguishable or if labels are circular.

4. **Survey and partition evidence**
   - Run broad empirical discovery and feature-based prediction in parallel.
   - Partition candidates by discovery source: empirical, predicted, shared, or background.
   - Apply quality control: assess coverage, reproducibility, mapping confidence, background noise, and artifact-prone regions; exclude or flag unreliable candidates.
   - *Decision gate (stability gate)*: Stop or redesign if replicate agreement is poor, background signal approaches intended signal, or candidates are dominated by ambiguous regions.

5. **Discriminate mechanisms**
   - Compare simple baselines against structured or joint models; treat architecture choice as a variable, not a conclusion.
   - Stratify results by candidate class and biological context; inspect errors (false positives/negatives) as clues to missing context or incorrect assumptions.
   - Distinguish direct recognition from correlated background structure; separate engagement-only signals from activity-positive signals.
   - *Decision gate (mechanism exclusion)*: Reject a mechanistic claim if matched negatives erase performance, if simple baselines equal complex models, or if interpretation is unstable across model families.

6. **Orthogonal validation**
   - Confirm key candidates with independent assays, annotations, or functional readouts not used in discovery.
   - Compare engagement and activity readouts conceptually; classify candidates as engagement-only, activity-positive, both, or neither.
   - *Decision gate (functional validation)*: If orthogonal evidence contradicts the primary screen without an explainable reason, pause and inspect confounders before proceeding.

7. **Iterate or redesign**
   - Update the evidence ledger: mark each claim as observed, prior-supported, model-inferred, or speculative.
   - Use agreement across evidence modes to strengthen the model; use disagreement to generate new hypotheses about hidden determinants or assay limitations.
   - Choose the next minimal experiment or analysis that specifically challenges the surviving hypothesis.
   - *Decision gate (iteration gate)*: Continue only if uncertainty is reduced and the next test is discriminating. Stop if predefined stop conditions are met.

8. **Grade evidence and bound claims**
   - Assign final evidence grades:
     - **Strong**: convergent discovery, functional validation, controls, and orthogonal confirmation.
     - **Moderate**: two independent evidence modes or limited context validation.
     - **Weak**: single evidence mode or high sensitivity to assumptions.
     - **Inconclusive**: insufficient controls, replicates, or background estimates.
   - Explicitly state the transfer boundary: cell type, species, condition, assay family, and computational setting.
   - *Decision gate (claim bounding)*: Downgrade any claim that exceeds the tested context.

# Output Format

When using this skill, respond with:

1. **Research question and scope boundary** — concise problem statement and domain limits.
2. **Regulatory gap and mechanism map** — known evidence, unresolved gap, and main axes likely involved.
3. **Hypothesis table** — hypothesis, evidence strength, key assumptions, predicted observations, negative control, likely failure mode, and minimal validation.
4. **Minimal viable design** — units, labels, predictor layers, hold-out axes, control classes, evaluation metrics, and stop conditions.
5. **Analysis plan** — quality control, candidate classification, feature modeling, mechanism comparison, statistical interpretation, and evidence grading.
6. **Iteration plan** — next hypothesis to test, candidates or contexts that would challenge the model, and conditions for expanding or narrowing the claim.
7. **Validity and safety checks** — confounders addressed, reproducibility checks, generalization boundary, and ethics/privacy/biosafety constraints.

# Validation Gates

Before producing final recommendations, confirm:
- **Control adequacy** — positive, negative, background, shared-signal, replicate, and orthogonal validation controls are represented.
- **Confounder audit** — GC content, mappability, accessibility, sequence composition, batch effects, database bias, cell-type covariance, and artifact-prone regions have been considered.
- **Reproducibility** — replicate agreement, resampling stability, parameter sensitivity, and independence from a single tool or model family are reported.
- **Statistical validity** — multiple testing, appropriate test choice, effect sizes, uncertainty estimates, and calibration are addressed.
- **Mechanistic plausibility** — engagement and activity are interpreted separately; temporal ordering respects causality; feature importance is not treated as causal proof.

# Claim Boundaries

- Distinguish paper-derived reasoning from new-system inference.
- Distinguish computational support from experimentally verified binding or function.
- Limit generalization to comparable organisms, cell states, assay families, and computational settings.
- Do not treat motif similarity, feature importance, or model predictions as proof of protein identity or causal regulatory change.

# Failure Modes

Stop or redesign when:
- positive and negative controls are indistinguishable;
- replicate agreement is poor or background signal approaches intended signal;
- candidate sets are dominated by ambiguous or artifact-prone regions;
- orthogonal validation contradicts the primary screen without an explainable reason;
- performance depends on a single artifact, threshold, or model family;
- matched negatives erase performance, indicating confounder learning;
- interpretation is unstable across runs or architectures;
- claims exceed the tested context or assume universal rules from one system.

# Validity Checks

- **Circularity**: Were labels constructed independently from predictors?
- **Leakage**: Could adjacent genomic regions, shared samples, batches, or duplicated features cross train-test boundaries?
- **Batch and metadata confounding**: Are predictions driven by sample source, sequencing batch, cell-state imbalance, or technical covariates?
- **Class imbalance**: Are metrics appropriate for rare positive regions, and are calibration and threshold sensitivity reported?
- **Model dependence**: Do results persist across simple baselines and alternative architectures?
- **Interpretation robustness**: Do attribution or feature-importance methods agree, and do they reproduce known biology without merely memorizing labels?
- **Sparse-profile behavior**: Does the similarity metric or discovery method handle low-coverage or low-expression cases appropriately?
- **Boundary conditions**: Which systems, lineages, or data types are outside the method's valid scope?

# Provenance

- Derived from cluster 23.0 (chromatin-regulatory-interaction-epigenomic-mechanism-discovery).
- Synthesized from source skills: molecular-targeting-specificity-workflow, atac-footprint-uncharacterized-motif-research, chromatin-enhancer-discovery-workflow, epigenomic-sequence-interaction-prediction, accessible-regulatory-grammar-research, tfbs-mutual-exclusion-research, chromatin-tf-research-workflow.
- Phylogenomic-origin-research contributed model-comparison and evidence-grading patterns.
