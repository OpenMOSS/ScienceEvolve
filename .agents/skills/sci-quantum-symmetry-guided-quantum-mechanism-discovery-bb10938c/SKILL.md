---
name: sci-quantum-symmetry-guided-quantum-mechanism-discovery-bb10938c
description: Use this skill to design reusable, end-to-end research plans for symmetry-guided discovery and validation of quantum mechanisms in transport, topological, and dynamical systems, while keeping hypotheses falsifiable and claims bounded.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided quantum mechanism discovery workflow 7"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Guide agents to develop end-to-end research workflows that identify gaps in quantum and condensed-matter systems, decompose competing mechanisms using symmetry and conservation principles, and validate claims through controlled triangulation without treating single-source results as field consensus.

# When to use

Use this skill when the user asks to:

- Propose new research questions or discriminate among competing mechanisms in quantum materials, driven systems, nanoscale transport, or correlated phases.
- Design validation studies where symmetry, topology, boundary conditions, geometry, or finite-size effects may dominate the observable response.
- Interpret phase diagrams, spectral features, transport anomalies, or dynamical regimes where multiple explanations (symmetry-broken, topological, disorder-driven, dynamical, or artifactual) could account for the same data.

# Inputs required

Ask the user or environment for:

1. **Target system class**: material family, model, platform, or effective degrees of freedom.
2. **Observable pool**: transport, spectral, temporal, spatial, correlation, interferometric, or simulation-derived diagnostics.
3. **Tuning axes**: symmetry-breaking fields, coupling strength, geometry, boundary conditions, filling, temperature proxy, or drive protocol.
4. **Competing mechanisms**: candidate explanations tied to distinct symmetries, topologies, collective modes, or artifacts.
5. **Anchor knowledge**: established limits (classical, continuum, non-interacting, clean) against which to compare.
6. **Constraints**: computational budget, experimental feasibility, safety context, and acceptable uncertainty.

# Core Workflow

Follow this ordered route. Do not skip decision gates.

1. **Gap Identification & Mechanism Decomposition**
   - Frame the research question as a tension between prediction and observation, or between adjacent theoretical limits.
   - Decompose competing mechanisms into distinct symmetry, topology, conservation-law, or dynamical axes.
   - **Decision Gate 1**: Are the mechanisms distinguishable by the available observable pool? If no, stop and redesign the question or request additional diagnostics.

2. **Hypothesis Generation**
   - For each mechanism, produce a falsifiable hypothesis card containing: claim, predicted independent signatures, evidence strength (high/medium/low), key assumptions, and likely failure modes.
   - Rank hypotheses by minimal testability and discriminating power.
   - **Decision Gate 2**: Do at least two hypotheses make distinct, testable predictions? If no, refine the mechanism decomposition.

3. **Validation Design**
   - Build a minimal viable validation plan with explicit controls:
     - **Baseline**: known limit without the proposed mechanism.
     - **Negative**: conditions where the signature should vanish or reverse.
     - **Positive**: known regime confirming the readout chain.
     - **Mechanism-isolation**: varying only the suspected driver while holding others fixed.
   - Define independent and dependent variables, evaluation metrics, and stopping criteria.
   - **Decision Gate 3**: Are controls sufficient to falsify at least one hypothesis? If no, strengthen the control matrix before proceeding.

4. **Execution & Data Quality**
   - Acquire or simulate data with sanity checks: calibration, convergence, background, finite-size coverage, and repeated realizations.
   - **Decision Gate 4**: Do data pass quality and convergence checks? If no, iterate on acquisition parameters or halt.

5. **Multi-Stream Analysis & Triangulation**
   - Analyze orthogonal observables (e.g., spectral + transport + correlation + temporal).
   - Map each observable to mechanism predictions and artifact mimics.
   - Compare results across independent diagnostics, methods, and boundary conditions.
   - **Decision Gate 5**: Do multiple independent diagnostics converge on one mechanism? If ambiguous, proceed to Iteration.

