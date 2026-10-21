---
name: sci-immune-binder-discovery-engineering-workflow-fee8b7c3
description: Reusable end-to-end workflow for discovering and engineering antibody-like binders through display-based screening, specificity-first selection, artifact-aware enrichment, and functional phenotype validation.
scienceevolve-title: "Antibody and immune recognition · binder discovery engineering workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Guide agents to design transferable research plans for discovering, prioritizing, and validating antibody-like binders. The central challenge is distinguishing true target recognition and modality-relevant functional phenotype from assay artifacts, abundance effects, carrier-scaffold confounders, and nonspecific background. This workflow supports hypothesis generation, non-operational experimental design, and iterative mechanistic validation across display-based, repertoire-based, and engineered-binder contexts.

# When to use

Use this skill when the user asks to:
- Generate research questions for antibody, nanobody, peptide, aptamer, or engineered-binder discovery.
- Design a target-directed discovery workflow that selects for specificity and functional phenotype rather than binding alone.
- Plan artifact-aware screening where candidate abundance or display must be separated from target function.
- Evaluate whether observed enrichment reflects true affinity, epitope alteration, expression-density effects, or selection bias.
- Explore latent functional phenotypes (e.g., catalytic, internalization, routing, neutralization) in antigen-selected binders.
- Fill component gaps by designing complementary binders that add non-redundant coverage to an existing intervention.
- Critique a proposed study for confounding, weak controls, overgeneralization, or unclear causal logic.

Do not use this skill for clinical diagnosis, patient management, treatment selection, executable wet-lab protocols, or high-risk operational procedures.

# Inputs required

Before producing a study plan, collect or infer:

- **Target context:** molecule or molecular class, biological relevance, and why selective recognition matters.
- **Desired modality/function:** detection, functional buffering, trait modulation, catalytic probing, delivery, neutralization, or mechanistic intervention.
- **Discovery source constraints:** available repertoire or design space (immune, synthetic, computational), known nonspecific recognition risks, and whether enriched versus non-enriched strategies can be compared.
- **Artifact risks:** carrier, scaffold, label, tag-loss, folding, or display-specific confounders relevant to the screening format.
- **Validation context:** model system, intended localization concept, and phenotype or functional endpoint to be measured.
- **Evidence available:** prior binders, known analogs, preliminary data, and sequence or structural information.
- **Safety and governance context:** biosafety, environmental containment, regulatory, and dual-use considerations.

If critical inputs are missing, state assumptions explicitly and label the output as a preliminary research design.

# Core Workflow

Follow this ordered end-to-end route. At each decision gate, stop and redesign if the criterion is not met.

## 1. Target and modality framing
- Define the molecular feature the binder must recognize and the post-binding behavior the modality requires.
- Separate the recognition target from carrier, scaffold, label, or assay presentation artifacts.
- **Decision gate:** If the intended target cannot be clearly distinguished from presentation artifacts, stop and refine target presentation or assay geometry before proceeding.

## 2. Discovery source and genotype-phenotype linkage
- Justify the repertoire or design space and ensure each candidate is traceable to a sequence, construct, or design state.
- Plan for diversity representation that covers plausible binding solutions without assuming universal best formats.
- **Decision gate:** If genotype-phenotype linkage is unclear or diversity is untraceable, redesign the library or candidate generation step.

## 3. Artifact-aware screening and normalized enrichment
- Measure target function and candidate abundance or display integrity with orthogonal readouts.
- Rank candidates by normalized target function per displayed or present molecule, not by raw signal alone.
- Monitor for abundance-driven, folding-driven, tag-loss, or population-heterogeneity artifacts.
- **Decision gate:** If target function cannot be separated from candidate abundance or display artifacts, revise readouts, normalization logic, or selection pressure before advancing candidates.

## 4. Specificity-first candidate classification
- Compare candidates against irrelevant targets, carrier-only controls, scaffold-only controls, and related molecules.
- Classify candidates into affinity-like, epitope-altered, expression-density, population-state, or artifact-driven groups.
- Prioritize independent, specific binders with reproducible target signal and low background.
- **Decision gate:** If candidates are predominantly carrier-specific, nonspecific, or non-reproducible, return to selection pressure redesign or counterselection logic.

## 5. Functional phenotype and target-dependence validation
- Test the modality-relevant downstream behavior (e.g., catalytic activity, internalization, signal modulation, component neutralization).
- Include target-negative, target-perturbed, and format-matched controls to validate target dependence.
- Use orthogonal binding or biophysical readouts where appropriate.
- **Decision gate:** If the functional phenotype appears independent of the intended target or is indistinguishable from controls, reject the candidate or reassess the phenotype assay before mechanistic interpretation.

## 6. Mechanism discrimination and component-gap filling
- If the existing binder or intervention leaves residual activity, map uncovered components using sequence, structural, or mechanistic divergence.
- Design or source a complementary binder for the gap; test whether it adds non-redundant benefit in combination.
- Require component-level and whole-system evidence, not binding alone.
- **Decision gate:** If the new candidate is redundant with existing coverage or fails to improve whole-system outcomes, stop gap-filling and search for additional uncovered components or alternative mechanisms.

