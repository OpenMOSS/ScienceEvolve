---
name: sci-fiber-observable-mechanism-discovery-workflow-6a978760
description: End-to-end workflow for generating, testing, and validating mechanistic hypotheses in materials and energy systems through controlled, multi-modal comparative research.
scienceevolve-title: "Fiber composites and battery materials · observable mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Use this skill to transform an ambiguous performance gap or material behavior into a falsifiable mechanistic hypothesis, design a discriminating validation strategy, and iterate until the mechanism is supported, refuted, or bounded. It is intended for research planning in materials, composites, and energy systems where multiple subsystems interact and single-metric improvements are insufficient to establish causality.

# When to use

- When a user asks to design a new study to explain why a material or device behaves as it does.
- When the goal is to distinguish a proposed mechanism from confounders, artifacts, or alternative explanations.
- When planning comparative experiments or simulations that require baseline, controls, and multi-modal evidence.
- When interpreting mixed or conflicting results and deciding how to update hypotheses.
- Do not use for operational laboratory instructions, field-wide consensus claims, or deployment-ready engineering approval.

# Inputs required

- **Target system and context:** the material, device, or subsystem under study and its intended service conditions.
- **Known bottleneck or gap:** the observable limitation or failure pathway to be explained.
- **Candidate mechanism(s):** proposed structural, chemical, interfacial, or transport explanations.
- **Prior evidence:** literature, preliminary data, or computational predictions with explicit limitations.
- **Available methods:** characterization, imaging, spectroscopy, electrochemical diagnostics, or simulation tools.
- **Constraints:** safety, ethics, regulatory, resource, scale, and reproducibility boundaries.
- **Baseline reference:** the conventional or current-best configuration against which candidates are compared.

# Core Workflow

Follow the end-to-end route below. At each gate, decide whether to proceed, redesign, or stop.

1. **Frame the performance gap**
   - Express the bottleneck as an observable change in behavior, not only as a metric deficit.
   - Identify the subsystem(s) most likely responsible (e.g., bulk, interface, transport, or architecture).
   - **Gate:** If the gap cannot be defined in observable, testable terms, stop and clarify the research question.

2. **Generate ranked mechanistic hypotheses**
   - For each candidate, specify:
     - **Mechanistic claim:** how the proposed change should alter the dominant pathway.
     - **Predicted observables:** primary and secondary signals expected if the mechanism is real.
     - **Key assumptions:** conditions that must hold for the prediction to be valid.
     - **Evidence strength:** high, medium, or low based on prior support and system similarity.
     - **Likely failure modes:** plausible ways the hypothesis can fail or be mimicked by artifacts.
     - **Extrapolation boundary:** where the hypothesis should not be generalized.
   - Rank hypotheses by falsifiability and by whether they predict non-monotonic or trade-off behavior.
   - **Gate:** If no hypothesis can be falsified with available methods, redesign the question or stop.

3. **Design discriminating validation**
   - Define comparison groups:
     - **Baseline:** the reference system without the proposed intervention.
     - **Intervention:** the candidate configuration.
     - **Negative control:** a variant lacking the proposed active feature.
     - **Positive/benchmark control:** a known effective configuration, when appropriate.
     - **Orthogonal control:** an alternative that isolates subsystem contributions when full-system results are ambiguous.
   - Select metrics before data collection:
     - **Primary metrics:** performance or functional outcomes tied to the bottleneck.
     - **Mechanism metrics:** structural, chemical, morphological, or interfacial diagnostics that can distinguish pathways.
     - **Robustness metrics:** variability, stability, or stress-response indicators.
   - Pre-register decision rules stating what evidence supports, weakens, or refutes each hypothesis.
   - **Gate:** If controls cannot isolate the proposed mechanism from confounders, redesign before proceeding.

4. **Collect multi-modal evidence**
   - Gather primary and mechanism-diagnostic data under comparable conditions across all groups.
   - Record complete metadata, batch identifiers, environmental context, and processing history.
   - **Gate:** If data integrity checks fail, controls are invalid, or safety constraints are violated, pause and repair.

5. **Analyze mechanism versus artifact**
   - Compare baseline, intervention, and controls on the same footing.
   - Verify that the intervention improves the stated bottleneck rather than only an isolated headline metric.
   - Match observables to the proposed mechanism; catalog alternative explanations such as side reactions, processing variation, measurement artifacts, or unmodeled interfaces.
   - Update the evidence strength of each hypothesis based on the full evidence set.
   - **Gate:** If mechanism metrics contradict performance metrics, label the result inconclusive and return to Step 3.

