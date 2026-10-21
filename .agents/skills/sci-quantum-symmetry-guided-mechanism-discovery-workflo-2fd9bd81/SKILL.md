---
name: sci-quantum-symmetry-guided-mechanism-discovery-workflo-2fd9bd81
description: A reusable end-to-end workflow for discovering and validating physical mechanisms behind symmetry-breaking anomalies or unexpected deviations in quantum, nuclear, and correlated many-body systems.
scienceevolve-title: "Quantum materials and condensed matter · symmetry guided mechanism discovery workflow 42"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

This skill guides an agent through a disciplined, end-to-end workflow to propose, test, and bound claims about physical mechanisms that cause deviations from expected symmetry, conservation-law, or baseline behavior. It synthesizes pattern-driven research design across quantum, nuclear, and correlated many-body domains, emphasizing controlled validation, uncertainty propagation, and iterative refinement rather than single-observable inference or paper-specific reproduction.

# When to use

Use this skill when:
- A user asks to explain or validate an anomaly, deviation, or unexpected regime relative to a symmetry-based or simplified baseline.
- The research involves inferring hidden mechanisms from indirect observables, population distributions, correlation structures, or latent quantities.
- Competing theoretical pictures exist (e.g., mean-field vs. correlation-aware, threshold-coupling vs. mixing, composite order vs. component order) and must be discriminated.
- The task requires designing controls, minimal validation plans, or robustness checks for mechanism claims.

Do not use this skill for:
- Operational laboratory instructions, material synthesis protocols, detector operations, or hazardous experimental execution.
- Substituting for collaboration-level experimental design or safety-critical implementation.
- Reproducing paper-specific numerical results, parameter choices, or conclusions as universal facts.

# Inputs required

Before executing the workflow, collect or infer:

- **Baseline expectation**: the symmetry relation, conservation law, or simplified model against which deviations are measured.
- **Target systems/regimes**: the family of systems, states, or population classes under study.
- **Anomaly characterization**: the specific deviation, gap, clustering, or unexpected regime to be explained.
- **Competing mechanisms**: at least one target mechanism and one simpler alternative (null or confounder).
- **Observable strategy**: primary and secondary diagnostics, including whether they are direct, indirect, composite, or population-level.
- **Uncertainty sources**: statistical, systematic, model-dependence, representation-dependence, finite-size, and sampling uncertainties.
- **Validation tools**: available computational, analytical, or observational methods and their known limitations.
- **Claim scope**: intended level of inference (feasibility test, qualitative constraint, parameter inference, or model discrimination).

If inputs are missing, state assumptions explicitly and label downstream claims as conditional.

# Core Workflow

## 1. Establish baseline and identify anomaly
- Define the baseline relation or expected behavior under the approximate symmetry or simplified model.
- Identify localized, statistically meaningful deviations that are not uniformly distributed across the family.
- Propagate uncertainty from data, fit, and extrapolation before treating a residual as anomalous.
- **Decision gate**: If no deviation survives uncertainty propagation, stop and refine the baseline or seek better data.

## 2. Generate competing mechanistic hypotheses
- **Target mechanism hypothesis**: the new effect (e.g., correlation correction, threshold coupling, composite order, hidden-sector interaction) that explains the anomaly.
- **Null/simpler hypothesis**: the anomaly is explained by known physics, baseline artifacts, or trivial disorder.
- **Confounder hypotheses**: representation dependence, finite-size effects, selection bias, calibration artifacts, or environmental nuisance.
- For each hypothesis, specify:
  - Predicted signature in the chosen observable(s).
  - Evidence strength (weak / moderate / strong).
  - Key assumptions and required conditions.
  - Likely failure modes and minimal falsifiable test.
- **Decision gate**: If no hypothesis yields a falsifiable prediction with accessible diagnostics, redesign the observable strategy before proceeding.

## 3. Design controlled validation
- **Variables**: define independent variables (system class, perturbation, representation), dependent variables (diagnostics, residuals, inferred quantities), and nuisance variables (sampling, selection, environmental factors).
- **System selection**:
  - Baseline systems where the effect should be small or absent.
  - Target systems where the effect should be visible.
  - Ambiguous systems where competing mechanisms may dominate.
- **Controls**:
  - **Positive control**: a regime with independent support for the expected signature.
  - **Negative control**: a regime where the mechanism should not operate.
  - **Strong control**: a contrastive design that breaks parameter degeneracy or representation ambiguity.
  - **Implementation control**: a variant that should not change the qualitative conclusion if the mechanism is robust.
- **Minimal viable validation**: the smallest analysis that can falsify at least one hypothesis, including baseline reproduction and one cross-check.
- **Pre-execution stop conditions**: define thresholds for insufficient sensitivity, prior dominance, or unresolvable model dependence.

## 4. Execute and run diagnostics
- Reproduce the baseline behavior in the control regime using the full analysis pipeline.
- Apply the identical pipeline to target and ambiguous regimes.
- Run implementation diagnostics:
  - Convergence and numerical stability.
  - Equilibration or sampling adequacy.
  - Consistency across representations or discretizations.
  - Sensitivity to initial conditions or ensemble choice.
- **Decision gate**: If positive controls fail, diagnostics indicate unreliable data, or the pipeline is unstable, halt execution and fix the method before interpreting results.

## 5. Analyze with uncertainty and robustness
- Quantify uncertainty components separately: statistical, systematic, model-dependence, representation-dependence, and finite-size.
- Compare observed patterns against all hypothesized signatures across controls.
- Test robustness:
  - Scale or resolution variation.
  - Alternative representations that preserve on-shell or symmetry constraints.
  - Prior sensitivity in Bayesian settings.
  - Microscopic changes that preserve the slow-mode or symmetry structure.
