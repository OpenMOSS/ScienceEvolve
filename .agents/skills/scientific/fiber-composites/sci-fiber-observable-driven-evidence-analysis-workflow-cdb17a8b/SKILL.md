---
name: sci-fiber-observable-driven-evidence-analysis-workflow-cdb17a8b
description: A reusable end-to-end workflow for designing research studies that test mechanism-linked claims in complex coupled systems through staged validation, strong controls, and iterative claim auditing.
scienceevolve-title: "Fiber composites and battery materials · observable driven evidence analysis workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Guide an agent to design reusable, end-to-end research plans for complex systems where a proposed mechanism, structure, or intervention is claimed to improve an outcome under operational or physical constraints. The workflow emphasizes observable-driven validation, explicit claim bounding, and iterative redesign rather than reproducing domain-specific conclusions.

# When to use

Use this skill when a user asks to:
- Propose research questions involving coupled mechanisms, trade-offs, or constrained optimization in physical, engineered, or algorithmic systems.
- Design experiments, simulations, or hybrid studies that link a controllable variable to an outcome through a hypothesized mechanism.
- Audit, bound, or critique claims about performance, efficiency, environmental impact, or process quality.
- Iterate hypotheses based on staged evidence from models, simulations, or controlled comparisons.

Do not use as a general literature summary tool or for operational deployment instructions.

# Inputs required

Before designing a study, collect or infer:

- **System and domain**: the class of material, process, algorithm, or network under study.
- **Target outcome**: the primary metric and the bottleneck or trade-off to address.
- **Proposed intervention or explanatory variable**: the controllable factor hypothesized to drive change.
- **Baseline or reference**: the conventional, unmodified, or standard approach for comparison.
- **Available evidence**: data sources, simulation capabilities, experimental access, or literature benchmarks.
- **Hard constraints**: feasibility limits, safety boundaries, computational budgets, or operational rules that must not be violated.
- **Validation setting**: offline, simulation-only, controlled test, or hybrid.

# Core Workflow

Follow this ordered route. Do not skip a gate.

1. **Frame the decision problem and claim boundary**
   - Define the bottleneck, trade-off, or mismatch between baseline and proposed approach.
   - Identify the controllable variable, expected outcome, and hard constraints.
   - State what would falsify the claim.
   - *Gate — Plausibility*: Stop if the claim lacks a testable mechanism or contradicts known physical, logical, or operational bounds.

2. **Generate falsifiable, mechanism-linked hypotheses**
   - Produce a ranked set of hypotheses. For each, specify:
     - Concise causal claim.
     - Mechanistic pathway.
     - Evidence strength (high / medium / low / speculative).
     - Key assumptions.
     - Likely failure modes.
     - Boundary conditions.
     - Minimal test capable of upgrading or downgrading confidence.
   - *Gate — Discriminability*: Reject hypotheses that cannot be distinguished from confounders using available or obtainable evidence.

3. **Design minimal viable validation (MVV)**
   - Define independent variables, dependent variables, and controlled nuisance variables.
   - Specify strong controls:
     - Matched baseline (conventional or unmodified).
     - Negative control (intervention absent or minimized).
     - Positive control (condition expected to succeed).
     - Ablation or strong control (removes proposed mechanism while keeping other factors constant).
   - Choose metrics that test mechanism intermediates as well as top-line outcomes.
   - Predefine stop conditions.
   - *Gate — Feasibility*: Stop if no matched baseline or valid control exists, or if the design requires violating hard constraints.

4. **Collect evidence in staged fidelity**
   - **Stage A — Consistency**: Check model/theoretical feasibility, physical plausibility, and numerical stability.
   - **Stage B — Offline/Simulation**: Run controlled comparisons under idealized or historical conditions; validate intermediate observables.
   - **Stage C — Controlled empirical**: Conduct physical or operational tests only after Stage B passes and ethical/operational review is satisfied.
   - *Gate — Advancement*: Advance to the next stage only if the prior stage satisfies feasibility, stability, and mechanism-alignment checks.

5. **Analyze observable evidence**
   - Inspect structural, mechanistic, or intermediate observables before evaluating top-line performance.
   - Compare proposed and baseline conditions on identical instances, geometries, scenarios, or datasets.
   - Quantify uncertainty, sampling adequacy, and sensitivity to inputs.
   - Examine residuals for unexplained trends that indicate missing mechanisms or confounders.
   - *Gate — Mechanism alignment*: If intermediate observables contradict the hypothesized pathway, proceed to redesign rather than claim success.

