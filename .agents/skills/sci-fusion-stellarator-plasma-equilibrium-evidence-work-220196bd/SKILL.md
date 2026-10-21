---
name: sci-fusion-stellarator-plasma-equilibrium-evidence-work-220196bd
description: End-to-end evidence analysis and claim audit workflow for stellarator and magnetic confinement plasma equilibrium, stability, and transport hypothesis validation.
scienceevolve-title: "Magnetic confinement fusion · stellarator plasma equilibrium evidence workflow"
scienceevolve-area: magnetic-confinement-fusion
---

## Purpose

Transform observational anomalies, simulation residuals, or theoretical gaps in magnetic confinement plasma equilibrium and stability into auditable, falsifiable research questions. Guide the design of minimal viable validation studies, control hierarchies, and iterative claim bounding across model hierarchies.

## When to use

Trigger when the user needs to:
- Explain three-dimensional MHD equilibrium deviations, magnetic topology changes, or anomalous transport signatures in stellarator, tokamak-like, or helical confinement concepts.
- Generate competing mechanism hypotheses for flow, pressure, current, or boundary-driven structural changes.
- Design simulation, diagnostic, or theoretical validation plans with explicit controls and stop conditions.
- Audit the strength of evidence when migrating conclusions from one configuration, scale, or model to a new problem.

Do not use for operational device control, real-time plasma operations, or safety-critical engineering decisions.

## Inputs required

- **System context**: Confinement concept, equilibrium assumptions (e.g., nested surfaces, ideal/resistive, static/rotating), and topological boundary conditions.
- **Anomaly or gap description**: Observational discrepancy, model residual, or structural feature that existing theory cannot explain.
- **Background fields and profiles**: Pressure, current density, flow, magnetic geometry, and their uncertainties or sources.
- **Model hierarchy**: Available analytical, reduced-order, or numerical equilibrium/transport models and their known limits.
- **Resources and constraints**: Accessible diagnostic data, simulation codes, resolution limits, and reproducibility metadata requirements.
- **Scope boundaries**: Non-operational research limits, data governance rules, and prohibited extrapolation domains.

## Core Workflow

1. **Frame the Research Question**
   - Convert the anomaly into a causal, falsifiable proposition (e.g., "If mechanism X dominates in region Y, then observable Z should change directionally").
   - *Decision Gate*: If the question cannot be cast as a falsifiable mechanism statement, halt and refine the anomaly description.

2. **Map Evidence and Identify Gaps**
   - Catalog direct evidence, indirect inference, model analogies, and uncertainty sources.
   - Compare predictions across model hierarchies (e.g., axisymmetric vs. three-dimensional, static vs. rotating, single-scale vs. multi-scale) to locate assumption breakdowns.
   - *Decision Gate*: If no reproducible gap exists between model predictions and observations, stop; the anomaly may be within expected variance or diagnostic noise.

3. **Generate Competing Mechanism Hypotheses**
   - Propose 2–4 candidate mechanisms (e.g., equilibrium deformation, flow shear, topological change, cross-scale coupling, boundary/diagnostic artifact).
   - For each hypothesis, specify: evidence strength (high / medium / low), key physical assumptions, falsifiable predictions, and explicit failure modes.
   - *Decision Gate*: Reject hypotheses that cannot be distinguished by the available data or a minimal viable validation.

4. **Design Minimal Viable Validation (MVV)**
   - Define a baseline case and a small set of perturbation cases.
   - Establish a control hierarchy:
     - **Strong control**: identical boundary and background, varying only the target mechanism variable.
     - **Negative control**: mechanism suppressed or removed; expect null or opposite effect.
     - **Positive control**: known scenario where the mechanism is active; expect confirmed signal.
   - Define independent, dependent, and confounding variables; pre-register stop/failure conditions (e.g., non-convergence, violation of conservation laws, excessive numerical sensitivity).

5. **Execute and Acquire Data**
   - Run simulations, process diagnostics, or perform theoretical calculations according to the MVV.
   - Record full provenance: model version, input profiles, grid/resolution, coordinate conventions, initialization, and any manual adjustments.
   - *Decision Gate*: If pre-registered stop conditions are met, halt execution and return to Step 4 (redesign) or Step 2 (reframe the gap).

6. **Analyze and Attribute Mechanisms**
   - Conduct paired comparisons between baseline and perturbed cases.
   - Disentangle process contributions (equilibrium response, transport response, diagnostic artifact).
   - Compare local and global metrics jointly; check for consistency between spatial structure and integral quantities.
   - *Decision Gate*: If local and global indicators conflict without a physical explanation, halt attribution and investigate confounders or numerical artifacts.

7. **Check Convergence and Robustness**
   - Verify numerical convergence, grid independence, coordinate consistency, and conservation-law satisfaction.
   - Perform sensitivity sweeps on key inputs and boundary uncertainties.
   - *Decision Gate*: If results are not robust to reasonable variations in numerical setup or input uncertainty, downgrade claims to "unverified" and return to Step 4.

