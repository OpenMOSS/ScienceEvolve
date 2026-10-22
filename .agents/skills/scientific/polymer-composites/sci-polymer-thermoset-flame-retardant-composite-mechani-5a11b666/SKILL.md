---
name: sci-polymer-thermoset-flame-retardant-composite-mechani-5a11b666
description: A reusable end-to-end workflow for discovering and validating structure-property-mechanism links in composite, thermoset, and flame-retardant polymer systems through hypothesis generation, controlled experimentation, layered analysis, and iterative claim bounding.
scienceevolve-title: "Polymer composites and vitrimers · thermoset flame retardant composite mechanism discovery workflow"
scienceevolve-area: polymer-composites-and-vitrimers
---

# Purpose

Use this skill to design and execute a transferable, mechanism-centered research program for composite, thermoset, flame-retardant, dynamic, or bio-based polymer systems. The workflow isolates a causal lever, links formulation or process variables to network architecture and functional performance, validates trade-offs through layered evidence and strong controls, and iterates until claims are bounded by reproducible mechanism discrimination.

# When to use

- When the user needs a new research question framed around a performance conflict (e.g., fire safety versus mechanical integrity, sustainability versus thermal stability, reprocessability versus service durability).
- When the user wants to test how a formulation variable, network architecture, additive motif, or process condition changes reaction kinetics, network structure, or downstream functional properties.
- When the user asks for an experimental plan that includes hypothesis ranking, control design, multi-objective evaluation, and iteration rules rather than a literature summary or operational recipe.
- When the user must separate paper-supported patterns from new-system inferences and speculative extensions.
- When the user needs to bound claims by evidence level, distinguish mechanism hypotheses from artifacts, and define stop conditions before further investment.

# Inputs required

Before entering the core workflow, obtain or explicitly assume:

- Target material class and application context.
- Dominant performance conflict or service hazard.
- Candidate causal variable, structural motif, or process lever to isolate.
- Intended evidence boundary (e.g., neat resin, composite, coating, adhesive, post-recycling state).
- Available characterization categories and safety/compliance constraints.
- Baseline comparator or reference system, if any.
- Constraints on trade-offs (e.g., unacceptable loss of toughness, smoke increase, or processability degradation).

# Core Workflow

Follow this ordered route. Treat each stage as a gate; do not proceed to the next gate until the current gate is satisfied or explicitly bypassed with documented risk.

## Stage 1: Frame the conflict and bound the question

1. State the performance trade-off as a falsifiable research question linking a target property, a constrained property, and a candidate mechanism.
2. Define the evidence boundary (material state, application class, and service environment).
3. Identify the primary causal lever to isolate. Hold other major variables constant or measure them as covariates.
4. **Decision gate**: If the conflict cannot be expressed as a mechanism hypothesis, stop and reformulate.

## Stage 2: Generate and rank mechanism hypotheses

1. Produce at least two competing hypotheses:
   - One conservative extension of an established pattern.
   - One exploratory mechanism or motif combination.
2. For each hypothesis, specify: mechanistic rationale, evidence strength (high/medium/low/speculative), key assumptions, predicted observations, likely failure modes, and a minimal falsification test.
3. Rank hypotheses by mechanistic specificity, discriminability with available controls, risk of confounding, and transfer distance from validated literature.
4. **Decision gate**: If no hypothesis is falsifiable with the available resources, stop and reduce scope.

## Stage 3: Design the minimal viable validation

1. Define independent variables (one primary variable first; avoid multi-factor sweeps until mechanism is clearer).
2. Define dependent variables across at least three layers:
   - Reaction, conversion, or process indicator.
   - Structural proxy (network architecture, morphology, dispersion, interface).
   - Functional endpoint (mechanical, thermal, fire safety, durability, or recyclability).
3. Specify strong controls:
   - Baseline without the variable of interest.
   - Negative control lacking the proposed active feature.
   - Vehicle/process control to separate physical effects from chemical effects.
   - Mechanism control testing an alternative explanation.
   - Positive or benchmark control when justified.
   - Recovered/reprocessed-state control if recyclability or aging is relevant.
4. Define success criteria (what result supports the hypothesis) and stop conditions (what result triggers redesign or abandonment).
5. **Decision gate**: If controls cannot distinguish the proposed mechanism from density, morphology, processing history, or measurement artifacts, redesign before execution.

## Stage 4: Execute layered analysis and mechanism discrimination

1. Verify material formation and compatibility with orthogonal structural evidence before interpreting functional data.
2. Analyze data in sequence:
   - Compare candidate against all controls under matched conditions.
   - Plot trends against the primary variable to detect non-monotonic or threshold behavior.
   - Link structural proxies to functional endpoints before assigning molecular causality.
   - Evaluate trade-offs explicitly; do not rank by a single endpoint.
3. Discriminate mechanisms by requiring convergence of at least two independent measurement classes (e.g., thermal + residue morphology, or mechanical + spectroscopic).
4. **Iteration gate**: If structural and functional evidence conflict, halt interpretation, add diagnostics, and revise the mechanism model.

## Stage 5: Uncertainty audit and claim bounding

