---
name: sci-polymer-composite-mechanism-discovery-workflow-2-890f7df5
description: Guide the design of end-to-end research plans for polymer-matrix composite systems to discover, discriminate, and validate structure-property-service mechanisms through controlled observation and iterative evidence triangulation.
scienceevolve-title: "Polymer composites and vitrimers · composite mechanism discovery workflow 2"
scienceevolve-area: polymer-composites-and-vitrimers
---

# Purpose

Guide agents in proposing, executing, and iterating transferable research plans for fiber-reinforced, particle-filled, or hybrid polymer-matrix composites. The workflow treats mechanism discovery as an observable-driven loop: frame a performance gap as a falsifiable mechanism hypothesis, design controlled comparisons to isolate structural causes, triangulate evidence across multiple characterization modes, and iterate until the hypothesis is supported, rejected, or refined into a boundary-aware design principle.

# When to use

Use this skill when a user asks to:
- Generate new research questions linking composition, architecture, interface, processing, or environmental exposure to composite performance.
- Design comparative studies for mechanical, thermal, transport, functional, or durability properties.
- Interpret multi-scale evidence (morphology, spectroscopy, mechanics, failure analysis) to discriminate between competing mechanisms.
- Iterate an existing plan after preliminary data shows unexpected trends, tradeoffs, or variability.

Do not use this skill to assert field-wide consensus from a single study, to provide operational fabrication recipes, or to make safety-critical application claims without staged validation.

# Inputs required

Ask the user or environment for:

1. **Target system**: matrix family, reinforcement or filler class, interface state, and architecture.
2. **Performance gap**: the target property or service response and the benchmark it must meet or exceed.
3. **Candidate mechanism variables**: composition, processing route, surface treatment, loading, morphology, or environmental factor.
4. **Available characterization**: structural, chemical, thermal, mechanical, transport, or functional measurement access.
5. **Baseline and comparators**: current benchmark, positive and negative control candidates, and mechanism-isolation references.
6. **Constraints**: safety, regulatory, environmental, reproducibility, and non-operational boundaries.

# Core Workflow

Execute the following stages in order. Do not skip a decision gate.

1. **Gap Framing & Mechanism Hypothesis**
   - Convert the performance gap into a falsifiable mechanism hypothesis that links a specific structural state to an observable response.
   - Generate 2–4 competing hypotheses ranked by evidence strength (strong, moderate, weak).
   - For each hypothesis, state the mechanism path, key assumptions, predicted observable signatures, and likely failure modes.
   - **Decision Gate 1**: Proceed only if hypotheses are falsifiable and discriminate between at least two structural causes; otherwise reframe the gap.

2. **Controlled Experimental Design**
   - Define a minimal viable validation set: baseline, single-variable group, process-comparison group, and mechanism-isolation controls.
   - Match processing history, specimen geometry, and conditioning across groups.
   - Pre-specify primary and secondary metrics, acceptance criteria, and stopping conditions before data collection.
   - **Decision Gate 2**: Proceed only if negative, positive, process, and mechanism-isolation controls are present or justified; otherwise redesign.

3. **Evidence Collection & Integrity**
   - Acquire structural, chemical, and morphological evidence before interpreting performance data.
   - Log batch labels, processing history, replicate structure, and any exclusions.
   - **Decision Gate 3**: Halt if data integrity checks reveal mislabeled groups, unmatched processing, or missing replicates above acceptable thresholds; clean the data or redesign the experiment.

4. **Mechanism Discrimination & Analysis**
   - Normalize performance against matched baselines.
   - Classify trends (monotonic, threshold, non-monotonic) and rank factor influence.
   - Map failure modes (debonding, pull-out, cracking, void networks, phase separation) to structural evidence.
   - Triangulate: require at least two independent signals before attributing a mechanism.
   - Label every conclusion by evidence strength (observed, inferred, literature-supported, speculative).
   - **Decision Gate 4**: If the mechanism remains ambiguous, return to Stage 2 to add decoupling controls or orthogonal characterization. If performance improves but structural evidence is weak, add mechanism controls before claiming causality.

5. **Trade-off & Boundary Assessment**
   - Evaluate whether gains in the target metric coincide with unacceptable losses in secondary properties.
   - State boundary conditions: tested material system, process window, service-condition envelope, and loading regime.
   - **Decision Gate 5**: If tradeoffs violate application constraints, stop and redirect to a new hypothesis. If results are boundary-limited, restrict claims and design a sensitivity study.

