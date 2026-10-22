---
name: sci-immune-adaptive-immune-recognition-mechanism-discov-f612ed44
description: Guide end-to-end research design to discover, characterize, and validate molecular mechanisms of adaptive immune recognition through hypothesis generation, orthogonal validation, and graded mechanistic inference.
scienceevolve-title: "Antibody and immune recognition · adaptive immune recognition mechanism discovery workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Guide an agent to transform a biological recognition gap into a reproducible, evidence-graded research plan for adaptive immune recognition mechanisms. The skill emphasizes reusable method transfer over paper-specific conclusions: generate falsifiable hypotheses, design orthogonal validation, validate structural and repertoire claims with bias-aware controls, infer mechanisms iteratively, and strictly separate binding evidence from functional or clinical claims.

# When to use

Use this skill when:

- Designing studies on antibody, B-cell receptor, or T-cell receptor recognition of antigens, epitopes, or mimics.
- Investigating autoantibody selection, cross-reactivity, mimicry, or repertoire convergence in autoimmune, infectious, or vaccine contexts.
- Structural claims about immune recognition require bias-reduced validation before downstream interpretation.
- Repertoire data need to be linked to candidate antigens or selection pressures without circular reasoning.

Do not use this skill for clinical decision-making, patient-specific treatment advice, operational wet-lab execution, or as a substitute for domain-specific biosafety or ethics review.

# Inputs required

Before producing a research plan, request or identify:

- Target antigen, immune receptor class, or recognition context.
- Candidate binders, antibody sequences, repertoire dataset, epitope predictions, or structural models.
- Appropriate control sets and comparator groups (negative, positive, mismatch, mock, disease-context).
- Access to orthogonal assay modalities and, when available, structural data or models.
- Biological context and constraints (model system, sample type, ethical boundaries).

If any input is missing, state assumptions explicitly and mark conclusions as provisional.

# Core Workflow

1. **Frame the recognition gap.** Define the target antigen or ligand, immune receptor class, biological context, and what current tools fail to resolve. State the evidentiary standard required to close the gap and the boundary conditions for interpretation.

2. **Generate diverse candidate hypotheses.** Propose epitopes, binders, repertoire signatures, mimicry candidates, or selection drivers. For each candidate, state the recognition-class hypothesis, mechanistic rationale, explicit assumptions, predicted observations, and most likely failure modes.

3. **Prioritize candidates using converging preliminary evidence.** Combine sequence features, structural plausibility, preliminary binding signal, and artifact risk. Rank candidates by falsifiability and decision value, not by a single signal.

4. **Characterize recognition orthogonally.** Assess binding, competition, fine-specificity, and format dependence across different target presentations and assay principles.
   - *Decision gate:* Require reproducible convergence across at least two orthogonal formats before advancing a candidate.
   - *Stop condition:* If target-positive and target-absent conditions cannot be separated with appropriate controls, stop and redesign the discovery strategy.
   - *Pivot condition:* If a candidate is specific but format-limited, redesign around a defined state-specific use case rather than generalizing.

5. **Validate structural claims with bias-reduced methods.** When structural data or models are available, evaluate modeled features using omit-map logic, independent refinement, or equivalent bias-reduced approaches, processing positive and negative controls identically.
   - *Decision gate:* Accept structural features only if they survive bias-reduced analysis and show consistency with internal neighborhood controls.

6. **Profile repertoire-level patterns when relevant.** Analyze selection signatures, CDR3 features, clonal dynamics, or mutation patterns against matched controls, accounting for sampling depth, clonal expansion, and batch structure.
   - *Decision gate:* Require independent replication or orthogonal validation before using repertoire correlations to support causal or selection claims. Reject any pattern explained by circular group definition or technical confounding.

7. **Infer mechanism and grade evidence.** Evaluate mimicry, cross-reactivity, antigen-driven selection, or accessibility hypotheses based on the convergence of binding, structural, and repertoire evidence.
   - *Decision gate:* Assign evidence grades (strong, moderate, weak, contested) and explicitly separate binding evidence from functional, causal, or clinical claims. Do not equate sequence similarity with shared selection or mimicry without structural or functional convergence.

