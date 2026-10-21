---
name: sci-fiber-composite-fiber-polymer-interface-mechanism-d-112eafcc
description: A reusable end-to-end workflow for discovering, discriminating, and validating mechanisms in composite, fiber, polymer, and interface systems through hypothesis generation, controlled minimal validation, multi-source evidence integration, and iterative claim bounding.
scienceevolve-title: "Fiber composites and battery materials · composite fiber polymer interface mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

## Purpose

Use this skill to guide an agent through a complete research cycle for composite, fiber, polymer, and interface systems: from bottleneck identification and mechanism decomposition, through hypothesis generation and minimal validation design, to multi-source analysis, iteration, and claim bounding. The workflow treats simulation as screening, physical or computational validation as confirmation, and requires orthogonal evidence before accepting a mechanism.

## When to use

Use this skill when a user needs to:
- Propose new research questions or hypotheses about how architecture, interface, matrix, filler, or environmental coupling governs performance in composites, fibers, polymers, or multiphase interfaces.
- Design a minimal validation plan with explicit controls and stopping conditions.
- Interpret simulation, spectroscopic, imaging, transport, or mechanical data to discriminate among competing mechanisms.
- Iterate or redesign after an initial result, distinguishing equilibration artifacts, confinement effects, boundary conditions, and measurement confounds from target mechanisms.

Do not use this skill for final engineering design, safety-critical certification, operational fabrication recipes, or hazardous procedural instructions.

## Inputs required

- Target system class and application context (e.g., structural composite, polymer film, fiber-reinforced lattice, interface-mediated assembly).
- Performance bottleneck or observed anomaly (e.g., stiffness loss, interfacial debonding, relaxation, modal shift, rate change).
- Candidate mechanism categories (e.g., geometric redistribution, interfacial load transfer, matrix viscoelasticity, filler dispersion, environmental state, mode density, boundary confinement).
- Available evidence types (e.g., simulation, experiment, imaging, spectroscopy, literature benchmark).
- Baseline reference and constraints (e.g., conventional solid reference, bulk melt, unstructured substrate, applicable standards, safety boundaries).

## Core Workflow

1. **Bottleneck & Scope Definition**
   - Define the coupled research objective and identify the primary bottleneck (structural, dynamic, thermal, interfacial, transport, or environmental).
   - **Decision gate:** If the bottleneck cannot be linked to a measurable observable, stop and refine the question.

2. **Mechanism Decomposition**
   - Decompose the system into independent mechanism layers: geometry/architecture, interface/interphase, material/matrix, process/environment, and boundary conditions.
   - **Decision gate:** If variables cannot be isolated (e.g., geometry and material change together), redesign to enable single-mechanism perturbation.

3. **Hypothesis Generation & Ranking**
   - Generate mechanism-linked hypotheses. Each must include: expected effect, key assumptions, minimal observable evidence, likely failure mode, evidence strength (strong/moderate/weak/speculative), and extrapolation boundary.
   - Rank by decisiveness: prefer hypotheses testable with minimal orthogonal measurements.
   - **Stop condition:** If no hypothesis can be falsified with available resources, reduce scope or acquire baseline data.

4. **Baseline Ladder & Control Design**
   - Establish a baseline ladder: reference system, component-only variants, and combined concept.
   - Define controls: baseline, positive benchmark, negative control (mechanism suppressed), and ablation/architecture-only/interface-only controls.
   - **Decision gate:** If controls cannot isolate one mechanism layer, redesign the matrix before proceeding.

5. **Simulation / Model Screening**
   - Use modeling to narrow candidates and expose mechanisms. Compare trends, not exact values.
   - Require model verification against baseline behavior before interpreting new variants.
   - **Stop condition:** Stop if the model fails to reproduce the baseline, if discretization or parameter sensitivity dominates differences, or if boundary conditions are unrealistic.

6. **Minimal Viable Validation**
   - Execute the smallest experiment or computation that can support or reject the leading hypothesis.
   - Predefine independent variables, dependent metrics, covariates, and confounders.
   - **Stop conditions:** Stop if controls fail, variability exceeds effect size, safety or compliance constraints trigger, or the effect depends on multiple simultaneous changes.

7. **Multi-Observable Analysis & Mechanism Discrimination**
   - Analyze using orthogonal evidence chains. Separate mechanism from metric (e.g., a higher peak load does not prove better interface bonding without interfacial evidence).
   - Check confounds: mass, geometry, thickness, boundary condition, disorder, damping, thermal state, and moisture.
   - **Decision gate:** If orthogonal measures (e.g., time-domain and frequency-domain, or structural and interfacial) disagree, flag ambiguity and do not advance the hypothesis.

