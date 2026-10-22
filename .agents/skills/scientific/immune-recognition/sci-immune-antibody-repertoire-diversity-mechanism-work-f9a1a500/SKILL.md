---
name: sci-immune-antibody-repertoire-diversity-mechanism-work-f9a1a500
description: A reusable workflow for designing and validating mechanistic hypotheses about antibody repertoire diversity by comparing germline template capacity to observed variant richness, using controlled inference and iterative refinement.
scienceevolve-title: "Antibody and immune recognition · antibody repertoire diversity mechanism workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Guide agents in generating research questions and validation plans for antibody repertoire diversity mechanisms. The workflow compares inherited template capacity against observed variant richness, distinguishes biological diversification from technical artifacts, and iteratively refines mechanistic claims using specificity controls and orthogonal evidence.

# When to use

Use when the task involves:
- Explaining why observed antibody or immunoglobulin diversity exceeds known germline template capacity.
- Designing studies to distinguish inherited multiplicity, somatic diversification, recombination, selection, or sampling bias.
- Evaluating repertoire composition, clonal structure, gene-family usage, or autoreactive subset origins.
- Comparing genotype-level diversity with phenotype-level binding, kinetic, or functional data.
- Planning non-clinical research in immune receptor systems without operational wet-lab execution.

Do not use for clinical diagnosis, treatment recommendations, therapeutic design, or operational laboratory protocols.

# Inputs required

Before executing the workflow, collect or infer:
- Target receptor family or variant class.
- Available data types: sequences, structural models, genomic annotations, expression profiles, or binding/phenotypic measurements.
- Baseline comparators: germline references, naive repertoires, unrelated-antigen controls, or out-group families.
- Conserved anchor features defining family membership, independent of diversity features under study.
- Candidate template-capacity estimates and diversity metrics.
- Controls: positive, negative, out-group, orthogonal, and background references.
- Constraints: ethics, biosafety, data privacy, sample access, and platform limitations.
- User objective: hypothesis generation, experimental design, analysis planning, or critique.

If inputs are missing, state assumptions explicitly and flag confidence limitations.

# Core Workflow

## Stage 1: Frame the diversity puzzle
1. Define the observed variant family using conserved anchor features independent of the diversity being explained.
2. State the baseline template model (germline, inferred ancestral, or annotated reference capacity).
3. Identify the gap: observed richness, structure, or function that challenges the baseline model.
4. **Decision gate:** If the family boundary is circular or the baseline model is undefined, stop and redefine anchors or references.

## Stage 2: Generate competing hypotheses
1. **Template-capacity hypotheses:** observed variants map to known templates; require more templates than annotated; or apparent mismatch reflects incomplete sampling or hidden template classes.
2. **Diversification hypotheses:** variation arises post-template through mutation-like, recombination-like, selection-like, or editing-like processes.
3. **Artifact hypotheses:** signal is driven by detection bias, platform enrichment, sampling imbalance, or annotation error.
4. **Functional-consequence hypotheses:** variation affects binding, specificity, cross-reactivity, or stability.
5. Annotate each hypothesis with evidence strength, key assumptions, predicted observations, and likely failure modes.

## Stage 3: Design minimal validation
1. Define independent and dependent variables mapped to the mechanism under test.
2. Assemble controls:
   - Positive: expected to show the template or family signal.
   - Negative: expected to lack the variable or template-defining signal.
   - Out-group: related but distinct class testing specificity.
   - Orthogonal: independent data modality validating the same biological unit.
   - Background/matrix: estimates non-specific signal.
3. Pre-register the primary comparison, decision rule, and stop conditions before inspection.
4. **Decision gate:** If controls are unavailable or the template space is too incomplete, pause and redesign before proceeding.

## Stage 4: Execute analysis and specificity testing
1. Validate data quality: coverage, completeness, contamination, batch effects, source imbalance.
2. Estimate template capacity with uncertainty and sensitivity to alternative models.
3. Quantify observed diversity: richness, subgroup structure, similarity distribution, feature-level variation.
4. Test specificity and overlap: confirm related variants share expected template evidence; confirm out-groups do not produce the same signal.
5. Compare capacity and diversity: determine whether template capacity accounts for observed richness; identify unexplained features.
6. **Decision gate:** If negative controls show recurrent signal, or estimates fail to converge, treat as specificity failure and halt biological interpretation.

## Stage 5: Mechanism discrimination
1. Evaluate whether unexplained diversity is best attributed to somatic diversification, recombination, junctional variation, selection, or detection bias.
2. Use additivity, non-overlap logic, or perturbation tests to separate shared-template evidence from distinct mechanisms.
3. Link genotype features to phenotype only when pairing and identity are secure.
4. **Decision gate:** If the leading hypothesis depends on unsupported assumptions or circular definitions, demote it and return to Stage 2.

