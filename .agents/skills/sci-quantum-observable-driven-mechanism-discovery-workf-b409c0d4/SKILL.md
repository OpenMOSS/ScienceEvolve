---
name: sci-quantum-observable-driven-mechanism-discovery-workf-b409c0d4
description: A reusable end-to-end workflow for generating, discriminating, and validating competing mechanism hypotheses from ambiguous observables in complex quantum, magnetic, and interface-driven systems.
scienceevolve-title: "Quantum materials and condensed matter · observable driven mechanism discovery workflow 18"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Use this skill to transform an ambiguous, anomalous, or regime-dependent observable into a structured research program that discriminates among competing physical mechanisms. It guides an agent to propose falsifiable hypotheses, design minimal validations with strong controls, analyze multi-modal evidence through nested models, and iterate based on failure modes rather than overfitting single observations.

# When to use

Use this skill when the task involves:

- An observable response that is nonlinear, non-monotonic, intermittent, or inconsistent with a simple baseline model.
- Competing mechanisms that could explain the same observation (e.g., bulk vs. boundary, intrinsic vs. artifact, coupling vs. screening vs. disorder).
- Designing minimal viable validation plans with explicit controls, stopping conditions, and iteration logic.
- Interpreting multi-modal evidence—such as spectroscopy, transport, imaging, symmetry analysis, or simulation—to bound mechanistic claims.

Do not use this skill for operational fabrication recipes, hazardous procedural execution, or as a source of field-wide consensus from single studies.

# Inputs required

Before producing a research plan, obtain or explicitly assume:

- **Target system class:** material or platform family, dimensionality, coupling architecture, and environmental regime.
- **Anomalous observable:** the response that deviates from baseline expectations, including available measurement modalities.
- **Candidate mechanisms:** plausible physical explanations and known confounders.
- **Evidence streams:** available or planned experiments, simulations, spectroscopies, transport probes, imaging, or structural characterization.
- **Baseline/control systems:** configurations expected to suppress, absent, or standardize the proposed mechanism.
- **Constraints:** safety boundaries, reproducibility requirements, sample availability, and ethical limits.

If key inputs are missing, state assumptions explicitly and mark resulting hypotheses as provisional.

# Core Workflow

Follow this ordered route. Do not skip decision gates.

## 1. Frame the observable gap
- Identify the anomalous response and the baseline model it violates.
- Define the functional gap: what is missing or ambiguous in current understanding.
- **Decision gate:** If the anomaly cannot be distinguished from measurement artifact, noise, or instability, stop and redesign the observable or measurement protocol.

## 2. Generate competing mechanism hypotheses
- Propose at least three ranked hypotheses: a primary mechanism, an alternative internal mechanism, and an artifact or non-bulk explanation.
- For each hypothesis, specify: claim, predicted diagnostic signature, evidence strength (weak/moderate/strong), key assumptions, and likely failure modes.
- **Decision gate:** If the hypotheses cannot be discriminated by any planned observable, redesign the diagnostic axes or perturbation variables before proceeding.

## 3. Design minimal viable validation
- Select the smallest perturbation set and observable set that can distinguish the top two competing mechanisms.
- Define independent variables, dependent variables, control variables, and nuisance variables.
- Establish a control hierarchy: positive control, negative control, mechanistic control, and baseline/same-region control.
- Pre-register success criteria (what result confirms the mechanism) and failure criteria (what result refutes or obscures it).
- **Stop condition:** If no control can isolate the mechanism from dominant confounders, halt broad claims and redesign the experiment concept.

## 4. Pre-register analysis and observable hierarchy
- Rank observables by diagnostic power: primary (direct mechanism probe), secondary (supporting trend), mechanistic (regime or scaling test), and exploratory.
- Plan nested model comparison: baseline model, single-mechanism model, and multi-mechanism model.
- Plan uncertainty propagation, residual inspection, and sensitivity to preprocessing choices.
- **Decision gate:** If model parameters are non-identifiable or fitting constraints predetermine the result, add orthogonal observables or stronger priors.

## 5. Execute evidence collection and model comparison
- Collect data across the planned perturbation axes while holding control variables stable.
- Normalize and preprocess consistently; preserve raw data and audit trail.
- Fit nested models and inspect residuals for structured deviations.
- Compare predicted versus observed signatures across multiple observables: sign, line shape, timing, scaling, temperature dependence, or spatial distribution.
- **Decision gate:** If a mechanism explains only one observable while failing others, downgrade its evidence strength and retain competing explanations.

## 6. Run validation gates and robustness checks
- Test confounding explanations: heating, disorder, contact artifacts, secondary phases, instrumental drift, or sample degradation.
- Verify reproducibility across independent samples, regions, or measurement sessions.
- Check whether a simpler baseline model explains the data equally well.
- **Decision gate:** If controls fail or a simpler alternative fits equally well, reject or suspend the complex mechanism claim.

