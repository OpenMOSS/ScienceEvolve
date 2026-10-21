---
name: sci-cosmology-cosmic-mechanism-discovery-validation-wor-f70fba72
description: An end-to-end workflow for discovering and validating physical mechanisms in cosmic structure and cosmology by linking observable signatures to component-level hypotheses, benchmarking against simulations or multi-probe data, and iterating through controlled validation gates.
scienceevolve-title: "Galaxy, cosmology, and simulations · cosmic mechanism discovery validation workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

## Purpose

Use this skill to turn tensions or signatures in cosmological and large-scale structure observables into tractable, reusable research plans. It guides hypothesis generation, minimal validation design, multi-scale forward modeling, mechanism discrimination, and claim bounding—without reproducing any single study’s numerical setup or conclusions.

## When to use

Trigger this skill when the user needs to:

- Generate research questions from an observable tension, anomaly, or scale-dependent feature in cosmology or astrophysical structure formation.
- Design validation plans that compare baseline and alternative mechanisms using simulations, synthetic observables, or multi-probe data.
- Discriminate between competing explanations for anisotropic, scale-dependent, or indirect signatures.
- Iterate from simple models to higher-fidelity tests while bounding claims and managing degeneracies.

Do not use this skill for operational telescope scheduling, laboratory experimental protocols, or as a substitute for domain-specific data-reduction pipelines.

## Inputs required

Before execution, identify or request:

- **Target observable** and its measurement definition (e.g., power spectrum, correlation function, projected map, event catalog).
- **Baseline model** and **candidate mechanism(s)** that could alter the observable.
- **Scale regime(s)** where the mechanism should operate relative to the baseline.
- **Available evidence:** simulation suites, public data releases, fitting prescriptions, or literature priors.
- **Known nuisance parameters**, selection effects, geometry, and systematic uncertainties.
- **Computational or observational constraints** (resolution, volume, coverage, cost).
- **Comparison baseline:** fiducial model without the candidate effect or an alternative physical model.

## Core Workflow

1. **Observable Triage & Gap Definition**
   - Define the target signature as a pattern across scales, probes, or populations.
   - Separate confirmed features from tentative correlations or model-dependent artifacts.
   - **Decision gate:** If the signature is not reproducible across independent diagnostics, stop and refine the observable definition.

2. **Component-Level Hypothesis Generation**
   - Propose mechanism-level hypotheses that alter a latent variable (e.g., growth rate, clustering component, bias, abundance, topology).
   - For each hypothesis specify: predicted imprint, key assumptions, evidence strength (strong / moderate / weak / speculative), and likely failure modes.
   - Include at least a null baseline, an environmental or nuisance hypothesis, and a discriminator hypothesis.
   - **Decision gate:** If no hypothesis produces a distinctive (non-generic) signature, return to Step 1 or stop.

3. **Minimal Viable Validation Design**
   - Select one primary observable and one independent constraint capable of rejecting the hypothesis.
   - Define study arms: baseline, alternative, mechanism-ablated (if meaningful), and degenerate-model.
   - Specify controls: strong baseline, negative control (regime where effect should be absent), positive control (known signal), and robustness controls (alternative assumptions).
   - Define evaluation metrics: relative differences, ratio diagnostics, component contributions, residuals, or likelihood-based criteria.
   - **Stop condition:** Halt if the signal is below the systematic floor, dominated by nuisance degeneracy, or indistinguishable from selection effects.

4. **Forward Modeling & Synthetic Benchmarking**
   - Build a forward model mapping mechanism parameters to observable distributions.
   - Include geometry, selection effects, projection, and survey response before comparing to data.
   - Validate approximations (convergence, perturbativity, averaging scale, discreteness) before inference.
   - **Decision gate:** If the method cannot resolve the claimed feature or baseline preservation fails, stop and redesign the model or observable.

5. **Controlled Comparison & Decomposition**
   - Reproduce baseline behavior; verify large-scale consistency before interpreting small-scale or nonlinear features.
   - Decompose contributions by component, scale, or regime.
   - Use ratio or differential observables (perturbed vs. baseline) to suppress shared modeling errors and expose mechanism-specific structure.
   - Compare against multiple references (simulations, fitting prescriptions, independent data) rather than relying on one.
   - **Decision gate:** If residuals are large in transition regimes without a mechanistic explanation, stop and revisit assumptions.

6. **Mechanism Discrimination & Robustness**
   - Test degeneracies by varying nuisance parameters, population assumptions, and background models.
   - Assess stability across resolution, solver representation, analysis pipelines, and data splits.
   - Rank hypotheses by falsifiability, independence from tuned parameters, and robustness to known constraints.
   - **Decision gate:** If competing explanations fit equally well, design a discriminating observable or stop and narrow claims.

