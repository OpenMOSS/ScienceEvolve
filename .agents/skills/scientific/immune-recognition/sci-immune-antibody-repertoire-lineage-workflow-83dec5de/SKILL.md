---
name: sci-immune-antibody-repertoire-lineage-workflow-83dec5de
description: Reusable end-to-end workflow for B-cell receptor repertoire sequencing, clonal clustering, lineage reconstruction, and selection pressure inference with decision gates and iterative validation.
scienceevolve-title: "Antibody and immune recognition · antibody repertoire lineage workflow"
scienceevolve-area: antibody-and-immune-recognition
---

## Purpose

Provide a reusable, end-to-end computational workflow to move from B-cell receptor (BCR) repertoire data through clonal clustering, lineage reconstruction, and selection pressure analysis. The goal is to generate testable evolutionary hypotheses while enforcing strict boundaries between observation, inference, and mechanism.

## When to use

- Analyzing BCR/immunoglobulin repertoire sequencing data that requires clonal grouping and lineage-level evolutionary inference.
- Investigating sequence diversity patterns, substitution biases, or candidate selection pressures within and across clonal lineages.
- Comparing repertoire structure against neutral baselines or reference repertoires to infer antigen-driven or functional selection.
- Designing follow-up validation for repertoire-derived evolutionary hypotheses.

Do not use for:
- Wet-lab protocol generation, clinical diagnosis, or treatment recommendations.
- Tasks requiring direct experimental execution details, hazardous material handling, or patient-specific advice.
- Simple paper summarization or terminology explanation unrelated to repertoire lineage analysis.

## Inputs required

- **Repertoire sequences**: Heavy and/or light chain sequences, with annotation status and pairing information if available.
- **Germline reference set**: Curated V(D)J germline database appropriate for the target species.
- **Metadata**: Sample source, batch, sequencing platform, chain pairing rates, and phenotypic or functional annotations if linking to selection outcomes.
- **Quality thresholds**: Predefined criteria for productive rearrangements, read quality, and completeness.
- **Neutral baseline**: A reference or background repertoire for comparing substitution patterns and compositional expectations.

## Core Workflow

1. **Data Ingestion & Quality Control**
   - Assemble sequences, germline references, and metadata.
   - Filter to productive, high-confidence rearrangements with consistent annotation.
   - **Decision Gate 1 (Quality)**: If the proportion of usable sequences or paired chains falls below the preset threshold, stop. Report data gaps and required remediations before proceeding.

2. **Clonal Clustering**
   - Group sequences into operational clones using V/J gene usage, CDR3 length, and sequence similarity criteria.
   - Assess cluster stability across threshold sweeps and subsampling.
   - **Decision Gate 2 (Cluster Validity)**: If cluster composition is highly sensitive to threshold choice, or if artefacts/singletons dominate, iterate on clustering parameters or halt. Do not proceed until stable clonal units are established.

3. **Lineage Reconstruction**
   - Infer germline-rooted phylogenetic trees or lineage graphs per qualified clone.
   - Map mutation accumulation, branch topology, and isotype/state transitions where available.
   - **Decision Gate 3 (Phylogenetic Signal)**: If a clone yields an unresolved star-like topology or ambiguous root placement, flag limited lineage signal. Skip downstream selection analysis for that clone unless additional data improves resolution.

4. **Selection Pressure Analysis**
   - Quantify substitution patterns in candidate functional regions relative to a neutral baseline (e.g., framework regions or synonymous changes).
   - Stratify by germline family, clone size, and batch to control for confounders.
   - **Decision Gate 4 (Selection Robustness)**: If selection signals disappear after correction for clonal expansion, germline stratification, or batch effects, downgrade to exploratory observation. Return to Step 2 or 3 to refine clones or lineages before re-testing.

