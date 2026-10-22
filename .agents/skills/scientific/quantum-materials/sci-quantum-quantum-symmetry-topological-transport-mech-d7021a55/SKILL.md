---
name: sci-quantum-quantum-symmetry-topological-transport-mech-d7021a55
description: A reusable end-to-end workflow for generating, testing, and validating symmetry-guided mechanism hypotheses in quantum, topological, and transport systems using controlled comparisons and iterative claim bounding.
scienceevolve-title: "Quantum materials and condensed matter · quantum symmetry topological transport mechanism discovery"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

This skill helps an agent design transferable research programs for quantum, topological, and correlated systems where symmetry, geometry, or collective behavior may govern anomalous transport, ordering, or spectral signatures. It abstracts mechanism-discovery logic into a structured route from hypothesis generation through controlled validation to claim bounding, without committing to specific materials, numerical parameters, or paper conclusions.

# When to use

Use this skill when:
- Proposing new research questions in quantum materials, topological platforms, correlated-electron systems, or low-dimensional conductors.
- Designing theoretical, computational, or conceptual studies where competing mechanisms must be discriminated.
- Evaluating whether a candidate phase, instability, transport anomaly, or collective mode is distinguishable from conventional explanations.
- Planning controls, diagnostics, and iteration rules before committing to a full study.

Do not use this skill as a general-purpose literature review tool, operational experimental protocol generator, materials-synthesis recipe, or source of system-specific parameter values.

# Inputs required

Before executing the workflow, collect or infer:
- **Target system class:** dimensionality, relevant symmetry group, and degrees of freedom.
- **Default expectation:** the standard relaxation, transport, or ordering behavior in the regime of interest.
- **Candidate anomaly:** the observable, collective mode, ordered phase, or transport signature that departs from the default.
- **Competing mechanisms:** at least one credible conventional or trivial alternative that could mimic the target signature.
- **Available methods:** theoretical framework, simulation level, or diagnostic approach and its known limitations.
- **Constraints:** feasible controls, benchmark systems, finite-size/disorder/boundary limitations, and acceptable computational or conceptual cost.

If essential inputs are missing, state assumptions explicitly, mark them as key assumptions, and design minimal checks to validate or falsify them.

# Core Workflow

## 1. Frame the symmetry problem
Define the target system class, relevant symmetry group, and default expectation. Identify the candidate anomalous observable, collective mode, or ordered phase and the low-energy variable or manifold that could host it.

**Decision Gate — Symmetry Permission:** If the proposed mechanism is symmetry-forbidden, the relevant manifold cannot be isolated, or the default expectation is ill-defined, stop and reformulate the research question.

## 2. Generate competing mechanism hypotheses
Produce at least two falsifiable hypotheses: a leading mechanism and at least one credible alternative. For each hypothesis record:
- **Claim:** concise mechanistic statement.
- **Evidence strength:** low / moderate / strong (before new data).
- **Key assumptions:** about symmetry, manifold isolation, approximation validity, or competing phases.
- **Predicted signatures:** primary signature and mechanism-specific signature.
- **Failure modes:** what would suppress, mimic, or invalidate the hypothesis.
- **Extrapolation boundary:** where the claim should not be generalized without re-derivation.

**Decision Gate — Falsifiability:** If no hypothesis can be tested with available methods, stop and request additional inputs or constraints.

## 3. Design controlled validation
Define independent variables (tuning, symmetry, geometry, coupling), dependent variables (response, spectral weight, transport coefficient, order parameter), and nuisance variables (finite size, disorder, boundary conditions, approximation error). Specify:
- **Positive control:** a known case where the target behavior should be recovered.
- **Negative control:** a regime where the mechanism is absent or symmetry-forbidden.
- **Symmetry/triviality control:** a comparison that rules out exact conservation, hidden symmetry, or noninteracting explanations.
- **Method control:** a simplified benchmark or alternative numerical/analytical approach.
- **Robustness control:** variation of geometry, disorder, boundary conditions, or gauge choices.

Pre-register primary metrics, mechanism-specific metrics, and stop conditions.

**Decision Gate — Control Separation:** If controls cannot distinguish the target mechanism from trivial alternatives, redesign the study before execution.

## 4. Execute minimal viable validation
Isolate the mechanism in the simplest compatible model or conceptual framework. Establish baseline behavior, reproduce known limits, and compare mechanism-active, mechanism-off, and negative-control regimes on the primary metric.

**Iteration / Stop:** If the primary signature is absent, proceed to Step 6 (Failure Diagnosis). If the signature appears but negative controls also show it, flag as ambiguous and proceed to Step 6.

## 5. Discriminate mechanisms and test robustness
Decompose the response into conventional and symmetry-driven or geometric components where possible. Perform robustness checks: finite-size scaling, gauge or boundary variations, disorder, and alternative methods. Evaluate the strongest alternative explanation on compatible assumptions.

**Decision Gate — Mechanism Exclusion:** If a trivial alternative reproduces the signature, robustness checks fail, or geometric/symmetry quantities are numerically unstable, downgrade evidence strength and return to Step 2 to revise hypotheses.

## 6. Diagnose, iterate, and refine
- **If supported:** Add mechanism-specific diagnostics, test one added complication at a time (additional bands, disorder, alternative methods), and upgrade evidence only when major alternatives are ruled out.
- **If ambiguous:** Isolate the uncertain variable, add an independent observable, or narrow the claim to a specific regime.
- **If rejected:** Document which assumption failed, verify that the mechanism was actually tested, and generate a revised hypothesis.

