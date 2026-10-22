---
name: sci-polymer-composite-thermoset-dynamic-vitrimer-eviden-c5b64c59
description: Guide an agent to design, validate, and iterate hypothesis-driven research plans for dynamic thermoset and composite material systems through staged evidence generation, control-based comparison, and mechanistic claim auditing.
scienceevolve-title: "Polymer composites and vitrimers · composite thermoset dynamic vitrimer evidence analysis workflow"
scienceevolve-area: polymer-composites-and-vitrimers
---

# Purpose

Guide an agent to design, validate, and iterate hypothesis-driven research plans for dynamic thermoset and composite material systems through staged evidence generation, control-based comparison, and mechanistic claim auditing.

# When to use

Use when proposing or evaluating research questions involving crosslinked polymer networks, dynamic covalent thermosets, vitrimers, recyclable composites, or bio-based thermoset replacements where trade-offs among mechanical performance, processability, end-of-life functionality, and sustainability claims must be tested.

# Inputs required

Before generating a research plan, identify or request:

- **Target system and application context**: material class, architecture, and service environment.
- **Performance gap or contradiction**: the trade-off among durability, adaptability, recyclability, or sustainability that motivates the study.
- **Candidate design levers**: dynamic motifs, network-forming chemistry, structural segments, or renewable components under consideration.
- **Benchmark or reference system**: a matched non-dynamic, conventional, or incumbent comparator.
- **Characterization capabilities**: available structural, thermal, mechanical, dynamic-exchange, and end-of-life evaluation methods.
- **Safety, regulatory, and environmental boundaries**: constraints on chemistry, exposure, waste, and end-of-life handling.

# Core Workflow

Execute the following ordered stages. At each decision gate, pause and resolve before proceeding.

## Stage 1: Frame the gap and contradiction
Define the material challenge as a measurable trade-off. Identify why existing systems fail to satisfy all requirements simultaneously.
**Decision Gate 1**: Is the contradiction clearly defined and measurable? If not, refine the scope before hypothesizing.

## Stage 2: Generate falsifiable hypotheses
Produce a tiered hypothesis set:
1. **Structure hypothesis**: the candidate motif can be incorporated into the target network architecture.
2. **Mechanism hypothesis**: the motif operates through a defined molecular or network mechanism.
3. **Baseline equivalence hypothesis**: the candidate matches the reference on essential service properties.
4. **Adaptive function hypothesis**: the candidate outperforms the reference on a defined end-of-life or dynamic behavior.
5. **Circularity hypothesis**: the system improves a defined sustainability metric without unacceptable penalties.

For each hypothesis, annotate:
- Evidence strength (strong, moderate, weak, speculative).
- Key assumptions.
- Likely failure modes.
- Primary falsifier.

**Decision Gate 2**: Does every hypothesis have a falsifier and a stop condition? If not, redesign.

## Stage 3: Design staged validation
Build a funnel from minimal to strong evidence:
- **Minimal viable validation**: one candidate, one matched reference, structural confirmation, one baseline performance metric, one adaptive metric, and one internal control.
- **Strong-control validation**: negative controls (absence of motif), positive controls (established benchmark), process controls (matched history), and architecture controls (neat versus composite).
- **Application-relevant validation**: testing in the intended architecture or service proxy, including aging, environmental exposure, or reuse cycles.

Define independent, dependent, and controlled variables without prescribing operational parameters.

**Decision Gate 3**: Are controls sufficient to separate chemistry from processing and architecture from matrix effects? If not, add controls before advancing.

## Stage 4: Collect evidence with ordering constraints
1. Confirm network formation and motif incorporation first.
2. Measure baseline thermal and mechanical properties before claiming adaptive behavior.
3. Measure trigger-dependent or time-dependent adaptive responses only after baseline equivalence is established.
4. Evaluate end-of-life routes separately with matched controls.

**Decision Gate 4**: Did structural confirmation pass? If network formation is unverified, stop and reformulate before interpreting properties.

## Stage 5: Analyze through matched comparison and mechanism linking
- Compare candidate and reference under matched conditions; avoid absolute-value ranking.
- Link property changes to mechanism using orthogonal evidence channels.
- Fit models only within the measured range; label extrapolations as uncertain.
- Classify each conclusion as **demonstrated**, **inferred**, or **speculative**.

**Decision Gate 5**: Do orthogonal evidence channels agree? If mechanism and performance data conflict, revise the mechanism or stop.

## Stage 6: Audit claims against boundaries
- Restrict claims to the tested material family, formulation space, and service conditions.
- Separate demonstrated findings from inferred mechanisms and speculative extrapolations.
- Require system-level evidence before making circular-economy or sustainability claims.
- Do not present single-study results as field consensus.

