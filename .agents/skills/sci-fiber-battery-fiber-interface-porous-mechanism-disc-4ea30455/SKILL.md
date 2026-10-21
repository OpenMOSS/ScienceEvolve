---
name: sci-fiber-battery-fiber-interface-porous-mechanism-disc-4ea30455
description: A reusable end-to-end workflow for designing, validating, and iterating mechanism-driven hypotheses in battery and porous electrochemical systems using structured controls, multi-modal evidence, and explicit claim boundaries.
scienceevolve-title: "Fiber composites and battery materials · battery fiber interface porous mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Use this skill to help agents transform system-level performance gaps in electrochemical energy-storage and porous-interface systems into testable mechanism hypotheses, then validate them through staged experiments with strong controls and explicit claim boundaries. The workflow teaches a transferable method: decompose coupled failure modes, anchor function at the relevant interface or architecture, discriminate mechanisms with orthogonal evidence, and iterate based on control-informed inference rather than headline metrics.

# When to use

Trigger this skill when the user asks to:

- generate new research questions for batteries, porous electrodes, fibrous scaffolds, or interfacial architectures;
- design a multifunctional binder, coating, separator, interlayer, or host-additive concept;
- evaluate how a structural or chemical feature suppresses mobile-species loss, improves transport, or stabilizes interfaces while preserving mechanics;
- plan a mechanism-focused validation workflow that links molecular or microstructural function to cell-level performance;
- convert material-level observations into system-level hypotheses with scale-stress, compatibility, or device-balance considerations.

Do not use this skill as a recipe for executing fabrication, electrochemical testing, or hazardous materials handling. It is for research design, methodological planning, and evidence evaluation only.

# Inputs required

Before generating a plan, ask for or infer:

- target system class and dominant soluble intermediate, mobile species, or failure mode;
- primary bottleneck: transport, interfacial instability, mechanical degradation, active-material isolation, or a coupled combination;
- candidate architecture features: porous scaffold, functional interface, fiber network, confinement layer, or additive motif;
- baseline system and available negative/positive controls;
- available characterization classes: electrochemical, spectroscopic, imaging, transport, mechanical, post-operation;
- performance metrics and application constraints: loading, rate, cycling, normalization basis, safety boundaries;
- intended validation level: component screening, half-cell, full-cell, or system-relevant demonstration.

If critical inputs are missing, proceed with explicit assumptions and label the plan as assumption-sensitive.

# Core Workflow

Follow this ordered end-to-end route. Advance through a stage only after its decision gate is satisfied.

## Stage 1 — System Framing & Bottleneck Decomposition
1. State the observable performance gap in the target system.
2. Decompose the gap into coupled mechanisms (e.g., electron transport, ion transport, mobile-intermediate migration, interfacial degradation, mechanical failure).
3. Rank mechanisms by likely impact and identify which are addressable by architecture or interface design.
4. **Decision gate:** If the bottleneck cannot be operationalized into an observable failure mode with a plausible architectural remedy, stop and refine the research question.

## Stage 2 — Hypothesis Generation & Evidence Grading
1. Generate at least three mechanism-linked hypotheses that map candidate features to specific failure modes.
2. For each hypothesis specify: expected mechanism, key assumptions, likely failure modes, and discriminating measurements.
3. Label evidence strength: strong (direct analogy + multi-modal support), moderate (plausible mechanism + partial controls), weak (literature precedent only), or speculative.
4. Explicitly state trade-off risks (e.g., confinement vs. transport, conductivity vs. side reactions).
5. **Decision gate:** If no hypothesis is falsifiable with the available diagnostics, redesign the control hierarchy or stop.

## Stage 3 — Experimental Design with Control Hierarchy
1. Define a staged validation funnel: component → composite → paired subsystem → full system.
2. Select independent variables that isolate one mechanism at a time; hold processing history constant.
3. Establish a control hierarchy:
   - Baseline: unmodified reference.
   - Negative control: architecture lacking the proposed functional feature.
   - Component-isolation controls: scaffold-only, interface-only, or additive-only variants.
   - Process control: identical processing without the active functional component.
   - Positive/strong control: known benchmark or capacity-matched system with transparent accounting.
4. Define metrics in four layers: mechanism diagnostics, electrochemical/transport performance, mechanical/structural integrity, and system-level constraints.
5. Predefine success criteria and stop conditions.
6. **Decision gate:** If controls cannot separate the proposed mechanism from confounders (loading, conductivity, morphology, processing effects), revise the matrix before proceeding.

## Stage 4 — Mechanism Discrimination & Data Analysis
1. Confirm architecture formation and uniformity before performance claims.
2. Analyze evidence in order: structure → mechanism → performance → system relevance.
3. Use multi-modal validation (e.g., imaging, spectroscopy, transport, electrochemical) to test a consistent explanation.
4. Compare candidate against all controls to assign causality; treat performance improvement without mechanism evidence as insufficient.
5. Classify the dominant bottleneck using control contrasts and post-operation diagnostics.
6. **Decision gate:**
   - If mechanism evidence supports the hypothesis, proceed to Stage 5 (Claim Bounding).
   - If evidence is ambiguous, return to Stage 3 to add a targeted diagnostic experiment.
   - If evidence contradicts the hypothesis, proceed to Stage 6 (Iteration & Redesign).

