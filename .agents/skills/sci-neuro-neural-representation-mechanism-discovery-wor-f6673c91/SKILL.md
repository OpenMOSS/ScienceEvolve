---
name: sci-neuro-neural-representation-mechanism-discovery-wor-f6673c91
description: A reusable end-to-end workflow for designing, validating, and iterating on machine-learning-assisted research that discovers and discriminates mechanisms in neural representations, model behaviors, or latent structures through controlled comparison and evidence-based claim bounding.
scienceevolve-title: "Neuromorphic computing and Ising optimization · neural representation mechanism discovery workflow"
scienceevolve-area: neuromorphic-computing-and-ising-optimization
---

# Purpose

Use this skill to design and execute research programs that discover, discriminate, and validate mechanisms underlying neural network representations, behaviors, or latent structures. It provides a transferable workflow for moving from an initial observation or model to a bounded scientific claim through hypothesis generation, controlled experimentation, and iterative validation.

# When to use

Use this skill when the user needs to investigate why a model behaves as it does, what structure it learns, how it fails, or how its components interact. It applies to interpretability, robustness, representation quality, latent structure discovery, and component-level mechanism studies across data modalities and model families.

# Inputs required

Before starting the workflow, collect or confirm:

- **Target system**: model family, task, data modality, and access level to internals (inference, activations, gradients, or weights).
- **Observation or phenomenon**: the behavior, failure, collective pattern, or representation property to explain.
- **Candidate mechanism space**: proposed concepts, rules, interactions, approximations, or failure pathways.
- **Baselines and controls**: standard methods, same-family alternatives, and degraded variants available for comparison.
- **Evaluation constraints**: compute budget, latency, reproducibility requirements, and acceptable performance bounds.
- **Safety and ethics boundaries**: data-use constraints, privacy requirements, high-stakes deployment limits, and institutional review considerations.

# Core Workflow

1. **Frame the Observation and Gap**
   - Formalize the observation as a reproducible pattern in model behavior, internal state, or population statistics.
   - Identify what existing baselines or simple summaries cannot explain.
   - Define the scope (single model, model family, or cross-domain) and the exact claim type sought (correlation, predictive association, or causal contribution).

2. **Generate Mechanistic Hypotheses**
   - Propose candidate mechanisms that could explain the observation.
   - For each hypothesis, specify: concise claim, evidence strength (strong / moderate / weak / speculative), key assumptions, predicted observable effect, and at least two failure modes.
   - **Decision Gate — Candidate Gate**: Reject or refine hypotheses that are not falsifiable, not mechanistically distinct, or lack a minimal test. If no viable candidate remains, return to Step 1 and narrow the observation.

3. **Design Controlled Discrimination Experiments**
   - Select independent variables (model component, intervention, input condition, probing strategy, or comparison architecture).
   - Select dependent variables (task metric, internal statistic, generative quality, disagreement signal, or metadata alignment).
   - Define controls: negative (remove or scramble the proposed mechanism), positive (known strong setting), reduced (partial intervention), and baseline (standard method under matched computational budget).
   - Pre-register stopping conditions: e.g., candidate fails to beat negative control under matched budget, results depend on a single seed/split, or leakage is detected.
   - **Decision Gate — Robustness Check**: If controls cannot isolate the claimed mechanism from confounds such as capacity, tuning, or preprocessing differences, redesign before execution.

4. **Execute Analysis and Compute Evidence**
   - Extract behaviors, representations, or latent structures under a leakage-safe protocol.
   - Compute affinity, disagreement, generative match, structural statistics, or approximation quality using predefined metrics.
   - Compare the candidate mechanism against all controls; report per-condition results before aggregation.
   - Apply multiple-testing correction or calibration when searching over many units, layers, or hypotheses.
   - **Decision Gate — Stability Gate**: If results do not replicate across independent splits, seeds, sessions, or preprocessing variants, halt mechanistic interpretation and treat findings as exploratory only.

