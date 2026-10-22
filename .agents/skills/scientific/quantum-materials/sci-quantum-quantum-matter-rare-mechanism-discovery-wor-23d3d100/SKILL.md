---
name: sci-quantum-quantum-matter-rare-mechanism-discovery-wor-23d3d100
description: A reusable end-to-end workflow for discovering and validating rare or high-energy mechanisms in quantum and condensed-matter systems through hypothesis generation, staged controls, and iterative model discrimination.
scienceevolve-title: "Quantum materials and condensed matter · quantum matter rare mechanism discovery workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Help an agent design research plans that test whether a proposed mechanism produces distinguishable signatures in quantum, high-energy, high-pressure, or rare-event matter systems. The workflow emphasizes separating candidate mechanisms from implementation artifacts, using staged validation with strong controls, and bounding claims to the tested context.

# When to use

Trigger this skill when the user asks to:

- Explore new research questions involving rare events, phase transitions, entanglement dynamics, interface phenomena, hidden-sector signatures, or monitored quantum dynamics.
- Design a study that discriminates among competing mechanisms using observable hierarchies, scaling trends, structural signatures, or information-flow diagnostics.
- Audit a model-to-data pipeline for definition mismatches, normalization errors, or implementation-sensitive choices.
- Iterate from an initial observation toward a robust, bounded mechanism claim.

Do not trigger this skill for unrelated domains, operational experimental execution, or requests requiring hazardous procedural details.

# Inputs required

Before producing a research plan, collect or request:

- **Domain and target system class**: e.g., quantum many-body, high-pressure solid-state, collider rare-event, soft-matter interface, or monitored open quantum system.
- **Competing mechanisms or theoretical models**: what each predicts and the assumptions it requires.
- **Observable signatures and diagnostics**: structural, thermodynamic, angular, entropy-based, channel-capacity, or hierarchy indicators expected to differ across mechanisms.
- **Evidence sources**: published data, simulation outputs, theoretical predictions, or benchmark results.
- **Implementation and definition details**: units, coordinate conventions, binning, normalization, reference conditions, resolution, acceptance, and calibration context.
- **Uncertainty and constraint context**: statistical and systematic uncertainties, finite-size or finite-time limits, background sources, and nuisance variables.
- **Validation level and safety boundaries**: computational, simulation-only, benchtop, or instrument-supported; institutional safety and ethics constraints.

# Core Workflow

Follow this ordered end-to-end route. Advance through a stage only if its decision gate is satisfied; otherwise iterate or stop.

## 1. Gap definition and mechanism mapping

Define the research gap as a mismatch among theory, prior data, and competing explanations. Map each candidate mechanism to at least one distinct observable signature.

- **Decision gate**: Is the gap well-defined and are the mechanisms distinguishable in principle? If not, refine the scope or observable set.

## 2. Hypothesis generation

Generate at least three competing hypotheses. For each, specify:

- Observation or gap motivating the hypothesis.
- Proposed mechanism and mechanistic rationale.
- Predicted observable signature.
- Evidence strength: strong, moderate, weak, or speculative.
- Key assumptions and boundary conditions.
- Likely failure modes (artifacts, backgrounds, alternative mechanisms).
- Minimal validation: the smallest credible test that could support or weaken the hypothesis.

- **Decision gate**: Do the hypotheses predict different outcomes under at least one control variable? If not, redesign the observable or control space.

## 3. Validation design (minimal viable → strong controls)

Design a minimal viable validation first, then layer stronger controls.

- **Minimal viable validation**: one signal region, one diagnostic, one baseline condition, and one artifact check.
- **Strong controls**:
  - Positive control: a condition expected to produce a known related signature.
  - Negative control: a condition expected to leave the target mechanism inactive.
  - Background/loss-only control: tests whether the signature is reproduced by non-mechanism effects.
  - Implementation control: isolates unit, binning, normalization, or reference-condition choices.
  - Geometry/boundary control: tests sensitivity to system size, connectivity, or boundary conditions.
  - Model control: compares at least two competing theoretical predictions.
- Define independent variables (mechanism-tuning), dependent variables (signatures), and nuisance variables (acceptance, resolution, background, finite-size effects).

- **Stop condition**: If the diagnostic cannot distinguish the target mechanism from plausible alternatives, or if safety authorization is insufficient, halt and redesign.

## 4. Baseline reproduction and definition audit

Reproduce the baseline result or model prediction under documented conditions. Audit implementation-sensitive choices:

- Units and dimensional consistency.
- Coordinate conventions and reference conditions.
- Binning, windows, normalization, and weighting.
- Sampling, averaging, and uncertainty propagation.

- **Decision gate**: Does the baseline reproduce within expected variation? If not, resolve implementation errors before testing hypotheses.

## 5. Controlled perturbation and data collection

Introduce one perturbation or condition change at a time. Record effects on magnitude, ordering, uncertainty, and interpretation.

- For computational/theoretical studies: sample across the hypothesis space without overfitting to one benchmark.
- For experimental studies: collect under predefined conditions; predefine channel regions and analysis rules before inspecting outcomes.

- **Stop condition**: If background or artifact dominates the expected signal, if the model-to-observable chain is ambiguous, or if a post hoc change is required after seeing data, halt and revise the design.

## 6. Analysis and mechanism discrimination

Extract signals using predefined metrics and regions. Evaluate qualitative signatures and quantitative agreement separately.

