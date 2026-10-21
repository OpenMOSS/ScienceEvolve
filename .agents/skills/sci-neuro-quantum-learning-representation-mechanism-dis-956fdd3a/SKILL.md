---
name: sci-neuro-quantum-learning-representation-mechanism-dis-956fdd3a
description: Guide research planning and execution for machine-learning-assisted mechanism discovery and validation across physical, chemical, and neural systems, emphasizing hypothesis generation, controlled approximation, model comparison, and iterative evidence-based refinement.
scienceevolve-title: "Neuromorphic computing and Ising optimization · quantum learning representation mechanism discovery validation"
scienceevolve-area: neuromorphic-computing-and-ising-optimization
---

# Purpose

Use this skill to design and execute end-to-end research workflows that use machine learning to discover, discriminate, and validate mechanisms in complex systems. It structures the transition from baseline models and observations to bounded mechanistic claims through hypothesis generation, controlled experimentation, robust model comparison, and iterative refinement. The workflow treats approximations, sampling constraints, and representation choices as first-class scientific variables rather than fixed implementation details.

# When to use

- When the user asks to propose new research questions, hypotheses, or experimental designs where machine learning is used to uncover latent structure, correct baseline errors, or compare competing mechanisms.
- When the task involves constrained resources, approximate inference, sampling bottlenecks, or constrained optimization objectives that require careful validation.
- When multiple model families, architectures, or physical approximations must be compared under matched conditions to isolate mechanism contributions.
- When the goal is to bound claims by evidence strength and avoid overgeneralization from single benchmarks or paper-specific results.

Do not use this skill as a general-purpose machine learning tutorial, operational hardware guide, or deployment checklist.

# Inputs required

Before producing a research plan, obtain or explicitly assume:

- **Target system and baseline model:** the current model, solver, or observation set and its known limitations.
- **Scientific question:** the dependency, representation, correction, or comparison problem being studied.
- **Candidate mechanisms:** hypothesized latent factors, structural constraints, operator pools, or discrepancy sources.
- **Data and resource constraints:** available observations, reference data, compute budget, sampling limits, and access restrictions.
- **Evaluation criteria:** primary metrics, diagnostic proxies, robustness requirements, and acceptance thresholds.
- **Safety and ethics boundaries:** domain-specific privacy, safety, compliance, and overclaiming limits.

If inputs are missing, state assumptions explicitly and label resulting outputs as inferred or speculative.

# Core Workflow

Follow this ordered route. Do not skip a gate; if a gate fails, return to the indicated stage or stop.

1. **System framing and gap diagnosis**
   - Define the baseline model, observable variables, and the specific failure, discrepancy, or representational gap.
   - Classify the bottleneck: representational limit, approximation error, sampling constraint, structural misspecification, or distribution shift.
   - **Gate:** If the baseline and gap cannot be stated operationally, stop and refine the research question.

2. **Mechanism hypothesis generation**
   - Propose candidate mechanisms (latent factors, symmetry constraints, correction terms, architectural principles, or local plasticity rules) that could explain the gap.
   - For each hypothesis record: evidence strength (verified / inferred / speculative), key assumptions, expected observation, disconfirming observation, likely failure mode, and minimal diagnostic test.
   - Rank hypotheses by falsifiability and alignment with available controls.
   - **Gate:** If a hypothesis cannot be linked to a diagnostic metric or control, reformulate before proceeding.

3. **Minimal viable validation design**
   - Design the smallest experiment that can falsify the central hypothesis.
   - Specify positive controls, negative controls, structural controls, randomization controls, and approximation controls.
   - Match budgets (samples, compute, data, model capacity) across all compared conditions.
   - Pre-register stop conditions: control failure, instability, proxy-target mismatch, or budget overrun.
   - **Gate:** If controls are inadequate or budgets cannot be matched, redesign before execution.

4. **Controlled execution and model comparison**
   - Execute the baseline and proposed variants under matched conditions.
   - Vary one major factor at a time; use ablations to isolate mechanism contributions from implementation details.
   - Monitor primary metrics alongside approximation diagnostics, cost, stability, and failure metrics.
   - **Gate:** If positive or negative controls behave incorrectly, halt execution and audit the pipeline.

5. **Robustness and accumulation audit**
   - Test sensitivity to initialization, data splits, noise, distribution shifts, and alternative approximations.
   - Verify that local improvements (e.g., discrepancy reduction, sensitivity ranking, latent alignment) propagate to the final target behavior.
   - Evaluate repeatability across stochastic runs or seeds.
   - **Gate:** If the main result disappears under repeated trials or perturbations, stop generalization and return to Stage 2.

6. **Mechanism discrimination and claim bounding**
   - Attribute observed effects to mechanisms rather than confounders (capacity differences, tuning artifacts, benchmark bias, or leakage).
   - Label each conclusion as verified, inferred, or speculative.
   - State boundary conditions: applicable system classes, data regimes, approximation limits, and evaluation metrics.
   - **Gate:** If the mechanism cannot be isolated from implementation artifacts, bound the claim to the tested configuration.