- Assess discriminative power: after all uncertainties, can the observable distinguish the target mechanism from alternatives?
- **Decision gate**: If model-dependence or representation spread dominates the signal, or if uncertainty erases qualitative distinctions, downgrade the claim to a feasibility boundary or stop.

## 6. Evaluate evidence and bound claims
- Classify evidence:
  - **Strong**: multiple independent diagnostics and controls converge.
  - **Moderate**: coherent trend but a major confounder or assumption remains untested.
  - **Weak/Speculative**: plausible but dependent on a single observable or limited regime.
  - **Boundary-only**: credible only within a restricted domain.
- Check influence robustness: do conclusions survive removal of high-leverage data points, events, or parameter choices?
- Verify that the mechanism predicts both where the effect should appear and where it should be absent.
- **Decision gate**: If the conclusion is prior-dominated, artifact-driven, or relies on a single unvalidated method, stop and redesign.

## 7. Iterate, refine, or terminate
- **If target mechanism is supported**: refine its scope, identify the minimal interaction or symmetry requirements, and propose generalization tests in adjacent regimes.
- **If null/confounder is supported**: discard or replace the target hypothesis; document the simpler explanation.
- **If ambiguous**: classify as inconclusive; specify missing data, better observables, or required computational advances; redesign the study.
- **Before generalizing**: require explicit re-validation when moving to larger systems, different representations, new observables, or untested populations.
- **Final stop**: claims must not exceed the validated regime. Output a clear validity and boundary statement.

# Output Format

When using this skill, return:

1. **Research question**: concise statement of the anomaly and mechanism being tested.
2. **Baseline and anomaly summary**: expected behavior, identified deviation, and uncertainty assessment.
3. **Hypothesis set**: for each hypothesis—claim, predicted signature, evidence strength, key assumptions, failure modes, and minimal test.
4. **Validation design**: variables, system selection, controls, minimal viable validation, and pre-execution stop conditions.
5. **Analysis plan**: pipeline description, uncertainty budget, robustness checks, and discriminative-power assessment.
6. **Evidence classification**: strong, moderate, weak, or boundary-only, with justification.
7. **Iteration path**: actions for support, null result, ambiguity, or diagnostic failure.
8. **Validity and boundary statement**: confounders, reproducibility requirements, extrapolation limits, and safety constraints.

# Validation Gates

Before finalizing any claim, confirm:
- The baseline relation is appropriate for the selected family and regime.
- Controls behaved as expected (positive reproduced, negative suppressed, strong broke degeneracies).
- Uncertainty is propagated to all derived quantities and reported as negligible, comparable, or dominant per component.
- Cross-observable and cross-system consistency is demonstrated or disagreement is explained.
- Representation or model invariance holds where required; otherwise, model-dependence is treated as part of the conclusion.
- Finite-size, convergence, and sampling artifacts are bounded and do not drive the result.
- The mechanism predicts both positive and negative cases.
- Reproducibility documentation (assumptions, pipeline, provenance, decision rules) is complete.

# Claim Boundaries

- Do not claim direct measurement of off-shell, latent, or unobservable quantities without explicit representation-consistency and uncertainty control.
- Do not generalize beyond the validated regime, system class, symmetry sector, or accessible scale.
- Do not treat a single study, model, or simulation as field-wide consensus.
- Do not assert mechanism discovery when evidence is purely correlational, prior-dominated, or dependent on one unvalidated method.
- Do not extrapolate to operational parameters, material synthesis, hazardous experimental execution, or untested populations.

# Failure Modes

- **Baseline mis-specification**: a poorly chosen baseline creates false anomalies or masks real effects.
- **Representation/model dependence**: apparent signals are artifacts of a specific model, source representation, or approximation scheme.
- **Finite-size or convergence artifacts**: insufficient scale or numerical control mimics a physical mechanism.
- **Discriminative failure**: observables lack sensitivity to distinguish competing hypotheses after uncertainty.
- **Overfitting**: a single high-leverage data point, event, or parameter drives the conclusion.
- **Assumption violation**: required conditions (e.g., time-scale separation, equilibrium, symmetry) are not met.
- **Confounding by nuisance variables**: selection effects, environmental factors, calibration differences, or channel coupling explain the residual.

# Validity Checks

- **Symmetry/consistency**: Does the analysis respect the relevant conservation laws, symmetries, or sum rules?
- **Mechanism specificity**: Does the proposed mechanism uniquely explain the pattern better than generic mixing, finite-size, or slow-mode effects?
- **Observable sensitivity**: Is the diagnostic sensitive to the mechanism and not dominated by implementation details?
- **Scale stability**: Do results survive changes in system size, resolution, discretization, or approximation order?
- **Prior/data balance**: Are posterior or inferred features driven by data rather than prior boundaries or arbitrary choices?
- **Predictive completeness**: Does the mechanism predict where the effect should be absent as well as where it should appear?
- **Reproducibility**: Are data sources, model definitions, transformation rules, and computational settings documented?

# Provenance

Synthesized from cluster 180.0 (symmetry-guided mechanism discovery and validation). Source skills: hadron-femtoscopy-research-design, computational-spin-glass-research-workflow, open-quantum-systems-correlation-memory-workflow, nuclear-imme-threshold-research, conserved-mode-information-relaxation, gravitational-wave-superradiance-population-inference, nuclear-dom-latent-structure-inference, spin-orbital-fluctuation-research.
