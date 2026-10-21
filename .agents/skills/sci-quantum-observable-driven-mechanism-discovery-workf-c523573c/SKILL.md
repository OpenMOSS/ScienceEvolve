---
name: sci-quantum-observable-driven-mechanism-discovery-workf-c523573c
description: A reusable end-to-end workflow for generating research questions, designing controlled comparisons, and iterating hypotheses to discover and validate mechanisms from observables in quantum, correlated, and precision physical systems.
scienceevolve-title: "Quantum materials and condensed matter · observable driven mechanism discovery workflow 15"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Guide agents to turn anomalous or unexplained observables into testable mechanism hypotheses, validate them through controlled experimental or computational comparisons, and iterate until claims are bounded by evidence. The workflow transfers methodological logic across condensed matter, quantum optics, atomic physics, and related fields without reproducing source-specific conclusions.

## When to use

Use this skill when:
- A system exhibits transport, spectral, magnetic, topological, or structural anomalies whose microscopic mechanism is unresolved.
- A gap exists between theoretical prediction and measurement, suggesting missing physics, hidden degrees of freedom, or approximation failure.
- Competing explanations (correlated order, environmental coupling, disorder, finite-size effects, calibration artifacts) must be discriminated.
- The task is research planning and methodological abstraction, not operational execution of hardware or synthesis protocols.

## Inputs required

Before starting the workflow, collect or infer:
- **Target system class** and its known baseline behavior or reference model.
- **Anomalous or target observable(s)** with measurement context and uncertainty.
- **Candidate mechanisms** or theoretical frameworks, including null and confounder hypotheses.
- **Available perturbation axes** or model variations (chemical, structural, field, temperature, pressure, computational approximation).
- **Known confounders** and nuisance variables (defects, drift, inhomogeneity, finite-size, resolution limits).
- **Validation resources** (benchmark systems, independent calculations, calibration standards, literature consensus).

## Core Workflow

1. **Frame the mechanism question.** Convert an anomalous observable or theory-experiment gap into a precise question about how a hidden degree of freedom, coupling, or approximation failure produces the target signature. State the relevant observables, the suspected mechanism class, and the regime of interest.

2. **Audit baseline and gaps.** Catalog what the baseline model or reference system already explains. Identify three gap types: missing perturbation range, missing observable pairing, and missing mechanistic discrimination. List known confounders that could mimic the target mechanism.
   - *Decision Gate:* If the anomaly cannot be defined independently of confounders, return to baseline characterization or stop.

3. **Generate ranked mechanism hypotheses.** For each candidate, specify: mechanistic rationale, key assumptions, evidence strength (high / medium / low / speculative), predicted signatures across multiple observables, most likely failure modes, and a minimal decisive test. Include a null hypothesis (baseline explains the data) and at least one confounder-driven alternative.
   - *Decision Gate:* If hypotheses are not falsifiable or lack discriminating observables, return to the gap audit.

4. **Design controlled comparison.** Define a minimal viable study that isolates one mechanism at a time.
   - **Controls:** baseline; positive (known regime); negative (mechanism suppressed); strong (independent cross-check); instrumental or procedural (drift/artifact detection).
   - **Variables:** independent (perturbation axis, model variant); dependent (transition scales, spectral features, order parameters, invariants); nuisance (defects, thermal history, finite-size, resolution).
   - **Metrics:** primary (reproducible signature shift); secondary (correlation strength across series); robustness (sensitivity to extraction method or model settings).
   - **Stop Conditions:** effect smaller than combined uncertainty; controls replicate the test trend; feature extraction is irreproducible; calibration or baseline unstable; extrapolation beyond the measured regime is required to claim support.

5. **Execute and extract comparable signatures.** Pre-register feature definitions (peak positions, crossover scales, inflection points, invariants) before analysis. Process all conditions with identical baseline correction, smoothing, and uncertainty rules. Separate intrinsic features (persistent across histories and variants) from extrinsic artifacts.

6. **Analyze, discriminate, and quantify uncertainty.** Build cross-observable maps. Test competing mechanisms against the same data. Decompose uncertainty into statistical, systematic, model, and calibration components. Verify that the proposed mechanism predicts a pattern that alternatives do not. Distinguish correlation from causation using control logic.
   - *Decision Gate:* If the effect is ambiguous due to unresolved overlap or dominant noise, stop causal claims and redesign for sharper resolution or stronger controls.

7. **Validate and bound claims.** Verify robustness under reasonable changes in analysis choices, model approximations, boundary conditions, or finite-size treatment. Assign evidence strength to each claim. Restrict conclusions to the tested regime, observable sector, and model class. Mark extrapolations as speculative.

