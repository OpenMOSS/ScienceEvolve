---
name: sci-immune-antibody-repertoire-sequence-to-function-mec-cbbdc095
description: A reusable end-to-end workflow for linking immunoglobulin sequence variation, gene usage, selection patterns, and repertoire restriction to binding specificity or protective function through hypothesis-driven, layered validation and iterative mechanism discrimination.
scienceevolve-title: "Antibody and immune recognition · antibody repertoire sequence to function mechanism workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

This skill helps an agent design transferable research programs that connect antibody repertoire sequence features—such as gene usage, somatic mutation, selection signatures, and clonal subpopulations—to mechanistic binding specificity or protective function. It provides a structured, non-operational route for hypothesis generation, repertoire analysis, candidate discrimination, and orthogonal validation without relying on source-paper conclusions, fixed protocols, or clinical recommendations.

# When to use

Use this skill when the user asks to:

- Design a study linking immunoglobulin sequence variation, repertoire composition, or selection patterns to antigen binding or functional outcome.
- Generate hypotheses about protective versus non-protective antibody specificities, cross-reactivity breadth, or epitope class.
- Plan a conceptual validation strategy that separates binding affinity from functional mechanism.
- Compare alternative mechanistic explanations for observed repertoire restriction or dominant clonotype behavior.
- Evaluate whether sequence-based selection inference supports a proposed biological mechanism.
- Translate sequence-to-function reasoning from one antigen, pathogen, or model system to a new context.

Do not use this skill to provide clinical advice, treatment recommendations, patient-specific risk assessment, diagnostic interpretation, or executable wet-lab protocols.

# Inputs required

Before producing a research plan, ask for or identify:

- **Target system**: pathogen, antigen, antigen domain, or immune complex of interest.
- **Biological question**: cross-reactivity, neutralization mechanism, epitope class, selection pressure, repertoire diversity, hidden subpopulations, or surrogate-binder topology.
- **Sequence evidence**: repertoire source, germline assignment strategy, annotation scheme, quality-control status, and variant classification rules.
- **Functional context**: intended protective or mechanistic function, available binding readouts, and functional or mechanistically proximal assays.
- **Comparators**: related antigens, strains, variants, or unrelated controls for specificity testing.
- **Constraints**: biosafety level, ethical approvals, data governance, sample provenance, and whether work is computational, in vitro, or translational.

If key inputs are missing, state assumptions explicitly and propose the smallest set of clarifying questions needed to avoid overfitting the design to source examples.

# Core Workflow

Follow this ordered end-to-end route. Treat each decision gate as a hard pause; do not advance if the gate fails.

1. **Frame the research question and functional gap**
   - Define the protective or mechanistic function of interest.
   - Identify the specific evidence gap linking sequence features to that function.
   - *Decision gate*: If the functional outcome is undefined, clinically operational, or requires unsupported extrapolation, stop and reframe.

2. **Generate tiered sequence-to-function hypotheses**
   - Propose falsifiable hypotheses connecting sequence variation, gene usage, selection patterns, or repertoire restriction to binding specificity or functional outcome.
   - For each hypothesis, assign evidence strength (strong / moderate / weak / speculative), key assumptions, predicted observations, and likely failure modes.
   - Label claims as **source-paper-supported**, **analogy-based inference**, or **new proposal requiring validation**.

3. **Validate inputs and constraints**
   - Confirm availability of repertoire data, annotation schemes, functional readouts, and appropriate controls.
   - Verify ethical, biosafety, and data-governance constraints.
   - *Stop condition*: If critical inputs are missing and cannot be reasonably assumed, pause for clarification.

4. **Curate and quality-control sequence evidence**
   - Assess sequence provenance, annotation quality, germline assignment, region boundaries, and sampling depth.
   - Evaluate technical artifact burden; distinguish reproducible variants from singleton observations.
   - *Gate*: If annotation uncertainty, germline ambiguity, or artifact rates undermine inference, halt until resolved.

