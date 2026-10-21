---
name: sci-urban-ml-surrogate-model-validation-workflow-fe7165b2
description: Guide agents in designing reusable, evidence-bounded research plans that use machine-learning surrogates to accelerate or augment expensive physics-based evaluators through staged validation, controlled comparison, and iterative refinement.
scienceevolve-title: "Urban hazard resilience · ml surrogate model validation workflow"
scienceevolve-area: urban-hazard-resilience
---

# Purpose

Guide agents in creating transferable research plans for machine-learning-assisted model validation and comparison. The workflow helps formulate mechanism-grounded hypotheses, design controlled experiments with strong baselines, validate surrogate credibility against expensive evaluators, and bound claims by evidence strength and domain.

# When to use

Use this skill when:
- A user asks how to improve, replace, or augment an expensive physics-based evaluator (simulation, experiment, or high-fidelity model) with a machine-learning surrogate.
- A study must compare model fidelities, architectures, or correction strategies under matched conditions.
- Existing results show a fidelity gap, and a plausible mechanism suggests a targeted surrogate or hybrid improvement.
- The task is to design a research plan, validation workflow, or hypothesis set, not to provide operational deployment settings, safety-critical engineering approvals, or field implementation instructions.

Do not use this skill as a substitute for domain-specific certification, safety review, or operational decision-making.

# Inputs required

Before proposing a study, ask for or infer:

- **Target system class**: physical domain, spatial/temporal scales, dominant regimes, and boundary conditions.
- **Expensive evaluator**: high-fidelity simulator, experimental protocol, or trusted reference data, including known limitations and credibility evidence.
- **Surrogate candidate**: model family, intended acceleration, and how it will encode physical structure or spatial/temporal dependencies.
- **Decision context**: screening, optimization, prediction, uncertainty quantification, or mechanism discovery.
- **Candidate mechanisms**: physical pathways, structural biases, or process stages that may explain evaluator error or surrogate failure.
- **Response metrics**: field-level errors, aggregate performance, stability indicators, robustness scores, and computational cost.
- **Evidence available**: prior studies, benchmark cases, validation data, and known confounders.
- **Constraints**: acceptable fidelity, data access, reproducibility requirements, computational budget, and extrapolation boundaries.

# Core Workflow

Follow this ordered end-to-end route. Do not skip decision gates.

1. **Frame the fidelity gap and decision objective**
   - State the cost-accuracy tension between the expensive evaluator and the proposed surrogate.
   - Define the scientific or design decision the surrogate must support.
   - Document the intended operating domain and known boundaries.

2. **Map mechanisms and variables**
   - List trusted physical constraints and known evaluator assumptions.
   - Identify unknown dynamics, missing mechanisms, or suspected structural biases.
   - Mark variables as observed, simulated, inferred, or uncertain.
   - **Decision gate**: If the bottleneck cannot be expressed as a surrogate-accelerated evaluation with identifiable mechanisms, stop and restate the problem.

3. **Generate mechanism-grounded hypotheses**
   - Formulate falsifiable claims about why the surrogate (or a correction to it) should improve upon the baseline.
   - For each hypothesis record: evidence strength (strong / moderate / weak), key assumptions, predicted observation, failure mode, and domain boundary.
   - **Decision gate**: If no hypothesis can be falsified with available data and controls, redesign the scope before proceeding.

4. **Design staged validation experiments**
   - Define independent variables (model variant, input regime, sampling strategy), dependent variables (prediction error, residual structure, cost), and confounders.
   - Include:
     - **Baseline**: uncorrected lower-fidelity model or standard surrogate.
     - **Candidate**: the targeted improvement tied to the diagnosed mechanism.
     - **Strong control**: best available standard method under matched conditions.
     - **Positive control**: a case where the mechanism is expected to produce a clear signal.
     - **Negative control**: a case where the mechanism should be weak or absent.
     - **Ablation**: removal of one component at a time to isolate mechanism contribution.
   - Pre-specify metrics and stopping conditions before execution.
   - **Decision gate**: If controls cannot isolate the proposed mechanism, redesign the experiment matrix.

5. **Prepare data and establish evaluator hierarchy**
   - Audit data sources for coverage, resolution, missingness, leakage risks, and alignment.
   - Validate the expensive evaluator against credible measurements or benchmarks when possible.
   - Split data by regime, event, or spatial unit; avoid random leakage across correlated samples.
   - **Decision gate**: If simulator credibility is undocumented or data leakage is detected, halt until resolved.

6. **Train and diagnose the surrogate**
   - Train the surrogate on validated high-fidelity labels.
   - Inspect spatial or temporal error maps, residuals near boundaries/decision thresholds, and physical plausibility.
   - Check for instability, drift, or violation of known constraints.
   - **Decision gate**: If the surrogate fails baseline sanity checks or violates physical constraints without explanation, stop and revise model form, features, or training regime.

7. **Execute controlled comparisons**
   - Run baseline, candidate, and all controls under matched computational budgets, input conditions, and evaluation protocols.
   - Record training stochasticity with repeated runs or seeded protocols where applicable.

8. **Analyze by mechanism and regime**
   - Compare staged conditions separately (baseline, best-case, learned, coupled).
   - Separate mean and worst-case errors; inspect spatial/temporal concentration of errors.
   - Evaluate ablation contributions, robustness across regimes, and stability under perturbation.
   - **Decision gate**: If improvement disappears under ablation, strong controls, or out-of-sample regimes, reject or narrow the hypothesis before iterating.

