---
name: sci-quantum-quantum-transport-mechanism-discovery-workf-6b1e3d2d
description: A reusable end-to-end workflow for discovering and validating microscopic mechanisms behind anomalous quantum transport and correlated-electron phenomena using symmetry constraints, multi-observable controls, and iterative hypothesis discrimination.
scienceevolve-title: "Quantum materials and condensed matter · quantum transport mechanism discovery workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Help an agent design research questions and validation plans for quantum materials and correlated-electron systems where an anomalous transport, thermodynamic, or spectroscopic signal may reflect intrinsic band geometry, collective instabilities, extrinsic disorder, or measurement artifacts. The workflow emphasizes symmetry-guided discrimination, baseline decomposition, and iterative convergence across independent observables.

## When to use

Use this skill when the user asks to:
- Propose research questions for quantum transport, heavy-fermion, topological, or correlated-electron anomalies.
- Design experiments or analyses to separate intrinsic quantum-geometric or collective mechanisms from extrinsic scattering, disorder, or artifact contributions.
- Interpret ambiguous nonlinear, transverse, or low-temperature transport signatures.
- Iterate between hypothesis generation and experimental validation without overcommitting to a single microscopic model.

Do not use this skill for operational synthesis recipes, hazardous procedural instructions, device fabrication protocols, or definitive microscopic identification from a single observable.

## Inputs required

Before producing a plan, request or identify:
- Target system class and the quantum regime it is expected to enter.
- The observed anomaly or deviation to be explained.
- The baseline model, symmetry, or clean-limit expectation against which the anomaly is defined.
- Available tuning axes and measurement channels.
- Known or suspected confounders such as disorder, contacts, heating, calibration drift, or background effects.
- Comparison systems or control conditions that differ along one mechanistic axis.
- Safety, facility, and regulatory constraints.

## Core Workflow

An ordered end-to-end route with decision gates and iteration/stop conditions.

1. **Frame the anomaly as a mechanism discriminator.**
   - Define the research question by asking what class of mechanism would produce the observed deviation from the protected baseline.
   - **Gate:** If the anomaly cannot be defined relative to a justified baseline, stop and refine the baseline model.

2. **Establish the protected baseline.**
   - State the symmetry, conservation law, or clean-limit behavior that defines the expected response.
   - Identify the reference regime where this baseline should appear.
   - **Gate:** If the reference behavior is absent or inconsistent, halt interpretation and redesign the probe or analysis strategy.

3. **Generate competing hypotheses.**
   - **Intrinsic:** band-geometry, collective instability, or coupled-order mechanism.
   - **Extrinsic:** disorder-induced scattering, interface effect, or rare-region physics.
   - **Artifact:** heating, contact asymmetry, misalignment, calibration drift, or background nonlinearity.
   - **Competing order:** alternative structural, electronic, or magnetic order that mimics the target signature.
   - For each, state the mechanistic claim, key assumptions, predicted symmetry/scaling signature, evidence strength, and failure mode.

4. **Design minimal viable validation.**
   - Select a primary tuning axis and at least two independent measurement channels.
   - Define positive, negative, strong, and artifact controls.
   - Pre-register the feature taxonomy and decision rules.
   - **Gate:** If no falsifiable control exists for a hypothesis, flag it as low-discriminability and deprioritize.

5. **Execute symmetry and scaling decomposition.**
   - Decompose the response by parity, tensor symmetry, harmonic order, orientation, or carrier-density scaling.
   - Separate intrinsic-like and extrinsic-like contributions.
   - **Gate:** If the predicted symmetry signature is absent after sensitivity checks, reject or revise the corresponding hypothesis.

6. **Triangulate with multi-observable convergence.**
   - Require consistency across independent probes before elevating a mechanism.
   - Use comparison systems to isolate necessary ingredients.
   - **Gate:** If the anomaly appears in only one channel or is irreproducible where ensemble consistency is expected, downgrade the claim.

7. **Run uncertainty audit and robustness checks.**
   - Test stability across disorder realizations, model variants, background choices, and analysis windows.
   - Quantify sample-to-sample variation and reproducibility.
   - **Gate:** If conclusions depend on undocumented preprocessing or a single unreplicated realization, suspend interpretation.

8. **Update confidence and iterate.**
   - **Strengthen** if the hypothesis survives controls, predicts discriminating trends, and converges across observables.
   - **Weaken** if it relies on fragile approximations or unsupported microscopic assumptions.
   - **Replace** if an artifact or simpler mechanism explains the data.
   - **Narrow** if the mechanism holds only in a limited regime.
   - **Stop:** If all candidate models fail major features, return to step 3 with revised assumptions.

