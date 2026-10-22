---
name: sci-fusion-symmetry-guided-plasma-mechanism-discovery-w-88b791c9
description: A reusable research design workflow for discovering, discriminating, and validating hidden or symmetry-dependent mechanisms in magnetized plasma turbulence, MHD, and stellarator dynamics through staged hypothesis generation, controlled model hierarchy comparisons, and claim-bounded interpretation.
scienceevolve-title: "Magnetic confinement fusion · symmetry guided plasma mechanism discovery workflow 2"
scienceevolve-area: magnetic-confinement-fusion
---

## Purpose

Help an agent design end-to-end research studies that identify missing physical mechanisms in magnetized plasma systems—particularly where symmetry, geometry, or reduced-model assumptions may hide counteracting structures, competing transport channels, or nonlinear saturation pathways. The workflow teaches a reusable route: frame the gap, map candidate mechanisms against symmetry or conservation constraints, generate falsifiable hypotheses, validate through a staged model hierarchy with ablation controls, and bound claims by evidence strength and regime validity.

## When to use

Use when the user asks to propose a new simulation study, analysis plan, or research question involving plasma turbulence, MHD stability, transport barriers, bootstrap-current or closure modeling, stellarator or quasi-symmetric geometry effects, magnetic island dynamics, or eigenmode-based mechanism discrimination. It is especially appropriate when the problem involves a mismatch between reduced-model predictions and observed nonlinear behavior, competing instability channels, hidden stable or damped modes, or geometry-dependent momentum and energy transport. Do not use for operational device control, executable experimental procedures, or safety-critical plasma operations.

## Inputs required

- **Target system and model family:** governing equations or simulation framework (e.g., MHD, gyrokinetic, drift-kinetic, reduced fluid, structure-preserving particle dynamics).
- **Observed gap or paradox:** the mismatch between expected and observed behavior, expressed as a balance condition, conservation violation, or symmetry anomaly.
- **Candidate mechanisms:** dominant pathways and proposed hidden or counteracting structures (e.g., stable eigenmodes, geometric feedback, closure terms, nonlocal orbit effects).
- **Model hierarchy:** available linear, quasi-linear, nonlinear, reduced, or experimental/observational resources.
- **Primary observables:** diagnostics for growth, transport, flux, mode structure, budget terms, or topology.
- **Geometry and symmetry context:** axisymmetric, quasi-symmetric, helical, stellarator-like, or stochastic regimes.
- **Constraints:** computational budget, resolution limits, reproducibility requirements, and safety or ethics boundaries.

## Core Workflow

Follow this ordered route. Do not skip a gate without documenting the decision.

1. **Frame the gap and constraint.** Express the anomaly as a falsifiable mismatch between an expected symmetry, conservation balance, or reduced-model prediction and actual behavior. Translate the phenomenon into a measurable constraint.
   - *Stop gate:* If the gap cannot be stated as a falsifiable imbalance or the observable is inaccessible, stop and refine the question.

2. **Map the mechanism landscape.** Identify free-energy sources, dominant transfer pathways, and candidate hidden or counteracting mechanisms. Decompose by symmetry class, scale, mode family, or transport channel. Label terms as driving, restoring, or feedback.
   - *Decision gate:* If fewer than two competing pathways exist, decide whether the question is mechanism discrimination or simple detection, and adjust controls accordingly.

3. **Generate ranked hypotheses.** Produce at least three falsifiable hypotheses. For each state: concise causal claim, evidence strength (strong / moderate / weak / speculative), key assumptions, predicted signature, likely failure mode, minimal test, and falsification criterion.
   - *Stop gate:* If no hypothesis is testable with available resources, stop and expand diagnostics or reduce scope.

4. **Design staged validation.**
   - **Minimal viable validation:** one baseline, one independent reference verification, one mechanism-on/off comparison, and one geometry-validity or symmetry diagnostic.
   - **Strong controls:** positive control (known signature), negative control (mechanism suppressed), ablation control (candidate structure removed), reduced-model control (dominant pathway only), and fidelity/resolution control.
   - Define independent variables, dependent variables, and stopping conditions (assumption violation, control failure, numerical uncertainty exceeding signal).
   - *Iteration gate:* If reference verification fails or controls are mismatched, redesign before executing nonlinear comparisons.

5. **Execute model hierarchy.** Proceed from linear or quasi-linear analysis to nonlinear simulation, then to experimental or observational benchmark where applicable.
   - Verify outputs against independent references at each stage before interpreting downstream behavior.
   - Track geometry-validity, symmetry-error, or surface-integrity diagnostics during evolution.
   - *Stop gate:* If linear assumptions fail, reference benchmarks disagree, or geometry-validity diagnostics degrade, halt interpretation and switch to higher-fidelity models or post-hoc evaluation.

6. **Decompose competing contributions.** Separate signed fluxes, energy budgets, or mode-family contributions using transfer diagnostics, budget terms, or reconstruction metrics. Distinguish opposing pathways from net totals; check for spectral cancellation, scale sequestration, or nonlinear energy transfer.
   - *Decision gate:* If decomposition requires an incomplete or ill-conditioned basis, decide whether to refine the basis or abandon the modal interpretation.

