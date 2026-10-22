---
name: sci-immune-immune-repertoire-comparative-analysis-workf-0a89fbc9
description: End-to-end workflow for comparing immune receptor repertoires across biological states, subgroups, or taxa through layered feature extraction, baseline comparison, assay-failure auditing, and mechanism-aware hypothesis iteration.
scienceevolve-title: "Antibody and immune recognition · immune repertoire comparative analysis workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Help an agent turn a comparative immune-receptor repertoire question into a structured, reusable research workflow. It guides hypothesis generation, controlled comparison, layered feature analysis, and iterative validation while keeping biological claims separate from technical artifacts and paper-specific conclusions.

# When to use

Use this skill when the user asks to compare immune receptor repertoires—such as B-cell, T-cell, or analogous variant-selection systems—across biological states, developmental stages, disease subgroups, exposures, or taxa. It is appropriate for research planning, analysis design, and mechanism exploration. Do not use this skill for clinical diagnosis, treatment recommendations, patient-specific advice, or operational wet-lab protocol generation.

# Inputs required

Before starting the workflow, collect or infer:

- **Biological context**: receptor system, compartment, organism, and subgroup definitions.
- **Comparative objective**: discovery, validation, assay reliability, or mechanism discrimination.
- **Data context**: available modalities, annotation pipelines, quality constraints, and baseline or comparator definitions.
- **Layer scope**: which mechanistic layers to compare (e.g., segment usage, junctional diversity, mutation, selection).
- **Constraints**: ethics, privacy, consent, sample access, and governance limits.
- **Prior evidence**: known conflicts, gaps, or literature benchmarks to bound expectations.

If any critical input is missing, state the assumption and mark downstream conclusions as provisional.

# Core Workflow

1. **Frame the comparison and define units**
   - State the research question, subgroup definitions, and biological unit (e.g., rearrangement, clone, cell, sample).
   - Match comparator groups for developmental stage, tissue source, and major covariates.
   - **Decision Gate DG1**: If subgroups are confounded by batch, tissue source, or assay platform, halt and redesign the comparison framework before proceeding.

2. **Decompose into mechanistic layers and extract features**
   - Map repertoire diversification into ordered layers (e.g., combinatorial assembly, junctional diversification, post-rearrangement mutation, selection and expansion).
   - Compute layer-specific features using explicit, reproducible assignment rules.
   - **Decision Gate DG2**: If assignment confidence or data quality is inadequate for a layer, flag it as provisional and exclude it from primary conclusions.

3. **Establish baseline and audit assay failures**
   - Define a matched baseline repertoire reference appropriate to the organism, locus, and annotation method.
   - Build a denominator map tracking samples, rearrangements, successful assays, failed assays, unresolved cases, and exclusions.
   - Audit negative or ambiguous primary-assay results with quality-control evidence and, where available, orthogonal modalities.
   - **Decision Gate DG3**: If the baseline is unstable, failure rates are excessive, or unresolved cases cluster in one subgroup, stop biological interpretation and redesign controls or sampling.

4. **Generate a competing-hypothesis portfolio**
   - For each observed or expected pattern, create at least:
     - one repertoire-bias or mechanism hypothesis;
     - one assay or technical-bias hypothesis;
     - one generation-bias or confounder hypothesis.
   - Label each hypothesis with evidence strength (speculative / weak / moderate / strong), key assumptions, discriminating predictions, likely failure modes, and boundary conditions.

5. **Design minimal viable validation**
   - Specify primary and secondary contrasts, negative controls, positive controls, orthogonal controls, and background markers.
   - Predefine evaluation metrics (effect size, uncertainty, detection rate, cross-modality concordance) and stopping conditions.
   - **Decision Gate DG4**: If no discriminating prediction can be tested with available data and controls, downgrade all hypotheses to speculative and require additional input.

6. **Execute layer-wise comparative analysis**
   - Compare test and matched reference groups within each layer.
   - Quantify uncertainty and effect size; avoid relying on nominal differences.
   - Run sensitivity analyses under alternative assignment rules, filters, and thresholds.
   - Validate unexpected low-frequency events with independent or orthogonal approaches when feasible.
   - **Decision Gate DG5**: If the signal disappears after background normalization, sensitivity analysis, or covariate adjustment, treat it as non-specific or technical and pivot to bias hypotheses.

7. **Resolve failures and update the denominator map**
   - Classify unresolved cases as likely technical, likely biological, mixed, or unresolved.
   - Use orthogonal data to distinguish biological absence from assay failure.
   - Maintain a decision log linking each unresolved case to hypothesis revisions.

