---
name: sci-quantum-surface-interface-phase-quantum-mechanism-d-e5abed94
description: A reusable end-to-end workflow for converting observable anomalies into testable mechanistic hypotheses, minimal validation designs, model-assisted interpretation, and bounded scientific claims across surface, interface, phase, and defect systems.
scienceevolve-title: "Quantum materials and condensed matter · surface interface phase quantum mechanism discovery workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Help an agent design and execute an observable-driven mechanism discovery and validation workflow for systems where local events, interactions, or structures produce emergent behavior at surfaces, interfaces, phases, or defects. The skill converts an observable anomaly into ranked hypotheses, minimal validation plans, model-assisted interpretation, and bounded claims without reproducing any single study's conclusions.

# When to use

Use when a user needs to generate research questions, hypotheses, experiments, simulations, or analyses for systems showing unexpected local signatures, non-equilibrium dynamics, hidden structural features, or mismatches between canonical models and observations. Applicable across materials, soft matter, biophysics, and condensed matter domains where mechanism discrimination requires multi-observable validation.

# Inputs required

- **Target system class and boundary conditions:** the material, device, or model system and its relevant length scales and environmental constraints.
- **Observable anomaly or gap:** the unexpected feature, deviation, or measurement gap that motivates the study.
- **Canonical or reference model:** the simplified baseline or equilibrium expectation against which the anomaly is judged.
- **Available data and methods:** imaging, spectroscopy, simulation, scattering, derived fields, or statistical summaries.
- **Candidate mechanisms:** local events, interactions, geometric constraints, or history dependence that might explain the anomaly.
- **Constraints:** safety, ethics, computational limits, measurement access, and reproducibility requirements.

# Core Workflow

1. **Frame the observable gap**
   - Define the anomaly and the canonical or reference expectation.
   - Define the target system boundary and relevant scales.
   - *Gate:* Stop if the anomaly lacks a reproducible signal or a clear reference state.

2. **Generate ranked mechanism hypotheses**
   - Propose falsifiable mechanisms involving local events, interactions, structures, or history dependence.
   - For each hypothesis record: mechanism, key assumption, predicted diagnostic signature, evidence strength, and likely failure mode.
   - *Gate:* If hypotheses predict identical observables, redesign the trait space or diagnostic set before proceeding.

3. **Design minimal validation**
   - Specify the hypothesis condition that preserves the proposed mechanism.
   - Specify a matched baseline/reference condition that weakens or removes the mechanism while matching other relevant properties.
   - Define controls (positive, negative, baseline, reference, artifact) and independent/dependent variables.
   - Define primary and secondary metrics and pre-register analysis rules.
   - *Gate:* If controls cannot separate the target mechanism from confounders, revise the design.

4. **Acquire and process data**
   - Collect time-resolved, spatially resolved, or ensemble data under defined conditions.
   - Preprocess, register, and segment; quantify measurement uncertainty.
   - Extract local events, fields, trajectories, or structural signatures.
   - *Gate:* If signal cannot be distinguished from noise or artifact, stop and refine acquisition or processing.

5. **Build and test minimal models**
   - Construct the simplest explanatory model (event-based, interaction law, statistical descriptor, or geometric inference).
   - Compare predictions against multiple independent observables (global trends, local morphology, distributions, scale-resolved features).
   - *Gate:* If the model fits only one observable or requires post-hoc tuning, keep it tentative.

6. **Discriminate mechanisms and check robustness**
   - Compare hypothesis and baseline results to test necessity.
   - Vary scales, boundaries, protocols, or parameters to check stability.
   - Exclude alternative explanations using control data.
   - *Gate:* If alternative mechanisms fit equally well, return to step 2 to generate discriminating predictions.

7. **Iterate, bound, or stop**
   - **Support:** If the mechanism is robust across controls and observables, strengthen the evidence label, define applicability boundaries, and propose the next validation step.
   - **Ambiguity:** If results are mixed, refine controls, resolution, or intermediate regimes.
   - **Contradiction:** If the hypothesis fails against controls, revise or discard it before adding complexity.
   - **Stop conditions:** Mechanism is indistinguishable from noise; controls fail; core assumptions are violated; ethical, safety, or feasibility limits are reached; the model lacks discriminative power.

8. **Document and package**
   - Compile the research plan, evidence hierarchy, and boundary statement.
   - Label each claim as paper-supported, model-supported, target-system-validated, or speculative.

# Output Format

Return a structured research plan containing:

1. **Research question and system boundary**
2. **Ranked hypotheses** — mechanism, key assumptions, predicted signatures, evidence strength, and likely failure modes.
3. **Minimal validation design** — hypothesis condition, matched baseline, controls, variables, metrics, and stop conditions.
4. **Analysis plan** — data checks, model construction, multi-observable comparison, and uncertainty quantification.
5. **Iteration plan** — decision rules for support, ambiguity, and contradiction.
6. **Validity and boundary statement** — confounders, reproducibility checks, external validity limits, and safety/ethics constraints.

# Validation Gates

- **Anomaly clarity:** The gap is defined against a clear, reproducible reference state.
- **Hypothesis discriminability:** Candidate mechanisms predict distinguishable observables.
- **Control sufficiency:** Controls isolate the target mechanism from confounders.
- **Data integrity:** Signal is distinguishable from noise, artifact, and measurement bias.
- **Model necessity:** The mechanism-rich model outperforms the baseline across multiple observables.
- **Robustness:** Results survive changes in scale, boundary, protocol, or parameter variation.
- **Convergence:** Evidence is sufficient to support the current claim level.

# Claim Boundaries

- Distinguish kinetic coexistence from equilibrium coexistence.
- Distinguish local mechanism from global average behavior.
- Distinguish physical signal from preparation artifact, boundary effect, or finite-size artifact.
- Distinguish paper-supported findings from agent-inferred extensions and speculative generalizations.
- Limit claims to validated system classes, length scales, and driving regimes.

# Failure Modes

- The anomaly is an artifact of measurement, segmentation, or threshold choice.
- The baseline/reference is mismatched and does not isolate the proposed mechanism.
- The model fits one observable but fails others, indicating overfitting or wrong mechanism.
- Controls fail to separate the target mechanism from alternative explanations.
- Results are sensitive to window size, boundary conditions, or sampling density.
- The mechanism is indistinguishable from stochastic noise or generic non-equilibrium behavior.
- Extrapolation beyond the validated regime without independent validation.

# Validity Checks

- Does the target system actually exhibit the proposed local feature or interaction?
- Is the baseline matched for all relevant properties except the mechanism under test?
- Are multiple independent observables used (global metrics, local structure, temporal dynamics, statistical distributions)?
- Are results robust to reasonable uncertainty in assumptions, parameters, and measurement thresholds?
- Are model outputs reproducible from documented inputs, code, and configuration?
- Are claims bounded to regimes where the interaction law or mechanism is plausible?
- Are source-paper conclusions separated from new hypotheses and inferences?

# Provenance

- Synthesized from cluster 224.0 (observable-driven mechanism discovery and validation).
- Source skills: marine-particle-coagulation-research, surface-dynamics-metastability-research, granular-packing-iro-exploration, immune-tug-of-war-research-exploration, contrast-depth-defect-research-design, granular-bottleneck-geometric-intervention, colloidal-triple-junction-research-design, mesoscale-strain-statistics-research.
- Domain-agnostic merge; no paper-specific parameters, materials, or operational protocols are included.
