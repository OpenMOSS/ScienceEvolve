---
name: sci-fiber-battery-materials-mechanism-discovery-workflo-296f9bb0
description: A reusable end-to-end workflow for observable-driven mechanism discovery and validation in battery and interfacial materials research, guiding hypothesis generation, controlled validation planning, orthogonal evidence triangulation, and iterative claim bounding without material-specific recipes.
scienceevolve-title: "Fiber composites and battery materials · battery materials mechanism discovery workflow"
scienceevolve-area: fiber-composites-and-battery-materials
---

# Purpose

Help an agent transform a performance bottleneck in battery or interfacial materials into a rigorous, reusable mechanism-discovery workflow. The skill guides hypothesis generation, controlled validation design, multi-evidence analysis, and iterative refinement without prescribing material-specific recipes or treating single-study results as field consensus.

# When to use

Use when the task is to plan research that explains why a material, interface, coating, binder, or electrode architecture succeeds or fails. Appropriate for battery electrodes, functional interlayers, catalyst hosts, conductive binders, self-healing polymers, and fiber-reinforced porous scaffolds where coupled mechanical, chemical, and transport mechanisms drive performance. Do not use for operational fabrication instructions, hazardous safety protocols, manufacturing scale-up, or summarizing a single paper as universal truth.

# Inputs required

- **Target system and bottleneck**: the active material, interface, or architecture and the observable failure mode limiting performance.
- **Candidate concept**: the proposed material or structural motif and its hypothesized mechanistic role.
- **Baseline comparator**: the standard system against which improvement and mechanism will be judged.
- **Capabilities and constraints**: available characterization methods, safety boundaries, resource limits, and acceptable evidence thresholds.

# Core Workflow

1. **Bottleneck Definition & Mechanism Mapping**
   - Start from an observable performance failure, not from material novelty.
   - Decompose the failure into candidate mechanisms (e.g., interfacial degradation, mass-transport limitation, mechanical collapse, kinetic blockage).
   - **Gate 1**: Is the bottleneck framed as a coupled mechanism rather than a single metric? If not, refine the problem statement before proceeding.

2. **Hypothesis Generation**
   - Produce 3–5 falsifiable, mechanism-based hypotheses. For each, specify:
     - Concise causal claim.
     - Triggering gap and mechanistic bridge.
     - Evidence strength (strong, moderate, weak, speculative).
     - Key assumptions and likely failure modes.
     - Transfer boundary where the analogy weakens.
   - Prioritize hypotheses that can be falsified by orthogonal measurements rather than by performance alone.
   - **Gate 2**: Can every hypothesis be disproven by a planned diagnostic? If not, reformulate.

3. **Validation Plan Design**
   - Define independent variables (design levers), dependent variables (observables), and controlled variables (held constant).
   - Assemble a control matrix:
     - Baseline control (standard architecture).
     - Negative control (lacks the proposed functional motif).
     - Mechanism-isolating control (varies one structural feature while holding others constant).
     - Positive control (established benchmark, when appropriate).
   - Select primary metrics (performance) and mechanistic metrics (structure, spectroscopy, transport, morphology).
   - Preset stop conditions: stop or redesign if the candidate worsens the baseline, improves one metric while severely harming another, lacks reproducibility, or cannot be mechanistically distinguished from controls.
   - **Gate 3**: Do controls isolate the proposed mechanism from confounders such as mass, loading, geometry, or processing differences? If not, redesign.

4. **Evidence Collection & Triangulation**
   - Gather orthogonal evidence across at least two independent categories (e.g., electrochemical, structural, spectroscopic, imaging, transport).
   - Build a mechanism table mapping each hypothesis against each evidence type.
   - **Gate 4**: Is there at least one independent diagnostic for each proposed function? If not, add targeted measurements before analysis.

5. **Causal Consistency Analysis**
   - Check whether performance changes align with mechanism diagnostics across all controls.
   - Test alternative explanations (e.g., additive redistribution, contact resistance, processing artifacts, measurement timing).
   - Label each conclusion:
     - Directly supported by new data.
     - Consistent with prior work but not independently proven.
     - Speculative and requiring further tests.
   - **Gate 5**: Do performance, structural, and interfacial evidence converge on the same mechanism? If inconsistent, flag ambiguity and withhold causal claims.

6. **Iteration or Redesign**
   - If the mechanism is confirmed but performance is weak: redesign to preserve the mechanism while improving transport, contact, or compatibility.
   - If the mechanism is absent: abandon or reformulate the hypothesis; do not optimize around a false causal link.
   - If performance improves but attribution is unclear: add decomposition controls before claiming causality.
   - If stress tests under demanding conditions fail: identify the limiting interface or transport step.
   - **Gate 6**: Have the failure mode and boundary condition from the current round been documented before generating the next hypothesis? If not, document them.