8. **Iterate hypotheses and decide next steps**
   - Update evidence strengths:
     - Strengthen mechanism claims only when convergent multi-layer signals persist across independent samples and orthogonal checks.
     - Shift toward generation or technical bias if background or non-functional variants show similar enrichment.
     - Narrow or split hypotheses if results are context-dependent (stage, tissue, genotype).
   - **Stop conditions**:
     - Orthogonal validation repeatedly fails.
     - Signal is confined to a single assay, batch, or annotation pipeline.
     - Multiple mechanisms explain the observation equally well after controls.
     - Sample metadata are too confounded to separate biology from technical variation.
   - Define the next minimal validation or terminate the workflow.

# Output Format

When using this skill, produce:

1. **Research question** — concise comparative question and its biological tractability.
2. **Mechanistic layer map** — layers involved, expected features, and known gaps.
3. **Hypothesis portfolio** — at least three competing hypotheses with evidence strength, assumptions, predictions, failure modes, and boundaries.
4. **Validation plan** — cohort or comparator structure, controls, metrics, and stopping conditions.
5. **Analysis plan** — feature extraction rules, baseline comparison logic, uncertainty quantification, sensitivity checks, and failure-resolution logic.
6. **Iteration roadmap** — how results will strengthen, weaken, redirect, or retire hypotheses.
7. **Validity and ethics statement** — confounders, reproducibility limits, boundary conditions, and data-governance constraints.

# Validation Gates

- **DG1 — Confounder separation**: Subgroups must be separable from batch, tissue, and assay confounders.
- **DG2 — Layer quality**: Each analyzed layer must meet minimum assignment confidence and data-quality thresholds.
- **DG3 — Baseline stability**: Baseline repertoire and assay failure rates must support reliable comparison.
- **DG4 — Discriminating testability**: At least one hypothesis must yield a testable, discriminating prediction with available controls.
- **DG5 — Signal robustness**: Observed differences must survive sensitivity analysis and background adjustment.
- **DG6 — Mechanistic specificity**: Mechanism claims require convergent multi-layer or orthogonal evidence; association alone is insufficient.

# Claim Boundaries

- Distinguish **observed pattern**, **inferred mechanism**, and **speculative extension**.
- Do not treat a single study, cohort, or assay platform as field-wide consensus.
- Do not generalize beyond the sampled compartment, developmental stage, or consent scope.
- Keep disease-relevance claims separate from molecular repertoire evidence unless independently validated.
- Avoid clinical interpretation, diagnosis, prognosis, or treatment recommendations.

# Failure Modes

- **Technical**: assay primer mismatch, batch effects, annotation ambiguity, contamination, duplicate handling errors, reference mismatch.
- **Analytical**: mixing sample-level and rearrangement-level denominators, overinterpreting small frequencies without uncertainty, post-hoc subgrouping, overfitting.
- **Biological confounding**: developmental stage shifts, cell-composition changes, prior exposure, infection history, treatment effects, genetic background.
- **Interpretive**: conflating generation bias with selection, treating assay absence as biological absence, extrapolating from single taxa or contexts.

# Validity Checks

- **Confounding**: Are subgroups matched for stage, source, and major covariates? Could cell composition or exposure history explain the pattern?
- **Reproducibility**: Are feature definitions explicit? Are uncertainty estimates reported? Are results robust to alternative rules and filters?
- **Baseline appropriateness**: Does the comparator match the biological and technical context?
- **Assay complementarity**: Are negative or ambiguous primary results resolved with orthogonal or quality-control evidence?
- **Statistical validity**: Are effect sizes, uncertainty intervals, and multiple-comparison controls reported appropriately?
- **Annotation reproducibility**: Can germline assignment, mutation status, and junction features be reproduced by a documented pipeline?
- **Boundary conditions**: Are conclusions limited to the studied compartment, locus, and data quality? Is taxon sampling adequate for evolutionary claims?
- **Causal humility**: Are association, mechanism, and causality clearly separated?

# Provenance

Derived from cluster 75, subcluster 75.1.split0. Synthesized from source skills: immune-repertoire-layered-exploration (a72737ebf6e7d672), b-cell-receptor-repertoire-exploration (be0618cca2914096), receptor-repertoire-selection-workflow (8d91c6e4996ae4e3), comparative-immunoglobulin-evolution-explorer (a80c9a602ef7d059), infection-immunity-biomarker-validation (91ae1179f5e42593), glycoimmunology-antibody-niche-discovery (0441060f106b6c52), autoantibody-origin-exploration (e7062f23fc102a93), serum-probe-nucleic-acid-binding-discovery (e5c212878b7f9c52).
