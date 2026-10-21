---
name: sci-fusion-symmetry-guided-mechanism-discovery-workflow-75452ef3
description: Guide iterative research planning for mechanism discovery and validation in symmetry-dominated physical systems by linking reduced-model screening to high-fidelity validation through controlled hypothesis testing and trade-off analysis.
scienceevolve-title: "Magnetic confinement fusion · symmetry guided mechanism discovery workflow"
scienceevolve-area: magnetic-confinement-fusion
---

# Purpose

Guide research planning for mechanism discovery and validation in symmetry-dominated or reduced-model physical systems—such as magnetic confinement, MHD equilibrium, and related wave–particle interaction problems—where a baseline property must be preserved while testing candidate mechanisms through iterative reduced-model screening and high-fidelity validation.

# When to use

Use this skill when a user asks to:
- Propose new research questions or hypotheses in equilibrium, stability, transport, or configuration-optimization studies.
- Design computational or theoretical validation studies that compare reduced and high-fidelity models.
- Rank mechanistic hypotheses by evidence strength, falsifiability, and risk of hidden trade-offs.
- Plan iterative exploration where a surrogate model screens candidates before expensive validation.

Do not use this skill for operational device control, executable experimental procedures, hazardous hardware settings, or fabrication protocols.

# Inputs required

Before proposing a research plan, collect or infer:
- Target operating regime and primary scientific objective.
- Baseline property to preserve (e.g., symmetry quality, equilibrium consistency, confinement).
- Candidate limiting mechanisms or instability families.
- Available reduced models, high-fidelity models, and independent benchmarks.
- Design variables, constraints, and feasibility boundaries.
- Existing equilibria, datasets, or simulation infrastructure.
- Acceptable evidence threshold and resource limits.

# Core Workflow

1. **Frame the gap.** Identify why existing reduced or local models are insufficient and define the bottleneck observable linking local behavior to macroscopic outcomes.
2. **Select a tractable regime.** Choose a symmetry, asymptotic limit, or reduced representation that preserves the dominant mechanism while simplifying the system.
3. **Build the reduced model.** Express the bottleneck observable through interpretable invariants, response functions, or geometry-aware estimators; enforce known limiting cases.
4. **Generate falsifiable hypotheses.** For each candidate mechanism, state: design change, expected effect, causal pathway, evidence strength, key assumptions, likely failure modes, and transfer boundary.
5. **Design minimal viable validation.** Define baseline, positive, negative, strong, and robustness controls; select primary and secondary variables; predefine primary, mechanism, baseline-preservation, secondary-risk, feasibility, and robustness metrics.
6. **Execute reduced-model screening.** Evaluate the broad surrogate screening set; check numerical consistency and convergence.
7. **Decision Gate A — Regime validity:** Does the case lie within the reduced model’s justified domain and do known limits hold? If **no**, stop and refine assumptions or narrow the boundary.
8. **Execute high-fidelity validation.** Re-evaluate a smaller, diverse validation set with the detailed model; include sensitivity perturbations.
9. **Compare reduced and high-fidelity results.** Determine agreement, scaling behavior, sign changes, and boundary deviations.
10. **Decision Gate B — Surrogate agreement:** Do reduced and high-fidelity models agree within tolerance for the target mechanism? If **no**, diagnose whether the mismatch stems from missing physics, invalid ordering, numerical artifacts, or proxy failure; update the surrogate validity rule and return to Step 4 or Step 6.
11. **Attribute mechanism vs artifact.** Use secondary diagnostics to confirm the intended mechanism is active and distinguish it from confounding channels or numerical artifacts.
12. **Check trade-offs and secondary risks.** Verify that baseline properties remain acceptable and that improvements in one metric do not degrade stability, transport, feasibility, or robustness beyond acceptable bounds.
13. **Decision Gate C — Trade-off acceptance:** Are preserved properties and feasibility metrics acceptable? If **no**, redesign the objective balance before claiming success and return to Step 5.
14. **Update evidence and boundaries.** Revise each hypothesis’s evidence strength, applicability boundary, and failure modes based on controls and benchmarks.
15. **Decision Gate D — Stop/iterate:** Stop if convergence is demonstrated, controls succeed, the mechanistic signature is consistent, and trade-offs are acceptable. Otherwise, iterate from Step 4 with refined hypotheses or expanded validation. Predefined stop conditions include: unresolved benchmark disagreement inside the intended regime, unexplained sensitivity to numerical choices, disappearance of the mechanism-specific signature, or inability to separate the target mechanism from baseline drives.

