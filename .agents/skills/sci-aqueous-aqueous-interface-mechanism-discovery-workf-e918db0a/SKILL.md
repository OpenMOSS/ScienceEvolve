---
name: sci-aqueous-aqueous-interface-mechanism-discovery-workf-e918db0a
description: An end-to-end, observable-driven workflow for discovering and validating interfacial mechanisms in aqueous electrochemical energy systems, from coupled-failure diagnosis through staged hypothesis testing, mechanism discrimination, and claim bounding.
scienceevolve-title: "Aqueous battery interfaces · aqueous interface mechanism discovery workflow"
scienceevolve-area: aqueous-battery-interfaces
---

## Purpose

This skill provides a reusable, end-to-end research workflow for interfacial mechanism discovery and validation in aqueous electrochemical systems. It guides an agent to convert observed degradation or performance gaps into falsifiable hypotheses, design staged validation studies with orthogonal controls, discriminate mechanisms from performance artifacts, and bound claims according to evidence strength. The workflow is methodological, not a material recipe or field consensus.

## When to use

Use this skill when the user asks to:
- Propose new research questions or hypotheses about aqueous electrochemical interfaces, including metal anodes, cathodes, separators, or electrolyte boundaries.
- Design validation plans for interfacial modifications intended to regulate ion transport, deposition morphology, side reactions, or stability.
- Interpret results where interface chemistry, roughness, transport, and durability may be confounded.
- Iterate on a failed or ambiguous interface hypothesis with updated controls or diagnostics.

Do not use this skill as a manufacturing guide, a source of executable hazardous procedures, or a claim that any single study represents universal behavior.

## Inputs required

Before executing the workflow, collect or infer:
- **Target system:** electrode and electrolyte family, cell configuration, and intended operating regime.
- **Dominant failure mode:** nonuniform deposition, corrosion, passivation, side reactions, transport limitation, mechanical degradation, or coupled failure loop.
- **Candidate intervention:** coating, additive, scaffold, separator modification, or field-regulation strategy.
- **Available evidence:** prior literature, preliminary data, simulation capability, and characterization access.
- **Constraints:** safety boundaries, environmental limits, reproducibility expectations, and acceptable validation depth.

If inputs are missing, state assumptions explicitly and mark resulting hypotheses as lower confidence.

## Core Workflow

Execute the following stages in order. Do not skip a stage unless its gate is explicitly passed.

### Stage 1: Coupled Failure Diagnosis
Map the degradation as an interconnected loop rather than isolated symptoms. Identify how surface defects, local flux concentration, roughening, parasitic reactions, and active-material loss reinforce one another. Isolate the dominant bottleneck and define the boundary conditions under which it operates.

- **Gate 1 – Clarity Gate:** If failure modes cannot be decoupled with available observables, stop and request additional diagnostic data before proceeding.

### Stage 2: Mechanism-First Hypothesis Generation
Generate ranked hypotheses using the causal template:  
`[Intervention] changes [interfacial property] through [mechanism], leading to [observable outcome] under [boundary condition].`

For each hypothesis record:
- Evidence strength (weak / moderate / strong / very strong).
- Key assumptions and predicted signatures.
- Likely failure modes and competing explanations.
- Minimal test needed to falsify it.

- **Gate 2 – Candidate Gate:** Proceed only if at least one hypothesis is falsifiable with the available experimental or simulation toolkit. If not, redesign the intervention concept or request additional methods.

### Stage 3: Staged Validation Design
Build a minimal viable validation ladder before expanding to large parameter matrices:
- **Level 1:** Interface formation and chemical stability.
- **Level 2:** Interfacial kinetics and side-reaction suppression.
- **Level 3:** Morphology evolution during operation.
- **Level 4:** Reversibility and cycling stability in simplified cells.
- **Level 5:** Performance in realistic full-cell or device contexts.
- **Level 6:** Post-operation diagnosis of interface retention and failure mode.

Define controls for each level:
- Baseline (unmodified).
- Negative / sham control (lacks proposed function).
- Mechanistic control (related interface lacking the target feature).
- Benchmark / positive control (known stabilizer, used only for interpretability).
- Process control (matched handling without key modification).

Define primary metrics aligned with the claim and pre-register stop conditions.

- **Gate 3 – Design Gate:** If controls cannot isolate the proposed mechanism from confounders (e.g., roughness, loading, processing history), redesign before execution.

### Stage 4: Mechanism Discrimination Execution
Advance through the validation ladder level by level. At each level:
1. Collect orthogonal evidence (chemical, structural, transport, morphological, electrochemical).
2. Compare intervention against all defined controls.
3. Decide whether the evidence supports, weakens, or falsifies the hypothesized mechanism link.

- **Gate 4a – Stability Gate:** If interface formation is irreproducible or chemically unstable, stop and redesign the formation chemistry.
- **Gate 4b – Functional Validation Gate:** If mechanism diagnostics contradict performance metrics (e.g., smoother morphology but worse kinetics), pause to identify confounders before advancing.
- **Gate 4c – Iteration Gate:** If results are ambiguous, add discriminating controls or targeted diagnostics rather than proceeding to higher levels.

### Stage 5: Data Integration and Analysis
Construct a hierarchical evidence map linking observables to mechanism claims:
- Molecular / functional motif → interface structure → local chemistry → transport / field behavior → deposition morphology → reversibility / lifetime.
- Label every claim as observed, simulated, inferred, or hypothesized.
- Require multimodal consistency; conflicting evidence must trigger mechanism revision, not selective reporting.
- Report batch variability, repeated-cell consistency, and uncertainty estimates when available.

