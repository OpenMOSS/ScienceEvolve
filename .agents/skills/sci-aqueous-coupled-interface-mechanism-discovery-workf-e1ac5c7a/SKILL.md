---
name: sci-aqueous-coupled-interface-mechanism-discovery-workf-e1ac5c7a
description: A reusable end-to-end workflow for designing, validating, and iterating mechanism-driven hypotheses in coupled electrochemical interface systems, emphasizing multi-scale evidence, strong controls, and claim bounding.
scienceevolve-title: "Aqueous battery interfaces · coupled interface mechanism discovery workflow"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Guide agents in transforming a system-level performance bottleneck into a testable mechanism chain, designing controlled experiments that isolate causal links, and iterating based on converging multi-scale evidence rather than single-metric optimization.

# When to use

Use when the user needs to:
- Propose new research questions for electrochemical energy-storage systems with coupled interface, electrode, and electrolyte degradation.
- Design hypothesis-driven validation plans for interfacial stabilization, deposition regulation, or side-reaction suppression.
- Evaluate whether a proposed material, additive, or architectural strategy has a coherent, falsifiable mechanism.
- Iterate experimental plans based on ambiguous, supporting, or contradictory evidence.

Do not use for operational protocols, safety-critical manufacturing settings, or as a substitute for institutional safety review.

# Inputs required

- Target system and application context.
- Primary failure mode or bottleneck (e.g., uneven deposition, side reactions, interphase instability).
- Candidate intervention class (e.g., interface layer, electrolyte additive, host architecture, salt design).
- Available measurement layers (electrochemical, structural, spectroscopic, microscopic, computational).
- Constraints: safety, cost, scalability, environmental, and compliance boundaries.
- Desired output type: research question, hypothesis set, experimental plan, analysis protocol, or iteration roadmap.

# Core Workflow

1. **Coupled Failure Diagnosis**
   - Frame the bottleneck as an interacting network of at least two failure processes (e.g., morphology plus side reaction, passivation plus fracture).
   - Identify the dominant feedback loop and the earliest observable signature.
   - *Decision gate:* If the failure cannot be expressed as a coupled mechanism, stop and reframe the problem.

2. **Mechanism Chain Construction**
   - Build a causal chain from the intervention to the system-level outcome.
   - Typical links: design variable → local environment change → interfacial reaction pathway → interphase/transport property → morphology/phase evolution → cell-level metric.
   - Label each link as established, inferred by analogy, or speculative.
   - *Stop condition:* If a link lacks any conceivable observable proxy, narrow the claim or abandon the chain.

3. **Hypothesis Generation & Ranking**
   - Generate 3–5 competing hypotheses that address the coupled failure.
   - For each, specify: mechanistic rationale, evidence strength (Strong/Moderate/Weak/Speculative), key assumptions, predicted observations, likely failure modes, and transferability boundary.
   - Include at least one null/alternative hypothesis where the effect arises from confounding (loading, area, geometry, impurities).
   - *Decision gate:* Rank by falsifiability and diagnostic richness; deprioritize hypotheses that require untestable assumptions.

4. **Minimal Viable Validation Design**
   - Define independent variables that isolate one design lever.
   - Define dependent variables across four layers: bulk/solution, interface/interphase, morphology/degradation, and device performance.
   - Establish a matched baseline and a control set: baseline, negative/specificity, ablation, and positive (if available).
   - Pre-register stop conditions: e.g., improvement in one metric worsens a more important system-level metric; mechanism evidence contradicts performance claim; results are irreproducible.
   - *Stop condition:* Do not proceed to broad screening until the minimal validation passes.

5. **Multi-Layer Evidence Collection**
   - Collect at least three independent evidence layers (e.g., electrochemical + interfacial + morphological).
   - Ensure matched handling, comparable cycle points, and consistent normalization across all samples.
   - Record confounders: surface roughness, loading, electrolyte balance, impurities, temperature, assembly variation.

6. **Mechanism-Consistency Analysis**
   - Map each measurement to its link in the mechanism chain; mark supported, unsupported, or untested.
   - Check causality: does the control set isolate the proposed function?
   - Check convergence: do bulk, interface, morphology, and cell-level metrics tell a consistent story?
   - Check translation: does half-cell evidence survive in full-cell or realistic configurations?
   - *Decision gate:* If evidence conflicts, classify the mechanism as unresolved and halt claim escalation.

