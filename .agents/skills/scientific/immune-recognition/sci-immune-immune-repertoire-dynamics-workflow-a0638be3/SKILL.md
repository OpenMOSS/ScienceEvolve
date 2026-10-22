---
name: sci-immune-immune-repertoire-dynamics-workflow-a0638be3
description: Reusable end-to-end workflow to disentangle generation, selection, expansion, and sampling effects in adaptive immune repertoire data by contrasting selected and less-selected product classes.
scienceevolve-title: "Antibody and immune recognition · immune repertoire dynamics workflow"
scienceevolve-area: antibody-and-immune-recognition
---

## Purpose

Guide agents through designing, analyzing, and iterating on immune-repertoire studies that separate diversity-generating processes from downstream filtering, clonal expansion, and measurement context. The workflow uses a selected-versus-less-selected comparator framework to distinguish mechanistic hypotheses without committing to specific disease models or assay platforms.

## When to use

- Use when planning research questions or analyses for B-cell receptor, T-cell receptor, antibody, or analogous diversity-selection systems.
- Use when repertoire data can be partitioned into a functional or selected product class and a less-selected input comparator class.
- Use to generate falsifiable hypotheses about whether observed repertoire changes reflect altered generation, selection, expansion, or sampling.
- Do not use for clinical diagnosis, treatment selection, patient management, therapeutic dosing, or operational wet-lab protocols.

## Inputs required

Before starting the workflow, collect:

- **Biological system:** species, receptor class, locus, and compartment.
- **Contrast condition:** perturbation, disease state, developmental stage, or exposure.
- **Repertoire data:** sequences or profiles with metadata covering source, compartment, time point, batch, chain, isotype, and quality flags.
- **Process models:** hypothesized diversity-generating mechanism and hypothesized selection or expansion mechanism.
- **Comparator definitions:** matched baseline, negative controls, positive or high-expectation controls, and disease controls when relevant.
- **Annotation resources:** germline references, region boundaries, and classification schemes.
- **Constraints:** ethical review, privacy, biosafety, data governance, and non-clinical scope limits.

## Core Workflow

Execute the following stages in order. At each decision gate, stop or pivot if the gate condition is not met.

1. **Gap framing and latent-process definition**
   - State the unobserved process to infer (generation, selection, expansion, or sampling).
   - List the observable trace and all competing explanations that could produce the same trace.

2. **Mechanism mapping and hypothesis generation**
   - Generate at least three competing hypotheses that cover generation, selection, expansion, and sampling.
   - For each hypothesis, specify:
     - predicted signature in selected products;
     - predicted signature in less-selected products;
     - evidence strength (high, moderate, low, speculative);
     - key assumptions;
     - likely failure modes;
     - boundary conditions where the effect should weaken or reverse.

3. **Comparator architecture and product classification**
   - Define **selected products** (functional or post-selection output).
   - Define **less-selected products** (input or pre-selection comparator).
   - Define **ambiguous or low-confidence products**.
   - **Decision gate:** If the two classes cannot be distinguished biologically or technically, stop and refine classification rules before proceeding.

4. **Study design and control specification**
   - Define comparison groups: matched baseline, perturbation, negative control, and positive or high-expectation control.
   - Specify stratifiers (tissue, stage, exposure history) and technical covariates (batch, depth, quality).
   - Choose evaluation metrics:
     - generation-related metrics;
     - selection-related metrics;
     - expansion or dominance metrics;
     - diversity and distributional metrics.
   - Define stopping conditions:
     - controls fail expected quality checks;
     - product classes cannot be distinguished;
     - batch or sampling explains the main signal;
     - uncertainty is too large for mechanistic interpretation.

5. **Quality gating and preprocessing**
   - Audit metadata, coverage, duplication handling, and annotation completeness.
   - Remove or flag low-quality samples and document exclusion rules.
   - Confirm comparable event-calling rules across product classes.
   - **Decision gate:** If quality checks fail or classes are mismatched, halt biological interpretation and repair measurement validity.

6. **Diversity profiling and metric computation**
   - Compute abundance-neutral and abundance-sensitive diversity metrics for single sites, local windows, and annotated regions.
   - Quantify clone abundance, dominance, recurrence, and distributional patterns.
   - Normalize by opportunity space (sequence length, region, time, or state space).

7. **Selected-versus-less-selected comparison**
   - Compare perturbation and control groups within matched strata.
   - Test whether the divergence between selected and less-selected products matches the hypothesized mechanism.
   - Check alternative explanations: tissue or compartment mismatch, developmental stage, exposure history, treatment effect, technical batch effects, duplicate artifacts, or ambiguous classification.

8. **Orthogonal integration and triangulation**
   - Pair repertoire signals with orthogonal readouts (phenotype, binding, functional state, tissue localization, or longitudinal behavior).
   - **Decision gate:** If repertoire and orthogonal readouts disagree, inspect assay coverage, clone size, cell composition, and preprocessing choices before making mechanism claims.

