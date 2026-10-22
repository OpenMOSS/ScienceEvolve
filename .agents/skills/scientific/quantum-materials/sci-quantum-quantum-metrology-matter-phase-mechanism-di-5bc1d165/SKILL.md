---
name: sci-quantum-quantum-metrology-matter-phase-mechanism-di-5bc1d165
description: A reusable end-to-end workflow for symmetry-guided mechanism discovery and validation in quantum, metrology, and matter-phase research, emphasizing hypothesis generation, controlled validation, and iterative claim bounding.
scienceevolve-title: "Quantum materials and condensed matter · quantum metrology matter phase mechanism discovery workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Guide an agent through discovering and validating physical mechanisms in quantum, condensed-matter, and metrology contexts where direct observation is limited by noise, scale separation, sign problems, or unknown order parameters. The workflow transfers a methodological pattern: frame the gap as a symmetry- or scale-dependent mechanism, generate competing hypotheses, design minimal controlled validations, and iterate while bounding claims. It does not reproduce any single paper’s conclusions or parameters.

# When to use

Use this skill when the user asks to:

- Propose research questions for phase transitions, quantum correlations, entanglement, or emergent phenomena where local diagnostics are insufficient.
- Design validation studies across simulations, effective theories, or noisy quantum systems.
- Diagnose whether an observed signal arises from a target mechanism, numerical artifact, or confounding symmetry breaking.
- Transfer methodological patterns—such as effective-field-theory calibration, reference-model universality, or configuration-space geometry—to new systems.

Do not use this skill as a domain tutorial, an operational protocol, a substitute for independent verification, or a source of field-wide consensus.

# Inputs required

Before applying the workflow, collect or request:

- **Target system class** and the specific mechanism or phase structure under investigation.
- **Known symmetries, conservation laws, and exact or controlled limits** relevant to the target.
- **Candidate observables and diagnostics** (local, nonlocal, and information-geometric where applicable).
- **Available benchmarks, reference models, or independent implementations** for cross-checking.
- **Computational or experimental constraints**, including uncertainty budgets, feasible scales, and reproducibility standards.
- **Claim distinction**: an explicit statement separating validated claims from new inferences proposed by the agent.

# Core Workflow

1. **Frame the Mechanism Gap**
   - Define the target phenomenon and why existing diagnostics are insufficient.
   - Identify hidden structures (symmetry, topology, entanglement, scale separation) that could explain the gap.
   - **Decision Gate:** If the gap cannot be operationalized into a falsifiable mechanism, stop and refine the research question.

2. **Generate Competing Hypotheses**
   - Formulate 2–5 mechanistic hypotheses with distinct causal chains, including a null/artifact hypothesis.
   - For each hypothesis, specify: claim, evidence strength (weak/moderate/strong), key assumptions, predicted signatures, and likely failure modes.
   - **Decision Gate:** If all hypotheses share the same untestable assumption, return to Step 1 and broaden the diagnostic space.

3. **Design Minimal Controlled Validation**
   - Select calibration observables (to fix parameters) and held-out validation observables (to test predictions).
   - Define positive controls (known behavior), negative controls (absence of mechanism), and orthogonal controls (different representation, ensemble, or implementation).
   - **Decision Gate:** If no independent benchmark or control exists, downgrade all claims to speculative and require a feasibility check before proceeding.

4. **Execute Symmetry-Aware Analysis**
   - Perform the primary computation, simulation, or data analysis.
   - Separate conservation, stability, and structural claims; do not conflate them.
   - Quantify uncertainty and screen for confounders (finite-size effects, boundary artifacts, autocorrelation, regulator dependence, convention choices).

5. **Mechanism Discrimination**
   - Compare results against each hypothesis using pre-defined decision rules.
   - Classify outcomes as: Supported, Partially Supported, Unsupported, or Inconclusive.
   - **Iteration Gate:** If the signal appears in negative controls or is basis/boundary-dependent, reject the target mechanism hypothesis and return to Step 2.

