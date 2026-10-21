---
name: sci-fiber-fiber-composite-electrolyte-interface-mechani-54f82acc
description: An observable-driven, end-to-end workflow for discovering and validating mechanisms in fiber-reinforced composites, conductive systems, and interfacial or electrolyte materials through controlled hypothesis generation, multi-scale experimentation, and convergent evidence analysis.
scienceevolve-title: "Fiber composites and battery materials · fiber composite electrolyte interface mechanism discovery"
scienceevolve-area: fiber-composites-and-battery-materials
---

## Purpose

Convert observable performance gaps in complex material systems into testable mechanism hypotheses and validated research plans. This skill guides agents through framing coupled structure–interface–transport–function problems, designing controlled non-operational studies, triangulating evidence across scales, and iterating until claims are bounded by demonstrated limits. It is intended for scientific exploration rather than executable fabrication or hazardous operational protocols.

## When to use

Use this workflow when a user asks to:

- Propose new research questions for material systems where mechanical, electrical, electrochemical, transport, or barrier functions are coupled through interfaces, fibers, matrices, or electrolyte phases.
- Design conceptual experiments that isolate mechanism contributions from formulation or processing artifacts.
- Evaluate whether a proposed architecture or composition can plausibly improve coupled performance without independent optimization of each function.
- Translate material-characterization logic into transferable hypothesis-generation and iteration rules.
- Analyze multi-scale evidence to discriminate among competing mechanisms.

Do not use this skill for laboratory safety review, device certification, executable manufacturing recipes, or clinical recommendations.

## Inputs required

Ask for or infer:

- **Target system class**: fiber-reinforced composite, conductive network, electrolyte-bearing architecture, or related multifunctional material.
- **Application context and functional requirements**: load-bearing, energy storage, transport, shielding, sensing, barrier, or printability.
- **Known bottleneck or failure mode**: interface degradation, transport limitation, phase separation, delamination, impedance mismatch, or mechanical decay.
- **Available evidence streams**: microscopy, spectroscopy, electrochemical or electrical testing, mechanical testing, thermal analysis, rheology, or modeling.
- **Constraints**: safety boundaries, environmental goals, regulatory limits, measurement access, and acceptable evidence strength.
- **Desired output depth**: exploratory hypotheses, minimal validation plan, or full study design.

## Core Workflow

1. **Frame the coupled bottleneck**
   - Define the performance gap as an interaction among structure, interface, transport, and function.
   - Map each function to a distinct component or phase.
   - Identify competing requirements and suspected trade-offs.
   - *Gate*: Stop if the gap cannot be expressed as a falsifiable mechanism question.

2. **Generate ranked mechanism hypotheses**
   - Write causal chains: design change → microstructural change → mechanism change → measurable endpoint change.
   - Assign evidence strength (strong / moderate / weak / speculative).
   - List key assumptions, discriminating controls, and likely failure modes.
   - Rank hypotheses by testability and clarity of coupling.
   - *Gate*: Stop if no hypothesis is testable with available resources.

3. **Design minimal viable validation**
   - Define baseline, single-factor, and combined groups only when justified.
   - Specify strong controls: negative, positive, and process controls.
   - Select primary endpoints (performance), secondary endpoints (mechanism), and feasibility endpoints (processability).
   - Predefine stop conditions: control failure, irreproducibility, mechanism contradiction, or safety boundary violation.
   - *Gate*: Proceed only if controls can isolate the claimed mechanism.

4. **Collect multi-scale evidence**
   - Gather local chemical/structural, mesoscale morphology, and macroscale performance data.
   - Record process metadata and batch tracking.
   - Supplement with simulation or modeling only as an additional stream, not a replacement for experimental controls.
   - *Gate*: Halt interpretation if data quality checks fail (missing controls, outliers, or inconsistent replicates).

5. **Analyze with convergent evidence**
   - Compare modified and baseline groups in the same process state.
   - Triangulate: require alignment across at least two independent evidence streams before causal assignment.
   - Visualize trade-offs explicitly.
   - Classify hypotheses as supported, partially supported, contradicted, or ambiguous.
   - *Gate*: Do not advance to iteration until mechanism discrimination is attempted.

