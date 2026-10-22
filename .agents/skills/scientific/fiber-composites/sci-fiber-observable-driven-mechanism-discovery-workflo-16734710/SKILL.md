---
name: sci-fiber-observable-driven-mechanism-discovery-workflo-16734710
description: Reusable end-to-end workflow for generating falsifiable hypotheses, designing controlled mechanism-discovery studies, and iterating on functional material systems through explicit causal attribution and claim bounding.
scienceevolve-title: "Fiber composites and battery materials · observable driven mechanism discovery workflow 19"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Use this skill to transform an observed performance gap or failure mode in a functional material system into a structured, testable mechanism-discovery workflow. It guides hypothesis generation, minimum-viable experimental design, multi-scale analysis, and iterative redesign while enforcing strong causal attribution through hierarchical controls and explicit claim boundaries.

## When to use

Use this skill when the user asks to:

- Propose new research questions for functional material systems such as fibers, composites, battery architectures, conductive networks, porous scaffolds, or adsorbent membranes.
- Link an observable symptom (e.g., capacity fade, delamination, transport loss, brittle failure, low uptake, thermal discomfort) to underlying physical, chemical, or interfacial mechanisms.
- Design experiments that isolate a mechanism from generic performance improvements.
- Translate a paper-specific observation into a reusable research pattern rather than a literature summary.
- Iterate on a design when performance improvements are unclear or trade-offs dominate.

Do not use this skill for operational laboratory recipes, clinical or therapeutic claims, or field-deployment readiness assessments without appropriate validation.

## Inputs required

Before producing a research plan, gather or request:

- **Target system class** and the dominant observable symptom or performance bottleneck.
- **Candidate intervention concept**: material, architecture, interface, or process change intended to alter the mechanism.
- **Available evidence**: prior experimental data, literature, characterization capabilities, and modeling tools.
- **Constraints**: safety boundaries, scalability limits, measurement access, cost, and application-level requirements.
- **Evaluation context**: whether the user needs a concept test, component-level validation, or system-level assessment.

If any input is missing, state assumptions explicitly and mark conclusions as provisional.

## Core Workflow

Follow this ordered end-to-end route. At each decision gate, satisfy the criteria before proceeding; otherwise, iterate or stop.

### 1. Symptom classification and mechanism mapping

- Start from observable symptoms, not from a preferred material or design.
- Classify symptoms into categories: transport, reaction or interaction, mechanical, interfacial, and structural.
- Map each symptom to candidate mechanisms using minimal causal chains.
- **Decision Gate — Candidate Gate**: Rank mechanisms by plausibility and diagnostic accessibility. Discard candidates that cannot be distinguished with available measurements.

### 2. Causal hypothesis formulation

- State each hypothesis as a causal chain: design feature → mechanism change → diagnostic signature → system-level outcome.
- Label evidence strength as strong, moderate, weak, or speculative.
- List key assumptions, likely failure modes, boundary conditions, and discriminating tests.
- **Decision Gate — Robustness Check**: Reject hypotheses that lack a falsifiable path or a viable negative control.

### 3. Minimum viable study design

- Select the smallest experiment that can falsify the mechanism-level claim.
- Define the primary independent variable as the mechanism-relevant architectural or material feature; hold secondary variables constant until the primary mechanism is isolated.
- Establish a control hierarchy:
  - **Baseline control**: unmodified system exhibiting the target symptom.
  - **Negative control**: lacks the proposed active feature but retains non-essential features.
  - **Positive or benchmark control**: known effective comparator when appropriate for the same context.
  - **Ablation or sham control**: structurally similar but chemically inactive variant to separate physical scaffolding from chemical function.
- Split dependent variables into mechanism diagnostics and performance metrics.
- Predefine stopping conditions before testing (e.g., negative control matches test group, mechanism diagnostic is unchanged, unacceptable trade-offs appear, or safety-relevant signals emerge).
- **Decision Gate — Stability Gate**: Stop or redesign if the plan introduces unacceptable safety risks, excessive inactive burden, mechanical incompatibility, or insufficient control separation.

### 4. Execution and data quality assurance

- Confirm replicate consistency, calibration, protocol adherence, and batch or specimen-to-specimen variability.
- Separate raw measurements from normalized or derived quantities.
- Flag missing data, outliers, and protocol deviations.
- **Decision Gate — Functional Validation**: Halt if variability dominates the effect, if replicates are inconsistent, or if safety-relevant degradation signals appear.

### 5. Mechanism discrimination and evidence synthesis

- Build a causal map before interpreting outcomes.
- Compare test groups against all controls simultaneously; do not interpret improvement in isolation.
- Link performance changes to independent mechanism diagnostics such as morphology, chemistry, transport behavior, or structural evolution.
- Require converging evidence across multiple diagnostics; downgrade claims resting on a single proxy metric.
- Quantify uncertainty and classify each conclusion as **Observed** (directly measured), **Inferred** (supported by multiple measurements), or **Speculative** (plausible but untested).
- **Decision Gate — Mechanism Exclusion**: Eliminate mechanisms inconsistent with control comparisons or diagnostic evidence.

### 6. Iteration, redesign, or termination

