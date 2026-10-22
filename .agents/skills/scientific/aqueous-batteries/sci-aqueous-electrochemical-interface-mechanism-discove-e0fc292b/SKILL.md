---
name: sci-aqueous-electrochemical-interface-mechanism-discove-e0fc292b
description: A reusable end-to-end workflow for generating, testing, and iterating falsifiable hypotheses about coupled failure mechanisms at electrochemical energy-storage interfaces, with explicit controls, decision gates, and claim boundaries.
scienceevolve-title: "Aqueous battery interfaces · electrochemical interface mechanism discovery workflow 2"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Guide agents to translate observed performance bottlenecks at electrochemical interfaces into structured, mechanism-driven research programs. The workflow emphasizes hypothesis generation, minimal viable validation, orthogonal evidence triangulation, and evidence-based iteration rather than isolated performance optimization or paper reproduction.

# When to use

Use when a user asks to propose new research questions, design validation studies, or interpret evidence for electrochemical energy-storage systems where coupled transport, interfacial stability, and degradation mechanisms are ambiguous. Applicable to metal anodes, conversion or insertion cathodes, electrolyte additives, separator interfaces, and solid or quasi-solid electrochemical cells. Do not use for operational lab protocols, manufacturing recipes, or safety-critical execution details.

# Inputs required

- Target system and interface type (e.g., electrode–electrolyte, separator–electrode, host–active material).
- Observed bottleneck or performance gap expressed as a measurable limitation (e.g., irreversibility, rate limitation, mechanical failure, integration loss).
- Candidate mechanisms and prior evidence (literature trends, preliminary data, computational screening).
- Available design levers (material class, architecture, medium chemistry, interface modification).
- Evaluation constraints (scale, characterization access, safety boundaries, reproducibility requirements).

# Core Workflow

1. **Scope and bottleneck definition**  
   Frame the research question around a measurable performance or reliability gap. Identify the interface and subsystem(s) most likely to control it.  
   *Stop condition*: If the bottleneck cannot be expressed as a falsifiable metric, pause for clarification before proceeding.

2. **Mechanism mapping and observable selection**  
   Decompose the bottleneck into candidate mechanisms (e.g., ion transport, charge-transfer kinetics, interfacial side reactions, mechanical degradation). Assign observable signatures to each mechanism. Flag coupled failures that may produce overlapping signatures.

3. **Hypothesis generation and ranking**  
   Formulate competing hypotheses that link a design lever to a mechanism and a predicted change in observables. Tag evidence strength (high / medium / low / speculative). Record key assumptions, likely failure modes, and the smallest test that could falsify each hypothesis.  
   *Decision gate*: If no hypothesis is falsifiable with available constraints, stop and redefine the design space.

4. **Minimal viable validation design**  
   Define independent variables (intervention class, architecture, environment). Specify strong controls: baseline, negative (missing the active feature), positive or benchmark, and mechanism-adjacent comparator. Select paired metrics: one primary performance metric, one mechanism-specific metric, one stability metric, and one practical relevance metric. Predefine stop conditions: safety concern, irreproducibility, control–target equivalence, or metric trade-offs that violate acceptance thresholds.

5. **Multi-layer evidence collection**  
   Gather structural or material, chemical or interfacial, electrochemical, and integration-layer evidence under matched conditions. Maintain replication and randomized measurement order where feasible. Avoid operational fabrication or testing recipes.

6. **Analysis and mechanism triangulation**  
   Normalize comparisons and separate contributions of support, additive, and active architecture. Require alignment between performance trends and mechanism-specific observables. Quantify uncertainty and batch variability.  
   *Decision gate*:  
   - **Confirmed mechanism**: All evidence layers align → proceed to escalation.  
   - **Partial mechanism**: Performance improves but one evidence layer is missing → add diagnostic controls before optimization.  
   - **Artifact-prone**: Controls or reproducibility checks undermine the claim → reject the hypothesis and return to step 3.  
   - **Integration bottleneck**: Component-level gains fail after assembly → refocus on system integration in step 2.

