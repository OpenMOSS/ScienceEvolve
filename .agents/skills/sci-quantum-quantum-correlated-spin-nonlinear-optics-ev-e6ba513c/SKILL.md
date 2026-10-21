---
name: sci-quantum-quantum-correlated-spin-nonlinear-optics-ev-e6ba513c
description: End-to-end evidence analysis and claim audit workflow for quantum-correlated systems, spanning hypothesis generation, computational validation design, multi-metric analysis, and iterative claim bounding.
scienceevolve-title: "Quantum materials and condensed matter · quantum correlated spin nonlinear optics evidence analysis"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Synthesize an end-to-end, reusable workflow for auditing theoretical and computational claims in quantum-correlated and complex quantum systems. It guides an agent from anomaly identification through mechanism hypothesis generation, minimal viable validation design, multi-evidence analysis, and iterative claim refinement, while strictly separating verified results from inference.

# When to use

- When investigating anomalies in quantum many-body, nuclear structure, condensed matter, or quantum materials systems where baseline models fail.
- When designing non-operational theoretical or computational validation schemes (e.g., first-principles, effective field theory, transport models, spectral analysis).
- When cross-validating claims across multiple observables, model hierarchies, or control comparisons.
- When the task requires distinguishing verified mechanisms from model-specific artifacts, numerical bias, or unsupported extrapolation.
- Not for generating executable experimental protocols, hazardous procedures, or fabrication recipes.

# Inputs required

- Target system definition: relevant degrees of freedom, symmetries, known limits, and applicable theoretical frameworks.
- Baseline models and benchmarks: established predictions, reference data, and known failure modes.
- Candidate observables: spectral, transport, structural, or correlation functions available from theory or experiment.
- Constraints: computational resources, acceptable approximations, model boundaries, and safety/ethical limits.
- Prior evidence corpus: literature trends, independent datasets, or cross-method comparisons.

# Core Workflow

1. **Scope and Gap Definition**
   - Define the target system's boundaries and the baseline model's domain of validity.
   - Identify anomalies: deviations between baseline predictions and trusted data/benchmarks across multiple observables.
   - **Decision Gate A**: If no anomaly is identified or the system lies entirely within the baseline regime, stop and report that claim audit is unnecessary.

2. **Mechanism Hypothesis Generation**
   - Decompose the anomaly into candidate microscopic mechanisms (e.g., coupling channels, fluctuation spectra, continuum effects, disorder, or symmetry changes).
   - For each candidate, construct a causal chain linking microscopic cause to observable effect.
   - Assign evidence strength: High (multiple independent observables/methods), Medium (single observable or model consistency), Low (analogy or extrapolation).
   - Explicitly list key assumptions and predicted failure modes for each hypothesis.
   - **Decision Gate B**: If no falsifiable hypothesis can be formulated, stop and flag the gap as currently unaddressable.

3. **Validation Design**
   - Define a minimal viable verification: the simplest model or dataset that can test the core mechanism.
   - Establish control hierarchy:
     - **Baseline control**: standard model or literature benchmark.
     - **Positive control**: known limit where the mechanism must reproduce established behavior.
     - **Negative control**: configuration where the mechanism is absent or symmetry-forbidden.
     - **Ablation/strong control**: systematic removal or variation of model components to isolate causality.
   - Define independent variables (mechanism knobs), dependent variables (observables), and constrained variables (fixed physics).
   - Define evaluation metrics and pre-registered stop conditions (e.g., non-convergence, sum-rule violation, threshold dominance, or excessive parameter tuning).

4. **Execution and Data Collection**
   - Run the minimal verification and controls.
   - Record all model settings, approximations, numerical parameters, and random seeds for reproducibility.
   - **Decision Gate C**: If a stop condition is triggered (numerical instability, non-physical spectra, or loss of baseline reproducibility), halt and diagnose methodological failure before proceeding.

5. **Multi-Evidence Analysis**
   - Organize outputs by observable, model variant, and approximation level.
   - Perform convergence and stability checks: assess sensitivity to discretization, truncation, basis size, or sampling.
   - Check multi-observable consistency: a valid mechanism must improve or consistently affect multiple independent observables, not just one.
   - Decompose contributions (e.g., long-range vs. short-range, coherent vs. incoherent, channel-by-channel) to attribute effects.
   - Quantify uncertainties: propagate model, numerical, and statistical errors; report ranges, not single points.

