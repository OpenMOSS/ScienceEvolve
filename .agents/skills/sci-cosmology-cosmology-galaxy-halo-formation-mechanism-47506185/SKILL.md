---
name: sci-cosmology-cosmology-galaxy-halo-formation-mechanism-47506185
description: A reusable end-to-end workflow for discovering and validating physical mechanisms in cosmological structure formation through symmetry-guided hypothesis generation, multi-regime controlled comparison, and iterative model discrimination.
scienceevolve-title: "Galaxy, cosmology, and simulations · cosmology galaxy halo formation mechanism discovery workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

# Purpose

This skill guides an agent through a reusable, end-to-end research workflow for discovering and validating physical mechanisms in cosmological structure formation. The core method is to identify an anomaly or gap relative to a baseline theory, generate competing symmetry-guided hypotheses that predict regime-dependent signatures, and discriminate among them using controlled multi-regime comparisons with explicit validation gates.

# When to use

Use this skill when:

- A user asks to design a research plan or analyze data involving galaxy formation, dark matter halos, satellite dynamics, stellar streams, large-scale structure, or modified-gravity effects.
- The problem requires moving from an observed discrepancy or simulation anomaly to a falsifiable mechanism.
- The task involves comparing theoretical predictions with simulations, mock observations, or observational tracers across multiple physical regimes.
- The user needs hypothesis generation, experimental design, model comparison, or iterative refinement in cosmological astrophysics.

Do not use this skill for instrument operations, raw data reduction pipelines, or as a substitute for executing domain-specific numerical simulations.

# Inputs required

Before producing a plan, identify or request:

- **Target system and components**: host halo, embedded disk, satellite population, substructure, stream, or tracer set.
- **Baseline model or theory**: the established reference against which discrepancies will be measured.
- **Anomaly or gap**: the specific observable puzzle, unexpected alignment, abundance mismatch, or structural feature.
- **Candidate mechanisms**: physical processes that could explain the anomaly (e.g., tidal torque, feedback, accretion, environmental stripping, selection effects).
- **Data sources**: simulation snapshots, catalogs, mock observations, or observational survey products.
- **Regimes to compare**: spatial, dynamical, temporal, or environmental zones where mechanisms should differ in strength.
- **Metrics**: shape, orientation, alignment, abundance, profile, phase-space coherence, or other discriminators.
- **Known limitations**: resolution bounds, selection functions, projection effects, tracer bias, and confounders.

# Core Workflow

Follow this ordered route. Each numbered stage includes a decision gate. Iterate or stop based on gate outcomes.

1. **Anomaly Framing & Baseline Audit**
   - Define the target system and the baseline model or theory.
   - Express the observable discrepancy as a measurable deviation from that baseline.
   - Determine whether the gap reflects missing physics, incomplete tracers, or violated assumptions.
   - *Gate 1 — Actionable Gap*: If the anomaly cannot be cast as a quantitative deviation from a defined baseline, stop and refine the research question.

2. **Symmetry-Guided Hypothesis Generation**
   - Generate at least three competing mechanisms that could produce the anomaly.
   - For each hypothesis, specify: the predicted regime-dependent signature, the physical symmetry or conservation principle it invokes or violates, evidence strength (high / medium / low / speculative), key assumptions, and likely failure modes.
   - Use symmetry arguments to predict where a mechanism should operate strongly, weakly, or not at all.
   - *Gate 2 — Falsifiability*: If a hypothesis cannot be linked to a regime-dependent discriminator that distinguishes it from alternatives, reject or reformulate it before proceeding.

3. **Regime Separation & Prediction Mapping**
   - Divide the system into physically motivated regimes (e.g., inner versus outer, bound versus unbound, early versus late, high-density versus low-density).
   - Map each hypothesis to explicit predictions in each regime.
   - Establish invariant measurement rules across regimes to prevent definition-driven artifacts.
   - *Gate 3 — Regime Validity*: If regime boundaries are arbitrary, resolution-limited, or not robust to reasonable alternative definitions, return to Step 2.