**Stop Conditions:** Stop iterating if the hypothesis requires unphysical parameter regimes, if the ordered response vanishes before a meaningful stability scale, or if the result depends on an unjustified assumption.

## 7. Audit uncertainty and bound claims
Classify every conclusion as:
- **Directly supported:** reproduced or observed in the target system with matched controls.
- **Model-supported:** follows from the chosen framework and stated assumptions.
- **Speculative:** plausible but not yet independently tested.

Construct a regime map indicating supported, ambiguous, rejected, and untested regions. State transfer boundaries; do not extrapolate to different dimensionality, symmetry class, topology, or material family without additional validation.

**Decision Gate — Claim Bounding:** If claims extend beyond validated regimes, truncate to bounded statements and label extrapolations as hypotheses.

## 8. Package outputs and archive provenance
Compile the research plan, ranked hypotheses, control table, validation record, regime map, and reproducibility metadata (model assumptions, control definitions, decision rules).

# Output Format

When using this skill, produce the following structure:

## 1. Research question
- One-sentence question.
- Target system class and relevant symmetries.
- Default expectation and proposed anomaly.

## 2. Ranked hypotheses table
| Hypothesis | Mechanism | Evidence strength | Key assumptions | Primary signature | Mechanism-specific signature | Failure modes | Extrapolation boundary |

## 3. Study design
- Independent, dependent, and nuisance variables.
- Positive, negative, symmetry, method, and robustness controls.
- Primary and mechanism-specific metrics.
- Stop conditions.

## 4. Analysis plan
- Baseline and structure analysis.
- Response decomposition (conventional vs. symmetry-driven).
- Robustness checks.
- Alternative-mechanism comparison.
- Regime map construction.

## 5. Iteration log
- Evidence strength updates.
- Assumption changes.
- Next discriminating test.

## 6. Claim boundary statement
- Directly supported findings.
- Model-supported inferences.
- Speculative extensions.
- Transfer limits and untested regimes.

# Validation Gates

- **Symmetry Permission Gate:** The proposed channel must be symmetry-allowed and the relevant manifold or low-energy variable must be identifiable.
- **Falsifiability Gate:** Every hypothesis must have a conceivable falsifying outcome using available methods.
- **Control Separation Gate:** Controls must be able to distinguish the target mechanism from trivial alternatives, hidden symmetries, and finite-size artifacts.
- **Robustness Gate:** The signature must survive reasonable variations of geometry, disorder, boundary conditions, gauge, or method.
- **Mechanism Exclusion Gate:** The strongest alternative explanation must be evaluated and ruled out or acknowledged before upgrading evidence.
- **Claim Bounding Gate:** Claims must not extend beyond tested regimes, dimensionality, or symmetry classes without explicit support.

# Claim Boundaries

- Distinguish directly supported findings from model-supported inferences and speculative extensions.
- Do not generalize a single-system or single-model result to a whole material family, symmetry class, or field-wide consensus.
- Do not conflate internal-frame or microscopic mechanisms with laboratory-frame or ensemble-averaged observables without explicit averaging analysis.
- Label any extrapolation to new platforms, dimensionalities, or topological classes as a hypothesis requiring independent validation.

# Failure Modes

- **Symmetry-forbidden channel:** The proposed mechanism violates a symmetry of the target system.
- **Conventional dominance:** Band dispersion, density of states, or ordinary kinetic terms explain the full anomaly.
- **Manifold misidentification:** The relevant subspace is not isolated, unoccupied, or hybridized with irrelevant states.
- **Trivial alternative:** Hidden conservation laws, integrability, finite-size recurrence, disorder, or confinement effects mimic the target signature.
- **Numerical or approximation artifact:** Discretization, gauge dependence, finite-size splitting, or unstable fitting creates false anomalies.
- **Probe mismatch:** The observable is insensitive to the target mechanism or mixes competing channels.
- **Instability or incoherence:** The ordered response appears but lacks phase coherence or collective stability at the relevant scale.

# Validity Checks

- **Confounding by approximation:** Does the conclusion depend on an approximation known to fail in the target regime?
- **Confounding by sampling:** Could discretization, interpolation, finite-size choices, or smoothing create or hide the anomaly?
- **Confounding by symmetry:** Is the proposed channel allowed, or could symmetry-breaking artifacts explain it?
- **Confounding by environment:** Could substrate, disorder, boundaries, or heterogeneity alter the mechanism?
- **Confounding by alternative order:** Could another collective instability or competing phase explain the same observable?
- **Reproducibility:** Are inputs, model choices, sensitivity checks, controls, and decision rules sufficient for another agent to reproduce the reasoning?
- **Statistical validity:** Are uncertainties, sensitivity to thresholds, and multiple comparisons reported? Are stop conditions defined before confirmatory analysis?
- **Scope discipline:** Are claims limited to the tested system class, symmetry, and regime unless additional validation supports generalization?

# Provenance

- Derived from cluster 151.0 (symmetry-guided mechanism discovery and validation).
- Synthesized from representative source skills: tunable-quantum-geometry-research, slow-relaxation-quantum-transport-exploration, composite-order-vestigial-phase-research, correlated-materials-boundary-perturbation-skill, low-dimensional-quantum-instability-explorer, topological-superconductivity-exploration-workflow, charged-particle-crystal-antichannelling-research, recoil-symmetry-breaking-molecular-fragmentation.
