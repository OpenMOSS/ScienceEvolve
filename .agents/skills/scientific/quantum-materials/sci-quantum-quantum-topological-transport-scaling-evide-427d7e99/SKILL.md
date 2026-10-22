---
name: sci-quantum-quantum-topological-transport-scaling-evide-427d7e99
description: End-to-end evidence analysis and claim audit workflow for quantum, topological, transport, and scaling phenomena, synthesizing hypothesis generation, controlled validation, multi-source cross-checks, and iterative claim bounding.
scienceevolve-title: "Quantum materials and condensed matter · quantum topological transport scaling evidence analysis workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Audit scientific claims and generate falsifiable hypotheses in research domains involving quantum, topological, transport, and scaling phenomena. The workflow migrates mechanism-driven reasoning across systems while enforcing strict separation of verified evidence from analogical inference.

# When to use

- When evaluating claims about emergent quantum or topological behavior, anomalous scaling, nonlinear transport, or anisotropic response.
- When reconciling conflicting theoretical, numerical, or experimental evidence across methods or platforms.
- When migrating a mechanism or claim from a source system to a new material, model, or parameter regime.
- When weak signals, late-time dynamics, finite-size effects, or numerical artifacts may confound interpretation.
- Not for operational fabrication, hazardous procedures, or direct experimental execution.

# Inputs required

- Target claim or phenomenon to be audited, with its proposed mechanism and scope.
- System definition: dimensionality, symmetries, conservation laws, boundary conditions, and relevant scales.
- Available evidence sources: theoretical models, simulation outputs, experimental measurements, or first-principles data.
- Baseline model that currently explains the phenomenon, plus known failures or gaps.
- Resource and safety constraints: computational budget, accessible data, and compliance boundaries.

# Core Workflow

1. **Claim Decomposition & Gap Mapping**
   - Decompose the target claim into mechanism, scale, topology, and transport components.
   - Catalog what is directly verified in source literature versus what is inferred by analogy.
   - Map domain gaps: missing cross-method validation, untested parameter ranges, or unresolved convention/scale ambiguities.
   - **Decision gate**: If the claim cannot be bounded into testable sub-claims, stop and refine the research question.

2. **Hypothesis Generation & Evidence Ranking**
   - Generate falsifiable hypotheses for each sub-claim, including at least one null or alternative explanation.
   - Rank evidence strength for each hypothesis: **High** (cross-method consistency, controlled error), **Medium** (single dominant signal, plausible mechanism), **Low** (analogy or extrapolation only).
   - Explicitly list key assumptions and failure modes for every hypothesis.
   - **Decision gate**: If no hypothesis is falsifiable with available resources, redesign the validation space or downgrade to exploratory.

3. **Validation Design with Control Hierarchy**
   - Define a minimal viable validation that targets the highest-leverage distinction between hypotheses.
   - Establish controls:
     - **Positive control**: known system where the mechanism is established.
     - **Negative control**: system or parameter set where the mechanism should be absent.
     - **Strong control**: independent method, code, or dataset testing the same prediction.
     - **Robustness control**: variation of numerical resolution, boundary conditions, finite size, disorder, or conventions.
   - Fix variables (physical, numerical, analytical) and pre-register stopping conditions before execution.
   - **Stop/Go**: If controls cannot exclude the dominant confounders identified in Step 2, halt and redesign.

4. **Multi-Source Execution & Cross-Validation**
   - Execute simulations, analyze data, or evaluate theoretical predictions according to the design.
   - Cross-validate across independent methods or platforms; require qualitative agreement before interpreting quantitative details.
   - **Decision gate**: If independent methods diverge beyond pre-defined tolerance, pause execution and audit for model mismatch, convention errors, or numerical artifacts.

5. **Robustness Audit & Confounding Check**
   - Audit numerical stability: convergence, finite-size effects, boundary contamination, resolution sensitivity, filtering or fitting-window bias.
   - Audit physical consistency: unit/scale/convention alignment, symmetry constraints, conservation laws, and disorder contributions.
   - Audit model bias: training leakage, architecture preferences, or overfitting if surrogate models are used.
   - **Decision gate**: If confounds cannot be bounded below the signal uncertainty, downgrade the claim strength and widen error bars.

