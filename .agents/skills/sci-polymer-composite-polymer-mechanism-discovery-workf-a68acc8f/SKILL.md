---
name: sci-polymer-composite-polymer-mechanism-discovery-workf-a68acc8f
description: End-to-end observable-driven mechanism discovery and validation for polymer, thermoset, and composite material systems.
scienceevolve-title: "Polymer composites and vitrimers · composite polymer mechanism discovery workflow 3"
scienceevolve-area: polymer-composites-and-vitrimers
---

# Purpose

Use this skill to design reusable, mechanism-first research workflows for polymer, thermoset, and composite material systems. It guides hypothesis generation, multi-factor experimental design, multi-modal validation, and iterative claim refinement while keeping source-specific conclusions and operational protocols out of the workflow body.

# When to use

Use this skill when the user asks to:

- Propose new research questions about reinforcement, toughening, flame retardancy, barrier performance, durability, or processability in polymer composites.
- Design experiments that couple composition, interface, processing, and service variables to mechanism discrimination.
- Interpret ambiguous or non-monotonic trends via competing-mechanism analysis.
- Update hypotheses after screening, factorial, or gradient studies.

Do not use this skill as a substitute for executable laboratory recipes, domain-specific safety review, safety-critical structural qualification, or field-wide consensus claims derived from single studies.

# Inputs required

Ask the user or environment for:

- Target material system: matrix chemistry, reinforcement or filler family, and interface architecture.
- Performance gap and service-relevant failure mode (e.g., brittle fracture, delamination, barrier loss, ignition susceptibility, wear damage).
- Candidate mechanism levers: additive class, surface treatment, architecture change, or process modification.
- Available characterization categories: mechanical, thermal, imaging, spectroscopy, transport, electrochemical, or fire-response methods.
- Decision context: discovery screening, mechanism confirmation, robustness testing, or pre-validation study.
- Boundary conditions and constraints: intended service environment, safety or regulatory limits, and replication resources.

If any input is missing, state the assumption explicitly and mark resulting claims as exploratory.

# Core Workflow

Apply the following ordered, end-to-end route with explicit decision gates and iteration/stop conditions.

1. **Frame the gap and bottleneck**
   Define the service-relevant failure mode and identify whether prior work overemphasizes a single endpoint while neglecting coupled behavior.
   *Decision gate:* Is the gap a missing causal bridge, not merely a missing result? If no, reformulate the research question.

2. **Generate falsifiable mechanism hypotheses**
   Propose how a candidate lever alters the governing process (e.g., load transfer, crack deflection, transport tortuosity, char formation, interfacial stability, or defect suppression). For each hypothesis specify evidence strength, key assumptions, a discriminating measurement, a likely failure mode, and a boundary condition.
   *Decision gate:* Are hypotheses linked to at least one performance metric and one damage or degradation metric? If no, refine until falsifiable.

3. **Design a discriminating experiment**
   Establish a control hierarchy: unmodified baseline, process-only control, negative control, positive or benchmark control, and replicate or batch control. Vary composition and process factors together to expose interactions. Include a gradient to detect insufficiency, compatibility, and overload or defect-dominated regimes. Define primary, secondary, mechanism-indicator, and robustness metrics.
   *Decision gate:* Do controls isolate the proposed mechanism from confounders such as voids, moisture, dispersion, thickness, curing artifacts, or substrate differences? If no, add controls before proceeding.

4. **Run minimum viable validation**
   Confirm baseline properties before interpreting service performance. Collect data under predefined success, failure, and ambiguity criteria.
   *Decision gate:* Are data quality, sample identity, and replicate structure confirmed? If no, pause and audit.

5. **Triangulate and discriminate mechanisms**
   Cross-validate process metrics, morphology or imaging, chemical or physical indicators, and statistical diagnostics. Check for competing explanations including aggregation, poor wetting, phase separation, voids, residual stress, or test artifacts.
   *Decision gate:* Do multiple independent evidence streams align? If no, downgrade claim strength and identify the most likely omitted variable or measurement limitation.

6. **Map trade-offs and bound claims**
   Compare target-property gains against losses in processability, thermal stability, mechanical integrity, or durability. Normalize post-stress performance against intact references where applicable.
   *Decision gate:* Does the candidate improve the target without unacceptable secondary degradation? If no, flag the trade-off and narrow the claim.

