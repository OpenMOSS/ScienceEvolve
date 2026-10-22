---
name: sci-neuro-homeostatic-neural-synaptic-plasticity-mechan-31078369
description: Design and iterate falsifiable research plans for neural plasticity, homeostatic resilience, and synaptic mechanism discovery across scales and modalities.
scienceevolve-title: "Neuromorphic computing and Ising optimization · homeostatic neural synaptic plasticity mechanism discovery"
scienceevolve-area: neuromorphic-computing-and-ising-optimization
---

# Purpose

Transform a neuroscience question about plasticity, homeostasis, or state-dependent circuit resilience into a structured, non-operational research workflow. The goal is to generate mechanistic hypotheses, design minimal validation studies with strong controls, and iterate between evidence and causal models without overgeneralizing from any single system.

# When to use

- The user asks to design research questions or experiments about neural plasticity, homeostatic regulation, synaptic or circuit adaptation, developmental activity patterns, or neuron–glia feedback.
- The task requires converting an observed association or phenotype into testable mechanistic hypotheses and a validation plan.
- The user wants to connect molecular, cellular, electrophysiological, imaging, behavioral, or computational readouts into one coherent workflow.
- The user needs to distinguish activity-dependent compensation, degenerate mechanisms, state-dependent tuning, or multi-module interactions.

Do not use this skill for clinical diagnosis, treatment recommendations, operational laboratory protocols, or high-risk procedural instructions.

# Inputs required

- **Target system**: species, model, developmental stage, brain region, circuit, or cell type.
- **Stable output or phenotype**: the function to preserve or the plasticity-related change to explain.
- **Perturbation or state variable**: the activity pattern, stress, experience, or manipulation that challenges stability.
- **Candidate modules**: neuronal, synaptic, glial, extracellular, vascular, metabolic, or immune components relevant to the question.
- **Available evidence**: prior findings, datasets, models, or literature with notes on species, modality, and causality.
- **Constraints**: ethical boundaries, feasibility limits, measurement access, and whether the work is exploratory, mechanistic, or translational.
- **Exclusion boundaries**: e.g., no clinical advice, no operational parameters, no high-risk procedures.

# Core Workflow

## Stage 1 — Frame the problem and define the output
1. Define the target stable output (e.g., firing pattern, rhythm, synaptic weight, behavioral state) or the plasticity phenotype to explain.
2. Specify the perturbation axis (e.g., activity shift, energy stress, developmental transition, sensory experience).
3. Identify the explanatory gap: what observation lacks a validated mechanism?
4. **Decision gate — Scope gate**: If the output cannot be measured reproducibly or the perturbation lacks specificity, stop and refine the question.

## Stage 2 — Map modules and generate mechanistic hypotheses
1. Reframe the unit of analysis from single components to interacting modules (e.g., neuron–synapse–glia–matrix–vascular units).
2. For each candidate mechanism, specify a directed causal chain: trigger → mediator → affected module → predicted outcome → measurable endpoint.
3. Generate 2–4 competing hypotheses. For each, record:
   - Evidence strength (strong / moderate / weak / speculative).
   - Key assumptions.
   - Predicted direction and timing of change.
   - Likely failure modes.
   - Boundary conditions where the hypothesis should not extrapolate.
4. Include at least one alternative explanation that does not rely on the primary mechanism (e.g., non-specific stress, developmental drift, compensatory redundancy).
5. **Decision gate — Candidate gate**: If hypotheses are not falsifiable or cannot be distinguished with available readouts, return to Stage 1 and narrow the scope.

## Stage 3 — Design minimal viable validation
1. Define the smallest experiment or analysis that can test the primary causal contrast:
   - Independent variable: perturbation class or state.
   - Dependent variables: functional, structural, molecular, or computational readouts aligned with the causal chain.
   - Mediators: candidate regulatory variables that could mediate the effect.
2. Specify a control hierarchy:
   - Baseline/unperturbed control.
   - Perturbation-only control to estimate direct effects.
   - Negative control (orthogonal or inactive condition).
   - Specificity control (targeting the proposed mediator without broad non-specific effects).
   - Positive benchmark (validating assay sensitivity, not the novel claim).
   - Confounding controls (batch, stage, region, sex, circadian state, handling).
3. Predefine evaluation metrics and stop conditions (e.g., underpowered contrast, failed controls, uninterpretable baseline drift).
4. **Decision gate — Feasibility gate**: If the design cannot separate the mechanism from its strongest alternative with acceptable risk, redesign or stop.

## Stage 4 — Analyze with layer separation and model comparison
1. Pre-register primary contrasts, exclusion rules, and failure criteria before testing.
2. Quality-check data separately from hypothesis testing (missingness, batch effects, baseline stability, control behavior).
3. Analyze by mechanism layer in order:
   - Test whether the trigger alters the functional readout.
   - Test whether the mediator changes as predicted.
   - Test whether mediator manipulation alters the functional readout.
   - Link lower-layer changes to higher-layer consequences only after lower-layer controls pass.
4. Compare competing models (e.g., presynaptic vs. postsynaptic, acute vs. chronic, activity-dependent vs. modulatory, single-module vs. multi-module).
5. Require multimodal convergence: mechanistic claims must survive consistency checks across at least two independent readout classes.
6. Quantify uncertainty (effect sizes, intervals, sensitivity analyses) and visualize causal structure.
7. **Decision gate — Robustness gate**: If controls fail, if the effect is non-specific, or if competing models fit equally well, classify the result as uninterpretable and diagnose before proceeding.

