---
name: sci-immune-antibody-and-binder-recognition-mapping-work-30a8238f
description: A reusable end-to-end research workflow for mapping epitopes, linear motifs, and flexible recognition regions using controlled perturbation, boundary refinement, and orthogonal specificity validation.
scienceevolve-title: "Antibody and immune recognition · antibody and binder recognition mapping workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Help an agent convert an antibody or binder recognition problem into a reusable, non-operational research workflow. It guides end-to-end mapping of candidate epitopes, linear motifs, and flexible regions through hypothesis generation, coarse-to-fine screening, boundary refinement, specificity testing, context validation, and orthogonal convergence—while keeping claims bounded to the evidence.

# When to use

Use this skill when the user asks to:

- Map recognition determinants (epitopes, motifs, flexible regions) for antibodies, nanobodies, aptamers, or engineered binders.
- Design non-clinical validation plans involving overlapping features, perturbation, or boundary refinement.
- Interpret whether binding reflects a focused determinant, nonspecific interaction, conformational epitope, or context-dependent accessibility.
- Iterate after positive, negative, or ambiguous mapping results.

Do not use this skill for clinical diagnosis, treatment recommendations, executable wet-lab protocols, or high-risk operational instructions.

# Inputs required

Before generating a plan, identify or request:

- Target class and biological context (protein, complex, or other macromolecule).
- Binder class and known or suspected behavior.
- Candidate feature space (sequence, domain, structural segment, or modification).
- Prior evidence (binding data, structural models, sequence homologs, cross-reactivity reports).
- Available contexts (isolated-feature, native/near-native, engineered variant, orthogonal assay).
- Intended claim type (detection utility, epitope boundary, specificity profile, mechanistic hypothesis).
- Constraints (ethics, biosafety, model access).

If inputs are missing, state assumptions explicitly and mark downstream conclusions as lower confidence.

# Core Workflow

1. **Define the recognition pair and gap.** State the target, binder, and the unknown: boundary, accessibility, specificity, conformational dependence, or context. *Gate: If no measurable recognition baseline exists or assay controls fail, stop and establish validity before proceeding.*

2. **Generate competing hypotheses.** Formulate 3–6 falsifiable hypotheses (e.g., focused linear determinant, boundary-dependent cluster, flexible/conformational epitope, induced-fit, context-dependent accessibility, nonspecific artifact). For each, specify evidence strength, key assumption, predicted discriminator, likely failure mode, and extrapolation boundary.

3. **Coarse feature mapping.** Scan the target space with overlapping or broad candidate elements; preserve negative space. *Decision gate: Do positive signals form tight, reproducible clusters?*
   - **Yes** → proceed to boundary refinement.
   - **No / scattered** → reassess for nonspecificity, assay failure, or conformational dependence; redesign probes or pivot hypotheses.

4. **Boundary refinement and perturbation.** Around each cluster, test shorter, shifted, or variant features; use conceptual perturbations (deletion, substitution, chimera) to probe necessity. *Decision gate: Do independent designs converge on a minimal determinant?*
   - **Yes** → define candidate boundary.
   - **No** → expand perturbation set, test for redundant determinants, or return to coarse mapping.

5. **Specificity and negative-space assessment.** Compare target-positive versus target-negative contexts using unrelated features, scrambled/composition-matched controls, related homologs/isoforms, and irrelevant binders. *Decision gate: Is recognition specific to the intended target–binder pair?*
   - **Yes** → proceed.
   - **No** → halt mechanistic claims; redesign for specificity or deprioritize the target.

6. **Context validation.** Compare isolated-feature recognition with native/near-native or full-length target presentation. *Decision gate: Does recognition persist in the relevant context, or is there a plausible accessibility explanation?*
   - **Yes** → proceed.
   - **No** → generate accessibility/masking hypotheses and test; if unresolved, bound all claims to isolated systems.

7. **Orthogonal validation.** Gather independent evidence (alternative assay principle, structural or computational prediction, kinetic/thermodynamic decomposition, functional readout, competition logic). *Decision gate: Do multiple independent streams converge?*
   - **Convergent** → raise confidence.
   - **Conflicting** → retain alternative explanations and design a discriminating follow-up.

8. **Mechanistic integration and claim bounding.** Synthesize a mechanism table: claim, evidence source, strength, key assumption, alternative explanation, next validation step. Classify claims as detection utility, boundary mapping, specificity evidence, functional association, or mechanistic hypothesis. *Decision gate: Does integrated evidence meet the predefined success criterion for the intended claim type?*
   - **Yes** → finalize bounded conclusions.
   - **No** → iterate from the weakest link.