7. **Iterate or stop**
   - **Advance:** Evidence supports the causal chain and trade-offs are acceptable; proceed to stronger validation or an adjacent design space.
   - **Modify:** The direction is supported but a mechanism or control remains unresolved; design the smallest next test that resolves the dominant uncertainty.
   - **Pivot:** Results contradict the main hypothesis or mechanism indicators fail; revise the causal map and competing-mechanism set.
   - **Stop:** Variability swamps effects, safety or reproducibility criteria are unmet, or the design cannot distinguish competing mechanisms.
   *Decision gate:* Is the next step the smallest experiment that resolves the leading ambiguity? If no, redesign.

# Output Format

When using this skill, produce:

1. **Research question** — One concise question tied to a mechanism or performance gap.
2. **Hypothesis set** — Mechanism-based hypotheses with evidence strength, key assumptions, likely failure modes, discriminating measurements, and boundary conditions.
3. **Experimental design** — Variables, control hierarchy, primary and secondary metrics, mechanism-indicator measurements, and stop conditions.
4. **Analysis plan** — Baseline checks, factor-response mapping, mechanism triangulation, trade-off assessment, and uncertainty handling.
5. **Iteration decision** — Advance, modify, pivot, or stop, with rationale and the next discriminating test.
6. **Claim boundary** — What can be concluded from the proposed study and what cannot be concluded without additional validation.
7. **Validity and safety notes** — Confounders, reproducibility checks, application boundaries, and non-operational safety constraints.

# Validation Gates

Before finalizing a research plan or interpreting results, check:

- **Confounding check:** Are thickness, substrate preparation, curing, conditioning, and dispersion comparable across samples?
- **Control adequacy:** Does the design include baseline, process-only, negative, and benchmark controls appropriate to the claim?
- **Endpoint balance:** Is the candidate evaluated across all relevant physical, chemical, mechanical, and morphological endpoints?
- **Mechanistic validity:** Are model stages and mechanism interpretations physically plausible, stable, and consistent with orthogonal data?
- **Statistical validity:** Are replicates, uncertainty, outliers, and effect sizes reported rather than relying only on average trends?
- **Extrapolation boundary:** Are claims limited to tested materials, formulations, stressors, and measurement methods?

# Claim Boundaries

- Separate direct observation, model-supported inference, and speculative extrapolation.
- Do not treat single-paper or single-system rankings as field-wide consensus.
- Limit application-facing statements to tested architectures, formulations, and environments.
- Distinguish paper-supported method logic from agent-generated new-system inferences.

# Failure Modes

- Confounding by processing variation, incomplete cure, moisture uptake, voids, or geometry differences.
- Overload or defect regime where high additive or filler content introduces agglomeration, brittleness, cracking, or delamination.
- Mechanism misattribution when only one evidence stream is used.
- Premature extrapolation from screening designs beyond the sampled experimental window.
- Trade-off blindness where gains in one metric mask unacceptable losses in another critical property.
- Irreproducibility due to batch effects, uncontrolled environmental drift, or weak replication.

# Validity Checks

- Does the plan address one clear research task rather than the entire material class?
- Are paper-supported observations separated from agent-generated hypotheses?
- Are composition, interface, processing, and service variables mapped to specific mechanisms?
- Are failure criteria and stop conditions defined for irreproducibility, unsafe degradation, unacceptable variability, or ambiguous mechanism?
- Are analytical or numerical assumptions compatible with observed microstructure?
- Is morphology used as a decision gate rather than post-hoc decoration?

# Provenance

- Synthesized from cluster 29.1 (observable-driven mechanism discovery and validation).
- Source skill references: biomass-fiber-composite-exploration, nanofiller-coating-durability-exploration, conductive-nanofiller-composite-edm-exploration, hybrid-laminate-nanoreinforcement-research, thermoset-composite-workflow-explorer, processable-thermoset-composite-toughening, bio-based-flame-retardant-epoxy-exploration, acid-labile-photoinitiator-sustainable-3d-printing-exploration.
- Paper-specific conclusions, numerical parameters, and operational protocols have been excluded.