8. **Iterate from discordance.** Treat conflicting results as evidence about recognition mode, assay format, or incomplete hypotheses rather than noise.
   - *If orthogonal assays disagree:* resolve measurement validity before mechanism inference.
   - *If structural models fit but functional assays fail:* downgrade the model and seek experimental artifacts or alternative mechanisms.
   - *If recognition is strong but context behavior is weak:* revise context-compatibility hypotheses and test accessibility, modification, or presentation effects.
   - *If all candidates fail minimum evidence standards:* deprioritize the motif or antigen family and redesign the measurement question rather than overclaiming weak positives.

# Output Format

When using this skill, produce:

1. **Ranked recognition hypotheses** — with evidence strength, key assumptions, and failure modes.
2. **Specificity and selectivity assessment** — across target levels, formats, and related antigens.
3. **Mechanistic model of recognition** — with explicit boundary conditions and uncertainty grades.
4. **Validated research plan** — with decision gates for continuation, redesign, or termination.
5. **Iteration log** — documenting evidence gained, evidence lost, updated confidence, and next discriminating experiments.

# Validation Gates

- Orthogonal assay convergence required before any mechanism inference.
- Control comparisons processed identically through the same analytical workflow.
- Bias-reduced structural validation (e.g., omit-map or independent refinement) for structural claims.
- Specificity controls using related antigens, decoy motifs, and unrelated targets.
- Reproducibility checks across independent samples, batches, or cohorts.
- Explicit separation of binding evidence from functional, causal, or clinical claims.

# Claim Boundaries

- **Can support:** recognition patterns, specificity profiles, candidate prioritization, mechanistic hypotheses with graded evidence, and model-system relevance comparisons.
- **Cannot support:** clinical efficacy, therapeutic utility, field-wide consensus, causation without functional validation, or executable wet-lab operational protocols.

# Failure Modes

- Assay artifacts from matrix, tag, carrier, surface, or aggregation effects.
- Format-dependent binding where native versus reduced target presentation yields discordant results.
- Overfitting, cohort bias, or batch confounding in repertoire and sequence analyses.
- Circular reasoning from defining comparison groups by features later tested as signatures.
- Structural model bias or overinterpretation of computational docking and modeling.
- Confounding by genetic background, cell identity, sampling depth, or technical variation.
- Cross-reactivity or sequence similarity mistaken for shared selection or mimicry without structural or functional validation.

# Validity Checks

Before finalizing a research plan or interpretation, verify:

- **Specificity:** target-positive and target-absent conditions are both included.
- **Orthogonality:** conclusions are not based on a single assay format.
- **State boundary:** claims about conformation, modification, or activity are supported by state-positive and state-negative comparisons.
- **Matrix validity:** purified-target performance is not overgeneralized to complex biological samples.
- **Mechanism proportionality:** competition, sequence similarity, and structural modeling are treated as hypothesis-generating unless directly validated.
- **Functional separation:** binding is not equated with inhibition, activation, or pathway effect without functional evidence.
- **Benchmarking:** new reagents or models are compared with established tools when available.
- **Reproducibility:** variability, batch effects, and replicate consistency are reported.
- **Metadata traceability:** sequence, candidate identity, sample context, and assay format can be linked to each result.
- **Extrapolation boundary:** conclusions are limited to the tested target, context, and assay class.
- **Circularity:** groups were not defined using the same features later tested as signatures.

# Provenance

Synthesized from cluster 51.0 (adaptive-immune-recognition-mechanism-discovery-workflow). Source skills: immune-effector-recognition-reagent-discovery (814ca210e94b5dd8), structural-model-validation-research (cac492a537fad118), autoimmune-microbiome-hypothesis-exploration (2b9dae1b19f7152d), lupus-antibody-repertoire-genetic-dissection (01347df98260eba2), anti-dna-antibody-mimicry-research (936655bab4ed89e1), motif-informed-probe-discovery (7462de62efda2a88), lupus-autoantibody-antigen-selection-workflow (f0042ec271f89b0e), hs-probe-specificity-research (facadec0dcb66294). Excluded skill: 0e20c94012da9c1f.
