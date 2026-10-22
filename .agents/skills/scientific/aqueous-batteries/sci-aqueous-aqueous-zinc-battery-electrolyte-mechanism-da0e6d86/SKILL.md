---
name: sci-aqueous-aqueous-zinc-battery-electrolyte-mechanism-da0e6d86
description: Reusable end-to-end workflow for observable-driven mechanism discovery and validation in aqueous battery electrolyte and electrode–electrolyte interface research.
scienceevolve-title: "Aqueous battery interfaces · aqueous zinc battery electrolyte mechanism discovery workflow"
scienceevolve-area: aqueous-battery-interfaces
---

## Purpose

Guide an agent to transform an observed performance bottleneck in aqueous battery systems into a falsifiable mechanistic hypothesis, design a minimally controlled validation study, analyze orthogonal evidence layers, iterate based on decision gates, and bound claims conservatively.

## When to use

Use this skill when the user asks to:
- design research questions around electrolyte formulation, additives, solvation structures, or interfacial regulation;
- diagnose whether a performance change is caused by an intended mechanism or by side reactions, transport artifacts, or measurement confounders;
- plan experiments that link molecular or interfacial observations to cell-level behavior;
- convert a literature mechanism into a transferable hypothesis for a new chemistry or architecture;
- evaluate whether evidence supports a causal mechanism rather than only an empirical performance gain.

Do not use this skill as a substitute for domain-specific safety review, laboratory protocol development, or executable experimental instructions.

## Inputs required

Before generating the workflow output, request or infer:
- target chemistry family, cell format, and dominant failure mode (e.g., dendritic deposition, corrosion, passivation, side reactions, irreversible phase change);
- candidate electrolyte or interfacial design variable (additive, solvent modification, host–guest strategy, coating);
- available characterization and electrochemical diagnostics;
- baseline performance and known confounders;
- constraints on cost, sustainability, scalability, safety, and environmental burden;
- desired scope: minimal validation plan, full research program, or critical review of an existing hypothesis.

## Core Workflow

1. **Frame the bottleneck and system boundary**
   - Define the performance problem as a coupled chemical and physical failure, not as a single metric deficit.
   - Identify whether the limiting process is likely dominated by solvation chemistry, interfacial adsorption, ion transport, nucleation, morphology evolution, side reactions, or electrode mismatch.
   - **Decision gate:** If the bottleneck cannot be expressed as an observable failure mode with a separable mechanism target, stop and refine the problem statement.

2. **Build a mechanism map**
   - Construct a causal chain: design intervention → molecular or interfacial change → altered transport or reaction pathway → changed morphology or side-reaction profile → cell-level performance.
   - Label each link as experimentally supported, inferred, or untested.
   - **Decision gate:** If the map lacks a testable intermediate between the intervention and the performance outcome, revise the hypothesis before proceeding.

3. **Generate ranked, falsifiable hypotheses**
   - Produce at least three mechanism-level hypotheses that isolate distinct design levers (e.g., solvation restructuring, interfacial adsorption, local ion regulation, host–guest confinement).
   - For each hypothesis specify: claim, evidence strength (strong / moderate / weak / speculative), key assumptions, predicted signature, and likely failure mode.
   - Prioritize by discriminative power and falsifiability, not by expected performance gain.
   - **Decision gate:** If no hypothesis can be falsified by a feasible experiment, return to Step 2 and refine the mechanism map.

4. **Design minimal controlled validation**
   - Define independent variables (design lever), dependent variables (mechanism and performance metrics), and confounders to record.
   - Include controls: baseline (unmodified), negative (lacking the active feature), structurally related inactive analogue, positive benchmark when available, and trend or dose controls.
   - Require at least one measurement from each evidence layer: molecular / solvation, interfacial / transport, morphology / degradation, and cell-level performance.
   - Define stop conditions before data collection: safety concern, no reproducible difference from baseline, mechanism evidence contradicts the hypothesis, or improvement only under unmatched controls.
   - **Decision gate:** If the plan lacks a negative control or a mechanism-level metric, halt and strengthen the design.

5. **Collect and preprocess evidence**
   - Confirm matched controls, consistent normalization, and comparable handling.
   - Flag outliers, failed runs, and missing metadata.
   - **Decision gate:** If data quality checks fail, do not proceed to mechanism testing; return to experimental design.

6. **Triangulate and analyze evidence**
   - Score each link in the mechanism map using the evidence layers.
   - **Strong support:** agreement across at least two independent evidence layers.
   - **Moderate support:** one layer missing but remaining evidence internally consistent.
   - **Weak support:** single metric improvement without mechanistic corroboration.
   - Identify confounders: conductivity, viscosity, pH shifts, impurities, electrode history, separator effects, counter-electrode behavior, temperature, and assembly variability.
   - **Decision gate:** If confounders are uncontrolled, classify the outcome as provisional.

7. **Decision gate: classify outcome**
   - **Mechanism supported:** performance, mechanism, and control evidence align.
   - **Mechanism ambiguous:** performance changes but mechanism evidence is missing or mixed.
   - **Mechanism rejected:** controls contradict the causal chain or the predicted signature is absent.
   - **Performance-limited despite plausible mechanism:** mechanism is supported but device-level translation fails.
   - **Gate:** If mechanism is rejected, stop the current line and return to Step 3 or Step 2.

