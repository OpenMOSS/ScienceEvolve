---
name: sci-fusion-discover-symmetry-guided-confinement-plasma-493f7553
description: A reusable end-to-end workflow for discovering, discriminating, and validating symmetry-guided mechanisms in magnetic confinement plasmas through hypothesis generation, controlled numerical or conceptual experiments, multi-diagnostic analysis, and iterative claim bounding.
scienceevolve-title: "Magnetic confinement fusion · discover symmetry guided confinement plasma mechanisms"
scienceevolve-area: magnetic-confinement-fusion
---

## Purpose

Use this skill to formulate mechanistic research questions, design validation studies, and iterate toward discriminating claims about how approximate symmetries, invariants, or topological constraints govern plasma behavior in magnetically confined systems. The goal is to move from phenomenological observations to bounded, evidence-ranked mechanism hypotheses without extrapolating beyond validated regimes.

## When to use

Use this skill when a user asks to explore new questions in magnetic confinement—such as stellarator, tokamak, reversed-field-pinch, or related configurations—where transport anomalies, regime transitions, coherent fluctuations, or stability boundaries may be explained by symmetry-breaking, symmetry-restoration, invariant preservation, or magnetic topology. It is appropriate for computational research design, conceptual experimental planning, and multi-diagnostic analysis. Do not use it for operational device control, executable discharge recipes, or hazardous procedural instructions.

## Inputs required

Ask for or identify:

- **Target system class:** confinement concept and geometry regime.
- **Phenomenon:** the observable anomaly, transition, or departure from baseline to be explained.
- **Candidate mechanisms:** symmetry, invariant, or topology hypotheses and their expected causal chains.
- **Baseline expectation:** simplest credible model or prior established behavior.
- **Available tools:** models, codes, diagnostics, datasets, and their known limitations.
- **Constraints:** computational cost, diagnostic access, safety boundaries, and acceptable evidence strength.

## Core Workflow

1. **Frame the mechanism question**
   - Define the primary observable and why it matters for confinement or stability.
   - State the baseline expectation (e.g., classical, neoclassical, or reduced-model behavior).
   - Identify the specific departure that motivates a symmetry-guided or topology-guided hypothesis.
   - **Gate:** Is the question falsifiable and scoped to a mechanism? If not, reformulate before proceeding.

2. **Generate competing hypotheses**
   - Formulate a primary hypothesis: design variable → field/geometry structure → particle or plasma behavior → performance metric.
   - Formulate at least one competing mechanism hypothesis and one failure-mode hypothesis (e.g., numerical artifact, diagnostic aliasing, boundary effect).
   - For each hypothesis, specify: evidence strength (strong/moderate/weak/speculative), key assumptions, predicted independent signatures, likely failure modes, and applicability boundary.
   - **Gate:** Can the hypotheses be discriminated by independent observables? If not, refine diagnostics or narrow the claims.

3. **Design minimal validation**
   - Define a baseline case using current assumptions without the candidate upgrade.
   - Define a **negative control** that degrades or removes the proposed symmetry/invariant while keeping other variables matched.
   - Define a **positive control** that recovers a known behavior under the same analysis pipeline.
   - Define a **strong control** that changes only one link in the proposed mechanism chain.
   - Specify independent variables, dependent variables, and covariates; avoid fixed recipes or device-specific parameters.
   - Pre-register evaluation metrics and stop conditions.
   - **Gate:** Are controls feasible, matched, and independent of the target signature? If not, redesign.

4. **Execute and analyze**
   - Verify numerical integrity, calibration, synchronization, and diagnostic coverage.
   - Analyze nonlinear evolution, regime classification, or phenomenological grouping before assigning mechanism labels.
   - Extract representative states, saturated profiles, or transition boundaries.
   - Perform mechanism-specific decomposition (e.g., energy integrals, transport channels, spectral structure, mode parity, coherence/cross-phase).
   - Compare results against baseline, negative, positive, and strong controls.
   - **Gate:** Do controls behave as expected? If not, stop and audit validity before any mechanistic interpretation.

5. **Attribute and synthesize**
   - Reconstruct the causal chain: geometry/topology → field-line or invariant structure → constraint on flows/potential → drift-orbit or stability behavior → transport/outcome.
   - Require converging evidence from at least two independent analysis streams (e.g., linear stability plus nonlinear transport, or spectral analysis plus profile evolution).
   - Label each conclusion as verified, conditionally supported, weakly supported, or speculative.
   - **Gate:** Does evidence converge on one mechanism with quantified uncertainty? If ambiguous, proceed to iteration.