# Output Format

1. **Research question:** A concise, testable question suitable for a new study.
2. **Hypothesis table:** Each hypothesis with evidence strength, mechanism, assumptions, failure mode, and transfer boundary.
3. **Design plan:** Baseline, controls, design variables, constraints, and metrics.
4. **Analysis plan:** Reduced-model screening, high-fidelity validation, sensitivity tests, mechanism attribution, and interpretation rules.
5. **Iteration plan:** How results update hypotheses, surrogate validity, and the next minimal test.
6. **Validity checklist:** Confounders, reproducibility checks, boundary conditions, and stop conditions.

# Validation Gates

- **Regime validity:** The proposed case lies within the reduced model’s justified asymptotic or operating domain.
- **Limit validity:** Known limiting cases are reproduced or discrepancies are explicitly explained.
- **Control validity:** Positive, negative, strong, and robustness controls isolate the target mechanism from artifacts.
- **Benchmark validity:** Independent high-fidelity validation exists for the intended use case.
- **Numerical validity:** Convergence, resolution, truncation sensitivity, and reproducibility are documented.
- **Mechanism validity:** Secondary diagnostics support the claimed causal pathway, not only the primary metric.

# Claim Boundaries

- Distinguish **demonstrated** (verified by derivation, benchmark, or independent diagnostic), **inferred** (supported by model agreement and controls), and **speculative** (extrapolated beyond validated regimes) claims.
- Do not treat single-study results as field-wide consensus.
- Do not extrapolate beyond the tested geometry, regime, or model closure unless additional independent evidence supports broader transfer.
- A desirable region that cannot be reached without crossing unacceptable constraint violations should be reported as limited evidence, not a ready design.

# Failure Modes

- **Surrogate mismatch:** Reduced and high-fidelity models disagree inside the intended regime due to missing physics or invalid closure.
- **Hidden trade-offs:** Improvement in the primary metric degrades baseline properties or activates secondary instability channels.
- **Numerical artifact:** Results depend on coordinate choice, resolution, sampling, or solver settings rather than physical mechanism.
- **Confounding mechanism:** An alternative drive or resonance explains the observed effect without the proposed mechanism.
- **Overgeneralization:** Conclusions from a narrow validation set or single configuration are presented as universal principles.
- **Proxy misattribution:** A proxy metric changes without independent confirmation that the intended mechanism is active.

# Validity Checks

- The research question is not a restatement of one paper’s specific configuration.
- Surrogate assumptions match the proposed operating regime.
- The high-fidelity validation set is independent enough to test the surrogate.
- Controls separate the target mechanism from unrelated improvements.
- Numerical resolution, convergence, and reproducibility are documented.
- Baseline properties are preserved, not sacrificed for a single metric.
- Secondary risks and competing mechanisms are evaluated.
- Accessibility from realistic starting points is considered.
- Evidence strength is assigned to each hypothesis.
- Conclusions explicitly separate demonstrated results from extrapolation.

# Provenance

- Synthesized from cluster 10, subcluster 10.1.
- Derived from source skills: `stellarator-stability-research-workflow`, `stellarator-transport-reduced-model-exploration`, `trapped-particle-near-axis-research-design`, `mhd-plasma-research-workflow`, `full-wave-plasma-rf-research-design`, `pair-plasma-research-workflow`, `finite-beta-plasma-instability-exploration`, `reduced-mhd-research-design`.
