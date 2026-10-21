---
name: sci-chromatin-methylation-context-research-design-workf-3d74c0ba
description: End-to-end research design workflow for generating testable hypotheses and validation plans in regulatory and epigenetic genomics across defined biological contexts.
scienceevolve-title: "Chromatin and epigenomic regulation · methylation context research design workflow"
scienceevolve-area: chromatin-and-epigenomic-regulation
---

# Purpose

Help an agent translate regulatory and epigenetic questions into structured, testable research designs. The workflow covers hypothesis generation, multi-layer evidence integration, controlled comparison design, and iterative validation across contexts such as cell states, tissues, environmental exposures, and phenotypic gradients. It abstracts reusable methodological patterns without embedding paper-specific conclusions, operational wet-lab recipes, or species-specific parameters.

# When to use

Trigger this skill when the user needs to:
- Propose new research questions in regulatory genomics, epigenetics, chromatin biology, or DNA methylation.
- Integrate multi-layer evidence (e.g., methylation, chromatin state, transcription factor binding, expression, 3D contacts) into mechanistic hypotheses.
- Design comparisons with strong negative, positive, background-matched, and orthogonal controls.
- Plan analysis pipelines, candidate prioritization, and iteration rules for regulatory or epigenetic datasets.
- Distinguish exploratory associations from mechanistic candidates and from causally supported claims.

Do not use for clinical diagnosis, therapeutic advice, individual risk prediction, or generation of executable wet-lab protocols, hazardous procedures, or fabrication parameters.

# Inputs required

- **Biological system**: species, tissue or cell type, developmental stage, and state definitions (e.g., baseline, activated, exposed, diseased).
- **Regulatory/epigenetic layer(s)**: relevant marks or features such as DNA methylation, chromatin accessibility, histone modifications, transcription factor binding, enhancer status, or 3D contacts.
- **Candidate features or target regions**: differentially marked loci, candidate enhancers/promoters, regulatory variants, or literature-derived regions, plus their annotation sources.
- **Functional context**: the dynamic background (cell state, environmental condition, time window, phenotype gradient) in which features are hypothesized to operate.
- **Comparison framework**: baseline versus target state definitions, matched background requirements, and intended statistical contrasts.
- **Data resources**: available omics datasets, public reference data, annotation databases, sample metadata, and quality metrics.
- **Constraints**: ethical approvals, sample availability, batch structure, statistical power considerations, and extrapolation boundaries.

If independent validation data or critical metadata are missing, label conclusions as inferential and prioritize minimal viable validation.

# Core Workflow

## 1. Frame the regulatory question and context
- Define the biological state transition, perturbation, or phenotypic gradient to be explained.
- Identify the regulatory gap: what remains unexplained at the epigenetic or regulatory layer given current genetic, environmental, or expression evidence.
- Specify the functional context (cell type, tissue, exposure window, developmental stage) and state why it is the appropriate testing ground.
- **Gate 1**: Is the question tractable via comparative epigenetic/regulatory profiling across clearly defined contexts? If no, reformulate the problem or stop.

## 2. Define candidate features and matched backgrounds
- Assemble candidate regulatory features (e.g., differentially methylated regions, differential peaks, candidate enhancers, binding sites) from authoritative, traceable sources.
- Construct matched background sets that control for genomic composition, region length, CpG or motif density, detectability, and annotation opportunity.
- **Gate 2**: Are candidates and backgrounds comparable and free from severe platform or selection bias? If severe bias exists, refine feature definitions or halt until matching is achievable.

## 3. Generate graded, falsifiable hypotheses
- Formulate mechanistic hypotheses using a chain: context → epigenetic/regulatory change → target gene or program → functional outcome.
- For each hypothesis, specify: evidence strength (weak / moderate / strong), key assumptions, possible failure modes, minimal validation strategy, and extrapolation boundaries.
- Explicitly distinguish observations from source data or literature from inferences being made for the new system.
- **Gate 3**: Are hypotheses falsifiable with explicit negative predictions? If not, revise until they are.

## 4. Design controlled comparisons
- Define variables:
  - Independent: biological state, context, perturbation, or time.
  - Dependent: mark status, chromatin feature, expression, contact frequency, or phenotypic readout.
  - Covariates: batch, genetic background, cell composition, age, sex, tissue heterogeneity, coverage, or platform.
- Establish controls:
  - Negative / baseline: unrelated regions, inactive states, random permutations, or matched backgrounds.
  - Positive: known regulatory relationships or established state markers.
  - Orthogonal: independent data type, public dataset, cross-tissue/individual validation, or complementary assay.
  - Genetic / technical: account for CpG-SNP overlap, population structure, kinship, batch effects, and coverage differences.
- Define minimal viable validation: the smallest evidence set that can distinguish a context-specific signal from background.
- Define stop conditions: control failure, irreproducibility, confounding exceeding biological signal, ethical or resource barriers, or negative independent validation.
- **Gate 4**: Does the design include sufficient controls to interpret a negative result meaningfully? If not, redesign before proceeding.

## 5. Execute multi-layer analysis and cross-validation
- Quality control: audit metadata, batch structure, sample purity, coverage, reproducibility, and missing data patterns.
- Differential detection: identify state-dependent changes using pre-defined statistical models, covariate adjustment, and multiple testing correction.
- Cross-layer integration: intersect epigenetic marks with expression, chromatin states, transcription factor motifs, 3D contacts, and functional annotations; prioritize directionally consistent signals across layers.
- Functional context filtering: test whether static regulatory features gain explanatory power only within the correct dynamic context (e.g., cell state or exposure).
- Background-matched enrichment: compare candidates against matched backgrounds, not the whole genome, and report effect sizes and sensitivity to background definition.
- Sensitivity analysis: assess robustness to thresholds, annotation versions, region definitions, covariates, and normalization choices.
- **Gate 5**: Do candidate signals survive matched-background comparison and cross-layer consistency checks? If no, downgrade to exploratory and pause mechanistic claims.

