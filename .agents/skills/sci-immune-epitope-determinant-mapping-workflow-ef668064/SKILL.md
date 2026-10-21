---
name: sci-immune-epitope-determinant-mapping-workflow-ef668064
description: Narrow broad recognition phenotypes to minimal structural or sequence determinants via systematic boundary definition, variant perturbation, and comparative specificity analysis across related targets or receptor contexts.
scienceevolve-title: "Antibody and immune recognition · epitope determinant mapping workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

This skill guides agents to transform a broad molecular-recognition phenotype into a reusable, iterative research workflow for identifying minimal binding determinants. It abstracts the scientific reasoning pattern of boundary narrowing, targeted perturbation, orthogonal validation, and comparative specificity analysis across related targets. The goal is to help agents design non-operational research plans that distinguish specific recognition from nonspecific background, map necessary and sufficient features, and update hypotheses without overgeneralizing from a single system or paper.

# When to use

Use this skill when the user asks to:

- Generate new research questions about antibody, receptor, aptamer, or binder recognition determinants.
- Design studies to narrow a broad binding phenotype to a minimal structural, sequence, or contextual feature.
- Plan perturbation, boundary, or matched-control strategies for molecular recognition systems.
- Evaluate whether binding evidence supports a mechanistic determinant hypothesis across related targets or sample classes.
- Interpret discordance between binding assays, functional assays, and structural plausibility.
- Iterate from initial binding data toward a validated specificity map.

Do not use this skill for clinical decision-making, patient-specific recommendations, executable laboratory protocols, or treatment guidance.

# Inputs required

Before proposing a study, request or identify:

- **Recognition system:** target class, binder modality (e.g., antibody, receptor, aptamer), and biological context.
- **Broad phenotype:** the measurable but insufficiently specific recognition or functional response to resolve.
- **Candidate determinants:** regions, motifs, surfaces, modifications, or states suspected to control recognition.
- **Feature space:** related target variants, unrelated comparators, negative controls, and background conditions.
- **Available readouts:** direct binding, competition, orthogonal confirmation, and functional or structural evidence streams.
- **Comparative context:** independent samples, target variants, or reference sets for generalization testing.
- **Constraints:** ethics, biosafety, privacy, data access, sample availability, and acceptable non-operational detail.

If essential inputs are missing, state the minimum information needed before designing the study.

# Core Workflow

## Stage 1: Define the recognition gap and phenotype boundary
- Frame the broad phenotype and the unresolved mechanistic question.
- Distinguish recognition from downstream biological function.
- Define the minimal feature space, including related targets, unrelated comparators, and negative controls.

**Decision Gate 1:** Is the phenotype measurable and the gap well-defined?  
- **If no:** Stop and clarify inputs before proceeding.

## Stage 2: Generate competing determinant hypotheses
- Propose candidate determinants with explicit mechanistic roles.
- Include at least one artifact or null hypothesis (e.g., nonspecific binding, background, conformational disruption).
- Label evidence strength (exploratory, supported, mechanistically plausible) and state key assumptions.
- Define predicted patterns for positive and matched-negative expectations.

**Decision Gate 2:** Are hypotheses falsifiable and bounded by clear failure modes?  
- **If no:** Refine hypotheses before designing experiments.

## Stage 3: Design boundary-definition experiments
- Create a presentation matrix: isolated motif → flanking regions → domain → multi-domain complex → native-like context.
- Define progressive narrowing logic to test necessity of candidate determinants.
- Specify controls: negative, positive, phenotype-matched negative, presentation/integrity, and unrelated target.

**Decision Gate 3:** Does the design include independent group definition and prespecified failure criteria?  
- **If no:** Redesign controls and stopping rules.

## Stage 4: Execute targeted perturbation mapping
- Plan systematic perturbations (e.g., removal, substitution, conservative and disruptive changes) across candidate regions at the conceptual level.
- Compare perturbed cases against an unperturbed baseline.
- Use multiple perturbation styles to separate feature necessity from global structural collapse.

**Decision Gate 4:** Do perturbations test predicted roles without causing nonspecific disruption?  
- **If ambiguous:** Add presentation and integrity controls before interpreting biological effects.

## Stage 5: Comparative specificity analysis
- Test recognition across related targets to distinguish shared, specific, and variable determinants.
- Test unrelated targets to detect polyreactivity, background, or matrix effects.
- Compare stratum-specific patterns across sample classes, variants, or contexts.

**Decision Gate 5:** Is the signal specific to the intended feature space?  
- **If unrelated targets match intended targets:** Stop and redesign controls; downgrade specificity claims.

## Stage 6: Orthogonal validation and mechanism triangulation
- Confirm determinant candidates with an independent readout (different assay principle, structural evidence, or functional consequence).
- Integrate binding and functional evidence only when readouts converge.
- Keep alternative hypotheses active when binding and function diverge.

**Decision Gate 6:** Does orthogonal evidence agree with the primary readout?  
- **If discordant:** Label the determinant as assay-dependent and require additional independent confirmation.

## Stage 7: Evidence grading and hypothesis update
- Classify each determinant as: exploratory, boundary-supported, perturbation-supported, orthogonally supported, mechanistically plausible, or not supported.
- Update the model based on reproducibility, selectivity, and functional alignment.
- Downgrade claims if controls match candidate signal or if recognition persists for inactive cases.

