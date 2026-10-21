---
name: sci-aqueous-zinc-aqueous-electrolyte-battery-mechanism-7e3b5bb8
description: Observable-driven mechanism discovery and validation workflow for electrochemical energy storage systems.
scienceevolve-title: "Aqueous battery interfaces · zinc aqueous electrolyte battery mechanism discovery workflow"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Turn a device-level performance anomaly or failure mode into a mechanism-centered research plan, validate it through a layered evidence chain, and iterate based on causal links rather than aggregate metrics.

# When to use

Trigger this skill when the user asks to:
- propose new research questions for aqueous electrochemical storage systems;
- design experiments that separate bulk, transport, interfacial, and device-level mechanisms;
- evaluate whether a candidate material, electrolyte, or interface intervention improves performance through a stated causal chain;
- translate literature logic into a reusable hypothesis-validation workflow for related but not identical chemistries or architectures.

# Inputs required

Ask for or infer before generating a plan:
- Target electrochemical system, ion chemistry, and application environment;
- Dominant failure mode or bottleneck (e.g., transport limitation, interfacial instability, structural degradation);
- Candidate design lever or intervention class;
- Available characterization, modeling, and simulation capabilities;
- Safety, environmental, and regulatory constraints;
- Desired depth: exploratory hypotheses, minimal validation plan, or confirmatory study.

# Core Workflow

Execute the following ordered route. At each decision gate, pause, assess, and only proceed if the criterion is met; otherwise iterate, redesign, or stop.

## 1. Failure decomposition and bottleneck mapping
Start from the observable failure mode, not from a preferred material. Decompose the failure into mechanistic links:
- Bulk structure and transport properties;
- Interfacial reaction and charge-transfer behavior;
- Nucleation, growth, or morphological evolution;
- Device-level integration and stress response.

**Decision gate — Identifiability:** If the bottleneck cannot be mapped to at least one mechanistic link, stop and request additional system information.

## 2. Hypothesis generation
Generate 3–5 falsifiable hypotheses. For each hypothesis specify:
- Proposed mechanism in one sentence;
- Predicted signatures at the bulk, transport, interface, and device layers;
- Key assumptions;
- Likely failure modes;
- Evidence strength (weak / moderate / strong / robust);
- Minimal validation required.

**Decision gate — Distinguishability:** If hypotheses cannot be differentiated by the proposed controls and diagnostics, redesign the variable matrix before proceeding.

## 3. Study design and control matrix
Define:
- Independent variables: the design lever and its dose or density range;
- Dependent variables: mechanism-specific descriptors and device-level metrics;
- Context variables: temperature, geometry, cycling protocol, and assembly history.

Establish controls:
- Baseline (no intervention);
- Single-axis (one lever at a time);
- Negative / ablation (motif-absent or mechanism-blocked);
- Positive / reference (known comparator when available);
- Orthogonal (isolates co-varying factors);
- Integration (checks device-level transfer).

Define minimal viable validation: the smallest set of experiments that can support, revise, or reject the hypothesis. Define explicit stop conditions for safety concerns, irreproducibility, mechanism contradiction, or dominant side-effects.

**Decision gate — Control adequacy:** If the control matrix cannot isolate the proposed mechanism from confounders (e.g., conductivity, surface area, morphology), add matched controls.

## 4. Layered evidence collection
Collect evidence in stages:
1. Confirm the intended structural or compositional change;
2. Measure transport and kinetic responses;
3. Characterize interfacial behavior (morphology, side-reaction signals, stability);
4. Evaluate device-level performance under relevant stressors.

Use orthogonal probes (spectroscopy, imaging, electrochemical diagnostics, simulation) so that no single measurement family carries the full causal burden.

**Decision gate — Candidate gate:** If the candidate fails to show the predicted mechanism-specific signature at any layer, stop or pivot before full-device expansion.

## 5. Mechanism discrimination and analysis
Test the causal chain link-by-link:
- Does the structural change produce the predicted transport effect?
- Does the transport effect translate to improved interfacial behavior?
- Does interfacial improvement survive in the full system?

Classify each hypothesis:
- **Supports mechanism:** multiple independent layers align;
- **Partially supports:** one or two layers improve but the causal link is incomplete;
- **Contradicts:** predicted signatures are absent or conflict with performance;
- **Inconclusive:** controls, variability, or confounders prevent interpretation.

**Decision gate — Mechanism exclusion:** If evidence contradicts the predicted causal chain, reject the hypothesis and return to Step 2.

## 6. Robustness and stability check
Assess replicability across samples/batches and operating windows. Identify trade-offs (e.g., improved stability at the cost of transport). Verify that gains are not limited to narrow, non-representative conditions.

