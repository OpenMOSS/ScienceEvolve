---
name: sci-urban-observable-driven-evidence-analysis-workflow-c21e0d84
description: A reusable end-to-end workflow for mechanism-grounded research planning, controlled evidence synthesis, and claim auditing across physical-system domains.
scienceevolve-title: "Urban hazard resilience · observable driven evidence analysis workflow"
scienceevolve-area: urban-hazard-resilience
---

# Purpose

Guide agents to formulate research questions, generate falsifiable mechanism-grounded hypotheses, design controlled studies, validate models against independent observations, and bound claims through iterative uncertainty diagnosis. This workflow treats source papers as methodological templates rather than universal conclusions.

# When to use

Use this skill when the task involves:

- Proposing new research questions about physical-system behavior under extreme or uncertain conditions.
- Designing experimental, numerical, or observational studies to test mechanism-based hypotheses.
- Comparing baseline and intervention systems using compatible metrics and explicit controls.
- Synthesizing heterogeneous evidence into conditional fragility, demand, or performance relationships.
- Auditing whether a model, dataset, or method improves parameter recovery or predictive validity.

Do not use this skill for construction instructions, emergency operational directives, safety certifications, licensed engineering design, or real-time hazard response.

# Inputs required

Ask the user or environment for:

- Target system class and the performance or inference gap to be addressed.
- Conventional baseline or simplified model that omits the mechanism under study.
- Candidate mechanisms and the observables expected to constrain or falsify each.
- Available evidence types and their provenance (tests, simulations, field observations, literature, benchmarks).
- Evaluation constraints: metrics, uncertainty treatment, computational or experimental budget, and ethical or regulatory boundaries.
- Decision objective: exploratory screening, method comparison, model calibration, or conditional claim generation.

# Core Workflow

Follow this ordered route. At each stage, apply the decision gate before proceeding.

1. **Define the assessment gap.** Identify why a conventional view may miss a mechanism-specific vulnerability, bias, or uncertainty. Frame the gap as a conditional behavior question (when/under what conditions), not as a binary improvement claim.
2. **Decompose by mechanism.** Split the system into components, load paths, or information channels whose distinct behaviors plausibly produce different responses. Separate durable mechanisms from implementation-specific details.
3. **Map observables to mechanisms.** Define measurable quantities—such as displacement histories, pressure distributions, recovery errors, or exceedance probabilities—that can validate or falsify each mechanism. Distinguish global summaries from local signatures that could hide amplification or trade-offs.
4. **Generate mechanism-grounded hypotheses.** For each mechanism, produce directional hypotheses that include:
   - Evidence strength (strong, moderate, weak, or speculative).
   - Key assumptions about physics, boundary conditions, and data quality.
   - Predicted observable signal and the metric that would detect it.
   - Likely failure modes and how the hypothesis could be falsified.
   - Extrapolation boundary where the claim should not be applied.
   Explicitly separate source-paper-supported patterns, method-transferred logic, and new agent inferences.
5. **Design a controlled study.**
   - Establish a baseline that preserves comparability with the mechanism variant.
   - Define independent variables tied to the mechanism, dependent variables tied to observables, and confounding variables to monitor.
   - Include positive controls (where the mechanism should be active), negative controls (where it should be inactive), and strong comparisons (higher-fidelity or independent validation sources).
   - Set a minimum viable validation: the smallest credible test or simulation that can falsify the core claim.
   - Define stop conditions before execution: baseline checks fail, controls do not separate, the trend depends on a single unverified assumption, or the study would require unsafe or non-compliant operational execution.
6. **Harmonize and execute analysis.**
   - Map each evidence item to consistent labels for component, demand quantity, damage or response state, observable signature, and provenance.
   - Normalize responses so that trends are comparable across system scales or experimental regimes.
   - Check model plausibility against analytical expectations or independent benchmarks before interpreting results.
7. **Validate against observations.**
   - Compare predicted and observed signatures using the same coordinate system, time reference, metrics, and decision thresholds.
   - Quantify mismatch both numerically and qualitatively.
   - Diagnose whether discrepancies stem from model-form assumptions, measurement error, material or boundary uncertainty, or hidden variables.
8. **Compare alternatives and bound claims.**
   - Evaluate candidates with a transparent multi-objective decision table (performance, uncertainty, robustness, feasibility).
   - Label each conclusion as verified, supported, inferred, or uncertain.
   - Propagate component-level or reduced-scale findings to system-level claims only after documenting interactions, dependencies, and boundary assumptions.