## 7. Sequence-structure interpretation and iterative update
- Analyze sequence diversity, family convergence, and structural plausibility of top candidates.
- Identify the weakest evidence link in the causal chain (recognition, specificity, function, native-context relevance, or combination benefit).
- **Iteration rule:** Change one major design assumption at a time and preserve negative results as constraints.
- **Stop conditions:** Stop when target-specific signal is not reproducible after reasonable iteration; enrichment cannot be separated from nonspecific background; native-context recognition fails without plausible boundary explanation; diversity collapses; safety or compliance requirements are unsatisfied; or no discriminating test remains to distinguish mechanism from confounding.

# Output Format

When using this skill, produce:

1. **Research question** — One concise question the study should answer.
2. **Hypothesis table** — Recognition, discovery-bottleneck, specificity, functional-phenotype, alternative-mechanism, and component-gap hypotheses. For each: evidence strength, key assumptions, likely failure mode, and minimal validation evidence.
3. **High-level experimental design** — Minimal viable validation; independent, dependent, and blocking variables; negative, positive, mock, genetic, mechanism, and specificity controls; primary and secondary metrics; stop or pivot conditions.
4. **Analysis plan** — Causal-chain evidence map; rules for classifying affinity-like, epitope-altered, expression-density, and artifact candidates; statistical and visualization approach at a conceptual level; decision rules for upgrading or downgrading hypotheses.
5. **Iteration plan** — Weakest causal link; next minimal experiment concept; expected result patterns and interpretation; conditions for strengthening, weakening, or redirecting the hypothesis.
6. **Validity and safety summary** — Main confounders; reproducibility checks; extrapolation boundaries; safety, ethics, containment, and governance considerations.

# Validation Gates

Before advancing candidates or finalizing a plan, confirm:

- **Target-definition validity:** The intended recognition target is clearly separated from carrier, scaffold, label, or assay artifacts.
- **Function-abundance separation:** Target function is distinguishable from candidate abundance or display level.
- **Specificity validity:** Candidates are evaluated against irrelevant targets, related analogs, and carrier controls.
- **Target-dependence validity:** The functional phenotype is reduced or altered in target-negative or target-perturbed contexts.
- **Control adequacy:** Negative, positive, mock, genetic, mechanism, and format controls are sufficient for the claims.
- **Reproducibility:** Key results are repeated independently across batches or preparations.
- **Mechanistic validity:** A plausible chain links binder recognition to the observed functional phenotype.
- **Boundary validity:** Claims are limited to the tested organism, target class, assay context, and evidence level.

# Claim Boundaries

- Distinguish **recombinant-target** recognition from **native-context** relevance; do not overstate native-context claims unless explicitly tested.
- Distinguish **computational predictions** (motif, structure, epitope) from **empirical observations**; treat predictions as hypotheses.
- Distinguish **exploratory screening** from **validated mechanism**; label single-study or single-cohort findings as hypotheses requiring replication.
- Do not generalize from one scaffold, target, or host system to all binder discovery programs.
- Do not present preclinical binder discovery as clinically actionable without appropriate validation and regulatory context.

# Failure Modes

- **Artifact-dominated enrichment:** Selection rewards abundance, tag loss, or display stability rather than target recognition.
- **Carrier-scaffold confounding:** Binders recognize the presentation system instead of the intended target.
- **Specificity without function:** Candidates bind specifically but lack the downstream phenotype required by the modality.
- **Phenotype without target dependence:** Functional signal persists in target-negative contexts, indicating off-target or nonspecific effects.
- **Component redundancy:** A gap-filling binder overlaps with existing coverage and adds no whole-system benefit.
- **Clonal collapse:** Diversity collapses to a single family, preventing meaningful comparison and increasing amplification-bias risk.
- **Native-context mismatch:** Recombinant-target binders fail to recognize the target in its biological setting.
- **Uncontrolled confounding:** Residual phenotype is explained by stress, transformation, metabolism, transport, or assay interference rather than binder activity.

# Validity Checks

- **Confounder checks:** Could trace contaminants, batch effects, preparation differences, or matrix effects explain the result?
- **Normalization validity:** Is the chosen normalization appropriate for the assay context and candidate system?
- **Background behavior:** Does the non-binding or carrier-only control define nonspecific signal?
- **Assay independence:** Do different readouts test different aspects of binding rather than the same artifact?
- **Distribution awareness:** Could subpopulations or display heterogeneity explain mean-based rankings?
- **Genotype-phenotype linkage:** Is each candidate traceable to a design state before mechanistic interpretation?
- **Statistical validity:** Are endpoints, effect sizes, uncertainty, and appropriate comparisons specified before analysis?
- **Negative-result validity:** Are inconclusive or failed experiments used to update hypotheses rather than hidden?
- **Extrapolation validity:** Are model-system results not overclaimed as organism-wide, crop-ready, or clinically validated outcomes?

# Provenance

Synthesized from cluster 65, subcluster 65.0.split0. Derived from source skills: 661318846f493d0a, 50cb4e57df839bf4, 120eccc4bc9aee63, 9d4eb7863ab8080d, 290e8904a506c2df, bf8667f6cfd88390, 167cd948db91c2db, 701e57be5f607970. Paper-specific targets, clones, assay conditions, numerical thresholds, and conclusions have been removed to produce a reusable workflow archetype.