- Use uncertainty-aware comparisons rather than visual similarity alone.
- Compare observations against competing models; identify where each succeeds or fails.
- Classify evidence strength for each subclaim.

- **Decision gate**: Does the signature survive corrected implementation, controls, and external comparison? If no, downgrade or reject the hypothesis.

## 7. Robustness and scaling checks

Test stability across reasonable analysis variants:

- Fitting windows, binning, and normalization choices.
- System sizes, geometries, boundary conditions, or replica structures.
- Finite-size, finite-time, or discretization corrections.

- **Stop condition**: If the result depends strongly on one arbitrary choice, fitting window, or unvalidated extrapolation, halt and revise.

## 8. Iteration and claim update

Use the outcome to update the research direction:

- **Preserve**: retain the hypothesis if independent observables, controls, and model comparisons converge.
- **Downgrade**: restrict the claim to a specific parameter region, dataset, or observable regime if effects are conditional.
- **Revise**: modify assumptions if the effect direction changes but the mechanism may still operate.
- **Reject**: abandon the interpretation if corrected results consistently contradict the target signature and controls do not explain the contradiction.
- **Escalate**: seek independent reproduction when a conclusion changes after correcting implementation details or when the result affects a central claim.

- **Decision gate**: Is the evidence sufficient to support the current claim level? If not, return to step 3 or 5.

## 9. Uncertainty audit and claim bounding

Separate statistical and systematic uncertainties. Label each conclusion as:

- **Demonstrated**: directly supported by controls and reproducible evidence.
- **Projected**: plausible extrapolation within tested trends.
- **Speculative**: beyond the validated domain.

Bound all claims to the tested model class, geometry, detector context, and validation level. Do not present a single result as field-wide consensus.

# Output Format

Return a concise research plan with the following structure:

1. **Research question** — One clear question and domain context.
2. **Mechanism map and candidate hypotheses** — Ranked hypotheses with predicted signatures, evidence strength, assumptions, failure modes, and minimal validation.
3. **Validation design** — Variables, controls (positive, negative, background, implementation, geometry, model), evaluation metrics, and stop conditions.
4. **Analysis plan** — Reproduction steps, definition audit, controlled corrections, comparison method, uncertainty handling, and visualization strategy.
5. **Iteration plan** — Decision rules for preserve, downgrade, revise, reject, or escalate after new evidence.
6. **Claim boundary statement** — Explicit distinction between demonstrated findings, projected trends, and speculative extrapolation.
7. **Validity and safety notes** — Main confounders, reproducibility requirements, boundary conditions, uncertainty checks, and non-operational safety constraints.

# Validation Gates

Before advancing past each stage, confirm:

- **Gap clarity**: The mechanism ambiguity is explicit and resolvable.
- **Hypothesis discriminability**: Competing hypotheses make distinct predictions under at least one control.
- **Control sufficiency**: Mechanism can be separated from implementation artifacts, background, and geometry effects.
- **Baseline fidelity**: The baseline reproduces under documented settings.
- **Definition compatibility**: Model, simulation, and data use consistent observable definitions and conventions.
- **Statistical power**: The predicted signature is distinguishable from background and uncertainty.
- **Robustness**: The result is stable across reasonable analysis variants and fitting windows.
- **External validity**: Conclusions are scoped to the tested system, model class, and validation level.

# Claim Boundaries

- Distinguish direct observation from extrapolation and model-specific consistency from universal mechanism proof.
- Label evidence strength (strong, moderate, weak, speculative) for every subclaim.
- Do not treat a single-system, single-dataset, or single-model result as field-wide consensus.
- Interpret null results as constraints within the assumed model and validated sensitivity region, not as universal exclusions.
- Separate source-paper observations from new agent-generated inferences.

# Failure Modes

- Hypothesis supported by only one diagnostic, one dataset, or one visual feature.
- Signature disappears after correcting implementation, definitions, or normalization.
- Background, loss-only, or detector artifacts reproduce the target signature.
- Result depends on post hoc channel selection, fitting window, or analysis convention.
- Finite-size, boundary, geometry, or replica effects dominate the expected signal.
- Trajectory-conditioned and channel-averaged interpretations conflict without explanation.
- Uncertainty intervals erase the predicted ordering or make the signature indistinguishable.
- Agreement requires unsupported post hoc tuning.

# Validity Checks

- **Confounding**: Could preparation history, drift, heterogeneity, or analysis choices explain the signal?
- **Mechanism separation**: Do competing mechanisms make different predictions for the chosen observables and controls?
- **Reproducibility**: Are units, conventions, code, seeds, software versions, and analysis steps documented and traceable?
- **Statistical validity**: Are uncertainties propagated from raw extraction through correction and fitting? Are multiple comparisons addressed?
- **Boundary conditions**: Are extrapolations beyond tested regimes, system sizes, or geometries labeled as speculative?
- **Consensus discipline**: Is the result framed as evidence from a specific model or system, not as domain-wide settled truth?

# Provenance

- Synthesized from cluster **64.0** (quantum-matter-rare-high-mechanism-discovery-workflow).
- Source skills: `high-energy-cgc-hierarchy-validation`, `high-pressure-materials-phase-exploration`, `electron-interaction-free-coherence-gating`, `soft-matter-interface-wetting-discovery`, `dark-sector-collider-search-workflow`, `quarkonium-polarization-research-planning`, `conformal-criticality-entanglement-research`, `monitored-quantum-purification-workflow`.