9. **Iterate or stop (decision gate).**
   - **Proceed:** If models and observations agree on mechanism and controls behave correctly, narrow the hypothesis and test a more specific question.
   - **Revise:** If the trend is scenario-sensitive, confounded, or model-observation mismatch indicates a wrong assumption, update one assumption class at a time and re-run controls.
   - **Stop:** If the hypothesis is falsified, validation data are insufficient, uncertainty dominates the effect, or the study cannot continue without unsafe operational execution.

# Output Format

Return results in this structure:

1. **Research question** — One concise mechanism-focused question and the system boundary.
2. **Mechanism map** — Components, load paths, or information channels; suspected mechanisms; and functional or inferential consequences.
3. **Hypothesis set** — For each hypothesis: evidence strength, key assumptions, predicted observable signal, minimal viable test, controls, metrics, failure modes, and interpretation boundaries.
4. **Study design** — Baseline, variants, independent/dependent/confounding variables, evidence inclusion rules, controls, evaluation metrics, and stopping criteria.
5. **Analysis plan** — Evidence harmonization, normalization, model validation, sensitivity analysis, uncertainty treatment, and visualization strategy.
6. **Iteration plan** — Rules for proceeding, revising, or stopping based on control outcomes and mismatch diagnosis.
7. **Validity and ethics review** — Confounders, reproducibility checks, safety boundaries, and what must not be inferred.
8. **Evidence boundary statement** — Explicit separation of source-paper-supported findings, method-transferred patterns, and new agent inferences.

# Validation Gates

- **Mechanism isolation:** Baseline and test conditions differ only in the intended mechanism; confounding variables are monitored or bounded.
- **Evidence compatibility:** Sources are not double-counted, overgeneralized, or mixed across incompatible definitions without explicit assumptions.
- **Model validity:** Models reproduce intended response signatures and are validated on independent behavior, not only on fitted features.
- **Statistical validity:** Relationships include uncertainty, sensitivity, and clear inclusion/exclusion rules; central tendency and dispersion are reported separately.
- **Observational validity:** Measurement geometry, calibration, sampling density, and tracking adequacy match the chosen metrics.
- **Reproducibility:** Inputs, provenance, assumptions, decisions, and processing steps are documented enough for independent replication.

# Claim Boundaries

- Treat single papers, benchmark cases, or synthetic tests as methodological precedents, not as domain consensus or universal rules.
- Separate directly supported findings from inferred or extrapolated claims.
- Limit conclusions to the tested system class, hazard or loading set, evidence quality, and model assumptions.
- Do not issue operational safety directives, design approvals, construction instructions, or emergency response recommendations.

# Failure Modes

- **Hypothesis falsification:** The mechanism does not produce the predicted observable signature under controlled conditions.
- **Control failure:** Positive or negative controls fail to separate, indicating confounding, metric mismatch, or hidden variables.
- **Model-observation divergence:** Predicted and observed signatures disagree due to boundary errors, unrepresented physics, or measurement inadequacy.
- **Overfitting:** A high-fidelity model reproduces fitted features but fails on independent validation or broader scenarios.
- **Scenario entrapment:** A trend appears only under a narrow, unrealistic subset of conditions or a single benchmark case.
- **Uncertainty dominance:** Epistemic or aleatory uncertainty obscures the mechanism effect, preventing reliable ranking or inference.
- **Operational entanglement:** The study cannot proceed without unsafe, non-compliant, or high-risk procedural execution.

# Validity Checks

Before finalizing any research plan or claim, verify:

- **Confounding:** Are scale effects, material variability, boundary conditions, nuisance processes, and hidden loads represented or explicitly bounded?
- **Mechanism specificity:** Do ablation controls isolate the proposed channel, model factor, or geometric intervention?
- **Boundary conditions:** Does the claim specify where it should weaken or fail, and what evidence would overturn it?
- **External validity:** Is the target problem sufficiently similar to the evidence base, or is the claim only an analogy?
- **Metric balance:** Does a global improvement mask a critical local degradation, or does a fit improvement mask poor parameter recovery?
- **Ethical validity:** Are outputs framed as research planning with disclosed uncertainty, limitations, and applicability boundaries?

# Provenance

Synthesized from cluster 0.0 (observable-driven evidence analysis and claim audit). Source skills: component-fragility-research-workflow (10.1002_eer2.100), seismic-retrofit-exploration (10.1002_tal.2196), extreme-structural-collapse-research-workflow (10.1002_suco.202400017), seismic-isolation-nondimensional-exploration (10.1002_eqe.3454), seismic-inverse-recovery-workflow (10.1093_gji_ggaa305), super-tall-building-aerodynamic-exploration (10.1002_tal.1483), seismic-ssi-vulnerability-research (10.1038_s41598-026-37898-w), seismic-rocking-fragility-research (10.1186_s43251-020-00023-6).
