---
name: sci-polymer-conductive-interface-polymer-mechanism-disc-80ccdb15
description: A reusable end-to-end workflow for proposing, validating, and iterating mechanism-driven hypotheses in composite, polymer, conductive, and interfacial material systems using paired global and local observables with strong controls.
scienceevolve-title: "Polymer composites and vitrimers · conductive interface polymer mechanism discovery workflow"
scienceevolve-area: polymer-composites-and-vitrimers
---

# Purpose

Guide agents in designing transferable, mechanism-driven research plans for composite, polymer, hybrid, and interfacial material systems. The workflow emphasizes observable-driven discovery: linking architecture, constituents, and interfaces to macroscopic responses through falsifiable hypotheses, controlled validation, and converging evidence, without treating any single study as field consensus.

# When to use

Use this skill when the task involves:

- Generating new research questions for fiber-reinforced, particulate, or hybrid composites; polymer networks; conductive networks; or mineral-polymer interfaces.
- Designing studies that connect material architecture, loading path, or environmental exposure to mechanical, transport, electrical, thermal, or binding responses.
- Discriminating among candidate failure, sensing, transport, or interfacial mechanisms using experiments, simulations, or coupled methods.
- Iterating hypotheses after mismatches between predicted and observed global or local behavior.

Do not use this skill as a substitute for certified structural design, deployment qualification, regulatory assessment, or hands-on safety review.

# Inputs required

Ask the user or environment for:

1. **Target system class**: material family, reinforcement or filler architecture, matrix or continuous phase, and interfacial strategy.
2. **Observable response**: the global or local behavior to explain, predict, or improve (e.g., stiffness loss, resistance change, damage morphology, interfacial binding, thermal response).
3. **Candidate mechanisms**: plausible physical or chemical explanations involving constituents, interfaces, defects, or architecture.
4. **Available validation routes**: experiments, simulations, imaging, spectroscopy, or multiscale methods accessible for the plan.
5. **Constraints**: safety limits, environmental boundaries, regulatory context, non-destructive requirements, and reproducibility standards.
6. **Decision need**: whether the priority is hypothesis generation, minimal validation, sensitivity screening, model revision, or experimental design.

# Core Workflow

Follow this ordered end-to-end route. Treat each numbered step as a stage; treat bullet gates as decision points that may trigger iteration or stop conditions.

1. **Define the observable gap**
   - State the target response and identify why current understanding is insufficient for the architecture or loading regime of interest.
   - Bound the claim scope to the specific material class, geometry, and environment under consideration.

2. **Map candidate mechanisms**
   - Link architecture, constituent properties, interface state, and loading path to the observable response.
   - Separate competing explanations (e.g., bulk-dominated vs. interface-dominated, reversible vs. irreversible, global vs. local).
   - Identify confounders that could mimic the target mechanism.

3. **Generate tiered, falsifiable hypotheses**
   - For each candidate mechanism, produce a hypothesis card containing:
     - Mechanism statement
     - Predicted global and local signatures
     - Evidence strength label (high / medium / low)
     - Key assumptions
     - Likely failure modes for the hypothesis
     - Discriminating test or observable
   - **Gate A — Discriminability**: If hypotheses predict identical signatures, return to Step 2 and refine the mechanism map until they are separable by at least one control or local observable.

4. **Design a minimal viable validation plan**
   - Select one primary global response metric and at least one independent local, morphological, or field-level observable.
   - Define a compact variable set; vary one mechanism-relevant family at a time while holding unrelated variables constant.
   - Specify controls:
     - Baseline (system without the proposed mechanism)
     - Negative control (expected to suppress the mechanism)
     - Positive or benchmark control (expected to express the mechanism, if available)
     - Mechanism-isolation control (preserves one interaction while removing another)
   - Define stopping conditions before data collection:
     - Controls fail to behave as expected.
     - Uncertainty or variability dominates the effect size.
     - Safety or ethical boundaries are reached.
     - The model cannot represent key chemistry or physics.
   - **Gate B — Observable pairing**: If the plan lacks an independent local observable paired with the global metric, redesign before proceeding.
   - **Gate C — Control adequacy**: If controls cannot reject alternative explanations, add mechanism-isolation or boundary-condition controls.

5. **Execute and preprocess**
   - Run the experiment or simulation under the defined plan.
   - Verify data integrity (units, coordinate systems, boundary conditions, synchronization across streams, missing data).
   - Assess convergence or repeatability without interpreting mechanism validity.

6. **Analyze with converging evidence**
   - Compare global response trends across conditions.
   - Compare local evidence (morphology, fields, spatial correlation, damage sequence) against mechanism predictions.
   - Quantify sensitivity of responses to architecture, interface, defect, loading, or boundary assumptions.
   - Label evidence as directly observed, model-supported, inferred, or speculative.
   - **Gate D — Convergence**: If global and local evidence conflict, do not accept the hypothesis. Iterate to Step 3 to revise the mechanism or to Step 4 to add discriminating observables.
   - **Gate E — Control behavior**: If controls fail or produce unexpected results, halt mechanism ranking until confounding is resolved.

