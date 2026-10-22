---
name: sci-immune-adaptive-immune-repertoire-convergence-workf-8c785364
description: A reusable end-to-end workflow for generating, testing, and iterating mechanistic hypotheses from adaptive immune receptor repertoire convergence patterns while separating biological selection from technical bias and confounding.
scienceevolve-title: "Antibody and immune recognition · adaptive immune repertoire convergence workflow"
scienceevolve-area: antibody-and-immune-recognition
---

## Purpose

Guide agents to design research programs that infer mechanism from recurrent or convergent features in adaptive immune repertoires—such as clonotype enrichment, shared sequence motifs, V-gene usage biases, or lineage expansion—through controlled comparison, bias discrimination, and iterative validation. The workflow treats convergence as a hypothesis requiring evidence triangulation rather than proof of selection.

## When to use

Use this skill when a user asks to:

- Generate research questions from repertoire sequencing, clonotype tracking, or immune receptor diversity data.
- Design studies linking receptor sequence patterns to antigen recognition, selection pressure, tissue homing, or disease mechanism.
- Compare hypotheses about convergent selection, construction bias, sampling artifacts, or model-specific phenotypes across immune repertoires.
- Plan validation for whether recurrent receptor features reflect biological function, technical artifact, or confounding context.

Do not use for clinical diagnosis, patient-specific recommendations, operational wet-lab protocols, or therapeutic guidance.

## Inputs required

Before starting, request or infer:

- **Biological system and question**: species, tissue or compartment, receptor class (e.g., BCR, TCR, antibody), disease or antigen context, and the mechanistic gap.
- **Data assets**: repertoire sequences, annotations (V/D/J, CDR3, clonotype), metadata (batch, donor, tissue, clinical covariates), and reference databases.
- **Comparator definitions**: baseline or unselected repertoires, healthy controls, non-target tissues, unrelated receptor sets, or curated outgroups.
- **Constraints**: ethics and privacy boundaries, computational resources, cohort size, sequencing depth, and whether the plan must remain computational or low-intervention.
- **Prior evidence**: literature benchmarks, known motifs, curated clades, or validated antigen-specific receptors.

If any input is missing, state assumptions explicitly and mark downstream conclusions as provisional.

## Core Workflow

1. **Frame the gap and define convergence targets**
   - State the observation (recurrent motif, clonotype expansion, V-gene bias, tissue enrichment, phylogenetic cluster) and the unresolved mechanism.
   - Define the convergence dimension: sequence, structural, functional, or phylogenetic recurrence.

2. **Generate competing hypotheses**
   - Formulate mechanistic hypotheses (antigen-driven selection, tissue retention, developmental bias, host-genetic constraint).
   - Formulate non-adaptive alternatives (generation probability, sampling bias, batch effects, reference bias, assembly or annotation artifacts, model-specific phenotypes).
   - Assign preliminary evidence strength (high / moderate / low) and state key assumptions for each.

3. **Design minimal viable validation**
   - Select primary comparators: affected versus unaffected tissue, selected versus unselected repertoire, disease versus healthy, or target versus non-target antigen.
   - Build a control matrix:
     - **Negative controls**: unrelated specificities, shuffled sequence backgrounds, non-template controls, healthy comparators.
     - **Positive controls**: known antigen-specific or disease-relevant receptors, where available.
     - **Context-swap controls**: same receptor or feature in alternate genetic, antigen, or tissue context.
     - **Technical controls**: replicate batches, independent sequencing runs, annotation cross-checks, and versioned references.
   - Predeclare the primary endpoint and stopping conditions before analysis.

4. **Execute repertoire characterization and quality control**
   - Document data provenance, batch structure, and metadata completeness.
   - Filter low-confidence reads or annotations; document exclusion rates.
   - Normalize for sequencing depth, sampling fraction, and batch before group comparisons.
   - **Decision Gate — QC Gate**: If sample identity checks fail, contamination is detected, or batch effects dominate biological signal, stop and resolve technical quality before proceeding.

5. **Detect and quantify convergence patterns**
   - Identify recurrent clonotypes, motifs, V/J usage biases, or phylogenetic clusters using predefined thresholds.
   - Quantify diversity, dominance, overlap, and convergence metrics against the chosen baseline.
   - **Decision Gate — Candidate Gate**: If recurrence is no greater than baseline expectation or negative controls, stop mechanism claims and reformulate hypotheses toward bias or neutral explanations.

6. **Discriminate mechanism from bias**
   - Compare observed patterns across independent cohorts, tissues, or model systems.
   - Test sensitivity to analytical thresholds, reference versions, and assembly or annotation choices.
   - Evaluate confounders: genetic background, HLA or MHC restriction, treatment history, age, sex, and processing batch.
   - **Decision Gate — Mechanism Exclusion Gate**: If patterns disappear under alternative references, sampling schemes, or context swaps, classify as likely technical artifact or context-dependent phenotype and iterate.

