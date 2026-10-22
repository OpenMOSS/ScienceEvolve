---
name: sci-neuro-ml-assisted-evidence-analysis-workflow-3013e8af
description: A reusable end-to-end workflow for designing, validating, and auditing scientific claims using machine-learning-assisted evidence analysis across physical, chemical, and computational systems.
scienceevolve-title: "Neuromorphic computing and Ising optimization · ml assisted evidence analysis workflow"
scienceevolve-area: neuromorphic-computing-and-ising-optimization
---

# Purpose

Guide agents to design reusable research plans that use machine learning, neural models, or computational substrates to generate hypotheses, structure validation experiments, analyze evidence, and bound claims. It abstracts a common pattern from studies involving generative modeling, variational methods, neuromorphic computing, physical analog optimization, and physics-informed discovery: match representational or algorithmic mechanisms to target system structure, validate through controlled comparisons and mechanistic diagnostics, and iterate based on failure attribution rather than headline metrics.

# When to use

Use this skill when the user asks to:
- Propose new research questions where ML or computational models augment theory-driven or sparse-data investigation.
- Design controlled experiments or simulation campaigns to test whether a model, ansatz, or dynamical mechanism captures target system behavior.
- Compare model families, architectures, or physical substrates against strong baselines with matched budgets and fair controls.
- Audit evidence strength, separate validated findings from inference, and bound claims before broader generalization.
- Iterate on a failed or partial result by diagnosing whether the failure is representational, architectural, optimization-related, or due to mismatch between mechanism and target regime.

Do not use this skill for operational lab protocols, safety-critical deployment decisions, or as a substitute for domain-specific expert review.

# Inputs required

Before producing a plan, collect or state assumptions for:
- Target system or task class and its relevant structure, symmetries, constraints, or degrees of freedom.
- Candidate model, ansatz, or substrate families and their proposed mechanism.
- Reference evidence source, such as exact theory, trusted simulation, validated benchmark, or experimental data.
- Observable or metric that is mechanistically interpretable and sensitive to hypothesized success or failure.
- Regimes expected to be easy, diagnostic, or stress conditions.
- Computational or resource constraints and acceptable stop conditions.
- Baselines for comparison and the evidence already established versus what must be validated.

If an input is missing, mark the affected hypothesis as lower evidence strength and state the assumption explicitly.

# Core Workflow

Follow this ordered end-to-end route. Do not skip a gate without documented justification.

## 1. Gap Diagnosis and Hypothesis Generation
- Identify the representational, predictive, or optimization bottleneck.
- Generate 3–5 falsifiable hypotheses. For each, specify: concise claim, proposed mechanism, evidence strength (strong, moderate, weak, speculative), key assumptions, likely failure modes, and a minimal viable validation.
- **Gate:** Proceed only if hypotheses are mechanistic and discriminating. If not, reformulate the research question.

## 2. Study Design and Control Structuring
- Define independent variables (mechanism, architecture, regime, substrate), dependent variables (task performance, physical observable, resource metric), and metadata variables (source, protocol, seed).
- Establish controls: positive control (known behavior), negative control (missing mechanism), strong baseline (competitive comparator), robustness control (varied initialization, seeds, or regime), and boundary control (stress condition where the hypothesis should weaken).
- Define stop conditions before execution: mapping failure on small cases, inability to beat a minimal baseline, instability, or dependence on unsupported assumptions.
- **Gate:** Review control coverage. If critical controls are missing, pause and redesign.

## 3. Minimal Viable Validation
- Execute the smallest test that can falsify the central hypothesis (e.g., single regime, small instance, limited architecture sweep).
- Verify mapping fidelity between problem encoding and model or substrate dynamics.
- For approximate or local methods, check alignment between the proposed mechanism and the reference signal before scaling.
- **Gate:** If minimal validation fails, stop and diagnose the failure mode (representation, architecture, regime, objective, sampling, or validation). Do not scale up.

## 4. Scaled Benchmark and Simulation Campaign
- Expand to representative instances, diverse regimes, or multiple system sizes while maintaining matched budgets and fair tuning across baselines.
- Collect primary metrics, distributional diagnostics, trajectory or evolution data, and resource overheads.
- **Gate:** If results are inconsistent across replicates or sensitive to unreported tuning, halt for robustness checks before proceeding.

## 5. Mechanism Discrimination and Failure Attribution
- Attribute outcomes to specific causes: representation failure, architecture failure, regime failure, objective or optimization failure, sampling or dynamics failure, mapping failure, or validation failure.
- Use ablations, residual diagnostics, and sensitivity sweeps to isolate the mechanism.
- **Gate:** If the mechanism cannot be isolated, add targeted controls or reduce claim scope.