**Decision Gate 6**: Are all claims bounded by the evidence? If not, downgrade or remove overreaching claims.

## Stage 7: Iterate or stop
Apply result-driven decision rules:
- **Continue**: contrast is clear, baseline performance is acceptable, adaptive behavior is repeatable, and mechanism is supported by orthogonal evidence.
- **Pivot**: the mechanism exists but is limited by trigger mismatch, interface effects, or architecture; redesign one major variable at a time while keeping the reference stable.
- **Stop**: baseline performance is unacceptable, the trigger compromises service stability, mechanism evidence is contradictory, reproducibility is poor, or sustainability benefits are unsupported.

Return to Stage 2 with updated hypotheses after each cycle.

# Output Format

When using this skill, produce:

1. **Research question** – concise statement of the contradiction and target application.
2. **Gap analysis** – known evidence versus inferred opportunities.
3. **Hypotheses table** – hypothesis, mechanism, evidence strength, key assumptions, likely failure modes, and primary falsifier.
4. **Experimental design plan** – variables, controls, staged validation levels, and stop conditions.
5. **Analysis plan** – structural checks, matched comparisons, mechanism-linking logic, uncertainty treatment, and evidence classification.
6. **Iteration plan** – decision rules for continue, pivot, or stop after each evidence cycle.
7. **Validity and boundary statement** – confounders, reproducibility requirements, extrapolation limits, and safety considerations.
8. **Confidence statement** – overall confidence, main uncertainty, and the next most informative experiment.

# Validation Gates

Before advancing past each stage, verify:

- **Gap clarity**: the contradiction is expressed as measurable trade-offs.
- **Hypothesis rigor**: every hypothesis is falsifiable and includes a stop condition.
- **Control sufficiency**: negative, positive, process, and architecture controls are present.
- **Structural priority**: network formation is confirmed before property interpretation.
- **Orthogonality**: at least two independent evidence channels support every mechanism claim.
- **Statistical basis**: replication, variability, and pre-defined comparison criteria are documented.
- **Claim containment**: conclusions are labeled as demonstrated, inferred, or speculative and bounded by test conditions.

# Claim Boundaries

- **Demonstrated**: directly measured in the current study with matched controls.
- **Inferred**: supported by current data plus established mechanism, but not directly measured.
- **Speculative**: plausible but requiring new experiments or broader literature support.
- Do not claim universal performance for any single motif or formulation.
- Do not equate mass loss or single-metric improvement with true recyclability or sustainability.
- Do not treat renewable origin as standalone proof of environmental benefit.

# Failure Modes

- **Network formation failure**: incomplete conversion, inconsistent motif incorporation, or uncontrolled side reactions.
- **Confounded comparison**: differences attributed to chemistry when processing, thermal history, or architecture explain the result.
- **Mechanism evidence conflict**: structural, thermal, mechanical, or dynamic data point to different explanations.
- **Baseline collapse**: adaptive function is demonstrated only after essential service performance is lost.
- **Reproducibility failure**: results vary across batches, geometries, or replicate measurements.
- **Unsupported sustainability claim**: circularity or environmental benefit is asserted without system-level evidence.
- **Safety or regulatory mismatch**: proposed chemistry or end-of-life route conflicts with institutional or environmental constraints.

# Validity Checks

Before accepting a final research plan or claim set:

- **Confounding factors**: separate motif chemistry from cure history, processing route, reinforcement architecture, and measurement artifacts.
- **Benchmark integrity**: the reference is matched for application class, network density, and testing conditions.
- **Reproducibility**: independent batches, repeated measurements, and transparent reporting of failures.
- **Statistical validity**: adequate replication, uncertainty estimates, and avoidance of single-specimen rankings.
- **Boundary conditions**: service temperature, humidity, chemical exposure, aging, mechanical load, and composite interfaces are defined.
- **Mechanistic validity**: structural data alone do not prove mechanics; mechanical data alone do not prove dynamic exchange.
- **Sustainability validity**: renewable origin is necessary but insufficient; include durability, end-of-life pathway, and system-level impacts.
- **Generalization limits**: explicitly separate findings verified in the target system from hypotheses extrapolated to other material classes.

# Provenance

Synthesized from cluster 1, subcluster 1.1 (composite-thermoset-dynamic-vitrimer-evidence-analysis). Source skills: `biomass-thermoset-closed-loop-design`, `dynamic-biobased-vitrimer-exploration`, `dynamic-motif-thermoset-research-design`, `dynamic-epoxy-composite-research-workflow`, `bio-based-epoxy-network-design`, `bio-based-epoxy-thermoset-exploration`, `hybrid-composite-doe-exploration`, `bio-based-epoxy-research-workflow`. Paper-derived method patterns are used as transferable logic, not as operational recipes or field consensus.
