---
name: sci-fiber-observable-driven-mechanism-discovery-workflo-575eebdc
description: A reusable end-to-end workflow for generating mechanism-centered hypotheses, designing control-rich validation studies, and iteratively bounding claims in materials and chemical systems where interfacial or multi-scale phenomena govern performance.
scienceevolve-title: "Fiber composites and battery materials · observable driven mechanism discovery workflow 7"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Help an agent transform an observed performance gap or material limitation into a rigorous, mechanism-centered research plan. The workflow emphasizes hypothesis generation via bottleneck-to-mechanism mapping, control-rich experimental design, multi-scale evidence convergence, and iterative claim bounding. It is intended for systems where interface, transport, structural, or reactive events dominate behavior.

# When to use

Use this skill when the user needs to:

- Propose new research questions for material, chemical, or composite systems where performance is governed by interfacial or multi-scale mechanisms.
- Design validation plans that distinguish mechanism-driven outcomes from artifacts, background effects, or uncontrolled variables.
- Evaluate whether an observed improvement is causally linked to a proposed structural, chemical, or interfacial change.
- Iterate hypotheses based on convergent or conflicting evidence across multiple characterization layers.

Do not use this skill for clinical recommendations, safety-critical deployment claims, executable operational protocols, or direct manufacturing instructions without separate domain-specific validation.

# Inputs required

Before generating a plan, identify or request:

- **Observable bottleneck:** A measurable performance gap, failure mode, or property trade-off.
- **Target system class:** The material, composite, or chemical architecture under study and its service environment.
- **Candidate mechanism levers:** Enabling components, modifications, or process variables hypothesized to govern the bottleneck.
- **Available evidence:** Prior literature, preliminary data, known benchmarks, and constraints on data or sample access.
- **Control opportunities:** Baseline, unmodified, disabled-mechanism, and benchmark systems available for comparison.
- **Evaluation priorities:** Performance metrics, mechanism indicators, and robustness checks relevant to the application.
- **Boundary constraints:** Safety, regulatory, environmental, and ethical limits on extrapolation or implementation.

# Core Workflow

Execute the following stages in order. Do not proceed past a decision gate until the condition is satisfied.

## 1. Define the Observable Bottleneck
Start from a measurable performance gap, failure mode, or property trade-off. Identify whether the limitation likely originates from interfacial, transport, structural, or reactive phenomena rather than bulk properties alone.

## 2. Map to a Mechanism-Centered Hypothesis
Translate the bottleneck into a causal mechanism claim that links a design lever to an expected observable signature. State the predicted pathway, key assumptions, and evidence strength.

- **Decision Gate 1 (Candidate Gate):** If no plausible mechanism can be articulated, stop and reformulate the gap.

## 3. Architect the Control Strategy
Design controls that isolate the proposed mechanism from bulk, background, and processing effects. Include:
- Baseline (unmodified) control.
- Negative or mechanism-disabled control.
- Positive or benchmark control when available.
- Partial-factor controls to separate coupled variables.

- **Decision Gate 2 (Control Gate):** If the study lacks a matched control for the target variable, redesign before proceeding.

## 4. Design the Minimal Viable Validation
Select independent variables that directly test the mechanism. Define:
- Primary metrics tied to the research question.
- Mechanism indicators distinct from final performance.
- Success criteria, failure criteria, and stop conditions.

- **Decision Gate 3 (Study Gate):** If the experiment cannot falsify the hypothesis, broaden the control set or narrow the claim.

## 5. Collect Multi-Scale Evidence
Gather orthogonal data streams (e.g., structural, chemical, interfacial, mechanical, transport, or computational). Do not infer mechanism from a single endpoint.

- **Decision Gate 4 (Convergence Gate):** If evidence streams conflict, halt claim formation and investigate confounders.

## 6. Discriminate Mechanisms
Compare modified systems against matched controls. Separate intrinsic effects from interfacial or reactive effects. Determine whether the data support the proposed pathway over alternative explanations.

- **Decision Gate 5 (Mechanism Gate):** If mechanism indicators are absent or contradict performance trends, downgrade or reject the hypothesis.

## 7. Bound the Claim
Restrict conclusions to the tested system, conditions, and measurement boundaries. Distinguish directly observed outcomes from inferred intermediates and extrapolated systems.

- **Decision Gate 6 (Claim Gate):** If boundary conditions are undefined, do not generalize.

