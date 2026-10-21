---
name: sci-quantum-quantum-topological-transport-response-mech-a9d3dd56
description: A reusable end-to-end workflow for symmetry-guided discovery and validation of microscopic mechanisms governing quantum, topological, transport, and response phenomena in condensed-matter and quantum-device systems.
scienceevolve-title: "Quantum materials and condensed matter · quantum topological transport response mechanism discovery"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Guide agents to formulate research questions, discriminate among competing symmetry-allowed mechanisms, and validate claims through controlled minimal models, multi-observable analysis, and iterative falsification in quantum and topological transport/response domains.

## When to use

Use when the task involves proposing or evaluating microscopic mechanisms in quantum, topological, or strongly correlated systems where transport, spectral, or response observables are ambiguous and multiple symmetry-allowed explanations coexist. Trigger for hypothesis generation, study design, simulation planning, mechanism discrimination, and claim bounding—not for operational lab execution.

## Inputs required

Before producing a plan, request or identify:

1. **Target system class** and its relevant symmetries, dimensionality, and conservation laws.
2. **Observable(s)** to explain and their relation to transport, spectral, or response functions.
3. **Competing candidate mechanisms** and their symmetry signatures (sign, scaling, selection rules).
4. **Available conceptual control knobs** (e.g., symmetry breaking, boundary conditions, coupling topology, drive parameters).
5. **Baseline minimal model** and known limiting behavior (homogeneous, weak-coupling, symmetry-unbroken, etc.).
6. **Validation resources** (simulation methods, analytical tools, benchmarks, prior data).
7. **Constraints and safety/ethics boundaries**.

If any input is missing, state assumptions explicitly and prioritize the smallest test that reduces the largest uncertainty.

## Core Workflow

1. **Frame the mechanism gap**
   - Define the inverse problem: which microscopic term explains the target observable?
   - Enumerate competing symmetry-allowed candidates and artifact/null channels.
   - **Gate:** If no genuine mechanism dispute exists, stop and treat the task as engineering optimization rather than mechanism discovery.

2. **Construct a minimal discriminating model**
   - Build the simplest model containing all competing terms that reproduces known limiting behavior.
   - **Decision:** If the model cannot recover established baselines, revise assumptions before proceeding.

3. **Pre-register hypotheses and controls**
   - For each candidate, state a falsifiable prediction, evidence strength, key assumptions, and failure modes.
   - Design a control table: baseline, negative, positive, symmetry, and convergence/artifact controls.
   - **Gate:** If a hypothesis lacks a falsifying test, reformulate or exclude it.

4. **Execute controlled validation**
   - Vary diagnostic independent variables (symmetry, frequency, position, time, coupling topology, boundary condition) across controls.
   - Hold confounders constant conceptually.
   - Collect primary and secondary observables.
   - **Stop condition:** If artifact controls (disorder, finite-size or boundary effects, numerical cutoffs, environmental coupling) dominate the signal, halt and redesign.

5. **Decompose and discriminate**
   - Recover known limits first.
   - Separate the signal into competing contributions (e.g., resonant vs. background, channel-specific terms).
   - Compare the target case against all controls.
   - **Decision gate:** If negative or symmetry controls reproduce the target signature, reject the candidate mechanism and search for confounders.

6. **Quantify robustness and uncertainty**
   - Report parameter sensitivity, model-form uncertainty, and stability under reasonable perturbations.
   - Check finite-size, cutoff, disorder, and geometry convergence where relevant.
   - **Gate:** If conclusions depend on arbitrary preprocessing or unverified parameters, downgrade evidence strength.

7. **Iterate and update evidence**
   - Rank hypotheses by consistency across multiple independent observables.
   - If one candidate survives: design the next orthogonal test to escalate confidence.
   - If degeneracy persists: add a control dimension, refine the minimal model, or seek a new observable.
   - **Stop condition:** If degeneracy cannot be broken with available resources, downgrade to inconclusive and bound extrapolation.

8. **Bound claims and output plan**
   - Separate validated mechanism, model-supported inference, and speculative extension.
   - State explicit symmetry, energy, temperature, and parameter boundaries.

## Output Format

When using this skill, return:

1. **Research question** — One concise question and the gap it addresses.
2. **Mechanism map** — Candidate terms, symmetry signatures, expected trends, and known ambiguities.
3. **Hypothesis cards** — For each hypothesis: claim, evidence strength, key assumptions, predicted observables, and likely failure modes.
4. **Validation plan** — Controls, independent/dependent variables, evaluation metrics, and stop conditions.
5. **Analysis plan** — Decomposition strategy, robustness checks, uncertainty treatment, and alternative-model tests.
6. **Iteration rules** — Conditions for upgrading, downgrading, or rejecting hypotheses based on outcomes.
7. **Validity and ethics statement** — Confounders addressed, boundary conditions, and safety constraints.

## Validation Gates

- **Known-limit recovery:** The minimal model reproduces established baselines before new predictions are interpreted.
- **Control specificity:** The signal vanishes or transforms correctly under symmetry and negative controls.
- **Multi-observable consistency:** Independent observables converge on the same mechanism.
- **Robustness:** The conclusion survives reasonable perturbations and finite-size or cutoff checks.
- **Parsimony:** The selected model explains more observables than simpler alternatives without excessive parameter freedom.

## Claim Boundaries

- Distinguish validated mechanism from model-supported inference and speculative extension.
- Limit claims to tested symmetry regimes, energy/temperature windows, and control-parameter ranges.
- Do not generalize single-platform results to universal behavior without cross-system validation.

## Failure Modes

- **Confounded signal:** Artifacts, disorder, environmental coupling, or boundary effects mimic the target mechanism.
- **Model degeneracy:** Multiple mechanisms fit the same observable within uncertainty.
- **Overfitting:** Conclusion depends on arbitrary preprocessing, small data subsets, or unverified parameters.
- **False extrapolation:** Applying the mechanism outside its validated symmetry or parameter regime.
- **Missing feedback:** Ignoring reciprocal coupling between sectors (e.g., back-action from the environment or secondary order parameters).

## Validity Checks

- **Symmetry consistency:** Signs, selection rules, and orientation or dimensional dependence match the candidate mechanism.
- **Conservation and sum rules:** Conserved quantities and applicable sum rules remain stable enough for the observable to be meaningful.
- **Reproducibility:** Results are stable across independent realizations, seeds, or analysis pipelines.
- **Convergence and sensitivity:** Numerical or theoretical approximations are documented with fitting windows, residuals, and parameter-sensitivity checks.
- **Evidence-level labeling:** Explicitly label claims as measured, simulated, inferred, or speculative.

## Provenance

- Synthesized from cluster 57.1 (symmetry-guided mechanism discovery and validation).
- Source skills: gate-tunable-soc-research-workflow; phonon-exchange-research-workflow; response-function-emitter-environment-research; superconducting-cpr-fingerprint-exploration; ultrafast-magnetism-research-workflow; condensed-matter-impurity-workflow; pseudogap-qed3-research-planning; hyperbolic-nonhermitian-research-workflow.
