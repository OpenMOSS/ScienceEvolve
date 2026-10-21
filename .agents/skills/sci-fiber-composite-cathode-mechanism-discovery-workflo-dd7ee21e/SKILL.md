---
name: sci-fiber-composite-cathode-mechanism-discovery-workflo-dd7ee21e
description: A reusable workflow to diagnose composite cathode and fiber-electrode bottlenecks, generate falsifiable mechanism hypotheses, design minimal validation with controls, and iterate using orthogonal evidence.
scienceevolve-title: "Fiber composites and battery materials · composite cathode mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Composite Cathode Mechanism Discovery Workflow

## Purpose

Use this skill to transform an ambiguous performance limitation in a composite electrochemical cathode or fiber-based electrode into a structured, observable-driven mechanism discovery and validation plan. The goal is to generate falsifiable hypotheses, design minimal validation studies with proper controls, and iterate using orthogonal evidence while avoiding operational recipes or unsupported generalizations.

## When to use

Use this skill when exploring composite cathodes, fiber scaffolds, conversion-type electrodes, or interfacial architectures where the bottleneck may involve active-material utilization, intermediate migration, ion/electron transport, mechanical degradation, or interfacial instability. It is especially useful when the user needs to move from symptomatic failure to mechanistic understanding rather than direct optimization.

## Inputs required

- **Target bottleneck or failure mode:** A specific symptom to explain (e.g., capacity fade, polarization, shuttle indicators, mechanical loss, rate limitation).
- **Candidate architecture or material classes:** Host, scaffold, coating, or electrolyte concepts described at a non-operational, conceptual level.
- **Available evidence:** Literature context, preliminary characterization, electrochemical or mechanical data, computational predictions, or known constraints.
- **Evaluation priorities:** Metrics of interest (gravimetric, areal, volumetric, rate retention, cycling stability, mechanical reliability) and their relative importance.
- **Constraints and boundaries:** Safety limits, measurement access, reproducibility requirements, acceptable cell formats, and stopping conditions.

## Core Workflow

1. **Bottleneck Diagnosis & Mechanism Mapping**
   - Decompose the observed symptom into candidate mechanisms: transport limitation, confinement failure, conversion kinetics, interfacial instability, or mechanical degradation.
   - Frame the dominant bottleneck as a falsifiable claim.
   - **Decision gate:** If the bottleneck cannot be expressed as a falsifiable claim, stop and refine the research question before proceeding.

2. **Hypothesis Generation & Evidence Scoring**
   - Generate mechanism-linked hypotheses. Each hypothesis must state: expected benefit, key assumption, minimal observable evidence, likely failure mode, and evidence strength (Strong / Moderate / Weak).
   - Rank hypotheses by decisiveness, preferring those that can be accepted or rejected with a small set of orthogonal measurements.
   - **Decision gate:** If no hypothesis is testable with available resources, stop and narrow the scope or acquire additional baseline data.

3. **Minimal Validation Design**
   - Define a design matrix that varies one dominant mechanism at a time.
   - Specify controls: baseline (without proposed feature), component-only, architecture-only, negative (mechanism-weakening), and positive benchmark.
   - Define metrics spanning structure, electrochemistry, and mechanics; predefine failure criteria and stop conditions.
   - **Stop conditions:** Safety limits exceeded, controls fail, reproducibility is poor, or mechanism-specific evidence contradicts the hypothesis.
   - **Decision gate:** If the proposed controls cannot isolate the target mechanism, redesign the matrix before data collection.

4. **Orthogonal Evidence Collection**
   - Collect at least two independent evidence streams for each hypothesis (e.g., electrochemical signatures plus structural or spectroscopic data).
   - **Decision gate:** If independent evidence streams conflict, flag unresolved ambiguity and halt mechanism assignment until additional data are obtained.

5. **Analysis, Normalization & Mechanism Update**
   - Normalize all comparisons at matched loading, thickness, active-material content, cell format, and reporting basis.
   - Diagnose tradeoffs (e.g., improved confinement versus increased resistance, higher loading versus reduced utilization).
   - Update the mechanism model by recording which observations support, weaken, or refute each hypothesis.
   - **Decision gate:** If the mechanism remains ambiguous after orthogonal analysis, return to Step 2 to generate sub-hypotheses or refine the design matrix.

