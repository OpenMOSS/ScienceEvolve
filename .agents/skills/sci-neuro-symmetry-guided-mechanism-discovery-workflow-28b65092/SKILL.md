---
name: sci-neuro-symmetry-guided-mechanism-discovery-workflow-28b65092
description: A reusable end-to-end workflow for symmetry-guided mechanism discovery and validation in nonlinear, quantum, spin, and stochastic dynamical systems.
scienceevolve-title: "Neuromorphic computing and Ising optimization · symmetry guided mechanism discovery workflow"
scienceevolve-area: neuromorphic-computing-and-ising-optimization
---

## Purpose

Synthesize a transferable workflow for identifying, discriminating, and validating mechanisms in complex dynamical systems—especially those involving nonlinearities, symmetry breaking, multistability, or stochastic transitions—across physical, quantum, and neuromorphic substrates. The goal is to move from an observed bottleneck or anomalous behavior to a bounded, evidence-ranked mechanism claim without reproducing any single source system.

## When to use

- When a dynamical system exhibits unexplained regime shifts, bifurcations, multistability, or broken symmetry.
- When mapping a physical or computational substrate onto discrete information-bearing states or optimization variables.
- When designing minimal validation studies to distinguish a proposed mechanism from confounding artifacts.
- When iterating between hypothesis, simulation, and controlled test to bound claims before scaling.

## Inputs required

- **Target phenomenon or bottleneck:** the qualitative behavior or performance limit to explain.
- **Candidate substrate or model class:** the dynamical system family under study.
- **State and observable definitions:** how information or order is encoded and measured.
- **Baseline description:** the simplest model or protocol that reproduces the baseline behavior.
- **Available validation modes:** simulation, analytical derivation, numerical diagonalization, or non-operational experimental design.
- **Constraints and boundaries:** safety, resource, ethical, or operational limits; excluded regimes.

## Core Workflow

An ordered end-to-end route. Proceed only when a stage’s decision gate is passed; otherwise iterate or stop.

### Stage 1 – Frame the gap and decompose the mechanism
1. Define the bottleneck in scaling or qualitative behavior.
2. Decompose the target mechanism into necessary components: state creation, selection or symmetry breaking, coupling or composition, and robustness.
3. **Gate 1 (Candidate Gate):** If the bottleneck cannot be decomposed into testable sub-mechanisms, stop and reformulate the research question.

### Stage 2 – Build a minimal model and map symmetries
1. Construct the smallest model that retains the bottleneck and the proposed state variables.
2. Identify relevant symmetries, invariants, and order parameters.
3. Define how discrete or coarse-grained states emerge from continuous dynamics.
4. **Gate 2 (Symmetry Gate):** If the minimal model cannot exhibit the target states or transitions under any parameter, reject the substrate or revise the state definition.

### Stage 3 – Generate ranked hypotheses with failure modes
1. For each sub-mechanism (state quality, drive/coupling, bias/symmetry breaking, scaling, robustness), produce a concise hypothesis.
2. Label evidence strength (strong / moderate / weak / speculative), key assumptions, predicted qualitative signature, and most likely failure mode.
3. **Gate 3 (Hypothesis Gate):** If no hypothesis yields a falsifiable prediction, stop and acquire more baseline data or a simpler model.

### Stage 4 – Design staged validation with controls
1. **Single-unit test:** confirm stable states and controllable transitions in isolation.
2. **Small-coupled test:** verify mapping, interaction logic, and symmetry controls using the smallest nontrivial network.
3. **Scaling or protocol test:** probe size-dependent or path-dependent degradation only after earlier stages pass.
4. Define positive, negative, symmetry, and model controls for each substage.
5. Define explicit stop conditions (e.g., states indistinguishable, controls indistinguishable, non-monotonic response without mechanism).
6. **Gate 4 (Control Gate):** If a stage lacks a feasible negative or symmetry control, redesign before proceeding.

### Stage 5 – Execute minimal viable validation
1. Run the planned simulation or non-operational experiment.
2. Pre-register expected signatures and failure criteria.
3. Record all variables, initial conditions, random seeds, solver settings, and readout rules.
4. **Gate 5 (Stability Gate):** If positive controls fail or negative controls match target predictions, halt and debug the protocol or model.

