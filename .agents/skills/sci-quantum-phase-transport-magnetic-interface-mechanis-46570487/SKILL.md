---
name: sci-quantum-phase-transport-magnetic-interface-mechanis-46570487
description: A reusable end-to-end workflow for designing research plans that discriminate competing mechanisms behind observable anomalies in quantum, magnetic, transport, and interfacial condensed-matter systems.
scienceevolve-title: "Quantum materials and condensed matter · phase transport magnetic interface mechanism discovery workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Use this skill to generate end-to-end research plans for observable-driven mechanism discovery and validation. It abstracts a transferable method across condensed-matter domains: frame a reproducible anomaly as a mechanism-discrimination problem, generate ranked hypotheses with explicit assumptions and failure modes, design a multi-control validation study, pre-register analysis steps, and iterate with strict claim boundaries. The skill is agnostic to specific material stacks, device geometries, or numerical parameters.

# When to use

- The user asks for new research directions in systems with ambiguous phase boundaries, coupled order parameters, hidden order, or anomalous transport, magnetic, thermal, or interfacial responses.
- The user needs to convert an observed anomaly into testable hypotheses, controls, metrics, and iteration rules.
- The user wants to abstract a paper-derived scientific method into a reusable plan without copying exact materials, fabrication recipes, or apparatus settings.
- The task involves discriminating a proposed mechanism from simpler baselines (e.g., equilibrium, thermal, disorder-only, or conventional background).

Do not use this skill for operational synthesis protocols, nanofabrication recipes, cryogenic/magnetic-field/high-pressure execution procedures, or as a source of field-wide consensus claims.

# Inputs required

Before generating a plan, request or infer:

- **Target system/platform:** material family, dimensionality, symmetry, and known electronic or magnetic ground states.
- **Observable anomaly:** the transport, spectroscopic, magnetic, structural, or thermodynamic feature requiring explanation.
- **Baseline model:** the simplest existing explanation (equilibrium, thermal, single-particle, disorder-only, etc.).
- **Candidate tuning axes:** composition, pressure, strain, field, temperature, carrier density, dimensionality, or disorder.
- **Available probes:** measurement modalities that can access response-side, loss-channel, background, structural, magnetic, and carrier observables.
- **Known confounders:** sample history, contact geometry, anisotropy, inhomogeneity, drift, heating, or measurement artifacts.
- **Claim level:** phenomenological observation, mechanism discrimination, cross-system pattern, or theory refinement.
- **Constraints:** safety, compliance, facility access, reproducibility, and ethical boundaries.

# Core Workflow

Follow this ordered route. Do not skip decision gates.

## 1. Anomaly Framing & Gap Diagnosis
- Define the reproducible observable feature (e.g., crossover, hysteresis, switching, peak, anisotropy, or hidden-order proxy) in domain-agnostic terms.
- Identify why the baseline model explains only part of the data and where it fails (correlated signatures, perturbation dependence, history effects, or multi-modal inconsistency).
- State a concise mechanism-discrimination question.

## 2. Hypothesis Generation & Ranking
- Generate 3–5 candidate mechanisms (e.g., order-parameter coupling, nonequilibrium feedback, hidden symmetry breaking, phase coexistence, percolation, localization, or dopant-induced decoupling).
- For each hypothesis, specify:
  - **Mechanistic rationale**
  - **Predicted signatures** across multiple observables
  - **Evidence strength** (strong / moderate / weak / speculative)
  - **Key assumptions**
  - **Likely failure mode**
  - **Minimal falsification test**
- Rank hypotheses by discriminating power and feasibility, not by desirability.

## 3. Study Design & Control Matrix
- Define independent variables (tuning axis), dependent variables (response and complementary probes), and hidden/nuisance variables.
- Assemble a control matrix:
  - **Baseline / negative control:** regime where the proposed mechanism should be absent or suppressed.
  - **Positive control:** regime or reference where a known signature is recoverable.
  - **Artifact control:** checks for drift, contact effects, geometry, heating, and background subtraction.
  - **Structural / symmetry control:** test whether structural or symmetry changes explain the trend.
  - **History control:** reversibility, sweep-direction, and preparation-sequence checks.
- Specify **minimal viable validation:** the smallest experiment that can falsify the leading hypothesis.
- Pre-register evaluation metrics and **stop conditions** before data collection.

## 4. Preprocessing & Feature Extraction
- Document all normalization, baseline correction, smoothing, and interpolation choices.
- Test sensitivity of features to preprocessing parameters; avoid choosing procedures to force a desired marker.
- Extract quantitative features using pre-registered rules (e.g., curvature, inflection, hysteresis width, activation energy, crossover scale).
- Propagate uncertainty and mask regions where derivative or shape estimates are unreliable.

## 5. Mechanism Discrimination & Model Comparison
- Compare the baseline model and each candidate mechanism using the **same** observables and feature set.
- Enforce **cross-modal consistency:** the proposed mechanism must align with structural, magnetic, thermodynamic, or carrier-density indicators, not just the primary response.
- Quantify correlations among multiple response features to rule out single-parameter coincidences.
- Actively test alternative explanations: artifacts, disorder, heating, contact effects, phase separation, or conventional background dominance.

