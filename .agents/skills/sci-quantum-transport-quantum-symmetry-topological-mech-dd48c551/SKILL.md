---
name: sci-quantum-transport-quantum-symmetry-topological-mech-dd48c551
description: A reusable end-to-end workflow for symmetry-guided discovery and validation of microscopic mechanisms in quantum, topological, and transport systems using minimal models, orthogonal observables, and iterative control-based hypothesis testing.
scienceevolve-title: "Quantum materials and condensed matter · transport quantum symmetry topological mechanism discovery"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Enable an agent to design reusable research workflows for discovering and validating microscopic mechanisms in quantum, topological, and transport systems. The workflow abstracts the shared scientific method across these domains: frame a gap around a hidden or symmetry-dependent mechanism, construct a minimal model, derive discriminating observables, validate through complementary probes and controls, and iterate based on evidence strength.

# When to use

Use this skill when a user asks to:

- Design theoretical, computational, or non-operational experimental studies where a proposed mechanism must be distinguished from competing explanations.
- Investigate how symmetry, topology, disorder, scattering, correlations, or collective modes shape observable transport, thermal, magnetic, or electrodynamic responses.
- Convert a physics mechanism into a falsifiable research plan with hypotheses, variables, controls, metrics, and iteration rules.
- Evaluate whether evidence for a mechanism is specific, robust, and transferable beyond a single macroscopic response curve.

Applicable to quantum transport, correlated and topological matter, spin dynamics, network/flow systems, and thermodynamic probes of phase transitions. Do not use this skill to copy paper conclusions, prescribe material growth or device fabrication conditions, provide operational laboratory protocols, or claim that one model result is a field-wide consensus.

# Inputs required

Before producing a research plan, request or identify:

1. **Target system**: relevant degrees of freedom, dimensionality, symmetries, and conserved quantities.
2. **Candidate mechanism**: the hidden or symmetry-dependent process proposed to explain an observable.
3. **Competing mechanisms**: plausible alternatives such as heating, disorder, boundary effects, artifacts, or trivial responses.
4. **Available observables**: transport, thermal, optical, magnetic, spatially resolved, or dynamical probes; note whether local and nonlocal or symmetry-distinct channels are accessible.
5. **Modeling scope**: analytic, numerical, simulation, or hybrid; include intended approximations and boundary of validity.
6. **Validation constraints**: computational budget, system-size limits, measurement access, uncertainty tolerance, and safety or compliance context.

If any input is missing, state assumptions explicitly and mark downstream conclusions as conditional.

# Core Workflow

Follow this ordered end-to-end route. Treat each decision gate as a hard stop until the criterion is satisfied or the study is redesigned.

## 1. Gap framing and mechanism mapping
- Identify what existing descriptions cannot explain and why single-observable inference is underdetermined.
- Define the candidate mechanism and its expected link to intermediate states (e.g., nonequilibrium distributions, order parameters, scattering kernels, or topological invariants).
- **Decision gate**: Is the gap addressable with the available observables and modeling tools? If no, reformulate the question or request additional inputs.

## 2. Minimal model construction
- Retain only the degrees of freedom, symmetries, and conservation laws required to capture the target observable.
- Identify an organizing limit (e.g., low energy, weak drive, linear response, clean limit) where the model is controlled.
- **Decision gate**: Does the model recover known limits (noninteracting, symmetric, zero-field, equilibrium) and respect conservation laws? If no, revise assumptions before proceeding.

## 3. Hypothesis generation
- Formulate a **core hypothesis**: mechanism → intermediate state → observable prediction under stated conditions.
- Formulate at least one **competing hypothesis** (alternative mechanism, artifact, or trivial explanation).
- Assign **evidence strength** (high / medium / low / unsupported) and list key assumptions, failure modes, and minimal tests for each.
- **Decision gate**: Are all hypotheses falsifiable with the planned tools? If no, redesign the observable matrix or controls.

## 4. Validation bundle design
- Select a **primary probe** to constrain the model and at least one **orthogonal secondary probe** to test predictions independently.
- Define independent variables (tuning axes), dependent variables, and nuisance variables.
- Design **controls**:
  - *Positive control*: regime where the target signal is expected.
  - *Negative control*: regime where the mechanism is symmetry-forbidden or absent.
  - *Strong/alternative control*: close variant that distinguishes the target mechanism from a near competitor.
  - *Artifact/null control*: test for finite-size, discretization, boundary, or numerical artifacts.
- Define **stop conditions** (e.g., conservation failure, instability, ablation shows no reproducible contribution, narrow unverified regime, competing orders unresolved).
- **Decision gate**: Can the controls discriminate the target mechanism from all alternatives? If no, add probes or axes before execution.

## 5. Execution and diagnostic analysis
- Validate the model before interpretation: check conservation, boundary conditions, convergence, and positivity/symmetry constraints.
- Extract intermediate states and primary observables; inspect distributions, not only global averages.
- Compare results against the full control set.
- Perform robustness checks: vary geometry, resolution, parameters, and boundary conditions.
- **Decision gate**: Do results pass sanity, convergence, and control checks? If no, halt, diagnose, and debug.

