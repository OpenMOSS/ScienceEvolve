---
name: sci-fusion-stellarator-transport-plasma-fusion-evidence-16f6c464
description: A reusable end-to-end workflow for designing, validating, and auditing symmetry-guided evidence claims in stellarator and magnetic-confinement plasma transport research.
scienceevolve-title: "Magnetic confinement fusion · stellarator transport plasma fusion evidence analysis workflow"
scienceevolve-area: magnetic-confinement-fusion
---

# Purpose

Generate and evaluate research questions in stellarator and magnetic-confinement plasma physics through a symmetry-guided, mechanism-first approach. This workflow transfers a reusable pattern: frame a confinement or transport gap as a falsifiable mechanism chain, decompose candidate explanations across conserved channels and scale separations, design controlled validation with strong controls, converge evidence via cross-validation, and iteratively bound claims until they are either strengthened, split, or stopped.

# When to use

Use this skill when asked to:
- Propose new research questions in stellarator equilibrium, stability, transport, turbulence, topology control, or fast-ion behavior.
- Design non-operational simulation or diagnostic-validation studies for magnetic-confinement systems.
- Audit whether a proposed mechanism is distinguishable from confounders and alternative explanations.
- Plan analysis of profile, power-balance, gyrokinetic, or orbit-following data with explicit uncertainty and channel separation.
- Iterate hypotheses after model-data mismatch or diagnostic disagreement.

Do not use this skill for operational device instructions, clinical/biological research, or as a substitute for engineering safety review.

# Inputs required

Collect or request:
- **Target system:** magnetic configuration family, symmetry assumptions, and whether flux surfaces are nested, stochastic, or edge-open.
- **Scientific objective:** equilibrium limit, stability boundary, transport channel, topology optimization, or mechanism discrimination.
- **Available evidence:** equilibrium reconstructions, simulation outputs, diagnostic observables, prior literature, and known constraints.
- **Candidate variables:** pressure, current, rotational transform, shear, magnetic-well indicators, helical-harmonic content, field-line geometry, and gradient measures.
- **Modeling resources:** analytic derivation capacity, numerical solvers, transport databases, gyrokinetic tools, orbit codes, and visualization workflows.
- **Uncertainty context:** profile-fit limitations, calibration bounds, known missing physics, and metadata categories (heating, fueling, configuration, wall conditioning).
- **Safety and compliance boundaries:** non-operational research scope, institutional review requirements, and authorized experimental envelopes.

# Core Workflow

Follow these stages in order. Each stage includes a decision gate that determines whether to proceed, redesign, or stop.

## 1. Frame the gap and mechanism chain
Define the confinement or transport anomaly as a mismatch between expected and observed behavior. Construct an explicit mechanism chain linking a controllable symmetry, topology, or profile feature to a measurable response through a physical or mathematical step.

- **Decision gate:** If the gap cannot be expressed as a falsifiable mechanism chain, stop and reformulate the research question.

## 2. Generate mechanism-first hypotheses
Produce at least three hypotheses (e.g., mechanism-centered, robustness-centered, experimental-discrimination). For each, state:
- Causal claim and regime of applicability.
- Predicted observable change and compensating trade-off.
- Failure boundary where the mechanism should cease to apply.
- Evidence strength (high / medium / low), key assumptions, likely failure modes, and a minimal discriminating test.

- **Decision gate (Candidate gate):** If hypotheses do not predict distinct outcomes under the proposed controls, refine or split them before proceeding.

## 3. Design controlled validation
Define baseline and perturbed cases while holding global state comparable or explicitly modeling changes. Select:
- **Independent variables:** geometry, profile shape, perturbation type, or symmetry-quality measure.
- **Dependent variables:** transport coefficients, stability indices, topology metrics, or diagnostic proxies.
- **Metadata variables:** heating class, fueling, configuration family, and data-quality flags.

Establish controls:
- Baseline (unmodified).
- Positive (known response expected).
- Negative (mechanism should be inactive).
- Mechanism-disabled (suppress candidate term when possible).
- Channel/geometry (test expected electron/ion or configuration dependence).
- Robustness (vary profiles, boundary conditions, or model closures).

Define evaluation metrics tied to the mechanism and pre-register stop conditions (assumption violation, unresolved confounding, uncertainty overlap).

- **Decision gate:** If controls cannot isolate the mechanism from confounders, redesign the comparison.

## 4. Execute layered analysis
- **Audit:** Verify equations, operators, conservation laws, divergence constraints, and boundary conditions.
- **Decompose:** Separate particle, momentum, energy, and current channels; distinguish background/neo-classical and residual/turbulent contributions; separate mean and fluctuating components only when mathematically justified for the geometry.
- **Scale:** Identify dominant balances and classify neglected terms by expected error source.
- **Sensitivity sweep:** Vary profiles, geometry, symmetry assumptions, and model closures within plausible ranges.

- **Decision gate (Robustness check):** If conclusions change sign or magnitude under coordinate changes, profile perturbations, or closure changes, halt and bound the claim.

