---
name: sci-quantum-symmetry-guided-mechanism-discovery-workflo-ad30a138
description: A reusable workflow for generating, discriminating, and validating symmetry-aware hypotheses about hidden mechanisms, phases, or dynamic states from indirect or multidimensional observables.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided mechanism discovery workflow 7"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Help an agent design end-to-end research plans to discover and validate hidden mechanisms, emergent phases, or dynamic states by leveraging symmetry constraints, baseline comparisons, and multi-observable consistency. The workflow turns anomalies or model mismatches into testable, symmetry-aware hypotheses and validates them through controlled perturbation and independent diagnostics, without relying on specific materials, devices, or operational protocols.

# When to use

Trigger this skill when the user asks to:

- Explore an anomaly, spectral feature, phase transition, or symmetry change in quantum, condensed-matter, spectroscopic, or mesoscopic systems.
- Generate hypotheses about hidden order, broken symmetry, or competing mechanisms when conventional observables vanish or are ambiguous.
- Design validation studies that separate intrinsic mechanisms from artifacts, background, or extrinsic effects.
- Compare baseline expectations with deviations using perturbation sensitivity, multidimensional observables, or cross-detector/dataset consistency.

Do not use this skill for operational laboratory protocols, hazardous procedure instructions, clinical decision-making, or as a general-purpose domain encyclopedia.

# Inputs required

Before producing a research plan, collect or request:

- **Target system class** and the known reference state or baseline model.
- **Anomaly or gap**: the measured deviation, unexplained pattern, or model mismatch to be investigated.
- **Symmetry framework**: relevant symmetry group, conserved quantities, and irreducible representations.
- **Observable inventory**: available direct and indirect observables, including multidimensional, time-resolved, angle-resolved, or local probes.
- **Perturbation axes**: theoretically motivated control parameters that can selectively enhance, suppress, or simplify candidate mechanisms.
- **Competing mechanisms**: at least three families of explanation (e.g., intrinsic phase transition, extrinsic artifact, propagation or detection effect, disorder-induced response).
- **Validation resources**: independent datasets, alternative solvers, benchmark systems, control samples, or cross-instrument comparisons.
- **Constraints**: computational limits, data access, reproducibility requirements, and safety or regulatory boundaries.

# Core Workflow

Follow this ordered route. Do not skip decision gates.

## 1. Anchor the reference baseline
Reproduce or verify the known reference state and its accepted signatures under conditions where it should appear. Document the baseline model, its assumptions, and its validated regime.

**Decision gate:** If the reference state cannot be reproduced or validated, stop. Fix the baseline before exploring anomalies.

## 2. Define the anomaly pre-inspection
State the observable deviation, the baseline expectation, and the specific scientific question before inspecting the signal region in detail. Quantify the tension or mismatch with uncertainty propagation.

**Decision gate:** If the anomaly was selected after unblinded data inspection, flag the post-hoc discovery risk and require stronger controls or independent confirmation before hypothesis testing.

## 3. Generate symmetry-aware hypothesis families
Using symmetry constraints and the gap analysis, generate at least three competing hypothesis families:
- Baseline or null mechanism (no new physics).
- Hidden-order or symmetry-broken mechanism.
- Extrinsic, instrumental, or environmental mechanism.

For each hypothesis, record: target observable, predicted symmetry signature, evidence strength (speculative / candidate / supported / established), key assumptions, required discriminants, and likely failure modes.

**Decision gate:** If the hypotheses cannot be distinguished by any planned observable, return to step 2 and redefine the question or acquire new diagnostics.

## 4. Design minimal viable validation
Select the smallest set of observables and perturbations that can reject at least one plausible alternative. Define:
- **Test condition**: the perturbation expected to reveal the hidden mechanism.
- **Positive control**: a regime or benchmark where the signature is known or expected.
- **Negative control**: a regime where the mechanism should be absent.
- **Orthogonal control**: an independent dataset, solver, or observable that tests the same mechanism through a different dependency.
- **Artifact control**: variations that isolate calibration, geometry, resolution, or probe-induced effects.

**Decision gate:** If no negative or orthogonal control can falsify the leading hypothesis, redesign the study before proceeding.

## 5. Execute control-first analysis
Analyze controls before the test condition. Decompose the signal into components (e.g., coherent vs. incoherent, intrinsic vs. extrinsic, single-event vs. collective). Apply calibration, background estimation, and uncertainty propagation consistently across all conditions.

**Decision gate:** If controls fail or reveal unbounded artifacts, stop. Revise preprocessing, selection logic, or experimental geometry before interpreting the test condition.

## 6. Classify mechanisms with symmetry and multi-observable consistency
Assign states or mechanisms using symmetry sectors, correlation structures, and independent observables. Require that at least two independent signatures point to the same symmetry breaking or mechanism. Compare the simplest plausible alternative model against the proposed mechanism.

**Decision gate:** If independent observables conflict, treat the discrepancy as evidence for missing physics, artifacts, or model misassignment. Do not accept the candidate mechanism until consistency is restored or the conflict is explained.

