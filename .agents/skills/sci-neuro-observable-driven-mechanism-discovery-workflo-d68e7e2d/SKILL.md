---
name: sci-neuro-observable-driven-mechanism-discovery-workflo-d68e7e2d
description: A reusable end-to-end workflow for generating mechanism-grounded hypotheses, designing controlled validation studies, and iterating toward discriminated, bounded claims from observable gaps across physical, biological, or computational systems.
scienceevolve-title: "Neuromorphic computing and Ising optimization · observable driven mechanism discovery workflow 3"
scienceevolve-area: neuromorphic-computing-and-ising-optimization
---

## Purpose

Provide a domain-agnostic, reusable method to move from an observable gap or anomaly to a validated, bounded mechanism claim. The workflow emphasizes causal reasoning through controlled comparison, minimal viable validation, and iterative claim refinement rather than exhaustive optimization or single-study generalization.

## When to use

Use this skill when the user needs to:

- Investigate why a system produces an unexpected observable pattern, mismatch, or degradation under stress.
- Compare candidate mechanisms that could explain a gap in performance, dynamics, transport, representation, or stability.
- Design a minimal validation plan (experimental, computational, or theoretical) to discriminate between mechanisms.
- Iterate on hypotheses after initial results without overclaiming from a single model, dataset, or study.
- Bound claims by evidence level and explicitly state where a proposed mechanism should fail.

Do not use this skill for operational execution of high-risk procedures, clinical decision-making, or direct hardware manipulation protocols.

## Inputs required

Before starting the workflow, collect or infer:

- **Target system and observable gap**: the phenomenon, measurement, or performance degradation to explain.
- **Current baseline explanation**: what is already explained and where it fails.
- **Candidate mechanisms**: at least one proposed causal mechanism and one contrasting baseline.
- **Available evidence**: prior observations, simulations, literature benchmarks, or data features.
- **Abstraction level**: whether the work is empirical, simulation-based, analytical, or data-driven.
- **Constraints**: safety limits, resource budgets, reproducibility needs, and ethical boundaries.
- **Evaluation criteria**: primary and secondary metrics, acceptable evidence strength, and decision thresholds.

If inputs are missing, state assumptions explicitly and label conclusions as provisional.

## Core Workflow

Follow this ordered route. Do not skip decision gates.

### 1. Gap definition and observable mapping
- State the observable mismatch precisely and link it to a causal chain (e.g., structure → state → observable).
- Identify the minimal conditions under which the gap appears.
- **Decision gate**: Is the gap measurable and separable from baseline behavior? If no, pause and refine the question.

### 2. Mechanism hypothesis generation
- Produce at least three falsifiable hypotheses in a standard format:
  - **Mechanism claim**: concise causal statement.
  - **Evidence strength**: strong, moderate, weak, or speculative.
  - **Key assumptions**: minimal conditions required.
  - **Predicted fingerprints**: observable signatures under baseline, perturbed, and control conditions.
  - **Failure modes**: how the hypothesis could be wrong or confounded.
  - **Boundary conditions**: where the claim should not be extrapolated.
- Include a conservative extension, a structural or stateful reinterpretation, and a boundary-limit hypothesis.
- **Decision gate**: Do the hypotheses predict mutually distinguishable fingerprints? If no, redesign before proceeding.

### 3. Minimal validation design
- Define the smallest comparison that can falsify or support the leading hypothesis.
- Specify:
  - **Independent variables**: design parameters, stress regimes, or model variants.
  - **Dependent variables**: primary metric tied to the mechanism and secondary robustness metrics.
  - **Controls**: negative (mechanism absent), positive/benchmark (known behavior), ablation (one component removed), and matched-capacity or matched-complexity controls.
  - **Stop conditions**: predefined criteria for rejection, support, or redesign (e.g., failure to exceed control variability, resource infeasibility, instability).
- **Decision gate**: Can the controls isolate the proposed mechanism from capacity, preprocessing, or initialization artifacts? If no, redesign.

### 4. Execution and diagnostic analysis
- Run the minimal validation while holding evaluation protocol constant across variants.
- Analyze:
  - Whether structural or input changes produce the expected state changes.
  - Whether state changes produce the expected observable changes.
  - Distributions and variability, not only central tendencies.
  - Separation of mechanism-specific effects from confounders.
- **Decision gate**: Do results exceed control variability in the predicted direction? If ambiguous, proceed to robustness probing; if negative, go to step 6.

### 5. Robustness and boundary probing
- Test across perturbations, random seeds, initial conditions, parameter sweeps, or alternative realizations.
- Evaluate stability, sensitivity, and where the mechanism should weaken or fail.
- **Decision gate**: Does the effect survive randomization and stress tests? If no, narrow the claim or reject the hypothesis.

