---
name: sci-immune-repertoire-comparison-selection-inference-wo-2aaa359d
description: A reusable end-to-end workflow for comparing target and reference immune repertoires using sequence-level and distributional metrics to infer selection, restriction, cross-reactivity, or compartment-specific maintenance.
scienceevolve-title: "Antibody and immune recognition · repertoire comparison selection inference workflow"
scienceevolve-area: antibody-and-immune-recognition
---

# Purpose

Use this skill to design reusable, non-operational research workflows that compare target and reference immune repertoires to infer mechanisms such as selection, restriction, cross-reactivity, or compartment-specific maintenance. It guides hypothesis generation, controlled comparison, integrated analysis, and iterative validation while excluding source-specific parameters, operational protocols, and unsupported conclusions.

# When to use

Use this skill when the user asks to:
- Design a study comparing immune repertoires across conditions, phenotypes, tissues, compartments, or time points.
- Generate hypotheses about whether observed repertoire patterns reflect biological selection, restricted origin, convergent generation, shared expansion, or technical artifact.
- Plan non-operational validation strategies that distinguish global repertoire architecture from local sequence features.
- Critique whether a proposed repertoire comparison can separate mechanism from confounding or reference mismatch.

Do not use this skill to provide clinical advice, patient-specific recommendations, operational wet-lab protocols, executable high-risk procedures, or direct therapeutic guidance.

# Inputs required

Before designing the workflow, identify or request:

- **Target system:** biological population, condition, tissue, compartment, or phenotype under study.
- **Repertoire unit:** receptor type, chain, clonal definition, or molecular feature set to be compared.
- **Reference strategy:** matched baseline, cross-compartment, cross-phenotype, or generative-structure reference repertoires.
- **Candidate mechanisms:** selection, restriction, cross-reactivity, compartment-specific maintenance, developmental constraint, or other mechanistic models to compare.
- **Measurement modalities:** available sequence, expression, localization, functional, or paired readout types at a conceptual level.
- **Known confounders:** genetic background, age, developmental stage, tissue source, batch, platform, sample quality, and handling differences.
- **Scope and constraints:** ethics, biosafety, data governance, sample availability, and whether the goal is minimal validation or stronger mechanism discrimination.

# Core Workflow

Follow this ordered route from question framing to evidence classification. Apply decision gates and stop conditions at each step.

## 1. Frame the comparison question
- Define the target population and the specific repertoire deviation or pattern to be explained.
- Define one or more reference populations matched for biological and technical context.
- **Decision gate:** Stop and redesign if target and reference are mismatched on critical context variables (e.g., tissue, developmental stage, technical platform) and no adjustment strategy exists.

## 2. Establish the structural baseline
- Characterize the baseline repertoire architecture expected from generative constraints (gene availability, recombination structure, baseline diversity).
- Normalize observed features against this structural baseline before biological interpretation.
- **Decision gate:** Stop if structural normalization is impossible or if the reference repertoire is unavailable or inappropriate.

## 3. Select primary and pairing readouts
- Choose primary repertoire features (e.g., gene usage, diversity, mutation burden, CDR3 characteristics, clonal structure, recurrence).
- Choose at least one independent pairing readout (e.g., lineage marker, transcriptional state, localization, functional response) to distinguish independent generation from shared expansion or migration.
- **Decision gate:** Stop if only a single feature type is available and the resulting mechanism ambiguity exceeds the study's tolerance.

## 4. Generate competing hypotheses
- Propose mechanism hypotheses (e.g., selective enrichment, restricted origin, compartment-specific maintenance, convergent selection).
- Propose null and artifact hypotheses (e.g., reference mismatch, unnormalized structural bias, sampling artifact, batch effect, shared expansion without selection).
- For each hypothesis, assign evidence strength, state key assumptions, list likely failure modes, and define minimal discriminating predictions.
- **Decision gate:** Stop if the hypotheses are not mutually distinguishable given the planned readouts and controls.

## 5. Design minimal viable validation
- Define target-positive and background/target-negative groups.
- Specify controls: baseline/sham, negative (nonspecific), positive (detection competence), and mechanistic contrast (candidate component presence/absence).
- Define variables: independent (population, compartment, time), dependent (repertoire similarity, feature conservation, diversity), mechanistic (subset abundance, replacement status), confounder (genetics, batch, handling), and quality (coverage, reproducibility).
- Predefine evaluation metrics and stop conditions.
- **Stop conditions:** Halt if signal disappears after normalization, controls fail, reference is mismatched, technical artifacts dominate, or ethical/safety constraints are unmet.

## 6. Execute comparative analysis
- Audit sample provenance, quality, batch structure, and missingness.
- Perform global distributional comparison (similarity, distance, diversity, convergence).
- Perform local sequence-level comparison (feature gains/losses, mutation patterns, CDR3 similarity, clonal relatedness, recurrence).
- Conduct paired-feature analysis: use pairing readouts to separate shared ancestry from independent generation.
- Compare against background expectations and test artifact sensitivity.
- **Decision gate:** Stop if quality metrics fail, batch effects confound the comparison, or background/negative controls reproduce the target signal.

## 7. Discriminate mechanisms and integrate evidence
- Map observed patterns to the competing hypotheses.
- Distinguish global repertoire recovery/convergence from local feature conservation.
- Separate compartment-specific or phenotype-specific signals from systemic, technical, or confounded effects.
- Assess persistence or recurrence across independent biological units or time points.
- **Decision rule:** If one hypothesis is strongly supported by convergent evidence, plan orthogonal validation. If results are ambiguous, identify the bottleneck and redesign the next minimal discriminating test.

