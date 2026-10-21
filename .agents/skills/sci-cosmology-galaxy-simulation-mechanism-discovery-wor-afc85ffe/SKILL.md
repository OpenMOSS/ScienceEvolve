---
name: sci-cosmology-galaxy-simulation-mechanism-discovery-wor-afc85ffe
description: An end-to-end workflow for designing controlled simulation studies to discover, discriminate, and validate astrophysical mechanisms in galaxy formation and large-scale structure.
scienceevolve-title: "Galaxy, cosmology, and simulations · galaxy simulation mechanism discovery workflow"
scienceevolve-area: galaxy-cosmology-and-simulations
---

## Purpose

Help an agent turn an ambiguous observation, simulation feature, or theoretical tension into a rigorous, iterative research program. The goal is to isolate candidate mechanisms through matched numerical experiments, trace causal pathways from local physics to system-level outcomes, and bound claims by separating tested evidence from extrapolation.

## When to use

Use this skill when the user asks to:

- Propose a new research question in galaxy formation, feedback, gas cycling, radiation transport, cluster physics, or large-scale structure.
- Convert a mechanism-level gap into testable hypotheses and controlled simulation or mock-observation experiments.
- Attribute an ambiguous simulation feature to physical processes, numerical artifacts, or their interplay.
- Design robustness checks, convergence tests, and validation plans for astrophysical simulations.
- Evaluate whether a claimed mechanism is robust across resolution, environment, model choices, and observational selectors.

Do not use this skill as a general-purpose astronomy tutor, literature-review generator, production-run scheduler, or parameter-fitting executor.

## Inputs required

Before drafting a plan, ask for or infer:

- Target research question and the physical or numerical mechanism to test.
- Baseline model and alternative prescriptions.
- Available simulation framework, data products, or observational benchmarks.
- Primary observable or diagnostic that drives the inference.
- Candidate independent variables (e.g., feedback model, transport treatment, resolution, environment selection).
- Dependent variables and the proposed causal chain linking local physics to global outcomes.
- Numerical constraints: resolution, volume, sampling strategy, and convergence requirements.
- Known confounders: numerical coupling, cosmic variance, selection effects, projection biases, or source mixing.
- Intended claim type: mechanism explanation, prediction, robustness check, or methodological comparison.

## Core Workflow

1. **Frame the gap.** Define the observable tension, ambiguous feature, or systematic disagreement as a measurable output. Identify the inference bottleneck and the decision-sensitive observable.

2. **Generate competing hypotheses.** Formulate at least three explanations: a primary physical mechanism, a numerical or artifact alternative, and a mixed or compensating hypothesis. For each, state evidence strength, key assumptions, expected local and global signatures, and likely failure modes.

3. **Lock the comparison frame.** Fix initial conditions, cosmology, baseline physics, and analysis pipeline. Document every shared choice so that differences can be attributed.

4. **Design matched experiments.** Build a baseline arm and variant arms that change one mechanism class or numerical choice at a time. Include negative controls (signal expected absent), positive controls (signal expected strong), and replicate controls (independent realizations or data splits).

5. **Gate on minimal viable validation.** Run the smallest comparison that can falsify the leading hypothesis. Confirm that the independent variable changes the intended local diagnostic. **Stop and redesign** if the effect is smaller than uncertainty, if matched comparisons are not actually matched, or if the control changes multiple hidden variables.

6. **Trace the causal chain.** Analyze process histories and intermediate diagnostics before interpreting final-state metrics. Verify local mechanism behavior, then aggregate to population statistics, then evaluate system-level outcomes. Do not average away rare high-impact objects if they are central to the hypothesis.

7. **Audit numerical coupling and convergence.** Check that solver choices, resolution limits, artificial transport, or time stepping do not create or erase the apparent mechanism. Require each method to reach an internally consistent regime before attributing differences to physics.

8. **Run robustness checks.** Vary resolution, volume, sensitive parameters, analysis definitions, and post-processing choices. Test whether conclusions survive alternative estimators, aperture choices, and subsample definitions.

9. **Condition on environment and scale.** Stratify by halo mass, redshift, environment density, assembly history, or morphology. Determine whether the mechanism is universal or regime-dependent. **Split the hypothesis** if results reverse across regimes instead of forcing a universal claim.

10. **Discriminate and update.** Compare endpoint, spatial, and time-resolved diagnostics.
    - If local and global diagnostics agree, strengthen the hypothesis.
    - If they disagree, search for compensating effects or confounders.
    - If robustness checks fail, classify the result as artifact-prone or model-dependent and redesign.
    - If observational agreement improves, ask whether it is unique or caused by degeneracy with another poorly constrained parameter.

