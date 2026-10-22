---
name: sci-quantum-symmetry-guided-mechanism-discovery-workflo-8970a485
description: Reusable end-to-end workflow for generating hypotheses and validation plans in symmetry-driven quantum, topological, and nonlinear material systems.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided mechanism discovery workflow 13"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Use this skill to transform a candidate symmetry-driven research question into a rigorous, reusable validation workflow. It guides an agent from scientific-gap framing through layered hypothesis generation, staged control design, mechanism discrimination, and iterative refinement—for quantum, topological, wave, and nonlinear material systems—without embedding source-specific models or treating individual paper conclusions as field-wide consensus.

# When to use

Trigger when the user asks to:

- Propose new research questions in topological, non-Hermitian, nonlinear, magnetic, or coupled lattice/continuum systems.
- Design theoretical, numerical, or computational validation plans where symmetry, topology, or order parameters govern the target behavior.
- Abstract a paper-derived method into transferable hypotheses, controls, metrics, and iteration rules.
- Compare a new candidate system against baselines while avoiding unsupported generalization.

Do not use for operational laboratory recipes, hazardous synthesis, device fabrication, clinical applications, or human-deployment advice.

# Inputs required

Before producing a plan, request or identify:

- **Target system class**: lattice, heterostructure, metamaterial, continuum, or effective model.
- **Candidate mechanism**: topological protection, symmetry breaking/restoration, nonlinear localization, interlayer coupling, non-Hermitian balancing, response-operator structure, etc.
- **Relevant symmetries and order parameters**: spatial, temporal, magnetic, particle-hole, or synthetic symmetries.
- **Baseline system**: the corresponding trivial, passive, Hermitian, or component-only reference.
- **Modeling level**: tight-binding, continuum, first-principles, coupled-field, or response-matrix abstraction.
- **Target observable**: spectral gap, localized mode, transport coefficient, dynamical relaxation, or figure of merit.
- **Validation resources**: analytical solvers, numerical packages, benchmark data, or experimental analogues.
- **Constraints**: computational budget, safety boundaries, feasibility limits, and intended depth (screening vs. mechanistic).
- **Evidence base**: source-paper observations, independent literature, preliminary data, or mechanistic plausibility.

# Core Workflow

Execute as an ordered route with decision gates (G1–G8). Stop, revise, or abandon at any gate that fails.

1. **Frame the gap and falsifiable mechanism**
   - State the scientific gap and the specific symmetry or mechanism claim.
   - *G1*: If the claim is not falsifiable or lacks a clear symmetry/mechanism link, stop and reformulate.

2. **Inventory symmetries and build the minimal model**
   - List protecting/broken symmetries; define state variables, reference state, and the minimal model that preserves the target physics.
   - *G2*: If the model cannot host the proposed mechanism or symmetries are ill-defined, simplify or redesign.

3. **Generate layered hypotheses**
   - Produce at least three hypotheses (e.g., symmetry/topology-first, localization/response-first, robustness/competing-mechanism) with:
     - Evidence strength (high / moderate / low / speculative).
     - Key assumptions.
     - Predicted spectral, spatial, or dynamical signatures.
     - Likely failure modes and falsification conditions.
   - *G3*: If no hypothesis has a plausible validation path, stop.

4. **Design staged validation with controls**
   - **Baseline**: system without the target mechanism.
   - **Negative controls**: remove the mechanism, break the relevant symmetry, or use a trivial/ungapped analogue.
   - **Positive controls**: known benchmark regime where available.
   - **Method/symmetry controls**: alternative model or symmetry-preserving comparison.
   - Pre-register primary metrics, robustness metrics, and stop conditions.
   - *G4*: If controls cannot isolate the claimed mechanism, redesign before execution.

5. **Execute stability and baseline checks**
   - Verify structural, dynamical, or numerical stability; reproduce baseline behavior.
   - *G5*: If the baseline is unstable, ill-conditioned, or unreproducible, fix the model before proceeding.

6. **Run mechanism-discrimination analysis**
   - **Spectral/symmetry analysis**: eigenvalues, gaps, invariants (within their symmetry assumptions), and mode character.
   - **Localization/response analysis**: confinement metrics, participation, transport coefficients, or static response.
   - **Dynamical/time-domain analysis**: evolution, relaxation, or flux observables when relevant.
   - Compare candidate against all controls.
   - *G6*: If the effect disappears in negative controls or is reproduced by trivial alternatives, downgrade or reject the hypothesis.

7. **Robustness and perturbation testing**
   - Test symmetry-preserving and symmetry-breaking perturbations, finite-size scaling, boundary-condition changes, disorder, and parameter sensitivity.
   - *G7*: If the mechanism is fragile or depends on a single unvalidated parameter, mark as conditional and stop broad claims.

8. **Mechanism separation and evidence grading**
   - Separate contributions from topology, symmetry, nonlinearity, curvature, finite-size, boundary artifacts, and numerical effects.
   - Require consistency between bulk and boundary diagnostics for topological claims; between spectral and dynamical results for transport claims.
   - Grade each conclusion as: source-paper methodology, model-supported result, or new-system inference.
   - *G8*: If diagnostics disagree, resolve artifacts before claiming discovery.

