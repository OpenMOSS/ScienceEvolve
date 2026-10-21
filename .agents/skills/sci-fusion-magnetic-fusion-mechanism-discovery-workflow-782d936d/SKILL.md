---
name: sci-fusion-magnetic-fusion-mechanism-discovery-workflow-782d936d
description: A reusable end-to-end workflow for designing hypothesis-driven mechanism discovery and validation studies in magnetic confinement fusion plasmas, from anomaly framing through model-hierarchy discrimination to iterative claim refinement.
scienceevolve-title: "Magnetic confinement fusion · magnetic fusion mechanism discovery workflow"
scienceevolve-area: magnetic-confinement-fusion
---

# Purpose

Transform an observable anomaly or multi-scale puzzle in magnetic confinement fusion into a structured, discriminating research plan. The workflow generates testable hypotheses, designs controlled numerical experiments across a model hierarchy, and iterates based on evidence without treating any single source result as field-wide consensus.

# When to use

- A user asks for new research questions in magnetic confinement fusion, including equilibrium and stability, core or edge turbulence, transport, wave-particle interaction, neoclassical effects, or control-oriented prediction.
- A user has a candidate mechanism, simulation result, diagnostic dataset, or configuration concept and wants a validation or discrimination plan.
- A user needs to choose or compare reduced fluid, kinetic, gyrokinetic, hybrid, or MHD model levels.
- A user asks how to connect core, edge, fast-particle, or control physics into a coherent mechanism study.

Do not use this skill to provide operational instructions for an active fusion device, prescribe machine settings, bypass safety review, or enable hardware modifications.

# Inputs required

- **Target system**: device class or geometry family (e.g., tokamak, stellarator, compact concept) and plasma regime.
- **Observable gap**: the mismatch or anomaly to be explained, and the primary decision to be made (mechanism discrimination, model selection, validation pathway, or extrapolation boundary).
- **Candidate mechanisms**: competing physical explanations and their expected signatures.
- **Model stack**: available equilibrium, stability, transport, kinetic, or reduced models and their known limitations.
- **Evidence baseline**: prior simulations, benchmarks, diagnostics, or literature comparisons.
- **Constraints**: computational budget, safety and compliance boundaries, and acceptable stop conditions.

If key inputs are missing, state assumptions explicitly and design a minimal validation plan that reduces the highest uncertainty first.

# Core Workflow

1. **Frame the observable gap**
   - Define the anomaly, the confinement or control context, and the decision to be made.
   - **Gate 1**: Is the gap well-defined and separable from known diagnostic or model artifacts? If no, stop and refine the question or inputs.

2. **Map candidate mechanisms**
   - List mechanism classes (e.g., equilibrium/stability boundary, resonant wave-particle interaction, micro-turbulence, edge/SOL transport, neoclassical drift, MHD mode coupling).
   - For each, state the predicted signature, the minimum model fidelity required, and a concrete falsifier.
   - **Gate 2**: Are at least two competing mechanisms identified with distinct, testable predictions? If no, broaden the mechanism search before proceeding.

3. **Formulate ranked hypotheses**
   - State falsifiable claims with mechanistic rationale.
   - Assign evidence strength: strong, moderate, weak, or speculative.
   - List key assumptions and likely failure modes.
   - Rank by discriminating value, feasibility, and relevance to the target system.

4. **Select the model hierarchy**
   - Choose the lowest-complexity model that preserves the mechanism under test.
   - Plan an escalation path (e.g., reduced → kinetic-MHD → gyrokinetic → global/nonlinear) triggered only when the current level cannot discriminate.
   - **Gate 3**: Can the leading hypotheses be discriminated at the current hierarchy level? If no, escalate fidelity and return to step 3.

5. **Design a controlled study**
   - Define independent variables that directly test the candidate mechanism.
   - Define controlled variables (geometry family, normalization, boundary conditions) to prevent unrelated changes.
   - Include controls: baseline, negative (mechanism suppressed), positive (known behavior), geometry contrast, and numerical null tests.
   - Define evaluation metrics and stop conditions before analysis.
   - **Gate 4**: Does the design isolate the target mechanism from confounders? If no, redesign variables or controls.

6. **Execute minimal viable validation**
   - Recover known limits or benchmark behavior.
   - Check numerical convergence and resolution independence.
   - Verify that controls behave as expected.
   - **Gate 5**: Do benchmarks and controls pass? If no, fix the setup before interpreting new physics.

