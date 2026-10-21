---
name: sci-quantum-quantum-transport-criticality-topological-e-54ffe9c2
description: An end-to-end evidence-analysis workflow for proposing falsifiable mechanism hypotheses, executing tiered validation with positive, negative, and strong controls, and bounding claims across quantum transport, criticality, topological, and analogous model-driven research.
scienceevolve-title: "Quantum materials and condensed matter · quantum transport criticality topological evidence analysis"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

To provide a reusable, domain-agnostic workflow for auditing theoretical claims, generating falsifiable hypotheses, and validating mechanism proposals through tiered modeling and controlled comparison. It emphasizes distinguishing verified evidence from inference, propagating uncertainty, and enforcing stop conditions before claims are accepted.

## When to use

- When moving from a baseline model or single study to a new research question in quantum transport, criticality, topological matter, or analogous model-driven fields.
- When the task requires identifying hidden assumptions in a baseline framework or observable calculation.
- When designing validation plans that must separate mechanism-specific signals from numerical artifacts, background, or confounding variables.
- When the goal is claim bounding and evidence tiering rather than open-ended exploration.

## Inputs required

- Target system class and its dominant degrees of freedom.
- Baseline model or established theoretical limit against which gaps are measured.
- Candidate mechanisms and their expected observable signatures.
- Available validation tiers: minimal analytic or surrogate models, numerical solvers, experimental proxies, or public benchmarks.
- Constraints: resource bounds, symmetry requirements, conserved quantities, and safety or compliance limits.

## Core Workflow

1. **Gap & Benchmark Definition** — Articulate the observable or theoretical deficit in the baseline framework. Identify which assumptions (e.g., static limit, local response, symmetry constraint, scale separation) are candidates for relaxation.
   - *Decision gate*: Is the gap falsifiable and the benchmark reproducible? If not, refine scope or abort.

2. **Hypothesis Generation & Evidence Grading** — Formulate 3–5 mechanism hypotheses that explain the gap. Each hypothesis must state a causal chain, a primary observable prediction, and a failure mode. Grade evidence strength as strong (independent verification), medium (single-model or analogy), or weak (conjectural).
   - *Decision gate*: Do at least two hypotheses make mutually distinguishable predictions? If not, redesign proxies or controls.

3. **Minimal Validation Design** — Define a minimal feasible validation using positive controls (known behavior recovery), negative controls (mechanism deactivated), and strong controls (alternative mechanism producing similar output). Specify independent variables, response metrics, and stop conditions.
   - *Decision gate*: Can the protocol discriminate the top-ranked hypothesis from its nearest competitor with available resources? If not, reduce complexity or pivot.

4. **Tiered Model Construction** — Build a minimal surrogate model that isolates the mechanism, then a higher-fidelity model that relaxes idealizations. Ensure both share a common set of auditables (conservation laws, symmetry checks, convergence criteria).
   - *Decision gate*: Does the minimal model predict the correct direction of change? If not, revisit the causal chain before investing in high-fidelity runs.

5. **Execution & Controlled Observation** — Run the validation protocol. Record inputs, random seeds, discretization, boundary conditions, and preprocessing steps. Execute controls in parallel with the target scenario.
   - *Decision gate*: Do positive controls pass and negative controls fail as expected? If not, halt to debug the pipeline before interpreting target results.

6. **Mechanism Audit & Residual Analysis** — Decompose outputs into predicted, baseline, and residual components. Propagate uncertainties from measurement, discretization, model form, and parameter priors. Test whether the residual pattern matches the mechanism signature or indicates confounding.
   - *Decision gate*: Does the mechanism-induced signal exceed the combined uncertainty envelope? If not, stop and report inconclusive.

7. **Claim Bounding & Evidence Mapping** — Classify each conclusion into tiers: (i) reproduced benchmark, (ii) data-supported inference, (iii) model-dependent extrapolation, (iv) unverified hypothesis. Bound the domain of validity (parameter range, symmetry class, size or scale).
   - *Decision gate*: Is the claim supported by at least two independent diagnostics or by agreement between minimal and high-fidelity tiers? If not, downgrade the claim tier.