7. **Discriminate mechanisms.** Compare full versus reduced representations; mechanism-on versus mechanism-off; with versus without the candidate hidden structure. Quantify causal contribution via targeted ablation or controlled suppression while documenting side effects.
   - *Stop gate:* If ablation alters conserved quantities, global forcing, or unrelated properties beyond acceptable bounds, redesign the control and repeat.

8. **Iterate or redesign.** Based on evidence:
   - **Confirm:** If the mechanism survives all controls, strengthen the claim and test transferability to altered geometry or regime.
   - **Narrow:** If the mechanism is valid only in a restricted window, reframe the claim as regime-specific and map the boundary.
   - **Reject:** If the predicted signature is absent or reversed, treat the failure as evidence about the mechanism’s domain of validity and propose the next most diagnostic test.
   - **Stop:** If numerical artifacts dominate, assumptions are violated, or safety constraints are breached, halt and document limitations.

9. **Bound claims and document.** Label each conclusion by evidence strength. Separate paper-supported patterns from transferable mechanisms and agent-generated hypotheses. State validity boundaries explicitly (geometry, collisionality, dimensionality, model closure, diagnostic coverage).

## Output Format

Return a structured research plan containing:

1. **Research question** — target system, gap, and primary observable.
2. **Mechanism map** — sources, pathways, sinks, and candidate hidden or counteracting structures.
3. **Ranked hypotheses** — at least three hypotheses with evidence strength, assumptions, failure modes, and minimal tests.
4. **Validation plan** — variables, controls (positive, negative, ablation, reduced-model), minimal and strong validation stages, and stopping conditions.
5. **Analysis plan** — decomposition method, transfer or budget diagnostics, convergence checks, and sensitivity analysis.
6. **Iteration plan** — decision rules for strengthening, narrowing, or rejecting hypotheses based on results.
7. **Claim boundary statement** — evidence labels, tested regimes, and extrapolation limits.
8. **Validity and safety notes** — confounding checks, reproducibility requirements, and non-operational safety boundaries.

## Validation Gates

- **Reference independence:** Closure outputs or linear predictions must agree with independent solvers or formulas before nonlinear interpretation.
- **Numerical convergence:** Diagnostics driving claims must be robust to resolution, basis, smoothing, and time-step changes.
- **Geometry and symmetry validity:** Coordinate, surface, and symmetry assumptions must remain acceptable during the interpreted interval.
- **Control fidelity:** Mechanism-on/off cases must match in transport, boundary conditions, initial states, and integration settings.
- **Regime boundary:** Reduced models must not be applied outside their derived collisionality, timescale, or stochasticity limits.
- **Statistical robustness:** Scans or stochastic ensembles require reported variability; small differences need uncertainty estimates.

## Claim Boundaries

- **Paper-supported:** Directly supported by prior controlled comparisons in the literature.
- **Transferable mechanism:** Abstract pattern plausible across similar systems but requiring validation in the target geometry.
- **Agent-generated:** New inference requiring dedicated test; mark as speculative until validated.
- Never treat single-study agreement as universal. Limit extrapolation to tested regimes and clearly separate implementation-supported from physics-supported conclusions.

## Failure Modes

- **Assumption violation:** Geometry, symmetry, or regime assumptions fail during evolution, invalidating reduced-model conclusions.
- **Numerical artifact:** Resolution, smoothing, interpolation, or projection bias mimics a physical mechanism.
- **Confounding:** Co-varying profiles, boundaries, or external drives obscure causal attribution.
- **Misattribution:** A diagnostic captures symptoms rather than the causal mechanism.
- **Overextrapolation:** Applying a mechanism confirmed in one configuration to untested geometries, collisionality regimes, or device classes.

## Validity Checks

- **Confounding isolation:** Verify matched settings across controls except the intended mechanism variable.
- **Basis completeness:** Ensure modal or coordinate decompositions are sufficiently complete and conditioned for the target diagnostic.
- **Conservation consistency:** Check that energy, particle, momentum, or flux budgets close within expected error.
- **Nonorthogonality accounting:** When projecting onto nonorthogonal modes, include cross-term effects.
- **Reproducibility:** Document inputs, code versions, reference states, projection methods, seeds, and analysis scripts.
- **Boundary condition scrutiny:** Confirm that imposed symmetry, wall assumptions, or domain truncation do not exclude the hypothesized mode.
- **External validity:** State which geometries, regimes, and diagnostics were tested and which remain unverified.

## Provenance

Derived from cluster 0 / subcluster 0.0. Synthesized from source skills: bootstrap-current-mhd-closure-research, shear-flow-mhd-stable-mode-research, nonlinear-mhd-instability-research-planning, magnetized-shear-turbulence-mode-decomposition-research, structure-preserving-plasma-dynamics, gyrokinetic-turbulence-barrier-workflow, stellarator-flow-research-design, helical-plasma-island-exploration.
