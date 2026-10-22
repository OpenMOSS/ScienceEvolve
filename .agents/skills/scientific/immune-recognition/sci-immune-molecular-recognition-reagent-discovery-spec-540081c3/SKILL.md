---
name: sci-immune-molecular-recognition-reagent-discovery-spec-540081c3
description: End-to-end design, discovery, and staged specificity validation of protein-targeting molecular recognition reagents across recombinant, cellular, and native biological contexts.
scienceevolve-title: "Antibody and immune recognition · molecular recognition reagent discovery specificity validation"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Use this skill to guide the structured discovery and staged validation of molecular recognition reagents against protein targets. It helps an agent frame the research question, select or design candidate binders, validate specificity through increasingly native biological contexts, and decide when a reagent is sufficiently characterized for downstream biological claims.

# When to use

Use this skill when the task involves:

- Designing or critiquing discovery workflows for antibodies, nanobodies, engineered binders, or other protein-targeting recognition reagents.
- Planning specificity validation across homologous proteins, isoforms, or complex sample backgrounds.
- Deconvolving unknown targets from sample-driven binder selections.
- Mapping epitopes, regions, or conformational dependencies of recognition.
- Assessing whether a candidate reagent is fit for assay translation, mechanistic studies, or further engineering.

Do not use this skill for clinical recommendations, operational wet-lab protocols, manufacturing release decisions, or as a substitute for biosafety and ethics review.

# Inputs required

- Target identity and biological context (e.g., domain, conformational state, accessibility).
- Intended application and required specificity boundaries (e.g., homolog family, isoform, sample type).
- Candidate source or design strategy (e.g., repertoire, rational library, display selection).
- Known confounders: close homologs, isoforms, modification states, or abundant background proteins.
- Available assay contexts and orthogonal validation assets.
- Safety, ethics, and compliance constraints.

# Core Workflow

This is an ordered, gated route. At each stage, apply predefined pass, fail, or redesign criteria before advancing.

1. **Gap Definition & Target Decomposition**
   - Frame the bottleneck as an interpretability or specificity problem.
   - Identify the intended target feature and the most plausible confounders (homologs, isoforms, states).
   - Define the minimal discriminating feature(s) and the biological context required for the final claim.

2. **Candidate Generation or Selection**
   - Choose a discovery modality (repertoire mining, rational library, display selection, or hybrid).
   - Encode mechanistic priors (target interface geometry, sequence divergence, conformational constraints).
   - Ensure candidates are traceable to design metadata or source lineage.

3. **Primary Specificity Screen (Simplified Context)**
   - Test candidate reagents against the intended target versus homologous decoys and unrelated negatives.
   - Apply pass criteria: intended-target recognition must exceed all decoy and background controls.
   - **Decision Gate 1:** If specificity fails, return to Stage 2 to redesign around more divergent features or alternative scaffolds. If ambiguous, add orthogonal readouts before proceeding.

4. **Target Deconvolution & Region Mapping**
   - For unknown targets or unmapped epitopes, plan capture-based identification or competition mapping.
   - Use independent confirmation to converge on target identity or recognized region.
   - **Decision Gate 2:** If target identity remains ambiguous or conflicts with binding patterns, stop or add controls. If resolved, proceed.

5. **Context Escalation (Native Biological Context)**
   - Validate recognition in cellular, tissue, or complex-sample contexts relevant to the final claim.
   - Compare performance against recombinant or simplified results; treat discordance as mechanistic evidence (accessibility, modification, complex formation).
   - Include biological negative samples where the target is absent or reduced.
   - **Decision Gate 3:** If native-context recognition fails while simplified-context succeeds, generate hypotheses about epitope accessibility or background, then iterate or restrict claims. If consistent, proceed.

6. **Orthogonal Cross-Validation**
   - Triangulate across at least two independent assay modalities or reagent formats.
   - Use reciprocal comparisons, independent tools, or enrichment logic to separate target biology from reagent artifacts.
   - **Decision Gate 4:** If assays disagree, classify discrepancies (off-target, sensitivity, conformational dependence, assay artifact) and iterate. If convergent, proceed.

