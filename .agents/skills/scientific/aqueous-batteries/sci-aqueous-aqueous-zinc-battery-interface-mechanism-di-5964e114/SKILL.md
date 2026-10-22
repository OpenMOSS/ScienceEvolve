---
name: sci-aqueous-aqueous-zinc-battery-interface-mechanism-di-5964e114
description: A reusable end-to-end workflow for generating, testing, and validating interfacial mechanism hypotheses in aqueous battery systems through control-rich experimentation and multi-scale evidence triangulation.
scienceevolve-title: "Aqueous battery interfaces · aqueous zinc battery interface mechanism discovery workflow 2"
scienceevolve-area: aqueous-battery-interfaces
---

## Purpose

This skill guides an agent through observable-driven mechanism discovery and validation for aqueous battery interfaces. It translates performance bottlenecks into falsifiable hypotheses, control-rich experimental plans, and bounded claims without prescribing specific materials, formulations, or operational procedures.

## When to use

Use this skill when the user asks to:
- Generate research questions around interfacial instability, dendrite growth, parasitic reactions, or transport limitations in aqueous metal battery systems.
- Convert a performance problem into a mechanism-driven validation plan.
- Design experiments that isolate interfacial mechanisms from bulk or artifact effects.
- Iterate on electrolyte, additive, or electrode-interface concepts using evidence rather than screening alone.
- Bound claims and define failure modes before presenting conclusions.

Do not use this skill for unrelated chemistry domains, manufacturing scale-up, field deployment, or as a substitute for institutional safety review and qualified laboratory supervision.

## Inputs required

Before executing the workflow, collect or infer:
- **Target system family:** aqueous battery chemistry class and electrode categories.
- **Dominant failure mode:** the specific interfacial or transport bottleneck to explain (e.g., nonuniform deposition, side reactions, interphase instability).
- **Tunable levers:** candidate variables that could alter solvation, adsorption, interfacial composition, or transport (e.g., additive class, solvent network, surface modifier).
- **Measurement capabilities:** available electrochemical, spectroscopic, imaging, transport, and morphological diagnostics.
- **Baselines and controls:** existing baseline behavior, known positive controls, and negative controls.
- **Constraints:** safety boundaries, reproducibility requirements, resource limits, and environmental considerations.

If critical inputs are missing, state assumptions explicitly and keep the first pass at a conceptual or minimal-validation level.

## Core Workflow

Follow this ordered route. Do not skip decision gates.

1. **Failure Chain Framing**  
   Define the bottleneck as a causal chain from bulk chemistry through interfacial state to deposition/reaction behavior and device degradation. State measurable failure indicators and the specific link the hypothesis targets.
   - *Decision Gate:* If the bottleneck cannot be expressed as an observable causal chain with measurable indicators, stop and refine the problem statement.

2. **Mechanism Hypothesis Generation**  
   Produce at least three ranked hypotheses that link a tunable lever to the failure chain. Each hypothesis must include: core mechanism statement, evidence strength, key assumptions, predicted multi-scale signatures, likely failure modes, and boundary conditions where the effect should weaken or reverse.
   - *Decision Gate:* If hypotheses are not mutually distinguishable by a controlled experiment, redesign the lever or failure-mode definition before proceeding.

3. **Control-Rich Experimental Design**  
   Construct a comparison matrix: baseline, candidate, structural control, functional control, negative control, positive control (when available), and extreme conditions. Define independent, dependent, and controlled variables. Pre-register primary metrics, secondary diagnostics, and failure criteria.
   - *Decision Gate:* If the matrix cannot isolate the proposed mechanism from confounding variables (e.g., composition, morphology, processing history, impurities), add controls or simplify the design.

4. **Minimal Viable Validation**  
   Execute the smallest experiment capable of falsifying the weakest mechanism link. Collect at least one diagnostic per major causal link (interfacial state, transport, morphology/reaction pathway, reversibility).
   - *Stop Condition:* If baseline or control conditions fail to behave as expected, or if safety/reproducibility thresholds are breached, stop and repair comparability before interpreting results.

5. **Multi-Scale Evidence Triangulation**  
   Align evidence across scales and assign qualitative strength:
   - **Strong:** independent evidence layers agree and controls isolate the lever.
   - **Moderate:** performance shifts and one–two mechanism-specific diagnostics align.
   - **Weak:** only a performance metric changes without mechanistic support.
   - **Contradicted:** mechanism diagnostics and performance trends point in opposite directions.
   - *Decision Gate:* If evidence is contradictory, identify the broken causal link, revise the hypothesis, and redesign the next minimal test.