7. **Rank mechanisms and bound claims**
   - Rank candidate mechanisms by coherence across global, local, and control evidence.
   - State extrapolation boundaries explicitly (material class, architecture, loading regime, rate, environment, scale).
   - **Gate F — Robustness**: If the effect is not reproducible or is dominated by uncontrolled variability, stop and prioritize uncertainty reduction over broader claims.

8. **Iterate or escalate**
   - If the mechanism is supported: propose a generalization test (different architecture, constituent, or scale) or escalate to higher-fidelity validation.
   - If the mechanism is weak or invalidated: reformulate the hypothesis, narrow the boundary, or discard the candidate.
   - **Stop condition**: Terminate the workflow if any stopping condition from Step 4 is triggered, if safety/ethical limits are reached, or if the hypothesis cannot be discriminated from artifacts.

# Output Format

When using this skill, produce:

1. **Research question and gap**: concise statement of the target behavior and why understanding is insufficient.
2. **Mechanism map**: candidate mechanisms with predicted global and local signatures.
3. **Hypothesis cards**: mechanism, predicted signatures, evidence strength, key assumptions, likely failure modes, and discriminating validation for each hypothesis.
4. **Minimal validation plan**: primary and local observables, variables, controls, metrics, and stopping conditions.
5. **Analysis plan**: data integrity checks, global-local comparison, sensitivity analysis, uncertainty treatment, and evidence grading.
6. **Iteration decision tree**: rules for updating, rejecting, narrowing, or escalating hypotheses based on possible results.
7. **Validity and boundary statement**: confounders, reproducibility requirements, extrapolation limits, and safety constraints.

# Validation Gates

- **Gate A (Discriminability)**: Hypotheses must be separable by at least one control or local observable before validation proceeds.
- **Gate B (Observable pairing)**: Every validation plan must pair a global metric with an independent local or morphological observable.
- **Gate C (Control adequacy)**: Controls must be capable of rejecting alternative explanations; if not, redesign.
- **Gate D (Convergence)**: Global and local evidence must point to the same mechanism; divergence triggers revision.
- **Gate E (Control behavior)**: Controls must behave as expected; unexpected control results halt mechanism ranking.
- **Gate F (Robustness)**: Claims require reproducible effects beyond uncontrolled variability; otherwise, reduce uncertainty first.

# Claim Boundaries

- Limit conclusions to the tested material class, architecture, loading regime, and environmental conditions.
- Distinguish paper-supported findings, model-supported inferences, and agent-inferred extensions from speculative extrapolations.
- Do not treat a single study or simulation as field-wide consensus.
- Do not present unvalidated research plans as certification, deployment approval, or operational performance guarantees.
- Avoid claiming macroscopic application performance from subsystem or molecular-scale evidence alone without staged validation.

# Failure Modes

- **Confounded architecture**: Multiple variables change simultaneously, preventing causal attribution.
- **Non-unique signatures**: Different mechanisms produce indistinguishable global or local observables.
- **Control failure**: Baseline or negative controls behave unexpectedly, indicating hidden variables or artifacts.
- **Scale-transfer breakdown**: Mechanism inferred at one scale lacks relevance at the target scale.
- **Overfitting to limited observables**: A model or hypothesis is accepted because it fits one curve but fails on independent local evidence.
- **Irreproducibility**: High variability from processing, boundary conditions, or measurement noise masks the mechanism.
- **Premature extrapolation**: Claims extend beyond the validated architecture, constituent set, or loading regime.

# Validity Checks

Before finalizing a research plan, verify:

- **Confounding**: Are architecture, interface, defect, loading, and environmental variables separable?
- **Reproducibility**: Are material sourcing, processing descriptions, calibration, data-processing rules, and exclusion criteria documented for independent replication?
- **Statistical validity**: Are replicates, uncertainty estimates, outlier handling, and stopping rules defined before data collection?
- **Mechanistic validity**: Does the proposed mechanism predict both the global response and the local failure or property sequence?
- **Extrapolation boundary**: Are claims explicitly bounded to the tested system and regime?
- **Evidence boundary**: Are source-paper findings, model outputs, and new inferences clearly labeled and not conflated?
- **Safety boundary**: Are hazardous, destructive, or high-risk procedures kept at a non-operational design level pending qualified human review?

# Provenance

Synthesized from cluster 31, subcluster 31.0. Derived from source skills: hybrid-composite-research-design, composite-kink-band-research-workflow, composite-compression-mechanics-workflow, hybrid-composite-structure-property-design, interface-md-research-design, woven-composite-electromechanical-research, high-performance-reprocessable-composites-research-workflow, flame-retardant-coating-composite-design.
