---
name: sci-quantum-observable-driven-evidence-analysis-workflo-3402c54d
description: Use this skill to design end-to-end research plans that audit evidence chains from observable to claim, enforcing uncertainty separation, control benchmarks, and robustness checks before bounding conclusions.
scienceevolve-title: "Quantum materials and condensed matter · observable driven evidence analysis workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

This skill guides agents in designing rigorous, reusable research programs where a target claim must be anchored to observable evidence through explicit inference chains. It abstracts the shared logic across precision quantum, nuclear, QCD, and metrology domains into a domain-agnostic workflow: identify the precision gap, decompose the evidence chain, generate testable hypotheses, validate through redundant controls and benchmarks, propagate uncertainty, and bound claims by what the validation actually supports.

# When to use

Use this skill when the user asks to:

- Propose new research questions in precision theory, quantum metrology, nuclear structure, QCD phenomenology, or criticality studies where claims depend on subtle observable patterns.
- Design validation plans that connect candidate mechanisms to measurable effects through controlled comparisons.
- Audit an existing evidence chain for hidden assumptions, systematic leakage, or unsupported extrapolation.
- Translate a theoretical or numerical observation into a minimal validation plan with explicit stop conditions.
- Compare independent routes, conventions, or model families to bound a target quantity or mechanism.

Do not use this skill for operational laboratory protocols, hardware execution details, hazardous procedures, or as a substitute for domain-specific proofs or field-wide consensus.

# Inputs required

Before generating a plan, collect or infer:

- Target claim or quantity to be constrained, and the decision it supports.
- Observable(s) that can anchor the claim, including accessible proxies and independent benchmarks.
- Dominant and subleading contributions, or the bottleneck parameter/limiting correction.
- Candidate hypotheses with mechanistic rationale and expected signatures.
- Available controls: baseline, positive, negative, reference, and robustness controls.
- Known systematic effects, confounders, noise channels, or convention dependencies.
- Independent validation routes or cross-checks (experimental, numerical, theoretical).
- Uncertainty budget categories: statistical, systematic, model-dependent, and approximation.
- Intended scope: exploratory, model-discrimination, or calibration-quality.

If critical inputs are missing, state assumptions explicitly and label derived claims as inferred or speculative.

# Core Workflow

Execute the following ordered route. Advance through a stage only if its gate is satisfied; otherwise iterate or stop.

1. **Gap Definition & Contribution Decomposition**
   - Define the target claim and the precision gap that motivates it.
   - Decompose the observable into dominant, subleading, interference, correction, or bottleneck components.
   - Identify which component limits the claim and map the inference chain from raw observable to derived quantity.

2. **Hypothesis Generation & Ranking**
   - Generate mechanistic hypotheses linking the observable to the claim.
   - Annotate each with evidence strength (strong, moderate, weak, speculative), key assumptions, predicted signature, and failure modes.
   - **Gate:** If no hypothesis can be falsified by available observables, stop and redefine the gap or required inputs.

3. **Validation Graph Design**
   - Build a measurement or calculation graph: primary route, auxiliary/mediator routes, direct cross-checks, and reference anchors.
   - Define controls (baseline, positive, negative, structural, approximation, convention) and specify minimal viable validation (primary + one independent route).
   - **Gate:** If independent validation routes are impossible, downgrade the claim to exploratory and document the boundary.

4. **Execution & Uncertainty Separation**
   - Run the primary route and cross-checks without mixing components prematurely.
   - Separate uncertainties into statistical, systematic, model-dependent, approximation, and reference categories.
   - Keep raw observables distinct from corrected or inferred quantities.
   - **Gate:** If systematic uncertainty dominates and is uncalibrated, stop to redesign controls before increasing precision or statistics.

5. **Robustness & Consistency Audit**
   - Compare independent routes; require agreement within combined uncertainty.
   - Test stability under parameter variation, finite-size effects, scheme or convention changes, and alternative estimators or model families.
   - Audit for confounders: hidden systematics, convention mismatches, unmatched references, or competing channels.
   - **Gate:** If routes disagree beyond combined uncertainty without a documented cause, trigger discrepancy triage (Step 7). If robustness checks fail, narrow or reject the hypothesis.

6. **Claim Bounding & Evidence Classification**
   - Classify each claim as Demonstrated, Inferred, Speculative, or Inconclusive/Refuted.
   - Bound the claim by validated regime, extrapolation boundary, and transfer limits.
   - Explicitly separate source-supported results from agent-inferred extensions.
   - **Gate:** If the effect is below the combined uncertainty budget or depends on unsupported assumptions, stop and demote the claim.