6. **Iterate or stop**
   - **If supported:** Promote the hypothesis and test robustness via parameter scans, model variants, or perturbed realizations.
   - **If contradicted:** Identify the failed assumption, generate an alternative hypothesis, and return to step 2.
   - **If ambiguous:** Add a discriminating observable, tighten controls, or reduce the hypothesis to a narrower conditional claim.
   - **Stop conditions:**
     - Controls fail or are indistinguishable.
     - Numerical sensitivity, boundary effects, or diagnostic uncertainty dominate the expected signal.
     - The model boundary is reached without independent validation.
     - Safety, compliance, or reproducibility requirements are unmet.
   - **Gate:** Is the final claim bounded by regime, model, and geometry? If yes, document; if no, narrow or stop.

## Output Format

Return results in this structure:

1. **Research question and gap** — mechanism-focused question and why existing baselines are insufficient.
2. **Hypothesis portfolio** — table of hypotheses with evidence strength, assumptions, predicted signatures, failure modes, and applicability boundaries.
3. **Validation design** — baseline, negative/positive/strong controls, variables, metrics, and stop conditions.
4. **Analysis plan** — integrity checks, decomposition strategy, comparison approach, and uncertainty treatment.
5. **Evidence synthesis** — supporting, neutral, and contradicting observations with confidence levels.
6. **Iteration plan** — update rules, next discriminating test, and robustness checks.
7. **Validity and safety summary** — confounders, reproducibility requirements, regime boundaries, and non-operational safety constraints.

## Validation Gates

- **Mechanism specificity:** The primary prediction must differ from at least one credible alternative mechanism.
- **Observable independence:** Claims must rest on converging evidence from multiple diagnostic or model streams, not a single family.
- **Control validity:** Negative and positive controls must behave as expected before mechanistic attribution.
- **Numerical and model validity:** Resolution, convergence, conservation, closure, and dimensionality must be appropriate for the regime.
- **Baseline fairness:** Target and reference cases must be compared under matched assumptions and scales.
- **Realization gap:** When idealized and realistic cases differ, quantify whether realization error changes the conclusion.

## Claim Boundaries

- Treat all results as evidence about the tested model, geometry, or dataset, not as universal claims about all plasmas or devices.
- Mark extrapolations to experiments, higher-fidelity models, or different geometries as requiring independent validation.
- Distinguish exact symmetry, approximate symmetry, and functional invariants; do not conflate them.
- Separate source-paper evidence, new-model evidence, and agent inference with clear labels.
- Do not generalize demonstration-oriented or single-configuration results to reactor-scale performance.

## Failure Modes

- **Confounding:** An alternative mechanism (e.g., boundary drive, missing physics, profile shift) produces the same signature.
- **Correlation without isolation:** Variables co-vary but no control test establishes causality.
- **Realization erosion:** An idealized symmetry or invariant is lost under realistic constraints, invalidating the causal chain.
- **Numerical artifact:** The result depends on resolution, time step, boundary treatment, or convergence.
- **Diagnostic aliasing:** Limited spatial coverage, calibration drift, or line-averaging mimics a mechanism-specific signature.
- **Overfitting by complexity:** Added model physics explains noise or tuning artifacts rather than genuine behavior.
- **Boundary dominance:** The observed effect originates from edge conditions, initial conditions, or source asymmetry rather than the bulk mechanism.

## Validity Checks

- Screen confounding mechanisms before assigning causality.
- Verify numerical validity: resolution adequacy, saturation, time-window stability, and reproducibility.
- Confirm model validity: closure and dimensionality must match the physical regime claimed.
- Test boundary validity: sensitivity to edge profiles, boundary conditions, and imposed drives.
- Ensure statistical validity: adequate ensembles, uncertainty estimates, and avoidance of single-event claims.
- Require causal validity: controls and isolation tests must precede mechanism attribution.
- Maintain reproducibility: document input states, diagnostic definitions, sampling windows, and analysis procedures.
- Respect extrapolation boundaries: limit claims to the tested regime and explicitly flag unsupported generalizations.

## Provenance

- Synthesized from cluster 5, subcluster 5.0: symmetry-guided mechanism discovery and validation.
- Source skills: `finite-beta-mhd-research-design`; `sheared-plasma-edge-transition-design`; `magnetic-confinement-transport-workflow`; `quasi-helical-symmetry-plasma-research`; `coherent-mhd-fluctuation-research-skill`; `stellarator-research-exploration-skill`; `magnetic-surface-plasma-exploration`; `tokamak-edge-model-research`.
