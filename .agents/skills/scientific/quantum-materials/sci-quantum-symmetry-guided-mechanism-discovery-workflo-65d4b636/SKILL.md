---
name: sci-quantum-symmetry-guided-mechanism-discovery-workflo-65d4b636
description: Use this skill to design end-to-end research plans for discovering and validating emergent mechanisms in quantum, topological, spin, or correlated systems through symmetry analysis, minimal modeling, and cross-diagnostic controls.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided mechanism discovery workflow 82"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Guide agents to formulate, test, and iterate on mechanism-driven hypotheses in quantum, topological, spin, and correlated matter. The workflow extracts abstract mechanisms from known limits, maps them to new platforms via symmetry and minimal models, and validates them through discriminating controls and cross-diagnostic evidence—without treating any single study as field consensus.

# When to use

Use this skill when the user asks to:

- Propose new research questions about emergent order, protected modes, transport anomalies, or interaction-induced phenomena.
- Design theoretical, numerical, or conceptual validation studies for candidate mechanisms.
- Extend a known protected structure or mechanism into a new symmetry, coupling, or platform regime.
- Distinguish topological, symmetry-protected, and trivial origins of observed spectral or transport features.
- Generate iterative study plans with explicit stop conditions and claim boundaries.

Do not use this skill for operational experimental protocols, material synthesis recipes, or as a substitute for domain-specific safety review.

# Inputs required

Before generating a research plan, collect or state assumptions for:

- **Target system class**: degrees of freedom, dimensionality, relevant interactions, and known limiting regimes.
- **Baseline phenomena**: established behavior when one interaction or symmetry dominates.
- **Candidate gap or anomaly**: the unresolved intermediate regime, discrepancy, or desired functional behavior.
- **Symmetry and coupling context**: exact, approximate, emergent, or broken symmetries; competing interactions; order-parameter textures.
- **Available tools**: analytical methods, numerical solvers, minimal model constructions, and non-operational observables.
- **Evidence standard**: whether the goal is hypothesis generation, mechanism discrimination, robustness assessment, or platform mapping.

If inputs are missing, produce a minimal plan with explicit assumptions and mark conclusions as provisional.

# Core Workflow

Follow this ordered route. Do not skip decision gates.

1. **Anchor and Gap Definition**
   - Identify known limiting regimes where one interaction or symmetry dominates.
   - Define the unresolved intermediate regime, discrepancy, or functional gap.
   - **Gate:** If limits are unknown or ill-defined, stop and request baseline characterization.

2. **Mechanism Extraction and Abstraction**
   - Separate the abstract mechanism from material-specific implementations.
   - Identify the minimal set of couplings, symmetries, and order parameters required.
   - Map candidate motifs, building blocks, or effective degrees of freedom.
   - **Gate:** If the mechanism cannot be phrased without source-specific parameters, refactor it into a symmetry/coupling hypothesis before proceeding.

3. **Hypothesis Portfolio Generation**
   - Generate at least three competing hypotheses:
     a. **Primary mechanism**: the proposed emergent order, protected mode, or symmetry-driven effect.
     b. **Competing mechanism**: a trivial confinement, alternative coupling channel, or dominant background effect.
     c. **Null/failure-mode hypothesis**: the effect is non-robust, finetuned, or an artifact.
   - For each, state: mechanistic claim, evidence strength (high/medium/low), key assumptions, predicted observable signatures, and failure modes.
   - **Gate:** If hypotheses are not falsifiable by the available tools, redesign the study scope.

4. **Minimal Model Construction**
   - Build the simplest model preserving the essential couplings and symmetries.
   - Define a clean baseline, a candidate case, and control variants.
   - Document every approximation and its expected failure mode.
   - **Gate:** If the minimal model cannot reproduce the known limits, revise the model before adding complexity.

5. **Validation Design with Controls**
   - Define independent variables: coupling hierarchy, symmetry constraints, geometry, texture, or boundary condition.
   - Define dependent variables: spectral features, localization metrics, transport proxies, order parameters, or correlation functions.
   - Specify controls:
     - **Positive control**: known limit where the mechanism should appear.
     - **Negative control**: symmetry-breaking or coupling-removal case where it should vanish.
     - **Specificity controls**: chirality reversal, texture rotation, boundary variation, or sign reversal.
   - Define stop conditions: signature disappears under an essential control; result depends on a single fine-tuned point; signature is indistinguishable from background or artifacts.
   - **Gate:** If controls are incomplete, do not proceed to claim validation.

6. **Cross-Diagnostic Execution and Analysis**
   - Execute unbiased searches without imposing the desired motif.
   - Compare real-space, momentum-space, spectral, energetic, and symmetry diagnostics.
   - Require consistency across multiple diagnostics before accepting a candidate state.
   - Classify outcomes: bound, resonant, trivial localized, or absent; topological, symmetry-protected, or non-topological.
   - **Gate:** If only one diagnostic supports the candidate, downgrade the evidence strength and iterate.

7. **Robustness and Perturbation Testing**
   - Test survival under finite-size changes, boundary alternatives, disorder, and symmetry-allowed perturbations.
   - Check reproducibility across independent initial conditions or alternative solvers.
   - **Gate:** If the effect vanishes under small allowed perturbations, classify as provisional or reject.

