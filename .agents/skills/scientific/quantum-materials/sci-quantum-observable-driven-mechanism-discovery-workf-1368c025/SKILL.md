---
name: sci-quantum-observable-driven-mechanism-discovery-workf-1368c025
description: A reusable end-to-end workflow for discovering and validating mechanisms from observables in domains where models are approximate, data are weakly informative, and assumptions strongly affect interpretation.
scienceevolve-title: "Quantum materials and condensed matter · observable driven mechanism discovery workflow 28"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Use this skill to design reusable end-to-end research workflows that discover and validate mechanisms from observables in domains where approximate models are used to interpret measurements. The core method is observable-driven mechanism discovery: frame the scientific bottleneck as a prediction-reliability problem, identify assumption-sensitive choices, generate falsifiable hypotheses, design controlled validation studies, and iterate until claims are bounded by evidence.

# When to use

- The user asks how to improve the reliability of predictions, simulations, or theoretical descriptions before comparing them with measurements.
- The target domain has competing model choices, approximation levels, priors, scales, closures, or calibration conventions that affect interpretation.
- The user wants to diagnose uncertainty sources and identify mechanisms rather than simply fit existing data.
- The problem involves sparse data, weakly informative observations, high-dimensional sampling, or structured outputs where scalar benchmarks may miss relevant behavior.
- The user seeks to convert a discrepancy, anomaly, or sensitivity pattern into a testable research plan.

# Inputs required

Before producing a research plan, collect or clarify:

- Target observable, measurable quantity, or prediction target.
- Baseline model or current standard approximation.
- Candidate alternative model, deviation axis, higher-fidelity pathway, or competing assumption family.
- Convention-dependent or assumption-sensitive choices that may affect interpretation.
- Independent validation data, benchmarks, or reference outputs.
- Domain region, conditioning variables, or subpopulations of interest.
- Acceptable uncertainty metrics and reporting standards.
- Safety, ethics, privacy, and compliance constraints relevant to the domain.
- Intended claim level: exploratory hypothesis, mechanism test, model improvement, benchmark validation, or decision-support validation.

# Core Workflow

1. **Frame the bottleneck.**
   Define the scientific question as a prediction-reliability or mechanism-identification problem, not merely a data-agreement problem. Identify the target observable and the decision it must support.
   - *Gate*: If the observable is not measurable or computable under identical definitions across compared models, stop and refine the target.

2. **Map assumption sensitivity.**
   Identify modeling choices, priors, approximations, or conventions that are arbitrary or weakly constrained but strongly affect interpretation. Separate parameters directly constrained by data from those driven by assumptions.
   - *Gate*: If varying plausible assumptions does not change the conclusion, standard analysis may suffice; reassess whether this workflow is needed.

3. **Generate ranked hypotheses.**
   Produce a structured hypothesis table with columns: Hypothesis, mechanistic rationale, evidence strength (High / Medium / Low / Speculative), key assumptions, likely failure modes, minimal validation, and strong controls.
   Generate in this order: bottleneck hypotheses, fidelity hypotheses, deviation or mechanism hypotheses, uncertainty hypotheses, and boundary hypotheses.
   Explicitly distinguish what is directly supported by prior evidence, what is inferred by analogy, and what remains speculative for the new system.

4. **Design minimal validation.**
   Define the smallest study that can distinguish the leading hypotheses from artifacts or baseline behavior. Specify: target quantity, baseline, candidate model/assumption family, independent/dependent/controlled variables, and a control set (positive, negative, transfer, baseline, convention-stress). Define metrics (convergence, stability, uncertainty calibration, locality, transferability) and stop conditions.

5. **Execute controlled comparison.**
   Run or emulate inference under identical definitions, data, and preprocessing across baseline and candidate conditions. Preserve structured data rather than premature averaging.
   - *Gate*: If controls fail, stop and diagnose implementation, calibration, or data-quality issues before interpreting results.

6. **Audit robustness and uncertainty.**
   Stress-test conclusions across plausible convention choices, data subsets, and boundary conditions. Decompose uncertainty sources. Check for accidental cancellation, overfitting, prior-support artifacts, and implementation errors.
   - *Gate*: If conclusions change under defensible but irrelevant details, treat them as provisional and add stronger controls.

7. **Classify and bound claims.**
   Grade each conclusion as robust, assumption-sensitive, model-supported, ambiguous, or unsupported. Map failure patterns to mechanistic assumptions. Bound claims to the tested quantity, domain region, and model ensemble.

