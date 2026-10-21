---
name: sci-quantum-quantum-phase-spin-symmetry-mechanism-disco-df860654
description: A reusable end-to-end workflow for symmetry-guided mechanism discovery and validation in quantum, topological, and correlated matter, guiding agents from anomaly identification through hypothesis generation, controlled validation, and iterative refinement without source-specific parameters or operational protocols.
scienceevolve-title: "Quantum materials and condensed matter · quantum phase spin symmetry mechanism discovery workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Guide agents to discover and validate physical mechanisms in quantum, spin, topological, and symmetry-rich systems through a structured, reusable workflow. The skill teaches how to frame anomalies as symmetry-competition problems, generate falsifiable hypotheses, design discriminating controls, analyze responses across fidelity levels, and iterate conservatively without relying on material-specific parameters or single-study conclusions.

# When to use

Use this skill when:
- A measured or computed response is anomalous relative to simple scalar or symmetry-restricted expectations.
- The target system involves quantum phases, spin textures, topological excitations, collective modes, or order-parameter fields where symmetry governs allowed couplings.
- The task requires generating new research questions, ranking mechanisms, designing non-operational validation plans, or iterating hypotheses based on model fidelity.
- Competing explanations exist at different scales (local vs. collective, bulk vs. boundary, linear vs. nonlinear).

Do not use this skill as a general literature review agent, a materials-discovery oracle, a device-optimization recipe, or a source of executable laboratory protocols.

# Inputs required

Before generating a plan, request or infer:
- **Target system class**: abstract model, material family, or Hamiltonian/continuum regime.
- **Observable anomaly**: the discrepancy or gap that motivates mechanism search.
- **Known constraints**: symmetries, conservation laws, boundary conditions, dimensionality, and available approximations.
- **Candidate mechanisms**: competing explanations such as symmetry breaking, collective excitation, boundary effect, tensor projection, or artifact.
- **Validation resources**: analytical tractability, computational methods, or independent observables.
- **Scope boundaries**: intended fidelity ladder (symmetry argument → reduced model → high-fidelity model).

If inputs are missing, state assumptions explicitly and downgrade evidence strength.

# Core Workflow

An ordered end-to-end route with decision gates and iteration/stop conditions.

1. **Anomaly Framing**
   - Express the discrepancy as a symmetry-allowed vs. forbidden comparison or a competition between mechanisms.
   - Identify the order parameter, collective coordinate, or field variable that carries the candidate mechanism.
   - *Stop gate*: If the anomaly cannot be cast in symmetry-competition terms, restate the question before proceeding.

2. **Symmetry-Guided Hypothesis Generation**
   - **Mechanism statement**: Identify the exchanged quantity, conserved current, or symmetry channel.
   - **Symmetry discriminator**: Define the control condition where the proposed channel is absent, canceled, or reversed; predict sign changes, vanishing responses, or selection rules.
   - **Scaling/regime prediction**: State qualitative dependence on system size, coupling strength, dissipation, spatial scale, or dimensionless groups. Avoid source-specific numerical values.
   - **Evidence strength**: Label as high, medium, low, or unsupported based on symmetry support, continuum separation, and analogy breadth.
   - **Failure mode**: Identify the most probable reason the signature could be absent or misleading.
   - **Alternative mechanisms**: Retain at least one competing explanation (e.g., boundary effect, artifact, different tensor component, overdamping).

3. **Minimal Validation Design**
   - Specify independent variables (symmetry-adapted controls, coupling pathways, geometry, approximation level) and dependent variables (response class, trajectory, scaling trend, collective variable).
   - Define a control matrix:
     - *Negative control*: suppress or remove the proposed mechanism.
     - *Symmetry-off control*: reverse or cancel the symmetry property.
     - *Positive control*: recover a known limiting case or established mechanism.
     - *Artifact control*: test finite-size, discretization, boundary, and numerical sensitivity.
   - *Stop gate*: If no discriminating observable can be defined, halt and reformulate the hypothesis.

4. **Fidelity-Ladder Execution**
   - **Level 0 – Symmetry & scaling**: Use conservation laws and dimensional arguments to predict allowed/forbidden responses.
   - **Level 1 – Reduced model**: Build the minimal analytical or continuum model with explicit assumptions.
   - **Level 2 – High-fidelity comparison**: Compare with numerical or material-specific models; attribute residuals to specific assumptions (rigidity, weak coupling, boundary treatment).
   - *Decision gate*: If reduced and high-fidelity models disagree, check implementation (boundary conditions, discretization, normalization) before inferring new physics.

5. **Regime Analysis & Decomposition**
   - Pre-register the expected signature and falsification criterion.
   - Separate transient, oscillatory, and asymptotic behavior.
   - Compare paired conditions (symmetry-on vs. symmetry-off, reversed handedness, opposite chirality).
   - Decompose contributions (energy terms, tensor components, response channels) to identify dominance regimes.
   - Map the response across dimensionless groups or control parameters.

