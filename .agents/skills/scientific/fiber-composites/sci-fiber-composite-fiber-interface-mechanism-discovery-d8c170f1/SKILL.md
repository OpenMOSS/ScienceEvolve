---
name: sci-fiber-composite-fiber-interface-mechanism-discovery-d8c170f1
description: A reusable end-to-end workflow for generating mechanism-linked hypotheses and validating structure-property relationships in composite, fiber, and polymer systems through controlled perturbation, orthogonal evidence, and iterative claim bounding.
scienceevolve-title: "Fiber composites and battery materials · composite fiber interface mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Guide agents through an observable-driven, end-to-end mechanism discovery and validation workflow for composite, fiber, polymer, and interface-dominated material systems. The workflow moves from a performance gap to ranked mechanism hypotheses, minimum viable validation with strong controls, orthogonal multi-domain analysis, bounded claim formation, and iterative redesign.

# When to use

Use when the user needs to propose new research questions, design validation studies, discriminate between competing structure-property mechanisms, or bound claims in composite, fiber-reinforced, polymer, membrane, textile, or multiphase material systems. Applicable when the core challenge is linking observable structure or processing changes to functional outcomes through controlled perturbation and independent evidence.

Do not use for operational laboratory protocols, clinical recommendations, safety-critical qualification, or as a substitute for field-specific regulatory review.

# Inputs required

- Target application and dominant functional requirement (e.g., mechanical, transport, thermal, interfacial, biological response).
- Candidate material classes and known compatibility or architecture constraints.
- Suspected mechanism categories (e.g., interface adhesion, dispersion, network continuity, phase morphology, environmental response).
- Available evidence: prior measurements, imaging, literature benchmarks, or computational predictions.
- Characterization constraints and accessible measurement modalities.
- Decision criteria for success, trade-off acceptance, and stopping conditions.

# Core Workflow

1. **Gap Framing & Observable Definition**
   - State the performance gap or observable anomaly as a coupled structure-property-function question.
   - Identify whether the bottleneck is dominated by interface, matrix, reinforcement, architecture, or environment.
   - *Decision Gate*: If the gap cannot be expressed as a testable mechanism question, refine the scope before proceeding.

2. **Mechanism Mapping & Hypothesis Generation**
   - Generate at least three competing mechanism-linked hypotheses.
   - For each hypothesis specify: mechanism rationale, evidence strength (strong/moderate/speculative), key assumptions, predicted observable signatures, likely failure modes, and transfer boundaries.
   - Rank hypotheses by decisiveness: prefer those distinguishable by a small set of orthogonal measurements.
   - *Decision Gate*: If hypotheses are not mutually distinguishable with available controls, reformulate or add diagnostic variables.

3. **Minimum Viable Validation Design**
   - Select one dominant perturbation variable for the first cycle.
   - Define independent variables (structural or processing descriptors), dependent variables (functional responses), and covariates (geometry, history, environment).
   - Establish controls: baseline, negative (mechanism suppressed), positive/benchmark (known behavior), and mechanism controls (isolating one descriptor while weakening another).
   - Pre-register decision rules: what outcomes count as support, trade-off, or refutation.
   - Define stop conditions (e.g., unacceptable artifact levels, control failure, safety boundary breach).
   - *Decision Gate*: If controls cannot isolate the target mechanism from confounders, redesign before data collection.

4. **Data Acquisition & Quality Screening**
   - Collect structural, physical, chemical, and functional data under matched conditions.
   - Screen for preparation artifacts, measurement noise, batch effects, handling damage, and environmental drift.
   - Flag samples or datasets that fail pre-registered quality criteria.
   - *Decision Gate*: If data quality is insufficient or artifacts dominate the signal, pause and resolve before analysis.

5. **Multi-Domain Analysis & Mechanism Discrimination**
   - Compare candidates against controls first; quantify differences relative to replicate variability.
   - Integrate orthogonal evidence (e.g., morphology with mechanics, transport with structure, spectroscopy with performance).
   - Test for non-monotonic behavior and property trade-offs; identify turning points rather than assuming monotonic improvement.
   - Separate composition effects from processing effects before attributing causality.
   - Map clusters or signatures to candidate mechanisms using independent lines of evidence; resolve disagreements rather than forcing consensus.
   - *Decision Gate*: If orthogonal measurements do not converge, classify the result as ambiguous and require additional diagnostics.

