---
name: sci-quantum-observable-driven-mechanism-discovery-workf-6fbfcdeb
description: A reusable end-to-end workflow for discovering and validating physical mechanisms from observable anomalies in complex systems through hypothesis generation, controlled validation, and iterative claim bounding.
scienceevolve-title: "Quantum materials and condensed matter · observable driven mechanism discovery workflow 2"
scienceevolve-area: quantum-materials-and-condensed-matter
---

# Purpose

Guide agents in designing rigorous, transferable research plans that move from an observable anomaly to a validated mechanism claim. The skill provides a domain-agnostic route for framing gaps, generating competing hypotheses, designing minimal controlled validation, discriminating mechanisms through analysis, and bounding conclusions without overgeneralizing from limited evidence.

# When to use

Use this skill when:
- the user asks to explain an anomalous transport, response, kinetic, or structural observable;
- the task is to discover which microscopic or local mechanism drives a macroscopic change;
- the user needs a validation plan that discriminates among competing mechanisms using controls and independent observables;
- the problem requires iterating between theory, simulation, and experiment to test and refine hypotheses;
- the goal includes bounding claims, quantifying uncertainty, and defining validity domains.

Do not use this skill as a general-purpose domain tutor, a source of field-wide consensus, or a provider of operational experimental protocols, fabrication recipes, or safety-critical engineering decisions.

# Inputs required

Before generating a research plan, collect or infer:

- target system class and relevant degrees of freedom;
- observable anomaly or unexplained trend that motivates the study;
- known limiting regimes (e.g., ordered/disordered, localized/extended, pre/post transition, weak/strong coupling);
- candidate mechanisms and plausible competing alternatives;
- available perturbation channels and measurable response observables;
- baseline or reference conditions for normalization;
- constraints on resolution, cost, computational budget, safety, or sampling density;
- prior models, their assumptions, and documented validity boundaries;
- independent benchmarks or literature contexts to distinguish established facts from new hypotheses.

If any input is missing, state the assumption explicitly and mark dependent conclusions as lower confidence.

# Core Workflow

1. **Anomaly Framing & Gap Identification**
   - Define the observable anomaly and locate the explanatory gap in current models.
   - Identify limiting regimes that bracket the phenomenon.
   - **Decision Gate A:** Is the anomaly reproducible across independent realizations or calibrations, and is it distinguishable from noise, drift, or measurement artifacts?
     - *If no:* Stop. Refine the observation protocol, calibration, or detection threshold before proceeding.

2. **Competing Hypothesis Generation**
   - Propose at least three mechanism hypotheses that could explain the anomaly, including an artifact or confounding hypothesis as a mandatory competitor.
   - For each hypothesis specify: predicted signature, key assumptions, evidence strength (strong / moderate / weak / speculative), and a concrete falsifying observation.
   - **Decision Gate B:** Are the leading hypotheses falsifiable with the available observables, perturbations, and resource constraints?
     - *If no:* Redefine the scope, seek additional observables, or reformulate hypotheses.

3. **Minimal Validation Design**
   - Establish a baseline/reference condition.
   - Define the perturbation intended to isolate the suspected mechanism.
   - Specify positive controls (cases where the mechanism should appear), negative controls (where it should be absent), and method controls (independent measurement or analysis routes).
   - Choose primary and secondary observables that discriminate among the top hypotheses.
   - Pre-register stop conditions, such as: effect size falls below combined uncertainty, confounders dominate the signal, controls fail, or the design cannot separate the leading hypotheses.
   - **Decision Gate C:** Can the planned contrasts and observables discriminate the leading hypothesis from its closest competitor?
     - *If no:* Redesign contrasts, add orthogonal perturbations, or strengthen controls before execution.

4. **Controlled Execution & Data Collection**
   - Collect data across baseline, perturbed, and control conditions.
   - Record calibration, boundary conditions, and uncertainty budgets at the metadata level.
   - Maintain reproducibility logs, including disorder realizations, sample conditions, model versions, or analysis thresholds.

5. **Analysis & Mechanism Decomposition**
   - Separate signal channels (e.g., coherent versus diffuse, static versus dynamic, local versus spatially averaged) before combining them into derived quantities.
   - Normalize responses against baseline or reference conditions to reduce common-mode uncertainty.
   - Decompose the anomaly into candidate contributions (e.g., barrier change, population shift, instability, dwell-time modification, or coupling change).
   - Test robustness across realizations, model assumptions, boundary treatments, and analysis choices.
   - Quantify uncertainty propagation from raw data through fitted parameters to mechanism claims.

6. **Evidence Evaluation & Mechanism Discrimination**
   - Compare observed signatures against each hypothesis prediction.
   - Update evidence strength labels based on control behavior and consistency across independent observables.
   - **Decision Gate D:** Does one hypothesis dominate with consistent support from primary and secondary observables, while competing hypotheses fail controls or predict incompatible signatures?
     - *If yes:* Proceed to Claim Bounding.
     - *If no:* Proceed to Iteration or Redesign.