8. **Iterate or pivot**
   - If supported: test robustness under broader boundary conditions (rate, loading, architecture, related chemistries) before generalizing.
   - If ambiguous: add orthogonal characterization or redesign controls to isolate the weakest link.
   - If performance-limited: shift focus to interface adhesion, transport losses, or counter-electrode compatibility.
   - If all candidate branches fail stop conditions: document failed assumptions and propose a different material class or mechanism.
   - **Iteration stop rule:** Halt after three full cycles without convergence, or immediately upon encountering uncontrolled safety instability.

9. **Bound claims and document failure modes**
   - State claim boundaries explicitly: tested chemistry, cell format, operating window, and evidence layers used.
   - Distinguish literature-supported logic, analogous context, and agent-inferred extensions.
   - List residual failure modes and unresolved bottlenecks.
   - **Decision gate:** If claims exceed the tested boundary, downgrade to speculative and flag for future validation.

## Output Format

When using this skill, return:

1. **Scope and target system** – chemistry family, cell format, and dominant failure mode.
2. **Gap and mechanism map** – concise problem definition, proposed causal chain, and link status (supported / inferred / untested).
3. **Ranked hypotheses** – hypothesis, design lever, predicted observation, evidence strength, key assumption, likely failure mode.
4. **Minimal validation plan** – variables, controls, required evidence layers, evaluation metrics, and stop conditions.
5. **Analysis plan** – data-quality checks, confounder checks, mechanism-map scoring rules, and outcome classification.
6. **Iteration plan** – continuation criteria, revision triggers, and stop / deprioritization criteria.
7. **Claim boundary statement** – what is supported, what is inferred, what remains unproven, and explicit extrapolation limits.
8. **Validity and safety notes** – reproducibility requirements, non-operational safety boundaries, and compliance considerations.

## Validation Gates

- **Bottleneck clarity:** Is the failure mode defined as an observable, coupled chemical/physical problem?
- **Mechanistic validity:** Do all evidence layers support the same causal chain?
- **Control validity:** Are baseline, negative, inactive analogue, positive, and trend controls appropriately matched?
- **Statistical validity:** Are repeated runs, variability, outliers, and failure cases reported?
- **Reproducibility:** Do results persist across matched assembly and independent runs?
- **Boundary validity:** Are claims limited to the tested chemistry, cell format, and operating window?
- **Device relevance:** Do component-level or half-cell improvements translate into the target architecture?
- **Confounder validity:** Have conductivity, viscosity, pH-relevant chemistry, impurities, electrode history, separator, counter-electrode, electrolyte amount, temperature, and assembly effects been considered?
- **Evidence labeling:** Are literature-supported findings distinguished from new-agent inferences?

## Claim Boundaries

- Mechanism claims require agreement between at least two independent evidence layers (e.g., spectroscopic and electrochemical, or imaging and transport).
- Device-relevance claims require validation in the target cell architecture, not only in simplified configurations.
- Transferability claims to new chemistries or architectures are speculative until tested with the same workflow.
- Performance improvements observed without mechanism evidence are empirical only and must not be attributed to a causal chain.
- Do not present single-study results as field-wide consensus or as readiness for deployment.

## Failure Modes

- **Hypothesis fails falsification:** The predicted signature is absent in the intervention or present in the negative control.
- **Mechanism–performance decoupling:** Material-level metrics improve but cell-level performance does not, indicating interface or transport bottlenecks.
- **Confounding dominance:** An uncontrolled variable explains the observed effect.
- **Narrow-window artifact:** The effect appears only under a specific rate, loading, or geometry that is not representative of the target application.
- **Side-reaction masking:** Apparent capacity or efficiency gains arise from parasitic reactions rather than the intended redox pathway.
- **Irreversible activation:** Early performance gains disappear upon extended cycling or rest periods.
- **Safety barrier:** Uncontrolled instability, gas evolution, or hazardous by-product formation.

## Validity Checks

- Confirm that the mechanism map includes testable intermediates and is not a direct leap from formulation to performance.
- Verify that controls are designed to suppress competing mechanisms, not only to provide a baseline.
- Ensure that metrics are predefined and that best-case-only reporting is avoided.
- Check that raw data are traceable to sample identifiers and measurement conditions.
- Require independent replicates before accepting a mechanism claim.
- Do not extrapolate monotonic trends beyond tested regions without intermediate validation.
- Label all extrapolations to new materials, additives, or cell formats as agent-inferred hypotheses with explicit assumptions.

## Provenance

- Synthesized from cluster 57, subcluster 57.0 (`observable-driven mechanism discovery and validation`).
- Source skill references: `aqueous-metal-battery-interface-workflow` (e24ff5b92ca70794), `cellulose-hydrogel-zinc-battery-exploration` (aaed8720c67a39bd), `zinc-ion-electrode-research-workflow` (bc0933e81ddd9d3a), `neutral-aqueous-battery-mechanism-workflow` (54d97cebaace6895), `proton-conducting-gel-electrolyte-research-workflow` (545f4be5d01e8779), `aqueous-nizn-cathode-research-design` (2749bfd5e701cd3e), `aqueous-zinc-local-ion-regulation` (5e4be33d735cc3fd), `aqueous-zinc-ion-battery-research-design` (56f5b455a98f78cf).
- Paper-specific conditions, numerical results, and material recipes from the source skills have been excluded from the reusable workflow body.