## 6. Mechanism discrimination and integration
- Map the mechanism to the observable through changes in intermediate states; avoid curve-fitting-only arguments.
- Require **mechanism specificity**: the proposed mechanism must be necessary, not merely compatible.
- Integrate evidence across probes into a unified strength rating.
- **Decision gate**: Does evidence favor one mechanism over all alternatives with adequate margin? If ambiguous, proceed to iteration.

## 7. Iterative update
- **Strengthen** the hypothesis if independent diagnostics agree and controls behave as expected.
- **Revise** the hypothesis if the signal appears with different symmetry, regime dependence, or intermediate-state structure.
- **Reject** the hypothesis if negative controls replicate the signal, positive controls fail, or uncertainty dominates the effect size.
- **Decision gate**: Has evidence crossed the threshold for bounded claims? If no, return to step 3 or 4 with updated assumptions.

## 8. Claim bounding and transfer
- State the **boundary of validity**: regime, symmetry, approximation, and system limits where the conclusion holds.
- Separate paper-supported methodology from agent-inferred extensions.
- Document residual uncertainties, confounders, and decisive next tests.
- **Final stop**: Produce deliverables or explicitly flag the claim as unresolved.

# Output Format

For each use of this skill, return:

1. **Research question**: one concise question with target system and observable.
2. **Mechanism map**: structure / tuning → intermediate state / scattering kernel / order parameter → observable.
3. **Ranked hypotheses**: table with claim, evidence strength, key assumptions, expected signatures per probe, and likely failure modes.
4. **Study design summary**: variables, orthogonal probes, controls, minimal viable validation, and stop conditions.
5. **Analysis plan**: validation checks, intermediate-state diagnostics, control comparisons, sensitivity tests, and robustness checks.
6. **Iteration log**: what was tested, how evidence changed, and why hypotheses were strengthened, revised, or rejected.
7. **Validity and boundary statement**: confounders, reproducibility requirements, approximation limits, and claims that are not yet justified.

# Validation Gates

Before advancing between stages or finalizing conclusions, verify:

- **Conservation and symmetry**: particle number, charge, energy, and flux accounting are consistent; symmetry constraints are respected.
- **Known-limit recovery**: weak-drive, equilibrium, noninteracting, or reduced-dimensional limits reproduce expected behavior.
- **Convergence and stability**: results do not depend on arbitrary grid, timestep, cutoff, basis size, or initial-condition choices.
- **Control adequacy**: positive, negative, strong, and artifact controls are included and behave as expected.
- **Mechanism specificity**: ablation or removal of the target mechanism reproducibly changes the observable; orthogonal probes agree.
- **Confounding exclusion**: heating, disorder, boundary effects, contact effects, numerical artifacts, and competing orders are tested or bounded.

# Claim Boundaries

- Distinguish **model-level mechanisms** from **material-specific predictions** and **speculative analogies**.
- Label evidence as **paper-supported**, **literature-backed**, or **agent-inferred**; never present a single-model result as field-wide consensus.
- Limit extrapolation to regimes where the model assumptions (symmetry, dimensionality, temperature, disorder, interaction strength) remain plausible.
- Treat single-paper analogies as paper-inspired hypotheses, not validated general rules.

# Failure Modes

- **Model assumption violation**: the reduced model discards degrees of freedom that dominate in the target regime. Mitigate by testing limiting cases and escalating to more microscopic descriptions when assumptions break.
- **Numerical instability or unconverged results**: apparent signals arise from discretization, finite-size resonances, or truncation. Mitigate by convergence checks and artifact controls.
- **Confounding by alternative mechanisms**: heating, impurity scattering, boundary resistance, or disorder reproduces the target observable. Mitigate through strong and alternative controls.
- **Insufficient control discrimination**: probes are redundant rather than orthogonal. Mitigate by redesigning the observable matrix.
- **Overinterpretation of single observables**: a single peak or curve is treated as proof. Mitigate by requiring multi-observable agreement and intermediate-state evidence.
- **Finite-size, boundary, or disorder effects**: geometry-specific artifacts masquerade as bulk mechanisms. Mitigate by varying size, boundaries, and disorder realizations.

# Validity Checks

Before presenting a research plan or interpretation, confirm:

- **Confounding factors** have been assessed and bounded.
- **Reproducibility** is supported across independent methods, parameter sets, or samples; data provenance and analysis scripts are documented.
- **Statistical and numerical validity** includes uncertainty propagation, residual analysis, sensitivity to assumptions, and distinction between divergence and saturation.
- **Boundary conditions** are stated for regime, symmetry, and approximation validity.
- **Mechanistic specificity** is demonstrated through ablation and orthogonal-probe agreement.
- **Data integrity** is preserved: model definitions, observable definitions, normalization, preprocessing, and random seeds are recorded for independent replication.

# Provenance

- Synthesized from cluster **129.0** (symmetry-guided mechanism discovery and validation).
- Derived from source skills: `superlattice-transport-methodology`, `topological-parent-state-superconductivity-workflow`, `multipolar-fermi-surface-exploration`, `superconducting-quantum-dot-transport-workflow`, `network-transport-mean-field-research`, `flat-band-dirac-transport-exploration`, `inertial-spin-resonance-exploration`, `quantum-stirling-topological-probe`.
