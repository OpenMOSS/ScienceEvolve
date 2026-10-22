---
name: sci-neuro-physics-quantum-neural-learning-mechanism-dis-405976c8
description: End-to-end workflow for discovering and validating hidden physical mechanisms by embedding learnable components inside symmetry- and law-constrained models, with iterative claim bounding through controlled comparison and robustness gating.
scienceevolve-title: "Neuromorphic computing and Ising optimization · physics quantum neural learning mechanism discovery workflow"
scienceevolve-area: neuromorphic-computing-and-ising-optimization
---

# Purpose

Use this skill to design and execute reusable research programs that discover, discriminate, and validate candidate mechanisms in complex physical systems by embedding learnable models inside physics-constrained frameworks. It guides an agent from phenomenon framing through controlled experimentation, model comparison, and boundary-aware claim bounding, treating symmetry, conservation, and stability as first-class diagnostic tools rather than incidental constraints.

# When to use

Trigger this skill when the user needs to:

- Identify an unknown relation, closure, latent structure, or symmetry-breaking mechanism in a system governed by physical laws, conservation principles, or known invariances.
- Compare physics-integrated learning (surrogates, operators, neural ansätze, or variational structures) against unconstrained or simplified baselines.
- Validate whether a learned component captures a true mechanism or merely fits noise, artifacts, or training-set idiosyncrasies.
- Iterate a research plan based on stability, robustness, and generalization evidence across regimes.

Do not use for operational deployment instructions, safety-critical system tuning, hazardous experimental protocols, or as a substitute for domain-expert review.

# Inputs required

- **Target phenomenon and system boundary**: the behavior to explain and the scope of the abstraction.
- **Known constraints and symmetries**: governing laws, conservation rules, boundary conditions, and invariances treated as trusted structure.
- **Unknown component**: the relation, field, parameter set, latent state, or operator to be inferred.
- **Observable targets**: fields, trajectories, spectra, or summary statistics available for training and validation.
- **Baseline models**: simplest symmetric or physics-only models already considered.
- **Validation assets**: held-out instances, independent simulations, exact limits, manufactured solutions, or benchmark systems.
- **Computational and data constraints**: budget, noise level, resolution, and acceptable uncertainty.

# Core Workflow

1. **Phenomenon Framing & Abstraction**
   - Define the target mechanism, the system boundary, and the known symmetries or conservation laws.
   - State the gap between current explanations and observations.
   - *Decision gate*: Stop and refine if the phenomenon cannot be operationalized into falsifiable signatures.

2. **Baseline & Symmetry Ansatz Construction**
   - Build the simplest model that respects known constraints and reproduces limiting cases.
   - Verify numerical integrity, solver consistency, and agreement with trusted references.
   - *Stability gate*: Halt if the baseline fails known-limit tests or exhibits numerical instability; fix implementation before adding complexity.

3. **Mechanism Hypothesis Generation**
   - Generate ranked hypotheses covering mechanism, identifiability, input structure, generalization, and comparison.
   - For each, specify evidence strength, key assumptions, observable consequences, and minimal falsification test.
   - *Candidate gate*: Proceed only if at least one hypothesis is distinguishable from the baseline using available observables; otherwise expand diagnostics or narrow scope.

4. **Constrained Learning Design**
   - Embed the learnable component inside the physics-constrained framework (hard or hybrid coupling).
   - Define data-physics loss coupling, control set (positive, negative, ablation), and evaluation splits.
   - Specify stopping criteria: solver verification failure, implausible hidden-component behavior, negative-control parity, or sharp unexplained extrapolation degradation.
   - *Verification gate*: Do not execute until the forward implementation is independently checked.

5. **Controlled Execution & Diagnostics**
   - Run training or inference while collecting both physical observables and reliability diagnostics (residuals, conservation violations, sample dependence, conditioning).
   - Monitor for instability, overfitting to stochastic updates, and constraint violation.
   - *Stability gate*: If diagnostics diverge or trajectories become fragile, pause to disentangle numerical artifacts from physical effects.

6. **Model Comparison & Mechanism Discrimination**
   - Compare the constrained learner against unconstrained, soft-constraint, and ablated baselines under matched conditions.
   - Inspect hidden components for physical plausibility, smoothness, and consistency with symmetries.
   - *Mechanism-exclusion gate*: If negative controls match the constrained model, reject the mechanism claim and redesign. If ablations perform similarly, revise the mechanism hypothesis.

