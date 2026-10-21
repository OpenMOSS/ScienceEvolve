---
name: sci-fiber-composite-fiber-interface-polymer-mechanism-d-6a5ab893
description: End-to-end mechanism discovery and validation workflow for composite, fiber-reinforced, and polymer systems, guiding hypothesis generation, staged experimentation, tiered analysis, and disciplined claim bounding.
scienceevolve-title: "Fiber composites and battery materials · composite fiber interface polymer mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Guide an agent through a reusable, end-to-end mechanism discovery and validation workflow for composite, fiber-reinforced, and polymer material systems. The workflow converts a performance gap or sustainability driver into ranked, falsifiable hypotheses; designs minimal, control-heavy experiments; analyzes results through a process-structure-property chain; and iterates or stops based on mechanism-level evidence rather than single-metric optimization. It treats no single source system as universal.

# When to use

Use this skill when a user asks to:

- Propose new research questions or mechanistic hypotheses in composite, fiber-reinforced, polymer, or hybrid material systems.
- Design controlled experiments for interface modification, fiber architecture, matrix behavior, porosity, or processing-structure-property relationships.
- Analyze tiered data to discriminate between material, interface, architecture, and process mechanisms.
- Iterate on a research plan after screening, structural, or mechanical results are available.

Do not use for clinical decision-making, operational fabrication recipes, hazardous procedural instructions, or universal design optimization without validation.

# Inputs required

Before generating a plan, request or infer:

- **Target system class**: matrix family, reinforcement type, fiber architecture, and intended service environment.
- **Performance gap or driver**: the limiting property, sustainability motivation, or application constraint.
- **Candidate mechanism levers**: interface chemistry, fiber ratio or loading, processing route, consolidation strategy, or architectural feature.
- **Available capabilities**: characterization methods, mechanical or functional tests, and modeling resources.
- **Constraints**: safety boundaries, equipment access, reproducibility limits, and regulatory or environmental considerations.
- **Decision context**: whether the goal is exploratory screening, mechanism validation, or confirmatory testing.

If inputs are missing, state assumptions explicitly and downgrade the plan to preliminary.

# Core Workflow

Follow this ordered route. Do not skip a gate unless its criteria are met.

## 1. Gap framing and hypothesis generation
- Define the performance gap and translate it into a mechanistic question about the interface, fiber architecture, matrix state, or process-induced structure.
- Map candidate mechanisms across three layers: material (composition, purity, compatibility), structure (distribution, voids, orientation, network density), and process (flow, consolidation, cure, deposition).
- Generate 2–5 ranked hypotheses. For each, specify: predicted structural mediator, predicted performance outcome, key assumptions, evidence strength (paper-supported / literature-supported / inferred / speculative), and likely failure modes.
- Include a competing hypothesis that attributes the expected effect to an alternative mechanism (e.g., defect population, batch variability, geometry difference).

**Gate 1 — Candidate Gate**: Proceed only if every hypothesis is falsifiable, links a structural mediator to a performance outcome, and defines a discriminating experiment.

## 2. Staged study design
- Define a minimal viable validation set: baseline, negative control, positive control (if available and safe), and test conditions that vary one primary lever.
- Classify variables:
  - Independent: the mechanism lever under test.
  - Mediating: measurable structural features expected to change.
  - Outcome: mechanical, physical, or functional performance metrics.
- Predefine stop conditions: fabrication defects exceed a threshold, variability swamps effect size, or safety/compliance boundaries are reached.
- Avoid paper-specific numerical parameters, sample labels, or equipment recipes.

**Gate 2 — Design Gate**: Proceed only if the matrix isolates one primary lever, includes matched controls, and specifies sampling locations before data collection.

## 3. Quality-first data collection
- Record process stability indicators (repeatability, visible anomalies, batch consistency).
- Characterize structural mediators before interpreting performance: density, fiber-volume indicators, void content, distribution uniformity, interface quality, or network state.
- Collect outcome data under consistent conditioning, geometry, and protocol.

**Gate 3 — Stability Gate**: Halt if process instability, defect variation, or sampling bias is large enough to dominate the comparison. Redesign the process or controls before continuing.

## 4. Tiered mechanism discrimination
Analyze in layers:
- **Process layer**: Was the process stable and reproducible?
- **Structural layer**: Did the intended structural mediator change in the predicted direction and with acceptable uniformity?
- **Performance layer**: Did the outcome change relative to baseline and controls?
- **Confounder layer**: Can the result be explained by adsorption, leaching, geometry differences, support effects, dark reactions, or unequal exposure?
- **Trade-off layer**: Are gains offset by losses in toughness, durability, moisture resistance, or reproducibility?

**Gate 4 — Mechanism Gate**: If structural and performance evidence are inconsistent, generate competing explanations and return to Step 1 or 2. If consistent, proceed to claim bounding.

## 5. Iteration or redesign
- **Supported**: Narrow the design space and test boundary conditions (e.g., environmental exposure, long-term stability, or hybrid configurations).
- **Partial support**: Refine one design axis (e.g., treatment intensity, fiber ratio, consolidation method) while holding others constant.
- **Confounded**: Add structural characterization, matched geometry comparisons, or batch controls to resolve ambiguity.
- **Failed**: Document the negative result as boundary evidence; stop or pivot to a different mechanism lever.