8. **Iterate or terminate.** Classify the outcome:
   - **Support:** predicted signature appears with expected specificity → strengthen mechanism and test next regime cautiously.
   - **Partial support:** trend appears but alternatives remain viable → design a sharper contrast experiment targeting remaining mechanisms.
   - **Contradiction:** predicted signature is absent or reversed → reject or narrow the hypothesis and revisit assumptions.
   - **Ambiguous:** extraction or controls prevent interpretation → improve characterization, reproducibility, or feature definition before adding new conditions.
   - *Stop Condition:* Terminate if two successive cycles fail to reduce the hypothesis space, if controls consistently fail, or if remaining claims require extrapolation beyond tested boundaries.

## Output Format

Return results in this structure:

1. **Research Question** – Coupled observables, perturbation axis, and boundary conditions.
2. **Gap Diagnosis** – Missing perturbation range, missing observable pairing, and missing mechanism discrimination.
3. **Hypothesis Set** – For each hypothesis: rationale, key assumptions, evidence strength, predicted signatures, likely failure modes, and minimal decisive test.
4. **Study Design** – Minimal viable validation, perturbation matrix, controls (positive, negative, strong, instrumental), variables, metrics, and stop conditions.
5. **Analysis Plan** – Feature definitions, cross-observable maps, competing mechanism tests, uncertainty decomposition, and robustness checks.
6. **Iteration Plan** – Outcome categories, mechanism update rules, next decisive experiment, and stop/redesign triggers.
7. **Validity and Ethics Statement** – Confounders, reproducibility risks, boundary conditions, and safety or communication limits.

## Validation Gates

Before finalizing any plan or claim, confirm:
- **Confounding controlled:** nuisance variables are measured or bounded and cannot fully explain the trend.
- **Reproducibility:** features are stable across repeated measurements, independent samples, or equivalent computational settings.
- **Control adequacy:** positive, negative, strong, and instrumental controls are sufficient for the claim.
- **Specificity:** the proposed mechanism predicts a distinguishable pattern that alternatives do not.
- **Uncertainty propagation:** statistical, systematic, model, and calibration uncertainties are combined and reported.
- **Boundary conditions:** conclusions are limited to the tested regime, material or model class, and observable sector.
- **Mechanism discipline:** correlations are presented as coupling evidence, not causation, unless controls and theory jointly support it.

## Claim Boundaries

- Limit causal claims to the measured perturbation range, temperature or field regime, and sample or model class.
- Distinguish correlation from causation; present cross-observable trends as evidence for coupling only when third-variable explanations are ruled out by controls.
- Separate directly observed spectral or transport changes from inferred hidden-reservoir or mechanism behavior.
- Frame computational predictions as candidates for validation, not as proven experimental facts.
- For theoretical mappings, transfer only protected observables verified by invariance or benchmark; do not extend sector-specific equivalence to all quantities.
- Mark agent-inferred extensions as distinct from literature-supported or benchmark-validated results.

## Failure Modes

- **Confounder-driven correlation:** stoichiometry, strain, disorder, thermal history, drift, heating, or calibration artifacts mimic the target mechanism.
- **Artifact-prone extraction:** feature definitions chosen post-hoc, overfitting merged or unresolved structures, or smoothing-induced false signatures.
- **Inadequate controls:** negative or strong controls produce the same trend as test conditions, undermining specificity.
- **Model sensitivity:** conclusions depend on arbitrary numerical settings, unvalidated approximations, or finite-size/boundary artifacts.
- **Extrapolation beyond evidence:** claims generalized to unmeasured regimes, materials, or perturbation strengths without additional support.
- **Unresolved overlap:** spectral, structural, or phase contributions overlap sufficiently to prevent clean assignment.

## Validity Checks

- Pre-register feature definitions and analysis choices before examining test data.
- Verify baseline stability, calibration integrity, and sample or model history.
- Test sensitivity to extraction method, smoothing, baseline correction, and model approximation.
- Require multi-signature consistency: a credible mechanism should explain at least two independent observables.
- Perform blinded or independent replication where feasible; report failed controls and inconclusive attempts with full visibility.
- Check statistical validity: appropriate uncertainty propagation, goodness-of-fit diagnostics, and awareness of multiple comparisons.
- Maintain literature discipline: treat single-paper or single-model results as evidence within their context, not as field-wide consensus.

## Provenance

This skill was synthesized from cluster 70, subcluster 70.0 (observable-driven mechanism discovery and validation), drawing on the shared workflow route across the following source skills: magnetite-verwey-magnetic-correlation-exploration; spin-resonance-spectral-memory-workflow; two-dimensional-boron-superconductivity-exploration; strongly-correlated-equivalence-workflow; precision-atomic-spectroscopy-qed-exploration; correlated-pseudogap-superconductivity-exploration; fluctuation-topological-phase-exploration; compact-star-dm-capture-exploration.
