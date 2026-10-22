---
name: sci-fiber-observable-driven-mechanism-discovery-workflo-8116defb
description: A reusable end-to-end workflow for designing research questions, experiments, and analyses that discover and validate mechanisms in coupled material-interface systems across energy storage, catalysis, and functional composites.
scienceevolve-title: "Fiber composites and battery materials · observable driven mechanism discovery workflow 3"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

This skill guides an agent to transform an observed performance bottleneck into a testable mechanism, design minimum viable validations with discriminating controls, and iterate until the mechanism is either supported, falsified, or bounded. It abstracts the shared scientific logic across domains where coupled transport, conversion, and stability phenomena dominate: diagnose the failure pathway, map it to a set of coupled functions, and validate each link in the chain with orthogonal evidence.

# When to use

- When a user asks to design research questions or experiments around a material, interface, or composite where performance is limited by coupled transport, conversion, or stability bottlenecks.
- When the goal is to link a structural or interfacial change to a functional outcome through observable evidence.
- When the user needs hypothesis generation, control design, mechanism triangulation, or iteration rules rather than a literature summary or operational recipe.
- When multiple properties compete (e.g., selectivity versus conductivity, capture versus transport) and the mechanism must be resolved before optimization.

# Inputs required

- Target system class and the dominant observable bottleneck (e.g., active-material loss, sluggish conversion, unstable interface, poor selectivity, mechanical degradation).
- Candidate material or interface design concept and its intended function.
- Available characterization and evaluation capabilities.
- Baseline or benchmark systems available for comparison.
- Application-relevant stressors and boundary conditions.
- Safety and compliance constraints for the intended context.

If any input is missing, state assumptions explicitly and mark downstream hypotheses as weaker.

# Core Workflow

1. **Bottleneck Diagnosis**
   - Identify the dominant failure mode from observable evidence (capacity fade, crossover, impedance growth, selectivity loss, structural degradation).
   - State the species, interface, or transport pathway responsible.
   - Explain why a single-function or passive solution is likely insufficient.

2. **Mechanism Mapping and Hypothesis Generation**
   - Map the bottleneck to a set of coupled functions (capture, conversion, transport, stabilization, selectivity).
   - Generate 2–5 mechanism-based hypotheses using the template: If [system] is limited by [bottleneck], then [intervention] should produce [structural/interface change] because [mechanism], leading to [metric improvement] while preserving [constraint].
   - Label each hypothesis with evidence strength (strong, moderate, weak, speculative), key assumptions, likely failure modes, and a discriminating observation that would support or falsify it.
   - Prioritize hypotheses that predict a tradeoff curve or a mechanism-specific signature rather than a single-metric gain.

3. **Control and Experiment Design**
   - Define a minimum viable validation that tests structure, transport/interaction, and function in stages.
   - Design a control matrix:
     - Baseline (unmodified).
     - Passive physical control (architecture without active chemistry).
     - Active chemistry control (chemistry without the architectural feature).
     - Physical mixture control (components without intentional integration).
     - Mechanistic control (variant expected to weaken or strengthen the proposed mechanism predictably).
   - Specify independent variables, dependent variables (primary performance plus mechanistic metrics), and covariates.
   - Predefine success criteria, failure criteria, and stop conditions.

4. **Staged Validation Execution**
   - **Stage A – Structure/Architecture Check**: Confirm the intervention formed as intended (morphology, uniformity, composition, interface bonding). **Gate**: if structural validation fails, stop and redesign the intervention before functional testing.
   - **Stage B – Transport/Interaction Check**: Measure the relevant transport, adsorption, or interfacial property predicted by the mechanism. **Gate**: if the mechanism-specific signature is absent, do not proceed to device-level attribution.
   - **Stage C – Function/Device Check**: Evaluate performance under application-relevant stressors. **Gate**: if function improves but Stage B is unmet, attribute cautiously and require additional mechanism probes before claiming causality.

