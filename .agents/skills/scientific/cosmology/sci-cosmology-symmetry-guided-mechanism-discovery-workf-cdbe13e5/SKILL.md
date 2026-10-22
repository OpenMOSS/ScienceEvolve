---
name: sci-cosmology-symmetry-guided-mechanism-discovery-workf-cdbe13e5
description: Design end-to-end research workflows that discover and validate astrophysical mechanisms through symmetry-guided hypothesis generation, simulation-based ground-truth calibration, and controlled discrimination of systematic versus intrinsic signals.
scienceevolve-title: "Galaxy, cosmology, and simulations · symmetry guided mechanism discovery workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

# Purpose

Help an agent design reusable, end-to-end research workflows for discovering and validating physical or systematic mechanisms in astrophysical and cosmological data. The workflow treats symmetry, anisotropy, or structured pattern deviations as diagnostic signals, discriminates among competing explanations using simulation-based ground truth, and bounds claims through controlled validation.

# When to use

Use when investigating orientation-dependent structure, anomalous population-level signals, precision systematic shifts, or proxy-to-event relationships in galaxy and halo studies, large-scale structure, cosmological surveys, or simulation-derived catalogs. Useful when the central question is whether an observed pattern is intrinsic to a source mechanism or arises from projection, contamination, selection, or boundary artifacts. Do not use as a general-purpose astronomy assistant or for operational instrument control.

# Inputs required

- Target environment or population and the observational anomaly or precision gap.
- A physically motivated symmetry, angular, or structural coordinate system defined before outcome inspection.
- Simulation suite, mock catalog, or synthetic observation with known ground truth and matched selection function.
- Candidate mechanisms and their predicted signatures in the chosen coordinate system.
- Baseline model or template and independently motivated alternatives.
- Known contaminating components (foregrounds, backgrounds, projection effects, instrumental effects, boundary artifacts).
- Intended downstream inference (individual labels, aggregate statistics, distance scales, event rates).
- Strong controls: positive, negative, mechanism-off, projection, and ablation controls.

# Core Workflow

An ordered end-to-end route. Each step ends with a validation gate.

1. **Frame the Gap and Lock Geometry**
   - Define the observational anomaly or precision gap as a mismatch between expectation and measurement.
   - Pre-register a physically motivated coordinate system, angular bins, or structural templates before inspecting data.
   - **Gate — Geometry Lock**: If no symmetry or geometry can be defined a priori from independent physics, stop and reformulate the question.

2. **Generate Competing Mechanism Hypotheses**
   - Map observables to latent structure. Propose at least two competing hypotheses (e.g., intrinsic anisotropy vs. projection artifact; source process A vs. B).
   - For each, label evidence strength (High / Medium / Low / Speculative), key assumptions, predicted pattern sign and scale dependence, and minimal falsification test.
   - **Gate — Hypothesis Diversity**: If hypotheses are not mutually distinguishable with the planned observables and mocks, stop and redesign.

3. **Construct Matched Calibration Environments**
   - Build or select mocks/synthetics that reproduce the target selection function and contain known ground truth.
   - Define positive controls (signal should appear), negative controls (signal should be absent), mechanism-off controls (source process disabled), and projection controls (multiple viewing angles or template variants).
   - **Gate — Truth Recovery**: If the analysis cannot recover the known ground-truth pattern in positive controls, stop and repair the mock construction or kinematic model.

4. **Apply Consistent Selection and Projection**
   - Run identical selection rules, quality cuts, and masks on calibration and target data.
   - Project intrinsic three-dimensional structure into observable space using the same pipeline for mocks and observations.
   - Document the selection function, completeness, and any stitching or boundary rules.
   - **Gate — Selection Parity**: If selection rules or projection pipelines differ between calibration and target samples, iterate to harmonize them before inference.

5. **Discriminate Mechanisms via Controlled Contrasts**
   - Fit baseline and alternative models/templates to both mocks and observations.
   - Use phase-sensitive, symmetry-sensitive, or residual diagnostics to isolate out-of-phase distortions from broadband changes.
   - Run ablation tests by removing one observable, one background term, or one model component at a time.
   - **Gate — Mechanism Specificity**: If the pattern disappears under mechanism-off controls, is reproduced by negative controls, or is driven by a single arbitrary analysis choice, reject or weaken the hypothesis.

6. **Audit Contamination and Systematic Budget**
   - Decompose the observable into target signal, foreground/background, intergalactic, host/source, instrumental, and boundary-induced components.
   - Check for stitching artifacts, duplicate/omission events near boundaries, template-sensitivity, or selection-function distortions.
   - **Gate — Contamination Budget**: If non-target components dominate the signal or correction creates larger selection distortions, stop or narrow the claim domain.

7. **Validate Calibration and Conversion**
   - Check proxy-to-event conversion, probability calibration, purity/completeness, or template-to-parameter mapping.
   - Verify that aggregate recovery does not mask individual-level bias.
   - **Gate — Calibration Stability**: If conversion relations or calibration shift unpredictably under minor selection changes or across probability bins, stop and revise the model.