7. **Analyze and interpret**
   - Compare trends across model levels; test causal ordering (driver → response → signature → outcome).
   - Perform sensitivity analysis on assumptions and numerical choices.
   - Label evidence as benchmarked, reproduced, inferred, or speculative.
   - **Gate 6**: Is the result stable under sensitivity checks and independent observables? If no, mark as inconclusive.

8. **Decide and iterate**
   - **If supported**: narrow the claim to the tested domain and propose the next discriminating condition.
   - **If refuted**: preserve the negative result and identify which assumption failed.
   - **If inconclusive**: redesign with cleaner controls, additional diagnostics, or higher fidelity.
   - **If model discrepancy emerges**: treat it as a prioritized upgrade signal, not a failure; diagnose missing physics and return to step 4.
   - **Stop** when the claim is robust across relevant model levels, when stop conditions are met, or when further complexity changes only secondary details.

9. **Finalize claims and boundaries**
   - State the domain of validity, extrapolation limits, and remaining competing explanations.
   - Explicitly separate the transferable method from any source-specific conclusions.

# Output Format

Return a structured research plan containing:

1. **Research question**: one sentence stating the target mechanism-focused question.
2. **Mechanism map**: table with mechanism class, predicted signature, required model fidelity, key assumption, and falsifier.
3. **Ranked hypotheses**: list with evidence strength, key assumptions, likely failure modes, and minimum viable validation.
4. **Study design**: baseline, independent variables, controls, primary and independent validation observables, evaluation metrics, and stop conditions.
5. **Analysis plan**: model-validity checks, comparison logic, sensitivity tests, and uncertainty quantification.
6. **Iteration plan**: rules for promotion, refinement, rejection, or branching based on possible outcomes.
7. **Validity and safety statement**: confounders, reproducibility needs, boundary conditions, and non-operational safety limits.

# Validation Gates

- **Gate 1 (Problem clarity)**: The observable gap is defined and separable from artifacts.
- **Gate 2 (Discriminability)**: At least two mechanisms have distinct, testable predictions.
- **Gate 3 (Model adequacy)**: The chosen hierarchy level can resolve the predicted differences.
- **Gate 4 (Design isolation)**: Variables and controls isolate the target mechanism from confounders.
- **Gate 5 (Benchmark and control integrity)**: Known limits and controls behave as expected.
- **Gate 6 (Result robustness)**: Conclusions are stable under sensitivity and independent checks.

# Claim Boundaries

- Distinguish model agreement from physical mechanism validation; agreement across models increases confidence but does not prove omitted physics is irrelevant.
- Do not treat single-device, single-code, or single-paper observations as field-wide consensus.
- Do not extrapolate beyond the tested geometry, collisionality regime, gradient range, or model class without explicit uncertainty analysis.
- Reduced metrics and proxies are screening tools, not universal predictors.
- Separate source-paper methodological patterns from agent-inferred hypotheses and unsupported extrapolations.

# Failure Modes

- Numerical artifacts (damping, resolution, convergence issues) are mistaken for physical effects.
- Mode misidentification or confusion between different spectral branches.
- Confounding from simultaneous changes in geometry, profiles, boundary conditions, or diagnostics.
- Overfitting to a single observable or benchmark while independent observables disagree.
- Extrapolation beyond model validity (e.g., local to global, linear to nonlinear) without justification.
- Compensating errors producing false agreement between models and data.

# Validity Checks

- **Confounding**: Ensure the target mechanism is separable from background gradients, diagnostic geometry, numerical noise, and overlapping physics.
- **Reproducibility**: Require independent analysis paths, convergence checks, ensemble variation, and recorded assumptions.
- **Numerical and statistical validity**: Verify resolution, quadrature, boundary treatment, and reduced-model assumptions before mechanistic claims; use uncertainty intervals.
- **Boundary conditions**: State where locality, closure, gyrokinetic ordering, or flux-surface assumptions may fail.
- **Model overfitting**: Penalize models that match one observable while worsening others; require cross-observable consistency.

# Provenance

- Synthesized from Cluster 10 / Subcluster 10.0 (observable-driven mechanism discovery and validation).
- Derived from source skills: `10.1038_nphys3744`, `10.1063_1.3033696`, `10.1063_1.859683`, `10.1073_pnas.2436390100`, `10.1017_s0022377823001174`, `10.1103_physrevlett.116.085001`, `10.1017_s0022377823001320`, `10.1088_0741-3335_57_5_054012`.