7. **Uncertainty Audit & Claim Bounding**
   - Map residuals into parameter constraints or sensitivity forecasts.
   - Separate population-level constraints from rare-object or individual-system claims.
   - Label each conclusion as: benchmark-supported, multi-probe consistent, model-dependent, or speculative.
   - **Decision gate:** If validity checks fail (unresolved assumptions, extrapolation beyond tested regime, prior-dominated results), narrow the claim or stop.

8. **Iteration or Redesign**
   - If the hypothesis is supported across independent probes, propose broader tests or combined analyses.
   - If ambiguous, add discriminating controls rather than tuning parameters.
   - If failed, determine whether failure stems from mechanism, implementation, sampling, or observable construction; revise only the responsible module.
   - Maintain an evidence ledger linking each model change to a specific residual and prediction.
   - **Stop condition:** Do not escalate to higher-fidelity models unless simpler models cannot answer the question and the minimal test succeeded.

## Output Format

Return the following structure:

1. **Research question** – target observable, candidate effect, baseline comparison.
2. **Ranked hypotheses** – mechanism, predicted signature, evidence strength, key assumptions, likely failure modes.
3. **Validation plan** – minimal viable test, strong/negative/positive controls, variables, metrics, stop conditions.
4. **Analysis plan** – baseline check, component decomposition, ratio/residual diagnostics, robustness checks, degeneracy tests.
5. **Iteration roadmap** – conditions for strengthening, narrowing, or abandoning each hypothesis; next discriminating test.
6. **Validity and scope statement** – confounding factors, boundary conditions, claim labels (benchmark-supported vs. inferred vs. speculative).

## Validation Gates

- **Gate 1 (Observable):** Is the signature reproducible across independent diagnostics?
- **Gate 2 (Hypothesis):** Does each candidate predict a distinctive, non-generic imprint?
- **Gate 3 (Model):** Is the baseline preserved outside the target regime, and can the method resolve the claimed feature?
- **Gate 4 (Comparison):** Are multiple references, probes, or simulation suites consulted?
- **Gate 5 (Robustness):** Are conclusions stable under nuisance variations, resolution changes, and data splits?
- **Gate 6 (Claim):** Are residuals explained, extrapolation boundaries stated, and priors prevented from driving the result?

## Claim Boundaries

- Distinguish source-paper methodological patterns from new agent inferences.
- Do not treat single-study results as field-wide consensus.
- Limit claims to regimes where both the physics model and analysis method are reliable.
- Separate population-level constraints from individual-object or rare-event viability claims.
- Mark speculative extensions clearly; do not present model agreement as proof of a mechanism when degeneracies remain plausible.

## Failure Modes

- **Transition-scale mismatch:** Large residuals where modeling terms cross over without a mechanistic explanation.
- **Component misidentification:** Dominant signal attributed to the wrong physical component.
- **Nuisance mimicry:** Target signature reproduced by unmodeled astrophysics, selection effects, or instrumental systematics.
- **Method-bound evidence:** Conclusion depends on a single code, solver, dataset, or pipeline.
- **Overfitting to ratio observables:** Differential diagnostics tuned to suppress shared errors without validating absolute predictions.
- **Extrapolation beyond validity:** Claims extended to regimes dominated by unmodeled baryonic physics, nonlinear couplings, or uncertain early-Universe assumptions.
- **Prior-driven constraints:** Confidence regions that are artifacts of prior boundaries or unstable parameter regimes.

## Validity Checks

- **Component choice:** Is the modeled variable expected to preserve stable scaling relations?
- **Baseline comparability:** Are perturbed and baseline cases matched on shared background assumptions?
- **Scale boundaries:** Are claims limited to regimes where the model has been checked?
- **Simulation limitations:** Are resolution, finite volume, shot noise, cosmic variance, and initial-condition effects considered?
- **Astrophysical systematics:** Could feedback, selection, or baryonic processes mimic the proposed signal?
- **Statistical validity:** Are uncertainties, covariance, look-elsewhere effects, and multiple-testing issues stated?
- **Reproducibility:** Are model ingredients, comparison files, assumptions, and random seeds documented?
- **Mechanism specificity:** Does the proposed observable require the target mechanism, or could a competitor produce the same pattern?
- **Solver awareness:** Can the chosen method resolve the fields, derivatives, or structures needed by the mechanism?

## Provenance

- Synthesized from cluster 1 / subcluster 1.1 (observable-driven mechanism discovery and validation).
- Derived from source skills: massive-neutrino-cosmology-research-workflow; cosmology-pbh-thermal-history-exploration; fuzzy-dark-matter-research-workflow; cmb-constrained-cosmological-exploration; cosmology-rsd-growth-inference; multi-scale-synthetic-observable-research; pta-cross-analysis-research-design; cosmic-reionization-research-workflow.
- Methodological patterns were abstracted; no paper-specific numerical parameters, conclusions, or operational protocols were retained.
