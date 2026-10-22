---
name: sci-neuro-ml-assisted-mechanism-discovery-workflow-b53e68f6
description: A reusable end-to-end workflow for designing, validating, and iterating machine-learning-assisted mechanism discovery across optimization, neural, graph, and surrogate model families.
scienceevolve-title: "Neuromorphic computing and Ising optimization · ml assisted mechanism discovery workflow"
scienceevolve-area: neuromorphic-computing-and-ising-optimization
---

# Purpose

Synthesize a transferable scientific workflow that helps an agent move from an empirical gap or generalization failure to a validated mechanistic hypothesis using machine-learning models as hypothesis engines rather than black-box predictors. The workflow emphasizes controlled comparison, explicit claim bounding, and iterative refinement.

# When to use

Use this skill when the user asks to:

- Discover or validate latent structure, reusable components, or governing mechanisms behind empirical patterns.
- Compare structure-aware versus structure-agnostic models, or mechanistic hypotheses against baseline explanations.
- Transfer a learned pattern (initialization, representation, selector, or constraint) across tasks, parameter regimes, or model versions.
- Design minimal viable validations for complex model families before scaling to full benchmarks.
- Audit uncertainty, failure modes, and claim boundaries in computational mechanism-discovery studies.

Do not use for operational deployment decisions, safety-critical automation, or as a substitute for domain-specific experimental validation.

# Inputs required

Before executing the workflow, collect or infer:

- **Target problem family and observable variables:** the domain, data modality, and expected distributional properties.
- **Empirical gap or generalization failure:** the pattern that existing explanations cannot account for.
- **Candidate model families and transferable objects:** neural, graph, quantum, surrogate, or optimization frameworks, plus the artifact to reuse (embeddings, selectors, initializations, structural priors, constraints).
- **Baseline strategies:** strong classical or simple baselines, negative controls, and ablation targets.
- **Evaluation metrics:** measures that separate explanation, prediction, cost, feasibility, and adaptation effort.
- **Computational and reproducibility constraints:** budget, seeds, splits, documentation standards, and acceptable uncertainty.
- **Risk and scope boundaries:** deployment context, data governance, extrapolation limits, and ethics constraints.

If any input is missing, state the assumption explicitly and mark dependent conclusions as provisional.

# Core Workflow

1. **Frame the mechanism gap.** Define the empirical pattern, generalization failure, or model mismatch that motivates a new mechanistic hypothesis. State what current explanations cannot account for and why a structural or reusable mechanism is suspected.
   - *Gate:* If the gap cannot be operationalized into a falsifiable comparison, stop and refine the question.
2. **Encode competing hypotheses.** Translate the gap into at least two competing mechanistic accounts (e.g., latent structure vs. low-order independence, reusable components vs. retraining, structured inductive bias vs. agnostic capacity). For each hypothesis specify the expected mechanism, key assumptions, evidence strength, and a minimal falsifier.
   - *Gate:* If hypotheses are not mutually distinguishable with available data and models, redesign the comparison.
3. **Select model family and transferable objects.** Choose the computational framework and define the artifact to be reused, compressed, or transferred. Verify that input semantics, dependencies, or task descriptors are alignable across versions or regimes.
   - *Gate:* If dependencies are unidentifiable or semantics cannot be aligned, reject transfer assumptions and redesign.
4. **Design controlled experiments.** Define independent variables, dependent variables, and covariates. Include positive controls (regime where the mechanism should work), negative controls (regime where it should not), ablations (remove the proposed component), and distribution controls (out-of-distribution or mismatched tasks). Pre-register metrics that separate quality, feasibility, cost, and adaptation effort. Define stopping conditions before running experiments.
   - *Gate:* If controls cannot isolate the mechanism or budgets are incomparable, pause and revise the design.
5. **Execute minimal viable validation.** Run the smallest experiment capable of falsifying a key assumption. Monitor approximation consistency, boundedness of transferred objects, selector stability, and diagnostic convergence. Verify that negative controls do not improve spuriously.
   - *Gate:* If negative controls match positive controls, halt to audit for leakage, overlap, or invalid assumptions before scaling.
6. **Analyze mechanism-linked outcomes.** Separate performance gains from mechanistic claims. Use regime stratification, ablation attribution, surrogate diagnostics, and error localization to link model behavior to the hypothesized mechanism. Report uncertainty across seeds, splits, or instances. Treat inferred structure as provisional until independently corroborated.
   - *Gate:* If gains disappear under matched refinement, stronger baselines, or out-of-distribution tests, downgrade mechanistic claims to observational correlations.