6. **Iterate or redesign**
   - **Supported**: Advance to boundary testing or application-relevant validation.
   - **Partially supported**: Isolate the mixed factor and add mechanism characterization.
   - **Contradicted**: Reformulate around the observed failure mode.
   - **Unresolved**: Improve replication or measurement consistency before re-testing.
   - **Trade-off emerges**: Reframe as multi-objective optimization; test decoupling strategies.
   - *Stop*: Reject or retest if one evidence stream contradicts the proposed mechanism.

7. **Bound claims and define residual failure modes**
   - State extrapolation boundaries: material class, architecture, scale, and environment.
   - Separate demonstrated results from inferred mechanisms and speculative extensions.
   - Document residual failure modes such as long-term aging, scale-up artifacts, or hidden variables.
   - *Stop*: Finalize outputs only after claim boundaries are explicit.

## Output Format

When using this skill, produce:

1. **Research question and gap rationale**
2. **Ranked hypothesis portfolio** — causal chains, evidence strength, key assumptions, and likely failure modes for each hypothesis.
3. **Study design schema** — groups, controls, variables, endpoints, metrics, and stop conditions.
4. **Analysis plan** — evidence triangulation rules, trade-off visualization, and decision logic.
5. **Iteration roadmap** — triggers for advance, modify, reject, or retest based on likely outcomes.
6. **Validation plan** — gates and checks required before claiming success.
7. **Claim boundaries and residual failure modes** — explicit limits and unresolved risks.

## Validation Gates

- **Gap validity**: The bottleneck is falsifiable and framed as a coupled mechanism problem.
- **Control adequacy**: Baseline and strong comparisons can isolate the proposed mechanism from formulation or processing artifacts.
- **Feasibility gate**: Process constraints and safety boundaries permit the proposed design.
- **Data quality gate**: Replicates, controls, and variability are documented before interpretation.
- **Mechanism discrimination gate**: At least two independent evidence streams align before causal claims.
- **Robustness gate**: Results are checked under relevant operating, wetted, or aged states.
- **Claim bounding gate**: Extrapolation limits and material/architecture boundaries are explicit.

## Claim Boundaries

- Limit claims to tested material families, architectures, and device scales.
- Separate demonstrated observations from inferred mechanisms and speculative extrapolations.
- Do not present single-system results as field-wide consensus.
- State the conditions under which hypotheses should not be generalized.

## Failure Modes

- Transport or functional collapse despite local improvement.
- Interface failure before meaningful operation.
- Phase separation, agglomeration, delamination, or pore blockage.
- Impedance mismatch or imbalance between competing functional endpoints.
- False mechanism attribution driven by geometry, contact, processing history, or measurement artifacts.
- Over-optimization of one metric at the expense of a coupled function.
- Irreproducibility arising from batch variability, uncontrolled conditioning, or hidden variables.

## Validity Checks

- **Confounding**: Are processing history, geometry, contact pressure, moisture, or batch variation explaining the result?
- **Reproducibility**: Are independent replicates, uncertainty estimates, and outlier handling included?
- **Mechanistic consistency**: Do chemical, structural, transport, and performance evidence point in the same direction?
- **Control adequacy**: Are baseline, negative, positive, and process controls sufficient to isolate the claim?
- **Operating-state relevance**: Are claims tested under the relevant wetted, aged, or operated state?
- **Statistical validity**: Are conclusions based on trends with variability rather than single favorable traces?
- **Evidence labeling**: Are prior observations, literature support, and agent-generated inferences explicitly separated?
- **Boundary clarity**: Are claims limited to the tested design space?

## Provenance

Derived from cluster 78, subcluster 78.1. Synthesized from representative source skills: structural-aqueous-zinc-electrolyte-research-design, conductive-biobased-tpu-composite-research, organic-cathode-research-design, bio-based-barrier-coating-exploration, synthetic-leather-moisture-exploration, dlp-photopolymer-filler-composite-exploration, biomass-carbon-em-attenuation-research, multifield-responsive-composite-research.
