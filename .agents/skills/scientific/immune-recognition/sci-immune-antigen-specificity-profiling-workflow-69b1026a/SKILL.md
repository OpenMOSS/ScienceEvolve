---
name: sci-immune-antigen-specificity-profiling-workflow-69b1026a
description: Design and iterate research plans to map antibody reactivity, epitope breadth, and cross-reactivity across antigenic variation or modular molecular regions.
scienceevolve-title: "Antibody and immune recognition · antigen specificity profiling workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

This skill helps an agent design end-to-end research plans for profiling antigen specificity, epitope breadth, and cross-reactivity across diverse antigenic landscapes. It abstracts the scientific logic of mapping immune recognition patterns—whether across variant panels, modular antigen regions, or complex antigen sets—into a reusable, bias-aware workflow. The goal is to connect observed reactivity patterns to mechanistic hypotheses through controlled comparison, orthogonal validation, and iterative refinement, without reproducing source-specific systems or conclusions.

# When to use

Use this skill when the user asks to:

- Generate research questions about antibody specificity, epitope breadth, or cross-reactivity across antigenic variants or modular molecular regions.
- Design non-operational studies to profile immune recognition landscapes, including restricted repertoire features, subdominant antigens, or autoantibody epitopes.
- Compare immune responses across host states, exposure histories, antigen structures, or time points.
- Move from serological or repertoire-marker observations to mechanistic hypotheses about antigen-driven selection.
- Evaluate whether candidate binders or responses are specific, cross-reactive, or dominated by background signals.

Do not use this skill for clinical advice, individual diagnosis, treatment selection, operational laboratory protocols, or executable high-risk procedures.

# Inputs required

Before generating a plan, obtain or infer:

- **Target antigen system**: pathogen family, antigen class, modular region, or variant panel.
- **Binder source**: polyclonal sera, repertoire-derived probes, monoclonal candidates, or surrogate detection reagents.
- **Recognition phenotype**: binding breadth, cross-reactivity pattern, restricted lineage usage, or subdominant response.
- **Antigenic landscape**: known variants, homologs, modular domains, or candidate antigen fractions.
- **Available measurements**: serology, binding assays, repertoire sequencing, structural data, or functional readouts.
- **Comparison contexts**: host states, exposure histories, time points, or antigen structures.
- **Constraints**: biosafety level, ethics approvals, sample availability, and whether the work is conceptual, computational, observational, or experimental.

If any input is missing, state the assumption and design the plan so the assumption can be tested.

# Core Workflow

### 1. Frame the specificity problem
Define the antigenic landscape (variants, modules, or regions) and the unexplained recognition gap. State whether the core uncertainty concerns breadth, cross-reactivity, subdominant recognition, or restricted repertoire usage.

### 2. Generate testable hypotheses
For each candidate mechanism (e.g., variant-specific epitope, conserved cross-reactive determinant, restricted gene-family usage, modular antigen recognition), formulate hypotheses with:
- Predicted reactivity pattern across the antigen panel.
- Evidence strength, key assumptions, and extrapolation boundaries.
- Explicit failure modes.

### 3. Design the profiling matrix
Construct a comparative matrix spanning:
- **Antigen dimension**: target variants, modular regions, homologs, and irrelevant/non-target antigens.
- **Binder dimension**: polyclonal sera, monoclonal candidates, or repertoire-derived probes.
- **Control dimension**: positive controls, negative controls, comparison markers, and orthogonal readouts.
Predefine criteria for success, ambiguity, and failure.

**Decision Gate 1 — Design Completeness**: Confirm the matrix can distinguish specific recognition from background and that controls are adequate to test each hypothesis. If not, redesign the panel before proceeding.

### 4. Execute measurement with quality control
Plan detection assays to establish:
- Positive and negative control behavior.
- Background and nonspecific signal levels.
- Technical reproducibility across replicates or batches.
- Traceability of samples and metadata.

**Decision Gate 2 — Measurement Validity**: Verify that assays detect intended targets and that negative controls remain below predefined thresholds. If controls fail, stop interpretation and redesign detection.

### 5. Map reactivity breadth and intensity
Quantify:
- **Breadth**: proportion of antigen variants or modules recognized.
- **Intensity**: relative binding or response strength per target.
- Consistency within samples versus differences between comparison groups.

### 6. Discriminate specificity and cross-reactivity
Classify recognition as:
- Target-specific or module-specific.
- Cross-reactive across related antigens.
- Nonspecific or background.
Use competition, differential binding, or depletion logic to separate shared epitopes from artifacts.

**Decision Gate 3 — Specificity Gate**: Advance only candidates showing reproducible separation between target and non-target recognition. Deprioritize candidates dominated by off-target or matrix signal.

### 7. Associate patterns with molecular features
Test whether reactivity patterns correlate with:
- Gene family, clonal lineage, or structural motif usage.
- Sequence conservation, domain architecture, or positional features.
- Host-state or repertoire-restricted features.
Treat association as hypothesis-generating, not mechanistic proof.

### 8. Integrate orthogonal validation
Require independent assay classes to converge before strengthening claims:
- Binding plus competition or depletion.
- Serological plus repertoire-level evidence.
- Simplified target plus native or complex sample context.
- Structural or mutational mapping where appropriate.

