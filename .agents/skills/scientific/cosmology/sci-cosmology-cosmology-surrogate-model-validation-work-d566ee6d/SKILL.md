---
name: sci-cosmology-cosmology-surrogate-model-validation-work-d566ee6d
description: Design and execute reusable surrogate-assisted validation workflows for expensive computational cosmology and astrophysics models, enabling iterative hypothesis generation, controlled model comparison, and evidence-aware inference.
scienceevolve-title: "Galaxy, cosmology, and simulations · cosmology surrogate model validation workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

# Purpose

Help an agent design an end-to-end workflow for validating and comparing expensive computational models in cosmology and astrophysics using machine-learning surrogates. The workflow supports hypothesis generation, ensemble design, surrogate training, multi-statistic validation, controlled model comparison, and iterative refinement without treating any single study as field-wide consensus.

# When to use

Use this skill when:

- The primary model or simulation is too expensive to evaluate exhaustively.
- The goal is to compare multiple model families, physical prescriptions, or parameter effects on shared testbeds.
- Outputs can be converted into stable, reproducible training targets for emulation.
- The agent must propose new hypotheses and experimental designs rather than summarize existing results.

Do not use this skill when direct simulation is already cheap, when the task is only literature summarization, or when no reproducible target quantity can be defined.

# Inputs required

Before generating a study plan, request or infer:

- **Research domain and model family:** the simulation code, physical regime, or computational model type.
- **Scientific quantity of interest:** the observable-like output, scaling relation, summary statistic, or mechanistic diagnostic to be predicted.
- **Candidate parameters:** scientific parameters, subgrid or closure parameters, numerical parameters, and known constraints.
- **Existing evaluations:** available simulations, benchmark runs, observational comparisons, or analytic limits.
- **Validation assets:** held-out runs, independent data, simplified test cases, or known limiting behavior.
- **Decision context:** whether the surrogate will support exploration, sensitivity analysis, calibration, inverse inference, or hypothesis prioritization.

If any input is missing, state the gap and propose the smallest information request needed to proceed.

# Core Workflow

Execute the following ordered route, pausing at each decision gate before advancing.

1. **Frame the bottleneck and target relation**
   - Define the scientific question and the observable or summary statistic that encodes the answer.
   - Identify why direct evaluation is expensive and whether a surrogate is justified.
   - **Gate 1 — Feasibility:** Stop if the target quantity is ill-defined, non-reproducible, or direct evaluation is already cheap enough for exhaustive exploration.

2. **Design the training ensemble and sampling strategy**
   - Select a space-filling or stratified design that covers the intended scientific domain without over-clustering in familiar regions.
   - Explicitly separate scientific parameters from numerical or implementation parameters.
   - Reserve held-out validation points and include benchmark or limiting cases with known behavior.
   - Define controls: baseline, negative, positive, and robustness controls.

3. **Represent inputs and outputs**
   - Distinguish object-level or measurement-level variables from model parameters.
   - Choose transformations justified by smoothness, scale, or interpretability.
   - Decide whether the surrogate will be discriminative (emulator), generative (sampler), or hybrid based on downstream inference needs.

4. **Train and validate the surrogate**
   - Fit the surrogate on the training ensemble.
   - Evaluate interpolation performance on held-out runs; inspect residuals by parameter region, target regime, and object class.
   - Assess uncertainty calibration and check for memorization, mode collapse, or insufficient diversity in generative cases.
   - Compare predictions against independent benchmarks and analytic limits.
   - **Gate 2 — Validation:** Stop if held-out error exceeds the decision-relevant threshold, systematic residuals dominate, or training coverage is insufficient for the intended claim.

5. **Compare model families on a shared testbed**
   - Evaluate competing prescriptions (e.g., baseline, active-component, extended) using identical mocks, summary statistics, covariance treatment, and fitting protocols.
   - Diagnose failures by scale, regime, tracer property, and nuisance-parameter degeneracy rather than by aggregate fit alone.
   - Introduce observational or survey effects differentially only after ideal-data performance is understood.

6. **Generate and rank hypotheses**
   - For each candidate mechanism, state the predicted change in the target relation (slope, normalization, scatter, or shape).
   - Label evidence strength as **high**, **medium**, **low**, or **speculative**.
   - List key assumptions, alternative explanations, and minimal validation tests.
   - **Gate 3 — Discrimination:** Reject or defer hypotheses that cannot distinguish physical signals from selection effects, numerical artifacts, or parameter confounding.

7. **Iterate with targeted high-fidelity evaluations**
   - Add new simulations or direct evaluations where uncertainty is highest, disagreement is largest, or scientific importance is greatest.
   - Retrain and reassess the trust region.
   - Update evidence strength, assumptions, and failure modes after each cycle.
   - **Stop condition:** Halt if new evaluations do not reduce decision-relevant uncertainty, if systematic residuals persist across retrainings, or if the target parameters are not identifiable from available data.

