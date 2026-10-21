---
name: sci-fusion-magnetic-confinement-mechanism-discovery-wor-d0618703
description: A reusable end-to-end workflow for turning anomalous observations or performance gaps in magnetically confined plasmas into ranked mechanism hypotheses, controlled validation plans, and evidence-bound conclusions.
scienceevolve-title: "Magnetic confinement fusion · magnetic confinement mechanism discovery workflow"
scienceevolve-area: magnetic-confinement-fusion
---

# Purpose

Use this workflow to transform anomalous observations, confinement gaps, or counterintuitive responses in magnetically confined plasmas into structured mechanism hypotheses and staged validation plans. It guides hypothesis generation, controlled comparison design, artifact screening, and evidence-bound iteration without prescribing operational procedures.

# When to use

- When a user asks to propose new research questions about transport, stability, confinement limits, or topology-plasma interactions.
- When an observation appears inconsistent with baseline expectations and competing mechanisms must be discriminated.
- When designing non-operational experiments or simulations to test causal mechanisms rather than confirm preferences.
- When iterating a research portfolio based on discrepancies between theory, simulation, and measurement.

Do not use for operational execution, hazardous procedures, or domains outside magnetic confinement fusion and related complex plasma systems.

# Inputs required

- **Target system class**: confinement concept and regime description at a non-operational level.
- **Observation or gap**: the anomalous response, performance limit, or boundary transition to explain.
- **Baseline expectation**: accepted model, scaling law, or theoretical prediction against which the anomaly is judged.
- **Candidate mechanisms**: plausible physical drivers or a request to generate them.
- **Available diagnostics / simulations**: profile, fluctuation, transport, stability, radiation, or synthetic diagnostic capabilities.
- **Constraints**: safety, compliance, access, computational, or institutional boundaries.

If inputs are missing, state assumptions explicitly and produce a minimal validation plan that can reduce uncertainty.

# Core Workflow

1. **Frame the gap and baseline**
   - State the observable anomaly and the baseline expectation.
   - Separate the target signal from known nuisance channels (e.g., boundary effects, calibration drift, impurity effects).
   - *Decision gate*: If the observation cannot be distinguished from baseline uncertainty or artifact, stop and refine inputs or diagnostics.

2. **Generate mechanism hypotheses**
   - For each candidate mechanism, define a causal chain: driver → mediating variable → physical response → predicted observable signature.
   - State a falsifier: what observation would make the mechanism unlikely.
   - Assign evidence strength (strong / moderate / weak / speculative), list key assumptions, and identify failure modes.
   - Rank hypotheses by discriminability, feasibility, and decision value.
   - *Decision gate*: If no hypothesis is falsifiable with available means, stop and redesign scope or required measurements.

3. **Design controlled validation**
   - Define independent variables (e.g., configuration, regime, perturbation class) and dependent variables (e.g., profile evolution, loss channel, stability indicator).
   - Specify controls:
     - **Baseline**: nominal state for comparison.
     - **Strong control**: varies the suspected driver while holding correlated factors fixed.
     - **Negative control**: regime where the mechanism should be absent or uncorrelated.
     - **Positive control**: known benchmark that validates the measurement chain.
     - **Artifact control**: test for diagnostic drift, equilibrium shifts, or background effects.
   - Pre-register evaluation metrics and decision thresholds before interpreting results.
   - Define stop conditions: ambiguous diagnostics, unresolved confounders, safety boundary reached, or non-discriminating data.
   - *Decision gate*: If controls cannot isolate the mechanism, pause and add ablation cases or tighten constraints.

4. **Collect evidence and screen artifacts**
   - Gather data or simulation outputs with documented provenance.
   - Screen for artifacts: calibration, synchronization, background subtraction, coordinate mapping, non-stationarity, and reconstruction uncertainty.
   - *Decision gate*: If artifacts cannot be ruled out, stop causal interpretation and return to screening or redesign.

5. **Discriminate mechanisms**
   - Compare observed sign, timing, spatial localization, and regime dependence against each hypothesis prediction.
   - Test temporal ordering before assigning causality.
   - Quantify uncertainty from diagnostics, model inputs, and boundary conditions.
   - Check whether results reproduce across comparable cases or ensembles.
   - *Decision gate*: If results are ambiguous, controls fail, or a confounder dominates, flag unresolved, split the hypothesis, and specify the next discriminating test.

