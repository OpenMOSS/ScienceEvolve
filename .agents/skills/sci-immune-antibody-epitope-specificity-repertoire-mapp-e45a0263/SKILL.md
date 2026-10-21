---
name: sci-immune-antibody-epitope-specificity-repertoire-mapp-e45a0263
description: A reusable end-to-end workflow for generating hypotheses, designing staged validation, and interpreting orthogonal evidence to map antibody epitope specificity and repertoire features while bounding mechanistic claims.
scienceevolve-title: "Antibody and immune recognition · antibody epitope specificity repertoire mapping workflow"
scienceevolve-area: antibody-and-immune-recognition
---

## Purpose

Guide agents in designing non-clinical research programs that distinguish antigen-driven, cross-reactive, and artifact-prone antibody recognition patterns. The workflow teaches a transferable route from mechanistic ambiguity through hypothesis generation, staged specificity validation, repertoire analysis, and cautious mechanistic inference, treating any single study as a methodological example rather than consensus.

## When to use

Use this skill when the user asks to:

- Formulate research questions about antibody–epitope specificity, immune repertoire selection, or determinant mapping.
- Design conceptual experiments that compare antigen-directed versus host-cross-reactive or off-target binding.
- Plan staged validation for candidate binders or repertoire-derived recognition molecules.
- Analyze sequence, binding, competition, and functional evidence to infer mechanism.
- Iterate hypotheses after ambiguous, negative, or discordant results.

Do not use for clinical diagnosis, treatment advice, operational wet-lab protocols, or claims that a single study establishes field-wide consensus.

## Inputs required

Before producing a plan, identify:

- **Biological context:** target antigen class, immune phenotype, and the mechanistic ambiguity to resolve.
- **Repertoire or probe source:** whether candidates derive from exposed hosts, synthetic libraries, engineered systems, or computational design, with justification for expected enrichment.
- **Target panel:** focal antigen, host-like or unrelated comparators, and scaffold or tag controls.
- **Assay concepts:** binding, competition, accessibility, sequence-level, and functional readouts available at a conceptual level.
- **Constraints:** biosafety, ethics, sample governance, data privacy, and reproducibility requirements.
- **Prior evidence:** existing binding data, structural information, known epitopes, and recognized limitations.

## Core Workflow

1. **Frame the recognition question and ambiguity**
   - Define the observed immune association without assuming causality.
   - State whether the ambiguity concerns antigen specificity, host cross-reactivity, epitope class, repertoire selection, conformation dependence, or assay dependence.

2. **Generate competing hypotheses**
   - Produce falsifiable hypotheses in competing sets (e.g., target-specific recognition, host cross-reactivity, mixed repertoire, conformation-dependent binding, assay artifact).
   - For each hypothesis, assign evidence strength (weak/moderate/strong), state key assumptions, predict observations, and list likely failure modes.
   - Label elements as paper-supported method logic versus agent-inferred extensions.

3. **Design staged validation**
   - **Stage 1 — Primary binding specificity:** Test candidate recognition against the focal target versus unrelated and scaffold controls. **Stop** if signal does not exceed background in replicate.
   - **Stage 2 — Specificity resolution:** Add competition, epitope-binning, or accessibility logic to distinguish paratope-proximal, conformation-dependent, and non-paratopic recognition. **Stop** if cross-reactivity collapses to background under stringent controls.
   - **Stage 3 — Repertoire or sequence convergence:** Assess clonal relatedness, variable-region usage, mutation patterns, and diversity against baseline controls. **Stop** if patterns indicate technical artifact, baseline bias, or sampling inadequacy rather than selection.
   - **Stage 4 — Native-context or functional relevance:** Test recognition in a physiologically relevant presentation or mechanism-linked readout only after Stages 1–3 are satisfied. **Stop** if native-context recognition fails or functional claims lack separate assays.

4. **Execute and classify evidence**
   - Apply quality-control filters before interpretation.
   - Classify candidates as target-specific, cross-reactive, nonspecific, ambiguous, or assay-dependent.
   - Integrate orthogonal evidence only when controls support linkage across binding, competition, sequence, and functional layers.

