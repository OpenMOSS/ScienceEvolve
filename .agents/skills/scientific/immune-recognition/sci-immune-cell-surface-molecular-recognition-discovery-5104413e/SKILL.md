---
name: sci-immune-cell-surface-molecular-recognition-discovery-5104413e
description: End-to-end workflow for discovering, screening, and validating cell-surface molecular recognition partners through iterative hypothesis generation, multi-layered specificity testing, and cellular or tissue-level validation.
scienceevolve-title: "Antibody and immune recognition · cell surface molecular recognition discovery workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Guide systematic discovery and validation of cell-surface molecular recognition partners—such as antigens for antibodies, ligands for receptors, or epitopes for probes—through a reusable, evidence-tiered workflow. The goal is to progress from candidate hypothesis to specificity-controlled cellular or tissue evidence while bounding claims to the evidence tier achieved.

# When to use

- A cell-surface agent (antibody, receptor, probe, or disease-associated phenotype) or target context requires a recognition partner.
- The task involves generating candidate partner hypotheses, screening or enriching candidates, and validating binding specificity and cellular/tissue relevance.
- The user needs an iterative research design with predefined validation gates, failure modes, and claim boundaries, not operational protocols or clinical recommendations.

# Inputs required

- Defined cell-surface recognition agent or target context (e.g., antibody, receptor, cell type, disease state).
- Candidate source or library (expression data, display library, homolog list, cell panel).
- Specificity control reagents (homologous molecules, blocking antibodies, negative cell types, orthogonal probes).
- Constraints: ethical boundaries, sample availability, platform limitations, and acceptable validation depth.

# Core Workflow

1. **Define the recognition context and mechanistic gap**  
   Frame the problem around the cell-surface agent or phenotype. Identify the recognition event that needs explanation and the biological or technical gaps that prevent current interpretation.

2. **Generate candidate partner hypotheses**  
   Derive candidates from structural, expression, phylogenetic, or library-based clues. Annotate each hypothesis with evidence strength, key assumptions, and predicted failure modes.

3. **Establish assay validity — Assay Validity Gate**  
   Confirm positive, negative, and process controls meet pre-set thresholds before interpreting any candidate signal.  
   *Decision:* If controls fail, stop and troubleshoot the detection system.

4. **Screen or enrich candidates under increasing selection stringency**  
   Apply sequence and structural quality control to filter technical artifacts (e.g., amplification bias, unreadable sequences, expression failures).  
   *Decision:* If no enrichment is observed or artifact rates are high, stop and revise the candidate source or selection pressure.

5. **Characterize binding specificity — Specificity Gate & Orthogonality Gate**  
   Test competition, blocking, and cross-reactivity with homologs or related molecules. Confirm candidate interaction using at least two independent methodological principles.  
   *Decision:* If the target signal is indistinguishable from background or homolog competitors, stop or pivot to alternative candidates.

6. **Validate cellular or tissue relevance — Cellular Concordance Gate**  
   Assess localization, functional readout, or phenotype association in relevant models using strong negative and specificity controls.  
   *Decision:* If molecular binding data and cellular/tissue readouts are discordant and cannot be reconciled by model-specific checks, stop or reframe the hypothesis.

7. **Integrate evidence, bound claims, and decide next steps**  
   Tier claims (e.g., “supports binding,” “supports cell recognition,” “does not support clinical utility”). Based on pre-defined failure criteria, choose to iterate (refine hypotheses or add controls), pivot (change target or candidate class), or stop.

# Output Format

- **Ranked candidate hypotheses**: List with evidence strength, key assumptions, and predicted failure modes.
- **Specificity validation summary**: Cross-reactivity profile, competition matrix, and orthogonal confirmation status.
- **Cellular/tissue validation assessment**: Claim boundaries, concordance with molecular data, and uncertainty annotations.
- **Go/no-go recommendation**: Iteration, pivot, or stop based on integrated evidence and failure criteria.

# Validation Gates

- **Assay Validity Gate**: Positive and negative controls must meet pre-set thresholds before candidate interpretation.
- **Reproducibility Gate**: Key signals replicate across independent preparations, batches, or platforms.
- **Specificity Gate**: Target signal is distinguishable from background, homologs, and non-specific binding.
- **Orthogonality Gate**: Candidate interaction is supported by at least two independent methodological principles.
- **Cellular Concordance Gate**: Molecular binding data and cellular/tissue readouts are directionally consistent.

# Claim Boundaries

- **Can support**: “Candidate X specifically interacts with or targets Y under the tested conditions”; “Evidence is consistent with a cell-surface recognition event in the validated model”; “Candidate explains observed binding or specificity pattern.”
- **Cannot support**: Clinical diagnostic or therapeutic utility; in vivo pharmacological efficacy; mechanistic causation beyond binding or correlation; generalization to untested species, cell types, or disease stages without independent validation.

# Failure Modes

- Candidate signal fails to replicate across independent batches or orthogonal platforms.
- Negative controls or homolog competitors produce signals indistinguishable from the target, indicating loss of specificity.
- Binding or screening results rely solely on a single detection format or unvalidated reagent.
- Cellular or tissue readout contradicts molecular binding data or cannot be separated from model-specific artifacts.
- Sequence or structural quality control reveals technical artifacts (e.g., contamination, bias, expression failure) that invalidate candidate identity.

# Validity Checks

- **Confounding factors**: Sample source, disease stage, processing workflow, reagent class, expression form, and batch effects.
- **Reproducibility**: Candidate signals must replicate across independent preparations, batches, or platforms.
- **Specificity**: Negative controls must clearly separate background from target signals.
- **Orthogonality**: Candidate interaction should be supported by independent methodological principles, not a single assay.
- **Statistical validity**: Pre-define primary endpoints; distinguish exploratory from confirmatory conclusions; avoid selective reporting.
- **Extrapolation boundaries**: Single-study or single-candidate-source evidence cannot support field consensus; binding evidence alone does not constitute target confirmation or clinical utility.

# Provenance

- Synthesized from cluster 42, subcluster 42.0.
- Derived from source skills: `antigen-reactivity-exploration`, `hsp70-scfv-research-workflow`, `endothelin-biomarker-assay-exploration`, `integrin-ligand-discovery-workflow`, `mucin-epitope-discovery-workflow`, `fc-receptor-autoantibody-research-workflow`, `tumor-nk-receptor-ligand-discovery`, `antibody-binding-research-workflow`.
- Excluded outliers: clonal evolution phylogenetics, biomedical peer review, and immune cell surface-marker phenotyping.