7. **Generalization & Boundary Mapping**
   - Evaluate interpolation first; attempt extrapolation only after interpolation success.
   - Map control dimensions (disorder, drive, resolution, noise, system size) that determine which explanation dominates.
   - *Robustness gate*: Downgrade or narrow claims if performance is sensitive to initialization, sampling, discretization, or split choice.

8. **Claim Bounding & Iteration**
   - Classify conclusions as verified, measured, inferred, or speculative.
   - Decide: keep, revise, narrow, or abandon the hypothesis.
   - *Iteration gate*: If all prior gates passed, finalize the validity domain and output. If not, return to Step 3, 4, or 2 with updated evidence.

# Output Format

Produce a structured research artifact containing:

1. **Study plan** — Research question, validity domain, and hypothesis set with evidence strength and falsification tests.
2. **Control table** — Baselines, positive/negative/ablation controls, and fairness checks.
3. **Analysis plan** — Solver audit, training trace, field/observable comparison, hidden-component audit, generalization analysis, and uncertainty quantification.
4. **Validation plan** — Minimal viable validation checklist, robustness checks, and stopping criteria.
5. **Ranked hypotheses** — Mechanism, identifiability, input-structure, generalization, and comparison hypotheses with failure modes.
6. **Claim boundary** — Explicit validity domain, extrapolation limits, and classification of each conclusion (verified / measured / inferred / speculative).
7. **Failure modes** — Documented risks: non-identifiability, confounding, overfitting, solver artifacts, symmetry leakage, and regime-dependent degradation.

# Validation Gates

- **Phenomenon gate**: The target mechanism must be expressible as a falsifiable claim with observable signatures.
- **Stability gate**: Baseline and constrained implementations must pass numerical integrity and known-limit tests before mechanistic claims are made.
- **Candidate gate**: Hypotheses must be distinguishable from the simplest symmetric baseline with the available observables.
- **Mechanism-exclusion gate**: Negative controls and ablations must not replicate the constrained model’s performance.
- **Robustness gate**: Results must survive perturbations in initialization, sampling, discretization, and held-out regime tests.
- **Iteration gate**: Claims are finalized only after boundary mapping and independent stress tests; otherwise the workflow loops.

# Claim Boundaries

- **Verified**: Reproduced by independent reference or multiple diagnostics on held-out data.
- **Measured**: Directly observed in this study under controlled conditions, but not independently reproduced.
- **Inferred**: Plausible extension beyond the tested domain, supported by mechanism reasoning but requiring further validation.
- **Speculative**: Suggested by analogy or abstraction, with no direct evidence in the current study.
- Never present a single source’s benchmark as field-wide consensus. Never extrapolate beyond the mapped validity domain without explicit uncertainty labeling.

# Failure Modes

- **Non-identifiability**: Multiple hidden mechanisms produce indistinguishable observables.
- **Confounding**: Numerical artifacts, data leakage, boundary-condition choices, or preprocessing explain the result.
- **Overfitting to noise**: The learnable component fits stochastic updates, sampling variance, or training artifacts rather than structure.
- **Solver or implementation artifact**: Apparent mechanism is an artifact of discretization, differentiation, or sensitivity error.
- **Symmetry leakage**: The model violates known invariances or conservation laws despite apparent predictive success.
- **Regime-dependent degradation**: Performance collapses outside an unexplained narrow window; extrapolation boundaries are missing.
- **False attribution**: Gains attributed to the mechanism are actually due to compute budget mismatches, model capacity, or implementation advantages.

# Validity Checks

Before finalizing any output, confirm:

- **Confounding**: Shared conditions, leakage, or numerical artifacts are ruled out by controls.
- **Identifiability**: Observables can distinguish the proposed mechanism from competing explanations.
- **Reproducibility**: Splits, seeds, model choices, computational environment, and data provenance are documented.
- **Boundary conditions**: Intended regimes and extrapolation limits are stated explicitly.
- **Statistical validity**: Held-out tests are separated from training; uncertainty or ensemble variation is reported.
- **Physical validity**: Learned components respect known constraints and avoid unphysical behavior.
- **Comparison integrity**: Matched baselines, ablations, and controls support any attribution of performance to the intended mechanism.
- **Scope integrity**: Results are framed as evidence for a methodological pattern within the mapped boundary, not as universal domain consensus.

# Provenance

- Derived from cluster 18, subcluster 18.1: symmetry-guided mechanism discovery and validation.
- Synthesized from source skills: pde-integrated-surrogate-research, solvable-abstraction-spin-glass-research, physics-constrained-adjoint-research, nqs-tvmc-stability-exploration, physics-informed-operator-exploration, md-simulation-ml-optimization-research, heuristic-optimization-solver-discovery, physics-informed-neural-exploration.
