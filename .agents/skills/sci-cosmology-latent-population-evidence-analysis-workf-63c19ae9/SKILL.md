---
name: sci-cosmology-latent-population-evidence-analysis-workf-63c19ae9
description: Design reusable research workflows that connect simulated or inferred latent populations to observables through hypothesis generation, controlled validation, cross-probe synthesis, uncertainty auditing, and iterative claim bounding.
scienceevolve-title: "Galaxy, cosmology, and simulations · latent population evidence analysis workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

# Purpose

This skill helps an agent design end-to-end research workflows for observable-driven evidence analysis and claim audit in astrophysics, cosmology, and related computational-physics domains. It abstracts a reusable pattern: define a latent quantity that is not directly observed, link it to measurable observables through physically motivated mappings, validate the chain with controlled experiments and cross-probe checks, audit uncertainties and systematics, and bound claims by evidence strength and tested domain.

# When to use

Use this skill when:
- A user asks to design research questions, experiments, or analysis plans that infer unobserved properties from simulations, surveys, or multi-wavelength/multi-probe data.
- The task requires connecting simulated populations, latent fields, or hidden states to observable search metrics, scaling relations, or dynamical signatures.
- The study must compare multiple hypotheses, prescriptions, or scenarios under uncertainty, and validate them against independent observables or known-truth benchmarks.
- The user needs uncertainty-aware synthesis of heterogeneous probes, feature-detection validation, or systematic stress-testing before drawing mechanism-level conclusions.

Do not use this skill as a general-purpose astronomy or physics tutor, a literature-consensus generator, or a source of operational observing procedures.

# Inputs required

- Target latent quantity and its scientific relevance (e.g., population property, field state, mass profile, event rate).
- Available data sources: simulation suites, survey catalogs, mock observations, or public data products, including known resolution and selection limits.
- Observable channel or probe that could constrain the latent quantity, and any suspected biases in current detection or mapping methods.
- Baseline or null models for comparison, and alternative scenarios or prescriptions that encode dominant uncertainties.
- Known nuisance parameters: selection functions, incompleteness, foreground/background contamination, projection effects, and instrumental systematics.
- Intended output type: hypothesis portfolio, experimental design, analysis plan, or full research proposal.

# Core Workflow

1. **Define the latent-to-observable inference gap**
   - State the unobserved quantity and the observable channel that could constrain it.
   - Identify why current analyses are insufficient (structured missingness, resolution limit, proxy breakdown, or search gap).
   - *Decision gate*: Stop and reformulate if no physically motivated forward model or proxy chain can link the latent quantity to a measurable observable.

2. **Generate contrasting scenario hypotheses**
   - Propose at least two internally consistent assumptions for the dominant uncertainty.
   - Assign evidence strength (high / medium / low / speculative) based on simulation support, observational cross-checks, or theoretical analogy.
   - Explicitly list key assumptions, expected diagnostic trends, and failure modes for each scenario.
   - *Decision gate*: Stop if the hypotheses are not falsifiable with available or obtainable data.

3. **Design a controlled validation package**
   - Specify minimal viable validation: a known-truth or positive-control case where the method should succeed, and a negative-control case where the signal should be absent or suppressed.
   - Define strong controls: alternative prescriptions, baseline methods, ablation tests, and cross-probe consistency checks.
   - State independent variables, dependent variables, evaluation metrics, and stopping conditions before analysis.
   - *Decision gate*: Flag the study as speculative and narrow its scope if no independent validation route exists.

4. **Build and validate the mapping from latent state to observable**
   - Construct the forward model, inference prescription, or feature detector that connects the latent quantity to observables.
   - Validate the mapping on idealized or known-truth data before applying it to complex datasets.
   - Test that the observable responds in the expected direction when the latent property changes.
   - *Decision gate*: Redesign the mapping if the observable is insensitive to the hypothesized latent difference, or if negative controls reproduce the signal.

5. **Execute scenario comparison and environmental stratification**
   - Run the full analysis for each hypothesis scenario and baseline.
   - Stratify results by environment, regime, scale, or subpopulation rather than relying solely on global averages.
   - Compare count-based and impact-weighted metrics to avoid tail-dominated misinterpretation.
   - *Decision gate*: If conditional trends disappear or reverse under stratification, weaken the mechanism claim and investigate confounders.

6. **Audit uncertainty and systematics**
   - Build an error budget separating universal/model-independent, model-dependent, observational, and numerical uncertainties.
   - Stress-test against selection effects, resolution limits, prior sensitivity, bridge-relation uncertainty, and background contamination.
   - Test whether the conclusion is driven by data or by priors/extrapolation.
   - *Decision gate*: Stop and narrow claims if results depend strongly on an unsupported extrapolation, incompatible priors across probes, or unmodeled systematics.

7. **Synthesize multi-probe or multi-observable evidence**
   - When multiple probes or validation observables exist, map each into a shared latent parameter space.
   - Check parameter definitions, prior compatibility, and nuisance-parameter consistency before combining evidence.
   - Diagnose degeneracies and tensions; do not average away probe disagreement.
   - *Decision gate*: If probes disagree, audit definitions, selection functions, and bridge calibrations before invoking new physics or combining likelihoods.

