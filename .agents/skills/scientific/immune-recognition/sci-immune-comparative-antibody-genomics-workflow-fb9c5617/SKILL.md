---
name: sci-immune-comparative-antibody-genomics-workflow-fb9c5617
description: Reusable end-to-end workflow for evolutionary inventory, phylogenetic placement, and locus organization of antibody gene families across species using genomic, transcriptomic, and protein evidence.
scienceevolve-title: "Antibody and immune recognition · comparative antibody genomics workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Use this skill to design research questions and validation plans for comparative antibody genomics. It guides an agent from an evidence gap or locus-level anomaly through hypothesis generation, orthogonal validation design, and iterative model revision for immunoglobulin gene family organization, transcript origin, and evolutionary placement across species. The workflow treats any single dataset as one evidence source rather than field consensus.

# When to use

Use this skill when:

- Investigating immunoglobulin heavy-chain or light-chain locus organization, duplication, or rearrangement.
- Resolving conflicts between transcript evidence and genomic architecture.
- Placing novel antibody gene candidates into phylogenetic and syntenic context.
- Designing comparative studies across species or lineages using genomic, transcriptomic, and protein evidence.
- Generating hypotheses about paralogs, pseudogenes, chimeric isoforms, or lineage-specific expansions.

Do not use this skill for clinical diagnosis, treatment recommendations, or operational wet-lab execution.

# Inputs required

Ask for or identify:

- Target species or clade and biological context.
- Research question: locus structure, transcript origin, protein product, pseudogene status, evolutionary duplication, or phylogenetic placement.
- Available evidence: genome assembly quality, transcript assemblies, RNA-seq, proteomics, antibody data, synteny maps, clone-based evidence, and outgroup references.
- Known immune-gene annotations and reference sequences for target and related lineages.
- Constraints: ethics, biosafety, data access, budget, and whether the goal is discovery, replication, or comparative extension.

# Core Workflow

1. **Frame the evidence gap.** Define the locus-level anomaly, annotation conflict, or missing ortholog. Convert it into a testable comparative question.
   - *Decision gate:* Is the gap resolvable with available data? If no relevant data exists, stop and define data requirements.

2. **Inventory and stratify evidence layers.** Separate genomic structure, transcript splicing, VDJ association, protein identity, and regulatory context. Record provenance and quality for each layer.
   - *Decision gate:* Are there at least two independent evidence layers? If not, flag all conclusions as speculative.

3. **Build competing locus models.** Generate candidate architectures: single-gene alternative processing, multiple paralogs, pseudogene-linked expression, duplicated functional clusters, assembly artifacts, or chimeric rearrangements.
   - *Decision gate:* Can each model generate at least one falsifiable prediction? If not, refine models before proceeding.

4. **Derive discriminating predictions.** For each model, state expected outcomes for locus order, exon structure, terminal exon usage, transcript uniqueness, peptide evidence, synteny, and conservation.
   - *Decision gate:* Do predictions uniquely separate the leading model from alternatives? If not, add orthogonal comparisons.

5. **Design minimal orthogonal validation.** Select the smallest set of independent evidence streams that can distinguish the leading hypothesis from its strongest alternative. Include positive, negative, specificity, and technical controls at a design level.
   - *Stop condition:* If controls cannot be defined or ethical/biosafety constraints block validation, pause and redesign.

6. **Execute comparative and phylogenetic placement.** Align candidate domains, build homolog sets, test clustering stability, and compare synteny across species. Assess whether placement is robust to reference selection, alignment uncertainty, and indel handling.
   - *Decision gate:* Does phylogenetic placement converge with genomic context? If conflicting, reassess orthology, paralogy, or assembly quality.

7. **Integrate evidence and grade claims.** Map all evidence onto candidate models. Label each claim as demonstrated, supported, plausible, or speculative based on the weakest evidence link.
   - *Decision gate:* Is there convergent support from two or more evidence layers for the leading model? If not, retain competing models.