8. **Assess Robustness and Bound Claims**
   - Stratify by regime: distance, brightness, redshift, mass, richness, viewing angle, or noise level.
   - Test stability across reasonable analysis variants and template parameters.
   - Classify evidence: Confirmed, Partial, Inconclusive, or Refuted.
   - **Gate — Robustness**: If results are regime-specific or unstable across variants, bound claims to the validated regime only.

9. **Iterate or Redesign**
   - If all gates pass, escalate to broader tests, complementary tracers, or tighter constraints.
   - If a gate fails, return to the relevant step: refine geometry, add controls, revise the mock, adjust selection, or redefine the domain of validity.
   - **Stop Conditions**: Halt if negative controls match the proposed signal; if calibration fails across multiple bins; if uncertainty dominates the comparison; or if the inference requires extrapolation beyond tested populations.

# Output Format

When using this skill, produce:
1. **Research Question** — Concise, bounded question with claim boundary.
2. **Ranked Hypotheses** — Table with evidence strength, assumptions, predicted pattern, and minimal falsification test.
3. **Study Plan** — Mock environment, tracer selection, controls, variables, metrics, and stopping conditions.
4. **Analysis Plan** — Selection rules, geometry definition, mechanism contrasts, residual diagnostics, and stratification scheme.
5. **Validation Plan** — Truth-recovery checks, calibration tests, contamination budget, and robustness checks.
6. **Claim Boundary & Failure Mode Register** — Explicit limits on interpretation and known failure modes.

# Validation Gates

Detailed criteria for the gates in Core Workflow:
- **Geometry Lock**: Coordinate system must be physically motivated and defined before outcome inspection; post-hoc geometry invalidates the hypothesis test.
- **Hypothesis Diversity**: At least two competing hypotheses must predict measurably different patterns under the same experimental design.
- **Truth Recovery**: Positive controls must show recoverable ground truth at a level that exceeds diagnostic noise; if not, the mock or model is inadequate.
- **Selection Parity**: Selection function, masks, cuts, and projection pipelines must be identical or demonstrably equivalent between calibration and target data.
- **Mechanism Specificity**: The pattern must survive mechanism-off and negative controls, and must not be reproduced by ablation of unrelated components.
- **Contamination Budget**: Target signal must exceed combined systematic and contamination uncertainty; corrections must not introduce larger distortions than they remove.
- **Calibration Stability**: Conversion relations or probabilistic mappings must remain stable under reasonable perturbations of selection and noise.
- **Robustness**: Conclusions must survive stratification by at least two independent regime variables and reasonable analysis variants.

# Claim Boundaries

- Distinguish intrinsic three-dimensional structure from projected or integrated observables.
- Do not transfer success from aggregate statistics to individual-level labels without explicit validation.
- Do not generalize beyond tested populations, redshift ranges, survey selections, or simulation models.
- Separate simulation-supported findings from observational claims; label extrapolations as speculative.
- Do not present model-dependent constraints as universal absence or confirmation claims.

# Failure Modes

- **Projection artifacts**: Apparent anisotropy or signal arises from viewing geometry rather than intrinsic structure.
- **Contamination dominance**: Foreground, background, or instrumental components overwhelm the target signal.
- **Boundary/stitching artifacts**: Discrete assembly of catalogs or light-cones creates artificial small-scale or anisotropic features.
- **Template sensitivity**: Inference changes arbitrarily with standard versus alternative spatial or structural templates.
- **Miscalibration**: Probabilistic assignments or proxy-to-event conversions are biased in sparse bins or under selection changes.
- **Overfitting**: Extended model complexity improves fit only by absorbing broadband noise or nuisance structure.
- **Selection bias**: Cuts correlate with the tested pattern, creating spurious associations.
- **Morphology–normalization confusion**: Changes in total strength are misattributed to structural or phase-like shifts.

# Validity Checks

- **Confounding**: Survey masks, selection functions, correlated structures, host-property uncertainty, redshift-dependent populations, and coordinate conventions.
- **Reproducibility**: Document selection rules, random seeds, mock versions, analysis code, threshold choices, and randomization procedures.
- **Statistical validity**: Adequate bin counts, reported uncertainty, resampling where samples are non-independent, and avoidance of overinterpreting sparse bins.
- **Boundary conditions**: Evaluate faint sources, outskirts, high-noise regimes, low-richness hosts, small scales near stitching boundaries, and regime transitions.
- **External validity**: Avoid generalizing from one simulation, survey, or tracer population to all astrophysical structures without additional evidence.
- **Downstream validity**: Verify whether the method is intended for individual labels, aggregate statistics, or parameter constraints; do not automatically transfer success across use cases.

# Provenance

- Derived from cluster 13.0 (galaxy-cosmology-merger-cosmological-mechanism-discovery-workflow).
- Synthesized from representative source skills: photometric-membership-probability-research, bao-systematics-research-design, galaxy-halo-kinematics-exploration, proxy-event-calibration-astrophysics, circumgalactic-magnetic-anisotropy-research-design, astro-survey-bao-exploration, stitched-catalogue-boundary-artifact-validation, indirect-search-template-sensitivity.