5. **Analyze variation, selection, and repertoire structure**
   - Classify mutations and variants by functional region using codon-aware rules.
   - Compare observed patterns against category-aware null models that account for intrinsic mutational bias, codon composition, and gene-specific features.
   - Identify candidate sequence families, hidden subpopulations, or convergent recognition features.
   - *Decision*: If observed patterns are consistent with neutral expectation, sampling bias, or artifact, reject or downgrade selection hypotheses before proceeding.

6. **Discriminate candidates by specificity and mechanism**
   - Separate antigen-specific binding from nonspecific recognition using unrelated controls.
   - Classify epitope class and cross-reactivity breadth independently of functional readouts.
   - Decouple binding affinity or abundance from functional blocking or protective mechanism.
   - *Gate*: If binding is not antigen-specific, if functional activity disappears under orthogonal assay concepts, or if abundance alone explains the pattern, stop and diagnose confounders.

7. **Validate through layered orthogonal evidence**
   - **Layer 1 – Specificity matrix**: Test recognition against related and unrelated targets or binders.
   - **Layer 2 – Topology mapping**: Use reciprocal interference or competition logic to classify interface overlap, adjacent interference, or shared recognition.
   - **Layer 3 – Functional or mechanistic readout**: Align the readout to the biological question and separate binding mimicry from downstream consequence.
   - **Layer 4 – Structural or sequence-phenotype plausibility**: Treat models as hypotheses, not proof.
   - *Decision*: Require at least two independent evidence streams to advance a mechanism claim. If orthogonal evidence conflicts, treat the conflict as a new discrepancy question rather than forcing consensus.

8. **Benchmark against alternative explanations**
   - Compare the preferred mechanism model against simpler alternatives: abundance confounding, assay artifact, nonspecific binding, scaffold-driven effects, format artifacts, or model oversimplification.
   - *Gate*: If a simpler explanation accounts for the data equally well, withhold mechanism claims pending further discrimination.

9. **Iterate or terminate**
   - **If validation supports the hypothesis**: refine the model, test broader variants or contexts, and escalate evidence requirements.
   - **If validation is partial**: redesign the next experiment to target the weakest assumption.
   - **If validation fails**: reject the hypothesis and return to step 2 or 5.
   - **Stop conditions**:
     - Controls fail repeatedly.
     - Claims would require clinical, diagnostic, or therapeutic extrapolation beyond the evidence.
     - Ethical, biosafety, or data-governance constraints are unsatisfied.
     - Candidate behavior is not reproducible across independent preparations or clones.

10. **Synthesize and bound claims**
    - Produce a ranked hypothesis summary with explicit evidence labels.
    - State boundary conditions: do not generalize from single donors, single antigens, single assay formats, or single model systems.
    - Mark translation limits between in vitro surrogate evidence and in vivo or clinical relevance.

# Output Format

When using this skill, produce:

1. **Research question framing**
   - Target antigen/pathogen/system
   - Protective or mechanistic function of interest
   - Gap in current evidence

2. **Hypothesis set**
   - For each hypothesis: evidence strength, key assumptions, predicted result, likely failure mode, minimum validation, and claim label.

3. **Conceptual study design**
   - Discovery, binding, functional, cross-reactivity, and mechanism-mapping modules
   - Required positive, negative, specificity, and engineering controls
   - Evaluation metrics and stop conditions

4. **Analysis plan**
   - Data grouping, affinity-function comparison, sequence-phenotype mapping, epitope/mechanism interpretation, and visualization strategy

5. **Iteration plan**
   - How results would update, refine, or reject each hypothesis

6. **Validity and ethics check**
   - Confounders, reproducibility checks, boundary conditions, biosafety/ethics requirements, and translation limits

7. **Evidence labeling**
   - Separate "source-paper-supported," "analogy-based inference," and "new proposal requiring validation."

# Validation Gates

