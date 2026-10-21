---
name: sci-aqueous-interface-battery-aqueous-zinc-mechanism-di-4c63d00e
description: Observable-driven mechanism discovery and validation workflow for electrochemical energy-storage interfaces, emphasizing hypothesis generation, staged controls, orthogonal evidence convergence, and iterative refinement without source-specific recipes.
scienceevolve-title: "Aqueous battery interfaces · interface battery aqueous zinc mechanism discovery workflow"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Guide research planning for electrochemical interface engineering where failure modes arise from coupled transport, interfacial chemistry, and morphology. This skill transforms observed instability into testable mechanistic hypotheses, staged validation plans, and iterative learning loops. It is designed for agent use in battery and related energy-storage interface studies where correlation alone is insufficient to claim mechanism.

# When to use

Use this skill when the task is to:

- Propose interfacial modifiers, additives, coatings, artificial interphases, or electrolyte designs for reactive-metal or other electrochemical interfaces.
- Convert an observed failure mode—such as nonuniform deposition, interphase instability, side reactions, or poor reversibility—into a research question.
- Design a staged validation ladder that separates bulk effects from interfacial phenomena using matched controls.
- Evaluate whether a performance improvement is causally linked to a proposed interface mechanism rather than to artifacts.
- Iterate from component-level evidence toward system-level claims with explicit stop conditions.

Do not use this skill as a substitute for experimental safety review, operational laboratory protocols, manufacturing instructions, or project management.

# Inputs required

Ask the user for, or infer from context:

- Target electrochemical platform and cell format (e.g., half-cell, symmetric, full-cell).
- Dominant failure mode and coupled subprocesses (transport, chemistry, morphology, mechanics).
- Candidate intervention class and the proposed mechanism of action.
- Available characterization and electrochemical evidence (spectroscopy, imaging, impedance, cycling data, modeling).
- Constraints on materials, equipment, safety, cost, sustainability, and reproducibility.
- Decision objective: hypothesis ranking, experimental plan, validation matrix, or iteration strategy.

If critical inputs are missing, state assumptions explicitly and mark conclusions as provisional.

# Core Workflow

Follow this ordered route. Do not skip stages or treat performance improvement as mechanistic proof without passing the relevant decision gates.

## 1. Failure-mode decomposition

- Map the observed failure as a coupled network of transport, interfacial chemistry, and morphology (and mechanics, if relevant).
- Rank bottlenecks by how directly they can be measured and controlled.
- **Decision gate:** If the failure mode cannot be decomposed into observable, independently measurable subprocesses, stop and refine the problem framing before generating hypotheses.

## 2. Mechanistic hypothesis generation

- Formulate 3–5 competing causal hypotheses that link a specific interfacial intervention to observable changes.
- For each hypothesis, specify:
  - mechanistic claim;
  - predicted early-stage signal;
  - predicted performance signal;
  - evidence strength (low, medium, high);
  - key assumptions;
  - likely failure modes;
  - boundary conditions where the hypothesis should not apply.
- Include a null/artifact hypothesis (e.g., improvement arises from bulk-property changes, handling, or measurement variability).
- **Decision gate:** If no hypothesis is falsifiable with the available measurement modalities, redesign the measurement plan before proceeding.

## 3. Staged validation design

Design experiments as a validation ladder, not as a single performance test.

- **Stage 1 — Interface/material screening**
  - Compare baseline, candidate intervention, and at least one negative control that lacks the proposed active function but preserves geometry and handling.
  - Verify that the intended interface architecture or feature forms reproducibly.
  - Include structural and function controls to separate geometry from chemistry effects.
  - **Stop/pivot:** Irreproducible interface formation, absent predicted feature, or safety-relevant incompatibility.

- **Stage 2 — Transport and kinetics probe**
  - Test whether the intervention changes ion flux, interfacial resistance, charge-transfer behavior, or selectivity in the predicted direction.
  - Confirm that changes are not artifacts of thickness, area, electrolyte amount, or assembly variation.
  - **Stop/pivot:** No change in predicted transport/kinetic signature, or improvement arises from uncontrolled confounders.

- **Stage 3 — Morphology and reversibility probe**
  - Examine deposition uniformity, passivation quality, side-product suppression, and electrochemical reversibility in a simplified cell configuration.
  - Require post-use inspection to connect electrochemical trends with structural evidence.
  - Define failure criteria before testing (e.g., rapidly increasing polarization, unstable efficiency, severe morphology change).
  - **Stop/pivot:** Morphology or reversibility contradicts the mechanism, or controls explain the observed behavior.

- **Stage 4 — System-level validation**
  - Only after earlier stages support the mechanism, test in a more application-relevant full-device configuration.
  - Compare against the same baseline used in prior stages.
  - Include diagnostics that reveal whether the mechanism still operates under constrained conditions.
  - **Stop/pivot:** Component-level gains disappear after system integration, indicating counter-electrode coupling, electrolyte depletion, or packaging effects.

## 4. Evidence collection and layered analysis

Analyze evidence in strict sequence; do not infer mechanism from a single metric.

1. **Structure first:** Confirm the intended interface exists (morphology, continuity, composition) before interpreting performance.
2. **Mechanism proxies:** Compare transport, impedance, spectroscopy, or wettability against the hypothesis predictions.
3. **Morphology/kinetics:** Evaluate uniformity, deposit density, side-reaction markers, and reversibility metrics.
4. **System performance:** Assess retention, efficiency, and stability with matched controls.
5. **Convergence rule:** Accept a mechanism as supported only when independent measurements from at least two categories agree.

