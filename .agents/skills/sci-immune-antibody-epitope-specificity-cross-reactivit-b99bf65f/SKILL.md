---
name: sci-immune-antibody-epitope-specificity-cross-reactivit-b99bf65f
description: Reusable end-to-end workflow for discovering, mapping, and validating antibody epitope specificity, cross-reactivity, mimicry, and heteroclitic recognition across binders and serological samples.
scienceevolve-title: "Antibody and immune recognition · antibody epitope specificity cross reactivity workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Use this skill to guide hypothesis-driven research on antibody and binder epitope specificity, cross-reactivity, molecular mimicry, and heteroclitic recognition. The workflow converts binding observations into testable mechanistic hypotheses, moving from epitope mapping through functional profiling to validated recognition boundaries, without reproducing any single paper’s system-specific conclusions.

# When to use

Use when the user asks for:
- Research plans for epitope mapping or specificity testing of antibodies, engineered binders, or serological samples.
- Hypothesis generation around cross-reactivity, off-target binding, or molecular mimicry.
- Designs that pair binding assays with functional readouts.
- Iterative validation of anomalous or heteroclitic recognition events.

Do not use for clinical diagnosis, prognosis, treatment selection, patient management, or operational wet-lab protocol generation.

# Inputs required

- **Biological context:** target tissue, compartment, disease state, or exposure history.
- **Candidate immune material:** monoclonal antibodies, recombinant fragments, sera, or other binders.
- **Antigen landscape:** intended target, related isoforms/receptors, self-molecules, pathogen-derived candidates, and unrelated negative antigens.
- **Assay modalities:** available binding, competition, kinetic, structural, and functional readouts described at a non-operational level.
- **Comparator strategy:** disease, healthy, technical, and format-matched controls.
- **Constraints:** ethics, biosafety, sample availability, and data governance.

# Core Workflow

1. **Define the specificity question and mechanistic interface**
   - Frame the research question at the boundary between immune recognition and target biology.
   - State whether the goal is epitope assignment, cross-reactivity boundary definition, mimicry testing, or heteroclitic mechanism discovery.

2. **Assemble the antigen–binder matrix**
   - Map candidate binders or sera against the intended target, related antigens, self-candidates, pathogen mimics, and unrelated controls.
   - Identify compartments and regions where off-target binding or mimicry could plausibly occur.

3. **Epitope-resolution and specificity screening**
   - Localize recognition to regions, domains, or conformational determinants.
   - Compare target binding against related-antigen and unrelated-antigen panels.
   - **Decision Gate 1 (Specificity Gate):** Target signal must exceed matched negative controls and unrelated antigens by a predefined margin. If not, stop and redesign controls.

4. **Cross-reactivity and mimicry testing**
   - Screen dominant target or self regions against candidate external triggers.
   - Evaluate whether shared determinants (sequence, structural, or chemical) explain recognition.
   - **Decision Gate 2 (Mimicry Gate):** Cross-reactivity must be reproducible and enriched in relevant sample classes. If recognition is widespread or non-specific, revise the target or assay design.

5. **Functional consequence profiling**
   - Pair binding data with functional readouts that reflect the hypothesized mechanism.
   - Classify candidates by binding pattern, functional pattern, and specificity breadth.
   - **Decision Gate 3 (Function Gate):** Functional effects must survive unrelated-agent, matrix, and vehicle controls. If negative controls show activity above threshold, stop before mechanistic interpretation.

6. **Mechanism discrimination**
   - Distinguish direct binding from indirect complex formation, avidity/multivalency, conformational state dependence, or assay artifact.
   - Use simplified target systems, determinant removal, orthogonal assay formats, and competition mapping.
   - **Decision Gate 4 (Mechanism Gate):** The proposed mechanism must explain both positive cases and negative controls, and survive simplified-system testing. If it fails, downgrade the claim to observation-level only.

7. **Evidence integration and claim grading**
   - Require orthogonal evidence streams (e.g., binding + competition + function + structural context) to converge before upgrading confidence.
   - Assign evidence grades: A (reproducible, control-supported, orthogonalized), B (mostly supported, one missing layer), C (preliminary), D (unsupported).
   - **Decision Gate 5 (Integration Gate):** Advance the hypothesis only when multiple independent evidence types converge. If data conflict, treat the result as unresolved.