9. **Iterate or terminate**
   - **Supported**: propose orthogonal extension (new symmetry class, control variable, or higher-fidelity validation).
   - **Partially supported**: narrow the claim to the validated regime or revise the mechanism.
   - **Contradicted**: abandon and reformulate based on the failed causal link.
   - **Ambiguous**: request additional data, refined model, or independent method.

# Output Format

When using this skill, return:

1. **Research question**: concise, falsifiable, tied to a symmetry or mechanism gap.
2. **Hypothesis set**: ≥3 hypotheses with evidence strength, assumptions, predicted signatures, failure modes, and falsification conditions.
3. **Minimal validation plan**: baseline, controls (negative, positive, method, symmetry), metrics, and stop conditions.
4. **Analysis plan**: spectral/symmetry, localization/response, dynamical/time-domain, and robustness checks.
5. **Iteration decision tree**: rules for support, partial support, contradiction, and ambiguity.
6. **Evidence map**: separate source-supported methodology, transferable patterns, model-supported inferences, and speculative extensions.
7. **Validity and safety notes**: non-operational boundaries, confounders, reproducibility requirements, and claim limits.

# Validation Gates

Explicit criteria for the decision gates in Core Workflow:

- **G1 (Falsifiability)**: The question must state a measurable difference between the candidate and baseline.
- **G2 (Model-Symmetry Consistency)**: The minimal model must admit the proposed mechanism under the claimed symmetries.
- **G3 (Plausible Validation)**: At least one hypothesis must have a minimal test that can strengthen or weaken it.
- **G4 (Control Isolation)**: The experimental or computational design must include controls that distinguish the target mechanism from trivial alternatives.
- **G5 (Baseline Stability)**: Baseline results must be numerically converged, physically stable, and reproducible.
- **G6 (Mechanism Discrimination)**: The target effect must survive negative controls and not be replicated by artifactual or trivial mechanisms.
- **G7 (Robustness Margin)**: The effect must persist under weak, physically expected perturbations and not depend on a single parameter setting.
- **G8 (Diagnostic Consistency)**: For topological claims, bulk invariants and boundary signatures must agree; for dynamical claims, spectra and time evolution must align.

# Claim Boundaries

- Distinguish source-paper methodology from model-supported results and new-system inferences.
- Do not generalize from a single candidate system to an entire material or model class.
- Limit claims to the tested symmetry class, model fidelity, and parameter regime.
- Mark topological claims as conditional on agreement between bulk invariants and boundary signatures.
- Mark nonlinear/dynamical claims as conditional on stability and control comparisons.
- Avoid application, device-readiness, or deployment claims beyond intrinsic mechanism validation.

# Failure Modes

- Gap is too broad or claim is not falsifiable.
- Minimal model lacks the degrees of freedom required for the proposed mechanism.
- Negative control reproduces the target effect (mechanism not isolated).
- Effect depends on an unvalidated numerical setting, mesh, or single parameter choice.
- Baseline instability or solver artifacts masquerade as a physical mechanism.
- Symmetry breaking, band closure, delocalization, or mode mixing destroys the proposed state.
- Bulk and boundary diagnostics disagree for topological claims.
- Spectral features do not translate to measurable dynamics or transport response.
- Robustness fails under weak perturbations, finite-size changes, or disorder.
- A competing mechanism (trivial localization, substrate effect, dissipation, finite-size artifact) explains the result.

# Validity Checks

- **Mechanism separation**: Explicitly distinguish topology, symmetry, nonlinearity, curvature, finite-size, boundary, and numerical contributions.
- **Control adequacy**: Include negative, positive, baseline, symmetry, method, and geometry controls where relevant.
- **Invariant/model validity**: Use topological invariants or response operators only within their stated symmetry and conditioning assumptions.
- **Reproducibility**: Document model definitions, symmetry conventions, perturbation protocols, analysis metrics, and decision criteria.
- **Statistical/numerical validity**: Run convergence checks, disorder ensembles, sensitivity analysis, and independent-method comparisons where applicable.
- **Boundary conditions**: State limits on dimensionality, geometry, material class, and operating regime.
- **Extrapolation boundary**: Label claims as demonstrated, inferred, or speculative; avoid presenting a single study as consensus.

# Provenance

- Synthesized from cluster 145.0: symmetry-guided mechanism discovery and validation.
- Source skills: hyperbolic-hoti-soliton-research (5b9543b8e52fb03e), vdW-heterostructure-optoelectronic-exploration (8cf0500cf69766c4), radiative-topology-research-workflow (be10a5ee25472e69), polariton-photonic-nonlinear-device-exploration (22f927fdc15ac351), nonhermitian-lattice-wave-exploration (384304739e37a3ec), topological-thermoelectric-exploration-workflow (679ec2933abcb3f6), afm-topological-materials-research-design (796b151f45876ead), janus-mxene-superconductivity-research (c6b75687c4ffa02d).
- No source-specific systems, materials, parameters, numerical results, or paper conclusions are embedded in the reusable workflow body.
