---
name: sci-fusion-magnetic-confinement-research-workflow-b9793909
description: End-to-end hypothesis-driven research workflow for magnetic confinement fusion and plasma systems, from gap identification and mechanism hypothesis generation through minimal viable validation design, multi-source analysis, and iterative update with explicit claim boundaries.
scienceevolve-title: "Magnetic confinement fusion · magnetic confinement research workflow"
scienceevolve-area: magnetic-confinement-fusion
---

## Purpose

Synthesize a reusable, non-operational workflow for agent-guided scientific exploration in magnetic confinement fusion and related high-temperature plasma systems. The workflow translates system-level performance goals into falsifiable mechanism hypotheses, designs minimal viable validation with strong controls, and iterates based on structured evidence—without reproducing device-specific parameters, fabrication recipes, or hazardous operational protocols.

## When to use

Trigger when the user needs to:
- Formulate new research questions or candidate bottlenecks in confinement, stability, transport, boundary control, or integrated steady-state operation.
- Compare configurations, modes, or design concepts across magnetic confinement approaches (e.g., tokamak, stellarator, heliotron, RFP).
- Design non-operational validation plans (simulation, diagnostic strategy, conceptual experiment, or data reanalysis) for mechanism claims.
- Iterate hypotheses based on multi-source evidence and explicit failure modes.

Do not trigger when the user requests:
- Executable operational parameters, run schedules, or hazardous on-site procedures.
- A plain literature summary without hypothesis generation or validation design.
- Domain-agnostic statistical analysis divorced from confinement physics context.

## Inputs required

Before execution, confirm or assume:
- **System scope**: Target device class or model, magnetic topology, and operating regime.
- **Performance goal**: The system-level capability to improve (e.g., confinement, stability margin, heat-load distribution, steady-state duration).
- **Evidence base**: Available literature, simulation outputs, diagnostic descriptions, baseline designs, or empirical scalings.
- **Constraints**: Safety and compliance boundaries, diagnostic coverage, model validity ranges, and resource limits.
- **Output scope**: Desired deliverables (hypothesis matrix, validation roadmap, analysis plan, iteration log).

## Core Workflow

1. **Define system goal and decompose bottlenecks**
   - State the system-level objective in one sentence.
   - Identify 3–5 candidate failure modes or performance gaps that could limit the goal.
   - *Decision gate*: If the goal is not falsifiable or the system scope is undefined, stop and request clarification.

2. **Map mechanism hypotheses**
   - For each candidate bottleneck, generate at least one mechanism hypothesis in the form: “If X is changed, then mechanism Y alters observable Z, advancing goal G.”
   - Annotate each hypothesis with: evidence strength (high / medium / low), key assumptions, boundary conditions, and plausible failure modes.
   - *Decision gate*: If no hypothesis can be framed with an observable mediator and a falsifiable prediction, return to step 1 and narrow the bottleneck.

3. **Design minimal viable validation (MVV)**
   - Select the smallest set of variables and controls that can test the critical link in the mechanism chain.
   - Define:
     - **Positive control**: a condition expected to produce the target mechanism signature.
     - **Negative control**: a condition expected to suppress the signature.
     - **Strong control**: a benchmark or alternative-mechanism comparison to exclude confounding.
   - Specify abstract variable categories (control, mediator, response) without device-specific operational setpoints.
   - *Stop condition*: If the MVV requires violating safety boundaries, breaching model validity, or executing hazardous procedures, halt and redesign as a lower-fidelity study.

4. **Plan analysis and evidence grading**
   - Prescribe data-quality checks (calibration, alignment, coverage, missing data).
   - Commit to separating descriptive trends, correlations, mechanism indicators, and causal evidence.
   - Define visualization and comparison strategy (parameter-space maps, profile comparisons, time-series, mechanism diagrams).
   - Set evidence-grade criteria:
     - **Supported**: primary and mechanism indicators move coherently; controls exclude major alternatives.
     - **Partially supported**: only one indicator moves, or an unexplained cost/offset appears.
     - **Not supported**: primary indicator unchanged or confounding explanation fits better.
   - *Iteration gate*: If data quality is insufficient to assign a grade, pause for diagnostic or model improvement before proceeding.

5. **Execute conceptual validation and grade results**
   - Run the planned simulation, diagnostic analysis, or conceptual experiment.
   - Compare outcomes against the evidence-grade criteria.
   - Document deviations between prediction and observation, and update the mechanism diagram with uncertainty locations.

