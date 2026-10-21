---
name: sci-neuro-optimization-quantum-sat-inspired-mechanism-d-5f6ee476
description: End-to-end workflow for discovering, discriminating, and validating solver mechanisms across optimization, SAT, and quantum-inspired search landscapes through controlled benchmarking and iterative claim bounding.
scienceevolve-title: "Neuromorphic computing and Ising optimization · optimization quantum sat inspired mechanism discovery workflow"
scienceevolve-area: neuromorphic-computing-and-ising-optimization
---

# Purpose

This skill guides the end-to-end discovery and validation of computational mechanisms—such as search moves, dynamical perturbations, or structural reformulations—across discrete optimization, satisfiability, and quantum-inspired search landscapes. It enforces mechanism-first evidence, strong controlled benchmarking, and iterative claim bounding.

# When to use

Use when proposing or evaluating a new solver mechanism, heuristic modification, encoding reformulation, or landscape-aware strategy in domains including physics-inspired heuristics, SAT/SMT search, rugged optimization, accelerator benchmarking, and planted or hidden-solution benchmark design. Do not use for general solver tutorials, deployment guarantees, or uncontrolled performance marketing.

# Inputs required

- **Target problem class and representation**: e.g., binary quadratic, CNF, Ising, or constraint satisfaction.
- **Candidate mechanism and structural target**: the intended move, perturbation, or reformulation and the landscape feature it addresses.
- **Baseline methods**: generic, mechanism-matched, and strong domain-specific baselines for fair comparison.
- **Benchmark instance families**: diagnostic, transfer, and negative-control regimes with verifiable properties.
- **Evaluation metrics and success criteria**: solution quality, success probability, time-to-target, robustness, or convergence behavior.
- **Resource and reproducibility constraints**: compute budgets, hardware assumptions, and documentation standards.

# Core Workflow

1. **Bottleneck and Gap Identification**
   - Isolate the computational bottleneck and identify the evaluation gap in existing evidence.

2. **Mechanism–Structure Mapping**
   - Link the candidate mechanism to specific landscape features.
   - Define the causal chain: if mechanism M acts on feature F, then observable behavior B should change.

3. **Hypothesis Generation and Ranking**
   - Formulate at least two falsifiable hypotheses, including one predicting no advantage or worse performance under boundary conditions.
   - Label evidence strength (high, medium, low, speculative), state assumptions, and list failure modes.
   - **Decision Gate**: Are hypotheses bounded, falsifiable, and linked to observable diagnostics? If not, refine scope.

4. **Benchmark and Control Design**
   - Select diagnostic, transfer, and negative-control instance families.
   - Define strong baselines, positive controls, negative controls, and ablation variants.
   - Pre-register analysis rules, stopping criteria, and resource limits.
   - **Decision Gate**: Do controls isolate the mechanism from implementation artifacts and tuning imbalance? If not, redesign.

5. **Mechanism-First Validation**
   - Run mechanism diagnostics before end-to-end performance tests.
   - Measure intended internal signals such as escape events, trajectory diversity, acceptance dynamics, or constraint satisfaction paths.
   - **Decision Gate**: Does the mechanism produce the expected internal signal? If no, exclude the mechanism and stop or redesign.

6. **Performance Evaluation**
   - Compare end-to-end outcomes under fair tuning and matched resource budgets.
   - Report distributions including central tendency and tails; quantify uncertainty.
   - State scaling behavior only within directly tested regions.
   - **Decision Gate**: Does the candidate outperform fair baselines with practical significance? If no, iterate or narrow the claim.

7. **Robustness and Boundary Audit**
   - Test across structural regimes, instance sizes, and random seeds.
   - Check for benchmark artifacts, leakage channels, shortcuts, and representation distortions.
   - **Decision Gate**: Are gains robust and not explained by artifacts? If no, bound the claim to the tested regime or stop.

