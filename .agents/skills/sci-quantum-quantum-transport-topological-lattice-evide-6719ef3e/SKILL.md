---
name: sci-quantum-quantum-transport-topological-lattice-evide-6719ef3e
description: End-to-end evidence analysis and claim audit workflow for quantum, topological, and nonlinear lattice systems, emphasizing hypothesis-driven validation, multi-criteria controls, and iterative claim bounding.
scienceevolve-title: "Quantum materials and condensed matter · quantum transport topological lattice evidence analysis workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Abstract the shared "hypothesis → minimum viable validation → multi-criteria analysis → robustness gate → claim audit" route into a reusable framework for agent-guided research design in theoretical and computational many-body, topological, and nonlinear lattice physics. The goal is to produce falsifiable claims, subject them to structured controls, and bound conclusions by verifiable evidence tiers rather than extrapolation.

## When to use

- When proposing new mechanisms in quantum transport, topological phases, nonlinear lattices, or collective excitations.
- When designing validation plans involving first-principles simulation, symmetry analysis, spectral diagnostics, or machine-learning-enhanced sampling.
- When auditing whether a numerical or theoretical claim is robust across controls, limits, and boundary conditions.
- When iterating between hypothesis refinement and model redesign after negative, ambiguous, or conflicting results.

## Inputs required

- **Research system definition**: model class, symmetries, boundary conditions, and tunable control axes.
- **Baseline evidence**: established analytical limits, benchmark numerical results, literature benchmarks, or experimental constraints.
- **Candidate claim**: a falsifiable proposition linking a mechanism to an observable response, phase indicator, or spectral signature.
- **Available tools**: simulation codes, statistical frameworks, diagnostic methods, and computational resource bounds.

## Core Workflow

1. **Claim Formulation & Decomposition**
   - State the primary claim as a causal chain: mechanism → intermediate effect → observable signature.
   - Decompose the observable into independently measurable sub-components (e.g., spectral response, real-space correlation, topological invariant, transport coefficient).
   - Tag each link with evidence strength (high / medium / low) and identify hidden assumptions (symmetry, scale separation, gauge choice, finite-size convergence).

2. **Control Design & Minimum Viable Validation (MVV)**
   - Define a minimal set of control points spanning weak, intermediate, and strong coupling (or the relevant parameter window).
   - Establish four control types:
     - *Positive control*: known limit or benchmark where the claim must reproduce accepted behavior.
     - *Negative control*: configuration where the mechanism is absent or symmetry is restored; the signature should vanish or invert.
     - *Strong control*: same mechanism tested with alternative numerical implementations, boundary conditions, gauge / unit-cell choices, or independent solvers.
     - *Mechanism control*: systematically disable or enhance a single coupling term to isolate causality.
   - **Gate 1 – Feasibility Gate**: If positive controls fail, halt and debug implementation before interpreting new data.

3. **Multi-Criteria Data Acquisition**
   - Extract at least two complementary observables from the same calculation (e.g., spectrum + real-space profile, or transport + topological marker).
   - Record convergence parameters, statistical uncertainties, and solver metadata.
   - **Decision**: If acquisition yields single-metric support only, flag as insufficient and expand diagnostics before proceeding.

4. **Robustness & Consistency Analysis**
   - Check limit behaviors (weak / strong coupling, continuum / discrete limits, large-system extrapolation).
   - Test gauge, unit-cell, boundary-condition, and finite-size sensitivity.
   - Cross-validate against independent benchmarks or analytical limits.
   - **Gate 2 – Robustness Gate**: If the signature is sensitive to unphysical choices (gauge, cell size, solver) without convergence, stop the claim and diagnose numerical artifacts.

5. **Mechanism Mapping & Alternative Hypothesis Audit**
   - Map observed patterns back onto the causal chain.
   - Enumerate competing explanations (finite-size effects, boundary artifacts, alternative instabilities, numerical bias, confounding variables).
   - Score each competing explanation against the control table.
   - **Decision**: If negative or mechanism controls produce the same signature, downgrade the claim and redesign the mechanism control.