8. **Iteration or Termination** —
   - *If* the claim is downgraded or a control fails, return to Stage 2 (hypothesis reformulation) or Stage 4 (model refinement) with updated priors.
   - *If* the claim converges across tiers and controls, archive the evidence map and validation log.
   - *Stop conditions*: hypothesis falsified by negative control; resource bound reached; uncertainty dominates signal; safety or compliance boundary encountered; or no remaining discriminable hypotheses.

## Output Format

1. **Research Question** — One-sentence definition of the gap and its significance.
2. **Evidence Map** — Tiered inventory: reproduced benchmarks, supported inferences, model extrapolations, and unverified hypotheses.
3. **Ranked Hypotheses** — 3–5 entries with mechanism statement, evidence grade, key assumptions, predicted signature, and failure mode.
4. **Validation Plan** — Minimal feasible protocol with positive, negative, and strong controls; variables; metrics; and stop conditions.
5. **Analysis Plan** — Decomposition strategy, residual diagnostics, uncertainty propagation, and convergence checks.
6. **Iteration Log** — Decision-gate outcomes, model updates, and claim-tier revisions.
7. **Validity & Safety Notes** — Confounders, reproducibility requirements, extrapolation boundaries, and compliance limits.

## Validation Gates

- **Falsifiability Gate (Stage 2)**: Every hypothesis must have at least one observable outcome that would refute it.
- **Discrimination Gate (Stage 3)**: The validation protocol must produce different expected outcomes for the leading hypothesis and its closest competitor.
- **Calibration Gate (Stage 5)**: Positive and negative controls must behave as expected before target results are interpreted.
- **Significance Gate (Stage 6)**: The signal attributed to the candidate mechanism must exceed the quadrature sum of statistical and systematic uncertainties.
- **Triangulation Gate (Stage 7)**: Claims of mechanism discovery require agreement between two independent model tiers, diagnostics, or data sets.

## Claim Boundaries

- **Benchmark Reproduction**: Statements that recover known limits or published benchmarks; lowest claim tier, required for calibration.
- **Data-Supported Inference**: Conclusions directly constrained by observations within the sampled domain; may still be model-dependent.
- **Model Extrapolation**: Predictions outside the sampled domain or relying on untested approximations; must be flagged as inference, not fact.
- **Unverified Hypothesis**: Conjectures that remain after all controls; must not be presented as findings.

## Failure Modes

- **False Positive**: A signal appears because of numerical artifact, background, or confounding variable rather than the proposed mechanism. Mitigated by negative controls and independent solvers.
- **False Negative**: A real mechanism is missed because the proxy observable is insensitive or the control design is too aggressive. Mitigated by multi-proxy design.
- **Model Boundary Violation**: Conclusions are drawn outside the regime where the minimal or high-fidelity model is valid. Mitigated by explicit validity checks.
- **Implementation Error**: Code, unit, or normalization mistakes masquerade as physical effects. Mitigated by positive controls and cross-checks.
- **Overfitting**: The model is tuned to match a single realization or data set. Mitigated by hold-out tests and uncertainty propagation.

## Validity Checks

- **Confounders**: Enumerate variables that could mimic or mask the target mechanism (e.g., finite-size effects, boundary artifacts, numerical dispersion, background signals, competing interactions).
- **Reproducibility**: Require versioned inputs, random seeds, solver settings, convergence thresholds, and preprocessing scripts to be logged.
- **Convergence & Sensitivity**: Report mesh or discretization convergence, parameter sensitivity, and finite-size scaling where applicable.
- **Statistical Rigor**: Distinguish between noise, systematic drift, and mechanism-induced trends; avoid treating single realizations as universal.
- **Extrapolation Limits**: State explicitly the parameter ranges, symmetry classes, and scale regimes for which claims hold; flag any cross-material or cross-platform extension as requiring re-validation.

## Provenance

- Derived from cluster 103 / subcluster 103.0 ("end-to-end evidence analysis and claim audit").
- Synthesized from source skills: plasmonic-slender-ring-exploration, dynamic-rkky-topological-spin-exploration, warm-dense-matter-opacity-exploration, photonic-crystal-low-frequency-dispersion-exploration, self-modulated-beam-exploration, nanoscale-dielectric-electrolyte-workflow, cold-atom-hubbard-phase-exploration, dark-matter-reflection-research-workflow.
- No specific paper conclusions, material parameters, or operational protocols are carried forward from the source skills.
