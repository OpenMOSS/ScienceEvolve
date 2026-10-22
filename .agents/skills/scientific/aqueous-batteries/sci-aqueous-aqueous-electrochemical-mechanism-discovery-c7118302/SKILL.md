---
name: sci-aqueous-aqueous-electrochemical-mechanism-discovery-c7118302
description: A reusable end-to-end workflow for generating, testing, and iterating mechanism hypotheses in aqueous electrochemical systems, emphasizing bottleneck decomposition, orthogonal validation, and claim bounding.
scienceevolve-title: "Aqueous battery interfaces · aqueous electrochemical mechanism discovery workflow"
scienceevolve-area: aqueous-battery-interfaces
---

# Purpose

This skill converts observed performance limits in aqueous electrochemical systems into reusable, mechanism-focused research plans. It teaches an agent to decompose bottlenecks into coupled failure modes, generate competing hypotheses, design minimal validation experiments with strong controls, analyze evidence in orthogonal layers, and iterate based on mechanism–performance convergence rather than single-metric improvement.

# When to use

Use this skill when the user asks to:

- Propose new research questions for aqueous electrochemical systems such as rechargeable batteries, electrodeposition, or interfacial energy devices.
- Design non-operational validation plans for material, interface, electrolyte, or architectural modifications.
- Evaluate whether a proposed intervention has a plausible mechanism–performance link.
- Critique a draft plan for missing controls, weak mechanistic evidence, or overgeneralized claims.
- Iterate after early structural, electrochemical, or morphological data diverge from the initial hypothesis.

Do not use this skill for operational synthesis recipes, executable testing protocols, hazardous parameter specifications, safety certification, or treating a single study as field-wide consensus.

# Inputs required

Before generating a plan, request or infer:

- Target system class and application context.
- Bounded performance bottleneck (e.g., instability, transport limitation, interfacial degradation, irreversibility).
- Candidate design lever(s) and the proposed mechanism(s).
- Available diagnostic categories: structural, chemical, morphological, electrochemical, kinetic, or modeling.
- Baseline and candidate control systems.
- Constraints: safety, environmental, reproducibility, and institutional boundaries.
- Desired output: hypothesis map, experimental design schema, analysis plan, critique, or iteration strategy.

If key inputs are missing, state assumptions explicitly and mark conclusions as provisional.

# Core Workflow

## 1. Bottleneck decomposition and scope bounding

Define the performance limit independently of the proposed solution. Decompose it into mechanism families such as carrier transport, interfacial chemistry, structural evolution, nucleation and growth, or side reactions. Map feedback loops among these families.

- **Decision Gate 1 (DG1)**: Is the bottleneck measurable, bounded to a clear system class, and defined without reference to the proposed fix?
  - *If no*: Stop. Refine the scope and restate the bottleneck before proceeding.

## 2. Mechanism mapping and hypothesis generation

Generate at least three competing, falsifiable hypotheses. For each, specify:

- A causal chain: design lever → target mechanism → expected intermediate signal → system-level outcome.
- Evidence strength label (weak, moderate, strong, speculative).
- Key assumptions and most likely failure mode.
- An artifact hypothesis that attributes apparent improvement to confounders such as loading, surface area, or measurement bias.

- **Decision Gate 2 (DG2)**: Are the hypotheses mutually exclusive where possible, and do they predict distinct mechanistic signatures testable with available diagnostics?
  - *If no*: Reformulate hypotheses until they are discriminable.

## 3. Minimal validation design

Design the smallest experiment that can discriminate among the hypotheses. Specify:

- **Comparison groups**: baseline, candidate system, negative control, structural control, chemical/artifact control, and stability control.
- **Variables**: independent (design lever class), dependent (mechanism and performance proxies), and controlled (formulation, environment, measurement context).
- **Success criteria**: predefined evidence required to support a mechanism (e.g., convergent orthogonal signatures plus performance trend).
- **Stop conditions**: inconclusive controls, dominant side reactions, safety blockers, or unexplained variability.

- **Decision Gate 3 (DG3)**: Can the design isolate the target mechanism from formulation, morphology, and measurement artifacts?
  - *If no*: Redesign controls or add diagnostic layers before execution.

## 4. Layered evidence analysis

Analyze results in ordered layers:

1. **Quality layer**: check normalization, batch labeling, comparability, and reproducibility.
2. **Performance layer**: compare functional metrics across baseline, candidate, and control groups.
3. **Mechanism layer**: triangulate orthogonal evidence (structure, chemistry, kinetics, morphology, modeling). Treat performance improvement as meaningful only if mechanism-facing measurements support the proposed model.
4. **Artifact layer**: evaluate confounders (surface area, loading, impurity, aging, measurement bias).
5. **Synthesis layer**: classify each hypothesis as supported, plausible, weakened, refuted, or unresolved.

- **Decision Gate 4 (DG4)**: Do at least two independent evidence streams converge on the same mechanism?
  - *If no*: Flag as ambiguous. Do not claim mechanism. Return to Step 3 with targeted diagnostics.

## 5. Hypothesis update and iteration

Update the research model based on the evidence pattern:

