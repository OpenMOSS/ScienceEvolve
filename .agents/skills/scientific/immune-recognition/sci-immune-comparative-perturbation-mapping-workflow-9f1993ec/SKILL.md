---
name: sci-immune-comparative-perturbation-mapping-workflow-9f1993ec
description: Agent skill for localizing and validating molecular determinants of protein recognition, binding, or assembly through staged comparative perturbations and orthogonal readouts.
scienceevolve-title: "Antibody and immune recognition · comparative perturbation mapping workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Enable agents to plan and execute reusable, non-operational research programs that discover which structural or sequence features mediate a specific molecular recognition or assembly event. The workflow localizes candidate determinants by perturbing them in a target context and comparing effects against informative alternative contexts, then validates findings through convergent orthogonal evidence rather than single-assay conclusions.

# When to use

Use this skill when a user asks to:

- Map binding, recognition, or assembly determinants for a protein, receptor, carrier particle, or antigen.
- Design a staged perturbation strategy that progresses from coarse localization to focused deconvolution.
- Compare target and alternative ligands, homologs, states, or contexts to infer specificity mechanisms.
- Interpret whether a region contributes through direct contact, conformational coupling, allosteric regulation, or structural integrity.
- Plan iterative validation with explicit stop conditions, claim boundaries, and failure modes.

Do not use this skill for clinical diagnosis, patient management, treatment recommendations, operational wet-lab protocols, or executable biological manipulation instructions.

# Inputs required

Before starting, collect or infer:

- **Recognition system**: the target protein, receptor, scaffold, or particle and its interaction partner(s).
- **Contrast definition**: the target interaction and at least one informative alternative context (e.g., off-target ligand, homolog, inactive state, cross-reactive binder).
- **Prior evidence**: structural models, sequence alignments, conservation data, predicted exposure, prior fragment or mutagenesis data, and known functional domains.
- **Perturbation options**: candidate region(s) and feasible perturbation classes (domain-level, segment swap, focused substitution, deletion, or orthogonal probe) without operational details.
- **Readout inventory**: available binding, functional, structural integrity, and specificity assays at a conceptual level.
- **Constraints**: biosafety, ethics, sample governance, non-clinical scope, and reproducibility standards.

# Core Workflow

Follow this ordered end-to-end route. At each stage, apply the decision gates and stop conditions before proceeding.

1. **Define the recognition contrast and mechanistic gap**
   - State the target interaction, the informative alternative context, and the unresolved subregion or feature.
   - *Decision gate*: Stop if the contrast is arbitrary or if no alternative context can be measured under matched conditions.

2. **Generate candidate determinants from orthogonal evidence**
   - Integrate structural exposure, sequence conservation, homology, prior fragment data, and predicted interfaces.
   - Rank candidates by convergent support, not by a single prediction source.
   - *Decision gate*: Stop if candidates are not falsifiable or if no prior evidence narrows the search space.

3. **Design a perturbation ladder**
   - Begin with coarse domain or segment-level changes.
   - Progress to focused substitutions or probe variations only where localization justifies it.
   - Include reference, single perturbation, combination, and rescue/reversion conditions where feasible.
   - *Stop condition*: Do not proceed to focused perturbations if coarse changes globally destabilize the scaffold.

4. **Specify orthogonal readouts**
   - Pair recognition or binding measurements with independent integrity, functional, and specificity controls.
   - Define primary metrics (target recognition) and secondary metrics (scaffold integrity, specificity).
   - *Decision gate*: Stop if only one assay format is available and no orthogonal confirmation is possible.

5. **Execute comparative measurements**
   - Assess perturbations in both target and alternative contexts under matched conditions.
   - Record per-sample or per-variant matrices before aggregating.
   - *Stop condition*: Pause if integrity controls fail, batch effects dominate, or target-specific signal is absent in the reference condition.

6. **Classify perturbation signatures**
   - Label effects as: selective loss, shared loss, gain, compensation, preference switching, or no detectable effect.
   - Cluster variants by signature across readouts rather than by position alone.
   - *Decision gate*: Reclassify as artifact if effects correlate with integrity failure or nonspecific background.

7. **Map signatures to mechanism**
   - Infer whether a candidate region acts as a direct contact site, conformational element, allosteric regulator, or assembly-coupled feature.
   - Require convergent evidence before elevating a signature to a mechanistic claim.
   - *Decision gate*: Downgrade claims if observed effects reflect probe-induced steric bulk, expression differences, or conformational masking rather than the proposed mechanism.

