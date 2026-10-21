---
name: sci-cosmology-galaxy-cosmology-mechanism-discovery-work-5cb6293f
description: Use this skill when designing end-to-end research workflows to discover, discriminate, and validate astrophysical mechanisms across galaxy, halo, and cosmological domains using multi-probe comparisons, simulation counterfactuals, and controlled robustness checks.
scienceevolve-title: "Galaxy, cosmology, and simulations · galaxy cosmology mechanism discovery workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

# Purpose

Help an agent turn an astrophysical or cosmological observation into a reusable mechanism-discovery workflow. The goal is to generate competing hypotheses, design controlled multi-probe or multi-regime validation studies, and iterate based on robustness checks rather than single-statistic preferences.

# When to use

Use this skill when:

- A user asks for research questions about galaxy state transitions, halo structure, cosmological model extensions, or environmental/population drivers.
- The study must distinguish intrinsic physics from systematics, selection effects, or nuisance-parameter degeneracies.
- Multiple observables, simulations, or data views are available for cross-checking.
- The task requires comparing a baseline model against competing mechanisms or extensions.

Do not use this skill for operational instrument instructions, clinical decisions, or as a substitute for domain-specific statistical review outside the research design context.

# Inputs required

Before producing a plan, identify:

- **Target research question** and baseline model or expectation.
- **Candidate mechanism families** (intrinsic, environmental, cosmological, or observational).
- **Available datasets, simulations, mocks, or complementary observables.**
- **Known nuisances:** selection effects, calibration uncertainties, resolution limits, foregrounds, or projection effects.
- **Independent validation resources:** alternative pipelines, data splits, or model families.
- **Boundary conditions:** scales, redshifts, mass ranges, or regimes in scope.

# Core Workflow

1. **Frame the question and baseline.**
   - State the target population, observable, and baseline model.
   - Define the gap: what the baseline cannot explain or where competing predictions diverge.

2. **Generate competing mechanism hypotheses.**
   - Propose at least two families (e.g., intrinsic vs. environmental, baseline vs. extension, physical vs. systematic).
   - For each: state the claim, expected signature, key assumptions, likely failure modes, and evidence strength (speculative / weak / moderate / strong).
   - Include a nuisance-artefact hypothesis.

3. **Design controlled comparisons.**
   - Define independent variables: model, regime, data view, probe, or selection function.
   - Define dependent variables: observable statistics, residuals, population fractions, or correlation amplitudes.
   - Establish controls:
     - **Baseline/strong control:** benchmark model on matched data.
     - **Negative control:** configuration expected to lack the target signal.
     - **Positive control:** regime where the signal should appear.
     - **Robustness control:** alternative pipelines, resolutions, centre definitions, or mapping choices.
   - Set pre-registered stopping conditions before interpreting results.

4. **Audit systematics and nuisances first.**
   - Check selection-function consistency across observed and simulated samples.
   - Verify target-state separability and data comparability across views.
   - Audit nuisance parameters that could absorb or mimic the target signal.
   - If systematics dominate, pause mechanism interpretation and redesign.

5. **Execute the primary analysis.**
   - Fit the baseline and candidate mechanisms under identical data and pipeline settings.
   - Compare joint performance across complementary observables or probes; do not rely on a single statistic.
   - Inspect scale-dependent, orientation-dependent, or regime-dependent residuals for structured deviations.
   - Use simulations or mocks to verify recovery of known effects and control false positives.

6. **Apply decision gates.**
   - **Candidate gate:** Does the signal survive the minimal viable validation (baseline fit + one nuisance check + one consistency check)? If no, stop or downgrade.
   - **Robustness gate:** Does the signal persist under alternative selections, calibrations, or pipelines? If no, classify as analysis-sensitive.
   - **Mechanism-exclusion gate:** Can a competing mechanism explain the same pattern with fewer assumptions? If yes, prefer the simpler explanation.
   - **Stability gate:** Do independent probes or data views agree? If no, diagnose probe-specific assumptions before combining.