8. **Uncertainty Quantification & Robustness Check**
   - Quantify sensitivity to material uncertainty, model assumptions, boundary conditions, and measurement limitations.
   - Require replicate consistency or sampling stability before ranking variants.
   - **Stop condition:** If uncertainty envelopes overlap across variants, stop claiming rank order.

9. **Iteration or Redesign**
   - Update hypotheses based on outcomes:
     - *Supported:* advance to next perturbation or application-level test.
     - *Partially supported:* refine geometry, interface, or boundary condition.
     - *Contradicted:* diagnose whether failure stems from a flawed mechanism, insufficient equilibration, boundary artifact, or invalid measurement; convert into a boundary condition.
   - **Decision gate:** If a result only holds under narrow conditions, explicitly state the boundary and test robustness before generalizing.

10. **Claim Bounding & Documentation**
    - Bound claims by material class, geometry family, loading mode, environmental state, and validation regime.
    - Distinguish source-verified patterns, agent-generated inferences, and speculative extrapolations.
    - **Final stop condition:** Do not present simulation-only results as validated physical law or construction-ready design.

## Output Format

Return:
- Research question and bottleneck statement.
- Mechanism map with isolated layers.
- Ranked hypothesis cards (claim, evidence strength, assumptions, failure mode, boundary).
- Validation matrix with baseline, controls, variables, metrics, and stop conditions.
- Analysis plan with orthogonal evidence chains and uncertainty handling.
- Iteration rules with decision triggers for supported, ambiguous, and unsupported outcomes.
- Claim boundary table stating scope and exclusions.
- Validity and non-operational safety notes.

## Validation Gates

- **Baseline validity:** The reference model or experiment must reproduce expected behavior before new variants are interpreted.
- **Control sufficiency:** Each control must remove one mechanism at a time; ablation variants must isolate the dominant contributor.
- **Mechanistic consistency:** At least two independent observables must point to the same mechanism.
- **Reproducibility:** Replicate measurements or sampling blocks must show uncertainty smaller than the claimed effect.
- **Simulation-experiment alignment:** Trends must agree before exact values are compared; if divergent, audit assumptions before iterating.

## Claim Boundaries

- Limit claims to the tested matrix, fiber or filler architecture, interface chemistry, geometry family, scale, loading mode, and environmental state.
- Treat single-study results as evidence for a research pattern, not as field-wide consensus or safety-critical design rules.
- Distinguish simulation screening from validated physical evidence.
- Do not extrapolate from coupon-scale or model-scale results to full structural, clinical, or field reliability without domain-specific validation.
- Avoid presenting sustainability, safety, or application-readiness claims without lifecycle boundaries, compliance review, and independent confirmation.

## Failure Modes

- **Confounded comparison:** Apparent gains arise from thickness, density, mass, boundary condition, or measurement artifact rather than the target mechanism.
- **Non-equilibration or insufficient relaxation:** The system or model has not reached steady state, producing history-dependent artifacts.
- **Mode misassignment:** Spectral, modal, or structural features incorrectly attributed to the intended mechanism.
- **Overgeneralization:** A mechanism valid in one geometry or material family is assumed to transfer without evidence.
- **False convergence:** Simulation matches baseline only under unphysical parameter choices.
- **Trade-off blindness:** Improvement in one metric masks degradation in another (e.g., stiffness gain with ductility loss).

## Validity Checks

- **Confounding control:** Are non-target variables held constant when isolating a mechanism?
- **Boundary attribution:** Could wall strength, interface definition, finite size, or preparation history explain the result?
- **Interior versus surface separation:** Are bulk-like averages distinguished from interfacial or near-boundary statistics?
- **Metric specificity:** Does each metric test a distinct mechanism rather than repeating the same signal?
- **Statistical validity:** Are effect sizes, uncertainty estimates, and pre-specified failure criteria used instead of visual trends?
- **Extrapolation limits:** Are claims restricted to the tested conditions?
- **Evidence hierarchy:** Are source-paper patterns separated from agent-generated inferences?

## Provenance

- Synthesized from cluster 30.0 (composite-fiber-polymer-interface mechanism discovery and validation).
- Source skill references: lightweight-composite-voided-slab-research-design, carbon-fiber-composite-research-exploration, natural-fiber-polymer-composite-exploration, composite-dynamic-exploration, acoustic-purcell-quantum-adsorption-research, plasmonic-nanoantenna-research-workflow, confined-polymer-equilibration-research-design, thermomechanical-lattice-exploration.
