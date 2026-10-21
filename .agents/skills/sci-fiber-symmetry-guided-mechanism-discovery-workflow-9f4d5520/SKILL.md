---
name: sci-fiber-symmetry-guided-mechanism-discovery-workflow-9f4d5520
description: A reusable end-to-end workflow for identifying symmetry-driven or scale-driven mechanism gaps, generating competing hypotheses, designing minimal validation studies with strong controls, and iterating until claims are bounded by evidence.
scienceevolve-title: "Fiber composites and battery materials · symmetry guided mechanism discovery workflow 6"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Guide agents in discovering and validating physical mechanisms in systems where a trusted baseline model breaks down due to changes in symmetry, disorder, topology, confinement, or history dependence. The workflow structures the transition from an observed gap to a bounded, evidence-labeled claim through coarse-grained mapping, controlled comparison, and iterative refinement.

# When to use

Use this skill when a user asks to:
- Explain why a baseline scaling law, phase, or effective model fails in a new regime.
- Generate competing hypotheses about an underlying mechanism (e.g., fixed-point change, defect trapping, mediated interaction, free-energy competition, attractor switch).
- Design a theoretical, computational, or modeling validation plan with explicit controls.
- Iterate on evidence and update mechanism confidence.

Do not use this skill for operational laboratory protocols, clinical decision-making, hazardous material handling, or as a general-purpose domain textbook.

# Inputs required

- **Target system:** the physical or abstract system under study.
- **Baseline model:** the established theory, scaling law, or effective description that is expected to apply.
- **Suspected validity boundary:** the symmetry change, disorder class, topological constraint, rate dependence, or geometric perturbation that may violate the baseline.
- **Candidate coarse-grained representation:** field theory, order-parameter map, lattice model, stochastic process, or effective Hamiltonian proposed to capture the new regime.
- **Observables:** scale-dependent metrics, topological invariants, correlation functions, free-energy proxies, fluxes, or morphological order parameters.
- **Constraints:** computational budget, acceptable approximations, safety boundaries, and scope limits.

# Core Workflow

Follow this ordered route. At each gate, stop and redesign if the criterion is not met.

1. **Frame the gap.**
   State the baseline model, its core assumptions, and the specific assumption likely violated in the target regime. Convert this into a bounded mechanism question, not just an outcome prediction.
   *Gate:* The baseline and its violated assumption are explicitly identified.

2. **Map to a symmetry-aware representation.**
   Select the simplest coarse-grained description where relevant symmetries, conservation laws, and topological invariants remain manifest. Record every approximation and its expected failure domain.
   *Gate:* The representation preserves the target system's essential symmetries and conservation laws. If not, return to step 1.

3. **Generate competing mechanism hypotheses.**
   Produce 3–5 falsifiable hypotheses that link the violated assumption to distinct observable signatures. For each hypothesis record: evidence strength, key assumptions, predicted discriminator, failure mode, and boundary condition.
   *Gate:* Hypotheses are mutually distinguishable with the proposed observables. If not, refine the representation or diagnostics and return to step 2.

4. **Design minimal viable validation.**
   Define independent variables, a full control set (positive, negative, mechanism-ablation, boundary/protocol), evaluation metrics, and pre-registered stop conditions. The design must separate baseline recovery from new mechanism activation.
   *Gate:* The plan can discriminate the leading two hypotheses. If not, add orthogonal observables or simplify the parameter space.

5. **Execute analysis and mechanism discrimination.**
   Compute observables, test scaling collapse, locate fixed points or attractors, reconstruct free-energy landscapes, classify topological regimes, or compare path histories. Evaluate results against baseline predictions and control outcomes.
   *Gate:* Controls behave as expected and the baseline limit is recovered where applicable. If controls fail, stop and return to step 4 or 3.

6. **Stress-test robustness.**
   Vary approximation schemes, discretizations, solver settings, boundary conditions, system sizes, and initialization protocols. Confirm the mechanism signal is not an artifact of a single numerical or modeling choice.
   *Gate:* The signal persists across perturbations. If not, downgrade the claim to conditional or boundary-limited.

7. **Bound claims and update the evidence map.**
   Label each conclusion as paper-supported, analogy-supported, or agent-inferred. State explicit extrapolation boundaries. Archive the iteration log.
   *Stop condition:* Claims are bounded, controls are satisfied, uncertainty is quantified, and no unresolved finite-size or approximation artifact remains. If a new gap is exposed, return to step 1.

