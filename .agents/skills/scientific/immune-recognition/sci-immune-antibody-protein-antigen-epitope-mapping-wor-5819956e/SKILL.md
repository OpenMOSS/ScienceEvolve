---
name: sci-immune-antibody-protein-antigen-epitope-mapping-wor-5819956e
description: A reusable end-to-end workflow for generating, refining, and validating antibody-protein antigen epitope hypotheses through structural triangulation, competition logic, domain mapping, and orthogonal evidence integration.
scienceevolve-title: "Antibody and immune recognition · antibody protein antigen epitope mapping workflow"
scienceevolve-area: antibody-and-immune-recognition
---

## Purpose

Generate and evaluate research questions for antibody–protein antigen epitope discovery by triangulating structural, sequence, and binding evidence. The workflow guides computational and non-operational experimental planning to prioritize candidate epitope regions and mechanisms while keeping claims bounded to the available evidence.

## When to use

- The user provides an antigen, antibody, or antigen–antibody complex and asks how to identify or prioritize epitope candidates.
- The user has structural models, sequences, binding data, or comparative protein–protein interface data and wants a research design rather than a one-off prediction.
- The user needs to compare humoral and cellular recognition evidence, or to reconcile conflicting structural and biochemical data.
- The user wants to translate a structure-informed immunoinformatics strategy into a new antibody–antigen system.

Do not use this skill for clinical decision-making, treatment recommendations, operational wet-lab execution, or claims that a candidate is clinically useful without independent validation.

## Inputs required

- **Target system:** antigen identity, domain architecture, available sequences, available structures or models, known or suspected binding regions, and expression context.
- **Binder details:** antibody or probe class, paratope features if known, engineering history, and assumed recognition mode.
- **Evidence context:** source and quality of structural data, annotation sources, host background definition if applicable, and any licensing or governance constraints.
- **Baseline methods:** existing epitope predictors, docking outputs, mutation data, peptide mapping, competition data, or prior hypotheses to compare against.
- **Validation constraints:** what orthogonal evidence is available or ethically appropriate, including whether validation is purely computational or requires qualified experimental follow-up.
- **Intended use boundary:** discovery research, mechanistic hypothesis generation, or assay development support; explicitly not clinical guidance.

## Core Workflow

1. **Frame the mechanistic gap.** Define the unresolved question: binding site location, domain assignment, conformational dependence, glycan dependence, competition mechanism, or species restriction. State the specific decision the hypothesis must support (e.g., which residues to test, which domain to prioritize).
   - *Decision gate:* If the target and binder are insufficiently characterized to define a falsifiable gap, stop and request missing inputs.

2. **Inventory evidence and generate competing hypotheses.** Collect sequence, structural, evolutionary, and prior binding evidence. Formulate at least three competing hypotheses for the epitope class (e.g., linear, conformational/discontinuous, domain-specific, quaternary, glycan-dependent) and mechanism (e.g., direct competition, non-blocking recognition, induced fit). For each hypothesis specify predicted effect, key assumptions, evidence strength, likely failure mode, and minimal validation.
   - *Decision gate:* If hypotheses are indistinguishable with available evidence, flag the need for orthogonal data before proceeding.

3. **Design a multi-modal validation plan.** Define independent variables (target representation, conformational state, domain fragments), dependent variables (ranking quality, enrichment, competition outcome), and moderators (flexibility, glycosylation, accessibility). Specify positive, negative, strong, and decoy controls. Define minimal viable validation: the smallest non-clinical evidence set that can falsify the leading hypothesis.
   - *Decision gate:* If no orthogonal assay class is available, limit claims to computational prioritization and require explicit uncertainty labels.

4. **Broad candidate generation.** Use baseline structural or sequence-informed methods to define an initial set of candidate regions. Map these onto accessible surfaces, domain boundaries, and conservation patterns. Keep targeted scan evidence distinct from library or motif-discovery evidence.
   - *Iteration/stop:* If broad candidates are dominated by low-confidence structural features or background noise, stop and revisit data quality or background definition.

5. **Partner-conditioned or orthogonal refinement.** Refine candidates using partner-specific features (paratope composition, local neighborhood context), competition logic, host-background rarity, or structural triangulation. Compare task-specific interface residues against an appropriate background (accessible surface or matched non-binding interfaces). Apply two-stage ranking: baseline first, then conditioned score.
   - *Decision gate:* If refinement fails to improve over baseline after appropriate controls, stop and reassess the conditioning assumptions.

6. **Triangulate and integrate evidence.** Cross-map peptide hits, motif screens, competition data, domain mapping, and structural predictions onto a common coordinate framework. Score evidence streams separately, then apply predefined decision rules:
   - **Strong support:** independent assays plus competition or perturbation evidence converge on the same region.
   - **Moderate support:** two assay types converge, but orthogonal validation is incomplete.
   - **Weak support:** one assay shows signal without controls or structural plausibility.
   - *Iteration/stop:* If evidence streams conflict, generate alternative models (conformational masking, discontinuous epitope, assay artifact) rather than discarding dissenting data. If all candidate regions fail specificity or reproducibility controls, stop and redesign.