## 5. Mechanism discrimination

- Populate a decision matrix with rows for candidate hypotheses and columns for predicted signal, measurement, control, result, interpretation, confidence, and next action.
- Mark each result as supporting, contradicting, or inconclusive.
- Exclude hypotheses that lack intermediate evidence despite apparent performance improvement.
- **Decision gate:** If multiple hypotheses remain indistinguishable after the first validation cycle, design a sharper discriminating experiment (e.g., removing one feature while preserving another) before making broader claims.

## 6. Iteration or redesign

Apply explicit update rules after each evidence round:

- **Strengthen:** Evidence supports the mechanism; proceed to test a sharper perturbation or advance to the next stage.
- **Refine:** Evidence supports part of the mechanism but reveals a tradeoff (e.g., transport improves but side reactions worsen); modify the candidate design.
- **Reject:** Evidence contradicts the mechanism; propose an alternative explanation and return to hypothesis generation.
- **Inconclusive:** Controls or data quality are insufficient; redesign the validation before expanding claims.
- **Stop conditions:** Safety-relevant failure modes appear; data cannot distinguish competing mechanisms after two cycles; the intervention introduces unacceptable complexity; or reproducibility checks fail.

## 7. Claim synthesis and boundary setting

- State supported claims with explicit boundary conditions (chemistry, cell format, loading regime, stress window).
- Label claims as “supported by source literature,” “supported by broader literature,” or “new inference for the proposed system.”
- Document confounders, reproducibility checks, and limits of extrapolation.
- Do not present component-level or single-cell results as system-wide or commercial proof.

# Output Format

When using this skill, produce:

1. **Research question** — One concise question and the failure mode it addresses.
2. **Ranked hypothesis table** — Hypothesis, mechanistic claim, evidence strength, key assumptions, predicted early signal, predicted performance signal, likely failure modes, and boundary conditions.
3. **Staged validation plan** — Baseline, negative control, structural/function controls, benchmark control (if justified), active intervention, implementation levels, stage definitions, metrics, and stop/pivot conditions.
4. **Decision matrix template** — Rows and columns for mechanism discrimination.
5. **Iteration rules** — Triggers for strengthen, refine, reject, inconclusive, and stop.
6. **Validity and boundary statement** — Confounders, reproducibility requirements, safety boundaries, and extrapolation limits.

# Validation Gates

Before advancing between stages or presenting conclusions, confirm:

- **Confounding isolation:** Geometry, electrolyte access, loading, thickness, pressure, and assembly history are controlled or reported.
- **Control adequacy:** Baseline, negative control, and relevant structural/function controls are included and matched to the mechanism being tested.
- **Reproducibility:** Independent replicates, variance, failure events, and exclusion rules are specified; raw data and post-use images are linked to cell identities.
- **Orthogonal convergence:** At least two independent measurement categories support the mechanism before acceptance.
- **Statistical validity:** Comparisons use predefined endpoints, appropriate uncertainty estimates, and avoid selective reporting of best results.

# Claim Boundaries

- Distinguish source-literature support, broader-literature support, and new-system inference.
- Do not treat single-study results, single-cell anecdotes, or descriptor correlations as field-wide consensus.
- Restrict performance and mechanism claims to the tested chemistry, cell format, and operating window.
- Avoid claims about commercial readiness, absolute safety, or environmental benefit unless validated under application-relevant conditions.

# Failure Modes

- The interface does not form reproducibly or degrades during operation.
- Transport or kinetic metrics improve while side reactions or reversibility worsen (or vice versa).
- Apparent gains disappear when stronger controls (e.g., mass/loading normalization, structural controls) are applied.
- Component-level improvements fail to translate to system-level behavior.
- Nonmonotonic response (e.g., excessive intervention loading causes blockage, increased resistance, or mechanical failure).
- Uncontrolled confounding from bulk properties, impurities, substrate variability, or measurement artifacts.
- Safety-relevant instability such as uncontrolled gas evolution, short-circuit tendency, or thermal risk.

# Validity Checks

Before finalizing any plan or conclusion, verify:

- Are all hypotheses labeled with evidence strength, falsifiability criteria, and key assumptions?
- Does every claimed mechanism have at least one independent experimental proxy?
- Are alternative mechanisms considered and actively tested against?
- Are imaging regions, post-operation samples, and electrochemical metrics representative and quantified with consistent thresholds?
- Is model complexity (if used) justified by sample size and validated by cross-checks?
- Are boundary conditions, extrapolation limits, and out-of-scope contexts explicitly stated?
- Is the language of claims limited to “supports,” “is consistent with,” or “suggests” rather than “proves”?

# Provenance

- Synthesized from cluster 19.2 (observable-driven mechanism discovery and validation).
- Derived from source skills: lithium-metal-separator-research-workflow (3161f4a780785816), interface-additive-research-agent (1799cfe846be1738), zinc-battery-interface-exploration (d26b689f87fbaccd), zinc-anode-interface-exploration (f3839e3daf296a24), azib-interface-layer-research-design (9ee0ad803ba92697), aqueous-zn-interface-research (6e6843a201e7dc79), zib-cathode-structure-kinetics-exploration (cb92d2107c3400f7), metal-anode-interface-regulator-discovery (09abaa959dea574c).
- No source-specific operational protocols, material recipes, fabrication parameters, or paper conclusions are included in the reusable workflow body.