## 7. Iterate hypotheses with disciplined update rules
Grade each hypothesis and apply one update action:
- **Keep**: the effect persists across independent controls and model checks.
- **Narrow**: the effect appears only in a restricted regime or under specific assumptions.
- **Split**: multiple mechanisms explain the same observable.
- **Discard**: the effect disappears under stronger controls or is consistent with leakage or bias.
- **Reframe**: the problem is measurement validity rather than physical interpretation.

**Decision gate:** If the hypothesis survives stronger controls but remains degenerate with alternatives, return to step 4 and add a new discriminant. If the hypothesis is discarded, return to step 3 to generate alternatives.

## 8. Bound claims and check escalation readiness
Before extending conclusions to new systems, energy regimes, or universal statements, verify:
- Finite-size, scale, or resolution robustness.
- Cross-dataset or cross-method consistency.
- External constraint compatibility.

**Stop condition:** Do not escalate claims if the result depends on a single realization, one unvalidated perturbation, or unsupported extrapolation beyond the tested symmetry regime.

# Output Format

Produce a structured research plan containing:

1. **Research question**: concise statement linking target system, anomaly, and mechanism class.
2. **Reference baseline**: validated state, model assumptions, and regime boundaries.
3. **Hypothesis table**: for each family—mechanism, predicted symmetry signature, evidence strength, key assumptions, failure modes, and minimal validation.
4. **Validation design**: variables, controls (positive, negative, orthogonal, artifact), evaluation metrics, and stop conditions.
5. **Analysis plan**: signal decomposition, symmetry classification, model comparison, uncertainty treatment, and decision criteria.
6. **Iteration plan**: update rules (keep/narrow/split/discard/reframe) and next discriminants.
7. **Validity checklist**: confounders, reproducibility checks, boundary conditions, and expert-review triggers.
8. **Claim labels**: explicit tags distinguishing established, supported, candidate, and speculative conclusions.

# Validation Gates

- **Baseline gate**: The reference state is reproduced and documented before anomaly exploration.
- **Pre-registration gate**: Hypotheses and analysis choices are defined before unblinded inspection when feasible.
- **Control gate**: Positive, negative, orthogonal, and artifact controls are analyzed and pass before test-condition interpretation.
- **Symmetry-consistency gate**: Independent observables agree on the inferred symmetry breaking or mechanism.
- **Reproducibility gate**: Results are stable across reasonable changes in selection, binning, resolution, or solver settings.
- **Escalation gate**: Broader claims are withheld until cross-system, cross-method, or external-constraint checks are satisfied.

# Claim Boundaries

- **Established**: Reproduced by independent methods or datasets with consistent symmetry assignments.
- **Supported**: Consistent with multiple observables and strong controls within the tested regime.
- **Candidate**: Plausible but limited by residual degeneracy, incomplete controls, or model dependence.
- **Speculative**: Suggested by analogy or incomplete data; requires dedicated validation.

Always separate:
- Direct observables from reconstructed hidden states.
- Model-specific inferences from universal claims.
- Paper-supported findings from agent-generated hypotheses.

# Failure Modes

- **Reference misidentification**: The baseline model is inappropriate for the target regime, causing false anomalies.
- **Post-hoc selection**: The anomaly is defined after data inspection, inflating false-positive rates.
- **Observable degeneracy**: Planned observables cannot distinguish the proposed mechanism from at least two alternatives.
- **Confounding artifacts**: Calibration drift, background leakage, probe perturbation, or instrumental asymmetry mimics the target signal.
- **Symmetry mislabeling**: Inconsistent assignment of symmetry sectors or irreducible representations across observables.
- **Finite-size or method bias**: The signature is an artifact of resolution, ensemble size, solver choice, or disorder realization.
- **Overextrapolation**: Conclusions are generalized beyond the validated symmetry regime, system class, or energy window.

# Validity Checks

Before finalizing any plan or claim, verify:

- **Baseline validity**: Is the reference model appropriate and reproducible?
- **Anomaly definition**: Was the feature defined before detailed inspection?
- **Control adequacy**: Can the proposed controls falsify the primary hypothesis?
- **Symmetry consistency**: Do order parameters, correlation peaks, sectors, and degeneracies imply the same mechanism?
- **Multi-observable support**: Does at least one independent signature corroborate the inference?
- **Confounder audit**: Have probe effects, disorder, background, geometry, and environmental variables been bounded?
- **Statistical validity**: Are uncertainties, covariances, multiple-testing effects, and rare-event fluctuations accounted for?
- **Reproducibility**: Are data provenance, code versions, model inputs, random seeds, and analysis configurations documented?
- **Boundary validity**: Are claims limited to the tested system class, symmetry regime, and model assumptions?
- **External validity**: Are broader claims deferred until cross-validation or independent replication is available?

# Provenance

Synthesized from cluster **203.0** (symmetry-guided mechanism discovery and validation). Source skills: `cosmic-ray-lepton-anomaly-workflow`, `symmetry-guided-hidden-order-exploration`, `cold-atomic-interference-workflow`, `high-energy-neutrino-detector-asymmetry-research`, `angular-hhs-molecular-dynamics-exploration`, `surface-electron-local-interference-research`, `quantum-thermalization-fidelity-susceptibility-workflow`, `condensed-matter-nesting-superconductivity-exploration`.
