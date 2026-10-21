---
name: sci-aqueous-zinc-aqueous-battery-interface-mechanism-di-5f819333
description: Reusable end-to-end workflow for observable-driven mechanism discovery and validation in aqueous battery interfaces, emphasizing hypothesis generation, control-rich experimentation, iterative claim bounding, and multi-layer evidence integration.
scienceevolve-title: "Aqueous battery interfaces · zinc aqueous battery interface mechanism discovery workflow"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Guide an agent to transform practical aqueous battery interface bottlenecks into testable mechanism hypotheses, control-rich validation plans, and bounded research conclusions. The workflow treats interphases, electrode architecture, electrolyte environments, and non-active components as controllable design variables, enforcing iterative claim bounding through multi-layer evidence integration.

# When to use

Trigger this skill when a user asks to:

- Propose new electrode, anode, or interphase research directions for aqueous metal-ion batteries limited by interface stability, transport, or degradation.
- Design validation plans around interfacial engineering, electrolyte mediation, host architecture, or protective layers.
- Diagnose coupled failure modes such as nonuniform deposition, passivation, corrosion, or mechanical fracture and map them to causal mechanisms.
- Convert observational bottlenecks into falsifiable hypotheses with explicit stop conditions and iteration rules.

Do not use this skill for general literature review, operational wet-lab recipes, hazardous protocol execution, or non-electrochemical materials domains.

# Inputs required

Before generating a plan, request or infer:

- Target electrode role and aqueous chemistry class.
- Observable bottleneck and dominant failure mode(s).
- Candidate intervention class (e.g., interphase modification, host architecture, electrolyte additive, separator design).
- Baseline system and available comparison controls.
- Accessible characterization categories (electrochemical, structural, chemical, kinetic).
- Constraints: cell format, loading limits, safety, environmental, and budget boundaries.
- Intended output scope: hypothesis screening, experimental design, analysis plan, or iteration roadmap.

# Core Workflow

1. **Bottleneck Decomposition & Mechanism Mapping**
   - Start from an observable practical bottleneck, not a material label.
   - Decompose into coupled failure modes: mechanical degradation, chemical instability, transport limitation, interfacial side reactions, or active-material isolation.
   - Build a causal chain linking the candidate design variable to interface structure, local transport or mechanics, and electrochemical performance.

2. **Hypothesis Portfolio Generation**
   - Generate at least three competing hypotheses.
   - For each, specify: mechanism claim, predicted positive and negative signatures, evidence strength (strong / moderate / weak / speculative), key assumptions, and likely failure modes.
   - Include hypotheses that test interface compatibility, transport or conductivity, and mechanical or chemical stability.
   - **Gate — Candidate Gate:** Proceed only if every hypothesis is falsifiable and tied to measurable intermediate signals; otherwise refine the bottleneck definition.

3. **Minimal Validation Design**
   - Define one primary success metric directly linked to the bottleneck.
   - Select one independent design variable per validation round.
   - Specify controls: baseline (current practice), negative (absent proposed function), mechanism-specific (isolates architecture versus interphase effects), and positive or benchmark if available.
   - Predefine stop and revise criteria before data collection.
   - **Gate — Design Gate:** Proceed only if controls can separate material, processing, and architecture contributions; otherwise redesign.

4. **Multi-Layer Evidence Planning**
   - Plan non-operational measurements across evidence layers:
     - Performance: capacity, retention, efficiency, rate response.
     - Kinetic and transport: impedance, polarization, scan-rate behavior.
     - Structural and chemical: phase identity, interface continuity, post-test degradation.
     - Device-level: behavior under realistic format or loading if relevant.
   - **Gate — Data Gate:** Proceed only if fresh, operating, and post-test states are all addressable; otherwise reduce scope.

5. **Mechanism Discrimination & Analysis**
   - Integrate evidence streams; check whether performance, mechanism indicators, and controls move in the same direction.
   - Use negative controls to rule out direct electrochemical contribution or parasitic activity from the candidate component.
   - Use architecture and processing controls to rule out confounding.
   - Distinguish measured observation from inferred mechanism.
   - **Gate — Mechanism Gate:**
     - If mechanism indicators contradict the hypothesis, reject or revise.
     - If performance improves without mechanism support, investigate processing artifacts or hidden variables.
     - If mechanism indicators improve without performance gains, identify the missing bottleneck.

6. **Robustness & Stress Testing**
   - Assess reproducibility across independent preparations or batches.
   - Escalate to realistic stressors (higher loading, extended cycling, rate changes, full-cell coupling) only after baseline mechanism evidence is consistent.
   - **Gate — Robustness Gate:**
     - If gains vanish under stress or are irreproducible, bound claims to narrow conditions or return to Step 2.
     - If the mechanism persists, proceed to claim bounding.

