---
name: sci-urban-observable-driven-evidence-audit-workflow-bc339acf
description: A reusable end-to-end workflow for designing, validating, and auditing evidence-based claims in environmental and infrastructure simulation studies, from hypothesis generation through layered analysis to claim bounding and iteration.
scienceevolve-title: "Urban hazard resilience · observable driven evidence audit workflow"
scienceevolve-area: urban-hazard-resilience
---

# Purpose

Provide a transferable research workflow that moves from an observed or simulated environmental/infrastructure problem to an auditable, bounded claim. The pattern emphasizes mechanism-based hypothesis generation, controlled validation design, layered evidence analysis, and explicit claim bounding. It is abstracted from domains including wind energy, urban flood, stormwater control, building ventilation, wake transport, and resilient infrastructure systems.

# When to use

- Formulating research questions about coupled environmental-engineering systems where simulation, observation, or controlled experiment provides the primary evidence.
- Designing validation studies that compare candidate interventions, configurations, or policies against strong baselines and negative controls.
- Auditing whether an observed improvement in an intermediate or aggregate metric truly supports the claimed mechanism.
- Iterating a research plan after mixed, null, or contradictory results.
- Bounding the generalizability of simulation-based or observation-based claims before treating them as consensus or operational guidance.

# Inputs required

- **Research target:** the specific decision, design bottleneck, or mechanism to be tested.
- **System definition:** topology, assets, boundaries, and relevant physical or social subsystems.
- **Driver definitions:** environmental forcings, boundary conditions, or operational scenarios.
- **Available evidence:** datasets, simulation outputs, literature benchmarks, or observational records.
- **Candidate hypotheses:** proposed mechanisms linking controllable variables to outcomes.
- **Baselines and controls:** passive, conventional, fragmented, or null configurations for comparison.
- **Evaluation priorities:** performance metrics, robustness criteria, and computational or logistical constraints.
- **Safety and ethics context:** non-operational scope, stakeholder boundaries, and data sensitivity.

# Core Workflow

1. **Scope and gap definition**
   - Define the research object as a coupled system (drivers, infrastructure, response capacity).
   - Identify the specific gap: what mechanism, interaction, or boundary condition is under-tested.
   - *Decision gate:* If the gap cannot be framed as a testable causal chain (driver → mediator → response), stop and reformulate.

2. **Causal mechanism mapping**
   - Map the full chain: external driver or observation → system state → intervention or action → physical response → service outcome → secondary consequence.
   - Identify mediating variables that must change for the downstream claim to hold.
   - *Decision gate:* If the mediator cannot be observed or simulated with available tools, mark the hypothesis as speculative and narrow the scope.

3. **Hypothesis generation and ranking**
   - Generate candidate hypotheses using mechanism prompts.
   - For each hypothesis record: evidence strength (high / medium / low), key assumptions, likely failure modes, boundary conditions, and whether it is source-supported or agent-inferred.
   - *Decision gate:* Discard hypotheses that are not falsifiable with a minimal viable validation given current constraints.

4. **Minimal validation design**
   - Define the unit of analysis and evaluation metrics, prioritizing intermediate mechanism metrics before system outcomes.
   - Establish controls: baseline, strong control, negative control, positive control, and ablation controls.
   - Specify scenarios: representative, out-of-sample, low-risk, compound or extreme, and uncertainty cases.
   - Define stop conditions before analysis: baseline validation fails, baselines are incomparable, or unsafe assumptions are required.
   - *Decision gate:* If the design cannot isolate the intended variable from confounders, redesign controls or narrow the question.

5. **Background state validation**
   - Validate environmental or system boundary conditions before interpreting interaction effects.
   - Check input consistency, plausibility, and alignment with independent observations or benchmarks.
   - *Decision gate:* If background validation fails, do not proceed to comparative analysis; revise inputs or scope.

6. **Layered evidence analysis**
   - **Layer 1 (Mechanism):** Compare intermediate metrics (coherence, flux, disturbance recovery, flow structure, state estimation quality) across controls.
   - **Layer 2 (System):** Compare downstream outcomes (load, performance, risk, connectivity) only after mechanism metrics are validated.
   - **Layer 3 (Decomposition):** Attribute changes to specific factors using ablations and sensitivity tests.
   - **Layer 4 (Uncertainty):** Examine variation across scenarios, model families, seeds, or parameter choices.
   - *Decision gate:* If intermediate metrics do not support the hypothesized mechanism, stop and diagnose whether the bottleneck is sensing, model fidelity, or a false mechanism.

