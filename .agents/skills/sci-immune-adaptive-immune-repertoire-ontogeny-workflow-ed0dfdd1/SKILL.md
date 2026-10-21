---
name: sci-immune-adaptive-immune-repertoire-ontogeny-workflow-ed0dfdd1
description: A reusable end-to-end workflow for generating, validating, and iterating mechanistic hypotheses about adaptive immune repertoire ontogeny from sequence data, covering germline recombination, compensatory diversity, selection bias, and lineage footprint inference.
scienceevolve-title: "Antibody and immune recognition · adaptive immune repertoire ontogeny workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Guide agents to transform observed adaptive immune repertoire sequence patterns into testable mechanistic hypotheses about ontogeny—including germline recombination, compensatory diversity, selection bias, and lineage footprint inference—and to validate them through structured, iterative research design without reproducing source-specific systems, parameters, or protocols.

# When to use

Use this skill when the user asks to:

- Investigate how germline recombination, selection pressures, or lineage history shape observed repertoire structure.
- Generate hypotheses about compensatory diversity mechanisms when canonical combinatorial recombination appears constrained.
- Infer developmental origin, maturation arrest, or transition history from immunoglobulin or T-cell receptor sequence footprints.
- Distinguish generation bias from selection bias, clonal expansion, or detection artifacts in repertoire datasets.
- Design minimal validation studies for repertoire-based ontogeny claims using sequence, structural, and comparative evidence.

Do not use this skill for clinical diagnosis, treatment recommendations, patient management, or operational wet-lab protocol generation.

# Inputs required

Before producing a research plan, request or infer:

- **Biological scope**: species/lineage, target locus/chain, developmental stage, tissue, and cell population.
- **Observed pattern**: repertoire enrichment, constraint, structural deviation, lineage footprint, or clonal anomaly requiring explanation.
- **Data context**: sequencing modality, read structure, coverage depth, reference annotation, and metadata completeness.
- **Comparator availability**: matched healthy/background repertoires, related developmental stages, independent cohorts, or public reference datasets.
- **Ground truth source**: orthogonal assay, synthetic benchmark, curated reference set, pedigree/lineage information, or controlled simulation.
- **Performance priorities**: sensitivity, specificity, ambiguity control, cross-cohort portability, or mechanistic interpretability.
- **Constraints**: ethics approval, privacy/data governance, biosafety, sample availability, and reproducibility requirements.

If inputs are incomplete, state assumptions explicitly and separate evidence-backed claims from inferred claims.

# Core Workflow

1. **Pattern Observation & Gap Framing**
   - Document the observed repertoire pattern (e.g., restricted gene usage, unusual junctional features, lineage footprints, compensatory motifs, or haplotype deviations).
   - Define the baseline expectation: neutral recombination model, matched healthy background, reference haplotype, or known germline inventory.
   - Frame the mechanistic gap: which ontogeny process (recombination, selection, expansion, detection artifact, or locus evolution) could explain the deviation?

   *Decision Gate 1 — Reproducibility*: Is the pattern consistent across independent biological replicates and/or technical replicates?
   - **If NO**: Stop. Investigate sampling noise, batch effects, or artifacts before mechanistic inference.
   - **If YES**: Proceed.

2. **Mechanistic Hypothesis Generation**
   - Generate competing hypotheses across ontogeny mechanism classes:
     - **Germline/Recombination**: constrained diversity axis, compensatory junctional variation, locus architecture effects, or haplotype-specific rearrangement bias.
     - **Selection/Expansion**: antigen-driven selection, homeostatic expansion, clonal drift, maturation arrest, or lineage transition history.
     - **Context/Detection**: tissue-specific detection, assay bias, annotation artifacts, population structure, or unmatched comparator backgrounds.
   - For each hypothesis specify: claim, predicted evidence pattern, key assumptions, evidence strength (high/medium/low), and likely failure modes.

   *Decision Gate 2 — Falsifiability*: Can the hypotheses be distinguished with available or obtainable data?
   - **If NO**: Narrow claims or redesign comparators; return to Inputs Required.
   - **If YES**: Proceed.

3. **Minimal Viable Validation Design**
   - Define comparisons: target population vs. matched background; developmental stage contrasts; germline vs. expressed repertoires; disease vs. healthy cohorts.
   - Establish controls:
     - **Negative**: background repertoire, non-target population, artifact checks, and matched-negative samples.
     - **Positive**: known benchmark feature or validated annotation.
     - **Orthogonal**: independent assay principle or alternative annotation pipeline.
     - **Baseline**: germline configuration or pre-selection stage.
   - Select variables: receptor features (V/D/J usage, CDR3 length, mutation status), biological context, and technical batch.
   - Predefine evaluation metrics (recovery, specificity, clonal diversity, enrichment significance, robustness) and stop conditions.

4. **Structured Analysis & Evidence Integration**
   - Execute QC and artifact screening: low-quality reads, chimeras, allele-versus-gene ambiguity, batch effects, and contamination.
   - Annotate sequences with transparent criteria; preserve uncertain assignments rather than forcing high-confidence calls.
   - Extract repertoire features and lineage footprints (prior-exposure, continuation, transition signals).
   - Compare against matched backgrounds and independent cohorts; adjust for confounders.
   - Integrate cross-footprint evidence; classify concordance vs. discordance across independent markers.
   - Quantify uncertainty and test sensitivity to annotation thresholds, clustering rules, and parameter choices.

   *Decision Gate 3 — Control Concordance*: Do controls behave as expected and does the pattern remain specific to the target condition?
   - **If NO**: Stop. Revisit artifact explanations, annotation validity, or comparator appropriateness.
   - **If YES**: Proceed.

