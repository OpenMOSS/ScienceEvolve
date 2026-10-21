---
name: sci-neuro-plasticity-homeostatic-mechanism-discovery-wo-4e74d68e
description: Reusable end-to-end workflow for generating, testing, and iterating mechanistic hypotheses about compensatory plasticity and homeostatic stabilization in neural systems using perturbation design, multi-scale readouts, and structured validation.
scienceevolve-title: "Neuromorphic computing and Ising optimization · plasticity homeostatic mechanism discovery workflow"
scienceevolve-area: neuromorphic-computing-and-ising-optimization
---

# Purpose

This skill guides an agent to turn observations of persistent perturbation or instability into testable research questions about adaptive neural plasticity. It supports end-to-end design of mechanism-discovery studies—from gap definition and competing hypothesis generation to conceptual validation, multi-scale analysis, and iterative model refinement—while keeping outputs at the research-planning level.

# When to use

Use this skill when the user asks to design, critique, or extend research on:
- homeostatic or compensatory plasticity mechanisms,
- synaptic redistribution, receptor trafficking, or scaling-like population adaptation,
- neuromodulatory or activity-dependent stabilization of excitability,
- multi-module or circuit-level coordination of adaptive responses,
- rapid representational reorganization after learning or perturbation.

Do not use this skill to provide clinical recommendations, executable laboratory protocols, stimulation parameters, dosing, surgical instructions, or treatment advice.

# Inputs required

Before running the workflow, collect or infer:
- target neural system and biological scale (e.g., synapse, neuron, circuit, module),
- dominant adaptive rule and its known limitation or instability,
- candidate compensatory mechanism and proposed mediator,
- measurable response features (functional, structural, molecular, or population-level),
- available perturbation or comparison strategies at a conceptual level,
- ethical, biosafety, and regulatory constraints.

# Core Workflow

1. **Define the mechanism gap**
   - State the target stabilized output and the persistent perturbation that challenges it.
   - Identify what existing explanations cannot account for (instability, saturation, heterogeneity, or missing compensation).
   - *Stop condition*: If the gap cannot be framed as a perturbation-to-compensation mapping, halt and re-scope the question.

2. **Generate competing hypotheses**
   - Produce at least three falsifiable hypotheses that propose different compensatory sites, mediators, or dynamic trajectories.
   - For each hypothesis record: evidence strength (strong / moderate / weak / speculative), key assumptions, predicted response signature, discriminating readouts, alternative explanations, likely failure modes, and boundary conditions.
   - *Decision gate*: Proceed only if hypotheses are mutually distinguishable with available readouts; otherwise refine the response space or add orthogonal measures.

3. **Design minimal viable validation**
   - Define a high-level perturbation concept that challenges stability without specifying operational parameters.
   - Specify the unit of analysis and a control structure: baseline, time-matched, negative, positive/specificity, and reversal or recovery where appropriate.
   - Define independent variables (perturbation, mediator state, timing), dependent variables (target output, candidate effector, population metric), and quality variables (batch, maturity, signal quality).
   - Predefine primary and secondary metrics, inclusion/exclusion criteria, and stop conditions (e.g., controls unstable, tracking unreliable, nonspecific disruption).
   - *Decision gate*: Confirm that the design isolates the candidate mechanism from competing explanations; if not, redesign controls or perturbation logic.

4. **Plan multi-scale analysis**
   - Choose matched-unit or trajectory-based analysis to compare pre- and post-perturbation states.
   - Integrate orthogonal readouts (functional, structural, compositional) so that no single modality alone drives mechanism inference.
   - Plan confounder checks: baseline stability, batch effects, measurement artifacts, nested structure, and multiple-comparison control.
   - Plan robustness checks under alternative normalizations, window definitions, and exclusion rules.
   - *Decision gate*: Halt if primary endpoints are not predefined and preregistered; do not proceed to adaptive endpoint selection.

5. **Execute conceptual validation and mechanism discrimination**
   - Compare perturbation and matched control conditions.
   - Test whether candidate mediator disruption, restoration, or activation changes the response as predicted.
   - Evaluate timing, phase, localization, and directionality signatures against predictions.
   - *Iteration gate*:
     - If effects are specific and controls stable → strengthen the mechanism claim and propose a higher-level test (generality, population coding, opposite direction).
     - If no effect → check targeting, baseline stability, and sensitivity before rejecting the hypothesis.
     - If both perturbation and controls change → treat as drift or nonspecific effect; redesign control structure.
     - If heterogeneous outcomes appear → decompose by baseline state, cell class, spatial position, or module identity; reject uniform-scaling assumptions.
     - If mediator is necessary but not sufficient → reclassify as permissive or context-dependent and refine the causal model.
     - If results are ambiguous → stop and prioritize a more discriminating minimal validation before expanding scope.