# Output Format

Return a structured report containing:

1. **Bounded research question** — baseline model, violated assumption, and target regime.
2. **Coarse-grained representation** — chosen effective description, symmetry map, and approximation registry.
3. **Ranked hypotheses** — mechanism claims with evidence strength, key assumptions, predicted discriminators, failure modes, and boundary conditions.
4. **Validation plan** — variables, controls (positive, negative, ablation, boundary/protocol), metrics, and stop conditions.
5. **Analysis summary** — regime maps, scaling tests, attractor or fixed-point classification, free-energy landscape topology, and robustness checks.
6. **Iteration log** — revisions made after each gate and the rationale.
7. **Validity and claim-boundary statement** — evidence labels, extrapolation limits, and residual risks.

# Validation Gates

- **Baseline recovery gate:** The clean or known limit must reproduce established behavior.
- **Control consistency gate:** Positive and negative controls must match their pre-registered predictions.
- **Symmetry preservation gate:** The coarse-grained model must respect the target system's relevant symmetries and conservation laws.
- **Mechanism isolation gate:** The signal must remain when confounders are varied and disappear when the proposed mechanism is ablated.
- **Approximation stability gate:** Results must not depend on a single expansion order, resummation, solver, or discretization.
- **Convergence gate:** Finite-size, cutoff, sampling, or relaxation effects must be quantified and reported.
- **Extrapolation boundary gate:** Claims must not extend beyond the validated symmetry class, parameter window, or model hierarchy.

# Claim Boundaries

- Distinguish paper-supported methodology from analogical inference and from new target-system inferences.
- Do not present single-study or single-model results as field-wide consensus.
- Limit claims to the stated symmetry class, universality class, coarse-graining level, and validation mode.
- Separate topological protection claims from dynamical stability claims.
- Separate exponent changes from prefactor changes.
- Separate equilibrium predictions from dynamic or history-dependent observations.
- Treat schematic phase or regime topology as an organizing model unless independently validated.

# Failure Modes

- **Mapping failure:** The coarse-grained model violates symmetries or misses conservation laws.
- **Hypothesis underdetermination:** Observables cannot distinguish two or more competing mechanisms.
- **Control failure:** Baseline or negative controls deviate from expected behavior.
- **Artifact misattribution:** Signal arises from numerical discretization, boundary effects, initialization bias, or finite-size artifacts.
- **Extrapolation error:** Results are applied beyond the validated regime or symmetry class.
- **Hidden confounding:** A control variable unintentionally couples to density, effective dimension, relaxation state, or geometry.
- **Non-equilibration:** Observed states reflect kinetic trapping rather than mechanism-driven minima or attractors.
- **Biased-dynamics misinterpretation:** Conditioning or protocol effects are treated as intrinsic mechanism properties.

# Validity Checks

Before presenting conclusions, verify:
- The research question asks about mechanism, not only outcome.
- All approximations in the coarse-grained mapping are explicit and bounded.
- Conservation laws, ergodic sectors, and state-space constraints are identified.
- Boundary and initial conditions are scientifically justified.
- Positive, negative, and mechanism-ablation controls are included and reported.
- Loading protocols or biasing fields are treated as explicit causal variables where relevant.
- Conclusions are stable under changes in discretization, solver tolerance, and initialization.
- Source-paper insights are separated from newly inferred claims.
- No operational hazardous procedures or unsafe parameters are prescribed.
- Uncertainty intervals, replication checks, and stopping rules are documented.

# Provenance

- Synthesized from cluster **51.1** (symmetry-guided mechanism discovery and validation), cluster 51.
- Source skills: correlated-disorder-polymer-scaling-research; polymer-scaling-workflow; confined-polymer-segregation-research; topological-defect-research-design; quantum-magnetism-partial-disorder-research; stochastic-reaction-network-rare-event-design; semiflexible-polymer-morphology-exploration; viscoelastic-adhesion-research-pattern.
- Representative provenance: 10.1103/PhysRevE.64.041102; 2112.10051; 10.1103/PhysRevE.103.012501; 10.1103/PhysRevA.85.053639; 10.1103/PhysRevB.107.134418; 10.1063/1.5111110; 2601.15095; 10.1016/j.jmps.2024.105826.
