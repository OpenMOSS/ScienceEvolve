---
name: sci-fusion-stellarator-transport-turbulence-mechanism-d-62211e1a
description: A reusable end-to-end workflow for symmetry-guided mechanism discovery and validation in magnetically confined plasma transport, turbulence, and equilibrium studies.
scienceevolve-title: "Magnetic confinement fusion · stellarator transport turbulence mechanism discovery workflow"
scienceevolve-area: magnetic-confinement-fusion
---

# Purpose

Guide agents through an end-to-end, symmetry-guided mechanism discovery and validation workflow for magnetically confined plasma research. The skill teaches a reusable method to move from observable conflicts or optimization tensions to ranked hypotheses, controlled validation plans, and bounded scientific claims—without reproducing any single study's specific conclusions or device parameters.

# When to use

Use when designing research questions, simulations, diagnostic campaigns, or theoretical studies in magnetically confined plasma systems where transport, turbulence, equilibrium stability, or configuration-dependent behavior needs mechanistic explanation. Relevant for stellarator, tokamak-edge, scrape-off-layer, and related toroidal configurations where symmetry, geometry, spectral decomposition, or component separation can guide mechanism discrimination. Do not use for operational device instructions, safety-critical procedures, or live actuator commands.

# Inputs required

- Target system class, magnetic topology, and confinement regime.
- Observable conflict, performance tension, or optimization gap to explain.
- Available data sources, diagnostics, or modeling resources and their fidelity limits.
- Candidate mechanisms, symmetry features, or geometric drivers suspected to matter.
- Prior evidence labels (direct, indirect, analogical, speculative).
- Constraints: diagnostic access, computational bounds, acceptable approximations, and safety or compliance boundaries.

# Core Workflow

1. **Observable Framing and Gap Mapping**
   - Define the concrete observable or performance conflict as a mechanism-to-quantifiable-link.
   - Identify the domain gap between what baseline models explain and what remains uncertain.
   - *Decision gate:* Stop if the observable cannot be linked to a measurable quantity or if the gap is purely definitional.

2. **Symmetry-Guided Mechanism Mapping**
   - Build a causal chain from input variables to derived indicators to measurable outcomes.
   - Decompose the problem using symmetry, spectral, or geometric components (dominant, compensating, residual).
   - Identify required broken symmetries, phase relations, or correlations for each candidate mechanism to contribute.
   - *Decision gate:* Exclude mechanisms that lack a testable symmetry, phase, or component signature.

3. **Hypothesis Generation and Ranking**
   - Produce at least three competing hypotheses (e.g., dominant channel, suppressed channel, regime transition, missing physics, artifact).
   - For each, state evidence strength, key assumptions, predicted signature, failure modes, and a decisive discriminator.
   - *Decision gate (Candidate gate):* Reject hypotheses that are not falsifiable with available resources.

4. **Minimal Validation Design**
   - Define a baseline case, a negative control, a positive control if available, a strong comparison, and sensitivity or ablation cases.
   - Select independent variables that isolate the suspected mechanism; treat profile, boundary, source, and diagnostic calibration as explicit nuisance variables.
   - Define primary observables and at least one independent validation observable not used for tuning.
   - Prespecify success criteria, failure criteria, and stop conditions.
   - *Decision gate (Functional validation):* Halt if controls cannot separate the target mechanism from confounders.

5. **Execution and Layered Analysis**
   - Document coordinate conventions, normalizations, data provenance, and uncertainty ranges.
   - Verify implementation checks (conservation, boundary conditions, convergence, saturation).
   - Compute derived indicators and decompose into interpretable components.
   - Compare results against a local-reference or simplified baseline (e.g., diffusive, linear, or geometry-free expectation).
   - Quantify uncertainty and check that the analysis window represents a quasi-stationary or appropriately sampled state.
   - *Decision gate (Robustness check):* Pause if numerical, diagnostic, or model-form uncertainty swamps the expected signal.

6. **Mechanism Discrimination**
   - Evaluate whether observed signatures match predicted symmetry, phase, or component behavior.
   - Use independent observables to distinguish mechanism attribution from compensating errors or artifacts.
   - Test coordinate robustness and model-fidelity sensitivity.
   - *Decision gate (Mechanism exclusion):* Demote hypotheses that fail controls or show wrong sign or phase; if alternatives remain plausible, return to Step 3.

7. **Iteration and Hypothesis Ledger Update**
   - If supported: narrow the claim to the tested regime and propose the next discriminating condition.
   - If partially supported: identify the weak link (exterior response, local closure, matching, or observable) and redesign.
   - If refuted: preserve the negative result and constrain future hypotheses.
   - If inconclusive: prioritize stronger controls or independent diagnostics over added model complexity.
   - *Decision gate (Iteration gate):* Stop if two full cycles fail to produce discriminating evidence, or if safety or compliance boundaries are unclear.

