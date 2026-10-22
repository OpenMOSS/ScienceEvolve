---
name: sci-immune-immune-signature-biomarker-discovery-workflo-6c1525cc
description: End-to-end discovery and validation of disease-associated immune signatures from patient-derived repertoires or multiplex screens, emphasizing counterselection, native-antigen mapping, and diagnostic benchmarking against specificity panels.
scienceevolve-title: "Antibody and immune recognition · immune signature biomarker discovery workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Guide agents in designing reusable, non-clinical research workflows for discovering and validating disease-associated immune signatures—such as antigens, autoantibody patterns, or repertoire-derived markers—from patient-derived antibody repertoires or multiplex screens. The core pattern is phenotype-first framing, unbiased discovery with counterselection, specificity filtering, native-antigen or orthogonal feature mapping, and incremental diagnostic benchmarking against specificity panels.

# When to use

Use this skill when a user asks to:
- Generate research questions in immune-signature biomarker discovery, serology, or multiplex disease-discrimination.
- Design an end-to-end discovery-to-validation workflow based on patient-derived antibodies, immune repertoires, or multiplex antigen screens.
- Convert a weakly characterized disease-associated binding signal into a structured hypothesis with controls, metrics, and iteration rules.
- Evaluate whether a candidate peptide, protein, immune-reactivity pattern, or multiplex panel is plausible enough for further non-clinical research.

Do not use this skill for patient-specific clinical advice, treatment selection, diagnostic interpretation, regulatory submission, or direct execution of wet-lab protocols.

# Inputs required

Before designing a workflow, collect or request:
- Disease context, target phenotype, and biological rationale for expecting an immune-accessible molecular signal.
- Case and comparator definitions, including relevant clinical, demographic, treatment, comorbidity, and sample-quality metadata.
- Available sample types described at a conceptual level (e.g., serum, plasma, tissue lysate, purified immunoglobulin fractions).
- Discovery platform type at a conceptual level (e.g., phage display, peptide library, multiplex antigen array, repertoire sequencing).
- Prior candidate antigens, pathways, or immune-response signatures from literature, if any.
- Existing assay outputs such as binder sequences, binding readouts, enrichment data, or clinical annotations.
- Ethical, privacy, biosafety, and data-governance constraints for human biospecimens and clinical metadata.

# Core Workflow

Execute the following ordered stages. At each decision gate, pass only if predefined criteria are met; otherwise, iterate or stop.

## Stage 1: Phenotype-first framing and gap definition
- Define the disease state, progression phenotype, or biological process to be distinguished.
- Identify the diagnostic or mechanistic gap: why existing baselines are insufficient.
- State why patient-derived immune repertoires or multiplex screens should contain unbiased information about that phenotype.
- **Decision Gate 1 (DG1):** Is the phenotype independently defined and the gap clearly articulated? If no, stop and refine the question.

## Stage 2: Discovery with counterselection
- Use case-derived antibody repertoires or multiplex screens as unbiased selection inputs.
- Include comparator-derived repertoires or screens for counterselection to remove broadly reactive or nonspecific signals.
- Track enrichment, recurrence, and convergence of selected binders or reactive features.
- **Decision Gate 2 (DG2):** Do selected features show enrichment beyond matched comparators with acceptable reproducibility? If no, stop or redesign the comparator matching and selection logic.

## Stage 3: Candidate refinement and specificity filtering
- Reduce broad discovery outputs to a compact, interpretable candidate set using training data only.
- Test candidate features against strong specificity controls: matched healthy or non-disease comparators, related disease or inflammatory states, and irrelevant or mock-selection controls.
- Apply competition or blocking logic where conceptually appropriate to challenge specificity.
- **Decision Gate 3 (DG3):** Do candidates retain signal after specificity filtering and cross-reactivity testing? If no, iterate candidate selection or revise the hypothesis toward inflammation, tissue stress, or assay artifact.

## Stage 4: Native-antigen or orthogonal feature mapping
- Connect selected binders or signature features to candidate native proteins, molecular structures, or disease-associated pathways using orthogonal evidence.
- Require convergence across at least two independent evidence types before treating an antigen assignment or mechanistic link as credible.
- **Decision Gate 4 (DG4):** Is the native-antigen or pathway mapping supported by orthogonal evidence? If no, retain candidates as serological marker leads only if validation remains strong; otherwise, deprioritize.

## Stage 5: Independent validation and diagnostic benchmarking
- Lock the candidate panel, preprocessing, and decision rule before testing independent samples.
- Evaluate discrimination, calibration, and incremental value over the best available baseline measured in the same validation samples.
- Benchmark against specificity panels that include related diseases, inflammatory states, treatment contexts, and collection-site variations.
- **Decision Gate 5 (DG5):** Does the locked signature reproducibly distinguish cases from comparators in independent data with uncertainty estimates? If no, stop and investigate overfitting, leakage, batch effects, or cohort shift.

