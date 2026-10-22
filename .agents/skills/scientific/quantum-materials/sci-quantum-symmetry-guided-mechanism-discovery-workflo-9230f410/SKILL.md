---
name: sci-quantum-symmetry-guided-mechanism-discovery-workflo-9230f410
description: A reusable end-to-end workflow for generating, discriminating, and validating hidden local mechanisms from weak or aggregate signals using symmetry constraints, multi-probe calibration, and iterative hypothesis testing.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided mechanism discovery workflow 80"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Guide agents in proposing, testing, and iterating hypotheses about hidden local mechanisms that are not resolved by dominant-phase or average-structure models. The workflow emphasizes symmetry-constrained candidate generation, multi-probe validation, internal calibration, and explicit claim-bounding.

## When to use

Use this skill when the user asks to:
- Explore unexplained weak residuals, diffuse signals, or aggregate-profile anomalies in condensed matter, soft matter, or stochastic spatial systems.
- Design studies that distinguish hidden local order, stochastic initiation, active events, or noise channels from artifacts and background.
- Compare tuning axes, cross-probe signatures, or scale-dependent predictions to discriminate competing mechanisms.
- Iterate on mechanism hypotheses after model residuals, calibration disagreements, or control failures.

Do not use this skill for general literature review, operational laboratory protocols, or clinical or biological safety advice.

## Inputs required

Ask for or infer:
- The dominant model or baseline behavior and why it fails.
- The weak or aggregate signal of interest and its measurement context.
- Candidate hidden variables (local order, defects, excitations, stochastic events, active units).
- Available tuning axes, probes, or observables across multiple scales.
- Known confounders (disorder, strain, inhomogeneity, thermal background, probe perturbation).
- Constraints on reproducibility, sample availability, and feasible controls.

## Core Workflow

1. **Anchor the puzzle and define the gap**
   - Identify the reproducible observation that the baseline model cannot explain.
   - Document the baseline failure mode and the expected null signature.
   - *Decision gate*: Proceed only if the puzzle is grounded in data and not a preprocessing artifact.

2. **Generate competing mechanism candidates**
   - Propose at least one hidden local mechanism and at least one null/artifact alternative.
   - For each candidate, list expected signatures, key assumptions, and likely failure modes.
   - *Decision gate*: Proceed only if candidates yield distinguishable predictions in at least one observable.

3. **Constrain with symmetry and minimal models**
   - Apply symmetry, selection rules, geometry, or conservation laws to narrow candidates.
   - Build the simplest model mapping hidden variables to observable signatures.
   - Separate dynamical predictions from energetic or thermodynamic predictions.
   - *Stop condition*: If no minimal model produces an identifiable signature above background, redesign the target observable.

4. **Design discriminating observations and controls**
   - Define independent variables (tuning, perturbation), dependent variables (signatures), and controlled variables (geometry, background model).
   - Include minimal viable validation: reproducibility above background and mapping of at least two symmetry-related directions or equivalent replicates.
   - Include strong controls: negative, positive, artifact/scaling, and side-effect controls.
   - *Decision gate*: Proceed only if the design includes a feasible falsification condition for each leading candidate.

5. **Multi-probe measurement and perturbation audit**
   - Collect data from independent probes or scales that should converge if the mechanism is real.
   - Treat measurement perturbation as a variable; vary cumulative exposure or rate when feasible.
   - Monitor stability markers alongside target observables.
   - *Stop condition*: If probe-induced perturbation dominates all accessible conditions, redesign the measurement strategy.

6. **Feature extraction and model comparison**
   - Pre-register feature-definition rules and extraction criteria before fitting.
   - Compare candidate models against null/artifact models constrained by symmetry or known physics.
   - Estimate uncertainties and examine residuals for systematic structure.
   - Test robustness to background subtraction, binning, smoothing, and fitting-range choices.
   - *Decision gate*: Proceed only if the feature is reproducible across replicates and analysis choices.

7. **Internal calibration and cross-scale consistency**
   - Identify an independent calibration observable or cross-probe check that should track the same underlying scale or mediator.
   - Compare qualitative and quantitative scaling between the target feature and calibration observable.
   - Propagate uncertainty through the comparison.
   - *Stop condition*: If calibration and target feature disagree without a tested explanation, prioritize artifact testing or model revision before mechanistic claims.

