---
name: sci-fiber-symmetry-guided-mechanism-discovery-workflow-aa488713
description: Design reusable end-to-end research workflows for discovering and validating microscopic mechanisms in quantum, topological, correlated, and complex material systems using symmetry-aware minimal models and layered controls.
scienceevolve-title: "Fiber composites and battery materials · symmetry guided mechanism discovery workflow 4"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Use this skill to generate new research questions and design end-to-end validation workflows for quantum, topological, correlated, and complex material systems. The goal is to move from an unresolved anomaly or baseline-model discrepancy to a discriminating, mechanism-centered research plan using symmetry-aware minimal models, layered controls, and iterative hypothesis refinement.

# When to use

- The user asks for new research questions, hypotheses, or validation designs in quantum materials, topological systems, correlated phases, polymers, or other complex solids.
- A baseline model leaves unexplained spectral, transport, structural, or response anomalies.
- The task requires distinguishing candidate microscopic mechanisms using symmetry, effective models, and controlled comparisons rather than reproducing a specific paper's results.
- The user needs an iteration plan with explicit decision gates, stop conditions, and claim boundaries.

# Inputs required

Collect or infer the following before drafting the workflow:

- **Target system class**: relevant symmetries, dimensionality, and degrees of freedom (electronic, structural, magnetic, photonic).
- **Baseline model**: the current theoretical or computational framework and its observed failure or anomaly.
- **Candidate mechanisms**: competing orders, soft modes, topological transitions, correlation effects, coupling/filling interplay, or environmental modifications.
- **Available observables**: spectral, transport, spatial, response, or order-parameter diagnostics.
- **Validation capacity**: computational methods, theoretical tools, or experimental constraints accessible to the user.
- **Safety and ethics boundaries**: institutional review, hazardous material limits, and compliance constraints.

# Core Workflow

Follow this ordered route. At each decision gate, choose the indicated path or stop.

1. **Frame the anomaly as a mechanism gap**
   - Define the measurable mismatch between baseline expectation and observation.
   - State why existing explanations are insufficient.
   - **Gate 1 — Reproducibility**: Is the anomaly stable across independent runs, samples, or initial conditions and outside baseline uncertainty?
     - *No*: Stop. Diagnose artifacts, convergence, calibration, or normalization issues before proceeding.
     - *Yes*: Proceed to hypothesis generation.

2. **Generate ranked hypotheses**
   - Produce at least three hypotheses for every research question:
     - **Mechanistic hypothesis**: how a microscopic variable drives the anomaly.
     - **Boundary hypothesis**: where a transition or crossover should occur across a control axis.
     - **Alternative hypothesis**: a non-mechanistic explanation (artifact, disorder, thermal effect, generic confinement, approximation error).
   - For each hypothesis record: evidence strength, key assumptions, predicted signatures, likely failure modes, and transferability boundary.
   - **Gate 2 — Falsifiability**: Can any hypothesis be tested with available resources?
     - *No*: Narrow the scope, refine the observable, or acquire baseline data; then return to this step.
     - *Yes*: Proceed to model construction.

3. **Build a symmetry-aware minimal model**
   - Identify the lowest-energy collective coordinates, order parameters, or topological invariants relevant to the anomaly.
   - Construct the simplest effective description that preserves the symmetries needed to test the leading mechanism.
   - Explicitly state all simplifying assumptions (periodicity, dimensionality, coupling hierarchy, basis truncation).
   - **Gate 3 — Baseline fidelity**: Does the minimal model reproduce the known baseline behavior when the candidate mechanism is absent?
     - *No*: Revise the model; add missing degrees of freedom or check consistency with a higher-level description.
     - *Yes*: Proceed to control design.

4. **Design discriminating controls**
   - **Negative control**: mechanism absent, all other conditions matched as closely as possible.
   - **Positive control**: known regime that validates the probe or model framework.
   - **Specificity control**: orthogonal discriminator that tests a competing mechanism expected to mimic the signature.
   - **Robustness control**: parameter sensitivity, disorder, finite-size, boundary-condition, and symmetry checks.
   - Pre-register primary metrics and decision rules before interpreting outcomes.
   - **Gate 4 — Discriminability**: Can the controls separate the candidate mechanism from confounders?
     - *No*: Redesign the observable, control axis, or minimal model; return to step 3 or 4.
     - *Yes*: Proceed to minimal viable validation.

5. **Execute minimal viable validation**
   - Run the smallest test (simulation, calculation, or conceptual experiment) that can falsify or strengthen the leading hypothesis.
   - Compare matched pairs (candidate vs. baseline) using the pre-registered pipeline.
   - **Gate 5 — Effect detection**: Does the predicted signature exceed uncertainty and survive negative controls?
     - *No*: Proceed to failure-mode analysis (step 8).
     - *Yes*: Proceed to causal analysis.

6. **Analyze through causal chains**
   - Quantify signal features with identical preprocessing across all conditions.
   - Fit reduced models; require at least one independent observable (e.g., local plus global, or spectral plus symmetry) to corroborate the mechanism.
   - Check local–global consistency: link microscopic redistribution to macroscopic phase or response changes.
   - **Gate 6 — Mechanism discrimination**: Does the candidate mechanism explain both primary and secondary metrics better than alternatives?
     - *Ambiguous*: Add an orthogonal discriminator or refine controls; return to step 4 or 5.
     - *Yes*: Proceed to iteration and boundary mapping.