7. **Claim strength classification**
   - Classify each hypothesis as: confirmed, partially confirmed, contradicted, or uninterpretable.
   - Label claim strength:
     - **Strong:** validated background, clear controls, mediator consistency, and sensitivity checks.
     - **Moderate:** clear trend but incomplete controls or sensitivity checks.
     - **Exploratory:** plausible mechanism but limited validation or narrow scope.
     - **Weak:** confounded, indirect, or outside the validated regime.
   - *Decision gate:* If evidence is scenario-specific, non-replicated, or dominated by unverified assumptions, stop escalation to policy or operational recommendations.

8. **Iteration and redesign**
   - Diagnose failure modes: environmental driver insufficient, mediator not dominant, confounding, scale mismatch, mean metric hiding fluctuation risk, model fidelity too low.
   - Update the hypothesis: narrow regime, add missing mediator, change evaluation metrics, or improve background validation.
   - Design the next minimal test tied to the specific failure mode.
   - *Iteration/stop condition:* Iterate only when the current mechanism is interpretable; otherwise return to Step 2 or 4. Stop if two successive cycles fail to resolve the bottleneck.

9. **Audit and boundary setting**
   - Document confounders, reproducibility needs, and extrapolation limits.
   - State the system type, driver regime, asset constraints, and decision context for which the claim is plausible.
   - Separate validated findings from speculative hypotheses and agent inferences.

# Output Format

1. **Scoped research question and causal chain.**
2. **Hypothesis table:** hypothesis, mechanism, evidence strength, key assumptions, failure modes, boundary conditions.
3. **Validation plan:** unit of analysis, controls, variables, scenarios, metrics, and stop conditions.
4. **Analysis record:** layer-by-layer results, ablation outcomes, sensitivity checks, and claim-strength classification.
5. **Iteration log:** failure mode diagnosis, hypothesis update, and next minimal test.
6. **Validity and boundary statement:** confounders, reproducibility requirements, generalization limits, and safety constraints.

# Validation Gates

- **Trigger fit:** the task involves environmental or infrastructure simulation/observation with a testable mechanism.
- **Comparability:** policies, designs, or scenarios use the same drivers, system representation, and metrics where appropriate.
- **Background validity:** environmental or boundary conditions are independently plausible before interaction effects are interpreted.
- **Control inclusion:** baseline, strong, negative, positive, and ablation controls are present where meaningful.
- **Mechanistic consistency:** changes in intermediate mediators explain changes in downstream outcomes.
- **Metric completeness:** both mean and fluctuating responses are considered when dynamic risk is relevant.
- **Scenario diversity:** results include representative, out-of-sample, low-risk, and compound cases.
- **Reproducibility:** data sources, preprocessing, scenario definitions, baselines, metrics, and random seeds are documented.

# Claim Boundaries

- Do not treat a single simulation study, city case, or scenario as field-wide consensus.
- Do not extrapolate beyond the tested environmental regime, system topology, model fidelity, or hazard severity without marking the claim as speculative.
- Do not present simulated risk reductions as guaranteed operational or public-safety outcomes.
- Distinguish source-supported mechanisms from agent-inferred extensions to new problems.
- Limit operational recommendations to decision-support level unless independent expert review and safety validation are explicitly included.

# Failure Modes

- Overfitting to training scenarios or historical events.
- Unrealistic forecast, boundary, or environmental assumptions.
- Hidden downstream or secondary consequences (risk shifting, coupled metric degradation).
- Confounding by model setup, scenario selection, or unequal testing windows.
- Aggregate metrics masking local failures or fluctuation risk.
- Scale mismatch between sensing, actuator, disturbance, and evaluation domains.
- Interpretability gaps preventing diagnostic use or safe oversight.
- Non-reproducible runs due to undocumented seeds, preprocessing, or stochastic settings.

# Validity Checks

- **Confounding:** isolate the intended variable; check for simultaneous changes in geometry, porosity, source location, boundary conditions, or governance context.
- **Spatial/temporal mismatch:** align scales of drivers, system states, and outcomes.
- **Model uncertainty:** compare at least two reasonable model families or assumptions when model dependence is central.
- **Statistical validity:** use repeated samples, ensembles, or uncertainty intervals appropriate to the claim.
- **Sensitivity:** assess resolution, sampling duration, parameter, and weighting sensitivities.
- **Equity and access:** consider vulnerable populations, unequal resource distribution, and stakeholder representation.
- **Safety and ethics:** keep outputs at research-design or decision-support level; avoid autonomous operational instructions or unsafe procedural details.

# Provenance

- Synthesized from cluster 14.1 (observable-driven evidence analysis and claim audit).
- Source skill references: coastal-stormwater-rtc-research-skill; urban-flood-road-resilience-exploration; urban-flood-integration-research; wind-lidar-control-research-workflow; transient-wake-research-explorer; active-flow-control-research-planner; wind-driven-ventilation-research-workflow; climate-resilient-shelter-exploration.
