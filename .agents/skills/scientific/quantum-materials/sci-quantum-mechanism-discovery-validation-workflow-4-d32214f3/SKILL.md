---
name: sci-quantum-mechanism-discovery-validation-workflow-4-d32214f3
description: A reusable end-to-end workflow for discovering and validating mechanisms in complex systems by generating layered hypotheses, designing controlled comparisons across scales, and iterating through residual-driven refinement with strict validity gates.
scienceevolve-title: "Quantum materials and condensed matter · mechanism discovery validation workflow 4"
scienceevolve-area: quantum-materials-and-condensed-matter
---

## Purpose

Help an agent design disciplined research plans that move from unexplained heterogeneity or contested relations to validated mechanistic claims. The workflow abstracts transferable steps across physical, network, and complex-system domains: structured hypothesis generation, controlled experimentation or observation, mechanism-first analysis, and iterative model discrimination bounded by explicit validity checks.

## When to use

Use this skill when the user needs to:

- Explain heterogeneous outcomes that baseline models fail to capture.
- Test whether a proposed mechanism is distinguishable from alternative explanations or from baseline flexibility.
- Design controlled studies, simulations, or observational programs comparing candidate mechanisms against strong baselines and negative controls.
- Iterate on hypotheses using residual structure, degeneracy mapping, or model-comparison metrics.
- Convert speculative theoretical ingredients into falsifiable empirical predictions with clear validity domains.

Do not use this skill for routine parameter estimation when no alternative mechanism is being tested, for operational lab recipes or hazardous protocols, or as a substitute for domain-specific statistical pipelines or formal collaboration review.

## Inputs required

Before executing the workflow, identify or request:

- **Target phenomenon:** the empirical contrast, unexplained heterogeneity, or contested relation to be investigated.
- **Baseline model:** the accepted reference framework and its known assumptions.
- **Candidate mechanism(s):** theoretically motivated alternatives and their predicted signatures.
- **Available resources:** datasets, simulation capabilities, computational budget, and public catalogs or tools.
- **Confounders and systematics:** nuisance effects, selection biases, measurement uncertainties, and environmental variables that could mimic the signature.
- **Validity domain:** scale, energy, coupling, interaction-order, or regime limits where the candidate framework is expected to be reliable.
- **Evaluation criteria:** whether the goal is discovery, exclusion, model comparison, degeneracy diagnosis, or experimental prioritization.

If inputs are missing, state explicit assumptions, mark resulting hypotheses as lower evidence strength, and propose the minimal information needed to upgrade them.

## Core Workflow

Execute the following ordered route. Treat each gate as a hard stop or redesign trigger until the condition is satisfied.

1. **Scope the gap.** Define the empirical contrast or unexplained heterogeneity. Identify exactly what the baseline model fails to explain and why the gap matters.
   - *Gate:* Is the gap observable and falsifiable? If not, stop and refine the research question.

2. **Layer hypotheses.** Generate hypotheses at four levels: (i) relation/phenomenological, (ii) mechanism, (iii) diagnostic, and (iv) boundary. For each, assign evidence strength, key assumptions, and failure modes.
   - *Gate:* Does every mechanism hypothesis have at least one independent diagnostic that can fail separately from the main fit? If not, redesign before proceeding.

3. **Architect controls.** Design a minimal viable validation with: a canonical baseline, a complexity-matched baseline, negative controls, positive controls, and systematics controls. Define independent variables, dependent variables, and stopping conditions.
   - *Gate:* Can the candidate mechanism be isolated from confounders and baseline flexibility? If not, redesign the study before execution.

4. **Execute with quality control.** Run simulations, ingest observations, or generate synthetic data. Verify numerical convergence, calibration, coverage, and completeness before any physics or mechanism interpretation.
   - *Gate:* Do resolution, convergence, and coverage checks pass? If not, halt and fix infrastructure.

5. **Perform mechanism-first analysis.** Compute diagnostics tied directly to the hypothesized mechanism. Inspect residuals for systematic structure. Decompose outcomes by scale, stage, or interaction order. Keep numerical, physical, and statistical claims separate.
   - *Gate:* Are key diagnostics stable under nuisance variation and robustness checks? If not, treat results as inconclusive.

6. **Discriminate models.** Compare the candidate against baselines using common data and consistent nuisance treatment. Evaluate fit quality, residual structure, and model-comparison metrics. Map degeneracies explicitly.
   - *Gate:* Is the candidate distinguishable from the complexity-matched baseline? If models are confused, proceed to discriminant design rather than claiming support.

7. **Iterate or terminate.** Update the research direction based on outcomes:
   - *Discriminated:* Refine the mechanism, test boundary conditions, and propose sharper tests.
   - *Confused:* Identify the degeneracy direction and propose new observables, channels, variables, or data combinations that break it.
   - *Excluded:* Narrow the model class or reject the hypothesis; document the excluded regime and remaining loopholes.
   - *Artifact-prone:* Repair the pipeline and rerun controls.
   - *Stop conditions:* The signal disappears under reasonable nuisance variation; models are indistinguishable with available observables; the result depends on an unverified numerical artifact; or no next discriminant can be identified.