6. **Mechanism Discrimination & Claim Bounding**
   - Exclude mechanisms inconsistent with controls or negative-control results.
   - Label each conclusion as observation, model-dependent inference, or extrapolation.
   - State the boundary conditions under which the claim holds.
   - **Decision Gate 6**: Is the surviving mechanism consistent with all controls and cross-checks? If no, return to Hypothesis Generation.

7. **Iteration or Redesign**
   - **If confirming**: strengthen evidence, test robustness to boundary changes, and define generalization limits.
   - **If ambiguous**: design a discriminating test that separates remaining hypotheses.
   - **If falsifying**: revise or abandon the hypothesis, document the failure mode, and reconsider the mechanism decomposition.
   - **Stop Condition**: The claim is bounded, the next validation step is defined, or the mechanism space is exhausted.

# Output Format

Return:

1. **Research question and gap statement**: one sentence tied to a mechanism-level discrepancy.
2. **Hypothesis cards**: at least three falsifiable hypotheses with mechanism, predicted signatures, evidence strength, key assumptions, and failure modes.
3. **Validation plan**: variables, control matrix, primary and secondary observables, success criteria, and stopping conditions.
4. **Analysis plan**: triangulation strategy, diagnostics, convergence checks, and evidence-grading rules.
5. **Iteration roadmap**: update rules for confirming, ambiguous, and falsifying outcomes.
6. **Validity and boundary notes**: confounders, reproducibility requirements, applicability limits, and non-operational safety constraints.

# Validation Gates

- **Control adequacy**: baseline, negative, positive, and mechanism-isolation comparisons must all be present before mechanism assignment.
- **Triangulation**: at least two orthogonal observables are required to assign a mechanism; no single diagnostic defines a regime.
- **Reproducibility**: repeated tuning cuts, independent realizations, convergence tests, or equivalent repeated measurements must support the feature before it is treated as robust.
- **Symmetry consistency**: proposed order parameters and broken symmetries must be compatible with conserved charges and platform geometry.
- **Robustness**: conclusions must survive changes in finite-size scale, numerical approximation, disorder ensemble, or boundary conditions.

# Claim Boundaries

- Separate direct observations from inferred mechanisms and from speculative extrapolations.
- Separate source-paper evidence from agent-proposed extensions; never treat a single-system result as field-wide consensus.
- State falsification conditions explicitly for every mechanism claim.
- Limit claims to the tested parameter regime, material class, geometry, and observable set.
- Do not present simulation-only predictions as experimentally established facts.

# Failure Modes

- A hypothesis survives only because the control matrix is incomplete.
- A regime is assigned from a single observable without triangulation.
- Finite-size, disorder, method artifacts, or boundary effects mimic the target mechanism.
- Confounding by preparation history, geometry, contact artifacts, or measurement cross-talk.
- Competing mechanisms produce overlapping predictions, preventing clean discrimination.

# Validity Checks

Before finalizing any plan or claim, verify:

- **Confounders**: disorder, finite-size effects, temperature proxy mismatch, calibration drift, contact/boundary artifacts, background, and cross-talk.
- **Convergence**: numerical basis, time window, ensemble size, disorder realizations, and mesh refinement.
- **Statistical validity**: uncertainty propagation, residual diagnostics, overfitting checks, and separation between pre-registered and exploratory analyses.
- **Reproducibility**: documented analysis pipeline, versioned code, fixed random seeds where applicable, and archived configurations.
- **Boundary conditions**: explicit limits on model applicability, geometry, symmetry class, dimensionality, and material family.

# Provenance

- Synthesized from cluster 168.1 (symmetry-guided mechanism discovery and validation).
- Source skills: moire-quantum-phase-exploration (f8cc57260cdf032a), quantum-creep-transition-exploration (ef9bbbb47e57fb06), precision-spectroscopy-exploration (2aefe05680ae1a09), dipolar-exciton-research-pattern (c170cc170b868d9c), superconducting-nanotube-dynamics-research (cf587e789df3f64c), phonon-dynamics-thermoelectric-exploration (8261bef2fd890ae3), quantum-chaos-transport-exploration (3fc9780323389720), microcavity-plasma-coherence-exploration (8414d1e2ecfc825f).
- No paper-specific conclusions, numerical parameters, material recipes, or operational protocols are included.