- **Convergence**: Mechanism and performance align. Strengthen the claim, then test boundary conditions (different host class, stress level, or device context).
- **Performance only**: Metrics improve without mechanism evidence. Do not claim mechanism. Generate alternative hypotheses and add the missing orthogonal evidence stream.
- **Mechanism only**: Mechanism evidence exists without performance gain. Identify the next bottleneck (e.g., transport limitation, interface blocking).
- **Control failure**: Controls suggest artifact-driven results. Reclassify as design-development evidence and redesign the control set.
- **Boundary divergence**: Results differ across system classes. Narrow the claim scope and generate a mismatch hypothesis.

- **Decision Gate 5 (DG5)**: Is the updated claim robust across replicates, free from artifact, and bounded to the tested scope?
  - *If no*: Return to Step 2 or 3.

## 6. Claim bounding and reporting

Separate verified observations from inferred mechanisms and speculative extrapolations. State boundary conditions (material family, medium class, device context). Document residual uncertainty and tradeoffs.

- **Decision Gate 6 (DG6)**: Are all claims limited to the tested scope, labeled by evidence strength, and distinguished from source-paper inferences?
  - *If no*: Revise reporting before delivery.

# Output Format

When using this skill, return:

1. **Research question**: concise problem statement and boundary conditions.
2. **Bottleneck map**: decomposed mechanism families and feedback loops.
3. **Hypotheses**: at least three competing hypotheses, each with evidence strength, key assumptions, predicted observations, and failure modes.
4. **Minimal validation schema**: comparison groups, conceptual variables, evaluation metrics, and stop conditions.
5. **Layered analysis plan**: quality, performance, mechanism, artifact, and synthesis layers.
6. **Iteration rules**: actions for convergence, performance-only, mechanism-only, control-failure, and boundary-divergence outcomes.
7. **Validity checklist summary**: key confounders, reproducibility needs, and boundary limits.
8. **Safety and ethics boundaries**: non-operational constraints and institutional compliance reminders.

# Validation Gates

- **Scope independence (DG1)**: The bottleneck must be defined independently of the proposed fix and bounded to a system class.
- **Falsifiability (DG2)**: Hypotheses must predict distinct mechanistic signatures and include an artifact alternative.
- **Control sufficiency (DG3)**: The design must include baseline, negative, structural, chemical, and stability controls adequate to isolate the target mechanism.
- **Orthogonal convergence (DG4)**: Mechanism claims require agreement across at least two independent diagnostic principles.
- **Robustness (DG5)**: Findings must be consistent across replicates or independent batches, and claims must be bounded to the tested context.
- **Boundary awareness (DG6)**: Final claims must specify the material family, medium class, and device context, and must separate observation from inference.

# Claim Boundaries

- Distinguish **observed evidence** (direct measurements), **agent inference** (mechanism interpretation), and **speculation** (untested extensions).
- Limit causal claims to the tested material family, interface class, and aqueous medium context.
- Do not generalize single-format or component-level findings to full-device viability without direct evidence.
- Do not infer mechanism from performance improvement alone.
- Label source-paper-supported logic separately from new hypotheses generated for the target system.

# Failure Modes

- **Scope creep**: The bottleneck is ill-defined or conflated with the proposed solution, leading to untestable plans.
- **Hypothesis monoculture**: Only one hypothesis is considered, ignoring artifact or alternative mechanism explanations.
- **Control gap**: Missing structural, chemical, or artifact controls produce false mechanism claims.
- **Single-diagnosis dependence**: Relying on one measurement type for mechanism confirmation.
- **Performance–mechanism decoupling**: Improved metrics are driven by uncontrolled confounders (e.g., surface area, loading, contact quality).
- **Boundary overreach**: Extending claims beyond the tested system class, host structure, or operating context.
- **Iteration stall**: Ambiguous results trigger endless redesign because stop conditions were not predefined.

# Validity Checks

Before finalizing a plan or conclusion, verify:

- **Confounding control**: Are formulation, surface area, porosity, contact quality, conductive additive content, and measurement bias controlled or normalized?
- **Reproducibility**: Are independent batches, repeated diagnostics, or replicate cells included?
- **Statistical validity**: Are uncertainty, sensitivity analyses, variability, and effect sizes reported?
- **Mechanistic convergence**: Do structural, chemical, electrochemical, kinetic, and modeling results point to the same mechanism?
- **Boundary conditions**: Are claims limited to the tested system class and not generalized to all electrochemical devices?
- **Falsifiability**: Does the design include controls that could disprove the main claim?
- **Safety and ethics**: Are outputs kept at the research-design level, free of hazardous operational details?

# Provenance

- Cluster 41 / Subcluster 41.0: Observable-driven mechanism discovery and validation.
- Synthesized from representative source skills: `conductive-shell-zinc-battery-research`, `pba-aqueous-zinc-cathode-exploration`, `aqueous-zib-electrolyte-research-design`, `aqueous-metal-anode-exploration`, `electrochemical-film-growth-exploration`, `electrochemical-alloy-anode-workflow`, `aqueous-polyanionic-battery-exploration-workflow`, `sodiophilic-scaffold-sodium-metal-battery-exploration`.
- Source-specific systems, materials, numerical parameters, and paper conclusions have been removed; only the transferable workflow structure and methodological reasoning are retained.
