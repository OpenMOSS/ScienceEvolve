---
name: sci-neuro-evidence-analysis-claim-audit-workflow-43c12cd6
description: End-to-end workflow for formulating hypotheses, designing controlled validation, and auditing claim boundaries in scientific modeling and machine-learning research.
scienceevolve-title: "Neuromorphic computing and Ising optimization · evidence analysis claim audit workflow"
scienceevolve-area: neuromorphic-computing-and-ising-optimization
---

## Purpose

Help an agent migrate a methodological pattern from a source domain to a new scientific problem by producing auditable evidence. The workflow guides the agent from research-gap identification through hypothesis generation, minimum-viable experiment design, layered diagnostic analysis, and explicit claim classification—distinguishing verified findings from inferred or unsupported conclusions.

## When to use

Trigger this workflow when:
- A user wants to propose a new research question in a domain that combines physical modeling, machine learning, or computational surrogates.
- The task requires designing validation experiments (computational or analytical) rather than reproducing a specific prior result.
- The agent must compare a proposed method against baselines, ablations, and negative controls to justify mechanistic claims.
- The output may influence downstream modeling choices, benchmark design, or cross-domain migration of a method.

Do not use this workflow for:
- Pure literature summarization without a new research question.
- Operational lab protocols, hardware fabrication steps, or hazardous procedures.
- Clinical diagnosis, treatment recommendations, or safety-critical operational decisions.
- Direct extrapolation of a single paper’s numerical results to an unverified system.

## Inputs required

Before starting, collect or clarify:
- **Target problem**: The system, phenomenon, or dataset; known governing equations or constraints; the specific gap in existing methods.
- **Methodological pattern**: The candidate technique or representation to be migrated (e.g., latent encoding, physical residual constraint, local supervision, hierarchical clustering).
- **Baselines**: Established numerical, analytical, or data-driven methods against which to compare.
- **Data and compute constraints**: Available observations, simulation budgets, noise levels, sampling coverage, and reproducibility requirements.
- **Success criteria**: Required error thresholds, physical consistency checks, generalization scope, or resource limits.
- **Risk boundaries**: Safety, ethical, or compliance constraints that prohibit certain operational recommendations.

## Core Workflow

Execute the following stages in order. At each decision gate, record the rationale before proceeding.

### Stage 1 – Gap formulation and scope bounding
1. Restate the user’s goal as a falsifiable research question: *“Does [methodological pattern] improve [target capability] under [conditions]?”*
2. Identify the complexity bottleneck (e.g., high dimensionality, sparse observations, multi-scale coupling, distribution shift).
3. List what is already verified in the literature, what is analogous, and what is an agent inference for the new problem.
4. **Decision Gate A**: If the question cannot be cast as falsifiable or no baseline exists, stop and request clarification.

### Stage 2 – Hypothesis generation
For each candidate mechanism, produce a hypothesis card containing:
- **Hypothesis statement**: A causal or structural claim.
- **Evidence strength**: High / Medium / Low, with justification.
- **Key assumptions**: Conditions that must hold for the hypothesis to be testable.
- **Falsifiable predictions**: Specific expected outcomes if the hypothesis holds.
- **Failure modes**: How the hypothesis could fail (e.g., overfitting, inductive bias mismatch, insufficient coverage, confounding).
- **Provenance tag**: Whether the claim is derived from prior verified results, analogy, or new inference.

Produce at least three competing or complementary hypotheses.

### Stage 3 – Minimum viable validation design
Design the smallest experiment that can reject or support the core mechanism:
- **Positive control**: A simplified case where the mechanism is known to apply, confirming the pipeline works.
- **Negative control**: A deliberately broken or stripped variant (e.g., removing the inductive bias, shuffling labels, using an irrelevant input) to detect spurious signals.
- **Strong baseline**: A mature alternative method matched for computational budget and data access.
- **Ablation**: Systematic removal of components to attribute performance.
- **Variables**: Define independent, dependent, and confounding variables without fixing domain-specific numerical values.
- **Metrics**: Include task performance, physical/statistical consistency, generalization, and computational cost.
- **Stop conditions**: Pre-defined criteria to halt if data leakage, negative-control success, or resource overruns occur.

### Stage 4 – Execution and layered diagnostics
Run the experiment and analyze in three layers:
1. **Data and training diagnostics**: Check for leakage, distribution mismatch, convergence stability, seed variance, and preprocessing artifacts.
2. **Physical / structural consistency**: Verify conservation laws, symmetries, boundary conditions, monotonicity, or other domain-invariant constraints.
3. **Error decomposition**: Separate approximation error, data noise, optimization failure, and generalization gap. Map errors spatially, temporally, or by parameter regime to identify failure regions.

**Decision Gate B**: If negative controls perform comparably to the full model, stop. Diagnose leakage or mis-specification before continuing.

