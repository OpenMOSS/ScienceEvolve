---
name: sci-cosmology-observable-driven-mechanism-discovery-wor-46463e24
description: A reusable end-to-end workflow for designing astrophysical studies that discover and validate mechanisms from observables through hypothesis generation, multi-control experimental design, latent-to-observable auditing, and iterative claim bounding.
scienceevolve-title: "Galaxy, cosmology, and simulations · observable driven mechanism discovery workflow 13"
scienceevolve-area: galaxy-cosmology-and-simulations
---

# Purpose

Help an agent turn a broad astrophysical question into a falsifiable, observable-driven research plan. The workflow abstracts reusable methodology across extragalactic and galactic domains: identify a latent mechanism, map it to observable signatures, discriminate it from confounders using structured controls, validate with independent diagnostics or simulations, and bound claims by evidence strength and sensitivity limits.

# When to use

Use when the user asks to:

- Propose new research questions about galaxy formation, evolution, reionization, cluster physics, stellar populations, or interstellar/intergalactic medium processes.
- Design studies that separate astrophysical signals from selection effects, projection, contamination, or model degeneracy.
- Plan multi-probe or multi-diagnostic validation where no single observable is decisive.
- Evaluate whether a reported signature is physical or an artifact of analysis choices, calibration, or nuisance parameters.
- Iterate after a simulation, observation, or model shows mismatch with predictions.

Do not use for operational telescope procedures, low-level numerical implementation instructions, or as a substitute for domain literature reviews.

# Inputs required

Before executing the workflow, collect or state assumptions for:

- Target system class and scientific contrast (e.g., bound versus unbound populations, reionization source versus environment, selection bias versus physical halo property).
- Available data or simulation products with provenance documentation.
- Candidate mechanisms and their expected latent signatures.
- Dominant confounders: projection, contamination, completeness, calibration, model degeneracy, or numerical artifacts.
- Reference models, empirical fiducials, or benchmark samples for calibration.
- Desired output: research question, hypothesis set, study design, analysis plan, or critique.

# Core Workflow

Execute the following ordered stages. At each decision gate, pause to evaluate whether the study remains feasible or should pivot.

## Stage 1: Frame the gap and latent signature
1. Define the unresolved coupling or structural contrast.
2. Identify the latent physical quantity and scale where the mechanism should operate.
3. State the claim boundary: redshift, mass, spatial scale, wavelength regime, or population class.
4. **Decision Gate 1 (Candidate Gate):** If the mechanism cannot be linked to any observable discriminator, stop and reformulate the question.

## Stage 2: Generate mechanism hypotheses
For each candidate mechanism, produce:
- Mechanism description and causal chain to observable.
- Predicted signatures in at least two independent diagnostic families.
- Confounder model that could mimic the signal.
- Evidence strength (strong / moderate / weak / speculative).
- Key assumptions and likely failure modes.
- **Decision Gate 2 (Candidate Gate):** If all hypotheses are degenerate with unmeasured assumptions, narrow the scope or request additional diagnostics.

## Stage 3: Design the study architecture
1. Define independent variables (e.g., source population, environment parameter, geometry, selection proxy).
2. Define dependent variables (e.g., global history, morphology, population diagnostic, mock observable).
3. Specify controls:
   - Baseline / null model.
   - Mechanism-only variant.
   - Negative control where the signal should weaken or disappear.
   - Positive control or empirical fiducial where the signal is expected.
   - Numerical control (resolution, domain size, sampling).
   - Observational control (independent data not used for calibration).
4. **Decision Gate 3 (Stability Gate):** If the design cannot separate the mechanism from its dominant confounder, redesign the diagnostic or stop.

## Stage 4: Prepare data and audit selection effects
1. Assemble catalogues or simulations with full provenance, coordinate systems, calibration history, and selection-function documentation.
2. Quantify measurement uncertainties, completeness, and contamination.
3. Apply reproducible quality criteria; record rejected objects separately.
4. **Decision Gate 4 (Robustness Check):** If the selection function is unknown or dominates the predicted signal, halt until it is characterized.

## Stage 5: Execute latent-to-observable mapping
1. Measure latent structure in the native space (simulation or deprojected where possible).
2. Transform to projected, sampled, or noisy observables.
3. At each transformation step, record information loss and nuisance injection.
4. Compare multiple estimators or model families to test estimator dependence.
5. **Decision Gate 5 (Mechanism Exclusion):** If model-class separation disappears after projection and noise, flag the probe as scale-mismatched or nuisance-limited and pivot to a more direct diagnostic.

## Stage 6: Decompose components and fit models
1. Fit competing models including a single-component or null alternative.
2. Assign membership, classify populations, or infer parameters probabilistically rather than by single thresholds.
3. Correct counts, profiles, or efficiencies for the full selection function before comparing components.
4. **Decision Gate 6 (Iteration Gate):** If the null model cannot be rejected, downgrade the claim and test sensitivity limits.

