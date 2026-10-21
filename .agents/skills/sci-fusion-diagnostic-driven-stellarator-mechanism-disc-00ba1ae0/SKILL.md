---
name: sci-fusion-diagnostic-driven-stellarator-mechanism-disc-00ba1ae0
description: A reusable end-to-end workflow for designing, validating, and bounding claims about plasma mechanisms in magnetically confined fusion systems through observable-driven hypothesis generation, measurement-chain modeling, and controlled diagnostic cross-checks.
scienceevolve-title: "Magnetic confinement fusion · diagnostic driven stellarator mechanism discovery workflow"
scienceevolve-area: magnetic-confinement-fusion
---

# Purpose

Develop transferable research plans that connect plasma physics questions to observable validation through diagnostic-aware hypothesis generation, measurement-chain reasoning, and iterative claim bounding. Use this workflow to turn an unresolved mechanism question into a structured program of controlled tests, separating instrument limitations from physical behavior without relying on any single study's specific conclusions.

# When to use

Use when the user asks to propose new research questions, design validation studies, compare diagnostic or forward-model concepts, interpret indirect or line-integrated measurements, or evaluate symmetry-breaking and transport mechanisms in magnetically confined plasmas including stellarator, tokamak, and related configurations. Do not use to claim universal plasma behavior from one implementation, to provide directly executable experimental procedures, or to bypass facility safety review.

# Inputs required

- **Research objective:** the physical mechanism, transport process, or symmetry-breaking effect to investigate.
- **Observable gap:** what current diagnostics or models cannot resolve or distinguish.
- **Candidate measurement chain:** from plasma state to raw signal, including geometry, sampling, and detection concept.
- **Topology and regime constraints:** magnetic configuration, relevant surfaces, profile conditions, and operational boundaries.
- **Validation resources:** independent diagnostics, reference channels, negative/positive controls, and repeatable test conditions.
- **Safety and compliance boundaries:** institutional review requirements and non-operational scope limits.

# Core Workflow

1. **Frame the inference target and observable gap**
   - State the physical quantity or mechanism to infer and the decision it supports.
   - Identify why existing observables cannot distinguish competing explanations.
   - *Decision Gate 1 — Candidate Gate:* If the gap cannot be expressed as a discriminating prediction with at least one falsifiable consequence, stop and reformulate the research question.

2. **Model the measurement chain and systematic layers**
   - Map the full path from hidden plasma state to detector output: source physics, propagation, transduction, acquisition, calibration, geometry, and inversion.
   - Label each layer as validated, analogy-supported, or speculative.
   - Identify where information is gained, distorted, or lost.
   - *Decision Gate 2 — Stability Gate:* If no sub-link of the chain is independently testable against a control, stop and redesign for observability before proceeding.

3. **Generate layered, ranked hypotheses**
   - **Measurement hypothesis:** the diagnostic concept can resolve the required observable within sensitivity and sampling constraints.
   - **Mechanism hypothesis:** the observed pattern supports a specific plasma process.
   - **Forward-model/instrument hypothesis:** the state-to-signal mapping is adequately captured.
   - **Alternative/failure hypothesis:** competing physical explanations or artifact sources.
   - For each, specify evidence strength, key assumptions, expected observable signature, likely failure mode, and falsification criterion.
   - *Decision Gate 3 — Robustness Check:* If hypotheses produce indistinguishable predictions under all planned controls, stop and add independent observables or refine the measurement chain.

4. **Design minimal viable validation**
   - Define a baseline case, a positive control (effect expected), a negative control (effect absent or suppressed), and an independence control (alternate diagnostic, model, or topology).
   - Classify variables: independent, mediating, dependent, and nuisance.
   - Pre-register evaluation metrics and stop conditions before analysis.
   - *Decision Gate 4 — Functional Validation:* If the minimal test cannot reject the weakest assumption or if controls are infeasible, narrow the claim or return to Step 2.

5. **Analyze with uncertainty propagation and cross-checks**
   - Validate signal quality, document preprocessing, and keep raw and processed data separate.
   - Propagate uncertainty from calibration, noise, geometry, and model assumptions.
   - Compare active, reference, negative-control, and positive-control responses.
   - Reconstruct hidden or distributed quantities only with explicit regularization, documented assumptions, and uncertainty bounds.
   - Cross-check against independent diagnostics or physical constraints.
   - *Decision Gate 5 — Mechanism Exclusion:* If signal quality fails, if calibration drift exceeds the interpretation margin, or if independent diagnostics contradict the inferred pattern without explainable cause, return to Step 4 (redesign) or Step 2 (rebuild model).

