---
name: sci-cosmology-mechanism-discovery-via-emulation-workflo-0911b04b
description: A reusable end-to-end workflow for discovering and validating physical mechanisms in inference problems by combining simulation-informed surrogate models, structured uncertainty propagation, and iterative validation against held-out benchmarks.
scienceevolve-title: "Galaxy, cosmology, and simulations · mechanism discovery via emulation workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

## Purpose

Turn inference bottlenecks into testable research plans when theoretical models are imperfect, boundary behaviors dominate, or nuisance processes threaten parameter bias. The workflow treats unresolved model residuals or alternative mechanisms as structured uncertainties, learns their behavior from simulation or surrogate ensembles, propagates them into the likelihood, and validates whether proposed mechanisms improve inference through end-to-end parameter recovery and controlled benchmarking.

## When to use

Trigger this skill when a research question involves:

- Inferring parameters from summary statistics whose theoretical model is reliable only over part of the observable range.
- A known nuisance process or model misspecification that may produce structured residuals rather than independent scatter.
- A need to compare conservative information cuts with softer uncertainty propagation or emulator-assisted modelling.
- Simulation, emulator, or mock ensembles that can represent plausible residual, boundary, or alternative model behaviors beyond a fiducial baseline.
- Designing surrogate data for covariance estimation, pipeline robustness checks, or multi-tracer correlation studies.

Do not use this skill for unrelated observational programs, operational instrument tasks, or studies where the dominant uncertainty is purely statistical without model-form, boundary, or systematic error.

## Inputs required

Before designing a study, obtain or request:

- Target observable and summary statistic (e.g., tomographic correlations, compressed data vectors, or threshold-sensitive diagnostics).
- Baseline theory model, candidate alternative models, and the parameter set to be inferred.
- Suspected nuisance processes or mechanisms and why they may produce residuals or boundary effects.
- Available simulation, emulator, or mock ensemble, including which assumptions vary across members.
- Validation data vectors or held-out realizations intentionally distinct from the calibration set.
- Survey or experiment characteristics relevant to geometry, selection, masks, noise, and binning.
- Decision criteria for acceptable bias, precision loss, numerical stability, and model complexity.

## Core Workflow

Follow this ordered route, applying decision gates and iteration/stop conditions at each step.

1. **Frame the inference bottleneck.** Identify the observable regime, scale, or latent distribution tail where model uncertainty, missing physics, or boundary behavior can bias downstream inference. State the specific downstream decision the analysis must support.

2. **Audit candidate models.** Classify existing models (conventional baseline, flexible fit, theory-constrained). Identify where each is likely to fail: tails, cutoffs, small scales, or specific nuisance regimes. Flag extrapolation risks before interpreting disagreement.

3. **Formulate mechanism hypotheses.** For each candidate mechanism, specify the predicted effect on observables or parameters, evidence strength (high/medium/low/speculative), key assumptions, and likely failure modes. Include at least one boundary or tail hypothesis if extreme values of a latent distribution dominate the inference.

4. **Design calibration and validation ensembles.** Assign simulation or surrogate roles: base samples, correlated surrogates or auxiliary samples, held-out test samples, and external reference samples. Ensure calibration and validation sets are disjoint. Include positive controls (known bias recoverable), negative controls (negligible expected effect), and robustness controls (alternative envelopes or correlation models).
   - **Gate:** Stop if the ensemble cannot plausibly cover the residual or alternative model space relevant to the hypothesis.

5. **Construct structured uncertainty or surrogate model.** Learn residual amplitude and correlation from the calibration ensemble, or fit a compact emulator that preserves physically relevant structure. Add theoretical-error covariance or surrogate uncertainty into the inference framework without discarding data outright.
   - **Gate:** Stop if the augmented covariance is numerically unstable, not positive-definite after reasonable regularization, or if surrogate structured errors exceed expected statistical uncertainty.

6. **Propagate into observables and likelihood.** Convert model-level differences into the data vector. Run inference under baseline, augmented/emulator-assisted, and conservative information-cut treatments using consistent priors and likelihood structure where possible.

7. **Compare inference outcomes.** Quantify parameter bias, uncertainty expansion, coverage, and degeneracy changes. Check whether apparent agreement is caused by overly broad uncertainties rather than genuine bias reduction.
   - **Gate:** If bias reduction is negligible while precision loss is large, revert to conservative cuts or redesign the residual/surrogate model.

8. **Validate on held-out extremes and controls.** Test coverage frequency, calibration independence, residual coverage, and parameter identifiability. Verify that negative controls show no spurious sensitivity and positive controls recover known behavior.
   - **Gate:** If validation cases disagree without a defensible physical explanation, diagnose whether the failure lies in latent structure, observable mapping, selection, systematics, or ensemble size. Iterate on the smallest necessary component.

9. **Iterate and refine.**
   - *If bias remains high:* expand calibration coverage, revise the mechanism hypothesis, or add nuisance parameters representing missing physics.
   - *If uncertainties become excessive:* test less conservative envelopes, improve correlation modelling, or apply principled observable cuts only for unsupported regimes.
   - *If results are pipeline-definition dependent:* add object-finding, centering, linking, or scale-cut sensitivity controls before interpreting physics.
   - *If multiple independent diagnostics agree:* broaden claims cautiously; otherwise narrow to the validated regime.
   - *Stop* when added samples or model complexity no longer materially improve validation metrics, when correlated surrogates fail to outperform negative controls, or when the acquisition objective no longer matches the scientific question.

