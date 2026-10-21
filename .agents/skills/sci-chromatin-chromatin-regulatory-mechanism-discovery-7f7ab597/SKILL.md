---
name: sci-chromatin-chromatin-regulatory-mechanism-discovery-7f7ab597
description: A reusable end-to-end workflow for discovering and validating chromatin-level regulatory mechanisms from single-cell, spatial, or multi-omic epigenomic data through hypothesis generation, controlled computational validation, and iterative refinement.
scienceevolve-title: "Chromatin and epigenomic regulation · chromatin regulatory mechanism discovery workflow"
scienceevolve-area: chromatin-and-epigenomic-regulation
---

# Purpose

Guide agents in designing reproducible, non-operational research plans to discover and validate chromatin and gene-regulatory mechanisms using multi-modal epigenomic data. The workflow emphasizes separating biological signal from technical artifact, bounding claims by evidence strength, and iterating from failure.

# When to use

Use this skill when the user asks to:
- Generate testable hypotheses about chromatin state, accessibility, protein-DNA interactions, DNA modifications, or 3D genome organization.
- Design computational validation plans for regulatory mechanisms inferred from single-cell, spatial, or bulk epigenomic assays.
- Integrate multiple regulatory modalities (e.g., chromatin accessibility, methylation, conformation, transcription) into a shared inference framework.
- Compare assay resolutions, discriminate technical artifacts from biological variation, or evaluate rare and heterogeneous regulatory states.
- Plan iterative refinement of a regulatory hypothesis based on controlled evidence.

Do not use this skill for clinical diagnosis, patient-specific interpretation, treatment recommendations, or executable wet-lab protocols.

# Inputs required

Before executing the workflow, collect or state assumptions for:
- **Biological system**: cell type, tissue, organism, developmental stage, disease model, or perturbation context.
- **Research objective**: mechanism discovery, assay benchmarking, regulatory-element annotation, condition comparison, or network inference.
- **Available data types**: chromatin accessibility, protein-DNA occupancy, DNA methylation, histone modifications, transcript abundance, spatial coordinates, chromatin conformation, or orthogonal reference datasets.
- **Constraints**: sample availability, replication structure, batch metadata, computational resources, ethical approvals, and whether validation is computational-only.
- **Candidate hypotheses**: proposed mechanisms, expected observations, and known failure modes, if supplied.

# Core Workflow

Execute the following ordered phases. At each decision gate (DG), pass only if the criterion is met; otherwise iterate or stop.

1. **Frame the Regulatory Gap**
   - Define the biological context and the specific mechanistic link that is missing or unresolved.
   - State why existing measurements are insufficient and what new evidence would change interpretation.
   - **DG1 — Scope Clarity**: Is the gap narrow enough to be tested with available or obtainable data?
     - *No*: Refine the question or stop.

2. **Generate Competing Hypotheses**
   - Produce at least three competing hypotheses (e.g., direct regulatory mechanism, technical/assay-driven artifact, confounding biological heterogeneity).
   - For each hypothesis record: concise claim, evidence strength (strong / moderate / weak / speculative), key assumptions, predicted molecular or spatial signature, and a specific failure mode that would disconfirm it.
   - **DG2 — Falsifiability**: Can every hypothesis be disconfirmed by the planned analysis?
     - *No*: Reformulate hypotheses or redesign the approach.

3. **Design Minimal Viable Validation**
   - Define independent variables (condition, element class, cell state), dependent variables (contact frequency, accessibility, methylation, expression association), and covariates (distance, GC content, coverage, batch, donor).
   - Specify controls: positive (known regulatory features), negative (inactive or matched background), technical/tool (input, unfused enzyme, shuffled labels), and orthogonal (independent assay or public dataset).
   - Pre-register primary metrics and stopping conditions before analysis.
   - **DG3 — Discriminative Power**: Can the design separate biological signal from assay artifact and batch structure?
     - *No*: Redesign controls or halt.

4. **Audit and Harmonize Data**
   - Inventory all modalities, sample overlap, metadata, batch structure, missingness patterns, and annotation consistency.
   - Perform quality diagnostics and normalization sensitivity checks; establish mono-omic baselines before integration.
   - **DG4 — Data Integrity**: Do quality and metadata support the planned contrast?
     - *No*: Iterate preprocessing, exclude problematic samples, or stop.

5. **Model Regulatory Structure**
   - Choose the narrowest integration strategy that fits the question: intra-modality harmonization, restricted inter-modality integration, or generic multimodal modeling.
   - Preserve sample- and feature-level structure; avoid collapsing all data to gene lists unless the question explicitly requires it.
   - Compare against mono-omic and simpler baselines.
   - **DG5 — Incremental Value**: Does the integrated model improve interpretability, robustness, or prediction over baselines?
     - *No*: Reduce complexity, revisit priors, or rely on the strongest single modality.

6. **Discriminate Mechanisms**
   - Score candidate regulatory links, elements, or states using the integrated model.
   - Require results to exceed negative controls (randomized links, shuffled labels, distance-matched background, permuted coordinates).
   - Assess robustness across subsampling, parameter choices, and replicate splits.
   - **DG6 — Specificity**: Do top candidates survive negative-control filtering and sensitivity analysis?
     - *No*: Treat findings as exploratory and do not advance to strong claims.

