---
name: sci-fiber-coupled-system-mechanism-discovery-workflow-8eaed817
description: Design research questions, competing hypotheses, and controlled experiments to discover and validate mechanisms in coupled material systems where structure, interface, and transport interact.
scienceevolve-title: "Fiber composites and battery materials · coupled system mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

## Purpose

Help an agent turn an observed performance gap or failure pattern in a coupled material system into a structured, end-to-end research plan. This skill guides system framing, mechanism mapping, competing hypothesis generation, minimum viable experiment design with strong controls, multi-scale analysis, and evidence-driven iteration without prescribing operational protocols or hazardous procedures.

## When to use

Use when the user asks to propose, evaluate, or redesign studies for material systems where multiple subsystems interact—such as composite reinforcements, fiber-matrix interfaces, electrochemical cells, soft membranes, textile structures, or thin-film devices—especially when the goal is to distinguish true mechanism effects from artifacts, confounds, or single-metric optimization. Do not use for operational lab recipes, safety-sensitive execution parameters, or domain-agnostic paper summarization.

## Inputs required

Ask for or infer:

- **Target system** and its functional objective.
- **Observed gap**, failure loop, or performance limitation.
- **Candidate intervention layer** or structural variable.
- **Proposed mechanism family** (transport, interfacial, chemical, structural, morphological).
- **Available evidence and constraints** (characterization access, safety boundaries, practical limits).
- **Intended claim level** (mechanistic insight, performance improvement, transferability, or practical relevance).

## Core Workflow

1. **Frame the coupled system and gap**
   - Define the target application, interacting subsystems, and the observable performance gap or failure loop.
   - Separate use-phase behavior from environmental or end-of-life behavior if relevant.
   - **Gate**: Reframe if the gap is described as an isolated component failure without considering subsystem interactions.

2. **Map candidate mechanisms**
   - Build a causal chain from structure/process → intermediate state → observable outcome for each candidate mechanism (e.g., transport-limited, interface-limited, chemistry-limited, structure-limited).
   - Label each mechanism as previously supported, inferred, or unverified.
   - **Gate**: Stop and request more evidence if no plausible causal chain can be constructed.

3. **Generate competing, falsifiable hypotheses**
   - Produce at least three hypotheses that explain how an intervention changes the failure loop or property trade-off.
   - For each: state the causal claim, mechanistic rationale, evidence strength, key assumptions, likely failure mode, minimum viable test, and boundary conditions.
   - Prioritize hypotheses that resolve multi-metric trade-offs over single-metric optimization.
   - **Gate**: Reject hypotheses that cannot be weakened by a feasible control experiment.

4. **Design minimum viable validation**
   - Select independent variables (intervention type, location, structural parameter, stress level).
   - Select dependent variables: primary performance, mechanistic diagnostics, and constraint/compatibility metrics.
   - Define controls: baseline, architecture/scaffold-only, mechanism-specific negative, process, and benchmark/positive controls.
   - Predefine stop/go criteria: minimum performance threshold, maximum allowable constraint degradation, reproducibility requirement, and safety/ethics boundaries.
   - **Gate**: Redesign if the plan lacks a matched architecture control or a mechanism-specific diagnostic.

5. **Collect and organize evidence (non-operational)**
   - Specify evidence categories to gather (structural, chemical, kinetic, mechanical, morphological) without providing fabrication recipes or hazardous handling instructions.
   - Require independent replicates and documented batch/source variability.
   - **Stop**: Halt if safety/ethics boundaries are encountered or if measurement artifacts dominate variability.

6. **Analyze through multi-scale coupling**
   - Normalize metrics by geometry, driving force, and baseline where appropriate.
   - Separate performance claims from mechanism, transport, interface, and practicality claims.
   - Link evidence across scales (e.g., microstructure to macroscopic response; interfacial chemistry to device-level kinetics).
   - Map trade-offs between primary and constraint metrics; identify non-monotonic or conditional optima.
   - Label each conclusion as directly supported, indirectly supported, or speculative.

7. **Discriminate mechanisms using controls**
   - Compare the intervention against each matched control to attribute effects.
   - Check whether architecture-only, process-only, or measurement artifacts explain the trend.
   - **Decision**: If controls support the mechanism → proceed to iteration. If controls fail → flag confounding and return to Step 3 or 4.