8. **Mechanism Discrimination and Claim Grading**
   - Attribute causality only when positive, negative, and specificity controls behave as predicted.
   - Grade claims:
     - **Verified**: supported by planned diagnostics for the specified model.
     - **Plausible**: consistent with limits and effective reasoning but not yet fully validated.
     - **Speculative**: requires new assumptions, materials input, or methods outside current evidence.
   - **Gate:** If competing mechanisms remain indistinguishable, return to step 3 and design orthogonal tests.

9. **Iteration or Redesign**
   - Update hypotheses based on results:
     - **Promote** if independent diagnostics agree and controls are satisfied.
     - **Revise** if the effect appears but with unexpected symmetry or geometry dependence.
     - **Deprioritize** if negative controls show the same effect or a simpler alternative explains the data.
   - Choose the next minimal test that most strongly discriminates the remaining hypotheses.
   - **Stop condition:** Stop when additional parameters no longer yield testable predictions, when the feature loses separation or symmetry specificity, or when a simpler model explains all contrasts.

# Output Format

When using this skill, return:

1. **Research question** — concise necessity or sufficiency question.
2. **Gap and prior evidence** — known limits, unresolved regime, and uncertainty.
3. **Hypothesis portfolio** — for each hypothesis: mechanistic claim, evidence strength, key assumptions, predicted signatures, and failure modes.
4. **Minimal validation design** — baseline, independent variables, controls (positive/negative/specificity), dependent variables, and stop conditions.
5. **Analysis plan** — cross-diagnostic checks, effective-model interpretation, robustness tests, and evidence-grading rules.
6. **Iteration plan** — how results update hypotheses, the next discriminating test, and stop/continue criteria.
7. **Confidence and limitations** — claim boundaries, main confounders, extrapolation limits, and explicit separation of source-paper method from new inferences.

# Validation Gates

- **Limit recovery**: the minimal model must reproduce known baselines.
- **Control adequacy**: positive, negative, and specificity controls must be defined before execution.
- **Diagnostic convergence**: at least two independent diagnostics must agree to support a candidate.
- **Reproducibility**: results must survive independent initial conditions or alternative solver checks.
- **Perturbation stability**: the mechanism must survive small symmetry-allowed perturbations to be graded above provisional.
- **Falsifiability**: every hypothesis must have a clear condition that would weaken or discard it.

# Claim Boundaries

- Distinguish exact symmetry from emergent, approximate, or accidental symmetry.
- Separate verified model behavior from plausible extrapolation and speculative material relevance.
- Do not infer material realization from a minimal model without additional perturbations, disorder, lattice, orbital, or experimental constraints.
- Use source papers as methodological examples, not as proof that the same phase or mechanism must appear in all related systems.
- Label claims as: verified in target calculation, mechanistically plausible, or speculative extension.

# Failure Modes

- **Model failure**: minimal model cannot recover known limits or is over-parameterized.
- **Convergence failure**: numerical or analytical methods fail to converge; metastable states dominate.
- **Diagnostic failure**: only one diagnostic supports the candidate; cross-diagnostic agreement is absent.
- **Control failure**: negative controls show the same signature, or positive controls fail.
- **Finite-size and boundary artifacts**: signatures explained by commensurability, reflection, or discretization rather than the proposed mechanism.
- **Extrapolation failure**: claims extended to real materials or devices without independent validation.
- **Non-identifiability**: multiple parameter combinations or mechanisms produce identical observables.

# Validity Checks

Before finalizing a proposal or interpreting results, verify:

- **Confounding factors**: finite size, boundary commensurability, numerical broadening, missing interactions, disorder, heating, contact effects, calibration artifacts, and background scattering.
- **Symmetry accounting**: which symmetries are exact, approximate, or intentionally broken.
- **Continuum overlap**: ensure boundary or localized modes are not merely bulk resonances.
- **Mechanism specificity**: the signature cannot be explained equally well by an omitted channel.
- **Statistical or numerical validity**: sufficient sampling, transparent convergence criteria, uncertainty estimates, and sensitivity analyses.
- **Boundary conditions**: state required lattice, filling, dimensionality, fluctuation treatment, and approximation regime.
- **Evidence separation**: clearly label source-paper-supported methods, agent-inferred hypotheses, and unverified assumptions.

# Provenance

- Derived from cluster 99.1 (symmetry-guided mechanism discovery and validation).
- Synthesized from source skills: emergent-frustration-itinerant-magnetism, nh-dirac-zero-mode-research-design, magnetic-rashba-domain-wall-research, hexagonal-semiconductor-nanowire-qubit-exploration, topological-edge-state-exploration, mesoscopic-impurity-transport-exploration, acoustic-magnon-junction-mechanism-explorer, pt-symmetric-exceptional-point-wave-transport.
- Preserves the shared workflow route: anchor known limits → abstract mechanism → generate competing hypotheses → build minimal model → design discriminating controls → execute cross-diagnostic analysis → test robustness → grade claims → iterate.