7. **Iteration or termination**  
   - **Support**: Strengthen the hypothesis and test more demanding boundaries (e.g., higher loading, longer cycling, full-cell format).  
   - **Revise**: Update the mechanism map or descriptor set when predictions and observations diverge.  
   - **Refocus**: Shift to a different limiting mechanism if the current hypothesis is invalidated.  
   - **Stop**: Abandon if two independent controls contradict the claim, if improvement is artifact-dominated, or if safety or reproducibility thresholds are breached.  
   *Loop*: Return to step 3 or 4 with updated assumptions and controls.

8. **Boundary and provenance synthesis**  
   State external validity limits (lab-scale versus practical loading, half-cell versus full-cell, short-term versus long-term). Separate source-paper evidence, literature precedent, and agent-generated inference. Document residual risks and untested scaling conditions.

# Output Format

When using this skill, produce:

1. **Research question**: one concise, falsifiable question.
2. **Mechanism map**: candidate mechanisms, expected observables, and competing explanations.
3. **Hypothesis table**: hypothesis, mechanism, evidence strength, key assumptions, likely failure mode, and minimal validation.
4. **Experimental schema**: design variables, controls (baseline, negative, positive or comparator), metrics, and stop conditions.
5. **Analysis plan**: normalization rules, mechanism triangulation strategy, uncertainty treatment, and decision criteria.
6. **Iteration decision**: support, revise, refocus, or stop rationale based on possible outcomes.
7. **Boundary statement**: what is source-supported, what is inferred, and what cannot be generalized without additional evidence.

# Validation Gates

- **Mechanistic specificity**: Does the result require the proposed mechanism, or could leakage, side reactions, processing artifacts, or uncontrolled transport explain it?
- **Control adequacy**: Are baseline, negative, positive, and mechanism-adjacent controls present, interpretable, and measured under matched conditions?
- **Reproducibility**: Are trends supported by independent replicates, batch checks, and predefined success or failure criteria?
- **Accounting consistency**: Does charge, mass, or redox balance align with independent state measurements within uncertainty?
- **Statistical validity**: Are claims supported by appropriate sample sizes and uncertainty estimates rather than single best observations?

# Claim Boundaries

- Distinguish source-paper evidence from agent-generated inference for new systems.
- Do not treat a single study or dataset as field-wide consensus; triangulate with independent sources before generalizing.
- Limit claims to tested material classes, architectures, and operating regimes.
- Separate component-level success from system-level success.
- Avoid overstating commercial readiness, safety, or sustainability from lab-scale data.

# Failure Modes

- **Artifact-dominated improvement**: Performance gain arises from uncontrolled geometry, contact resistance, loading differences, or normalization bias rather than the intended mechanism.
- **Mechanism mismatch**: Performance improves but predicted observables are absent, indicating an unknown or alternative mechanism.
- **Hidden trade-off**: One metric improves while stability, efficiency, or compatibility degrades undetected.
- **Control failure**: Negative or inactive controls perform similarly to the target, invalidating the specific mechanism claim.
- **Boundary violation**: Gains appear only under narrow, non-practical conditions (e.g., low loading, excess electrolyte, small format).
- **Integration collapse**: Component-level improvements fail after full-device assembly.

# Validity Checks

- **Confounding**: Are conductivity, surface area, loading, substrate, binder, electrolyte, voltage window, and device architecture aligned across comparisons?
- **Mechanism ambiguity**: Do competing mechanisms (insertion, conversion, adsorption, passivation) produce overlapping signatures?
- **State accuracy**: Does characterization correspond to clearly defined electrochemical states and handling conditions?
- **Extrapolation risk**: Are lab-scale observations being generalized without scaling, loading, or format validation?
- **Literature grounding**: Are new claims triangulated with independent sources before broad generalization?

# Provenance

- Derived from cluster 9, subcluster 9.0 ("observable-driven mechanism discovery and validation").
- Synthesized from representative source skills: `mild-aqueous-zinc-anode-protection-exploration`, `li-s-battery-host-research-workflow`, `flexible-energy-electrolyte-exploration`, `mediator-ion-aqueous-battery-exploration`, `supercapacitor-material-research-workflow`, `li-organic-solid-battery-research-design`, `flexible-aqueous-battery-exploration`, `proton-insertion-battery-exploration`.