- **Input gate**: All critical inputs identified or explicitly assumed; ethical and biosafety constraints confirmed.
- **Quality gate**: Sequence annotations, germline assignments, and variant classifications are reproducible and artifact-screened.
- **Null-model gate**: Observed patterns deviate from category-aware neutral expectation; simpler nonselective explanations are ruled out or quantified.
- **Specificity gate**: Binding is antigen-specific and distinguishable from nonspecific, scaffold-driven, or background signal.
- **Orthogonality gate**: Mechanism claims are supported by at least two independent evidence streams; conflicting evidence is flagged, not averaged away.
- **Alternative-explanation gate**: Abundance, assay format, and artifact hypotheses are explicitly compared against the preferred mechanism.
- **Extrapolation gate**: Clinical, diagnostic, or therapeutic claims are withheld without independent, ethically approved validation.

# Claim Boundaries

- Binding affinity or abundance does not prove functional mechanism or clinical protection.
- In vitro surrogate readouts are not equivalent to in vivo relevance or clinical efficacy.
- Single-study or single-system observations are not field consensus.
- Sequence patterns alone do not establish causality without independent functional validation.
- Claims are restricted to the tested antigen, assay format, biological context, and population strata.
- Do not generalize from one donor, one antigen fragment, one genotype, or one model organism to the entire pathogen, repertoire, or vaccine field.

# Failure Modes

- **Nonspecificity**: Binding or functional signal is driven by assay artifact, aggregation, tag effects, or immobilization orientation rather than specific recognition.
- **Abundance confounding**: Differences in complex abundance, expression level, or scaffold availability are mistaken for specificity-dependent mechanism.
- **Annotation bias**: Selection inference derives from incorrect germline calls, inconsistent region boundaries, or uncorrected codon composition.
- **Sampling artifact**: Hidden subpopulations, rare variants, or convergent features are overfitted from limited or noisy data.
- **Heterogeneity neglect**: Mixed reagents or polyclonal populations are treated as homogeneous, masking subpopulation-specific mechanisms.
- **Assay-format dependence**: Mechanistic conclusions rely on a single readout or presentation format that creates artificial reciprocal interference or avidity effects.
- **Model oversimplification**: Binary or collapsed null models mask intrinsic category biases, producing false selection signals.
- **Premature extrapolation**: Mechanistic findings are translated to clinical, diagnostic, or therapeutic claims without appropriate validation.

# Validity Checks

Before finalizing conclusions, check:

- **Confounding**: antigen purity, tag effects, immobilization artifacts, aggregation, glycosylation state, host-cell background, and expression/assembly differences.
- **Specificity**: unrelated antigen controls, irrelevant antibody controls, variant panels distinguishing conserved from strain-specific recognition, and negative-control discrimination.
- **Reproducibility**: independent clones, repeated measurements, orthogonal binding or functional concepts, and independent preparations.
- **Statistical validity**: prespecified comparisons, adequate replication, uncertainty intervals, multiple-testing correction, and avoidance of post hoc thresholding.
- **Model validity**: the null or comparative model matches the number and dependency structure of mutation categories; simpler baseline models are benchmarked.
- **Sampling validity**: clonal relatedness, population structure, repeated sampling, and uneven mutation burden are considered.
- **Boundary conditions**: conclusions are limited to the tested immune system, antigen class, cell compartment, response stage, lineage panel, or repertoire source.
- **Mechanistic ambiguity**: binding without functional blocking is explained by epitope location, antibody orientation, steric constraints, multivalency, or assay limitations rather than assumed nonprotective decoy status.
- **Evidence labeling**: each claim is marked as source-paper-supported, directly validated in current data, analogy-based, or speculative.

# Provenance

- Derived from cluster **69** / subcluster **69.0.split0**.
- Synthesized from source skills: `viral-antibody-epitope-discovery-workflow`, `anti-idiotypic-surrogate-research-design`, `ig-selection-model-planning`, `nucleosome-complex-localization-research`, `immunogenetics-hidden-variant-research`, `hidden-subpopulation-immunology-research-design`, `comparative-germline-variation-workflow`, `anti-idiotypic-surrogate-mechanism`.
- Preserves transferable reasoning patterns without source-paper biological conclusions, operational protocols, or system-specific parameters.