9. **Iterate and update**
   - If the candidate improves only under narrow conditions, narrow the claim boundary.
   - If the surrogate shows systematic bias in critical regions, refine representation, sampling, or constraints.
   - If marginal information gain is low or validation error meets pre-specified targets, stop.
   - If extrapolation is required beyond the validated domain, downgrade evidence strength and require independent validation.
   - **Stop conditions**:
     - Validation performance is worse than simple baselines without a defensible reason.
     - Improvements disappear under cross-validation, ablation, or uncertainty tests.
     - The model improves only on monitored/training-like points while degrading elsewhere.
     - Repeated runs show unexplained high variance.

10. **Bound claims and document provenance**
    - Label each conclusion as `source-supported`, `cross-study-supported`, or `agent-inferred`.
    - State domain boundaries, extrapolation limits, and conditions where the claim should weaken.
    - Package reproducibility notes: data splits, random seeds, model versions, preprocessing, and evaluation scripts.

# Output Format

Each use of this skill should produce:

1. **Research question**: one concise, mechanism-grounded question.
2. **Evidence map**: source-supported observations, cross-study support, and agent-inferred assumptions.
3. **Hypotheses table**: at least three hypotheses with evidence strength, key assumptions, predicted observation, failure mode, and boundary condition.
4. **Experimental design**: variables, controls, baselines, metrics, case-variation strategy, and stopping conditions.
5. **Analysis plan**: staged comparisons, error metrics, ablation checks, stability diagnostics, and generalization checks.
6. **Iteration rules**: how results will update, narrow, or reject each hypothesis.
7. **Validity report**: reproducibility risks, statistical limits, boundary conditions, and safety or ethics constraints.
8. **Claim boundary statement**: what is verified, what is inferred, and what remains unvalidated.

# Validation Gates

Before advancing past each major stage, confirm:

- **Problem framing**: The fidelity gap is defined as a cost-accuracy tension with a clear decision objective.
- **Hypothesis quality**: Each hypothesis is falsifiable and tied to a mechanism, not a generic performance claim.
- **Control adequacy**: Experiments include baseline, strong control, positive control, negative control, and ablation.
- **Data integrity**: Splits prevent leakage; validation data are independent from training labels; evaluator credibility is documented.
- **Surrogate plausibility**: Predictions respect known physical constraints where applicable; errors are inspected spatially or temporally, not only as aggregates.
- **Comparison fairness**: Baseline and candidate use matched budgets, inputs, tuning effort, and evaluation splits.
- **Mechanism isolation**: Ablation or mechanism controls confirm that improvement comes from the intended source.
- **Robustness**: Performance is checked across regimes, boundary conditions, and held-out cases, not only central scenarios.

# Claim Boundaries

- Distinguish **interpolation** (within validated domain) from **extrapolation** (beyond tested regimes).
- Distinguish **source-supported** findings from **agent-inferred** hypotheses.
- Do not present one study’s results as domain consensus.
- Limit claims to the structural class, process chain, hazard range, and data regime tested.
- When communicating to stakeholders, accompany predictions with uncertainty and explicit boundaries.

# Failure Modes

- **Surrogate overfitting**: The model memorizes training evaluators but fails on held-out regimes or spatial/temporal extrapolation.
- **Control mismatch**: Baseline and candidate are compared under unequal tuning, data, or computational budgets, producing spurious conclusions.
- **Data leakage**: Correlated samples cross training and validation splits, inflating apparent accuracy.
- **Confounding by context**: External conditions (boundary conditions, forcing, geometry) co-vary with the tested mechanism.
- **Metric misalignment**: Aggregate error improves while decision-critical regions or worst-case behavior degrades.
- **Coupling instability**: A correction that works in frozen evaluation destabilizes the coupled system.
- **False extrapolation**: Interpolation success is interpreted as evidence for untested domains.

# Validity Checks

Before finalizing any research proposal or result, check:

- **Confounding**: Are geometry, forcing, boundary conditions, or reference-model assumptions driving the result?
- **Reproducibility**: Are model assumptions, feature definitions, case splits, metric definitions, and reporting conventions sufficient for independent replication?
- **Statistical validity**: Are conclusions supported by enough independent cases, uncertainty estimates, and sensitivity checks?
- **Boundary conditions**: Does the claim specify where it should weaken or fail?
- **Mechanism specificity**: Does an ablation or control isolate the proposed mechanism?
- **Coupled validity**: Does the learned correction remain useful when the model updates its own state?
- **External validity**: Is the target system sufficiently similar to the evidence base, or is the claim only an analogy?
- **Physical consistency**: Do predictions preserve expected conservation, stability, or constitutive behavior where applicable?
- **Claim discipline**: Are source-supported findings distinguished from agent-inferred hypotheses?

# Provenance

This skill was synthesized from cluster `3` / subcluster `3.2` (machine-learning-assisted model validation and comparison). Source skills contributing to the merge include:

- `data-driven-wake-model-research-workflow`
- `ft-pinn-dynamic-system-exploration`
- `urban-flood-hybrid-modeling-research`
- `urban-flood-forecasting-research-workflow`
- `cfd-surrogate-wind-design-exploration`
- `seismic-fragility-active-learning-workflow`
- `seismic-physics-dnn-research-workflow`
- `wind-farm-wake-steering-research`

No specific paper conclusions, numerical results, or operational protocols are reproduced above.