8. **Iterate, deepen, or pivot**
   - **Advance**: If the mechanism is supported and performance meets criteria, strengthen the hypothesis and test broader boundary conditions (higher stress, alternate environment, extended time).
   - **Modify**: If only a weak baseline is beaten, add stronger controls and diagnostics before claiming mechanism.
   - **Pause**: If confounding or variability prevents interpretation, redesign measurement or control strategy.
   - **Pivot**: If data contradict the core mechanism, return to Step 2 and elevate an alternative mechanism.
   - **Stop conditions**: Persistent inability to beat matched controls; unacceptable trade-off degradation; contradiction by orthogonal evidence; safety/ethics limit reached.

9. **Bound and package claims**
   - Explicitly state boundary conditions (material class, environment, stress level, format, time scale).
   - Distinguish paper-supported, newly observed, inferred, and speculative claims.
   - Document negative results and failure modes as part of the research record.

## Output Format

Return:

1. **Research framing** — Target system, gap, failure loop, intended claim level.
2. **Mechanism map** — Candidate mechanisms, causal chains, and evidence labels.
3. **Ranked hypotheses** — Table with claim, rationale, evidence strength, key assumptions, likely failure modes, and minimum viable tests.
4. **Experimental plan** — Independent variables, dependent variables, controls, metrics, and predefined stop/go criteria.
5. **Analysis plan** — Normalization strategy, multi-scale integration logic, trade-off mapping, and evidence-labeling rules.
6. **Iteration plan** — Rules for advance, modify, pause, or pivot under each major result pattern.
7. **Validity and boundary statement** — Confounders, reproducibility needs, claim limits, and non-operational safety/ethics constraints.

## Validation Gates

- **System-level framing gate**: The gap must be couched in system interaction, not an isolated component.
- **Hypothesis falsifiability gate**: Every hypothesis must have a defined minimum viable test and a stated failure mode.
- **Control adequacy gate**: At least one matched architecture control and one mechanism-specific control must be planned before data collection.
- **Mechanism attribution gate**: Performance improvement must be linked to the targeted failure-loop step via orthogonal evidence, not by a single-metric change.
- **Trade-off gate**: Primary-metric gains must be evaluated against constraint metrics; unbalanced trade-offs trigger redesign.
- **Boundary gate**: Claims must be explicitly scoped to tested conditions before reporting.

## Claim Boundaries

- Do not treat single-study or single-system results as field-wide consensus.
- Do not infer long-term or real-world behavior from short-term or laboratory conditions without qualification.
- Do not transfer rankings or mechanisms across material classes without validation.
- Distinguish mechanism study from performance optimization from practical readiness.
- Mark all extrapolations as conditional or speculative.

## Failure Modes

- Confounding by uncontrolled variables (processing history, source variability, geometry, measurement artifacts).
- Scaffold-only or architecture effects mistaken for active mechanism effects.
- Single-metric optimization that degrades coupled constraint metrics.
- Mechanism evidence inferred from indirect or single-scale measurements alone.
- Overgeneralization from narrow design spaces or small-format proof-of-concept.
- Unstable or irreversible behavior interpreted as reversible improvement.
- Measurement drift, swelling/hydration artifacts, or batch effects dominating observed trends.

## Validity Checks

- **Confounding**: Are loading, geometry, porosity, thickness, contact area, source lot, and processing history matched across comparisons?
- **Baseline strength**: Is the comparator relevant and recent, not bare or outdated?
- **Mechanism specificity**: Does orthogonal evidence support the claimed causal step?
- **Reproducibility**: Are replicates, batch effects, and uncertainty reported?
- **Statistical validity**: Are sample sizes and model assumptions appropriate for the claim?
- **Boundary conditions**: Are chemistry, format, stress level, environment, and time scale stated?
- **External validity**: Are conclusions limited to the tested system family?
- **Safety and ethics**: Are plans non-operational, risk-aware, and compliant with institutional review?

## Provenance

Synthesized from cluster 9.0 (observable-driven mechanism discovery and validation). Source skills: coupled-pathway-battery-research (10.1039_c8ta01115j), lithium-sulfur-interfacial-capture-conversion (10.1016_j.carbon.2020.10.022), pla-biocomposite-degradation-research (fiber__10.1177_15589250261447412), solvent-assisted-bast-fiber-degumming-exploration (fiber__10.1177_00405175251326968), bio-composite-insulation-exploration (fiber__10.3390_jcs9020067), soft-hydrogel-membrane-exploration (2209.00907), cnt-tft-integrated-design (1209.3258), auxetic-yarn-research-pattern (fiber__10.1177_00405175241274506).
