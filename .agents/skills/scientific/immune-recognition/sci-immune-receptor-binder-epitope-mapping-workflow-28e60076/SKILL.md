---
name: sci-immune-receptor-binder-epitope-mapping-workflow-28e60076
description: Reusable end-to-end workflow for mapping receptor-binder epitopes through domain selection, screening, competition mapping, structural modeling, functional validation, and cross-variant generalization.
scienceevolve-title: "Antibody and immune recognition · receptor binder epitope mapping workflow"
scienceevolve-area: antibody-and-immune-recognition
---

## Purpose

Help an agent design preclinical research questions, hypotheses, and validation plans for receptor-binder-epitope mapping. This skill abstracts the end-to-end logic of structural domain selection, binder screening, epitope competition mapping, structural modeling, functional validation, and cross-variant generalization into a reusable research design framework. It does not provide clinical advice or operational laboratory protocols.

## When to use

Trigger when the user wants to propose new preclinical research questions, candidate binder screening strategies, epitope or mechanism hypotheses, and minimal validation plans based on a receptor, structural domain, known binder, or existing epitope information. Use for abstracting research design patterns across related systems, not for copying a specific experimental system or executing wet-lab procedures.

## Inputs required

- **Target biological context**: receptor, ligand, structural domain, variant background, disease or cellular context.
- **Known binders**: positive controls, competitive binders, non-overlapping epitope binders, irrelevant binders.
- **Available evidence**: structural data, sequence data, binding data, functional data, literature epitope or mechanism clues.
- **Boundaries**: permitted non-operational validation types, sample source limits, ethical and compliance constraints.
- **Expected deliverables**: research questions, hypothesis prioritization, experimental design framework, analysis workflow, iteration rules, or risk checklist.

## Core Workflow

1. **Functional domain selection & gap definition**
   - Anchor the research question to a structurally interpretable domain with known functional relevance and prior binder evidence.
   - Define the specific gap: unclear epitope overlap, unresolved blocking mechanism, unmapped variant coverage, or insufficient structural basis.
   - **Decision Gate 1**: Is the domain accessible and biologically relevant in the intended context? If no, redefine the target or stop.

2. **Binder screening & candidate generation**
   - Screen diverse candidate binders or panels against the selected domain.
   - Enrich for specific binding relative to irrelevant targets and background.
   - **Decision Gate 2**: Do candidates show reproducible, specific binding across independent replicates? If no, inspect target conformation, construct integrity, or stop.

3. **Epitope competition mapping**
   - Profile candidates against known binders to classify epitope relationships: overlapping, non-overlapping, allosteric, or unknown.
   - Include competition matrices with positive, negative, and cross-reactivity controls.
   - **Decision Gate 3**: Are competition patterns consistent across replicates and orthogonal readouts? If inconsistent, flag non-specific binding, conformational bias, or avidity effects and iterate.

4. **Structural modeling & interface prediction**
   - Model candidate-receptor interfaces using computational approaches appropriate to available templates or predicted structures.
   - Define predicted binding interfaces, contact regions, and conformational states.
   - **Decision Gate 4**: Does the structural model meet quality thresholds and explain the competition data? If model quality is insufficient or conflicts with competition results, revisit target conformation or modeling assumptions.

5. **Functional validation**
   - Design minimal viable validation that separates binding from functional impact (e.g., blocking, activation, conformational change).
   - Include strong controls: positive (known functional binder), negative (irrelevant binder), competition (overlapping vs. non-overlapping), and methodological controls.
   - **Decision Gate 5**: Does functional impact correlate with binding and epitope location? If function contradicts binding or competition, downgrade the mechanism hypothesis and iterate.

6. **Cross-variant generalization & boundary assessment**
   - Test whether the epitope and mechanism generalize across receptor variants, orthologs, or conformational states.
   - Assess interface conservation and structural compatibility.
   - **Decision Gate 6**: Is the mechanism conserved or context-dependent? If generalization fails, bound claims to tested variants and document extrapolation limits.

