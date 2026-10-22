---
name: sci-immune-antibody-repertoire-diversity-evolution-work-b11cbd46
description: A reusable end-to-end workflow for designing research questions, hypotheses, and validation plans to infer mechanisms of antibody and immune-repertoire diversity, including sequence variability, germline evolution, selection, and structural-state comparisons.
scienceevolve-title: "Antibody and immune recognition · antibody repertoire diversity evolution workflow"
scienceevolve-area: antibody-and-immune-recognition
---

## Purpose

This skill guides an agent to convert sequence, structural, and repertoire-level evidence into testable mechanistic hypotheses about how immune-receptor diversity is generated, constrained, and selected. It emphasizes model comparison, iterative falsification, graded claims, and explicit boundary conditions rather than treating any single dataset or study as a field-wide rule.

## When to use

Use this skill when the user asks to:
- Explore antibody, B-cell receptor, T-cell receptor, or analogous immune-repertoire diversity and evolution.
- Infer whether sequence variation arises from inherited repertoire structure, new variation, recombination, or functional selection.
- Compare germline gene families, structural motif repertoires, or lineage diversification patterns.
- Design computational or comparative studies that separate generative bias from post-generation selection.
- Evaluate somatic hypermutation, junctional variation, or repertoire development across time points, tissues, or exposures.

Do not use this skill for clinical diagnosis, patient-specific treatment advice, therapeutic selection, wet-lab protocol execution, genetic engineering instructions, or any task requiring executable biological parameters.

## Inputs required

Before proceeding, identify or request:
- **Target system:** receptor family, chain type, species, locus, clade, and developmental or functional stage.
- **Data inventory:** sequence completeness, annotation status, quality filters, structural models, and reference catalog version.
- **Baseline definitions:** germline genes, consensus states, ancestral reconstructions, or pre-selection comparators.
- **Candidate mechanisms:** inherited diversity, combinatorial assembly, post-generation diversification, neutral drift, selection, or mixed models.
- **Metadata:** lineage, abundance, phenotype, tissue, compartment, time point, donor, or exposure context.
- **Constraints:** ethics approvals, data governance, privacy requirements, biosafety boundaries, and reproducibility standards.

## Core Workflow

Follow this ordered route. At each gate, stop or redesign if the condition is not met.

1. **Define repertoire boundaries.**  
   Specify the unit of analysis (sequence, clone, lineage, family, structural motif, or paired architecture) and justify inclusion/exclusion criteria.  
   **Gate:** If the unit is ambiguous or the sample is demonstrably unrepresentative, stop and refine the scope.

2. **Infer baseline states.**  
   Cluster highly similar examples or use evolutionary grouping to identify consensus-like or germline representatives. Treat similarity as a clustering signal, not proof of ancestry.  
   **Gate:** If baseline states shift materially under resampling, alternative clustering, or removal of individual variants, stop and revisit the alignment or annotation.

3. **Quantify and map variation.**  
   Count differences from baseline and map them to sequence positions, structural regions, or motif classes. Classify changes by region type (framework, variable, junction, functional, conserved).  
   **Gate:** If alignment uncertainty, gap structure, or annotation ambiguity dominates the signal, stop and improve the coordinate system or region definitions.

4. **Annotate functional and structural landscape.**  
   Separate conserved positions, candidate functional regions, and less constrained positions. Overlay structural motifs only when models are of sufficient confidence.  
   **Gate:** If structural coverage is missing or low-confidence for key variants, flag limited inference scope and avoid overinterpreting spatial clustering.

5. **Construct a sequence-aware null model.**  
   Estimate expected patterns under a neutral or generative baseline that accounts for base composition, codon structure, region size, mutational opportunity, recombination constraints, and stop-codon handling.  
   **Gate:** If the null model omits a major opportunity factor (e.g., length, composition, clonal structure), stop and revise before testing enrichment.

6. **Generate competing mechanism hypotheses.**  
   Propose at least two explanations for the observed pattern (e.g., germline-encoded diversity, combinatorial assembly, post-generation diversification, selection, mixed mechanisms). For each hypothesis specify: predicted pattern, evidence strength, key assumptions, alternative explanations, likely failure modes, and boundary conditions.  
   **Gate:** If only one mechanism is under consideration, stop and generate falsifiable alternatives.

7. **Design minimal viable validation.**  
   Define comparison groups (baseline, variant, functional-region, control-region, external comparator), independent/dependent variables, covariates, and controls (positive, negative, technical, cross-context). Choose the smallest test that can distinguish the leading hypothesis from its closest alternative.  
   **Gate:** If no valid comparator or control exists for a required contrast, downgrade the evidence strength and redesign.

8. **Execute observed-vs-expected analysis.**  
   Compare variation or mutation patterns against the null model across region, codon position, substitution class, lineage, and biological context. Collapse shared clonal events to avoid overcounting.  
   **Gate:** If observed patterns are indistinguishable from randomized or label-shuffled controls, stop and reject or revise the hypothesis.

9. **Discriminate mechanisms through triangulation.**  
   Require the leading mechanism to explain multiple orthogonal signatures, or explicitly state which signatures it explains and which remain unresolved. Update hypothesis labels (verified / supported / plausible / speculative) based on convergent or conflicting evidence.  
   **Gate:** If competing models fit equally well or the decisive observation is absent, stop and specify the follow-up test needed to break the tie.