6. **Discriminate mechanisms and bound claims**
   - Compare predictions and observations using the preselected metrics.
   - Test sensitivity to alternative assumptions, profile reconstructions, or model choices.
   - Classify each hypothesis as supported, revised, narrowed, rejected, or deferred.
   - State the narrowest defensible conclusion and its explicit boundary conditions.
   - *Decision Gate 6 — Claim Bounding:* If competing hypotheses remain indistinguishable within uncertainty, stop expanding the claim and specify the next discriminating test required.

7. **Iterate or archive**
   - If the claim survives all gates, propose the next minimal experiment or simulation that would most strongly challenge it.
   - If evidence is weak or contradictory, update the hypothesis table and return to Step 3 or 2.
   - Document all assumptions, exclusions, and decision logs.
   - *Decision Gate 7 — Iteration Gate:* Advance to broader regimes or new hypothesis classes only after the current claim passes perturbation, cross-check, and sensitivity tests; otherwise redesign.

# Output Format

When using this skill, produce:

1. **Research question and observable gap** — concise problem statement and why it matters.
2. **Measurement-chain audit** — mapped layers, labels, and identified distortion points.
3. **Hypothesis table** — measurement, mechanism, forward-model, and alternative hypotheses with evidence strength, assumptions, signatures, failure modes, and falsification criteria.
4. **Validation design** — baseline, controls, variables, metrics, and stop conditions.
5. **Analysis plan** — signal-quality checks, uncertainty propagation, reconstruction assumptions, cross-check strategy, and sensitivity tests.
6. **Mechanism discrimination summary** — ranked hypotheses, bounded conclusion, boundary conditions, and residual risks.
7. **Iteration plan** — next minimal test, conditions for redesign, and documentation requirements.

# Validation Gates

- **Candidate Gate:** A discriminating prediction with falsifiable consequences must exist before proceeding.
- **Stability Gate:** At least one sub-link of the measurement chain must be independently testable against a control.
- **Robustness Check:** Hypotheses must produce distinguishable predictions under the planned control set.
- **Functional Validation:** The minimal test must be capable of rejecting the weakest assumption.
- **Mechanism Exclusion:** Signal quality, calibration stability, and independent cross-checks must be consistent before physics claims are advanced.
- **Claim Bounding:** The conclusion must be narrower than the set of competing alternatives that remain within uncertainty.
- **Iteration Gate:** Advance only if the current claim survives perturbation, cross-check, and sensitivity tests; otherwise redesign.

# Claim Boundaries

- Distinguish validated diagnostic capability from unverified plasma-physics claims.
- Do not treat a single paper implementation or device result as field-wide consensus.
- Avoid extrapolating beyond tested magnetic configurations, profile regimes, or diagnostic architectures.
- Separate measured quantities from inferred quantities; label model-dependent claims explicitly.
- Do not present simulation predictions as substitutes for experimental validation.

# Failure Modes

- Diagnostic artifact misidentified as physical mechanism (e.g., drift, background, calibration error, or geometry effect).
- Confounding by unmeasured environmental variables or operating-point changes.
- Non-identifiability: multiple hidden states or models produce the same observable signature.
- Cutoff or regularization sensitivity dominating the inferred response.
- Overfitting to narrow profile reconstructions or limited sampling.
- Unsupported extrapolation from validated baseline to new regime.
- Conflating absence of signal with absence of physical effect due to poor diagnostic acceptance.

# Validity Checks

- **Confounding:** Could calibration, geometry, background, preprocessing, or detector response explain the result?
- **Identifiability:** Can competing hidden states or mechanisms produce the same observable?
- **Reproducibility:** Are inputs, controls, normalization, and uncertainty sources specified and documented?
- **Statistical validity:** Are uncertainty bands interpretable, and are conclusions robust to reasonable model choices?
- **Boundary conditions:** Are regime limits, symmetry assumptions, and geometry constraints stated?
- **Independence:** Does at least one check come from a different diagnostic, model, or physical constraint?
- **Complexity:** Does any extended model earn added parameters through evidence or comparable model-selection logic?
- **Negative results:** Are null results reported as diagnostic sensitivity limits when appropriate?

# Provenance

- Synthesized from cluster 15 / subcluster 15.0 (observable-driven mechanism discovery and validation).
- Source skill references: plasma-interferometry-research-design, fusion-radiation-diagnostic-workflow, edge-turbulence-imaging-research-workflow, forward-model-consistent-tomography, magnetic-island-symmetry-research-skill, synthetic-diagnostic-fast-ion-loss-design, plasma-turbulence-profile-sensitivity, fusion-perturbation-transient-correction-research.
- Paper-specific conclusions, numerical parameters, and operational details have been excluded.