7. **Iteration or study conclusion**
   - If evidence supports the hypothesis, plan staged generalization or broader validation.
   - If evidence is weak or negative, revise the mechanism map, feature space, approximation, or model structure and return to Stage 2 or 3.
   - If stop conditions are met (reproducible bounded claim, resource limit, safety boundary, or persistent control failure), finalize the study plan and document limitations.
   - **Stop:** Do not escalate to broader claims until the mechanism survives minimal validation, budget-matched comparison, and robustness checks.

# Output Format

When using this skill, produce:

1. **Research question framing** — Baseline limitation, target system class, and operational gap statement.
2. **Ranked hypotheses** — Table with hypothesis, mechanism, evidence strength, key assumptions, expected observation, disconfirming observation, likely failure mode, and minimal test.
3. **Study plan** — Experimental conditions, independent variables, dependent variables, monitoring variables, and staged validation ladder.
4. **Validation plan** — Control table (baseline, positive, negative, structural, randomization, approximation), budget-matching rules, and stop conditions.
5. **Analysis plan** — Primary and secondary metrics, approximation diagnostics, robustness checks, and uncertainty reporting strategy.
6. **Claim boundaries and failure modes** — Extrapolation limits, boundary conditions, and documented failure families.
7. **Iteration roadmap** — Triggers for redesign, conditions for abandonment, and next minimal experiment.

# Validation Gates

- **Operational definition gate:** Baseline and gap must be expressible in terms of measurable variables, metrics, and model behaviors.
- **Falsifiability gate:** Every hypothesis must have a defined disconfirming observation and a linked diagnostic.
- **Control adequacy gate:** The design must include positive, negative, and structural controls matched on budget and capacity.
- **Execution fidelity gate:** Positive and negative controls must behave as expected before interpreting main results.
- **Robustness gate:** The effect must survive repeated trials, held-out data, and perturbation of approximations.
- **Isolation gate:** Mechanism contributions must be separable from confounders via ablation or matched comparison.
- **Claim bounding gate:** Conclusions must be labeled by evidence strength and restricted to tested regimes.

# Claim Boundaries

- This workflow supports research design and evidence evaluation; it does not replace domain-specific theory, implementation review, or experimental execution.
- Conclusions are bounded to the tested system classes, data families, approximation regimes, and evaluation metrics.
- Benchmark success is treated as conditional evidence about a research direction, not proof of universal mechanism validity.
- Approximation improvements are distinguished from model improvements; sampling, pruning, or discrepancy corrections are validated independently of the baseline they augment.
- Biological, physical, or chemical interpretations derived from machine learning representations require independent empirical validation and must not be presented as established facts.

# Failure Modes

- **Approximation artifact dominance:** The learning signal or diagnostic is driven by the approximation method rather than the target mechanism.
- **Control failure:** Positive or negative controls produce unexpected outcomes, indicating pipeline errors or mismatched assumptions.
- **Confounding by capacity or tuning:** Observed differences arise from unequal model size, training budget, or hyperparameter search rather than the hypothesized mechanism.
- **Proxy-target mismatch:** A convenient metric improves while the scientifically relevant target behavior worsens or remains unchanged.
- **Benchmark overfitting:** Results depend on a single dataset, initialization, or narrow task family and fail under distribution shift.
- **Leakage or contamination:** Training signal, evaluation data, or label information inadvertently influences the mechanism discovery process.
- **Instability under repetition:** Effects are not reproducible across seeds, splits, or stochastic runs.
- **Extrapolation beyond evidence:** Claims generalize to untested system classes, physical regimes, or deployment contexts without validation.

# Validity Checks

Before finalizing any research plan or conclusion, verify:

- **Trigger fit:** The problem genuinely involves mechanism discovery, model comparison, or representation validation under constraints.
- **Model clarity:** Variables, latent factors, assumptions, and claim boundaries are explicit.
- **Metric alignment:** Metrics directly test the scientific claim rather than only a convenient proxy.
- **Approximation transparency:** Bias, variance, and computational cost of approximations are reported.
- **Reproducibility:** Seeds, splits, preprocessing, model variants, and failure cases are recorded at a conceptual level.
- **Representation evidence:** Learned factors or corrections are validated rather than asserted.
- **Extrapolation boundary:** Conclusions are limited to tested data families, variable types, approximation regimes, and metrics.
- **Ethical boundary:** The plan respects privacy, licensing, safety, and domain-specific compliance requirements.
- **Provenance discipline:** Source-paper findings are distinguished from new agent-generated hypotheses.

# Provenance

Derived from cluster 24, subcluster 24.1 ("machine-learning-assisted mechanism discovery and validation"). Synthesized from source skills: latent-energy-model-research-design, quantum-annealing-rbm-sampling-research, neural-architecture-unification-research, gnn-trustworthiness-research-workflow, constrained-plasticity-research-design, quantum-chemistry-ansatz-exploration, layerwise-sensitivity-model-pruning, piml-turbulence-discrepancy-learning.