## Stage 5 — Discriminate mechanisms and bound claims
1. Evaluate whether the evidence supports correlation, necessity, sufficiency, or none.
2. Rule out alternative explanations using the pre-registered specificity and negative controls.
3. Bound the claim explicitly by species, developmental stage, brain region, cell type, time scale, and measurement modality.
4. **Decision gate — Mechanism exclusion gate**: If the strongest alternative cannot be excluded, mark the conclusion as ambiguous and retain competing models.

## Stage 6 — Iterate or redesign
1. **If supported**: Increase evidence strength; test a more specific sub-mechanism or an orthogonal boundary condition (e.g., different stage, region, or stress level).
2. **If null**: Diagnose whether the failure reflects hypothesis mismatch, measurement insensitivity, weak manipulation, or confounding; redesign the minimal viable test before expanding.
3. **If mixed or conflicting**: Update the causal graph by adding moderators (e.g., baseline activity, cell-type heterogeneity, prior history) or splitting one broad hypothesis into narrower alternatives.
4. Define the next smallest experiment or analysis that would most reduce uncertainty.
5. **Decision gate — Iteration gate**: If uncertainty remains and a feasible next test is defined, return to Stage 2 or 3. If no feasible test exists, stop and report bounded uncertainty.

# Output Format

When using this skill, return:

1. **Research question framing**: target system, gap, and why the question matters.
2. **Candidate hypotheses**: 2–4 hypotheses with evidence strength, key assumptions, predicted outcomes, competing predictions, and failure modes.
3. **Causal model diagram**: a compact directed graph or table linking trigger, mediator, module, and endpoint.
4. **Minimal viable validation plan**: variables, control hierarchy, temporal structure, metrics, and stop conditions.
5. **Analysis plan**: pre-registered contrasts, layer-by-layer testing, competing-model comparison, multimodal convergence criteria, and uncertainty reporting.
6. **Iteration plan**: rules for updating hypotheses after positive, negative, null, non-specific, or conflicting results.
7. **Validation and safety notes**: confounders, reproducibility checks, translation boundaries, and ethics constraints.
8. **Claim boundary statement**: what the study can support and what it cannot support, including species, stage, and modality limits.

# Validation Gates

Before advancing past each stage, confirm:

- **Scope validity**: the question addresses a defined phenomenon, not an entire disease or whole-brain process.
- **Mechanistic clarity**: each link identifies a mediator and predicted direction of change.
- **Control adequacy**: baseline, negative, specificity, and confounding controls are included and matched.
- **Temporal alignment**: measurements occur on the time scale relevant to the proposed mechanism.
- **Multimodal convergence**: at least two readout classes can test the same mechanism.
- **Statistical validity**: primary endpoints are pre-registered, multiple comparisons are controlled, and uncertainty is reported.
- **Reproducibility**: preprocessing, exclusion criteria, and randomization logic are documented before analysis.

# Claim Boundaries

- Do not infer synaptic or molecular mechanisms from behavioral or imaging signals alone.
- Do not generalize from one species, developmental stage, or model system to others without independent validation.
- Do not present single-source findings as field-wide consensus.
- Distinguish acute perturbation effects from chronic adaptation or developmental tuning.
- Mark animal-to-human, cellular-to-network, and cross-disease transfers as hypotheses requiring separate validation.
- Keep clinical or therapeutic implications as long-term possibilities only, with explicit safeguards.

# Failure Modes

Stop or redesign when:

- The primary contrast is underpowered or uninterpretable.
- Safety, consent, privacy, or regulatory boundaries are unclear.
- Measurements cannot separate the proposed mechanism from non-specific stress, arousal, circadian, or fatigue effects.
- A negative result would not falsify the hypothesis.
- Controls fail or show broad non-specific effects.
- The model permits too many incompatible mechanisms without additional constraints.
- The design requires high-risk operational details outside approved protocols.

# Validity Checks

- **Confounding**: evaluate developmental stage, prior activity, circadian phase, stress, anesthesia, batch effects, and tissue quality.
- **Measurement validity**: verify that each readout measures the intended construct and is not a proxy for fatigue, vigilance, movement, or viability.
- **Causal validity**: distinguish correlation from manipulation-based evidence; avoid inferring mechanism from a single readout or layer.
- **Cell identity**: confirm that comparisons are made within well-defined cell types or circuit roles.
- **Variability treatment**: treat biological variability as data; test whether heterogeneous parameter sets produce equivalent outputs rather than discarding variation as noise.
- **Boundary conditions**: state whether claims apply to the tested context only or to related systems, and under what conditions the mechanism may fail.

# Provenance

This skill was synthesized from cluster 8.1 (plasticity-homeostatic-neural-synaptic-mechanism-discovery-workflow) of the scientific skills codex. Source skills contributing to the merge include: sleep-plasticity-research-workflow; synaptic-plasticity-systems-research; neuroscience-homeostatic-variability-research; hypoxia-neural-circuit-plasticity-workflow; homeostatic-excitability-research-design; synaptic-plasticity-research-workflow; developmental-neural-activity-research-workflow; and purinergic-microglia-neuron-feedback-exploration. Paper-specific conclusions, parameters, and operational protocols were excluded during synthesis.
