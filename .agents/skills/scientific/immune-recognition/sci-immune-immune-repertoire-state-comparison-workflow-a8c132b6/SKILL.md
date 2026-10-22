---
name: sci-immune-immune-repertoire-state-comparison-workflow-a8c132b6
description: Compare immune repertoires across biological states to infer whether observed differences reflect generation, selection, clonal expansion, or technical bias, using coarse primary screens followed by orthogonal resolution and representative direct validation.
scienceevolve-title: "Antibody and immune recognition · immune repertoire state comparison workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Use this skill to design an end-to-end research plan that compares immune repertoires across biological states and infers the mechanisms behind observed differences. The workflow separates repertoire generation from downstream selection, clonal expansion, and technical confounding through staged hypothesis generation, coarse screening, orthogonal resolution, and representative validation.

# When to use

Use this skill when the user asks to:

- Compare immune repertoires across exposure, development, disease, tissue, or time-course states.
- Distinguish whether repertoire differences arise from generation mechanisms, selection, clonal expansion, or assay artifacts.
- Design a non-operational study plan for repertoire diversity, clonal structure, or state-dependent composition changes.
- Iterate hypotheses based on convergent evidence from independent data streams.

Do not use this skill to provide clinical diagnosis, treatment advice, executable wet-lab protocols, or paper-specific parameter reproduction.

# Inputs required

Before producing a research plan, identify or request:

- The repertoire system and molecular feature class under study.
- The biological states, stages, or compartments being compared.
- Available data types and their resolution limits.
- Candidate mechanisms and expected contrasts.
- Reference repertoires and appropriate control groups.
- Ethical, privacy, and data-governance constraints.

If stage labels, group comparability, or measurement quality are unclear, state the minimum additional information needed before finalizing the plan.

# Core Workflow

1. **Frame the biological contrast**
   - Define the states to compare and the repertoire layer under study.
   - Identify the hidden structure that a single coarse screen cannot resolve.
   - Pre-register the primary outcome and interpretation rules before analysis.

2. **Generate mechanism-linked hypotheses**
   - Propose alternatives: generation bias, selection or filtering, clonal expansion, and technical artifact.
   - For each hypothesis, specify the expected pattern in the primary screen, the expected pattern after orthogonal resolution, and the predicted outcome of direct validation.
   - Rank hypotheses by biological importance, discriminability, and vulnerability to confounding.

3. **Execute a coarse primary screen**
   - Apply an efficient global method to capture repertoire structure.
   - Select candidate features using pre-defined rules, not post-hoc inspection.
   - **Decision gate:** If no reproducible contrast exists between states, stop and revisit group definitions or measurement quality.

4. **Apply orthogonal resolution**
   - Use an independent method to decompose selected features into hidden states.
   - Compare conditions expected to differ in diversity or expansion structure.
   - Classify features as simple, mixed, ambiguous, or artifact-like.
   - **Decision gate:** If the orthogonal method cannot resolve simple known cases or produces ambiguous patterns, stop and redesign the resolution strategy.

5. **Validate representative cases directly**
   - Test a subset of indirect signals with direct identification or functional readout.
   - **Decision gate:** If direct validation contradicts indirect inference, halt mechanistic claims and revise the hypothesis model.

6. **Separate mechanism classes**
   - Compare broad repertoire architecture across states: similar distributions suggest early generation establishment; divergence suggests downstream filtering.
   - Compare fine motif or clonal features: state-specific enrichment or depletion points to selection or expansion.
   - Normalize against appropriate references and assess robustness under alternative annotation rules.

7. **Iterate or terminate**
   - If convergent evidence supports one mechanism, raise confidence but maintain explicit boundary conditions.
   - If differences vanish under alternative annotation or normalization, prioritize technical bias hypotheses.
   - If controls fail, replication is absent, or the feature is too rare to interpret, stop mechanistic interpretation.
   - **Next-experiment rule:** choose the smallest validation that most directly discriminates the leading mechanism from its strongest alternative.

# Output Format

When using this skill, produce:

1. **Research question framing** — biological contrast, hidden structure, and why the primary screen alone is insufficient.
2. **Hypothesis table** — mechanism, evidence strength, key assumptions, predicted primary-screen pattern, predicted orthogonal-resolution pattern, validation prediction, and failure modes.
3. **Experimental design logic** — primary screen concept, feature selection strategy, orthogonal resolution method, controls, replication, success criteria, and stop conditions.
4. **Analysis plan** — quality control, specificity assessment, calibration strategy if applicable, composition comparison, robustness checks, and uncertainty quantification.
5. **Iteration plan** — how each possible result would support, weaken, or refute hypotheses, and the next minimal test.
6. **Validity and ethics statement** — confounders, reproducibility checks, boundary conditions, and compliance constraints.

# Validation Gates

- Primary-screen contrast is reproducible across replicates and independent of batch effects.
- Orthogonal resolution distinguishes simple from complex cases within selected features.
- Representative direct validation agrees with indirect inference.
- Controls (positive, negative, reference, and technical) rule out nonspecific detection and background artifacts.
- Calibration and normalization are validated before biological interpretation.
- Group definitions are biologically meaningful and comparable across states.

# Claim Boundaries

- Distinguish observed repertoire associations from inferred mechanisms.
- Treat structural or functional analogies as supportive, not conclusive.
- Report lower-bound estimates when exact enumeration is unsupported.
- Limit claims to the studied system, stage, and data type.
- Clearly separate source-paper method patterns from new agent inferences.

# Failure Modes

- Primary screen lacks reproducible contrast or is confounded by batch effects.
- Orthogonal assay cannot resolve known simple cases or is not independent of the primary screen.
- Representative validation contradicts indirect inference.
- Differences disappear under alternative annotation rules or reference normalization.
- Controls fail or group definitions are unreliable.
- Technical bias dominates biological signal.
- Rare features are overinterpreted without independent replication.
- Claims exceed evidence by requiring exact clone counts from lower-bound estimates.

# Validity Checks

- **State validity:** Are groups correctly labeled and biologically comparable?
- **Generation-vs-selection validity:** Does the design separate repertoire creation from downstream filtering?
- **Annotation validity:** Could feature calls change under reasonable alternative rules?
- **Control validity:** Do controls rule out nonspecific detection and broad phenotype effects?
- **Population validity:** Could source context, lineage composition, or sample structure explain the pattern?
- **Technical validity:** Could platform, recovery, or batch effects distort diversity estimates?
- **Orthogonal validity:** Does the second method measure a property independent of the primary screen?
- **Statistical validity:** Are uncertainty, multiple comparisons, and sample adequacy addressed?
- **Boundary validity:** Are claims limited to the studied system and data type?
- **Evidence-boundary validity:** Are source-paper observations separated from new inferences?

# Provenance

- Synthesized from cluster 11, subcluster 11.0.split0.
- Derived from source skills: repertoire-stage-filtering-research (168b0047b7190d95), antibody-repertoire-shift-discovery (33f4465490ddd799), repertoire-diversity-exploration (577275c5f0327f15), repertoire-assay-guided-research-design (f821cd72bc5fbdb8), immune-network-repertoire-dynamics (ff522e3257c504b1), b-cell-repertoire-ontogeny-research (ed3e649d7486387c), and antibody-carbohydrate-recognition-exploration (4b179e82dcc0c61f).
- Representative sources for this workflow: 33f4465490ddd799, 577275c5f0327f15, 168b0047b7190d95.
