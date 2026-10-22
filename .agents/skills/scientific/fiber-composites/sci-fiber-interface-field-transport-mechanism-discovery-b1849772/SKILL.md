---
name: sci-fiber-interface-field-transport-mechanism-discovery-b1849772
description: A reusable end-to-end workflow for generating, discriminating, and validating mechanism hypotheses in systems governed by interfacial transport, field gradients, and structured material architectures.
scienceevolve-title: "Fiber composites and battery materials · interface field transport mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Use this skill to turn an observed pattern, anomaly, or performance gap into a rigorous, testable mechanism hypothesis and validation plan. It guides an agent through decomposing competing explanations, designing minimal controlled comparisons, triangulating evidence across models and observations, and iterating until claims are bounded by evidence. The workflow is abstracted from research on interfacial transport, field-driven processes, fiber and electrode architectures, soft-matter arrest, and structured-material damage tolerance.

# When to use

Use this skill when the user asks to:

- Explain an unexpected spatial pattern, transport reversal, morphology change, or property tradeoff in a structured material or interfacial system.
- Propose new research questions that link an observable to an underlying mechanism involving gradients, fields, interfaces, or architecture.
- Design non-operational validation studies with explicit controls, metrics, and stop conditions.
- Compare candidate mechanisms using minimal models, simulations, or controlled experiments.
- Iterate a study design after an initial result supports, weakly supports, or contradicts the leading hypothesis.

Do not use this skill for executable laboratory recipes, hazardous operating procedures, fabrication parameters, or as a source of field-wide consensus.

# Inputs required

Before generating a plan, identify or request:

- **Target system class**: the general category of material or process (e.g., particulate dispersion, fibrous jet, electrochemical interface, soft assembly, layered composite, or conductive network).
- **Observable anomaly or gap**: the spatial, temporal, or performance pattern that needs explanation.
- **Candidate mechanisms**: known or suspected drivers such as gradient coupling, field redistribution, interfacial transport, architectural change, defect formation, or competing phase behavior.
- **Evidence inventory**: prior literature, preliminary data, simulation outputs, imaging, or qualitative observations.
- **Constraints**: safety boundaries, available modeling tools, conceptual vs. computational vs. experimental-design scope, and reproducibility requirements.
- **Success criteria**: what would count as convincing mechanism support, a falsified hypothesis, or a boundary condition.

# Core Workflow

Follow this ordered route. Do not skip decision gates.

1. **Frame the observable and gap**
   - Convert the user’s observation into a precise, measurable pattern.
   - State why standard explanations are insufficient.
   - *Decision gate*: If the observable cannot be defined quantitatively, stop and request clarification.

2. **Decompose candidate mechanisms**
   - List all physically plausible drivers that could produce the pattern.
   - Separate baseline/background contributions from the target coupling.
   - For each candidate, draft a mechanism statement: “If driver X dominates under condition Y, then observable Z should change in direction W.”
   - *Stop condition*: If only one mechanism is possible and untestable, redesign the question to make it falsifiable.

3. **Build a minimal discriminatory model**
   - Construct the simplest model (analytical, numerical, or conceptual) that can produce contrasting predictions for the top candidates.
   - Identify the key inequality, sign change, scaling relation, or regime boundary that separates mechanisms.
   - *Decision gate*: If the model cannot discriminate candidates, simplify the observable or add a control variable.

4. **Design staged validation**
   - **Stage 1 – Conceptual**: Define variables, controls, and predicted metric patterns without operational details.
   - **Stage 2 – Simulation/Model**: Compare baseline and perturbed configurations under identical boundary assumptions. Inspect field maps, trajectories, or response profiles.
   - **Stage 3 – Controlled comparison**: If experimental validation is in scope, design baseline, sham/passive, active intervention, and orthogonality controls. Vary one mechanism-relevant factor at a time.
   - Define primary and secondary endpoints, success thresholds, and stop conditions before data collection.
   - *Stop condition*: If controls are infeasible or the mechanism cannot be isolated from confounders, halt and redesign.

5. **Execute and collect evidence**
   - Run simulations or observe controlled comparisons.
   - Record raw observables, boundary conditions, and deviations from prediction.
   - *Iteration gate*: If baseline behavior is not reproduced, fix model or measurement validity before testing hypotheses.

6. **Analyze as mechanism discrimination**
   - Reconstruct the relevant field, gradient, or structural state before interpreting the target observable.
   - Separate contributions (e.g., interfacial vs. bulk, field-driven vs. diffusive, architectural vs. material).
   - Check for predicted signatures: sign reversals, localization, regime transitions, or scaling collapses.
   - Classify each hypothesis as:
     - **Supported**: convergent evidence across independent checks.
     - **Partially supported**: one line of evidence agrees but others are incomplete.
     - **Unsupported**: predictions contradicted by controls.
     - **Confounded**: an alternative mechanism or artifact explains the result.
   - *Decision gate*: If multiple mechanisms fit equally well, design an orthogonality test before proceeding.

