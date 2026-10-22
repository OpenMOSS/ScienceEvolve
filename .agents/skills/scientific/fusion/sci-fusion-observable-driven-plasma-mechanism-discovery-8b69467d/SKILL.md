---
name: sci-fusion-observable-driven-plasma-mechanism-discovery-8b69467d
description: A reusable end-to-end workflow for generating, testing, and validating mechanism hypotheses from observables in magnetically confined plasma research.
scienceevolve-title: "Magnetic confinement fusion · observable driven plasma mechanism discovery workflow"
scienceevolve-area: magnetic-confinement-fusion
---

# Purpose

This skill guides an agent through an observable-driven mechanism discovery and validation loop in magnetically confined plasma research. It transforms an anomaly, spectral feature, or transport deviation into a structured campaign of competing hypotheses, minimal validation designs, controlled analysis, and iterative claim bounding—without prescribing device-specific operations or treating single-study results as field consensus.

# When to use

Use this skill when the task involves:

- Proposing new research questions about anomalous transport, instability drive, damping, fluctuation regimes, or confinement behavior in magnetically confined plasmas.
- Designing experiments or simulations to discriminate among candidate mechanisms using controlled observables.
- Interpreting diagnostic signatures, mode spectra, profile perturbations, electromagnetic emission, or transport-model residuals.
- Planning staged validation with explicit controls, failure criteria, and iteration rules.
- Linking measured fluctuations, spectral branches, or stability boundaries to underlying physics mechanisms.

Do not use this skill as a device operations manual, a source of executable plasma-control parameters, or a substitute for facility-specific safety review.

# Inputs required

Before producing a research plan, identify or assume:

- **Target observable or anomaly:** the spectral branch, transport deviation, fluctuation signature, or emission feature that motivates the study.
- **Baseline model or null expectation:** the established theory, collisional model, or background state against which the anomaly is defined.
- **Candidate mechanisms:** a short list of instability families, drive/damping channels, or transport processes with distinct predicted signatures.
- **Available observables:** diagnostic or simulation data covering profiles, fluctuations, mode structure, phase relationships, transport fluxes, or spectral features.
- **Control variables:** parameters that can be varied to shift a candidate mechanism while holding confounders approximately constant.
- **Constraints:** non-operational boundaries such as diagnostic access, computational budget, data quality limits, and institutional safety requirements.

If key inputs are missing, state the assumption and design the plan so the assumption can be tested.

# Core Workflow

Execute the following ordered route. Treat each **Decision gate** as a hard checkpoint; treat **Stop conditions** as triggers to halt and redesign.

1. **Anomaly Definition & Baseline Establishment**
   - State the measured deviation from the baseline model.
   - Define the spatial, temporal, and spectral boundaries of the observable.
   - Document the baseline expectation and its known limitations.

2. **Mechanism Hypothesis Generation**
   - Generate at least three competing hypotheses: a primary mechanism hypothesis, one or more alternative physics hypotheses, and a null/artifact hypothesis.
   - For each hypothesis, specify predicted observable signatures, key assumptions, evidence strength (strong/moderate/weak/speculative), and likely failure modes.
   - **Decision gate:** Proceed only if hypotheses produce mutually distinguishable predictions; otherwise refine the observable set or add diagnostics before continuing.

3. **Minimal Validation Design**
   - Select an independent variable expected to couple directly to the candidate mechanism.
   - Define strong controls: baseline, negative control (mechanism suppressed), positive control (mechanism expected), and diagnostic control (instrumental check).
   - Specify primary and secondary observables, evaluation metrics, and pre-registered exclusion criteria.
   - **Stop condition:** Halt if the perturbation cannot be isolated from confounders, if diagnostics lack sensitivity, or if safety or compliance boundaries are unresolved.

4. **Execution & State Verification**
   - Acquire or generate data and simulation outputs under the designed conditions.
   - Verify that the intended state response occurred and that non-target profiles or background variables remained stable or are explicitly modeled.
   - **Decision gate:** If state verification fails, flag confounders and redesign before mechanism analysis.

5. **Observable Analysis & Mechanism Discrimination**
   - Extract candidate features (spectral peaks, mode numbers, phase relationships, transport coefficients) with uncertainty quantification.
   - Compare observed signatures against each hypothesis’s predicted signatures.
   - Test cross-diagnostic coherence and phase consistency where applicable.
   - **Decision gate:** If observed signatures are ambiguous or indistinguishable between hypotheses, classify as unresolved and proceed directly to Step 8.

6. **Model Comparison & Consistency Check**
   - Compare observations with reduced, linear, or non-linear simulations constrained by independent transport or equilibrium estimates.
   - Require qualitative trend agreement across multiple observables, not exact numerical matching.
   - Identify whether alternative mechanisms produce similar trends.
   - **Decision gate:** If simulations predict the opposite trend or require unsupported profile changes, downgrade or reject the hypothesis.

7. **Evidence Synthesis & Hypothesis Classification**
   - Classify each hypothesis as Supported, Weakened, Reframed, or Rejected based on the full evidence set.
   - Update evidence strength and document the decisive observations.
   - **Stop condition:** Stop if a hypothesis is rejected by a strong negative control, or if it is supported by mutually consistent independent checks and no ambiguity remains.

8. **Iteration & Redesign**
   - If unresolved: identify the most discriminating next test (additional observable, alternative control, refined simulation, or synthetic diagnostic).
   - If supported: bound the validity domain and propose a stress test outside the original parameter range.
   - If rejected: generate replacement hypotheses preserving the anomaly and return to Step 2.
   - **Iteration rule:** No claim of mechanism discovery shall pass beyond this step without passing the Validation Gates.