10. **Bound claims and archive provenance.** Explicitly label conclusions as verified by validation, inferred for the new problem, or speculative. State regimes where extrapolation is prohibited. Record model versions, mock labels, priors, random seeds, and validation splits.

## Output Format

When applying this skill, return:

1. **Research question and gap statement:** one sentence stating the inference problem and why the baseline model may be biased.
2. **Mechanism hypotheses table:** for each hypothesis, evidence strength, key assumptions, predicted observable effect, and likely failure modes.
3. **Experimental design:** ensemble roles, calibration/validation split, controls, variables, evaluation metrics, and stop conditions.
4. **Analysis plan:** residual or surrogate construction, covariance or uncertainty propagation, likelihood comparison, diagnostics, and visualization plan.
5. **Iteration log:** documented decisions and model updates triggered by validation outcomes.
6. **Validity and boundary statement:** main confounders, reproducibility checks, coverage targets, and limits on extrapolation.
7. **Evidence classification:** explicitly mark which claims are supported by the source workflow, which are agent-inferred extensions, and which remain speculative.

## Validation Gates

Before trusting conclusions, verify:

- **Coverage:** credible intervals contain validation truth at the expected frequency across held-out cases.
- **Calibration independence:** validation cases are not used to tune residual envelopes, surrogate hyperparameters, or correlation models.
- **Residual coverage:** no validation residual lies far outside the calibrated uncertainty model without explanation.
- **Numerical stability:** augmented covariances are positive-definite or appropriately regularized; results do not depend on arbitrary regularization choices.
- **Parameter identifiability:** target parameters are not merely tracking nuisance parameters or prior assumptions.
- **Envelope and correlation sensitivity:** conclusions are robust to conservative, moderate, and data-driven residual amplitudes and to plausible changes in correlation length.
- **Cross-regime consistency:** independent scales, redshift bins, samples, or observables give compatible target-parameter estimates within expected uncertainty.
- **Control recovery:** positive controls recover known behavior and negative controls show no spurious sensitivity.
- **Reproducibility:** model versions, mock labels, priors, likelihood definitions, random seeds, and sampling settings are recorded.

## Claim Boundaries

- Distinguish computational acceleration or surrogate accuracy from physical discovery.
- Separate validated benchmark behavior from speculative extrapolation to new systems, scales, or parameter regimes.
- Do not present surrogate, mock, or emulator agreement as proof of physical truth; treat it as evidence conditional on the validation suite.
- Limit claims to validated observables, parameter regimes, tracer models, and model families.
- Treat single-study or single-simulation evidence as methodological support, not as field-wide consensus.

## Failure Modes

- Undercoverage of residual or alternative model space by the calibration ensemble.
- Over-smoothing or over-conservative down-weighting that masks real signal.
- Hidden parameter degeneracies that absorb model misspecification into nuisance broadening.
- Calibration-test leakage through reuse of validation data for tuning.
- Emulator or surrogate extrapolation beyond the training or representation domain.
- Pipeline-definition sensitivity (e.g., object-finding, centering, linking, scale cuts) dominating apparent physical trends.
- Nuisance assumptions or selection effects dominating over the target mechanism.
- Instability from rare tails, unbound cases, or boundary extremes in latent distributions.
- Acquisition objectives that no longer align with the scientific question during active-learning iteration.

## Validity Checks

- **Confounding:** test whether selection effects, masks, calibration differences, or randomization choices drive apparent agreement.
- **Overfitting:** ensure calibration statistics are not reused as validation statistics.
- **Latent correlation:** verify that shared underlying structures are preserved when cross-correlations or multi-tracer links matter.
- **Scale and regime validity:** restrict claims to the scales, populations, and regimes actually validated.
- **Statistical validity:** confirm ensemble size, covariance stability, distributional assumptions, and convergence diagnostics are appropriate.
- **Extrapolation:** flag any predictors or emulators used outside their validity domain.
- **Reproducibility:** document seeds, metadata, calibration choices, control variants, and failure criteria sufficiently for rerun.

## Provenance

- Cluster 6 / Subcluster 6.1.
- Synthesized from source skills: `weak-lensing-theory-error-mitigation` (10.1093_mnras_stab2481), `large-scale-structure-mock-validation` (10.1093_mnras_stab510), `weak-lensing-theory-uncertainty-research` (10.1093_mnras_stad1142), `boundary-sensitive-astrophysical-inference` (10.1103_physrevd.83.023519), `dark-matter-infall-orbit-research-workflow` (10.1111_j.1365-2966.2005.08788.x), `correlated-sample-active-emulation` (10.3847_1538-4357_ad3d4a), `lss-differentiable-emulator-research` (10.1088_1475-7516_2026_02_016), and `nonlinear-lensing-clustering-forecasting` (10.1093_mnras_stab3793).
- Methodological patterns extracted; no paper-specific numerical results, parameters, or operational protocols are included in the reusable workflow body.