6. **Synthesize and bound claims**
   - Compile a structured research record separating verified observations, supported interpretations, and speculative inferences.
   - State boundary conditions (cell type, developmental stage, perturbation class, timescale, readout modality).
   - Document residual risks and next iteration steps.

# Output Format

When using this skill, produce:

1. **Research question and gap** — concise mechanism-focused question and rationale.
2. **Ranked hypotheses table** — hypothesis, evidence strength, key assumptions, predicted signature, failure modes, and boundary conditions.
3. **Minimal viable validation design** — perturbation concept, unit of analysis, variables, control structure, metrics, and stop conditions.
4. **Analysis plan** — primary/secondary endpoints, orthogonal readout integration, confounder checks, nested modeling, and robustness strategy.
5. **Iteration rules** — how each possible result pattern updates, weakens, splits, or stops the hypothesis.
6. **Validity and ethics statement** — scope, reproducibility checks, safety boundaries, and extrapolation limits.

# Validation Gates

- **Falsifiability gate**: Hypotheses must predict distinct outcomes and specify data patterns that would refute them.
- **Isolation gate**: The experimental concept must separate candidate mechanism effects from drift, batch effects, nonspecific stress, and competing mechanisms through matched controls.
- **Specificity gate**: Perturbation logic must target communication or compensation rather than global suppression or damage; include recovery or reversibility checks when possible.
- **Sensitivity gate**: Baseline measurements must be stable enough to interpret change; assay responsiveness must be verified.
- **Convergence gate**: Mechanism claims require alignment across at least two orthogonal readouts (e.g., functional and structural, or molecular and population-level).
- **Scope gate**: The updated hypothesis must remain within the biological and regulatory scope of the target system; if extrapolation is required, label it as speculative.

# Claim Boundaries

- Distinguish **verified observations** from **supported interpretations** and **speculative inferences** in every output.
- Treat single-system or single-perturbation findings as evidence for a candidate mechanism, not as universal rules for all neural systems.
- Treat correlations between baseline state, spatial proximity, or activity and response as evidence for candidate organization, not as proof of causality.
- Do not present mechanistic hypotheses as clinical recommendations, diagnostic criteria, or therapeutic guidance.
- Label any extrapolation across cell types, circuits, species, or disease models as provisional until independently validated.

# Failure Modes

- **Hypothesis is post-hoc explanatory**: Hypotheses predict any outcome. *Response*: Require explicit failure modes and discriminating predictions before proceeding.
- **Controls are unstable or matched controls mimic the effect**: *Response*: Halt interpretation; redesign measurement pipeline or control structure.
- **Perturbation is nonspecific**: Global suppression or stress confounds compensation. *Response*: Add specificity and recovery controls; refine perturbation concept.
- **Measurement artifacts mimic adaptation**: Drift, bleaching, tracking error, or batch effects. *Response*: Predefine quality metrics and exclusion criteria; validate with orthogonal readouts.
- **Confounding by unmeasured variables**: Activity state, developmental stage, or cell identity explains apparent mechanism. *Response*: Stratify analysis and add subclass controls.
- **Overgeneralization**: A single preparation or readout is treated as consensus. *Response*: Narrow claims and require converging evidence from independent replicates.

# Validity Checks

- **Mechanism specificity**: Does the design isolate the candidate mechanism from alternatives?
- **Baseline stability**: Are pre-perturbation responses stable enough to interpret change?
- **Control adequacy**: Do time-matched, negative, and specificity controls rule out drift and nonspecific effects?
- **Targeting validity**: Is the intended unit, pathway, or expression verified?
- **Measurement validity**: Are response features, indices, and visualizations interpretable and preregistered?
- **Statistical validity**: Are paired comparisons, distribution checks, effect sizes, nested structures, and multiple-comparison controls used appropriately?
- **Reproducibility**: Are inclusion criteria, exclusion criteria, stop conditions, and analysis decisions documented and preregistered?
- **Boundary conditions**: Does the proposed question stay within the target system's biological and regulatory scope?
- **Evidence labeling**: Are claims separated into verified observations, supported interpretations, and speculative follow-up hypotheses?

# Provenance

Derived from cluster 20, subcluster 20.0. Synthesized from source skills: visual-cortex-plasticity-exploration, homeostatic-synaptic-plasticity-research-design, synaptic-homeostasis-retrograde-research, rapid-semantic-learning-plasticity, cholinergic-intrinsic-mechanism-exploration, synaptic-homeostatic-plasticity-exploration, connected-organoid-network-exploration, nmj-homeostatic-plasticity-research. Source-paper observations are used only as methodological precedent, not as field-wide conclusions.
