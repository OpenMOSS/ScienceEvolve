---
name: sci-quantum-quantum-rare-neutrino-signal-mechanism-disc-ae968877
description: A reusable end-to-end workflow for turning observable anomalies or rare-signal excesses into ranked mechanistic hypotheses, designing multi-channel validation plans, and iterating until mechanisms are discriminated, excluded, or bounded by evidence.
scienceevolve-title: "Quantum materials and condensed matter · quantum rare neutrino signal mechanism discovery workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

This skill guides agents through an observable-driven mechanism discovery and validation workflow. It translates unexplained residuals, excesses, spectral-shape changes, or population anomalies into disciplined research questions, testable hypotheses, and rigorous validation plans. The workflow emphasizes mechanism discrimination over discovery claims, using controls, cross-channel consistency, and uncertainty auditing to separate genuine signals from artifacts, backgrounds, and model deficiencies.

## When to use

Use this skill when a user asks to:

- Investigate an unexplained excess, deficit, residual, or anomalous pattern in experimental, observational, or simulation data.
- Generate testable hypotheses about underlying mechanisms, systematics, or new physics from an observable anomaly.
- Design a validation-oriented study with controls, multi-channel comparisons, or self-normalized discriminants.
- Discriminate among competing mechanisms (signal, background, detector effect, model error) using independent lines of evidence.
- Plan iterative analysis and redesign cycles for rare-event searches, precision measurements, or population-inference studies.

Do not use this skill to claim that a single anomaly establishes a new physical effect, to provide operational instructions for hazardous equipment, or as a substitute for field-specific safety and collaboration review procedures.

## Inputs required

Before executing the workflow, identify or request:

- The observable anomaly or target rare signal, including its signature, context, and why it is scientifically relevant.
- Available data streams: signal-like samples, control samples, sidebands, calibration data, simulations, and archival datasets.
- Competing mechanism classes: candidate signal, known backgrounds, detector artifacts, environmental systematics, and model uncertainties.
- Observable discriminants: topology, timing, spectrum, spatial pattern, multi-channel response, or event-activity dependence that can separate mechanisms.
- Validation assets: mock data, injection tests, negative/positive controls, and independent probes for cross-checks.
- Constraints: statistical framework rules, blinding requirements, reproducibility standards, and non-operational safety boundaries.

If critical inputs are missing, produce a hypothesis-generation and data-acquisition plan rather than a statistical conclusion.

## Core Workflow

1. **Anomaly Definition & Observable Framing**
   - State the anomaly as an observable mismatch (excess, deficit, residual, or shape change) against a defined baseline prediction, control sample, or null model.
   - Document the comparison operation, relevant kinematic or population range, and why the mismatch is scientifically relevant.
   - **Gate:** If the anomaly cannot be expressed as a reproducible observable difference, stop and request more data or a clearer baseline.

2. **Mechanism Hypothesis Generation**
   - Generate at least three competing hypothesis classes: a target mechanism, a systematic or detector alternative, and a background or model-deficiency alternative.
   - For each hypothesis, specify the expected observable signature, evidence strength (strong, moderate, weak, or speculative), key assumptions, and likely failure modes.
   - Require every hypothesis to make at least one falsifiable prediction across independent channels, control samples, or auxiliary observables.
   - **Gate:** If the hypotheses are not mutually distinguishable with available observables, redesign the discriminant set before proceeding.

3. **Validation Plan Design**
   - Design a minimal viable validation: one primary observable and one independent validation observable, with pre-defined signal, sideband, and control regions.
   - Specify controls:
     - **Positive control:** a known response that confirms the pipeline can detect the relevant class of variation.
     - **Negative control:** a background-enriched or signal-depleted sample where the candidate effect should be absent.
     - **Strong control:** multiple instruments, models, or analysis pipelines to separate local artifacts from broader structure.
     - **Sham/scrambled control:** randomized or shifted labels to estimate false-correlation rates.
   - Define evaluation metrics: efficiency, leakage, false-positive rate, robustness under nuisance variation, and mechanism-separation power.
   - **Gate:** If no negative control can bound the dominant background or artifact, pause and redesign.

4. **Analysis Execution & Uncertainty Audit**
   - Pre-register or freeze selections, templates, fit regions, and statistical tests before signal-region interpretation.
   - Apply response corrections, calibrations, and background treatments consistently across all conditions.
   - Propagate uncertainties: statistical, systematic, model-form, and finite-sample effects.
   - Run alternative analyses under varying preprocessing, calibration, and model assumptions to test robustness.
   - **Gate:** If the effect disappears under blinded or scrambled controls, or under plausible alternative preprocessing, downgrade or reject the hypothesis.

5. **Mechanism Discrimination**
   - Compare observed patterns against the hypothesis signature matrix (timing, spectrum, topology, directionality, spatial localization, and event-activity dependence).
   - Use cross-channel consistency checks: require deviations to appear in multiple independent channels with compatible sign and magnitude.
   - Apply model comparison penalized for complexity; prefer explanations that account for all major features without post-hoc tuning.
   - **Gate:** If only one channel shows a deviation while others with comparable sensitivity disagree, treat the evidence as inconclusive and do not promote the hypothesis.