### Stage 5 – Evidence synthesis and claim audit
Classify every conclusion into one of four tiers:
- **Verified**: Supported by the current experiment and consistent with independent baselines.
- **Supported but needs replication**: Plausible given current evidence, but requires additional independent runs or datasets.
- **Hypothetical**: Derived from analogy or agent inference; not yet tested.
- **Negated**: Contradicted by controls or diagnostics.

Explicitly state the boundary of applicability (input ranges, system classes, noise levels, scales) beyond which conclusions are unsupported.

### Stage 6 – Iteration or termination
Based on the audit:
- **If verified and boundaries are acceptable**: Document the scope statement and recommend the next, more complex validation (e.g., real data, larger scale).
- **If partially supported**: Refine the hypothesis (narrower scope, additional control) and return to Stage 3.
- **If negated or negative controls fail**: Reject the hypothesis, preserve the null result, and either pivot to an alternative hypothesis (Stage 2) or terminate the line of inquiry.
- **If resources exhausted**: Terminate with a boundary statement and a list of unresolved risks.

## Output Format

Each invocation must produce:
1. **Research question**: One sentence, falsifiable.
2. **Evidence map**: Table of prior verified findings, analogies, and agent inferences with evidence strength.
3. **Hypothesis cards**: At least three hypotheses with assumptions, predictions, and failure modes.
4. **Experimental plan**: Controls, variables, metrics, and stop conditions.
5. **Analysis plan**: Layered diagnostic steps and error-decomposition strategy.
6. **Iteration plan**: Decision rules for each possible outcome (support / partial support / negation).
7. **Validity and ethics notes**: Confounders, reproducibility requirements, extrapolation limits, and safety/compliance boundaries.
8. **Claim classification**: Tiered labeling of all conclusions (verified / supported / hypothetical / negated).

## Validation Gates

- **Gate A (Problem falsifiability)**: The research question must admit a negative result; otherwise reformulate.
- **Gate B (Control integrity)**: Negative and positive controls must behave as expected before interpreting the target result.
- **Gate C (Metric independence)**: Evaluation data must be independent of training data and hyperparameter selection.
- **Gate D (Consistency check)**: Predictions must not violate known physical, mathematical, or logical constraints within the stated scope.
- **Gate E (Replication readiness)**: All random seeds, data splits, preprocessing steps, and model configurations must be recorded such that an independent run could reproduce the protocol.

## Claim Boundaries

- Do not present agent inferences as established facts.
- Do not generalize beyond the tested input distribution, system scale, or noise regime without labeling the conclusion as hypothetical.
- Do not equate simulation success on synthetic data with real-world validity unless explicitly validated against independent observations.
- Distinguish “the method outperforms the baseline” from “the method captures the true mechanism”; performance gains may stem from confounders.
- Avoid causal language unless supported by ablation and controlled intervention.

## Failure Modes

- **False positive via leakage**: Training and testing share information through overlapping samples, derived features, or correlated random seeds.
- **False positive via confounding**: Uncontrolled variables (e.g., optimizer choice, data augmentation, resolution differences) explain the observed effect.
- **Overfitting to diagnostics**: Repeatedly tuning the method against the same validation set until apparent success emerges.
- **Mechanism misattribution**: A performance gain is credited to the wrong component because ablations were incomplete.
- **Boundary overreach**: Conclusions are applied to regimes where key assumptions (locality, smoothness, ergodicity, etc.) fail.
- **Irreproducibility**: Random seeds, software versions, or preprocessing pipelines are not documented, preventing independent verification.

## Validity Checks

Before finalizing outputs, verify:
- **Confounders**: Have geometry, resolution, noise model, initialization, and preprocessing been held constant across comparisons?
- **Reproducibility**: Are seeds, splits, code versions, and evaluation scripts fixed and reported?
- **Statistical validity**: Is uncertainty quantified via repeated runs, bootstrap, or cross-validation? Are training, validation, and test roles strictly separated?
- **Physical / logical validity**: Do outputs respect known constraints (conservation, symmetries, bounds, monotonicity) where applicable?
- **Extrapolation risk**: Are all out-of-distribution claims tagged as low-evidence inferences?
- **Scope alignment**: Does the experimental design match the falsifiable question, or has scope drift occurred?

## Provenance

- Derived from cluster `16` / subcluster `16.0`: *quantum-neural-state-representation-evidence-analysis-workflow*.
- Synthesized from representative source skills:
  - `quantum-generative-workflow-skill`
  - `pinns-hemodynamics-research-design`
  - `ground-state-ml-research`
  - `fire-spread-ml-research-workflow`
  - `spin-glass-hierarchical-landscape-exploration`
  - `chip-thermal-pde-unsupervised-research`
  - `neuromorphic-snn-local-tandem-research`
  - `stt-mtj-compact-model-exploration`
