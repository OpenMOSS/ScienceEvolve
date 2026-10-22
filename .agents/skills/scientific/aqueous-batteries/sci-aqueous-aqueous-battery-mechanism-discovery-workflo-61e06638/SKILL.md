---
name: sci-aqueous-aqueous-battery-mechanism-discovery-workflo-61e06638
description: A reusable end-to-end workflow for discovering and validating interfacial and bulk mechanisms in aqueous electrochemical energy systems through hypothesis-driven experiments, convergent evidence, and structured iteration.
scienceevolve-title: "Aqueous battery interfaces · aqueous battery mechanism discovery workflow 2"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

Guide agents in transforming performance gaps into testable mechanistic hypotheses, designing controlled validation experiments, analyzing multi-scale evidence, and iterating until claims are supported or rejected. The workflow treats the system as coupled components and interfaces rather than as isolated materials.

# When to use

Use when a user asks to propose research directions, design experiments, analyze data, or iterate on hypotheses for aqueous electrochemical systems where performance is limited by ambiguous interfacial, transport, or degradation mechanisms. Do not use for operational laboratory protocols or hazardous procedure execution.

# Inputs required

- Target system class and application context.
- Dominant failure mode or performance bottleneck.
- Candidate design intervention or material class.
- Available characterization and modeling capabilities.
- Baseline system for comparison.
- Constraints: safety, scalability, environmental impact, and reproducibility.

# Core Workflow

1. **Gap Definition & Mechanism Mapping**
   - Frame the research question around a mechanism ambiguity, not only a performance metric.
   - Decompose the system into subsystems: bulk electrolyte, electrode active material, interfaces, and device architecture.
   - Assign candidate failure modes to specific component interactions.
   - *Decision gate:* If the gap cannot be linked to at least one observable interfacial or transport process, refine the question before proceeding.

2. **Hypothesis Generation**
   - For each candidate failure mode, generate mechanism-linked hypotheses.
   - Each hypothesis must include: mechanistic rationale, evidence strength (strong/moderate/weak/speculative), key assumptions, predicted observables across at least two independent measurement types, likely failure modes, and boundary conditions.
   - Prioritize hypotheses that are falsifiable by orthogonal evidence streams.
   - *Stop condition:* Reject hypotheses that rely solely on analogies from dissimilar chemistries without independent validation paths.

3. **Experimental Design**
   - Define independent variables tied to the mechanism (e.g., electrolyte composition class, interfacial modifier concept, host architecture).
   - Define dependent variables at multiple scales: material descriptors, interfacial descriptors, electrochemical descriptors, and system descriptors.
   - Establish a control hierarchy: baseline, negative control (mechanism-inactive variant), positive control (known reference), and process/interface controls.
   - Build a minimal viable validation plan: one mechanism probe, one morphology/structure probe, one electrochemical performance probe, and one durability or stress probe.
   - Predefine stop conditions: safety concerns, inconsistent baselines, control failures, or evidence of degradation acceleration.

4. **Evidence Collection & Analysis**
   - Collect state-resolved data across pristine, operating, and cycled states.
   - Link observations across scales: molecular function → interfacial structure → deposition/morphology → electrochemical response → device behavior.
   - Require convergent evidence before claiming mechanism confirmation.
   - Separate early-cycle artifacts from durable behavior.
   - *Decision gate:* If performance improves without the predicted mechanistic signature, halt mechanism claims and redesign to test alternative explanations.

5. **Iteration & Redesign**
   - **If supported:** Preserve the responsible design motif, narrow the variant set, and escalate to broader boundary-condition testing.
   - **If ambiguous:** Add one discriminating control or orthogonal measurement to resolve the leading ambiguity.
   - **If contradicted:** Reject or revise the hypothesis, update the component-level failure map, and select the next highest-value ambiguity.
   - **If trade-offs appear:** Reframe the claim around limiting variables rather than universal improvement.
   - *Stop condition:* Cease iteration when repeated evidence shows the dominant failure mode lies outside the proposed mechanism or when controls consistently fail.

