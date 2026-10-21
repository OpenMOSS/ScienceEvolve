---
name: sci-urban-observable-driven-mechanism-discovery-workflo-636a8245
description: A reusable end-to-end workflow for generating mechanism-grounded hypotheses, designing controlled validation studies, and iterating toward evidence-bounded conclusions across multiphysics built-environment and engineering systems.
scienceevolve-title: "Urban hazard resilience · observable driven mechanism discovery workflow 2"
scienceevolve-area: urban-hazard-resilience
---

# Purpose

Guide agents in transforming ambiguous multiphysics system behavior into structured, mechanism-grounded research plans. The workflow produces falsifiable hypotheses, controlled validation designs, diagnostic analysis protocols, and evidence-bounded conclusions without prescribing domain-specific operational parameters.

# When to use

Use this skill when:
- A user needs to investigate an unexpected observable, failure mode, or model discrepancy in domains such as built-environment flow, structural dynamics, environmental transport, or energy systems.
- A new study must discriminate among competing mechanisms or validate a simplified model against a reference.
- The task is to design a research plan or analysis workflow, not to provide operational design approval, safety-critical directives, or site-specific engineering prescriptions.

Do not use this skill as a substitute for licensed engineering review, regulatory compliance, safety certification, or operational decision-making.

# Inputs required

Before generating a plan, collect or request:
- **Target system class:** the physical domain, component scale, and dominant regime (e.g., flow, transport, deformation, wear, routing).
- **Observable or gap:** the specific discrepancy, failure mode, or validation gap driving the inquiry.
- **Decision context:** what the research must help decide (screening, mechanism explanation, prediction, model selection, or uncertainty reduction).
- **Candidate mechanisms:** suspected governing processes and factors.
- **Available evidence:** prior simulations, measurements, benchmarks, literature, or conceptual assumptions.
- **Constraints:** computational budget, data availability, measurement access, safety review, and reproducibility requirements.
- **Boundary information:** known limits where the target system differs from the evidence base.

# Core Workflow

Follow this ordered end-to-end route:

1. **Frame the gap.** Define the observable discrepancy and decision context. Separate established observations from inferred gaps.
   - *Gate:* If the observable is ambiguous or the decision context is missing, stop and request clarification.

2. **Map mechanisms.** Decompose the system into interacting components (boundary forcing, geometry, material or medium properties, and response variables). Identify dominant and candidate mechanisms.
   - *Gate:* If the mechanism map cannot be reduced to testable causal links, refine the scope.

3. **Generate mechanism hypotheses.** For each candidate, produce a hypothesis containing: a one-sentence mechanism claim, key assumptions, a predicted observable signature, a possible failure mode, a boundary condition where the claim weakens, and an evidence-strength label.
   - *Gate:* If a hypothesis lacks a discriminating observable or falsifiable prediction, reformulate or discard it before proceeding.

4. **Design controlled validation.** Build a scenario matrix:
   - **Baseline:** reference behavior.
   - **Positive control:** case where the mechanism should be clearly present.
   - **Negative control:** case where the mechanism should be absent or minimized.
   - **Contrast/stress cases:** isolate or amplify the target mechanism while holding non-target factors constant.
   - Define independent, dependent, and nuisance variables; pre-register evaluation metrics; and establish stop conditions.
   - *Gate:* If controls cannot isolate the mechanism from confounders, redesign the matrix.

5. **Harmonize inputs.** Align boundary conditions, geometry representations, metric definitions, and aggregation rules across all cases. Document assumptions, versions, and reproducibility artifacts.
   - *Gate:* If critical metadata or input harmonization is impossible, pause and collect missing inputs.

6. **Validate subcomponents.** Verify individual model components, measurement pipelines, or benchmark comparisons before interpreting system-level or coupled results.
   - *Gate:* If subcomponent validation fails, flag the limitation and restrict claims to the verified subset.

7. **Execute and diagnose.** Collect results and apply mechanism diagnostics:
   - Compare aggregate and local outputs.
   - Quantify residuals, bias, and variability.
   - Test sensitivity to assumptions, discretization, and boundary choices.
   - Use visual and statistical diagnostics to link patterns to mechanisms, not to post-hoc rationalize them.