**Iteration and stop conditions**
- **Iterate** when competition and structural data conflict, when functional effects are weak relative to binding, or when cross-variant behavior diverges. Revise the target construct, expand competition references, switch readout modalities, or refine the mechanism model.
- **Stop** when candidates fail to reproduce across independent batches, when competition results conflict with multiple orthogonal readouts and cannot be resolved, when structural models are unreliable, or when functional effects cannot be distinguished from binding artifacts or non-specific effects.

## Output Format

Produce a structured research design document containing:

1. **Research question**: One sentence defining the investigable problem and its significance.
2. **Evidence map**: Categorize verified facts, indirect evidence, model inferences, and unknowns.
3. **Hypotheses**: Table of candidate hypotheses with evidence strength (high/medium/low), key assumptions, supporting evidence, failure modes, and minimal validation.
4. **Experimental design**: Purpose, variables, positive/negative/competition controls, primary metrics, acceptable/unacceptable outcomes, inferable conclusions, and non-inferable conclusions.
5. **Analysis plan**: Quality control, stratified evidence scoring, cross-validation strategy, and conclusion boundaries.
6. **Iteration plan**: Decision rules for updating hypotheses under support, partial support, non-support, or contradictory results.
7. **Validity and ethics notes**: Confounders, reproducibility requirements, safety/ethical boundaries, and extrapolation limits.

## Validation Gates

- **Gate 1 — Domain relevance**: The target domain is exposed, conserved where required, and functionally meaningful in the chosen context.
- **Gate 2 — Binder specificity**: Candidates exhibit reproducible specific binding with appropriate negative and background controls.
- **Gate 3 — Epitope consistency**: Competition relationships are consistent across replicates and orthogonal readouts.
- **Gate 4 — Structural concordance**: Predicted interfaces are plausible and compatible with competition mapping; model quality is explicitly assessed.
- **Gate 5 — Function-binding alignment**: Functional impact is directionally consistent with binding and epitope location; controls exclude non-specific effects.
- **Gate 6 — Generalization or bounded scope**: Cross-variant behavior is explicitly tested or claims are bounded to tested variants/conditions.

## Claim Boundaries

- Distinguish **verified** (direct experimental evidence), **inferred** (model-based or indirect evidence), and **hypothetical** (requires future validation).
- Binding evidence alone does not establish functional mechanism.
- Competition mapping defines epitope relationships, not exact residue-level contacts.
- Structural predictions are hypotheses pending experimental confirmation.
- Cross-variant conclusions apply only to the tested variants, species orthologs, or conformational states.

## Failure Modes

- Non-specific binding or detection artifacts due to tag effects, surface fixation, or aggregation.
- Target conformational state does not represent native accessibility or relevant biological context.
- Competition results confounded by multivalency, avidity, allosteric effects, or detection interference.
- Structural model bias introduced by template choice, input conformation, or low-resolution regions.
- Functional readout disconnected from the binding event (e.g., off-target activity, downstream pathway effects).
- Inability to generalize due to sequence divergence, conformational differences, or cellular context variation.

## Validity Checks

- **Biological validity**: Target domain exposure, conservation, and functional relevance in the relevant cellular or tissue context.
- **Epitope validity**: Epitope conclusions supported by at least one competition experiment and one independent structural or sequence line of evidence.
- **Statistical validity**: Predefined endpoints, background correction, replication strategy, signal thresholds, and effect sizes; avoid conclusions from single clones or single models.
- **Structural validity**: Template appropriateness, conformational state relevance, interface residue plausibility, and explicit model quality assessment.
- **Reproducibility**: Key results replicated across independent candidates, batches, or analytical methods.
- **Extrapolation boundaries**: Explicit limits on preclinical scope, cellular background, domain conformation, species differences, and variant coverage.

## Provenance

- Cluster 15 / subcluster 15.0.split0
- Synthesized from source skills: receptor-nanobody-epitope-discovery-workflow (51ceb9f39956ea59), retrovirus-receptor-neutralization-workflow (a0f4d15d1f680742), protein-binder-epitope-exploration (bf27adc100b67a3e), motif-guided-immune-binding-discovery (fb5d13f013b80107), immune-repertoire-longitudinal-discovery (28e0d2bc49373520), b-cell-repertoire-research (b7b21961a441c9d2), parasitic-vaccine-idiotype-research (c028101301723a87), immunogenetics-copy-number-repertoire-discovery (8ffb041679029d01).
