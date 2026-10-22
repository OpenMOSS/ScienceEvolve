---
name: sci-neuro-symmetry-guided-mechanism-discovery-workflow-df8aaac5
description: A reusable end-to-end workflow for discovering and validating mechanisms in physics-informed modeling by enforcing symmetry and consistency constraints, ranking hypotheses, and validating through layered controls and iterative redesign.
scienceevolve-title: "Neuromorphic computing and Ising optimization · symmetry guided mechanism discovery workflow 2"
scienceevolve-area: neuromorphic-computing-and-ising-optimization
---

# Purpose

Use this skill to generate research questions, design validation studies, and iterate on evidence for scientific mechanisms in physics-informed modeling. It abstracts a transferable pattern: formalize constraints first, generate falsifiable hypotheses within a constrained model space, validate in layers against strong controls, and bound claims by separating evidence from extrapolation.

## When to use

Use this skill when a user asks to:

- Propose new research questions about constitutive, dynamical, statistical, or optimization mechanisms where symmetry, conservation, or consistency plays a role.
- Compare alternative model representations, architectures, or mappings that enforce structural constraints.
- Design experiments or simulations that test whether a proposed mechanism improves correctness, extrapolation, or downstream behavior.
- Evaluate whether a modeling pattern is transferable or only paper-specific.
- Turn trained models or energy landscapes into interpretable interaction hypotheses with controlled validation.

Do not use this skill for operational deployment instructions, safety-critical design certification, hardware fabrication protocols, or clinical decision-making.

## Inputs required

Ask for or identify:

- Target system class, phenomenon, and intended modeling use case.
- Known formal constraints: symmetries, invariances, conservation laws, convexity, stability, or admissibility conditions.
- Available data or simulation sources, including coverage, noise, and whether states are fully or partially observed.
- Candidate baselines and dominant representations in the field.
- Validation targets: interpolation, extrapolation, unseen modes, downstream equation insertion, or mechanism recovery.
- Resource boundaries and acceptable evidence strength.

## Core Workflow

Follow this ordered end-to-end route. Do not skip a layer before its gate is satisfied.

1. **Problem scoping and constraint formalization**
   - Define the target phenomenon, system class, and modeling objective.
   - State the known invariances, symmetries, conservation laws, and admissibility constraints that any candidate mechanism must satisfy.
   - Identify the representation or explanatory gap: why current approaches may be insufficient.
   - *Decision gate*: If constraints cannot be stated formally or the gap is ambiguous, stop and clarify scope before proceeding.

2. **Constrained hypothesis generation**
   - Propose candidate mechanisms, mappings, or model families whose structure enforces constraints before fitting data.
   - Rank hypotheses by evidence strength: directly supported by source literature, supported by adjacent literature, inferred by analogy, or speculative.
   - For each hypothesis, document: mechanistic rationale, key assumptions, predicted signatures, and likely failure modes.
   - *Decision gate*: If a hypothesis cannot be falsified by any feasible test, reformulate it or exclude it.

3. **Validation ladder design**
   - Design a hierarchy of tests starting with synthetic or controlled systems where ground truth is known.
   - Define independent variables, dependent variables, and nuisance variables.
   - Specify strong controls: a dominant baseline, a close ablation that removes the proposed mechanism, a simple interpretable baseline, a positive control where the mechanism should succeed, and a negative control where it should not help.
   - Predefine metrics that evaluate correctness, constraint satisfaction, mechanism-specific behavior, robustness, and downstream functional validity.
   - *Stop condition*: If negative controls behave like positive controls, redesign the test before execution.

4. **Layered execution and mechanism discrimination**
   - **Layer 1 — Correctness**: Verify mapping consistency, constraint satisfaction, and implementation correctness on small or simplified instances.
   - **Layer 2 — Mechanism isolation**: Test whether the proposed mechanism outperforms ablations under matched capacity and comparable conditions; inspect residuals, candidate reduction, or interaction recovery to attribute gains.
   - **Layer 3 — Robustness**: Vary data coverage, noise, sample size, initialization, or perturbation strength; check stability across seeds, splits, or independent samples.
   - **Layer 4 — Downstream / Extrapolation**: Validate on real or complex target data, or insert the surrogate into downstream equations; check extrapolation and functional behavior beyond the training regime.
   - *Iteration gate*:
     - If Layer 1 fails, revise the mapping or constraint enforcement before scaling.
     - If Layer 2 fails, exclude the mechanism or weaken the claim and design a sharper test.
     - If Layer 3 fails, strengthen regularization, reduce model freedom, or improve coverage.
     - If Layer 4 fails, inspect intermediate representations and derivative structure before attributing failure to the downstream model.

