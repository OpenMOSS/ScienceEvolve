---
name: sci-quantum-observable-driven-mechanism-discovery-workf-3fcb8586
description: A reusable end-to-end workflow for generating falsifiable hypotheses, designing discriminating controls, and validating microscopic mechanisms from ambiguous or background-limited observables across quantum, transport, and interfacial systems.
scienceevolve-title: "Quantum materials and condensed matter · observable driven mechanism discovery workflow 3"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Guide agents in converting anomalous, weak, or hard-to-access observables into bounded mechanism claims. The workflow teaches a transferable route: define a measurement gap, translate candidate mechanisms into signature-based predictions, design matched contrasts with rigorous controls, validate through minimal viable experiments, and iterate using orthogonal probes and model benchmarking. It is designed for domains where direct measurement fails and inference must be mediated by geometry, spectral, field, transport, or coherence signatures.

# When to use

Use this skill when:

- The target phenomenon is rare, weak, indirect, or background-limited and requires signature-based inference.
- The user asks for new research questions, hypotheses, or validation plans involving hidden quantities, multi-channel transport, or competing microscopic mechanisms.
- Standard measurement methods fail because of poor contrast, resolution limits, instability, contamination sensitivity, or model breakdown.
- The problem requires separating true generation physics from interface, detector, calibration, or measurement-stack artifacts.
- The user needs a reusable research-design workflow rather than a summary of a single paper or a domain-wide review.

Do not use this skill as a general literature review tool, a source of field-wide consensus from individual studies, a substitute for institutional safety review, or a provider of executable experimental procedures, material recipes, or hazardous operating parameters.

# Inputs required

Before executing the workflow, collect or clarify:

1. **Target system class** — material family, device architecture, or physical regime under study.
2. **Hidden quantity or mechanism** — the property, channel, or microscopic process to be inferred or validated.
3. **Measurement gap** — why direct observation or standard proxies are insufficient in the target regime.
4. **Candidate observable signatures** — geometry, spectral, field, temporal, transport, or imaging patterns that could encode the hidden quantity.
5. **Candidate mechanisms** — plausible physical pathways and their predicted scaling, spectral, or limiting behavior.
6. **Available validation assets** — independent estimates, reference systems, alternative models, simulations, or orthogonal probes.
7. **Constraints** — safety, regulatory, computational, environmental, reproducibility, and institutional review boundaries.

If key inputs are missing, state assumptions explicitly and label downstream conclusions as provisional.

# Core Workflow

Execute the following ordered route. Treat each **Decision Gate** as a hard stop or redesign trigger.

1. **Define the gap and hidden quantity.**
   - State the target mechanism or property that cannot be measured directly.
   - Identify the specific failure mode of standard methods (contrast, resolution, background, instability, model breakdown).

2. **Formulate mechanism-linked signatures.**
   - Translate each candidate mechanism into a falsifiable, observable signature: scaling law, spectral marker, temporal pattern, spatial distribution, or conjugate-field response.
   - Label each hypothesis with evidence strength (strong, moderate, weak, speculative), key assumptions, and a minimal falsification test.

3. **Design matched contrasts and controls.**
   - **Baseline:** condition where the target mechanism is absent or known.
   - **Positive control:** known response that validates the measurement chain.
   - **Negative / mechanism-isolation control:** condition expected to suppress the target signature.
   - **Background / instrument control:** estimate of non-signal contributions and calibration drift.
   - **Decision Gate 1:** Are controls feasible and the measurement chain calibratable? If no, stop and redesign.

4. **Pre-register the analysis plan.**
   - Define signal regions, null and alternative models, evaluation metrics, and stopping criteria before inspecting decisive data.
   - Fix analysis choices to prevent post-hoc tuning; use blinding or partitioned analysis where applicable.

5. **Execute minimal viable validation.**
   - Run calibration checks, positive controls, and background estimates.
   - Verify repeatability and that nuisance parameters are quantified.
   - **Decision Gate 2:** Do controls behave as expected and is background subordinate to the target signature? If no, stop, diagnose, and repair.

6. **Collect target data and decompose responses.**
   - Acquire data under the pre-registered protocol.
   - Decompose the total observable into candidate mediator contributions (spectral, modal, spatial, or channel-specific).
   - Propagate uncertainty from measurement variability, parameter covariance, and reference-system spread.

7. **Test mechanism-specific signatures.**
   - Compare observed patterns against the predictions of each candidate mechanism.
   - Evaluate residuals, limiting-case behavior, and whether the mediator changes in the predicted direction and magnitude.
   - **Decision Gate 3:** Does one mechanism explain the signature better than the null and alternatives? If no, generate revised or competing hypotheses and return to Step 2.

8. **Cross-validate with orthogonal probes or methods.**
   - Require consistency across independent observables, solvers, or matched system classes.
   - Compare deterministic and stochastic frameworks, or experimental and computational references, only when definitions and boundary conditions are aligned.
   - **Decision Gate 4:** Does the signature survive independent validation? If no, weaken evidence strength and bound the claim to the tested conditions.