4. **Controlled Comparison Design**
   - Select independent variables: mechanism presence, physics assumptions, evolutionary stage, environment, or tracer type.
   - Define dependent variables and pre-register evaluation metrics.
   - Establish a hierarchy of controls:
     - **Negative control**: a configuration where the mechanism is absent or suppressed.
     - **Positive control**: a regime where the mechanism should produce an unambiguous signature.
     - **Strong control**: paired systems sharing initial conditions and differing only in the target mechanism.
     - **Robustness control**: alternative definitions, finders, estimators, or codes.
   - *Gate 4 — Design Rigor*: If control arms differ in more than the intended mechanism (e.g., resolution, merger history, selection), redesign before execution.

5. **Minimal Viable Validation**
   - Execute the smallest test capable of falsifying the leading hypothesis.
   - Compute local diagnostics independently within each regime.
   - Perform paired comparisons against the baseline.
   - Apply null models (randomized orientations, isotropic baselines, field-matched samples) and estimate significance.
   - *Gate 5 — Null Survival*: If the signal disappears under null tests, negative controls, or modest definition changes, stop and downgrade or reject the hypothesis.

6. **Model Hierarchy & Calibration**
   - Compare minimal, intermediate, and flexible theoretical or phenomenological models against the same data.
   - Explicitly separate physical parameters from nuisance parameters that encode finder behavior, tracer bias, or measurement artifacts.
   - In simulated settings, verify recovery of known inputs before claiming observational relevance.
   - *Gate 6 — Calibration Integrity*: If added model flexibility only absorbs noise, if parameter recovery is biased, or if calibration leaks into inference, stop and revise the model or pipeline.

7. **Observational Translation & Robustness**
   - Propagate selection effects, projection effects, survey masks, and tracer completeness.
   - Test stability under alternative shape estimators, aperture definitions, and object-identification schemes.
   - When moving from dark-field simulations to biased tracers, confirm that conclusions survive realistic observational systematics.
   - *Gate 7 — External Validity*: If the signal is present only under idealized conditions and vanishes upon observational translation, restrict claims to simulation-supported priors and do not extrapolate to observed systems.

8. **Iteration & Mechanism Discrimination**
   - Update the research plan based on regime-dependent discrepancies:
     - **Local signal only**: Strengthen the embedded or regime-specific mechanism; design a follow-up to test causality.
     - **Global signal**: Consider global mechanisms (e.g., shared initial conditions, large-scale tides); revisit regime definitions.
     - **No signal**: Reject or weaken the mechanism; verify that the proposed driver is dynamically important enough.
     - **Systematics dominate**: Pause physical interpretation and improve the data model, calibration, or nuisance treatment.
   - *Stop conditions*:
     - Regime axes or definitions become ill-defined.
     - Results depend on a single outlier without a physical explanation.
     - Conclusions require physics not represented in the experiment.
     - Numerical or methodological sensitivity exceeds the physical signal.
     - The signal vanishes under any robustness or projection test.
   - *Iteration loop*: Return to Step 2 or Step 4 with refined hypotheses, regimes, or controls until the claim converges or the workflow terminates.

# Output Format

When using this skill, produce:

1. **Problem Framing** — Target system, baseline model, observable anomaly, and evidence already available versus inferred.
2. **Hypothesis Portfolio** — At least three competing hypotheses, each with predicted regime-dependent signature, evidence strength, key assumptions, likely failure modes, minimal test, and strong test.
3. **Experimental Design** — Variables, regime definitions, control hierarchy, metrics, null models, and stopping conditions. Distinguish reusable design logic from system-specific implementation.
4. **Analysis Plan** — Local diagnostics, paired comparisons, null tests, outlier inspection, uncertainty propagation, and reproducibility steps.
5. **Iteration Decision** — For each hypothesis: accept, revise, reject, or defer. Recommend the next experiment if results are inconclusive.
6. **Validity & Boundary Statement** — Confounders, observational or simulation limitations, extrapolation boundaries, and ethics or provenance constraints.

