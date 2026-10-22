---
name: sci-quantum-symmetry-guided-mechanism-discovery-workflo-536b5837
description: A reusable end-to-end workflow for generating, validating, and iterating symmetry-guided mechanism hypotheses across topological, phononic, magnetic, and transport materials systems.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided mechanism discovery workflow 83"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Guide agents to transform a materials-science knowledge gap into a ranked set of falsifiable mechanism hypotheses, validate them through multi-evidence symmetry-aware checks, and iterate toward a minimal supported model without relying on source-specific material conclusions or operational protocols.

# When to use

- The user asks for new research questions, candidate discovery, or validation plans where symmetry, interactions, or collective behavior are central.
- The task involves discriminating competing explanations (e.g., symmetry-protected vs. accidental, phononic vs. electronic, intrinsic vs. interfacial) using independent observables.
- A standard baseline calculation or single-probe measurement appears insufficient because of approximation failures, selection-rule blind spots, or coupled-property trade-offs.
- The agent must design non-operational computational or theoretical studies with explicit controls, metrics, and stopping conditions.

# Inputs required

- **Target system class**: composition, dimensionality, crystal or magnetic symmetry, and known stable phases.
- **Knowledge gap or bottleneck**: the unresolved mechanism, approximation failure, or coupled-property trade-off.
- **Available evidence**: structural, spectroscopic, computational, or literature baseline data.
- **Tuning axes**: strain, field, pressure, temperature, composition, substrate, or symmetry-breaking perturbations.
- **Validation resources**: accessible modeling levels (e.g., first-principles, effective models), experimental probe classes, or reference datasets.
- **Constraints**: feasibility limits, safety boundaries, computational cost, and acceptable uncertainty.

# Core Workflow

1. **Gap Definition & Symmetry Audit**
   - Define the property-level gap or approximation failure in terms of missing evidence or a coupled-variable bottleneck.
   - Audit relevant symmetries (space group, magnetic group, point group) and identify protected, coupled, or forbidden degrees of freedom.
   - **Decision gate**: If symmetry information is insufficient to constrain hypotheses, stop and request additional structural or magnetic configuration data.

2. **Mechanism Mapping & Hypothesis Generation**
   - Build a mechanism map linking structure → interactions → emergent response.
   - Generate ranked hypotheses (e.g., symmetry-protection, active-sector, error-cancellation, boundary-condition, or coupling hypotheses).
   - For each hypothesis record: claim, evidence strength, key assumptions, predicted independent signatures, and likely failure modes.
   - **Decision gate**: If no hypothesis is falsifiable with available resources, stop and redefine the gap or tuning axes.

3. **Validation Design**
   - Establish a minimal validation package:
     - Baseline observable or calculation.
     - At least two independent diagnostic channels (e.g., bulk thermodynamic + spectroscopic, or spectral + symmetry analysis).
     - Control hierarchy: positive, negative, mechanism-isolation, and boundary controls.
     - Pre-defined metrics and stopping conditions.
   - **Decision gate**: If controls are missing or metrics are non-identifiable, redesign before execution.

4. **Execution & Layered Analysis**
   - Acquire baseline data and corrected/perturbed results under identical conditions.
   - Decompose responses into symmetry-enforced, accidental, and artifact contributions.
   - Compare approximation levels or probe channels; focus on correction differences rather than raw magnitudes.
   - **Decision gate**: If baseline viability or convergence checks fail, stop and revise the model or system definition.

5. **Robustness & Counterfactual Testing**
   - Remove key interactions or symmetries to test whether a feature is protected, accidental, or conditional.
   - Vary active-sector definitions, numerical settings, boundary terminations, and long-range treatments within justified ranges.
   - **Decision gate**: If the feature disappears under small justified perturbations, downgrade the claim to accidental or conditional and return to Stage 2.

6. **Evidence Synthesis & Claim Bounding**
   - Label every claim as directly calculated, inferred from analogy, or speculative.
   - Bound external validity: candidate-specific, subfamily-level, or general mechanism class.
   - **Decision gate**: If evidence rests on a single observable or unvalidated modeling choice, flag as provisional and require independent confirmation.