8. **Define the trust region and finalize outputs**
   - State the interpolation domain where the surrogate is decision-ready.
   - Mark extrapolation regions as not decision-ready.
   - Document limitations, confounders, validation design, and reproducibility requirements.

# Output Format

Return a structured research plan containing:

1. **Research question** — concise statement of the new question.
2. **Scientific quantity of interest** — target output, why it is measurable, and how it connects to the mechanism.
3. **Candidate parameters and mechanisms** — table with parameter, expected effect, mechanism, interaction risk, and evidence strength.
4. **Minimal viable study** — training design, validation design, controls, and trust region.
5. **Hypothesis set** — each hypothesis with evidence strength, key assumptions, predicted signature, minimal validation, and possible failure modes.
6. **Analysis plan** — validation metrics, parameter sweeps, benchmark comparisons, and uncertainty checks.
7. **Iteration plan** — criteria for adding evaluations, updating the surrogate, and stopping.
8. **Validity and ethics checks** — confounders, reproducibility requirements, boundary conditions, and model-dependence warnings.

# Validation Gates

Before advancing between stages or presenting conclusions, verify:

- **Coverage:** The training ensemble covers the region needed for the claim.
- **Interpolation vs. extrapolation:** The proposed use lies inside the training domain.
- **Parameter confounding:** Scientific parameters are not mixed with numerical or implementation parameters.
- **Measurement stability:** Object selection, preprocessing, and derived statistics are reproducible.
- **Residual structure:** Errors do not cluster by regime, parameter, object class, or scale.
- **Uncertainty calibration:** Uncertainty estimates are supported by held-out behavior.
- **Benchmark consistency:** Predictions agree with independent data, analytic limits, or established test cases.
- **Model discrepancy:** The surrogate is not accurately reproducing an incomplete or misspecified model without warning.
- **Reproducibility:** Data splits, transformations, model choices, and validation criteria are documented.

# Claim Boundaries

- Distinguish validated surrogate behavior from extrapolated claims about new physics, new surveys, or new analysis methods.
- Label evidence as **source-supported**, **target-validated**, **assumption-sensitive**, or **speculative**.
- Mark extrapolation regions as not decision-ready.
- Treat calibrated parameters and surrogate predictions as model-dependent evidence, not as definitive physical truth.
- Present paper-supported method patterns separately from agent-inferred hypotheses for the new problem.

# Failure Modes

- Emulator or surrogate error dominates observational or theoretical uncertainty.
- Surrogate preserves common structures but misses rare or tail structures needed for inference.
- Large-scale and small-scale fidelity require incompatible design choices.
- Generated samples show memorization, repeated modes, or lack of diversity.
- Conditioning variables are not reproduced across bins or regimes.
- Parameter confounding between scientific and numerical parameters produces spurious sensitivity.
- Circular use of the same observable for calibration and cosmological inference.
- Selection effects, survey geometry, or masking mimic physical signals.
- Covariance mismatch or fitting-range bias drives apparent model performance.
- Conclusions depend sharply on arbitrary weighting choices or a single diagnostic.

# Validity Checks

Before finalizing any research plan or analysis, confirm:

- **Confounding:** Apparent signals are not caused by selection effects, finite sample size, resolution limits, or object-definition changes.
- **Shared protocol:** All competing models are evaluated on the same data, statistics, covariance treatment, and parameter policy.
- **Scale validity:** Claimed valid regimes are supported by parameter recovery and residual checks, not only visual agreement.
- **Posterior stability:** Results do not change sharply under reasonable nuisance priors, scale cuts, or covariance estimates.
- **Identifiability:** Fitted parameters are constrained by data rather than prior bounds or emulator artifacts.
- **Control performance:** Positive, negative, and stress controls behave as expected.
- **Likelihood robustness:** Conclusions do not depend on arbitrary weighting choices or a single summary statistic.
- **Boundary conditions:** Claims are limited to the sampled range of scale, parameter space, and background model.
- **External validity:** Results from one mock family or survey design are not presented as universal domain consensus.
- **Reproducibility:** Analysis steps, fitting procedures, model versions, and data provenance are documented.

# Provenance

- Synthesized from cluster 33, subcluster 33.0.
- Source skills: 10.21105_joss.04240, 10.3929_ethz-b-000318965, 10.1088_1475-7516_2013_12_012, 10.1111_j.1365-2966.2005.08964.x, 10.1051_0004-6361_201935973, 10.1093_mnras_stu2460, 10.1146_annurev-astro-081811-125502, 10.1111_j.1365-2966.2008.14029.x.