5. **Evidence Triangulation and Claim Grading**
   - Build a mechanism-to-evidence table linking each proposed mechanism to structural, transport, and functional observations.
   - Normalize comparisons fairly (matched loading, thickness, protocol, geometry).
   - Grade the claim:
     - **A**: Orthogonal evidence agrees; controls rule out major confounders.
     - **B**: Most probes agree, but one important control or stability test is missing.
     - **C**: Performance changes but mechanism evidence is indirect.
     - **D**: Evidence is contradictory or confounded.

6. **Iteration Decision**
   - If the hypothesis is supported (Grade A/B), test boundary conditions (different loading, rate, duration, environment).
   - If the hypothesis is weak (Grade C), add the missing mechanism probe or control before expanding scope.
   - If the hypothesis is falsified or confounded (Grade D), return to Step 2 and revise the mechanism assumption that failed.
   - **Stop conditions**: the intervention underperforms passive controls after normalization; improvement is accompanied by unacceptable tradeoffs; results are irreproducible across independent samples; or safety/compliance boundaries are breached.

# Output Format

1. **Research Question** – Concise bottleneck and target system.
2. **Bottleneck Diagnosis** – Failure pathway and why single-function solutions are insufficient.
3. **Hypothesis Set** – 2–5 ranked hypotheses with evidence strength, assumptions, failure modes, and discriminating observations.
4. **Experimental Design** – Minimum viable validation, control matrix, variables, metrics, and stop conditions.
5. **Analysis Plan** – Mechanism-to-evidence table, normalization strategy, decision rules, and claim grading.
6. **Iteration Rules** – Conditions for support, falsification, and redesign.
7. **Validity and Safety Notes** – Confounders, reproducibility checks, boundary conditions, and non-operational safety boundaries.

# Validation Gates

- **Gate 1 (Structure)**: Intended architecture confirmed before function is claimed.
- **Gate 2 (Mechanism)**: Mechanism-specific transport or interaction evidence present before device-level attribution.
- **Gate 3 (Control)**: Intervention outperforms matched passive and physical-mixture controls after normalization.
- **Gate 4 (Stability)**: Performance or structure retention demonstrated under repeated operation or relevant stress.
- **Gate 5 (Reproducibility)**: Independent samples or repeated measurements show consistent trends.

# Claim Boundaries

- Distinguish directly measured evidence from inferred mechanism.
- Do not present a single study or dataset as field-wide consensus.
- Do not extrapolate beyond tested boundary conditions (loading, rate, environment, scale).
- Separate lab-scale mechanism validation from deployment or commercial readiness claims.
- Label agent-inferred hypotheses separately from literature-supported observations.

# Failure Modes

- Intervention fails structural validation (delamination, aggregation, phase separation, non-uniform distribution).
- Performance gain disappears under matched-loading or normalized comparison.
- Primary metric improves but competing constraint fails (e.g., selectivity versus conductivity, capture versus transport).
- Mechanism evidence is absent despite functional improvement.
- Results are irreproducible across independent samples or batches.
- Post-test characterization contradicts the proposed degradation or stabilization mechanism.

# Validity Checks

- **Confounding**: Control for mass loading, surface area, thickness, porosity, processing history, contact resistance, and measurement artifacts.
- **Reproducibility**: Require independent samples, batch variability reporting, and predefined endpoints.
- **Statistical validity**: Report uncertainty, avoid ranking by single runs, and use repeated measurements for key claims.
- **Boundary conditions**: Test whether conclusions hold under higher stress, longer duration, or different adjacent materials.
- **Mechanistic sufficiency**: Ensure evidence distinguishes among transport, adsorption, catalysis, stabilization, and structural buffering.

# Provenance

- Synthesized from cluster 36.0 (observable-driven mechanism discovery and validation).
- Source skills: lithium-sulfur-interlayer-research-design; sc-co2-catalyst-research-design; layered-intercalation-material-discovery; membrane-selectivity-research-agent; layered-material-battery-research-design; coupled-transport-composite-research; interface-coupled-catalytic-framework-design; lignocellulose-compost-research-design.