6. **Audit claims and bound generalization**
   - Label each finding as theoretical, simulated, or empirical.
   - Verify that gains are not achieved by relaxing hard constraints, changing evaluation rules, or selecting favorable subgroups.
   - State explicit boundary conditions (geometry, scale, load, environment, material class, algorithm instance).
   - *Gate — Robustness*: Downgrade or reject claims that fail sensitivity checks, lack independent validation, or rely on unverified extrapolation.

7. **Iterate or terminate**
   - **If supported**: Refine the claim boundary, tighten assumptions, and plan broader validation or transfer tests.
   - **If weak or contradictory**: Attribute failure (mechanism, model, measurement, confounder, or constraint violation), redesign the intervention or hypothesis, and return to Step 2 or 3.
   - **If infeasible or unsafe**: Terminate, document failure modes, and report residual risks.
   - *Stop condition*: Terminate when claims are bounded by reproducible evidence, or when redesign is infeasible or violates safety/operational limits.

# Output Format

Return a structured research plan containing:

1. **Research question and claim boundary** — the decision problem and falsification criteria.
2. **Mechanism map** — inputs, state variables, proposed causal chain, and expected failure modes.
3. **Ranked hypotheses table** — claim, evidence strength, key assumptions, likely failure modes, boundary conditions, and minimal test.
4. **Study plan** — variables, control table (baseline, negative, positive, ablation), metrics, and staged validation design.
5. **Analysis plan** — feasibility checks, structural/intermediate checks, sensitivity tests, uncertainty handling, and residual inspection.
6. **Validation plan** — robustness gates, claim-audit criteria, and generalization bounds.
7. **Iteration rules and stop conditions** — decision tree for support, redesign, or termination.
8. **Provenance and evidence labels** — what is derived from prior method patterns versus agent-inferred extensions.

# Validation Gates

- **Feasibility gate**: Hard constraints must be satisfied before comparing objective improvements.
- **Mechanism gate**: Structural or intermediate observables must align with top-line outcome trends.
- **Control gate**: Comparisons must use matched baselines; ablations must isolate the proposed variable from confounders.
- **Robustness gate**: Results must survive sensitivity to inputs, uncertainty, boundary perturbations, and subgroup variation.
- **Generalization gate**: Claims must be explicitly bounded to tested conditions and labeled by evidence type.

# Claim Boundaries

- Distinguish paper-supported method patterns from agent-inferred extensions to new systems.
- Do not treat single-study or single-instance results as field-wide consensus.
- Limit causal claims to the tested geometry, material class, load case, environmental window, or algorithm parameter regime.
- Separate model validity from real-world transfer; simulation and theory require independent empirical checks before operational claims.

# Failure Modes

- **Mechanism failure**: Intermediate observables do not support the proposed causal chain.
- **Confounding**: Gains are explained by unmeasured variables, baseline unfairness, mesh density, load selection, or scenario design rather than the intervention.
- **Sparse support**: The hypothesis relies on rare or unobserved intervention ranges, subgroups, or environmental states.
- **Constraint violation**: Improvements come from relaxing hard operational, safety, or feasibility limits.
- **Instability**: Results are sensitive to initial states, sampling length, parameter choices, or small perturbations.
- **Overgeneralization**: Extrapolating beyond tested boundaries without new evidence or explicit uncertainty quantification.

# Validity Checks

- **Confounding**: List variables that affect both intervention assignment and outcome; verify they are pre-intervention or adequately controlled.
- **Reproducibility**: Document data definitions, preprocessing, model selection, random seeds, coordinate frames, and evaluation splits.
- **Statistical validity**: Use calibration, uncertainty intervals, pre-specified metrics, and multiple-comparison awareness.
- **Boundary conditions**: Test at least one simpler and one more difficult case; report where the mechanism may fail.
- **External validity**: Avoid generalizing beyond tested component families, systems, or validation methods.
- **Safety and ethics**: Keep recommendations at the research-design level; defer operational execution to qualified personnel and institutional review.

# Provenance

- Derived from cluster 47.0 (composite-carbon-aware-optimization-evidence-analysis-workflow) and the observable-driven evidence analysis archetype.
- Synthesized from source skills: counterfactual-markdown-research-workflow, aligned-nanofiber-triboelectric-sensor-design, geometry-aware-composite-patch-placement, carbon-aware-routing-research, dynamic-resource-placement-research, composite-cure-transport-reaction-exploration, textile-weaving-process-parameter-design, electrolyte-solvation-transport-workflow.
- Preserves shared patterns: mechanism-linked hypothesis generation, staged validation with strong controls, ablation and sensitivity analysis, iterative claim bounding, and non-operational safety guardrails.