## 5. Converge evidence through cross-validation
Require agreement across independent proxies:
- Structure/topology proxy (equilibrium, field-line, or symmetry metric).
- Local/boundary-response proxy (transport, exhaust, or fluctuation diagnostic).
- Global-state proxy (confinement, stored energy, or rotation).

Compare lower- and higher-fidelity models only on shared terms; treat disagreement as a research signal, not noise. Test symmetry assumptions explicitly; do not assume symmetry for localized perturbations. Grade each result as: supports, contradicts, inconclusive, or requires higher-fidelity validation.

- **Decision gate (Mechanism exclusion):** If alternative mechanisms remain consistent with all observations, do not claim exclusive support.

## 6. Bound claims and audit inference
- Separate validated claims from agent-inferred hypotheses.
- State explicit boundaries: model closure, configuration family, regime, and spatial/domain extent.
- Document the failure mode register for the current evidence level.

- **Decision gate (Claim bounding):** If extrapolation beyond the tested regime is required, label it as speculative and list missing validations.

## 7. Iterate or terminate
- **Strengthen:** If evidence converges across diagnostics and models, refine the hypothesis and plan targeted extensions.
- **Split:** If local and global evidence disagree, decompose into sub-hypotheses (e.g., equilibrium vs. stability, electron vs. ion channel).
- **Redesign:** If results are sensitive to untested assumptions, make robustness the next central question.
- **Stop:** Terminate if scale-separation assumptions are violated, a higher-fidelity check reverses the sign, diagnostics cannot distinguish mechanisms, or uncertainty envelopes overlap the null.

- **Iteration gate:** Return to Stage 2 or 3 with updated hypotheses; do not loop indefinitely without new discriminating data.

# Output Format

Return results in this structure:

1. **Research question** — concise, mechanism-grounded gap statement.
2. **Mechanism map** — chain from controllable feature to observable response.
3. **Hypotheses table** — causal claim, evidence strength, key assumptions, likely failure modes, minimal test.
4. **Validation plan** — variables, controls, metrics, and stop conditions.
5. **Analysis plan** — audits, decomposition, sensitivity sweeps, and cross-checks.
6. **Iteration plan** — triggers for strengthen, split, redesign, or stop.
7. **Claim boundary statement** — validity limits, extrapolation guards, and speculative labels.
8. **Failure mode register** — documented risks for the current evidence level.

# Validation Gates

Before advancing past Stage 4, confirm:
- Predictions were pre-registered before data fitting.
- Controls are sufficient to separate the candidate mechanism from confounders.
- Conservation laws and internal consistency checks pass.
- Numerical results are stable under resolution, truncation, and solver changes.
- Cross-diagnostic or cross-model agreement is documented where claimed.

# Claim Boundaries

- Claims are bounded by the tested magnetic configuration family, model closure, and plasma regime.
- Averaged, reduced, or simplified models are not extrapolated beyond their scale-separation or symmetry assumptions.
- Single-study or single-model results are not presented as field-wide consensus.
- Simulation outputs are distinguished from experimental validation; computational improvements are not treated as proof of physical behavior without independent checks.

# Failure Modes

- Scale-separation or averaging assumptions are violated.
- Stability, equilibrium, or solver accuracy depends on a single fragile coordinate or discretization choice.
- Large opposing terms mask a small net effect (cancellation).
- Confounding variables correlate with the proposed driver.
- Diagnostic ambiguity prevents mechanism discrimination.
- Higher-fidelity checks reverse the sign or magnitude of the main conclusion.
- Sensitivity to unverified profile fits, boundary conditions, or unmodeled physics.

# Validity Checks

- **Confounding:** Are drivers separable from heating, fueling, configuration, or scenario labels?
- **Coordinate/geometry invariance:** Do conclusions survive changes of magnetic coordinates or geometric representations?
- **Approximation validity:** Are reduced-model corrections small, or are they driving the claimed result?
- **Channel/mode completeness:** Do analyzed channels or perturbations represent the most relevant physics?
- **Boundary conditions:** Do boundaries artificially stabilize, destabilize, or bias the system?
- **Numerical robustness:** Are results stable under resolution, basis size, mesh quality, and solver choices?
- **Diagnostic identifiability:** Can the proposed mechanism be distinguished from competing explanations?
- **Reproducibility:** Are equations, inputs, normalization, assumptions, and exclusion criteria documented for independent replication?
- **Extrapolation boundary:** Are conclusions labeled by regime, geometry, and model fidelity?

# Provenance

- Synthesized from cluster 2, subcluster 2.0.
- Source skills: stellarator-mhd-research-workflow; rmp-plasma-transport-exploration; quasi-axisymmetric-stellarator-research-design; fast-ion-charge-exchange-loss-research-workflow; stellarator-topology-control-research; stellarator-turbulent-transport-exploration; inclined-coil-flux-surface-research; gyrokinetic-stellarator-field-solver-research.
