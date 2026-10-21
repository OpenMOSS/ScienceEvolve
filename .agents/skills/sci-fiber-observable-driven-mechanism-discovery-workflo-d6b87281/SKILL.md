---
name: sci-fiber-observable-driven-mechanism-discovery-workflo-d6b87281
description: A reusable end-to-end workflow for designing research plans that discover and validate coupled reaction-transport-interface mechanisms through layered hypotheses, strong controls, and multi-modal evidence triangulation.
scienceevolve-title: "Fiber composites and battery materials · observable driven mechanism discovery workflow 8"
scienceevolve-area: fiber-composites-and-battery-materials
---

## Purpose

Help an agent convert a performance shortfall in a coupled materials or electrochemical system into a testable, mechanism-driven research plan. The workflow guides bottleneck diagnosis, hypothesis generation, minimal validation design, evidence-chain analysis, and iterative refinement without prescribing specific materials, recipes, or operational protocols.

## When to use

Use this workflow when the user asks to:

- Generate new research questions for systems where reaction, transport, and interfacial processes are coupled.
- Design validation plans for candidate architectures, coatings, scaffolds, additives, or functional layers.
- Evaluate whether an intervention improves performance through a coherent mechanism or through confounding artifacts.
- Build an evidence chain from component-level mechanism to full-system validation.
- Diagnose why a coupled system improves or fails after introducing a new functional component.

Do not use this workflow as a substitute for laboratory safety review, institutional approval, or domain-specific certification.

## Inputs required

Before producing a research plan, request or infer:

- **Target system**: the active materials, interfaces, and device configuration under study.
- **Dominant bottleneck**: the coupled degradation or limitation mode (e.g., uncontrolled species transport, interfacial instability, kinetic mismatch, mechanical failure).
- **Candidate intervention**: the proposed modifier, architecture, or process change and its expected primary and secondary functions.
- **Available evidence**: prior experiments, characterization data, modeling, or literature precedent.
- **Constraints**: safety boundaries, equipment limits, measurement availability, environmental considerations, and target validation level.
- **Success criteria**: what would count as meaningful, mechanism-supported improvement in the user's context.

## Core Workflow

Follow this ordered route. Treat each stage as a gate; do not advance until the previous gate is satisfied or explicitly bypassed with documented risk.

### Stage 1: Bottleneck Diagnosis

1. Frame the problem as a coupled reaction–transport–interface bottleneck, not as a generic performance gap.
2. Identify the mobile species, intermediate, or transformable entity that links multiple failure modes.
3. Separate verified observations from inferred mechanisms and label their evidence strength.
4. **Stop/Go**: If the bottleneck cannot be defined in mechanistic terms, stop and request clarification.

### Stage 2: Layered Hypothesis Generation

Generate hypotheses in this order:

1. **Bottleneck hypothesis**: State which process limits the system and why.
2. **Mechanism hypothesis**: Propose how the intervention changes the bottleneck (e.g., adsorption balance, transport regulation, interfacial stabilization, kinetic compatibility).
3. **Transformation hypothesis**: Predict how species move, convert, or redistribute between components.
4. **System-level hypothesis**: Predict how component-level changes combine into full-system behavior.
5. **Failure-boundary hypothesis**: Predict where the design may fail (e.g., excessive binding, passivation, parasitic reactions, mechanical degradation).

For every hypothesis, record:

- Evidence strength (`strong` / `moderate` / `weak` / `speculative`).
- Key assumptions.
- Minimal falsification test.
- Predicted observations across at least two independent measurement types.
- Likely failure modes.

### Stage 3: Minimal Viable Validation Design

Design the smallest set of experiments that can falsify the central mechanism:

1. **Baseline diagnosis**: Confirm dominant degradation modes with a matched reference.
2. **Primary-function test**: Isolate whether the intervention improves the targeted reaction or transport step.
3. **Secondary/coupling test**: Check whether the intervention generates secondary effects (e.g., interphase formation, counter-component stabilization) required for the full-system claim.
4. **Control hierarchy**:
   - Negative control: unmodified baseline.
   - Process control: matched processing without the key functional feature.
   - Structural/material control: similar morphology or support without the proposed chemistry.
   - Single-function control: isolates primary versus secondary contributions where feasible.
   - Positive control: a relevant benchmark only when it matches the target chemistry and validation level.
5. **Evaluation metrics**: Define primary performance, mechanistic, interfacial, transport, stability, and failure metrics before data collection.
6. **Stop conditions**: Define criteria to halt or redesign (e.g., one-sided improvement with coupled worsening, gains disappearing under matched constraints, irreproducibility, uncontrolled parasitic processes).

### Stage 4: Multi-Modal Evidence Collection

Collect evidence across independent streams:

- Structure and morphology.
- Chemical state and composition.
- Kinetics and rate behavior.
- Transport and impedance.
- Device- or system-level performance under realistic constraints.
- Mechanical or durability behavior, if relevant.

Use multiple timescales or protocols to distinguish surface-limited, transport-limited, and artifact-prone behavior.

### Stage 5: Evidence-Chain Analysis