6. **Iterate the hypothesis portfolio**
   - **Promote** hypotheses with reproducible, cross-checked signatures.
   - **Weaken** hypotheses contradicted by controls or negative-control results.
   - **Split** hypotheses if different regimes show distinct causal paths.
   - **Pause** routes with structural ambiguity or insufficient diagnostics.
   - **Abandon** routes repeatedly contradicted by independent evidence.
   - *Iteration rule*: If a hypothesis survives, design an independent validation case before extrapolating. If it fails, preserve the negative result and identify which assumption broke.

7. **Finalize claim boundaries**
   - Label each conclusion as observed, inferred, or speculative.
   - State extrapolation limits: regime, scale, configuration, and diagnostic coverage.
   - Document remaining competing explanations and uncertainty intervals.
   - *Stop condition*: Do not generalize to reactor-relevant or safety-critical claims without independent validation and uncertainty analysis.

# Output Format

Return the following sections:

1. **Research objective**: one sentence stating the target question.
2. **Mechanism map**: table with candidate mechanism, predicted signature, key assumption, and falsifier.
3. **Hypothesis portfolio**: ranked list with evidence strength, assumptions, failure modes, and minimum viable validation.
4. **Validation plan**: variables, controls, diagnostics or simulations, evaluation metrics, and stop conditions.
5. **Analysis plan**: timeline, artifact screening, model comparison, uncertainty treatment, and decision rules.
6. **Iteration plan**: how results update, weaken, reject, or split hypotheses.
7. **Validity and safety check**: confounders, reproducibility needs, extrapolation boundaries, and compliance constraints.

# Validation Gates

- **Pre-registration**: Metrics and decision thresholds are defined before evidence is interpreted.
- **Control adequacy**: Baseline, strong, negative, positive, and artifact controls are present and matched.
- **Diagnostic integrity**: Key observables are directly measured, synchronized, and cross-checked.
- **Reproducibility**: Patterns recur across repeated cases, configurations, or simulation ensembles.
- **Uncertainty quantification**: Intervals, sensitivity tests, and model-input constraints are reported.
- **Safety and compliance**: The plan remains within authorized, non-operational research-design boundaries.

# Claim Boundaries

- **Observed**: directly measured quantities with stated uncertainty.
- **Inferred**: mechanism interpretations supported by converging diagnostics and controls.
- **Speculative**: agent-generated extrapolations or analogies requiring new validation.
- Do not treat single-device, single-simulation, or single-paper results as field-wide consensus.
- Mark all extrapolations with the specific conditions that must hold for transfer to other regimes or scales.

# Failure Modes

- **Artifact-driven false positive**: diagnostic drift, calibration error, reconstruction bias, or non-stationarity mimics a mechanism.
- **Confounded mechanism**: a correlated driver (e.g., impurity content, heating profile, boundary effects) produces the same signature.
- **Model breakdown**: baseline or reduced model fails in the tested regime, making anomaly definition unreliable.
- **Scale mismatch**: mechanism validated in one regime does not transfer to higher pressure, longer pulse, or different configuration without new evidence.
- **Unsupported extrapolation**: conclusions generalized beyond the tested boundary conditions.
- **Selection bias**: paused or negative results omitted from the portfolio update.

# Validity Checks

Before finalizing any plan or interpretation, verify:

- **Confounding**: Could nuisance variables, overlapping mechanisms, or boundary effects explain the result?
- **Temporal validity**: Does the proposed precursor occur before the transition, not after?
- **Specificity**: Does the signature distinguish the proposed mechanism from alternatives?
- **Statistical validity**: Are uncertainty intervals, sensitivity tests, and repeated measurements included?
- **Model validity**: Are inputs constrained by measurements rather than tuned post-hoc?
- **Boundary validity**: Are claims limited to the tested system class, regime, and diagnostic coverage?
- **Evidence labeling**: Are paper-supported patterns, established literature, and new inferences clearly separated?

# Provenance

Derived from cluster **12.1** (`stellarator-plasma-transport-fusion-mechanism-discovery-workflow`), synthesizing the shared workflow route across source skills:

- `stellarator-confinement-research-design` (10.1063_1.4983629)
- `optimized-stellarator-exploration` (10.1063_1.5098761)
- `fusion-plasma-research-opportunity-design` (10.1063_5.0223339)
- `tokamak-perturbative-transport-exploration` (10.1007_s41614-022-00071-7)
- `stellarator-electron-heated-transport-research` (10.1088_1741-4326_ac1653)
- `magnetic-confinement-fusion-research-workflow` (10.1088_0741-3335_28_2_001)
- `stellarator-density-limit-research-design` (10.1088_0741-3335_42_6_301)
- `stellarator-topology-self-healing-research` (10.1103_physrevlett.87.135002)