**Decision gate — Robustness check:** If the effect is irreproducible or disappears under stress, downgrade the claim to screening-level and stop expansion.

## 7. Iteration or redesign
Identify the broken link or residual bottleneck. Update the hypothesis and evidence strength. Modify one design dimension at a time. Re-run the minimal validation set before scaling to stronger confirmatory tests.

**Decision gate — Iteration gate:**
- If mechanism and performance both improve, strengthen specificity controls and test boundaries;
- If mechanism improves but performance does not, diagnose compensating bottlenecks and revise the stage map;
- If performance improves without mechanistic support, add targeted diagnostics before claiming causality;
- If results are inconsistent, prioritize reproducibility before optimization;
- Stop if safety, stability, or irreproducibility dominates expected benefit.

## 8. Claim formulation and boundary setting
State what is directly observed, what is interpreted, and what remains inferred. Label:
- Paper-supported workflow patterns;
- Transferable mechanistic logic;
- Agent-generated extensions and their provisional status.

Define the extrapolation boundary: chemistry, architecture, voltage regime, and device class where the claim may not hold.

# Output Format

When using this skill, produce:

1. **Research question** — one concise, mechanism-centered question.
2. **Mechanism map** — staged causal links from design lever to device outcome.
3. **Hypothesis portfolio** — 3–5 hypotheses with evidence strength, assumptions, predicted signatures, and likely failure modes.
4. **Study design** — variables, control matrix, minimal viable validation, and stop conditions.
5. **Analysis plan** — layered diagnostics, decision rules for support/contradiction/inconclusiveness, and confounder checks.
6. **Iteration plan** — next action for each result pattern (support, partial support, contradiction, inconclusive).
7. **Claim boundaries and provenance labels** — observed vs. inferred, paper-supported vs. agent-generated.
8. **Validity and safety notes** — confounders, reproducibility needs, boundary conditions, and non-operational safety constraints.

# Validation Gates

- **Mechanism specificity:** Controls must isolate the claimed mechanistic stage from nonspecific effects.
- **Orthogonality:** At least two independent measurement families must support the mechanism.
- **Reproducibility:** Results must be consistent across relevant samples, batches, or preparation histories.
- **Statistical validity:** Report variability and uncertainty; avoid cherry-picking best-case values.
- **Boundary check:** Limit claims to the tested chemistry, electrode architecture, and operating window.

# Claim Boundaries

- Distinguish observed evidence, interpretation, and inference in every claim.
- Label paper-supported patterns, transferable workflow logic, and new agent-generated hypotheses separately.
- Do not treat single-study performance as field consensus.
- Do not extrapolate half-cell or simplified-cell results to full-device performance without paired validation.
- Mark sustainability, safety, or deployment readiness claims as requiring independent lifecycle and regulatory assessment.

# Failure Modes

- The predicted structural or transport signature is absent, undermining the causal chain.
- Performance improves via a confounder (e.g., surface area, conductivity, impurity) rather than the proposed mechanism.
- Interfacial improvement creates new instability (side reactions, mechanical failure, gas evolution).
- The effect is real but narrow, disappearing under rate, temperature, or cycling stress.
- Controls behave similarly to the candidate, weakening specificity.
- Safety or stability concerns dominate the expected benefit, requiring termination.

# Validity Checks

Before finalizing a plan, verify:
- The research question is mechanism-centered, not only a performance target.
- Baseline, single-factor, and full-system controls are included.
- Metrics cover bulk, transport, interface, and device layers.
- Each hypothesis lists key assumptions, predicted signatures, and likely failure modes.
- Literature comparisons use comparable conditions and do not elevate a single study to consensus.
- Confounders (temperature history, cell geometry, electrode state, electrolyte stability) are addressed.
- Repeated measurements and variability reporting are planned.
- The extrapolation boundary is stated for each new system.
- Outputs remain at the research-design level without executable hazardous parameters.

# Provenance

- Derived from cluster 44.0 (observable-driven mechanism discovery and validation).
- Synthesized from source skills: `low-temp-aqueous-electrolyte-exploration`, `biomass-hydrogel-zinc-battery-research-workflow`, `flexible-zinc-hydrogel-research-design`, `transport-limited-zib-electrode-exploration`, `sodium-ion-capacitor-oxide-workflow`, `electrochemical-additive-kinetic-design`, `polymer-electrolyte-research-workflow`, `aqueous-zinc-multi-ion-research-design`.
- Workflow logic is generalized from paper-derived research patterns; no specific material system, numerical result, or operational protocol is endorsed as universal.