1. Verify comparability: check normalization, loading, contact quality, and protocol consistency.
2. Separate performance from mechanism: improved cycling or yield alone does not prove the proposed mechanism.
3. Triangulate: accept a mechanism claim only when at least two independent evidence streams converge.
4. Map evidence to hypotheses: strengthen, weaken, or reject each hypothesis based on controls and diagnostics.
5. Quantify uncertainty: report replicate spread, batch variability, and conditions where the conclusion may not hold.
6. Classify claims: label each conclusion as direct observation, control-supported inference, model-supported inference, literature analogy, or speculative extension.

### Stage 6: Decision Gate & Iteration

Apply these gates in order:

- **Gate A (Mechanism)**: If mechanism-level evidence contradicts the hypothesis, weaken or reject the mechanism claim before proceeding.
- **Gate B (Performance)**: If performance gains disappear under fair normalization or strong controls, stop and redesign the intervention.
- **Gate C (System)**: If component-level improvements do not translate to full-system behavior, rebalance architecture or revise the coupling hypothesis.
- **Gate D (Durability)**: If stability, reproducibility, or boundary-condition tests fail, treat the result as a limiting boundary, not a footnote.

**Iteration rules**:

- If the intervention improves one component but worsens another, decouple the architecture or stop.
- If mechanism evidence is absent despite performance gains, add discriminating diagnostics before claiming causality.
- If controls match the integrated design, narrow the claim to the supported function.
- If practical stress tests fail, redesign the coupled system rather than optimizing a single metric.
- If results are irreproducible across batches, fix comparability before generalizing.

### Stage 7: Documentation & Output

Compile the research plan and findings into the structured format defined in **Output Format**. Include an explicit evidence boundary statement separating source-inspired reasoning from new-system inference.

## Output Format

Return results in this structure:

1. **Research question**
   - Concise question.
   - Coupled bottleneck.
   - Candidate intervention class.

2. **Hypothesis table**
   - Hypothesis.
   - Evidence strength.
   - Key assumptions.
   - Minimal falsification test.
   - Likely failure mode.

3. **Experimental design**
   - Minimal viable validation plan.
   - Variables.
   - Control hierarchy.
   - Evaluation metrics.
   - Stop conditions.

4. **Analysis plan**
   - Evidence chain.
   - Confounder checks.
   - Reproducibility checks.
   - Boundary conditions.

5. **Iteration decision**
   - Result patterns that support, weaken, or redirect the hypothesis.
   - Next smallest discriminating experiment.

6. **Evidence boundary statement**
   - Clear separation of verified observations, inferred mechanisms, and speculative extensions.

## Validation Gates

Before advancing past any stage, confirm:

- The bottleneck is expressed in mechanistic, not metric-only, terms.
- Every key assumption has an associated falsification test.
- Controls are sufficient to separate chemistry from morphology, transport from kinetics, and primary from secondary effects.
- Metrics are predefined and span performance, mechanism, and failure modes.
- Stop conditions are defined before data collection.

## Claim Boundaries

- Do not present single-source observations as field-wide consensus.
- Do not extrapolate from one material family, device format, or operating regime to all related systems.
- Distinguish verified observations from inferred mechanisms and from speculative extensions.
- Treat literature comparisons as contextual, not as proof of performance for the new system.
- Limit claims to the tested boundary conditions (chemistry, loading, electrolyte class, temperature, cycling regime, or stress protocol).

## Failure Modes

- **Mechanism mismatch**: The intervention improves a metric through an artifact (e.g., added mass, surface area, conductivity, wetting) rather than the proposed mechanism.
- **Coupling breakdown**: Component-level gains do not translate to full-system performance because secondary bottlenecks dominate.
- **Over-binding / passivation**: Excessive interfacial interaction blocks transport or passivates active sites.
- **Uncontrolled parasitics**: Side reactions, dissolution, or irreversible depletion masquerade as reversible improvement.
- **Irreproducibility**: Batch variability, fabrication sensitivity, or measurement artifacts undermine the evidence chain.
- **Boundary violation**: Performance depends on narrow conditions that are not representative of the target application.

## Validity Checks

Before finalizing a research plan or conclusion, check:

- Does the hypothesis explain both component-level and system-level observations?
- Are claims supported by separate controls for each proposed function?
- Are normalization, loading, porosity, wetting, and protocol history matched across comparisons?
- Is there a falsification test for every key assumption?
- Are negative, ambiguous, or non-reproducible outcomes reported transparently?
- Are failure modes and boundary conditions stated explicitly?
- Are safety, ethics, and compliance constraints respected?

## Provenance

- Derived from cluster 15.0 (observable-driven mechanism discovery and validation).
- Synthesized from source skills: `li-s-coupled-interphase-exploration`, `sulfide-photocatalyst-research-design`, `conductive-separator-battery-research`, `adsorption-catalysis-deposition-battery-design`, `lig-flexible-zn-s-battery-exploration`, `porous-electrode-ion-transport-exploration`, `green-dense-fluid-fiber-uv-design`, `kinetics-compatible-hybrid-capacitor-exploration`.
- Source-specific materials, parameters, and conclusions have been abstracted; only the shared workflow route is retained.