8. **Mechanism discrimination gate**
   - Evaluate whether evidence supports the candidate mechanism, an alternative, or ambiguity.
   - Require reproducibility, control stability, symmetry consistency, and cross-probe or calibration agreement.
   - Rank surviving hypotheses by evidence strength (speculative, plausible, supported, strongly supported).
   - *Decision gate*: If multiple hypotheses remain indistinguishable, preserve ambiguity and design a decisive perturbation.

9. **Iteration or redesign**
   - Update hypothesis strength, key assumptions, and boundary conditions based on results.
   - If residuals are systematic, add one omitted mechanism at a time.
   - If results are sample- or probe-dependent, prioritize reproducibility diagnostics.
   - *Stop condition*: Stop if the signal is irreproducible, controls fail, disorder or background explains the result, or no feasible discriminating test remains.

10. **Boundary audit and documentation**
    - State claim boundaries: state points, tuning ranges, measurement regimes, and sample conditions.
    - Label each claim as observed, inferred, or speculative.
    - Document confounders, unresolved ambiguity, and limits on extrapolation.

## Output Format

When using this skill, return:

1. **Research question and gap statement** — Concise puzzle anchored in a baseline-model failure.
2. **Ranked hypothesis set** — At least three candidates with evidence strength, key assumptions, expected signatures, failure modes, and discriminating tests.
3. **Study design** — Variables, minimal viable validation, strong controls, evaluation metrics, and stop conditions.
4. **Analysis plan** — Pre-registered criteria, model comparison strategy, robustness checks, and uncertainty propagation.
5. **Calibration/cross-probe strategy** — Independent observable, scaling comparison logic, and agreement criteria.
6. **Iteration rules** — Decision tree for updating, revising, or rejecting hypotheses after each outcome.
7. **Validity and boundary statement** — Confounders, reproducibility checks, claim labels, and extrapolation limits.

## Validation Gates

- **Symmetry-consistency gate**: Signatures must respect expected directional, parity, or selection-rule constraints.
- **Reproducibility gate**: Features must survive across replicates, equivalent symmetry directions, or repeated measurements.
- **Control-stability gate**: Negative and artifact controls must remain null; positive controls must activate.
- **Calibration-agreement gate**: Target feature and independent calibration must align within propagated uncertainty.
- **Model-identifiability gate**: Mechanism parameters must be inferable above uncertainty and not degenerate with background terms.

## Claim Boundaries

- Distinguish evidence for a hidden mechanism from evidence that it causes a functional anomaly; keep these claims separate unless independently validated.
- Limit conclusions to the tested state points, tuning ranges, and sample conditions.
- Do not present single-system or single-probe results as field consensus.
- Separate observed correlations from inferred causation or mechanistic explanations.

## Failure Modes

- The weak signal is dominated by measurement perturbation, background, or preprocessing artifacts.
- The proposed mechanism is dynamically adequate but thermodynamically or energetically underdetermined.
- Multiple candidate models fit the data equally well within feasible experimental resolution.
- Cross-probe or calibration disagreement invalidates the assumed energy scale or mediator link.
- Sample inhomogeneity, disorder, or uncontrolled side effects explain the apparent signal.
- The analysis pipeline fails synthetic recovery or blind-control tests.

## Validity Checks

- **Confounding**: Assess disorder, strain, inhomogeneity, thermal background, instrument artifacts, and probe perturbation.
- **Reproducibility**: Require repeated features across scans, samples, symmetry directions, or analysis pipelines.
- **Statistical validity**: Use uncertainty estimates, null-model comparison, residual analysis, and sensitivity tests.
- **Boundary conditions**: State whether conclusions apply only to narrow composition, domain, or measurement regimes.
- **Mechanistic validity**: Keep structural or dynamic evidence separate from functional-coupling claims unless cross-validated.
- **Extrapolation**: Avoid generalizing from a single material, device, or state point to the entire field.

## Provenance

- Synthesized from cluster 189 (subcluster 189.0) via semantic merge of source skills: `cuprate-diffuse-scattering-local-order`, `heavy-fermion-ground-state-tuning-agent`, `xpcs-probe-perturbation-soft-matter-dynamics`, `stochastic-replication-timing-workflow`, `active-matter-dissipation-workflow`, `mesoscopic-transport-kondo-exploration`, `kagome-competitive-order-phase-map`, `superconducting-fundamental-noise-exploration`.
- Preserves methodological patterns only; no paper-specific conclusions, numerical results, device geometries, or operational protocols are included.