7. **Iterate or bound the claim**
   - **If supported**: narrow the claim to the tested boundary; propose a boundary-condition test rather than universal generalization.
   - **If partially supported**: identify missing evidence and the smallest next validation step.
   - **If unsupported or confounded**: revise the mechanism model, check assumptions, or reject the hypothesis.
   - **If unsafe or unstable**: stop physical testing conceptually and route to qualified review.
   - *Stop condition*: End the loop when the hypothesis is either falsified, strongly bounded, or transferred to a more specific domain skill.

8. **Package outputs and provenance**
   - Assemble the research question, mechanism map, evidence table, control hierarchy, analysis plan, and claim boundaries.
   - Label every conclusion as paper-validated, model-inferred, or agent-proposed.

# Output Format

Return the following structured items on each use:

1. **Research question**: concise, testable statement of the observable and gap.
2. **Mechanism hypotheses**: ranked list with evidence strength, key assumptions, predicted signatures, and failure modes.
3. **Minimal discriminatory model**: description of the simplified model and how it separates candidates.
4. **Validation plan**: staged design with independent/dependent variables, control hierarchy, metrics, and stop conditions.
5. **Analysis plan**: steps for reconstruction, contribution separation, signature checking, and confounder assessment.
6. **Evidence classification**: table mapping each hypothesis to observed evidence, control results, and remaining uncertainty.
7. **Iteration roadmap**: next step for supported, mixed, or negative outcomes.
8. **Claim boundary statement**: explicit limits on material class, geometry, field regime, and measurement conditions.

# Validation Gates

Before advancing past each stage, confirm:

- **Mechanism specificity**: The plan distinguishes the target mechanism from simpler alternatives.
- **Control adequacy**: Baseline, negative, positive, sham, and orthogonality controls are defined.
- **Model consistency**: The minimal model produces falsifiable predictions for each candidate.
- **Statistical validity**: Replication, uncertainty, and effect-size expectations are stated.
- **Reproducibility**: Inputs, assumptions, and analysis conventions are documented for independent reconstruction.

# Claim Boundaries

- Limit conclusions to the tested system class, architecture, field type, and stress regime.
- Treat agreement with one observation as support, not proof of universal consensus.
- Separate paper-derived patterns from agent-generated inferences and untested extrapolations.
- Do not generalize from a single material, chemistry, or geometry to biomedical, environmental, or commercial applications without targeted validation.

# Failure Modes

- **Observable misdefinition**: The target pattern is too vague to discriminate mechanisms.
- **Model overfitting**: The minimal model is tuned to explain one observation but fails on controls.
- **Confounding**: A hidden variable (e.g., environmental drift, boundary artifact, unmeasured interface property) mimics the target mechanism.
- **Control failure**: Sham or baseline controls show unexpected behavior, invalidating comparisons.
- **Mechanism multiplicity**: Several hypotheses fit the data equally; no orthogonality test was performed.
- **Premature extrapolation**: Claims extend beyond the validated boundary without evidence.
- **Safety override**: The proposed validation requires unsafe or unapproved operational conditions.

# Validity Checks

Run this checklist before finalizing any output:

- Are assumptions about boundary conditions, constitutive behavior, and equilibrium vs. non-equilibrium states stated?
- Could measurement artifacts, imaging bias, sample heterogeneity, or processing variability explain the result?
- Are geometry, material, and field parameters matched across comparisons?
- Is the evidence strength labeled for every hypothesis (strong, moderate, weak, speculative)?
- Are failure modes and alternative mechanisms explicitly listed?
- Have model residuals, sensitivity to parameters, and robustness under perturbation been considered?
- Is the distinction between validated observation and inferred mechanism clearly marked?

# Provenance

This skill was synthesized from cluster 72.1 (observable-driven mechanism discovery and validation) of the Codex scientific skills corpus. It merges shared workflow routes from the following source skills:

- `colloid-gradient-focusing-exploration`
- `electrospinning-jet-control-explorer`
- `nanoscale-thermal-transport-exploration`
- `hollow-conductive-fiber-research-workflow`
- `dual-interface-battery-research-workflow`
- `soft-matter-arrest-workflow`
- `sandwich-impact-cai-research-design`
- `fiber-needling-shape-optimization-research`

Source-specific systems, materials, numerical parameters, and paper conclusions have been removed to produce a domain-agnostic reusable workflow.
