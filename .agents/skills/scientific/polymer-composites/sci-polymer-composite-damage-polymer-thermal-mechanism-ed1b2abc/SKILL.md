---
name: sci-polymer-composite-damage-polymer-thermal-mechanism-ed1b2abc
description: Use this skill to design end-to-end mechanism discovery and validation studies for composite and polymer material systems, linking multi-modal evidence to discriminated damage or degradation hypotheses.
scienceevolve-title: "Polymer composites and vitrimers · composite damage polymer thermal mechanism discovery workflow"
scienceevolve-area: polymer-composites-and-vitrimers
---

# Purpose

Guide agents in designing transferable, end-to-end research workflows for discovering and validating damage, degradation, and failure mechanisms in fiber-reinforced polymer-matrix composites, layered structures, and related material systems. The workflow connects hypothesis generation, controlled validation design, multi-modal evidence collection, and iterative model-experiment reconciliation without treating any single study as a universal rule.

# When to use

Use this skill when a user asks for:

- New research questions about rate-dependent, multi-axial, environmental, thermal, or defect-driven damage in composites or polymers.
- Hypotheses linking constituent, interface, architecture, geometry, or processing variables to mechanical response or durability.
- Experimental or simulation plans requiring global-local linkage, full-field measurement, embedded sensing, or post-mortem morphology.
- Iterative refinement of mechanism claims when initial results are partial, contradictory, or inconclusive.

# Inputs required

Ask the user or environment for:

1. **Target material system family and architecture class** (e.g., laminate, filament-wound, coated, discontinuous).
2. **Service or loading scenario**: mechanical, thermal, environmental, hygrothermal, or coupled conditions.
3. **Candidate mechanism classes**: constituent-dominated, interface-dominated, fiber-dominated, architecture-driven, geometry-driven, or environment-coupled.
4. **Available validation modalities**: mechanical testing, imaging, spectroscopy, full-field strain measurement, embedded sensing, or simulation.
5. **Baseline or reference behavior**: unexposed, intact, or low-rate reference data if available.
6. **Safety, regulatory, and application context**: whether the output may influence safety-critical or regulated decisions.

# Core Workflow

1. **Problem Definition & Mechanism Decomposition**
   - Define the scientific gap and service-relevant bottleneck.
   - Decompose the system into candidate mechanism classes: constituent behavior, interface quality, architecture, boundary constraints, defect or discontinuity geometry, and environmental coupling.
   - *Stop gate*: If the bottleneck cannot be linked to a falsifiable mechanism class, pause and refine the question before proceeding.

2. **Hypothesis Generation**
   - For each candidate mechanism, produce a hypothesis card containing: question, falsifiable statement, physical mechanism, design variables, controls, primary and secondary metrics, evidence strength, key assumptions, and likely failure modes.
   - Rank hypotheses by evidence strength (e.g., paper-supported, model-supported, preliminary experimental, speculative).
   - *Decision gate*: Proceed only if at least one hypothesis is testable with available resources; otherwise, reduce scope or expand the literature review.

3. **Minimal Validation Design**
   - Select one primary variable and a closely matched baseline.
   - Define controls: baseline, positive control, negative control, mechanism-isolation control, and artifact check.
   - Choose multi-modal metrics that pair global response with local field, morphological, or simulation evidence.
   - Pre-specify stop and revision criteria for nonrepresentative failure, excessive variability, ambiguous signal attribution, or safety limits.
   - *Stop gate*: If controls cannot isolate the proposed mechanism, redesign before execution.

4. **Evidence Collection**
   - Gather data across at least two independent channels (e.g., mechanical plus imaging, or experimental plus simulation).
   - Document metadata, batch consistency, calibration, and environmental conditions.
   - *Decision gate*: If primary data fails integrity checks or controls are compromised, flag for replication or redesign.