### Stage 6: Iteration or Redesign
Based on the weakest link in the evidence chain, update the causal model:
- **If mechanism signal is absent:** Loop to Stage 2 to revise the hypothesis or to Stage 3 to redesign controls.
- **If performance improves without mechanism evidence:** Identify confounders (loading, area, electrolyte, counter-electrode) and loop to Stage 4 with stronger controls.
- **If side reactions or impedance worsen:** Revise interface chemistry or architecture and loop to Stage 3.
- **If durability fails:** Prioritize adhesion, mechanical compliance, or chemical stability before optimizing performance.
- **If full-cell gains disappear:** Reassess cell balance, separator, and mass-loading effects.

- **Stop Condition:** Terminate if the hypothesis is falsified, safety concerns arise, gains disappear under realistic conditions, or the effect is inseparable from generic processing. Document boundary conditions and failure signatures.

### Stage 7: Claim Bounding and Reporting
Downgrade claims that rely on a single metric, lack controls, disappear under realistic conditions, or conflict with post-operation evidence. Explicitly state:
- What is supported by existing evidence.
- What remains inferred.
- What must be validated before stronger claims can be made.
- Boundary conditions (material, electrolyte, geometry, operating window) that limit generalization.

## Output Format

Return results in the following structure:

1. **Research Question Framing**
   - Target system, coupled failure loop, main gap, and significance.

2. **Hypothesis Portfolio**
   - Ranked hypotheses with evidence strength, causal mechanism, key assumptions, predicted signatures, likely failure modes, and boundary conditions.

3. **Experimental Design**
   - Systems and controls.
   - Variables and primary / secondary metrics.
   - Minimal viable validation plan and strong validation plan.
   - Pre-registered stop and escalation conditions.

4. **Analysis Plan**
   - Evidence chain from interface formation to device performance.
   - Visualization and statistical checks.
   - Confounder and reproducibility checks.

5. **Iteration Plan**
   - Decision rules for supportive, ambiguous, or contradictory results.
   - Loop targets (Stage 2, 3, or 6) and stop criteria.

6. **Validity Statement**
   - Supported vs. inferred vs. unverified claims.
   - Boundary conditions and residual risks.

## Validation Gates

- **Clarity Gate (Stage 1):** Degradation loop is resolvable into testable sub-mechanisms.
- **Candidate Gate (Stage 2):** At least one hypothesis is falsifiable with available tools.
- **Design Gate (Stage 3):** Controls isolate the proposed mechanism from known confounders.
- **Stability Gate (Stage 4a):** Interface forms reproducibly and remains chemically stable under test conditions.
- **Functional Validation Gate (Stage 4b):** Mechanism diagnostics and performance metrics are directionally consistent.
- **Iteration Gate (Stage 4c):** Ambiguity triggers additional diagnostics rather than unchecked escalation.
- **Claim Bounding Gate (Stage 7):** Every claim is tagged with its evidence level and boundary limits before delivery.

## Claim Boundaries

- Do not present single-study or single-system observations as field-wide consensus.
- Do not infer commercial readiness, safety certification, or deployment viability from laboratory-scale mechanism evidence.
- Do not extrapolate claims beyond the tested electrolyte, electrode, geometry, or operating window without labeling them as speculative.
- Distinguish paper-derived patterns, literature-supported principles, and newly generated inferences.

## Failure Modes

- **Irreproducible interface formation:** The intervention cannot be formed consistently across samples or batches.
- **Confounded controls:** Generic processing, roughness, or loading differences explain the observed effect.
- **Mechanism–performance mismatch:** Device metrics improve while mechanism diagnostics remain unchanged or worsen.
- **Premature extrapolation:** Half-cell or material-level gains disappear in full-cell or realistic configurations.
- **Overlooked side reactions:** The interface suppresses one failure mode while creating another (e.g., transport blockage, cathode contamination).
- **Narrow operating window:** Benefits are observed only under a limited current density, concentration, or temperature range.
- **Simulation–experiment divergence:** Computational predictions conflict with experimental observables due to unmodeled side reactions or boundary conditions.

## Validity Checks

Before finalizing any output, verify:
- **Mechanistic specificity:** Does a chemistry, morphology, or ablation control isolate the proposed interfacial function?
- **Confounding:** Could initial roughness, processing history, electrolyte disturbance, geometry, contact instability, or counter-electrode behavior explain the result?
- **Reproducibility:** Were independently prepared samples or batches compared?
- **Statistical validity:** Are primary endpoints predefined, and are uncertainty estimates reported?
- **Device relevance:** Does the simplified-cell mechanism survive in a more realistic configuration?
- **Post-operation consistency:** Does the interface remain after cycling, and does failure analysis match the proposed mechanism?
- **Evidence separation:** Are source-paper observations, literature claims, and new inferences clearly distinguished?

## Provenance

Synthesized from cluster 50 / subcluster 50.1 ("observable-driven mechanism discovery and validation"). Derived from source skills: `hydrophobic-interface-anode-exploration`, `aqueous-battery-interface-exploration`, `aqueous-flow-battery-posolyte-exploration`, `mxene-zinc-hybrid-capacitor-research`, `mxene-zinc-cathode-research-pattern`, `aqueous-metal-battery-field-regulation-explorer`, `azib-anode-interface-research-workflow`, `zinc-anode-interface-exploration`.