7. **Iterate by evidence strength**
   - **If supported**: Broaden to related systems, geometries, or observables; search for robustness boundaries and saturation regimes.
   - **If ambiguous**: Isolate confounders, add specificity controls, or refine the minimal model.
   - **If contradicted**: Weaken or discard the hypothesis; test boundary conditions; pivot to the next-ranked hypothesis.
   - **Gate 7 — Stability**: Is the conclusion reproducible across independent conditions, model levels, or platform variants?
     - *No*: Return to step 4 or 5 with tightened controls.
     - *Yes*: Proceed to documentation.

8. **Terminate and document boundaries**
   - State explicit claim boundaries: valid system class, symmetry, energy/length scale, observable, and model window.
   - List residual failure modes and unresolved alternatives.
   - **Stop conditions** (trigger at any step):
     - Effect size falls below uncertainty or baseline variability.
     - A simpler alternative explains the data equally well or better.
     - The result depends on an uncontrolled modeling or measurement choice.
     - Validation requires unsafe, noncompliant, or unsupported extrapolation.

# Output Format

For each use of this skill, produce:

1. **Research question** — One concise question with scope and target system.
2. **Hypotheses table** — Candidate mechanism, evidence strength, key assumptions, predicted signatures, likely failure modes, and transferability boundary.
3. **Minimal model description** — Symmetry rationale, active degrees of freedom, and stated approximations.
4. **Validation plan** — Primary factor, negative control, positive control, specificity control, robustness control, metrics, and stop conditions.
5. **Analysis plan** — Preprocessing, feature extraction, model comparison, orthogonal validation, and uncertainty handling.
6. **Iteration log** — Decisions taken at each gate and planned next steps.
7. **Claim boundary statement** — What is demonstrated, inferred, or speculative.
8. **Validity and safety notes** — Confounders, reproducibility requirements, extrapolation boundaries, and compliance constraints.

# Validation Gates

- **Reproducibility gate**: The anomaly is stable across independent runs, samples, or initial conditions.
- **Mechanism-exclusion gate**: Negative and specificity controls rule out generic explanations (disorder, heating, artifacts, trivial bound states).
- **Orthogonal-evidence gate**: At least two independent observables or model levels converge on the same mechanism.
- **Robustness gate**: The qualitative conclusion survives reasonable parameter variation, finite-size scaling, and boundary-condition changes.
- **Consistency gate**: The reduced or minimal model remains consistent with a higher-level description or realistic platform model in the tested window.

# Claim Boundaries

- **Demonstrated**: Supported by controlled comparisons, orthogonal evidence, and reproducibility checks within the tested window.
- **Inferred**: Supported by model consistency and mechanistic plausibility, but not independently verified across platforms or methods.
- **Speculative**: Motivated by analogy or symmetry argument; requires minimal validation before stronger claims.
- Restrict generalization to the validated symmetry, material class, coupling regime, and observable. Do not treat single-system results as field-wide consensus.

# Failure Modes

- The anomaly is an artifact of calibration, normalization, convergence, gauge choice, or boundary conditions.
- A simpler alternative (disorder, thermal effect, generic confinement, approximation artifact, trivial bound state) explains the data.
- The predicted signature is symmetry-forbidden or below the realistic energy, length, or temperature scale of the target system.
- The minimal model fails to reproduce baseline behavior or depends on unverifiable parameters.
- Controls are indistinguishable from the candidate condition.
- The mechanism is present but the chosen observable is insensitive or confounded by platform-specific perturbations.

# Validity Checks

- **Confounding**: Distinguish the candidate mechanism from disorder, thermal effects, strain, finite-size artifacts, numerical convergence, measurement back-action, and environmental drift.
- **Symmetry**: Verify that the proposed coupling, order, or deformation is allowed and leading by symmetry; check selection rules.
- **Model discipline**: Ensure the minimal model is the simplest one that can test the mechanism without hiding the result in imposed profiles or ad hoc parameters.
- **Reproducibility**: Document initial conditions, convergence criteria, analysis definitions, random seeds, and independent repetitions.
- **Statistical validity**: Use pre-defined acceptance criteria, uncertainty estimates, and baseline variability; avoid overfitting small or noisy datasets.
- **Extrapolation**: Label cross-system transfers as hypotheses requiring re-validation; do not generalize beyond the tested energy, geometry, or platform regime.

# Provenance

- Synthesized from cluster 63.1 (symmetry-guided mechanism discovery and validation).
- Source skill references: `hhg-nqe-research-pattern`, `superconducting-vortex-exploration`, `moire-soft-mode-research`, `superconducting-resonator-research-pattern`, `first-principles-polaritonic-chemistry-research`, `coupling-filling-electronic-phase-design`, `segmented-fermi-surface-topological-research`, `artificial-quantum-lattice-simulator-design`.
- Paper-derived patterns are abstracted into a reusable workflow. No specific paper conclusions, numerical parameters, material recipes, or operational protocols are included.