7. **Iteration or Redesign**
   - **Positive result:** If validation passes and routes agree, broaden tests across regimes or accept a bounded conclusion.
   - **Discrepancy:** If routes disagree, localize the discrepancy (target parameter, reference, inference chain, model assumption, or convention mismatch) before claiming a new result.
   - **Negative result:** If controls fail or the signature disappears, document boundary conditions and propose alternative hypotheses or auxiliary observables.
   - **Stop conditions:**
     - No valid factorization or decomposition exists for the regime.
     - Artificial dependence (scale, scheme, convention) remains unacceptably large.
     - The dominant uncertainty is uncalibrated or model-dependent.
     - The result does not change any decision-relevant output.
     - Operational details required are unsafe or unavailable.

# Output Format

When using this skill, produce:

1. **Research Question** – Concise claim, target quantity, and precision motivation.
2. **Gap & Contribution Map** – Decomposed components and identified bottleneck.
3. **Ranked Hypotheses** – Table with hypothesis, mechanism, evidence strength, key assumptions, predicted signature, likely failure modes, and minimal falsification test.
4. **Validation Graph** – Primary route, auxiliary/mediator routes, direct cross-checks, reference anchors, and control table.
5. **Analysis Plan** – Uncertainty separation, propagation method, robustness checks, convergence criteria, and visualization strategy.
6. **Claim Boundary Statement** – Evidence classification per hypothesis, extrapolation limits, and transfer boundaries.
7. **Iteration & Stop Rules** – Conditions for continuing, revising, or terminating the research direction.

# Validation Gates

Hard checks that must pass before advancing between workflow stages:

- **Task/Claim Specificity Gate:** The claim targets a clearly defined quantity or mechanism, not a vague accuracy improvement.
- **Reference Matching Gate:** Controls and benchmarks differ primarily in the property being tested.
- **Route Independence Gate:** At least one validation route is independent of the primary inference chain.
- **Uncertainty Calibration Gate:** Systematic and model uncertainties are separated and bounded before claim formation.
- **Robustness Gate:** The signature persists under parameter, estimator, scheme, convention, or finite-size variations.
- **Consistency Gate:** Independent routes agree within combined uncertainty, or discrepancies are explicitly triaged.
- **Extrapolation Gate:** Claims are bounded by the validated regime; broader transfer requires explicit revalidation.

# Claim Boundaries

- **Demonstrated:** Supported by multiple independent routes, robust controls, and calibrated uncertainty.
- **Inferred:** Supported by indirect evidence or a single strong route, with explicit assumptions stated.
- **Speculative:** Plausible mechanism without direct validation or dependent on unverified model families.
- **Refuted/Inconclusive:** Contradicted by controls, inconsistent routes, or insufficient information extraction.
- Do not treat single-study or single-platform results as field-wide consensus.
- Do not extrapolate beyond the tested universality class, model family, convention regime, or parameter range.

# Failure Modes

- **Measurement/Readout Mismatch:** The observable does not extract the information assumed by the inference chain.
- **Unmodeled Systematic or Noise:** Hidden drift, loss, preparation variation, or environmental coupling mimics the target effect.
- **Estimator/Model Bias:** A single estimator, model family, or analysis choice drives the conclusion.
- **Narrow Regime Artifact:** Advantage or signature appears only at unreported favorable parameter values.
- **Convention/Scheme Mismatch:** Unaudited normalization, basis, scale, or sign definitions create artificial discrepancies.
- **Competing Channel/Mechanism:** An alternative explanation accounts for the observed pattern better than the candidate hypothesis.
- **Resource Certification without Operational Advantage:** Theoretical capacity is demonstrated but not converted into observable improvement.
- **Premature Physical Interpretation:** A bookkeeping, numerical, or convention error is interpreted as a new physical effect.

# Validity Checks

Before finalizing any plan or claim, verify:

- **Definition Validity:** All routes measure the same target under compatible definitions.
- **Confounding Validity:** Environmental drift, preparation differences, analysis choices, or competing channels cannot mimic the target effect.
- **Control Validity:** Positive, negative, structural, and cross-check controls are strong enough to expose leading failure modes.
- **Statistical Validity:** Model choices are justified by predefined criteria; uncertainty is propagated correctly.
- **Reproducibility Validity:** Raw observables, corrections, model choices, covariance information, and code provenance are auditable.
- **Boundary Validity:** Platform, sample class, convention regime, and calibration chain are explicitly limited.
- **Consensus Validity:** Single-study results are distinguished from field-level conclusions.
- **Safety Validity:** The plan remains at the research-design level and avoids hazardous operational details.

# Provenance

- Derived from cluster 217.0 ("quantum-precision-nuclear-qcd-evidence-analysis-workflow").
- Synthesized from representative source skills: quantum-metrology-resource-task-validation, qcd-factorization-rg-research-design, precision-mass-metrology-research-design, nuclear-astrophysics-bottleneck-research-planning, quantum-critical-metrology-workflow, precision-collider-convention-audit, precision-atomic-correction-anchoring, higgs-jet-qcd-interference-exploration.
- Methodological patterns abstracted; no source-specific systems, parameters, numerical results, or paper conclusions are preserved in the workflow body.