5. **Analysis and claim bounding**
   - Aggregate results by regime (e.g., in-distribution, limited data, extrapolation, perturbation).
   - Compare mechanisms, not only aggregate scores; use ablations to determine which component explains performance.
   - Separate evidence from inference: label each result as validated, provisional, inferred, or failed.
   - *Decision gate*: If gains are confounded by model size, optimizer settings, data splits, tuning budgets, or data density, stop and control before drawing conclusions.

6. **Iteration or redesign**
   - Update hypotheses based on controlled evidence: promote, weaken, reject, or refine.
   - If a simpler constrained variant performs similarly to a complex one, prefer the simpler model and document the reduction.
   - If results depend on a narrow setting, define it as a boundary condition and test nearby cases before generalizing.
   - *Stop condition*: Stop when the hypothesis is falsified, validated under stated boundaries, or when further iteration requires unsupported assumptions.

## Output Format

When using this skill, produce:

1. **Ranked hypotheses** — Candidate mechanisms with evidence strength, assumptions, predicted signatures, and failure modes.
2. **Study plan** — Scope, gap analysis, constraint formalization, and intended validation ladder.
3. **Validation plan** — Experimental arms, variables, controls, metrics, and stopping conditions.
4. **Control table** — Baselines, ablations, positive controls, negative controls, and their expected outcomes.
5. **Analysis plan** — Regime-wise aggregation, residual inspection, mechanism attribution, and uncertainty quantification.
6. **Claim boundary** — What is validated, what is provisional, what is inferred, and where extrapolation is unsupported.
7. **Failure modes** — Documented risks and how they would be detected.

## Validation Gates

- **Scope gate**: Target class and constraints are formally defined; universal claims are excluded.
- **Hypothesis gate**: Every candidate is falsifiable and includes a minimal viable test.
- **Control gate**: Positive, negative, ablation, and strong baseline controls are designed before execution.
- **Correctness gate**: Layer 1 (mapping and constraint satisfaction) passes before Layer 2 begins.
- **Mechanism gate**: Gains are attributed to the proposed mechanism, not confounded by capacity or tuning.
- **Robustness gate**: Results survive sensitivity checks across seeds, splits, or perturbations.
- **Extrapolation gate**: Downstream or real-data claims are labeled separately from synthetic validation.

## Claim Boundaries

- **Validated**: Claims supported by direct comparison against strong controls in the tested regime.
- **Provisional**: Claims supported by mechanism analogy or partial validation, pending further testing.
- **Inferred**: Claims generated by the agent for a new system class, explicitly labeled as hypotheses.
- **Excluded**: Claims about untested regimes, safety-critical deployment, or operational use without domain review.

Do not present single-source evidence as field consensus. Do not extrapolate beyond stated symmetry, data, or system-class boundaries.

## Failure Modes

- **Invalid mapping**: The surrogate or mechanism does not preserve required constraints or limiting cases.
- **Confounded gains**: Performance improvements arise from tuning, capacity, data leakage, or density artifacts rather than the proposed mechanism.
- **Spurious mechanism**: Negative controls succeed or the mechanism performs similarly to a corrupted or removed version.
- **Narrow regime dependence**: Results hold only for one dataset, topology, loading mode, or instance family.
- **Implementation artifact**: Numerical instability, non-idealities, or preprocessing choices create illusory agreement.
- **Overstated extrapolation**: Downstream or real-world claims are made without layered validation.
- **Non-identifiability**: Hidden variables, degenerate parameters, or weak observability prevent mechanism discrimination.

## Validity Checks

Before finalizing conclusions, verify:

- **Confounding**: Representation or mechanism changes are not confounded with model size, optimizer, regularization, or data splits.
- **Baseline strength**: Comparisons include a dominant baseline and a close ablation, not only weak or random baselines.
- **Reproducibility**: Data provenance, preprocessing, split rules, seeds, software versions, and evaluation scripts are recorded.
- **Statistical validity**: Repeated sampling, independent test sets, uncertainty estimates, and appropriate tests are used; avoid decisive conclusions from a single curve or benchmark.
- **Constraint validity**: Physical or mathematical constraints are checked independently of predictive error.
- **Boundary conditions**: Applicable regimes are stated explicitly, including symmetry assumptions, data coverage, and deformation or interaction ranges.
- **External validity**: Source-paper evidence, literature support, and agent-generated inferences are labeled separately.

## Provenance

This workflow was synthesized from cluster 18.0 (symmetry-guided mechanism discovery and validation). Source skills that informed the merged route include:

- `polyconvex-principal-stretch-constitutive-models`
- `physics-consistent-dynamics-surrogate-design`
- `cnn-architecture-performance-research-design`
- `interpretable-rbm-inverse-ising`
- `stochastic-quantum-emulation-research`
- `derivative-consistent-potential-learning`
- `qubo-aqml-heuristic-search-workflow`
- `cortical-microcircuit-research-design`

No specific paper conclusions, numerical results, or operational protocols are carried into the reusable body.