6. **Robustness and Scaling Audit**
   - Test stability across system sizes, regulators, fitting windows, or representation choices.
   - Check naturalness of parameters and power-counting hierarchy where applicable.
   - **Stop Condition:** If results depend qualitatively on arbitrary analysis choices, stop and document the failure mode.

7. **Update Mechanism Map and Bound Claims**
   - Revise the causal chain based on evidence.
   - Explicitly label directly validated results, inferred extensions, and speculative claims.
   - **Decision Gate:** If held-out predictions fail, narrow the claim domain or pivot to an alternative hypothesis.

8. **Archive and Iterate**
   - Document reproducibility metadata, failed controls, and boundary conditions.
   - If validation passes, expand to broader observables or larger scales; if ambiguous, add targeted ablation studies before expanding.

# Output Format

Return a structured report containing:

1. **Research question and mechanism gap** — operational definition of the target and why current diagnostics are insufficient.
2. **Ranked hypotheses table** — claim, evidence strength, key assumptions, predicted signatures, and likely failure modes.
3. **Validation plan** — variables, calibration/validation split, controls, metrics, and stop conditions.
4. **Analysis plan** — diagnostics, uncertainty treatment, robustness checks, and interpretation hierarchy.
5. **Mechanism discrimination summary** — which hypotheses are supported, weakened, rejected, or require more data.
6. **Claim boundary statement** — what is directly validated, what is inferred, and what remains speculative, with explicit validity domains.
7. **Failure modes and iteration log** — documented negative results, control failures, and planned next steps.

# Validation Gates

- **Definition consistency:** All compared implementations, ensembles, or approximations use matched definitions, cuts, and conventions.
- **Control integrity:** Positive, negative, and orthogonal controls each test a distinct assumption; no control is reused as both calibration and validation.
- **Statistical validity:** Independent runs, blocked statistics, autocorrelation checks, and explicit uncertainty propagation.
- **Mechanism specificity:** The signal is unique to the target mechanism and absent in negative or randomized controls.
- **Reproducibility:** Explicit model choices, data splits, random seeds, analysis scripts, and acceptance criteria are recorded.

# Claim Boundaries

- Distinguish directly validated results from extrapolated, interpolated, or inferred claims.
- State the domain of validity (system sizes, parameter regimes, ensembles, representations) without overgeneralization.
- Do not treat single-study or single-method agreement as field consensus.
- Label agent-inferred extensions separately from literature-validated patterns.

# Failure Modes

- Hypothesis is supported only by a proxy observable misaligned with the target mechanism.
- Signal appears in randomized or negative controls (false positive).
- Results depend qualitatively on undocumented analysis choices, conventions, or regulator parameters.
- Calibration data leak into validation targets.
- Uncertainty dominates the effect or prevents discrimination between hypotheses.
- Reference model or approximation breaks symmetries required for universality or mechanism transfer.
- Apparent convergence hides a systematic artifact not captured by the chosen diagnostics.

# Validity Checks

- **Symmetry preservation:** Does the analysis respect the symmetries required for the proposed mechanism?
- **Scale separation:** Are long-distance and short-distance scales sufficiently separated for the effective description?
- **Sampling validity:** Samples are representative, sufficiently independent, and not dominated by autocorrelation or preprocessing artifacts.
- **Numerical robustness:** Convergence, integration stability, and sensitivity to solver or algorithmic choices are confirmed.
- **Uncertainty completeness:** Scale, numerical, statistical, and model uncertainties are reported separately before combination.
- **Extrapolation boundaries:** Claims are limited to tested regimes; speculative extensions are explicitly labeled.
- **Consensus discipline:** Single-paper findings are presented as methodological evidence, not as field-wide consensus.

# Provenance

- Derived from cluster 185.0 (symmetry-guided mechanism discovery and validation).
- Synthesized from source skills: adaptive-resolution-simulation-research-workflow, interpolation-qmc-research-design, quantum-circuit-loss-sampling-research, high-energy-theory-precision-validation, configuration-space-statistical-geometry, sign-problem-reference-universality, einstein-cartan-dark-matter-research-audit, bosonic-cluster-universality-research.
- Paper-specific conclusions, parameters, numerical results, and system details have been excluded; only transferable methodological patterns are retained.
