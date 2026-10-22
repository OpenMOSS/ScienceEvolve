---
name: sci-immune-molecular-recognition-mechanism-deconvolutio-40771975
description: A reusable end-to-end workflow for deconvolving binding, effector, and signaling layers in molecular recognition systems to generate hypotheses, design staged validation, and iterate on mechanism discovery without source-specific operational details.
scienceevolve-title: "Antibody and immune recognition · molecular recognition mechanism deconvolution workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Guide agents through a generalized, non-operational workflow for discovering and validating how molecular recognition systems translate target engagement into functional outcomes. The workflow separates binding, effector, and signaling layers to prevent conflating correlation with mechanism, and supports disciplined iteration from initial hypothesis to bounded claim across antibodies, receptors, ligands, scaffolds, and effector systems.

# When to use

Use this skill when:

- Exploring how target recognition leads to downstream functional effects across biologics, small molecules, or modular protein systems.
- Designing non-operational research plans that must distinguish binding, effector recruitment, direct signaling, context dependence, and selectivity.
- Converting observed phenotypes into staged mechanism-discovery workflows with strong controls and clear stop conditions.
- Evaluating whether multi-layer evidence supports a causal model rather than a correlational one.

Do not use this skill for clinical recommendations, patient-specific treatment decisions, operational laboratory protocols, or claims that a single study establishes field-wide consensus.

# Inputs required

Before producing a research plan, request or infer:

- **Biological context and target system**: receptor family, antigen, cell-surface marker, structural protein, or relevant molecular target.
- **Candidate recognition module or modulator class**: antibody, scaffold, small molecule, cytokine fusion, or other targeting modality.
- **Known or hypothesized mechanistic gap**: why current understanding or molecules are insufficient (e.g., incomplete response, off-target risk, unclear signaling).
- **Available evidence**: binding data, signaling readouts, functional assays, structural models, literature benchmarks, or preliminary observations.
- **Constraints**: model limitations, biosafety and ethics boundaries, species differences, and acceptable evidence depth.
- **Decision purpose**: mechanism discovery, selectivity validation, architecture comparison, or translational feasibility assessment.

If any input is missing, state assumptions explicitly and label them as inferred rather than evidence-backed.

# Core Workflow

Follow this ordered end-to-end route. Apply decision gates at each stage; stop or redesign if a gate fails.

## 1. Gap framing and layer deconvolution

- Define the performance or knowledge gap in the target system.
- Separate the problem into interpretable layers: target recognition/binding, membrane or complex organization, effector recruitment or bridging, proximal signaling, direct signaling, phenotypic outcome, and translational plausibility.
- Identify the design variables or modulator features that could plausibly alter one layer without confounding others.

**Decision Gate 1 — Tractability**: Is the gap addressable by deconvolving binding, effector, and signaling layers? If the gap is purely clinical or logistical, stop and redirect.

## 2. Hypothesis generation and causal mapping

- Generate competing, layer-specific hypotheses:
  - **Recognition hypothesis**: a design change alters target engagement or specificity.
  - **Effector hypothesis**: a design change alters secondary mechanism recruitment.
  - **Direct-signaling hypothesis**: a design change alters target-cell state without secondary components.
  - **Context-dependence hypothesis**: performance depends on target abundance, membrane organization, cell state, or effector background.
  - **Architecture/format hypothesis**: valency, scaffold, or spatial organization changes function while preserving specificity.
- Map the proposed causal chain from molecular feature → target engagement → early signal → functional outcome.
- For each hypothesis, assign evidence strength (strong, moderate, weak, speculative), state key assumptions, identify likely failure modes, and define the minimal validation needed.

**Decision Gate 2 — Falsifiability**: Are the hypotheses discriminable with available or attainable evidence? If no hypothesis can be falsified, refine the design variables or acquire more input data before proceeding.

## 3. Staged validation design

Structure validation as a decision tree with escalating commitment:

- **Stage A — Assembly/recognition integrity** (when modular): Confirm that the targeting component retains intended specificity and that the effector/signaling component remains competent after any format change.
- **Stage B — Target engagement and specificity**: Compare target-positive versus target-negative contexts; include inactive or irrelevant-target comparators. Treat binding as a gate, not a final predictor.
- **Stage C — Proximal signaling and mechanism triangulation**: Measure early pathway activation before downstream phenotype. Use perturbation and rescue logic to test receptor or pathway dependence. Distinguish direct signaling from effector-driven mechanisms.
- **Stage D — Functional outcome and context boundaries**: Assess phenotypic effects across relevant biological backgrounds. Include viability, stress, and nonspecific-activation checks.

Define controls for each stage:
- Positive controls: established activators or benchmark molecules.
- Negative controls: unrelated specificity, non-engaging variants, or vehicle baseline.
- Effector/pathway controls: conditions that separate direct effects from secondary mechanisms.
- Background controls: multiple target or effector contexts when variability is plausible.

Define stop conditions:
- Stop if target engagement is absent, effects are nonspecific, activity appears only in one unrepresentative context, mechanistic controls contradict the hypothesis, or safety/ethics concerns outweigh benefit.

**Decision Gate 3 — Stage-wise progression**: Does evidence at the current stage justify advancing to the next layer? If not, iterate on the failed layer before adding complexity.

## 4. Control-first execution and layered analysis

- Predefine primary and secondary endpoints before interpreting results.
- Confirm control behavior before analyzing candidate differences.
- Analyze in layers:
  1. **Binding–function comparison**: Does target engagement predict functional outcome? If not, investigate epitope geometry, target organization, effector recruitment, or internalization.
  2. **Effector versus direct signaling**: Does activity require secondary mechanisms or persist without them?
  3. **Temporal ordering**: Does proximal signaling precede downstream phenotype?
  4. **Context analysis**: Treat variability across backgrounds as boundary-condition information, not noise.
  5. **Specificity assessment**: Compare candidate with inactive controls and related targets/receptors.

**Decision Gate 4 — Control integrity**: Do positive and negative controls behave as expected? If controls fail, halt interpretation and redesign the assay logic.

## 5. Mechanism discrimination and evidence integration

- Integrate orthogonal readouts (binding, signaling, functional, structural, contextual).
- Exclude alternative mechanisms by testing whether perturbation blocks the response and rescue restores it.
- Classify each claim as validated, partially supported, unsupported, or artifact-prone.
- Require convergence across at least two independent evidence streams before upgrading confidence.

**Decision Gate 5 — Mechanistic convergence**: Do multiple independent assays support the same causal model? If evidence streams disagree, keep alternative models active and do not overclaim.

## 6. Iteration or redesign

Update the research program based on the weakest validated link:

- **Binding absent or impaired**: Redesign the recognition module, format, or target accessibility assumptions.
- **Binding present but function absent**: Revisit effector coupling, signaling competence, delivery/trafficking, or readout sensitivity.
- **Function present but nonspecific**: Strengthen negative controls; investigate aggregation, scaffold artifacts, or off-target activation.
- **Context-specific activity**: Define the boundary condition explicitly and test generalizability before broader claims.
- **Mechanistic contradiction**: Split the hypothesis, test competing explanations, and redesign the next experiment to discriminate them.

After each cycle, produce a revised hypothesis table with updated evidence strength, revised mechanism, next minimal validation, and stop criteria.

**Decision Gate 6 — Stop/continue**: Has a hard stop condition been met (nonspecific toxicity, irreproducible results, ethical boundary, or unresolvable confounding)? If yes, terminate the design path.

## 7. Claim bounding and reporting

- Label every conclusion by evidence layer: binding evidence, in vitro functional evidence, mechanism evidence, in vivo plausibility, or clinical relevance.
- State extrapolation boundaries explicitly (tested targets, scaffolds, models, readout classes).
- Separate source-paper observations from agent-generated inferences.
- Do not advance to clinical, veterinary, or organism-level benefit claims without direct, appropriately validated evidence.

# Output Format

Return results in this structure:

1. **Research question** — One concise question linking the molecular recognition gap to a design or mechanism challenge.
2. **Gap and rationale** — Existing limitation, proposed design principle, and whether the rationale is evidence-backed or inferred.
3. **Hypotheses** — Table with columns: hypothesis, mechanism, evidence strength, key assumption, likely failure mode, and minimal validation.
4. **Staged validation plan** — Stage A–D outline, experimental arms, variables, controls, metrics, and stop conditions.
5. **Analysis plan** — Control review, binding-function comparison, effector/direct signaling discrimination, context analysis, temporal ordering, and evidence classification rules.
6. **Iteration plan** — Rules for updating or stopping the hypothesis after positive, negative, or ambiguous results.
7. **Validity and safety notes** — Confounders, reproducibility concerns, ethical boundaries, translational limits, and claims that must not be made.