6. **Iteration or Redesign**
   - **Supported**: Narrow the variable space and test adjacent combinations or generalization boundaries.
   - **Weak or conflicting**: Add orthogonal controls, increase replication, or split the hypothesis into sub-mechanisms.
   - **Non-repeatable**: Pause mechanism interpretation; audit preparation, measurement consistency, and batch variability.
   - **Rejected**: Formulate a new hypothesis based on the observed failure mode and return to Stage 1.
   - **Stop Condition**: Stop when the hypothesis is either validated with mechanistic specificity and reproducibility, or falsified and replaced, or when safety, ethical, or resource boundaries are reached.

# Output Format

When using this skill, return:

1. **Research objective**: target system, performance gap, and key mechanism to test.
2. **Hypothesis table**: research question, hypothesis, mechanism path, variables, controls, metrics, evidence strength, assumptions, and likely failure modes.
3. **Experimental design**: baseline, variable groups, controls, metric matrix, and stopping conditions.
4. **Analysis plan**: normalization, trend classification, failure-mode mapping, triangulation rules, and uncertainty handling.
5. **Iteration plan**: update rules for supported, weak, conflicting, non-repeatable, or boundary-limited results.
6. **Validity and safety notes**: confounders, evidence boundaries, reproducibility requirements, and non-operational safety constraints.

# Validation Gates

- **Hypothesis clarity**: The mechanism is stated as a structural cause, not a correlation.
- **Control adequacy**: Baseline, positive, negative, process, and mechanism-isolation controls are defined.
- **Replication plan**: Replicate counts and variability estimates are pre-specified for primary metrics.
- **Confounder isolation**: Only one major mechanism family varies per comparison; other variables are matched.
- **Pre-registration**: Acceptance criteria and stopping conditions are defined before testing.
- **Morphology-first ordering**: Structure and chemistry are verified before performance is interpreted causally.

# Claim Boundaries

- Limit conclusions to the tested matrix, reinforcement, processing route, and service-condition envelope.
- Distinguish observed results from inferred mechanisms and from speculative extrapolation.
- Do not treat a single-system outcome as field consensus.
- Separate paper-supported patterns from new agent inferences.
- Avoid structural-safety, human-exposure, or environmental-release claims without application-specific validation.

# Failure Modes

- **Confounded comparison**: Unmatched processing, geometry, or batch history masks the true variable effect.
- **Correlation-only inference**: Performance trends attributed to a mechanism without structural or failure-mode evidence.
- **Hidden tradeoff**: Target metric improves while durability, toughness, or safety properties degrade unnoticed.
- **Batch variability**: High scatter from material heterogeneity or processing sensitivity prevents clear interpretation.
- **Incomplete network or phase**: Chemistry or morphology verification omitted, leading to false mechanism attribution.
- **Overgeneralization**: Results from one loading, architecture, or environment applied to untested boundaries.

# Validity Checks

Before presenting a plan or conclusions, verify:

- **Confounders**: composition, reinforcement fraction, morphology, processing route, porosity, dispersion, interface state, and test order are documented and comparable.
- **Controls**: all control groups are present or explicitly justified if absent.
- **Reproducibility**: batch records, raw data, analysis scripts, and exclusion rules are documented.
- **Statistical validity**: sample sizes, uncertainty estimates, outlier rules, and predefined acceptance criteria are stated.
- **Mechanistic validity**: property trends are supported by at least two independent structural, chemical, or failure-mode signals.
- **Interaction validity**: main-effect conclusions are not overstated when interactions or processing-route dependence are present.
- **Boundary conditions**: claims are restricted to the tested system and explicitly note extrapolation limits.
- **Evidence boundaries**: source-paper results are distinguished from new inferences.

# Provenance

- Synthesized from cluster 11 / subcluster 11.0 (composite-epoxy-fiber-flame-retardant-mechanism-discovery-workflow).
- Derived from source skills: composite-process-structure-wear-research, natural-fiber-composite-research-design, bio-epoxy-vitrimer-research-design, bio-based-epoxy-curing-agent-discovery, recyclable-conductive-vitrimer-composites, waste-fibre-insulating-composite-exploration, hierarchical-conductive-fiber-emi-exploration, composite-interface-exploration.
- Represents the shared observable-driven mechanism discovery and validation archetype across polymer-matrix composite domains.