# Validation Gates

Summarized checkpoints from the Core Workflow:

- **Gate 1**: The anomaly must be a quantitative deviation from a defined baseline.
- **Gate 2**: Every hypothesis must predict a regime-dependent discriminator.
- **Gate 3**: Regime boundaries must be physically motivated and robust to alternative definitions.
- **Gate 4**: Controls must differ only in the intended mechanism.
- **Gate 5**: The signal must survive null tests and negative controls.
- **Gate 6**: Models must recover known inputs and separate physical from nuisance parameters.
- **Gate 7**: Claims must survive realistic observational systematics or be explicitly bounded to idealized domains.

# Claim Boundaries

- Distinguish **simulation-supported** findings from **observationally validated** findings; do not present the former as direct proof of the latter.
- Do not generalize conclusions beyond the tested regimes, scales, tracers, redshifts, or model families.
- Label **agent-inferred** hypotheses separately from **literature-established** patterns.
- Avoid treating correlations as causal mechanisms without controlled comparison or temporal ordering evidence.
- Do not present single-study or single-simulation results as field-wide consensus.

# Failure Modes

- **Ill-defined regimes or axes**: Shape, orientation, or membership metrics are unstable, making regime comparisons meaningless.
- **Detection bias**: The object-finding or cataloging method changes across comparison arms, creating artificial differences.
- **Nuisance absorption**: A physical signal is erased or mimicked by unmodeled tracer bias, selection effects, or finder parameters.
- **Sample variance / low counts**: A claimed trend is driven by a small number of objects or a single realization.
- **Projection and selection artifacts**: Apparent coherence arises from survey footprint, depth variation, or line-of-sight geometry rather than physical structure.
- **Numerical confounding**: Resolution limits, force softening, or subgrid variations produce effects that mimic the target mechanism.
- **Circular selection**: The same observable is used to define the sample and to test the hypothesis.
- **Overfitting**: A flexible model improves fit without improving physical interpretability or predictive performance.

# Validity Checks

Before accepting any conclusion, verify:

- **Confounding**: Differences between comparison arms do not arise from varying initial conditions, resolution, merger history, or preprocessing.
- **Regime definition**: Boundaries are physically motivated and stable to reasonable alternatives.
- **Axis stability**: Shape, orientation, and coherence metrics are well-defined; ambiguous cases are reported, not hidden.
- **Projection effects**: Observational comparisons account for viewing angle, selection functions, and tracer completeness.
- **Sample diversity**: Conclusions are tested across multiple systems, epochs, or codes when possible.
- **Null model validity**: Randomized or isotropic tests match the geometry and constraints of the measurement.
- **Statistical validity**: Uncertainty, sample size, effect size, and multiple-comparison risks are reported.
- **Reproducibility**: Versions, catalogs, masks, selection cuts, analysis code, and random seeds are documented.
- **Boundary conditions**: Explicitly state which systems, tracers, regimes, and model families the result supports and which remain speculative.

# Provenance

This skill is a semantic merge of cluster **22.1** (symmetry-guided mechanism discovery and validation) from the scientific skills codex. It synthesizes shared workflow structure from the following source skills without reproducing their paper-specific conclusions, numerical results, or operational protocols:

- `disk-halo-alignment-research-workflow`
- `cosmology-void-abundance-research`
- `satellite-halo-profile-research`
- `strong-field-gravity-research-design`
- `hydrodynamical-cluster-substructure-exploration`
- `hierarchical-infall-satellite-dynamics-skill`
- `stellar-stream-tracer-research`
- `cosmological-halo-nonsphericity-exploration`

This merged skill represents a reusable agent instruction for end-to-end mechanism discovery and validation in cosmological structure formation, not a domain-by-domain matrix or a literature summary.