8. **Bound claims and classify evidence**
   - Label each finding as validated, model-dependent, observationally inferred, or speculative.
   - State the validity boundary in terms of mass, redshift, scale, tracer quality, regime, or survey selection.
   - Separate methodology supported by existing studies from agent-generated inferences for new settings.
   - *Decision gate*: Downgrade or reject any claim that requires extrapolation beyond the tested domain or relies on a single simulation suite as field-wide consensus.

9. **Iterate or terminate**
   - If residuals show structured discrepancies, return to Step 2 to generate a targeted subpopulation hypothesis, or to Step 4 to revise the mapping.
   - If added complexity improves only the already-fitted data but not controls, conditional trends, or sensitivity tests, stop iterating.
   - *Stop condition*: Terminate when the next step clearly targets an unresolved systematic or independent latent direction, or when failure modes are fully documented.

# Output Format

When using this skill, return:

1. **Research question and inference gap** — Concise statement of the latent quantity, observable channel, and why current analysis is insufficient.
2. **Evidence map** — What is supported by existing simulations, observations, or benchmarks; what is an extrapolation or agent inference.
3. **Hypothesis cards** — For each scenario: claim, evidence strength, key assumptions, expected trends, minimal discriminating test, and likely failure modes.
4. **Experimental design** — Target population or regime, data inputs, mapping/prescription choices, controls (positive, negative, baseline, ablation), variables, metrics, and stopping conditions.
5. **Analysis plan** — Mapping validation, scenario comparison, environmental stratification, uncertainty audit, cross-probe synthesis, and residual diagnostics.
6. **Iteration plan** — Rules for updating, weakening, or rejecting hypotheses based on control outcomes, residual structure, or probe disagreement.
7. **Validity and ethics statement** — Confounders, reproducibility requirements, statistical checks, boundary conditions, and claim limits.

# Validation Gates

- **Gap-closure gate (Step 1)**: A physically motivated latent-to-observable chain must exist; otherwise reformulate.
- **Falsifiability gate (Step 2)**: Hypotheses must be testable; otherwise stop.
- **Validation-route gate (Step 3)**: An independent validation path must be available; otherwise flag as speculative.
- **Sensitivity gate (Step 4)**: The observable must respond to latent changes and negative controls must remain null; otherwise redesign.
- **Stratification gate (Step 5)**: Conditional trends must survive environmental stratification; otherwise weaken claims.
- **Systematic-audit gate (Step 6)**: Claims must not depend on unsupported extrapolations or incompatible priors; otherwise stop and narrow.
- **Probe-agreement gate (Step 7)**: Multi-probe evidence must be consistent after calibration audit; otherwise diagnose before combining.
- **Extrapolation gate (Step 8)**: Claims must remain inside the tested domain; otherwise downgrade.

# Claim Boundaries

- Claim only what is validated within the tested domain, object class, and tracer quality.
- Distinguish validated findings from plausible inferences and speculative extensions.
- Do not present single-study, single-simulation, or single-probe results as field-wide consensus.
- Do not present simulation-validated performance as observational readiness without testing relevant survey systematics.
- Avoid overstating discovery claims when results depend on extrapolation, model assumptions, or uncertain backgrounds.

# Failure Modes

- **Prior-dominated recovery**: Conclusions driven by the latent prior rather than by data.
- **Model misspecification**: Forward model or inference prescription fails to capture the true data-generating process.
- **Mapping bias**: Detector, proxy, or reconstruction artifact produces spurious features or suppresses real ones.
- **Selection and background contamination**: Observational selection, incompleteness, or unmodeled backgrounds mimic or mask the target signal.
- **Degeneracy**: Different latent parameters or model classes produce indistinguishable observables.
- **Extrapolation dominance**: Conclusions rely on regimes beyond resolution, physical validity, or observational support.
- **Cross-probe tension**: Hidden correlations, incompatible priors, or mismatched bridge relations create false agreement or disagreement.
- **Downstream utility failure**: Field-level reconstruction or population agreement does not improve the target scientific metric.

# Validity Checks

- **Separation check**: Keep inference inputs independent from validation observables; do not calibrate and validate on the same relation.
- **Reproducibility check**: Document event definitions, selection cuts, mapping parameters, simulation versions, and random seeds so the analysis can be reconstructed.
- **Statistical check**: Propagate uncertainties, report coverage, avoid overfitting sparse regimes, and prefer simpler models when additional parameters do not improve predictive validity.
- **Boundary check**: Mark regime limits (resolution, redshift, mass, scale, tracer type) and do not extrapolate beyond them without explicit controls.
- **Cross-probe check**: Verify parameter definitions, prior compatibility, and nuisance consistency before combining heterogeneous probes.
- **Residual check**: Inspect residuals for coherent structure that indicates unmodeled systematics or missing physics.

# Provenance

Synthesized from cluster 27.0 (observable-driven evidence analysis and claim audit). Source skills: galactic-substructure-search-design, gradient-aligned-cosmology-feature-exploration, latent-field-reconstruction-research-design, cross-probe-latent-space-research, galaxy-molecular-gas-inference-workflow, galaxy-cluster-tracer-dynamics-workflow, qcd-axion-research-workflow, cosmological-merger-rate-exploration.