8. **Iterate or terminate**
   - **Support:** Convergent evidence, all controls pass. Next step: refine antigen identity, determinant mapping, or disease relevance.
   - **Partial support:** Binding present but function, localization, or mimicry evidence weak. Next step: improve controls, expand comparator groups, or test alternative antigen compartments.
   - **Refute / Pivot:** Signal absent, irreproducible, or explained by controls. Next step: abandon the current mechanism or formulate a narrower hypothesis.
   - **Stop Conditions:** Signal is indistinguishable from controls; candidate identity is not reproducible; the interaction depends on an uncharacterized confounder; loss of binding coincides with target instability; the mechanism predicts results that are not observed; or ethical/biosafety constraints prevent meaningful validation.

# Output Format

Return:
1. **Scope statement:** target system, exposure, and mechanistic interface.
2. **Research question:** one clear, testable question.
3. **Mechanistic model:** exposure/recognition → immune variable → antigen compartment → tissue/cell effect.
4. **Hypothesis table:** evidence strength, key assumptions, required controls, likely failure modes, and minimal validation.
5. **Experimental design summary:** variables, comparison groups, controls, endpoints, and stop conditions.
6. **Analysis plan:** quality checks, group comparisons, integration rules, and decision criteria.
7. **Iteration plan:** actions for support, partial support, or refutation.
8. **Validity and ethics notes:** confounders, boundary conditions, reproducibility checks, and compliance constraints.

# Validation Gates

Predefined criteria that must be met before advancing:
- **Gate 1 – Specificity:** Target signal exceeds related-antigen and negative-control signals; unrelated-protein reactivity is below threshold.
- **Gate 2 – Orthogonal confirmation:** A second independent assay format or readout supports the same candidate or interaction.
- **Gate 3 – Directness:** The interaction is reproducible in a simplified system or after determinant mapping without requiring indirect complexes.
- **Gate 4 – Functional linkage:** Functional effects are observed only when specific binding is present, and controls rule out matrix or vehicle artifacts.
- **Gate 5 – Reproducibility:** Results appear across independent samples, preparations, or batches.
- **Gate 6 – Mechanistic consistency:** The proposed mechanism predicts both observed positives and observed negatives.

# Claim Boundaries

- Distinguish observation from mechanism at every stage.
- Epitope claims are limited to the resolution of the assay (domain-level vs residue-level).
- Cross-reactivity claims apply only to the tested antigen panel and sample context.
- Functional claims require evidence that the effect is target-specific, not indirect or matrix-driven.
- No clinical, diagnostic, or therapeutic claims are supported.
- Single-study findings are not treated as field consensus.

# Failure Modes

- Nonspecific binding or matrix background masquerading as specific recognition.
- Assay artifact (surface adsorption, reagent carryover, detection bias).
- Avidity or multivalency inflating apparent affinity or obscuring true specificity.
- Sample-selection bias or disease heterogeneity confounding mimicry hypotheses.
- Clonal expansion or immune history unrelated to the target biology.
- Target instability or misfolded binder misinterpreted as determinant loss.
- Inflammation-induced or bystander activation mistaken for antigen-specific response.

# Validity Checks

Before finalizing claims:
- **Confounding:** Check infection status, inflammation, disease stage, tissue handling, treatment history, demographics, and batch effects.
- **Specificity:** Verify persistence of signal after negative and unrelated controls.
- **Reproducibility:** Require independent samples, assay runs, or model systems.
- **Boundary conditions:** Limit conclusions to tested tissues, infections, disease stages, model systems, binder formats, and assay platforms.
- **Statistical validity:** Ensure sample size, variance, multiple comparisons, and effect-size uncertainty are addressed.
- **Causal caution:** Distinguish association, functional plausibility, and disease causation.
- **Single-source boundary:** Do not treat one study’s conclusions as consensus without independent replication.

# Provenance

Synthesized from cluster 23, subcluster 23.0.split0. Derived from source skills: a14ec2191290c63a, 6965640ec861c1b9, d3b27edbc2d4c602, e518c5d58ab662ba, 69a838e07038f66b, e7c98dd606ca5ed7, 9de5bc38cbe1cb16, 9fec0fd73f0ec145.