10. **Iterate and enforce stop conditions.**  
    - If strengthened: narrow the claim, test robustness to thresholds, and evaluate generalizability across donors, cohorts, or species.  
    - If weakened: split, merge, or replace hypotheses; record discarded alternatives and why they failed.  
    **Stop when:** baseline states are unstable; annotations are too uncertain; sampling bias or batch effects dominate; ambiguous elements drive conclusions; alternative models fit equally well; added complexity no longer improves prediction on independent data; or the work would cross ethical, safety, or compliance boundaries.

11. **State transfer boundaries and ethics review.**  
    Separate evidence-supported claims from hypotheses requiring validation in a new system. Document non-transferable assumptions, reproducibility risks, and safety/ethics constraints.

## Output Format

Respond with the following structure:

1. **Research question** — Concise question, system boundary, and why it matters for repertoire diversity or evolution.
2. **Hypothesis map** — Table with columns: hypothesis, evidence strength, key assumptions, predicted pattern, alternative explanations, likely failure modes, and boundary conditions.
3. **Minimal viable validation design** — Comparison groups, variables and covariates, controls, primary evaluation metrics, and stop conditions.
4. **Analysis plan** — Alignment and clustering approach, functional-region mapping, null-model construction, observed-vs-expected comparison, model discrimination, sensitivity checks, and uncertainty estimation.
5. **Iteration plan** — Conditions that would strengthen, weaken, or split the hypothesis; the next smallest decisive test; and remaining alternatives.
6. **Validity and ethics statement** — Confounders, reproducibility requirements, extrapolation limits, and safety/ethics/privacy constraints.

## Validation Gates

- **Boundary clarity gate:** Repertoire unit and inclusion criteria are explicit and defensible.
- **Baseline stability gate:** Consensus or representative states are robust to resampling and method choice.
- **Annotation confidence gate:** Region, motif, and functional labels are consistent and their uncertainty is documented.
- **Null-model adequacy gate:** The neutral baseline accounts for sequence opportunity, structure, and clonal relatedness.
- **Mechanistic alternative gate:** At least two competing mechanisms are formally stated before inference.
- **Comparator availability gate:** Required pre-selection, external, or cross-context comparators are available or their absence is flagged.
- **Randomization control gate:** Observed patterns exceed appropriate randomized or shuffled controls.
- **Model discrimination gate:** The leading hypothesis is preferred over alternatives by convergent orthogonal evidence, not by descriptive fit alone.
- **Iteration stop gate:** Further complexity does not improve independent validation or crosses safety/compliance boundaries.

## Claim Boundaries

- Distinguish **observed repertoire structure** from **inferred generation or selection mechanisms**.
- Distinguish **paper-supported observations** from **agent-generated hypotheses** and **computational predictions**.
- Limit claims to the studied receptor family, species, locus, developmental stage, tissue, and annotation schema.
- Treat ancestral-state, primordial-repertoire, and selection-pressure claims as model-based inferences requiring independent validation.
- Do not generalize single-cohort or single-dataset findings to population-level or species-wide rules without replicated evidence.
- Avoid presenting descriptive associations as mechanistic proof.

## Failure Modes

- **Sampling and reference bias:** Incomplete reference coverage or nonrandom sampling creates false dominant, rare, or convergent categories.
- **Alignment and annotation instability:** Variable-region mapping fails under alternative alignments or region definitions.
- **Clonal oversampling:** Shared mutation or variant events are counted multiple times, inflating apparent enrichment.
- **Null-model mismatch:** Omission of mutational opportunity, codon bias, recombination constraints, or length effects produces spurious signals.
- **Confounding:** Donor, tissue, batch, platform, cell subset, or developmental stage effects masquerade as biological signal.
- **Label leakage or circularity:** Class definitions or feature extraction depend on the outcome being predicted.
- **Threshold overfitting:** Conclusions depend on a single classification cutoff, alignment parameter, or structural model.
- **Mechanism overclaim:** Descriptive patterns are interpreted as direct evidence of selection or evolutionary history without discriminating alternatives.

## Validity Checks

- **Alignment validity:** Are positions comparable across all sequences, and do gaps/insertions reflect biology rather than artifacts?
- **Baseline stability:** Does the consensus or baseline state remain stable when individual variants, alternative clustering methods, or subsamples are used?
- **Functional annotation validity:** Could enrichment be caused by biased, incomplete, or inconsistent region definitions?
- **Sampling validity:** Does the sample represent the intended repertoire, or a selected, biased, or depth-limited subset?
- **Statistical validity:** Are counts and comparisons adjusted for sequence length, mutational opportunity, clonal relatedness, and multiple testing?
- **Null-model validity:** Is the randomization or permutation scheme compatible with motif counts, family structure, tree topology, and sequence constraints?
- **Model validity:** Were at least two competing mechanisms tested with predictions that are not identical to the observed pattern?
- **External coherence:** Do abundance, phenotype, lineage, species, tissue, time-point, or exposure data agree with the sequence-based model?
- **Reproducibility:** Could another researcher reconstruct the annotation, controls, filtering rules, and analysis from the stated plan?
- **Boundary validity:** Are claims limited to the biological system, data quality, and annotation schema actually studied?

## Provenance

Synthesized from cluster 60, subcluster 60.0.split0. Derived from source skills: antibody-repertoire-diversity-research, antibody-repertoire-modular-diversity, immunoglobulin-structural-repertoire-evolution, repertoire-development-workflow, antibody-shm-exploration-workflow, ig-cdr3-repertoire-discovery, antibody-diversity-research-design, immune-repertoire-sequence-pattern-discovery.
