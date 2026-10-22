---
name: sci-cosmology-observable-driven-mechanism-discovery-wor-0971d403
description: Design reusable end-to-end research plans that turn ambiguous observational patterns into discriminating tests between competing physical mechanisms using multi-tracer data, controlled comparisons, and iterative validation.
scienceevolve-title: "Galaxy, cosmology, and simulations · observable driven mechanism discovery workflow 14"
scienceevolve-area: galaxy-cosmology-and-simulations
---

# Purpose

Help an agent design methodologically sound, reusable research plans for observable-driven mechanism discovery. The workflow teaches how to decompose ambiguous observational features into competing physical hypotheses, map them to independent observables or tracers, design minimal controlled validations, and iterate based on multi-evidence scoring—without treating single-case or model-dependent inferences as field-wide consensus.

# When to use

Use this skill when the user asks to:

- Propose new research questions for transient, galactic, extragalactic, or large-scale astrophysical phenomena where multiple physical mechanisms could explain the same observed pattern.
- Design multi-tracer or multi-observable studies to discriminate between competing hypotheses (e.g., interaction vs. internal evolution, reflection vs. absorption, clustering vs. selection effect).
- Plan validation checks for confounding factors such as projection, blending, calibration, finite-volume effects, or model degeneracy.
- Interpret ambiguous features across broadband, spectroscopic, imaging, or catalog data without forcing a single narrative.
- Structure iterative analysis pipelines that update hypothesis confidence from controlled tests.

Do not use this skill as a general-purpose physics tutor, a claim generator for field-wide consensus, or a substitute for domain-specific expert modeling. It is for planning methodologically sound, falsifiable investigations.

# Inputs required

Ask for or infer the following before drafting a plan:

- **Target and anomaly**: the observed feature, pattern, or tension requiring explanation.
- **Available observables/tracers**: wavelengths, bands, spectral features, morphological maps, kinematic fields, catalogs, or simulated data products.
- **Data quality and coverage**: resolution, sensitivity, cadence, calibration status, selection function, and known systematics.
- **Candidate mechanisms**: at least one target mechanism and one alternative (physical or systematic).
- **Baseline model**: the simplest explanation that must be ruled out before accepting a more complex claim.
- **Comparison assets**: reference samples, mock catalogs, randomized catalogs, benchmark sources, or literature benchmarks.
- **Constraints**: sample size, redshift range, phase coverage, proprietary limits, and computational resources.

If inputs are missing, state assumptions explicitly and label all downstream conclusions as provisional.

# Core Workflow

Follow this ordered route. Do not skip decision gates.

## 1. Define the anomaly and inventory observables

State the observed pattern as a falsifiable gap: what is seen, why current interpretation is incomplete, and what would count as a clean negative result. Inventory all available tracers/observables and their known limitations (e.g., blending, projection, finite volume, calibration).

**Decision Gate — Scope Check**: If the anomaly cannot be expressed as a missing signature or discriminating boundary, or if no observable can plausibly constrain it, stop and reformulate the question.

## 2. Generate competing mechanism hypotheses

Produce at least three ranked hypotheses:

- **Target mechanism**: the physical process under investigation.
- **Alternative physical mechanism**: a different process producing similar signatures.
- **Systematic or non-physical explanation**: an artifact, selection effect, calibration bias, or projection effect.

For each hypothesis, specify:

- Expected signatures across multiple tracers or observables.
- Evidence strength (strong / moderate / weak / speculative).
- Key assumptions and plausible failure modes.
- Minimal validation test and stronger validation path.

**Decision Gate — Discriminability Check**: If the hypotheses do not make distinct predictions in at least one observable, reformulate or stop.

## 3. Map observables to mechanisms and define controls

For each hypothesis, build a mechanism-to-observable table:

- Which tracer or observable constrains which component.
- Which nuisance factors (foregrounds, blending, geometry, response) could mimic the predicted signal.
- Required positive controls (regime where the signal should appear), negative controls (regime where it should vanish), and robustness controls (alternative models, masks, calibration choices).

**Decision Gate — Control Check**: If no negative or positive control is feasible with available data, downgrade evidence strength and flag the conclusion as conditional.

## 4. Design minimal viable validation

Select the smallest analysis or observation set that can separate the top two hypotheses. Define:

- Independent variables (e.g., phase, scale, tracer class, model complexity).
- Dependent variables (e.g., flux, velocity, correlation amplitude, spectral index).
- Evaluation metrics (e.g., residual structure, cross-tracer consistency, parameter stability).
- Explicit stop conditions (e.g., systematics dominate, signal vanishes under alternative model, parameters become unphysical).

**Decision Gate — Feasibility Check**: If the minimal test requires unavailable data or uncalibrated observables, scope down to a weaker test or stop.

## 5. Execute controlled analysis

Run the analysis in this order:

1. Validate measurements against calibration samples or known standards.
2. Apply conservative estimators that expose boundary or systematic dependence.
3. Fit the simplest adequate model first; add complexity only when residuals and physical motivation justify it.
4. Compare against at least one competing model family that explains the same features through a different mechanism.
5. Test plausible artifact explanations (blending, projection, calibration, selection effects).
6. Document all cuts, masks, binning, and parameter links.

