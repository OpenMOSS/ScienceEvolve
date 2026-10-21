---
name: sci-chromatin-accessibility-sequence-evidence-analysis-cb13b5d9
description: A reusable end-to-end workflow for designing, benchmarking, and auditing evidence in regulatory epigenomics and chromatin accessibility studies, from hypothesis generation through multi-layer validation to claim bounding and iteration.
scienceevolve-title: "Chromatin and epigenomic regulation · accessibility sequence evidence analysis workflow"
scienceevolve-area: chromatin-and-epigenomic-regulation
---

# Purpose

Guide agents in conducting end-to-end evidence analysis and claim audit for regulatory epigenomics and chromatin accessibility research. The workflow covers hypothesis generation, controlled study design, multi-layer computational analysis, mechanism discrimination, and iterative claim bounding while rigorously separating source-supported findings from new inferences.

# When to use

Use this skill when designing or critiquing research questions in chromatin accessibility, DNA methylation, histone modification, three-dimensional genome organization, single-cell epigenomics, or multimodal regulatory profiling. It is appropriate for benchmarking assay platforms, analysis workflows, or computational correction methods, and for generating non-operational validation plans. Do not use this skill for clinical decision-making, wet-laboratory protocol execution, or as a source of field-wide consensus.

# Inputs required

Before producing a plan, request or infer:

1. **Biological system and transition**: organism, tissue, cell type, developmental stage, disease context, or perturbation of interest.
2. **Target regulatory layers**: accessibility, methylation, conformation, histone state, or multimodal combinations.
3. **Available data and modalities**: sequencing assays, imaging, public repositories, or simulated benchmarks, plus genome build and annotation versions.
4. **Candidate regions, genes, or cell states**: identifiers, coordinates, marker sets, or selection rationale.
5. **Comparison conditions**: biological contrasts, platform/assay classes, workflow components, or input regimes.
6. **Metadata and provenance**: sample identifiers, batch structure, processing history, repository versions, and correction status.
7. **Constraints**: ethical approvals, data governance, sample scarcity, compute limits, and biosafety considerations.
8. **Success criteria**: the evidence level required to consider a hypothesis useful, testable, and worth iterating.

If inputs are missing, state assumptions and mark downstream claims as provisional.

# Core Workflow

Follow this ordered route, enforcing each decision gate before proceeding.

## 1. Scope and Evidence Audit

- Define the regulatory gap or biological transition under study.
- Inventory available data modalities, metadata, annotation versions, and provenance.
- Distinguish biological gaps from evidence-management gaps (missing files, version mismatches, incomplete metadata).

**Gate 1 — Data Sufficiency**: Stop and request curation if required datasets are missing, incompletely versioned, or metadata are insufficient for meaningful group comparison.

## 2. Hypothesis Generation

- Produce ranked, mechanism-aware hypotheses (e.g., regulatory-state, layer-coupling, platform/assay-bias, sparsity-recovery, complementarity).
- For each hypothesis, specify: evidence strength (strong, moderate, weak, speculative), key assumptions, predicted observations, likely failure modes, and boundary conditions.
- Include at least one boundary hypothesis specifying where the model may fail across tissues, stages, platforms, or assay types.

**Gate 2 — Testability**: Proceed only if at least one hypothesis can be addressed by a minimal, non-operational validation plan with feasible controls.

## 3. Controlled Study Design

- Specify independent variables (biological condition, assay/platform class, workflow component, correction method), dependent variables (regulatory potential, methylation state, accessibility, conformation, expression linkage), and covariates (batch, tissue composition, input amount, GC content, annotation version, cell-cycle phase).
- Define positive, negative, technical, and orthogonal controls matched to the biological context.
- Predefine evaluation metrics and stop conditions before any analysis.

**Gate 3 — Control Viability**: Stop if appropriate controls are infeasible, if confounding cannot be balanced or modeled, or if metadata are too sparse to support the contrast.

## 4. Multi-Layer Analysis

- Execute quality-control checkpoints before and after each major transformation.
- Analyze each regulatory layer separately (e.g., sequence features, local accessibility, chromatin architecture, nuclear organization) rather than treating architecture as monolithic.
- When comparing methods, platforms, or modalities, keep data and reference constant while swapping one component; record agreement and disagreement explicitly.
- Stratify by genomic feature class, sequence context, and cell state.
- Use concordance between modalities or methods as robustness evidence; treat discordance as a signal for hidden heterogeneity or modality-specific bias.

**Gate 4 — Robustness**: If outputs are unstable across reasonable analysis choices, if QC flags dominate biological signal, or if negative controls show strong signal, iterate on preprocessing or redesign before biological interpretation.

## 5. Mechanism Discrimination and Claim Bounding

- Separate assay/platform effects from biological effects using matched materials and shared-feature analysis.
- Distinguish descriptive patterns, computational predictions, and causal mechanisms.
- Bound each claim by specifying whether it is directly supported, inferred, or speculative.
- Treat network enrichment, centrality, or correlation as explanatory support, not proof of causal regulation.