5. **Mechanistic Hypothesis Synthesis**
   - Integrate lineage topology, selection metrics, and functional/phenotypic metadata.
   - Formulate hypotheses distinguishing antigen-driven selection, neutral drift, and technical bias.
   - **Iteration / Stop**:
     - *Iterate*: If signals are robust and reproducible, expand to cross-sample validation or functional prediction.
     - *Stop*: If signals are irreproducible, confounded by expansion, or if competing mechanisms cannot be distinguished, cease mechanistic interpretation and document boundary conditions.

## Output Format

Produce a structured report with the following sections:

1. **Study Question & Scope** — Target system, comparison groups, and key uncertainties.
2. **Clonal Summary** — Clustering criteria, clone size distribution, stability assessment, and flagged anomalies.
3. **Lineage Topology Assessment** — Per-clone tree quality, root confidence, and branch interpretation.
4. **Selection Pressure Results** — Region-specific metrics, baseline comparisons, and sensitivity to confounders.
5. **Hypothesis Cards** — For each hypothesis: statement, evidence strength (Strong/Moderate/Weak/Speculative), key assumptions, failure modes, and minimal validation needs.
6. **Validation Plan** — Proposed controls, replication strategy, and statistical checks.
7. **Iteration Log** — Decision gate outcomes, parameter changes, and stopping rationale.

## Validation Gates

- **Sequence Quality Gate**: Productive rearrangement, complete reading frame, and annotation confidence meet preset thresholds.
- **Cluster Stability Gate**: Clonal definitions are robust to similarity threshold perturbation and subsampling.
- **Phylogenetic Resolvability Gate**: Lineage trees show non-random structure with consistent germline rooting; star-like polytomies are flagged.
- **Selection Signal Gate**: Non-synonymous enrichment or functional-region bias persists after correcting for germline family, clone size, and batch.
- **Reproducibility Gate**: Primary clonal and selection patterns replicate across independent samples, batches, or cohorts.

## Claim Boundaries

- Clonal clusters are operational analytical units that approximate biological clones; they are sensitive to algorithmic thresholds.
- Lineage trees represent inferred evolutionary histories, not exact cellular pedigrees or division timelines.
- Selection pressure is inferred from substitution patterns relative to a neutral baseline; it is not a direct experimental measurement of fitness or binding affinity.
- Associations between repertoire features and disease state or antigen exposure are correlational unless supported by independent functional or interventional evidence.
- Results are bounded to the sampled population, tissue, time point, and sequencing platform; cross-species or cross-disease generalization requires re-validation.

## Failure Modes

- **Over/Under-clustering**: Inappropriate similarity thresholds merge distinct lineages or split single clones, distorting diversity and selection estimates.
- **Phylogenetic Collapse**: Hypermutation saturation, short sequence length, or low intra-clone diversity prevents resolved lineage reconstruction.
- **False Selection Signals**: Mutational hotspots, primer or sequencing bias, germline misassignment, or clonal expansion can mimic positive selection.
- **Confounding by Expansion**: Large expanded clones dominate frequency and substitution counts, biasing population-level metrics.
- **Batch and Depth Effects**: Technical variation across runs or unequal sampling depth creates artefactual compositional differences.

## Validity Checks

- **Germline Consistency**: Verify that conclusions are not sensitive to germline database version or incomplete reference sets.
- **Composition Neutrality**: Check CDR length and V/J usage distributions against expected background; flag distributional anomalies.
- **Clone-Size Independence**: Ensure selection signals are not driven solely by one or a few highly expanded clones.
- **Cross-Sample Reproducibility**: Validate key patterns in independent biological replicates or cohorts.
- **Region-Boundary Sensitivity**: Test whether selection conclusions change under alternative alignment or region annotation schemes.
- **Statistical Calibration**: Report effect sizes and uncertainty intervals; avoid interpreting uncorrected multiple comparisons as definitive.

## Provenance

- Synthesized from cluster `7`, subcluster `7.0.split0`.
- Derived from representative source skills: `b2c343004f0f6e72`, `cc037d019c88405d`, `67d8fba5378b65da`, `bf333728a0553846`, `2c298631bae7ae47`, `1930599fc10a615b`, `e7c694a2b20d8ea6`, `2dfea7bd69d22dfe`.
