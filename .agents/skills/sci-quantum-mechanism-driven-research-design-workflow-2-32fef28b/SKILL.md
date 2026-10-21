---
name: sci-quantum-mechanism-driven-research-design-workflow-2-32fef28b
description: A reusable end-to-end workflow for proposing, validating, and iterating mechanism-driven scientific hypotheses across physical and engineered systems.
scienceevolve-title: "Quantum materials and condensed matter · mechanism driven research design workflow 2"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Guide an agent to transform a domain performance bottleneck or theoretical gap into a structured research program. The workflow moves from gap definition to falsifiable mechanism hypotheses, designs minimal viable validation with strong controls, analyzes results to separate mechanism signals from artifacts, and iterates based on explicit decision gates. It captures the abstract method pattern shared across quantum, plasma, materials, and classical wave systems without reproducing any specific paper conclusion or operational protocol.

# When to use

- When a user needs to propose new research questions in physical science or engineering domains where performance limits or theoretical gaps exist.
- When the task requires moving from an observed anomaly, effective-parameter mismatch, or performance ceiling to a causal mechanism hypothesis plus validation plan.
- When comparing competing mechanisms or architectures and requiring explicit evidence strength, failure modes, and iteration paths.
- When designing experiments or simulations that need causal isolation rather than black-box optimization.

# Inputs required

- **Target research question or performance bottleneck**: the system-level limitation or unexplained observation that motivates the study.
- **Baseline system or architecture**: the current standard, reference model, or control configuration against which candidates are judged.
- **Theoretical and empirical resources**: available models, prior data, simulation capabilities, diagnostic types, and known mechanism literature.
- **Platform constraints**: controllable variables, observable channels, resolution limits, and resource boundaries.
- **Safety and ethical boundaries**: non-operational risk limits, compliance requirements, and prohibitions on hazardous procedural detail.

# Core Workflow

1. **Gap Definition & Mechanism Decomposition**
   - Translate the observed bottleneck into a causal chain: control parameter → intermediate state → observable output.
   - Classify the gap as performance limitation, mechanism ambiguity, insufficient verification, or extrapolation uncertainty.
   - **Decision Gate 1 (DG1)**: Is the gap linked to a specific, testable intermediate process? If no, refine the question or stop.

2. **Candidate Hypothesis Generation**
   - Produce 2–4 mechanism hypotheses. Each must state: the intermediate process changed, the expected effect on observables, critical assumptions, and failure modes.
   - Annotate evidence strength (High / Medium / Low) and whether the inference derives from direct evidence, cross-system analogy, or theoretical extension.
   - **Decision Gate 2 (DG2)**: Can each hypothesis be falsified by at least one observable under the available platform? If no, redesign diagnostics.

3. **Minimal Viable Validation Design**
   - Select the smallest experimental or computational configuration that can simultaneously reveal the mechanism signature and the final output.
   - Define independent variables (mechanism switches, control parameters), dependent variables (mechanism signatures and performance metrics), and covariates (environmental, instrumental, and model-error sources).
   - Construct a control hierarchy:
     - **Baseline**: current standard or unmodified system.
     - **Negative control**: target mechanism absent or weakened.
     - **Positive control**: known signal confirming the diagnostic chain.
     - **Mechanism control**: only the target mechanism variable is altered; architecture and conditions are held constant.
   - Prescribe hard stop conditions: safety boundary reached, signal indistinguishable from negative control, baseline irreproducible, or model–data mismatch unexplained.
   - **Decision Gate 3 (DG3)**: Does the design isolate the target mechanism from known confounders? If no, add ablation controls or reduce complexity.

4. **Execution & Acquisition**
   - Run the validation suite (baseline, candidate, controls) under documented conditions.
   - Record raw data, calibration logs, environmental state, and processing parameters.
   - Abort if a stop condition is triggered; do not proceed to broader scans until DG3 is satisfied.

5. **Mechanism-First Analysis**
   - Verify the baseline behavior matches the reference model before interpreting candidate data.
   - Check for the mechanism-predicted intermediate state before attributing final-output changes to the mechanism.
   - Separate contributions: target mechanism, background processes, instrumental response, and model-form error.
   - Cross-validate across model hierarchies (e.g., reduced-order vs. high-fidelity) and multiple observables.
   - Report statistical and systematic uncertainties separately.
   - **Decision Gate 4 (DG4)**: Is the mechanism signal statistically distinguishable from the negative control and background? If no, classify as inconclusive and proceed to iteration.

6. **Conclusion Grading**
   - Assign one grade per hypothesis:
     - **Supported**: predicted intermediate and final signals appear, controls pass, models agree.
     - **Partially supported**: signal present but confounded, weaker than predicted, or model deviations are systematic.
     - **Not supported**: signal absent or opposite to prediction under valid baseline.
     - **Inconclusive**: data quality, calibration, or model mismatch prevents determination.
   - **Decision Gate 5 (DG5)**: Is the evidence sufficient to justify scope expansion (parameter scan, scale-up, or field translation)? If no, enter iteration.

