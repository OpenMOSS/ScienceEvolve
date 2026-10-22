---
name: sci-fiber-battery-material-mechanism-discovery-workflow-21c592da
description: A reusable end-to-end workflow for designing battery and energy-materials studies that discover, discriminate, and validate mechanistic hypotheses using observable-driven controls and iterative claim bounding.
scienceevolve-title: "Fiber composites and battery materials · battery material mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

This skill guides agents in translating ambiguous performance gaps in battery and electrochemical energy-storage materials into structured, testable mechanistic hypotheses. It provides an end-to-end route from bottleneck identification through controlled validation, mechanism discrimination, and iterative redesign, while keeping claims bounded to the evidence.

# When to use

Use this skill when the user asks to:

- Propose new research questions around a performance bottleneck in electrochemical energy storage materials.
- Design a validation plan (computational or experimental) that isolates a mechanism using controls.
- Evaluate candidate materials, interfaces, or architectures by mechanistic descriptors rather than headline metrics.
- Convert a failure mode into a structured hypothesis portfolio with evidence strength and failure modes.
- Iterate on a research direction after initial results are ambiguous, contradictory, or partially supportive.

Do not use this skill as a general engineering manual, operational protocol generator, safety advisory, or source of device operating instructions.

# Inputs required

Before generating a plan, request or identify:

- Target system and performance bottleneck (e.g., capacity fade, instability, transport limitation).
- Candidate intervention classes (materials, interfaces, electrolytes, architectures).
- Observable evidence already available (literature, preliminary data, computational results).
- Baseline or benchmark systems for comparison.
- Constraints: feasibility, safety, cost, downstream validation access, and modeling or experimental boundaries.
- Whether the goal is broad hypothesis generation or a focused validation plan.

If inputs are missing, state assumptions explicitly and downgrade evidence strength.

# Core Workflow

Follow this ordered route from bottleneck to bounded claim. Apply decision gates at each stage; return to earlier steps when a gate fails.

1. **Bottleneck Framing & State Decomposition**  
   Define the performance gap in terms of observable symptoms. Decompose the aggregate outcome into candidate intermediate states, failure modes, or transport pathways rather than a single metric.  
   **Gate:** If the bottleneck cannot be linked to at least one observable state or process, stop and request more evidence.

2. **Mechanism-Aware Hypothesis Generation**  
   Generate multiple competing hypotheses linking structure or property changes to the bottleneck. For each hypothesis specify: mechanistic claim, evidence strength (high / medium / low / speculative), key assumptions, predicted observables, and likely failure modes.  
   **Gate:** If hypotheses are indistinguishable with available observables, redesign the observable set before proceeding.

3. **Control-Centered Validation Design**  
   Define independent variables (intervention), dependent variables (mechanism-aligned observables), and controlled variables. Build a control set: baseline, negative control (expected weak or inert), positive control (known behavior, if available), and mechanism-isolating control (varies one driver at a time). Define primary metrics tied to the mechanism and secondary metrics for trade-offs. Define stop conditions: safety concern, control failure, irreproducible baseline, or mechanism ambiguity.  
   **Gate:** If controls cannot isolate the proposed mechanism, redesign before execution.

4. **Evidence Collection & Triangulation**  
   Execute the planned observations to collect mechanism-aligned data. Triangulate using at least two independent evidence streams (e.g., electrochemical plus structural, or thermodynamic plus kinetic).  
   **Gate:** If evidence streams contradict, flag the hypothesis as ambiguous and proceed to iteration.

5. **Mechanism Discrimination & Ranking**  
   Classify each hypothesis as supported, partially supported, contradicted, or ambiguous. Rank candidates by robustness across relevant states, not by a single metric. Identify trade-offs (e.g., retention versus transport, stability versus capacity).  
   **Gate:** If no hypothesis survives baseline comparison and control checks, stop and reformulate the bottleneck.

6. **Claim Bounding & Shortlist**  
   Produce a shortlist of candidates or mechanisms with explicit evidence labels. State boundary conditions where the claim should not be extrapolated. Separate paper-supported findings, literature analogies, and new inferences.

