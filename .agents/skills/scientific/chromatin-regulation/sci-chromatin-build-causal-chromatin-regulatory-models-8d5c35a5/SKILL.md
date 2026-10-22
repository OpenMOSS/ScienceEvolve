---
name: sci-chromatin-build-causal-chromatin-regulatory-models-8d5c35a5
description: A reusable end-to-end workflow for designing mechanism-discovery studies that move from chromatin or epigenetic associations to causal, validated regulatory models through layered perturbation, multi-modal evidence, and iterative claim bounding.
scienceevolve-title: "Chromatin and epigenomic regulation · build causal chromatin regulatory models with perturbations"
scienceevolve-area: chromatin-and-epigenomic-regulation
---

# Purpose

Help an agent transform a chromatin, epigenetic, enhancer, or regulatory-element association into a rigorous, testable causal model. The workflow guides hypothesis generation, mechanistic decoupling, discriminating perturbation design, multi-layer validation, and iterative refinement without prescribing system-specific operational protocols.

# When to use

Use this skill when the user asks to:

- Propose new research questions that move from correlation to causation in gene regulation, chromatin dynamics, or enhancer function.
- Design conceptual studies distinguishing regulatory marks, factor recruitment, catalytic activity, and transcriptional output.
- Plan validation for a candidate regulator–effector–phenotype chain in any biological system.
- Interpret multi-omics or perturbation data to classify mechanistic support.
- Iterate or pivot after initial results are supporting, weak, contradictory, or context-dependent.

Do not use this skill to generate clinical advice, treatment recommendations, executable wet-lab protocols, hazardous procedural details, or field-wide consensus claims from single studies.

# Inputs required

Before executing the workflow, collect or infer:

- **Biological context**: cell type, tissue, developmental stage, disease state, or environmental condition.
- **Candidate regulatory unit**: enhancer, promoter, chromatin domain, regulatory RNA, or epigenetic mark.
- **Observed association**: the correlation or pattern that motivates the mechanistic question.
- **Candidate mechanistic layers**: factor recruitment, enzymatic activity, chromatin state, accessibility, transcription factor binding, or 3D architecture.
- **Available readouts**: chromatin, occupancy, expression, nascent transcription, phenotype, or interaction data.
- **Boundary conditions**: known limits on generalizability, confounders, and ethical or biosafety constraints.

If inputs are missing, state assumptions explicitly and flag the plan as provisional.

# Core Workflow

Execute the following ordered route. Pause at each gate; redesign or stop if criteria are not met.

## Step 1: Reframe the association into causal alternatives
Convert the starting observation into at least two non-equivalent mechanistic explanations (e.g., mark-dependent, recruiter-dependent, activity-dependent, context-dependent, or architecture-dependent).

**Gate 1**: Are the alternatives falsifiable and distinguishable by conceptual contrasts? If no, reformulate the question.

## Step 2: Generate paired competing hypotheses
For each alternative, produce:

- Hypothesis statement.
- Evidence strength (speculative / weak / moderate / strong).
- Key assumptions and boundary conditions.
- Predicted experimental contrast.
- Likely failure modes and non-mechanistic alternatives.

## Step 3: Design discriminating contrasts and controls
Plan conceptual perturbations that separate mechanistic layers:

- Factor-loss vs. activity-loss vs. binding-loss logic.
- Rescue or restoration contrast.
- Matched negative, positive, specificity, and state controls.

**Gate 2**: Does the design avoid operational hazards and remain non-clinical? If no, redesign.

## Step 4: Plan multi-layer readouts
Define readouts across distinct layers without collapsing them:

- Chromatin state / accessibility.
- Factor occupancy or recruitment.
- Regulatory-element activity (e.g., enhancer RNA, reporter).
- Target-gene transcription.
- Phenotype or functional output.

Keep structural and functional evidence separate in the analysis plan.

## Step 5: Validate perturbation specificity
Before interpreting results, confirm that the intervention altered the intended layer without broad cell-state collapse, global toxicity, or off-target effects.

**Gate 3**: Is the perturbation specific? If no, stop and redesign.

## Step 6: Integrate evidence and classify causal patterns
Map results onto the causal chain and classify:

- **Supported**: perturbation specificity + concordant multi-layer changes + rescue.
- **Partially supported**: some layers align but rescue or direct evidence is missing.
- **Unsupported / ambiguous**: discordance, confounding, or insufficient power.

Use discordance diagnostically (e.g., mark loss without function loss implies the mark may be nonessential or downstream).

## Step 7: Iterate, rescue, or pivot
- If supported: strengthen with orthogonal assays, test boundary conditions (cell type, stage, stimulus), and narrow the claim to the validated link.
- If weak: identify the weakest layer and design the minimal additional contrast to test it.
- If contradictory: generate alternative hypotheses (different effector, indirect regulation, compensatory pathway, or wrong target assignment).
- If context-dependent: formulate boundary conditions rather than universal conclusions.

**Gate 4**: After iteration, is the claim still falsifiable and bounded? If no, stop.

## Step 8: Bound and document the final claim
State exactly which mechanistic link is supported, under what conditions, and what remains unresolved. Label evidence as directly observed, inferred, or speculative.

# Output Format

Return the completed workflow in this structure:

1. **Research question** — concise causal question and biological context.
2. **Evidence map** — supported, inferred, and untested links in the proposed chain.
3. **Hypotheses** — main and competing hypotheses with evidence strength, assumptions, and failure modes.
4. **Conceptual experimental design** — discriminating contrasts, controls, variables, and metrics.
5. **Analysis plan** — layer-by-layer integration rules, discordance interpretation, and evidence classification.
6. **Iteration plan** — next steps for supported, weak, contradictory, or context-dependent results.
7. **Validity and safety statement** — confounders, reproducibility needs, boundary conditions, and non-clinical limits.

# Validation Gates

- **Falsifiability gate (Step 1)**: The question must permit a result that contradicts the hypothesis.
- **Design safety gate (Step 3)**: The plan must remain conceptual and avoid executable high-risk operations.
- **Specificity gate (Step 5)**: Perturbation must be shown to act on the intended target layer before mechanistic claims are made.
- **Claim-stability gate (Step 7)**: Iterated claims must not extrapolate beyond the tested context without independent validation.

# Claim Boundaries

- Distinguish **correlation**, **necessity**, **sufficiency**, and **downstream consequence**; never present one as another.
- Limit **direct regulation** claims to cases with regulatory-interface or rescue evidence.
- Restrict **generalizability** to the tested cell type, element class, developmental stage, and condition unless replication exists.
- Separate **in vitro / model-system** findings from clinical or organism-level interpretations.
- Label computational predictions and single-study observations as hypothesis-generating.

# Failure Modes

- **Non-specific perturbation**: broad stress, toxicity, or cell-state collapse masquerading as locus-specific regulation.
- **Confounding by composition**: tissue heterogeneity, batch effects, or cell-identity shifts explain the apparent regulatory change.
- **Temporal misalignment**: the proposed cause does not precede the proposed effect.
- **Indirect mechanism**: expression change is mediated by an unmeasured intermediate, not the proposed direct link.
- **Context overreach**: a mechanism valid in one condition is assumed universal.
- **Insufficient power**: weak or unreplicated effects are treated as definitive.

# Validity Checks

Before finalizing any output, verify:

- **Confounders**: cell composition, batch, disease stage, genetic background, and co-exposures are addressed.
- **Reproducibility**: independent replication, orthogonal perturbation, and pre-specified analysis criteria are included.
- **Statistical validity**: appropriate comparators, variability estimation, multiple-testing correction, and effect-size interpretation.
- **Mechanistic specificity**: direct-target evidence is not inferred from expression change alone.
- **Rescue logic**: mediation is not claimed without effector-level perturbation and rescue/restoration evidence.
- **Boundary conditions**: cell type, disease subtype, pathway state, and developmental window are stated.
- **Safety and ethics**: the plan remains non-clinical and does not enable hazardous experimentation.

# Provenance

Derived from cluster 8 / subcluster 8.0 via semantic synthesis of the following source skills:

- `hcc-mirna-target-axis-discovery`
- `enhancer-mark-causality-research-design`
- `prenatal-epigenome-research-design`
- `ep-hub-research-design`
- `viral-epigenetic-immune-evasion-research-design`
- `metabolite-epigenetic-microglia-research`
- `chromatin-tf-recruitment-plant-development`
- `fungal-chromatin-context-gene-regulation`