7. **Functional or Mechanistic Linkage (if applicable)**
   - Determine whether recognition correlates with the intended functional outcome (e.g., blocking, effector recruitment, detection utility).
   - Separate binding from function; test whether an effector context or specific epitope class is required.
   - **Decision Gate 5:** If function is absent despite binding, revise the mechanism hypothesis or restrict claims to recognition only. If present and specific, advance.

8. **Readiness Assessment & Iteration**
   - Assign evidence strength: Weak (single assay, no decoy), Moderate (decoys plus unrelated negative), Strong (homologous decoys, biological negatives, orthogonal assays), or Application-ready (reproducible in intended context).
   - Document boundary conditions (species, tissue, preparation, assay modality).
   - **Stop/Iterate:** Stop if the reagent fails at any gate and redesign is infeasible. Iterate if partial success suggests a resolvable issue (e.g., format conversion, epitope refinement, enrichment).

# Output Format

Return:

1. **Research question** — concise, specificity-centered question.
2. **Hypothesis set** — primary, mechanistic, context, and failure hypotheses with evidence strength and assumptions.
3. **Experimental design** — variables, challenge set, controls, readouts, and decision rules.
4. **Analysis plan** — specificity matrix, cross-assay integration, discrepancy categories, and uncertainty handling.
5. **Iteration plan** — how each outcome (pass, fail, discordant) updates the hypothesis or triggers redesign.
6. **Validity and ethics statement** — confounders, reproducibility checks, boundary conditions, and non-clinical scope.

# Validation Gates

- **Gate 1 (Specificity):** Intended-target signal exceeds close-homolog and unrelated controls in simplified context.
- **Gate 2 (Identity/Region):** Target or recognized region is convergently supported by independent evidence.
- **Gate 3 (Context Robustness):** Recognition persists in the native biological context required for the claim.
- **Gate 4 (Orthogonality):** Results are consistent across independent assay modalities or reagent formats.
- **Gate 5 (Function Linkage):** Binding correlates with the intended functional outcome under controlled conditions.

# Claim Boundaries

- Limit specificity claims to the target forms, homologs, and contexts actually tested.
- Do not infer clinical significance, therapeutic utility, or diagnostic performance from reagent validation alone.
- Distinguish source-validated method logic from agent-generated inferences and speculative extrapolations.
- Treat single-paper observations as methodological templates, not field consensus.

# Failure Modes

- **Off-target homology:** Reagent recognizes close homologs or shared epitopes; redesign around divergent features.
- **Context-dependent masking:** Epitope is accessible only in recombinant systems; restrict claims or test alternative preparations.
- **Assay artifact:** Signal driven by aggregation, avidity, detection background, or matrix binding; resolved by orthogonal controls.
- **Enrichment bias:** Mixed populations hide off-target binding; resolved by clonal isolation or purification.
- **Format incompatibility:** Binding lost upon conversion to downstream modality; assess early with format-matched controls.
- **Functional disconnect:** Binding does not produce the intended biological outcome; restrict to recognition claims.

# Validity Checks

- Are the most plausible confounders included in the challenge set?
- Are homologous decoys and biological negative contexts tested when relevant?
- Are positive, negative, and specificity controls matched to the recognition mechanism?
- Are conclusions proportional to evidence strength and limited to validated contexts?
- Are ambiguous or discordant results preserved and interpreted as mechanistic clues?
- Are statistical, reproducibility, and batch-variability considerations explicit?
- Are paper-specific observations separated from new inferences?

# Provenance

- Synthesized from cluster 48 / subcluster 48.0.split0.
- Source skills: proteasome-reagent-validation (cf9fb54ab06dbb16), cross-species-antibody-humanization-exploration (9cc89e16c502e894), sample-driven-binder-discovery (8b966f4f0e95bff1), homologous-protein-reagent-validation (e0f87552a876b2bd), malaria-tb-antigen-epitope-workflow (655204131ead6269), recombinant-antibody-expression-screening (7858daca6fc341b1), rational-antibody-library-discovery (ca46fc50eac25258), human-igm-infected-cell-exploration (accf8e244575a937).
