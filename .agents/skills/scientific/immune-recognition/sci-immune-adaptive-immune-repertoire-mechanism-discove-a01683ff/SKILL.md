---
name: sci-immune-adaptive-immune-repertoire-mechanism-discove-a01683ff
description: A reusable end-to-end workflow to discriminate adaptive immune activation mechanisms from repertoire sequence features, including recovery-phase stratification and mechanism validation.
scienceevolve-title: "Antibody and immune recognition · adaptive immune repertoire mechanism discovery workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Help an agent design research that uses adaptive immune repertoire sequence features to discriminate among competing activation or maturation mechanisms—such as antigen-driven selection, polyclonal innate-like expansion, or superantigen-like biased activation—and to evaluate recovery-phase dynamics. The workflow generates falsifiable hypotheses, designs comparator-based studies, plans multi-feature analyses, and iterates based on convergent or conflicting evidence without treating single-study findings as field consensus.

# When to use

Use this skill when the user wants to:
- Interpret B-cell or T-cell repertoire data to distinguish antigen-driven maturation from non-specific activation or polyclonal expansion.
- Design studies comparing repertoire structure across disease states, tissues, isotypes, time points, or exposure contexts.
- Stratify recovery phases to test whether total repertoire recovery masks subset-specific quality deficits.
- Generate hypotheses, experimental designs, or analysis plans for repertoire-based mechanism discovery.

Do not use this skill for clinical diagnosis, treatment selection, individual patient interpretation, or operational wet-lab protocols.

# Inputs required

Before producing a study plan, collect or infer:
- **Target repertoire context:** immune compartment, cell subset, isotype or receptor class, disease or exposure state, and tissue source.
- **Comparator repertoire:** matched internal reference, external cohort, or baseline population.
- **Candidate mechanisms:** antigen-driven adaptive selection, superantigen-like or biased activation, polyclonal/innate-like expansion, tissue-local effects, or technical artifact.
- **Sequence-derived features:** clonality, somatic hypermutation burden, selection signatures, gene-segment usage, CDR length and composition, isotype distribution, or clonal relatedness.
- **Temporal structure:** cross-sectional or longitudinal design; if recovery is relevant, early-phase and late-phase sampling frames.
- **Data constraints:** sampling depth, batch structure, metadata completeness, consent and privacy limits, and quality control status.
- **Success criteria:** minimum viable validation requirements and stronger validation goals.

# Core Workflow

## Phase 1: Frame Competing Mechanisms
1. Define the biological contrast (e.g., disease vs. baseline, tissue vs. systemic, early vs. late recovery).
2. List competing mechanistic models as falsifiable patterns.
3. Map each model to expected repertoire signatures across at least two independent feature classes.
4. Annotate evidence strength, key assumptions, and failure modes for each hypothesis.
- **Decision Gate 1:** Are at least two competing mechanisms defined with distinct predicted feature profiles? If no, stop and refine the biological question.

## Phase 2: Audit Data & Validate Comparators
1. Confirm sample provenance, metadata completeness, batch structure, and privacy constraints.
2. Assess sequencing quality, sampling depth, and productive sequence yield.
3. Verify comparator compatibility for tissue, age, therapy, exposure, and technical variables.
- **Decision Gate 2:** Do data quality and comparator matching support interpretable analysis? If no, stop and prioritize quality improvement or comparator redesign.

## Phase 3: Execute Stratified Feature Analysis
1. Compute repertoire features: clonality, diversity, mutation burden, selection pressure, gene-segment usage, CDR properties, and isotype distribution.
2. Stratify by biological subgroups (compartments, subsets, maturity states) and, if applicable, recovery phases.
3. Compare target vs. comparator within each stratum; report feature-level results before mechanism-level conclusions.
- **Decision Gate 3:** Do multiple independent features show consistent directional differences? If only one feature differs, flag limited convergence and narrow claims.

## Phase 4: Score Mechanisms & Exclude Confounders
1. Score support for each competing mechanism using a pre-specified multi-feature rubric.
2. Require convergent evidence from at least two independent feature classes before favoring a mechanism.
3. Test confounding explanations: batch effects, sampling depth, metadata imbalance, age, therapy, and tissue mismatch.
- **Decision Gate 4:** Does the preferred mechanism survive confounding checks? If confounding explains the pattern, pivot to alternative explanations or stop.

## Phase 5: Stratify Recovery Phases (if longitudinal/recovery context)
1. Separate early-phase dynamics (redistribution, activation, expansion of pre-existing clones) from late-phase dynamics (new diversification, decay of dominant clones, stabilization).
2. Test whether total repertoire quantity or diversity recovery masks subset-specific structural deficits.
3. Compare stratified conclusions against mixed-population averages.
- **Decision Gate 5:** Do short- and long-phase trends differ within strata? If yes, formulate stage-specific models rather than single average models.