11. **Bound the claim.** Separate tested evidence from inferred mechanism and speculative extrapolation. State boundary conditions such as mass range, redshift, model family, and observable class.

12. **Iterate or stop.** Stop if the effect is smaller than uncertainty, if controls fail, if the hypothesis is falsified, or if the diagnostic cannot separate competing mechanisms. Otherwise, propose a narrower follow-up experiment targeting the most likely failure point.

## Output Format

When using this skill, return:

1. **Research question** — concise question and the mechanism-level gap it addresses.
2. **Evidence map** — what is already supported, what is inferred by analogy, and what remains untested.
3. **Hypotheses table** — for each: mechanism, expected signature, evidence strength, key assumptions, and likely failure modes.
4. **Experimental design** — baseline, variant arms, controls, independent and dependent variables, evaluation metrics, and stop conditions.
5. **Analysis plan** — causal-chain diagnostics, aggregation strategy, uncertainty quantification, robustness checks, and visualization plan.
6. **Iteration plan** — decision rules for updating, splitting, or rejecting each hypothesis under each possible outcome.
7. **Validity and claim-boundary statement** — main confounders, reproducibility needs, boundary conditions, and scope limits.

## Validation Gates

- **Attribution gate:** Was only the intended component varied in the main comparison?
- **Convergence gate:** Has each method or resolution reached a self-consistent regime for the primary observable?
- **Local-to-global gate:** Was the local mechanism validated with intermediate diagnostics before interpreting system-level outcomes?
- **Robustness gate:** Do conclusions survive resolution, volume, parameter, and analysis variations?
- **Control gate:** Did negative and positive controls behave as expected?
- **Independence gate:** Are diagnostics, environmental descriptors, and object properties defined without circular dependence?

## Claim Boundaries

- Treat agreement with observations as consistency, not proof of a single mechanism.
- Limit claims to the tested halo type, mass scale, redshift, environment, and model family.
- Do not generalize from one simulation realization, resolution, or source model to field-wide consensus.
- Clearly label paper-supported findings, analogical inferences, and agent-generated speculations.

## Failure Modes

- **Confounding:** The comparison changes more than the intended mechanism.
- **Compensation:** A secondary process masks or mimics the target mechanism.
- **Numerical artifact:** Solver choices, resolution limits, or artificial terms create the apparent signal.
- **Premature extrapolation:** Local or single-regime results are generalized without boundary testing.
- **Selection bias:** Observational filters, flux limits, or sample cuts dominate the inferred population fractions.
- **Metric degeneracy:** Different mechanisms produce the same final-state summary statistic.
- **Under-resolution:** The feature disappears or changes qualitatively with refined numerics.
- **Circular tuning:** Observational agreement is achieved by adjusting a poorly constrained parameter that is not independently validated.

## Validity Checks

Before presenting a conclusion, check:

- **Confounding:** Did the comparison change more than the intended mechanism?
- **Cosmic variance:** Could initial conditions, volume size, or rare sources drive the result?
- **Numerical validity:** Are resolution, transport approximation, time sampling, and interpolation adequate for the claimed effect?
- **Statistical validity:** Are averages appropriate for non-Gaussian, luminosity-weighted, or rare-event-dominated distributions?
- **Observational validity:** Are compared observables independent enough to avoid circular tuning?
- **Boundary conditions:** Does the mechanism depend on environment, halo mass, redshift, metallicity, or source population assumptions?
- **Reproducibility:** Are model choices, diagnostics, random seeds or realizations, and post-processing definitions documented?
- **Mechanism evidence:** Do ablations or process diagnostics show that the proposed component matters beyond generic effects?
- **Reporting bias:** Are failures, variance, and negative controls reported alongside favorable outcomes?

## Provenance

Synthesized from cluster 24, subcluster 24.0 ("observable-driven mechanism discovery and validation"). Derived from source skills: `high-redshift-reionization-exploration`, `galaxy-feedback-mechanism-exploration`, `feedback-regulated-nuclear-fueling-research`, `cosmological-simulation-code-comparison`, `galaxy-emission-line-research-workflow`, `cluster-simulation-attribution-workflow`, `cosmic-vector-alignment-exploration`. Specific numerical parameters, code versions, halo catalogs, and paper conclusions from individual sources have been abstracted to preserve reusability.