8. **Update the mechanism model and decide next action**
   - Revise the model, state claim boundaries, document failure modes, and define the next iteration or stopping condition.
   - Iterate only if the next experiment can falsify at least one remaining mechanistic explanation.
   - *Final stop condition*: Stop when controls are satisfied, evidence converges across independent readouts, or no falsifiable hypothesis remains.

# Output Format

When using this skill, produce:

1. **Research question**: concise, scoped to a target family and recognition mechanism.
2. **Evidence map**: table with candidate regions/features, supporting evidence, evidence strength, key assumptions, and failure modes.
3. **Hypotheses**: each labeled strong, moderate, weak, or speculative, with predicted effects and alternative explanations.
4. **Mechanistic map**: linking candidate features to recognition phenotypes with evidence tiers (direct, indirect, structural, ambiguous, unsupported).
5. **Non-operational validation plan**: variables, controls, primary and orthogonal readouts, decision rules, success criteria, and stop conditions.
6. **Analysis plan**: data structure, normalization, signature classification, clustering logic, statistical checks, and visualization rules.
7. **Iteration plan**: next decision point, what result would update or falsify the hypothesis, and what would trigger redesign or stopping.
8. **Validity and scope statement**: confounders, reproducibility requirements, extrapolation limits, and ethics/safety constraints.

# Validation Gates

- **Integrity controls**: Confirm that perturbations do not cause global misfolding, expression failure, aggregation, or loss of native assembly.
- **Specificity controls**: Distinguish target-specific recognition effects from nonspecific binding, assay artifacts, or probe cross-reactivity.
- **Comparative context controls**: Verify that target and alternative measurements are performed under matched conditions.
- **Orthogonal readout convergence**: Require agreement between binding and functional or structural evidence before claiming direct contact or causality.
- **Reproducibility checks**: Key observations must replicate across independent preparations, batches, or assay modes before elevating evidence strength.

# Claim Boundaries

- Can support claims about which regions are necessary or contribute to recognition in the tested system.
- Can support relative importance rankings when multiple independent perturbations converge on the same region.
- Cannot support universal claims about receptor identity, clinical relevance, diagnostic performance, or field-wide consensus.
- Cannot prove direct physical contact from loss-of-binding alone; such claims require structural, competition, or rescue evidence.
- Cannot be extrapolated beyond the tested protein family, species, cell context, or experimental conditions without additional evidence.

# Failure Modes

- **Global destabilization**: Perturbations disrupt scaffold integrity rather than recognition specificity. Halt mechanistic interpretation and redesign perturbations.
- **Single-assay dependency**: Results rely entirely on one assay format without orthogonal confirmation. Weaken or withhold claims.
- **Incomparable contexts**: Target and alternative contexts cannot be measured under matched conditions. Split or downgrade comparative claims.
- **Unfalsifiable candidates**: Candidate determinants lack negative controls or cannot be separated from artifacts. Redesign the perturbation ladder.
- **Probe artifacts**: Observed effects reflect steric bulk, expression differences, conformational masking, or nonspecific adsorption rather than the proposed mechanism. Downgrade claims and add specificity controls.

# Validity Checks

Before finalizing any recommendation, verify:

- **Scope**: Distinguish paper-derived evidence from new-agent inference.
- **Consensus**: Do not present single-study findings as field consensus.
- **Controls**: Scaffold, negative biological, positive context, and technical/reference controls are explicit and interpretable.
- **Confounding**: Sample composition, expression variation, cross-reactivity, batch effects, and platform bias are considered.
- **Structural validity**: Distinguish linear from conformational claims and state whether probes preserve relevant structure.
- **Statistical validity**: Use methods appropriate for distribution, dependence, and sample structure; avoid overinterpreting trends.
- **Reproducibility**: Specify what must replicate across batches, subsets, or orthogonal platforms.
- **Boundary conditions**: State target family, sample type, assay platform, and assumptions under which the plan is valid.

# Provenance

- Derived from cluster 12, subcluster 12.0 (comparative-perturbation-recognition-workflow).
- Synthesized from source skills: allergen-ige-epitope-exploration, apolipoprotein-ligand-domain-discovery, antibody-specificity-perturbation-mapping, food-allergen-epitope-exploration, gad65-autoantibody-research-design, integrin-epitope-research-workflow.
- Excluded outliers: gene architecture, isoform regulation, and acquired glycan display skills (IDs: 0636de726cdf1ebc, 512539fbecda7fbe, d91328e44159d7d7).
