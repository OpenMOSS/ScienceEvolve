---
name: sci-cosmology-weak-signal-mechanism-discovery-workflow-4ee2ddca
description: A reusable end-to-end workflow for designing astrophysical studies that discover and validate mechanisms from weak, diffuse, or indirect observables using simulation-calibrated proxies, controlled stacking or cross-correlation, and systematic uncertainty auditing.
scienceevolve-title: "Galaxy, cosmology, and simulations · weak signal mechanism discovery workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

## Purpose

This skill helps an agent transform a weak, diffuse, or indirect astrophysical signal into a testable mechanism-discovery and validation plan. It abstracts the shared method pattern across extragalactic and cosmological contexts: define robust observables, connect them to latent physical quantities through calibrated simulations, quantify systematics before drawing inferences, and iterate between hypothesis generation, controlled testing, and claim bounding.

## When to use

Use this skill when designing research questions or studies where:
- The target signal is weak, diffuse, or below the threshold for individual detection.
- Observable proxies must be mapped to latent physical quantities via simulations or mocks.
- Multiple tracers, cross-correlations, or stacked ensemble measurements are needed to break degeneracies.
- Astrophysical or observational systematics can mimic or mask the target mechanism.

Do not use this skill for operational instrument procedures, fabrication protocols, hazardous activities, or high-stakes decision-making outside a research context. It is intended for non-invasive observational, simulation, and data-analysis study design.

## Inputs required

- **Target gap or mechanism:** The physical process to be distinguished from baseline or internal evolution.
- **Data assets:** Catalogs, maps, spectra, imaging, survey masks, or published summary statistics.
- **Candidate proxies:** Observable variables proposed to trace the latent quantity, with physical motivation.
- **Simulation or mock framework:** Controlled models that reproduce the selection function, noise, and property distributions of the data.
- **Contaminants and nuisances:** Known foregrounds, backgrounds, calibration artifacts, selection effects, and unresolved populations.
- **Competing hypotheses:** Baseline physical models and alternative explanations (nuisance-driven, selection-driven, or model-form).
- **Constraints:** Data-quality limits, redshift/mass range, computational budget, reproducibility requirements, and external probe overlap.

## Core Workflow

1. **Gap Framing & Mechanism Decomposition**
   - Define the process-attribution gap: what baseline physics explains, and what requires a new mechanism.
   - Identify the latent quantity and the observable regime where the mechanism should imprint a signal.
   - **Gate — Falsifiability:** Can the gap be addressed with available data, simulations, or independent cross-checks? If no, stop and redefine the question.

2. **Proxy & Observable Design**
   - Choose a robust observable statistic less sensitive to local artifacts than raw measurements.
   - Define candidate tracers or proxies and state the minimal assumptions required for the latent mapping.
   - **Gate — Proxy Viability:** Do the proxies have sufficient purity, dynamic range, and physical motivation for the target regime? If no, refine the observable or stop.

3. **Hypothesis Generation & Ranking**
   - Generate hypotheses across categories: nuisance/calibration, astrophysical mechanism, model-form mismatch, and sample-selection effects.
   - For each hypothesis, label evidence strength (high, medium, low, speculative), key assumptions, a discriminating prediction, and likely failure modes.
   - Prioritize hypotheses that can be tested with a minimal viable validation.
   - **Gate — Discrimination:** Are there at least two competing hypotheses with distinct, falsifiable predictions? If no, broaden the hypothesis space.

4. **Minimal Viable Validation (MVV)**
   - Design the smallest test that can falsify or support the leading hypothesis using existing data, published summaries, or small controlled mocks.
   - Apply negative controls (scrambled, phase-randomized, null-position, or degraded data) to verify the pipeline does not create false signals.
   - Apply positive controls (simulated or known-signal injections) to verify recovery within expected uncertainty.
   - **Gate — Control:** Do negative controls yield null results and positive controls recover the injected signal? If no, redesign the extraction pipeline or stop.

5. **Simulation-Calibrated Mapping**
   - Build or select mocks that reproduce the observed sample’s selection function, property distributions, and measurement uncertainties.
   - Calibrate the observable-to-latent mapping; treat it as approximate, not exact.
   - Quantify scatter, miscentering, aperture losses, redshift uncertainty, and selection biases.
   - **Gate — Calibration:** Do mocks recover injected latent signals within the expected tolerance? If no, diagnose simulation fidelity or stop.

6. **Weak-Signal Extraction**
   - Extract the signal statistically via stacking, cross-correlation, matched filtering, or summary statistics appropriate for partial sky coverage and mode coupling.
   - Compare independent estimators, sky splits, and subsamples to separate measurement uncertainty from population scatter or sample variance.
   - **Gate — Robustness:** Is the signal stable across estimators, subsamples, and reasonable foreground or mask variants? If no, audit artifacts and contaminants.

7. **Systematics-First Uncertainty Audit**
   - Decompose the total uncertainty into statistical, observational, physical-nuisance, methodological, and numerical components.
   - Propagate systematic uncertainty; do not report statistical error alone.
   - **Gate — Dominance:** Do uncontrolled systematics dominate the target signal or exceed statistical uncertainty? If yes, narrow the claim boundaries or stop.

8. **Mechanism Discrimination & Model Comparison**
   - Compare hypotheses using forward modeling, residual analysis, and multi-tracer or multi-wavelength triangulation.
   - Fit scaling relations cautiously; prefer transparent residual analysis over overconfident model selection.
   - Test boundary conditions: where should the signal strengthen, weaken, or reverse?
   - **Gate — Resolution:** Can the data distinguish the leading mechanism from plausible alternatives? If no, iterate with new tracers, simulations, or observables (return to Step 3 or 5).