6. **Claim Formulation & Documentation**
   - Assemble the evidence matrix linking hypothesis, prediction, observation, and interpretation.
   - Label each claim by evidence strength: exploratory (single stream), supported (two independent streams), or strong (convergent evidence with controls).
   - Document boundary conditions, confounders checked, and assumptions made.

# Output Format

A structured research plan containing:
1. Research question tied to a specific mechanism ambiguity.
2. Component-level failure-mode map.
3. Ranked hypothesis table with evidence strength, assumptions, predicted observables, and failure modes.
4. Experimental design: variables, controls, metrics, minimal viable validation plan, and stop conditions.
5. Analysis plan: evidence streams to integrate, normalization rules, and decision logic.
6. Iteration roadmap: next steps for support, ambiguity, contradiction, or failure.
7. Validity and safety notes: confounders, reproducibility requirements, boundary conditions, and non-operational safety constraints.
8. Scope statement distinguishing verified observations from inferred mechanisms and speculative extensions.

# Validation Gates

- **Mechanism convergence gate:** At least two independent evidence streams must align before a mechanism is considered supported.
- **Control separation gate:** The intervention must show statistically meaningful separation from baseline and appropriate negative controls.
- **Durability gate:** Claims of stability must extend beyond early-cycle conditioning or activation.
- **Boundary gate:** Conclusions must not exceed the tested material class, cell format, or operating regime without explicit qualification.
- **Safety gate:** All proposed experiments must pass non-operational safety and environmental review before execution.

# Claim Boundaries

- Do not present single-system results as field-wide consensus.
- Do not transfer mechanisms across distinct chemistries or device architectures without validation.
- Distinguish material-level improvements from device-level artifacts.
- Separate verified observations, agent-inferred hypotheses, and unverified extrapolations in all outputs.
- Avoid claiming commercial readiness or deployment viability from laboratory-scale evidence.

# Failure Modes

- **Hypothesis misattribution:** The bottleneck is misassigned to one component when another dominates.
- **Confounding by design:** The intervention changes multiple causal variables simultaneously, preventing clean mechanism attribution.
- **Artifact-driven conclusion:** Performance gains arise from measurement drift, processing differences, or uncontrolled contact resistance rather than the intended mechanism.
- **Overgeneralization:** A valid observation in one condition is incorrectly extended to untested regimes.
- **Premature escalation:** Advancing to integrated-device or prototype testing before component-level mechanism is validated.
- **Irreversible degradation:** The candidate accelerates side reactions or mechanical failure despite short-term metric improvements.

# Validity Checks

- **Confounding:** Verify that observed gains are not caused by loading differences, geometry, assembly pressure, or inconsistent pre-treatment.
- **Reproducibility:** Require repeated samples, independent batches, and transparent variability reporting for any claim beyond preliminary.
- **Statistical validity:** Predefine success criteria, report sample counts and exclusion criteria, and avoid cherry-picked curves.
- **Mechanistic specificity:** Confirm that the proposed design variable changes the intended interfacial or transport process, not merely a correlated metric.
- **Comparator validity:** Ensure baselines and controls are relevant and measured under identical conditions.
- **Normalization consistency:** Apply uniform normalization by active material, electrode area, or system mass as appropriate across all comparisons.
- **Evidence labeling:** Clearly mark literature-supported facts, agent-generated hypotheses, and unverified extrapolations.

# Provenance

Derived from cluster 16 (subcluster 16.0) of the scientific skills codex. Synthesized from source skills: `azib-organic-interface-research`, `aqueous-electrochromic-host-electrolyte-codesign`, `aqueous-zinc-sulfur-battery-research-workflow`, `aqueous-zinc-organic-electrode-mechanism-design`, `azib-organic-electrode-exploration`, `zinc-electrolyte-ion-dipole-research`, `aqueous-zinc-ion-direct-growth-electrode-design`, and `flexible-micro-energy-storage-research-design`. Preserves only the shared workflow route and decision logic; excludes paper-specific chemistries, parameters, and operational protocols.