8. **Claim Calibration and Iteration**
   - Classify evidence: mechanism demonstrated, advantage demonstrated, transfer suggested, or insufficient.
   - Update hypotheses and decide: continue, narrow, redesign, or stop.
   - **Stop Conditions**:
     - Reference quality is too uncertain to rank solvers.
     - Gains disappear after ablation or fair tuning.
     - Improvement is limited to a single narrow instance family.
     - The mechanism diagnostic does not match the claimed causal explanation.
     - Results depend on undocumented tuning or hidden configuration.

# Output Format

1. **Research Question** — A bounded mechanism-to-performance link.
2. **Hypothesis Table** — For each hypothesis: mechanism, evidence strength, key assumptions, predicted observables, and failure modes.
3. **Study Plan** — Benchmark families, controls, variables, metrics, and stopping rules.
4. **Validation Plan** — Mechanism diagnostics, performance metrics, uncertainty estimation, and scaling limits.
5. **Analysis Plan** — Aggregation strategy, heterogeneity checks, tail analysis, and artifact audit.
6. **Iteration Plan** — Rules for updating hypotheses, benchmarks, or mechanisms; explicit stop conditions.
7. **Claim Boundary Statement** — Explicit limits on generalization, tested regimes, and residual risks.

# Validation Gates

- **Mechanism isolation**: The treatment differs from controls only by the proposed mechanism or a clearly isolated component.
- **Baseline fairness**: All baselines tuned with comparable effort; tuning protocol documented.
- **Reference quality**: Exact optima, best-known bounds, and approximate references are distinguished; weak references are not used for ranking.
- **Statistical rigor**: Repeated stochastic runs, uncertainty reported, and tail behavior inspected.
- **Reproducibility**: Instance generators, seeds, versions, configurations, and analysis scripts are documented.

# Claim Boundaries

- Claims are limited to tested problem classes, instance families, structural regimes, and resource budgets.
- Scaling conclusions are restricted to directly measured regions; extrapolation is labeled as speculative.
- Mechanism claims require supporting diagnostics, not only end-to-end performance.
- Solver-relative hardness or advantage must be stated relative to tested baseline families, not as universal superiority.

# Failure Modes

- **Mechanism misidentification**: The observed effect stems from tuning, implementation shortcuts, or seed bias rather than the intended mechanism. *Response*: Require ablation and mechanism diagnostics before performance claims.
- **Benchmark artifact**: Gains are caused by instance generators, representation overhead, or leakage channels. *Response*: Audit leakage, add negative controls, and test on multiple independent generators.
- **Overfitting to narrow regimes**: Improvement holds only for one instance family or size. *Response*: Narrow the claim or expand benchmark coverage before generalizing.
- **Reference distortion**: Conclusions depend on weak or incorrect reference solutions. *Response*: Stop ranking if reference quality is uncertain; shift to residual-cost or certified-bound analysis.
- **Premature convergence**: The solver converges to invalid or low-quality states. *Response*: Validate correctness before speed; strengthen convergence diagnostics.

# Validity Checks

- **Construct validity**: Metrics measure the intended search behavior, not only implementation speed.
- **Internal validity**: Controls adequately isolate the mechanism; confounders are documented.
- **External validity**: Benchmark families include intended use cases and plausible failure cases.
- **Statistical validity**: Sample sizes and uncertainty estimates support the claim level.
- **Scaling validity**: Growth claims are bounded by tested regions.
- **Transfer validity**: Structural assumptions are checked when moving to new sizes or families.
- **Mechanistic validity**: Internal diagnostics align with the claimed causal explanation.
- **Reproducibility**: Sufficient detail is provided for independent replication.

# Provenance

- Synthesized from cluster 17.0 (end-to-end mechanism discovery and validation).
- Source skills: physics-inspired-discrete-optimization-benchmarking; fluctuation-assisted-optimization; local-search-sat-smt-research-design; heart-hpc-accelerator-research-explorer; sat-solver-benchmark-research-workflow; structure-aware-dynamical-search; planted-landscape-benchmark-design; rugged-optimization-mechanism-skill.