8. **Iterate on hypotheses.**
   - *If the signature matches the prediction:* strengthen the hypothesis and proceed to robustness checks.
   - *If the signature is absent:* distinguish between mechanism absence and resolution limits; redesign or reject the hypothesis.
   - *If results are inconclusive:* add targeted sensitivity cases or improve measurement fidelity.
   - *Stop conditions:*
     - The hypothesis is sufficiently validated or falsified across defined boundaries.
     - Additional complexity no longer changes the conclusion.
     - Safety, ethical, or resource limits are reached.
     - Results depend strongly on undocumented modeling choices.

9. **Bound claims and report.** Classify each conclusion by evidence strength. State boundary conditions, extrapolation limits, and what remains unverified. Explicitly distinguish source-supported, cross-study-supported, and agent-inferred findings.

# Output Format

Each use of this skill should produce a structured research package:

1. **Research question:** one concise, mechanism-grounded question.
2. **Evidence map:** established observations, cross-study support, and inferred assumptions.
3. **Mechanism map:** interacting components, dominant processes, and suspected causal pathways.
4. **Ranked hypotheses:** for each, evidence strength, key assumptions, predicted signature, failure mode, and boundary condition.
5. **Scenario matrix:** baseline, positive control, negative control, contrast/stress cases, variables, metrics, and stop conditions.
6. **Analysis plan:** subcomponent validation, diagnostic metrics, sensitivity checks, and visualization strategy.
7. **Iteration log:** decisions made at each gate and how results updated hypotheses.
8. **Validity statement:** confounders, reproducibility risks, extrapolation boundaries, and safety or ethics constraints.

# Validation Gates

- **Observable clarity gate (Stage 1):** Require a defined discrepancy and decision context.
- **Hypothesis falsifiability gate (Stage 3):** Require a discriminating observable and explicit failure mode.
- **Control isolation gate (Stage 4):** Require that the scenario matrix can separate the target mechanism from confounders.
- **Input harmonization gate (Stage 5):** Require consistent boundary conditions, metrics, and documented assumptions across cases.
- **Subcomponent credibility gate (Stage 6):** Require credible component-level validation before system-level interpretation.
- **Iteration stop gate (Stage 8):** Require a defined stop condition before expanding the study.

# Claim Boundaries

- Do not present single-study or single-source findings as field-wide consensus.
- Restrict claims to the tested system class, physical regime, and boundary conditions.
- Distinguish validated findings from plausible but unverified inferences.
- Avoid operational prescriptions for safety-critical infrastructure, public health, or emergency response.
- Label conclusions by evidence provenance: source-supported, cross-study-supported, or agent-inferred.

# Failure Modes

- **Confounding:** Multiple mechanisms change simultaneously, preventing causal isolation.
- **Proxy mismatch:** A diagnostic metric does not map to the intended mechanism.
- **Artifact-driven pattern:** Results arise from discretization, boundary effects, numerical damping, or measurement bias rather than physics.
- **Scenario overfitting:** Conclusions fail when tested under robustness or strong-contrast cases.
- **Regime extrapolation:** Applying findings outside validated boundary conditions without justification.
- **Iteration stagnation:** Repeated redesign fails to resolve ambiguity due to insufficient data, model fidelity, or diagnostic resolution.

# Validity Checks

Before finalizing any plan or conclusion, verify:
- **Confounding control:** Are non-target factors held constant or measured across comparisons?
- **Reproducibility:** Are assumptions, inputs, metric definitions, exclusions, and software versions documented?
- **Statistical adequacy:** Are uncertainty estimates, effect sizes, and sensitivity ranges sufficient for the claim?
- **Boundary coverage:** Are regime transitions, limiting cases, and failure-mode conditions represented?
- **Mechanism specificity:** Do diagnostics isolate the proposed cause from alternatives?
- **External validity:** Is the target system sufficiently similar to the evidence base, or is the claim strictly analogical?
- **Claim discipline:** Are evidence labels applied consistently and are agent-inferred hypotheses clearly marked?

# Provenance

Synthesized from cluster 15.0 (observable-driven mechanism discovery and validation) source skills: urban-wind-pm-research-workflow, wind-energy-cfd-multiscale-research, particle-fluid-bend-wear-research, computational-structural-dynamics-exploration, wind-blade-aeroelastic-exploration, wind-farm-wake-control-research, urban-flood-model-validation-workflow, offshore-wind-wake-model-validity.