9. **Claim Bounding & Iteration**
   - Restrict claims to the validated observable, scale range, redshift/mass regime, and model space.
   - Define iteration triggers: residual patterns, nuisance dominance, independent dataset disagreement, or qualitative changes under reasonable analysis choices.
   - **Stop conditions:** Uncontrolled systematics dominate; mocks fail recovery; covariance assumptions break; results change qualitatively under reasonable choices; uncertainty propagation removes the claimed signal; or the conclusion depends on unvalidated extrapolation.
   - **Gate — Scope:** Are claims explicitly bounded and reproducible? If yes, finalize; otherwise, return to the relevant prior step.

## Output Format

When using this skill, return a structured research plan containing:

1. **Research question** — Concise, testable question and the phenomenon to isolate.
2. **Gap and motivation** — Why the question matters and what prior limitation motivates it.
3. **Ranked candidate hypotheses** — Table with mechanism, evidence strength, key assumptions, discriminating prediction, and likely failure mode.
4. **Study design** — Sample definition, proxy variables, control conditions (negative, positive, strong), metrics, MVV, and strong validation steps.
5. **Analysis plan** — Observable estimation, simulation calibration, signal extraction, uncertainty decomposition, and visualization strategy.
6. **Validation gates summary** — Which gates were passed or failed, with justification.
7. **Claim boundaries** — Valid regime, extrapolation limits, model dependence, and distinction between measured, calibrated, and inferred quantities.
8. **Iteration and stopping rules** — Triggers for redesign, narrowing, or cessation.
9. **Provenance and reproducibility notes** — Data versions, mock provenance, pipeline settings, random seeds, and citation requirements.

## Validation Gates

- **Falsifiability Gate:** The research gap must be addressable with current data, simulations, or independent cross-checks.
- **Proxy Viability Gate:** Proxies must have sufficient purity, dynamic range, and physical motivation for the target regime.
- **Discrimination Gate:** At least two competing hypotheses must have distinct, falsifiable predictions.
- **Control Gate:** Negative controls must not reproduce the claimed signal, and positive controls must recover known signals within tolerance.
- **Calibration Gate:** Mocks must recover injected latent signals within expected uncertainty after accounting for selection and scatter.
- **Robustness Gate:** The signal must be stable across independent estimators, subsamples, sky splits, and foreground variants.
- **Dominance Gate:** Uncontrolled systematics must not exceed the target signal or statistical uncertainty.
- **Resolution Gate:** The data must be able to distinguish the leading mechanism from plausible alternatives.
- **Scope Gate:** Conclusions must remain within the validated observable, scale, and model boundaries.

## Claim Boundaries

- Restrict claims to the validated observable, scale range, redshift/mass regime, and simulation model used.
- Do not extrapolate beyond calibrated model space without explicit uncertainty statements.
- Distinguish directly measured quantities from simulation-calibrated inferences and from speculative extensions.
- Treat single-study results as evidence conditional on their data and modeling assumptions, not as field-wide consensus.
- Mark proxy-dependent inferences as conditional on the validity of the mock calibration.

## Failure Modes

- **Training-set gap:** Held-out scenarios or real-data systematics are not spanned by mocks or training simulations.
- **Proxy degeneracy:** Multiple physical mechanisms produce identical observable signatures.
- **Information loss:** Mitigation of nuisances removes target signal along with systematic contamination.
- **Model inflexibility:** Physical nuisance parameters or fixed model forms cannot represent the true nuisance manifold.
- **Observational mismatch:** Real data contain systematics, foregrounds, or selection effects absent from the controlled testbed.
- **Covariance breakdown:** Incorrect covariance assumptions inflate significance, mask signals, or destabilize inference.
- **Selection confounding:** Apparent signal is driven by sample selection, projection effects, membership contamination, or miscentering.
- **Extrapolation illusion:** Conclusions depend on unvalidated scale, redshift, or parameter regimes.
- **Overfitting:** Complex models fit noise or simulation-specific features rather than physical signal.

## Validity Checks

- **Confounding:** Verify balance across mass, redshift, luminosity, density, and selection function; vary foregrounds, masks, and calibration treatments.
- **Reproducibility:** Document data versions, catalog cuts, pipeline settings, random seeds, mock definitions, covariance estimates, and simulation provenance.
- **Statistical validity:** Check covariance structure, coverage, sampler convergence, non-Gaussian errors, parameter degeneracies, and multiple-comparison risks; confirm whether uncertainties are systematics-dominated.
- **Component attribution:** Confirm whether smooth, clustered, foreground, or unresolved components drive the result.
- **Boundary discipline:** Test scale ranges, redshift ranges, survey configurations, and nuisance regimes where the method may fail; flag extrapolation beyond the training regime as speculative.
- **External validity:** Do not generalize from one simulation suite, survey configuration, or summary statistic without additional independent evidence.

## Provenance

- Derived from cluster **15.0** (observable-driven mechanism discovery and validation).
- Synthesized from source skills: `lyman-alpha-forest-power-spectrum-exploration`; `stacked-sz-halo-gas-research`; `galaxy-environment-quenching-research`; `weak-lensing-nuisance-manifold-design`; `dark-matter-indirect-anisotropy-workflow`; `galaxy-interaction-research-design`; `weak-lensing-halo-centering-research`; `cmb-galaxy-crosscorrelation-cosmology`.
- Method patterns are abstracted from these astrophysical contexts; no specific paper conclusions, numerical results, or operational protocols are preserved.