## Stage 7: Validate with independent diagnostics
1. Cross-check with spatial, spectral, kinematic, or population diagnostics not used in the primary fit.
2. Run robustness tests across binning, thresholds, sky splits, calibration choices, and alternative templates.
3. Use mock observations or forward modeling to estimate bias and recovery limits.
4. **Decision Gate 7 (Functional Validation):** If independent diagnostics conflict, treat the result as conditional and require replication before generalizing.

## Stage 8: Classify evidence and bound claims
1. Label evidence strength based on consistency across calibration, independent validation, morphology, and numerical stability.
2. State explicit boundaries: where the conclusion applies and where extrapolation is unsafe.
3. Separate measured quantities from inferred formation-history or physical-law claims.
4. **Decision Gate 8 (Claim Bounding):** If the result depends on a single threshold, one regime, or an unmodeled selection effect, bound the claim as provisional.

## Stage 9: Iterate or terminate
- **Continue:** Evidence is strong and controls survive; propose the next discriminating test.
- **Pivot:** Latent separation exists but observable separation is lost; redesign the probe or add complementary observables.
- **Stop:** The hypothesis is indistinguishable from alternatives, the negative control removes the effect, or sensitivity is insufficient. Document the failure mode as a boundary.

# Output Format

Return a structured research plan containing:

1. **Research question** — concise question, coupling tested, and claim boundary.
2. **Hypothesis table** — mechanism, predicted signatures, confounder, evidence strength, key assumptions, failure modes, and discriminating test.
3. **Study design** — variables, control set, diagnostics, metrics, and stop conditions.
4. **Analysis plan** — step-by-step route from data provenance through latent-to-observable mapping, model fitting, and robustness tests.
5. **Validation plan** — criteria for support, weakening, or rejection of each hypothesis.
6. **Iteration plan** — rules for updating, pivoting, or terminating after results.
7. **Validity statement** — what counts as support, what counts as failure, and what remains unresolved.
8. **Evidence separation** — explicit distinction between source-supported methods, new inferences, and untested assumptions.

# Validation Gates

- **Conceptual gate:** Is the distinction between latent mechanism and effective observable explicit?
- **Normalization gate:** Are total signal and shape/diagnostic analyzed separately where relevant?
- **Method gate:** Do results survive alternative reference models, intrinsic templates, and estimator choices?
- **Sample gate:** Could selection effects, projection, calibration, or coverage explain the result?
- **Statistical gate:** Are uncertainties, resampling, posterior checks, and residual diagnostics appropriate?
- **Reproducibility gate:** Are assumptions, data cuts, model variants, and processing steps documented for replication?
- **Boundary gate:** Are claims limited to the regime actually tested?

# Claim Boundaries

- Do not treat a single system's result as field-wide consensus.
- Do not extrapolate beyond the tested redshift, mass, scale, wavelength, or population regime.
- Distinguish calibrated findings, model-dependent inferences, and speculative extensions.
- Report upper limits and unresolved minorities rather than forcing a dominant mechanism narrative.
- Mark target-domain extensions as inferences unless supported by independent systems or replicated observations.

# Failure Modes

- **Scale mismatch:** The observable is insensitive to the scale where the latent signature is strongest.
- **Projection loss:** Line-of-sight contamination or geometry mixes informative and uninformative regions.
- **Nuisance dominance:** Baryonic physics, selection effects, or calibration artifacts overwhelm the predicted signal.
- **Degeneracy:** Multiple mechanisms or source mixtures reproduce the same observable.
- **Non-identifiability:** Flexible models become prior-dominated or parameters are unconstrained.
- **Compensation:** Tuning one subgrid parameter or selection threshold hides errors in another.
- **Threshold dependence:** Conclusions rely on a single bin, aperture, membership rule, or sky split.
- **Insufficient sensitivity:** The study cannot exclude minority components or detect predicted deviations.

# Validity Checks

Before finalizing any plan or result, verify:

- The research question names a specific unresolved coupling, not merely a broad topic.
- Each hypothesis has evidence strength, key assumptions, possible failure modes, and a discriminating follow-up.
- The design includes negative, positive, matched, numerical, and observational controls where feasible.
- The analysis separates tracer selection, component decomposition, structural inference, and mechanism interpretation.
- The metrics can distinguish astrophysical differences from calibration, contamination, projection, or threshold artifacts.
- The completeness and selection function are explicit for every sample used in inference.
- The conclusion respects sensitivity limits and does not exclude minority components without adequate power.
- The workflow is reusable for new targets without copying source-specific settings.

# Provenance

- Workflow synthesized from cluster 5.0 (observable-driven mechanism discovery and validation).
- Source skill references: `bcg-icl-kinematic-component-research`, `galactic-bulge-population-exploration`, `galaxy-dust-attenuation-research-workflow`, `reionization-research-design`, `weak-lensing-cluster-shape-dm-probe-design`, `cluster-shock-reacceleration-research-workflow`, `optical-cluster-selection-bias-research`, `high-redshift-dust-source-exploration`.
- Paper-derived patterns are preserved as reusable methodological structures; no paper-specific numerical results, object parameters, or operational protocols are included.
