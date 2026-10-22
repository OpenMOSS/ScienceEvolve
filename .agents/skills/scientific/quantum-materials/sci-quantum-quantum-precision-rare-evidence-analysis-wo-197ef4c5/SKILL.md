---
name: sci-quantum-quantum-precision-rare-evidence-analysis-wo-197ef4c5
description: Use this skill to design end-to-end research plans for quantum, precision, or rare-signal problems where claims must be anchored to observable baselines, validated against matched controls, and audited for uncertainty before accepting a mechanism.
scienceevolve-title: "Quantum materials and condensed matter · quantum precision rare evidence analysis workflow"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Use this skill to help an agent generate reusable research plans for quantum, precision, rare-signal, or low-evidence problems where a proposed mechanism must be distinguished from artifacts, baseline limitations, and uncontrolled nuisances. The goal is to transfer an observable-driven claim-audit pattern across domains, not to reproduce any specific apparatus, material system, or single-paper conclusion.

# When to use

Trigger this skill when the user asks to:

- Explore performance beyond an incumbent operational limit or reconcile a result with a fundamental bound.
- Validate a proposed mechanism under realistic noise, loss, detector memory, or environmental variability.
- Reconcile discrepancies across independent probes, momentum scales, or reconstruction mappings.
- Identify weak or hidden components in complex spectra or high-dimensional data.
- Design minimal validation for a data-driven model, filter, or estimator that replaces an analytic baseline.
- Audit whether an observed effect is robust, generalizable, or explainable by confounding variables.

Do not use this skill as a substitute for laboratory standard operating procedures, safety training, executable hardware control sequences, or clinical decision-making.

# Inputs required

Before producing a research plan, request or infer:

- **Target observable and scientific use case:** the measurable quantity and how it will be evaluated.
- **Incumbent operational limit and fundamental bound:** the current practical ceiling and the theoretical limit, if known.
- **Proposed mechanism or model:** the concept, transformation, or architecture intended to improve performance or explain observations.
- **Known failure regime:** the conditions under which existing methods are expected to be weak or invalid.
- **Available validation scope:** simulation-only, component-level, integrated comparison, cross-probe reconciliation, or operational stress test.
- **Baseline methods:** standard filters, analytic models, established algorithms, or prior experimental configurations for fair comparison.
- **Constraints:** safety boundaries, compliance requirements, reproducibility standards, data-quality flags, and resource limits.

If a required input is missing, state the assumption and label all downstream conclusions as conditional.

# Core Workflow

1. **Frame the gap and anchor baselines**
   - Define the target observable, the incumbent operational limit, the fundamental or theoretical bound, and the practical implementation ceiling.
   - State why the gap persists and why prior evidence is indirect, incomplete, or confounded.
   - **Gate:** If no clear observable or matched baseline can be defined, stop and refine the research question.

2. **Generate ranked, falsifiable hypotheses**
   - Produce at least three hypotheses: a primary mechanism hypothesis, a null/artifact hypothesis, and an alternative mechanism.
   - For each, specify the predicted observable signature, evidence strength (strong / moderate / weak / speculative), key assumptions, likely failure modes, minimal validation test, and transfer boundary.
   - **Gate:** If a hypothesis lacks a falsifiable prediction or a feasible minimal validation path, return to Stage 1.

3. **Design controlled validation**
   - Define independent, dependent, and nuisance variables.
   - Assemble controls: incumbent baseline, negative control (absence of predicted effect), positive control (known response), ablation or sham control (process artifacts), and fairness control (same efficiency, calibration, noise, or loss assumptions).
   - Pre-register primary and secondary metrics, stopping criteria, and safety boundaries before data interpretation.
   - **Gate:** If the design violates safety or compliance constraints, or if the mechanism cannot be isolated from confounders, stop.

4. **Execute and analyze with uncertainty propagation**
   - Calibrate measurements and propagate statistical and systematic uncertainties into all performance comparisons.
   - Compare the proposed approach against matched baselines under identical conditions.
   - Fit imperfection-aware models to observations; separate verified observations from inferred mechanisms.
   - Audit failures as evidence, classifying whether they originate from the mechanism, implementation quality, calibration, statistical power, or baseline invalidity.
   - **Gate:** If the apparent effect disappears under matched conditions, if systematic drift dominates, or if calibration is invalid, trigger iteration or stop.

5. **Stress-test robustness and generalization**
   - Perturb parameters, resolution, event topology, environmental conditions, or analysis choices to test stability.
   - Evaluate performance outside the training or calibration manifold.
   - Check reproducibility across independent runs, samples, data segments, or detector states.
   - **Gate:** If gains are narrow, non-reproducible, or depend on a single arbitrary window or preprocessing choice, narrow the claim boundary or pivot to a new hypothesis.

