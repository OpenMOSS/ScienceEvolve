---
name: sci-neuro-physics-constrained-surrogate-validation-work-91457217
description: End-to-end research workflow for designing, validating, and iteratively refining physics-constrained surrogate models through controlled comparison, symmetry-aware diagnostics, and claim-bounded analysis.
scienceevolve-title: "Neuromorphic computing and Ising optimization · physics constrained surrogate validation workflow"
scienceevolve-area: neuromorphic-computing-and-ising-optimization
---

# Purpose

Turn partial mechanistic knowledge and sparse or noisy observations into a disciplined, reusable research workflow for physics-constrained surrogate models. The goal is to help an agent generate mechanism-grounded hypotheses, design controlled comparisons that isolate the contribution of physical constraints and symmetries, validate through multi-objective diagnostics, and iterate based on structured failure modes—while rigorously bounding scientific claims.

# When to use

Use this skill when the user asks to:

- Design or critique a research plan for a system where known governing laws, conservation principles, symmetries, or boundary constraints must be combined with learned surrogates, reduced-order models, or neural approximations.
- Compare hybrid physics-constrained surrogates against pure-physics, pure-data, or unconstrained baselines.
- Diagnose why a surrogate fails to satisfy invariants, generalizes poorly, or produces physically inadmissible states.
- Plan forward prediction, inverse inference, latent-state reconstruction, or uncertainty-quantification studies under data scarcity.
- Explore symmetry-breaking, order-parameter, or solution-space structure in high-dimensional learning problems.

Do not use this skill for operational deployment instructions, executable experimental protocols, routine literature summaries, or claims that a single benchmark result constitutes field-wide consensus.

# Inputs required

Before producing a research plan, ask for or infer:

- **Target system and scientific question:** domain, phenomenon, and whether the task is forward, inverse, or mixed.
- **Known constraints and symmetries:** governing equations, conservation laws, invariants, boundary/initial conditions, and admissible state ranges.
- **Observations:** provenance, coverage, noise, missingness, and measurement limits.
- **Candidate surrogate role:** representation compressor, initializer, surrogate stepping model, regularizer, or uncertainty estimator.
- **Baselines:** trusted numerical solvers, established surrogates, or purely data-driven models.
- **Evaluation priorities:** accuracy, residual satisfaction, constraint preservation, stability, robustness, identifiability, computational cost, or uncertainty calibration.
- **Safety, ethics, and compute boundaries:** data governance, risk context, and resource limits.

If critical inputs are missing, state assumptions explicitly, mark them as uncertain, and design a minimal validation step to test them.

# Core Workflow

Follow this ordered route. At each decision gate, pause and verify the criterion before proceeding.

## 1. Gap and mechanism mapping
- Define the research question as a contrast between mechanisms, model families, or regimes.
- Separate four components: known mechanism, learned/surrogate component, observed evidence, and unknown uncertainty.
- Identify which constraints are exact, approximate, statistical, or diagnostic-only.
- Map symmetry or invariant structures that must be preserved.

## 2. Hypothesis generation
- Produce at least three falsifiable hypotheses:
  - **Baseline (null/symmetric):** the simplest explanation without the proposed constraint or structure.
  - **Structured alternative:** the minimal mechanism that explains expected failure of the baseline.
  - **Higher-order alternative:** only if the first alternative is insufficient.
- For each hypothesis, record:
  - Concise mechanistic claim.
  - Evidence strength (strong, moderate, weak, speculative).
  - Key assumptions.
  - Predicted diagnostic signature (residual pattern, order parameter, stability metric).
  - Likely failure mode.
  - Minimal discriminating test.

**Decision Gate 1 — Hypothesis Readiness:**  
Pass if every hypothesis specifies what would weaken or reject it and separates existence of solutions from algorithmic discoverability. Otherwise, refine.

## 3. Controlled experimental design
- **Define tasks:** forecasting, reconstruction, surrogate stepping, hybrid initialization, inverse inference, or uncertainty quantification.
- **Select model families:**
  - Unconstrained data-driven baseline.
  - Soft-constrained model (physics in loss or prior).
  - Hard-constrained or symmetry-aware model (invariants built into architecture or coordinates).
  - Trusted physics-based reference for ground-truth comparison.
