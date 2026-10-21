---
name: sci-fiber-composite-fiber-interface-hybrid-mechanism-di-c03ba72c
description: Transform a composite or fiber-reinforced system design problem into a structured, end-to-end mechanism discovery and validation workflow that generates testable hypotheses, discriminating experiments, and bounded claims.
scienceevolve-title: "Fiber composites and battery materials · composite fiber interface hybrid mechanism discovery workflow 2"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Transform a composite, fiber-reinforced, hybrid, or yarn-based system design problem into a structured end-to-end workflow for mechanism discovery and validation. The skill guides hypothesis generation, minimal experimental design, multiscale analysis, and claim bounding without treating single-study results as field consensus.

# When to use

Use this skill when the task involves:

- Proposing new research questions in fiber-reinforced composites, hybrid assemblies, textile yarns, or multi-phase material systems.
- Designing validation studies where interface, reinforcement, or processing mechanisms are uncertain.
- Interpreting structure-property-performance relationships across multiple length scales or measurement modes.
- Balancing trade-offs among mechanical, thermal, tribological, or functional performance criteria.

Do not use for clinical or biomedical advice, operational fabrication recipes, safety-critical certification, or tasks outside materials research.

# Inputs required

Ask the user or inspect the environment for:

1. **Target system**: matrix family, reinforcement or fiber type, functional phases, and assembly architecture.
2. **Performance bottleneck**: the specific gap, failure mode, or property trade-off motivating the study.
3. **Candidate variables**: composition, architecture, interface strategy, processing route, or environmental factors.
4. **Evidence base**: literature findings, prior measurements, known confounders, and benchmark data.
5. **Characterization constraints**: available mechanical, microstructural, thermal, chemical, or surface analysis methods.
6. **Boundaries**: application context, safety limits, regulatory requirements, cost, and reproducibility standards.

# Core Workflow

Follow this ordered route. At each gate, decide whether to proceed, redesign, or stop.

## 1. Frame the problem and bound the system
Convert a vague design goal into a focused mechanism question. Identify whether the bottleneck lies in load transfer, interfacial stability, phase dispersion, environmental degradation, or architecture-performance coupling.
- **Decision gate**: If the bottleneck is purely empirical with no mechanistic target, stop and redirect to broad screening before entering this workflow.

## 2. Map the mechanism space
Identify beneficial mechanisms (e.g., improved stress transfer, crack deflection, protective layer formation) and competing damage mechanisms (e.g., debonding, agglomeration, thermal decomposition). Link processing or design choices to structure, then to properties, then to performance.
- **Decision gate**: If competing mechanisms cannot be articulated, pause for targeted literature review or expert elicitation.

## 3. Generate evidence-rated hypotheses
For each candidate mechanism, produce falsifiable hypotheses containing:
- Mechanism claim and predicted measurable signature.
- Evidence strength (high / medium / low / speculative).
- Key assumptions and boundary conditions.
- Likely failure modes of the hypothesis itself.
- **Decision gate**: If no hypothesis can be tested with available resources, narrow scope or stop.

## 4. Design minimal viable validation
Construct a study matrix with:
- **Baseline control**: untreated or standard system.
- **Negative control**: condition expected to suppress the proposed mechanism.
- **Positive / benchmark control**: known comparator when available.
- **Process control**: identical handling unless processing is the studied factor.
- Independent variables limited to one primary design factor and, only if necessary, one operating factor.
- Dependent variables spanning performance, microstructure, and mechanism indicators.
- Predefined stopping conditions (e.g., controls fail, variability overwhelms signal, safety limits reached).
- **Decision gate**: If controls cannot isolate the proposed mechanism, redesign before execution.

## 5. Collect multiscale, multi-modal data
Gather quantitative performance data paired with at least one independent microstructural, interfacial, or morphological indicator. Record processing history, replication structure, and exclusion rules.
- **Decision gate**: If data quality is inadequate (missing replication, incomparable specimen states, unrecorded confounders), halt and fix the protocol.

## 6. Discriminate mechanisms through analysis
- Normalize stressed or treated results against matched controls.
- Separate main effects from interactions.
- Triangulate: require agreement between performance trends and at least one independent structural or chemical indicator before accepting a mechanism.
- Check for non-monotonic trends as evidence of competing mechanisms.
- Grade each conclusion as supported, partially supported, contradicted, or unresolved.
- **Decision gate**: If evidence is ambiguous, flag for targeted follow-up rather than broad claims.