5. **Mechanism Discrimination & Iteration**
   - Evaluate which hypothesis class best explains the integrated evidence.
   - Update confidence based on evidence timing and context:
     - Pre-selection pattern → favor germline/recombination hypotheses.
     - Post-selection emergence → favor selection/expansion hypotheses.
     - Assay-specific or batch-linked pattern → favor detection bias.
   - If evidence is ambiguous, branch into sub-hypotheses and design the next discriminating experiment.
   - If evidence contradicts the leading hypothesis, document falsification and return to Step 2.

   *Iteration/Stop Conditions*:
   - **STOP** if negative controls replicate the target pattern, orthogonal validation contradicts the main claim, artifacts dominate results, or ethical/biosafety constraints are violated.
   - **ITERATE** if evidence is partial: refine anchors, filters, comparators, or sampling depth and return to Step 3.
   - **CONCLUDE** only when converging independent evidence supports a bounded mechanistic claim.

# Output Format

When using this skill, return:

1. **Research question** — One concise question linking the observed pattern, biological context, and mechanistic gap.
2. **Evidence map** — Directly supported observations, inferred claims, assumptions, and remaining unknowns.
3. **Hypothesis table** — For each hypothesis: claim, mechanism class, predicted evidence pattern, evidence strength, key assumptions, and likely failure modes.
4. **Validation design** — Comparisons, controls, variables, evaluation metrics, and stop conditions.
5. **Analysis plan** — QC strategy, annotation approach, feature extraction, background comparison, cross-footprint integration, and uncertainty quantification.
6. **Iteration plan** — Decision rules for confirm, revise, branch, or stop based on possible results.
7. **Validity and ethics summary** — Confounders, boundary conditions, reproducibility requirements, privacy constraints, and compliance limitations.

# Validation Gates

- **Reproducibility Gate**: The observed pattern must be consistent across independent biological and/or technical replicates before mechanistic interpretation begins.
- **Control Gate**: Negative and positive controls must behave as expected; otherwise halt and investigate assay or annotation validity.
- **Orthogonal Gate**: Key structural, lineage, or haplotype claims require confirmation by an independent assay principle or annotation pipeline.
- **Mechanism Gate**: The experimental design must be able to distinguish generation bias from selection bias from detection artifacts.
- **Boundary Gate**: Claims must not exceed the studied lineage, locus, tissue, developmental stage, or assay class.

# Claim Boundaries

- Distinguish **directly observed** sequence patterns from **inferred** ontogeny mechanisms or trajectory placements.
- Separate **paper-validated** patterns from **agent-inferred** extrapolations to new species, loci, tissues, or clinical contexts.
- Repertoire enrichment, lineage footprints, or haplotype deviations indicate candidate signals of selection or developmental history, not proof of antigenic causation or clinical outcome.
- Do not generalize single-cohort, single-species, or single-locus findings to all adaptive immune systems without independent replication.

# Failure Modes

- **Sampling failure**: Insufficient depth, rare variants indistinguishable from noise, pseudo-replication, or unstable diversity estimates.
- **Artifact dominance**: PCR recombination, sequencing error, clonal duplication, primer bias, mapping artifacts, or annotation ambiguity.
- **Confounded comparison**: Unmatched genetic background, population structure, batch effects, tissue heterogeneity, or unequal healthcare access across cohorts.
- **Overinterpretation**: Inferring protein expression or function from transcript evidence alone, or deriving clinical relevance from research-grade repertoire data.
- **Mechanistic ambiguity**: Inability to separate generation bias from selection bias due to missing pre-selection data, weak controls, or unresolved clonal structure.
- **Ethical breach**: Use of unconsented human genomic data, unauthorized animal procedures, or translation of research findings into clinical recommendations.

# Validity Checks

- **Confounding**: Are genotype, age, tissue, exposure history, batch, cell viability, and population structure aligned across groups?
- **Baseline model**: Is the expected background based on relevant germline, recombination, or sampling assumptions?
- **Clonality**: Could the apparent bias reflect a few expanded clones rather than independent recombination events?
- **Assay specificity**: Could the detection method or annotation pipeline preferentially capture or misassign the observed feature?
- **Annotation validity**: Are gene, motif, junction, and clonotype calls robust to threshold choice and reference version?
- **Statistical validity**: Are sample sizes, biological replicates, uncertainty estimates, and multiple-testing corrections adequate for the claim?
- **Reproducibility**: Can the result be reproduced with independent samples, orthogonal data, or alternative analysis pipelines?
- **Boundary conditions**: Are claims limited to the studied species, locus, tissue, developmental window, and technical context?
- **Evidence separation**: Are original observations, new hypotheses, and speculative extrapolations clearly labeled?

# Provenance

- Derived from cluster 40, subcluster 40.1.split0.
- Synthesized from source skills: immune-repertoire-rna-seq-exploration, b-cell-lineage-footprint-research, clonotypic-repertoire-oncogenesis-exploration, teleost-tcr-repertoire-exploration, b-cell-repertoire-selection-exploration, antibody-repertoire-diversity-research, locus-haplotype-evolution-discovery, immunoglobulin-recombination-exploration.
- Preserves the transferable pattern of observable-driven mechanism discovery and validation without source-specific parameters, systems, materials, numerical results, or paper conclusions.
