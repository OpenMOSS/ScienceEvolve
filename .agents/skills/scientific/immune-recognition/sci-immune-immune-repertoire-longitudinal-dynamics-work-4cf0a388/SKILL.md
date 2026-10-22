---
name: sci-immune-immune-repertoire-longitudinal-dynamics-work-4cf0a388
description: A reusable end-to-end workflow for designing studies that track immune repertoire clonal signatures over time to discriminate maintenance, emergence, selection, and host-pathogen coevolution mechanisms.
scienceevolve-title: "Antibody and immune recognition · immune repertoire longitudinal dynamics workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Use this skill to design reusable, non-clinical research workflows for studying how immune repertoires change over time. It guides hypothesis generation, longitudinal or comparative study design, repertoire analysis, mechanism discrimination, and iterative model updating for clonal dynamics, selection inference, and host-pathogen coevolution without copying paper-specific protocols.

# When to use

Use this skill when all of the following apply:

- The task concerns non-clinical immunology or immune-cell population dynamics studied longitudinally or comparatively.
- The central uncertainty involves whether a dominant or restricted response is maintained, newly generated, environmentally regulated, or selection-shaped.
- The user wants to generate new research questions and design minimal but strong experiments rather than summarize existing conclusions.
- The proposed work is at the study-design and analysis-planning level, not clinical advice or operational wet-lab execution.

Do not use this skill for clinical decision-making, therapeutic recommendations, patient-specific interpretation, or direct execution of animal, human, or pathogen studies.

# Inputs required

Before designing a study, request or identify:

- **Biological system:** species, tissue or compartment, and relevant timepoints, developmental stages, or exposure windows.
- **Repertoire readout:** receptor chain, data type (DNA-derived or RNA-derived), sequencing platform, and whether single-cell or paired-chain information is available.
- **Candidate signatures:** dominant clones, lineages, segment usage patterns, CDR3 features, mutation profiles, or states of interest.
- **Comparators:** baseline, healthy, disease-related, unrelated-target, or cross-context groups needed for specificity.
- **Metadata and constraints:** batch structure, host factors, sequencing depth, reference annotation completeness, and ethical or biosafety boundaries.
- **Research goal:** whether the aim is descriptive profiling, mechanism testing, comparative biology, or candidate prioritization.

If critical inputs are missing, state assumptions explicitly and mark conclusions as assumption-sensitive.

# Core Workflow

Follow this ordered route from question framing to iteration. Apply decision gates at each stage; stop or redesign when a gate fails.

## 1. Frame the mechanistic question
- Define the repertoire feature under study (e.g., clonality, diversity, segment usage, CDR3 properties, mutation patterns).
- Define the temporal or comparative axis (time, exposure, disease stage, perturbation, or host background).
- Identify the precise gap: maintenance versus turnover, selection versus recombination bias, source versus environment, enrichment versus pathogenicity.
- **Decision gate:** If the question cannot be expressed as a testable contrast between competing mechanisms, refine the scope or stop.

## 2. Generate competing hypotheses
- Formulate mechanistic hypotheses (e.g., mature-state maintenance, precursor-driven emergence, environment-dependent dominance, selection-shaped restriction, technical artifact).
- For each hypothesis, specify the predicted longitudinal or comparative pattern, evidence strength, key assumptions, and most likely failure modes.
- **Decision gate:** If hypotheses are not mutually exclusive or cannot be discriminated by available readouts, redesign the comparator groups or stop.

## 3. Design the longitudinal or comparative study
- Specify independent variables (timepoints, compartments, perturbations, host backgrounds) and dependent variables (clone frequency, composition, diversity indices, segment usage, mutation load).
- Layer validation from simplified readout to real-background readout; define negative, positive, orthogonal, unrelated-target, and source-attribution controls.
- Predefine support, ambiguous, refute, and stop/redesign criteria before data collection.
- **Stop condition:** If source attribution is impossible or control groups cannot be adequately matched, stop and redesign.

## 4. Profile and quality-control
- Verify sequencing depth, reference annotation completeness, alignment quality, batch distribution, and sample independence.
- Separate functional, unproductive, and pseudogene sequences; flag DNA-derived versus RNA-derived data and avoid comparing them without adjustment.
- **Decision gate:** If coverage is insufficient for intended diversity or clonality metrics, or if batch confounding aligns with biological groups, stop and resolve technical issues before biological interpretation.

## 5. Analyze repertoire composition and dynamics
- Quantify response magnitude and composition separately; track clone frequencies over time to classify expanding, contracting, stable, or emergent clones.
- Compare early versus late states and test robustness to alternative filtering, normalization, and reference versions.
- Use uncertainty estimates and model-based summaries appropriate for sparse, skewed composition data.
- **Decision gate:** If patterns are sensitive to a single analysis choice, treat them as exploratory and require pre-specified robust criteria before stronger interpretation.