6. **Iterate or redesign**
   - **If supported**: expand validation scope (cross-configuration, extended parameter window, additional system-level metrics) while checking for coupling penalties.
   - **If partially supported**: split the mechanism chain, tighten controls, or add independent cross-checks before scaling up.
   - **If not supported**: abandon or narrow the mechanism path; redefine boundary conditions or failure modes.
   - **If coupling penalties emerge**: treat the penalty as a new optimization target rather than accepting single-metric improvement.
   - *Stop condition*: Stop when further iteration yields diminishing discriminatory power, exceeds model validity, or requires operational details outside the research-design scope.

7. **Package outputs and boundary claims**
   - Assemble the hypothesis matrix, validation record, analysis summary, and updated iteration roadmap.
   - Explicitly label what is migrated method, what is inferred, and what remains unverified.

## Output Format

The agent must produce a structured report containing:
1. **Research question definition** — system goal, candidate bottlenecks, evidence base, constraints.
2. **Hypothesis matrix** — hypothesis statement, mechanism path, evidence strength, key assumptions, failure modes, minimal viable validation.
3. **Validation design** — MVV description, variable categories, positive/negative/strong controls, evaluation metrics, stop conditions.
4. **Analysis plan** — data-quality checks, modeling/statistical approach, visualization strategy, grading criteria.
5. **Iteration roadmap** — actions for supported / partially supported / not supported outcomes, plus extrapolation boundaries.
6. **Validity and safety notes** — confounders, repeatability, boundary conditions, evidence-level distinctions, and non-operational compliance reminders.

## Validation Gates

- **Falsifiability gate** (Step 2): Every hypothesis must specify an observable that could refute it.
- **Safety gate** (Step 3): Validation designs must remain at the research-planning level; no hazardous operational specifics.
- **Evidence-grade gate** (Step 4): Results cannot be graded “supported” without at least one independent cross-check or strong control.
- **Iteration gate** (Step 6): A hypothesis may only be escalated to broader validation after coupling penalties and boundary conditions are reviewed.

## Claim Boundaries

- Distinguish **method migration** (reusable patterns abstracted from source skills) from **new inferences** (agent-generated claims about the user’s specific problem).
- Distinguish **established evidence** (multi-source, replicated) from **single-source or model-dependent evidence**.
- Claims about cross-device or cross-regime applicability must be tagged with explicit re-validation requirements for geometry, topology, collisionality, and transport dominance.
- Do not present simulation trends, single-device observations, or conceptual designs as engineering approvals or operational licenses.

## Failure Modes

- **Hypothesis drift**: Mechanism claims become untethered from the original system goal or observable mediator.
- **Control failure**: Negative or strong controls fail to exclude confounding, leading to false mechanism attribution.
- **Single-metric optimization**: Improving one indicator while ignoring stability, boundary load, or repeatability penalties.
- **Extrapolation overreach**: Applying empirical scalings or model conclusions beyond their validated parameter range.
- **Operational overstep**: The agent supplies executable run parameters, material handling steps, or safety-critical procedures instead of research designs.

## Validity Checks

- **Confounders**: Are uncontrolled variables (geometry, boundary conditions, source location, diagnostic drift, model assumptions) likely to co-vary with the intervention?
- **Repeatability**: Can the target response be reproduced under equivalent conditions with independent diagnostics or alternative analyses?
- **Boundary conditions**: Do conclusions depend on specific magnetic topology, scale, drive method, or material state that may not transfer?
- **Statistical validity**: Are uncertainty ranges, sampling coverage, sensitivity to outliers, and multiple-comparison risks reported?
- **Mechanistic consistency**: Do core indicators, mediator signals, stability metrics, and boundary metrics form a coherent chain?
- **Model validity**: Are reduced-model assumptions, ignored terms, and numerical convergence limitations documented?
- **Safety and compliance**: Does the output remain within non-operational research design, avoiding hazardous protocols and preserving institutional review boundaries?

## Provenance

- Synthesized from cluster `9.0` (magnetic confinement fusion / stellarator hypothesis workflows).
- Source skills referenced: `magnetic-confinement-research-workflow`, `helical-fusion-conceptual-design-workflow`, `stellarator-shear-layer-research-design`, `hts-nonplanar-stellarator-coil-exploration`, `helical-plasma-zonal-flow-research`, `fusion-steady-state-research-workflow`, `high-power-gyrodevice-research-workflow`, `fusion-boundary-exhaust-research-workflow`.
- Method patterns were abstracted; no device-specific parameters, numerical results, or paper conclusions were retained.
