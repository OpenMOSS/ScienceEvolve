---
name: sci-fiber-observable-driven-mechanism-discovery-workflo-de7dfb36
description: A reusable end-to-end workflow for proposing, validating, and iterating mechanism-driven hypotheses in materials and energy-interface research through convergent evidence and discriminating controls.
scienceevolve-title: "Fiber composites and battery materials · observable driven mechanism discovery workflow 9"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Guide agents in transforming observed performance limitations into testable mechanism-driven research plans. The workflow emphasizes diagnosing degradation or bottleneck pathways, generating bounded hypotheses, designing minimum viable validation with layered controls, and iterating based on convergent evidence rather than single-metric optimization.

# When to use

Use this skill when the user asks to:

- Propose new research questions rooted in a diagnosed mechanism gap.
- Design experiments that distinguish between competing mechanistic explanations.
- Evaluate whether evidence supports a proposed material, interface, or architecture hypothesis.
- Iterate on a design after initial results by identifying the weakest evidence link.
- Convert paper-derived insights into transferable validation logic for related systems.

Do not use this skill for:

- Executing operational laboratory procedures or hazardous synthesis instructions.
- Treating a single study as field-wide consensus.
- Optimizing a single performance metric without mechanism discrimination.

# Inputs required

Before generating a plan, ask for or infer:

- **Target system and observable bottleneck**: the device, material, or interface and the specific failure, loss, or limitation pattern.
- **Suspected mechanism**: the degradation, transport, kinetic, or interfacial pathway thought to dominate.
- **Candidate intervention**: the design feature, material, or architecture proposed to alter the pathway.
- **Available evidence types**: structural, chemical, kinetic, transport, imaging, spectroscopic, or simulation capabilities.
- **Baseline and benchmark**: inert or conventional comparators and any relevant literature reference.
- **Constraints**: safety, scalability, environmental, regulatory, and resource boundaries.

If inputs are missing, state assumptions explicitly and downgrade confidence accordingly.

# Core Workflow

## Stage 1: Bottleneck Diagnosis
1. Map the observable symptom to a specific pathway (e.g., intermediate migration, structural fracture, transport limitation, interfacial instability).
2. Identify coupled failure modes—avoid assuming a single cause.
3. Define the intervention point: a component or architecture near the pathway that can be modified without eliminating its original function.

**Decision gate:** If the bottleneck cannot be tied to at least one observable symptom and one plausible pathway, stop and request more data.

## Stage 2: Hypothesis Generation
Generate 3–5 mechanism-linked hypotheses in this order:

1. **Failure-mode hypothesis**: the dominant degradation pathway.
2. **Intervention hypothesis**: how the design feature alters the pathway.
3. **Mechanistic-link hypothesis**: the expected structure→property→performance chain.
4. **Boundary hypothesis**: where the concept should stop working.
5. **Failure hypothesis**: the most plausible reason the design will not help.

For each hypothesis, specify:
- Evidence strength (low / moderate / strong / robust).
- Key assumptions.
- Predicted observable signatures.
- Likely failure modes.
- Minimal discriminating test.

**Decision gate:** If a hypothesis cannot be falsified by a feasible experiment, reformulate it.

## Stage 3: Minimum Viable Validation Design
Design a control-rich experiment at a conceptual, non-operational level:

- **Baseline**: conventional or unmodified comparator.
- **Negative control**: lacks the proposed mechanistic feature but matches physical context.
- **Positive / benchmark control**: known system that confirms the test platform.
- **Component-isolation controls**: variants missing one function at a time (e.g., scaffold without modifier, modifier without scaffold).
- **Blank / background control**: absent the mobile species or stimulus when feasible.
- **Orientation / architecture controls**: test directionality or structural necessity.

Define:
- Independent variables: design feature families (not specific recipes).
- Dependent variables: mechanism-specific and performance-level metrics.
- Controlled variables: normalization basis, geometry, protocol family, and batch.
- Stopping criteria: unacceptable safety risk, no mechanism evidence, performance gains from confounders, or irreproducibility.

**Decision gate:** If the plan cannot isolate the proposed mechanism from conductivity, loading, morphology, wetting, or processing effects, redesign controls before proceeding.

## Stage 4: Evidence Collection and Layered Analysis
Analyze results through convergent evidence layers:

1. **Structure / identity**: confirm the intended architecture exists and survives operation.
2. **Interface / interaction**: verify the candidate interacts with the target species or environment as hypothesized.
3. **Kinetics / transport**: distinguish improved reaction or transport from background effects.
4. **Performance / function**: compare candidate and baseline under matched conditions.
5. **Durability / stability**: inspect post-operation state for mechanism retention.
6. **Boundary / robustness**: test under more demanding or realistic constraints.

At each layer, classify findings as:
- Supported
- Partially supported
- Ambiguous
- Contradicted

**Iteration gate:** If structure is unconfirmed, do not interpret function. If mechanism evidence is absent, do not claim the pathway changed.

