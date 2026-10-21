---
name: sci-chromatin-chromatin-epigenomic-mechanism-discovery-7e29f4c2
description: Use this skill to design end-to-end research workflows that discover and validate chromatin-level regulatory mechanisms by integrating epigenomic states, transcriptomic outcomes, and orthogonal evidence within defined biological contrasts.
scienceevolve-title: "Chromatin and epigenomic regulation · chromatin epigenomic mechanism discovery workflow"
scienceevolve-area: chromatin-and-epigenomic-regulation
---

# Purpose

Guide agents in turning chromatin and epigenomic observations into testable mechanistic hypotheses. The workflow provides a reusable route from biological contrast to regulatory-state classification, multi-omics integration, candidate prioritization, and controlled validation, while keeping claims bounded by evidence strength and biological context.

# When to use

Use this skill when the user asks to:
- Propose new questions about chromatin accessibility, histone modification, DNA methylation, enhancer-promoter logic, or regulatory network changes across biological states.
- Design studies that link epigenetic regulatory states to gene expression or phenotype.
- Plan controls, validation logic, and iteration rules for non-clinical regulatory mechanism research.
- Evaluate whether a proposed chromatin-level claim is supported by association, concordance, perturbation, or replication evidence.

Do not use this skill for clinical decision-making, therapeutic recommendations, or operational wet-lab execution.

# Inputs required

Before producing a research plan, identify:
- Biological contrast or state transition of interest.
- Available regulatory-state measurements (e.g., accessibility, methylation, histone marks) and expression or phenotype readouts.
- Sample metadata including batch, composition, quality, and subgroup structure.
- Candidate regulatory annotations and their provenance.
- Independent validation resources (e.g., binding evidence, motif databases, perturbation datasets, orthogonal expression, genetic association).
- Ethics, data-use, biosafety, and institutional constraints.

If inputs are incomplete, proceed only with explicit assumptions and mark conclusions as provisional.

# Core Workflow

1. **Define the contrast and regulatory gap.**  
   State the biological comparison and why existing single-layer explanations are insufficient.  
   *Decision gate:* If the contrast is confounded by unmeasured variables or lacks a meaningful baseline, stop and redefine.

2. **Construct candidate regulatory elements.**  
   Assemble context-relevant annotations and measurable regions; exclude regions without reliable signals.  
   *Decision gate:* If the region set is dominated by annotation bias or batch artifacts, revise filtering before proceeding.

3. **Classify regulatory states.**  
   Assign regions to activity states (e.g., gained, lost, stable, ambiguous) per sample or group.  
   *Decision gate:* If state calls are unstable across replicates or preprocessing choices, diagnose confounders and iterate; if irreparable, stop.

4. **Link states to expression or phenotype.**  
   Associate regulatory changes with downstream changes using predefined association rules, matched backgrounds, and multiple-testing correction.  
   *Decision gate:* If links are explained by sample composition or do not survive statistical correction, treat them as exploratory only.

5. **Prioritize candidate mechanisms.**  
   Rank genes, regulators, or modules by convergence of evidence; treat network degree or correlation as candidate evidence, not proof of regulatory relevance.  
   *Decision gate:* If candidates lack orthogonal support (motif, binding, genetic association, orthogonal assay), label as weak and require further validation.

6. **Discriminate competing mechanisms.**  
   Adjudicate between direct binding, indirect tethering, chromatin-context effects, and secondary consequences using assay geometry, motif evidence, temporal ordering, and contrast analysis.  
   *Decision gate:* If the data cannot distinguish the proposed mechanism from proximity or accessibility bias, redesign the validation layer before claiming mechanism.

7. **Validate independently.**  
   Apply computational controls (resampling, sensitivity, replicate agreement), independent-data checks (orthogonal cohorts, platforms), and conceptual functional tests (perturbation/rescue logic without operational protocols).  
   *Decision gate:* If negative controls show target-like enrichment, replicates disagree, or orthogonal data contradict the primary signal, stop and revise the hypothesis.

8. **Bound claims and decide next step.**  
   Narrow conclusions to the studied context, cell state, and assay modality.  
   *Stop condition:* Controls fail, links are unstable, validation is circular, or the claim exceeds data scope.  
   *Iteration:* If evidence is promising, specify the next minimal validation; if weak, redesign the regulatory element, contrast, or model system.

# Output Format

When using this skill, respond with:

1. **Research question and contrast definition.**
2. **Candidate regulatory element set** and filtering rationale.
3. **Hypothesis set:** each with evidence strength, key assumptions, predicted observations, and failure modes.
4. **Study design:** variables, controls, validation layers, endpoints, and stopping conditions.
5. **Analysis plan:** state classification, linking strategy, mechanism discrimination, and confounder checks.
6. **Iteration rules:** continue, revise, or stop criteria for each hypothesis.
7. **Validity and ethics summary:** reproducibility, boundary, safety, and compliance checks.

# Validation Gates

- **Reproducibility gate:** Regulatory-state calls and links must be stable across replicates, preprocessing choices, and subsampling.
- **Control gate:** Negative, positive, and specificity controls must behave as expected before biological interpretation.
- **Orthogonality gate:** Candidate mechanisms require support from at least one independent data type or assay class.
- **Specificity gate:** Effects must be distinguishable from local accessibility, sequence composition, batch, or cell-state confounders.
- **Mechanism-exclusion gate:** Competing mechanisms must be explicitly compared and the preferred alternative must survive falsification tests.

# Claim Boundaries

- Distinguish observed association from inferred mechanism, and inferred mechanism from perturbation-supported causality.
- Do not generalize from one biological context, cell type, or assay modality to all systems.
- Do not treat single-study findings as field consensus.
- Separate paper-derived patterns, user-provided observations, and agent-generated hypotheses.
- Avoid clinical or therapeutic interpretation of regulatory associations.

# Failure Modes

- Batch, platform, coverage, or annotation artifacts dominate state calls.
- Links are indirect, context-mismatched, or confounded by sample composition.
- Hub status reflects annotation bias, expression artifacts, or feedback rather than regulatory relevance.
- Perturbation or manipulation is nonspecific and affects too many coupled features.
- Results are limited to one unjustified context and fail cross-context stability.
- Validation is circular (same data used for discovery and confirmation).
- Controls fail but interpretation proceeds anyway.

# Validity Checks

- **Confounder checks:** Sample composition, batch, platform, coverage, missingness, mapping ambiguity, annotation bias, sequence composition, and cell-cycle state.
- **Statistical checks:** Predefined contrasts, multiple-testing strategy, matched background controls, effect sizes, uncertainty reporting, and sensitivity analyses.
- **Reproducibility checks:** Documented dataset identifiers, preprocessing summaries, filtering decisions, exclusion counts, and versioned analysis steps.
- **Boundary checks:** Claims stay within the resolution and context of the data; no unsupported extrapolation.
- **Evidence-labeling checks:** Every claim tagged as observed, inferred, context-supported, perturbation-tested, replicated, or speculative.

# Provenance

- Synthesized from cluster 2 / subcluster 2.1 (chromatin-accessibility-epigenetic-epigenomic-mechanism-discovery-workflow).
- Source skills: enhancer-network-exploration; single-cell-epigenomic-exploration; epigenetic-chromatin-research-design; chromatin-complex-interaction-exploration; host-chromatin-respiratory-infection-design; periodontitis-epigenomic-research-workflow; ube3a-imprinting-research-planning.
- Paper-derived patterns are abstracted; no source-specific numerical thresholds, materials, or operational protocols are retained.