# Validation Gates

- **Gate 1 — Tractability**: The gap can be addressed by deconvolving binding, effector, and signaling layers.
- **Gate 2 — Falsifiability**: Hypotheses are discriminable and testable with minimal viable validation.
- **Gate 3 — Stage-wise progression**: Evidence at each stage justifies advancing to the next layer.
- **Gate 4 — Control integrity**: Positive and negative controls behave as expected before candidate interpretation.
- **Gate 5 — Mechanistic convergence**: At least two orthogonal evidence streams support the proposed mechanism.
- **Gate 6 — Context robustness**: Results are reproducible across independent runs or biologically relevant backgrounds, or context limits are explicitly defined.
- **Gate 7 — Safety and ethics**: The plan remains within non-operational research design and approved oversight boundaries.

# Claim Boundaries

- Binding evidence alone does not imply functional mechanism.
- In vitro or preclinical functional evidence does not imply clinical efficacy or safety.
- Single-study or single-system observations do not constitute field consensus.
- Correlation between design features and function is not causal without perturbation and rescue logic.
- Agent-generated inferences must be separated from source-paper observations.
- Architecture, format, or scaffold superiority claims are bounded to the tested target, effector, and model context.

# Failure Modes

- **Recognition failure**: Target engagement is absent, lost after format change, or nonspecific.
- **Effector decoupling**: Binding occurs but downstream effector or signaling response is unchanged, indicating a broken causal link.
- **Context collapse**: Activity is observed only in one unrepresentative background or disappears across biologically relevant contexts.
- **Nonspecific activation**: Functional effects appear in target-negative controls or are driven by toxicity, stress, aggregation, or assay artifacts.
- **Mechanistic contradiction**: Perturbation or rescue experiments contradict the proposed causal path.
- **Assay artifact dominance**: Results depend on detection interference, batch effects, preparation heterogeneity, or instrument artifacts rather than biology.
- **Over-extrapolation**: Advancing translational, clinical, or organism-level claims beyond the evidence boundary.

# Validity Checks

- **Confounding check**: Could receptor density, species mismatch, endogenous ligands, matrix effects, batch variation, scaffold properties, or preparation artifacts explain the result?
- **Specificity check**: Are target-negative, irrelevant-target, inactive-modulator, and non-engaging controls included and interpretable?
- **Mechanistic coherence check**: Do binding, signaling, and functional data point to the same causal model?
- **Reproducibility check**: Are independent replicates, orthogonal assays, and variability reporting planned?
- **Statistical validity check**: Are endpoints predefined, effect sizes reported with uncertainty, and multiple comparisons accounted for?
- **Boundary check**: Are claims limited to tested targets, scaffolds, models, and readout classes?
- **Evidence separation check**: Are source-paper observations distinguished from agent-inferred hypotheses?
- **Translational caution check**: Are clinical, veterinary, or organism-level benefit claims avoided without direct, validated evidence?

# Provenance

- Synthesized from cluster 49 / subcluster 49.1.split0.
- Derived from source skills: antibody-functional-deconvolution-exploration (`4f46c03d904d50a6`), small-molecule-receptor-research-workflow (`c93dae50f9c3bb77`), immune-engaging-biologic-architecture-exploration (`9bcf968f018e1ec7`), target-selective-immunotoxin-research-design (`23656248e36bae18`), targeted-cytokine-research-workflow (`758d700d69956b82`), modular-targeted-protein-research-design (`a84fc2c7ff7a4697`), extracellular-matrix-domain-probe-research (`d6d4c51f7bc1fa1e`), receptor-modulating-biologics-research (`37156c07cefabdfd`).
- Excluded skill IDs: `051cff5f0dfe3da2`, `063db8db9a3b7d2e`, `0cbada66718b96d7`, `5f0b8eee68b7ed71`, `cd9be2eba36d99de`.