9. **Mechanistic adjudication and evidence grading**
   - Classify each finding as:
     - supports selection;
     - supports altered generation;
     - supports expansion;
     - supports sampling or confounding;
     - inconclusive.
   - Grade evidence: direct, indirect, exploratory, or speculative.
   - Clearly label agent-inferred conclusions versus data-supported observations.

10. **Iteration decision gate**
    - **If signal is robust and convergent:** strengthen the hypothesis and plan orthogonal validation or independent replication.
    - **If signal is assay-specific, batch-dependent, or non-reproducible:** pivot to technical validation; redesign contrast or classification rules.
    - **If signal is absent after adequate quality control and comparator matching:** stop and test whether the sampled compartment, receptor chain, timing, or comparator group was inappropriate.
    - **If controls fail:** downgrade confidence and redesign before any mechanistic claim.
    - Loop back to Stage 2 or 4 as indicated by the outcome.

## Output Format

Produce the following deliverables:

1. **Research question** and mechanism map.
2. **Hypothesis table** with evidence strength, key assumptions, predicted selected-product signature, predicted less-selected-product signature, likely failure modes, and boundary conditions.
3. **Experimental design** with comparison groups, product classes, variables, controls, metrics, and stopping conditions.
4. **Analysis plan** with quality gates, diversity metrics, stratification, statistical approach, robustness checks, and visualization priorities.
5. **Iteration plan** with decision rules for supported, discordant, negative, or artifact-prone outcomes.
6. **Validity and ethics statement** covering confounders, reproducibility requirements, boundary conditions, and non-clinical scope.

## Validation Gates

- **Product-class distinction gate:** Selected and less-selected products must be measurable, biologically justified, and distinguished before group comparison.
- **Control behavior gate:** Negative controls must show the expected absence of the target process; positive or high-expectation controls must show the expected presence.
- **Batch and sampling gate:** The main signal must survive adjustment for technical covariates and must not disappear under stratification by batch, source, or compartment.
- **Orthogonal convergence gate:** Repertoire signals must correspond to an independent readout before strong mechanistic claims are made.
- **Reproducibility gate:** The strongest signal should replicate in an independent dataset, held-out split, or cross-platform comparison when feasible.

## Claim Boundaries

- Claims apply only to the evaluated repertoire, assay, source, compartment, and measurement condition.
- Clonal dominance or repertoire restriction is evidence of selection pressure, not proof of antigen specificity, clinical relevance, or therapeutic efficacy.
- Sequence similarity or pattern divergence alone does not demonstrate antigen-driven selection, affinity maturation, or causal disease association.
- Single-cohort or single-system findings are not field-wide consensus.
- Statistical deviation from a null model is not equivalent to a validated biological mechanism.

## Failure Modes

- **Biological confounding:** Bystander expansion, infection, autoimmunity, or inflammation mimics antigen-driven selection.
- **Technical confounding:** Batch effects, sampling context, insufficient assay coverage, or annotation uncertainty obscures true patterns.
- **Comparator failure:** Groups mismatched on tissue, stage, exposure, age, sex, lymphocyte composition, or treatment history.
- **Classification failure:** Selected and less-selected products cannot be reliably separated.
- **Overfitting:** Multiple-testing inflation or small-sample spurious candidates produce false mechanistic signals.
- **Orthogonal discord:** Repertoire signal appears without phenotype, binding, or functional concordance.
- **Extrapolation error:** Restricted gene usage or diversification patterns from one haplotype, tissue, or condition are generalized without independent support.

## Validity Checks

- **Matching check:** Comparison groups are matched on major biological and technical covariates.
- **Classification check:** Selected, less-selected, and ambiguous products are defined before analysis.
- **Confounding check:** Infection, autoimmunity, prior therapy, age, sex, lymphocyte composition, sample timing, and batch effects are addressed.
- **Statistical check:** Tests are appropriate for count, proportion, and distributional data; multiple comparisons are controlled; effect sizes and uncertainty are reported.
- **Robustness check:** Conclusions survive reasonable alternative classification rules, normalization choices, and sensitivity analyses.
- **Reproducibility check:** Findings hold in independent samples, held-out splits, or cross-assay comparisons when feasible.
- **Boundary check:** Claims are limited to the sampled system, tissue, stage, and condition.
- **Evidence-labeling check:** Prior evidence, new inference, and speculation are clearly separated.

## Provenance

- Synthesized from cluster 18, subcluster 18.0.split0.
- Derived from source skills: `b72434b6f51a63a1` (b-cell-malignancy-tcr-exploration), `17d14ae70d6e4f7f` (repertoire-selection-research-agent), `f8d0872ac5b24e29` (repertoire-mutation-selection-exploration), `3b9344d12cdac359` (antibody-repertoire-sequence-diversification), `bbdd02e1a0dbf502` (immunoglobulin-germline-repertoire-discovery), `9dc00ec8ed502a02` (immunoreceptor-diversity-workflow), `567af323b2418bc7` (conserved-antigen-seroreactivity-workflow), `fa415d053ac276cd` (null-model-guided-selection-inference).