7. **Link structure to function (when data permit)**
   - Integrate binding, structural, or functional avidity evidence only if independently validated.
   - Compare dominant or convergent clonotypes against subdominant or non-convergent groups.
   - **Decision Gate — Functional Validation Gate**: If functional readouts conflict with sequence patterns, separate "present in repertoire" from "causally active" and redesign around independent functional readouts.

8. **Iterate or redesign**
   - If convergence is reproducible and specific: narrow the hypothesis to antigen, tissue mechanism, or selection mode; plan deeper validation.
   - If convergence is ambiguous: expand sampling, add orthogonal assays, or tighten controls.
   - If convergence is absent: preserve the negative result as a boundary condition; audit QC and metadata.
   - **Decision Gate — Iteration Gate**: Stop if two independent iterations fail to reproduce the pattern, if controls consistently fail, or if the leading hypothesis depends on an unsupported leap from sequence to mechanism.

9. **Bound claims and finalize outputs**
   - Classify claims as validated, pilot-supported, inferred, or unsupported.
   - State boundary conditions: species, tissue, disease stage, receptor chain, and assay limit.
   - Document residual risks and the next decisive test.

## Output Format

When using this skill, return:

1. **Research question and scope**: the specific gap and receptor or tissue context.
2. **Evidence map**: what is known, inferred, or unknown.
3. **Hypothesis table**: claim, evidence strength, key assumptions, predicted observations, and failure modes.
4. **Validation design**: comparators, control matrix, primary endpoint, and stopping conditions.
5. **Analysis plan**: QC, normalization, convergence detection, mechanism discrimination, and sensitivity analyses.
6. **Iteration log**: hypothesis updates, design changes, and residual risks after each cycle.
7. **Claim boundary statement**: scope, exclusions, and what is not justified.
8. **Validity and ethics notes**: confounders, reproducibility checks, and non-clinical scope.

## Validation Gates

- **QC Gate**: Data quality, contamination checks, and batch structure must support biological interpretation before testing convergence.
- **Candidate Gate**: Convergence must exceed baseline expectation and negative-control thresholds to proceed with mechanism claims.
- **Mechanism Exclusion Gate**: Patterns must survive alternative references, analytical thresholds, and context-swap controls to be considered biological.
- **Functional Validation Gate**: Functional or structural links require independent evidence; sequence recurrence alone is insufficient for causality.
- **Iteration Gate**: Reproducibility across independent samples, cohorts, or orthogonal assays is required before broadening claims.

## Claim Boundaries

- Do not equate sequence recurrence with antigen identity, causality, or clinical relevance.
- Do not generalize from single cohorts, tissues, or model systems without independent replication.
- Keep computational predictions separate from experimentally validated function.
- Limit claims to the studied receptor class, species, compartment, and disease or antigen context.
- Avoid presenting a single study or analysis as field-wide consensus.

## Failure Modes

- **Technical artifact**: batch effects, primer bias, sequencing error, annotation ambiguity, reference bias, or assembly fragmentation explain apparent convergence.
- **Sampling bias**: low cell yield, uneven depth, or pseudoreplication distorts diversity and recurrence estimates.
- **Confounding**: genetic background, HLA or MHC type, treatment history, or tissue-processing differences masquerade as selection.
- **Overfitting**: motif or clonotype definitions tuned to discovery data fail in independent validation.
- **Context-specific phenotype**: convergence observed only in one model system or background reflects system artifact rather than conserved biology.
- **Unsupported extrapolation**: inferring mechanism, immune control, or therapeutic utility from sequence patterns alone.

## Validity Checks

- **Confounding control**: Are disease or state variables entangled with age, sex, genetics, batch, or tissue processing?
- **Reproducibility**: Can primary conclusions be replicated in independent cohorts, data splits, or orthogonal assays?
- **Statistical validity**: Are units of analysis correct, multiple comparisons handled, and effect sizes reported with uncertainty?
- **Reference robustness**: Do clade or motif assignments persist under alternative references, annotations, or inference methods?
- **Baseline adequacy**: Does the unselected or baseline proxy plausibly represent the pre-filter repertoire?
- **Evidence separation**: Are results labeled as paper-verified, reproduced in the current analysis, inferred, or speculative?
- **Boundary scoping**: Are claims restricted to the tested taxon, locus, receptor chain, and disease stage?

## Provenance

- Synthesized from cluster 68 / subcluster 68.0.split0.
- Derived from source skills: immunogenomics-vgene-research-workflow (5cccf508998fcbcd), immune-repertoire-amplicon-exploration (43a111c8213915f7), antibody-repertoire-selection-exploration (71d3a4adaa59b7fe), psoriasis-tcr-repertoire-exploration (1a690a643ab86605), autoimmune-ocular-tcr-exploration (279e452d373ca059), tcr-epitope-repertoire-exploration (152352defadf1d51), comparative-immunoreceptor-evolution-explorer (427cb87f0035a65c), autoantibody-repertoire-research-skill (43b776ce8a36cee5).
