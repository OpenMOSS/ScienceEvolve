---
name: sci-fiber-observable-driven-mechanism-discovery-workflo-183f9673
description: A reusable end-to-end workflow for generating, validating, and iterating mechanism-based hypotheses in materials, interface, and composite systems using orthogonal evidence streams and strict controls.
scienceevolve-title: "Fiber composites and battery materials · observable driven mechanism discovery workflow 6"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Help an agent generate and evaluate research plans for mechanism discovery in materials, interfaces, and composite systems. The reusable method is to treat performance limits as coupled mechanism problems, generate falsifiable hypotheses with orthogonal predicted signatures, validate with layered controls and multimodal evidence, and iterate through structured decision gates until the mechanism is supported, revised, or rejected.

# When to use

Use this skill when a user asks to:

- Propose new research questions for systems where bulk performance is limited by unclear transport, interfacial, chemical, mechanical, or structural mechanisms.
- Design experiments that connect architecture, processing, or composition changes to specific mechanism chains.
- Generate hypotheses about coupled failure modes rather than single-metric optimization.
- Evaluate whether reported improvements are mechanistically supported or artifact-driven.
- Plan iterative research programs after partial, ambiguous, or contradictory results.

Applicable domains include, but are not limited to, solid-state energy materials, polymer degradation, fiber-composite interfaces, surface coatings, functional composites, and sensor architectures. Do not use this skill to execute hazardous procedures, reproduce exact synthesis or processing recipes from a single study, or provide clinical or safety-critical application advice.

# Inputs required

Before producing a plan, ask for or infer:

- **Target system class** and **performance bottleneck**: the macroscopic gap and the suspected sub-mechanisms (transport, interface, chemical, mechanical, structural).
- **Candidate interventions**: architecture, processing, composition, or surface changes proposed to alter the mechanism.
- **Available evidence streams**: characterization, electrochemical, spectroscopic, imaging, transport, or modeling capabilities.
- **Baseline and comparator systems**: unmodified, conventional, or literature benchmarks evaluated under the same logic.
- **Constraints**: safety review status, environmental boundaries, scalability, measurement access, and acceptable evidence strength.
- **User objective**: hypothesis generation, experimental design, data interpretation, iteration planning, or claim evaluation.

If inputs are missing, state assumptions explicitly and label resulting plans as conditional.

# Core Workflow

Follow this ordered route. Do not skip decision gates.

1. **Frame the bottleneck as a coupled mechanism problem**
   - Define the performance gap and decompose it into candidate sub-mechanisms (e.g., bulk transport, interfacial resistance, reaction pathway, mechanical degradation, structural evolution).
   - Build a mechanism map linking processing or architecture variables to structural states, transport or stability properties, and device-level or macroscopic metrics.
   - Mark each link as directly measured, inferred from related evidence, or assumed.
   - *Decision Gate 1*: Stop and refine if the bottleneck cannot be expressed as a falsifiable mechanism chain with separately testable links.

2. **Triangulate the research gap**
   - Compare three layers: application need, materials bottleneck, and methodological limitation of prior approaches.
   - Identify why partial fixes are insufficient and where the mechanism chain remains unresolved or confounded.
   - *Decision Gate 2*: If the gap cannot be located using evidence from at least two independent knowledge streams, treat the problem as exploratory and broaden the hypothesis set.

3. **Generate ranked, falsifiable hypotheses**
   - Produce at least three hypotheses:
     - (a) Conservative extension to a related material, architecture, or condition.
     - (b) Mechanism-divergent alternative that changes the dominant control variable.
     - (c) Robustness-focused hypothesis prioritizing stability under use-relevant conditions over peak initial performance.
   - For each hypothesis specify: evidence strength, key assumptions, orthogonal predicted signatures, likely failure modes, and extrapolation boundaries.
   - *Decision Gate 3*: If a hypothesis lacks an observable signature independent of the primary performance metric, reformulate before proceeding.

4. **Design minimal viable validation**
   - Define independent, dependent, and confounding variables at the mechanism level.
   - Establish controls: baseline, negative, positive (if available), component/process, and measurement controls.
   - Select primary metrics tied to performance and mechanistic metrics tied to the hypothesis.
   - Pre-register interpretation logic: state what results would support, weaken, or refute each hypothesis.
   - *Decision Gate 4*: If controls cannot isolate the proposed mechanism from artifacts (e.g., contact loss, measurement drift, processing variation), redesign before data collection.
   - *Stop Condition*: Do not proceed if safety or ethics review is incomplete or if operational execution details would be required.

5. **Execute structured analysis of orthogonal evidence**
   - Verify structure and composition before interpreting functional performance.
   - Cross-check evidence streams (structural, transport, chemical, interfacial, mechanical) for consistency with the mechanism map.
   - Separate observations from mechanism inferences and speculative extensions.
   - Test alternative explanations such as contact artifacts, uncontrolled environmental variables, or measurement bias.
   - *Decision Gate 5*: If orthogonal evidence streams contradict, flag the leading confounder and proceed to iteration rather than forcing convergence.

