---
name: sci-fiber-polymer-composite-thermal-simulation-mechanis-1644f529
description: End-to-end workflow for discovering and validating competing mechanisms in polymer, composite, or thermal soft-matter systems using controlled simulation hierarchies, regime mapping, and iterative hypothesis discrimination.
scienceevolve-title: "Fiber composites and battery materials · polymer composite thermal simulation mechanism discovery"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Help an agent design and execute a mechanism-discovery study for soft-matter, polymer, composite, or thermal systems where competing interactions, fields, or constraints may drive structural or dynamical behavior. The workflow abstracts a reusable pattern: frame the phenomenon as a competition between candidate mechanisms, encode each as a minimal controllable model, map regime boundaries with matched controls, discriminate mechanisms through targeted diagnostics, and iterate until claims are bounded by evidence.

# When to use

Use this skill when the user needs to:
- Generate research questions around competing interactions (e.g., surface versus bulk, entropic versus energetic, drive versus barrier, confinement versus transport).
- Design simulation or modeling studies to map phase-like regimes, state boundaries, or transition regions.
- Validate whether an observed pattern arises from a proposed mechanism or from confounding factors such as finite-size effects, boundary artifacts, or coordinate choices.
- Iterate hypotheses based on control-plane results, robustness checks, and failure-mode analysis.

Do not use for operational laboratory protocols, clinical decision-making, device fabrication recipes, or high-risk experimental execution.

# Inputs required

Before starting the workflow, collect or infer:
- **Target system class and scale**: chain-like objects, interfaces, networks, or continuous media.
- **Phenomenon to explain**: conformational transition, localization, transport anomaly, structural ordering, or regime crossover.
- **Candidate mechanisms**: at least two competing explanations with distinct observable signatures.
- **Competing fields or constraints**: geometric confinement, surface attraction, solvent quality, thermal gradients, charge screening, or similar.
- **Modeling approaches**: coarse-grained simulation, field theory, kinetic modeling, finite-element analysis, or analytical approximations.
- **Limiting cases**: known baselines where one interaction dominates or is absent.
- **Constraints**: computational budget, accessible system sizes, boundary conditions, and safety or ethics limits.

# Core Workflow

1. **Frame the competing-mechanism gap**
   - Define the target phenomenon and why single-mechanism explanations are insufficient.
   - Identify at least two candidate mechanisms and their competing interaction fields or constraints.
   - **Decision Gate**: If the phenomenon cannot be expressed as a competition between distinct mechanisms, stop and reformulate the research question.

2. **Build a minimal controllable model**
   - Select the smallest set of interactions, fields, or geometric constraints that can produce the candidate behaviors.
   - Define independent control axes that tune each competing contribution separately.
   - **Decision Gate**: If candidate mechanisms cannot be isolated by varying at least one control while holding others fixed, redesign the control axes or add stratification variables.

3. **Pre-register order parameters and diagnostics**
   - Choose observables that distinguish candidate regimes before inspecting any outcomes.
   - Include one diagnostic per competing mechanism and one global reference metric.
   - **Stop Condition**: If diagnostics are chosen post-hoc, discard prior results and restart from Step 2.

4. **Construct the control hierarchy**
   - **Baseline**: essential background physics without the candidate driver.
   - **Driver model**: adds the candidate mechanism.
   - **Negative control**: suppresses the driver while preserving the baseline.
   - **Positive control**: a limiting case with an established expected behavior.
   - **Sensitivity variants**: system size, resolution, boundary condition, or representation changes.
   - **Stop Condition**: If any control requires confounding multiple variables, simplify the design matrix before proceeding.

5. **Map regimes across the control plane**
   - Scan control axes broadly to locate candidate boundaries or crossovers.
   - Record state labels, structural populations, or dynamical regimes at each point.
   - **Decision Gate**: Do positive and negative controls reproduce their expected limiting behaviors? If no, debug the model setup before interpreting driver results.

6. **Discriminate mechanisms with targeted diagnostics**
   - Compare stationary distributions, time-dependent evolution, and persistence or residence metrics across the hierarchy.
   - Perform finite-size or finite-scale extrapolation to test boundary stability.
   - **Decision Gate**: Can the diagnostics distinguish the driver model from the negative control? If no, refine observables or add a discriminating contrast; if still no, reject the mechanism hypothesis.

7. **Validate robustness and abstraction**
   - Test whether conclusions survive changes in system size, representation richness, boundary conditions, or initial states.
   - Compare minimal and richer models if abstraction is claimed.
   - **Decision Gate**: Do regime labels and boundary trends persist across robustness checks? If no, bound the claim to the tested subdomain or revise the mechanism.