6. **Robustness & Control Assessment**
   - Verify that positive, negative, and symmetry controls behave as predicted.
   - Test convergence, sampling stability, and sensitivity to analysis choices.
   - Check whether the signature survives independent observables, alternative bipartitions, or varied boundary conditions.
   - *Stability gate*: If the signal disappears under controls, is dominated by artifacts, or multiple mechanisms fit equally well without discrimination, stop and redesign.

7. **Mechanism Discrimination & Claim Bounding**
   - Rank mechanisms by evidence strength, parsimony, and consistency across observables.
   - Label each conclusion as direct theoretical support, computational plausibility, indirect analogy, or speculative extension.
   - Define the claim boundary: state exactly which system class, symmetry regime, and approximation level the conclusion supports.
   - *Exclusion gate*: If a simpler mechanism explains all observations, prefer it and downgrade complex hypotheses.

8. **Iteration & Stop Conditions**
   - Update the hypothesis log after each cycle:
     - **Continue**: Signature and controls match; refine model to reduce residuals.
     - **Revise**: Residuals indicate missing physics; update assumptions and propose a new discriminating test.
     - **Broaden**: Result depends on narrow conditions; test broader system class before generalizing.
     - **Stop/Reject**: Negative control fails, artifact dominates, order/texture loses defining character, or discriminating test is impossible.
   - Each iteration must produce: updated hypothesis, changed assumption, new test, evidence-strength update, and decision.

# Output Format

When using this skill, produce:

1. **Research question** – concise anomaly or gap statement.
2. **Ranked hypotheses** – table with mechanism, symmetry discriminator, evidence strength, key assumptions, expected signature, likely failure modes, and discriminating control.
3. **Validation plan** – variables, controls (negative, symmetry-off, positive, artifact), minimal viable test, and stop conditions.
4. **Analysis plan** – regime separation, decomposition method, scaling checks, residual attribution, and uncertainty handling.
5. **Iteration roadmap** – decision rules for continue, revise, broaden, or stop.
6. **Claim boundary statement** – scope limits, confounders, extrapolation boundaries, and evidence needed to strengthen claims.

# Validation Gates

Before presenting any conclusion, confirm:
- **Symmetry gate**: Does the hypothesis identify the exchanged quantity and predict allowed/forbidden responses correctly?
- **Control gate**: Are negative, symmetry-off, and artifact controls defined and passed?
- **Fidelity gate**: Does the reduced model agree with higher-fidelity results up to explicitly attributed residuals?
- **Discrimination gate**: Can the leading mechanism be distinguished from the closest alternative with the available observables?
- **Robustness gate**: Do trends persist across system sizes, boundary conditions, or analysis choices?

# Claim Boundaries

- Do not treat a single model, material, or paper as field consensus.
- Do not extrapolate beyond the tested symmetry class, dimensionality, or approximation regime.
- Distinguish validated mechanism features from inferred extensions to new systems.
- Avoid stating universal thresholds, critical exponents, or quantitative predictions unless derived from the current analysis with uncertainty bounds.

# Failure Modes

- **Symmetry misassignment**: Incorrect symmetry label leads to wrong selection rules and failed controls.
- **Overdamping/continuum overlap**: Collective mode or texture response is buried by unresolved damping channels.
- **Boundary or artifact dominance**: Apparent mechanism is actually a finite-size, discretization, or boundary effect.
- **Tensor/projection confusion**: Macroscopic response is misattributed to a single intrinsic component when geometry mixes multiple contributions.
- **Premature mechanism lock-in**: Stopping after one successful comparison without testing alternatives.
- **Hidden defaults**: Unstated solver settings, material parameters, or approximation choices invalidate reproducibility.

# Validity Checks

- **Mechanism validity**: Is the exchanged quantity identified? Does the response follow from symmetry or conservation?
- **Control validity**: Is there a negative control? A symmetry-reversed condition? An artifact check?
- **Model validity**: Are approximation assumptions explicit? Is the collective-coordinate reduction justified?
- **Numerical validity**: Are convergence, discretization, and sampling checks documented?
- **Statistical validity**: Are uncertainties propagated? Is qualitative agreement separated from quantitative overfitting?
- **External validity**: Would the prediction survive changes in scale, material family, or boundary preparation?

# Provenance

- Derived from cluster 63.0 ("symmetry-guided mechanism discovery and validation").
- Synthesized from source skills: afm-wave-topological-texture-exploration, altermagnet-spin-collective-mode-explorer, ferroelectric-liquid-crystal-director-exploration, hybrid-light-matter-sagnac-research-planning, quantum-liquid-structure-research-workflow, molecular-piezoelectric-research-workflow, quantum-circuit-entanglement-membrane-exploration, physics-governed-electrostatic-workflow.
- Preserves the shared workflow route: anomaly framing → symmetry-guided hypothesis generation → minimal validation design → fidelity-ladder execution → robustness assessment → mechanism discrimination → bounded iteration.
