---
name: sci-aqueous-aqueous-zinc-battery-interface-mechanism-di-00aa26d2
description: A reusable end-to-end workflow for generating, discriminating, and validating mechanistic hypotheses about aqueous zinc battery interfaces through observable-driven controls and multi-scale evidence.
scienceevolve-title: "Aqueous battery interfaces · aqueous zinc battery interface mechanism discovery workflow 3"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Provide a transferable scientific workflow for discovering and validating interface and interphase mechanisms in aqueous zinc battery systems. It guides users from coupled failure-mode diagnosis through hypothesis generation, controlled experimental design, multi-scale analysis, and evidence-bound iteration without prescribing specific materials, fabrication recipes, or operational protocols.

# When to use

Use this skill when you need to:

- Propose new electrode, electrolyte, or interphase designs for aqueous zinc batteries.
- Translate a specific observation into a generalizable mechanism hypothesis.
- Design experiments to discriminate between interfacial degradation modes such as passivation, dissolution, dendritic growth, interphase instability, or transport limitation.
- Analyze multi-scale evidence to bound claims, quantify uncertainty, and identify failure modes.
- Iterate between hypothesis, experiment, and analysis in aqueous electrochemical energy storage research.

# Inputs required

Before generating a research plan, identify or request:

- **Target system scope:** electrode identity (anode or cathode), electrolyte class, separator or membrane type, and known coupled degradation modes.
- **Candidate mechanism concept:** the proposed functional role of a structural, chemical, or formulation modification (e.g., selective transport, interphase stabilization, solvation tuning).
- **Characterization access:** available electrochemical, spectroscopic, imaging, transport, dissolution, and simulation capabilities.
- **Baseline comparators:** unmodified reference, partial-function controls, and relevant literature benchmarks.
- **Constraints:** safety boundaries, environmental considerations, reproducibility standards, practical cell requirements, and institutional approval status.

# Core Workflow

Follow this ordered route. Do not skip decision gates or stop conditions.

## 1. Diagnose coupled failure modes

- Map the dominant degradation processes and their coupling (e.g., dissolution–passivation, solvation–deposition, transport–stability).
- Identify the spatial origin: interface, bulk electrode, separator/electrolyte phase, or full-cell balance.
- Mark each diagnosis as evidence-supported, plausible, or speculative.
- **Gate:** If failure modes cannot be decoupled conceptually, refine the research question before proceeding.

## 2. Generate ranked mechanistic hypotheses

- Formulate each hypothesis as a causal chain: “If modification X provides function Y under condition Z, then failure mode W decreases and metric M improves.”
- Grade evidence strength (high / medium / low / speculative) and state key assumptions.
- Require at least three hypotheses, including a null or parsimony hypothesis and a mechanism-purity hypothesis.
- **Gate:** Discard hypotheses that cannot be falsified with available diagnostics.

## 3. Design mechanism-resolving controls

- Define independent variables (functional modification), dependent variables (mechanistic and performance metrics), and controlled variables (loading, electrolyte inventory, cell format, processing history).
- Construct a control matrix: baseline, negative, single-function, partial-architecture, and positive controls where available.
- **Gate:** If controls cannot isolate the proposed mechanism from inventory artifacts, processing effects, or morphology differences, redesign the experiment.

## 4. Execute staged validation

- **Stage 1:** Confirm that the modification has the intended structural or chemical properties.
- **Stage 2:** Show targeted failure-mode suppression in a direct diagnostic.
- **Stage 3:** Demonstrate electrochemical improvement only when the targeted mechanism is active.
- **Stage 4:** Verify persistence under at least one practical stressor (e.g., limited electrolyte access, deep utilization, rest in vulnerable states).
- **Stop condition:** Halt if the candidate fails to outperform the most relevant reduced control, if mechanism evidence is absent, or if a new degradation mode emerges that dominates the benefit.

## 5. Analyze multi-scale evidence

- Separate evidence layers: molecular/solution, interfacial, morphological, electrochemical, and device-level.
- Compare candidate and control under matched conditions.
- Map each hypothesis to predicted and falsifying observations.
- **Gate:** If local high-resolution data contradict bulk measurements, resolve sampling bias before inferring mechanism.

## 6. Bound claims and classify mechanisms