6. **Claim Bounding & Iteration**
   - Bound the final claim into three tiers:
     - **Verified**: supported by direct evidence in the target system with controls.
     - **Inferred**: supported by analogy or mechanism transfer, but requiring independent confirmation.
     - **Speculative**: consistent with data but lacking falsifiable prediction or confound exclusion.
   - **Iteration rules**:
     - *Full support*: expand to adjacent parameters, larger scales, or additional observables; add stronger controls.
     - *Partial support*: refine mechanism, redesign negative/strong controls, and test alternative explanations.
     - *Unsupported*: halt physical extrapolation; prioritize methodological debugging (conventions, numerics, definitions).
     - *Inconclusive*: define required resources (resolution, statistics, independent code, new data) for the next cycle.
   - **Stop condition**: Terminate when claim boundaries are stable, confounds are quantitatively bounded, and evidence meets the pre-defined threshold set in Step 2.

# Output Format

Each invocation must produce:

1. **Research question** – bounded sub-claim under audit.
2. **Evidence map** – sources, strengths, and verified vs. inferred status.
3. **Ranked hypotheses** – with mechanisms, evidence strength, key assumptions, and failure modes.
4. **Validation design** – minimal viable validation, control hierarchy, variables, and stopping conditions.
5. **Analysis plan** – cross-method comparison, robustness checks, and uncertainty quantification.
6. **Iteration plan** – update rules for full/partial/unsupported/inconclusive outcomes.
7. **Claim boundary statement** – explicit limits on extrapolation, system scope, and uncertainty.

# Validation Gates

- Claim is decomposed into falsifiable sub-claims before hypothesis generation.
- Every hypothesis has at least one negative control and one strong control defined.
- Cross-method convergence is checked before quantitative interpretation.
- Confounders (numerical, conventional, physical) are bounded relative to signal uncertainty.
- Evidence is graded and claim tiers (verified/inferred/speculative) are explicitly separated.

# Claim Boundaries

- Do not treat single-source or single-system results as domain consensus.
- Do not extrapolate across dimensionality, symmetry, interaction strength, or disorder regimes without dedicated controls.
- Distinguish mechanism existence claims from quantitative parameter predictions.
- Mark all conclusions derived from analogy, theoretical probes, or extended parameter spaces as inferred, not verified.

# Failure Modes

- **Scale or convention error**: inconsistent units, normalization, sign conventions, or transform definitions across methods.
- **Numerical artifact**: resolution-dependent features, boundary reflection, finite-size pseudogaps, or filter/fitting-window bias.
- **Overfitting or training leakage**: spurious predictions from machine-learned models or excessive model flexibility.
- **Single-source illusion**: confirmation from only one algorithm, one dataset, or one observable.
- **Confound misattribution**: disorder, impurities, thermal effects, or initialization artifacts interpreted as target mechanism.
- **Premature extrapolation**: applying a model outside its derived validity window.

# Validity Checks

- **Consistency**: Are symmetries, conservation laws, and boundary conditions preserved across compared methods?
- **Reproducibility**: Are versions, seeds, parameters, scripts, and data provenance recorded?
- **Statistical validity**: Are error bars, confidence intervals, and sensitivity analyses reported? Is multiple-comparison risk addressed?
- **Physical validity**: Do energy scales, interaction hierarchies, and topological invariants respect structural and chemical constraints?
- **External validity**: Does the conclusion hold under variation of system size, disorder, boundary conditions, and numerical settings?

# Provenance

- Synthesized from cluster 155.0 (quantum-topological-transport-scaling-evidence-analysis-workflow).
- Source skill references: topological-hofstadter-lattice-design, constrained-system-scaling-research, complex-fixed-point-tn-workflow, thermoelectric-seebeck-research-workflow, nematic-heavy-fermion-exploration, mlip-ferroelectric-exploration-workflow, black-hole-ringdown-tail-exploration, quantum-dimer-exchange-workflow.