7. **Audit uncertainty and bound claims.** Quantify variability, boundary conditions, and extrapolation risk. Label each claim as paper-supported, agent-inferred, or speculative. State the exact problem class, data regime, and model family under which conclusions hold. Distinguish explanatory structure from predictive performance.
   - *Gate:* If claims cannot be bounded to tested conditions, flag them as unverified extrapolation.
8. **Iterate or terminate.** Update the hypothesis portfolio based on evidence:
   - *Strengthen* if supported by controls and replicates.
   - *Narrow* if supported only in a subregime.
   - *Reject* if falsified by minimal tests or negative controls.
   - *Stop* if convergence criteria are met (mechanism isolated, claims bounded, replication stable) or if resource limits are reached without progress.

# Output Format

Return:

1. **Research question and mechanism gap:** concise statement of the gap and target generalization.
2. **Ranked hypotheses:** table with hypothesis, evidence strength, key assumptions, predicted signature, and minimal falsifier.
3. **Study plan:** model family, transferable objects, variables, controls, metrics, and stopping conditions.
4. **Validation plan:** minimal viable validation steps, robustness checks, and ablation list.
5. **Analysis plan:** regime stratification, diagnostic extraction, uncertainty reporting, and visualization strategy.
6. **Control table:** summary of positive, negative, ablation, and baseline comparisons with expected outcomes.
7. **Claim boundary statement:** scope, extrapolation limits, and evidence labels for each conclusion.
8. **Failure modes and iteration rules:** how results update, weaken, or reject hypotheses, and predefined stop criteria.
9. **Provenance and ethics notes:** source-skill references, reproducibility requirements, data governance, and safety boundaries.

# Validation Gates

- **Gap falsifiability:** The mechanism gap must be expressible as a controlled comparison.
- **Control isolation:** At least one negative control and one strong baseline must be included.
- **Budget parity:** Adaptation cost, compute, and refinement effort must be comparable across compared methods.
- **Diagnostic boundedness:** Transferred objects, selectors, or surrogates must show stable, bounded behavior.
- **Leakage audit:** Train, validation, and test regimes must be independent; label construction must not use prediction features.
- **Replication check:** Key comparisons must be repeatable across seeds, splits, or instances.

# Claim Boundaries

- Distinguish paper-supported patterns from agent-inferred extensions and speculative hypotheses.
- Limit mechanistic claims to the tested problem family, model family, data regime, and task descriptor space.
- Do not treat benchmark performance as proof of real-world reliability, universal transferability, or causal mechanism.
- Separate explanatory structure from predictive performance; report both independently.

# Failure Modes

- **Spurious transfer:** Negative controls improve because of task overlap, leakage, or invalid reuse assumptions.
- **Under-identified mechanism:** Multiple structurally different explanations achieve identical performance.
- **Budget confounding:** Gains arise from unequal training, refinement, or hyperparameter search rather than the proposed mechanism.
- **Surrogate artifact:** The approximation or selector converges to an artifact that does not generalize to the target problem.
- **Over-extrapolation:** Claims extend beyond the tested regime, instance distribution, or model family.
- **Instability:** Results depend strongly on initialization, seed, or small data perturbations.

# Validity Checks

- **Assumption alignment:** The solution concept, approximation, and evaluation metric refer to the same object.
- **Baseline fairness:** Baselines are strong, relevant, and implemented with comparable information and compute.
- **Statistical validity:** Variability is reported; comparisons are paired where appropriate; multiple comparisons are handled.
- **Reproducibility:** Seeds, splits, preprocessing, model versions, and analysis scripts are documented.
- **Boundary scope:** Conclusions state where the method is expected to fail or require revalidation.
- **Mechanistic caution:** Inferred structure is treated as a statistical hypothesis, not as validated causal or anatomical fact.

# Provenance

- Synthesized from cluster 24.0 (machine-learning-assisted mechanism discovery and validation).
- Source skills: set-based-model-reuse-research, neural-architecture-exploration-workflow, pinn-parameterized-pde-metalearning, nonsmooth-constrained-optimization-exploration, graph-neural-dynamics-research-workflow, higher-order-interaction-research-skill, graph-neural-optimization-research-design, random-weight-compressed-feature-research.
- Treat source studies as demonstrated patterns, not field consensus. Revalidate each extension for the target model family, data regime, and task.
