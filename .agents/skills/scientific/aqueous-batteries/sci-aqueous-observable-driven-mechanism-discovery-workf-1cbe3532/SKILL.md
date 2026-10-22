---
name: sci-aqueous-observable-driven-mechanism-discovery-workf-1cbe3532
description: Use this skill when transforming observable performance bottlenecks into structured, evidence-aware research plans for mechanistic discovery and validation in materials and electrochemical systems.
scienceevolve-title: "Aqueous battery interfaces · observable driven mechanism discovery workflow 4"
scienceevolve-area: aqueous-battery-interfaces
---

## Purpose

This skill guides an agent through an end-to-end workflow to discover, discriminate, and validate mechanistic hypotheses starting from observable performance limitations. It converts ambiguous degradation or suboptimal behavior into falsifiable claims, control-rich validation plans, causal-chain analysis, and bounded conclusions without reproducing single-study results or operational protocols.

## When to use

Use this skill when the user needs to:

- Propose new research questions for systems limited by unclear interfacial, transport, structural, or coupled failure modes.
- Design controlled studies that link a candidate modification to a specific mechanism rather than to generic performance gains.
- Analyze multi-scale data to test whether predicted signatures converge across orthogonal measurements.
- Iterate hypotheses based on supportive, ambiguous, or contradictory evidence.
- Bound claims to tested conditions and distinguish evidence from inference.

Do not use this skill to provide executable experimental recipes, hazardous operational protocols, safety-critical deployment assessments, or to treat any single study as field-wide consensus.

## Inputs required

Before executing the workflow, identify or request:

- **System context:** active materials, electrolyte or medium class, electrode geometry, and device configuration.
- **Dominant failure mode:** observable degradation such as nonuniform deposition, side reactions, interfacial instability, transport limitation, phase evolution, or mechanical failure.
- **Candidate mechanistic levers:** tunable variables that may alter local environment, structure, or transport (e.g., additive chemistry, architecture, coordination environment).
- **Available capabilities:** characterization, modeling, and electrochemical evaluation methods accessible for validation.
- **Candidate controls:** unprotected baselines, component-isolated controls, mechanism-negative variants, and structure-matched references.
- **Evaluation constraints:** safety boundaries, reproducibility requirements, acceptable stopping criteria, and scope of generalization.
- **Evidence state:** what is known from literature, what is inferred, and what remains untested.

## Core Workflow

Execute the following steps in order. Treat each decision gate as a hard stop until the criterion is satisfied.

### 1. Bottleneck Diagnosis
Start from observable degradation. Infer whether the primary limitation originates at an interface, in the bulk, or from coupled device-level effects.
- **Decision gate:** Can the bottleneck be localized to a specific component or process? If not, stop and gather additional observables before hypothesizing.

### 2. Mechanism Hypothesis Generation
Generate competing, falsifiable hypotheses that connect a candidate lever to the bottleneck. For each hypothesis specify:
- Predicted signatures at multiple scales (molecular, interfacial, morphological, device).
- Evidence strength (high / medium / low / speculative).
- Key assumptions and most likely failure modes.
- Minimum viable test and strongest discriminating control.
- **Decision gate:** Does every hypothesis predict at least one unique signature that can be contradicted? If not, reformulate.

### 3. Control-Rich Experimental Design
Design a minimal viable validation hierarchy:
- **Baseline:** unmodified system under matched conditions.
- **Negative / mechanism-negative:** variant lacking the proposed active feature but structurally similar.
- **Component / single-function:** isolates contributions of individual modules.
- **Contrast / specificity:** chemically similar but functionally distinct variant.
- **State-dependent:** samples at as-prepared, intermediate, and post-test stages.
Define independent variables, dependent variables, primary mechanism metrics, primary performance metrics, and predefined stopping conditions.
- **Decision gate:** Do controls isolate a single mechanistic variable? If confounding variables are bundled, redesign before proceeding.

### 4. Orthogonal Evidence Collection
Collect at least two independent evidence types for each mechanism claim (e.g., structural probe + transport measurement, or interfacial characterization + electrochemical signature).
- **Decision gate:** Is at least one direct mechanism indicator measured alongside performance? If only performance data exist, pause and add diagnostics.

### 5. Causal-Chain Analysis
Reconstruct the pre-registered causal chain: composition/structure → local environment → mechanism → morphology/transport → performance.
- Check consistency across all evidence types.
- Use controls to separate specific chemical/structural contributions from generic effects (coverage, roughness, conductivity, viscosity).
- Quantify uncertainty from replicates, batch variation, and normalization sensitivity.
- **Decision gate:** Do all links in the causal chain point in the same predicted direction? If inconsistent, diagnose the weak link before iterating.

### 6. Mechanism Discrimination & Claim Bounding
Compare the candidate against all controls:
- If the mechanism-negative control matches the candidate, reject the specific mechanism and search for confounders.
- If the single-function control matches the synergistic design, downgrade synergy claims to dominant-module improvement.
- Bound all claims to the tested system, configuration, and operating window.
- **Decision gate:** Has the hypothesis survived baseline, component, and contrast controls? If not, do not escalate validation.

