---
name: sci-fiber-composite-fiber-interface-battery-mechanism-d-44217736
description: Reusable end-to-end workflow for observable-driven mechanism discovery and validation in composite, fiber, interface, battery, and hybrid material systems.
scienceevolve-title: "Fiber composites and battery materials · composite fiber interface battery mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Guide agents in designing research questions and validation plans for material systems where performance is limited by coupled interfacial, transport, structural, or conversion mechanisms. The workflow converts observed gaps into falsifiable hypotheses, structures multi-modal validation with strong controls, and iterates until mechanisms are discriminated or rejected.

# When to use

Use this skill when the user asks to:

- Generate new research questions for composite, fiber-reinforced, battery, hybrid, thermal, or related functional material systems.
- Design experiments that link architecture, interface, or composition to mechanism and performance.
- Translate a concept into a testable plan with explicit controls, stop conditions, and iteration rules.
- Evaluate whether results support a proposed mechanism or merely correlate with performance.

Do not use this skill for executable laboratory protocols, clinical diagnosis, therapeutic claims, or as a general domain-review assistant.

# Inputs required

Before generating a plan, identify:

- Target system and application context.
- Known or suspected bottleneck (e.g., transport, interfacial stability, conversion reversibility, load transfer, crystallization, energy dissipation).
- Candidate design variables (architecture, interface modification, composition, scaffold, additive, or processing lever).
- Available evidence (literature precedents, preliminary data, computational predictions, or conceptual proposals).
- Measurement capabilities and practical constraints (safety, scalability, resources, environmental limits).
- Baselines and benchmarks for meaningful comparison.

# Core Workflow

Follow this ordered route. Do not skip decision gates.

1. **Define the performance gap and practical frame**
   - Identify the target metric and the mismatch between component-level promise and system-level performance.
   - Decompose the gap into coupled mechanisms rather than assuming a single dominant cause.
   - Separate observed bottlenecks from inferred bottlenecks.

2. **Generate competing, mechanism-linked hypotheses**
   - Propose at least three hypotheses connecting a design variable to a specific mechanism.
   - Include a conservative extension of known rules, a higher-risk architecture with a clear falsification test, and a control-focused or null hypothesis.
   - For each hypothesis, state: evidence strength, key assumptions, predicted observable consequences, and the condition that would falsify it.

3. **Design minimal viable validation (MVV)**
   - Define comparison groups: baseline, perturbed candidate, negative control (mechanism removed or function absent), positive control (known benchmark), and process/structural controls.
   - Select independent and dependent variables; list confounders to hold constant or explicitly report.
   - Predefine success criteria, failure criteria, and stop conditions before data collection.

4. **Collect orthogonal evidence**
   - Gather structural, functional, and performance data relevant to the proposed mechanism.
   - Ensure evidence streams can independently support or challenge the hypothesis.

5. **Analyze and classify**
   - Check comparability across groups (loading, mass, thermal history, processing, geometry, normalization basis).
   - Separate structure evidence from function evidence from performance evidence.
   - Classify claims as Observed, Inferred, or Extrapolated.
   - Detect trade-offs and non-monotonic optima.

   *Decision Gate A — Mechanism-Performance Alignment*
   - If mechanism and performance align → strengthen hypothesis; proceed to boundary testing (Step 6).
   - If performance improves but mechanism is unclear → add mechanistic validation before claiming causality (return to Step 4).
   - If mechanism is supported but performance does not improve → revisit whether the failure mode is dominant (return to Step 2).
   - If controls fail or confounders dominate → redesign comparison (return to Step 3).

6. **Boundary test and robustness check**
   - Stress the mechanism under challenging but relevant conditions (e.g., higher loading, varied geometry, extended operation, lean environments, different matrices).
   - Evaluate reproducibility across independent samples, batches, or preparations.

   *Decision Gate B — Robustness & Reproducibility*
   - If robust → document claim boundaries and proceed to output.
   - If fragile or irreproducible → narrow the claim or return to Step 2 to reformulate.

7. **Iterate or terminate**
   - Update the hypothesis set based on evidence.
   - Decide: confirm and expand, refine variables, replace mechanism, or stop.
   - Maintain a decision table linking observed result to next experiment and stop/pivot condition.

# Output Format

When using this skill, produce:

1. **Research Question** — target system, bottleneck, and scientific utility.
2. **Hypotheses** — ranked table with mechanism, evidence strength, assumptions, failure modes, and falsification tests.
3. **Experimental Design** — MVV groups, variables, controls, metrics, and stop conditions.
4. **Analysis Plan** — comparability checks, structure-function-performance linkage, trade-off interpretation, claim classification.
5. **Iteration Plan** — decision rules for continue, redesign, pivot, or stop.
6. **Validity & Safety Notes** — confounders, reproducibility requirements, boundary conditions, and non-operational safety constraints.

# Validation Gates

- **Candidate Gate:** Does the proposed design have a plausible mechanism and a falsifiable test?
- **Functional Validation Gate:** Does orthogonal evidence show the assigned function is operating?
- **Stability Gate:** Does the mechanism survive boundary conditions and repeated measurement?
- **Robustness Check:** Are results reproducible across independent preparations or batches?
- **Mechanism Exclusion Gate:** Can alternative explanations be ruled out by controls?

# Claim Boundaries

- **Observed:** Directly measured in the current comparison under stated conditions.
- **Inferred:** Supported by multiple observations but not directly measured.
- **Extrapolated:** Plausible beyond the tested setup but not demonstrated.
- Never treat a single study or paper as field-wide consensus.
- Never transfer numerical performance, material-specific parameters, or fabrication recipes across systems without new evidence.

# Failure Modes

- **Hypothesis failure:** Mechanism is absent or opposite to prediction.
- **Control failure:** Baseline or negative control behaves unexpectedly, indicating confounding.
- **Trade-off failure:** Improvement in one metric causes unacceptable degradation in another required metric.
- **Scalability failure:** Benefit disappears under practical constraints (loading, mass, geometry, process history).
- **Reproducibility failure:** Results are inconsistent across replicates, batches, or independent preparations.
- **Interpretation failure:** Mechanism and performance are decoupled; correlation is mistaken for causation.

# Validity Checks

Before finalizing any plan or claim, verify:

- **Confounding:** Are architecture/interface effects separable from processing, mass, morphology, history, or measurement differences?
- **Controls:** Are baseline, negative, positive, and structural/process controls adequate for the claim?
- **Reproducibility:** Are replicates, uncertainty ranges, and data-exclusion rules specified?
- **Statistical validity:** Are comparisons matched to experimental design and variability?
- **Boundary conditions:** Are conclusions limited to tested materials, geometries, environments, and operating regimes?
- **Mechanistic validity:** Does each component have an assigned function, and is there evidence that the function causes the performance change?
- **Literature scope:** Are source-paper outcomes treated as method evidence, not domain consensus?

# Provenance

- Derived from cluster 38.1 (observable-driven mechanism discovery and validation).
- Synthesized from source skills: `li-s-cathode-architecture-exploration`, `practical-lis-battery-research-design`, `hybrid-fiber-composite-exploration`, `solid-polymer-li-s-battery-research`, `porous-em-absorber-research-design`, `electrochemical-biosensor-research-design`, `organocatalytic-phosphoramidation-workflow`, `biodegradable-copolyester-exploration`.
- Preserves shared workflow patterns: failure-mode decomposition, design-function mapping, ablation-style validation, mechanism-constrained iteration, and multi-modal evidence chains.