6. **Discriminate and update**
   - **Convergent evidence:** If performance and mechanism metrics align, strengthen the hypothesis, narrow the boundary, and plan a boundary-condition or scale test.
   - **Performance without mechanism:** If function improves but mechanism evidence is weak, redesign controls or add orthogonal diagnostics before claiming causality.
   - **Mechanism without performance:** If mechanism evidence appears but performance does not improve, re-evaluate whether the bottleneck was misidentified.
   - **Contradictory evidence:** If results oppose the hypothesis, reject or reformulate it, archive the negative result, and return to Step 2.
   - **Gate:** If no convergence is achieved after two full iterations, stop and reformulate the research question.

7. **Iterate or terminate**
   - Return to Step 2 or 3 with updated hypotheses and refined controls.
   - **Stop conditions:**
     - Safety-relevant anomalies or constraint violations.
     - Unresolvable confounding that prevents mechanism isolation.
     - Inability to distinguish signal from noise despite replication.
     - Hypothesis refutation with adequate controls.
     - Resource or scope limits reached without interpretable progress.

# Output Format

When using this skill, return:

1. **Research question and gap:** concise statement of the unresolved issue and its observable signature.
2. **Ranked hypotheses:** mechanistic claims with evidence strength, key assumptions, predicted observables, likely failure modes, and boundaries.
3. **Validation design:** baseline, controls, variables, metrics, decision rules, and stop conditions.
4. **Analysis plan:** data-integrity checks, mechanism-artifact separation logic, uncertainty handling, and visualization strategy.
5. **Iteration log:** current evidence state, update decision, and next-step rationale.
6. **Claim boundaries and validity notes:** confounders, reproducibility requirements, and limits of extrapolation.

# Validation Gates

- **Control adequacy:** Baseline and controls must isolate the intended factor; otherwise claims are exploratory only.
- **Metric balance:** Claims must not rest on a single metric while ignoring trade-offs or degradation in other properties.
- **Reproducibility:** Metadata, processing history, and decision rules must be recorded sufficiently for independent verification.
- **Mechanistic coherence:** Multi-modal evidence must converge on the same explanation; divergent signals require redesign.
- **Statistical validity:** Replication, variance, and uncertainty must be reported and matched to the experimental structure.

# Claim Boundaries

- Do not treat a single study or source as field consensus.
- Limit causal claims to the tested system, scale, and conditions.
- Distinguish paper-supported method patterns from new inferences generated by the agent.
- Avoid extrapolation to untested chemistries, material sources, environments, or operating regimes.
- Label analogical, provisional, or low-evidence hypotheses explicitly.

# Failure Modes

- **Confounding:** Uncontrolled processing, environmental, or measurement variables masquerade as mechanism effects.
- **Single-metric illusion:** Improvement in one metric masks degradation in another, producing a false net benefit.
- **Mechanism misattribution:** Inadequate controls lead to assigning causality to the wrong structural or interfacial feature.
- **Overgeneralization:** A result valid in a narrow design window is extended beyond tested boundaries.
- **False convergence:** Batch variability or measurement artifacts create apparent agreement between performance and mechanism metrics.
- **Premature termination:** A boundary condition or negative result is ignored because early-cycle data appeared favorable.

# Validity Checks

Before presenting any plan or conclusion, verify:

- The research question, bottleneck, and mechanism are clearly and observably defined.
- Each hypothesis has explicit falsification criteria and a labeled evidence strength.
- Controls are sufficient to separate the proposed mechanism from artifacts and confounders.
- Both primary performance and mechanism-specific diagnostics are predefined.
- Confounders are addressed through controls, randomization, or explicit caveats.
- Evidence strength is updated after each iteration and distinguished from prior literature.
- Safety, compliance, and resource constraints are acknowledged at a non-operational level.
- Another researcher could understand what evidence would support or refute each hypothesis.

# Provenance

- Synthesized from cluster 21, subcluster 21.1.
- Source skills: bamboo-fiber-concrete-research-workflow; sustainable-earth-composite-research; aqueous-zinc-ion-battery-research-workflow; cementitious-fiber-reinforcement-research-design; hybrid-composite-research-exploration; solid-state-lithium-sulfur-cathode-research-pattern; lithium-battery-binder-exploration; lithium-metal-electrolyte-research-workflow.
- Preserves shared method patterns for mechanism discovery and validation, not paper-specific conclusions or operational protocols.