9. **Claim Bounding & Final Output**
   - Limit conclusions to the tested regime, device class, and diagnostic set.
   - Separate observed facts, model-supported inferences, and speculative extrapolations.
   - Package the research question, hypothesis table, validation plan, analysis record, and iteration path into the Output Format.

# Output Format

Return the following structure:

1. **Research Question** — One-sentence anomaly or mechanism question with a stated validity boundary.
2. **Candidate Hypotheses** — Table with hypothesis, mechanism, evidence strength, key assumptions, predicted observables, and failure modes.
3. **Minimal Validation Plan** — Conditions, controls, required observables, and stop conditions.
4. **Analysis Plan** — State verification, feature extraction, model comparison, and transport linkage approach.
5. **Decision Criteria** — What result supports, weakens, reframes, or rejects each hypothesis.
6. **Iteration Path** — Next most discriminating test if results are ambiguous, or stress-test if supported.
7. **Confidence and Limitations** — Evidence strength, main confounders, and extrapolation boundary.

# Validation Gates

Before claiming a mechanism is discovered or validated, the following gates must be passed:

- **Confounder Gate:** Non-target gradients, equilibrium changes, diagnostic sensitivity shifts, and background state variables are quantified and do not explain the anomaly.
- **Diagnostic Gate:** Signal calibration, timing alignment, spatial resolution, and background subtraction are sufficient to support the claimed signature.
- **Control Gate:** The response is absent or markedly different under the negative control and present under the positive control.
- **Model-Consistency Gate:** Independent simulations or analytic models reproduce the observed trend under plausible input variation without requiring unsupported assumptions.
- **Transport-Linkage Gate:** Where transport claims are made, fluctuation or mode signatures are phase-consistent and correlated with independent flux estimates, not inferred from amplitude alone.
- **Reproducibility Gate:** Findings are consistent across repeated cases, independent diagnostics, or sensitivity analyses.

# Claim Boundaries

- Claims are bounded to the tested plasma regime, magnetic configuration class, and diagnostic observable set.
- Single-device or single-campaign results must not be presented as field-wide consensus.
- Mechanism claims apply only where profile controls, equilibrium reconstructions, and diagnostic sensitivities are comparable to the validation conditions.
- Transport attribution requires explicit phase-space or flux evidence; fluctuation detection alone does not demonstrate causation.
- Model agreement is evidence of consistency, not proof of mechanism uniqueness.

# Failure Modes

- **Confounder Dominance:** The target variable co-varies with uncontrolled background parameters. *Response:* Redesign for profile matching or explicitly model covariates.
- **Diagnostic Artifact:** The observed signature reflects calibration drift, saturation, or instrumental coupling rather than plasma physics. *Response:* Introduce diagnostic controls and synthetic diagnostic checks.
- **Underdetermined Transport:** Anomalous diffusion or convection cannot be separated from baseline contributions. *Response:* Test robustness to model priors and add multi-species or tracer constraints.
- **Model Mismatch:** Simulations predict the opposite trend or require unsupported inputs. *Response:* Audit equilibrium, gradient, and collisionality assumptions; consider omitted physics.
- **Indistinguishable Hypotheses:** Multiple mechanisms remain consistent with all observables. *Response:* Stop mechanistic claims and specify the narrowest discriminating experiment or simulation.
- **Safety or Compliance Block:** Required controls or perturbations exceed authorized boundaries. *Response:* Reframe as a simulation-only or feasibility study.

# Validity Checks

- **Mechanism Specificity:** Does the hypothesis predict a signature that alternatives would not predict?
- **Control Strength:** Are baseline, negative, positive, and diagnostic controls defined and feasible?
- **State Verification:** Did the intended drive or perturbation actually change the target parameter without unacceptable secondary changes?
- **Profile Consistency:** Are density, temperature, gradient, flow shear, collisionality, and impurity proxies monitored and stable?
- **Mode Identification:** Are frequency, wavenumber, localization, and propagation consistent with the proposed instability family?
- **Statistical Validity:** Are uncertainty intervals propagated and do repeated observations support the claimed direction?
- **Simulation Validity:** Does the chosen model apply to the geometry, collisionality regime, and scale separation of the observation?
- **Extrapolation Discipline:** Are conclusions labeled as source-supported, model-inferred, or speculative when applied to new systems?

# Provenance

- Derived from cluster `7` / subcluster `7.0`: observable-driven mechanism discovery and validation.
- Synthesized from representative source skills:
  - `stellarator-impurity-transport-research-design` (10.1088_1741-4326_abb869)
  - `turbulence-regime-exploration-workflow` (10.1063_1.4914153)
  - `fusion-ae-drive-damping-workflow` (10.1088_0741-3335_39_12b_022)
  - `stellarator-alfvenic-instability-exploration` (10.1088_0029-5515_52_12_123004)
  - `fusion-electron-scale-turbulence-exploration` (10.1088_1741-4326_ad5d7c)
  - `low-shear-mhd-stability-exploration` (10.1063_5.0053870)
  - `energetic-particle-instability-workflow` (10.1585_pfr.8.1102002)
  - `fusion-fast-particle-ice-exploration` (10.1088_1741-4326_aace03)
- Paper-specific conclusions, numerical parameters, and operational protocols have been excluded in favor of reusable methodological patterns.