7. **Triangulate with Orthogonal Evidence**
   - Converge with independent assays, public references, motif enrichment, chromatin contact evidence, or expression data.
   - Treat agreement as support for assay plausibility, not as causal proof.
   - **DG7 — Convergence**: Is there convergent support from at least one orthogonal source?
     - *No*: Bound the claim as computational inference only.

8. **Bound Claims and Iterate**
   - Label each claim by evidence strength, boundary conditions (cell type, condition, platform, genomic scope), and causal caution.
   - Maintain an evidence ledger: claim, evidence type, strength, assumptions, and next test.
   - **DG8 — Pre-registration Match**: Do results meet pre-registered success criteria?
     - *Yes*: Propose the next discriminative experiment.
     - *No*: Revise the hypothesis, assay design, or analysis and return to Phase 2.

# Output Format

When using this skill, return:

1. **Research question and gap**: concise statement of the unresolved mechanism.
2. **Hypothesis set**: ranked table with claim, evidence strength, key assumptions, predicted signature, and failure mode.
3. **Minimal validation design**: variables, controls, primary metrics, and stopping conditions.
4. **Analysis plan**: data audit, integration strategy, baseline comparisons, mechanism scoring, and robustness checks.
5. **Orthogonal validation plan**: independent datasets or assays for triangulation.
6. **Iteration roadmap**: how each possible result updates the evidence ledger.
7. **Validity and ethics statement**: confounders, reproducibility checks, boundary conditions, and non-clinical use limits.

# Validation Gates

- **DG1 — Scope Clarity**: The gap is defined, biologically meaningful, and addressable with available or obtainable data.
- **DG2 — Falsifiability**: Every hypothesis has a stated observation that would disconfirm it.
- **DG3 — Discriminative Power**: Controls are sufficient to separate biological signal from technical artifact, batch, and confounding.
- **DG4 — Data Integrity**: Metadata are credible, samples are identifiable, and quality diagnostics do not contradict the planned contrast.
- **DG5 — Incremental Value**: Integration or advanced modeling outperforms appropriate mono-omic or simpler baselines on predefined metrics.
- **DG6 — Specificity**: Candidate mechanisms exceed negative controls and remain stable under sensitivity analyses.
- **DG7 — Convergence**: At least one orthogonal source supports the direction of the claim without sharing the same bias structure.
- **DG8 — Pre-registration Match**: Conclusions align with pre-registered success criteria; deviations are explicitly explained.

# Claim Boundaries

- **Association vs. Causation**: Computational co-occurrence, correlation, or enrichment does not imply causality. Causal claims require perturbation or independent functional validation.
- **Context Specificity**: Claims are bounded to the represented cell types, conditions, platforms, and developmental stages unless independent replication supports broader generalization.
- **Evidence Levels**: Distinguish directly measured, statistically associated, mechanistically plausible, and speculative claims.
- **Technical vs. Biological**: Signal must be shown to exceed tool-derived background, normalization artifacts, and batch effects before biological interpretation.
- **Clinical Boundary**: Outputs are research hypotheses, not diagnostic, prognostic, or therapeutic claims.

# Failure Modes

- **Technical artifacts**: batch effects, coverage variation, mapping ambiguity, duplicate handling, library-size bias, and normalization-driven false positives.
- **Assay limitations**: background labeling, enzyme processivity, antibody cross-reactivity, sparse single-cell signal, and limited long-range molecule coverage.
- **Analytical overfitting**: cluster instability, parameter-sensitive results, distance bias in regulatory links, and model misspecification.
- **Confounding biology**: cell-cycle heterogeneity, cell-type mixture, donor variation, developmental stage differences, and stress responses.
- **Interpretive overreach**: equating spatial proximity with causality, treating enrichment as proof of regulation, or generalizing from a single locus or sample.

# Validity Checks

Before finalizing any plan or claim, verify:
- **Confounding**: Condition effects are separable from batch, donor, tissue composition, library preparation, cell cycle, and annotation density.
- **Reproducibility**: Key findings are consistent across replicates, held-out folds, subsampling runs, and alternative preprocessing choices.
- **Statistical validity**: Endpoints were pre-specified, multiple comparisons were corrected, effect sizes and uncertainty intervals are reported, and null models are appropriate.
- **Control coverage**: Positive, negative, technical, and orthogonal controls were evaluated and reported.
- **Boundary conditions**: The claim states where it applies and where extrapolation is unsupported.
- **Mechanistic caution**: Spatial proximity, co-occurrence, or statistical association are not presented as causal without perturbation evidence.
- **Computational reproducibility**: Data provenance, preprocessing steps, random seeds, and software versions are documented.

# Provenance

Synthesized from cluster 0.1 (end-to-end mechanism discovery and validation) source skills: spatial-epigenome-exploration; spatial-multiomics-regulatory-discovery; single-molecule-long-range-epigenome-research-design; damid-protein-dna-mapping-research-agent; differential-genomic-binding-explorer; epigenomic-data-harmonization-research; single-cell-atac-regulatory-exploration; single-cell-multiome-regulatory-exploration.