6. **Claim Bounding and Iteration**
   - Grade each conclusion:
     - **Verified**: robust across controls and observables.
     - **Inferred**: consistent with current evidence but dependent on untested assumptions.
     - **Pending**: requires additional data or model hierarchy.
   - Compare results against pre-defined failure modes.
   - **Decision Gate D**:
     - If results support the hypothesis across controls: strengthen claim, expand to adjacent systems/observables, and design stronger falsification tests.
     - If results partially support: refine the causal chain, narrow the scope, and design targeted ablation tests.
     - If results contradict: downgrade or reject the hypothesis, document the failure mode, and return to Step 2 to generate alternatives.
     - If results are inconclusive due to uncertainty: stop and specify the required evidence to proceed.

7. **Synthesis and Output**
   - Compile the audited claim set with explicit boundaries.
   - Document residual risks and excluded alternative explanations.
   - Archive the provenance chain linking outputs to specific controls, model settings, and source skills.

# Output Format

The agent must produce:

1. **Scope Statement**: system, boundaries, and baseline validity.
2. **Gap Diagnosis**: anomaly description and baseline failure modes.
3. **Hypothesis Table**: ranked candidates with evidence strength, causal chain, key assumptions, and failure modes.
4. **Validation Plan**: minimal viable verification, control hierarchy, variables, metrics, and stop conditions.
5. **Analysis Report**: convergence checks, multi-observable consistency matrix, contribution decomposition, and uncertainty ranges.
6. **Claim Audit**: graded claims (Verified / Inferred / Pending) with bounding statements.
7. **Iteration Log**: decisions at each gate, updated hypotheses, and excluded mechanisms.
8. **Validity and Safety Notes**: confounding factors, boundary conditions, reproducibility requirements, and non-operational safety limits.

# Validation Gates

- **Gate A (Scope)**: Confirms the anomaly lies outside baseline validity; prevents auditing non-existent gaps.
- **Gate B (Falsifiability)**: Ensures every hypothesis has a defined observable discriminator and failure mode.
- **Gate C (Methodological Integrity)**: Checks numerical convergence, physical consistency (sum rules, causality, positivity), and baseline reproducibility before interpreting results.
- **Gate D (Claim Grading)**: Requires cross-control and multi-observable agreement before upgrading a claim to "Verified."

# Claim Boundaries

- Distinguish "model-internal verification" from "cross-benchmark consistency" and from "extrapolation to new systems."
- Single-method, single-observable agreement is insufficient for causal claims.
- Claims about universal behavior require cross-system scaling tests; absence of scaling limits the claim to the studied parameter window.
- Do not present single-paper or single-model results as domain consensus.

# Failure Modes

- **Numerical artifact**: Results change qualitatively with grid size, basis set, truncation, or convergence criterion.
- **Overfitting**: Mechanism only explains one observable or requires excessive tuning to match a single data point.
- **Misattribution**: Effect caused by omitted channel, inconsistent operator, boundary condition, or uncontrolled approximation rather than the proposed mechanism.
- **Extrapolation error**: Applying a mechanism beyond its verified parameter regime (e.g., coupling strength, dimensionality, or energy scale).
- **Data conflict**: Independent datasets or methods yield incompatible conclusions under identical assumptions.

# Validity Checks

- **Reproducibility**: Fix random seeds, convergence thresholds, and discretization; document all approximations and input versions.
- **Physical consistency**: Verify sum rules, conservation laws, spectral positivity, threshold continuity, and causal structure where applicable.
- **Sensitivity analysis**: Vary model parameters, initial conditions, and numerical settings to ensure conclusions are robust.
- **Control sufficiency**: Confirm that positive, negative, and ablation controls are all present and discriminative.
- **Uncertainty propagation**: Separate theoretical, model, numerical, and experimental uncertainties; report confidence ranges.
- **Boundary discipline**: Explicitly state temperature, coupling, dimensionality, symmetry, and lifetime regimes where the claim holds.

# Provenance

- Derived from cluster 142.0 ("quantum-correlated-spin-nonlinear-optics-evidence-analysis-workflow").
- Synthesized from source skills: nuclear-continuum-research-pattern (699fe0d811689dad), strongly-correlated-metal-exploration (db9f305502a4825d), qcd-kinetic-equilibration-research-design (7147799ec1d28071), unified-shell-continuum-exploration (aec262391a3d11de), dissipative-nanostructure-research-workflow (74b196506b7950c1), hbn-defect-quantum-emitter-exploration (b5706256be33dc85), thermoelectric-band-strain-exploration (da971aeadda3504d), icd-cluster-research-workflow (0ab7897489e302c2).
- Methodological patterns migrated: anomaly-driven hypothesis generation, minimal viable verification, multi-control hierarchy, multi-observable cross-validation, mechanism attribution via ablation, and iterative claim bounding.