- **Specify variables:** observation density, noise, constraint strength, domain shift, and initialization.
- **Construct controls:**
  - Strong control: relevant established solver or model.
  - Negative control: remove or weaken the proposed constraint.
  - Positive control: benchmark with known behavior.
  - Ablation control: remove one mechanism term at a time.
  - Boundary control: include edges and interfaces where violations typically appear.
- **Predefine metrics:** data-fit error, constraint residual, invariant drift, stability under repeated use, robustness to noise/sparsity, inverse-parameter identifiability, uncertainty calibration, and computational cost.
- **Set stopping conditions before running:** e.g., non-convergent training, constraint violation in decision-relevant regions, negative-control success, or instability across seeds.

## 4. Minimal viable validation
- Run a prototype on a low-dimensional or synthetic case with known behavior.
- Verify that diagnostics respond to the mechanism and that implementation errors do not dominate.

**Decision Gate 2 — Prototype Viability:**  
Pass if the diagnostic distinguishes the structured model from the baseline. If not, redesign the representation, metrics, or prototype problem.

## 5. Stress-test and simulation validation
- Execute the study on the target difficulty (stiffness, sharp gradients, sparse observations, domain shift).
- Collect orthogonal evidence: prediction error, residual error, constraint violation, boundary error, and reference agreement.
- Track behavior under multi-step or repeated use if applicable.

## 6. Layered analysis
Analyze in this order:
1. **Observation layer:** residual structure, noise association, missing-data impact.
2. **Mechanism layer:** which constraints/symmetries are satisfied or violated; whether violations indicate misspecification.
3. **Learning layer:** train vs. validation vs. held-out gaps; overfitting or shortcut learning.
4. **Coupling layer:** ablation contribution of each objective term or constraint.
5. **Transfer layer:** degradation under geometry, parameter, or boundary-condition shift.
6. **Interpretation layer:** distinguish verified reconstruction from plausible but underdetermined explanation.

**Decision Gate 3 — Mechanism Specificity:**  
Pass if improvement vanishes or degrades systematically when the proposed constraint/symmetry is ablated. If not, redesign controls to isolate confounders.

## 7. Robustness and uncertainty quantification
- Repeat across random seeds, initializations, data realizations, and reasonable perturbations.
- Quantify variability, sensitivity, and uncertainty for decision-relevant predictions.
- Inspect whether errors concentrate near boundaries, transitions, or poorly constrained regions.

**Decision Gate 4 — Robustness Gate:**  
Pass if conclusions are stable across seeds and perturbations. If unstable, stop mechanistic claims and address conditioning or regularization.

## 8. Claim bounding and iteration
- Classify the outcome:
  - Accurate and physically consistent → broaden held-out tests.
  - Accurate but physically inconsistent → strengthen hard constraints or output parameterization.
  - Physically consistent but inaccurate → improve data coverage, inputs, or model capacity.
  - Unstable under repeated use → redesign for multi-step objectives or hybrid correction.
- Update hypothesis evidence strength and record invalidated assumptions.
- Decide: continue, revise, or stop based on pre-specified criteria.

**Global Stop Conditions:**  
- Hard constraints are violated in decision-relevant regions.
- Held-out performance contradicts training performance.
- Inferred parameters are non-identifiable.
- Negative controls reproduce the target signal.
- Results depend strongly on arbitrary choices or single random seeds.
- Uncertainty is too large for the intended use.
- Safety, ethics, or compliance boundaries are breached.

# Output Format

When using this skill, produce:

1. **Research question:** concise, testable statement of the inverse/forward gap.
2. **Task type:** forward prediction, inverse inference, latent-state reconstruction, uncertainty quantification, or comparison study.
3. **Mechanism map:** known constraints, learned components, observations, unknowns, and symmetry/invariant structure.
4. **Candidate hypotheses table:** claim, evidence strength, key assumptions, predicted signature, likely failure mode, and discriminating test.
5. **Experimental design:** tasks, model families, variables, controls, metrics, and stopping conditions.
6. **Analysis plan:** residual checks, held-out validation, sensitivity analysis, uncertainty analysis, and failure localization.
7. **Iteration log:** result classification, hypothesis updates, and next minimal experiment.
8. **Validity and safety checks:** confounders, reproducibility risks, ethics boundaries, and extrapolation limits.
9. **Evidence-status summary:** what is paper-supported, agent-inferred, and unverified.