9. **Assess robustness and boundaries.**
   - Test sensitivity to analysis choices, model approximations, finite-size or scale effects, and alternative background shapes.
   - Identify the regime edges where the mechanism should stop applying.

10. **Update evidence and iterate.**
    - Re-rank hypotheses by evidence strength; document failure modes and assumptions.
    - Decide whether to escalate (broader material class, new perturbation axis), narrow (regime-specific claim), or terminate (mechanism falsified or unsupported).
    - Stop if extrapolation would require unsupported assumptions, if artifacts are comparable to the target signal, or if the model fits only after unjustified complexity.

# Output Format

When using this skill, return:

1. **Research question and gap statement** — concise formulation of the mechanism problem and why existing methods are insufficient.
2. **Hypothesis table** — for each candidate: claim, mechanism, predicted signature, evidence strength, key assumptions, likely failure modes, and minimal test.
3. **Study design** — independent variables, mediator variables, dependent variables, matched contrasts, control matrix, evaluation metrics, and stopping conditions.
4. **Analysis plan** — data integrity checks, model structure, decomposition strategy, uncertainty propagation, residual inspection, robustness tests, and visualization plan.
5. **Iteration plan** — update rules for supported, ambiguous, and rejected outcomes; next validation step; and escalation criteria.
6. **Validity and boundary statement** — main confounders, model and extrapolation limits, reproducibility requirements, and safety or ethics constraints.

# Validation Gates

- **Control gate:** Positive, negative, baseline, and background controls must validate the measurement chain and isolate the target mechanism from confounders.
- **Signature gate:** The observed pattern must match a mechanism-specific prediction (scaling, spectral, temporal, or limiting behavior), not merely a generic trend.
- **Model gate:** Nuisance parameters, baseline offsets, boundary effects, and parameter covariance must be handled; prefer the simplest model that explains the controls.
- **Reproducibility gate:** Results must persist across independent preparations, partitions, analysis variants, or replicate runs.
- **Boundary gate:** Claims must not exceed the tested perturbation range, material class, geometry, temperature regime, or measurement modality.

# Claim Boundaries

- Distinguish **directly observed signatures** from **inferred mechanisms** and **model-supported explanations**.
- Do not treat single-study, single-system, or single-method results as field-wide consensus.
- Label analogies, extrapolations, and speculative extensions explicitly.
- Separate measurement-level conclusions from broader theoretical interpretations; report model dependence when translating observables into microscopic parameters.
- Report negative, inconclusive, and artifact-dominated results rather than selectively emphasizing successful fits.

# Failure Modes

- **Control failure:** Positive controls fail or negative controls show the target signature, indicating confounding or artifact.
- **Background dominance:** The primary signature is obscured by unmodeled background, noise, or instrument response.
- **Confounding:** Unmeasured variables (geometry, disorder, calibration drift, detector effects, sample history) mimic or mask the mechanism.
- **Artifact mimicry:** Secondary effects such as contamination, mechanical distortion, boundary scattering, or selection bias reproduce the target signature.
- **Model misspecification:** The assumed model omits relevant physics, mishandles nuisance parameters, or overfits noise.
- **Insufficient sensitivity:** Statistical power, resolution, or signal acceptance is too low to discriminate alternatives.
- **Invalid extrapolation:** Claims extend beyond the validated regime without staged verification.

# Validity Checks

Before presenting any research plan or conclusion, verify:

- **Gap validity:** The standard method has a clearly defined failure mode in the target regime.
- **Signature validity:** The observable signature is mechanistically linked to the hidden quantity, not merely correlated.
- **Control validity:** Positive, negative, baseline, and artifact controls are present or explicitly justified.
- **Statistical validity:** Uncertainty estimates, replication, pre-specified acceptance criteria, and appropriate inference frameworks are defined.
- **Blinding integrity:** Analysis choices are fixed before inspecting decisive evidence where feasible.
- **Model validity:** Nuisance parameters, boundary effects, and alternative models are considered; overfitting is checked.
- **Reproducibility:** Data extraction, model fitting, analysis decisions, and metadata are documented sufficiently for independent assessment.
- **Safety and ethics:** Experimental plans remain at the research-design level; hazardous, regulated, or infrastructure-intensive work is referred to qualified institutional review and approved procedures.

# Provenance

- Synthesized from cluster **83.0** (quantum-transport-dynamics-plasma-mechanism-discovery-workflow).
- Derived from source skills: `interface-signature-meniscus-research-design`, `phonon-transport-research-pattern`, `high-pressure-isotope-spectroscopy-exploration`, `mof-strain-thermal-transport-exploration`, `rare-event-discovery-workflow`, `low-temp-glass-echo-research-design`, `spectral-interface-phonon-exploration`, `spin-caloritronics-mechanism-discovery`.
