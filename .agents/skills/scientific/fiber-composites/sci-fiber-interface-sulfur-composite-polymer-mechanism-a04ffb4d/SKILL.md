---
name: sci-fiber-interface-sulfur-composite-polymer-mechanism-a04ffb4d
description: A reusable end-to-end workflow for designing mechanism-driven research in complex materials systems where interfacial, transport, or environmental phenomena govern performance, emphasizing hypothesis generation, controlled validation, and iterative claim bounding.
scienceevolve-title: "Fiber composites and battery materials · interface sulfur composite polymer mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

## Purpose

Guide agents in proposing research questions and designing rigorous, mechanism-driven validation studies for materials systems where performance is governed by interfacial state, reaction pathway, transport limitation, or environmental coupling. The workflow teaches an observable-first pattern: frame bottlenecks as mechanistic questions, generate ranked hypotheses with explicit failure modes, validate through orthogonal evidence and strong controls, and iterate based on causal discrimination rather than performance ranking alone.

## When to use

Use this skill when the user asks to:

- Generate new research questions in composites, polymers, electrolytes, membranes, porous hosts, colloids, electrocatalysts, or conversion electrodes where interfacial or transport phenomena are suspected to limit performance.
- Design experiments that distinguish mechanistic levers—such as interfacial affinity, intermediate solvation, reconstruction, confinement, or coupled transport—from confounding variables.
- Validate whether an observed performance change arises from the proposed mechanism or from artifacts like loading, contact, morphology, or measurement bias.
- Iterate a study plan based on partial support, contradiction, or inconclusive evidence.

Do not use this skill for general materials optimization without a mechanism focus, for operational fabrication recipes, or for claiming field-wide consensus from single-study analogies.

## Inputs required

Ask for or identify:

- Target system class and primary performance bottleneck (e.g., loss pathway, selectivity limit, stability fade, transport barrier).
- Suspected mechanistic lever (e.g., interfacial state, local chemical environment, host architecture, reconstruction, dispersion stability).
- Candidate material families and available characterization tools.
- Baseline or benchmark systems for comparison.
- Safety, regulatory, and reproducibility constraints.

If inputs are missing, produce a clarification checklist before advancing to hypothesis generation.

## Core Workflow

Follow this ordered route. Do not skip a gate; if a gate fails, stop or redesign.

1. **Problem framing and mechanism scoping**
   - Reframe the user’s goal from “improve performance” to “identify the mechanism that governs the bottleneck.”
   - Define the dominant loss pathway, competing reaction route, or interfacial failure mode.
   - Identify observable proxies (chemical state, morphology, transport signature, intermediate species) that can discriminate among explanations.
   - **Gate 1:** Stop if the question cannot be expressed as a testable mechanistic claim with observable proxies.

2. **Hypothesis generation and ranking**
   - Generate 2–4 competing hypotheses. Each must include:
     - A mechanistic claim linking a design feature to the bottleneck.
     - A predicted observation that would support the claim.
     - Evidence strength (speculative / low / medium / high).
     - Key assumptions.
     - Likely failure modes (how the hypothesis could be wrong).
   - Prioritize hypotheses that are mutually distinguishable by the planned observations.
   - **Gate 2:** Stop if no hypothesis can be falsified by the available measurements.

3. **Experimental design and control matrix**
   - Define independent, dependent, mediator, and nuisance variables explicitly.
   - Assemble a minimal viable validation set:
     - **Baseline:** unmodified or simplest relevant system.
     - **Negative control:** lacks the proposed mechanistic function.
     - **Positive / benchmark control:** expected to produce measurable activity or stability.
     - **Mechanism control:** isolates a single descriptor while matching other properties.
     - **Confounder control:** varies a suspected nuisance variable to test for artifact.
   - Pre-register primary and secondary metrics, success criteria, and stop conditions.
   - **Gate 3:** Stop if the proposed controls cannot separate the mechanistic lever from loading, contact, transport, morphology, or measurement artifacts.

4. **Orthogonal evidence collection**
   - Gather structural, chemical-state, operational, and (where applicable) computational evidence.
   - Measure actual state variables after material interaction, not only initial conditions.
   - Verify that the intended architecture or state formed and survived preparation.
   - **Gate 4:** Stop if fabrication quality is unverified, if the intended state is absent, or if background signals invalidate the readout.

5. **Causal analysis and mechanism discrimination**
   - Compare results across the control matrix at matched state variables.
   - Classify each result as supporting, weakening, or falsifying each hypothesis.
   - Test alternative explanations: conductivity, porosity, utilization, contact, pressure, thermal history, or sampling bias.
   - Quantify trade-offs; avoid declaring success if one metric improves while another degrades substantially without explanation.
   - **Gate 5:** If evidence is inconclusive, proceed to targeted diagnostics. If contradictory, proceed to hypothesis revision. If supported, proceed to robustness testing.