6. **Iteration or Redesign**
   - Classify the result:
     - Consistent with baseline prediction.
     - Localized deviation with plausible systematic origin.
     - Multi-channel deviation requiring model revision.
     - Null or insufficient sensitivity.
   - Update the hypothesis table: downgrade absent signatures, promote surviving hypotheses, and split broad hypotheses into narrower mechanisms.
   - If results are supportive, strengthen with orthogonal probes, broader controls, and independent datasets.
   - If results are null, convert to constraints on mechanism parameters rather than treating the study as a failure.
   - If ambiguous, identify the dominant degeneracy and add discriminating controls or refine definitions before increasing model complexity.
   - **Stop conditions:**
     - Stop if the anomaly is excluded across sensitive channels.
     - Stop if sensitivity is insufficient despite adequate controls.
     - Stop if the inferred coupling lacks a plausible mechanism and is not predicted by an independent model.
     - Stop if the claimed effect is comparable to uncontrolled systematic uncertainty.

7. **Claim Bounding & Documentation**
   - State the final evidence strength and explicit boundaries of applicability (condition range, detector regime, analysis pipeline, and validated parameter space).
   - Document negative results, failed controls, and all analysis choices.
   - **Gate:** If the result depends on unvalidated extrapolation, narrow the claim to the validated region only.

## Output Format

When using this skill, produce:

1. **Research question** — One-sentence anomaly statement and baseline comparison.
2. **Ranked hypotheses table** — Hypothesis, expected signature, evidence strength, key assumptions, failure modes, and discriminating tests.
3. **Validation plan** — Minimal viable test, control definitions, metrics, and stop conditions.
4. **Analysis plan** — Preprocessing audit, model comparison strategy, uncertainty treatment, and robustness checks.
5. **Mechanism signature matrix** — Timing, spectrum, topology, directionality, and event-activity predictions per hypothesis.
6. **Iteration log** — Decision rules for updating, splitting, downgrading, or rejecting hypotheses based on outcomes.
7. **Validity and boundary statement** — Confounding risks, reproducibility requirements, claim limits, and safety/governance notes.

## Validation Gates

- **Observable gate:** The anomaly must be expressible as a reproducible difference against a defined baseline.
- **Discriminability gate:** Hypotheses must predict distinguishable signatures across independent channels or controls.
- **Control gate:** At least one negative control and one positive or injection control must be defined before signal-region interpretation.
- **Robustness gate:** The effect must survive alternative preprocessing, calibration, and model assumptions.
- **Cross-channel gate:** Mechanism claims require compatible evidence from multiple independent channels; single-channel deviations are treated as inconclusive.
- **Systematic gate:** The claimed effect must exceed combined systematic uncertainty and uncontrolled background estimates.

## Claim Boundaries

- Distinguish "observed in the current dataset" from "generalizable to the field" or "confirmed mechanism."
- Label speculative hypotheses, inferred mechanisms, and proposed validations as provisional until independently tested.
- Do not treat single-study anomalies as field-wide consensus or established physical laws.
- Restrict claims to the validated region of parameter space, detector state, and analysis pipeline.
- Separate paper-supported methods from agent-inferred extensions.

## Failure Modes

- **Artifact mimicry:** Detector response, calibration drift, or analysis bias reproduces the target signature.
- **Background indistinguishability:** The signal shares topology, timing, or spectrum with an unmodeled or poorly constrained background.
- **Overfitting:** Model complexity or post-hoc selection creates apparent agreement that fails on independent data.
- **Aliasing and coincidence:** Sampling, periodicities, or environmental correlations produce false alignment with candidate mechanisms.
- **Narrow-regime dependence:** The result holds only under a specific detector state, energy range, or analysis choice and collapses under variation.
- **Extrapolation error:** Conclusions are extended beyond the validated region without direct evidence.
- **Circular validation:** Efficiency or background estimates rely on assumptions that already embed the signal being tested.

## Validity Checks

Before finalizing any plan or result, verify:

- **Confounding:** Could another variable (environmental, instrumental, model, or background) explain the same pattern?
- **Temporal ordering:** Does the cause precede the effect in time-series or staged data?
- **Spectral/topic validity:** Are mode identities, shape components, or population features separated from overlapping signatures?
- **Control consistency:** Do positive and negative controls behave as expected across all channels?
- **Reproducibility:** Are selections, templates, cuts, and inference choices documented and fixed before confirmatory interpretation?
- **Statistical validity:** Are uncertainties propagated, model comparisons penalized for complexity, and multiple-testing effects considered?
- **Boundary conditions:** Does the inference remain valid outside the original time span, location, instrument, or analysis pipeline?
- **Causal validity:** Is there evidence that altering the proposed mediator or mechanism changes the observable while other conditions remain comparable?

## Provenance

- Derived from cluster 116.0 ("observable-driven mechanism discovery and validation") of the scientific skills codex.
- Synthesized from representative source skills: precision-gravity-environmental-systematics, small-system-heavy-probe-exploration, nuclear-spectrum-energy-dependence-discovery, laser-plasma-indirect-instability-research, topology-informed-weak-signal-dm-search, neutrino-anomaly-exploration-workflow, pbh-optical-microlensing-research-pattern, and gw-siren-anisotropy-cosmology-exploration.
- Preserves the shared workflow route: anomaly framing → hypothesis generation → validation design → analysis with uncertainty audit → mechanism discrimination → iteration/redesign → claim bounding.