6. **Bound claims and plan iteration**
   - Restrict claims to the tested regime (signal family, device class, operating conditions, probe combination).
   - Label evidence as directly supported, model-inferred, or speculative.
   - Update the hypothesis ledger: strengthen, narrow, split, reframe, or discard based on evidence.
   - Define the next minimal validation step or a pivot criterion.
   - **Stop conditions:** The claim passes all validation gates; a fundamental flaw is found; safety limits are reached; or the effect is indistinguishable from baseline under all tested conditions.

# Output Format

When using this skill, return a structured research plan:

1. **Research question:** one-sentence objective and target operating regime.
2. **Gap map:** incumbent limit, fundamental bound, and practical implementation barrier.
3. **Ranked hypothesis table:** observation, gap, mechanism, predicted signature, evidence strength, key assumptions, failure modes, minimal validation, and transfer boundary.
4. **Validation design:** variables, controls, metrics, staged validation plan, and stop conditions.
5. **Analysis plan:** calibration, uncertainty handling, baseline comparison, modeling, robustness checks, and failure audit.
6. **Iteration plan:** update rules, next validation step, and pivot criteria.
7. **Validity and safety notes:** confounders, reproducibility checks, boundary conditions, and non-operational safety constraints.
8. **Evidence ledger:** what is directly supported, what is inferred, and what remains speculative.

# Validation Gates

- **Baseline fairness:** Baselines use the same signal, noise, loss, detector efficiency, calibration, and prior assumptions as the proposed method.
- **Statistical validity:** Uncertainty intervals include statistical and systematic contributions; conclusions do not rely on marginal effects.
- **Calibration agreement:** Independent calibration channels or model predictions agree within predefined tolerance.
- **Confounder control:** Nuisance variables are measured or bounded and separated from the mechanism of interest.
- **Reproducibility:** Results persist across independent time segments, runs, samples, or data splits with documented procedures.
- **Physical consistency:** Reconstructed or derived quantities respect known physical constraints and response-function mappings.
- **Generalization:** Improvement survives outside the training, calibration, or initial measurement manifold.

# Claim Boundaries

- Claims are limited to the tested observable, signal family, parameter regime, and system class.
- Single-source or single-system evidence is treated as conditional support for a mechanism, not as field-wide consensus.
- Per-component, per-symbol, or narrow-regime success does not imply collective, network-level, or long-term operational advantage.
- Mathematical or simulation-based necessity is distinguished from physical or engineering plausibility.
- Extrapolation beyond tested conditions, materials, or device classes is explicitly labeled speculative.

# Failure Modes

- Mechanism does not operate as hypothesized under realistic noise, loss, or environmental conditions.
- Implementation immaturity or a component bottleneck dominates over the intended mechanism.
- Calibration drift, systematic error, or an uncontrolled nuisance variable mimics the predicted effect.
- Insufficient statistical power, unstable deconvolution, or data leakage produces false positives.
- Invalid baseline comparison due to unequal efficiency, noise, resolution, or assumptions.
- Model mismatch or approximation breakdown outside the intended regime.
- Processing artifact, post-selection bias, or future-information leakage.

# Validity Checks

Before finalizing conclusions, check:

- **Confounding:** Can drift, background, heating, instrument pickup, environmental change, or diagnostic perturbation explain the result?
- **Identifiability:** Does the data contain enough information to distinguish the proposed mechanism from alternative explanations?
- **Baseline fairness:** Are baselines evaluated under identical conditions with comparable prior information?
- **Statistical validity:** Are uncertainty estimates based on independent data, repeated runs, or validated simulations rather than training loss or single-trial metrics?
- **Reproducibility:** Are data splits, model choices, preprocessing decisions, random seeds, and analysis code documented?
- **Boundary discipline:** Are claims restricted to the tested regime, and are failure modes and non-transferable specifics stated?
- **Mechanism discipline:** Is the advantage tied to a causal mechanism rather than a favorable curve, component choice, or post-processing artifact?
- **Consensus discipline:** Is single-paper or single-system evidence distinguished from universal consensus?

# Provenance

Derived from cluster 198.0 (observable-driven evidence analysis and claim audit). Synthesizes shared workflow routes from source skills: quantum-optical-receiver-research-design, superconducting-quantum-trajectory-workflow, derivative-contrast-quantum-oscillation-exploration, fluctuating-environment-sensing-workflow, resonant-antenna-bandwidth-exploration, high-energy-jet-analysis-workflow, plasma-rf-sheath-exploration, strange-metal-density-response-exploration.