## Phase 6: Validate, Iterate, or Stop
1. Apply minimum viable validation: reproducible signal in independent samples with matched controls and at least two feature classes.
2. Apply stronger validation if advancing: independent cohort, orthogonal assay, sensitivity analysis for sampling depth and metadata, local-vs-systemic comparison, or prospective extension.
3. Iterate based on bottleneck diagnosis:
   - No mechanism-specific signal → check assay/target/comparator mismatch.
   - Mixed signal → split into stage-specific or compartment-specific hypotheses.
   - Metadata imbalance dominates → redesign comparator or reduce claim scope.
   - Data quality insufficient → stop biological interpretation.
- **Decision Gate 6:** Does evidence meet pre-specified success criteria without safety or ethics violations? If no, stop or redesign.

# Output Format

When using this skill, produce:
1. **Research question** — Target repertoire, comparator, and mechanism contrast.
2. **Hypothesis table** — Hypothesis, predicted feature pattern, evidence strength, key assumptions, and failure modes.
3. **Experimental design schema** — Target/comparator, strata, phases, controls, diagnostic features, and stop conditions.
4. **Analysis plan** — Data audit, stratified feature analysis, mechanism scoring, confounding checks, and visualization strategy.
5. **Iteration plan** — Decision rules for continue, pivot, narrow claim, or stop.
6. **Validity and ethics statement** — Scope limits, confounding risks, reproducibility needs, and safety boundaries.

# Validation Gates

- **Mechanism specificity:** Multiple independent repertoire features converge on the same mechanism.
- **Comparator validity:** Biological and technical matching isolates the intended contrast.
- **Sampling depth adequacy:** Repertoire depth is sufficient to support clonality and diversity claims.
- **Confounding resistance:** Metadata, batch, therapy, and tissue effects are modeled or ruled out.
- **Phase separation:** Early and late recovery dynamics are distinguishable when temporal data exist.
- **Reproducibility:** Findings are consistent across independent samples or orthogonal readouts.

# Claim Boundaries

- Limit conclusions to the studied tissue, compartment, isotype, disease state, and population context.
- Distinguish paper-supported method patterns from agent-inferred hypotheses and speculative extrapolations.
- Do not treat in vitro repertoire patterns as proof of clinical causation or therapeutic relevance.
- Do not generalize from single-cohort or single-timepoint data to universal immune mechanisms.
- Separate clone-level possibility from platform-level diversity claims.

# Failure Modes

- **Single-feature support:** One repertoire feature differs while others are unchanged, suggesting artifact or confounding.
- **Comparator mismatch:** Unmatched tissue, age, therapy, or batch structure creates spurious differences.
- **Insufficient sampling depth:** Low repertoire depth mimics clonality or diversity differences.
- **Metadata confounding:** Unmeasured covariates explain the apparent mechanism signal.
- **Overinterpretation of mixed populations:** Averaging across strata masks opposite trends.
- **Context-dependent function loss:** Repertoire features correlate with binding but lack functional validation.
- **Recovery illusion:** Total repertoire size recovers while quality or subset structure remains abnormal.

# Validity Checks

- Are strata defined independently of the outcome?
- Could batch, purity, input amount, or sampling depth create apparent skew?
- Are quality metrics stable across repeated measurements or resampling?
- Do conclusions survive reasonable metric and weighting choices?
- Are analysis decisions pre-specified or clearly marked as exploratory?
- Are multiple comparisons corrected when many features, strata, or metrics are tested?
- Is the reference distribution appropriate for the biological context?
- Are short- and long-phase samples comparable?

# Provenance

- Synthesized from cluster 36 / subcluster 36.0.split0.
- Source skills: adaptive-b-cell-antibody-repertoire-exploration (d89131fc0e7594f0), immune-repertoire-reconstitution-workflow (046e4fbc5cb74b9c), antigen-repertoire-antibody-discovery-workflow (5d88a75e9a9f6769), antigen-repertoire-exploration (b6012a6782ddbdf4), innate-immunity-bridge-design (d0204e14e8b6f95b), mycobacterial-pe-ppe-antigen-exploration (bcf48c89ce5cd614), ligand-dependent-antibody-binding-dissection (b93ee8b7eeeb8ab1), malaria-antigen-tcell-epitope-discovery (624a5eb0ab2a80f3).
- Excluded skill IDs: 33a4a0a566de5dfc, e61af3e79dc1bbab.
