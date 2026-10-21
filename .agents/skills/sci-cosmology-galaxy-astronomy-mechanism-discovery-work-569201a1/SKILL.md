---
name: sci-cosmology-galaxy-astronomy-mechanism-discovery-work-569201a1
description: A reusable end-to-end workflow for generating, testing, and iterating mechanism hypotheses in galaxy formation and halo astronomy using observable tensions, controlled contrasts, and multi-diagnostic validation.
scienceevolve-title: "Galaxy, cosmology, and simulations · galaxy astronomy mechanism discovery workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

# Purpose

Help an agent design and execute reusable research plans that turn observable tensions or patterns in galaxy formation, halo dynamics, and large-scale structure into testable mechanism hypotheses, validate them through controlled contrasts and multi-diagnostic calibration, and iterate based on evidence without overclaiming.

# When to use

Use this skill when the user asks to:
- Generate new research questions or hypotheses about galaxies, haloes, substructures, cosmic environments, feedback, chemical enrichment, or assembly histories.
- Design simulation, observational, or catalog-based studies to discriminate between competing physical or methodological explanations.
- Validate a candidate mechanism against independent constraints, benchmarks, or alternative model families.
- Plan iterative analyses that update hypotheses from diagnostic failures, residuals, or robustness checks.

Do not use this skill as a substitute for executing domain-specific simulation pipelines, reducing raw survey data, or asserting field-wide consensus from a single study.

# Inputs required

Before producing a plan, identify or request:

- **Target domain and regime:** object class, mass or redshift range, environment type, and relevant physical scales.
- **Observable tension or pattern:** the discrepancy, trend, or population difference to be explained.
- **Baseline framework:** the accepted model, empirical relation, or reference simulation against which to compare.
- **Available benchmarks:** simulations, curated catalogues, survey data, mock observations, or analytic expectations.
- **Candidate explanation classes:** physical mechanisms, initial-condition or driver effects, late-stage processes, selection or mapping effects.
- **Measurement definitions:** how objects, environments, samples, and observables are defined and selected.
- **Constraints:** computational cost, data access, resolution limits, and required output granularity.

# Core Workflow

Follow this ordered route. At each decision gate, pause and redesign or stop if the condition is not met.

## 1. Frame the observable tension
Restate the baseline framework and the specific mismatch, trend, or population difference. Identify whether the signal is scale-specific, environment-specific, population-specific, or time-specific. Document the observable definition and why it matters.

## 2. Decompose explanation classes
Divide candidate explanations into:
- **Driver-level:** changes to initial conditions, source terms, or early formation physics.
- **Process-level:** late-stage transformations such as stripping, quenching, feedback, or dynamical evolution.
- **Mapping-level:** biases in how theoretical quantities are converted into observables or how samples are selected.
- **Data-quality:** incompleteness, resolution limits, or processing artefacts.

## 3. Generate mechanism-ranked hypotheses
For each explanation class, produce at least one hypothesis card containing:
- Claim and mechanism.
- Expected signature in primary and secondary diagnostics.
- Evidence strength (speculative, plausible, supported, or strongly supported).
- Key assumptions and boundary conditions.
- Likely failure modes.
- Minimum viable falsification test.

**Decision Gate 1 (Candidate Gate):** Proceed only if at least two competing hypotheses make different predictions that are measurable with available resources. If not, refine the observable definition or stop.

## 4. Design minimal validation
Define:
- **Model variants:** baseline, mechanism-on, mechanism-off, compensation, and confounder baselines.
- **Controls:** positive control (regime where the effect should be strong), negative control (regime where it should be weak), baseline control (standard expectation), and robustness control (alternative definitions or processing choices).
- **Variables:** intervention, mediating, outcome, preservation, and confounder variables.
- **Metrics:** primary discrepancy metric, secondary diagnostic metrics, specificity metric, consistency metric, and complexity metric.
- **Stop conditions:** violation of independent constraints, control failure, or inability to distinguish mechanisms.

**Decision Gate 2 (Robustness Check):** Proceed only if the design includes at least one independent consistency check and a clear failure criterion. If not, redesign or stop.

## 5. Prepare definitions and benchmarks
State explicitly how objects, environments, samples, and observables are defined. Calibrate against benchmarks, treating benchmark limitations (resolution, finder effects, selection) as part of the uncertainty model. Normalize by context-scale quantities where appropriate before testing universality.

## 6. Execute primary analysis
- Reproduce the baseline tension under the chosen definitions.
- Run model variants and compare outcomes.
- Aggregate primary and secondary statistics.
- Classify residuals as mechanism-specific, scale-specific, time-specific, or processing-specific.

## 7. Discriminate mechanisms
Compare model families using:
- Ablation or contrast tests that isolate single mechanisms.
- Matched-sample or matched-lineage comparisons to separate selection from physics.
- Multi-observable consistency checks (a mechanism must not trade one failure for another).
- Degeneracy checks to identify parameter combinations or alternative mechanisms that produce indistinguishable outputs.

**Decision Gate 3 (Mechanism Exclusion):**
- **Reject** the hypothesis if it violates a strong independent constraint, requires more tuning than the discrepancy it solves, or fails a decisive control.
- **Revise** if the target improves but assumptions are narrow or one consistency check is marginal.
- **Support** if the target improves, independent constraints pass, and predictions remain stable.
- If ambiguous, suspend judgment and proceed to Step 8.