6. **Claim Bounding & Evidence Grading**
   - Classify conclusions into tiers:
     - *Verified*: supported by multiple independent diagnostics and robust across controls.
     - *Inferred*: consistent with mechanism but lacking independent cross-validation or limited to a narrow parameter window.
     - *Speculative*: suggested by analogy or extrapolation; requires a new validation cycle.
   - Explicitly state the domain boundary: dimensionality, symmetry class, interaction range, and approximation level where the claim is valid.

7. **Iteration or Termination**
   - **If the claim passes all gates**: Expand to adjacent parameter space, adding one new variable at a time; return to Step 2.
   - **If the claim fails a gate**: Return to Step 1 to reformulate the causal chain or revise hidden assumptions.
   - **If the claim is indeterminate**: Design a discriminating experiment (numerical or theoretical) that separates the leading mechanism from the top competitor; return to Step 2.
   - **Stop conditions**:
     - Positive controls remain unrecoverable after two debug cycles.
     - Signature is artifact-sensitive and shows no convergence trend.
     - Competing mechanisms cannot be distinguished with available resources.
     - Reproducibility or compliance requirements are violated.

## Output Format

1. **Research Question Card**: one-sentence claim, system scope, and gap statement.
2. **Hypothesis Table**: candidate mechanisms, evidence strength, key assumptions, falsifiable predictions, and failure modes.
3. **Validation Plan**: MVV protocol, control definitions (positive / negative / strong / mechanism), evaluation metrics, and stop conditions.
4. **Control Table**: per-control results, consistency flags, and sensitivity notes.
5. **Analysis Log**: multi-criteria diagnostic summary, limit checks, and robustness assessment.
6. **Claim Audit Report**: evidence tier (verified / inferred / speculative), explicit boundaries, and residual risks.

## Validation Gates

- **Gate 1 (Feasibility)**: Positive controls must reproduce benchmark behavior within predefined tolerance before new data are interpreted.
- **Gate 2 (Robustness)**: Signature must be stable across gauge, boundary, unit-cell, and finite-size variations once numerical convergence is achieved.
- **Gate 3 (Mechanism Specificity)**: Negative and mechanism controls must show attenuated or absent signature; otherwise the claim is non-specific.
- **Gate 4 (Cross-Diagnostic Consistency)**: At least two independent observables must align before upgrading evidence to the verified tier.

## Claim Boundaries

- Distinguish what is *internally verified* by the current workflow cycle from what is *imported* from literature or *extrapolated* by analogy.
- State the symmetry, dimensionality, interaction form, and approximation level required for the claim to hold.
- Do not present single-configuration or single-solver results as domain consensus.

## Failure Modes

- **Implementation Failure**: Positive control fails due to code bugs, inconsistent units, or incorrect boundary conditions.
- **Artifact-Driven Claim**: Signature arises from finite-size effects, gauge dependence, discretization errors, or insufficient sampling.
- **Over-Generalization**: Mechanism verified in one parameter window is asserted beyond its tested symmetry or dimensionality.
- **Under-Determination**: Multiple mechanisms explain the same observable and no discriminating control was performed.
- **Confirmation Bias**: Selective reporting of metrics that support the claim while ignoring conflicting diagnostics.

## Validity Checks

- **Reproducibility**: Archive model definitions, random seeds, solver versions, parameter sweeps, and analysis scripts.
- **Statistical Rigor**: Report uncertainty propagation, sample sizes, convergence errors, and fitting-window sensitivity.
- **Confounder Audit**: List known confounders (finite size, boundary, gauge, truncation, noise, initialization) and their mitigation status.
- **External Validity**: Document the boundary beyond which the claim has not been tested (e.g., higher dimensions, different symmetry class, strong dissipation).
- **Numerical Hygiene**: Verify conservation laws, sum rules, and analytical limits where applicable.

## Provenance

- Derived from cluster 42.0 ("quantum-transport-topological-lattice-evidence-analysis-workflow") via semantic merge of representative source skills.
- Source skill references: flat-band-bose-condensate-quantum-geometry-workflow; plasma-crystal-wave-dispersion-exploration; nn-qmc-quantum-phase-exploration; singular-hyperbolic-topology-research; radiative-hydrodynamics-exploration-workflow; nonlinear-lattice-soliton-exploration; spintronic-domain-wall-exploration; stellarator-turbulence-research-design.
- No paper-specific conclusions, parameters, or operational protocols are carried into the reusable workflow body.