7. **Claim Bounding & Archival**
   - State explicit applicability boundaries: chemistry, architecture, loading, rate, environment, and format.
   - Distinguish “this candidate worked in this setup” from “this mechanism is generally true.”
   - Archive negative results and boundary violations as design information.
   - **Final Gate**: Are all claims limited to tested conditions, with extrapolations explicitly labeled as hypotheses?

# Output Format

When using this skill, return:

1. **Research question** — one sentence.
2. **Candidate hypotheses** — table with claim, evidence strength, key assumptions, likely failure modes, and transfer boundaries.
3. **Minimal validation plan** — variables, control matrix, primary metrics, mechanistic metrics, and stop conditions.
4. **Analysis plan** — normalization approach, mechanism table template, causal consistency checks, and evidence grading rules.
5. **Iteration decision rules** — what outcomes support, weaken, redirect, or stop the hypothesis.
6. **Validity and safety notes** — confounders, reproducibility requirements, claim boundaries, and non-operational safety constraints.

# Validation Gates

- **Gate 1 (Bottleneck Clarity)**: The performance gap is expressed as a coupled mechanism, not a metric alone.
- **Gate 2 (Falsifiability)**: Every hypothesis can be tested by orthogonal diagnostics, not only by top-line performance.
- **Gate 3 (Control Rigor)**: The control matrix isolates the proposed mechanism from mass, geometry, processing, and environmental confounders.
- **Gate 4 (Diagnostic Coverage)**: Each proposed function has at least one independent measurement capable of supporting or refuting it.
- **Gate 5 (Evidence Convergence)**: Electrochemical, structural, and interfacial data point to the same mechanism; contradictions are flagged.
- **Gate 6 (Failure Documentation)**: Failure modes and boundary conditions are recorded before the next iteration.
- **Final Gate (Claim Scope)**: Claims are bounded to tested conditions; extrapolations are labeled as hypotheses.

# Claim Boundaries

- Claims are valid only for the tested material system, architecture, loading regime, and operating environment.
- Do not generalize from screening-scale tests to practical cell formats or commercial readiness.
- Distinguish transferable design principles from system-specific observations.
- Analogies to source literature must be labeled as inference requiring independent validation.
- Do not treat a single successful demonstration as field consensus.

# Failure Modes

- **Confounding**: Uncontrolled variables (loading, thickness, wetting, contact pressure, processing history) produce apparent improvements unrelated to the proposed mechanism.
- **Mechanism Misattribution**: Performance gains arise from additive redistribution, conductive network changes, or morphology artifacts rather than the intended chemical or interfacial effect.
- **Passivation or Blockage**: Strong interfacial interaction or dense architecture improves confinement but blocks ion/electron transport, degrading kinetics.
- **Trade-off Blindness**: A design improves one metric while covertly degrading another (e.g., mechanical stability at the expense of transport).
- **False Extrapolation**: Results from idealized or low-stress conditions are assumed to hold under demanding regimes without boundary testing.
- **Unreplicated Claims**: Single-cell or single-batch observations are treated as conclusive evidence.

# Validity Checks

- **Confounding Control**: Electrode composition, loading, processing, measurement timing, and environmental conditions are matched or disclosed across groups.
- **Reproducibility**: Repeated independent samples or cells are required for claims beyond screening; variability is reported.
- **Statistical Validity**: Replication level, normalization basis, outlier handling, and decision thresholds are defined before interpretation.
- **Mechanism Validity**: Converging evidence from multiple independent diagnostics is required; no single measurement proves a mechanism.
- **Boundary Validity**: Claims are explicitly limited to the tested chemistry, architecture, and operating envelope.
- **Control Adequacy**: Baseline, negative, mechanism-isolating, and positive controls are present and behave plausibly.

# Provenance

- Synthesized from cluster 28.0 (observable-driven mechanism discovery and validation).
- Derived from source skills: `li-s-battery-binder-exploration`, `sustainable-battery-binder-research-exploration`, `chemically-stabilized-sulfur-research`, `self-healing-binder-battery-research`, `li-s-catalyst-microreactor-research-design`, `conjugated-polymer-binder-research-design`, `functional-interlayer-research-design`, `nanofiber-alginate-scaffold-exploration`.
- No paper-specific conclusions, numerical results, material recipes, or operational protocols are carried forward.