7. **Iterate or stop.**
   - **Strengthen:** If the signal is cross-validated and secondary gradients match predictions, elevate evidence strength.
   - **Weaken:** If rankings reverse under small changes, negative controls become important, or generalization gaps appear, downgrade.
   - **Reframe:** If simulations and observations agree on mechanism but disagree on proxy, or if a mixed regime shows gradual transition, revise the hypothesis.
   - **Pause:** If target states are inseparable, leakage is detected, or conclusions depend on a narrow unjustified boundary.
   - **Escalate:** If the result depends on rare regimes or poorly measured quantities, propose a broader study.
   - **Stop:** When further tuning no longer improves joint performance, when independent probes conflict irreconcilably, or when the model becomes indistinguishable from the baseline without discriminating observables.

8. **Synthesize and bound claims.**
   - Separate predictive performance, proxy ranking, and mechanistic interpretation.
   - Label each conclusion as paper-supported, newly observed, inferred, or speculative.
   - State boundary conditions: scales, redshifts, regimes, and model assumptions tested.

# Output Format

Return:

1. **Research question** — Baseline model, target gap, and scientific motivation.
2. **Mechanism map** — Competing families, expected signatures, and known confounders.
3. **Hypothesis table** — Claim, mechanism family, expected dominant predictor/signature, target regime, evidence strength, key assumptions, likely failure modes, minimal test.
4. **Experimental design** — Regimes/data views, variables, controls (strong, negative, positive, robustness), evaluation metrics, stopping conditions.
5. **Analysis plan** — Pre-registration, baseline fit, nuisance audit, model comparisons, cross-probe/residual checks, simulation validation.
6. **Iteration plan** — Rules for strengthen, weaken, reframe, pause, escalate, or stop.
7. **Validity and ethics notes** — Confounders checked, reproducibility requirements, boundary conditions, evidence-status labels.

# Validation Gates

- **Pre-registration gate:** Datasets, model hierarchy, nuisance choices, metrics, and failure criteria defined before interpreting outcomes.
- **Separability gate:** Target and baseline states are distinguishable without circular predictors.
- **Nuisance gate:** Parameter shifts are not driven by foregrounds, calibration, covariance assumptions, or selection effects.
- **Cross-probe gate:** Conclusions are stable across independent measurements or observables.
- **Simulation-recovery gate:** Injected signals are recoverable and false positives are controlled.
- **Robustness gate:** Results survive alternative centre definitions, binning, radial ranges, resolutions, or mapping choices.

# Claim Boundaries

- Distinguish what the primary data support, what external data add, what is inferred from combinations, and what remains speculative.
- Do not treat one dataset combination or single simulation suite as field-wide consensus.
- Separate expansion-history from growth-history claims when testing cosmological models.
- Limit claims to the validated scale, redshift, mass, environment, or regime range.
- Report parameter correlations and degeneracies, not only best-fit values.

# Failure Modes

- **Systematic mimicry:** An apparent signal is caused by calibration, foregrounds, selection bias, or covariance assumptions.
- **Overfitting:** Added parameters improve one statistic while degrading independent constraints or physical consistency.
- **Proxy contamination:** A coarse observable mixes physically distinct components, hiding or faking a mechanism.
- **Degeneracy collapse:** Competing mechanisms make indistinguishable predictions within the tested regime.
- **Extrapolation overreach:** Claims extend beyond the convergence boundary, resolution limit, or validated sample range.
- **Probe incompatibility:** A probe’s reconstruction assumes a model incompatible with the candidate mechanism.

# Validity Checks

Before accepting a conclusion, verify:

- **Confounding:** by mass, environment, redshift, selection, or measurement noise.
- **Degeneracy:** among target and nuisance parameters.
- **Model comparison fairness:** matched data, pipelines, and criteria.
- **Pipeline reproducibility:** independent implementations or alternative likelihoods where feasible.
- **Data independence:** correlated datasets are not treated as fully independent.
- **Statistical validity:** uncertainty intervals, effect sizes, multiple-comparison considerations, prior sensitivity.
- **Boundary clarity:** measured vs. inferred vs. extrapolated quantities.
- **Consensus language:** single-study findings are described as evidence under assumptions.

# Provenance

- Synthesized from cluster 7.1 (galaxy-cosmology-halo-dark mechanism discovery and validation).
- Source skills: precision-cmb-cosmology-research-workflow; galaxy-quenching-mechanism-discovery; dark-matter-halo-structure-exploration; galaxy-halo-complementary-observable-design; satellite-quenching-research-workflow; lyman-alpha-scale-aware-modeling; component-dynamics-intrinsic-alignment-research; cosmology-multiprobe-model-testing.
- Preserves methodological patterns, not paper-specific numerical results or operational protocols.
