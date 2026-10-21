---
name: sci-immune-epitope-to-mechanism-discovery-workflow-e15dab38
description: A reusable research-design workflow for disease- or phenotype-driven epitope mapping that triangulates binding specificity, tissue localization, and functional readouts to discriminate pathogenic mechanisms.
scienceevolve-title: "Antibody and immune recognition · epitope to mechanism discovery workflow"
scienceevolve-area: antibody-and-immune-recognition
---

## Purpose

Guide agents to generate research questions and non-operational study designs that map disease-associated binding specificities to candidate pathogenic mechanisms. The workflow teaches triangulation across phenotype, binding specificity, tissue localization, and functional consequence to move from observational association toward mechanistic discrimination, without endorsing clinical application or operational protocols.

## When to use

Use this skill when the task is to:

- Propose new research questions where a disease phenotype or subset is linked to a candidate molecular target but the pathogenic mechanism is unknown.
- Design preclinical studies that test whether observed binding specificity explains tissue involvement, functional disruption, or disease heterogeneity.
- Generate hypotheses, experimental designs, analysis plans, or iteration logic for epitope-level or target-level mechanism discovery.

Do not use this skill for clinical advice, diagnosis, treatment recommendations, patient-specific interpretation, or executable wet-laboratory protocols.

## Inputs required

Before producing a research plan, collect or request:

- **Disease/phenotype context**: subset definitions, tissue involvement, clinical boundaries, and whether the goal is discovery or validation.
- **Candidate target space**: known or suspected antigen families, domain architecture, structural accessibility, and prior serologic or binding evidence.
- **Biological sample context**: available disease cases, related-disease controls, healthy controls, and tissue substrates (conceptual level only).
- **Readout modalities**: binding assays, specificity or depletion approaches, localization methods, and functional models accessible at a non-operational level.
- **Constraints**: ethics approvals, biospecimen governance, sample availability, statistical power, and safety boundaries.
- **Prior evidence**: published findings, negative data, known cross-reactivity, treatment effects, and alternative mechanisms.

If any input is missing, state the assumption explicitly and design the plan to test that assumption.

## Core Workflow

1. **Frame the mechanistic gap**
   - Define the disease subset, phenotype boundary, and the unknown link between observed binding and pathogenic mechanism.
   - **Gate 1 — Reframe check**: If the question is framed as confirmation rather than mechanistic discrimination, stop and reframe.

2. **Map candidate target space and generate hypotheses**
   - Rank candidate antigens or epitope regions by prior evidence, structural accessibility, and tissue relevance.
   - Formulate mutually discriminating hypotheses that predict distinct patterns across binding specificity, tissue localization, and functional consequence.
   - Include alternative explanations: shared epitopes, cross-reactivity, epitope spreading, non-antibody drivers, or post-binding bottlenecks.
   - **Gate 2 — Discriminability check**: If hypotheses do not predict different outcomes across orthogonal readouts, narrow or expand the target space.

3. **Design minimal viable triangulation**
   - Select antigen regions conceptually, from broad domains to narrower motifs only when justified by prior evidence.
   - Define comparison groups: disease subsets, related-disease controls, healthy controls.
   - Assemble an assay stack: binding readout, specificity or depletion readout, tissue-localization readout, and disease-relevant functional readout.
   - Specify controls by purpose: negative, positive, specificity, and technical.
   - Predefine evaluation metrics and stop conditions.
   - **Gate 3 — Orthogonality check**: If the design lacks at least one binding readout and one non-binding readout (localization or functional), redesign.

4. **Discovery and specificity filtering**
   - Screen for target recognition across the candidate space.
   - Filter against negative controls, related-disease controls, and irrelevant target regions to exclude non-specific or cross-reactive signals.
   - **Gate 4 — Specificity check**: If binding is indistinguishable from controls or dominated by non-specific signal, stop or redesign specificity controls.

5. **Orthogonal validation and mechanism discrimination**
   - Evaluate tissue localization concordance with the predicted antigen model.
   - Test functional relevance only when binding and localization are credible.
   - Compare patterns across disease subsets to discriminate between competing mechanistic hypotheses.
   - **Gate 5 — Convergence check**: If binding, localization, and functional evidence do not converge, iterate on the target model, target presentation, or post-binding assumptions.

