---
name: sci-polymer-composite-thermoset-mechanism-discovery-wor-b685cd1d
description: A reusable end-to-end workflow for framing research gaps, generating falsifiable hypotheses, designing controlled minimum-viable validations, and discriminating mechanisms through multi-modal evidence in composite and thermoset material systems.
scienceevolve-title: "Polymer composites and vitrimers · composite thermoset mechanism discovery workflow 2"
scienceevolve-area: polymer-composites-and-vitrimers
---

## Purpose

Help an agent transform a material-performance gap into a rigorous, observable-driven mechanism-discovery program for composite and thermoset systems. The workflow provides a reusable end-to-end route: frame trade-offs, generate falsifiable hypotheses, design minimum viable validations with strong controls, analyze multi-modal evidence chains, and iterate or stop based on pre-registered criteria.

## When to use

- When the user asks to design new research questions for polymer composites, thermosets, or hybrid material systems.
- When performance depends on coupled properties (e.g., mechanical, thermal, durability, functional) and trade-offs must be managed.
- When the goal is to validate a causal mechanism rather than optimize a single metric.
- When translating a literature pattern into a transferable study design for a different material system.

Do not use this skill as a manufacturing recipe, safety certification tool, or source-specific parameter copy.

## Inputs required

Before producing a plan, collect or request:

- Target material class and application context.
- Performance gap and primary trade-off.
- Candidate mechanisms and observable signatures.
- Available baseline or benchmark and characterization capabilities.
- Constraints: safety, regulatory, environmental, and resource limits.
- Existing data and known confounders.

If key inputs are missing, state assumptions explicitly and label them as provisional boundaries.

## Core Workflow

1. **Gap Framing & Trade-off Definition**
   - Define the performance gap relative to a baseline or benchmark.
   - Identify coupled properties and non-negotiable constraints.
   - *Decision Gate*: Proceed only if the gap is expressible as observable, measurable responses.

2. **Mechanism Mapping**
   - Link candidate mechanisms to structural, interfacial, chemical, or transport observables.
   - Distinguish matrix-level, reinforcement-level, interface-level, and architecture-level effects.
   - *Decision Gate*: Proceed only if each mechanism predicts a distinct observable signature.

3. **Hypothesis Generation**
   - Produce ranked, falsifiable hypotheses (gap, mechanism, trade-off, boundary).
   - Label evidence strength (strong / moderate / weak / speculative), key assumptions, and likely failure modes.
   - *Decision Gate*: Proceed only if every hypothesis includes a discriminating test and a clear falsification condition.

4. **Minimum Viable Validation (MVV) Design**
   - Define independent, dependent, and blocking variables conceptually.
   - Institute controls: baseline, constituent, positive, negative, and process controls.
   - Pre-register stop conditions: unacceptable trade-offs, control failure, variability exceeding threshold, safety boundary breach, or absence of mechanistic information.
   - *Decision Gate*: Proceed only if controls can isolate the proposed mechanism from composition, processing, or measurement artifacts.

5. **Multi-Modal Evidence Collection**
   - Gather structure, chemistry, interface, property, and failure-mode data.
   - Audit data integrity: units, replicates, batch labels, conditioning, and measurement order.
   - *Decision Gate*: If data integrity or comparability checks fail, stop and diagnose confounders before analysis.

6. **Structure-First Analysis**
   - Quantify microstructure, dispersion, orientation, connectivity, defects, and interfaces before interpreting performance.
   - Map property trends across conditions; visualize trade-offs.
   - Label conclusions as observed, inferred, or extrapolated.
   - *Decision Gate*: If structural evidence is missing or contradicts property claims, halt and redesign measurements.

7. **Mechanism Discrimination**
   - Compare results against control predictions.
   - Rule out alternative explanations (processing artifacts, defects, measurement bias, composition effects).
   - Assign evidence strength: strong (multi-modal agreement), moderate (consistent but incomplete), weak (single metric), contradictory.
   - *Decision Gate*: If evidence is contradictory, reject or revise the hypothesis before iterating.