## 6. Prioritize candidates and classify relationships
- Rank candidates by: cross-layer evidence strength, directional consistency, independence from confounders, detectability of failure modes, and feasibility of orthogonal validation.
- Classify regulatory relationships using context-appropriate categories (e.g., silent, constitutive, context-responsive, mark-dependent; or contact-driven, state-driven, factor-mediated, boundary-dependent).
- Maintain strict separation between correlation and causation, and between contact/association evidence and functional evidence.
- **Gate 6**: Are top candidates supported by orthogonal data or only by single-layer association? If only single-layer, label as exploratory.

## 7. Iterate, update, or stop
- **If supported**: plan orthogonal perturbation or validation, expand to independent samples, and refine the mechanism (direct vs indirect, transcriptional vs post-transcriptional).
- **If partially supported**: split the mechanism into context-specific or tissue-specific sub-hypotheses; audit genetic, batch, or cell-composition confounding.
- **If unsupported**: audit phenotype definition, feature selection, background matching, and confounders; pivot to an alternative regulatory layer or candidate set.
- **If ambiguous**: increase sample depth, refine metadata, add functional readouts, or narrow the context window.
- **Stop conditions**: persistent control failure, inability to separate signal from genetic/batch confounding, violation of ethical or resource constraints, or failure to replicate in independent data.
- **Gate 7**: After iteration, does updated evidence strength justify continued investment? If no, document failure modes and terminate the line of inquiry.

# Output Format

Deliver a structured research plan containing:
1. **Research question and boundaries**: target state, regulatory layer, downstream readout, and extrapolation limits.
2. **Evidence map**: known background, data gaps, and whether evidence derives from user data, literature, public data, or inference.
3. **Candidate hypothesis table**: hypothesis statement, mechanism chain, evidence strength, key assumptions, possible failure modes, and minimal validation.
4. **Experimental/analytical design**: variables, covariates, control strategy (negative, positive, orthogonal), evaluation metrics, and stop conditions.
5. **Analysis plan**: QC steps, differential detection, cross-layer integration, functional context filtering, background-matched enrichment, sensitivity analysis, and candidate ranking rules.
6. **Iteration roadmap**: actions for supported, partially supported, unsupported, and ambiguous results.
7. **Validity and safety statement**: confounders addressed, statistical safeguards, reproducibility requirements, ethical boundaries, and inference limits.

# Validation Gates

- **Context adequacy**: The functional context is well-defined and matched to the candidate features being tested.
- **Control sufficiency**: Negative, positive, background-matched, and orthogonal controls are present and appropriate for the hypothesis.
- **Confounder audit**: Genetic variation (including CpG-SNPs), batch, cell composition, age, sex, tissue heterogeneity, and technical artifacts are explicitly addressed.
- **Reproducibility requirement**: Independent biological replicates, cross-batch checks, or public data validation are planned before mechanistic claims.
- **Statistical rigor**: Models are pre-defined, multiple testing is controlled, effect sizes and uncertainties are reported, and sensitivity analyses are included.
- **Mechanistic caution**: Causality is distinguished from correlation; contact or association evidence is distinguished from functional evidence.

# Claim Boundaries

- Distinguish observations in source data or literature from inferences made for a new system.
- Distinguish single-layer association from multi-layer mechanistic support.
- Distinguish exploratory findings from validated candidates.
- Do not present single-paper conclusions as field consensus.
- Do not extrapolate across species, tissues, or disease states without an explicit re-validation design.
- Avoid clinical, diagnostic, or therapeutic interpretation of molecular associations.

# Failure Modes

- **Control failure**: Negative or background controls show equivalent signal; positive controls fail to recover expected patterns.
- **Confounding dominance**: Batch, genetic, or technical effects exceed the biological signal of interest.
- **Irreproducibility**: Candidate signals are lost in independent samples, alternative thresholds, or cross-platform checks.
- **Feature bias**: Candidates are driven by length, CpG density, sequence composition, or annotation asymmetry rather than biology.
- **Over-interpretation**: Conflating enrichment with causation, contact with activation, or methylation change with phenotypic determinism.
- **Resource or ethical barrier**: Missing metadata, insufficient sample size, or lack of compliance approval blocks valid inference.

# Validity Checks

- **Confounders**: Genetic structure (e.g., CpG-SNPs), population stratification, kinship, age, sex, nutrition, environment, tissue heterogeneity, cell composition, batch, platform, and coverage.
- **Statistical validity**: Pre-defined primary endpoints, multiple comparison correction, permutation or label-randomization tests, reporting of effect sizes and uncertainties, and avoidance of post-hoc narrative fitting.
- **Reproducibility**: Independent biological replicates, cross-batch consistency, traceable analysis code with versioned parameters, and preserved negative results.
- **Biological validity**: Candidate loci link to plausible genes, pathways, or functional readouts; enrichment or annotation alone does not prove function.
- **Extrapolation boundaries**: Same-species and same-tissue inferences are stronger than cross-species or cross-tissue; discovery-stage results are weaker than independent validation; association is weaker than mechanism.

# Provenance

Synthesized from cluster 1.0 (regulatory-epigenetic-methylation-context-research-design-workflow) source skills: tf-chromatin-cell-state-research, chip-regulatory-locus-research-design, context-aware-regulatory-coupling-exploration, epigenomic-phenotype-research-design, methylation-context-functional-research, systemic-epigenetic-variant-research-design, enhancer-3d-genome-research-workflow, histone-isoform-research-exploration.