- Distinguish supported observations from inferred mechanisms and speculative transfers.
- State boundary conditions: tested material family, electrolyte class, voltage window, and cell format.
- Produce a claim-boundary statement and a failure-mode taxonomy for the candidate.
- **Gate:** If mechanistic specificity is low, downgrade the claim to phenomenological correlation.

## 7. Iterate or redesign

- **If all diagnostics converge:** Strengthen the hypothesis and test robustness across boundary conditions.
- **If partial:** Reframe the hypothesis to the minimal mechanism supported by evidence; design follow-up experiments to isolate the unresolved link.
- **If contradictory:** Archive the failure mode and return to Step 2 with revised assumptions.
- **Stop condition:** Terminate if safety, compliance, or reproducibility constraints prevent meaningful testing, or if the mechanism is contradicted by orthogonal diagnostics.

# Output Format

When using this skill, produce:

1. **Study plan** — research question, coupled failure map, and diagnostic strategy.
2. **Ranked hypotheses** — at least three hypotheses with evidence strength, key assumptions, predicted observations, and likely failure modes.
3. **Control table** — independent variables, dependent variables, controlled variables, and the full control matrix with stop conditions.
4. **Analysis plan** — evidence-layer separation, mechanism classification rules, confounder checks, and uncertainty quantification.
5. **Claim boundary statement** — explicit distinction between verified observations, agent-inferred mechanisms, and speculative transfers.
6. **Failure mode taxonomy** — candidate-specific and process-specific failure modes with decision rules for abandonment or redesign.

# Validation Gates

Before claiming success, confirm:

- **Confounding elimination:** Comparable processing, loading, electrolyte inventory, and cell assembly across all variants.
- **Reproducibility:** Independent replicates, batch-to-batch variation assessment, and predefined primary metrics.
- **Statistical validity:** Variance reporting, avoidance of best-case-only selection, and sample sizes appropriate to the decision.
- **Mechanistic specificity:** Improvement is tied to the proposed failure-mode reduction, not merely to increased active-material inventory, favorable testing asymmetry, or pre-dissolved species.
- **Boundary testing:** Claims are limited to the tested electrolyte class, electrode architecture, and operating regime.

# Claim Boundaries

- Do not present single-system observations as field-wide consensus.
- Explicitly label agent-inferred hypotheses versus literature-supported mechanisms.
- Do not extrapolate from half-cell diagnostics to full-cell performance without direct evidence.
- Avoid claiming universal applicability across all aqueous batteries, metal electrodes, or cell formats.
- Distinguish material discovery from mechanism validation; a new composition is not automatically a new mechanism.

# Failure Modes

- **Mechanism misattribution:** Performance gain arises from uncontrolled variables (e.g., ionic strength, surface area, pH shift) rather than the proposed mechanism.
- **Inventory artifact:** Apparent improvement is due to unequal active-material loading, pre-dissolved species, or electrolyte volume differences.
- **Diagnostic contradiction:** Local imaging or spectroscopy suggests one mechanism while bulk electrochemical data suggests another.
- **Emergent degradation:** Suppressing one failure mode reveals a worse bottleneck (e.g., blocked transport, mechanical collapse, excessive impedance, counter-electrode incompatibility).
- **Overextrapolation:** Generalizing beyond the tested formulation window, architecture, or operating condition.

# Validity Checks

Before finalizing any plan or claim, verify:

- The baseline and candidate differ only in the intended variable.
- Controls isolate each functional lever and any shared-medium pathway.
- At least two orthogonal evidence types support any mechanism claim.
- Full-system improvement is not inferred solely from single-diagnostic or half-cell results.
- Variability, outliers, and negative results are reported.
- Safety and environmental constraints are evaluated at the design level, not deferred to execution.

# Provenance

- Synthesized from cluster 56.0 (workflow archetype: observable-driven mechanism discovery and validation).
- Source skills: aqueous-battery-anode-design-workflow (9084f9f4), synergistic-interface-bulk-zinc-battery-research (82be8fb8), aqueous-zinc-interface-exploration (bb77f250), solvation-interface-zinc-anode-research (95d36b16), coordinated-binder-sei-research (d97d6e49), aqueous-zinc-organic-cathode-research (8093132f), coupled-electrolyte-research-explorer (7443072d), zinc-halide-carbon-energy-storage-workflow (bd5ef4cf).
- Paper-derived specifics, numerical parameters, synthesis recipes, and operational protocols have been excluded from the reusable workflow body.
