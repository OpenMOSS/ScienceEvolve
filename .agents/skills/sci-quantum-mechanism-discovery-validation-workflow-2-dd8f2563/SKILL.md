---
name: sci-quantum-mechanism-discovery-validation-workflow-2-dd8f2563
description: A reusable end-to-end workflow for discovering, discriminating, and validating physical mechanisms in complex dynamical or structural systems through hypothesis generation, controlled minimal validation, staged analysis, and iterative claim bounding.
scienceevolve-title: "Quantum materials and condensed matter · mechanism discovery validation workflow 2"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

This skill guides an agent through a transferable, end-to-end scientific workflow for mechanism discovery and validation. It abstracts the shared logic across diverse domains into a reusable route: frame an explanatory gap, generate competing mechanism hypotheses, design minimal controlled validations, analyze evidence in stages, and iterate until claims are bounded by the available evidence. The goal is to prevent overgeneralization, distinguish mechanism from artifact, and ensure that each conclusion is tied to a specific, testable prediction.

# When to use

Use this skill when the user asks to:

- Identify or discriminate among candidate mechanisms behind an observed phenomenon in a physical, dynamical, or structural system.
- Translate a paper-derived methodological insight into a reusable research pattern for a new system, model, or observable.
- Design theoretical, numerical, or high-level experimental studies that test how a dynamical regime, structural feature, or correlation property produces a target outcome.
- Diagnose why a system fails to exhibit an expected signature or why a performance peak occurs near a boundary.
- Iterate between hypothesis generation, minimal validation, and model refinement.

Do not use this skill to request or provide operational laboratory protocols, fabrication recipes, hazardous procedures, device-level implementation details, or field-wide consensus summaries.

# Inputs required

Before generating a plan, collect or infer:

- **Research question**: the specific phenomenon or performance gap to explain.
- **Target system class**: the broad family of models, materials, or platforms under study.
- **Candidate mechanisms**: plausible physical pathways, dynamical regimes, or structural mediators.
- **Available observables and diagnostics**: what can be measured or computed, and at what resolution.
- **Control capabilities**: which variables can be tuned, suppressed, or held constant.
- **Constraints**: safety boundaries, computational limits, reproducibility requirements, and compliance context.
- **Prior evidence**: known results, literature benchmarks, or preliminary data, labeled by provenance (paper-supported, field consensus, or agent inference).

If critical inputs are missing, state assumptions explicitly and label all downstream conclusions as preliminary.

# Core Workflow

1. **Frame the gap and bound the question**
   - Define the target phenomenon and the explanatory gap: what is missing, ambiguous, or contested.
   - Identify the competing mechanism classes (e.g., intrinsic dynamics, boundary effects, measurement artifacts, correlation-mediated pathways).
   - **Decision gate**: Is the question specific enough to yield falsifiable predictions? If not, refine the scope or decompose into sub-questions.

2. **Generate ranked, competing hypotheses**
   - For each candidate mechanism, produce a hypothesis statement that links a system property to an observable signature through a defined causal pathway.
   - Tag each hypothesis with: evidence strength (high / medium / low), key assumptions, predicted observables, and likely failure modes.
   - Require at least one non-mechanism hypothesis (artifact, finite-size effect, readout bias, or confounding variable).
   - **Decision gate**: Are the hypotheses mutually distinguishable with the available observables and controls? If not, redesign the diagnostic set before proceeding.

3. **Design minimal viable validation (MVV)**
   - Select independent variables (the mechanism-relevant knobs), dependent variables (outcome metrics), and mediating variables (diagnostics that should track the mechanism).
   - Define a control hierarchy:
     - *Positive control*: a configuration expected to produce the target signature.
     - *Negative control*: a configuration where the mechanism is suppressed or absent.
     - *Strong/boundary control*: a comparison that distinguishes the proposed mechanism from a plausible artifact or alternative explanation.
     - *Procedural/sham control*: a check for measurement, initialization, or handling effects.
   - Pre-register decision criteria: what outcome supports, weakens, or falsifies each hypothesis.
   - Define stopping conditions for safety, resource limits, or irreducible ambiguity.
   - **Decision gate**: Can the MVV falsify the leading hypothesis? If not, add stronger controls or refine metrics.

4. **Acquire evidence**
   - Execute simulations, theoretical derivations, or high-level experimental designs.
   - Maintain independence between mediator diagnostics and final outcome metrics where possible.
   - Document calibration, preprocessing, random seeds, and realization choices.
   - **Decision gate**: Did execution meet convergence, calibration, and safety thresholds? If not, halt and remediate before analysis.

5. **Staged analysis and mechanism linkage**
   - **Stage A — Preprocess and audit**: correct artifacts, normalize, and record all choices that could affect the inferred statistical, dynamical, or structural properties.
   - **Stage B — Extract features**: compute diagnostics (e.g., regime indicators, correlation measures, consistency scores, or structural descriptors) independently of the final outcome.
   - **Stage C — Compare against controls**: verify that controls behave as expected before interpreting the candidate system.
   - **Stage D — Link mediator to outcome**: test whether the proposed structural or dynamical mediator predicts the outcome across system classes, not only in the candidate.
   - **Stage E — Quantify uncertainty**: decompose into statistical, systematic, model-form, and calibration components.
   - **Decision gate**: Do controls behave as expected and does the mediator remain predictive after accounting for confounders? If not, classify as pipeline failure or insufficient evidence.