## 6. Discriminate mechanisms
- Compare target against baseline and appropriate comparators (healthy, disease, unrelated-target).
- Test source attribution and evaluate specificity; require orthogonal readouts (e.g., paired-chain, functional assay, structural feature) before inferring selection.
- Exclude non-selection explanations (global dysfunction, technical artifact, confounding) before promoting causal candidates.
- **Candidate gate:** Promote only clones or features that pass both attribution and specificity checks.

## 7. Validate and bound claims
- Require convergence across primary, mechanism, specificity, and reproducibility endpoints.
- Classify evidence as descriptive, correlative, causal candidate, mechanism-supported, or robust.
- Bound claims to tested compartments, time scales, and host backgrounds.
- **Robustness gate:** Downgrade evidence strength if patterns do not hold across independent batches, sample splits, or platforms.

## 8. Iterate or redesign
- **If supported:** generalize to additional tissues, timepoints, host contexts, or perturbations.
- **If ambiguous:** diagnose the bottleneck (timing, compartment, detection limit, sampling depth) and run the next minimal discriminating test.
- **If refuted:** revise the hypothesis (e.g., shift from clonal to segment-level, from circulating to tissue-resident) and test an alternative mechanism.
- **If controls fail:** halt biological interpretation and resolve measurement issues before proceeding.
- **Iteration gate:** Define the single next experiment that best distinguishes the leading hypotheses before expanding scope.

# Output Format

When using this skill, produce:

1. **Research question framing** — biological system, repertoire feature, temporal or comparative axis, and mechanistic gap.
2. **Hypothesis table** — for each hypothesis: statement, predicted pattern, evidence strength, key assumptions, failure modes, and boundary conditions.
3. **Study design blueprint** — groups, variables, layered validation, controls, endpoints, and stop/redesign conditions.
4. **Analysis plan** — QC steps, composition and dynamics metrics, mechanism discrimination logic, uncertainty handling, and sensitivity analyses.
5. **Iteration roadmap** — actions for supported, ambiguous, refuted, or failed-control outcomes; next minimal test; stop rules.
6. **Validity and ethics statement** — confounders, reproducibility checks, boundary conditions, and non-clinical scope limits.

# Validation Gates

- **QC Gate:** Data quality, coverage, and annotation sufficiency are verified before analysis.
- **Attribution Gate:** Source populations or clones can be distinguished from environmental or background contributions.
- **Specificity Gate:** Unrelated-target and negative controls behave as expected; orthogonal readouts distinguish specific change from global dysfunction.
- **Robustness Gate:** Patterns replicate across batches, sample splits, or alternative reference annotations.
- **Mechanism Gate:** Primary, mechanism, and specificity endpoints converge before causal or selection claims are advanced.
- **Ethics Gate:** The study remains at a non-clinical design level and notes required compliance reviews.

# Claim Boundaries

- Distinguish observed repertoire patterns from inferred selection histories and from causal or antigen-specific validation.
- Do not extrapolate from single timepoints, single compartments, or single cohorts to universal mechanisms.
- Do not infer clinical relevance, therapeutic utility, or pathogenicity without independent translational validation and appropriate specificity controls.
- Label source-supported observations separately from agent-generated inferences.

# Failure Modes

- **Technical artifact:** Batch effects, primer or library bias, uneven sequencing depth, reference incompleteness, or DNA/RNA mismatch masquerading as biological change.
- **Attribution error:** Confounding source population with environment, global dysfunction, or unmeasured regulatory factors.
- **Overinterpretation:** Inferring selection, pathogenicity, or causality from enrichment or correlation alone.
- **Sampling failure:** Insufficient depth, narrow strain or clone panels, or limited time resolution misses minority responses or delayed emergence.
- **Boundary violation:** Generalizing beyond tested species, tissue, time scale, perturbation, or data type.
- **Measurement bias:** Pooled measurements mask minority clones; cross-reactivity misinterpreted as structural identity.

# Validity Checks

- **Confounding:** Are groups matched for tissue, batch, platform, host background, exposure history, and developmental stage?
- **Reproducibility:** Are biological and technical replicates independent? Are decision rules and stopping criteria pre-specified?
- **Statistical validity:** Are effect sizes, uncertainty estimates, and multiplicity correction reported? Are models appropriate for sparse, skewed, or bounded composition data?
- **Specificity:** Does the pattern survive unrelated-target challenges and orthogonal readout scrutiny?
- **Boundary conditions:** Is the observation window long enough to detect delayed emergence? Are claims limited to the validated model system?

# Provenance

- Synthesized from cluster **61** / subcluster **61.1.split0**.
- Derived from source skills: `b-cell-clonal-dominance-exploration` (da92df1ee71b25f3), `repertoire-recombination-research-design` (ae5e9443d1cc58f5), `immune-repertoire-selection-inference` (ddea310e622b5de0), `idiotype-response-exploration` (a3a5eaefad68beb3), `tcr-spectratype-autoimmunity-research` (4c5480305f28f323), `layered-candidate-validation-workflow` (98568c7f7750d670), `avian-pathogen-immunoproteomics` (c9d60fb6795a6093), `infection-autoimmunity-mechanistic-serology` (8840a22c8e5d9a26).
- Workflow archetype: end-to-end mechanism discovery and validation.