## Stage 5: Mechanism Discrimination and Exclusion
1. Compare candidate against all controls to attribute causality.
2. Exclude alternative explanations (e.g., adsorption vs. catalysis, conductivity vs. chemical effect, morphology vs. intrinsic activity).
3. Require at least two independent evidence layers to converge before upgrading a hypothesis.
4. If performance improves without mechanism evidence, downgrade the claim to "performance-only" and redesign controls.

**Decision gate:** If competing explanations remain after all controls, do not escalate to broader claims. Design a follow-up experiment that specifically discriminates between them.

## Stage 6: Iteration or Redesign
Based on the weakest evidence link, choose one action:

- **Continue**: mechanism and performance converge; proceed to boundary testing or broader comparison.
- **Refine**: mechanism evidence exists but performance is weak; inspect distribution, transport, wetting, or contact.
- **Redesign controls**: performance improves without mechanism evidence; add intermediate tracking, post-mortem analysis, or host-only subtraction.
- **Revise architecture**: structural data contradict design assumptions; change host, interface, or scaffold.
- **Pivot**: the concept fails reproducibility, host compatibility, or safety constraints; abandon or reframe for a different bottleneck.
- **Stop**: transformation cannot be confirmed, benefits derive from uncontrolled variables, or safety limits are breached.

**Iteration rule:** Change only one primary design variable per cycle and add the smallest control needed to test the leading alternative.

## Stage 7: Claim Formulation and Boundary Setting
1. State the supported claim at the appropriate scope (material-level, electrode-level, cell-level, or system-level).
2. Explicitly list claim boundaries: tested chemistries, architectures, loading ranges, environments, and measurement windows.
3. Separate paper-verified evidence, literature-supported inference, and new-agent hypotheses.
4. Document residual risks and unresolved mechanism gaps.

**Stop condition:** Do not deliver the final plan until all validity checks pass.

# Output Format

When using this skill, return:

1. **Research question**: a concise, mechanism-bounded problem statement.
2. **Mechanism map**: failure pathway, intervention point, expected system effect, and coupled modes.
3. **Ranked hypotheses**: 3–5 hypotheses with evidence strength, assumptions, predicted signatures, failure modes, and boundaries.
4. **Validation plan**: variables, control matrix, primary/secondary metrics, and stop conditions.
5. **Analysis plan**: layer-by-layer evidence interpretation and classification rules.
6. **Iteration decision tree**: continue / refine / redesign / pivot / stop rules for each outcome pattern.
7. **Claim boundaries and residual risks**: explicit scope limits and unresolved gaps.

# Validation Gates

Before finalizing output, verify:

- The research question targets a diagnosed bottleneck, not a broad survey.
- Each hypothesis is falsifiable and includes evidence strength.
- Controls separate geometry, chemistry, conductivity, orientation, and processing effects.
- Mechanistic diagnostics are independent from final performance metrics.
- Replicates, variability, and normalization are addressed conceptually.
- Boundary conditions are stated for chemistry, architecture, environment, and scale.
- No single paper is treated as field consensus.
- No operational hazardous parameters are included.

# Claim Boundaries

- Limit claims to the tested or proposed system configuration.
- Do not extrapolate half-cell results to full-device performance without explicit boundary assumptions.
- Do not generalize from one material class to all related systems.
- Distinguish "supported by convergent evidence" from "plausible but untested" and "performance-only correlation."
- Flag any claim that depends on unverified assumptions about scalability, safety, or environmental impact.

# Failure Modes

Common ways this workflow can fail or mislead:

- **Misattribution**: performance gain is caused by loading, wetting, conductivity, or anode-side effects rather than the proposed mechanism.
- **Over-interpretation**: single-metric improvement is treated as mechanism proof.
- **Control gap**: missing matched baseline or component-isolation control leaves alternative explanations open.
- **Scale mismatch**: material-level evidence is extrapolated to cell-level behavior without validation.
- **Irreproducibility**: uncontrolled batch, processing, or measurement variation creates false positives.
- **Boundary violation**: hypothesis is applied outside the tested chemistry, geometry, or environment.
- **Safety oversight**: research plan proceeds without acknowledging hazardous material or energy-density risks.

# Validity Checks

- **Scientific framing**: Does the question address a real bottleneck?
- **Mechanism validity**: Do structure, interaction, kinetics, and performance support the same causal story?
- **Control validity**: Do controls isolate the proposed mechanism?
- **Statistical validity**: Are replication and variability considered?
- **Reproducibility**: Can the logic be repeated across independent preparations?
- **Boundary validity**: Are claims scoped to tested conditions?
- **Consensus boundary**: Is the source treated as one evidence point among many?
- **Safety validity**: Are hazards identified as design constraints requiring qualified oversight?

# Provenance

- Derived from cluster 39 / subcluster 39.1 ("observable-driven mechanism discovery and validation").
- Synthesized from source skills:
  - `lis-sulfur-reactive-binder-exploration`
  - `lithium-sulfur-separator-exploration`
  - `potassium-anode-mechanism-guided-design`
  - `plant-compatible-energy-interface-research`
  - `conversion-derived-sulfur-electrode-research`
  - `lithium-sulfur-host-research-workflow`
  - `bifunctional-electrocatalysis-exploration`
  - `conductive-scaffold-electrode-exploration`
