---
name: sci-immune-antibody-therapeutic-engineering-workflow-1f6d3088
description: End-to-end research planning for antibody therapeutic engineering, from candidate discovery and modular fusion design to staged functional validation and pharmacokinetic optimization.
scienceevolve-title: "Antibody and immune recognition · antibody therapeutic engineering workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Guide agents in designing reusable, non-operational research plans for antibody-based therapeutic engineering. The workflow spans candidate discovery (e.g., intrabody or repertoire-derived binders), modular fusion-protein design, and staged validation to optimize specificity, function, and developability. It treats each stage as a hypothesis-driven decision gate rather than a fixed protocol.

# When to use

Use this skill when the user asks to:

- Generate research questions for intrabody discovery, modular antibody engineering, or fusion-protein design.
- Design staged validation studies for binding specificity, effector function, or pharmacokinetic behavior.
- Translate sequence, structural, or repertoire findings into testable therapeutic hypotheses.
- Iterate on candidate failure modes such as poor specificity, instability, or unexpected cross-reactivity.

Do not use this skill for clinical decision-making, patient-specific recommendations, operational laboratory protocols, or hazardous procedural details.

# Inputs required

Ask for or infer the following before producing a plan:

- **Target biology**: antigen class, epitope family, receptor context, or disease mechanism.
- **Candidate source**: repertoire data, engineered scaffold, known binder class, or computational prediction.
- **Design intent**: monospecific, multispecific, fusion protein, effector-modified format, or half-life extension strategy.
- **Available readouts**: binding, functional, structural, or pharmacokinetic assays at a conceptual level.
- **Constraints**: ethical, biosafety, regulatory, and institutional boundaries.

# Core Workflow

1. **Discovery & Candidate Generation**
   - Frame the therapeutic gap and target engagement hypothesis.
   - Mine repertoire, structural, or computational sources for candidate binders.
   - *Decision gate*: Are candidates available with plausible target accessibility? If no, pause for target validation or scaffold redesign.

2. **Modular Architecture Design**
   - Decompose the therapeutic into recognition, effector, and pharmacokinetic modules.
   - Select modular combinations that minimize mutual interference.
   - *Decision gate*: Does each module retain independent function conceptually? If no, iterate architecture before advancing.

3. **Specificity Validation**
   - Compare target-positive and target-negative binding under matched conditions.
   - Require orthogonal specificity evidence before advancing.
   - *Decision gate*: Is specific signal distinguishable from background? If no, enrich, redesign, or stop.

4. **Functional & Mechanistic Validation**
   - Test effector function, receptor engagement, or cellular activity with readouts independent of binding.
   - Diagnose binding-versus-function discordance by module layer.
   - *Decision gate*: Do functional and binding evidence converge? If no, inspect geometry, threshold, or integrity hypotheses.

5. **Contextual & Pharmacokinetic Assessment**
   - Evaluate stability, half-life, and off-target liability in relevant biological matrices.
   - Compare behavior across presentation contexts (e.g., cell-bound, soluble, tissue-like).
   - *Decision gate*: Are developability profiles compatible with therapeutic intent? If no, reformulate format or delivery.

6. **Integration & Iteration**
   - Rank candidates by specificity, function, context performance, and complementarity.
   - Assemble a compact panel; reject candidates without incremental value.
   - *Iteration rule*: Return to Stage 2 for modular rescue, Stage 3 for specificity optimization, or Stage 4 for functional tuning based on diagnosed failure mode.
   - *Stop condition*: Halt if critical assumptions fail, controls remain unresolved, or safety/ethics boundaries are breached.

# Output Format

When using this skill, respond with:

1. **Research question** – Mechanism-focused statement of the therapeutic gap.
2. **Hypothesis portfolio** – Table with hypothesis, evidence strength, key assumptions, failure modes, and minimal validation.
3. **Modular design plan** – Candidate architecture, module responsibilities, and predicted risks.
4. **Validation roadmap** – Stage-specific controls, readouts, decision gates, and stop conditions.
5. **Iteration strategy** – Rules for redesign, rescue, or abandonment based on stage outcomes.
6. **Boundary & safety checklist** – Non-operational constraints and ethical limits.

# Validation Gates

- Target-positive versus target-negative specificity must be established with matched controls before functional claims.
- Post-modification binding check required after any fusion, labeling, or detection modification.
- Orthogonal specificity evidence (competition, depletion, structural mapping, or modified/unmodified comparison) required before quantitative claims.
- Replicate variability must be quantified and separated from background before biological interpretation.
- Pharmacokinetic or contextual behavior must be assessed independently from in vitro binding.

# Claim Boundaries

- Distinguish sequence-supported claims from functional claims requiring direct validation.
- Limit conclusions to the tested target class, modular format, and biological context.
- Do not extrapolate from single-donor, single-clone, or single-species evidence to universal therapeutic utility.
- Separate paper-derived methodological patterns from new system-specific inferences.

# Failure Modes

- Target recognition failure due to epitope inaccessibility or conformational masking.
- Module disruption from fusion, labeling, or engineering that ablates binding or function.
- Nonspecific background dominating signal after enrichment or modification.
- Discordance between binding and functional readouts due to geometry, threshold, or assay artifacts.
- Context-dependent loss of activity in serum, tissue, or non-native presentation formats.
- Immunogenicity or instability risks not captured by initial binding assays.

# Validity Checks

- Are positive and negative controls matched except for the target determinant?
- Is total yield distinguished from active yield at each stage?
- Have confounders (batch effects, platform bias, sample handling) been addressed?
- Are hypotheses mechanism-based with explicit evidence strength labels?
- Does the plan avoid clinical recommendations and remain at a non-operational design level?
- Are hazardous or regulated procedures excluded from operational detail?

# Provenance

- Synthesized from cluster 71 / subcluster 71.0.split0.
- Source skills: transplantation-alloantibody-reagent-design, immune-repertoire-timing-discovery, ige-crosslinking-research-design, cell-bound-antibody-composition-research, immunoglobulin-constant-region-research-design, autoimmune-modified-epitope-discovery, mycobacterial-epitope-context-workflow, influenza-antibody-research-pattern.