8. **Iterate or stop.**
   - If new genomic data conflict with the model, return to step 3 and revise architectures before assigning function.
   - If transcript evidence is strong but locus evidence is weak, prioritize assembly or paralog resolution.
   - If protein evidence lacks unique features, downgrade protein-origin claims.
   - If outgroup comparison contradicts the model, test for lineage-specific duplication, annotation loss, or incompleteness.
   - *Stop condition:* Stop when the model is sufficiently supported by orthogonal evidence, when evidence is irreconcilably ambiguous, or when further validation would require operational wet-lab protocols beyond design-level planning.

# Output Format

When using this skill, produce:

- **Research question and rationale.**
- **Evidence map:** available, missing, and confounding evidence by layer.
- **Candidate hypotheses table:** mechanism, evidence strength, key assumptions, failure modes, and discriminating predictions.
- **Minimal validation plan:** variables, controls, evaluation metrics, and stop conditions.
- **Analysis plan:** locus annotation, transcript assignment, protein-evidence interpretation, comparative synteny, phylogenetic placement, visualization, and uncertainty reporting.
- **Iteration rules:** how results update, split, or reject each hypothesis.
- **Validity and ethics check:** confounders, reproducibility risks, boundary conditions, and compliance constraints.
- **Graded conclusion:** clear distinction between tested evidence and inference.

# Validation Gates

- **Assembly artifact check:** screen for collapsed repeats, misjoined contigs, contamination, and unphased haplotypes.
- **Paralog ambiguity check:** transcripts or peptides must uniquely distinguish similar genes.
- **Pseudogene check:** flag disrupted coding features, frameshifts, and premature stops.
- **Allelic and population variation check:** assess whether the model generalizes beyond one sample.
- **Orthology check:** confirm clustering with the expected family across methods and outgroups.
- **Cross-reactivity check:** consider whether protein or antibody evidence could bind related immune-gene products.
- **Statistical validity:** require replication, uncertainty reporting, and sensitivity analyses.
- **Reproducibility:** use versioned assemblies, traceable annotations, and independent datasets.

# Claim Boundaries

- Genomic structure alone does not prove expression.
- Transcript evidence alone does not prove protein function.
- Protein evidence alone does not prove physiological role.
- Homology supports plausibility, not proof of function.
- A surprising model requires stronger independent support than a conservative annotation update.
- Conclusions are limited to the studied species, lineage, cell types, and evidence layers unless comparative replication supports broader claims.

# Failure Modes

- Locus cannot be resolved from available genomic evidence.
- Transcript or protein evidence is not unique enough to distinguish paralogs.
- Results depend on a single individual, assembly, or assay type.
- Phylogenetic placement is unstable to reference or alignment changes.
- Candidate lacks essential structural features expected for the gene family.
- Specificity controls fail, such as cross-reactivity without mechanistic explanation.
- Expression evidence is inconsistent across independent samples.
- Assay artifacts dominate, such as nonspecific binding, poor normalization, or inadequate controls.

# Validity Checks

Before finalizing, check:

- **Confounding:** Could species, subgroup, preparation method, or annotation quality explain the pattern?
- **Selection bias:** Were comparators chosen because they already supported the desired conclusion?
- **Alignment validity:** Are insertions, deletions, and ambiguous residues handled consistently?
- **Technical artifacts:** Could residue ambiguity, sample processing, or incomplete data mimic biological variation?
- **Mechanistic plausibility:** Does the proposed mechanism connect sequence, structure, and phenotype without unsupported leaps?
- **Extrapolation boundary:** Is the conclusion limited to the studied family, specificity, species, or structural context?
- **Evidence separation:** Are direct measurements clearly separated from computational predictions and literature analogies?

# Provenance

Derived from cluster 70 / subcluster 70.0.split0. Synthesized from source skills: teleost-igh-locus-exploration, teleost-igh-chimera-research-design, model-organism-immunogenetic-locus-discovery, comparative-immunoglobulin-receptor-discovery, immunoglobulin-sequence-function-exploration, viral-antigen-epitope-mapping, protein-epitope-mapping-coagulation-probes, and plant-vacuolar-marker-discovery. Source-specific systems, materials, and numerical conclusions have been abstracted into a reusable route.