# Validation Gates

| Gate | Criterion | Pass Action | Fail Action |
|------|-----------|-------------|-------------|
| Hypothesis Readiness | Every hypothesis is falsifiable and separates existence from discoverability. | Proceed to experimental design. | Refine hypotheses and assumptions. |
| Prototype Viability | Diagnostics distinguish structured model from baseline on a simple case. | Proceed to stress-test. | Redesign representation or metrics. |
| Mechanism Specificity | Improvement degrades when proposed constraint/symmetry is ablated. | Proceed to robustness checks. | Redesign controls to isolate confounders. |
| Robustness | Conclusions are stable across seeds, splits, and perturbations. | Proceed to claim bounding. | Stop mechanistic claims; address instability. |
| Claim Bounding | Claims are explicitly scoped to tested regimes and evidence levels. | Finalize output. | Narrow claims and define untested boundaries. |

# Claim Boundaries

- Distinguish **paper-supported patterns** (indirect surrogate modeling, hierarchical symmetry breaking, stability checks) from **agent-inferred hypotheses** specific to the new system.
- State the **validity regime** explicitly: equation class, dimensionality, data distribution, symmetry assumptions, and asymptotic limits.
- Do not extrapolate beyond the tested operating regime without additional evidence.
- Separate **existence of feasible solutions** from **algorithmic discoverability** by standard training or optimization.
- Treat analytical predictions that rely on asymptotics, self-averaging, or simplified data assumptions as heuristic until numerically validated.

# Failure Modes

- **Invariant violation with low error:** the surrogate appears accurate under a global metric while violating exact physical or symmetry constraints.
- **Residual blindness:** low governing-equation residual hides poor field-level accuracy, boundary errors, or hidden leakage from full-field labels.
- **Metric gaming:** constraint satisfaction is achieved via overfitting or a metric that masks local failures.
- **Non-identifiability:** inverse parameters or latent states cannot be uniquely recovered from available observations.
- **Domain-shift collapse:** performance degrades catastrophically under geometry, parameter, or boundary-condition shifts.
- **Optimization misattribution:** training failure is interpreted as mechanistic infeasibility rather than poor conditioning or initialization.
- **Symmetry artifacts:** apparent symmetry breaking is an artifact of finite size, random seeds, or discretization rather than a true physical effect.

# Validity Checks

Before finalizing any plan or claim, verify:

- **Confounding:** Are architecture size, sampling density, compute budget, data splits, or preprocessing matched across comparisons?
- **Reproducibility:** Are benchmarks, metrics, splits, seeds, and reporting conventions documented?
- **Statistical validity:** Are conclusions supported by repeated runs, uncertainty intervals, or equivalent diagnostics?
- **Boundary and discretization consistency:** Are constraints evaluated in the same representation used by the trusted solver?
- **Mechanism specificity:** Does an ablation or diagnostic isolate the proposed physics constraint or symmetry?
- **External validity:** Is the target domain sufficiently similar to the evidence base?
- **Extrapolation discipline:** Are claims limited to regimes, observables, and boundary conditions actually tested?
- **Consensus discipline:** Are single-paper or single-benchmark findings distinguished from field-wide conclusions?

# Provenance

- Synthesized from cluster **10.0** (workflow archetype: *symmetry-guided model validation and comparison*).
- Derived from source skills: `physics-constrained-inverse-research`, `physics-informed-scientific-machine-learning-research`, `physics-constrained-mhd-surrogate-research`, `neural-network-solution-space-exploration`, `pinn-scientific-ml-research-workflow`, `pinn-physical-constraint-research`, `physics-informed-random-feature-dynamics`, `replica-theory-research-design`.
- Paper-specific systems, numerical parameters, benchmark outcomes, and operational protocols have been removed to produce a reusable, domain-agnostic workflow.