6. **Claim Bounding & Robustness Check**
   - Bound conclusions to tested materials, geometries, processing histories, and environmental conditions.
   - Classify each conclusion as directly observed, statistically supported, mechanistically inferred, or speculative.
   - Verify that effect sizes are practically relevant, not merely statistically significant.
   - *Decision Gate*: If claims require extrapolation beyond tested boundaries, downgrade the certainty label and flag the required bridging evidence.

7. **Iteration or Redesign**
   - **If supported**: Strengthen the hypothesis; test boundary conditions (e.g., broader architecture, environmental range); proceed to functional validation.
   - **If weak/ambiguous**: Add a targeted orthogonal measurement or refine the perturbation to isolate the mechanism.
   - **If contradicted**: Reject or revise the hypothesis; check whether confounders, alternative mechanisms, or measurement artifacts explain the result.
   - *Stop Condition*: Halt when the mechanism is either validated across independent replicates and diagnostics, or when further iteration is blocked by resource, safety, or reproducibility limits.

# Output Format

1. **Research Question & Gap Statement**: One concise, application-centered question with mechanism rationale.
2. **Ranked Hypotheses Table**: Mechanism, evidence strength, key assumptions, predicted signatures, failure modes, and transfer boundaries.
3. **Validation Plan**: Design matrix, control hierarchy, primary and secondary metrics, and pre-registered stop conditions.
4. **Analysis Plan**: Data quality checks, orthogonal integration logic, trade-off analysis, and visualization strategy.
5. **Decision Log**: Hypothesis version, evidence used, assumptions, result classification, claim boundary, and next action.
6. **Iteration Roadmap**: Update rules for supported, weak, contradictory, or artifact-dominated outcomes.

# Validation Gates

- **Gap Clarity Gate**: The research question must be framed as a testable structure-property mechanism.
- **Discriminability Gate**: Hypotheses must be distinguishable by the proposed measurements and controls.
- **Control Adequacy Gate**: Controls must isolate the target mechanism from processing, handling, and measurement artifacts.
- **Data Quality Gate**: Acquired data must pass pre-registered quality and artifact screening.
- **Convergence Gate**: Mechanism claims require concordant evidence from at least two independent measurement domains.
- **Extrapolation Gate**: Claims must be bounded to tested conditions unless supported by explicit bridging evidence.

# Claim Boundaries

- Do not generalize from a single study or formulation family to field-wide consensus.
- Do not infer service or clinical suitability from laboratory-scale screening alone.
- Do not extrapolate across material classes, manufacturing routes, geometries, or environmental conditions without mechanism-supported bridging.
- Distinguish direct observation from model inference; treat directional trends as stronger than exact numerical amplitudes when approximations are coarse.
- Avoid stating that a single descriptor improvement universally enhances all functional metrics.

# Failure Modes

- **Confounding dominance**: The observed signal is driven by processing history, handling damage, or measurement artifact rather than the hypothesized mechanism.
- **Trade-off masking**: A formulation improves one metric while degrading another, leading to over-optimization of a single property.
- **Non-monotonic transition**: Performance peaks and then declines with increasing perturbation; failure to identify the turning point leads to incorrect optimum claims.
- **Mechanism misattribution**: A single diagnostic is interpreted as mechanistic proof without orthogonal validation.
- **Overgeneralization**: Conclusions from one architecture or condition are applied to untested systems.
- **Control failure**: Negative or benchmark controls behave unexpectedly, invalidating the comparative framework.

# Validity Checks

- **Confounding controls**: Match geometry, history, conditioning, and preparation across groups; account for batch variability.
- **Replication & reproducibility**: Use repeated independent samples or batches; report variability before claiming optima.
- **Statistical validity**: Define tests, thresholds, and outlier rules before analysis; report effect sizes and uncertainty.
- **Measurement consistency**: Verify calibration, comparable specimen preparation, and appropriate methods for the material class.
- **Structure-function linkage**: Require structural or interfacial evidence before attributing functional changes to a specific mechanism.
- **Boundary & scale checks**: State whether conclusions apply to laboratory specimens, model systems, or service-relevant components.
- **Evidence classification**: Label conclusions as observed, inferred, or speculative; separate source-supported patterns from new-agent inferences.

# Provenance

- Synthesized from cluster `79.0` (composite-fiber-interface-polymer-mechanism-discovery).
- Derived from source skills: `hybrid-natural-fiber-composite-exploration`, `am-composite-scaffold-research-design`, `polymer-nanofiber-membrane-research-design`, `soft-particle-electrostatic-exploration`, `metal-composite-textile-exploration`, `composite-ae-rate-damage-exploration`, `cnt-fiber-compressive-exploration`, `interface-stabilized-solid-state-battery-exploration`.