7. **Iteration or Redesign**
   - **If validated across channels**: strengthen the hypothesis, test generalization to related systems, or propose selective tuning axes.
   - **If partially validated**: decompose residuals by mode, momentum, frequency, or channel; revise active sectors or hypotheses and return to Stage 4.
   - **If invalidated**: return to Stage 2 with updated constraints or abandon the mechanism.
   - **Stop condition**: Claim reaches the supported evidence bound, a fatal failure mode is confirmed, or resources are exhausted.

# Output Format

When using this skill, return:

1. **Research question and gap statement**: concise, scientifically motivated, and tied to a mechanism uncertainty.
2. **Mechanism map and symmetry audit**: protected degrees of freedom, allowed terms, and forbidden gap-opening mechanisms.
3. **Ranked hypothesis table**: claim, evidence strength, key assumptions, predicted signatures, and likely failure modes.
4. **Validation plan**: variables, control hierarchy, evaluation metrics, and stopping conditions.
5. **Analysis plan**: decomposition strategy, cross-channel consistency checks, robustness tests, and evidence-grading rules.
6. **Iteration rules**: decision tree for accept, revise, reject, or escalate.
7. **Validity and ethics summary**: confounders, boundary conditions, reproducibility requirements, and non-operational safety constraints.

# Validation Gates

- **Symmetry validity**: The claimed protected feature is compatible with the actual symmetry setting and representation assignment.
- **Numerical/model validity**: Convergence, basis quality, finite-size dependence, and functional sensitivity are checked.
- **Control performance**: Positive and negative controls behave as expected under the same workflow.
- **Cross-channel consistency**: At least two independent observables or analysis methods agree on the mechanism signature.
- **Mechanism specificity**: The result is distinguishable from alternative explanations (e.g., disorder, artifacts, competing bands).
- **Viability gating**: Structural, dynamical, or thermodynamic stability prerequisites are met before interpreting performance or topology.

# Claim Boundaries

- Distinguish source-paper-supported facts, transferred method logic, new agent inferences, and speculative extrapolation.
- Do not treat single-material, single-method, or single-paper results as field-wide consensus.
- Present emergent phases (e.g., topological protection, superconductivity, magnetic order) as hypotheses requiring independent validation.
- State explicitly whether a claim applies to the specific candidate, a material subfamily, or a broad mechanism class.
- Avoid presenting computational predictions as experimentally verified.

# Failure Modes

- **Symmetry misassignment**: Accidental degeneracy mistaken for symmetry-protected feature due to incorrect group or representation analysis.
- **Uncontrolled cancellation**: Practical approximations that outperform formal ones because of compensating errors, misinterpreted as physical insight.
- **Single-observable overreach**: An anomaly in one probe or model is interpreted as mechanism proof without independent confirmation.
- **Overfitting**: Excessive model parameters, unconstrained active sectors, or arbitrary fitting windows produce spurious agreement.
- **Extrapolation beyond bounds**: Claims extended outside the valid energy, temperature, composition, or symmetry regime.
- **Confounding**: Disorder, defects, surface termination, finite-size effects, instrumental artifacts, or background signals mimic the target mechanism.

# Validity Checks

- **Confounding factors**: Screen for disorder, strain, defects, heating, sample degradation, numerical artifacts, and background signals.
- **Reproducibility**: Document inputs, analysis scripts, convergence settings, symmetry assignments, and failed controls.
- **Statistical and numerical validity**: Report uncertainty in peak positions, gaps, integrated weights, and transition points; check residual diagnostics and limiting cases.
- **Boundary conditions**: Verify phase stability, anisotropy limits, and whether extrapolation crosses a suspected transition.
- **Evidence hierarchy**: Separate direct observations, model-dependent assignments, analogy-based inferences, and speculative extensions.

# Provenance

- Derived from cluster **114.0** ("symmetry-guided mechanism discovery and validation") of the scientific skills codex.
- Synthesized from source skills: `topological-node-exploration-workflow`, `phonon-self-energy-exploration`, `high-pressure-infrared-dielectric-workflow`, `magnetic-materials-multiscale-exploration`, `fe-se-interface-research-agent`, `field-temperature-quantum-spin-excitation-workflow`, `magnetic-topological-qnp-research-design`, `thermoelectric-transport-mechanism-exploration`.
