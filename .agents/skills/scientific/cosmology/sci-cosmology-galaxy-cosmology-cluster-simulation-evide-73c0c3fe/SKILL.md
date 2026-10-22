---
name: sci-cosmology-galaxy-cosmology-cluster-simulation-evide-73c0c3fe
description: A reusable end-to-end workflow for designing, validating, and auditing scientific claims in galaxy, cosmology, and cluster astrophysics where simulations, multi-observable inference, and systematic uncertainty dominate.
scienceevolve-title: "Galaxy, cosmology, and simulations · galaxy cosmology cluster simulation evidence analysis workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

## Purpose

Help an agent design, validate, and audit research plans for astrophysical and cosmological inference problems involving latent quantities, multiple noisy observables, simulation-limited uncertainty, and model-dependent systematics. The workflow provides an ordered route from hypothesis generation through controlled validation to claim bounding and iteration.

## When to use

Trigger this skill when the user asks to:
- Propose new research questions in galaxy, cluster, cosmology, large-scale structure, or gravitational lensing studies.
- Design validation studies for projected observables, anisotropic clustering, dynamical tracers, or multi-probe inference.
- Audit tensions between independent measurements or systematic uncertainties.
- Plan simulation-based, emulator-assisted, or mock-validated analysis pipelines.

Do not use this skill for telescope operations, instrument data reduction, hazardous procedures, or as a substitute for domain-specific observational protocols.

## Inputs required

Before executing the workflow, identify or request:
- Target latent quantity or scientific parameter.
- Observable set and the physical or empirical link to the latent quantity.
- Baseline model and candidate alternative or nuisance models.
- Simulation, mock catalog, or validation resources.
- Selection function, survey geometry, completeness, and known systematics.
- Acceptance criteria for calibration, robustness, computational cost, and evidence strength.

## Core Workflow

1. **Problem Framing**  
   Define the latent quantity, the physical mechanism linking it to observables, and the inference bottleneck (statistical precision, systematic uncertainty, model adequacy, or simulation cost).

2. **Hypothesis Generation**  
   Produce at least three testable hypotheses. For each, specify: causal claim, evidence strength (strong/moderate/weak/speculative), key assumptions, observable consequences, likely failure modes, and a minimal discriminating test. Include at least one systematic alternative for every apparent physical signal.

3. **Validation Hierarchy Design**  
   - **Decision Gate A:** Are simulations, mocks, or auxiliary data available to test the central assumption? If no, pause and redesign for a minimal viable test.  
   - Define negative controls (signal-absent or randomized), positive controls (known-truth injection), and reduced controls (mechanism removed).  
   - Pre-register stop conditions: e.g., negative-control failure, mock-recovery bias above tolerance, prior-dominated conclusions, or emulator instability.

4. **Observable Construction and Systematic Calibration**  
   Build measurement operators that separate intrinsic signal from projection, background, selection, and calibration effects. Propagate calibration uncertainty into inference rather than treating it as fixed. Document selection functions, masks, and completeness limits.

5. **Simulation and Mock Validation**  
   - Run recovery tests with known inputs.  
   - **Decision Gate B:** Do positive controls recover truth within acceptance criteria? If no, repair the pipeline before physical interpretation.  
   - Compare baseline and alternative models under identical mock conditions.  
   - If using emulators or approximations, validate against high-fidelity runs on held-out cases.

6. **Model Hierarchy and Inference Execution**  
   Fit a ladder of models from restrictive to flexible. Include nuisance parameters for systematics. Estimate covariance with appropriate treatment of cross-statistic and non-Gaussian correlations. Record prior sensitivity and parameter degeneracies.

7. **Robustness and Residual Audit**  
   - Vary scale cuts, binning, covariance approximations, and nuisance priors.  
   - Inspect residuals for structure correlated with known systematics.  
   - **Decision Gate C:** Does the result survive under plausible alternative assumptions? If no, downgrade evidence strength or redesign.

8. **Cross-Probe and Multi-Observable Synthesis**  
   Require consistency across independent observables, data splits, or external probes before elevating a result to a robust claim. Quantify how auxiliary constraints reduce degeneracy.