### 7. Iteration or Redesign
Classify the outcome and act:
- **Supported:** predicted performance and mechanistic signatures converge. Narrow the design rule and escalate to stronger validation (full-system, harsher conditions).
- **Partially supported:** performance changes but mechanism is ambiguous. Split the explanation into separate sub-mechanisms and add discriminating controls.
- **Contradicted:** predicted signature is absent or opposite. Reject the current hypothesis, archive the failure mode, and propose an alternative bottleneck.
- **Inconclusive:** controls are insufficient or data are noisy. Improve normalization, replication, or diagnostics before adding complexity.
- **Decision gate:** Has the leading mechanism survived minimal viable validation with matched comparisons? If no, do not broaden the claim.

### 8. Final Synthesis & Archiving
Compile:
- Evidence table mapping each hypothesis to supporting, contradictory, and missing data.
- Updated mechanism model and refined design rules.
- Documented rejected hypotheses with reasons for failure.
- Explicit boundary statement limiting generalization to tested conditions.
- **Decision gate:** Are all claims labeled with their evidence strength and applicable scope? If not, narrow or qualify the conclusion.

## Output Format

Return the research plan in this structure:

1. **Research question:** Concise question framed around a bottleneck and a testable mechanism.
2. **Bottleneck map:** Suspected limitation, rationale, and uncertainty level.
3. **Hypothesis set:** For each hypothesis—statement, evidence strength, key assumptions, predicted signatures, likely failure mode, and minimum viable test.
4. **Experimental design matrix:** Baseline, candidate, negative controls, component controls, contrast controls, state-dependent samples; independent/dependent/controlled variables; metrics; and stop conditions.
5. **Analysis plan:** Causal chain, orthogonal evidence requirements, control interpretation, uncertainty handling, and evidence-to-hypothesis mapping.
6. **Iteration plan:** Decision rules for supported, partially supported, contradicted, and inconclusive outcomes.
7. **Validity and boundary statement:** Confounders, reproducibility needs, operating boundaries, and limits of generalization.

## Validation Gates

Before advancing past any workflow step, confirm:

- **Gap validity:** The question addresses a real bottleneck, not only a fashionable motif.
- **Mechanism validity:** The proposed mechanism has independent, discriminating evidence.
- **Control validity:** Controls can separate the target mechanism from nonspecific structural, chemical, or processing effects.
- **Metric validity:** Performance metrics are paired with mechanism and failure diagnostics.
- **Reproducibility validity:** Trends are supported by repeated samples or batches with transparent variability reporting.
- **Boundary validity:** Claims are scoped to the tested system, configuration, and conditions.
- **Consensus validity:** Single-study findings are not presented as established field consensus.
- **Safety validity:** The plan remains at a non-operational design level and avoids executable high-risk parameters.

## Claim Boundaries

- Limit mechanistic claims to the specific materials, geometries, and operating windows tested.
- Distinguish directly measured observations from inferred causal links and model-dependent estimates.
- Do not extrapolate from half-cell or symmetric-cell behavior to full-device stability without direct validation.
- Do not generalize from one candidate family to an entire materials class without testing the causal mechanism across representatives.
- Label every claim with its evidence strength and state whether it is supported by literature, inferred by the agent, or untested.

## Failure Modes

Common ways this workflow or the underlying research plan can fail:

- **Misattribution:** Performance changes arise from uncontrolled variables (pH, viscosity, loading, contact resistance, impurities) rather than the proposed mechanism.
- **Over-regulation:** A candidate improves one metric while degrading transport, reversibility, or stability.
- **Cell-format mismatch:** Interface-level gains observed in simplified cells do not transfer to application-relevant configurations.
- **Mechanism inconsistency:** Orthogonal evidence types conflict; for example, structural signatures appear but electrochemical behavior contradicts the predicted trend.
- **Insufficient controls:** The experimental matrix cannot distinguish a specific chemical effect from a generic physical effect.
- **Premature extrapolation:** Claims are broadened beyond tested boundaries before harsher-condition or full-system validation.

## Validity Checks

Before finalizing any plan or conclusion, verify:

- **Confounding controls:** Are geometry, loading, normalization, and evaluation methods matched across comparisons?
- **Mechanism specificity:** Is there a contrast control that distinguishes the proposed chemistry/structure from a generic physical effect?
- **State dependence:** Are as-prepared, intermediate, and post-test states compared where relevant?
- **Reproducibility:** Are key comparisons repeated or accompanied by variability estimates? Are failed runs documented?
- **Statistical validity:** Are uncertainty ranges reported, models appropriately simple, and benchmarks normalized consistently?
- **Boundary conditions:** Are conclusions limited to the relevant composition range, temperature, device format, and operating regime?
- **Evidence labeling:** Are source-supported observations separated from new-agent inferences and speculative extensions?

## Provenance

Synthesized from cluster 48, subcluster 48.0 (observable-driven mechanism discovery and validation). Source skills: interfacial-flux-regulation-research, aqueous-zib-architecture-electrolyte-cooptimization, zn-anode-interface-exploration, wise-multiscale-electrolyte-research, porous-carbon-energy-storage-exploration, layered-solid-electrolyte-discovery, azib-hydrogel-interphase-research, interfacial-network-guided-aqueous-zinc-battery-research.
