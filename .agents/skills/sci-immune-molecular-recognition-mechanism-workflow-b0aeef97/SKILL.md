---
name: sci-immune-molecular-recognition-mechanism-workflow-b0aeef97
description: A reusable end-to-end workflow for discovering and validating molecular recognition mechanisms through hypothesis generation, discriminating perturbation, multi-readout validation, and iterative mechanism discrimination.
scienceevolve-title: "Antibody and immune recognition · molecular recognition mechanism workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Help an agent transform an unresolved molecular recognition question into a structured research program that discriminates among competing mechanistic explanations. The workflow combines structural reasoning, sequence or variant perturbation, functional readouts, and convergent evidence updating to bound claims about how a recognizer engages its target.

# When to use

Trigger this skill when the user asks for:

- Research plans to explain specificity, selectivity, or cross-reactivity in macromolecular recognition.
- Hypothesis generation for epitope mapping, paratope determinants, conserved dependency domains, or motif mimicry.
- Validation design for target-altered, germline-to-mature, or domain-truncation comparisons.
- Mechanism discrimination between direct contact, distributed interface, conformational coupling, and indirect or confounded effects.

Do not use this skill for clinical decision-making, treatment recommendations, operational wet-lab protocols, or diagnostic interpretation.

# Inputs required

- **Target system**: recognizer, target, biological context, and known or suspected interaction regions.
- **Structural evidence**: complex model, predicted interface, or docking result with confidence level.
- **Sequence or variant landscape**: natural variants, homologs, germline precursors, engineered perturbations, or altered target states.
- **Functional readout category**: binding, inhibition, activation, signaling, or complex formation linked to recognition.
- **Comparator set**: related targets, unrelated targets, positive and negative controls, and baseline conditions.
- **Constraints**: safety, ethics, data availability, resolution limits, and non-operational boundaries.

If any input is missing, state assumptions explicitly and design the plan so those assumptions can be tested early.

# Core Workflow

1. **Frame the recognition gap**
   - State the unresolved mechanism: which target or recognizer features explain observed specificity or functional change?
   - Define the comparison baseline (e.g., original versus altered target, germline versus mature, full-length versus domain).
   - Identify the narrowest claim compatible with existing evidence.

2. **Generate competing mechanistic hypotheses**
   - Propose at least three non-overlapping explanations, such as:
     - **Direct contact or spatial patch**: recognition depends on localized complementarity.
     - **Distributed or multi-site**: recognition depends on several weak contributions across a broader interface.
     - **Indirect, allosteric, or conformational**: changes arise from propagated structural rearrangements or dynamic states.
     - **Mimicry or motif-based**: a candidate feature resembles a known recognition element.
     - **Confounded or non-informative**: the signal is explained by assay artifacts, stability loss, aggregation, or hidden covariates.
   - For each hypothesis, assign evidence strength (high, moderate, low, or speculative), key assumptions, predicted observations across the target panel, and the most likely failure mode.

3. **Design discriminating perturbations**
   - Select a minimal variant set that isolates one candidate feature at a time:
     - Feature-intact versus feature-disrupted (e.g., site-directed alteration, truncation, swap).
     - Scaffold-matched controls that change a non-candidate region.
     - Context variants (e.g., chimeric domains, different target states).
   - Define the target panel to include:
     - At least one target expected to be sensitive to the candidate feature.
     - At least one target expected to be insensitive (negative or specificity control).
     - Related targets that differ in conformation, presentation, or chemical character.

4. **Plan multi-readout validation**
   - **Primary readout**: direct binding, occupancy, or complex formation linked to recognition.
   - **Secondary readouts**:
     - Competition with reference ligands or site-directed probes.
     - Specificity screen against unrelated targets or analogues.
     - Functional consequence consistent with the proposed mechanism.
     - Orthogonal structural or localization evidence when available.
   - **Control structure**:
     - Positive control: known active interaction.
     - Negative control: unrelated or non-interacting pair.
     - Specificity controls: variants outside and inside the proposed interface.
     - Assay validity controls: target-only, recognizer-only, integrity checks, and signal-only background checks.

5. **Integrate and classify evidence**
   - Map each evidence stream (sequence, structure, binding, competition, function, orthogonal) separately.
   - Score convergence: upgrade confidence only when independent streams agree; downgrade if only one stream supports the claim.
   - Classify the mechanism:
     - **Supported**: structural plausibility, variant discrimination, and functional consistency converge.
     - **Partially supported**: some streams agree, but key controls or orthogonal evidence are missing.
     - **Unsupported or contradicted**: controls fail, predictions are violated, or alternative explanations fit better.
     - **Ambiguous**: data are insufficient to discriminate among remaining hypotheses.