9. **Bound claims and define the next discriminator.**
   - State what is supported, what remains speculative, and where extrapolation is unjustified.
   - Identify the next minimal experiment that best separates remaining alternatives.
   - **Stop:** If the mechanism cannot be distinguished from observational uncertainty, end the cycle and propose a new discriminator.

## Output Format

For each use of this skill, produce:

1. **Research question** — Mechanism-discriminating question and why the target system is plausible.
2. **Hypothesis set** — Baseline, intrinsic, extrinsic, artifact, and competing-order hypotheses with evidence strength, assumptions, predicted signatures, and failure modes.
3. **Validation plan** — Minimal viable validation with variables, controls, evaluation metrics, and stop conditions.
4. **Analysis plan** — Feature taxonomy, symmetry/scaling decomposition, baseline validation, anomaly classification, multi-observable comparison, and uncertainty propagation.
5. **Iteration roadmap** — Confidence update rules, conditions to abandon or revise mechanisms, and the next discriminator experiment.
6. **Claim boundary statement** — Supported scope, extrapolation limits, and distinction between established evidence and agent inference.
7. **Validity and safety summary** — Main confounders, reproducibility requirements, boundary conditions, and non-operational safety constraints.

## Validation Gates

- **Baseline gate:** Reference behavior must be present and consistent before anomalies are interpreted.
- **Symmetry gate:** The response must match the predicted parity, tensor form, or scaling of the claimed mechanism.
- **Control gate:** Every mechanism must face at least one independent control capable of falsifying it.
- **Convergence gate:** Mechanism claims require cross-observable consistency; single-channel anomalies are downgraded.
- **Robustness gate:** Conclusions must survive alternative analysis choices, model variants, or disorder realizations.
- **Specificity gate:** The explanation must predict unique or strongly discriminating trends, not merely fit the data post hoc.

## Claim Boundaries

- Distinguish paper-supported methodological patterns from new agent inferences.
- Limit claims to the tested system, regime, and observable set; do not generalize to unrelated materials without direct validation.
- Treat magnitude estimates as constraints on mechanisms, not as standalone proofs.
- Label phenomenological correlations separately from microscopic mechanisms.
- Do not present single-study or single-sample findings as field-wide consensus.

## Failure Modes

- **Baseline failure:** The protected baseline is absent or misidentified, making anomaly classification unreliable.
- **Artifact dominance:** The signal is explained by heating, contacts, misalignment, calibration drift, or background effects.
- **Symmetry mismatch:** The observed parity, scaling, or tensor structure contradicts the proposed mechanism.
- **Underconstrained model:** Multiple mechanisms fit the data equally well without a discriminating control.
- **Sample irreproducibility:** Anomalies are sample-specific or disappear under repeated measurement.
- **Extrapolation error:** Mechanisms justified in one regime are incorrectly applied to untested conditions.
- **Confounding co-variation:** The tuning axis changes unintended variables that mimic the target mechanism.

## Validity Checks

- **Confounding:** Could disorder, strain, inhomogeneity, contact geometry, or secondary phases explain the observation?
- **Reproducibility:** Does the feature persist across independent samples, devices, cooldowns, or analysis choices?
- **Boundary conditions:** Is the system in the intended regime, and are assumptions about dimensionality, carrier balance, or symmetry valid?
- **Statistical validity:** Are uncertainties, baseline choices, repeated measurements, and model-selection risks reported?
- **Mechanism specificity:** Does the explanation uniquely predict the observed response, or can several mechanisms fit the same data?
- **Comparison specificity:** Do comparison systems differ along controlled mechanistic axes rather than many unrelated properties?
- **Data independence:** Are training, model selection, and validation separated?
- **Negative evidence:** Are null results interpreted against sensitivity and control performance?

## Provenance

- Synthesized from cluster 65.0 (symmetry-guided mechanism discovery and validation).
- Source skills: quantum-limit-thermoelectric-exploration, bosonic-thermal-hall-research-design, ferromagnetic-quantum-criticality-research, quantum-geometry-nonlinear-transport-exploration, actinide-chalcogenide-research-design, correlated-oxide-order-coupling-explorer, low-temperature-magnetotransport-exploration, mesoscopic-transport-nonlinear-response.
- Preserves the shared workflow route: baseline definition → hypothesis generation → symmetry/scaling decomposition → multi-observable triangulation → iterative convergence → claim bounding.