## 7. Iterate based on evidence
- **Confirm:** If target signals and controls strengthen together, deepen mechanism-specific tests and expand boundary conditions.
- **Narrow:** If signals strengthen but controls fail, reduce claim scope and redesign controls.
- **Pivot:** If signals are weak but controls are clean, improve sensitivity or select a new candidate mechanism.
- **Resolve quality:** If signals and controls are ambiguous, resolve sample or measurement quality before mechanistic interpretation.
- **Stop:** If the signal lacks independent confirmation, is explained by artifacts, or cannot discriminate among leading mechanisms, stop or redesign.
- Document negative results and ruled-out mechanisms to guide the next cycle.

## 8. Bound claims and finalize output
- Distinguish directly supported findings from agent-generated inferences.
- State boundary conditions: material class, environmental regime, geometry, and observable set.
- Document residual failure modes, unresolved assumptions, and risks.
- **Decision gate:** If the claim exceeds the validated domain, trim or qualify it before output.

# Output Format

Produce a structured research package containing:

1. **Research question and observable gap** — target phenomenon and why it is methodologically important.
2. **Ranked hypothesis portfolio** — for each hypothesis: claim, mechanism, predicted signature, evidence strength, key assumptions, and failure modes.
3. **Minimal viable validation plan** — variables, control hierarchy, evaluation metrics, success criteria, and stop conditions.
4. **Analysis plan** — observable hierarchy, nested model comparison, uncertainty handling, residual checks, and orthogonal validation strategy.
5. **Iteration decision log** — confirm, narrow, pivot, or stop criteria based on possible result patterns.
6. **Validity and boundary statement** — confounders, reproducibility checks, applicable domain, and explicit non-transferable assumptions.

# Validation Gates

Before interpreting or reporting results, verify:

- **Confounding control:** Have heating, disorder, artifacts, secondary phases, and instrumental effects been ruled out or bounded?
- **Control strength:** Do positive, negative, and mechanistic controls isolate the proposed mechanism from baseline behavior?
- **Model identifiability:** Can the fitted parameters distinguish the proposed mechanism from alternatives?
- **Orthogonal evidence:** Does at least one independent observable support the mechanism without being used to fit it?
- **Reproducibility:** Are results consistent across independent samples, regions, or sessions?
- **Statistical validity:** Are uncertainty intervals reported, residuals unstructured, and sensitivity to preprocessing quantified?
- **Regime consistency:** Does the mechanism explain the correct temperature, frequency, field, composition, or morphology regime?

# Claim Boundaries

- Distinguish source-supported findings from new agent inferences.
- Do not treat single-system or single-paper demonstrations as field-wide consensus.
- Limit mechanistic claims to the tested material class, environmental regime, and observable set.
- Separate phenomenological observations from causal mechanistic attributions.
- Label extrapolations as hypotheses, not verified results, and state boundary conditions where the mechanism is expected to fail.

# Failure Modes

- The observable is dominated by artifacts, damage, heating, or unmodeled secondary effects.
- Mechanism-specific parameters are non-identifiable within the experimental design.
- Controls fail or are weaker than the target signal, preventing isolation of the mechanism.
- Alternative baseline models fit the data equally well without requiring the proposed mechanism.
- Results depend strongly on arbitrary preprocessing, fitting constraints, or resonance assignments.
- Sample inhomogeneity, boundary effects, or contact artifacts explain the trend instead of the proposed bulk or interface mechanism.
- Structural baselines or spectral assignments are unstable across repeated measurements.

# Validity Checks

- Pre-register hypotheses, diagnostic predictions, and success criteria before analysis.
- Separate raw observations from mechanistic inferences in all reports.
- Document negative evidence, null results, and inconclusive regimes transparently.
- Verify that perturbations preferentially address the intended mechanism rather than exciting the system directly or uniformly.
- Check architecture scaling, composition trends, or regime boundaries for consistency with the hypothesis.
- Ensure claim calibration matches evidence strength: avoid upgrading weak or moderate evidence to strong or robust without additional controls.

# Provenance

- Synthesized from cluster 157.0 (observable-driven mechanism discovery and validation).
- Source skills: arxiv-cmoat__2606.18077, ed43f987ef3bb694, a79a40eda5f25bc0, 6ada37bbc55f3a9a, 034320543ebe2279, 9fd8269d27076650, 8b2c1dc85f994d4d, d24b99a582d56ea0.
- Represents a semantic merge of shared workflow routes across nonlinear optics, quantum interfaces, magnetic oxides, hybrid semiconductors, dielectric composites, nanoparticle magnetic assemblies, defect plasticity, and topological platform design.
