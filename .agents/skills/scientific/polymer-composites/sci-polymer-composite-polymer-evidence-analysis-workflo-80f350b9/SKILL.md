---
name: sci-polymer-composite-polymer-evidence-analysis-workflo-80f350b9
description: Conduct end-to-end observable-driven evidence analysis and claim audit for multiphase polymer and composite systems, from hypothesis generation through controlled validation, multi-modal analysis, and iterative claim bounding.
scienceevolve-title: "Polymer composites and vitrimers · composite polymer evidence analysis workflow"
scienceevolve-area: polymer-composites-and-vitrimers
---

# Purpose

Guide agents in designing and executing transferable research workflows for multiphase polymer and composite material systems. The skill structures an end-to-end route that starts from observable responses or failure modes, generates falsifiable mechanism hypotheses, enforces strong control strategies, integrates multi-modal evidence, and iterates only within bounded claims. It prevents conflating simulation-only results, single-study observations, or unvalidated extrapolations with general material knowledge.

# When to use

Use this skill when a user asks for:

- New research questions or hypotheses for composite, thermoset, dynamic covalent, bio-derived, or recyclable polymer systems.
- Experimental or simulation designs that must isolate a mechanism from confounding variables.
- Analysis plans combining mechanical, thermal, chemical, imaging, or transport evidence.
- Iteration rules for reconciling model predictions with measurements, or for updating hypotheses after control comparisons.
- Claim audit or evidence-boundary review before presenting material performance conclusions.

Do not use this skill to provide operational fabrication recipes, hazardous handling instructions, or deployment-ready engineering parameters.

# Inputs required

Ask the user or environment for:

1. **Target system class**: composite architecture, matrix family, reinforcement type, or network chemistry.
2. **Target observable or response**: effective property, failure mode, degradation mechanism, process bottleneck, or functional behavior.
3. **Constituent and microstructure information**: phase identities, known properties, property uncertainty, geometry, orientation, interface quality, defects, and imaging data if available.
4. **Boundary and loading context**: constraints, periodicity assumptions, environmental exposure, thermal or mechanical loading regime, and measurement configuration.
5. **Validation resources**: available experiments, simulations, analytical baselines, imaging, spectroscopy, and uncertainty-analysis support.
6. **Evidence baseline**: source-paper findings, literature benchmarks, preliminary data, or simulation results that inform the starting hypothesis.
7. **Safety and ethics context**: material hazards, application domain, regulatory constraints, and whether the system could affect humans, infrastructure, animals, or the environment.

# Core Workflow

Execute the following ordered route. Treat each numbered step as a gate; do not proceed past a gate until its criteria are satisfied or explicitly waived with justification.

1. **Define the observable and evidence gap**
   - Start from the target response or failure mode that matters, not from a preferred material or chemistry.
   - Compare existing evidence against the target to identify missing validation, robustness gaps, or boundary uncertainties.
   - *Stop*: if the observable cannot be defined in measurable terms or if safety/ethics constraints preclude investigation.

2. **Map candidate mechanisms and tier hypotheses**
   - Link design variables to the observable through physical, chemical, or microstructural mechanisms.
   - Generate tiered hypotheses:
     a. Mechanism confirmation
     b. Driver isolation and tradeoff detection
     c. Robustness under variable uncertainty
     d. Generalization boundary testing
   - For each hypothesis, produce a card containing: question, falsifiable statement, mechanism, controlling variables, controls, primary/secondary metrics, evidence strength, key assumptions, and likely failure modes.
   - *Gate*: Reject hypotheses that lack a falsifiable prediction or a plausible negative control.

3. **Design minimal viable validation**
   - Select the smallest comparison set that can isolate the proposed mechanism.
   - Define candidate groups:
     - Minimal viable candidate
     - Positive control (expected to show the response)
     - Negative control (expected to lack the response)
     - Mechanism-isolation control (varies one suspected driver)
     - Boundary control (tests constraint, geometry, or measurement assumptions)
   - Declare variables held constant and justify them.
   - *Stop*: if controls are infeasible, if the comparison cannot falsify the hypothesis, or if required testing violates safety/compliance constraints.

4. **Plan multi-modal evidence collection**
   - Specify empirical measurements, simulations, imaging, spectroscopy, or transport analysis needed to test the hypothesis.
   - Separate scalar metrics from field distributions (e.g., local stress, strain, displacement, morphology).
   - Require independent empirical validation before making real-material performance claims based solely on simulation or literature.
   - *Gate*: Ensure at least two independent evidence streams are available for mechanism triangulation.

5. **Execute and preprocess**
   - Document sample identity, batch metadata, processing history, measurement protocols, and exclusion criteria.
   - Verify data integrity: confirm comparable definitions, calibration, environmental conditions, and missing-data handling.
   - *Stop*: if processing histories differ across groups, if measurements are not repeatable, or if safety protocols are not satisfied.

6. **Analyze with mechanism isolation**
   - Normalize against homogeneous, passive, mechanism-neutral, and analytical baselines.
   - Evaluate primary metrics alongside secondary metrics and field distributions.
   - Perform sensitivity analysis on property uncertainty, geometry assumptions, boundary conditions, and model parameters.
   - Accept mechanism claims only when positive, negative, and mechanism-isolation controls produce the expected pattern and microstructural evidence aligns with mechanical/physical data.
   - *Gate*: If controls fail or model-experiment disagreement is systematic and unexplained, stop and redesign.