6. **Evidence grading and boundary setting**
   - Grade evidence:
     - **Strong**: subset-specific binding, specificity controls, and convergent localization or functional support.
     - **Moderate**: binding and one orthogonal readout support the model, but controls remain incomplete.
     - **Weak**: signal exists without adequate specificity, localization, or reproducibility.
   - State boundary conditions: applicable disease subsets, tissue sites, antigen families, antibody classes, and model systems.
   - **Gate 6 — Claim check**: If evidence is Weak, treat the finding as a candidate hypothesis requiring further iteration; do not advance to mechanistic claims.

7. **Iterate or stop**
   - **Advance**: Evidence supports a focused next test with a clear decision rule.
   - **Revise**: Discordant results point to missing variables, alternative target forms, or narrower boundaries; update the antigen model and repeat from Stage 2.
   - **Stop**: Non-specificity, lack of functional relevance, unacceptable uncertainty, or ethical/safety concerns halt the line of inquiry.

## Output Format

When using this skill, produce:

1. **Research question**: One concise mechanistic gap in a defined disease context.
2. **Hypothesis table**: Columns for hypothesis, predicted target region/mechanism, disease-subset specificity, evidence strength, key assumptions, failure modes, and boundary conditions.
3. **Experimental design**: Conceptual variables, comparison groups, control strategy, assay stack, evaluation metrics, and stop conditions.
4. **Analysis plan**: Binding matrix logic, specificity interpretation, localization concordance, functional concordance, evidence grading, and reproducibility checks.
5. **Iteration plan**: Decision rules for advance, revise, or stop based on each major result pattern.
6. **Validity and safety check**: Confounders, non-transferable assumptions, ethics requirements, and limits on clinical interpretation.

## Validation Gates

- **Phenotype boundary clarity**: Disease subsets and comparators are defined by appropriate clinical, histologic, or immunopathologic criteria.
- **Hypothesis discriminability**: Each hypothesis predicts a distinct outcome across at least two orthogonal readouts.
- **Specificity gate**: Binding signals must be separable from healthy controls, related-disease controls, and irrelevant target regions.
- **Orthogonality gate**: Mechanistic claims require convergent evidence from binding and at least one of localization or function.
- **Reproducibility gate**: Independent samples or cohorts are required for claims beyond preliminary discovery.
- **Safety/ethics gate**: Human biospecimen and animal-model work are flagged for appropriate oversight and governance review.

## Claim Boundaries

- Binding specificity alone does not prove pathogenicity or therapeutic utility.
- Localization evidence supports compartment accessibility, not necessarily causal mechanism.
- Functional effects in model systems do not extrapolate to clinical efficacy or human safety.
- Observations from one disease subset, species, or model system cannot be generalized without independent validation.
- Paper-specific antigens, fragments, cohorts, and measured values are illustrative, not reusable rules.

## Failure Modes

- Non-specific or cross-reactive binding masks true signals.
- Tissue localization contradicts the predicted antigen model due to epitope masking or accessibility limits.
- Functional readouts are discordant with binding (e.g., post-binding bottleneck, assay artifact).
- Disease heterogeneity or treatment effects confound subset-specific signals.
- Sample quality, batch effects, or epitope presentation artifacts generate false candidates.
- Overfitting to a single donor, strain, or antigen format.

## Validity Checks

- Disease classification accuracy and phenotype confounding are considered.
- Sample quality, handling, and reagent stability do not explain results.
- Antigen integrity and presentation format match the assay type.
- Cross-reactivity with plausible alternative antigens or antigen families is tested.
- Assay concordance: binding, specificity, localization, and functional evidence align.
- Statistical validity: sample size, replication, blinding, variability, and multiple-comparison risks are addressed.
- Negative evidence is recorded: failed binders, non-replication, and discordant results are preserved.
- Boundary conditions are stated explicitly for subset, tissue, species, and model applicability.

## Provenance

- Synthesized from cluster 23, subcluster 23.1.split0.
- Derived from source skills: autoimmune-bmz-epitope-discovery (645ba49e54536c7d), tumor-vascular-targeting-discovery-workflow (77a644e0df341280), flavivirus-neutralizing-binder-discovery (f1b9bf11b76dbc52), pemphigus-autoantibody-repertoire-workflow (408ed84ee18ab1b4), dr5-antibody-engineering-research-workflow (ee58f02976e95454), anti-cd3-immunotoxin-affinity-maturation-workflow (9c53de7703a549c1), selective-binder-research-workflow (eae2fb1c370ea548), autoantigen-epitope-mapping-research (716aefffe432e445).
- Preserves shared workflow logic; excludes paper-specific systems, parameters, and conclusions.
