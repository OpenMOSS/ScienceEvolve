---
name: sci-fiber-evidence-analysis-claim-audit-workflow-dfc8f94f
description: A reusable end-to-end workflow for generating mechanism-linked hypotheses, designing minimal validation plans, and auditing scientific claims through orthogonal evidence, control comparison, and iterative claim bounding across materials and chemistry domains.
scienceevolve-title: "Fiber composites and battery materials · evidence analysis claim audit workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Use this skill to transform an open research question into an auditable, evidence-based claim. It guides an agent to generate mechanism-linked hypotheses, design minimal validation with matched controls, discriminate among competing mechanisms using orthogonal evidence, and bound conclusions by explicitly labeling evidence strength, assumptions, and extrapolation limits. The workflow is domain-agnostic but optimized for research contexts where microstructure, mechanism, and performance must be co-validated.

## When to use

Use this skill when the user needs to:

- Explore a new research question in materials, composites, catalysis, or chemical systems where mechanism is uncertain.
- Generate testable hypotheses and discriminate among competing mechanistic explanations.
- Design minimal validation experiments or simulations with appropriate controls and stop conditions.
- Audit an existing claim by checking evidence chains, confounders, and boundary conditions.
- Iterate from initial results to refined hypotheses or redesigned studies.

Do not use this skill for executing operational protocols, providing hazardous procedural details, or as a substitute for domain-specific safety and regulatory review.

## Inputs required

- **Research gap or claim to audit**: the specific phenomenon, performance gap, or causal assertion under investigation.
- **Mechanism context**: candidate pathways, known kinetic or thermodynamic constraints, and relevant theoretical frameworks.
- **Evidence inventory**: available experimental, computational, or literature evidence with provenance and known limitations.
- **System boundaries**: material classes, environmental conditions, and applicability limits relevant to the claim.
- **Evaluation priorities**: the primary metrics (e.g., mechanical, kinetic, structural, environmental) and acceptable uncertainty.
- **Constraints**: non-operational safety boundaries, resource limits, replication needs, and stopping criteria.

## Core Workflow

Execute the following stages in order. Do not proceed past a gate until its condition is satisfied.

**Stage 1 – Scope the Gap and Bound the Claim**
Define the research question as a specific, falsifiable gap in mechanism, performance, or evidence. State the initial claim and its intended scope.
- *Decision Gate*: If the claim is too broad to test with available methods, narrow or split it before continuing.

**Stage 2 – Generate Mechanism-Linked Hypotheses**
Map dominant variables to candidate mechanisms. For each hypothesis record: expected benefit, key assumption, minimal observable evidence, likely failure mode, and evidence strength (Strong / Moderate / Weak / Speculative). Rank by decisiveness.
- *Stop Condition*: If no hypothesis can be falsified with attainable evidence, stop and redefine the question.

**Stage 3 – Design Minimal Validation**
Select one dominant mechanism to isolate. Define independent variables (vary one mechanism-relevant factor at a time), dependent variables, and controlled boundaries. Specify controls: baseline, negative (mechanism-suppressed), positive benchmark, and robustness (batch/replicate). Predefine metrics, failure criteria, and stop conditions.
- *Decision Gate*: If controls cannot isolate the proposed mechanism, redesign before any data collection.

**Stage 4 – Collect Orthogonal Evidence**
Gather evidence using at least two independent methods suited to the claim (e.g., structural and kinetic; simulation and experiment). Record confounders and deviations.
- *Stop Condition*: If primary controls fail or replication variance exceeds predefined thresholds, halt and troubleshoot.

**Stage 5 – Discriminate Mechanisms and Update Evidence**
Compare results against predictions for each hypothesis. Use control outcomes to implicate or exclude specific mechanistic steps. Require two independent measurements before mechanism assignment. Update evidence strength: strengthen on orthogonal alignment, weaken on single-line support, discard on contradiction.
- *Iteration Gate*: If results are ambiguous, add a discriminating control or narrow the hypothesis scope rather than optimizing conditions.

**Stage 6 – Bound the Claim**
Separate direct observation from inference. Define boundary conditions: material classes, environmental contexts, measurement limits, and extrapolation risks. Label conclusions as observed, inferred, or speculative.
- *Decision Gate*: If the claim exceeds tested boundaries, flag as extrapolation and require additional validation.