## 6. Evidence Grading and Claim Bounding
- Classify each conclusion as validated (directly supported), inferred (plausible extension), or speculative (untested).
- Bound the claim domain by chemistry, property range, system size, benchmark family, or substrate class.
- **Gate:** If evidence strength does not support the desired claim, narrow the claim or return to step 1.

## 7. Iteration or Redesign
- Update the smallest design element needed to address the diagnosed failure.
- Re-run minimal validation before further scaling.
- Iterate until stop conditions are met (success, persistent failure, or resource limit).
- **Final gate:** Document residual risks, boundary conditions, and unresolved failure modes.

# Output Format

When using this skill, produce:
1. **Research question and gap statement** — concise problem and unresolved bottleneck.
2. **Hypothesis portfolio** — 3–5 entries with evidence strength, assumptions, failure modes, and minimal validation.
3. **Study design table** — variables, controls, metrics, and stop conditions.
4. **Validation plan** — minimal viable test, scaling strategy, and baseline comparison.
5. **Analysis plan** — diagnostics, ablations, residual checks, and mechanism attribution.
6. **Iteration roadmap** — decision rules for update, narrowing, or termination.
7. **Claim boundary statement** — validated domain, inferred extensions, and speculative regions.
8. **Validity and ethics notes** — confounders, reproducibility checks, and safety boundaries.

# Validation Gates

- **Hypothesis gate:** Are claims falsifiable and mechanistic rather than purely capacity-based?
- **Control gate:** Are positive, negative, strong baseline, robustness, and boundary controls present?
- **Minimal validation gate:** Does the smallest test pass before scaling?
- **Alignment gate:** For local or approximate methods, is mechanism-reference alignment confirmed?
- **Baseline fairness gate:** Are baselines tuned with comparable effort and evaluated on the same instances or regimes?
- **Reproducibility gate:** Are seeds, initialization, data splits, and evaluation metrics documented?
- **Mechanistic consistency gate:** Do trajectories and diagnostics support the claimed mechanism beyond final scores?
- **Boundary gate:** Are conclusions restricted to the validated domain?

# Claim Boundaries

- Distinguish paper-supported patterns from agent-inferred extensions.
- Separate exact or theory-supported conclusions from empirical observations.
- Do not present single-benchmark or single-system results as field-wide consensus.
- Limit candidate rankings or predictions to the validated interpolation domain; flag extrapolation.
- Mark hardware, efficiency, or biological-plausibility claims as speculative unless supported by implementation-specific measurement and matched comparison.

# Failure Modes

- **Representation failure:** The model or substrate cannot encode the target structure under stated assumptions.
- **Architecture failure:** The mechanism is plausible, but the chosen structure does not preserve needed dependencies.
- **Regime failure:** Success in easy conditions but failure under criticality, disorder, constraints, or other stress.
- **Objective or optimization failure:** Training or dynamics improve while target observables do not.
- **Sampling or dynamics failure:** Generated samples or trajectories are biased, metastable, or poorly matched to intended regimes.
- **Mapping failure:** The problem-to-system encoding does not correspond to the intended objective.
- **Validation failure:** The reference, metric, or control is insufficient to test the hypothesis.
- **Baseline failure:** The proposed method does not beat a fair minimal baseline or depends on unreported tuning.

# Validity Checks

- **Confounding:** Check for label leakage, initialization bias, class imbalance, metric mismatch, or post-processing artifacts.
- **Data leakage:** Ensure structurally similar or protocol-linked records are not split across training and test sets.
- **Extrapolation:** Verify that candidate descriptors and operating conditions lie within or near the validated domain.
- **Statistical validity:** Use repeated runs, held-out references, and multiple diagnostics; avoid reliance on a single score or best-observed value.
- **Reproducibility:** Report model families, data sources, observables, controls, metrics, and stop conditions; preserve negative and boundary-condition results.
- **Boundary conditions:** Test whether conclusions survive changes in regime, scale, disorder, or reference data source.
- **Overhead accounting:** Include communication, mapping, memory, conversion, and software runtime in resource claims.
- **Mechanistic plausibility:** Ensure feature effects and predicted trends match theory or have defensible explanations.

# Provenance

- Synthesized from cluster 14.0 (neural-quantum-optimization-neuromorphic-evidence-analysis-workflow).
- Source skills: generative-physics-representation-research, transient-control-optimization-research, neuromorphic-research-design, physics-informed-solvent-ml-research, optoelectronic-ising-research-design, correlation-aware-neural-variational-research, continual-local-learning-workflow, probabilistic-neural-codesign-exploration.
- Paper-derived patterns are treated as demonstrated examples, not field-wide consensus.