6. **Robustness and exclusion checks**
   - Vary initial conditions, realizations, parameters, observables, boundary conditions, or coarse-graining scales.
   - Check for confounders: finite-size effects, noise, calibration drift, postselection, basis dependence, or initialization bias.
   - Attempt to falsify each hypothesis, including the leading one.
   - **Decision gate**: Does the signature survive robustness checks? If not, demote the hypothesis and return to Step 2.

7. **Update mechanism map and iterate**
   - Compare results against the pre-registered evidence ladder.
   - **If supporting**: strengthen the hypothesis, then test a sharper prediction (e.g., scaling, transfer to a neighboring system, or a more discriminating observable).
   - **If null or ambiguous**: identify the highest-risk assumption and design the next MVV to target it specifically.
   - **If contradictory**: generate an alternative mechanism hypothesis and archive the failed one with its boundary conditions.
   - **Stop condition**: Stop when the claim is bounded by evidence, the main uncertainty is irreducible with current resources, or further iterations do not reduce the key unknown. Otherwise, loop to Step 2 or 3.

8. **Bound claims and finalize**
   - Separate directly supported evidence from model-supported interpretation and agent inference.
   - State limits of generalization (system class, regime, observable set, and control context).
   - Archive negative results, boundary failures, and revised assumptions.

# Output Format

Return results in the following structure:

1. **Research question and gap statement**
   - Concise formulation and why it matters.

2. **Hypothesis set**
   - For each hypothesis: mechanism, predicted observable, evidence strength, key assumptions, and likely failure modes.

3. **Study design**
   - Independent, dependent, and mediating variables.
   - Control hierarchy and rationale.
   - Minimal viable validation and stopping conditions.

4. **Analysis plan**
   - Staged diagnostics, interpretation rules, uncertainty decomposition, and decision criteria.

5. **Iteration plan**
   - Triggers for strengthening, weakening, revising, or abandoning hypotheses.
   - Next most informative test given each outcome class.

6. **Validity and boundary statement**
   - What is supported by existing evidence.
   - What remains an inference.
   - Limits of generalization and safety constraints.

# Validation Gates

Before treating any result as meaningful, verify:

- **Scope gate**: The research question is mechanism-specific, not a generic performance optimization or literature summary.
- **Independence gate**: The primary mechanism diagnostic is computed independently of the final outcome metric.
- **Control gate**: Positive, negative, strong, and procedural controls are defined and behave consistently.
- **Falsification gate**: At least one hypothesis could be rejected by the planned evidence.
- **Robustness gate**: The effect or trend survives across independent realizations, initial conditions, or parameter variations.
- **Safety gate**: The study remains at the research-design level and does not require unreviewed operational or hazardous procedures.

# Claim Boundaries

- Distinguish **demonstrated mechanism** (supported by controls and robustness checks) from **inferred mechanism** (consistent but not independently falsified).
- Distinguish **system-class evidence** from **universal claims**; limit generalization to the tested regimes, observables, and control contexts.
- Distinguish **paper-supported evidence**, **simulation evidence**, and **agent inference**; do not present a single study as field consensus.
- Do not extrapolate beyond the range of validated controls, model spaces, or measurement modalities.

# Failure Modes

- **Unfalsifiable hypothesis**: The mechanism cannot be distinguished from alternatives with current observables.
- **Control failure**: Controls are absent, not independent, or behave inconsistently.
- **Confounding mimic**: A nuisance variable (finite size, noise, boundary effect, readout bias) reproduces the target signature.
- **Measurement artifact**: Calibration drift, postselection, preprocessing, or initialization bias creates a spurious effect.
- **Overgeneralization**: A single realization, model, or system is treated as representative of a broad class.
- **Runaway iteration**: Further experiments do not reduce the main uncertainty because the design targets a secondary variable.
- **Premature bounding**: Claims are treated as final before robustness checks or independent replication.

# Validity Checks

Before presenting a research plan or result, confirm:

- The mechanism diagnostic and outcome metric are defined independently.
- Baselines are corrected; gains are measured relative to appropriate null models.
- Uncertainty is propagated for measured, derived, and model-based quantities.
- Sample sizes, convergence criteria, and statistical tests are adequate for the claimed effect size.
- Results are replicated across independent runs, realizations, or data splits where feasible.
- Model agreement is not driven by tuned parameters or truncated spaces alone.
- All assumptions about observables, initial states, time windows, and boundary conditions are explicit.
- Source-paper findings are not presented as field consensus, and specific paper parameters are not copied into new designs without independent justification.

# Provenance

- Synthesized from cluster **188.0** (end-to-end mechanism discovery and validation).
- Source skills: `dynamical-regime-quantum-reservoir-exploration`, `quantum-classicality-research-pattern`, `active-matter-forward-backward-research`, `quantum-correlation-prediction-research`, `multifractal-photonic-extreme-events`, `nuclear-structure-shape-transition-exploration`, `dispersive-hydrodynamics-exploration`, `photonic-crystal-fiber-pulse-compression-research`.
- No paper-specific conclusions, numerical parameters, operational protocols, or fabrication details are included in the reusable workflow body.