9. **Uncertainty Audit**  
   Distinguish statistical error, systematic error, model uncertainty, prior dependence, and approximation error. Verify that uncertainty estimates are calibrated on mocks or known-truth samples.

10. **Claim Bounding and Iteration**  
    - Label each conclusion as validated (mock-supported), inferred (model-dependent), or speculative.  
    - State boundary conditions: mass, redshift, scale, environment, or data regime.  
    - **Decision Gate D:** If all stop conditions are met and evidence converges, finalize the claim boundary. Otherwise, return to Step 2 or Step 4 with revised hypotheses or additional data.

## Output Format

Return a structured research plan containing:
1. **Research question** — latent target, inference goal, and bottleneck.
2. **Hypothesis table** — claims, evidence strength, assumptions, failure modes, and minimal tests.
3. **Experimental design** — validation hierarchy, controls, variables, metrics, and stop conditions.
4. **Analysis plan** — observable construction, model hierarchy, covariance strategy, and inference sequence.
5. **Robustness checklist** — sensitivity tests, residual diagnostics, and prior-dependence checks.
6. **Iteration plan** — rules for strengthening, weakening, simplifying, or reframing hypotheses based on outcomes.
7. **Validity and boundary statement** — confounders, reproducibility requirements, claim boundaries, and uncertainty communication limits.

## Validation Gates

- **Gate A (Feasibility):** Sufficient validation data exist to test the central assumption.
- **Gate B (Recovery):** Positive controls recover known inputs within pre-defined tolerance.
- **Gate C (Robustness):** Conclusions remain stable under alternative model assumptions, scale cuts, and covariance choices.
- **Gate D (Convergence):** Evidence from multiple independent indicators converges before claim finalization.

## Claim Boundaries

- This skill provides a research-design framework, not domain-wide consensus or guaranteed discovery.
- Claims are bounded by the simulation physics, mock realism, selection model, and validated parameter regime.
- Do not extrapolate beyond the tested redshift, mass, scale, or environmental range without labeling the inference as speculative.
- Distinguish methodology validation from new physical conclusions.

## Failure Modes

- **Negative control failure:** Apparent signal persists in signal-absent configurations, indicating leakage from selection or pipeline artifacts.
- **Mock recovery failure:** Known inputs are not recovered with acceptable bias and coverage.
- **Prior dominance:** Posterior shifts are driven by prior volume rather than data.
- **Emulator or approximation breakdown:** Surrogate models extrapolate beyond their training regime.
- **Cross-probe inconsistency:** Independent observables disagree without an explainable mechanism.
- **Selection-function misspecification:** Incompleteness, contamination, or masking biases the latent quantity inference.
- **Covariance misspecification:** Underestimated or unstable uncertainties lead to overconfident claims.

## Validity Checks

- **Confounding:** Verify that selection effects, calibration errors, and survey geometry are not correlated with the target observable.
- **Identifiability:** Confirm that latent quantities and nuisance parameters can be separated by the available data.
- **Calibration propagation:** Include calibration uncertainties in the posterior, not as post-hoc adjustments.
- **Reproducibility:** Document data versions, model definitions, priors, seeds, masks, and analysis-code versions.
- **Statistical validity:** Check sampler convergence, uncertainty calibration, and sensitivity to priors or reparameterization.
- **Boundary validity:** Restrict claims to the tested tracer population, redshift range, scale, and systematic regime.
- **External validity:** Do not treat a single simulation suite or mock catalog as field-wide consensus.

## Provenance

- Synthesized from cluster 12, subcluster 12.0 (galaxy-cosmology-cluster-simulation-evidence-analysis-workflow).
- Source skills: bayesian-hybrid-covariance-research; cosmology-sz-scaling-workflow; globular-cluster-dynamical-tracer-workflow; cosmology-rsd-research-design; gravitational-lens-time-delay-systematics-skill; lss-joint-correlator-research; galactic-halo-perturbation-research; multiobservable-bayesian-cluster-calibration.