- **If the mechanism is supported**: Advance evidence strength; test whether the intervention remains useful under more practical constraints; add stronger system-level validation.
- **If the mechanism is unsupported**: Reassess diagnostic sensitivity, confounders, and control adequacy; revise the causal map before changing multiple variables.
- **If performance improves but mechanism is unclear**: Treat the result as an empirical lead; mandate ablation or additional diagnostic experiments before claiming causality.
- **If trade-offs dominate**: Rebalance the design around competing requirements or terminate the branch.
- **Decision Gate — Iteration Gate**: Advance only if the causal chain is reproducible, controls are satisfied, and uncertainty is quantified. Otherwise, return to Step 2 or Step 3.

### 7. Claim bounding and documentation

- State explicit boundary conditions: material classes, architectures, operating environments, and loading envelopes where the claim holds.
- Distinguish paper-supported, literature-supported, and agent-inferred claims.
- Document residual failure modes and risks.
- **Decision Gate — Claim Bounding**: Final check that no conclusion implies field consensus, system readiness, or universal applicability.

## Output Format

When using this skill, return:

1. **Research target and symptom map** — Application scenario, bottleneck, symptom classification, and candidate mechanisms with evidence status.
2. **Ranked candidate hypotheses** — For each: causal chain, evidence strength, key assumptions, discriminating test, likely failure modes, and boundary conditions.
3. **Study design schema** — Minimum viable validation, independent and dependent variables, control hierarchy, metrics, replication plan, and stopping conditions.
4. **Analysis plan** — Causal map, diagnostic hierarchy, control comparison rules, uncertainty handling, and evidence classification criteria.
5. **Iteration decision tree** — Rules for advancing, revising, or terminating based on possible result patterns.
6. **Claim boundary statement** — Scope, exclusions, transferability limits, and evidence classification.
7. **Validity and safety notes** — Confounders, reproducibility checks, non-operational safety framing, and residual risks.

## Validation Gates

Before advancing past each stage, confirm:

- **Candidate Gate**: Mechanisms are ranked and testable with available diagnostics.
- **Robustness Check**: Hypotheses are falsifiable and supported by an appropriate negative control.
- **Stability Gate**: The study design does not introduce unacceptable safety risks or trade-offs, and control separation is adequate.
- **Functional Validation**: Data quality is sufficient, variability is quantified, and safety signals are absent.
- **Mechanism Exclusion**: Unsupported mechanisms are ruled out by control comparisons and diagnostic evidence.
- **Iteration Gate**: The causal chain is reproducible before expanding to broader optimization or system-level claims.
- **Claim Bounding**: Conclusions stay within the tested scope and do not imply consensus or deployment readiness.

## Claim Boundaries

- Do not generalize from a single material system or study to an entire material class.
- Do not treat component-level improvements as system-level viability without direct validation.
- Do not infer field consensus from single-paper or single-study results.
- Separate mechanism discovery from application readiness or commercialization potential.
- Mark agent-inferred claims distinctly from directly observed evidence.
- Acknowledge that laboratory-scale observations may not transfer to manufacturing scale or service environments.

## Failure Modes

- **Confounding**: Uncontrolled variables such as loading, porosity, contact quality, impurities, thickness, or protocol differences explain the observed effect.
- **Misattribution**: Performance gain is attributed to the wrong mechanism due to missing ablation or sham controls.
- **Overfitting**: Optimizing one metric while degrading complementary properties (e.g., transport vs. mechanical integrity, capacity vs. stability).
- **False extrapolation**: Extending claims beyond tested chemistry, architecture, operating environment, or loading envelope.
- **Mechanism masking**: Combining multiple untested interventions obscures which feature drives the effect.
- **Replication failure**: High batch-to-batch or specimen-to-specimen variability obscures true effects or produces false positives.
- **Single-source overreach**: Treating one literature source as definitive evidence for a broad mechanism.

## Validity Checks

Before presenting conclusions, verify:

- **Mechanistic specificity**: Does the evidence distinguish the proposed mechanism from generic conductivity, porosity, surface area, or mass-loading effects?
- **Control adequacy**: Are baseline, negative, positive, and ablation or sham controls present and appropriate for the claim?
- **Normalization**: Are results normalized to active material, total system, or relevant geometric quantities as appropriate?
- **Practical relevance**: Do tests include constraints that matter for real systems, such as loading, demand, interface stability, or inactive burden?
- **Reproducibility**: Are replicates, protocol details, and uncertainty estimates sufficient?
- **Confounding factors**: Could dispersion, surface area, contact quality, impurity content, processing history, or measurement configuration explain the result?
- **Single-source caution**: Is the source material treated as one evidence stream rather than domain consensus?

## Provenance

- Synthesized from cluster 9 / subcluster 9.1: observable-driven mechanism discovery and validation.
- Source skills:
  - `10.33961_jecst.2023.00199` (lithium-sulfur-battery-research-workflow)
  - `10.3390_batteries9020110` (solid-electrolyte-conversion-battery-research)
  - `10.1021_acsami.9b04167` (lithium-sulfur-integrated-host-design)
  - `fiber__10.1002_app.70356` (interface-engineered-nanofiber-cement-exploration)
  - `fiber__10.1007_s11664-021-09073-6` (conductive-fiber-nonwoven-electronics-research)
  - `fiber__10.1016_j.compscitech.2023.110104` (high-performance-fiber-crosslinking-exploration)
  - `fiber__10.1002_app.54840` (functional-nanofiber-adsorbent-research)
  - `fiber__10.1177_15589250221148919` (textile-comfort-factorial-exploration)