7. **Iteration or Redesign**  
   - **If supported:** Escalate to stronger validation (realistic loading, longer cycles, full-cell context).  
   - **If partially supported or ambiguous:** Add mechanism-isolating controls, refine descriptors, or test alternative structural states, then return to Step 3.  
   - **If contradicted:** Preserve the failed prediction, generate competing mechanisms, and return to Step 2.  
   **Stop condition:** Exit the loop when the hypothesis is either validated under realistic constraints, falsified by multiple independent controls, or blocked by safety or feasibility limits.

# Output Format

When using this skill, produce:

1. **Research question:** A concise, testable question tied to a bottleneck.
2. **Bottleneck and mechanism map:** Failure modes, candidate states, and proposed causal links.
3. **Hypothesis portfolio:** Each with evidence strength, key assumptions, predicted observables, and failure modes.
4. **Validation plan:** Variables, control table, metrics, and stop conditions.
5. **Analysis plan:** Triangulation strategy, baseline-normalized comparison, and trade-off checks.
6. **Iteration rules:** Decision tree for supported, partial, contradicted, and ambiguous outcomes.
7. **Validity and boundary statement:** Confounders, reproducibility needs, extrapolation limits, and safety considerations.

# Validation Gates

- **Bottleneck clarity gate:** The performance gap must be decomposable into observable states or processes.
- **Hypothesis falsifiability gate:** Every hypothesis must have a defined observable that could contradict it.
- **Control integrity gate:** Baseline and at least one negative or mechanism-isolating control must be included before interpreting results.
- **Triangulation gate:** Mechanism claims require converging evidence from two or more independent observables.
- **Trade-off gate:** Candidates improving one metric while severely worsening another must be flagged and not auto-advanced.
- **Realism gate:** Claims about practical relevance require validation under device-relevant constraints (loading, balance, scale) before escalation.

# Claim Boundaries

- Do not claim battery-level device performance from single-mechanism screening or idealized models.
- Do not extrapolate from one material class, electrolyte family, or cell format to all electrochemical systems.
- Distinguish computational evidence, mechanistic inference, and untested system-level claims with explicit labels.
- Treat analogy-based hypotheses as lower evidence strength until directly validated.
- Avoid presenting a single study's ranking as field-wide consensus.

# Failure Modes

- **Mechanism misattribution:** Improvement caused by uncontrolled variables (e.g., surface area, conductivity additive, electrolyte excess) rather than the proposed mechanism.
- **Overbinding / over-optimization:** Strong intermediate retention or high capacity that blocks transport, triggers side reactions, or degrades stability.
- **Control confounding:** Baseline or control groups are mismatched in loading, morphology, or environment, producing false mechanism support.
- **Model artifact:** Simulation results depend on specific surface terminations, finite-size effects, or unphysical configurations.
- **Scale-up fragility:** A mechanism valid in thin electrodes or dilute conditions fails under realistic loading or full-cell balance.
- **Anode/electrolyte masking:** Cathode or host improvements are obscured by counter-electrode degradation, separator effects, or crossover.

# Validity Checks

- **Mechanism alignment:** Descriptors must connect to the proposed failure mode, not merely correlate with it.
- **Baseline relevance:** Rankings and comparisons must be meaningful relative to appropriate unmodified or common references.
- **State coverage:** Multiple relevant intermediates, failure modes, or structural states must be considered.
- **Model consistency:** Candidates must be compared under comparable assumptions; sensitivity to geometry or method must be reported.
- **Reproducibility:** Repeated or independent evaluations should support the ranking; outliers must be inspected for artifacts.
- **Confounding isolation:** Verify that the counter-electrode, electrolyte, separator, loading, or normalization cannot explain the observed effect.
- **Statistical robustness:** Report variability, effect sizes, and whether trends survive normalization and replicate checks.
- **Evidence labeling:** Clearly separate source-paper patterns, current computational or experimental evidence, literature benchmarks, and new agent inferences.

# Provenance

- Derived from cluster 10.1 ("observable-driven mechanism discovery and validation") of the scientific skills codex.
- Synthesized from source skills: `lis-battery-computational-screening`, `mg-ion-battery-anode-exploration`, `assb-anode-interface-exploration`, `bioinspired-hydrogel-bioelectrode-workflow`, `li-s-material-screening-workflow`, `aqueous-zinc-cathode-research-design`, `mn-oxide-zinc-battery-research-workflow`, `conductive-polar-host-redox-design`.
- Paper-specific materials, parameters, and conclusions have been abstracted; only the shared workflow route is retained.