6. **Claim Bounding & Iteration**
   - Bound all conclusions to the tested conditions (material class, loading regime, cell format, electrolyte class).
   - If the hypothesis is supported, subject it to practical stress tests (higher loading, mechanical cycling, or extended operation) before broader claims.
   - If the hypothesis is refuted, return to Step 1 or Step 2 to redesign the architecture or redefine the bottleneck.
   - **Stop condition:** Do not extend claim boundaries beyond validated conditions without a new validation cycle.

## Output Format

When using this skill, produce:

1. **Research question:** The falsifiable bottleneck claim and its significance.
2. **Mechanism model:** Candidate pathways, key assumptions, and known failure modes.
3. **Ranked hypothesis table:** Hypothesis, evidence strength, key assumption, minimal validation, and likely failure mode.
4. **Validation plan:** Design matrix, control set, metrics, failure criteria, and stop conditions.
5. **Analysis plan:** Normalization rules, orthogonal evidence hierarchy, tradeoff checklist, and mechanism-update rules.
6. **Claim boundary statement:** Explicit scope of validity and known exclusions.
7. **Validity and safety notes:** Confounders, reproducibility checks, and non-operational safety constraints.

## Validation Gates

- **Falsifiability gate:** Every hypothesis must state what observable evidence would refute it.
- **Control gate:** Every mechanism claim requires a baseline or negative control that isolates the proposed variable.
- **Orthogonality gate:** At least two independent measurement types must converge before a mechanism is assigned.
- **Reproducibility gate:** Repeated measurements or samples are required for claims about retention, rate capability, impedance trends, or post-cycling structure.
- **Stress-test gate:** Mechanisms validated only under low-stress or diagnostic conditions must be re-tested under practical loading or operational stress before claiming broader relevance.

## Claim Boundaries

- Do not generalize from a single material system to an entire chemistry class.
- Do not extrapolate from low-loading diagnostic conditions to practical areal loading without validation.
- Do not infer device-level readiness from electrode-level performance alone.
- Distinguish direct observation, inferred mechanism, and speculative extension in all outputs.
- State boundary conditions explicitly: tested host class, electrolyte class, loading regime, cell format, and measurement basis.

## Failure Modes

- **Mechanism misattribution:** Assigning a mechanism based on a single metric (e.g., capacity or capacitance alone) without orthogonal evidence.
- **Confounding by loading or format:** Comparing unmatched areal loading, thickness, or cell formats, leading to false mechanism conclusions.
- **Overgeneralization:** Extending a validated mechanism beyond its tested boundary conditions.
- **Control failure:** Baseline or negative controls perform unexpectedly, invalidating the design matrix.
- **Tradeoff blindness:** Optimizing one metric while ignoring compensatory degradation in transport, mechanics, or stability.
- **Irreproducible signal:** Early-cycle or single-sample observations treated as mechanistic evidence without replication.

## Validity Checks

- **Confounding factors:** Active loading, total electrode mass, thickness, porosity, additive content, pressure/contact, electrolyte accessibility, assembly variability, and contamination.
- **Metric validity:** Report both gravimetric and areal metrics; avoid interpreting high gravimetric capacity at low loading as practical performance.
- **Mechanistic validity:** Require at least two independent measurements before assigning a mechanism to an observation.
- **Boundary discipline:** State whether conclusions apply only to the tested active species, host class, electrolyte class, loading regime, or cell format.
- **Consensus discipline:** Treat any single literature source as one evidence source, not as field-wide consensus.

## Provenance

- Derived from cluster 17.1 ("observable-driven mechanism discovery and validation") of the scientific skills codex.
- Synthesized from source skills: `ctf-lithium-sulfur-exploration`, `coupled-confinement-catalysis-cathode-exploration`, `lithium-sulfur-confined-cathode-exploration`, `lithium-sulfur-research-exploration`, `pan-sulfur-cathode-exploration`, `catechol-polymer-interfacial-exploration`, `dry-electrode-research-exploration`, `fiber-supercapacitor-workflow`.
- Source-specific chemistries, fabrication parameters, and paper conclusions have been abstracted into this reusable workflow structure.
