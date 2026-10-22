---
name: sci-quantum-hypothesis-driven-theoretical-research-work-faf7448e
description: End-to-end reusable workflow for generating, testing, and iterating falsifiable hypotheses in theoretical and computational physics research.
scienceevolve-title: "Quantum materials and condensed matter · hypothesis driven theoretical research workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Synthesize a reusable, domain-agnostic agent instruction for end-to-end hypothesis-driven research in theoretical and computational physics. The workflow guides an agent from identifying a research gap through generating falsifiable hypotheses, designing minimal theoretical or computational validations, executing controlled analysis, and iterating based on evidence—all while enforcing strict claim boundaries and stopping conditions.

# When to use

- Trigger when the user needs to propose new research questions, generate candidate mechanisms, or design validation strategies in theoretical physics, mathematical physics, or computational modeling.
- Use when the target system can be described by effective theories, symmetry principles, response functions, geometric structures, or statistical ensembles.
- Use when the goal is to compare candidate explanations, bound their applicability, or map observable signatures, not to execute physical experiments or operational procedures.
- Do not use alone when domain consensus, experimental feasibility assessment, or observational prioritization is required; combine with independent literature review and expert judgment.
- Do not use to generate executable experimental protocols, device parameters, material recipes, or hazardous operational steps.

# Inputs required

- **Target system description**: Relevant degrees of freedom, symmetries, scale hierarchies, and known effective theories or baseline models.
- **Candidate mechanisms**: Proposed new interactions, symmetry breakings, response channels, geometric deformations, or boundary conditions.
- **Background knowledge**: Established baseline predictions, known corrections, conservation laws, and model-independent constraints.
- **Observable targets**: Computable quantities such as spectra, scattering amplitudes, correlation functions, phase shifts, stability eigenvalues, or thermodynamic indicators.
- **Uncertainty inventory**: Truncation errors, parameter ranges, numerical tolerances, model extrapolation limits, and degeneracies with background effects.
- **Validation resources**: Available symbolic or numerical tools, benchmark models, and computational boundaries.

# Core Workflow

1. **Frame the Research Question and Gap**
   - Define the target observable, the baseline theoretical expectation, and the specific deviation or unexplained feature to be addressed.
   - Classify the gap: uncalculated regime, unperformed comparison, unclear scale boundary, missing response model, or lack of unifying framework.
   - **Decision Gate DG1**: If the question requires operational experimental execution, hazardous procedures, or fabrication details, **STOP** and redirect to non-operational research design.

2. **Map Mechanisms and Generate Hypotheses**
   - Construct a causal map linking structural assumptions to the target observable.
   - Formulate 2–4 competing, falsifiable hypotheses in conditional form: *If mechanism M dominates, then change X produces observable trend Y under condition Z*.
   - Annotate each hypothesis with:
     - Evidence strength (Strong / Medium / Weak / Speculative).
     - Key assumptions (symmetries, approximations, linearity, scale separation, boundary conditions).
     - Explicit failure modes (background degeneracy, symmetry violation, instability, non-convergence, indistinguishability).
   - **Decision Gate DG2**: If no falsifiable prediction can be derived from a hypothesis, downgrade it to exploratory and narrow the scope before proceeding.

3. **Design Minimal Viable Validation (MVV)**
   - Select the highest-priority hypothesis and define the smallest theoretical or computational test capable of falsifying it.
   - Specify:
     - Independent variables (coupling constants, geometry, symmetry assumptions, boundary conditions).
     - Dependent variables (observable deviations, stability spectra, branch structures, correlation functions).
     - Controls: positive control (known limit or benchmark), negative control (mechanism disabled), strong/ablation control (alternative mechanism or representation), and background control (baseline without the new physics).
     - Evaluation metrics (consistency with symmetries, limit recovery, relative signal-to-background, numerical convergence, robustness under representation change).
     - Pre-registered stop conditions (signal indistinguishable from background, violation of consistency, parameter hypersensitivity).
   - **Decision Gate DG3**: If the MVV relies on unverified microscopic details, uncontrolled backgrounds, or violates known conservation laws or symmetries, redesign or abort.

4. **Execute Controlled Analysis**
   - Build the minimal model preserving relevant symmetries, conservation laws, and degrees of freedom.
   - Derive predictions analytically or computationally; perform multi-scale or limit analysis (asymptotic, linearized, topological, far-field, near-field).
   - Run internal consistency checks: dimensional analysis, symmetry preservation, tensor structure, and recovery of known limits.
   - **Decision Gate DG4**: If the positive control fails, or the negative control yields an unexpected non-null signal, halt to audit assumptions and implementation.

5. **Quantify, Compare, and Rank**
   - Measure the candidate effect against the baseline and alternative mechanisms.
   - Assess distinguishability: quantify whether the new contribution can be separated from background degeneracy using the chosen observable.
   - Rank hypotheses by robustness, consistency with external constraints, and clarity of falsification path.
   - **Decision Gate DG5**: If the candidate effect is degenerate with background or alternative explanations and no independent observable breaks the degeneracy, flag as non-viable and return to Step 2.