5. **Integrated Analysis & Mechanism Discrimination**
   - Normalize against baselines; quantify uncertainty, scatter, and replicate variability.
   - Map global trends to local damage features or predicted fields.
   - Compare experimental and simulation trends; treat discrepancy as a diagnostic signal rather than error.
   - Exclude mechanisms that are inconsistent with the converging evidence profile.
   - *Iteration gate*:
     - **Supported**: Strengthen the claim and test robustness via boundary variation or replication.
     - **Partial**: Refine the hypothesis to a narrower mechanism or identified confounder.
     - **Contradicted**: Revisit assumptions, check artifacts, or reject and regenerate hypotheses.
     - **Inconclusive**: Increase replication, add orthogonal characterization, or improve calibration before proceeding.

6. **Claim Bounding & Documentation**
   - State validated mechanism boundaries: material family, loading mode, geometry class, environment, and scale.
   - Separate paper-supported observations from new inferences.
   - Document residual failure modes, risks, and conditions where the dominant mechanism may switch.

# Output Format

When using this skill, return:

1. **Research objective**: target system, scenario, and mechanism gap.
2. **Ranked hypotheses**: hypothesis cards with evidence strength, assumptions, and failure modes.
3. **Validation plan**: minimal viable design, control set, metrics, and stop criteria.
4. **Analysis plan**: normalization, uncertainty treatment, multi-channel integration, and model comparison logic.
5. **Iteration log**: decision record for each hypothesis branch.
6. **Claim boundaries**: scope of validity, extrapolation limits, and safety notes.

# Validation Gates

- **Confounder isolation**: Material, geometry, loading, environment, and measurement variables must be independently controlled or explicitly documented.
- **Control adequacy**: Baseline, positive, negative, and mechanism-isolation comparisons must be present or justified.
- **Reproducibility**: Metadata, exclusion rules, data provenance, and analysis logic must be documented.
- **Statistical validity**: Variability, uncertainty estimates, and outlier handling must be predefined.
- **Model validity**: Simulation assumptions, boundary conditions, and sensitivity must be tested against independent evidence.
- **Mechanistic consistency**: Global response, local fields, morphology, and model trends must converge on the same mechanism.

# Claim Boundaries

- Limit conclusions to the tested material family, architecture, loading mode, environment, and scale.
- Distinguish validated mechanisms from transferable hypotheses requiring further validation.
- Do not extrapolate across strain-rate regimes, temperature boundaries, or structural scales without noting explicit validation gaps.
- Mechanical viability or laboratory trends alone do not imply service qualification, certification, or safety-critical approval.

# Failure Modes

- **Experimental artifact dominance**: Grip effects, misalignment, edge effects, or nonrepresentative failure masking the true mechanism.
- **Confounded variables**: Constituent, interface, architecture, or geometry effects inseparable due to poor control matching.
- **Signal misattribution**: Temperature, handling, optical, or environmental artifacts interpreted as mechanical strain or damage.
- **Model-experiment mismatch**: Unvalidated simulation used to override empirical evidence, or incorrect boundary assumptions.
- **Overgeneralization**: Transferring a trend from one geometry, loading mode, or material class to another without validation.
- **Premature extrapolation**: Inferring lifetime or service performance from single-endpoint or accelerated data without mechanism consistency checks.

# Validity Checks

- [ ] **Mechanism specificity**: Does the metric distinguish the proposed mechanism from alternatives?
- [ ] **Control logic**: Can the observed effect be falsified by the control set?
- [ ] **Data integrity**: Are specimen identity, calibration, and environmental history confirmed?
- [ ] **Uncertainty quantification**: Are replicate scatter and measurement uncertainty reported?
- [ ] **Evidence integration**: Do at least two independent channels support the conclusion?
- [ ] **Boundary documentation**: Are material, geometric, loading, and environmental limits stated?
- [ ] **Safety scope**: Is the plan non-operational and qualified-review-ready for hazardous or safety-critical contexts?

# Provenance

- Synthesized from cluster 22.0 (composite-damage-polymer-thermal-mechanism-discovery-workflow).
- Source skills: strain-rate-composite-mechanics-research-design; composite-cure-in-situ-strain-research; biaxial-composite-damage-research-design; defect-localization-composite-research; thermal-spray-coating-research-workflow; hygrothermal-composite-durability-research; sustainable-composite-mechanism-research; composite-discontinuity-damage-workflow.