8. **Iterate or stop.**
   Update hypotheses based on evidence:
   - If convergence and stability improve, escalate to stronger controls and broader regimes.
   - If agreement improves but stability does not, diagnose hidden tuning or confounding.
   - If uncertainty shrinks without a credible mechanism, narrow the claim or redesign the model.
   - If transfer controls fail, treat original success as setup-specific.
   - If all candidates are unstable, return to target definition or identify missing inputs.
   *Stop conditions*: candidate is less stable than baseline; agreement depends on accidental cancellation; uncertainty shrinks without credible mechanism; local discrepancies dominate without separate analysis; inputs are too uncertain to distinguish mechanisms; or the conclusion changes only near unsupported boundaries.

# Output Format

When using this skill, produce:

1. **Target research question** — one concise question framed around prediction reliability or mechanism stability.
2. **Current bottleneck** — the modeling choice, approximation gap, or uncertainty source limiting interpretation.
3. **Hypothesis table** — candidate hypotheses with evidence strength, key assumptions, likely failure modes, minimal validation, and strong controls.
4. **Validation design** — target quantity, baseline, candidate model/assumption family, controls, variables, metrics, and stop conditions.
5. **Analysis plan** — convergence, stability, shape, uncertainty, locality, and transfer checks.
6. **Iteration plan** — how results update each hypothesis and trigger continuation, revision, or stopping.
7. **Validity and ethics statement** — confounding risks, reproducibility needs, safety boundaries, and claim limits.
8. **Evidence boundary** — what is supported by prior validation, what is inferred for the new question, and what remains speculative.

# Validation Gates

- **Confounding check**: Could apparent improvement arise from changed definitions, inputs, or benchmarks rather than the candidate model?
- **Overfitting check**: Does the model improve only after tuning to validation data?
- **Uncertainty check**: Are uncertainty estimates generated consistently across all compared models or conditions?
- **Locality check**: Are conclusions driven by special regions that require separate treatment?
- **Transfer check**: Has the modeling choice been tested on a related but distinct quantity or regime?
- **Reproducibility check**: Are definitions, inputs, metrics, and comparison regions specified enough for independent replication?
- **Claim-bounding check**: Does the conclusion avoid presenting a single result as domain-wide truth?
- **Safety check**: Does the plan remain a non-operational research design rather than instructions for operating physical infrastructure?

# Claim Boundaries

- Claims are bounded to the tested observable, domain region, model ensemble, and assumption set.
- Single-study evidence is not treated as field-wide consensus.
- Assumption-sensitive findings are labeled as such, not as established facts.
- Extrapolation beyond tested regimes is framed as hypothesis, not conclusion.
- Mechanistic interpretations are distinguished from statistical artifacts, implementation errors, and calibration issues.

# Failure Modes

- The candidate model is less stable or interpretable than the baseline.
- Agreement appears to depend on accidental cancellation or tuning to validation data.
- Uncertainty shrinks without a credible mechanism or becomes misleadingly narrow.
- Local discrepancies dominate the conclusion but are not separately analyzed.
- A transfer control shows the modeling choice is not robust beyond the original setup.
- Inputs are too uncertain to distinguish candidate mechanisms.
- The conclusion changes only near unsupported prior boundaries or under unsupported assumptions.
- Posterior or residual changes are comparable to numerical uncertainty or sampling noise.
- Apparent deviations are driven by preprocessing artifacts, implementation details, or mismatched baselines.

# Validity Checks

- **Assumption coverage**: Do alternative families span plausible interpretations without becoming arbitrary?
- **Data informativeness**: Are the data strong enough to support the intended claim under any plausible assumption?
- **Prior-support artifacts**: Are changes caused by unsupported regions, boundary choices, or transformations?
- **Likelihood/implementation robustness**: Could systematic errors, calibration uncertainty, or nuisance modeling explain the sensitivity?
- **Selection effects**: Would completeness thresholds, sampling bias, or population structure change the conclusion?
- **Statistical validity**: Are uncertainties, convergence diagnostics, and comparison metrics reported transparently?
- **Model comparison fairness**: Are models evaluated in their intended domains with identical inputs and uncertainty treatment?
- **Interpretation separation**: Are established methodological patterns distinguished from agent-generated hypotheses for the new system?

# Provenance

- Derived from cluster 123 / subcluster 123.0 ("observable-driven mechanism discovery and validation").
- Synthesized from source skills: precision-collider-model-stability-research, gravitational-wave-bayesian-prior-sensitivity, gravitational-wave-parametric-deviation-testing, nuclear-beta-delayed-neutron-model-constraints, gravitational-ringdown-bayesian-mode-discovery, nuclear-charge-radius-erratum-validation, randomized-measurement-importance-sampling-exploration, quantum-teleportation-full-data-certification.
- Preserves shared workflow structure without source-specific systems, materials, parameters, or numerical results.