## 8. Iterate or Terminate
- **Confirm and extend:** If mechanism and performance converge, add robustness checks (environmental variation, batch variability, durability) before broadening.
- **Redesign:** If results are ambiguous, strengthen controls, reduce variables, or add orthogonal probes.
- **Pivot:** If the hypothesis is falsified, return to Stage 2 with a revised mechanism map.
- **Stop:** If confounders dominate, trade-offs are unacceptable, or safety/ethical boundaries are breached, terminate the line of inquiry.

- **Decision Gate 7 (Iteration Gate):** Only continue if the next cycle has a falsifiable hypothesis and adequate controls.

# Output Format

Return the following structured deliverables:

1. **Research Question** — One concise, testable question tied to a bottleneck and boundary.
2. **Mechanism Map** — Table of proposed contributions from each subsystem or variable.
3. **Ranked Hypotheses** — For each: statement, evidence strength, key assumptions, predicted signatures, likely failure modes, and minimal validation.
4. **Study Plan** — Variables, controls, primary and secondary metrics, success criteria, and stop conditions.
5. **Analysis Plan** — Data layers, comparison logic, convergence criteria, and visualization strategy.
6. **Validation Plan** — Robustness checks, reproducibility requirements, and boundary tests.
7. **Claim Boundary & Failure Modes** — Explicit limits on extrapolation and known ways the claim could fail.
8. **Evidence Labels** — Classification of each element as paper-supported pattern, newly observed, mechanism-supported inference, speculative extension, or out-of-scope.

# Validation Gates

Before finalizing any deliverable, confirm:

- The hypothesis identifies a mechanism rather than only a desired outcome.
- Controls are matched and sufficient to isolate the target variable.
- At least two orthogonal evidence streams are planned or collected.
- Success and stop criteria are predefined.
- Confounders (processing history, batch variation, environmental state, measurement artifacts) are addressed.
- Statistical or reproducibility criteria match the claim strength.

# Claim Boundaries

- Treat conclusions as valid only within the tested system, process, and environmental boundary.
- Distinguish directly observed outcomes from inferred intermediates.
- Distinguish mechanism-supported inferences from speculative extensions.
- Do not treat single-study observations as field-wide consensus.
- Avoid extrapolating to safety-critical, clinical, or regulated applications without application-specific validation.

# Failure Modes

Common ways this workflow can fail or mislead:

- **Confounding:** Uncontrolled variables (source variation, processing artifacts, measurement conditions) explain the apparent effect.
- **Aggregation or dispersion artifacts:** Physical state changes mimic mechanism-driven performance shifts.
- **Single-metric optimization:** Improvement in one endpoint masks degradation in another critical property.
- **Missing mechanism indicators:** Performance changes without structural, chemical, or interfacial evidence.
- **Inadequate controls:** Absence of baseline, negative, or benchmark comparisons.
- **Environmental fragility:** Gains that disappear under humidity, temperature cycling, aging, or batch variation.
- **Over-constraint:** Mechanism improvements that suppress dynamic or healing behavior.
- **Evidence mislabeling:** Speculative inferences presented as demonstrated facts.

# Validity Checks

Before presenting results or plans, verify:

- **Confounding:** Are differences explained by uncontrolled sources rather than the proposed mechanism?
- **Control adequacy:** Are baseline, negative, treated, and benchmark controls present and matched?
- **Reproducibility:** Are independent batches, uncertainty estimates, and variability reports included?
- **Mechanism alignment:** Do orthogonal data streams tell a consistent story?
- **Durability/robustness:** Does the result hold under relevant environmental or operational variations?
- **Boundary conditions:** Are claims limited to the tested system, conditions, and measurement context?
- **Trade-off transparency:** Are adverse effects or property losses reported?
- **Evidence maturity:** Is each claim labeled according to its supporting evidence level?

# Provenance

- **Cluster:** 48.0 — observable-driven mechanism discovery and validation
- **Source skills:** natural-fiber-composite-research-pattern (fiber__10.3390_jcs7120506); hybrid-structural-material-research-workflow (fiber__10.1016_j.compstruct.2022.115443); starch-biopolymer-ink-research-exploration (fiber__10.1016_j.ijbiomac.2025.141443); plant-fiber-composite-research-design (fiber__10.1016_j.ijbiomac.2025.145310); organic-photoredox-catalyst-design-skill (10.1021_acscatal.1c00242); cellulose-fiber-interface-research (fiber__10.1016_j.ijbiomac.2025.140771); natural-fiber-coating-research-workflow (fiber__10.1002_app.53783); self-healing-composite-interface-design (10.1021_acsami.9b12264)