7. **Apply validation gates**
   - Check causal validity: the design isolates the mechanism from baseline differences and confounders.
   - Check control adequacy: all required control types are present or explicitly justified.
   - Check statistical/model validity: replicates, uncertainty, convergence, and predefined acceptance criteria are met.
   - Check reproducibility: documentation supports independent replication at a non-operational level.
   - *Decision*: If all gates pass, proceed to iteration. If any gate fails, return to Step 3 or Step 2.

8. **Iterate or redesign**
   - If mechanism is supported and tradeoffs are acceptable: narrow the design space and test robustness under controlled variation.
   - If primary metric improves but secondary metric worsens: reformulate as a tradeoff case and add mechanism-isolation controls.
   - If results are ambiguous or confounded: redesign the comparison to vary one factor at a time.
   - If extrapolating to a new material family, scale, or environment: state boundary conditions and validation gaps explicitly, then propose the minimum additional validation step.
   - *Stop*: if the mechanism cannot be isolated, if dynamic behavior is artifactual, or if safety/regulatory constraints are exceeded.

9. **Bound claims and audit evidence**
   - Label every conclusion by evidence strength: paper-supported workflow, model-supported, experiment-supported, mechanism-validated, or speculative extrapolation.
   - Distinguish what source papers demonstrated from what is newly inferred for the proposed system.
   - Limit claims to the tested material family, length scale, loading mode, processing route, and environmental conditions.
   - *Stop*: before making safety-critical, structural, clinical, or environmental-release claims without qualified independent validation.

# Output Format

When using this skill, return:

1. **Research objective**: target system class, target observable, and evidence gap.
2. **Hypothesis table**: tiered hypotheses with mechanism, variables, controls, metrics, evidence strength, assumptions, and failure modes.
3. **Design plan**: minimal viable candidate, control groups, variables held constant, multi-modal evidence streams, and stop conditions.
4. **Analysis plan**: baseline normalization, scalar and field analysis, sensitivity checks, uncertainty treatment, and evidence-labeling rules.
5. **Iteration plan**: update rules for supported, tradeoff, ambiguous, or extrapolation cases; next validation step; and redesign triggers.
6. **Validity and safety notes**: confounders, reproducibility requirements, boundary conditions, and ethical or safety constraints.
7. **Evidence classification**: clear separation of source-paper findings, literature benchmarks, model predictions, and agent-generated inferences.

# Validation Gates

Before accepting any claim, verify:

- **Causal isolation**: the design separates the proposed mechanism from confounding variables, processing artifacts, and baseline differences.
- **Control adequacy**: baseline, positive, negative, mechanism-isolation, and boundary controls are present or justified.
- **Multi-modal agreement**: mechanical, physical, or chemical evidence is supported by microstructural, imaging, or field-distribution evidence.
- **Statistical and model validity**: repeated measurements, uncertainty estimates, convergence checks, and predefined acceptance criteria are satisfied.
- **Reproducibility**: sample preparation logic, measurement protocols, model assumptions, and analysis scripts are documented at a non-operational level.
- **Scale and boundary limits**: claims do not cross length scales, material families, loading modes, or environments without explicit validation gaps noted.

# Claim Boundaries

- Do not treat a single study or simulation as field-wide consensus.
- Do not extrapolate from lab-scale specimens to structural, clinical, or safety-critical deployment without independent validation and qualified review.
- Do not attribute performance to a mechanism without confirming structure, conversion, or microstructural state first.
- Do not present simulation-only results as validated real-material performance.
- Distinguish paper-supported workflow logic from new hypotheses and agent inferences for the proposed system.

# Failure Modes

- **Confounding**: hidden processing effects, batch variation, moisture, aging, residual stress, or unmeasured defects mask the mechanism.
- **Artifactual response**: measurement bias, boundary-condition effects, model invalidity, or transition-region softening mistaken for mechanism confirmation.
- **Control failure**: inadequate negative or mechanism-isolation controls leading to false mechanism attribution.
- **Tradeoff blindness**: improvement in one metric obscures unacceptable loss in another (e.g., stiffness vs. toughness, recovery vs. creep).
- **Extrapolation risk**: unvalidated transfer across chemistries, fiber systems, architectures, or operating environments.
- **Premature termination**: stopping after single-metric success without robustness, durability, or safety checks.

# Validity Checks

Before presenting a research plan or conclusion, check:

- **Confounders**: constituent uncertainty, processing history, defect density, interface quality, environmental exposure, and measurement location.
- **Controls**: all control types are defined and feasible.
- **Reproducibility**: batch records, raw data handling, and analysis documentation are complete.
- **Statistical validity**: replication strategy, uncertainty propagation, and acceptance criteria match claim strength.
- **Model validity**: geometry, boundary, contact, void, and constituent-property assumptions are tested or bounded.
- **Evidence boundaries**: source-paper findings are separated from new inferences.
- **Ethical and safety limits**: hazardous materials, regulated applications, human exposure, infrastructure deployment, and environmental release require qualified institutional review.

# Provenance

Derived from cluster 30.1 (observable-driven evidence analysis and claim audit) via semantic merge of representative source skills:

- composite-thermal-expansion-research-design
- microcapsule-self-healing-composite-research-design
- bio-epoxy-structure-property-research-design
- hybrid-composite-thermal-exploration
- tissue-equivalent-phantom-research-design
- recyclable-vitrimer-composite-research
- polymer-insulation-tree-research-design
- continuous-fiber-thermoset-am-research-design