6. **Decision gate: iterate, pivot, or stop**
   - **If supported**: narrow the claim to the most specific feature still justified; add stronger specificity controls; test generalization to related targets or scaffolds.
   - **If contradicted**: discard the causal claim but retain constraints; revise the structural model, perturbation set, or readout; generate a revised hypothesis.
   - **If ambiguous**: add controls for folding, stability, aggregation, nonspecific binding, and assay interference; redesign perturbations so each variant distinguishes at least two hypotheses; seek orthogonal binding or structural evidence.
   - **Stop conditions**:
     - The functional readout cannot be linked to recognition.
     - Controls fail to establish assay validity.
     - Variant effects are equally explained by confounders such as stability, aggregation, or nonspecific effects.
     - Structural resolution is insufficient for the claimed contact-level conclusion.
     - The perturbation set does not discriminate among competing hypotheses.
     - Safety, ethics, or regulatory requirements are not satisfied.

# Output Format

When using this skill, produce:

1. **Research question and gap**: concise statement of the mechanism to be resolved.
2. **Hypothesis table**: | Hypothesis | Evidence strength | Key assumptions | Predicted observations | Likely failure mode |
3. **Perturbation and target panel**: variant set, comparator set, and rationale.
4. **Validation plan**: readouts, control structure, success criteria, ambiguous criteria, failure criteria, and stop conditions.
5. **Analysis and integration rules**: how evidence streams will be mapped, scored, and classified.
6. **Iteration path**: next decision rules for supported, contradicted, and ambiguous outcomes.
7. **Validity and boundary statement**: confounders, reproducibility checks, extrapolation limits, and safety or ethics constraints.

# Validation Gates

- **Structural validity**: Is the model resolution sufficient for the claimed detail? Are side-chain contacts provisional? Are flexible or unresolved regions excluded from strong claims?
- **Perturbation validity**: Do variants isolate the proposed determinant? Are scaffold and feature-only controls included? Are integrity checks planned before interpreting selectivity?
- **Functional validity**: Does the readout directly measure recognition or only an indirect consequence? Is there an orthogonal binding or complex-formation check?
- **Comparative validity**: Do sequence, structure, and function tell a consistent story? Are unmeasured differences plausible alternative explanations?
- **Statistical validity**: Are replicates planned? Are success and failure thresholds predefined? Are multiple comparisons controlled when ranking candidates or sites?

# Claim Boundaries

- Distinguish **paper-supported logic** (method pattern derived from reviewed skills) from **agent inference** (new system application) and **external validation needed**.
- Limit contact-level causality claims to systems with sufficient structural resolution and orthogonal support.
- Treat sequence similarity, docking predictions, and single-variant effects as hypothesis-generating, not mechanistically definitive.
- Do not generalize from one recognizer-target pair to field-wide rules without independent replication.
- Separate analytical detection from biological or clinical interpretation.

# Failure Modes

- **Nonspecific gain or loss**: improved or lost recognition across all targets indicates scaffold, stability, or assay artifacts rather than a selective mechanism.
- **Binding-function decoupling**: binding changes without functional consequences suggest occupancy without mechanistic relevance or assay interference.
- **Confounded association**: outcome differences explained by batch effects, target state heterogeneity, matrix interference, or hidden clinical or technical covariates.
- **Overfitted mechanism**: a model that explains one variant set but fails on independent replicates or related targets.
- **Structural overinterpretation**: inferring side-chain-level causality from low-resolution, predicted, or static models alone.

# Validity Checks

- Are positive and negative controls functional and inactive, respectively?
- Does the diversity panel represent the intended claim breadth?
- Are results reproducible across independent preparations, batches, or assay formats?
- Could construct folding, presentation, aggregation, or nonspecific interactions explain the result?
- Are host or system perturbation risks considered separately from desired activity?
- Are limitations, confounders, and extrapolation boundaries explicitly stated in every output?

# Provenance

- Synthesized from cluster 47 / subcluster 47.0.split0.
- Source skill references: structure-guided-specificity-discovery, immunogenomic-complementarity-research-design, conserved-host-dependency-domain-mapping, hapten-immunometric-assay-design, receptor-ligand-motif-mimicry-exploration, ligand-receptor-internal-image-research, antibody-h3-recognition-exploration, epitope-directed-recognition-redesign.
- Preserves the shared method pattern: paired-state perturbation, multi-hypothesis generation, discriminating variant design, convergent evidence integration, and iterative mechanism discrimination.