**Stage 7 – Audit Robustness and Failure Modes**
Check confounding factors, statistical validity, model assumptions, and reproducibility. Document failure modes such as hidden variables, measurement artifacts, or mechanism misassignment.
- *Stop Condition*: If robustness checks fail, return to Stage 2 or Stage 3.

**Stage 8 – Iterate or Finalize**
If the hypothesis is supported and bounded, document outputs and plan extension. If partially supported, reformulate and return to Stage 2. If falsified, pivot to the next-ranked hypothesis.
- *Final Gate*: Finalize outputs only when claim boundaries, validity checks, and provenance are fully documented.

## Output Format

When using this skill, produce:

1. **Research question and scoped claim**: the gap, mechanism, and intended boundary.
2. **Hypothesis table**: hypothesis, evidence strength, key assumptions, minimal validation, likely failure modes.
3. **Minimal validation plan**: variables, controls, metrics, replication logic, and stop conditions.
4. **Evidence integration map**: orthogonal evidence, control interpretation, and mechanism discrimination.
5. **Claim boundary statement**: observed vs. inferred, applicable domains, and extrapolation limits.
6. **Failure mode and robustness audit**: confounders, reproducibility checks, and residual risks.
7. **Iteration plan**: next steps if supported, falsified, or ambiguous.
8. **Provenance log**: cluster/subcluster/source-skill references and evidence labeling.

## Validation Gates

- **Falsifiability Gate**: Every hypothesis must have a defined observation that would reject it.
- **Control Gate**: No claim is accepted without matched baseline, negative, and positive controls where feasible.
- **Orthogonality Gate**: Mechanism assignments require at least two independent evidence lines.
- **Replication Gate**: Reported effects must exceed predefined variability thresholds across independent runs or samples.
- **Boundary Gate**: Claims must explicitly state material, environmental, and methodological boundaries.
- **Safety Gate**: All plans remain at research-design level; no executable hazardous protocols are generated.

## Claim Boundaries

- Distinguish **paper-verified** (observed in specific source systems), **transferable inference** (plausible but requiring validation), **agent-inferred** (new hypothesis), and **unsupported** claims.
- Do not generalize from a single system to an entire material class, reaction type, or environmental condition.
- State whether conclusions apply only to tested compositions, geometries, processing routes, or measurement conditions.
- Flag cross-domain transfers (e.g., small-molecule to polymer, bulk to surface) as hypotheses until validated.

## Failure Modes

- **Mechanism misassignment**: Inferring causation from a single metric or uncontrolled correlation.
- **Control failure**: Baseline or negative controls fail, making treatment effects uninterpretable.
- **Overextrapolation**: Extending conclusions beyond tested boundaries without validation.
- **Hidden confounding**: Unmeasured variables (e.g., moisture, batch variability, processing history) dominate the outcome.
- **Orthogonality gap**: Only one evidence type supports the claim, leaving it vulnerable to measurement artifacts.
- **Premature optimization**: Optimizing conditions before discriminating between competing mechanisms.
- **Irreproducibility**: High replicate variance or undocumented procedural drift invalidates conclusions.

## Validity Checks

- **Confounding**: Are uncontrolled variables (source, history, environment, measurement bias) influencing the result?
- **Statistical validity**: Are replicates, uncertainty estimates, and effect-size interpretations predefined and reported?
- **Mechanistic validity**: Are mechanism claims supported by at least two independent measurements?
- **Model validity**: Are simulation or analytical assumptions (closure, boundary conditions, geometry) justified and sensitivity-checked?
- **External validity**: Does the evidence support the intended application context, or only a narrow screening condition?
- **Reproducibility**: Are design matrices, controls, analytical bases, and decision rules documented for independent evaluation?

## Provenance

- This workflow synthesizes shared patterns from cluster `68.1` (evidence analysis and claim audit).
- Source skill references: `photoredox-hat-dearomatization-exploration`, `fiber-composite-load-transfer-research`, `red-mud-fiber-composite-exploration`, `natural-fiber-composite-research-exploration`, `polyester-fate-hypothesis-workflow`, `silyl-radical-materials-exploration`, `biopolymer-active-packaging-film-exploration`, `fiber-composite-flow-orientation-research`.
- Treat all source skills as prior evidence clusters, not as field-wide consensus. Label all outputs derived from specific source systems accordingly.