7. **Claim Bounding & Iteration**
   - Label each claim as demonstrated, inferred, or speculative.
   - State boundary conditions: tested chemistry, architecture, loading, format, and operating regime.
   - Apply iteration rules:
     - **Supported:** escalate to broader conditions or the next design variable.
     - **Mixed:** add discriminating controls and return to Step 3.
     - **Contradicted:** return to Step 2 with a revised mechanism map.
     - **Irreproducible:** improve batch control and replicate design before broader conclusions.
   - **Gate — Iteration Gate:** Finalize only when claim scope is justified by the evidence volume and quality.

8. **Research Plan Finalization**
   - Compile the study plan, analysis plan, validation plan, documented failure modes, and explicit claim boundaries.

# Output Format

Return the following structure:

1. **Research question** — One-sentence bottleneck and target system.
2. **Failure-mode map** — Dominant coupled failure modes and causal pathway.
3. **Hypothesis portfolio** — Competing hypotheses with mechanism chains, evidence strength, key assumptions, predicted indicators, and likely failure modes.
4. **Minimal validation plan** — Primary metric, baseline, negative control, mechanism-specific control, stressor sequence, and stop conditions.
5. **Analysis plan** — Evidence layers, consistency checks, control interpretation, and statistical and reproducibility checks.
6. **Iteration roadmap** — Actions for supported, mixed, negative, and irreproducible outcomes.
7. **Claim boundary statement** — Verified claims, inferred claims, confounders, and extrapolation limits.
8. **Safety note** — Non-operational safety and ethics considerations.

# Validation Gates

- **Candidate Gate (Step 2):** Hypotheses must be falsifiable, mechanism-linked, and predict measurable signatures. If not, refine bottleneck mapping.
- **Design Gate (Step 3):** Controls must isolate the intended variable from material, architecture, and processing confounders. If not, redesign.
- **Data Gate (Step 4):** Evidence plan must cover fresh, operating, and post-test states. If incomplete, reduce scope or pause.
- **Mechanism Gate (Step 5):** Mechanism indicators must align with performance changes and control results. If contradictory, reject or revise the hypothesis.
- **Robustness Gate (Step 6):** Improvements must reproduce across batches and persist under realistic stressors. If not, bound claims.
- **Iteration Gate (Step 7):** Claim scope must match evidence strength. If mismatched, loop to the appropriate step.

# Claim Boundaries

- **Demonstrated:** Directly measured in the target system with matched controls and converging evidence layers.
- **Inferred:** Supported by one independent mechanism indicator or strong analogy, but not fully controlled.
- **Speculative:** Plausible by material analogy or theory, yet unverified in the target system.
- Do not treat a single positive result as field-wide consensus.
- Do not generalize beyond the tested chemistry, architecture, loading, and operating window.
- Distinguish half-cell mechanism insight from full-cell practical viability.
- Distinguish material-level evidence from device-level readiness or manufacturability.

# Failure Modes

- The candidate fails to improve the primary metric versus baseline.
- Improvement disappears when architecture or processing is controlled.
- Negative controls show substantial direct electrochemical activity or side reactions.
- Mechanism indicators move opposite to the predicted direction.
- Performance gains are not reproducible across independent preparations.
- Short-term gains are accompanied by accelerated long-term degradation.
- Full-cell coupling negates electrode-level benefits.
- The benefit appears only under an unreasonably narrow condition set.

# Validity Checks

Before finalizing any plan or conclusion, verify:

- **Confounding:** Loading, thickness, drying history, dispersion, substrate, and processing route are controlled.
- **Specificity:** The candidate variable specifically addresses the proposed mechanism.
- **Repeatability:** Independent preparations or batches are included.
- **Boundary conditions:** The mechanism is tested under realistic stressors relevant to the claim.
- **Statistical validity:** Variability, uncertainty, and outlier handling are reported where relevant.
- **Alternative explanations:** Side reactions, porosity changes, conductivity differences, or mechanical artifacts are considered.
- **Extrapolation boundary:** Conclusions are limited to the tested system rather than generalized beyond evidence.
- **Safety level:** The plan remains at research-design level without executable hazardous details.

# Provenance

Synthesized from cluster 8 / subcluster 8.0 (observable-driven mechanism discovery and validation). Derived from source skills: `azib-interface-electrode-workflow`, `aqueous-sodium-electrode-workflow`, `zinc-ion-cathode-interface-research-workflow`, `aqueous-battery-redox-exploration`, `zinc-electrolyte-interfacial-research`, `flexible-aqueous-electrode-exploration`, `zinc-interface-research-workflow`, `aqueous-zinc-anode-research-workflow`.