8. **Iterate based on evidence grade**
   - **Strong evidence**: expand to dense parameter sweeps, synthetic observables, or literature benchmarks.
   - **Moderate evidence**: refine region partitioning, controls, or diagnostics before broad claims.
   - **Weak or unsupported evidence**: redesign the minimal model or abandon the mechanism.
   - **Stop Conditions**:
     - Multiple transitions overlap and cannot be isolated.
     - Order parameters are unstable across scales.
     - Independent parametrizations give incompatible regime labels.
     - Controls fail to reproduce known limiting behavior.
     - Claims require extrapolation beyond the tested model class.

9. **Bound claims and finalize outputs**
   - Separate measured evidence from inferred extrapolation.
   - Label each claim with evidence strength, key assumptions, and boundary conditions.
   - **Decision Gate**: Are all claims accompanied by explicit failure modes and validity limits? If no, add them before finalizing.

# Output Format

Produce a structured research plan containing:
1. **Research question and gap**: the phenomenon and why competing mechanisms must be tested.
2. **Minimal model and control axes**: the simplified system and independent variables.
3. **Hypotheses table**: for each mechanism, list expected signature, evidence strength, key assumptions, and failure modes.
4. **Control hierarchy**: baseline, driver, negative, positive, and sensitivity variants.
5. **Analysis plan**: regime-mapping strategy, order-parameter definitions, finite-scale checks, and mechanism diagnostics.
6. **Iteration log**: evidence grade at each cycle, redesign path, and stop conditions triggered.
7. **Claim boundary statement**: what is directly supported, what is inferred, and what remains speculative.

# Validation Gates

- **Control parity**: Baseline and driver models differ only in the targeted mechanism.
- **Limiting-case fidelity**: Positive and negative controls reproduce expected behaviors.
- **Diagnostic pre-registration**: Observables are defined before result inspection.
- **Scale stability**: Boundary locations or regime labels are consistent across system sizes or resolutions.
- **Mechanistic consistency**: The same mechanism explains multiple independent diagnostics.
- **Abstraction survival**: Minimal-model conclusions are checked against richer representations where possible.

# Claim Boundaries

- Claims are limited to the tested model class, control range, and system sizes.
- Phase labels, scaling exponents, and transition locations are reported separately from mechanistic explanations.
- Transfer to new chemistries, geometries, or experimental systems is marked as speculative until independently validated.
- Single-model results are not presented as field consensus.

# Failure Modes

- Hidden phases or overlapping transitions obscure the intended boundary.
- Finite-size or finite-scale drift destabilizes order parameters or boundary estimates.
- Coordinate or parametrization artifacts mimic true regime boundaries.
- Minimal model omits a necessary internal mode or interaction.
- Controls fail to reproduce known limiting behavior.
- Results depend on arbitrary thresholds, fitting ranges, or initial conditions.
- Competing mechanisms produce indistinguishable signatures under the chosen diagnostics.

# Validity Checks

- **Confounding**: Check for boundary-condition effects, interaction-range effects, sampling bias, and hidden variables.
- **Reproducibility**: Record model definitions, control axes, analysis code, seeds, independent-run counts, and metric definitions.
- **Statistical validity**: Use uncertainty estimates, independent replicas, bootstrap or jackknife checks, and sensitivity tests for fitting ranges.
- **Transition-signature validity**: Verify that the chosen indicator matches the suspected transition or mechanism type.
- **External validity**: Require independent evidence before generalizing beyond the tested model class.
- **Interpretive validity**: Distinguish measured labels, extrapolated exponents, inferred mechanisms, and analogical transfer.

# Provenance

- Synthesized from cluster 51.0 (workflow archetype: end-to-end mechanism discovery and validation).
- Source skills: solvent-surface-polymer-research-workflow (10.1103/physreve.99.062113), polymer-barrier-scaling-skill (10.1209/0295-5075/77/18003), charged-nanopore-transport-research (10.1063/1.5004182), polymer-thickness-phase-exploration (10.1209/0295-5075/85/10003), spiral-galaxy-mhd-research-design (10.1051/0004-6361/201629988), lsb-structured-host-research-workflow (10.1002/adfm.202310301), protein-electrostatics-research-workflow (10.1016/j.bpj.2017.08.017), stochastic-flow-polymer-stretching-research (2301.02990).
- Paper-specific conclusions, numerical parameters, and operational protocols have been excluded from the reusable workflow body.