**Decision Gate 7:** Is the evidence strength sufficient to support the current claim level?  
- **If not:** Downgrade the hypothesis or stop mechanistic claims.

## Stage 8: Iterate or terminate
- **If supported:** Propose bounded generalization (independent candidates, broader variant panels) or functional-readiness testing.
- **If ambiguous:** Identify the most discriminating next test; prefer orthogonal evidence over additional descriptive measurements.
- **If failed:** Reformulate the determinant hypothesis, redefine boundary conditions, or abandon the mechanism.

**Stop conditions:**
- Negative controls approach target signal.
- Unrelated targets are recognized as strongly as intended targets.
- Competition or perturbation does not reduce target signal.
- Strength or affinity model fit is poor or uncertain.
- Independent comparisons fail to reproduce the pattern.
- Safety, ethics, or validity requirements cannot be met.

**Final Gate:** Document all untested assumptions, residual uncertainties, and boundary conditions before concluding.

# Output Format

When using this skill, produce a structured research plan with the following sections:

1. **Research question and phenotype gap** — One-sentence question, biological relevance, and scope boundary.
2. **Hypothesis portfolio** — Candidate determinants with evidence strength, key assumptions, expected patterns, and failure modes.
3. **Boundary-definition and perturbation design** — Presentation tiers, comparison groups, controls, variables, and stop conditions.
4. **Analysis plan** — Normalization, feature importance ranking, stratum comparison, uncertainty handling, and evidence grading.
5. **Iteration decision tree** — Rules for upgrading, downgrading, redesigning, or stopping based on result patterns.
6. **Validity and safety notes** — Confounders, reproducibility checks, extrapolation boundaries, and ethics/biosafety constraints.

# Validation Gates

- **Gate 1 — Phenotype clarity:** The broad phenotype and mechanistic gap are explicitly defined before experiments are proposed.
- **Gate 2 — Hypothesis falsifiability:** Every candidate determinant has at least one competing hypothesis and defined failure modes.
- **Gate 3 — Control adequacy:** The design includes independent group definition, negative controls, and prespecified failure criteria.
- **Gate 4 — Perturbation interpretability:** Targeted changes are distinguishable from global structural disruption via presentation checks.
- **Gate 5 — Specificity separation:** Recognition of intended targets is separable from unrelated targets and background.
- **Gate 6 — Orthogonal convergence:** A second, independent readout supports the primary determinant claim.
- **Gate 7 — Evidence-to-claim alignment:** The stated claim level does not exceed the graded evidence.
- **Gate 8 — Residual documentation:** Untested assumptions and boundary conditions are explicitly recorded.

# Claim Boundaries

- A mapped determinant is supported only within the tested target variants, presentation contexts, and assay formats.
- Binding evidence alone does not prove functional relevance, therapeutic potential, or clinical utility.
- A single candidate, study, or assay does not establish a field-wide consensus mechanism.
- Sequence or structural novelty does not equate to biological function.
- Generalization to untested strains, variants, or in vivo contexts requires independent validation.
- Absence of detection is not absence of the phenomenon unless sensitivity and coverage justify that claim.

# Failure Modes

- **Nonspecific signal:** Candidate signal is indistinguishable from negative controls or unrelated targets.
- **Structural artifact:** Perturbation causes global disruption rather than specific determinant loss.
- **Presentation failure:** Loss of signal reflects poor target availability, instability, or assay context, not determinant absence.
- **Assay-specific bias:** The result depends on a single readout or platform without independent confirmation.
- **Overfitting:** A determinant is inferred from one variant panel or one candidate without replication.
- **Confounded breadth:** Apparent cross-reactivity is driven by hydrophobicity, charge, or matrix effects rather than specific recognition.
- **Mechanistic overreach:** Binding is interpreted as causal mechanism without orthogonal functional or structural evidence.

# Validity Checks

- **Confounding:** Check for target preparation differences, matrix effects, background reactivity, batch effects, candidate purity, and marker nonspecificity.
- **Reproducibility:** Require technical replicates, independent preparations, cross-batch consistency, and agreement between direct and competition readouts.
- **Statistical validity:** Prespecify primary and secondary metrics; report uncertainty, model-fit diagnostics, effect sizes, and multiple-comparison considerations.
- **Boundary conditions:** Explicitly define included and excluded target classes, source groups, and marker classes; state whether conclusions apply to one candidate, one class, or a broader mechanism.

# Provenance

- Synthesized from cluster 31 / subcluster 31.0.split0.
- Source skills: antibody-recognition-evidence-chain (940f3d1c52fb587b), native-state-binder-discovery (242473ae25ce94e6), epitope-fine-mapping-research-design (ea48723d02146347), soluble-mediator-neutralization-discovery (66af4b85a8c6bc3a), antibody-epitope-discovery-workflow (43acc774245b5333), peptide-specificity-exploration (9f0fa3c393b29afe), antibody-humanization-research-explorer (f05adda8390fc231), antibody-epitope-exploration-workflow (ba7f6806362ff884).
- Excluded skill: 5ad0bee4acb28bcd.