8. **Audit Claims and Bound Evidence**
   - Grade each hypothesis: supported, partially supported, refuted, or insufficient evidence.
   - Distinguish "verified within current model" from "inferred for new system" from "unsupported."
   - Bound claims by model hierarchy limits (e.g., nested-surface assumption, quasi-staticity, collisionality regime).
   - *Decision Gate*: If no hypothesis meets the threshold for partial support, return to Step 3 to reformulate or to Step 2 to redefine the gap.

9. **Iterate or Terminate**
   - **If supported**: Design stronger controls or independent cross-checks before extending to new parameter regimes or configurations.
   - **If partially supported**: Refine the mechanism chain, split into sub-hypotheses, and repeat from Step 4 with tighter diagnostics.
   - **If refuted**: Document failure modes, update the gap statement, and either terminate or pivot to alternative mechanisms.
   - **Termination condition**: The research question is answered within stated boundaries, or additional complexity cannot distinguish the remaining candidate mechanisms.

## Output Format

Each invocation produces:

1. **Research question**: One sentence, causal and falsifiable.
2. **Evidence map**: Direct evidence, indirect inference, model analogy, and uncertainty sources.
3. **Hypothesis table**: Candidate mechanisms with evidence strength, key assumptions, falsifiable predictions, and failure modes.
4. **Validation design**: Baseline, strong/negative/positive controls, variables, metrics, and pre-registered stop conditions.
5. **Analysis plan**: Paired comparisons, spatial and integral diagnostics, convergence checks, and mechanism attribution rules.
6. **Iteration decision tree**: Conditions for support, partial support, refutation, and termination.
7. **Validity and boundary notes**: Confounders, reproducibility requirements, extrapolation limits, and non-operational scope.

## Validation Gates

- **Question Gate**: The research question is causal and falsifiable, not merely descriptive.
- **Hypothesis Gate**: At least two competing hypotheses are formulated with explicit failure modes.
- **Control Gate**: Strong, negative, and positive controls are defined with expected outcomes before execution.
- **Execution Gate**: Provenance metadata is complete and stop conditions are pre-registered.
- **Convergence Gate**: Numerical/statistical robustness is demonstrated; results are insensitive to irrelevant setup variations.
- **Attribution Gate**: Mechanism attribution is supported by control differences, not correlation alone.
- **Audit Gate**: Claims are graded and bounded; extrapolation beyond model assumptions is explicitly flagged.

## Claim Boundaries

- Distinguish conclusions validated within the current model hierarchy from inferences extended to new configurations or regimes.
- Do not treat single-study or single-configuration results as domain consensus.
- Claims about equilibrium topology are bounded by stated assumptions (e.g., nested flux surfaces, ideal MHD, quasi-staticity); if these fail, claims do not apply.
- Diagnostic-to-model comparisons are bounded by mapping uncertainties (line-of-sight integration, temporal averaging, calibration).
- Operational, engineering, or safety-relevant conclusions are out of scope; all outputs are for non-operational research design only.

## Failure Modes

- **Gap Misdefinition**: The anomaly is actually within model uncertainty or diagnostic noise.
- **Underspecified Hypotheses**: Predictions lack falsifiable metrics, or competing mechanisms are not mutually exclusive.
- **Control Failure**: The negative control produces the same signal as the perturbed case, indicating uncontrolled confounding.
- **Numerical Artifact**: Results depend on grid, resolution, coordinate choice, or solver settings rather than physical mechanisms.
- **Over-Attribution**: Local metric improvements are generalized to global behavior without cross-check.
- **Boundary Violation**: The model is extrapolated beyond its derived limits (e.g., into stochastic-field, strong-coupling, or non-ideal regimes).
- **Irreproducibility**: Missing provenance metadata prevents independent verification.

## Validity Checks

- **Confounder Audit**: Pressure, flow, geometry, boundary conditions, external perturbations, and diagnostic limitations are evaluated as alternative explanations via paired controls.
- **Reproducibility**: Inputs, model versions, grid settings, and post-processing scripts are recorded to enable independent replication.
- **Sensitivity**: Key inputs are scanned or uncertainty is propagated to ensure conclusions are not single-point artifacts.
- **Numerical Validity**: Force-balance residuals, energy convergence, grid independence, and coordinate consistency are checked.
- **Physical Boundaries**: Model allowances (e.g., magnetic islands, stochasticity, non-ideal effects, multi-fluid physics) are stated, and conclusions are restricted accordingly.
- **Diagnostic Comparability**: Model outputs are mapped to observables with explicit acknowledgment of integration, averaging, and calibration effects.
- **Extrapolation Limits**: Results from one configuration or regime are treated as candidate mechanisms for new systems, not guaranteed predictions.

## Provenance

- **Cluster**: 16 / **Subcluster**: 16.0
- **Synthesized from source skills**: `mhd-flow-equilibrium-exploration`, `toroidal-plasma-equilibrium-exploration`, `stellarator-trapped-particle-orbit-exploration`, `helical-system-energetic-particle-injection-research`, `stellarator-plasma-commissioning-workflow`, `fusion-multiscale-turbulence-exploration`, `magnetized-plasma-flow-barrier-research`, `3d-mhd-equilibrium-island-research`.
- Methodology derived from reviewed magnetic confinement fusion literature. No specific paper conclusions, numerical parameters, device-specific settings, or operational protocols are embedded in the reusable workflow body.