## Stage 6: Mechanistic triangulation and boundary testing
- Link selected features to orthogonal biological evidence without equating prediction with causality.
- Test boundary conditions: disease stage, treatment context, specimen provenance, and external populations.
- **Decision Gate 6 (DG6):** Are mechanistic inferences bounded by the validated context and distinguished from predictive utility? If no, narrow the claim scope.

## Stage 7: Iteration or termination
- If all gates pass, prioritize independent replication, mechanistic perturbation, and broader comparator testing. Reframe the candidate as a research biomarker or target-discovery lead, not as a clinical tool.
- If any gate fails, apply the iteration rules:
  - **Weak enrichment:** Re-examine comparator matching, sample quality, and phenotype heterogeneity.
  - **Failed specificity:** Add stronger negative controls and disease comparators; revise hypothesis.
  - **Failed mapping:** Search for conformational mimicry, post-translational modification, or multi-protein complex explanations.
  - **Weak clinical association:** Reassess confounding, cohort composition, and endpoint definition.
  - **Validation failure:** Stop applied interpretation and redesign the study.

# Output Format

When using this skill, produce:
1. **Research scope:** disease context, phenotype, discovery objective, and explicit out-of-scope claims.
2. **Evidence map:** known evidence, method logic, and user-provided data with clear provenance separation.
3. **Hypothesis table:** at least three candidate hypotheses with evidence strength, key assumptions, predicted observations, likely failure modes, and boundary claims.
4. **Experimental design:** discovery strategy, counterselection plan, controls (negative, positive, strong), validation stages, and stopping conditions.
5. **Analysis plan:** endpoints, stratification variables, statistical checks, specificity testing, and visualization plan.
6. **Iteration rules:** how the hypothesis changes under weak enrichment, failed specificity, failed mapping, or weak clinical association.
7. **Validity and safety checks:** confounders, reproducibility, boundary conditions, ethics, and limits on clinical interpretation.
8. **Decision summary:** whether to proceed, redesign, deprioritize, or seek additional data.

# Validation Gates

- **Enrichment gate:** Selected features must show recurrent enrichment in case-derived inputs over matched comparators.
- **Specificity gate:** Candidate signal must survive challenge by related disease, inflammatory, and irrelevant controls.
- **Reproducibility gate:** Signal must be detectable across independent samples, batches, or cohorts with predefined metrics.
- **Mapping gate:** Native-antigen or pathway links require orthogonal evidence convergence; single-source assignments are provisional.
- **Benchmarking gate:** Locked signature must demonstrate incremental value over the baseline comparator in independent validation data.
- **Boundary gate:** Claims must be scoped to the tested disease context, phenotype, sample type, and biological mechanism.

# Claim Boundaries

- Distinguish discovery-stage signals from validated biomarkers.
- Distinguish research biomarkers or target-discovery leads from clinical diagnostic or prognostic tools.
- Distinguish associative evidence from mechanistic causation.
- Distinguish what is directly supported by data from what is inferred by analogy or extrapolation.
- Do not treat single-study findings as field-wide consensus.

# Failure Modes

- **Nonspecific enrichment:** Signal driven by batch effects, unmatched comparators, or general immune activation rather than disease biology.
- **Cross-reactivity:** Candidates react with related diseases, inflammatory states, or assay reagents.
- **Overfitting:** Signature performance collapses in independent validation due to leakage or data-driven optimization.
- **Mapping failure:** Selected binders cannot be credibly linked to native antigens or pathways.
- **Confounding:** Clinical association is explained by age, sex, treatment, comorbidity, or sample handling rather than the immune signature.
- **Cohort shift:** Signal is specific to one site, batch, or demographic group and does not generalize.

# Validity Checks

- **Confounding:** Evaluate age, sex, ancestry, inflammation, infection history, treatment exposure, comorbidities, tissue source, sample handling, batch, and site effects.
- **Comparator adequacy:** Controls must distinguish disease biology from general immune activation or technical background.
- **Leakage prevention:** Discovery, training, and validation data must be separated; feature selection and thresholds must not use validation outcomes.
- **Reproducibility:** Require recurrent features, independent cohorts, blinded analysis, and technical replication.
- **Specificity:** Challenge with competition, unrelated controls, mock-selection outputs, and disease comparators.
- **Statistical validity:** Use pre-specified thresholds, uncertainty estimates, multiple-testing control, and sensitivity analyses.
- **Boundary conditions:** Define the disease context, phenotype, sample type, and mechanism for which the hypothesis is plausible.
- **Evidence separation:** Clearly label direct data support, mechanistic inference, and untested speculation.

# Provenance

Synthesized from cluster 68, subcluster 68.1.split0. Derived from source skills: cancer-serology-mimotope-discovery (13901f8901dcb269), autoantibody-signature-biomarker-discovery (113609db800cc30d), recombinant-antigen-serodiagnostic-discovery (1a53b7ed7063f468), pathogen-specific-serology-workflow (e28b547699819f3b), autoimmune-idiotype-research-explorer (d11d2723867c3d0b), immune-receptor-disorder-survival-exploration (7c90291929713bcd), immune-effector-target-bridging-research (b337d9abee75451e), immune-repertoire-maturation-research (8d4e3aae95ffa17b).
