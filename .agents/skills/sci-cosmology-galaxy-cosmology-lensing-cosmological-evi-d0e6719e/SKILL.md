---
name: sci-cosmology-galaxy-cosmology-lensing-cosmological-evi-d0e6719e
description: A reusable end-to-end workflow for designing, validating, and auditing scientific claims in cosmological and astrophysical inference, from hypothesis generation through controlled simulation and uncertainty decomposition to bounded claim reporting.
scienceevolve-title: "Galaxy, cosmology, and simulations · galaxy cosmology lensing cosmological evidence analysis workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

# Purpose

This skill helps an agent turn complex inference problems in cosmology, galaxy formation, large-scale structure, and related astrophysical domains into reproducible, evidence-based research plans. It teaches a reusable workflow: frame the inference gap, generate falsifiable hypotheses, design controlled validation with explicit stop conditions, decompose uncertainty, and bound claims based on robustness evidence rather than single-study results.

# When to use

Use this skill when the user asks for help with one or more of the following tasks:

- Proposing new research questions around latent structures, cross-observables, population statistics, or simulation-derived quantities.
- Auditing hidden assumptions in component decomposition, proxy-based correction, or pipeline reconstruction.
- Designing simulation, mock-catalog, or synthetic-data validation for a model, estimator, or inference pipeline.
- Diagnosing how selection effects, sample variance, numerical convergence, or nuisance physics could bias inferred parameters.
- Evaluating whether an apparent signal, correlation, or improvement is robust, calibrated, or driven by untested assumptions.
- Planning parameter inference where measurement uncertainty, model degeneracy, and systematic effects must be separated.

Do not use this skill as a general astrophysics textbook, a data-analysis code generator, an operational observing recipe, or a source of field-wide consensus claims from any single paper or dataset.

# Inputs required

Before generating a research plan, ask for or identify:

- The target observable, parameter, or latent field and the scientific decision that depends on it.
- The baseline theoretical or empirical model and why it may be insufficient.
- Candidate proxies, systematics, or hidden variations that could bias the inference.
- Available benchmarks: simulations, mock catalogs, synthetic data, independent observations, or analytic limits.
- Intended domain: scale range, redshift, tracer population, survey geometry, or environmental regime.
- Inference goal: which parameters or physical conclusions the method should preserve.
- Known uncertainty sources: selection functions, masks, boundaries, measurement error, cosmic variance, covariance approximations, or numerical resolution.
- Baseline methods already in use and constraints on compute, data access, and reproducibility.

If essential inputs are missing, produce a minimal viable plan with explicit assumptions and list the information needed to strengthen it.

# Core Workflow

## 1. Frame the Inference Problem and Gap

Define the target observable or parameter and the latent field or physical process it represents. State the scientific decision that depends on recovering or modeling this quantity. Identify why simpler or existing methods are insufficient (e.g., missing connectivity, unresolved scales, unmodeled nuisance physics, or selection effects).

**Gate 1 — Problem Isolation:** Proceed only if the observable can be separated from the process-level quantity and a plausible benchmark or mock reference exists. Otherwise, stop and redefine the scope.

## 2. Generate Mechanism-Aware Hypotheses

Propose hypotheses about hidden variation, structured systematics, or latent structures. For each hypothesis specify the feature class or mechanism, evidence strength (strong / moderate / weak / speculative), key assumptions, likely failure modes, a minimal viable test, and boundary conditions.

**Gate 2 — Hypothesis Viability:** Proceed only if at least one hypothesis is falsifiable with available data and the compared methods or assumptions span independent mechanistic choices. If all approaches share the same core assumption, stop and seek a distinct alternative.

## 3. Design Controlled Validation

Define a benchmark (high-fidelity simulation, mock catalog, or controlled synthetic data) that is plausibly converged for the target process. Factorize variables: numerical settings, structural properties, environmental regimes, and selection effects. Establish a control hierarchy:

- **Negative controls:** randomized, null, or homogeneous backgrounds.
- **Positive controls:** known signal or strong expected effect.
- **Degraded-data controls:** downsampling, added noise, or mask perturbation.
- **Baseline comparisons:** simpler methods that contextualize added complexity.
- **External controls:** independent datasets or methods not used to tune the model.

Pre-define metrics that distinguish robustness from visual fit: component-level errors, posterior shifts, residual structure, stability across thresholds or scales, and improvement over baselines. State stop conditions before running experiments.

**Gate 3 — Design Rigor:** Proceed only if the benchmark is adequate, the target process is isolable, and the control set can expose calibration degeneracy or hidden assumptions. Otherwise, redesign the experiment.

## 4. Execute Minimal Viable Validation

Run the smallest test capable of falsifying the primary hypothesis. Compare corrected or augmented models against the baseline and the benchmark. Inspect whether total-signal fit quality masks component-level misallocation or bias.

**Gate 4 — Minimal Validation:**
- If negative controls reproduce the signal, downgrade evidence and redesign.
- If results vanish under mild degradation or depend on a single arbitrary threshold, stop and revise the model.
- If component-level errors are large while total residuals are small, diagnose degeneracy redistribution and continue to the robustness audit.

## 5. Stress-Test and Robustness Audit

Expand to strong validation: vary tracer populations, scales, redshifts, nuisance strengths, and subpopulations. Decompose uncertainty into statistical, systematic, cosmic variance, model, and auxiliary-data components. Test estimator stability, prior sensitivity, covariance conditioning, and boundary sensitivity.