**Gate 5 — Mechanism Exclusion**: Downgrade or reject claims that rely solely on correlation, network proximity, single-method evidence, or unvalidated correction models.

## 6. Iteration or Redesign

- If predictions hold and controls behave as expected: raise evidence strength and propose a stronger validation comparison.
- If models or modalities disagree: inspect covariates, batch structure, sample composition, region definitions, and model assumptions before discarding candidates.
- If controls fail or results are nonspecific: preserve negative findings, revise candidate selection rules, and test boundary conditions.
- If a covariate explains the pattern: downgrade the biological mechanism and redesign around the covariate.

**Stop Condition**: Halt when controls fail irreparably, reproducibility is not achieved, performance depends on a single unstable parameter, or claims require extrapolation beyond tested boundaries.

## 7. Final Validation and Packaging

- Assemble all outputs with explicit evidence separation, uncertainty quantification, and generalization limits.
- Confirm that every claim passes the validity checks and that no clinical or operational guidance is implied.

# Output Format

Return results in this structure:

1. **Research question** — Clear question, scope, and biological context.
2. **Evidence audit** — Data inventory, version status, metadata completeness, and provenance summary.
3. **Ranked hypotheses** — Table with evidence strength, key assumptions, predicted observations, likely failure modes, and boundary conditions.
4. **Study design plan** — Variables, controls, minimal viable validation, strong validation, metrics, and stop conditions.
5. **Analysis plan** — QC sequence, multi-layer analysis, cross-method comparison, stratification, and orthogonal validation.
6. **Claim boundary statement** — Classification of each major claim as supported, inferred, or speculative, with causality limits.
7. **Iteration log** — Decision rules for strengthening, weakening, or redirecting hypotheses based on observed outcomes.
8. **Validity and ethics summary** — Confounders, reproducibility checks, statistical limits, boundary conditions, and safety constraints.

# Validation Gates

- **Data sufficiency**: All required datasets, metadata, and supplementary resources are complete, versioned, and traceable.
- **Control viability**: Positive, negative, technical, and orthogonal controls produce expected patterns or acceptable background.
- **Reproducibility**: Findings are stable across biological or technical replicates, alternative region definitions, and reasonable analysis choices.
- **Orthogonal support**: Key claims are backed by independent evidence, modalities, or references before mechanism inference.
- **Statistical rigor**: Multiple-testing correction, effect sizes, uncertainty estimates, and class-imbalance-aware metrics are applied.
- **Boundary compliance**: Claims are restricted to tested tissues, assays, platforms, organisms, and developmental conditions.

# Claim Boundaries

- Prediction or association does not imply causation.
- Network enrichment, centrality, or pathway membership is explanatory, not proof of causal regulation.
- Chromatin accessibility and methylation patterns indicate permissive potential, not proof of transcriptional activation or repression.
- Platform-specific, assay-specific, or workflow-specific findings are bounded to the tested conditions.
- Computational associations and correction-model outputs require independent validation before clinical, diagnostic, or mechanistic interpretation.

# Failure Modes

- Missing or inconsistent metadata and versioning invalidate comparison.
- Batch, platform, assay, or workflow effects are confounded with biological signal.
- Sparse or noisy data leads to artifactual signal recovery or overfitted latent structure.
- Single-method dependency produces unstable or irreproducible claims.
- Overfitting to network, pathway, or annotation resources without mechanistic specificity.
- Extrapolation beyond tested species, tissue, developmental window, disease context, or input regime.
- Interpretation of coverage absence as true biological absence without appropriate controls.

# Validity Checks

- **Confounders**: GC composition, region length, gene-family bias, batch effects, tissue composition, cell-cycle phase, sample synchrony, annotation density, and database coverage.
- **Reproducibility**: Coordinate consistency, versioned data sources, repeated analysis with alternative definitions, documented random seeds, and pipeline provenance.
- **Statistical validity**: Appropriate negative controls, multiple-testing correction, uncertainty estimates, and performance metrics that handle class imbalance.
- **Mechanistic coherence**: Regulatory changes, regulator activity, and output changes point in the same direction before causal language is used.
- **Evidence separation**: Paper-supported facts, cross-study support, and agent-generated inferences are explicitly labeled and not conflated.
- **Ethical and data constraints**: Human, animal, privacy, consent, and data-use requirements are respected; clinical guidance is not inferred from exploratory analyses.

# Provenance

- Synthesized from cluster 24.0 (regulatory-chromatin-accessibility-sequence-evidence-analysis-workflow).
- Source skills: cancer-gene-methylation-research-design; bisulfite-methylation-platform-comparison; chromatin-cell-state-research-workflow; developmental-3d-genome-research-workflow; chromatin-assay-workflow-benchmarking; sparse-single-cell-epigenomics-research; regulatory-epigenomics-version-aware-research; multimodal-nucleus-omics-research-design.
- Paper-derived operational details, parameters, and conclusions have been abstracted into reusable methodological logic.