**Gate 5 — Iteration Gate**: Advance only one design axis per cycle. Do not compound unvalidated changes. Stop if safety, compliance, or reproducibility limits are exceeded.

## 6. Claim bounding and validation
- Label every claim as observed, inferred, or hypothesized.
- State external validity limits: material class, fiber architecture, process route, specimen geometry, and environment.
- Document reproducibility requirements and residual risks.

**Gate 6 — Robustness Gate**: Finalize outputs only if claims are proportionate to evidence strength, controls are adequate, and boundary conditions are explicit.

# Output Format

Produce the following in order:

1. **Research question** — One concise system-level question with scope and motivation.
2. **Mechanism map** — Causal chain linking material, process, structure, and performance.
3. **Hypotheses table** — Columns: hypothesis, type, evidence strength, key assumption, predicted structural mediator, predicted performance effect, failure mode.
4. **Experimental design** — Study arms, variables, controls, minimal viable validation, strong-control extension, and stop conditions.
5. **Analysis plan** — Tiered measurement and interpretation logic, normalization rules, visualization approach, and criteria for mechanism support or rejection.
6. **Iteration plan** — Result-pattern triggers for continuation, refinement, or stopping.
7. **Validity and boundary statement** — Confounders, reproducibility risks, external validity limits, and non-operational safety boundaries.
8. **Evidence caveat** — Clear separation of paper-supported observations, literature trends, and new-system inferences.

# Validation Gates

| Gate | Criterion | Action if failed |
|------|-----------|------------------|
| Candidate Gate | Hypotheses are falsifiable, mechanistically specific, and include discriminating experiments. | Reframe gaps and regenerate hypotheses. |
| Design Gate | One primary lever is isolated; negative, positive, and process controls are included; sampling is predefined. | Redesign matrix and controls. |
| Stability Gate | Process variability and defect indicators are below predefined thresholds. | Stop performance interpretation; redesign process or batch handling. |
| Mechanism Gate | Structural mediator and performance changes are mutually consistent; confounders are ruled out. | Generate competing hypotheses; return to design or analysis. |
| Iteration Gate | Only one design axis changes per cycle; safety and reproducibility limits are respected. | Decompound variables or halt. |
| Robustness Gate | Claims are bounded by tested conditions and labeled by evidence strength. | Restrict claims and add qualifying language. |

# Claim Boundaries

- Distinguish **paper-supported observations**, **literature-supported trends**, **mechanistic inferences**, and **speculative extensions** for the new system.
- Limit causal claims to the tested matrix family, reinforcement class, architecture, process route, and environmental conditions.
- Treat screening results and single-system outcomes as hypothesis generators, not field-wide confirmations.
- Do not extrapolate to load-bearing, medical, food-contact, or environmental-deployment contexts without application-specific validation.
- Require independent replication before transferring conclusions to new material platforms or scales.

# Failure Modes

- **Defect dominance**: Fabrication defects or void variation obscure the intended mechanism.
- **Process instability**: Batch-to-batch or spatial variability exceeds the expected effect size.
- **Mediator mismatch**: Structural mediator changes without performance change, indicating an incorrect metric or hidden confounder.
- **Performance artifact**: Performance changes without structural evidence, suggesting unmeasured mechanisms or measurement bias.
- **Confounded variables**: Multiple factors vary together, preventing causal attribution.
- **Over-treatment degradation**: Excessive modification causes agglomeration, embrittlement, or interface damage.
- **Mechanism switching**: The dominant failure mode or rate-limiting step changes with temperature, loading, or environment.
- **Unsupported extrapolation**: Generalizing beyond the tested geometry, material class, or service conditions.

# Validity Checks

- **Confounding**: Are composition, impurity profile, processing history, and specimen geometry independently controlled?
- **Control adequacy**: Are baseline, negative, positive, process, and batch controls sufficient to isolate the lever?
- **Mechanistic consistency**: Do structural, thermal, mechanical, and morphological data converge on the same explanation?
- **Statistical validity**: Are replicates, variability, measurement uncertainty, and pre-defined thresholds reported?
- **Reproducibility**: Would an independent batch or laboratory be able to repeat the comparison?
- **Sampling bias**: Are specimens drawn from predefined locations, not cherry-picked post-hoc?
- **Measurement validity**: Are conditioning, geometry, and protocols identical across groups?
- **Evidence labeling**: Are claims clearly marked as observed, inferred, or hypothesized?

# Provenance

- Synthesized from cluster **42** / subcluster **42.0**.
- Derived from source skills: `byproduct-thermoset-formulation-workflow`, `natural-fiber-composite-interface-exploration`, `high-temp-composite-research-design`, `lightweight-foam-composite-research`, `recyclate-sandwich-composite-research`, `discontinuous-fiber-composite-process-design`, `immobilized-photocatalyst-research-pattern`, `in-situ-biomaterial-stent-research`.
- Paper-specific conclusions, numerical parameters, material systems, and operational protocols were excluded per merge requirements.