5. **Iterate or stop**
   - If target-specific binders dominate: refine epitope mapping and test sequence convergence.
   - If cross-reactive binders dominate: reassess comparator relevance and assay artifacts before biological reinterpretation.
   - If binding is inconsistent across assays: revisit antigen presentation and controls before changing the biological model.
   - If sequence evidence conflicts with binding evidence: prioritize replication and independent validation over narrative fit.
   - If functional readouts lack molecular specificity: treat as nonspecific and stop mechanistic interpretation.
   - **Stop entirely** if biosafety, ethics, or data-quality constraints are unmet.

## Output Format

Return:

1. **Research question:** concise question and the ambiguity it addresses.
2. **Hypothesis set:** table with hypothesis class, evidence strength, key assumptions, predicted observations, likely failure modes, and validation requirement.
3. **Staged design:** target panel, source concept, controls, assay concepts per stage, endpoints, and stop conditions.
4. **Analysis plan:** quality control, specificity classification, statistical approach, and visualization strategy.
5. **Iteration plan:** decision rules for updating or abandoning hypotheses under each result pattern.
6. **Validity and ethics check:** confounders, reproducibility risks, boundary conditions, and safety constraints.
7. **Evidence map:** separation of paper-supported workflow elements, agent-inferred extensions, and required validation.

## Validation Gates

- **Gate 1 — Primary binding:** Candidate signal exceeds matched negative and scaffold controls in replicate.
- **Gate 2 — Orthogonal specificity:** Specificity pattern is reproducible across independent assay concepts.
- **Gate 3 — Repertoire validity:** Sequence or repertoire signature is distinguishable from baseline bias and technical artifacts.
- **Gate 4 — Contextual or functional relevance:** Native-context recognition or functional effect is supported by independent readouts with appropriate controls.
- **Gate 5 — Confounder audit:** Cohort, batch, disease stage, sample handling, and metadata structure are documented and do not explain the signal.

## Claim Boundaries

- Binding association does not prove pathogenic mechanism, therapeutic value, neutralization, or clinical relevance.
- Epitope recognition in one context does not generalize to all antigens, host populations, or disease states.
- Repertoire convergence in a small or single sample does not establish universal selection patterns.
- Competition or accessibility evidence guides determinant location but is not definitive structural proof.
- Single-study findings are hypothesis-generating and require independent validation before broader inference.

## Failure Modes

- Nonspecific binding masked by inadequate controls or scaffold/tag artifacts.
- Cross-reactivity driven by shared carriers, immobilization matrices, or conformational mimicry rather than biological relevance.
- Selection bias from library construction, amplification, or target-format artifacts.
- Abundance artifacts where strong total binding enables detection of rare subclasses or clones lacking independent biological meaning.
- Assay-format dependence causing discordance between prepared antigen and native-context recognition.
- Functional decoupling where cellular or humoral readouts occur without candidate-specific binding.
- Confounding by disease duration, treatment, co-exposure, batch effects, or metadata imbalance.

## Validity Checks

- **Mechanistic discrimination:** Does the design distinguish at least two plausible mechanisms?
- **Control adequacy:** Are negative, positive, specificity, cross-reactivity, technical, and batch controls included and matched to the biological layer?
- **Baseline bias:** Could the observed pattern arise from normal repertoire structure or expected background?
- **Technical artifacts:** Could duplicates, amplification bias, sequencing errors, contamination, or batch effects explain the signal?
- **Reproducibility:** Are findings consistent across independent samples, batches, or systems?
- **Statistical validity:** Are tests appropriate for the data type, with prespecified contrasts, multiple-comparison handling, and uncertainty reporting?
- **Boundary validity:** Are claims limited to the studied antigen, assay format, population, and molecular class?
- **Evidence separation:** Are observed facts, inferred mechanisms, and speculative extensions clearly labeled?

## Provenance

Synthesized from cluster 55 / subcluster 55.1.split0. Source skills: chagas-antibody-epitope-exploration (1e470cbc8bac56ce), anti-idiotype-immunology-research (bf9f0f97056a6c07), immunology-repertoire-exploration (9085dd0b571aaccd), ebv-vca-human-fab-discovery-workflow (cb90826dc2b66276), viral-immunology-epitope-igg-subclass-research (ff0d3d7320594505), pathogen-antigen-binder-discovery (f461cc0c3fb8c402), tcr-recognition-probe-discovery (4e6dd8786bdc4649), therapeutic-antibody-ada-neutralisation-workflow (24488554889017bc).