8. **Bound claims.** Restrict conclusions to the validated domain. Separate empirical-model support from physical-theory proof. State the assumptions that would reverse the conclusion.
   - *Gate:* Are claims scoped to the tested regime and explicitly conditional on documented assumptions? If not, revise the conclusion text before output.

## Output Format

Return a structured research plan containing:

1. **Research question:** one concise sentence and its validity domain.
2. **Gap diagnosis:** what is unknown, disputed, or under-tested.
3. **Layered hypotheses table:** relation-level, mechanism-level, diagnostic, and boundary hypotheses with evidence strength, key assumptions, and failure modes.
4. **Experimental design:** minimal viable validation, baselines, controls, variables, metrics, and stopping conditions.
5. **Analysis plan:** quality control, diagnostic decomposition, model comparison, residual inspection, and uncertainty handling.
6. **Iteration plan:** rules for updating, narrowing, or rejecting hypotheses based on possible outcomes.
7. **Validity and ethics statement:** numerical, statistical, model-dependence, reproducibility, and non-overclaiming boundaries.

## Validation Gates

The workflow enforces these critical gates:

- **Falsifiability Gate (Step 1):** The research question must admit a result that weakens or rejects the candidate mechanism.
- **Diagnostic Independence Gate (Step 2):** Every mechanism hypothesis must carry at least one diagnostic observable that can fail independently of the main fit.
- **Identifiability Gate (Step 3):** The study design must be able to separate the candidate mechanism from confounders and from baseline flexibility.
- **Convergence/Quality Gate (Step 4):** Numerical and data-quality checks must pass before interpreting physics or mechanisms.
- **Robustness Gate (Step 5):** Key diagnostics must remain stable under reasonable nuisance variation and alternative preprocessing.
- **Discrimination Gate (Step 6):** The candidate must be distinguishable from a complexity-matched baseline; confusion triggers discriminant redesign, not conclusion.
- **Boundary Gate (Step 8):** Final claims must be explicitly limited to the validated domain and separated from underlying-theory proof.

## Claim Boundaries

- Claims are limited to the tested model class, data domain, and simulation or observational regime.
- Distinguish empirical-model support from proof of an underlying physical theory.
- Do not extrapolate beyond validated parameter space, scale cuts, interaction-order definitions, or environmental conditions.
- Single-study or single-simulation results must not be presented as field-wide consensus.
- Treat inconclusive or weak-excess results as prompts for systematic review and stronger controls, not as evidence.

## Failure Modes

- **Gap definition failure:** The phenomenon is phenomenological without a falsifiable mechanistic pathway.
- **Diagnostic failure:** Hypotheses lack independent diagnostics, relying solely on fit quality or best-fit parameters.
- **Control failure:** Controls fail to isolate the candidate mechanism from mean-field, baseline, or flexibility-matched effects.
- **Numerical artifact:** Resolution limits, finite-size effects, convergence failures, or simulation artifacts are mistaken for physical signals.
- **Undetected degeneracy:** Confounding or parameter degeneracy is overlooked due to insufficient baselines or nuisance variation.
- **Residual neglect:** Systematic residual structure is ignored in favor of aggregate fit statistics.
- **Overfitting:** Limited parameter coverage or dataset-specific features are mistaken for general mechanism validation.
- **Over-interpretation:** Inconclusive, confused, or systematics-dominated results are presented as discovery or exclusion.

## Validity Checks

Before finalizing any conclusion, verify:

- **Numerical validity:** Key diagnostics converge; small-scale features are not artifacts of resolution or boundary choices.
- **Baseline fairness:** Comparisons include both a canonical baseline and a complexity-matched baseline.
- **Selection validity:** Incompatible regimes or populations are not pooled without justification.
- **Statistical validity:** Uncertainty includes sample variance, fitting choices, and numerical variation; residuals are inspected for systematic structure.
- **Nuisance robustness:** Conclusions survive reasonable variation of systematics, priors, and preprocessing choices.
- **Reproducibility:** Inputs, selection criteria, model definitions, analysis scripts, seeds, and data versions are documented.
- **Model-dependence:** Conclusions distinguish candidate-specific mechanisms from generic behavior of the baseline framework.
- **Extrapolation boundary:** Claims are scoped to the simulated, observed, or analytically validated regime.

## Provenance

- Synthesized from cluster 222, subcluster 222.0 ("end-to-end mechanism discovery and validation").
- Informed by source skills: fuzzy-dark-matter-simulation-research; holographic-cosmology-observational-model-discrimination; neutrino-cp-nsi-research-pattern; tidal-sidm-subhalo-research-workflow; motif-latent-dynamics-research; dark-matter-substructure-kinematic-inference; higher-order-network-contagion-exploration; binary-choice-heterogeneity-exploration.
- No source-specific numerical parameters, operational protocols, or paper conclusions are embedded in the reusable workflow body.