## 8. Iterate and stress-test
- Test alternative environment or object definitions.
- Repeat across host mass, redshift, local-status, or completeness regimes.
- Check whether the signal survives matching on dominant confounders (e.g., mass, velocity dispersion, selection class).
- Inspect whether full-population and matched-subset results agree.

**Decision Gate 4 (Stability Gate):** If the signal disappears under defensible alternative definitions, matching, or processing choices, downgrade the claim to a selection-driven or definition-dependent effect and return to Step 3. If it survives, proceed.

## 9. Audit uncertainty and bound claims
- Separate statistical, systematic, and model uncertainty.
- Flag regions where incompleteness, extrapolation, or proxy uncertainty weakens inference.
- Label each claim as benchmark-supported, cross-study-supported, or agent-inferred.
- State the exact regime (mass, redshift, environment, population) to which conclusions apply.

**Stop Condition (Claim Bounding):** Halt if uncertainty overwhelms the predicted effect, if the result depends on a single unverified assumption, or if independent cross-checks contradict the mechanism without an explained selection effect.

# Output Format

Return a structured research plan containing:

1. **Research question** — concise, testable question and scientific context.
2. **Gap diagnosis** — type of gap (empirical, theoretical, methodological, interpretive) and why existing explanations are insufficient.
3. **Hypothesis table** — ranked candidates with evidence strength, key assumptions, expected signatures, failure modes, and rejection criteria.
4. **Experimental design** — model variants, samples, controls, variables, metrics, and stop conditions.
5. **Analysis plan** — data preparation, benchmark comparison, diagnostic computation, residual classification, and degeneracy checks.
6. **Iteration plan** — decision rules for supporting, revising, rejecting, or suspending judgment on each hypothesis.
7. **Validity and boundary statement** — confounders, reproducibility requirements, extrapolation limits, and evidence labels.
8. **Decision summary** — recommended next test and the evidence threshold needed to proceed.

# Validation Gates

Before advancing a hypothesis, confirm:
- The baseline tension is reproduced under the stated observable definitions.
- At least two competing hypotheses are discriminable by the proposed diagnostics.
- Controls are defined and expected to behave distinctly under each hypothesis.
- Benchmarks are treated as comparison targets with documented limitations, not as unquestioned truth.
- A mechanism is not accepted if it improves only a single aggregate metric while degrading others.
- Independent consistency checks are included and pass before claims are generalized.

# Claim Boundaries

- Limit claims to the tested object class, mass regime, redshift range, environment type, and model family.
- Distinguish paper-supported methodological patterns from agent-inferred extensions to new problems.
- Do not present single-study or single-simulation results as field-wide consensus.
- Separate observed measurements, method-inferred quantities, and assumption-dependent extrapolations.
- Mark speculative mechanisms, unverified transferability, and provisional hypotheses clearly.

# Failure Modes

- **Degeneracy:** Multiple mechanisms or parameter combinations produce indistinguishable outputs under the chosen metrics.
- **Selection confounding:** Apparent environmental or population differences arise from mass, redshift, or selection mismatches rather than the proposed mechanism.
- **Survivorship bias:** Restricting to matched survivors or detected objects changes the population-level conclusion.
- **Definition sensitivity:** Results reverse under defensible alternative object, environment, or aperture definitions.
- **Overfitting:** A complex mechanism explains the target discrepancy but requires more tuning than the problem warrants.
- **Benchmark artefact:** The signal reflects resolution limits, finder choices, boundary cuts, or catalogue processing rather than physics.
- **Propagation of uncertainty:** Uncorrected completeness, cosmic variance, or calibration errors masquerade as physical trends.

# Validity Checks

Before presenting conclusions, verify:
- **Confounding control:** Target and control samples are matched or adjusted for variables most predictive of the observable.
- **Definition consistency:** Object, environment, and observable definitions are stable across model variants and benchmarks.
- **Robustness:** Conclusions survive changes in proxy family, processing choices, and baseline methods.
- **Reproducibility:** Data provenance, selection criteria, matching procedures, and analysis logic are documented.
- **Statistical validity:** Uncertainties, multiple-comparison risks, and small-sample regimes are reported appropriately.
- **Mechanism isolation:** Ablation or contrast tests change one mechanism at a time rather than many assumptions simultaneously.
- **Cross-axis testing:** Results are checked across relevant regimes (e.g., mass, redshift, environment, local status).
- **Evidence labeling:** Paper-supported patterns, analogy-supported inferences, and new agent-generated claims are clearly separated.

# Provenance

This skill was synthesized from cluster `25.1` (observable-driven mechanism discovery and validation) of the scientific skills codex. It merges methodological patterns drawn from the following source skills:
- `dark-matter-substructure-research-design`
- `cosmological-substructure-scale-tension`
- `lss-void-galaxy-evolution-exploration`
- `high-redshift-quasar-environment-research`
- `galaxy-chemical-enrichment-feedback-workflow`
- `astronomy-research-exploration-workflow`
- `astronomy-latent-system-discovery`
- `galaxy-satellite-twin-dynamics-workflow`

No specific paper conclusions, numerical results, or operational protocols are embedded in the reusable workflow body.