### 6. Mechanism discrimination and claim update
- Map results onto the causal chain.
- **If supported**: strengthen the hypothesis, define boundary conditions, and plan a stricter test or broader architecture.
- **If partially supported**: split into conditional sub-hypotheses and identify which causal link is weak.
- **If refuted**: generate alternative explanations (e.g., confounding variables, alternative state variables, measurement artifacts) and return to step 2.
- **Stop conditions**:
  - The mechanism is indistinguishable from controls after fair comparison.
  - Reproducibility is poor across realizations.
  - Interpretation exceeds what the model or data can support (e.g., biological consensus from a single simulation).
  - Safety, ethics, or compliance constraints are unclear.

### 7. Synthesis and evidence labeling
- Package findings with explicit evidence levels:
  - **Model-verified**: reproduced under tested assumptions.
  - **Simulation-supported**: consistent with model but needs further validation.
  - **Speculative**: plausible but not directly tested.
- State claim boundaries, residual risks, and recommended next validation steps.

## Output Format

Return the following structured items:

1. **Research question and gap statement**: one sentence describing the new question and the baseline failure.
2. **Ranked hypotheses**: a table or list with mechanism claim, evidence strength, key assumptions, predicted fingerprints, failure modes, and boundary conditions.
3. **Study plan**: minimal validation design with variables, controls, metrics, and stop conditions.
4. **Validation plan**: execution protocol, robustness tests, and boundary probes.
5. **Control table**: summary of negative, positive, ablation, and matched controls with their purpose.
6. **Analysis plan**: diagnostic checks, confounder separation, visualization priorities, and statistical approach.
7. **Failure modes**: anticipated failure modes and how they will be detected.
8. **Claim boundaries**: explicit limits on generalization, evidence level, and domain transfer.
9. **Iteration roadmap**: rules for updating or abandoning hypotheses based on support, partial support, or refutation.

## Validation Gates

Before advancing past each decision gate, confirm:

- **Gap clarity**: the observable mismatch is defined independently of the proposed mechanism.
- **Hypothesis discriminability**: each hypothesis predicts a distinct fingerprint or control outcome.
- **Control adequacy**: comparisons address the strongest alternative explanations, not only null baselines.
- **Reproducibility plan**: random seeds, splits, initial conditions, or repeated measurements are specified.
- **Mechanism specificity**: the design can separate the proposed mechanism from capacity, preprocessing, tuning, or resource artifacts.
- **Statistical validity**: metrics and uncertainty estimates are predefined; post-hoc metric selection is avoided.
- **Safety and ethics**: the plan stays within non-operational research design and respects domain-specific constraints.

## Claim Boundaries

- **Model-verified claims**: limited to the tested system, assumptions, and parameter regime.
- **Simulation-supported claims**: explicitly labeled as requiring independent empirical validation before generalization.
- **Speculative claims**: treated as hypotheses for future work, not current evidence.
- Do not treat single-study or single-model results as field-wide consensus.
- Do not extrapolate beyond tested boundary conditions without labeling the inference as unverified transfer.
- Distinguish computational or theoretical evidence from empirical or clinical confirmation.

## Failure Modes

Common ways this workflow fails or degrades:

- **Overfitting to controls**: the hypothesis is adjusted until it fits a specific control outcome, destroying falsifiability.
- **Initialization or seed dependency**: the effect appears only under one narrow initialization or random seed.
- **Capacity confounding**: improved performance is driven by larger capacity or stronger tuning rather than the proposed mechanism.
- **Preprocessing or leakage artifact**: gains arise from data handling differences rather than the mechanism.
- **Resource or implementation divergence**: software results do not translate to the intended constrained deployment.
- **Mechanism misattribution**: the observable fingerprint matches, but the underlying cause is different (e.g., ordinary nonlinearity vs. state-dependent memory).
- **Premature generalization**: claims extend to untested architectures, materials, biological systems, or clinical contexts.

## Validity Checks

Before finalizing any research plan or claim, verify:

- **Confounding**: Are preprocessing, calibration, splits, baseline tuning, or implementation details driving the result?
- **Reproducibility**: Are definitions, randomization policies, and reporting conventions sufficient for independent replication?
- **Statistical validity**: Are uncertainty estimates, repeated trials, and effect-size summaries adequate?
- **Boundary conditions**: Does the claim specify where the mechanism should fail or weaken?
- **Mechanism specificity**: Do ablations or diagnostic controls isolate the proposed mechanism?
- **External validity**: Is the target system sufficiently similar to the evidence base, or is the claim only an analogy?
- **Evidence labeling**: Are source-supported findings, target-system evidence, and agent-inferred assumptions clearly separated?
- **Scope discipline**: Are operational, clinical, or deployment claims avoided without appropriate validation?

## Provenance

- **Cluster**: 0 / 0.1 — observable-driven mechanism discovery and validation.
- **Source skills**: sparse-expansion-odor-representation-research; computational-neuroscience-voltage-plasticity-exploration; magnetic-multilayer-research-design; plastic-neural-network-exploration; realtime-detector-ml-research; recurrent-network-stability-sensitivity; memristive-stateful-research-design; hardware-aware-relaxation-learning-research.