## Stage 6: Iteration and claim bounding
1. Update evidence strength for each hypothesis based on results.
2. Retire hypotheses that fail strong controls; preserve ambiguous hypotheses with explicit boundary conditions.
3. Refine family boundaries, template estimates, or diversity metrics as needed.
4. If results are ambiguous, prioritize broader sampling, independent modalities, alternative template methods, or subfamily comparisons.
5. **Stop condition:** Stop when the main uncertainty is resolved, shown to require a different data type, or when controls consistently fail.

## Stage 7: Synthesize and output
1. Label each conclusion by evidence category: inherited-template, diversification-process, functional-consequence, or model-structure.
2. State scope boundaries: studied family, related families, or broader class.
3. Separate directly observed evidence from inferred or speculative claims.

# Output Format

When using this skill, produce:

1. **Research question** — One concise, mechanism-bounded question.
2. **Evidence map** — What is directly supported, inferred, and unknown.
3. **Hypothesis set** — Ranked hypotheses with evidence strength, key assumptions, predicted observations, failure modes, and boundary conditions.
4. **Validation design** — Variables, controls, primary and secondary endpoints, and stop conditions.
5. **Analysis plan** — Quality checks, template-capacity estimation, diversity quantification, specificity tests, and statistical/sensitivity checks.
6. **Iteration plan** — How positive, negative, or ambiguous results update hypotheses and trigger redesign.
7. **Validity and safety statement** — Major confounders, reproducibility requirements, ethical/biosafety boundaries, and non-clinical scope.

# Validation Gates

- **Family-definition gate:** Family membership must be defined by features independent of the diversity being explained.
- **Control gate:** Positive, negative, out-group, and orthogonal controls must behave as expected before biological interpretation.
- **Convergence gate:** Template-capacity estimates must be stable under reasonable alternative models.
- **Specificity gate:** Out-group and negative controls must not reproduce the target signal.
- **Mechanism-separation gate:** Claims about inherited templates, diversification, and functional consequences must rest on distinct evidence streams.
- **Reproducibility gate:** Conclusions should hold across independent samples, methods, or contexts where feasible.

# Claim Boundaries

- **Inherited-template claims:** Apply only to the studied family or locus unless cross-validated.
- **Diversification claims:** Require evidence that observed variation exceeds template capacity after accounting for uncertainty and controls.
- **Functional claims:** Require secure genotype-to-phenotype linkage with preserved pairing or appropriate null models.
- **Generalization limits:** Do not extend single-study or single-cohort findings to field-wide consensus or clinical application.
- **Evidence-category separation:** Do not use model-structure or functional evidence as proof of diversification mechanism without additional validation.

# Failure Modes

- **Circular definition:** Family boundaries defined by the same features used to measure diversity.
- **Incomplete template space:** Missing germline references or hidden paralogs inflate apparent diversity gaps.
- **Sampling bias:** Narrow, unbalanced, or platform-enriched variant sets misrepresent true repertoire composition.
- **Assay cross-reactivity:** Template-capacity methods detect related but distinct families, inflating overlap scores.
- **Platform artifacts:** Enrichment, amplification, expression, or detection limits reshape apparent diversity.
- **Confounding by context:** Strain background, disease state, tissue source, or batch effects mimic selection signals.
- **Over-interpretation of correlation:** Sequence or structural convergence treated as proof of selection without functional controls.

# Validity Checks

Before finalizing any plan or interpretation, verify:
- **Confounding:** Source, population, platform, batch, or annotation differences could mimic diversification.
- **Sampling:** Variant sets are representative, balanced, and stable under rarefaction or resampling.
- **Circularity:** Family membership is not defined by the same features later used as evidence.
- **Specificity:** The method distinguishes target families from related and unrelated classes.
- **Measurement noise:** Diversity metrics are not inflated by errors, missing data, or preprocessing choices.
- **Statistical validity:** Uncertainty, sensitivity, multiple comparisons, and model assumptions are reported.
- **Reproducibility:** Conclusions hold across independent samples, methods, or laboratories where feasible.
- **Boundary conditions:** System-specific features are not generalized beyond supported scope.
- **Evidence separation:** Inherited-template, diversification, and functional claims remain distinct.

# Provenance

Derived from cluster 5 / subcluster 5.1.split0 via semantic merge of representative source skills:
- immunoglobulin-diversity-research-workflow (9b3ad2e56fd7acd5)
- template-guided-clonotype-proteomics (64a7f421d8ad8d9e)
- antibody-repertoire-exploration-workflow (746a1890d1f7e46c)
- anti-dna-autoantibody-research-design (c1985c04f8ec0dc3)
- immunoglobulin-vk-gene-diversity-exploration (bdaad173950d4b70)
- quadruplex-dna-antibody-discovery-workflow (e9a1c8ee2a850d01)
- immunogenomics-germline-diversity-workflow (88cf7e3753c725da)
- lymphocyte-receptor-exploration (11e92c5cffb64d6d)
