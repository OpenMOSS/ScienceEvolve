---
name: sci-neuro-physics-surrogate-validation-workflow-3036f006
description: A reusable workflow to design, validate, and compare physics-informed machine-learning surrogates against controlled baselines while enforcing physical consistency, iterative claim bounding, and reproducible research planning.
scienceevolve-title: "Neuromorphic computing and Ising optimization · physics surrogate validation workflow"
scienceevolve-area: neuromorphic-computing-and-ising-optimization
---

# Purpose

Guide agents to design, validate, and compare machine-learning surrogates for scientific simulation and physics prediction. The workflow emphasizes physical consistency, controlled baseline comparisons, iterative hypothesis refinement, and explicit claim bounding so that surrogate outputs are treated as decision-support evidence rather than certified scientific truth.

# When to use

Use this skill when proposing research questions, hypotheses, or experiments involving physics-informed or data-driven surrogates—such as neural operators, graph neural network potentials, physics-informed neural networks, multifidelity correctors, or field-evolution surrogates—where expensive simulations, parameter-dependent equations, or large-scale atomistic workflows require triage, acceleration, or parameterization.

Do not use this skill for clinical decision-making, wet-lab protocol generation, operational hazardous procedures, safety-critical infrastructure deployment, or as a general-purpose machine-learning tutorial.

# Inputs required

Before executing the workflow, collect or infer:

- **Scientific bottleneck:** the repeated or expensive evaluation step the surrogate should support (e.g., triage, ranking, parameter sweep, multi-step rollout).
- **Governing physics:** equations, conservation laws, symmetries, invariants, or boundary rules that must be respected.
- **Candidate representation:** parameters, fields, geometry descriptors, features, or derived observables available as inputs.
- **Reference standard:** definition of labels or trusted outputs (high-fidelity solver, analytic solution, measurement, or expert annotation) and their limitations.
- **Baseline methods:** simple empirical or numerical baselines and strong recent comparators.
- **Intended use mode:** interpolation within a parameter envelope, extrapolation, out-of-distribution transfer, recursive rollout, hybrid correction, or screening.
- **Constraints:** compute budget, reproducibility requirements, acceptable uncertainty, and decision-criticality.

# Core Workflow

Execute the following stages in order. Treat each **Decision Gate** as a hard stop or redesign trigger.

1. **Frame bottleneck and decision role**
   - Define the expensive step and the exact decision the surrogate will inform.
   - **Decision Gate:** If the problem is not a repeated decision or the surrogate role is undefined, stop and restate the scope.

2. **Generate mechanism-aware hypotheses**
   - Produce at least three falsifiable hypotheses about representation, parameter conditioning, fidelity bridging, physical constraints, or scalability.
   - For each hypothesis record: evidence strength (strong/moderate/weak/speculative), key assumptions, likely failure modes, and minimal validation.
   - **Decision Gate:** If hypotheses cannot be stated in a falsifiable form, refine the research question before proceeding.

3. **Design controlled comparison matrix**
   - Define independent variables (model family, conditioning inputs, auxiliary physics information, data source), dependent variables (predictive utility, physical consistency, computational efficiency), and boundary variables (parameter regime, geometry, distribution).
   - Select controls: negative control (shuffled/irrelevant inputs), reduced control (proposed model minus the new component), strong control (capable non-physics-informed comparator with matched budget), and positive control (known valid case).
   - **Decision Gate:** If no trustworthy reference or fair baseline is available, stop and acquire one.

4. **Build data contract and separation**
   - Specify inputs, labels, auxiliary quantities, and provenance assumptions.
   - Enforce separation by trajectory, parameter instance, geometry, or initial condition—not by random split alone.
   - **Decision Gate:** Check for leakage paths (adjacent frames, overlapping parameters, feature selection using future information). If leakage is detected, redesign splits before training.

5. **Train minimal viable surrogate**
   - Start with the simplest model that can test whether useful signal exists.
   - Compare against a leakage-safe baseline under the primary task metric.
   - **Stop Condition:** If the minimal model fails to beat the baseline, stop or redesign features, labels, or data coverage.

6. **Evaluate physical consistency first**
   - Check conservation, symmetry, boundary condition satisfaction, gradient consistency, and residual behavior before optimizing aggregate accuracy.
   - **Decision Gate:** If core physical validity fails, do not proceed to scalability, efficiency, or extrapolation claims.

7. **Run strong validation and model comparison**
   - Evaluate simple baselines, strong non-physics-informed models, and physics-informed variants under an identical protocol.
   - Separate interpolation from extrapolation; test held-out parameter regimes, geometries, or time horizons.
   - Run ablations removing auxiliary physics quantities or constraints.
   - **Decision Gate:** If gains disappear under strong controls, ablations, or independent validation data, stop and revisit the hypothesis.