6. **Iteration or redesign**
   - **Support confirmed:** Add boundary tests (contrasting materials, feeds, environments, or cycling) and stronger controls to test generalizability.
   - **Support partial:** Introduce one additional discriminating measurement or simplify the design variable to isolate the lever.
   - **Contradiction found:** Preserve the negative finding, revise the mechanistic model, and test the next-ranked hypothesis.
   - **Inconclusive:** Check confounders, improve reproducibility, increase replication, or refine measurement protocols.
   - **Stop conditions:** Halt if safety constraints are violated; if the mechanism remains unsupported after two iteration cycles; if nuisance variables fully explain the effect; or if the hypothesis requires extrapolation beyond all tested boundaries.

7. **Claim formulation and boundary setting**
   - Separate directly observed phenomena from inferred mechanisms.
   - State the exact boundary conditions (material class, environment, loading, state of charge, etc.) under which the claim holds.
   - Mark agent-proposed extensions distinctly from source-supported methodological patterns.

## Output Format

When using this skill, produce:

1. **Research question** — One concise, mechanism-focused question.
2. **Mechanism map** — Bottleneck → mechanistic lever → predicted observable → failure mode.
3. **Ranked hypotheses** — At least two hypotheses with evidence strength, assumptions, predicted observations, and failure modes.
4. **Experimental design** — Variables, control matrix, minimum viable validation, primary/secondary metrics, and stop conditions.
5. **Analysis plan** — Causal comparison logic, orthogonal validation strategy, confounder checks, and evidence classification rules.
6. **Iteration plan** — Next steps for support, partial support, contradiction, and inconclusive outcomes.
7. **Validity and boundary notes** — Confounders, reproducibility risks, external validity limits, and non-operational safety boundaries.

## Validation Gates

Before advancing past each stage, confirm:

- The research question is cast as a mechanism discrimination problem, not a performance ranking.
- Hypotheses are mutually exclusive with respect to at least one planned observation.
- Controls are sufficient to isolate the proposed lever from loading, contact, morphology, transport, and measurement artifacts.
- The intended material state or architecture is independently verified.
- Results are interpreted relative to matched controls, not in absolute terms.
- Trade-offs are reported alongside gains.
- Iteration is governed by pre-registered decision rules, not post-hoc reasoning.

## Claim Boundaries

- Distinguish directly observed structure or state changes from inferred mechanistic consequences.
- Treat single-study or single-system evidence as boundary-limited, not field-wide consensus.
- Separate paper-supported methodological patterns from agent-generated extensions for the new problem.
- Do not extrapolate stability, safety, or deployment readiness beyond the tested conditions.
- Avoid implying clinical, environmental-release, or consumer-safety validity without dedicated assessment.

## Failure Modes

Common ways the workflow or hypothesis can fail:

- **Unverified state:** The intended interfacial or architectural state does not form or survive processing.
- **Confounded comparison:** Performance differences arise from loading, contact, density, additive fraction, or thermal history rather than the proposed mechanism.
- **Morphology dominance:** Structural changes (porosity, tortuosity, surface area) explain the result better than the targeted chemical or electronic mechanism.
- **Measurement artifact:** Apparent signals derive from background, sampling bias, instrument drift, or phase separation.
- **Overgeneralization:** A mechanism supported in one material class or environment is assumed to transfer without boundary testing.
- **Premature stopping:** The study halts after a single favorable metric without checking trade-offs, replicates, or controls.

## Validity Checks

Before finalizing any conclusion, verify:

- **Confounding control:** Are loading, thickness, contact, additive fraction, and environmental state matched or measured across comparisons?
- **Control adequacy:** Do negative, positive, mechanism, and confounder controls all behave as expected?
- **Reproducibility:** Are independent replicates, batch variability, and measurement uncertainty reported?
- **Mechanistic consistency:** Do structural, mediator, and performance data support the same interpretation?
- **Boundary testing:** Does the claim hold across more than one condition, or does it fail when the proposed lever is removed?
- **Claim discipline:** Are observations separated from inferences, and are system-specific conditions marked as non-general?

## Provenance

- **Cluster:** 50.0 (observable-driven mechanism discovery and validation)
- **Source skills:** `multifunctional-host-energy-materials`, `cotton-nonwoven-fluid-exploration-skill`, `charged-clay-dispersion-stability-exploration`, `surface-state-programmable-membrane-research`, `polymer-solvent-reaction-path-battery-design`, `electrocatalyst-reconstruction-workflow`, `soot-flame-model-exploration`, `interface-bridged-polymer-composite-exploration`