6. **Iterate or terminate**
   - **Supportive convergence**: If evidence supports the mechanism, test robustness (reproducibility, batch variation, boundary limits) before expanding scope or making application claims.
   - **Mixed or ambiguous**: Isolate the weakest link in the mechanism chain, add the smallest discriminating control, and return to Step 3 or 4.
   - **Contradictory**: Reject the hypothesis, update the mechanism map, and return to Step 2 or 3.
   - **Artifact-prone**: Audit the measurement chain and controls, then return to Step 4.
   - **Stop Conditions**:
     - Controls fail or explain the apparent effect.
     - Reproducibility is absent across independent samples, regions, or measurements.
     - The mechanism is unsupported by orthogonal evidence after iteration.
     - Claims would exceed validated material, environmental, loading, or operational boundaries.
     - Further iteration does not reduce uncertainty or requires operational protocols beyond the research-design scope.

# Output Format

When using this skill, respond with:

1. **Research question and bottleneck** — One-sentence mechanism-level question and the system-level failure mode.
2. **Mechanism map** — Architecture/processing/structure/transport/interface/performance links with assumptions marked as measured, inferred, or assumed.
3. **Ranked hypotheses** — For each: evidence strength, key assumptions, orthogonal predicted signatures, likely failure modes, and boundary conditions.
4. **Minimal viable validation plan** — Variables, controls, primary and mechanistic metrics, pre-registered interpretation logic, and stop conditions.
5. **Analysis plan** — How to integrate orthogonal evidence, handle uncertainty, test alternatives, and visualize mechanism-relevant relationships.
6. **Iteration rules** — Decision tree for supportive, mixed, contradictory, and artifact-prone outcomes.
7. **Validity and safety notes** — Confounders, reproducibility checks, boundary conditions, and non-operational safety or compliance caveats.

# Validation Gates

Confirm the following before accepting any hypothesis or plan:
- The bottleneck is framed as a specific mechanism chain, not a vague performance issue.
- Each hypothesis has at least one predicted signature independent of the primary performance metric.
- Controls are sufficient to isolate the intended mechanism from artifacts and confounders.
- Interpretation logic is pre-registered before data collection.
- Data integrity checks (sample identity, normalization, uncertainty, outlier handling) are defined.
- Safety and ethics boundaries are treated as non-operational constraints.

# Claim Boundaries

- Limit claims to tested material systems, loading regimes, environmental conditions, and measurement contexts.
- Distinguish source-paper evidence, broader literature support, and new agent inference with clear labels.
- Treat performance retention or functional improvement as a system-level outcome, not proof of a single isolated mechanism.
- Do not extrapolate from one architecture, one device stack, or one measurement context to field-wide consensus.
- Avoid application-oriented claims for safety-critical, clinical, or deployed use without validated durability, scalability, and compliance evidence.

# Failure Modes

- **Confounding**: The intervention changes multiple variables simultaneously without component-level controls.
- **Single-metric inference**: Mechanism is inferred from one performance endpoint without orthogonal confirmation.
- **Over-modification tradeoff**: Improvement in one property causes unacceptable degradation in another (e.g., interface enhancement vs. bulk damage).
- **Artifact-driven performance**: Apparent gains arise from contact resistance, measurement drift, environmental variation, or processing differences rather than the proposed mechanism.
- **Premature extrapolation**: Claims extend beyond validated boundaries of material, temperature, cycling, loading, or environment.
- **Inadequate reproducibility**: Effects are not consistent across independent samples, batches, or repeated measurements.
- **False mechanism attribution**: Performance changes are attributed to the hypothesized pathway when alternative explanations remain untested.

# Validity Checks

Before finalizing a research plan or result, verify:
- **Confounding control**: Are baseline, negative, positive, component, and process controls included and matched?
- **Reproducibility**: Are repeated cells, samples, regions, and measurements reported with appropriate uncertainty?
- **Statistical validity**: Are comparisons made with suitable sample counts, variance estimates, and fair normalization?
- **Mechanistic specificity**: Does each mechanism have a predicted signature that does not rely solely on the primary performance metric?
- **Boundary conditions**: Are claims explicitly limited to tested architectures, environments, and operational ranges?
- **Artifact screening**: Could contact loss, poor interfacial contact, uncontrolled side reactions, measurement bias, or sample history explain the result?
- **Evidence labeling**: Are observations, mechanism inferences, and speculative extensions clearly separated?
- **Literature positioning**: Is the result presented as one study's evidence rather than domain consensus?

# Provenance

- Synthesized from cluster 33.1 (observable-driven mechanism discovery and validation).
- Derived from source skills: integrated-solid-electrolyte-battery-research, hydrolytic-polymer-degradation-research-design, solid-electrolyte-battery-research-design, aramid-interface-exploration, interface-network-composite-research, solid-state-lithium-sulfur-cathode-transport-research-design, plant-phenol-triggered-surface-coating-research, conductive-aerogel-fiber-sensor-design.