8. **Iteration Decision**
   - **Advance**: Strong evidence, acceptable trade-offs, reproducible trends → test durability, boundaries, or benchmarks.
   - **Revise**: Partial or non-monotonic trends → adjust one variable family (interface, architecture, processing) and retest.
   - **Narrow**: Gain only under specific conditions → define valid domain and test boundary limits.
   - **Reject**: No gain, unacceptable trade-off, or mechanism disproven → abandon direction or redefine gap.
   - **Stop**: Hit pre-registered stop condition (variability, safety, resource limit, diminishing mechanistic return).
   - *Decision Gate*: Document rationale for the chosen path and updated assumptions before the next cycle.

9. **Documentation & Claim Bounding**
   - Compile research framing, mechanism map, hypothesis table, experimental logic, analysis summary, and iteration history.
   - Explicitly separate source-paper patterns from new-system inferences.
   - State boundary conditions and residual risks.

## Output Format

When using this skill, produce:

1. **Research scope** — target system, application constraints, and primary trade-off.
2. **Gap and mechanism map** — why the question matters and which mechanisms link factors to responses.
3. **Ranked hypothesis table** — each hypothesis with evidence strength, assumptions, expected response pattern, and failure modes.
4. **MVV design** — conceptual variables, controls, response metrics, and stop conditions.
5. **Analysis plan** — data audit, structure-first logic, trade-off visualization, and uncertainty handling.
6. **Iteration decision log** — advance / revise / narrow / reject / stop rationale.
7. **Validity and safety statement** — confounders, reproducibility checks, boundary conditions, and compliance limits.
8. **Provenance and evidence summary** — source-skill references and separation of observed, inferred, and speculative claims.

## Validation Gates

- **Gap observability**: Can the gap be measured with available methods?
- **Mechanistic distinctness**: Does each hypothesis predict a unique observable signature?
- **Control sufficiency**: Can the design isolate the mechanism from confounders?
- **Data integrity**: Are replicates, batches, and metadata traceable and consistent?
- **Cross-modal consistency**: Do structural, chemical, and property evidence align?
- **Pre-registered stops**: Are stop conditions defined before data collection?

## Claim Boundaries

- Do not present a single screening result as optimized, general, or application-ready.
- Do not claim field-wide consensus from one study or source skill.
- Do not infer sustainability, safety certification, or long-term durability from single-metric improvement.
- Distinguish observed evidence, mechanistic inference, and speculative extrapolation.
- Avoid stating that a specific formulation, ratio, or processing parameter is universally transferable.

## Failure Modes

- Confounding by uncontrolled batch, moisture, geometry, or measurement drift.
- Over-interpretation of small screens or unreplicated optima.
- Mechanism claims unsupported by independent structural or interfacial evidence.
- Ignoring trade-offs where one property improves while required properties degrade.
- Continuing iteration after pre-registered stop conditions are met.
- Conflating source-paper observations with new-system inferences.

## Validity Checks

- **Confounding**: Check material variability, processing history, environmental exposure, and measurement order.
- **Reproducibility**: Require independent preparation, repeated measurements, and transparent data processing.
- **Statistical validity**: Use design-matched analysis, report uncertainty, and avoid overclaiming from small factorial screens.
- **Boundary conditions**: Limit claims to the tested material class, processing route, and property domain.
- **Mechanism integrity**: Demand multi-modal evidence before accepting a causal mechanism.
- **External validity**: Verify whether target application conditions match study conditions before extrapolating.

## Provenance

- Synthesized from cluster 24.1 (observable-driven mechanism discovery and validation).
- Source skills: bio-based-composite-orthogonal-screening (10.1051_e3sconf_202455201086), natural-fiber-composite-exploration (10.63456_tsrj-2-1-26), adaptive-composite-research-workflow (10.3390_ma17133265), natural-fiber-hybrid-composite-research (10.1002_app.48596), damage-activated-coating-exploration (10.1002_maco.70169), field-guided-polymer-composite-research (10.3390_polym17111429), bio-epoxy-composite-research-workflow (10.1002_pc.25443), hybrid-biocomposite-research-design (10.1002_pc.26930).
