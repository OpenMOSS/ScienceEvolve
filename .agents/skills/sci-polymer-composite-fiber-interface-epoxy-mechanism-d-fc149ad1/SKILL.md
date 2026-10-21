---
name: sci-polymer-composite-fiber-interface-epoxy-mechanism-d-fc149ad1
description: Reusable end-to-end workflow for discovering and validating structure-property mechanisms in fiber-reinforced and particle-filled polymer composites through controlled hypothesis generation, multi-scale evidence triangulation, and iterative claim bounding.
scienceevolve-title: "Polymer composites and vitrimers · composite fiber interface epoxy mechanism discovery workflow"
scienceevolve-area: polymer-composites-and-vitrimers
---

# Purpose

Guide agents through a transferable, end-to-end mechanism discovery and validation process for polymer-matrix composites where fiber architecture, filler phase, matrix-filler interface, or reinforcement hierarchy determines mechanical, dynamic, thermal, or functional performance. The workflow emphasizes falsifiable hypotheses, strong control architectures, multi-scale evidence triangulation, and explicit claim bounding without prescribing source-specific material systems or operational procedures.

# When to use

Use this skill when a user asks to:

- Propose new research questions for fiber-reinforced, particle-filled, hybrid, laminated, sandwich, or architectured polymer composites.
- Design validation plans that link microstructural or interfacial variables to macroscopic responses such as stiffness, strength, damping, energy absorption, fracture behavior, or coupled functional performance.
- Iterate between simulation and experiment, or between mechanism hypothesis and evidence, for composite material systems.
- Evaluate trade-offs between mechanical performance, density, processability, recyclability, durability, or manufacturability.
- Move from a paper-derived concept to a new composite system while avoiding single-study overgeneralization.

# Inputs required

Ask the user or environment for:

1. **Target function and trade-off**: the desired structural or functional response and the performance tension to resolve (e.g., stiffness versus damping, strength versus density, stability versus recyclability).
2. **Composite system class**: matrix family, reinforcement type (fiber, particle, nanofiller, hybrid), architecture (laminate, sandwich, gradient, discontinuous), and interface state.
3. **Design variables**: candidate changes to architecture, orientation, stacking, interface chemistry, filler fraction, surface treatment, or hybrid ratio.
4. **Validation resources**: available mechanical testing, microscopy or imaging, spectroscopy, thermal/transport characterization, simulation tools, and statistical support.
5. **Application boundary**: intended use domain, safety-criticality, environmental exposure, regulatory constraints, and whether the plan is for screening or deployment-facing claims.
6. **Evidence context**: prior datasets, literature baselines, model inputs, and what has already been validated versus inferred.

# Core Workflow

1. **Frame the Problem as a Mechanism Question**
   - Define the target response and the performance trade-off.
   - Convert the application need into a falsifiable causal question linking a microstructural, architectural, or interfacial variable to an observable response.
   - **Decision gate**: Stop and reformulate if the question cannot be expressed as a testable mechanism.

2. **Generate Tiered Hypotheses**
   - Produce hypothesis cards containing: Question, falsifiable statement, proposed mechanism, design variables, controls, primary and secondary metrics, evidence strength, key assumptions, and likely failure modes.
   - Tier 1 — Mechanism confirmation: does the variable produce the expected response?
   - Tier 2 — Trade-off mapping: can the target improve without unacceptable secondary degradation?
   - Tier 3 — Generalization: does the mechanism hold across material classes, architectures, or environments?
   - **Decision gate**: Stop if no hypothesis is falsifiable with available resources, or if all candidate mechanisms are speculative without plausible physical reasoning.

3. **Design a Controlled Validation Plan**
   - Select a minimal viable design: baseline, candidate system, positive control, negative control, mechanism-isolation control, and confounder control.
   - Hold total reinforcement content, geometry, and processing concept constant across groups whenever architecture or interface is the independent variable.
   - Predefine primary and secondary metrics, normalization strategy (density-normalized, mass-normalized, or volume-fraction-corrected), and acceptance criteria.
   - Predefine stopping conditions: mechanism cannot be distinguished from voids, poor dispersion, or processing artifacts; primary metric improvement falls below a predefined effect size; secondary penalties exceed acceptable bounds; or controls fail.
   - **Decision gate**: Redesign if controls cannot isolate the proposed mechanism from composition effects, density changes, or processing artifacts.

4. **Collect Multi-Scale Evidence**
   - Gather macroscopic response data (mechanical, dynamic, thermal, functional) alongside microstructural and interfacial evidence (morphology, void content, dispersion, failure mode, interface quality).
   - Record processing-quality indicators as co-variates, not as post-hoc explanations.
   - **Decision gate**: Halt analysis and repair controls if data integrity checks reveal inconsistent specimen identity, missing metadata, or unrecorded processing variability.

5. **Discriminate Mechanisms Through Analysis**
   - Normalize responses against baseline and relevant controls.
   - Decompose coupled responses (e.g., elastic versus dissipative, absorption versus reflection, static versus dynamic) to avoid single-metric overinterpretation.
   - Require alignment between macroscopic trends and microstructural or interfacial evidence before accepting a causal link.
   - Reconcile simulation with experiment when both are available; classify disagreements as model error, processing artifact, measurement error, or hypothesis failure before iterating.
   - **Decision gate**: Reject the hypothesis if the response appears in negative or confounder controls, or if microstructural evidence contradicts the proposed mechanism. Return to Step 2.