7. **Iteration or Redesign**
   - Identify the weakest evidence layer (e.g., benchmark agreement, local-state population, barrier contrast, control consistency, statistical power).
   - Design the smallest additional test, control, or analysis that would change the evidence assessment.
   - Options: refine model assumptions, add orthogonal controls, increase statistical sampling, or reformulate the mechanism.
   - **Stop Condition:** If after iterative refinement the anomaly remains indistinguishable from artifacts, or if a simpler alternative explains the data equally well, stop and report residual ambiguity. Do not escalate claims.

8. **Claim Bounding & Finalization**
   - Classify conclusions as directly tested, model-inferred, analogy-supported, or speculative.
   - State the validity domain: tested parameter ranges, system classes, model assumptions, and regime boundaries.
   - Define extrapolation limits and conditions under which the mechanism is expected to fail or become non-identifiable.
   - Archive the evidence ledger, failed hypotheses, and control outcomes for future cycles.

# Output Format

When using this skill, produce:

1. **Research question and anomaly framing** — concise statement of the observable gap and system class.
2. **Competing mechanism hypotheses** — table or list with predicted signature, key assumptions, evidence strength, and falsifying observation for each.
3. **Minimal validation design** — baseline, perturbation, controls, primary/secondary observables, variables, metrics, and pre-registered stop conditions.
4. **Analysis plan** — signal separation strategy, normalization approach, mechanism decomposition layers, robustness checks, and uncertainty propagation.
5. **Iteration log** — record of Decision Gates A–D, evidence updates, redesigns, and stop decisions.
6. **Claim boundary statement** — classification of conclusions by evidence tier, validity domain, extrapolation boundaries, and residual risks.

# Validation Gates

- **Reproducibility Gate:** The anomaly is observed across multiple independent realizations, samples, or simulation conditions.
- **Control Gate:** Positive and negative controls behave as expected; method controls show agreement within tolerance.
- **Discrimination Gate:** The primary observable distinguishes the leading hypothesis from the closest competitor under matched conditions.
- **Robustness Gate:** The conclusion holds when varying reasonable assumptions, boundary treatments, or analysis thresholds.
- **Consistency Gate:** Independent observables or analysis routes converge on the same mechanism without ad hoc parameter adjustments.
- **Uncertainty Gate:** Systematic and statistical uncertainties are propagated and reported; claims are avoided when uncertainty dominates.

# Claim Boundaries

- Distinguish directly tested results from model-inferred predictions, analogy-based extensions, and speculative hypotheses.
- Limit claims to the tested control-parameter ranges, system classes, and model assumptions.
- Flag any extrapolation beyond the validated domain as requiring additional evidence.
- Do not present single-study or single-model findings as field consensus.
- Clearly mark conclusions that depend on unverified mappings between representation and target system.

# Failure Modes

- The anomaly is an artifact of calibration drift, boundary conditions, detector response, or environmental noise.
- Two or more mechanisms produce degenerate observable signatures that cannot be separated with current contrasts.
- Control variables cannot be varied independently, confounding cause and effect.
- Finite-size, non-equilibrium, heterogeneity, or disorder effects dominate the target signal.
- Model assumptions are violated in the tested regime, invalidating the mechanism interpretation.
- Statistical power is insufficient, or systematic uncertainty is larger than the predicted effect size.
- A simpler alternative (e.g., baseline trend, linear response, or known background) explains the data equally well.

# Validity Checks

Before finalizing a research plan or presenting conclusions, verify:

- **Confounding control:** Noise, loss, boundaries, heterogeneity, and measurement artifacts are bounded or tested.
- **Statistical validity:** Uncertainty is propagated, overfitting is avoided, and threshold choices are transparent.
- **Mechanistic specificity:** The explanation identifies a specific mechanism rather than restating the raw data trend.
- **Mapping validity:** The model representation and its assumptions remain valid in the target regime.
- **Reproducibility:** Independent methods, realizations, or datasets can challenge the conclusion.
- **Extrapolation validity:** Claims do not exceed the tested domain in parameter space, system class, or model fidelity.
- **Evidence separation:** Directly tested, inferred, and speculative statements are clearly labeled.

# Provenance

Synthesized from cluster 6 / subcluster 6.0 (observable-driven mechanism discovery and validation). Derived from source skills: disordered-bose-vortex-exploration, transition-coupled-transport-research, crack-tip-local-transition-agent, magnetic-criticality-response-skill, magnetic-local-state-diffusion-design, resonant-wave-transport-exploration, liquid-alloy-thermodiffusion-exploration, nuclear-astrophysics-bottleneck-inference-skill.
