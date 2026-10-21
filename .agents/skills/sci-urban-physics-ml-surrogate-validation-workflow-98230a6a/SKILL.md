---
name: sci-urban-physics-ml-surrogate-validation-workflow-98230a6a
description: Reusable end-to-end workflow for designing machine-learning-assisted validation studies that compare physics-informed and data-driven models against controlled baselines to discriminate mechanisms and bound claims.
scienceevolve-title: "Urban hazard resilience · physics ml surrogate validation workflow"
scienceevolve-area: urban-hazard-resilience
---

# Purpose

Guide agents in designing transferable, end-to-end research plans that use machine learning to validate, compare, and discriminate physical mechanisms in complex systems. The workflow supports hypothesis generation, controlled experimental design, surrogate model benchmarking, physical-consistency analysis, and iterative claim refinement without treating any single study as universal truth.

# When to use

Use this skill when a user needs to:
- Validate physics-informed, surrogate, or data-driven models against strong baselines in physical-system research.
- Compare competing mechanisms across scenarios, scales, or configurations.
- Design simulation- or observation-based studies for domains such as seismic, wind, hydraulic, or structural systems.
- Iterate on model credibility, uncertainty, and generalization boundaries.

Do not use this skill for operational deployment, emergency response, safety-critical engineering certification, or as a substitute for qualified domain review.

# Inputs required

Before producing a research plan, collect or infer:

- **Target system class** and dominant response or failure modes.
- **Research gap** or extrapolation boundary motivating the study.
- **Data sources**: simulation, observation, laboratory, or hybrid data with provenance and quality metadata.
- **Candidate model families**: physics-informed, data-driven, surrogate, and simple interpretable baselines.
- **Hypothesized mechanisms** and interaction pathways to be tested.
- **Evaluation goals**: predictive accuracy, physical plausibility, uncertainty calibration, decision relevance, computational efficiency, and robustness.
- **Constraints**: computational budget, data access limits, safety and ethics boundaries, and intended extrapolation domain.

# Core Workflow

Follow this ordered route, applying decision gates and iteration/stop conditions at each stage.

1. **Frame the gap and bound the domain**
   - Identify the mismatch between existing model evidence and the new problem’s scale, physics, or configuration.
   - Define the system boundary, decision context, and explicit exclusions.
   - *Stop condition*: Halt if the gap cannot be expressed as a falsifiable mechanism question.

2. **Generate mechanism-grounded hypotheses**
   - Translate the gap into testable causal claims linking physical drivers to system responses.
   - For each hypothesis specify: mechanism chain, evidence strength (low/medium/high), key assumptions, predicted diagnostic signature, and failure modes.
   - Prioritize hypotheses that isolate a single pathway and are falsifiable with available data.

3. **Design controlled validation**
   - Define reference and contrast scenarios that vary one suspected mechanism at a time while holding others constant.
   - Establish controls:
     - **Negative control**: mechanism absent or weakened.
     - **Positive control**: mechanism pronounced.
     - **Strong baseline**: current best practice or conventional model.
     - **Ablation control**: proposed model with the target component removed.
   - Specify independent, mediating, and dependent variables; define data splits and counterfactual baselines that prevent leakage.
   - *Gate*: Redesign scope if controls are infeasible or baselines are undefined.

4. **Prepare data and build candidate models**
   - Curate or generate input-response pairs from validated sources; document provenance, preprocessing, and random seeds.
   - Train at least three model families with different inductive biases (e.g., physics-informed, flexible data-driven, simple interpretable).
   - Reserve a held-out test set that reflects the intended deployment boundary and excludes data used for model selection.

5. **Execute comparative evaluation**
   - Evaluate all candidates on identical held-out data using multiple complementary metrics.
   - Compare active scenarios against counterfactual baselines.
   - Inspect residuals and error distributions by regime, location, event type, or variable region.
   - *Gate*: If leakage controls fail or baseline comparisons are unfair, stop and redesign.

6. **Discriminate mechanisms**
   - Use ablation studies and controlled contrasts to attribute performance gains to the hypothesized mechanism rather than implementation artifacts, data leakage, or confounding.
   - Check whether the dominant response or failure mode changes as predicted.
   - *Gate*: If ablations do not isolate the claimed benefit, reformulate the mechanism hypothesis before proceeding.