7. **Iteration & Update**
   - **If supported:** Narrow claims to the validated boundary, add specificity controls, and test long-term stability or translation.
   - **If ambiguous:** Identify the weakest link, add direct diagnostics for that link, repeat with independent samples.
   - **If contradicted:** Preserve the negative result as a boundary condition, revise the mechanism map, and generate a narrower follow-up hypothesis.
   - *Stop condition:* Advance candidates only when full-system improvement and mechanism evidence are mutually consistent.

8. **Claim Bounding & Documentation**
   - State what is directly demonstrated, what is inferred from correlated evidence, and what remains extrapolative.
   - Define explicit boundary conditions (chemistry, format, loading, rate, temperature) beyond which the claim is untested.
   - Separate source-paper evidence, transferable pattern, and agent-generated inference.

# Output Format

Return a structured research plan containing:
1. **Research question** – concise statement of the bottleneck and targeted failure mode.
2. **Mechanism chain** – causal links with evidence strength and key assumptions.
3. **Ranked hypotheses** – table with rationale, predicted observations, likely failure modes, and boundaries.
4. **Experimental design** – variables, controls, measurement layers, and stop conditions.
5. **Analysis plan** – mechanism mapping, consistency checks, causality tests, and claim-labeling rules.
6. **Iteration roadmap** – next steps for positive, ambiguous, and negative outcomes.
7. **Validity and safety notes** – confounders, reproducibility checks, extrapolation limits, and hazard boundaries.

# Validation Gates

- **Coupled-failure gate:** The problem is framed as an interacting mechanism network, not a single-metric optimization.
- **Falsifiability gate:** Every hypothesis has at least one measurable observation that could contradict it.
- **Control gate:** Baseline, negative/specificity, and ablation controls are defined before data collection.
- **Multi-layer gate:** Evidence spans at least three independent measurement layers.
- **Consistency gate:** Mechanism chain links are mutually consistent before claim escalation.
- **Translation gate:** Half-cell claims are labeled separately from full-system claims.

# Claim Boundaries

- Claims are scoped to the tested system, chemistry, and operating envelope.
- Mechanism claims require converging evidence across multiple measurement layers.
- Performance claims require matched controls and reproducibility across independent samples.
- Do not present laboratory-scale findings as field-wide consensus, deployment-ready, or commercially validated.
- Distinguish directly demonstrated results from inferred or extrapolative conclusions.

# Failure Modes

- **Hypothesis drift:** Mechanism is revised post-hoc to fit performance data without predictive tests.
- **Single-metric optimization:** Improvement in one metric masks degradation in another (e.g., smoother deposition but higher side-reaction rate).
- **Confounding artifact:** Apparent benefit arises from loading, surface area, geometry, or handling differences rather than the intended mechanism.
- **Scale-translation failure:** Mechanism works in simplified cells but fails under realistic constraints or full-system coupling.
- **Irreproducibility:** Results depend on narrow, uncontrolled, or unreported experimental conditions.
- **Over-extrapolation:** Conclusions are generalized beyond tested boundary conditions without additional evidence.

# Validity Checks

Before finalizing any plan or conclusion, verify:
- Are hypotheses mechanism-first rather than material-name copying?
- Does each hypothesis have a falsifiable measurement and defined failure mode?
- Are baseline, vehicle, positive, negative, and specificity controls appropriate?
- Are anode, cathode, electrolyte, and separator effects separated rather than conflated?
- Are confounders (pH, ionic strength, mass transport, impurities, handling) recorded?
- Are repeated trials and variability estimates planned for key comparisons?
- Are early-cycle conditioning effects distinguished from stable long-term behavior?
- Are ex situ observations checked for handling or transfer artifacts?
- Are computational or spectroscopic claims limited by their stated assumptions?
- Are claims framed as evidence for the proposed system, not as universal truth?

# Provenance

Synthesized from cluster 47 / subcluster 47.1 (observable-driven mechanism discovery and validation). Source skills: shared-electrolyte-additive-research (3dbf50ea78d5bdef), aqueous-metal-anode-interface-research (9666d76eec899bb8), zinc-battery-interphase-exploration (8158c2e2afdddbcb), aqueous-zinc-anode-research-workflow (7c125bafa9347dd8), anode-free-metal-battery-exploration (7cac9e66f8c732c2), coupled-mechanism-energy-storage-research (2658f38765f9668d), interfacial-salt-design-aqueous-batteries (c0edf10829d3222d), porous-metal-anode-exploration (fa2aa179f0896de2).