7. **Iteration & Scope Control**
   - **If Supported**: introduce robustness checks (parameter sensitivity, perturbation, alternate platforms) before expanding scope.
   - **If Partially Supported**: diagnose the failure mode (hidden variable, model inadequacy, implementation bias), then return to Step 3 with a targeted minimal validation.
   - **If Not Supported**: preserve the null result, use it to bound or eliminate the mechanism, and return to Step 2 to generate alternatives.
   - **If Inconclusive**: improve resolution, reduce noise, or narrow the research question; return to Step 3.
   - **Decision Gate 6 (DG6)**: After each iteration, do the revised hypotheses produce new, distinguishable predictions? If no after two cycles, recommend termination or pivot to a different gap.

# Output Format

Each invocation must produce a structured research design document containing:

1. **Research Question**: one-sentence definition of the new problem and its bottleneck.
2. **Gap Analysis**: classification of the gap and why existing solutions are insufficient.
3. **Candidate Hypotheses**: 2–4 hypotheses, each with mechanism statement, evidence strength, critical assumptions, observable predictions, and failure modes.
4. **Validation Design**: minimal viable system, variable definitions, baseline/negative/positive/mechanism controls, stop conditions, and evaluation metrics.
5. **Analysis Plan**: baseline verification, contribution separation, cross-model validation, uncertainty quantification, and visualization strategy.
6. **Iteration Plan**: decision tree for supported, partially supported, not supported, and inconclusive outcomes.
7. **Validity & Safety Notes**: confounders, reproducibility requirements, extrapolation boundaries, and non-operational safety constraints.

# Validation Gates

- **DG1 — Causal Linkage**: The gap must be traceable to a testable intermediate process, not only to a black-box performance deficit.
- **DG2 — Falsifiability**: Every candidate hypothesis must have at least one observable that can distinguish it from alternatives and from the null.
- **DG3 — Mechanism Isolation**: The experimental or computational design must include controls that separate the target mechanism from background, instrumentation, and model artifacts.
- **DG4 — Signal Distinguishability**: The mechanism signature must be statistically separable from the negative control and quantified background.
- **DG5 — Scope Advancement**: Evidence must be strong enough to justify expanded parameter scans, scale-up, or translation to another platform; otherwise, iterate.
- **DG6 — Iteration Productivity**: Each iteration cycle must yield revised hypotheses with new distinguishable predictions; if not, terminate or pivot.

# Claim Boundaries

- Distinguish "paper-verified methodological patterns" from "agent inferences for the new problem."
- Do not treat single-study conclusions as field consensus.
- Do not equate model fit with mechanism proof; a model can reproduce an outcome for the wrong reason.
- Do not extrapolate beyond validated ranges without labeling the conclusion as hypothetical.
- Separate "mechanism verified" from "system optimized" or "application ready."
- Avoid interpreting effective parameters as direct evidence of local mechanisms unless supported by localized diagnostics.

# Failure Modes

- **Hypothesis failure**: The mechanism does not produce the predicted intermediate state; background dominates; the signal is diagnostically degenerate with an alternative mechanism.
- **Design failure**: Controls are insufficient; covariates are unmonitored; stop conditions are ignored; scope expands before isolation is achieved.
- **Analysis failure**: Baseline is ill-defined; contributions are not separated; uncertainty is underestimated; post-hoc reasoning replaces pre-registered criteria.
- **Iteration failure**: Null results are discarded rather than used to generate alternatives; model assumptions are never challenged; the same undistinguishable hypothesis is retested without diagnostic improvement.
- **Safety/Ethics failure**: Conceptual research design is conflated with executable operational instructions; hazards are downplayed to preserve hypothesis viability.

# Validity Checks

- **Distinguishability**: Target mechanism predicts observably different outcomes than alternatives under the proposed controls.
- **Control adequacy**: Baseline, negative, positive, and mechanism controls are all present and appropriate for the causal claim.
- **Model credibility**: Assumptions, dimensionality reduction, and parameter inputs are benchmarked; sensitivity is reported.
- **Diagnostic reliability**: Instrument response, calibration, noise, saturation, and drift are quantified.
- **Statistical rigor**: Repeatability, error propagation, confidence intervals, and multiple-comparison corrections are reported.
- **Extrapolation boundaries**: Verified range, simulation-predicted range, and purely hypothetical range are explicitly separated.
- **Reproducibility**: Design intent, variable definitions, data processing steps, and quality thresholds are documented with sufficient detail for independent replication.

# Provenance

- Synthesized from cluster 15.0 ("quantum-plasma-defect-superconductivity-separation-research-design-workflow") comprising 28 source skills.
- Representative source skills abstracted: laser-plasma-neutron-source-research, synthetic-gauge-quantum-walk-exploration, tmdc-lanthanide-defect-exploration, plasma-wakefield-staging-exploration, exotic-spin-velocity-interaction-research, externally-amplified-critical-warning, water-wave-metamaterial-exploration, composite-interface-slip-exploration.
- Only shared methodological patterns were retained; no specific paper conclusions, numerical parameters, material systems, or operational protocols are included.