6. **Iterate or Terminate**
   - **Supported**: Upgrade evidence strength; extend to adjacent parameter regimes or combine with complementary observables; proceed to test the next hypothesis.
   - **Partially supported**: Refine the mechanism map, identify missing intermediate variables, and design a sharper MVV.
   - **Unsupported / Stop triggered**: Document the failure mode, update the constraint inventory, and either pivot to a competing hypothesis or terminate the line of inquiry.
   - **Decision Gate DG6**: If a fixed iteration budget is exhausted, or if fundamental theoretical consistency is violated, terminate and produce a bounded residual-uncertainty report.

# Output Format

The agent must produce a structured report containing:

1. **Research Question**: One-sentence definition of the new problem, target system, and observable goal.
2. **Gap Statement**: Type of gap and distinction between literature-unknown, calculation-unknown, and extrapolation-unknown.
3. **Mechanism Map**: Causal chain from assumptions to observables, with annotated boundary conditions.
4. **Hypothesis Table**: For each candidate: hypothesis statement, evidence strength, key assumptions, failure modes, minimal test, and stop conditions.
5. **Validation Design**: MVV description, variable definitions, control matrix (positive, negative, strong, background), metrics, and pre-registered stop rules.
6. **Analysis Plan**: Model construction, derivation and limit-analysis steps, consistency checks, and sensitivity analysis.
7. **Iteration Log**: Record of evidence updates, failed branches, constraint revisions, and pivot decisions.
8. **Validity Report**: Summary of confounding factors, reproducibility measures, boundary conditions, extrapolation limits, and evidence grading.
9. **Safety and Boundary Note**: Confirmation of non-operational scope and compliance with theoretical research ethics.

# Validation Gates

- **Gate 1 (Scope)**: Confirm the task is non-operational and theoretical before hypothesis generation.
- **Gate 2 (Falsifiability)**: Every hypothesis must yield at least one computable trend and one explicit negation condition.
- **Gate 3 (Consistency)**: The MVV must not violate established symmetries, conservation laws, or model-independent bounds.
- **Gate 4 (Calibration)**: Positive and negative controls must behave as expected before interpreting candidate signals.
- **Gate 5 (Distinguishability)**: A hypothesis may not advance to iteration if its signature is degenerate with all backgrounds and no breaking observable is defined.
- **Gate 6 (Termination)**: Iteration stops when consistency is broken, the budget is exhausted, or the hypothesis is robustly falsified.

# Claim Boundaries

- **Proven**: Results directly derivable from accepted symmetries, conservation laws, or independently verified benchmark models.
- **Inferred**: Extensions of verified patterns to new parameter regimes, geometries, or systems under explicitly stated analogy assumptions.
- **Speculative**: Conjectures relying on unverified microscopic details, untested model components, or extrapolation beyond validated scales.
- Never present inferred or speculative conclusions as domain consensus or observational fact. Always label the evidence tier and the negation condition that would overturn the claim.

# Failure Modes

- **Type A – Background Dominance**: The candidate effect is swamped by known backgrounds or parameter degeneracy with no independent discriminant.
- **Type B – Consistency Violation**: The hypothesis violates symmetries, conservation laws, dimensional analysis, or constraint closure upon derivation.
- **Type C – Instability or Ill-Posedness**: The model exhibits uncontrolled sensitivities to truncation, regularization, numerical scheme, or boundary conditions.
- **Type D – Non-Falsifiability**: The hypothesis can be adjusted post-hoc to match any outcome within the tested range.
- **Type E – Extrapolation Overreach**: Conclusions are drawn beyond the validated symmetry, scale, or coupling regime without re-deriving the governing structure.
- **Type F – Operational Drift**: The workflow inadvertently generates executable experimental protocols, fabrication steps, or hazardous parameters.

# Validity Checks

- **Confounding Factors**: Check for coordinate or gauge artifacts, representation dependence, hidden boundary terms, finite-size effects, and environmental or background leakage.
- **Reproducibility**: Document derivation routes, symbol conventions, approximation orders, numerical settings, and version-controlled scripts sufficient for independent audit.
- **Boundary Conditions**: Explicitly state applicability limits such as symmetry sector, dimensionality, linear versus nonlinear regime, weak versus strong coupling, and asymptotic region.
- **Statistical and Numerical Validity**: Report convergence diagnostics, error estimates, residual conservation-law drift, and cross-solver consistency; avoid presenting best-fit points without uncertainty.
- **Extrapolation Boundaries**: Label any claim extending beyond the tested parameter space as hypothetical; specify the scale or regime at which the effective description is expected to break down.
- **Consensus Boundary**: Distinguish "verified in source literature or benchmark" from "agent inference on new problem" from "unverified conjecture."

# Provenance

- Synthesized from cluster `133` / subcluster `133.0`.
- Derived from source skills: `c4b4dadb7d217717`, `e8a777af44a2e00d`, `507b9aa8fe160deb`, `069b66413840cc90`, `5477f3a49cab34d6`, `880364fe4be51b17`, `95dbbed2744156df`, `e20d07fcbbe700e2`.
- No specific paper conclusions, numerical results, material parameters, or operational protocols are reproduced in this reusable workflow body.