8. **Analyze errors by scientific consequence**
   - Decompose residuals by region (boundary, interior, sharp gradients, interfaces) and by constraint group.
   - Classify errors by consequence: wasted resources, missed candidates, misleading interpretation, or physical inconsistency.
   - Determine whether failures stem from representation limits, data coverage, simulator bias, distribution shift, or metric mismatch.

9. **Iterate or redesign**
   - If physical consistency passes but scalability fails → revise execution, communication, or workload partitioning.
   - If scalability passes but scientific validity fails → reduce the generalization claim and inspect data coverage or model capacity.
   - If a simplified adaptation performs similarly to the full model → simplify the mechanism.
   - If out-of-distribution performance drops → downgrade transfer claims and design targeted coverage studies.
   - Return to Stage 2 or 4 with updated hypotheses.
   - **Stop Condition:** Stop when the method cannot reliably improve over the raw baseline in the intended use regime, or when the agreed resource boundary is reached.

10. **Bound claims and document**
    - State the applicability domain explicitly (tested parameter ranges, geometries, regimes).
    - Label each conclusion as paper-supported, newly observed, or inferred for the proposed problem.
    - Archive metadata: data versions, splits, seeds, model family, evaluation code, and preprocessing decisions.

# Output Format

When using this skill, return a structured research plan containing:

1. **Research question** — bottleneck, decision role, and intended claim type.
2. **Hypothesis table** — at least three hypotheses with evidence strength, assumptions, failure modes, and minimal validation.
3. **Experimental plan** — variables, controls (negative, reduced, strong, positive), metrics, minimum viable validation, strong validation, and stop conditions.
4. **Analysis plan** — leakage checks, distribution checks, residual decomposition, model comparison, error stratification, and physics-consistency checks.
5. **Iteration plan** — conditions for refining features, changing models, redesigning labels, or narrowing claims.
6. **Validity and safety notes** — confounders, reproducibility requirements, boundary conditions, and non-operational safety constraints.

# Validation Gates

- **Bottleneck clarity:** The surrogate must address a repeated scientific decision, not model novelty alone.
- **Leakage safety:** Train-test separation must account for parameter overlap, trajectory adjacency, geometry similarity, and duplicate measurements.
- **Baseline fairness:** Compared models must share matched training budgets, preprocessing, and evaluation code.
- **Physics-first check:** Conservation, symmetry, boundary, and gradient requirements must be satisfied before performance or efficiency claims.
- **Control robustness:** Gains must persist against strong controls, ablations, and independent validation sets.
- **Metric-task alignment:** Ranking/triage tasks must use ranking or enrichment metrics; global correlation alone is insufficient for prioritization claims.
- **Reproducibility:** Data versions, splits, seeds, solver settings, and preprocessing must be documented.

# Claim Boundaries

- Surrogate outputs are decision-support evidence, not certified physical truth or experimental confirmation.
- Interpolation success within a tested parameter envelope does not imply extrapolation reliability.
- A model may be useful for triage or screening without being equivalent to a high-fidelity reference.
- Physics-informed architecture does not guarantee better scientific decisions; empirical validation is required.
- Do not treat a single study, benchmark, or model family as field-wide consensus.

# Failure Modes

- **Weak signal:** The available features do not contain enough structure to improve over simple baselines.
- **Leakage:** Overlapping parameters, trajectories, or geometries inflate apparent generalization.
- **Simulator bias:** Labels reflect simulator approximations rather than independent scientific validity.
- **Residual masking:** Aggregate loss hides localized physical violations near boundaries, shocks, or interfaces.
- **Distribution shift:** Performance collapses under unseen parameter regimes, geometries, or initial conditions.
- **Overfitting to benchmarks:** Standard benchmark success overestimates usefulness because of scaffold, target, or parameter overlap.
- **Metric mismatch:** Global accuracy improves while task-relevant ranking, conservation, or stability degrades.
- **Resource saturation:** Scalability gains are consumed by communication overhead or underutilization.

# Validity Checks

- **Confounding:** Verify that candidate generation, feature selection, and label construction do not favor easy regions or use future information.
- **Statistical validity:** Report variability, confidence intervals, or resampling when differences are small; avoid overclaiming point estimates.
- **Reproducibility:** Fix random seeds, archive preprocessing pipelines, and specify reference placement and held-out regions.
- **Boundary conditions:** State tested model families, scales, parameter ranges, and data distributions; do not generalize beyond them without revalidation.
- **Physical plausibility:** Require mechanism or ablation evidence before claiming that a model learned underlying physics.
- **External validity:** Distinguish source-paper evidence, literature-supported inference, and new agent inferences.

# Provenance

- Derived from cluster `10`, subcluster `10.1` (machine-learning-assisted model validation and comparison).
- Synthesized from source skills: `protein-ligand-affinity-research-exploration`, `physics-ml-surrogate-research`, `scalable-gnn-interatomic-potential-research`, `quantum-pde-multifidelity-research`, `parametric-equation-hybrid-solver-exploration`, `physics-constrained-pinn-research`, `parameter-conditioned-pinn-research`, `phase-field-surrogate-exploration`.