## Stage 5 — Claim Bounding & Validation
1. Label each conclusion by evidence type: paper-supported, literature-supported, target-system inferred, assumption-sensitive, or not transferable.
2. Define boundary conditions: applicable chemistry, loading range, cell format, and validation level.
3. Document residual failure modes, reproducibility status, and unresolved uncertainty.
4. **Final validation gate:** If claims exceed what the data support, downgrade them and return to Stage 2 or 4. If bounded, finalize outputs.

## Stage 6 — Iteration & Redesign
1. Identify the weakest validated link among transport, interface, mechanics, and system constraints.
2. Update the hypothesis: confirm, revise, split, downgrade, or abandon.
3. Redesign one variable at a time based on control-informed inference.
4. **Stop conditions:**
   - Safety or compliance boundary reached.
   - Hypothesis falsified by controls.
   - Results irreproducible across independent samples.
   - Unacceptable trade-off that violates system-level constraints.
   - Confounding variables explain the observed effect.
5. Return to Stage 2 with the updated hypothesis.

# Output Format

When using this skill, produce:

1. **Research Question** — Target system; observable failure mode; proposed architectural intervention; scientific importance.
2. **Bottleneck Map** — Ranked failure modes and mechanism categories.
3. **Hypothesis Set** — At least three hypotheses with evidence strength, key assumptions, expected mechanism signal, likely failure mode, and discriminating measurement.
4. **Experimental Design Plan** — Staged validation funnel; variables; control hierarchy; primary and mechanism metrics; success and stop criteria.
5. **Analysis Plan** — Structure-to-mechanism-to-performance chain; control interpretation rules; multi-modal validation checklist; bottleneck classification method.
6. **Iteration Decision Rules** — Conditions for confirming, revising, or abandoning each hypothesis; next minimal experiment for each outcome.
7. **Validity & Safety Statement** — Confounders addressed; reproducibility requirements; boundary conditions; non-operational safety constraints.
8. **Claim Boundary Summary** — Evidence labels for each conclusion; limits of generalization; residual risks.

# Validation Gates

Before advancing between stages or finalizing outputs, verify:

- **Confounding isolation:** Can the control hierarchy separate the proposed mechanism from morphology, conductivity, processing, and additive effects?
- **Mechanism discrimination:** Can the plan distinguish trapping, catalytic conversion, transport improvement, interfacial stabilization, and mechanical buffering?
- **Reproducibility:** Are independently prepared samples or repeated measurements required for central claims?
- **Transport balance:** Does the design preserve necessary ion/electron movement without excessive polarization or blockage?
- **Mechanical integrity:** Are adhesion, flexibility, swelling, or cracking evaluated for films, scaffolds, and interlayers?
- **Statistical validity:** Are variability, normalization basis, and uncertainty reported rather than relying on single representative curves?
- **Boundary realism:** Does the plan test whether the mechanism survives higher loading, longer cycling, rate changes, or post-operation inspection?
- **Safety compliance:** Are recommendations kept at the research-design level, avoiding executable hazardous procedures?

# Claim Boundaries

- Treat all architecture-specific performance gains as context-dependent until validated across multiple cell formats and stress conditions.
- Separate **verified by direct evidence**, **consistent with source-review pattern**, and **inferred for the new system** in every conclusion.
- Do not generalize from one material pair or prototype to an entire chemistry class or commercial readiness.
- Mark claims as assumption-sensitive when they depend on untested accessibility, stability, or compatibility assumptions.
- Avoid presenting a single proof-of-concept result as field-wide consensus.

# Failure Modes

Stop or redirect the workflow when:

- improvement appears in only one metric while mechanism indicators remain unchanged;
- a component-isolation control performs similarly to the full design, weakening causal attribution;
- impedance, polarization, or mechanical damage increases enough to offset performance gains;
- the hypothesis depends on an unsupported assumption about feature accessibility or stability;
- results are irreproducible across independently prepared samples or batches;
- the scale-stress variable is confounded with unrelated material or assembly changes;
- post-operation evidence contradicts the proposed mechanism;
- safety, environmental, or compliance boundaries are reached.

# Validity Checks

Before presenting any research plan or interpretation:

- Ensure the research question targets a specific coupled failure mode, not a vague "better system" goal.
- Confirm that every hypothesis includes evidence strength, key assumptions, and a falsifying observation.
- Verify that controls include baseline, negative, component-isolation, process, and strong/positive variants where feasible.
- Check that metrics span mechanism diagnostics, performance, mechanics, and system-level constraints.
- Require that normalization, loading basis, and cell context are explicitly stated and held constant across comparisons.
- Demand batch variability documentation and exclusion criteria before strong mechanistic claims.
- Ensure conclusions are limited to the tested architecture, chemistry, and validation level.

# Provenance

Derived from cluster 36.1 (observable-driven mechanism discovery and validation). Synthesized from source skills: `li-s-battery-redox-binder-research`, `aqueous-hybrid-capacitor-research-workflow`, `dual-confinement-li-s-battery-exploration`, `li-metal-free-battery-full-cell-design`, `li2s-constrained-conversion-research`, `li-s-porous-separator-research`, `high-loading-electrochemical-scale-stress`, `li-s-battery-scaffold-interface-exploration`.