**Decision Gate 4 — Convergence Gate**: Promote hypotheses to higher evidence levels only when orthogonal data agree. If orthogonal evidence conflicts, downgrade the claim and return to Step 2.

### 9. Iterate or terminate
- **If supported**: Narrow the hypothesis toward mechanism; design targeted follow-up (e.g., structural mapping, functional readout, phenotype association).
- **If ambiguous**: Add comparison markers, stratify by host context, or expand antigen panel diversity.
- **If failed**: Preserve negative results as boundary conditions; test alternative mechanisms (e.g., different epitope classes, host-state effects, assay artifacts).
- **Stop conditions**: Irreproducible signal, failed controls, unsupported assumptions, or unresolved ethical/biosafety constraints.

# Output Format

When using this skill, return:

1. **Research question** — Phenotype, comparison, and unexplained gap; assumptions and boundaries.
2. **Hypothesis set** — For each hypothesis: predicted pattern, evidence strength, key assumptions, failure modes, and boundaries.
3. **Profiling matrix design** — Antigen panel, binder panel, control structure, and predefined decision criteria.
4. **Analysis plan** — QC rules, breadth/intensity quantification, specificity classification, cross-reactivity testing, and molecular association strategy.
5. **Iteration roadmap** — Success, ambiguity, failure, and stop conditions; next steps for each outcome.
6. **Validity and ethics statement** — Confounding checks, reproducibility requirements, statistical cautions, boundary conditions, and safety/ethics constraints.

# Validation Gates

- **Gate 1 — Design Completeness**: The antigen-binder matrix must include sufficient diversity and controls to separate specific recognition from background before any measurement begins.
- **Gate 2 — Measurement Validity**: Assays must demonstrate detectable positive signal and acceptable negative-control background; failed controls trigger redesign.
- **Gate 3 — Specificity Gate**: Candidate recognition must be reproducibly separable from non-target and matrix signals; nonspecific candidates are deprioritized.
- **Gate 4 — Convergence Gate**: Mechanistic or cross-reactivity claims require agreement across at least two independent assay classes or evidence types.
- **Gate 5 — Boundary Gate**: Claims must be checked against predefined extrapolation limits (host context, antigen class, assay format) before finalization.

# Claim Boundaries

- Distinguish **binding recognition** from **functional activity**, **neutralization**, or **clinical protection**.
- Distinguish **association** between antigen variation and response from **causal mechanism**.
- Distinguish **in vitro or computational evidence** from **in vivo relevance**.
- Do not generalize from one pathogen, vaccine platform, host state, or cohort to all immune responses.
- Do not treat a single-marker or single-assay result as definitive proof of epitope specificity or mechanism.
- Keep paper-supported observations separate from agent-generated inferences.

# Failure Modes

- **Design failure**: Antigen panel is too narrow, controls are mismatched, or hypotheses are not mutually distinguishable.
- **Measurement failure**: Assays lack sensitivity, background exceeds signal, or technical reproducibility is poor.
- **Specificity failure**: Recognition is dominated by off-target binding, matrix effects, or non-idiotypic framework reactivity.
- **Cross-reactivity ambiguity**: Shared recognition cannot be distinguished from nonspecific stickiness or contaminant-driven signal.
- **Molecular misassociation**: Sequence or structural features are correlated but not causally linked to the observed specificity.
- **Overextrapolation**: Findings from one variant, host, or assay format are generalized without validation.
- **Iteration stall**: Ambiguous results persist because comparison markers, host stratification, or orthogonal assays are missing.

# Validity Checks

- **Confounding checks**: Evaluate host background, exposure history, disease stage, sampling time, assay batch, antigen preparation, and matrix effects.
- **Reproducibility checks**: Require independent measurements, confirmed control behavior, predefined exclusion criteria, and separable raw and derived data.
- **Statistical checks**: Predefine primary comparisons; use models appropriate for skewed, bounded, or censored data; adjust for multiple antigens, markers, and time points; report effect sizes with uncertainty.
- **Boundary checks**: Do not treat one study’s marker panel as universal; do not infer clinical outcomes from binding alone; do not claim causality without orthogonal or perturbation evidence.
- **Sample validity**: Ensure within-unit variant diversity is sampled deeply enough to estimate breadth; avoid collapsing populations into single representatives without acknowledgment.

# Provenance

- Derived from cluster **26**, subcluster **26.0.split0**.
- Synthesized from source skills: `restricted-repertoire-vaccine-response-exploration` (24738ffac8120ee4), `influenza-antibody-repertoire-exploration` (87e09d151a842c41), `mycobacterium-antigen-phage-library-exploration` (a385560d4cd6f7aa), `mold-allergen-crossreactivity-discovery` (5d6cf58125c308c3), `idiotype-network-research-discovery` (3a9b70c5a5e7b6fc), `viral-antigenic-variant-host-response-exploration` (729a8e9ba85a61de), `recognition-reagent-research-workflow` (1f59bdeee08f702d), `parasite-antigen-discovery-workflow` (ecc537a84f33c71b).