6. **Iteration or Redesign**  
   Classify the outcome and act:
   - *Supported:* escalate to broader validation (e.g., full-cell, durability, alternative formats).
   - *Partial:* add targeted diagnostics or redesign the lever to resolve tradeoffs.
   - *Contradicted:* abandon the mechanism and return to Step 2 with a new hypothesis.
   - *Inconclusive:* improve controls or measurement fidelity and repeat Step 4.
   - *Stop Condition:* Terminate if repeated falsification occurs, if a new dominant failure mode emerges that violates safety boundaries, or if the effect depends on uncontrolled artifacts.

7. **Claim Bounding & Reporting**  
   State final claims with explicit evidence grades, tested boundary conditions, and applicability limits. Separate verified evidence from inferred or speculative extensions.
   - *Decision Gate:* If claims extend beyond the tested chemistry, cell format, or operating regime, trim them to the validated boundary before output.

## Output Format

Each invocation must deliver:
1. **Research question:** concise mechanism or tradeoff question.
2. **Ranked hypothesis cards:** at least three hypotheses with evidence strength, assumptions, predicted signatures, likely failure modes, and boundary conditions.
3. **Experimental design matrix:** groups, variables, controls, metrics, minimal viable validation steps, and strong validation path.
4. **Analysis plan:** mechanism triangulation steps, evidence ladder, and confounder checks.
5. **Iteration roadmap:** decision rules for supported, partial, contradicted, and inconclusive outcomes.
6. **Validity statement:** scope limits, confounders, reproducibility requirements, and safety/ethics boundaries.
7. **Evidence boundary:** clear separation of verified evidence from inferred or speculative claims.

## Validation Gates

Enforce these gates before advancing:
- **Precondition Gate:** Baseline exhibits the intended failure mode and controls distinguish stable from unstable behavior.
- **Distinguishability Gate:** Hypotheses predict different observable signatures under the proposed experimental conditions.
- **Control Adequacy Gate:** Positive, negative, structural, and functional controls are included and capable of isolating the target mechanism.
- **Data Quality Gate:** Replicates, calibration, and baseline variability are sufficient to support causal interpretation.
- **Mechanism Consistency Gate:** Multi-scale evidence points in the same direction; contradictory evidence triggers redesign, not forced alignment.
- **Boundary Fidelity Gate:** Claims are restricted to the tested chemistry, architecture, and operating context.

## Claim Boundaries

Never claim:
- Universal generality beyond the tested aqueous chemistry, cell format, and measurement context.
- Causal mechanism without control isolation and multi-scale evidence.
- Performance improvement as proof of the proposed interfacial mechanism when mechanism diagnostics are absent.
- Commercial readiness, safety certification, or manufacturing scalability from laboratory-scale mechanism studies.
- Field-wide consensus based on a single study or candidate system.

## Failure Modes

Watch for these workflow failures:
- **Hypothesis confounding:** Variables are coupled so that no experiment can distinguish between competing mechanisms.
- **Control collapse:** Baseline or control conditions behave unexpectedly, rendering comparisons uninterpretable.
- **Single-scale overreach:** A performance metric or one diagnostic is treated as sufficient proof without triangulation.
- **False attribution:** Performance improves, but the proposed mechanism is unsupported; the real cause remains unidentified.
- **Unbounded iteration:** The loop continues despite repeated contradictions or emerging safety/reproducibility red flags.
- **Boundary neglect:** Claims are generalized to untested chemistries, formats, or operating regimes.

## Validity Checks

Before finalizing any output, verify:
- **Scope discipline:** Claims apply only to the tested system and context.
- **Confound separation:** Composition, transport, kinetics, loading, separator effects, impurities, and history are not mistaken for the target mechanism.
- **Control adequacy:** Baseline, extreme, positive, and negative controls support the intended interpretation.
- **Statistical validity:** Replicates, variability, and uncertainty are reported; single-run improvements are not treated as definitive.
- **Reproducibility:** Materials, measurements, data processing, and analysis criteria are described enough for independent evaluation.
- **Mechanism specificity:** Interfacial or solvation evidence is tied to electrochemical behavior rather than used as standalone proof.
- **Boundary clarity:** Conditions where the hypothesis should fail are explicitly stated.
- **Evidence grading:** Each claim is labeled as direct, indirect, negative, or speculative.

## Provenance

Synthesized from cluster 3.1 (observable-driven mechanism discovery and validation). Derived from source skills: `aqueous-zinc-electrolyte-exploration` (a27d523f017433a9), `alkaline-zinc-anode-research-design` (81114a4f276bc469), `biomimetic-zinc-energy-storage-research` (0beb154e804edada), `aqueous-zinc-anode-research-workflow` (bbb7e5f19f26db0c), `aqueous-zn-interface-additive-design` (51f210dd96fcf289), `aqueous-metal-battery-interfacial-electrolyte-design` (0aa01e659e70d3d9), `coupled-transport-flow-battery-research` (5ec38f46b33da1dd), `open-framework-solid-electrolyte-exploration` (8b56680c963547b1).