## 7. Iterate, update, or stop
- **If confirmed**: strengthen the hypothesis and test a boundary condition (e.g., different environment, geometry, or loading mode).
- **If partial**: add orthogonal measurements to clarify the actual mechanism.
- **If contradicted**: revise the mechanism map and generate a new hypothesis.
- **If inconclusive**: improve controls, replication, or measurement sensitivity.
- **Stop condition**: terminate if the iteration budget is exhausted, safety limits are reached, or the effect remains indistinguishable from controls.

## 8. Bound claims and plan the next cycle
Document the validated mechanism, residual uncertainties, and explicit system boundaries. State what remains unvalidated and what would be required for the next cycle.

# Output Format

Return results in this structure:

1. **Research question** — Focused mechanism question, system boundary, and application context.
2. **Mechanism map** — Beneficial mechanisms, damage mechanisms, competing pathways, and boundary conditions.
3. **Hypothesis table** — For each hypothesis: claim, evidence strength, key assumptions, predicted signature, likely failure mode, and minimal test.
4. **Study design summary** — Experimental cells, control hierarchy, independent/dependent variables, replication plan, and stopping conditions.
5. **Analysis plan** — Normalization rules, triangulation strategy, statistical approach, visualization, and evidence-grading criteria.
6. **Iteration log** — Decision record for each cycle: confirmed, revised, inconclusive, or stopped, with rationale.
7. **Validity and boundary statement** — Confounders checked, reproducibility requirements, extrapolation limits, and residual risks.

# Validation Gates

Before advancing past each stage, confirm:

- **Problem framing**: The question targets a mechanism, not just a ranking.
- **Hypothesis falsifiability**: Each hypothesis can be refuted by a feasible experiment.
- **Control adequacy**: Baseline, negative, and relevant positive/benchmark controls are present.
- **Data comparability**: Specimen states, measurement methods, and reporting conventions are consistent across groups.
- **Mechanism triangulation**: At least two independent measurement scales support the proposed mechanism.
- **Uncertainty visibility**: Variability, missing data, and source differences are documented.
- **Claim bounding**: Conclusions are limited to the tested system and labeled with evidence strength.

# Claim Boundaries

- Distinguish **model-supported ranking** from **experimentally validated mechanism**.
- Limit claims to the tested matrix, reinforcement, processing class, geometry, and environment.
- Label all conclusions with evidence strength; do not describe single-source findings as field consensus.
- State trade-offs explicitly when a design improves one metric while degrading another.
- Mark agent-inferred extensions to adjacent systems as hypotheses requiring independent validation.

# Failure Modes

- **Misattribution**: Performance changes are attributed to the intended mechanism when they actually stem from consolidation quality, porosity, or processing variability.
- **Control failure**: Baseline or negative controls behave unexpectedly, invalidating comparisons.
- **Over-smoothing**: Non-monotonic or irregular data are averaged away, hiding competing mechanisms.
- **Criterion mismatch**: Selected metrics do not map to the stated application need.
- **Premature generalization**: Results from one material system or geometry are extrapolated to untested families.
- **Weight sensitivity**: Decision rankings depend on a single unsupported assumption or missing metric.
- **Measurement artifact**: Apparent trends are driven by geometry, calibration, run-order, or environmental drift rather than material behavior.

# Validity Checks

- **Confounding**: Are density, porosity, dispersion, specimen geometry, conditioning, and environment controlled or recorded?
- **Reproducibility**: Are replicate samples, batches, and repeated measurements reported with variability?
- **Statistical validity**: Are endpoints predefined, uncertainty estimated, and multiple comparisons handled cautiously?
- **Mechanism specificity**: Does the evidence distinguish among bonding, bridging, deflection, debonding, and other alternatives?
- **Boundary conditions**: Are claims constrained to the tested system, loading mode, and exposure window?
- **Consensus boundary**: Are single-paper or single-source precedents labeled as precedents, not established consensus?
- **Trade-off transparency**: Are friction, wear, toughness, durability, cost, manufacturability, and environmental exposure considered together where relevant?

# Provenance

Synthesized from cluster 49.1 (composite-fiber-interface-hybrid-mechanism-discovery). Derived from source skills: natural-fiber-composite-mcdm-research, elastomeric-staple-yarn-research-pattern, pitch-carbon-composite-research-design, fiber-composite-tribology-research-agent, geopolymer-thermal-fiber-research-workflow, hybrid-composite-durability-research, composite-interface-research-design, emi-shield-composite-research-design.