**Gate 5 — Robustness:**
- If structured residuals remain, identify the missing variable and refine the transfer or correction model.
- If nuisance parameters become strongly degenerate without defensible constraints, stop and restrict the inference domain.
- If a subpopulation fails while aggregate metrics succeed, do not claim universal success; bound the claim to the passing regime.

## 6. Iterate and Refine

Update hypotheses based on diagnosed failure modes (e.g., resolution limits, selection mismatch, environment dependence, or proxy breakdown). Add targeted controls for the suspected mechanism. Restrict the domain, relax assumptions, or upgrade the model only when justified by diagnostics.

**Iteration rule:** Loop back to Stage 3 or 4 until the target metric is stable across independent variations, or until the scope is explicitly bounded. Stop iterating if the correction or complex model adds no value over a simpler baseline.

## 7. Bound Claims and Plan Communication

Separate detection or prediction from mechanism or causal explanation. State domain boundaries: untested redshifts, scales, populations, survey geometries, and model families. Label claims by evidence strength and distinguish paper-supported mechanisms, analogy-supported transfers, and new inferences.

**Gate 6 — Claim Readiness:** Finalize the research plan only if validation supports the intended inference target. If validation is insufficient, defer interpretation and specify required next steps.

# Output Format

When using this skill, return a structured research plan containing:

1. **Research question:** one concise question tied to an inference bottleneck.
2. **Gap and motivation:** what existing approaches miss and why it matters.
3. **Hypotheses:** each with evidence strength, key assumptions, failure modes, and boundary conditions.
4. **Experimental design:** benchmark definition, factorized variables, controls, metrics, and stop conditions.
5. **Analysis plan:** data audit, representation or model audit, baseline comparison, uncertainty decomposition, residual diagnostics, and independent validation.
6. **Iteration rules:** how the plan updates under instability, degeneracy, baseline equivalence, or successful validation.
7. **Validity checks:** confounders, reproducibility, statistical validity, feature or regime boundaries, and extrapolation limits.
8. **Evidence table:** for each candidate hypothesis, list evidence strength, key assumptions, possible failure modes, minimal validation, strong control, negative control, positive control, and stop condition.
9. **Claim boundaries:** separate detected signals from downstream mechanism claims and state where the plan should not be extrapolated.

# Validation Gates

Before advancing between workflow stages, confirm:

- **Problem isolation:** The observable is separable from the process-level quantity and a reference exists.
- **Hypothesis falsifiability:** At least one hypothesis can be materially weakened or strengthened by a feasible experiment.
- **Benchmark adequacy:** The reference is converged or fair for the target process, not merely visually plausible.
- **Control independence:** Controls span distinct mechanistic assumptions rather than variants of the same design.
- **Residual diagnostics:** Errors are examined for structure across scale, environment, and subpopulation.
- **Uncertainty decomposition:** Statistical, systematic, and model uncertainties are separated and propagated.
- **Claim boundedness:** Conclusions are restricted to the validated domain and evidence strength is labeled.

# Claim Boundaries

- Distinguish detection or prediction from mechanism, causation, or physical explanation.
- Do not treat a single dataset, simulation suite, or study as field-wide consensus.
- Limit claims to the tested domain of scale, redshift, tracer population, survey geometry, and model family.
- Label paper-supported mechanisms separately from analogy-supported transfers and from new agent inferences.
- When endpoint agreement hides history or component divergence, report the degeneracy rather than claiming success.
- Do not extrapolate corrected or inferred quantities beyond the validation regime without explicit uncertainty inflation and justification.

# Failure Modes

Stop or redesign the plan if any of the following occur:

- The benchmark itself is not converged or fair for the target process.
- The target process cannot be isolated from competing processes or confounders.
- Randomized or negative controls produce comparable signals or structures.
- Most signals disappear under mild data degradation or threshold perturbation.
- Results depend on a single arbitrary threshold, estimator, or preprocessing choice.
- The method adds no value over a simpler baseline for the stated question.
- Nuisance parameters become strongly degenerate without defensible constraints.
- Structured residuals remain after correction or model refinement.
- Aggregate success hides failure in an important subpopulation or regime.
- The analysis definition, resolution, or sample count dominates the apparent result.
- Validation is insufficient for the intended inference target.

# Validity Checks

Before finalizing the research plan, check:

- **Confounding:** Are selection effects, masks, boundary regions, observer location, sampling-density gradients, or grouping choices driving the result?
- **Reproducibility:** Can the same structures, posteriors, or parameter constraints be recovered with split data, alternative preprocessing, or an independent implementation?
- **Statistical validity:** Are variances estimated from enough independent realizations? Is covariance conditioning inspected? Is the number of inference bins matched to the information content?
- **Threshold and scale sensitivity:** Are conclusions stable across a reasonable parameter sweep?
- **Baseline necessity:** Does the proposed method add information beyond simpler summaries?
- **Extrapolation boundary:** Are claims limited to the data regime, feature class, and validation scope?
- **Mechanism separation:** Are detection, prediction, and causal or physical explanation kept distinct?
- **Model validity:** Is the theoretical or numerical prediction appropriate for the chosen scale range and regime?
- **Parameter validity:** Are degenerate parameters interpreted cautiously, and are uncertainties propagated honestly?

# Provenance

Synthesized from cluster 3.0 (galaxy-cosmology-lensing-cosmological-evidence-analysis-workflow) and representative source skills: persistent-topology-research-workflow, baryonic-cross-spectrum-research-skill, galaxy-formation-model-uncertainty-workflow, resolution-aware-satellite-stripping-research, peculiar-velocity-correlation-workflow, galaxy-mass-decomposition-bias-audit, cosmology-cosmic-variance-research-design, gravitational-wave-standard-siren-systematics.