1. Classify each conclusion as:
   - **Strong**: multiple independent measurements align; controls are appropriate; variability is reported.
   - **Moderate**: trend is clear but mechanism evidence or controls are incomplete.
   - **Weak**: relies on a single endpoint, qualitative observation, or analogy without target-system validation.
2. State extrapolation boundaries for chemistry, processing, environment, and application.
3. Separate neat-resin, interface, composite, and product-level claims.
4. **Stop gate**: If the evidence strength is weak or moderate, downgrade claims and require additional validation before generalization.

## Stage 6: Iteration or redesign

1. Update hypotheses based on observed patterns:
   - If the target function improves but a constrained property declines, reclassify as a trade-off and test compensating designs.
   - If controls explain the improvement, abandon the candidate-specific hypothesis and investigate indirect mechanisms.
   - If results are non-reproducible, audit batch variation, measurement calibration, and specimen history before changing chemistry.
2. Modify one design variable at a time where possible.
3. Add controls that discriminate direct from indirect mechanisms.
4. **Stop condition**: Terminate when safety, reproducibility, or mechanism uncertainty prevents meaningful interpretation; when the apparent optimum is not statistically distinguishable from nearby levels; or when a critical endpoint fails beyond acceptable bounds.

# Output Format

When using this skill, produce:

1. **Research question** — One sentence stating the scientific question and evidence boundary.
2. **Hypothesis table** — Ranked hypotheses with mechanistic rationale, evidence strength, key assumptions, predicted observations, likely failure modes, and minimal falsification tests.
3. **Experimental design** — Independent variables, dependent variables across three layers, control set, success criteria, and stop conditions.
4. **Analysis plan** — Sequence of data checks, control comparisons, trade-off evaluation, and mechanism-discrimination rules.
5. **Iteration plan** — Decision rules for updating hypotheses under positive, negative, mixed, or noisy outcomes.
6. **Claim boundary statement** — What the validation can support and what it cannot yet support, with extrapolation limits.
7. **Validity and safety notes** — Confounders, reproducibility checks, boundary conditions, and non-operational safety constraints.

# Validation Gates

- **Mechanism gate**: Does the plan test a causal mechanism rather than a simple material substitution?
- **Isolation gate**: Is one primary variable isolated before adding secondary variables?
- **Layered-evidence gate**: Are reaction/process, structure, and functional endpoints all measured?
- **Control gate**: Are baseline, negative, vehicle, mechanism, and relevant positive or recovered-state controls included?
- **Trade-off gate**: Are gains in one objective evaluated together with losses in constrained objectives?
- **Statistical gate**: Are variability, effect size, replication, and outlier handling addressed?
- **Safety gate**: Are safety, waste, and regulatory boundaries included without executable hazardous detail?

# Claim Boundaries

- Neat-resin or matrix-level evidence supports formulation and network mechanisms only; it does not validate composite, interface, or product-level performance.
- Composite-level evidence is required for fiber, filler, or architecture-specific claims.
- Aging, environmental, reprocessing, or lifecycle evidence is required for durability, recyclability, or sustainability claims.
- Laboratory-scale indicators do not constitute certification of fire safety, biocompatibility, environmental safety, or commercial readiness.
- A single successful system validates a design pattern, not field-wide consensus.

# Failure Modes

- The primary variable produces no measurable change in reaction, structure, or process indicators.
- Conversion or network formation improves, but target functional endpoints worsen.
- A property improves while a critical constrained property degrades beyond acceptable bounds.
- The apparent optimum is not statistically distinguishable from nearby levels.
- Controls show the same effect as the test system, indicating confounding by density, morphology, or processing artifacts.
- Mechanism evidence points to dilution, phase separation, migration, or measurement artifacts rather than the intended structural role.
- Reproducibility is poor or batch variation obscures the trend.
- Performance disappears after aging, reprocessing, or repeated cycling.

# Validity Checks

Before finalizing a research plan or interpreting results, verify:

- **Confounding**: Could sample geometry, thickness, void content, curing differences, additive migration, or processing artifacts explain the result?
- **Reproducibility**: Are independent batches, repeated cycles, and replicate-level consistency reported?
- **Statistical validity**: Are superiority claims avoided when differences fall within variability? Are effect sizes reported alongside significance?
- **Mechanism validity**: Do structural, thermal, functional, and residue or morphology observations converge on the same explanation?
- **Boundary validity**: Are claims limited to tested matrices, additive classes, process conditions, sample geometries, and service scenarios?
- **Evidence labeling**: Are paper-supported patterns separated from new-system inferences and speculative extensions?

# Provenance

- Synthesized from cluster 7, subcluster 7.0 (composite-thermoset-flame-retardant-polymer mechanism discovery and validation).
- Source skills: bio-thermoset-catalyst-research (10.3390_polym18040508); polymer-vitrimer-flame-retardant-design (10.1002_pol.20230211); polymer-flame-retardant-composite-planning (10.3389_fchem.2023.1096526); bio-dopo-thermoset-flame-retardant-discovery (10.1016_j.colsurfa.2023.132815); bio-based-nipu-coating-exploration (10.3390_polym9120649); composite-drilling-flammability-exploration (10.1007_s12221-025-01287-3); bladder-composite-process-exploration (10.22146_jmpc.51411); recyclable-flame-retardant-thermoset-design (10.1016_j.compositesb.2023.110667).