## 6. Evidence Integration & Iteration Gate
- **Gate A — Support:** If independent probes agree and controls pass, strengthen the hypothesis and proceed to claim bounding.
- **Gate B — Ambiguity:** If evidence is mixed, identify the weakest assumption and design the next discriminating experiment (smallest test that resolves the ambiguity).
- **Gate C — Contradiction:** If observables disagree or controls fail, generate confounder hypotheses or reject the mechanism before escalating model complexity.
- **Gate D — Disappearance:** If the anomaly vanishes under improved preprocessing, calibration, or artifact control, stop and redefine the anomaly.
- Update evidence strengths and redesign the study plan before another loop.

## 7. Claim Bounding & Output Packaging
- Separate:
  - **Verified observations** (reproducible features)
  - **Model-supported interpretations** (mechanism compatible with evidence)
  - **Analogy-based inferences** (extrapolated from related systems)
  - **Speculative extensions** (untested predictions)
- Bound claims to the tested architecture, tuning range, temperature regime, and sample state.
- Assemble the final deliverables.

# Output Format

When using this skill, produce:

1. **Research question & gap diagnosis** — concise mechanism-discrimination question and baseline-model failure points.
2. **Ranked hypothesis table** — hypothesis, predicted signatures, evidence strength, key assumptions, likely failure modes, minimal falsification test.
3. **Study design** — variables, control matrix, minimal viable validation, metrics, and stop conditions.
4. **Analysis plan** — preprocessing rules, feature extraction, model comparison, uncertainty handling, and robustness checks.
5. **Iteration decision log** — outcome of each decision gate (support / ambiguity / contradiction / disappearance) and next action.
6. **Claim boundary statement** — explicit separation of observation, interpretation, inference, and speculation, with regime boundaries.
7. **Validity and safety notes** — confounders, reproducibility requirements, and non-operational safety constraints.

# Validation Gates

Before advancing past each stage, confirm:

- **Reproducibility:** The anomaly is stable across repeated measurements, samples, cooldowns, or equivalent datasets.
- **Artifact independence:** The feature survives improved calibration, drift control, and background subtraction.
- **Control passing:** Negative controls remain featureless; positive controls recover expected behavior; artifact controls do not reproduce the anomaly.
- **Cross-modal consistency:** Structural, magnetic, thermal, or carrier observables align with the primary response interpretation.
- **Model parsimony:** A simpler baseline model is ruled out before accepting a more complex mechanism.
- **Uncertainty quantification:** Feature extraction, sample variability, and model-choice uncertainties are reported.

# Claim Boundaries

- **Verified observation:** Reproducible feature in the measured dataset under stated conditions.
- **Model-supported interpretation:** Mechanism that explains correlated features across independent observables better than the baseline.
- **Analogy-based inference:** Extension to related systems or regimes supported by similarity arguments but not directly validated.
- **Speculative extension:** Prediction beyond the tested tuning range, material family, or measurement regime.

Never present a single-system or single-probe result as field-wide consensus.

# Failure Modes

- **Artifact dominance:** The anomaly is caused by measurement drift, contact effects, heating, or ill-conditioned preprocessing.
- **Baseline sufficiency:** A simpler model explains the data equally well without added mechanism complexity.
- **Control failure:** Positive and negative controls are indistinguishable, or artifact controls reproduce the feature.
- **Cross-modal inconsistency:** Transport, magnetic, structural, or thermal indicators contradict the proposed mechanism.
- **Underdetermination:** Multiple mechanisms fit the data equally well; no discriminating observable was measured.
- **Overfitting:** Model parameters lose physical interpretability or are overly sensitive to feature-extraction choices.
- **Sample variability:** Device-to-device or batch-to-batch variation exceeds the design effect, obscuring mechanism signatures.

# Validity Checks

Before finalizing any output, verify:

- **Confounding:** Have structural disorder, inhomogeneity, geometry, interfaces, oxidation, batch effects, or history been considered?
- **Mechanism specificity:** Does each hypothesis predict at least one signature that would be absent under competing mechanisms?
- **Preprocessing robustness:** Are feature-extraction choices documented and tested against reasonable alternatives?
- **Statistical validity:** Are uncertainty, repeatability, normalization sensitivity, and sample-size limitations reported?
- **Boundary conditions:** Are claims limited to the tested material class, tuning range, temperature regime, and sample state?
- **Extrapolation marking:** Are agent-generated hypotheses clearly labeled as unverified outside the tested design space?
- **Reproducibility:** Could another group reconstruct the analysis from reported descriptors, rules, and exclusions?

# Provenance

Synthesized from cluster **34.0** (observable-driven mechanism discovery and validation). Source skills: `nonequilibrium-superconducting-island-research`, `ane-ternary-transport-material-exploration`, `transparent-magnetic-oxide-exploration`, `cuprate-crossover-curvature-mapping`, `spin-orbit-mott-doping-exploration`, `chiral-glass-hidden-order-exploration`, `quantum-hall-domain-transport-research`, `low-dimensional-quantum-materials-exploration`.