## 8. Iterate and test boundaries
- Update evidence strength for each hypothesis based on results.
- If the primary signal is absent, deprioritize the corresponding mechanism and examine reference mismatch or confounders.
- If the signal is artifact-prone, strengthen controls or assay design before biological interpretation.
- If the signal supports a mechanism, require independent replication or orthogonal confirmation before upgrading evidence strength.
- If the signal is restricted to a specific subset or context, narrow boundary conditions rather than generalizing.
- **Stop condition:** Abandon a hypothesis if its core assumptions are contradicted by independent validation or if it becomes indistinguishable from a simpler artifact explanation.

## 9. Classify and report evidence
- Label each conclusion by evidence strength (exploratory, weak, moderate, strong).
- Explicitly separate source-supported methodological patterns from new inferences generated for the user's question.
- State boundary conditions: applicable contexts, measurement limits, and remaining alternative explanations.
- Recommend the next minimal validation step or the conditions under which the research direction should change.

# Output Format

When using this skill, return results in the following structure:

1. **Research question** — Focused question, target population, and reference population.
2. **Competing hypotheses** — Mechanism, null, and artifact hypotheses with evidence strength, key assumptions, predicted signals, and failure modes.
3. **Experimental design** — Groups, controls, variables, minimal viable validation, and stop conditions.
4. **Analysis plan** — Global and local comparison strategy, paired-feature logic, background comparison, and artifact sensitivity checks.
5. **Iteration plan** — How supporting, null, conflicting, or artifact-laden results update each hypothesis and what the next discriminating test should be.
6. **Validity and ethics statement** — Confounders, reproducibility risks, boundary conditions, statistical caveats, and ethics or governance constraints.
7. **Evidence boundary** — What is supported by the transferable method pattern, what is a new inference, and what validation is required before stronger claims.

# Validation Gates

- **Reference matching gate:** Target and reference repertoires are sufficiently matched on biological and technical context, or mismatches are explicitly modeled.
- **Structural normalization gate:** Observed frequencies are interpreted relative to generative baseline architecture, not as absolute biological signals.
- **Hypothesis distinguishability gate:** Competing hypotheses make distinct predictions that can be separated with the planned readouts and controls.
- **Control adequacy gate:** Negative, positive, baseline, and mechanistic contrast controls are defined and expected to detect artifact or confounding.
- **Quality and batch gate:** Sample quality, coverage, and batch structure are audited before biological interpretation.
- **Mechanistic specificity gate:** The design distinguishes selection from persistence, source programming from environment, and shared expansion from convergent generation.
- **Replication and orthogonal gate:** Key claims are either replicated across independent units or supported by a non-discovery readout.

# Claim Boundaries

- Treat descriptive repertoire differences as observations requiring mechanistic interpretation, not as proof of selection or restriction.
- Do not infer disease causality, clinical applicability, or therapeutic relevance from repertoire patterns alone.
- Limit claims to the studied biological context, compartment, phenotype, and measurement modality.
- Separate source-supported methodological patterns from agent-generated inferences, and label required validation clearly.
- Avoid presenting single-study or single-cohort findings as field-wide consensus.

# Failure Modes

- **Reference mismatch:** Apparent biological signal is driven by unmatched reference repertoire structure or context.
- **Unnormalized structure:** Observed usage or diversity patterns reflect baseline generative constraints rather than biological selection.
- **Shared expansion misclassification:** Recurrent sequences are interpreted as convergent selection when they reflect clonal proliferation or common ancestry.
- **Artifact interpretation:** Batch effects, platform bias, sampling distortion, or contamination are mistaken for compartment-specific maintenance or restriction.
- **Overgeneralization:** Findings from one cohort, tissue, or model system are extrapolated to broader populations or clinical settings without validation.
- **Clinical overreach:** Preclinical repertoire patterns are treated as diagnostic, prognostic, or actionable without independent clinical validation.

# Validity Checks

- **Confounding:** Are genetics, age, developmental stage, tissue composition, sample handling, batch, or platform alternative explanations?
- **Reproducibility:** Are biological and technical replicates independent and consistent? Are analysis criteria predefined and documented?
- **Statistical validity:** Are effect sizes, uncertainty intervals, multiple comparisons, sample size, and sensitivity analyses reported?
- **Reference validity:** Is the reference repertoire matched for source, context, developmental stage, and technical platform?
- **Structural normalization:** Are observed frequencies interpreted relative to gene availability, recombination structure, or baseline architecture?
- **Mechanistic validity:** Does the design distinguish persistence from re-selection, source programming from selection environment, and correlation from necessity?
- **Boundary validity:** Are absence claims supported by adequate sensitivity and coverage? Are conclusions restricted to the studied system and time window?

# Provenance

- Synthesized from cluster 53, subcluster 53.1.split0.
- Derived from source skills: `d3305994cc01cd28` (natural-antibody-repertoire-recovery-workflow), `bbca9bfebce5920a` (repertoire-biology-research-design), `92618d3702f72b2e` (b-cell-idiotype-research-workflow), `578ad0fb3b9026d1` (atopic-ige-repertoire-exploration), `90629600b913ee8e` (immune-compartment-repertoire-function-workflow), `96619f7ca61e2ccf` (single-cell-repertoire-convergence-exploration), `a133fc9143c0e7e5` (transplant-tolerance-repertoire-exploration), `5c35c1c8dd606418` (membrane-ig-receptor-variant-targeting).