8. **Claim Bounding and Final Validation**
   - State the validity domain (regime, geometry, model fidelity, diagnostic envelope).
   - Distinguish validated results from inference, analogy, and speculation.
   - *Decision gate (Claim bounding):* Do not generalize beyond the tested configuration family or validated parameter space.

# Output Format

When using this skill, produce:

1. **Research question:** one focused mechanism-to-observable link and performance conflict.
2. **Mechanism map:** concise causal chain with symmetry, spectral, or geometric decomposition.
3. **Ranked hypotheses:** table with evidence strength, key assumptions, predicted signatures, failure modes, and discriminators.
4. **Validation plan:** baseline, controls, independent variables, nuisance variables, observables, success and failure criteria, and stop conditions.
5. **Analysis plan:** decomposition method, local-reference comparison, uncertainty handling, and convergence checks.
6. **Iteration ledger:** evidence updates, assumption failures, and next minimal tests.
7. **Bounded claim statement:** scope, limitations, confounders, and extrapolation boundaries.

# Validation Gates

- **Candidate gate:** Hypotheses must be falsifiable and linked to specific symmetry, phase, or component predictions.
- **Functional validation gate:** Controls must be capable of isolating the target mechanism from profile effects, boundary changes, and diagnostic artifacts.
- **Robustness gate:** Signal must exceed combined numerical, diagnostic, and model-form uncertainty.
- **Mechanism exclusion gate:** Alternative mechanisms must be actively tested and ruled out before claiming dominance.
- **Stability gate:** Conclusions must be stable under coordinate changes, resolution variations, and truncation sensitivity.
- **Claim bounding gate:** Final claims must be restricted to the tested regime and explicitly label extrapolation.

# Claim Boundaries

- Do not present single-configuration or single-study results as field-wide consensus.
- Do not extrapolate linear or geometric stability metrics to nonlinear saturated behavior without direct validation.
- Do not infer local emission or generation from observed intensity alone without propagation and escape analysis.
- Distinguish steady-state from transient conclusions.
- Mark simulation-inferred, theory-motivated, and experimentally validated claims separately.

# Failure Modes

- **Profile-driven confounding:** The observable changes due to pressure, density, or current profile variation rather than the target mechanism.
- **Compensating errors:** Multiple incorrect assumptions cancel to produce apparent agreement.
- **Diagnostic artifact:** Calibration drift, line integration, probe perturbation, or inversion assumptions mimic the target signature.
- **Coordinate or representation artifact:** Conclusions depend on flux labeling, normalization, or basis choice.
- **Model-fidelity artifact:** Simplified closures, truncation, or resolution suppress or exaggerate the mechanism.
- **Regime misidentification:** The system is not in the assumed turbulence, collisionality, or stability regime.
- **Nonlocal mixing:** Observed response reflects indirect coupling or global feedback rather than the local mechanism.
- **Missing enabling condition:** The mechanism requires an unmet symmetry break, gradient threshold, or boundary condition.

# Validity Checks

- **Mechanism specificity:** Confirm the explanation depends on the intended geometry, symmetry, or spectral feature, not merely on generic profile or boundary changes.
- **Component completeness:** Check whether dominant and higher-order components cancel, reinforce, or redistribute the total behavior.
- **Coordinate robustness:** Verify conclusions are not artifacts of coordinate choice, flux labeling, or normalization.
- **Control separation:** Ensure baseline, negative, positive, and strong controls isolate the target mechanism.
- **Uncertainty propagation:** Propagate reconstruction, diagnostic, numerical, and model-form uncertainty into derived indicators.
- **Statistical adequacy:** Use sufficient independent cases to distinguish trend from noise; report confidence levels.
- **Background-fluctuation separation:** Ensure slowly evolving equilibrium components are not double-counted as turbulent perturbations.
- **Reproducibility:** Record data provenance, preprocessing, model versions, analysis decisions, and random seeds where applicable.

# Provenance

- Derived from cluster 7.1 (symmetry-guided mechanism discovery and validation).
- Synthesized from source skills: stellarator-equilibrium-current-exploration, stellarator-pressure-island-research-workflow, electromagnetic-boundary-turbulence-research-design, stellarator-nonlinear-mhd-research-workflow, magnetic-configuration-transport-workflow, overdense-plasma-mode-conversion-research, plasma-intrinsic-rotation-research-design, fusion-boundary-nonlocal-transport-workflow.
- Methodological precedent only; no specific paper conclusions, numerical parameters, or device settings are embedded.