**Decision Gate — Robustness Check**: If results change qualitatively under reasonable alternative choices, stop physical interpretation and diagnose the source of instability.

## 6. Integrate evidence and score hypotheses

Update the hypothesis table using:

- **Multi-tracer consistency**: agreement across independent observables strengthens; disagreement weakens.
- **Control passage**: success in positive, negative, and robustness controls increases confidence.
- **Model stability**: parameters remain plausible and non-degenerate across reasonable assumptions.
- **Residual diagnostics**: structured residuals indicate misspecification.

Assign each hypothesis a status: **supported**, **weakened**, **rejected**, or **inconclusive**.

**Decision Gate — Convergence Check**: If all hypotheses remain inconclusive and no further discriminator is available, report the ambiguity and specify what new observable or model would break the degeneracy.

## 7. Iterate, refine, or terminate

- **If supported**: Narrow the claim to the tested platform, geometry, scale, or regime. Design stronger validation with orthogonal observables or independent samples.
- **If weakened or rejected**: Preserve the rationale, generate new hypotheses that explain the failure, and return to Step 2.
- **If inconclusive**: Add tracers, refine controls, or increase sample size, then return to Step 4.

**Stop Conditions**:

- A hypothesis survives strong validation across multiple independent checks.
- All candidate mechanisms are rejected or rendered indistinguishable by available means.
- Further discrimination requires data or models that are infeasible to obtain.

# Output Format

Produce the following structured deliverables:

1. **Research question** — One concise question, the observed anomaly, and its scientific utility.
2. **Hypothesis table** — Mechanism, expected multi-tracer signatures, evidence strength, key assumptions, failure modes, minimal validation, and stronger validation.
3. **Experimental design** — Variables, controls (positive, negative, robustness), evaluation metrics, and stop conditions.
4. **Analysis plan** — Measurement validation steps, model comparison strategy, artifact and confounder checks, and recommended diagnostics.
5. **Iteration plan** — Rules for keeping, narrowing, combining, or rejecting hypotheses based on possible outcomes.
6. **Validity and boundary statement** — Evidence hierarchy, confounders checked, reproducibility requirements, and limits on extrapolation.

Use tables when comparing hypotheses, controls, or expected observational outcomes.

# Validation Gates

Stage-specific checks before advancing:

- **Anomaly clarity**: Is the gap falsifiable and bounded?
- **Hypothesis discriminability**: Do hypotheses predict different outcomes in at least one observable?
- **Control feasibility**: Can positive, negative, and robustness controls be constructed?
- **Measurement validity**: Are calibration, reconstruction, and selection-function quality sufficient for the intended inference?
- **Model parsimony**: Does added complexity improve multiple independent diagnostics, not just one feature?
- **Stability**: Do conclusions survive subsampling, alternative masks, and reasonable nuisance variations?

# Claim Boundaries

- Distinguish **direct measurement** from **comparative pattern**, **model-dependent inference**, and **speculative mechanism**.
- Limit claims to the tested population, redshift range, scale, phase, tracer quality, and model assumptions.
- Do not present single-object, single-epoch, or single-tracer results as population-level consensus.
- Label all conclusions that depend on unverified assumptions as conditional or provisional.

# Failure Modes

- **Overfitting one tracer**: A mechanism is accepted because it explains one observable while failing independent cross-checks.
- **Systematic mimicry**: A physical claim is actually driven by calibration, blending, projection, selection, or finite-volume effects.
- **Premature termination**: A hypothesis is rejected or accepted before strong controls are applied.
- **Model non-uniqueness**: A matching model is treated as proof of a unique history or mechanism.
- **Extrapolation beyond boundary**: Results from one target class, scale, or regime are generalized without validation.
- **Invisible degeneracy**: Competing hypotheses are never mapped to distinct observables, making the study inconclusive by design.

# Validity Checks

Before finalizing any conclusion, verify:

- **Confounding**: Could selection, calibration, projection, blending, or geometry create the apparent signal?
- **Reproducibility**: Are data sources, masks, cuts, model assumptions, and software versions documented?
- **Statistical validity**: Are uncertainties propagated, covariances appropriate, and convergence verified?
- **Tracer validity**: Do different tracers probe comparable or complementary regimes, and are mismatches interpreted diagnostically?
- **Boundary conditions**: Is the claim restricted to the validated sample, scale, and data quality?
- **Consensus caution**: Are prior findings treated as evidence to compare rather than as established truth?
- **Evidence separation**: Is the output explicit about what is measured, inferred, and speculative?

# Provenance

- Synthesized from cluster `1`, subcluster `1.0`: observable-driven mechanism discovery and validation.
- Derived from source skills: `transient-spectroscopy-research-workflow` (10.1088_0004-637x_770_1_29), `merger-dynamics-workflow` (10.1051_0004-6361_200810408), `galaxy-halo-multi-observable-inference` (10.1093_mnras_stv276), `broadband-xray-agn-spectral-research` (10.1088_0004-637x_806_2_149), `gamma-ray-indirect-dark-matter-design` (10.1088_1475-7516_2012_01_042), `polariton-quantum-fluid-workflow` (10.1038_s41467-022-34987-y), `cosmological-large-scale-structure-exploration` (10.1051_0004-6361_20065321), `broadband-transient-research-workflow` (10.1038_nature07270).