7. **Assess uncertainty and robustness**
   - Quantify aleatory and epistemic uncertainty.
   - Test sensitivity to boundary conditions, resolution, domain extent, distribution shifts, and extreme events.
   - Verify that conclusions survive alternative model settings and scenario heterogeneity.

8. **Iterate or stop**
   - *Continue*: If results partially support a hypothesis but confounders or boundary effects remain unresolved, refine controls and sample weak regions.
   - *Redesign*: If uncertainty is uncalibrated, the mechanism is confounded, or performance only appears on narrow splits, redesign the experiment.
   - *Stop*: When evidence is sufficient to support bounded claims, when added complexity no longer improves decision value, or when the hypothesis is falsified.

# Output Format

Return a structured research plan containing:

1. **Research question and gap statement**
2. **Mechanism map and hypothesis table** — evidence strength, key assumptions, predicted signatures, failure modes
3. **Experimental design** — scenarios, variables, controls, baselines, sampling strategy, and stop conditions
4. **Model comparison protocol** — candidate families, data splits, evaluation metrics, and fairness checks
5. **Analysis plan** — residual inspection, ablation logic, physical-consistency checks, uncertainty quantification
6. **Iteration rules** — triggers for updating, weakening, or rejecting hypotheses
7. **Validity report** — confounders, reproducibility steps, boundary conditions, and safety or ethics notes

# Validation Gates

- **Leakage control**: No future information, post-event labels, or intervention outcomes leak into training or validation splits.
- **Baseline fairness**: All candidates share comparable features, tuning effort, and evaluation logic.
- **Control strength**: Negative and positive controls must actually isolate or stress the target mechanism.
- **Physical plausibility**: Predictions respect known conservation principles, continuity, and boundary behavior.
- **Statistical validity**: Repeated evaluations, uncertainty intervals, or resampling are used where training or sampling is stochastic.

# Claim Boundaries

- Label every conclusion as *paper-supported*, *cross-study-supported*, or *agent-inferred*.
- Restrict claims to the tested system class, hazard or loading regime, data distribution, and spatial/temporal scale.
- Do not present research evidence as operational design approval, emergency guidance, or field-wide consensus.
- Separate comparative mechanism claims from predictive claims for untested domains.

# Failure Modes

- **Overfitting**: Large generalization gap between training and held-out performance.
- **Data leakage**: Duplicated cases, preprocessing leakage, or future-feature inclusion.
- **Confounding**: Uncontrolled environmental, geometric, or loading variables distort comparisons.
- **Mechanism misattribution**: Insufficient ablation or weak baselines falsely credit a proposed mechanism.
- **Unsafe extrapolation**: Claims extended beyond the sampled design space or validated variable range.
- **Uncertainty underestimation**: Overstating confidence in safety-relevant or decision-critical regions.
- **Metric masking**: Aggregate accuracy hiding poor performance in critical regimes or subpopulations.

# Validity Checks

- **Confounding**: Verify that sensor density, event severity, material properties, or boundary conditions are not unevenly distributed across comparison groups.
- **Reproducibility**: Document data splits, preprocessing rules, model definitions, scenario parameters, and random seeds.
- **Boundary conditions**: Test edge cases, sparse-data regions, extreme events, and distribution shifts.
- **Interpretability**: Treat feature attributions and sensitivity outputs as hypothesis generators, not causal proof.
- **Operational safety**: Frame outputs as research planning, not direct engineering instructions or emergency actions.
- **Ethics and governance**: Consider data privacy, public safety implications, equitable risk distribution, and institutional review requirements.

# Provenance

- Synthesized from cluster **6.1** (machine-learning-assisted model validation and comparison).
- Source skills: `physics-informed-water-digital-twin-research`; `modular-seismic-retrofit-research-design`; `offshore-wind-farm-wake-exploration`; `coupled-system-seismic-fragility`; `seismic-surrogate-modeling-workflow`; `seismic-ml-surrogate-design-exploration`; `seismic-response-forecasting-agent`; `probabilistic-surrogate-spatial-risk-exploration`.
- Preserves method-level patterns without importing paper-specific parameters, numerical results, or operational protocols.