5. **Validate and Bound Claims**
   - Map statistical patterns to mechanistic interpretations only when controls are separable and replication holds.
   - Label each claim by evidence type: observed (direct measurement), inferred (controlled but indirect), or speculative (analogy or extrapolation).
   - Bound the claim scope: state whether it applies to the tested distribution, model family, or task class, and where it should not be generalized.
   - **Decision Gate — Claim Bounding / Mechanism Exclusion**: If evidence supports only a narrower claim than hypothesized, downgrade the scope. If the candidate performs no better than negative or same-family controls, exclude the mechanism and preserve the negative result.

6. **Iterate or Terminate**
   - If the mechanism is supported and bounded, propose broader tests, stronger baselines, or transfer to new domains.
   - If the mechanism is ambiguous, split it into narrower sub-hypotheses or add perturbation/ablation checks.
   - If the mechanism is excluded, update boundary conditions and redirect to alternative candidates from Step 2.
   - **Stop Conditions**: Terminate when the claim is bounded and replicated, the hypothesis is falsified, the iteration budget is exhausted, or safety/ethics constraints are triggered.

# Output Format

When using this skill, produce:

1. **Research Question** — One concise question focused on the target mechanism.
2. **Mechanism Map** — Primary pathway, alternative explanations, and how evidence discriminates among them.
3. **Hypothesis Table** — For each candidate: claim, evidence strength, key assumptions, predicted observable effect, and failure modes.
4. **Experimental Design** — Independent and dependent variables, control set, metrics, and pre-registered stopping conditions.
5. **Analysis Plan** — Scoring procedure, calibration strategy, baseline comparison rules, and uncertainty handling.
6. **Iteration Plan** — Result patterns that would strengthen, narrow, or redirect each hypothesis.
7. **Validity and Ethics Statement** — Confounders, reproducibility checks, deployment boundaries, and safety constraints.

# Validation Gates

- **Mechanism Relevance Gate**: Does the probe or intervention target the claimed mechanism and not a superficial correlate?
- **Confounding Gate**: Are computational budget, capacity, preprocessing, initialization, and tuning matched across all comparisons?
- **Baseline Fairness Gate**: Do baselines include strong recent alternatives and same-family controls?
- **Statistical Validity Gate**: Are repeated runs, uncertainty estimates, and appropriate multiple-testing corrections applied?
- **Reproducibility Gate**: Are data splits, random seeds, code versions, preprocessing steps, and scoring definitions documented?

# Claim Boundaries

- Distinguish observed statistical patterns from inferred mechanistic contributions.
- Distinguish in-distribution findings from claims about generalization, transfer, or field-wide consensus.
- Distinguish single-model or single-task findings from family-wide conclusions.
- Separate methodological patterns supported by prior literature from new inferences generated for the current problem.
- State explicitly whether evidence supports correlation, predictive reconstruction, or causal intervention.

# Failure Modes

- **Spurious correlation**: Dataset artifacts, leakage, or nuisance variation explain the observed pattern.
- **Probe invalidity**: The hypothesis function measures a shortcut feature rather than the intended concept.
- **Baseline unfairness**: Gains arise from unmatched capacity, tuning budget, or training effort rather than the proposed mechanism.
- **Exploratory overfitting**: Results from large-scale searches over units, layers, or hypotheses fail to replicate.
- **Confounding by design**: Representation choice, encoding transformation, or stochastic sampling explains the effect.
- **Adaptive failure**: A verification or probing mechanism is gamed by the system under test or known to the failure process.

# Validity Checks

- Confirm that training, validation, and test splits are separated before any representation learning, feature selection, or hyperparameter search.
- Verify that test data are not used to fit preprocessing, extract features, or select probes.
- Ensure negative and positive controls are interpretable and that their outcomes are separable from the candidate mechanism.
- Confirm that efficiency, robustness, or human-effort gains are reported alongside primary task metrics.
- Assess whether results depend on arbitrary encoding choices, single-seed luck, or unreported hyperparameter search.
- Require that cost, latency, complexity, or safety trade-offs justify any performance gains before recommending adoption.

# Provenance

- Synthesized from cluster 24.2 (machine-learning-assisted mechanism discovery and validation).
- Source skills: adversarial-ml-heterogeneous-verification; hypothesis-driven-neural-inspection-research; neural-network-structural-masking-research; rbm-training-research-design; neural-population-latent-structure; hitl-machine-learning-research-planner; spiking-neural-network-research-design; representation-decoupling-research-design.