7. **Update hypotheses iteratively.** Promote, demote, contextualize, revise mechanism, expand coverage, or stop based on the integrated evidence. Record each iteration as a decision table: hypothesis, evidence change, decision, reason, and next test.
   - *Stop conditions:*
     - No improvement over baseline after appropriate controls.
     - Performance depends on a narrow dataset or annotation artifact.
     - Independent validation conflicts with the computational ranking.
     - Controls fail or signals are not reproducible.
     - The intended use would require clinical or operational wet-lab claims beyond the evidence.

## Output Format

When using this skill, return:

1. **Research question and mechanistic gap:** one sentence describing the target epitope discovery problem and the unresolved mechanism.
2. **Evidence ledger:** known facts, model inputs, and uncertain assumptions, with provenance labels.
3. **Hypothesis table:** candidate epitope hypotheses with evidence strength, key assumptions, predicted signatures, likely failure modes, and minimal validation.
4. **Validation plan:** variables, controls, minimal viable validation, evaluation metrics, and stop conditions.
5. **Analysis plan:** data curation, candidate generation, ranking refinement, triangulation rules, evidence scoring, and visualization.
6. **Iteration plan:** rules for promoting, demoting, revising, or retiring hypotheses based on outcomes.
7. **Validity and safety notes:** confounders, generalization limits, reproducibility checks, and non-clinical scope boundaries.

## Validation Gates

- **Input sufficiency:** Target, binder, and at least one evidence stream are defined; missing inputs are flagged.
- **Hypothesis discriminability:** Competing hypotheses generate distinct predictions testable by the proposed plan.
- **Control adequacy:** Positive, negative, strong, and decoy controls are specified before data interpretation.
- **Orthogonality:** At least two independent methodological classes are available for strong-support claims.
- **Background appropriateness:** Enrichment or rarity is measured against a matched accessible-surface or host-proteome background, not the full sequence alone.
- **Data leakage check:** Validation systems are excluded from propensity estimation, threshold selection, and model training.

## Claim Boundaries

- Computational predictions are research hypotheses, not clinical diagnostics or therapeutic recommendations.
- Epitope prioritization does not prove immunogenicity, neutralization, protection, or safety.
- Structural models and docking poses are hypothesis-generating, not conclusive proof of binding geometry.
- Conclusions apply only within the stated antibody class, antigen family, structural dataset, and assay context unless independently validated.
- The workflow does not provide operational wet-lab protocols, executable biological parameters, or hazardous procedural details.

## Failure Modes

- **Template or model dependence:** Predictions collapse when alternative homologous templates or conformations are used.
- **Conformational uncertainty:** Flexible loops, unresolved regions, or multiple conformational states drive false-positive candidate regions.
- **Assay artifact:** Nonspecific binding, tag/Fc effects, aggregation, detection reagent cross-reactivity, or matrix effects mimic specific recognition.
- **Background mismatch:** Host proteome, annotation density, or composition bias creates spurious enrichment or rarity signals.
- **Competition misinterpretation:** Simultaneous binding is incorrectly treated as non-competition without considering steric geometry; blocking is assumed to prove epitope identity.
- **Glycan or PTM masking:** Glycosylation or post-translational modifications obscure true epitopes or create artifactual accessibility differences.
- **Overfitting to narrow datasets:** Performance is driven by repeated antigen families, antibody lineages, or structural template redundancy.

## Validity Checks

- **Confounding:** Evaluate exposure history, cross-reactivity, host context, sample handling, glycan processing, and assay format effects.
- **Redundancy:** Check whether repeated families, lineages, or templates dominate the apparent signal.
- **Structural uncertainty:** Test sensitivity to structure source, resolution, modeling method, conformational state, and interface annotation rules.
- **Statistical validity:** Use held-out validation, permutation or randomization controls, confidence intervals, and correction for multiple comparisons.
- **Reproducibility:** Provide feature definitions, splits, random seeds, versioned sequences/structures, and enough metadata for independent rerun.
- **Boundary conditions:** Limit claims to the tested antigen, binder class, conformation, expression system, and assay readouts.
- **Evidence separation:** Distinguish exploratory recognition from claims about protection, efficacy, or clinical utility.

## Provenance

- Derived from cluster 20, subcluster 20.0.split0.
- Synthesized from source skills: `antibody-epitope-exploration` (88349386c5b8e23a), `viral-epitope-exploration-workflow` (5cb2bedb515d985c), `antibody-binding-site-modeling` (cc80e6c99a41998e), `epitope-host-similarity-exploration` (882553234e429062), `antibody-epitope-research-workflow` (297e45de9273a116), `membrane-protein-epitope-mapping` (b6fdc19da9a675c0), `hiv-v1v2-apex-antibody-exploration` (8400c1b2232986e5), `peptide-epitope-conformation-research` (76dfa9c2e83dcdeb).
- No paper-specific conclusions, parameters, or operational protocols are included.