9. **Iterate or terminate.**
   - **Continue:** Advance to the next weakest link (e.g., from boundary to functional consequence).
   - **Redesign:** If controls fail, specificity is poor, or context remains unresolved.
   - **Stop:** If recognition is non-reproducible, nonspecific, contradicted by orthogonal data, or the model system is too distant from the biological question.

# Output Format

When using this skill, return:

1. **Research question** – Target, binder, and core uncertainty.
2. **Hypothesis set** – 3–6 competing hypotheses with evidence strength, assumptions, discriminators, failure modes, and boundaries.
3. **Mapping plan** – Coarse scan strategy, refinement approach, perturbation logic, and stop conditions.
4. **Control and specificity strategy** – Positive, negative, context, and specificity controls.
5. **Context validation plan** – Isolated versus native/near-native comparison and accessibility checks.
6. **Orthogonal validation plan** – Independent evidence streams and convergence criteria.
7. **Analysis and integration plan** – Feature map, boundary logic, mechanism table, and uncertainty reporting.
8. **Iteration rules** – Decision tree for supportive, negative, ambiguous, or confounded outcomes.
9. **Validity and boundary statement** – Confounders, reproducibility checks, statistical considerations, and extrapolation limits.

# Validation Gates

- **Baseline gate:** Measurable recognition baseline exists and assay controls pass.
- **Cluster gate:** Positive signals form tight, reproducible clusters rather than scattered peaks.
- **Specificity gate:** Recognition is enriched in the intended target–binder pair against negative and related comparators.
- **Context gate:** Isolated-feature results are reconciled with native/near-native context or bounded explicitly.
- **Orthogonal gate:** Multiple independent evidence streams converge before raising mechanistic confidence.
- **Claim gate:** Conclusions are classified and bounded to the tested target, binder class, and context.

# Claim Boundaries

- **Detection utility:** Supported by reproducible binding in controlled assays.
- **Boundary mapping:** Supported by convergent refinement and perturbation evidence.
- **Specificity profile:** Supported by negative-space and cross-reactivity testing.
- **Functional association:** Supported only when recognition co-occurs with functional readouts under appropriate controls.
- **Mechanistic hypothesis:** Requires orthogonal convergence; label as speculative until independently validated.
- Do not extrapolate from one binder, one target, or one assay format to field-wide rules.
- Do not infer clinical relevance, therapeutic efficacy, or diagnostic utility without dedicated validation.

# Failure Modes

- **Assay failure:** Positive controls fail or background is uncontrolled; all mechanistic claims are downgraded.
- **Nonspecific recognition:** Scattered positives, strong negative controls, or broad cross-reactivity prevent boundary mapping.
- **Context collapse:** Isolated-feature recognition fails to translate to native context without an accessibility explanation.
- **Conformational masking:** A linear mapping approach misses a structural determinant; requires pivot to conformational hypotheses.
- **Artifact-driven signal:** Matrix effects, aggregation, display format, or detection interference mimics specific recognition.
- **Overfitting:** Post-hoc boundary refinement without predefined success criteria produces spurious determinants.
- **Irreproducibility:** Results inconsistent across preparations, batches, or platforms.

# Validity Checks

- **Confounding:** Target expression, stability, folding, aggregation, assay background, and neighboring molecules.
- **Construct validity:** Isolated segments or engineered variants are not equivalent to full-length native targets.
- **Measurement validity:** Positive, negative, context, and specificity controls are included and interpreted before biological claims.
- **Specificity:** Related isoforms, homologs, shared motifs, and off-target proteins are considered.
- **Boundary conditions:** Species, cell type, post-translational state, receptor architecture, and assay format.
- **Statistical validity:** Primary endpoints, replication logic, uncertainty, effect size, and multiple-comparison handling.
- **Reproducibility:** Independent binders, segments, or assay modalities support the same conclusion.
- **Mechanistic coherence:** Binding, accessibility, perturbation, and orthogonal evidence tell a consistent story.
- **Evidence labeling:** Paper-supported observations, analogical inferences, and agent-generated hypotheses are clearly separated.

# Provenance

- Derived from cluster 66 / subcluster 66.0.split0.
- Synthesized from source skills: membrane-idr-target-exploration (c22d3783c99c72b0), linear-epitope-mapping-workflow (7da9aa768471c96e), allergen-epitope-recognition-workflow (754709cf82ba4d5f), huntingtin-epitope-research-pattern (9ab26c8444ea3afb), motif-niche-persistent-signaling (558887efee2983f0), antibody-interface-engineering-workflow (1a2d89be1ac2a668), aeca-antibody-mechanism-exploration (51c60bc6daf8acf7), antibody-modulator-binding-mechanism (57f1844f7868dd76).