6. **Iterate, Redesign, or Terminate**
   - **If mechanism is confirmed and trade-offs are acceptable**: narrow the design space, add robustness checks (property uncertainty, boundary variation, manufacturing variability), and restrict generalization claims until independent replication or cross-system validation is completed.
   - **If primary metric improves but secondary metrics degrade**: redesign around interface quality, architecture balance, or hybrid ratio rather than maximizing a single output.
   - **If results are inconsistent or artifacts dominate**: stop the branch, split the hypothesis into sub-mechanisms (matrix, interface, reinforcement, processing), and add discriminating controls.
   - **If extrapolating to a new material system or application**: state boundary assumptions explicitly and require staged validation; do not generalize without evidence.
   - **Stop condition**: Terminate a branch when it repeatedly fails predefined criteria, when safety or regulatory concerns emerge, or when deployment-facing claims would require evidence beyond the current validation stage.

7. **Bound Claims and Document Residual Uncertainty**
   - Label every conclusion with evidence strength (paper-supported, model-supported, experimentally supported, triangulated, speculative).
   - Explicitly separate demonstrated results from agent inferences and from application-facing or consensus claims.
   - List residual confounders, boundary conditions, and validation gaps.

# Output Format

When using this skill, return:

1. **Research objective**: target function, composite class, performance gap, and boundary conditions.
2. **Hypothesis table**: tiered hypotheses with mechanism, variables, controls, metrics, evidence strength, assumptions, and likely failure modes.
3. **Validation plan**: minimal viable design, control architecture, primary and secondary metrics, normalization strategy, and predefined stopping conditions.
4. **Multi-scale analysis plan**: data integrity checks, normalization, response decomposition, structure-property linkage, simulation-experiment reconciliation, and mechanism-inference rules.
5. **Iteration plan**: update rules for supported, unsupported, inconclusive, and trade-off-failing results, including next-step recommendations and stop/redirect conditions.
6. **Claim boundary statement**: evidence strength labels, residual confounders, applicability limits, and safety or ethics constraints.

# Validation Gates

- The problem is framed as a falsifiable mechanism question, not a material preference.
- Hypotheses are tiered, with at least one testable mechanism confirmation hypothesis.
- Controls are sufficient to separate the proposed mechanism from composition, density, void, dispersion, and processing artifacts.
- Data integrity and metadata completeness are verified before analysis.
- Mechanism acceptance requires agreement between macroscopic response and microstructural or interfacial evidence.
- Simulation-experiment disagreements are classified before claims are revised.
- Trade-offs are evaluated against predefined bounds, not post-hoc rationalized.
- Generalization claims are gated by replication or cross-system validation.

# Claim Boundaries

- Distinguish paper-supported findings from newly inferred or speculative conclusions.
- Do not claim field consensus, industrial readiness, or certification suitability from single-study or simulation-only logic.
- Limit application-facing claims to validated boundary conditions; do not infer long-term durability, fatigue life, or environmental aging from static or single-mode tests alone.
- Treat density-normalized, mass-normalized, and absolute metrics as complementary, not interchangeable.
- Acknowledge dataset heterogeneity when benchmarking against literature.

# Failure Modes

- **Confounding by composition**: architecture or interface effects are mistaken for reinforcement fraction or density effects because total content was not matched.
- **Artifact dominance**: voids, poor dispersion, processing defects, or boundary effects explain the observed response rather than the intended mechanism.
- **Simulation-experiment mismatch**: model assumptions ignore defects, rate dependence, scale transitions, or processing variability.
- **Single-metric over-optimization**: improving one property while obscuring degradation in toughness, durability, manufacturability, or safety.
- **False generalization**: transferring conclusions across matrix classes, reinforcement families, loading modes, or environments without staged validation.
- **Inverted mechanism**: negative controls outperform candidates, indicating the hypothesized causal link is absent or reversed.

# Validity Checks

Before presenting a research plan or conclusion, verify:

- **Confounders**: density, void content, dispersion, thickness, cure state, moisture history, fiber volume fraction, boundary conditions, and loading comparability are documented.
- **Controls**: baseline, positive, negative, mechanism-isolation, and confounder controls are present or explicitly justified.
- **Reproducibility**: sample counts, variability estimates, raw-data traceability, and analysis documentation are defined.
- **Statistical validity**: primary metrics, effect sizes, uncertainty estimates, outlier rules, and acceptance criteria are predefined.
- **Normalization**: strategy for density, mass, or volume-fraction effects is established before comparing performance.
- **Evidence boundaries**: the distinction between demonstrated results and agent inference is stated.
- **Safety and ethics**: material hazards, environmental exposure, waste handling, and application-risk levels are reviewed at a non-operational planning level.

# Provenance

- Derived from cluster 25, subcluster 25.1 (end-to-end mechanism discovery and validation).
- Synthesized from source skills: polymer-composite-compression-research-design, recyclable-thermoset-composite-research-design, lightweight-gear-material-research-design, composite-orientation-interface-research-design, lightweight-composite-research-design, hybrid-fiber-composite-architecture-research, composite-filler-exploration, nanofiller-composite-interphase-research.