### Stage 6 – Discriminate mechanism from artifact
1. Compare the candidate against the baseline, ablated, and alternative-mechanism controls.
2. Verify that improvement tracks the proposed mechanism and disappears when the mechanism is removed.
3. Quantify robustness to perturbations, noise, parameter variation, and disorder.
4. **Gate 6 (Mechanism Exclusion Gate):** If a simpler baseline or ablated model reproduces the result, demote the hypothesis and return to Stage 3.

### Stage 7 – Bound claims and plan iteration
1. Label each conclusion as verified, partially supported, or unsupported.
2. State explicit boundaries: model class, size regime, noise level, symmetry assumptions.
3. Decide: scale up, redesign, or stop.
4. **Gate 7 (Iteration Gate):** If scaling introduces new failure modes not explained by the current mechanism, return to Stage 2 with revised assumptions.

## Output Format

When using this skill, the agent should return:

1. **Research question and gap diagnosis** – the bottleneck and why existing explanations are insufficient.
2. **Mechanism decomposition** – states, barrier, drive/bias, coupling, and expected input-output relation.
3. **Ranked hypotheses table** – claim, evidence strength, key assumptions, predicted signature, and likely failure mode for each.
4. **Staged validation plan** – single-unit, small-coupled, and scaling tests; controls; metrics; and stop conditions.
5. **Analysis and discrimination plan** – baseline comparison, ablation, robustness checks, and visualization strategy.
6. **Iteration decision log** – result, interpretation, next stage, and stopping rationale.
7. **Validity and boundary statement** – claim bounds, confounders, reproducibility needs, and extrapolation limits.

## Validation Gates

- **Candidate Gate:** The bottleneck is decomposed into testable sub-mechanisms.
- **Symmetry Gate:** The minimal model can exhibit target states and transitions.
- **Hypothesis Gate:** Every active hypothesis has a falsifiable prediction.
- **Control Gate:** Each validation stage includes positive, negative, symmetry, and model controls.
- **Stability Gate:** Positive controls succeed and negative controls behave as expected.
- **Mechanism Exclusion Gate:** The result is not reproduced by simpler baselines or ablations.
- **Iteration Gate:** Scaling or protocol changes do not introduce unexplained failure modes.

## Claim Boundaries

- Distinguish verified mechanism demonstrations from inferred extrapolations.
- Limit claims to the tested model class, system size, and environmental conditions.
- Do not generalize from minimal-model success to field-wide consensus or asymptotic scaling without dedicated evidence.
- Separate simulation-supported claims from analytically proven statements.
- Do not treat single-device or single-model results as evidence for array-level or hardware-level practicality.

## Failure Modes

- **State ambiguity:** Intermediate or unreadable states erase discrete encoding.
- **Hidden bias:** Unintended symmetry breaking masquerades as the intended mechanism.
- **Artifact dominance:** Drift, initialization, readout disturbance, heating, or numerical solver effects explain the signal.
- **Fragile mechanism:** The result disappears under small perturbations or realistic disorder.
- **Non-composability:** Single-element behavior fails when units are coupled into larger aggregates.
- **Extrapolation error:** Scaling changes the coupling regime or introduces new dynamical transitions.
- **Endpoint mismatch:** A protocol or model does not preserve required initial or final conditions.

## Validity Checks

- Are state variables, observables, and domain constraints explicit?
- Does every variable and constraint have a clear representation in the dynamical system?
- Are positive, negative, symmetry, and model controls included before claiming advantage?
- Are success rates and probability estimates based on repeated independent trials with varied conditions?
- Are local stability claims restricted to their valid neighborhood?
- Are numerical artifacts, transient removal, and convergence diagnostics checked?
- Are all hypotheses labeled with evidence strength and failure modes?
- Are stop conditions and boundary conditions defined before evaluation?
- Is the mechanism specific enough to fail when removed in a control?
- Are paper-supported mechanisms, model-supported reasoning, and agent-inferred hypotheses clearly separated?

## Provenance

- Synthesized from cluster 7.0 (symmetry-guided mechanism discovery and validation).
- Source-skill references: `bifurcation-oscillator-ising-research-skill`, `invariant-encoded-nonlinear-computing-research-design`, `reversible-superconducting-circuit-exploration`, `1rsb-cavity-method-research-design`, `spintronic-probabilistic-bit-research`, `reversible-josephson-research-workflow`, `nonlinear-dynamics-research-workflow`, `quantum-annealing-path-design`.
- No specific paper conclusions, numerical parameters, or operational protocols are reproduced in the workflow body.
